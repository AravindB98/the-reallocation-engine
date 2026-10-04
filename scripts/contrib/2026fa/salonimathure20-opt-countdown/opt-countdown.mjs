#!/usr/bin/env node
// opt-countdown.mjs — prototype for recipes/cases/2026fa/salonimathure20-opt-countdown.md
//
// For an F-1 OPT job-seeker: compute how many days are left before a job must
// start (OPT end date vs. unemployment clock), look up each candidate role's
// employer in the 80 Days CSV, apply the liveness and timeline gates, and hand
// the evidence to the EXISTING scorer (scripts/score/role-scorer.mjs). Roles
// missing a required input are BLOCKED for a human, never scored on a guess.
//
//   node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
//     [--persona p.json] [--candidates c.json] [--liveness liveness.txt]
//     [--greenhouse-api api.txt] [--sponsors-csv f.csv] [--soc-csv f.csv] [--out-dir dir]
//
// Exit: 0 = run complete · 2 = bad input file · 3 = run halted at the runway gate.
// No network calls. Liveness comes from saved checker output (recipe step 3).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SRC, LABELS, parseCsv, indexBy, sponsorshipFromRow, fundingFromRow, roleQualityFromRow,
  runway, timelineFactor, parseLivenessOutput, parseGreenhouseApi, livenessGate, nextAction,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(REPO, path.resolve(p));

const DEFAULTS = {
  persona: path.join(HERE, 'fixtures/worked-run/persona.json'),
  candidates: path.join(HERE, 'fixtures/worked-run/candidates.json'),
  liveness: path.join(HERE, 'fixtures/worked-run/liveness.txt'),
  'greenhouse-api': path.join(HERE, 'fixtures/worked-run/greenhouse-api.txt'),
  'sponsors-csv': path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  'soc-csv': path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  'out-dir': path.join(REPO, 'course/2026fa/submissions/salonimathure20/runs/opt-countdown'),
};
const OUTPUTS = ['roles.json', 'scorer-profile.json', 'role-scores.json', 'role-scores.md', 'opt-countdown-log.json', 'opt-countdown-report.md'];

function args() {
  const a = process.argv.slice(2), o = { ...DEFAULTS };
  for (let i = 0; i < a.length; i += 2) {
    const k = a[i].replace(/^--/, '');
    if (!(k in DEFAULTS) || a[i + 1] == null) die(2, `unknown or incomplete flag: ${a[i]}`);
    o[k] = path.resolve(a[i + 1]);
  }
  return o;
}

function die(code, msg) { console.error(`✗ opt-countdown: ${msg}`); process.exit(code); }

function readJson(p, what) {
  if (!fs.existsSync(p)) die(2, `${what} not found: ${rel(p)}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(2, `${what} does not parse: ${e.message}`); }
}
const readText = (p, what) => { if (!fs.existsSync(p)) die(2, `${what} not found: ${rel(p)}`); return fs.readFileSync(p, 'utf8'); };

function validateCandidate(c, i) {
  for (const k of ['role_id', 'company', 'title', 'soc'])
    if (!c[k]) die(2, `candidate #${i} is missing "${k}"`);
  for (const k of ['fit', 'hiring_lag_days', 'csv_name'])
    if (c[k] && !LABELS.has(c[k].source)) die(2, `candidate ${c.role_id}: ${k}.source must be one of ${[...LABELS].join(' | ')}`);
}

function main() {
  const o = args();
  const when = new Date().toISOString();
  fs.mkdirSync(o['out-dir'], { recursive: true });
  for (const f of OUTPUTS) fs.rmSync(path.join(o['out-dir'], f), { force: true }); // no stale results survive a halt

  const persona = readJson(o.persona, 'persona');
  const candidates = readJson(o.candidates, 'candidates');
  if (!Array.isArray(candidates.roles)) die(2, 'candidates file needs a "roles" array');
  candidates.roles.forEach(validateCandidate);

  const inputs = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rel(v)]));

  // ── Gate G1: runway. A past OPT end date or an exhausted clock halts the run.
  const rw = runway(persona);
  if (rw.status === 'halt') {
    const log = { recipe: 'salonimathure20-opt-countdown', run_at: when, status: 'halted', gate: 'G1-runway', reason: rw.reason, detail: rw, inputs };
    fs.writeFileSync(path.join(o['out-dir'], 'opt-countdown-log.json'), JSON.stringify(log, null, 2));
    die(3, `HALT at gate G1 (runway): ${rw.reason}. No role was scored. Log: ${rel(path.join(o['out-dir'], 'opt-countdown-log.json'))}`);
  }

  const sponsors = indexBy(parseCsv(readText(o['sponsors-csv'], 'sponsors CSV')), 'company_name');
  const soc = indexBy(parseCsv(readText(o['soc-csv'], 'SOC CSV')), 'onet_soc_code');
  const checker = parseLivenessOutput(readText(o.liveness, 'liveness output'));
  const hasApi = fs.existsSync(o['greenhouse-api']);
  if (!hasApi) console.warn(`! greenhouse-api file not found (${rel(o['greenhouse-api'])}): liveness is checker-only, which reads a redirected dead job as "active". Every live role will carry a single-source flag.`);
  const api = hasApi ? parseGreenhouseApi(fs.readFileSync(o['greenhouse-api'], 'utf8')) : new Map();
  const keywords = persona.target_role?.title_keywords || [];

  // ── Per-role evidence, every value labeled.
  const evaluated = candidates.roles.map((c) => {
    const csvName = (c.csv_name?.value || c.company).toUpperCase();
    const row = sponsors.get(csvName);
    const ev = {
      role_id: c.role_id, company: c.company, title: c.title, posting_url: c.posting_url || null,
      csv_lookup: { name_used: csvName, alias: c.csv_name || null, found: !!row, source: SRC.record },
      sponsorship: sponsorshipFromRow(row, keywords),
      funding_context: fundingFromRow(row),
      role_quality_context: roleQualityFromRow(soc.get(String(c.soc).toUpperCase()), c.soc),
      fit: c.fit && typeof c.fit.p === 'number' ? { status: 'ok', p: c.fit.p, source: c.fit.source, note: c.fit.note || null } : { status: 'missing', reason: 'no-fit-judgment' },
      hiring_lag: c.hiring_lag_days ? { days: c.hiring_lag_days.value, basis: c.hiring_lag_days.basis, source: c.hiring_lag_days.source } : null,
      liveness: livenessGate(c.posting_url, checker, c.greenhouse ? `${c.greenhouse.board}/${c.greenhouse.job_id}` : null, api),
      timeline: timelineFactor(rw.days, c.hiring_lag_days?.value),
    };
    ev.blocked = ['sponsorship', 'fit', 'liveness', 'timeline']
      .filter((k) => ev[k].status !== 'ok').map((k) => `${k}: ${ev[k].reason}`);
    if (!ev.blocked.length) delete ev.blocked;
    return ev;
  });

  // ── Hand scorable roles to the existing scorer (never a copy of it).
  const scorable = evaluated.filter((e) => !e.blocked);
  const roles = scorable.map((e) => ({
    role_id: e.role_id, company: e.company, title: e.title,
    sponsorship: { p: e.sponsorship.p, tier: e.sponsorship.tier, source: e.sponsorship.source },
    fit: { p: e.fit.p, source: e.fit.source },
    liveness: { factor: e.liveness.factor, source: e.liveness.source },
    timeline: { factor: e.timeline.factor, source: e.timeline.source },
  }));
  const rolesPath = path.join(o['out-dir'], 'roles.json');
  const profilePath = path.join(o['out-dir'], 'scorer-profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));
  fs.writeFileSync(profilePath, JSON.stringify({ authorization: persona.visa.current_status, _source: SRC.input }, null, 2));

  let scored = { roles: [] }, scorerStdout = '(scorer not run: no scorable roles)';
  if (roles.length) {
    scorerStdout = execFileSync(process.execPath, [path.join(REPO, 'scripts/score/role-scorer.mjs'), rolesPath,
      '--profile', profilePath, '--out-dir', o['out-dir']], { cwd: REPO, encoding: 'utf8' }).trim();
    scored = JSON.parse(fs.readFileSync(path.join(o['out-dir'], 'role-scores.json'), 'utf8'));
  }
  const byId = new Map(scored.roles.map((s) => [s.role_id, s]));

  for (const e of evaluated) {
    const s = byId.get(e.role_id);
    if (s) {
      e.decision = { recommendation: s.recommendation, composite: s.composite, reason: s.reason, arithmetic: s.trace.arithmetic, source: 'scripts/score/role-scorer.mjs' };
      e.gated_by = /^gated: (\w+)/.exec(s.reason)?.[1] || null;
    }
    e.next = nextAction({ recommendation: e.decision?.recommendation, blocked: e.blocked, gated_by: e.gated_by });
  }

  const count = (r) => evaluated.filter((e) => e.decision?.recommendation === r).length;
  const summary = { evaluated: evaluated.length, scored: roles.length, blocked: evaluated.length - roles.length,
    apply: count('Apply'), consider: count('Consider'), skip: count('Skip'),
    skip_rate_of_scored: roles.length ? Number((count('Skip') / roles.length).toFixed(2)) : null };

  const log = { recipe: 'salonimathure20-opt-countdown', recipe_version: '0.1.0', mode: 'sample', run_at: when, status: 'complete',
    persona: persona.persona_id, runway: rw, summary, scorer_stdout: scorerStdout, inputs, roles: evaluated,
    human_gates_open: ['G4-adequacy: a human reads the report and signs or rejects each Apply/Consider row'] };
  fs.writeFileSync(path.join(o['out-dir'], 'opt-countdown-log.json'), JSON.stringify(log, null, 2));
  fs.writeFileSync(path.join(o['out-dir'], 'opt-countdown-report.md'), report(persona, rw, summary, evaluated, inputs, when));

  console.log(`✓ opt-countdown: runway ${rw.days} days (start by ${rw.start_by}, bound by ${rw.binding})`);
  console.log(`  ${summary.evaluated} roles → scored ${summary.scored} (Apply ${summary.apply} · Consider ${summary.consider} · Skip ${summary.skip}) · blocked for a human ${summary.blocked}`);
  console.log(`  scorer: ${scorerStdout.split('\n')[0]}`);
  console.log(`  ${rel(path.join(o['out-dir'], 'opt-countdown-log.json'))}  +  ${rel(path.join(o['out-dir'], 'opt-countdown-report.md'))}`);
}

const money = (x) => (x == null ? '—' : `$${Math.round(x).toLocaleString('en-US')}`);

function report(persona, rw, s, ev, inputs, when) {
  const o = [];
  const applyish = ev.filter((e) => ['Apply', 'Consider'].includes(e.decision?.recommendation));
  o.push(`# OPT countdown report — ${persona.persona_id} — as of ${persona.as_of}`);
  o.push('\n## Executive summary\n');
  o.push(`This report checks ${s.evaluated} job postings against one question first: can this employer hire you before your clock runs out? You have **${rw.days} days** of search time left (a job should start by **${rw.start_by}**); the tighter limit is your ${rw.binding === 'unemployment-clock' ? 'remaining OPT unemployment days, after your safety buffer' : 'OPT end date'}. ` +
    `Of the ${s.scored} postings with complete evidence, ${s.apply} ${s.apply === 1 ? 'is' : 'are'} worth applying to now, ${s.consider} worth a networking conversation first, and ${s.skip} should be skipped. ` +
    `${s.blocked} more could not be scored because a fact was missing; those need a person to check before anything else happens. ` +
    `Nothing here is final: you decide every row (see "Your sign-off" at the end).`);
  o.push('\n## Your clock\n');
  o.push('| Item | Value | Label |\n|---|---|---|');
  o.push(`| As of | ${persona.as_of} | your-input |`);
  o.push(`| OPT end date | ${persona.visa.opt_end_date} (${rw.days_to_opt_end} days away) | your-input |`);
  o.push(`| Unemployment days used / allowed / buffer | ${persona.visa.unemployment_days_used} / ${persona.visa.unemployment_ceiling} / ${persona.visa.buffer_target} | your-input |`);
  o.push(`| Search runway | **${rw.days} days** (bound by ${rw.binding}) | script arithmetic on your-input |`);
  o.push('\n## Decisions and next actions\n');
  o.push('| Role | Decision | Why | Next action (3-3-2 block) |\n|---|---|---|---|');
  const order = { apply: 0, 'network-first': 1, 'network-not-apply': 2, 'human-check': 3, skip: 4 };
  for (const e of [...ev].sort((a, b) => order[a.next.bucket] - order[b.next.bucket])) {
    const dec = e.blocked ? '**Blocked**' : `**${e.decision.recommendation}** (${e.decision.composite})`;
    const why = e.blocked ? e.blocked.join('; ') : e.decision.reason;
    o.push(`| ${e.company} — ${e.title} | ${dec} | ${why} | ${e.next.action} · ${e.next.hours} h |`);
  }
  o.push(`\nSkip rate among scored roles: ${s.skip_rate_of_scored == null ? '—' : Math.round(s.skip_rate_of_scored * 100) + '%'} (a healthy run skips at least half).`);
  o.push('\n## Verified vs. inferred, per role\n');
  o.push('| Role | Sponsorship | Fit | Liveness | Timeline | Flags |\n|---|---|---|---|---|---|');
  for (const e of ev) {
    const sp = e.sponsorship.status === 'ok' ? `${e.sponsorship.p} ${e.sponsorship.tier} [record: ${e.sponsorship.record.total_approvals} approvals, ${e.sponsorship.record.approval_rate_pct}%]` : `missing: ${e.sponsorship.reason}`;
    const fit = e.fit.status === 'ok' ? `${e.fit.p} [${e.fit.source}]` : `missing`;
    const lv = e.liveness.status === 'ok' ? `${e.liveness.factor} [record: ${e.liveness.basis}]` : `missing: ${e.liveness.reason}`;
    const tl = e.timeline.status === 'ok' ? `${e.timeline.factor} [your-input: lag ${e.hiring_lag.days} d, slack ${e.timeline.slack_days} d]` : `missing: ${e.timeline.reason}`;
    const flags = [...(e.liveness.flags || []), e.csv_lookup.alias ? `name alias "${e.csv_lookup.name_used}" asserted by ${e.csv_lookup.alias.source}` : null,
      e.sponsorship.status === 'ok' && !e.sponsorship.title_keyword_match.matched.length ? 'no sponsored title matches your target keywords' : null].filter(Boolean).join('; ');
    o.push(`| ${e.company} — ${e.title} | ${sp} | ${fit} | ${lv} | ${tl} | ${flags || '—'} |`);
  }
  o.push('\n## Context the score does not use\n');
  o.push('Role quality carries weight 0 in the shared scorer and funding has no scorer term at all, so these are shown for your judgment only. National medians are not what this employer or your metro pays.\n');
  o.push('| Role | Occupation (SOC) | National median wage [record, BLS OEWS] | Cognitive pivot score [record] | H-1B median salary offered [record, 80 Days] | Latest funding [record, 80 Days] |\n|---|---|---|---|---|---|');
  for (const e of ev) {
    const rq = e.role_quality_context;
    const rqCells = rq.status === 'ok' ? `${rq.title} (${rq.soc}) | ${money(rq.national_median_wage)} (${rq.oews_year}) | ${rq.cognitive_pivot_score ?? 'missing in table'}` : `${rq.soc}: ${rq.reason} | — | —`;
    const f = e.funding_context;
    o.push(`| ${e.company} | ${rqCells} | ${e.sponsorship.status === 'ok' ? money(e.sponsorship.record.median_salary_offered) : '—'} | ${f.status === 'ok' ? `${f.latest_funding_date} ${f.latest_funding_stage || ''} ${money(f.latest_funding_amount)}` : f.reason} |`);
  }
  o.push('\n## What this run could not check\n');
  o.push('- Whether a company *missing* from the 80 Days CSV, or listed with a blank H-1B record, sponsors. Blank is not "no": it can be a name the join missed.');
  o.push('- Whether the employer will sponsor *this* role now, or will register you in the next H-1B lottery. History is not a promise.');
  o.push('- Real hiring speed. Every hiring lag is your own assumption; no dataset here measures time-to-hire.');
  o.push('- That the H-1B approval counts are exact. Every count in the CSV is even, which suggests the join double-counts; rates are unaffected, raw counts may be 2x.');
  o.push('- Cap-gap, STEM-extension eligibility, or whether part-time / volunteer work stops your unemployment clock. Ask your DSO.');
  if (applyish.length) {
    o.push('\n## Your sign-off (gate G4)\n');
    o.push('Before acting on an Apply or Consider row, open the posting yourself and confirm: it is the job described, it is in your target occupation, and the hiring-lag assumption is reasonable. Record your decision in the run log.\n');
    for (const e of applyish) o.push(`- [ ] ${e.company} — ${e.title}: posting opened and matches · lag assumption OK · decision: ______`);
  }
  o.push('\n## Run record\n');
  o.push('| Input | Path |\n|---|---|');
  for (const [k, v] of Object.entries(inputs)) o.push(`| ${k} | \`${v}\` |`);
  o.push(`\nRecipe: \`recipes/cases/2026fa/salonimathure20-opt-countdown.md\` v0.1.0 · sample mode · run at ${when}. Machine log: \`opt-countdown-log.json\` in the same folder.`);
  return o.join('\n') + '\n';
}

main();
