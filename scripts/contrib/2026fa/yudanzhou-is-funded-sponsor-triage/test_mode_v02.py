"""
Offline tests for the v0.2 DA mode additions: liveness-log import, location gate,
seniority check, liveness conflict, logged gate decisions, and sensitivity.py.
Fixtures only; the scorer runs as a local node process; no network.

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
import sensitivity  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
FIX = os.path.join(HERE, "fixtures")
TEST_CSV = os.path.join(FIX, "test-companies.csv")
NO_FORM_D = os.path.join(FIX, "no-such-dir", "*.json")
TODAY = date(2026, 10, 20)
PERSONA = os.path.join(REPO, "search", "examples", "is-ms-2027-da-focus", "persona.example.json")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def dump(obj, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f)


def post(pid, company, title, location="Remote, United States", url=None, listed=None):
    p = {"posting_id": pid, "company": company, "title": title, "url": url or f"https://example.com/{pid}", "location": location}
    if listed:
        p["listed_in_board_api"] = listed
    return p


class ModeV02Tests(unittest.TestCase):
    def setUp(self):
        self.config = load(os.path.join(HERE, "config.da.json"))
        self.persona = load(PERSONA)
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def log(self, lines):
        p = os.path.join(self.tmp, "liveness.txt")
        with open(p, "w", encoding="utf-8") as f:
            f.write("Checking 2 URL(s)...\n\n" + "\n".join(lines) + "\n\nResults: …\n")
        return triage.load_liveness_log(p, "2026-10-20")

    def run_t(self, postings, live=None, gates=None, config=None):
        return triage.triage(TEST_CSV, NO_FORM_D, config or self.config, self.persona, postings, TODAY, live, gates)

    def status(self, per, pid):
        return next(r["status"] for r in per if r["posting_id"] == pid)

    # the real checker's line format is parsed into record-labelled liveness
    def test_liveness_log_parsing(self):
        live = self.log(["✅ active     https://example.com/a", "❌ expired    https://example.com/b",
                         "           insufficient content — likely nav/footer only"])
        self.assertEqual(live["https://example.com/a"]["result"], "active")
        self.assertEqual(live["https://example.com/b"]["source"], "record")
        self.assertEqual(len(live), 2)

    # a URL missing from the log is never assumed live
    def test_url_missing_from_log_is_unchecked(self):
        live = self.log(["✅ active     https://example.com/other"])
        _, _, per, _, _ = self.run_t([post("a", "ALPHA ANALYTICS INC", "Business Analyst")], live)
        self.assertEqual(self.status(per, "a"), "liveness-unchecked")

    def test_location_gate_cases(self):
        g = triage.location_gate
        self.assertEqual(g("Bengaluru, Karnataka, India"), "non-us")
        self.assertEqual(g("Remote"), "unclear")
        self.assertEqual(g(""), "unclear")
        self.assertEqual(g("Cambridge, MA"), "us")
        self.assertEqual(g("Remote, United States"), "us")
        self.assertEqual(g("Toronto, Ontario, Canada"), "non-us")
        self.assertEqual(g("Bengaluru, Karnataka, India; Austin, TX"), "us")

    # the 2026-10-20 first-pass bug: a Bengaluru posting scored Apply
    def test_non_us_posting_is_not_scored(self):
        live = self.log(["✅ active     https://example.com/a"])
        roles, _, per, _, _ = self.run_t([post("a", "ALPHA ANALYTICS INC", "Business Analyst", "Bengaluru, Karnataka, India", "https://example.com/a")], live)
        self.assertEqual(roles, [])
        self.assertEqual(self.status(per, "a"), "non-us-location")

    def test_seniority_check_holds_for_human(self):
        _, _, per, _, _ = self.run_t([post("s", "ALPHA ANALYTICS INC", "Senior Business Analyst"),
                                      post("t", "BETA DATA INC", "Data Analyst III")])
        self.assertEqual(self.status(per, "s"), "seniority-check")
        self.assertEqual(self.status(per, "t"), "seniority-check")
        self.assertIsNone(triage.seniority_flag("Seniority Data Analyst", self.config["seniority_markers"]))

    # board API listed it, page check said expired: neither record wins on its own
    def test_liveness_conflict(self):
        live = self.log(["❌ expired    https://example.com/c"])
        roles, _, per, _, _ = self.run_t([post("c", "ALPHA ANALYTICS INC", "Business Analyst", url="https://example.com/c", listed="2026-10-20")], live)
        self.assertEqual(roles, [])
        self.assertEqual(self.status(per, "c"), "liveness-conflict")

    def test_gate_decision_clear_and_reject(self):
        live = self.log(["✅ active     https://example.com/s"])
        p = [post("s", "ALPHA ANALYTICS INC", "Senior Business Analyst", url="https://example.com/s")]
        d = {"posting_id": "s", "gate": "seniority-check", "by": "tester", "date": "2026-10-20", "reason": "posting accepts 1 year"}
        roles, _, _, _, _ = self.run_t(p, live, {("s", "seniority-check"): dict(d, decision="clear")})
        self.assertEqual(len(roles), 1)
        roles, _, per, _, _ = self.run_t(p, live, {("s", "seniority-check"): dict(d, decision="reject")})
        self.assertEqual(roles, [])
        self.assertEqual(per[0]["gate_decisions"][0]["decision"], "reject")

    # only human-review gates can be cleared, and every decision needs reason/by/date
    def test_gate_decision_rules(self):
        bad = os.path.join(self.tmp, "g.json")
        for x in ({"posting_id": "a", "gate": "non-us-location", "decision": "clear", "reason": "r", "by": "b", "date": "d"},
                  {"posting_id": "a", "gate": "seniority-check", "decision": "clear"}):
            with open(bad, "w", encoding="utf-8") as f:
                json.dump({"decisions": [x]}, f)
            with self.assertRaises(triage.GateError):
                triage.load_gate_decisions(bad)

    # sensitivity: hiring lag never moves a decision this far from the OPT window; a p change can
    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_sensitivity_counts_flips(self):
        persona = dict(self.persona, self_rated_fit=dict(self.persona["self_rated_fit"], data_analyst=0.0))
        pp = os.path.join(self.tmp, "persona.json"); dump(persona, pp)
        cfg = dict(self.config, location_gate={"enabled": False}, seniority_markers=[])
        cp = os.path.join(self.tmp, "config.json"); dump(cfg, cp)
        posts = os.path.join(self.tmp, "posts.json")
        dump({"postings": [dict(post("b", "BETA DATA INC", "Data Analyst"), liveness={"result": "active", "source": "your-input"})]}, posts)
        out = os.path.join(self.tmp, "sens")
        code = sensitivity.main(["--csv", TEST_CSV, "--form-d", NO_FORM_D, "--config", cp, "--persona", pp,
                                 "--postings", posts, "--today", "2026-10-20", "--out-dir", out])
        self.assertEqual(code, 0)
        res = load(os.path.join(out, "sensitivity.json"))
        lag = [v for v in res["variants"] if v["assumption"] == "hiring_lag_days_assumed"]
        self.assertTrue(lag and all(v["decisions_changed"] == 0 for v in lag))
        self.assertIn("sponsorship_tiers.likely.p", res["fragile_assumptions"])   # BETA: Likely tier, fit 0 → p 0.4 drops it to Skip
        self.assertTrue(os.path.exists(os.path.join(out, "sensitivity.md")))


if __name__ == "__main__":
    unittest.main()
