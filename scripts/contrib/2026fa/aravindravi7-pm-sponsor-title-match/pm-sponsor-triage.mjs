#!/usr/bin/env node
// pm-sponsor-triage.mjs — PM sponsor title-match (Fall 2026 contribution, aravindravi7).
//
// Question it answers: has this company sponsored H-1B visas for PRODUCT-MANAGER-family
// titles — not just "does it sponsor anyone"? Then: is the posting live, does the hiring
// timeline fit a STEM OPT student's unemployment allowance, and what should the person do
// next (tailor / network first / non-H1B fallback / skip / resolve a hold)?
//
// It COMBINES nothing itself. It looks up records, labels every value, writes a roles.json
// shaped like data/examples/ch11-roles.json, and runs the existing scorer
// (scripts/score/role-scorer.mjs) as a CLI. Roles it cannot evidence are HELD and never
// reach the scorer — the scorer treats a missing liveness factor as 1 (open).
//
// Labels: record (a real record produced it) · your-input (the person decided) ·
//         model-judgment · fixture (hand-written or trimmed TEST data — never a record) ·
//         none (nothing produced a value). A row with ANY fixture-sourced scorer input is a
//         DEMO: no actionable verdict; the scorer's outcome goes in would_be_if_live.
//
//   node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --sample
//   node .../pm-sponsor-triage.mjs --shortlist s.json --persona p.json --liveness l.jsonl [--liveness l2.txt] --out dir [--as-of YYYY-MM-DD]
//
// Modes: --sample (fixtures allowed; every fixture row is DEMO) · live (the default).
// Exit: 0 ok · 2 usage/input error · 3 timeline gate refuses the whole run (OPT end not in future)
//       · 4 scorer failed or disagreed with the profile · 5 live run fed a fixture input (hard stop).
// No network calls. Reads only local files.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../../../..');
export const FIXTURE_DIR = path.join(HERE, 'fixtures');

export const DEFAULTS = {
  csv: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
  formdDir: 'data/sec/form-d/processed/sample',
  scorer: 'scripts/score/role-scorer.mjs',
  tiersPredicted: path.join(HERE, 'data/employer_tiers.predicted.json'),
  lca: path.join(HERE, 'data/lca/lca-pm-filings-fy2026_q3.csv'),
};

export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input', fixture: 'fixture', none: 'none' };
export const EXIT = { usage: 2, timeline: 3, scorer: 4, liveGuard: 5 };

// ─── Declared rules. Every number here is a design choice (your-input), not a measurement. ───
export const TIER_RULES = {
  'title-family-match': { p: 0.9, tier: 'Proven' },
  'adjacent-family':    { p: 0.6, tier: 'Likely' },
  'sponsor-not-pm':     { p: 0.5, tier: 'Possible' },
  'no-h1b-record':      { p: 0.0, tier: 'None' },
};
// Slack = days to OPT end − hiring lag. Stepped, not fitted; see recipe §Timeline gate.
export const TIMELINE_STEPS = [[365, 1.0], [180, 0.85], [90, 0.6], [1, 0.3]];
export const THIN_TITLE_EVIDENCE = 2; // ≤ this many sponsored titles listed → flag as thin
// The constants above are the v0.1.1 values (AI-drafted in A2). A run takes its rule values from a
// rules file (--rules); a live run must declare one, so it can never fall back to drafted values silently.
export const V011_RULES = { rules_version: 'v0.1.1', tier_rules: TIER_RULES, timeline_steps: TIMELINE_STEPS, thin_title_evidence: THIN_TITLE_EVIDENCE };
export function loadRules(file) {
  if (!fs.existsSync(file)) throw new InputError(`rules file not found: ${file}`);
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of Object.keys(TIER_RULES)) {
    const t = r.tier_rules?.[k];
    if (!t || typeof t.tier !== 'string' || !(typeof t.p === 'number' && t.p >= 0 && t.p <= 1)) throw new InputError(`rules: tier_rules.${k} needs {p: number in [0,1], tier: string}`);
  }
  const steps = r.timeline_steps;
  if (!Array.isArray(steps) || !steps.every((x) => Array.isArray(x) && Number.isInteger(x[0]) && typeof x[1] === 'number' && x[1] >= 0 && x[1] <= 1)) throw new InputError('rules: timeline_steps needs [[min_slack_days, factor], …]');
  const sorted = [...steps].sort((a, b) => b[0] - a[0]);
  if (!Number.isInteger(r.thin_title_evidence)) throw new InputError('rules: thin_title_evidence needs an integer');
  return { rules_version: r.rules_version || path.basename(file), tier_rules: r.tier_rules, timeline_steps: sorted, thin_title_evidence: r.thin_title_evidence,
    file: path.relative(REPO, path.resolve(file)), provenance: provOf(insideFixtures(file) || jsonIsFixture(r)) };
}

// ─── Provenance. A value is a "record" only if a real record produced it. ───
export function insideFixtures(p) {
  const r = path.resolve(p);
  return r === FIXTURE_DIR || r.startsWith(FIXTURE_DIR + path.sep);
}
export const textIsFixture = (text) => /^\s*#\s*FIXTURE\b/m.test(String(text || '').split('\n').slice(0, 5).join('\n'));
export const jsonIsFixture = (o) => !!o && typeof o === 'object' && (o._provenance === 'fixture' || o.metadata?._provenance === 'fixture' || o.metadata?._fixture != null);
// lab: a value plus where it came from. A fixture-derived value keeps what it stands in for.
const lab = (value, source, extra = {}) => ({ value, source, ...extra });
export const labP = (value, natural, prov, extra = {}) =>
  prov === SRC.fixture ? { value, source: SRC.fixture, stands_in_for: natural, ...extra } : { value, source: natural, ...extra };
const provOf = (isFixture) => (isFixture ? SRC.fixture : null);

// ─── Title-family classifier (deterministic regex, v1) ───
// Excluded phrases are blanked out first, so "Product Marketing Manager" cannot match "product … manager".
const EXCLUDE = /\bproduct\s+(marketing|design|designer|specialist|support|engineer|analyst|counsel|operations|strategy)\b/gi;
const PRODUCT = /\bproduct\s+(manager|owner|management|lead)\b|\bAPM\b/i;
const PROGRAM = /\b(technical\s+)?program\s+manager\b/i;
const BARE_PM = /\bT?PM\b/; // bare "TPM" is product OR program — ambiguous on purpose

export function classifyTitle(title) {
  const t = String(title || '').replace(EXCLUDE, ' ').trim();
  if (!t) return 'other';
  if (PRODUCT.test(t)) return 'product';
  if (PROGRAM.test(t)) return 'program';
  if (BARE_PM.test(t)) return 'ambiguous-pm'; // "Advertiser Optimization PM", bare "TPM": counted as neither family
  return 'other';
}

// Python-list repr from the CSV, e.g. "['Software Engineer', \"Men's Category\"]"
export function parseTitleList(s) {
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(String(s || '')))) out.push((m[1] ?? m[2]).trim());
  return out.filter(Boolean);
}

// ─── Exact normalized company-name matching. No fuzzy matching, by design. ───
const SUFFIX = new Set(['INC', 'INCORPORATED', 'LLC', 'CORP', 'CORPORATION', 'CO', 'COMPANY', 'LTD', 'LIMITED', 'PBC', 'LP', 'LLP', 'PLC']);
export function normalizeName(name) {
  let toks = String(name || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  while (toks.length > 1 && SUFFIX.has(toks[toks.length - 1])) toks.pop();
  return toks.join(' ');
}

// ─── Minimal RFC-4180 CSV parser (quoted fields, embedded commas/newlines). ───
export function parseCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = [];
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Columns this recipe reads. Phone / officer / director columns are never read or echoed.
export const CSV_COLUMNS = ['company_name', 'industry', 'state', 'latest_funding_amount', 'latest_funding_stage', 'latest_funding_date',
  'Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered', 'top_job_titles_sponsored'];

export class InputError extends Error { constructor(msg, code = EXIT.usage) { super(msg); this.code = code; } }

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
const numOrNull = (s) => { const t = String(s ?? '').trim(); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : null; };

export function loadSponsorIndex(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const header = text.slice(0, text.indexOf('\n')).replace(/\r$/, '').split(',');
  const missing = CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new InputError(`80 Days CSV schema drift: missing column(s) ${missing.join(', ')} in ${csvPath}`);
  const parsed = parseCsv(text);
  const provenance = provOf(insideFixtures(csvPath) || parsed.some((r) => r._provenance === 'fixture'));
  const rows = parsed.map((r) => Object.fromEntries(CSV_COLUMNS.map((c) => [c, r[c]])));
  const byNorm = new Map(); const byRaw = new Map();
  for (const r of rows) {
    const k = normalizeName(r.company_name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(r);
    byRaw.set(String(r.company_name).trim().toUpperCase(), r);
  }
  return { rows: rows.length, byNorm, byRaw, provenance };
}

export function loadFormD(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.sample\.json$/.test(f)).sort() : [];
  const byNorm = new Map(); let shipped = 0; let total = 0; const fixtureFiles = [];
  for (const f of files) {
    const fp = path.join(dir, f);
    const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const prov = provOf(insideFixtures(fp) || jsonIsFixture(j));
    if (prov) fixtureFiles.push(f);
    shipped += (j.companies || []).length; total += j.metadata?.total_companies ?? 0;
    for (const c of j.companies || []) {
      const k = normalizeName(c.company?.name);
      if (!byNorm.has(k)) byNorm.set(k, []);
      byNorm.get(k).push({ accession_number: c.accession_number ?? null, quarter: c.filing?.quarter, date_filed: c.filing?.date_filed, total_amount_sold: c.funding?.total_amount_sold ?? null, industry: c.company?.industry ?? null, file: f, provenance: prov });
    }
  }
  return { files, shipped, total, byNorm, fixtureFiles };
}

export function loadBls(blsPath, socs) {
  const parsed = parseCsv(fs.readFileSync(blsPath, 'utf8'));
  const prov = provOf(insideFixtures(blsPath) || parsed.some((r) => r._provenance === 'fixture'));
  const entries = socs.map((soc) => {
    const hits = parsed.filter((r) => r.bls_soc_code === soc);
    if (!hits.length) return { soc, status: 'missing', missing_reason: 'no-occupation-row', median_wage: null, ...labP(null, SRC.record, prov) };
    const row = hits.find((r) => r.onet_soc_code === `${soc}.00`) || hits[0];
    const w = numOrNull(row.annual_median_wage);
    if (w == null) return { soc, title: row.title, status: 'missing', missing_reason: 'no-wage-value', median_wage: null, ...labP(null, SRC.record, prov) };
    return { soc, title: row.title, status: 'ok', median_wage: w, oews_year: row.oews_year, ...labP(w, SRC.record, prov) };
  });
  entries.provenance = prov;
  return entries;
}

// ─── Liveness inputs: the saved text of `npm run ats:liveness`, or JSONL from liveness-json.mjs. ───
// Text: provenance is "record" unless the file sits in fixtures/ or carries a `# FIXTURE` marker.
// JSONL: every line must state its provenance; a file inside fixtures/ can never be a record.
export function parseLiveness(text, { fixture = false } = {}) {
  const prov = fixture || textIsFixture(text) ? SRC.fixture : SRC.record;
  const map = new Map(); let last = null;
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\S+\s+(active|expired|uncertain)\s+(\S+)\s*$/);
    if (m) { last = { status: m[1], url: m[2], reason: null, provenance: prov }; map.set(m[2], last); continue; }
    if (last && /^\s{4,}\S/.test(line) && !last.reason) last.reason = line.trim();
  }
  return map;
}
export function parseLivenessJsonl(text, { fixture = false } = {}) {
  const map = new Map();
  String(text || '').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    let o; try { o = JSON.parse(line); } catch { throw new InputError(`liveness JSONL line ${i + 1} is not valid JSON`); }
    if (!o.url || !['active', 'expired', 'uncertain'].includes(o.result)) throw new InputError(`liveness JSONL line ${i + 1}: needs url and result (active|expired|uncertain)`);
    if (!['record', 'fixture'].includes(o.provenance)) throw new InputError(`liveness JSONL line ${i + 1}: missing provenance (record|fixture) — refusing to guess`);
    map.set(o.url, { status: o.result, url: o.url, reason: o.reason ?? null, checked_at: o.checked_at ?? null, provenance: fixture ? SRC.fixture : o.provenance });
  });
  return map;
}
export function loadLivenessFiles(files) {
  const merged = new Map(); const meta = [];
  for (const f of files) {
    if (!fs.existsSync(f)) throw new InputError(`liveness file not found: ${f}`);
    const text = fs.readFileSync(f, 'utf8');
    const inFix = insideFixtures(f);
    const jsonl = text.trimStart().startsWith('{');
    const map = jsonl ? parseLivenessJsonl(text, { fixture: inFix }) : parseLiveness(text, { fixture: inFix });
    const fixture = [...map.values()].some((e) => e.provenance === SRC.fixture) || (!jsonl && textIsFixture(text)) || inFix;
    meta.push({ path: path.relative(REPO, path.resolve(f)), format: jsonl ? 'jsonl' : 'text', urls: map.size, provenance: fixture ? SRC.fixture : SRC.record });
    for (const [u, e] of map) merged.set(u, e); // later files (re-checks) override earlier ones
  }
  return { map: merged, meta };
}

// G2 (liveness gate). A checker record or a NAMED human can clear it; a fixture never can.
export function livenessGate(entry, human, humanProv, anyFile) {
  let liveness; let hold = null; let g2; let invalid = null;
  if (!anyFile) { liveness = lab(null, SRC.none, { status: 'unchecked' }); hold = { reason: 'liveness-unchecked', detail: 'no liveness file supplied' }; g2 = 'held — unchecked'; }
  else if (!entry) { liveness = lab(null, SRC.none, { status: 'unchecked' }); hold = { reason: 'liveness-unchecked', detail: 'URL not in any liveness file — run liveness-json.mjs on it' }; g2 = 'held — unchecked'; }
  else if (entry.status === 'uncertain') {
    liveness = labP(null, SRC.record, entry.provenance, { status: 'uncertain', checker_reason: entry.reason });
    hold = { reason: 'liveness-uncertain', detail: `checker: ${entry.reason || 'uncertain'} — a human opens the posting` }; g2 = 'held — uncertain';
  } else {
    const active = entry.status === 'active';
    liveness = labP(active ? 1.0 : 0.0, SRC.record, entry.provenance, { status: entry.status, checker_reason: entry.reason });
    g2 = entry.provenance === SRC.fixture ? 'not cleared — fixture' : active ? 'cleared — checker: active' : 'closed — checker: expired';
  }
  // A named human who opened the posting may clear uncertain/unchecked — never reopen an expired posting.
  if (human && hold) {
    if (!['active', 'expired'].includes(human.status) || !human.by || !human.date) invalid = { reason: 'invalid-input', detail: 'liveness_human needs status (active|expired), by (a name) and date' };
    else {
      const active = human.status === 'active';
      liveness = labP(active ? 1.0 : 0.0, SRC.input, humanProv, { status: `${human.status} (human-checked)`, checker_status: liveness.status, checked_by: human.by, checked_on: human.date, note: human.note || null });
      g2 = humanProv === SRC.fixture ? 'not cleared — fixture (human clearance read from a fixture file)' : `${active ? 'cleared' : 'closed'} — named human: ${human.by}, ${human.date}`;
      hold = null;
    }
  }
  return { liveness, hold, g2, invalid };
}

// G4 (decision gate). STEM OPT needs an E-Verify employer; no bulk source exists, so a named human checks.
export const E_VERIFY_STATUSES = ['enrolled', 'not-found', 'terminated'];
export function eVerifyGate(human, prov) {
  if (!human) return { e_verify: lab(null, SRC.none, { status: 'not-checked', note: 'look the employer up on the E-Verify employer search before tailoring' }), g4: 'open — E-Verify not checked' };
  if (!E_VERIFY_STATUSES.includes(human.status) || !human.by || !human.date)
    return { e_verify: lab(null, SRC.none, { status: 'invalid-entry', note: 'e_verify_human needs status (enrolled|not-found|terminated), by (a name) and date' }), g4: 'open — invalid e_verify_human entry' };
  const e_verify = labP(human.status, SRC.input, prov, { checked_by: human.by, checked_on: human.date, where: 'e-verify.gov employer search', note: human.note || null });
  const g4 = prov === SRC.fixture ? 'not cleared — fixture'
    : human.status === 'enrolled' ? `cleared — named human: ${human.by}, ${human.date}` : `blocked — E-Verify "${human.status}" (named human: ${human.by}, ${human.date})`;
  return { e_verify, g4 };
}

const DAY = 86400000;
export function parseDate(s, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) throw new InputError(`${field}: expected YYYY-MM-DD, got ${JSON.stringify(s)}`);
  const d = new Date(`${s}T00:00:00Z`);
  if (isNaN(d) || d.toISOString().slice(0, 10) !== s) throw new InputError(`${field}: not a real date: ${s}`);
  return d;
}

export function timelineFactor({ asOf, optEnd, lagDays, unemploymentLeft, employed, steps = TIMELINE_STEPS }) {
  const daysToEnd = Math.round((optEnd - asOf) / DAY);
  if (daysToEnd <= 0) throw new InputError(`OPT end date ${optEnd.toISOString().slice(0, 10)} is not after as-of ${asOf.toISOString().slice(0, 10)}; refusing to score — no timeline factor can be computed honestly.`, EXIT.timeline);
  if (!employed && lagDays > unemploymentLeft)
    return { factor: 0, days_to_opt_end: daysToEnd, slack_days: daysToEnd - lagDays, reason: `hiring lag ${lagDays}d exceeds remaining unemployment allowance ${unemploymentLeft}d` };
  const slack = daysToEnd - lagDays;
  const step = steps.find(([min]) => slack >= min);
  return { factor: step ? step[1] : 0, days_to_opt_end: daysToEnd, slack_days: slack, reason: step ? `slack ${slack}d ≥ ${step[0]}d step` : `slack ${slack}d ≤ 0 — start would fall after OPT end` };
}

// March H-1B registration windows between estimated start and OPT end (count only; odds not in repo).
export function registrationWindows(start, end) {
  let n = 0;
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
    const open = Date.UTC(y, 2, 1), close = Date.UTC(y, 2, 31);
    if (close >= start.getTime() && open <= end.getTime()) n++;
  }
  return n;
}

// ─── DOL LCA per-filing evidence (extract written by ingest_lca.py). ───
// A certified LCA is NOT a visa approval: it shows an employer FILED for a title, not that anyone was hired.
// Matching is exact on the normalized EMPLOYER_NAME. No match = lca-unknown, which never lowers anything;
// only a confirmed match with zero PM-family rows is absence (lca-confirmed-none).
export const LCA_COLUMNS = ['CASE_NUMBER', 'CASE_STATUS', 'DECISION_DATE', 'VISA_CLASS', 'JOB_TITLE', 'SOC_CODE', 'SOC_TITLE', 'EMPLOYER_NAME',
  'NEW_EMPLOYMENT', 'CONTINUED_EMPLOYMENT', 'CHANGE_PREVIOUS_EMPLOYMENT', 'NEW_CONCURRENT_EMPLOYMENT', 'CHANGE_EMPLOYER', 'AMENDED_PETITION',
  'WORKSITE_STATE', 'WAGE_FROM_ANNUAL', 'PREVAILING_WAGE_ANNUAL', 'PW_WAGE_LEVEL'];
function suffixOf(name) {
  const toks = String(name || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const tail = []; while (toks.length > 1 && SUFFIX.has(toks[toks.length - 1])) tail.unshift(toks.pop());
  return tail.join(' ');
}
export function readLock(lockPath) {
  const pins = new Map();
  if (fs.existsSync(lockPath)) for (const line of fs.readFileSync(lockPath, 'utf8').split('\n')) {
    const [name, sum, size] = line.trim().split(/\s+/); if (name && sum && size) pins.set(name, { sum, size: Number(size) });
  }
  return pins;
}
export function loadLca(csvPath) {
  if (!fs.existsSync(csvPath)) return null;
  const text = fs.readFileSync(csvPath, 'utf8');
  const header = text.slice(0, text.indexOf('\n')).replace(/\r$/, '').split(',');
  const missing = LCA_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new InputError(`LCA extract schema drift: missing column(s) ${missing.join(', ')} in ${csvPath}`);
  const parsed = parseCsv(text);
  const provenance = provOf(insideFixtures(csvPath) || parsed.some((r) => r._provenance === 'fixture'));
  const digest = sha256(csvPath); const size = fs.statSync(csvPath).size;
  const pin = readLock(path.join(path.dirname(csvPath), 'lca.checksums.lock')).get(path.basename(csvPath));
  if (pin && (pin.sum !== digest || pin.size !== size))
    throw new InputError(`LCA extract ${path.basename(csvPath)} does not match its pinned checksum (edited after ingest?) — refusing`);
  const byNorm = new Map();
  for (const r of parsed) {
    const k = normalizeName(r.EMPLOYER_NAME);
    if (!byNorm.has(k)) byNorm.set(k, { rawNames: new Set(), rows: [] });
    const e = byNorm.get(k); e.rawNames.add(r.EMPLOYER_NAME); e.rows.push(r);
  }
  return { path: csvPath, provenance, rows: parsed.length, byNorm, sha256: digest, integrity: pin ? 'verified against pin' : 'unpinned' };
}
const median = (xs) => { const a = [...xs].sort((x, y) => x - y); if (!a.length) return null; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const countBy = (xs) => xs.reduce((m, x) => ({ ...m, [x || '(blank)']: (m[x || '(blank)'] || 0) + 1 }), {});
export function lcaEvidence(company, csvCompanyName, postingFamily, lca, targets = new Set(['product', 'program'])) {
  if (!lca) return { status: 'lca-not-loaded', evidence: lab(null, SRC.none, { status: 'lca-not-loaded' }) };
  const keys = [...new Set([csvCompanyName && normalizeName(csvCompanyName), normalizeName(company)].filter(Boolean))];
  const key = keys.find((k) => lca.byNorm.has(k));
  if (!key) return { status: 'lca-unknown', evidence: lab(null, SRC.none, { status: 'lca-unknown', note: `no LCA employer name normalizes to ${keys.map((k) => `"${k}"`).join(' or ')} — status unknown, not absence` }) };
  const ent = lca.byNorm.get(key);
  const suffixes = new Set([...ent.rawNames].map(suffixOf).filter(Boolean));
  if (suffixes.size > 1) return { status: 'ambiguous-lca-employer', hold: { reason: 'ambiguous-lca-employer', detail: `LCA employer names ${[...ent.rawNames].map((n) => `"${n}"`).join(', ')} differ by legal suffix (${[...suffixes].join(' vs ')}) — a human decides which entity` } };
  const rows = ent.rows.map((r) => ({ ...r, family: classifyTitle(r.JOB_TITLE) }));
  const pm = rows.filter((r) => targets.has(r.family));
  const num = (v) => Number(v) || 0;
  const by = (rs, st) => rs.filter((r) => r.CASE_STATUS === st);
  const certified = by(pm, 'Certified'); const certWithdrawn = by(pm, 'Certified - Withdrawn');
  const same = pm.filter((r) => r.family === postingFamily); const other = pm.filter((r) => r.family !== postingFamily);
  const hiring = (rs) => rs.filter((r) => num(r.NEW_EMPLOYMENT) + num(r.CHANGE_EMPLOYER) > 0).length;
  const wages = certified.map((r) => Number(r.WAGE_FROM_ANNUAL)).filter((w) => Number.isFinite(w) && w > 0);
  const dates = pm.map((r) => r.DECISION_DATE).filter(Boolean).sort();
  const status = !pm.length ? 'lca-confirmed-none' : certified.length ? 'lca-pm-filed' : 'lca-pm-uncertified';
  const evidence = labP({
    matched_employer_names: [...ent.rawNames], employer_rows_in_extract: rows.length,
    pm_rows: pm.length, by_status: countBy(pm.map((r) => r.CASE_STATUS)),
    certified_same_family: by(same, 'Certified').length, certified_other_family: by(other, 'Certified').length,
    certified_withdrawn: certWithdrawn.length,
    hiring_lcas_certified: hiring(certified), continuation_only_certified: certified.length - hiring(certified),
    soc_codes_certified: countBy(certified.map((r) => `${r.SOC_CODE} ${r.SOC_TITLE}`.trim())),
    wage_levels_certified: countBy(certified.map((r) => r.PW_WAGE_LEVEL)),
    offered_wage_annual_certified: wages.length ? { min: Math.min(...wages), median: median(wages), max: Math.max(...wages), n: wages.length } : null,
    decision_dates: dates.length ? { first: dates[0], last: dates[dates.length - 1] } : null,
    sample_case_numbers: certified.slice(0, 5).map((r) => r.CASE_NUMBER),
  }, SRC.record, lca.provenance, { status, derived_by: 'exact normalized EMPLOYER_NAME + classifyTitle v1', note: 'certified LCA = filed, not approved' });
  return { status, evidence };
}

export function sponsorshipEvidence(role, persona, idx, shortlistProv = null, rules = V011_RULES) {
  const P = idx.provenance; const R = SRC.record;
  let row = null;
  if (role.csv_name) {
    row = idx.byRaw.get(String(role.csv_name).trim().toUpperCase()) || null;
    if (!row) return { hold: 'csv-name-not-found', detail: `csv_name "${role.csv_name}" is not a company_name in the CSV` };
  } else {
    const hits = idx.byNorm.get(normalizeName(role.company)) || [];
    if (hits.length === 0) return { hold: 'company-not-in-csv', detail: `no CSV row whose normalized name equals "${normalizeName(role.company)}"; supply csv_name after checking by hand` };
    if (hits.length > 1) return { hold: 'ambiguous-company-match', detail: `matches ${hits.map((h) => h.company_name).join(' | ')}` };
    row = hits[0];
  }
  const approvals = numOrNull(row['Total Approvals']);
  const titles = parseTitleList(row.top_job_titles_sponsored);
  const families = titles.map((t) => ({ title: t, family: classifyTitle(t) }));
  const postingFamily = classifyTitle(role.title);
  const targets = new Set(persona.target_families || ['product', 'program']);
  const pmTitles = families.filter((f) => targets.has(f.family));
  const sameFamily = families.filter((f) => f.family === postingFamily && targets.has(f.family));

  let rule;
  if (!approvals) rule = 'no-h1b-record';
  else if (sameFamily.length) rule = 'title-family-match';
  else if (pmTitles.length) rule = 'adjacent-family';
  else rule = 'sponsor-not-pm';
  const { p, tier } = rules.tier_rules[rule];

  return {
    hold: null,
    provenance: P || R,
    csv_row: {
      company_name: labP(row.company_name, R, P),
      matched_by: role.csv_name ? labP('csv_name (human-supplied)', SRC.input, shortlistProv) : labP('exact normalized name', R, P),
      industry: labP(row.industry || null, R, P),
      total_approvals: labP(approvals, R, P),
      total_denials: labP(numOrNull(row['Total Denials']), R, P),
      approval_rate: labP(numOrNull(row.Approval_Rate), R, P),
      median_salary_offered: labP(numOrNull(row.median_salary_offered), R, P, { note: 'company-wide median over sponsored filings, all titles — not a PM wage' }),
      top_titles_sponsored: labP(titles, R, P, { note: 'the CSV stores only top titles, not every filing' }),
      titles_listed: labP(titles.length, R, P),
      latest_funding_date: labP(row.latest_funding_date || null, R, P),
      latest_funding_amount: labP(numOrNull(row.latest_funding_amount), R, P),
      latest_funding_stage: labP(row.latest_funding_stage || null, R, P),
    },
    posting_family: labP(postingFamily, R, shortlistProv, { derived_by: 'classifyTitle v1 on the posting title' }),
    title_families: labP(families, R, P, { derived_by: 'classifyTitle v1' }),
    matched_pm_titles: labP(sameFamily.length ? sameFamily.map((f) => f.title) : pmTitles.map((f) => f.title), R, P),
    ambiguous_titles: labP(families.filter((f) => f.family === 'ambiguous-pm').map((f) => f.title), R, P, { note: 'counted as neither family; a human reads them' }),
    thin_evidence: !!approvals && titles.length <= rules.thin_title_evidence,
    rule: labP(rule, R, P, { derived_by: 'TIER_RULES decision order' }),
    tier: labP(tier, R, P),
    p: labP(p, SRC.input, rules.provenance, { note: `tier→p is a declared mapping (rules ${rules.rules_version}), not a measured probability` }),
  };
}

// Employer tier (1 frontier AI lab · 2 FAANG/top high-tech · 3 other tech · 4 non-tech). No repo record
// measures "how bleeding-edge" an employer is, so the tier is NEVER a scorer term: it only orders roles
// within a decision. Lookup order, each labeled honestly:
//   1. persona.employer_tiers            → your-input (the person's own ranking)
//   2. data/employer_tiers.predicted.json → model-judgment (AI-predicted list)
//   3. fallback rule on the CSV industry → model-judgment, flagged "confirm"; never predicts tier 1 or 2
export const TECH_INDUSTRIES = new Set(['Other Technology', 'Computers', 'Telecommunications']);
export function employerTier(company, persona, predicted, industry, personaProv = null) {
  const k = normalizeName(company);
  for (const [tier, names] of Object.entries(persona.employer_tiers || {}))
    if ((names || []).some((n) => normalizeName(n) === k)) return labP(Number(tier), SRC.input, personaProv, { basis: 'your tier list', confirm: false });
  const hit = (predicted?.companies || []).find((c) => normalizeName(c.name) === k);
  if (hit) return lab(hit.tier, SRC.model, { basis: `AI-predicted list (${predicted.predicted_by}, ${predicted.predicted_on}), unconfirmed`, reason: hit.reason, confirm: true });
  if (industry == null) return lab(3, SRC.model, { basis: 'fallback rule', reason: 'no CSV row and no prediction — defaulted to other tech', confirm: true });
  if (TECH_INDUSTRIES.has(industry)) return lab(3, SRC.model, { basis: 'fallback rule', reason: `CSV industry "${industry}" is a tech category`, confirm: true });
  if (industry === 'Other') return lab(3, SRC.model, { basis: 'fallback rule', reason: 'CSV industry "Other" mixes tech and non-tech (Stripe and Reddit are "Other") — defaulted to other tech', confirm: true });
  return lab(4, SRC.model, { basis: 'fallback rule', reason: `CSV industry "${industry}" is not a tech category`, confirm: true });
}

function nextAction(scored, ev, liveStatus, persona, g4) {
  const rec = scored.recommendation;
  const rule = ev.rule.value;
  if (rec === 'Apply') {
    if (g4.startsWith('cleared')) return { action: 'tailor', hours: '2 (research-and-apply)', text: `Tailor and apply. E-Verify ${g4}.` };
    if (g4.startsWith('blocked')) return { action: 'confirm-e-verify-first', hours: '3 (networking)', text: `Do not tailor yet: ${g4}. Ask HR or a recruiter whether this hiring site uses E-Verify (STEM OPT requirement).` };
    return { action: 'check-e-verify', hours: '2 (research-and-apply)', text: 'G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer).' };
  }
  if (rec === 'Consider' && rule === 'sponsor-not-pm')
    return { action: 'network-first', hours: '3 (networking)', text: 'Network before applying: ask a PM at the company whether PM roles have been sponsored. The record shows H-1B sponsorship, but no product- or program-manager title.' };
  if (rec === 'Consider' && rule === 'adjacent-family')
    return { action: 'network-first', hours: '3 (networking)', text: `Network before applying: the record shows the other PM family sponsored (${ev.matched_pm_titles.value.map((t) => `"${t}"`).join(', ')}), not a "${ev.posting_family.value}" title. Ask whether this title is filed the same way.` };
  if (rule === 'no-h1b-record' && String(liveStatus).startsWith('active') && (scored.trace.votes.find((v) => v.factor === 'fit')?.value ?? 0) >= (persona.fallback_fit_floor ?? 1))
    return { action: 'non-h1b-fallback', hours: '2 (only after H-1B-tier roles)', text: `Second-tier list (persona preference: H-1B first). The scorer's verdict (${rec}) is unchanged; a human decides whether to spend time here.` };
  if (rec === 'Skip' && scored.reason.startsWith('gated: timeline'))
    return { action: 'skip-timeline', hours: '0', text: 'Timeline gate closed: the start date is further away than the remaining unemployment allowance. Revisit only if you are employed on STEM OPT by then.' };
  if (rec === 'Skip' && scored.reason.startsWith('gated: liveness') && rule === 'title-family-match')
    return { action: 'network-list', hours: '3 (networking)', text: 'No live posting, but a proven PM sponsor: add to the informational-interview list for the next opening.' };
  if (rec === 'Consider') return { action: 'human-review', hours: '—', text: 'Consider band: a human reads the trace and decides.' };
  return { action: 'skip', hours: '0', text: 'Skip. Time is better spent elsewhere.' };
}

const DEMO_ACTION = { action: 'none (demo)', hours: '—', text: 'Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed.' };

export function run(opts) {
  const mode = opts.mode === 'sample' ? 'sample' : 'live';
  const R = (p) => path.resolve(REPO, p);
  const rel = (p) => path.relative(REPO, path.resolve(p));
  const asOfStr = opts.asOf || new Date().toISOString().slice(0, 10);
  const asOf = parseDate(asOfStr, '--as-of');
  const persona = JSON.parse(fs.readFileSync(opts.persona, 'utf8'));
  const personaProv = provOf(insideFixtures(opts.persona) || jsonIsFixture(persona));
  const shortlistRaw = JSON.parse(fs.readFileSync(opts.shortlist, 'utf8'));
  const shortlistProv = provOf(insideFixtures(opts.shortlist) || jsonIsFixture(shortlistRaw));
  const roles = Array.isArray(shortlistRaw) ? shortlistRaw : shortlistRaw.roles;
  if (!Array.isArray(roles) || roles.length === 0) throw new InputError('shortlist has no roles');

  // Timeline gate, run-level part: refuse the whole run if OPT end is not in the future.
  const optEnd = parseDate(persona.opt_end_date, 'persona.opt_end_date');
  const cap = numOrNull(persona.unemployment_days_cap), used = numOrNull(persona.unemployment_days_used);
  if (cap == null || used == null || used < 0 || used > cap) throw new InputError('persona.unemployment_days_cap / _used missing or inconsistent');
  timelineFactor({ asOf, optEnd, lagDays: 0, unemploymentLeft: cap - used, employed: true }); // throws code 3 if past (step values irrelevant here)

  // Sample runs default to the frozen v0.1.1 values (labeled fixture); a live run must name its rules file.
  const rulesFile = opts.rules || (mode === 'sample' ? path.join(FIXTURE_DIR, 'rules.v0.1.1.json') : null);
  if (!rulesFile) throw new InputError('live run needs --rules <file>: declare the rule values (tier→p, timeline steps) instead of using the v0.1.1 drafts');
  const rules = loadRules(rulesFile);
  const csvPath = R(opts.csv || DEFAULTS.csv), blsPath = R(opts.bls || DEFAULTS.bls), formdDir = R(opts.formdDir || DEFAULTS.formdDir);
  const idx = loadSponsorIndex(csvPath);
  const formd = loadFormD(formdDir);
  const roleQuality = loadBls(blsPath, persona.candidate_socs || []);
  const okWages = roleQuality.filter((r) => r.status === 'ok').map((r) => r.median_wage);
  const tiersPath = opts.tiersPredicted || DEFAULTS.tiersPredicted;
  const predictedTiers = fs.existsSync(tiersPath) ? JSON.parse(fs.readFileSync(tiersPath, 'utf8')) : null;
  const lcaPath = opts.lca === 'none' ? null : R(opts.lca || DEFAULTS.lca);
  const lca = lcaPath ? loadLca(lcaPath) : null;
  if (opts.lca && opts.lca !== 'none' && !lca) throw new InputError(`LCA extract not found: ${opts.lca}`);
  const livenessFiles = [].concat(opts.liveness || []);
  const { map: live, meta: livenessMeta } = loadLivenessFiles(livenessFiles);

  // Live-run guard: a live run never accepts fixture data standing in for a record. Hard stop, before any write.
  if (mode === 'live') {
    const bad = [];
    for (const m of livenessMeta) if (m.provenance === SRC.fixture) bad.push(`liveness ${m.path}`);
    if (idx.provenance === SRC.fixture) bad.push(`80 Days CSV ${rel(csvPath)}`);
    if (roleQuality.provenance === SRC.fixture) bad.push(`BLS ${rel(blsPath)}`);
    for (const f of formd.fixtureFiles) bad.push(`Form D ${rel(path.join(formdDir, f))}`);
    if (lca?.provenance === SRC.fixture) bad.push(`LCA extract ${rel(lca.path)}`);
    if (bad.length) throw new InputError(`live run refused — fixture-sourced input(s): ${bad.join('; ')}. Fixtures are allowed only with --sample.`, EXIT.liveGuard);
  }

  const evaluated = []; const scorerInput = [];
  for (const role of roles) {
    const holds = [];
    const missing = ['role_id', 'company', 'title', 'url'].filter((k) => !role[k]);
    const fit = numOrNull(role.fit);
    if (missing.length) holds.push({ reason: 'invalid-input', detail: `missing ${missing.join(', ')}` });
    if (fit == null || fit < 0 || fit > 1) holds.push({ reason: 'invalid-input', detail: 'fit must be a number in [0,1] (your-input)' });

    const ev = sponsorshipEvidence(role, persona, idx, shortlistProv, rules);
    if (ev.hold) holds.push({ reason: ev.hold, detail: ev.detail });
    const le = lcaEvidence(role.company, ev.hold ? null : ev.csv_row.company_name.value, classifyTitle(role.title), lca, new Set(persona.target_families || ['product', 'program']));
    if (le.hold) holds.push(le.hold);

    const lg = livenessGate(role.url ? live.get(role.url) : null, role.liveness_human, shortlistProv, livenessFiles.length > 0);
    if (lg.hold) holds.push(lg.hold);
    if (lg.invalid) holds.push(lg.invalid);
    const ever = eVerifyGate(role.e_verify_human, shortlistProv);

    const roleLag = numOrNull(role.hiring_lag_days);
    const lag = roleLag ?? numOrNull(persona.default_hiring_lag_days);
    const lagProv = roleLag != null ? shortlistProv : personaProv;
    if (lag == null || lag < 0) holds.push({ reason: 'invalid-input', detail: 'no hiring_lag_days on role or persona.default_hiring_lag_days' });
    const tl = lag == null ? null : timelineFactor({ asOf, optEnd, lagDays: lag, unemploymentLeft: cap - used, employed: !!persona.currently_employed, steps: rules.timeline_steps });
    const tlProv = personaProv || lagProv || rules.provenance;
    const estStart = lag == null ? null : new Date(asOf.getTime() + lag * DAY);

    const fd = ev.hold ? [] : (formd.byNorm.get(normalizeName(ev.csv_row.company_name.value)) || []);
    const fdProv = provOf(fd.some((x) => x.provenance === SRC.fixture));
    const entry = {
      role_id: role.role_id, company: role.company, title: role.title, url: role.url,
      fit: labP(fit, SRC.input, shortlistProv, { note: role.fit_note || null }),
      sponsorship: ev.hold ? null : ev,
      liveness: lg.liveness,
      timeline: tl && labP(tl.factor, SRC.input, tlProv, { derived_from: `persona dates + hiring-lag assumption via timeline_steps (rules ${rules.rules_version})`, hiring_lag_days: labP(lag, SRC.input, lagProv), days_to_opt_end: tl.days_to_opt_end, slack_days: tl.slack_days, reason: tl.reason }),
      h1b_registration_windows: estStart && labP(registrationWindows(estStart, optEnd), SRC.input, tlProv, { note: 'count of March windows between estimated start and OPT end, from your-input dates; lottery odds are not in the repo' }),
      funding_form_d_sample: fd.length ? labP(fd, SRC.record, fdProv) : lab(null, SRC.none, { status: 'not-in-sample', note: `Form D samples ship ${formd.shipped} of ${formd.total} filings; absence here says nothing about funding` }),
      lca: le.evidence ? { status: le.status, ...le.evidence } : { status: le.status, value: null, source: SRC.none },
      employer_tier: employerTier(role.company, persona, predictedTiers, ev.hold ? null : ev.csv_row.industry.value, personaProv),
      e_verify: ever.e_verify,
      gates: { g1_entity: ev.hold ? `held — ${ev.hold}` : `matched — ${ev.csv_row.matched_by.value}${ev.provenance === SRC.fixture ? ' (fixture data)' : ''}`, g2_liveness: lg.g2, g3_timeline: tl ? `factor ${tl.factor} — ${tl.reason}` : 'held — no hiring lag', g4_decision: ever.g4 },
      holds,
    };
    evaluated.push(entry);
    if (holds.length === 0) {
      const terms = {
        sponsorship: { p: ev.p.value, tier: ev.tier.value, source: ev.provenance === SRC.fixture ? SRC.fixture : SRC.record },
        fit: { p: fit, source: entry.fit.source },
        liveness: { factor: lg.liveness.value, source: lg.liveness.source },
        timeline: { factor: tl.factor, source: entry.timeline.source },
      };
      entry.fixture_terms = Object.entries(terms).filter(([, t]) => t.source === SRC.fixture).map(([k]) => k);
      scorerInput.push({ role_id: role.role_id, company: role.company, title: role.title, ...terms });
    }
  }

  fs.mkdirSync(opts.out, { recursive: true });
  const rolesPath = path.join(opts.out, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(scorerInput, null, 2) + '\n');

  let scores = null; let scorerStdout = '';
  if (scorerInput.length) {
    const profilePath = path.join(opts.out, 'scorer-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify({ authorization: persona.authorization }, null, 2) + '\n');
    const r = spawnSync(process.execPath, [R(opts.scorer || DEFAULTS.scorer), rolesPath, '--profile', profilePath, '--out-dir', opts.out], { cwd: REPO, encoding: 'utf8' });
    scorerStdout = (r.stdout || '') + (r.stderr || '');
    if (r.status !== 0) throw new InputError(`scorer exited ${r.status}: ${scorerStdout.trim()}`, EXIT.scorer);
    scores = JSON.parse(fs.readFileSync(path.join(opts.out, 'role-scores.json'), 'utf8'));
    if (scores.profile_needs_sponsorship !== true)
      throw new InputError(`scorer read the profile authorization ${JSON.stringify(persona.authorization)} as NOT needing sponsorship — sponsorship weight would be 0. Refusing to report. (The scorer's regex matches words like "authorized".)`, EXIT.scorer);
  }

  const byId = new Map((scores?.roles || []).map((s) => [s.role_id, s]));
  for (const e of evaluated) {
    const s = byId.get(e.role_id);
    if (!s) { e.decision = 'HOLD'; e.next_action = { action: 'resolve-hold', hours: '—', text: e.holds.map((h) => `${h.reason}: ${h.detail}`).join('; ') }; continue; }
    e.composite = s.composite; e.scorer_reason = s.reason; e.scorer_trace = s.trace;
    if (e.fixture_terms.length) {
      // Fixture rows carry no actionable verdict.
      e.decision = 'DEMO';
      e.would_be_if_live = { recommendation: s.recommendation, composite: s.composite, reason: s.reason, fixture_terms: e.fixture_terms };
      e.next_action = DEMO_ACTION;
    } else {
      e.decision = s.recommendation;
      e.next_action = nextAction(s, e.sponsorship, e.liveness.status, persona, e.gates.g4_decision);
    }
  }

  const count = (d) => evaluated.filter((e) => e.decision === d).length;
  const wouldBe = (d) => evaluated.filter((e) => e.would_be_if_live?.recommendation === d).length;
  const log = {
    recipe: 'pm-sponsor-title-match', recipe_version: '0.2.0', prototype: rel(fileURLToPath(import.meta.url)),
    as_of: asOfStr, mode, generated_at: new Date().toISOString(),
    inputs: {
      shortlist: { path: rel(opts.shortlist), provenance: shortlistProv || SRC.input },
      persona: { path: rel(opts.persona), provenance: personaProv || SRC.input },
      liveness: livenessMeta,
      employer_tiers_predicted: predictedTiers ? rel(tiersPath) : null,
      csv: { path: rel(csvPath), sha256: sha256(csvPath), rows: idx.rows, provenance: idx.provenance || SRC.record },
      bls: { path: rel(blsPath), sha256: sha256(blsPath), provenance: roleQuality.provenance || SRC.record },
      form_d_samples: { dir: rel(formdDir), files: formd.files, fixture_files: formd.fixtureFiles, companies_shipped: formd.shipped, companies_in_full_quarters: formd.total },
      lca: lca ? { path: rel(lca.path), rows: lca.rows, sha256: lca.sha256, integrity: lca.integrity, provenance: lca.provenance || SRC.record, role_in_tiers: 'context only (v0.2.0-pre: tier use pending the student\'s review sheet)' } : null,
    },
    persona_inputs: {
      authorization: labP(persona.authorization, SRC.input, personaProv), opt_end_date: labP(persona.opt_end_date, SRC.input, personaProv),
      unemployment_days_used: labP(used, SRC.input, personaProv), unemployment_days_cap: labP(cap, SRC.input, personaProv),
      currently_employed: labP(!!persona.currently_employed, SRC.input, personaProv), default_hiring_lag_days: labP(persona.default_hiring_lag_days, SRC.input, personaProv),
      employer_tiers: labP(persona.employer_tiers || {}, SRC.input, personaProv, { note: 'ordering only — not a scorer term; companies not listed get a model-judgment tier (predicted list, then fallback rule)' }),
      candidate_socs: labP(persona.candidate_socs || [], SRC.input, personaProv, { note: 'which SOC an employer files a PM role under is not visible from the posting' }),
    },
    rules: { version: rules.rules_version, file: rules.file, provenance: rules.provenance || SRC.input, tier_rules: rules.tier_rules, timeline_steps: rules.timeline_steps, thin_title_evidence: rules.thin_title_evidence, classifier: 'classifyTitle v1' },
    role_quality_context: {
      vote_weight_in_scorer: 0, why: 'role-scorer.mjs sets role_quality 0.0 [VERIFY]; this recipe keeps it 0 because the PM SOC code is unknown at posting time',
      candidate_socs: roleQuality,
      median_wage_spread: okWages.length ? labP({ min: Math.min(...okWages), max: Math.max(...okWages) }, SRC.record, roleQuality.provenance) : null,
    },
    summary: { evaluated: evaluated.length, scored: scorerInput.length, apply: count('Apply'), consider: count('Consider'), skip: count('Skip'), hold: count('HOLD'), demo: count('DEMO'),
      would_be_if_live: { apply: wouldBe('Apply'), consider: wouldBe('Consider'), skip: wouldBe('Skip') } },
    scorer: scores ? { command: `node ${DEFAULTS.scorer} ${rel(rolesPath)} --profile ${rel(path.join(opts.out, 'scorer-profile.json'))} --out-dir ${rel(opts.out)}`, stdout: scorerStdout.trim(), profile_needs_sponsorship: scores.profile_needs_sponsorship, outputs: ['role-scores.json', 'role-scores.md'] } : { skipped: 'no role cleared every hold' },
    roles: evaluated,
    stop_conditions_hit: evaluated.filter((e) => e.decision === 'HOLD').map((e) => ({ role_id: e.role_id, holds: e.holds })),
  };
  fs.writeFileSync(path.join(opts.out, 'pm-triage-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.out, 'pm-triage-report.md'), renderReport(log));
  return log;
}

const tierCell = (t) => (t == null || t.value == null ? '—' : `${t.value}${t.source === SRC.input || t.source === SRC.fixture ? '' : t.basis === 'fallback rule' ? ' (guess)' : ' (predicted)'}`);
const money = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
const cell = (s) => String(s ?? '—').replace(/\|/g, '/').replace(/\n/g, ' ');
const srcTag = (v) => (v?.source === SRC.fixture ? ' [fixture]' : '');

export function renderReport(log) {
  const s = log.summary; const o = [];
  const order = { Apply: 0, Consider: 1, DEMO: 2, HOLD: 3, Skip: 4 };
  const tierKey = (r) => r.employer_tier?.value ?? 99;
  const roles = [...log.roles].sort((a, b) => (order[a.decision] - order[b.decision]) || (tierKey(a) - tierKey(b)) || ((b.composite ?? -1) - (a.composite ?? -1)));
  const tiers = (t) => log.roles.filter((r) => r.sponsorship?.tier.value === t).length;
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  o.push(`# PM sponsor title-match — triage report (${log.as_of}${log.mode === 'sample' ? ', SAMPLE' : ''})`, '');
  o.push('## Executive summary', '');
  o.push(`This report checks ${s.evaluated} product-manager job postings for one question most sponsor lists skip: has the company sponsored work visas *for product-manager titles*, or only for other jobs? It also checks whether each posting is still open and whether the hiring timeline fits the student's remaining work-authorization allowance, then says what to do next with each one.`, '');
  if (s.demo) o.push(`**This run used test (fixture) data, so ${n(s.demo, 'row is a demonstration', 'rows are demonstrations')} (DEMO) with no actionable verdict.** The "Would be if live" column shows what the scorer computed: Apply ${s.would_be_if_live.apply} · Consider ${s.would_be_if_live.consider} · Skip ${s.would_be_if_live.skip}. Nothing on fixture data clears a gate.`, '');
  if (s.demo && s.apply + s.consider + s.skip === 0) o.push(`Of ${s.evaluated} postings, ${n(s.demo, 'was', 'were')} scored only as a demonstration and ${n(s.hold, 'is', 'are')} on hold because something could not be verified. No row in this report is actionable. ${tiers('Proven')} postings are at companies whose sponsorship record shows a product-manager-family title; ${tiers('Possible')} are at companies that sponsor visas but show no such title in the record.`, '');
  else o.push(`Read it before spending tailoring time: of ${s.evaluated} postings, **${n(s.apply, 'is', 'are')} worth applying to now, ${n(s.consider, 'needs', 'need')} a human look or a networking conversation first, ${n(s.skip, 'is a skip', 'are skips')}, and ${n(s.hold, 'is', 'are')} on hold** because something could not be verified (the company could not be matched to a record, or the posting's status was uncertain). Held postings were not scored. ${tiers('Proven')} postings are at companies whose sponsorship record shows a product-manager-family title; ${tiers('Possible')} are at companies that sponsor visas but show no such title in the record. Within each group, postings are ordered by the employer tier you set (your preference, not a record); the tier never changes a decision.`, '');
  o.push('Nothing here is a guarantee of sponsorship. The record shows past filings, not future intent. Every "apply" still needs a named human to confirm the employer uses E-Verify (required for STEM OPT).', '');
  o.push('## Decisions and next actions', '');
  o.push('| Decision | Would be if live | Employer tier (yours unless marked) | Company — role | Composite | Sponsorship evidence | Liveness | Gates (G2 liveness · G4 E-Verify) | Next action (3-3-2 block) |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of roles) {
    const sp = r.sponsorship;
    const spCell = !sp ? 'not matched'
      : sp.rule.value === 'no-h1b-record' ? `None (no H-1B record in this dataset — absence, not proof of non-sponsorship); matched ${sp.csv_row.company_name.value}${srcTag(sp.tier)}`
      : `${sp.tier.value} (${sp.rule.value})${srcTag(sp.tier)}; approvals ${sp.csv_row.total_approvals.value}; PM titles on record: ${sp.matched_pm_titles.value.length ? sp.matched_pm_titles.value.map((t) => `"${t}"`).join(', ') : 'none'}${sp.ambiguous_titles.value.length ? '; ambiguous, not counted: ' + sp.ambiguous_titles.value.map((t) => `"${t}"`).join(', ') : ''}${sp.thin_evidence ? ` · ⚠ thin: only ${sp.csv_row.titles_listed.value} title(s) stored` : ''}`;
    const wb = r.would_be_if_live ? `${r.would_be_if_live.recommendation} (${r.would_be_if_live.composite.toFixed(3)})` : '—';
    o.push(`| **${r.decision}** | ${wb} | ${tierCell(r.employer_tier)} | ${cell(r.company)} — ${cell(r.title)} | ${r.composite == null ? '—' : r.composite.toFixed(3)} | ${cell(spCell)} | ${cell(r.liveness.status)}${srcTag(r.liveness)} | ${cell(r.gates.g2_liveness)} · ${cell(r.gates.g4_decision)} | ${cell(r.next_action.action)} [${cell(r.next_action.hours)}]: ${cell(r.next_action.text)} |`);
  }
  o.push('');
  const held = roles.filter((r) => r.decision === 'HOLD'); // tier-1 holds first: resolve those before the rest
  if (held.length) {
    o.push('## Holds — a human must resolve these', '');
    for (const r of held) o.push(`- **${r.company} — ${r.title}** (tier ${tierCell(r.employer_tier)}): ${r.holds.map((h) => `\`${h.reason}\` ${h.detail}`).join('; ')}`);
    o.push('');
  }
  const matched = log.roles.filter((r) => r.sponsorship);
  if (matched.length) {
    o.push('## Funding context (record — not a vote in the scorer)', '');
    o.push('| Company (CSV row) | Latest funding date | Stage | Amount | In Form D samples? |', '|---|---|---|---|---|');
    const seen = new Set();
    for (const r of matched) {
      const c = r.sponsorship.csv_row; if (seen.has(c.company_name.value)) continue; seen.add(c.company_name.value);
      const fd = r.funding_form_d_sample;
      o.push(`| ${cell(c.company_name.value)} | ${cell(c.latest_funding_date.value)} | ${cell(c.latest_funding_stage.value)} | ${money(c.latest_funding_amount.value)} | ${fd.value ? fd.value.map((x) => `${x.quarter} filed ${x.date_filed}, sold ${money(x.total_amount_sold)} (acc. ${x.accession_number})`).join('; ') : fd.status} |`);
    }
    o.push('', `The Form D samples hold ${log.inputs.form_d_samples.companies_shipped} of ${log.inputs.form_d_samples.companies_in_full_quarters} filings, so "not-in-sample" says nothing about whether a company raised money.`, '');
  }
  const toConfirm = []; const seenCo = new Set();
  for (const r of roles) if (r.employer_tier?.confirm && !seenCo.has(r.company)) { seenCo.add(r.company); toConfirm.push(r); }
  if (toConfirm.length) {
    o.push('## Employer tiers to confirm (model judgment — not yours yet)', '');
    o.push('These tiers were predicted, not set by you. Move a company into your own tier list to confirm or change it. Tiers only order postings within a decision.', '');
    o.push('| Company | Predicted tier | Basis | Reason |', '|---|---|---|---|');
    for (const r of toConfirm) o.push(`| ${cell(r.company)} | ${r.employer_tier.value} | ${cell(r.employer_tier.basis)} | ${cell(r.employer_tier.reason)} |`);
    o.push('');
  }
  if (log.inputs.lca) {
    o.push('## Per-filing evidence — DOL labor condition applications (context)', '');
    o.push('A certified LCA means the employer *filed* for this kind of title (the step before an H-1B petition). It is **not** a visa approval and does not mean anyone was hired. "Unknown" means no LCA employer name matched exactly; it is not evidence of absence.', '');
    o.push('| Company — role | LCA status | PM-family LCAs (certified: same family / other family) | Hiring vs continuation (certified) | SOC codes used (certified) | Offered wage, annual (certified) | Sample case numbers |', '|---|---|---|---|---|---|---|');
    for (const r of roles) {
      const v = r.lca?.value;
      const w = v?.offered_wage_annual_certified;
      o.push(`| ${cell(r.company)} — ${cell(r.title)} | ${cell(r.lca?.status)}${srcTag(r.lca)} | ${v ? `${v.certified_same_family} / ${v.certified_other_family} (of ${v.pm_rows} PM rows; ${v.certified_withdrawn} certified-withdrawn)` : '—'} | ${v ? `${v.hiring_lcas_certified} new or change-employer · ${v.continuation_only_certified} continuation-only` : '—'} | ${v ? cell(Object.entries(v.soc_codes_certified).map(([k, c]) => `${k} ×${c}`).join('; ') || '—') : '—'} | ${w ? `${money(w.min)} – ${money(w.max)} (median ${money(w.median)}, n=${w.n})` : '—'} | ${v ? cell(v.sample_case_numbers.join(', ') || '—') : '—'} |`);
    }
    o.push('', `Extract: \`${log.inputs.lca.path}\` (${log.inputs.lca.rows} rows, ${log.inputs.lca.integrity}, ${log.inputs.lca.provenance}). ${log.inputs.lca.role_in_tiers}.`, '');
  }
  o.push('## Role quality (context only — carries no weight)', '');
  o.push('There is no O*NET occupation called "Product Manager". The SOC code a company files under is chosen at visa-filing time and is not on the posting, so the national median wage below is shown for each plausible code rather than picked for you.', '');
  o.push('| SOC (your-input candidate) | BLS title | National median |', '|---|---|---|');
  for (const q of log.role_quality_context.candidate_socs) o.push(`| ${q.soc} | ${cell(q.title)} | ${q.status === 'ok' ? money(q.median_wage) : `missing: ${q.missing_reason}`}${srcTag(q)} |`);
  const sp = log.role_quality_context.median_wage_spread?.value;
  if (sp) o.push('', `Spread across candidate codes: ${money(sp.min)} – ${money(sp.max)}. That spread is why this recipe keeps the scorer's role-quality weight at 0.`);
  o.push('', '## What was verified vs. what was assumed', '');
  o.push('- **Record** (read from a real file in the repo or produced by a real check): approvals, denials, sponsored-title strings, funding dates, BLS medians, the liveness checker\'s verdict, the title-family classification (a fixed rule applied to record strings).');
  o.push('- **Your input** (the person decided): fit ratings, OPT end date, unemployment days used, hiring-lag assumption, candidate SOC codes, any `csv_name` used to resolve a company match, a named human\'s liveness or E-Verify check, the tier→number mapping and the timeline steps.');
  const fx = [...new Set(log.roles.flatMap((r) => r.fixture_terms || []))];
  if (fx.length) o.push(`- **Fixture** (test data, never a record): ${fx.join(', ')} on the DEMO rows. Fixture values cannot clear a gate and produce no verdict.`);
  const mj = log.roles.filter((r) => r.employer_tier?.source === SRC.model).length;
  o.push(mj ? `- **Model judgment**: ${mj} employer tier(s) marked "(predicted)" or "(guess)", not yet confirmed by you. They only order rows. No language model was called during this run.`
            : '- **Model judgment**: none. Every employer tier here is your own, and no language model was called during this run.');
  o.push('- **Not checked by this tool**: whether a PM sponsorship exists beyond the top titles the CSV stores; what this employer pays; whether the posting will sponsor *this* hire. E-Verify is checked only where a named human recorded it.');
  o.push(`- **Form D coverage is the shipped sample only**: ${log.inputs.form_d_samples.companies_shipped} of ${log.inputs.form_d_samples.companies_in_full_quarters} filings, so a company's absence from it says nothing about its funding.`, '');
  o.push('## Run record', '');
  o.push(`- As-of: ${log.as_of} · mode: ${log.mode} · recipe v${log.recipe_version} · rules ${log.rules.version} (\`${log.rules.file}\`, ${log.rules.provenance})`);
  o.push(`- 80 Days CSV: \`${log.inputs.csv.path}\` (${log.inputs.csv.rows} rows, sha256 ${log.inputs.csv.sha256.slice(0, 12)}…, ${log.inputs.csv.provenance})`);
  o.push(`- Liveness: ${log.inputs.liveness.length ? log.inputs.liveness.map((m) => `\`${m.path}\` (${m.format}, ${m.urls} URLs, ${m.provenance})`).join('; ') : 'none'}`);
  o.push(`- Form D: ${log.inputs.form_d_samples.files.length} sample files, ${log.inputs.form_d_samples.companies_shipped} of ${log.inputs.form_d_samples.companies_in_full_quarters} companies shipped`);
  o.push(`- Scorer: ${log.scorer.command ? '`' + log.scorer.command + '`' : log.scorer.skipped} → ${log.scorer.stdout ? cell(log.scorer.stdout.split('\n')[0]) : ''}`);
  o.push(`- Full per-term trace: \`pm-triage-log.json\` (agent log) and \`role-scores.md\` (scorer's own audit).`);
  o.push('', '*Gate status: see the Gates column. A gate counts as cleared only by a real check or a named human, never by fixture data, and the run is accepted only when a named person records it in the run log.*');
  return o.join('\n') + '\n';
}

function parseArgs(argv) {
  const o = {}; const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes('--sample')) {
    Object.assign(o, {
      mode: 'sample', shortlist: path.join(FIXTURE_DIR, 'shortlist.sample.json'), persona: path.join(FIXTURE_DIR, 'persona.sample.json'),
      liveness: [path.join(FIXTURE_DIR, 'liveness.sample.txt')], out: path.join(REPO, 'course/2026fa/submissions/aravindravi7/runs/sample'), asOf: '2026-10-03',
    });
  }
  const lv = argv.flatMap((a, i) => (a === '--liveness' ? [argv[i + 1]] : []));
  if (lv.length) o.liveness = lv;
  for (const [k, f] of [['shortlist', '--shortlist'], ['persona', '--persona'], ['out', '--out'], ['tiersPredicted', '--tiers-predicted'], ['asOf', '--as-of'], ['csv', '--csv'], ['bls', '--bls'], ['formdDir', '--formd-dir'], ['lca', '--lca'], ['rules', '--rules']]) {
    const v = flag(f); if (v !== undefined) o[k] = v;
  }
  if (!o.mode) o.mode = 'live';
  return o;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.shortlist || !opts.persona || !opts.out) {
    console.error('Usage: pm-sponsor-triage.mjs --sample\n       pm-sponsor-triage.mjs --shortlist s.json --persona p.json --liveness l.jsonl --out dir [--as-of YYYY-MM-DD]');
    process.exit(EXIT.usage);
  }
  try {
    const log = run(opts);
    const s = log.summary;
    const demo = s.demo ? ` · DEMO ${s.demo} (would be if live: Apply ${s.would_be_if_live.apply} · Consider ${s.would_be_if_live.consider} · Skip ${s.would_be_if_live.skip})` : '';
    console.log(`✓ pm-sponsor-triage ${log.as_of} [${log.mode}]: ${s.evaluated} evaluated → Apply ${s.apply} · Consider ${s.consider} · Skip ${s.skip} · HOLD ${s.hold}${demo} (${s.scored} sent to scorer)`);
    if (log.scorer.stdout) console.log('  scorer: ' + log.scorer.stdout.split('\n')[0]);
    console.log(`  ${path.relative(process.cwd(), path.join(opts.out, 'pm-triage-log.json'))}  +  ${path.relative(process.cwd(), path.join(opts.out, 'pm-triage-report.md'))}`);
    for (const e of log.stop_conditions_hit) console.log(`  HOLD ${e.role_id}: ${e.holds.map((h) => h.reason).join(', ')}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(e instanceof InputError ? e.code : 1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
