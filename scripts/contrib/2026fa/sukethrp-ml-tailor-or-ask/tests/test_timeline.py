"""Offline tests for timeline.py, the computed visa-timeline factor (book chapter 10; new in v0.2.0).

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import datetime as dt
import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("timeline", HERE / "timeline.py")
tl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tl)

# Kavya Raman's visa block (search/examples/kavya-raman/profile.yml), as the engine's YAML bridge returns dates
KAVYA = {"ead_start_date": "2027-01-04T00:00:00.000Z", "opt_end_date": "2028-01-03T00:00:00.000Z",
         "unemployment_days_used": 0, "unemployment_days_as_of": "2026-10-19T00:00:00.000Z",
         "unemployment_ceiling": 90, "buffer_target": 20}
RUN = dt.date(2026, 10, 19)


class KavyaBeforeHerEad(unittest.TestCase):
    def test_a_12_week_process_lands_inside_the_buffer(self):
        got = tl.compute(KAVYA, RUN, 12)
        self.assertEqual((got["factor"], got["dates"]["expected_start"], got["dates"]["target_start"],
                          got["dates"]["latest_start"]), (1.0, "2027-01-11", "2027-03-15", "2027-04-04"))

    def test_a_22_week_process_eats_into_the_buffer(self):
        got = tl.compute(KAVYA, RUN, 22)  # expected 2027-03-22: 13 of the buffer's 20 days left
        self.assertEqual((got["factor"], got["dates"]["expected_start"]), (0.65, "2027-03-22"))

    def test_a_24_week_process_is_skip_regardless(self):
        got = tl.compute(KAVYA, RUN, 24)  # expected 2027-04-05, a day past the latest start
        self.assertEqual(got["factor"], 0.0)
        self.assertIn("skip regardless", got["why"])

    def test_no_start_is_expected_before_the_ead(self):
        self.assertEqual(tl.compute(KAVYA, RUN, 2)["dates"]["expected_start"], "2027-01-04")


class OnOpt(unittest.TestCase):
    def test_the_clock_keeps_running_from_the_as_of_date(self):
        visa = {"ead_start_date": "2026-02-01", "opt_end_date": "2027-01-31", "unemployment_days_used": 34,
                "unemployment_days_as_of": "2026-10-09", "unemployment_ceiling": 90, "buffer_target": 20}
        got = tl.compute(visa, RUN, 4)  # 10 more days have run: 44 used, 46 left from the run date
        self.assertEqual((got["days_left"], got["dates"]["latest_start"]), (46, "2026-12-04"))

    def test_the_opt_end_caps_the_latest_start(self):
        visa = {**KAVYA, "opt_end_date": "2027-02-01"}
        self.assertEqual(tl.compute(visa, RUN, 12)["dates"]["latest_start"], "2027-02-01")


class MissingDates(unittest.TestCase):
    def test_a_missing_or_unreadable_date_holds_instead_of_guessing(self):
        got = tl.compute({**KAVYA, "unemployment_days_as_of": None}, RUN, 12)
        self.assertEqual((got["result"], got["code"]), ("unresolved", "timeline-dates-missing"))
        bad = tl.compute({**KAVYA, "ead_start_date": "next spring"}, RUN, 12)
        self.assertTrue(any("unreadable" in m for m in bad["missing"]))


if __name__ == "__main__":
    unittest.main()
