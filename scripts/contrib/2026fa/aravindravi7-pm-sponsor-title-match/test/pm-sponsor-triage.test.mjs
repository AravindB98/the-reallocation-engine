// Offline tests for pm-sponsor-triage.mjs. No network: every input is a fixture in ../fixtures/
// (or a pure-function argument), and the only subprocess is the repo's own scorer
// (scripts/score/role-scorer.mjs), run locally.
//   node --test scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  REPO, classifyTitle, parseTitleList, normalizeName, parseLiveness, parseLivenessJsonl, loadLivenessFiles,
  livenessGate, eVerifyGate, timelineFactor, registrationWindows, loadSponsorIndex, loadBls, run, renderReport,
  InputError, parseDate, employerTier, insideFixtures, SRC, loadLca, lcaEvidence, LCA_COLUMNS,
} from '../pm-sponsor-triage.mjs';
import { toRecord, readUrls } from '../liveness-json.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, '../fixtures');
const fx = (f) => path.join(FX, f);
const SCRIPT = path.join(HERE, '../pm-sponsor-triage.mjs');
const ALLOWED = new Set(['record', 'model-judgment', 'your-input', 'fixture', 'none']);

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'pm-triage-')); }
// Every fixture-backed run is a SAMPLE run: fixtures are refused in live mode.
function baseOpts(out, over = {}) {
  return {
    mode: 'sample', shortlist: fx('shortlist.sample.json'), persona: fx('persona.sample.json'), liveness: [fx('liveness.sample.txt')],
    csv: fx('sponsors.slice.csv'), bls: fx('bls.slice.csv'), formdDir: fx('formd'), lca: 'none', out, asOf: '2026-10-03', ...over,
  };
}
function personaWith(over) {
  const p = { ...JSON.parse(fs.readFileSync(fx('persona.sample.json'), 'utf8')), ...over };
  const f = path.join(tmpdir(), 'persona.json'); fs.writeFileSync(f, JSON.stringify(p)); return f;
}
function walk(obj, visit, where = '$') {
  if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, visit, `${where}[${i}]`));
  else if (obj && typeof obj === 'object') { visit(obj, where); for (const [k, v] of Object.entries(obj)) walk(v, visit, `${where}.${k}`); }
}
const labelsIn = (obj) => { const bad = []; walk(obj, (o, w) => { if ('source' in o && !ALLOWED.has(o.source)) bad.push(`${w}.source=${o.source}`); }); return bad; };

test('title classifier: product vs program vs ambiguous vs excluded', () => {
  const cases = {
    'Product Manager': 'product', 'Sr. Product Manager, PhenoCycler Instruments': 'product', 'Director, Product Management': 'product',
    'TECHNICAL PRODUCT MANAGER/PRODUCT OWNER': 'product', 'Associate Product Manager (New Grad)': 'product',
    'Technical Program Manager': 'program', 'Senior Program Manager': 'program',
    'Advertiser Optimization PM': 'ambiguous-pm', 'TPM': 'ambiguous-pm',
    'Product Marketing Manager II': 'other', 'Product Designer': 'other', 'Senior Manager, Product Strategy': 'other', 'Software Engineer': 'other', '': 'other',
    'Programmer Analyst': 'other', 'Computer Programmer': 'other',
    'Sr. Product Mgr': 'product', 'Product Mgmt Lead': 'product', 'Program Mgr': 'program', 'Technical Program Mgr': 'program', 'Product Marketing Mgr': 'other',
  };
  for (const [t, want] of Object.entries(cases)) assert.equal(classifyTitle(t), want, t);
});

test('sponsored-title list parser handles a double-quoted title with an apostrophe', () => {
  assert.deepEqual(parseTitleList(`['Senior Machine Learning Engineer ', "Senior Director, Men's Category"]`),
    ['Senior Machine Learning Engineer', "Senior Director, Men's Category"]);
  assert.deepEqual(parseTitleList(''), []);
});

test('company matching is exact after normalization — an SPV fund name never matches the brand', () => {
  assert.equal(normalizeName('Stripe, Inc.'), normalizeName('STRIPE INC'));
  assert.notEqual(normalizeName('Anthropic'), normalizeName('ANTHROPIC - A SERIES OF AURUM VP FUND LLC'));
  const idx = loadSponsorIndex(fx('sponsors.slice.csv'));
  assert.equal((idx.byNorm.get('ANTHROPIC') || []).length, 0);
  assert.equal(idx.byNorm.get('PELOTON INTERACTIVE').length, 2);
  assert.equal(idx.provenance, 'fixture');
});

test('liveness text parser reads the checker\'s own output format, including reason lines', () => {
  const m = parseLiveness(fs.readFileSync(fx('liveness.sample.txt'), 'utf8'));
  assert.equal(m.get('https://jobs.example.com/stripe/pm-new-grad').status, 'active');
  assert.equal(m.get('https://jobs.example.com/mongodb/spm').status, 'expired');
  assert.match(m.get('https://jobs.example.com/stripe/pm-payments').reason, /no visible apply control/);
  assert.equal(m.has('https://jobs.example.com/figma/tpm-not-in-liveness-file'), false);
  assert.equal(m.get('https://jobs.example.com/stripe/pm-new-grad').provenance, 'fixture'); // the file says # FIXTURE
});

test('liveness JSONL (liveness-json.mjs output) parses, and a line without provenance is refused', () => {
  const rec = toRecord('https://jobs.example.com/a', { result: 'expired', reason: 'pattern matched: job no longer available' }, '2026-10-21T10:00:00Z');
  assert.equal(rec.provenance, 'record');
  const m = parseLivenessJsonl([JSON.stringify(rec), JSON.stringify({ ...rec, url: 'https://jobs.example.com/b', result: 'active', provenance: 'fixture' })].join('\n'));
  assert.equal(m.get('https://jobs.example.com/a').status, 'expired');
  assert.equal(m.get('https://jobs.example.com/a').provenance, 'record');
  assert.equal(m.get('https://jobs.example.com/b').provenance, 'fixture');
  const noProv = JSON.stringify({ url: 'https://x.example.com', result: 'active' });
  assert.throws(() => parseLivenessJsonl(noProv), (e) => e instanceof InputError && /missing provenance/.test(e.message));
  assert.deepEqual(readUrls('# comment\nhttps://a.example.com\n\n https://b.example.com '), ['https://a.example.com', 'https://b.example.com']);
});

test('a JSONL file inside fixtures/ is fixture even if a line claims "record"', () => {
  const m = parseLivenessJsonl(JSON.stringify({ url: 'https://jobs.example.com/a', result: 'active', provenance: 'record' }), { fixture: true });
  assert.equal(m.get('https://jobs.example.com/a').provenance, 'fixture');
  assert.equal(insideFixtures(fx('liveness.sample.txt')), true);
});

test('G2 unit: a checker record or a named human clears liveness; a fixture never does', () => {
  const rec = (status, provenance = 'record') => ({ status, reason: null, provenance });
  assert.equal(livenessGate(rec('active'), null, null, true).g2, 'cleared — checker: active');
  assert.equal(livenessGate(rec('expired'), null, null, true).g2, 'closed — checker: expired');
  assert.equal(livenessGate(rec('active', 'fixture'), null, null, true).g2, 'not cleared — fixture');
  const unc = livenessGate(rec('uncertain'), null, null, true);
  assert.equal(unc.hold.reason, 'liveness-uncertain');
  const human = { status: 'active', by: 'Named Reviewer', date: '2026-10-21' };
  const cleared = livenessGate(rec('uncertain'), human, null, true);
  assert.equal(cleared.hold, null);
  assert.equal(cleared.liveness.source, 'your-input');
  assert.equal(cleared.g2, 'cleared — named human: Named Reviewer, 2026-10-21');
  const fixHuman = livenessGate(rec('uncertain'), human, 'fixture', true);
  assert.equal(fixHuman.liveness.source, 'fixture');
  assert.match(fixHuman.g2, /^not cleared — fixture/);
  assert.equal(livenessGate(rec('expired'), human, null, true).liveness.value, 0, 'a human note never reopens an expired posting');
  assert.ok(livenessGate(rec('uncertain'), { status: 'active', date: '2026-10-21' }, null, true).invalid, 'no name, no clearance');
  assert.equal(livenessGate(undefined, null, null, true).liveness.source, 'none');
});

test('G4 unit: E-Verify needs a named human; not-found/terminated block; a fixture never clears', () => {
  assert.equal(eVerifyGate(null, null).g4, 'open — E-Verify not checked');
  assert.equal(eVerifyGate(null, null).e_verify.source, 'none');
  assert.equal(eVerifyGate({ status: 'enrolled', by: 'Named Reviewer', date: '2026-10-21' }, null).g4, 'cleared — named human: Named Reviewer, 2026-10-21');
  assert.match(eVerifyGate({ status: 'not-found', by: 'Named Reviewer', date: '2026-10-21' }, null).g4, /^blocked/);
  assert.match(eVerifyGate({ status: 'enrolled', date: '2026-10-21' }, null).g4, /^open — invalid/);
  assert.equal(eVerifyGate({ status: 'enrolled', by: 'Named Reviewer', date: '2026-10-21' }, 'fixture').g4, 'not cleared — fixture');
});

test('timeline gate: steps, unemployment allowance, and refusal when OPT end is past', () => {
  const asOf = parseDate('2026-10-03', 'x');
  const far = timelineFactor({ asOf, optEnd: parseDate('2029-05-31', 'x'), lagDays: 75, unemploymentLeft: 110, employed: false });
  assert.equal(far.factor, 1.0);
  const near = timelineFactor({ asOf, optEnd: parseDate('2027-01-31', 'x'), lagDays: 75, unemploymentLeft: 110, employed: false });
  assert.equal(near.factor, 0.3); // 120 days left − 75 lag = 45 days slack
  const overAllowance = timelineFactor({ asOf, optEnd: parseDate('2029-05-31', 'x'), lagDays: 75, unemploymentLeft: 20, employed: false });
  assert.equal(overAllowance.factor, 0);
  assert.throws(() => timelineFactor({ asOf, optEnd: parseDate('2026-09-30', 'x'), lagDays: 0, unemploymentLeft: 110, employed: true }),
    (e) => e instanceof InputError && e.code === 3);
  assert.throws(() => parseDate('2026-02-30', 'opt_end_date'), InputError);
});

test('H-1B registration windows are counted from dates only', () => {
  assert.equal(registrationWindows(parseDate('2026-12-17', 'x'), parseDate('2029-05-31', 'x')), 3); // Mar 2027, 2028, 2029
  assert.equal(registrationWindows(parseDate('2029-04-01', 'x'), parseDate('2029-05-31', 'x')), 0);
});

test('schema drift in the 80 Days CSV halts instead of reading the wrong column', () => {
  const f = path.join(tmpdir(), 'drift.csv');
  fs.writeFileSync(f, 'company_name,industry,Total Approvals\nSTRIPE INC,Other,1\n');
  assert.throws(() => loadSponsorIndex(f), (e) => e instanceof InputError && /schema drift/.test(e.message));
});

test('a SOC code with no BLS row is reported missing, never zero', () => {
  const [q] = loadBls(fx('bls.slice.csv'), ['15-1199']);
  assert.equal(q.status, 'missing');
  assert.equal(q.missing_reason, 'no-occupation-row');
  assert.equal(q.median_wage, null);
});

test('end to end on fixtures through the real scorer: holds, gates, labels, report shape', () => {
  const out = tmpdir();
  const log = run(baseOpts(out));
  const byId = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));

  // named failure cases → HOLD with the right reason, never scored
  assert.equal(byId['s06-anthropic-pm'].holds[0].reason, 'company-not-in-csv');
  assert.equal(byId['s08-peloton-pm'].holds[0].reason, 'ambiguous-company-match');
  assert.equal(byId['s09-figma-tpm-unchecked'].holds[0].reason, 'liveness-unchecked');
  assert.equal(byId['s10-stripe-pm-payments-uncertain'].holds[0].reason, 'liveness-uncertain');
  const held = log.roles.filter((r) => r.decision === 'HOLD').map((r) => r.role_id).sort();
  const sent = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  for (const id of held) assert.ok(!sent.some((r) => r.role_id === id), `${id} must not reach the scorer`);
  assert.equal(byId['s06-anthropic-pm'].sponsorship, null, 'no sponsorship value invented for an unmatched company');

  // every scorer term carries an allowed label; liveness is never absent (the scorer would default it to 1)
  for (const r of sent) {
    for (const k of ['sponsorship', 'fit', 'liveness', 'timeline']) assert.ok(ALLOWED.has(r[k].source), `${r.role_id}.${k}`);
    assert.equal(typeof r.liveness.factor, 'number');
  }
  assert.deepEqual(labelsIn(log), []);

  // the liveness gate is a multiplier: expired → composite 0, regardless of a Proven sponsor
  const mongo = byId['s04-mongodb-pm-expired'];
  assert.equal(mongo.would_be_if_live.recommendation, 'Skip');
  assert.equal(mongo.composite, 0);
  assert.equal(mongo.sponsorship.tier.value, 'Proven');

  // tier logic is driven by the (fixture copies of the) record strings
  assert.equal(byId['s02-datadog-tpm'].sponsorship.rule.value, 'adjacent-family');
  assert.equal(byId['s03-databricks-apm'].sponsorship.rule.value, 'sponsor-not-pm');
  assert.equal(byId['s07-ramp-pm'].sponsorship.rule.value, 'no-h1b-record');
  assert.equal(byId['s07-ramp-pm'].sponsorship.csv_row.matched_by.source, 'fixture'); // csv_name came from a fixture shortlist
  assert.deepEqual(byId['s05-reddit-pm'].sponsorship.ambiguous_titles.value, ['Advertiser Optimization PM']);

  // the scorer's own outputs exist and agree on the profile
  assert.ok(fs.existsSync(path.join(out, 'role-scores.json')));
  assert.equal(log.scorer.profile_needs_sponsorship, true);

  // two outputs, two readers: JSON log for the agent, Markdown report for the person (exec summary first)
  const md = fs.readFileSync(path.join(out, 'pm-triage-report.md'), 'utf8');
  assert.match(md.split('\n').filter((l) => l.startsWith('## '))[0], /^## Executive summary$/);
  assert.doesNotMatch(md + JSON.stringify(log), /\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}/, 'no phone-number-shaped strings leak into outputs');
});

test('(b) provenance walk: in a sample run no fixture-derived value is labeled "record" — log and scorer input', () => {
  const out = tmpdir();
  const log = run(baseOpts(out));
  const sent = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  for (const r of sent) for (const k of ['sponsorship', 'fit', 'liveness', 'timeline']) assert.equal(r[k].source, 'fixture', `${r.role_id}.${k}`);
  const recordLabels = []; walk(log.roles, (o, w) => { if (o.source === 'record') recordLabels.push(w); });
  assert.deepEqual(recordLabels, [], 'every input here is a fixture, so nothing may be labeled record');
  for (const r of log.roles.filter((x) => x.liveness.value != null)) assert.equal(r.liveness.source, 'fixture', r.role_id);
});

test('(c) DEMO: fixture rows carry no actionable verdict — decision DEMO, outcome in would_be_if_live', () => {
  const out = tmpdir();
  const log = run(baseOpts(out));
  const scored = log.roles.filter((r) => r.decision !== 'HOLD');
  assert.ok(scored.length > 0);
  for (const r of scored) {
    assert.equal(r.decision, 'DEMO', r.role_id);
    assert.ok(['Apply', 'Consider', 'Skip'].includes(r.would_be_if_live.recommendation), r.role_id);
    assert.equal(r.next_action.action, 'none (demo)');
    assert.match(r.gates.g2_liveness, /^not cleared — fixture/);
  }
  assert.equal(log.summary.apply + log.summary.consider + log.summary.skip, 0);
  const md = fs.readFileSync(path.join(out, 'pm-triage-report.md'), 'utf8');
  const decisionCells = md.split('\n').filter((l) => /^\| \*\*/.test(l)).map((l) => l.split('|')[1].trim());
  for (const c of decisionCells) assert.ok(c === '**DEMO**' || c === '**HOLD**', `report decision cell ${c}`);
});

test('(a) break attempt — mislabel: a fixture liveness file copied outside fixtures/ is still fixture and cannot clear G2', () => {
  const copy = path.join(tmpdir(), 'liveness-looks-real.txt');
  fs.copyFileSync(fx('liveness.sample.txt'), copy);
  assert.equal(insideFixtures(copy), false);
  const { meta, map } = loadLivenessFiles([copy]);
  assert.equal(meta[0].provenance, 'fixture', 'the # FIXTURE marker travels with the file');
  for (const e of map.values()) assert.equal(e.provenance, 'fixture');
  const log = run(baseOpts(tmpdir(), { liveness: [copy] }));
  for (const r of log.roles.filter((x) => x.liveness.value != null)) {
    assert.equal(r.liveness.source, 'fixture', r.role_id);
    assert.doesNotMatch(r.gates.g2_liveness, /^cleared/, r.role_id);
  }
});

function cli(args) { return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: REPO, encoding: 'utf8' }); }
function liveArgs(out, over = {}) {
  // A live run with non-fixture shortlist/persona in a temp dir, so only the input under test is a fixture.
  const dir = tmpdir();
  const sl = { roles: [{ role_id: 'x1', company: 'Stripe', title: 'Product Manager', url: 'https://jobs.example.com/stripe/pm-new-grad', fit: 0.8 }] };
  const persona = { ...JSON.parse(fs.readFileSync(fx('persona.sample.json'), 'utf8')) }; delete persona._provenance;
  const rules = JSON.parse(fs.readFileSync(fx('rules.v0.1.1.json'), 'utf8')); delete rules._provenance;
  fs.writeFileSync(path.join(dir, 's.json'), JSON.stringify(sl)); fs.writeFileSync(path.join(dir, 'p.json'), JSON.stringify(persona)); fs.writeFileSync(path.join(dir, 'r.json'), JSON.stringify(rules));
  const a = { '--shortlist': path.join(dir, 's.json'), '--persona': path.join(dir, 'p.json'), '--rules': path.join(dir, 'r.json'), '--out': out, '--as-of': '2026-10-21', ...over };
  return Object.entries(a).flatMap(([k, v]) => [].concat(v).flatMap((x) => [k, x]));
}

test('(d) break attempt — live guard: a live run fed fixture liveness is a hard stop (exit 5), nothing written', () => {
  const out = path.join(tmpdir(), 'out');
  const r = cli(liveArgs(out, { '--liveness': fx('liveness.sample.txt') }));
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stderr, /live run refused — fixture-sourced input/);
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false);
  assert.equal(fs.existsSync(path.join(out, 'pm-triage-report.md')), false);
  // the copied-out fixture is caught too
  const copy = path.join(tmpdir(), 'liveness-looks-real.txt'); fs.copyFileSync(fx('liveness.sample.txt'), copy);
  assert.equal(cli(liveArgs(path.join(tmpdir(), 'out'), { '--liveness': copy })).status, 5);
});

test('(d) live guard also refuses a fixture 80 Days CSV slice and BLS slice (record-type fixtures)', () => {
  const live = path.join(tmpdir(), 'live.jsonl');
  fs.writeFileSync(live, JSON.stringify({ url: 'https://jobs.example.com/stripe/pm-new-grad', result: 'active', reason: null, provenance: 'record', checker: 'test' }) + '\n');
  for (const extra of [{ '--csv': fx('sponsors.slice.csv') }, { '--bls': fx('bls.slice.csv') }, { '--formd-dir': fx('formd') }]) {
    const out = path.join(tmpdir(), 'out');
    const r = cli(liveArgs(out, { '--liveness': live, ...extra }));
    assert.equal(r.status, 5, JSON.stringify(extra) + r.stderr);
    assert.equal(fs.existsSync(path.join(out, 'pm-triage-log.json')), false);
  }
});

test('OPT end date already past: the whole run is refused and nothing is scored', () => {
  const out = tmpdir();
  assert.throws(() => run(baseOpts(out, { persona: personaWith({ opt_end_date: '2026-06-30' }) })), (e) => e.code === 3);
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false);
  assert.equal(fs.existsSync(path.join(out, 'pm-triage-report.md')), false);
});

test('break attempt: an authorization string with "authorized" makes the scorer drop sponsorship — the prototype refuses', () => {
  const out = tmpdir();
  assert.throws(() => run(baseOpts(out, { persona: personaWith({ authorization: 'F-1 OPT, authorized to work' }) })),
    (e) => e.code === 4 && /NOT needing sponsorship/.test(e.message));
});

test('characterization of the engine: the scorer treats a missing liveness factor as an open gate', () => {
  // BROKEN-no-liveness-roles.json omits liveness. This is why the prototype HOLDs unchecked roles.
  const out = tmpdir();
  const r = spawnSync(process.execPath, [path.join(REPO, 'scripts/score/role-scorer.mjs'), fx('BROKEN-no-liveness-roles.json'), '--out-dir', out], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const s = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8')).roles[0];
  assert.equal(s.trace.gates.find((g) => g.factor === 'liveness').multiplier, 1);
  assert.equal(s.recommendation, 'Apply');
});

test('a fixture-file human liveness clearance lifts the hold for the demo but does not clear G2', () => {
  const sl = JSON.parse(fs.readFileSync(fx('shortlist.sample.json'), 'utf8'));
  const human = { status: 'active', by: 'Test Reviewer', date: '2026-10-03', note: 'opened the page; apply button present' };
  for (const r of sl.roles) if (r.role_id === 's10-stripe-pm-payments-uncertain' || r.role_id === 's04-mongodb-pm-expired') r.liveness_human = human;
  const f = path.join(tmpdir(), 'shortlist.json'); fs.writeFileSync(f, JSON.stringify(sl)); // still carries _provenance: fixture
  const byId = Object.fromEntries(run(baseOpts(tmpdir(), { shortlist: f })).roles.map((r) => [r.role_id, r]));
  const c = byId['s10-stripe-pm-payments-uncertain'];
  assert.equal(c.decision, 'DEMO');
  assert.equal(c.liveness.source, 'fixture');
  assert.match(c.gates.g2_liveness, /^not cleared — fixture/);
  assert.equal(byId['s04-mongodb-pm-expired'].liveness.status, 'expired');
});

test('a liveness_human note without a name does not clear the gate', () => {
  const sl = JSON.parse(fs.readFileSync(fx('shortlist.sample.json'), 'utf8'));
  sl.roles.find((r) => r.role_id === 's10-stripe-pm-payments-uncertain').liveness_human = { status: 'active', date: '2026-10-03' };
  const f = path.join(tmpdir(), 'shortlist.json'); fs.writeFileSync(f, JSON.stringify(sl));
  const r = run(baseOpts(tmpdir(), { shortlist: f })).roles.find((x) => x.role_id === 's10-stripe-pm-payments-uncertain');
  assert.equal(r.decision, 'HOLD');
});

test('employer tier orders the report but never changes a decision or a composite', () => {
  const withTiers = run(baseOpts(tmpdir()));
  const noTiers = run(baseOpts(tmpdir(), { persona: personaWith({ employer_tiers: {} }) }));
  const pick = (log) => Object.fromEntries(log.roles.map((r) => [r.role_id, [r.decision, r.would_be_if_live?.recommendation ?? null, r.composite ?? null]]));
  assert.deepEqual(pick(withTiers), pick(noTiers));
  const anth = withTiers.roles.find((r) => r.role_id === 's06-anthropic-pm');
  assert.equal(anth.employer_tier.value, 1);
  assert.equal(anth.employer_tier.source, 'fixture'); // the persona file is a fixture
  const pel = withTiers.roles.find((r) => r.role_id === 's08-peloton-pm').employer_tier;
  assert.deepEqual([pel.value, pel.source], [4, 'fixture']);
  // tier-1 hold is listed first among holds
  const md = renderReport(withTiers);
  const holds = md.slice(md.indexOf('## Holds')).split('\n').filter((l) => l.startsWith('- **'));
  assert.match(holds[0], /Anthropic/);
});

test('employer tier lookup: your list beats the predicted list beats the fallback rule; the rule never predicts 1 or 2', () => {
  const persona = { employer_tiers: { 1: ['Anthropic'], 3: ['Peloton Interactive'] } };
  const predicted = { predicted_by: 'test', predicted_on: '2026-10-03', companies: [{ name: 'Peloton Interactive', tier: 4, reason: 'x' }, { name: 'xAI', tier: 1, reason: 'y' }] };
  assert.deepEqual([employerTier('Peloton Interactive', persona, predicted, 'Other').value, employerTier('Peloton Interactive', persona, predicted, 'Other').source], [3, 'your-input']);
  assert.deepEqual([employerTier('xAI', persona, predicted, null).value, employerTier('xAI', persona, predicted, null).source], [1, 'model-judgment']);
  assert.equal(employerTier('Some Bank', persona, predicted, 'Other Banking and Financial Services').value, 4);
  assert.equal(employerTier('Some SaaS', persona, predicted, 'Other Technology').value, 3);
  assert.equal(employerTier('Unknown Startup', persona, predicted, null).value, 3);
  for (const ind of [null, 'Other', 'Computers', 'Biotechnology', 'Insurance']) {
    const t = employerTier('Never Heard Of', {}, null, ind);
    assert.ok(t.value >= 3 && t.confirm === true && t.source === 'model-judgment', String(ind));
  }
  assert.equal(SRC.fixture, 'fixture');
});

test('characterization of the engine (found by the student): a missing sponsorship term still yields a recommendation', () => {
  // BROKEN-no-sponsorship-roles.json leaves sponsorship out. The scorer silently drops the vote:
  // fit 0.7 x 0.30 = 0.21, just above the unpinned 0.20 Consider floor. This is why unmatched companies are HELD.
  const out = tmpdir();
  const r = spawnSync(process.execPath, [path.join(REPO, 'scripts/score/role-scorer.mjs'), fx('BROKEN-no-sponsorship-roles.json'), '--out-dir', out], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const s = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8')).roles[0];
  assert.equal(s.composite, 0.21);
  assert.equal(s.recommendation, 'Consider');
  assert.equal(s.trace.votes.some((v) => v.factor === 'sponsorship'), false);
});


// ─── DOL LCA evidence. Test extracts are written to a temp dir and marked _provenance=fixture. ───
function lcaCsv(rows, { name = 'lca-test.csv', pin = null } = {}) {
  const dir = tmpdir(); const f = path.join(dir, name);
  const cols = [...LCA_COLUMNS, '_provenance'];
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(c === '_provenance' ? 'fixture' : (r[c] ?? ''))).join(','))];
  fs.writeFileSync(f, lines.join('\n') + '\n');
  if (pin) fs.writeFileSync(path.join(dir, 'lca.checksums.lock'), pin(f));
  return f;
}
const lcaRow = (o) => ({ CASE_NUMBER: 'I-200-26000-000001', CASE_STATUS: 'Certified', VISA_CLASS: 'H-1B', JOB_TITLE: 'Product Manager', SOC_CODE: '15-1299', SOC_TITLE: 'Computer Occupations, All Other', NEW_EMPLOYMENT: 1, CONTINUED_EMPLOYMENT: 0, CHANGE_EMPLOYER: 0, WAGE_FROM_ANNUAL: 150000, PW_WAGE_LEVEL: 'II', DECISION_DATE: '2026-01-15', ...o });

test('LCA: an unmatched employer name is lca-unknown (none label), never absence', () => {
  const lca = loadLca(lcaCsv([lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' })]));
  const r = lcaEvidence('Datadog', 'DATADOG INC', 'product', lca);
  assert.equal(r.status, 'lca-unknown');
  assert.equal(r.evidence.source, 'none');
  assert.equal(r.evidence.value, null);
});

test('LCA: only a confirmed match with zero PM-family rows is absence; uncertified PM rows are not absence', () => {
  const lca = loadLca(lcaCsv([
    lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.', JOB_TITLE: 'Software Engineer' }),
    lcaRow({ EMPLOYER_NAME: 'Example Labs, Inc.', JOB_TITLE: 'Product Manager', CASE_STATUS: 'Withdrawn' }),
  ]));
  assert.equal(lcaEvidence('Stripe', 'STRIPE INC', 'product', lca).status, 'lca-confirmed-none');
  assert.equal(lcaEvidence('Example Labs', null, 'product', lca).status, 'lca-pm-uncertified');
});

test('LCA: PM-filed evidence counts same vs other family, hiring vs continuation, and is labeled by provenance', () => {
  const lca = loadLca(lcaCsv([
    lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' }),
    lcaRow({ EMPLOYER_NAME: 'STRIPE INC', CASE_NUMBER: 'I-200-26000-000002', NEW_EMPLOYMENT: 0, CONTINUED_EMPLOYMENT: 1, WAGE_FROM_ANNUAL: 170000 }),
    lcaRow({ EMPLOYER_NAME: 'Stripe Inc', CASE_NUMBER: 'I-200-26000-000003', JOB_TITLE: 'Technical Program Manager', CHANGE_EMPLOYER: 1, NEW_EMPLOYMENT: 0 }),
    lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.', CASE_NUMBER: 'I-200-26000-000004', CASE_STATUS: 'Certified-Withdrawn' }), // layout-PDF spelling
  ]));
  const r = lcaEvidence('Stripe', 'STRIPE INC', 'product', lca);
  assert.equal(r.status, 'lca-pm-filed');
  assert.equal(r.evidence.source, 'fixture'); // test data is never a record
  const v = r.evidence.value;
  assert.equal(v.certified_same_family, 2);
  assert.equal(v.certified_other_family, 1);
  assert.equal(v.certified_withdrawn, 1);
  assert.equal(v.hiring_lcas_certified, 2);
  assert.equal(v.continuation_only_certified, 1);
  assert.deepEqual(v.offered_wage_annual_certified, { min: 150000, median: 150000, max: 170000, n: 3 });
});

test('LCA: names that differ only by a missing suffix are one employer; INC vs LLC is ambiguous → HOLD', () => {
  const lca = loadLca(lcaCsv([
    lcaRow({ EMPLOYER_NAME: 'Stripe' }), lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' }),
    lcaRow({ EMPLOYER_NAME: 'Peloton Interactive, Inc.' }), lcaRow({ EMPLOYER_NAME: 'Peloton Interactive LLC' }),
  ]));
  assert.equal(lcaEvidence('Stripe', null, 'product', lca).status, 'lca-pm-filed');
  const pel = lcaEvidence('Peloton Interactive', null, 'product', lca);
  assert.equal(pel.status, 'ambiguous-lca-employer');
  assert.equal(pel.hold.reason, 'ambiguous-lca-employer');
});

test('LCA: schema drift and a hand-edited extract (checksum pin mismatch) are refused', () => {
  const drift = path.join(tmpdir(), 'drift.csv'); fs.writeFileSync(drift, 'CASE_NUMBER,EMPLOYER_NAME\nX,Y\n');
  assert.throws(() => loadLca(drift), (e) => e instanceof InputError && /schema drift/.test(e.message));
  const f = lcaCsv([lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' })], { pin: (file) => `${path.basename(file)} ${'0'.repeat(64)} 1\n` });
  assert.throws(() => loadLca(f), (e) => e instanceof InputError && /pinned checksum/.test(e.message));
});

test('LCA: lca-unknown leaves every tier and composite identical to a run without LCA data', () => {
  const none = run(baseOpts(tmpdir(), { lca: 'none' }));
  const unknown = run(baseOpts(tmpdir(), { lca: lcaCsv([lcaRow({ EMPLOYER_NAME: 'Nobody In The Shortlist, Inc.' })]) }));
  const pick = (log) => Object.fromEntries(log.roles.map((r) => [r.role_id, [r.sponsorship?.tier.value ?? null, r.decision, r.composite ?? null]]));
  assert.deepEqual(pick(unknown), pick(none));
  for (const r of unknown.roles.filter((x) => x.sponsorship)) assert.equal(r.lca.status, 'lca-unknown', r.role_id);
});

test('(d) break attempt — live guard: a live run fed a fixture LCA extract is a hard stop (exit 5), nothing written', () => {
  const live = path.join(tmpdir(), 'live.jsonl');
  fs.writeFileSync(live, JSON.stringify({ url: 'https://jobs.example.com/stripe/pm-new-grad', result: 'active', reason: null, provenance: 'record', checker: 'test' }) + '\n');
  const out = path.join(tmpdir(), 'out');
  const r = cli(liveArgs(out, { '--liveness': live, '--lca': lcaCsv([lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' })]) }));
  assert.equal(r.status, 5, r.stderr);
  assert.match(r.stderr, /LCA extract/);
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false);
});

test('backward compatibility: with LCA disabled, every v0.2.0 sample row\'s would_be_if_live equals the v0.1.1 decision and composite committed at 97f0a4a, and the HOLD rows and reasons are identical', () => {
  // Same configuration as A2's --sample: real 80 Days / BLS / Form D data (defaults), fixture shortlist,
  // persona and liveness, as-of 2026-10-03. Fixture rows are DEMO now, so the comparison is would_be_if_live.
  const golden = JSON.parse(fs.readFileSync(fx('golden-v0.1.1-sample-decisions.json'), 'utf8'));
  assert.equal(golden.source_commit, '97f0a4a');
  const log = run({ mode: 'sample', shortlist: fx('shortlist.sample.json'), persona: fx('persona.sample.json'), liveness: [fx('liveness.sample.txt')], rules: fx('rules.v0.1.1.json'), lca: 'none', out: tmpdir(), asOf: golden.as_of });
  assert.equal(log.rules.version, 'v0.1.1');
  const now = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));
  assert.deepEqual(Object.keys(now).sort(), golden.roles.map((r) => r.role_id).sort());
  for (const g of golden.roles) {
    const r = now[g.role_id];
    if (g.decision === 'HOLD') {
      assert.equal(r.decision, 'HOLD', g.role_id);
      assert.deepEqual(r.holds.map((h) => h.reason), g.hold_reasons, g.role_id);
    } else {
      assert.equal(r.decision, 'DEMO', g.role_id);
      assert.equal(r.would_be_if_live.recommendation, g.decision, g.role_id);
      assert.equal(r.would_be_if_live.composite, g.composite, g.role_id);
    }
  }
});

test('break attempt: one changed rule value (Proven 0.9 → 0.8) is caught by the backward-compatibility comparison', () => {
  const golden = JSON.parse(fs.readFileSync(fx('golden-v0.1.1-sample-decisions.json'), 'utf8'));
  const r = JSON.parse(fs.readFileSync(fx('rules.v0.1.1.json'), 'utf8')); r.tier_rules['title-family-match'].p = 0.8; r.rules_version = 'v0.1.1-mutated';
  const f = path.join(tmpdir(), 'rules.json'); fs.writeFileSync(f, JSON.stringify(r));
  const log = run({ mode: 'sample', shortlist: fx('shortlist.sample.json'), persona: fx('persona.sample.json'), liveness: [fx('liveness.sample.txt')], rules: f, lca: 'none', out: tmpdir(), asOf: golden.as_of });
  const now = Object.fromEntries(log.roles.map((x) => [x.role_id, x]));
  const differ = golden.roles.filter((g) => g.decision !== 'HOLD' && now[g.role_id].would_be_if_live.composite !== g.composite).map((g) => g.role_id);
  assert.ok(differ.includes('s01-stripe-pm-newgrad'), `expected the Proven rows to differ, got ${differ}`);
});

test('a live run must declare its rule values: no --rules → exit 2, nothing written', () => {
  const out = path.join(tmpdir(), 'out');
  const args = liveArgs(out); const i = args.indexOf('--rules'); args.splice(i, 2);
  const r = cli(args);
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /live run needs --rules/);
  assert.equal(fs.existsSync(path.join(out, 'pm-triage-log.json')), false);
});

test('sample runs label the frozen v0.1.1 rule values fixture (never your-input)', () => {
  const log = run(baseOpts(tmpdir()));
  assert.equal(log.rules.provenance, 'fixture');
  for (const r of log.roles.filter((x) => x.sponsorship)) assert.equal(r.sponsorship.p.source, 'fixture', r.role_id);
});

function lcaWithIndex(rows, indexRows) {
  const f = lcaCsv(rows, { name: 'lca-pm-filings-fy2026_q3.csv' });
  const idx = path.join(path.dirname(f), 'lca-employer-index-fy2026_q3.csv');
  fs.writeFileSync(idx, ['EMPLOYER_KEY,LEGAL_SUFFIXES,H1B_ROWS,PM_PREFILTER_ROWS,_provenance', ...indexRows.map((r) => `${r.key},${r.suffixes || ''},${r.h1b},${r.pm || 0},fixture`)].join('\n') + '\n');
  return loadLca(f);
}

test('LCA employer index: in the index with 0 PM rows → lca-confirmed-none, scoped; not in the index → lca-unknown', () => {
  const lca = lcaWithIndex([lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' })], [{ key: 'STRIPE', suffixes: 'INC', h1b: 42, pm: 1 }, { key: 'NOTION LABS', suffixes: 'INC', h1b: 31 }]);
  const notion = lcaEvidence('Notion', 'NOTION LABS INC', 'program', lca);
  assert.equal(notion.status, 'lca-confirmed-none');
  assert.equal(notion.evidence.scope, 'no PM LCA in FY2026 Q1–Q3, H-1B only');
  assert.equal(notion.evidence.value.h1b_rows_any_title, 31);
  assert.equal(notion.evidence.source, 'fixture');
  assert.equal(lcaEvidence('Anthropic', null, 'product', lca).status, 'lca-unknown');
});

test('LCA employer index: a legal-suffix split seen only in the index still HOLDs', () => {
  const lca = lcaWithIndex([], [{ key: 'PELOTON INTERACTIVE', suffixes: 'INC|LLC', h1b: 9 }]);
  assert.equal(lcaEvidence('Peloton Interactive', null, 'product', lca).status, 'ambiguous-lca-employer');
});

test('LCA human resolution: names + resolver + date + basis clear the suffix hold; no basis or an unfiled name does not', () => {
  const lca = loadLca(lcaCsv([
    lcaRow({ EMPLOYER_NAME: 'Stripe, Inc.' }),
    lcaRow({ EMPLOYER_NAME: 'Stripe, LLC', CASE_NUMBER: 'I-200-26000-000009', JOB_TITLE: 'Technical Program Manager' }),
  ]));
  const held = lcaEvidence('Stripe', 'STRIPE INC', 'product', lca);
  assert.equal(held.status, 'ambiguous-lca-employer');
  assert.deepEqual(held.per_name.map((x) => [x.name, x.status]), [['Stripe, Inc.', 'lca-pm-filed'], ['Stripe, LLC', 'lca-pm-filed']]);
  const good = { lca_employer_names: ['Stripe, LLC'], resolved_by: 'Named Reviewer', date: '2026-10-21', basis: 'test basis' };
  const r = lcaEvidence('Stripe', 'STRIPE INC', 'product', lca, undefined, good, null);
  assert.equal(r.status, 'lca-pm-filed');
  assert.deepEqual(r.evidence.value.matched_employer_names, ['Stripe, LLC']);
  assert.equal(r.evidence.matched_by.source, 'your-input');
  assert.equal(r.evidence.value.certified_same_family, 0);
  assert.equal(r.evidence.value.certified_other_family, 1);
  const noBasis = lcaEvidence('Stripe', 'STRIPE INC', 'product', lca, undefined, { ...good, basis: '  ' }, null);
  assert.equal(noBasis.status, 'ambiguous-lca-employer');
  assert.match(noBasis.hold.detail, /without a basis does not clear the hold/);
  assert.equal(lcaEvidence('Stripe', 'STRIPE INC', 'product', lca, undefined, { ...good, lca_employer_names: ['Stripe Corp'] }, null).status, 'ambiguous-lca-employer');
});
