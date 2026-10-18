#!/usr/bin/env python3
"""salary_floor.py — co-op -> full-time salary floor for software roles (SOC 15-1252 / 15-1254).

For an F-1 master's student weighing a co-op that may convert to a full-time
offer: before the salary conversation, what is a realistic floor, and does this
employer's own sponsored-salary record sit above or below it?

Reads only two committed repo files and the input JSON you pass:

  data/bls/oesm24nat/national_M2024_dl.xlsx      BLS OEWS May 2024, national
  data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv

and writes:

  <out>/run-log.json   agent-facing log (every value labeled + its source)
  <out>/report.md      person-facing report

Every value carries a label: record | model-judgment | your-input.
National only: data/bls/local-wage/ is not in the repo, so there is no Boston
number and this script never pretends there is one. No network calls.

  python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py \
      [--input <targets.json>] [--out-dir <dir>]
"""

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))

DEFAULT_INPUT = os.path.join(HERE, "inputs", "sample-targets.json")
DEFAULT_OUT = os.path.join(REPO, "course", "2026fa", "submissions", "arundhatik26", "mode-salary-floor", "runs", "sample")
OEWS_XLSX = "data/bls/oesm24nat/national_M2024_dl.xlsx"
SPONSOR_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
LOCAL_WAGE_DIR = "data/bls/local-wage"

REC, MODEL, YOU = "record", "model-judgment", "your-input"

PERCENTILES = ("A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90")
SUPPRESSED = {"*", "**", "#", ""}
ALLOWED_SOC = {"15-1252", "15-1254"}

# Titles that O*NET lists under Web Developers (15-1254), not Software
# Developers (15-1252). An offer with one of these may be filed under the
# lower code. This flags the risk; it does not decide the code.
WEB_CODE_TITLE = re.compile(r"web|front[\s-]?end|back[\s-]?end", re.I)

# Legal-form words dropped before exact matching. Nothing else is fuzzy:
# "STATE STREET" must NOT match "1601 STATE STREET HOTEL INVESTORS LP".
SUFFIXES = {"INC", "CORP", "CORPORATION", "LLC", "CO", "LTD", "THE", "LP",
            "PBC", "COMPANY", "INCORPORATED", "PLC"}


class InputError(Exception):
    """A named failure: stop, say why, invent nothing."""


def labeled(value, source, **prov):
    out = {"value": value, "source": source}
    out.update(prov)
    return out


def norm_name(s):
    s = re.sub(r"[^A-Z0-9 ]", " ", (s or "").upper())
    return " ".join(w for w in s.split() if w not in SUFFIXES)


def to_float(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# --- BLS national OEWS (xlsx read with the stdlib; no pandas in this repo) ---

_NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _cell(c, shared):
    v = c.find("m:v", _NS)
    if v is None:
        t = c.find("m:is/m:t", _NS)
        return t.text if t is not None else ""
    return shared[int(v.text)] if c.get("t") == "s" else v.text


def load_oews(path, socs):
    """Return {soc: {OCC_TITLE, O_GROUP, A_PCT10..A_PCT90}} for the requested codes."""
    with zipfile.ZipFile(path) as z:
        shared = ["".join(t.text or "" for t in si.iter("{%s}t" % _NS["m"]))
                  for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", _NS)]
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml")).find("m:sheetData", _NS)
    out, hdr = {}, None
    for row in sheet:
        vals = [_cell(c, shared) for c in row]
        if hdr is None:
            hdr = vals
            missing = {"OCC_CODE", "O_GROUP", *PERCENTILES} - set(hdr)
            if missing:
                raise InputError(f"{path}: expected columns missing: {sorted(missing)}")
            continue
        d = dict(zip(hdr, vals))
        if d.get("OCC_CODE") in socs and d.get("O_GROUP") == "detailed":
            out[d["OCC_CODE"]] = {k: d.get(k, "") for k in ("OCC_TITLE", "O_GROUP", *PERCENTILES)}
    return out


def soc_band(oews, soc):
    row = oews.get(soc)
    if row is None:
        raise InputError(f"SOC {soc} has no detailed row in {OEWS_XLSX}")
    band = {}
    for p in PERCENTILES:
        raw = (row.get(p) or "").strip()
        band[p] = None if raw in SUPPRESSED else to_float(raw)
    return row["OCC_TITLE"], band


# --- 80 Days sponsor record -------------------------------------------------

def load_sponsors(path):
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        rows = list(csv.DictReader(f))
    index = {}
    for i, r in enumerate(rows, start=2):  # line 1 is the header
        index.setdefault(norm_name(r.get("company_name")), []).append((i, r))
    return rows, index


def resolve_company(query, rows, index):
    """Exact (normalized) name match only. Returns a dict with status:
    matched | blank-record | not-in-dataset | ambiguous."""
    key = norm_name(query)
    hits = index.get(key, [])
    near = [r["company_name"] for r in rows
            if key and key in norm_name(r.get("company_name")) and norm_name(r.get("company_name")) != key][:3]
    if not hits:
        return {"status": "not-in-dataset", "near_misses_not_used": near}
    if len(hits) > 1:
        return {"status": "ambiguous", "rows": [i for i, _ in hits], "near_misses_not_used": near}
    line, r = hits[0]
    approvals = to_float(r.get("Total Approvals"))
    median = to_float(r.get("median_salary_offered"))
    base = {"csv_line": line, "company_name": r["company_name"],
            "city": r.get("city") or r.get("City") or "", "near_misses_not_used": near}
    if not approvals or median is None:
        return {"status": "blank-record", **base}
    return {"status": "matched", **base,
            "total_approvals": approvals, "median_salary_offered": median,
            "top_job_titles_sponsored": r.get("top_job_titles_sponsored", "")}


# --- the floor ---------------------------------------------------------------

def floor_for(target, oews, rules):
    """National floor for the claimed SOC, plus the 15-1254 band when the
    title could be filed under Web Developers."""
    soc = target["soc"]
    pct = rules["floor_percentile"]
    title, band = soc_band(oews, soc)
    floor = band[pct]
    if floor is None:
        raise InputError(f"{target['company']}: BLS {pct} for {soc} is suppressed — no floor")
    out = {"soc": labeled(soc, YOU, note="the code you believe the offer will be filed under"),
           "soc_title": labeled(title, REC, file=OEWS_XLSX),
           "band": labeled(band, REC, file=OEWS_XLSX, scope="national, May 2024, all experience levels"),
           "floor": labeled(floor, MODEL, rule=f"{pct} of the claimed SOC (percentile chosen by you)"),
           "code_risk": None}
    if soc == "15-1252" and WEB_CODE_TITLE.search(target.get("offer_title", "")):
        _, web = soc_band(oews, "15-1254")
        out["code_risk"] = labeled(
            {"alt_soc": "15-1254", "alt_floor": web[pct], "gap": floor - web[pct], "alt_band": web}, MODEL,
            why="title matches an O*NET Web Developers alternate title; employer may file the lower code")
    return out


def compare(company, floor):
    if company["status"] != "matched":
        return labeled("NO COMPANY NUMBER", MODEL,
                       why=f"80 Days: {company['status']} — floor is BLS only; ask in the offer conversation")
    med = company["median_salary_offered"]
    if med >= floor:
        verdict = "COMPANY RECORD ABOVE FLOOR"
    else:
        verdict = "COMPANY RECORD BELOW FLOOR"
    return labeled(verdict, MODEL, company_median=med, floor=floor, diff=med - floor,
                   caveat="company median covers ALL its sponsored roles, not software only")


# --- run ---------------------------------------------------------------------

def validate_input(cfg):
    if not isinstance(cfg.get("targets"), list) or not cfg["targets"]:
        raise InputError("input has no targets")
    pct = cfg.get("rules", {}).get("floor_percentile")
    if pct not in PERCENTILES:
        raise InputError(f"rules.floor_percentile must be one of {PERCENTILES}, got {pct!r}")
    if cfg.get("rules", {}).get("want_local_metro"):
        if not os.path.isdir(os.path.join(REPO, LOCAL_WAGE_DIR)):
            raise InputError(f"local metro wage requested but {LOCAL_WAGE_DIR}/ is not in the repo — "
                             "refusing to substitute the national figure")
    for t in cfg["targets"]:
        if t.get("soc") not in ALLOWED_SOC:
            raise InputError(f"{t.get('company')}: soc must be one of {sorted(ALLOWED_SOC)}, got {t.get('soc')!r}")
        if not t.get("dataset_name"):
            raise InputError(f"{t.get('company')}: dataset_name missing (exact 80 Days name to look up)")


def run(cfg, out_dir):
    validate_input(cfg)
    oews_path = os.path.join(REPO, OEWS_XLSX)
    csv_path = os.path.join(REPO, SPONSOR_CSV)
    oews = load_oews(oews_path, ALLOWED_SOC)
    rows, index = load_sponsors(csv_path)
    results = []
    for t in cfg["targets"]:
        fl = floor_for(t, oews, cfg["rules"])
        co = resolve_company(t["dataset_name"], rows, index)
        if co["status"] == "ambiguous":
            verdict = labeled("STOP: AMBIGUOUS NAME", MODEL, why=f"rows {co['rows']} — a human picks one")
        else:
            verdict = compare(co, fl["floor"]["value"])
        results.append({"company": labeled(t["company"], YOU),
                        "offer_title": labeled(t.get("offer_title", ""), YOU),
                        "dataset_name": labeled(t["dataset_name"], YOU),
                        "eighty_days": labeled(co, REC, file=SPONSOR_CSV),
                        **fl, "verdict": verdict})
    log = {"recipe": "arundhatik26-salary-floor-swe-15-1252", "recipe_version": "0.1.0",
           "run_date": date.today().isoformat(), "persona": cfg.get("persona"),
           "rules": labeled(cfg["rules"], YOU),
           "sources": {OEWS_XLSX: sha256(oews_path), SPONSOR_CSV: sha256(csv_path)},
           "local_metro": labeled("missing", REC, why=f"{LOCAL_WAGE_DIR}/ not in repo; national only"),
           "results": results}
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "run-log.json"), "w") as f:
        json.dump(log, f, indent=2)
    with open(os.path.join(out_dir, "report.md"), "w") as f:
        f.write(render_report(log))
    return log


def money(x):
    return "—" if x is None else f"${x:,.0f}"


def render_report(log):
    pct = log["rules"]["value"]["floor_percentile"]
    o = ["# Salary floor — software co-op to full-time", "",
         "## Executive summary", "",
         f"National BLS floor = **{pct}** of the SOC code you expect the offer to be filed under, "
         "compared with each employer's 80 Days sponsored-salary median. "
         "National only: no Boston number exists in this repo. "
         "The company median covers all of its sponsored roles, not software only.", "",
         f"Run {log['run_date']} · persona: {log['persona']}", "",
         "| Company | Offer title | SOC | Floor | 80 Days record | Company median | Verdict | Code risk |",
         "|---|---|---|---|---|---|---|---|"]
    for r in log["results"]:
        co = r["eighty_days"]["value"]
        risk = r["code_risk"]["value"] if r["code_risk"] else None
        risk_s = f"may be filed 15-1254 → floor {money(risk['alt_floor'])} (−{money(risk['gap'])})" if risk else "—"
        o.append(f"| {r['company']['value']} | {r['offer_title']['value']} | {r['soc']['value']} | "
                 f"{money(r['floor']['value'])} | {co['status']}"
                 f"{' (line ' + str(co['csv_line']) + ')' if co.get('csv_line') else ''} | "
                 f"{money(co.get('median_salary_offered'))} | **{r['verdict']['value']}** | {risk_s} |")
    o += ["", "## BLS bands used (national, May 2024)", "", "| SOC | 10th | 25th | median | 75th | 90th |",
          "|---|---|---|---|---|---|"]
    bands = {}
    for r in log["results"]:
        bands.setdefault(f"{r['soc']['value']} {r['soc_title']['value']}", r["band"]["value"])
        if r["code_risk"]:
            bands.setdefault("15-1254 Web Developers (code-risk comparison)", r["code_risk"]["value"]["alt_band"])
    for name, b in bands.items():
        o.append(f"| {name} | " + " | ".join(money(b[p]) for p in PERCENTILES) + " |")
    near = [(r["company"]["value"], r["eighty_days"]["value"]["near_misses_not_used"])
            for r in log["results"] if r["eighty_days"]["value"].get("near_misses_not_used")]
    if near:
        o += ["", "## Similar names found but NOT used (exact match only)", ""]
        o += [f"- {c}: {', '.join(n)}" for c, n in near]
    o += ["", "## What this cannot tell you", "",
          "- Boston pay: `data/bls/local-wage/` is not in the repo.",
          "- H-1B prevailing-wage level (DOL OFLC) for this job: not in the repo.",
          "- What this employer pays *software* hires specifically, or new grads specifically.",
          "- Co-op hourly pay: BLS does not survey students.", ""]
    return "\n".join(o)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--input", default=DEFAULT_INPUT)
    ap.add_argument("--out-dir", default=DEFAULT_OUT)
    a = ap.parse_args(argv)
    try:
        with open(a.input) as f:
            cfg = json.load(f)
        log = run(cfg, a.out_dir)
    except (InputError, OSError, json.JSONDecodeError) as e:
        print(f"✗ stopped: {e}", file=sys.stderr)
        return 2
    for r in log["results"]:
        print(f"{r['company']['value']:<14} floor {money(r['floor']['value']):>9}  "
              f"{r['eighty_days']['value']['status']:<15} {r['verdict']['value']}")
    print(f"✓ wrote {os.path.relpath(a.out_dir, REPO)}/run-log.json and report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
