// live-report.test.mjs: offline tests for the live report's fail-closed gate rules and its two outputs.
// Run: node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { outcome, validateDecisions, DecisionError } from './live-report.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const URLS = ['https://a/1', 'https://b/1', 'https://c/1'];

test('no decision keeps a posting held; only checker-active plus a person clearing both gates is cleared', () => {
  assert.equal(outcome('active', null, 'P').status, 'held');
  assert.equal(outcome('active', { h1: 'confirmed-live', h2: 'no-blocker' }, 'P').status, 'cleared');
  assert.equal(outcome('active', { h1: 'confirmed-live', h2: 'unclear' }, 'P').status, 'held');
  assert.equal(outcome('active', { h1: 'confirmed-live', h2: 'blocked' }, 'P').status, 'set aside');
  assert.equal(outcome('active', { h1: 'wrong-company' }, 'P').status, 'set aside');
  assert.equal(outcome('expired', { h1: 'not-live' }, 'P').status, 'set aside');
});

test('a person saying "live" where the checker did not is a held disagreement, never a clearance', () => {
  for (const machine of ['expired', 'uncertain']) {
    const o = outcome(machine, { h1: 'confirmed-live', h2: 'no-blocker' }, 'P');
    assert.equal(o.status, 'held', machine);
    assert.match(o.reason, /disagreement/);
  }
});

test('the decisions file must name the person, the time, chosen postings only, once each, with allowed words', () => {
  const ok = { decided_by: 'P', decided_at: '2026-10-20T03:00:00Z', decisions: [{ url: URLS[0], h1: 'confirmed-live', h2: 'no-blocker' }] };
  assert.equal(validateDecisions(ok, URLS).size, 1);
  assert.equal(validateDecisions(null, URLS), null);
  const bad = (patch) => () => validateDecisions({ ...ok, ...patch }, URLS);
  assert.throws(bad({ decided_by: ' ' }), DecisionError);
  assert.throws(bad({ decided_at: 'yesterday' }), DecisionError);
  assert.throws(bad({ decisions: [{ url: 'https://x/9', h1: 'not-live' }] }), /not one of the chosen/);
  assert.throws(bad({ decisions: [{ url: URLS[0], h1: 'not-live' }, { url: URLS[0], h1: 'not-live' }] }), /decided twice/);
  assert.throws(bad({ decisions: [{ url: URLS[0], h1: 'looks good' }] }), /h1 for/);
  assert.throws(bad({ decisions: [{ url: URLS[0], h1: 'confirmed-live' }] }), /h2 for/);
});

function fixtureRun(withDecisions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'live-report-'));
  const live = path.join(dir, 'live'); fs.mkdirSync(live);
  const w = (p, o) => fs.writeFileSync(p, typeof o === 'string' ? o : JSON.stringify(o));
  w(path.join(dir, 'run-log.json'), { recipe: 'r', recipe_version: '0.2.0', as_of: '2026-10-20', summary: { evaluated: 5 },
    timeline: { dates: { expected_start: '2027-06-01' } },
    gates: { G0_vintage: { status: 'stale-accepted', vintage_date: '2025-09-26', age_months: 12.8, limit_months: 6, acknowledged: true },
      G1_persona: { status: 'pass' }, G2_scorer_integrity: { status: 'pass' }, G3_timeline: { status: 'open' } },
    rows: [{ company: 'A', tier: { tier: 'Proven', approvals: 20, rate_pct: 95 } }, { company: 'B', tier: { tier: 'Likely', approvals: 4, rate_pct: 80 } },
      { company: 'D', tier: { tier: 'Proven', approvals: 50, rate_pct: 99 } }] });
  w(path.join(live, 'boards.json'), { shortlisted: 5, with_board: 4, companies: [{ company: 'A', composite: 0.3, hit: {} }, { company: 'B', composite: 0.3, hit: {} },
    { company: 'C', composite: 0.3, hit: null }, { company: 'D', composite: 0.3, hit: {} }, { company: 'E', composite: 0.2, hit: {} }] });
  w(path.join(live, 'scan-history.tsv'), 'url\ttitle\tcompany\tlocation\n');
  w(path.join(live, 'selected-postings.json'), { params: { max_postings_total: 2 }, postings_scanned: 14, postings_eligible: 4,
    companies: [{ company: 'A', postings_found: 4, eligible: 1, chosen: ['https://a/1'], past_total_cap: 0 },
      { company: 'B', postings_found: 6, eligible: 2, chosen: ['https://b/1'], past_total_cap: 0 },
      { company: 'D', postings_found: 3, eligible: 1, chosen: [], past_total_cap: 1 },
      { company: 'E', postings_found: 1, eligible: 0, chosen: [], past_total_cap: 0 }],
    chosen: [{ company: 'A', title: 'Backend Engineer', location: 'NY, NY', url: 'https://a/1' }, { company: 'B', title: 'Software Engineer', location: 'Austin, TX', url: 'https://b/1' }] });
  w(path.join(live, 'h1-liveness.json'), { checker: 'scripts/ats/check-liveness.mjs', checker_sha256: 'f'.repeat(64), started_at: 's', finished_at: 'f', checker_exit_code: 1,
    summary: { checked: 2, active: 1, expired: 1, uncertain: 0 },
    verdicts: [{ url: 'https://a/1', recorded_as: 'active' }, { url: 'https://b/1', recorded_as: 'expired', reason: 'HTTP 404' }] });
  w(path.join(live, 'h2-screen.json'), { postings: [{ url: 'https://a/1', fetched: true, flags: [{ category: 'sponsorship', sentence: 'We do sponsor.' }] }, { url: 'https://b/1', fetched: true, flags: [] }] });
  if (withDecisions) w(path.join(live, 'gate-decisions.json'), { decided_by: 'Test Person', decided_at: '2026-10-20T03:00:00Z', method: 'read each posting',
    decisions: [{ url: 'https://a/1', h1: 'confirmed-live', h2: 'no-blocker' }, { url: 'https://b/1', h1: 'not-live' }] });
  return { dir, live };
}

test('end to end: the report opens with the executive summary and the agent log carries hashed inputs and outcomes', () => {
  for (const withDecisions of [false, true]) {
    const { dir, live } = fixtureRun(withDecisions);
    const r = spawnSync(process.execPath, [path.join(HERE, 'live-report.mjs'), '--run', dir, '--live', live], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const md = fs.readFileSync(path.join(live, 'report-live.md'), 'utf8');
    assert.match(md.split('\n').slice(0, 3).join('\n'), /^# .+\n\n## Executive summary$/m);
    const log = JSON.parse(fs.readFileSync(path.join(live, 'run-log-live.json'), 'utf8'));
    assert.ok(Object.values(log.inputs).every((v) => /^[0-9a-f]{64}$/.test(v.sha256)));
    assert.deepEqual(log.unreachable.no_board, ['C']);
    assert.deepEqual(log.unreachable.no_eligible_posting, [{ company: 'E', postings_found: 1 }]);
    assert.deepEqual(log.unreachable.past_total_cap, [{ company: 'D', eligible: 1, composite: 0.3, approvals: 50, tied_with_chosen: true }]);
    assert.match(md, /A fitting posting, left out by the cap of 2 \(1\):\*\* D \(1 passed the rules; same score as a chosen company, 0\.3, so the cap cut it by name\)/);
    assert.match(md, /Start dates were not checked\.\*\* The candidate's earliest start is 2027-06-01, about 7 months after the run/);
    assert.match(md, /The cap chose among equal scores by name\.\*\* D \(50 approvals\) had a fitting posting and the same score as a chosen company, and was left out by alphabetical order, not by evidence/);
    if (withDecisions) {
      assert.deepEqual(log.postings.map((p) => p.status), ['cleared', 'set aside']);
      assert.equal(log.decided_by, 'Test Person');
      assert.match(md, /So 1 of the 5 shortlisted companies end the run with a posting that cleared both gates\. Of the other 4: 1 with no board found under the names tried, 1 with a board but no posting that fits the rules, 1 with a fitting posting that the cap of 2 left out and 1 whose chosen posting was set aside\./);
    } else {
      assert.deepEqual(log.postings.map((p) => p.status), ['held', 'held']);
      assert.match(md, /no person has decided yet/);
    }
  }
});

test('a funnel that does not account for every shortlisted company stops the report', () => {
  const { dir, live } = fixtureRun(true);
  const boards = JSON.parse(fs.readFileSync(path.join(live, 'boards.json'), 'utf8'));
  fs.writeFileSync(path.join(live, 'boards.json'), JSON.stringify({ ...boards, shortlisted: 6 }));
  const r = spawnSync(process.execPath, [path.join(HERE, 'live-report.mjs'), '--run', dir, '--live', live], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /accounts for 5 companies but 6 were shortlisted/);
  assert.ok(!fs.existsSync(path.join(live, 'report-live.md')));
});

test('a decisions file that names a posting not on the list stops the report (nothing is written over)', () => {
  const { dir, live } = fixtureRun(true);
  const dec = JSON.parse(fs.readFileSync(path.join(live, 'gate-decisions.json'), 'utf8'));
  dec.decisions.push({ url: 'https://sneaked/1', h1: 'confirmed-live', h2: 'no-blocker' });
  fs.writeFileSync(path.join(live, 'gate-decisions.json'), JSON.stringify(dec));
  const r = spawnSync(process.execPath, [path.join(HERE, 'live-report.mjs'), '--run', dir, '--live', live], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /not one of the chosen postings/);
  assert.ok(!fs.existsSync(path.join(live, 'report-live.md')));
});
