// Offline tests for soc-resolver.mjs — fictional fixtures only, no network.
//   node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
// The one test that runs scripts/bls/local-wage-adjustment.py skips itself when
// that script or its .venv is absent (e.g. in the unzipped submission).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseExperience, checkDegree, scopeCheck, candidateSocs, spreadVerdict, matchEmployer,
  parseLivenessLog, wageCell, normalizeName, outAllowed, run, Stop,
} from './soc-resolver.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const FX = path.join(HERE, 'fixtures');
const RULES = JSON.parse(fs.readFileSync(path.join(HERE, 'rules/resolver-rules.json'), 'utf8'));
const SCRIPT = path.join(HERE, 'soc-resolver.mjs');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'socres-test-'));
function posting(dir, p) {
  const f = path.join(dir, `${p.id}.json`);
  fs.writeFileSync(f, JSON.stringify({ kind: 'sample', company: 'Acme Robotics (fictional)', metro: 'Testville, ZZ', place: 'Testville', employer_names: ['Acme Robotics'], ...p }));
  return f;
}
const fixtureArgs = (out, extra = []) => ['--persona', path.join(FX, 'persona.fixture.json'), '--soc-file', path.join(FX, 'soc.fixture.csv'),
  '--national-file', path.join(FX, 'national.fixture.csv'), '--metro-file', path.join(FX, 'metro.fixture.csv'), '--rpp-file', path.join(FX, 'rpp.fixture.csv'),
  '--crosswalk-file', path.join(FX, 'crosswalk.fixture.csv'), '--h1b-file', path.join(FX, 'h1b.fixture.csv'),
  '--liveness-log', path.join(FX, 'liveness.fixture.txt'), '--local-wage', 'skip', '--as-of', '2027-01-01', '--out-dir', out, ...extra];
const exp = (text) => parseExperience(text, RULES, 2);

// ── experience gate ──────────────────────────────────────────────────────────

test('experience: "2 years" → FIT', () => {
  const r = exp('Requirements\n2 years of experience in project management.');
  assert.equal(r.verdict, 'EXPERIENCE-FIT'); assert.equal(r.min_required_years, 2);
  assert.match(r.evidence, /2 years of experience/);
});
test('experience: "1-2 years" → FIT with min 1', () => {
  const r = exp('1-2 years of experience in supply chain required.');
  assert.equal(r.verdict, 'EXPERIENCE-FIT'); assert.equal(r.min_required_years, 1);
});
test('experience: "0–2 years" (en dash) → FIT with min 0', () => {
  const r = exp('Requirements\n0–2 years of experience in operations.');
  assert.equal(r.verdict, 'EXPERIENCE-FIT'); assert.equal(r.min_required_years, 0);
});
test('experience: "2+ years required, 3+ preferred" → FIT on the required minimum, preferred noted', () => {
  const r = exp('Qualifications\n2+ years required, 3+ preferred, of project management experience.');
  assert.equal(r.verdict, 'EXPERIENCE-FIT'); assert.equal(r.min_required_years, 2);
  assert.equal(r.preferred.length, 1); assert.equal(r.preferred[0].min, 3);
  assert.match(r.why, /preferred noted/);
});
test('experience: "3+ years" → OVER-TARGET', () => {
  assert.equal(exp('Requirements\n3+ years of experience in logistics.').verdict, 'EXPERIENCE-OVER-TARGET');
});
test('experience: "5+ years required" → OVER-TARGET', () => {
  const r = exp('5+ years required of supply chain management experience.');
  assert.equal(r.verdict, 'EXPERIENCE-OVER-TARGET'); assert.equal(r.min_required_years, 5);
});
test('experience: "at least 3 years" and "minimum of 4 years" → OVER-TARGET', () => {
  assert.equal(exp('You have at least 3 years of experience.').verdict, 'EXPERIENCE-OVER-TARGET');
  assert.equal(exp('A minimum of 4 years of relevant work experience.').min_required_years, 4);
});
test('experience: no years stated → UNSTATED, never assumed entry-level', () => {
  const r = exp('Requirements\nStrong communication skills.\nBachelor\'s degree required.');
  assert.equal(r.verdict, 'EXPERIENCE-UNSTATED'); assert.equal(r.min_required_years, null);
  assert.match(r.why, /not entry-level/);
});
test('experience: preferred-only years are NOT treated as required', () => {
  const r = exp('About the role\nGreat team.\n3 years of experience preferred.');
  assert.equal(r.verdict, 'EXPERIENCE-UNSTATED'); assert.equal(r.required.length, 0); assert.equal(r.preferred.length, 1);
});
test('experience: years under a Desirable heading count as preferred, Essential as required', () => {
  const r = exp('Essential:\n1-3 years in an inventory management role.\nDesirable:\n4 years of experience in a supply chain related position');
  assert.equal(r.min_required_years, 1); assert.equal(r.preferred[0].min, 4);
});
test('experience: company-history years without experience context are ignored', () => {
  const r = exp('About us\nWe have served customers for 20 years.');
  assert.equal(r.verdict, 'EXPERIENCE-UNSTATED'); assert.equal(r.ignored.length, 1);
});
test('experience: the max is an input, not hard-coded', () => {
  assert.equal(parseExperience('3+ years of experience required.', RULES, 3).verdict, 'EXPERIENCE-FIT');
});

// ── scope gate ───────────────────────────────────────────────────────────────

test('scope: Marketing Coordinator → OUT-OF-SCOPE', () => {
  assert.equal(scopeCheck('Marketing Coordinator', RULES).verdict, 'OUT-OF-SCOPE');
});
test('scope: a title matching nothing → OUT-OF-SCOPE', () => {
  const r = scopeCheck('Barista', RULES);
  assert.equal(r.verdict, 'OUT-OF-SCOPE'); assert.match(r.why, /no project-management or supply-chain keyword/);
});
test('scope: supply-chain and PM titles → IN-SCOPE', () => {
  for (const t of ['Supply Chain Analyst', 'Associate Project Manager', 'Inventory Planner']) assert.equal(scopeCheck(t, RULES).verdict, 'IN-SCOPE', t);
});

// ── candidate SOCs ───────────────────────────────────────────────────────────

test('candidates: Supply Chain Project Manager → 13-1082, 13-1081, 11-3071', () => {
  const socs = candidateSocs({ title: 'Supply Chain Project Manager', text: '' }, RULES).map((c) => c.soc).sort();
  assert.deepEqual(socs, ['11-3071', '13-1081', '13-1082']);
});
test('candidates: a Planner title includes the clerical 43-5061 code', () => {
  assert.ok(candidateSocs({ title: 'Material Planner', text: '' }, RULES).some((c) => c.soc === '43-5061'));
});

// ── spread check ─────────────────────────────────────────────────────────────

const cand = (soc, nat, metro = 'not-checked', vs = 0) => ({ soc, known: true, national_median: nat, national_missing: nat == null ? 'no detailed OEWS row' : null, metro_median: metro, metro_missing: metro == null ? 'suppressed-small-sample' : null, vote_sum: vs });
test('spread: just UNDER the threshold ($9,999, 9.999%) → RESOLVED', () => {
  assert.equal(spreadVerdict([cand('13-1082', 100000), cand('13-1081', 109999)], RULES).result, 'RESOLVED');
});
test('spread: just OVER the USD threshold ($10,001) → AMBIGUOUS-REFUSE with the ask', () => {
  const r = spreadVerdict([cand('13-1082', 100000), cand('13-1081', 110001)], RULES);
  assert.equal(r.result, 'AMBIGUOUS-REFUSE'); assert.match(r.ask, /recruiter or employer which SOC/);
});
test('spread: under $10,000 but over 10% → AMBIGUOUS-REFUSE', () => {
  assert.equal(spreadVerdict([cand('a', 50000), cand('b', 55001)], RULES).result, 'AMBIGUOUS-REFUSE');
});
test('spread: score spread just over 0.05 → AMBIGUOUS-REFUSE; just under → RESOLVED', () => {
  assert.equal(spreadVerdict([cand('a', 100000, 'not-checked', 0.10), cand('b', 100000, 'not-checked', 0.151)], RULES).result, 'AMBIGUOUS-REFUSE');
  assert.equal(spreadVerdict([cand('a', 100000, 'not-checked', 0.10), cand('b', 100000, 'not-checked', 0.149)], RULES).result, 'RESOLVED');
});
test('spread: missing wage with agreeing others → STOP (cannot confirm), never filled', () => {
  const r = spreadVerdict([cand('13-1082', 100000), cand('13-1023', null)], RULES);
  assert.equal(r.result, 'STOP'); assert.match(r.reasons[0], /never interpolated/);
});
test('spread: missing wage when the others already disagree → AMBIGUOUS-REFUSE, missing listed', () => {
  const r = spreadVerdict([cand('13-1081', 80000), cand('43-5061', 58000), cand('13-1023', null)], RULES);
  assert.equal(r.result, 'AMBIGUOUS-REFUSE'); assert.ok(r.missing_national.some((m) => m.startsWith('13-1023')));
});
test('spread: suppressed METRO median blocks RESOLVED even when nationals agree', () => {
  assert.equal(spreadVerdict([cand('a', 100000, 104000), cand('b', 101000, null)], RULES).result, 'STOP');
});
test('spread: unknown SOC → STOP', () => {
  assert.equal(spreadVerdict([{ ...cand('99-9999', null), known: false }], RULES).result, 'STOP');
});
test('spread: no candidates → STOP', () => {
  assert.equal(spreadVerdict([], RULES).result, 'STOP');
});

// ── OEWS tokens ──────────────────────────────────────────────────────────────

test('wage cells: * and # are missing with distinct reasons, never 0', () => {
  assert.deepEqual([wageCell('*').value, wageCell('*').missing], [null, 'not-available (*)']);
  assert.match(wageCell('#').missing, /top-coded/); assert.equal(wageCell('#').value, null);
  assert.equal(wageCell('').value, null); assert.equal(wageCell('80880').value, 80880);
});

// ── degree check ─────────────────────────────────────────────────────────────

test('degree: "bachelor\'s a plus" → DEGREE-NOT-REQUIRED with the specialty-occupation flag', () => {
  const r = checkDegree('Requirements\n1-2 years of experience.\nBachelor\'s degree a plus.', RULES);
  assert.equal(r.verdict, 'DEGREE-NOT-REQUIRED'); assert.match(r.flag, /specialty-occupation risk/); assert.match(r.flag, /never a legal conclusion/);
});
test('degree: high school diploma → DEGREE-NOT-REQUIRED (high-school-diploma)', () => {
  assert.match(checkDegree('Requirements\nHigh school diploma or GED required.', RULES).reason, /high-school-diploma/);
});
test('degree: no degree named → DEGREE-NOT-REQUIRED (no-degree-named)', () => {
  assert.equal(checkDegree('Requirements\nGood communication.', RULES).reason, 'no-degree-named');
});
test('degree: "Desirable: Bachelor\'s … or equivalent combination" → both reasons', () => {
  const r = checkDegree('Desirable:\nBachelor\'s degree in Business or a related field; or equivalent combination of education and experience.', RULES);
  assert.equal(r.verdict, 'DEGREE-NOT-REQUIRED'); assert.match(r.reason, /preferred/); assert.match(r.reason, /equivalent/);
});
test('degree: required in a named field → DEGREE-REQUIRED with field', () => {
  const r = checkDegree('Requirements\nBachelor\'s degree required in industrial engineering or business.', RULES);
  assert.equal(r.verdict, 'DEGREE-REQUIRED'); assert.equal(r.field, 'industrial engineering or business');
});
test('degree: only under a "Major Bonuses" heading → not required', () => {
  assert.equal(checkDegree('Major Bonuses\nAdvanced degree in Supply Chain or Engineering.', RULES).verdict, 'DEGREE-NOT-REQUIRED');
});

// ── liveness & employer matching ─────────────────────────────────────────────

test('liveness log: parses active / expired / uncertain with reasons', () => {
  const obs = parseLivenessLog(fs.readFileSync(path.join(FX, 'liveness.fixture.txt'), 'utf8'));
  assert.deepEqual(obs.map((o) => o.result), ['active', 'expired', 'uncertain']);
  assert.equal(obs[0].reason, null); assert.match(obs[2].reason, /no visible apply control/);
});
test('employer: substring collisions are reported and NOT attached; exact name matches', () => {
  const h1b = { header: ['company_name', 'Total Approvals'], rows: [{ company_name: 'ZIPLINE AI LTD' }, { company_name: 'ZIPLINE MEDICAL INC' }, { company_name: 'CRS GROUP INC' }, { company_name: 'ACME ROBOTICS INC', 'Total Approvals': '12' }] };
  const z = matchEmployer(['Zipline', 'Zipline International Inc.'], h1b);
  assert.equal(z.exact_matches.length, 0); assert.equal(z.rejected_loose_matches.length, 2);
  assert.equal(matchEmployer(['RS Group'], h1b).exact_matches.length, 0);
  assert.equal(matchEmployer(['RS Group'], h1b).rejected_loose_matches[0].company_name, 'CRS GROUP INC');
  assert.equal(matchEmployer(['Acme Robotics'], h1b).exact_matches[0].total_approvals, '12');
  assert.equal(normalizeName('Acme Robotics, Inc.'), normalizeName('ACME ROBOTICS INC'));
  assert.match(z.per_soc_note, /no SOC\/occupation column/);
});

// ── end to end on fixtures ───────────────────────────────────────────────────

test('e2e: dead and unknown liveness → STOP at liveness (not a lower score)', () => {
  const d = tmp();
  const dead = posting(d, { id: 'dead', title: 'Project Manager', url: 'https://jobs.example.test/dead', text: 'Requirements\n2 years of experience.' });
  const unk = posting(d, { id: 'unk', title: 'Project Manager', url: 'https://jobs.example.test/unknown', text: 'Requirements\n2 years of experience.' });
  const none = posting(d, { id: 'none', title: 'Project Manager', url: 'https://jobs.example.test/never-checked', text: 'Requirements\n2 years of experience.' });
  const { log } = run([...fixtureArgs(path.join(d, 'out')), '--posting', dead, '--posting', unk, '--posting', none]);
  for (const p of log.postings) { assert.equal(p.verdict, 'STOP', p.id); assert.equal(p.stopped_at, 'liveness', p.id); }
  assert.deepEqual(log.postings.map((p) => p.gates.liveness.result), ['expired', 'uncertain', 'unknown']);
});
test('e2e: one candidate, live, data present → RESOLVED; scorer ran unmodified; JSON parses; every label valid', () => {
  const d = tmp();
  const f = posting(d, { id: 'ok', title: 'Project Manager', url: 'https://jobs.example.test/active', text: 'Requirements\n2 years of experience in projects.\nBachelor\'s degree in engineering required.' });
  const out = path.join(d, 'out');
  run([...fixtureArgs(out), '--posting', f]);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'soc-resolver.json'), 'utf8'));
  const p = log.postings[0];
  assert.equal(p.verdict, 'RESOLVED'); assert.equal(p.candidates[0].soc, '13-1082');
  assert.equal(p.candidates[0].national.median.value, 100000);
  assert.ok(log.scorer.ran); assert.ok(fs.existsSync(path.join(out, 'role-scores.json')));
  assert.equal(p.candidates[0].scorer.recommendation, 'Skip', 'timeline gate is closed until EAD dates are entered');
  const labels = new Set();
  JSON.stringify(log, (k, val) => { if (k === 'label') labels.add(val); return val; });
  for (const l of labels) assert.ok(['record', 'your-input', 'model-judgment'].includes(l), `bad label ${l}`);
  assert.match(fs.readFileSync(path.join(out, 'soc-resolver.md'), 'utf8'), /^# .*\n\n## Executive summary/);
});
test('e2e: Inventory-Planner-shaped posting → AMBIGUOUS-REFUSE, 13-1023 missing, clerical flag', () => {
  const d = tmp();
  const f = posting(d, { id: 'planner', title: 'Inventory Planner', url: 'https://jobs.example.test/active', text: 'Responsibilities\nManages the review and release of purchase orders.\nEssential:\n1-3 years in an inventory management or supply chain related role.\nDesirable:\nBachelor\'s degree in Business; or equivalent combination of education and experience.' });
  const { log } = run([...fixtureArgs(path.join(d, 'out')), '--posting', f]);
  const p = log.postings[0];
  assert.equal(p.verdict, 'AMBIGUOUS-REFUSE'); assert.equal(p.score, null);
  const pa = p.candidates.find((c) => c.soc === '13-1023');
  assert.equal(pa.national.row_found, false); assert.equal(pa.national.broad_parent_row.occ_code, '13-1020');
  assert.ok(p.flags.some((x) => x.flag === 'CLERICAL-OR-JZ2-CANDIDATE' && x.soc === '43-5061'));
  assert.equal(p.candidates.find((c) => c.soc === '43-5061').metro_raw.median.missing, 'not-available (*)', 'suppressed metro wage stays missing');
  assert.equal(p.degree.verdict, 'DEGREE-NOT-REQUIRED');
});
test('e2e: in-scope title that matches no SOC rule → STOP (no candidate)', () => {
  const d = tmp();
  const f = posting(d, { id: 'nosoc', title: 'Strategic Sourcing Lead', url: 'https://jobs.example.test/active', text: 'Requirements\n1 year of experience.' });
  const { log } = run([...fixtureArgs(path.join(d, 'out')), '--posting', f]);
  assert.equal(log.postings[0].verdict, 'STOP'); assert.match(log.postings[0].verdict_why, /no candidate SOC/);
});
test('e2e: unknown SOC from the rule table → STOP', () => {
  const d = tmp();
  const rules = JSON.parse(JSON.stringify(RULES));
  rules.soc_rules = [{ id: 'BOGUS', title_any: ['project manager'], socs: ['99-9999'], why: 'test' }];
  const rf = path.join(d, 'rules.json'); fs.writeFileSync(rf, JSON.stringify(rules));
  const f = posting(d, { id: 'unk', title: 'Project Manager', url: 'https://jobs.example.test/active', text: 'Requirements\n1 year of experience.' });
  const { log } = run([...fixtureArgs(path.join(d, 'out'), ['--rules', rf]), '--posting', f]);
  const p = log.postings[0];
  assert.equal(p.verdict, 'STOP'); assert.equal(p.candidates[0].known, false); assert.match(p.verdict_why, /unknown SOC 99-9999/);
});
test('e2e: EAD dates entered by a named human clear the timeline gate; otherwise STOP', () => {
  const d = tmp();
  const persona = JSON.parse(fs.readFileSync(path.join(FX, 'persona.fixture.json'), 'utf8'));
  persona.visa = { ...persona.visa, ead_valid_from: '2027-01-05', ead_card_expires: '2028-01-04', ead_entered_by: 'fixture human' };
  const pf = path.join(d, 'persona.json'); fs.writeFileSync(pf, JSON.stringify(persona));
  const f = posting(d, { id: 'ok', title: 'Project Manager', url: 'https://jobs.example.test/active', text: 'Requirements\n2 years of experience.' });
  const cleared = run([...fixtureArgs(path.join(d, 'a'), ['--persona', pf]), '--posting', f]).log;
  assert.equal(cleared.visa.ead.gate, 'CLEARED'); assert.equal(cleared.visa.stem.gate, 'HOLD');
  assert.equal(run([...fixtureArgs(path.join(d, 'b')), '--posting', f]).log.visa.ead.gate, 'STOP');
});

// ── output guard ─────────────────────────────────────────────────────────────

test('refuses to write into tracked data/ paths (exit 2, nothing written)', () => {
  const d = tmp();
  const f = posting(d, { id: 'x', title: 'Project Manager', text: 'Requirements\n1 year of experience.' });
  for (const target of [path.join(REPO, 'data', 'examples', 'soc-resolver-should-not-exist'), path.join(HERE, 'data', 'should-not-exist')]) {
    assert.equal(outAllowed(target), false, target);
    const r = spawnSync(process.execPath, [SCRIPT, ...fixtureArgs(target), '--posting', f], { encoding: 'utf8' });
    assert.equal(r.status, 2, r.stderr); assert.match(r.stderr, /refusing to write/);
    assert.equal(fs.existsSync(target), false);
  }
  assert.throws(() => run(['--posting', f, '--out-dir', path.join(REPO, 'data')]), (e) => e instanceof Stop && e.code === 2);
});

// ── the real local-wage script on a fictional suppressed cell ────────────────

const venv = [path.join(REPO, '.venv/Scripts/python.exe'), path.join(REPO, '.venv/bin/python')].find((p) => fs.existsSync(p));
const lwScript = path.join(REPO, 'scripts/bls/local-wage-adjustment.py');
test('local-wage script (unmodified) returns suppressed-small-sample for a "*" metro median', { skip: !(venv && fs.existsSync(lwScript)) && 'no .venv or local-wage script here (e.g. unzipped submission)' }, () => {
  const d = tmp();
  const f = posting(d, { id: 'planner', title: 'Inventory Planner', url: 'https://jobs.example.test/active', text: 'Essential:\n1 year of experience in a supply chain role.' });
  const args = fixtureArgs(path.join(d, 'out')).map((a) => (a === 'skip' ? 'script' : a));
  const { log } = run([...args, '--python', venv, '--posting', f]);
  const clerk = log.postings[0].candidates.find((c) => c.soc === '43-5061');
  assert.equal(clerk.metro_band.status, 'missing'); assert.equal(clerk.metro_band.missing_reason, 'suppressed-small-sample');
  assert.equal(clerk.metro_band.adjusted_median, null);
  const log2 = log.postings[0].candidates.find((c) => c.soc === '13-1081').metro_band;
  assert.equal(log2.status, 'ok'); assert.equal(log2.adjusted_median, Number((84000 / 1.04).toFixed(2)));
});
