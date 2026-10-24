#!/usr/bin/env node
// select-postings.test.mjs — offline test for the posting filter (select-postings.mjs).
//
// Proves the filter follows scope.json: every case below is a real title/location
// shape from the 2026-10-21 boards, including each bug found by reading the audit
// (double spaces, "Data" in an SWE title, "Remote - California", "Fort Worth TX",
// a bare "Remote"). It cannot prove scope.json itself is right — that is the
// student's call, checked by reading postings-<date>-audit.md.
//
// Black-box and offline: runs the real CLI with --from-snapshot on fixtures in a
// temp folder. Plain node:assert, manual counters, exit 1 on any failure.
//
//   node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.test.mjs

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'select-postings.mjs');
const REPO_ROOT = path.resolve(HERE, '../../../../');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tisaac-select-test-'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`); }
}

// [title, location, expect kept?, reason must contain]
const CASES = [
  ['Senior Software  Engineer', 'Boston, MA', true, 'in scope'],                       // double space
  ['Senior Software Engineer - Data Automation', 'Boston, MA', true, 'in scope'],      // "Data" in an SWE title
  ['Software Engineer II, Test Frameworks & Tooling', 'Boston, MA', true, 'in scope'],
  ['Senior Site Reliability Engineer', 'New York, NY; Pittsburgh, PA', true, 'in scope'],
  ['Platform Engineer II', 'New York, NY', true, 'in scope'],
  ['Software Engineer', 'Remote - California', true, 'in scope'],                      // full state name
  ['Software Engineer', 'Fort Worth TX', true, 'in scope'],                            // state code, no comma
  ['Software Engineer', 'Remote, United States', true, 'in scope'],
  ['Data Scientist', 'Boston, MA', false, 'specialist role'],
  ['Machine Learning Engineer', 'Boston, MA', false, 'specialist role'],
  ['Staff Software Engineer', 'Remote, US', false, 'level'],
  ['Senior Lead Software Engineer - Data Platform', 'Boston, MA', false, 'level'],
  ['Manager II, Software Engineering', 'Remote, US', false, 'level'],
  ['Territory Account Executive', 'Boston, MA', false, 'title outside'],
  ['Software Engineer', 'Remote', true, 'location unclear'],                          // no country
  ['Software Engineer', 'Dublin, Ireland', false, 'location not in the US'],
  ['Software Engineer II, Earnings', 'Toronto, CAN', false, 'location not in the US'],
  // Walkthrough 2026-10-21 (Datadog / Cloudflare boards):
  ['Software Engineering Intern (Summer)', 'Boston, Massachusetts, USA', false, 'level'],   // intern excluded
  ['Senior Software Engineer, Distributed Databases', 'Hybrid', true, 'location unclear'], // work model, not a place
  ['Senior Software Engineer, Agentic Discovery', 'In-Office', true, 'location unclear'],
  ['Senior Software Engineer - Fintech', 'Distributed; Hybrid', true, 'location unclear'],
  // Cloudflare: location.name is a work model, the real places are in the job's offices.
  ['Senior Infrastructure Engineer, Storage Platform', 'In-Office', true, 'location from Greenhouse offices',
    ['Austin, TX, United States', 'London, United Kingdom', 'Seattle, WA']],
  ['Senior Software Engineer, Workers', 'Hybrid', false, 'location not in the US (Greenhouse offices', ['London, United Kingdom', 'Lisbon, Portugal']],
  // An office named only "Remote" is not a place either: still unclear, not "abroad".
  ['Backend Engineer, Edge', 'Remote', true, 'location unclear', ['Remote']],
];

function makeSnapshot(dir, board, rows) {
  fs.mkdirSync(dir, { recursive: true });
  const jobs = rows.map(([title, location, , , offices], i) => ({ title, location, company: board, url: `https://job-boards.greenhouse.io/${board}/jobs/${9000 + i}`, ...(offices ? { offices } : {}) }));
  fs.writeFileSync(path.join(dir, `${board}.raw.json`), JSON.stringify({ fetched_at: 'fixture', board, name: 'TestCo', jobs }));
}
function run(scopePath, snapDir, outName) {
  const outDir = path.join(tmpRoot, outName);
  execFileSync('node', [SCRIPT, '--scope', scopePath, '--from-snapshot', snapDir, '--out-dir', outDir, '--date', '2000-01-01'], { cwd: REPO_ROOT, stdio: 'pipe' });
  return {
    jobs: JSON.parse(fs.readFileSync(path.join(outDir, 'jobs-2000-01-01.json'), 'utf8')),
    auditText: fs.readFileSync(path.join(outDir, 'postings-2000-01-01-audit.md'), 'utf8'),
  };
}
// Audit rows: | board | title | location | kept | reason |
// (The Source table also starts with "| testco |", so keep only rows whose Kept cell is yes/no.)
const auditRows = (text) => text.split('\n').filter((l) => l.startsWith('| testco |'))
  .map((l) => l.split('|').map((c) => c.trim())).filter((c) => c[4] === '**yes**' || c[4] === 'no')
  .map((c) => ({ title: c[2], location: c[3], kept: c[4] === '**yes**', reason: c[5] }));

// The real scope.json rules, pointed at a fixture board, with no csv names or break jobs.
const realScope = JSON.parse(fs.readFileSync(path.join(HERE, 'scope.json'), 'utf8'));
const testScope = { ...realScope, boards: ['testco'], csv_name: {}, break_jobs: [] };
const scopePath = path.join(tmpRoot, 'scope.json');
fs.writeFileSync(scopePath, JSON.stringify(testScope));
const snapDir = path.join(tmpRoot, 'snap');
makeSnapshot(snapDir, 'testco', CASES);

console.log('SWE STEM-OPT posting filter — offline test');
const first = run(scopePath, snapDir, 'run-a');
const rows = auditRows(first.auditText);

for (const [title, location, keep, reason] of CASES) {
  test(`${keep ? 'keeps' : 'drops'} "${title}" @ "${location}" (${reason})`, () => {
    const norm = title.replace(/\s+/g, ' ').trim();
    const row = rows.find((r) => r.title === norm && r.location === location);
    assert.ok(row, 'posting missing from the audit');
    assert.equal(row.kept, keep, `kept=${row.kept}, reason="${row.reason}"`);
    assert.ok(row.reason.includes(reason), `reason="${row.reason}"`);
  });
}

test('every listed posting appears in the audit exactly once, and kept count = jobs file', () => {
  assert.equal(rows.length, CASES.length);
  assert.equal(first.jobs.length, rows.filter((r) => r.kept).length);
});

test('same snapshot + same scope → identical selection and audit (no hidden randomness)', () => {
  const second = run(scopePath, snapDir, 'run-b');
  assert.deepEqual(second.jobs, first.jobs);
  assert.equal(second.auditText, first.auditText);
});

test('selected jobs carry the scope defaults as the student\'s own input (fit, timeline)', () => {
  for (const j of first.jobs) {
    assert.equal(j.fit, realScope.defaults.fit);
    assert.equal(j.timeline, realScope.defaults.timeline);
  }
});

test('replay without --date names outputs after the snapshot\'s date, not today in UTC', () => {
  const datedSnap = path.join(tmpRoot, 'postings-1999-12-31');
  makeSnapshot(datedSnap, 'testco', CASES.slice(0, 2));
  const outDir = path.join(tmpRoot, 'dated');
  execFileSync('node', [SCRIPT, '--scope', scopePath, '--from-snapshot', datedSnap, '--out-dir', outDir], { cwd: REPO_ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(outDir, 'jobs-1999-12-31.json')), `files: ${fs.readdirSync(outDir).join(', ')}`);
});

test('a person\'s liveness check in scope.json is carried onto that job only', () => {
  const hand = { result: 'open', date: '2026-10-21', by: 'tester' };
  const handScopePath = path.join(tmpRoot, 'scope-hand.json');
  fs.writeFileSync(handScopePath, JSON.stringify({ ...testScope, liveness_checked_by_hand: { 'testco-9000': hand } }));
  const { jobs } = run(handScopePath, snapDir, 'run-hand');
  assert.deepEqual(jobs.find((j) => j.id === 'testco-9000').liveness_checked_by_hand, hand);
  assert.ok(jobs.filter((j) => j.id !== 'testco-9000').every((j) => !j.liveness_checked_by_hand));
});

test('a place taken from the job\'s offices is kept unflagged, with the offices on the job', () => {
  const j = first.jobs.find((x) => x.title === 'Senior Infrastructure Engineer, Storage Platform');
  assert.ok(j, 'offices-placed posting missing');
  assert.ok(!j.location_unclear);
  assert.deepEqual(j.offices, ['Austin, TX, United States', 'London, United Kingdom', 'Seattle, WA']);
});

test('unclear location is kept and flagged for a person; a clear US location is not flagged', () => {
  const hybrid = first.jobs.find((j) => j.location === 'Hybrid');
  assert.ok(hybrid, 'Hybrid posting missing from the job list');
  assert.equal(hybrid.location_unclear, true);
  assert.ok(first.jobs.filter((j) => j.location === 'Boston, MA').every((j) => !j.location_unclear));
});

test('a person\'s location check settles it: in_us true → kept, unflagged; false → dropped, said so', () => {
  const ids = first.jobs.filter((j) => j.location_unclear).map((j) => j.id);
  const [yes, no] = ids;
  const locScopePath = path.join(tmpRoot, 'scope-loc.json');
  fs.writeFileSync(locScopePath, JSON.stringify({ ...testScope, location_checked_by_hand: {
    [yes]: { in_us: true, date: '2026-10-21', by: 'tester' }, [no]: { in_us: false, date: '2026-10-21', by: 'tester' } } }));
  const r = run(locScopePath, snapDir, 'run-loc');
  const y = r.jobs.find((j) => j.id === yes);
  assert.ok(y && !y.location_unclear, 'confirmed-US job should be kept without the flag');
  assert.equal(r.jobs.find((j) => j.id === no), undefined, 'confirmed non-US job should be dropped');
  assert.match(r.auditText, /location not in the US \(checked by hand by tester\)/);
});

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
