"""Offline tests for requirements.py, the first slice of the posting-requirements check.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import html
import importlib.util
import json
import sys
import unittest
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("requirements", HERE / "requirements.py")
rq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rq)

RULES = json.loads((HERE / "rules.json").read_text(encoding="utf-8"))
C = rq.compile_rules(RULES)
AS_OF = date(2026, 10, 19)

# Greenhouse returns `content` as escaped HTML; this illustrative posting has the same shape.
GREENHOUSE_STYLE = html.escape(
    "<p><strong>About the role</strong></p><p>Build models.</p>"
    "<p><strong>Key responsibilities:</strong></p><ul><li>Ship 3 years of roadmap</li></ul>"
    "<p><strong>What you&rsquo;ll bring</strong></p><p><strong>Required experience</strong></p>"
    "<ul><li>5+ years of experience in ML infra</li><li>Expertise in Python</li></ul>"
    "<p><strong>Preferred qualifications</strong></p><ul><li>Open-source contributions</li></ul>"
    "<p><strong>What we offer</strong></p><p>Benefits.</p>")


def resume(*jobs):
    return {"experience": [{"title": t, "company": "Example Co", "start_date": s, "end_date": e} for t, s, e in jobs]}


class RuleCalls(unittest.TestCase):
    """The student's calls R4, R5 and R7 (2026-10-19)."""

    def test_work_environment_lines_are_work_conditions(self):
        text = "Requirements\n- Python\nWork Environment\nThis is a full time, in-office position in Brooklyn."
        items = rq.sectioned(rq.text_lines(text), C)
        self.assertEqual([(i["section"], i["text"]) for i in items],
                         [("required", "Python"), ("conditions", "This is a full time, in-office position in Brooklyn.")])

    def test_an_unknown_heading_is_flagged_not_carried_into_the_section(self):
        text = "Requirements\n- Python\nSkills & Experience\n- 3+ years of ML\nPreferred qualifications\n- Spark"
        items = rq.sectioned(rq.text_lines(text), C)
        self.assertEqual([i["section"] for i in items], ["required", "unclear", "unclear", "preferred"])
        self.assertTrue(items[1]["possible_heading"])

    def test_an_alternative_path_line_is_left_unresolved(self):
        res = rq.check("Requirements\n- BS + 3 years or MS + 1 year of ML experience", resume(), RULES, AS_OF)
        item = res["items"][0]
        self.assertEqual(item["result"], "conditional")
        self.assertEqual([f["months"] for f in item["figures"]], [36, 12])
        self.assertEqual(len(res["summary"]["required_conditional"]), 1)

    def test_a_degree_named_beside_a_duration_is_marked_unchecked(self):
        res = rq.check("Requirements\n- B.S. and 3+ years of relevant experience", resume(), RULES, AS_OF)
        self.assertEqual((res["items"][0]["result"], res["items"][0]["degree_named"]), ("gap", True))

    def test_a_negated_firm_phrase_is_not_firm(self):
        self.assertTrue(rq.is_firm("2+ years of ML experience (a firm minimum)", C))
        self.assertFalse(rq.is_firm("2+ years of ML experience; this is not a firm minimum", C))
        self.assertFalse(rq.is_firm("2+ years, which isn't a hard requirement", C))

    def test_a_posting_that_accepts_internships_counts_co_op_months(self):
        text = "Requirements\n- 6+ months of ML engineering experience (internships count)"
        res = rq.check(text, resume(("AI Engineer Co-op", "2025-01", "2025-08")), RULES, AS_OF)
        self.assertEqual(res["items"][0]["result"], "met")


class Lines(unittest.TestCase):
    def test_escaped_html_becomes_lines_with_bullets(self):
        lines = rq.text_lines(GREENHOUSE_STYLE)
        self.assertIn("What you’ll bring", lines)
        self.assertIn("- 5+ years of experience in ML infra", lines)

    def test_plain_text_bullets_are_normalised(self):
        self.assertEqual(rq.text_lines("Requirements\n• Python\n* SQL"), ["Requirements", "- Python", "- SQL"])


class Sections(unittest.TestCase):
    def test_required_and_preferred_lines_are_separated(self):
        items = rq.sectioned(rq.text_lines(GREENHOUSE_STYLE), C)
        self.assertEqual([(i["section"], i["text"]) for i in items if i["section"] in ("required", "preferred")],
                         [("required", "5+ years of experience in ML infra"), ("required", "Expertise in Python"),
                          ("preferred", "Open-source contributions")])

    def test_responsibilities_are_kept_visible_but_never_requirements(self):
        # v0.2.1, the student's call: lines under a heading that is not a requirements section stay visible
        items = {i["text"]: i for i in rq.sectioned(rq.text_lines(GREENHOUSE_STYLE), C)}
        self.assertEqual(items["Ship 3 years of roadmap"]["section"], "other")
        self.assertEqual(items["Ship 3 years of roadmap"]["heading"], "Key responsibilities:")
        checked = rq.check(GREENHOUSE_STYLE, resume(("ML Engineer", "2024-01", "2024-12")), RULES, AS_OF)["items"]
        line = [x for x in checked if x["text"] == "Ship 3 years of roadmap"][0]
        self.assertEqual((line["check"], line["result"]), (None, "not-a-requirement-section"))

    def test_a_bullet_or_a_long_sentence_is_never_a_heading(self):
        self.assertIsNone(rq.heading_kind("- Requirements", C))
        self.assertIsNone(rq.heading_kind("Requirements for this role include a great many things that we care about deeply", C))

    def test_the_students_0_3_1_headings(self):
        # the student's heading decision (2026-10-19); "not required" stays preferred
        self.assertEqual(rq.heading_kind("We’d love to hear from you If you have:", C), "required")
        self.assertEqual(rq.heading_kind("While not required, It’s an added plus if you also have:", C), "preferred")
        self.assertEqual(rq.heading_kind("You Are:", C), "required")
        self.assertEqual(rq.heading_kind("What we look for:", C), "required")
        self.assertEqual(rq.heading_kind("- Nice to have:", C), "preferred")  # a bullet that is only a heading
        self.assertIsNone(rq.heading_kind("- Nice to have experience with Spark", C))  # a bullet with content never is
        self.assertEqual(rq.heading_kind("Preferred qualifications:", C), "preferred")
        self.assertEqual(rq.heading_kind("Minimum Qualifications", C), "required")


class MinimumExperience(unittest.TestCase):
    def test_the_common_phrasings(self):
        cases = {"5+ years of experience": 60, "at least 2 years in industry": 24, "3-5 years of Python": 36,
                 "2 or more years": 24, "minimum of 4 years": 48, "6+ months of hands-on work": 6,
                 "1 year of experience": 12, "Three years of relevant experience": 36,
                 "two years using Python with ML frameworks": 24, "2 years in industry": 24}
        for line, months in cases.items():
            self.assertEqual(rq.minimum_months(line, C)[0], months, line)

    def test_a_ceiling_is_never_read_as_a_minimum(self):
        # found while preparing the rules review: "up to 2 years" had been read as a 2-year minimum
        for line in ("Recent graduates or up to 2 years of experience", "less than 3 years of experience",
                     "no more than 1 year of industry experience"):
            self.assertIsNone(rq.minimum_months(line, C), line)

    def test_a_months_to_years_range_takes_the_months(self):
        self.assertEqual(rq.minimum_months("6 months to 2 years of industry experience", C)[0], 6)

    def test_a_line_without_a_figure_is_not_a_minimum(self):
        self.assertIsNone(rq.minimum_months("Expertise in Python, PyTorch or Jax", C))

    def test_the_kind_of_experience_asked_is_kept_for_a_person(self):
        for line, kind in {"5+ years of experience in ML infra, research engineering, or systems programming.":
                           "in ML infra, research engineering, or systems programming",
                           "two years using Python with ML frameworks": "using Python with ML frameworks",
                           "Three years of relevant experience": "relevant experience"}.items():
            self.assertEqual(rq.kind_asked(line, rq.minimum_months(line, C)[2]), kind, line)

    def test_a_line_that_calls_its_minimum_firm_is_marked(self):
        res = rq.check("Requirements\n- 2+ years of ML experience (a firm requirement)", resume(), RULES, AS_OF)
        self.assertTrue(res["items"][0]["non_negotiable"])

    def test_the_stated_words_are_kept_without_a_trailing_of(self):
        self.assertEqual(rq.minimum_months("6+ months of hands-on work", C)[1], "6+ months")


class DocumentedExperience(unittest.TestCase):
    def test_co_op_months_are_counted_apart(self):
        exp = rq.documented_experience(resume(("AI Engineer Co-op", "2025-01", "2025-08"),
                                              ("ML Engineer", "2023-01", "2023-08")), C, AS_OF)
        self.assertEqual((exp["months_employment"], exp["months_coop"], exp["months_with_coop"]), (8, 8, 16))

    def test_a_job_without_a_type_is_never_assumed_full_time(self):
        # R6: employment of unstated type counts as employment, but not as stated full-time
        exp = rq.documented_experience(resume(("ML Engineer", "2024-01", "2024-12")), C, AS_OF)
        self.assertEqual((exp["months_employment"], exp["months_full_time_stated"]), (12, 0))

    def test_assistantships_contract_and_fellowships_need_supporting_information(self):
        for title in ("Graduate Research Assistant", "Teaching Assistant", "Contract Data Scientist",
                      "Data Science Fellow", "Part-time ML Engineer"):
            exp = rq.documented_experience(resume((title, "2024-01", "2024-12")), C, AS_OF)
            self.assertEqual((exp["months_employment"], exp["months_needs_info"]), (0, 12), title)

    def test_an_explicit_employment_type_wins_over_the_title(self):
        r = {"experience": [{"title": "AI Engineer Co-op", "start_date": "2025-01", "end_date": "2025-12",
                             "employment_type": "full-time"}]}
        exp = rq.documented_experience(r, C, AS_OF)
        self.assertEqual((exp["months_full_time_stated"], exp["months_coop"]), (12, 0))

    def test_overlapping_jobs_count_each_month_once(self):
        exp = rq.documented_experience(resume(("ML Engineer", "2024-01", "2024-12"),
                                              ("Data Engineer", "2024-06", "2025-01")), C, AS_OF)
        self.assertEqual(exp["months_employment"], 13)

    def test_projects_are_not_employment(self):
        r = resume(("ML Engineer", "2024-01", "2024-06"))
        r["projects"] = [{"name": "a side project"}]
        exp = rq.documented_experience(r, C, AS_OF)
        self.assertEqual((exp["months_employment"], exp["projects_not_counted"]), (6, 1))

    def test_a_current_job_runs_to_the_run_date(self):
        exp = rq.documented_experience(resume(("ML Engineer", "2026-01", "present")), C, AS_OF)
        self.assertEqual(exp["months_employment"], 10)

    def test_an_entry_without_a_start_date_is_reported_not_guessed(self):
        exp = rq.documented_experience(resume(("ML Engineer", "", "2025-01")), C, AS_OF)
        self.assertEqual(exp["months_employment"], 0)
        self.assertTrue(exp["problems"])

    def test_the_live_run_persona_is_the_modes_user(self):
        """Kavya Raman, the fictional persona for the v0.1.1 live run: prior full-time production ML, then a co-op
        and a research assistantship. Each type is counted apart, and the projects never count."""
        persona = HERE.parents[3] / "search" / "examples" / "kavya-raman"
        exp = rq.documented_experience(rq.read_resume(persona / "resume.example.json"), C, AS_OF)
        self.assertEqual((exp["months_full_time_stated"], exp["months_coop"], exp["months_needs_info"], exp["months_all"]),
                         (24, 6, 5, 35))
        self.assertEqual((exp["projects_not_counted"], exp["problems"]), (1, []))
        self.assertIn("needs_sponsorship: true", (persona / "profile.yml").read_text(encoding="utf-8"))


class Compare(unittest.TestCase):
    coop_only = rq.documented_experience(resume(("AI Engineer Co-op", "2025-01", "2025-08")), C, AS_OF)

    def test_met_gap_and_unclear(self):
        self.assertEqual(rq.compare(0, self.coop_only, False, False)[0], "met")
        self.assertEqual(rq.compare(6, self.coop_only, False, False)[:2], ("unclear", ["co-op acceptance"]))
        self.assertEqual(rq.compare(12, self.coop_only, False, False)[0], "gap")

    def test_co_op_counts_when_the_posting_accepts_it(self):
        self.assertEqual(rq.compare(6, self.coop_only, True, False)[0], "met")

    def test_a_full_time_line_is_met_only_by_months_stated_full_time(self):
        emp = rq.documented_experience(resume(("ML Engineer", "2024-01", "2024-12")), C, AS_OF)
        self.assertEqual(rq.compare(12, emp, False, False)[0], "met")
        self.assertEqual(rq.compare(12, emp, False, True)[:2], ("unclear", ["full-time status"]))

    def test_the_whole_check_on_a_greenhouse_style_posting(self):
        res = rq.check(GREENHOUSE_STYLE, resume(("AI Engineer Co-op", "2025-01", "2025-08")), RULES, AS_OF)
        s = res["summary"]
        self.assertEqual((s["required_lines"], s["preferred_lines"], len(s["required_gap"]), s["required_not_checked"]),
                         (2, 1, 1, 1))


if __name__ == "__main__":
    unittest.main()
