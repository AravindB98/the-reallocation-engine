#!/usr/bin/env node
// network-targets.mjs — turn the engine's liveness-gated skips into a
// "network first" list for a pre-OPT F-1 software-engineering student.
//
// OFFLINE. Reads only repo data + saved board snapshots. The only network step
// is capture-boards.mjs, run separately (SNICKERDOODLE P2).
//
//   node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.mjs
//        [--persona p.json] [--csv f.csv] [--formd-dir dir] [--bls f.csv]
//        [--boards dir] [--out-dir dir] [--today YYYY-MM-DD]
//
// Exit: 0 ok · 2 input/data error (nothing decided) · 3 timeline gate closed (run halted, nothing decided)
//
// The composite is NOT computed here. roles.json is handed to the maintained
// scorer scripts/score/role-scorer.mjs, run as-is, and its output is read back.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SRC, L, nameKey, parseCsv, parseDay, addDays, daysBetween, iso, todayLocal, toNum } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(ROOT, p) || '.';

const DEFAULTS = {
  persona: path.join(HERE, 'inputs/persona.json'),
  csv: path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  formdDir: path.join(ROOT, 'data/sec/form-d/processed/sample'),
  bls: path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv'),
  boards: path.join(HERE, 'inputs/boards-snapshot.json'),
  liveness: path.join(HERE, 'inputs/liveness.json'),
  everify: path.join(HERE, 'inputs/everify.csv'),
  lca: path.join(HERE, 'data/lca-15-1252.csv'),
  outDir: path.join(ROOT, 'course/2026fa/submissions/lavanyarajesh24/runs'),
  scorer: path.join(ROOT, 'scripts/score/role-scorer.mjs'),
};

// Only these CSV columns are read. Phone numbers, executive and board names are never read or emitted.
const REQUIRED_COLUMNS = ['company_name', 'city', 'state', 'latest_funding_amount', 'latest_funding_stage',
  'latest_funding_date', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered', 'top_job_titles_sponsored'];

class GateError extends Error {
  constructor(gate, code, message, exitCode) { super(message); this.gate = gate; this.code = code; this.exitCode = exitCode; }
}

function args(argv) {
  const o = { ...DEFAULTS, today: null };
  const map = { '--persona': 'persona', '--csv': 'csv', '--formd-dir': 'formdDir', '--bls': 'bls', '--boards': 'boards', '--out-dir': 'outDir', '--today': 'today', '--liveness': 'liveness', '--everify': 'everify', '--lca': 'lca' };
  for (let i = 0; i < argv.length; i++) {
    const k = map[argv[i]];
    if (!k) throw new GateError('G0', 'bad-argument', `unknown argument: ${argv[i]}`, 2);
    const v = argv[++i];
    if (v == null) throw new GateError('G0', 'bad-argument', `${argv[i - 1]} needs a value`, 2);
    o[k] = k === 'today' ? v : path.resolve(v);
  }
  return o;
}

// Refuse to write over anything inside the repo except this student's namespaces.
function assertSafeOutDir(outDir) {
  const r = path.relative(ROOT, outDir);
  if (r.startsWith('..') || path.isAbsolute(r)) return; // outside the repo (e.g. a test temp dir)
  const ok = ['course/2026fa/submissions/lavanyarajesh24', 'scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe'];
  if (!ok.some((p) => r === p || r.startsWith(p + path.sep)))
    throw new GateError('G0', 'unsafe-out-dir', `--out-dir ${r} is inside the repo but outside this student's namespace; refusing to write`, 2);
}

// ── G0: persona (every value here is your-input) ─────────────────────────────
function loadPersona(file, todayStr) {
  let p;
  try { p = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new GateError('G0', 'persona-unreadable', `cannot read persona ${rel(file)}: ${e.message}`, 2); }
  const v = p.visa || {}, t = p.target || {}, a = p.assumptions || {};
  const today = parseDay(todayStr);
  const optStart = parseDay(v.opt_start_date), optEnd = parseDay(v.opt_end_date);
  const problems = [];
  if (!today) problems.push(`today "${todayStr}" is not YYYY-MM-DD`);
  if (!optStart) problems.push('visa.opt_start_date missing or not YYYY-MM-DD');
  if (!optEnd) problems.push('visa.opt_end_date missing or not YYYY-MM-DD');
  if (optStart && optEnd && optEnd <= optStart) problems.push('visa.opt_end_date is not after opt_start_date');
  if (!Array.isArray(t.states) || !t.states.length) problems.push('target.states is empty');
  if (!t.sponsored_title_pattern) problems.push('target.sponsored_title_pattern missing');
  if (!(a.hiring_lag_days > 0)) problems.push('assumptions.hiring_lag_days must be > 0');
  if (!a.sponsorship_tiers) problems.push('assumptions.sponsorship_tiers missing');
  if (problems.length) throw new GateError('G0', 'persona-invalid', `persona ${rel(file)}: ${problems.join('; ')}`, 2);
  return { p, today, optStart, optEnd };
}

// ── G2: timeline (derived from your-input dates; a gate, not a vote) ─────────
// The work window closes at the earlier of OPT end and the day the unemployment
// allowance would run out if employment starts no earlier than OPT start.
function timeline({ p, today, optStart, optEnd }) {
  const v = p.visa, lag = p.assumptions.hiring_lag_days;
  const remainingUnemp = (v.unemployment_ceiling ?? 90) - (v.unemployment_days_used ?? 0);
  const unempEnd = addDays(optStart > today ? optStart : today, remainingUnemp);
  const windowEnd = unempEnd < optEnd ? unempEnd : optEnd;
  const earliestStart = addDays(today, lag) > optStart ? addDays(today, lag) : optStart;
  const slack = daysBetween(earliestStart, windowEnd);
  const factor = slack <= 0 ? 0 : Math.min(1, Number((slack / lag).toFixed(3)));
  const t = {
    today: L(iso(today), SRC.input, '--today or system date'),
    opt_start_date: L(iso(optStart), SRC.input, 'persona.visa.opt_start_date'),
    opt_end_date: L(iso(optEnd), SRC.input, 'persona.visa.opt_end_date'),
    unemployment_days_remaining: L(remainingUnemp, SRC.input, 'persona.visa.unemployment_ceiling - unemployment_days_used'),
    hiring_lag_days: L(lag, SRC.input, 'persona.assumptions.hiring_lag_days (an assumption, not a measurement)'),
    work_window_end: L(iso(windowEnd), SRC.input, 'min(opt_end, max(opt_start,today) + unemployment days remaining)'),
    earliest_start: L(iso(earliestStart), SRC.input, 'max(today + hiring lag, opt_start)'),
    slack_days: L(slack, SRC.input, 'work_window_end - earliest_start'),
    start_wait_days: L(Math.max(0, daysBetween(today, optStart)), SRC.input, 'opt_start - today: days before this person can legally start'),
    factor: L(factor, SRC.input, 'slack <= 0 → 0, else min(1, slack / hiring_lag)'),
  };
  if (windowEnd <= today)
    throw Object.assign(new GateError('G2', 'work-window-ended', `work window ended ${iso(windowEnd)} (today ${iso(today)}); nothing to decide`, 3), { timeline: t });
  if (factor <= 0.05)
    throw Object.assign(new GateError('G2', 'timeline-closed', `timeline factor ${factor}: earliest start ${iso(earliestStart)} leaves ${slack} day(s) before the window closes ${iso(windowEnd)}`, 3), { timeline: t });
  return t;
}

// ── G1: data ─────────────────────────────────────────────────────────────────
function loadCsv(file) {
  if (!fs.existsSync(file)) throw new GateError('G1', 'csv-missing', `sponsorship CSV not found: ${rel(file)}`, 2);
  const { header, records } = parseCsv(fs.readFileSync(file, 'utf8'));
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new GateError('G1', 'csv-columns-missing', `CSV ${rel(file)} lacks required column(s): ${missing.join(', ')}`, 2);
  return records;
}

function loadFormD(dir) {
  const out = { files: [], keys: new Map(), filings: 0, note: null };
  if (!fs.existsSync(dir)) { out.note = `Form D directory not found: ${rel(dir)}`; return out; }
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      out.files.push(f);
      for (const c of d.companies || []) {
        out.filings++;
        const k = nameKey(c.company?.name);
        if (k && !out.keys.has(k)) out.keys.set(k, { file: f, date_filed: c.filing?.date_filed ?? null, total_amount_sold: c.funding?.total_amount_sold ?? null });
      }
    } catch (e) { out.note = `${f}: ${e.message}`; }
  }
  return out;
}

function loadBls(file, soc) {
  if (!fs.existsSync(file)) return { status: 'missing', reason: 'bls-file-missing' };
  const { records } = parseCsv(fs.readFileSync(file, 'utf8'));
  const row = records.find((r) => r.bls_soc_code === soc);
  if (!row) return { status: 'missing', reason: 'no-occupation-row' };
  return {
    status: 'ok',
    soc_code: L(soc, SRC.input, 'persona.target.soc_code'),
    title: L(row.title, SRC.record, `${rel(file)}:title`),
    oews_year: L(toNum(row.oews_year), SRC.record, `${rel(file)}:oews_year`),
    national_median_wage: L(toNum(row.annual_median_wage), SRC.record, `${rel(file)}:annual_median_wage (national, not metro, not this employer)`),
  };
}

// ── E-Verify (record, looked up by hand in the USCIS E-Verify Employer Search) ──
// A missing row means "not looked up", never "not enrolled".
function loadEverify(file) {
  if (!fs.existsSync(file)) return { status: 'missing', file: rel(file), rows: new Map() };
  const { records } = parseCsv(fs.readFileSync(file, 'utf8'));
  return { status: 'ok', file: rel(file), rows: new Map(records.map((r) => [nameKey(r.company), r])) };
}

// ── DOL LCA (record): certified H-1B LCAs, SOC-coded, target worksite states ──
// Written by extract-lca.py from a DOL disclosure workbook; provenance beside it.
function loadLca(file) {
  if (!fs.existsSync(file)) return { status: 'missing', file: rel(file), rows: new Map(), provenance: null };
  const { records } = parseCsv(fs.readFileSync(file, 'utf8'));
  const pf = `${file}.provenance.json`;
  const provenance = fs.existsSync(pf) ? JSON.parse(fs.readFileSync(pf, 'utf8')) : null;
  return { status: 'ok', file: rel(file), rows: new Map(records.map((r) => [r.employer_key, r])), provenance };
}

// ── sponsorship tier: a fixed rule over record counts; thresholds are your-input ──
function tierOf(approvals, rate, tiers) {
  if (approvals >= tiers.proven.min_approvals && (rate ?? 0) >= tiers.proven.min_approval_rate) return ['Proven', tiers.proven.p];
  if (approvals >= tiers.likely.min_approvals) return ['Likely', tiers.likely.p];
  if (approvals >= tiers.possible.min_approvals) return ['Possible', tiers.possible.p];
  return ['None', 0];
}

function companyEvidence(r, persona, today, formd, csvRel, lca, everify) {
  const a = persona.assumptions;
  const approvals = toNum(r['Total Approvals']), denials = toNum(r['Total Denials']), rate = toNum(r.Approval_Rate);
  let [tier, p] = tierOf(approvals ?? 0, rate, a.sponsorship_tiers);
  const key0 = nameKey(r.company_name);
  // LCA cap (your-input rule, persona.assumptions.lca_cap): the 80 Days counts have no SOC code and
  // no year. When the SOC-coded DOL file is loaded and this employer has NO certified LCA for the
  // target SOC anywhere in the US, the tier is capped — the title-text match is not confirmed.
  // (Nationwide, not target states only: v0.2.0-dev capped employers whose software hires sit at
  // remote worksites in other states — Abacus Insights, Acquia, Lookout, Yieldmo.)
  const lr = lca.status === 'ok' ? lca.rows.get(key0) : undefined;
  const cap = a.lca_cap;
  let capped = null;
  if (lca.status === 'ok' && cap && !(toNum(lr?.certified_lcas) > 0)) {
    const order = ['None', 'Possible', 'Likely', 'Proven'];
    if (order.indexOf(tier) > order.indexOf(cap.max_tier)) { capped = tier; tier = cap.max_tier; p = a.sponsorship_tiers[cap.max_tier.toLowerCase()]?.p ?? p; }
  }
  const evr = everify.rows.get(key0);
  const fdate = parseDay(r.latest_funding_date);
  const months = fdate ? Math.floor(daysBetween(fdate, today) / 30.44) : null;
  const recency = fdate == null ? 'unknown' : months <= a.funding_recent_months ? 'recent' : 'old';
  const key = nameKey(r.company_name);
  const fd = formd.keys.get(key);
  const col = (c) => `${csvRel}:${c}`;
  return {
    key,
    company: L(r.company_name, SRC.record, col('company_name')),
    location: L(`${r.city}, ${r.state}`, SRC.record, col('city,state')),
    sponsorship: {
      approvals: L(approvals, SRC.record, col('Total Approvals')),
      denials: L(denials, SRC.record, col('Total Denials')),
      approval_rate: L(rate, SRC.record, col('Approval_Rate')),
      sponsored_titles: L(r.top_job_titles_sponsored, SRC.record, col('top_job_titles_sponsored')),
      tier: L(tier, SRC.input, capped
        ? `capped from ${capped} to ${tier}: no certified ${persona.target.soc_code} LCA in ${lca.file} (persona.assumptions.lca_cap)`
        : 'fixed rule over the record counts above; thresholds from persona.assumptions.sponsorship_tiers'),
      tier_capped_from: L(capped, SRC.input, 'persona.assumptions.lca_cap'),
      p: L(p, SRC.input, `tier "${tier}" mapped to p by persona.assumptions.sponsorship_tiers`),
      h1b_median_salary_all_titles: L(toNum(r.median_salary_offered), SRC.record, `${col('median_salary_offered')} (all sponsored titles, not SWE only)`),
    },
    lca: lca.status !== 'ok'
      ? L(null, SRC.record, `LCA file not loaded (${lca.file} missing)`)
      : L(lr ? { certified: toNum(lr.certified_lcas), certified_in_target_states: toNum(lr.certified_in_target_states), level_I: toNum(lr.level_I), level_II: toNum(lr.level_II), level_III: toNum(lr.level_III), level_IV: toNum(lr.level_IV),
          median_annual_wage_offered: toNum(lr.median_annual_wage_offered), first_received: lr.first_received, last_received: lr.last_received, worksite_states: lr.worksite_states }
        : { certified: 0, certified_in_target_states: 0 }, SRC.record, `${lca.file}#${key0} (certified H-1B LCAs, SOC ${persona.target.soc_code}, nationwide and in target states; exact name-key join)`),
    everify: everify.status !== 'ok' || !evr
      ? L('not-looked-up', SRC.input, `${everify.file}: no row for this company (not looked up ≠ not enrolled)`)
      : L(evr.result, SRC.record, `${everify.file}: USCIS E-Verify Employer Search, query "${evr.query}", ${evr.looked_up_at}, by ${evr.looked_up_by}${evr.reviewed_by ? `, reviewed by ${evr.reviewed_by}` : ''}; latest open enrolment ${evr.latest_open_enrolled || '—'}`),
    funding: {
      latest_date: L(r.latest_funding_date || null, SRC.record, `${col('latest_funding_date')} (80 Days mapping of SEC Form D)`),
      latest_stage: L(r.latest_funding_stage || null, SRC.record, col('latest_funding_stage')),
      latest_amount: L(toNum(r.latest_funding_amount), SRC.record, col('latest_funding_amount')),
      months_since: L(months, SRC.input, 'today - latest_date, in 30.44-day months'),
      recency: L(recency, SRC.input, `recent if months_since <= persona.assumptions.funding_recent_months (${a.funding_recent_months}); missing date → unknown, never "old"`),
      formd_sample_match: L(fd ? { file: fd.file, date_filed: fd.date_filed, total_amount_sold: fd.total_amount_sold } : null, SRC.record,
        'exact name-key match against data/sec/form-d/processed/sample/*.sample.json (samples only: first 50 filings per quarter)'),
    },
  };
}

// ── G3: liveness from a saved board snapshot (record), or unchecked ──────────
// --boards is either ONE bundle file written by capture-boards.mjs
// ({ boards: { <nameKey>: snapshot } }) or a directory of <nameKey>.json files.
// An unreadable bundle leaves every company unchecked; it never means "no jobs".
function openBoards(p) {
  if (!fs.existsSync(p)) return { kind: 'missing', path: p };
  if (fs.statSync(p).isDirectory()) return { kind: 'dir', path: p };
  try {
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!b || typeof b.boards !== 'object') throw new Error('no "boards" object');
    return { kind: 'bundle', path: p, boards: b.boards, captured_at: b.captured_at ?? null };
  } catch (e) { return { kind: 'bad-bundle', path: p, detail: e.message }; }
}

function liveness(key, boards, target) {
  let snap, file;
  if (boards.kind === 'missing') return { state: 'unchecked', reason: 'no-snapshot', file: null };
  if (boards.kind === 'bad-bundle') return { state: 'unchecked', reason: 'snapshot-unparseable', file: rel(boards.path), detail: boards.detail };
  if (boards.kind === 'bundle') {
    file = `${rel(boards.path)}#${key}`;
    snap = boards.boards[key];
    if (!snap) return { state: 'unchecked', reason: 'no-snapshot', file: null };
  } else {
    const f = path.join(boards.path, `${key}.json`);
    file = rel(f);
    if (!fs.existsSync(f)) return { state: 'unchecked', reason: 'no-snapshot', file: null };
    try { snap = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { return { state: 'unchecked', reason: 'snapshot-unparseable', file, detail: e.message }; }
  }
  if (snap.status === 'identity-unverified')
    return { state: 'unchecked', reason: 'board-identity-unverified', file, detail: snap.error };
  if (snap.status !== 'ok' || !Array.isArray(snap.jobs))
    return { state: 'unchecked', reason: 'board-error', file: file, detail: snap.error || `status=${snap.status}` };
  const inc = (target.posting_title_include || []).map((s) => s.toLowerCase());
  const exc = (target.posting_title_exclude || []).map((s) => s.toLowerCase());
  const locs = (target.posting_location_include || []).map((s) => s.toLowerCase());
  // Whole-word matching. (First pass used substring matching, so "MA" matched
  // "Manitoba" and "Madrid" — see runs/first-pass/ and CHANGE-BRIEF Revisions.)
  const word = (s) => new RegExp(`(^|[^a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`, 'i');
  const [incRe, excRe, locRe] = [inc.map(word), exc.map(word), locs.map(word)];
  const matches = snap.jobs.filter((j) => {
    const t = String(j.title || ''), loc = String(j.location || '');
    return incRe.some((r) => r.test(t)) && !excRe.some((r) => r.test(t)) && (!locRe.length || locRe.some((r) => r.test(loc)));
  });
  return {
    state: matches.length ? 'live-match' : 'no-match',
    file: file,
    provider: snap.provider, slug: snap.slug, fetched_at: snap.fetched_at,
    jobs_on_board: L(snap.jobs.length, SRC.record, `${file} (${snap.provider} board API, fetched ${snap.fetched_at})`),
    matching_postings: matches.map((j) => ({ title: L(j.title, SRC.record, file), location: L(j.location, SRC.record, file), url: L(j.url, SRC.record, file) })),
    filter: L({ include: inc, exclude: exc, locations: locs }, SRC.input, 'persona.target.posting_*'),
  };
}

// ── G3b: browser liveness (Playwright, live-check.mjs) per matching posting ──
// No liveness file → "api-listed-only": a listed posting counts as live (the
// sample-run behaviour; the report says the browser gate did not run).
// A liveness file older than the board snapshot is stale: every posting is
// unverified, because the check could not have seen these postings.
function loadLiveness(file, boards) {
  if (!fs.existsSync(file)) return { mode: 'api-listed-only', file: null };
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { mode: 'unreadable', file: rel(file), detail: e.message, results: {} }; }
  const stale = boards.captured_at && d.started_at && d.started_at < boards.captured_at;
  return { mode: stale ? 'stale' : 'browser', file: rel(file), started_at: d.started_at ?? null, snapshot_captured_at: boards.captured_at ?? null,
    checker: d.checker ?? null, results: d.results || {} };
}

function browserGate(live, lv) {
  if (live.state !== 'live-match') return live;
  if (lv.mode === 'api-listed-only') {
    for (const m of live.matching_postings) { m.browser = L('not-run', SRC.input, 'no liveness file; posting counted live because the board API listed it'); m.sent = true; }
    return live;
  }
  for (const m of live.matching_postings) {
    const r = lv.mode === 'browser' ? lv.results[m.url.value] : null;
    if (!r) { m.browser = L('unverified', SRC.record, lv.mode === 'browser' ? `${lv.file}: URL not checked` : `${lv.file}: liveness file ${lv.mode}`); m.sent = false; continue; }
    m.browser = L(r.result, SRC.record, `${lv.file} @ ${r.checked_at} (${r.code}: ${r.reason})`);
    m.sent = r.result === 'active' || r.result === 'expired'; // uncertain is not a verdict either way
  }
  if (!live.matching_postings.some((m) => m.sent))
    return { ...live, state: 'unchecked', reason: 'posting-liveness-unverified', detail: `${live.matching_postings.length} matching posting(s), none with an active/expired browser result` };
  return live;
}

function toRoles(ev, live, tl, fitRatings) {
  const fit = fitRatings?.[ev.company.value];
  const base = {
    company: ev.company.value,
    sponsorship: { p: ev.sponsorship.p.value, tier: ev.sponsorship.tier.value, source: SRC.record,
      derived_by: 'tier rule over 80 Days approval counts; thresholds are your-input' },
    timeline: { factor: tl.factor.value, source: SRC.input },
  };
  if (typeof fit === 'number') base.fit = { p: fit, source: SRC.input };
  if (live.state === 'live-match')
    return live.matching_postings.map((m, i) => [m, i]).filter(([m]) => m.sent).map(([m, i]) => ({ role_id: `${ev.key}:${i + 1}`, ...base, title: m.title.value,
      liveness: m.browser.value === 'not-run'
        ? { factor: 1.0, source: SRC.record, from: `${live.file} @ ${live.fetched_at} (board API listing only)` }
        : { factor: m.browser.value === 'active' ? 1.0 : 0.0, source: SRC.record, from: `${m.browser.from}; listed in ${live.file} @ ${live.fetched_at}` } }));
  return [{ role_id: `${ev.key}:none`, ...base, title: '(no matching posting on board)',
    liveness: { factor: 0.0, source: SRC.record, from: `${live.file} @ ${live.fetched_at}` } }];
}

const NEXT = {
  apply: 'Tailor an application (2-hour research-and-apply block). First confirm the role can start on or after your OPT start date.',
  network: 'Informational-interview target (3-hour networking block). No live opening to apply to yet.',
  'check-board': 'Find this company\'s job board, add it to boards.json, run capture-boards.mjs, re-run. Decide nothing until then.',
  skip: 'No action this cycle.',
  'not-in-dataset': 'No sponsorship record in the 80 Days CSV. That is unknown, not "never sponsors". Check DOL LCA data by hand if it matters.',
};

function route(ev, live, scored) {
  if (live.state === 'unchecked') return { bucket: 'check-board', why: `liveness unchecked (${live.reason})` };
  const recs = scored.filter((s) => s.role_id.startsWith(`${ev.key}:`));
  const best = recs.find((s) => s.recommendation === 'Apply') || recs.find((s) => s.recommendation === 'Consider');
  if (best) return { bucket: 'apply', why: `scorer: ${best.recommendation} — ${best.reason}` };
  const gated = recs.length && recs.every((s) => s.machine_recommendation === 'Skip' && /^gated: liveness/.test(s.reason));
  const strong = ['Proven', 'Likely'].includes(ev.sponsorship.tier.value);
  if (gated && strong) {
    const priority = ev.funding.recency.value === 'recent' ? 'A' : 'B';
    return { bucket: 'network', priority, why: `scorer: Skip (liveness gate closed); sponsorship ${ev.sponsorship.tier.value}; funding ${ev.funding.recency.value} → priority ${priority}` };
  }
  return { bucket: 'skip', why: recs.length ? `scorer: ${recs[0].recommendation} — ${recs[0].reason}${gated ? `; sponsorship ${ev.sponsorship.tier.value} too weak to network into` : ''}` : 'not scored' };
}

// ── report (for the person) ──────────────────────────────────────────────────
const money = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
function renderReport(log) {
  const o = [], b = log.buckets, c = (k) => b[k].length;
  const tl = log.timeline;
  o.push(`# Network targets — ${log.persona.value} — ${log.run.today}`, '');
  o.push('## Executive summary', '');
  if (log.status === 'halted') {
    o.push(`This run **stopped before deciding anything**: ${log.halt.message}. No company was scored, and no list below should be acted on. Fix the dates or assumptions in the persona file, then re-run.`, '');
  } else {
    o.push(`This report sorts software-engineering employers in ${log.persona_target.states.value.join(' and ')} that have sponsored H-1B visas for software job titles into four groups, for a student who cannot start work until ${tl.opt_start_date.value}.`);
    o.push('');
    o.push(`- **Apply now: ${c('apply')}**: a matching software posting was listed on the company's own verified job board **and** showed an apply button in a real browser, and the engine's scorer said Apply or Consider.`);
    o.push(`- **Network first: ${c('network')}**: strong sponsorship history${log.lca.status === 'ok' ? ', confirmed by Department of Labor software-developer wage filings,' : ''} but no live matching opening. These are people to meet before a role opens, not applications.`);
    o.push(`- **Check the job board first: ${c('check-board')}**: the board was not found or not confirmed as this company's, or its postings could not be read, so nothing is decided about them.`);
    o.push(`- **Skip: ${c('skip')}**${c('not-in-dataset') ? ` · **Not in the dataset: ${c('not-in-dataset')}**` : ''}.`);
    o.push('');
    o.push('Every number below is labeled: **record** (read from a dataset or a saved job board), **your-input** (an assumption or rule you set), or **model-judgment** (none in this run). Nothing here has been sent anywhere. A person must read this before any outreach or application.', '');
  }
  o.push('## Run record', '');
  o.push('| Item | Value | Source |', '|---|---|---|');
  for (const [k, v] of Object.entries(log.inputs)) o.push(`| ${k} | \`${v}\` | — |`);
  if (tl) for (const [k, v] of Object.entries(tl)) o.push(`| timeline.${k} | ${v.value} | ${v.source} |`);
  if (log.status === 'halted') return o.join('\n') + '\n';
  o.push(`| CSV rows read | ${log.counts.csv_rows} | record |`);
  o.push(`| candidates after state + sponsored-title filter | ${log.counts.candidates} | record (filter is your-input) |`);
  o.push(`| Form D sample filings checked | ${log.formd.filings} in ${log.formd.files.length} file(s) | record |`);
  o.push(`| candidates matched to a Form D sample filing | ${log.formd.matched} of ${log.counts.candidates} | record |`);
  o.push(`| DOL LCA (SOC-coded) | ${log.lca.status === 'ok' ? `${log.lca.provenance?.source_file ?? log.lca.file}, received ${log.lca.provenance?.received_date_range_kept?.join(' … ') ?? '?'}; ${log.lca.matched} matched; ${log.lca.tiers_capped} tier(s) capped` : 'not loaded'} | record |`);
  o.push(`| E-Verify looked up | ${log.everify.looked_up} of ${log.counts.candidates} (${log.everify.open} open) | record |`);
  o.push(`| browser liveness gate | ${log.liveness.mode}${log.liveness.started_at ? ` (checked ${log.liveness.started_at})` : ''}; postings ${Object.entries(log.liveness.postings).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'} | record |`);
  o.push(`| scorer skip rate (scored roles only) | ${log.scorer.summary ?? 'not run'} | scorer output |`, '');

  const table = (rows, cols) => { o.push(`| ${cols.map((x) => x[0]).join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`); for (const r of rows) o.push(`| ${cols.map((x) => x[1](r)).join(' | ')} |`); o.push(''); };
  const spon = (d) => `${d.ev.sponsorship.approvals.value} approved / ${d.ev.sponsorship.denials.value ?? '—'} denied → **${d.ev.sponsorship.tier.value}**${d.ev.sponsorship.tier_capped_from.value ? ` (capped from ${d.ev.sponsorship.tier_capped_from.value})` : ''}`;
  const lcaCell = (d) => { const v = d.ev.lca.value; if (v == null) return 'not loaded'; if (!v.certified) return '**0** anywhere'; return `${v.certified} US · ${v.certified_in_target_states} MA/NY · Level I ${v.level_I} / II ${v.level_II} · last ${v.last_received}`; };
  const evCell = (d) => d.ev.everify.value;
  const fund = (d) => `${d.ev.funding.latest_stage.value || '—'} ${d.ev.funding.latest_date.value || 'no date'} (${d.ev.funding.recency.value})`;

  o.push('## Apply now', '', `*Next action:* ${NEXT.apply}`, '');
  if (c('apply')) table(b.apply, [['Company', (d) => d.ev.company.value], ['Location', (d) => d.ev.location.value], ['Sponsorship [record → your-input tier]', spon],
    ['SWE LCAs [record]', lcaCell], ['E-Verify [record]', evCell],
    ['Matching postings [record] · browser check', (d) => d.live.matching_postings.map((m) => `${m.title.value} (${m.location.value}) · **${m.browser?.value ?? '—'}**`).join('<br>')], ['Why', (d) => d.route.why]]);
  else o.push('*None.*', '');

  o.push('## Network first', '', `*Next action:* ${NEXT.network}`, '');
  if (c('network')) table(b.network.sort((x, y) => x.route.priority.localeCompare(y.route.priority) || y.ev.sponsorship.approvals.value - x.ev.sponsorship.approvals.value),
    [['Priority', (d) => d.route.priority], ['Company', (d) => d.ev.company.value], ['Location', (d) => d.ev.location.value], ['Sponsorship', spon], ['SWE LCAs [record]', lcaCell], ['E-Verify [record]', evCell], ['Latest funding [record]', fund],
      ['Board checked [record]', (d) => `${d.live.jobs_on_board.value} jobs, 0 matching, ${d.live.fetched_at}`]]);
  else o.push('*None.*', '');

  o.push('## Check the job board first', '', `*Next action:* ${NEXT['check-board']}`, '');
  if (c('check-board')) table(b['check-board'], [['Company', (d) => d.ev.company.value], ['Location', (d) => d.ev.location.value], ['Sponsorship', spon], ['Latest funding', fund], ['Why unchecked', (d) => d.route.why]]);
  else o.push('*None.*', '');

  o.push('## Skip', '', `*Next action:* ${NEXT.skip}`, '');
  if (c('skip')) table(b.skip, [['Company', (d) => d.ev.company.value], ['Sponsorship', spon], ['Why', (d) => d.route.why]]);
  else o.push('*None.*', '');

  if (c('not-in-dataset')) { o.push('## Not in the dataset', '', `*Next action:* ${NEXT['not-in-dataset']}`, ''); for (const d of b['not-in-dataset']) o.push(`- ${d.name.value}`); o.push(''); }

  o.push('## Wage context (outside the scorer)', '');
  if (log.bls.status === 'ok')
    o.push(`BLS national median for ${log.bls.title.value} (SOC ${log.bls.soc_code.value}, OEWS ${log.bls.oews_year.value}): **${money(log.bls.national_median_wage.value)}** [record]. Each company's H-1B median salary above covers *all* its sponsored titles, not just software roles, so compare loosely. The engine's scorer gives role quality a weight of 0, so this number changes no decision.`, '');
  else o.push(`BLS wage unavailable: ${log.bls.reason}. No number is substituted.`, '');

  o.push('## What this run could not check', '');
  for (const x of log.cannot_verify) o.push(`- ${x}`);
  o.push('', '## Human gate (H1)', '', 'Before acting on any row: open each "Apply now" posting and confirm it is still open and can start after your OPT start date; for "Network first", decide whom to contact yourself. This tool sends nothing and applies nowhere.');
  return o.join('\n') + '\n';
}

const CANNOT_VERIFY = [
  'That a certified LCA became an H-1B **approval** or a **new hire**: an LCA is a wage attestation filed before the petition, it also covers extensions and transfers, and one LCA can cover several workers.',
  'That a "software developer" LCA (SOC 15-1252) is a **backend new-grad** role: Level I/II wage counts are entry-level evidence, not proof.',
  'Employers whose DOL filing name differs from the 80 Days name: the LCA join is exact on a name key, so a zero can be a naming mismatch.',
  'Sponsorship outside the extracted DOL release (see the received-date range in the run record), and the dates of the 80 Days approvals, which have no years.',
  'Whether a browser-active posting is real hiring, or can wait for a start date months away.',
  'Postings on company career sites that the browser check cannot read (reported as uncertain → check the board).',
  'Companies whose job board was not found or not confirmed: they stay unchecked.',
  'E-Verify for companies not looked up, or enrolled under a different legal name: a missing row means "not looked up", never "not enrolled".',
  'Funding accuracy: the 80 Days funding columns contain visible mismatches (e.g. a large professional-services firm listed with a "Seed" round).',
];

function main() {
  const o = args(process.argv.slice(2));
  const todayStr = o.today || todayLocal();
  assertSafeOutDir(o.outDir);
  const inputs = { persona: rel(o.persona), csv: rel(o.csv), formd_dir: rel(o.formdDir), bls: rel(o.bls), boards: rel(o.boards), liveness: rel(o.liveness), everify: rel(o.everify), lca: rel(o.lca), scorer: rel(DEFAULTS.scorer), out_dir: rel(o.outDir) };
  const logPath = path.join(o.outDir, 'network-targets-log.json');
  const reportPath = path.join(o.outDir, 'network-targets-report.md');
  fs.mkdirSync(o.outDir, { recursive: true });

  const pv = loadPersona(o.persona, todayStr);
  const persona = pv.p;
  const base = { _tool: 'network-targets', _version: '0.2.0', run: { today: todayStr, generated_at: new Date().toISOString() }, inputs,
    persona: L(persona.persona, SRC.input, 'persona.persona'), persona_target: { states: L(persona.target.states, SRC.input, 'persona.target.states'), sponsored_title_pattern: L(persona.target.sponsored_title_pattern, SRC.input, 'persona.target.sponsored_title_pattern') } };

  let tl;
  try { tl = timeline(pv); }
  catch (e) {
    if (e.gate !== 'G2') throw e;
    for (const f of ['roles.json', 'role-scores.json', 'role-scores.md']) fs.rmSync(path.join(o.outDir, f), { force: true });
    const log = { ...base, status: 'halted', halt: { gate: e.gate, code: e.code, message: e.message }, timeline: e.timeline, buckets: null };
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    fs.writeFileSync(reportPath, renderReport(log));
    console.error(`✗ ${e.gate} ${e.code}: ${e.message}`);
    console.error(`  halted — no decisions written. ${rel(logPath)} + ${rel(reportPath)}`);
    process.exit(e.exitCode);
  }

  const rows = loadCsv(o.csv);
  const csvRel = rel(o.csv);
  const states = new Set(persona.target.states.map((s) => s.toUpperCase()));
  const titleRe = new RegExp(persona.target.sponsored_title_pattern, 'i');
  const candidates = rows.filter((r) => states.has(String(r.state).toUpperCase()) && (toNum(r['Total Approvals']) ?? 0) > 0 && titleRe.test(r.top_job_titles_sponsored));

  const formd = loadFormD(o.formdDir);
  const bls = loadBls(o.bls, persona.target.soc_code);

  const lca = loadLca(o.lca);
  const everify = loadEverify(o.everify);
  const evs = candidates.map((r) => companyEvidence(r, persona, pv.today, formd, csvRel, lca, everify));
  const boards = openBoards(o.boards);
  const raw = new Map(evs.map((ev) => [ev.key, liveness(ev.key, boards, persona.target)]));
  // Every matching posting URL, before the browser gate: the input to live-check.mjs and `npm run ats:liveness -- --file`.
  const urls = [...raw.values()].filter((l) => l.state === 'live-match').flatMap((l) => l.matching_postings.map((m) => m.url.value));
  fs.writeFileSync(path.join(o.outDir, 'posting-urls.txt'), `# matching posting URLs from ${rel(o.boards)} (${todayStr}); input to live-check.mjs\n${urls.join('\n')}\n`);
  const lv = loadLiveness(o.liveness, boards);
  const lives = new Map([...raw].map(([k, l]) => [k, browserGate(l, lv)]));

  // Only companies whose liveness was actually checked go to the scorer.
  // (The scorer treats a missing liveness factor as 1 = open; unchecked must never reach it.)
  const roles = evs.filter((ev) => lives.get(ev.key).state !== 'unchecked').flatMap((ev) => toRoles(ev, lives.get(ev.key), tl, persona.fit_ratings));
  const rolesPath = path.join(o.outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));

  let scored = [], scorerSummary = null;
  if (roles.length) {
    const out = execFileSync(process.execPath, [DEFAULTS.scorer, rolesPath, '--out-dir', o.outDir], { encoding: 'utf8' });
    scorerSummary = out.split('\n')[0].replace(/^✓\s*/, '');
    scored = JSON.parse(fs.readFileSync(path.join(o.outDir, 'role-scores.json'), 'utf8')).roles;
  } else {
    for (const f of ['role-scores.json', 'role-scores.md']) fs.rmSync(path.join(o.outDir, f), { force: true });
    scorerSummary = 'not run: no company had a readable board snapshot (0 roles)';
  }

  const buckets = { apply: [], network: [], 'check-board': [], skip: [], 'not-in-dataset': [] };
  for (const ev of evs) {
    const live = lives.get(ev.key);
    const r = route(ev, live, scored);
    buckets[r.bucket].push({ ev, live, route: r, next_action: NEXT[r.bucket] });
  }
  const allKeys = new Set(rows.map((r) => nameKey(r.company_name)));
  for (const name of persona.target.named_companies || [])
    if (!allKeys.has(nameKey(name))) buckets['not-in-dataset'].push({ name: L(name, SRC.input, 'persona.target.named_companies'), route: { bucket: 'not-in-dataset', why: 'no row with this name key in the CSV' }, next_action: NEXT['not-in-dataset'] });

  const log = { ...base, status: 'ok', timeline: tl,
    counts: { csv_rows: rows.length, candidates: candidates.length, ...Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])) },
    lca: { status: lca.status, file: lca.file, provenance: lca.provenance, matched: evs.filter((e) => e.lca.value?.certified > 0).length,
      tiers_capped: evs.filter((e) => e.sponsorship.tier_capped_from.value).length },
    everify: { status: everify.status, file: everify.file, looked_up: evs.filter((e) => e.everify.value !== 'not-looked-up').length,
      open: evs.filter((e) => e.everify.value === 'open').length },
    liveness: { mode: lv.mode, file: lv.file, started_at: lv.started_at ?? null, snapshot_captured_at: lv.snapshot_captured_at ?? null, checker: lv.checker ?? null,
      postings_matched: urls.length,
      postings: Object.fromEntries(['active', 'expired', 'uncertain', 'unverified', 'not-run'].map((k) => [k, [...lives.values()].flatMap((l) => l.matching_postings || []).filter((m) => m.browser?.value === k).length])) },
    formd: { files: formd.files, filings: formd.filings, matched: evs.filter((e) => e.funding.formd_sample_match.value).length, note: formd.note },
    bls, scorer: { command: `node ${rel(DEFAULTS.scorer)} ${rel(rolesPath)} --out-dir ${rel(o.outDir)}`, roles_sent: roles.length, summary: scorerSummary,
      not_sent: evs.filter((e) => lives.get(e.key).state === 'unchecked').length, why_not_sent: 'liveness unchecked; the scorer would treat a missing liveness factor as open' },
    buckets, cannot_verify: CANNOT_VERIFY };
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  fs.writeFileSync(reportPath, renderReport(log));

  console.log(`✓ network-targets ${todayStr}: ${candidates.length} candidates from ${rows.length} CSV rows`);
  console.log(`  apply ${buckets.apply.length} · network ${buckets.network.length} · check-board ${buckets['check-board'].length} · skip ${buckets.skip.length} · not-in-dataset ${buckets['not-in-dataset'].length}`);
  console.log(`  liveness: ${lv.mode} · postings ${JSON.stringify(log.liveness.postings)}`);
  console.log(`  LCA: ${lca.status}${lca.status === 'ok' ? ` · ${log.lca.matched}/${candidates.length} with a certified ${persona.target.soc_code} LCA · ${log.lca.tiers_capped} tier(s) capped` : ''} · E-Verify: ${log.everify.looked_up} looked up, ${log.everify.open} open`);
  console.log(`  scorer: ${scorerSummary}`);
  console.log(`  Form D sample match: ${log.formd.matched}/${candidates.length} (${formd.filings} sample filings)`);
  console.log(`  ${rel(logPath)}  +  ${rel(reportPath)}`);
}

try { main(); }
catch (e) {
  if (e instanceof GateError) { console.error(`✗ ${e.gate} ${e.code}: ${e.message}`); console.error('  nothing decided.'); process.exit(e.exitCode); }
  throw e;
}
