#!/usr/bin/env python3
"""Offline test for build_roles.py. Fixture-based, no network calls, does not
read the real 30k-row CSV.

Run: python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles_test.py
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_roles  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE_CSV = os.path.join(HERE, "fixtures", "mini-targets.csv")
FIXTURE_URLS = os.path.join(HERE, "fixtures", "posting-urls.fixture.csv")
FIXTURE_LOG = os.path.join(HERE, "fixtures", "liveness-log.fixture.txt")
FIXTURE_DECISIONS = os.path.join(HERE, "fixtures", "gate-decisions.fixture.csv")


class TestClassifyTitles(unittest.TestCase):
    def test_matches_software_engineer(self):
        matched, titles, soc = build_roles.classify_titles("['Senior Software Engineer']")
        self.assertTrue(matched)
        self.assertEqual(soc, "15-1252")

    def test_matches_devops(self):
        matched, titles, soc = build_roles.classify_titles("['Platform Engineer', 'DevOps Lead']")
        self.assertTrue(matched)
        self.assertEqual(soc, "15-1244")

    def test_matches_ai(self):
        matched, titles, soc = build_roles.classify_titles("['AI Research Engineer']")
        self.assertTrue(matched)
        self.assertEqual(soc, "15-1299")

    def test_no_false_positive_on_short_ai_substring(self):
        # "Maintenance Claims Coordinator" contains "ai" as a bare substring in
        # "Maintenance" and "Claims" but must NOT match the word-boundary "ai" pattern.
        matched, titles, soc = build_roles.classify_titles("['Maintenance Claims Coordinator']")
        self.assertFalse(matched)

    def test_empty_titles_field(self):
        matched, titles, soc = build_roles.classify_titles("")
        self.assertFalse(matched)
        matched, titles, soc = build_roles.classify_titles("[]")
        self.assertFalse(matched)


class TestTimelineFactor(unittest.TestCase):
    def test_future_date_gives_positive_factor(self):
        from datetime import date, timedelta
        today = date(2026, 10, 1)
        future = (today + timedelta(days=100)).isoformat()
        factor, days = build_roles.compute_timeline_factor(future, 45, today=today)
        self.assertGreater(factor, 0)
        self.assertEqual(days, 100)

    def test_past_date_zeroes_factor(self):
        from datetime import date
        today = date(2026, 10, 1)
        factor, days = build_roles.compute_timeline_factor("2020-01-01", 45, today=today)
        self.assertEqual(factor, 0.0)
        self.assertLess(days, 0)


class TestBuildRolesFixture(unittest.TestCase):
    def setUp(self):
        self.out_dir = tempfile.mkdtemp()

    def test_fixture_counts_and_exclusions(self):
        roles, held_out, counts = build_roles.build_roles(
            csv_path=FIXTURE_CSV,
            soc_csv_path="/nonexistent/no-soc-data.csv",  # role_quality intentionally unresolvable
            opt_end_date="2027-03-15",
            hiring_lag_days=45,
        )
        self.assertEqual(counts["rows_read"], 8)
        self.assertEqual(counts["skipped_wrong_industry"], 1)  # WRONGINDUSTRY INC
        self.assertEqual(counts["skipped_no_approvals"], 1)  # ZEROAPPROVALS INC
        self.assertEqual(counts["skipped_no_titles"], 1)  # NOTITLESDATA INC
        self.assertEqual(counts["skipped_no_title_match"], 1)  # MAINTENANCECORP INC
        self.assertEqual(counts["emitted"], 4)  # CLEARSWE, DEVOPSCO, AISPECIALCO, MLOPSFIRM

        # no posting was checked, so nothing may reach the scorer: liveness is a gate,
        # and an unchecked gate is held out, never filled with a guessed value
        self.assertEqual(roles, [])
        self.assertEqual(counts["held_out_liveness"], 4)
        self.assertEqual(
            {h["company"] for h in held_out},
            {"CLEARSWE INC", "DEVOPSCO INC", "AISPECIALCO INC", "MLOPSFIRM INC"},
        )
        for h in held_out:
            self.assertIn("liveness not checked", h["reason"])

    def test_checked_liveness_is_a_record_and_unchecked_is_held_out(self):
        roles, held_out, counts = build_roles.build_roles(
            csv_path=FIXTURE_CSV,
            soc_csv_path="/nonexistent/no-soc-data.csv",
            opt_end_date="2027-03-15",
            hiring_lag_days=45,
            posting_urls_path=FIXTURE_URLS,
            liveness_log_path=FIXTURE_LOG,
        )
        by_company = {r["company"]: r for r in roles}
        # active posting: scored, factor 1.0, labeled record with its evidence file
        self.assertEqual(by_company["CLEARSWE INC"]["liveness"]["factor"], 1.0)
        self.assertEqual(by_company["CLEARSWE INC"]["liveness"]["source"], "record")
        self.assertEqual(by_company["CLEARSWE INC"]["liveness"]["evidence"], FIXTURE_LOG)
        # the scored role is the checked posting, not the historical sponsored title
        self.assertEqual(by_company["CLEARSWE INC"]["title"], "Backend Software Engineer")
        self.assertIn("sponsored_title_example", by_company["CLEARSWE INC"])
        # expired posting: scored with factor 0.0, so the scorer's gate closes it to Skip
        self.assertEqual(by_company["DEVOPSCO INC"]["liveness"]["factor"], 0.0)
        # uncertain posting and a company with no URL: held out, not scored
        held = {h["company"]: h["reason"] for h in held_out}
        self.assertIn("uncertain", held["AISPECIALCO INC"])
        self.assertIn("no posting URL", held["MLOPSFIRM INC"])
        self.assertEqual(counts["liveness_checked"], 2)
        self.assertEqual(counts["held_out_liveness"], 2)
        for role in roles:
            # unresolvable SOC must be flagged, not silently zeroed
            self.assertEqual(role.get("role_quality_status"), "no-soc-match")
            self.assertNotIn("role_quality", role)

    def test_human_gate_decision_clears_uncertain_as_your_input(self):
        roles, held_out, counts = build_roles.build_roles(
            csv_path=FIXTURE_CSV,
            soc_csv_path="/nonexistent/no-soc-data.csv",
            opt_end_date="2027-03-15",
            hiring_lag_days=45,
            posting_urls_path=FIXTURE_URLS,
            liveness_log_path=FIXTURE_LOG,
            gate_decisions_path=FIXTURE_DECISIONS,
        )
        by_company = {r["company"]: r for r in roles}
        # the uncertain posting now reaches the scorer, but labeled as a human judgment
        ai = by_company["AISPECIALCO INC"]["liveness"]
        self.assertEqual(ai["factor"], 1.0)
        self.assertEqual(ai["source"], "your-input")
        self.assertEqual(ai["result"], "uncertain")
        self.assertEqual(ai["decided_by"], "Fixture Reviewer")
        # checker records are unchanged; a role with no posting is still held out
        self.assertEqual(by_company["CLEARSWE INC"]["liveness"]["source"], "record")
        self.assertEqual({h["company"] for h in held_out}, {"MLOPSFIRM INC"})
        self.assertEqual(counts["liveness_checked"], 3)

    def test_past_opt_date_zeroes_every_role_timeline(self):
        roles, held_out, counts = build_roles.build_roles(
            csv_path=FIXTURE_CSV,
            soc_csv_path="/nonexistent/no-soc-data.csv",
            opt_end_date="2020-01-01",
            hiring_lag_days=45,
            posting_urls_path=FIXTURE_URLS,
            liveness_log_path=FIXTURE_LOG,
        )
        self.assertGreater(len(roles), 0)
        for role in roles:
            self.assertEqual(role["timeline"]["factor"], 0.0)

    def test_missing_liveness_log_exits_nonzero(self):
        with self.assertRaises(SystemExit) as ctx:
            build_roles.build_roles(
                csv_path=FIXTURE_CSV,
                soc_csv_path="/nonexistent/no-soc-data.csv",
                opt_end_date="2027-03-15",
                hiring_lag_days=45,
                posting_urls_path=FIXTURE_URLS,
                liveness_log_path="/nonexistent/liveness.txt",
            )
        self.assertEqual(ctx.exception.code, 2)

    def test_missing_csv_exits_nonzero(self):
        with self.assertRaises(SystemExit) as ctx:
            build_roles.build_roles(
                csv_path="/nonexistent/missing.csv",
                soc_csv_path="/nonexistent/no-soc-data.csv",
                opt_end_date="2027-03-15",
                hiring_lag_days=45,
            )
        self.assertEqual(ctx.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
