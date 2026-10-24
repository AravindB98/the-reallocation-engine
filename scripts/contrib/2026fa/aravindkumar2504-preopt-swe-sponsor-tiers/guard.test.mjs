// guard.test.mjs: the privacy guard and the path helper, tested on their own against a pretend repository
// built in a temporary folder. Offline: nothing here touches the real repository.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { InputError } from './timeline.mjs';
import { checkWriteLocation } from './guard.mjs';
import { canonicalPath, displayPath, isInside, relativeInside } from './paths.mjs';

const made = [];
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });

const DEFAULTS = {
  csv: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
  formdDir: 'data/sec/form-d/processed/sample',
  ownRuns: 'course/2026fa/submissions/aravindkumar2504/runs',
};
const RECIPE_REL = 'scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers';

/** A pretend repository (and a folder next to it) with the same folder names as the real one. */
function pretend() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'guard-')));
  made.push(root);
  const repo = path.join(root, 'repo');
  for (const d of ['private', 'search/examples/kiran-rao', DEFAULTS.ownRuns, 'course/other', path.dirname(DEFAULTS.csv), path.dirname(DEFAULTS.bls), DEFAULTS.formdDir, `${RECIPE_REL}/sample-inputs`, `${RECIPE_REL}/fixtures`, '..leak-inside']) {
    fs.mkdirSync(path.join(repo, d), { recursive: true });
  }
  for (const f of ['search/examples/kiran-rao/profile.yml', DEFAULTS.csv, DEFAULTS.bls, `${RECIPE_REL}/sample-inputs/watchlist.txt`]) fs.writeFileSync(path.join(repo, f), 'x');
  fs.mkdirSync(path.join(root, 'outside'));
  return { root, repo, recipeDir: path.join(repo, RECIPE_REL), outside: path.join(root, 'outside') };
}

const sample = (r) => ({ persona: path.join(r.repo, 'search/examples/kiran-rao/profile.yml'), csv: path.join(r.repo, DEFAULTS.csv), bls: path.join(r.repo, DEFAULTS.bls), formdDir: path.join(r.repo, DEFAULTS.formdDir), watchlist: null });
const real = (r) => ({ ...sample(r), persona: path.join(r.outside, 'my-persona.yml') });
const check = (r, inputs, outDir) => checkWriteLocation({ repoRoot: r.repo, recipeDir: r.recipeDir, defaults: DEFAULTS, inputs, outDir });
const refused = (r, inputs, outDir) => assert.throws(() => check(r, inputs, outDir), InputError, `should refuse ${outDir}`);
const allowed = (r, inputs, outDir) => assert.doesNotThrow(() => check(r, inputs, outDir), `should allow ${outDir}`);

test('committed samples may write in the recipe\'s own runs folder, private/ or outside the repository, and nowhere else inside it', () => {
  const r = pretend();
  assert.equal(check(r, sample(r), path.join(r.repo, DEFAULTS.ownRuns, '2026-09-30')).treatedAsReal, false);
  allowed(r, sample(r), path.join(r.repo, 'private', 'run1'));
  allowed(r, sample(r), path.join(r.outside, 'run1'));
  refused(r, sample(r), path.join(r.repo, 'course', 'other', 'run1')); // would overwrite another tracked folder
  refused(r, sample(r), r.repo); // the repository root itself
  refused(r, sample(r), path.join(r.repo, 'scripts'));
});

test('real data (a persona outside search/examples/) may be written only to private/ or outside the repository', () => {
  const r = pretend();
  assert.equal(check(r, real(r), path.join(r.outside, 'run1')).treatedAsReal, true);
  allowed(r, real(r), path.join(r.repo, 'private', 'run1'));
  refused(r, real(r), path.join(r.repo, DEFAULTS.ownRuns, 'run1')); // a real persona may not even use the recipe's own runs folder
  refused(r, real(r), path.join(r.repo, 'course', 'other', 'run1'));
  refused(r, real(r), r.repo);
  assert.throws(() => check(r, real(r), path.join(r.repo, DEFAULTS.ownRuns, 'run1')), (e) => /persona is outside search\/examples\//.test(e.message) && /private\//.test(e.message));
});

test('a folder whose name merely starts with two dots is inside the repository, not outside it', () => {
  const r = pretend();
  assert.equal(isInside(path.join(r.repo, '..leak-inside', 'x'), r.repo), true);
  assert.equal(relativeInside(path.join(r.repo, '..leak-inside', 'x'), r.repo), '..leak-inside/x');
  refused(r, real(r), path.join(r.repo, '..leak-inside', 'x')); // the bypass an earlier version allowed
  refused(r, sample(r), path.join(r.repo, '..leak-inside', 'x'));
  assert.equal(isInside(path.join(r.root, 'repo-other', 'x'), r.repo), false); // a sibling that shares the name's first letters
});

test('a symlink cannot hide where an output folder really is', () => {
  const r = pretend();
  const intoCourse = path.join(r.outside, 'looks-harmless');
  fs.symlinkSync(path.join(r.repo, 'course', 'other'), intoCourse);
  refused(r, real(r), path.join(intoCourse, 'run1')); // really inside course/other
  const intoPrivate = path.join(r.outside, 'my-private');
  fs.symlinkSync(path.join(r.repo, 'private'), intoPrivate);
  allowed(r, real(r), path.join(intoPrivate, 'run1')); // really inside private/
  const sneaky = path.join(r.repo, 'private', 'sneaky');
  fs.symlinkSync(path.join(r.repo, 'course', 'other'), sneaky);
  refused(r, real(r), path.join(sneaky, 'run1')); // named like private/, really course/other
  assert.equal(canonicalPath(path.join(sneaky, 'a', 'b')), path.join(r.repo, 'course', 'other', 'a', 'b'));
});

test('.. segments are resolved before the decision, and letter case cannot disguise the repository', (t) => {
  const r = pretend();
  refused(r, real(r), path.join(r.repo, 'private', '..', 'course', 'other', 'x'));
  allowed(r, real(r), path.join(r.repo, 'course', '..', 'private', 'x'));
  const shouted = r.repo.toUpperCase();
  if (!fs.existsSync(shouted)) { t.diagnostic('this file system is case-sensitive: the upper-case half of this test was skipped'); return; }
  refused(r, real(r), path.join(shouted, 'COURSE', 'OTHER', 'x'));
  allowed(r, real(r), path.join(shouted, 'PRIVATE', 'x'));
});

test('any input that is not a committed sample makes the run real-data: the company table, wage file, Form D folder and watchlist', () => {
  const r = pretend();
  const own = path.join(r.repo, DEFAULTS.ownRuns, 'run1');
  const cases = {
    csv: { ...sample(r), csv: path.join(r.outside, 'my-targets.csv') },
    bls: { ...sample(r), bls: path.join(r.outside, 'my-wages.csv') },
    formdDir: { ...sample(r), formdDir: path.join(r.outside, 'my-formd') },
    watchlist: { ...sample(r), watchlist: path.join(r.outside, 'my-watchlist.txt') },
  };
  for (const [what, inputs] of Object.entries(cases)) {
    assert.equal(check(r, inputs, path.join(r.outside, 'run1')).treatedAsReal, true, what);
    allowed(r, inputs, path.join(r.repo, 'private', 'run1'));
    refused(r, inputs, own);
  }
  // the committed sample watchlist and fixtures are samples; a path that only starts in sample-inputs/ and climbs out is not
  assert.equal(check(r, { ...sample(r), watchlist: path.join(r.recipeDir, 'sample-inputs', 'watchlist.txt') }, own).treatedAsReal, false);
  assert.equal(check(r, { ...sample(r), csv: path.join(r.recipeDir, 'fixtures', 'companies.fixture.csv') }, own).treatedAsReal, false);
  assert.equal(check(r, { ...sample(r), watchlist: path.join(r.recipeDir, 'sample-inputs', '..', '..', 'mine.txt') }, path.join(r.outside, 'x')).treatedAsReal, true);
});

test('paths written into outputs never carry this machine\'s folders', () => {
  const r = pretend();
  assert.equal(displayPath(path.join(r.repo, 'course', 'other', 'a.txt'), r.repo), 'course/other/a.txt');
  assert.equal(displayPath(r.repo, r.repo), '.');
  const out = displayPath(path.join(r.outside, 'secret-name', 'persona.yml'), r.repo);
  assert.equal(out, '<outside the repository>/persona.yml');
  assert.ok(!out.includes(r.root) && !out.includes(os.homedir()));
  assert.equal(displayPath(path.join(r.repo, '..leak-inside', 'x'), r.repo), '..leak-inside/x');
});
