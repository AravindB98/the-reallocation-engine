// Offline unit tests for the v0.2.0 additions to lib.mjs. No network, no browser.
//
//   node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  levelOf, classifyLocation, postingIsSoftwareType, fitFromTitle, processDaysForBucket, timelineFactor, timelineSlack,
  dataHorizon, fundingEvidence, entitySiblings, buildHostIndex, websiteHost, boardCorroboration, parseCsv, parseDate,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const ROOT = path.resolve(HERE, '../../../../..');
const rowsV02 = () => parseCsv(fs.readFileSync(path.join(FX, 'mini-80days-v02.csv'), 'utf8'));

test('level: a title that asks for experience is excluded; "Member of Technical Staff" and "International" are not', () => {
  const hits = { 'Senior Software Engineer': 'senior', 'Sr. Data Engineer': 'sr', 'Sr.AI Engineer': 'sr', 'Staff ML Engineer, Frontier AI': 'staff',
    'Engineering Manager': 'manager', 'Principal Software Engineer': 'principal', 'Lead Software Engineer - Integrations': 'lead', 'Software Engineering Intern': 'intern' };
  for (const [t, w] of Object.entries(hits)) assert.equal(levelOf(t), w, t);
  for (const t of ['Member of Technical Staff, Machine Learning', 'International Software Engineer', 'Software Engineer II', 'Software Engineer', 'Leadership Software Engineer'])
    assert.equal(levelOf(t), null, t);
});

test('location: explicit markers decide, a list with a U.S. option counts as U.S., blank and "Remote" stay ambiguous', () => {
  const want = { TLV: 'non-us', EU: 'non-us', 'Hyderabad, Telangana, India': 'non-us', 'Any location, Canada': 'non-us', 'Sao Paulo, Brazil': 'non-us', 'Remote - Germany': 'non-us',
    'Mountain View, CA': 'us', NYC: 'us', 'Remote (United States)': 'us', 'Any location, United States': 'us', 'Remote- US': 'us', 'NY office OR Remote - US': 'us',
    'Remote ; San Diego, California, United States; South San Francisco, California, United States': 'us',
    Remote: 'ambiguous', Hybrid: 'ambiguous', '': 'ambiguous', 'Remote - Tier 1': 'ambiguous' };
  for (const [loc, cls] of Object.entries(want)) assert.equal(classifyLocation(loc), cls, JSON.stringify(loc));
  assert.equal(classifyLocation(null), 'ambiguous');
});

test('posting titles: same rule as the sponsored-title proxy; QA, firmware, field service and sales out; a team suffix does not exclude', () => {
  for (const t of ['Software Engineer, AI Automation', 'Software Engineer II, Solutions Engineering', 'Machine Learning Engineer', 'Fullstack Engineer, Ambient AI', 'Backend Engineer - ML Platform'])
    assert.equal(postingIsSoftwareType(t), true, t);
  for (const t of ['Software QA Engineer', 'Senior Software Quality Engineer', 'Senior Firmware Engineer, Research', 'Field Service Engineer II (Dubuque, IA)',
    'Senior Integrations Engineer', 'Account Executive, Enterprise', 'Software Test Automation Engineer', 'Sales Engineer, AI Data Solutions'])
    assert.equal(postingIsSoftwareType(t), false, t);
});

test('fit rule: first match wins, nothing matches means no vote, and the label says whose rule it is', () => {
  const want = { 'LLM Engineer, Claims': 0.9, 'Software Engineer, Billing Agents': 0.9, 'Machine Learning Engineer': 0.8, 'ML Engineer': 0.8, 'Software Engineer, AI Automation': 0.7,
    'Backend Engineer': 0.5, 'Software Engineer II': 0.5, 'Frontend Engineer, Underwriting': 0.4 };
  for (const [t, p] of Object.entries(want)) assert.equal(fitFromTitle(t)?.p, p, t);
  assert.equal(fitFromTitle('Data Analyst'), null);
  assert.equal(fitFromTitle('Machine Learning Engineer').source, 'your-input');
});

test('process days come from the persona bucket and are never invented', () => {
  const persona = { process_days_by_bucket: { startup: 42, large: 150 }, process_days_source: 'book Ch.10' };
  assert.equal(processDaysForBucket(persona, 'startup').days, 42);
  assert.match(processDaysForBucket(persona, 'large').basis, /book Ch\.10/);
  assert.equal(processDaysForBucket(persona, 'midsize'), null, 'a bucket the persona does not define yields nothing');
  assert.equal(processDaysForBucket({}, 'startup'), null);
  assert.equal(processDaysForBucket({ process_days_by_bucket: { startup: -1 } }, 'startup'), null);
});

test('timeline break-even agrees with the gate at every boundary (before and after the EAD starts)', () => {
  const visa = { ead_start_date: '2027-01-11', auth_end_date: null, unemployment_days_used: 0, unemployment_ceiling: 90, buffer_target_days: 30 };
  const today = parseDate('2026-10-20');
  const s = timelineSlack(visa, today);
  assert.deepEqual([s.buffer_narrows_at_days, s.scorer_gate_closes_at_days, s.factor_zero_at_days], [144, 172, 173]);
  const f = (p) => timelineFactor(visa, p, today).factor;
  assert.equal(f(143), 1); assert.ok(f(144) < 1); assert.ok(f(171) > 0.05); assert.ok(f(172) <= 0.05); assert.equal(f(173), 0);
  for (let p = 1; p <= 250; p++) assert.ok(f(p) <= f(p - 1), `factor must never rise with a longer loop (p=${p})`);

  const after = { ...visa, unemployment_days_used: 40 };
  const s2 = timelineSlack(after, parseDate('2027-02-20'));
  assert.deepEqual([s2.buffer_narrows_at_days, s2.scorer_gate_closes_at_days, s2.factor_zero_at_days], [21, 49, 50]);
});

test('the scorer\'s gate_zero is the one timelineSlack assumes (drift check against the scorer source)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/score/role-scorer.mjs'), 'utf8');
  assert.match(src, /gate_zero:\s*0\.05\b/, 'role-scorer.mjs changed its gate_zero: update timelineSlack and the recipe');
  assert.equal(timelineSlack({ ead_start_date: '2027-01-11', auth_end_date: null, unemployment_days_used: 0, unemployment_ceiling: 90, buffer_target_days: 30 }, parseDate('2026-10-20')).gate_zero, 0.05);
});

test('data horizon: older than the window is "not recent in the dataset", never "stale"; a window the data cannot reach is refused', () => {
  const rows = rowsV02();
  const horizon = dataHorizon(rows);
  assert.equal(horizon.toISOString().slice(0, 10), '2025-07-15');
  const alpha = rows.find((r) => r.company_name === 'ALPHA CLAIMS INC');
  const delta = rows.find((r) => r.company_name === 'DELTA LABS INC');
  const at = (row, today) => fundingEvidence(row, 'x.csv', null, parseDate(today), 18, horizon);
  assert.equal(at(alpha, '2026-10-03').recency, 'recent');
  assert.equal(at(delta, '2026-10-03').recency, 'not-recent-in-dataset');
  assert.equal(at(delta, '2026-10-03').data_horizon.date, '2025-07-15');
  // data ends 22 months before this run: no company can be called recent or not recent
  assert.equal(at(alpha, '2027-05-20').recency, 'unknown-beyond-horizon');
  assert.equal(at(delta, '2027-05-20').recency, 'unknown-beyond-horizon');
  assert.equal(fundingEvidence({ company_name: 'X', latest_funding_date: '' }, 'x.csv', null, parseDate('2026-10-03'), 18).recency, 'missing');
  assert.ok(!JSON.stringify(at(delta, '2026-10-03')).includes('stale'), 'the word stale overclaims and is gone');
});

test('siblings: a row that shares the website and holds approvals blocks; one without approvals is only shown', () => {
  const rows = rowsV02();
  const idx = buildHostIndex(rows);
  const byName = (n) => rows.find((r) => r.company_name === n);
  const delta = entitySiblings(byName('DELTA LABS TECHNOLOGY INC'), idx);
  assert.equal(delta.has_approvals, true);
  assert.deepEqual(delta.siblings.map((s) => [s.company_name, s.total_approvals]), [['DELTA LABS INC', 8]]);
  const eps = entitySiblings(byName('EPSILON INC'), idx);
  assert.equal(eps.has_approvals, false);
  assert.equal(eps.siblings.length, 1);
  assert.equal(entitySiblings(byName('ALPHA CLAIMS INC'), idx).siblings.length, 0);
  assert.equal(entitySiblings({ company_name: 'NO SITE', website: '' }, idx).host, null);
  // a host shared by many unrelated rows corroborates nothing
  const crowd = Array.from({ length: 8 }, (_, i) => ({ company_name: `C${i}`, website: 'https://www.linkedin.com/company/x', 'Total Approvals': i === 0 ? '4' : '' }));
  const g = entitySiblings(crowd[1], buildHostIndex(crowd));
  assert.equal(g.has_approvals, false);
  assert.match(g.skipped, /too generic/);
});

test('website host: scheme, www and path are dropped; junk is null', () => {
  assert.equal(websiteHost('https://www.Lemonade.com/careers'), 'lemonade.com');
  assert.equal(websiteHost('lemonade.com'), 'lemonade.com');
  assert.equal(websiteHost(''), null);
  assert.equal(websiteHost('not a url'), null);
});

test('board corroboration: the board name agrees with the CSV website, or the mismatch is shown (a hint, never a gate)', () => {
  assert.equal(boardCorroboration('coalition', 'coalition.io').status, 'match');
  assert.equal(boardCorroboration('lyrahealth', 'https://www.lyra-health.com/').status, 'match');
  assert.equal(boardCorroboration('abridge', 'abridged.com').status, 'mismatch', 'a different company with a near-identical name');
  assert.equal(boardCorroboration('kin', 'kininsurance.com').status, 'mismatch', 'a legitimate pair can still read as a mismatch: this is a hint, not proof');
  assert.equal(boardCorroboration('zocdoc', '').status, 'unknown');
  assert.equal(boardCorroboration(null, 'x.com').status, 'unknown');
});
