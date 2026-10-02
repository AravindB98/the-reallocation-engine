#!/usr/bin/env python3
"""
Offline tests for the swe-h1b-15-1252 prototype. No network calls; fictional fixtures only.

Run from repo root:
  python3 -m unittest discover -s scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252 -p "test_*.py" -v
"""
import json
import shutil
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import run  # noqa: E402

FIX = HERE / "fixtures"
CSV = FIX / "fixture-companies.csv"
INPUT = FIX / "fixture-input.json"
TODAY = "2026-10-01"


class PrototypeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_main(self, inp=INPUT, out=None):
        out = out or self.tmp / "out"
        code = run.main(["--input", str(inp), "--csv", str(CSV), "--out-dir", str(out),
                         "--today", TODAY, "--no-score"])
        return code, out

    def roles(self, out):
        return {r["role_id"]: r for r in json.loads((out / "run.json").read_text())["roles"]}

    def test_every_role_gets_the_expected_route(self):
        code, out = self.run_main()
        self.assertEqual(code, 0)
        routes = {k: v["route"] for k, v in self.roles(out).items()}
        self.assertEqual(routes, {
            "proven-active": "score",
            "proven-expired": "score",
            "likely-no-posting": "network_target",
            "blank-approvals": "held",
            "not-in-csv": "held",
            "ambiguous-twin": "held",
            "zero-approvals": "skip",
            "liveness-uncertain": "held",
            "fit-unlabeled": "held",
        })

    def test_blank_approvals_are_not_treated_as_zero(self):
        _, out = self.run_main()
        sp = self.roles(out)["blank-approvals"]["sponsorship"]
        self.assertEqual(sp["status"], "no_record")
        self.assertNotIn("p", sp)
        self.assertIn("blank", sp["reason"])

    def test_every_term_sent_to_scorer_is_labeled(self):
        _, out = self.run_main()
        scored = json.loads((out / "roles.json").read_text())
        self.assertEqual(len(scored), 2)
        for role in scored:
            for term in ("sponsorship", "fit", "liveness", "timeline"):
                self.assertIn(role[term]["source"], run.LABELS, f"{role['role_id']}.{term}")
        expired = [r for r in scored if r["role_id"] == "proven-expired"][0]
        self.assertEqual(expired["liveness"]["factor"], 0.0)

    def test_personal_columns_are_never_copied(self):
        _, out = self.run_main()
        for f in out.iterdir():
            self.assertNotIn("FAKE-PHONE", f.read_text(), f.name)

    def test_past_opt_date_fails_without_writing_outputs(self):
        data = json.loads(INPUT.read_text())
        data["persona"]["opt_end_date"] = "2026-09-01"
        bad = self.tmp / "past-opt.json"
        bad.write_text(json.dumps(data))
        code, out = self.run_main(inp=bad)
        self.assertEqual(code, 2)
        self.assertFalse(out.exists())

    def test_timeline_factor_linear_band(self):
        tl = run.timeline_for({"opt_end_date": "2026-12-30", "hiring_lag_days": 60}, date(2026, 10, 1))
        self.assertEqual(tl["days_left"], 90)
        self.assertEqual(tl["factor"], 0.5)
        self.assertEqual(tl["source"], "your-input")

    def test_refuses_to_write_over_tracked_repo_paths(self):
        code, _ = self.run_main(out=run.REPO / "data/examples")
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()