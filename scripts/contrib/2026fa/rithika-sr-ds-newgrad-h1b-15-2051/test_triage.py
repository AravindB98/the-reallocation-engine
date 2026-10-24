"""Offline tests for triage.py: fixtures only, no network.
The real scorer (scripts/score/role-scorer.mjs) runs locally through node.

Run from the repo root:
  python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py" -v
"""
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import triage  # noqa: E402

FIX = HERE / "fixtures"
VISA = {"ead_start_date": "2027-01-05", "opt_end_date": "2028-01-04",
        "unemployment_days_used": 0, "unemployment_ceiling": 90, "buffer_days": 20}


class FixtureRun(unittest.TestCase):
    """One full run on invented fixtures, through the real scorer."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        code = triage.main([
            "--candidates", str(FIX / "candidates.test.json"),
            "--persona", str(FIX / "persona.example.json"),
            "--targets", str(FIX / "mini_targets.csv"),
            "--today", "2026-10-03",
            "--out-dir", cls.tmp.name,
        ])
        assert code == 0, "fixture run failed"
        out = Path(cls.tmp.name)
        cls.out = out
        cls.log = json.loads((out / "triage-log.json").read_text())
        cls.roles = json.loads((out / "roles.json").read_text())
        cls.held = {h["role_id"]: h for h in cls.log["held"]}
        cls.scored = {r["role_id"]: r for r in cls.log["scored"]}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_both_outputs_written(self):
        self.assertTrue((self.out / "triage-log.json").is_file())
        report = (self.out / "triage-report.md").read_text()
        self.assertIn("Human gate G4", report)

    def test_company_not_in_csv_is_held(self):           # failure case 1
        self.assertEqual(self.held["nimbus-ds"]["gate"], "G1")
        self.assertNotIn("nimbus-ds", [r["role_id"] for r in self.roles])

    def test_blank_approvals_held_not_zero(self):        # failure case 2
        self.assertEqual(self.held["quietharbor-ds"]["gate"], "G1")
        self.assertIn("not zero", self.held["quietharbor-ds"]["reason"])

    def test_unchecked_liveness_never_reaches_scorer(self):  # failure case 5
        self.assertEqual(self.held["northwind-ds2"]["gate"], "G2")
        for r in self.roles:   # scorer would default a missing liveness to 1.0
            self.assertIn("factor", r["liveness"])

    def test_common_name_misses_prediction_P3(self):
        self.assertEqual(self.held["kite-common-name"]["gate"], "G1")

    def test_one_keyword_too_narrow_prediction_P1(self):
        sp = self.scored["kite-legal-name"]["sponsorship"]
        self.assertEqual(sp["tier"], "Likely")
        self.assertEqual(sp["matched_titles"], [])

    def test_every_value_labeled(self):
        for r in self.roles:
            for term in ("sponsorship", "fit", "liveness", "timeline"):
                self.assertIn(r[term]["source"], {"record", "your-input"})

    def test_existing_scorer_decides(self):
        self.assertEqual(self.scored["northwind-ds1"]["decision"], "Apply")
        self.assertEqual(self.scored["bluefin-ghost"]["decision"], "Skip")

    def test_log_has_no_home_folder(self):              # privacy
        self.assertNotIn(str(Path.home()), json.dumps(self.log))


class TimelineGate(unittest.TestCase):                   # failure case 4
    def test_open_window(self):
        f, _ = triage.timeline_factor(VISA, 60, date(2026, 10, 3))
        self.assertEqual(f, 1.0)

    def test_tight_window(self):
        visa = {**VISA, "unemployment_days_used": 30}
        f, _ = triage.timeline_factor(visa, 60, date(2027, 2, 20))
        self.assertAlmostEqual(f, 0.667, places=3)       # (90-30-20)/60

    def test_closed_after_opt_end(self):
        f, _ = triage.timeline_factor(VISA, 60, date(2028, 2, 1))
        self.assertEqual(f, 0.0)

    def test_closed_no_days_left(self):
        visa = {**VISA, "unemployment_days_used": 70}
        f, _ = triage.timeline_factor(visa, 60, date(2026, 10, 3))
        self.assertEqual(f, 0.0)


class StopsInsteadOfInventing(unittest.TestCase):
    def test_refuses_to_write_into_tracked_repo_folder(self):
        with self.assertRaises(triage.InputError):
            triage.check_out_dir(triage.REPO / "data/examples", triage.ALLOWED_OUT_ROOTS)

    def test_missing_csv_stops(self):
        with self.assertRaises(triage.InputError):
            triage.load_targets(FIX / "does-not-exist.csv")

    def test_unknown_soc_reports_missing(self):          # failure case 3 (variant)
        self.assertEqual(triage.bls_row(triage.DEFAULT_BLS, "99-9999")["status"], "missing")

    def test_data_scientist_abilities_missing(self):     # failure case 3
        self.assertTrue(triage.bls_row(triage.DEFAULT_BLS, "15-2051")["abilities_missing"])


if __name__ == "__main__":
    unittest.main()
