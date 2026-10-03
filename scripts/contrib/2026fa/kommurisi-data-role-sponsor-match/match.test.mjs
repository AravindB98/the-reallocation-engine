// match.test.mjs — offline tests (no network). Run from the repo root:
//   node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/
//
// The end-to-end tests drive the REAL scorer (scripts/score/role-scorer.mjs)
// through match.mjs; nothing here re-implements the composite. Expected
// composites are recomputed from the fixture's own inputs and the scorer's
// exported-in-file weights (read back from role-scores.json), not typed in.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  normalizeCompany, parseTitleList, compilePatterns, isDataTitle, timelineGate,
  livenessGate, parseLivenessLog, greenhouseJobId, outDirAllowed, SRC,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures/test');
const MATCH = path.join(HERE, 'match.mjs');
const fixture = JSON.parse(fs.readFileSync(path.join(FX, 'candidates.json'), 'utf8'));
const P = fixture.profile;
const inc = compilePatterns(P.data_title_include), exc = compilePatterns(P.data_title_exclude);

function run(extra = [], input = path.join(FX, 'candidates.json')) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'drsm-'));
  const r = spawnSync(process.execPath, [MATCH, '--input', input, '--out-dir', out,
    '--csv', path.join(FX, 'mini-80days.csv'), '--bls', path.join(FX, 'mini-bls.csv'),
    '--formd-dir', path.join(FX, 'formd'), ...extra], { encoding: 'utf8' });
  return { ...r, out };
}

// ── unit: matching ────────────────────────────────────────────────────────
test('company names normalize suffixes/punctuation, nothing fuzzy', () => {
  assert.equal(normalizeCompany('Klaviyo, Inc.'), 'KLAVIYO');
  assert.equal(normalizeCompany('KLAVIYO INC'), 'KLAVIYO');
  assert.equal(normalizeCompany('The Toast Company'), 'TOAST');
  assert.notEqual(normalizeCompany('Toast Holdings Inc'), normalizeCompany('Toast Inc'));
  assert.notEqual(normalizeCompany('Klavyio'), normalizeCompany('Klaviyo')); // typo stays a miss
});

test('Python-list titles parse, including apostrophes inside double quotes', () => {
  assert.deepEqual(parseTitleList(`["Data Engineer, Partner's Platform", 'BI Engineer']`),
    ["Data Engineer, Partner's Platform", 'BI Engineer']);
  assert.deepEqual(parseTitleList(''), []);
});

test('"Analytical Chemistry" and "Clinical Data Manager" are not data roles', () => {
  for (const t of ['Scientist, Analytical Chemistry', 'Senior Analytical Scientist', 'Clinical Data Manager', 'Engineering Manager Data Exchange'])
    assert.equal(isDataTitle(t, inc, exc), false, t);
  for (const t of ['Business Intelligence Engineer', 'Data Engineer II (00049724)', 'Analytics Engineer', 'Principal Data Scientist I'])
    assert.equal(isDataTitle(t, inc, exc), true, t);
});

// ── unit: gates ───────────────────────────────────────────────────────────
test('timeline: runway before OPT start = days to start + unused unemployment days', () => {
  const g = timelineGate(P);
  // 2026-10-03 → 2027-01-15 is 104 days; + 90 unemployment days = 194
  assert.equal(g.ok, true); assert.equal(g.runway_days, 194); assert.equal(g.factor, 1);
});

test('timeline: linear between lag and 2·lag, closed at ≤ lag', () => {
  const after = { ...P, as_of: '2027-02-01', unemployment_days_used: 0 }; // runway = 90
  assert.equal(timelineGate(after).factor, 0.5); // (90-60)/60
  assert.equal(timelineGate({ ...after, unemployment_days_used: 30 }).factor, 0); // runway 60 = lag
});

test('timeline: fails clearly on OPT already past / days exhausted / missing date', () => {
  assert.equal(timelineGate({ ...P, as_of: '2028-02-01' }).reason, 'opt-window-closed');
  assert.equal(timelineGate({ ...P, unemployment_days_used: 90 }).reason, 'unemployment-days-exhausted');
  assert.equal(timelineGate({ ...P, opt_start_date: undefined }).reason, 'timeline-input-missing');
});

test('liveness never defaults open; a Greenhouse 404 beats an "active" page', () => {
  const pw = parseLivenessLog(fs.readFileSync(path.join(FX, 'liveness.txt'), 'utf8'));
  const gh = JSON.parse(fs.readFileSync(path.join(FX, 'greenhouse-api.json'), 'utf8')).checks;
  const byId = Object.fromEntries(fixture.roles.map((r) => [r.role_id, r]));
  assert.equal(livenessGate(byId['proven-live'], pw, gh).factor, 1);
  const dead = livenessGate(byId['proven-dead'], pw, gh);
  assert.equal(dead.factor, 0); assert.equal(dead.conflict, true);
  assert.equal(livenessGate(byId['not-in-log'], pw, gh).reason, 'liveness-unchecked');
  assert.equal(livenessGate(byId['uncertain'], pw, gh).reason, 'liveness-uncertain');
  assert.equal(livenessGate(byId['gh-unconfirmed'], pw, gh).reason, 'liveness-unconfirmed');
  assert.equal(livenessGate({ role_id: 'x' }, pw, gh).reason, 'liveness-unchecked');
  assert.equal(greenhouseJobId('https://careers.toasttab.com/jobs?gh_jid=8029049'), '8029049');
});

// ── end to end through the real scorer ────────────────────────────────────
test('end-to-end: real scorer, failure cases unresolved (not zero), every value labeled', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'data-role-sponsor-match.log.json'), 'utf8'));
  const scores = JSON.parse(fs.readFileSync(path.join(r.out, 'role-scores.json'), 'utf8'));
  const roles = JSON.parse(fs.readFileSync(path.join(r.out, 'roles.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer'); // the maintained scorer wrote this
  assert.equal(scores.profile_needs_sponsorship, true);
  assert.ok(fs.existsSync(path.join(r.out, 'data-role-sponsor-match.report.md')));

  const by = Object.fromEntries(log.roles.map((e) => [e.role_id, e]));
  const reasons = (id) => by[id].unresolved.map((u) => u.reason);
  assert.deepEqual(reasons('blank-sponsor'), ['no-sponsorship-record']);
  assert.deepEqual(reasons('twin'), ['ambiguous-company-match']);
  assert.equal(by.twin.unresolved[0].candidates.length, 2);
  assert.deepEqual(reasons('unknown-co'), ['no-company-match']);
  assert.deepEqual(reasons('gh-unconfirmed'), ['liveness-unconfirmed']);
  assert.deepEqual(reasons('uncertain'), ['liveness-uncertain']);
  assert.deepEqual(reasons('not-in-log'), ['liveness-unchecked']);
  assert.deepEqual(reasons('no-fit'), ['fit-missing']);
  // unresolved roles never reach the scorer
  const sent = new Set(roles.map((x) => x.role_id));
  for (const e of log.roles) assert.equal(sent.has(e.role_id), e.status === 'scored', e.role_id);
  assert.deepEqual([...sent].sort(), ['likely-chem', 'proven-dead', 'proven-live', 'twin-resolved']);

  // composites recomputed from fixture inputs + the scorer's own weights
  const w = scores.config.weights;
  const expect = (p, fit) => Number((p * w.sponsorship + fit * w.fit).toFixed(4));
  const s = Object.fromEntries(scores.roles.map((x) => [x.role_id, x]));
  assert.equal(s['proven-live'].composite, expect(P.sponsorship_p_by_tier.Proven, 0.75));
  assert.equal(s['likely-chem'].composite, expect(P.sponsorship_p_by_tier.Likely, 0.5));
  assert.equal(s['twin-resolved'].composite, expect(P.sponsorship_p_by_tier.Proven, 0.6));
  assert.equal(s['proven-dead'].composite, 0);
  assert.equal(s['proven-dead'].machine_recommendation, 'Skip');
  assert.equal(by['likely-chem'].evidence.sponsorship.tier.value, 'Likely'); // chemistry titles did not count
  assert.equal(by['twin-resolved'].evidence.company_match.value, 'TWIN CORP');

  // role quality stays outside the scorer; a missing source value stays missing
  assert.ok(roles.every((x) => !('role_quality' in x)));
  assert.equal(by['likely-chem'].evidence.role_quality_context.cognitive_pivot_score.value, null);
  assert.equal(by['proven-dead'].evidence.role_quality_context.status, 'no-soc-row');

  // every { value, source } leaf carries one of the three labels
  const allowed = new Set(Object.values(SRC));
  let leaves = 0;
  (function walk(o) {
    if (o && typeof o === 'object') {
      if ('value' in o && 'source' in o) { leaves++; assert.ok(allowed.has(o.source), JSON.stringify(o).slice(0, 120)); }
      for (const k of Object.keys(o)) walk(o[k]);
    }
  })(log);
  assert.ok(leaves > 50, `only ${leaves} labeled values`);
});

test('OPT already past → exit 3, nothing scored, no roles.json', () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'drsm-in-')), 'c.json');
  fs.writeFileSync(tmp, JSON.stringify({ ...fixture, profile: { ...P, as_of: '2028-03-01' } }));
  const r = run([], tmp);
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stderr, /opt-window-closed/);
  assert.equal(fs.existsSync(path.join(r.out, 'roles.json')), false);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'data-role-sponsor-match.log.json'), 'utf8'));
  assert.equal(log.summary.scored, 0);
});

test('a blocked re-run in the same out-dir leaves no stale scores behind', () => {
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.ok(fs.existsSync(path.join(first.out, 'role-scores.json')));
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'drsm-in-')), 'c.json');
  fs.writeFileSync(tmp, JSON.stringify({ ...fixture, evidence: { liveness_log: path.join(FX, 'liveness.txt'), greenhouse_api: path.join(FX, 'greenhouse-api.json') }, profile: { ...P, as_of: '2028-03-01' } }));
  const again = spawnSync(process.execPath, [MATCH, '--input', tmp, '--out-dir', first.out,
    '--csv', path.join(FX, 'mini-80days.csv'), '--bls', path.join(FX, 'mini-bls.csv')], { encoding: 'utf8' });
  assert.equal(again.status, 3);
  for (const f of ['roles.json', 'role-scores.json', 'role-scores.md'])
    assert.equal(fs.existsSync(path.join(first.out, f)), false, `${f} survived a blocked run`);
});

test('out-dir guard holds even when the repo itself lives under the temp dir', () => {
  const X = path.posix, root = '/tmp/clone', tmp = '/tmp';
  const own = [`${root}/course/2026fa/submissions/kommurisi`, `${root}/scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/out`];
  assert.equal(outDirAllowed(`${root}/data/examples`, root, own, tmp, X), false); // the clean-checkout bug
  assert.equal(outDirAllowed(root, root, own, tmp, X), false);
  assert.equal(outDirAllowed(`${own[0]}/runs/latest`, root, own, tmp, X), true);
  assert.equal(outDirAllowed('/tmp/drsm-abc', root, own, tmp, X), true);
  assert.equal(outDirAllowed('/home/me/elsewhere', root, own, tmp, X), false);
});

test('refuses to write outside its namespace (would overwrite tracked files)', () => {
  const root = path.resolve(HERE, '../../../..');
  const r = spawnSync(process.execPath, [MATCH, '--input', path.join(FX, 'candidates.json'), '--out-dir', path.join(root, 'data/examples'),
    '--csv', path.join(FX, 'mini-80days.csv'), '--bls', path.join(FX, 'mini-bls.csv')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /refusing to write outside my namespace/);
});
