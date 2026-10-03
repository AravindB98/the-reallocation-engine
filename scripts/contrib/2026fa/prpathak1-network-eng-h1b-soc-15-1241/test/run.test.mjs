// Offline tests for the network-eng-h1b prototype. No network calls.
//   node --test scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/
// Integration tests run the real run.mjs (which runs the real scorer CLI and the
// repo's Python normalizer) into course/2026fa/submissions/prpathak1/runs/_test-*,
// and delete those folders afterwards.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { classifyLiveness } from '../../../../ats/liveness-core.mjs';
import {
  REPO, PATHS, RULES, LBL, isNetworkTitle, mapSponsorship, mapLiveness, checkTimelineInputs,
  computeTimeline, parseDate, parsePyStrList, parseCsv, weakestLabel, piiProblems, candidateProblems,
} from '../run.mjs';

const FOLDER = path.dirname(PATHS.normalizer);
const RUN = path.join(REPO, FOLDER, 'run.mjs');
const FIX = (f) => `${FOLDER}/fixtures/${f}`;
const RUN_DATE = '2026-10-03';
const made = [];

function runCli(name, extra = []) {
  const id = `_test-${name}-${process.pid}`;
  made.push(id);
  const r = spawnSync(process.execPath, [RUN, '--run-id', id, '--run-date', RUN_DATE, ...extra], { cwd: REPO, encoding: 'utf8' });
  const dir = path.join(REPO, PATHS.runsRoot, id);
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null);
  const runJson = read('run.json');
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, dir, run: runJson && JSON.parse(runJson), report: read('report.md'), read };
}
let mainRun;
const main = () => (mainRun ??= runCli('main'));
const role = (run, id) => run.roles.find((r) => r.role_id === id);

after(() => { for (const id of made) fs.rmSync(path.join(REPO, PATHS.runsRoot, id), { recursive: true, force: true }); });

// ── rules (unit) ──────────────────────────────────────────────────────────

test('keyword rule: needs "network" AND a role word; bare "Engineer" never matches', () => {
  assert.equal(isNetworkTitle('Engineer'), false);
  assert.equal(isNetworkTitle('Senior Engineer'), false);
  assert.equal(isNetworkTitle('Network Engineer'), true);
  assert.equal(isNetworkTitle('SENIOR NETWORK SECURITY ENGINEER'), true);
  assert.equal(isNetworkTitle('System and Network Administrator'), true);
  assert.equal(isNetworkTitle('Network Analyst'), false);
  // Documented quirk of the substring rule: "Engineering" contains "engineer".
  assert.equal(isNetworkTitle('Engineering Manager, Networking'), true);
});

test('parsers: Python title lists and quoted CSV', () => {
  assert.deepEqual(parsePyStrList("['Engineer']"), ['Engineer']);
  assert.deepEqual(parsePyStrList(`['A, B', "O'Neil Net Admin"]`), ['A, B', "O'Neil Net Admin"]);
  assert.equal(parsePyStrList('Engineer'), null);
  assert.deepEqual(parseCsv('a,b\r\n"x, y","z ""q"""\r\n'), [['a', 'b'], ['x, y', 'z "q"']]);
});

test('labels: a computed value is record only if every input is a record', () => {
  assert.equal(weakestLabel([LBL.record, LBL.record]), LBL.record);
  assert.equal(weakestLabel([LBL.record, LBL.input]), LBL.input);
  assert.equal(weakestLabel([LBL.input, LBL.model]), LBL.model);
});

// ── F1: company missing from the CSV ──────────────────────────────────────

test('F1 unit: no CSV row, empty or non-numeric approvals → missing, never a number', () => {
  assert.equal(mapSponsorship([]).status, 'missing');
  const base = { company_name: 'X', 'Total Denials': '', Approval_Rate: '', top_job_titles_sponsored: '' };
  assert.equal(mapSponsorship([{ ...base, 'Total Approvals': '' }]).status, 'missing');
  assert.equal(mapSponsorship([{ ...base, 'Total Approvals': 'n/a' }]).status, 'missing');
  assert.match(mapSponsorship([{ ...base, 'Total Approvals': '2.0' }, { ...base, 'Total Approvals': '3.0' }]).reason, /ambiguous/);
});

test('F1 run: the fictional company is reported missing and never reaches the scorer', () => {
  const m = main();
  const r = role(m.run, 'fictional-missing');
  assert.equal(r.status, 'missing');
  assert.match(r.reason, /no row in 80-days CSV/);
  assert.equal(r.sponsorship, null);
  assert.ok(m.run.lists.missing.includes('fictional-missing'));
  const sent = JSON.parse(m.read('roles.json'));
  assert.ok(!sent.some((e) => e.role_id === 'fictional-missing'));
});

// ── F2: generic title collision — bare "Engineer" ─────────────────────────

test('F2 unit: approvals with only bare "Engineer" → Possible, no network match', () => {
  const sp = mapSponsorship([{ company_name: 'X', 'Total Approvals': '2.0', 'Total Denials': '0.0', Approval_Rate: '100.0', top_job_titles_sponsored: "['Engineer']" }]);
  assert.equal(sp.tier, RULES.sponsorship.approvals_no_network.tier);
  assert.deepEqual(sp.matched, []);
});

test('F2 run: COMPOUND LABS INC (real CSV row, titles ["Engineer"]) is Possible, not Likely', () => {
  const r = role(main().run, 'compound-network-eng');
  assert.deepEqual(r.sponsorship.titles_sponsored.value, ['Engineer']);
  assert.equal(r.sponsorship.titles_sponsored.label, LBL.record);
  assert.deepEqual(r.sponsorship.network_titles_matched.value, []);
  assert.equal(r.sponsorship.tier.value, 'Possible');
});

// ── F3: OPT window already closed ─────────────────────────────────────────

test('F3 unit: past dates → negative slack → factor 0 (closed)', () => {
  const p = JSON.parse(fs.readFileSync(path.join(REPO, FIX('persona-past-dates.json')), 'utf8'));
  const t = computeTimeline(p, parseDate(RUN_DATE));
  assert.ok(t.slack_days < 0);
  assert.equal(t.timeline_factor, RULES.timeline.factor_closed);
  assert.equal(t.closed, true);
});

test('F3 run: past-dates persona → nothing scored, G2 named, exit 1, scorer not called', () => {
  const r = runCli('f3', ['--persona', FIX('persona-past-dates.json')]);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.run.gates.g2.closed, true);
  assert.ok(r.run.gates.g2.slack_days.value < 0);
  assert.equal(r.run.counts.scored, 0);
  assert.ok(r.run.roles.every((x) => x.status === 'missing' || x.status === 'not_scored'));
  assert.ok(r.run.roles.some((x) => x.failed_gate === 'G2'));
  assert.ok(r.run.scorer_output.skipped);
  assert.equal(r.read('roles.json'), null);
});

test('G2a unit: OPT start outside program end … +60 days, or used days before OPT → input error', () => {
  const ok = { visa: { program_end_date: '2027-05-15', opt_start_date: '2027-06-01', unemployment_limit_days: 90, unemployment_days_used: 0 }, hiring_lag_days: 60 };
  const d = parseDate(RUN_DATE);
  assert.equal(checkTimelineInputs(ok, d).valid, true);
  assert.equal(checkTimelineInputs({ ...ok, visa: { ...ok.visa, opt_start_date: '2027-07-15' } }, d).valid, false);
  assert.equal(checkTimelineInputs({ ...ok, visa: { ...ok.visa, opt_start_date: '2027-05-01' } }, d).valid, false);
  assert.equal(checkTimelineInputs({ ...ok, visa: { ...ok.visa, unemployment_days_used: 5 } }, d).valid, false);
  assert.equal(checkTimelineInputs({ ...ok, hiring_lag_days: undefined }, d).valid, false);
});

// ── F4: profile that triggers role-scorer.mjs line 60 ─────────────────────

test('F4 run: "authorized" in a sponsorship-needing profile → G0 stops, exit 2, nothing scored', () => {
  const r = runCli('f4', ['--persona', FIX('persona-regex-trigger.json')]);
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stderr, /G0 failed/);
  assert.match(r.run.stop_condition, /G0 failed/);
  assert.equal(r.run.gates.g0.passed, false);
  assert.equal(r.run.gates.g0.persona_needs_sponsorship.value, true);
  assert.equal(r.run.gates.g0.scorer_profile_needs_sponsorship.value, false);
  assert.equal(r.run.roles.length, 0);
  assert.equal(r.read('roles.json'), null);
  assert.match(r.report, /stopped/);
});

test('G0 run: the main persona passes against the real scorer', () => {
  const g0 = main().run.gates.g0;
  assert.equal(g0.passed, true);
  assert.equal(g0.scorer_profile_needs_sponsorship.value, true);
  assert.match(g0.command, /^npm run score -- /);
});

// ── F5: posting returns 404 ───────────────────────────────────────────────

test('F5 unit: classifyLiveness(404) → expired → liveness factor 0; uncertain/absent → not scored', () => {
  const c = classifyLiveness({ status: 404 });
  assert.equal(c.result, 'expired');
  const m = mapLiveness(c.result);
  assert.equal(m.ok, true);
  assert.equal(m.factor, 0);
  assert.equal(mapLiveness('uncertain').ok, false);
  assert.equal(mapLiveness(null).ok, false);
});

test('F5 run: an expired posting is gated to Skip by the real scorer', () => {
  const r = role(main().run, 'sabse-network-eng');
  assert.equal(r.liveness.factor.value, 0);
  assert.equal(r.scorer.machine_recommendation.value, 'Skip');
  assert.match(r.scorer.reason, /gated: liveness/);
});

// ── G1: no liveness value → not scored; strong sponsor → networking list ──

test('G1 run: missing liveness → not scored, and a Likely sponsor goes on the networking list', () => {
  const m = main();
  const r = role(m.run, 'skytap-network-eng');
  assert.equal(r.status, 'not_scored');
  assert.equal(r.failed_gate, 'G1');
  assert.ok(m.run.lists.network_do_not_apply_yet.includes('skytap-network-eng'));
  assert.ok(!JSON.parse(m.read('roles.json')).some((e) => e.role_id === 'skytap-network-eng'));
});

// ── whole run: labels, scorer use, exit code, privacy ─────────────────────

test('main run: exit 1 (some roles missing/not scored) and both outputs written', () => {
  const m = main();
  assert.equal(m.status, 1, m.stderr);
  assert.ok(m.run && m.report);
  assert.ok(m.read('role-scores.json'), 'real scorer output present');
  assert.match(m.run.scorer_output.command, /^npm run score -- /);
  assert.equal(m.run.roles.length, JSON.parse(fs.readFileSync(path.join(REPO, FIX('candidates.json')), 'utf8')).roles.length);
});

test('labels: every labeled value uses one of the three labels; every scorer term carries an explicit source', () => {
  const m = main();
  const allowed = new Set(Object.values(LBL));
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === 'object') {
      if ('label' in x && 'value' in x) assert.ok(allowed.has(x.label), `bad label ${x.label}`);
      Object.values(x).forEach(walk);
    }
  };
  walk(m.run);
  for (const e of JSON.parse(m.read('roles.json'))) {
    for (const k of ['sponsorship', 'fit', 'liveness', 'timeline']) assert.ok(e[k].source, `${e.role_id}.${k} has no source`);
    assert.equal(e.fit.source, LBL.input);
  }
});

test('privacy: outputs carry no phone numbers, no non-example emails, and no values from the never-read columns', () => {
  const m = main();
  const files = ['run.json', 'report.md', 'roles.json', 'role-scores.json', 'role-scores.md'].map((f) => m.read(f) ?? '');
  for (const t of files) {
    assert.doesNotMatch(t, /\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/);
    for (const e of t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []) assert.match(e, /@example\.(com|org)$/);
  }
  assert.deepEqual(m.run.inputs.csv.columns_never_read, ['phone', 'executive_officers', 'board_directors']);
  assert.ok(piiProblems({ candidate: { email: 'someone@gmail.com' } }, '{}').length > 0);
});

// ── input validation (added after break attempts c and d) ─────────────────

test('break (c) unit: empty company, empty title, or duplicate role_id → input problems', () => {
  assert.deepEqual(candidateProblems({ roles: [{ role_id: 'a', company: 'X', title: 'T' }] }), []);
  assert.match(candidateProblems({ roles: [{ role_id: 'a', company: '', title: 'T' }] }).join(), /company is missing or empty/);
  assert.match(candidateProblems({ roles: [{ role_id: 'a', company: 'X', title: '  ' }] }).join(), /title is missing or empty/);
  assert.match(candidateProblems({ roles: [{ role_id: 'a', company: 'X', title: 'T' }, { role_id: 'a', company: 'Y', title: 'T' }] }).join(), /duplicated/);
  assert.equal(candidateProblems({ roles: [] }).length, 1);
});

test('break (c) run: a candidates file with an empty company stops (exit 2) before scoring', () => {
  const r = runCli('break-c', ['--candidates', FIX('BROKEN-candidates-empty-company.json')]);
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stderr, /roles\[0\]\.company is missing or empty/);
  assert.equal(r.read('roles.json'), null);
});

test('break (d): the PII guard names the problem but never repeats the address', () => {
  const msgs = piiProblems({ candidate: { email: 'someone@example.net' } }, '{"x":"someone@example.net"}');
  assert.ok(msgs.length >= 1);
  for (const m of msgs) assert.doesNotMatch(m, /example\.net/);
  const r = runCli('break-d', ['--persona', FIX('BROKEN-persona-non-example-email.json')]);
  assert.equal(r.status, 2);
  assert.doesNotMatch(`${r.stdout}${r.stderr}${r.read('run.json') ?? ''}${r.report ?? ''}`, /example\.net/);
});

test('break (a, b): malformed date and missing persona file stop with exit 2 and repo-relative paths', () => {
  const a = runCli('break-a', ['--persona', FIX('BROKEN-persona-malformed-date.json')]);
  assert.equal(a.status, 2);
  assert.match(a.stderr, /G2a timeline input error: visa\.opt_start_date/);
  const b = runCli('break-b', ['--persona', FIX('does-not-exist.json')]);
  assert.equal(b.status, 2);
  assert.match(b.stderr, /persona file not found: scripts\/contrib\//);
  assert.doesNotMatch(b.stderr, /[A-Z]:\\|\/Users\/|\/home\//);
});

test('data, not typed numbers: approvals in the run equal the CSV row', () => {
  const rows = parseCsv(fs.readFileSync(path.join(REPO, PATHS.csv), 'utf8'));
  const h = rows[0];
  const row = rows.find((r) => r[h.indexOf('company_name')] === 'VERSA NETWORKS INC');
  const r = role(main().run, 'versa-network-eng');
  assert.equal(r.sponsorship.total_approvals.value, row[h.indexOf('Total Approvals')]);
  assert.equal(r.sponsorship.total_approvals.label, LBL.record);
});
