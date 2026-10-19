"""Offline tests for guard.py, the input check that runs before the engine's scorer.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
REPO = HERE.parents[3]
FIXTURES = HERE / "fixtures"
SCORER = REPO / "scripts" / "score" / "role-scorer.mjs"

spec = importlib.util.spec_from_file_location("guard", HERE / "guard.py")
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


def load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def valid_role() -> dict:
    return copy.deepcopy(load("guard-valid.json")["roles"][0])


class GuardRules(unittest.TestCase):
    def test_a_complete_labelled_role_passes(self):
        self.assertEqual(guard.validate(load("guard-valid.json")), [])

    def test_a_missing_liveness_gate_is_refused(self):
        problems = guard.validate(load("BROKEN-missing-liveness.json"))
        self.assertEqual(len(problems), 1)
        self.assertIn("liveness is missing", problems[0])

    def test_a_gate_written_as_text_is_refused(self):
        problems = guard.validate(load("BROKEN-string-gate.json"))
        self.assertEqual(len(problems), 1)
        self.assertIn("liveness.factor must be a number", problems[0])

    def test_a_probability_outside_0_to_1_is_refused(self):
        problems = guard.validate(load("BROKEN-p-out-of-range.json"))
        self.assertEqual(len(problems), 1)
        self.assertIn("fit.p must be a number between 0 and 1, got 5", problems[0])

    def test_every_unknown_source_label_is_reported(self):
        problems = guard.validate(load("BROKEN-unknown-label.json"))
        self.assertEqual(len(problems), 4)
        self.assertTrue(all(".source must be one of" in p for p in problems))

    def test_a_missing_timeline_gate_is_refused(self):
        role = valid_role()
        del role["timeline"]
        problems = guard.validate([role])
        self.assertEqual(len(problems), 1)
        self.assertIn("timeline is missing", problems[0])

    def test_a_misspelt_gate_is_refused_not_ignored(self):
        role = valid_role()
        role["livenes"] = role.pop("liveness")
        problems = guard.validate([role])
        self.assertTrue(any("livenes is not a scorer field" in p for p in problems))
        self.assertTrue(any("liveness is missing" in p for p in problems))

    def test_role_quality_is_refused_because_this_mode_does_not_use_it(self):
        role = valid_role()
        role["role_quality"] = {"p": 1, "source": "record"}
        self.assertTrue(any("role_quality" in p for p in guard.validate([role])))

    def test_an_override_without_a_reason_is_refused(self):
        role = valid_role()
        role["override"] = {"decision": "Apply", "reason": "   "}
        self.assertTrue(any("override.reason is required" in p for p in guard.validate([role])))

    def test_duplicate_role_ids_are_refused(self):
        self.assertTrue(any("duplicated" in p for p in guard.validate([valid_role(), valid_role()])))

    def test_a_boolean_is_not_a_number(self):
        role = valid_role()
        role["liveness"]["factor"] = True
        self.assertTrue(any("liveness.factor must be a number" in p for p in guard.validate([role])))

    def test_not_a_number_and_infinity_are_refused(self):
        for bad in (float("nan"), float("inf")):
            role = valid_role()
            role["timeline"]["factor"] = bad
            self.assertTrue(any("timeline.factor must be a number" in p for p in guard.validate([role])), bad)

    def test_an_empty_batch_is_refused(self):
        self.assertTrue(guard.validate([]))
        self.assertTrue(guard.validate({"roles": []}))
        self.assertTrue(guard.validate("not a batch"))


class GuardCommandLine(unittest.TestCase):
    def run_guard(self, *args):
        return subprocess.run([sys.executable, str(HERE / "guard.py"), *args], capture_output=True, text=True)

    def test_exit_codes(self):
        self.assertEqual(self.run_guard(str(FIXTURES / "guard-valid.json")).returncode, 0)
        refused = self.run_guard(str(FIXTURES / "BROKEN-missing-liveness.json"))
        self.assertEqual(refused.returncode, 3)
        self.assertIn("nothing was sent to the scorer", refused.stdout)
        self.assertEqual(self.run_guard(str(FIXTURES / "does-not-exist.json")).returncode, 2)


class EngineScorerStillFailsOpen(unittest.TestCase):
    """Documents the engine defect the guard exists for. If these tests start failing, the
    engine has fixed it: update the recipe's 'Why the guard' note instead of deleting them.
    (The skip lives in setUp, not in a class decorator: the repo's branch-diff privacy scan reads an
    added decorator line with a dotted name as an email address.)"""

    def setUp(self):
        if not (shutil.which("node") and SCORER.exists()):
            self.skipTest("needs node and the engine's scorer")

    def score(self, fixture: str) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            proc = subprocess.run(["node", str(SCORER), str(FIXTURES / fixture), "--out-dir", tmp],
                                  capture_output=True, text=True, cwd=REPO)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            return json.loads((Path(tmp) / "role-scores.json").read_text(encoding="utf-8"))["roles"][0]

    def test_without_a_liveness_gate_the_scorer_says_apply(self):
        self.assertEqual(self.score("BROKEN-missing-liveness.json")["recommendation"], "Apply")

    def test_a_closed_gate_written_as_text_still_comes_out_apply(self):
        self.assertEqual(self.score("BROKEN-string-gate.json")["recommendation"], "Apply")

    def test_a_fit_of_5_pushes_the_composite_above_1(self):
        self.assertGreater(self.score("BROKEN-p-out-of-range.json")["composite"], 1)


if __name__ == "__main__":
    unittest.main()
