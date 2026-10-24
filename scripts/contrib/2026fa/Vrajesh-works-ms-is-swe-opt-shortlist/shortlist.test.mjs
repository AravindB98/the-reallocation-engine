// Offline tests for shortlist.mjs. No network, no browser. Run from the repo root:
//   node --test scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseCsv, parseTitles, deriveTier, timelineFactor, livenessFactor, fundingStatus,
  evaluate, loadSocRow, guardOutDir, UsageError,
} from './shortlist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const FIX = path.join(HERE, 'fixtures');
const csv = () => parseCsv(fs.readFileSync(path.join(FIX, 'mini-80days.csv'), 'utf8'));
const postings = () => JSON.parse(fs.readFileSync(path.join(FIX, 'postings.fixture.json'), 'utf8'));
const base = { asOf: '2026-10-02', optStart: '2027-01-15', unemploymentDays: 90, lagDays: 45, fit: 0.5 };

test('parseCsv keeps quoted commas and an escaped quote inside one cell', () => {
  const { records } = parseCsv('a,b\n"x, y","he said ""hi"""\n');
  assert.deepEqual(records[0], { a: 'x, y', b: 'he said "hi"' });
});

test('parseTitles reads single- and double-quoted list items', () => {
  assert.deepEqual(parseTitles(`['Software Engineer', "Dev's Lead"]`), ['Software Engineer', "Dev's Lead"]);
});

test('tier boundary: 9 approvals is Likely, 10 is Proven; senior-only never Proven; blank is None', () => {
  assert.equal(deriveTier({ approvals: 9, titles: ['Software Engineer'] }).tier, 'Likely');
  assert.equal(deriveTier({ approvals: 10, titles: ['Software Engineer'] }).tier, 'Proven');
  assert.equal(deriveTier({ approvals: 500, titles: ['Senior Software Engineer', 'Staff Software Engineer'] }).tier, 'Likely');
  assert.equal(deriveTier({ approvals: 500, titles: ['Software Engineer III'] }).tier, 'Likely');
  assert.equal(deriveTier({ approvals: 20, titles: ['Analyst'] }).tier, 'Possible');
  assert.equal(deriveTier({ approvals: null, titles: ['Software Engineer'] }).tier, 'None');
  assert.equal(deriveTier({ approvals: 0, titles: ['Software Engineer'] }).p, 0);
});

test('timeline boundaries: zero slack closes the gate, slack = lag fully opens it, half slack is 0.5', () => {
  // window ends 2027-04-15 (opt-start + 90 days)
  assert.equal(timelineFactor({ ...base, asOf: '2027-04-15' }).factor, 0);            // 0 days left
  assert.equal(timelineFactor({ ...base, asOf: '2027-03-01' }).factor, 0);            // 45 left, slack 0
  assert.equal(timelineFactor({ ...base, asOf: '2027-02-28' }).slack_days, 1);        // 46 left, slack 1
  assert.equal(timelineFactor({ ...base, asOf: '2027-01-30' }).factor, 0.667);        // 75 left, slack 30 of 45
  assert.equal(timelineFactor({ ...base, asOf: '2027-01-16' }).factor, 0.978);        // 89 left, slack 44 of 45
  assert.equal(timelineFactor({ ...base, asOf: '2027-01-15' }).factor, 1);            // 90 left, slack 45 = lag
  assert.equal(timelineFactor({ ...base, asOf: '2027-02-14', lagDays: 40 }).factor, 0.5); // 60 left, slack 20 of lag 40
});

test('timeline: window already past is 0; bad inputs fail loudly', () => {
  assert.equal(timelineFactor({ ...base, asOf: '2027-06-01' }).factor, 0);
  assert.throws(() => timelineFactor({ ...base, asOf: '2026-13-40' }), UsageError);
  assert.throws(() => timelineFactor({ ...base, asOf: '2026-02-30' }), /not a real date/);   // found by a break attempt: used to roll over to March 2
  assert.throws(() => timelineFactor({ ...base, optStart: '2027-04-31' }), /not a real date/);
  assert.doesNotThrow(() => timelineFactor({ ...base, asOf: '2028-02-29' }));                // real leap day still accepted
  assert.throws(() => timelineFactor({ ...base, lagDays: 0 }), UsageError);
  assert.throws(() => timelineFactor({ ...base, optStart: 'next spring' }), UsageError);
});

test('liveness: only a dated live/dead result counts; undated or uncertain is unresolved (null, not 1)', () => {
  assert.equal(livenessFactor({ status: 'live', checked_on: '2026-10-01' }), 1);
  assert.equal(livenessFactor({ status: 'dead', checked_on: '2026-10-01' }), 0);
  assert.equal(livenessFactor({ status: 'live' }), null);
  assert.equal(livenessFactor({ status: 'uncertain', checked_on: '2026-10-01' }), null);
  assert.equal(livenessFactor(null), null);
});

test('funding recency: 24-month boundary and blank date', () => {
  assert.equal(fundingStatus('2024-10-02', '2026-10-02').status, 'recent');
  assert.equal(fundingStatus('2024-09-01', '2026-10-02').status, 'stale');
  assert.equal(fundingStatus('', '2026-10-02').status, 'no-funding-record');
});

test('failure cases leave rows unscored with a reason and never invent a value', () => {
  const ev = evaluate({ csv: csv(), postings: postings(), ...base });
  const by = (c) => ev.results.find((r) => r.company.toUpperCase() === c);
  assert.equal(by('EXAMPLE NOT IN FILE CORP').status, 'not-in-csv');
  assert.equal(by('EXAMPLE TWIN INC').status, 'ambiguous');
  assert.equal(by('EXAMPLE SENIOR ONLY INC').status, 'liveness-unresolved');
  assert.equal(ev.roles.length, 4);
  assert.ok(ev.roles.every((r) => r.liveness.source === 'your-input' && r.sponsorship.source === 'record'));
});

test('a posting with no URL becomes a network target only when the sponsor record is real', () => {
  const ev = evaluate({ csv: csv(), postings: [{ company: 'EXAMPLE PROVEN SOFT INC', url: null }, { company: 'EXAMPLE NO SPONSOR INC', url: null }], ...base });
  assert.match(ev.results[0].next_action, /Network target/);
  assert.match(ev.results[1].next_action, /no action/);
});

test('a posting a human excluded (e.g. citizenship required) is never scored, even if the company is in the CSV', () => {
  const ev = evaluate({ csv: csv(), postings: [
    { company: 'EXAMPLE PROVEN SOFT INC', url: 'https://example.invalid/jobs/9', excluded_reason: 'U.S. citizenship required', liveness: { status: 'live', checked_on: '2026-10-01' } },
    { company: 'EXAMPLE PROVEN SOFT INC', url: 'https://example.invalid/jobs/10', excluded_reason: '   ', liveness: { status: 'live', checked_on: '2026-10-01' } },
  ], ...base });
  assert.equal(ev.results[0].status, 'excluded');
  assert.match(ev.results[0].next_action, /^Skip: U\.S\. citizenship required/);
  assert.equal(ev.results[1].status, 'scored'); // a blank reason excludes nothing
  assert.equal(ev.roles.length, 1);
});

const bridge = (over = {}) => ({ company: 'EXAMPLE NOT IN FILE CORP', title: 'Contract Software Engineer', employment_type: 'contract', track: 'opt-bridge',
  url: 'https://example.invalid/jobs/20', liveness: { status: 'live', checked_on: '2026-10-01' }, ...over });

test('opt-bridge track: a live posting is a candidate with NO sponsorship score, even when the company is absent from the CSV', () => {
  const ev = evaluate({ csv: csv(), postings: [bridge(), bridge({ company: 'EXAMPLE NO SPONSOR INC' })], ...base });
  assert.equal(ev.results[0].status, 'opt-bridge-open');
  assert.equal(ev.results[0].csv_match, 'not-in-csv');
  assert.equal(ev.results[1].status, 'opt-bridge-open');   // a no-sponsor company is NOT a Skip on this track
  assert.equal(ev.results[1].tier, undefined);
  assert.equal(ev.roles.length, 0);                         // the scorer never sees a bridge row
  assert.match(ev.results[0].next_action, /confirmed it is allowed on your OPT/);
});

test('opt-bridge track: dead posting, closed timeline, unresolved liveness, no URL and unknown track are all handled without inventing a value', () => {
  const dead = evaluate({ csv: csv(), postings: [bridge({ liveness: { status: 'dead', checked_on: '2026-10-01' } })], ...base });
  assert.equal(dead.results[0].status, 'opt-bridge-closed');
  assert.match(dead.results[0].next_action, /not live/);
  const late = evaluate({ csv: csv(), postings: [bridge()], ...base, asOf: '2027-04-01' });
  assert.equal(late.results[0].status, 'opt-bridge-closed');
  assert.match(late.results[0].next_action, /OPT window closes/);
  const unresolved = evaluate({ csv: csv(), postings: [bridge({ liveness: { status: 'live' } }), bridge({ url: null })], ...base });
  assert.equal(unresolved.results[0].status, 'liveness-unresolved');
  assert.equal(unresolved.results[1].status, 'opt-bridge-no-posting');
  const typo = evaluate({ csv: csv(), postings: [bridge({ track: 'opt_bridge' })], ...base });
  assert.equal(typo.results[0].status, 'invalid-posting');   // a typo must not silently score on the sponsorship track
  const excluded = evaluate({ csv: csv(), postings: [bridge({ excluded_reason: 'U.S. citizenship required' })], ...base });
  assert.equal(excluded.results[0].status, 'excluded');      // a human exclusion beats the bridge track
});

test('schema drift: a missing required column stops the run', () => {
  const c = parseCsv('company_name,Total Approvals\nX,1\n');
  assert.throws(() => evaluate({ csv: c, postings: [], ...base }), /schema drift/);
});

test('SOC with no row stops; the real compact file has 15-1252', () => {
  const file = path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv');
  assert.throws(() => loadSocRow(file, '99-9999'), /no row for SOC/);
  assert.equal(loadSocRow(file, '15-1252').title, 'Software Developers');
});

test('out-dir guard refuses tracked repo paths such as data/examples', () => {
  assert.throws(() => guardOutDir(path.join(REPO, 'data/examples')), UsageError);
  assert.doesNotThrow(() => guardOutDir(path.join(os.tmpdir(), 'x')));
});

test('end to end through the REAL scorer: live Proven applies, dead Proven is gated to Skip, soft tier is Consider', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'shortlist-'));
  const r = spawnSync(process.execPath, [path.join(HERE, 'shortlist.mjs'), '--postings', path.join(FIX, 'postings.fixture.json'),
    '--csv', path.join(FIX, 'mini-80days.csv'), '--as-of', '2026-10-02', '--opt-start', '2027-01-15', '--out-dir', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'shortlist-log.json'), 'utf8'));
  const rec = (c) => log.results.find((x) => x.company.toUpperCase() === c);
  assert.equal(rec('EXAMPLE PROVEN SOFT INC').recommendation, 'Apply');
  assert.equal(rec('EXAMPLE BOUNDARY TEN LLC').recommendation, 'Skip');
  assert.match(rec('EXAMPLE BOUNDARY TEN LLC').reason, /gated: liveness/);
  assert.match(rec('EXAMPLE BOUNDARY TEN LLC').next_action, /Network, don't apply/);
  assert.equal(rec('EXAMPLE BOUNDARY NINE LLC').recommendation, 'Consider');
  assert.equal(rec('EXAMPLE NO SPONSOR INC').recommendation, 'Skip');
  assert.equal(log.human_gate.cleared, false);
  assert.ok(fs.existsSync(path.join(out, 'role-scores.json')) && fs.existsSync(path.join(out, 'shortlist-report.md')));
  assert.match(fs.readFileSync(path.join(out, 'shortlist-report.md'), 'utf8'), /NOT CLEARED/);
});

test('CLI: unknown SOC exits 2; an OPT window already past gates every scored role to Skip', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'shortlist-'));
  const common = ['--postings', path.join(FIX, 'postings.fixture.json'), '--csv', path.join(FIX, 'mini-80days.csv'), '--opt-start', '2027-01-15', '--out-dir', out];
  const bad = spawnSync(process.execPath, [path.join(HERE, 'shortlist.mjs'), ...common, '--as-of', '2026-10-02', '--soc', '99-9999'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /no row for SOC/);
  const late = spawnSync(process.execPath, [path.join(HERE, 'shortlist.mjs'), ...common, '--as-of', '2027-06-01'], { encoding: 'utf8' });
  assert.equal(late.status, 0, late.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'shortlist-log.json'), 'utf8'));
  assert.ok(log.results.filter((x) => x.status === 'scored').every((x) => x.recommendation === 'Skip'));
});
