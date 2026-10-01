#!/usr/bin/env node
// triage.mjs — new-grad SWE triage at big H-1B sponsors, for a December graduate.
//
//   node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs \
//     [--persona p.json] [--postings postings.json] [--out-dir dir] [--today yyyy-mm-dd]
//     [--csv path] [--bls path]
//
// Defaults: the fictional persona + sample postings in ./fixtures, output to ./out.
// Reads only local files. Builds roles.json, runs the EXISTING scorer
// (scripts/score/role-scorer.mjs) as a CLI, then writes:
//   <out>/triage-log.json   — agent log (every value labeled)
//   <out>/triage-report.md  — human report
// Exit: 0 ok · 2 bad input/missing data file · 3 OPT unemployment window already closed.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SRC, parseCSV, buildIndex, matchCompany, sponsorshipEvidence, validatePersona,
  unemploymentDeadline, timelineFactor, livenessGate, nextAction, parseISO, isoOf,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(ROOT, p) || '.';
const DEFAULTS = {
  persona: path.join(HERE, 'fixtures/persona-dec-grad.json'),
  postings: path.join(HERE, 'fixtures/postings-sample.json'),
  out: path.join(HERE, 'out'),
  csv: path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  bls: path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv'),
  scorer: path.join(ROOT, 'scripts/score/role-scorer.mjs'),
};

function fail(code, msg) { console.error(`✗ ${msg}`); process.exit(code); }
function arg(args, name, dflt) { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; }
function readJSON(p, what) {
  if (!fs.existsSync(p)) fail(2, `${what} not found: ${p}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(2, `${what} is not valid JSON (${p}): ${e.message}`); }
}

export function run(opts) {
  const persona = readJSON(opts.persona, 'persona');
  const perr = validatePersona(persona);
  if (perr.length) fail(2, `persona invalid — refusing to default any value:\n  - ${perr.join('\n  - ')}`);

  const today = parseISO(opts.today);
  if (!today) fail(2, `--today must be yyyy-mm-dd (got ${opts.today})`);

  // G0 window-open: halt the whole run, write no roles.
  const win = unemploymentDeadline(persona, today);
  if (win.remaining <= 0 || today > win.deadline)
    fail(3, `G0 window-closed: ${win.remaining} unemployment days remain; deadline ${isoOf(win.deadline)} (OPT start ${persona.opt_start_date.value} + ${persona.unemployment_limit_days.value}d − ${persona.unemployment_days_used.value}d used). No roles scored. Talk to your DSO.`);

  const postingsDoc = readJSON(opts.postings, 'postings');
  const postings = Array.isArray(postingsDoc) ? postingsDoc : postingsDoc.postings;
  if (!Array.isArray(postings) || !postings.length) fail(2, 'postings file has no postings[]');

  if (!fs.existsSync(opts.csv)) fail(2, `sponsorship CSV not found: ${opts.csv}`);
  const idx = buildIndex(parseCSV(fs.readFileSync(opts.csv, 'utf8')));

  // Wage context (outside the scorer — role_quality weight is 0.0 there).
  const soc = persona.target_soc?.value || '15-1252';
  let wage = { status: 'missing', reason: 'bls-file-missing', soc };
  if (fs.existsSync(opts.bls)) {
    const hit = parseCSV(fs.readFileSync(opts.bls, 'utf8')).filter((r) => r.bls_soc_code === soc);
    const med = parseFloat(hit[0]?.annual_median_wage);
    wage = hit.length !== 1 ? { status: 'missing', reason: hit.length ? 'ambiguous-soc-row' : 'no-occupation-row', soc }
      : !Number.isFinite(med) ? { status: 'missing', reason: 'no-median-wage', soc }
      : { status: 'ok', soc, title: hit[0].title, national_median: med, oews_year: hit[0].oews_year, source: SRC.record };
  }

  const minApprovals = persona.big_sponsor_min_approvals.value;
  const roles = [], excluded = [], detail = [];
  for (const po of postings) {
    const id = po.posting_id;
    const ex = (gate, reason, extra = {}) => { excluded.push({ posting_id: id, company: po.company, title: po.title, gate, reason, ...extra }); };

    const m = matchCompany(idx, po.company);
    if (m.status !== 'ok') { ex('G1 company-match', m.reason, { candidates: m.candidates }); continue; }
    const sp = sponsorshipEvidence(m.row, minApprovals);
    if (sp.status !== 'ok') { ex('G4 entry-level-evidence', sp.reason, { csv_company: m.row.company_name, evidence: sp.evidence }); continue; }
    const lv = livenessGate(po);
    if (lv.status !== 'ok') { ex('G2 liveness', lv.reason, { csv_company: m.row.company_name, fix: po.url ? `npm run ats:liveness -- ${po.url}` : 'add the posting URL' }); continue; }
    const tl = timelineFactor(persona, po, today);
    if (tl.status !== 'ok') { ex('G3 timeline', tl.reason, { detail: tl.detail }); continue; }

    const role = {
      role_id: id, company: m.row.company_name, title: po.title,
      sponsorship: { p: sp.p, tier: sp.tier, source: SRC.record, _p_from: 'TIER_MAP v0.1 (your-input mapping)', _bucket: sp.bucket },
      liveness: { factor: lv.factor, source: lv.source },
      timeline: { factor: tl.factor, source: tl.source },
    };
    const fitP = po.fit?.p;
    if (typeof fitP === 'number') role.fit = { p: fitP, source: po.fit.source || SRC.input };
    roles.push(role);

    const cmed = parseFloat(m.row.median_salary_offered);
    detail.push({
      posting_id: id, posting_company: po.company, csv_company: m.row.company_name, title: po.title, url: po.url ?? null,
      sponsorship: { tier: sp.tier, p: sp.p, bucket: sp.bucket, p_source: SRC.input, evidence: sp.evidence },
      liveness: lv, timeline: tl,
      fit: role.fit ?? { status: 'missing', reason: 'no-fit-input (not invented; vote omitted)' },
      wage_context: {
        company_median_salary_offered: { value: Number.isFinite(cmed) ? cmed : null, source: SRC.record, note: 'all sponsored roles at this company, not entry-level SWE' },
        bls_national_median: wage.status === 'ok' ? { value: wage.national_median, source: SRC.record, soc } : wage,
        in_score: false,
      },
    });
  }

  fs.mkdirSync(opts.out, { recursive: true });
  const rolesPath = path.join(opts.out, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2) + '\n');

  let scored = [], scorerStdout = '';
  if (roles.length) {
    scorerStdout = execFileSync(process.execPath, [opts.scorer, rolesPath, '--out-dir', opts.out], { cwd: ROOT, encoding: 'utf8' });
    scored = JSON.parse(fs.readFileSync(path.join(opts.out, 'role-scores.json'), 'utf8')).roles;
  }

  const decisions = scored.map((s) => {
    const role = roles.find((r) => r.role_id === s.role_id);
    return { posting_id: s.role_id, company: s.company, title: s.title, recommendation: s.recommendation,
      composite: s.composite, scorer_reason: s.reason, next: nextAction(s, role), trace: s.trace };
  });

  const count = (r) => decisions.filter((d) => d.recommendation === r).length;
  const evaluated = postings.length;
  const summary = {
    evaluated, scored: decisions.length, excluded: excluded.length,
    apply: count('Apply'), consider: count('Consider'), skip: count('Skip'),
    skip_or_excluded_share: evaluated ? Number(((count('Skip') + excluded.length) / evaluated).toFixed(3)) : null,
  };

  const log = {
    recipe: 'SmitPatel-31-newgrad-swe-bigsponsor', recipe_version: '0.1.0', run_date: isoOf(today),
    mode: 'sample', persona_id: persona.persona_id ?? null,
    inputs: { persona: rel(opts.persona), postings: rel(opts.postings), csv: rel(opts.csv), bls: rel(opts.bls), scorer: rel(opts.scorer) },
    window: { opt_start: { value: persona.opt_start_date.value, source: SRC.input },
      unemployment_limit_days: { value: persona.unemployment_limit_days.value, source: SRC.input },
      deadline: { value: isoOf(win.deadline), source: SRC.input, derived: 'max(today, OPT start) + limit − used' } },
    wage_context: wage,
    summary, decisions, excluded, detail,
    scorer_stdout: scorerStdout.trim(),
    human_gates_open: [
      'G1: map every no-company-match / ambiguous name by hand, or accept Unknown',
      'G2: re-run npm run ats:liveness on any posting whose liveness source is your-input',
      'G3: confirm every estimated start date with the recruiter',
      'G4: read the raw sponsored-title list for each company; the keyword rule can misread it',
    ],
  };
  fs.writeFileSync(path.join(opts.out, 'triage-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.out, 'triage-report.md'), renderReport(log));
  return log;
}

const ACTION_TEXT = {
  'tailor-and-apply': 'Tailor the résumé and apply (2h research/apply block)',
  'network-first': 'Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide',
  'network-dont-apply': 'Network, don\'t apply yet: ask about an earlier or off-cycle start date',
  skip: 'Skip',
};

function renderReport(log) {
  const s = log.summary, o = [];
  o.push('# New-grad SWE triage at big H-1B sponsors — run report', '');
  o.push('## Executive summary', '');
  o.push(`This report checks ${s.evaluated} job postings against public H-1B sponsorship records and your OPT dates, and says which are worth your time. ` +
    `**${s.apply} apply, ${s.consider} to network into first, ${s.skip} skip, and ${s.excluded} that a person has to look at** because the data could not answer them. ` +
    `Your deadline to start work is **${log.window.deadline.value}** (OPT start plus ${log.window.unemployment_limit_days.value} unemployment days, from dates you entered). ` +
    'A role that starts later than that is skipped however strong the company is. "Sponsors a lot of H-1Bs" is not the same as "sponsors new-grad software engineers", ' +
    'so each company is judged by the job titles it actually sponsored. Many large sponsors are not in this dataset at all, and "not found" never means "does not sponsor".', '');
  o.push('## Decisions', '');
  o.push('| Company | Role | Decision | Why | Next action |', '|---|---|---|---|---|');
  for (const d of log.decisions) {
    const det = log.detail.find((x) => x.posting_id === d.posting_id);
    const est = det.timeline.basis.startsWith('estimated') ? ` (**start date ESTIMATED** — ${det.timeline.basis}; confirm with recruiter)` : '';
    const why = `sponsorship ${det.sponsorship.tier} (${det.sponsorship.bucket}); timeline ${det.timeline.factor} — ${det.timeline.why}${est}; liveness ${det.liveness.factor} [${det.liveness.source}]`;
    o.push(`| ${d.company} | ${d.title} | **${d.recommendation}** (${d.composite}) | ${why} | ${ACTION_TEXT[d.next.action]} |`);
  }
  o.push('', '## Needs a person (not scored — no value was invented)', '');
  if (!log.excluded.length) o.push('_None._');
  else {
    o.push('| Company (as typed) | Role | Gate | Reason | What to do |', '|---|---|---|---|---|');
    const todo = {
      'no-company-match': 'Not in this dataset (built from SEC Form D filers). Find the exact legal name, or treat sponsorship as Unknown and check another source',
      'ambiguous-company-match': 'Several rows match; pick the right entity by hand',
      'below-big-sponsor-threshold': 'Below the big-sponsor approval threshold you set; outside this recipe',
      'no-title-evidence': 'Approvals exist but no sponsored titles are listed; check the DOL LCA data by hand',
      'liveness-unchecked': 'Run the liveness check, then re-run',
      'invalid-start-date': 'Fix the start date in the postings file',
    };
    for (const e of log.excluded)
      o.push(`| ${e.company} | ${e.title} | ${e.gate} | ${e.reason}${e.candidates?.length ? ` (${e.candidates.join(', ')})` : ''} | ${e.fix ? '`' + e.fix + '`' : todo[e.reason] || 'Look at it by hand'} |`);
  }
  o.push('', '## Sponsored-title evidence (read this before trusting a tier)', '');
  for (const d of log.detail) {
    const cls = d.sponsorship.evidence.title_classes.value.map((x) => `${x.title} → ${x.class}`).join('; ');
    o.push(`- **${d.csv_company}** — ${d.sponsorship.evidence.total_approvals.value} approvals, ${d.sponsorship.evidence.total_denials.value} denials [record]. Titles: ${cls} [classification = keyword rule v0.1, your-input]`);
  }
  o.push('', '## Pay context (not part of the score)', '');
  if (log.wage_context.status === 'ok') {
    o.push(`National median for ${log.wage_context.title} (${log.wage_context.soc}), OEWS ${log.wage_context.oews_year}: $${log.wage_context.national_median.toLocaleString('en-US')} [record]. ` +
      'The company medians below cover **all** the roles each company sponsored, not entry-level SWE, so they overstate new-grad pay at senior-heavy companies.', '');
    for (const d of log.detail) o.push(`- ${d.csv_company}: $${(d.wage_context.company_median_salary_offered.value ?? 0).toLocaleString('en-US')} median sponsored salary [record]`);
  } else o.push(`BLS wage missing: ${log.wage_context.reason}. No number shown.`);
  o.push('', '## What this run could not check', '');
  o.push('- Whether a company sponsors new-grad SWEs *this year*. The title list is historical and shows only top titles, with no counts.',
    '- Companies that are not in the dataset (for example several of the largest tech sponsors).',
    '- Whether a posting is live, unless the liveness source says `record` (from `npm run ats:liveness` with a date).',
    '- Start dates that were estimated from your hiring-lag assumption. Confirm them with the recruiter.',
    '- The OPT rules themselves. Confirm the dates and the unemployment limit with your DSO.', '');
  o.push('## Run record', '', `- Run date: ${log.run_date} · mode: ${log.mode} · persona: ${log.persona_id}`);
  for (const [k, v] of Object.entries(log.inputs)) o.push(`- ${k}: \`${v}\``);
  o.push(`- Scorer: \`${log.scorer_stdout.split('\n')[0] || 'not run (no scorable roles)'}\``, `- Agent log: \`triage-log.json\``, '');
  return o.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = process.argv.slice(2);
  const log = run({
    persona: path.resolve(arg(a, 'persona', DEFAULTS.persona)),
    postings: path.resolve(arg(a, 'postings', DEFAULTS.postings)),
    out: path.resolve(arg(a, 'out-dir', DEFAULTS.out)),
    today: arg(a, 'today', new Date().toISOString().slice(0, 10)),
    csv: path.resolve(arg(a, 'csv', DEFAULTS.csv)),
    bls: path.resolve(arg(a, 'bls', DEFAULTS.bls)),
    scorer: DEFAULTS.scorer,
  });
  const s = log.summary;
  console.log(`✓ triage ${log.run_date}: ${s.evaluated} postings → Apply ${s.apply} · Consider ${s.consider} · Skip ${s.skip} · Needs-human ${s.excluded}`);
  console.log(`  deadline to start work: ${log.window.deadline.value} [your-input]`);
  console.log(`  ${rel(path.resolve(arg(a, 'out-dir', DEFAULTS.out)))}/triage-log.json  +  triage-report.md  (+ scorer's roles.json, role-scores.json, role-scores.md)`);
}
