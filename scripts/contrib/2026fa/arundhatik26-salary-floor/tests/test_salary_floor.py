"""Tests for salary_floor.py — run against the real committed repo data.

  python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-salary-floor/tests -v
"""

import contextlib
import csv
import io
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import salary_floor as sf  # noqa: E402

OEWS = sf.load_oews(os.path.join(sf.REPO, sf.OEWS_XLSX), sf.ALLOWED_SOC)
ROWS, INDEX = sf.load_sponsors(os.path.join(sf.REPO, sf.SPONSOR_CSV))
RULES = {"floor_percentile": "A_PCT25"}


def target(**kw):
    t = {"company": "X", "dataset_name": "TOAST INC", "offer_title": "Software Engineer", "soc": "15-1252"}
    t.update(kw)
    return t


class BLSBand(unittest.TestCase):
    def test_xlsx_25th_percentile(self):
        _, band = sf.soc_band(OEWS, "15-1252")
        self.assertEqual(band["A_PCT25"], 103050)

    def test_xlsx_median_matches_compact_csv(self):
        # Two different repo files must agree on the national median.
        path = os.path.join(sf.REPO, "data/bls/compact/soc_occupation_compact.csv")
        with open(path, newline="") as f:
            compact = {r["bls_soc_code"]: float(r["annual_median_wage"])
                       for r in csv.DictReader(f) if r["annual_median_wage"]}
        for soc in ("15-1252", "15-1254"):
            self.assertEqual(sf.soc_band(OEWS, soc)[1]["A_MEDIAN"], compact[soc], soc)

    def test_suppressed_percentile_stops(self):
        fake = {"15-1252": {"OCC_TITLE": "Software Developers", "O_GROUP": "detailed",
                            "A_PCT10": "1", "A_PCT25": "*", "A_MEDIAN": "3", "A_PCT75": "4", "A_PCT90": "5"}}
        with self.assertRaises(sf.InputError):
            sf.floor_for(target(), fake, RULES)


class CompanyMatch(unittest.TestCase):
    def test_state_street_absent_hotel_not_used(self):
        co = sf.resolve_company("STATE STREET CORP", ROWS, INDEX)
        self.assertEqual(co["status"], "not-in-dataset")
        co2 = sf.resolve_company("STATE STREET", ROWS, INDEX)
        self.assertEqual(co2["status"], "not-in-dataset")
        self.assertIn("1601 STATE STREET HOTEL INVESTORS LP", co2["near_misses_not_used"])

    def test_fidelity_blank_gives_no_company_number(self):
        co = sf.resolve_company("FMR LLC", ROWS, INDEX)
        self.assertEqual(co["status"], "blank-record")
        self.assertEqual(sf.compare(co, 103050)["value"], "NO COMPANY NUMBER")

    def test_toast_matched_from_record(self):
        co = sf.resolve_company("TOAST INC", ROWS, INDEX)
        self.assertEqual(co["status"], "matched")
        self.assertEqual(co["median_salary_offered"], 177341)

    def test_duplicate_name_is_ambiguous(self):
        rows = [{"company_name": "ACME INC"}, {"company_name": "ACME LLC"}]
        index = {}
        for i, r in enumerate(rows, start=2):
            index.setdefault(sf.norm_name(r["company_name"]), []).append((i, r))
        self.assertEqual(sf.resolve_company("ACME", rows, index)["status"], "ambiguous")


class CodeRisk(unittest.TestCase):
    def test_front_end_title_flags_web_code(self):
        fl = sf.floor_for(target(offer_title="Front End Engineer"), OEWS, RULES)
        self.assertEqual(fl["code_risk"]["value"]["alt_floor"], 63140)
        self.assertEqual(fl["code_risk"]["value"]["gap"], 103050 - 63140)

    def test_software_engineer_title_no_flag(self):
        self.assertIsNone(sf.floor_for(target(), OEWS, RULES)["code_risk"])


class StopConditions(unittest.TestCase):
    def cfg(self, **rules):
        return {"rules": {**RULES, **rules}, "targets": [target()]}

    def test_local_metro_request_refused(self):
        if os.path.isdir(os.path.join(sf.REPO, sf.LOCAL_WAGE_DIR)):
            self.skipTest("local-wage data present")
        with self.assertRaises(sf.InputError):
            sf.validate_input(self.cfg(want_local_metro=True))

    def test_bad_percentile_refused(self):
        with self.assertRaises(sf.InputError):
            sf.validate_input(self.cfg(floor_percentile="A_MEAN"))

    def test_soc_outside_scope_refused(self):
        cfg = self.cfg()
        cfg["targets"][0]["soc"] = "15-2051"
        with self.assertRaises(sf.InputError):
            sf.validate_input(cfg)

    def test_cli_exits_2_and_writes_nothing(self):
        with tempfile.TemporaryDirectory() as d:
            bad = os.path.join(d, "bad.json")
            with open(bad, "w") as f:
                json.dump({"rules": RULES, "targets": []}, f)
            out = os.path.join(d, "out")
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(sf.main(["--input", bad, "--out-dir", out]), 2)
            self.assertFalse(os.path.exists(out))


if __name__ == "__main__":
    unittest.main()
