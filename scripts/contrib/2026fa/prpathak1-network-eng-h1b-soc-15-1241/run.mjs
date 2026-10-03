#!/usr/bin/env node
// run.mjs — network-eng-h1b prototype (sample mode).
// Recipe: recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md v0.1.0
// Decisions: course/2026fa/submissions/prpathak1/CHANGE-BRIEF.md (r1–r3)
//
//   node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
//        [--persona <json>] [--candidates <json>] [--run-date YYYY-MM-DD] [--run-id <id>]
//
// Order: PII guard → G0 profile pre-check (real scorer) → G2a timeline inputs →
// per role: sponsorship lookup → G1 liveness → G2 timeline → real scorer (CLI) →
// run.json (agent) + report.md (person) in course/2026fa/submissions/prpathak1/runs/<run_id>/.
//
// Exit: 0 every role scored · 1 run complete, ≥1 role missing or not scored ·
//       2 run stopped (G0, G2a, bad input, PII, scorer error) — nothing scored.
//
// The scorer is never copied: it is run with `npm run score` and its
// role-scores.json is read back. Company names are normalized by the repo's
// own normalize_company_name() (scripts/sec/entity-resolution.py) via
// normalize_names.py. CSV columns phone / executive_officers /
// board_directors are never read into memory as values, logged, or written.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../../../..');
const FOLDER = 'scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241';

export const PATHS = {
  csv: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  formdDir: 'data/sec/form-d/processed/sample',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
  scorer: 'scripts/score/role-scorer.mjs',
  normalizer: `${FOLDER}/normalize_names.py`,
  runsRoot: 'course/2026fa/submissions/prpathak1/runs',
  persona: `${FOLDER}/fixtures/persona.json`,
  candidates: `${FOLDER}/fixtures/candidates.json`,
  recipe: 'recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md',
};

// Rules decided by the person (CHANGE-BRIEF r1–r3). They are your-input, not data:
// every value they produce is labeled your-input (or derived from it).
export const RULES = {
  source: 'CHANGE-BRIEF.md r1-r3 (your-input)',
  network_keyword: { must_contain: 'network', and_one_of: ['engineer', 'architect', 'administrator', 'admin'] },
  sponsorship: {
    network_match: { tier: 'Likely', p: 0.6 },
    approvals_no_network: { tier: 'Possible', p: 0.5 },
    zero_approvals: { tier: 'None', p: 0 },
  },
  timeline: { full_slack_days: 30, factor_full: 1.0, factor_partial: 0.5, factor_closed: 0 },
  opt_start_max_days_after_program_end: 60,
  liveness: { active: 1.0, expired: 0.0 },
  bls_context_onet_soc: '15-1241.00',
};

// Only these 80-days CSV columns are ever turned into values.
const CSV_COLUMNS = ['company_name', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'top_job_titles_sponsored'];
const NEVER = ['phone', 'executive_officers', 'board_directors'];

export const LBL = { record: 'record', model: 'model-judgment', input: 'your-input' };
const V = (value, label, source, derived_from) =>
  derived_from ? { value, label, source, derived_from } : { value, label, source };

/** Label of a computed value: record only if every input is a record. */
export function weakestLabel(labels) {
  if (labels.every((l) => l === LBL.record)) return LBL.record;
  if (labels.includes(LBL.model)) return LBL.model;
  return LBL.input;
}

// ── small parsers ─────────────────────────────────────────────────────────

/** RFC 4180 CSV → array of rows (handles quotes, "" escapes, CRLF/LF, BOM). */
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* CRLF: drop the CR */ }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Keep only the named columns. Throws if a named column is absent. */
export function csvToObjects(rows, wanted) {
  const header = rows[0];
  const idx = wanted.map((w) => {
    const i = header.indexOf(w);
    if (i < 0) throw new Error(`CSV column missing: "${w}"`);
    return i;
  });
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(wanted.map((w, k) => [w, r[idx[k]] ?? ''])));
}

/** Python list-of-strings literal, e.g. "['A', \"B's\"]" → ['A', "B's"]. null if not that shape. */
export function parsePyStrList(s) {
  s = String(s).trim();
  if (!s.startsWith('[') || !s.endsWith(']')) return null;
  const out = [];
  let i = 1;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  ws();
  if (s[i] === ']') return i === s.length - 1 ? out : null;
  while (i < s.length) {
    ws();
    const q = s[i];
    if (q !== "'" && q !== '"') return null;
    i++;
    let v = '';
    while (i < s.length && s[i] !== q) {
      if (s[i] === '\\') { const n = s[i + 1]; v += n === 'n' ? '\n' : n === 't' ? '\t' : n; i += 2; continue; }
      v += s[i++];
    }
    if (i >= s.length) return null;
    i++;
    out.push(v);
    ws();
    if (s[i] === ',') { i++; continue; }
    if (s[i] === ']' && i === s.length - 1) return out;
    return null;
  }
  return null;
}

// ── dates ─────────────────────────────────────────────────────────────────

const DAY = 86400000;
export function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);

// ── rules ─────────────────────────────────────────────────────────────────

export function isNetworkTitle(title, rule = RULES.network_keyword) {
  const t = String(title).toLowerCase();
  return t.includes(rule.must_contain) && rule.and_one_of.some((w) => t.includes(w));
}

/** Sponsorship lookup for one company. rows = CSV rows sharing its normalized name. */
export function mapSponsorship(rows, rules = RULES) {
  if (!rows || rows.length === 0) return { status: 'missing', reason: 'no row in 80-days CSV for this normalized company name' };
  if (rows.length > 1) return { status: 'missing', reason: `ambiguous: ${rows.length} rows in 80-days CSV share this normalized company name` };
  const row = rows[0];
  const raw = row['Total Approvals'].trim();
  if (raw === '') return { status: 'missing', reason: 'Total Approvals is empty (no H-1B record for this company in the dataset)', row };
  const approvals = Number(raw);
  if (!Number.isFinite(approvals) || approvals < 0 || !Number.isInteger(approvals))
    return { status: 'missing', reason: `Total Approvals is not a whole non-negative number: "${raw}"`, row };
  const rawTitles = row.top_job_titles_sponsored.trim();
  const titles = rawTitles === '' ? [] : parsePyStrList(rawTitles);
  if (titles === null) return { status: 'missing', reason: 'top_job_titles_sponsored could not be parsed as a list of titles', row };
  const matched = titles.filter((t) => isNetworkTitle(t, rules.network_keyword));
  let m;
  if (approvals >= 1 && matched.length) m = rules.sponsorship.network_match;
  else if (approvals >= 1) m = rules.sponsorship.approvals_no_network;
  else m = rules.sponsorship.zero_approvals;
  return { status: 'ok', row, approvals, titles, matched, tier: m.tier, p: m.p };
}

/** Sample liveness → gate factor. Anything but active/expired is not scored. */
export function mapLiveness(result, rules = RULES) {
  if (result === 'active' || result === 'expired') return { ok: true, factor: rules.liveness[result] };
  return { ok: false, reason: result == null ? 'no liveness result: posting not checked' : `liveness result "${result}" is not active or expired` };
}

/** G2a: are the timeline inputs present and consistent? */
export function checkTimelineInputs(persona, runDate, rules = RULES) {
  const v = persona?.visa ?? {};
  const errors = [];
  const pe = parseDate(v.program_end_date), os = parseDate(v.opt_start_date);
  const lim = v.unemployment_limit_days, used = v.unemployment_days_used, lag = persona?.hiring_lag_days;
  if (!pe) errors.push('visa.program_end_date missing or not YYYY-MM-DD');
  if (!os) errors.push('visa.opt_start_date missing or not YYYY-MM-DD');
  if (!Number.isInteger(lim) || lim <= 0) errors.push('visa.unemployment_limit_days must be a positive whole number');
  if (!Number.isInteger(used) || used < 0) errors.push('visa.unemployment_days_used must be a whole number >= 0');
  if (!Number.isInteger(lag) || lag < 0) errors.push('hiring_lag_days must be a whole number >= 0');
  if (pe && os) {
    const latest = addDays(pe, rules.opt_start_max_days_after_program_end);
    if (os < pe) errors.push(`OPT start ${iso(os)} is before program end ${iso(pe)}`);
    if (os > latest) errors.push(`OPT start ${iso(os)} is more than ${rules.opt_start_max_days_after_program_end} days after program end ${iso(pe)} (latest allowed ${iso(latest)})`);
  }
  if (os && Number.isInteger(used) && runDate < os && used !== 0)
    errors.push(`unemployment_days_used is ${used}, but OPT has not started (starts ${iso(os)}); it must be 0`);
  return { valid: errors.length === 0, errors };
}

/** G2: slack = (OPT start + limit) − (run date + hiring lag), in days → factor. */
export function computeTimeline(persona, runDate, rules = RULES) {
  const os = parseDate(persona.visa.opt_start_date);
  const windowEnd = addDays(os, persona.visa.unemployment_limit_days);
  const earliest = addDays(runDate, persona.hiring_lag_days);
  const slack = daysBetween(earliest, windowEnd);
  const t = rules.timeline;
  const factor = slack >= t.full_slack_days ? t.factor_full : slack >= 0 ? t.factor_partial : t.factor_closed;
  return { opt_window_end: iso(windowEnd), earliest_hire_date: iso(earliest), slack_days: slack, timeline_factor: factor, closed: slack < 0 };
}

// ── external calls (local only; no network) ───────────────────────────────

/** Repo normalizer via Python (through a shell: python3 may be a .cmd shim on Windows). */
export function normalizeNames(names) {
  const out = execSync(`python3 -B "${PATHS.normalizer}"`, {
    cwd: REPO, input: JSON.stringify(names), maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const arr = JSON.parse(out.toString('utf8'));
  if (!Array.isArray(arr) || arr.length !== names.length) throw new Error('normalizer returned a list of the wrong length');
  return arr;
}

const relRepo = (p) => path.relative(REPO, path.resolve(REPO, p)).split(path.sep).join('/');

/** Run the real scorer CLI. Never a copy. */
export function runScorer(rolesPath, profilePath, outDir) {
  const cmd = `npm run score -- "${relRepo(rolesPath)}" --profile "${relRepo(profilePath)}" --out-dir "${relRepo(outDir)}"`;
  const stdout = execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { cmd, stdout: stdout.trim() };
}

/** G0: does the real scorer read this profile the way the persona says it should? */
export function runG0(personaPath, persona, outDir) {
  const base = { authorization_string: persona?.authorization ?? null, persona_needs_sponsorship: persona?.needs_sponsorship ?? null };
  if (typeof persona?.authorization !== 'string')
    return { ...base, passed: false, error: 'persona.authorization must be a string (the scorer reads only profile.authorization, role-scorer.mjs:58)' };
  if (typeof persona?.needs_sponsorship !== 'boolean')
    return { ...base, passed: false, error: 'persona.needs_sponsorship must be true or false (your-input)' };
  const probeDir = path.join(outDir, 'g0-probe');
  fs.mkdirSync(probeDir, { recursive: true });
  // Probe values only make the scorer run; they never enter a decision.
  const probe = [{ role_id: 'g0-probe', company: '(probe)', title: '(probe)',
    sponsorship: { p: 0.5, tier: 'Possible', source: LBL.input }, fit: { p: 0.5, source: LBL.input },
    liveness: { factor: 1, source: LBL.input }, timeline: { factor: 1, source: LBL.input } }];
  const probePath = path.join(probeDir, 'probe-roles.json');
  fs.writeFileSync(probePath, JSON.stringify(probe, null, 2) + '\n');
  const { cmd } = runScorer(probePath, personaPath, probeDir);
  const out = JSON.parse(fs.readFileSync(path.join(probeDir, 'role-scores.json'), 'utf8'));
  const scorerSays = out.profile_needs_sponsorship;
  const passed = scorerSays === persona.needs_sponsorship;
  return { ...base, scorer_profile_needs_sponsorship: scorerSays, passed, probe_out_dir: relRepo(probeDir), command: cmd,
    error: passed ? null : `G0 failed: persona needs_sponsorship=${persona.needs_sponsorship} (your-input) but the scorer read profile_needs_sponsorship=${scorerSays} from authorization "${persona.authorization}" (role-scorer.mjs:58-60). The profile is not reworded; nothing is scored.` };
}

// ── PII guard ─────────────────────────────────────────────────────────────

// Messages never repeat the offending address: a guard must not re-leak what it caught.
export function piiProblems(persona, candidatesText) {
  const problems = new Set();
  const email = persona?.candidate?.email;
  if (typeof email !== 'string' || !/^[^@\s]+@example\.com$/i.test(email))
    problems.add('persona.candidate.email is not an @example.com address (value withheld)');
  const check = (where, text) => {
    for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g))
      if (!/^example\.(com|org)$/i.test(m[1])) problems.add(`${where} contains a non-example email address (value withheld)`);
  };
  check('persona file', JSON.stringify(persona));
  check('candidates file', candidatesText);
  return [...problems];
}

/** Every opening needs a unique non-empty role_id and a non-empty company and title. */
export function candidateProblems(candidates) {
  const problems = [];
  if (!Array.isArray(candidates?.roles) || candidates.roles.length === 0) return ['candidates file needs a non-empty "roles" array'];
  const ids = new Set();
  candidates.roles.forEach((r, i) => {
    const at = `roles[${i}]`;
    if (typeof r?.role_id !== 'string' || !r.role_id.trim()) problems.push(`${at}.role_id is missing or empty`);
    else if (ids.has(r.role_id)) problems.push(`${at}.role_id "${r.role_id}" is duplicated`);
    else ids.add(r.role_id);
    if (typeof r?.company !== 'string' || !r.company.trim()) problems.push(`${at}.company is missing or empty`);
    if (typeof r?.title !== 'string' || !r.title.trim()) problems.push(`${at}.title is missing or empty`);
  });
  return problems;
}

// ── main ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const a = { persona: PATHS.persona, candidates: PATHS.candidates, runDate: null, runId: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--persona') { a.persona = v; i++; }
    else if (k === '--candidates') { a.candidates = v; i++; }
    else if (k === '--run-date') { a.runDate = v; i++; }
    else if (k === '--run-id') { a.runId = v; i++; }
    else throw new Error(`unknown argument: ${k}`);
  }
  return a;
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const nowId = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

export function main(argv = process.argv.slice(2)) {
  const generatedAt = new Date().toISOString();
  let args, outDir, log;
  const fail = (code, message) => {
    if (log && outDir) {
      log.stop_condition = message;
      log.generated_at = generatedAt;
      fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(log, null, 2) + '\n');
      fs.writeFileSync(path.join(outDir, 'report.md'), renderStopReport(log));
      console.error(`  wrote ${relRepo(path.join(outDir, 'run.json'))} + report.md (stop record)`);
    }
    console.error(`STOP (exit ${code}): ${message}`);
    return code;
  };

  try { args = parseArgs(argv); } catch (e) { return fail(2, e.message); }

  // run date + run id
  let runDate, runDateV;
  if (args.runDate) {
    runDate = parseDate(args.runDate);
    if (!runDate) return fail(2, `--run-date must be YYYY-MM-DD, got "${args.runDate}"`);
    runDateV = V(args.runDate, LBL.input, '--run-date flag');
  } else {
    runDate = parseDate(new Date().toISOString().slice(0, 10));
    runDateV = V(iso(runDate), LBL.record, 'system clock (UTC date)');
  }
  const runId = args.runId ?? nowId();
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) return fail(2, `--run-id may contain only letters, digits, _ and -: "${runId}"`);

  // output location guard: only under the runs root
  const runsRoot = path.resolve(REPO, PATHS.runsRoot);
  outDir = path.resolve(runsRoot, runId);
  if (path.dirname(outDir) !== runsRoot) return fail(2, `refusing to write outside ${PATHS.runsRoot}`);
  fs.mkdirSync(outDir, { recursive: true });

  log = {
    run_id: runId, run_date: runDateV, mode: 'sample',
    recipe: { path: PATHS.recipe, version: '0.1.0' },
    rules: V(RULES, LBL.input, RULES.source),
    inputs: {}, gates: {}, roles: [], lists: {}, counts: {}, scorer_output: null,
    cannot_verify: CANNOT_VERIFY, stop_condition: null, generated_at: null,
  };

  // inputs
  // Errors name repo-relative paths only (no machine paths or usernames in outputs).
  let persona, candidatesText, candidates;
  const readJsonText = (p, what) => {
    const abs = path.resolve(REPO, p);
    if (!fs.existsSync(abs)) throw new Error(`${what} file not found: ${relRepo(abs)}`);
    return fs.readFileSync(abs, 'utf8');
  };
  try {
    const personaText = readJsonText(args.persona, 'persona');
    try { persona = JSON.parse(personaText); } catch { throw new Error(`persona file is not valid JSON: ${relRepo(args.persona)}`); }
    candidatesText = readJsonText(args.candidates, 'candidates');
    try { candidates = JSON.parse(candidatesText); } catch { throw new Error(`candidates file is not valid JSON: ${relRepo(args.candidates)}`); }
  } catch (e) { return fail(2, `input error: ${e.message}`); }
  const candProblems = candidateProblems(candidates);
  if (candProblems.length) return fail(2, `input error in ${relRepo(args.candidates)}: ${candProblems.join('; ')}`);
  log.inputs.persona_path = relRepo(args.persona);
  log.inputs.candidates_path = relRepo(args.candidates);

  const pii = piiProblems(persona, candidatesText);
  if (pii.length) return fail(2, `PII guard: ${pii.join('; ')}`);

  // G0
  let g0;
  try { g0 = runG0(path.resolve(REPO, args.persona), persona, outDir); } catch (e) { return fail(2, `G0 could not run the scorer: ${e.message.split('\n')[0]}`); }
  log.gates.g0 = {
    authorization_string: V(g0.authorization_string, LBL.input, args.persona),
    persona_needs_sponsorship: V(g0.persona_needs_sponsorship, LBL.input, args.persona),
    scorer_profile_needs_sponsorship: g0.scorer_profile_needs_sponsorship === undefined ? null
      : V(g0.scorer_profile_needs_sponsorship, LBL.record, `${g0.probe_out_dir}/role-scores.json`),
    passed: g0.passed, probe_out_dir: g0.probe_out_dir ?? null, command: g0.command ?? null,
  };
  if (!g0.passed) return fail(2, g0.error);

  // G2a
  const g2a = checkTimelineInputs(persona, runDate);
  const v = persona.visa ?? {};
  log.gates.g2a = {
    program_end: V(v.program_end_date ?? null, LBL.input, args.persona),
    opt_start: V(v.opt_start_date ?? null, LBL.input, args.persona),
    unemployment_limit_days: V(v.unemployment_limit_days ?? null, LBL.input, args.persona),
    unemployment_days_used: V(v.unemployment_days_used ?? null, LBL.input, args.persona),
    hiring_lag_days: V(persona.hiring_lag_days ?? null, LBL.input, args.persona),
    valid: g2a.valid, error: g2a.valid ? null : g2a.errors.join('; '),
  };
  if (!g2a.valid) return fail(2, `G2a timeline input error: ${g2a.errors.join('; ')}`);

  // data
  let csvRows, formd, blsRow, csvHash;
  try {
    const csvBuf = fs.readFileSync(path.resolve(REPO, PATHS.csv));
    csvHash = sha256(csvBuf);
    csvRows = csvToObjects(parseCsv(csvBuf.toString('utf8')), CSV_COLUMNS);
    formd = fs.readdirSync(path.resolve(REPO, PATHS.formdDir)).filter((f) => f.endsWith('.sample.json')).sort().map((f) => {
      const p = `${PATHS.formdDir}/${f}`;
      const d = JSON.parse(fs.readFileSync(path.resolve(REPO, p), 'utf8'));
      return { path: p, companies: d.companies };
    });
    const blsRows = csvToObjects(parseCsv(fs.readFileSync(path.resolve(REPO, PATHS.bls), 'utf8')), ['onet_soc_code', 'title', 'annual_median_wage', 'oews_year']);
    blsRow = blsRows.find((r) => r.onet_soc_code === RULES.bls_context_onet_soc) ?? null;
  } catch (e) { return fail(2, `input error reading repo data: ${e.message}`); }
  log.inputs.csv = { path: PATHS.csv, sha256: csvHash, data_rows: csvRows.length, columns_read: CSV_COLUMNS, columns_never_read: NEVER };
  log.inputs.formd_sample_paths = formd.map((f) => f.path);
  log.inputs.formd_sample_entries = formd.reduce((s, f) => s + f.companies.length, 0);
  log.inputs.bls_path = PATHS.bls;

  // normalize (repo normalizer) — candidate names and every CSV company name
  let candNorm, csvNorm;
  try {
    const all = normalizeNames([...candidates.roles.map((r) => r.company), ...csvRows.map((r) => r.company_name)]);
    candNorm = all.slice(0, candidates.roles.length);
    csvNorm = all.slice(candidates.roles.length);
  } catch (e) { return fail(2, `company-name normalizer failed: ${e.message.split('\n')[0]}`); }
  const byNorm = new Map();
  csvRows.forEach((r, i) => { const n = csvNorm[i]; if (n) { if (!byNorm.has(n)) byNorm.set(n, []); byNorm.get(n).push(r); } });
  const formdByNorm = new Map();
  for (const f of formd) for (const c of f.companies) {
    const n = c.company?.company_name_normalized;
    if (n && !formdByNorm.has(n)) formdByNorm.set(n, { accession_number: c.accession_number, file: f.path });
  }

  // G2 (run-level value, applied per role)
  const tl = computeTimeline(persona, runDate);
  const tlLabel = weakestLabel([LBL.input, runDateV.label]);
  log.gates.g2 = {
    opt_window_end: V(tl.opt_window_end, LBL.input, 'opt_start + unemployment_limit_days', [LBL.input]),
    earliest_hire_date: V(tl.earliest_hire_date, tlLabel, 'run_date + hiring_lag_days', [runDateV.label, LBL.input]),
    slack_days: V(tl.slack_days, tlLabel, 'slack rule (CHANGE-BRIEF r1)', [runDateV.label, LBL.input]),
    timeline_factor: V(tl.timeline_factor, tlLabel, 'slack -> factor rule (CHANGE-BRIEF r1)', [runDateV.label, LBL.input]),
    closed: tl.closed,
  };

  const blsCtx = blsRow
    ? { onet_soc_code: blsRow.onet_soc_code, title: V(blsRow.title, LBL.record, PATHS.bls),
        annual_median_wage: V(Number(blsRow.annual_median_wage), LBL.record, PATHS.bls), oews_year: V(blsRow.oews_year, LBL.record, PATHS.bls),
        note: 'context only — not a score term (role_quality weight is 0.0, role-scorer.mjs:37)' }
    : { onet_soc_code: RULES.bls_context_onet_soc, missing: 'no row for this O*NET-SOC code in the BLS compact file' };

  // per role
  const toScore = [];
  candidates.roles.forEach((c, i) => {
    const role = {
      role_id: c.role_id, company: c.company, title: c.title,
      posting_url: V(c.posting_url ?? null, LBL.input, args.candidates),
      status: null, reason: null, failed_gate: null,
      sponsorship: null, fit: null, liveness: null, timeline: null, scorer: null,
      context: {
        formd_sample: (() => {
          const hit = candNorm[i] ? formdByNorm.get(candNorm[i]) : null;
          return hit
            ? { found: true, accession_number: V(hit.accession_number, LBL.record, hit.file), file: hit.file, wording: 'record in Form D sample data (one filing; not current runway)' }
            : { found: false, accession_number: null, file: null, wording: 'no record in sample data' };
        })(),
        bls_15_1241: blsCtx,
      },
      normalized_company_name: candNorm[i] || null,
      next_action: null,
    };
    log.roles.push(role);

    const sp = candNorm[i]
      ? mapSponsorship(byNorm.get(candNorm[i]), RULES)
      : { status: 'missing', reason: 'company name normalizes to an empty string; nothing to match' };
    if (sp.row) {
      role.sponsorship = {
        csv_company_name: V(sp.row.company_name, LBL.record, PATHS.csv),
        total_approvals: V(sp.row['Total Approvals'], LBL.record, PATHS.csv),
        total_denials: V(sp.row['Total Denials'], LBL.record, PATHS.csv),
        approval_rate: V(sp.row.Approval_Rate, LBL.record, PATHS.csv),
        titles_sponsored: V(sp.titles ?? sp.row.top_job_titles_sponsored, LBL.record, PATHS.csv),
      };
    }
    if (sp.status === 'missing') {
      role.status = 'missing';
      role.reason = sp.reason;
      role.next_action = `Report the reason ("${sp.reason}"). Not a no-sponsor finding; decide whether manual research is worth it.`;
      return;
    }
    Object.assign(role.sponsorship, {
      network_titles_matched: V(sp.matched, LBL.input, 'network keyword rule A1 (CHANGE-BRIEF r1)', [LBL.record, LBL.input]),
      tier: V(sp.tier, LBL.input, 'sponsorship mapping (CHANGE-BRIEF r2/r3)', [LBL.record, LBL.input]),
      p: V(sp.p, LBL.input, 'sponsorship mapping (CHANGE-BRIEF r2/r3)', [LBL.record, LBL.input]),
      label_sent_to_scorer: 'record',
      label_note: 'The CSV row is a record; tier and p come from a your-input mapping of it. The scorer trace shows [record] for this term (recipe §Source labels).',
    });

    const fitP = c.fit_p;
    if (typeof fitP !== 'number' || !(fitP >= 0 && fitP <= 1)) {
      role.status = 'not_scored'; role.failed_gate = 'input'; role.reason = 'fit_p missing or not a number in [0, 1] (your-input)';
      role.next_action = 'Fix the candidate entry; nothing was scored for this role.';
      return;
    }
    role.fit = { p: V(fitP, LBL.input, args.candidates) };

    const lv = mapLiveness(c.sample_liveness ?? null);
    role.liveness = { result: V(c.sample_liveness ?? null, LBL.input, `${args.candidates} (sample value, not a check)`), factor: lv.ok ? V(lv.factor, LBL.input, 'liveness mapping', [LBL.input]) : null, checked_at: null };
    if (!lv.ok) {
      role.status = 'not_scored'; role.failed_gate = 'G1'; role.reason = lv.reason;
      role.next_action = sp.tier === RULES.sponsorship.network_match.tier
        ? 'Network, do not apply yet: find a contact on the network team, ask about hiring and current sponsorship, and check the posting before applying.'
        : 'Check the posting before spending any time on it.';
      return;
    }

    role.timeline = { factor: V(tl.timeline_factor, tlLabel, 'G2 slack rule', [runDateV.label, LBL.input]) };
    if (tl.closed) {
      role.status = 'not_scored'; role.failed_gate = 'G2'; role.reason = `timeline window closed: slack ${tl.slack_days} days (OPT window ends ${tl.opt_window_end}, earliest hire ${tl.earliest_hire_date})`;
      role.next_action = 'Revisit the dates; no application time for this role.';
      return;
    }

    toScore.push({ role, entry: {
      role_id: c.role_id, company: c.company, title: c.title,
      sponsorship: { p: sp.p, tier: sp.tier, source: LBL.record },
      fit: { p: fitP, source: LBL.input },
      liveness: { factor: lv.factor, source: LBL.input },
      timeline: { factor: tl.timeline_factor, source: tlLabel },
    } });
  });

  // real scorer
  if (toScore.length) {
    const rolesPath = path.join(outDir, 'roles.json');
    fs.writeFileSync(rolesPath, JSON.stringify(toScore.map((t) => t.entry), null, 2) + '\n');
    let sc, scored;
    try {
      sc = runScorer(rolesPath, path.resolve(REPO, args.persona), outDir);
      scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
    } catch (e) { return fail(2, `scorer failed: ${e.message.split('\n')[0]}`); }
    log.scorer_output = { dir: relRepo(outDir), roles_json: relRepo(rolesPath), role_scores_json: relRepo(path.join(outDir, 'role-scores.json')), command: sc.cmd, stdout: sc.stdout, profile_needs_sponsorship: scored.profile_needs_sponsorship };
    for (const { role } of toScore) {
      const s = scored.roles.find((r) => r.role_id === role.role_id);
      if (!s) return fail(2, `scorer output has no entry for role_id "${role.role_id}"`);
      role.status = 'scored';
      const derived = [LBL.record, LBL.input];
      role.scorer = {
        composite: V(s.composite, weakestLabel(derived), PATHS.scorer, derived),
        machine_recommendation: V(s.machine_recommendation, weakestLabel(derived), PATHS.scorer, derived),
        recommendation: V(s.recommendation, weakestLabel(derived), PATHS.scorer, derived),
        reason: s.reason, trace: s.trace,
      };
      role.next_action = NEXT[s.recommendation] ?? 'Read the scorer reason.';
    }
  } else {
    log.scorer_output = { skipped: 'no role passed every gate; the scorer was not called' };
  }

  // lists + counts
  const rec = (r) => r.scorer?.recommendation.value;
  const pick = (f) => log.roles.filter(f).map((r) => r.role_id);
  log.lists = {
    apply: pick((r) => rec(r) === 'Apply'),
    consider: pick((r) => rec(r) === 'Consider'),
    network_do_not_apply_yet: pick((r) => r.status === 'not_scored' && r.failed_gate === 'G1' && r.sponsorship?.tier?.value === RULES.sponsorship.network_match.tier),
    skip: pick((r) => rec(r) === 'Skip'),
    not_scored: pick((r) => r.status === 'not_scored'),
    missing: pick((r) => r.status === 'missing'),
  };
  const scoredN = log.roles.filter((r) => r.status === 'scored').length;
  log.counts = {
    evaluated: log.roles.length, scored: scoredN,
    apply: log.lists.apply.length, consider: log.lists.consider.length, skip: log.lists.skip.length,
    network_do_not_apply_yet: log.lists.network_do_not_apply_yet.length,
    not_scored: log.lists.not_scored.length, missing: log.lists.missing.length,
    skip_rate_of_scored: scoredN ? Number((log.lists.skip.length / scoredN).toFixed(4)) : null,
  };
  log.generated_at = generatedAt;

  fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(log));

  const c = log.counts;
  console.log(`network-eng-h1b run ${runId}: evaluated ${c.evaluated} → Apply ${c.apply} · Consider ${c.consider} · Skip ${c.skip} · Not scored ${c.not_scored} (network, do not apply yet ${c.network_do_not_apply_yet}) · Missing ${c.missing}`);
  for (const r of log.roles) if (r.status !== 'scored') console.log(`  ${r.status.toUpperCase().padEnd(10)} ${r.role_id}: ${r.failed_gate ? `[${r.failed_gate}] ` : ''}${r.reason}`);
  console.log(`  wrote ${relRepo(path.join(outDir, 'run.json'))} + report.md`);
  return c.not_scored + c.missing > 0 ? 1 : 0;
}

const NEXT = {
  Apply: 'Tailor and send the application (2 research-and-apply hours); confirm current sponsorship with the recruiter.',
  Consider: 'Tailor the application and confirm current sponsorship with the recruiter or a network contact (2 research-and-apply hours).',
  Skip: 'No action. Skip is a success.',
};

const CANNOT_VERIFY = [
  'Per-title counts: how many of a company\'s approvals were network roles. Only a list of titles exists.',
  'Dates of sponsorship: the CSV has no dates.',
  'Current sponsorship: whether the employer sponsors now, or for this opening.',
  'SOC match: that a title is SOC 15-1241. No title-to-SOC crosswalk exists.',
  'The H-1B cap lottery: past approvals are not a selection probability.',
  'Cap-gap timing: whether status and work authorization carry from OPT end to an H-1B start.',
  'Funding with sample data only: absence from the Form D samples is "no record in sample data", not "not funded".',
  'Posting liveness in sample mode: fixture values are not checks.',
  'Entity identity: two employers with the same normalized name, or one employer under two spellings.',
];

// ── report (for the person) ───────────────────────────────────────────────

const val = (x) => (x == null ? '—' : typeof x === 'object' && 'value' in x ? fmtv(x.value) : fmtv(x));
const fmtv = (x) => (x == null ? '—' : Array.isArray(x) ? (x.length ? x.join('; ') : '(none)') : String(x));
const lab = (x) => (x && typeof x === 'object' && 'label' in x ? ` [${x.label}]` : '');
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderReport(log) {
  const c = log.counts, g = log.gates;
  const byId = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));
  const line = (id) => { const r = byId[id]; return `- **${r.company}** — ${r.title}: ${r.reason ?? r.scorer?.reason ?? ''}`.trim(); };
  const o = [];
  o.push(`# Network Engineer H-1B triage — run ${log.run_id}`);
  o.push('');
  o.push('## Executive summary');
  o.push('');
  o.push(`This report checks ${c.evaluated} job openings for a fictional F-1 student aiming at Network Engineer roles. It asks one main question: has the employer sponsored H-1B visas for network-titled jobs before? ` +
    `${c.consider} opening(s) are worth tailoring an application for, after confirming current sponsorship. ${c.network_do_not_apply_yet} employer(s) are worth a networking conversation first, because their posting has not been checked. ${c.skip} were skipped. ` +
    `${c.not_scored} could not be scored, and ${c.missing} had no usable sponsorship record. The reason is given for each, and none is treated as a "no". ` +
    'The sponsorship data shows only that an employer sponsored a network title at least once, not that it does now, so no network match is recommended above Consider by the scorer.');
  o.push('');
  o.push('## Run record');
  o.push('');
  o.push(`- Run ID: \`${log.run_id}\` · mode: ${log.mode} · run date: ${val(log.run_date)}${lab(log.run_date)}`);
  o.push(`- Recipe: \`${log.recipe.path}\` v${log.recipe.version}`);
  o.push(`- Persona: \`${log.inputs.persona_path}\` · openings: \`${log.inputs.candidates_path}\``);
  o.push(`- Sponsorship data: \`${log.inputs.csv.path}\` (${log.inputs.csv.data_rows} rows, sha256 \`${log.inputs.csv.sha256}\`)`);
  o.push(`- Form D: ${log.inputs.formd_sample_paths.length} sample files, ${log.inputs.formd_sample_entries} entries (samples only)`);
  o.push(`- Scorer: ${log.scorer_output?.command ? `\`${log.scorer_output.command}\`` : log.scorer_output?.skipped ?? '—'}`);
  o.push('');
  o.push('## Gate results');
  o.push('');
  o.push(`- **G0 profile pre-check:** ${g.g0.passed ? 'passed' : 'FAILED'}. Authorization sent: "${val(g.g0.authorization_string)}"${lab(g.g0.authorization_string)}; persona needs sponsorship: ${val(g.g0.persona_needs_sponsorship)}${lab(g.g0.persona_needs_sponsorship)}; scorer read: ${val(g.g0.scorer_profile_needs_sponsorship)}${lab(g.g0.scorer_profile_needs_sponsorship)}.`);
  o.push(`- **G2a timeline inputs:** ${g.g2a.valid ? 'valid' : 'INVALID'}. Program end ${val(g.g2a.program_end)}, OPT start ${val(g.g2a.opt_start)}, limit ${val(g.g2a.unemployment_limit_days)} days, used ${val(g.g2a.unemployment_days_used)}, hiring lag ${val(g.g2a.hiring_lag_days)} days [your-input].`);
  o.push(`- **G2 visa timeline:** OPT window ends ${val(g.g2.opt_window_end)}; earliest hire ${val(g.g2.earliest_hire_date)}; slack **${val(g.g2.slack_days)} days** → factor ${val(g.g2.timeline_factor)}${lab(g.g2.timeline_factor)}${g.g2.closed ? ' — **window closed**' : ''}.`);
  o.push('- **G1 liveness:** per opening, below. In this sample run, liveness values come from the fixture and are not checks.');
  o.push('');
  const gated = (id) => { const r = byId[id]; return `- **${r.company}** — ${r.title}: [${r.failed_gate}] ${r.reason}`; };
  const section = (title, ids, extra, fmt = line) => {
    o.push(`## ${title}`); o.push('');
    if (extra) { o.push(extra); o.push(''); }
    o.push(ids.length ? ids.map(fmt).join('\n') : '(none)'); o.push('');
  };
  if (c.apply) section('Apply', log.lists.apply, NEXT.Apply);
  section('Consider — tailor and confirm sponsorship', log.lists.consider, `Next action: ${NEXT.Consider}`);
  section('Network, do not apply yet', log.lists.network_do_not_apply_yet,
    'Employers with a network-titled sponsorship record whose posting has not been checked. Next action (the 3 networking hours): find a contact on the network team, ask about hiring and current sponsorship, and check the posting before applying.', gated);
  section('Skip', log.lists.skip, 'No action. Skip is a success.');
  section('Not scored', log.lists.not_scored, 'Stopped at a gate before scoring; the gate and reason are shown.', gated);
  section('Missing', log.lists.missing, 'No usable sponsorship record. This is not a "no sponsor" finding.');

  o.push('## Per-opening evidence');
  o.push('');
  o.push('| Opening | Status | Approvals | Network titles matched | Tier / p | Fit | Liveness | Timeline | Composite | Recommendation |');
  o.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of log.roles) {
    const s = r.sponsorship;
    o.push(`| ${cell(`${r.company} — ${r.title}`)} | ${r.status}${r.failed_gate ? ` (${r.failed_gate})` : ''} | ${s ? `${val(s.total_approvals)}${lab(s.total_approvals)}` : '—'} | ${s?.network_titles_matched ? cell(`${val(s.network_titles_matched)}${lab(s.network_titles_matched)}`) : '—'} | ${s?.tier ? `${val(s.tier)} / ${val(s.p)}${lab(s.p)}` : '—'} | ${r.fit ? `${val(r.fit.p)}${lab(r.fit.p)}` : '—'} | ${r.liveness ? `${val(r.liveness.result)}${lab(r.liveness.result)}` : '—'} | ${r.timeline ? `${val(r.timeline.factor)}${lab(r.timeline.factor)}` : '—'} | ${r.scorer ? val(r.scorer.composite) : '—'} | ${r.scorer ? `**${val(r.scorer.recommendation)}**` : '—'} |`);
  }
  o.push('');
  o.push('The CSV row values (approvals, denials, rate, titles) are **record**. Tier and p come from a **your-input** mapping of that row. The scorer trace labels this term `record`, because that is the label the recipe sends.');
  o.push('');
  o.push('## Context outside the score');
  o.push('');
  o.push('| Opening | CSV company | Denials | Approval rate | Titles sponsored (record) | Form D sample |');
  o.push('|---|---|---|---|---|---|');
  for (const r of log.roles) {
    const s = r.sponsorship;
    o.push(`| ${cell(r.company)} | ${s ? cell(val(s.csv_company_name)) : '(no row)'} | ${s ? val(s.total_denials) : '—'} | ${s ? val(s.approval_rate) : '—'} | ${s ? cell(val(s.titles_sponsored)) : '—'} | ${r.context.formd_sample.wording}${r.context.formd_sample.found ? ` (${val(r.context.formd_sample.accession_number)})` : ''} |`);
  }
  o.push('');
  const b = log.roles[0]?.context.bls_15_1241;
  if (b) o.push(b.missing ? `- BLS ${b.onet_soc_code}: ${b.missing}.` : `- BLS ${b.onet_soc_code} ${val(b.title)}: national annual median wage ${val(b.annual_median_wage)} (OEWS ${val(b.oews_year)}) [record] — ${b.note}.`);
  o.push('- Form D: only sample files ship with the repository; "no record in sample data" never means "not funded".');
  o.push('');
  o.push('## Cannot verify');
  o.push('');
  for (const x of log.cannot_verify) o.push(`- ${x}`);
  o.push('');
  o.push('## Skip rate');
  o.push('');
  o.push(c.scored ? `${c.skip} of ${c.scored} scored openings skipped (${(c.skip_rate_of_scored * 100).toFixed(0)}%). A healthy run skips at least half of what it scores.` : 'No opening was scored.');
  o.push('');
  o.push('## Human gate sign-off');
  o.push('');
  o.push('- G0 checked by: ____ · date: ____');
  o.push('- G2a / G2 checked by: ____ · date: ____');
  o.push('- G1 (each posting opened and confirmed) by: ____ · date: ____');
  o.push('');
  return o.join('\n');
}

function renderStopReport(log) {
  return [
    `# Network Engineer H-1B triage — run ${log.run_id} (stopped)`,
    '',
    '## Executive summary',
    '',
    'This run stopped before scoring anything, because a required check failed. No recommendation was made, and no value was guessed. The reason is below; fix it and run again.',
    '',
    '## Stop condition',
    '',
    log.stop_condition,
    '',
    '## Gate state at stop',
    '',
    '```json',
    JSON.stringify(log.gates, null, 2),
    '```',
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main();
}
