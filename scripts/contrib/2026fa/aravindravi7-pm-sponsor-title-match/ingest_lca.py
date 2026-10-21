#!/usr/bin/env python3
"""ingest_lca.py — DOL OFLC LCA disclosure file → compact, contact-free extract of
product- and program-manager H-1B filings (closes the recipe's DATA SOURCE TODO).

The DOL file is a public record, but it is large and dol.gov refuses scripted
downloads, so a person downloads it in a browser. This script never touches the
network. It:

  1. records the file's SHA-256 and size on first use and refuses a different
     file later (trust-on-first-use, like scripts/fetch/ and data/checksums.lock);
  2. checks the header for every column it reads (schema drift halts the run);
  3. streams the rows and keeps H-1B rows whose JOB_TITLE matches a NARROW
     prefilter (it cannot match "Programmer" / "Programmer Analyst"); the precise
     product / program / ambiguous decision stays in the one JS classifier
     (pm-sponsor-triage.mjs classifyTitle);
  4. writes only non-contact columns: no POC, attorney, preparer, address,
     phone or email fields ever leave the raw file;
  5. writes an audit (rows in, kept, rejects by reason, statuses, date range,
     top employers, checksum, source).

  .venv/bin/python scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/ingest_lca.py \\
      --xlsx ../dol-raw/LCA_Disclosure_Data_FY2026_Q3.xlsx --downloaded-by "Name" --downloaded-on YYYY-MM-DD

Needs openpyxl (pinned in requirements.txt; install into the repo's gitignored .venv).
Exit: 0 ok · 2 usage/input error · 3 checksum mismatch · 4 schema drift.
"""

import argparse
import csv
import datetime as dt
import hashlib
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "data", "lca")
SOURCE_PAGE = "https://www.dol.gov/agencies/eta/foreign-labor/performance"

# Every column this script reads. If any is missing from the header, the run halts.
REQUIRED = [
    "CASE_NUMBER", "CASE_STATUS", "DECISION_DATE", "VISA_CLASS", "JOB_TITLE", "SOC_CODE", "SOC_TITLE",
    "FULL_TIME_POSITION", "BEGIN_DATE", "EMPLOYER_NAME",
    "TOTAL_WORKER_POSITIONS", "NEW_EMPLOYMENT", "CONTINUED_EMPLOYMENT", "CHANGE_PREVIOUS_EMPLOYMENT",
    "NEW_CONCURRENT_EMPLOYMENT", "CHANGE_EMPLOYER", "AMENDED_PETITION",
    "WORKSITE_CITY", "WORKSITE_STATE",
    "WAGE_RATE_OF_PAY_FROM", "WAGE_RATE_OF_PAY_TO", "WAGE_UNIT_OF_PAY", "PREVAILING_WAGE", "PW_UNIT_OF_PAY", "PW_WAGE_LEVEL",
]
# Written to the extract (REQUIRED plus derived columns). Nothing personal: the employer is a business,
# worksite is city/state only.
OUT_COLUMNS = REQUIRED + ["WAGE_FROM_ANNUAL", "PREVAILING_WAGE_ANNUAL", "_provenance"]
# Columns that must never be written, whatever the header contains (checked by the tests).
FORBIDDEN = re.compile(r"(PHONE|EMAIL|POC|ATTORNEY|AGENT|LAWFIRM|PREPARER|ADDRESS|POSTAL|FEIN)", re.I)

# Narrow prefilter: a superset of the JS classifier's product / program / ambiguous-PM patterns.
# "program\s+manag" needs the word "program" followed by "manag…", so "Programmer" never matches.
PREFILTER = re.compile(r"product\s+(manag|own|lead)|program\s+manag|\b[AT]?PM\b", re.I)
ABBREVIATED = re.compile(r"\b(product|program)\s+mgr\b", re.I)  # counted, not kept: a known gap

# CASE_STATUS: the layout PDF spells "Certified-Withdrawn"; the file says "Certified - Withdrawn".
# Status strings are compared with whitespace around the hyphen ignored; anything else is "unrecognized".
KNOWN_STATUSES = ["Certified", "Certified - Withdrawn", "Withdrawn", "Denied"]


def canon_status(s):
    return re.sub(r"\s*-\s*", " - ", str(s or "").strip())


ANNUAL = {"year": 1, "hour": 2080, "week": 52, "bi-weekly": 26, "biweekly": 26, "month": 12}


class IngestError(Exception):
    def __init__(self, msg, code=2):
        super().__init__(msg)
        self.code = code


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def check_lock(lock_path, name, digest, size):
    """Trust on first use: record name/sha256/size once; any later mismatch is a hard failure."""
    pins = {}
    if os.path.exists(lock_path):
        for line in open(lock_path, encoding="utf-8"):
            parts = line.split()
            if len(parts) == 3:
                pins[parts[0]] = (parts[1], int(parts[2]))
    if name in pins:
        want_sum, want_size = pins[name]
        if (digest, size) != (want_sum, want_size):
            raise IngestError(f"CHECKSUM MISMATCH for {name}: got {digest} ({size} bytes), pinned {want_sum} ({want_size} bytes) — refusing", 3)
        return "verified against pin"
    os.makedirs(os.path.dirname(lock_path), exist_ok=True)
    with open(lock_path, "a", encoding="utf-8") as f:
        f.write(f"{name} {digest} {size}\n")
    return "first use — pinned"


def check_header(header):
    missing = [c for c in REQUIRED if c not in header]
    if missing:
        raise IngestError(f"LCA schema drift: missing column(s) {', '.join(missing)}", 4)
    return {c: header.index(c) for c in REQUIRED}


def keep_reason(visa_class, job_title):
    """Return None to keep the row, or the reject reason."""
    if str(visa_class or "").strip() != "H-1B":
        return "not-h1b"
    if not PREFILTER.search(str(job_title or "")):
        return "abbreviated-title-mgr" if ABBREVIATED.search(str(job_title or "")) else "not-pm-family-title"
    return None


def to_text(v):
    if v is None:
        return ""
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def annualize(amount, unit):
    try:
        a = float(str(amount).replace(",", "").replace("$", ""))
    except (TypeError, ValueError):
        return ""
    k = ANNUAL.get(str(unit or "").strip().lower())
    return "" if k is None else str(round(a * k, 2))


def project(row, idx):
    out = {c: to_text(row[i]) for c, i in idx.items()}
    out["WAGE_FROM_ANNUAL"] = annualize(out["WAGE_RATE_OF_PAY_FROM"], out["WAGE_UNIT_OF_PAY"])
    out["PREVAILING_WAGE_ANNUAL"] = annualize(out["PREVAILING_WAGE"], out["PW_UNIT_OF_PAY"])
    out["_provenance"] = "record"
    return out


def ingest(rows, header, writer, stats):
    """rows: iterable of tuples (after the header). Pure apart from writer/stats."""
    idx = check_header(list(header))
    for row in rows:
        stats["rows_in"] += 1
        visa, title = row[idx["VISA_CLASS"]], row[idx["JOB_TITLE"]]
        stats["visa_class"][to_text(visa) or "(blank)"] += 1
        raw_status = to_text(row[idx["CASE_STATUS"]])
        stats["status_all_raw"][raw_status or "(blank)"] += 1
        if canon_status(raw_status) not in KNOWN_STATUSES:
            stats["unrecognized_status"] += 1
        reason = keep_reason(visa, title)
        if reason:
            stats["rejects"][reason] += 1
            continue
        rec = project(row, idx)
        writer.writerow(rec)
        stats["kept"] += 1
        stats["status"][rec["CASE_STATUS"] or "(blank)"] += 1
        stats["employers"][rec["EMPLOYER_NAME"]] += 1
        d = rec["DECISION_DATE"]
        if d:
            stats["min_date"] = min(stats["min_date"] or d, d)
            stats["max_date"] = max(stats["max_date"] or d, d)


def new_stats():
    return {"rows_in": 0, "kept": 0, "status_all_raw": Counter(), "unrecognized_status": 0, "visa_class": Counter(), "rejects": Counter(), "status": Counter(),
            "employers": Counter(), "min_date": None, "max_date": None}


def write_audit(path, stats, meta):
    top = stats["employers"].most_common(15)
    lines = [
        f"# LCA PM-family filings extract — audit ({meta['file']})", "",
        "## Executive summary", "",
        f"This audit describes one public Department of Labor file of labor condition applications (the filing an employer makes before an H-1B petition) and the small extract taken from it. "
        f"Of {stats['rows_in']:,} applications in the file, {stats['kept']:,} are H-1B applications for product- or program-manager-type titles and were kept, without any contact details. "
        "A certified application is **not** a visa approval, so this extract shows which employers *filed* for these titles, not who was hired.", "",
        "## Provenance", "",
        f"- Source page: {SOURCE_PAGE}",
        f"- File: `{meta['file']}` · {meta['size']:,} bytes · sha256 `{meta['sha256']}` ({meta['lock']})",
        f"- Downloaded by: {meta['downloaded_by']} on {meta['downloaded_on']} (browser; dol.gov refuses scripted downloads)",
        f"- Ingested: {meta['ingested_at']} by `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/ingest_lca.py`",
        f"- Extract: `{meta['out_csv']}` · {meta['out_bytes']:,} bytes", "",
        "## Counts", "",
        "| Measure | Count |", "|---|---|",
        f"| Rows in the file | {stats['rows_in']:,} |",
        f"| Rows kept (H-1B, PM-family prefilter) | {stats['kept']:,} |",
    ]
    for k, v in sorted(stats["rejects"].items()):
        lines.append(f"| Rejected: {k} | {v:,} |")
    lines += ["", "Rejected `abbreviated-title-mgr` rows (e.g. \"Product Mgr\") are counted but **not kept**: the JS title classifier doesn't read \"Mgr\" either, so they are a known, counted gap.", "",
              "### Visa class (all rows)", "", "| Visa class | Rows |", "|---|---|"]
    lines += [f"| {k} | {v:,} |" for k, v in stats["visa_class"].most_common()]
    lines += ["", "### Case status — every observed string (all rows, exactly as written in the file)", "",
              "Compared with whitespace around the hyphen ignored against " + ", ".join(f'"{k}"' for k in KNOWN_STATUSES) + ".", "",
              "| Status string as filed | Rows | Recognized as |", "|---|---|---|"]
    lines += [f"| `{k}` | {v:,} | {canon_status(k) if canon_status(k) in KNOWN_STATUSES else '**unrecognized**'} |" for k, v in stats["status_all_raw"].most_common()]
    lines += ["", f"Unrecognized status rows: **{stats['unrecognized_status']:,}**.",
              "", "### Case status (kept rows)", "", "| Status | Rows |", "|---|---|"]
    lines += [f"| {k} | {v:,} |" for k, v in stats["status"].most_common()]
    lines += ["", f"Decision dates in the kept rows: {stats['min_date']} to {stats['max_date']}.", "",
              "### Top employers in the extract", "", "| Employer (as filed) | Kept rows |", "|---|---|"]
    lines += [f"| {k} | {v:,} |" for k, v in top]
    if meta.get("layout_notes"):
        lines += ["", "## Layout PDF checked against the real header row", "", meta["layout_check"], ""]
        lines += [f"- {n}" for n in meta["layout_notes"]]
    lines += ["", "## Columns written", "", ", ".join(f"`{c}`" for c in OUT_COLUMNS), "",
              "No POC, attorney, agent, preparer, address, phone or email column is ever written; the tests enforce it.", "",
              "*This audit reports what the ingest found. It does not say pass; a named human reads it and records that in the run log.*"]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--downloaded-by", required=True)
    ap.add_argument("--downloaded-on", required=True)
    ap.add_argument("--out-dir", default=OUT_DIR)
    ap.add_argument("--layout-note", action="append", default=[], help="a recorded discrepancy between the layout PDF and the file (repeatable)")
    ap.add_argument("--layout-check", default="", help="who checked the layout PDF against the header row, how, and when")
    a = ap.parse_args(argv)
    try:
        if not os.path.isfile(a.xlsx):
            raise IngestError(f"no such file: {a.xlsx}")
        dt.date.fromisoformat(a.downloaded_on)
        name = os.path.basename(a.xlsx)
        size = os.path.getsize(a.xlsx)
        print(f"hashing {name} ({size:,} bytes)…", file=sys.stderr)
        digest = sha256_file(a.xlsx)
        lock = check_lock(os.path.join(a.out_dir, "lca.checksums.lock"), name, digest, size)
        print(f"sha256 {digest} — {lock}", file=sys.stderr)
        try:
            from openpyxl import load_workbook
        except ImportError:
            raise IngestError("openpyxl is not installed: .venv/bin/pip install -r scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/requirements.txt")
        wb = load_workbook(a.xlsx, read_only=True, data_only=True)
        ws = wb.worksheets[0]
        it = ws.iter_rows(values_only=True)
        header = [to_text(h) for h in next(it)]
        stem = re.sub(r"\.xlsx$", "", name, flags=re.I)
        tag = re.search(r"FY\d{4}_Q\d", stem)
        base = f"lca-pm-filings-{tag.group(0).lower() if tag else stem.lower()}"
        os.makedirs(a.out_dir, exist_ok=True)
        out_csv = os.path.join(a.out_dir, base + ".csv")
        stats = new_stats()

        def progress(rows):
            for r in rows:
                if stats["rows_in"] and stats["rows_in"] % 100000 == 0:
                    print(f"  … {stats['rows_in']:,} rows, {stats['kept']:,} kept", file=sys.stderr)
                yield r

        with open(out_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=OUT_COLUMNS, lineterminator="\n")
            w.writeheader()
            ingest(progress(it), header, w, stats)
        wb.close()
        # Pin the extract too, so a hand-edited extract is detectable by the triage script.
        ext_lock = check_lock(os.path.join(a.out_dir, "lca.checksums.lock"), base + ".csv", sha256_file(out_csv), os.path.getsize(out_csv))
        print(f"extract {base}.csv — {ext_lock}", file=sys.stderr)
        meta = {"file": name, "size": size, "sha256": digest, "lock": lock, "downloaded_by": a.downloaded_by,
                "downloaded_on": a.downloaded_on, "ingested_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "out_csv": os.path.relpath(out_csv, os.path.join(HERE, "../../../..")), "out_bytes": os.path.getsize(out_csv),
                "layout_notes": a.layout_note, "layout_check": a.layout_check}
        write_audit(os.path.join(a.out_dir, base + "-audit.md"), stats, meta)
        print(f"✓ {stats['rows_in']:,} rows in → {stats['kept']:,} kept → {meta['out_csv']} ({meta['out_bytes']:,} bytes)")
        print(f"  rejects: {dict(stats['rejects'])}")
        print(f"  status strings (all rows): {dict(stats['status_all_raw'])} · unrecognized: {stats['unrecognized_status']}")
        if stats["unrecognized_status"]:
            print("✗ unrecognized CASE_STATUS values present — stop and show the student before anything is committed", file=sys.stderr)
            return 5
        print(f"  audit: {os.path.relpath(os.path.join(a.out_dir, base + '-audit.md'))}")
        return 0
    except IngestError as e:
        print(f"✗ {e}", file=sys.stderr)
        return e.code


if __name__ == "__main__":
    sys.exit(main())
