import csv
import importlib.util
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
SCRIPT_PATH = SCRIPT_DIR / "frontend_triage.py"
FIXTURE_PATH = SCRIPT_DIR / "fixtures" / "sponsorship_fixture.csv"


spec = importlib.util.spec_from_file_location(
    "frontend_triage",
    SCRIPT_PATH,
)

frontend_triage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(frontend_triage)


def load_fixture():
    with FIXTURE_PATH.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


class FrontendTriageTests(unittest.TestCase):

    def test_legal_suffix_normalization(self):
        rows = load_fixture()

        company = frontend_triage.find_company(
            rows,
            "A10 Networks",
        )

        self.assertIsNotNone(company)
        self.assertEqual(company["company_name"], "A10 NETWORKS INC")

    def test_historical_sponsorship_evidence_found(self):
        rows = load_fixture()

        company = frontend_triage.find_company(
            rows,
            "A10 Networks",
        )

        evidence = frontend_triage.extract_sponsorship_evidence(company)

        self.assertTrue(
            frontend_triage.has_sponsorship_evidence(evidence)
        )
        self.assertEqual(evidence["total_approvals"], "106.0")
        self.assertEqual(
            evidence["approval_rate"],
            "96.36363636363636",
        )

    def test_missing_sponsorship_evidence_remains_unknown(self):
        rows = load_fixture()

        company = frontend_triage.find_company(
            rows,
            "$AVY INC",
        )

        self.assertIsNotNone(company)

        evidence = frontend_triage.extract_sponsorship_evidence(company)

        self.assertFalse(
            frontend_triage.has_sponsorship_evidence(evidence)
        )
        self.assertIsNone(evidence["total_approvals"])
        self.assertIsNone(evidence["approval_rate"])

    def test_unknown_company_is_not_matched(self):
        rows = load_fixture()

        company = frontend_triage.find_company(
            rows,
            "Varun Example Software XYZ",
        )

        self.assertIsNone(company)


if __name__ == "__main__":
    unittest.main()