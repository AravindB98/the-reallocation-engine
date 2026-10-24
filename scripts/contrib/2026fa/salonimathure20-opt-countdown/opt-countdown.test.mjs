// opt-countdown.test.mjs — offline tests (no network): node --test <this file>
// Unit tests pin the gate rules; end-to-end tests run the real CLI against
// fixtures/test/ and check that the EXISTING scorer produced the decisions.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LABELS, parseCsv, sponsorshipFromRow, runway, timelineFactor,
  parseLivenessOutput, parseGreenhouseApi, livenessGate,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures/test');
const CLI = path.join(HERE, 'opt-countdown.mjs');
const fx = (f) => path.join(FX, f);
const rows = parseCsv(fs.readFileSync(fx('sponsors-mini.csv'), 'utf8'));
const row = (name) => rows.find((r) => r.company_name === name);

function run(extra = [], personaPath = fx('persona.json')) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'optc-'));
  const r = spawnSync(process.execPath, [CLI, '--persona', personaPath, '--candidates', fx('candidates.json'),
    '--liveness', fx('liveness.txt'), '--greenhouse-api', fx('greenhouse-api.txt'),
    '--sponsors-csv', fx('sponsors-mini.csv'), '--soc-csv', fx('soc-mini.csv'), '--out-dir', out, ...extra], { encoding: 'utf8' });
  return { ...r, out, read: (f) => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')) };
}

function personaWith(visaPatch) {
  const p = JSON.parse(fs.readFileSync(fx('persona.json'), 'utf8'));
  Object.assign(p.visa, visaPatch);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'optc-p-')), 'persona.json');
  fs.writeFileSync(f, JSON.stringify(p));
  return f;
}

test('CSV parser keeps quoted commas inside one field', () => {
  assert.match(row('KLAVIYO INC').top_job_titles_sponsored, /Business Intelligence Engineer', 'Software Engineer II/);
});

test('sponsorship: record row → p from the documented formula, tier Proven', () => {
  const s = sponsorshipFromRow(row('KLAVIYO INC'), ['data']);
  assert.equal(s.status, 'ok');
  assert.equal(s.p, Number((0.9746835443037976 * 1).toFixed(3)));
  assert.equal(s.tier, 'Proven');
  assert.equal(s.source, 'record');
});

test('sponsorship: blank H-1B columns → missing/Unknown, never p = 0', () => {
  const s = sponsorshipFromRow(row('DRAFTKINGS INC'));
  assert.equal(s.status, 'missing');
  assert.equal(s.reason, 'no-h1b-record-joined');
  assert.equal(s.p, undefined);
});

test('sponsorship: company absent from CSV → no-company-row', () => {
  assert.deepEqual(sponsorshipFromRow(undefined), { status: 'missing', reason: 'no-company-row' });
});

test('runway: binds on the tighter of OPT end date and unemployment clock', () => {
  const r = runway({ as_of: '2026-10-03', visa: { opt_end_date: '2027-06-30', unemployment_ceiling: 90, unemployment_days_used: 27, buffer_target: 10 } });
  assert.equal(r.days, 53);
  assert.equal(r.binding, 'unemployment-clock');
  const r2 = runway({ as_of: '2026-10-03', visa: { opt_end_date: '2026-10-20', unemployment_ceiling: 90, unemployment_days_used: 0, buffer_target: 0 } });
  assert.equal(r2.days, 17);
  assert.equal(r2.binding, 'opt-end-date');
});

test('runway: OPT end date already past → halt', () => {
  const r = runway({ as_of: '2026-10-03', visa: { opt_end_date: '2026-09-30', unemployment_ceiling: 90, unemployment_days_used: 0, buffer_target: 0 } });
  assert.equal(r.status, 'halt');
  assert.equal(r.reason, 'opt-end-date-already-past');
});

test('timeline: negative slack closes the gate; ≥30 days slack is full credit', () => {
  assert.equal(timelineFactor(53, 60).factor, 0);
  assert.equal(timelineFactor(53, 53).factor, 0.5);
  assert.equal(timelineFactor(90, 60).factor, 1);
  assert.equal(timelineFactor(53, undefined).status, 'missing');
});

test('liveness: checker "active" + Greenhouse API 404 → closed gate (redirect false positive)', () => {
  const checker = parseLivenessOutput(fs.readFileSync(fx('liveness.txt'), 'utf8'));
  const api = parseGreenhouseApi(fs.readFileSync(fx('greenhouse-api.txt'), 'utf8'));
  const g = livenessGate('https://example.org/jobs/2', checker, 'klaviyo/222', api);
  assert.equal(g.factor, 0);
  assert.match(g.flags[0], /checker said "active", Greenhouse API said 404/);
});

test('liveness: uncertain with no API record → missing, not a guessed factor', () => {
  const checker = parseLivenessOutput(fs.readFileSync(fx('liveness.txt'), 'utf8'));
  assert.equal(livenessGate('https://example.org/jobs/6', checker, null, new Map()).reason, 'liveness-uncertain');
  assert.equal(livenessGate('https://example.org/jobs/never-checked', checker, null, new Map()).reason, 'liveness-unchecked');
});

test('end to end: real scorer runs, every term labeled, blocked roles never reach it', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  const scores = r.read('role-scores.json');
  assert.equal(scores._scorer, 'bayesian-role-scorer'); // written by scripts/score/role-scorer.mjs, not a copy
  const roles = r.read('roles.json');
  for (const role of roles)
    for (const k of ['sponsorship', 'fit', 'liveness', 'timeline']) assert.ok(LABELS.has(role[k].source), `${role.role_id}.${k} unlabeled`);
  const ids = roles.map((x) => x.role_id);
  for (const blocked of ['t-blank-h1b', 't-not-in-csv', 't-no-liveness']) assert.ok(!ids.includes(blocked), `${blocked} was scored`);
  const log = r.read('opt-countdown-log.json');
  const by = Object.fromEntries(log.roles.map((x) => [x.role_id, x]));
  assert.equal(by['t-ghost'].decision.recommendation, 'Skip');
  assert.equal(by['t-ghost'].gated_by, 'liveness');
  assert.equal(by['t-unknown-soc'].role_quality_context.reason, 'no-occupation-row');
  assert.ok(by['t-not-in-csv'].blocked.some((b) => b.includes('no-company-row')));
  assert.ok(fs.existsSync(path.join(r.out, 'opt-countdown-report.md')));
});

test('end to end: OPT end date in the past halts with exit 3 and scores nothing', () => {
  const r = run([], personaWith({ opt_end_date: '2026-09-01' }));
  assert.equal(r.status, 3);
  assert.match(r.stderr, /HALT at gate G1/);
  assert.ok(!fs.existsSync(path.join(r.out, 'roles.json')));
  assert.equal(r.read('opt-countdown-log.json').status, 'halted');
});

test('end to end: an unlabeled fit value is rejected as bad input (exit 2)', () => {
  const c = JSON.parse(fs.readFileSync(fx('candidates.json'), 'utf8'));
  c.roles[0].fit.source = 'gut-feeling';
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'optc-c-')), 'c.json');
  fs.writeFileSync(f, JSON.stringify(c));
  const r = run(['--candidates', f]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /fit.source must be one of/);
});
