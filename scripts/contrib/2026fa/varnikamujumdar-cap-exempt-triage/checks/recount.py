#!/usr/bin/env python3
"""Independent recounts for the worked run — separate code from cap_exempt_triage.py.

Reads the source files directly (csv module only, except the shared repo name
normalizer, which is imported for the two overlap measures exactly as the
mode uses it). Run from the repository root:
  python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/recount.py
"""
import csv
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

RUN = Path("course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21")
EXT = Path("scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts")
EIGHTY = Path("data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv")

spec = importlib.util.spec_from_file_location("er", "scripts/sec/entity-resolution.py")
er = importlib.util.module_from_spec(spec)
spec.loader.exec_module(er)
norm = er.normalize_company_name


def num(v):
    try:
        return float(str(v).replace(",", ""))
    except ValueError:
        return None


R = list(csv.DictReader(open(EIGHTY, encoding="utf-8", errors="replace")))
appr = [num(r["Total Approvals"]) for r in R]
pat = re.compile(r"\b(university|college|institute of technology|school of medicine|research (institute|foundation|center)|medical center|hospital|foundation)\b", re.I)
hits = [r for r in R if pat.search(r["company_name"])]
print("## 80 Days")
print(f"rows {len(R)} | approvals>0 {sum(1 for a in appr if a and a > 0)} | blank {sum(1 for a in appr if a is None)} "
      f"| sounding names {len(hits)} (approvals>0 {sum(1 for r in hits if (num(r['Total Approvals']) or 0) > 0)}, "
      f"funding stage {sum(1 for r in hits if r['latest_funding_stage'].strip())})")

I = list(csv.DictReader(open(EXT / "ipeds_hd2024.csv")))
U = list(csv.DictReader(open(EXT / "uscis_h1b_hub_fy2023.csv", encoding="utf-8-sig")))
c = Counter(r["CONTROL"] for r in I)
print("## IPEDS extract")
print(f"rows {len(I)} | control 1/2/3/other {c['1']}/{c['2']}/{c['3']}/{len(I) - c['1'] - c['2'] - c['3']}")
print("## USCIS extract")
e = [r for r in U if r["NAICS"] == "61"]
print(f"rows {len(U)} | NAICS 61 rows {len(e)} | NAICS 61 initial {sum(int(r['Initial Approval'] or 0) for r in e)} "
      f"continuing {sum(int(r['Continuing Approval'] or 0) for r in e)}")
for name in ["NORTHEASTERN UNIVERSITY", "FRED HUTCHINSON CANCER CENTER", "THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE",
             "TOYOTA RESEARCH INSTITUTE INC", "HOWARD HUGHES MEDICAL INSTITUTE HHMI"]:
    rows = [r for r in U if r["Employer"] == name]
    parts = " + ".join(f"{r['State'] or 'blank'} {r['Initial Approval']}/{r['Continuing Approval']}" for r in rows)
    print(f"  {name}: {parts} = {sum(int(r['Initial Approval']) for r in rows)}/{sum(int(r['Continuing Approval']) for r in rows)}")

print("## Overlap and coverage (exact normalized names)")
open_pn = [r for r in I if r["CONTROL"] in ("1", "2") and r["CLOSEDAT"] == "-2"]
eighty = {norm(r["company_name"]) for r in R}
usc = {norm(r["Employer"]) for r in U}
ipn = {norm(r["INSTNM"]) for r in I}
print(f"open public+nonprofit IPEDS institutions {len(open_pn)} | in 80 Days {sum(1 for r in open_pn if norm(r['INSTNM']) in eighty)} "
      f"| in USCIS {sum(1 for r in open_pn if norm(r['INSTNM']) in usc)} "
      f"({100 * sum(1 for r in open_pn if norm(r['INSTNM']) in usc) / len(open_pn):.1f}%)")
print(f"80 Days sounding names that are IPEDS institutions: {sum(1 for r in hits if norm(r['company_name']) in ipn)}")

print("## Final run.json (parsed)")
L = json.load(open(RUN / "run.json"))
rows = L["rows"]
print("statuses", dict(Counter(r["cap_exempt_status"] for r in rows)))
print("outcomes", dict(Counter(r["outcome"].split(" — ")[0] for r in rows)))
print("unchecked rows not HELD:", [r["id"] for r in rows if r["liveness"]["result"] == "unchecked" and not r["outcome"].startswith("HELD")])
print("G4:", L["gates"]["G4 human"]["cleared"], L["gates"]["G4 human"]["counts"])
print("summary", L["summary"])
