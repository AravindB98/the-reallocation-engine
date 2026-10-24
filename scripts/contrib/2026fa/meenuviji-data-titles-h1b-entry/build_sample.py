#!/usr/bin/env python3
"""Build the frozen sample once: draw `per_group` companies from each EVIDENCE group in the CSV
(order and seed from rules.json, one random.Random(seed)), give each a fictional entry-level data posting,
then append the fixed failure-case postings. Refuses to overwrite unless --force.

    python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py
"""
import argparse
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[3]
sys.path.insert(0, str(HERE))

from lib import RunFailure, classify, inputs  # noqa: E402

# Fictional entry-level posting titles (your-input), assigned in order to the drawn companies.
POSTING_TITLES = [
    ("Data Analyst I", "Data Analyst"),
    ("Junior Data Engineer", "Data Engineer"),
    ("Associate Data Scientist", "Data Scientist"),
    ("Business Intelligence Analyst", "Business Intelligence Analyst"),
    ("Machine Learning Engineer I", "Machine Learning Engineer"),
    ("Data Analyst", "Data Analyst"),
    ("Data Engineer I", "Data Engineer"),
    ("Associate AI Engineer", "AI Engineer"),
    ("Junior Business Intelligence Analyst", "Business Intelligence Analyst"),
    ("Data Scientist I", "Data Scientist"),
    ("Associate Machine Learning Engineer", "Machine Learning Engineer"),
    ("Junior Data Analyst", "Data Analyst"),
]

FIT = {"p": 0.5, "label": "your-input", "reason": "held constant to isolate the sponsorship signal"}
LIVE = {"factor": 1.0, "label": "your-input", "determined_by": "assumed, not checked"}

# Specific postings added only to exercise CHANGE-BRIEF §8 failure cases in the default run.
FAILURE_CASES = [
    {"company_input": "Quillfeather Data Labs, Inc.", "title": "Data Analyst I", "target_title": "Data Analyst",
     "purpose": "§8 company not in CSV (invented name; checked absent)", "liveness": LIVE},
    {"company_input": "Arcturus Therapeutics", "title": "Associate Data Scientist", "target_title": "Data Scientist",
     "purpose": "§8 normalized name matches more than one row", "liveness": LIVE},
    {"company_input": "CENTIFIC GLOBAL SOLUTIONS INC", "title": "Junior Data Engineer", "target_title": "Data Engineer",
     "purpose": "§8 missing liveness value (field deliberately absent)"},
]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "postings" / "sample-postings.json"))
    ap.add_argument("--force", action="store_true", help="overwrite an existing sample (breaks the freeze)")
    args = ap.parse_args(argv)
    out = Path(args.out)
    if out.exists() and not args.force:
        print(f"✗ {out} exists; the sample is frozen. Use --force only if you mean to redraw it.", file=sys.stderr)
        return 1
    try:
        rules, _ = inputs.load_rules(HERE / "rules.json")
        rows, sha = inputs.load_sponsorship(REPO_ROOT, rules["provenance"])
    except RunFailure as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1

    order = rules["sample"]["evidence_groups"]
    if sorted(order) != sorted(classify.EVIDENCE_GROUPS):
        print(f"✗ rules.json sample.evidence_groups {order} != {list(classify.EVIDENCE_GROUPS)}", file=sys.stderr)
        return 1
    groups = {g: [] for g in order}
    for r in rows:
        groups[classify.evidence_group(classify.evidence(r, rules), rules)].append(r)

    rnd = random.Random(rules["sample"]["seed"])
    per = rules["sample"]["per_group"]
    postings, i = [], 0
    for g in order:
        for r in rnd.sample(groups[g], min(per, len(groups[g]))):
            title, target = POSTING_TITLES[i % len(POSTING_TITLES)]
            i += 1
            postings.append({"posting_id": f"s{i:02d}", "company_input": r["company_name"], "title": title,
                             "target_title": target, "url": f"https://jobs.example.com/s{i:02d}",
                             "evidence_group": g, "purpose": f"seeded draw from evidence group '{g}'",
                             "fit": FIT, "liveness": LIVE})
    for j, fc in enumerate(FAILURE_CASES, 1):
        p = {"posting_id": f"f{j:02d}", "url": f"https://jobs.example.com/f{j:02d}", "fit": FIT}
        p.update(fc)
        postings.append(p)

    doc = {"_meta": {"seed": rules["sample"]["seed"], "per_group": per, "group_order": order,
                     "group_sizes": {k: len(v) for k, v in groups.items()},
                     "csv_sha256": sha, "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                     "note": "Fictional postings; real company names from the CSV. Built by build_sample.py."},
           "postings": postings}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"✓ wrote {len(postings)} postings → {out}  group sizes {doc['_meta']['group_sizes']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
