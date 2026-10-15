#!/usr/bin/env python3
"""Offline tests for cogpivot_unprofiled. Fixtures only, no network.

Most of these assert a REFUSAL. The mode's value is that it declines to emit a
number where the data cannot support one, so the tests that matter are the ones
proving it stays silent rather than the ones proving it speaks.

Run:  python3 test_cogpivot_unprofiled.py      ->  "N checks in M tests, 0 failed"
"""
from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
FIX = os.path.join(HERE, "fixtures", "soc.fixture.csv")
SCRIPT = os.path.join(HERE, "cogpivot_unprofiled.py")
TODAY = dt.date(2026, 10, 15)

sys.path.insert(0, HERE)
import cogpivot_unprofiled as cp  # noqa: E402

passed = failed = 0


def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print("  PASS  %s" % name)
    else:
        failed += 1
        print("  FAIL  %s %s" % (name, detail))


def run_fixture(socs):
    return cp.build(ROOT, {s: "test" for s in socs}, TODAY, soc_csv=FIX)


# --------------------------------------------------------------------------
def test_unprofiled_role_gets_no_score():
    """The central behaviour: no profile means no number, not a zero.

    Emitting 0.0 would read as 'maximally AI-replaceable', which is a claim the
    absent data cannot support and is the opposite of what it means.
    """
    res = run_fixture(["99-0001.00"])
    check("an unprofiled SOC is refused, not scored", len(res["refused"]) == 1)
    check("nothing is scored for it", not res["scored"])
    r = res["refused"][0]
    check("role_quality is None, not 0.0", r["role_quality"] is None)
    check("the refusal states a reason", r["reason"] == "no-onet-profile")
    check("the reason is machine-readable, not prose",
          r["reason"].islower() and " " not in r["reason"])
    check("a next action is given", bool(r.get("next_action")))


def test_profiled_role_is_scored_from_its_own_inputs():
    res = run_fixture(["99-0002.00"])
    check("a fully profiled SOC is scored", len(res["scored"]) == 1)
    s = res["scored"][0]["role_quality"]
    check("score is recomputed from nine inputs", s["inputs_present"] == 9)
    check("score is labelled a record", s["source"].startswith("record"))
    check("recomputed value matches the shipped column", s["agrees_with_shipped"])
    check("the value is the mean of the inputs (5.0)", abs(s["value"] - 5.0) < 1e-6)


def test_shipped_value_is_cross_checked_not_trusted():
    """A published column that no longer matches its inputs must be caught."""
    res = run_fixture(["99-0006.00"])
    bad = res["coverage"]["shipped_vs_recomputed_mismatches"]
    check("a wrong shipped value is detected", any(m["soc"] == "99-0006.00" for m in bad))
    m = [x for x in bad if x["soc"] == "99-0006.00"][0]
    check("both values are reported, not just the complaint",
          m["shipped"] == 9.999 and abs(m["recomputed"] - 4.0) < 1e-6)
    s = res["scored"][0]["role_quality"]
    check("the role is flagged as disagreeing", s["agrees_with_shipped"] is False)


def test_fallback_prefers_own_children_over_neighbours():
    """The tier matters: a child is the same work; a neighbour is only filed nearby."""
    res = run_fixture(["99-0001.00"])
    band = res["refused"][0]["fallback_band"]
    check("a fallback band is offered", band["n"] == 2)
    check("the stronger tier is chosen", band["tier"] == "own-children")
    check("both children are named", {p["soc"] for p in band["peers"]}
          == {"99-0001.01", "99-0001.02"})
    check("the band is labelled model-judgment", "model-judgment" in band["source"])
    check("a range is given, not a point estimate",
          band["min"] == 3.0 and band["max"] == 4.0 and band["spread"] == 1.0)
    check("peers are sorted by score", [p["score"] for p in band["peers"]] == [3.0, 4.0])


def test_fallback_is_absent_when_there_is_nothing_to_fall_back_on():
    """No children and no profiled neighbours means no band — not a fabricated one."""
    res = run_fixture(["88-0001.00"])
    band = res["refused"][0]["fallback_band"]
    check("no band is invented", band["n"] == 0)
    check("the tier says none", band["tier"] == "none")
    check("a reason is given", band["reason"] == "no-profiled-peer-at-either-tier")


def test_partial_input_scores_are_reported():
    """A score from 7 inputs prints identically to one from 9. Say so."""
    res = run_fixture(["99-0003.00"])
    part = res["coverage"]["partial_scores"]
    check("a partial-input score is reported", any(p["soc"] == "99-0003.00" for p in part))
    p = [x for x in part if x["soc"] == "99-0003.00"][0]
    check("the number of inputs is stated", p["inputs_present"] == 7 and p["of"] == 9)
    check("it is still scored, not discarded", any(s["soc"] == "99-0003.00"
                                                   for s in res["scored"]))


def test_catch_alls_are_separated_from_named_occupations():
    """A gap on 'All Other' is a residual bucket; a gap on a named role is a failure."""
    res = run_fixture(["99-0002.00"])
    cov = res["coverage"]
    check("unprofiled rows are counted", cov["unprofiled"] == 3)
    check("named occupations are separated", cov["unprofiled_named"] == 2)
    check("catch-alls are separated", cov["unprofiled_all_other"] == 1)
    check("the two account for the whole gap",
          cov["unprofiled_named"] + cov["unprofiled_all_other"] == cov["unprofiled"])


def test_structural_explanation_is_measured_not_asserted():
    """The '.00 parents are empty' claim must come from the data, not prose."""
    res = run_fixture(["99-0002.00"])
    cov = res["coverage"]
    check("dot-00 rows among the gap are counted", cov["unprofiled_dot00"] == 3)
    check("parents with a profiled child are counted",
          cov["unprofiled_with_profiled_child"] == 1)
    check("that subset cannot exceed the gap",
          cov["unprofiled_with_profiled_child"] <= cov["unprofiled"])


def test_coverage_is_recomputed_not_hardcoded():
    """Change the rows and every count must follow."""
    with tempfile.TemporaryDirectory() as td:
        trimmed = os.path.join(td, "trimmed.csv")
        with open(FIX, encoding="utf-8") as fh:
            lines = fh.readlines()
        # Header + the three unprofiled rows only.
        keep = [lines[0]] + [l for l in lines[1:]
                             if l.split(",")[0] in ("99-0001.00", "99-0004.00", "88-0001.00")]
        open(trimmed, "w", encoding="utf-8").writelines(keep)
        res = cp.build(ROOT, {"99-0001.00": "t"}, TODAY, soc_csv=trimmed)
    cov = res["coverage"]
    check("totals follow the rows given", cov["total"] == 3)
    check("the gap follows the rows given", cov["unprofiled"] == 3)
    check("with the children gone, no band is offered",
          res["refused"][0]["fallback_band"]["n"] == 0)


def test_missing_input_fails_loudly():
    try:
        cp.build(ROOT, {"99-0002.00": "t"}, TODAY,
                 soc_csv=os.path.join(HERE, "fixtures", "does-not-exist.csv"))
        check("a missing SOC table raises", False, "(no exception)")
    except SystemExit as e:
        check("a missing SOC table raises", True)
        check("the error names the file and says nothing was invented",
              "missing SOC table" in str(e) and "invented" in str(e))


def test_unknown_soc_is_reported_not_guessed():
    res = run_fixture(["99-9999.00"])
    check("an unknown SOC is refused", len(res["refused"]) == 1)
    check("it is reported as a data problem",
          any(p["problem"] == "soc-not-in-table" for p in res["data_problems"]))
    check("no score is invented for it", res["refused"][0]["role_quality"] is None)


def test_every_emitted_value_carries_a_source():
    """DATA_CONTRACT: nothing is presented as a record unless a record produced it."""
    res = run_fixture(["99-0001.00", "99-0002.00"])
    for s in res["scored"]:
        check("scored %s labels its role_quality" % s["soc"],
              "source" in s["role_quality"])
        check("scored %s labels its wage" % s["soc"], s["median_wage"]["source"] == "record")
    for r in res["refused"]:
        if r.get("fallback_band", {}).get("n"):
            check("the band for %s is NOT labelled a record" % r["soc"],
                  "record" not in r["fallback_band"]["source"])
    check("target SOC list is declared your-input",
          res["meta"]["target_socs"]["source"] == "your-input")


def test_outputs_are_written_and_parse():
    res = run_fixture(["99-0001.00", "99-0002.00"])
    with tempfile.TemporaryDirectory() as td:
        jp, mp = cp.write_outputs(res, td)
        check("agent JSON is written", os.path.exists(jp))
        check("human report is written", os.path.exists(mp))
        with open(jp, encoding="utf-8") as fh:
            parsed = json.load(fh)
        check("agent JSON parses", parsed["coverage"]["total"] == 8)
        md = open(mp, encoding="utf-8").read()
        check("the report leads with an executive summary",
              md.index("## Executive summary") < md.index("## Coverage"))
        check("the report states the refusal", "No role-quality score is emitted" in md)
        check("the report never prints a 0.0 for an unprofiled role",
              "**0.000**" not in md)


def test_cli_exit_codes():
    def run(args):
        return subprocess.run([sys.executable, SCRIPT] + args,
                              capture_output=True, text=True)
    with tempfile.TemporaryDirectory() as td:
        r = run(["--soc-csv", FIX, "--soc", "99-0002.00", "--out-dir", td])
        check("a healthy run exits 0", r.returncode == 0, r.stderr[-200:])

        r = run(["--soc-csv", FIX, "--soc", "99-0001.00", "--out-dir", td])
        check("a run that scores nothing exits 2", r.returncode == 2, r.stderr[-200:])
        check("it says why on stderr", "STOP" in r.stderr)

        r = run(["--soc-csv", os.path.join(HERE, "nope.csv"), "--out-dir", td])
        check("a missing input exits non-zero", r.returncode != 0)


if __name__ == "__main__":
    print("test_cogpivot_unprofiled — offline, fixtures only, no network")
    print()
    # Discovered, not listed: a hand-maintained list silently skips any test
    # added after it, which already cost marks once.
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    for _, fn in tests:
        fn()
    print()
    print("  %d checks in %d tests, %d failed" % (passed, len(tests), failed))
    raise SystemExit(1 if failed else 0)
