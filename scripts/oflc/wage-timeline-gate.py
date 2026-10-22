#!/usr/bin/env python3
"""Gate job postings on start date and the H-1B prevailing wage (DOL OFLC, SOC 15-1252).

Two gates the engine could not check before: the role must start on/after an earliest
start month, and its posted salary must clear the prevailing wage for the posting's wage
area at the level its required experience implies. Reads only the committed extract in
data/oflc/ (see data/oflc/README.md). Stdlib only; never touches the network.

Usage:
  python3 -I scripts/oflc/wage-timeline-gate.py <postings.json> --out-dir <dir> \
      [--earliest-start 2027-06] [--data-dir data/oflc]

Level rule (your-input, "Option A"): required experience maps to the two levels an
employer could plausibly file at -- <2 yrs -> L1/L2, 2-<5 -> L2/L3, >=5 -> L3/L4. PASS only
if the salary minimum clears the HIGHER level; FAIL if the salary maximum is below the
LOWER level; anything between is UNCERTAIN and goes to a human.

Text check (runs first): if a posting's description_text says it will not sponsor, or that
it needs a security clearance or US citizenship, the posting is SKIPped -- those close the
door for a visa holder regardless of wage. Each match is logged with a snippet for a human.

Exit code: 0 when it ran (PASS/FAIL/UNCERTAIN/SKIP/STOP are results, not errors);
2 on malformed input or a missing data file (conformance halt).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = REPO_ROOT / "data" / "oflc"
WAGE_YEAR = "2026-27"
SOC = "15-1252"
HOURS_PER_YEAR = 2080
MONTH = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
BANDS = [(2, (1, 2)), (5, (2, 3)), (float("inf"), (3, 4))]
OUTCOMES = ["PASS", "UNCERTAIN", "FAIL", "SKIP", "STOP"]
TEXT_FLAGS = [
    ("no-sponsorship", "posting-refuses-sponsorship", [
        r"without\s+(?:visa\s+|employment\s+|immigration\s+)?sponsorship",
        r"\b(?:not|unable to|cannot|can't|will not|won't|do not|does not)\s+(?:be\s+)?(?:able\s+to\s+)?"
        r"(?:provide\s+|offer\s+|support\s+)?(?:visa\s+|employment\s+|immigration\s+)?sponsor",
        r"\bno\s+(?:visa\s+|employment\s+)?sponsorship",
    ]),
    ("clearance-or-citizenship", "requires-clearance-or-citizenship", [
        r"\bTS\s*/\s*SCI\b",
        r"\btop\s+secret\b",
        r"\b(?:security|secret|active)\s+clearance\b",
        r"\bpolygraph\b",
        r"\bmust\s+be\s+(?:a\s+)?U\.?\s?S\.?\s+citizen",
        r"\bU\.?\s?S\.?\s+citizenship\s+(?:is\s+)?required",
    ]),
    ("sponsors", None, [
        r"\bwe\s+(?:do\s+)?sponsor\b",
        r"\bwill\s+sponsor\b",
        r"\btake\s+over\s+sponsorship\b",
    ]),
]
LABELS = {
    "text_flags": "record (text match)",
    "wage_floors": "record",
    "annualization": "convention [verify]",
    "band_rule": "your-input",
    "earliest_start": "your-input",
    "level_employer_files": "cannot-verify",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def halt(message: str) -> None:
    sys.stderr.write(f"wage-timeline-gate: {message}\n")
    sys.exit(2)


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return path.name


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        halt(f"missing data file: {rel(path)} (run scripts/oflc/extract-prevailing-wages.py)")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def validate(postings: object) -> list[dict]:
    if not isinstance(postings, list):
        halt("input must be a JSON list of postings")
    for i, p in enumerate(postings):
        where = f"posting #{i + 1}"
        if not isinstance(p, dict) or not p.get("id"):
            halt(f"{where}: must be an object with an 'id'")
        where = f"posting {p['id']!r}"
        if p.get("start_month") is not None and not MONTH.match(str(p["start_month"])):
            halt(f"{where}: start_month must be YYYY-MM, got {p['start_month']!r}")
        for field in ("salary_min", "salary_max", "years_required"):
            if p.get(field) is not None and (not is_number(p[field]) or p[field] < 0):
                halt(f"{where}: {field} must be a non-negative number, got {p[field]!r}")
        has_salary = p.get("salary_min") is not None or p.get("salary_max") is not None
        if has_salary and p.get("salary_period") not in ("year", "hour"):
            halt(f"{where}: salary_period must be 'year' or 'hour', got {p.get('salary_period')!r}")
    return postings


def annual(value: float | None, period: str | None) -> float | None:
    if value is None:
        return None
    return round(value * HOURS_PER_YEAR, 2) if period == "hour" else float(value)


def band_for(years: float) -> tuple[int, int]:
    return next(levels for limit, levels in BANDS if years < limit)


def text_flags(text: str | None) -> list[dict]:
    flags = []
    for flag, _, patterns in TEXT_FLAGS:
        for pattern in patterns:
            m = re.search(pattern, text or "", flags=re.IGNORECASE)
            if m:
                lo, hi = max(0, m.start() - 60), min(len(text), m.end() + 60)
                flags.append({"flag": flag, "match": m.group(0),
                              "snippet": " ".join(text[lo:hi].split())})
                break
    return flags


def decide(p: dict, earliest: str, wages: dict, cities: dict, counties: dict) -> dict:
    result = {
        "id": p["id"],
        "company": p.get("company"),
        "title": p.get("title"),
        "url": p.get("url"),
        "inputs": {k: p.get(k) for k in (
            "city", "state", "worksite_county", "soc", "employer_type", "salary_min",
            "salary_max", "salary_period", "years_required", "start_month")},
        "posting_labels": p.get("labels", {}),
    }

    def done(outcome: str, reason: str) -> dict:
        result.update(outcome=outcome, reason=reason)
        return result

    flags = text_flags(p.get("description_text"))
    result["text_flags"] = flags
    for flag, reason, _ in TEXT_FLAGS:
        if reason and any(f["flag"] == flag for f in flags):
            return done("SKIP", reason)

    start = p.get("start_month")
    if start is None:
        return done("STOP", "missing-gate-value:timeline")
    if start < earliest:
        return done("SKIP", "timeline-closed")
    if p.get("employer_type", "private") != "private":
        return done("STOP", "acwia-table-not-extracted")
    if p.get("soc", SOC) != SOC:
        return done("STOP", "soc-not-extracted")

    city = cities.get((p.get("city"), p.get("state")))
    if city is None:
        return done("STOP", "unknown-location")
    if city["status"] == "ok":
        area = city["areas"]
    else:
        area = counties.get((p.get("state"), p.get("worksite_county")))
        if area is None:
            return done("STOP", "split-needs-worksite")
    w = wages[area]
    floors = {f"L{n}": {"hourly": float(w[f"level{n}_hr"]),
                        "annual": round(float(w[f"level{n}_hr"]) * HOURS_PER_YEAR, 2)}
              for n in range(1, 5)}
    result.update(area=area, area_name=w["area_name"], floors=floors)

    period = p.get("salary_period")
    sal_min, sal_max = annual(p.get("salary_min"), period), annual(p.get("salary_max"), period)
    if sal_min is None and sal_max is None:
        return done("STOP", "missing-salary")
    years = p.get("years_required")
    if years is None:
        return done("STOP", "missing-experience")

    low, high = band_for(years)
    low_floor, high_floor = floors[f"L{low}"]["annual"], floors[f"L{high}"]["annual"]
    result["band"] = {"years_required": years, "levels": [f"L{low}", f"L{high}"]}
    result["compared"] = {"salary_min_annual": sal_min, "salary_max_annual": sal_max,
                          "low_floor_annual": low_floor, "high_floor_annual": high_floor}
    if sal_min is not None and sal_min >= high_floor:
        return done("PASS", f"salary-min-clears-L{high}")
    if sal_max is not None and sal_max < low_floor:
        return done("FAIL", f"salary-max-below-L{low}")
    return done("UNCERTAIN", f"between-L{low}-and-L{high}-human-decides")


def money(value: float | None) -> str:
    return "—" if value is None else f"${value:,.0f}"


def report_lines(results: list[dict], counts: Counter, args: argparse.Namespace,
                 data_files: list[dict]) -> list[str]:
    n = len(results)
    lines = [
        "# Wage-Floor and Start-Date Gate Report",
        "",
        "## Executive summary",
        "",
        f"This report checks {n} job postings against two hard requirements before anyone "
        f"spends time applying: the job must start in {args.earliest_start} or later, and the "
        f"posted salary must meet the U.S. Department of Labor's H-1B prevailing wage for that "
        f"location at the experience level the posting implies. Read it to see which postings "
        f"are worth a closer look and which can be dropped now. Of {n} postings, "
        f"{counts['PASS']} cleared both requirements, {counts['UNCERTAIN']} need a person to "
        f"decide, {counts['FAIL']} pay below the floor, {counts['SKIP']} start too early, and "
        f"{counts['STOP']} could not be checked because information was missing. A pass here "
        f"is not a recommendation: it says nothing about whether the posting is still open, "
        f"whether the company sponsors visas, or which level the employer would actually file.",
        "",
        "## Run record",
        "",
        f"- **Generated at:** {now_iso()}",
        f"- **Script:** `{rel(Path(__file__))}`",
        f"- **Input:** `{rel(args.postings)}`",
        f"- **Earliest start (your-input):** {args.earliest_start}",
        f"- **Wage data:** DOL OFLC, SOC {SOC}, wage year {WAGE_YEAR}, hourly × {HOURS_PER_YEAR} "
        f"(convention [verify])",
        "",
        "| Data file | SHA-256 |",
        "|---|---|",
        *[f"| `{d['path']}` | `{d['sha256']}` |" for d in data_files],
        "",
        "## Counts",
        "",
        "| Outcome | Postings |",
        "|---|---|",
        *[f"| {o} | {counts[o]} |" for o in OUTCOMES],
        "",
        "## Postings",
        "",
        "| ID | Company | Title | Location | Start | Salary (annual) | Levels | Floors | Outcome | Reason |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in results:
        i = r["inputs"]
        c = r.get("compared", {})
        band = "/".join(r["band"]["levels"]) if "band" in r else "—"
        floors = (f"{money(c['low_floor_annual'])} / {money(c['high_floor_annual'])}"
                  if c else "—")
        salary = (f"{money(c.get('salary_min_annual'))}–{money(c.get('salary_max_annual'))}"
                  if c else "—")
        location = f"{i['city']}, {i['state']}" + (f" ({r['area']})" if "area" in r else "")
        lines.append(f"| {r['id']} | {r['company'] or '—'} | {r['title'] or '—'} | {location} | "
                     f"{i['start_month'] or '—'} | {salary} | {band} | {floors} | "
                     f"**{r['outcome']}** | {r['reason']} |")
    flagged = [(r["id"], f) for r in results for f in r.get("text_flags", [])]
    lines += ["", "## Text flags", ""]
    if flagged:
        lines += ["| ID | Flag | Matched text (confirm by reading) |", "|---|---|---|"]
        lines += [f"| {pid} | {f['flag']} | …{f['snippet']}… |" for pid, f in flagged]
    else:
        lines.append("None.")
    lines += [
        "",
        "## What this cannot verify",
        "",
        "- **The text flags are pattern matches.** They can miss a paraphrase or misfire on "
        "unrelated wording; the matched text is shown so a person can confirm each one.",
        "- **Which level the employer files.** The level band is a rule chosen by the job seeker; "
        "the employer decides the actual level on the filing.",
        "- **The hourly-to-annual conversion** (× 2,080) is a convention, not read from DOL data.",
        "- **The job code.** Every posting is assumed to be Software Developers (15-1252).",
        "- **The employer type.** Universities and research nonprofits use a lower wage table "
        "that is not extracted; postings are assumed to be from private employers.",
        "- **Liveness and sponsorship.** Whether the posting is still open and whether the "
        "company has sponsored before are checked by other steps, not here.",
        f"- **Future wage years.** The table changes every July 1; an application filed after "
        f"June 30, 2027 is measured against a newer table.",
        "",
    ]
    return lines


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("postings", type=Path)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--earliest-start", default="2027-06")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    args = parser.parse_args()

    if not MONTH.match(args.earliest_start):
        halt(f"--earliest-start must be YYYY-MM, got {args.earliest_start!r}")
    if not args.postings.is_file():
        halt(f"missing input file: {args.postings}")
    try:
        postings = validate(json.loads(args.postings.read_text(encoding="utf-8")))
    except json.JSONDecodeError as err:
        halt(f"input is not valid JSON: {err}")

    paths = {
        "wages": args.data_dir / f"alc-{SOC}-wy{WAGE_YEAR}.csv",
        "cities": args.data_dir / f"city-area-map-wy{WAGE_YEAR}.csv",
        "counties": args.data_dir / f"county-area-map-wy{WAGE_YEAR}.csv",
    }
    rows = {name: read_csv(path) for name, path in paths.items()}
    wages = {r["area"]: r for r in rows["wages"]}
    cities = {(r["city"], r["state"]): r for r in rows["cities"]}
    counties = {(r["state"], r["county"]): r["area"] for r in rows["counties"]}
    data_files = [{"path": rel(p), "sha256": sha256(p)} for p in paths.values()]

    results = [decide(p, args.earliest_start, wages, cities, counties) for p in postings]
    counts = Counter(r["outcome"] for r in results)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    log_out = args.out_dir / "wage-gate-log.json"
    report_out = args.out_dir / "wage-gate-report.md"
    log = {
        "generated_at": now_iso(),
        "script": rel(Path(__file__)),
        "input": rel(args.postings),
        "earliest_start": args.earliest_start,
        "soc": SOC,
        "wage_year": WAGE_YEAR,
        "hours_per_year": HOURS_PER_YEAR,
        "labels": LABELS,
        "data_files": data_files,
        "counts": {o: counts[o] for o in OUTCOMES},
        "results": results,
    }
    log_out.write_text(json.dumps(log, indent=2) + "\n", encoding="utf-8")
    report_out.write_text("\n".join(report_lines(results, counts, args, data_files)),
                          encoding="utf-8")

    print(f"{len(results)} postings: " + ", ".join(f"{o} {counts[o]}" for o in OUTCOMES))
    print(f"Wrote log to {rel(log_out)}")
    print(f"Wrote report to {rel(report_out)}")


if __name__ == "__main__":
    main()
