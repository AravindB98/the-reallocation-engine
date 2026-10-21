"""Offline unit tests for ingest_lca.py — no openpyxl, no DOL file, no network.
   python3 -m unittest discover -s scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test -p "test_*.py"
"""
import csv
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import ingest_lca as L  # noqa: E402


def header_with_extras():
    # REQUIRED columns plus the contact columns a real disclosure file carries
    return L.REQUIRED + ["EMPLOYER_PHONE", "EMPLOYER_POC_EMAIL", "AGENT_ATTORNEY_LAST_NAME", "EMPLOYER_ADDRESS1", "PREPARER_EMAIL"]


def row(**kw):
    h = header_with_extras()
    base = {c: "" for c in h}
    base.update({"CASE_NUMBER": "I-200-00000-000001", "CASE_STATUS": "Certified", "VISA_CLASS": "H-1B", "JOB_TITLE": "Product Manager",
                 "EMPLOYER_NAME": "Example Co, Inc.", "WAGE_RATE_OF_PAY_FROM": "60", "WAGE_UNIT_OF_PAY": "Hour",
                 "PREVAILING_WAGE": "120000", "PW_UNIT_OF_PAY": "Year", "EMPLOYER_PHONE": "+12025550199",
                 "EMPLOYER_POC_EMAIL": "poc@example.com", "AGENT_ATTORNEY_LAST_NAME": "Doe", "EMPLOYER_ADDRESS1": "1 Main St"})
    base.update(kw)
    return tuple(base[c] for c in h)


class Prefilter(unittest.TestCase):
    def test_keeps_pm_family_and_rejects_programmers(self):
        keep = ["Product Manager", "Senior Product Manager, AI", "Product Owner", "Product Lead", "Director, Product Management",
                "Technical Program Manager", "Program Manager II", "APM", "TPM", "Advertiser Optimization PM"]
        drop = ["Programmer Analyst", "Computer Programmer", "Software Engineer", "Programmer", "Product Marketing Manager",
                "Product Designer", "Senior Programmer Analyst"]
        for t in keep:
            self.assertIsNone(L.keep_reason("H-1B", t), t)
        for t in drop:
            self.assertEqual(L.keep_reason("H-1B", t), "not-pm-family-title", t)

    def test_only_h1b(self):
        self.assertEqual(L.keep_reason("E-3 Australian", "Product Manager"), "not-h1b")
        self.assertEqual(L.keep_reason("H-1B1 Singapore", "Product Manager"), "not-h1b")

    def test_mgr_and_mgmt_abbreviations_are_kept_programmer_is_not(self):
        for t in ["Sr. Product Mgr", "Product Mgr.", "Product Mgmt Lead", "Program Mgr", "Technical Program Mgr", "Program Mgmt Specialist"]:
            self.assertIsNone(L.keep_reason("H-1B", t), t)
        for t in ["Programmer Analyst", "Sr Programmer", "Product Marketing Mgr"]:
            self.assertEqual(L.keep_reason("H-1B", t), "not-pm-family-title", t)
        self.assertIsNone(L.PREFILTER_V1.search("Sr. Product Mgr"), "the first-run prefilter missed it — that is what the audit counts as recovered")


class SchemaAndColumns(unittest.TestCase):
    def test_missing_required_column_halts(self):
        h = [c for c in L.REQUIRED if c != "SOC_CODE"]
        with self.assertRaises(L.IngestError) as cm:
            L.check_header(h)
        self.assertEqual(cm.exception.code, 4)

    def test_no_contact_column_is_ever_written(self):
        for c in L.OUT_COLUMNS:
            self.assertIsNone(L.FORBIDDEN.search(c), c)
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        w.writeheader()
        stats = L.new_stats()
        L.ingest([row(), row(JOB_TITLE="Programmer Analyst"), row(VISA_CLASS="E-3 Australian")], header_with_extras(), w, stats)
        text = buf.getvalue()
        self.assertEqual(stats["rows_in"], 3)
        self.assertEqual(stats["kept"], 1)
        self.assertEqual(stats["rejects"]["not-pm-family-title"], 1)
        self.assertEqual(stats["rejects"]["not-h1b"], 1)
        for leaked in ["poc@example.com", "+12025550199", "Doe", "1 Main St"]:
            self.assertNotIn(leaked, text, leaked)
        rec = next(csv.DictReader(io.StringIO(text)))
        self.assertEqual(rec["WAGE_FROM_ANNUAL"], "124800.0")  # 60/hour × 2080
        self.assertEqual(rec["PREVAILING_WAGE_ANNUAL"], "120000.0")
        self.assertEqual(rec["_provenance"], "record")

    def test_unknown_wage_unit_stays_blank(self):
        self.assertEqual(L.annualize("100", "Fortnight"), "")
        self.assertEqual(L.annualize("n/a", "Year"), "")


class Checksum(unittest.TestCase):
    def test_trust_on_first_use_then_hard_fail_on_change(self):
        d = tempfile.mkdtemp()
        lock = os.path.join(d, "lca.checksums.lock")
        self.assertEqual(L.check_lock(lock, "f.xlsx", "aaa", 10), "first use — pinned")
        self.assertEqual(L.check_lock(lock, "f.xlsx", "aaa", 10), "verified against pin")
        with self.assertRaises(L.IngestError) as cm:
            L.check_lock(lock, "f.xlsx", "bbb", 10)
        self.assertEqual(cm.exception.code, 3)



class Status(unittest.TestCase):
    def test_hyphen_spacing_is_ignored_and_unknown_values_are_flagged(self):
        self.assertEqual(L.canon_status("Certified-Withdrawn"), "Certified - Withdrawn")
        self.assertEqual(L.canon_status("Certified - Withdrawn"), "Certified - Withdrawn")
        self.assertEqual(L.canon_status(" Certified  -Withdrawn "), "Certified - Withdrawn")
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        stats = L.new_stats()
        L.ingest([row(CASE_STATUS="Certified-Withdrawn"), row(CASE_STATUS="Pending")], header_with_extras(), w, stats)
        self.assertEqual(stats["unrecognized_status"], 1)
        self.assertEqual(stats["status_all_raw"]["Certified-Withdrawn"], 1)



class EmptyRowsAndBlankStatus(unittest.TestCase):
    def test_fully_empty_row_is_skipped_not_counted_as_a_filing(self):
        empty = tuple(None for _ in header_with_extras())
        buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        stats = L.new_stats()
        L.ingest([row(), empty, tuple("  " for _ in header_with_extras())], header_with_extras(), w, stats)
        self.assertEqual(stats["empty_rows"], 2)
        self.assertEqual(stats["rows_in"], 1)
        self.assertEqual(stats["unrecognized_status"], 0)

    def test_a_data_row_with_a_blank_status_is_unrecognized(self):
        buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        stats = L.new_stats()
        L.ingest([row(CASE_STATUS="")], header_with_extras(), w, stats)
        self.assertEqual(stats["unrecognized_status"], 1)

    @unittest.skipUnless(__import__("importlib").util.find_spec("openpyxl"), "needs openpyxl (the repo .venv)")
    def test_end_to_end_a_blank_status_data_row_halts_with_exit_5(self):
        from openpyxl import Workbook
        d = tempfile.mkdtemp()
        x = os.path.join(d, "LCA_test.xlsx")
        wb = Workbook(); ws = wb.active
        ws.append(header_with_extras()); ws.append(list(row())); ws.append(list(row(CASE_STATUS=None))); ws.append([None] * len(header_with_extras()))
        wb.save(x)
        code = L.main(["--xlsx", x, "--downloaded-by", "Test", "--downloaded-on", "2026-10-21", "--out-dir", os.path.join(d, "out")])
        self.assertEqual(code, 5)


class NameParity(unittest.TestCase):
    def test_same_normalization_as_the_js_triage(self):
        cases = {"Stripe, Inc.": "STRIPE", "STRIPE INC": "STRIPE", "Anthropic, PBC": "ANTHROPIC", "AT&T Corp": "AT AND T",
                 "Robinhood Markets, Inc.": "ROBINHOOD MARKETS", "Peloton Interactive LLC": "PELOTON INTERACTIVE", "Inc": "INC"}
        for raw, want in cases.items():
            self.assertEqual(L.normalize_name(raw), want, raw)

    def test_watch_list_reports_abbreviation_only_employers(self):
        buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        stats = L.new_stats()
        L.ingest([row(EMPLOYER_NAME="Mgr Only Co, Inc.", JOB_TITLE="Product Mgr"), row(EMPLOYER_NAME="Example Co, Inc.")],
                 header_with_extras(), w, stats, ["Mgr Only Co", "Example Co", "Absent Co"])
        self.assertEqual(stats["recovered_by_abbrev"], 1)
        self.assertEqual(stats["watch"]["Mgr Only Co"]["abbrev_only_rows"], 1)
        self.assertEqual(stats["watch"]["Example Co"]["abbrev_only_rows"], 0)
        self.assertNotIn("Absent Co", stats["watch"])



class EmployerIndex(unittest.TestCase):
    def test_index_counts_every_h1b_employer_across_titles_and_records_suffixes(self):
        buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=L.OUT_COLUMNS, lineterminator="\n")
        stats = L.new_stats()
        L.ingest([row(EMPLOYER_NAME="Notion Labs, Inc.", JOB_TITLE="Software Engineer"), row(EMPLOYER_NAME="Stripe, Inc."),
                  row(EMPLOYER_NAME="Stripe, LLC", JOB_TITLE="Programmer Analyst"), row(EMPLOYER_NAME="Aus Co", VISA_CLASS="E-3 Australian")],
                 header_with_extras(), w, stats)
        self.assertEqual(stats["index"]["NOTION LABS"]["h1b_rows"], 1)
        self.assertEqual(stats["index"]["NOTION LABS"]["pm_rows"], 0)
        self.assertEqual(stats["index"]["STRIPE"]["h1b_rows"], 2)
        self.assertEqual(stats["index"]["STRIPE"]["suffixes"], {"INC", "LLC"})
        self.assertNotIn("AUS CO", stats["index"])  # H-1B only



class Fein(unittest.TestCase):
    def test_same_fein_across_suffixes_resolves_different_or_missing_does_not(self):
        mk = lambda sf: {"suffixes": set(sf), "suffix_feins": {}}
        e = mk(["INC", "LLC"]); e["suffix_feins"] = {"INC": {"27-0465600"}, "LLC": {"27-0465600"}}
        self.assertEqual(L.fein_resolves(e), "same-fein")
        e["suffix_feins"]["LLC"] = {"99-9999999"}
        self.assertEqual(L.fein_resolves(e), "different-fein")
        e["suffix_feins"].pop("LLC")
        self.assertEqual(L.fein_resolves(e), "unsettled")
        self.assertIsNone(L.fein_resolves(mk(["INC"])))

    def test_fein_is_kept_but_never_the_law_firm_fein(self):
        self.assertIn("EMPLOYER_FEIN", L.OUT_COLUMNS)
        self.assertIsNotNone(L.FORBIDDEN.search("LAWFIRM_BUSINESS_FEIN"))


if __name__ == "__main__":
    unittest.main()
