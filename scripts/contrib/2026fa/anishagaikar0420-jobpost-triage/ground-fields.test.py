#!/usr/bin/env python3
"""Verification harness for ground-fields.py (synthetic posting; no network).

  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.test.py
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("gf", Path(__file__).with_name("ground-fields.py"))
gf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gf)

POSTING = """Analytics Intern
Location: Boston, MA (hybrid)
You will build dashboards in SQL and Python.
Requirements: currently enrolled in a Master’s program.
Compensation: $38.00 to $42.00 per hour."""

passed = failed = 0


def case(name, fields, expect):
    global passed, failed
    rep = gf.run({"posting_text": POSTING, "fields": fields})
    got = {r["field"]: r["verdict"] for r in rep["results"]}
    ok = got == expect
    passed += ok
    failed += not ok
    print(("  ✓ " if ok else "  ✗ ") + name + ("" if ok else f"  got={got} expected={expect}"))


print("ground-fields verification harness\n")
case("exact quote grounds a field",
     {"title": {"value": "Analytics Intern", "quote": "Analytics Intern"}}, {"title": "PASS"})
case("curly-vs-straight apostrophe still grounds (normalized)",
     {"education": {"value": "Master's", "quote": "currently enrolled in a Master's program"}}, {"education": "PASS"})
case("BREAK: invented detail not in posting is rejected (the 'headquartered near Boston' error)",
     {"location": {"value": "Boston, MA", "quote": "Staples is headquartered near Boston"}}, {"location": "FAIL"})
case("BREAK: value with no quote is ungrounded",
     {"skills": {"value": "SQL, Python", "quote": None}}, {"skills": "FAIL"})
case("BREAK: one-word quote is too short to ground anything",
     {"skills": {"value": "SQL", "quote": "SQL"}}, {"skills": "FAIL"})
case("BREAK: number in value that is not in the quote fails",
     {"salary": {"value": "$40-$45 per hour", "quote": "Compensation: $38.00 to $42.00 per hour."}}, {"salary": "FAIL"})
case("'not stated' with no quote passes for a field the posting really omits",
     {"visa": {"value": "not stated", "quote": None}}, {"visa": "PASS"})
case("BREAK: 'not stated' salary fails when a $ figure is in the text (missed value)",
     {"salary": {"value": "not stated", "quote": None}}, {"salary": "FAIL"})
case("BREAK: 'not stated' carrying a quote is contradictory",
     {"visa": {"value": "not stated", "quote": "Analytics Intern"}}, {"visa": "FAIL"})
# KNOWN GAP, asserted so it can never silently become a claim: a real quote on the wrong field passes.
case("KNOWN GAP: real quote attached to the WRONG claim still PASSES (needs a human)",
     {"seniority": {"value": "entry level", "quote": "You will build dashboards in SQL and Python."}}, {"seniority": "PASS"})
# List fields: every item must be inside some quote (closes the gap for lists only).
case("list field: items spread across two quotes all ground",
     {"skills": {"kind": "list", "value": "SQL, Python, Master's",
                 "quote": ["You will build dashboards in SQL and Python.", "currently enrolled in a Master's program"]}},
     {"skills": "PASS"})
case("BREAK: list field with an item that is in no quote fails (the real 'skills' gap)",
     {"skills": {"kind": "list", "value": "SQL, Tableau", "quote": "You will build dashboards in SQL and Python."}},
     {"skills": "FAIL"})
case("BREAK: one fake quote inside a list of quotes fails the whole field",
     {"skills": {"kind": "list", "value": "SQL", "quote": ["You will build dashboards in SQL and Python.", "We use Spark everywhere."]}},
     {"skills": "FAIL"})
case("BREAK: unknown kind is rejected, not ignored",
     {"skills": {"kind": "set", "value": "SQL", "quote": "You will build dashboards in SQL and Python."}}, {"skills": "FAIL"})
case("without kind=list, an item missing from the quote still PASSES (unchanged behaviour)",
     {"skills": {"value": "SQL, Tableau", "quote": "You will build dashboards in SQL and Python."}}, {"skills": "PASS"})

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
