"""Offline unit and integration tests using fixtures and the existing scorer."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('prototype', HERE / 'prototype.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class TestAdapter(unittest.TestCase):
    def setUp(self):
        self.s = json.loads((HERE / 'fixtures/scenarios.json').read_text())[0]
        # Small fictional row exercises parser behavior; integration reads real repo CSV.
        self.rows = [{'company_name': self.s['company'], 'Total Approvals': '2.0',
                      'top_job_titles_sponsored': "['Data Analyst']"}]

    def test_missing_company(self):
        with self.assertRaisesRegex(ValueError, 'company-missing'):
            p.evaluate([], self.s)

    def test_missing_liveness(self):
        del self.s['liveness_factor']
        with self.assertRaisesRegex(ValueError, 'liveness-missing'):
            p.evaluate(self.rows, self.s)

    def test_missing_approval_not_zero(self):
        self.rows[0]['Total Approvals'] = ''
        with self.assertRaisesRegex(ValueError, 'approval-missing'):
            p.evaluate(self.rows, self.s)

    def test_duplicate_company(self):
        with self.assertRaisesRegex(ValueError, 'company-ambiguous'):
            p.evaluate(self.rows * 2, self.s)

    def test_bad_date(self):
        self.s['fictional_deadline'] = 'not-a-date'
        with self.assertRaisesRegex(ValueError, 'date-invalid'):
            p.evaluate(self.rows, self.s)

    def test_past_deadline(self):
        self.s['fictional_deadline'] = '2026-09-01'
        role, evidence = p.evaluate(self.rows, self.s)
        self.assertEqual(role['timeline']['factor'], 0)
        self.assertLess(evidence['days_left']['value'], 0)

    def test_invalid_lag(self):
        self.s['hiring_lag_days'] = -1
        with self.assertRaisesRegex(ValueError, 'hiring-lag-invalid'):
            p.evaluate(self.rows, self.s)

    def test_output_path_guard(self):
        with self.assertRaisesRegex(ValueError, 'output-outside'):
            p.run(HERE / 'fixtures/scenarios.json', p.ROOT / 'data/examples')

    def test_existing_scorer_gates_and_labels(self):
        p.OUT.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=p.OUT) as tmp:
            target = Path(tmp)
            p.run(HERE / 'fixtures/scenarios.json', target)
            scores = json.loads((target / 'role-scores.json').read_text())['roles']
            by = {r['role_id']: r for r in scores}
            self.assertGreater(by['enough-time']['composite'], 0)
            self.assertEqual(by['enough-time']['recommendation'], 'Consider')
            for key in ['closed-posting', 'too-little-time']:
                self.assertEqual(by[key]['composite'], 0)
                self.assertEqual(by[key]['recommendation'], 'Skip')
            audit = json.loads((target / 'agent-log.json').read_text())
            self.assertTrue((target / 'human-report.md').is_file())
            for row in audit['rows']:
                for value in row['evidence'].values():
                    self.assertIn(value['source'], ['record', 'model-judgment', 'your-input'])
                self.assertEqual(row['human_gate']['value'], 'pending')


if __name__ == '__main__':
    unittest.main(verbosity=2)
