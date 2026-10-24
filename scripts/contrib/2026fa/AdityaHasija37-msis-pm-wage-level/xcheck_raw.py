#!/usr/bin/env python3
"""Independent cross-check (needs raw/ from fetch-oflc.sh). Usage: xcheck_raw.py <this dir>

Re-derives, from the RAW OFLC ALC_Export.csv (not the committed extract) and without importing
wage_level.py, every leveled row's four annual level wages, level met, lottery entries and gap
to the next level, then compares them with out/run-log.json. Also cross-checks the 80 Days counts.
"""
import csv
import json
import sys

C = sys.argv[1]
raw = {(r["Area"], r["SocCode"]): r for r in csv.DictReader(open(f"{C}/raw/2026-27/ALC_Export.csv"))}
log = json.load(open(f"{C}/out/run-log.json"))
names = {x["id"]: x["company_80days"] for x in json.load(open(f"{C}/fixtures/scenarios.2026-10-21.json"))["scenarios"]}
ENTRIES = {"I": 1, "II": 2, "III": 3, "IV": 4}

checked = mism = refused_ok = 0
for s in log["scenarios"]:
    for row in s["rows"]:
        r = raw[(s["worksite"]["oflc_area"], row["soc"])]
        if r["Label"] in ("High Wage", "No Leveled Wage") or not r["Level1"]:
            refused_ok += row["level"] is None
            continue
        factor = 1 if r["Label"] == "Annual Wage" else 2080
        wages = [round(float(r[f"Level{i}"]) * factor, 2) for i in range(1, 5)]
        level, gap = "below-I", None
        for name, w in zip(["I", "II", "III", "IV"], wages):
            if row["salary"] >= w:
                level = name
        for name, w in zip(["I", "II", "III", "IV"], wages):
            if row["salary"] < w:
                gap = round(w - row["salary"], 2)
                break
        got = (list(row["oflc"]["levels"].values()), row["level"], row["entries"],
               row["gap_to_next"]["gap"] if row["gap_to_next"] else None)
        exp = (wages, level, ENTRIES.get(level), gap)
        checked += 1
        if got != exp:
            mism += 1
            print("MISMATCH", s["id"], row["soc"], row["offer_point"], "expected", exp, "got", got)
print(f"raw-OFLC recompute (wages, level, entries, gap): {checked} rows checked, {mism} mismatches; "
      f"refused rows correctly unleveled: {refused_ok}")
eighty = {r["company_name"]: r for r in csv.DictReader(open("data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv",
                                                            encoding="utf-8", errors="replace"))}
for s in log["scenarios"]:
    sp, r = s["sponsorship_80days"], eighty[names[s["id"]]]
    print(f"80 Days {s['id']}: CSV approvals={r['Total Approvals']} denials={r['Total Denials']} → log {sp['approvals']}/{sp['denials']}")
print("selection_probability values:", [s["selection_probability"] for s in log["scenarios"]])
print("summary:", json.dumps(log["summary"]))
sys.exit(1 if mism else 0)
