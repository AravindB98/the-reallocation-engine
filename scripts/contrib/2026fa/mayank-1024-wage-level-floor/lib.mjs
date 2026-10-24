// lib.mjs — pure helpers for the wage-level-floor mode. No network, no file writes.
// Everything here is unit-tested in test/wage-level.test.mjs.

// DOL OFLC annualises hourly prevailing wages at 2080 hours
// (release notes WY 2026-27: "$115.00 per hour or $239,200.00 per year").
export const HOURS_PER_YEAR = 2080;

// 90 FR 60948 (Dec 29, 2025): DHS's *projection* of selection probability per wage level
// under weighted selection. A model estimate made before any weighted lottery ran — not an
// observed FY2027 rate. Entries per level (IV=4 … I=1) are the rule itself.
export const LOTTERY = {
  entries: { 1: 1, 2: 2, 3: 3, 4: 4 },
  dhs_projected_pct: { 1: 15.29, 2: 30.58, 3: 45.87, 4: 61.16 },
  dhs_projected_baseline_pct: 29.59,
  source: '90 FR 60864 (final rule, 2025-12-29); projection at 90 FR 60948 / NPRM Table 13',
};

export const LEVEL_NAMES = ['below I', 'I', 'II', 'III', 'IV'];

/** Minimal RFC-4180 CSV parser: quotes, doubled quotes, CRLF, commas in quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, q = false;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

export function csvObjects(text) {
  const [head, ...body] = parseCsv(text);
  return body.map(r => Object.fromEntries(head.map((h, k) => [h.trim(), (r[k] ?? '').trim()])));
}

export function toCsv(rows, cols) {
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n';
}

export const annualize = hourly => Math.round(hourly * HOURS_PER_YEAR * 100) / 100;

/** Compact OFLC rows → Map("area|soc" → record with hourly + annual thresholds). */
export function indexOflc(rows) {
  const idx = new Map();
  for (const r of rows) {
    const hourly = [r.level1_hourly, r.level2_hourly, r.level3_hourly, r.level4_hourly].map(Number);
    if (hourly.some(v => !Number.isFinite(v) || v <= 0)) continue;
    idx.set(`${r.area}|${r.soc}`, {
      area: r.area, area_name: r.area_name, soc: r.soc, geo_lvl: r.geo_lvl,
      hourly, annual: hourly.map(annualize), label: r.label || '',
    });
  }
  return idx;
}

/**
 * Highest OFLC level the annual wage meets or exceeds (0 = below Level I).
 * Returns the next threshold and the dollar gap to it.
 */
export function levelFor(wage, annualLevels) {
  let level = 0;
  for (let k = 0; k < 4; k++) if (wage >= annualLevels[k]) level = k + 1;
  const next = level < 4 ? annualLevels[level] : null;
  return { level, next_threshold: next, gap_to_next: next == null ? null : Math.round((next - wage) * 100) / 100 };
}

/**
 * Band for a posted range [min, max] against one area/SOC record.
 * The kind names what a person can do about it; nothing here is a recommendation to apply.
 */
export function bandFor(min, max, rec) {
  const lo = levelFor(min, rec.annual), hi = levelFor(max, rec.annual);
  let kind;
  if (hi.level === 0) kind = 'RANGE-BELOW-L1';
  else if (lo.level === 0) kind = 'FLOOR-BELOW-L1';
  else if (lo.level < hi.level) kind = 'CLIFF-IN-RANGE';
  else kind = 'FLAT';
  // The smallest number inside the range that raises the level (the negotiation line).
  const cliff = lo.level < hi.level ? rec.annual[lo.level] : null;
  return { kind, level_min: lo.level, level_max: hi.level, cliff, gap_from_min: lo.gap_to_next };
}

/** Multiple worksites → the LOWEST applicable level counts (90 FR 60864, §II "multiple locations"). */
export function lowestAcross(results) {
  return results.reduce((a, b) => (b.level_min < a.level_min || (b.level_min === a.level_min && b.level_max < a.level_max) ? b : a));
}

export function normalizeCompany(s) {
  return String(s || '').toUpperCase().replace(/[.,'"&]/g, ' ')
    .replace(/\b(INC|LLC|L L C|CORP|CORPORATION|CO|COMPANY|LTD|LP|PBC)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', '#39': "'" };
export function htmlToText(s) {
  let t = String(s || '');
  for (let pass = 0; pass < 2; pass++) // Greenhouse double-escapes: &lt;p&gt; then &amp;nbsp;
    t = t.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
      return ENTITIES[e.toLowerCase()] ?? m;
    });
  return t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const MONEY = String.raw`\$\s?(\d{2,3}(?:,\d{3})+(?:\.\d{2})?|\d{2,3}(?:\.\d+)?\s?[kK])`;
const RANGE_RE = new RegExp(`${MONEY}\\s*(?:USD\\s*)?(?:-|–|—|to)\\s*${MONEY}`, 'g');
const money = s => { const v = s.replace(/[\s,$]/g, ''); return /k$/i.test(v) ? parseFloat(v) * 1000 : parseFloat(v); };

/** Dollar ranges found in posting text. Labeled `posting-text`: a regex reading, not an ATS field. */
export function rangesFromText(text) {
  const out = [];
  for (const m of text.matchAll(RANGE_RE)) {
    const min = money(m[1]), max = money(m[2]);
    if (!(min > 0 && max >= min)) continue;
    out.push({ min, max, snippet: text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 40) });
  }
  return out;
}

// Words that carry no place: what is left after removing them and the mapped keys is a
// place this mode does not know, and is reported (never silently dropped).
const PLACE_NOISE = /\b(on-?site|hybrid|remote|preferred|based|or|and|in|office|USA?|United[ -]States|MA|NH|Massachusetts|New Hampshire)\b|[(),;|/&.\-–—]/gi;

/** Map a posting location string to OFLC area codes using the person's location_map. */
export function areasFor(location, locationMap, homeArea) {
  const text = String(location || '');
  const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = [];
  let residue = text;
  // longest keys first so "United States" is matched before any shorter key inside it
  for (const key of Object.keys(locationMap).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${esc(key)}\\b`, 'gi');
    const m = residue.match(re);
    if (!m) continue;
    residue = residue.replace(re, ' ');
    const v = locationMap[key];
    hits.push({ matched: key, area: v === 'home' ? homeArea : v, via_home: v === 'home', order: text.search(new RegExp(`\\b${esc(key)}\\b`, 'i')) });
  }
  hits.sort((a, b) => a.order - b.order);
  const unmapped = residue.replace(PLACE_NOISE, ' ').split(/\s{2,}/).map(s => s.trim()).filter(s => /[a-z]{2,}/i.test(s));
  return { hits, unmapped };
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** G1 — does a cap registration window fall inside the person's work authorization? */
export function timelineGate(persona) {
  const { as_of } = persona;
  const end = persona.visa?.work_auth_end;
  const win = persona.registration?.next_window_start;
  if (!as_of || !end || !win) return { state: 'error', reason: 'missing as_of, visa.work_auth_end, or registration.next_window_start' };
  if (Date.parse(end) <= Date.parse(as_of)) return { state: 'error', reason: `work_auth_end ${end} is not after as_of ${as_of}` };
  const days_left = daysBetween(as_of, end);
  if (Date.parse(end) >= Date.parse(win)) return { state: 'open', days_left, window: win };
  if (persona.visa?.stem_opt_eligible) return { state: 'conditional', days_left, window: win, reason: 'window falls after current authorization ends; reachable only if a STEM OPT extension is filed in time' };
  return { state: 'closed', days_left, window: win, reason: 'no registration window falls inside current work authorization' };
}
