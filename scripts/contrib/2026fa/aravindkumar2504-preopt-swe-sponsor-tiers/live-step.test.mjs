// live-step.test.mjs: offline tests for the live step (boards, posting choice, gate H1 parsing, the H2 screen).
// Run: node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
// No network: the job-board and liveness calls are exercised by the live run, not here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { slugCandidates, shortlistFrom, portalsYaml } from './find-boards.mjs';
import { usLocation, titleRule, parseHistory, select } from './select-postings.mjs';
import { parseCheckerOutput, readUrls } from './h1-liveness.mjs';
import { sentences, screen, apiFor } from './h2-screen.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FAMILY = JSON.parse(fs.readFileSync(path.join(HERE, 'role-families.json'), 'utf8')).families['backend-platform-swe'];
const PARAMS = JSON.parse(fs.readFileSync(path.join(HERE, 'live-params.json'), 'utf8'));

test('board names: legal words dropped, strongest guess first, first-word guess last and labelled weakest', () => {
  assert.deepEqual(slugCandidates('COHERE HEALTH INC').map((c) => c.slug), ['coherehealth', 'cohere-health', 'cohere']);
  assert.equal(slugCandidates('COHERE HEALTH INC').at(-1).made_from, 'first word only (weakest guess)');
  assert.deepEqual(slugCandidates('MERCURY TECHNOLOGIES INC').map((c) => c.slug), ['mercurytechnologies', 'mercury-technologies', 'mercury']);
  assert.equal(slugCandidates('MERCURY TECHNOLOGIES INC')[2].made_from, 'name without generic words');
  assert.deepEqual(slugCandidates('STRIPE INC').map((c) => c.slug), ['stripe']);
  assert.deepEqual(slugCandidates('INC'), []);
  assert.ok(slugCandidates('AT&T SERVICES, INC.').every((c) => /^[a-z0-9-]+$/.test(c.slug)));
});

test('the shortlist is the Apply and Consider companies, one row each, best composite first', () => {
  const roles = [
    { company: 'B CO', recommendation: 'Apply', composite: 0.3 },
    { company: 'A CO', recommendation: 'Consider', composite: 0.25 },
    { company: 'B CO', recommendation: 'Apply', composite: 0.2 },
    { company: 'C CO', recommendation: 'Skip', composite: 0.9 },
    { company: 'D CO', recommendation: 'Apply', composite: 0.3 },
  ];
  assert.deepEqual(shortlistFrom({ roles }).map((r) => r.company), ['B CO', 'D CO', 'A CO']);
});

test('the scanner input lists only companies with a board, names quoted', () => {
  const y = portalsYaml([
    { company: 'X "Q" INC', hit: { provider: 'greenhouse', careers_url: 'https://job-boards.greenhouse.io/x' } },
    { company: 'NONE INC', hit: null },
  ]);
  assert.match(y, /name: "X \\"Q\\" INC"/);
  assert.match(y, /provider: greenhouse/);
  assert.ok(!y.includes('NONE INC'));
});

test('U.S. location rule: states, codes and "US" count; a non-U.S. remote role does not', () => {
  for (const loc of ['San Francisco, CA', 'US-Remote, Chicago, Seattle', 'New York City, NY', 'Mountain View, California',
    'San Mateo, CA United States', 'Remote']) assert.equal(usLocation(loc).us, true, loc);
  for (const loc of ['Toronto, Canada', 'London, UK', 'Remote - Canada', 'Bengaluru, India', '']) assert.equal(usLocation(loc).us, false, loc);
  assert.match(usLocation('Remote').why, /assumed U\.S\.; a person checks/);
});

test('title rule: backend family kept, excluded families dropped, senior titles flagged', () => {
  assert.equal(titleRule('Backend Engineer, Core Technology', FAMILY).family, true);
  assert.equal(titleRule('Solutions Architect', FAMILY).family, false);
  assert.equal(titleRule('Frontend Engineer', FAMILY).family, false);
  assert.equal(titleRule('Senior Software Engineer - Backend', FAMILY).senior, true);
  assert.equal(titleRule('Software Engineer II', FAMILY).senior, false);
});

test('scan history must carry the columns the choice needs', () => {
  assert.throws(() => parseHistory('url\ttitle\nhttps://x\tEngineer'), /no "company" column/);
  assert.deepEqual(parseHistory('url\ttitle\tcompany\tlocation\nhttps://x\tEngineer\tX\tNY, NY'),
    [{ url: 'https://x', title: 'Engineer', company: 'X', location: 'NY, NY' }]);
});

test("choice: the author's live exclusions, entry level, U.S. only, one per company, base-run order", () => {
  const boards = { companies: [{ company: 'A', hit: {} }, { company: 'B', hit: {} }, { company: 'C', hit: {} }, { company: 'D', hit: null }] };
  const h = (company, title, location, url) => ({ company, title, location, url });
  const history = [
    h('A', 'Contractor: DevOps Engineer', 'United States', 'https://a/1'),
    h('A', 'Systems PhD - Software Engineer', 'San Francisco, CA', 'https://a/2'),
    h('A', 'Senior Software Engineer - Backend', 'San Francisco, CA', 'https://a/3'),
    h('A', 'Software Engineer, Platform', 'Toronto, Canada', 'https://a/4'),
    h('B', 'Software Engineer', 'New York, NY', 'https://b/2'),
    h('B', 'Backend Engineer', 'New York, NY', 'https://b/1'),
    h('C', 'Software Engineer', 'Austin, TX', 'https://c/1'),
    h('D', 'Software Engineer', 'Austin, TX', 'https://d/1'),
  ];
  const res = select({ history, boards, family: FAMILY, params: PARAMS });
  assert.deepEqual(res.chosen.map((p) => p.url), ['https://b/1', 'https://c/1'], 'A has nothing eligible; B prefers the backend title; D has no board');
  const why = Object.fromEntries(res.postings.map((p) => [p.url, p.why]));
  assert.match(why['https://a/1'], /author's live rule/);
  assert.match(why['https://a/2'], /author's live rule/);
  assert.match(why['https://a/3'], /senior-level/);
  assert.match(why['https://a/4'], /location/);
  assert.deepEqual(res.perCompany.find((c) => c.company === 'C'), { company: 'C', postings_found: 1, eligible: 1, chosen: ['https://c/1'], past_total_cap: 0 });
  const capped = select({ history, boards, family: FAMILY, params: { ...PARAMS, max_postings_total: { value: 1 } } });
  assert.equal(capped.chosen.length, 1);
  assert.deepEqual(capped.perCompany.find((c) => c.company === 'C'), { company: 'C', postings_found: 1, eligible: 1, chosen: [], past_total_cap: 1 },
    'a company the total cap cuts is not recorded as chosen');
});

test('gate H1 parsing: verdicts and reasons kept; a missing or duplicated verdict fails closed as uncertain', () => {
  const urls = ['https://a', 'https://b', 'https://c', 'https://d'];
  const out = [
    '✅ active     https://a',
    '❌ expired    https://b',
    '           HTTP 404',
    '✅ active     https://d',
    '⚠️ uncertain  https://d',
    '           content present but no visible apply control found',
  ].join('\n');
  const v = parseCheckerOutput(out, urls);
  assert.deepEqual(v.map((x) => x.recorded_as), ['active', 'expired', 'uncertain', 'uncertain']);
  assert.equal(v[1].reason, 'HTTP 404');
  assert.match(v[2].reason, /no verdict/);
  assert.match(v[3].reason, /2 verdicts/);
  assert.deepEqual(readUrls('# header\nhttps://a\n\n  https://b  \n'), ['https://a', 'https://b']);
});

test('gate H1 wrapper runs a checker, saves its output word for word, and records the dropped URL as uncertain', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h1-'));
  fs.writeFileSync(path.join(dir, 'urls.txt'), '# test\nhttps://example.com/a\nhttps://example.com/b\nhttps://example.com/c\n');
  const r = spawnSync(process.execPath, [path.join(HERE, 'h1-liveness.mjs'), '--urls', path.join(dir, 'urls.txt'), '--out-dir', dir,
    '--checker', path.join(HERE, 'fixtures', 'STANDIN-liveness-checker.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const rec = JSON.parse(fs.readFileSync(path.join(dir, 'h1-liveness.json'), 'utf8'));
  assert.deepEqual(rec.summary, { checked: 3, active: 1, expired: 1, uncertain: 1 });
  assert.equal(rec.checker_exit_code, 1);
  assert.match(fs.readFileSync(path.join(dir, 'h1-liveness.stdout.txt'), 'utf8'), /❌ expired {4}https:\/\/example\.com\/b/);
  const missing = spawnSync(process.execPath, [path.join(HERE, 'h1-liveness.mjs'), '--urls', path.join(dir, 'urls.txt'), '--out-dir', dir,
    '--checker', path.join(dir, 'no-such-checker.mjs')], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /checker not found/);
});

test('H2 screen: escaped posting HTML becomes sentences, and each trap category is quoted', () => {
  const html = '&lt;p&gt;We do sponsor and take over sponsorship of employment visas for this role.&lt;/p&gt;'
    + '&lt;ul&gt;&lt;li&gt;Must be a U.S. citizen or permanent resident.&lt;/li&gt;&lt;li&gt;Active security clearance preferred.&lt;/li&gt;&lt;/ul&gt;'
    + '&lt;p&gt;This role may involve ITAR-controlled data.&lt;/p&gt;&lt;p&gt;You must be authorized to work in the United States.&lt;/p&gt;'
    + '&lt;p&gt;PhD in computer science required.&lt;/p&gt;&lt;p&gt;This is a 6-month contract position.&lt;/p&gt;'
    + '&lt;p&gt;Graduating in Spring 2027 with a start date in June.&lt;/p&gt;&lt;p&gt;We build great tools.&lt;/p&gt;';
  assert.ok(sentences(html).includes('Must be a U.S. citizen or permanent resident.'));
  const cats = new Set(screen(html).map((f) => f.category));
  for (const c of ['sponsorship', 'citizenship or U.S.-person status', 'clearance or export control', 'work authorization',
    'degree level', 'contract terms', 'graduation window or start date']) assert.ok(cats.has(c), c);
  assert.deepEqual(screen('<p>We build great tools for engineers.</p>'), [], 'nothing to quote is not a pass, but it quotes nothing');
});

test('H2 screen finds the posting text API from each board URL shape, and no other host', () => {
  assert.equal(apiFor('https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004', 'figma', 'greenhouse'),
    'https://boards-api.greenhouse.io/v1/boards/figma/jobs/6201407004');
  assert.equal(apiFor('https://stripe.com/jobs/search?gh_jid=6042172', 'stripe', 'greenhouse'),
    'https://boards-api.greenhouse.io/v1/boards/stripe/jobs/6042172');
  assert.equal(apiFor('https://jobs.lever.co/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3', 'xage-security', 'lever'),
    'https://api.lever.co/v0/postings/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3?mode=json');
  assert.equal(apiFor('https://evil.example/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3', 'xage-security', 'lever'), null,
    'a Lever posting id on a page from another host is not trusted');
  assert.equal(apiFor('https://jobs.ashbyhq.com/x/123', 'x', 'ashby'), null);
  assert.equal(apiFor('https://example.com/jobs', 'x', 'greenhouse'), null);
});
