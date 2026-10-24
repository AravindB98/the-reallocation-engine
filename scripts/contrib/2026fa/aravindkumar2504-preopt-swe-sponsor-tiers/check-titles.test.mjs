// check-titles.test.mjs: the title-sampling helper is a pure function of the data and the seed.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compileFamily, loadCompanies, titleMatches } from './evidence.mjs';
import { draw, mulberry32, seededSample } from './check-titles.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fam = compileFamily(JSON.parse(fs.readFileSync(path.join(HERE, 'role-families.json'), 'utf8')).families['backend-platform-swe']);
const FIXTURE = path.join(HERE, 'fixtures', 'companies.fixture.csv');
const rows = loadCompanies(FIXTURE).rows;
const made = [];
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });
const run = (args, script = path.join(HERE, 'check-titles.mjs')) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

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

test('the command prints its usage for --help and draws from the table it is given', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /usage: check-titles\.mjs/);
  const drawn = run(['--csv', FIXTURE, '--n', '3', '--seed', '5']);
  assert.equal(drawn.status, 0, drawn.stderr);
  const out = JSON.parse(drawn.stdout);
  assert.equal(out.seed, 5);
  assert.equal(out.matched_sample.length, 3);
});

test('a seed or count that is not a whole number, or a missing table, is a message and exit 2, never a guess or a stack trace', () => {
  for (const args of [['--seed', 'abc'], ['--seed', '1.5'], ['--n', '0'], ['--n', 'many'], ['--bogus'], ['--csv', path.join(HERE, 'no-such-table.csv')]]) {
    const r = run(args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /^error: /, args.join(' '));
    assert.doesNotMatch(r.stderr, /\n\s+at /, `${args.join(' ')} printed a stack trace`);
    assert.equal(r.stdout, '', `${args.join(' ')} wrote output as well`);
  }
});

test('the command still runs when it is reached through a symbolic link (as /tmp is on macOS)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-titles-link-'));
  made.push(dir);
  fs.symlinkSync(HERE, path.join(dir, 'link'), 'dir');
  const r = run(['--csv', FIXTURE, '--n', '2'], path.join(dir, 'link', 'check-titles.mjs'));
  assert.equal(r.status, 0, r.stderr);
  assert.ok(JSON.parse(r.stdout).distinct_titles > 0, 'the command did nothing when reached through a link');
});
