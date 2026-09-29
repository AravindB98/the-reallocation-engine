#!/usr/bin/env python3
"""
timeline_gate.py -- CPT/program-timeline gate for the ghost-job-radar recipe.

Checks whether a realistic hire could complete before a student's stated
CPT/program end date, given a hiring-lag estimate the student supplies.

This is a HARD GATE, not a vote: if it fails, the calling recipe stops and
reports Skip without computing sponsorship or funding at all.

Every date/estimate here is labeled 'your-input' -- these are the
student's own inputs, not records. This script does arithmetic on them; it
does not verify that the lag estimate is realistic. That judgment belongs
to the human, per the recipe's Phase Gate 2.

Usage:
    python3 timeline_gate.py --end-date 2027-05-15 --lag-weeks 6
    python3 timeline_gate.py --end-date 2026-11-01 --lag-weeks 8 --now 2026-09-29
"""

import argparse
import json
import sys
from datetime import date, datetime, timedelta


class TimelineInputError(ValueError):
    """Raised when the student-supplied inputs can't be parsed at all."""


def _parse_date(label, value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise TimelineInputError(
            f"{label} must be in YYYY-MM-DD format; got {value!r}"
        ) from exc


def evaluate_timeline(end_date_str, lag_weeks, now=None):
    """
    Pure function: no I/O, no network calls. Given a CPT/program end date
    string, a hiring-lag estimate in weeks, and an optional 'now' date
    (for deterministic testing), returns a labeled result dict.

    Raises TimelineInputError on malformed input -- this is the failure
    case the recipe names: "an OPT/CPT date already past" or unparsable.
    """
    if lag_weeks < 0:
        raise TimelineInputError(
            f"lag_weeks must be zero or positive; got {lag_weeks}"
        )

    end_date = _parse_date("end_date", end_date_str)
    today = now if now is not None else date.today()

    projected_hire_date = today + timedelta(weeks=lag_weeks)
    passed = projected_hire_date <= end_date
    days_of_margin = (end_date - projected_hire_date).days

    return {
        "gate": "cpt_program_timeline",
        "result": "pass" if passed else "fail",
        "today": {"value": today.isoformat(), "source": "system-clock"},
        "cpt_program_end_date": {"value": end_date.isoformat(), "source": "your-input"},
        "hiring_lag_weeks": {"value": lag_weeks, "source": "your-input"},
        "projected_hire_date": {
            "value": projected_hire_date.isoformat(),
            "source": "script-computed",
        },
        "days_of_margin": days_of_margin,
        "note": (
            "This gate checks arithmetic compatibility only. It cannot verify "
            "that the hiring-lag estimate is realistic for this company -- "
            "that is a human judgment call per Phase Gate 2 of the recipe."
        ),
    }


def main():
    parser = argparse.ArgumentParser(
        description="CPT/program-timeline hard gate for ghost-job-radar."
    )
    parser.add_argument(
        "--end-date",
        required=True,
        help="CPT authorization or program end date, YYYY-MM-DD (your-input).",
    )
    parser.add_argument(
        "--lag-weeks",
        required=True,
        type=int,
        help="Estimated weeks until a hire could complete (your-input).",
    )
    parser.add_argument(
        "--now",
        default=None,
        help="Override today's date, YYYY-MM-DD. For testing only.",
    )
    args = parser.parse_args()

    try:
        now_override = _parse_date("--now", args.now) if args.now else None
        result = evaluate_timeline(args.end_date, args.lag_weeks, now=now_override)
    except TimelineInputError as exc:
        # Fail clearly. Do not invent a pass/fail value for bad input.
        print(json.dumps({"gate": "cpt_program_timeline", "error": str(exc)}, indent=2))
        sys.exit(1)

    print(json.dumps(result, indent=2))
    sys.exit(0 if result["result"] == "pass" else 0)


if __name__ == "__main__":
    main()
