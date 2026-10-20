"""Unit tests (stdlib unittest). Run from the repo root:
    python -m unittest discover -s scripts/contrib/2026fa/prpathak1-network-sponsorship-text/test -v
"""
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from _common import load_postings, text_sha256  # noqa: E402
from extract_auth_sentences import extract, sentences  # noqa: E402
from filter_titles import decide  # noqa: E402

FIX = HERE / "fixtures"


class VisaFalseFriend(unittest.TestCase):
    def setUp(self):
        self.res = extract(load_postings(FIX / "BROKEN-visa-false-friend.json"))

    def test_visa_sentence_is_extracted(self):
        hits = [r for r in self.res["sentences"] if r["job_id"] == "fixture-visa-1"]
        self.assertEqual(len(hits), 1)
        self.assertIn("visa", hits[0]["keywords"])
        self.assertEqual(hits[0]["field"], "lists")

    def test_no_sentence_is_ever_auto_labeled(self):
        self.assertTrue(all(r["label"] is None for r in self.res["sentences"]))

    def test_silent_posting_is_silent_not_no(self):
        silent = [p for p in self.res["postings"] if p["job_id"] == "fixture-silent-1"][0]
        self.assertEqual(silent["status"], "silent")
        self.assertEqual(silent["sentences"], 0)


class TitleFilter(unittest.TestCase):
    def test_false_friends_and_flags(self):
        got = {p["job_id"]: decide(p["title"])[0] for p in load_postings(FIX / "BROKEN-road-network-title.json")}
        self.assertEqual(got, {"t1": "exclude", "t2": "include", "t3": "flag", "t4": "exclude", "t5": "include"})


class LeverListLines(unittest.TestCase):
    """Regression for run 1: entities were left in, and bullets ran together without their section."""

    def test_entities_decoded_and_one_line_per_bullet_with_section(self):
        from fetch_lever_full import list_lines
        lists = [{"text": "Required qualifications:", "content": "<li>Ability to obtain a&nbsp;Secret clearance</li><li>8+ years</li>"},
                 {"text": "Preferred", "content": "<li>CCNP</li>"}]
        self.assertEqual(list_lines(lists).split("\n"),
                         ["Required qualifications: Ability to obtain a Secret clearance",
                          "Required qualifications: 8+ years", "Preferred: CCNP"])


class Basics(unittest.TestCase):
    def test_sentence_split_keeps_clauses(self):
        self.assertEqual(sentences("A. B! • C"), ["A.", "B!", "C"])

    def test_sha_changes_when_text_changes(self):
        self.assertNotEqual(text_sha256({"a": "x"}), text_sha256({"a": "y"}))

    def test_refuses_to_write_outside_private(self):
        r = subprocess.run([sys.executable, str(HERE / "extract_auth_sentences.py"),
                            str(FIX / "BROKEN-visa-false-friend.json"), "--out", str(HERE / "should-not-exist")],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 2)
        self.assertIn("refusing to write outside private/", r.stderr)
        self.assertFalse((HERE / "should-not-exist").exists())


if __name__ == "__main__":
    unittest.main()
