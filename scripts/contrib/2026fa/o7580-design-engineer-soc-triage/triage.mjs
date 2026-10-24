#!/usr/bin/env node
// triage.mjs — design-engineer SOC triage.
//
// For a list of design-engineer postings (UX engineer, front-end, product designer,
// web design engineer…) it reads shipped repo data — the 80 Days CSV and the
// BLS/O*NET compact table — plus a scenario file (persona + roles, your-input) and a
// SAVED `npm run ats:liveness` log. It then:
//   G1 classifies each posting title into a family and its candidate SOC codes,
//      dropping out-of-lane titles (hardware "design engineers", graphic design…);
//   G2/G3 resolves the company and tiers sponsorship on FAMILY-MATCHED titles;
//   G4/G5 applies liveness and eligibility/OPT-clock gates;
//   runs the EXISTING scorer (scripts/score/role-scorer.mjs — not a copy);
//   writes a Cognitive Pivot + wage readout per candidate SOC, refusing blanks.
// Outputs: triage-log.json (agent) and triage-report.md (human), plus the
// scorer's own role-scores.json / role-scores.md.
// It never touches the network and never writes outside its out-dir.
//
//   node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs \
//     [--scenario f.json] [--liveness-log f.log] [--out-dir dir] [--as-of YYYY-MM-DD]
//     [--days-used N] [--csv f.csv] [--bls f.csv]
//
// Exit: 0 run complete (roles may be "not scored" — that is a result, not a failure)
//       2 input/conformance failure — nothing written

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LABEL, parseCsv, resolveCompany, sponsorshipTier, laneFor, socReadout, parseLivenessLog,
  livenessFor, eligibilityTimeline, fitFor, noSponsorOverride, nextAction, MISSING_ACTION,
} from './lib.mjs';

const RECIPE = 'o7580-design-engineer-soc-triage';
const RECIPE_VERSION = '0.1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(REPO, p) || '.';

const DEFAULTS = {
  scenario: path.join(HERE, 'scenarios/design-engineer.live.json'),
  liveness: path.join(HERE, 'scenarios/design-engineer.liveness.log'),
  outDir: path.join(REPO, 'course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live'),
  csv: path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  bls: path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  scorer: path.join(REPO, 'scripts/score/role-scorer.mjs'),
};

const ALLOWED_OUT = [
  path.join(REPO, 'course/2026fa/submissions/o7580'),
  path.join(REPO, 'scripts/contrib/2026fa', RECIPE),
  fs.realpathSync(os.tmpdir()),
];

// Inside the repository, only this contributor's namespaces are allowed — even when
// the repository itself sits under the OS temp dir (a fresh clone in /tmp).
// Outside the repository, only the OS temp dir. Both sides are compared as real paths.
function outDirAllowed(outReal) {
  const repo = fs.realpathSync(REPO);
  const under = (a) => outReal === a || outReal.startsWith(a + path.sep);
  if (under(repo)) return ['course/2026fa/submissions/o7580', `scripts/contrib/2026fa/${RECIPE}`].some((p) => under(path.join(repo, p)));
  return under(fs.realpathSync(os.tmpdir()));
}

const CSV_COLUMNS = ['company_name', 'state', 'city', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'top_job_titles_sponsored'];
const BLS_COLUMNS = ['onet_soc_code', 'title', 'job_zone', 'annual_median_wage', 'oews_year', 'cognitive_pivot_score'];

function die(msg) { console.error(`✗ ${msg}`); process.exit(2); }
function arg(args, name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
function readJson(p, what) {
  if (!fs.existsSync(p)) die(`${what} not found: ${p}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(`${what} is not valid JSON (${p}): ${e.message}`); }
}
function readCsv(p, what, cols) {
  if (!fs.existsSync(p)) die(`${what} not found: ${p}`);
  const rows = parseCsv(fs.readFileSync(p, 'utf8'));
  if (!rows.length) die(`${what} has no rows: ${p}`);
  const absent = cols.filter((c) => !(c in rows[0]));
  if (absent.length) die(`G0 inputs gate: ${what} is missing column(s) ${absent.join(', ')}`);
  return rows;
}

// G0 — inputs gate. Every field a later gate reads must be present; nothing is defaulted.
function checkScenario(s) {
  const need = ['program_end_date', 'opt_start_date', 'unemployment_ceiling_days', 'prior_experience_months', 'authorization'];
  const absent = need.filter((k) => s.persona?.[k] == null);
  if (absent.length) die(`G0 inputs gate: persona is missing ${absent.join(', ')} — refusing to default them`);
  for (const k of ['program_end_date', 'opt_start_date']) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.persona[k])) die(`G0 inputs gate: persona.${k} must be YYYY-MM-DD, got "${s.persona[k]}"`);
  }
  const p = s.params || {};
  for (const k of ['tier_p', 'min_approvals_for_proven', 'default_hiring_lag_days', 'comfort_days']) {
    if (p[k] == null) die(`G0 inputs gate: params.${k} is missing`);
  }
  if (!Array.isArray(s.roles) || !s.roles.length) die('G0 inputs gate: scenario has no roles');
  const ids = new Set();
  for (const r of s.roles) {
    if (!r.role_id || !r.company || !r.title) die(`G0 inputs gate: every role needs role_id, company, title (bad: ${JSON.stringify(r).slice(0, 80)})`);
    if (ids.has(r.role_id)) die(`G0 inputs gate: duplicate role_id "${r.role_id}"`);
    ids.add(r.role_id);
  }
}

// Resolve symlinks on the nearest existing ancestor (macOS /var → /private/var), so an
// allowed temp dir is not rejected and a symlink cannot smuggle output elsewhere.
function realOutPath(p) {
  let head = path.resolve(p);
  const tail = [];
  while (!fs.existsSync(head)) { tail.unshift(path.basename(head)); head = path.dirname(head); }
  return path.join(fs.realpathSync(head), ...tail);
}

const fmtUsd =(n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function main() {
  const args = process.argv.slice(2);
  const scenarioPath = path.resolve(arg(args, '--scenario') || DEFAULTS.scenario);
  const livenessPath = path.resolve(arg(args, '--liveness-log') || DEFAULTS.liveness);
  const outDir = path.resolve(arg(args, '--out-dir') || DEFAULTS.outDir);
  const csvPath = path.resolve(arg(args, '--csv') || DEFAULTS.csv);
  const blsPath = path.resolve(arg(args, '--bls') || DEFAULTS.bls);

  // ── G0: everything is checked BEFORE anything is written ──
  const scenario = readJson(scenarioPath, 'scenario');
  checkScenario(scenario);
  const asOf = arg(args, '--as-of') || scenario.as_of;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) die(`G0 inputs gate: as_of must be YYYY-MM-DD, got "${asOf}"`);
  const persona = { ...scenario.persona };
  const daysUsed = arg(args, '--days-used');
  if (daysUsed != null) {
    if (!/^\d+$/.test(daysUsed)) die(`--days-used must be a whole number, got "${daysUsed}"`);
    persona.unemployment_days_used = Number(daysUsed);
  }
  if (!fs.existsSync(livenessPath)) die(`liveness log not found: ${livenessPath} — run npm run ats:liveness and save its output first`);
  const liveness = parseLivenessLog(fs.readFileSync(livenessPath, 'utf8'));
  if (liveness.byUrl.size === 0) die(`G0 inputs gate: liveness log has no result lines: ${livenessPath}`);
  const csvRows = readCsv(csvPath, '80 Days CSV', CSV_COLUMNS);
  const blsRows = readCsv(blsPath, 'BLS compact table', BLS_COLUMNS);
  const outReal = realOutPath(outDir);
  if (!outDirAllowed(outReal)) {
    die(`out-dir must sit under ${ALLOWED_OUT.map(rel).join(' or ')} — got ${outDir}`);
  }

  const params = scenario.params;
  const roles = [];
  const scorerInput = [];
  const pending = [];

  for (const role of scenario.roles) {
    const r = { role_id: role.role_id, company_input: role.company, title: role.title, location: role.location || null, posting_url: role.posting_url || null, missing: [] };
    roles.push(r);

    // G1 — lane / SOC family
    const lane = laneFor(role);
    if (lane.missing) { r.missing.push(lane); r.outcome = 'Not scored'; continue; }
    r.lane = { family: lane.family, auto_family: lane.auto_family, lane: lane.lane, label: lane.label, basis: lane.basis, candidate_soc: lane.soc, soc_risk: lane.soc_risk || null, why: lane.why || null };
    if (lane.lane === 'out') {
      r.outcome = 'Skip (out of lane)';
      r.next_action = `DROP: ${lane.why}. Not this mode's lane — no sponsorship lookup or scoring is spent on it.`;
      continue;
    }
    r.soc_readout = socReadout(blsRows, lane.soc);

    // G2 — company resolution; G3 — family-matched sponsorship
    const co = resolveCompany(csvRows, role.company, role.state);
    let tier = null;
    if (co.missing) r.missing.push(co);
    else {
      r.company = { value: co.row.company_name, city: co.row.city, state: co.row.state, label: LABEL.record, source: rel(csvPath) };
      tier = sponsorshipTier(co.row, lane.family, params);
      if (tier.missing) r.missing.push(tier);
      else r.sponsorship = {
        tier: { value: tier.tier, label: LABEL.record, basis: tier.basis },
        p: { value: tier.p, label: LABEL.input, basis: `tier_p.${tier.tier} (scenario params)` },
        approvals: tier.approvals, denials: tier.denials, approval_rate: tier.approval_rate,
        at_level_matched: tier.at_level_matched, above_level_matched: tier.above_level_matched, title_families: tier.title_families,
      };
    }

    // G4 — liveness (a gate)
    const live = livenessFor(liveness, role.posting_url);
    if (live.missing) r.missing.push(live);
    else r.liveness = { factor: { value: live.factor, label: LABEL.record }, result: live.result, reason: live.reason, source: rel(livenessPath), checked: liveness.meta.ran || null };

    // fit (a vote; model-judgment until the person confirms it)
    const fit = fitFor(role);
    if (fit.missing) r.missing.push(fit);
    else {
      r.fit = { value: fit.p, label: fit.label, basis: fit.basis, confirmed_by: fit.confirmed_by, drafted_by: fit.drafted_by };
      if (!fit.confirmed_by) pending.push(`${role.role_id}: fit ${fit.p} was drafted by ${fit.drafted_by || 'an agent'} — confirm or change it (it is labeled model-judgment until you do)`);
    }

    // G5 — eligibility + OPT clock (a gate)
    const tl = eligibilityTimeline(persona, role, params, asOf);
    r.eligibility_timeline = { factor: { value: tl.factor, label: LABEL.input }, ...tl };
    if (role.posting && !role.posting.confirmed_by) {
      pending.push(`${role.role_id}: posting fields were transcribed by ${role.posting.transcribed_by || 'an agent'} — re-read the posting and confirm them`);
    }

    const ov = noSponsorOverride(role, persona);
    if (ov) r.override = { ...ov, label: LABEL.input };

    if (r.missing.length) { r.outcome = 'Not scored'; continue; }

    const sr = {
      role_id: role.role_id, company: r.company.value, title: role.title,
      sponsorship: { p: tier.p, tier: tier.tier, source: LABEL.record },
      fit: { p: fit.p, source: fit.label },
      liveness: { factor: live.factor, source: LABEL.record },
      timeline: { factor: tl.factor, source: LABEL.input },
    };
    if (ov) sr.override = { decision: ov.decision, reason: ov.reason };
    for (const [k, v] of [['sponsorship', sr.sponsorship.p], ['fit', sr.fit.p], ['liveness', sr.liveness.factor], ['timeline', sr.timeline.factor]]) {
      if (typeof v !== 'number' || v < 0 || v > 1) die(`internal conformance: ${role.role_id}.${k} = ${v} is not a number in [0,1] — refusing to call the scorer`);
    }
    scorerInput.push(sr);
    r.outcome = 'Scored';
  }

  // ── write roles.json and run the maintained scorer ──
  fs.mkdirSync(outDir, { recursive: true });
  const rolesPath = path.join(outDir, 'roles.json');
  const profilePath = path.join(outDir, 'scorer-profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify(scorerInput, null, 2) + '\n');
  fs.writeFileSync(profilePath, JSON.stringify({ authorization: persona.authorization }, null, 2) + '\n');
  let scorerStdout = '(scorer not called: no role reached it)';
  let scored = [];
  if (scorerInput.length) {
    const run = spawnSync(process.execPath, [DEFAULTS.scorer, rolesPath, '--profile', profilePath, '--out-dir', outDir], { cwd: REPO, encoding: 'utf8' });
    if (run.status !== 0) die(`scorer exited ${run.status}: ${run.stderr}`);
    scorerStdout = run.stdout.trim();
    scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8')).roles;
  }
  const byId = new Map(scored.map((s) => [s.role_id, s]));
  for (const r of roles) {
    if (r.outcome === 'Scored') {
      const s = byId.get(r.role_id);
      r.decision = { recommendation: s.recommendation, machine_recommendation: s.machine_recommendation, composite: s.composite, reason: s.reason, arithmetic: s.trace.arithmetic };
      r.outcome = s.recommendation;
      r.next_action = nextAction(s.recommendation, s.reason, r.sponsorship?.tier.value, r.override, r.lane, r.sponsorship?.tier.basis);
    } else if (r.outcome === 'Not scored') {
      r.next_action = r.missing.map((m) => MISSING_ACTION[m.missing] || m.missing).join(' · ');
    }
  }

  const count = (o) => roles.filter((r) => r.outcome === o).length;
  const outOfLane = count('Skip (out of lane)');
  const notScored = count('Not scored');
  const apply = count('Apply'), consider = count('Consider'), skip = count('Skip');
  const decided = outOfLane + apply + consider + skip;
  const summary = {
    evaluated: roles.length, out_of_lane: outOfLane, not_scored: notScored, scored: scorerInput.length,
    apply, consider, skip,
    skip_rate_of_decided: decided ? Number(((skip + outOfLane) / decided).toFixed(3)) : null,
    cognitive_pivot_refusals: roles.filter((r) => r.soc_readout?.primary_refused).length,
  };
  const missingCounts = {};
  for (const r of roles) for (const m of r.missing) missingCounts[m.missing] = (missingCounts[m.missing] || 0) + 1;

  const log = {
    recipe: RECIPE, recipe_version: RECIPE_VERSION, mode: scenario.mode || 'live', as_of: asOf,
    generated_at: new Date().toISOString(),
    inputs: {
      scenario: rel(scenarioPath), liveness_log: rel(livenessPath), liveness_log_meta: liveness.meta,
      csv: rel(csvPath), csv_rows: csvRows.length, bls: rel(blsPath), bls_rows: blsRows.length,
    },
    persona: { ...persona, label: LABEL.input },
    params: { ...params, label: LABEL.input },
    summary, missing_counts: missingCounts,
    scorer: { path: rel(DEFAULTS.scorer), input: rel(rolesPath), stdout: scorerStdout, note: 'role_quality is NOT passed: the scorer weights it 0.0, so the Cognitive Pivot readout is reported beside the decision, never inside it' },
    gate_decisions_pending: [
      'G1: confirm every lane/family classification in the report (especially any family_override)',
      'G2: confirm each matched 80 Days entity is the employer that posted the job',
      ...pending,
      'G6: record a named-human decision for every Apply / Consider row',
    ],
    roles,
  };
  fs.writeFileSync(path.join(outDir, 'triage-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'triage-report.md'), renderReport(log));

  console.log(`✓ ${RECIPE} v${RECIPE_VERSION} — as of ${asOf}`);
  console.log(`  evaluated ${summary.evaluated} → out of lane ${outOfLane} · not scored ${notScored} · scored ${summary.scored} (Apply ${apply} · Consider ${consider} · Skip ${skip})`);
  console.log(`  skip rate of decided roles ${summary.skip_rate_of_decided} · Cognitive Pivot refusals ${summary.cognitive_pivot_refusals}`);
  console.log(`  scorer: ${scorerStdout.split('\n')[0]}`);
  console.log(`  wrote ${rel(path.join(outDir, 'triage-log.json'))} + triage-report.md`);
}

function renderReport(log) {
  const s = log.summary;
  const o = [];
  o.push(`# Design-engineer SOC triage — ${log.as_of}`);
  o.push('');
  o.push('## Executive summary');
  o.push('');
  o.push(`**What this is.** A check of ${s.evaluated} real job postings for someone who is both a software engineer and an interface designer, is on a student visa, and will need an employer to sponsor a work visa. For each posting it asks four things. Is this really a software-interface job, or does it only use the word "design"? Has this employer sponsored visas for *this kind* of job at *this* level? Is the posting still open? Can the candidate take the job before their post-graduation work permit's unemployment allowance runs out?`);
  o.push('');
  o.push(`**What it found.** ${s.out_of_lane} of ${s.evaluated} postings were not interface-design or front-end work at all, and were dropped. ${s.not_scored} could not be judged from the records and need a person to check something first. Of the ${s.scored} that could be judged: ${s.apply} worth tailoring an application for, ${s.consider} worth a conversation first, and ${s.skip} to skip. Overall, ${Math.round((s.skip_rate_of_decided || 0) * 100)}% of the postings it could decide were dropped or skipped. ${s.cognitive_pivot_refusals} posting(s) belong to an occupation whose AI-resilience score is blank in the government data, so the report refuses to give one rather than borrowing a neighbouring occupation's number.`);
  o.push('');
  o.push('**What a person still has to decide.** Every classification, every employer match and every posting detail below must be confirmed by the candidate before acting. Nothing here applies to anything. Values an AI drafted are marked as model judgments until the candidate confirms them.');
  o.push('');
  o.push('## Decisions and next actions');
  o.push('');
  o.push('| Posting | Family (lane) | Outcome | Composite | Next action |');
  o.push('|---|---|---|---|---|');
  for (const r of log.roles) {
    const fam = r.lane ? `${r.lane.family} (${r.lane.lane})` : '—';
    o.push(`| ${cell(r.company_input)} — ${cell(r.title)} | ${cell(fam)} | **${cell(r.outcome)}** | ${r.decision ? r.decision.composite.toFixed(3) : '—'} | ${cell(r.next_action)} |`);
  }
  o.push('');
  o.push('## The SOC question: what the classification puts at stake');
  o.push('');
  o.push('For each in-lane posting: the occupation codes it could be filed under for a visa petition, each code\'s national median wage (BLS OEWS) and its AI-resilience score (Cognitive Pivot: the mean of nine O*NET reasoning, judgment and systems ratings, on O*NET\'s 0–7 level scale). Which code the employer actually files is **not** in any shipped file.');
  o.push('');
  o.push('| Posting | SOC risk | Candidate SOC → median wage · Cognitive Pivot | Wage gap across candidates |');
  o.push('|---|---|---|---|');
  for (const r of log.roles) {
    if (!r.soc_readout) continue;
    const c = r.soc_readout.candidates.map((x) => x.missing ? `${x.onet_soc_code}: ${x.missing}` : `${x.onet_soc_code} ${x.title}: ${fmtUsd(x.annual_median_wage)} · ${x.cognitive_pivot_score ?? '**refused (blank)**'}`).join('<br>');
    const g = r.soc_readout.wage_spread ? fmtUsd(r.soc_readout.wage_spread.gap) : '—';
    o.push(`| ${cell(r.company_input)} — ${cell(r.title)} | ${cell(r.lane.soc_risk)} | ${c} | ${g} |`);
  }
  o.push('');
  o.push('## Evidence per posting');
  o.push('');
  for (const r of log.roles) {
    o.push(`### ${r.company_input} — ${r.title}`);
    o.push('');
    o.push(`- Location: ${r.location ?? '—'} · URL: ${r.posting_url ?? '—'}`);
    if (r.lane) o.push(`- Lane: **${r.lane.family}** (${r.lane.lane}) [${r.lane.label}] — ${r.lane.why || r.lane.basis}`);
    if (r.company) o.push(`- Employer record: ${r.company.value}, ${r.company.city}, ${r.company.state} [record]`);
    if (r.sponsorship) {
      o.push(`- Sponsorship: tier **${r.sponsorship.tier.value}** [record] — ${r.sponsorship.tier.basis}; approvals ${r.sponsorship.approvals}, denials ${r.sponsorship.denials ?? '—'} [record]; p = ${r.sponsorship.p.value} [your-input]`);
      o.push(`  - Matched at level: ${r.sponsorship.at_level_matched.join('; ') || 'none'} · matched above level: ${r.sponsorship.above_level_matched.join('; ') || 'none'}`);
    }
    if (r.liveness) o.push(`- Liveness: ${r.liveness.result} (factor ${r.liveness.factor.value}) [record, checked ${r.liveness.checked ?? 'date not recorded'}]`);
    if (r.fit) o.push(`- Fit: ${r.fit.value} [${r.fit.label}] — ${r.fit.basis}`);
    if (r.eligibility_timeline) {
      const t = r.eligibility_timeline;
      o.push(`- Eligibility + OPT clock: factor ${t.factor.value} [your-input] — expected start ${t.expected_start}, unemployment deadline ${t.unemployment_deadline}, slack ${t.slack_days} days${t.closures.length ? `; **closed:** ${t.closures.join('; ')}` : ''}${t.flags.length ? `; flags: ${t.flags.join('; ')}` : ''}`);
    }
    if (r.override) o.push(`- Override: ${r.override.decision} — ${r.override.reason}`);
    if (r.decision) o.push(`- Scorer: ${r.decision.recommendation} (machine: ${r.decision.machine_recommendation}) — ${r.decision.reason}; ${r.decision.arithmetic}`);
    for (const m of r.missing) o.push(`- **Not scored — ${m.missing}:** ${m.detail}`);
    o.push('');
  }
  o.push('## What this run could not verify');
  o.push('');
  o.push('- **Which SOC code an employer files a design role under.** The sponsorship file lists job titles, not occupation codes. Whether a "Product Designer" was filed as a computer occupation or an arts-and-design one needs the Labor Department\'s per-petition disclosure rows, which this repository does not ship.');
  o.push('- **An AI-resilience score for Web and Digital Interface Designers (15-1255.00).** The shipped O*NET row has no ability or skill ratings. The score is refused, not estimated.');
  o.push('- **Junior design sponsorship that fell off a truncated top-titles list.** A large sponsor can look senior-only, or show no design titles, simply because the list is short.');
  o.push('- **Current policy.** Approval counts are history. Only the posting text, read by a person, says what the employer will do now.');
  o.push('- **Whether a security-clearance requirement truly excludes this candidate,** whether the employer uses E-Verify (needed for the STEM OPT extension), and whether this job is "directly related" to the candidate\'s degree. Those are for the school\'s international student office, not for this tool.');
  o.push('- **Posting fields and fit.** A person typed or confirmed them; the tool only does the arithmetic.');
  o.push('');
  o.push('## Gates waiting on a person');
  o.push('');
  for (const g of log.gate_decisions_pending) o.push(`- [ ] ${g}`);
  o.push('');
  o.push('## Run record');
  o.push('');
  o.push(`- Recipe: \`recipes/cases/2026fa/${log.recipe}.md\` v${log.recipe_version} · mode ${log.mode} · as of ${log.as_of} · generated ${log.generated_at}`);
  o.push(`- Inputs: scenario \`${log.inputs.scenario}\`; liveness \`${log.inputs.liveness_log}\` (ran ${log.inputs.liveness_log_meta.ran ?? '—'}); CSV \`${log.inputs.csv}\` (${log.inputs.csv_rows} rows); BLS \`${log.inputs.bls}\` (${log.inputs.bls_rows} rows)`);
  o.push(`- Scorer: \`${log.scorer.path}\` — ${log.scorer.stdout.split('\n')[0]}`);
  o.push(`- Missing-reason counts: ${Object.entries(log.missing_counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  o.push(`- Model judgments used: ${log.roles.filter((r) => r.fit?.label === LABEL.model).length} unconfirmed fit value(s), labeled model-judgment in the scorer input`);
  return o.join('\n') + '\n';
}

main();
