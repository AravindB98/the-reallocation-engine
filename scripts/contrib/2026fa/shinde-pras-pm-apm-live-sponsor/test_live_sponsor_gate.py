"""Offline tests for live_sponsor_gate.py. Invented companies, example.com hosts, no network."""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import live_sponsor_gate as g  # noqa: E402

FIX = HERE / "fixtures"
NORMALIZE = g.load_normalizer()
INDEX = g.load_index(FIX / "companies.csv", NORMALIZE)
ICON = {"active": "✅", "expired": "❌", "uncertain": "⚠️"}


def canned(pairs):
    """Render ats:liveness-shaped output for [(url, verdict, reason)]."""
    lines = ["", "> the-reallocation-engine@1.0.0 ats:liveness", "", "Checking %d URL(s)..." % len(pairs), ""]
    for url, verdict, reason in pairs:
        lines.append("%s %s %s" % (ICON[verdict], verdict.ljust(10), url))
        if verdict != "active":
            lines.append("           " + reason)
    lines += ["", "Results: 0 active  0 expired  0 uncertain"]
    return "\n".join(lines) + "\n"


def row(approvals, titles, denials="1"):
    return {"company_name": "X", "Total Approvals": approvals, "Total Denials": denials,
            "top_job_titles_sponsored": titles}


class LivenessMapping(unittest.TestCase):
    def test_five_outcomes(self):
        self.assertEqual(g.liveness_state("active", ""), ("PASS", 1.0, None))
        self.assertEqual(g.liveness_state("expired", "insufficient content — likely nav/footer only")[:2],
                         ("UNRESOLVED", None))
        self.assertEqual(g.liveness_state("expired", "pattern matched: /closed/")[:2], ("FAIL", 0.0))
        self.assertEqual(g.liveness_state("uncertain", "content present")[:2], ("UNRESOLVED", None))
        # fifth outcome: a control that comes back active voids the host (see VoidRule for both sides)
        url = "https://h.example.com/jobs/12345"
        inputs = {"timeline": {"factor": 1}, "postings": [{"url": url, "company": "Quillfern Widgets", "title": "t",
                                                            "fit": 0.5}]}
        v = {url: {"verdict": "active", "reason": ""}, "ctl": {"verdict": "active", "reason": ""}}
        recs, roles, _, _ = g.evaluate(inputs, {}, INDEX, NORMALIZE, v, {url: "ctl"}, "2026-01-01T00:00:00Z")
        self.assertEqual((recs[0]["liveness"]["state"], roles), ("VOID", []))


class OutputParser(unittest.TestCase):
    def test_canned_fixture(self):
        text = (FIX / "liveness-canned.txt").read_text(encoding="utf-8")
        urls = ["https://jobs.alpha.example.com/careers/positions/1234567",
                "https://jobs.alpha.example.com/careers/positions/1234012",
                "https://careers.bravo.example.com/apply?jobId=889900&src=web",
                "https://careers.bravo.example.com/apply?jobId=889455&src=web"]
        got = g.parse_liveness(text, urls)
        self.assertEqual([x["verdict"] for x in got], ["active", "expired", "uncertain", "expired"])
        self.assertEqual(got[0]["reason"], "")
        self.assertIn("insufficient content", got[1]["reason"])
        self.assertIn("no visible apply control", got[2]["reason"])

    def test_fatal_is_run_level_stop(self):
        with self.assertRaises(g.Stop) as ctx:
            g.parse_liveness("Fatal: browserType.launch: Executable doesn't exist\n", ["u"])
        self.assertEqual(ctx.exception.code, "chromium_unavailable")

    def test_url_mismatch_and_missing_results_line(self):
        with self.assertRaises(g.Stop):
            g.parse_liveness(canned([("https://a.example.com/1", "active", "")]), ["https://a.example.com/2"])
        with self.assertRaises(g.Stop):
            g.parse_liveness("✅ active     https://a.example.com/1\n", ["https://a.example.com/1"])


class ControlBuilder(unittest.TestCase):
    def assert_last3(self, url, control, job_id):
        self.assertNotEqual(url, control)
        diff = [i for i, (a, b) in enumerate(zip(url, control)) if a != b]
        start = url.index(job_id) + len(job_id) - 3
        self.assertTrue(diff and all(start <= i < start + 3 for i in diff), (url, control))

    def test_path_query_and_slug_ids(self):
        for url, jid in (("https://a.example.com/careers/positions/1234567", "1234567"),
                         ("https://b.example.com/view?jobId=424242&source=web", "424242"),
                         ("https://c.example.com/careers/new-grad-pm-2027-start-9081726354", "9081726354"),
                         ("https://d.example.com/jobs?gh_jid=4400123", "4400123")):
            self.assert_last3(url, g.build_control(url), jid)

    def test_same_id_twice_changes_both(self):
        url = "https://a.example.com/jobs/55512345?id=55512345"
        control = g.build_control(url)
        self.assertEqual(control.count("55512890"), 2)
        self.assertNotIn("55512345", control)

    def test_no_id_gives_none(self):
        self.assertIsNone(g.build_control("https://a.example.com/careers/product-manager"))
        self.assertIsNone(g.build_control("https://a.example.com/jobs/1234"))


class VoidRule(unittest.TestCase):
    def run_one(self, control_verdict):
        url = "https://h.example.com/jobs/12345"
        inputs = {"timeline": {"factor": 1}, "postings": [{"url": url, "company": "Quillfern Widgets", "title": "t",
                                                            "fit": 0.5}]}
        v = {url: {"verdict": "active", "reason": ""}, "ctl": {"verdict": control_verdict, "reason": "x"}}
        return g.evaluate(inputs, {}, INDEX, NORMALIZE, v, {url: "ctl"}, "2026-01-01T00:00:00Z")[0][0]

    def test_control_active_voids_host(self):
        rec = self.run_one("active")
        self.assertEqual((rec["liveness"]["state"], rec["hold_reasons"]), ("VOID", ["host_void"]))

    def test_control_expired_keeps_host(self):
        self.assertEqual(self.run_one("expired")["liveness"]["state"], "PASS")


class MatchStates(unittest.TestCase):
    def test_states(self):
        self.assertEqual(g.match_company("Quillfern Widgets", INDEX, NORMALIZE)[0], "MATCH")
        self.assertEqual(g.match_company("Quillfern Widgets, Inc.", INDEX, NORMALIZE)[0], "MATCH")  # suffix only
        self.assertEqual(g.match_company("Ivorstrand Insights", INDEX, NORMALIZE)[0], "AMBIGUOUS")
        state, _, cands = g.match_company("Jessamine Jetworks", INDEX, NORMALIZE)
        self.assertEqual((state, len(cands)), ("CANDIDATE", 1))
        self.assertEqual(g.match_company("Zephyrine Zoetrope", INDEX, NORMALIZE)[0], "NOT_FOUND")

    def test_candidate_prefix_is_whole_word(self):
        # a raw string prefix would wrongly pair "Quill" with QUILLFERN WIDGETS INC
        self.assertEqual(g.match_company("Quill Partners", INDEX, NORMALIZE)[0], "NOT_FOUND")
        state, _, cands = g.match_company("Quillfern Robotics", INDEX, NORMALIZE)
        self.assertEqual((state, [r["company_name"] for r in cands]), ("CANDIDATE", ["QUILLFERN WIDGETS INC"]))


class RuleV01(unittest.TestCase):
    def test_all_seven_rows(self):
        cases = [(row("", ""), None, "rule_hold_no_h1b_data"),
                 (row("120", "['Associate Product Manager']"), ("Likely", 0.70), None),
                 (row("80", "['Product Manager']"), ("Likely", 0.50), None),
                 (row("60", "['Senior Product Manager', 'Staff Product Manager']"), ("Likely", 0.30), None),
                 (row("20", "['Product Manager']"), ("Likely", 0.20), None),
                 (row("200", "['Software Engineer']"), ("Unknown", 0.15), None),
                 (row("abc", "['Product Manager']"), None, "rule_hold_undefined_case")]
        for r, tier_p, hold in cases:
            got = g.classify_row(r)
            self.assertEqual(got["hold"], hold, r)
            if tier_p:
                self.assertEqual((got["tier"], got["p"]), tier_p, r)
        self.assertEqual(g.classify_row(row("0", "['Product Manager']"))["hold"], "rule_hold_undefined_case")
        self.assertEqual(g.classify_row(row("12", "not a list"))["hold"], "rule_hold_undefined_case")


class Inputs(unittest.TestCase):
    def test_timeline(self):
        for bad in ({}, {"timeline": {}}, {"timeline": {"factor": 1.01}}, {"timeline": {"factor": "0.5"}},
                    {"timeline": {"factor": True}}):
            with self.assertRaises(g.Stop):
                g.check_timeline(bad)
        self.assertEqual(g.check_timeline({"timeline": {"factor": 0}}), 0)
        self.assertEqual(g.check_timeline({"timeline": {"factor": 1}}), 1)

    def test_profile_guard(self):
        base = {"postings": [{"url": "https://a.example.com/1", "company": "c", "title": "t", "fit": 0.5}]}
        with self.assertRaises(g.Stop) as ctx:
            g.check_inputs(dict(base, profile={"authorization": "F-1 OPT; not authorized to work without sponsorship"}))
        self.assertEqual(ctx.exception.code, "profile_zeroes_sponsorship")
        g.check_inputs(dict(base, profile={"authorization": "F-1 OPT, needs H-1B sponsorship"}))

    def test_out_dir_not_ignored_stops(self):
        with self.assertRaises(g.Stop) as ctx:
            g.check_out_dir(HERE / "not-ignored-out")
        self.assertEqual(ctx.exception.code, "out_dir_not_ignored")
        g.check_out_dir(Path(tempfile.gettempdir()) / "outside-repo")  # outside the repo: allowed


class LeakCheck(unittest.TestCase):
    def test_planted_raw_url_is_caught(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            (tmp / "report.md").write_text("## Executive summary\nsee https://JOBS.alpha.example.com/careers/1\n")
            (tmp / "clean.md").write_text("posting 1 on host A\n")
            hits = g.leak_scan([tmp / "report.md", tmp / "clean.md"], ["https://jobs.alpha.example.com/careers/1"])
            self.assertEqual(hits, [str(tmp / "report.md")])
        finally:
            shutil.rmtree(tmp)


POSTS = [("https://jobs.alpha.example.com/careers/positions/1234567", "Quillfern Widgets", 0.8),
         ("https://careers.bravo.example.com/apply?jobId=889900&src=web", "Brindlewood Labs", 0.7),
         ("https://boards.charlie.example.com/j/77700011", "Jessamine Jetworks", 0.6),
         ("https://jobs.alpha.example.com/careers/positions/2223334", "Zephyrine Zoetrope", 0.9),
         ("https://jobs.alpha.example.com/careers/positions/5556667", "Elsquith Cloud", 0.9)]
VERDICTS = [("active", "", "expired", "insufficient content"), ("active", "", "active", ""),
            ("expired", "insufficient content \u2014 likely nav/footer only", "expired", "insufficient content"),
            ("active", "", "expired", "insufficient content"),
            ("expired", "pattern matched: /closed/", "expired", "insufficient content")]
CSV_NAMES = [r["company_name"] for rows in INDEX.exact.values() for r in rows]


def run_scenario(extra, human=True, canned_flag=True):
    """Write invented inputs + a canned liveness file to an OS temp dir and run main(). Returns (tmp, rc)."""
    tmp = Path(tempfile.mkdtemp())
    inputs = {"timeline": {"factor": 0.9}, "profile": {"authorization": "F-1 OPT, needs H-1B sponsorship"},
              "postings": [{"url": u, "company": c, "title": "Product Manager", "fit": f} for u, c, f in POSTS]}
    pairs = []
    for (u, _, _), (pv, pr, cv, cr) in zip(POSTS, VERDICTS):
        pairs += [(u, pv, pr), (g.build_control(u), cv, cr)]
    (tmp / "inputs.json").write_text(json.dumps(inputs))
    (tmp / "replay.txt").write_text(canned(pairs), encoding="utf-8")
    args = ["--inputs", str(tmp / "inputs.json"), "--out-dir", str(tmp / "out"),
            "--liveness-from", str(tmp / "replay.txt"), "--csv", str(FIX / "companies.csv")] + extra
    if canned_flag:
        args.append("--canned")
    if human:
        (tmp / "human.json").write_text(json.dumps({
            "liveness": [{"posting": 3, "state": "open", "note": "checked by hand"}],
            "sponsor": [{"posting": 3, "confirm_row": "JESSAMINE JETWORKS GLOBAL INC", "note": "legal name"}]}))
        args += ["--human", str(tmp / "human.json")]
    return tmp, g.main(args)


class HoldRouting(unittest.TestCase):
    def test_hold_never_reaches_scorer_input(self):
        inputs = {"timeline": {"factor": 0.9}, "postings": [
            {"url": u, "company": c, "title": "t", "fit": f} for u, c, f in POSTS]}
        verdicts = {}
        for (u, _, _), (pv, pr, cv, cr) in zip(POSTS, VERDICTS):
            verdicts[u] = {"verdict": pv, "reason": pr}
            verdicts[g.build_control(u)] = {"verdict": cv, "reason": cr}
        controls = {u: g.build_control(u) for u, _, _ in POSTS}
        recs, roles, _, _ = g.evaluate(inputs, {}, INDEX, NORMALIZE, verdicts, controls, "2026-01-01T00:00:00Z")
        held = {r["posting_ref"] for r in recs if r["hold_reasons"]}
        self.assertEqual(held, {"posting 2", "posting 3", "posting 4"})
        self.assertFalse(held & {r["role_id"] for r in roles})
        for r in roles:
            self.assertTrue(g._is_unit_number(r["liveness"]["factor"]) and g._is_unit_number(r["timeline"]["factor"]))
        self.assertTrue(all(c in g.HOLD_CODES for r in recs for c in r["hold_reasons"]))


class PassOneOutputs(unittest.TestCase):
    """--no-score run (no node needed): JSON contract, report heading, private candidates, provenance."""

    def setUp(self):
        self.tmp, self.rc = run_scenario(["--no-score"], human=False)
        self.log = json.loads((self.tmp / "out/run-log.json").read_text())
        self.report = (self.tmp / "out/report.md").read_text()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_json_contract(self):
        self.assertEqual(self.rc, 0, self.log["stops"])
        self.assertTrue(self.log["generated_at"].endswith("Z") and self.log["captured_at"].endswith("Z"))
        self.assertEqual((self.log["mode"], self.log["liveness_source"]), ("sample", "canned"))
        self.assertEqual(self.log["timeline"], {"factor": 0.9, "source": "your-input"})
        for p in self.log["postings"]:
            for gate in ("liveness", "sponsor", "fit"):
                self.assertIn(p[gate]["source"], g.SOURCES)
            for key in ("approvals", "denials", "p"):
                self.assertIsInstance(p["sponsor"][key], (int, float, type(None)))
            self.assertNotIsInstance(p["sponsor"]["approvals"], bool)

    def test_report_first_heading_is_executive_summary(self):
        self.assertTrue(self.report.startswith("## Executive summary\n"))

    def test_candidates_private_file_and_no_csv_names_in_outputs(self):
        cand = (self.tmp / "out/candidates-private.txt").read_text()
        self.assertIn("posting 3: CANDIDATE, 1 row(s)", cand)
        self.assertIn("JESSAMINE JETWORKS GLOBAL INC", cand)
        blob = (self.report + (self.tmp / "out/run-log.json").read_text()).lower()
        for name in CSV_NAMES + [c for _, c, _ in POSTS]:
            self.assertNotIn(name.lower(), blob)
        self.assertNotIn("example.com", blob)

    def test_replay_of_saved_real_output_is_live_mode(self):
        tmp, rc = run_scenario(["--no-score"], human=False, canned_flag=False)
        try:
            log = json.loads((tmp / "out/run-log.json").read_text())
            self.assertEqual((rc, log["mode"], log["liveness_source"]), (0, "live", "replay"))
        finally:
            shutil.rmtree(tmp)


class EndToEnd(unittest.TestCase):
    """Canned replay with the real repo scorer (node), invented data, OS temp out-dir."""

    def test_replay_with_real_scorer(self):
        if shutil.which("node") is None:
            self.skipTest("node not installed")
        tmp, rc = run_scenario([])
        try:
            log = json.loads((tmp / "out/run-log.json").read_text())
            roles = json.loads((tmp / "out/roles.json").read_text())
            self.assertEqual(rc, 0, log["stops"])
            got = {p["posting_ref"]: (p["decision"], p["hold_reasons"]) for p in log["postings"]}
            self.assertEqual(got["posting 1"], ("Consider", []))
            self.assertEqual(got["posting 2"], ("HOLD", ["host_void"]))
            self.assertEqual(got["posting 3"], ("Consider", []))
            self.assertEqual(got["posting 4"], ("HOLD", ["sponsor_not_found"]))
            self.assertEqual(got["posting 5"][0], "Skip")
            self.assertEqual(sorted(r["role_id"] for r in roles), ["posting 1", "posting 3", "posting 5"])
            self.assertTrue(all("override" not in r for r in roles))
            self.assertEqual(sorted(h["value"] for h in log["human_inputs"]), ["confirmed", "open"])
            self.assertTrue(all(h["recorded_at"].endswith("Z") for h in log["human_inputs"]))
            self.assertEqual(log["scorer"]["exit_code"], 0)
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
