"""Offline tests for the USCIS FY2022 fallback in sponsorship.py.

Edge cases use in-memory rows (made-up employers, clearly not records); one
test reads the real committed extract, fixtures/uscis-fy2022.extract.csv.

Run: python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
"""

import importlib.util
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PIECE_DIR = os.path.dirname(HERE)
sys.path.insert(0, PIECE_DIR)

import sponsorship as sp  # noqa: E402  (import after the path is set)

FIXTURES = os.path.join(PIECE_DIR, "fixtures")
EXTRACT = os.path.join(FIXTURES, "uscis-fy2022.extract.csv")
BROKEN = os.path.join(FIXTURES, "BROKEN-uscis-no-cap.py")
COMPANIES = os.path.join(FIXTURES, "companies.sample.csv")
TARGET_TITLES = ["Data Scientist", "Data Analyst"]


# One in-memory USCIS row with every required column.
def uscis_row(employer, tax_id="1111", initial=0, initial_denied=0, continuing=0, continuing_denied=0, city="BOSTON"):
    return {"Fiscal Year": "2022", "Employer": employer, "Tax ID": tax_id,
            "Initial Approval": str(initial), "Initial Denial": str(initial_denied),
            "Continuing Approval": str(continuing), "Continuing Denial": str(continuing_denied),
            "NAICS": "45", "State": "MA", "City": city, "ZIP": "02116"}


# Records spanning 0 to 5,000 initial approvals, for the cap check.
CAP_RECORDS = [{"employer_names": ["MADE UP CO"], "tax_id": "1111", "rows": 1, "approvals": n, "denials": 0,
                "continuing_approvals": 0, "continuing_denials": 0} for n in (0, 1, 9, 10, 5000)]


# Every way a tier function breaks the rules: above the cap, a p above the
# cap's p, or a tier for 0 initial approvals. Empty list = the rules hold.
def cap_violations(assign):
    problems = []
    for record in CAP_RECORDS:
        result = assign(record)
        if result["tier"] in {"Proven", "Likely"} or (result["p"] or 0) > sp.P_BY_TIER[sp.USCIS_TIER_CAP]:
            problems.append(f"{record['approvals']} approvals -> {result['tier']} p={result['p']}")
        if record["approvals"] == 0 and result["tier"] != "Unknown":
            problems.append(f"0 approvals -> {result['tier']}")
    return problems


class TestFindUscisEmployer(unittest.TestCase):
    # "Wayfair LLC" and "Wayfair" both match "WAYFAIR LLC" after normalizing.
    def test_suffix_normalized_exact_match(self):
        rows = [uscis_row("WAYFAIR LLC", initial=5)]
        for query in ["Wayfair LLC", "Wayfair", "wayfair, llc."]:
            with self.subTest(query=query):
                self.assertEqual(sp.find_uscis_employer(query, rows)["employer_names"], ["WAYFAIR LLC"])

    # A near-name never matches: no prefix match and no fuzzy match.
    def test_near_name_does_not_match(self):
        rows = [uscis_row("WAYFAIR HOLDINGS LLC", initial=5), uscis_row("WAYFAIRS INC", initial=5)]
        self.assertIsNone(sp.find_uscis_employer("Wayfair", rows))
        self.assertIsNone(sp.find_uscis_employer("Wayfair Holding", rows))

    # One name with two Tax IDs stops for a human; giving uscis_tax_id resolves it.
    def test_two_tax_ids_go_to_the_gate(self):
        rows = [uscis_row("ACME LLC", tax_id="1111", initial=3), uscis_row("ACME INC", tax_id="2222", initial=4)]
        with self.assertRaises(sp.AmbiguousCompanyError) as ctx:
            sp.find_uscis_employer("Acme", rows)
        self.assertEqual(len(ctx.exception.candidates), 2)
        self.assertIn("uscis_tax_id", str(ctx.exception))
        self.assertEqual(sp.find_uscis_employer("Acme", rows, tax_id="2222")["approvals"], 4)
        with self.assertRaises(sp.CompanyNotFoundError):
            sp.find_uscis_employer("Acme", rows, tax_id="9999")

    # One employer at two addresses (same name and Tax ID) is one record, summed.
    def test_same_tax_id_rows_are_summed(self):
        rows = [uscis_row("ACME LLC", initial=3, continuing=10), uscis_row("ACME LLC", initial=2, city="DALTON")]
        record = sp.find_uscis_employer("Acme", rows)
        self.assertEqual((record["rows"], record["approvals"], record["continuing_approvals"]), (2, 5, 10))

    # A blank count is a data problem: stop, never treat it as 0.
    def test_blank_count_raises(self):
        rows = [uscis_row("ACME LLC")]
        rows[0]["Initial Approval"] = ""
        with self.assertRaises(ValueError):
            sp.find_uscis_employer("Acme", rows)


class TestAssignUscisTier(unittest.TestCase):
    # 5,000 initial approvals still only reach Possible, p 0.3.
    def test_capped_at_possible(self):
        result = sp.assign_uscis_tier(CAP_RECORDS[-1])
        self.assertEqual((result["tier"], result["p"], result["dataset"]), ("Possible", 0.3, "USCIS FY2022"))
        self.assertEqual(result["source"], "record")

    # Only continuing approvals (0 initial) → Unknown; the counts stay as context.
    def test_only_continuing_approvals_is_unknown(self):
        record = sp.find_uscis_employer("Acme", [uscis_row("ACME LLC", initial=0, initial_denied=2, continuing=100)])
        result = sp.assign_uscis_tier(record)
        self.assertEqual((result["tier"], result["reason"]), ("Unknown", "uscis-zero-approvals"))
        self.assertIsNone(result["p"])
        self.assertEqual((result["approvals"], result["uscis"]["continuing_approvals"]), (0, 100))

    # In neither source → Unknown with p omitted (never 0).
    def test_neither_source_is_unknown(self):
        result = sp.assign_uscis_tier(sp.find_uscis_employer("Nowhere Analytics", [uscis_row("ACME LLC", initial=3)]))
        self.assertEqual((result["tier"], result["reason"]), ("Unknown", "no-match-either-source"))
        self.assertIsNone(result["p"])

    # A company with an 80 Days row keeps its 80 Days tier; USCIS is not used.
    def test_csv_row_wins_over_uscis(self):
        row = sp.find_company("Affinity Solutions", sp.load_rows(COMPANIES))
        result = sp.assign_tier(row, TARGET_TITLES)
        self.assertEqual((result["tier"], result["dataset"]), ("Proven", "80 Days CSV"))
        self.assertNotIn("uscis", result)


class TestRealExtract(unittest.TestCase):
    # The committed extract loads, and every row is the one missing employer.
    def test_extract_rows_are_wayfair_only(self):
        rows = sp.load_uscis_rows(EXTRACT)
        self.assertTrue(rows)
        self.assertEqual({sp.normalize_name(r["Employer"]) for r in rows}, {"WAYFAIR"})
        record = sp.find_uscis_employer("Wayfair", rows)
        self.assertEqual(record["rows"], len(rows))


class TestBreakAttempt(unittest.TestCase):
    # The cap check passes on the real function and catches the BROKEN mutant.
    def test_cap_check_catches_mutant(self):
        self.assertEqual(cap_violations(sp.assign_uscis_tier), [])
        spec = importlib.util.spec_from_file_location("broken_uscis_no_cap", BROKEN)
        mutant = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mutant)
        self.assertTrue(cap_violations(mutant.assign_uscis_tier))


if __name__ == "__main__":
    unittest.main()
