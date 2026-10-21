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

    def test_mgr_abbreviation_is_counted_not_kept(self):
        self.assertEqual(L.keep_reason("H-1B", "Sr. Product Mgr"), "abbreviated-title-mgr")


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


if __name__ == "__main__":
    unittest.main()
