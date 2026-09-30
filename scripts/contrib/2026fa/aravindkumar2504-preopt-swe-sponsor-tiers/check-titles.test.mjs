// check-titles.test.mjs: the title-sampling helper is a pure function of the data and the seed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFamily, loadCompanies, titleMatches } from './evidence.mjs';
import { draw, mulberry32, seededSample } from './check-titles.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fam = compileFamily(JSON.parse(fs.readFileSync(path.join(HERE, 'role-families.json'), 'utf8')).families['backend-platform-swe']);
const rows = loadCompanies(path.join(HERE, 'fixtures', 'companies.fixture.csv')).rows;

test('the seeded generator and sampler are repeatable, and the seed matters', () => {
  assert.equal(mulberry32(7)(), mulberry32(7)());
  const list = Array.from({ length: 50 }, (_, i) => `t${i}`);
  assert.deepEqual(seededSample(list, 5, 1), seededSample(list, 5, 1));
  assert.notDeepEqual(seededSample(list, 5, 1), seededSample(list, 5, 2));
  assert.equal(seededSample(list, 5, 1).length, 5);
});

test('draw splits the fixture titles by the rule and is repeatable', () => {
  const a = draw(rows, fam, { seed: 3, n: 4 });
  assert.deepEqual(a, draw(rows, fam, { seed: 3, n: 4 }));
  assert.ok(a.matched_sample.length > 0 && a.matched_sample.every((t) => titleMatches(t, fam)), 'every accepted title must match the rule');
  assert.ok(a.unmatched_keyword_sample.length > 0 && a.unmatched_keyword_sample.every((t) => !titleMatches(t, fam) && /engineer|developer|technical/i.test(t)), 'every rejected title must fail the rule and contain a keyword');
  assert.ok(a.unmatched_keyword_sample.includes('Software Development Engineer in Test')); // the testing rule rejects it, and it contains "engineer"
  assert.ok(a.matched_total >= 5 && a.unmatched_keyword_total >= 3);
  assert.ok(a.distinct_titles >= a.matched_total + a.unmatched_keyword_total);
  assert.equal(a.unreadable_title_lists, 1); // the fixture's NOVEMBER BADTITLES row has a title cell that is not a list
});
