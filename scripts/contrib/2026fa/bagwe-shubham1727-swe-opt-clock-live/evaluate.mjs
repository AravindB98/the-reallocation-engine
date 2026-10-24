#!/usr/bin/env node
// evaluate.mjs — the offline step of the swe-opt-clock-live mode.
// Recipe: recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md
//
// Reads a capture written by capture.mjs and decides nothing the records can't
// support. It re-applies every rule to the raw titles (a capture records what was
// seen, not what a rule concluded), then runs these gates per posting:
//   G1a board ownership (human), G1b entity match, G2 liveness, G3 timeline.
// Postings with a closed gate go to the EXISTING Ch.11 scorer as they are: the
// answer is Skip whatever the fit. Postings whose gates are open need a fit rating
// first; without one they are listed on a fit worksheet, so judgment is spent
// only where it can change the outcome. Then it checks the scorer's output (G4)
// and writes a JSON log (agent), a Markdown report (person) and a blank sign-off
// sheet (G5).
//
//   node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture <capture.json>
//        [--persona search/examples/neel-kapoor/profile.yml] [--as-of YYYY-MM-DD (default: capture date)]
//        [--fit fit-ratings.json] [--board-decisions <dir>/fixtures/board-decisions.yml]
//        [--time-to-start <dir>/fixtures/time-to-start.json] [--out-dir <namespace>/runs/<as-of>/<persona>]
//
// Exit codes: 0 ran · 2 bad invocation/input · 3 stopped (persona clock or out of scope;
//             capture stale, undated, or disagreeing with the engine's scan)
//             4 halted at G4 (scorer output failed conformance) · 5 scorer crashed
// No network access.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import {
  LABEL, ALLOWED_LABELS, RULES, personaClock, timelineFactor, loadSponsorIndex, resolveCompany, sponsorshipTier,
  loadSocIndex, roleQuality, loadFormDIndex, fundingSignal, checkScorerOutput, parseDate, iso, num, diffDays,
} from '../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs';
import { LIVE_RULES, GATE_ZERO, livenessFromCapture, startLag, newGradTitle, cohortStart, compareWithScan, sponsorshipOnlyApply, checkScorerArithmetic } from './live-lib.mjs';
import { HERE, REPO, NAMESPACE, RECIPE, VERSION, rel, redact, sha256, die, parseArgs, guardOutDir, readJson, latestBoardDecisions } from './cli.mjs';

const SOC = '15-1252'; // assigned by the title rule, not read from an LCA record
const isClosed = (factor) => factor != null && factor <= GATE_ZERO;

const args = parseArgs(process.argv.slice(2));
if (!args.capture) die(2, '--capture <capture.json> is required');
const P = {
  capture: path.resolve(REPO, args.capture),
  persona: path.resolve(REPO, args.persona ?? 'search/examples/neel-kapoor/profile.yml'),
  decisions: path.resolve(REPO, args['board-decisions'] ?? path.join(rel(HERE), 'fixtures/board-decisions.yml')),
  lag: path.resolve(REPO, args['time-to-start'] ?? path.join(rel(HERE), 'fixtures/time-to-start.json')),
  fit: args.fit ? path.resolve(REPO, args.fit) : null,
  sponsors: path.resolve(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  soc: path.resolve(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  formDDir: path.resolve(REPO, 'data/sec/form-d/processed/sample'),
  scorer: path.resolve(REPO, args.scorer ?? 'scripts/score/role-scorer.mjs'), // override exists only for BROKEN-* break tests
};
for (const k of ['capture', 'persona', 'decisions', 'lag', 'sponsors', 'soc', 'scorer']) if (!fs.existsSync(P[k])) die(2, `${k} file not found: ${rel(P[k])}`);
if (P.fit && !fs.existsSync(P.fit)) die(2, `fit file not found: ${rel(P.fit)}`);

const capture = readJson(P.capture, 'capture');
if (capture?.workflow !== 'swe-opt-clock-live' || capture?.step !== 'capture' || !Array.isArray(capture.postings))
  die(2, 'capture file is not a swe-opt-clock-live capture (workflow/step/postings missing)');
const asOfStr = args['as-of'] ?? capture.capture_date;
const asOf = parseDate(asOfStr);
if (!asOf || iso(asOf) !== asOfStr) die(2, `--as-of must be a real YYYY-MM-DD date, got "${asOfStr}"`);
const personaStem = path.basename(P.persona).replace(/\.ya?ml$/, '') === 'profile' ? path.basename(path.dirname(P.persona)) : path.basename(P.persona).replace(/\.ya?ml$/, '');
P.outDir = path.resolve(REPO, args['out-dir'] ?? path.join(rel(NAMESPACE), 'runs', asOfStr, `evaluate-${personaStem}${P.fit ? '-fit' : ''}`));
guardOutDir(P.outDir);

fs.mkdirSync(P.outDir, { recursive: true });
P.outDir = fs.realpathSync(P.outDir); // macOS /var → /private/var: keep every path the scorer sees canonical
const OUT = {
  rolesJson: path.join(P.outDir, 'roles.json'), log: path.join(P.outDir, 'run-log.json'), report: path.join(P.outDir, 'report.md'),
  gates: path.join(P.outDir, 'gate-decisions.md'), worksheet: path.join(P.outDir, 'fit-worksheet.md'), fitTemplate: path.join(P.outDir, 'fit-template.json'),
  scores: path.join(P.outDir, 'role-scores.json'), scoresMd: path.join(P.outDir, 'role-scores.md'),
};
// A stopped, halted or failed run must not leave a previous run's log or decisions
// lying around as if current: everything this step writes is removed first.
for (const f of Object.values(OUT)) fs.rmSync(f, { force: true });

const formDFiles = fs.readdirSync(P.formDDir).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(P.formDDir, f));
const inputs = [['capture', P.capture], ['persona', P.persona], ['board_decisions', P.decisions], ['time_to_start', P.lag], ...(P.fit ? [['fit', P.fit]] : []),
  ['sponsors_csv', P.sponsors], ['soc_csv', P.soc], ['scorer', P.scorer], ...formDFiles.map((f) => [`form_d:${path.basename(f)}`, f])];
const log = {
  workflow: 'swe-opt-clock-live', step: 'evaluate', recipe: RECIPE, recipe_version: VERSION, mode: 'live',
  run_id: `swe-opt-clock-live-${asOfStr}-${personaStem}${P.fit ? '-fit' : ''}`, as_of: asOfStr, generated_at: new Date().toISOString(), status: 'running',
  capture: { captured_at: capture.captured_at, capture_date: capture.capture_date, counts: capture.counts },
  inputs: Object.fromEntries(inputs.map(([k, p]) => [k, { path: rel(p), sha256: sha256(p) }])),
  rules: { ...RULES, ...LIVE_RULES, gate_zero: GATE_ZERO, soc_assigned: SOC }, gates: {}, roles: [], warnings: [], stop_conditions: [], outputs: {},
};
const writeLog = () => fs.writeFileSync(OUT.log, JSON.stringify(log, null, 2) + '\n');
const stop = (gate, code, detail) => {
  log.status = 'stopped'; log.stop_conditions.push({ gate, code, detail }); writeLog();
  console.error(`✗ STOP at ${gate}: ${code}: ${detail}`);
  console.error(`  nothing was scored; no report written. Log: ${rel(OUT.log)}`);
  process.exit(3);
};

// ── G0 persona clock + capture freshness (both stop the whole run) ─────────
let persona;
try { persona = yaml.load(fs.readFileSync(P.persona, 'utf8')); } catch (e) { die(2, `persona does not parse: ${e.message}`); }
const clock = personaClock(persona, asOf);
log.gates.G0_persona_clock = clock.ok ? { result: 'pass', clock } : { result: 'stop', ...clock.stop };
if (!clock.ok) stop('G0', clock.stop.code, clock.stop.detail);
// Every gate after this one exists because the student needs a sponsor.
if (!clock.needs_sponsorship)
  stop('G0', 'persona-out-of-scope', 'needs_sponsorship is false: this mode triages sponsorship-dependent students; use a general role triage instead');
const capDate = parseDate(capture.capture_date);
const capAge = capDate ? diffDays(asOf, capDate) : null;
if (capAge == null) stop('G0', 'capture-undated', 'capture has no capture_date');
if (capAge < 0) stop('G0', 'capture-after-run-date', `capture dated ${capture.capture_date} is after the run date ${asOfStr}`);
if (capAge > LIVE_RULES.capture_max_age_days)
  stop('G0', 'capture-stale', `capture is ${capAge} days old (> ${LIVE_RULES.capture_max_age_days}): every liveness verdict in it is out of date. Re-run capture.mjs; this run refuses to score on old checks.`);
log.gates.G0_capture_fresh = { result: 'pass', capture_age_days: capAge };
// The postings the capture's filters passed must be the ones the engine's own scan
// printed for the same boards. Recomputed here from both lists: the capture's own
// verdict is not trusted.
const xc = capture.scan_crosscheck;
if (!xc?.scan?.offer_keys || !xc?.capture?.offer_keys) stop('G0', 'scan-crosscheck-failed', 'capture has no scan cross-check: re-run capture.mjs');
const xcResult = compareWithScan(xc.capture.offer_keys, xc.scan.offer_keys, xc.capture.duplicates, xc.scan.duplicates);
if (xc.exit !== 0 || xc.scan.found !== xc.capture.found || !xcResult.match)
  stop('G0', 'scan-crosscheck-failed', `capture and \`npm run ats:scan -- --dry-run\` disagree (scan exit ${xc.exit}; found ${xc.scan.found} vs ${xc.capture.found}; only in scan ${xcResult.only_in_scan.length}, only in capture ${xcResult.only_in_capture.length}): re-run capture.mjs`);
log.gates.G0_scan_crosscheck = { result: 'pass', found: xc.scan.found, passed: xc.capture.offer_keys.length, extra_scan_duplicates: xcResult.extra_scan_duplicates };

// ── local evidence + human inputs ───────────────────────────────────────────
let decisionsDoc;
try { decisionsDoc = yaml.load(fs.readFileSync(P.decisions, 'utf8')); } catch (e) { die(2, `board-decisions file does not parse: ${e.message}`); }
const decisions = latestBoardDecisions(decisionsDoc);
const assumptions = readJson(P.lag, 'time-to-start file');
const fits = P.fit ? readJson(P.fit, 'fit file') : {};
const candidateIds = new Set(capture.postings.filter((p) => newGradTitle(p.title).pass).map((p) => p.posting_id));
for (const [id, f] of Object.entries(fits)) {
  if (id.startsWith('_')) continue;
  const p = num(f?.p);
  if (!candidateIds.has(id)) log.warnings.push(`fit rating for "${id}" matches no candidate posting in this capture: ignored`);
  else if (p == null || p < 0 || p > 1) log.warnings.push(`fit rating for "${id}" is ${JSON.stringify(f?.p)}, not a number in [0, 1]: ignored`);
}
for (const w of log.warnings) console.warn(`  ! ${w}`);
const sponsors = loadSponsorIndex(P.sponsors);
const socIdx = loadSocIndex(P.soc);
const formD = loadFormDIndex(formDFiles);
const roleQ = roleQuality(socIdx, SOC);

// G1a: board ownership is a human decision. Confirmed and rejected both count
// only with a name and a date on them; anything else holds the posting.
function ownership(p) {
  if (p.source === 'manual-link') return { result: 'pass', status: 'manual-link', detail: 'you supplied the company for this link', label: LABEL.input };
  const d = decisions.get(p.board);
  if (!d) return { result: 'hold', status: 'missing', code: 'board-ownership-unconfirmed', detail: `no decision recorded for board ${p.board}` };
  // YAML reads an unquoted 2026-10-21 as a Date; parseDate accepts either.
  const decided = parseDate(d.date);
  const signed = Boolean(d.by) && Boolean(decided) && ['confirmed', 'rejected'].includes(d.status);
  if (signed && d.status === 'rejected') return { result: 'dropped', status: 'rejected', by: d.by, date: iso(decided), code: 'board-not-this-company', detail: d.evidence ?? 'board belongs to a different company' };
  if (signed) return { result: 'pass', status: 'confirmed', by: d.by, date: iso(decided), evidence: d.evidence ?? null, label: 'human-gate' };
  return { result: 'hold', status: d.status ?? 'missing', code: 'board-ownership-unconfirmed', detail: 'no named person has tied this board to the sponsor record yet', evidence: d.evidence ?? null };
}
// Who supplied a judgment-shaped input is declared, not assumed: an AI-written fit is model-judgment (P8).
const srcOf = (v) => (ALLOWED_LABELS.has(v) && v !== LABEL.record ? v : LABEL.input);

// ── per-posting gates ───────────────────────────────────────────────────────
const candidates = capture.postings.filter((p) => candidateIds.has(p.posting_id));
const fed = [];
for (const p of candidates) {
  const cohort = cohortStart(p.title);
  const e = { role_id: p.posting_id, company: p.company, title: p.title, location: p.location, url: p.url, source: p.source,
    listed_in_feed: p.listed_in_feed ?? null, title_rule: newGradTitle(p.title), cohort_start: cohort, gates: {}, disposition: null };
  e.gates.G1a_board_ownership = ownership(p);
  if (e.gates.G1a_board_ownership.result === 'dropped') {
    e.disposition = 'dropped'; e.holds = [{ code: 'board-not-this-company', detail: e.gates.G1a_board_ownership.detail }];
    e.next = { block: 'drop', action: 'This posting is on a board that belongs to a different company with a similar name. The sponsor record does not apply to it.' };
    log.roles.push(e); continue;
  }
  const ownOk = e.gates.G1a_board_ownership.result === 'pass';
  const ent = ownOk ? resolveCompany(sponsors, p.company) : { ok: false, code: 'not-looked-up', detail: 'board ownership not cleared, so no sponsor record is looked up' };
  e.gates.G1b_entity = ent.ok ? { result: 'pass', matched: ent.row.company_name, label: LABEL.record } : { result: 'hold', code: ent.code, detail: ent.detail };
  e.liveness = livenessFromCapture(p.liveness, asOf);
  e.gates.G2_liveness = { result: e.liveness.hold ? 'hold' : isClosed(e.liveness.factor) ? 'closed' : 'open', code: e.liveness.code, detail: e.liveness.detail };
  const lag = startLag(p.company, cohort, assumptions, asOf);
  const tl = timelineFactor(clock, lag.lag_days);
  e.timeline = { ...tl, lag_days: lag.lag_days, lag_basis: lag.basis, lag_source: lag.source, lag_kind: lag.kind, label: lag.source ?? LABEL.input };
  e.gates.G3_timeline = tl.ok ? { result: isClosed(tl.factor) ? 'closed' : 'open', factor: tl.factor, math: tl.math } : { result: 'hold', code: tl.code, detail: tl.detail };
  e.role_quality = roleQ;
  const fitP = num(fits[p.posting_id]?.p);
  e.fit = fitP != null && fitP >= 0 && fitP <= 1 ? { p: fitP, note: fits[p.posting_id]?.note ?? null, label: srcOf(fits[p.posting_id]?.source) } : null;
  if (ent.ok) {
    e.sponsorship = { ...sponsorshipTier(ent.row), label: LABEL.record, rule_label: LABEL.input };
    e.funding = fundingSignal(ent.row, formD, asOf);
  }

  const livenessKnown = e.liveness.factor != null;
  // "Closed" means what the scorer means by it: at or below its gate_zero.
  const closed = isClosed(e.liveness.factor) || (tl.ok && isClosed(tl.factor));
  const holds = [];
  if (!ownOk) holds.push({ code: e.gates.G1a_board_ownership.code, detail: e.gates.G1a_board_ownership.detail });
  else if (!ent.ok) holds.push({ code: 'unresolved-company', detail: ent.detail });
  if (!livenessKnown) holds.push({ code: `liveness-${e.liveness.code}`, detail: e.liveness.detail });
  if (!tl.ok) holds.push({ code: tl.code, detail: tl.detail });
  if (!closed) {
    if (ent.ok && !e.sponsorship.scored) holds.push({ code: 'unknown-sponsorship', detail: e.sponsorship.reason });
    if (!e.fit) holds.push({ code: 'needs-fit-rating', detail: 'gates are open, so fit can change the outcome: rate it on the worksheet' });
  }
  // A closed gate decides the outcome, but only with every gate value known:
  // the scorer reads a missing liveness factor as 1, which would invent a live posting.
  const scorable = ownOk && ent.ok && livenessKnown && tl.ok && (closed || holds.length === 0);
  if (!scorable) { e.disposition = 'not-scored'; e.holds = holds; log.roles.push(e); continue; }

  e.disposition = 'scored';
  e.fit_needed = !closed;
  const role = { role_id: p.posting_id, company: p.company, title: p.title,
    liveness: { factor: e.liveness.factor, source: e.liveness.label, _check: `${e.liveness.classifier.result} (${e.liveness.classifier.code}) checked ${e.liveness.checked_at}` },
    timeline: { factor: tl.factor, source: e.timeline.label, _math: tl.math, _lag: e.timeline.lag_basis } };
  if (e.sponsorship.scored) role.sponsorship = { p: e.sponsorship.p, tier: e.sponsorship.tier, source: LABEL.record, _rule: e.sponsorship.reason };
  if (e.fit) role.fit = { p: e.fit.p, source: e.fit.label };
  fed.push(role); log.roles.push(e);
}
fs.writeFileSync(OUT.rolesJson, JSON.stringify(fed, null, 2) + '\n');
log.outputs.roles_json = rel(OUT.rolesJson);

// ── scorer (the existing one, unmodified) + G4 conformance ──────────────────
let scores = null;
if (fed.length) {
  // No --profile: the persona needs sponsorship (G0), and that is the scorer's own
  // default. Persona free text never reaches the scorer, whose regex misreads "work authorized".
  const sArgs = [P.scorer, OUT.rolesJson, '--out-dir', P.outDir];
  // cwd = the out-dir, so the scorer prints bare file names; redact() catches the rest (e.g. a crash stack).
  const r = spawnSync(process.execPath, sArgs, { cwd: P.outDir, encoding: 'utf8' });
  log.scorer = { command: `node ${rel(P.scorer)} ${rel(OUT.rolesJson)} --out-dir ${rel(P.outDir)}`, exit: r.status, stdout: redact(r.stdout.trim()), stderr: redact(r.stderr.trim()) };
  if (r.status !== 0) { log.status = 'halted'; log.stop_conditions.push({ gate: 'G4', code: 'scorer-exit', detail: log.scorer.stderr }); writeLog(); die(5, `scorer exited ${r.status}: ${log.scorer.stderr}`); }
  try { scores = JSON.parse(fs.readFileSync(OUT.scores, 'utf8')); } catch { scores = null; }
  const problems = [...checkScorerOutput(scores, fed, clock.needs_sponsorship), ...checkScorerArithmetic(scores, fed)];
  log.gates.G4_scorer_conformance = problems.length ? { result: 'halt', problems } : { result: 'pass' };
  if (problems.length) {
    log.status = 'halted'; log.stop_conditions.push({ gate: 'G4', code: 'scorer-output-nonconforming', problems });
    for (const f of [OUT.scores, OUT.scoresMd]) fs.rmSync(f, { force: true });
    writeLog();
    console.error('✗ HALT at G4: the scorer\'s output does not conform. No report written.');
    for (const pr of problems) console.error(`  • ${pr}`);
    process.exit(4);
  }
  log.outputs.role_scores_json = rel(OUT.scores); log.outputs.role_scores_md = rel(OUT.scoresMd);
} else {
  log.gates.G4_scorer_conformance = { result: 'skipped', detail: 'no posting cleared the gates far enough to score; scorer not run' };
}

// ── next action per posting (where it lands in the 3-3-2 day) ──────────────
const byId = new Map((scores?.roles ?? []).map((s) => [s.role_id, s]));
for (const e of log.roles) {
  if (e.disposition === 'dropped') continue;
  if (e.disposition === 'not-scored') {
    const codes = e.holds.map((h) => h.code);
    const timelineClosed = e.timeline.ok && isClosed(e.timeline.factor);
    if (timelineClosed || isClosed(e.liveness.factor))
      e.next = { block: 'drop', action: `A gate is already closed (${timelineClosed ? `start ${e.timeline.expected_start} is after your hard deadline ${clock.hard_deadline}` : 'the posting is closed'}), so the missing evidence (${codes.join(', ')}) cannot change the outcome. Drop.` };
    else if (codes.includes('board-ownership-unconfirmed'))
      e.next = { block: 'human-now', action: 'Confirm this board belongs to the company in the sponsor record (open the board; check the company name and locations), add your decision with your name and the date to board-decisions.yml, and re-run.' };
    else if (codes.some((c) => c.startsWith('liveness-')))
      e.next = { block: 'human-now', action: `Open the posting yourself (≤5 min).${e.listed_in_feed ? ' The board\'s own feed still listed it at capture time, but the page check could not confirm an apply button.' : ''} Record what you saw before spending application time.` };
    else if (codes.includes('unknown-sponsorship'))
      e.next = { block: 'network-3h', action: 'No sponsorship record either way. Ask an engineer or the recruiter directly before applying.' };
    else if (codes.includes('needs-fit-rating'))
      e.next = { block: 'human-now', action: 'Every gate is open. Read the posting and rate your fit (0–1) on the fit worksheet, then re-run with --fit.' };
    else e.next = { block: 'human-now', action: 'Fill the missing input named in the hold and re-run.' };
    continue;
  }
  const s = byId.get(e.role_id);
  e.decision = { recommendation: s.recommendation, composite: s.composite, reason: s.reason, label: 'scorer-output' };
  const strongSponsor = ['Proven', 'Likely'].includes(e.sponsorship?.tier);
  if (isClosed(e.liveness.factor))
    e.next = strongSponsor
      ? { block: 'network-3h', action: `Posting is closed, but ${e.company} has a ${e.sponsorship.tier} sponsorship record. Ask for an informational chat and watch the board for a reopen.` }
      : { block: 'drop', action: 'Closed posting, thin sponsorship record. Drop.' };
  else if (isClosed(e.timeline.factor))
    e.next = { block: 'drop', action: `Expected start ${e.timeline.expected_start} is after your hard deadline ${clock.hard_deadline}. Drop now; revisit only if the recruiter commits in writing to a start before ${clock.safe_deadline}.` };
  else if (sponsorshipOnlyApply(s, scores.config?.apply_threshold, e.fit?.p)) {
    e.flags = ['sponsorship-only-apply'];
    e.next = { block: 'network-3h', action: `The scorer says Apply, but ${e.company}'s sponsorship vote alone clears its threshold, and your fit is only ${e.fit?.p}. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block.` };
  } else if (s.recommendation === 'Apply')
    e.next = { block: 'apply-2h', action: 'Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent.' };
  else if (s.recommendation === 'Consider')
    e.next = { block: 'network-3h', action: `Network before applying: one conversation with an engineer at ${e.company} about ${e.timeline.factor < 1 ? 'how fast they can start a new grad' : 'whether they sponsor new-grad SWEs'}.` };
  else e.next = { block: 'drop', action: 'Evidence too thin for the 2-hour block. Drop.' };
}

const roles = log.roles;
const count = (f) => roles.filter(f).length;
const rec = (r) => count((e) => e.decision?.recommendation === r);
const worksheet = roles.filter((e) => e.disposition === 'not-scored' && e.holds.length === 1 && e.holds[0].code === 'needs-fit-rating');
log.summary = {
  candidates: roles.length, dropped_wrong_board: count((e) => e.disposition === 'dropped'), scored: fed.length,
  scored_gate_closed: count((e) => e.disposition === 'scored' && !e.fit_needed), not_scored: count((e) => e.disposition === 'not-scored'),
  needs_fit_rating: worksheet.length, apply: rec('Apply'), consider: rec('Consider'), skip: rec('Skip'),
  skip_rate_of_scored: fed.length ? Number((rec('Skip') / fed.length).toFixed(3)) : null,
  timeline_closed: count((e) => e.timeline?.ok && isClosed(e.timeline.factor)), liveness_held: count((e) => e.liveness?.hold),
  sponsorship_only_apply: count((e) => e.flags?.includes('sponsorship-only-apply')),
  apply_block: count((e) => e.next?.block === 'apply-2h'),
};
log.status = 'completed';
log.outputs.report_md = rel(OUT.report); log.outputs.gate_decisions_md = rel(OUT.gates); log.outputs.run_log_json = rel(OUT.log);
if (worksheet.length) { log.outputs.fit_worksheet_md = rel(OUT.worksheet); log.outputs.fit_template_json = rel(OUT.fitTemplate); }
writeLog();

// ── human report ────────────────────────────────────────────────────────────
const S = log.summary;
const money = (x) => (x == null ? '—' : `$${Math.round(x).toLocaleString('en-US')}`);
const blockName = { 'apply-2h': 'Apply (2-hour block)', 'network-3h': 'Network (3-hour block)', 'human-now': 'You, now (≤5 min)', drop: 'Drop' };
const nModel = count((e) => e.fit?.label === LABEL.model);
const md = [];
md.push(`# Which software jobs are worth your next two hours — ${asOfStr} (live boards)`);
md.push(`\n## Executive summary\n`);
md.push(`**What this is.** A check of ${S.candidates} real, currently posted software engineering jobs that a new graduate could take, taken today from the public job boards of Massachusetts companies with an H-1B record. Each job was checked against public sponsorship records, whether the posting page is open, and your visa clock.\n`);
md.push(`**Why read it.** Your 90-day unemployment allowance runs out on **${clock.unemployment_exhaustion_date ?? 'n/a (employed)'}**, ${clock.unemployment_days_remaining} days from now. That is much sooner than your OPT end date (${clock.opt_end_date}). A job only helps if you can start it before then. This report says where your time goes and shows where every number came from.\n`);
const closedNote = S.timeline_closed ? `For **${S.timeline_closed}** of them, a typical new-grad hiring process (about ${assumptions.default?.days} days, an assumption) would end after your deadline. Those are a Skip however good the fit. ` : '';
md.push(`**What it found.** ${closedNote}${S.scored} jobs were scored: **${S.apply} Apply, ${S.consider} Consider, ${S.skip} Skip**. ${S.needs_fit_rating ? `${S.needs_fit_rating} passed every check and only need your fit rating. ` : ''}${S.not_scored - S.needs_fit_rating > 0 ? `${S.not_scored - S.needs_fit_rating} need you to look first (usually a posting page the checker could not read). ` : ''}${S.dropped_wrong_board ? `${S.dropped_wrong_board === 1 ? "1 came from a board that belongs to a different company with a similar name, and was dropped" : `${S.dropped_wrong_board} came from boards that belong to different companies with similar names, and were dropped`}. ` : ''}${nModel ? `${nModel} fit ratings were written by an AI assistant and are labeled as its judgment. ` : ''}Sponsorship records show what a company did in the past, not what it will do for you now.\n`);
if (S.skip_rate_of_scored != null && S.skip_rate_of_scored < 0.5)
  md.push(`> **Skip rate ${Math.round(S.skip_rate_of_scored * 100)}% of scored jobs, below the ~50% a healthy run skips.** The board list was built from companies already known to sponsor, so it leans toward sponsors. Treat that as a property of the input, not good news.\n`);
if (S.sponsorship_only_apply)
  md.push(`> **${S.sponsorship_only_apply} of the ${S.apply} Apply results come from sponsorship alone.** For a company with a strong sponsorship record, that one vote already clears the scorer's Apply threshold, whatever your fit. Those jobs are sent to networking, not the 2-hour application block: **${S.apply_block}** job(s) get that block today.\n`);

md.push(`## Your clock (check these against your I-20 / EAD / DSO record first)\n`);
md.push(`| | |\n|---|---|`);
md.push(`| Run date | ${clock.as_of} |`);
md.push(`| OPT (EAD) end | ${clock.opt_end_date} [your-input] |`);
md.push(`| Unemployment days used | ${clock.unemployment_days_used_snapshot} as of ${clock.unemployment_days_as_of} → **${clock.unemployment_days_used_projected} projected to the run date** of ${clock.unemployment_ceiling} [your-input, projected] |`);
md.push(`| Hard deadline (must start by) | **${clock.hard_deadline}** (binding: ${clock.hard_deadline_binding}) |`);
md.push(`| Your buffer | ${clock.buffer_target} days → aim to start by **${clock.safe_deadline}** |`);
md.push(`| What that means for a job | it scores fully only if it can start within **${Math.max(diffDays(parseDate(clock.safe_deadline), asOf), 0)} days**, and not at all after **${diffDays(parseDate(clock.hard_deadline), asOf)} days** |`);
md.push(`\nAnything legal (STEM extension, what counts as employment) goes to your DSO. This report doesn't decide it.\n`);

md.push(`## Decisions\n`);
md.push(`| Job | Decision | Why | What to do next |`);
md.push(`|---|---|---|---|`);
const order = { 'apply-2h': 0, 'network-3h': 1, 'human-now': 2, drop: 3 };
for (const e of [...roles].sort((a, b) => order[a.next.block] - order[b.next.block] || (b.decision?.composite ?? -1) - (a.decision?.composite ?? -1))) {
  const d = e.decision ? `**${e.decision.recommendation}** (${e.decision.composite})` : e.disposition === 'dropped' ? '**Dropped**' : '**Not scored**';
  const why = e.decision ? `${e.decision.reason}${e.flags?.includes('sponsorship-only-apply') ? '; **sponsorship alone clears the threshold**' : ''}` : e.holds.map((h) => h.code).join(', ');
  md.push(`| ${e.company}: ${e.title} | ${d} | ${why} | ${blockName[e.next.block]}: ${e.next.action} |`);
}
if (worksheet.length) md.push(`\n**${worksheet.length} job(s) need your fit rating.** They're listed on the fit worksheet next to this report. Rate them and re-run with \`--fit\`; nothing else is needed.\n`);

md.push(`\n## Where each number came from (verified vs. inferred)\n`);
md.push(`Labels: **[record]** = read from a data file or a live board/page today · **[human-gate]** = a decision a named person recorded · **[your-input]** = a value you supplied or a rule this mode chose · **[model-judgment]** = a judgment written by an AI.\n`);
for (const e of roles.filter((x) => x.disposition !== 'dropped')) {
  md.push(`### ${e.company}: ${e.title}\n`);
  const L = [];
  L.push(`- Posting: ${e.url} (${e.location || 'no location'}); ${e.listed_in_feed ? 'listed in the board\'s own feed at capture [record]' : 'link you supplied [your-input]'}`);
  L.push(`- Title rule: ${e.title_rule.code}${e.title_rule.level ? ` (level ${e.title_rule.level})` : ''} → treated as SOC ${SOC} [your-input: a text rule, not an LCA SOC code]`);
  const g = e.gates.G1a_board_ownership;
  L.push(`- Board belongs to this company: ${g.result === 'pass' ? (g.status === 'confirmed' ? `confirmed by ${g.by} on ${g.date} [human-gate]` : `${g.detail} [your-input]`) : `**not confirmed** (${g.detail})`}`);
  if (e.gates.G1b_entity.result === 'pass') L.push(`- Sponsor record: CSV row "${e.gates.G1b_entity.matched}" by exact name [record]`);
  else L.push(`- Sponsor record: **not looked up**: ${e.gates.G1b_entity.detail}`);
  if (e.sponsorship) {
    const ev = e.sponsorship.evidence;
    if (e.sponsorship.scored) {
      L.push(`- H-1B history: ${ev.approvals} approvals, ${ev.denials} denials, ${ev.approval_rate?.toFixed(1)}% approved [record; fiscal years not in the file]`);
      L.push(`- Sponsored SWE titles on record: ${ev.swe_titles.length ? ev.swe_titles.map((t) => `"${t}"`).join(', ') : 'none'}; non-senior: ${ev.non_senior_swe_titles.length ? ev.non_senior_swe_titles.map((t) => `"${t}"`).join(', ') : 'none'} [record; title rule = your-input]`);
    } else L.push(`- H-1B history: **empty in the file** [record]. No trace, which is not "does not sponsor".`);
    L.push(`- Sponsorship tier: **${e.sponsorship.tier}**${e.sponsorship.p != null ? ` → p = ${e.sponsorship.p}` : ''}: ${e.sponsorship.reason} [inputs = record; thresholds and tier→p = your-input]`);
  }
  const lv = e.liveness;
  L.push(lv.classifier
    ? `- Posting page: ${lv.classifier.result} (${lv.classifier.code}) when a browser opened it on ${lv.checked_date}${lv.id_retained === false ? `, but it ended up off the posting at ${lv.final_url}` : ''} → ${lv.factor == null ? `**held**: ${lv.detail}` : `liveness ${lv.factor}`} [record: engine checker, live page]`
    : `- Posting page: **held**: ${lv.detail}`);
  L.push(e.timeline.ok
    ? `- Timeline: ${e.timeline.math} [dates = your-input; start: ${e.timeline.lag_basis} (${e.timeline.lag_source})]`
    : `- Timeline: **held**: ${e.timeline.detail}`);
  L.push(e.fit ? `- Fit: ${e.fit.p} [${e.fit.label}${e.fit.note ? `: ${e.fit.note}` : ''}]` : `- Fit: ${e.fit_needed === false ? 'not needed (a gate is closed)' : 'not rated'}`);
  const q = e.role_quality;
  L.push(q.status === 'ok'
    ? `- Role quality (report-only, weight 0 in the score): SOC ${q.soc} ${q.title}, national median ${money(q.national_median_wage)} (OEWS ${q.oews_year}), job zone ${q.job_zone} [record]`
    : `- Role quality: **missing: ${q.reason}**`);
  if (e.funding) L.push(`- Funding (report-only): latest round on record ${e.funding.latest_funding_date ?? '—'} (${e.funding.latest_funding_stage || '—'}, ${money(e.funding.latest_funding_amount)}); in shipped Form D samples: ${e.funding.form_d_sample_match ? `yes (${e.funding.form_d_sample_match.date_filed})` : 'no'} [record]`);
  if (e.decision) L.push(`- Decision: ${e.decision.recommendation}, composite ${e.decision.composite} [scorer output; arithmetic in role-scores.md]`);
  md.push(L.join('\n') + '\n');
}
const dropped = roles.filter((e) => e.disposition === 'dropped');
if (dropped.length) {
  md.push(`## Dropped: board belongs to a different company\n`);
  for (const e of dropped) md.push(`- ${e.company} (as named in the portals file): "${e.title}". ${e.holds[0].detail}`);
  md.push('');
}

md.push(`## What this run cannot tell you\n`);
md.push(`- **Whether a company will sponsor *you*, now, for *this* job.** The records are past approvals with no fiscal year attached.`);
md.push(`- **Whether this posting would be filed under SOC ${SOC}.** The sponsor file lists job titles, not SOC codes. The match is a text rule.`);
md.push(`- **How long this company actually takes to hire.** No dataset records it. Every start date that isn't printed in the title is an assumption.`);
md.push(`- **Whether a posting the checker couldn't read is open.** Some company career pages put the application form in an embedded frame the checker doesn't look inside. Those are held for you, not guessed.`);
md.push(`- **Whether the company uses E-Verify** (needed before a STEM extension). No such data is in the repo.`);
md.push(`- **Jobs on boards this mode doesn't read** (Workday, iCIMS, company-built sites), or companies whose board slug couldn't be found.`);
md.push(`- **Immigration law.** The clock is planning arithmetic. Your DSO rules on what counts as unemployment.\n`);

md.push(`## Run record\n`);
md.push(`- Recipe: \`${RECIPE}\` v${VERSION} · mode: live · run id \`${log.run_id}\``);
md.push(`- Capture: \`${rel(P.capture)}\` taken ${capture.captured_at} (${capAge} d before the run)`);
md.push(`- Scorer: \`${log.scorer?.command ?? 'not run'}\`: ${log.scorer?.stdout?.split('\n')[0] ?? ''}`);
md.push(`- Gates: G0 ${log.gates.G0_persona_clock.result} · capture fresh ${log.gates.G0_capture_fresh.result} · G4 ${log.gates.G4_scorer_conformance.result} · per-posting G1a–G3 in \`${rel(OUT.log)}\``);
md.push(`- Inputs (sha256): ${Object.entries(log.inputs).map(([k, v]) => `${k} \`${v.path}\` \`${v.sha256.slice(0, 12)}…\``).join(' · ')}`);
md.push(`- Human sign-off: \`${rel(OUT.gates)}\` (unsigned until you fill it in)`);
fs.writeFileSync(OUT.report, md.join('\n') + '\n');

// ── fit worksheet (only when open-gate jobs lack a rating) ──────────────────
if (worksheet.length) {
  const w = [];
  w.push(`# Fit worksheet — ${log.run_id}\n`);
  w.push(`## Executive summary\n`);
  w.push(`These ${worksheet.length} jobs passed every check that records can answer: the board is the right company, the posting is open, the company has sponsored before, and the start would fit your clock. The one thing left is a judgment only you (or an AI you ask, labeled as such) can make: how well you fit the job. Rate each from 0 to 1 and re-run. Nothing on this sheet is a recommendation yet.\n`);
  w.push(`| Posting id | Job | Sponsorship | Timeline | Link |\n|---|---|---|---|---|`);
  for (const e of worksheet) w.push(`| \`${e.role_id}\` | ${e.company}: ${e.title} | ${e.sponsorship?.tier ?? '—'} | ${e.timeline.factor} (${e.timeline.band}) | ${e.url} |`);
  w.push(`\nFill \`fit-template.json\` (same folder): set \`p\` to your rating, keep \`source\` as \`your-input\` if you rated it, or \`model-judgment\` if an AI did, and add a one-line note on why.`);
  fs.writeFileSync(OUT.worksheet, w.join('\n') + '\n');
  fs.writeFileSync(OUT.fitTemplate, JSON.stringify(Object.fromEntries(worksheet.map((e) => [e.role_id, { p: null, source: LABEL.input, note: '', _job: `${e.company}: ${e.title}` }])), null, 2) + '\n');
}

// ── G5: the human decision sheet (blank until a person fills it) ────────────
const g = [];
g.push(`# Gate decisions — ${log.run_id}\n`);
g.push(`## Executive summary\n`);
g.push(`This sheet is where a person, not the program, decides. The program wrote it with every decision blank. A job is cleared only when a named person writes their decision and the date next to it. Until then the report is a recommendation.\n`);
g.push(`## G0: my clock\n- [ ] I checked the dates in the report against my I-20 / EAD / DSO record.\n- Decided by: \n- Date: \n`);
g.push(`## Per job\n`);
g.push(`| Job | Program says | My decision (apply / network / drop / re-check) | Decided by | Date | Note |`);
g.push(`|---|---|---|---|---|---|`);
for (const e of roles.filter((x) => x.disposition !== 'dropped')) g.push(`| ${e.role_id} ${e.company}: ${e.title} | ${e.decision?.recommendation ?? 'Not scored'} → ${blockName[e.next.block]} |  |  |  |  |`);
fs.writeFileSync(OUT.gates, g.join('\n') + '\n');

console.log(`✓ swe-opt-clock-live ${asOfStr} (${personaStem}): ${S.candidates} candidates → ${S.scored} scored (Apply ${S.apply} · Consider ${S.consider} · Skip ${S.skip}) · ${S.not_scored} not scored (${S.needs_fit_rating} need only a fit rating) · ${S.dropped_wrong_board} dropped (wrong board)`);
console.log(`  clock: ${clock.unemployment_days_used_projected}/${clock.unemployment_ceiling} unemployment days used → hard deadline ${clock.hard_deadline}, safe ${clock.safe_deadline} · timeline closed for ${S.timeline_closed}`);
console.log(`  ${log.scorer?.stdout?.split('\n')[0] ?? 'scorer not run'}`);
for (const k of ['rolesJson', 'scores', 'log', 'report', 'worksheet', 'gates']) if (fs.existsSync(OUT[k])) console.log(`  ${rel(OUT[k])}`);
