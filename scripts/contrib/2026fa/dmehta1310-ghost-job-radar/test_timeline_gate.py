#!/usr/bin/env python3
"""
Offline test for timeline_gate.py. No network calls -- everything here
runs against fixed dates (a fixture), calling evaluate_timeline() directly
rather than shelling out to the CLI.

Run with:
    python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_timeline_gate.py
"""

import sys
import unittest
from datetime import date

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from timeline_gate import TimelineInputError, evaluate_timeline

FIXED_TODAY = date(2026, 9, 29)  # fixture: pretend "today" is fixed for determinism


class TestTimelineGate(unittest.TestCase):
    def test_pass_when_plenty_of_margin(self):
        result = evaluate_timeline("2027-05-15", 6, now=FIXED_TODAY)
        self.assertEqual(result["result"], "pass")
        self.assertEqual(result["projected_hire_date"]["value"], "2026-11-10")
        self.assertEqual(result["days_of_margin"], 186)

    def test_fail_when_hire_lands_after_end_date(self):
        result = evaluate_timeline("2026-10-15", 8, now=FIXED_TODAY)
        self.assertEqual(result["result"], "fail")
        self.assertEqual(result["projected_hire_date"]["value"], "2026-11-24")
        self.assertLess(result["days_of_margin"], 0)

    def test_boundary_exact_same_day_passes(self):
        result = evaluate_timeline("2026-11-10", 6, now=FIXED_TODAY)
        self.assertEqual(result["result"], "pass")
        self.assertEqual(result["days_of_margin"], 0)

    def test_every_value_is_labeled(self):
        result = evaluate_timeline("2027-01-01", 4, now=FIXED_TODAY)
        self.assertEqual(result["today"]["source"], "system-clock")
        self.assertEqual(result["cpt_program_end_date"]["source"], "your-input")
        self.assertEqual(result["hiring_lag_weeks"]["source"], "your-input")
        self.assertEqual(result["projected_hire_date"]["source"], "script-computed")

    def test_malformed_date_fails_clearly_not_silently(self):
        with self.assertRaises(TimelineInputError):
            evaluate_timeline("15-05-2027", 6, now=FIXED_TODAY)

    def test_negative_lag_weeks_fails_clearly(self):
        with self.assertRaises(TimelineInputError):
            evaluate_timeline("2027-05-15", -3, now=FIXED_TODAY)


if __name__ == "__main__":
    unittest.main()
