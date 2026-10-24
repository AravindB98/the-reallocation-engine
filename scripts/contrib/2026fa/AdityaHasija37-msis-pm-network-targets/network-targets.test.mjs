// network-targets.test.mjs — offline tests (node --test). No network calls: board
// responses are replayed from fixtures/test-responses/ through the repo's real
// provider modules, and scoring runs the repo's real scorer CLI.
//
//   node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { titleRule, locationRule, sponsorshipTier, parseTitleList, timelineGate, buildRole, StopError } from './rules.mjs';
import { offlineCtx } from './network-targets.mjs';
import greenhouse from '../../../ats/providers/greenhouse.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const CLI = path.join(HERE, 'network-targets.mjs');

function runCli(args) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-nt-'));
  const r = spawnSync(process.execPath, [CLI, ...args, '--out', out], { encoding: 'utf8' });
  return { ...r, out };
}
const offlineArgs = (persona = 'persona.test.json') => [
  '--persona', path.join(FX, persona), '--boards', path.join(FX, 'boards.test.json'),
  '--csv', path.join(FX, 'companies.fixture.csv'), '--offline', path.join(FX, 'test-responses'),
  '--run-date', '2026-10-03',
];

// ── title rule on real strings taken from top_job_titles_sponsored ──────────
test('title rule: real CSV product titles pass, look-alikes and out-of-range seniority fail', () => {
  for (const t of ['Product Manager, Connectors', 'Sr. Product Manager', 'Product Management I', 'Product Analyst',
    'Senior Product Manager, Mobile Channels', 'Software Developer (Product Manager)', 'PRODUCT MANAGER'])
    assert.equal(titleRule(t).pass, true, t);
  for (const [t, why] of [
    ['Product Designer', 'not-a-product-title'], ['Production Scientist', 'not-a-product-title'],
    ['Product Marketing Manager', 'not-a-product-title'], ['Product Owner', 'not-a-product-title'],
    ['Associate Product Manager', 'excluded-seniority:associate'], ['Group Product Manager', 'excluded-seniority:group'],
    ['Director of Product Management', 'excluded-seniority:director'],
    ['Senior Manager, Product Management', 'excluded-people-manager'],
  ]) assert.equal(titleRule(t).reason, why, t);
  assert.equal(titleRule('Senior Product Manager', { includeSenior: false }).pass, false);
  assert.equal(titleRule('Product Manager').source, 'your-input');
});

test('title list parser handles the CSV\'s Python-list literal, including apostrophes', () => {
  assert.deepEqual(parseTitleList(`['Product Manager', "Director, Women's Health", 'Software Engineer ']`),
    ['Product Manager', "Director, Women's Health", 'Software Engineer']);
  assert.deepEqual(parseTitleList(''), []);
});

test('location rule: any US place passes; non-US and lookalike state codes fail', () => {
  assert.equal(locationRule('San Francisco, CA • London, UK').pass, true);
  assert.equal(locationRule('London, UK').pass, false);
  assert.equal(locationRule('Toronto, ON').pass, false);
  assert.equal(locationRule('Remote - India').pass, false);
  assert.equal(locationRule('Remote - California').pass, true);
  assert.equal(locationRule('Remote').reason, 'remote-unspecified-country');
  assert.equal(locationRule('').pass, false);
});

// ── sponsorship tier edges (counts = record, thresholds = your-input) ───────
test('sponsorship tiers: two tiers, minimum 3 approvals, Proven needs >=10 and >=90%', () => {
  const t = (a, r) => sponsorshipTier({ 'Total Approvals': a, 'Total Denials': '', Approval_Rate: r });
  assert.equal(t('', '').reason, 'no-trace-in-data');      // F2: empty is "no trace", not "does not sponsor"
  assert.equal(t('2.0', '100.0').reason, 'below-min-approvals');
  assert.equal(t('3.0', '100.0').tier, 'Likely');
  assert.equal(t('9.0', '100.0').tier, 'Likely');
  assert.equal(t('10.0', '90.0').tier, 'Proven');
  assert.equal(t('10.0', '85.0').tier, 'Likely');           // edge case decided by Aditya
  assert.equal(t('10.0', '').tier, 'Likely');               // rate unknown → cannot prove >=90%
  assert.equal(t('10.0', '90.0').evidence.source, 'record');
  assert.equal(t('10.0', '90.0').rule.source, 'your-input');
});

// ── gates ────────────────────────────────────────────────────────────────────
test('timeline gate (F5): missing, invalid, past, or too-short OPT end date stops the run', () => {
  assert.throws(() => timelineGate(null, '2026-10-03'), (e) => e instanceof StopError && e.code === 'opt-end-missing');
  assert.throws(() => timelineGate('Jan 2030', '2026-10-03'), (e) => e.code === 'opt-end-invalid');
  assert.throws(() => timelineGate('2026-09-30', '2026-10-03'), (e) => e.code === 'opt-end-past');
  assert.throws(() => timelineGate('2026-11-01', '2026-10-03', 60), (e) => e.code === 'timeline-too-short');
  const g = timelineGate('2030-01-31', '2026-10-03', 60);
  assert.equal(g.factor, 1);
  assert.equal(g.source, 'your-input');
});

test('a role with a missing gate value is refused (the scorer would read it as an open gate)', () => {
  const sp = { p: 0.9, tier: 'Proven' };
  const posting = { title: 'Product Manager', url: 'https://example.com/x', location: 'Austin, TX' };
  const timeline = { factor: 1, source: 'your-input' };
  assert.throws(() => buildRole({ company: 'X', posting, sponsorship: sp, timeline, liveness: undefined }), /liveness gate value missing/);
  assert.throws(() => buildRole({ company: 'X', posting, sponsorship: sp, timeline: {}, liveness: { factor: 1, source: 'record' } }), /timeline gate value missing/);
  assert.throws(() => buildRole({ company: 'X', posting, sponsorship: { p: null }, timeline, liveness: { factor: 1, source: 'record' } }), /no sponsorship tier/);
});

test('offline context replays the real provider code; a missing fixture is an error, not "no openings"', async () => {
  const ctx = offlineCtx(path.join(FX, 'test-responses'));
  const jobs = await greenhouse.fetch({ name: 'ITERABLE INC', careers_url: 'https://job-boards.greenhouse.io/iterable' }, ctx);
  assert.equal(jobs.length, 2);
  await assert.rejects(greenhouse.fetch({ name: 'NOPE', careers_url: 'https://job-boards.greenhouse.io/nope-not-saved' }, ctx), /no saved response/);
  await assert.rejects(greenhouse.fetch({ name: 'DISCORD INC', careers_url: 'https://job-boards.greenhouse.io/discord' }, ctx), /HTTP 404/);
});

// ── end to end, offline, through the real scorer ─────────────────────────────
test('end-to-end offline run routes every company and labels every value', () => {
  const r = runCli(offlineArgs());
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'run-log.json'), 'utf8'));
  const route = Object.fromEntries(log.companies.map((c) => [c.company, `${c.route}|${c.reason}`]));

  assert.match(route['AIRBYTE INC'], /^apply\|/);                                  // Proven + 1 US PM posting
  assert.match(route['DRATA INC'], /^consider\|/);                                 // Likely tier, soft spot
  assert.equal(route['ITERABLE INC'], 'network|sponsors-product-roles-but-no-matching-live-posting');
  assert.equal(route['DISCORD INC'], 'board-unknown|fetch-failed: HTTP 404');      // F3: never "no openings"
  assert.equal(route['BETTERUP INC'], 'human-check|board-not-confirmed');          // Gate A not cleared
  assert.equal(route['Quillfeather Product Labs Inc'], 'skip|not-in-dataset');     // F1
  assert.equal(route['10 PERCENT HAPPIER INC'], 'skip|no-trace-in-data');          // F2
  assert.equal(route['ACCELBYTE INC'], 'skip|below-min-approvals');

  // Only the one matching posting was scored at Airbyte (India, Director, engineer filtered out).
  const air = log.companies.find((c) => c.company === 'AIRBYTE INC');
  assert.equal(air.scored.length, 1);
  assert.deepEqual(air.evidence.board.postings_rejected_by_rule, { 'non-us-location': 1, 'excluded-seniority:director': 1, 'not-a-product-title': 1 });

  // The real scorer produced the numbers: 0.9·0.35 + 0.7·0.30 = 0.525; 0.6·0.35 + 0.7·0.30 = 0.42.
  const scores = JSON.parse(fs.readFileSync(path.join(r.out, 'role-scores.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer');
  assert.equal(air.scored[0].composite, 0.525);
  assert.equal(log.companies.find((c) => c.company === 'DRATA INC').scored[0].composite, 0.42);

  // Every term handed to the scorer carries a source label.
  const roles = JSON.parse(fs.readFileSync(path.join(r.out, 'roles.json'), 'utf8'));
  for (const role of roles) for (const k of ['sponsorship', 'fit', 'liveness', 'timeline'])
    assert.ok(['record', 'your-input', 'model-judgment'].includes(role[k].source), `${role.role_id} ${k}`);

  const report = fs.readFileSync(path.join(r.out, 'report.md'), 'utf8');
  assert.match(report, /^# PM network-targets report/);
  assert.match(report, /## Executive summary/);
  assert.match(report, /## What this cannot tell you/);
});

test('F5 end to end: a past OPT date stops with exit 2 and writes nothing', () => {
  const r = runCli(offlineArgs('persona.past-opt.test.json'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /STOP \[opt-end-past\]/);
  assert.deepEqual(fs.readdirSync(r.out), []);
});

test('missing inputs stop cleanly instead of guessing', () => {
  const r = runCli(['--boards', path.join(FX, 'does-not-exist.json'), '--persona', path.join(FX, 'persona.test.json')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /STOP \[missing-input\] boards file not found/);
});
