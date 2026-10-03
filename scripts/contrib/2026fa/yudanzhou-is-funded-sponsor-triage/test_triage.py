"""
Offline tests for triage.py: fixtures only, no network.
Each test is one of the failure cases predicted in CHANGE-BRIEF.md §5–6.

Run from the repo root:
  python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v
"""
import json
import os
import shutil
import sys
import tempfile
import unittest
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import triage  # noqa: E402

FIX = os.path.join(HERE, "fixtures")
TEST_CSV = os.path.join(FIX, "test-companies.csv")
NO_FORM_D = os.path.join(FIX, "no-such-dir", "*.json")   # empty glob: Form D not needed here
TODAY = date(2026, 10, 2)
LABELS = {"record", "your-input", "model-judgment"}


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def posting(pid, company, title, result="active"):
    return {"posting_id": pid, "company": company, "title": title, "url": f"https://example.com/{pid}",
            "liveness": {"result": result, "source": "your-input"}}


class TriageTests(unittest.TestCase):
    def setUp(self):
        self.config = load("config.json")
        self.persona = load(os.path.join("fixtures", "persona.example.json"))

    def run_triage(self, postings, persona=None, today=TODAY):
        return triage.triage(TEST_CSV, NO_FORM_D, self.config, persona or self.persona, postings, today)

    def status_of(self, per_posting, pid):
        return next(r for r in per_posting if r["posting_id"] == pid)["status"]

    # §5 case 2: blank Total Approvals is "no record", never p = 0
    def test_blank_approvals_is_held_out_not_zero(self):
        roles, held, per, _, _ = self.run_triage([posting("b", "DELTA STARTUP INC", "Business Analyst")])
        self.assertEqual(roles, [])
        self.assertEqual(self.status_of(per, "b"), "no-h1b-record")

    # §5 case 1: company missing from the CSV
    def test_missing_company_is_held_out(self):
        roles, _, per, _, _ = self.run_triage([posting("m", "Nowhere Example Corp", "Data Analyst")])
        self.assertEqual(roles, [])
        self.assertEqual(self.status_of(per, "m"), "no-company-row")

    # two CSV rows normalize to the same name: refuse to guess
    def test_ambiguous_name_is_held_out(self):
        _, _, per, _, _ = self.run_triage([posting("t", "Twin Co", "Business Analyst")])
        self.assertEqual(self.status_of(per, "t"), "ambiguous-company-match")

    # exact name still wins over the ambiguous normalized match
    def test_exact_name_resolves_twin(self):
        roles, _, per, _, _ = self.run_triage([posting("t", "TWIN CO INC", "Business Analyst")])
        self.assertEqual(self.status_of(per, "t"), "scored")
        self.assertEqual(roles[0]["sponsorship"]["tier"], "Likely")   # 5 approvals: likely, not proven

    # §5 case 3: OPT window already closed -> timeline gate 0
    def test_closed_opt_window_zeroes_timeline(self):
        late = dict(self.persona, opt_start_date_assumed="2026-01-01")   # window ended 2026-04-01
        roles, _, _, timeline, _ = self.run_triage([posting("a", "ALPHA ANALYTICS INC", "Business Analyst")], persona=late)
        self.assertEqual(timeline["factor"], 0.0)
        self.assertEqual(roles[0]["timeline"]["factor"], 0.0)

    # §6 prediction: "Data Engineer" must not count as Data Analyst
    def test_data_engineer_is_not_data_analyst(self):
        self.assertEqual(triage.classify("Data Engineer", self.config["role_families"]), [])
        self.assertIn("data_analyst", triage.classify("Data Analyst II", self.config["role_families"]))

    # family match decides tier: GAMMA has 25 approvals but none in my families -> Possible
    def test_no_family_match_caps_tier_at_possible(self):
        roles, _, _, _, _ = self.run_triage([posting("g", "GAMMA ROBOTICS INC", "Data Analyst")])
        self.assertEqual(roles[0]["sponsorship"]["tier"], "Possible")
        self.assertEqual(roles[0]["sponsorship"]["evidence"]["titles_in_my_family"], [])

    # G2: unchecked liveness is held out, expired is scored with factor 0
    def test_liveness_gate(self):
        roles, _, per, _, _ = self.run_triage([
            posting("u", "ALPHA ANALYTICS INC", "Business Analyst", result="unchecked"),
            posting("e", "BETA DATA INC", "Data Analyst", result="expired")])
        self.assertEqual(self.status_of(per, "u"), "liveness-unchecked")
        self.assertEqual([r["liveness"]["factor"] for r in roles], [0.0])

    # G1: a CSV without the needed columns stops the run (exit 2), no output guessed
    def test_missing_column_stops(self):
        tmp = tempfile.mkdtemp()
        try:
            bad = os.path.join(tmp, "bad.csv")
            with open(bad, "w", encoding="utf-8") as f:
                f.write("company_name,latest_funding_date\nX INC,2025-01-01\n")
            code = triage.main(["--csv", bad, "--form-d", NO_FORM_D, "--out-dir", tmp, "--no-score",
                                "--today", "2026-10-02"])
            self.assertEqual(code, 2)
            self.assertFalse(os.path.exists(os.path.join(tmp, "roles.json")))
        finally:
            shutil.rmtree(tmp)

    # every term handed to the scorer carries one of the three allowed labels
    def test_every_scored_value_is_labeled(self):
        roles, _, _, _, _ = self.run_triage([
            posting("a", "ALPHA ANALYTICS INC", "Business Analyst"),
            posting("b", "BETA DATA INC", "Data Analyst")])
        self.assertEqual(len(roles), 2)
        for r in roles:
            for term in ("sponsorship", "fit", "liveness", "timeline"):
                self.assertIn(r[term]["source"], LABELS, f"{r['role_id']}.{term}")
            self.assertEqual(r["sponsorship"]["evidence"]["source"], "record")

    # end to end through the REAL scorer (local node process, no network)
    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_end_to_end_with_existing_scorer(self):
        tmp = tempfile.mkdtemp()
        try:
            postings = os.path.join(tmp, "postings.json")
            with open(postings, "w", encoding="utf-8") as f:
                json.dump({"postings": [posting("a", "ALPHA ANALYTICS INC", "Business Analyst"),
                                        posting("e", "BETA DATA INC", "Data Analyst", result="expired")]}, f)
            code = triage.main(["--csv", TEST_CSV, "--form-d", NO_FORM_D, "--postings", postings,
                                "--out-dir", tmp, "--today", "2026-10-02"])
            self.assertEqual(code, 0)
            with open(os.path.join(tmp, "role-scores.json"), encoding="utf-8") as f:
                recs = {r["role_id"]: r["recommendation"] for r in json.load(f)["roles"]}
            self.assertEqual(recs["e"], "Skip")              # dead posting is gated to zero
            for name in ("roles.json", "triage-log.json", "triage-report.md"):
                self.assertTrue(os.path.exists(os.path.join(tmp, name)), name)
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
