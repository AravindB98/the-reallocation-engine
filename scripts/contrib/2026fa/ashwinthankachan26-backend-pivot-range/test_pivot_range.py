"""Offline tests for backend-pivot-range (python3 -m unittest).

Fixtures are fictional occupations (codes 98-/99-) and fictional postings at a
fictional company, so every expected number below was worked out by hand before
the code existed. One test reads the committed real O*NET extract and the repo's
compact BLS/O*NET table, to prove the extract reproduces the repo's own scores.

    python3 -m unittest scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/test_pivot_range.py
"""
import csv
import json
import math
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
FX = os.path.join(HERE, 'fixtures')
sys.path.insert(0, HERE)

import lib_pivot as lib  # noqa: E402


def jload(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def read_text(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


CFG = jload(os.path.join(FX, 'config.fixture.json'))
ELEMENTS = lib.load_elements(os.path.join(FX, 'elements.fixture.csv'))
INDEX = lib.load_title_index(os.path.join(FX, 'titles.fixture.csv'))


def cli(*extra, out=None, compact='compact.fixture.csv', liveness=True):
    out = out or tempfile.mkdtemp(prefix='pivot-test-')
    args = [sys.executable, os.path.join(HERE, 'pivot_range.py'),
            '--roles', os.path.join(FX, 'roles.fixture.json'),
            '--config', os.path.join(FX, 'config.fixture.json'),
            '--elements', os.path.join(FX, 'elements.fixture.csv'),
            '--titles', os.path.join(FX, 'titles.fixture.csv'),
            '--compact', os.path.join(FX, compact),
            '--today', '2026-10-20', '--out-dir', out]
    if liveness:
        args += ['--liveness', os.path.join(FX, 'ats-liveness.fixture.txt')]
    return out, subprocess.run(args + list(extra), capture_output=True, text=True)


class PivotStats(unittest.TestCase):
    def test_complete_occupation_gives_mean_and_standard_error(self):
        s = lib.pivot_stats(ELEMENTS['99-0001.00'])
        self.assertEqual(s['status'], 'scored')
        self.assertAlmostEqual(s['value'], 4.0, places=6)
        self.assertAlmostEqual(s['se'], math.sqrt(9 * 0.2 ** 2) / 9, places=6)
        self.assertEqual(s['n_elements'], 9)

    def test_missing_element_is_refused_not_averaged(self):
        s = lib.pivot_stats(ELEMENTS['99-0005.00'])
        self.assertEqual(s['status'], 'incomplete')
        self.assertIsNone(s['value'], 'a partial average is never reported as the score')
        self.assertEqual(s['n_elements'], 8)

    def test_unknown_occupation_is_missing(self):
        self.assertEqual(lib.pivot_stats(ELEMENTS.get('99-9999.00'))['status'], 'missing')


class Comparison(unittest.TestCase):
    def setUp(self):
        self.anchor = lib.pivot_stats(ELEMENTS['99-0001.00'])

    def test_small_gap_within_error_is_indistinguishable(self):
        c = lib.compare(lib.pivot_stats(ELEMENTS['99-0002.00']), self.anchor, z=1.96)
        self.assertEqual(c['band'], 'indistinguishable')
        self.assertAlmostEqual(c['z'], -0.1 / math.sqrt(2 * (0.6 / 9) ** 2), places=4)

    def test_large_gap_is_below_or_above(self):
        self.assertEqual(lib.compare(lib.pivot_stats(ELEMENTS['99-0003.00']), self.anchor, 1.96)['band'], 'below')
        self.assertEqual(lib.compare(lib.pivot_stats(ELEMENTS['99-0004.00']), self.anchor, 1.96)['band'], 'above')

    def test_v014_both_error_assumptions_are_reported_and_real_only_if_both_agree(self):
        # TODO #5: independent errors (sqrt(sum SE^2)/9) vs fully correlated errors (mean SE)
        anchor = lib.pivot_stats(ELEMENTS['99-0001.00'])
        routine = lib.compare(lib.pivot_stats(ELEMENTS['99-0003.00']), anchor, 1.96)
        self.assertAlmostEqual(routine['z_correlated'], -0.5 / math.sqrt(0.2 ** 2 + 0.1 ** 2), places=4)
        self.assertEqual((routine['band'], routine['band_correlated'], routine['real_under_both']), ('below', 'below', True))
        close = lib.compare(lib.pivot_stats(ELEMENTS['99-0002.00']), anchor, 1.96)
        self.assertEqual((close['band'], close['band_correlated'], close['real_under_both']), ('indistinguishable', 'indistinguishable', False))
        self.assertAlmostEqual(lib.pivot_stats(ELEMENTS['99-0001.00'])['se_correlated'], 0.2, places=6)

    def test_candidates_that_disagree_are_mixed(self):
        bands = ['indistinguishable', 'above']
        self.assertEqual(lib.range_band(bands), 'mixed')
        self.assertEqual(lib.range_band(['below', 'below']), 'below')
        self.assertIsNone(lib.range_band([]))

    def test_ratings_years_apart_are_flagged(self):
        self.assertAlmostEqual(lib.years_apart('07/2017', '08/2025'), 8 + 1 / 12, places=3)


class TitleLookup(unittest.TestCase):
    def test_level_location_and_qualifier_are_stripped_before_exact_match(self):
        m = lib.lookup_occupations('Senior Software Engineer, Backend (Boston, MA)', INDEX, CFG)
        self.assertEqual(m['method'], 'onet-exact')
        self.assertEqual(m['matched_title'], 'software engineer')
        self.assertEqual(m['in_scope'], ['99-0001.00'])
        # v0.1.5 (review 2026-10-21): reaching an O*NET title through my normalization is a rule, not a record
        self.assertEqual(m['source'], lib.SRC['model'])
        self.assertTrue(m['normalized'])

    def test_v015_an_untouched_exact_title_stays_a_record(self):
        m = lib.lookup_occupations('Software Engineer', INDEX, CFG)
        self.assertEqual((m['method'], m['source'], m['normalized']), ('onet-exact', lib.SRC['record'], False))

    def test_out_of_scope_matches_are_reported_not_scored(self):
        m = lib.lookup_occupations('Full Stack Developer', INDEX, CFG)
        self.assertEqual(m['in_scope'], ['99-0001.00'])
        self.assertEqual(m['ignored_out_of_scope'], ['98-0001.00'])

    def test_no_exact_match_falls_back_to_family_as_your_input(self):
        m = lib.lookup_occupations('QA Engineer', INDEX, CFG)
        self.assertEqual(m['method'], 'family-fallback')
        self.assertEqual(m['family'], 'sdet-qa')
        self.assertEqual(m['in_scope'], ['99-0003.00'])
        self.assertEqual(m['source'], lib.SRC['input'])

    def test_v013_an_out_of_target_pin_routes_out_and_needs_a_reason(self):
        # G2 2026-10-21: "Developer Advocate" postings are outside my backend target
        cfg = json.loads(json.dumps(CFG))
        cfg['pins']['by_title'] = {'data engineer': {'out_of_target': True, 'reason': 'test: not my target'}}
        m = lib.lookup_occupations('Data Engineer', INDEX, cfg)
        self.assertEqual((m['method'], m['in_scope'], m['source']), ('out-of-target', [], lib.SRC['input']))
        cfg['pins']['by_title'] = {'data engineer': {'out_of_target': True}}
        with self.assertRaises(lib.Refusal):
            lib.lookup_occupations('Data Engineer', INDEX, cfg)
        self.assertEqual(lib.next_action('expired', None, 'not-read', out_of_target=True)['action'], 'SKIP', 'closed still wins')
        self.assertEqual(lib.next_action('stale', None, 'not-read', out_of_target=True)['action'], 'OUT-OF-TARGET')

    def test_v011_abbreviated_level_word_with_a_period_is_stripped(self):
        # run 1 (2026-10-20): "Sr. Lead Software Engineer" became ". software engineer" and missed
        self.assertEqual(lib.title_variants('Sr. Lead Software Engineer', CFG['title_normalization'])[0], 'software engineer')

    def test_v011_qualifier_words_fall_back_to_the_longest_contained_onet_title(self):
        # run 1: "Senior Java Software Engineer" had no exact match and fell to a family rule
        m = lib.lookup_occupations('Senior Java Software Engineer', INDEX, CFG)
        self.assertEqual((m['method'], m['matched_title'], m['in_scope']), ('onet-contained', 'software engineer', ['99-0001.00']))
        self.assertEqual(m['source'], lib.SRC['model'], 'choosing a contained title is a rule, not a record')

    def test_no_match_anywhere_is_none(self):
        self.assertEqual(lib.lookup_occupations('Chief Llama Wrangler', INDEX, CFG)['method'], 'none')

    def test_a_pin_overrides_and_needs_a_reason(self):
        cfg = json.loads(json.dumps(CFG))
        cfg['pins']['by_title'] = {'data engineer': {'onet_soc_code': '99-0002.00', 'reason': 'test pin'}}
        m = lib.lookup_occupations('Data Engineer', INDEX, cfg)
        self.assertEqual((m['method'], m['in_scope']), ('pinned', ['99-0002.00']))
        cfg['pins']['by_title'] = {'data engineer': {'onet_soc_code': '99-0002.00'}}
        with self.assertRaises(lib.Refusal):
            lib.lookup_occupations('Data Engineer', INDEX, cfg)


class PostingSignal(unittest.TestCase):
    def snap(self, rid):
        return jload(os.path.join(FX, 'snapshots', rid + '.json'))['bodyText']

    def test_judgment_sentences_are_counted_and_quoted_from_the_responsibilities(self):
        s = lib.posting_signal(self.snap('p-backend'), CFG['posting_signal'])
        self.assertEqual((s['status'], s['section_found'], s['judgment'], s['routine']), ('read', True, 3, 0))
        self.assertEqual(s['reading'], 'judgment-heavy')
        self.assertIn('Debug production incidents and join the on-call rotation.', s['judgment_quotes'])
        self.assertNotIn('curiosity', ' '.join(s['judgment_quotes']), 'company boilerplate outside the section is not read')

    def test_routine_sentences(self):
        s = lib.posting_signal(self.snap('p-backdev'), CFG['posting_signal'])
        self.assertEqual((s['judgment'], s['routine'], s['reading']), (0, 4, 'routine-leaning'))

    def test_too_few_signals_is_not_zero(self):
        s = lib.posting_signal(self.snap('p-fullstack'), CFG['posting_signal'])
        self.assertEqual(s['reading'], 'too-few-signals')
        self.assertIsNone(s['judgment_share'])

    def test_v011_no_duties_section_is_not_read_as_the_whole_posting(self):
        # run 1: with no section header found, the whole posting (requirements, benefits) was read
        s = lib.posting_signal('About us\nWe design scalable systems.\nWe debug incidents.\nWe review code.', CFG['posting_signal'])
        self.assertEqual((s['section_found'], s['reading'], s['judgment']), (False, 'section-not-found', None))

    def test_v011_header_naming_responsibilities_in_any_form_starts_the_section(self):
        text = ('About this roll* (Responsibilities)\nDesign services that scale.\nDebug incidents on call.\n'
                'Review code daily.\nDo you have the right ingredients*? (Requirements)\nYou designed systems before.')
        s = lib.posting_signal(text, CFG['posting_signal'])
        self.assertEqual((s['section_found'], s['judgment'], s['routine']), (True, 3, 0))

    def test_no_text_is_not_read(self):
        s = lib.posting_signal('', CFG['posting_signal'])
        self.assertEqual((s['status'], s['reading']), ('not-read', 'not-read'))


class SignalHealth(unittest.TestCase):
    def test_v012_a_signal_with_only_one_class_is_flagged_not_discriminating(self):
        # run 3 (2026-10-20): 62 of 62 readable postings were judgment-heavy
        h = lib.signal_health(['judgment-heavy'] * 62 + ['section-not-found'] * 24 + ['too-few-signals'] * 9)
        self.assertEqual((h['read'], h['judgment_heavy'], h['routine_leaning'], h['discriminating']), (62, 62, 0, False))
        self.assertEqual(lib.signal_health(['judgment-heavy', 'routine-leaning', 'not-read'])['discriminating'], True)
        self.assertEqual(lib.signal_health(['not-read', 'section-not-found'])['discriminating'], None, 'nothing read: unknown')


class Liveness(unittest.TestCase):
    def test_parse_the_repo_checker_output(self):
        r = lib.parse_ats_liveness(read_text(os.path.join(FX, 'ats-liveness.fixture.txt')))
        self.assertEqual(r['https://job-boards.greenhouse.io/example/jobs/1001'], 'active')
        self.assertEqual(r['https://job-boards.greenhouse.io/example/jobs/1008'], 'expired')

    def test_gate_fresh_stale_and_checked(self):
        self.assertEqual(lib.liveness_gate('2026-10-20T10:00:00Z', '2026-10-20', 3)['result'], 'listed')
        self.assertEqual(lib.liveness_gate('2026-10-10T10:00:00Z', '2026-10-20', 3)['result'], 'stale')
        g = lib.liveness_gate('2026-10-20T10:00:00Z', '2026-10-20', 3, ats_result='expired')
        self.assertEqual((g['result'], g['factor'], g['source']), ('expired', 0, lib.SRC['record']))
        self.assertEqual(lib.liveness_gate('2026-10-20T10:00:00Z', '2026-10-20', 3, ats_result='uncertain')['factor'], None)


class NextAction(unittest.TestCase):
    def test_v015_a_duties_signal_that_separates_nothing_cannot_prioritize_or_note_routine(self):
        # review 2026-10-21: PRIORITIZE only meant "a duties heading was found"; Ashwin chose to refuse instead
        a = lib.next_action('active', 'indistinguishable', 'judgment-heavy', signal_discriminating=False)
        self.assertEqual(a['action'], 'STANDARD')
        self.assertIn('separates nothing', a['why'])
        self.assertEqual(lib.next_action('active', 'below', 'routine-leaning', signal_discriminating=False)['action'], 'STANDARD')
        self.assertEqual(lib.next_action('active', 'indistinguishable', 'judgment-heavy', signal_discriminating=True)['action'], 'PRIORITIZE')

    def test_closed_beats_everything_and_unknown_occupation_is_research(self):
        self.assertEqual(lib.next_action('expired', 'mixed', 'judgment-heavy')['action'], 'SKIP')
        self.assertEqual(lib.next_action('stale', 'above', 'judgment-heavy')['action'], 'CHECK-LIVENESS')
        self.assertEqual(lib.next_action('listed', None, 'judgment-heavy')['action'], 'RESEARCH-SOC')
        self.assertEqual(lib.next_action('listed', 'mixed', 'judgment-heavy')['action'], 'PIN-SOC')
        self.assertEqual(lib.next_action('listed', 'indistinguishable', 'judgment-heavy')['action'], 'PRIORITIZE')
        self.assertEqual(lib.next_action('active', 'below', 'routine-leaning')['action'], 'NOTE-ROUTINE')
        self.assertEqual(lib.next_action('listed', 'below', 'judgment-heavy')['action'], 'STANDARD')
        self.assertEqual(lib.next_action('listed', 'above', 'not-read')['action'], 'STANDARD')


class EndToEnd(unittest.TestCase):
    def test_every_route_and_both_outputs(self):
        out, res = cli()
        self.assertEqual(res.returncode, 0, res.stderr)
        log = jload(os.path.join(out, 'pivot-log.json'))
        action = {r['role_id']: r['next_action']['action'] for r in log['postings']}
        self.assertEqual(action, {
            'p-backend': 'PRIORITIZE', 'p-backdev': 'NOTE-ROUTINE', 'p-data': 'PIN-SOC',
            'p-fullstack': 'STANDARD', 'p-qa': 'NOTE-ROUTINE', 'p-partial': 'RESEARCH-SOC',
            'p-stale': 'CHECK-LIVENESS', 'p-closed': 'SKIP', 'p-unknown': 'RESEARCH-SOC',
            'p-notext': 'PIN-SOC', 'p-java': 'PRIORITIZE',
        })
        # v0.1.1: the contained-title path must reach the report too (run 2 crashed there)
        java = next(r for r in log['postings'] if r['role_id'] == 'p-java')
        self.assertEqual(java['occupation_match']['method'], 'onet-contained')
        # p-notext: my hand-worked expectation was STANDARD, but "software developer" is not in the
        # fixture title list, so the backend family's canonical titles ("software engineer" → anchor,
        # "back end developer" → below) disagree. Asking for a pin is the stated rule; the test was wrong.
        notext = next(r for r in log['postings'] if r['role_id'] == 'p-notext')
        self.assertEqual(notext['occupation_match']['method'], 'family-fallback')
        self.assertEqual(notext['posting_signal']['reading'], 'not-read', 'no text is unknown, never zero')
        backdev = next(r for r in log['postings'] if r['role_id'] == 'p-backdev')
        self.assertTrue(backdev['occupations'][0]['dated_vs_anchor'], '2017 vs 2025 ratings are flagged')
        labels = set(lib.SRC.values())
        for r in log['postings']:
            self.assertIn(r['occupation_match']['source'], labels)
            self.assertIn(r['liveness']['source'], labels)
        report = read_text(os.path.join(out, 'pivot-report.md'))
        self.assertTrue(report.startswith('# Backend pivot-range report\n\n## Executive summary'))
        self.assertIn('contains O*NET title "software engineer" [model-judgment]', report)
        self.assertIn('PRIORITIZE 2', res.stdout)
        # v0.1.2: the batch-level duties check is in both outputs
        self.assertEqual(log['signal_health']['discriminating'], True)
        self.assertIn('## Duties signal check', report)

    def test_v012_a_second_liveness_file_adds_checks_and_later_files_win(self):
        # run 4 (2026-10-21): pins moved 3 postings onto the shortlist after the first check
        extra = os.path.join(tempfile.mkdtemp(prefix='live2-'), 'liveness-2.txt')
        with open(extra, 'w', encoding='utf-8') as f:
            f.write('❌ expired    https://job-boards.greenhouse.io/example/jobs/1001\n')
        out, res = cli('--liveness', extra)
        self.assertEqual(res.returncode, 0, res.stderr)
        log = jload(os.path.join(out, 'pivot-log.json'))
        backend = next(r for r in log['postings'] if r['role_id'] == 'p-backend')
        self.assertEqual(backend['next_action']['action'], 'SKIP', 'the later file overrides the earlier active result')
        self.assertEqual(len([k for k in log['inputs'] if k.startswith('liveness')]), 2)

    def test_refusals_exit_2_and_write_nothing(self):
        out, res = cli(compact='compact.tampered.fixture.csv')
        self.assertEqual(res.returncode, 2)
        self.assertIn('stored cognitive_pivot_score', res.stderr)
        self.assertEqual(os.listdir(out), [])
        _, bad = cli('--today', '2026-02-30')
        self.assertEqual(bad.returncode, 2)
        first, ok = cli()
        self.assertEqual(ok.returncode, 0, ok.stderr)
        _, again = cli(out=first)
        self.assertEqual(again.returncode, 2, 'an existing run is never overwritten')
        self.assertIn('already holds a run', again.stderr)


class BlindCheck(unittest.TestCase):
    def test_v012_sheet_hides_the_tool_reading_and_scoring_counts_agreement(self):
        out, res = cli()
        self.assertEqual(res.returncode, 0, res.stderr)
        sheet_dir = tempfile.mkdtemp(prefix='blind-test-')
        bc = os.path.join(HERE, 'blind_check.py')
        mk = subprocess.run([sys.executable, bc, 'make', '--log', os.path.join(out, 'pivot-log.json'), '--fetch', FX,
                             '--n', '4', '--seed', '7', '--out-dir', sheet_dir, '--config', os.path.join(FX, 'config.fixture.json')],
                            capture_output=True, text=True)
        self.assertEqual(mk.returncode, 0, mk.stderr)
        sheet = read_text(os.path.join(sheet_dir, 'blind-sheet.md'))
        for word in ('judgment-heavy', 'routine-leaning', 'PRIORITIZE', 'NOTE-ROUTINE'):
            self.assertNotIn(word, sheet, 'the sheet must not show the tool\'s answer')
        labels = os.path.join(sheet_dir, 'blind-labels.csv')
        rows = list(csv.DictReader(read_text(labels).splitlines()))
        self.assertEqual(len(rows), 4)
        unlabelled = subprocess.run([sys.executable, bc, 'score', '--log', os.path.join(out, 'pivot-log.json'), '--labels', labels],
                                    capture_output=True, text=True)
        self.assertEqual(unlabelled.returncode, 2, 'an unlabelled sheet is refused')
        log = jload(os.path.join(out, 'pivot-log.json'))
        tool = {p['role_id']: p['posting_signal']['reading'] for p in log['postings']}
        with open(labels, 'w', newline='', encoding='utf-8') as f:   # label every row J
            w = csv.writer(f)
            w.writerow(['n', 'role_id', 'your_label'])
            for r in rows:
                w.writerow([r['n'], r['role_id'], 'J'])
        sc = subprocess.run([sys.executable, bc, 'score', '--log', os.path.join(out, 'pivot-log.json'), '--labels', labels],
                            capture_output=True, text=True)
        self.assertEqual(sc.returncode, 0, sc.stderr)
        expect_agree = sum(1 for r in rows if tool[r['role_id']] == 'judgment-heavy')
        expect_cmp = sum(1 for r in rows if tool[r['role_id']] in ('judgment-heavy', 'routine-leaning'))
        self.assertIn(f'agreement {expect_agree} of {expect_cmp}', sc.stdout)


class RealData(unittest.TestCase):
    def test_committed_extract_reproduces_the_repo_compact_scores(self):
        ext = lib.load_elements(os.path.join(HERE, 'data', 'onet_elements_15.csv'))
        compact = {r['onet_soc_code']: r for r in csv.DictReader(read_text(os.path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv')).splitlines())}
        stored = {c: r for c, r in compact.items() if c.startswith('15-') and r['cognitive_pivot_score'] != ''}
        for code, row in stored.items():
            s = lib.pivot_stats(ext.get(code))
            self.assertEqual(s['status'], 'scored', f'{code} has a stored score but no complete extract')
            self.assertAlmostEqual(round(s['value'], 3), float(row['cognitive_pivot_score']), places=3, msg=code)
        self.assertGreater(len(stored), 20, 'the check covered the group-15 rows, not an empty set')

    def test_audit_hashes_are_read_from_the_repo_audit(self):
        h = lib.parse_audit_hashes(read_text(os.path.join(ROOT, 'data/bls/BLS-audit.md')))
        self.assertEqual(h['Abilities.txt'], '822f866b0f441376edc8a282bf0f77c8c3f687c456dcd607b12de86fccba8e71')
        self.assertIn('Alternate Titles.txt', h)

    def test_fetch_filter_keeps_backend_adjacent_us_roles_only(self):
        import fetch_postings
        f = jload(os.path.join(HERE, 'config.json'))['fetch']
        jobs = [{'title': t, 'location': {'name': loc}} for t, loc in [
            ('Senior Software Engineer, Backend', 'Boston, MA'), ('QA Engineer', 'Remote - US'),
            ('Data Engineer II', 'United States'), ('Site Reliability Engineer', 'Cambridge, MA'),
            ('Engineering Manager, Platform', 'Boston, MA'), ('Software Engineering Intern', 'Boston, MA'),
            ('Software Engineer', 'Dublin, Ireland'), ('Account Executive', 'Boston, MA')]]
        kept = [j['title'] for j in fetch_postings.select(jobs, f)]
        self.assertEqual(kept, ['Senior Software Engineer, Backend', 'QA Engineer', 'Data Engineer II', 'Site Reliability Engineer'])

    def test_greenhouse_escaped_html_becomes_lines(self):
        raw = '&lt;h3&gt;What you&amp;#39;ll do&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;Design APIs&lt;/li&gt;&lt;li&gt;Own on-call&lt;/li&gt;&lt;/ul&gt;'
        self.assertEqual(lib.html_to_text(raw), "What you'll do\nDesign APIs\nOwn on-call")

    def test_redaction(self):
        self.assertEqual(lib.redact('mail jobs@example.com or call (617) 555-0100'), 'mail [email removed] or call [phone removed]')


if __name__ == '__main__':
    unittest.main()
