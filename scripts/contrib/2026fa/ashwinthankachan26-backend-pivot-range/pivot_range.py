#!/usr/bin/env python3
"""pivot_range.py — backend-pivot-range: is this backend-adjacent posting
judgment-heavy work, and how sure can the O*NET data be?

For each saved posting: job title → candidate O*NET occupations (exact title
lists, else my family rule, else a human pin) → each occupation's
cognitive_pivot_score recomputed from its nine ratings, with a standard error →
compared with my anchor (15-1252.00 Software Developers) → the posting's own
responsibilities read for judgment vs routine sentences → liveness gate → a
suggested next action. Offline: reads saved files only. No LLM is called.

    python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py \
      --roles <roles.json> --today YYYY-MM-DD --out-dir <new folder> \
      [--liveness <saved npm run ats:liveness output>] [--config f] [--elements f]
      [--titles f] [--compact f] [--overwrite]

Exit: 0 = ran (some postings may be routed to a human) · 2 = refused (nothing written).
"""
import argparse
import hashlib
import json
import os
import sys
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import lib_pivot as lib  # noqa: E402

RECIPE = 'recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md'
RECIPE_VERSION = '0.1.5'
ACTIONS = ['PRIORITIZE', 'STANDARD', 'NOTE-ROUTINE', 'PIN-SOC', 'RESEARCH-SOC', 'OUT-OF-TARGET', 'CHECK-LIVENESS', 'SKIP']


def fail(msg):
    print(f'✗ {msg}', file=sys.stderr)
    sys.exit(2)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def rel(p):
    return os.path.relpath(p, ROOT)


def read_json(path, what):
    if not os.path.exists(path):
        fail(f'{what} not found: {path}')
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        fail(f'{what} is not valid JSON ({path}): {e}')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--roles', required=True)
    ap.add_argument('--today', default=date.today().isoformat())
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--liveness', action='append', default=[],
                    help='saved npm run ats:liveness output; repeat for later checks (later files win)')
    ap.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    ap.add_argument('--elements', default=os.path.join(HERE, 'data', 'onet_elements_15.csv'))
    ap.add_argument('--titles', default=os.path.join(HERE, 'data', 'onet_titles.csv'))
    ap.add_argument('--compact', default=os.path.join(ROOT, 'data', 'bls', 'compact', 'soc_occupation_compact.csv'))
    ap.add_argument('--overwrite', action='store_true')
    a = ap.parse_args()

    # ── G1 input gate: every check happens before anything is written ──────
    try:
        lib.parse_day(a.today)
    except lib.Refusal as e:
        fail(f'--today: {e}')
    out = os.path.abspath(a.out_dir)
    if out == os.path.join(ROOT, 'data') or out.startswith(os.path.join(ROOT, 'data') + os.sep):
        fail('refusing to write under data/ (the verified layer)')
    if os.path.exists(os.path.join(out, 'pivot-log.json')) and not a.overwrite:
        fail(f'{out} already holds a run (pivot-log.json). Use a new --out-dir, or --overwrite on purpose.')
    cfg = read_json(a.config, 'config')
    roles_doc = read_json(a.roles, 'roles file')
    roles = roles_doc['roles'] if isinstance(roles_doc, dict) else roles_doc
    if not roles:
        fail('roles file has no postings')
    ids = [r.get('role_id') for r in roles]
    if len(set(ids)) != len(ids) or None in ids:
        fail('every posting needs a unique role_id')
    for p in (a.elements, a.titles, a.compact):
        if not os.path.exists(p):
            fail(f'input not found: {p}')
    elements = lib.load_elements(a.elements)
    index = lib.load_title_index(a.titles)
    compact = lib.load_compact(a.compact)
    anchor_code = cfg['anchor']['onet_soc_code']
    anchor = lib.pivot_stats(elements.get(anchor_code))
    if anchor['status'] != 'scored':
        fail(f'anchor {anchor_code} has no complete pivot score ({anchor["status"]}); nothing can be compared')
    prefixes = tuple(cfg['scope']['soc_prefixes'])
    for code, row in compact.items():   # the extract must reproduce the repo's own table
        stored = row.get('cognitive_pivot_score', '')
        s = lib.pivot_stats(elements.get(code)) if code.startswith(prefixes) else None
        if stored != '' and s and s['status'] == 'scored' and abs(round(s['value'], 3) - float(stored)) > 0.0005:
            fail(f'stored cognitive_pivot_score for {code} ({stored}) ≠ recomputed from its nine ratings ({s["value"]:.3f}); the inputs disagree, so no comparison is made')
    ats = {}
    for lpath in a.liveness:   # v0.1.2: several checks may be given; a later file overrides an earlier one
        if not os.path.exists(lpath):
            fail(f'liveness file not found: {lpath}')
        with open(lpath, encoding='utf-8') as f:
            ats.update(lib.parse_ats_liveness(f.read()))
    shared_bls = Counter(r.get('bls_soc_code') for r in compact.values())

    # ── per posting ─────────────────────────────────────────────────────────
    postings, occ_seen = [], {}
    roles_dir = os.path.dirname(os.path.abspath(a.roles))
    try:
        for r in roles:
            snap_path = os.path.join(roles_dir, r['snapshot'])
            snap = read_json(snap_path, f'snapshot for {r["role_id"]}')
            listing = snap.get('board_listing') or {}
            if not listing.get('fetched_at'):
                fail(f'{r["role_id"]}: snapshot has no board_listing.fetched_at; liveness cannot be judged')
            live = lib.liveness_gate(listing['fetched_at'], a.today, cfg['liveness']['max_age_days'], ats.get(r.get('url')))
            match = lib.lookup_occupations(r['title'], index, cfg)
            occs, bands = [], []
            for code in match['in_scope']:
                st = lib.pivot_stats(elements.get(code))
                row = compact.get(code, {})
                if code == anchor_code:
                    cmp_ = {'delta': 0.0, 'se_diff': None, 'z': 0.0, 'band': 'anchor', 'source': lib.SRC['model'], 'basis': 'this is the anchor occupation'}
                else:
                    cmp_ = lib.compare(st, anchor, cfg['distinguishable']['z'])
                dated = None
                if st['status'] == 'scored':
                    dated = lib.years_apart(st['dates'][-1], anchor['dates'][-1]) >= cfg['dated_ratings']['years_apart']
                occ = {'onet_soc_code': code, 'title': {'value': row.get('title'), 'source': lib.SRC['record']},
                       'pivot': st, 'vs_anchor': cmp_, 'dated_vs_anchor': dated,
                       'median_wage': {'value': lib._num(row.get('annual_median_wage')), 'source': lib.SRC['record'],
                                       'bls_soc_code': row.get('bls_soc_code'),
                                       'shared_with_other_onet_codes': shared_bls.get(row.get('bls_soc_code'), 0) > 1},
                       'job_zone': {'value': row.get('job_zone'), 'source': lib.SRC['record']}}
                occs.append(occ)
                occ_seen[code] = occ
                if cmp_:
                    bands.append(cmp_['band'])
            band = lib.range_band(bands)
            scored_vals = [o['pivot']['value'] for o in occs if o['pivot']['status'] == 'scored']
            signal = lib.posting_signal(snap.get('bodyText', ''), cfg['posting_signal'])
            act = lib.next_action(live['result'], band, signal['reading'], out_of_target=match['method'] == 'out-of-target')
            postings.append({
                'role_id': r['role_id'], 'company': r.get('company'), 'title': {'value': r['title'], 'source': lib.SRC['record']},
                'url': r.get('url'), 'location': r.get('location'),
                'liveness': live, 'occupation_match': match, 'occupations': occs,
                'unscored_candidates': [o['onet_soc_code'] for o in occs if o['pivot']['status'] != 'scored'],
                'pivot_range': {'min': min(scored_vals) if scored_vals else None, 'max': max(scored_vals) if scored_vals else None,
                                'band': band, 'source': lib.SRC['model']},
                'posting_signal': signal, 'next_action': act,
            })
    except lib.Refusal as e:
        fail(str(e))

    # v0.1.5: the duties signal is judged across the whole batch before any posting is routed on it
    health = lib.signal_health([p['posting_signal']['reading'] for p in postings])
    for p in postings:
        p['next_action'] = lib.next_action(p['liveness']['result'], p['pivot_range']['band'], p['posting_signal']['reading'],
                                           out_of_target=p['occupation_match']['method'] == 'out-of-target',
                                           signal_discriminating=health['discriminating'] is not False)
    counts = Counter(p['next_action']['action'] for p in postings)
    gates = [
        {'gate': 'G1 input', 'status': 'passed (machine)', 'detail': f'{len(postings)} postings; extract reproduces the stored pivot scores'},
        {'gate': 'G2 occupation match', 'status': 'awaiting human', 'detail': 'confirm each title→occupation match; pin a reasoned choice for every PIN-SOC row'},
        {'gate': 'G3 liveness', 'status': 'awaiting human', 'detail': 'run npm run ats:liveness on every PRIORITIZE/STANDARD row; confirm CHECK-LIVENESS rows by hand'},
        {'gate': 'G4 posting signal', 'status': 'awaiting human', 'detail': 'read the quoted sentences; the phrase lists are a rule, not understanding'},
        {'gate': 'G5 decision', 'status': 'awaiting human', 'detail': 'the person decides which postings get tailoring time; the tool applies to nothing'},
    ]
    log = {
        '_recipe': RECIPE, 'recipe_version': RECIPE_VERSION, 'run_date': a.today,
        'inputs': {k: {'path': rel(p), 'sha256': sha256(p)} for k, p in
                   [('roles', a.roles), ('config', a.config), ('elements', a.elements), ('titles', a.titles), ('compact', a.compact)]
                   + [(f'liveness_{i + 1}', lp) for i, lp in enumerate(a.liveness)]},
        'assumptions': {k: cfg[k] for k in ('anchor', 'scope', 'distinguishable', 'dated_ratings', 'liveness', 'pins')},
        'anchor': {'onet_soc_code': anchor_code, 'title': compact.get(anchor_code, {}).get('title'), 'pivot': anchor},
        'counts': {k: counts.get(k, 0) for k in ACTIONS},
        'signal_health': health,
        'gates': gates, 'postings': postings,
    }
    # v0.1.1: build both outputs in memory first — run 2 crashed in report() after the log
    # was already on disk, which broke the "refuse → write nothing" rule
    log_text = json.dumps(log, indent=1, ensure_ascii=False)
    report_text = report(log, occ_seen, anchor)
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'pivot-log.json'), 'w', encoding='utf-8') as f:
        f.write(log_text)
    with open(os.path.join(out, 'pivot-report.md'), 'w', encoding='utf-8') as f:
        f.write(report_text)
    print(f'✓ assessed {len(postings)} postings → ' + ' · '.join(f'{k} {counts[k]}' for k in ACTIONS if counts.get(k)))
    print(f'  {rel(os.path.join(out, "pivot-log.json"))}  +  {rel(os.path.join(out, "pivot-report.md"))}')


def f3(x):
    return '—' if x is None else f'{x:.3f}'


def report(log, occ_seen, anchor):
    c, P = log['counts'], log['postings']
    a = log['anchor']
    L = ['# Backend pivot-range report', '', '## Executive summary', '']
    L.append(
        f'This report looks at {len(P)} open backend-type job postings and asks two questions a posting does not answer: '
        f'is the occupation this job title belongs to the kind of thinking-heavy work AI is least able to replace, and does this posting\'s own list of duties read that way? '
        f'It compares every occupation with **{a["title"]}** (the occupation for a new-grad backend engineer) and only calls two scores different when the gap is bigger than O*NET\'s own measurement error. '
        f'It suggests **{c["PRIORITIZE"]}** postings to prioritize, **{c["STANDARD"]}** standard, **{c["NOTE-ROUTINE"]}** that read routine, '
        f'and sends **{c["PIN-SOC"] + c["RESEARCH-SOC"]}** back to you because the job title does not settle which occupation it is. '
        f'**{c["OUT-OF-TARGET"]}** are titles you marked outside your target role. '
        f'{c["CHECK-LIVENESS"] + c["SKIP"]} need their open status checked or are closed. Nothing here is a decision: you make the call on every row.')
    L += ['', '## Results', '', '| Posting | Next action | Why | Occupation match | Pivot range vs anchor | Posting duties | Liveness |', '|---|---|---|---|---|---|---|']
    for p in P:
        m = p['occupation_match']
        occ = '; '.join(f'{o["onet_soc_code"]} {o["title"]["value"] or ""}' for o in p['occupations']) or '—'
        how = {'onet-exact': (f'O*NET title "{m.get("matched_title")}" after my normalization [model-judgment]' if m.get('normalized')
                              else f'O*NET title "{m.get("matched_title")}" [record]'),
               'onet-contained': f'contains O*NET title "{m.get("matched_title")}" [model-judgment]',
               'family-fallback': f'family {m.get("family")} [your-input]',
               'pinned': 'pinned [your-input]', 'out-of-target': 'outside my target [your-input]', 'none': 'no match [record]'}.get(m['method'], m['method'])
        pr = p['pivot_range']
        rng = '—' if pr['min'] is None else (f2(pr['min']) if pr['min'] == pr['max'] else f'{f2(pr["min"])}–{f2(pr["max"])}')
        s = p['posting_signal']
        duties = s['reading'] if s['judgment'] is None else f'{s["reading"]} ({s["judgment"]} judgment / {s["routine"]} routine)'
        L.append(f'| {p["company"]} — {p["title"]["value"]} | **{p["next_action"]["action"]}** | {p["next_action"]["why"]} | {occ} · {how} | {rng} · {pr["band"] or "—"} | {duties} [model-judgment] | {p["liveness"]["result"]} [record] |')
    L += ['', '## The occupations behind these titles', '',
          f'Anchor: **{a["onet_soc_code"]} {a["title"]}**, pivot {f3(anchor["value"])} ± {f3(anchor["se"])} (rated {", ".join(anchor["dates"])}).', '',
          'Two error assumptions (v0.1.4): *z (indep.)* assumes the nine rating errors are independent; *z (corr.)* assumes they move together. A difference counts as **real under both** only if both agree. Routing uses the independent-error band.', '',
          '| O*NET occupation | Pivot (record) | ± SE (model-judgment) | Rated | z (indep.) | Band | z (corr.) | Real under both? | Ratings ≥ 5 yrs apart? | National median wage (record) |', '|---|---|---|---|---|---|---|---|---|---|']
    for code, o in sorted(occ_seen.items(), key=lambda kv: -(kv[1]['pivot']['value'] or 0)):
        st, v = o['pivot'], o['vs_anchor']
        wage = o['median_wage']
        w = '—' if wage['value'] is None else f'${wage["value"]:,.0f}' + (' (shared BLS code)' if wage['shared_with_other_onet_codes'] else '')
        zs = '—' if not v else ('{:+.2f}'.format(v['z']) if isinstance(v['z'], float) else str(v['z']))
        pv = f3(st['value']) if st['status'] == 'scored' else st['status']
        dated = '—' if o['dated_vs_anchor'] is None else ('yes' if o['dated_vs_anchor'] else 'no')
        rated = ', '.join(st.get('dates', [])) or '—'
        zc = '—' if not v or 'z_correlated' not in v else '{:+.2f}'.format(v['z_correlated'])
        both = '—' if not v or 'real_under_both' not in v else ('yes' if v['real_under_both'] else 'no')
        L.append(f'| {code} {o["title"]["value"] or ""} | {pv} | {f3(st["se"])} | {rated} | {zs} | {v["band"] if v else "no score"} | {zc} | {both} | {dated} | {w} |')
    h = log['signal_health']
    verdict = {True: 'it separates postings in this batch', False: '**it separates nothing in this batch**', None: 'nothing could be read'}[h['discriminating']]
    L += ['', '## Duties signal check', '',
          f'Of the postings whose duties could be classified: {h["judgment_heavy"]} judgment-heavy, {h["routine_leaning"]} routine-leaning ({verdict}). {h["basis"][0].upper() + h["basis"][1:]}. [model-judgment]']
    L += ['', '## Verified vs inferred', '',
          '- **Record:** the posting title and its quoted sentences; which O*NET title lists contain a title; each occupation\'s nine ratings, rater count, rating date and standard errors; BLS national median wage; the board listing time; `npm run ats:liveness` results.',
          '- **Model-judgment (rules, no LLM):** the pivot standard error (assumes independent rating errors, so it is probably too small); "distinguishable" vs the anchor; the judgment/routine reading of the duties; the next action.',
          '- **Your-input:** the anchor, the scope (major group 15), z = ' + str(log['assumptions']['distinguishable']['z']) + ', the family fallback rules and their canonical titles, any pins, the phrase lists, the liveness age limit.',
          '', '## Gates for you to clear', '']
    for g in log['gates']:
        L.append(f'- [ ] **{g["gate"]}** — {g["detail"]} *(status: {g["status"]})*')
    L += ['', '## What this run cannot tell you', '',
          '- Whether AI will actually replace any of this work. The pivot score measures how much reasoning and judgment O*NET\'s analysts rated an occupation as needing, not measured AI exposure.',
          '- Which occupation an employer would file this role under (for example on an H-1B petition). The title lists are O*NET\'s, not the employer\'s.',
          '- Ratings made years apart: an occupation rated in 2017 was rated before today\'s AI coding tools; its score is not a 2026 measurement.',
          '- Boston pay: wages are national medians, and several O*NET occupations share one BLS wage line.',
          '- Whether a posting\'s duties are what the job really involves: the phrase lists read words, not intent.',
          '', '## Run record', '',
          f'- Recipe: `{log["_recipe"]}` v{log["recipe_version"]} · run date {log["run_date"]}']
    for k, v in log['inputs'].items():
        L.append(f'- {k}: `{v["path"]}` (sha256 {v["sha256"][:12]}…)')
    return '\n'.join(L) + '\n'


def f2(x):
    return f'{x:.3f}'


if __name__ == '__main__':
    main()
