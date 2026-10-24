#!/usr/bin/env python3
"""trim_local_wage.py — trim the raw BLS OEWS metro file and BEA RPP file into
the three compact CSVs that scripts/bls/local-wage-adjustment.py reads
(--oews / --rpp / --crosswalk), for a fixed list of metros and SOC codes.

Stdlib only (zipfile + xml.etree): the raw OEWS file is .xlsx and the repo has
no openpyxl. Run with `python -I` and pass every path as an argument; the raw
archives are untrusted downloads and are opened read-only.

Rules (the local-wage-adjustment recipe's data contract):
  - cell values are copied as TEXT; suppression tokens (*, **, #) stay as-is,
    never turned into 0 or a neighbour's value;
  - the crosswalk is exact code equality AREA == GeoFIPS, no name matching;
  - nothing is interpolated and no national value is copied into a metro row.

Also writes national_oews_candidates.csv (same SOC list) from the national
file so the resolver can show p10/p25/median/p75 next to each candidate.

  python -I tools/trim_local_wage.py --msa-zip RAW/oesm24ma.zip --rpp-zip RAW/MARPP.zip \
      --national-xlsx data/bls/oesm24nat/national_M2024_dl.xlsx \
      --areas 42660,12420,41860,41940,19100,24020 --socs 13-1082,... --out-dir DIR

Prints one JSON summary line on stdout (row counts, sha256 of every input).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
OEWS_KEEP = ["AREA", "AREA_TITLE", "AREA_TYPE", "PRIM_STATE", "OCC_CODE", "OCC_TITLE", "O_GROUP",
             "TOT_EMP", "A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"]
NATIONAL_KEEP = ["OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", "A_MEAN",
                 "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def col_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def cell_text(raw: str | None) -> str:
    """Numbers come back as their XML text; integral floats lose the '.0'."""
    if raw is None:
        return ""
    if re.fullmatch(r"-?\d+\.0+", raw):
        return raw.split(".")[0]
    return raw


def iter_xlsx_rows(xlsx_bytes: bytes):
    zf = zipfile.ZipFile(io.BytesIO(xlsx_bytes))
    shared: list[str] = []
    if "xl/sharedStrings.xml" in zf.namelist():
        for _, el in ET.iterparse(zf.open("xl/sharedStrings.xml")):
            if el.tag == NS + "si":
                shared.append("".join(t.text or "" for t in el.iter(NS + "t")))
                el.clear()
    sheet = sorted(n for n in zf.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n))[0]
    for _, el in ET.iterparse(zf.open(sheet)):
        if el.tag != NS + "row":
            continue
        cells: dict[int, str] = {}
        for c in el.iter(NS + "c"):
            t = c.get("t")
            if t == "inlineStr":
                val = "".join(x.text or "" for x in c.iter(NS + "t"))
            else:
                v = c.find(NS + "v")
                val = None if v is None else v.text
                if t == "s" and val is not None:
                    val = shared[int(val)]
                else:
                    val = cell_text(val)
            cells[col_index(c.get("r"))] = (val or "").strip()
        el.clear()
        if cells:
            width = max(cells) + 1
            yield [cells.get(i, "") for i in range(width)]


def read_xlsx_member(zip_path: Path, suffix: str) -> tuple[str, bytes]:
    zf = zipfile.ZipFile(zip_path)
    hits = [n for n in zf.namelist() if n.endswith(suffix)]
    if len(hits) != 1:
        sys.exit(f"expected exactly one member ending {suffix!r} in {zip_path}, found {hits}")
    return hits[0], zf.read(hits[0])


def project(rows, keep, want):
    header = next(rows)
    ix = {h.upper(): i for i, h in enumerate(header)}
    missing = [k for k in keep if k not in ix]
    if missing:
        sys.exit(f"source lacks columns {missing}; header was {header}")
    out = []
    for r in rows:
        rec = {k: (r[ix[k]] if ix[k] < len(r) else "") for k in keep}
        if want(rec):
            out.append(rec)
    return out


def write_csv(path: Path, fields, rows) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--msa-zip", required=True)
    ap.add_argument("--rpp-zip", required=True)
    ap.add_argument("--national-xlsx", required=True)
    ap.add_argument("--areas", required=True, help="comma list of 5-digit BLS AREA codes")
    ap.add_argument("--socs", required=True, help="comma list of 6-digit SOC codes (NN-NNNN)")
    ap.add_argument("--out-dir", required=True)
    a = ap.parse_args()

    areas = [s.strip() for s in a.areas.split(",") if s.strip()]
    socs = [s.strip() for s in a.socs.split(",") if s.strip()]
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    msa_zip, rpp_zip, nat_xlsx = Path(a.msa_zip), Path(a.rpp_zip), Path(a.national_xlsx)

    # metro OEWS
    member, data = read_xlsx_member(msa_zip, "MSA_M2024_dl.xlsx")
    metro = project(iter_xlsx_rows(data), OEWS_KEEP,
                    lambda r: r["AREA"].zfill(5) in areas and r["OCC_CODE"] in socs)
    for r in metro:
        r["AREA"] = r["AREA"].zfill(5)
    metro.sort(key=lambda r: (areas.index(r["AREA"]), socs.index(r["OCC_CODE"]), r["O_GROUP"]))
    write_csv(out / "metro_oews.csv", OEWS_KEEP, metro)

    # national OEWS (cross-industry, all-ownership rows only)
    nat_rows = iter_xlsx_rows(nat_xlsx.read_bytes())
    header = next(nat_rows)
    ix = {h.upper(): i for i, h in enumerate(header)}
    national = []
    for r in nat_rows:
        get = lambda k: r[ix[k]] if k in ix and ix[k] < len(r) else ""
        if get("OCC_CODE") in socs and get("NAICS") in ("000000", "0") and get("OWN_CODE") in ("1235", ""):
            national.append({k: get(k) for k in NATIONAL_KEEP})
    national.sort(key=lambda r: (socs.index(r["OCC_CODE"]), r["O_GROUP"]))
    write_csv(out / "national_oews_candidates.csv", NATIONAL_KEEP, national)

    # BEA RPP, all items (LineCode 1), 2024
    text = zipfile.ZipFile(rpp_zip).read("MARPP_MSA_2008_2024.csv").decode("latin-1")
    rpp = []
    for row in csv.reader(io.StringIO(text)):
        if len(row) < 9 or row[0] == "GeoFIPS" or row[4].strip() != "1":
            continue
        fips = row[0].strip().strip('"')
        if fips in areas:
            rpp.append({"GeoFIPS": fips, "GeoName": row[1].strip(), "rpp_all_items_2024": row[-1].strip()})
    write_csv(out / "bea_rpp.csv", ["GeoFIPS", "GeoName", "rpp_all_items_2024"], rpp)

    # exact-code crosswalk
    bea_codes = {r["GeoFIPS"] for r in rpp}
    titles = {}
    for r in metro:
        titles.setdefault(r["AREA"], r["AREA_TITLE"])
    xwalk = [{"AREA": c, "AREA_TITLE": titles[c], "GeoFIPS": c} for c in areas if c in titles and c in bea_codes]
    write_csv(out / "bls_bea_msa_crosswalk.csv", ["AREA", "AREA_TITLE", "GeoFIPS"], xwalk)

    print(json.dumps({
        "inputs": {
            "msa_zip": {"path": str(msa_zip), "member": member, "bytes": msa_zip.stat().st_size, "sha256": sha256(msa_zip)},
            "rpp_zip": {"path": str(rpp_zip), "member": "MARPP_MSA_2008_2024.csv", "bytes": rpp_zip.stat().st_size, "sha256": sha256(rpp_zip)},
            "national_xlsx": {"path": str(nat_xlsx), "bytes": nat_xlsx.stat().st_size, "sha256": sha256(nat_xlsx)},
        },
        "areas_requested": areas,
        "areas_found_in_oews": sorted(titles),
        "areas_in_crosswalk": [r["AREA"] for r in xwalk],
        "socs_requested": socs,
        "rows": {"metro_oews": len(metro), "national_oews_candidates": len(national), "bea_rpp": len(rpp), "crosswalk": len(xwalk)},
    }, indent=2))


if __name__ == "__main__":
    main()
