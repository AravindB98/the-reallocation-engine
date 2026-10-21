// opt-countdown-v02.test.mjs — offline tests for the v0.2 additions (no network):
// posting-text facts, the G2b sponsorship-policy gate, evidence freshness,
// the alias table, --mode live, and the shared liveness checker's redirect rule.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  extractPostingFacts, htmlToText, livenessFromEvidence, postingAge, sponsorshipPolicyGate, experienceGap, aliasFor,
  MAX_EVIDENCE_AGE_DAYS,
} from './lib.mjs';
import { redirectedOffJob } from '../../../ats/liveness-browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fx = (f) => path.join(HERE, 'fixtures/test', f);
const CLI = path.join(HERE, 'opt-countdown.mjs');
const evidence = JSON.parse(fs.readFileSync(fx('posting-evidence.json'), 'utf8')).postings;
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

function candidatesWithExcluded() {
  const c = JSON.parse(fs.readFileSync(fx('candidates.json'), 'utf8'));
  c.roles.push({ role_id: 't-excludes', company: 'Klaviyo Inc', title: 'Data Scientist', soc: '15-2051.00',
    posting_url: 'https://example.org/jobs/7', greenhouse: { board: 'everquote', job_id: '333' },
    fit: { p: 0.9, source: 'model-judgment' }, hiring_lag_days: { value: 10, basis: 'test', source: 'your-input' } });
  const f = path.join(tmp('optc-c-'), 'c.json');
  fs.writeFileSync(f, JSON.stringify(c));
  return f;
}

function run(extra = [], candidates = fx('candidates.json')) {
  const out = tmp('optc-');
  const r = spawnSync(process.execPath, [CLI, '--persona', fx('persona.json'), '--candidates', candidates,
    '--liveness', fx('liveness.txt'), '--greenhouse-api', fx('greenhouse-api.txt'),
    '--sponsors-csv', fx('sponsors-mini.csv'), '--soc-csv', fx('soc-mini.csv'), '--out-dir', out, ...extra], { encoding: 'utf8' });
  return { ...r, out, read: (f) => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')) };
}

test('posting text: explicit no-sponsorship phrases match; offers and decoys do not', () => {
  const yes = ['This role is not eligible for immigration sponsorship, now or in the future', 'We cannot provide sponsorship.',
    "We can't offer visa sponsorship.", 'We do not sponsor H-1B.', 'The company is unable to sponsor visas.',
    'Must be authorized to work without the need for current or future visa sponsorship.', 'US citizenship is required.'];
  const no = ['We will provide visa sponsorship for this role.', 'We sponsor H-1B visas for this role.',
    'Regular sponsored professional development opportunities', 'Sponsorship available for the right candidate.'];
  for (const t of yes) assert.equal(extractPostingFacts(t).sponsorship_exclusion.matched, true, t);
  for (const t of no) assert.equal(extractPostingFacts(t).sponsorship_exclusion.matched, false, t);
});

test('posting text: years asked reads the lower bound, en dash included (regression)', () => {
  assert.equal(extractPostingFacts('Early in Your Career: 0–3 years of professional software engineering experience').years_required.min, 0);
  assert.equal(extractPostingFacts('5+ years of engineering or data engineering experience').years_required.min, 5);
  assert.equal(extractPostingFacts('A degree and curiosity.').years_required.min, null);
  assert.equal(htmlToText('&lt;p&gt;3+ years&amp;nbsp;of experience&lt;/p&gt;'), '3+ years of experience');
});

test('freshness: evidence older than the limit blocks; same-day evidence passes', () => {
  const ev = evidence['formlabs/111'];
  assert.equal(livenessFromEvidence(ev, '2026-10-03', new Map()).factor, 1);
  assert.equal(livenessFromEvidence(ev, '2026-10-05', new Map()).status, 'ok'); // exactly the limit
  const stale = livenessFromEvidence(ev, `2026-10-0${3 + MAX_EVIDENCE_AGE_DAYS + 1}`, new Map());
  assert.equal(stale.status, 'missing');
  assert.match(stale.reason, /^liveness-stale/);
  assert.match(livenessFromEvidence(ev, '2026-10-01', new Map()).reason, /^liveness-stale/); // checked after as_of
  assert.equal(livenessFromEvidence(evidence['klaviyo/222'], '2026-10-03', new Map()).factor, 0);
});

test('G2b, posting age, experience gap, alias table', () => {
  assert.equal(sponsorshipPolicyGate(evidence['everquote/333']).status, 'closed');
  assert.equal(sponsorshipPolicyGate(evidence['formlabs/111']).status, 'open');
  assert.equal(sponsorshipPolicyGate(evidence['klaviyo/222']).status, 'unchecked'); // a 404 has no text to read
  assert.equal(postingAge(evidence['formlabs/111'], '2026-10-03').long_open, true);
  assert.equal(experienceGap(evidence['everquote/333'], 1).gap, 1);
  assert.equal(experienceGap(evidence['everquote/333'], undefined).reason, 'no-persona-experience-years');
  assert.equal(experienceGap(evidence['klaviyo/222'], 1).reason, 'no-posting-text'); // a 404 is "not checked", not "none stated"
  assert.equal(aliasFor('iterative health', [{ posting_name: 'Iterative Health', csv_name: 'ITERATIVE SCOPES INC' }]).csv_name, 'ITERATIVE SCOPES INC');
  assert.equal(aliasFor('Iterative', [{ posting_name: 'Iterative Health', csv_name: 'X' }]), null); // exact only, no fuzzy match
});

test('shared liveness checker: a job URL redirected off its job ID is uncertain, not active', () => {
  assert.equal(redirectedOffJob('https://boards.greenhouse.io/klaviyo/jobs/1000000003', 'https://www.klaviyo.com/careers/search-jobs').code, 'redirected_off_job');
  assert.equal(redirectedOffJob('https://careers.toasttab.com/jobs?gh_jid=8103307', 'https://careers.toasttab.com/jobs?gh_jid=8103307'), null);
  assert.equal(redirectedOffJob('https://job-boards.greenhouse.io/pathai/jobs/8696764002', 'https://job-boards.greenhouse.io/pathai/jobs/8696764002#app'), null);
  assert.equal(redirectedOffJob('https://example.com/careers/data-analyst', 'https://example.com/careers'), null); // no ID → never flagged
});

test('end to end: a posting that excludes sponsorship is Skipped by G2b and never reaches the scorer', () => {
  const r = run(['--posting-evidence', fx('posting-evidence.json'), '--mode', 'live'], candidatesWithExcluded());
  assert.equal(r.status, 0, r.stderr);
  const log = r.read('opt-countdown-log.json');
  const ex = log.roles.find((x) => x.role_id === 't-excludes');
  assert.equal(ex.gated_by, 'sponsorship-policy');
  assert.equal(ex.decision.recommendation, 'Skip');
  assert.equal(ex.sponsorship.tier, 'Proven'); // history says Proven; the posting still wins
  assert.ok(!r.read('roles.json').some((x) => x.role_id === 't-excludes'));
  assert.equal(log.summary.gated_before_scoring, 1);
  assert.equal(log.mode, 'live');
  assert.equal(log.recipe_version, '0.2.0');
});

test('end to end: live mode without posting evidence refuses to run (exit 2)', () => {
  const r = run(['--posting-evidence', path.join(tmp('optc-none-'), 'missing.json'), '--mode', 'live']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /live mode needs --posting-evidence/);
});

test('end to end: --mode accepts only sample or live', () => {
  const r = run(['--mode', 'yolo']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--mode must be sample or live/);
});
