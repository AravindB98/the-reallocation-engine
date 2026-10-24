"""Offline tests for discover.py (new in v0.2.0). No test touches the network: the board read is replaced by a
fixture listing, and the one subprocess run sets TAILOR_OR_ASK_FORBID_NETWORK.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import contextlib
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
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import discover as d  # noqa: E402
import evidence as ev  # noqa: E402
import tailor_or_ask as mode  # noqa: E402

FIXTURES = HERE / "fixtures"
TARGETS = FIXTURES / "targets-test.json"
C = d.compile_discovery(ev.load_rules(HERE / "rules.json"))


def keep(title, where="San Francisco, CA"):
    return d.classify({"title": title, "location": {"name": where}}, C)


class Filters(unittest.TestCase):
    """The student's filter choices (2026-10-19), as drafted in rules.json `discovery`."""

    def test_ml_ai_engineering_is_kept_and_level_ii_stays(self):
        self.assertTrue(keep("Machine Learning Engineer")["keep"])
        self.assertTrue(keep("Machine Learning Engineer II, Responsible AI")["keep"])
        self.assertTrue(keep("AI Applied Scientist")["keep"])

    def test_senior_titles_and_internships_are_dropped_with_their_reason(self):
        self.assertEqual(keep("Senior Machine Learning Engineer")["reason"], "senior title")
        self.assertEqual(keep("Staff Software Engineer, ML Infrastructure")["reason"], "senior title")
        self.assertEqual(keep("PhD Intern, AI Applied Scientist (2027)")["reason"], "internship or fellowship")

    def test_data_engineering_needs_an_explicit_entry_marker(self):
        self.assertEqual(keep("Data Engineer")["reason"], "not a kept family")
        self.assertTrue(keep("Data Engineer, New Grad")["keep"])
        self.assertTrue(keep("Associate Data Engineer")["keep"])
        self.assertTrue(keep("Data Engineer I")["keep"])

    def test_software_engineering_is_kept_when_it_names_ml_or_is_new_grad(self):
        self.assertTrue(keep("Software Engineer, ML Infrastructure")["keep"])
        self.assertTrue(keep("University Grad Software Engineer 2027 (USA)")["keep"])
        flags = keep("[2027] Software Engineer, Early Career")["flags"]
        self.assertTrue(any(f.startswith("new grad: check the graduation window") for f in flags), flags)
        self.assertIn("a year in the title does not establish the start", flags[0])
        self.assertEqual(keep("University Grad Software Engineer 2027 (USA)")["category"], "New-grad software engineering")
        self.assertEqual(keep("Software Engineer, ML Infrastructure")["category"], "ML-focused software engineering")
        self.assertEqual(keep("Software Engineer, GenAI Platform")["category"], "ML-focused software engineering")
        self.assertEqual(keep("Software Engineer, Backend")["reason"], "not a kept family")
        self.assertEqual(keep("Software Engineer, Data Model")["reason"], "not a kept family")  # "model" is not ML

    def test_the_students_review_titles_are_kept_and_flagged_not_dropped(self):
        # the student's adoption (2026-10-19): FDE, abuse research and level II for review; level III reviewed in context
        for title in ("AI Engineer – Forward Deployed Engineering (AI FDE)", "Abuse Research Engineer",
                      "Machine Learning Engineer II, Responsible AI"):
            v = keep(title)
            self.assertTrue(v["keep"], title)
            self.assertTrue(any(f.startswith("review the responsibilities") for f in v["flags"]), (title, v["flags"]))
        v = keep("Machine Learning Engineer III")
        self.assertTrue(v["keep"])
        self.assertTrue(any(f.startswith("level III or above: review it") for f in v["flags"]))

    def test_customer_facing_and_non_engineering_titles_are_not_kept(self):
        for title in ("Account Executive, AI Sales", "Solutions Engineer, AI Build Team",
                      "Support Engineer, AI Infrastructure & Tooling", "Enterprise AI Development Strategist"):
            self.assertEqual(keep(title)["reason"], "not a kept family", title)

    def test_us_only_with_unclear_places_flagged_not_dropped(self):
        self.assertEqual(keep("Machine Learning Engineer", "London, UK")["reason"], "outside the US")
        self.assertEqual(keep("Machine Learning Engineer", "Seoul, South Korea")["reason"], "outside the US")
        self.assertTrue(keep("Machine Learning Engineer", "New York, NY; London, UK")["keep"])
        self.assertTrue(keep("Machine Learning Engineer", "Remote - United States")["keep"])
        unclear = keep("Machine Learning Engineer", "Remote")
        self.assertTrue(unclear["keep"])
        self.assertIn("location unclear: check it", unclear["flags"])

    def test_the_cap_keeps_the_newest_and_counts_the_rest(self):
        jobs = [{"id": i, "title": "Machine Learning Engineer", "location": {"name": "Austin, TX"},
                 "updated_at": f"2026-10-{10 + i:02d}T00:00:00Z"} for i in range(7)]
        kept, counts = d.triage(jobs, C)
        self.assertEqual([j["id"] for j in kept], [6, 5, 4, 3, 2])
        self.assertEqual((counts["kept"], counts["over the cap"], counts["listed"]), (5, 2, 7))


class OfflineRun(unittest.TestCase):
    """discover.py end to end on a fixture listing: the board read is replaced, everything else is real."""

    @classmethod
    def setUpClass(cls):
        listing = json.loads((FIXTURES / "board-listing.json").read_text(encoding="utf-8"))
        cls._real = d.fetch_listing
        d.fetch_listing = lambda slug: (f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", listing)
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name)
        with contextlib.redirect_stdout(io.StringIO()):
            cls.code = d.run(d.parse_args(["--targets", str(TARGETS), "--out-dir", str(cls.out)]))
        cls.log = json.loads((cls.out / "discovery-log.json").read_text(encoding="utf-8"))
        cls.queue = json.loads((cls.out / "queue.json").read_text(encoding="utf-8"))
        cls.audit = {a["company"]: a for a in cls.log["audit"]}

    @classmethod
    def tearDownClass(cls):
        d.fetch_listing = cls._real
        cls.tmp.cleanup()

    def test_the_run_completes_and_every_listing_is_counted_once(self):
        self.assertEqual(self.code, 0)
        counts = self.audit["Discord"]["counts"]
        self.assertEqual(sum(v for k, v in counts.items() if k != "listed"), counts["listed"])
        self.assertEqual(counts["kept"], 5)

    def test_a_company_without_a_readable_board_is_reported_not_skipped(self):
        g = self.audit["Google"]
        self.assertIn("no board the engine can read", g["listing"])
        held = {r["legal_name"]: r["holds"] for r in g["file_rows"]}
        self.assertEqual(held, {"GOOGLE LLC": "no row in the file", "ALPHABET INC": "no H-1B fields"})
        report = (self.out / "target-audit.md").read_text(encoding="utf-8")
        self.assertIn("The mode cannot read the job boards of Google", report)
        self.assertIn("## Executive summary", report)

    def test_the_queue_is_valid_for_the_mode_and_keeps_fit_for_the_person(self):
        q = mode.load_queue(self.out / "queue.json")
        self.assertEqual(len(q["postings"]), 5)
        for p in q["postings"]:
            self.assertNotIn("fit", p)
            self.assertEqual(p["timeline"]["compute"], {"weeks": 12})
            self.assertTrue(p["discovered"]["listing_url"].startswith("https://boards-api.greenhouse.io/"))
        self.assertEqual(mode.discovered_api_url(q["postings"][0]),
                         f"https://boards-api.greenhouse.io/v1/boards/example/jobs/{q['postings'][0]['discovered']['job_id']}")

    def test_the_persons_identity_decision_is_copied_into_each_posting(self):
        for p in self.queue["postings"]:
            self.assertEqual((p["company_identity"]["status"], p["company_identity"]["csv_row"]), ("confirmed", 7770))
            self.assertTrue(p["discovered"]["category"])

    def test_the_cap_is_described_as_a_sample_and_unread_sites_as_a_manual_check(self):
        report = (self.out / "target-audit.md").read_text(encoding="utf-8")
        self.assertIn("a sample: the newest matches, up to the cap. They are not that company's best matches", report)
        self.assertIn("**Check by hand.** The careers sites of Google need a separate manual check", report)

    def test_an_identity_decided_by_claude_is_refused(self):
        bad = json.loads(TARGETS.read_text(encoding="utf-8"))
        bad["targets"][0]["company_identity"]["by"] = "claude-code"
        with tempfile.TemporaryDirectory() as tmp:
            path = FIXTURES / "targets-bad.tmp.json"
            try:
                path.write_text(json.dumps(bad), encoding="utf-8")
                with self.assertRaises(ev.Stop):
                    d.load_targets(path)
            finally:
                path.unlink(missing_ok=True)

    def test_the_audit_labels_who_produced_what(self):
        labels = {k: v["source"] for k, v in self.log["labels"].items()}
        self.assertEqual(labels["titles, URLs, locations"], "record")
        self.assertEqual(labels["legal names"], "model-judgment")
        self.assertEqual(labels["file rows"], "computed")


class NoNetwork(unittest.TestCase):
    def test_a_board_read_is_refused_when_the_network_is_forbidden(self):
        with tempfile.TemporaryDirectory() as tmp:
            proc = subprocess.run([sys.executable, str(HERE / "discover.py"), "--targets", str(TARGETS), "--out-dir", tmp],
                                  capture_output=True, text=True, cwd=REPO,
                                  env={**os.environ, "TAILOR_OR_ASK_FORBID_NETWORK": "1"})
            self.assertEqual(proc.returncode, 2, proc.stderr)
            self.assertFalse((Path(tmp) / "queue.json").exists())


if __name__ == "__main__":
    unittest.main()
