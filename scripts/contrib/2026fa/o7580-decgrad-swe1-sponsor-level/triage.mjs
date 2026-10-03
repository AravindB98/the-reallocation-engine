#!/usr/bin/env node
// triage.mjs — level-matched sponsorship + December-grad OPT-clock triage.
//
// Reads shipped repo data (80 Days CSV, Form D samples, BLS compact), a scenario
// file (fictional persona + candidate roles, your-input) and a SAVED
// `npm run ats:liveness` log. Writes a scorer-shaped roles.json, runs the
// EXISTING scorer (scripts/score/role-scorer.mjs — not a copy), then writes:
//   triage-log.json   — agent log (every value labeled)
//   triage-report.md  — human report (executive summary first)
// It never touches the network and never writes outside its out-dir.
//
//   node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs \
//     [--scenario f.json] [--liveness-log f.log] [--out-dir dir] [--as-of YYYY-MM-DD] [--days-used N] [--csv f.csv] [--form-d-dir d]
//
// Exit: 0 run complete (some roles may be "missing" — that is a result, not a failure)
//       2 input/conformance failure (missing file, bad JSON, bad persona) — nothing written

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LABEL, parseCsv, resolveCompany, sponsorshipTier, parseLivenessLog, livenessFor,
  timelineFactor, formDSampleHits, nextAction, noSponsorOverride, MISSING_ACTION,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(REPO, p) || '.';

const DEFAULTS = {
  scenario: path.join(HERE, 'scenarios/boston-decgrad.sample.json'),
  liveness: path.join(HERE, 'scenarios/boston-decgrad.liveness.log'),
  outDir: path.join(REPO, 'course/2026fa/submissions/o7580/runs/sample'),
  csv: path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  formDDir: path.join(REPO, 'data/sec/form-d/processed/sample'),
  bls: path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  scorer: path.join(REPO, 'scripts/score/role-scorer.mjs'),
};

// Output may only go into this contributor's namespaces, or a temp dir (tests).
const ALLOWED_OUT = [
  path.join(REPO, 'course/2026fa/submissions/o7580'),
  path.join(REPO, 'scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level'),
  fs.realpathSync(os.tmpdir()),
];

function die(msg) { console.error(`✗ ${msg}`); process.exit(2); }
function arg(args, name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
function readJson(p, what) {
  if (!fs.existsSync(p)) die(`${what} not found: ${p}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(`${what} is not valid JSON (${p}): ${e.message}`); }
}

// G0 — inputs gate: the persona must carry every field the timeline gate reads.
function checkPersona(p) {
  const need = ['program_end_date', 'opt_start_date', 'unemployment_ceiling_days', 'prior_experience_months'];
  const absent = need.filter((k) => p?.[k] == null);
  if (absent.length) die(`G0 inputs gate: persona is missing ${absent.join(', ')} — refusing to default them`);
  for (const k of ['program_end_date', 'opt_start_date']) if (!/^\d{4}-\d{2}-\d{2}$/.test(p[k])) die(`G0 inputs gate: persona.${k} must be YYYY-MM-DD, got "${p[k]}"`);
}

function main() {
  const args = process.argv.slice(2);
  const scenarioPath = path.resolve(arg(args, '--scenario') || DEFAULTS.scenario);
  const livenessPath = path.resolve(arg(args, '--liveness-log') || DEFAULTS.liveness);
  const outDir = path.resolve(arg(args, '--out-dir') || DEFAULTS.outDir);
  const csvPath = path.resolve(arg(args, '--csv') || DEFAULTS.csv);
  const formDDir = path.resolve(arg(args, '--form-d-dir') || DEFAULTS.formDDir);

  // resolve symlinks via the nearest existing ancestor (e.g. macOS /var → /private/var)
  let probe = outDir, tail = '';
  while (!fs.existsSync(probe)) { tail = path.join(path.basename(probe), tail); probe = path.dirname(probe); }
  const outReal = path.join(fs.realpathSync(probe), tail);
  if (!ALLOWED_OUT.some((a) => outReal === a || outReal.startsWith(a + path.sep))) {
    die(`refusing --out-dir ${outDir}: outputs may only go under course/2026fa/submissions/o7580/, this prototype's folder, or a temp dir (never over a tracked repo file)`);
  }

  // ── G0 inputs ──
  const scenario = readJson(scenarioPath, 'scenario');
  const daysUsed = arg(args, '--days-used'); // your-input override for a later re-run
  if (daysUsed !== undefined) {
    if (!/^\d+$/.test(daysUsed)) die(`--days-used must be a whole number of days, got "${daysUsed}"`);
    scenario.persona = { ...scenario.persona, unemployment_days_used: Number(daysUsed), unemployment_days_used_source: '--days-used (your-input)' };
  }
  checkPersona(scenario.persona);
  const params = scenario.params;
  if (!params?.tier_p || params.min_approvals_for_proven == null || params.comfort_days == null || params.default_hiring_lag_days == null) {
    die('G0 inputs gate: scenario.params needs tier_p, min_approvals_for_proven, comfort_days, default_hiring_lag_days');
  }
  if (!Array.isArray(scenario.roles) || scenario.roles.length === 0) die('G0 inputs gate: scenario.roles is empty');
  const asOf = arg(args, '--as-of') || scenario.as_of;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) die('G0 inputs gate: no valid as_of date (scenario.as_of or --as-of YYYY-MM-DD)');
  if (!fs.existsSync(csvPath)) die(`G0 inputs gate: 80 Days CSV not found at ${csvPath}`);
  if (!fs.existsSync(livenessPath)) die(`G0 inputs gate: liveness log not found at ${livenessPath} — run npm run ats:liveness and save its output`);

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (!rows.length || !('Total Approvals' in rows[0]) || !('top_job_titles_sponsored' in rows[0])) die(`G0 inputs gate: ${csvPath} does not have the 80 Days columns`);
  const liveness = parseLivenessLog(fs.readFileSync(livenessPath, 'utf8'));
  const formDFiles = fs.existsSync(formDDir) ? fs.readdirSync(formDDir).filter((f) => f.endsWith('.sample.json')).sort() : [];
  const formDDocs = formDFiles.map((f) => JSON.parse(fs.readFileSync(path.join(formDDir, f), 'utf8')));
  const blsRow = fs.existsSync(DEFAULTS.bls)
    ? parseCsv(fs.readFileSync(DEFAULTS.bls, 'utf8')).find((r) => r.bls_soc_code === (scenario.persona.target_soc || '15-1252'))
    : null;

  // ── per-role evidence ──
  const evaluated = [];
  for (const role of scenario.roles) {
    const ev = { role_id: role.role_id, company_input: role.company, title: role.title, posting_url: role.posting_url ?? null, missing: [] };

    const res = resolveCompany(rows, role.company, role.state);
    if (res.missing) { ev.missing.push(res); evaluated.push(ev); continue; } // nothing downstream is meaningful without the entity
    const r = res.row;
    ev.company = { value: r.company_name, city: r.city, state: r.state, label: LABEL.record, source: rel(csvPath) };

    const sp = sponsorshipTier(r, params);
    if (sp.missing) ev.missing.push(sp);
    else ev.sponsorship = {
      tier: { value: sp.tier, label: LABEL.record, basis: sp.basis },
      p: { value: sp.p, label: LABEL.input, basis: `scenario.params.tier_p["${sp.tier}"]` },
      approvals: { value: sp.approvals, label: LABEL.record }, denials: { value: sp.denials, label: LABEL.record },
      approval_rate: { value: sp.approval_rate, label: LABEL.record },
      titles_listed: sp.titles_listed, at_level_titles: sp.at_level_titles, above_level_titles: sp.above_level_titles,
    };

    const lv = livenessFor(liveness, role.posting_url);
    if (lv.missing) ev.missing.push(lv);
    else ev.liveness = { factor: { value: lv.factor, label: LABEL.record }, result: lv.result, reason: lv.reason, source: rel(livenessPath), checked: liveness.meta.ran || null };

    if (typeof role.fit?.p !== 'number') ev.missing.push({ missing: 'no-fit-input', detail: 'role.fit.p not provided' });
    else ev.fit = { value: role.fit.p, label: LABEL.input, basis: role.fit.basis || null };

    const tl = timelineFactor(scenario.persona, role, params, asOf);
    ev.timeline = { ...tl, factor: { value: tl.factor, label: LABEL.input } }; // spread FIRST: tl.factor is a bare number

    const ov = noSponsorOverride(role, scenario.persona);
    if (ov) ev.override = { ...ov, label: LABEL.input };

    ev.context = {
      funding_80days: { latest_funding_date: r.latest_funding_date || null, latest_funding_stage: r.latest_funding_stage || null, label: LABEL.record, note: 'from the 80 Days CSV snapshot, not re-checked against SEC' },
      form_d_sample_hits: { value: formDSampleHits(formDDocs, res.key), label: LABEL.record, note: `searched ${formDFiles.length} shipped *.sample.json files only; no hit is NOT evidence of no filing` },
      lca_median_salary_all_titles: { value: r.median_salary_offered === '' ? null : Number(r.median_salary_offered), label: LABEL.record, note: 'median across ALL sponsored titles at this company, not SWE-only' },
      bls_national_median_15_1252: blsRow ? { value: Number(blsRow.annual_median_wage), oews_year: blsRow.oews_year, label: LABEL.record, source: rel(DEFAULTS.bls) } : { missing: 'no-occupation-row' },
      role_quality_in_scorer: 'not passed — scorer weight role_quality is 0.0 [VERIFY]; shown here as context only',
    };
    evaluated.push(ev);
  }

  // ── build the scorer input from fully-evidenced roles only ──
  const scoreable = evaluated.filter((e) => e.missing.length === 0);
  const rolesForScorer = scoreable.map((e) => ({
    role_id: e.role_id, company: e.company.value, title: e.title,
    sponsorship: { p: e.sponsorship.p.value, tier: e.sponsorship.tier.value, source: LABEL.record },
    fit: { p: e.fit.value, source: LABEL.input },
    liveness: { factor: e.liveness.factor.value, source: LABEL.record },
    timeline: { factor: e.timeline.factor.value, source: LABEL.input },
    ...(e.override ? { override: { decision: e.override.decision, reason: e.override.reason } } : {}),
  }));

  // The scorer defaults a missing gate to 1 (open) — so never hand it a non-number.
  for (const r of rolesForScorer) {
    for (const [k, v] of [['sponsorship.p', r.sponsorship.p], ['fit.p', r.fit.p], ['liveness.factor', r.liveness.factor], ['timeline.factor', r.timeline.factor]]) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) die(`internal conformance: ${r.role_id} ${k} = ${v} — refusing to pass a non-number to the scorer (it would default a gate to open)`);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const rolesPath = path.join(outDir, 'roles.json');
  const profilePath = path.join(outDir, 'scorer-profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify(rolesForScorer, null, 2) + '\n');
  fs.writeFileSync(profilePath, JSON.stringify({ authorization: scenario.persona.authorization }, null, 2) + '\n');

  let scored = { roles: [] };
  let scorerStdout = '';
  if (rolesForScorer.length) {
    const run = spawnSync(process.execPath, [DEFAULTS.scorer, rolesPath, '--profile', profilePath, '--out-dir', outDir], { cwd: REPO, encoding: 'utf8' });
    scorerStdout = (run.stdout || '') + (run.stderr || '');
    if (run.status !== 0) die(`scorer exited ${run.status}: ${scorerStdout.trim()}`);
    scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
  }
  const byId = new Map(scored.roles.map((s) => [s.role_id, s]));

  for (const e of evaluated) {
    const s = byId.get(e.role_id);
    if (s) {
      e.decision = { recommendation: s.recommendation, machine_recommendation: s.machine_recommendation, composite: s.composite, reason: s.override?.reason ? `override: ${s.override.reason} (machine said ${s.machine_recommendation}: ${s.reason})` : s.reason, arithmetic: s.trace.arithmetic, label: 'scorer-output (scripts/score/role-scorer.mjs)' };
      e.next_action = nextAction(s.recommendation, s.reason, e.sponsorship.tier.value, s.override?.reason ? s.override : null);
    } else {
      e.decision = { recommendation: 'Not scored', reason: e.missing.map((m) => m.missing).join(', ') };
      e.next_action = e.missing.map((m) => MISSING_ACTION[m.missing]).join(' / ');
    }
  }

  const count = (rec) => evaluated.filter((e) => e.decision.recommendation === rec).length;
  const summary = {
    evaluated: evaluated.length, scored: scoreable.length, not_scored: evaluated.length - scoreable.length,
    apply: count('Apply'), consider: count('Consider'), skip: count('Skip'),
    skip_rate_of_scored: scoreable.length ? Number((count('Skip') / scoreable.length).toFixed(3)) : null,
  };

  const log = {
    recipe: 'recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.md', recipe_version: '0.1.0',
    mode: 'sample', as_of: asOf, generated_at: new Date().toISOString(),
    inputs: {
      scenario: rel(scenarioPath), liveness_log: rel(livenessPath), liveness_log_meta: liveness.meta,
      csv: rel(csvPath), csv_rows: rows.length, form_d_sample_files: formDFiles, bls: rel(DEFAULTS.bls),
    },
    persona: { ...scenario.persona, label: LABEL.input },
    params: { ...params, label: LABEL.input },
    model_judgments_used: 0,
    summary,
    scorer: { path: rel(DEFAULTS.scorer), input: rel(rolesPath), outputs: [rel(path.join(outDir, 'role-scores.json')), rel(path.join(outDir, 'role-scores.md'))], stdout: scorerStdout.trim(), config: scored.config ?? null },
    gate_decisions_pending: ['G5 decision handoff: a named human reads triage-report.md and decides; no application is sent by this run'],
    roles: evaluated,
  };
  const logPath = path.join(outDir, 'triage-log.json');
  const reportPath = path.join(outDir, 'triage-report.md');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(reportPath, renderReport(log));

  console.log(`✓ triage: ${summary.evaluated} roles → scored ${summary.scored} (Apply ${summary.apply} · Consider ${summary.consider} · Skip ${summary.skip}) · not scored ${summary.not_scored}`);
  for (const e of evaluated) console.log(`  ${e.decision.recommendation.padEnd(11)} ${e.role_id}${e.missing.length ? '  [' + e.missing.map((m) => m.missing).join(', ') + ']' : `  composite ${e.decision.composite}`}`);
  console.log(`  ${rel(logPath)}  +  ${rel(reportPath)}  (scorer: ${rel(rolesPath)} → role-scores.json/.md)`);
}

function renderReport(log) {
  const s = log.summary;
  const p = log.persona;
  const o = [];
  o.push(`# Triage report — entry-level software roles for a December-2026 graduate (${log.as_of})`);
  o.push('\n## Executive summary\n');
  o.push(`This report checks ${s.evaluated} software-engineering postings for a fictional international student who finishes a master's degree in ${p.program_end_date.slice(0, 7)} and will work on OPT. For each posting it asks two questions. Has this company sponsored work visas for software jobs at a junior level, not only senior ones? And can hiring finish before the student's allowed unemployment time on OPT runs out? It also uses a saved check of whether each posting is still open.`);
  o.push(`\nResult: **${s.apply} to apply for, ${s.consider} to look into first, ${s.skip} to skip, and ${s.not_scored} that could not be scored** because a record was missing. Those need a person to check by hand. No numbers were guessed, and no AI judgment was used. The person reading this decides what to do; nothing has been sent anywhere.`);
  o.push('\n## Decisions and next actions\n');
  o.push('| Role | Decision | Why | Next action |');
  o.push('|---|---|---|---|');
  for (const e of log.roles) o.push(`| ${e.company?.value || e.company_input} — ${e.title} | **${e.decision.recommendation}**${e.decision.composite != null ? ` (${e.decision.composite})` : ''} | ${e.decision.reason} | ${e.next_action} |`);
  o.push('\n## Evidence per role (every value labeled)\n');
  for (const e of log.roles) {
    o.push(`### ${e.role_id} — ${e.company?.value || e.company_input}`);
    if (e.company) o.push(`- Company match: ${e.company.value}, ${e.company.city}, ${e.company.state} [record]`);
    if (e.sponsorship) {
      o.push(`- Sponsorship tier: **${e.sponsorship.tier.value}** [record — ${e.sponsorship.tier.basis}] → p ${e.sponsorship.p.value} [your-input: tier map]`);
      o.push(`  - approvals ${e.sponsorship.approvals.value}, denials ${e.sponsorship.denials.value}, approval rate ${e.sponsorship.approval_rate.value} [record]; ${e.sponsorship.titles_listed} titles listed; at-level SWE: ${e.sponsorship.at_level_titles.join('; ') || 'none'}; above-level SWE: ${e.sponsorship.above_level_titles.join('; ') || 'none'} [record]`);
    }
    if (e.liveness) o.push(`- Liveness: ${e.liveness.result} → ${e.liveness.factor.value} [record — saved ats:liveness log${e.liveness.checked ? `, run ${e.liveness.checked}` : ''}]${e.liveness.reason ? ` (${e.liveness.reason})` : ''}`);
    if (e.override) o.push(`- Human override: **${e.override.decision}** — ${e.override.reason}`);
    if (e.fit) o.push(`- Fit: ${e.fit.value} [your-input${e.fit.basis ? ` — ${e.fit.basis}` : ''}]`);
    if (e.timeline) {
      o.push(`- Timeline: factor ${e.timeline.factor.value} [your-input] — expected start ${e.timeline.expected_start}, usable-unemployment deadline ${e.timeline.unemployment_deadline}, slack ${e.timeline.slack_days} days; hiring lag ${e.timeline.inputs.hiring_lag_days}d (${e.timeline.inputs.hiring_lag_source})`);
      for (const c of e.timeline.closures) o.push(`  - gate closed: ${c}`);
      for (const f of e.timeline.flags) o.push(`  - human check: ${f}`);
    }
    for (const m of e.missing) o.push(`- **Missing: ${m.missing}** — ${m.detail}`);
    if (e.context) {
      const c = e.context;
      o.push(`- Context only (not in the score): latest funding ${c.funding_80days.latest_funding_date || '—'} ${c.funding_80days.latest_funding_stage || ''} [record, 80 Days snapshot]; Form D sample hits: ${c.form_d_sample_hits.value.length} [record, samples only]; company LCA median salary (all titles) ${c.lca_median_salary_all_titles.value ?? '—'} vs BLS national 15-1252 median ${c.bls_national_median_15_1252.value ?? '—'} (OEWS ${c.bls_national_median_15_1252.oews_year ?? '—'}) [record]`);
    }
    if (e.decision.arithmetic) o.push(`- Scorer arithmetic: \`${e.decision.arithmetic}\``);
    o.push('');
  }
  o.push('## What this run could not verify\n');
  o.push('- Whether the company sponsored junior software roles that are **not** in its top-titles list. The list is truncated, so a "Possible" tier may be too low.');
  o.push('- Anything about companies missing from the 80 Days file, or present but never joined to a visa record. Those are left unscored for a human to check.');
  o.push('- Whether the posting\'s graduation window, experience cap, and start date were read correctly. A person typed them from the posting text.');
  o.push('- Hiring lag, fit, and the OPT start date. These are the person\'s own estimates, and EAD processing delays are not modeled.');
  o.push('- What this employer will pay. The salary figures are survey and filing context, not an offer, and they do not affect the decision.');
  o.push('\n## Run record\n');
  o.push(`- Mode: ${log.mode} · as-of ${log.as_of} · generated ${log.generated_at}`);
  o.push(`- Scenario: \`${log.inputs.scenario}\` · liveness log: \`${log.inputs.liveness_log}\` · CSV rows read: ${log.inputs.csv_rows}`);
  o.push(`- Scorer: \`${log.scorer.path}\` on \`${log.scorer.input}\` — ${log.scorer.stdout.split('\n')[0] || 'not run (no scoreable roles)'}`);
  o.push(`- Skip rate of scored roles: ${s.skip_rate_of_scored ?? '—'} · model judgments used: ${log.model_judgments_used}`);
  o.push(`- Pending gate: ${log.gate_decisions_pending.join('; ')}`);
  return o.join('\n') + '\n';
}

main();
