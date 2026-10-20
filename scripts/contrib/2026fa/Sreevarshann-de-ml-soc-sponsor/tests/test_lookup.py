"""Offline tests for lookup.py. Any network attempt fails the test."""

from __future__ import annotations

import importlib.util
import json
import re
import socket
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
COMPONENT = HERE.parent
FIX = COMPONENT / "fixtures"
sys.path.insert(0, str(COMPONENT))
import lookup as L  # noqa: E402


class NoNetwork(unittest.TestCase):
    def setUp(self):
        def refuse(*a, **k):
            raise AssertionError("network access attempted in an offline test")
        self._saved = (socket.socket.connect, socket.create_connection)
        socket.socket.connect = refuse
        socket.create_connection = refuse

    def tearDown(self):
        socket.socket.connect, socket.create_connection = self._saved


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestNormalize(NoNetwork):
    def test_suffix_case_and_punctuation(self):
        self.assertEqual(L.normalize("ZZFIXTURE ML, Inc."), "zzfixtureml")
        self.assertEqual(L.normalize("zzfixture ml llc"), "zzfixtureml")
        self.assertEqual(L.normalize("Acme Co."), "acme")
        self.assertEqual(L.normalize(""), "")
        self.assertEqual(L.normalize(None), "")

    def test_matches_entity_resolution_original(self):
        er = load_module(L.REPO / "scripts/sec/entity-resolution.py", "entity_resolution")
        self.assertEqual(L.COMPANY_SUFFIXES, er.COMPANY_SUFFIXES)
        names = ["1LIFE HEALTHCARE INC", "23andMe, Inc.", "Feed-Mob L.L.C.", "Big & Small Co", "O'Neil Corp.", "ZZFIXTURE TWIN LLC"]
        for n in names:
            self.assertEqual(L.normalize(n), er.normalize_company_name(n), n)

    def test_suffix_list_matches_sec_all_quarters_source(self):
        # sec-all-quarters.py imports pandas, so compare its source text instead of importing it.
        src = (L.REPO / "scripts/sec/sec-all-quarters.py").read_text(encoding="utf-8")
        block = re.search(r"COMPANY_SUFFIXES\s*=\s*\[(.*?)\]", src, re.S).group(1)
        self.assertEqual(re.findall(r"r[\"'](.*?)[\"']", block), L.COMPANY_SUFFIXES)

    def test_agrees_with_shipped_formd_normalized_names(self):
        n = 0
        for f in sorted(L.FORMD_SAMPLE_DIR.glob("*.sample.json")):
            for c in json.loads(f.read_text(encoding="utf-8"))["companies"]:
                name, stored = c["company"]["name"], c["company"].get("company_name_normalized")
                if stored:
                    self.assertEqual(L.normalize(name), stored, name)
                    n += 1
        self.assertEqual(n, 200)


class TestTargets(NoNetwork):
    def test_good_targets(self):
        rows = L.read_targets(FIX / "targets.csv")
        self.assertEqual(len(rows), 6)

    def test_bad_targets_halt_with_every_problem(self):
        with self.assertRaises(L.InputError) as cm:
            L.read_targets(FIX / "targets-bad.csv")
        msg = str(cm.exception)
        self.assertIn("not an http(s) URL", msg)
        self.assertIn("empty company_name", msg)
        self.assertIn("duplicate posting_url", msg)

    def test_private_paths_refused(self):
        for p in ("private/x.csv", "data/ats/pipeline.csv", "search/resume.json"):
            self.assertTrue(L.is_private_path(L.REPO / p), p)
            with self.assertRaises(L.InputError):
                L.read_targets(L.REPO / p)
        self.assertFalse(L.is_private_path(L.REPO / "search/examples/priya-nair/profile.yml"))


class TestSponsor(NoNetwork):
    @classmethod
    def setUpClass(cls):
        cls.idx = L.load_sponsor_index(FIX / "sponsor-slice.csv")

    def test_never_loads_personal_columns(self):
        for rows in self.idx.values():
            for r in rows:
                self.assertEqual(set(r), set(L.SPONSOR_COLUMNS))
                for col in ("phone", "executive_officers", "board_directors"):
                    self.assertNotIn(col, r)

    def test_tiers(self):
        self.assertEqual(L.sponsor_lookup("23andMe Inc", self.idx)["tier"]["value"], "proven")
        self.assertEqual(L.sponsor_lookup("1Life Healthcare", self.idx)["tier"]["value"], "likely")
        self.assertEqual(L.sponsor_lookup("FeedMob", self.idx)["tier"]["value"], "possible")
        # 12 approvals but rate 85.7 < 90 -> likely, not proven
        self.assertEqual(L.sponsor_lookup("ZZFIXTURE ML INC", self.idx)["tier"]["value"], "likely")
        # 15 approvals but rate missing -> cannot be proven
        self.assertEqual(L.sponsor_lookup("ZZFIXTURE MISSINGRATE INC", self.idx)["tier"]["value"], "likely")

    def test_tier_p_and_labels(self):
        s = L.sponsor_lookup("23andMe Inc", self.idx)
        self.assertEqual(s["sponsorship_p"], {"value": 0.9, "source": "your-input", "note": s["sponsorship_p"]["note"]})
        self.assertEqual(s["approvals"]["source"], "record")
        self.assertEqual(L.TIER_P, {"proven": 0.9, "likely": 0.7, "possible": 0.3})

    def test_not_found_is_not_zero(self):
        s = L.sponsor_lookup("ZZFIXTURE Not In Dataset", self.idx)
        self.assertEqual(s["status"], "not_found")
        self.assertNotIn("approvals", s)
        self.assertNotIn("tier", s)

    def check_missing_stays_missing(self):
        s = L.sponsor_lookup("$AVY INC", self.idx)
        self.assertEqual(s["status"], "no_sponsorship_record")
        self.assertIsNone(s["approvals"]["value"])
        self.assertEqual(s["approvals"]["note"], "field empty in the dataset")
        self.assertNotIn("tier", s)
        m = L.sponsor_lookup("ZZFIXTURE MISSINGRATE INC", self.idx)
        self.assertIsNone(m["approval_rate_pct"]["value"])

    def test_empty_fields_are_missing_and_blocked(self):
        self.check_missing_stays_missing()

    def test_zero_zero_blocked(self):
        self.assertEqual(L.sponsor_lookup("ZZFIXTURE ZERO", self.idx)["status"], "no_sponsorship_record")

    def test_ambiguous_blocked(self):
        s = L.sponsor_lookup("ZZFIXTURE TWIN", self.idx)
        self.assertEqual(s["status"], "ambiguous")
        self.assertEqual(sorted(s["candidates"]), ["ZZFIXTURE TWIN INC", "ZZFIXTURE TWIN LLC"])

    def test_rate_is_0_to_100(self):
        s = L.sponsor_lookup("23andMe Inc", self.idx)
        self.assertAlmostEqual(s["approval_rate_pct"]["value"], 96.29629629629628)

    def test_broken_mutant_is_caught(self):
        """Break attempt: swap in the missing-as-zero mutant; the real check must fail."""
        broken = load_module(FIX / "BROKEN-missing-as-zero.py", "broken")
        good = L.parse_number
        try:
            L.parse_number = broken.parse_number
            with self.assertRaises(AssertionError):
                self.check_missing_stays_missing()
        finally:
            L.parse_number = good
        self.check_missing_stays_missing()


class TestTitleMatch(NoNetwork):
    def test_hits_and_socs(self):
        t = L.title_match("['Senior ML Engineer', 'MLOps Lead', 'ETL Developer']")
        self.assertEqual(t["status"], "matched")
        self.assertEqual(len(t["matches"]), 3)
        socs = {s for m in t["matches"] for s in m["candidate_socs"]["value"]}
        self.assertEqual(socs, {"15-1243", "15-1252", "15-2051"})
        t2 = L.title_match("['Senior Data Engineer']")
        self.assertEqual(t2["matches"][0]["candidate_socs"]["value"], ["15-1243", "15-1252"])

    def test_near_misses_do_not_match(self):
        t = L.title_match("['Data Entry Clerk', 'Machine Operator', 'MetLife Liaison', 'Retail Associate', 'Settlement Analyst']")
        self.assertEqual(t["status"], "no_match")
        self.assertEqual(t["matches"], [])

    def test_labels_are_judgments_never_records(self):
        t = L.title_match("['AI Engineer', 'Data Platform Engineer']")
        for m in t["matches"]:
            self.assertEqual(m["title"]["source"], "record")
            self.assertEqual(m["keywords"]["source"], "model-judgment")
            self.assertEqual(m["candidate_socs"]["source"], "model-judgment")
        self.assertEqual(t["de_ml_title_on_record"]["source"], "model-judgment")

    def test_per_employer_soc_always_proposed(self):
        for raw in ("['Data Engineer']", "[]", "['Chef']"):
            p = L.title_match(raw)["per_employer_soc"]
            self.assertEqual(p["source"], "proposed")
            self.assertIsNone(p["value"])
            self.assertIn("[TODO: DATA SOURCE]", p["note"])

    def test_unparseable_and_no_eval(self):
        self.assertEqual(L.title_match("['Data Engineer'")["status"], "unparseable")
        self.assertEqual(L.title_match("__import__('os').getcwd()")["status"], "unparseable")
        self.assertEqual(L.title_match("{'a': 1}")["status"], "unparseable")


class TestBLS(NoNetwork):
    def test_real_table_has_the_three_codes_and_blank_score(self):
        rows = L.load_bls_rows()
        out = L.bls_lookup(L.CANDIDATE_SOCS, rows)
        self.assertEqual(sorted(out), ["15-1243", "15-1252", "15-2051"])
        for soc in out:
            self.assertEqual(out[soc]["status"], "found")
        ds = [o for o in out["15-2051"]["occupations"] if o["onet_soc_code"]["value"] == "15-2051.00"][0]
        self.assertIsNone(ds["cognitive_pivot_score"]["value"])
        self.assertIn("not imputed", ds["cognitive_pivot_score"]["note"])
        self.assertEqual(ds["national_median_wage"]["value"], 112590.0)

    def test_fixture_slice_and_unknown_code(self):
        out = L.bls_lookup(["15-1252", "99-9999"], L.load_bls_rows(FIX / "bls-slice.csv"))
        self.assertEqual(out["15-1252"]["occupations"][0]["job_zone"]["value"], 4)
        self.assertEqual(out["99-9999"]["status"], "missing")


class TestFormD(NoNetwork):
    def test_sample_label_and_absence(self):
        idx, meta = L.load_formd_sample_index(FIX / "formd-sample")
        hit = L.formd_sample_lookup("ZZFIXTURE ML Inc", idx, meta)
        self.assertEqual(hit["status"], "in_sample")
        self.assertEqual(hit["filings"][0]["source"], "sample")
        miss = L.formd_sample_lookup("ZZFIXTURE Not In Dataset", idx, meta)
        self.assertEqual(miss["status"], "not_in_sample")
        self.assertIn("does not mean the company filed no Form D", miss["note"])

    def test_shipped_samples_are_200_companies(self):
        _, meta = L.load_formd_sample_index()
        self.assertEqual(meta["companies"], 200)
        self.assertEqual(len(meta["files"]), 4)


class TestPersonaTimelineTrap(NoNetwork):
    def test_parser_agrees_with_pyyaml_on_priya(self):
        text = (L.REPO / "search/examples/priya-nair/profile.yml").read_text(encoding="utf-8")
        mine = L.parse_persona_yaml(text)
        try:
            import yaml
        except ImportError:
            self.skipTest("PyYAML not installed")
        ref = yaml.safe_load(text)
        self.assertEqual(mine["needs_sponsorship"], ref["needs_sponsorship"])
        for k in ("current_status", "unemployment_days_used", "buffer_target", "unemployment_ceiling"):
            self.assertEqual(mine["visa"][k], ref["visa"][k], k)

    def test_timeline_open_for_priya(self):
        g = L.timeline_gate(L.read_persona(L.REPO / "search/examples/priya-nair/profile.yml"))
        self.assertEqual(g["remaining_days"]["value"], 56)
        self.assertEqual(g["factor"]["value"], 1)
        self.assertTrue(g["open"])

    def test_timeline_boundary_closes(self):
        # remaining must be strictly greater than buffer
        self.assertEqual(L.timeline_gate({"visa": {"unemployment_days_used": 70, "buffer_target": 20}})["factor"]["value"], 0)
        self.assertEqual(L.timeline_gate({"visa": {"unemployment_days_used": 69, "buffer_target": 20}})["factor"]["value"], 1)

    def test_timeline_missing_halts(self):
        with self.assertRaises(L.InputError):
            L.timeline_gate({"visa": {"unemployment_days_used": None, "buffer_target": 20}})

    def test_trap_regex_pinned_to_scorer_source(self):
        src = L.SCORER.read_text(encoding="utf-8")
        self.assertIn("/" + L.SCORER_NO_SPONSOR_RE + "/.test(auth)", src)

    def test_trap_detection(self):
        self.assertTrue(L.scorer_would_drop_sponsorship("F-1 STEM OPT — work authorized (EAD)"))
        self.assertFalse(L.scorer_would_drop_sponsorship("F-1 OPT (post-completion, year 1)"))


class TestLiveness(NoNetwork):
    def test_parse_tool_output(self):
        r = L.parse_liveness_output((FIX / "liveness-output.txt").read_text(encoding="utf-8"))
        self.assertEqual(r["https://jobs.example.com/zzml/1"], "active")
        self.assertEqual(r["https://jobs.example.com/1life/2"], "expired")
        self.assertEqual(r["https://jobs.example.com/feedmob/3"], "uncertain")
        self.assertEqual(len(r), 5)

    def test_states(self):
        tool = L.parse_liveness_output((FIX / "liveness-output.txt").read_text(encoding="utf-8"))
        checks = L.read_posting_checks(FIX / "posting-checks.csv")
        self.assertEqual(L.liveness_state("https://jobs.example.com/zzml/1", tool, checks)["factor"]["value"], 1)
        self.assertEqual(L.liveness_state("https://jobs.example.com/1life/2", tool, checks)["factor"]["value"], 0)
        self.assertEqual(L.liveness_state("https://jobs.example.com/feedmob/3", tool, checks)["state"], "held")
        human = L.liveness_state("https://jobs.example.com/missingrate/6", tool, checks)
        self.assertEqual(human["factor"]["source"], "your-input")
        self.assertEqual(L.liveness_state("https://jobs.example.com/none/4", tool, checks)["state"], "held")
        self.assertEqual(L.liveness_state("https://jobs.example.com/zzml/1", None, {})["state"], "held")

    def test_bad_checks_halt(self):
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as fh:
            fh.write("date,url,status,checked_by\n02/01/2099,https://x.example.com/a,maybe,\n")
        try:
            with self.assertRaises(L.InputError) as cm:
                L.read_posting_checks(fh.name)
            for frag in ("YYYY-MM-DD", "active or expired", "checked_by"):
                self.assertIn(frag, str(cm.exception))
        finally:
            Path(fh.name).unlink()


class TestVoteGuard(NoNetwork):
    def test_rejects_proposed_judgment_sample(self):
        for src in ("proposed", "model-judgment", "sample"):
            with self.assertRaises(ValueError):
                L.assert_votes_clean([{"role_id": "x", "sponsorship": {"p": 0.9, "source": src}}])
        L.assert_votes_clean([{"role_id": "x", "sponsorship": {"p": 0.9, "source": "record"},
                               "fit": {"p": 0.5, "source": "your-input (neutral constant)"}}])


if __name__ == "__main__":
    unittest.main()
