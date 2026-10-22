#!/usr/bin/env python3
"""Offline tests for cap_exempt_triage.py. No network; fixtures only.

Run from the repository root:
  python3 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage -v
"""

from __future__ import annotations

import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIX = HERE / "fixtures"
spec = importlib.util.spec_from_file_location("cap_exempt_triage", HERE / "cap_exempt_triage.py")
cet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cet)

PERSONA = cet.ROOT / "search/examples/priya-nair/profile.yml"
EXT = FIX / "priya-lottery-ext.json"
TARGETS = FIX / "targets.sample.json"
LIVENESS = FIX / "liveness.sample.txt"
MINI = FIX / "mini_80days.csv"
MINI_IPEDS = FIX / "mini_ipeds.csv"
MINI_USCIS = FIX / "mini_uscis.csv"
RUN_DATE = "2026-10-21"


def run(*extra, ext=EXT, csv=MINI, liveness=LIVENESS, run_date=RUN_DATE, targets=TARGETS, ipeds=MINI_IPEDS, uscis=MINI_USCIS):
    """Run the CLI into a temp dir; return (exit code, run.json or None, out dir, stderr)."""
    tmp = Path(tempfile.mkdtemp()) / "out"
    argv = ["triage", "--persona", str(PERSONA), "--ext", str(ext), "--targets", str(targets),
            "--csv", str(csv), "--run-date", run_date, "--out-dir", str(tmp),
            "--ipeds", str(ipeds), "--uscis", str(uscis), *extra]
    for path in ([] if liveness is None else liveness if isinstance(liveness, list) else [liveness]):
        argv += ["--liveness", str(path)]
    err = io.StringIO()
    with redirect_stdout(io.StringIO()), redirect_stderr(err):
        code = cet.main(argv)
    log = json.loads((tmp / "run.json").read_text()) if (tmp / "run.json").exists() else None
    return code, log, tmp, err.getvalue()


def by_id(log):
    return {r["id"]: r for r in log["rows"]}


def liveness_invariant_violations(log, liveness_path):
    """Every row whose URL is absent from the liveness file must be HELD.

    Computed from the liveness file itself, independent of the script's logic.
    """
    checked = set()
    for line in Path(liveness_path).read_text().splitlines():
        parts = line.split()
        if len(parts) == 3 and parts[1] in ("active", "expired", "uncertain"):
            checked.add(parts[2].rstrip("/"))
    return [r["id"] for r in log["rows"]
            if r["url"].rstrip("/") not in checked and not r["outcome"].startswith("HELD")]


class SampleRun(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.code, cls.log, cls.out, _ = run()
        cls.rows = by_id(cls.log)

    def test_exit_code_and_outcomes(self):
        self.assertEqual(self.code, 0)
        expected = {"A": "SHORTLIST", "B": "SHORTLIST", "C": "FLAG", "D": "FLAG",
                    "E": "SKIP", "F": "HELD", "G": "HELD"}
        self.assertEqual({k: v["outcome"].split(" — ")[0] for k, v in self.rows.items()}, expected)

    def test_unchecked_url_is_held_not_scored(self):
        f = self.rows["F"]
        self.assertEqual(f["liveness"]["result"], "unchecked")
        self.assertTrue(f["outcome"].startswith("HELD"))
        self.assertIn("not checked", f["why"])

    def test_uncertain_is_held_even_without_claim(self):
        self.assertEqual(self.rows["G"]["liveness"]["result"], "uncertain")
        self.assertTrue(self.rows["G"]["outcome"].startswith("HELD"))

    def test_expired_is_skipped(self):
        self.assertEqual(self.rows["E"]["outcome"], "SKIP — expired")

    def test_trailing_slash_still_matches_liveness(self):
        self.assertEqual(self.rows["A"]["liveness"]["result"], "active")

    def test_form_d_match_contradicts_name_only_claim(self):
        c = self.rows["C"]
        self.assertEqual(c["cap_exempt_status"], "CONTRADICTED-BY-SIGNAL")
        self.assertEqual(c["form_d_match"]["company_name"], "CHAPMAN UNIVERSITY ENTERPRISES INC")
        provenances = {s["provenance"] for s in c["signals"]}
        self.assertEqual(provenances, {"record", "your-input"})

    def test_llc_form_is_a_signal(self):
        signals = [s["signal"] for s in self.rows["D"]["signals"]]
        self.assertTrue(any("legal form" in s for s in signals))

    def test_never_verified(self):
        statuses = {r["cap_exempt_status"] for r in self.log["rows"]}
        self.assertTrue(statuses <= {"UNVERIFIED", "UNVERIFIED-RECORD-SUPPORTED", "CONTRADICTED-BY-SIGNAL", "HUMAN-ATTESTED"})
        self.assertEqual(self.log["summary"]["cap_exempt_verified"], 0)
        self.assertNotIn("cap-exempt: yes", (self.out / "report.md").read_text().lower())

    def test_wage_is_record_vs_input(self):
        w = self.rows["A"]["wage"]
        self.assertEqual(w["national_median"], 133080.0)
        self.assertEqual(w["posted_midpoint"], 105000.0)
        self.assertEqual(w["posted_vs_national_pct"], -21.1)
        self.assertEqual(w["soc_provenance"], "model-judgment")

    def test_summary_counts(self):
        s = self.log["summary"]
        self.assertEqual((s["shortlist"], s["flag"], s["held"], s["skip"]), (2, 2, 2, 1))
        self.assertEqual(s["not_shortlisted_rate"], round(5 / 7, 3))

    def test_liveness_invariant_holds(self):
        self.assertEqual(liveness_invariant_violations(self.log, LIVENESS), [])

    def test_no_absolute_paths_in_outputs(self):
        for name in ("run.json", "report.md"):
            text = (self.out / name).read_text()
            self.assertNotIn("/Users/", text)
            self.assertNotIn("/home/", text)

    def test_report_opens_with_executive_summary(self):
        lines = (self.out / "report.md").read_text().splitlines()
        self.assertEqual(lines[2], "## Executive summary")


class EvidenceSignals(unittest.TestCase):
    def setUp(self):
        self.index = cet.index_80days(cet.read_csv_checked(MINI, cet.REQUIRED_80DAYS_COLUMNS, "mini"))
        self.bls = cet.read_csv_checked(cet.DEFAULT_BLS, cet.REQUIRED_BLS_COLUMNS, "bls")
        self.live = {"https://x.example.org/1": {"result": "active", "reason": ""}}

    def target(self, **kw):
        t = {"id": "T", "employer": "Example Cancer Institute, Inc.", "title": "Data Scientist",
             "url": "https://x.example.org/1", "claimed_category": "affiliated-nonprofit",
             "claim_basis": "employer-statement", "claim_source": "fixture quote", "soc": "15-2051"}
        t.update(kw)
        return t

    def test_inc_alone_is_not_evidence_either_way(self):
        r = cet.triage_target(self.target(), self.live, self.index, self.bls)
        self.assertEqual(r["legal_form"], "corporate-ambiguous")
        self.assertEqual(r["signals"], [])
        self.assertEqual(r["outcome"], "SHORTLIST — exemption UNVERIFIED")

    def test_legal_name_is_checked_for_form_and_form_d(self):
        r = cet.triage_target(self.target(employer="Example Robotics", legal_name="Example Robotics LLC"),
                              self.live, self.index, self.bls)
        kinds = [s["signal"] for s in r["signals"]]
        self.assertTrue(any("legal form" in k for k in kinds))
        self.assertTrue(any("Form D" in k for k in kinds))

    def test_hr_answer_is_human_attested_not_verified(self):
        r = cet.triage_target(self.target(exemption_evidence="HR email, fictional"), self.live, self.index, self.bls)
        self.assertEqual(r["cap_exempt_status"], "HUMAN-ATTESTED")
        self.assertEqual(r["outcome"], "SHORTLIST — HR answer recorded")

    def test_statement_without_a_source_counts_as_name_only(self):
        r = cet.triage_target(self.target(claim_source=""), self.live, self.index, self.bls)
        self.assertEqual(r["claimed_category"]["basis"], "name-only")
        r2 = cet.triage_target(self.target(claim_source="employer page quote"), self.live, self.index, self.bls)
        self.assertEqual(r2["claimed_category"]["basis"], "employer-statement")

    def test_unknown_soc_leaves_wage_empty(self):
        r = cet.triage_target(self.target(soc="99-9999"), self.live, self.index, self.bls)
        self.assertIsNone(r["wage"]["national_median"])


class FederalRecords(unittest.TestCase):
    """IPEDS (federal college list) and USCIS FY2023 H-1B counts, on tiny fixtures."""

    @classmethod
    def setUpClass(cls):
        cls.records = cet.load_records(MINI_IPEDS, MINI_USCIS)
        cls.index = cet.index_80days(cet.read_csv_checked(MINI, cet.REQUIRED_80DAYS_COLUMNS, "mini"))
        cls.bls = cet.read_csv_checked(cet.DEFAULT_BLS, cet.REQUIRED_BLS_COLUMNS, "bls")
        cls.live = {"https://x.example.org/1": {"result": "active", "reason": ""}}

    def triage(self, **kw):
        t = {"id": "T", "employer": "Example State University", "title": "Research Engineer",
             "url": "https://x.example.org/1", "claimed_category": "IHE",
             "claim_basis": "employer-statement", "claim_source": "fixture quote", "soc": "15-1252"}
        t.update(kw)
        return cet.triage_target(t, self.live, self.index, self.bls, self.records)

    def test_public_university_is_record_supported_not_verified(self):
        r = self.triage()
        self.assertEqual(r["cap_exempt_status"], "UNVERIFIED-RECORD-SUPPORTED")
        self.assertEqual(r["outcome"], "SHORTLIST — exemption UNVERIFIED (record-supported)")
        self.assertEqual(r["support"][0]["provenance"], "record (exact normalized name)")

    def test_uscis_rows_for_one_employer_are_summed(self):
        u = self.triage()["uscis_h1b_fy2023"]
        self.assertEqual((u["initial_approvals"], u["continuing_approvals"], u["rows"]), (6, 2, 2))
        self.assertEqual(u["states"], ["MA", "blank"])

    def test_for_profit_college_is_contradicted_by_record(self):
        r = self.triage(employer="Example For-Profit University-Online")
        self.assertEqual(r["cap_exempt_status"], "CONTRADICTED-BY-SIGNAL")
        self.assertTrue(r["outcome"].startswith("FLAG"))
        self.assertIn("for-profit", r["signals"][0]["signal"])

    def test_alias_matches(self):
        self.assertEqual(self.triage(employer="Example State")["ipeds"]["unitid"], "900001")

    def test_closed_institution_is_contradicted(self):
        r = self.triage(employer="Example Closed College")
        self.assertIn("closed", r["signals"][0]["signal"])

    def test_same_name_two_states_is_ambiguous_until_state_given(self):
        self.assertEqual(self.triage(employer="Example Twin University")["ipeds"]["status"], "ambiguous")
        r = self.triage(employer="Example Twin University", state="ME")
        self.assertEqual(r["ipeds"]["unitid"], "900005")

    def test_near_miss_is_shown_but_never_a_signal(self):
        r = self.triage(employer="Example Research Institute", claimed_category="nonprofit-research")
        u = r["uscis_h1b_fy2023"]
        self.assertEqual(u["status"], "no-match")
        self.assertIn("EXAMPLE RESEARCH INSTITUTE ERI", u["candidates"])
        self.assertEqual(r["cap_exempt_status"], "UNVERIFIED")
        self.assertEqual(r["signals"], [])

    def test_human_chosen_link_is_used_and_labelled(self):
        r = self.triage(employer="Example Research Institute", claimed_category="nonprofit-research",
                        uscis_employer="EXAMPLE RESEARCH INSTITUTE ERI")
        self.assertEqual(r["uscis_h1b_fy2023"]["provenance"], "record (link chosen by a human)")
        self.assertEqual(r["uscis_h1b_fy2023"]["continuing_approvals"], 4)

    def test_missing_extracts_switch_checks_off(self):
        code, log, _, _ = run(ipeds=FIX / "absent.csv", uscis=FIX / "absent.csv")
        self.assertEqual(code, 0)
        self.assertEqual(len(log["record_checks"]), 2)
        a = by_id(log)["A"]
        self.assertEqual((a["ipeds"]["status"], a["cap_exempt_status"]), ("off", "UNVERIFIED"))


class HumanGateG4(unittest.TestCase):
    """G4 clears only when a named person dated a decision for every non-SKIP row."""

    def decisions(self, **overrides):
        d = {"by": "fixture-reviewer", "date": "2026-10-21",
             "decisions": {"A": "contact-hr", "B": "keep-held", "C": "drop", "D": "drop", "F": "keep-held", "G": "drop"}}
        d.update(overrides)
        path = Path(tempfile.mkdtemp()) / "g4.json"
        path.write_text(json.dumps(d))
        return path

    def test_no_decisions_file_leaves_g4_open(self):
        _, log, _, _ = run()
        self.assertFalse(log["gates"]["G4 human"]["cleared"])
        self.assertIn("human gate open", log["status"])

    def test_full_decisions_clear_g4_and_skip_rows_need_none(self):
        _, log, out, _ = run("--g4", str(self.decisions()))
        g4 = log["gates"]["G4 human"]
        self.assertTrue(g4["cleared"])
        self.assertNotIn("E", g4["rows_needing_a_decision"])  # E was skipped by the liveness gate
        self.assertEqual(by_id(log)["A"]["g4_decision"]["provenance"], "human decision")
        self.assertIn("G4 cleared by fixture-reviewer", log["status"])
        self.assertIn("## G4 human decisions", (out / "report.md").read_text())

    def test_missing_row_keeps_g4_open_and_names_it(self):
        path = self.decisions(decisions={"A": "contact-hr", "B": "keep-held", "C": "drop", "D": "drop", "G": "drop"})
        _, log, _, _ = run("--g4", str(path))
        g4 = log["gates"]["G4 human"]
        self.assertFalse(g4["cleared"])
        self.assertEqual(g4["missing"], ["F"])

    def test_invalid_value_or_no_name_keeps_g4_open(self):
        bad = self.decisions(decisions={"A": "apply-now", "B": "keep-held", "C": "drop", "D": "drop", "F": "drop", "G": "drop"})
        self.assertFalse(run("--g4", str(bad))[1]["gates"]["G4 human"]["cleared"])
        anon = self.decisions(by="")
        self.assertFalse(run("--g4", str(anon))[1]["gates"]["G4 human"]["cleared"])


class TimelineGate(unittest.TestCase):
    def assert_stopped(self, code, log):
        self.assertEqual(code, 3)
        self.assertEqual(log["rows"], [])
        self.assertTrue(log["status"].startswith("STOPPED at G2"))

    def test_sample_margin(self):
        _, log, _, _ = run()
        g2 = log["gates"]["G2 timeline"]
        self.assertEqual((g2["days_left_on_opt"]["value"], g2["required_days"]["value"], g2["margin_days"]["value"]), (102, 66, 36))

    def test_slow_hiring_stops(self):
        code, log, _, _ = run(ext=FIX / "breaks/ext.slow-hiring.json")
        self.assert_stopped(code, log)

    def test_unemployed_clock_stops(self):
        code, log, out, _ = run(ext=FIX / "breaks/ext.unemployed.json")
        self.assertIn("unemployment days left", (out / "report.md").read_text())
        self.assert_stopped(code, log)
        self.assertEqual(log["gates"]["G2 timeline"]["unemployment_days_left_after_buffer"]["value"], 36)
        failed = [c["check"] for c in log["gates"]["G2 timeline"]["checks"] if not c["pass"]]
        self.assertEqual(len(failed), 1)
        self.assertIn("unemployment", failed[0], "the report must name the check that actually failed")

    def test_opt_already_ended_stops(self):
        code, log, _, _ = run(run_date="2027-02-15")
        self.assert_stopped(code, log)


class InputGate(unittest.TestCase):
    def assert_halted(self, code, out, err):
        self.assertEqual(code, 2)
        self.assertFalse(out.exists(), "G1 halt must write nothing")
        self.assertIn("G1 input gate", err)

    def test_bad_csv_header_halts(self):
        code, _, out, err = run(csv=FIX / "breaks/mini_80days.bad-header.csv")
        self.assert_halted(code, out, err)

    def test_lottery_selected_halts(self):
        code, _, out, err = run(ext=FIX / "breaks/ext.lottery-selected.json")
        self.assert_halted(code, out, err)

    def test_text_assumption_halts(self):
        code, _, out, err = run(ext=FIX / "breaks/ext.bad-assumption.json")
        self.assert_halted(code, out, err)

    def test_bad_run_date_halts(self):
        code, _, out, err = run(run_date="not-a-date")
        self.assert_halted(code, out, err)


class LivenessRechecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.code, cls.log, _, _ = run(liveness=[LIVENESS, FIX / "liveness.recheck.txt"])
        cls.rows = by_id(cls.log)

    def test_recheck_supersedes_first_pass(self):
        g = self.rows["G"]
        self.assertEqual(g["liveness"]["result"], "active")
        self.assertTrue(g["liveness"]["source_file"].endswith("liveness.recheck.txt"))
        self.assertEqual(g["outcome"], "SKIP — no cap-exempt claim")

    def test_page_length_expired_is_held_not_skipped(self):
        b = self.rows["B"]
        self.assertEqual(b["liveness"]["checker_said"], "expired")
        self.assertEqual(b["liveness"]["result"], "uncertain")
        self.assertTrue(b["outcome"].startswith("HELD"))

    def test_hard_expired_still_skipped(self):
        self.assertEqual(self.rows["E"]["outcome"], "SKIP — expired")


class NoLivenessFile(unittest.TestCase):
    def test_everything_held(self):
        code, log, _, _ = run(liveness=None)
        self.assertEqual(code, 0)
        self.assertTrue(all(r["outcome"].startswith("HELD") for r in log["rows"]))
        self.assertEqual(log["summary"]["liveness_checked"], 0)


class Audit(unittest.TestCase):
    def test_counts_on_mini_csv(self):
        a = cet.run_audit(MINI)
        self.assertEqual(a["rows_total"], 5)
        self.assertEqual(a["rows_with_approvals_gt0"], 1)
        self.assertEqual(a["rows_with_approvals_blank"], 3, "a 0 is a value; only blanks are unknown")
        self.assertEqual(a["cap_exempt_sounding_names"], 3)
        self.assertEqual(a["sounding_with_approvals_gt0"], 0)
        self.assertEqual(a["sounding_with_for_profit_form"], 1)
        self.assertEqual(a["sounding_with_corporate_ambiguous"], 2)
        self.assertEqual(a["sounding_with_funding_stage"], 2)


class AuditOverlap(unittest.TestCase):
    def test_ipeds_overlap_measure(self):
        a = cet.run_audit(MINI, MINI_IPEDS)
        o = a["ipeds_overlap"]
        self.assertEqual(o["open_public_nonprofit_institutions"], 3)  # for-profit and closed rows excluded
        self.assertEqual(o["found_in_80days_exact_name"], 0)
        self.assertEqual(o["sounding_names_matching_any_ipeds_institution"], 0)
        self.assertIsNone(cet.run_audit(MINI)["ipeds_overlap"])

    def test_distinct_employers_not_rows(self):
        _, log, _, _ = run()
        self.assertEqual((log["summary"]["uscis_matched"], log["summary"]["uscis_matched_employers"]), (1, 1))


class BrokenMutant(unittest.TestCase):
    def test_mutant_is_caught(self):
        spec_m = importlib.util.spec_from_file_location("broken", FIX / "BROKEN-liveness-default-active.py")
        broken = importlib.util.module_from_spec(spec_m)
        spec_m.loader.exec_module(broken)
        original = broken.install(cet)
        try:
            _, log, _, _ = run()
        finally:
            cet.triage_target = original
        self.assertEqual(liveness_invariant_violations(log, LIVENESS), ["F"],
                         "the invariant check must catch an unchecked posting being scored")


if __name__ == "__main__":
    unittest.main(verbosity=2)
