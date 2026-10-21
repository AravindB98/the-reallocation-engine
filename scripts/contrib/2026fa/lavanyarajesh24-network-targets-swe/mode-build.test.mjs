// mode-build.test.mjs — offline tests (node --test) for the Mode Build additions:
// board identity (TODO 3), the browser liveness gate (G3b), the LCA tier cap (TODO 1),
// E-Verify labels (TODO 2), and extract-lca.py. No network calls. Fixtures are fictional.
//
//   node --test scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/mode-build.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boardIdentity, identityUsable, nameKey, parseCsv } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const TOOL = path.join(HERE, 'network-targets.mjs');
const TODAY = '2026-10-02';
const ALPHA_URL = 'https://job-boards.greenhouse.io/alpha-fixture/jobs/1';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mode-build-'));
  const boards = {};
  for (const f of fs.readdirSync(path.join(FX, 'boards'))) boards[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(FX, 'boards', f), 'utf8'));
  return { dir, boards, out: path.join(dir, 'out'), bundle: path.join(dir, 'bundle.json') };
}
function writeBundle(t, capturedAt = '2026-10-01T12:00:00.000Z') {
  fs.writeFileSync(t.bundle, JSON.stringify({ captured_at: capturedAt, boards: t.boards }));
}
function run(t, { liveness = 'none', everify = 'none', lca = 'none' } = {}) {
  const f = (x, name) => (x === 'none' ? path.join(t.dir, `no-${name}`) : x);
  return spawnSync(process.execPath, [TOOL, '--persona', path.join(FX, 'persona.fixture.json'), '--csv', path.join(FX, 'targets.fixture.csv'),
    '--formd-dir', path.join(FX, 'formd'), '--boards', t.bundle, '--out-dir', t.out, '--today', TODAY,
    '--liveness', f(liveness, 'liveness.json'), '--everify', f(everify, 'everify.csv'), '--lca', f(lca, 'lca.csv')], { encoding: 'utf8' });
}
const logOf = (t) => JSON.parse(fs.readFileSync(path.join(t.out, 'network-targets-log.json'), 'utf8'));
const names = (bucket) => bucket.map((d) => d.ev.company.value).sort();
const find = (log, company) => Object.values(log.buckets).flat().find((d) => d.ev?.company.value === company);
function livenessFile(t, result, startedAt = '2026-10-01T13:00:00.000Z') {
  const p = path.join(t.dir, 'liveness.json');
  fs.writeFileSync(p, JSON.stringify({ started_at: startedAt, results: { [ALPHA_URL]: { result, code: `fx_${result}`, reason: 'fixture', checked_at: startedAt } } }));
  return p;
}

// ── TODO 3: board identity ────────────────────────────────────────────────────
test('wrong slug: a board that answers 200 under another company name is rejected (real case: TALENT INC → "Slice Talent Community")', () => {
  assert.equal(boardIdentity('TALENT INC', 'greenhouse', 'Slice Talent Community').status, 'name-mismatch');
  assert.equal(boardIdentity('MONGODB INC', 'greenhouse', 'MongoDB').status, 'name-match');
  assert.equal(boardIdentity('VESTMARK INC', 'greenhouse', 'Vestmark, Inc.').status, 'name-match');
  assert.equal(boardIdentity('ETSY INC', 'greenhouse', null, 404).status, 'board-not-found');
  assert.equal(boardIdentity('LENDBUZZ INC', 'lever', null).status, 'unverified', 'Lever returns no company name');
  assert.equal(identityUsable({ identity: { status: 'name-mismatch' } }), false);
  assert.equal(identityUsable({ identity: { status: 'unverified' }, confirmed_by: 'L. Rajesh 2026-10-20' }), true, 'a person can confirm');
});

test('an identity-unverified board is reported as check-board and never reaches the scorer', () => {
  const t = setup();
  t.boards.alphabackend = { company: 'ALPHA BACKEND INC', provider: 'greenhouse', slug: 'alpha-wrong', status: 'identity-unverified', error: 'board identity name-mismatch', jobs: null };
  writeBundle(t);
  assert.equal(run(t).status, 0);
  const log = logOf(t);
  assert.equal(find(log, 'ALPHA BACKEND INC').live.reason, 'board-identity-unverified');
  const roles = JSON.parse(fs.readFileSync(path.join(t.out, 'roles.json'), 'utf8'));
  assert.ok(!roles.some((r) => r.company === 'ALPHA BACKEND INC'));
});

// ── G3b: browser liveness ─────────────────────────────────────────────────────
test('browser gate: active → apply; expired → liveness 0 → network (strong sponsor); uncertain → check-board', () => {
  const t = setup(); writeBundle(t);
  assert.equal(run(t, { liveness: livenessFile(t, 'active') }).status, 0);
  assert.deepEqual(names(logOf(t).buckets.apply), ['ALPHA BACKEND INC']);

  assert.equal(run(t, { liveness: livenessFile(t, 'expired') }).status, 0);
  let log = logOf(t);
  assert.deepEqual(names(log.buckets.apply), [], 'a listed-but-expired posting is not an application target');
  assert.ok(names(log.buckets.network).includes('ALPHA BACKEND INC'));
  const roles = JSON.parse(fs.readFileSync(path.join(t.out, 'roles.json'), 'utf8'));
  assert.equal(roles.find((r) => r.company === 'ALPHA BACKEND INC').liveness.factor, 0);

  assert.equal(run(t, { liveness: livenessFile(t, 'uncertain') }).status, 0);
  log = logOf(t);
  assert.equal(find(log, 'ALPHA BACKEND INC').live.reason, 'posting-liveness-unverified', '"uncertain" is not a verdict either way');
});

test('break attempt: a liveness file older than the board snapshot is stale and decides nothing', () => {
  const t = setup(); writeBundle(t, '2026-10-01T12:00:00.000Z');
  assert.equal(run(t, { liveness: livenessFile(t, 'active', '2026-09-30T09:00:00.000Z') }).status, 0);
  const log = logOf(t);
  assert.equal(log.liveness.mode, 'stale');
  assert.equal(find(log, 'ALPHA BACKEND INC').live.reason, 'posting-liveness-unverified');
  assert.deepEqual(log.buckets.apply, []);
});

test('posting-urls.txt lists every matching posting, before the gate', () => {
  const t = setup(); writeBundle(t);
  assert.equal(run(t).status, 0);
  const urls = fs.readFileSync(path.join(t.out, 'posting-urls.txt'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
  assert.deepEqual(urls, [ALPHA_URL], 'the Senior and Manitoba postings do not match the filters');
  assert.equal(logOf(t).liveness.mode, 'api-listed-only');
});

// ── TODO 1: LCA cap ───────────────────────────────────────────────────────────
test('LCA cap: with the SOC-coded file loaded, a Proven sponsor with zero certified 15-1252 LCAs is capped and leaves "network"', () => {
  const t = setup(); writeBundle(t);
  const lca = path.join(t.dir, 'lca.csv');
  fs.writeFileSync(lca, 'employer_key,employer_names_seen,certified_lcas,certified_in_target_states,worksite_states,level_I,level_II,level_III,level_IV,level_none,median_annual_wage_offered,first_received,last_received\n'
    + 'bravoplatform,BRAVO PLATFORM INC,7,0,WA,2,3,2,0,0,140000,2025-11-03,2026-05-20\n');
  assert.equal(run(t, { lca }).status, 0);
  const log = logOf(t);
  const charlie = find(log, 'CHARLIE DATA LLC');
  assert.equal(charlie.ev.sponsorship.tier.value, 'Possible');
  assert.equal(charlie.ev.sponsorship.tier_capped_from.value, 'Proven');
  assert.equal(charlie.route.bucket, 'skip');
  const bravo = find(log, 'BRAVO PLATFORM INC');
  assert.equal(bravo.route.bucket, 'network', 'SOC-coded filings anywhere in the US keep the tier, even with 0 in the target states (remote worksites)');
  assert.equal(bravo.ev.lca.value.level_I, 2);
  assert.equal(log.lca.tiers_capped >= 1, true);
});

test('without the LCA file nothing is capped, and the report says the file was not loaded', () => {
  const t = setup(); writeBundle(t);
  assert.equal(run(t).status, 0);
  const log = logOf(t);
  assert.equal(log.lca.status, 'missing');
  assert.equal(log.lca.tiers_capped, 0);
  assert.match(fs.readFileSync(path.join(t.out, 'network-targets-report.md'), 'utf8'), /DOL LCA \(SOC-coded\) \| not loaded/);
});

// ── TODO 2: E-Verify ──────────────────────────────────────────────────────────
test('E-Verify: a looked-up row is a record; a missing row is "not-looked-up", never "not enrolled"', () => {
  const t = setup(); writeBundle(t);
  const ev = path.join(t.dir, 'everify.csv');
  fs.writeFileSync(ev, 'company,query,result,latest_open_enrolled,open_hiring_site_states,workforce_size,employer_names_seen,looked_up_at,looked_up_by,reviewed_by\n'
    + 'ALPHA BACKEND INC,Alpha Backend,open,2020-01-01,MA,20 to 99,Alpha Backend Inc (Open),2026-10-20,fixture,\n');
  assert.equal(run(t, { everify: ev }).status, 0);
  const log = logOf(t);
  assert.equal(find(log, 'ALPHA BACKEND INC').ev.everify.value, 'open');
  assert.equal(find(log, 'ALPHA BACKEND INC').ev.everify.source, 'record');
  assert.equal(find(log, 'BRAVO PLATFORM INC').ev.everify.value, 'not-looked-up');
  assert.doesNotMatch(JSON.stringify(log), /not-enrolled/);
});

// ── extract-lca.py ────────────────────────────────────────────────────────────
const PY = path.join(HERE, 'extract-lca.py');
const havePy = spawnSync('python3', ['-c', 'import openpyxl'], { encoding: 'utf8' }).status === 0;

test('extract-lca.py keeps only certified H-1B 15-1252 LCAs in target states, and its name key matches lib.mjs', { skip: !havePy && 'python3 + openpyxl not available' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lca-'));
  const xlsx = path.join(dir, 'fixture.xlsx');
  const mk = spawnSync('python3', ['-c', `
import openpyxl, sys
wb = openpyxl.Workbook(); ws = wb.active
ws.append(["CASE_STATUS","RECEIVED_DATE","VISA_CLASS","SOC_CODE","EMPLOYER_NAME","WORKSITE_STATE","WAGE_RATE_OF_PAY_FROM","WAGE_UNIT_OF_PAY","PW_WAGE_LEVEL"])
ws.append(["Certified","2025-11-03","H-1B","15-1252.00","Bravo Platform, Inc.","NY",140000,"Year","II"])
ws.append(["Certified","2026-02-10","H-1B","15-1252.00","BRAVO PLATFORM INC","NY",60,"Hour","I"])
ws.append(["Denied","2026-01-05","H-1B","15-1252.00","Bravo Platform, Inc.","NY",150000,"Year","II"])
ws.append(["Certified","2026-01-05","H-1B","15-2051.00","Bravo Platform, Inc.","NY",150000,"Year","II"])
ws.append(["Certified","2026-01-05","H-1B","15-1252.00","Bravo Platform, Inc.","CA",150000,"Year","II"])
ws.append(["Certified","2026-01-05","E-3 Australian","15-1252.00","Bravo Platform, Inc.","NY",150000,"Year","II"])
wb.save(sys.argv[1])`, xlsx], { encoding: 'utf8' });
  assert.equal(mk.status, 0, mk.stderr);
  const out = path.join(dir, 'lca.csv');
  const r = spawnSync('python3', [PY, xlsx, '--persona', path.join(FX, 'persona.fixture.json'), '--out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const { header, records } = parseCsv(fs.readFileSync(out, 'utf8'));
  assert.equal(header[0], 'employer_key');
  assert.equal(records.length, 1, 'one employer');
  const [row] = records;
  assert.equal(row.employer_key, nameKey('BRAVO PLATFORM INC'), 'Python name_key == JS nameKey');
  assert.equal(row.certified_lcas, '3', 'denied, wrong-SOC and E-3 rows are dropped; the CA worksite counts nationwide');
  assert.equal(row.certified_in_target_states, '2', 'but not in the target states');
  assert.equal(row.level_I, '1');
  assert.equal(row.median_annual_wage_offered, '140000', 'median of 140000/yr, $60/hr × 2080 = 124800, and 150000/yr');
  const prov = JSON.parse(fs.readFileSync(`${out}.provenance.json`, 'utf8'));
  assert.equal(prov.rows_read, 6);
  assert.equal(prov.rows_kept_in_target_states, 2);
  assert.deepEqual(prov.received_date_range_seen, ['2025-11-03', '2026-02-10']);
  assert.deepEqual(prov.received_date_range_kept, ['2025-11-03', '2026-02-10'], 'the CA row was received 2026-01-05, inside the range');
  assert.match(prov.source_sha256, /^[0-9a-f]{64}$/);
});

test('break attempt: extract-lca.py refuses a workbook missing a required column', { skip: !havePy && 'python3 + openpyxl not available' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lca-'));
  const xlsx = path.join(dir, 'bad.xlsx');
  spawnSync('python3', ['-c', 'import openpyxl,sys; wb=openpyxl.Workbook(); wb.active.append(["CASE_STATUS","EMPLOYER_NAME"]); wb.save(sys.argv[1])', xlsx]);
  const r = spawnSync('python3', [PY, xlsx, '--persona', path.join(FX, 'persona.fixture.json'), '--out', path.join(dir, 'o.csv')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /lacks required column/);
  assert.ok(!fs.existsSync(path.join(dir, 'o.csv')));
});
