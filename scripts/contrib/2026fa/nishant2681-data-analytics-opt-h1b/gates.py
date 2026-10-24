"""gates.py — piece 2 of the nishant2681-data-analytics-opt-h1b prototype.

The two hard gates: posting liveness and the OPT unemployment clock.
Rules come from course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md §3 and
recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md. A missing or
malformed input raises an error; nothing is defaulted except the documented
12-week hiring lag, and its use is recorded.

The scorer treats a missing gate as 1 (scripts/score/role-scorer.mjs:83-84),
so every gate problem must stop here, before scoring.

Standard library + PyYAML only. Never reads the system clock.
"""

import datetime
import os

import yaml

# Liveness label → gate factor, from CHANGE-BRIEF.md §3 [VERIFY].
LIVENESS_FACTORS = {"active": 1.0, "uncertain": 0.5, "expired": 0.0}

# Timeline constants, from CHANGE-BRIEF.md §3 [VERIFY].
DEFAULT_HIRING_LAG_WEEKS = 12  # from Ch.10's Role C example
FULL_CREDIT_MARGIN_DAYS = 30


# Raised when a profile is missing a field or has a value we cannot read.
class ProfileError(ValueError):
    pass


# Raised when a gate input is missing or not one of the allowed values.
class GateError(ValueError):
    pass


# Check a value is a whole number at or above a minimum. Booleans are
# rejected, because Python would otherwise count True as 1.
def _whole_number(value, field, minimum, error=ProfileError):
    if isinstance(value, bool) or not isinstance(value, int):
        raise error(f"{field} must be a whole number, got {value!r}")
    if value < minimum:
        raise error(f"{field} must be >= {minimum}, got {value}")
    return value


# Turn a YAML value into a calendar date. YAML already gives a date for
# 2027-01-31; a quoted "2027-01-31" string is also accepted. Anything else
# (including a date with a time of day) is an error.
def _calendar_date(value, field):
    if isinstance(value, datetime.datetime):
        raise ProfileError(f"{field} must be a date without a time, got {value!r}")
    if isinstance(value, datetime.date):
        return value
    if isinstance(value, str):
        try:
            return datetime.date.fromisoformat(value)
        except ValueError:
            pass
    raise ProfileError(f"{field} is not a YYYY-MM-DD date: {value!r}")


# Read the persona profile and return only the visa fields the timeline
# gate needs. A missing field is an error; opt_end_date may be null (= unknown).
def load_profile(path):
    with open(path, encoding="utf-8") as fh:
        profile = yaml.safe_load(fh)
    visa = profile.get("visa") if isinstance(profile, dict) else None
    if not isinstance(visa, dict):
        raise ProfileError(f"{path}: missing the visa section")
    for field in ("unemployment_days_used", "unemployment_ceiling", "opt_end_date"):
        if field not in visa:
            raise ProfileError(f"{path}: missing required field visa.{field}")

    opt_end = visa["opt_end_date"]
    return {
        "unemployment_days_used": _whole_number(visa["unemployment_days_used"], "visa.unemployment_days_used", 0),
        "unemployment_ceiling": _whole_number(visa["unemployment_ceiling"], "visa.unemployment_ceiling", 1),
        "opt_end_date": None if opt_end is None else _calendar_date(opt_end, "visa.opt_end_date"),
        "opt_end_known": opt_end is not None,
    }


# Turn a liveness label into the gate factor. The source is "record" only
# when a saved liveness-check output actually exists on disk.
def liveness_factor(label, evidence_path=None):
    if label is None:
        raise GateError("liveness label is missing; the scorer would treat a missing gate as 1")
    if label not in LIVENESS_FACTORS:
        raise GateError(f"liveness label {label!r} is not one of {sorted(LIVENESS_FACTORS)}")

    evidence_found = evidence_path is not None and os.path.isfile(evidence_path)
    return {
        "label": label,
        "factor": LIVENESS_FACTORS[label],
        "source": "record" if evidence_found else "your-input (fixture)",
        "evidence_path": evidence_path,
        "evidence_found": evidence_found,
    }


# Work out the expected start date from today and the hiring lag in weeks.
# The lag must be a whole number: date arithmetic silently drops part-days.
def _expected_start(today, hiring_lag_weeks):
    default_used = hiring_lag_weeks is None
    lag = DEFAULT_HIRING_LAG_WEEKS if default_used else hiring_lag_weeks
    _whole_number(lag, "hiring_lag_weeks", 0, error=GateError)
    return today + datetime.timedelta(days=lag * 7), lag, default_used


# Score where the expected start lands: full credit if 30+ days before the
# deadline, zero after the deadline, and a straight line in between.
def _factor_for(expected_start, deadline):
    cutoff = deadline - datetime.timedelta(days=FULL_CREDIT_MARGIN_DAYS)
    if expected_start <= cutoff:
        return 1.0, "starts 30+ days before the deadline"
    if expected_start > deadline:
        return 0.0, "starts after the deadline"
    return (deadline - expected_start).days / FULL_CREDIT_MARGIN_DAYS, "starts within 30 days of the deadline"


# Compute the timeline gate factor for one role, and return every date and
# number that produced it so a human can check the arithmetic.
def timeline_factor(profile_visa, today, hiring_lag_weeks=None):
    if isinstance(today, datetime.datetime) or not isinstance(today, datetime.date):
        raise GateError(f"today must be a date passed in by the caller, got {today!r}")
    for field in ("unemployment_days_used", "unemployment_ceiling", "opt_end_date"):
        if field not in profile_visa:
            raise ProfileError(f"missing required field visa.{field}")

    days_used = profile_visa["unemployment_days_used"]
    ceiling = profile_visa["unemployment_ceiling"]
    opt_end = profile_visa["opt_end_date"]
    remaining_days = ceiling - days_used
    deadline = today + datetime.timedelta(days=remaining_days)
    if opt_end is not None:
        deadline = min(deadline, opt_end)
    expected_start, lag, default_used = _expected_start(today, hiring_lag_weeks)

    reasons = []
    if remaining_days <= 0:
        reasons.append("no-unemployment-days-left")
    if opt_end is not None and opt_end < today:
        reasons.append("opt-ended")
    if reasons:
        factor = 0.0
    else:
        factor, why = _factor_for(expected_start, deadline)
        reasons.append(why)

    return {
        "factor": factor, "source": "your-input", "reasons": reasons,
        "today": today, "unemployment_days_used": days_used, "unemployment_ceiling": ceiling,
        "remaining_days": remaining_days, "opt_end_date": opt_end, "opt_end_known": opt_end is not None,
        "deadline": deadline,
        "full_credit_cutoff": deadline - datetime.timedelta(days=FULL_CREDIT_MARGIN_DAYS),
        "hiring_lag_weeks": lag, "default_used": default_used, "expected_start": expected_start,
    }
