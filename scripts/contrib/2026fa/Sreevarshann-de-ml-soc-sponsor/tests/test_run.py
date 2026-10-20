"""End-to-end offline tests for run.py, called in-process on fixtures."""

from __future__ import annotations

import contextlib
import io
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
COMPONENT = HERE.parent
FIX = COMPONENT / "fixtures"
sys.path.insert(0, str(COMPONENT))
sys.path.insert(0, str(HERE))
import lookup as L  # noqa: E402
import run  # noqa: E402
from test_lookup import NoNetwork  # noqa: E402

PRIYA = L.REPO / "search/examples/priya-nair/profile.yml"


def fixture_args(out_dir, **over):
    args = {
        "--targets": FIX / "targets.csv",
        "--out-dir": out_dir,
        "--persona": PRIYA,
        "--liveness": FIX / "liveness-output.txt",
        "--checks": FIX / "posting-checks.csv",
        "--run-date": "2099-01-03",
        "--sponsor-csv": FIX / "sponsor-slice.csv",
        "--bls-csv": FIX / "bls-slice.csv",
        "--formd-dir": FIX / "formd-sample",
    }
    args.update(over)
    out = []
    for k, v in args.items():
        if v is not None:
            out += [k, str(v)]
    return out


def call(argv):
    buf_out, buf_err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(buf_out), contextlib.redirect_stderr(buf_err):
        code = run.main(argv)
    return code, buf_out.getvalue(), buf_err.getvalue()


def persona_file(tmp, auth, used=34, buffer=20, needs=True):
    p = Path(tmp) / "persona.yml"
    p.write_text(
        "# FICTIONAL test persona\n"
        "candidate:\n  name: Test Persona\n"
        f"needs_sponsorship: {'true' if needs else 'false'}\n"
        "visa:\n"
        f'  current_status: "{auth}"\n'
        f"  unemployment_days_used: {used}\n"
        f"  buffer_target: {buffer}\n",
        encoding="utf-8",
    )
    return p


class TestFullRun(NoNetwork):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / "run"
        cls.code, cls.stdout, cls.stderr = call(fixture_args(cls.out))
        cls.ev = json.loads((cls.out / "evidence.json").read_text(encoding="utf-8"))

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_exit_and_counts(self):
        self.assertEqual(self.code, 0, self.stderr)
        self.assertEqual(self.ev["counts"], {"scoreable": 3, "held": 1, "blocked": 2, "skip_gated": 0, "stopped": 0})

    def test_every_role_on_exactly_one_status(self):
        by = {r["company"]["value"]: r["status"] for r in self.ev["roles"]}
        self.assertEqual(by, {
            "ZZFIXTURE ML Inc.": "scoreable",          # likely, active
            "1Life Healthcare": "scoreable",           # likely, expired -> liveness 0 (scorer Skips)
            "FeedMob Inc": "held",                     # uncertain, no human check
            "ZZFIXTURE Not In Dataset": "blocked",     # not found
            "ZZFIXTURE TWIN": "blocked",               # ambiguous
            "ZZFIXTURE MISSINGRATE INC": "scoreable",  # uncertain, cleared by human check
        })

    def test_every_applicable_reason_is_reported(self):
        by = {r["company"]["value"]: r for r in self.ev["roles"]}
        # not in the sponsor dataset AND its URL is absent from the liveness output
        nf = by["ZZFIXTURE Not In Dataset"]
        self.assertEqual(nf["status"], "blocked")
        self.assertEqual([x["kind"] for x in nf["reasons"]], ["blocked", "held"])
        self.assertIn("not_found", nf["reasons"][0]["detail"])
        self.assertIn("liveness held", nf["reasons"][1]["detail"])
        # ambiguous name but a live posting: only the blocking reason
        self.assertEqual([x["kind"] for x in by["ZZFIXTURE TWIN"]["reasons"]], ["blocked"])
        # scoreable with a closed liveness gate carries an explanatory note
        exp = by["1Life Healthcare"]
        self.assertEqual(exp["status"], "scoreable")
        self.assertEqual([x["kind"] for x in exp["reasons"]], ["scoreable", "note"])
        self.assertIn("scorer will Skip", exp["reasons"][1]["detail"])
        self.assertEqual([x["kind"] for x in by["ZZFIXTURE ML Inc."]["reasons"]], ["scoreable"])
        report = (self.out / "report.md").read_text(encoding="utf-8")
        self.assertIn("  - blocked: missing evidence: not_found", report)
        self.assertIn("  - held: liveness held: liveness check not run for this URL", report)

    def test_report_rate_one_decimal_and_title_column_values(self):
        report = (self.out / "report.md").read_text(encoding="utf-8")
        rows = [l for l in report.splitlines() if l.startswith("| r")]
        self.assertEqual(len(rows), 6 + 6)  # per-company table + funding table
        per_company = rows[:6]
        allowed = {"yes", "no", "unparseable list", "n/a (no sponsor record)"}
        for row in per_company:
            cells = [c.strip() for c in row.strip("|").split("|")]
            self.assertIn(cells[6], allowed, row)
            rate = cells[4].split(" / ")[2]
            self.assertTrue(rate in ("—", "missing") or re.fullmatch(r"\d+\.\d", rate), row)
        self.assertIn("/ 85.7 |", report)   # ZZFIXTURE ML: 85.714… rounds to one decimal
        self.assertIn("Seniority:", report)

    def test_roles_json_feeds_only_clean_votes(self):
        roles = json.loads((self.out / "roles.json").read_text(encoding="utf-8"))
        self.assertEqual([r["role_id"] for r in roles], ["r1", "r2", "r6"])
        L.assert_votes_clean(roles)
        for r in roles:
            self.assertEqual(r["fit"], {"p": 0.5, "source": "your-input (neutral constant)"})
            self.assertEqual(r["timeline"]["factor"], 1)
            self.assertNotIn("role_quality", r)
        self.assertEqual(roles[1]["liveness"]["factor"], 0)
        self.assertEqual(roles[2]["liveness"]["source"], "your-input")
        self.assertEqual(roles[0]["sponsorship"]["p"], 0.7)

    def test_profile_avoids_trap(self):
        prof = json.loads((self.out / "profile.json").read_text(encoding="utf-8"))
        self.assertEqual(prof, {"authorization": "F-1 OPT (post-completion, year 1)"})
        self.assertFalse(L.scorer_would_drop_sponsorship(prof["authorization"]))

    def test_no_personal_columns_or_absolute_paths_in_outputs(self):
        for name in ("evidence.json", "report.md", "roles.json"):
            text = (self.out / name).read_text(encoding="utf-8")
            for col in ("phone", "executive_officers", "board_directors"):
                self.assertNotIn(col, text, name)
            self.assertNotIn(str(L.REPO), text, name)

    def test_report_opens_with_plain_summary(self):
        text = (self.out / "report.md").read_text(encoding="utf-8")
        lines = text.splitlines()
        self.assertTrue(lines[0].startswith("# "))
        self.assertEqual(lines[2], "## Executive summary")
        summary = text.split("## Executive summary", 1)[1].split("\n## ", 1)[0]
        for bad in ("/", ".csv", ".json", "|", "SOC ", "P9"):
            self.assertNotIn(bad, summary, bad)
        self.assertIn("proposed", summary)

    def test_writes_only_into_out_dir(self):
        self.assertEqual(sorted(p.name for p in self.out.iterdir()), ["evidence.json", "profile.json", "report.md", "roles.json"])

    def test_overwrite_refused(self):
        code, _, err = call(fixture_args(self.out))
        self.assertEqual(code, 2)
        self.assertIn("--overwrite", err)


class TestStops(NoNetwork):
    def setUp(self):
        super().setUp()
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "run"

    def test_authorization_trap_stops_run(self):
        p = persona_file(self.tmp.name, "F-1 STEM OPT — work authorized (EAD)")
        code, stdout, _ = call(fixture_args(self.out, **{"--persona": p}))
        self.assertEqual(code, 4)
        self.assertIn("STOP (7)", stdout)
        self.assertFalse((self.out / "roles.json").exists())
        ev = json.loads((self.out / "evidence.json").read_text(encoding="utf-8"))
        self.assertEqual(ev["counts"]["scoreable"], 0)

    def test_timeline_closed_skips_all(self):
        p = persona_file(self.tmp.name, "F-1 OPT (post-completion, year 1)", used=75, buffer=20)
        code, stdout, _ = call(fixture_args(self.out, **{"--persona": p}))
        self.assertEqual(code, 3)
        ev = json.loads((self.out / "evidence.json").read_text(encoding="utf-8"))
        self.assertEqual(ev["counts"]["skip_gated"], 6)
        self.assertFalse((self.out / "roles.json").exists())

    def test_no_liveness_holds_every_found_role(self):
        code, _, _ = call(fixture_args(self.out, **{"--liveness": None, "--checks": None}))
        self.assertEqual(code, 0)
        ev = json.loads((self.out / "evidence.json").read_text(encoding="utf-8"))
        self.assertEqual(ev["counts"]["scoreable"], 0)
        self.assertEqual(ev["counts"]["held"], 4)
        self.assertFalse((self.out / "roles.json").exists())

    def test_bad_targets_halt(self):
        code, _, err = call(fixture_args(self.out, **{"--targets": FIX / "targets-bad.csv"}))
        self.assertEqual(code, 2)
        self.assertIn("halt:", err)
        self.assertFalse(self.out.exists())

    def test_private_out_dir_refused(self):
        code, _, err = call(fixture_args(L.REPO / "private" / "x"))
        self.assertEqual(code, 2)
        self.assertIn("private path", err)

    def test_missing_input_file_halts(self):
        code, _, err = call(fixture_args(self.out, **{"--targets": FIX / "nope.csv"}))
        self.assertEqual(code, 2)
        self.assertIn("not found", err)


if __name__ == "__main__":
    unittest.main()
