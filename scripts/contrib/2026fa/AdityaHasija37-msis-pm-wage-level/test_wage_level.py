#!/usr/bin/env python3
"""Offline tests for wage_level.py — standard library only.

    python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/test_wage_level.py
"""

import csv
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import wage_level as wl  # noqa: E402

SF_15_2051 = {"level1": "53.07", "level2": "68.48", "level3": "83.90", "level4": "99.31", "label": ""}
# National OEWS May 2024, 15-2051 (from the shipped workbook) and 11-2021 (P90 top-coded "#").
NAT_15_2051 = {10: (63650.0, False), 25: (82630.0, False), 50: (112590.0, False), 75: (155810.0, False), 90: (194410.0, False)}
NAT_11_2021 = {10: (81900.0, False), 25: (111210.0, False), 50: (161030.0, False), 75: (211080.0, False), 90: (None, True)}
CUR, PROP = wl.REGIMES["current-2005"], wl.REGIMES["proposed-2026-nprm"]


class Levels(unittest.TestCase):
    def test_hourly_to_annual_uses_2080(self):
        lv = wl.oflc_annual_levels(SF_15_2051)["levels"]
        self.assertEqual(lv["I"], round(53.07 * 2080, 2))
        self.assertEqual(lv["IV"], round(99.31 * 2080, 2))

    def test_annual_wage_label_not_multiplied(self):
        lv = wl.oflc_annual_levels({"level1": "50000", "level2": "60000", "level3": "70000", "level4": "80000",
                                    "label": "Annual Wage"})["levels"]
        self.assertEqual(lv["I"], 50000.0)

    def test_high_wage_row_is_refused(self):
        r = wl.oflc_annual_levels({"level1": "", "level2": "", "level3": "", "level4": "", "label": "High Wage"})
        self.assertEqual(r["status"], "refuse")
        self.assertIsNone(r["levels"])

    def test_empty_level_without_label_is_refused(self):
        r = wl.oflc_annual_levels({"level1": "1", "level2": "", "level3": "3", "level4": "4", "label": ""})
        self.assertEqual(r["status"], "refuse")

    def test_boundaries_exactly_equal_meets_level(self):
        lv = wl.oflc_annual_levels(SF_15_2051)["levels"]
        self.assertEqual(wl.level_met(lv["II"], lv), "II")
        self.assertEqual(wl.level_met(lv["II"] - 0.01, lv), "I")
        self.assertEqual(wl.level_met(lv["I"] - 0.01, lv), "below-I")
        self.assertEqual(wl.level_met(10**7, lv), "IV")

    def test_gap_to_next(self):
        lv = wl.oflc_annual_levels(SF_15_2051)["levels"]
        g = wl.next_level_gap(193500, lv)
        self.assertEqual(g["next_level"], "IV")
        self.assertAlmostEqual(g["gap"], lv["IV"] - 193500, places=2)
        self.assertIsNone(wl.next_level_gap(lv["IV"], lv))


class ProxyBracket(unittest.TestCase):
    def test_no_interpolation_between_published_percentiles(self):
        # 100k sits between P25 (82,630) and P50 (112,590): ≥P17 so ≥ I, but P34 is unknown.
        self.assertEqual(wl.proxy_bracket(100000, NAT_15_2051, CUR), {"min": "I", "max": "II", "exact": False})

    def test_above_p75_is_level_iv_under_current(self):
        self.assertEqual(wl.proxy_bracket(160000, NAT_15_2051, CUR)["min"], "IV")

    def test_proposed_rule_is_stricter(self):
        b = wl.proxy_bracket(160000, NAT_15_2051, PROP)
        self.assertEqual((b["min"], b["max"]), ("III", "IV"))

    def test_below_p10_is_below_level_i(self):
        self.assertEqual(wl.proxy_bracket(50000, NAT_15_2051, CUR), {"min": "below-I", "max": "below-I", "exact": True})

    def test_proposed_below_p25_is_below_level_i(self):
        self.assertEqual(wl.proxy_bracket(80000, NAT_15_2051, PROP)["max"], "below-I")

    def test_top_coded_p90_never_claims_level_iv_under_proposed(self):
        # 230k ≥ P75 but P90 is "#" (≥ 239,200): cannot claim P88 is met.
        b = wl.proxy_bracket(230000, NAT_11_2021, PROP)
        self.assertEqual((b["min"], b["max"]), ("III", "IV"))
        # below the top code, "#" proves salary < P90 → still unknown vs P88 (P88 < P90)
        self.assertFalse(b["exact"])


class Timeline(unittest.TestCase):
    def test_three_seasons_for_jan_2027_start(self):
        end = wl.add_months(date(2027, 1, 15), 36)
        self.assertEqual(end, date(2030, 1, 15))
        s = wl.lottery_seasons(end, date(2026, 10, 21))
        self.assertEqual([x["registration_march"] for x in s], [2027, 2028, 2029])

    def test_no_season_when_status_ends_before_april(self):
        self.assertEqual(wl.lottery_seasons(date(2027, 3, 20), date(2026, 10, 21)), [])

    def test_leap_day_clamp(self):
        self.assertEqual(wl.add_months(date(2027, 1, 31), 1), date(2027, 2, 28))


class Gates(unittest.TestCase):
    persona = {"opt_start": {"value": "2027-01-15"}, "opt_months": 12, "stem_extension_months": 24}
    rule = {"regime_in_force": "current-2005", "checked_on": "2026-10-21", "checked_by": "Test Person", "how": "y"}

    def test_rule_check_must_be_named(self):
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates(self.persona, {**self.rule, "checked_by": None}, date(2026, 10, 21))

    def test_rule_check_goes_stale(self):
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates(self.persona, self.rule, date(2026, 11, 21))

    def test_proposed_regime_refused_with_current_file(self):
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates(self.persona, {**self.rule, "regime_in_force": "proposed-2026-nprm"}, date(2026, 10, 21))

    def test_timeline_gate(self):
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates({**self.persona, "opt_start": {"value": "2024-01-01"}}, self.rule, date(2026, 10, 21))
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates({**self.persona, "opt_start": {"value": "Jan 2027"}}, self.rule, date(2026, 10, 21))

    RUN = date(2026, 10, 21)
    EVIDENCE = "course/2026fa/submissions/AdityaHasija37/mode-build/runs/04-liveness-S2-flexport.txt"

    def base_sc(self, **pay):
        return {"posting_url": "https://job-boards.greenhouse.io/flexport/jobs/8158023",
                "liveness": {"status": "active", "checked_on": "2026-10-21", "evidence": self.EVIDENCE},
                "worksite": {"oflc_area": "41860"},
                "pay": {"basis": "base", "basis_confirmed_by": "Test Person", "low": 160000, "high": 180000, **pay}}

    def test_scenario_gates(self):
        self.assertEqual(wl.scenario_gate(self.base_sc(), self.RUN), (None, None))
        for status in ("expired", "uncertain", None):
            sc = self.base_sc()
            sc["liveness"]["status"] = status
            self.assertEqual(wl.scenario_gate(sc, self.RUN)[0], "stop-liveness")
        self.assertEqual(wl.scenario_gate(self.base_sc(basis="ote"), self.RUN)[0], "stop-pay-basis")
        self.assertEqual(wl.scenario_gate(self.base_sc(basis_confirmed_by=None), self.RUN)[0], "stop-pay-basis")

    def test_liveness_must_be_from_the_run_date(self):
        # Regression (TA review 2026-10-21): a 29-day-old liveness check used to pass.
        self.assertEqual(wl.scenario_gate(self.base_sc(), date(2026, 11, 19))[0], "stop-liveness")

    def test_liveness_evidence_file_must_exist(self):
        sc = self.base_sc()
        sc["liveness"]["evidence"] = "course/nope.txt"
        self.assertEqual(wl.scenario_gate(sc, self.RUN)[0], "stop-liveness")

    def test_liveness_evidence_is_parsed_not_just_present(self):
        # Regression (second TA review): any existing file, even outside the repo, used to pass.
        for ev in ("README.md", "/etc/hosts", "../../../../etc/hosts",
                   "course/2026fa/submissions/AdityaHasija37/mode-build/runs/03-liveness-S1-verkada.txt"):
            sc = self.base_sc()
            sc["liveness"]["evidence"] = ev          # last one: real capture, but for another posting
            self.assertEqual(wl.scenario_gate(sc, self.RUN)[0], "stop-liveness", ev)
        sc = self.base_sc()
        sc["liveness"]["checked_on"] = "2026-10-20"
        self.assertEqual(wl.scenario_gate(sc, date(2026, 10, 20))[0], "stop-liveness")  # no capture that day

    def test_names_must_be_names(self):
        for who in ("", " ", "   ", "x", "12345", None):
            self.assertFalse(wl.named(who), repr(who))
            self.assertEqual(wl.scenario_gate(self.base_sc(basis_confirmed_by=who), self.RUN)[0], "stop-pay-basis")
            with self.assertRaises(wl.GateStop):
                wl.check_run_gates(self.persona, {**self.rule, "checked_by": who}, self.RUN)
        self.assertTrue(wl.named("Aditya Hasija (AdityaHasija37)"))

    def test_bad_pay_range(self):
        for pay in ({"low": None}, {"low": "abc"}, {"low": 200000, "high": 100000}, {"low": 0, "high": 1}):
            self.assertEqual(wl.scenario_gate(self.base_sc(**pay), self.RUN)[0],
                             "stop-pay-range", pay)
        self.assertEqual(wl.scenario_gate(self.base_sc(), self.RUN), (None, None))

    def test_area_without_extract_rows(self):
        self.assertEqual(wl.scenario_gate(self.base_sc(), self.RUN, {"42660"})[0], "stop-worksite")

    def test_bad_checked_on_is_a_clean_stop(self):
        with self.assertRaises(wl.GateStop):
            wl.check_run_gates(self.persona, {**self.rule, "checked_on": "Oct 21"}, self.RUN)

    def test_soc_gate(self):
        extract = {("41860", "15-2051"): {}, ("41860", "11-3021"): {}}
        ok = {"soc_candidates": {"codes": ["15-2051"], "set_by": "Test Person"}}
        self.assertEqual(wl.check_soc_gate(ok, extract), ["15-2051"])
        for bad in ({"soc_candidates": {"codes": ["15-2051"], "set_by": None}},
                    {"soc_candidates": {"codes": ["99-9999"], "set_by": "Test Person"}},
                    {"soc_candidates": {"codes": []}}, {}):
            with self.assertRaises(wl.GateStop):
                wl.check_soc_gate(bad, extract)


class EndToEnd(unittest.TestCase):
    """Runs the CLI on the committed extract and the shipped national/compact/80 Days data."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        sc = json.loads((HERE / "fixtures" / "scenarios.2026-10-21.json").read_text())
        sc["soc_candidates"]["set_by"] = "test"
        for x in sc["scenarios"]:
            x["pay"]["basis"], x["pay"]["basis_confirmed_by"] = x["pay"]["basis_proposed"], "test"
        (self.tmp / "sc.json").write_text(json.dumps(sc))
        (self.tmp / "rule.json").write_text(json.dumps(Gates.rule))

    def cli(self, *extra):
        return wl.main(["run", "--run-date", "2026-10-21", "--replay", "--scenarios", str(self.tmp / "sc.json"),
                        "--rule-check", str(self.tmp / "rule.json"), "--out", str(self.tmp / "out"), *extra])

    def test_run_writes_two_artifacts_and_never_a_probability(self):
        self.assertEqual(self.cli(), 0)
        log = json.loads((self.tmp / "out" / "run-log.json").read_text())
        report = (self.tmp / "out" / "report.md").read_text()
        self.assertTrue(report.startswith("# ") and "## Executive summary" in report.split("## Run record")[0])
        self.assertTrue(all(s["selection_probability"] is None for s in log["scenarios"]))
        routes = {s["id"]: s["route"] for s in log["scenarios"]}
        self.assertEqual(routes["S1"], "stop-pay-basis")          # OTE range is refused
        s2b = next(s for s in log["scenarios"] if s["id"] == "S2b")
        row = next(r for r in s2b["rows"] if r["soc"] == "11-3021" and r["offer_point"] == "mid")
        self.assertEqual(row["level"], "I")                          # 193,500 < 208,104 (SF L2)

    def test_high_wage_row_refused_end_to_end(self):
        sc = json.loads((self.tmp / "sc.json").read_text())
        sc["scenarios"][3]["worksite"]["oflc_area"] = "41940"        # San Jose: 11-3021 is "High Wage"
        (self.tmp / "sc.json").write_text(json.dumps(sc))
        self.assertEqual(self.cli(), 0)
        log = json.loads((self.tmp / "out" / "run-log.json").read_text())
        rows = [r for r in log["scenarios"][3]["rows"] if r["soc"] == "11-3021"]
        self.assertTrue(rows and all(r["level"] is None and r["oflc"]["status"] == "refuse" for r in rows))

    def test_gate_failure_writes_nothing(self):
        (self.tmp / "rule.json").write_text(json.dumps({**Gates.rule, "checked_by": ""}))
        self.assertEqual(self.cli(), 2)
        self.assertFalse((self.tmp / "out").exists())

    def test_tampered_extract_stops_the_run(self):
        # Regression (found 2026-10-21): run used to level a hand-edited extract without noticing.
        for f in ("oflc-2026-27-pm-extract.csv", "oflc-2026-27-pm-extract.provenance.json"):
            (self.tmp / f).write_bytes((HERE / "data" / f).read_bytes())
        csv_path = self.tmp / "oflc-2026-27-pm-extract.csv"
        csv_path.write_text(csv_path.read_text().replace(",53.07,68.48,", ",53.07,58.48,"))
        self.assertEqual(self.cli("--extract", str(csv_path)), 2)
        self.assertFalse((self.tmp / "out").exists())

    def test_missing_input_is_a_clean_stop(self):
        # Regression (found 2026-10-21): a missing data file raised a traceback (exit 1).
        self.assertEqual(self.cli("--national", str(self.tmp / "nope.xlsx")), 2)
        self.assertFalse((self.tmp / "out").exists())

    def test_unsigned_soc_set_writes_nothing(self):
        # Regression (TA review 2026-10-21): a missing set_by raised KeyError after run-log.json was written.
        sc = json.loads((self.tmp / "sc.json").read_text())
        del sc["soc_candidates"]["set_by"]
        (self.tmp / "sc.json").write_text(json.dumps(sc))
        self.assertEqual(self.cli(), 2)
        self.assertFalse((self.tmp / "out").exists())

    def test_stale_liveness_stops_every_scenario(self):
        (self.tmp / "rule.json").write_text(json.dumps({**Gates.rule, "checked_on": "2026-11-19"}))
        self.assertEqual(self.cli("--run-date", "2026-11-19"), 0)
        log = json.loads((self.tmp / "out" / "run-log.json").read_text())
        self.assertTrue(all(s["route"] == "stop-liveness" for s in log["scenarios"]))

    def test_backdated_run_needs_replay_and_is_stamped(self):
        # Regression (second TA review): backdating --run-date silently satisfied the freshness gates.
        if wl.date.today() != date(2026, 10, 21):
            self.assertEqual(wl.main(["run", "--run-date", "2026-10-21", "--scenarios", str(self.tmp / "sc.json"),
                                      "--rule-check", str(self.tmp / "rule.json"), "--out", str(self.tmp / "o2")]), 2)
        self.assertEqual(wl.main(["run", "--run-date", "1999-01-01", "--scenarios", str(self.tmp / "sc.json"),
                                  "--rule-check", str(self.tmp / "rule.json"), "--out", str(self.tmp / "o3")]), 2)
        self.assertFalse((self.tmp / "o3").exists())
        self.assertEqual(self.cli(), 0)
        log = json.loads((self.tmp / "out" / "run-log.json").read_text())
        if wl.date.today() != date(2026, 10, 21):
            self.assertTrue(log["mode"].startswith("replay"))
            self.assertIn("**REPLAY**", (self.tmp / "out" / "report.md").read_text())

    def test_bad_run_date_is_a_clean_stop(self):
        self.assertEqual(wl.main(["run", "--run-date", "21/10/2026", "--out", str(self.tmp / "o4")]), 2)

    def test_extract_matches_its_provenance_hash(self):
        prov = json.loads((HERE / "data" / "oflc-2026-27-pm-extract.provenance.json").read_text())
        self.assertEqual(wl.sha256(HERE / "data" / "oflc-2026-27-pm-extract.csv"), prov["extract_sha256"])
        with open(HERE / "data" / "oflc-2026-27-pm-extract.csv", newline="") as f:
            self.assertEqual(sum(1 for _ in csv.DictReader(f)), prov["rows"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
