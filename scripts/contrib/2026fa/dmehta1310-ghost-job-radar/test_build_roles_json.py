#!/usr/bin/env python3
"""
Offline test for build_roles_json.py. Uses a small fixture CSV (created in
a temp directory at test time) instead of the real 30,000+ row dataset --
no network calls, fully deterministic.
"""

import csv
import os
import sys
import tempfile
import unittest

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from build_roles_json import build_role_entry, find_company_row

FIXTURE_ROWS = [
    {
        "company_name": "Proven Sponsor Inc",
        "industry": "Software",
        "Total Approvals": "12",
        "Total Denials": "1",
        "Approval_Rate": "92%",
        "total_funding": "5000000",
        "latest_funding_stage": "Series A",
        "latest_funding_date": "2025-03-01",
    },
    {
        "company_name": "Likely Sponsor LLC",
        "industry": "Retail",
        "Total Approvals": "2",
        "Total Denials": "1",
        "Approval_Rate": "0.5",
        "total_funding": "",
        "latest_funding_stage": "",
        "latest_funding_date": "",
    },
    {
        "company_name": "Never Sponsors Co",
        "industry": "Manufacturing",
        "Total Approvals": "0",
        "Total Denials": "0",
        "Approval_Rate": "",
        "total_funding": "250000",
        "latest_funding_stage": "Pre-Seed",
        "latest_funding_date": "2018-01-01",
    },
]

FIELDNAMES = [
    "company_name",
    "industry",
    "Total Approvals",
    "Total Denials",
    "Approval_Rate",
    "total_funding",
    "latest_funding_stage",
    "latest_funding_date",
]


class TestBuildRolesJson(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fd, cls.csv_path = tempfile.mkstemp(suffix=".csv")
        os.close(fd)
        with open(cls.csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()
            writer.writerows(FIXTURE_ROWS)

    @classmethod
    def tearDownClass(cls):
        os.remove(cls.csv_path)

    def test_finds_exact_company_match(self):
        row = find_company_row(self.csv_path, "Proven Sponsor Inc")
        self.assertIsNotNone(row)
        self.assertEqual(row["company_name"], "Proven Sponsor Inc")

    def test_match_is_case_and_spacing_insensitive(self):
        row = find_company_row(self.csv_path, "  proven SPONSOR inc ")
        self.assertIsNotNone(row)

    def test_missing_company_returns_none_not_a_guess(self):
        row = find_company_row(self.csv_path, "Totally Unlisted Corp")
        self.assertIsNone(row)

    def test_proven_tier_from_high_approval_rate(self):
        entry = build_role_entry(
            role_id="test-1",
            company="Proven Sponsor Inc",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="pass",
        )
        self.assertEqual(entry["sponsorship"]["tier"], "Proven")
        self.assertEqual(entry["sponsorship"]["p"], 0.9)
        self.assertTrue(entry["company_found_in_sample"])

    def test_likely_tier_from_moderate_approval_rate(self):
        entry = build_role_entry(
            role_id="test-2",
            company="Likely Sponsor LLC",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="pass",
        )
        self.assertEqual(entry["sponsorship"]["tier"], "Likely")
        self.assertEqual(entry["sponsorship"]["p"], 0.6)

    def test_zero_approvals_gives_none_tier(self):
        entry = build_role_entry(
            role_id="test-3",
            company="Never Sponsors Co",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="pass",
        )
        self.assertEqual(entry["sponsorship"]["tier"], "None")
        self.assertEqual(entry["sponsorship"]["p"], 0.0)

    def test_absent_company_labeled_no_record_not_denial(self):
        entry = build_role_entry(
            role_id="test-4",
            company="Totally Unlisted Corp",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="pass",
        )
        self.assertEqual(entry["sponsorship"]["tier"], "NoRecordInSample")
        self.assertFalse(entry["company_found_in_sample"])
        self.assertIsNone(entry["funding_context"]["total_funding"])

    def test_dead_liveness_zeroes_liveness_factor(self):
        entry = build_role_entry(
            role_id="test-5",
            company="Proven Sponsor Inc",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="dead",
            timeline_result="pass",
        )
        self.assertEqual(entry["liveness"]["factor"], 0.0)

    def test_failed_timeline_zeroes_timeline_factor(self):
        entry = build_role_entry(
            role_id="test-6",
            company="Proven Sponsor Inc",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="fail",
        )
        self.assertEqual(entry["timeline"]["factor"], 0.0)

    def test_every_evidence_term_is_labeled(self):
        entry = build_role_entry(
            role_id="test-7",
            company="Proven Sponsor Inc",
            title="Data Analyst",
            csv_path=self.csv_path,
            liveness_result="live",
            timeline_result="pass",
        )
        self.assertEqual(entry["sponsorship"]["source"], "record")
        self.assertEqual(entry["fit"]["source"], "model-judgment")
        self.assertEqual(entry["liveness"]["source"], "record")
        self.assertEqual(entry["timeline"]["source"], "record")
        self.assertEqual(entry["funding_context"]["source"], "record")


if __name__ == "__main__":
    unittest.main()
