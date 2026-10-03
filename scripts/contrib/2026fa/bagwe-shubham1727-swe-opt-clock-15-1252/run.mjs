#!/usr/bin/env node
// run.mjs — swe-opt-clock prototype (sample mode).
// Recipe: recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md
//
// For an unemployed F-1 OPT new-grad software engineer (SOC 15-1252): check each
// candidate role against local records (80 Days CSV, Form D samples, BLS compact),
// classify its saved posting snapshot with the engine's liveness classifier,
// compute a timeline factor from the persona's unemployment clock, write a
// labeled roles.json, and hand it to the EXISTING Ch.11 scorer. Then check the
// scorer's output and write a JSON log (agent) + a Markdown report (person).
//
//   node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs [--as-of YYYY-MM-DD]
//        [--persona search/examples/neel-kapoor/profile.yml] [--roles <dir>/fixtures/sample-roles.json]
//        [--out-dir course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>]
//
// Exit codes: 0 ran · 2 bad invocation/input file · 3 stopped at G0 (persona clock)
//             4 halted at G4 (scorer output failed conformance) · 5 scorer crashed
// No network access. Sample mode only.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  LABEL, ALLOWED_LABELS, RULES, personaClock, timelineFactor, loadSponsorIndex, resolveCompany, sponsorshipTier,
  livenessFromSnapshot, loadSocIndex, roleQuality, loadFormDIndex, fundingSignal, checkScorerOutput,
  parseDate, iso, num,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = fs.realpathSync(path.resolve(HERE, '../../../..'));
const NAMESPACE = path.join(REPO, 'course/2026fa/submissions/bagwe-shubham1727');
const RECIPE = 'recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md';
const VERSION = '0.1.0';

// Paths outside the repo are recorded by file name only: a committed log must not
// carry someone's home directory or username.
const rel = (p) => {
  const r = path.relative(REPO, p);
  return r.startsWith('..') || path.isAbsolute(r) ? `<outside-repo>/${path.basename(p)}` : (r || '.');
};
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const die = (code, msg) => { console.error(`✗ ${msg}`); process.exit(code); };

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) die(2, `unexpected argument "${k}"`);
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) die(2, `${k} needs a value`);
    a[k.slice(2)] = v; i++;
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const asOfStr = args['as-of'] ?? localToday();
const asOf = parseDate(asOfStr);
if (!asOf || iso(asOf) !== asOfStr) die(2, `--as-of must be a real YYYY-MM-DD date, got "${asOfStr}"`);

const P = {
  persona: path.resolve(REPO, args.persona ?? 'search/examples/neel-kapoor/profile.yml'),
  roles: path.resolve(REPO, args.roles ?? path.join(rel(HERE), 'fixtures/sample-roles.json')),
  sponsors: path.resolve(REPO, args['sponsors-csv'] ?? 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  soc: path.resolve(REPO, args['soc-csv'] ?? 'data/bls/compact/soc_occupation_compact.csv'),
  formDDir: path.resolve(REPO, args['formd-dir'] ?? 'data/sec/form-d/processed/sample'),
  scorer: path.resolve(REPO, args.scorer ?? 'scripts/score/role-scorer.mjs'), // override exists only for BROKEN-* break tests
  outDir: path.resolve(REPO, args['out-dir'] ?? path.join('course/2026fa/submissions/bagwe-shubham1727/runs', asOfStr)),
};

// Never write over a tracked repo file: outputs go to my namespace or outside the repo.
const inside = (p, dir) => p === dir || p.startsWith(dir + path.sep);
if (inside(P.outDir, REPO) && !inside(P.outDir, NAMESPACE))
  die(2, `refusing to write to ${rel(P.outDir)}: outputs must stay under ${rel(NAMESPACE)}/ or outside the repo`);
for (const k of ['persona', 'roles', 'sponsors', 'soc', 'scorer']) if (!fs.existsSync(P[k])) die(2, `${k} file not found: ${rel(P[k])}`);
if (!fs.existsSync(P.formDDir)) die(2, `Form D sample dir not found: ${rel(P.formDDir)}`);

fs.mkdirSync(P.outDir, { recursive: true });
P.outDir = fs.realpathSync(P.outDir); // macOS /var → /private/var: keep every path the scorer sees canonical
const OUT = {
  rolesJson: path.join(P.outDir, 'roles.json'),
  log: path.join(P.outDir, 'run-log.json'),
  report: path.join(P.outDir, 'report.md'),
  gates: path.join(P.outDir, 'gate-decisions.md'),
  scores: path.join(P.outDir, 'role-scores.json'),
  scoresMd: path.join(P.outDir, 'role-scores.md'),
};
// A stopped or halted run must not leave a previous run's decisions lying around as if current.
for (const f of [OUT.report, OUT.gates]) fs.rmSync(f, { force: true });

const formDFiles = fs.readdirSync(P.formDDir).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(P.formDDir, f));
const log = {
  workflow: 'swe-opt-clock', recipe: RECIPE, recipe_version: VERSION, mode: 'sample', run_id: `swe-opt-clock-${asOfStr}`,
  as_of: asOfStr, generated_at: new Date().toISOString(), status: 'running',
  inputs: Object.fromEntries([['persona', P.persona], ['roles', P.roles], ['sponsors_csv', P.sponsors], ['soc_csv', P.soc], ['scorer', P.scorer],
    ...formDFiles.map((f) => [`form_d:${path.basename(f)}`, f])].map(([k, p]) => [k, { path: rel(p), sha256: sha256(p) }])),
  rules: RULES, gates: {}, roles: [], stop_conditions: [], outputs: {},
};
const writeLog = () => fs.writeFileSync(OUT.log, JSON.stringify(log, null, 2) + '\n');

// ── G0 persona clock ────────────────────────────────────────────────────────
let persona;
try { persona = yaml.load(fs.readFileSync(P.persona, 'utf8')); } catch (e) { die(2, `persona does not parse: ${e.message}`); }
const clock = personaClock(persona, asOf);
log.gates.G0_persona_clock = clock.ok ? { result: 'pass', clock } : { result: 'stop', ...clock.stop };
if (!clock.ok) {
  log.status = 'stopped'; log.stop_conditions.push({ gate: 'G0', ...clock.stop }); writeLog();
  console.error(`✗ STOP at G0 (persona clock): ${clock.stop.code}: ${clock.stop.detail}`);
  console.error(`  nothing was scored; no report written. Log: ${rel(OUT.log)}`);
  process.exit(3);
}

// ── load the role list and local evidence ─────────────────────────────────
let input;
try { input = JSON.parse(fs.readFileSync(P.roles, 'utf8')); } catch (e) { die(2, `roles file does not parse: ${e.message}`); }
const candidates = Array.isArray(input) ? input : input.roles;
if (!Array.isArray(candidates) || !candidates.length) die(2, 'roles file has no roles');
for (const c of candidates) for (const f of ['role_id', 'company_legal_name', 'title', 'soc'])
  if (!c[f]) die(2, `role ${c.role_id ?? '?'} is missing required field "${f}"`);

const sponsors = loadSponsorIndex(P.sponsors);
const socIdx = loadSocIndex(P.soc);
const formD = loadFormDIndex(formDFiles);

// ── per-role gates G1–G3 + report-only signals ─────────────────────────────
const fed = [];
for (const c of candidates) {
  const e = { role_id: c.role_id, company: c.company ?? c.company_legal_name, company_legal_name: c.company_legal_name, title: c.title, soc: c.soc, gates: {}, disposition: null };
  const snapPath = c.posting_snapshot ? path.resolve(path.dirname(P.roles), c.posting_snapshot) : null;
  let snap = null;
  if (snapPath) { try { snap = JSON.parse(fs.readFileSync(snapPath, 'utf8')); } catch { snap = null; } }

  const ent = resolveCompany(sponsors, c.company_legal_name);
  e.gates.G1_entity = ent.ok ? { result: 'pass', matched: ent.row.company_name, label: LABEL.record } : { result: 'hold', ...ent };
  e.role_quality = roleQuality(socIdx, c.soc);
  e.liveness = livenessFromSnapshot(snap, asOf);
  e.gates.G2_liveness = { result: e.liveness.hold ? 'hold' : (e.liveness.factor === 0 ? 'closed' : 'open'), code: e.liveness.code, detail: e.liveness.detail };
  // Who supplied a judgment-shaped input is declared in the roles file, not assumed:
  // a fit rating or hiring-lag guess written by an AI is a model-judgment (P8).
  const srcOf = (v) => (ALLOWED_LABELS.has(v) && v !== LABEL.record ? v : LABEL.input);
  const tl = timelineFactor(clock, c.time_to_start_days);
  const lagLabel = srcOf(c.time_to_start_source);
  e.timeline = { ...tl, label: lagLabel === LABEL.model ? LABEL.model : LABEL.input, lag_days: num(c.time_to_start_days), lag_basis: c.time_to_start_basis ?? null, lag_source: lagLabel };
  e.gates.G3_timeline = tl.ok ? { result: tl.factor === 0 ? 'closed' : 'open', factor: tl.factor, math: tl.math } : { result: 'hold', code: tl.code, detail: tl.detail };
  const fitP = num(c.fit?.p);
  e.fit = fitP != null && fitP >= 0 && fitP <= 1 ? { p: fitP, note: c.fit?.note ?? null, label: srcOf(c.fit?.source) } : null;

  if (ent.ok) {
    e.sponsorship = { ...sponsorshipTier(ent.row), label: LABEL.record, rule_label: LABEL.input };
    e.funding = fundingSignal(ent.row, formD, asOf);
    e.sponsored_median_salary = { value: num(ent.row.median_salary_offered), scope: 'all sponsored titles at this company, not this role', label: LABEL.record };
  }

  // Disposition: anything we would have to guess is held for a human, never scored.
  const holds = [];
  if (!ent.ok) holds.push({ code: 'unresolved-company', detail: ent.detail });
  else if (!e.sponsorship.scored) holds.push({ code: 'unknown-sponsorship', detail: e.sponsorship.reason });
  if (e.liveness.hold) holds.push({ code: `liveness-${e.liveness.code}`, detail: e.liveness.detail });
  if (!tl.ok) holds.push({ code: tl.code, detail: tl.detail });
  if (!e.fit) holds.push({ code: 'no-fit-rating', detail: 'fit.p must be your own rating in [0,1]; the scorer would silently treat a missing vote as 0' });
  if (holds.length) { e.disposition = 'not-scored'; e.holds = holds; log.roles.push(e); continue; }

  e.disposition = 'scored';
  const role = {
    role_id: c.role_id, company: e.company, title: c.title,
    sponsorship: { p: e.sponsorship.p, tier: e.sponsorship.tier, source: LABEL.record, _rule: e.sponsorship.reason },
    fit: { p: e.fit.p, source: e.fit.label },
    liveness: { factor: e.liveness.factor, source: e.liveness.label, _snapshot: `${e.liveness.capture_mode} captured ${e.liveness.captured_at}` },
    timeline: { factor: tl.factor, source: e.timeline.label, _math: tl.math, _lag_source: e.timeline.lag_source },
  };
  fed.push(role); log.roles.push(e);
}
fs.writeFileSync(OUT.rolesJson, JSON.stringify(fed, null, 2) + '\n');
log.outputs.roles_json = rel(OUT.rolesJson);

// ── scorer (the existing one, unmodified) + G4 conformance ──────────────────
let scores = null;
if (fed.length) {
  const sArgs = [P.scorer, OUT.rolesJson, '--out-dir', P.outDir];
  if (!clock.needs_sponsorship) {
    const prof = path.join(P.outDir, 'scorer-profile.json');
    fs.writeFileSync(prof, JSON.stringify({ authorization: 'no sponsorship needed' }) + '\n');
    sArgs.push('--profile', prof);
  } // needs sponsorship → pass no profile: the scorer's own default is needs-sponsorship.
  // cwd = the out-dir, so the scorer prints bare file names, never a path that could carry a home directory.
  const r = spawnSync(process.execPath, sArgs, { cwd: P.outDir, encoding: 'utf8' });
  log.scorer = { command: `node ${rel(P.scorer)} ${rel(OUT.rolesJson)} --out-dir ${rel(P.outDir)}`, exit: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() };
  if (r.status !== 0) { log.status = 'halted'; log.stop_conditions.push({ gate: 'G4', code: 'scorer-exit', detail: r.stderr.trim() }); writeLog(); die(5, `scorer exited ${r.status}: ${r.stderr.trim()}`); }
  try { scores = JSON.parse(fs.readFileSync(OUT.scores, 'utf8')); } catch (e) { scores = null; }
  const problems = checkScorerOutput(scores, fed, clock.needs_sponsorship);
  log.gates.G4_scorer_conformance = problems.length ? { result: 'halt', problems } : { result: 'pass' };
  if (problems.length) {
    log.status = 'halted'; log.stop_conditions.push({ gate: 'G4', code: 'scorer-output-nonconforming', problems }); writeLog();
    console.error('✗ HALT at G4: the scorer\'s output does not conform. No report written.');
    for (const p of problems) console.error(`  • ${p}`);
    process.exit(4);
  }
  log.outputs.role_scores_json = rel(OUT.scores); log.outputs.role_scores_md = rel(OUT.scoresMd);
} else {
  log.gates.G4_scorer_conformance = { result: 'skipped', detail: 'no role cleared G1–G3; scorer not run' };
}

// ── next action per role (where it lands in the 3-3-2 day) ─────────────────
const byId = new Map((scores?.roles ?? []).map((s) => [s.role_id, s]));
for (const e of log.roles) {
  if (e.disposition === 'not-scored') {
    const codes = e.holds.map((h) => h.code);
    // A closed gate is decisive without the missing evidence: don't send a person
    // to resolve a name or re-check a posting for a role the clock already rules out.
    if (e.timeline.ok && e.timeline.factor === 0)
      e.next = { block: 'drop', action: `Expected start ${e.timeline.expected_start} is after your hard deadline ${clock.hard_deadline}; the timeline gate is closed, so the missing evidence (${codes.join(', ')}) cannot change the outcome. Drop.` };
    else if (codes.includes('unresolved-company'))
      e.next = { block: 'human-now', action: 'Check the company\'s legal entity name and re-run. If it is still missing, this dataset simply has no row for it (the reason is not recorded); absence is not a "no".' };
    else if (codes.some((c) => c.startsWith('liveness-')))
      e.next = { block: 'human-now', action: 'Open the posting yourself (≤5 min). Re-capture a dated snapshot and re-run before spending any application time.' };
    else if (codes.includes('unknown-sponsorship'))
      e.next = { block: 'network-3h', action: 'No sponsorship record either way. Ask an engineer or the recruiter directly before applying.' };
    else e.next = { block: 'human-now', action: 'Fill the missing input named in the hold and re-run.' };
    continue;
  }
  const s = byId.get(e.role_id);
  e.decision = { recommendation: s.recommendation, composite: s.composite, reason: s.reason, label: 'scorer-output' };
  const strongSponsor = ['Proven', 'Likely'].includes(e.sponsorship.tier);
  if (e.liveness.factor === 0)
    e.next = strongSponsor
      ? { block: 'network-3h', action: `Posting is dead but ${e.company} has a ${e.sponsorship.tier} sponsorship record. Ask for an informational chat and watch the board for a reopen. Do not apply to this posting.` }
      : { block: 'drop', action: 'Dead posting, thin sponsorship record. Drop.' };
  else if (e.timeline.factor === 0)
    e.next = { block: 'drop', action: `Expected start ${e.timeline.expected_start} is after your hard deadline ${clock.hard_deadline}. Drop now; revisit only if the recruiter commits in writing to a start before ${clock.safe_deadline}.` };
  else if (s.recommendation === 'Apply')
    e.next = { block: 'apply-2h', action: 'Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent.' };
  else if (s.recommendation === 'Consider')
    e.next = { block: 'network-3h', action: `Network before applying: one conversation with an engineer at ${e.company} about ${e.timeline.factor < 1 ? 'how fast they can start a new grad' : 'whether they sponsor new-grad SWEs'}.` };
  else e.next = { block: 'drop', action: 'Evidence too thin for the 2-hour block. Drop.' };
}

const count = (f) => log.roles.filter(f).length;
const rec = (r) => count((e) => e.decision?.recommendation === r);
log.summary = {
  evaluated: log.roles.length, scored: fed.length, not_scored: log.roles.length - fed.length,
  apply: rec('Apply'), consider: rec('Consider'), skip: rec('Skip'),
  skip_rate_of_scored: fed.length ? Number((rec('Skip') / fed.length).toFixed(3)) : null,
  not_applying_rate_of_evaluated: Number(((log.roles.length - rec('Apply')) / log.roles.length).toFixed(3)),
  form_d_sample_matches: count((e) => e.funding?.form_d_sample_match),
};
log.status = 'completed';
log.outputs.report_md = rel(OUT.report); log.outputs.gate_decisions_md = rel(OUT.gates); log.outputs.run_log_json = rel(OUT.log);
writeLog();

// ── human report ────────────────────────────────────────────────────────────
const money = (x) => (x == null ? '—' : `$${Math.round(x).toLocaleString('en-US')}`);
const S = log.summary;
const md = [];
const nModel = log.roles.filter((e) => e.fit?.label === LABEL.model).length + log.roles.filter((e) => e.timeline?.label === LABEL.model).length;
const modelNote = nModel
  ? `This program calls no AI model, but ${nModel} of the input values (fit ratings and hiring-time guesses) were written by an AI assistant for this demo and are labeled model-judgment. Sponsorship history, pay and funding come from data files in the repository; posting copies are made-up stand-ins, not real pages.`
  : `No AI model was involved: fit ratings and hiring-time guesses are your own inputs, and sponsorship history, pay and funding come from data files in the repository.`;
const blockName = { 'apply-2h': 'Apply (2-hour block)', 'network-3h': 'Network (3-hour block)', 'human-now': 'You, now (≤5 min)', drop: 'Drop' };
md.push(`# Which software jobs are worth your next two hours — ${asOfStr}`);
md.push(`\n## Executive summary\n`);
md.push(`**What this is.** A check of ${S.evaluated} software engineering jobs against public sponsorship and funding records, each job's posting, and your visa clock. It's written for a new-grad software engineer on OPT who is currently between jobs.\n`);
md.push(`**Why read it.** Your 90-day unemployment allowance runs out on **${clock.unemployment_exhaustion_date ?? 'n/a (employed)'}**, much sooner than your OPT end date (${clock.opt_end_date}). Every application has to fit inside that window. This report tells you where to spend your time and why, and shows where each number came from.\n`);
md.push(`**What it found.** ${S.scored} of ${S.evaluated} jobs had enough evidence to score: **${S.apply} Apply, ${S.consider} Consider, ${S.skip} Skip**. The other ${S.not_scored} need you first: a company the records can't find, a posting nobody has checked recently, or a company with no sponsorship record either way. ${modelNote} The sponsorship records show what a company *did* in the past, not what it will do for you now. Ask before you rely on them.\n`);
if (S.skip_rate_of_scored != null && S.skip_rate_of_scored < 0.5)
  md.push(`> **Skip rate ${Math.round(S.skip_rate_of_scored * 100)}% of scored roles, below the ~50% a healthy run skips.** This list was hand-picked from companies already known to sponsor, so it is biased toward sponsors. Treat that as a property of the input, not good news.\n`);

md.push(`## Your clock (check these against your I-20 / EAD / DSO record first)\n`);
md.push(`| | |\n|---|---|`);
md.push(`| Run date | ${clock.as_of} |`);
md.push(`| OPT (EAD) end | ${clock.opt_end_date} [your-input] |`);
md.push(`| Unemployment days used | ${clock.unemployment_days_used_snapshot} as of ${clock.unemployment_days_as_of} → **${clock.unemployment_days_used_projected} projected to the run date** of ${clock.unemployment_ceiling} [your-input, projected] |`);
md.push(`| Days left | **${clock.unemployment_days_remaining}** → allowance runs out **${clock.unemployment_exhaustion_date ?? '—'}** |`);
md.push(`| Hard deadline (must start by) | **${clock.hard_deadline}** (binding: ${clock.hard_deadline_binding}) |`);
md.push(`| Your buffer | ${clock.buffer_target} days → aim to start by **${clock.safe_deadline}** |`);
md.push(`\nA start date after the hard deadline scores 0 on timeline: Skip, whatever else is true. Anything legal (STEM extension, what counts as employment) goes to your DSO. This report doesn't decide it.\n`);

md.push(`## Decisions\n`);
md.push(`| Job | Decision | Why | What to do next |`);
md.push(`|---|---|---|---|`);
const order = { 'apply-2h': 0, 'network-3h': 1, 'human-now': 2, drop: 3 };
for (const e of [...log.roles].sort((a, b) => order[a.next.block] - order[b.next.block] || (b.decision?.composite ?? -1) - (a.decision?.composite ?? -1))) {
  const d = e.decision ? `**${e.decision.recommendation}** (${e.decision.composite})` : '**Not scored**';
  const why = e.decision ? e.decision.reason : e.holds.map((h) => h.code).join(', ');
  md.push(`| ${e.company}: ${e.title} | ${d} | ${why} | ${blockName[e.next.block]}: ${e.next.action} |`);
}

md.push(`\n## Where each number came from (verified vs. inferred)\n`);
md.push(`Labels: **[record]** = read from a data file in the repo · **[your-input]** = a number supplied as input (persona dates, posting copies) or a rule this recipe chose · **[model-judgment]** = a judgment written by an AI (in this demo: fit ratings and hiring-time guesses).\n`);
md.push(`On the sponsorship term the scorer shows **[record]** because the *tier* is decided by records; the number per tier is this recipe's table (0.9 and 0.6 from the book's example, 0.3 a placeholder), shown on every job below.\n`);
md.push(`The companies are real rows in the dataset, but in sample mode the job titles, posting copies and hiring times are made up; nothing here says these companies are hiring.\n`);
for (const e of log.roles) {
  md.push(`### ${e.company}: ${e.title}\n`);
  const L = [];
  if (e.gates.G1_entity.result === 'pass') L.push(`- Company match: CSV row "${e.gates.G1_entity.matched}" by exact normalized name [record]`);
  else L.push(`- Company match: **none** (${e.gates.G1_entity.detail}). No sponsorship or funding value exists for this job.`);
  if (e.sponsorship) {
    const ev = e.sponsorship.evidence;
    if (e.sponsorship.scored) {
      L.push(`- H-1B history: ${ev.approvals} approvals, ${ev.denials} denials, ${ev.approval_rate?.toFixed(1)}% approved [record; fiscal years not in the file]`);
      L.push(`- Sponsored titles on record: ${ev.titles.map((t) => `"${t}"`).join(', ') || '—'} [record]. SWE-matching: ${ev.swe_titles.length ? ev.swe_titles.map((t) => `"${t}"`).join(', ') : 'none'} [title rule = your-input; not an SOC code]`);
    } else L.push(`- H-1B history: **empty in the file** [record]. That means no trace, not "does not sponsor".`);
    L.push(`- Sponsorship tier: **${e.sponsorship.tier}**${e.sponsorship.p != null ? ` → p = ${e.sponsorship.p}` : ''}: ${e.sponsorship.reason} [tier inputs = record; thresholds and tier→p table = your-input]`);
  }
  if (e.liveness.classifier) L.push(`- Posting: ${e.liveness.classifier.result} (${e.liveness.classifier.code}) from a ${e.liveness.capture_mode} snapshot captured ${e.liveness.captured_at}, ${e.liveness.age_days} d before the run → ${e.liveness.factor == null ? '**held**' : `liveness factor ${e.liveness.factor}`} [${e.liveness.label}: sample-mode snapshot, not a fetched page]`);
  else L.push(`- Posting: **held**: ${e.liveness.detail}`);
  if (e.timeline.ok) L.push(`- Timeline: ${e.timeline.math} [dates = your-input; time-to-start = ${e.timeline.lag_source}: "${e.timeline.lag_basis ?? 'no basis given'}"]`);
  else L.push(`- Timeline: **held**: ${e.timeline.detail}`);
  if (e.fit) L.push(`- Fit: ${e.fit.p} [${e.fit.label}${e.fit.note ? `: ${e.fit.note}` : ''}]`);
  const q = e.role_quality;
  L.push(q.status === 'ok'
    ? `- Role quality (report-only, weight 0 in the score): SOC ${q.soc} ${q.title}, national median ${money(q.national_median_wage)} (OEWS ${q.oews_year}), job zone ${q.job_zone} [record]`
    : `- Role quality: **missing: ${q.reason}** (${q.detail})`);
  if (e.sponsored_median_salary?.value != null && q.status === 'ok')
    L.push(`- Pay check (report-only): median salary across *all* this company's sponsored titles ${money(e.sponsored_median_salary.value)} vs national ${q.soc} median ${money(q.national_median_wage)} = ${(e.sponsored_median_salary.value / q.national_median_wage).toFixed(2)}× [both record; ratio computed]`);
  if (e.funding) L.push(`- Funding (report-only, not a vote): latest round on record ${e.funding.latest_funding_date ?? '—'} (${e.funding.latest_funding_stage ?? '—'}, ${money(e.funding.latest_funding_amount)}), ${e.funding.days_since_latest_funding ?? '—'} d before the run; in shipped Form D samples: ${e.funding.form_d_sample_match ? `yes (${e.funding.form_d_sample_match.date_filed})` : 'no'} [record]`);
  if (e.decision) L.push(`- Decision: ${e.decision.recommendation}, composite ${e.decision.composite} [scorer output; arithmetic in role-scores.md]`);
  md.push(L.join('\n') + '\n');
}

md.push(`## What this run cannot tell you\n`);
md.push(`- **Whether a company will sponsor *you*, now, for *this* job.** The records are past approvals with no fiscal year attached. A sponsor can freeze sponsorship next month.`);
md.push(`- **Whether a title on record was really coded as SOC 15-1252.** The sponsor file lists job titles, not SOC codes. "Software engineer" matching is a text rule.`);
md.push(`- **Whether any posting is live today.** Sample mode reads saved snapshots written for this exercise. No page was fetched.`);
md.push(`- **Whether the company is enrolled in E-Verify** (needed before you can file a STEM extension with them). No such data is in the repo.`);
md.push(`- **Whether a company raised money recently.** The newest funding date in the sponsor file is 2025-09-26, and the shipped Form D samples matched ${S.form_d_sample_matches} of these companies.`);
md.push(`- **Immigration law.** The clock above is planning arithmetic. Your DSO rules on what counts as unemployment.\n`);

md.push(`## Run record\n`);
md.push(`- Recipe: \`${RECIPE}\` v${VERSION} · mode: sample · run id \`${log.run_id}\``);
md.push(`- Prototype: \`${rel(path.join(HERE, 'run.mjs'))} --as-of ${asOfStr}\``);
md.push(`- Scorer: \`${log.scorer?.command ?? 'not run'}\`: ${log.scorer?.stdout?.split('\n')[0] ?? ''}`);
md.push(`- Gates: G0 ${log.gates.G0_persona_clock.result} · G4 ${log.gates.G4_scorer_conformance.result} · per-role G1–G3 in \`${rel(OUT.log)}\``);
md.push(`- Inputs (sha256): ${Object.entries(log.inputs).map(([k, v]) => `${k} \`${v.path}\` \`${v.sha256.slice(0, 12)}…\``).join(' · ')}`);
md.push(`- Human sign-off: \`${rel(OUT.gates)}\` (unsigned until you fill it in)`);
fs.writeFileSync(OUT.report, md.join('\n') + '\n');

// ── G5: the human decision sheet (blank until a person fills it) ────────────
const g = [];
g.push(`# Gate decisions — ${log.run_id}\n`);
g.push(`## Executive summary\n`);
g.push(`This sheet is where you, not the program, decide. The program wrote it with every decision blank. A job is cleared only when a named person writes their decision and the date next to it. Until then the report is a recommendation.\n`);
g.push(`## G0: my clock\n- [ ] I checked the dates in the report against my I-20 / EAD / DSO record.\n- Decided by: \n- Date: \n`);
g.push(`## Per job\n`);
g.push(`| Job | Program says | My decision (apply / network / drop / re-check) | Decided by | Date | Note |`);
g.push(`|---|---|---|---|---|---|`);
for (const e of log.roles) g.push(`| ${e.role_id} ${e.company}: ${e.title} | ${e.decision?.recommendation ?? 'Not scored'} → ${blockName[e.next.block]} |  |  |  |  |`);
fs.writeFileSync(OUT.gates, g.join('\n') + '\n');

console.log(`✓ swe-opt-clock ${asOfStr}: ${S.evaluated} evaluated → ${S.scored} scored (Apply ${S.apply} · Consider ${S.consider} · Skip ${S.skip}) · ${S.not_scored} held for a human`);
console.log(`  clock: ${clock.unemployment_days_used_projected}/${clock.unemployment_ceiling} unemployment days used → hard deadline ${clock.hard_deadline}, safe ${clock.safe_deadline}`);
console.log(`  ${log.scorer?.stdout?.split('\n')[0] ?? 'scorer not run'}`);
for (const k of ['rolesJson', 'scores', 'log', 'report', 'gates']) if (fs.existsSync(OUT[k])) console.log(`  ${rel(OUT[k])}`);
