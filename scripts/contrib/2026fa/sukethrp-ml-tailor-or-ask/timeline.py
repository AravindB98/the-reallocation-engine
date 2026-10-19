"""timeline.py — the visa-timeline factor, computed from declared dates (book chapter 10).

New in v0.2.0; it closes the recipe's proposal 8. Chapter 10 defines the factor from the person's dates and the
expected time to start for the role, and says the output is "always the factor *and* the dates that produced it".
The engine never implemented it, so a person had to type a factor or leave the posting on hold.

Inputs:
  the persona's visa block: ead_start_date, unemployment_ceiling, unemployment_days_used, unemployment_days_as_of,
  buffer_target, and opt_end_date when known;
  the run date;
  the expected time to start, in weeks, declared by a person for the company, with a reason.

The dates (all shown in the result):
  clock start     the EAD start while it is still ahead; otherwise the run date
  days left       the ceiling minus the days used. On OPT, the clock is assumed to keep running from
                  unemployment_days_as_of to the run date (conservative: chapter 10 says err conservative)
  latest start    clock start + days left, never after the OPT end
  target start    latest start - the buffer
  expected start  the later of run date + the declared weeks and the EAD start (no start before authorization)

The factor (the formula in rules.json `timeline`, adopted by the person):
  1.0 when the expected start is on or before the target start;
  0   when it is after the latest start, or no days are left (skip regardless, chapter 10);
  linear from 1 to 0 between the target and the latest start, rounded to 2 decimals.

It is a planning multiplier, not legal advice and not a hiring forecast. Eligibility (OPT, STEM OPT, cap-gap) is a
question for the school's DSO or an attorney.
"""
from __future__ import annotations

import datetime as dt

REQUIRED = ("ead_start_date", "unemployment_ceiling", "unemployment_days_used", "unemployment_days_as_of",
            "buffer_target")


def day(value) -> dt.date:
    """A date from YAML: a date, 'YYYY-MM-DD', or the ISO timestamp the engine's YAML bridge emits for a date."""
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    return dt.date.fromisoformat(str(value)[:10])


def compute(visa: dict, as_of: dt.date, weeks: float) -> dict:
    """{result: pass, factor, dates, days_left, why} or {result: unresolved, code: timeline-dates-missing, missing}."""
    visa = visa or {}
    missing = [k for k in REQUIRED if visa.get(k) in (None, "")]
    for k in ("ead_start_date", "unemployment_days_as_of", "opt_end_date"):
        if k not in missing and visa.get(k) not in (None, ""):
            try:
                day(visa[k])
            except ValueError:
                missing.append(f"{k} (unreadable: {visa[k]!r})")
    for k in ("unemployment_ceiling", "unemployment_days_used", "buffer_target"):
        if k not in missing and (isinstance(visa[k], bool) or not str(visa[k]).strip().isdigit()):
            missing.append(f"{k} (not a whole number: {visa[k]!r})")
    if missing:
        return {"result": "unresolved", "code": "timeline-dates-missing", "missing": missing}
    ead, used_as_of = day(visa["ead_start_date"]), day(visa["unemployment_days_as_of"])
    used, ceiling, buffer = int(visa["unemployment_days_used"]), int(visa["unemployment_ceiling"]), int(visa["buffer_target"])
    opt_end = day(visa["opt_end_date"]) if visa.get("opt_end_date") else None

    if as_of < ead:
        clock_start, used_now = ead, used
    else:
        clock_start = as_of
        used_now = used + max(0, (as_of - max(used_as_of, ead)).days)
    days_left = ceiling - used_now
    latest = clock_start + dt.timedelta(days=max(days_left, 0))
    if opt_end and latest > opt_end:
        latest = opt_end
    target = latest - dt.timedelta(days=buffer)
    expected = max(as_of + dt.timedelta(weeks=weeks), ead)

    if days_left <= 0 or expected > latest:
        factor, why = 0.0, "the expected start is after the latest start: skip regardless"
    elif expected <= target:
        factor, why = 1.0, "the expected start is inside the buffer: no timeline objection"
    else:
        factor = round((latest - expected).days / max((latest - target).days, 1), 2)
        why = "the expected start eats into the buffer: scaled between the target and the latest start"
    return {"result": "pass", "factor": factor, "why": why, "days_left": days_left, "weeks": weeks,
            "dates": {"run_date": str(as_of), "ead_start": str(ead), "clock_start": str(clock_start),
                      "latest_start": str(latest), "target_start": str(target), "expected_start": str(expected),
                      "opt_end": str(opt_end) if opt_end else None}}
