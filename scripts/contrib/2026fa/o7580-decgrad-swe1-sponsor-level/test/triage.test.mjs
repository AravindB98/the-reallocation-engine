// Offline tests — fixtures only, no network. Run from the repo root:
//   node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/
// The end-to-end test runs the REAL scorer (scripts/score/role-scorer.mjs) on
// fixture evidence; nothing here re-implements the composite.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseCsv, normalizeName, resolveCompany, parseTitleList, classifyTitle, sponsorshipTier,
  parseLivenessLog, livenessFor, timelineFactor, formDSampleHits,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const REPO = path.resolve(DIR, '../../../..');
const FX = path.join(DIR, 'fixtures');
const rows = parseCsv(fs.readFileSync(path.join(FX, 'mini-80days.csv'), 'utf8'));
const scenario = JSON.parse(fs.readFileSync(path.join(FX, 'scenario.fixture.json'), 'utf8'));
const params = scenario.params;
const persona = scenario.persona;
const row = (name) => rows.find((r) => r.company_name === name);

test('CSV parser keeps quoted commas and doubled quotes', () => {
  assert.equal(rows.length, 11);
  const q = row('EXAMPLE QUOTED, NAME INC');
  assert.ok(q, 'quoted name with comma parsed as one field');
  assert.deepEqual(parseTitleList(q.top_job_titles_sponsored), ['Software Engineer, Platform', "Engineer's Lead"]);
});

test('name normalization is exact, suffix- and punctuation-insensitive, never fuzzy', () => {
  assert.equal(normalizeName('Example Proven Robotics, Inc.'), normalizeName('EXAMPLE PROVEN ROBOTICS INC'));
  assert.notEqual(normalizeName('Example Proven Robotic'), normalizeName('Example Proven Robotics'));
});

test('G1 company resolution: miss, ambiguous, state tie-break', () => {
  assert.equal(resolveCompany(rows, 'Nonexistent Example Co', 'MA').missing, 'no-company-match');
  assert.equal(resolveCompany(rows, 'Same State Twin', 'MA').missing, 'ambiguous-company-match');
  const tb = resolveCompany(rows, 'Twin Labs', 'MA');
  assert.equal(tb.row.company_name, 'TWIN LABS INC');
  assert.equal(resolveCompany(rows, 'Twin Labs', null).missing, 'ambiguous-company-match');
});

test('title classifier: SOC 15-1252 family, level split, QA excluded', () => {
  assert.equal(classifyTitle('Software Engineer I'), 'swe-at-level');
  assert.equal(classifyTitle('Software Engineer II'), 'swe-at-level');
  assert.equal(classifyTitle('Software Engineer 2'), 'swe-at-level');
  assert.equal(classifyTitle('Software Engineer III'), 'swe-above-level');
  assert.equal(classifyTitle('Sr. Software Engineer'), 'swe-above-level');
  assert.equal(classifyTitle('Software Engineering Manager'), 'other', 'management occupation, not 15-1252');
  assert.equal(classifyTitle('Director of Software Development'), 'other');
  assert.equal(classifyTitle('Staff Software Engineer/Team Lead Manager'), 'swe-above-level', 'an IC engineer title that also manages stays SWE');
  assert.equal(classifyTitle('Software Test Engineer'), 'other');
  assert.equal(classifyTitle('SOFTWARE ENGINEER/QA'), 'other');
  assert.equal(classifyTitle('Scientist II'), 'other');
});

test('G2 sponsorship tiers from records; blank is NOT zero', () => {
  assert.equal(sponsorshipTier(row('EXAMPLE PROVEN ROBOTICS INC'), params).tier, 'Proven');
  assert.equal(sponsorshipTier(row('EXAMPLE SENIOR ONLY INC'), params).tier, 'Likely');
  const thin = sponsorshipTier(row('EXAMPLE THIN RECORD LLC'), params);
  assert.equal(thin.tier, 'Likely');
  assert.match(thin.basis, /thin record/);
  assert.equal(sponsorshipTier(row('EXAMPLE NO SWE TITLES CORP'), params).tier, 'Possible');
  const zero = sponsorshipTier(row('EXAMPLE ZERO APPROVALS INC'), params);
  assert.equal(zero.tier, 'None');
  assert.equal(zero.p, 0);
  const blank = sponsorshipTier(row('EXAMPLE BLANK RECORD INC'), params);
  assert.equal(blank.missing, 'no-sponsorship-record');
  assert.equal(blank.p, undefined, 'no p value is invented for a blank record');
});

test('tier map with a hole fails instead of defaulting', () => {
  const broken = { ...params, tier_p: { Proven: 0.9 } };
  assert.equal(sponsorshipTier(row('EXAMPLE SENIOR ONLY INC'), broken).missing, 'no-tier-mapping');
});

test('G3 liveness: parsed from saved checker output; uncertain and unlisted are not guessed', () => {
  const lv = parseLivenessLog(fs.readFileSync(path.join(FX, 'liveness.fixture.log'), 'utf8'));
  assert.equal(livenessFor(lv, 'https://example.com/jobs/proven').factor, 1);
  const exp = livenessFor(lv, 'https://example.com/jobs/expired');
  assert.equal(exp.factor, 0);
  assert.match(exp.reason, /no longer accepting/);
  assert.equal(livenessFor(lv, 'https://example.com/jobs/uncertain').missing, 'liveness-uncertain');
  assert.equal(livenessFor(lv, 'https://example.com/jobs/never-checked').missing, 'no-liveness-record');
  assert.equal(livenessFor(lv, null).missing, 'no-liveness-record');
  assert.match(lv.meta.ran, /FIXTURE/);
});

test('G4 timeline: open, soft, and every closure', () => {
  const open = timelineFactor(persona, { posting: {} }, params, '2026-10-01');
  assert.equal(open.expected_start, '2027-01-04');
  assert.equal(open.unemployment_deadline, '2027-03-21'); // 2027-01-04 + (90 - 0 - 14) days
  assert.equal(open.slack_days, 76);
  assert.equal(open.factor, 1);

  const soft = timelineFactor(persona, { hiring_lag_days: 160, posting: {} }, params, '2026-10-01');
  assert.equal(soft.slack_days, 11);
  assert.equal(soft.factor, Number((11 / 30).toFixed(3)));

  const late = timelineFactor({ ...persona, unemployment_days_used: 42 }, { posting: {} }, params, '2027-02-15');
  assert.equal(late.factor, 0);
  assert.match(late.closures[0], /^unemployment-clock-exceeded/);

  const flag = timelineFactor(persona, { posting: {} }, params, '2027-02-15');
  assert.match(flag.flags[0], /unemployment_days_used is 0/);

  const gw = timelineFactor(persona, { posting: { grad_window: { earliest: '2027-03', latest: '2027-06' } } }, params, '2026-10-01');
  assert.equal(gw.factor, 0);
  assert.match(gw.closures[0], /^grad-window-excludes/);
  const gwOk = timelineFactor(persona, { posting: { grad_window: { earliest: '2026-08', latest: '2027-08' } } }, params, '2026-10-01');
  assert.equal(gwOk.factor, 1);

  assert.match(timelineFactor(persona, { posting: { experience_cap_months: 6 } }, params, '2026-10-01').closures[0], /^experience-cap-excludes/);
  assert.match(timelineFactor(persona, { posting: { start_date: '2026-11-15' } }, params, '2026-10-01').closures[0], /^start-before-work-authorization/);
});

test('Form D context: shipped-sample lookup only, exact normalized match', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(FX, 'form-d/companies-sec-fixture-d.sample.json'), 'utf8'));
  assert.equal(formDSampleHits([doc], normalizeName('Example Proven Robotics Inc')).length, 1);
  assert.equal(formDSampleHits([doc], normalizeName('Example Senior Only Inc')).length, 0);
});

test('prototype source makes no network calls', () => {
  for (const f of ['lib.mjs', 'triage.mjs']) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.doesNotMatch(src, /node:https?['"]|from ['"]https?['"]|\bfetch\(|playwright|XMLHttpRequest/, `${f} must stay offline`);
  }
});

function runTriage(args) {
  return spawnSync(process.execPath, [path.join(DIR, 'triage.mjs'), ...args], { cwd: REPO, encoding: 'utf8' });
}

test('end-to-end on fixtures through the REAL scorer', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'o7580-triage-'));
  const r = runTriage(['--scenario', path.join(FX, 'scenario.fixture.json'), '--liveness-log', path.join(FX, 'liveness.fixture.log'),
    '--csv', path.join(FX, 'mini-80days.csv'), '--form-d-dir', path.join(FX, 'form-d'), '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['roles.json', 'role-scores.json', 'role-scores.md', 'triage-log.json', 'triage-report.md']) assert.ok(fs.existsSync(path.join(out, f)), `${f} written`);

  const log = JSON.parse(fs.readFileSync(path.join(out, 'triage-log.json'), 'utf8'));
  const scores = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer', 'output came from the maintained scorer');
  assert.equal(scores.profile_needs_sponsorship, true);
  const by = Object.fromEntries(log.roles.map((e) => [e.role_id, e]));

  // gates zero the composite no matter how strong the votes (fit 0.9, Proven)
  assert.equal(by['proven-expired'].decision.recommendation, 'Skip');
  assert.match(by['proven-expired'].decision.reason, /gated: liveness/);
  assert.match(by['proven-expired'].next_action, /NETWORK, DON'T APPLY/);
  for (const id of ['grad-window-excluded', 'experience-cap-excluded', 'start-before-opt']) {
    assert.equal(by[id].decision.recommendation, 'Skip', id);
    assert.match(by[id].decision.reason, /gated: timeline/, id);
  }
  // a soft timeline cannot be an Apply
  assert.notEqual(by['slow-hiring'].decision.recommendation, 'Apply');
  // senior-only sponsor is a soft spot → never Apply
  assert.notEqual(by['senior-only-live'].decision.recommendation, 'Apply');
  // the posting's own no-sponsorship statement overrides the record, visibly
  assert.equal(by['no-sponsor-statement'].decision.recommendation, 'Skip');
  assert.equal(by['no-sponsor-statement'].decision.machine_recommendation, 'Apply');

  // failure cases are reported, never scored, never given an invented number
  const expectMissing = {
    'missing-company': 'no-company-match', 'blank-record': 'no-sponsorship-record', 'ambiguous-same-state': 'ambiguous-company-match',
    'proven-uncertain': 'liveness-uncertain', 'url-not-checked': 'no-liveness-record', 'no-fit': 'no-fit-input',
  };
  const roles = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  for (const [id, code] of Object.entries(expectMissing)) {
    assert.equal(by[id].decision.recommendation, 'Not scored', id);
    assert.ok(by[id].missing.some((m) => m.missing === code), `${id} → ${code}`);
    assert.ok(!roles.some((x) => x.role_id === id), `${id} must not reach the scorer`);
  }
  // every scorer input term is a real number with a source label
  for (const x of roles) {
    for (const k of ['sponsorship', 'fit']) { assert.equal(typeof x[k].p, 'number'); assert.ok(['record', 'your-input', 'model-judgment'].includes(x[k].source)); }
    for (const k of ['liveness', 'timeline']) { assert.equal(typeof x[k].factor, 'number', `${x.role_id} ${k}.factor`); assert.ok(x[k].source); }
  }
  assert.equal(log.model_judgments_used, 0);
  const md = fs.readFileSync(path.join(out, 'triage-report.md'), 'utf8');
  assert.match(md, /^# .*\n\n## Executive summary/);
  fs.rmSync(out, { recursive: true, force: true });
});

test('G0: incomplete persona fails clearly and writes nothing', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'o7580-g0-'));
  const bad = path.join(out, 'bad.json');
  const s = JSON.parse(JSON.stringify(scenario));
  delete s.persona.opt_start_date;
  fs.writeFileSync(bad, JSON.stringify(s));
  const r = runTriage(['--scenario', bad, '--liveness-log', path.join(FX, 'liveness.fixture.log'), '--csv', path.join(FX, 'mini-80days.csv'), '--out-dir', path.join(out, 'o')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /missing opt_start_date — refusing to default/);
  assert.ok(!fs.existsSync(path.join(out, 'o')), 'no output directory created');
  fs.rmSync(out, { recursive: true, force: true });
});

test('refuses to write over tracked repo paths', () => {
  const r = runTriage(['--scenario', path.join(FX, 'scenario.fixture.json'), '--liveness-log', path.join(FX, 'liveness.fixture.log'),
    '--csv', path.join(FX, 'mini-80days.csv'), '--out-dir', path.join(REPO, 'data/examples')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /refusing --out-dir/);
});
