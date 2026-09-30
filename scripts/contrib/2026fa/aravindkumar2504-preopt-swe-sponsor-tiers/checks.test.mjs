// checks.test.mjs: the committed sample run is not stale, and the quick evidence checks agree with it.
// (The slower checks, which run the program five times or start Python, are commands for a person to run, not tests.)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Buffer } from './evidence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const RUN = path.join(REPO, 'course', '2026fa', 'submissions', 'aravindkumar2504', 'runs', '2026-09-30');
const CHECKS = path.join(HERE, 'checks.mjs');
const log = JSON.parse(fs.readFileSync(path.join(RUN, 'run-log.json'), 'utf8'));
const checks = (args) => spawnSync(process.execPath, [CHECKS, ...args], { cwd: REPO, encoding: 'utf8' });

test('the committed sample run was made by the current code, parameters and data (re-run it if you change any of them)', () => {
  for (const key of ['csv', 'bls', 'persona', 'params', 'role_families', 'scorer', 'watchlist']) {
    const rec = log.inputs[key];
    assert.equal(sha256File(path.join(REPO, rec.path)), rec.sha256, `${key} (${rec.path}) has changed since the committed run was made`);
  }
  for (const f of log.inputs.code.files) assert.equal(sha256File(path.join(REPO, f.path)), f.sha256, `${f.path} has changed since the committed run was made`);
  assert.equal(sha256Buffer(Buffer.from(log.inputs.code.files.map((f) => f.sha256).join('\n'))), log.inputs.code.combined_sha256);
  const names = log.inputs.code.files.map((f) => path.basename(f.path)).sort();
  assert.deepEqual(names, ['evidence.mjs', 'guard.mjs', 'paths.mjs', 'persona.mjs', 'preopt-sponsor-tiers.mjs', 'report.mjs', 'scorer-bridge.mjs', 'timeline.mjs']);
});

test('the committed run is the documented command\'s run, for the committed sample inputs, with nothing outside the repository in it', () => {
  assert.equal(log.command, '--as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30');
  assert.equal(log.gates.G1_persona.treated_as, 'committed fictional persona and sample inputs');
  assert.equal(log.scorer.is_repository_scorer, true);
  for (const f of fs.readdirSync(RUN)) assert.ok(!fs.readFileSync(path.join(RUN, f), 'utf8').includes(REPO), `${f} holds this machine's repository path`);
});

test('checks.mjs watchlist and formd-pairs read the committed run and agree with it', () => {
  const w = checks(['watchlist']);
  assert.equal(w.status, 0, w.stderr);
  for (const row of log.rows.filter((r) => r.origin === 'watchlist')) assert.ok(w.stdout.includes(row.company), row.company);
  const f = checks(['formd-pairs']);
  assert.equal(f.status, 0, f.stderr);
  assert.match(f.stdout, new RegExp(`${log.form_d_crosscheck.records_examined} sample records examined; ${log.form_d_crosscheck.matched} matched`));
  assert.equal(f.stdout.split('\n').filter((l) => /^[A-Z0-9].* (agrees|form-d-|csv-has-no-funding|same-date)/.test(l)).length, log.form_d_crosscheck.pairs.length);
});

test('checks.mjs source puts the raw table cells beside the run log and redoes the arithmetic', () => {
  const r = checks(['source', 'DATABRICKS INC', 'AKIA SYNDICATE']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--- DATABRICKS INC: company table, row 7249/);
  assert.match(r.stdout, /Total Approvals=1640\.0 Total Denials=8\.0/);
  assert.match(r.stdout, /redone: 100 \* 1640 \/ \(1640 \+ 8\) = 99\.51% -> run log says 99\.51% \(match\)/);
  assert.match(r.stdout, /= 1\.12x -> run log says 1\.12x \(match\)/);
  assert.doesNotMatch(r.stdout, /MISMATCH/);
  assert.doesNotMatch(r.stdout, /@|\(\d{3}\) ?\d{3}-\d{4}/); // the officer and contact columns are never printed
  const unknown = checks(['source', 'NO SUCH COMPANY INC']);
  assert.equal(unknown.status, 1);
  assert.equal(checks(['source']).status, 2);
  assert.equal(checks(['nonsense']).status, 2);
});
