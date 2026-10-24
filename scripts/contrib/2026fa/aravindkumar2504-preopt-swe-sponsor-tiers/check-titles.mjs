#!/usr/bin/env node
// check-titles.mjs: redraw the fixed-seed title samples used to spot-check the role-family rule.
//
//   node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/check-titles.mjs [--seed 20260930] [--n 40] [--csv file] [--help]
//
// It lists every distinct sponsored title in the company table, splits them by the rule in
// role-families.json, and draws two seeded samples for a person to label by hand:
//   matched      titles the rule accepted (are any of them not backend-style? false positives)
//   unmatched    titles the rule rejected that still contain "engineer", "developer" or "technical"
//                (are any of them backend-style? misses)
// The draw is a pure function of the data and the seed, so the same sample can be checked by anyone.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { compileFamily, loadCompanies, parseTitles, sponsorshipRecord, titleMatches } from './evidence.mjs';
import { InputError } from './timeline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');

/** Small seeded generator (mulberry32) so the draw is repeatable. */
export function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededSample(list, n, seed) {
  const rnd = mulberry32(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n).sort();
}

export function draw(rows, fam, { seed, n }) {
  const all = new Set();
  let unreadable = 0;
  for (const r of rows) {
    if (sponsorshipRecord(r).status !== 'record') continue;
    let list;
    try { list = parseTitles(r.top_job_titles_sponsored) || []; } catch { unreadable += 1; continue; } // counted, never guessed
    for (const t of list) all.add(t);
  }
  const titles = [...all].sort();
  const matched = titles.filter((t) => titleMatches(t, fam));
  const unmatchedKeyword = titles.filter((t) => !titleMatches(t, fam) && /engineer|developer|technical/i.test(t));
  return {
    seed,
    unreadable_title_lists: unreadable,
    distinct_titles: titles.length,
    matched_total: matched.length,
    unmatched_keyword_total: unmatchedKeyword.length,
    matched_sample: seededSample(matched, n, seed),
    unmatched_keyword_sample: seededSample(unmatchedKeyword, n, seed),
  };
}

const USAGE = `usage: check-titles.mjs [--seed 20260930] [--n 40] [--csv file] [--help]
Prints, as JSON, two seeded samples of the distinct sponsored titles in the company table: titles the rule in
role-families.json accepted, and titles it rejected that still contain "engineer", "developer" or "technical".
--seed and --n are whole numbers (--n at least 1); the same data and seed always give the same sample.`;

function fail(message) {
  console.error(`error: ${message}\n${USAGE}`);
  process.exit(2);
}

function wholeNumber(name, text, min) {
  if (!/^\d+$/.test(text) || Number(text) < min) fail(`--${name} must be a whole number of ${min} or more, not "${text}"`);
  return Number(text);
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({ options: { seed: { type: 'string' }, n: { type: 'string' }, csv: { type: 'string' }, help: { type: 'boolean' } }, strict: true }));
  } catch (e) { fail(e.message); }
  if (values.help) { console.log(USAGE); return; }
  const seed = wholeNumber('seed', values.seed ?? '20260930', 0);
  const n = wholeNumber('n', values.n ?? '40', 1);
  const csvPath = path.resolve(values.csv ?? path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'));
  const fam = compileFamily(JSON.parse(fs.readFileSync(path.join(HERE, 'role-families.json'), 'utf8')).families['backend-platform-swe']);
  let rows;
  try { ({ rows } = loadCompanies(csvPath)); } catch (e) { if (e instanceof InputError) fail(e.message); throw e; }
  console.log(JSON.stringify(draw(rows, fam, { seed, n }), null, 2));
}

// Compare real paths, so the command also runs when it is reached through a symbolic link (such as /tmp on macOS).
const entry = process.argv[1] ? fs.realpathSync(process.argv[1]) : null;
if (entry && entry === fs.realpathSync(fileURLToPath(import.meta.url))) main();
