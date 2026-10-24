// de-mlops-h1b.test.mjs — offline tests (node --test). No network: every input is a
// file under fixtures/, and the REAL scorer (scripts/score/role-scorer.mjs) is spawned
// by the prototype. Outputs go to a fresh temp dir per run, never into the repo.
//
//   node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/
//
// These tests assert gate behaviour and labelling, not the Apply/Consider verdicts —
// only gate-closed Skips are asserted, because a closed gate must Skip by construction.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeCompany, parseTitles, parseLiveness, registrationSeasons, parseDate, checkPersona } from './de-mlops-h1b.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const SCRIPT = path.join(HERE, 'de-mlops-h1b.mjs');

function run(personaFile, extra = []) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'de-mlops-h1b-test-'));
  const res = spawnSync(process.execPath, [SCRIPT,
    '--persona', path.join(FX, personaFile), '--postings', path.join(FX, 'postings.json'),
    '--liveness', path.join(FX, 'liveness.txt'), '--csv', path.join(FX, 'companies.sample.csv'),
    '--formd-dir', path.join(FX, 'formd'), '--today', '2026-10-01',
    '--out-dir', out, '--roles-dir', out, ...extra], { encoding: 'utf8' });
  const read = (f) => (fs.existsSync(path.join(out, f)) ? JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')) : null);
  return { res, out, log: read('de-mlops-h1b-log.json'), roles: read('roles.json'), hasReport: fs.existsSync(path.join(out, 'de-mlops-h1b-report.md')) };
}

const ok = run('persona.json');
const holdOf = (id) => ok.log.holds.find((h) => h.role_id === id);
const roleOf = (id) => ok.roles.find((r) => r.role_id === id);
const scoredOf = (id) => ok.log.scored.find((s) => s.role_id === id);

test('happy path exits 0 and writes both outputs', () => {
  assert.equal(ok.res.status, 0, ok.res.stderr);
  assert.ok(ok.log, 'JSON log written');
  assert.ok(ok.hasReport, 'Markdown report written');
  assert.equal(ok.log.summary.postings, 17);
  assert.equal(ok.log.summary.scored + ok.log.summary.held, 17, 'every posting is either scored or held');
});

test('blank Total Approvals → HOLD no-sponsorship-record, never sent to the scorer', () => {
  for (const id of ['wandb-mlops', 'composabl-mle']) {
    assert.equal(holdOf(id)?.hold, 'no-sponsorship-record', id);
    assert.equal(roleOf(id), undefined, `${id} must not be in roles.json`);
  }
});

test('recent Form D funding does not stand in for sponsorship (CHANGE-BRIEF §5)', () => {
  const c = ok.log.context.find((x) => x.role_id === 'composabl-mle');
  assert.ok(c.form_d_sample.value?.length, 'Composabl is in the Form D fixture');
  assert.equal(holdOf('composabl-mle').hold, 'no-sponsorship-record');
});

test('company absent from the CSV → HOLD not-in-dataset', () => {
  assert.equal(holdOf('bigtech-de')?.hold, 'not-in-dataset');
});

test('Snowflake resolves to SNOWFLAKE INC only, never the blank SNOWFLAKE COMPUTING INC row', () => {
  assert.equal(roleOf('snowflake-de').sponsorship.evidence.csv_company_name, 'SNOWFLAKE INC');
});

test('brand name differs from legal name: legal_name (your-input) resolves, brand alone is held', () => {
  assert.equal(roleOf('instacart-legal').sponsorship.evidence.csv_company_name, 'MAPLEBEAR INC');
  assert.equal(roleOf('instacart-legal').lookup_name.source, 'your-input');
  assert.equal(holdOf('instacart-brand')?.hold, 'not-in-dataset');
});

test('two rows with the same normalized name → HOLD ambiguous-company', () => {
  assert.equal(holdOf('deloitte-de')?.hold, 'ambiguous-company');
});

test('liveness uncertain → HOLD; expired → scored and Skipped by the gate', () => {
  assert.equal(holdOf('twilio-uncertain')?.hold, 'liveness-unconfirmed');
  assert.equal(roleOf('zoox-ghost').liveness.factor, 0);
  assert.equal(scoredOf('zoox-ghost').recommendation, 'Skip');
  assert.match(scoredOf('zoox-ghost').reason, /gated: liveness/);
});

test('start date before the assumed EAD start → timeline 0 → Skip', () => {
  assert.equal(roleOf('zoox-early').timeline.factor, 0);
  assert.equal(scoredOf('zoox-early').recommendation, 'Skip');
});

test('off-target title and missing fit input are held, not guessed', () => {
  assert.equal(holdOf('zoox-pm')?.hold, 'off-target-title');
  assert.equal(holdOf('zoox-nofit')?.hold, 'no-fit-input');
});

test('every term sent to the scorer carries a source label', () => {
  const allowed = new Set(['record', 'model-judgment', 'your-input']);
  for (const r of ok.roles) for (const k of ['family', 'lookup_name', 'sponsorship', 'fit', 'liveness', 'timeline'])
    assert.ok(allowed.has(r[k].source), `${r.role_id}.${k}.source = ${r[k].source}`);
});

test('persona with past dates → exit 2, no report', () => {
  const r = run('persona-past.json');
  assert.equal(r.res.status, 2);
  assert.match(r.res.stderr, /G0 profile gate failed/);
  assert.equal(r.hasReport, false);
  assert.equal(r.log, null);
});

test('scorer regex trap ("not yet authorized") → exit 3, no report', () => {
  const r = run('persona-trap.json');
  assert.equal(r.res.status, 3, r.res.stderr);
  assert.match(r.res.stderr, /NOT needing sponsorship/);
  assert.equal(r.hasReport, false);
  assert.equal(r.log, null);
});

test('helpers: normalisation matches the SEC rule; titles, liveness, seasons parse', () => {
  assert.equal(normalizeCompany('Databricks, Inc.'), 'databricks');
  assert.equal(normalizeCompany('WEIGHTS & BIASES INC'), 'weightsbiases');
  assert.deepEqual(parseTitles("['Data Engineer 20516.3745', 'Senior Data Engineer']"), ['Data Engineer 20516.3745', 'Senior Data Engineer']);
  const live = parseLiveness('✅ active     https://a\n⚠️ uncertain  https://b\n❌ expired    https://c\n✅ active     https://b\n');
  assert.equal(live.get('https://a'), 'active');
  assert.equal(live.get('https://b'), 'conflict');
  assert.equal(live.get('https://c'), 'expired');
  assert.deepEqual(registrationSeasons(parseDate('2027-02-01'), parseDate('2030-01-31')), [2027, 2028, 2029]);
  assert.deepEqual(registrationSeasons(parseDate('2027-04-01'), parseDate('2028-01-31')), []);
  assert.equal(parseDate('2026-02-30'), null);
  assert.equal(checkPersona({ program_end_date: '2026-12-12', assumed_ead_start_date: '2027-03-15', authorization: 'x', needs_sponsorship: true }, parseDate('2026-10-01')).ok, false, 'EAD > 60 days after program end');
});
