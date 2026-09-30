// timeline.test.mjs: offline tests for the visa-timeline gate.
// Run: node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { InputError, dayToIso, isoToDay, monthsBetween, timelineFactor } from './timeline.mjs';

// The persona under test is the fictional pre-authorization graduate (search/examples/kiran-rao).
const KIRAN = { eadStart: '2027-06-01', authEnd: '2028-05-31', daysUsed: 0, ceiling: 90, buffer: 20, daysToStart: 75 };

test('dates round-trip and reject impossible calendar dates', () => {
  assert.equal(dayToIso(isoToDay('2027-06-01')), '2027-06-01');
  assert.equal(isoToDay('1970-01-02'), 1);
  assert.throws(() => isoToDay('2027-02-30'), InputError);
  assert.throws(() => isoToDay('06/01/2027'), InputError);
  assert.equal(Math.round(monthsBetween(isoToDay('2025-09-26'), isoToDay('2026-09-30'), 30.4375) * 10) / 10, 12.1);
});

test('before authorization starts the clock has not started: factor 1 and zero days accrued', () => {
  const t = timelineFactor({ ...KIRAN, asOf: '2026-09-30' });
  assert.equal(t.factor, 1);
  assert.equal(t.reason, 'open');
  assert.equal(t.dates.expected_start, '2027-06-01'); // nobody starts before the EAD start
  assert.equal(t.days.accrued_until_start, 0);
  assert.equal(t.label, 'your-input');
});

test('once authorization has begun, a slow process eats the buffer (factor between 0 and 1)', () => {
  const t = timelineFactor({ ...KIRAN, asOf: '2027-06-01' }); // 75 days to start, 90 - 75 = 15 slack, buffer 20
  assert.equal(t.days.projected_at_start, 75);
  assert.equal(t.days.slack, 15);
  assert.equal(t.factor, 0.75);
  assert.equal(t.reason, 'buffer-partly-used');
});

test('unemployment days already used count against the ceiling', () => {
  const t = timelineFactor({ ...KIRAN, asOf: '2027-08-01', daysUsed: 61 }); // 61 + 75 = 136 > 90
  assert.equal(t.factor, 0);
  assert.equal(t.reason, 'unemployment-ceiling-reached');
});

test('boundaries: slack equal to the buffer is fully open; slack of zero is closed', () => {
  assert.equal(timelineFactor({ ...KIRAN, asOf: '2027-06-01', daysToStart: 70 }).factor, 1); // slack 20 == buffer 20
  assert.equal(timelineFactor({ ...KIRAN, asOf: '2027-06-01', daysToStart: 71 }).factor, 0.95); // slack 19
  assert.equal(timelineFactor({ ...KIRAN, asOf: '2027-06-01', daysToStart: 90 }).factor, 0); // slack 0
});

test('named failure case F4: an authorization end date already in the past closes the gate', () => {
  const t = timelineFactor({ ...KIRAN, asOf: '2028-07-01' });
  assert.equal(t.factor, 0);
  assert.equal(t.reason, 'authorization-already-ended');
});

test('a start that lands after the authorization end closes the gate even with days to spare', () => {
  const t = timelineFactor({ ...KIRAN, asOf: '2028-05-20', daysUsed: 0, daysToStart: 20, ceiling: 150 });
  assert.equal(t.factor, 0);
  assert.equal(t.reason, 'start-after-authorization-end');
});

test('an OPT-year-one candidate with 34 of 90 days used and a slow process is closed (the older persona\'s note)', () => {
  const priya = { eadStart: '2026-02-01', authEnd: '2027-01-31', daysUsed: 34, ceiling: 90, buffer: 20 };
  assert.equal(timelineFactor({ ...priya, asOf: '2026-09-30', daysToStart: 75 }).factor, 0); // 34 + 75 = 109
  assert.equal(timelineFactor({ ...priya, asOf: '2026-09-30', daysToStart: 42 }).factor, 0.7); // 76 used, slack 14 of buffer 20
  assert.equal(timelineFactor({ ...priya, asOf: '2026-09-30', daysToStart: 30 }).factor, 1); // 64 used, slack 26
});

test('bad inputs are rejected, never repaired', () => {
  assert.throws(() => timelineFactor({ ...KIRAN, asOf: '2026-09-30', daysUsed: -1 }), InputError);
  assert.throws(() => timelineFactor({ ...KIRAN, asOf: '2026-09-30', ceiling: 0 }), InputError);
  assert.throws(() => timelineFactor({ ...KIRAN, asOf: '2026-09-30', daysToStart: 1.5 }), InputError);
  assert.throws(() => timelineFactor({ ...KIRAN, asOf: '2026-09-30', eadStart: '2029-01-01' }), InputError); // start after end
});

test('a zero buffer means any positive slack is fully open', () => {
  assert.equal(timelineFactor({ ...KIRAN, asOf: '2027-06-01', buffer: 0, daysToStart: 89 }).factor, 1);
});
