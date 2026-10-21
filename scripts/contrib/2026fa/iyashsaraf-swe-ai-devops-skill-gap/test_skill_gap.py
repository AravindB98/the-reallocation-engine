#!/usr/bin/env python3
"""Offline tests for swe-ai-devops-skill-gap. No network calls: fixtures only.

The comparison tests run the repo's REAL skill-demand monitor (node) on fixture
postings, so nothing about the skill count is re-implemented here.

Run from the repo root:
  python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/test_skill_gap.py -v
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, HERE)
import families  # noqa: E402
import select_sponsors  # noqa: E402
import split_families  # noqa: E402

FX = os.path.join(HERE, "fixtures")
TAXONOMY = os.path.join(HERE, "taxonomy", "swe-ai-devops-skills.json")
MONITOR = os.path.join(ROOT, "scripts", "score", "skill-demand-monitor.mjs")


def run(cmd, **kw):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, **kw)


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


class TestFamilies(unittest.TestCase):
    def test_ai_wins_over_swe_when_title_has_both(self):
        self.assertEqual(families.family_of("Software Engineer, Machine Learning"), "ai")

    def test_devops_titles(self):
        for t in ("Site Reliability Engineer", "Senior DevOps Engineer", "Platform Engineer II"):
            self.assertEqual(families.family_of(t), "devops", t)

    def test_swe_and_no_match(self):
        self.assertEqual(families.family_of("Backend Engineer"), "swe")
        self.assertIsNone(families.family_of("Account Executive"))

    def test_us_location(self):
        self.assertTrue(families.is_us("New York, NY"))
        self.assertTrue(families.is_us("Remote - US"))
        self.assertTrue(families.is_us("London, UK; Seattle, WA"))
        self.assertFalse(families.is_us("London, United Kingdom"))
        self.assertFalse(families.is_us("Tokyo, Japan"))


class TestSelectSponsors(unittest.TestCase):
    def test_keeps_only_sponsors_with_target_titles(self):
        kept, counts = select_sponsors.select(os.path.join(FX, "sponsors.fixture.csv"))
        self.assertEqual([c["company"] for c in kept], ["ALPHA INC", "BETA INC", "GAMMA INC"])  # by approvals
        self.assertEqual(counts["no_approvals"], 1)       # NOSPONSOR INC
        self.assertEqual(counts["no_target_title"], 1)    # FINANCEONLY INC: sponsors, but only finance titles
        self.assertEqual(kept[0]["sponsorship_source"], "record")
        self.assertEqual(kept[0]["family_source"], "model-judgment")

    def test_missing_csv_exits_nonzero(self):
        with self.assertRaises(SystemExit) as ctx:
            select_sponsors.select("/nonexistent/missing.csv")
        self.assertEqual(ctx.exception.code, 2)


class TestSplitFamilies(unittest.TestCase):
    def test_filters_and_counts(self):
        postings = load(os.path.join(FX, "postings.fixture.json"))["postings"]
        by_family, counts = split_families.split(postings)
        self.assertEqual({f: len(v) for f, v in by_family.items()}, {"swe": 3, "ai": 3, "devops": 3})
        self.assertEqual(counts, {"ingested": 13, "no_description": 1, "not_us": 1, "no_family_match": 1,
                                  "duplicate": 1})

    def test_word_for_word_repeat_is_counted_once(self):
        postings = load(os.path.join(FX, "postings.fixture.json"))["postings"]
        by_family, _ = split_families.split(postings)
        ids = [p["job_id"] for p in by_family["devops"]]
        self.assertIn("fx-7", ids)          # the first copy is kept
        self.assertNotIn("fx-13", ids)      # same company, same description, another city: dropped


class TestCompareWithRealMonitor(unittest.TestCase):
    """Fixture postings -> split -> the repo's real monitor per family -> compare."""

    def build(self, min_sample=2, opt_end="2027-03-15", today="2026-10-19", learn_days=90, dates=None):
        tmp = tempfile.mkdtemp()
        priv, run_dir = os.path.join(tmp, "private"), os.path.join(tmp, "run")
        r = run([sys.executable, os.path.join(HERE, "split_families.py"), "--postings",
                 os.path.join(FX, "postings.fixture.json"), "--private-dir", priv,
                 "--summary", os.path.join(run_dir, "families-summary.json")])
        self.assertEqual(r.returncode, 0, r.stderr)
        for fam in families.FAMILIES:
            r = run(["node", MONITOR, os.path.join(priv, f"family-{fam}.json"), "--taxonomy", TAXONOMY,
                     "--profile", os.path.join(FX, "profile.fixture.json"), "--min-sample", str(min_sample),
                     "--out-dir", os.path.join(run_dir, fam)])
            self.assertEqual(r.returncode, 0, r.stderr)
        r = run([sys.executable, os.path.join(HERE, "compare_families.py"), "--run-dir", run_dir,
                 "--private-dir", priv, "--profile", os.path.join(FX, "profile.fixture.json"),
                 "--learn-days", str(learn_days), "--today", today]
                + (dates if dates is not None else ["--opt-end-date", opt_end]))
        self.run_dir = run_dir
        return r, load(os.path.join(run_dir, "skill-gap.json"))

    def test_compares_three_families(self):
        r, out = self.build()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(out["status"], "compared")
        comp = out["comparison"]
        self.assertEqual(comp["ranked_families"], ["swe", "ai", "devops"])
        self.assertIn("python", comp["core"])                      # in every fixture family
        self.assertIn("kubernetes", comp["gaps"]["devops"])        # mentioned, not in the fixture profile
        self.assertNotIn("python", comp["gaps"]["devops"])         # in the fixture profile
        devops = {s["id"]: s for s in out["families"]["devops"]["skills"]}
        self.assertTrue(devops["terraform"]["concentrated"])       # all from GAMMA INC
        self.assertEqual(devops["terraform"]["top_company"], "GAMMA INC")
        self.assertEqual(out["non_senior_postings"], {"swe": 3, "ai": 3, "devops": 3})   # no senior titles in the fixture
        md = read(os.path.join(self.run_dir, "skill-gap.md"))
        self.assertIn("Of those, non-senior titles", md)
        gaps = md.split("## Gaps")[1]
        self.assertIn("Terraform (100%) ⚠", gaps)   # a gap that only GAMMA INC asks for is flagged in the gap list

    def test_too_few_postings_stops_instead_of_guessing(self):
        r, out = self.build(min_sample=20)                          # every family has only 3
        self.assertEqual(r.returncode, 3)
        self.assertEqual(out["status"], "stopped")
        for fam in families.FAMILIES:
            self.assertEqual(out["families"][fam]["status"], "insufficient_sample")
        self.assertNotIn("skills", out["families"]["swe"])

    def test_visa_timeline_closed_stops(self):
        r, out = self.build(opt_end="2026-01-01")
        self.assertEqual(r.returncode, 3)
        self.assertEqual(out["timeline_gate"]["status"], "closed")
        self.assertNotIn("comparison", out)
        self.assertIn("No comparison produced", read(os.path.join(self.run_dir, "skill-gap.md")))

    def test_short_timeline_says_apply_with_what_you_have(self):
        r, out = self.build(opt_end="2026-11-15", learn_days=90)  # 27 days left
        self.assertEqual(out["timeline_gate"]["status"], "apply_with_what_you_have")
        md = read(os.path.join(self.run_dir, "skill-gap.md"))
        self.assertIn("not** learning priorities now", md)

    def test_unemployment_limit_binds_before_opt_end(self):
        # FIXTURE dates: EAD starts 2027-02-01, 0 of 90 days used -> job must start by 2027-05-02
        r, out = self.build(dates=["--ead-start", "2027-02-01", "--unemployment-days-used", "0"])
        t = out["timeline_gate"]
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual((t["deadline"], t["binding"], t["days_remaining"]), ("2027-05-02", "unemployment_limit", 195))
        self.assertEqual(t["opt_end_date"], "2028-01-31")                     # derived: EAD start + 12 months
        self.assertIn("job must start by 2027-05-02", read(os.path.join(self.run_dir, "skill-gap.md")))

    def test_stem_extension_uses_150_days(self):
        # FIXTURE dates, as for the fictional persona: STEM OPT already started, 0 of 150 days used
        r, out = self.build(dates=["--ead-start", "2026-07-01", "--opt-end-date", "2029-06-30",
                                   "--unemployment-days-used", "0", "--unemployment-limit", "150"])
        t = out["timeline_gate"]
        self.assertEqual((t["deadline"], t["binding"], t["days_remaining"]), ("2027-03-18", "unemployment_limit", 150))
        self.assertIn("the 150 allowed unemployment days", read(os.path.join(self.run_dir, "skill-gap.md")))

    def test_unemployment_days_used_up_stops(self):
        r, out = self.build(today="2027-06-01", dates=["--ead-start", "2027-02-01", "--unemployment-days-used", "90"])
        self.assertEqual(r.returncode, 3)
        self.assertEqual(out["timeline_gate"]["status"], "closed")
        self.assertIn("unemployment days have run out", out["stop_reason"])

    def test_no_visa_date_is_never_guessed(self):
        r = run([sys.executable, os.path.join(HERE, "compare_families.py"), "--run-dir", tempfile.mkdtemp(),
                 "--private-dir", tempfile.mkdtemp(), "--profile", os.path.join(FX, "profile.fixture.json")])
        self.assertEqual(r.returncode, 2)
        self.assertIn("never guesses a date", r.stderr)


try:
    import requests  # noqa: F401  (the repo's scrapers need it; scripts/ats/requirements.txt)
    HAVE_REQUESTS = True
except ImportError:
    HAVE_REQUESTS = False


class TestGreenhousePatch(unittest.TestCase):
    """The one declared maintained-file patch: the Greenhouse scraper must request and keep descriptions."""

    def setUp(self):
        if not HAVE_REQUESTS:  # skipped in setUp, not with a decorator: pii-scan mistakes a decorator line for an email address
            self.skipTest("needs `requests` (pip install -r scripts/ats/requirements.txt)")
        sys.path.insert(0, os.path.join(ROOT, "scripts", "ats"))
        from scrapers.greenhouse import scraper  # noqa: E402
        self.scraper = scraper

    def test_board_api_asks_for_content(self):
        self.assertTrue(self.scraper.board_api_url("datadog").endswith("/jobs?content=true"))

    def test_escaped_html_content_becomes_plain_text(self):
        job = {"id": 1, "title": "SRE", "absolute_url": "https://example.com/1", "location": {"name": "Seattle, WA"},
               "content": "&lt;p&gt;We run &lt;strong&gt;Kubernetes&lt;/strong&gt; &amp;amp; Terraform.&lt;/p&gt;"}
        rec = self.scraper.normalize_job(job, "GAMMA INC", "gamma")
        self.assertEqual(rec["description_text"], "We run Kubernetes & Terraform.")
        self.assertIn("<strong>Kubernetes</strong>", rec["description_html"])

    def test_job_without_content_still_valid_and_empty(self):
        rec = self.scraper.normalize_job({"id": 2, "title": "SWE"}, "GAMMA INC", "gamma")
        self.assertEqual(rec["description_text"], "")


class TestMissingInput(unittest.TestCase):
    def test_missing_postings_file_exits_nonzero(self):
        r = run([sys.executable, os.path.join(HERE, "split_families.py"), "--postings", "/nonexistent.json",
                 "--private-dir", tempfile.mkdtemp(), "--summary", os.path.join(tempfile.mkdtemp(), "s.json")])
        self.assertEqual(r.returncode, 2)
        self.assertIn("postings file not found", r.stderr)


if __name__ == "__main__":
    unittest.main()
