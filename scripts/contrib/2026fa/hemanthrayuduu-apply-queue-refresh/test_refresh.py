"""Offline tests for the apply-queue refresh (stdlib unittest; no network, no browser).

Run:  python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py' -v
"""
import datetime as dt
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
FIX = HERE / "fixtures"
SCRIPT = HERE / "refresh.py"
PRIYA = REPO / "search" / "examples" / "priya-nair"

spec = importlib.util.spec_from_file_location("aqr_refresh", SCRIPT)
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)

BASE = ["--queue", str(FIX / "queue.fixture.json"), "--snapshot", str(FIX / "snapshot"),
        "--csv", str(FIX / "80days.fixture.csv"), "--today", "2026-10-19"]
OFFLINE_ENV = {**os.environ, "REFRESH_FORBID_NETWORK": "1"}


def cli(args, env=None):
    p = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, cwd=str(REPO),
                       env=env or OFFLINE_ENV, timeout=180)
    return p.returncode, p.stdout, p.stderr


def by_key(log):
    return {p["key"]: p for p in log["postings"]}


class OfflineRun(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / "run"
        cls.rc, cls.stdout, cls.stderr = cli(BASE + ["--out-dir", str(cls.out)])
        cls.log = json.loads((cls.out / "refresh-log.json").read_text()) if cls.rc == 0 else None

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_run_exits_zero_and_writes_log_report_audit_and_engine_scores(self):
        self.assertEqual(self.rc, 0, self.stderr)
        for name in ("refresh-log.json", "refresh-report.md", "refresh-audit.md", "roles.json", "role-scores.json"):
            self.assertTrue((self.out / name).exists(), name)
        self.assertEqual(self.log["_tool"], "apply-queue-refresh")
        self.assertEqual(self.log["mode"], "offline")

    def test_live_posting_is_scored_with_both_gates_explicit(self):
        p = by_key(self.log)["lumenbyte-101"]
        self.assertEqual(p["liveness"]["verdict"], "live")
        self.assertEqual(p["liveness"]["factor"], 1.0)
        roles = {r["role_id"]: r for r in json.loads((self.out / "roles.json").read_text())}
        self.assertIsInstance(roles["lumenbyte-101"]["liveness"]["factor"], float)
        self.assertIsInstance(roles["lumenbyte-101"]["timeline"]["factor"], float)

    def test_closed_posting_is_zeroed_by_the_engine_scorer_itself(self):
        scores = {s["role_id"]: s for s in json.loads((self.out / "role-scores.json").read_text())["roles"]}
        self.assertEqual(scores["lumenbyte-102"]["recommendation"], "Skip")
        self.assertIn("gated: liveness", scores["lumenbyte-102"]["reason"])

    def test_uncertain_and_disagreeing_liveness_are_refused_not_scored(self):
        posts = by_key(self.log)
        roles = {r["role_id"] for r in json.loads((self.out / "roles.json").read_text())}
        for key, why in (("quietharbor-201", "uncertain"), ("quietharbor-202", "disagree")):
            self.assertEqual(posts[key]["liveness"]["verdict"], "investigate")
            self.assertIsNone(posts[key]["liveness"]["factor"])
            self.assertIn(why, posts[key]["liveness"]["reason"])
            self.assertNotIn(key, roles)

    def test_timeline_gate_for_priya_at_42_days_is_partial_with_its_dates(self):
        t = self.log["timeline"]
        self.assertEqual(t["factor"], 0.7)
        self.assertEqual(t["dates"]["expected_start"], "2026-11-30")
        self.assertIn("14 unemployment days left", t["basis"])
        self.assertIsNotNone(t["stem_what_if"])

    def test_timeline_sensitivity_shows_the_other_start_times(self):
        self.assertEqual(self.log["timeline"]["sensitivity"], {"35": 1.0, "42": 0.7, "70": 0.0})
        self.assertIn("35 days → 1.0", (self.out / "refresh-report.md").read_text())

    def test_rules_are_confirmed_by_the_owner_not_proposals(self):
        rules = json.loads((HERE / "rules.json").read_text())
        self.assertTrue(rules["status"].startswith("confirmed by Hemanth Rayudu"), rules["status"])
        self.assertNotIn("PROPOSED", json.dumps(rules))
        self.assertEqual(self.log["rules_status"], rules["status"])

    def test_fit_is_greenhouse_watch_judge_on_the_scheme_scale(self):
        p = by_key(self.log)["lumenbyte-101"]["fit"]
        self.assertEqual(p["scheme_max"], 13.0)
        self.assertEqual(p["score"], 8.0)
        self.assertEqual(p["p"], round(8.0 / 13.0, 3))
        self.assertEqual(p["source"], "record")
        self.assertTrue(any("LangGraph" in line for line in p["lines"]))

    def test_scorer_runs_without_profile_and_confirms_sponsorship_needed(self):
        self.assertNotIn("--profile", self.log["scorer"]["command"])
        scores = json.loads((self.out / "role-scores.json").read_text())
        self.assertIs(scores["profile_needs_sponsorship"], True)
        self.assertEqual(scores["_scorer"], "bayesian-role-scorer")

    def test_missing_bls_score_is_unknown_never_guessed(self):
        rq = by_key(self.log)["lumenbyte-102"]["role_quality"]
        self.assertEqual(rq["soc"], "15-2051.00")
        self.assertIsNone(rq["cognitive_pivot_score"])
        self.assertIn("no cognitive_pivot_score", rq["status"])
        self.assertIsNotNone(by_key(self.log)["lumenbyte-101"]["role_quality"]["cognitive_pivot_score"])

    def test_sponsorship_records_are_cross_checked_against_the_csv(self):
        posts = by_key(self.log)
        self.assertEqual(posts["lumenbyte-101"]["sponsorship"]["records_check"]["result"], "match")
        self.assertEqual(posts["quietharbor-201"]["sponsorship"]["records_check"]["result"], "mismatch")

    def test_raw_outputs_are_kept_redacted_and_hashed(self):
        raw = self.out / "raw"
        self.assertTrue((raw / "liveness.txt").exists())
        body = (raw / "api" / "lumenbyte-101.json").read_text()
        self.assertNotRegex(body, r"[\w.+-]+@[\w-]+\.[\w.]+")
        self.assertNotRegex(body, r"\(\d{3}\)\s*\d{3}-\d{4}")
        for rel, meta in self.log["raw_files"].items():
            self.assertEqual(hashlib.sha256((self.out / rel).read_bytes()).hexdigest(), meta["sha256"], rel)
        self.assertGreaterEqual(self.log["raw_files"]["raw/api/lumenbyte-101.json"]["redactions"], 2)

    def test_evidence_lines_surface_the_deciding_sentences(self):
        lines = by_key(self.log)["lumenbyte-101"]["description"]["evidence_lines"]
        self.assertTrue(any("sponsor visas" in l for l in lines), lines)
        self.assertTrue(any("3+ years" in l for l in lines), lines)

    def test_report_and_audit_open_with_an_executive_summary(self):
        for name in ("refresh-report.md", "refresh-audit.md"):
            lines = (self.out / name).read_text().splitlines()
            self.assertTrue(lines[0].startswith("# "), name)
            self.assertEqual(lines[2], "## Executive summary", name)

    def test_scorer_output_in_the_log_carries_no_temporary_paths(self):
        out = self.log["scorer"]
        self.assertNotIn("refresh-stage-", out["stdout"])
        self.assertIn(f"{self.out.name}/role-scores.json", out["stdout"])
        self.assertIn("staging", out["command"])

    def test_offline_report_says_the_liveness_comes_from_a_recording(self):
        report = (self.out / "refresh-report.md").read_text()
        self.assertIn("**Liveness source:** a recorded snapshot", report)

    def test_run_record_names_the_liveness_source_in_words(self):
        report = (self.out / "refresh-report.md").read_text()
        self.assertIn("Liveness source: offline snapshot", report)
        self.assertNotIn("{'path'", report)

    def test_soc_choice_is_labeled_when_the_queue_does_not_say(self):
        report = (self.out / "refresh-report.md").read_text()
        self.assertIn("SOC chosen by", report)
        self.assertIn("not stated in the queue", report)

    def test_audit_says_unknown_not_none_without_a_baseline(self):
        audit = (self.out / "refresh-audit.md").read_text()
        self.assertIn("description changed: unknown (no baseline)", audit)
        self.assertNotIn("None", audit)

    def test_audit_counts_records_in_and_out(self):
        a = self.log["counts"]
        self.assertEqual((a["queued"], a["live"], a["closed"], a["investigate"], a["scored"]), (4, 1, 1, 2, 2))


class TimelineGate(unittest.TestCase):
    PRIYA_VISA = {"type": "F-1", "ead_start_date": "2026-02-01", "opt_end_date": "2027-01-31",
                  "unemployment_days_used": 34, "unemployment_ceiling": 90, "buffer_target": 20, "stem_eligible": True}
    TODAY = dt.date(2026, 10, 19)

    def test_comfortable_runway_is_one(self):
        visa = {**self.PRIYA_VISA, "unemployment_days_used": 0, "opt_end_date": "2027-06-30"}
        self.assertEqual(R.timeline_gate(visa, self.TODAY, 42)["factor"], 1.0)

    def test_buffer_eaten_is_partial(self):
        self.assertEqual(R.timeline_gate(self.PRIYA_VISA, self.TODAY, 42)["factor"], 0.7)

    def test_ceiling_reached_before_start_is_zero(self):
        t = R.timeline_gate(self.PRIYA_VISA, self.TODAY, 70)
        self.assertEqual(t["factor"], 0.0)
        self.assertIn("ceiling", t["basis"])

    def test_start_after_authorization_end_is_zero(self):
        t = R.timeline_gate({**self.PRIYA_VISA, "opt_end_date": "2026-11-15"}, self.TODAY, 42)
        self.assertEqual(t["factor"], 0.0)
        self.assertIn("after the authorization end", t["basis"])

    def test_clock_not_started_yet_counts_from_the_opt_start(self):
        visa = {**self.PRIYA_VISA, "ead_start_date": "2027-03-01", "opt_end_date": "2028-02-28", "unemployment_days_used": 0}
        t = R.timeline_gate(visa, self.TODAY, 42)
        self.assertEqual(t["factor"], 1.0)
        self.assertTrue(any("before the OPT start" in n for n in t["notes"]))

    def test_stem_what_if_is_shown_but_never_used_as_the_gate(self):
        t = R.timeline_gate(self.PRIYA_VISA, self.TODAY, 70)
        self.assertEqual(t["factor"], 0.0)
        self.assertEqual(t["stem_what_if"]["ceiling"], 150)
        self.assertEqual(t["stem_what_if"]["factor"], 1.0)
        self.assertIn("DSO", t["stem_what_if"]["note"])

    def test_missing_input_stops_the_run(self):
        visa = {k: v for k, v in self.PRIYA_VISA.items() if k != "unemployment_days_used"}
        with self.assertRaises(R.StopRun):
            R.timeline_gate(visa, self.TODAY, 42)


class Units(unittest.TestCase):
    def test_parse_liveness_reads_every_line_and_reason(self):
        got = R.parse_liveness((FIX / "snapshot" / "liveness.txt").read_text())
        self.assertEqual(len(got), 4)
        self.assertEqual(got["https://job-boards.greenhouse.io/lumenbyte/jobs/102"], {"result": "expired", "reason": "HTTP 404"})
        self.assertEqual(got["https://job-boards.greenhouse.io/quietharbor/jobs/201"]["result"], "uncertain")
        self.assertEqual(got["https://job-boards.greenhouse.io/quietharbor/jobs/202"]["result"], "active")

    def test_liveness_gate_table(self):
        rules = json.loads((HERE / "rules.json").read_text())
        self.assertEqual(R.liveness_gate("active", "present", rules)[:2], (1.0, "live"))
        self.assertEqual(R.liveness_gate("expired", "gone", rules)[:2], (0.0, "closed"))
        for page, api in (("uncertain", "present"), ("active", "gone"), ("expired", "present"), ("active", "error"), (None, "present")):
            self.assertEqual(R.liveness_gate(page, api, rules)[:2], (None, "investigate"), (page, api))

    def test_redact_removes_emails_and_phones(self):
        text, n = R.redact("Write to jobs@example.com or call (617) 555-0100 / 617-555-0101.")
        self.assertEqual(n, 3)
        self.assertNotIn("@", text)
        self.assertNotRegex(text, r"\d{3}-\d{4}")

    def test_scheme_max_of_the_default_scheme(self):
        scheme = json.loads((REPO / ".claude" / "skills" / "greenhouse-watch" / "scheme.default.json").read_text())
        self.assertEqual(R.scheme_max(scheme), 13.0)


class StopConditions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.t = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def assert_refused(self, args, needle, env=None):
        out = self.t / "out"
        rc, _, err = cli(args + ["--out-dir", str(out)], env=env)
        self.assertEqual(rc, 1, err)
        self.assertIn(needle, err)
        self.assertFalse(out.exists() and any(out.iterdir()), "a refused run must write nothing")

    def test_persona_not_needing_sponsorship_is_refused(self):
        self.assert_refused(BASE + ["--persona", str(REPO / "search" / "examples" / "rohan-desai")], "does not need sponsorship")

    def test_persona_without_explicit_needs_sponsorship_is_refused(self):
        self.assert_refused(BASE + ["--persona", str(REPO / "search" / "examples" / "aarav-patel")], "not stated explicitly")

    def test_malformed_queue_halts(self):
        q = json.loads((FIX / "queue.fixture.json").read_text())
        del q["postings"][0]["job_id"]
        bad = self.t / "bad-queue.json"
        bad.write_text(json.dumps(q))
        args = list(BASE)
        args[1] = str(bad)
        self.assert_refused(args, "job_id")

    def test_dry_run_writes_nothing(self):
        out = self.t / "dry"
        rc, stdout, err = cli(BASE + ["--dry-run", "--out-dir", str(out)])
        self.assertEqual(rc, 0, err)
        self.assertIn("DRY RUN", stdout)
        self.assertFalse(out.exists())

    def test_non_example_persona_must_write_into_private(self):
        mine = self.t / "my-search"
        shutil.copytree(PRIYA, mine)
        self.assert_refused(BASE + ["--persona", str(mine)], "private/")

    def test_untracked_persona_inside_examples_is_not_treated_as_committed(self):
        """Review finding 2026-10-21: the guard checked the folder's location, not whether git tracks it."""
        sneaky = REPO / "search" / "examples" / "zz-untracked-test-persona"
        try:
            shutil.copytree(PRIYA, sneaky)
            self.assert_refused(BASE + ["--persona", str(sneaky)], "private/")
        finally:
            shutil.rmtree(sneaky, ignore_errors=True)

    def test_untracked_queue_inside_the_tool_folder_is_not_public(self):
        stray = FIX / "zz-untracked-queue.json"
        try:
            shutil.copy(FIX / "queue.fixture.json", stray)
            args = list(BASE)
            args[1] = str(stray)
            self.assert_refused(args, "private/")
        finally:
            if stray.exists():
                stray.unlink()

    def test_record_folder_must_be_private_for_non_example_inputs(self):
        mine = self.t / "my-search"
        shutil.copytree(PRIYA, mine)
        out = REPO / "private" / "zz-test-run"
        try:
            rc, _, err = cli(BASE + ["--persona", str(mine), "--live", "--record", str(self.t / "rec"), "--out-dir", str(out)])
            self.assertEqual(rc, 1, err)
            self.assertIn("--record", err)
            self.assertFalse((self.t / "rec").exists())
        finally:
            shutil.rmtree(out, ignore_errors=True)

    def test_refuses_a_folder_it_did_not_write(self):
        out = self.t / "occupied"
        out.mkdir()
        (out / "notes.txt").write_text("someone else's file")
        rc, _, err = cli(BASE + ["--out-dir", str(out)])
        self.assertEqual(rc, 1, err)
        self.assertIn("refusing to write", err)
        self.assertEqual(sorted(p.name for p in out.iterdir()), ["notes.txt"])


class BreakAttempts(unittest.TestCase):
    """Negative control: the run's own invariant must catch a broken liveness gate."""

    def test_broken_gate_is_caught_before_the_scorer_runs(self):
        bspec = importlib.util.spec_from_file_location("broken_gate", FIX / "BROKEN-liveness-gate.py")
        broken = importlib.util.module_from_spec(bspec)
        bspec.loader.exec_module(broken)
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "run"
            real_gate = R.liveness_gate
            try:
                R.liveness_gate = broken.liveness_gate
                with self.assertRaises(R.StopRun) as ctx:
                    R.run(R.parse_args(BASE + ["--out-dir", str(out)]))
            finally:
                R.liveness_gate = real_gate
            self.assertIn("invariant", str(ctx.exception))
            self.assertFalse((out / "role-scores.json").exists())

    def test_real_gate_passes_the_same_invariant(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = R.run(R.parse_args(BASE + ["--out-dir", str(Path(tmp) / "run")]))
            self.assertEqual(log["invariant_violations"], [])


class Baselines(unittest.TestCase):
    def test_description_edit_is_flagged_against_last_weeks_log(self):
        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp) / "w1", Path(tmp) / "w2"
            self.assertEqual(cli(BASE + ["--out-dir", str(first)])[0], 0)
            args = list(BASE)
            args[3] = str(FIX / "snapshot-edited")
            rc, _, err = cli(args + ["--baseline", str(first / "refresh-log.json"), "--out-dir", str(second)])
            self.assertEqual(rc, 0, err)
            log = json.loads((second / "refresh-log.json").read_text())
            change = by_key(log)["lumenbyte-101"]["since_baseline"]
            self.assertTrue(change["description_changed"])
            self.assertIn("unable to sponsor", " ".join(by_key(log)["lumenbyte-101"]["description"]["evidence_lines"]))
            self.assertIn("Changed since the last refresh", (second / "refresh-report.md").read_text())

    def test_posting_gone_since_the_baseline_says_so_not_no_baseline(self):
        """Found on real data 2026-10-19: a posting that closed after the baseline was reported as 'no baseline'."""
        with tempfile.TemporaryDirectory() as tmp:
            first, second, snap = Path(tmp) / "w1", Path(tmp) / "w2", Path(tmp) / "snap"
            self.assertEqual(cli(BASE + ["--out-dir", str(first)])[0], 0)
            shutil.copytree(FIX / "snapshot", snap)
            (snap / "api" / "lumenbyte-101.json").unlink()
            st = json.loads((snap / "api-status.json").read_text())
            st["lumenbyte-101"] = {"status": 404}
            (snap / "api-status.json").write_text(json.dumps(st))
            live = (snap / "liveness.txt").read_text().replace(
                "✅ active     https://job-boards.greenhouse.io/lumenbyte/jobs/101",
                "❌ expired    https://job-boards.greenhouse.io/lumenbyte/jobs/101\n           HTTP 404")
            (snap / "liveness.txt").write_text(live)
            args = list(BASE)
            args[3] = str(snap)
            rc, _, err = cli(args + ["--baseline", str(first / "refresh-log.json"), "--out-dir", str(second)])
            self.assertEqual(rc, 0, err)
            audit = (second / "refresh-audit.md").read_text()
            self.assertIn("lumenbyte-101: liveness active → expired; description changed: n/a (no description now — the posting is gone)", audit)

    def test_metadata_only_change_is_reported(self):
        """Review finding 2026-10-21: an updated_at change with the same text was counted as 'nothing changed'."""
        with tempfile.TemporaryDirectory() as tmp:
            first, second, snap = Path(tmp) / "w1", Path(tmp) / "w2", Path(tmp) / "snap"
            self.assertEqual(cli(BASE + ["--out-dir", str(first)])[0], 0)
            shutil.copytree(FIX / "snapshot", snap)
            f = snap / "api" / "lumenbyte-101.json"
            f.write_text(f.read_text().replace("2026-10-10T12:00:00-04:00", "2026-10-20T09:00:00-04:00"))
            args = list(BASE)
            args[3] = str(snap)
            rc, _, err = cli(args + ["--baseline", str(first / "refresh-log.json"), "--out-dir", str(second)])
            self.assertEqual(rc, 0, err)
            report = (second / "refresh-report.md").read_text()
            section = report[report.index("## Changed since the last refresh"):report.index("## What the descriptions say")]
            self.assertIn("LUMEN BYTE INC — Machine Learning Engineer, Agents", section)
            self.assertIn("description text unchanged", section)

    def test_liveness_change_against_a_verbatim_baseline_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp) / "week0.txt"
            base.write_text("Checking 4 URL(s)...\n\n" + "".join(
                f"✅ active     https://job-boards.greenhouse.io/{k}\n"
                for k in ("lumenbyte/jobs/101", "lumenbyte/jobs/102", "quietharbor/jobs/201", "quietharbor/jobs/202"))
                + "\nResults: 4 active  0 expired  0 uncertain\n")
            out = Path(tmp) / "run"
            rc, _, err = cli(BASE + ["--baseline-liveness", str(base), "--out-dir", str(out)])
            self.assertEqual(rc, 0, err)
            posts = by_key(json.loads((out / "refresh-log.json").read_text()))
            self.assertEqual(posts["lumenbyte-102"]["since_baseline"]["liveness"], "active → expired")
            self.assertEqual(posts["lumenbyte-101"]["since_baseline"]["liveness"], "unchanged (active)")


class DocumentedCommand(unittest.TestCase):
    def test_documented_default_command_runs_offline_on_the_committed_sample(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "run"
            rc, _, err = cli(["--out-dir", str(out)])
            self.assertEqual(rc, 0, err)
            log = json.loads((out / "refresh-log.json").read_text())
            self.assertEqual(log["mode"], "offline")
            self.assertEqual(log["counts"]["queued"], 8)
            sources = {p["soc_source"]["source"] for p in log["postings"]}
            self.assertEqual(sources, {"record", "your-input"})
            self.assertIn("your-input — no O*NET title matched", (out / "refresh-report.md").read_text())


if __name__ == "__main__":
    unittest.main()
