#!/usr/bin/env python3
"""Offline tests for wage_level.py. Run from the repo root:

    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py
"""
import datetime as dt
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wage_level as w  # noqa: E402

DATA = w.load_data()
TH = DATA["thresholds"]


def annual(area):
    return TH[(area, w.SOC)]["annual"]


class Pay(unittest.TestCase):
    def rng(self, text):
        return [(r["lo"], r["hi"], r["unit"]) for r in w.parse_pay([text])[0]]

    def test_formats(self):
        for text in ("$140,000 - $165,000", "$140,000 – $165,000", "$140,000 — $165,000", "$140,000 to $165,000",
                     "$140,000-$165,000", "$140K - $165K", "$140k–$165k", "USD $140,000 - USD $165,000"):
            self.assertEqual(self.rng(text), [(140000, 165000, "year")], text)

    def test_hourly(self):
        self.assertEqual(self.rng("$57/hr - $68/hr"), [(57, 68, "hour")])
        self.assertEqual(self.rng("$57 - $68 per hour"), [(57, 68, "hour")])

    def test_html_escaped(self):
        self.assertEqual(self.rng("&lt;p&gt;$140,000&amp;nbsp;—&amp;nbsp;$165,000&lt;/p&gt;"), [(140000, 165000, "year")])

    def test_ignores_non_salary_numbers(self):
        self.assertEqual(self.rng("a $2,000 learning stipend and a $500 - $1,000 home-office budget"), [])

    def test_duplicates_collapse(self):
        self.assertEqual(len(w.parse_pay(["$140,000 - $165,000", "range: $140,000 - $165,000"])[0]), 1)


class Locations(unittest.TestCase):
    def test_multi_city_and_remote(self):
        loc = w.parse_locations("San Francisco, CA, US; Palo Alto, CA, US; Remote, US")
        self.assertEqual(loc["worksites"], [("San Francisco", "CA"), ("Palo Alto", "CA")])
        self.assertTrue(loc["remote"])

    def test_separators_and_state_names(self):
        self.assertEqual(w.parse_locations("San Francisco, CA • New York, NY")["worksites"], [("San Francisco", "CA"), ("New York", "NY")])
        self.assertEqual(w.parse_locations("Mountain View, California")["worksites"], [("Mountain View", "CA")])
        self.assertEqual(w.parse_locations("New York, NY - Hybrid")["worksites"], [("New York", "NY")])

    def test_bare_city_names(self):
        loc = w.parse_locations("San Francisco, Seattle, New York", DATA["known_cities"])
        self.assertEqual(loc["worksites"], [("San Francisco", "CA"), ("Seattle", "WA"), ("New York", "NY")])
        self.assertEqual(w.parse_locations("San Francisco", DATA["known_cities"])["worksites"], [("San Francisco", "CA")])
        self.assertEqual(w.parse_locations("Springfield", DATA["known_cities"])["unparsed"], ["Springfield"])

    def test_region_is_not_a_city(self):
        loc = w.parse_locations("San Francisco Bay Area")
        self.assertEqual((loc["worksites"], loc["regions"]), ([], ["San Francisco Bay Area"]))

    def test_neighbouring_cities_in_different_areas(self):
        self.assertEqual(DATA["cities"][("menlo park", "CA")]["area"], "41860")
        self.assertEqual(DATA["cities"][("palo alto", "CA")]["area"], "41940")

    def test_same_county_name_in_two_states(self):
        self.assertEqual(DATA["cities"][("newark", "NJ")]["area"], "35620")       # Essex County NJ
        self.assertEqual(DATA["cities"][("andover", "MA")]["area"], "14460")      # Essex County MA


class Levels(unittest.TestCase):
    def test_boundaries(self):
        t = annual("14460")            # Boston: 114,275 / 138,237 / 162,198 / 186,160
        self.assertEqual(w.level_for(t[1], t), 2)
        self.assertEqual(w.level_for(t[1] - 1, t), 1)
        self.assertEqual(w.level_for(t[3] + 50000, t), 4)

    def test_below_level_1_counts_once(self):
        t = annual("41940")
        self.assertEqual(w.level_for(t[0] - 1, t), 0)
        self.assertEqual(w.entries(0), 1)
        self.assertEqual([w.entries(l) for l in (1, 2, 3, 4)], [1, 2, 3, 4])

    def test_same_pay_different_cities(self):
        got = {a: w.level_for(140000, annual(a)) for a in ("14460", "35620", "41860", "41940", "42660")}
        self.assertEqual(got, {"14460": 2, "35620": 2, "41860": 1, "41940": 0, "42660": 1})

    def test_next_step(self):
        t = annual("42660")
        self.assertEqual(w.next_step(140000, t), {"next_level": "Level II", "threshold": t[1], "gap": t[1] - 140000})
        self.assertIsNone(w.next_step(t[3], t))

    def test_annual_is_hourly_times_2080(self):
        self.assertEqual(annual("14460")[0], round(54.94 * 2080))


class DataIntegrity(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        for name in os.listdir(w.DATA):
            shutil.copy(os.path.join(w.DATA, name), self.tmp)
        self.saved = {k: getattr(w, k) for k in ("DATA", "MANIFEST", "ALC", "GEO", "WORKSITES")}
        w.DATA, w.MANIFEST = self.tmp, os.path.join(self.tmp, "extract-manifest.json")
        w.ALC, w.GEO = os.path.join(self.tmp, "oflc-alc-2026-27-extract.csv"), os.path.join(self.tmp, "oflc-geography-extract.csv")
        w.WORKSITES = os.path.join(self.tmp, "worksites.csv")

    def tearDown(self):
        for k, v in self.saved.items():
            setattr(w, k, v)
        shutil.rmtree(self.tmp)

    def edit(self, path, old, new, refresh_hash=False):
        with open(path) as f:
            text = f.read()
        self.assertIn(old, text)
        with open(path, "w") as f:
            f.write(text.replace(old, new, 1))
        if refresh_hash:
            with open(w.MANIFEST) as f:
                m = json.load(f)
            m["outputs"][os.path.basename(path)]["sha256"] = w.sha256_file(path)
            with open(w.MANIFEST, "w") as f:
                json.dump(m, f)

    def test_changed_file_halts(self):
        self.edit(w.ALC, "54.94", "44.94")
        with self.assertRaisesRegex(w.Halt, "SHA-256"):
            w.load_data()

    def test_broken_level_arithmetic_halts_even_with_a_fresh_hash(self):
        self.edit(w.ALC, "66.46", "61.46", refresh_hash=True)
        with self.assertRaisesRegex(w.Halt, "arithmetic"):
            w.load_data()

    def test_city_mapped_to_unknown_county_halts(self):
        self.edit(w.WORKSITES, "Palo Alto,CA,Santa Clara County", "Palo Alto,CA,Santa Cruz County")
        with self.assertRaisesRegex(w.Halt, "Santa Cruz"):
            w.load_data()


class Gates(unittest.TestCase):
    persona = json.load(open(os.path.join(w.FIX, "persona.json")))

    def gate(self, run_date, **over):
        p = dict(self.persona, **over)
        return w.timeline_gate(p, dt.date.fromisoformat(run_date), DATA["manifest"])

    def test_timeline_passes_in_october(self):
        self.assertTrue(self.gate("2026-10-19")["pass"])

    def test_lag_sensitivity(self):
        g = self.gate("2026-12-20")
        self.assertEqual([(x["hiring_lag_days"], x["in_time"]) for x in g["lag_sensitivity"]["value"]], [(30, True), (60, True), (90, False)])
        self.assertEqual(g["start_search_by"]["value"], "2027-01-09")

    def test_late_search_misses_registration(self):
        g = self.gate("2027-02-01")
        self.assertFalse(g["pass"])
        self.assertFalse(next(c for c in g["checks"] if c["id"] == "G2a")["pass"])

    def test_opt_ending_before_filing_window(self):
        g = self.gate("2026-10-19", opt_ead_end="2027-05-01")
        self.assertFalse(next(c for c in g["checks"] if c["id"] == "G2b")["pass"])

    def test_registration_outside_wage_year(self):
        g = self.gate("2026-10-19", planned_registration_date="2027-07-10", petition_filing_window_end="2027-10-01", opt_ead_end="2028-01-14")
        self.assertFalse(next(c for c in g["checks"] if c["id"] == "G2c")["pass"])

    def test_bad_date_halts(self):
        with self.assertRaises(w.Halt):
            self.gate("2026-10-19", planned_registration_date="March 2027")

    def test_liveness_rules(self):
        self.assertEqual(w.classify_liveness("expired", "insufficient content")[0], "uncertain")
        self.assertEqual(w.classify_liveness("expired", "HTTP 404")[0], "expired")
        self.assertEqual(w.combine_liveness(("active", "ok"), 404)[0], "uncertain")
        self.assertEqual(w.combine_liveness(("uncertain", "timeout"), 200)[0], "active")


class Ranges(unittest.TestCase):
    def test_nearest_city_wins(self):
        text = "Menlo Park office: $150,000-$180,000. Palo Alto office: $155,000-$185,000."
        rs, t = w.parse_pay([text])
        got = w.assign_ranges(rs, t, [("Menlo Park", "CA"), ("Palo Alto", "CA")])
        self.assertEqual({k[0]: (v["lo"], v["hi"]) for k, v in got.items()},
                         {"Menlo Park": (150000, 180000), "Palo Alto": (155000, 185000)})

    def test_zone_lists_several_cities(self):
        text = ("Base Pay Range: Zone 1 (Menlo Park, CA; New York, NY; Bellevue, WA; Washington, DC) $166,000 — $195,000 USD "
                "Zone 2 (Denver, CO; Chicago, IL) $147,000 — $172,000 USD")
        rs, t = w.parse_pay([text])
        got = w.assign_ranges(rs, t, [("Bellevue", "WA"), ("Menlo Park", "CA"), ("New York", "NY")])
        self.assertEqual({k[0]: v["lo"] for k, v in got.items()}, {"Bellevue": 166000, "Menlo Park": 166000, "New York": 166000})

    def test_unlabelled_ranges_refused(self):
        rs, t = w.parse_pay(["$150,000-$180,000 or $155,000-$185,000"])
        self.assertIsNone(w.assign_ranges(rs, t, [("Menlo Park", "CA"), ("Palo Alto", "CA")]))


class GateEnforcement(unittest.TestCase):
    """Added 2026-10-21 after an outside review found that G1, G2 and G4 were described as hard stops
    but not enforced in code, and that a skipped posting still carried level data."""
    post = {"posting_id": "x-1", "company": "Example", "title": "Software Engineer, New Grad", "location": "Seattle, WA",
            "url": "https://example.com/1", "pay_text": ["$140,000 - $165,000"], "api_status": 200, "source": "constructed"}
    live = {"x-1": ("active", "HTTP 200"), "_fixture": True}
    def gate(self, g, decision="clear", pid="x-1"):
        return {"gate": g, "posting_id": pid, "decision": decision, "by": "test", "date": "2026-10-21"}

    def test_only_g3_logged_stays_provisional(self):
        ev = w.evaluate(self.post, DATA, self.live, [self.gate("G3")], {})
        self.assertEqual(ev["status"], "provisional (gate G1, G2 not cleared)")

    def test_all_three_logged_is_checked(self):
        ev = w.evaluate(self.post, DATA, self.live, [self.gate("G1"), self.gate("G2", pid="*"), self.gate("G3")], {})
        self.assertEqual(ev["status"], "checked")

    def test_conflicting_liveness_is_held_without_a_person(self):
        p = dict(self.post, api_status=404)
        ev = w.evaluate(p, DATA, self.live, [self.gate("G2", pid="*"), self.gate("G3")], {})
        self.assertEqual((ev["status"], ev["stops"][0][0]), ("refused", "G1-held"))
        self.assertEqual(ev["sites"], [])

    def test_closed_posting_with_a_valid_range_has_no_levels(self):
        live = {"x-1": ("expired", "HTTP 404"), "_fixture": True}
        ev = w.evaluate(dict(self.post, api_status=404), DATA, live, [], {})
        self.assertEqual((ev["status"], ev["sites"]), ("skip", []))

    def test_release_counts_only_for_the_run_it_names(self):
        out = tempfile.mkdtemp(dir=HERE)
        try:
            gates = json.load(open(os.path.join(w.FIX, "gates-sample.json")))
            gates.append({"gate": "G4", "posting_id": "*", "decision": "clear", "by": "test", "date": "2026-10-21", "run": "another-run"})
            gl = os.path.join(out, "gates.json"); json.dump(gates, open(gl, "w"))
            log = w.run(os.path.join(w.FIX, "persona.json"), os.path.join(w.FIX, "postings-sample.json"), out, gl,
                        os.path.join(w.FIX, "liveness-sample.json"), "2026-10-19", mode="sample")
            self.assertFalse(log["released"])
            self.assertIn("NOT RELEASED", open(os.path.join(out, "report.md")).read())
            gates.append({"gate": "G4", "posting_id": "*", "decision": "clear", "by": "test", "date": "2026-10-21", "run": os.path.basename(out)})
            json.dump(gates, open(gl, "w"))
            log = w.run(os.path.join(w.FIX, "persona.json"), os.path.join(w.FIX, "postings-sample.json"), out, gl,
                        os.path.join(w.FIX, "liveness-sample.json"), "2026-10-19", mode="sample")
            self.assertTrue(log["released"])
            self.assertNotIn("NOT RELEASED", open(os.path.join(out, "report.md")).read())
        finally:
            shutil.rmtree(out)


class EndToEnd(unittest.TestCase):
    def test_sample_statuses(self):
        out = tempfile.mkdtemp(dir=os.path.join(HERE))
        try:
            log = w.run(os.path.join(w.FIX, "persona.json"), os.path.join(w.FIX, "postings-sample.json"), out,
                        os.path.join(w.FIX, "gates-sample.json"), os.path.join(w.FIX, "liveness-sample.json"), "2026-10-19", mode="sample")
            got = {p["posting_id"]: (p["status"].split(" ")[0], [c for c, _ in p["stops"]]) for p in log["postings"]}
            self.assertEqual(got, {
                "s01": ("checked", []), "s02": ("checked", []), "s03": ("checked", []),
                "s04": ("refused", ["worksite"]), "s05": ("refused", ["worksite"]), "s06": ("refused", ["no-pay-range"]),
                "s07": ("skip", ["G1-expired"]), "s08": ("provisional", []), "s09": ("checked", []),
                "s10": ("checked", []), "s11": ("refused", ["G1-held"])})
            s01 = {s["worksite"]["value"]: s["entries_at_min"]["value"] for s in log["postings"][0]["sites"]}
            self.assertEqual(s01, {"New York, NY": 2, "Seattle, WA": 1})
            self.assertTrue(log["postings"][1]["sites"][0]["below_level_1_at_min"]["value"])
            self.assertFalse(log["released"])      # G4 names the run folder "sample", not this temp folder
            with open(os.path.join(out, "report.md")) as f:
                self.assertTrue(f.read().split("\n")[2].startswith("## Executive summary"))
        finally:
            shutil.rmtree(out)

    def test_closed_posting_with_no_title_is_skipped(self):
        p = {"posting_id": "x-1", "company": "Example", "title": None, "location": "", "url": "https://example.com/1",
             "pay_text": [], "api_status": 404, "source": "constructed"}
        live = {"x-1": ("expired", "HTTP 404"), "_fixture": True}
        ev = w.evaluate(p, DATA, live, [], {})
        self.assertEqual((ev["status"], ev["stops"][0][0]), ("skip", "G1-expired"))

    def test_output_outside_namespace_halts(self):
        with self.assertRaises(w.Halt):
            w.check_out_dir(os.path.join(w.REPO, "chapters"))


if __name__ == "__main__":
    unittest.main(verbosity=1)
