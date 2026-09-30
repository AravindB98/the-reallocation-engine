#!/usr/bin/env python3
"""
build_roles_json.py -- builds a labeled roles.json entry for the
ghost-job-radar recipe, shaped for the EXISTING scorer
(scripts/score/role-scorer.mjs). This script does not re-implement any
scoring logic; it only assembles labeled evidence.

IMPORTANT LIMITATION (stated here, not hidden): the existing scorer reads
exactly four evidence terms -- sponsorship, fit, liveness, timeline. It has
no dedicated "funding" field, even though the assignment's evidence table
lists funding as its own vote. This script pulls real funding data
(total_funding, latest_funding_stage, latest_funding_date) from the same
CSV and reports it as `funding_context` in the output JSON, clearly
labeled -- but does NOT invent a 5th scorer field the tool doesn't
support. A human reading the report sees the funding context alongside
the score, even though the number itself isn't part of the composite.

Liveness and the CPT/program-timeline check are HARD GATES here, exactly
as they are in the recipe: a non-"live" liveness result or a non-"pass"
timeline result forces liveness/timeline factors to 0.0, which zeroes the
scorer's composite regardless of sponsorship or fit -- matching how the
existing scorer already treats its own liveness gate (see the
"ghost-posting" example row in data/examples/ch11-roles.json).

Usage:
    python3 build_roles_json.py \\
        --company "Example Inc" \\
        --title "Data Analyst" \\
        --role-id example-inc-data-analyst \\
        --liveness-result live \\
        --timeline-result pass \\
        --out course/2026fa/submissions/dmehta1310/runs/roles.json
"""

import argparse
import csv
import json
import sys

DEFAULT_CSV_PATH = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"


def _normalize(name):
    return "".join(ch for ch in name.lower() if ch.isalnum())


def _parse_rate(raw):
    """Approval_Rate may arrive as '75%', '0.75', or '75'. Normalize to 0-1."""
    if raw is None or raw == "":
        return 0.0
    cleaned = raw.strip().rstrip("%")
    try:
        value = float(cleaned)
    except ValueError:
        return 0.0
    return value / 100.0 if value > 1.0 else value


def find_company_row(csv_path, company_name):
    """
    Look up a company by (loosely normalized) exact name match. Returns the
    raw CSV row dict, or None if no match is found in this sample.

    No fuzzy matching: a near-miss should be flagged by the human, per the
    recipe's Source Inventory human-check note, not silently guessed.
    """
    target = _normalize(company_name)
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if _normalize(row.get("company_name", "")) == target:
                return row
    return None


def sponsorship_from_row(row):
    """
    Returns (p, tier, source) for the sponsorship evidence term.
    'row' is None when the company has no record in this sample --
    absence is labeled 'NoRecordInSample', never treated as a confirmed
    'will not sponsor'.
    """
    if row is None:
        return 0.0, "NoRecordInSample", "record"

    try:
        total_approvals = int(float(row.get("Total Approvals", 0) or 0))
    except ValueError:
        total_approvals = 0
    approval_rate = _parse_rate(row.get("Approval_Rate"))

    if total_approvals >= 1 and approval_rate >= 0.7:
        return 0.9, "Proven", "record"
    if total_approvals >= 1:
        return 0.6, "Likely", "record"
    return 0.0, "None", "record"


def funding_context_from_row(row):
    """
    Returns a small labeled dict describing funding context. This is
    reported for the human, not fed into the scorer as its own term (see
    module docstring).
    """
    if row is None:
        return {
            "total_funding": None,
            "latest_funding_stage": None,
            "latest_funding_date": None,
            "note": "No record in sample data for this company.",
            "source": "record",
        }
    return {
        "total_funding": row.get("total_funding") or None,
        "latest_funding_stage": row.get("latest_funding_stage") or None,
        "latest_funding_date": row.get("latest_funding_date") or None,
        "note": "From the 80-days-to-stay mapped sample CSV.",
        "source": "record",
    }


def build_role_entry(
    role_id,
    company,
    title,
    csv_path,
    liveness_result,
    timeline_result,
    fit_p=0.7,
):
    row = find_company_row(csv_path, company)
    sponsorship_p, sponsorship_tier, sponsorship_source = sponsorship_from_row(row)
    funding_context = funding_context_from_row(row)

    liveness_factor = 1.0 if liveness_result == "live" else 0.0
    timeline_factor = 1.0 if timeline_result == "pass" else 0.0

    entry = {
        "role_id": role_id,
        "company": company,
        "title": title,
        "sponsorship": {
            "p": sponsorship_p,
            "tier": sponsorship_tier,
            "source": sponsorship_source,
        },
        "fit": {"p": fit_p, "source": "model-judgment"},
        "liveness": {"factor": liveness_factor, "source": "record"},
        "timeline": {"factor": timeline_factor, "source": "record"},
        "funding_context": funding_context,
        "company_found_in_sample": row is not None,
    }
    return entry


def main():
    parser = argparse.ArgumentParser(
        description="Build a labeled roles.json entry for ghost-job-radar."
    )
    parser.add_argument("--company", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--role-id", required=True)
    parser.add_argument(
        "--liveness-result",
        required=True,
        choices=["live", "dead", "unknown"],
        help="Result from npm run ats:liveness for this posting.",
    )
    parser.add_argument(
        "--timeline-result",
        required=True,
        choices=["pass", "fail"],
        help="Result from timeline_gate.py for this student/company.",
    )
    parser.add_argument(
        "--fit",
        type=float,
        default=0.7,
        help="Model-judgment fit score, 0-1 (default 0.7).",
    )
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH)
    parser.add_argument(
        "--out",
        required=True,
        help="Path to write the roles.json list (will contain one entry).",
    )
    args = parser.parse_args()

    try:
        entry = build_role_entry(
            role_id=args.role_id,
            company=args.company,
            title=args.title,
            csv_path=args.csv,
            liveness_result=args.liveness_result,
            timeline_result=args.timeline_result,
            fit_p=args.fit,
        )
    except FileNotFoundError:
        print(
            json.dumps(
                {"error": f"CSV not found at {args.csv} -- check the path exists"}
            )
        )
        sys.exit(1)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump([entry], f, indent=2)

    print(json.dumps(entry, indent=2))
    if not entry["company_found_in_sample"]:
        print(
            f"\nWARNING: '{args.company}' has no record in the sample CSV. "
            "Sponsorship is reported as NoRecordInSample, not as a denial.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
