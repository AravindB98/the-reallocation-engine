#!/usr/bin/env python3
"""msis-pm-wage-level — where does a posted PM salary land in the wage-weighted H-1B lottery?

Two subcommands, standard library only (no pandas, no openpyxl):

  extract  raw OFLC wage-year files (fetch-oflc.sh) → a small committed CSV for the
           metros and SOC codes this mode uses, plus a provenance JSON.
  run      scenarios (live postings with a posted pay range) × candidate SOC codes →
           OFLC wage level met, lottery entries, gap to the next level, a national-OEWS
           proxy bracket under the current and the proposed DOL level rules, the
           employer's 80 Days sponsorship record, and the occupation's Cognitive Pivot
           score. Writes out/run-log.json (agent) and out/report.md (person).

This script never touches the network (fetch-oflc.sh is the only ingest step) and
never prints a selection probability: no data in the repo supports one.

Exit codes: 0 = written; 2 = a run-level gate or input check failed, nothing written.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
RECIPE = "recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md"
VERSION = "0.1.0"

DEFAULT_EXTRACT = HERE / "data" / "oflc-2026-27-pm-extract.csv"
DEFAULT_NATIONAL = REPO / "data" / "bls" / "oesm24nat" / "national_M2024_dl.xlsx"
DEFAULT_COMPACT = REPO / "data" / "bls" / "compact" / "soc_occupation_compact.csv"
DEFAULT_80DAYS = REPO / "data" / "80-days-to-stay" / "80-days-csv" / "mapped_student_employment_targets_v3.csv"

HOURS_PER_YEAR = 2080          # OFLC's hourly → annual convention
OEWS_TOP_CODE = 239200         # "#" in OEWS / "High Wage" in OFLC: ≥ $115.00/hr
LEVELS = ["I", "II", "III", "IV"]
ENTRIES = {"I": 1, "II": 2, "III": 3, "IV": 4}   # DHS weighted-selection final rule, eff. 2026-02-27

# Approximate percentile at which each level sits. These describe DOL's method in
# words; they are not data. OFLC's real Level I is the mean of the lower third, not
# exactly the 17th percentile, which is why the area level comes from the OFLC file and
# this mapping is used only for the national proxy bracket.
REGIMES = {
    "current-2005": {"I": 17, "II": 34, "III": 50, "IV": 67},
    "proposed-2026-nprm": {"I": 34, "II": 52, "III": 70, "IV": 88},
}
NATIONAL_PCTS = [10, 25, 50, 75, 90]

RULE_CHECK_MAX_AGE_DAYS = 30


class GateStop(Exception):
    """A run-level gate failed: write nothing, exit 2."""


def named(v) -> bool:
    """A gate signer must look like a name or handle: ≥ 3 non-space characters including a letter."""
    return isinstance(v, str) and len(v.strip()) >= 3 and any(ch.isalpha() for ch in v)


# ───────────────────────── readers ─────────────────────────

def read_extract(path: Path) -> dict:
    rows = {}
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows[(r["area"], r["soc"])] = r
    return rows


def _col_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_national_xlsx(path: Path, socs: set[str]) -> dict:
    """Return {soc: {title, pct: {10: (value|None, topcoded), ...}}} from the national OEWS workbook."""
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", ns):
                shared.append("".join(t.text or "" for t in si.iter("{%s}t" % ns["m"])))
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))

    def cell_value(c):
        v = c.find("m:v", ns)
        if v is None:
            t = c.find(".//m:t", ns)
            return t.text if t is not None else None
        return shared[int(v.text)] if c.get("t") == "s" else v.text

    header, out = None, {}
    for row in sheet.find("m:sheetData", ns).findall("m:row", ns):
        vals = {}
        for c in row.findall("m:c", ns):
            vals[_col_index(c.get("r"))] = cell_value(c)
        if header is None:
            header = {v: k for k, v in vals.items()}
            continue
        soc = vals.get(header["OCC_CODE"])
        if soc not in socs or vals.get(header["O_GROUP"]) not in ("detailed", "broad"):
            continue
        pct = {}
        for p, col in zip(NATIONAL_PCTS, ["A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"]):
            raw = vals.get(header[col])
            if raw == "#":
                pct[p] = (None, True)
            elif raw in (None, "", "*", "**"):
                pct[p] = (None, False)
            else:
                pct[p] = (float(raw), False)
        out[soc] = {"title": vals.get(header["OCC_TITLE"]), "pct": pct}
    return out


def read_compact(path: Path, socs: set[str]) -> dict:
    out = {}
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["bls_soc_code"] in socs and r["onet_soc_code"].endswith(".00"):
                score = r.get("cognitive_pivot_score") or None
                out[r["bls_soc_code"]] = {
                    "title": r["title"],
                    "cognitive_pivot_score": float(score) if score else None,
                    "job_zone": r.get("job_zone") or None,
                }
    return out


def read_80days(path: Path, names: set[str]) -> dict:
    out = {}
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        for r in csv.DictReader(f):
            if r["company_name"] in names:
                out[r["company_name"]] = r
    return out


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def rel(path) -> str:
    """Repo-relative path when inside the repo, absolute otherwise (never raises)."""
    p = Path(path).resolve()
    try:
        return str(p.relative_to(REPO))
    except ValueError:
        return str(p)


def check_inputs(args) -> str:
    """Input conformance: every file exists and the OFLC extract matches its provenance hash.
    Returns the verified extract sha256. Raise GateStop (nothing written) otherwise."""
    for name in ("extract", "national", "compact", "eighty_days"):
        if not Path(getattr(args, name)).is_file():
            raise GateStop(f"input: {name} file not found: {getattr(args, name)}")
    prov_path = Path(args.extract).with_suffix(".provenance.json")
    try:
        prov = json.loads(prov_path.read_text())
    except (OSError, json.JSONDecodeError) as e:
        raise GateStop(f"input: OFLC extract has no readable provenance file ({prov_path.name}): {e}")
    lock = HERE / "checksums.lock"
    if lock.is_file() and prov.get("zip_sha256"):
        pins = dict(line.split() for line in lock.read_text().splitlines() if line.strip())
        zip_name = Path(prov.get("origin", "")).name
        if pins.get(zip_name) != prov["zip_sha256"]:
            raise GateStop(f"input: provenance zip sha256 for {zip_name} does not match checksums.lock")
    got = sha256(Path(args.extract))
    if got != prov.get("extract_sha256"):
        raise GateStop(f"input: OFLC extract sha256 {got[:16]}… does not match its provenance "
                       f"{str(prov.get('extract_sha256'))[:16]}… — the extract was edited after extraction")
    return got


# ───────────────────────── pure logic (tested) ─────────────────────────

def oflc_annual_levels(row: dict) -> dict:
    """OFLC row → {"status": "leveled"|"refuse", "levels": {I..IV: annual}, "reason"}."""
    label = (row.get("label") or "").strip()
    if label in ("High Wage", "No Leveled Wage"):
        return {"status": "refuse", "levels": None,
                "reason": f"OFLC label '{label}': no Level I–IV wages are published for this area and SOC"}
    raw = [row.get(f"level{i}") for i in range(1, 5)]
    if any(v in (None, "") for v in raw):
        return {"status": "refuse", "levels": None, "reason": "OFLC row has an empty level wage"}
    factor = 1 if label == "Annual Wage" else HOURS_PER_YEAR
    return {"status": "leveled",
            "levels": {lv: round(float(v) * factor, 2) for lv, v in zip(LEVELS, raw)},
            "reason": None}


def level_met(salary: float, levels: dict) -> str:
    """Highest level whose wage the salary equals or exceeds; 'below-I' if none."""
    met = "below-I"
    for lv in LEVELS:
        if salary >= levels[lv]:
            met = lv
    return met


def next_level_gap(salary: float, levels: dict):
    for lv in LEVELS:
        if salary < levels[lv]:
            return {"next_level": lv, "needs": levels[lv], "gap": round(levels[lv] - salary, 2)}
    return None


def _known(salary: float, pct: dict, t: int):
    """Is salary ≥ (wage at percentile t)? True / False / None (cannot tell from P10..P90)."""
    for k in NATIONAL_PCTS:                      # salary ≥ P_k with k ≥ t  ⇒ salary ≥ P_t
        v, top = pct[k]
        if k >= t and v is not None and salary >= v:
            return True
    for k in NATIONAL_PCTS:                      # salary < P_k with k ≤ t  ⇒ salary < P_t
        v, top = pct[k]
        if k <= t and ((v is not None and salary < v) or (top and salary < OEWS_TOP_CODE)):
            return False
    return None


def proxy_bracket(salary: float, pct: dict, regime: dict) -> dict:
    """Bracket the level using only published percentiles — no interpolation."""
    lo, hi = "below-I", "below-I"
    for lv in LEVELS:
        k = _known(salary, pct, regime[lv])
        if k is True:
            lo = lv
        if k is not False:
            hi = lv
    return {"min": lo, "max": hi, "exact": lo == hi}


def lottery_seasons(opt_end: date, run_date: date) -> list:
    """March registration seasons after run_date whose April 1 petition filing still falls
    inside OPT/STEM OPT. The March/April timing is your-input (USCIS sets dates each year)."""
    seasons = []
    for y in range(run_date.year, opt_end.year + 1):
        reg = date(y, 3, 1)
        if reg > run_date and date(y, 4, 1) <= opt_end:
            seasons.append({"registration_march": y, "fiscal_year": f"FY{y + 1}"})
    return seasons


def add_months(d: date, months: int) -> date:
    y, m = divmod(d.month - 1 + months, 12)
    y, m = d.year + y, m + 1
    days = [31, 29 if y % 4 == 0 and (y % 100 or y % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return date(y, m, min(d.day, days[m - 1]))


# ───────────────────────── gates ─────────────────────────

def check_run_gates(persona: dict, rule_check: dict, run_date: date) -> dict:
    """Run-level gates. Raise GateStop (nothing written) on failure."""
    try:
        start = date.fromisoformat(persona["opt_start"]["value"])
    except (KeyError, TypeError, ValueError):
        raise GateStop("timeline: persona.opt_start.value missing or not YYYY-MM-DD")
    months = int(persona.get("opt_months", 12)) + int(persona.get("stem_extension_months", 24))
    opt_end = add_months(start, months)
    seasons = lottery_seasons(opt_end, run_date)
    if not seasons:
        raise GateStop(f"timeline: no H-1B registration season left before OPT/STEM OPT ends {opt_end}")

    for k in ("regime_in_force", "checked_on", "checked_by", "how"):
        v = rule_check.get(k)
        if not (v.strip() if isinstance(v, str) else v):
            raise GateStop(f"rule-check: '{k}' missing — a named person must check which DOL level rule is in force")
    if not named(rule_check["checked_by"]):
        raise GateStop(f"rule-check: checked_by {rule_check['checked_by']!r} does not name a person")
    if rule_check["regime_in_force"] not in REGIMES:
        raise GateStop(f"rule-check: unknown regime '{rule_check['regime_in_force']}'")
    if rule_check["regime_in_force"] != "current-2005":
        raise GateStop("rule-check: the OFLC 2026-27 file encodes the current levels only; "
                       "a run under a newer rule needs a newer OFLC file")
    try:
        checked = date.fromisoformat(rule_check["checked_on"])
    except (TypeError, ValueError):
        raise GateStop(f"rule-check: checked_on {rule_check['checked_on']!r} is not YYYY-MM-DD")
    age = (run_date - checked).days
    if age < 0 or age > RULE_CHECK_MAX_AGE_DAYS:
        raise GateStop(f"rule-check: checked {age} days before the run (must be 0–{RULE_CHECK_MAX_AGE_DAYS})")
    return {"opt_start": start.isoformat(), "opt_end": opt_end.isoformat(), "seasons": seasons}


def check_soc_gate(scen: dict, extract: dict) -> list:
    """Gate S: a named person signed the SOC list, and every code exists in the extract."""
    cand = scen.get("soc_candidates") or {}
    socs = cand.get("codes") or []
    if not socs:
        raise GateStop("soc-set: soc_candidates.codes is missing or empty")
    if not named(cand.get("set_by")):
        raise GateStop("soc-set: soc_candidates.set_by is empty or not a name — a named person must sign the SOC list")
    known = {soc for (_, soc) in extract}
    missing = [s for s in socs if s not in known]
    if missing:
        raise GateStop(f"soc-set: code(s) not in the OFLC extract: {', '.join(missing)} — re-run extract with them")
    return socs


def liveness_evidence_ok(lv: dict, url: str) -> str | None:
    """Gate L evidence: a saved `npm run ats:liveness` capture inside the repo, timestamped on
    `checked_on`, whose output marks this exact posting URL active. Returns a failure reason or None."""
    ev = lv.get("evidence")
    if not ev:
        return "no liveness evidence file named"
    path = (REPO / ev).resolve()
    try:
        path.relative_to(REPO)
    except ValueError:
        return f"liveness evidence {ev} is outside the repository"
    if not path.is_file():
        return f"liveness evidence file not found: {ev}"
    text = path.read_text(encoding="utf-8", errors="replace")
    if f"# run at {lv.get('checked_on')}" not in text:
        return f"liveness evidence {ev} has no capture timestamp on {lv.get('checked_on')}"
    if not re.search(r"✅ active\s+" + re.escape(url) + r"\s*$", text, re.M):
        return f"liveness evidence {ev} does not show '✅ active' for {url}"
    return None


def scenario_gate(sc: dict, run_date: date, areas: set | None = None) -> tuple[str | None, str | None]:
    """Per-scenario gates → (route, reason) if the scenario must not be leveled, else (None, None)."""
    lv = sc.get("liveness") or {}
    if lv.get("status") != "active":
        return "stop-liveness", f"posting liveness is '{lv.get('status')}' (only 'active' passes; uncertain counts as closed)"
    if lv.get("checked_on") != run_date.isoformat():
        return "stop-liveness", (f"liveness was checked on {lv.get('checked_on')}, not on the run date "
                                 f"{run_date.isoformat()}; re-run ats:liveness")
    bad = liveness_evidence_ok(lv, sc.get("posting_url", ""))
    if bad:
        return "stop-liveness", bad
    pay = sc.get("pay") or {}
    if not named(pay.get("basis_confirmed_by")):
        return "stop-pay-basis", "nobody (by name) has confirmed whether the posted range is base salary"
    if pay.get("basis") != "base":
        return "stop-pay-basis", (f"posted range is '{pay.get('basis')}', not base salary; the wage level is "
                                  "judged on base wage, so this range cannot be leveled — ask for the base component")
    try:
        lo, hi = float(pay["low"]), float(pay["high"])
    except (KeyError, TypeError, ValueError):
        return "stop-pay-range", f"pay range is not two numbers: low={pay.get('low')!r}, high={pay.get('high')!r}"
    if not 0 < lo <= hi:
        return "stop-pay-range", f"pay range must satisfy 0 < low ≤ high (got {lo:,.0f}–{hi:,.0f})"
    area = (sc.get("worksite") or {}).get("oflc_area")
    if not area:
        return "stop-worksite", "no OFLC area for the worksite"
    if areas is not None and area not in areas:
        return "stop-worksite", f"OFLC area {area} has no rows in the extract — re-run extract with it"
    return None, None


# ───────────────────────── run ─────────────────────────

def offer_points(pay: dict) -> list:
    lo, hi = float(pay["low"]), float(pay["high"])
    return [("low", lo, "record"), ("mid", round((lo + hi) / 2, 2), "derived: (low+high)/2"), ("high", hi, "record")]


def run(args) -> int:
    try:
        run_date = date.fromisoformat(args.run_date) if args.run_date else date.today()
    except ValueError:
        print(f"STOP input: --run-date {args.run_date!r} is not YYYY-MM-DD", file=sys.stderr)
        return 2
    replay = run_date != date.today()
    if replay and not args.replay:
        print(f"STOP input: --run-date {run_date} is not today ({date.today()}); freshness gates are measured "
              "against the run date, so a back- or forward-dated run must pass --replay and is stamped REPLAY",
              file=sys.stderr)
        return 2
    try:
        persona = json.loads(Path(args.persona).read_text())
        scen = json.loads(Path(args.scenarios).read_text())
        rule_check = json.loads(Path(args.rule_check).read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(f"STOP input: {e}", file=sys.stderr)
        return 2
    try:
        extract_sha = check_inputs(args)
        timeline = check_run_gates(persona, rule_check, run_date)
    except GateStop as e:
        print(f"STOP {e}", file=sys.stderr)
        return 2

    extract = read_extract(Path(args.extract))
    try:
        socs = check_soc_gate(scen, extract)
    except GateStop as e:
        print(f"STOP {e}", file=sys.stderr)
        return 2
    national = read_national_xlsx(Path(args.national), set(socs))
    compact = read_compact(Path(args.compact), set(socs))
    eighty = read_80days(Path(args.eighty_days), {s.get("company_80days") for s in scen["scenarios"]})
    regime_now = rule_check["regime_in_force"]

    results = []
    for sc in scen["scenarios"]:
        route, reason = scenario_gate(sc, run_date, {a for (a, _) in extract})
        rec = eighty.get(sc.get("company_80days"))
        sponsorship = ({"approvals": int(float(rec["Total Approvals"] or 0)), "denials": int(float(rec["Total Denials"] or 0)),
                        "approval_rate_pct": round(float(rec["Approval_Rate"]), 1) if rec["Approval_Rate"] else None,
                        "median_salary_offered": float(rec["median_salary_offered"]) if rec["median_salary_offered"] else None,
                        "top_job_titles_sponsored": rec["top_job_titles_sponsored"], "source": "record"}
                       if rec else {"value": None, "note": "no trace in the 80 Days data (not 'does not sponsor')"})
        item = {"id": sc["id"], "company": sc["company"], "title": sc["title"], "posting_url": sc["posting_url"],
                "worksite": sc["worksite"], "pay": sc["pay"], "liveness": sc["liveness"],
                "sponsorship_80days": sponsorship, "route": route, "reason": reason, "rows": [],
                "selection_probability": None,
                "selection_probability_note": "not computed: no registration counts by wage level are in the repo"}
        if route:
            results.append(item)
            continue
        area = sc["worksite"]["oflc_area"]
        for soc in socs:
            o = extract.get((area, soc))
            oflc = oflc_annual_levels(o) if o else {"status": "missing", "levels": None,
                                                     "reason": f"no OFLC row for area {area}, SOC {soc}"}
            nat = national.get(soc)
            cp = compact.get(soc, {})
            for point, salary, src in offer_points(sc["pay"]):
                row = {"soc": soc, "soc_title": (o or {}).get("title") or cp.get("title"),
                       "offer_point": point, "salary": salary, "salary_source": src,
                       "oflc": {"status": oflc["status"], "reason": oflc["reason"], "levels": oflc["levels"],
                                "source": "record (OFLC wage year 2026-27, May 2025 OEWS)"},
                       "level": None, "entries": None, "gap_to_next": None,
                       "national_proxy": None, "proxy_disagrees": None, "proxy_direction": None,
                       "cognitive_pivot_score": cp.get("cognitive_pivot_score"),
                       "cognitive_pivot_source": "record (repo compact extract; context only, feeds no decision)"}
                if oflc["status"] == "leveled":
                    lv = level_met(salary, oflc["levels"])
                    row["level"] = lv
                    row["entries"] = ENTRIES.get(lv)
                    row["entries_note"] = (None if lv in ENTRIES else
                                           "below Level I: at this salary the offer does not meet the prevailing wage for this SOC")
                    row["gap_to_next"] = next_level_gap(salary, oflc["levels"])
                if nat:
                    br = {name: proxy_bracket(salary, nat["pct"], reg) for name, reg in REGIMES.items()}
                    row["national_proxy"] = {"brackets": br, "source": "proxy (national OEWS May 2024 percentiles "
                                             "× approximate level percentiles; not the legal level)"}
                    if row["level"]:
                        b = br[regime_now]
                        order = ["below-I"] + LEVELS
                        lvl = order.index(row["level"])
                        row["proxy_disagrees"] = not (order.index(b["min"]) <= lvl <= order.index(b["max"]))
                        row["proxy_direction"] = ("overstates" if order.index(b["min"]) > lvl else
                                                  "understates" if order.index(b["max"]) < lvl else "agrees")
                item["rows"].append(row)
        lv_rows = [r for r in item["rows"] if r["entries"] is not None]
        below = [r for r in item["rows"] if r["level"] == "below-I"]
        item["route"] = "leveled"
        item["spread"] = {}
        for point, _, _ in offer_points(sc["pay"]):
            es = [r["entries"] for r in lv_rows if r["offer_point"] == point]
            bs = [r["soc"] for r in below if r["offer_point"] == point]
            item["spread"][point] = {"min_entries": min(es) if es else None, "max_entries": max(es) if es else None,
                                     "below_level_I_socs": bs}
        results.append(item)

    out = Path(args.out)
    log = {
        "_recipe": RECIPE, "_script": "scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py",
        "version": VERSION, "run_date": run_date.isoformat(),
        "mode": ("replay: run date is not the execution date; gate freshness is as of the run date only"
                 if replay else "live"),
        "inputs": {"persona": rel(args.persona), "scenarios": rel(args.scenarios), "rule_check": rel(args.rule_check),
                   "oflc_extract": {"path": rel(args.extract), "sha256": extract_sha, "matches_provenance": True},
                   "national_oews": rel(args.national), "compact": rel(args.compact),
                   "eighty_days": rel(args.eighty_days)},
        "gates": {"timeline": {**timeline, "source": "your-input (OPT start) + rule (12+24 months, March registration)"},
                  "rule_check": rule_check},
        "soc_candidates": scen["soc_candidates"],
        "summary": summarize(results),
        "scenarios": results,
        "cannot_verify": CANNOT_VERIFY,
    }
    # Render both artifacts before writing either, so a failure never leaves one without the other.
    log_text, report_text = json.dumps(log, indent=2) + "\n", render_report(log)
    out.mkdir(parents=True, exist_ok=True)
    (out / "run-log.json").write_text(log_text)
    (out / "report.md").write_text(report_text)
    print(f"wrote {rel(out / 'run-log.json')} and {rel(out / 'report.md')}")
    s = log["summary"]
    print(f"scenarios {s['scenarios']} → leveled {s['leveled']} · stopped {s['stopped']} "
          f"({', '.join(f'{k} {v}' for k, v in s['stopped_by'].items()) or 'none'}); "
          f"rows {s['rows']} · refused {s['refused_rows']} · below-I {s['below_level_I_rows']} · "
          f"proxy disagrees {s['proxy_disagrees']}/{s['proxy_compared']} "
          f"(overstates {s['proxy_overstates']}, understates {s['proxy_understates']})")
    return 0


CANNOT_VERIFY = [
    "Which SOC code the employer will actually file. The candidate list is the student's judgment, not a record.",
    "The final base salary. Offer points are the posted range's low, midpoint and high, not an offer.",
    "Selection probability. Entries are known; the number of competing registrations at each level is not in the repo.",
    "Whether the proposed 2026 DOL level rule has been finalized after the rule-check date.",
    "How a below-Level-I wage (e.g., a private wage survey) or an OFLC 'High Wage' row is treated in the weighted lottery.",
    "Whether another employer also registers the student at a lower level (USCIS then uses the lowest level).",
    "E-Verify enrollment of the employer (required for STEM OPT) and degree relatedness of the role.",
    "Whether the worksite in the posting is where the person will actually work (remote/hybrid changes the area).",
    "Fee and entry policy: Proclamation 11069 (FR 2026-19554; $100,000 entry payment extended to 2027-09-21) and "
    "the DHS proposed $103,265 cap-petition fee (FR 2026-17324, proposed only), as of 2026-10-21 — not modeled.",
]


def summarize(results: list) -> dict:
    stopped = [r for r in results if r["route"] != "leveled"]
    by = {}
    for r in stopped:
        by[r["route"]] = by.get(r["route"], 0) + 1
    rows = [row for r in results for row in r["rows"]]
    comp = [row for row in rows if row["proxy_disagrees"] is not None]
    return {"scenarios": len(results), "leveled": len(results) - len(stopped), "stopped": len(stopped),
            "stopped_by": by, "rows": len(rows),
            "refused_rows": sum(1 for row in rows if row["oflc"]["status"] != "leveled"),
            "below_level_I_rows": sum(1 for row in rows if row["level"] == "below-I"),
            "proxy_compared": len(comp), "proxy_disagrees": sum(1 for row in comp if row["proxy_disagrees"]),
            "proxy_overstates": sum(1 for row in comp if row.get("proxy_direction") == "overstates"),
            "proxy_understates": sum(1 for row in comp if row.get("proxy_direction") == "understates")}


# ───────────────────────── report ─────────────────────────

def money(x):
    return "—" if x is None else f"${x:,.0f}"


def br_txt(b):
    return b["min"] if b["exact"] else f"{b['min']}–{b['max']}"


def render_report(log: dict) -> str:
    s = log["summary"]
    t = log["gates"]["timeline"]
    L = []
    L.append("# Wage-level lottery check — product roles in SF Bay and Seattle\n")
    L.append("## Executive summary\n")
    leveled = [r for r in log["scenarios"] if r["route"] == "leveled"]
    spreads = []
    for r in leveled:
        sp = r["spread"]["mid"]
        if sp["min_entries"] is not None:
            spreads.append(f"{r['company']} ({r['worksite']['area_name'].split(',')[0].split('-')[0]}): "
                           f"{sp['min_entries']}–{sp['max_entries']} entries at the midpoint"
                           + (f", below the minimum wage level under {len(sp['below_level_I_socs'])} code(s)" if sp["below_level_I_socs"] else ""))
    L.append("**What this is.** A check of live product-manager postings against the U.S. Department of "
             "Labor's official wage levels. Since 2026 the H-1B lottery gives a registration 1 to 4 entries "
             "depending on which wage level the offered salary reaches, and the level depends on the job "
             "code the employer files and the city — neither of which the applicant chooses or sees.\n")
    L.append(f"**What it found.** {s['scenarios']} posting-city combinations were checked; {s['leveled']} could be "
             f"leveled and {s['stopped']} {'was' if s['stopped'] == 1 else 'were'} stopped by a check. For the same salary, the number of lottery "
             "entries changes with the job code the employer picks: " + ("; ".join(spreads) if spreads else "none leveled") + ". "
             f"A shortcut using national pay data disagreed with the official city level in "
             f"{s['proxy_disagrees']} of {s['proxy_compared']} comparisons; it put the level too high "
             f"{s['proxy_overstates']} times and too low {s['proxy_understates']} times. That holds for these postings "
             f"and job codes only; the national data is also one survey year older than the official table.\n")
    L.append(f"**What it cannot tell you.** Your chance of being selected (not computable from this data), which code "
             f"the employer will actually file, or your final salary. You have {len(t['seasons'])} lottery "
             f"season(s) left before your work authorization ends ({t['opt_end']}, assumed).\n")
    L.append("**What to do with it.** Before accepting an offer, ask the employer's immigration team which job "
             "code and wage level they intend to file, and compare it with the tables below.\n")

    L.append("## Run record\n")
    L.append(f"- Recipe: `{log['_recipe']}` v{log['version']} · script `{log['_script']}`")
    if log.get("mode", "live") != "live":
        L.append(f"- **REPLAY** — {log['mode']}")
    L.append(f"- Run date: {log['run_date']} · OFLC extract sha256 `{log['inputs']['oflc_extract']['sha256'][:16]}…`")
    rc = log["gates"]["rule_check"]
    L.append(f"- Level rule in force: **{rc['regime_in_force']}** — checked {rc['checked_on']} by {rc['checked_by']} ({rc['how']})")
    L.append(f"- Timeline: OPT start {t['opt_start']} (your-input) → OPT/STEM OPT end {t['opt_end']}; seasons: "
             + ", ".join(f"March {x['registration_march']} ({x['fiscal_year']})" for x in t["seasons"]))
    L.append(f"- SOC candidates (your-input, {log['soc_candidates']['set_by']}): " + ", ".join(log["soc_candidates"]["codes"]))
    by = ", ".join(f"{k} {v}" for k, v in s["stopped_by"].items())
    L.append(f"- Result: {s['leveled']} leveled · {s['stopped']} stopped{f' ({by})' if by else ''} · {s['rows']} rows · "
             f"{s['refused_rows']} refused (no OFLC levels) · {s['below_level_I_rows']} below Level I\n")
    L.append("Labels: **record** = read from a dataset; **derived** = arithmetic on records; **proxy** = national "
             "approximation, not the legal level; **your-input** = a choice a person made.\n")

    for r in log["scenarios"]:
        L.append(f"## {r['id']} · {r['company']} — {r['title']}\n")
        ws = r["worksite"]
        L.append(f"- Posting: <{r['posting_url']}> · liveness **{r['liveness']['status']}** ({r['liveness']['checked_on']})")
        L.append(f"- Worksite: {ws['text']} → OFLC area {ws.get('oflc_area')} {ws.get('area_name', '')}")
        p = r["pay"]
        L.append(f"- Posted range: {money(p['low'])}–{money(p['high'])} · basis **{p.get('basis')}** "
                 f"(confirmed by {p.get('basis_confirmed_by') or 'nobody'}) · quote: “{p.get('quoted_text', '')}”")
        sp = r["sponsorship_80days"]
        if sp.get("source") == "record":
            L.append(f"- 80 Days record: {sp['approvals']} approvals, {sp['denials']} denials, "
                     f"{sp['approval_rate_pct']}% · company-wide median sponsored salary {money(sp['median_salary_offered'])}")
        else:
            L.append(f"- 80 Days record: {sp['note']}")
        if r["route"] != "leveled":
            L.append(f"\n**Stopped — {r['route']}.** {r['reason']}. No level is shown.\n")
            continue
        L.append("")
        L.append("| SOC (employer's choice) | OFLC Level I / II / III / IV (annual) | Low | Mid | High | Entries L/M/H | Mid: to next level | National proxy at Mid (now · proposed) | Cognitive Pivot |")
        L.append("|---|---|---|---|---|---|---|---|---|")
        for soc in log["soc_candidates"]["codes"]:
            rows = {x["offer_point"]: x for x in r["rows"] if x["soc"] == soc}
            m = rows["mid"]
            if m["oflc"]["status"] != "leveled":
                L.append(f"| {soc} {m['soc_title'] or ''} | refused: {m['oflc']['reason']} | — | — | — | — | — | — | "
                         f"{m['cognitive_pivot_score'] if m['cognitive_pivot_score'] is not None else '—'} |")
                continue
            lv = m["oflc"]["levels"]
            levels = " / ".join(money(lv[k]) for k in LEVELS)
            ent = "/".join(str(rows[k]["entries"]) if rows[k]["entries"] else "0*" for k in ("low", "mid", "high"))
            gap = m["gap_to_next"]
            gap_t = f"+{money(gap['gap'])} → {gap['next_level']}" if gap else "at top level"
            np = m["national_proxy"]
            proxy = (f"{br_txt(np['brackets']['current-2005'])} · {br_txt(np['brackets']['proposed-2026-nprm'])}"
                     + (" ⚠ disagrees" if m["proxy_disagrees"] else "")) if np else "—"
            L.append(f"| {soc} {m['soc_title']} | {levels} | {rows['low']['level']} | {m['level']} | {rows['high']['level']} | "
                     f"{ent} | {gap_t} | {proxy} | {m['cognitive_pivot_score'] if m['cognitive_pivot_score'] is not None else '—'} |")
        sp = r["spread"]
        L.append("")
        cmp = [x for x in r["rows"] if x["proxy_disagrees"] is not None]
        over = sum(1 for x in cmp if x["proxy_direction"] == "overstates")
        under = sum(1 for x in cmp if x["proxy_direction"] == "understates")
        L.append(f"National proxy vs the official level, all three offer points: disagrees "
                 f"{over + under}/{len(cmp)} (too high {over}, too low {under}); the ⚠ column shows the midpoint only.")
        L.append("Spread across SOC codes (entries): " + " · ".join(
            f"{k} {v['min_entries']}–{v['max_entries']}" + (f" (below Level I: {', '.join(v['below_level_I_socs'])})" if v["below_level_I_socs"] else "")
            for k, v in sp.items()))
        L.append("`0*` = below Level I: at that salary the offer does not meet the prevailing wage for that code. "
                 "Cognitive Pivot `—` = the repo extract has no score for that occupation; no sub-occupation's "
                 "score is substituted.\n")

    L.append("## What this cannot tell you\n")
    for c in log["cannot_verify"]:
        L.append(f"- {c}")
    L.append("\nSelection probability is deliberately absent. Entries are a weight, not a chance.\n")
    L.append("## Release gate\n")
    L.append("A named person reads this report, including the section above, before using it in any "
             "conversation with an employer. Record who and when in the run log.\n")
    return "\n".join(L) + "\n"


# ───────────────────────── extract ─────────────────────────

def extract(args) -> int:
    raw = Path(args.raw)
    alc, geo, occ = raw / "ALC_Export.csv", raw / "Geography.csv", raw / "oes_soc_occs.csv"
    for p in (alc, geo, occ):
        if not p.exists():
            print(f"STOP missing {p} — run fetch-oflc.sh first", file=sys.stderr)
            return 2
    areas, socs = set(args.areas.split(",")), set(args.socs.split(","))
    names = {}
    with open(geo, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["Area"] in areas:
                names[r["Area"]] = r["AreaName"]
    titles = {}
    with open(occ, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            titles[r["soccode"]] = r["Title"]
    out_rows = []
    with open(alc, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["Area"] in areas and r["SocCode"] in socs:
                out_rows.append({"area": r["Area"], "area_name": names.get(r["Area"], ""), "soc": r["SocCode"],
                                 "title": titles.get(r["SocCode"], ""), "geo_lvl": r["GeoLvl"],
                                 "level1": r["Level1"], "level2": r["Level2"], "level3": r["Level3"],
                                 "level4": r["Level4"], "average": r["Average"], "label": r["Label"]})
    out_rows.sort(key=lambda x: (x["area"], x["soc"]))
    missing = sorted(f"{a}/{s}" for a in areas for s in socs if not any(x["area"] == a and x["soc"] == s for x in out_rows))
    dest = Path(args.out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()) if out_rows else ["area"])
        w.writeheader()
        w.writerows(out_rows)
    zip_path = raw.parent / f"OFLC_Wages_{raw.name}.zip"
    prov = {"origin": f"https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_{raw.name}.zip",
            "publisher": "U.S. Department of Labor, Office of Foreign Labor Certification (FLAG wage data)",
            "wage_year": raw.name, "oews_basis": "BLS OEWS May 2025 (per OFLC technical release notes)",
            "zip_sha256": sha256(zip_path) if zip_path.exists() else None,
            "alc_export_sha256": sha256(alc), "extract_sha256": sha256(dest),
            "areas": sorted(areas), "socs": sorted(socs), "rows": len(out_rows), "missing_pairs": missing,
            "units": "Level1..Level4 and Average are hourly unless label == 'Annual Wage'; annual = hourly × 2080",
            "extracted_on": date.today().isoformat(),
            "script": "scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py extract"}
    dest.with_suffix(".provenance.json").write_text(json.dumps(prov, indent=2) + "\n")
    print(f"wrote {rel(dest)} ({len(out_rows)} rows; missing pairs: {len(missing)})")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("extract", help="raw OFLC wage year → committed extract")
    e.add_argument("--raw", default=str(HERE / "raw" / "2026-27"))
    e.add_argument("--areas", default="41860,41940,42660")
    e.add_argument("--socs", default="11-2021,11-3021,13-1111,13-1161,15-1211,15-1299,15-2031,15-2051")
    e.add_argument("--out", default=str(DEFAULT_EXTRACT))
    r = sub.add_parser("run", help="level the scenarios")
    r.add_argument("--persona", default=str(HERE / "fixtures" / "persona.fixture.json"))
    r.add_argument("--scenarios", default=str(HERE / "fixtures" / "scenarios.2026-10-21.json"))
    r.add_argument("--rule-check", default=str(HERE / "fixtures" / "rule-check.json"))
    r.add_argument("--extract", default=str(DEFAULT_EXTRACT))
    r.add_argument("--national", default=str(DEFAULT_NATIONAL))
    r.add_argument("--compact", default=str(DEFAULT_COMPACT))
    r.add_argument("--eighty-days", default=str(DEFAULT_80DAYS))
    r.add_argument("--run-date", default=None, help="YYYY-MM-DD (default: today)")
    r.add_argument("--replay", action="store_true",
                   help="allow a run date other than today (output is stamped REPLAY)")
    r.add_argument("--out", default=str(HERE / "out"))
    args = ap.parse_args(argv)
    return extract(args) if args.cmd == "extract" else run(args)


if __name__ == "__main__":
    sys.exit(main())
