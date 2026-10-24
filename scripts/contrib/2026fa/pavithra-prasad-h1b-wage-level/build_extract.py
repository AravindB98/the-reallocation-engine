#!/usr/bin/env python3
"""Build the committed OFLC extract from DOL's OFLC_Wages_2026-27.zip.

The zip (12.7 MB) is not committed. Download it from
https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip, then run from the repo root:

    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/build_extract.py --zip <path to the zip>

It refuses to run if the zip's SHA-256 differs from the one recorded here, keeps only the rows this
mode uses (SOC 15-1252 and 15-1253 in five metro areas), and writes data/extract-manifest.json with
the SHA-256 of every input member and output file, so wage_level.py can refuse a changed extract.
"""
import argparse
import csv
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
SOURCE_URL = "https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip"
ZIP_SHA256 = "edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f"
WAGE_YEAR = {"start": "2026-07-01", "end": "2027-06-30"}
AREAS = ["14460", "35620", "41860", "41940", "42660"]
SOCS = ["15-1252", "15-1253"]  # 15-1253 is kept only to show how the employer's SOC choice moves the level


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def rows(zf, member):
    raw = zf.read(member)
    return raw, list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))


def write_csv(path, fields, records):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=fields, lineterminator="\n")
    w.writeheader()
    w.writerows(records)
    path.write_text(buf.getvalue())
    return sha256(buf.getvalue().encode())


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--zip", required=True)
    a = ap.parse_args(argv)
    blob = Path(a.zip).read_bytes()
    got = sha256(blob)
    if got != ZIP_SHA256:
        sys.exit(f"refusing: zip SHA-256 is {got}, expected {ZIP_SHA256} (not the file this extract was built from)")
    zf = zipfile.ZipFile(io.BytesIO(blob))
    alc_raw, alc = rows(zf, "ALC_Export.csv")
    geo_raw, geo = rows(zf, "Geography.csv")
    names = {}
    for g in geo:
        names.setdefault(g["Area"], g["AreaName"])
    wages = [dict(r, AreaName=names[r["Area"]]) for r in alc if r["Area"] in AREAS and r["SocCode"] in SOCS]
    wages.sort(key=lambda r: (r["Area"], r["SocCode"]))
    counties = sorted(({k: g[k] for k in ("Area", "AreaName", "StateAb", "CountyTownName")} for g in geo if g["Area"] in AREAS),
                      key=lambda r: (r["Area"], r["StateAb"], r["CountyTownName"]))
    if len(wages) != len(AREAS) * len(SOCS):
        sys.exit(f"refusing: expected {len(AREAS) * len(SOCS)} wage rows, found {len(wages)}")
    DATA.mkdir(exist_ok=True)
    out_w = write_csv(DATA / "oflc-alc-2026-27-extract.csv",
                      ["Area", "AreaName", "SocCode", "GeoLvl", "Level1", "Level2", "Level3", "Level4"],
                      [{k: r[k] for k in ("Area", "AreaName", "SocCode", "GeoLvl", "Level1", "Level2", "Level3", "Level4")} for r in wages])
    out_g = write_csv(DATA / "oflc-geography-extract.csv", ["Area", "AreaName", "StateAb", "CountyTownName"], counties)
    manifest = {
        "source_url": SOURCE_URL,
        "source_zip_sha256": ZIP_SHA256,
        "source_members_sha256": {"ALC_Export.csv": sha256(alc_raw), "Geography.csv": sha256(geo_raw)},
        "source_rows": {"ALC_Export.csv": len(alc), "Geography.csv": len(geo)},
        "wage_year": WAGE_YEAR,
        "areas": AREAS,
        "socs": SOCS,
        "outputs": {
            "oflc-alc-2026-27-extract.csv": {"sha256": out_w, "rows": len(wages)},
            "oflc-geography-extract.csv": {"sha256": out_g, "rows": len(counties)},
        },
        "units": "Level1-Level4 are hourly wages as published by OFLC; wage_level.py annualizes them at 2080 hours",
    }
    (DATA / "extract-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {len(wages)} wage rows and {len(counties)} county rows; zip SHA-256 ok")


if __name__ == "__main__":
    main()
