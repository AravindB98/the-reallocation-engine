// live.test.mjs — offline tests for the swe-opt-clock-live mode.
//   node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs
// Fixtures plus local repo data only. capture.mjs is the one network step and is
// not run here; its pure rules live in live-lib.mjs and are tested directly. The
// last test checks that nothing on the offline path imports a network module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  GATE_ZERO, buildTitleFilter, filterBoardJobs, scanOfferKey, compareWithScan, titleLevel, newGradTitle, cohortStart,
  postingIdOf, idRetained, livenessFromCapture, startLag, sponsorshipOnlyApply, checkScorerArithmetic,
} from '../live-lib.mjs';
import { parseDate } from '../../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const REPO = path.resolve(DIR, '../../../..');
const FIX = path.join(DIR, 'fixtures');
const EVALUATE = path.join(DIR, 'evaluate.mjs');
const CAPTURE = path.join(FIX, 'test-capture.json');
const DECISIONS = path.join(FIX, 'test-board-decisions.yml');
const WHATIF = path.join(FIX, 'persona-neel-whatif-day10.yml');
const FIT = path.join(FIX, 'test-fit.json');
const BROKEN_ADDITIVE = path.join(FIX, 'BROKEN-additive-gates-scorer.mjs');
const D = (s) => parseDate(s);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'swe-opt-clock-live-'));
const evaluateWith = (capture, ...args) => spawnSync(process.execPath, [EVALUATE, '--capture', capture, '--board-decisions', DECISIONS, ...args], { cwd: REPO, encoding: 'utf8' });
const evaluate = (...args) => evaluateWith(CAPTURE, ...args);
const readOut = (dir, f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const roleById = (log, id) => log.roles.find((r) => r.role_id === id);
const writeTmp = (dir, name, content) => { const p = path.join(dir, name); fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content)); return p; };

test('title rule: new-grad SWE titles pass, senior and level III+ do not, in every level format', () => {
  assert.deepEqual(
    ['Software Engineer I, Fullstack', 'Software Engineer II - Recommendations', 'Software Engineer III, Platform', 'Software Engineer - II',
      'Software Engineer (III)', 'Software Engineer, Level 3', 'Software Engineer VI', 'Software Engineer, E-commerce'].map(titleLevel),
    [1, 2, 3, 2, 3, 3, 6, null]);
  assert.deepEqual(
    ['Software Engineer I, Fullstack', 'Software Engineer II, Developer Experience', 'Software Engineer (III)',
      'Senior or Staff Software Engineer, Infrastructure', '3D Print Optimization Engineer - June 2027 New Grads',
      'Software Engineer - June 2027 New Grads', 'Embedded Software Engineer'].map((t) => newGradTitle(t).code),
    ['level-1', 'level-2', 'level-3', 'senior-title', 'not-swe-title', 'entry-marked', 'unmarked']);
});

test('cohort start: of every date a new-grad title names, the earliest wins', () => {
  assert.deepEqual(cohortStart('Software Engineer - June 2027 New Grads'), { date: '2027-06-01', precision: 'month-or-season', matched: 'June 2027' });
  assert.equal(cohortStart('Electrical Engineer - Dec 2026 & May 2027 Graduates').date, '2026-12-01');
  assert.equal(cohortStart('Software Engineer, New Grad (Summer/Fall 2027)').date, '2027-06-01');
  assert.equal(cohortStart('Software Engineer, New Grad (Jan-Jun 2027)').date, '2027-01-01');
  assert.deepEqual(cohortStart('New Grad Software Engineer 2027'), { date: '2027-01-01', precision: 'year', matched: '2027' });
  assert.equal(cohortStart('Software Engineer, Marketing Systems - New Grad 2027').date, '2027-01-01', '"Marketing" is not March');
  assert.equal(cohortStart('Software Engineer II - 2027 roadmap'), null, 'a year without a new-grad marker is not a cohort');
  assert.equal(cohortStart('Software Engineer II'), null);
});

test('start lag: the hiring time is a floor; a cohort date can only push the start later', () => {
  const asOf = D('2026-10-21');
  const a = { default: { days: 45, basis: 'assumption', source: 'your-input' }, overrides: { 'TOAST INC': { days: 30, basis: 'b', source: 'model-judgment' } } };
  const later = startLag('X', { date: '2027-06-01', precision: 'month-or-season', matched: 'June 2027' }, a, asOf);
  assert.deepEqual([later.lag_days, later.kind, later.source], [223, 'title-cohort', 'record']);
  // The review's case: "New Grad 2026" is in the past, so the 45-day loop still applies.
  const past = startLag('X', cohortStart('Software Engineer, New Grad 2026'), a, asOf);
  assert.deepEqual([past.lag_days, past.kind, past.cohort_lag_days], [45, 'default-assumption', -293]);
  assert.deepEqual([startLag('TOAST INC', null, a, asOf).lag_days, startLag('TOAST INC', null, a, asOf).source], [30, 'model-judgment']);
  assert.equal(startLag('X', null, {}, asOf).lag_days, null);
});

test('redirect rule: the posting id must survive the navigation, as a whole token', () => {
  assert.equal(postingIdOf('https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003'), '7855798003');
  assert.equal(postingIdOf('https://job-boards.greenhouse.io/formlabs/jobs/1'), '1');
  assert.equal(postingIdOf('https://jobs.ashbyhq.com/regent/698D38B7-c47e-40a1-bf78-31d59c395c23'), '698d38b7-c47e-40a1-bf78-31d59c395c23');
  assert.equal(postingIdOf('https://example.com/careers'), null);
  // The real case from 2026-10-21: a fake Formlabs id redirected (HTTP 200) to the careers home page.
  assert.equal(idRetained('https://job-boards.greenhouse.io/formlabs/jobs/1', 'https://careers.formlabs.com/'), false);
  assert.equal(idRetained('https://job-boards.greenhouse.io/formlabs/jobs/1', 'https://careers.formlabs.com/job/7506561/'), false, '"1" inside another id is not retention');
  assert.equal(idRetained('https://www.pathai.com/careers/8696764002?gh_jid=8696764002', 'https://www.pathai.com/career/job-post?gh_jid=8696764002'), true);
  assert.equal(idRetained('https://example.com/careers', 'https://example.com/'), null);
});

test('liveness from a capture: active counts only on the posting; uncertain, stale and missing are held; local dates', () => {
  const asOf = D('2026-10-21');
  const ok = { result: 'active', code: 'apply_control_visible', reason: 'x', id_retained: true, checked_date: '2026-10-21' };
  assert.equal(livenessFromCapture(ok, asOf).factor, 1);
  assert.equal(livenessFromCapture({ ...ok, result: 'expired', code: 'http_gone' }, asOf).factor, 0);
  const moved = livenessFromCapture({ ...ok, id_retained: false, final_url: 'https://careers.formlabs.com/' }, asOf);
  assert.deepEqual([moved.hold, moved.code], [true, 'redirected-off-posting']);
  assert.equal(livenessFromCapture({ ...ok, result: 'uncertain', code: 'no_apply_control' }, asOf).hold, true);
  assert.equal(livenessFromCapture({ ...ok, checked_date: '2026-10-17' }, asOf).code, 'check-stale');
  assert.equal(livenessFromCapture({ ...ok, checked_date: '2026-10-18' }, asOf).factor, 1, '3 days old is still inside the limit');
  assert.equal(livenessFromCapture({ ...ok, checked_date: '2026-10-22' }, asOf).code, 'check-after-run-date');
  // The review's evening case: 21:30 EDT on Oct 21 is 01:30Z on Oct 22. The local date decides.
  assert.equal(livenessFromCapture({ ...ok, checked_at: '2026-10-22T01:30:00.000Z' }, asOf).factor, 1);
  assert.equal(livenessFromCapture({ ...ok, checked_date: undefined }, asOf).code, 'check-undated');
  assert.equal(livenessFromCapture(null, asOf).code, 'not-checked');
});

test('board filter loop: scan.mjs order and dedup, and the mirror still matches scan.mjs source', () => {
  const f = { titleFilter: buildTitleFilter({ positive: ['software engineer'], negative: ['senior'] }), locationFilter: (l) => !/india/i.test(l), seen: { urls: new Set(), keys: new Set() } };
  const job = (title, location, url, company = 'ACME') => ({ title, location, url, company });
  const a = filterBoardJobs([job('Software Engineer', 'Boston, MA', 'u1'), job('Senior Software Engineer', 'Boston, MA', 'u2'),
    job('Software Engineer', 'Hyderabad, India', 'u3'), job('Software Engineer', 'Remote', 'u4'), job('Data Analyst', 'Boston', 'u5')], f);
  assert.deepEqual(a.counts, { found: 5, filtered_title: 2, filtered_location: 1, duplicates: 1, passed: 1 }, 'same company + title is a duplicate, as in scan.mjs');
  const b = filterBoardJobs([job('Software Engineer', 'Boston, MA', 'u1', 'OTHER')], f);
  assert.equal(b.counts.duplicates, 1, 'seen URLs carry across boards');
  assert.equal(buildTitleFilter({})('anything'), true, 'empty positive list passes every title, as in scan.mjs');
  assert.equal(scanOfferKey({ company: 'A', title: 'T', location: '' }), 'A | T | N/A');
  const scan = fs.readFileSync(path.join(REPO, 'scripts/ats/scan.mjs'), 'utf8');
  assert.match(scan, /positive\.length === 0 \|\| positive\.some\(k => lower\.includes\(k\)\)/, 'scan.mjs title filter changed: update the mirror in live-lib.mjs');
  assert.match(scan, /const key = `\$\{job\.company\.toLowerCase\(\)\}::\$\{job\.title\.toLowerCase\(\)\}`/, 'scan.mjs dedup key changed');
});

test('scan comparison: same lists match; a missing or extra posting does not; private history is allowed for', () => {
  assert.equal(compareWithScan(['a', 'b'], ['a', 'b'], 0, 0).match, true);
  assert.equal(compareWithScan(['a', 'b'], ['a', 'c'], 0, 0).match, false, 'same totals, different postings');
  assert.equal(compareWithScan(['a', 'b'], ['a'], 0, 0).match, false);
  assert.equal(compareWithScan(['a', 'b'], ['a'], 0, 1).match, true, 'the scan saw one more duplicate (its own history)');
  assert.equal(compareWithScan(['a'], ['a', 'b'], 0, 0).match, false, 'the scan has one the capture lacks');
});

test('e2e, today\'s clock: wrong board dropped, unsigned boards held, every open-board job closed by the timeline', () => {
  const out = tmp();
  const r = evaluate('--out-dir', out);
  assert.equal(r.status, 0, r.stderr);
  const log = readOut(out, 'run-log.json');
  assert.equal(log.status, 'completed');
  assert.equal(roleById(log, 'ashby:1b909aeb-1221-476f-88fe-8300a2065975').disposition, 'dropped');
  assert.equal(roleById(log, 'ashby:698d38b7-c47e-40a1-bf78-31d59c395c23').holds[0].code, 'board-ownership-unconfirmed');
  assert.equal(roleById(log, 'greenhouse:8245633').holds[0].code, 'board-ownership-unconfirmed', 'confirmed without a name is not confirmed');
  assert.equal(roleById(log, 'manual:1').holds[0].code, 'liveness-redirected-off-posting');
  const klaviyo = roleById(log, 'greenhouse:7855798003');
  assert.deepEqual([klaviyo.disposition, klaviyo.decision.recommendation, klaviyo.fit_needed], ['scored', 'Skip', false]);
  assert.equal(log.summary.needs_fit_rating, 0, 'no fit is asked for when a gate already decides');
  assert.equal(log.gates.G4_scorer_conformance.result, 'pass');
  assert.ok(!roleById(log, 'greenhouse:1234567003'), 'a level III title is not evaluated');
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /^# .*\n\n## Executive summary\n/);
});

test('e2e: an unsigned rejection holds the posting instead of silently dropping it', () => {
  const dir = tmp();
  const d = yaml.load(fs.readFileSync(DECISIONS, 'utf8'));
  d.decisions.push({ board: 'https://jobs.ashbyhq.com/cohere', status: 'rejected', evidence: 'edited without a name' });
  const decisions = writeTmp(dir, 'decisions.yml', yaml.dump(d));
  const out = path.join(dir, 'out');
  const r = spawnSync(process.execPath, [EVALUATE, '--capture', CAPTURE, '--board-decisions', decisions, '--out-dir', out], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(roleById(readOut(out, 'run-log.json'), 'ashby:1b909aeb-1221-476f-88fe-8300a2065975').holds[0].code, 'board-ownership-unconfirmed');
});

test('e2e, what-if clock: open-gate jobs go to the fit worksheet; a cohort date still closes the gate', () => {
  const out = tmp();
  const r = evaluate('--persona', WHATIF, '--out-dir', out);
  assert.equal(r.status, 0, r.stderr);
  const log = readOut(out, 'run-log.json');
  assert.deepEqual(roleById(log, 'greenhouse:7855798003').holds.map((h) => h.code), ['needs-fit-rating']);
  const cohort = roleById(log, 'greenhouse:9999999');
  assert.deepEqual([cohort.timeline.lag_kind, cohort.timeline.factor, cohort.decision.recommendation], ['title-cohort', 0, 'Skip']);
  assert.equal(roleById(log, 'greenhouse:7506561').holds[0].code, 'liveness-no_apply_control');
  const tpl = readOut(out, 'fit-template.json');
  assert.deepEqual(Object.keys(tpl).sort(), ['greenhouse:7855798003', 'greenhouse:8696764002']);
  assert.ok(Object.values(tpl).every((v) => v.p === null), 'the template never pre-fills a rating');
});

test('e2e: a timeline at the scorer\'s gate_zero counts as closed, so no fit is asked for', () => {
  const dir = tmp();
  const p = yaml.load(fs.readFileSync(WHATIF, 'utf8'));
  p.visa.buffer_target = 20; // hard deadline 2027-01-09; a 79-day lag starts 1 day before it → factor 1/20 = 0.05
  const persona = writeTmp(dir, 'persona.yml', yaml.dump(p));
  const lag = writeTmp(dir, 'lag.json', { default: { days: 79, basis: 'test', source: 'your-input' } });
  const out = path.join(dir, 'out');
  const r = evaluate('--persona', persona, '--time-to-start', lag, '--out-dir', out);
  assert.equal(r.status, 0, r.stderr);
  const k = roleById(readOut(out, 'run-log.json'), 'greenhouse:7855798003');
  assert.equal(k.timeline.factor, GATE_ZERO);
  assert.deepEqual([k.disposition, k.fit_needed, k.decision.recommendation], ['scored', false, 'Skip']);
});

test('e2e, what-if clock with fit: AI-written ratings reach the scorer labeled model-judgment; bad ratings warn', () => {
  const out = tmp();
  const r = evaluate('--persona', WHATIF, '--fit', FIT, '--out-dir', out);
  assert.equal(r.status, 0, r.stderr);
  const scores = readOut(out, 'role-scores.json');
  const pathai = scores.roles.find((s) => s.role_id === 'greenhouse:8696764002');
  assert.ok(pathai.trace.votes.some((v) => v.factor === 'fit' && v.source === 'model-judgment'));
  assert.equal(readOut(out, 'run-log.json').summary.needs_fit_rating, 0);
  for (const s of scores.roles) for (const t of [...s.trace.votes, ...s.trace.gates]) assert.ok(['record', 'your-input', 'model-judgment'].includes(t.source));
  const dir = tmp();
  const bad = writeTmp(dir, 'fit.json', { 'greenhouse:7855798003': { p: 1.5, source: 'your-input' }, 'greenhouse:0000': { p: 0.5 } });
  const r2 = evaluate('--persona', WHATIF, '--fit', bad, '--out-dir', path.join(dir, 'out'));
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(readOut(path.join(dir, 'out'), 'run-log.json').warnings.length, 2);
  assert.match(r2.stderr, /not a number in \[0, 1\]/);
});

test('an Apply carried by sponsorship alone goes to networking, not the 2-hour block (found on the first live run)', () => {
  const score = (fitP) => ({ recommendation: 'Apply', trace: { gate_product: 1, votes: [{ factor: 'sponsorship', contribution: 0.315 }, { factor: 'fit', contribution: 0.3 * fitP }] } });
  assert.equal(sponsorshipOnlyApply(score(0.1), 0.3, 0.1), true);
  assert.equal(sponsorshipOnlyApply(score(0.6), 0.3, 0.6), false, 'a real fit keeps the 2-hour block');
  assert.equal(sponsorshipOnlyApply({ ...score(0.1), recommendation: 'Consider' }, 0.3, 0.1), false);
  const dir = tmp();
  const fit = writeTmp(dir, 'fit.json', { 'greenhouse:7855798003': { p: 0.1, source: 'model-judgment', note: 'test' }, 'greenhouse:8696764002': { p: 0.8, source: 'model-judgment', note: 'test' } });
  const out = path.join(dir, 'out');
  assert.equal(evaluate('--persona', WHATIF, '--fit', fit, '--out-dir', out).status, 0);
  const log = readOut(out, 'run-log.json');
  const weak = roleById(log, 'greenhouse:7855798003');
  assert.deepEqual([weak.decision.recommendation, weak.next.block, weak.flags], ['Apply', 'network-3h', ['sponsorship-only-apply']], 'the scorer\'s Apply is reported unchanged; only the block moves');
  assert.equal(roleById(log, 'greenhouse:8696764002').next.block, 'apply-2h');
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /come from sponsorship alone/);
});

test('stop: a capture older than 3 days is refused, nothing is scored', () => {
  const out = tmp();
  const r = evaluate('--as-of', '2026-10-25', '--out-dir', out);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /capture-stale/);
  assert.equal(readOut(out, 'run-log.json').status, 'stopped');
  assert.ok(!fs.existsSync(path.join(out, 'report.md')) && !fs.existsSync(path.join(out, 'role-scores.json')));
});

test('stop: a capture whose postings differ from the engine\'s scan is refused, whatever it says about itself', () => {
  const dir = tmp();
  const cap = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));
  cap.scan_crosscheck.scan.offer_keys = cap.scan_crosscheck.scan.offer_keys.slice(1).concat('SOMEONE | Software Engineer | Boston, MA');
  cap.scan_crosscheck.result = { match: true }; // a capture's own verdict is not trusted
  const out = path.join(dir, 'out');
  const r = evaluateWith(writeTmp(dir, 'capture.json', cap), '--out-dir', out);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /scan-crosscheck-failed: .*only in scan 1, only in capture 1/);
  assert.ok(!fs.existsSync(path.join(out, 'report.md')));
});

test('stop: a persona with no needs_sponsorship and an undated count stops at G0; a non-sponsor persona is out of scope', () => {
  const r = evaluate('--persona', path.join(REPO, 'search/examples/aarav-patel/profile.yml'), '--out-dir', tmp());
  assert.equal(r.status, 3);
  assert.match(r.stderr, /needs-sponsorship-missing/);
  const dir = tmp();
  const p = yaml.load(fs.readFileSync(WHATIF, 'utf8'));
  p.needs_sponsorship = false;
  const r2 = evaluate('--persona', writeTmp(dir, 'p.yml', yaml.dump(p)), '--out-dir', path.join(dir, 'out'));
  assert.equal(r2.status, 3);
  assert.match(r2.stderr, /persona-out-of-scope/);
});

test('a failed run leaves no earlier log or report behind', () => {
  const out = tmp();
  assert.equal(evaluate('--out-dir', out).status, 0);
  assert.ok(fs.existsSync(path.join(out, 'run-log.json')));
  const bad = writeTmp(tmp(), 'fit.json', '{not json');
  const r = evaluate('--fit', bad, '--out-dir', out);
  assert.equal(r.status, 2);
  assert.deepEqual(fs.readdirSync(out), [], 'the old completed log must not survive an input error');
});

test('break: an additive-gates scorer is caught at G4 and leaves no scores behind', () => {
  const out = tmp();
  const r = evaluate('--persona', WHATIF, '--fit', FIT, '--scorer', BROKEN_ADDITIVE, '--out-dir', out);
  assert.equal(r.status, 4, r.stderr);
  assert.match(r.stderr, /closed gate/);
  assert.ok(!fs.existsSync(path.join(out, 'report.md')) && !fs.existsSync(path.join(out, 'role-scores.json')));
});

test('break: with every gate open, the additive scorer is still caught by the arithmetic check (missed on the first live run)', () => {
  const dir = tmp();
  const cap = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));
  cap.postings = cap.postings.filter((p) => ['greenhouse:7855798003', 'greenhouse:8696764002'].includes(p.posting_id));
  const keys = cap.postings.map((p) => scanOfferKey(p).trim());
  Object.assign(cap.scan_crosscheck.scan, { found: keys.length, offer_keys: keys });
  Object.assign(cap.scan_crosscheck.capture, { found: keys.length, offer_keys: keys });
  const capPath = writeTmp(dir, 'capture.json', cap);
  const good = evaluateWith(capPath, '--persona', WHATIF, '--fit', FIT, '--out-dir', path.join(dir, 'good'));
  assert.equal(good.status, 0, good.stderr);
  assert.equal(readOut(path.join(dir, 'good'), 'run-log.json').summary.timeline_closed, 0, 'no gate is closed in this data');
  const r = evaluateWith(capPath, '--persona', WHATIF, '--fit', FIT, '--scorer', BROKEN_ADDITIVE, '--out-dir', path.join(dir, 'broken'));
  assert.equal(r.status, 4, r.stderr);
  assert.match(r.stderr, /trace shows nothing|composite .* (≠|cannot be recomputed)/);
  assert.deepEqual(checkScorerArithmetic({ roles: [] }, []), []);
});

test('refuses to write outside its namespace; outputs outside the repo carry no local path', () => {
  const r = evaluate('--out-dir', 'data/examples/oops');
  assert.equal(r.status, 2);
  assert.ok(!fs.existsSync(path.join(REPO, 'data/examples/oops')));
  const out = tmp();
  assert.equal(evaluate('--persona', WHATIF, '--fit', FIT, '--out-dir', out).status, 0);
  for (const f of fs.readdirSync(out)) assert.ok(!fs.readFileSync(path.join(out, f), 'utf8').includes(os.homedir()), `${f} leaks the home directory`);
});

test('only capture.mjs may touch the network', () => {
  const NET = /from\s+['"](node:)?(http|https|net|dgram|tls)['"]|playwright|providers\/|_http\.mjs|\bfetch\(/;
  for (const f of ['evaluate.mjs', 'live-lib.mjs', 'cli.mjs', '../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs'])
    assert.doesNotMatch(fs.readFileSync(path.join(DIR, f), 'utf8'), NET, `${f} must stay offline`);
  assert.match(fs.readFileSync(path.join(DIR, 'capture.mjs'), 'utf8'), /checkUrlLiveness/, 'capture.mjs uses the engine\'s own liveness checker');
});
