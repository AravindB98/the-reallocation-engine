#!/usr/bin/env python3
"""wage_level.py: H-1B wage-level odds for new-grad software engineer postings (SOC 15-1252).

Since 27 Feb 2026 the H-1B cap selection is weighted by wage level (90 FR 60864): a registration is
entered once at Level I, twice at II, three times at III and four times at IV. The level is the
highest OEWS level the offered wage equals or exceeds for the SOC code in the area of intended
employment; below Level I counts as Level I; with several work locations the employer must use the
lowest level. This script maps each posting's published pay range onto DOL's 2026-27 OFLC wage
levels for SOC 15-1252, city by city, and reports the lottery entries at the bottom and top of the
range and the base pay needed for the next level. It refuses rather than guesses when the worksite,
the pay range or the data cannot support an answer.

Run from the repo root:

    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample
    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --audit
    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py \
        --persona <persona.json> --postings <postings.json> --gate-log <gates.json> --out-dir <dir>

Only local files are read. The one exception is posting liveness, which runs the repo's own
scripts/ats/check-liveness.mjs (pass --liveness-fixture to use saved results instead). Postings are
fetched beforehand by fetch_postings.py, the only script here that touches the network for data.

The name match, liveness handling and labelled-value format are adapted from my Recipe Design
prototype (scripts/contrib/2026fa/pavithra-prasad-newgrad-swe-sponsor-check, PR #33).
"""
import argparse
import csv
import datetime as dt
import hashlib
import html
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
DATA = os.path.join(HERE, "data")
FIX = os.path.join(HERE, "fixtures")
MANIFEST = os.path.join(DATA, "extract-manifest.json")
ALC = os.path.join(DATA, "oflc-alc-2026-27-extract.csv")
GEO = os.path.join(DATA, "oflc-geography-extract.csv")
WORKSITES = os.path.join(DATA, "worksites.csv")
AUDIT = os.path.join(DATA, "oflc-extract-audit.md")
SPONSOR_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
LIVENESS = "scripts/ats/check-liveness.mjs"
RECIPE = "recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md"
RECIPE_VERSION = "0.1.0"
ALLOWED_OUT = ["scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level", "assignments/submissions/pavithra-prasad"]

SOC = "15-1252"
SOC_TITLE = "Software Developers"
HOURS_PER_YEAR = 2080          # DEFINE: OFLC publishes hourly wages; annual = hourly x 2080, rounded to whole dollars
LEVELS = ["Level I", "Level II", "Level III", "Level IV"]
REC, COMP, INPUT, MODEL = "record", "computed", "your-input", "model-judgment"

REMOTE_RE = re.compile(r"\bremote\b|\banywhere\b", re.I)
REGION_RE = re.compile(r"bay area|silicon valley|greater boston|tri-?state|puget sound|nyc metro|new york metro", re.I)
STATES = {"california": "CA", "washington": "WA", "new york": "NY", "massachusetts": "MA",
          "new jersey": "NJ", "new hampshire": "NH"}
SWE_TITLE_RE = re.compile(r"software (engineer|developer)|backend|back-end|full[- ]?stack|front[- ]?end|\bSWE\b|\bSDE\b", re.I)
SOC_DOUBT_RE = re.compile(r"machine learning|\bML\b|\bAI\b|research|data (scientist|engineer)|security|\btest|\bQA\b|quality"
                          r"|site reliability|\bSRE\b|forward deployed|solutions|support|hardware|embedded|firmware", re.I)
AMT = r"\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d+)?\s?[kK]\b|\d{2,3}(?:\.\d{1,2})?)"
PER_HOUR = r"(?:\s*(?:/\s?h(?:ou)?r\b|per hour|an hour))?"
RANGE_RE = re.compile(AMT + PER_HOUR + r"\s*(?:USD)?\s*(?:-|–|—|to)\s*(?:USD\s*)?" + AMT, re.I)
HOURLY_RE = re.compile(r"^\s*(?:USD\s*)?(?:/\s?h(?:ou)?r\b|per hour|an hour|hourly)", re.I)
SUFFIXES = {"incorporated", "inc", "llc", "corporation", "corp", "company", "co", "ltd", "lp", "plc"}


class Halt(Exception):
    """A conformance failure: the data or an input is not what the recipe expects. Halts the run."""


def labeled(value, source, note=None):
    out = {"value": value, "source": source}
    if note:
        out["note"] = note
    return out


def sha256_file(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def norm(name):
    """Exact company-name key (from PR #33): lowercase, punctuation dropped, legal suffixes removed."""
    words = re.sub(r"[^a-z0-9 ]", " ", (name or "").lower()).split()
    while words and words[-1] in SUFFIXES:
        words.pop()
    return "".join(words)


def parse_date(s, field):
    try:
        return dt.date.fromisoformat(s)
    except (TypeError, ValueError):
        raise Halt("input: %s is missing or not YYYY-MM-DD (got %r)" % (field, s))


# ── data ────────────────────────────────────────────────────────────────────

def load_data():
    """Load the OFLC extract and refuse it if any file changed or the level arithmetic is off."""
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    for name, meta in manifest["outputs"].items():
        got = sha256_file(os.path.join(DATA, name))
        if got != meta["sha256"]:
            raise Halt("data: %s SHA-256 is %s, manifest says %s; rebuild it with build_extract.py" % (name, got, meta["sha256"]))
    thresholds, problems = {}, []
    with open(ALC, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            hourly = [float(r["Level%d" % i]) for i in range(1, 5)]
            # OFLC interpolates Levels II and III evenly between I and IV; a mismatch means a damaged file.
            step = (hourly[3] - hourly[0]) / 3
            for i, want in ((1, hourly[0] + step), (2, hourly[0] + 2 * step)):
                if abs(hourly[i] - want) > 0.011:
                    problems.append("%s %s Level %d is %.2f, interpolation gives %.2f" % (r["Area"], r["SocCode"], i + 1, hourly[i], want))
            thresholds[(r["Area"], r["SocCode"])] = {
                "area_name": r["AreaName"], "geo_level": int(r["GeoLvl"]), "hourly": hourly,
                "annual": [round(h * HOURS_PER_YEAR) for h in hourly]}
    if problems:
        raise Halt("data: level arithmetic check failed: " + "; ".join(problems))
    counties = {}
    with open(GEO, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            counties[(r["StateAb"], r["CountyTownName"].lower())] = (r["Area"], r["AreaName"])
    cities = {}
    with open(WORKSITES, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            key = (r["state"], r["county"].lower())
            if key not in counties:
                raise Halt("data: worksites.csv maps %s, %s to %s, which is not in the OFLC geography extract"
                           % (r["city"], r["state"], r["county"]))
            cities[(r["city"].lower(), r["state"])] = {"county": r["county"], "area": counties[key][0], "area_name": counties[key][1]}
    known = {}
    for (city, st) in cities:
        known.setdefault(city, []).append(st)
    return {"manifest": manifest, "thresholds": thresholds, "cities": cities, "known_cities": known}


def load_sponsors():
    index = {}
    with open(os.path.join(REPO, SPONSOR_CSV), newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            index.setdefault(norm(row["company_name"]), []).append(row)
    return index


# ── parsing ─────────────────────────────────────────────────────────────────

def amount(s):
    s = s.replace(",", "").replace(" ", "")
    return float(s[:-1]) * 1000 if s[-1:] in "kK" else float(s)


def parse_pay(snippets):
    """Every distinct pay range in the posting's pay text: [{lo, hi, unit, raw, at}]."""
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(html.unescape(" ".join(snippets or [])))))
    found, seen = [], set()
    for m in RANGE_RE.finditer(text):
        lo, hi = amount(m.group(1)), amount(m.group(2))
        unit = "hour" if (HOURLY_RE.search(text[m.end():m.end() + 20]) or re.search(r"/\s?h(?:ou)?r|per hour|an hour", m.group(0), re.I)) else "year"
        if unit == "year" and (lo < 20000 or hi < 20000):
            continue        # bonus, stipend or a stray number, not a salary range
        if unit == "hour" and not (10 <= lo <= 500 and 10 <= hi <= 500):
            continue
        if hi < lo:
            lo, hi = hi, lo
        if (lo, hi, unit) in seen:
            continue
        seen.add((lo, hi, unit))
        found.append({"lo": lo, "hi": hi, "unit": unit, "raw": m.group(0), "at": m.start()})
    return found, text


def parse_locations(loc, known=None):
    """Split a posting's location string into (city, state) worksites plus flags. `known` maps a
    lower-case city name to its states in the city table; a bare city name ("San Francisco", or a
    list like "San Francisco, Seattle, New York") is accepted only when it names one state there."""
    out = {"worksites": [], "remote": False, "regions": [], "unparsed": [], "state_inferred": []}
    known = known or {}

    def bare(tokens):
        hits = [(t, known.get(t.lower(), [])) for t in tokens]
        if hits and all(len(states) == 1 for _, states in hits):
            for t, states in hits:
                out["worksites"].append((t, states[0]))
                out["state_inferred"].append(t)
            return True
        return False

    for part in re.split(r"\s*(?:;|\||•|·|\bor\b|\s/\s)\s*", loc or ""):
        part = re.sub(r"\s*[-–(]?\s*\b(hybrid|on-?site|in office|office)\b\)?", "", part, flags=re.I).strip(" ,-()")
        part = re.sub(r",\s*(US|USA|United States)$", "", part, flags=re.I).strip(" ,")
        if not part or part.lower() in ("us", "usa", "united states"):
            continue
        if REMOTE_RE.search(part):
            out["remote"] = True
        elif REGION_RE.search(part):
            out["regions"].append(part)
        else:
            m = re.match(r"^([^,]+),\s*([A-Za-z .]+)$", part)
            st = m and m.group(2).strip()
            st = st and STATES.get(st.lower(), st.upper() if len(st) == 2 else None)
            if m and st:
                out["worksites"].append((m.group(1).strip(), st))
            elif not bare([t.strip() for t in part.split(",") if t.strip()]):
                out["unparsed"].append(part)
    return out


# ── levels ──────────────────────────────────────────────────────────────────

def level_for(wage, annual):
    """0 = below Level I; otherwise 1-4, the highest level the wage equals or exceeds."""
    level = 0
    for i, t in enumerate(annual, start=1):
        if wage >= t:
            level = i
    return level


def entries(level):
    return max(level, 1)     # 90 FR 60864: wages below Level I are grouped with Level I (entered once)


def level_name(level):
    return "below Level I" if level == 0 else LEVELS[level - 1]


def next_step(wage, annual):
    for i, t in enumerate(annual, start=1):
        if wage < t:
            return {"next_level": level_name(i), "threshold": t, "gap": round(t - wage)}
    return None


def to_annual(rng):
    if rng["unit"] == "hour":
        return rng["lo"] * HOURS_PER_YEAR, rng["hi"] * HOURS_PER_YEAR
    return rng["lo"], rng["hi"]


# ── gates ───────────────────────────────────────────────────────────────────

def classify_liveness(result, reason):
    """From PR #33: only HTTP 404/410 counts as expired; a content heuristic becomes uncertain."""
    if result == "expired" and not re.search(r"HTTP 4(04|10)", reason or ""):
        return "uncertain", "checker said expired from a content heuristic (%s), not an HTTP 404/410" % (reason or "no reason")
    return result, reason


def liveness_results(postings, fixture_path):
    out = {}
    if fixture_path:
        with open(fixture_path, encoding="utf-8") as f:
            saved = json.load(f)
        for p in postings:
            v = saved.get(p["posting_id"], {"result": "uncertain", "reason": "no saved result"})
            out[p["posting_id"]] = classify_liveness(v["result"], v.get("reason", ""))
        return out, "fixture:" + os.path.relpath(fixture_path, REPO)
    for p in postings:
        proc = subprocess.run(["node", os.path.join(REPO, LIVENESS), p["url"]], cwd=REPO, capture_output=True, text=True)
        m = re.search(r"\b(active|expired|uncertain)\b\s+" + re.escape(p["url"]) + r"(?:\n[ \t]+(\S.*))?", proc.stdout)
        out[p["posting_id"]] = classify_liveness(m.group(1), (m.group(2) or "").strip()) if m else ("uncertain", "could not parse checker output")
    return out, "live:" + LIVENESS


def combine_liveness(checker, api_status):
    """G1 (from PR #33): the page checker and the job-board API must agree; a conflict is held."""
    result, reason = checker
    if api_status not in (200, 404, 410):
        return result, reason
    api_open = api_status == 200
    if result == "uncertain":
        return ("active" if api_open else "expired"), "%s; job-board API HTTP %s at fetch" % (reason, api_status)
    if (result == "active") != api_open:
        return "uncertain", "page checker said %s but job-board API HTTP %s at fetch" % (result, api_status)
    return result, "%s; job-board API HTTP %s at fetch agrees" % (reason or result, api_status)


def timeline_gate(persona, run_date, manifest):
    """G2, the visa timeline, checked once per run from the persona's dates."""
    reg = parse_date(persona["planned_registration_date"], "planned_registration_date")
    file_by = parse_date(persona["petition_filing_window_end"], "petition_filing_window_end")
    opt_end = parse_date(persona["opt_ead_end"], "opt_ead_end")
    lag = int(persona["hiring_lag_days"])
    ws, we = (parse_date(manifest["wage_year"][k], "wage_year." + k) for k in ("start", "end"))
    offer_by = run_date + dt.timedelta(days=lag)
    checks = [
        {"id": "G2a", "test": "run date + hiring lag <= planned registration date",
         "pass": offer_by <= reg, "detail": "%s + %d days = %s; registration %s" % (run_date, lag, offer_by, reg)},
        {"id": "G2b", "test": "OPT end date >= end of the petition filing window",
         "pass": opt_end >= file_by, "detail": "OPT ends %s; filing window ends %s" % (opt_end, file_by)},
        {"id": "G2c", "test": "registration date falls inside the wage year of the data",
         "pass": ws <= reg <= we, "detail": "registration %s; wage year %s to %s" % (reg, ws, we)},
    ]
    sensitivity = [{"hiring_lag_days": d, "offer_by": str(run_date + dt.timedelta(days=d)), "in_time": run_date + dt.timedelta(days=d) <= reg}
                   for d in (30, 60, 90)]
    return {"pass": all(c["pass"] for c in checks), "checks": checks,
            "registration_date": labeled(str(reg), INPUT, "USCIS announces the registration window each year; this date is the persona's assumption"),
            "offer_needed_by": labeled(str(offer_by), COMP),
            "latest_offer_date": labeled(str(reg), COMP, "the offer must exist before the employer registers"),
            "start_search_by": labeled(str(reg - dt.timedelta(days=lag)), COMP, "registration date minus the persona's hiring lag"),
            "lag_sensitivity": labeled(sensitivity, COMP, "the same check with a 30, 60 and 90 day hiring lag")}


def gate_decision(log, gate, posting_id):
    """The latest logged human decision for this gate and posting ('*' covers every posting)."""
    hits = [g for g in log if g["gate"] == gate and g.get("posting_id") in (posting_id, "*")]
    return hits[-1] if hits else None


# ── evaluation ──────────────────────────────────────────────────────────────

def sponsor_evidence(company, sponsors, areas, data):
    rows = sponsors.get(norm(company), [])
    if not rows:
        return {"status": "no-row", "note": "no row in the sponsorship CSV under this name; absence is not evidence of non-sponsorship"}
    if len(rows) > 1:
        return {"status": "ambiguous", "note": "%d rows match; the script will not pick one" % len(rows)}
    row = rows[0]
    try:
        median = float(row["median_salary_offered"])
    except (TypeError, ValueError):
        median = None
    out = {"status": "ok", "csv_name": labeled(row["company_name"], REC),
           "total_approvals": labeled(row["Total Approvals"], REC),
           "median_salary_offered": labeled(median, REC, "company-wide median across all sponsored titles, any year in the file; not a new-grad salary")}
    if median:
        out["median_as_level"] = labeled({a: level_name(level_for(median, data["thresholds"][(a, SOC)]["annual"])) for a in areas}, COMP,
                                         "context only: where the company's all-title median would sit for SOC 15-1252 in each posting area")
    return out


def assign_ranges(ranges, text, sites):
    """Several ranges in one posting: each worksite takes the first range that follows a mention of
    its city within 300 characters (this handles 'Zone 1 (Menlo Park, CA; New York, NY) $X - $Y').
    Refuses (None) unless every worksite gets a range."""
    low, by_site = text.lower(), {}
    for site in sites:
        for m in re.finditer(re.escape(site[0].lower()), low):
            after = [r for r in ranges if 0 < r["at"] - m.end() <= 300]
            if after:
                by_site[site] = min(after, key=lambda r: r["at"])
                break
    return by_site if set(by_site) == set(sites) else None


def evaluate(p, data, live, gates, sponsors):
    pid = p["posting_id"]
    title = p.get("title") or ""          # a closed posting comes back from the API with no title
    ev = {"posting_id": pid, "company": labeled(p["company"], REC),
          "title": labeled(title or "(no title: job-board API HTTP %s at fetch)" % p.get("api_status"), REC),
          "location_as_posted": labeled(p["location"], REC), "url": p["url"],
          "fetched_at": labeled(p.get("fetched_at"), REC if p.get("source") != "constructed" else INPUT),
          "source": p.get("source", "unknown"), "stops": [], "notes": [], "sites": []}
    # G1 liveness
    result, reason = combine_liveness(live[pid], p.get("api_status"))
    g1 = gate_decision(gates, "G1", pid)
    ev["G1_liveness"] = {"checker": labeled(result, REC if not live.get("_fixture") else INPUT, reason),
                         "human": g1}
    if result == "expired":
        ev["stops"].append(("G1-expired", "posting is closed; a dead posting scores zero"))
    elif result == "uncertain" and not (g1 and g1["decision"] == "clear"):
        ev["stops"].append(("G1-held", "liveness uncertain (%s); held for a person" % reason))
    # G3 SOC confirmation
    doubt = bool(SOC_DOUBT_RE.search(title)) or not SWE_TITLE_RE.search(title)
    g3 = gate_decision(gates, "G3", pid)
    ev["G3_soc"] = {"assumed": labeled(SOC + " " + SOC_TITLE, MODEL, "the employer chooses the SOC code on the LCA; this is an assumption from the title"),
                    "title_flag": labeled("check: title may map to another SOC" if doubt else "plain software title", MODEL), "human": g3}
    # worksites
    loc = parse_locations(p["location"], data["known_cities"])
    sites, outside = [], []
    for city, st in loc["worksites"]:
        hit = data["cities"].get((city.lower(), st))
        (sites if hit else outside).append((city, st, hit))
    if loc["remote"]:
        ev["notes"].append("Remote is one of the options: the worksite would be the home address, unknown until hire, so it cannot be checked")
    for r in loc["regions"]:
        ev["notes"].append("'%s' spans more than one OFLC area (for example San Francisco vs San Jose), so it cannot be checked" % r)
    for city, st, _ in outside:
        ev["notes"].append("%s, %s is outside the five areas in the extract, so it cannot be checked" % (city, st))
    for c in loc["state_inferred"]:
        ev["notes"].append("'%s' was posted without a state; the state comes from the city table" % c)
    for u in loc["unparsed"]:
        ev["notes"].append("location '%s' could not be read" % u)
    if not sites:
        reason = ("remote only" if loc["remote"] else "region spans several areas" if loc["regions"] else "no checkable worksite")
        ev["stops"].append(("worksite", reason))
    # pay
    ranges, text = parse_pay(p.get("pay_text"))
    ev["pay_ranges_found"] = labeled([r["raw"] for r in ranges], REC, "as published in the posting")
    per_site = {}
    if not ranges:
        ev["stops"].append(("no-pay-range", "no pay range in the posting text"))
    elif len(ranges) == 1:
        per_site = {(c, s): ranges[0] for c, s, _ in sites}
    else:
        per_site = assign_ranges(ranges, text, [(c, s) for c, s, _ in sites]) or {}
        if not per_site:
            ev["stops"].append(("multiple-ranges", "%d different ranges and they cannot each be tied to one worksite" % len(ranges)))
    if any(r["unit"] == "hour" for r in ranges):
        ev["notes"].append("hourly pay converted at %d hours a year" % HOURS_PER_YEAR)
    # levels per worksite: none for a skipped or refused posting, so nothing actionable is left in the log
    for city, st, hit in ([] if ev["stops"] else sites):
        rng = per_site.get((city, st))
        if not rng:
            continue
        th = data["thresholds"][(hit["area"], SOC)]
        lo, hi = to_annual(rng)
        l_lo, l_hi = level_for(lo, th["annual"]), level_for(hi, th["annual"])
        ev["sites"].append({
            "worksite": labeled("%s, %s" % (city, st), REC), "county": labeled(hit["county"], COMP, "data/worksites.csv"),
            "oflc_area": labeled("%s %s" % (hit["area"], hit["area_name"]), COMP, "OFLC Geography.csv"),
            "geo_level": labeled(th["geo_level"], REC, "1 = wages estimated for this area itself"),
            "thresholds_annual": labeled(dict(zip(LEVELS, th["annual"])), REC, "OFLC 2026-27, hourly x %d" % HOURS_PER_YEAR),
            "range_annual": labeled([round(lo), round(hi)], REC if rng["unit"] == "year" else COMP),
            "level_at_min": labeled(level_name(l_lo), COMP), "level_at_max": labeled(level_name(l_hi), COMP),
            "entries_at_min": labeled(entries(l_lo), COMP, "rule: I=1, II=2, III=3, IV=4; below I counts once"),
            "entries_at_max": labeled(entries(l_hi), COMP),
            "below_level_1_at_min": labeled(l_lo == 0, COMP),
            "next_step_from_min": labeled(next_step(lo, th["annual"]), COMP),
        })
    levels_at_min = {s["level_at_min"]["value"] for s in ev["sites"]}
    if len(levels_at_min) > 1:
        ev["notes"].append("office choice changes the level at the same pay: " +
                           ", ".join("%s %s" % (s["worksite"]["value"], s["level_at_min"]["value"]) for s in ev["sites"]))
    ev["sponsorship_80_days"] = sponsor_evidence(p["company"], sponsors, sorted({s["oflc_area"]["value"].split()[0] for s in ev["sites"]}), data)
    # status
    pending = []
    if not (g1 and g1["decision"] == "clear"):
        pending.append("G1")
    g2 = gate_decision(gates, "G2", "*")
    if not (g2 and g2["decision"] == "clear"):
        pending.append("G2")
    if not (g3 and g3["decision"] == "clear"):
        pending.append("G3")
    if ev["stops"]:
        ev["status"] = "skip" if ev["stops"][0][0] == "G1-expired" else "refused"
    elif pending:
        ev["status"] = "provisional (gate %s not cleared)" % ", ".join(pending)
    else:
        ev["status"] = "checked"
    ev["next_action"] = labeled(next_action(ev), MODEL)
    return ev


def next_action(ev):
    if ev["stops"]:
        code, why = ev["stops"][0]
        return {"G1-expired": "Skip: the posting is closed.",
                "G1-held": "Open the posting yourself; if it is open, clear G1 and re-run.",
                "worksite": "Ask the recruiter which office the role sits in, then re-run with that city.",
                "no-pay-range": "Ask the recruiter for the base pay range before spending effort here.",
                "multiple-ranges": "Ask which range applies to the office you would join."}.get(code, why)
    tips = []
    below = [s for s in ev["sites"] if s["below_level_1_at_min"]["value"]]
    for s in below:
        tips.append("At the posted minimum the pay is below the Level I wage in %s: ask whether they would raise it or use another wage survey."
                    % s["oflc_area"]["value"].split(" ", 1)[1])
    best = max(ev["sites"], key=lambda s: (s["entries_at_min"]["value"], -(s["next_step_from_min"]["value"] or {}).get("gap", 0)), default=None)
    if best and best["next_step_from_min"]["value"]:
        ns = best["next_step_from_min"]["value"]
        tips.append("If you get an offer here, a base of $%s reaches %s in %s ($%s above the posted minimum)."
                    % (f"{ns['threshold']:,}", ns["next_level"], best["worksite"]["value"], f"{ns['gap']:,}"))
    if len({s["entries_at_min"]["value"] for s in ev["sites"]}) > 1:
        tips.append("The office matters: at the same pay, the entries differ by city (see the table).")
    return " ".join(tips) or "No action from the wage level alone."


# ── outputs ─────────────────────────────────────────────────────────────────

def check_out_dir(out_dir):
    rel = os.path.relpath(os.path.abspath(out_dir), REPO)
    if not any(rel == a or rel.startswith(a + os.sep) for a in ALLOWED_OUT):
        raise Halt("output: %s is outside this recipe's namespaces (%s)" % (rel, ", ".join(ALLOWED_OUT)))


def money(x):
    return "$" + f"{round(x):,}"


def render_report(log):
    ps = log["postings"]
    checked = [p for p in ps if p["status"].startswith(("checked", "provisional"))]
    refused = [p for p in ps if p["status"] in ("refused", "skip")]
    differ = [p for p in checked if len({s["entries_at_min"]["value"] for s in p["sites"]}) > 1]
    below = [p for p in checked if any(s["below_level_1_at_min"]["value"] for s in p["sites"])]
    L = []
    L.append("# H-1B wage-level check: %s run, %s" % (log["mode"], log["run_date"]))
    L.append("")
    L.append("## Executive summary")
    L.append("")
    L.append("**What this is.** For each software engineer job posting, this report shows which H-1B wage level the posted pay "
             "would reach in each listed city, and so how many times a registration would be entered in the H-1B lottery "
             "(once at Level I, up to four times at Level IV).")
    L.append("")
    L.append("**Why read it.** Two offers with the same salary can carry different lottery odds depending on the city. "
             "A posting's range does not show this, and neither does the company's past sponsorship record.")
    L.append("")
    L.append("**What it found.** %d posting%s checked: %d gave a wage level, %d %s refused or skipped with a reason. "
             % (len(ps), "" if len(ps) == 1 else "s", len(checked), len(refused), "was" if len(refused) == 1 else "were")
             + ("In %d, the city changes the number of entries at the same pay. " % len(differ) if differ else "")
             + ("In %d, the bottom of the posted range is below the Level I wage for at least one city. " % len(below) if below else "")
             + "These are relative weights, not chances: the real odds depend on everyone else's registrations, which nobody can see in advance.")
    L.append("")
    if not log.get("released"):
        L.append("> **NOT RELEASED (gate G4).** No person has released this report yet (gate log, run `%s`). Read it, including what it did not verify, before acting on any line." % log.get("run_label"))
        L.append("")
    if log["mode"] == "sample":
        L.append("> **Sample run.** The postings, liveness results and gate decisions in this run are constructed test data, not real postings.")
        L.append("")
    L.append("## Results by posting and city")
    L.append("")
    L.append("| Company | Role | City | Posted base range | At the minimum | At the maximum | Entries (min to max) | To reach the next level | Status |")
    L.append("|---|---|---|---|---|---|---|---|---|")
    for p in checked:
        for s in p["sites"]:
            ns = s["next_step_from_min"]["value"]
            L.append("| %s | %s | %s | %s to %s | %s | %s | %d to %d | %s | %s |" % (
                p["company"]["value"], p["title"]["value"], s["worksite"]["value"],
                money(s["range_annual"]["value"][0]), money(s["range_annual"]["value"][1]),
                s["level_at_min"]["value"], s["level_at_max"]["value"], s["entries_at_min"]["value"], s["entries_at_max"]["value"],
                ("%s for %s" % (money(ns["threshold"]), ns["next_level"])) if ns else "already Level IV", p["status"]))
    L.append("")
    L.append("## Next step per posting")
    L.append("")
    for p in ps:
        L.append("- **%s, %s:** %s" % (p["company"]["value"], p["title"]["value"], p["next_action"]["value"]))
    L.append("")
    if refused:
        L.append("## Refused or skipped")
        L.append("")
        L.append("| Company | Role | Location as posted | Why |")
        L.append("|---|---|---|---|")
        for p in refused:
            L.append("| %s | %s | %s | %s |" % (p["company"]["value"], p["title"]["value"], p["location_as_posted"]["value"],
                                              "; ".join(w for _, w in p["stops"])))
        L.append("")
    notes = [(p, n) for p in ps for n in p["notes"]]
    if notes:
        L.append("## Notes")
        L.append("")
        for p, n in notes:
            L.append("- %s, %s: %s" % (p["company"]["value"], p["title"]["value"], n))
        L.append("")
    L.append("## What this run did not verify")
    L.append("")
    for line in log["cannot_verify"]:
        L.append("- " + line)
    L.append("")
    L.append("## Gates")
    L.append("")
    t = log["timeline_gate"]
    L.append("- **G1, posting is live:** page checker plus the job-board answer at fetch time; uncertain results are held. Source: %s." % log["liveness_source"])
    L.append("- **G2, visa timeline:** %s." % ("passed" if t["pass"] else "FAILED") + " " + "; ".join("%s %s (%s)" % (c["id"], "ok" if c["pass"] else "fails", c["detail"]) for c in t["checks"]))
    if "lag_sensitivity" in t:
        L.append("  With a hiring lag of " + ", ".join("%d days the offer comes by %s (%s)" % (x["hiring_lag_days"], x["offer_by"], "in time" if x["in_time"] else "too late")
                 for x in t["lag_sensitivity"]["value"]) + "; the search has to start by %s for the persona's %s-day lag." % (t["start_search_by"]["value"], t["checks"][0]["detail"].split(" + ")[1].split(" ")[0]))
    L.append("- **G3, SOC code:** a person confirms that %s fits each role; until then a result is provisional." % SOC)
    g4 = log["release_gate"]
    L.append("- **G4, release:** %s" % ("cleared by %s on %s." % (g4["by"], g4["date"]) if g4 and g4["decision"] == "clear" else "not cleared yet: a person reads this report before acting on it."))
    L.append("")
    L.append("## Run record")
    L.append("")
    L.append("- Recipe: `%s` v%s" % (RECIPE, RECIPE_VERSION))
    L.append("- Data: OFLC wage year %s to %s, source zip SHA-256 `%s`" % (log["data"]["wage_year"]["start"], log["data"]["wage_year"]["end"], log["data"]["source_zip_sha256"]))
    L.append("- Machine log: `run-log.json` in this folder")
    return "\n".join(L) + "\n"


CANNOT_VERIFY = [
    "The SOC code the employer will file. This report assumes 15-1252 (Software Developers); another code moves every threshold.",
    "The actual offered salary. The posted range bounds it only if the employer keeps to its own range.",
    "Whether the employer will register at all, or files using another wage source.",
    "The chance of selection. The entries are relative weights; the real odds depend on the whole year's registration pool.",
    "Which office you would join when a posting lists several cities, or your home address for a remote role.",
    "Whether one posted range is for the listed city or a band for every US location: Pinterest's says 'US based applicants only' and that final salary depends on location.",
    "Changes to the wage levels themselves. DOL proposed new levels on 27 March 2026 (Level I would rise to about today's Level II); whether that has become final was not checked. If it takes effect, these thresholds no longer apply.",
    "Anything about the role's quality, the team, or the company's finances.",
]


def run(persona_path, postings_path, out_dir, gate_log_path=None, liveness_fixture=None, run_date=None, mode="live"):
    check_out_dir(out_dir)
    data = load_data()
    with open(persona_path, encoding="utf-8") as f:
        persona = json.load(f)
    with open(postings_path, encoding="utf-8") as f:
        postings = json.load(f)
    gates = []
    if gate_log_path:
        with open(gate_log_path, encoding="utf-8") as f:
            gates = json.load(f)
    run_date = parse_date(run_date or dt.date.today().isoformat(), "run_date")
    tl = timeline_gate(persona, run_date, data["manifest"])
    tl["human"] = gate_decision(gates, "G2", "*")
    # G4 is bound to one report: a release counts only for the run folder it names
    run_label = os.path.basename(os.path.normpath(out_dir))
    releases = [g for g in gates if g["gate"] == "G4" and g.get("run") == run_label]
    release = releases[-1] if releases else None
    log = {"recipe": RECIPE, "recipe_version": RECIPE_VERSION, "mode": mode, "run_date": str(run_date),
           "persona": labeled({k: persona[k] for k in ("name", "degree", "program_end", "opt_ead_start", "opt_ead_end", "target_metros")}, INPUT),
           "soc": labeled(SOC + " " + SOC_TITLE, MODEL),
           "data": {k: data["manifest"][k] for k in ("source_url", "source_zip_sha256", "wage_year")},
           "rule": labeled("90 FR 60864 (29 Dec 2025), effective 27 Feb 2026: entries I=1, II=2, III=3, IV=4; below I counts once; several locations use the lowest level", REC),
           "timeline_gate": tl, "release_gate": release, "released": bool(release and release["decision"] == "clear"),
           "run_label": run_label, "gate_log": gates,
           "cannot_verify": CANNOT_VERIFY, "postings": []}
    os.makedirs(out_dir, exist_ok=True)
    if not tl["pass"]:
        log["halted"] = "G2 visa timeline failed: no wage level is reported when the registration cannot happen as planned"
        log["liveness_source"] = "not run"
    else:
        live, src = liveness_results(postings, liveness_fixture)
        live["_fixture"] = bool(liveness_fixture)
        log["liveness_source"] = src
        sponsors = load_sponsors()
        log["postings"] = [evaluate(p, data, live, gates, sponsors) for p in postings]
    with open(os.path.join(out_dir, "run-log.json"), "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, default=str)
        f.write("\n")
    with open(os.path.join(out_dir, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(log))
    return log


def write_audit(data):
    m, th = data["manifest"], data["thresholds"]
    L = ["# OFLC extract audit: SOC 15-1252 wage levels, 2026-27", "", "## Executive summary", "",
         "**What this is.** A check of the small wage table this mode uses, taken from the Department of Labor's 2026-27 prevailing wage data.",
         "", "**Why read it.** Every wage level the mode reports comes from this table, so if the table is wrong, every answer is wrong.",
         "", "**What it found.** The files match their recorded fingerprints, every row passes the Level II and III arithmetic check, "
         "every city in the city table maps to a county that the Labor Department places in one of the five areas, and all five areas "
         "have wages estimated for the area itself. The table below shows how far the thresholds differ between cities.", "",
         "## Thresholds, annual (hourly x %d)" % HOURS_PER_YEAR, "",
         "| Area | Geo level | Level I | Level II | Level III | Level IV |", "|---|---|---|---|---|---|"]
    for (area, soc), t in sorted(th.items()):
        if soc == SOC:
            L.append("| %s %s | %d | %s |" % (area, t["area_name"], t["geo_level"], " | ".join(money(x) for x in t["annual"])))
    L += ["", "## The same base pay in each area", "", "| Base pay | " + " | ".join(t["area_name"].split(",")[0] for (a, s), t in sorted(th.items()) if s == SOC) + " |",
          "|---" * 6 + "|"]
    for pay in (110000, 120000, 130000, 140000, 150000, 160000, 175000):
        L.append("| %s | %s |" % (money(pay), " | ".join(level_name(level_for(pay, t["annual"])) for (a, s), t in sorted(th.items()) if s == SOC)))
    L += ["", "## Records in, records out", "",
          "- Source: %s" % m["source_url"],
          "- Source zip SHA-256: `%s`" % m["source_zip_sha256"],
          "- ALC_Export.csv: %d rows in, %d kept (SOC %s in areas %s)" % (m["source_rows"]["ALC_Export.csv"], m["outputs"]["oflc-alc-2026-27-extract.csv"]["rows"], " and ".join(m["socs"]), ", ".join(m["areas"])),
          "- Geography.csv: %d rows in, %d kept" % (m["source_rows"]["Geography.csv"], m["outputs"]["oflc-geography-extract.csv"]["rows"]),
          "- City table: %d cities, all mapped (a city whose county is not in the extract halts the run)" % len(data["cities"]),
          "- Wage year: %s to %s" % (m["wage_year"]["start"], m["wage_year"]["end"]),
          "", "## How the employer's SOC choice moves the level (illustration)", "",
          "The same pay against SOC 15-1253 (Software Quality Assurance Analysts and Testers) instead of 15-1252:", "",
          "| Area | 15-1252 Level I | 15-1253 Level I |", "|---|---|---|"]
    for (area, soc), t in sorted(th.items()):
        if soc == SOC:
            L.append("| %s | %s | %s |" % (t["area_name"].split(",")[0], money(t["annual"][0]), money(th[(area, "15-1253")]["annual"][0])))
    with open(AUDIT, "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")
    return AUDIT


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sample", action="store_true", help="run the constructed sample in fixtures/ (no network)")
    ap.add_argument("--audit", action="store_true", help="write data/oflc-extract-audit.md and exit")
    ap.add_argument("--persona")
    ap.add_argument("--postings")
    ap.add_argument("--gate-log")
    ap.add_argument("--out-dir")
    ap.add_argument("--liveness-fixture")
    ap.add_argument("--run-date")
    a = ap.parse_args(argv)
    try:
        if a.audit:
            print("wrote", os.path.relpath(write_audit(load_data()), REPO))
            return 0
        if a.sample:
            log = run(os.path.join(FIX, "persona.json"), os.path.join(FIX, "postings-sample.json"),
                      a.out_dir or os.path.join(HERE, "out", "sample"), os.path.join(FIX, "gates-sample.json"),
                      os.path.join(FIX, "liveness-sample.json"), a.run_date or "2026-10-19", mode="sample")
        else:
            if not (a.persona and a.postings and a.out_dir):
                ap.error("--persona, --postings and --out-dir are required unless --sample or --audit")
            log = run(a.persona, a.postings, a.out_dir, a.gate_log, a.liveness_fixture, a.run_date)
    except Halt as e:
        print("HALT:", e, file=sys.stderr)
        return 2
    if log.get("halted"):
        print("STOPPED:", log["halted"], file=sys.stderr)
        return 3
    counts = {}
    for p in log["postings"]:
        counts[p["status"].split(" ")[0]] = counts.get(p["status"].split(" ")[0], 0) + 1
    print("postings: %d · %s" % (len(log["postings"]), " · ".join("%s %d" % kv for kv in sorted(counts.items()))))
    print("G2 timeline:", "pass" if log["timeline_gate"]["pass"] else "FAIL")
    print("G4 release:", "released by %s" % log["release_gate"]["by"] if log["released"] else "NOT released (run %s)" % log["run_label"])
    print("wrote", os.path.relpath(os.path.join(a.out_dir or os.path.join(HERE, "out", "sample"), "report.md"), REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
