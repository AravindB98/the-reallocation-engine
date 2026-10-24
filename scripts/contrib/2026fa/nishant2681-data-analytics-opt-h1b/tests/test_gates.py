"""Offline tests for gates.py. Reads the fictional persona
search/examples/priya-nair/profile.yml and the fixtures/visa.*.yml files.

Run: python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
"""

import datetime
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PIECE_DIR = os.path.dirname(HERE)
REPO_ROOT = os.path.abspath(os.path.join(PIECE_DIR, "..", "..", "..", ".."))
sys.path.insert(0, PIECE_DIR)

import gates  # noqa: E402  (import after the path is set)

PRIYA = os.path.join(REPO_ROOT, "search", "examples", "priya-nair", "profile.yml")
FIXTURES = os.path.join(PIECE_DIR, "fixtures")
TODAY = datetime.date(2026, 10, 2)


class TestLiveness(unittest.TestCase):
    # Each allowed label maps to its factor from the brief.
    def test_label_values(self):
        for label, factor in [("active", 1.0), ("uncertain", 0.5), ("expired", 0.0)]:
            with self.subTest(label=label):
                self.assertEqual(gates.liveness_factor(label)["factor"], factor)

    # A missing label must stop here; the scorer would treat it as 1.
    def test_missing_label_raises(self):
        with self.assertRaises(gates.GateError):
            gates.liveness_factor(None)

    # Any other label, including a plausible one, must stop.
    def test_other_labels_raise(self):
        for label in ["live", "Active", ""]:
            with self.subTest(label=label), self.assertRaises(gates.GateError):
                gates.liveness_factor(label)

    # "record" only when the saved evidence file really exists.
    def test_source_record_with_existing_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            evidence = os.path.join(tmp, "ats-liveness-output.txt")
            with open(evidence, "w", encoding="utf-8") as fh:
                fh.write("active  https://example.com/job/1\n")
            result = gates.liveness_factor("active", evidence)
        self.assertEqual(result["source"], "record")
        self.assertTrue(result["evidence_found"])

    # No evidence, or a path that does not exist → typed fixture value.
    def test_source_fixture_without_evidence(self):
        self.assertEqual(gates.liveness_factor("active")["source"], "your-input (fixture)")
        missing = gates.liveness_factor("active", os.path.join(FIXTURES, "no-such-file.txt"))
        self.assertEqual(missing["source"], "your-input (fixture)")
        self.assertFalse(missing["evidence_found"])


class TestLoadProfile(unittest.TestCase):
    # Priya's real persona fields come through as typed values.
    def test_priya_fields(self):
        visa = gates.load_profile(PRIYA)
        self.assertEqual(visa["unemployment_days_used"], 34)
        self.assertEqual(visa["unemployment_ceiling"], 90)
        self.assertEqual(visa["opt_end_date"], datetime.date(2027, 1, 31))

    # A missing required field is an error that names the field.
    def test_missing_ceiling_raises(self):
        with self.assertRaises(gates.ProfileError) as ctx:
            gates.load_profile(os.path.join(FIXTURES, "visa.missing-ceiling.yml"))
        self.assertIn("visa.unemployment_ceiling", str(ctx.exception))


class TestTimelinePriya(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.visa = gates.load_profile(PRIYA)

    # 90 − 34 = 56 days left; min(2026-11-27, 2027-01-31) = 2026-11-27.
    def test_remaining_and_deadline(self):
        result = gates.timeline_factor(self.visa, TODAY, 12)
        self.assertEqual(result["remaining_days"], 56)
        self.assertEqual(result["deadline"], datetime.date(2026, 11, 27))

    # 12 weeks → starts 2026-12-25, after the deadline → 0.
    def test_twelve_weeks_is_zero(self):
        result = gates.timeline_factor(self.visa, TODAY, 12)
        self.assertEqual(result["expected_start"], datetime.date(2026, 12, 25))
        self.assertEqual(result["factor"], 0.0)

    # 3 weeks → starts 2026-10-23, before the 2026-10-28 cutoff → 1.0.
    def test_three_weeks_is_full_credit(self):
        self.assertEqual(gates.timeline_factor(self.visa, TODAY, 3)["factor"], 1.0)

    # 6 weeks → starts 2026-11-13; (2026-11-27 − 2026-11-13) / 30 = 14/30.
    def test_six_weeks_is_linear(self):
        self.assertAlmostEqual(gates.timeline_factor(self.visa, TODAY, 6)["factor"], 0.467, places=3)

    # No lag given → the documented 12-week default is used and recorded.
    def test_default_lag_recorded(self):
        result = gates.timeline_factor(self.visa, TODAY)
        self.assertEqual(result["hiring_lag_weeks"], 12)
        self.assertTrue(result["default_used"])
        self.assertEqual(result["factor"], 0.0)

    # Every date the report needs is in the result, and the source is labeled.
    def test_returns_all_dates(self):
        result = gates.timeline_factor(self.visa, TODAY, 6)
        for key in ["today", "remaining_days", "deadline", "expected_start",
                    "hiring_lag_weeks", "default_used", "full_credit_cutoff"]:
            self.assertIn(key, result)
        self.assertEqual(result["source"], "your-input")


class TestTimelineStops(unittest.TestCase):
    # All 90 days used → factor 0 with a reason, even for a fast role.
    def test_days_exhausted(self):
        visa = gates.load_profile(os.path.join(FIXTURES, "visa.days-exhausted.yml"))
        result = gates.timeline_factor(visa, TODAY, 1)
        self.assertEqual(result["factor"], 0.0)
        self.assertIn("no-unemployment-days-left", result["reasons"])

    # OPT ended before today → factor 0 with a reason.
    def test_opt_ended(self):
        visa = gates.load_profile(os.path.join(FIXTURES, "visa.opt-ended.yml"))
        result = gates.timeline_factor(visa, TODAY, 1)
        self.assertEqual(result["factor"], 0.0)
        self.assertIn("opt-ended", result["reasons"])

    # opt_end_date: null means unknown: deadline uses remaining days only.
    def test_unknown_opt_end(self):
        visa = {"unemployment_days_used": 34, "unemployment_ceiling": 90, "opt_end_date": None}
        result = gates.timeline_factor(visa, TODAY, 3)
        self.assertEqual(result["deadline"], datetime.date(2026, 11, 27))
        self.assertFalse(result["opt_end_known"])

    # The caller must pass a date; a datetime (a clock reading) is refused.
    def test_today_must_be_a_date(self):
        visa = gates.load_profile(PRIYA)
        with self.assertRaises(gates.GateError):
            gates.timeline_factor(visa, datetime.datetime(2026, 10, 2, 9, 0), 6)

    # Part-weeks and booleans are refused; date maths would truncate them.
    def test_bad_lag_raises(self):
        visa = gates.load_profile(PRIYA)
        for lag in [6.5, True, -1]:
            with self.subTest(lag=lag), self.assertRaises(gates.GateError):
                gates.timeline_factor(visa, TODAY, lag)


if __name__ == "__main__":
    unittest.main()
