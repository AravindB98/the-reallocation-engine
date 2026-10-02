"""Offline checks of the real prototype and imported upstream classifier."""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('prototype', HERE / 'run.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class OfflineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = app.build()
        cls.rows = {r['id']['value']: r for r in cls.result['roles']}

    def test_hard_gates_override_positive_signals(self):
        for key in ['S6', 'S8']:
            self.assertEqual(self.rows[key]['action']['value'], 'Skip')

    def test_missing_evidence_fails_closed(self):
        for key in ['S5', 'S7', 'S9']:
            self.assertEqual(self.rows[key]['action']['value'], 'Blocked')
        self.assertIsNone(self.rows['S7']['historical_approvals_raw']['value'])
        self.assertIsNone(self.rows['S9']['timeline_gate']['value'])

    def test_blank_is_not_zero_or_a_veto(self):
        self.assertIsNone(self.rows['S4']['historical_approvals_raw']['value'])
        self.assertEqual(self.rows['S4']['action']['value'], 'Apply')
        self.assertEqual(self.rows['S1']['action']['value'], 'Skip')

    def test_fit_and_policy_are_separate(self):
        self.assertEqual(self.rows['S2']['reason']['value'], 'role-policy-unknown')
        self.assertEqual(self.rows['S3']['reason']['value'], 'skill-evidence-gap')

    def test_every_fact_has_source_and_evidence(self):
        def walk(obj):
            if isinstance(obj, dict):
                if 'value' in obj:
                    self.assertEqual(set(obj), {'value', 'source', 'evidence'})
                    self.assertIn(obj['source'], app.LABELS)
                    self.assertTrue(obj['evidence'])
                else:
                    for v in obj.values(): walk(v)
            elif isinstance(obj, list):
                for v in obj: walk(v)
            else:
                self.fail('unlabeled fact')
        walk(self.result)

    def test_schema_break_is_explicit(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / 'broken.csv'
            bad.write_text('company_name\nDATADOG INC\n')
            with self.assertRaisesRegex(ValueError, 'missing required columns'):
                app.build(dataset=bad)

    def test_error_page_with_apply_button_does_not_pass(self):
        payload = json.loads((HERE / 'fixtures/cases.json').read_text())
        payload['cases'][3]['snapshot']['status'] = 403
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / 'blocked.json'
            fixture.write_text(json.dumps(payload))
            self.assertEqual(app.build(fixture=fixture)['roles'][3]['action']['value'], 'Blocked')

    def test_missing_date_key_and_invalid_date_are_errors(self):
        payload = json.loads((HERE / 'fixtures/cases.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / 'broken.json'
            for bad_value in ['2026-02-30', 'MISSING_KEY']:
                item = copy.deepcopy(payload)
                if bad_value == 'MISSING_KEY': del item['cases'][0]['deadline']
                else: item['cases'][0]['deadline'] = bad_value
                fixture.write_text(json.dumps(item))
                with self.assertRaises(ValueError): app.build(fixture=fixture)

    def test_source_value_and_invariant_under_policy_change(self):
        # Value checked directly against CSV, not repeated as an expected count.
        import csv
        with app.DATA.open() as f:
            row = next(r for r in csv.DictReader(f) if r['company_name'] == 'DATADOG INC')
        self.assertEqual(self.rows['S1']['historical_approvals_raw']['value'], row['Total Approvals'])
        payload = json.loads((HERE / 'fixtures/cases.json').read_text())
        payload['cases'][3]['policy'] = 'no'
        payload['cases'][3]['policy_quote'] = 'Synthetic restriction added for this test.'
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / 'changed.json'
            fixture.write_text(json.dumps(payload))
            revised = app.build(fixture=fixture)
            self.assertEqual(revised['roles'][3]['action']['value'], 'Skip')


if __name__ == '__main__':
    unittest.main(verbosity=2)
