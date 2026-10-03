// opt-countdown.test.mjs — offline tests (node --test). No network: every input is a
// fixture in ./fixtures, and the only child process is the repo's own scorer.
//
//   node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseCsv, parseDate, optWindow, timelineFactor, normName, indexCompanies, lookupCompany,
  sponsorshipTier, parseLivenessLog, parseTitles, GateError,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const FX = (f) => path.join(HERE, 'fixtures', f);
const profile = JSON.parse(fs.readFileSync(FX('profile.fixture.json'), 'utf8'));
const asOf = parseDate('2026-09-30', 'asOf');
const win = optWindow(profile, asOf);
const R = profile.rules;

test('parseCsv keeps commas inside quoted fields', () => {
  const rows = parseCsv('a,b\n"x, y",2\n');
  assert.deepEqual(rows, [{ a: 'x, y', b: '2' }]);
});

test('G0: window is OPT start + 90 days', () => {
  assert.equal(win.unemployment_deadline.value, '2027-08-30');
  assert.equal(win.unemployment_deadline.label, 'your-input');
});

test('G0: a closed window throws a GateError instead of returning a value', () => {
  assert.throws(() => optWindow(profile, parseDate('2027-09-15', 'x')), GateError);
  assert.throws(() => optWindow({ ...profile, opt_start_date: '2027-08-01' }, asOf), /60/);
  assert.throws(() => optWindow({ ...profile, opt_start_date: '2027-05-01' }, asOf), /before program end/);
  assert.throws(() => parseDate('2027-02-30', 'x'), /not a real calendar date/);
});

test('G3: timeline factor — open, soft, closed-early, closed-late', () => {
  const t = (role) => timelineFactor({ role_id: 't', ...role }, win, asOf, R);
  assert.equal(t({ start_date: '2027-06-14' }).factor, 1.0);
  const soft = t({ start_date: '2027-08-16' });
  assert.equal(soft.factor, R.soft_factor); assert.equal(soft.state, 'soft');
  assert.ok(soft.factor < 0.6, 'soft factor must stay below 0.6 so the scorer demotes Apply→Consider');
  assert.equal(t({ start_date: 'asap' }).factor, 0);
  assert.equal(t({ start_date: '2027-03-01' }).factor, 0);
  assert.equal(t({ start_date: '2027-03-01', start_flexible: true }).factor, 1.0);
  assert.equal(t({ start_date: '2027-10-04' }).factor, 0);
  // a very long hiring lag pushes the earliest start past the deadline
  assert.equal(t({ start_date: '2027-06-14', hiring_lag_days: 400 }).factor, 0);
});

test('G1: name normalization is exact after suffix stripping, never fuzzy', () => {
  assert.equal(normName('Sigma Computing, Inc.'), 'SIGMA COMPUTING');
  assert.equal(normName('GUSTO INC'), normName('Gusto'));
  const idx = indexCompanies(parseCsv(fs.readFileSync(FX('companies.fixture.csv'), 'utf8')));
  assert.equal(lookupCompany(idx, 'Gusto').status, 'ok');
  assert.equal(lookupCompany(idx, 'Gust').status, 'company-not-found');
  assert.equal(lookupCompany(idx, 'Acme Data').status, 'ambiguous-company-match');
});

test('sponsorship tier comes from record counts via the stated rule', () => {
  const idx = indexCompanies(parseCsv(fs.readFileSync(FX('companies.fixture.csv'), 'utf8')));
  const gusto = sponsorshipTier(lookupCompany(idx, 'Gusto').row, R);
  assert.equal(gusto.tier, 'Proven');
  assert.equal(gusto.raw.total_approvals.label, 'record');
  const haus = sponsorshipTier(lookupCompany(idx, 'Haus Analytics').row, R);
  assert.equal(haus.tier, 'None');
  assert.match(haus.none_caveat, /Absence of a record/);
  assert.deepEqual(parseTitles("['A, B', \"C\"]"), ['A, B', 'C']);
});

test('v0.1.1: an engineer or data-scientist title alone does not make a company Proven for analysts', () => {
  const row = { 'Total Approvals': '136.0', 'Total Denials': '0.0', Approval_Rate: '100', top_job_titles_sponsored: "['Software Engineer', 'Senior Analytics Engineer', 'Data Scientist, Product Analytics']" };
  const t = sponsorshipTier(row, R);
  assert.equal(t.tier, 'Likely');
  assert.deepEqual(t.raw.analyst_titles_matched.value, []);
  const ok = sponsorshipTier({ ...row, top_job_titles_sponsored: "['BI Developer', 'Senior Analyst, Marketing Analytics']" }, R);
  assert.equal(ok.tier, 'Proven');
});

test('liveness log parser reads real ats:liveness stdout shape', () => {
  const m = parseLivenessLog(fs.readFileSync(FX('ats-liveness-output.fixture.txt'), 'utf8'));
  assert.equal(m.size, 3);
  assert.equal(m.get('https://jobs.lever.co/remitly/FIXTURE-2'), 'expired');
});

function runCli(extra) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'optcd-'));
  const args = [path.join(HERE, 'opt-countdown.mjs'),
    '--profile', FX('profile.fixture.json'), '--roles', FX('roles.fixture.json'),
    '--csv', FX('companies.fixture.csv'), '--soc', FX('soc.fixture.csv'), '--formd-dir', FX('formd'),
    '--liveness-log', FX('ats-liveness-output.fixture.txt'), '--liveness-date', '2026-09-30',
    '--out-dir', path.join(out, 'run'), ...extra];
  const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8' });
  return { ...r, out: path.join(out, 'run') };
}

test('end to end: named failure cases block, gates zero, real scorer runs', () => {
  const r = runCli([]);
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'opt-countdown-log.json'), 'utf8'));
  const by = Object.fromEntries(log.roles.map((e) => [e.role_id, e]));

  // blocked — never scored, never given an invented value
  assert.equal(by['company-missing'].blocked_reason, 'company-not-found');
  assert.equal(by['ambiguous-company'].blocked_reason, 'ambiguous-company-match');
  assert.equal(by['uncertain-from-log'].blocked_reason, 'liveness-uncertain');
  assert.equal(by['fit-missing'].blocked_reason, 'fit-missing');
  assert.match(by['liveness-stale'].blocked_reason, /liveness-stale/);
  assert.equal(by['break-record-without-date'].blocked_reason, 'liveness-undated');

  // gates zero the composite via the real scorer
  assert.equal(by['expired-from-log'].decision, 'Skip');
  assert.equal(by['expired-from-log'].gates.G2_liveness.label, 'record');
  assert.equal(by['starts-after-deadline'].composite, 0);
  assert.equal(by['starts-asap'].composite, 0);

  // a missing SOC row does not invent a wage, and does not block scoring
  assert.equal(by['soc-missing'].context.soc.status, 'missing');
  assert.equal(by['soc-missing'].status, 'scored');

  // the scorer input contains ONLY scored roles, and every term carries a source label
  const roles = JSON.parse(fs.readFileSync(path.join(r.out, 'roles.json'), 'utf8'));
  const ok = new Set(['record', 'your-input', 'model-judgment']);
  assert.equal(roles.length, log.roles.filter((e) => e.status === 'scored').length);
  for (const x of roles) for (const k of ['sponsorship', 'fit', 'liveness', 'timeline']) assert.ok(ok.has(x[k].source), `${x.role_id}.${k}`);

  // both outputs exist; the human report opens with an executive summary
  const md = fs.readFileSync(path.join(r.out, 'opt-countdown-report.md'), 'utf8');
  assert.match(md.split('\n').slice(0, 4).join('\n'), /## Executive summary/);
  assert.ok(fs.existsSync(path.join(r.out, 'role-scores.json')), 'the repo scorer wrote its output');
});

test('G0 end to end: a closed OPT window exits 3 and writes nothing', () => {
  const r = runCli(['--as-of', '2027-09-15']);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /OPT window already closed/);
  assert.equal(fs.existsSync(r.out), false);
});

test('refuses to write into a maintained repo folder', () => {
  const r = spawnSync(process.execPath, [path.join(HERE, 'opt-countdown.mjs'), '--out-dir', 'data/examples'], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /refusing to write/);
});

test('no network code in the prototype', () => {
  for (const f of ['lib.mjs', 'opt-countdown.mjs']) {
    const src = fs.readFileSync(path.join(HERE, f), 'utf8');
    assert.doesNotMatch(src, /\bfetch\(|node:https?|from 'https?'|playwright/, f);
  }
});
