#!/usr/bin/env python3
"""Ingest the two public datasets the cap-exempt triage resolver reads.

This is the only file in this contribution that touches the network
(SNICKERDOODLE P2). Each subcommand downloads one source into data/raw/
(gitignored), records its SHA-256, writes a compact extract into
data/extracts/ (committed), appends a provenance line to data/PROVENANCE.md,
and writes an audit (rows in, rows out, why) beside the extract.

  ipeds   NCES IPEDS Institutional Characteristics directory (HD2024)
  uscis   USCIS H-1B Employer Data Hub, fiscal year 2023 (latest CSV published)
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
RAW = DATA / "raw"
EXTRACTS = DATA / "extracts"
PROVENANCE = DATA / "PROVENANCE.md"

SOURCES = {
    "ipeds": {
        "url": "https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip",
        "raw": "HD2024.zip",
        "extract": "ipeds_hd2024.csv",
        "audit": "ipeds-audit.md",
        "title": "NCES IPEDS HD2024 (institutional characteristics directory)",
    },
    "uscis": {
        "url": "https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv",
        "raw": "h1b_datahubexport-2023.csv",
        "extract": "uscis_h1b_hub_fy2023.csv",
        "audit": "uscis-audit.md",
        "title": "USCIS H-1B Employer Data Hub, FY2023",
    },
}

IPEDS_KEEP = ["UNITID", "INSTNM", "IALIAS", "CITY", "STABBR", "EIN", "CONTROL", "SECTOR", "CYACTIVE", "CLOSEDAT"]
USCIS_EXPECTED = ["Fiscal Year", "Employer", "Initial Approval", "Initial Denial", "Continuing Approval",
                  "Continuing Denial", "NAICS", "Tax ID", "State", "City", "ZIP"]


def sha256_bytes(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def download(url: str, dest: Path) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (reallocation-engine ingest)"})
    with urllib.request.urlopen(request, timeout=120) as response:
        blob = response.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(blob)
    return blob


def append_provenance(key: str, raw_sha: str, extract_path: Path, rows_in: int, rows_out: int, today: str):
    src = SOURCES[key]
    if not PROVENANCE.exists():
        PROVENANCE.write_text(
            "# Data provenance — cap-exempt triage\n\n"
            "## Executive summary\n\n"
            "This file records where each dataset in this folder came from, when it was downloaded, and the "
            "fingerprint (SHA-256) of the exact file, so anyone can check the data was not changed. The raw "
            "downloads are not committed; the compact extracts are. Re-run `ingest.py` to rebuild them.\n\n"
            "## Sources\n\n"
            "| Source | URL | Downloaded | Raw SHA-256 | Extract | Extract SHA-256 | Rows in → out |\n"
            "|---|---|---|---|---|---|---|\n"
        )
    extract_sha = sha256_bytes(extract_path.read_bytes())
    # Re-ingesting replaces this source's row instead of adding a duplicate.
    kept = [line for line in PROVENANCE.read_text().splitlines(keepends=True) if not line.startswith(f"| {src['title']} |")]
    PROVENANCE.write_text("".join(kept))
    with PROVENANCE.open("a") as handle:
        handle.write(f"| {src['title']} | {src['url']} | {today} | `{raw_sha}` | "
                     f"`extracts/{extract_path.name}` | `{extract_sha}` | {rows_in:,} → {rows_out:,} |\n")


def ingest_ipeds(today: str) -> dict:
    src = SOURCES["ipeds"]
    blob = download(src["url"], RAW / src["raw"])
    archive = zipfile.ZipFile(io.BytesIO(blob))
    name = next(n for n in archive.namelist() if n.lower().endswith(".csv"))
    payload = archive.read(name)
    try:
        decoded = payload.decode("utf-8-sig")
    except UnicodeDecodeError:  # older IPEDS releases are latin-1
        decoded = payload.decode("latin-1").lstrip("ï»¿")
    reader = csv.DictReader(io.StringIO(decoded, newline=""))
    reader.fieldnames = [f.lstrip("﻿").strip() for f in reader.fieldnames]
    missing = [c for c in IPEDS_KEEP if c not in reader.fieldnames]
    if missing:
        sys.exit(f"IPEDS columns changed upstream; missing {missing}. Nothing written.")
    rows = list(reader)
    out = EXTRACTS / src["extract"]
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=IPEDS_KEEP)
        writer.writeheader()
        for r in rows:
            writer.writerow({c: r[c].strip() for c in IPEDS_KEEP})
    control = {"1": 0, "2": 0, "3": 0, "other": 0}
    for r in rows:
        control[r["CONTROL"].strip() if r["CONTROL"].strip() in ("1", "2", "3") else "other"] += 1
    active = sum(1 for r in rows if r["CYACTIVE"].strip() == "1")
    no_ein = sum(1 for r in rows if not r["EIN"].strip() or r["EIN"].strip().startswith("-"))
    raw_sha = sha256_bytes(blob)
    append_provenance("ipeds", raw_sha, out, len(rows), len(rows), today)
    (EXTRACTS / src["audit"]).write_text("\n".join([
        "# IPEDS HD2024 extract — audit",
        "",
        "## Executive summary",
        "",
        "This audit describes the federal list of U.S. colleges and universities that the triage tool now reads "
        "to check whether an employer is a listed institution and whether it is public, nonprofit or for-profit. "
        f"Every one of the {len(rows):,} institutions in the source file was kept; only columns were dropped. "
        f"{control['3']:,} are private for-profit, which matters because for-profit colleges do not meet the "
        "higher-education definition that cap exemption relies on. This audit reports counts; it does not say pass or fail.",
        "",
        "## Run record",
        "",
        f"- Source: {src['url']} (file `{name}` inside the zip) · downloaded {today}",
        f"- Raw SHA-256: `{raw_sha}`",
        f"- Extract: `extracts/{src['extract']}` · columns {', '.join(IPEDS_KEEP)}",
        "",
        "## Counts",
        "",
        "| Measure | Count |",
        "|---|---:|",
        f"| Rows in source | {len(rows):,} |",
        f"| Rows in extract | {len(rows):,} |",
        f"| CONTROL 1 public | {control['1']:,} |",
        f"| CONTROL 2 private nonprofit | {control['2']:,} |",
        f"| CONTROL 3 private for-profit | {control['3']:,} |",
        f"| CONTROL other / not reported | {control['other']:,} |",
        f"| Active in current year (CYACTIVE = 1) | {active:,} |",
        f"| No usable EIN | {no_ein:,} |",
        "",
        "## What this extract cannot say",
        "",
        "- Being listed in IPEDS is not the same as meeting HEA §101(a) (accreditation and other conditions apply). "
        "A match is a supporting record, not proof.",
        "- Nothing about affiliated nonprofits or research organizations — only institutions themselves.",
        "",
    ]))
    return {"rows": len(rows), "sha": raw_sha, "control": control}


def ingest_uscis(today: str) -> dict:
    src = SOURCES["uscis"]
    blob = download(src["url"], RAW / src["raw"])
    text = blob.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    header = [h.strip() for h in reader.fieldnames]
    if header != USCIS_EXPECTED:
        sys.exit(f"USCIS columns changed upstream: {header}. Nothing written.")
    rows = list(reader)
    out = EXTRACTS / src["extract"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(text.encode("utf-8"))  # unfiltered: no selection bias

    def n(v):
        try:
            return int(str(v).replace(",", "").strip() or 0)
        except ValueError:
            return 0

    blank_employer = sum(1 for r in rows if not r["Employer"].strip())
    naics = {}
    for r in rows:
        naics[r["NAICS"].strip() or "blank"] = naics.get(r["NAICS"].strip() or "blank", 0) + 1
    edu = [r for r in rows if r["NAICS"].strip() == "61"]
    raw_sha = sha256_bytes(blob)
    append_provenance("uscis", raw_sha, out, len(rows), len(rows), today)
    (EXTRACTS / src["audit"]).write_text("\n".join([
        "# USCIS H-1B Employer Data Hub FY2023 — audit",
        "",
        "## Executive summary",
        "",
        "This audit describes the government's employer-level H-1B petition counts that the triage tool now reads. "
        "It is the only public source here that covers universities and research nonprofits, which the engine's "
        f"startup-funding dataset cannot see. The file has {len(rows):,} employer rows for fiscal year 2023 and was "
        f"kept whole; {len(edu):,} rows carry the education industry code (61). The data counts petitions; it does "
        "not say whether a petition was cap-exempt. This audit reports counts; it does not say pass or fail.",
        "",
        "## Run record",
        "",
        f"- Source: {src['url']} · downloaded {today}",
        f"- Raw SHA-256: `{raw_sha}` ("
        + ("extract is byte-identical to the raw file" if sha256_bytes(out.read_bytes()) == raw_sha
           else "extract is the same rows re-encoded as UTF-8 without a byte-order mark") + ")",
        f"- Extract: `extracts/{src['extract']}` · columns {', '.join(USCIS_EXPECTED)}",
        "",
        "## Counts",
        "",
        "| Measure | Count |",
        "|---|---:|",
        f"| Rows in source / extract | {len(rows):,} |",
        f"| Rows with blank employer name | {blank_employer:,} |",
        f"| Rows with NAICS 61 (educational services) | {len(edu):,} |",
        f"| Rows with NAICS 54 (professional, scientific, technical) | {naics.get('54', 0):,} |",
        f"| Rows with NAICS 62 (health care) | {naics.get('62', 0):,} |",
        f"| Sum of initial approvals, NAICS 61 rows | {sum(n(r['Initial Approval']) for r in edu):,} |",
        f"| Sum of continuing approvals, NAICS 61 rows | {sum(n(r['Continuing Approval']) for r in edu):,} |",
        "",
        "## What this extract cannot say",
        "",
        "- Whether any petition was cap-exempt or cap-subject; which occupation it was for; or anything after FY2023.",
        "- NAICS is 2-digit only (61, 54, 62…), so colleges cannot be separated from other education employers, "
        "or research labs from consulting firms, by code alone.",
        "- Tax ID is only the last four EIN digits; it narrows a name match but cannot make one.",
        "- One employer can appear under several spellings; the tool matches exact normalized names only.",
        "",
    ]))
    return {"rows": len(rows), "sha": raw_sha, "naics61": len(edu)}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("source", choices=sorted(SOURCES) + ["all"])
    parser.add_argument("--date", default=dt.date.today().isoformat(), help="download date recorded in provenance")
    args = parser.parse_args(argv)
    keys = sorted(SOURCES) if args.source == "all" else [args.source]
    for key in keys:
        result = {"ipeds": ingest_ipeds, "uscis": ingest_uscis}[key](args.date)
        print(f"{key}: {result}")
    print(f"provenance: {PROVENANCE.relative_to(HERE)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
