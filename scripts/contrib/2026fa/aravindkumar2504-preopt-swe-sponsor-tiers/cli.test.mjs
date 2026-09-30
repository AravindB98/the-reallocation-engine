// cli.test.mjs: end-to-end runs of the prototype on fixture data, calling the REAL scorer.
// Offline: the inputs are synthetic fixtures plus the committed fictional persona. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const CLI = path.join(HERE, 'preopt-sponsor-tiers.mjs');
const FX = (f) => path.join(HERE, 'fixtures', f);
const tmp = (label) => fs.mkdtempSync(path.join(os.tmpdir(), `sponsor-tiers-${label}-`));
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
  assert.equal(log.coverage.with_h1b_record, 15); // 17 rows; FOXTROT has no record and MIKE's record is unreadable

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

test('the same inputs give byte-identical outputs when run twice', () => {
  const out = tmp('determinism');
  const args = [...BASE, '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', out];
  const files = ['report.md', 'roles.json', 'run-log.json', 'scorer-profile.json'];
  assert.equal(cli(args).status, 0);
  const first = files.map((f) => fs.readFileSync(path.join(out, f), 'utf8'));
  assert.equal(cli(args).status, 0);
  const second = files.map((f) => fs.readFileSync(path.join(out, f), 'utf8'));
  assert.deepEqual(second, first);
  fs.rmSync(out, { recursive: true, force: true });
});

test('the timeline gate multiplies through the real scorer: a partly used buffer demotes, a closed gate zeroes', () => {
  const partly = tmp('partly');
  assert.equal(cli([...BASE.slice(0, -2), '--as-of', '2027-06-01', '--accept-stale-vintage', '--watchlist', FX('watchlist.fixture.txt'), '--out-dir', partly]).status, 0);
  const a = readJson(partly, 'run-log.json');
  assert.equal(a.timeline.factor, 0.75);
  assert.equal(rowsByName(a)['ALPHA PLATFORM INC'].scorer.recommendation, 'Consider'); // 0.315 x 0.75 = 0.236
  assert.equal(rowsByName(a)['BRAVO SYSTEMS LLC'].scorer.recommendation, 'Skip'); // 0.21 x 0.75 = 0.158

  const closed = tmp('closed'); // named failure case F4: authorization end already past
  assert.equal(cli([...BASE.slice(0, -2), '--as-of', '2028-07-01', '--accept-stale-vintage', '--out-dir', closed]).status, 0);
  const b = readJson(closed, 'run-log.json');
  assert.equal(b.timeline.reason, 'authorization-already-ended');
  assert.equal(b.gates.G3_timeline.status, 'CLOSED');
  assert.ok(b.rows.length > 0 && b.rows.filter((r) => r.scored).every((r) => r.scorer.recommendation === 'Skip' && r.scorer.composite === 0));
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

test('every value has a declared label and the run states it made no model judgments', () => {
  const out = tmp('labels');
  assert.equal(cli([...BASE, '--out-dir', out]).status, 0);
  const log = readJson(out, 'run-log.json');
  assert.match(log.labels.model_judgment_values, /none/);
  for (const key of ['approvals', 'tier', 'timeline_factor', 'liveness_factor', 'wage_ratio', 'composite']) assert.ok(log.labels[key], `label for ${key}`);
  fs.rmSync(out, { recursive: true, force: true });
});

test('usage errors: --help exits 0; an unknown flag, a bad number, and an unknown family exit 2', () => {
  assert.equal(cli(['--help']).status, 0);
  assert.equal(cli(['--nonsense']).status, 2);
  assert.equal(cli([...BASE, '--discover', 'abc']).status, 2);
  const r = cli([...BASE, '--family', 'no-such-family', '--out-dir', path.join(tmp('fam'), 'out')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown role family/);
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

test('the committed fictional personas are allowed to write into the tracked run folder layout', () => {
  const out = tmp('fictional');
  const ok = cli([...BASE, '--out-dir', out]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(readJson(out, 'run-log.json').gates.G1_persona.treated_as, /fictional example persona/);
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
