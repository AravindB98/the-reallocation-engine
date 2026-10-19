"""Offline tests for tailor_or_ask.py. No test touches the network: every run sets
TAILOR_OR_ASK_FORBID_NETWORK, so a network call would stop the run instead.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import contextlib
import copy
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
REPO = HERE.parents[3]
SCRIPT = HERE / "tailor_or_ask.py"
QUEUE = HERE / "fixtures" / "sample-queue.json"
RULES = HERE / "rules.json"
LABELS = {"record", "model-judgment", "your-input", "computed"}


def run_mode(*args, env_extra=None) -> subprocess.CompletedProcess:
    env = {**os.environ, "TAILOR_OR_ASK_FORBID_NETWORK": "1", **(env_extra or {})}
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, cwd=REPO, env=env)


def labels_in(node, found=None) -> set:
    """Every label in the log: the `source` of each labelled value {value, source, ...}."""
    found = set() if found is None else found
    if isinstance(node, dict):
        if "value" in node and "source" in node:
            found.add(node["source"])
        for v in node.values():
            labels_in(v, found)
    elif isinstance(node, list):
        for v in node:
            labels_in(v, found)
    return found


class SampleRun(unittest.TestCase):
    """The documented command on the sample queue, end to end."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.proc = run_mode("--out-dir", cls.tmp.name)
        cls.out = Path(cls.tmp.name)
        cls.log = json.loads((cls.out / "run-log.json").read_text(encoding="utf-8"))
        cls.by_id = {r["posting_id"]: r for r in cls.log["postings"]}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def choice(self, pid):
        return self.by_id[pid]["suggestion"]["choice"]

    def test_the_run_completes(self):
        self.assertEqual(self.proc.returncode, 0, self.proc.stderr)
        self.assertEqual(self.log["status"], "complete")

    def test_every_branch_appears(self):
        self.assertEqual(self.log["summary"]["suggestions"], {"TAILOR": 1, "ASK FIRST": 4, "MOVE ON": 2, "HOLD": 3})
        self.assertEqual(self.log["summary"]["scored"], 4)

    def test_a_closed_posting_is_move_on(self):
        self.assertEqual(self.choice("s06-celestialai-mle"), "MOVE ON")

    def test_withheld_dates_hold_the_posting(self):
        r = self.by_id["s08-databricks-ai-engineer"]
        self.assertEqual(r["suggestion"]["choice"], "HOLD")
        self.assertEqual(r["checks"]["timeline"]["code"], "timeline-withheld")
        self.assertNotIn("scorer", r)

    def test_an_uncertain_page_holds_the_posting(self):
        self.assertEqual(self.choice("s07-applovin-mle-new-grad"), "HOLD")

    def test_an_ambiguous_company_holds_the_posting(self):
        r = self.by_id["s10-peloton-mle"]
        self.assertEqual(r["suggestion"]["choice"], "HOLD")
        self.assertEqual(r["checks"]["company"]["code"], "ambiguous-company-match")

    def test_no_h1b_record_asks_the_sponsorship_question(self):
        sg = self.by_id["s04-huggingface-mle"]["suggestion"]
        self.assertEqual(sg["choice"], "ASK FIRST")
        self.assertIn("Does Hugging Face sponsor H-1B visas", sg["questions"][0])

    def test_soft_sponsorship_evidence_quotes_the_record(self):
        sg = self.by_id["s03-airbnb-mle-early-career"]["suggestion"]
        self.assertEqual(sg["choice"], "ASK FIRST")
        self.assertIn("None is an ML/AI role", sg["questions"][0])

    def test_a_stretch_minimum_asks_in_the_students_own_words(self):
        sg = self.by_id["s02-etsy-mle-1-search"]["suggestion"]
        self.assertEqual((sg["choice"], sg["short_by_months"]), ("ASK FIRST", 4))
        self.assertEqual(sg["questions"][0], "Is '1+ years' a firm minimum, or would you consider someone with fewer "
                                             "years who has relevant production ML experience?")

    def test_a_minimum_the_posting_calls_firm_moves_on(self):
        sg = self.by_id["s09-kensho-mle"]["suggestion"]
        self.assertEqual(sg["choice"], "MOVE ON")
        self.assertIn("says its minimum is firm", sg["why"])

    def test_closer_postings_are_listed_first_among_ask_first(self):
        report = (self.out / "report.md").read_text(encoding="utf-8")
        section = report.split("### Ask First")[1].split("### ")[0]
        self.assertLess(section.index("Airbnb"), section.index("Etsy"))  # Etsy is 4 months short

    def test_the_kind_of_experience_is_shown_never_checked(self):
        item = [x for x in self.by_id["s02-etsy-mle-1-search"]["checks"]["requirements"]["items"]["value"]
                if x["check"]][0]
        self.assertEqual((item["kind_asked"], item["kind_checked"]), ("building and shipping ML models", False))
        self.assertIn("Kind asked (not checked)", (self.out / "report.md").read_text(encoding="utf-8"))

    def test_co_op_time_that_decides_a_minimum_becomes_the_question(self):
        qs = self.by_id["s04-huggingface-mle"]["suggestion"]["questions"]
        self.assertTrue(any("Does co-op or internship time count" in q for q in qs))

    def test_tailor_says_how_many_required_lines_were_not_checked(self):
        nxt = self.by_id["s01-discord-mle-new-grad"]["suggestion"]["next"]
        self.assertIn("not the other 3 required line(s)", nxt)
        self.assertIn("not a claim of meeting the whole job description", nxt)

    def test_requirement_results_are_labelled_by_the_rules_declarer(self):
        req = self.by_id["s02-etsy-mle-1-search"]["checks"]["requirements"]
        self.assertEqual((req["items"]["source"], req["text_source"]["source"], req["experience"]["source"]),
                         ("your-input", "model-judgment", "record"))  # adopted rules · Claude's fixture text · persona file

    def test_every_suggestion_names_the_matched_row(self):
        # The posting's "Meta" matches a small namesake in the file; the report must show it.
        self.assertIn("Matched by name only, not confirmed by a person: row 16612: META CO (PORTOLA VALLEY, CA)",
                      self.by_id["s05-meta-ai-research-engineer"]["suggestion"]["next"])
        self.assertIn("Picked in the queue, not confirmed by a person: row 14287: KENSHO TECHNOLOGIES INC",
                      self.by_id["s09-kensho-mle"]["suggestion"]["next"])

    def test_a_name_match_is_computed_never_a_record(self):
        # The student's call (option a, 2026-10-19): a name match is used, but it is not a fact about the employer.
        for pid in ("s05-meta-ai-research-engineer", "s01-discord-mle-new-grad"):
            match = self.by_id[pid]["checks"]["company"]["match"]
            self.assertEqual((match["source"], match["confirmed"], match["basis"]), ("computed", False, "name"), pid)
        report = (self.out / "report.md").read_text(encoding="utf-8")
        self.assertIn("| company row | row 16612: META CO (PORTOLA VALLEY, CA) | record | the sponsorship file |", report)
        self.assertIn("| identity | exact name match, not confirmed by a person | computed |", report)

    def test_the_meta_question_does_not_say_meta_has_no_history(self):
        sg = self.by_id["s05-meta-ai-research-engineer"]["suggestion"]
        self.assertEqual(sg["choice"], "ASK FIRST")
        self.assertIn("META CO (PORTOLA VALLEY, CA), has no H-1B history. It may be a different company", sg["why"])
        self.assertEqual(sg["questions"][0], "Does Meta sponsor H-1B visas for the AI Research Engineer, University "
                                             "Grad role?")
        self.assertFalse(any("history for Meta" in x for x in [sg["why"], *sg["questions"]]))

    def test_a_soft_record_question_names_the_matched_row(self):
        q = self.by_id["s03-airbnb-mle-early-career"]["suggestion"]["questions"][0]
        self.assertTrue(q.startswith("The public H-1B record matched to Airbnb by name only (AIRBNB INC, SAN "
                                     "FRANCISCO, CA) lists these sponsored titles"), q)

    def test_only_the_four_labels_are_used(self):
        self.assertTrue(labels_in(self.log) <= LABELS, labels_in(self.log))

    def test_nothing_claude_wrote_is_labelled_as_the_students_input(self):
        """A3's defect D9: values Claude proposed were labelled your-input. The sample queue is written by
        Claude Code, so every value it supplies must be model-judgment; your-input may appear only on values
        derived through the rules the student adopted."""
        for r in self.log["postings"]:
            c = r["checks"]
            written_by_claude = [r["company_on_posting"], r["title"], r["url"]]
            if c.get("fit", {}).get("result") == "pass":
                written_by_claude.append(c["fit"]["p"])
            if c.get("timeline", {}).get("result") == "pass":
                written_by_claude.append(c["timeline"]["factor"])
            if c.get("requirements", {}).get("result") == "checked":
                written_by_claude.append(c["requirements"]["text_source"])
            if "status" in c.get("liveness", {}):
                written_by_claude.append(c["liveness"]["status"])  # synthetic snapshots
            for v in written_by_claude:
                self.assertEqual(v["source"], "model-judgment", (r["posting_id"], v))

    def test_the_scorer_received_every_gate_as_a_number(self):
        sent = json.loads((self.out / "roles.json").read_text(encoding="utf-8"))
        for role in sent:
            for gate in ("liveness", "timeline"):
                self.assertIsInstance(role[gate]["factor"], (int, float))

    def test_two_outputs_for_two_readers(self):
        report = (self.out / "report.md").read_text(encoding="utf-8")
        lines = [ln for ln in report.splitlines() if ln.strip()]
        self.assertTrue(lines[0].startswith("# "))
        self.assertEqual(lines[1], "## Executive summary")
        self.assertIn("## What this run cannot verify", report)
        self.assertIn("## Verified vs inferred, posting by posting", report)


def write_queue(tmp: Path, mutate) -> Path:
    q = json.loads(QUEUE.read_text(encoding="utf-8"))
    mutate(q)
    path = tmp / "queue.json"
    path.write_text(json.dumps(q), encoding="utf-8")
    return path


def write_rules(tmp: Path, mutate) -> Path:
    r = json.loads(RULES.read_text(encoding="utf-8"))
    mutate(r)
    path = tmp / "rules.json"
    path.write_text(json.dumps(r), encoding="utf-8")
    return path


class Gates(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.out = self.tmp / "out"

    def tearDown(self):
        self._tmp.cleanup()

    def test_a_missing_fit_holds_instead_of_counting_as_zero(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0].pop("fit"))
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        log = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))
        r = log["postings"][0]
        self.assertEqual((r["suggestion"]["choice"], r["checks"]["fit"]["code"]), ("HOLD", "fit-missing"))

    def test_a_closed_posting_moves_on_even_with_dates_withheld(self):
        def m(q):
            q["postings"][5]["timeline"] = {"withheld": True, "reason": "test", "by": "claude-code"}
        q = write_queue(self.tmp, m)
        run_mode("--queue", str(q), "--out-dir", str(self.out))
        log = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))
        self.assertEqual(log["postings"][5]["suggestion"]["choice"], "MOVE ON")

    def test_a_value_without_its_declarer_is_refused_at_the_input_gate(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0]["timeline"].pop("by"))
        proc = run_mode("--queue", str(q), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("timeline.by must say who declared it", proc.stderr)

    def test_a_decision_must_be_made_by_a_named_person_with_a_reason(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0].update(
            decision={"choice": "TAILOR", "reason": "", "by": "claude-code", "at": "2026-09-30"}))
        proc = run_mode("--queue", str(q), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("decision.reason is required", proc.stderr)
        self.assertIn("never by Claude Code", proc.stderr)

    def test_a_person_s_decision_is_logged_next_to_the_suggestion(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0].update(
            decision={"choice": "ASK FIRST", "reason": "I want to hear about the team first", "by": "test-person",
                      "at": "2026-09-30"}))
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][0]
        self.assertEqual((r["suggestion"]["choice"], r["decision"]["choice"], r["decision"]["label"]),
                         ("TAILOR", "ASK FIRST", "your-input"))
        self.assertIn("Decided by test-person on 2026-09-30: ASK FIRST", (self.out / "report.md").read_text(encoding="utf-8"))

    def test_rules_drafted_by_claude_produce_model_judgment(self):
        rules = write_rules(self.tmp, lambda r: r["declared_by"].update(who="claude-code"))
        self.assertEqual(run_mode("--rules", str(rules), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][0]
        self.assertEqual(r["checks"]["sponsorship"]["evidence"]["tier"]["source"], "model-judgment")

    def test_a_confirmed_identity_is_the_persons_decision_with_its_evidence(self):
        def m(q):
            p = q["postings"][9]  # Peloton: ambiguous by name
            p["company_identity"] = {"status": "confirmed", "csv_row": 19931, "checked": "test: legal name and city match",
                                     "sources": ["https://example.com/terms"], "unverified": ["website"],
                                     "by": "test-person", "at": "2026-09-30"}
        q = write_queue(self.tmp, m)
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][9]
        match = r["checks"]["company"]["match"]
        self.assertEqual((match["source"], match["csv_row"], match["unverified"]), ("your-input", 19931, ["website"]))
        self.assertIn("identity confirmed by test-person", match["how"])

    def test_a_confirmed_identity_keeps_the_plain_wording(self):
        def m(q):
            for i, row in ((2, 1013), (3, 12614)):  # Airbnb (soft record), Hugging Face (no H-1B record)
                q["postings"][i]["company_identity"] = {"status": "confirmed", "csv_row": row, "checked": "test",
                                                        "by": "test-person", "at": "2026-09-30"}
        q = write_queue(self.tmp, m)
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        log = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))
        airbnb, hf = log["postings"][2], log["postings"][3]
        self.assertEqual((airbnb["checks"]["company"]["match"]["source"], airbnb["checks"]["company"]["match"]["confirmed"]),
                         ("your-input", True))
        self.assertTrue(airbnb["suggestion"]["questions"][0].startswith("Airbnb's public H-1B record lists"))
        self.assertEqual(hf["suggestion"]["why"], "no H-1B history for this company in the file (unknown, not 'no')")
        self.assertIn("has no sponsorship history for Hugging Face", hf["suggestion"]["questions"][0])

    def test_a_candidate_identity_holds_even_when_the_name_matches_exactly(self):
        # the student's Orenda call: an exact name match is not an identity
        def m(q):
            q["postings"][0]["company_identity"] = {"status": "candidate", "csv_row": 7770, "by": "test-person",
                                                    "at": "2026-09-30", "checked": "test: the websites don't connect"}
        q = write_queue(self.tmp, m)
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][0]
        self.assertEqual((r["suggestion"]["choice"], r["checks"]["company"]["code"]), ("HOLD", "identity-unconfirmed"))
        self.assertNotIn("sponsorship", r["checks"])
        self.assertIn("the websites don't connect", r["suggestion"]["next"])

    def test_an_identity_cannot_be_confirmed_by_claude(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0].update(company_identity={
            "status": "confirmed", "csv_row": 7770, "checked": "x", "by": "claude-code", "at": "2026-09-30"}))
        proc = run_mode("--queue", str(q), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("never by Claude Code", proc.stderr)

    def test_fit_and_timeline_left_unset_with_a_reason_hold(self):
        def m(q):
            q["postings"][0]["fit"] = {"unset": True, "reason": "test: the résumé sources disagree", "by": "student"}
            q["postings"][0]["timeline"] = {"unset": True, "reason": "test: no hiring duration", "by": "student"}
        q = write_queue(self.tmp, m)
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][0]
        self.assertEqual((r["checks"]["fit"]["code"], r["checks"]["timeline"]["code"], r["suggestion"]["choice"]),
                         ("fit-unset", "timeline-unset", "HOLD"))
        self.assertEqual(r["checks"]["fit"]["reason"]["source"], "your-input")

    def test_a_gap_can_be_set_to_move_on_instead(self):
        rules = write_rules(self.tmp, lambda r: r["requirements"].update(on_required_gap="MOVE ON"))
        self.assertEqual(run_mode("--rules", str(rules), "--out-dir", str(self.out)).returncode, 0)
        log = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))
        sg = {r["posting_id"]: r for r in log["postings"]}["s02-etsy-mle-1-search"]["suggestion"]
        self.assertEqual(sg["choice"], "MOVE ON")

    def test_a_high_fit_never_clears_an_unresolved_gate(self):
        q = write_queue(self.tmp, lambda q: q["postings"][6]["fit"].update(p=1.0))  # AppLovin: page uncertain
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][6]
        self.assertEqual(r["suggestion"]["choice"], "HOLD")
        self.assertNotIn("scorer", r)

    def test_a_posting_without_text_is_held(self):
        q = write_queue(self.tmp, lambda q: q["postings"][0].pop("posting_text"))
        self.assertEqual(run_mode("--queue", str(q), "--out-dir", str(self.out)).returncode, 0)
        r = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))["postings"][0]
        self.assertEqual((r["suggestion"]["choice"], r["checks"]["requirements"]["code"]), ("HOLD", "posting-text-unavailable"))

    def test_a_real_resume_needs_private_mode(self):
        resume = self.tmp / "resume.json"
        resume.write_text('{"experience": []}', encoding="utf-8")
        proc = run_mode("--resume", str(resume), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("Real résumés are read only with --private", proc.stderr)

    def test_greenhouse_posting_urls_map_to_the_public_api(self):
        spec = importlib.util.spec_from_file_location("tailor_or_ask", SCRIPT)
        mode = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mode)
        self.assertEqual(mode.greenhouse_api_url("https://job-boards.greenhouse.io/goodfire/jobs/5019847008"),
                         "https://boards-api.greenhouse.io/v1/boards/goodfire/jobs/5019847008")
        self.assertIsNone(mode.greenhouse_api_url("https://jobs.lever.co/example/123"))

    def test_rules_with_no_declarer_are_refused(self):
        rules = write_rules(self.tmp, lambda r: r["declared_by"].update(who="someone"))
        self.assertEqual(run_mode("--rules", str(rules), "--out-dir", str(self.out)).returncode, 2)

    def test_the_guard_stops_the_whole_run_when_a_rule_writes_p_as_text(self):
        """A typo in the rules (p written as text) would make the scorer silently drop the sponsorship
        vote. The guard must refuse the batch: nothing is scored, and the run says so."""
        rules = write_rules(self.tmp, lambda r: r["tiers"]["p"].update(Proven="0.9"))
        proc = run_mode("--rules", str(rules), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 3)
        log = json.loads((self.out / "run-log.json").read_text(encoding="utf-8"))
        self.assertEqual(log["status"], "refused")
        self.assertFalse((self.out / "roles.json").exists())
        self.assertTrue(any("sponsorship.p must be a number" in p for p in log["stop"]["problems"]))
        self.assertIn("REFUSED", (self.out / "report.md").read_text(encoding="utf-8"))

    def test_a_changed_sponsorship_file_stops_at_the_source_gate(self):
        proc = run_mode("--csv", "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv",
                        "--csv-sha256", "0" * 64, "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("STOP at the source gate", proc.stderr)

    def test_a_real_profile_needs_private_mode(self):
        persona = self.tmp / "profile.yml"
        persona.write_text("needs_sponsorship: true\n", encoding="utf-8")
        proc = run_mode("--persona", str(persona), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("only with --private", proc.stderr)

    def test_private_mode_writes_only_under_private(self):
        persona = self.tmp / "profile.yml"
        persona.write_text("needs_sponsorship: true\n", encoding="utf-8")
        proc = run_mode("--private", "--persona", str(persona), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 2)
        self.assertIn("write only under private/", proc.stderr)

    def test_live_mode_cannot_reach_the_network_when_forbidden(self):
        def m(q):
            q["postings"] = [copy.deepcopy(q["postings"][0])]
            q["postings"][0]["url"] = "https://job-boards.greenhouse.io/example/jobs/1"
        q = write_queue(self.tmp, m)
        proc = run_mode("--live", "--queue", str(q), "--out-dir", str(self.out))
        self.assertEqual(proc.returncode, 1)
        self.assertIn("TAILOR_OR_ASK_FORBID_NETWORK", proc.stderr)


class LivenessFailures(unittest.TestCase):
    """R8: a browser failure is HOLD, never 'closed' (in-process, with the network calls replaced)."""

    def test_a_browser_that_fails_to_launch_holds_the_posting(self):
        spec = importlib.util.spec_from_file_location("tailor_or_ask", SCRIPT)
        mode = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mode)
        failed = subprocess.CompletedProcess(args=[], returncode=1, stdout="",
                                             stderr="browserType.launch: Executable doesn't exist")
        mode.ev.first_hop = lambda url: (200, None)
        mode.ev.check_live = lambda urls: (failed, {})
        rules = mode.ev.load_rules(RULES)
        p = {"posting_id": "x", "url": "https://job-boards.greenhouse.io/example/jobs/1"}
        r = {"checks": {}}
        mode.liveness_checks([(p, r)], rules, mode.parse_day("2026-10-19"), True, "model-judgment")
        self.assertEqual(r["checks"]["liveness"], {"result": "unresolved", "code": "liveness-check-failed"})

    def test_a_scorer_that_breaks_its_contract_voids_the_run(self):
        """G10: if the scorer ran as if no sponsorship were needed, nothing it said is used."""
        spec = importlib.util.spec_from_file_location("tailor_or_ask", SCRIPT)
        mode = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mode)

        def broken_scorer(roles_path, out_dir):
            sent = json.loads(Path(roles_path).read_text(encoding="utf-8"))
            (Path(out_dir) / "role-scores.json").write_text(json.dumps(
                {"profile_needs_sponsorship": False, "roles": [{"role_id": r["role_id"]} for r in sent]}), encoding="utf-8")
            return subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")
        mode.ev.run_scorer = broken_scorer
        os.environ["TAILOR_OR_ASK_FORBID_NETWORK"] = "1"
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(mode.Stop) as stop, contextlib.redirect_stdout(io.StringIO()):
                mode.run(mode.parse_args(["--out-dir", tmp]))
            self.assertEqual(stop.exception.code, 1)
            log = json.loads((Path(tmp) / "run-log.json").read_text(encoding="utf-8"))
            self.assertEqual(log["status"], "void")
            self.assertTrue(all("suggestion" not in r for r in log["postings"]))

    def test_captured_output_never_carries_the_home_folder(self):
        spec = importlib.util.spec_from_file_location("tailor_or_ask", SCRIPT)
        mode = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mode)
        home = str(Path.home())
        failed = subprocess.CompletedProcess(args=[], returncode=1, stdout="",
                                             stderr=f"<launching> {home}/Library/Caches/ms-playwright/chrome")
        mode.ev.first_hop = lambda url: (200, None)
        mode.ev.check_live = lambda urls: (failed, {})
        ran = mode.liveness_checks([({"posting_id": "x", "url": "https://job-boards.greenhouse.io/example/jobs/1"},
                                     {"checks": {}})], mode.ev.load_rules(RULES), mode.parse_day("2026-10-19"), True,
                                   "model-judgment")
        self.assertNotIn(home, ran["stderr"])
        self.assertIn("~/Library/Caches/ms-playwright", ran["stderr"])


if __name__ == "__main__":
    unittest.main()
