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
PREFILTER = re.compile(r"product\s+(manag|mgr|mgmt|own|lead)|program\s+(manag|mgr|mgmt)|\b[AT]?PM\b", re.I)
# The first-run prefilter, kept only to measure what the Mgr/Mgmt fix recovered.
PREFILTER_V1 = re.compile(r"product\s+(manag|own|lead)|program\s+manag|\b[AT]?PM\b", re.I)

# Same normalization as normalizeName() in pm-sponsor-triage.mjs (parity is tested).
SUFFIX = {"INC", "INCORPORATED", "LLC", "CORP", "CORPORATION", "CO", "COMPANY", "LTD", "LIMITED", "PBC", "LP", "LLP", "PLC"}


def normalize_name(name):
    toks = re.sub(r"[^A-Z0-9 ]+", " ", str(name or "").upper().replace("&", " AND ")).split()
    while len(toks) > 1 and toks[-1] in SUFFIX:
        toks.pop()
    return " ".join(toks)


def is_empty_row(row):
    return all(v is None or (isinstance(v, str) and not v.strip()) for v in row)

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
        return "not-pm-family-title"
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


def suffix_of(name):
    toks = re.sub(r"[^A-Z0-9 ]+", " ", str(name or "").upper().replace("&", " AND ")).split()
    tail = []
    while len(toks) > 1 and toks[-1] in SUFFIX:
        tail.insert(0, toks.pop())
    return " ".join(tail)


def ingest(rows, header, writer, stats, watch=None):
    """rows: iterable of tuples (after the header). Pure apart from writer/stats."""
    idx = check_header(list(header))
    watch = {normalize_name(w): w for w in (watch or [])}
    for row in rows:
        if is_empty_row(row):
            stats["empty_rows"] += 1  # formatted-but-empty spreadsheet rows: not filings
            continue
        stats["rows_in"] += 1
        visa, title = row[idx["VISA_CLASS"]], row[idx["JOB_TITLE"]]
        stats["visa_class"][to_text(visa) or "(blank)"] += 1
        raw_status = to_text(row[idx["CASE_STATUS"]])
        stats["status_all_raw"][raw_status or "(blank)"] += 1
        if canon_status(raw_status) not in KNOWN_STATUSES:
            stats["unrecognized_status"] += 1
        reason = keep_reason(visa, title)
        if str(visa or "").strip() == "H-1B":
            # Employer index: every H-1B employer, all titles, so "no PM rows" can be told apart from "not in the file".
            name = to_text(row[idx["EMPLOYER_NAME"]])
            e = stats["index"].setdefault(normalize_name(name), {"suffixes": set(), "h1b_rows": 0, "pm_rows": 0})
            e["h1b_rows"] += 1
            if suffix_of(name):
                e["suffixes"].add(suffix_of(name))
            if reason is None:
                e["pm_rows"] += 1
        if reason:
            stats["rejects"][reason] += 1
            continue
        rec = project(row, idx)
        writer.writerow(rec)
        stats["kept"] += 1
        stats["status"][rec["CASE_STATUS"] or "(blank)"] += 1
        stats["employers"][rec["EMPLOYER_NAME"]] += 1
        abbrev_only = not PREFILTER_V1.search(rec["JOB_TITLE"])
        if abbrev_only:
            stats["recovered_by_abbrev"] += 1
        k = normalize_name(rec["EMPLOYER_NAME"])
        if k in watch:
            w = stats["watch"].setdefault(watch[k], {"rows": 0, "abbrev_only_rows": 0, "names": set()})
            w["rows"] += 1; w["abbrev_only_rows"] += abbrev_only; w["names"].add(rec["EMPLOYER_NAME"])
        d = rec["DECISION_DATE"]
        if d:
            stats["min_date"] = min(stats["min_date"] or d, d)
            stats["max_date"] = max(stats["max_date"] or d, d)


def new_stats():
    return {"rows_in": 0, "empty_rows": 0, "index": {}, "recovered_by_abbrev": 0, "watch": {}, "kept": 0, "status_all_raw": Counter(), "unrecognized_status": 0, "visa_class": Counter(), "rejects": Counter(), "status": Counter(),
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
        f"- Extract: `{meta['out_csv']}` · {meta['out_bytes']:,} bytes",
        f"- Employer index: `{meta['index_csv']}` · {meta['index_bytes']:,} bytes · {meta['index_employers']:,} H-1B employers (normalized), {meta['index_with_pm']:,} with PM-family rows, {meta['index_multi_suffix']:,} filed under more than one legal suffix (these HOLD in triage)",
        *([f"- Extract re-pinned with --repin-extract: superseded sha256 `{meta['repinned_from']}` (extract changed before its first commit)"] if meta.get("repinned_from") else []), "",
        "## Counts", "",
        "| Measure | Count |", "|---|---|",
        f"| Filing rows in the file | {stats['rows_in']:,} |",
        f"| Empty spreadsheet rows (skipped; not filings) | {stats['empty_rows']:,} |",
        f"| Rows kept (H-1B, PM-family prefilter) | {stats['kept']:,} |",
    ]
    for k, v in sorted(stats["rejects"].items()):
        lines.append(f"| Rejected: {k} | {v:,} |")
    lines += ["", f"Recovered by the Mgr/Mgmt abbreviation fix (kept now, missed by the first-run prefilter): **{stats['recovered_by_abbrev']:,}** rows.", ""]
    if meta.get("watch_list"):
        lines += ["### Shortlist employers: PM rows only under abbreviated titles?", "",
                  "Prefilter-level counts (the triage classifier decides product vs program). \"Only abbreviated\" means the employer would have looked like a confirmed absence before the fix.", "",
                  "| Employer (watched as) | Kept rows | Of which only Mgr/Mgmt forms | PM rows only under abbreviated titles? | Names as filed |", "|---|---|---|---|---|"]
        for w in meta["watch_list"]:
            e = stats["watch"].get(w)
            if not e:
                lines.append(f"| {w} | 0 | 0 | no kept rows (exact-name match) | — |")
            else:
                only = e["rows"] > 0 and e["abbrev_only_rows"] == e["rows"]
                lines.append(f"| {w} | {e['rows']:,} | {e['abbrev_only_rows']:,} | {'**yes**' if only else 'no'} | {'; '.join(sorted(e['names']))} |")
        lines.append("")
    lines += [
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
    ap.add_argument("--watch-employer", action="append", default=[], help="employer name to report in the audit (repeatable)")
    ap.add_argument("--repin-extract", action="store_true", help="replace the extract's checksum pin (only before the extract is first committed); recorded in the audit")
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
            ingest(progress(it), header, w, stats, a.watch_employer)
        wb.close()
        # Employer index (contact-free: normalized name, legal-suffix forms, counts).
        idx_csv = os.path.join(a.out_dir, base.replace("lca-pm-filings-", "lca-employer-index-") + ".csv")
        with open(idx_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, lineterminator="\n")
            w.writerow(["EMPLOYER_KEY", "LEGAL_SUFFIXES", "H1B_ROWS", "PM_PREFILTER_ROWS", "_provenance"])
            for k in sorted(stats["index"]):
                e = stats["index"][k]
                w.writerow([k, "|".join(sorted(e["suffixes"])), e["h1b_rows"], e["pm_rows"], "record"])
        idx_lock = check_lock(os.path.join(a.out_dir, "lca.checksums.lock"), os.path.basename(idx_csv), sha256_file(idx_csv), os.path.getsize(idx_csv))
        print(f"employer index {os.path.basename(idx_csv)} — {idx_lock}", file=sys.stderr)
        # Pin the extract too, so a hand-edited extract is detectable by the triage script.
        lock_path = os.path.join(a.out_dir, "lca.checksums.lock")
        repinned = None
        if a.repin_extract and os.path.exists(lock_path):
            keep, old = [], None
            for line in open(lock_path, encoding="utf-8"):
                if line.split()[:1] == [base + ".csv"]:
                    old = line.split()[1]
                else:
                    keep.append(line)
            open(lock_path, "w", encoding="utf-8").writelines(keep)
            repinned = old
        ext_lock = check_lock(os.path.join(a.out_dir, "lca.checksums.lock"), base + ".csv", sha256_file(out_csv), os.path.getsize(out_csv))
        print(f"extract {base}.csv — {ext_lock}", file=sys.stderr)
        meta = {"file": name, "size": size, "sha256": digest, "lock": lock, "downloaded_by": a.downloaded_by,
                "downloaded_on": a.downloaded_on, "ingested_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "out_csv": os.path.relpath(out_csv, os.path.join(HERE, "../../../..")), "out_bytes": os.path.getsize(out_csv),
                "layout_notes": a.layout_note, "layout_check": a.layout_check, "watch_list": a.watch_employer,
                "repinned_from": repinned, "index_csv": os.path.relpath(idx_csv, os.path.join(HERE, "../../../..")),
                "index_bytes": os.path.getsize(idx_csv), "index_employers": len(stats["index"]),
                "index_with_pm": sum(1 for e in stats["index"].values() if e["pm_rows"]),
                "index_multi_suffix": sum(1 for e in stats["index"].values() if len(e["suffixes"]) > 1)}
        write_audit(os.path.join(a.out_dir, base + "-audit.md"), stats, meta)
        print(f"  employer index: {meta['index_csv']} ({meta['index_bytes']:,} bytes, {meta['index_employers']:,} employers, {meta['index_multi_suffix']:,} multi-suffix)")
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
