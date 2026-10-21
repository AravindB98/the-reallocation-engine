// The whole v0.2.0 pipeline, offline: the REAL runIngest (fake boards, fake posting text, fake
// browser) writes a snapshot; the REAL run.mjs reads it and drives the REAL scorer
// (scripts/score/role-scorer.mjs). Nothing here touches the network or a browser.
//
//   node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/pipeline.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runIngest, LIVENESS_METHOD } from '../ingest.mjs';
import { parseCsv } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const RUN = path.join(HERE, '..', 'run.mjs');
const INGEST = path.join(HERE, '..', 'ingest.mjs');
const ROOT = path.resolve(HERE, '../../../../..');
const LABELS = new Set(['record', 'your-input', 'model-judgment']);
const TODAY = '2026-10-20';
const csvRows = parseCsv(fs.readFileSync(path.join(FX, 'mini-80days-v02.csv'), 'utf8'));
const persona = JSON.parse(fs.readFileSync(path.join(FX, 'persona.v02.fixture.json'), 'utf8'));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'healthins-pipe-'));

const PAD = ' The team builds claims software for a mid-sized insurer and ships weekly. Candidates join an onboarding program and pair with a mentor for the first quarter. We value clear writing and careful testing.';
const u = (board, id) => `https://job-boards.greenhouse.io/${board}/jobs/${id}`;
const A = (id) => u('alphaclaims', id);
const BETA = 'https://jobs.lever.co/betahealth/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const OFFERS = {
  'Alpha Claims': [
    { title: 'Software Engineer, AI Automation', url: A(1001), location: 'San Francisco, CA' },
    { title: 'Senior Software Engineer, Platform', url: A(1002), location: 'Boston, MA' },
    { title: 'Software Engineer, Platform', url: A(1003), location: 'Hyderabad, Telangana, India' },
    { title: 'Software Engineer II', url: A(1004), location: 'Boston, MA' },
    { title: 'Backend Engineer', url: A(1005), location: 'Remote (United States)' },
    { title: 'Machine Learning Engineer', url: A(1006), location: 'Boston, MA' },
    { title: 'Full Stack Engineer', url: A(1007), location: 'New York, NY' },
    { title: 'Software Engineer, Data', url: A(1008), location: 'Remote' },
    { title: 'Account Executive', url: A(1009), location: 'Boston, MA' },
    { title: 'Backend Engineer II', url: A(1010), location: 'Boston, MA' },
  ],
  'Beta Health': [{ title: 'ML Engineer', url: BETA, location: 'New York, NY' }],
  'Delta Labs Technology': [{ title: 'Software Engineer', url: 'https://jobs.ashbyhq.com/deltalabs/11111111-2222-3333-4444-555555555555', location: 'Remote (United States)' }],
  Epsilon: [{ title: 'Machine Learning Engineer', url: u('epsilon', 2001), location: 'New York, NY' }],
  'Zeta Health': [{ title: 'Software Engineer', url: u('zetahealth', 3001), location: 'Austin, TX' }],
};
const JD = {
  [A(1001)]: 'Build automation for claims intake. Python, TypeScript and LLM tooling. Candidates must be legally authorized to work in the United States.' + PAD,
  [A(1004)]: 'Applicants must be a U.S. citizen to be considered for this role.' + PAD,
  [A(1005)]: '5+ years of experience building distributed systems is required.' + PAD,
  [A(1006)]: 'Train and ship models for claims triage.' + PAD,
  [A(1007)]: 'Build the customer portal. Acme participates in E-Verify.' + PAD,
  // 1008 has no text on purpose: the board response does not carry it
  [A(1010)]: 'Build and run services for claims intake.' + PAD,
  [BETA]: 'Build ML for care navigation. We are unable to sponsor work visas at this time.' + PAD,
  [u('epsilon', 2001)]: 'Machine learning for pricing.' + PAD,
};
const LIVENESS = {
  [A(1006)]: { result: 'uncertain', code: 'navigation_error', reason: 'timeout' },
  [A(1007)]: { result: 'expired', reason: 'page says the role is closed' },
};

const portals = { tracked_companies: [
  { name: 'Alpha Claims', enabled: true, provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/alphaclaims', csv_company: 'Alpha Claims, Inc.', bucket: 'startup' },
  { name: 'Beta Health', enabled: true, provider: 'lever', careers_url: 'https://jobs.lever.co/beta', csv_company: 'Beta Health, Inc.', bucket: 'midsize' }, // slug differs from betahealth.test on purpose
  { name: 'Delta Labs Technology', enabled: true, provider: 'ashby', careers_url: 'https://jobs.ashbyhq.com/deltalabs', csv_company: 'Delta Labs Technology, Inc.', bucket: 'startup' },
  { name: 'Epsilon', enabled: true, provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/epsilon', csv_company: 'Epsilon, Inc.', bucket: 'midsize' },
  { name: 'Zeta Health', enabled: true, provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/zetahealth', csv_company: 'Zeta Health, Inc.', bucket: 'startup' },
  { name: 'Broken Board', enabled: true, provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/nonexistent', csv_company: 'Broken Board, Inc.', bucket: 'startup' },
  { name: 'Switched Off', enabled: false, provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/off', csv_company: 'Switched Off, Inc.', bucket: 'startup' },
] };

const providers = {
  greenhouse: { fetch: async (entry) => { if (entry.name === 'Broken Board') throw new Error('HTTP 404: board not found'); return (OFFERS[entry.name] || []).map((o) => ({ ...o, company: entry.name })); } },
  lever: { fetch: async (entry) => (OFFERS[entry.name] || []).map((o) => ({ ...o, company: entry.name })) },
  ashby: { fetch: async (entry) => (OFFERS[entry.name] || []).map((o) => ({ ...o, company: entry.name })) },
};
const describe = async (entry) => new Map((OFFERS[entry.name] || []).filter((o) => JD[o.url]).map((o) => [o.url, JD[o.url]]));

function ingest(extra = {}) {
  const calls = []; let inFlight = 0, maxInFlight = 0;
  const liveness = async (url) => {
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight); calls.push(url);
    await new Promise((r) => setTimeout(r, 3));
    inFlight--;
    return LIVENESS[url] || { result: 'active' };
  };
  const p = runIngest({ portals, persona, csvRows, csvRel: 'fixtures/mini-80days-v02.csv', providers, describe, liveness, fetchedOn: TODAY, ...extra });
  return p.then((r) => ({ ...r, calls, maxInFlight: () => maxInFlight }));
}

test('ingest: cheap gates first — the browser is opened only for roles that survived every offline gate', async () => {
  const r = await ingest();
  const f = r.snapshot.funnel;
  assert.equal(f.boards, 6, 'the disabled board is not scanned');
  assert.equal(f.boards_failed, 1);
  const broken = r.snapshot.boards.find((b) => b.name === 'Broken Board');
  assert.equal(broken.status, 'failed');
  assert.match(broken.error, /HTTP 404/);
  assert.equal(broken.offers_found, 0);
  assert.equal(f.boards_entity_blocked, 2, 'Delta (sibling holds approvals) and Zeta (name not in the CSV)');
  assert.equal(r.snapshot.boards.find((b) => b.name === 'Delta Labs Technology').entity_block, 'entity-sibling-has-approvals');
  assert.equal(r.snapshot.boards.find((b) => b.name === 'Zeta Health').entity.status, 'not-found', 'Zeta Health must not resolve to ZETA HEALTH SOLUTIONS INC');
  assert.equal(f.software_type_on_entity_blocked_boards, 2);
  assert.equal(f.level_excluded, 1); assert.equal(f.non_us_location, 1);
  assert.equal(f.posting_screen_excluded, 1); assert.equal(f.experience_excluded, 1);
  // survivors that reach the browser: 1001, 1006 (uncertain), 1007 (expired), 1008 (text missing), 1010, Beta, Epsilon
  assert.deepEqual([...r.calls].sort(), [A(1001), A(1006), A(1007), A(1008), A(1010), BETA, u('epsilon', 2001)].sort());
  for (const never of [A(1002), A(1003), A(1004), A(1005), A(1009), u('zetahealth', 3001)]) assert.ok(!r.calls.includes(never), `${never} must not reach the browser`);
  assert.equal(r.maxInFlight(), 1, 'one page at a time (the repo rule: never Playwright in parallel)');
  assert.deepEqual([f.liveness_checked, f.liveness_active, f.liveness_expired, f.liveness_uncertain], [7, 5, 1, 1]);
});

test('ingest: a liveness result is a record only because the repo checker is named; the quote travels with an exclusion', async () => {
  const r = await ingest();
  const role = (id) => r.snapshot.roles.find((x) => x.role_id === id);
  const live = role('alphaclaims-1001').liveness;
  assert.deepEqual([live.status, live.source, live.checked_on, live.method], ['active', 'record', TODAY, LIVENESS_METHOD]);
  assert.match(LIVENESS_METHOD, /scripts\/ats\/liveness-browser\.mjs/);
  assert.equal(role('alphaclaims-1006').liveness.status, 'uncertain');
  assert.equal(role('alphaclaims-1006').liveness.code, 'navigation_error');
  const cit = role('alphaclaims-1004');
  assert.equal(cit.pre_excluded.stage, 'posting-screen');
  assert.match(cit.jd_screen.citizenship_required.snippet, /U\.S\. citizen/);
  assert.equal(cit.liveness, null, 'an excluded role is never opened in the browser');
  assert.equal(role('alphaclaims-1005').pre_excluded.stage, 'experience');
  assert.equal(role('alphaclaims-1008').jd_screen.status, 'missing');
  assert.ok(!JSON.stringify(r.snapshot).includes('Lorem'), 'no posting text in the reduced snapshot');
  assert.ok(Object.keys(r.raw.descriptions).length >= 5, 'posting text goes only to the raw (private) snapshot');
});

test('ingest: the per-board cap is logged, never silent; a failing text fetch is recorded, not hidden', async () => {
  const capped = await ingest({ maxPerBoard: 2 });
  // Alpha has 7 eligible roles (1001, 1004-1008, 1010); a cap of 2 keeps the first two, in offer order
  assert.equal(capped.snapshot.funnel.over_cap, 5);
  assert.equal(capped.snapshot.roles.filter((x) => x.pre_excluded?.stage === 'cap').length, 5);
  const noText = await ingest({ describe: async () => { throw new Error('HTTP 500'); } });
  assert.ok(noText.snapshot.boards.some((b) => /HTTP 500/.test(b.describe_error || '')));
  const missing = noText.snapshot.roles.filter((x) => x.jd_screen?.status === 'missing').length;
  assert.ok(missing > 0 && missing === noText.snapshot.funnel.posting_text_missing, 'every role whose text could not be read is counted as missing');
});

test('ingest: with no browser the roles stay unchecked (and run.mjs will hold them)', async () => {
  const r = await runIngest({ portals, persona, csvRows, csvRel: 'x.csv', providers, describe, liveness: null, fetchedOn: TODAY });
  assert.ok(r.snapshot.roles.filter((x) => !x.pre_excluded).every((x) => x.liveness.status === 'unchecked'));
});

function runPipeline(snapshot, { today = TODAY, out = tmp() } = {}) {
  const snapPath = path.join(out, 'candidates.snapshot.json');
  fs.writeFileSync(snapPath, JSON.stringify(snapshot, null, 2));
  const res = spawnSync(process.execPath, [RUN, '--today', today, '--out-dir', out, '--csv', path.join(FX, 'mini-80days-v02.csv'),
    '--formd-dir', path.join(FX, 'formd'), '--bls', path.join(FX, 'mini-bls.csv'), '--persona', path.join(FX, 'persona.v02.fixture.json'), '--candidates', snapPath], { encoding: 'utf8' });
  return { res, out, log: fs.existsSync(path.join(out, 'run-log.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8')) : null };
}

test('run: decisions, labels, exclusions and the report on a real snapshot through the real scorer', async () => {
  const { snapshot } = await ingest();
  const { res, out, log } = runPipeline(snapshot);
  assert.equal(res.status, 0, res.stderr);
  const by = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));

  assert.equal(by['alphaclaims-1001'].decision.recommendation, 'Apply');
  assert.equal(by['alphaclaims-1001'].decision.composite, 0.525); // 0.9·0.35 + 0.7·0.3, timeline 1, liveness 1
  assert.ok(by['alphaclaims-1001'].flags.some((f) => /Apply holds even at fit 0/.test(f)), 'sponsorship alone clears the scorer\'s Apply bar: say so');
  assert.deepEqual(by['alphaclaims-1006'].blocked, ['liveness-uncertain:navigation_error']);
  assert.equal(by['alphaclaims-1007'].decision.recommendation, 'Skip');
  assert.equal(by['alphaclaims-1007'].next_action.block, 'reallocate');
  assert.deepEqual(by['alphaclaims-1008'].blocked, ['posting-text-missing']);
  const beta = log.roles.find((r) => r.company === 'Beta Health');
  assert.equal(beta.decision.recommendation, 'Consider');          // Unknown tier: no sponsorship vote, fit 0.8·0.3 = 0.24
  assert.equal(beta.sponsorship.p, null);
  assert.ok(beta.flags.some((f) => /no-sponsorship wording/.test(f)));
  assert.ok(beta.flags.some((f) => /board "beta" does not match the CSV website betahealth\.test/.test(f)), 'a board name that disagrees with the CSV website is shown');
  assert.equal(log.roles.find((r) => r.role_id === 'alphaclaims-1001').board_corroboration.status, 'match');
  assert.ok(!by['alphaclaims-1001'].flags.some((f) => /does not match/.test(f)), 'a matching board stays quiet');
  const eps = log.roles.find((r) => r.company === 'Epsilon');
  assert.equal(eps.decision.recommendation, 'Apply');
  assert.ok(eps.flags.some((f) => /same website as EPSILON HOLDINGS INC/.test(f)));

  // a Proven sponsor, but only a general-software fit (0.5 < the 0.6 floor): the scorer says Apply on sponsorship alone,
  // the mode holds it at Consider through the scorer's own override field and keeps both answers visible
  const held = by['alphaclaims-1010'];
  assert.equal(held.decision.recommendation, 'Consider');
  assert.equal(held.decision.machine_recommendation, 'Apply');
  assert.match(held.decision.override.reason, /below your Apply floor 0\.6/);
  assert.ok(held.flags.some((f) => /scorer said Apply; held at Consider/.test(f)));
  assert.equal(log.scorer.invocations, 2);
  assert.deepEqual(log.summary, { Apply: 2, Consider: 2, Skip: 1, BLOCKED: 2, Excluded: 4 });
  assert.deepEqual(log.coverage.excluded_by_stage, { level: 1, location: 1, 'posting-screen': 1, experience: 1 });
  assert.deepEqual(log.coverage.scorer_record_terms_are, ['liveness']);
  assert.match(log.coverage.scorer_terms_labeled_record, /^[1-9]\d*\/\d+$/, 'liveness from the repo checker is now a record');
  for (const x of ['alphaclaims-1002', 'alphaclaims-1003', 'alphaclaims-1004', 'alphaclaims-1005']) assert.equal(by[x].decision.recommendation, 'Excluded', x);

  const roles = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  assert.ok(roles.every((r) => typeof r.liveness.factor === 'number' && !/Excluded|BLOCKED/.test(r.role_id)), 'only checked, gated roles reach the scorer');
  const scores = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer');
  for (const s of scores.roles) for (const t of [...s.trace.votes, ...s.trace.gates]) assert.ok(LABELS.has(t.source), `${s.role_id}: ${t.factor} labeled ${t.source}`);
  assert.ok(scores.roles.every((s) => s.trace.gates.find((g) => g.factor === 'liveness').source === 'record'));
  const scoredHeld = scores.roles.find((x) => x.role_id === 'alphaclaims-1010');
  assert.deepEqual([scoredHeld.machine_recommendation, scoredHeld.recommendation], ['Apply', 'Consider'], 'role-scores.json and run-log.json tell the same story');

  assert.equal(log.data_horizon.date, '2025-07-15');
  assert.deepEqual([log.timeline_slack.buffer_narrows_at_days, log.timeline_slack.scorer_gate_closes_at_days], [144, 172]);
  const report = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
  assert.match(report, /^# .*\n\n## Executive summary/);
  for (const h of ['## How many roles survived each gate', '## Boards the engine could not score', '## Excluded before scoring', '## What this run could not verify']) assert.ok(report.includes(h), h);
  assert.match(report, /Zeta Health[^\n]*entity-not-found/);
  assert.match(report, /Delta Labs Technology[^\n]*entity-sibling-has-approvals/);
  assert.match(report, /Quote: "[^"]*U\.S\. citizen/);
  const FUNDING_LABELS = ['recent', 'not-recent-in-dataset', 'unknown-beyond-horizon', 'missing'];
  for (const r of log.roles.filter((x) => !x.excluded)) assert.ok(FUNDING_LABELS.includes(r.funding.recency), `${r.role_id}: funding label ${r.funding.recency}`);
  assert.ok(!/→ stale\b/.test(report), 'no funding row is labeled stale: the data cannot show that');
});

test('run: the same snapshot gives byte-identical outputs twice', async () => {
  const { snapshot } = await ingest();
  const a = runPipeline(snapshot), b = runPipeline(snapshot);
  for (const f of ['run-log.json', 'report.md', 'roles.json']) {
    const norm = (s) => s.split(a.out).join('<OUT>').split(b.out).join('<OUT>');
    assert.equal(norm(fs.readFileSync(path.join(a.out, f), 'utf8')), norm(fs.readFileSync(path.join(b.out, f), 'utf8')), f);
  }
});

test('run: evidence expires — ten days later nothing is scored, everything is held', async () => {
  const { snapshot } = await ingest();
  const { res, out, log } = runPipeline(snapshot, { today: '2026-10-30' });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(log.summary.Apply + log.summary.Consider + log.summary.Skip, 0);
  const gated = log.roles.filter((r) => !r.excluded);
  assert.ok(gated.length > 0 && gated.every((r) => r.blocked.some((b) => b.startsWith('liveness-stale'))), 'every gated role is held for stale liveness');
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false, 'the scorer is not run on stale evidence');
});

test('run: a hand-edited snapshot cannot slip a citizenship role through, and an unscreened role is held', async () => {
  const { snapshot } = await ingest();
  const edited = JSON.parse(JSON.stringify(snapshot));
  const r1 = edited.roles.find((x) => x.role_id === 'alphaclaims-1004');
  r1.pre_excluded = null; r1.liveness = { status: 'active', checked_on: TODAY, method: LIVENESS_METHOD, source: 'record' };   // someone removes the exclusion
  const r2 = edited.roles.find((x) => x.role_id === 'alphaclaims-1001');
  r2.jd_screen = null;                                                                                                      // and someone drops a screen
  const { res, log } = runPipeline(edited);
  assert.equal(res.status, 0, res.stderr);
  const by = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));
  assert.equal(by['alphaclaims-1004'].decision.recommendation, 'Excluded');
  assert.deepEqual(by['alphaclaims-1001'].blocked, ['posting-unscreened']);
});

test('run: a claimed record without the repo checker is relabeled your-input', async () => {
  const { snapshot } = await ingest();
  const edited = JSON.parse(JSON.stringify(snapshot));
  edited.roles.find((x) => x.role_id === 'alphaclaims-1001').liveness.method = 'I looked';
  const { out, log } = runPipeline(edited);
  const row = log.roles.find((r) => r.role_id === 'alphaclaims-1001');
  assert.equal(row.liveness.source, 'your-input');
  assert.match(row.liveness.note, /relabeled your-input/);
  const scores = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
  assert.equal(scores.roles.find((s) => s.role_id === 'alphaclaims-1001').trace.gates.find((g) => g.factor === 'liveness').source, 'your-input');
});

test('ingest CLI refuses to write outside this contribution, and raw postings outside private/ (before any network)', () => {
  const run = (args) => spawnSync(process.execPath, [INGEST, '--no-liveness', ...args], { encoding: 'utf8' });
  const a = run(['--out', path.join(ROOT, 'data/examples/x.json')]);
  assert.equal(a.status, 2); assert.match(a.stderr, /outside this contribution's namespaces/);
  const b = run(['--out', path.join(tmp(), 'c.json'), '--raw-dir', path.join(ROOT, 'data/raw')]);
  assert.equal(b.status, 2); assert.match(b.stderr, /must be under private\//);
});

test('run: with no fit floor in the persona the scorer\'s Apply stands (the floor is the person\'s input, not hidden logic)', async () => {
  const { snapshot } = await ingest();
  const out = tmp();
  const noFloor = path.join(out, 'persona.nofloor.json');
  const p = JSON.parse(fs.readFileSync(path.join(FX, 'persona.v02.fixture.json'), 'utf8'));
  delete p.apply_fit_floor;
  fs.writeFileSync(noFloor, JSON.stringify(p));
  fs.writeFileSync(path.join(out, 'candidates.snapshot.json'), JSON.stringify(snapshot));
  const res = spawnSync(process.execPath, [RUN, '--today', TODAY, '--out-dir', out, '--csv', path.join(FX, 'mini-80days-v02.csv'), '--formd-dir', path.join(FX, 'formd'),
    '--bls', path.join(FX, 'mini-bls.csv'), '--persona', noFloor, '--candidates', path.join(out, 'candidates.snapshot.json')], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
  assert.equal(log.roles.find((r) => r.role_id === 'alphaclaims-1010').decision.recommendation, 'Apply');
  assert.equal(log.scorer.invocations, 1);
  assert.equal(log.summary.Apply, 3);
});

test('run: a missing or empty Form D sample directory stops the run; a missing BLS file only labels the context missing', async () => {
  const { snapshot } = await ingest();
  const base = tmp();
  const snapPath = path.join(base, 'candidates.snapshot.json');
  fs.writeFileSync(snapPath, JSON.stringify(snapshot));
  const args = (out, formd, bls) => [RUN, '--today', TODAY, '--out-dir', out, '--csv', path.join(FX, 'mini-80days-v02.csv'), '--formd-dir', formd, '--bls', bls,
    '--persona', path.join(FX, 'persona.v02.fixture.json'), '--candidates', snapPath];

  // "0 of N Form D hits" would read as "looked, found none": a directory that is absent, or has no .json in it, is a stop
  for (const formd of [path.join(base, 'no-such-dir'), tmp()]) {
    const out = tmp();
    const res = spawnSync(process.execPath, args(out, formd, path.join(FX, 'mini-bls.csv')), { encoding: 'utf8' });
    assert.equal(res.status, 2, res.stderr);
    assert.match(res.stderr, /Form D sample directory not found or holds no \.json file/);
    const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
    assert.equal(log.status, 'failed');
    assert.deepEqual(log.roles, []);
    assert.ok(!fs.existsSync(path.join(out, 'role-scores.json')), 'no scores were produced');
  }

  // the BLS median feeds no score (scorer weight 0.0): a missing file is labeled, and no decision moves
  const out = tmp();
  const res = spawnSync(process.execPath, args(out, path.join(FX, 'formd'), path.join(base, 'no-such-bls.csv')), { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
  assert.deepEqual([log.role_quality_context.status, log.role_quality_context.reason], ['missing', 'bls-file-not-found']);
  assert.deepEqual(log.summary, runPipeline(snapshot).log.summary);
});
