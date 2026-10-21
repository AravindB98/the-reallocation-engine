#!/usr/bin/env python3
"""Extract DOL OFLC prevailing wages (Levels 1-4) for one SOC code in a target set of areas.

Reads a hand-downloaded OFLC wage-year folder (ALC_Export.csv + Geography.csv) and a
city -> county table, resolves each city to its OFLC wage area(s), and writes a compact
extract, a city -> area map, and an audit. Stdlib only; never touches the network.

Usage:
  python3 -I scripts/oflc/extract-prevailing-wages.py --src ~/Downloads/OFLC_Wages_2026-27

Exit code: 0 on success, 2 if a source file or column is missing, a target county is not
in Geography.csv, or a target area has no wage row (conformance halt, not a report).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = REPO_ROOT / "data" / "oflc"
DEFAULT_CITIES = DEFAULT_OUT_DIR / "city-county-targets.csv"

ALC_FILE = "ALC_Export.csv"
GEO_FILE = "Geography.csv"
ALC_COLUMNS = ["Area", "SocCode", "GeoLvl", "Level1", "Level2", "Level3", "Level4", "Average"]
GEO_COLUMNS = ["Area", "AreaName", "StateAb", "CountyTownName"]
CITY_COLUMNS = ["city", "state", "counties"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def halt(message: str) -> None:
    sys.stderr.write(f"extract-prevailing-wages: {message}\n")
    sys.exit(2)


def read_csv(path: Path, required: list[str]) -> list[dict[str, str]]:
    if not path.is_file():
        halt(f"missing source file: {path.name}")
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [col for col in required if col not in (reader.fieldnames or [])]
        if missing:
            halt(f"{path.name} is missing columns: {', '.join(missing)}")
        return list(reader)


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return path.name


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", type=Path, required=True, help="downloaded OFLC wage-year folder")
    parser.add_argument("--cities", type=Path, default=DEFAULT_CITIES)
    parser.add_argument("--soc", default="15-1252")
    parser.add_argument("--wage-year", default="2026-27")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    if not args.src.is_dir():
        halt(f"--src is not a folder: {args.src.name}")

    alc_path = args.src / ALC_FILE
    geo_path = args.src / GEO_FILE
    alc_rows = read_csv(alc_path, ALC_COLUMNS)
    geo_rows = read_csv(geo_path, GEO_COLUMNS)
    city_rows = read_csv(args.cities, CITY_COLUMNS)

    county_areas: dict[tuple[str, str], set[str]] = {}
    area_names: dict[str, str] = {}
    for row in geo_rows:
        county_areas.setdefault((row["StateAb"], row["CountyTownName"]), set()).add(row["Area"])
        area_names.setdefault(row["Area"], row["AreaName"])

    city_map = []
    missing_counties = []
    for row in city_rows:
        counties = [c.strip() for c in row["counties"].split(";") if c.strip()]
        areas: set[str] = set()
        for county in counties:
            found = county_areas.get((row["state"], county))
            if not found:
                missing_counties.append(f"{county}, {row['state']} (for {row['city']})")
            else:
                areas |= found
        city_map.append({
            "city": row["city"],
            "state": row["state"],
            "counties": ";".join(counties),
            "areas": ";".join(sorted(areas)),
            "status": "ok" if len(areas) == 1 else "split-needs-worksite",
        })
    if missing_counties:
        halt("counties not found in Geography.csv: " + "; ".join(missing_counties))

    target_areas = sorted({a for row in city_map for a in row["areas"].split(";")})
    wages: dict[str, dict[str, str]] = {}
    for row in alc_rows:
        if row["SocCode"] == args.soc and row["Area"] in target_areas:
            if row["Area"] in wages:
                halt(f"duplicate {args.soc} wage rows for area {row['Area']}")
            wages[row["Area"]] = row
    no_wage = [a for a in target_areas if a not in wages]
    if no_wage:
        halt(f"no {args.soc} wage row for areas: {', '.join(no_wage)}")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    tag = f"{args.soc}-wy{args.wage_year}"
    wage_out = args.out_dir / f"alc-{tag}.csv"
    map_out = args.out_dir / f"city-area-map-wy{args.wage_year}.csv"
    audit_out = args.out_dir / "oflc-extract-audit.md"

    with wage_out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["area", "area_name", "soc_code", "geo_lvl",
                         "level1_hr", "level2_hr", "level3_hr", "level4_hr", "average_hr"])
        for area in target_areas:
            w = wages[area]
            writer.writerow([area, area_names[area], w["SocCode"], w["GeoLvl"],
                             w["Level1"], w["Level2"], w["Level3"], w["Level4"], w["Average"]])

    with map_out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["city", "state", "counties", "areas", "status"])
        writer.writeheader()
        writer.writerows(city_map)

    splits = [row for row in city_map if row["status"] != "ok"]
    geo_lvls = Counter(wages[a]["GeoLvl"] for a in target_areas)
    lines = [
        "# OFLC Prevailing-Wage Extract Audit",
        "",
        "## Executive summary",
        "",
        f"This is the audit of a small extract of the U.S. Department of Labor's official H-1B "
        f"prevailing wages for one job code ({args.soc}) in the places the job seeker targets. "
        f"Read it to check that the extract matches the government source before any salary is "
        f"compared against it. It found {len(city_map)} target cities that resolve to "
        f"{len(target_areas)} wage areas, every area has a wage row, and {len(splits)} "
        f"{'city spans' if len(splits) == 1 else 'cities span'} more than one wage area, so "
        f"a posting there needs its exact worksite before any wage can be compared. "
        f"This audit reports what it found; it does not say pass.",
        "",
        "## Run record",
        "",
        f"- **Generated at:** {now_iso()}",
        f"- **Script:** `{rel(Path(__file__))}`",
        f"- **Source folder:** `{args.src.name}` (hand-downloaded; not committed)",
        f"- **SOC code:** {args.soc} · **Wage year:** {args.wage_year}",
        f"- **Wages are hourly**, copied verbatim; no annual conversion is applied here.",
        "",
        "## Inputs and outputs",
        "",
        "| File | Rows | SHA-256 |",
        "|---|---|---|",
        f"| `{args.src.name}/{ALC_FILE}` | {len(alc_rows):,} | `{sha256(alc_path)}` |",
        f"| `{args.src.name}/{GEO_FILE}` | {len(geo_rows):,} | `{sha256(geo_path)}` |",
        f"| `{rel(args.cities)}` (your-input) | {len(city_rows)} | `{sha256(args.cities)}` |",
        f"| `{rel(wage_out)}` | {len(target_areas)} | `{sha256(wage_out)}` |",
        f"| `{rel(map_out)}` | {len(city_map)} | `{sha256(map_out)}` |",
        "",
        "## GeoLvl distribution (target areas)",
        "",
        "| GeoLvl | Areas |",
        "|---|---|",
        *[f"| {lvl} | {n} |" for lvl, n in sorted(geo_lvls.items())],
        "",
        "## Cities that span more than one wage area",
        "",
    ]
    if splits:
        lines += ["| City | Counties | Areas |", "|---|---|---|"]
        lines += [f"| {r['city']}, {r['state']} | {r['counties']} | {r['areas']} |" for r in splits]
    else:
        lines.append("None.")
    lines += [
        "",
        "## Target areas",
        "",
        "| Area | Name | L1 $/hr | L2 $/hr | L3 $/hr | L4 $/hr |",
        "|---|---|---|---|---|---|",
        *[f"| {a} | {area_names[a]} | {wages[a]['Level1']} | {wages[a]['Level2']} | "
          f"{wages[a]['Level3']} | {wages[a]['Level4']} |" for a in target_areas],
        "",
    ]
    audit_out.write_text("\n".join(lines), encoding="utf-8")

    print(f"Wrote {len(target_areas)} areas to {rel(wage_out)}")
    print(f"Wrote {len(city_map)} cities to {rel(map_out)} ({len(splits)} split-needs-worksite)")
    print(f"Wrote audit to {rel(audit_out)}")


if __name__ == "__main__":
    main()
