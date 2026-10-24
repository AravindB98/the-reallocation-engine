#!/usr/bin/env python3
"""Tests for cognitive-pivot-roles-builder.py and the liveness downgrade in
cognitive-pivot-report.py.

  python3 -m unittest scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/test_cognitive_pivot_roles_builder.py   # from the repo root -v
"""
import csv
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


B = load("roles_builder", "cognitive-pivot-roles-builder.py")
R = load("pivot_report", "cognitive-pivot-report.py")

FIELDS = ["onet_soc_code", "title", "cognitive_pivot_score"]


def write_compact(tmp, rows):
    p = Path(tmp) / "compact.csv"
    with open(p, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow(dict(zip(FIELDS, r)))
    return str(p)


ROWS = [("11-0000.00", "Low", "1.0"), ("22-0000.00", "Target", "4.0"),
        ("33-0000.00", "High", "5.0"), ("44-0000.00", "Blank", "")]


def match_file(soc="22-0000.00", matches=None):
    if matches is None:
        matches = [{"company_name": "ACME", "matched_titles": [{"title": " AI Engineer ", "matched_phrases": ["ai engineer"]}],
                    "total_approvals": "62.0", "total_denials": "2.0"}]
    # same summary fields title-to-soc.py always writes
    return {"soc_code": soc, "rows_with_any_title": 10, "companies_matched": len(matches),
            "companies_with_titles_but_no_match": 10 - len(matches), "matches": matches}


class Normalization(unittest.TestCase):
    def test_minmax_math(self):
        self.assertEqual(B.normalize(4.0, 1.0, 5.0), 0.75)
        self.assertEqual(B.normalize(1.0, 1.0, 5.0), 0.0)
        self.assertEqual(B.normalize(5.0, 1.0, 5.0), 1.0)

    def test_scale_is_read_from_data_and_ignores_blanks(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        self.assertEqual((s["min"], s["max"], s["scored_rows"], s["raw"]), (1.0, 5.0, 3, 4.0))

    def test_degenerate_scale_stops(self):
        with self.assertRaises(B.Stop):
            B.normalize(2.0, 2.0, 2.0)

    def test_real_target_value(self):
        # 15-1221.00 against the real compact table (4.516 on a 1.611–4.877 scale)
        s = B.load_pivot_scale(B.COMPACT_CSV, "15-1221.00")
        self.assertEqual(s["raw"], 4.516)
        self.assertAlmostEqual(B.normalize(s["raw"], s["min"], s["max"]),
                               (4.516 - s["min"]) / (s["max"] - s["min"]), places=4)


class StopConditions(unittest.TestCase):
    def test_blank_score_stops_never_zero(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaisesRegex(B.Stop, "missing: no-cognitive-pivot-score"):
                B.load_pivot_scale(write_compact(t, ROWS), "44-0000.00")

    def test_real_data_scientists_blank_stops(self):
        with self.assertRaisesRegex(B.Stop, "missing: no-cognitive-pivot-score"):
            B.load_pivot_scale(B.COMPACT_CSV, "15-2051.00")

    def test_blank_score_main_exits_3_and_writes_nothing(self):
        with tempfile.TemporaryDirectory() as t:
            m = Path(t) / "m.json"
            m.write_text(json.dumps(match_file("44-0000.00")))
            out = Path(t) / "roles.json"
            rc = B.main(["--soc", "44-0000.00", "--matches", str(m), "--out", str(out),
                         "--compact", write_compact(t, ROWS)])
            self.assertEqual(rc, 3)
            self.assertFalse(out.exists())

    def test_no_matches_stops(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        with self.assertRaisesRegex(B.Stop, "missing: no-title-match"):
            B.build_roles(match_file(matches=[]), s)

    def test_soc_mismatch_stops(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        with self.assertRaisesRegex(B.Stop, "soc-mismatch"):
            B.build_roles(match_file(soc="33-0000.00"), s)

    def test_zero_sponsorship_record_is_excluded_not_defaulted(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        m = match_file(matches=[{"company_name": "EMPTY", "matched_titles": [{"title": "AI Engineer", "matched_phrases": ["ai engineer"]}],
                                 "total_approvals": "0.0", "total_denials": "0.0"}])
        roles, excluded = B.build_roles(m, s)
        self.assertEqual(roles, [])
        self.assertEqual(excluded[0]["reason"], "missing: no-sponsorship-record")


class SourceLabels(unittest.TestCase):
    def setUp(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        self.role = B.build_roles(match_file(), s)[0][0]

    def test_sponsorship_is_record_ratio(self):
        self.assertEqual(self.role["sponsorship"]["p"], round(62 / 64, 4))
        self.assertEqual(self.role["sponsorship"]["source"], "record")

    def test_fit_is_model_judgment(self):
        self.assertEqual(self.role["fit"], {"p": 1.0, "source": "model-judgment",
                                            "evidence": "title-to-soc.py phrase match: ai engineer"})

    def test_role_quality_is_record_normalized(self):
        self.assertEqual(self.role["role_quality"]["p"], 0.75)
        self.assertEqual(self.role["role_quality"]["source"], "record")
        self.assertEqual(self.role["role_quality"]["raw_cognitive_pivot_score"], 4.0)


class ExplicitGates(unittest.TestCase):
    def setUp(self):
        with tempfile.TemporaryDirectory() as t:
            s = B.load_pivot_scale(write_compact(t, ROWS), "22-0000.00")
        self.role = B.build_roles(match_file(), s)[0][0]

    def test_liveness_present_and_labeled_unverified(self):
        lv = self.role["liveness"]
        self.assertEqual(lv["factor"], 1)
        self.assertEqual(lv["source"], "your-input: NOT verified — no ats:liveness check run for this mode")
        self.assertIs(lv["checked"], False)
        self.assertNotEqual(lv["source"], "record")

    def test_timeline_present_and_labeled_not_applicable(self):
        tl = self.role["timeline"]
        self.assertEqual(tl["factor"], 1)
        self.assertEqual(tl["source"], "your-input: not applicable to this mode, no persona timeline modeled")
        self.assertIs(tl["modeled"], False)


class LivenessDowngrade(unittest.TestCase):
    def scored(self, rec, src=B.LIVENESS_SOURCE):
        return {"company": "ACME", "composite": 0.7, "recommendation": rec, "machine_recommendation": rec,
                "trace": {"gates": [{"factor": "liveness", "multiplier": 1, "source": src},
                                    {"factor": "timeline", "multiplier": 1, "source": B.TIMELINE_SOURCE}]}}

    def test_apply_becomes_consider_liveness_unchecked(self):
        self.assertEqual(R.reported_decision(self.scored("Apply")), "Consider — liveness unchecked")

    def test_consider_and_skip_pass_through(self):
        self.assertEqual(R.reported_decision(self.scored("Consider")), "Consider")
        self.assertEqual(R.reported_decision(self.scored("Skip")), "Skip")

    def test_refuses_input_without_the_unverified_label(self):
        with self.assertRaises(ValueError):
            R.reported_decision(self.scored("Apply", src="record"))

    def test_refuses_roles_file_from_another_builder(self):
        # found by a break attempt: a plain role list used to crash with a TypeError
        with tempfile.TemporaryDirectory() as t:
            p = Path(t) / "roles.json"
            p.write_text(json.dumps([{"role_id": "x"}]))
            rc = R.main(["--roles", str(p), "--matches", str(p), "--before", str(p), "--after", str(p),
                         "--md-out", str(Path(t) / "r.md"), "--log-out", str(Path(t) / "r.json")])
            self.assertEqual(rc, 3)
            self.assertFalse((Path(t) / "r.md").exists())


class PooledSOCs(unittest.TestCase):
    """Two SOC codes in one roles file, normalized on ONE shared min/max range."""

    def run_builder(self, t, socs, compact=None):
        compact = compact or write_compact(t, ROWS)
        argv, mpaths = [], []
        for soc in socs:
            m = Path(t) / f"m-{soc}.json"
            m.write_text(json.dumps(match_file(soc)))
            argv += ["--soc", soc, "--matches", str(m)]
        out = Path(t) / "roles.json"
        rc = B.main(argv + ["--out", str(out), "--compact", compact])
        return rc, out

    def test_shared_range_keeps_groups_comparable(self):
        with tempfile.TemporaryDirectory() as t:
            rc, out = self.run_builder(t, ["22-0000.00", "33-0000.00"])
            doc = json.loads(out.read_text())
        self.assertEqual(rc, 0)
        self.assertEqual((doc["pivot_scale"]["min"], doc["pivot_scale"]["max"]), (1.0, 5.0))
        p = {r["soc_code"]: r["role_quality"]["p"] for r in doc["roles"]}
        self.assertEqual(p, {"22-0000.00": 0.75, "33-0000.00": 1.0})  # not each renormalized to its own range
        self.assertEqual([s["soc_code"] for s in doc["soc_targets"]], ["22-0000.00", "33-0000.00"])
        self.assertEqual(len({r["role_id"] for r in doc["roles"]}), 2)

    def test_blank_score_in_any_target_stops_whole_run(self):
        with tempfile.TemporaryDirectory() as t:
            rc, out = self.run_builder(t, ["22-0000.00", "44-0000.00"])
            self.assertEqual(rc, 3)
            self.assertFalse(out.exists())

    def test_unpaired_arguments_refused(self):
        with tempfile.TemporaryDirectory() as t:
            m = Path(t) / "m.json"
            m.write_text(json.dumps(match_file()))
            rc = B.main(["--soc", "22-0000.00", "--soc", "33-0000.00", "--matches", str(m),
                         "--out", str(Path(t) / "r.json"), "--compact", write_compact(t, ROWS)])
        self.assertEqual(rc, 2)

    def test_single_soc_shape_unchanged(self):
        with tempfile.TemporaryDirectory() as t:
            rc, out = self.run_builder(t, ["22-0000.00"])
            doc = json.loads(out.read_text())
        self.assertIn("soc_target", doc)
        self.assertNotIn("soc_targets", doc)


class PooledReport(unittest.TestCase):
    def test_ranks_and_strict_inversions(self):
        with tempfile.TemporaryDirectory() as t:
            comp = write_compact(t, ROWS)
            hi = match_file("33-0000.00", [{"company_name": "HI", "matched_titles": [{"title": "AI Engineer", "matched_phrases": ["ai engineer"]}],
                                            "total_approvals": "9", "total_denials": "1"}])  # p 0.9
            lo = match_file("22-0000.00", [{"company_name": "LO", "matched_titles": [{"title": "AI Engineer", "matched_phrases": ["ai engineer"]}],
                                            "total_approvals": "1", "total_denials": "0"}])  # p 1.0
            paths = []
            for name, m in (("hi", hi), ("lo", lo)):
                q = Path(t) / f"{name}.json"; q.write_text(json.dumps(m)); paths.append(str(q))
            roles = Path(t) / "roles.json"
            self.assertEqual(B.main(["--soc", "33-0000.00", "--matches", paths[0], "--soc", "22-0000.00",
                                     "--matches", paths[1], "--out", str(roles), "--compact", comp]), 0)
            doc = json.loads(roles.read_text())

            def scored(w):  # composite exactly as role-scorer.mjs computes it (weights 0.35 / 0.30 / w)
                out = []
                for r in doc["roles"]:
                    c = round(r["sponsorship"]["p"] * 0.35 + 0.30 + r["role_quality"]["p"] * w, 4)
                    out.append({"role_id": r["role_id"], "company": r["company"], "composite": c,
                                "recommendation": "Apply", "machine_recommendation": "Apply",
                                "trace": {"gates": [{"factor": "liveness", "multiplier": 1, "source": B.LIVENESS_SOURCE}]}})
                return {"weights_effective": {"role_quality": w, "fit": 0.3}, "config": {"apply_threshold": 0.3}, "roles": out}
            files = {}
            for w in (0, 0.15):
                f = Path(t) / f"s{w}.json"; f.write_text(json.dumps(scored(w))); files[w] = str(f)
            md, log = Path(t) / "r.md", Path(t) / "r.json"
            rc = R.main(["--roles", str(roles), "--matches", paths[0], "--matches", paths[1], "--before", files[0],
                         "--after", files[0.15], "--compact", comp, "--md-out", str(md), "--log-out", str(log)])
            self.assertEqual(rc, 0)
            lg = json.loads(log.read_text())
        # before: LO 0.65 > HI 0.615; after: HI 0.765 > LO 0.7625 — one strict reversal, no decision change
        self.assertEqual(lg["strict_rank_inversions"], [["HI", "LO"]])
        self.assertEqual(lg["decisions_changed"], [])
        self.assertEqual(lg["role_quality_p"], {"33-0000.00": 1.0, "22-0000.00": 0.75})


if __name__ == "__main__":
    unittest.main()
