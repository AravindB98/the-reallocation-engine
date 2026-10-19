"""Offline tests for evidence.py, the record checks reused from Assignment 3, on a
fictional 11-row sponsorship file (fixtures/test-sponsorship.csv: example.com sites, 555 phone
numbers, placeholder names). Each row exercises one branch of the sponsorship check.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("evidence", HERE / "evidence.py")
ev = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ev)

CSV = HERE / "fixtures" / "test-sponsorship.csv"


class SponsorshipEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = ev.load_rules(HERE / "rules.json")
        cls.normalize = staticmethod(ev.load_normalizer())  # a plain function, not a method
        cls.index, cls.by_row, cls.rows = ev.load_sponsorship(CSV, ev.load_normalizer())

    def row(self, name: str) -> int:
        rows = self.index[self.normalize(name)]
        self.assertEqual(len(rows), 1, name)
        return rows[0]

    def evidence(self, name: str):
        return ev.sponsorship_evidence(self.by_row[self.row(name)], self.rules)

    def test_the_file_loads_all_rows(self):
        self.assertEqual(self.rows, 13)

    def test_a_level_ii_title_counts_and_stays_visible(self):
        # R1: II / L2 titles are historical evidence for this mode; the exact title is kept
        e, _ = self.evidence("LEVEL TWO AI INC")
        self.assertEqual(e["tier"]["value"], "Proven")
        self.assertIn("'Machine Learning Engineer II'", e["tier"]["rule"])
        self.assertEqual(e["ml_titles_counted"]["value"], ["Machine Learning Engineer II"])

    def test_a_lead_title_needs_context(self):
        # R2: Lead / Founding / Architect / Fellow are neither counted nor treated as senior
        e, _ = self.evidence("LEAD ONLY AI INC")
        self.assertEqual((e["tier"]["value"], e["tier"]["gap"]), ("Likely", "needs-context"))
        self.assertEqual(e["ml_titles_needing_context"]["value"], ["Lead Machine Learning Engineer"])

    def test_clear_senior_titles_stay_outside_the_signal(self):
        e, _ = self.evidence("SENIOR ONLY LABS INC")
        self.assertEqual(e["tier"]["gap"], "marked-only")

    def test_an_unmarked_ml_title_with_enough_approvals_is_proven(self):
        e, reason = self.evidence("EXAMPLE ROBOTICS INC")
        self.assertIsNone(reason)
        self.assertEqual((e["tier"]["value"], e["p"]["value"]), ("Proven", 0.9))

    def test_only_senior_ml_titles_is_likely_marked_only(self):
        e, _ = self.evidence("SENIOR ONLY LABS INC")
        self.assertEqual((e["tier"]["value"], e["tier"]["gap"]), ("Likely", "marked-only"))

    def test_no_ml_title_is_likely_no_role_family_title(self):
        e, _ = self.evidence("GENERALIST SOFTWARE CO")
        self.assertEqual(e["tier"]["gap"], "no-role-family-title")

    def test_a_thin_record_is_likely_not_proven(self):
        e, _ = self.evidence("TINY ML STARTUP INC")
        self.assertEqual((e["tier"]["value"], e["tier"]["gap"]), ("Likely", "thin-record"))

    def test_no_h1b_fields_is_unknown_not_no(self):
        self.assertEqual(self.evidence("NO RECORD AI INC"), (None, "no-h1b-record"))

    def test_zero_approvals_is_left_to_a_person(self):
        self.assertEqual(self.evidence("ZERO APPROVALS INC"), (None, "no-approvals-on-record"))

    def test_an_unreadable_title_list_is_left_to_a_person(self):
        self.assertEqual(self.evidence("BAD TITLES INC"), (None, "unparseable-sponsored-titles"))

    def test_a_record_shared_with_a_differently_named_company_is_flagged(self):
        others = ev.lookalikes(self.row("LOOKALIKE LABS INC"), self.by_row)
        self.assertEqual([o["company_name"] for o in others], ["LOOKALYKE LABS INC"])

    def test_two_legal_forms_of_one_name_are_one_normalized_key(self):
        # TWIN NAME INC and TWIN NAME LLC normalise to the same key, so a posting for "Twin Name" is ambiguous.
        self.assertEqual(len(self.index[self.normalize("Twin Name")]), 2)

    def test_rule_derived_values_carry_the_declarer_label(self):
        e, _ = self.evidence("EXAMPLE ROBOTICS INC")
        self.assertEqual(e["approvals"]["source"], "record")  # read from the file
        declared = json.loads((HERE / "rules.json").read_text(encoding="utf-8"))["declared_by"]["who"]
        self.assertEqual(e["tier"]["source"], ev.label_for(declared))  # follows whoever declared the rules file

    def test_the_same_rules_drafted_by_claude_give_model_judgment(self):
        rules = json.loads((HERE / "rules.json").read_text(encoding="utf-8"))
        rules["declared_by"]["who"] = "claude-code"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "rules.json"
            path.write_text(json.dumps(rules), encoding="utf-8")
            drafted = ev.load_rules(path)
        e, _ = ev.sponsorship_evidence(self.by_row[self.row("EXAMPLE ROBOTICS INC")], drafted)
        self.assertEqual(e["tier"]["source"], "model-judgment")

    def test_personal_columns_never_leave_the_file(self):
        row = self.by_row[self.row("EXAMPLE ROBOTICS INC")]
        for column in ("phone", "executive_officers", "board_directors"):
            self.assertNotIn(column, row)


class RealFile(unittest.TestCase):
    """R1 on the real 80 Days file (offline: the file ships in the repo)."""

    @classmethod
    def setUpClass(cls):
        cls.rules = ev.load_rules(HERE / "rules.json")
        csv_path = ev.REPO / cls.rules["source"]["csv"]
        cls.index, cls.by_row, _ = ev.load_sponsorship(csv_path, ev.load_normalizer())

    def test_twilio_l2_title_now_counts(self):
        e, _ = ev.sponsorship_evidence(self.by_row[27765], self.rules)
        self.assertEqual(e["tier"]["value"], "Proven")
        self.assertIn("(L2)", e["tier"]["rule"])

    def test_the_pathai_lookalike_record_is_still_shared(self):
        # PathAI and PathRAI carry the same record; the mode holds both until identity is resolved
        self.assertEqual([o["company_name"] for o in ev.lookalikes(19754, self.by_row)], ["PATHRAI INC"])


class RulesDeclarer(unittest.TestCase):
    def test_label_for_follows_the_declarer(self):
        self.assertEqual(ev.label_for("student"), "your-input")
        self.assertEqual(ev.label_for("claude-code"), "model-judgment")
        with self.assertRaises(KeyError):
            ev.label_for("someone-else")

    def test_rules_without_a_known_declarer_stop_the_run(self):
        rules = json.loads((HERE / "rules.json").read_text(encoding="utf-8"))
        rules["declared_by"]["who"] = None
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "rules.json"
            path.write_text(json.dumps(rules), encoding="utf-8")
            with self.assertRaises(ev.Stop):
                ev.load_rules(path)


if __name__ == "__main__":
    unittest.main()
