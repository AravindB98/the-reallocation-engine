#!/usr/bin/env node
// opt-countdown.mjs — OPT-window countdown for a May-2027 MS Information Systems /
// Business Analytics graduate targeting BI-analyst roles (SOC 15-2051.01).
//
// What it does, in order (each step is a gate from the recipe):
//   G0  the OPT window is still open                 (run-level; exit 3 if not)
//   G1  the company has exactly one row in the 80-Days CSV    (else: blocked, NOT scored)
//   G2  the posting has a dated liveness result ≤ 7 days old  (else: blocked, NOT scored)
//   G3  timeline factor from OPT start / 90-day deadline / posting start / hiring lag
//   →   writes a roles.json shaped like data/examples/ch11-roles.json and runs the
//       EXISTING scorer (scripts/score/role-scorer.mjs) as a CLI — it is not copied here.
//   →   writes a JSON log (for an agent) and a Markdown report (for the person).
//
// A blocked role is never given a made-up value to make it scorable. It is listed
// with the reason and the human action that would clear it.
//
// Usage (from the repo root):
//   node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
//   … [--profile p.json] [--roles r.json] [--as-of YYYY-MM-DD]
//     [--liveness-log saved-ats-liveness-output.txt --liveness-date YYYY-MM-DD]
//     [--out-dir dir] [--csv path] [--soc path] [--formd-dir dir]
//
// Exit: 0 ok · 2 bad input · 3 G0 (OPT window closed / invalid dates) · 4 scorer failed

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LABEL, GateError, parseCsv, parseDate, iso, optWindow, timelineFactor, indexCompanies,
  lookupCompany, sponsorshipTier, fundingContext, socContext, parseLivenessLog, livenessGate,
  nextAction, normName,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(REPO, path.resolve(p)).replace(/\\/g, '/');

const RECIPE_VERSION = '0.1.1';

const DEFAULTS = {
  profile: path.join(HERE, 'examples/profile.persona.json'),
  roles: path.join(HERE, 'examples/roles.persona.json'),
  csv: path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  soc: path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  formd: path.join(REPO, 'data/sec/form-d/processed/sample'),
  scorer: path.join(REPO, 'scripts/score/role-scorer.mjs'),
  outRoot: path.join(REPO, 'course/2026fa/submissions/anishagaikar0420/runs'),
};

function arg(args, name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
function die(code, msg) { console.error(`✗ ${msg}`); process.exit(code); }
function readJson(p, what) {
  if (!p || !fs.existsSync(p)) die(2, `${what} not found: ${p}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(2, `${what} is not valid JSON (${p}): ${e.message}`); }
}
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function loadFormDNames(dir) {
  const names = new Set(); const files = [];
  if (!fs.existsSync(dir)) return { names, files, companies: 0 };
  let companies = 0;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.sample.json')).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const c of d.companies || []) { names.add(normName(c.company?.name)); companies++; }
    files.push(f);
  }
  return { names, files, companies };
}

export function run(argv) {
  const args = argv.slice(2);
  const profilePath = arg(args, '--profile') || DEFAULTS.profile;
  const rolesPath = arg(args, '--roles') || DEFAULTS.roles;
  const csvPath = arg(args, '--csv') || DEFAULTS.csv;
  const socPath = arg(args, '--soc') || DEFAULTS.soc;
  const formdDir = arg(args, '--formd-dir') || DEFAULTS.formd;
  const livLog = arg(args, '--liveness-log');
  const livDate = arg(args, '--liveness-date');

  const profile = readJson(profilePath, 'profile');
  const rolesIn = readJson(rolesPath, 'roles file');
  const roles = Array.isArray(rolesIn) ? rolesIn : rolesIn.roles;
  if (!Array.isArray(roles) || roles.length === 0) die(2, `roles file has no roles: ${rolesPath}`);

  let asOf;
  try { asOf = parseDate(arg(args, '--as-of') || profile.as_of || new Date().toISOString().slice(0, 10), '--as-of'); }
  catch (e) { die(2, e.message); }
  const outDir = path.resolve(arg(args, '--out-dir') || path.join(DEFAULTS.outRoot, `${iso(asOf)}-v${RECIPE_VERSION}`));
  if (/^data(\/|$)/.test(rel(outDir)) || /^(recipes|logs)(\/|$)/.test(rel(outDir))) die(2, `refusing to write into a maintained repo folder: ${rel(outDir)}`);

  // ── G0 ─────────────────────────────────────────────────────────────────────
  let win;
  try { win = optWindow(profile, asOf); }
  catch (e) { die(e instanceof GateError ? 3 : 2, `G0 ${e.message}`); }

  for (const p of [csvPath, socPath]) if (!fs.existsSync(p)) die(2, `data file missing: ${p}`);
  const csvRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const socRows = parseCsv(fs.readFileSync(socPath, 'utf8'));
  const idx = indexCompanies(csvRows);
  const formd = loadFormDNames(formdDir);
  const rules = profile.rules;
  if (!rules) die(2, 'profile.rules is missing — every threshold must be stated as your-input');

  let logMap = null; const logMeta = {};
  if (livLog) {
    if (!fs.existsSync(livLog)) die(2, `liveness log not found: ${livLog}`);
    if (!livDate) die(2, '--liveness-log needs --liveness-date (the day you ran npm run ats:liveness)');
    logMap = parseLivenessLog(fs.readFileSync(livLog, 'utf8'));
    logMeta.file = rel(livLog); logMeta.checked_on = livDate;
  }

  const evaluated = []; const scorerInput = [];
  for (const role of roles) {
    const e = { role_id: role.role_id, company: role.company, title: role.title, soc: role.soc, posting_url: role.posting_url ?? null, gates: {}, context: {} };
    evaluated.push(e);
    // context (never gates, never votes in the scorer)
    e.context.soc = socContext(socRows, role.soc);
    e.context.formd_sample = { matched: formd.names.has(normName(role.company)), label: LABEL.record,
      note: `checked ${formd.files.length} shipped sample files (${formd.companies} companies); full quarters are gitignored, so "not matched" proves nothing` };

    // G1
    const hit = lookupCompany(idx, role.company);
    e.gates.G1_company = { status: hit.status, normalized_name: hit.key, candidates: hit.candidates };
    if (hit.status !== 'ok') { e.status = 'blocked'; e.blocked_reason = hit.status; e.next = { bucket: 'human research', action: hit.status === 'company-not-found' ? `No row for "${hit.key}" in the 80-Days CSV. Check the DOL LCA disclosure data by hand before deciding; do not treat this as "never sponsors".` : `Several rows match "${hit.key}"; pick the right legal entity by hand.` }; continue; }
    e.context.csv_company_name = { value: hit.row.company_name, label: LABEL.record };
    const sp = sponsorshipTier(hit.row, rules);
    e.sponsorship = sp;
    e.context.funding = fundingContext(hit.row, asOf);

    // G2
    let lg;
    try { lg = livenessGate(role, asOf, rules, logMap, logMeta); } catch (err) { die(2, err.message); }
    e.gates.G2_liveness = lg;
    if (lg.status !== 'ok') { e.status = 'blocked'; e.blocked_reason = lg.reason; e.next = { bucket: 'human check', action: lg.next }; continue; }

    // G3
    let tl;
    try { tl = timelineFactor(role, win, asOf, rules); } catch (err) { die(2, err.message); }
    e.gates.G3_timeline = tl;

    // fit — must be supplied; never defaulted
    const fitP = role.fit?.p;
    if (typeof fitP !== 'number' || fitP < 0 || fitP > 1) { e.status = 'blocked'; e.blocked_reason = 'fit-missing'; e.next = { bucket: 'human check', action: 'Rate your fit 0–1 for this role (your-input) and re-run.' }; continue; }
    e.fit = { value: fitP, label: role.fit.source || LABEL.input };

    e.status = 'scored';
    scorerInput.push({
      role_id: role.role_id, company: role.company, title: role.title,
      sponsorship: { p: sp.p, tier: sp.tier, source: LABEL.record },
      fit: { p: fitP, source: e.fit.label },
      liveness: { factor: lg.factor, source: lg.label },
      timeline: { factor: tl.factor, source: LABEL.input },
    });
  }

  fs.mkdirSync(outDir, { recursive: true });
  const rolesJson = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesJson, JSON.stringify(scorerInput, null, 2) + '\n');

  let scored = { roles: [] }; let scorerStdout = '';
  if (scorerInput.length) {
    try {
      scorerStdout = execFileSync(process.execPath, [DEFAULTS.scorer, rolesJson, '--out-dir', outDir], { encoding: 'utf8', cwd: REPO });
    } catch (err) { die(4, `scorer failed: ${err.stderr || err.message}`); }
    scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
  }
  const byId = new Map(scored.roles.map((r) => [r.role_id, r]));
  for (const e of evaluated) {
    if (e.status !== 'scored') continue;
    const s = byId.get(e.role_id);
    e.decision = s.recommendation; e.composite = s.composite; e.scorer_reason = s.reason; e.scorer_arithmetic = s.trace.arithmetic;
    e.next = nextAction(s.recommendation, { timelineClosed: e.gates.G3_timeline.factor === 0, tier: e.sponsorship.tier });
  }

  const counts = { Apply: 0, Consider: 0, Skip: 0, blocked: 0 };
  for (const e of evaluated) counts[e.status === 'blocked' ? 'blocked' : e.decision]++;
  const evenCount = evaluated.filter((e) => e.sponsorship?.raw.even_counts).length;

  const log = {
    _recipe: 'anishagaikar0420-msis-bi-analyst-opt-countdown', recipe_version: RECIPE_VERSION,
    run_date: iso(asOf), mode: 'RUNNABLE-SAMPLE',
    labels_used: { record: 'read from a repo data file or saved tool output', 'your-input': 'dates, ratings, and rules the student supplied', 'model-judgment': 'none — this prototype calls no model' },
    inputs: {
      profile: rel(profilePath), roles: rel(rolesPath),
      csv: { path: rel(csvPath), sha256: sha256(csvPath), rows: csvRows.length },
      soc: { path: rel(socPath), sha256: sha256(socPath), rows: socRows.length },
      formd_samples: { dir: rel(formdDir), files: formd.files, companies: formd.companies, note: 'samples only (first 50 companies per quarter)' },
      liveness_log: logMap ? { file: logMeta.file, checked_on: logMeta.checked_on, urls: logMap.size } : null,
    },
    opt_window: win, rules: { value: rules, label: LABEL.input },
    scorer: { path: rel(DEFAULTS.scorer), input: rel(rolesJson), output: [rel(path.join(outDir, 'role-scores.json')), rel(path.join(outDir, 'role-scores.md'))], stdout: scorerStdout.trim() },
    summary: { evaluated: evaluated.length, ...counts, skip_rate_of_scored: scorerInput.length ? +(counts.Skip / scorerInput.length).toFixed(3) : null, even_approval_counts: `${evenCount} of ${evaluated.filter((e) => e.sponsorship?.raw.total_approvals.value != null).length} matched companies that have approval counts` },
    roles: evaluated,
  };
  const logPath = path.join(outDir, 'opt-countdown-log.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
  const mdPath = path.join(outDir, 'opt-countdown-report.md');
  fs.writeFileSync(mdPath, renderReport(log));

  console.log(`✓ OPT window ${win.opt_start.value} → ${win.unemployment_deadline.value} (run date ${iso(asOf)}, ${win.days_until_opt_start} days until OPT start)`);
  console.log(`✓ evaluated ${evaluated.length} roles → Apply ${counts.Apply} · Consider ${counts.Consider} · Skip ${counts.Skip} · blocked ${counts.blocked}`);
  if (scorerStdout) console.log(scorerStdout.trim().split('\n').map((l) => `  scorer: ${l.trim()}`).join('\n'));
  for (const e of evaluated.filter((x) => x.status === 'blocked')) console.log(`  ⛔ ${e.role_id}: blocked (${e.blocked_reason})`);
  console.log(`  ${rel(logPath)}  +  ${rel(mdPath)}`);
  return log;
}

const spCell = (e) => { const r = e.sponsorship.raw; return r.total_approvals.value == null ? `${e.sponsorship.tier}: no approvals on record` : `${e.sponsorship.tier}: ${r.total_approvals.value} approvals / ${r.total_denials.value ?? '—'} denials`; };
const money = (x) => (x == null ? '—' : `$${Math.round(x).toLocaleString('en-US')}`);
function renderReport(L) {
  const o = [];
  const w = L.opt_window;
  const S0 = L.summary;
  o.push(`# OPT-window countdown — ${L.run_date}`);
  o.push('');
  o.push('## Executive summary');
  o.push('');
  o.push(`This report checks ${S0.evaluated} analyst job postings against two things a graduating international student cannot easily see: whether the job could start inside her OPT window (after OPT begins, before the 90-day unemployment limit runs out), and whether the company has a record of H-1B sponsorship. `
    + `It recommends applying to ${S0.Apply}, looking closer at ${S0.Consider}, and skipping ${S0.Skip}; ${S0.blocked} could not be judged because a fact was missing, and those are listed with what to check by hand rather than guessed. `
    + `It is a sample run: ${L.inputs.liveness_log ? 'posting liveness came from a saved checker run' : 'whether each posting is still open was not checked online'}, and the sponsorship counts are company-wide, not specific to analyst roles.`);
  o.push('');
  o.push('## Run record');
  o.push('');
  o.push(`*Recipe \`${L._recipe}\` v${L.recipe_version} · mode **${L.mode}** · no AI model was called; every value below is **record** (from a repo file) or **your-input** (a date, rating or rule you supplied).*`);
  o.push('');
  o.push('## Your window');
  o.push('');
  o.push(`| | Date | Label |`);
  o.push('|---|---|---|');
  o.push(`| Program end | ${w.program_end.value} | your-input (check your I-20) |`);
  o.push(`| OPT start | ${w.opt_start.value} | your-input (the date you request on the I-765) |`);
  o.push(`| 90-day unemployment deadline | ${w.unemployment_deadline.value} | your-input (derived; confirm the 90-day figure with your DSO) |`);
  o.push('');
  o.push(`**${w.days_until_opt_start} days until OPT starts.** A posting is only worth tailoring if the job can start between ${w.opt_start.value} and ${w.unemployment_deadline.value}.`);
  o.push('');
  const S = L.summary;
  o.push(`## Result: ${S.evaluated} roles → Apply ${S.Apply} · Consider ${S.Consider} · Skip ${S.Skip} · blocked ${S.blocked}`);
  o.push('');
  o.push(`Skip rate among scored roles: ${S.skip_rate_of_scored == null ? '—' : `${Math.round(S.skip_rate_of_scored * 100)}%`}. Blocked roles were **not** scored — a missing fact is not a zero.`);
  o.push('');
  o.push('| Role | Decision | Composite | Gates (liveness · timeline) | Sponsorship (record) | Next action |');
  o.push('|---|---|---|---|---|---|');
  const order = { Apply: 0, Consider: 1, Skip: 2 };
  const sorted = [...L.roles].sort((a, b) => (a.status === 'blocked') - (b.status === 'blocked') || (order[a.decision] ?? 3) - (order[b.decision] ?? 3) || (b.composite ?? 0) - (a.composite ?? 0));
  for (const e of sorted) {
    const name = `${e.company} — ${e.title}`;
    if (e.status === 'blocked') { o.push(`| ${name} | ⛔ blocked | — | — | ${e.sponsorship ? `${spCell(e)}` : '—'} | **${e.blocked_reason}** → ${e.next.action} |`); continue; }
    const t = e.gates.G3_timeline; const lv = e.gates.G2_liveness;
    o.push(`| ${name} | **${e.decision}** | ${e.composite.toFixed(3)} | liveness ${lv.result} (${lv.factor}) · timeline ${t.state} (${t.factor}) — ${t.reason} | ${spCell(e)} | [${e.next.bucket}] ${e.next.action} |`);
  }
  o.push('');
  o.push('## Per-role evidence, labeled');
  for (const e of sorted) {
    o.push('');
    o.push(`### ${e.role_id} — ${e.company}`);
    o.push('');
    o.push('| Value | Label | Source |');
    o.push('|---|---|---|');
    o.push(`| Company match: ${e.gates.G1_company.status}${e.context.csv_company_name ? ` → "${e.context.csv_company_name.value}"` : ` (tried "${e.gates.G1_company.normalized_name}")`} | record | 80-Days CSV |`);
    if (e.sponsorship) {
      const r = e.sponsorship.raw;
      o.push(`| H-1B approvals ${r.total_approvals.value ?? '—'}, denials ${r.total_denials.value ?? '—'}, rate ${r.approval_rate.value == null ? '—' : r.approval_rate.value.toFixed(1) + '%'} | record | 80-Days CSV (company-wide, all roles) |`);
      o.push(`| Sampled sponsored titles: ${r.top_job_titles_sponsored.value.join('; ') || '—'} | record | 80-Days CSV (≤ 5 titles) |`);
      o.push(`| Analyst titles matched: ${r.analyst_titles_matched.value.join('; ') || 'none'} | your-input rule | keyword list in profile |`);
      o.push(`| Tier **${e.sponsorship.tier}** → p = ${e.sponsorship.p} | your-input rule on record counts | profile.rules |`);
      if (e.sponsorship.none_caveat) o.push(`| ⚠ ${e.sponsorship.none_caveat} | — | — |`);
      const f = e.context.funding;
      o.push(`| Latest funding: ${f.latest_funding_stage.value || '—'}, ${money(f.latest_funding_amount.value)}, ${f.latest_funding_date.value || '—'}${f.months_since_funding != null ? ` (${f.months_since_funding} months ago)` : ''} | record | 80-Days CSV (context only — the scorer has no funding vote) |`);
    }
    o.push(`| Form D sample match: ${e.context.formd_sample.matched ? 'yes' : 'no (samples only — proves nothing)'} | record | data/sec/form-d/processed/sample |`);
    const sc = e.context.soc;
    o.push(sc.status === 'ok'
      ? `| SOC ${sc.soc} ${sc.title.value}: national median ${money(sc.annual_median_wage_national.value)}, cognitive pivot ${sc.cognitive_pivot_score.value} | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |`
      : `| SOC ${sc.soc}: **missing (${sc.reason})** — no wage shown, none invented | record | BLS/O*NET compact |`);
    const lg = e.gates.G2_liveness;
    if (lg) o.push(lg.status === 'ok' ? `| Liveness: ${lg.result} on ${lg.checked_on} | ${lg.label} | ${lg.method} |` : `| Liveness: **${lg.reason}** | — | not checked |`);
    const t = e.gates.G3_timeline;
    if (t) o.push(`| Posting start ${t.posting_start.value ?? 'not stated'}; hiring lag ${t.hiring_lag_days.value} days; earliest work ${t.earliest_work_date.value}; slack ${t.slack_days} days → factor ${t.factor} | your-input | profile + roles file |`);
    if (e.fit) o.push(`| Fit ${e.fit.value} | ${e.fit.label} | your own rating in the roles file |`);
    if (e.scorer_arithmetic) o.push(`| Scorer: ${e.scorer_arithmetic} → ${e.decision} | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |`);
  }
  o.push('');
  o.push('## What this run did NOT verify');
  o.push('');
  const liv = L.inputs.liveness_log ? `Liveness came from saved \`npm run ats:liveness\` output (${L.inputs.liveness_log.file}, ${L.inputs.liveness_log.checked_on}).` : 'Liveness in this run was **not checked against the live web** — it is your-input from the roles file. Run `npm run ats:liveness` and pass `--liveness-log` before trusting any Apply.';
  o.push(`- ${liv}`);
  o.push('- H-1B counts are **company-wide**, not for analyst roles; the title list is a ≤5-title sample.');
  o.push(`- Every approval and denial count in the matched rows is an even number (${L.summary.even_approval_counts}). A possible upstream double-count — cause not confirmed. Tiers use a threshold, so a 2× error could move a company across it.`);
  o.push('- OPT/unemployment figures are the student\'s stated assumptions, not read from a regulation. Confirm with a DSO.');
  o.push('- Posting start dates and hiring lags are your-input. A recruiter can change either.');
  o.push('- Role quality and funding are shown as context only; they do not change any decision (role_quality weight 0.0; no funding term in the scorer).');
  o.push('- A blocked company is **not** a non-sponsor. It is an open question for you to research.');
  o.push('');
  o.push('*You decide at every gate. This report hands the decision back to you.*');
  return o.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run(process.argv);
