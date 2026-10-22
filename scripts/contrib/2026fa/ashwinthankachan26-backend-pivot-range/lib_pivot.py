"""lib_pivot.py — pure functions for the backend-pivot-range mode (stdlib only).

Every value a function returns carries one of three labels:
  record          copied from a source file without change
  model-judgment  a rule applied to records (no LLM is called anywhere here)
  your-input      a human decision taken from config.json
"""
import csv
import html
import math
import re
from datetime import date, datetime
from html.parser import HTMLParser

SRC = {'record': 'record', 'model': 'model-judgment', 'input': 'your-input'}

# The nine O*NET Level ("LV") ratings averaged into cognitive_pivot_score by the
# repo's own extract (scripts/bls/extract-soc-occupation-table.py, cognitive_pivot_score()).
PIVOT_ELEMENTS = [
    ('ability', 'Originality'), ('ability', 'Problem Sensitivity'),
    ('ability', 'Deductive Reasoning'), ('ability', 'Inductive Reasoning'),
    ('skill', 'Critical Thinking'), ('skill', 'Judgment and Decision Making'),
    ('skill', 'Complex Problem Solving'), ('skill', 'Systems Analysis'),
    ('skill', 'Systems Evaluation'),
]
PIVOT_NAMES = [name for _, name in PIVOT_ELEMENTS]


class Refusal(Exception):
    """A stop condition: the caller exits 2 and writes nothing."""


# ── loading ──────────────────────────────────────────────────────────────────
def _num(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else None


def load_elements(path):
    """{onet_soc_code: {element_name: {value, n, se, date, suppress, domain_source}}}"""
    out = {}
    with open(path, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            out.setdefault(r['onet_soc_code'], {})[r['element']] = {
                'value': _num(r['value']), 'n': r['n'], 'se': _num(r['se']),
                'date': r['date'], 'suppress': r['suppress'], 'domain_source': r['domain_source'],
            }
    return out


def load_title_index(path):
    """{lower-case title: set(onet_soc_code)} from O*NET's alternate and reported titles."""
    idx = {}
    with open(path, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            idx.setdefault(r['title'].strip().lower(), set()).add(r['onet_soc_code'])
    return idx


def load_compact(path):
    with open(path, newline='', encoding='utf-8') as f:
        return {r['onet_soc_code']: r for r in csv.DictReader(f)}


def parse_audit_hashes(audit_md):
    """{basename: sha256} from the table in data/bls/BLS-audit.md."""
    pat = re.compile(r'\|\s*`(?:[^`]*/)?([^`/]+)`\s*\|\s*`([0-9a-f]{64})`\s*\|')
    return {m.group(1): m.group(2) for m in pat.finditer(audit_md)}


# ── the pivot score, recomputed, with its measurement error ─────────────────
def pivot_stats(elements):
    """Mean of the nine ratings and its standard error. Refuses a partial average."""
    if not elements:
        return {'status': 'missing', 'value': None, 'se': None, 'n_elements': 0,
                'source': SRC['record'], 'basis': 'no O*NET ratings for this occupation'}
    present = {k: v for k, v in elements.items()
               if k in PIVOT_NAMES and v['value'] is not None and v['suppress'] != 'Y'}
    dates = sorted({v['date'] for v in present.values()}, key=_month_key)
    base = {'n_elements': len(present), 'dates': dates,
            'raters': sorted({v['n'] for v in present.values()}),
            'domain_source': sorted({v['domain_source'] for v in present.values()})}
    if len(present) < len(PIVOT_NAMES):
        missing = [n for n in PIVOT_NAMES if n not in present]
        return {**base, 'status': 'incomplete', 'value': None, 'se': None, 'missing': missing,
                'source': SRC['record'],
                'basis': f'{len(present)} of 9 ratings present (missing: {", ".join(missing)}); a partial average is not comparable, so no score'}
    vals = [present[n]['value'] for n in PIVOT_NAMES]
    ses = [present[n]['se'] for n in PIVOT_NAMES]
    se = math.sqrt(sum(s * s for s in ses)) / len(ses) if all(s is not None for s in ses) else None
    # v0.1.4 (TODO #5): the other extreme, fully correlated rating errors → SE of the mean = mean SE
    se_corr = sum(ses) / len(ses) if all(s is not None for s in ses) else None
    return {**base, 'status': 'scored', 'value': sum(vals) / len(vals), 'se': se, 'se_correlated': se_corr,
            'source': SRC['record'], 'se_source': SRC['model'],
            'basis': 'mean of the nine O*NET LV ratings (record); standard error = sqrt(sum SE^2)/9, assuming independent rating errors (model-judgment)'}


def _month_key(mmyyyy):
    try:
        m, y = mmyyyy.split('/')
        return int(y) * 12 + int(m)
    except (AttributeError, ValueError):
        return 0


def years_apart(a, b):
    return abs(_month_key(a) - _month_key(b)) / 12


def compare(cand, anchor, z):
    """Is the candidate's pivot score distinguishable from the anchor's?"""
    if cand['status'] != 'scored' or anchor['status'] != 'scored' or cand['se'] is None or anchor['se'] is None:
        return None
    delta = cand['value'] - anchor['value']
    se_diff = math.sqrt(cand['se'] ** 2 + anchor['se'] ** 2)
    zscore = delta / se_diff if se_diff > 0 else (0.0 if delta == 0 else math.copysign(math.inf, delta))
    band = 'above' if zscore > z else 'below' if zscore < -z else 'indistinguishable'
    out = {'delta': delta, 'se_diff': se_diff, 'z': zscore, 'band': band, 'source': SRC['model'],
           'basis': f'|z| > {z} (your-input) counts as a real difference; z = delta / sqrt(SE_a^2 + SE_b^2), independent rating errors'}
    # v0.1.4 (TODO #5): the same test with fully correlated errors; a difference is "real under both" only if both agree.
    # Routing still uses the independent-error band (stated in the report).
    sc, sa = cand.get('se_correlated'), anchor.get('se_correlated')
    if sc is not None and sa is not None:
        sdc = math.sqrt(sc ** 2 + sa ** 2)
        zc = delta / sdc if sdc > 0 else (0.0 if delta == 0 else math.copysign(math.inf, delta))
        out['z_correlated'] = zc
        out['band_correlated'] = 'above' if zc > z else 'below' if zc < -z else 'indistinguishable'
        out['real_under_both'] = band != 'indistinguishable' and out['band_correlated'] == band
    return out


def range_band(bands):
    bands = ['indistinguishable' if b == 'anchor' else b for b in bands]
    if not bands:
        return None
    return bands[0] if len(set(bands)) == 1 else 'mixed'


# ── job title → candidate O*NET occupations ──────────────────────────────────
def title_variants(title, norm):
    # v0.1.1: periods become spaces first, so "Sr." is removed like "sr" (run 1 left ". software engineer")
    t = re.sub(r'\([^)]*\)', ' ', str(title).lower()).replace('.', ' ')
    levels = sorted(norm['level_words'], key=len, reverse=True)
    level_re = re.compile(r'\b(' + '|'.join(re.escape(w) for w in levels) + r')\b')

    def clean(s):
        s = level_re.sub(' ', s)
        s = re.sub(r'[,|/–-]+\s*$', '', re.sub(r'\s+', ' ', s)).strip(' ,-–|/')
        return re.sub(r'\s+', ' ', s).strip()

    head = t
    for tok in norm['split_on']:
        head = head.split(tok)[0]
    out = []
    for v in (clean(t), clean(head)):
        if v and v not in out:
            out.append(v)
    return out


def lookup_occupations(title, index, cfg):
    prefixes = tuple(cfg['scope']['soc_prefixes'])
    variants = title_variants(title, cfg['title_normalization'])
    pins = cfg.get('pins', {}).get('by_title', {})
    for v in variants:
        if v in pins:
            pin = pins[v]
            if pin.get('out_of_target'):   # v0.1.3: a human's reasoned "not a role I'm targeting"
                if not pin.get('reason'):
                    raise Refusal(f'out-of-target pin for "{v}" needs a reason')
                return {'method': 'out-of-target', 'title_tried': variants, 'matched_title': v,
                        'in_scope': [], 'ignored_out_of_scope': [], 'source': SRC['input'],
                        'basis': f'marked outside my target by a human: {pin["reason"]}'}
            if not pin.get('onet_soc_code') or not pin.get('reason'):
                raise Refusal(f'pin for "{v}" needs both onet_soc_code and a reason')
            return {'method': 'pinned', 'title_tried': variants, 'matched_title': v,
                    'in_scope': [pin['onet_soc_code']], 'ignored_out_of_scope': [],
                    'source': SRC['input'], 'basis': f'pinned by a human: {pin["reason"]}'}
    ignored = set()
    for v in variants:
        codes = index.get(v, set())
        ins = sorted(c for c in codes if c.startswith(prefixes))
        ignored |= {c for c in codes if not c.startswith(prefixes)}
        if ins:
            # v0.1.5: a record only when the posting's own title is the O*NET title; reaching it by
            # removing level words or qualifiers is my rule (review 2026-10-21)
            normalized = v != re.sub(r'\s+', ' ', str(title).lower()).strip()
            return {'method': 'onet-exact', 'title_tried': variants, 'matched_title': v, 'normalized': normalized,
                    'in_scope': ins, 'ignored_out_of_scope': sorted(ignored),
                    'source': SRC['model'] if normalized else SRC['record'],
                    'basis': (f'"{v}" is in O*NET\'s title lists for these occupations (record); the posting title reached it '
                              'through my normalization rule (level words / qualifiers removed)') if normalized else
                             f'"{v}" appears in O*NET\'s alternate/reported title lists for these occupations'}
    # v0.1.1: qualifier words ("java", "l5", "distinguished") block an exact match; use the longest
    # in-scope O*NET title of 2+ words contained whole in the cleaned title. A rule, so model-judgment.
    for v in variants:
        best, best_len = [], 0
        for t, codes in index.items():
            n = len(t.split())
            if n < 2 or n < best_len or not any(c.startswith(prefixes) for c in codes):
                continue
            if re.search(r'(?<![\w-])' + re.escape(t) + r'(?![\w-])', v):
                if n > best_len:
                    best, best_len = [t], n
                elif n == best_len:
                    best.append(t)
        if best:
            codes = {c for t in best for c in index[t]}
            ins = sorted(c for c in codes if c.startswith(prefixes))
            ignored |= {c for c in codes if not c.startswith(prefixes)}
            return {'method': 'onet-contained', 'title_tried': variants, 'matched_title': ' | '.join(sorted(best)),
                    'in_scope': ins, 'ignored_out_of_scope': sorted(ignored), 'source': SRC['model'],
                    'basis': f'no exact match; the longest O*NET title(s) contained in "{v}" (rule on the O*NET title lists)'}
    low = str(title).lower()
    for rule in cfg['families']['rules']:
        if re.search(rule['title_re'], low):
            ins = sorted({c for t in rule['canonical_titles'] for c in index.get(t, set()) if c.startswith(prefixes)})
            if ins:
                return {'method': 'family-fallback', 'title_tried': variants, 'family': rule['family'],
                        'canonical_titles': rule['canonical_titles'], 'in_scope': ins,
                        'ignored_out_of_scope': sorted(ignored), 'source': SRC['input'],
                        'basis': f'no exact O*NET title match; family "{rule["family"]}" (my rule) → its canonical titles looked up in O*NET'}
    return {'method': 'none', 'title_tried': variants, 'in_scope': [], 'ignored_out_of_scope': sorted(ignored),
            'source': SRC['record'], 'basis': 'no O*NET title list has this title in scope, and no family rule matched'}


# ── the posting's own text ────────────────────────────────────────────────────
def duties_section(text, cfg):
    """The lines under the responsibilities header, or None if no such header is found."""
    lines = [l.strip() for l in str(text or '').split('\n')]
    start = re.compile(cfg['section_start_re'], re.I)
    end = re.compile(cfg['section_end_re'], re.I)

    def header(l):   # a short line, not a sentence
        return 0 < len(l.split()) <= 8 and not l.endswith('.')

    # v0.1.1: a header naming responsibilities / requirements in any form counts (Toast's
    # "About this roll* (Responsibilities)" was missed in run 1)
    s_idx = next((i for i, l in enumerate(lines) if header(l) and (start.search(l) or re.search(r'responsibilit', l, re.I))), None)
    if s_idx is None:
        return None
    e_idx = next((i for i in range(s_idx + 1, len(lines))
                  if header(lines[i]) and (end.search(lines[i]) or re.search(r'requirement|qualification', lines[i], re.I))), len(lines))
    return lines[s_idx + 1:e_idx]


def posting_signal(text, cfg):
    if not str(text or '').strip():
        return {'status': 'not-read', 'reading': 'not-read', 'section_found': False, 'judgment': None,
                'routine': None, 'judgment_share': None, 'judgment_quotes': [], 'routine_quotes': [],
                'source': SRC['model'], 'basis': 'no posting text was available; this is unknown, not zero'}
    section = duties_section(text, cfg)
    if section is None:
        # v0.1.1: never fall back to the whole posting (requirements, benefits, company blurb)
        return {'status': 'read', 'reading': 'section-not-found', 'section_found': False, 'judgment': None,
                'routine': None, 'judgment_share': None, 'judgment_quotes': [], 'routine_quotes': [],
                'source': SRC['model'], 'basis': 'no responsibilities header recognised; the duties were not read (unknown, not zero)'}
    found = True
    jre = [re.compile(p, re.I) for p in cfg['judgment_re']]
    rre = [re.compile(p, re.I) for p in cfg['routine_re']]
    jq, rq = [], []
    for line in section:
        for sent in re.split(r'(?<=[.!?])\s+', line):
            sent = sent.strip(' •·-*\t')
            if len(sent.split()) < 2:
                continue
            if any(p.search(sent) for p in jre):
                jq.append(sent)
            elif any(p.search(sent) for p in rre):
                rq.append(sent)
    n = len(jq) + len(rq)
    if n < cfg['min_sentences']:
        share, reading = None, 'too-few-signals'
    else:
        share = len(jq) / n
        reading = 'judgment-heavy' if share >= cfg['judgment_share_for_heavy'] else 'routine-leaning'
    return {'status': 'read', 'section_found': found, 'judgment': len(jq), 'routine': len(rq),
            'judgment_share': share, 'reading': reading, 'judgment_quotes': jq[:5], 'routine_quotes': rq[:5],
            'source': SRC['model'],
            'basis': 'phrase lists (your-input) applied to the responsibilities section; each quote is the posting\'s own sentence (record)'}


def signal_health(readings):
    """v0.1.2: does the duties reading separate postings at all in this batch?
    The simplest rule there is (no threshold to tune): it discriminates only if at least
    one readable posting falls in each class. Reported; it does not change any route."""
    jh = sum(1 for r in readings if r == 'judgment-heavy')
    rl = sum(1 for r in readings if r == 'routine-leaning')
    read = jh + rl
    disc = None if read == 0 else (jh > 0 and rl > 0)
    if disc is None:
        basis = 'no posting\'s duties could be classified'
    elif disc:
        basis = f'{jh} judgment-heavy and {rl} routine-leaning of {read} classified postings'
    else:
        basis = (f'all {read} classified postings fell in one class ({jh} judgment-heavy, {rl} routine-leaning); '
                 'in this batch the duties reading separates nothing, so the tool refuses to prioritize or flag routine on it (v0.1.5)')
    return {'read': read, 'judgment_heavy': jh, 'routine_leaning': rl, 'discriminating': disc,
            'source': SRC['model'], 'basis': basis}


# ── liveness: a gate, not a vote ──────────────────────────────────────────────
def parse_ats_liveness(text):
    """{url: active|expired|uncertain} from saved `npm run ats:liveness` output."""
    pat = re.compile(r'^\S+\s+(active|expired|uncertain)\s+(https?://\S+)', re.M)
    return {m.group(2): m.group(1) for m in pat.finditer(text)}


def liveness_gate(fetched_at, today, max_age_days, ats_result=None):
    if ats_result:
        factor = {'active': 1, 'expired': 0}.get(ats_result)
        return {'result': ats_result, 'factor': factor, 'source': SRC['record'], 'method': 'npm run ats:liveness',
                'basis': 'the repo\'s liveness checker on the live page'}
    fetched = datetime.strptime(fetched_at[:10], '%Y-%m-%d').date()
    age = (parse_day(today) - fetched).days
    if age > max_age_days:
        return {'result': 'stale', 'factor': None, 'age_days': age, 'source': SRC['record'], 'method': 'board-api listing',
                'basis': f'listed on the board API {age} days ago; older than {max_age_days} days (your-input), so re-check'}
    return {'result': 'listed', 'factor': 1, 'age_days': age, 'source': SRC['record'], 'method': 'board-api listing',
            'basis': f'listed on the board API at {fetched_at}'}


def parse_day(s):
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        raise Refusal(f'"{s}" is not a real YYYY-MM-DD date')


# ── next action: a suggestion; the person decides at G5 ──────────────────────
def next_action(liveness_result, band, reading, out_of_target=False, signal_discriminating=True):
    if liveness_result == 'expired':
        a, why = 'SKIP', 'the posting is closed'
    elif out_of_target:
        a, why = 'OUT-OF-TARGET', 'a human marked this title as outside the target role (pin with a reason)'
    elif liveness_result in ('stale', 'uncertain'):
        a, why = 'CHECK-LIVENESS', 'open status not confirmed recently; run npm run ats:liveness on it'
    elif band is None:
        a, why = 'RESEARCH-SOC', 'no scored O*NET occupation for this title; assign one by hand before comparing'
    elif band == 'mixed':
        a, why = 'PIN-SOC', 'the title\'s candidate occupations disagree about the anchor; pin one (with a reason) at G2'
    elif not signal_discriminating and reading in ('judgment-heavy', 'routine-leaning'):
        # v0.1.5 (Ashwin's decision, 2026-10-21): never rank on a duties reading that separates nothing
        a, why = 'STANDARD', 'the duties reading separates nothing in this batch (signal check), so the tool refuses to prioritize or flag routine on it'
    elif band in ('above', 'indistinguishable') and reading == 'judgment-heavy':
        a, why = 'PRIORITIZE', 'occupation at or above my anchor, and the posting\'s own duties read judgment-heavy'
    elif band == 'below' and reading == 'routine-leaning':
        a, why = 'NOTE-ROUTINE', 'occupation scores distinguishably below my anchor and the duties read routine; a note, not a skip'
    else:
        a, why = 'STANDARD', 'no strong signal either way from the occupation or the posting'
    return {'action': a, 'why': why, 'source': SRC['model']}


# ── fetch helpers ─────────────────────────────────────────────────────────────
def redact(text):
    text = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email removed]', str(text or ''))
    return re.sub(r'(\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}', '[phone removed]', text)


class _Text(HTMLParser):
    BLOCK = {'p', 'div', 'br', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'section'}

    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCK:
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in self.BLOCK:
            self.parts.append('\n')

    def handle_data(self, data):
        self.parts.append(data)


def html_to_text(raw):
    p = _Text()
    p.feed(html.unescape(str(raw or '')))
    text = ''.join(p.parts).replace('\xa0', ' ')
    return '\n'.join(l.strip() for l in text.split('\n') if l.strip())
