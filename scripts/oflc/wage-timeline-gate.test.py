#!/usr/bin/env python3
"""Test wage-timeline-gate.py against the fixture postings and malformed inputs.

Usage:
  python3 -I scripts/oflc/wage-timeline-gate.test.py [--gate <path to gate script>]

--gate lets a mutated scratch copy be tested, to prove these checks can fail.
Prints N/N passed; exits 1 on any failure.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIXTURES = HERE / "fixtures" / "postings.sample.json"
GH_SAMPLE = HERE / "fixtures" / "greenhouse-job.sample.json"
CONVERTER = HERE / "greenhouse-to-gate-input.py"
DATA_DIR = HERE.parents[1] / "data" / "oflc"

checks: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append((name, ok, detail))


def run(gate: Path, postings: Path, out_dir: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-I", str(gate), str(postings), "--out-dir", str(out_dir),
         "--data-dir", str(DATA_DIR)],
        capture_output=True, text=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--gate", type=Path, default=HERE / "wage-timeline-gate.py")
    args = parser.parse_args()
    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)

        out = tmp / "out"
        proc = run(args.gate, FIXTURES, out)
        check("fixture run exits 0", proc.returncode == 0, proc.stderr.strip())
        log_path = out / "wage-gate-log.json"
        report_path = out / "wage-gate-report.md"
        check("log and report written", log_path.is_file() and report_path.is_file())
        check("nothing else written to out-dir",
              sorted(p.name for p in out.iterdir()) == ["wage-gate-log.json", "wage-gate-report.md"]
              if out.is_dir() else False)

        log = json.loads(log_path.read_text()) if log_path.is_file() else {"results": [], "counts": {}}
        by_id = {r["id"]: r for r in log["results"]}
        for f in fixtures:
            got = by_id.get(f["id"], {})
            check(f"{f['id']}: {f['expected_outcome']} {f['expected_reason']}",
                  got.get("outcome") == f["expected_outcome"] and got.get("reason") == f["expected_reason"],
                  f"got {got.get('outcome')} {got.get('reason')}")
        expected_counts = {}
        for f in fixtures:
            expected_counts[f["expected_outcome"]] = expected_counts.get(f["expected_outcome"], 0) + 1
        check("log counts match fixtures",
              {k: v for k, v in log["counts"].items() if v} == expected_counts,
              f"got {log['counts']}")
        report = report_path.read_text() if report_path.is_file() else ""
        check("report opens with an executive summary",
              report.splitlines()[2:3] == ["## Executive summary"])

        converted = tmp / "converted.json"
        proc = subprocess.run([sys.executable, "-I", str(CONVERTER), str(GH_SAMPLE), "-o",
                               str(converted), "--assume-start-month", "2027-06"],
                              capture_output=True, text=True)
        check("converter exits 0", proc.returncode == 0, proc.stderr.strip())
        c = json.loads(converted.read_text())[0] if converted.is_file() else {}
        check("converter parses city/state", (c.get("city"), c.get("state")) == ("Sunnyvale", "CA"),
              f"got {c.get('city')}, {c.get('state')}")
        check("converter parses pay range", (c.get("salary_min"), c.get("salary_max")) == (160000, 190000),
              f"got {c.get('salary_min')}-{c.get('salary_max')}")
        check("converter takes experience years, not '2 year anniversary'",
              c.get("years_required") == 3, f"got {c.get('years_required')}")
        check("assumed start is labeled your-input",
              c.get("start_month") == "2027-06"
              and c.get("labels", {}).get("start_month") == "your-input (scenario)")
        e2e = tmp / "e2e"
        run(args.gate, converted, e2e)
        e2e_log = json.loads((e2e / "wage-gate-log.json").read_text()) if (e2e / "wage-gate-log.json").is_file() else {"results": [{}]}
        r = e2e_log["results"][0]
        check("converter -> gate: UNCERTAIN, 'we do sponsor' logged as info",
              r.get("outcome") == "UNCERTAIN"
              and [f["flag"] for f in r.get("text_flags", [])] == ["sponsors"],
              f"got {r.get('outcome')} {r.get('text_flags')}")
        nowhere = tmp / "remote.json"
        nowhere.write_text(json.dumps({"id": 1, "location": {"name": "United States"}}))
        subprocess.run([sys.executable, "-I", str(CONVERTER), str(nowhere), "-o", str(converted)],
                       capture_output=True, text=True)
        c = json.loads(converted.read_text())[0]
        check("'United States' only -> no city, no start", c["city"] is None and c["start_month"] is None)

        broken = tmp / "broken.json"
        broken.write_text("[{\"id\": \"x\",", encoding="utf-8")
        bad_out = tmp / "bad-out"
        proc = run(args.gate, broken, bad_out)
        check("malformed JSON exits 2", proc.returncode == 2, f"exit {proc.returncode}")
        check("malformed JSON writes nothing", not bad_out.exists())

        text_salary = tmp / "text-salary.json"
        text_salary.write_text(json.dumps([{
            "id": "text-salary", "city": "Seattle", "state": "WA", "salary_min": "120k",
            "salary_period": "year", "years_required": 1, "start_month": "2027-06"}]),
            encoding="utf-8")
        proc = run(args.gate, text_salary, bad_out)
        check("text salary exits 2", proc.returncode == 2, f"exit {proc.returncode}")
        check("text salary writes nothing", not bad_out.exists())

    passed = sum(1 for _, ok, _ in checks if ok)
    for name, ok, detail in checks:
        print(f"{'ok  ' if ok else 'FAIL'} {name}" + ("" if ok or not detail else f" -- {detail}"))
    print(f"\n{passed}/{len(checks)} passed")
    sys.exit(0 if passed == len(checks) else 1)


if __name__ == "__main__":
    main()
