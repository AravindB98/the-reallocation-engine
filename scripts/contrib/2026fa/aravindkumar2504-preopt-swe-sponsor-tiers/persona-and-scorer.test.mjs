// persona-and-scorer.test.mjs: persona checks (gate G1) and the scorer-integrity guard (gate G2).
// The scorer is run as a command, never imported or copied.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { InputError } from './timeline.mjs';
import { loadPersona, parsePersonaText, validatePersona } from './persona.mjs';
import { IntegrityError, assertScorerIntegrity, buildRole, buildScorerProfile, runScorer } from './scorer-bridge.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const KIRAN = path.join(REPO, 'search', 'examples', 'kiran-rao', 'profile.yml');

test('the committed fictional persona passes gate G1 and keeps dates as strings', () => {
  const p = loadPersona(KIRAN);
  assert.equal(p.needs_sponsorship, true);
  assert.equal(p.target_role.soc, '15-1252');
  assert.equal(p.visa.ead_start_date, '2027-06-01');
  assert.equal(typeof p.visa.ead_start_date, 'string');
  assert.equal(p.expected_days_to_start, 75);
  assert.equal(p.label, 'your-input');
});

test('the persona result carries no contact details', () => {
  const text = JSON.stringify(loadPersona(KIRAN));
  assert.ok(!/example\.com|555|linkedin|github|Kiran/i.test(text));
});

test('a persona with missing fields fails once, naming every problem, and invents no default', () => {
  const doc = parsePersonaText('needs_sponsorship: maybe\nvisa:\n  ead_start_date: soon\n');
  assert.throws(() => validatePersona(doc), (e) => {
    assert.ok(e instanceof InputError);
    const all = e.problems.join('\n');
    for (const needle of ['needs_sponsorship', 'target_role.soc', 'target_role.family', 'ead_start_date', 'opt_end_date', 'unemployment_days_used', 'unemployment_ceiling', 'buffer_target', 'expected_days_to_start']) {
      assert.ok(all.includes(needle), `problem list should mention ${needle}`);
    }
    return true;
  });
});

test('malformed YAML is an input error (exit 2 at the command line), not a stack trace', () => {
  assert.throws(() => parsePersonaText('a: [unclosed\nb: : :'), (e) => e instanceof InputError && /not valid YAML/.test(e.message));
  assert.throws(() => parsePersonaText('- just\n- a list'), InputError);
});

test('an older persona with no explicit needs_sponsorship is refused rather than guessed', () => {
  assert.throws(() => loadPersona(path.join(REPO, 'search', 'examples', 'aarav-patel', 'profile.yml')), (e) => e instanceof InputError && e.problems.some((p) => p.includes('needs_sponsorship')));
});

test('command-line values fill what an older persona lacks, and are recorded as such', () => {
  const p = loadPersona(path.join(REPO, 'search', 'examples', 'priya-nair', 'profile.yml'), { soc: '15-1252', family: 'backend-platform-swe', daysToStart: 42 });
  assert.equal(p.sources.soc, 'command-line');
  assert.equal(p.sources.expected_days_to_start, 'command-line');
  assert.equal(p.sources.unemployment_days_used, 'persona-file');
  assert.equal(p.visa.unemployment_days_used, 34);
});

test('the scorer profile text is chosen so the scorer reads it correctly in both directions', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scorer-'));
  const rolesPath = path.join(dir, 'roles.json');
  const cand = { role_id: 'sponsor-x', company: 'X', matched_titles: ['Software Engineer'], tier: { p: 0.9, tier: 'Proven' } };
  const roles = [buildRole(cand, { factor: 1 })];
  fs.writeFileSync(rolesPath, JSON.stringify(roles));
  for (const needs of [true, false]) {
    const profilePath = path.join(dir, `profile-${needs}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(buildScorerProfile({ needs_sponsorship: needs })));
    const out = path.join(dir, `out-${needs}`);
    runScorer({ repoRoot: REPO, rolesPath, profilePath, outDir: out });
    const j = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
    assert.equal(j.profile_needs_sponsorship, needs);
    assertScorerIntegrity({ persona: { needs_sponsorship: needs }, scorerJson: j, sentRoles: roles }); // must not throw
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('named failure case F6: the guard notices a scorer that mis-reads the persona or labels a placeholder as a record', () => {
  const broken = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'BROKEN-scorer-output.fixture.json'), 'utf8'));
  assert.throws(() => assertScorerIntegrity({ persona: { needs_sponsorship: true }, scorerJson: broken, sentRoles: [{ role_id: 'sponsor-alphaplatform' }] }), (e) => {
    assert.ok(e instanceof IntegrityError);
    const all = e.problems.join('\n');
    assert.match(all, /profile_needs_sponsorship=false but the persona says true/);
    assert.match(all, /liveness gate labelled "record"/);
    return true;
  });
});

test('the guard notices a missing or extra role and an override this run never supplied', () => {
  const good = { profile_needs_sponsorship: true, roles: [{ role_id: 'a', trace: { gates: [{ factor: 'liveness', source: 'your-input' }, { factor: 'timeline', source: 'your-input' }] } }, { role_id: 'b', override: { decision: 'Apply' }, trace: { gates: [{ factor: 'liveness', source: 'your-input' }, { factor: 'timeline', source: 'your-input' }] } }] };
  assert.throws(() => assertScorerIntegrity({ persona: { needs_sponsorship: true }, scorerJson: good, sentRoles: [{ role_id: 'a' }, { role_id: 'b' }, { role_id: 'c' }] }), (e) => {
    const all = e.problems.join('\n');
    assert.match(all, /returned 2 roles but 3 were sent/);
    assert.match(all, /c: missing/);
    assert.match(all, /b: an override appeared/);
    return true;
  });
});

test('KNOWN-DEFECT CANARY (informational): report whether the real scorer still mis-reads the older persona wording', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-'));
  const rolesPath = path.join(dir, 'roles.json');
  const profilePath = path.join(dir, 'profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify([buildRole({ role_id: 'sponsor-x', company: 'X', matched_titles: ['Software Engineer'], tier: { p: 0.9, tier: 'Proven' } }, { factor: 1 })]));
  fs.writeFileSync(profilePath, JSON.stringify({ authorization: 'F-1 STEM OPT (work authorized, EAD)', needs_sponsorship: true }));
  execFileSync(process.execPath, [path.join(REPO, 'scripts', 'score', 'role-scorer.mjs'), rolesPath, '--profile', profilePath, '--out-dir', dir], { cwd: REPO, stdio: 'ignore' });
  const j = JSON.parse(fs.readFileSync(path.join(dir, 'role-scores.json'), 'utf8'));
  // This test never fails on the defect itself: it documents it. The guard above is what protects a run.
  console.log(`  canary: with the older persona wording the scorer reports profile_needs_sponsorship=${j.profile_needs_sponsorship} (${j.profile_needs_sponsorship ? 'defect appears FIXED upstream: the guard can be relaxed' : 'defect still present: the guard is needed'})`);
  assert.equal(typeof j.profile_needs_sponsorship, 'boolean');
  fs.rmSync(dir, { recursive: true, force: true });
});
