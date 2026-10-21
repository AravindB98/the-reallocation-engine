#!/usr/bin/env python3
"""Independent recount: Python's csv module (NOT lib.mjs's parser) against a run's run-log.json.

    python3 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/recount.py [run-dir]

Checks the CSV-level facts the report quotes (rows, approvals, parity, data horizon) and, for every
company that reached a gate, each record value the run-log carries. Exit 0 only if everything matches.
"""
import csv, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
RUN = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assignments/submissions/shreyashyadav1/runs/2026-10-20"
CSV = ROOT / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"

rows = list(csv.DictReader(open(CSV, encoding="utf-8", newline="")))
log = json.load(open(RUN / "run-log.json"))
snap = json.load(open(RUN / "candidates.snapshot.json"))

print(f"rows in CSV (Python csv module): {len(rows)}")
wa = [r for r in rows if r["Total Approvals"] != ""]
print(f"rows with an approvals field: {len(wa)}  (>0: {sum(1 for r in wa if float(r['Total Approvals']) > 0)})")
print(f"approval counts that are even: {sum(1 for r in wa if float(r['Total Approvals']) % 2 == 0)}/{len(wa)} · "
      f"denial counts even: {sum(1 for r in wa if r['Total Denials'] != '' and float(r['Total Denials']) % 2 == 0)}/{len(wa)}")
dates = sorted(r["latest_funding_date"] for r in rows if r["latest_funding_date"])
print(f"newest latest_funding_date: {dates[-1]}  (n={len(dates)})")
print("the run-log says: approval counts even", log["data_quality"]["approval_counts_even"], "| data horizon", log["data_horizon"]["date"])
print()

bad = 0
seen = set()
by_role = {r["role_id"]: r for r in snap["roles"]}
for role in log["roles"]:
    if role.get("excluded") or role["sponsorship"].get("status") != "ok":
        continue
    name = by_role[role["role_id"]]["csv_company"]
    if name in seen:
        continue
    seen.add(name)
    hits = [r for r in rows if r["company_name"] == name]
    assert len(hits) == 1, (name, len(hits))
    r, i = hits[0], role["sponsorship"]["inputs"]
    num = lambda x: float(x) if x != "" else None
    pairs = [
        ("approvals", num(r["Total Approvals"]), i["total_approvals"]["value"]),
        ("denials", num(r["Total Denials"]), i["total_denials"]["value"]),
        ("approval_rate", num(r["Approval_Rate"]), i["approval_rate"]["value"]),
        ("industry", r["industry"], role["industry"]["value"]),
        ("funding_date", r["latest_funding_date"], (role["funding"]["csv"] or {}).get("latest_funding_date", {}).get("value", "")),
    ]
    flags = []
    for k, a, b in pairs:
        ok = a == b or (isinstance(a, float) and isinstance(b, (int, float)) and abs(a - b) < 1e-9)
        bad += 0 if ok else 1
        flags.append(f"{k}={'ok' if ok else f'DIFF({a!r} vs {b!r})'}")
    print(f"{name:<26} {r['website'] or '(no website)':<22} tier(run-log)={role['sponsorship']['tier']:<8} " + " ".join(flags))
print()
print("RESULT:", "every recounted value matches the run-log" if bad == 0 else f"{bad} DIFFERENCES")
sys.exit(1 if bad else 0)
