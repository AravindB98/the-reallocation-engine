// swe-opt-clock.test.mjs — offline tests for the swe-opt-clock prototype.
//   node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
// Fixtures only (plus local repo data for the end-to-end runs). No network:
// the last test checks that no prototype source imports a network module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  personaClock, timelineFactor, loadSponsorIndex, resolveCompany, sponsorshipTier, parseTitles,
  livenessFromSnapshot, loadSocIndex, roleQuality, checkScorerOutput, parseDate,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const REPO = path.resolve(DIR, '../../../..');
const FIX = path.join(DIR, 'fixtures');
const RUN = path.join(DIR, 'run.mjs');
const PERSONA = path.join(REPO, 'search/examples/neel-kapoor/profile.yml');
const neel = () => yaml.load(fs.readFileSync(PERSONA, 'utf8'));
const D = (s) => parseDate(s);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'swe-opt-clock-'));
const run = (...args) => spawnSync(process.execPath, [RUN, ...args], { cwd: REPO, encoding: 'utf8' });
const writePersona = (mutate) => {
  const p = neel(); mutate(p);
  const f = path.join(tmp(), 'persona.yml'); fs.writeFileSync(f, yaml.dump(p)); return f;
};

// ── G0: the clock ─────────────────────────────────────────────────────────
test('clock: unemployment ceiling binds before OPT end (Neel on 2026-10-02)', () => {
  const c = personaClock(neel(), D('2026-10-02'));
  assert.equal(c.ok, true);
  assert.equal(c.unemployment_days_used_projected, 41);
  assert.equal(c.unemployment_days_remaining, 49);
  assert.equal(c.hard_deadline, '2026-11-20');
  assert.equal(c.hard_deadline_binding, 'unemployment-ceiling');
  assert.equal(c.safe_deadline, '2026-11-05');
});

test('clock: a count entered earlier is projected forward; the deadline does not drift later', () => {
  const c = personaClock(neel(), D('2026-10-12'));
  assert.equal(c.unemployment_days_used_projected, 51);
  assert.equal(c.unemployment_days_remaining, 39);
  assert.equal(c.hard_deadline, '2026-11-20'); // same date: the clock was running the whole time
});

test('clock: stops instead of guessing (named failure cases)', () => {
  const at = D('2026-10-02');
  const stop = (mut) => { const p = neel(); mut(p); return personaClock(p, at); };
  assert.equal(stop((p) => { p.visa.opt_end_date = '2026-09-30'; }).stop.code, 'opt-end-past');
  assert.equal(stop((p) => { p.visa.unemployment_days_used = 90; }).stop.code, 'unemployment-ceiling-reached');
  assert.equal(stop((p) => { delete p.visa.unemployment_days_as_of; }).stop.code, 'unemployment-count-undated');
  assert.equal(stop((p) => { p.visa.unemployment_days_as_of = '2026-10-20'; }).stop.code, 'unemployment-count-in-future');
  assert.equal(stop((p) => { delete p.needs_sponsorship; }).stop.code, 'needs-sponsorship-missing');
});

test('timeline factor: 1 inside buffer, linear in buffer, 0 after hard deadline', () => {
  const c = personaClock(neel(), D('2026-10-02'));
  assert.equal(timelineFactor(c, 28).factor, 1);           // 2026-10-30 ≤ safe
  assert.equal(timelineFactor(c, 34).factor, 1);           // 2026-11-05 = safe
  assert.equal(timelineFactor(c, 42).factor, 0.467);       // 2026-11-13: 7/15
  assert.equal(timelineFactor(c, 49).factor, 0);           // 2026-11-20 = hard: 0/15
  assert.equal(timelineFactor(c, 50).factor, 0);           // after hard
  assert.equal(timelineFactor(c, 120).band, 'after-hard-deadline');
  assert.equal(timelineFactor(c, undefined).ok, false);    // no lag → no invented factor
});

// ── G1 + tier rules on the synthetic fixture CSV ───────────────────────────
test('entity + tier rules', () => {
  const idx = loadSponsorIndex(path.join(FIX, 'test-sponsors.csv'));
  const tier = (n) => sponsorshipTier(resolveCompany(idx, n).row);
  assert.equal(tier('Example Proven SWE Inc').tier, 'Proven');
  assert.equal(tier('Example Proven SWE Inc').p, 0.9);
  const senior = tier('EXAMPLE SENIOR ONLY INC');
  assert.equal(senior.tier, 'Likely');
  assert.match(senior.reason, /every SWE title on record is senior/);
  assert.equal(tier('EXAMPLE FEW FILINGS INC').tier, 'Likely');
  const low = tier('EXAMPLE LOW RATE INC');
  assert.equal(low.tier, 'Possible');
  assert.doesNotMatch(low.reason, /approvals/);              // only the condition that fired
  assert.match(tier('EXAMPLE NO SWE INC').reason, /no software-engineering title/);
  const unk = tier('EXAMPLE NO RECORD INC');
  assert.equal(unk.tier, 'Unknown'); assert.equal(unk.scored, false); assert.equal(unk.p, null);
  assert.equal(resolveCompany(idx, 'HUBSPOT INC').code, 'not-in-csv');
  assert.equal(resolveCompany(idx, 'Example Dup Inc').code, 'ambiguous-name');
});

test('sponsor index never carries phone or officer columns', () => {
  const row = resolveCompany(loadSponsorIndex(path.join(FIX, 'test-sponsors.csv')), 'EXAMPLE PROVEN SWE INC').row;
  for (const col of ['phone', 'executive_officers', 'board_directors']) assert.equal(col in row, false);
});

test('title parsing handles the CSV\'s list repr and apostrophes', () => {
  assert.deepEqual(parseTitles("['Software Engineer', 'Data Analyst']"), ['Software Engineer', 'Data Analyst']);
  assert.deepEqual(parseTitles(`["Director's Office Engineer"]`), ["Director's Office Engineer"]);
  assert.deepEqual(parseTitles(''), []);
});

// ── G2 liveness via the engine's classifier ──────────────────────────────
test('liveness: 404 closes the gate, apply button opens it, uncertain and stale are held', () => {
  const snap = (f) => JSON.parse(fs.readFileSync(path.join(FIX, 'snapshots', f), 'utf8'));
  const at = D('2026-10-02');
  const gone = livenessFromSnapshot(snap('r03-lendbuzz.json'), at);
  assert.equal(gone.factor, 0); assert.equal(gone.code, 'http_gone'); assert.equal(gone.hold, false);
  assert.equal(livenessFromSnapshot(snap('r01-cohere-health.json'), at).factor, 1);
  const unsure = livenessFromSnapshot(snap('r04-abacus-insights.json'), at);
  assert.equal(unsure.hold, true); assert.equal(unsure.factor, null);
  const stale = livenessFromSnapshot(snap('r12-nextuple.json'), at);
  assert.equal(stale.code, 'snapshot-stale'); assert.equal(stale.factor, null);
  assert.equal(livenessFromSnapshot(null, at).code, 'no-snapshot');
  assert.equal(gone.label, 'your-input'); // a fixture is not a record
});

test('role quality: a 2010 SOC code has no row and no number is invented', () => {
  const idx = loadSocIndex(path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'));
  const miss = roleQuality(idx, '15-1132');
  assert.equal(miss.status, 'missing'); assert.equal(miss.reason, 'no-soc-row');
  assert.equal('national_median_wage' in miss, false);
  assert.equal(roleQuality(idx, '15-1252').national_median_wage, 133080); // hand-checked against the CSV
});

// ── G4 scorer-output check ───────────────────────────────────────────────
test('G4 catches the authorization trap and a gate the scorer ignored', () => {
  const fed = [{ role_id: 'x', liveness: { factor: 0 }, timeline: { factor: 1 } }];
  const out = (needs, rec) => ({ _scorer: 'bayesian-role-scorer', profile_needs_sponsorship: needs,
    roles: [{ role_id: 'x', machine_recommendation: rec, trace: { votes: [{ factor: 'fit', source: 'your-input' }], gates: [] } }] });
  assert.deepEqual(checkScorerOutput(out(true, 'Skip'), fed, true), []);
  assert.match(checkScorerOutput(out(false, 'Skip'), fed, true).join(), /profile_needs_sponsorship=false/);
  assert.match(checkScorerOutput(out(true, 'Apply'), fed, true).join(), /closed gate/);
});

// ── end to end, real repo data, real scorer ────────────────────────────
test('e2e: sample run uses the real scorer, labels every term, holds what it cannot verify', () => {
  const out = tmp();
  const r = run('--as-of', '2026-10-02', '--out-dir', out);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['roles.json', 'role-scores.json', 'role-scores.md', 'run-log.json', 'report.md', 'gate-decisions.md'])
    assert.ok(fs.existsSync(path.join(out, f)), `missing ${f}`);
  const scores = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
  const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
  const fed = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer');
  assert.equal(scores.profile_needs_sponsorship, true);
  assert.equal(log.inputs.scorer.path, 'scripts/score/role-scorer.mjs');
  const ids = fed.map((r) => r.role_id);
  for (const held of ['R04', 'R09', 'R10', 'R12']) assert.ok(!ids.includes(held), `${held} must not reach the scorer`);
  for (const s of scores.roles) for (const t of [...s.trace.votes, ...s.trace.gates])
    assert.ok(['record', 'your-input', 'model-judgment'].includes(t.source), `${s.role_id} ${t.factor} unlabeled`);
  for (const s of scores.roles) {
    const f = fed.find((x) => x.role_id === s.role_id);
    if (f.liveness.factor === 0 || f.timeline.factor === 0) assert.equal(s.recommendation, 'Skip');
  }
  const report = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
  assert.match(report, /^# .*\n\n## Executive summary/);
  assert.doesNotMatch(report, /\(\d{3}\) \d{3}-\d{4}/); // no phone numbers leak from the CSV
});

test('e2e: OPT end already past → stop with exit 3, no decisions written', () => {
  const out = tmp();
  const r = run('--as-of', '2026-10-02', '--out-dir', out, '--persona', writePersona((p) => { p.visa.opt_end_date = '2026-09-01'; }));
  assert.equal(r.status, 3);
  assert.match(r.stderr, /opt-end-past/);
  assert.ok(!fs.existsSync(path.join(out, 'report.md')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8')).status, 'stopped');
});

test('break: an additive-gates scorer is caught at G4 (exit 4, no report)', () => {
  const out = tmp();
  const r = run('--as-of', '2026-10-02', '--out-dir', out, '--scorer', path.join(FIX, 'BROKEN-additive-gates-scorer.mjs'));
  assert.equal(r.status, 4);
  assert.match(r.stderr, /closed gate/);
  assert.ok(!fs.existsSync(path.join(out, 'report.md')));
});

test('break: a scorer that flips needs-sponsorship is caught at G4', () => {
  const out = tmp();
  const r = run('--as-of', '2026-10-02', '--out-dir', out, '--scorer', path.join(FIX, 'BROKEN-sponsor-flag-scorer.mjs'));
  assert.equal(r.status, 4);
  assert.match(r.stderr, /profile_needs_sponsorship=false/);
});

test('refuses to write outside its namespace', () => {
  const r = run('--as-of', '2026-10-02', '--out-dir', 'data/examples');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /refusing to write/);
});

test('no prototype source imports a network module', () => {
  const NET = /from\s+['"](node:)?(http|https|net|dgram|tls|dns)['"]|\bfetch\s*\(|playwright|axios|undici/;
  const files = ['lib.mjs', 'run.mjs', ...fs.readdirSync(FIX).filter((f) => f.endsWith('.mjs')).map((f) => `fixtures/${f}`)];
  for (const f of files) assert.doesNotMatch(fs.readFileSync(path.join(DIR, f), 'utf8'), NET, f);
});
