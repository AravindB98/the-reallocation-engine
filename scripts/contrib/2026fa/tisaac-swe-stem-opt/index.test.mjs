#!/usr/bin/env node
// index.test.mjs — offline test for the mode runner (index.js).
//
// Runs from purpose-built fixture jobs (test-fixtures/jobs.fixture.json: one job per
// case) plus liveness evidence written by the test itself, so there are no network
// calls and nothing changes when a real board does. Black-box: invokes the real CLI exactly as a user would, writes
// into a temp --out-dir (never over a tracked file), then inspects the output.
//
// Plain node:assert, matching scripts/score/skill-demand-monitor.test.mjs:
// manual counters, process.exit(1) on any failure.
//
//   node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.test.mjs

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'index.js');
const JOBS = path.join(HERE, 'test-fixtures', 'jobs.fixture.json');
const REPO_ROOT = path.resolve(HERE, '../../../../');
const CSV = path.join(REPO_ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv');
const LABELS = ['record', 'model-judgment', 'your-input'];
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tisaac-swe-stem-opt-test-'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`); }
}
const byId = (list, id) => list.find((r) => r.role_id === id);
const ev = (id, board_listed, browser_result) => ({ id, board_listed, browser_result });
function writeEvidence(results) {
  const p = path.join(tmpRoot, `liveness-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, JSON.stringify({ checked_at: 'fixture', results }));
  return p;
}
function runCli(args) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: REPO_ROOT, encoding: 'utf8' });
}
function run(jobsPath, results) {
  const outDir = fs.mkdtempSync(path.join(tmpRoot, 'run-'));
  execFileSync('node', [SCRIPT, '--fixture', jobsPath, '--liveness', writeEvidence(results), '--out-dir', outDir], { cwd: REPO_ROOT, stdio: 'pipe' });
  const read = (f) => JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'));
  return { roles: read('my-roles.json'), run: read('mode-run.json'), scored: read('role-scores.json').roles, outDir };
}

console.log('SWE STEM-OPT mode runner — offline test');

// Klaviyo listed + active; Toast disagreeing signals; Duolingo no board signal; dead id not on the board.
const live = run(JOBS, [
  ev('fx-sponsor', true, 'active'),
  ev('fx-funding', true, 'expired'),
  ev('fx-not-in-csv', null, 'active'),
  ev('fx-dead', false, 'active'),
]);
// Everything listed + active, so every job reaches the scorer.
const all = run(JOBS, [
  ev('fx-sponsor', true, 'active'),
  ev('fx-funding', true, 'active'),
  ev('fx-not-in-csv', true, 'active'),
  ev('fx-dead', true, 'active'),
]);

test('writes both outputs (JSON log + Markdown report) and the scorer files into --out-dir', () => {
  for (const f of ['mode-run.json', 'mode-report.md', 'role-scores.json', 'role-scores.md']) {
    assert.ok(fs.existsSync(path.join(live.outDir, f)), `${f} missing`);
  }
  const report = fs.readFileSync(path.join(live.outDir, 'mode-report.md'), 'utf8');
  assert.match(report, /^\| Job id \| Posting \| Location \|/m);
  assert.match(report, /^\| `[^`]+` \| [^|]+ — \[[^\]]+\]\(https?:\/\/[^)]+\) \|/m, 'each scored posting title links to its URL');
  assert.match(report, /\[record\] → [\d.]+ \(rule\)/, 'each value shows the record, then the rule output');
});

test('every evidence term carries one of the three allowed source labels', () => {
  for (const r of all.roles) {
    for (const term of ['sponsorship', 'fit', 'liveness', 'timeline']) {
      assert.ok(LABELS.includes(r[term].source), `${r.role_id}.${term}.source = "${r[term].source}"`);
    }
  }
});

test('company in the CSV: sponsorship is a record, and the CSV row really has H-1B approvals', () => {
  const r = byId(all.roles, 'fx-sponsor');
  assert.equal(r.sponsorship.source, 'record');
  assert.equal(r.sponsorship.tier, 'h1b-history');
  const text = fs.readFileSync(CSV, 'utf8');
  const header = text.split('\n')[0].split(',');
  const row = text.split('\n').find((l) => l.startsWith('KLAVIYO INC,'));
  assert.ok(row, 'KLAVIYO INC row not found in the CSV');
  const approvals = parseFloat(row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)[header.indexOf('Total Approvals')]);
  assert.ok(approvals > 0, `Total Approvals = ${approvals}`);
});

test('company in the visa file with funding only: sponsorship 0.4, tier form-d-funding, record', () => {
  const r = byId(all.roles, 'fx-funding');
  assert.equal(r.sponsorship.p, 0.4);
  assert.equal(r.sponsorship.tier, 'form-d-funding');
  assert.equal(r.sponsorship.source, 'record');
});

test('csv_name match is marked as the person\'s own name resolution', () => {
  assert.equal(byId(all.roles, 'fx-sponsor').sponsorship.matched_on, 'csv_name (your-input)');
});

test('company not in the CSV: p 0, tier no-matched, never labeled record', () => {
  const r = byId(all.roles, 'fx-not-in-csv');
  assert.equal(r.sponsorship.p, 0);
  assert.equal(r.sponsorship.tier, 'no-matched');
  assert.equal(r.sponsorship.source, 'your-input');
  assert.ok(all.run.no_matched.includes('Example Robotics Co'));
});

test('fit and timeline come from the job list, not from numbers in the code', () => {
  const jobs = JSON.parse(fs.readFileSync(JOBS, 'utf8'));
  for (const job of jobs) {
    const r = byId(all.roles, job.id);
    assert.equal(r.fit.p, job.fit, `${job.id} fit`);
    assert.equal(r.timeline.factor, job.timeline, `${job.id} timeline`);
  }
});

test('liveness: listed on the board + page active → gate 1, labeled record', () => {
  const r = byId(live.roles, 'fx-sponsor');
  assert.equal(r.liveness.factor, 1);
  assert.equal(r.liveness.source, 'record');
});

test('liveness: job id not on the board → gate 0 (record) and Skip, even if the page check says active', () => {
  const r = byId(live.roles, 'fx-dead');
  assert.equal(r.liveness.factor, 0);
  assert.equal(r.liveness.source, 'record');
  assert.equal(byId(live.scored, 'fx-dead').recommendation, 'Skip');
});

test('stop condition: signals disagree or are missing → role is held, never scored', () => {
  assert.equal(byId(live.roles, 'fx-funding'), undefined, 'toast should not reach the scorer');
  assert.equal(byId(live.roles, 'fx-not-in-csv'), undefined, 'duolingo should not reach the scorer');
  assert.deepEqual(live.run.held.map((h) => h.role_id).sort(), ['fx-funding', 'fx-not-in-csv']);
  assert.match(fs.readFileSync(path.join(live.outDir, 'mode-report.md'), 'utf8'), /Held — the mode refused to score these/);
});

// Walkthrough 2026-10-21: Datadog embeds the Greenhouse application form in an iframe, so
// the page check says "uncertain" while the board lists the job.
const evI = (id, board_listed, browser_result, greenhouse_iframe) => ({ id, board_listed, browser_result, greenhouse_iframe });
const iframe = run(JOBS, [
  evI('fx-sponsor', true, 'uncertain', true),
  evI('fx-funding', true, 'uncertain', false),
  evI('fx-not-in-csv', true, 'active', false),
  evI('fx-dead', false, 'uncertain', true),
]);

test('liveness: listed on the board + page embeds the Greenhouse form for this job id → gate 1, record', () => {
  const r = byId(iframe.roles, 'fx-sponsor');
  assert.equal(r.liveness.factor, 1);
  assert.equal(r.liveness.source, 'record');
  assert.match(r.liveness.detail, /application form/);
  assert.ok(byId(iframe.run.held, 'fx-funding'), 'no iframe and page uncertain → still held');
});

test('liveness: an iframe never reopens a job that is not on the board', () => {
  assert.equal(byId(iframe.roles, 'fx-dead').liveness.factor, 0);
});

// A person's own check (scope.json → liveness_checked_by_hand → job) settles a held role.
const withHand = JSON.parse(fs.readFileSync(JOBS, 'utf8')).map((j) => {
  if (j.id === 'fx-funding') return { ...j, liveness_checked_by_hand: { result: 'open', date: '2026-10-21', by: 'tester' } };
  if (j.id === 'fx-not-in-csv') return { ...j, liveness_checked_by_hand: { result: 'closed', date: '2026-10-21', by: 'tester' } };
  if (j.id === 'fx-dead') return { ...j, liveness_checked_by_hand: { result: 'open', date: '2026-10-21', by: 'tester' } };
  return j;
});
const handJobs = path.join(tmpRoot, 'jobs-hand.json');
fs.writeFileSync(handJobs, JSON.stringify(withHand));
const hand = run(handJobs, [
  ev('fx-sponsor', true, 'active'),
  ev('fx-funding', true, 'uncertain'),
  ev('fx-not-in-csv', null, 'uncertain'),
  ev('fx-dead', false, 'active'),
]);

test('a person\'s check settles a held role, labeled your-input (open → 1, closed → 0)', () => {
  const t = byId(hand.roles, 'fx-funding');
  assert.equal(t.liveness.factor, 1);
  assert.equal(t.liveness.source, 'your-input');
  assert.match(t.liveness.detail, /checked by hand by tester on 2026-10-21/);
  const d = byId(hand.roles, 'fx-not-in-csv');
  assert.equal(d.liveness.factor, 0);
  assert.equal(d.liveness.source, 'your-input');
  assert.equal(hand.run.held.length, 0);
});

test('an answer that is not open/closed (e.g. null) keeps the role held; the report shows one example', () => {
  const nullJobs = path.join(tmpRoot, 'jobs-null.json');
  fs.writeFileSync(nullJobs, JSON.stringify(JSON.parse(fs.readFileSync(JOBS, 'utf8')).map((j) =>
    j.id === 'fx-funding' ? { ...j, liveness_checked_by_hand: { result: null, date: '2026-10-21', by: '' } } : j)));
  const r = run(nullJobs, [ev('fx-sponsor', true, 'active'), ev('fx-funding', true, 'uncertain'),
    ev('fx-not-in-csv', true, 'active'), ev('fx-dead', false, 'active')]);
  assert.ok(byId(r.run.held, 'fx-funding'), 'null answer should stay held');
  const md = fs.readFileSync(path.join(r.outDir, 'mode-report.md'), 'utf8');
  assert.match(md, /### How to record your answer/);
  assert.match(md, /"fx-funding": \{ "result": "open", "date": "\d{4}-\d{2}-\d{2}", "by": "Your Name" \}/);
});

test('a person\'s "open" never overrides the board record "not on the board"', () => {
  const r = byId(hand.roles, 'fx-dead');
  assert.equal(r.liveness.factor, 0);
  assert.equal(r.liveness.source, 'record');
});

// Unclear location (work model only) is held for a person, unless the posting is closed anyway.
const locJobs = path.join(tmpRoot, 'jobs-loc.json');
fs.writeFileSync(locJobs, JSON.stringify(JSON.parse(fs.readFileSync(JOBS, 'utf8')).map((j) =>
  (j.id === 'fx-funding' || j.id === 'fx-dead') ? { ...j, location: 'Hybrid', location_unclear: true } : j)));
const loc = run(locJobs, [
  ev('fx-sponsor', true, 'active'),
  ev('fx-funding', true, 'active'),
  ev('fx-not-in-csv', true, 'active'),
  ev('fx-dead', false, 'active'),
]);

test('stop condition: location unclear → held for a person, never scored as if in the US', () => {
  assert.equal(byId(loc.roles, 'fx-funding'), undefined);
  const h = byId(loc.run.held, 'fx-funding');
  assert.ok(h, 'toast should be held');
  assert.match(h.reason, /location unclear/);
  assert.match(fs.readFileSync(path.join(loc.outDir, 'mode-report.md'), 'utf8'), /location_checked_by_hand/);
});

test('a closed posting with an unclear location is a plain Skip, not a hold', () => {
  assert.equal(byId(loc.scored, 'fx-dead').recommendation, 'Skip');
  assert.equal(byId(loc.run.held, 'fx-dead'), undefined);
});

test('stop condition: a job missing fit stops the run with no output written', () => {
  const broken = JSON.parse(fs.readFileSync(JOBS, 'utf8'));
  delete broken[0].fit;
  const brokenPath = path.join(tmpRoot, 'missing-fit.json');
  fs.writeFileSync(brokenPath, JSON.stringify(broken));
  const out = fs.mkdtempSync(path.join(tmpRoot, 'broken-'));
  const res = runCli(['--fixture', brokenPath, '--liveness', writeEvidence([]), '--out-dir', out]);
  assert.notEqual(res.status, 0, 'expected a non-zero exit');
  assert.match(res.stderr, /missing "fit"/);
  assert.ok(!fs.existsSync(path.join(out, 'my-roles.json')), 'a partial output was written');
});

test('stop condition: no liveness evidence given → refuses to run instead of guessing', () => {
  const out = fs.mkdtempSync(path.join(tmpRoot, 'no-live-'));
  const res = runCli(['--fixture', JOBS, '--out-dir', out]);
  assert.notEqual(res.status, 0, 'expected a non-zero exit');
  assert.match(res.stderr, /Missing --liveness/);
  assert.ok(!fs.existsSync(path.join(out, 'my-roles.json')), 'an output was written');
});

test('runner source makes no network calls (only collect-liveness / select-postings do)', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  assert.doesNotMatch(src, /\bfetch\s*\(|from ['"](node:)?https?['"]|require\(['"]https?['"]\)|playwright/);
});

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
