// triage.test.mjs — node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/
// Deterministic tests + deliberate break attempts. The engine scorer is run
// through its own CLI (never re-implemented), per CONTRIBUTING.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, parseTitles, classifyTitles, sponsorshipTier, timeline } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const FX = join(HERE, 'fixtures');
const PROFILE = join(HERE, 'profile.example.json');
const tmp = () => mkdtempSync(join(tmpdir(), 'revan-triage-'));
const run = (script, args) => spawnSync('node', [join(HERE, script), ...args], { encoding: 'utf8', cwd: ROOT });

test('parseTitles handles single- and double-quoted Python list items', () => {
  assert.deepEqual(parseTitles(`["Software Developer", 'QA Automation Engineer']`), ['Software Developer', 'QA Automation Engineer']);
  assert.deepEqual(parseTitles(''), []);
});

test('seniority marker splits senior-only sponsors from non-senior evidence', () => {
  const senior = classifyTitles(['Senior Software Engineer', 'Staff Software Engineer/Team Lead']);
  assert.equal(senior.senior_only, true);
  assert.equal(sponsorshipTier({ approvals: 150, rate: 97, cls: senior }), 'Possible', 'a big count must not buy Proven without non-senior SWE titles');
  const entry = classifyTitles(['Software Engineer I', 'Senior Software Engineer']);
  assert.deepEqual(entry.non_senior_swe_titles, ['Software Engineer I']);
  assert.equal(sponsorshipTier({ approvals: 40, rate: 95, cls: entry }), 'Proven');
  assert.equal(sponsorshipTier({ approvals: 4, rate: 100, cls: entry }), 'Likely');
  assert.equal(classifyTitles(['QA Automation Engineer']).swe_titles.length, 0, 'QA titles are SOC 15-1253, kept out of SWE');
});

test('parser refuses a file that ends inside a quoted field', () => {
  assert.throws(() => parseCsv('a,b\n1,"unterminated'), /inside a quoted field/);
});

test('timeline: Feb-2027 OPT (Dec-2026 graduate), STEM degree — E-Verify unknown vs confirmed', () => {
  const base = { as_of: '2026-10-20', opt_start: '2027-02-01', stem_degree: true };
  const cons = timeline({ ...base, employer_everify: 'unknown' });
  assert.equal(cons.opt_end, '2028-01-31');
  assert.deepEqual(cons.registrations_reachable.map((r) => r.registration), ['2027-03-01'], 'March 2028 falls after a 12-month OPT that ends in Jan 2028');
  assert.equal(cons.registrations_reachable[0].pre_opt, false);
  assert.equal(cons.factor, 0.5);
  const stem = timeline({ ...base, employer_everify: true });
  assert.equal(stem.authorized_until, '2030-01-31');
  assert.deepEqual(stem.registrations_reachable.map((r) => r.registration), ['2027-03-01', '2028-03-01', '2029-03-01']);
  assert.equal(stem.factor, 1.0);
});

test('timeline: any OPT start inside the 60-day window gives the same draws', () => {
  for (const start of ['2026-12-23', '2027-02-01', '2027-02-01', '2027-02-21'])
    assert.equal(timeline({ as_of: '2026-10-20', opt_start: start, stem_degree: true, employer_everify: 'unknown' }).draws, 1);
});

test('BREAK: an OPT start more than 60 days after program end halts (the May-2027 input error)', () => {
  const r = run('sponsor-triage.mjs', ['--csv', join(FX, 'sample-mapped.csv'), '--profile', writeProfile({ opt_start: '2027-05-01' }), '--out-dir', tmp()]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /must start within 60 days of program end/);
});

test('BREAK: timeline gate closes when authorization has run out', () => {
  const t = timeline({ as_of: '2028-05-15', opt_start: '2027-02-01', stem_degree: true, employer_everify: 'unknown' });
  assert.equal(t.draws, 0);
  assert.equal(t.closed, true);
  // non-STEM degree: no scenario reaches a registration → the whole run halts
  const r = run('sponsor-triage.mjs', ['--csv', join(FX, 'sample-mapped.csv'), '--profile', writeProfile({ as_of: '2028-05-15', stem_degree: false }), '--out-dir', tmp()]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /timeline gate closed/);
  // STEM degree: only the E-Verify scenario survives → run continues, but every
  // employer with unconfirmed E-Verify carries a closed (0) timeline gate
  const out = tmp();
  const s = run('sponsor-triage.mjs', ['--csv', join(FX, 'sample-mapped.csv'), '--profile', writeProfile({ as_of: '2028-05-15' }), '--out-dir', out]);
  assert.equal(s.status, 0, s.stderr);
  const log = JSON.parse(readFileSync(join(out, 'triage.json'), 'utf8'));
  assert.ok(log.companies.every((c) => c.timeline_factor === 0));
  assert.equal(log.timeline.stem_if_everify.draws, 1, 'only March 2029 remains before Jan 2030');
});

test('fixture run: commute filter, tiers, rejects, parity flag stays off on a small file', () => {
  const out = tmp();
  const r = run('sponsor-triage.mjs', ['--csv', join(FX, 'sample-mapped.csv'), '--profile', PROFILE, '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(readFileSync(join(out, 'triage.json'), 'utf8'));
  assert.equal(log.data_shape.rows, 7);
  assert.equal(log.data_shape.h1b_rows, 6);
  assert.equal(log.data_shape.in_state_h1b, 5, 'ZETA (CA) excluded; ETA has no H-1B fields');
  assert.equal(log.data_shape.in_commute_h1b, 4, 'EPSILON (Worcester) is outside the commute set');
  const tiers = Object.fromEntries(log.companies.map((c) => [c.company, c.sponsorship_tier]));
  assert.deepEqual(tiers, { 'FIXTURE ALPHA INC': 'Proven', 'FIXTURE DELTA INC': 'Likely', 'FIXTURE BETA INC': 'Possible', 'FIXTURE GAMMA INC': 'Unknown' });
  assert.equal(log.data_shape.parity.suspected_double_count, false, 'parity check needs >50 rows before it flags');
  assert.ok(!JSON.stringify(log).includes('executive_officers'), 'personal-name columns are never copied');
  assert.match(readFileSync(join(out, 'triage.md'), 'utf8'), /^# .*\n\n## Executive summary/);
});

test('BREAK: missing column and truncated CSV halt with exit 2', () => {
  for (const [f, re] of [['BROKEN-missing-column.csv', /missing required column/], ['BROKEN-truncated.csv', /field count|quoted field/]]) {
    const r = run('sponsor-triage.mjs', ['--csv', join(FX, f), '--profile', PROFILE, '--out-dir', tmp()]);
    assert.equal(r.status, 2, `${f} should halt`);
    assert.match(r.stderr, re);
  }
});

test('BREAK: engine scorer silently treats a missing liveness gate as open — build-roles must refuse first', () => {
  const out = tmp();
  execFileSync('node', ['scripts/score/role-scorer.mjs', join(FX, 'BROKEN-role-without-liveness.json'), '--out-dir', out], { cwd: ROOT });
  const scored = JSON.parse(readFileSync(join(out, 'role-scores.json'), 'utf8')).roles[0];
  const gate = scored.trace.gates.find((g) => g.factor === 'liveness');
  assert.equal(gate.multiplier, 1, 'documents the scorer default this mode guards against');
  assert.equal(scored.recommendation, 'Apply');

  // same role through build-roles with no liveness record → refused
  const tri = tmp();
  run('sponsor-triage.mjs', ['--csv', join(FX, 'sample-mapped.csv'), '--profile', PROFILE, '--out-dir', tri]);
  const cand = join(tri, 'cand.json'), fit = join(tri, 'fit.json'), lv = join(tri, 'lv.txt'), rolesOut = join(tri, 'roles.json');
  writeFileSync(cand, JSON.stringify([
    { role_id: 'no-liveness', company: 'FIXTURE ALPHA INC', title: 'Software Engineer I', location: 'Boston, MA', url: 'https://example.test/jobs/1', soc: '15-1252' },
    { role_id: 'uncertain', company: 'FIXTURE ALPHA INC', title: 'Software Engineer I', location: 'Boston, MA', url: 'https://example.test/jobs/2', soc: '15-1252' },
    { role_id: 'no-fit', company: 'FIXTURE ALPHA INC', title: 'Software Engineer I', location: 'Boston, MA', url: 'https://example.test/jobs/3', soc: '15-1252' },
    { role_id: 'remote', company: 'FIXTURE ALPHA INC', title: 'Software Engineer I', location: 'Remote, US', url: 'https://example.test/jobs/4', soc: '15-1252' },
    { role_id: 'ok', company: 'FIXTURE ALPHA INC', title: 'Software Engineer I', location: 'Boston, MA', url: 'https://example.test/jobs/5', soc: '15-1252' },
  ]));
  writeFileSync(fit, JSON.stringify({ 'no-liveness': { p: 0.5 }, uncertain: { p: 0.5 }, remote: { p: 0.5 }, ok: { p: 0.5 } }));
  writeFileSync(lv, '⚠️ uncertain  https://example.test/jobs/2\n✅ active     https://example.test/jobs/3\n✅ active     https://example.test/jobs/4\n✅ active     https://example.test/jobs/5\n');
  const r = run('build-roles.mjs', ['--triage', join(tri, 'triage.json'), '--candidates', cand, '--liveness', lv, '--fit', fit, '--soc', 'data/bls/compact/soc_occupation_compact.csv', '--out', rolesOut]);
  assert.equal(r.status, 0, r.stderr);
  const built = JSON.parse(readFileSync(rolesOut, 'utf8'));
  assert.deepEqual(built.roles.map((x) => x.role_id), ['ok']);
  assert.deepEqual(Object.fromEntries(built.refused.map((x) => [x.role_id, x.refused_because.split(' ')[0]])), { 'no-liveness': 'no', uncertain: 'liveness', 'no-fit': 'no', remote: 'location' });
});

function writeProfile(over) {
  const p = { ...JSON.parse(readFileSync(PROFILE, 'utf8')), ...over };
  const f = join(tmp(), 'profile.json');
  writeFileSync(f, JSON.stringify(p));
  return f;
}
