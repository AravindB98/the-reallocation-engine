#!/usr/bin/env python3
"""Verification harness for seniority-gate.py (synthetic postings; no network).

  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.test.py
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("sg", Path(__file__).with_name("seniority-gate.py"))
sg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sg)

passed = failed = 0


def case(name, text, overall, min_years=None):
    global passed, failed
    rep = sg.analyse(text)
    exp = [c for c in rep["checks"] if c["check"] == "experience"][0]
    got_years = None
    if exp["snippets"]:
        import re
        m = re.search(r"minimum = ([\d.]+)", exp["detail"])
        got_years = float(m.group(1)) if m else None
    ok = rep["overall"] == overall and (min_years is None or got_years == min_years)
    passed += ok
    failed += not ok
    print(("  ✓ " if ok else "  ✗ ") + name + ("" if ok else f"  got overall={rep['overall']} years={got_years}, expected {overall} years={min_years}"))


print("seniority-gate verification harness\n")
case("'5+ years of experience' is read as 5 and flagged",
     "Data Analyst\nYou have 5+ years of experience in analytics.", "flag", 5.0)
case("'36 months of experience' is read as 3 years and flagged (the Data Scientist II posting)",
     "Data Scientist II\nMust have a Master's degree and 36 months of experience as Analyst.", "flag", 3.0)
case("'three (3) years of experience' is read through the parenthesis",
     "Analyst\nMust possess three (3) years of experience in the following skills:", "flag", 3.0)
case("a range uses its LOWER bound: '2-4 years of experience' -> 2, pass",
     "Analyst\nWe want 2-4 years of experience with SQL.", "pass", 2.0)
case("'0-2 years of experience' -> 0, pass (entry-friendly wording)",
     "Junior Analyst\n0-2 years of experience preferred.", "pass", 0.0)
case("'3 to 5 years of experience' -> 3, flag",
     "Analyst\nThe role needs 3 to 5 years of experience.", "flag", 3.0)
case("the highest minimum wins when several are stated",
     "Analyst\n3 years of experience with SQL. 1 year of experience with Python.", "flag", 3.0)
case("BREAK: a number of years NOT near the word 'experience' is ignored ('founded 10 years ago')",
     "Analyst\nThe company was founded 10 years ago and loves its culture.", "no_statement")
case("BREAK: 'experience' too far from the number does not count",
     "Analyst\nWe have 6 years of growth. " + "x " * 60 + "Experience with SQL is helpful.", "no_statement")
case("BREAK: title without 'Senior' but body says 'Senior <title>' is flagged (the Klaviyo pattern)",
     "Analytics Engineer\nWe're looking for a Senior Analytics Engineer to own pipelines.", "flag")
case("a senior marker in the title itself is flagged",
     "Senior Business Analyst\nYou will build reports.", "flag")
case("'II' alone is NOT treated as a senior marker (that is the trap: the gate must read the body)",
     "Data Analyst II\nYou will build reports.", "no_statement")
case("no experience statement and no senior wording is no_statement, never pass",
     "Business Analyst\nYou will build reports and talk to stakeholders.", "no_statement")
rep =sg.analyse("Analyst\n3 years of experience.", flag_years=4.0)
ok = rep["overall"] == "pass"
passed += ok
failed += not ok
print(("  ✓ " if ok else "  ✗ ") + "the threshold is a parameter: 3 years passes when --flag-years is 4")

try:
    sg.analyse("\nbody only")
    ok = False
except ValueError:
    ok = True
passed += ok
failed += not ok
print(("  ✓ " if ok else "  ✗ ") + "BREAK: input with no title line is rejected, not guessed")

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
