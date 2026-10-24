"""Offline tests: one per CHANGE-BRIEF §8 failure case, a happy path, null p through the real
scorer, plus rule-level and whole-run-failure checks. Every run writes to a tempfile directory;
the default out/ is never touched (checked in tearDownClass).

    python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
"""
import atexit
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
FX = HERE / "fixtures"
RUN = HERE / "run.py"
DEFAULT_OUT = HERE / "out"
sys.path.insert(0, str(HERE))

from lib import classify  # noqa: E402


def _snapshot(d):
    if not d.exists():
        return None
    return sorted((str(p.relative_to(d)), p.stat().st_mtime_ns) for p in d.rglob("*") if p.is_file())


def run_case(postings, config=None, rules=None, extra=None):
    """Run run.py as a subprocess into a fresh temp dir. Returns (exit, run.json, roles.json, report.md, tmp)."""
    tmp = tempfile.mkdtemp(prefix="dthe-test-")
    atexit.register(shutil.rmtree, tmp, True)
    cmd = [sys.executable, str(RUN), "--postings", str(postings), "--out", tmp]
    if config:
        cmd += ["--config", str(config)]
    if rules:
        cmd += ["--rules", str(rules)]
    cmd += extra or []
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    proc.tmp = tmp
    out = Path(tmp)
    rj = json.loads((out / "run.json").read_text()) if (out / "run.json").exists() else None
    roles = json.loads((out / "roles.json").read_text()) if (out / "roles.json").exists() else None
    rep = (out / "report.md").read_text() if (out / "report.md").exists() else None
    return proc.returncode, rj, roles, rep, proc


class Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out_before = _snapshot(DEFAULT_OUT)
        cls.rules = json.loads((HERE / "rules.json").read_text())

    @classmethod
    def tearDownClass(cls):
        assert _snapshot(DEFAULT_OUT) == cls.out_before, "tests modified the default out/ directory"

    # ── §8 failure cases ────────────────────────────────────────────────
    def test_company_not_in_csv(self):
        code, rj, roles, rep, _ = run_case(FX / "not-in-csv.json")
        self.assertEqual(code, 3)
        self.assertEqual(roles, [])
        self.assertEqual([s["posting_id"] for s in rj["stops"]], ["nic-1"])
        self.assertEqual(rj["stops"][0]["reason"], "no-match")
        self.assertEqual(rj["stops"][0]["candidates"]["value"], [])
        self.assertIn("Quillfeather Data Labs, Inc.", rep)
        self.assertFalse(rj["scorer"].get("called", True))

    def test_company_matches_more_than_one_row(self):
        code, rj, roles, rep, _ = run_case(FX / "multi-match.json")
        self.assertEqual(code, 3)
        self.assertEqual(roles, [])
        s = rj["stops"][0]
        self.assertEqual(s["reason"], "more-than-one-row")
        names = sorted(c["company_name"] for c in s["candidates"]["value"])
        self.assertEqual(names, ["ARCTURUS THERAPEUTICS INC", "ARCTURUS THERAPEUTICS LTD"])
        for c in s["candidates"]["value"]:
            self.assertEqual(set(c), {"company_name", "city", "state", "has_sponsorship_data"})
        self.assertIn("ARCTURUS THERAPEUTICS LTD", rep)

    def test_in_csv_without_sponsorship_gives_null_p(self):
        code, rj, roles, rep, _ = run_case(FX / "no-sponsorship.json")
        self.assertEqual(code, 0)
        self.assertEqual(len(roles), 1)
        self.assertIsNone(roles[0]["sponsorship"]["p"])          # null, not 0
        self.assertEqual(roles[0]["sponsorship"]["tier"], "unknown")
        self.assertIn("no record ≠ does not sponsor", rep)
        self.assertIn(self.rules["next_action"]["value"]["by_evidence_group"]["no-record"], rep)
        self.assertEqual(rj["scored"][0]["next_action"]["value"],
                         self.rules["next_action"]["value"]["by_evidence_group"]["no-record"])

    def test_only_senior_data_titles(self):
        code, rj, roles, rep, _ = run_case(FX / "senior-only.json")
        self.assertEqual(code, 0)
        e = rj["scored"][0]
        self.assertEqual(e["sponsorship_term"]["value"], {"rule_id": "otherwise", "tier": "possible", "p": 0.5})
        data = [t for t in e["title_classification"]["value"] if t["data_family"]]
        self.assertTrue(data)
        self.assertTrue(all(t["bucket"] == "senior" for t in data))
        for t in data:
            self.assertIn(t["title"], rep)

    def test_missing_liveness_is_refused(self):
        code, rj, roles, rep, _ = run_case(FX / "missing-liveness.json")
        self.assertEqual(code, 3)
        self.assertEqual(roles, [])
        self.assertIn("liveness", " ".join(rj["refusals"][0]["refused_because"]))

    def test_missing_timeline_input_is_refused(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-missing-timeline.json")
        self.assertEqual(code, 3)
        self.assertEqual(roles, [])
        self.assertIn("hiring_lag_days", " ".join(rj["refusals"][0]["refused_because"]))

    def test_opt_window_closed_gates_to_skip(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-opt-closed.json")
        self.assertEqual(code, 0)
        self.assertEqual(roles[0]["timeline"]["factor"], 0.0)
        r = rj["scored"][0]["scorer_result"]["value"]
        self.assertEqual(r["machine_recommendation"], "Skip")
        self.assertTrue(r["reason"].startswith("gated: timeline"))
        tl = rj["scored"][0]["timeline"]["value"]
        self.assertGreater(tl["projected_start"], tl["window_end"])
        self.assertIn(f"{tl['projected_start']} > {tl['window_end']} -> factor 0.0", tl["arithmetic"])

    # ── Revision 1: §7 timeline corrected ───────────────────────────────
    def test_projected_start_before_opt_start_is_deferred_not_failed(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-deferred-start.json")
        self.assertEqual(code, 0)
        self.assertEqual(roles[0]["timeline"]["factor"], 1.0)
        tl = rj["scored"][0]["timeline"]["value"]
        self.assertEqual((tl["projected_start"], tl["opt_start"], tl["deferred_start_days"]),
                         ("2026-12-02", "2027-02-01", 61))
        notes = [n for n in rj["scored"][0]["notes"] if n["type"] == "deferred-start"]
        self.assertEqual(len(notes), 1)
        self.assertIn("deferred start: employer must accept a start 61 days after offer", notes[0]["text"])
        self.assertEqual(notes[0]["scoring_effect"], "none")
        self.assertIn("deferred start: employer must accept a start 61 days after offer", rep)

    def test_projected_start_on_window_end_is_inside(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-window-end.json")
        self.assertEqual(code, 0)
        tl = rj["scored"][0]["timeline"]["value"]
        self.assertEqual(tl["projected_start"], tl["window_end"])
        self.assertEqual(roles[0]["timeline"]["factor"], 1.0)
        self.assertFalse([n for n in rj["scored"][0]["notes"] if n["type"] == "deferred-start"])

    def test_projected_start_one_day_after_window_end_fails(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-day-after-window-end.json")
        self.assertEqual(code, 0)
        self.assertEqual(roles[0]["timeline"]["factor"], 0.0)
        self.assertEqual(rj["scored"][0]["scorer_result"]["value"]["machine_recommendation"], "Skip")

    # ── Revision 2: next action, duplicate evidence ────────────────────
    def test_next_action_differs_by_evidence_group_with_same_recommendation(self):
        code, rj, roles, rep, proc = run_case(FX / "next-action-pair.json")
        self.assertEqual(code, 0)
        by = {e["posting_id"]: e for e in rj["scored"]}
        self.assertEqual(by["na-1"]["evidence_group"]["value"], "only-senior")
        self.assertEqual(by["na-2"]["evidence_group"]["value"], "no-data-title")
        rec = lambda e: e["scorer_result"]["value"]["recommendation"]
        self.assertEqual(rec(by["na-1"]), rec(by["na-2"]))
        self.assertNotEqual(by["na-1"]["next_action"]["value"], by["na-2"]["next_action"]["value"])
        groups = self.rules["next_action"]["value"]["by_evidence_group"]
        self.assertEqual(by["na-1"]["next_action"]["value"], groups["only-senior"])
        self.assertEqual(by["na-2"]["next_action"]["value"], groups["no-data-title"])
        # next action never changes the scorer's recommendation
        scorer = json.loads((Path(proc.tmp) / "score" / "role-scores.json").read_text())
        for r in scorer["roles"]:
            self.assertEqual(by[r["role_id"]]["scorer_result"]["value"]["recommendation"], r["recommendation"])
        for e in by.values():
            self.assertIn(e["next_action"]["value"], rep)

    def test_gate_closed_skip_gets_gate_next_action(self):
        tmpl = self.rules["next_action"]["value"]["gate_closed"]
        code, rj, roles, rep, _ = run_case(FX / "happy.json", config=FX / "config-opt-closed.json")
        e = rj["scored"][0]
        self.assertEqual(e["scorer_result"]["value"]["recommendation"], "Skip")
        self.assertEqual(e["next_action"]["value"], tmpl.format(gate="timeline"))
        code, rj, roles, rep, _ = run_case(FX / "liveness-zero.json")
        e = rj["scored"][0]
        self.assertEqual(e["scorer_result"]["value"]["recommendation"], "Skip")
        self.assertEqual(e["next_action"]["value"], tmpl.format(gate="liveness"))
        self.assertEqual(e["evidence_group"]["value"], "proven")   # gate precedence beats the group action

    def test_duplicate_evidence_note_for_pathai_and_pathrai(self):
        code, rj, roles, rep, _ = run_case(FX / "duplicate-evidence.json")
        self.assertEqual(code, 0)
        for e in rj["scored"]:
            dup = [n for n in e["notes"] if n["type"] == "duplicate-evidence"]
            self.assertEqual(len(dup), 1, e["posting_id"])
            self.assertEqual(sorted(dup[0]["companies"]), ["PATHAI INC", "PATHRAI INC"])
            self.assertIn("may belong to only one of them", dup[0]["text"])
            self.assertEqual(dup[0]["scoring_effect"], "none")
        self.assertIn("PATHAI INC and PATHRAI INC", rep)
        self.assertIn("may belong to only one of them", rep)

    def test_no_duplicate_note_for_distinct_evidence(self):
        code, rj, roles, rep, _ = run_case(FX / "next-action-pair.json")
        self.assertFalse([n for n in rj["notes"] if n["type"] == "duplicate-evidence"])

    # ── Revision: title-family note ─────────────────────────────────────
    def test_title_family_note_only_when_posting_title_lacks_matched_phrase(self):
        code, rj, roles, rep, _ = run_case(FX / "no-bls-row.json")
        by = {e["posting_id"]: e for e in rj["scored"]}
        kinds = lambda e: [n["type"] for n in e["notes"]]
        self.assertNotIn("title-family", kinds(by["nb-1"]))      # 'Junior Data Engineer' vs sponsored 'Data Engineer'
        self.assertIn("title-family", kinds(by["nb-2"]))         # 'Associate Data Scientist' vs 'Data Engineer'
        note = [n for n in by["nb-2"]["notes"] if n["type"] == "title-family"][0]
        self.assertIn("Company-level data-family match only: posting title 'Associate Data Scientist'", note["text"])
        self.assertIn("This does not show the company sponsored this specific title.", rep)
        self.assertEqual(by["nb-1"]["scorer_result"]["value"]["composite"],
                         by["nb-2"]["scorer_result"]["value"]["composite"])   # non-scoring

    def test_run_config_holds_run_inputs_only(self):
        cfg = json.loads((HERE / "run-config.json").read_text())
        self.assertEqual({k for k in cfg if not k.startswith("_")},
                         {"target_titles", "as_of", "opt_start", "window_days", "hiring_lag_days"})
        self.assertNotIn("placeholder", json.dumps(cfg).lower())

    def test_target_title_without_bls_row(self):
        code, rj, roles, rep, _ = run_case(FX / "no-bls-row.json")
        self.assertEqual(code, 0)
        by = {e["posting_id"]: e for e in rj["scored"]}
        self.assertEqual(by["nb-1"]["bls_context"]["value"], "no SOC row")
        self.assertNotEqual(by["nb-2"]["bls_context"]["value"], "no SOC row")
        self.assertEqual(by["nb-1"]["scorer_result"]["value"]["composite"],
                         by["nb-2"]["scorer_result"]["value"]["composite"])   # scoring unaffected
        self.assertIn("no SOC row", rep)

    # ── happy path ──────────────────────────────────────────────────────
    def test_happy_path(self):
        code, rj, roles, rep, _ = run_case(FX / "happy.json")
        self.assertEqual(code, 0)
        self.assertEqual(rj["status"], "completed")
        self.assertEqual(roles[0]["sponsorship"], {"p": 0.7, "tier": "Proven", "source": "your-input"})
        self.assertEqual(roles[0]["liveness"]["source"], "your-input")
        e = rj["scored"][0]
        self.assertEqual(e["company_match"]["value"]["rule"], "exact-upper-case")
        for key in ("company_match", "sponsorship_evidence", "title_classification", "sponsorship_term",
                    "fit", "liveness", "timeline", "bls_context", "scorer_result"):
            self.assertIn(e[key]["label"], {"record", "your-input", "model-judgment"}, key)
        self.assertEqual(e["liveness"]["determined_by"], "fixture")
        self.assertTrue(rep.startswith("# ") and "## Executive summary" in rep.split("## Run record")[0])

    # ── null p through the REAL scorer ─────────────────────────────────
    def test_null_sponsorship_p_through_real_scorer(self):
        code, rj, roles, rep, _ = run_case(FX / "null-p.json")
        self.assertEqual(code, 0)
        self.assertIsNone(roles[0]["sponsorship"]["p"])
        r = rj["scored"][0]["scorer_result"]["value"]
        votes = [v["factor"] for v in r["trace"]["votes"]]
        self.assertNotIn("sponsorship", votes)                    # vote dropped, not zero-filled
        self.assertEqual(votes, ["fit"])
        self.assertAlmostEqual(r["composite"], 0.7 * rj["scorer"]["config"]["value"]["weights"]["fit"], places=4)
        # Observed in Phase 3a: fit 0.7 alone reaches the Consider floor. Q7: not overridden.
        self.assertEqual(r["machine_recommendation"], "Consider")

    # ── Q4: exact match proceeds, siblings noted ───────────────────────
    def test_exact_match_with_siblings_is_noted_not_stopped(self):
        code, rj, roles, rep, _ = run_case(FX / "exact-with-siblings.json")
        self.assertEqual(code, 0)
        self.assertEqual(len(roles), 1)
        sib = rj["scored"][0]["sibling_rows"]["value"]
        self.assertEqual([s["company_name"] for s in sib], ["ARCTURUS THERAPEUTICS LTD"])
        sib_notes = [n for n in rj["notes"] if n["type"] == "sibling-rows"]
        self.assertEqual(len(sib_notes), 1)
        self.assertIn("ARCTURUS THERAPEUTICS LTD", sib_notes[0]["text"])
        self.assertIn("ARCTURUS THERAPEUTICS LTD", rep)

    # ── whole-run failures and bad args ─────────────────────────────────
    def _rules_copy(self, mutate):
        r = json.loads((HERE / "rules.json").read_text())
        mutate(r)
        fd, path = tempfile.mkstemp(suffix=".json", prefix="dthe-rules-")
        self.addCleanup(os.remove, path)
        with os.fdopen(fd, "w") as f:
            json.dump(r, f)
        return path

    def test_sha_mismatch_is_whole_run_failure(self):
        path = self._rules_copy(lambda r: r["provenance"]["value"].__setitem__("sponsorship_csv_sha256", "0" * 64))
        code, rj, roles, rep, _ = run_case(FX / "happy.json", rules=path)
        self.assertEqual(code, 1)
        self.assertEqual(rj["status"], "failed")
        self.assertIn("SHA-256 mismatch", rj["error"])
        self.assertIsNone(rep)

    def test_unlabeled_rule_is_whole_run_failure(self):
        path = self._rules_copy(lambda r: r["min_approvals_for_proven"].pop("label"))
        code, rj, roles, rep, _ = run_case(FX / "happy.json", rules=path)
        self.assertEqual(code, 1)
        self.assertIn("min_approvals_for_proven", rj["error"])

    def test_bad_argument_exits_2(self):
        code, *_ = run_case(FX / "happy.json", extra=["--no-such-flag"])
        self.assertEqual(code, 2)


class Rules(unittest.TestCase):
    """Rule-level checks against rules.json as written (no thresholds copied here)."""

    @classmethod
    def setUpClass(cls):
        cls.r = {k: v["value"] for k, v in json.loads((HERE / "rules.json").read_text()).items()
                 if not k.startswith("_")}

    def b(self, t):
        return classify.bucket(t, self.r["seniority"])[0]

    def test_level_tokens(self):
        self.assertEqual(self.b("Machine Learning Engineer I"), "entry-or-unmarked")
        self.assertEqual(self.b("Data Engineer II"), "mid")
        self.assertEqual(self.b("Data Analyst 2"), "mid")
        self.assertEqual(self.b("Machine Learning Engineer III"), "senior")
        self.assertEqual(self.b("Professional 3, Business Analytics"), "senior")

    def test_whole_word_seniority(self):
        self.assertEqual(self.b("Sr. Data Analyst"), "senior")
        self.assertEqual(self.b("SRE Data Engineer"), "entry-or-unmarked")   # 'sr' is not a word here
        self.assertEqual(self.b("Ahead Data Analyst"), "entry-or-unmarked")   # 'head' only as a word
        self.assertEqual(self.b("Senior Data Engineer II"), "senior")         # senior beats mid

    def test_entry_markers_and_unmarked(self):
        self.assertEqual(classify.bucket("New Grad Data Scientist", self.r["seniority"]),
                         ("entry-or-unmarked", ["new grad"]))
        self.assertEqual(classify.bucket("Data Scientist", self.r["seniority"]),
                         ("entry-or-unmarked", ["unmarked"]))

    def test_evidence_groups(self):
        def ev(approvals, *titles):
            rows = [{"title": t, "data_family": classify.data_phrase(t, self.r["data_family_phrases"]) is not None,
                     "bucket": classify.bucket(t, self.r["seniority"])[0]} for t in titles]
            return {"has_sponsorship_record": approvals is not None, "total_approvals": approvals, "titles": rows}
        g = lambda e: classify.evidence_group(e, self.r)
        m = self.r["min_approvals_for_proven"]
        self.assertEqual(g(ev(None)), "no-record")
        self.assertEqual(g(ev(m, "Product Manager")), "no-data-title")
        self.assertEqual(g(ev(m, "Data Engineer")), "proven")
        self.assertEqual(g(ev(m - 1, "Data Engineer")), "entry-under-min-approvals")
        self.assertEqual(g(ev(m, "Data Engineer II", "Senior Data Scientist")), "only-mid")
        self.assertEqual(g(ev(m, "Senior Data Scientist")), "only-senior")

    def test_allowlist_is_substring_and_precise(self):
        ph = self.r["data_family_phrases"]
        self.assertEqual(classify.data_phrase("Senior DATA ENGINEER", ph), "data engineer")
        for not_data in ("Financial Analyst", "Database Administrator", "Quality Control Analyst"):
            self.assertIsNone(classify.data_phrase(not_data, ph), not_data)


if __name__ == "__main__":
    unittest.main()
