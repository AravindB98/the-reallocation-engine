#!/usr/bin/env node
// run.mjs — healthins-ai-opt (INFO 7375 Fall 2026), v0.2.0.
//
// For an international MS student (STEM, OPT not yet started) targeting
// applied-AI / LLM engineering roles (SOC 15-1252) at insurance and health
// companies: join each candidate role to the 80 Days CSV (H-1B record) and the
// SEC Form D samples (funding), compute the OPT timeline gate from the
// person's dates, hold back anything unverified, and hand the rest to the
// EXISTING Ch.11 scorer (scripts/score/role-scorer.mjs) via its CLI.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs \
//        [--persona p.json] [--candidates c.json] [--today YYYY-MM-DD] [--out-dir dir]
//        [--csv f] [--formd-dir d] [--bls f]
//
// --candidates is either the v0.1.0 hand-written list (inputs/candidates.example.json)
// or an ingest snapshot (ingest.mjs; real postings, real liveness records).
//
// Writes into --out-dir only (default course/2026fa/submissions/shreyashyadav1/runs/<today>/):
//   roles.json        scorer input (what this script built)
//   role-scores.json  scorer output (written by role-scorer.mjs, untouched)
//   role-scores.md    scorer output (written by role-scorer.mjs, untouched)
//   run-log.json      agent-facing log: every value with its source label
//   report.md         person-facing report: decisions, gates, next actions
//
// No network. Reads only the repo's data/ files and the input JSONs.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SRC, parseCsv, normalizeName, sponsorshipEvidence, fundingEvidence, timelineFactor, timelineSlack,
  livenessGate, validatePersona, parseDate, isoDate, nextAction, TITLE_RULE, TIER_RULE, dataHorizon,
  buildHostIndex, entitySiblings, fitFromTitle, processDaysForBucket, DEFAULT_EXCLUDE_LEVELS, FIT_RULE, POSTING_EXCLUDE, monthsBetween,
} from './lib.mjs';

const RECIPE_VERSION = '0.2.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(ROOT, p) || '.';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

function fail(msg, outDir, extra = {}) {
  console.error(`✗ ${msg}`);
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify({ recipe: 'healthins-ai-opt', recipe_version: RECIPE_VERSION, status: 'failed', error: msg, ...extra, roles: [] }, null, 2) + '\n');
    console.error(`  wrote failure log: ${rel(path.join(outDir, 'run-log.json'))} (no scores were produced)`);
  }
  process.exit(2);
}

function readJson(p, what) {
  if (!fs.existsSync(p)) fail(`${what} not found: ${rel(p)}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`${what} is not valid JSON: ${rel(p)} (${e.message})`); }
}

function loadFormD(dir) {
  const idx = new Map();
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  let companies = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of d.companies || []) {
      companies++;
      const key = normalizeName(c.company?.name);
      const hit = { name: c.company?.name, date_filed: c.filing?.date_filed, file: rel(p) };
      const prev = idx.get(key);
      if (!prev || (parseDate(hit.date_filed) || 0) > (parseDate(prev.date_filed) || 0)) idx.set(key, hit);
    }
  }
  return { idx, files: files.map((f) => rel(path.join(dir, f))), companies };
}

const isRecordSource = (s) => typeof s === 'string' && s.startsWith('ats-provider:');

function main() {
  const today = parseDate(arg('today', isoDate(new Date())));
  if (!today) fail('--today must be YYYY-MM-DD');
  const outDir = path.resolve(arg('out-dir', path.join(ROOT, 'course/2026fa/submissions/shreyashyadav1/runs', isoDate(today))));
  const personaPath = path.resolve(arg('persona', path.join(HERE, 'inputs/persona.example.json')));
  const candPath = path.resolve(arg('candidates', path.join(HERE, 'inputs/candidates.example.json')));
  const csvPath = path.resolve(arg('csv', path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv')));
  const formDDir = path.resolve(arg('formd-dir', path.join(ROOT, 'data/sec/form-d/processed/sample')));
  const blsPath = path.resolve(arg('bls', path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv')));
  const scorer = path.join(ROOT, 'scripts/score/role-scorer.mjs');

  // never write over a tracked repo file: out-dir must be inside our own namespaces or outside the repo
  const relOut = path.relative(ROOT, outDir);
  const foreignRepoPath = !relOut.startsWith('..') && !path.isAbsolute(relOut) &&
    !/^(course\/2026fa\/submissions\/shreyashyadav1|assignments\/submissions\/shreyashyadav1|scripts\/contrib\/2026fa\/shreyashyadav1-healthins-ai-opt|output)(\/|$)/.test(relOut); // output/ is the repo's gitignored scratch folder
  if (foreignRepoPath) fail(`--out-dir ${relOut} is inside the repo but outside this contribution's namespaces; refusing to write there`);

  const persona = readJson(personaPath, 'persona');
  const candidates = readJson(candPath, 'candidates');
  const errs = validatePersona(persona, today);
  if (errs.length) fail(`persona dates/limits unusable — timeline gate cannot be computed:\n  - ${errs.join('\n  - ')}`, outDir, { persona_file: rel(personaPath), today: isoDate(today), errors: errs });

  if (!fs.existsSync(csvPath)) fail(`80 Days CSV not found: ${rel(csvPath)}`, outDir);
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvText);
  const csvRel = rel(csvPath);
  const byName = new Map();
  for (const r of rows) {
    const k = normalizeName(r.company_name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(r);
  }
  const hostIndex = buildHostIndex(rows);
  const horizon = dataHorizon(rows);
  const withApprovals = rows.filter((r) => r['Total Approvals'] !== '');
  const evenA = withApprovals.filter((r) => Number(r['Total Approvals']) % 2 === 0).length;
  const evenD = withApprovals.filter((r) => r['Total Denials'] !== '' && Number(r['Total Denials']) % 2 === 0).length;

  // a missing sample directory would otherwise print "0 of N" hits, which reads as "looked and found none"
  if (!fs.existsSync(formDDir) || !fs.readdirSync(formDDir).some((f) => f.endsWith('.json'))) fail(`Form D sample directory not found or holds no .json file: ${rel(formDDir)}`, outDir);
  const formD = loadFormD(formDDir);

  // role quality context (NOT a vote — scorer weight is 0.0 [VERIFY])
  let roleQuality = { status: 'missing', reason: 'bls-file-not-found' };
  if (fs.existsSync(blsPath)) {
    const bls = parseCsv(fs.readFileSync(blsPath, 'utf8')).find((r) => r.bls_soc_code === persona.target_soc);
    roleQuality = bls
      ? { status: 'ok', soc: persona.target_soc, title: bls.title, annual_median_wage: Number(bls.annual_median_wage) || null,
          oews_year: bls.oews_year, employment: Number(bls.employment) || null, source: SRC.record, file: rel(blsPath),
          used_in_score: false, why_not: 'role-scorer.mjs weights.role_quality = 0.0 [VERIFY]; national OEWS median is context only (fact 1)' }
      : { status: 'missing', reason: 'no-occupation-row', soc: persona.target_soc, file: rel(blsPath) };
  }

  const recentMonths = persona.funding_recent_months ?? 18;
  const maxAge = persona.liveness_max_age_days ?? 7;
  const visa = persona.visa;
  const snap = candidates._meta?.snapshot === true;
  const boardByName = new Map((candidates.boards || []).map((b) => [b.name, b]));
  const slack = timelineSlack(visa, today);
  const built = [];
  const toScore = [];

  for (const c of candidates.roles || []) {
    const common = {
      role_id: c.role_id, company: c.company, title: c.title,
      posting: { url: c.posting_url || null, source: isRecordSource(c.source) ? SRC.record : SRC.input, from: c.source || null, hypothetical: c.hypothetical === true },
      // `source` labels the location text; `class` (us / non-us / ambiguous) comes from the author's word list in lib.mjs, not from a record
      location: c.location != null ? { value: c.location, class: c.location_class || null, source: isRecordSource(c.source) ? SRC.record : SRC.input, class_source: SRC.input } : null,
      level: c.level ?? null,
    };

    // posting text states a citizenship / clearance / U.S.-person requirement → never scored.
    // (ingest already excludes these; checked again here so a hand-edited snapshot cannot slip one through)
    const preExcluded = c.pre_excluded || (c.jd_screen?.requirement_found
      ? { stage: 'posting-screen', reason: 'the posting states a citizenship, clearance or U.S.-person requirement (quoted in jd_screen)' } : null);
    if (preExcluded) {
      built.push({
        ...common, jd_screen: c.jd_screen || null, excluded: preExcluded, blocked: null,
        decision: { recommendation: 'Excluded', composite: null, stage: preExcluded.stage, reason: `excluded before scoring (${preExcluded.stage}): ${preExcluded.reason}`,
          source: preExcluded.stage === 'posting-screen' ? 'jd-screen.mjs phrase match (record) under the exclusion rule (your-input)' : 'pre-scorer filter (your-input rule)' },
        next_action: nextAction({ excluded: preExcluded.stage === 'posting-screen' ? 'the posting requires something an F-1/OPT student cannot have' : preExcluded.reason }),
      });
      continue;
    }

    const key = normalizeName(c.csv_company || c.company);
    const matches = byName.get(key) || [];
    const csvRow = matches.length === 1 ? matches[0] : null;
    const spons = matches.length > 1
      ? { status: 'missing', reason: 'entity-ambiguous', tier: null, p: null, note: `${matches.length} CSV rows normalise to the same name` }
      : sponsorshipEvidence(csvRow, csvRel);
    const sib = csvRow ? entitySiblings(csvRow, hostIndex) : null;
    const fund = fundingEvidence(csvRow, csvRel, formD.idx.get(key), today, recentMonths, horizon);
    const live = livenessGate(c.liveness, today, maxAge);

    const bucketDays = Number.isInteger(c.process_days_estimate) ? null : processDaysForBucket(persona, c.bucket);
    const processDays = Number.isInteger(c.process_days_estimate) ? c.process_days_estimate : bucketDays?.days;
    const time = timelineFactor(visa, processDays, today);

    let fit = null;
    if (typeof c.fit === 'number' && c.fit >= 0 && c.fit <= 1) fit = { p: c.fit, source: SRC.input };
    else if (persona.fit_rule !== 'off') {
      const f = fitFromTitle(c.title);
      if (f) fit = { p: f.p, source: SRC.input, rule: f.rule, why: f.why };
    }

    const unscreened = snap && candidates._meta.screened === true && !c.jd_screen;
    const blocked = [
      spons.status === 'missing' ? spons.reason : null,
      sib?.has_approvals ? 'entity-sibling-has-approvals' : null,
      unscreened ? 'posting-unscreened' : null,
      c.jd_screen?.status === 'missing' ? 'posting-text-missing' : null,
      live.status === 'missing' ? live.reason : null,
      time.status === 'missing' ? time.reason : null,
    ].filter(Boolean);

    const entry = {
      ...common,
      industry: csvRow ? { value: csvRow.industry, source: SRC.record, file: csvRel } : null,
      in_target_sector: csvRow ? { value: (persona.sector_industries || []).includes(csvRow.industry), source: SRC.input, basis: 'record industry checked against your-input sector list' } : null,
      sponsorship: spons, entity_siblings: sib, board_corroboration: boardByName.get(c.company)?.entity?.corroboration || null, funding: fund, liveness: live, timeline: time,
      jd_screen: c.jd_screen || null,
      fit: fit || { p: null, source: SRC.input, note: 'no fit given — fit vote omitted, not invented' },
      process_days_estimate: { value: processDays ?? null, source: SRC.input, basis: bucketDays?.basis || c.process_basis || null },
      e_verify: { status: 'unverified', posting_mentions: c.jd_screen?.e_verify_mentioned || null,
        note: 'STEM OPT requires an E-Verify employer. A mention in the posting is a record of what the posting says, not of enrolment; no E-Verify list in this repo [TODO: DATA SOURCE]' },
      blocked: blocked.length ? blocked : null,
    };
    built.push(entry);

    if (!blocked.length) {
      // p comes from the author's tier rule, not from a record, so the scorer sees
      // it as your-input; the record values the rule read travel with it.
      const derivedFrom = { source: SRC.record, file: csvRel, total_approvals: spons.inputs.total_approvals.value,
        approval_rate: spons.inputs.approval_rate.value, titles_matching_rule: spons.inputs.titles_matching_15_1252_rule.value };
      const sponsorshipTerm = spons.p != null
        ? { p: spons.p, tier: spons.tier, source: SRC.input, derived_from: derivedFrom }
        : { tier: spons.tier, source: SRC.input, derived_from: derivedFrom }; // Unknown: no p → the vote is omitted, not set to 0
      const role = {
        role_id: c.role_id, company: c.company, title: c.title,
        sponsorship: sponsorshipTerm,
        liveness: { factor: live.factor, source: live.source },
        timeline: { factor: time.factor, source: SRC.input },
      };
      if (fit) role.fit = { p: fit.p, source: fit.source };
      toScore.push(role);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const rolesPath = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(toScore, null, 2) + '\n');

  let scored = { roles: [] };
  let scorerStdout = '(no roles passed the evidence gates — scorer not run)';
  if (toScore.length) {
    scorerStdout = execFileSync(process.execPath, [scorer, rolesPath, '--out-dir', outDir], { cwd: ROOT, encoding: 'utf8' }).trim();
    scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
  }
  // The scorer lets sponsorship alone clear its Apply bar (Proven: 0.9 × 0.35 = 0.315 ≥ 0.30), so fit can never veto an
  // Apply. A persona-set floor downgrades such an Apply to Consider through the scorer's OWN documented override field
  // (Ch.11: "override with a documented reason"), so every artifact says the same thing and role-scores.json keeps
  // machine_recommendation beside it. The scorer file is not touched.
  const scorerRuns = [scorerStdout];
  const fitFloor = typeof persona.apply_fit_floor === 'number' ? persona.apply_fit_floor : null;
  if (fitFloor != null && toScore.length) {
    let downgraded = 0;
    for (const s of scored.roles) {
      if (s.recommendation !== 'Apply') continue;
      const role = toScore.find((r) => r.role_id === s.role_id);
      const fitP = role?.fit?.p ?? 0;
      if (fitP >= fitFloor) continue;
      const sp = s.trace.votes.find((v) => v.factor === 'sponsorship');
      const alone = sp && sp.contribution >= scored.config.apply_threshold ? `; the scorer's Apply came from sponsorship alone (${sp.contribution} ≥ ${scored.config.apply_threshold})` : '';
      role.override = { decision: 'Consider', reason: `fit ${fitP} is below your Apply floor ${fitFloor} (persona.apply_fit_floor, your-input)${alone}` };
      downgraded++;
    }
    if (downgraded) {
      fs.writeFileSync(rolesPath, JSON.stringify(toScore, null, 2) + '\n');
      scorerStdout = execFileSync(process.execPath, [scorer, rolesPath, '--out-dir', outDir], { cwd: ROOT, encoding: 'utf8' }).trim();
      scorerRuns.push(scorerStdout);
      scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
    }
  }
  const byId = new Map(scored.roles.map((r) => [r.role_id, r]));
  // how much of what the scorer multiplied was actually a record
  const terms = scored.roles.flatMap((s) => [...s.trace.votes, ...s.trace.gates]);
  const recordTerms = terms.filter((t) => t.source === SRC.record);
  const gateZero = scored.config?.gate_zero ?? 0.05;

  for (const e of built) {
    if (e.excluded) continue;
    const s = byId.get(e.role_id);
    const gateClosed = s?.trace?.gates?.find((g) => g.multiplier <= gateZero)?.factor || null;
    e.decision = s
      ? { recommendation: s.recommendation, composite: s.composite,
          reason: s.override?.decision ? `held at ${s.recommendation}: the scorer said ${s.machine_recommendation} (${s.reason}); ${s.override.reason}` : s.reason,
          arithmetic: s.trace.arithmetic, machine_recommendation: s.machine_recommendation, override: s.override || null,
          source: s.override ? 'scripts/score/role-scorer.mjs, downgraded by its own override field from persona.apply_fit_floor (your-input)' : 'scripts/score/role-scorer.mjs' }
      : { recommendation: 'BLOCKED', composite: null, reason: `not scored: ${e.blocked.join(', ')}` };
    e.next_action = nextAction({ blocked: e.blocked?.join(', '), recommendation: s?.recommendation, gateClosed, tier: e.sponsorship.tier, fundingRecency: e.funding.recency });
    e.flags = flagsFor(e, s, scored.config);
  }

  // networking list: in-sector sponsors with recent funding that are NOT on the candidate list
  const candKeys = new Set(built.map((b) => normalizeName(b.company)));
  const states = new Set(persona.preferred_states || []);
  const network = rows
    .filter((r) => (persona.sector_industries || []).includes(r.industry) && !candKeys.has(normalizeName(r.company_name)))
    .filter((r) => !states.size || states.has(r.state))
    .map((r) => ({ r, s: sponsorshipEvidence(r, csvRel), f: fundingEvidence(r, csvRel, formD.idx.get(normalizeName(r.company_name)), today, recentMonths, horizon) }))
    .filter((x) => (x.s.tier === 'Proven' || x.s.tier === 'Likely') && x.f.recency === 'recent')
    .sort((a, b) => (a.f.csv?.months_since ?? 999) - (b.f.csv?.months_since ?? 999))
    .slice(0, persona.network_list_size ?? 8)
    .map((x) => ({ company: x.r.company_name, industry: x.r.industry, state: x.r.state,
      latest_funding: `${x.r.latest_funding_stage || '?'} ${x.r.latest_funding_date}`, source: SRC.record, file: csvRel,
      months_since_funding: { value: x.f.csv?.months_since ?? null, source: SRC.input },
      tier: { value: x.s.tier, source: SRC.input }, matched_titles: { value: x.s.inputs.titles_matching_15_1252_rule.value, source: SRC.input } }));

  const gated = built.filter((b) => !b.excluded);
  const matched = gated.filter((b) => b.industry).length;
  const formDHits = gated.filter((b) => b.funding.form_d_sample).length;
  const count = (k) => built.filter((b) => b.decision.recommendation === k).length;
  const excludedBy = {};
  for (const b of built.filter((x) => x.excluded)) excludedBy[b.excluded.stage] = (excludedBy[b.excluded.stage] || 0) + 1;
  const blockedReasons = {};
  for (const b of gated.filter((x) => x.blocked)) for (const r of b.blocked) { const k = r.split(':')[0]; blockedReasons[k] = (blockedReasons[k] || 0) + 1; }

  const log = {
    recipe: 'healthins-ai-opt', recipe_version: RECIPE_VERSION, status: 'ok', today: isoDate(today),
    inputs: { persona: rel(personaPath), candidates: rel(candPath), csv: csvRel, form_d_samples: formD.files, bls: rel(blsPath) },
    data_mode: snap
      ? `real boards: ingest snapshot fetched ${candidates._meta.fetched_on}; full 80 Days CSV; Form D is the shipped 50-company-per-quarter sample only (fact 3)`
      : 'sample — hand-written candidate list; Form D is the shipped 50-company-per-quarter sample only (fact 3); 80 Days CSV is the full shipped file',
    data_horizon: horizon ? { date: isoDate(horizon), months_before_today: monthsBetween(horizon, today), source: SRC.record, file: csvRel,
      note: 'newest latest_funding_date in the CSV; nothing later is visible, so older dates mean "not recent in the dataset", never "stale"' } : null,
    snapshot: snap ? candidates._meta : null,
    funnel: candidates.funnel || null,
    boards: candidates.boards || null,
    rules: { title_rule: { include: String(TITLE_RULE.include), exclude: String(TITLE_RULE.exclude), source: SRC.input },
      posting_exclude: { value: String(POSTING_EXCLUDE), source: SRC.input },
      exclude_levels: { value: persona.exclude_levels ?? DEFAULT_EXCLUDE_LEVELS, source: SRC.input },
      tier_rule: { ...TIER_RULE, source: SRC.input }, funding_recent_months: { value: recentMonths, source: SRC.input },
      fit_rule: { mode: persona.fit_rule ?? 'title', table: FIT_RULE.map((r) => ({ pattern: String(r.re), p: r.p, why: r.why })), source: SRC.input },
      apply_fit_floor: { value: fitFloor, source: SRC.input, why: 'the scorer lets sponsorship alone clear its Apply bar; an Apply below this fit is downgraded to Consider via the scorer\'s override field' },
      process_days_by_bucket: { value: persona.process_days_by_bucket ?? null, basis: persona.process_days_source ?? null, source: SRC.input },
      liveness_max_age_days: { value: maxAge, source: SRC.input },
      timeline_formula: 'factor = 1 if u ≤ ceiling−buffer; (ceiling−u)/buffer inside buffer; 0 if u ≥ ceiling or start > auth_end — your-input, proposed' },
    coverage: {
      candidates: built.length, entity_matched_in_csv: `${matched}/${gated.length}`,
      form_d_sample_hits: `${formDHits}/${matched}`, form_d_sample_companies_scanned: formD.companies,
      excluded_before_scoring: built.length - gated.length, excluded_by_stage: excludedBy,
      scored: toScore.length, blocked: gated.length - toScore.length, blocked_reasons: blockedReasons,
      scorer_terms_labeled_record: `${recordTerms.length}/${terms.length}`,
      scorer_record_terms_are: [...new Set(recordTerms.map((t) => t.factor))],
    },
    labels: 'Evidence values carry source = record | your-input | model-judgment (none here: no model is called). ' +
      'A value computed from labeled inputs is labeled your-input when any input or rule is the person\'s (months_since uses --today). ' +
      'coverage, summary and decision are outputs of this run and the scorer, not evidence.',
    data_quality: {
      source: SRC.record, method: 'parity count over every CSV row with an approval record',
      approval_counts_even: `${evenA}/${withApprovals.length}`, denial_counts_even: `${evenD}/${withApprovals.length}`,
      note: evenA === withApprovals.length && withApprovals.length > 0
        ? 'Every approval and denial count in the CSV is even — consistent with a 2× duplication in the upstream join. Raw counts are used only against thresholds; absolute counts are not quoted as facts.'
        : 'parity check did not flag a systematic pattern',
    },
    persona_visa: { ...visa, source: SRC.input },
    timeline_slack: slack,
    role_quality_context: roleQuality,
    scorer: { path: rel(scorer), invoked_as: `node ${rel(scorer)} ${rel(rolesPath)} --out-dir ${rel(outDir)}`, invocations: scorerRuns.length, stdout: scorerStdout, stdout_first_pass: scorerRuns.length > 1 ? scorerRuns[0] : null,
      profile_passed: false, needs_sponsorship_default: true, gate_zero_from_scorer_output: scored.config?.gate_zero ?? null,
      gate_zero_used_for_slack: slack.gate_zero, gate_zero_drift: scored.config?.gate_zero != null && scored.config.gate_zero !== slack.gate_zero },
    summary: { Apply: count('Apply'), Consider: count('Consider'), Skip: count('Skip'), BLOCKED: count('BLOCKED'), Excluded: count('Excluded') },
    roles: built,
    network_targets: network,
  };
  fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(log));

  console.log(`healthins-ai-opt ${RECIPE_VERSION} · today ${isoDate(today)} · ${built.length} roles in the candidate file (${built.length - gated.length} excluded before scoring)`);
  console.log(`  entity matched ${matched}/${gated.length} · Form D sample hits ${formDHits}/${matched} · blocked ${gated.length - toScore.length} · scorer terms that are records ${recordTerms.length}/${terms.length}`);
  console.log(`  scorer: ${scorerStdout.split('\n')[0]}`);
  console.log(`  → Apply ${count('Apply')} · Consider ${count('Consider')} · Skip ${count('Skip')} · BLOCKED ${count('BLOCKED')} · Excluded ${count('Excluded')}`);
  for (const b of built.filter((x) => !x.excluded)) {
    const d = b.decision;
    console.log(`  ${d.recommendation.padEnd(8)} ${String(d.composite ?? '—').padEnd(6)} ${b.company} — ${b.title}  [${b.next_action.block}]`);
  }
  console.log(`  wrote ${rel(path.join(outDir, 'run-log.json'))} + ${rel(path.join(outDir, 'report.md'))}`);
}

// What the posting or the scorer says that a person should read before acting. Shown, never a gate.
function flagsFor(e, s, cfg) {
  const f = [];
  if (e.location?.class === 'ambiguous') f.push(`location unclear ("${e.location.value || 'blank'}"): read the posting`);
  if (e.entity_siblings?.siblings?.length && !e.entity_siblings.has_approvals) f.push(`same website as ${e.entity_siblings.siblings.map((x) => x.company_name).join(', ')} (no approvals there)`);
  const bc = e.board_corroboration;
  if (bc?.status === 'mismatch') f.push(`board "${bc.slug}" does not match the CSV website ${bc.host}: confirm this board belongs to that company`);
  const js = e.jd_screen;
  if (js?.status === 'screened') {
    if (js.min_years_experience.found) f.push(`asks ${js.min_years_experience.value}+ years${js.min_years_experience.upper ? ` (range up to ${js.min_years_experience.upper})` : ''}`);
    if (js.invites_new_grads?.found) f.push('posting invites new grads');
    if (js.no_sponsorship_statement.found) f.push('no-sponsorship wording in the posting');
    if (js.e_verify_mentioned.found) f.push(js.e_verify_mentioned.negated ? 'E-Verify mentioned negatively' : 'E-Verify mentioned');
  }
  const sp = s?.trace?.votes?.find((v) => v.factor === 'sponsorship');
  if (s?.override?.decision) f.push(`scorer said ${s.machine_recommendation}; held at ${s.recommendation}: ${s.override.reason}`);
  else if (s?.recommendation === 'Apply' && sp && sp.contribution >= (cfg?.apply_threshold ?? 0.3)) f.push('Apply holds even at fit 0: sponsorship alone clears the bar');
  return f;
}

const f3 = (x) => (x == null ? '—' : Number(x).toFixed(3));
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ');

function renderReport(log) {
  const o = [];
  const v = log.persona_visa;
  const sl = log.timeline_slack;
  const fn = log.funnel;
  const gated = log.roles.filter((r) => !r.excluded);
  const excluded = log.roles.filter((r) => r.excluded);
  const sm = log.summary;
  o.push(`# Health/insurance applied-AI roles — OPT-gated triage (${log.today})`, '');
  o.push('## Executive summary', '');
  if (fn) {
    o.push(`This run looked at ${fn.boards} public job boards (${fn.boards_failed} failed to load) holding ${fn.offers_found} open offers. ` +
      `${fn.software_type} are software-type titles, but ${fn.software_type_on_entity_blocked_boards} of those sit at ${fn.boards_entity_blocked} companies the sponsorship data cannot identify, so they were not scored. ` +
      `Of the rest, ${fn.level_excluded} ask for a seniority this student does not have and ${fn.non_us_location} are outside the U.S.; of the postings read, ${fn.posting_screen_excluded} state a citizenship, clearance or U.S.-person requirement and ${fn.experience_excluded ?? 0} ask for more years of experience than this student has. ` +
      `${fn.liveness_checked} postings were opened in a browser to see whether they are still live (${fn.liveness_active} active, ${fn.liveness_expired} expired, ${fn.liveness_uncertain} unclear). ` +
      `**Result: Apply ${sm.Apply} · Consider ${sm.Consider} · Skip ${sm.Skip} · BLOCKED ${sm.BLOCKED} · excluded before scoring ${sm.Excluded}.**`, '');
  } else {
    o.push(`${log.coverage.candidates} candidate roles checked. **Apply ${sm.Apply} · Consider ${sm.Consider} · Skip ${sm.Skip} · BLOCKED ${sm.BLOCKED}.**`, '');
  }
  const held = log.roles.filter((r) => !r.excluded && r.decision.override?.decision);
  if (held.length) o.push(`${held.length} role${held.length === 1 ? '' : 's'} the scorer would call Apply ${held.length === 1 ? 'was' : 'were'} held at Consider: sponsorship alone cleared the scorer's bar, but the fit is below your Apply floor of ${log.rules.apply_fit_floor.value}. Both recommendations are shown.`, '');
  o.push('Roles marked BLOCKED were never scored, because something a person has to check is missing: a company the data cannot identify, a posting nobody could read or open, or evidence that is too old. ' +
    'Sponsorship history comes from a data file of company records, turned into a tier by a rule the author chose, so read the tier as a judgment, not a fact. The timeline check uses your own work-authorization dates. ' +
    'Whether a posting is still open was read by the repository\'s own browser checker on the day of the run. Funding is shown for context only, because the repository\'s scoring script has no funding input. No language model was used.', '');
  o.push('> Planning aid, not legal advice. STEM OPT eligibility, E-Verify status and unemployment-day counts are confirmed with your DSO, not by this report.', '');
  o.push('## Your clock (your-input)', '');
  o.push(`EAD start ${v.ead_start_date} · authorization end ${v.auth_end_date || '(EAD start + 364 days)'} · unemployment used ${v.unemployment_days_used}/${v.unemployment_ceiling} · buffer target ${v.buffer_target_days} days · STEM extension planned: ${v.stem_extension_planned ? 'yes (ceiling stays 90 until it is approved)' : 'no'}.`, '');
  if (sl?.buffer_narrows_at_days != null) {
    o.push(`**Break-even, whatever any company's estimate says:** a hiring loop of up to ${sl.buffer_narrows_at_days - 1} days keeps the timeline factor at 1. From ${sl.buffer_narrows_at_days} days the factor starts to fall, the scorer treats the gate as closed from ${sl.scorer_gate_closes_at_days} days, and it reaches 0 at ${sl.factor_zero_at_days} days. ` +
      `Compare that with the estimate each row uses: the estimate is the weakest input in the gate, the break-even is not.`, '');
  }
  const df = log.data_horizon;
  if (df) o.push(`**Data horizon:** the funding data ends ${df.date}, ${df.months_before_today} months before this run. A company may have raised money since; "not recent" below means "not recent in this data", not "stale".`, '');

  if (fn) {
    o.push('## How many roles survived each gate', '');
    o.push('| Step | Count | What it means |', '|---|---|---|');
    o.push(`| Boards scanned | ${fn.boards} (failed: ${fn.boards_failed}) | Greenhouse, Lever, Ashby only. A failed board is reported, not counted as empty. |`);
    o.push(`| Open offers | ${fn.offers_found} | Everything on those boards, every function. |`);
    o.push(`| Software-type titles | ${fn.software_type} | Same title rule as the sponsored-title proxy, minus QA, firmware, field service and sales engineering. |`);
    o.push(`| …at companies the data cannot identify | ${fn.software_type_on_entity_blocked_boards} (${fn.boards_entity_blocked} boards) | Not found, ambiguous, or a sibling row holds the approvals. Never fuzzy-matched. |`);
    o.push(`| …excluded by title level | ${fn.level_excluded} | Senior, staff, principal, lead, manager and the like. |`);
    o.push(`| …outside the U.S. | ${fn.non_us_location} | OPT work has to be in the U.S. |`);
    o.push(`| …over the per-board cap | ${fn.over_cap} | Logged, not silent. |`);
    o.push(`| Posting text read | ${fn.posting_text_fetched} (missing: ${fn.posting_text_missing}) | Missing text means BLOCKED, not "no requirement". |`);
    o.push(`| …state a citizenship / clearance / U.S.-person requirement | ${fn.posting_screen_excluded} | Excluded, with the quote. |`);
    o.push(`| …ask for more years of experience than this persona has | ${fn.experience_excluded ?? 0} | Excluded, with the quote (persona.max_years_experience_ok). |`);
    o.push(`| Liveness checked | ${fn.liveness_checked} | active ${fn.liveness_active} · expired ${fn.liveness_expired} · uncertain ${fn.liveness_uncertain} |`);
    o.push(`| Reached a gate or the scorer | ${gated.length} | Apply ${sm.Apply} · Consider ${sm.Consider} · Skip ${sm.Skip} · BLOCKED ${sm.BLOCKED} |`, '');
  }

  o.push('## Decisions (roles that reached a gate or the scorer)', '');
  if (!gated.length) o.push('None.', '');
  else {
    o.push('| Role | Decision | Composite | Sponsorship tier | Fit | Timeline (start → unemployed days) | Liveness | Flags | Next action |');
    o.push('|---|---|---|---|---|---|---|---|---|');
    const order = { Apply: 0, Consider: 1, Skip: 2, BLOCKED: 3 };
    for (const r of [...gated].sort((a, b) => order[a.decision.recommendation] - order[b.decision.recommendation] || (b.decision.composite ?? -1) - (a.decision.composite ?? -1))) {
      const t = r.timeline.status === 'ok' ? `${f3(r.timeline.factor)} (${r.timeline.dates.expected_start} → ${r.timeline.dates.unemployment_days_at_start}d; est ${r.timeline.dates.process_days}d)` : `— (${r.timeline.reason})`;
      const l = r.liveness.status === 'ok' ? `${r.liveness.factor} [${r.liveness.source}, ${r.liveness.checked_on}]` : `— (${r.liveness.reason})`;
      const tier = r.sponsorship.tier ? `${r.sponsorship.tier}${r.sponsorship.p != null ? ` p=${r.sponsorship.p}` : ''}` : `— (${r.sponsorship.reason})`;
      o.push(`| ${cell(r.company)} — ${cell(r.title)}${r.posting.hypothetical ? ' *(hypothetical posting)*' : ''} | **${r.decision.recommendation}** | ${f3(r.decision.composite)} | ${tier} | ${r.fit.p ?? '—'} | ${t} | ${l} | ${cell((r.flags || []).join('; ')) || '—'} | ${cell(r.next_action.block)}: ${cell(r.next_action.action)} |`);
    }
    o.push('');
  }

  if (log.boards) {
    const stopped = log.boards.filter((b) => b.status === 'ok' && (b.entity.status !== 'matched' || b.entity_block));
    const failed = log.boards.filter((b) => b.status === 'failed');
    o.push('## Boards the engine could not score', '');
    if (!stopped.length && !failed.length) o.push('None.', '');
    else {
      o.push('Text after a dash under "Why it stopped" is the author\'s own note. What it says about the CSV can be looked up in the CSV; what it says about the companies themselves (public, acquired, a different business) is outside knowledge or judgment, and this run did not check it.', '');
      o.push('| Company | Offers | Software-type | Why it stopped | What a human can do |', '|---|---|---|---|---|');
      for (const b of stopped) {
        const why = b.entity_block ? `${b.entity_block}: ${b.entity.siblings.siblings.map((s) => `${s.company_name} (${s.total_approvals ?? 0} approvals)`).join('; ')}`
          : b.entity.status === 'ambiguous' ? `entity-ambiguous (${b.entity.rows} CSV rows share the name)` : `entity-not-found: no CSV row for "${b.csv_company_claimed}"${b.note ? ` — ${b.note}` : ''}`;
        o.push(`| ${cell(b.name)} | ${b.offers_found} | ${b.funnel.software_type} | ${cell(why)} | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |`);
      }
      for (const b of failed) o.push(`| ${cell(b.name)} | — | — | board failed to load: ${cell(b.error)} | Re-run later; do not read this as "no jobs". |`);
      o.push('');
    }
  }

  if (excluded.length) {
    o.push('## Excluded before scoring', '');
    const by = {};
    for (const r of excluded) (by[r.excluded.stage] ||= []).push(r);
    for (const stage of Object.keys(by)) {
      o.push(`### ${stage} (${by[stage].length})`, '');
      o.push('| Role | Location | Why |', '|---|---|---|');
      for (const r of by[stage].slice(0, 40)) {
        const q = stage === 'posting-screen' ? ` Quote: "${cell((r.jd_screen?.citizenship_required?.found ? r.jd_screen.citizenship_required : r.jd_screen?.clearance_required?.found ? r.jd_screen.clearance_required : r.jd_screen?.us_person_required)?.snippet)}"` : '';
        o.push(`| ${cell(r.company)} — ${cell(r.title)} | ${cell(r.location?.value)} | ${cell(r.excluded.reason)}${q} |`);
      }
      if (by[stage].length > 40) o.push(`| …and ${by[stage].length - 40} more | | full list in run-log.json |`);
      o.push('');
    }
  }

  o.push('## Why, role by role (every term labeled)', '');
  if (!gated.length) o.push('No role reached a gate.', '');
  for (const r of gated) {
    o.push(`### ${r.company} — ${r.title}`, '');
    o.push(`- **Decision:** ${r.decision.recommendation} — ${r.decision.reason}${r.decision.arithmetic ? ` · \`${r.decision.arithmetic}\`` : ''}`);
    if (r.posting.url) o.push(`- **Posting** [${r.posting.source}${r.posting.from ? `, ${r.posting.from}` : ''}]: ${r.posting.url}${r.location ? ` · ${r.location.value || '(no location)'} (${r.location.class})` : ''}`);
    o.push(`- **Industry** [${r.industry ? 'record' : '—'}]: ${r.industry?.value ?? 'not in CSV'}${r.in_target_sector?.value === false ? ' (outside the target sector list — kept because you chose it)' : ''}`);
    const si = r.sponsorship.inputs;
    if (si) o.push(`- **H-1B record** [record, ${si.total_approvals.file}]: approvals ${si.total_approvals.value ?? '—'}, denials ${si.total_denials.value ?? '—'}, rate ${si.approval_rate.value ?? '—'}; sponsored titles: ${si.top_job_titles_sponsored.value.join('; ') || '—'}`);
    if (si) o.push(`- **Titles matching the 15-1252 rule** [your-input rule]: ${si.titles_matching_15_1252_rule.value.join('; ') || 'none'}`);
    o.push(`- **Tier** [your-input rule over record]: ${r.sponsorship.tier ?? '—'} — ${r.sponsorship.note}`);
    if (r.entity_siblings?.siblings?.length) o.push(`- **Same website, other CSV rows** [record]: ${r.entity_siblings.siblings.map((s) => `${s.company_name} (${s.total_approvals ?? 0} approvals)`).join('; ')} — host ${r.entity_siblings.host}. ${r.entity_siblings.has_approvals ? 'One of them holds approvals, so this role is held.' : 'None holds approvals, so the tier above stands; confirm which entity employs the engineers.'}`);
    const fc = r.funding.csv;
    const rec = r.funding.recency;
    o.push(`- **Funding** [record]: ${fc ? `${fc.latest_funding_stage.value || '?'} on ${fc.latest_funding_date.value} (${fc.months_since} months ago)` : 'none in CSV'}; Form D sample: ${r.funding.form_d_sample ? `${r.funding.form_d_sample.date_filed.value} (${r.funding.form_d_sample.date_filed.file})` : 'no hit (samples hold 50 companies/quarter)'} → ${rec} [your-input rule: ≤ ${r.funding.recency_rule.recent_if_months_le} months${r.funding.data_horizon ? `; data ends ${r.funding.data_horizon.date}` : ''}]. *Not a scorer term.*`);
    o.push(`- **Fit** [your-input${r.fit.rule ? `, ${r.fit.rule}` : ''}]: ${r.fit.p ?? '— (omitted)'}${r.fit.why ? ` — ${r.fit.why}` : ''}`);
    if (r.jd_screen) {
      const js = r.jd_screen;
      if (js.status === 'screened') {
        const bits = [];
        if (js.e_verify_mentioned.found) bits.push(`E-Verify ${js.e_verify_mentioned.negated ? 'mentioned negatively' : 'mentioned'}: "${cell(js.e_verify_mentioned.snippet)}"`);
        if (js.no_sponsorship_statement.found) bits.push(`no-sponsorship wording: "${cell(js.no_sponsorship_statement.snippet)}"`);
        if (js.authorized_to_work_statement.found) bits.push('asks for U.S. work authorization (OPT satisfies this; read the follow-up question)');
        if (js.min_years_experience.found) bits.push(`asks for ${js.min_years_experience.value}+ years: "${cell(js.min_years_experience.snippet)}"`);
        if (js.invites_new_grads?.found) bits.push(`invites new grads: "${cell(js.invites_new_grads.snippet)}"`);
        o.push(`- **Posting text** [record, phrase match; ${js.chars} characters read]: no citizenship, clearance or U.S.-person requirement found${bits.length ? `. Also: ${bits.join('; ')}` : ''}. Silence is not clearance.`);
      } else o.push(`- **Posting text**: MISSING (${js.reason}) — held back: absence of text is not absence of a requirement.`);
    }
    o.push(`- **Liveness gate**: ${r.liveness.status === 'ok' ? `${r.liveness.factor} [${r.liveness.source}] via ${r.liveness.method || '?'} on ${r.liveness.checked_on}${r.liveness.note ? ` (${r.liveness.note})` : ''}` : `MISSING (${r.liveness.reason}) — held back: the scorer would silently treat a missing liveness as 1.0`}`);
    if (r.timeline.status === 'ok') {
      const d = r.timeline.dates;
      o.push(`- **Timeline gate** [your-input]: ${f3(r.timeline.factor)} (${r.timeline.band}) — today ${d.today} + ${d.process_days} days (${r.process_days_estimate.basis || 'estimate'}) → earliest ${d.earliest_offer_start}; cannot start before EAD ${d.ead_start} → start ${d.expected_start}; unemployed days at start ${d.unemployment_days_at_start} vs ceiling ${d.ceiling} − buffer ${d.buffer_target_days}; auth end ${d.auth_end}.`);
    } else o.push(`- **Timeline gate**: MISSING (${r.timeline.reason})`);
    o.push(`- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.`);
    if (r.flags?.length) o.push(`- **Read before acting**: ${r.flags.join('; ')}.`);
    o.push(`- **Next action** (${r.next_action.block}): ${r.next_action.action}`, '');
  }

  o.push('## Network, don\'t apply (in-sector sponsors with recent funding, not on your list)', '');
  if (log.network_targets.length) {
    o.push('| Company | Industry | State | Tier | Matched sponsored titles | Latest funding |', '|---|---|---|---|---|---|');
    for (const n of log.network_targets) o.push(`| ${n.company} | ${n.industry} | ${n.state} | ${n.tier.value} | ${n.matched_titles.value.join('; ') || '—'} | ${n.latest_funding} (${n.months_since_funding.value} mo) |`);
  } else o.push('None met the rule (Proven/Likely tier and funding inside the recency window) in your preferred states.');
  o.push('', '## Role quality (context only — not in the score)', '');
  const q = log.role_quality_context;
  o.push(q.status === 'ok'
    ? `SOC ${q.soc} ${q.title}: national OEWS ${q.oews_year} annual median $${q.annual_median_wage?.toLocaleString('en-US')} [record, ${q.file}]. ${q.why_not}. It does not tell you what any of these employers pays.`
    : `No BLS row (${q.reason}) for SOC ${q.soc}. Nothing was substituted.`);
  o.push('', '## What this run could not verify', '');
  const rc = log.coverage;
  o.push(`- **Any number the scorer multiplied, as a record.** Scorer terms labeled record: ${rc.scorer_terms_labeled_record}${rc.scorer_record_terms_are.length ? ` (${rc.scorer_record_terms_are.join(', ')} only)` : ''}. The CSV records choose each company's tier, but the tier's p (the author's rule), fit and timeline are all your-input.`);
  o.push(`- **That a sponsored title is SOC 15-1252.** The CSV has no SOC column; the title rule is a proxy.`);
  o.push(`- **Exact H-1B counts.** ${log.data_quality.approval_counts_even} approval counts are even — ${log.data_quality.note}`);
  o.push(`- **Recent funding beyond the CSV.** ${df ? `The data ends ${df.date}. ` : ''}Form D sample hits: ${rc.form_d_sample_hits} (the shipped samples hold 50 companies per quarter; full quarters are gitignored).`);
  o.push(`- **Whether a posting is still live tomorrow.** A liveness record is one browser visit on ${gated.find((g) => g.liveness.status === 'ok')?.liveness.checked_on || 'the check date'}; the evidence expires after ${log.rules.liveness_max_age_days.value} days. Pages the checker could not classify are BLOCKED, not guessed.`);
  o.push('- **That a posting without a citizenship or clearance phrase has none.** The screen matches phrases in the posting text; it cannot see a requirement stated elsewhere, in an application question, or in a later interview round.');
  o.push('- **E-Verify enrolment, current sponsorship policy, and how long each company really takes to hire.** A posting that mentions E-Verify is a record of the posting, not of enrolment. Process days come from your size buckets (your-input); use the break-even above to judge them.');
  o.push('- **Which legal entity employs the engineers.** The board-to-company link is your claim, checked only against exact names and shared websites. Acquisitions (an acquirer\'s board, the target\'s H-1B history) are invisible to the CSV.');
  o.push('- **Companies on Workday, iCIMS, Taleo or their own sites.** Only Greenhouse, Lever and Ashby boards are read.');
  o.push('', `*Coverage: entity matched ${rc.entity_matched_in_csv} · scored ${rc.scored} · blocked ${rc.blocked} · excluded before scoring ${rc.excluded_before_scoring}. Scorer audit trail: \`role-scores.md\` in this folder.*`, '');
  return o.join('\n');
}

main();
