#!/usr/bin/env node
// match.mjs — data-role-sponsor-match prototype (kommurisi, Fall 2026).
//
// OFFLINE. Reads repo data + saved evidence, writes a roles.json, runs the
// EXISTING scorer (scripts/score/role-scorer.mjs) on it, then writes:
//   <out>/data-role-sponsor-match.log.json   — for the agent (every value labeled)
//   <out>/data-role-sponsor-match.report.md  — for the person
//   <out>/roles.json, role-scores.json, role-scores.md (scorer input/output)
//
//   node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs \
//     [--input candidates.json] [--out-dir dir] [--csv f] [--bls f] [--formd-dir d]
//
// Exit codes: 0 ran · 2 usage/bad input/out-dir refused · 3 blocked at the
// visa-timeline gate (nothing scored) · 4 scorer failed or disagreed with the
// profile's sponsorship need.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SRC, v, parseCsv, indexCompanies, lookupCompany, compilePatterns, sponsorshipEvidence,
  timelineGate, parseLivenessLog, livenessGate, socForTitle, roleQuality, normalizeCompany, nextAction, outDirAllowed,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const RECIPE = 'recipes/cases/2026fa/kommurisi-data-role-sponsor-match.md';
const VERSION = '0.1.0';
const SCORER = path.join(ROOT, 'scripts/score/role-scorer.mjs');
const DEFAULTS = {
  input: path.join(HERE, 'fixtures/worked-run/candidates.json'),
  outDir: path.join(ROOT, 'course/2026fa/submissions/kommurisi/runs/latest'),
  csv: path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  bls: path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv'),
  formdDir: path.join(ROOT, 'data/sec/form-d/processed/sample'),
};
const OWN_OUT = [
  path.join(ROOT, 'course/2026fa/submissions/kommurisi'),
  path.join(HERE, 'out'),
];

const rel = (p) => {
  const r = path.relative(ROOT, p);
  return (r.startsWith('..') || path.isAbsolute(r) ? p : r).split(path.sep).join('/');
};
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const die = (code, msg) => { console.error(`✗ ${msg}`); process.exit(code); };
// realpath of the nearest existing ancestor + the not-yet-created tail
// (resolves Windows 8.3 short names like SUHASK~1 before comparing).
const real = (p) => {
  let head = path.resolve(p); const tail = [];
  while (!fs.existsSync(head)) { tail.unshift(path.basename(head)); head = path.dirname(head); }
  return path.join(fs.realpathSync.native(head), ...tail);
};

function args() {
  const a = process.argv.slice(2);
  const get = (k, def) => { const i = a.indexOf(k); return i >= 0 ? path.resolve(a[i + 1]) : def; };
  return {
    input: get('--input', DEFAULTS.input), outDir: get('--out-dir', DEFAULTS.outDir),
    csv: get('--csv', DEFAULTS.csv), bls: get('--bls', DEFAULTS.bls), formdDir: get('--formd-dir', DEFAULTS.formdDir),
  };
}

function loadFormD(dir) {
  const idx = new Map(); const files = [];
  if (!fs.existsSync(dir)) return { idx, files, missing: true };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    files.push({ file: rel(path.join(dir, f)), sampled: j.companies?.length ?? 0, of: j.metadata?.total_companies ?? null });
    for (const c of j.companies || []) {
      const k = normalizeCompany(c.company?.name);
      if (k) (idx.get(k) || idx.set(k, []).get(k)).push({ file: f, date_filed: c.filing?.date_filed, total_offering_amount: c.funding?.total_offering_amount });
    }
  }
  return { idx, files, missing: false };
}

function main() {
  const A = args();
  for (const [k, p] of Object.entries({ input: A.input, csv: A.csv, bls: A.bls }))
    if (!fs.existsSync(p)) die(2, `--${k} not found: ${p}`);
  if (!outDirAllowed(real(A.outDir), real(ROOT), OWN_OUT.map(real), real(os.tmpdir())))
    die(2, `refusing to write outside my namespace: ${A.outDir}`);
  fs.mkdirSync(A.outDir, { recursive: true });
  // clear this recipe's previous outputs so a stale role-scores.json can never sit beside a new report
  for (const f of ['roles.json', 'scorer-profile.json', 'role-scores.json', 'role-scores.md', 'data-role-sponsor-match.log.json', 'data-role-sponsor-match.report.md'])
    fs.rmSync(path.join(A.outDir, f), { force: true });

  const cand = JSON.parse(fs.readFileSync(A.input, 'utf8'));
  const P = cand.profile || die(2, 'input has no "profile"');
  const roles = Array.isArray(cand.roles) ? cand.roles : die(2, 'input has no "roles" array');
  const evDir = path.dirname(A.input);
  const evPath = (k) => (cand.evidence?.[k] ? path.resolve(evDir, cand.evidence[k]) : null);
  const livePath = evPath('liveness_log'), ghPath = evPath('greenhouse_api');
  const pwMap = livePath && fs.existsSync(livePath) ? parseLivenessLog(fs.readFileSync(livePath, 'utf8')) : new Map();
  const ghMap = ghPath && fs.existsSync(ghPath) ? JSON.parse(fs.readFileSync(ghPath, 'utf8')).checks || {} : {};

  const include = compilePatterns(P.data_title_include), exclude = compilePatterns(P.data_title_exclude);
  if (!include.length) die(2, 'profile.data_title_include is empty — nothing could ever match');

  const inputs = [A.input, A.csv, A.bls, livePath, ghPath].filter((p) => p && fs.existsSync(p))
    .map((p) => ({ path: rel(p), sha256: sha(p) }));
  const log = {
    recipe: RECIPE, recipe_version: VERSION, mode: 'sample', as_of: v(P.as_of, SRC.input),
    labels: 'record = read from a repo data file or a saved script/API observation · your-input = my assumption, threshold, or self-rating · model-judgment = not used by this prototype (no model is called)',
    inputs, profile: {}, timeline_gate: null, roles: [], scorer: null, summary: null,
  };
  for (const k of ['situation', 'needs_sponsorship', 'opt_start_date', 'opt_end_date', 'unemployment_days_used', 'unemployment_ceiling_days', 'hiring_lag_days', 'sponsorship_p_by_tier'])
    log.profile[k] = v(P[k] ?? null, SRC.input);
  const outJson = path.join(A.outDir, 'data-role-sponsor-match.log.json');
  const outMd = path.join(A.outDir, 'data-role-sponsor-match.report.md');

  // ── GATE: visa timeline (profile-level) ─────────────────────────────────
  const tl = timelineGate(P);
  log.timeline_gate = tl.ok
    ? { status: 'open', runway_days: v(tl.runway_days, SRC.input), hiring_lag_days: v(tl.hiring_lag_days, SRC.input), factor: v(tl.factor, SRC.input) }
    : { status: 'blocked', reason: tl.reason, detail: tl.detail };
  if (!tl.ok) {
    log.summary = { status: 'blocked', reason: tl.reason, scored: 0, note: 'Nothing was scored. No value was invented to get past the gate.' };
    fs.writeFileSync(outJson, JSON.stringify(log, null, 2));
    fs.writeFileSync(outMd, `# data-role-sponsor-match — BLOCKED\n\nAs of ${P.as_of}: **${tl.reason}** — ${tl.detail}.\n\nNo role was scored. A human must correct the profile dates (or accept that the OPT window is closed) before this recipe runs.\n`);
    console.error(`✗ blocked at timeline gate: ${tl.reason} — ${tl.detail}`);
    console.error(`  wrote ${rel(outJson)} + ${rel(outMd)} (no roles.json, scorer not run)`);
    process.exit(3);
  }

  // ── per-role evidence ───────────────────────────────────────────────────
  const csvRows = parseCsv(fs.readFileSync(A.csv, 'utf8'));
  const cIdx = indexCompanies(csvRows);
  const blsIdx = new Map(parseCsv(fs.readFileSync(A.bls, 'utf8')).map((r) => [r.onet_soc_code, r]));
  const fd = loadFormD(A.formdDir);
  const pTier = P.sponsorship_p_by_tier || {};
  const csvRel = rel(A.csv), blsRel = rel(A.bls);
  const scorable = [];

  for (const r of roles) {
    const e = { role_id: r.role_id, company: v(r.company, SRC.input), title: v(r.title, SRC.input), url: v(r.url ?? null, SRC.input), status: 'scored', unresolved: [], evidence: {} };
    // company → CSV row
    const m = lookupCompany(cIdx, r.company, r.csv_company_name);
    if (!m.ok) {
      e.unresolved.push({ reason: m.reason, detail: m.detail, candidates: m.candidates });
    } else {
      e.evidence.company_match = v(m.row.company_name, SRC.record, { provenance: `${csvRel}:${m.row._line}`, resolved_by: m.resolvedBy === 'csv_company_name' ? `${SRC.input} (csv_company_name)` : 'exact normalized name' });
      const s = sponsorshipEvidence(m.row, include, exclude);
      if (!s.ok) e.unresolved.push({ reason: s.reason, detail: `${m.row.company_name}: Total Approvals blank at ${csvRel}:${m.row._line} — not evidence of refusal` });
      else {
        const prov = `${csvRel}:${m.row._line}`;
        const p = pTier[s.tier];
        e.evidence.sponsorship = {
          total_approvals: v(s.total_approvals, SRC.record, { provenance: prov, note: 'company-wide, all roles' }),
          approval_rate: v(s.approval_rate, SRC.record, { provenance: prov }),
          sponsored_titles: v(s.sponsored_titles, SRC.record, { provenance: prov, note: 'top titles only — truncated list' }),
          matched_data_titles: v(s.matched_titles, SRC.input, { note: 'record titles filtered by MY include/exclude patterns' }),
          tier: v(s.tier, SRC.input, { rule: 'Proven = ≥1 sponsored title matches a data pattern; Likely = sponsors, no data title in the recorded top titles' }),
          p: v(p ?? null, SRC.input, { note: 'my calibration of the tier (Ch.11 example values), not a measured probability' }),
        };
        if (p == null) e.unresolved.push({ reason: 'no-p-for-tier', detail: `profile.sponsorship_p_by_tier has no value for "${s.tier}"` });
      }
      // context outside the scorer: H-1B median salary + funding
      const med = Number(m.row.median_salary_offered);
      e.evidence.h1b_median_salary_all_roles = v(Number.isFinite(med) && m.row.median_salary_offered.trim() ? med : null, SRC.record, { provenance: `${csvRel}:${m.row._line}`, note: 'median across ALL sponsored roles at the company, not this role' });
      e.evidence.funding_80days = v({ latest_funding_date: m.row.latest_funding_date || null, latest_funding_stage: m.row.latest_funding_stage || null }, SRC.record, { provenance: `${csvRel}:${m.row._line}` });
    }
    const fdHits = fd.idx.get(normalizeCompany(r.company)) || [];
    e.evidence.form_d_sample = fdHits.length
      ? v(fdHits, SRC.record)
      : v(null, SRC.record, { reason: fd.missing ? 'form-d-sample-dir-missing' : 'not-in-sample', note: 'samples hold only the first 50 companies per quarter (Fact 3) — absence means nothing' });

    // liveness gate
    const lg = livenessGate(r, pwMap, ghMap);
    e.evidence.liveness_observations = v(lg.obs, SRC.record, { provenance: [livePath && rel(livePath), ghPath && rel(ghPath)].filter(Boolean) });
    if (!lg.ok) e.unresolved.push({ reason: lg.reason, detail: lg.detail });
    else e.evidence.liveness = v(lg.factor, SRC.record, { basis: lg.basis, conflict: lg.conflict || false });

    // fit: the person's own rating — no model is called
    const fit = Number(r.fit?.p);
    if (Number.isFinite(fit)) e.evidence.fit = v(fit, SRC.input, { note: r.fit.note || '' });
    else e.unresolved.push({ reason: 'fit-missing', detail: 'no self-rated fit supplied; refusing to score on sponsorship alone' });

    // role quality: context only (scorer weight 0.0, Fact 1)
    const soc = socForTitle(r.title, P.title_soc_map);
    const rq = roleQuality(soc, blsIdx);
    e.evidence.role_quality_context = rq.ok
      ? { onet_soc_code: v(rq.onet_soc_code, SRC.input, { note: 'my title→SOC mapping' }), occupation: v(rq.title, SRC.record, { provenance: `${blsRel}:${rq.line}` }), annual_median_wage_national: v(rq.annual_median_wage, SRC.record, { provenance: `${blsRel}:${rq.line}`, oews_year: rq.oews_year }), cognitive_pivot_score: v(rq.cognitive_pivot_score, SRC.record, { provenance: `${blsRel}:${rq.line}`, missing: rq.cognitive_pivot_score == null }), in_scorer: false }
      : { status: rq.reason, onet_soc_code: rq.onet_soc_code ?? null, in_scorer: false };

    if (e.unresolved.length) e.status = 'unresolved';
    else scorable.push({
      role_id: r.role_id, company: r.company, title: r.title,
      sponsorship: { p: e.evidence.sponsorship.p.value, tier: e.evidence.sponsorship.tier.value, source: SRC.input },
      fit: { p: fit, source: SRC.input },
      liveness: { factor: lg.factor, source: SRC.record },
      timeline: { factor: tl.factor, source: SRC.input },
    });
    log.roles.push(e);
  }

  // ── existing scorer ─────────────────────────────────────────────────────
  const rolesPath = path.join(A.outDir, 'roles.json');
  const profPath = path.join(A.outDir, 'scorer-profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify(scorable, null, 2));
  // The maintained scorer only reads `authorization` (regex). Keep the text
  // free of words its regex treats as "no sponsorship needed" — see the guard.
  fs.writeFileSync(profPath, JSON.stringify({ authorization: P.needs_sponsorship ? 'F-1 OPT; needs H-1B' : 'citizen' }, null, 2));
  let scored = { roles: [] };
  if (scorable.length) {
    const run = spawnSync(process.execPath, [SCORER, rolesPath, '--profile', profPath, '--out-dir', A.outDir], { encoding: 'utf8' });
    if (run.status !== 0) die(4, `scorer exited ${run.status}: ${run.stderr}`);
    scored = JSON.parse(fs.readFileSync(path.join(A.outDir, 'role-scores.json'), 'utf8'));
    if (scored.profile_needs_sponsorship !== Boolean(P.needs_sponsorship))
      die(4, `scorer read needs_sponsorship=${scored.profile_needs_sponsorship}, profile says ${P.needs_sponsorship} — refusing to report scores built on the wrong weights`);
    log.scorer = { script: rel(SCORER), output: rel(path.join(A.outDir, 'role-scores.json')), stdout: run.stdout.trim(), weights_used: scored.config?.weights };
  } else log.scorer = { script: rel(SCORER), output: null, note: 'no role passed every gate; scorer not run' };

  const byId = new Map(scored.roles.map((s) => [s.role_id, s]));
  for (const e of log.roles) {
    const s = byId.get(e.role_id);
    e.decision = s ? { composite: s.composite, recommendation: s.recommendation, reason: s.reason, arithmetic: s.trace.arithmetic, source: 'scripts/score/role-scorer.mjs' } : { recommendation: 'Unresolved', reason: e.unresolved.map((u) => u.reason).join(', ') };
    e.next_action = nextAction(s?.recommendation, s ? null : e.decision.reason);
  }
  const count = (k) => log.roles.filter((e) => e.decision.recommendation === k).length;
  log.summary = { status: 'ran', evaluated: log.roles.length, scored: scorable.length, apply: count('Apply'), consider: count('Consider'), skip: count('Skip'), unresolved: count('Unresolved') };

  fs.writeFileSync(outJson, JSON.stringify(log, null, 2));
  fs.writeFileSync(outMd, renderReport(log, P, fd));
  const S = log.summary;
  console.log(`✓ ${S.evaluated} roles → Apply ${S.apply} · Consider ${S.consider} · Skip ${S.skip} · Unresolved ${S.unresolved} (${S.scored ? `scored ${S.scored} via ${rel(SCORER)}` : 'scorer not run: no role passed every gate'})`);
  console.log(`  timeline gate open: runway ${tl.runway_days}d vs lag ${tl.hiring_lag_days}d → factor ${tl.factor} [your-input]`);
  for (const e of log.roles) console.log(`  ${e.decision.recommendation.padEnd(10)} ${e.role_id}${e.decision.composite != null ? ` (${e.decision.composite})` : ''} — ${e.decision.reason}`);
  console.log(`  wrote ${rel(outJson)} + ${rel(outMd)}`);
}

function renderReport(log, P, fd) {
  const o = [];
  const S = log.summary;
  o.push(`# Data-role sponsor match — ${log.as_of.value}`);
  o.push(`\n**For:** ${P.situation}`);
  o.push(`\n**Result:** ${S.evaluated} roles → **Apply ${S.apply} · Consider ${S.consider} · Skip ${S.skip} · Unresolved ${S.unresolved}**. Only ${S.scored} reached the scorer; unresolved roles were *not* scored as zero, they need you first.`);
  o.push(`\n*Mode: sample. Labels — **record**: read from a repo file or a saved observation · **your-input**: my assumption or self-rating · **model-judgment**: none in this run (no model was called).*`);
  o.push('\n## Decisions and next actions\n');
  o.push('| Role | Decision | Composite | Why | Next action |');
  o.push('|---|---|---|---|---|');
  for (const e of log.roles) o.push(`| ${e.company.value} — ${e.title.value} | **${e.decision.recommendation}** | ${e.decision.composite ?? '—'} | ${e.decision.reason} | ${e.next_action} |`);
  o.push('\n## Evidence per role (verified vs. inferred)\n');
  for (const e of log.roles) {
    const ev = e.evidence, sp = ev.sponsorship;
    o.push(`### ${e.company.value} — ${e.title.value}`);
    if (ev.company_match) o.push(`- CSV row: \`${ev.company_match.value}\` at \`${ev.company_match.provenance}\` **[record]**`);
    if (sp) {
      o.push(`- H-1B approvals (company-wide): ${sp.total_approvals.value}, approval rate ${Number(sp.approval_rate.value).toFixed(1)}% **[record]**`);
      o.push(`- Top sponsored titles: ${sp.sponsored_titles.value.map((t) => `"${t}"`).join(', ') || '—'} **[record]**`);
      o.push(`- Data titles among them: ${sp.matched_data_titles.value.map((t) => `"${t}"`).join(', ') || 'none'} → tier **${sp.tier.value}**, p = ${sp.p.value} **[your-input: my patterns + my calibration]**`);
    }
    const lo = ev.liveness_observations.value;
    o.push(`- Liveness: ats:liveness said \`${lo.playwright ?? 'not checked'}\`; Greenhouse API status \`${lo.greenhouse_api_status ?? 'n/a'}\` **[record]**${ev.liveness ? ` → gate factor ${ev.liveness.value} (${ev.liveness.basis}${ev.liveness.conflict ? ' — the page check DISAGREED; the API 404 wins' : ''})` : ''}`);
    if (ev.fit) o.push(`- Fit ${ev.fit.value} **[your-input]** — ${ev.fit.note}`);
    const rq = ev.role_quality_context;
    if (rq.occupation) o.push(`- Role quality (NOT in the score — scorer weight 0.0): ${rq.onet_soc_code.value} ${rq.occupation.value} **[your-input mapping]**; national median $${rq.annual_median_wage_national.value?.toLocaleString('en-US')} (OEWS ${rq.annual_median_wage_national.oews_year}) **[record]**; cognitive-pivot score ${rq.cognitive_pivot_score.value ?? '**missing in source row**'} **[record]**`);
    else o.push(`- Role quality: ${rq.status} — not computed`);
    if (ev.h1b_median_salary_all_roles?.value != null) o.push(`- H-1B median salary offered, all roles at this company: $${Math.round(ev.h1b_median_salary_all_roles.value).toLocaleString('en-US')} **[record]** (not this role's pay)`);
    if (ev.funding_80days) o.push(`- Latest funding in 80 Days CSV: ${ev.funding_80days.value.latest_funding_stage || '—'} on ${ev.funding_80days.value.latest_funding_date || '—'} **[record]**; Form D sample: ${ev.form_d_sample.value ? ev.form_d_sample.value.map((f) => `filed ${f.date_filed}, offering $${Number(f.total_offering_amount).toLocaleString('en-US')} (${f.file})`).join('; ') + ' **[record]**' : ev.form_d_sample.reason} (not a vote in the scorer)`);
    for (const u of e.unresolved) o.push(`- ⚠ **${u.reason}** — ${u.detail}${u.candidates ? ` (candidates: ${u.candidates.map((c) => `${c.company_name}/${c.state}`).join('; ')})` : ''}`);
    o.push('');
  }
  o.push('## Gates — what you (the human) must judge before acting\n');
  o.push(`1. **Visa timeline** — runway ${log.timeline_gate.runway_days.value} days vs assumed hiring lag ${log.timeline_gate.hiring_lag_days.value} days → factor ${log.timeline_gate.factor.value}. Both numbers are your-input. Confirm the OPT dates against your actual EAD card and I-20 before trusting this.`);
  o.push('2. **Liveness** — open each Apply/Consider posting yourself. A Greenhouse 404 closes the gate; an "active" page check alone does not prove the job exists.');
  o.push('3. **Data-role sponsorship** — a "Proven" tier means a data title appears in the recorded top titles. It does not mean *this* role, *this* level, or *this year*. A "Likely" tier means the list is silent, not that the answer is no.');
  o.push('4. **Every Unresolved row** — resolve the named reason or drop the role; do not let it default to Skip or Apply.');
  o.push('\n## What this run cannot verify\n');
  o.push('- Whether the company will sponsor *this* opening now (the CSV is historical, company-level, top-titles-only).');
  o.push('- Whether the title→SOC mapping matches how the employer would file the LCA.');
  o.push('- Hiring lag at this company (one assumed number for all).');
  o.push(`- Funding recency for most companies: Form D samples cover ${fd.files.map((f) => `${f.sampled}/${f.of ?? '?'}`).join(', ')} companies per quarter.`);
  o.push('- Fit — it is a self-rating, not a model or recruiter judgment.');
  o.push(`\nScorer trace: \`role-scores.md\` in this folder (written by \`${log.scorer.script}\`). Agent log: \`data-role-sponsor-match.log.json\`.`);
  return o.join('\n') + '\n';
}

main();
