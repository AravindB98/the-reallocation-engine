"""Offline tests for sponsorship.py. Reads only fixtures/companies.sample.csv.

Run: python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
"""

import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PIECE_DIR = os.path.dirname(HERE)
sys.path.insert(0, PIECE_DIR)

import sponsorship as sp  # noqa: E402  (import after the path is set)

FIXTURE = os.path.join(PIECE_DIR, "fixtures", "companies.sample.csv")

# Target titles from CHANGE-BRIEF.md §1 (your-input).
TARGET_TITLES = [
    "Data Scientist", "Data Analyst", "Machine Learning Engineer", "Analytics Engineer",
    "Data Engineer", "Business Analyst", "Business Intelligence", "Automation Analyst",
]

DELOITTE_ENTITIES = [
    "DELOITTE & TOUCHE LLP",
    "DELOITTE CONSULTING LLP",
    "DELOITTE FINANCIAL ADVISORY SERVICES LLP",
    "DELOITTE LLP",
    "DELOITTE TAX LLP",
    "DELOITTE TOUCHE TOHMATSU SERVICES INC",
    "DELOITTE TOUCHE TOHMATSU SERVICES LLC",
]


class TestNormalizeName(unittest.TestCase):
    # Suffixes and punctuation go; the core name stays.
    def test_strips_suffix_and_punctuation(self):
        self.assertEqual(sp.normalize_name("Affinity Solutions, Inc."), "AFFINITY SOLUTIONS")
        self.assertEqual(sp.normalize_name("DELOITTE & TOUCHE LLP"), "DELOITTE TOUCHE")

    # Several suffixes in a row are all removed.
    def test_strips_repeated_suffixes(self):
        self.assertEqual(sp.normalize_name("Foo Co Ltd"), "FOO")


class TestFindCompany(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = sp.load_rows(FIXTURE)

    # A typed name without "INC" still finds the one real row.
    def test_affinity_solutions_matches_inc_row(self):
        row = sp.find_company("Affinity Solutions", self.rows)
        self.assertEqual(row["company_name"], "AFFINITY SOLUTIONS INC")

    # "Deloitte" must stop with all 7 candidates, not silently pick DELOITTE LLP.
    def test_deloitte_is_ambiguous_with_seven_candidates(self):
        with self.assertRaises(sp.AmbiguousCompanyError) as ctx:
            sp.find_company("Deloitte", self.rows)
        self.assertEqual(sorted(ctx.exception.candidates), sorted(DELOITTE_ENTITIES))
        self.assertEqual(len(ctx.exception.candidates), 7)
        self.assertIn("csv_company_name", str(ctx.exception))

    # A company absent from the CSV returns None (later: Unknown).
    def test_wayfair_not_found_returns_none(self):
        self.assertIsNone(sp.find_company("Wayfair", self.rows))

    # An exact csv_company_name that does not exist is an error, not a guess.
    def test_unknown_exact_name_raises(self):
        with self.assertRaises(sp.CompanyNotFoundError):
            sp.find_company("Deloitte", self.rows, csv_company_name="DELOITTE CONSULTING")

    # An empty query must not match every row.
    def test_empty_query_raises(self):
        with self.assertRaises(ValueError):
            sp.find_company("  Inc. ", self.rows)


class TestAssignTier(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = sp.load_rows(FIXTURE)

    def tier_for(self, query, csv_company_name=None):
        row = sp.find_company(query, self.rows, csv_company_name)
        return sp.assign_tier(row, TARGET_TITLES)

    # 40 approvals, rate 100, "DATA SCIENTIST" in titles → Proven, p 0.9.
    def test_proven(self):
        result = self.tier_for("Affinity Solutions")
        self.assertEqual((result["tier"], result["p"]), ("Proven", 0.9))
        self.assertEqual((result["approvals"], result["approval_rate"]), (40, 100.0))
        self.assertIn({"sponsored_title": "DATA SCIENTIST", "target_title": "Data Scientist"},
                      result["matched_titles"])
        self.assertEqual(result["source"], "record")

    # 4 approvals (below 10), "Research Data Scientist" → Likely, p 0.6.
    def test_likely(self):
        result = self.tier_for("Adept ID")
        self.assertEqual((result["tier"], result["p"]), ("Likely", 0.6))
        self.assertEqual(result["matched_titles"],
                         [{"sponsored_title": "Research Data Scientist", "target_title": "Data Scientist"}])

    # 8,810 approvals but only generic titles → Possible, p 0.3.
    def test_possible_deloitte_consulting(self):
        result = self.tier_for("Deloitte", csv_company_name="DELOITTE CONSULTING LLP")
        self.assertEqual((result["tier"], result["p"]), ("Possible", 0.3))
        self.assertEqual(result["approvals"], 8810)
        self.assertEqual(result["matched_titles"], [])

    # Not in the CSV → Unknown, p None (never 0), reason no-csv-match.
    def test_unknown_no_csv_match_wayfair(self):
        result = self.tier_for("Wayfair")
        self.assertEqual(result["tier"], "Unknown")
        self.assertIsNone(result["p"])
        self.assertEqual(result["reason"], "no-csv-match")

    # In the CSV but H-1B fields blank → Unknown, p None, reason no-h1b-record.
    def test_unknown_no_h1b_record(self):
        for query, exact in [("0xCord", None), ("Deloitte", "DELOITTE FINANCIAL ADVISORY SERVICES LLP")]:
            with self.subTest(query=query, exact=exact):
                result = self.tier_for(query, exact)
                self.assertEqual(result["tier"], "Unknown")
                self.assertIsNone(result["p"])
                self.assertIsNone(result["approvals"])
                self.assertEqual(result["reason"], "no-h1b-record")

    # In-memory row (not in the fixture): title match with 0 approvals fits
    # no tier rule in the brief, so it must raise, not invent a tier.
    def test_title_match_with_zero_approvals_raises(self):
        row = {
            "company_name": "MADE UP ANALYTICS INC",
            "Total Approvals": "0.0", "Total Denials": "3.0", "Approval_Rate": "0.0",
            "top_job_titles_sponsored": "['Data Analyst']",
        }
        with self.assertRaises(sp.NoTierRuleError) as ctx:
            sp.assign_tier(row, TARGET_TITLES)
        self.assertIn("row fits no tier rule", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
