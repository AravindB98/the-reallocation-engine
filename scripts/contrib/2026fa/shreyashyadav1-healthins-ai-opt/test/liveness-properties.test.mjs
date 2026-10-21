// Properties the liveness gate must have, run against the REAL gate (lib.mjs) and,
// as a negative control, against a deliberately broken one (fixtures/BROKEN-liveness-gate.mjs).
// A property suite that cannot fail proves nothing, so the broken gate MUST fail it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { livenessGate as real, parseDate } from '../lib.mjs';
import { livenessGate as broken } from './fixtures/BROKEN-liveness-gate.mjs';

const TODAY = parseDate('2026-10-20');
const CHECKER = 'scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright)';

function failedProperties(gate) {
  const failed = [];
  const check = (name, fn) => { try { if (!fn()) failed.push(name); } catch { failed.push(`${name} (threw)`); } };
  check('unchecked never becomes a factor', () => gate({ status: 'unchecked' }, TODAY, 7).factor === null);
  check('undated never becomes a factor', () => gate({ status: 'active' }, TODAY, 7).factor === null);
  check('active is an open gate', () => gate({ status: 'active', checked_on: '2026-10-20' }, TODAY, 7).factor === 1);
  check('expired is a closed gate', () => gate({ status: 'expired', checked_on: '2026-10-20' }, TODAY, 7).factor === 0);
  check('uncertain is never a factor', () => gate({ status: 'uncertain', code: 'navigation_error', checked_on: '2026-10-20' }, TODAY, 7).factor === null);
  check('stale evidence is not evidence', () => gate({ status: 'active', checked_on: '2026-10-01' }, TODAY, 7).factor === null);
  check('evidence dated after the decision day is refused', () => gate({ status: 'active', checked_on: '2026-10-21' }, TODAY, 7).factor === null);
  check('a record label needs the repo checker named', () => gate({ status: 'active', checked_on: '2026-10-20', source: 'record', method: 'looked at it myself' }, TODAY, 7).source === 'your-input');
  check('a record label is kept when the repo checker is named', () => gate({ status: 'active', checked_on: '2026-10-20', source: 'record', method: CHECKER }, TODAY, 7).source === 'record');
  return failed;
}

test('the real liveness gate has every property', () => {
  assert.deepEqual(failedProperties(real), []);
});

test('negative control: the BROKEN gate fails the same properties (so the suite can fail)', (t) => {
  const failed = failedProperties(broken);
  t.diagnostic(`the BROKEN gate fails ${failed.length} properties: ${failed.join(' | ')}`);
  assert.ok(failed.length >= 4, `expected the mutant to fail several properties, got: ${failed.join(' | ')}`);
  for (const must of [/uncertain/, /stale/, /after the decision day/, /needs the repo checker/])
    assert.ok(failed.some((f) => must.test(f)), `mutant should fail a property matching ${must}; failed: ${failed.join(' | ')}`);
});
