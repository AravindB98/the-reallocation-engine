// cli.test.mjs: end-to-end runs of the prototype on fixture data, calling the REAL scorer.
// Offline: the inputs are synthetic fixtures plus the committed fictional persona. No network.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './evidence.mjs';
import { parseWatchlist } from './preopt-sponsor-tiers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const CLI = path.join(HERE, 'preopt-sponsor-tiers.mjs');
const FX = (f) => path.join(HERE, 'fixtures', f);
const made = [];
const tmp = (label) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), `sponsor-tiers-${label}-`)); made.push(d); return d; };
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });
const readJson = (dir, f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

// The fixture CSV's newest funding date is 2025-06-30, so a run dated 2025-09-30 is 3 months later: gate G0 passes.
const BASE = ['--csv', FX('companies.fixture.csv'), '--bls', FX('bls.fixture.csv'), '--formd-dir', FX('formd'), '--as-of', '2025-09-30'];
const cli = (args) => spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8' });
const rowsByName = (log) => Object.fromEntries(log.rows.map((r) => [r.company, r]));

test('named failure case F5: old data is refused without the acknowledgement flag, and nothing is written', () => {
  const out = path.join(tmp('stale'), 'out');
  const r = cli([...BASE.slice(0, -2), '--as-of', '2026-09-30', '--out-dir', out]);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /refusing to run/);
  assert.match(r.stderr, /--accept-stale-vintage/);
  assert.equal(fs.existsSync(out), false);
});

test('a full fixture run puts every company in the right bucket and lets the real scorer decide the scored ones', () => {
  const out = tmp('full');
  const r = cli([...BASE, '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = readJson(out, 'run-log.json');
  const by = rowsByName(log);
  const verdict = (n) => by[n].scorer?.recommendation;

  // scored: Proven -> Apply, Likely -> Consider, Thin -> Skip, with the timeline gate open (Kiran has not started the clock)
  for (const n of ['ALPHA PLATFORM INC', 'LIMA NOFUND INC', 'JULIET OLD INC', 'KILO QUOTES INC', 'OSCAR SENIOR INC', 'PAPA MIXED INC']) assert.equal(verdict(n), 'Apply', n);
  assert.equal(verdict('BRAVO SYSTEMS LLC'), 'Consider');
  for (const n of ['CHARLIE DATA INC', 'DELTA HEALTH INC', 'GOLF ROBOTICS INC']) assert.equal(verdict(n), 'Skip', n);
  assert.equal(by['ALPHA PLATFORM INC'].scorer.composite, 0.315);

  // held, never skipped
  assert.equal(by['FOXTROT LABS INC'].bucket, 'hold_unknown');
  assert.equal(by['ECHO FOODS INC'].bucket, 'hold_role_unverified');
  assert.match(by['ECHO FOODS INC'].note, /Sales Engineer/);
  assert.equal(by['MIKE BAD RECORD INC'].bucket, 'hold_data_problem');
  assert.equal(by['NOVEMBER BADTITLES INC'].bucket, 'hold_data_problem');

  // named failure case F1 and the ambiguity rule
  assert.equal(by['Zulu Missing Corp'].bucket, 'not_found');
  assert.equal(by['Hotel Cloud'].bucket, 'ambiguous');
  assert.match(by['Hotel Cloud'].note, /HOTEL CLOUD INC; HOTEL CLOUD LLC/);
  assert.deepEqual(log.inputs.watchlist.duplicates_ignored, ['alpha platform inc']);

  // funnel numbers
  assert.equal(log.summary.watchlist_names, 10);
  assert.equal(log.summary.pool_size, 6);
  assert.equal(log.summary.evaluated, 16);
  assert.deepEqual([log.summary.advance, log.summary.skip, log.summary.held, log.summary.unresolved], [7, 3, 4, 2]);
  assert.equal(log.coverage.pool_excluded_ambiguous_name, 2);
  assert.equal(log.coverage.recent_already_on_candidate_list, 2); // Alpha and Charlie are on the watchlist
  assert.equal(log.coverage.pool_excluded_no_usable_name, 0);
  // Alpha, Bravo, Charlie, Delta, Golf, both Hotel Cloud rows, Kilo, Oscar, Papa (Lima has no funding date, Juliet is too old)
  assert.equal(log.coverage.records_matching_and_recently_funded, 10);
  const c = log.coverage; // every such record is accounted for exactly once
  assert.equal(c.records_matching_and_recently_funded, c.pool_size + c.recent_already_on_candidate_list + c.pool_excluded_ambiguous_name + c.pool_excluded_no_usable_name);
  assert.equal(log.coverage.with_h1b_record, 15); // 17 rows; FOXTROT has no record and MIKE's record is unreadable

  // a company with several Form D sample records keeps every class, not only the last
  assert.equal(by['KILO QUOTES INC'].form_d_check, 'agrees + form-d-filed-after-table-end');
  assert.equal(by['ALPHA PLATFORM INC'].form_d_check, 'agrees');
  assert.equal(by['ECHO FOODS INC'].form_d_check, 'form-d-filed-after-table-end');
  assert.equal(by['GOLF ROBOTICS INC'].form_d_check, 'form-d-missed-by-table');
  // the report shows up to three matched titles and says how many more there are
  const fullReport = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
  assert.match(fullReport, /Software Engineer; Backend Engineer; Platform Engineer; \+2 more \(in the run log\)/);

  // named failure case F2: an unknown company is never sent to the scorer, so it can never appear as Skip
  const sent = readJson(out, 'roles.json').map((x) => x.company);
  assert.ok(!sent.includes('FOXTROT LABS INC'));
  assert.ok(!sent.includes('ECHO FOODS INC'));
  const scored = readJson(out, 'role-scores.json');
  assert.equal(scored.roles.length, 10);
  assert.equal(scored.profile_needs_sponsorship, true);
  for (const s of scored.roles) {
    assert.equal(s.trace.gates.find((g) => g.factor === 'liveness').source, 'your-input'); // the placeholder is never labelled a record
    assert.equal(s.trace.votes.length, 1); // sponsorship only: this run supplies no fit term
  }
  assert.equal(fs.existsSync(path.join(out, '.staging')), false);
  fs.rmSync(out, { recursive: true, force: true });
});

test('the four files this program writes are byte-identical when the same inputs are run twice (the scorer\'s own two files carry its date stamp)', () => {
  const out = tmp('determinism');
  const args = [...BASE, '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', out];
  const files = ['report.md', 'roles.json', 'run-log.json', 'scorer-profile.json'];
  assert.equal(cli(args).status, 0);
  const first = files.map((f) => fs.readFileSync(path.join(out, f), 'utf8'));
  assert.equal(cli(args).status, 0);
  const second = files.map((f) => fs.readFileSync(path.join(out, f), 'utf8'));
  assert.deepEqual(second, first);
  // The scorer stamps the day it ran into role-scores.json and role-scores.md, so those two are compared with that date masked.
  const mask = (t) => t.replace(/"generated": "\d{4}-\d{2}-\d{2}"/, '"generated": "<date>"').replace(/^# Role Scorer report \S+ \d{4}-\d{2}-\d{2}/m, '# Role Scorer report <date>');
  const scorerFiles = ['role-scores.json', 'role-scores.md'];
  const sFirst = scorerFiles.map((f) => mask(fs.readFileSync(path.join(out, f), 'utf8')));
  assert.equal(cli(args).status, 0);
  assert.deepEqual(scorerFiles.map((f) => mask(fs.readFileSync(path.join(out, f), 'utf8'))), sFirst);
  fs.rmSync(out, { recursive: true, force: true });
});

test('the timeline gate multiplies through the real scorer: a partly used buffer demotes, a closed gate zeroes', () => {
  const partly = tmp('partly');
  assert.equal(cli([...BASE.slice(0, -2), '--as-of', '2027-06-01', '--accept-stale-vintage', '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', partly]).status, 0);
  const a = readJson(partly, 'run-log.json');
  assert.equal(a.timeline.factor, 0.75);
  assert.equal(rowsByName(a)['ALPHA PLATFORM INC'].scorer.recommendation, 'Consider'); // 0.315 x 0.75 = 0.236
  assert.equal(rowsByName(a)['BRAVO SYSTEMS LLC'].scorer.recommendation, 'Skip'); // 0.21 x 0.75 = 0.158
  // The report must say WHY: the timeline demoted a Likely company; it must not blame thin evidence.
  const report = fs.readFileSync(path.join(partly, 'report.md'), 'utf8');
  const bravoLine = report.split('\n').find((l) => l.includes('BRAVO SYSTEMS LLC') && l.includes('Skip'));
  assert.ok(bravoLine, 'Bravo should appear in the set-aside table');
  assert.match(bravoLine, /timeline factor 0\.75 multiplies this Likely company's composite down to 0\.158/);
  assert.doesNotMatch(bravoLine, /below the Likely bar/);

  const closed = tmp('closed'); // named failure case F4: authorization end already past
  assert.equal(cli([...BASE.slice(0, -2), '--as-of', '2028-07-01', '--accept-stale-vintage', '--out-dir', closed]).status, 0);
  const b = readJson(closed, 'run-log.json');
  assert.equal(b.timeline.reason, 'authorization-already-ended');
  assert.equal(b.gates.G3_timeline.status, 'CLOSED');
  assert.ok(b.rows.length > 0 && b.rows.filter((r) => r.scored).every((r) => r.scorer.recommendation === 'Skip' && r.scorer.composite === 0));
  const closedReport = fs.readFileSync(path.join(closed, 'report.md'), 'utf8');
  assert.match(closedReport, /the timeline gate is closed \(authorization already ended\)/);
  assert.doesNotMatch(closedReport, /multiplies this/); // a closed gate is not described as a small multiplier
  fs.rmSync(partly, { recursive: true, force: true });
  fs.rmSync(closed, { recursive: true, force: true });
});

test('an older persona with no explicit needs_sponsorship is refused with exit 2', () => {
  const r = cli([...BASE, '--persona', path.join(REPO, 'search', 'examples', 'aarav-patel', 'profile.yml'), '--out-dir', path.join(tmp('aarav'), 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /needs_sponsorship/);
});

test('an older persona runs when the missing values are supplied on the command line (recorded as command-line)', () => {
  const out = tmp('priya');
  // Run dated 2026-09-30: this persona's authorization began 2026-02-01, so its clock is running (34 of 90 days used).
  const r = cli([...BASE.slice(0, -2), '--as-of', '2026-09-30', '--accept-stale-vintage', '--persona', path.join(REPO, 'search', 'examples', 'priya-nair', 'profile.yml'), '--soc', '15-1252', '--family', 'backend-platform-swe', '--days-to-start', '75', '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = readJson(out, 'run-log.json');
  assert.equal(log.persona_used.sources.expected_days_to_start, 'command-line');
  assert.equal(log.timeline.factor, 0); // 34 + 75 > 90: the older persona's own note ("the gate binds hard on slow processes")
  fs.rmSync(out, { recursive: true, force: true });
});

test('named failure case F3: a SOC code with no BLS row still runs and says so; nothing is invented', () => {
  const out = tmp('soc');
  const r = cli([...BASE, '--soc', '99-9999', '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = readJson(out, 'run-log.json');
  assert.equal(log.bls_reference.status, 'missing');
  assert.equal(log.bls_reference.reason, 'no-soc-row');
  assert.match(log.gates.G1_persona.soc_note, /wage reference/);
  for (const row of log.rows.filter((x) => x.wage)) assert.equal(row.wage.status, 'missing');
  fs.rmSync(out, { recursive: true, force: true });
});

test('named failure case F7 through the command line: a renamed column exits 2 and names it', () => {
  const dir = tmp('drift');
  const bad = path.join(dir, 'drifted.csv');
  fs.writeFileSync(bad, fs.readFileSync(FX('companies.fixture.csv'), 'utf8').replace('latest_funding_date', 'latest_funding_dt'));
  const r = cli([...BASE.slice(2), '--csv', bad, '--out-dir', path.join(dir, 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /latest_funding_date/);
  assert.equal(fs.existsSync(path.join(dir, 'out')), false);
});

test('a run with nothing to score still completes: empty scorer input, the scorer is skipped, both outputs exist', () => {
  const dir = tmp('empty');
  const list = path.join(dir, 'names.txt');
  fs.writeFileSync(list, 'Foxtrot Labs Inc\nZulu Missing Corp\n');
  const out = path.join(dir, 'out');
  const r = cli([...BASE, '--watchlist', list, '--discover', '0', '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = readJson(out, 'run-log.json');
  assert.equal(log.scorer.command !== null, true); // the pool still has companies, so the scorer runs
  const onlyHolds = tmp('onlyholds');
  const csv = path.join(onlyHolds, 'c.csv');
  const lines = fs.readFileSync(FX('companies.fixture.csv'), 'utf8').split('\n');
  fs.writeFileSync(csv, [lines[0], ...lines.filter((l) => l.startsWith('FOXTROT'))].join('\n') + '\n');
  const out2 = path.join(onlyHolds, 'out');
  const r2 = cli(['--csv', csv, '--bls', FX('bls.fixture.csv'), '--formd-dir', FX('formd'), '--as-of', '2025-09-30', '--accept-stale-vintage', '--watchlist', list, '--out-dir', out2]);
  assert.equal(r2.status, 0, r2.stderr);
  assert.deepEqual(readJson(out2, 'roles.json'), []);
  const log2 = readJson(out2, 'run-log.json');
  assert.equal(log2.scorer.command, null);
  assert.match(log2.gates.G2_scorer_integrity.status, /not-applicable/);
  assert.ok(fs.existsSync(path.join(out2, 'report.md')));
});

test('the report shows only the requested number of discovered companies, but the log keeps all of them', () => {
  const out = tmp('limit');
  assert.equal(cli([...BASE, '--discover', '2', '--out-dir', out]).status, 0);
  const report = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
  // same composite for every Proven company, so the most recent raise ranks first: ALPHA (0.0 months), then PAPA (0.6)
  assert.match(report, /ALPHA PLATFORM INC/);
  assert.match(report, /PAPA MIXED INC/);
  assert.doesNotMatch(report, /OSCAR SENIOR INC/);
  assert.doesNotMatch(report, /KILO QUOTES INC/);
  assert.equal(readJson(out, 'run-log.json').rows.filter((r) => r.origin === 'pool').length, 8);
  fs.rmSync(out, { recursive: true, force: true });
});

test('the report opens with the executive summary and the outputs carry no email or phone-looking text', () => {
  const out = tmp('privacy');
  assert.equal(cli([...BASE, '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', out]).status, 0);
  const report = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
  assert.match(report, /^# .+\n\n## Executive summary\n/);
  const summary = report.split('## Read this first')[0];
  assert.doesNotMatch(summary, /\.mjs|\.json|\.csv|scripts\/|H-1B|SNICKERDOODLE/); // plain language: no file paths or scheme names up top
  for (const f of ['report.md', 'run-log.json', 'roles.json', 'scorer-profile.json']) {
    const text = fs.readFileSync(path.join(out, f), 'utf8');
    assert.doesNotMatch(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, `${f} has an email-like string`);
    assert.doesNotMatch(text, /\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}/, `${f} has a phone-like string`);
  }
  fs.rmSync(out, { recursive: true, force: true });
});

test('every field of every row has a declared label, every label starts with one of the four kinds, and so does every run-level value', () => {
  const out = tmp('labels');
  assert.equal(cli([...BASE, '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', out]).status, 0);
  const log = readJson(out, 'run-log.json');
  assert.match(log.labels.model_judgment_values, /none/);
  // flatten each row into dotted paths (objects are descended into; arrays and scalars are leaves)
  const paths = new Set();
  const walk = (o, prefix) => { for (const [k, v] of Object.entries(o)) { const p = prefix ? `${prefix}.${k}` : k; if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p); else paths.add(p); } };
  for (const row of log.rows) walk(row, '');
  assert.ok(paths.size > 25, 'the fixture run should exercise many row fields');
  const unlabelled = [...paths].filter((p) => !(p in log.labels));
  assert.deepEqual(unlabelled, [], `row fields with no declared label: ${unlabelled.join(', ')}`);
  for (const k of ['sent_to_scorer.sponsorship', 'sent_to_scorer.liveness', 'sent_to_scorer.timeline', 'sent_to_scorer.fit']) assert.ok(log.labels[k], k);
  // the vocabulary: the repository's three labels, plus run-metadata for values that only describe the run
  const KIND = /^(record|your-input|model-judgment|run-metadata)\b/;
  const notKinds = Object.entries(log.labels).filter(([k, v]) => k !== '_kinds' && !KIND.test(v)).map(([k]) => k);
  assert.deepEqual(notKinds, [], `labels that do not start with a kind: ${notKinds.join(', ')}`);
  // every other top-level value in the log is labelled too
  const topLevel = Object.keys(log).filter((k) => !['labels', 'labels_run_level', 'rows'].includes(k));
  const missing = topLevel.filter((k) => !(k in log.labels_run_level));
  assert.deepEqual(missing, [], `run-level values with no label: ${missing.join(', ')}`);
  const notKindsRun = Object.entries(log.labels_run_level).filter(([, v]) => !KIND.test(v)).map(([k]) => k);
  assert.deepEqual(notKindsRun, [], `run-level labels that do not start with a kind: ${notKindsRun.join(', ')}`);
  // the tier's fixed value is a parameter, and the scorer is told so
  const sent = readJson(out, 'roles.json')[0].sponsorship;
  assert.equal(sent.source, 'your-input');
  assert.match(sent.note, /p is that tier's fixed value from params\.json/);
  // the report says where each column comes from
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /## Where each column comes from/);
});

test('usage errors: --help exits 0; an unknown flag, a bad number, and an unknown family exit 2', () => {
  assert.equal(cli(['--help']).status, 0);
  assert.equal(cli(['--nonsense']).status, 2);
  assert.equal(cli([...BASE, '--discover', 'abc']).status, 2);
  const r = cli([...BASE, '--family', 'no-such-family', '--out-dir', path.join(tmp('fam'), 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown role family/);
  // names that exist on every JavaScript object are not role families either
  for (const inherited of ['constructor', '__proto__', 'toString']) {
    const x = cli([...BASE, '--family', inherited, '--out-dir', path.join(tmp('fam2'), 'out')]);
    assert.equal(x.status, 2, inherited);
    assert.match(x.stderr, /unknown role family/);
  }
});

// ── break tests: swap in a deliberately wrong stand-in for the scorer (fixtures/BROKEN-*) ────────────────
const cliWithScorer = (args, scorer) => spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, SPONSOR_TIERS_SCORER: scorer } });

test('named failure case F6 end to end: a scorer that mis-reads the persona aborts the run (exit 4) and leaves no outputs', () => {
  const out = path.join(tmp('broken'), 'out');
  const r = cliWithScorer([...BASE, '--out-dir', out], FX('BROKEN-role-scorer-misparses-profile.mjs'));
  assert.equal(r.status, 4);
  assert.match(r.stderr, /scorer integrity check failed/);
  assert.match(r.stderr, /profile_needs_sponsorship=false but the persona says true/);
  assert.match(r.stderr, /liveness gate labelled "record"/);
  assert.equal(fs.existsSync(out), false); // nothing written, not even an empty folder
});

test('a scorer that crashes aborts the run with exit 5 and leaves no outputs', () => {
  const out = path.join(tmp('crash'), 'out');
  const r = cliWithScorer([...BASE, '--out-dir', out], FX('BROKEN-role-scorer-crashes.mjs'));
  assert.equal(r.status, 5);
  assert.match(r.stderr, /the scorer exited with code 3/);
  assert.equal(fs.existsSync(out), false);
});

// ── privacy guard: a persona outside search/examples/ is treated as real data ──────────────────────────
test('a persona outside search/examples/ may not write into a tracked folder (exit 2), but may write outside the repo', () => {
  const dir = tmp('realpersona');
  const real = path.join(dir, 'my-own-persona.yml'); // stands in for a real persona kept in the gitignored search/ layer
  fs.copyFileSync(path.join(REPO, 'search', 'examples', 'kiran-rao', 'profile.yml'), real);
  const trackedOut = path.join(REPO, 'course', 'must-not-be-created');
  try {
    const tracked = cli([...BASE, '--persona', real, '--out-dir', trackedOut]);
    assert.equal(tracked.status, 2);
    assert.match(tracked.stderr, /treated as real data/);
    assert.match(tracked.stderr, /private\//);
    assert.equal(fs.existsSync(trackedOut), false);
  } finally {
    fs.rmSync(trackedOut, { recursive: true, force: true }); // a broken guard must not leave files in the repository
  }

  const outside = path.join(dir, 'out');
  const ok = cli([...BASE, '--persona', real, '--out-dir', outside]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(readJson(outside, 'run-log.json').gates.G1_persona.treated_as, /real data/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a committed fictional persona and the sample inputs are recorded as such in gate G1', () => {
  const out = tmp('fictional');
  const ok = cli([...BASE, '--out-dir', out]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(readJson(out, 'run-log.json').gates.G1_persona.treated_as, /committed fictional persona and sample inputs/);
  fs.rmSync(out, { recursive: true, force: true });
});

test('a run on the repository\'s own data records only repository-relative paths, never this machine\'s', () => {
  const out = tmp('paths');
  // Real inputs (all inside the repository); only the output folder is a temporary one outside it.
  const r = cli(['--as-of', '2026-09-30', '--accept-stale-vintage', '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['run-log.json', 'report.md', 'roles.json', 'scorer-profile.json']) {
    const text = fs.readFileSync(path.join(out, f), 'utf8');
    assert.ok(!text.includes(REPO), `${f} contains this machine's repository path`);
    assert.ok(!text.includes(os.homedir()), `${f} contains this machine's home folder`);
  }
  const log = readJson(out, 'run-log.json');
  assert.equal(log.bls_reference.source.file, 'data/bls/compact/soc_occupation_compact.csv');
  assert.equal(log.inputs.csv.path, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv');
  fs.rmSync(out, { recursive: true, force: true });
});

// ── the guard in full: what may be written where ─────────────────────────────────────────────────────────
const OWN_RUNS = path.join(REPO, 'course', '2026fa', 'submissions', 'aravindkumar2504', 'runs');

test('sample inputs may write inside this recipe\'s own runs folder, and nowhere else inside the repository', () => {
  const inside = path.join(OWN_RUNS, `_guard-test-${process.pid}`);
  const elsewhere = path.join(REPO, 'course', `_guard-test-elsewhere-${process.pid}`);
  try {
    const ok = cli([...BASE, '--out-dir', inside]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.ok(fs.existsSync(path.join(inside, 'report.md')));
    const refused = cli([...BASE, '--out-dir', elsewhere]);
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /outside this recipe's own runs folder/);
    assert.equal(fs.existsSync(elsewhere), false);
  } finally {
    fs.rmSync(inside, { recursive: true, force: true });
    fs.rmSync(elsewhere, { recursive: true, force: true });
  }
});

test('a watchlist that is not one of the committed samples is treated as real data', () => {
  const dir = tmp('realwatch');
  const mine = path.join(dir, 'my-watchlist.txt'); // stands in for a real company list kept in private/
  fs.writeFileSync(mine, 'Alpha Platform, Inc.\nBravo Systems LLC\n');
  const inRuns = path.join(OWN_RUNS, `_guard-test-watch-${process.pid}`);
  try {
    const refused = cli([...BASE, '--watchlist', mine, '--out-dir', inRuns]);
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /watchlist is not one of the committed samples/);
    assert.equal(fs.existsSync(inRuns), false);
  } finally { fs.rmSync(inRuns, { recursive: true, force: true }); }
  const outside = path.join(dir, 'out');
  const ok = cli([...BASE, '--watchlist', mine, '--out-dir', outside]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(readJson(outside, 'run-log.json').gates.G1_persona.treated_as, /real data/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('an explicitly given Form D folder that is missing or empty is an error, not a silent zero', () => {
  const dir = tmp('formdmissing');
  const r = cli([...BASE, '--formd-dir', path.join(dir, 'nope'), '--out-dir', path.join(dir, 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--formd-dir .* is missing or holds no \.json sample files/);
  assert.equal(fs.existsSync(path.join(dir, 'out')), false);
  fs.mkdirSync(path.join(dir, 'empty'));
  assert.equal(cli([...BASE, '--formd-dir', path.join(dir, 'empty'), '--out-dir', path.join(dir, 'out2')]).status, 2);
});

test('malformed persona YAML exits 2 with a message, not a stack trace', () => {
  const dir = tmp('badyaml');
  const bad = path.join(dir, 'bad.yml');
  fs.writeFileSync(bad, 'needs_sponsorship: [unclosed\nvisa: : :\n');
  const r = cli([...BASE, '--persona', bad, '--out-dir', path.join(dir, 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /not valid YAML/);
  assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/); // no stack trace
});

// ── the guard, end to end (its logic is tested alone in guard.test.mjs) ─────────────────────────────────
test('a real persona cannot write into a folder inside the repository whose name starts with two dots, or through a symlink into a tracked folder', () => {
  const dir = tmp('guardbypass');
  const real = path.join(dir, 'my-own-persona.yml');
  fs.copyFileSync(path.join(REPO, 'search', 'examples', 'kiran-rao', 'profile.yml'), real);
  const dotted = path.join(REPO, `..leak-test-${process.pid}`);
  const viaLink = path.join(dir, 'link');
  fs.symlinkSync(path.join(REPO, 'course'), viaLink);
  const throughLink = path.join(viaLink, `_leak-test-${process.pid}`);
  try {
    for (const out of [dotted, throughLink]) {
      const r = cli([...BASE, '--persona', real, '--out-dir', out]);
      assert.equal(r.status, 2, `${out}: ${r.stderr}`);
      assert.match(r.stderr, /treated as real data/);
    }
    assert.equal(fs.existsSync(dotted), false);
    assert.equal(fs.existsSync(path.join(REPO, 'course', `_leak-test-${process.pid}`)), false);
  } finally {
    fs.rmSync(dotted, { recursive: true, force: true });
    fs.rmSync(path.join(REPO, 'course', `_leak-test-${process.pid}`), { recursive: true, force: true });
  }
});

test('a company table that is not the repository\'s own is treated as real data, like a persona or watchlist', () => {
  const dir = tmp('realcsv');
  const mine = path.join(dir, 'my-targets.csv'); // stands in for a private list of target companies
  fs.copyFileSync(FX('companies.fixture.csv'), mine);
  const args = ['--csv', mine, '--bls', FX('bls.fixture.csv'), '--formd-dir', FX('formd'), '--as-of', '2025-09-30'];
  const inRuns = path.join(OWN_RUNS, `_guard-test-csv-${process.pid}`);
  try {
    const refused = cli([...args, '--out-dir', inRuns]);
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /company table is neither the repository's table nor a committed fixture/);
    assert.equal(fs.existsSync(inRuns), false);
  } finally { fs.rmSync(inRuns, { recursive: true, force: true }); }
  const outside = path.join(dir, 'out');
  assert.equal(cli([...args, '--out-dir', outside]).status, 0);
  assert.match(readJson(outside, 'run-log.json').gates.G1_persona.treated_as, /real data/);
});

test('outputs never carry this machine\'s folders, even when the inputs and the output folder are outside the repository', () => {
  const dir = tmp('displaypaths');
  const list = path.join(dir, 'names.txt');
  fs.writeFileSync(list, 'Alpha Platform Inc\n');
  const real = path.join(dir, 'persona.yml');
  fs.copyFileSync(path.join(REPO, 'search', 'examples', 'kiran-rao', 'profile.yml'), real);
  const out = path.join(dir, 'out');
  assert.equal(cli([...BASE, '--persona', real, '--watchlist', list, '--out-dir', out]).status, 0);
  for (const f of ['run-log.json', 'report.md', 'roles.json', 'scorer-profile.json']) {
    const text = fs.readFileSync(path.join(out, f), 'utf8');
    assert.ok(!text.includes(dir), `${f} contains a temporary folder of this machine`);
    assert.ok(!text.includes(os.tmpdir()), `${f} contains this machine's temporary folder`);
    assert.ok(!text.includes(os.homedir()), `${f} contains this machine's home folder`);
  }
  const log = readJson(out, 'run-log.json');
  assert.equal(log.inputs.persona.path, '<outside the repository>/persona.yml');
  assert.equal(log.inputs.watchlist.path, '<outside the repository>/names.txt');
  assert.match(log.command, /--persona <outside the repository>\/persona\.yml --.*--watchlist <outside the repository>\/names\.txt --out-dir <outside the repository>\/out$/);
});

// ── input and output problems are input errors with a message, never a stack trace ───────────────────────
test('a persona that does not need sponsorship is refused: the recipe is built for a candidate who does', () => {
  const dir = tmp('nosponsor');
  const persona = path.join(dir, 'persona.yml');
  fs.writeFileSync(persona, fs.readFileSync(path.join(REPO, 'search', 'examples', 'kiran-rao', 'profile.yml'), 'utf8').replace(/^needs_sponsorship: true/m, 'needs_sponsorship: false'));
  const out = path.join(dir, 'out');
  const r = cli([...BASE, '--persona', persona, '--out-dir', out]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /needs_sponsorship: false/);
  assert.match(r.stderr, /drops the sponsorship term/);
  assert.equal(fs.existsSync(out), false);
});

test('an output folder that is a file, or cannot be written, is an input error', (t) => {
  const dir = tmp('badout');
  const file = path.join(dir, 'a-file');
  fs.writeFileSync(file, 'x');
  const r = cli([...BASE, '--out-dir', file]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /is an existing file, not a folder/);
  assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/);
  if (process.getuid?.() === 0) { t.diagnostic('running as root: the read-only half of this test was skipped'); return; }
  const locked = path.join(dir, 'locked');
  fs.mkdirSync(locked);
  fs.chmodSync(locked, 0o555);
  try {
    const w = cli([...BASE, '--out-dir', path.join(locked, 'out')]);
    assert.equal(w.status, 2, w.stderr);
    assert.match(w.stderr, /cannot write to the output folder/);
    assert.doesNotMatch(w.stderr, /at .*\.mjs:\d+/);
  } finally { fs.chmodSync(locked, 0o755); }
});

test('a Form D folder that is really a file is an input error naming the flag', () => {
  const r = cli([...BASE.filter((x, i) => !(x === '--formd-dir' || BASE[i - 1] === '--formd-dir')), '--formd-dir', FX('companies.fixture.csv'), '--out-dir', path.join(tmp('formdfile'), 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--formd-dir .* is missing or holds no \.json sample files/);
});

test('a watchlist with no names is refused, and a name that is empty after normalizing is explained, not just "not found"', () => {
  const dir = tmp('watchnames');
  const empty = path.join(dir, 'empty.txt');
  fs.writeFileSync(empty, '# only a comment\n\n');
  const e = cli([...BASE, '--watchlist', empty, '--out-dir', path.join(dir, 'out1')]);
  assert.equal(e.status, 2);
  assert.match(e.stderr, /has no company names/);
  const odd = path.join(dir, 'odd.txt');
  fs.writeFileSync(odd, 'N/A\nAlpha Platform Inc\n');
  const out = path.join(dir, 'out2');
  assert.equal(cli([...BASE, '--watchlist', odd, '--out-dir', out]).status, 0);
  const row = readJson(out, 'run-log.json').rows.find((r) => r.company === 'N/A');
  assert.equal(row.bucket, 'not_found');
  assert.match(row.note, /empty once legal suffixes and punctuation are removed/);
});

// ── odd rows in the company table ────────────────────────────────────────────────────────────────────────
function tableWith(dir, extra) {
  const { header, rows } = parseCsv(fs.readFileSync(FX('companies.fixture.csv'), 'utf8'));
  const alpha = rows.find((r) => r.company_name === 'ALPHA PLATFORM INC');
  const quote = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const file = path.join(dir, 'odd.csv');
  fs.writeFileSync(file, `${[header.join(','), ...[...rows, ...extra.map((e) => ({ ...alpha, ...e }))].map((r) => header.map((h) => quote(r[h])).join(','))].join('\n')}\n`);
  return file;
}

test('a row listing 0 approvals and 0 denials is held as unknown, and rows with no usable name are never candidates', () => {
  const dir = tmp('oddrows');
  const csv = tableWith(dir, [
    { company_name: 'ZERO ZERO INC', 'Total Approvals': '0.0', 'Total Denials': '0.0', Approval_Rate: '' },
    { company_name: 'N/A' },
    { company_name: 'nan' },
  ]);
  const list = path.join(dir, 'names.txt');
  fs.writeFileSync(list, 'Zero Zero Inc\n');
  const out = path.join(dir, 'out');
  const r = cli(['--csv', csv, '--bls', FX('bls.fixture.csv'), '--formd-dir', FX('formd'), '--as-of', '2025-09-30', '--watchlist', list, '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr); // before the fix, two unnamed rows produced duplicate role ids and a misleading scorer error
  const log = readJson(out, 'run-log.json');
  const zero = log.rows.find((x) => x.company === 'ZERO ZERO INC');
  assert.equal(zero.bucket, 'hold_unknown'); // never Thin, never a scorer Skip
  assert.match(zero.note, /0 approvals and 0 denials/);
  assert.equal(log.coverage.pool_excluded_no_usable_name, 2);
  assert.ok(!readJson(out, 'roles.json').some((x) => /unnamed/.test(x.role_id)));
  const c = log.coverage;
  assert.equal(c.records_matching_and_recently_funded, c.pool_size + c.recent_already_on_candidate_list + c.pool_excluded_ambiguous_name + c.pool_excluded_no_usable_name);
});

// ── a run that scores nothing must not leave an earlier run's verdicts beside its own log ────────────────
test('a run that scored nothing removes the scorer files an earlier run left in the same folder', () => {
  const dir = tmp('stale-scorer');
  const out = path.join(dir, 'out');
  assert.equal(cli([...BASE, '--out-dir', out]).status, 0);
  assert.ok(fs.existsSync(path.join(out, 'role-scores.json')) && fs.existsSync(path.join(out, 'role-scores.md')));
  const foxtrotOnly = path.join(dir, 'c.csv');
  const lines = fs.readFileSync(FX('companies.fixture.csv'), 'utf8').split('\n');
  fs.writeFileSync(foxtrotOnly, [lines[0], ...lines.filter((l) => l.startsWith('FOXTROT'))].join('\n') + '\n');
  const list = path.join(dir, 'names.txt');
  fs.writeFileSync(list, 'Foxtrot Labs Inc\n');
  const r = cli(['--csv', foxtrotOnly, '--bls', FX('bls.fixture.csv'), '--formd-dir', FX('formd'), '--as-of', '2025-09-30', '--accept-stale-vintage', '--watchlist', list, '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readJson(out, 'run-log.json').scorer.command, null);
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false);
  assert.equal(fs.existsSync(path.join(out, 'role-scores.md')), false);
});

// ── a scorer that is not the repository's must say so ────────────────────────────────────────────────────
test('a run made with a stand-in scorer says so in the run log, gate G2 and the top of the report', () => {
  const out = path.join(tmp('standin'), 'out');
  const r = cliWithScorer([...BASE, '--out-dir', out], FX('STANDIN-role-scorer-passthrough.mjs'));
  assert.equal(r.status, 0, r.stderr); // it gives the real scorer's answers, so the integrity check passes...
  const log = readJson(out, 'run-log.json');
  assert.equal(log.scorer.is_repository_scorer, false); // ...but the run does not pretend it was the repository's own
  assert.match(log.gates.G2_scorer_integrity.status, /STAND-IN/);
  assert.match(log.scorer.command, /STANDIN-role-scorer-passthrough\.mjs/);
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /This run used a STAND-IN scorer/);
  const normal = path.join(tmp('notstandin'), 'out');
  assert.equal(cli([...BASE, '--out-dir', normal]).status, 0);
  assert.equal(readJson(normal, 'run-log.json').scorer.is_repository_scorer, true);
  assert.doesNotMatch(fs.readFileSync(path.join(normal, 'report.md'), 'utf8'), /STAND-IN/);
});

test('a timeline factor at or below the scorer\'s own closed-gate line closes gate G3 and keeps the scorer\'s reason', () => {
  const out = tmp('nearly-closed');
  // 89 days to start leaves 1 of the 90 days: factor 0.05, which the repository scorer treats as a closed gate (its gate_zero line)
  const r = cli([...BASE.slice(0, -2), '--as-of', '2027-06-01', '--accept-stale-vintage', '--days-to-start', '89', '--out-dir', out]);
  assert.equal(r.status, 0, r.stderr);
  const log = readJson(out, 'run-log.json');
  assert.equal(log.timeline.factor, 0.05);
  assert.equal(log.gates.G3_timeline.status, 'CLOSED');
  assert.equal(log.gates.G3_timeline.closed_below, 0.05);
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /at or below the scorer's closed-gate line of 0\.05/);
});

test('parseWatchlist skips comments and blank lines, handles CRLF and a byte-order mark, and reports a duplicate by its normalized name', () => {
  const text = '\uFEFF# comment\r\nAlpha Platform, Inc.\r\n\r\n   \r\nBravo Systems LLC\r\nalpha platform inc\r\n# another\r\nCharlie Data\r\n';
  const w = parseWatchlist(text);
  assert.deepEqual(w.names, ['Alpha Platform, Inc.', 'Bravo Systems LLC', 'Charlie Data']);
  assert.deepEqual(w.duplicates, ['alpha platform inc']);
  assert.deepEqual(parseWatchlist('# only\n\n').names, []);
});

test('without --out-dir the output goes to private/tiers-run/<run date>, which git ignores, so a bare run cannot change a tracked file', (t) => {
  const base = path.join(REPO, 'private', 'tiers-run');
  const dir = path.join(base, '2025-09-30');
  if (fs.existsSync(dir)) { t.skip('private/tiers-run/2025-09-30 already exists here (your own data?); not touching it'); return; }
  const baseExisted = fs.existsSync(base);
  try {
    const r = cli(BASE);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(dir, 'report.md')) && fs.existsSync(path.join(dir, 'run-log.json')));
    assert.match(r.stdout, /wrote private\/tiers-run\/2025-09-30\//);
    if (fs.existsSync(path.join(REPO, '.git'))) {
      const ignored = spawnSync('git', ['check-ignore', '-q', path.join(dir, 'report.md')], { cwd: REPO });
      assert.equal(ignored.status, 0, 'private/tiers-run/ must be ignored by git');
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    if (!baseExisted) fs.rmSync(base, { recursive: true, force: true });
  }
});
