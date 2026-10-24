// triage.test.mjs — offline tests (node --test). No network: every input is a
// local fixture or a shipped repo file. The scorer is the real
// scripts/score/role-scorer.mjs, run by triage.mjs as a CLI — not a copy.
//
//   node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseCSV, buildIndex, matchCompany, parseTitleList, classifyTitle, sponsorshipEvidence,
  timelineFactor, livenessGate, validatePersona, parseISO,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = (f) => path.join(HERE, 'fixtures', f);
const persona = JSON.parse(fs.readFileSync(FX('persona-dec-grad.json'), 'utf8'));
const mini = parseCSV(fs.readFileSync(FX('mini-80days.csv'), 'utf8'));
const idx = buildIndex(mini);
const TODAY = parseISO('2026-10-01');
const LABELS = new Set(['record', 'model-judgment', 'your-input']);

function triage(args) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-'));
  const r = spawnSync(process.execPath, [path.join(HERE, 'triage.mjs'), '--out-dir', out, ...args], { encoding: 'utf8' });
  return { ...r, out };
}

test('CSV parser keeps quoted commas inside a field', () => {
  assert.equal(mini.length, 8);
  assert.ok(mini.some((r) => r.company_name === 'ETA SYSTEMS, INC'));
});

test('G1: unmatched name → no-company-match, no value invented', () => {
  const m = matchCompany(idx, 'Google');
  assert.equal(m.status, 'missing');
  assert.equal(m.reason, 'no-company-match');
  assert.equal(m.row, undefined);
});

test('G1: two rows with the same key → ambiguous, never picks one', () => {
  const m = matchCompany(idx, 'Delta Inc');
  assert.equal(m.reason, 'ambiguous-company-match');
  assert.deepEqual(m.candidates.sort(), ['DELTA INC', 'DELTA, INC.'].sort());
});

test('G1: no suffix stripping — "Alpha Software" does not match "ALPHA SOFTWARE INC"', () => {
  assert.equal(matchCompany(idx, 'Alpha Software').status, 'missing');
  assert.equal(matchCompany(idx, 'Alpha Software, Inc.').status, 'ok');
});

test('title classifier: entry / mid / senior / unlevelled / non-swe', () => {
  assert.equal(classifyTitle('Software Engineer I'), 'entry');
  assert.equal(classifyTitle('Software Engineer II'), 'mid');
  assert.equal(classifyTitle('Sr. Software Engineer, Machine Learning'), 'senior');
  assert.equal(classifyTitle('Staff Software Engineer'), 'senior');
  assert.equal(classifyTitle('Software Engineer'), 'unlevelled');
  assert.equal(classifyTitle('Senior Consultant'), 'non-swe');
  assert.deepEqual(parseTitleList("['A', \"B's\", 'C']"), ['A', "B's", 'C']);
});

test('sponsorship buckets come from the title evidence, not approval volume', () => {
  const row = (n) => mini.find((r) => r.company_name === n);
  assert.equal(sponsorshipEvidence(row('ALPHA SOFTWARE INC'), 100).bucket, 'entry-explicit');
  assert.equal(sponsorshipEvidence(row('BETA CORP'), 100).bucket, 'senior-only-swe');
  const zeta = sponsorshipEvidence(row('ZETA CONSULTING LLP'), 100); // 1000 approvals, no SWE title
  assert.equal(zeta.bucket, 'no-swe-title');
  assert.equal(zeta.tier, 'Unknown'); // Unknown, not Avoid: the list is only the TOP titles
  assert.equal(sponsorshipEvidence(row('GAMMA LLC'), 100).reason, 'below-big-sponsor-threshold');
  assert.equal(sponsorshipEvidence(row('EPSILON CO'), 100).reason, 'no-title-evidence');
});

test('G3 timeline: after deadline → 0; buffer → 0.5; inside → 1; missing date → labeled estimate', () => {
  // fixture persona: OPT start 2027-01-11, 90 days → deadline 2027-04-11, buffer 14d
  const at = (d) => timelineFactor(persona, { start_date: { value: d } }, TODAY);
  assert.equal(at('2027-07-12').factor, 0.0);
  assert.equal(at('2027-04-11').deadline, '2027-04-11');
  assert.equal(at('2027-04-05').factor, 0.5);
  assert.equal(at('2027-02-16').factor, 1.0);
  assert.equal(at('2026-12-20').factor, 0.5); // before OPT start
  const est = timelineFactor(persona, { start_date: null }, TODAY);
  assert.match(est.basis, /^estimated/);
  assert.equal(est.source, 'your-input');
  assert.equal(at('2027-02-30').reason, 'invalid-start-date');
});

test('G2 liveness: unchecked is missing; a fixture check is your-input, not record', () => {
  assert.equal(livenessGate({ liveness: { status: 'unchecked' } }).reason, 'liveness-unchecked');
  assert.equal(livenessGate({}).reason, 'liveness-unchecked');
  assert.equal(livenessGate({ liveness: { status: 'active', method: 'fixture' } }).source, 'your-input');
  assert.equal(livenessGate({ liveness: { status: 'active', method: 'npm run ats:liveness', checked_on: '2026-10-01' } }).source, 'record');
  assert.equal(livenessGate({ liveness: { status: 'expired', method: 'fixture' } }).factor, 0);
});

test('persona validation refuses missing / out-of-window dates', () => {
  assert.ok(validatePersona({}).length > 0);
  const bad = structuredClone(persona); bad.opt_start_date.value = '2027-03-30'; // >60 days after program end
  assert.ok(validatePersona(bad).some((e) => /0–60 days/.test(e)));
  assert.deepEqual(validatePersona(persona), []);
});

test('end-to-end on fixtures: both outputs written, every term labeled, gates behave', () => {
  const r = triage(['--csv', FX('mini-80days.csv'), '--postings', FX('postings-sample.json'), '--today', '2026-10-01']);
  // mini CSV has none of the sample companies → every posting must be excluded at G1, none scored
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'triage-log.json'), 'utf8'));
  assert.equal(log.summary.scored, 0);
  assert.ok(log.excluded.every((e) => e.reason === 'no-company-match'));
  assert.ok(fs.existsSync(path.join(r.out, 'triage-report.md')));
});

test('end-to-end on the shipped 80 Days CSV: real scorer, labeled terms, closed gates → Skip', () => {
  const r = triage(['--today', '2026-10-01']);
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(r.out, 'triage-log.json'), 'utf8'));
  const roles = JSON.parse(fs.readFileSync(path.join(r.out, 'roles.json'), 'utf8'));
  for (const role of roles)
    for (const k of ['sponsorship', 'liveness', 'timeline', 'fit'])
      if (role[k]) assert.ok(LABELS.has(role[k].source), `${role.role_id}.${k} has label ${role[k].source}`);
  // property checks (not expected verdicts): any closed gate must come back Skip from the real scorer
  for (const d of log.decisions) {
    const gates = d.trace.gates;
    if (gates.some((g) => g.multiplier === 0)) assert.equal(d.recommendation, 'Skip', d.posting_id);
  }
  // every posting the INPUT marks expired must reach the scorer with liveness multiplier 0 (added after mutant M1 slipped past this test)
  const input = JSON.parse(fs.readFileSync(FX('postings-sample.json'), 'utf8')).postings;
  for (const po of input.filter((x) => x.liveness?.status === 'expired')) {
    const d = log.decisions.find((x) => x.posting_id === po.posting_id);
    if (d) assert.equal(d.trace.gates.find((g) => g.factor === 'liveness').multiplier, 0, po.posting_id);
  }
  // nothing that failed a gate reached the scorer (the scorer would default a missing gate to 1)
  const scoredIds = new Set(roles.map((x) => x.role_id));
  for (const e of log.excluded) assert.ok(!scoredIds.has(e.posting_id), `${e.posting_id} leaked into roles.json`);
  // an estimated start date must be visible to the human, not look like a stated one
  const report = fs.readFileSync(path.join(r.out, 'triage-report.md'), 'utf8');
  const estimated = log.detail.filter((d) => d.timeline.basis.startsWith('estimated'));
  assert.ok(estimated.length > 0);
  for (const d of estimated)
    assert.match(report.split('\n').find((l) => l.startsWith(`| ${d.csv_company} |`)), /ESTIMATED/);
  // "Meta Platforms" must not resolve to an unrelated META row
  assert.ok(log.excluded.some((e) => e.company === 'Meta Platforms' && e.reason === 'no-company-match'));
});

test('G0: closed unemployment window halts with exit 3 and writes no roles', () => {
  const r = triage(['--persona', FX('persona-window-closed.json'), '--today', '2026-10-01']);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /G0 window-closed/);
  assert.ok(!fs.existsSync(path.join(r.out, 'roles.json')));
});

test('missing data file fails clearly with exit 2', () => {
  const r = triage(['--csv', FX('does-not-exist.csv'), '--today', '2026-10-01']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /sponsorship CSV not found/);
});
