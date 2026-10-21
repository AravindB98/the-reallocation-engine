#!/usr/bin/env node
// index.test.mjs — offline test for the mode runner (index.js).
//
// Runs from a frozen copy of real postings (Run 1) plus liveness evidence written
// by the test itself, so there are no network calls and nothing changes when a
// board does. Black-box: invokes the real CLI exactly as a user would, writes
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
const JOBS = path.join(HERE, 'jobs-2026-10-21-handpicked.json');
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
  ev('klaviyo-7727703003', true, 'active'),
  ev('toast-8233154', true, 'expired'),
  ev('duolingo-8584012002', null, 'active'),
  ev('break-klaviyo-1000000001', false, 'active'),
]);
// Everything listed + active, so every job reaches the scorer.
const all = run(JOBS, [
  ev('klaviyo-7727703003', true, 'active'),
  ev('toast-8233154', true, 'active'),
  ev('duolingo-8584012002', true, 'active'),
  ev('break-klaviyo-1000000001', true, 'active'),
]);

test('writes both outputs (JSON log + Markdown report) and the scorer files into --out-dir', () => {
  for (const f of ['mode-run.json', 'mode-report.md', 'role-scores.json', 'role-scores.md']) {
    assert.ok(fs.existsSync(path.join(live.outDir, f)), `${f} missing`);
  }
});

test('every evidence term carries one of the three allowed source labels', () => {
  for (const r of all.roles) {
    for (const term of ['sponsorship', 'fit', 'liveness', 'timeline']) {
      assert.ok(LABELS.includes(r[term].source), `${r.role_id}.${term}.source = "${r[term].source}"`);
    }
  }
});

test('company in the CSV: sponsorship is a record, and the CSV row really has H-1B approvals', () => {
  const r = byId(all.roles, 'klaviyo-7727703003');
  assert.equal(r.sponsorship.source, 'record');
  assert.equal(r.sponsorship.tier, 'h1b-history');
  const text = fs.readFileSync(CSV, 'utf8');
  const header = text.split('\n')[0].split(',');
  const row = text.split('\n').find((l) => l.startsWith('KLAVIYO INC,'));
  assert.ok(row, 'KLAVIYO INC row not found in the CSV');
  const approvals = parseFloat(row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)[header.indexOf('Total Approvals')]);
  assert.ok(approvals > 0, `Total Approvals = ${approvals}`);
});

test('csv_name match is marked as the person\'s own name resolution', () => {
  assert.equal(byId(all.roles, 'klaviyo-7727703003').sponsorship.matched_on, 'csv_name (your-input)');
});

test('company not in the CSV: p 0, tier no-matched, never labeled record', () => {
  const r = byId(all.roles, 'duolingo-8584012002');
  assert.equal(r.sponsorship.p, 0);
  assert.equal(r.sponsorship.tier, 'no-matched');
  assert.equal(r.sponsorship.source, 'your-input');
  assert.ok(all.run.no_matched.includes('Duolingo'));
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
  const r = byId(live.roles, 'klaviyo-7727703003');
  assert.equal(r.liveness.factor, 1);
  assert.equal(r.liveness.source, 'record');
});

test('liveness: job id not on the board → gate 0 (record) and Skip, even if the page check says active', () => {
  const r = byId(live.roles, 'break-klaviyo-1000000001');
  assert.equal(r.liveness.factor, 0);
  assert.equal(r.liveness.source, 'record');
  assert.equal(byId(live.scored, 'break-klaviyo-1000000001').recommendation, 'Skip');
});

test('stop condition: signals disagree or are missing → role is held, never scored', () => {
  assert.equal(byId(live.roles, 'toast-8233154'), undefined, 'toast should not reach the scorer');
  assert.equal(byId(live.roles, 'duolingo-8584012002'), undefined, 'duolingo should not reach the scorer');
  assert.deepEqual(live.run.held.map((h) => h.role_id).sort(), ['duolingo-8584012002', 'toast-8233154']);
  assert.match(fs.readFileSync(path.join(live.outDir, 'mode-report.md'), 'utf8'), /Held — the mode refused to score these/);
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
