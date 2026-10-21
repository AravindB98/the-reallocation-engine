#!/usr/bin/env python3
"""split_families.py — sort fetched postings into the three role families.

Keeps a posting only if it has description text and at least one US location,
then assigns it to software engineer, AI engineer or DevOps/SRE by title (see
families.py). A posting whose company and description repeat an earlier kept
posting word for word (the same job listed again for another city or level) is
dropped as a duplicate, so one job is counted once. Raw postings stay in --private-dir (never commit scraped postings);
only counts go to the tracked --summary file.

Usage:
  python3 split_families.py --postings private/.../postings.json --private-dir private/... --summary run/families-summary.json
"""
import argparse
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from families import FAMILIES, family_of, is_senior, is_us  # noqa: E402


def split(postings):
    by_family = {fam: [] for fam in FAMILIES}
    counts = {"ingested": len(postings), "no_description": 0, "not_us": 0, "no_family_match": 0, "duplicate": 0}
    seen = set()
    for p in postings:
        if not (p.get("description_text") or "").strip():
            counts["no_description"] += 1
            continue
        if not is_us(str(p.get("location") or "")):
            counts["not_us"] += 1
            continue
        fam = family_of(p.get("title", ""))
        if not fam:
            counts["no_family_match"] += 1
            continue
        key = (p.get("company_name"), p["description_text"].strip())
        if key in seen:
            counts["duplicate"] += 1
            continue
        seen.add(key)
        by_family[fam].append(p)
    return by_family, counts


def summarize(by_family, counts):
    out = {"counts": counts, "families": {}, "rules": "families.py (your-input); family assignment is a model-judgment"}
    for fam, items in by_family.items():
        companies = collections.Counter(p["company_name"] for p in items)
        out["families"][fam] = {
            "postings": len(items),
            "non_senior_postings": sum(1 for p in items if not is_senior(p.get("title", ""))),
            "companies": len(companies),
            "postings_by_company": dict(companies.most_common()),
        }
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--postings", required=True)
    ap.add_argument("--private-dir", required=True)
    ap.add_argument("--summary", required=True)
    args = ap.parse_args()
    if not os.path.exists(args.postings):
        print(f"ERROR: postings file not found: {args.postings}", file=sys.stderr)
        sys.exit(2)
    data = json.load(open(args.postings, encoding="utf-8"))
    postings = data["postings"] if isinstance(data, dict) else data
    by_family, counts = split(postings)
    os.makedirs(args.private_dir, exist_ok=True)
    for fam, items in by_family.items():
        with open(os.path.join(args.private_dir, f"family-{fam}.json"), "w", encoding="utf-8") as f:
            json.dump({"postings": items}, f)
    summary = summarize(by_family, counts)
    os.makedirs(os.path.dirname(args.summary) or ".", exist_ok=True)
    with open(args.summary, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    for key, value in counts.items():
        print(f"{key}={value}")
    for fam in FAMILIES:
        s = summary["families"][fam]
        print(f"family {fam}: {s['postings']} postings ({s['non_senior_postings']} non-senior) from {s['companies']} companies")


if __name__ == "__main__":
    main()
