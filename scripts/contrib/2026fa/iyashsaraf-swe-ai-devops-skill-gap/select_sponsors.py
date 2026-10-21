#!/usr/bin/env python3
"""select_sponsors.py — which companies to fetch postings from.

Reads the repo's 80-Days-to-Stay CSV and keeps companies with at least one H-1B
approval whose sponsored job titles include a software, AI or DevOps title (any
industry). Writes run/sponsors.json (every kept company, labeled) and
run/sponsors.txt (the top N by approvals, one name per line, for the fetch step).

Usage:
  python3 select_sponsors.py [--csv PATH] [--top 40] --out-dir DIR
"""
import argparse
import csv
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from families import family_of  # noqa: E402

DEFAULT_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"


def num(value):
    try:
        return float(value) if value not in (None, "") else 0.0
    except ValueError:
        return 0.0


def sponsored_titles(field):
    titles = [a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", field or "")]
    return titles or ([field] if field else [])


def select(csv_path):
    if not os.path.exists(csv_path):
        print(f"ERROR: source CSV not found: {csv_path}", file=sys.stderr)
        sys.exit(2)
    kept, counts = [], {"rows_read": 0, "no_approvals": 0, "no_target_title": 0, "kept": 0}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            counts["rows_read"] += 1
            approvals = num(row.get("Total Approvals"))
            if approvals <= 0:
                counts["no_approvals"] += 1
                continue
            matched = {}
            for title in sponsored_titles(row.get("top_job_titles_sponsored", "")):
                fam = family_of(title)
                if fam:
                    matched.setdefault(fam, []).append(title)
            if not matched:
                counts["no_target_title"] += 1
                continue
            kept.append({
                "company": row["company_name"],
                "industry": row.get("industry"),
                "approvals": approvals, "denials": num(row.get("Total Denials")),
                "approval_rate": num(row.get("Approval_Rate")),
                "sponsorship_source": "record",
                "sponsored_titles_by_family": matched,
                "family_source": "model-judgment",
            })
            counts["kept"] += 1
    kept.sort(key=lambda c: (-c["approvals"], c["company"]))
    return kept, counts


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", default=DEFAULT_CSV)
    ap.add_argument("--top", type=int, default=40, help="how many companies to fetch postings for (your-input)")
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()
    kept, counts = select(args.csv)
    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, "sponsors.json"), "w", encoding="utf-8") as f:
        json.dump({"source_csv": args.csv, "counts": counts, "top_n_fetched": args.top, "companies": kept}, f, indent=2)
    with open(os.path.join(args.out_dir, "sponsors.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(c["company"] for c in kept[: args.top]) + "\n")
    for key, value in counts.items():
        print(f"{key}={value}")
    print(f"wrote {args.out_dir}/sponsors.json and sponsors.txt (top {min(args.top, len(kept))} by approvals)")


if __name__ == "__main__":
    main()
