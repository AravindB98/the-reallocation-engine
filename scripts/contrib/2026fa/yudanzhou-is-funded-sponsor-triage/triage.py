#!/usr/bin/env python3
"""
is-funded-sponsor-triage: prototype for recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md

Question it answers, for an Information Systems master's student who prefers
funded companies and has not picked between Business / Data / Product Analyst
and IT Consultant:
  1. Of the funded companies in the 80-Days CSV, which have actually sponsored
     H-1B, and for which of my role families?            (record)
  2. For a list of postings, which are worth my 2 apply-hours, which go on my
     3-hour networking list, and which do I skip?         (scored by the
     existing scripts/score/role-scorer.mjs, not by this file)

Every value it writes carries a label: record | your-input | model-judgment.
This script uses NO model judgment. Fit is my own self-rating (your-input).

Run from the repo root (standard library only, Python 3.9+):
  python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py

Exit codes: 0 ok · 2 a hard gate failed (missing data / bad input) · 3 scorer failed
"""
import argparse
import ast
import csv
import glob
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
DEFAULT_FORM_D = "data/sec/form-d/processed/sample/*.sample.json"
DEFAULT_PERSONA = "search/examples/is-ms-2027-funded-undecided/persona.example.json"   # fictional; DATA_CONTRACT puts personas here
DEFAULT_OUT = "course/2026fa/submissions/yudanzhou/runs/triage"
SCORER = "scripts/score/role-scorer.mjs"

REQUIRED_COLUMNS = ["company_name", "latest_funding_stage", "latest_funding_date",
                    "Total Approvals", "Total Denials", "top_job_titles_sponsored"]

# Legal-entity suffixes dropped before comparing names ("SITE TECHNOLOGIES INC" ~ "Site Technologies, Inc.")
SUFFIX_RE = re.compile(r"\b(inc|incorporated|llc|l\.l\.c|corp|corporation|co|company|ltd|lp|l\.p|plc|holdings)\b\.?")


class GateError(Exception):
    """A hard stop. The script prints the reason and exits 2 instead of guessing."""


# ── small helpers ────────────────────────────────────────────────────────────

def normalize(name):
    s = SUFFIX_RE.sub("", name.lower())
    return re.sub(r"[^a-z0-9]", "", s)


def load_json(path):
    if not os.path.exists(path):
        raise GateError(f"input file not found: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def parse_date(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def months_between(earlier, later):
    return (later.year - earlier.year) * 12 + (later.month - earlier.month)


def parse_titles(raw):
    """The CSV stores titles as a Python-list string: "['Business Analyst', 'Consultant']"."""
    raw = (raw or "").strip()
    if not raw:
        return []
    try:
        val = ast.literal_eval(raw)
        return [str(t).strip() for t in val] if isinstance(val, (list, tuple)) else [str(val)]
    except (ValueError, SyntaxError):
        return [t.strip(" '\"") for t in raw.strip("[]").split(",") if t.strip()]


def classify(title, families):
    """Return every role family whose include-keywords hit and exclude-keywords miss."""
    t = title.lower()
    hits = []
    for fam, rule in families.items():
        if any(k in t for k in rule["include"]) and not any(k in t for k in rule["exclude"]):
            hits.append(fam)
    return hits


def to_count(raw):
    """'12.0' -> 12; '' -> None. A blank is NOT zero: it means no record was matched."""
    raw = (raw or "").strip()
    return None if raw == "" else int(float(raw))


# ── G1: data gate ────────────────────────────────────────────────────────────

def load_companies(csv_path):
    if not os.path.exists(csv_path):
        raise GateError(f"G1 data gate: CSV not found at {csv_path}")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise GateError(f"G1 data gate: CSV is missing columns {missing}")
        rows = list(reader)
    by_exact, by_norm = {}, {}
    for r in rows:
        by_exact.setdefault(r["company_name"].strip().upper(), []).append(r)
        by_norm.setdefault(normalize(r["company_name"]), []).append(r)
    return rows, by_exact, by_norm


def find_company(name, by_exact, by_norm):
    """Exact name first, then suffix-normalized name. Never fuzzy. Returns (row, status)."""
    exact = by_exact.get(name.strip().upper(), [])
    if len(exact) == 1:
        return exact[0], "matched-exact"
    cands = by_norm.get(normalize(name), [])
    if len(cands) == 1:
        return cands[0], "matched-normalized"
    if len(exact) > 1 or len(cands) > 1:
        return None, "ambiguous-company-match"
    return None, "no-company-row"


def load_form_d(pattern):
    """Map normalized company name -> latest Form D filing in the SHIPPED SAMPLES only."""
    index, files, total = {}, sorted(glob.glob(pattern)), 0
    for path in files:
        data = load_json(path)
        for c in data.get("companies", []):
            total += 1
            key = normalize(c["company"]["name"])
            filing = {"quarter": c["filing"]["quarter"], "date_filed": c["filing"]["date_filed"],
                      "file": path.replace("\\", "/")}
            index.setdefault(key, []).append(filing)
    return index, files, total


# ── G2 input (v0.2): read the repo's own liveness checker output ────────────

LIVENESS_LINE = re.compile(r"^\S+\s+(active|expired|uncertain)\s+(https?://\S+)\s*$")


def load_liveness_log(path, checked_on):
    """Parse saved output of `npm run ats:liveness -- <urls>` (scripts/ats/check-liveness.mjs).
    Each result line is `<icon> <result> <url>`. Returns {url: {"result", "source": "record", "checked_on"}}.
    A URL absent from the log stays unchecked — it is never assumed live."""
    if not os.path.exists(path):
        raise GateError(f"G2 liveness log not found: {path}")
    out = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = LIVENESS_LINE.match(line.strip())
            if m:
                out[m.group(2)] = {"result": m.group(1), "source": "record", "checked_on": checked_on,
                                   "via": "scripts/ats/check-liveness.mjs"}
    return out


# ── v0.2 gates: work location (OPT is US-only) and seniority (new-grad persona) ──

US_STATES = set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK "
                "OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split())
US_WORDS = re.compile(r"\b(United States|USA|U\.S\.|US)\b")
STATE_CODE = re.compile(r",\s*([A-Z]{2})\b")


def location_gate(loc):
    """Classify a posting location string. Returns 'us', 'non-us' or 'unclear'.
    'us' needs an explicit US marker or a US state code; a location with no country (e.g. bare 'Remote')
    is 'unclear' for a human — never assumed US. Any non-US place listed alongside a US one still counts as US-eligible."""
    loc = (loc or "").strip()
    if not loc:
        return "unclear"
    parts = [x.strip() for x in loc.split(";") if x.strip()]
    verdicts = []
    for part in parts:
        if US_WORDS.search(part) or any(c in US_STATES for c in STATE_CODE.findall(part)):
            verdicts.append("us")
        elif "," in part:
            verdicts.append("non-us")     # a place with a region/country that is not a US marker
        else:
            verdicts.append("unclear")    # e.g. 'Remote', 'Hybrid'
    if "us" in verdicts:
        return "us"
    return "non-us" if verdicts and all(v == "non-us" for v in verdicts) else "unclear"


def seniority_flag(title, markers):
    """Return the first seniority marker found in the title (word match), else None."""
    for m in markers:
        if re.search(r"(?<![A-Za-z])" + re.escape(m) + r"(?![A-Za-z])", title):
            return m
    return None


# ── G3: visa-timeline gate ───────────────────────────────────────────────────

def timeline_gate(persona, today):
    """
    OPT unemployment window = OPT start + (allowed days - days used).
    If I apply today and hiring takes `hiring_lag_days_assumed`, I can start no
    earlier than max(today + lag, OPT start). That start must fall inside the window.
    Binary gate: 1 = can still make it, 0 = the window closes first.
    Every input here is your-input; the arithmetic is the only thing the script adds.
    """
    opt_start = parse_date(persona["opt_start_date_assumed"])
    remaining = persona["unemployment_days_allowed"] - persona["unemployment_days_used"]
    window_end = opt_start + timedelta(days=remaining)
    earliest_start = max(today + timedelta(days=persona["hiring_lag_days_assumed"]), opt_start)
    factor = 1.0 if earliest_start <= window_end else 0.0
    return {
        "factor": factor, "source": "your-input",
        "opt_start": opt_start.isoformat(), "window_end": window_end.isoformat(),
        "earliest_start": earliest_start.isoformat(),
        "reason": "window open" if factor else
                  f"OPT unemployment window closes {window_end} before earliest possible start {earliest_start}",
    }


# ── sponsorship: record counts -> your-input probability ─────────────────────

def sponsorship_for(row, family, families, tiers):
    approvals = to_count(row["Total Approvals"])
    denials = to_count(row["Total Denials"])
    titles = parse_titles(row["top_job_titles_sponsored"])
    family_titles = [t for t in titles if family in classify(t, families)]
    evidence = {"total_approvals": approvals, "total_denials": denials,
                "top_titles_sponsored": titles, "titles_in_my_family": family_titles,
                "source": "record"}
    if approvals is None:
        return None, evidence  # blank = no record matched; caller holds it out, never p=0
    if approvals == 0:
        return {"p": 0.0, "tier": "None", "source": "your-input", "evidence": evidence}, evidence
    for key in ("proven", "likely", "possible"):
        t = tiers[key]
        if approvals >= t["min_approvals"] and (family_titles or not t["requires_family_match"]):
            return {"p": t["p"], "tier": t["tier"], "source": "your-input",
                    "rule": f"config.sponsorship_tiers.{key}", "evidence": evidence}, evidence
    return {"p": 0.0, "tier": "None", "source": "your-input", "evidence": evidence}, evidence


# ── Q1: which funded sponsors sponsor which of my families (whole CSV) ───────

def family_counts(rows, families, today, stale_after):
    out = {fam: {"companies": 0, "examples": []} for fam in families}
    funded_total = funded_sponsors = recent_sponsors = 0
    for r in rows:
        if not r["latest_funding_date"].strip():
            continue
        funded_total += 1
        a = to_count(r["Total Approvals"])
        if not a:
            continue
        funded_sponsors += 1
        if months_between(parse_date(r["latest_funding_date"].strip()), today) <= stale_after:
            recent_sponsors += 1
        fams = set()
        for t in parse_titles(r["top_job_titles_sponsored"]):
            fams.update(classify(t, families))
        for fam in fams:
            out[fam]["companies"] += 1
            if len(out[fam]["examples"]) < 3:
                out[fam]["examples"].append(r["company_name"])
    return {"funded_companies": funded_total, "funded_with_h1b_approvals": funded_sponsors,
            "funded_recently_with_h1b_approvals": recent_sponsors, "recent_means_months": stale_after,
            "by_family": out, "source": "record",
            "caveat": "top_job_titles_sponsored lists only a company's top titles, so a missing family is 'not in top titles', not 'never sponsored'."}


# ── main pipeline ────────────────────────────────────────────────────────────

NEXT_ACTION = {
    "Apply": "Tailor an application (2-hour apply block).",
    "Consider": "Research the soft spot first; tailor only if it clears.",
    "Skip": "Skip. Spend no apply-time here.",
    "no-h1b-record": "Networking list (3-hour block): ask a contact whether they hire OPT grads / sponsor. No record is not a no.",
    "no-company-row": "Networking list: company not in the CSV at all, so no evidence either way.",
    "ambiguous-company-match": "Human: several CSV rows match this name; pick the right one before scoring.",
    "liveness-unchecked": "Run `npm run ats:liveness -- <url>`, record the result, re-run.",
    "off-target-title": "Skip: title is outside my four target families.",
    "non-us-location": "Skip: OPT work must be in the US; this posting is outside it.",
    "location-unclear": "Human: confirm the role can be done from the US before applying.",
    "seniority-check": "Human: read the posting's years-of-experience line; this persona is a new graduate.",
    "liveness-conflict": "Human: the job board's API listed this posting the same day the page check said expired — open it yourself.",
}


HUMAN_GATES = ("location-unclear", "seniority-check", "liveness-conflict")


def load_gate_decisions(path):
    """Logged human gate decisions: {"decisions": [{posting_id, gate, decision: clear|reject, reason, by, date}]}.
    Only the human-review gates can be cleared; a non-US location or a missing record cannot."""
    d = load_json(path)
    out = {}
    for x in d.get("decisions", []):
        if x.get("gate") not in HUMAN_GATES or x.get("decision") not in ("clear", "reject"):
            raise GateError(f"gate decision not allowed: {x}")
        if not (x.get("reason") and x.get("by") and x.get("date")):
            raise GateError(f"gate decision needs reason, by and date: {x}")
        out[(x["posting_id"], x["gate"])] = x
    return out


def triage(csv_path, form_d_glob, config, persona, postings, today, liveness_log=None, gate_decisions=None):
    families = config["role_families"]
    rows, by_exact, by_norm = load_companies(csv_path)
    form_d, form_d_files, form_d_total = load_form_d(form_d_glob)
    timeline = timeline_gate(persona, today)
    stale_after = config["funding_stale_after_months"]

    scored_roles, held_out, per_posting = [], [], []
    gate_decisions = gate_decisions or {}

    def human_held(rec, gate):
        """True if the posting stays held at a human gate; a logged 'clear' lets it continue."""
        d = gate_decisions.get((rec["posting_id"], gate))
        if d:
            rec.setdefault("gate_decisions", []).append(d)
            if d["decision"] == "clear":
                return False
        rec["status"] = gate
        held_out.append(rec); per_posting.append(rec)
        return True

    for p in postings:
        rec = {"posting_id": p["posting_id"], "company": p["company"], "title": p["title"], "url": p["url"]}
        if p.get("location") is not None:
            rec["location"] = p["location"]
        fams = [f for f in classify(p["title"], families) if f in persona["target_families"]]
        rec["family"] = fams[0] if fams else None
        if not fams:
            rec["status"] = "off-target-title"
            held_out.append(rec); per_posting.append(rec); continue

        lg = config.get("location_gate")
        if lg and lg.get("enabled"):
            rec["location_verdict"] = location_gate(p.get("location"))
            if rec["location_verdict"] == "non-us":
                rec["status"] = "non-us-location"
                held_out.append(rec); per_posting.append(rec); continue
            if rec["location_verdict"] == "unclear" and human_held(rec, "location-unclear"):
                continue
        sm = config.get("seniority_markers")
        if sm:
            flag = seniority_flag(p["title"], sm)
            if flag:
                rec["seniority_marker"] = flag
                if human_held(rec, "seniority-check"):
                    continue

        row, match = find_company(p["company"], by_exact, by_norm)
        rec["company_match"] = match
        if row is None:
            rec["status"] = match
            held_out.append(rec); per_posting.append(rec); continue

        # funding facts straight from the row (record) + one derived age (script arithmetic on a record)
        fdate = row["latest_funding_date"].strip()
        rec["funding"] = {"stage": row["latest_funding_stage"] or None, "latest_date": fdate or None, "source": "record"}
        if fdate:
            age = months_between(parse_date(fdate), today)
            rec["funding"]["months_since"] = age
            rec["funding"]["stale"] = age > stale_after   # threshold is your-input (config)
        fd = form_d.get(normalize(row["company_name"]))
        rec["form_d_sample"] = {"found": bool(fd), "filings": fd or [], "source": "record",
                                "note": "searched shipped Form D samples only (50 companies/quarter)"}

        sponsorship, evidence = sponsorship_for(row, rec["family"], families, config["sponsorship_tiers"])
        rec["sponsorship_evidence"] = evidence
        if sponsorship is None:
            rec["status"] = "no-h1b-record"
            held_out.append(rec); per_posting.append(rec); continue

        # G2 liveness gate: unchecked/uncertain postings are held out, not guessed
        live = liveness_log.get(p["url"], {"result": "unchecked"}) if liveness_log is not None else p.get("liveness", {})
        rec["liveness"] = live
        result = live.get("result", "unchecked")
        if result == "expired" and p.get("listed_in_board_api"):
            # two records disagree: the board API listed it, the page check found no content — a human decides
            if human_held(rec, "liveness-conflict"):
                continue
            result = "active"   # a human opened it and cleared the conflict
        if result not in ("active", "expired"):
            rec["status"] = "liveness-unchecked"
            held_out.append(rec); per_posting.append(rec); continue
        liveness = {"factor": 1.0 if result == "active" else 0.0,
                    "source": live.get("source", "your-input"), "checked_on": live.get("checked_on")}

        role = {
            "role_id": p["posting_id"], "company": p["company"], "title": p["title"],
            "sponsorship": sponsorship,
            "fit": {"p": persona["self_rated_fit"][rec["family"]], "source": "your-input",
                    "basis": f"self-rated fit for family {rec['family']}"},
            "liveness": liveness,
            "timeline": {"factor": timeline["factor"], "source": "your-input"},
        }
        rec["status"] = "scored"
        scored_roles.append(role); per_posting.append(rec)

    summary = family_counts(rows, families, today, stale_after)
    summary["form_d_sample"] = {"files": form_d_files, "companies_in_samples": form_d_total, "source": "record"}
    return scored_roles, held_out, per_posting, timeline, summary


def run_scorer(roles_path, out_dir):
    cmd = ["node", SCORER, roles_path, "--out-dir", out_dir]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    except FileNotFoundError:
        raise GateError("node is not on PATH; cannot run the existing scorer")
    print(proc.stdout.rstrip())
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise RuntimeError(f"scorer exited {proc.returncode}")
    return load_json(os.path.join(out_dir, "role-scores.json"))


def write_report(path, today, persona, timeline, summary, per_posting, scores, liveness_log_used=False):
    by_id = {r["role_id"]: r for r in (scores or {}).get("roles", [])}
    L = []
    L.append("# IS funded-sponsor triage: run report\n")
    L.append("## Executive summary\n")
    n_apply = sum(1 for r in by_id.values() if r.get("recommendation") == "Apply")
    n_network = sum(1 for r in per_posting if r["status"] in ("no-h1b-record", "no-company-row"))
    L.append(f"This report checks {len(per_posting)} job postings for a fictional Information Systems master's student who "
             f"prefers funded companies and needs H-1B sponsorship. Of the funded companies in the shipped data, only "
             f"**{summary['funded_with_h1b_approvals']:,} of {summary['funded_companies']:,}** have any H-1B approval on record, "
             f"and only **{summary['funded_recently_with_h1b_approvals']:,}** of those raised money in the last {summary['recent_means_months']} months. "
             f"Result: **{n_apply}** posting(s) worth an application today, **{n_network}** company(ies) for the networking list "
             f"(no record, which is not a no), and the rest are skipped or blocked on a check a human must do. "
             f"Every number is labeled: `record` came from a data file; `your-input` is my own assumption or rule.\n")
    joined = sum(1 for r in per_posting if r.get("sponsorship_evidence"))
    if not joined:
        L.append(f"*Context only: no posting in this run reached the sponsorship lookup, so the dataset counts above "
                 f"informed none of the {len(per_posting)} decisions below.*\n")

    L.append("## Run record\n")
    L.append(f"- Run date (`--today`): {today}")
    L.append(f"- Persona: `{persona['persona_id']}` (fictional; your-input)")
    L.append(f"- Visa-timeline gate: factor **{timeline['factor']}** [your-input]. OPT start {timeline['opt_start']}, "
             f"window ends {timeline['window_end']}, earliest start {timeline['earliest_start']} ({timeline['reason']})\n")

    L.append("## Which of my role families do funded sponsors actually sponsor? [record]\n")
    L.append("| Role family | Funded companies with H-1B approvals whose top sponsored titles include it | Examples |")
    L.append("|---|---|---|")
    for fam, v in sorted(summary["by_family"].items(), key=lambda kv: -kv[1]["companies"]):
        L.append(f"| {fam} | {v['companies']} | {', '.join(v['examples'])} |")
    L.append(f"\n*Caveat: {summary['caveat']}*\n")
    if not joined:
        L.append("*This table is background from the dataset, not an output of this run's decisions.*\n")

    L.append("## Per-posting decision\n")
    L.append("| Posting | Company | Family | Status | Sponsorship evidence [record] | Funding [record] | Recommendation | Next action |")
    L.append("|---|---|---|---|---|---|---|---|")
    for r in per_posting:
        ev = r.get("sponsorship_evidence")
        ev_s = "—" if not ev else (f"approvals {ev['total_approvals']}, denials {ev['total_denials']}; "
                                    f"family titles: {', '.join(ev['titles_in_my_family']) or 'none in top titles'}"
                                    if ev["total_approvals"] is not None else "approvals blank (no record)")
        fu = r.get("funding")
        fu_s = "—" if not fu else f"{fu['stage'] or '?'} {fu['latest_date'] or '?'}" + (" (stale)" if fu.get("stale") else "")
        if r["status"] == "scored":
            s = by_id.get(r["posting_id"], {})
            rec = s.get("recommendation", "(not scored)")
            comp = s.get("composite")
            rec_s = f"**{rec}** ({comp:.3f})" if isinstance(comp, (int, float)) else rec
            action = NEXT_ACTION.get(rec, "")
        else:
            rec_s, action = "held out", NEXT_ACTION[r["status"]]
            for gd in r.get("gate_decisions", []):
                action += f" **Gate decision:** {gd['decision']} by {gd['by']} {gd['date']} — {gd['reason']}"
        L.append(f"| {r['posting_id']} {r['title']} | {r['company']} | {r.get('family') or '—'} | {r['status']} | {ev_s} | {fu_s} | {rec_s} | {action} |")

    L.append("\n## What this run did not verify\n")
    if liveness_log_used:
        L.append("- Liveness came from the repo's `ats:liveness` checker (`record`), which can misread JavaScript-rendered career pages; "
                 "postings it calls expired while the board API listed them are held as `liveness-conflict`"
                 + ("." if any(r["status"] == "liveness-conflict" for r in per_posting) else " (no row hit this in this run)."))
    else:
        L.append("- Whether any posting is real or live: demo postings and liveness values are `your-input`.")
    L.append("- Whether a company hires **OPT** graduates: the data only has H-1B approvals.")
    L.append("- Whether the employer is in **E-Verify** (required for STEM OPT): not in any shipped file.")
    L.append("- The sponsorship probability `p`: it is my mapping from approval counts (config.json), not a measured probability.")
    L.append("- Funding recency beyond 2025-09: the CSV's latest funding date is 2025-09-26; Form D lookups cover the shipped 50-company samples only.")
    if by_id:
        L.append("\n*Scored rows come from `scripts/score/role-scorer.mjs`; see `role-scores.md` in this folder for the term-by-term audit.*")
    else:
        L.append("\n*No row was scored in this run, so `role-scores.md` in this folder is an empty table "
                 "(the shared scorer prints `skip NaN%` when it receives zero roles; recorded, not changed here).*")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L) + "\n")


def main(argv=None):
    # Windows consoles default to cp1252 and crash on ✓ / →; force UTF-8 output.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", default=DEFAULT_CSV)
    ap.add_argument("--form-d", default=DEFAULT_FORM_D, help="glob of Form D sample files")
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--persona", default=DEFAULT_PERSONA)
    ap.add_argument("--postings", default=os.path.join(HERE, "fixtures", "postings.sample.json"))
    ap.add_argument("--out-dir", default=DEFAULT_OUT)
    ap.add_argument("--today", default=None, help="YYYY-MM-DD; defaults to the real date")
    ap.add_argument("--no-score", action="store_true", help="write roles.json but do not call the scorer")
    ap.add_argument("--liveness-log", default=None, help="saved output of `npm run ats:liveness`; overrides fixture liveness")
    ap.add_argument("--liveness-date", default=None, help="YYYY-MM-DD the liveness log was produced")
    ap.add_argument("--gate-decisions", default=None, help="JSON of logged human gate decisions (clear/reject)")
    a = ap.parse_args(argv)

    try:
        today = parse_date(a.today) if a.today else date.today()
        config, persona = load_json(a.config), load_json(a.persona)
        postings = load_json(a.postings)["postings"]
        live_log = load_liveness_log(a.liveness_log, a.liveness_date or today.isoformat()) if a.liveness_log else None
        gates = load_gate_decisions(a.gate_decisions) if a.gate_decisions else None
        roles, held, per_posting, timeline, summary = triage(a.csv, a.form_d, config, persona, postings, today, live_log, gates)
    except GateError as e:
        print(f"✗ STOP: {e}", file=sys.stderr)
        return 2

    os.makedirs(a.out_dir, exist_ok=True)
    roles_path = os.path.join(a.out_dir, "roles.json")
    with open(roles_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(roles, f, indent=2)
    print(f"✓ triage: {len(postings)} postings → {len(roles)} scored · {len(held)} held out "
          f"(timeline gate {timeline['factor']}) → {roles_path}")

    scores = None
    if not a.no_score:
        try:
            scores = run_scorer(roles_path, a.out_dir)
        except (GateError, RuntimeError) as e:
            print(f"✗ STOP: {e}", file=sys.stderr)
            return 3

    log = {"_recipe": "recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md", "run_date": today.isoformat(),
           "inputs": {"csv": a.csv, "form_d_glob": a.form_d, "config": a.config, "persona": a.persona, "postings": a.postings},
           "timeline_gate": timeline, "summary": summary, "postings": per_posting,
           "scorer_output": os.path.join(a.out_dir, "role-scores.json") if scores else None}
    with open(os.path.join(a.out_dir, "triage-log.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(log, f, indent=2)
    write_report(os.path.join(a.out_dir, "triage-report.md"), today, persona, timeline, summary, per_posting, scores, bool(a.liveness_log))
    print(f"  {a.out_dir}/triage-log.json  +  {a.out_dir}/triage-report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
