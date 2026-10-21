"""Offline tests for mode_run.py: fixtures only, no network (--offline everywhere).
The real scorer (scripts/score/role-scorer.mjs) runs locally through node.
Test outputs go to throwaway folders under course/2026fa/submissions/rithika-sr/mode/,
because mode_run.py refuses to write anywhere else.

Run from the repo root:
  python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mode_run  # noqa: E402

FIX = HERE / "fixtures"
OLD_FIX = mode_run.OLD / "fixtures"
CANDIDATES = FIX / "candidates.mode.test.json"
OFFLINE = FIX / "liveness.offline.json"
TEST_HOSTS = FIX / "ats_hosts.test.json"
MODE_OUT = mode_run.OUT_ROOT / "mode"


def run_args(out_dir, candidates=CANDIDATES, offline=OFFLINE):
    return ["--candidates", str(candidates),
            "--persona", str(OLD_FIX / "persona.example.json"),
            "--targets", str(OLD_FIX / "mini_targets.csv"),
            "--ats-hosts", str(TEST_HOSTS),
            "--offline", str(offline),
            "--today", "2026-10-03",
            "--out-dir", str(out_dir)]


def scratch():
    MODE_OUT.mkdir(parents=True, exist_ok=True)
    return tempfile.TemporaryDirectory(dir=MODE_OUT, prefix=".test-")


class FixtureRun(unittest.TestCase):
    """One full offline run on invented fixtures, through the real scorer."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = scratch()
        cls.out = Path(cls.tmp.name)
        assert mode_run.main(run_args(cls.out)) == 0, "fixture run failed"
        cls.log = json.loads((cls.out / "mode-log.json").read_text(encoding="utf-8"))
        cls.report = (cls.out / "mode-report.md").read_text(encoding="utf-8")
        cls.sent = json.loads((cls.out / "roles.json").read_text(encoding="utf-8"))
        cls.roles = {r["role_id"]: r for r in cls.log["roles"]}
        cls.fixture = json.loads(OFFLINE.read_text(encoding="utf-8"))["results"]

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def held(self, rid):
        return self.roles[rid]["held"]

    # --- G2b aggregator rule ---
    def test_aggregator_only_active_is_held(self):
        h = self.held("agg-only")
        self.assertEqual((h["gate"], h["reason"]), ("G2b", "aggregator-only liveness"))
        self.assertEqual(self.roles["agg-only"]["G2a"]["pages"][0]["status"], "active")  # checker said active

    def test_aggregator_plus_active_employer_passes(self):
        r = self.roles["agg-plus-employer-active"]
        self.assertIsNone(r["held"])
        self.assertEqual(r["G2b"]["result"], "pass")
        self.assertIn("⚠ posting is on an aggregator; the employer page decided liveness", r["flags"])

    def test_aggregator_active_employer_expired_is_closed(self):
        r = self.roles["agg-active-employer-expired"]
        self.assertIsNone(r["held"])
        self.assertEqual((r["decision"], r["closed"]["gate"]), ("CLOSED", "G2b"))
        self.assertTrue(r["closed"]["reason"].startswith("posting verified closed"))
        self.assertIsNone(r["composite"])

    def test_non_aggregator_posting_expired_is_closed(self):
        r = self.roles["employer-only-expired"]
        self.assertEqual((r["decision"], r["closed"]["gate"]), ("CLOSED", "G2a"))
        self.assertIsNone(r["composite"])

    def test_closed_shows_in_report_without_score(self):
        self.assertIn("CLOSED — posting verified closed", self.report)
        self.assertEqual(self.log["summary"]["closed"], 2)

    # --- G2a liveness ---
    def test_employer_only_active_passes(self):
        r = self.roles["employer-only-active"]
        self.assertIsNone(r["held"])
        self.assertEqual(r["G2b"]["result"], "n/a")

    def test_uncertain_is_held(self):
        h = self.held("employer-uncertain")
        self.assertEqual(h["gate"], "G2a")
        self.assertIn("uncertain", h["reason"])

    def test_unparseable_output_is_held(self):
        h = self.held("unparseable")
        self.assertEqual(h["gate"], "G2a")
        self.assertIn("unparseable", h["reason"])
        chk = self.log["liveness_checks"]["https://jobs.example.com/northwind/ds3"]
        self.assertEqual(chk["status"], "uncertain")
        self.assertIsNone(chk["checker_said"])

    def test_url_missing_from_offline_fixture_is_held(self):
        h = self.held("not-in-fixture")
        self.assertEqual(h["gate"], "G2a")
        self.assertIn("no liveness check recorded", h["reason"])

    # --- fail closed ---
    def test_held_and_closed_roles_never_reach_the_scorer(self):
        passed = {rid for rid, r in self.roles.items() if not r["held"] and not r["closed"]}
        self.assertEqual(passed, {"agg-plus-employer-active", "employer-only-active", "zero-approvals"})
        self.assertEqual({r["role_id"] for r in self.sent}, passed)
        self.assertEqual(set(self.log["scorer"]["roles_sent"]), passed)
        scores = json.loads((self.out / "role-scores.json").read_text(encoding="utf-8"))
        self.assertEqual({r["role_id"] for r in scores["roles"]}, passed)
        for rid, r in self.roles.items():
            if r["held"] or r["closed"]:
                self.assertIn(r["decision"], {"HELD", "CLOSED"})
                self.assertIsNone(r["composite"])

    def test_no_sponsorship_record_gets_no_score_and_no_check(self):
        r = self.roles["no-sponsorship-record"]
        self.assertEqual(r["held"]["gate"], "G1")
        self.assertIn("not zero", r["held"]["reason"])
        self.assertIsNone(r["composite"])
        self.assertNotIn("https://jobs.example.com/quietharbor/ds", self.log["liveness_checks"])

    def test_not_in_csv_is_held_at_g1(self):
        self.assertEqual(self.held("not-in-csv")["gate"], "G1")

    def test_scored_roles_get_scorer_decisions(self):
        for rid in ("agg-plus-employer-active", "employer-only-active", "zero-approvals"):
            self.assertIn(self.roles[rid]["decision"], {"Apply", "Consider", "Skip"})
            self.assertIsInstance(self.roles[rid]["composite"], (int, float))

    # --- the log ---
    def test_raw_liveness_output_preserved_verbatim(self):
        self.assertTrue(self.log["liveness_checks"])
        for url, chk in self.log["liveness_checks"].items():
            if url in self.fixture:
                for k in ("stdout", "stderr", "exit_code"):
                    self.assertEqual(chk["raw"][k], self.fixture[url][k], f"{url} {k}")

    def test_log_records_today_hashes_and_command_line(self):
        self.assertEqual(self.log["run_date"], "2026-10-03")
        self.assertEqual(self.log["today_source"], "--today")
        for name in ("persona", "candidates", "targets", "aggregators", "offline_fixture"):
            self.assertRegex(self.log["inputs"][name]["sha256"], r"^[0-9a-f]{64}$")
        self.assertIn("--offline", self.log["command_line"])
        self.assertIn("--today", self.log["command_line"])

    def test_default_fit_source_is_your_input(self):
        self.assertTrue(all(r["fit_source"] == "your-input" for r in self.log["roles"]))

    def test_log_has_no_home_folder(self):
        self.assertNotIn(str(Path.home()), json.dumps(self.log, ensure_ascii=False))

    # --- the report ---
    def test_both_outputs_written(self):
        self.assertTrue((self.out / "mode-log.json").is_file())
        self.assertTrue((self.out / "mode-report.md").is_file())

    def test_report_opens_with_executive_summary_in_plain_language(self):
        self.assertTrue(self.report.startswith("## Executive summary\n"))
        summary = self.report.split("## Run record")[0]
        for jargon in ("G1", "G2", "P9", ".json", ".md", "/", "|"):
            self.assertNotIn(jargon, summary)

    def test_report_has_one_row_per_role(self):
        table = self.report.split("## Roles")[1].split("\n## ")[0]
        rows = [l for l in table.splitlines() if l.startswith("| ") and not l.startswith("| Company")]
        self.assertEqual(len(rows), len(self.roles))
        self.assertIn("HELD — G2b: aggregator-only liveness", self.report)


class FitSourceAndNotes(unittest.TestCase):
    def test_inferred_fit_and_notes_are_flagged(self):
        with scratch() as tmp:
            cands = Path(tmp) / "c.json"
            cands.write_text(json.dumps({"roles": [
                {"role_id": "a", "company": "Bluefin Robotics LLC", "title": "DS", "fit": 0.7,
                 "posting_url": "https://boards.greenhouse.io/bluefin/jobs/1000004",
                 "fit_source": "proposed by a tool", "notes": "check sponsorship"}]}))
            self.assertEqual(mode_run.main(run_args(Path(tmp) / "out", cands)), 0)
            r = json.loads((Path(tmp) / "out" / "mode-log.json").read_text(encoding="utf-8"))["roles"][0]
            self.assertEqual(r["fit_source"], "proposed by a tool")
            self.assertIn("⚠ fit is inferred, not verified (proposed by a tool)", r["flags"])
            self.assertIn("⚠ note: check sponsorship", r["flags"])


class AllHeld(unittest.TestCase):
    def test_scorer_not_called_when_every_role_is_held(self):
        with scratch() as tmp:
            cands = Path(tmp) / "all-held.json"
            cands.write_text(json.dumps({"roles": [
                {"role_id": "a", "company": "Northwind Analytics Inc", "title": "DS",
                 "posting_url": "https://builtin.com/job/data-scientist/1000001", "fit": 0.8},
                {"role_id": "b", "company": "Quiet Harbor Labs Inc", "title": "DS",
                 "posting_url": "https://jobs.example.com/quietharbor/ds", "fit": 0.8}]}))
            with mock.patch.object(mode_run.triage, "run_scorer") as scorer:
                self.assertEqual(mode_run.main(run_args(Path(tmp) / "out", cands)), 0)
                scorer.assert_not_called()


class OutDirContainment(unittest.TestCase):
    def assert_refused(self, out_dir):
        self.assertEqual(mode_run.main(run_args(out_dir)), 2)
        self.assertFalse(Path(out_dir).exists())

    def test_tracked_repo_folder_refused(self):
        self.assertEqual(mode_run.main(run_args(mode_run.REPO / "data/examples")), 2)

    def test_dotdot_escape_refused(self):
        self.assert_refused(mode_run.OUT_ROOT / ".." / ".." / "mode-escape-test")

    def test_sibling_prefix_refused(self):
        self.assert_refused(mode_run.OUT_ROOT.parent / "rithika-sr-evil")

    def test_tmp_refused(self):
        self.assert_refused(Path(tempfile.gettempdir()) / "mode-escape-test")


class Parser(unittest.TestCase):
    URL = "https://jobs.example.com/x"
    OK = f"Checking 1 URL(s)...\n\n✅ active     {URL}\n\nResults: 1 active  0 expired  0 uncertain\n"

    def test_active(self):
        self.assertEqual(mode_run.parse_liveness(self.URL, self.OK, 0)["status"], "active")

    def test_exit_code_disagreeing_with_result_is_uncertain(self):
        p = mode_run.parse_liveness(self.URL, self.OK, 1)
        self.assertEqual(p["status"], "uncertain")
        self.assertIn("exit code", p["parse_error"])

    def test_result_for_another_url_is_uncertain(self):
        p = mode_run.parse_liveness("https://jobs.example.com/y", self.OK, 0)
        self.assertEqual(p["status"], "uncertain")

    def test_missing_summary_line_is_uncertain(self):
        p = mode_run.parse_liveness(self.URL, self.OK.split("Results")[0], 0)
        self.assertEqual(p["status"], "uncertain")

    def test_timeout_exit_none_is_uncertain(self):
        self.assertEqual(mode_run.parse_liveness(self.URL, self.OK, None)["status"], "uncertain")


def page(kind, status, aggregator=None, parse_error=None):
    reason = f"liveness output unparseable: {parse_error}" if parse_error else f"checker said {status}"
    return {"kind": kind, "url": f"https://x.example/{kind}", "aggregator": aggregator, "status": status,
            "reason": reason, "decided_by": "page-checker", "flags": []}


class G2Decide(unittest.TestCase):
    """HELD = we don't know; CLOSED = a deciding page verified the job is gone."""

    def outcome(self, *pages):
        gate, stop = mode_run.g2_decide(list(pages))
        return gate, stop and stop["outcome"]

    def test_deciding_page_expired_is_closed(self):
        self.assertEqual(self.outcome(page("posting", "expired")), ("G2a", "closed"))

    def test_expired_outranks_uncertain_sibling(self):
        self.assertEqual(self.outcome(page("posting", "uncertain"), page("employer", "expired")), ("G2a", "closed"))

    def test_aggregator_expired_alone_is_held_not_closed(self):
        self.assertEqual(self.outcome(page("posting", "expired", "builtin.com")), ("G2b", "held"))

    def test_aggregator_expired_does_not_close_an_uncertain_employer(self):
        self.assertEqual(self.outcome(page("posting", "expired", "builtin.com"), page("employer", "uncertain")),
                         ("G2b", "held"))

    def test_unparseable_is_held_not_closed(self):
        self.assertEqual(self.outcome(page("posting", "uncertain", parse_error="garbled")), ("G2a", "held"))

    def test_all_deciding_pages_active_passes(self):
        self.assertEqual(self.outcome(page("posting", "active", "linkedin.com"), page("employer", "active")),
                         ("G2b", None))


def checker_out(status, url, reason=None):
    """check-liveness.mjs stdout for one URL, byte-compatible with the real tool."""
    icon = {"active": "✅", "expired": "❌", "uncertain": "⚠️"}[status]
    lines = ["Checking 1 URL(s)...", "", f"{icon} {status.ljust(10)} {url}"] + ([" " * 11 + reason] if reason else [])
    c = {k: int(k == status) for k in ("active", "expired", "uncertain")}
    lines += ["", f"Results: {c['active']} active  {c['expired']} expired  {c['uncertain']} uncertain"]
    return {"stdout": "\n".join(lines) + "\n", "stderr": "", "exit_code": 0 if status == "active" else 1}


GH = "https://boards.greenhouse.io/bluefin/jobs/{}"
API = "https://boards-api.greenhouse.io/v1/boards/bluefin/jobs/{}"
CAREERS = "https://careers.example.com/positions/{}"
OK200 = {"status": 200, "location": None, "json": None, "error": None}


def api_ok(job_id, title="Data Scientist"):
    return {"status": 200, "location": None, "json": {"id": int(job_id), "title": title}, "error": None}


class Run2Gates(unittest.TestCase):
    """v0.2: ATS record decides Greenhouse jobs; redirect chain; employer allowlist; title check."""

    ROLES = {  # role_id: (company, title, url, checker status, http responses)
        "api-404": ("Bluefin Robotics LLC", "Data Scientist", GH.format(2000001), "active",
                    {GH.format(2000001): OK200, API.format(2000001): {"status": 404, "location": None, "json": None, "error": None}}),
        "api-200-checker-uncertain": ("Bluefin Robotics LLC", "Data Scientist", GH.format(2000002), "uncertain",
                    {GH.format(2000002): OK200, API.format(2000002): api_ok(2000002)}),
        "api-200-checker-active": ("Bluefin Robotics LLC", "Data Scientist", GH.format(2000003), "active",
                    {GH.format(2000003): OK200, API.format(2000003): api_ok(2000003)}),
        "error-hop": ("Northwind Analytics Inc", "Data Scientist", CAREERS.format(2000004), "active",
                    {CAREERS.format(2000004): {"status": 302, "location": "/jobs?error=true", "json": None, "error": None},
                     "https://careers.example.com/jobs?error=true": OK200}),
        "final-url-no-id": ("Northwind Analytics Inc", "Data Scientist", CAREERS.format(2000005), "active",
                    {CAREERS.format(2000005): {"status": 302, "location": "https://careers.example.com/positions/", "json": None, "error": None},
                     "https://careers.example.com/positions/": OK200}),
        "unknown-host": ("Northwind Analytics Inc", "Data Scientist", "https://jobs.unknown-board.example.net/job/2000006", "active", {}),
        "allowlisted-careers": ("Northwind Analytics Inc", "Data Scientist", CAREERS.format(2000007), "active",
                    {CAREERS.format(2000007): OK200}),
        "title-mismatch": ("Bluefin Robotics LLC", "Data Scientist", GH.format(2000008), "active",
                    {GH.format(2000008): OK200, API.format(2000008): api_ok(2000008, "Data Scientist, Growth Analytics")}),
        "api-timeout": ("Bluefin Robotics LLC", "Data Scientist", GH.format(2000009), "active",
                    {GH.format(2000009): OK200, API.format(2000009): {"status": None, "location": None, "json": None, "error": "timeout"}}),
        # v0.3 level gate
        "over-level-senior": ("Bluefin Robotics LLC", "Senior Data Scientist", GH.format(3000001), "active",
                    {GH.format(3000001): OK200, API.format(3000001): api_ok(3000001, "Senior Data Scientist")}),
        "level-ii-passes": ("Bluefin Robotics LLC", "Data Scientist II", GH.format(3000002), "active",
                    {GH.format(3000002): OK200, API.format(3000002): api_ok(3000002, "Data Scientist II")}),
        "over-level-ats-title": ("Bluefin Robotics LLC", "Data Scientist", GH.format(3000003), "active",
                    {GH.format(3000003): OK200, API.format(3000003): api_ok(3000003, "Staff Data Scientist")}),
        "parenthetical-title": ("Bluefin Robotics LLC", "Data Scientist I - Meals (US remote)", GH.format(3000004), "active",
                    {GH.format(3000004): OK200, API.format(3000004): api_ok(3000004, "Data Scientist I - Meals")}),
        "closed-before-level": ("Bluefin Robotics LLC", "Senior Data Scientist", GH.format(3000005), "active",
                    {GH.format(3000005): OK200, API.format(3000005): {"status": 404, "location": None, "json": None, "error": None}}),
    }

    @classmethod
    def setUpClass(cls):
        cls.tmp = scratch()
        d = Path(cls.tmp.name)
        roles, results, http = [], {}, {}
        for rid, (company, title, url, chk, resp) in cls.ROLES.items():
            roles.append({"role_id": rid, "company": company, "title": title, "posting_url": url, "fit": 0.6})
            results[url] = checker_out(chk, url, None if chk == "active" else "content present but no visible apply control found")
            http.update(resp)
        (d / "c.json").write_text(json.dumps({"roles": roles}))
        (d / "fx.json").write_text(json.dumps({"results": results, "http": http}, ensure_ascii=False))
        assert mode_run.main(run_args(d / "out", d / "c.json", d / "fx.json")) == 0
        cls.log = json.loads((d / "out" / "mode-log.json").read_text(encoding="utf-8"))
        cls.r = {r["role_id"]: r for r in cls.log["roles"]}
        cls.sent = {r["role_id"] for r in json.loads((d / "out" / "roles.json").read_text())}
        cls.report = (d / "out" / "mode-report.md").read_text(encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def page(self, rid):
        return self.r[rid]["G2a"]["pages"][0]

    def test_api_404_is_closed_even_if_checker_active(self):
        r = self.r["api-404"]
        self.assertEqual(r["decision"], "CLOSED")
        self.assertEqual(self.page("api-404")["decided_by"], "ats-record")
        self.assertIn("⚠ page checker said active; ATS record expired", r["flags"])

    def test_api_200_beats_checker_uncertain(self):
        r = self.r["api-200-checker-uncertain"]
        self.assertIsNone(r["held"]); self.assertIsNone(r["closed"])
        self.assertIn("api-200-checker-uncertain", self.sent)
        self.assertIn("⚠ page checker said uncertain; ATS record active", r["flags"])

    def test_api_200_and_checker_active_passes_without_disagreement_flag(self):
        r = self.r["api-200-checker-active"]
        self.assertIn("api-200-checker-active", self.sent)
        self.assertFalse([f for f in r["flags"] if "page checker said" in f])

    def test_error_true_hop_is_closed(self):
        r = self.r["error-hop"]
        self.assertEqual(r["decision"], "CLOSED")
        self.assertEqual(self.page("error-hop")["decided_by"], "redirect-chain")
        self.assertIn("redirected through ATS error page", r["closed"]["reason"])

    def test_final_url_without_job_id_is_flag_only(self):
        r = self.r["final-url-no-id"]
        self.assertIn("final-url-no-id", self.sent)
        self.assertTrue(any(f.startswith("⚠ final URL after redirects does not contain the job id") for f in r["flags"]))

    def test_unknown_host_is_held_and_never_checked(self):
        r = self.r["unknown-host"]
        self.assertEqual(r["held"]["reason"], "source not recognized as employer or ATS")
        self.assertNotIn("https://jobs.unknown-board.example.net/job/2000006", self.log["liveness_checks"])
        self.assertFalse([c for c in self.log["network_calls"] if "unknown-board" in c["url"]])

    def test_allowlisted_careers_host_is_allowed(self):
        self.assertEqual(self.page("allowlisted-careers")["allowlisted"], "careers.example.com")
        self.assertIn("allowlisted-careers", self.sent)

    def test_title_mismatch_is_flag_not_decision(self):
        r = self.r["title-mismatch"]
        self.assertIn("title-mismatch", self.sent)
        self.assertIn("⚠ title differs from ATS record: 'Data Scientist, Growth Analytics'", r["flags"])

    def test_api_timeout_is_uncertain_and_held(self):
        r = self.r["api-timeout"]
        self.assertEqual(self.page("api-timeout")["ats_record"]["status"], "uncertain")
        self.assertEqual(r["decision"], "HELD")
        self.assertIn("timeout", r["held"]["reason"])

    def test_every_network_call_is_recorded(self):
        calls = self.log["network_calls"]
        self.assertTrue(calls)
        for c in calls:
            self.assertTrue({"url", "method", "purpose", "status", "time"} <= set(c))
            self.assertIsNone(c["time"])          # offline replay: no wall-clock time
        purposes = {c["purpose"] for c in calls}
        self.assertEqual(purposes, {"page-checker", "redirect-hop", "greenhouse-api"})


    # --- v0.3 level gate and cleanups ---
    def test_blocked_token_is_over_level_and_never_scored(self):
        r = self.r["over-level-senior"]
        self.assertEqual(r["decision"], "OVER-LEVEL")
        self.assertIsNone(r["composite"])
        self.assertEqual(r["over_level"]["reason"], "title says 'senior'")
        self.assertNotIn("over-level-senior", self.sent)
        self.assertIn("OVER-LEVEL — title says 'senior'", self.report)

    def test_data_scientist_ii_passes(self):
        r = self.r["level-ii-passes"]
        self.assertEqual(r["LEVEL"]["result"], "pass")
        self.assertIn("level-ii-passes", self.sent)

    def test_ats_title_can_make_a_role_over_level(self):
        r = self.r["over-level-ats-title"]
        self.assertEqual((r["decision"], r["LEVEL"]["matched_in"]), ("OVER-LEVEL", "ATS record title"))

    def test_parenthetical_ignored_in_title_match(self):
        self.assertFalse([f for f in self.r["parenthetical-title"]["flags"] if "title differs" in f])

    def test_closed_role_is_not_level_checked(self):
        r = self.r["closed-before-level"]
        self.assertEqual(r["decision"], "CLOSED")
        self.assertIsNone(r["LEVEL"])

    def test_level_settings_in_log_and_report(self):
        self.assertEqual(self.log["max_level"], "entry")
        self.assertIn("senior", self.log["level_rules"])
        self.assertIn("| Level |", self.report)

    def test_summary_has_no_zero_count_clauses(self):
        summary = self.report.split("## Run record")[0]
        self.assertNotIn("0 because", summary)
        self.assertNotRegex(summary, r"\b0 (was|were|is|are)\b")


class LevelRules(unittest.TestCase):
    BLOCKED = mode_run.load_level_rules(mode_run.DEFAULT_LEVEL_RULES, "entry")

    def test_word_boundary(self):
        self.assertIsNone(mode_run.blocked_token("Data Science Leadership Program", self.BLOCKED))
        self.assertEqual(mode_run.blocked_token("Lead Data Scientist", self.BLOCKED), "lead")
        self.assertIsNone(mode_run.blocked_token("Headquarters Analyst", self.BLOCKED))

    def test_ii_not_blocked_iii_blocked(self):
        self.assertIsNone(mode_run.blocked_token("Data Scientist II", self.BLOCKED))
        self.assertEqual(mode_run.blocked_token("Data Scientist III", self.BLOCKED), "iii")

    def test_case_insensitive_and_abbreviation(self):
        self.assertEqual(mode_run.blocked_token("SR. DATA SCIENTIST", self.BLOCKED), "sr")

    def test_every_token_has_a_reason(self):
        self.assertTrue(all(self.BLOCKED.values()))
        self.assertNotIn("ii", self.BLOCKED)

    def test_max_level_any_blocks_nothing(self):
        self.assertEqual(mode_run.load_level_rules(mode_run.DEFAULT_LEVEL_RULES, "any"), {})

    def test_unknown_max_level_stops_with_exit_2(self):
        with scratch() as tmp:
            self.assertEqual(mode_run.main(run_args(Path(tmp) / "out") + ["--max-level", "phd"]), 2)

    def test_scorer_not_called_when_every_role_is_over_level(self):
        with scratch() as tmp:
            cands = Path(tmp) / "c.json"
            cands.write_text(json.dumps({"roles": [
                {"role_id": "a", "company": "Bluefin Robotics LLC", "title": "Staff Data Scientist", "fit": 0.8,
                 "posting_url": "https://boards.greenhouse.io/bluefin/jobs/1000004"}]}))
            with mock.patch.object(mode_run.triage, "run_scorer") as scorer:
                self.assertEqual(mode_run.main(run_args(Path(tmp) / "out", cands)), 0)
                scorer.assert_not_called()


class AtsRecordHelpers(unittest.TestCase):
    def test_greenhouse_url_forms(self):
        self.assertEqual(mode_run.ats_record.greenhouse_job("https://boards.greenhouse.io/airbnb/jobs/6768605"),
                         ("airbnb", "6768605"))
        self.assertEqual(mode_run.ats_record.greenhouse_job("https://job-boards.greenhouse.io/figma/jobs/5552580004"),
                         ("figma", "5552580004"))
        self.assertIsNone(mode_run.ats_record.greenhouse_job("https://careers.airbnb.com/positions/6632687"))

    def test_tls_context_always_verifies(self):
        ctx, source = mode_run.ats_record.ssl_context()
        self.assertTrue(ctx.check_hostname)
        self.assertEqual(ctx.verify_mode, mode_run.ats_record.ssl.CERT_REQUIRED)
        self.assertTrue(source)

    def test_parenthetical_ignored(self):
        self.assertTrue(mode_run.ats_record.titles_match("Senior Data Scientist I - Meals (US remote)",
                                                         "Senior Data Scientist I - Meals"))

    def test_job_id_from_careers_url(self):
        self.assertEqual(mode_run.ats_record.job_id_of("https://careers.airbnb.com/positions/6632687"), "6632687")


class AggregatorMatching(unittest.TestCase):
    AGG = mode_run.load_aggregators(mode_run.DEFAULT_AGGREGATORS)

    def test_subdomain_matches(self):
        self.assertEqual(mode_run.aggregator_of("https://www.linkedin.com/jobs/view/1", self.AGG), "linkedin.com")

    def test_lookalike_hosts_do_not_match(self):
        self.assertIsNone(mode_run.aggregator_of("https://notlinkedin.com/j/1", self.AGG))
        self.assertIsNone(mode_run.aggregator_of("https://linkedin.com.example.com/j/1", self.AGG))

    def test_worked_run_aggregators_listed(self):
        for url in ("https://builtin.com/job/data-scientist/3375738",
                    "https://www.builtinaustin.com/job/data-scientist-search/9459092"):
            self.assertIsNotNone(mode_run.aggregator_of(url, self.AGG))

    def test_every_aggregator_has_a_reason(self):
        self.assertTrue(all(self.AGG.values()))


if __name__ == "__main__":
    unittest.main()
