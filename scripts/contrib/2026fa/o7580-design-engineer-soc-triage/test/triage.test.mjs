// Offline tests for the design-engineer SOC triage. Fixtures only — no network.
//   node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs
// The scorer is the maintained scripts/score/role-scorer.mjs, called as a CLI;
// nothing here re-implements the composite.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  classifyTitle, laneFor, sponsorshipTier, socReadout, eligibilityTimeline, fitFor, parseCsv, resolveCompany,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const FX = path.join(DIR, 'fixtures');
const csv = parseCsv(fs.readFileSync(path.join(FX, 'mini-80days.csv'), 'utf8'));
const bls = parseCsv(fs.readFileSync(path.join(FX, 'mini-bls.csv'), 'utf8'));
const scenario = JSON.parse(fs.readFileSync(path.join(FX, 'scenario.fixture.json'), 'utf8'));
const params = scenario.params;
const row = (name) => csv.find((r) => r.company_name === name);
const tmp = () => fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'de-soc-'));
const cli = (extra) => spawnSync(process.execPath, [path.join(DIR, 'triage.mjs'),
  '--scenario', path.join(FX, 'scenario.fixture.json'), '--liveness-log', path.join(FX, 'liveness.fixture.log'),
  '--csv', path.join(FX, 'mini-80days.csv'), '--bls', path.join(FX, 'mini-bls.csv'), ...extra], { encoding: 'utf8' });

test('hardware "design engineer" titles never reach the UX families', () => {
  for (const t of ['Mechanical Design Engineer', 'ASIC Design Engineer II', 'Senior Hardware Design Engineer', 'Design Verification Engineer', 'RTL Design Engineer']) {
    assert.equal(classifyTitle(t).family, 'hardware-design', t);
  }
});

test('the "Sioux" trap: a word-boundary classifier does not read "ux" inside a place name', () => {
  assert.equal(classifyTitle('Territory Account Executive, Retail - Sioux Falls').family, 'unrelated');
});

test('the audit misfire stays fixed: a field solutions role is not front-end engineering', () => {
  assert.equal(classifyTitle('Solution Engineer Frontend/Backend - Field Services').family, 'unrelated');
  assert.equal(classifyTitle('Sales Engineer').family, 'unrelated');
  assert.equal(classifyTitle('Front End Engineer').family, 'ui-engineering');
});

test('lane families and levels for real posting titles', () => {
  assert.equal(classifyTitle('Web Design Engineer').family, 'hybrid-design-engineering');
  assert.equal(classifyTitle('Software Engineer II, Frontend').family, 'ui-engineering');
  assert.equal(classifyTitle('Product Designer, New Grad - US Government').family, 'ux-design');
  assert.equal(classifyTitle('Industrial Designer').family, 'industrial-design');
  assert.equal(classifyTitle('Head of Design').family, 'management');
  assert.equal(classifyTitle('Product Designer II').above_level, false);
  assert.equal(classifyTitle('Senior Product Designer').above_level, true);
});

test('an ambiguous title is not scored; an override needs a basis', () => {
  assert.equal(laneFor({ title: 'Designer' }).missing, 'ambiguous-title-family');
  assert.equal(laneFor({ title: 'Designer', family_override: { family: 'ux-design' } }).missing, 'bad-family-override');
  const ok = laneFor({ title: 'Designer', family_override: { family: 'ux-design', basis: 'posting describes Figma product flows' } });
  assert.equal(ok.family, 'ux-design');
  assert.equal(ok.label, 'your-input');
});

test('sponsorship is family-matched and level-matched', () => {
  assert.equal(sponsorshipTier(row('FIXTURE DESIGNCO INC'), 'ux-design', params).tier, 'Proven');
  const senior = sponsorshipTier(row('FIXTURE SENIORDESIGN INC'), 'ux-design', params);
  assert.equal(senior.tier, 'Likely');
  assert.match(senior.basis, /only above/);
  // a company that sponsors software engineers is evidence for a front-end posting, not for a product-design one
  assert.equal(sponsorshipTier(row('FIXTURE SWEONLY LLC'), 'ui-engineering', params).tier, 'Proven');
  assert.equal(sponsorshipTier(row('FIXTURE SWEONLY LLC'), 'ux-design', params).tier, 'Possible');
  // a hardware sponsor's "design" titles are not design evidence
  assert.equal(sponsorshipTier(row('FIXTURE HARDWARE CORP'), 'ux-design', params).tier, 'Possible');
  assert.equal(sponsorshipTier(row('FIXTURE ZERO INC'), 'ux-design', params).tier, 'None');
});

test('a blank approvals field is absence of a record, never zero', () => {
  const t = sponsorshipTier(row('FIXTURE BLANK INC'), 'ui-engineering', params);
  assert.equal(t.missing, 'no-sponsorship-record');
  assert.equal(t.tier, undefined);
});

test('company resolution is exact; state only breaks a tie', () => {
  assert.equal(resolveCompany(csv, 'Fixture Twin Inc').missing, 'ambiguous-company-match');
  assert.equal(resolveCompany(csv, 'Fixture Twin Inc', 'TX').row.state, 'TX');
  assert.equal(resolveCompany(csv, 'Fixture Desgnco').missing, 'no-company-match');
});

test('15-1255.00 is refused, and its sibling 15-1255.01 score is NOT borrowed', () => {
  const r = socReadout(bls, ['15-1255.00', '27-1021.00', '27-1024.00']);
  assert.equal(r.candidates[0].cognitive_pivot_score, null);
  assert.match(r.candidates[0].cognitive_pivot_status, /^refused/);
  assert.equal(r.primary_refused, true);
  const sibling = bls.find((x) => x.onet_soc_code === '15-1255.01');
  assert.notEqual(sibling.cognitive_pivot_score, '');           // the tempting number exists…
  assert.ok(!r.candidates.some((c) => c.cognitive_pivot_score === Number(sibling.cognitive_pivot_score))); // …and is not used
  assert.equal(r.wage_spread.gap, 98090 - 61300);
});

test('a missing SOC row is reported, not filled', () => {
  const broken = parseCsv(fs.readFileSync(path.join(FX, 'BROKEN-bls-no-15-1255.csv'), 'utf8'));
  assert.equal(socReadout(broken, ['15-1255.00']).candidates[0].missing, 'no-soc-row');
});

test('eligibility gate: 2027-only grad window, clearance, and the OPT clock close; a 3+ years ask only flags', () => {
  const p = scenario.persona;
  assert.match(eligibilityTimeline(p, { posting: { grad_window: { earliest: '2027-01', latest: '2027-12', quote: 'q' } } }, params, '2026-10-19').closures[0], /^grad-window-excludes/);
  assert.match(eligibilityTimeline(p, { posting: { requires_clearance_or_citizenship: { quote: 'q' } } }, params, '2026-10-19').closures[0], /^requires-clearance/);
  const min = eligibilityTimeline(p, { posting: { experience_min_months: 36 } }, params, '2026-10-19');
  assert.equal(min.closures.length, 0);
  assert.match(min.flags[0], /^below-stated-minimum/);
  const late = eligibilityTimeline({ ...p, unemployment_days_used: 56 }, {}, params, '2027-03-01');
  assert.equal(late.factor, 0);
  assert.match(late.closures[0], /^unemployment-clock-exceeded/);
  assert.equal(eligibilityTimeline(p, {}, params, '2026-10-19').factor, 1);
});

test('an AI-drafted fit is labeled model-judgment until a person confirms it', () => {
  assert.equal(fitFor({ fit: { p: 0.5, drafted_by: 'agent' } }).label, 'model-judgment');
  assert.equal(fitFor({ fit: { p: 0.5, confirmed_by: 'me' } }).label, 'your-input');
  assert.equal(fitFor({ fit: { p: 1.5 } }).missing, 'no-fit-input');
});

test('end to end on fixtures: outcomes, labels, and the real scorer', () => {
  const out = tmp();
  const run = cli(['--out-dir', out]);
  assert.equal(run.status, 0, run.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'triage-log.json'), 'utf8'));
  const by = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));
  assert.equal(by['designco-pd'].outcome, 'Apply');
  assert.equal(by['seniordesign-pd'].outcome, 'Consider');            // senior-only design sponsor
  assert.equal(by['hardware-de'].outcome, 'Skip (out of lane)');
  assert.equal(by['scanner-noise'].outcome, 'Skip (out of lane)');
  assert.equal(by['ambiguous'].outcome, 'Not scored');
  assert.deepEqual(by['blank-fe'].missing.map((m) => m.missing).sort(), ['liveness-uncertain', 'no-sponsorship-record']);
  assert.equal(by['designco-dead'].outcome, 'Skip');                  // liveness gate closed
  assert.match(by['designco-dead'].decision.reason, /gated: liveness/);
  assert.equal(by['designco-newgrad'].outcome, 'Skip');               // grad-window gate closed
  const roles = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  assert.ok(!roles.some((r) => r.role_id === 'hardware-de' || r.role_id === 'scanner-noise'), 'out-of-lane rows never reach the scorer');
  for (const r of roles) for (const k of ['sponsorship', 'fit']) assert.ok(r[k].source, `${r.role_id}.${k} carries a source label`);
  assert.equal(roles.find((r) => r.role_id === 'seniordesign-pd').fit.source, 'model-judgment');
  assert.ok(fs.readFileSync(path.join(out, 'triage-report.md'), 'utf8').startsWith('# Design-engineer SOC triage'));
  assert.ok(fs.readFileSync(path.join(out, 'triage-report.md'), 'utf8').includes('## Executive summary'));
});

test('G0: a corrupt scenario exits 2 and writes nothing', () => {
  const out = path.join(tmp(), 'should-not-exist');
  const bad = path.join(tmp(), 'bad.json');
  fs.writeFileSync(bad, '{ "persona": ');
  const run = spawnSync(process.execPath, [path.join(DIR, 'triage.mjs'), '--scenario', bad, '--liveness-log', path.join(FX, 'liveness.fixture.log'), '--out-dir', out], { encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.equal(fs.existsSync(out), false);
});

test('G0: a persona without an OPT start date is refused, not defaulted', () => {
  const s = JSON.parse(JSON.stringify(scenario));
  delete s.persona.opt_start_date;
  const p = path.join(tmp(), 's.json');
  fs.writeFileSync(p, JSON.stringify(s));
  const out = path.join(tmp(), 'x');
  const run = spawnSync(process.execPath, [path.join(DIR, 'triage.mjs'), '--scenario', p, '--liveness-log', path.join(FX, 'liveness.fixture.log'), '--out-dir', out], { encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /opt_start_date/);
  assert.equal(fs.existsSync(out), false);
});

test('a temp out-dir reached through a symlink (macOS /var → /private/var) is accepted', () => {
  const viaSymlink = fs.mkdtempSync(path.join(os.tmpdir(), 'de-soc-link-'));  // NOT realpath'd
  const run = cli(['--out-dir', path.join(viaSymlink, 'nested')]);
  assert.equal(run.status, 0, run.stderr);
  assert.ok(fs.existsSync(path.join(viaSymlink, 'nested', 'triage-log.json')));
});

test('out-dir outside the contributor namespaces is refused (also when the repo itself sits in the temp dir)', () => {
  const run = cli(['--out-dir', path.resolve(DIR, '../../../../reports/generated/nope')]);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /out-dir must sit under/);
});
