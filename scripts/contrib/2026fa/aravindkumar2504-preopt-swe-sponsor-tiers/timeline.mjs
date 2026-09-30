// timeline.mjs: the visa-timeline gate (book Chapter 10) as one small pure function.
//
// The book describes a "timeline factor" between 0 and 1 that multiplies into a role's
// composite score, but no code in this repository computes it: every shipped example
// types the factor by hand. This file computes it from dates, and always returns the dates
// and day counts that produced it ("a factor you cannot trace to specific dates is a number
// you cannot defend").
//
// Every input here is the candidate's own (label: your-input). It is a planning multiplier,
// not legal advice: STEM eligibility and the unemployment ceiling belong to the school's
// international office.
//
// Definition (a rule proposed by the assistant and stated in the recipe under gate G3; the author has not
// yet confirmed it):
//   expected_start  = the later of (run date + expected days to start) and the EAD start date
//                     (nobody starts work before the authorization begins)
//   clock_start     = the later of run date and EAD start (unemployment days accrue only once
//                     authorization has started)
//   projected_days  = days_used + days between clock_start and expected_start
//                     (conservative: the candidate stays unemployed until the start)
//   slack           = ceiling - projected_days
//   factor          = 0 if the run date or the expected start is past the authorization end,
//                     or if slack <= 0
//                   = 1 if slack >= buffer
//                   = slack / buffer otherwise (the buffer is being eaten)

const MS_PER_DAY = 86400000;

export class InputError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'InputError';
    this.problems = problems;
  }
}

/** 'YYYY-MM-DD' -> whole days since 1970-01-01 (UTC). Rejects impossible calendar dates. */
export function isoToDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) throw new InputError(`not an ISO date (YYYY-MM-DD): ${JSON.stringify(iso)}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  if (d.getUTCFullYear() !== Number(m[1]) || d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) {
    throw new InputError(`not a real calendar date: ${iso}`);
  }
  return Math.round(t / MS_PER_DAY);
}

/** whole days since 1970-01-01 -> 'YYYY-MM-DD'. */
export function dayToIso(day) {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Difference in months between two day numbers, using a stated days-per-month constant. */
export function monthsBetween(dayEarlier, dayLater, daysPerMonth) {
  return (dayLater - dayEarlier) / daysPerMonth;
}

function requireInt(name, value, { min }) {
  if (!Number.isInteger(value) || value < min) {
    throw new InputError(`${name} must be a whole number >= ${min} (got ${JSON.stringify(value)})`);
  }
}

const round4 = (x) => Math.round(x * 10000) / 10000;

/**
 * @param {object} p
 * @param {string} p.asOf            run date, 'YYYY-MM-DD'
 * @param {string} p.eadStart        first day work authorization is valid
 * @param {string} p.authEnd         last day work authorization is valid
 * @param {number} p.daysUsed        unemployment days already used as of the run date
 * @param {number} p.ceiling         unemployment-day ceiling that applies
 * @param {number} p.buffer          days of the ceiling the candidate wants left unused
 * @param {number} p.daysToStart     expected days from applying to a start date
 */
export function timelineFactor({ asOf, eadStart, authEnd, daysUsed, ceiling, buffer, daysToStart }) {
  const asOfD = isoToDay(asOf);
  const eadD = isoToDay(eadStart);
  const endD = isoToDay(authEnd);
  requireInt('unemployment_days_used', daysUsed, { min: 0 });
  requireInt('unemployment_ceiling', ceiling, { min: 1 });
  requireInt('buffer_target', buffer, { min: 0 });
  requireInt('expected_days_to_start', daysToStart, { min: 0 });
  if (eadD > endD) throw new InputError(`ead_start_date (${eadStart}) is after opt_end_date (${authEnd})`);

  const startD = Math.max(asOfD + daysToStart, eadD);
  const clockStartD = Math.max(asOfD, eadD);
  const accrued = Math.max(0, startD - clockStartD);
  const projected = daysUsed + accrued;
  const slack = ceiling - projected;

  let factor;
  let reason;
  if (asOfD > endD) {
    factor = 0;
    reason = 'authorization-already-ended';
  } else if (startD > endD) {
    factor = 0;
    reason = 'start-after-authorization-end';
  } else if (slack <= 0) {
    factor = 0;
    reason = 'unemployment-ceiling-reached';
  } else if (buffer === 0 || slack >= buffer) {
    factor = 1;
    reason = 'open';
  } else {
    factor = round4(slack / buffer);
    reason = 'buffer-partly-used';
  }

  return {
    factor,
    reason,
    label: 'your-input',
    dates: {
      as_of: asOf,
      ead_start: eadStart,
      clock_start: dayToIso(clockStartD),
      expected_start: dayToIso(startD),
      authorization_end: authEnd,
    },
    days: {
      used: daysUsed,
      accrued_until_start: accrued,
      projected_at_start: projected,
      ceiling,
      slack,
      buffer,
    },
    note: 'Planning multiplier, not legal advice. Unemployment ceilings and STEM eligibility are for the school\'s international office to confirm.',
  };
}
