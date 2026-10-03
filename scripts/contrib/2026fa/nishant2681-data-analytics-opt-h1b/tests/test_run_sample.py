"""End-to-end tests for run_sample.py. Offline: uses fixtures/companies.sample.csv,
the fictional Priya Nair persona, and the existing scorer as a local node call.

These tests check gate behavior and output structure. They do not assert a
verdict for any role the candidate likes.

Run: python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PIECE_DIR = os.path.dirname(HERE)
REPO_ROOT = os.path.abspath(os.path.join(PIECE_DIR, "..", "..", "..", ".."))
FIXTURES = os.path.join(PIECE_DIR, "fixtures")
RUN_SAMPLE = os.path.join(PIECE_DIR, "run_sample.py")
PRIYA = os.path.join(REPO_ROOT, "search", "examples", "priya-nair", "profile.yml")
CSV = os.path.join(FIXTURES, "companies.sample.csv")

SOURCE_LABELS = {"record", "your-input", "your-input (fixture)", "model-judgment"}
TERMS = ["sponsorship", "fit", "liveness", "timeline"]


# Run run_sample.py as a separate program, exactly as a person would.
def run(jobs_file, out_dir, run_id="test-run"):
    command = [sys.executable, RUN_SAMPLE, "--profile", PRIYA, "--jobs", jobs_file, "--csv", CSV,
               "--today", "2026-10-02", "--run-id", run_id, "--out-dir", out_dir]
    return subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8")


class TestSampleRun(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = os.path.join(cls.tmp.name, "run")
        cls.result = run(os.path.join(FIXTURES, "jobs.sample.json"), cls.out)
        if cls.result.returncode != 0:
            raise RuntimeError(f"sample run failed:\n{cls.result.stderr}")
        with open(os.path.join(cls.out, "run-log.json"), encoding="utf-8") as fh:
            cls.log = json.load(fh)
        with open(os.path.join(cls.out, "scorer-input", "roles.json"), encoding="utf-8") as fh:
            cls.roles = json.load(fh)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    # The sample run succeeds and writes all three outputs plus the scorer's files.
    def test_exits_zero_and_writes_outputs(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        for name in ["run-log.json", "report.md", "test-run-audit.md", "scorer/role-scores.json"]:
            self.assertTrue(os.path.isfile(os.path.join(self.out, name)), name)
        self.assertFalse(os.path.exists(self.out + ".partial"))

    # Every term sent to the scorer, and every term in the log, carries a source label.
    def test_every_term_has_a_source_label(self):
        for records in (self.roles, self.log["roles"]):
            for role in records:
                for term in TERMS:
                    with self.subTest(role=role["role_id"], term=term):
                        self.assertIn(role[term]["source"], SOURCE_LABELS)

    # Unknown tiers send no p at all (never 0); others send their p.
    def test_unknown_tier_omits_p(self):
        for role in self.roles:
            with self.subTest(role=role["role_id"]):
                if role["sponsorship"]["tier"] == "Unknown":
                    self.assertNotIn("p", role["sponsorship"])
                else:
                    self.assertIn("p", role["sponsorship"])

    # A closed gate (timeline or liveness at 0) always ends in Skip, and the
    # next action is Drop.
    def test_closed_gate_is_skip(self):
        gated = [r for r in self.log["roles"] if r["timeline"]["factor"] == 0 or r["liveness"]["factor"] == 0]
        self.assertTrue(gated, "the sample should contain at least one closed gate")
        for role in gated:
            with self.subTest(role=role["role_id"]):
                self.assertEqual(role["scorer"]["recommendation"], "Skip")
                self.assertTrue(role["next_action"]["text"].startswith("Drop"))

    # A missing lag uses the documented default, and the log says so.
    def test_default_lag_recorded(self):
        defaults = [r for r in self.log["roles"] if r["timeline"]["default_used"]]
        self.assertTrue(defaults)
        for role in defaults:
            self.assertEqual(role["timeline"]["hiring_lag_weeks"], 12)

    # The next action never contradicts the scorer's decision.
    def test_next_action_follows_decision(self):
        for role in self.log["roles"]:
            decision, action = role["scorer"]["recommendation"], role["next_action"]["text"]
            with self.subTest(role=role["role_id"]):
                if decision == "Skip":
                    self.assertTrue(action.startswith("Drop"))
                else:
                    self.assertFalse(action.startswith("Drop"))
                    self.assertEqual(action.startswith("Tailor"), decision == "Apply")

    # Roles in equals roles out, and the report opens with the executive summary.
    def test_counts_and_report_shape(self):
        self.assertEqual(len(self.log["roles"]), len(self.roles))
        with open(os.path.join(self.out, "report.md"), encoding="utf-8") as fh:
            lines = fh.read().splitlines()
        self.assertTrue(lines[0].startswith("# "))
        self.assertEqual(lines[2], "## Executive summary")


class TestStops(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = os.path.join(self.tmp.name, "run")

    def tearDown(self):
        self.tmp.cleanup()

    # Nothing at all may be written when a run stops during validation.
    def assert_wrote_nothing(self):
        self.assertFalse(os.path.exists(self.out))
        self.assertFalse(os.path.exists(self.out + ".partial"))

    # "Deloitte" alone stops the run and lists all 7 candidate entities.
    def test_ambiguous_company(self):
        result = run(os.path.join(FIXTURES, "jobs.ambiguous.json"), self.out)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("deloitte-ambiguous", result.stderr)
        self.assertIn("matches 7 CSV rows", result.stderr)
        self.assertEqual(result.stderr.count("  - DELOITTE"), 7)
        self.assert_wrote_nothing()

    # A liveness label of "live" stops the run.
    def test_bad_liveness(self):
        result = run(os.path.join(FIXTURES, "jobs.bad-liveness.json"), self.out)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("'live'", result.stderr)
        self.assert_wrote_nothing()

    # A malformed jobs file stops the run.
    def test_malformed_json(self):
        bad = os.path.join(self.tmp.name, "broken.json")
        with open(bad, "w", encoding="utf-8") as fh:
            fh.write('{"target_titles": ["Data Analyst"], "jobs": [')
        result = run(bad, self.out)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("malformed JSON", result.stderr)
        self.assert_wrote_nothing()

    # An existing out-dir is never overwritten, and its contents are untouched.
    def test_existing_out_dir_refused(self):
        os.makedirs(self.out)
        keep = os.path.join(self.out, "keep.txt")
        with open(keep, "w", encoding="utf-8") as fh:
            fh.write("earlier run")
        result = run(os.path.join(FIXTURES, "jobs.sample.json"), self.out)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("already exists", result.stderr)
        self.assertEqual(os.listdir(self.out), ["keep.txt"])


class TestMissingInputs(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = os.path.join(self.tmp.name, "run")

    def tearDown(self):
        self.tmp.cleanup()

    # Run with the normal sample inputs, except one swapped for another path.
    def run_with(self, profile=PRIYA, jobs=os.path.join(FIXTURES, "jobs.sample.json"), csv_path=CSV):
        command = [sys.executable, RUN_SAMPLE, "--profile", profile, "--jobs", jobs, "--csv", csv_path,
                   "--today", "2026-10-02", "--run-id", "test-run", "--out-dir", self.out]
        return subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8")

    # A path inside the temp dir that is never created.
    def missing(self, name):
        return os.path.join(self.tmp.name, name)

    # The run must stop with exit 2, name the missing file, and write nothing.
    # Python prints the path in repr form (doubled backslashes on Windows),
    # so we look for repr(path) rather than the raw text.
    def assert_clean_stop(self, result, path):
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn("STOP", result.stderr)
        self.assertIn(repr(path), result.stderr)
        self.assertFalse(os.path.exists(self.out))
        self.assertFalse(os.path.exists(self.out + ".partial"))

    # A jobs file that does not exist stops the run cleanly.
    def test_missing_jobs_file(self):
        path = self.missing("missing-jobs.json")
        self.assert_clean_stop(self.run_with(jobs=path), path)

    # A persona profile that does not exist stops the run cleanly.
    def test_missing_profile_file(self):
        path = self.missing("missing-profile.yml")
        self.assert_clean_stop(self.run_with(profile=path), path)

    # A sponsorship CSV that does not exist stops the run cleanly.
    def test_missing_csv_file(self):
        path = self.missing("missing-companies.csv")
        self.assert_clean_stop(self.run_with(csv_path=path), path)


if __name__ == "__main__":
    unittest.main()
