#!/usr/bin/env python3
"""coop_sponsor_check.py — co-op sponsor check for software roles (SOC 15-1252 / 15-1254).

For an F-1 master's student choosing a co-op: has this company a *recorded*
history of sponsoring software work, so the co-op can convert to a sponsored
full-time job? Builds a roles.json per graduation scenario, runs the EXISTING
scorer (scripts/score/role-scorer.mjs — not a copy), and writes:

  <out>/run-log.json        agent-facing log (every value labeled + its source)
  <out>/report.md           person-facing report
  <out>/<scenario>/roles.json, role-scores.json, role-scores.md   scorer I/O

Every value carries a label: record | model-judgment | your-input.
No network calls. Reads only repo files and the input JSON you pass.

  python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py \
      [--input <persona.json>] [--out-dir <dir>]
"""

import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))

DEFAULT_INPUT = os.path.join(HERE, "inputs", "sample-persona.json")
DEFAULT_OUT = os.path.join(REPO, "course", "2026fa", "submissions", "arundhatik26", "runs", "sample")
SPONSOR_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
BLS_CSV = "data/bls/compact/soc_occupation_compact.csv"
SCORER = "scripts/score/role-scorer.mjs"

REC, MODEL, YOU = "record", "model-judgment", "your-input"

# Legal-form words dropped before exact matching. Nothing else is fuzzy:
# "MELLON" alone must NOT match "TAMARA MELLON BRAND INC".
SUFFIXES = {"INC", "CORP", "CORPORATION", "LLC", "CO", "LTD", "THE", "LP",
            "PBC", "COMPANY", "INCORPORATED", "PLC"}

# What counts as "software work" in top_job_titles_sponsored.
SOFTWARE_TITLE = re.compile(
    r"software|full[\s-]?stack|back[\s-]?end|front[\s-]?end|developer|programmer|application development",
    re.I)


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


def parse_date(s, field):
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        raise InputError(f"{field}: '{s}' is not an ISO date (YYYY-MM-DD)")


def add_months(d, months):
    y, m = divmod(d.month - 1 + months, 12)
    return date(d.year + y, m + 1, min(d.day, 28))


# ── loaders ────────────────────────────────────────────────────────────────

def load_sponsor_index(path):
    """normalized name → list of CSV rows (a list, because 209 names repeat)."""
    if not os.path.exists(path):
        raise InputError(f"sponsor CSV missing: {path}")
    idx = {}
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        need = {"company_name", "Total Approvals", "Approval_Rate",
                "top_job_titles_sponsored", "latest_funding_date", "median_salary_offered"}
        missing = need - set(reader.fieldnames or [])
        if missing:
            raise InputError(f"sponsor CSV missing columns: {sorted(missing)}")
        for line_no, row in enumerate(reader, start=2):
            row["_line"] = line_no
            idx.setdefault(norm_name(row["company_name"]), []).append(row)
    return idx


def load_bls(path):
    if not os.path.exists(path):
        raise InputError(f"BLS CSV missing: {path}")
    out = {}
    with open(path, encoding="utf-8", newline="") as f:
        for line_no, row in enumerate(csv.DictReader(f), start=2):
            row["_line"] = line_no
            # first row per BLS code; for 15-1252 / 15-1254 that is the .00 row
            out.setdefault(row["bls_soc_code"], row)
    return out


def load_liveness(path):
    """Parse saved `npm run ats:liveness` output: url → active|expired|uncertain."""
    if not path:
        return {}
    if not os.path.exists(path):
        raise InputError(f"liveness record missing: {path}")
    out = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^\S+\s+(active|expired|uncertain)\s+(\S+)", line.strip())
            if m:
                out[m.group(2)] = m.group(1)
    return out


# ── evidence ───────────────────────────────────────────────────────────────

def resolve_company(role, idx, rules):
    """Exact (suffix-stripped) match on any of role['match_names'].

    statuses: matched | not-in-dataset | no-sponsorship-record | ambiguous
    """
    names = role.get("match_names") or [role["company"]]
    hits = {}
    for n in names:
        for row in idx.get(norm_name(n), []):
            hits[row["_line"]] = row
    rows = list(hits.values())
    base = {"searched_names": labeled(names, YOU), "csv": SPONSOR_CSV}

    if not rows:
        return {**base, "status": "not-in-dataset", "rows": [],
                "note": "No row in the 80 Days CSV. This is NOT evidence the company does not sponsor."}
    if len(rows) > 1:
        return {**base, "status": "ambiguous",
                "rows": [{"csv_line": r["_line"], "company_name": r["company_name"],
                          "total_approvals": to_float(r["Total Approvals"])} for r in rows],
                "note": "More than one CSV row matched. A human must decide which (if any) is this employer (gate G2)."}

    r = rows[0]
    approvals = to_float(r["Total Approvals"])
    prov = {"csv_line": r["_line"], "csv_name": r["company_name"]}
    titles_raw = r["top_job_titles_sponsored"] or ""
    titles = re.findall(r"'([^']*)'|\"([^\"]*)\"", titles_raw)
    titles = [a or b for a, b in titles]
    sw = [t for t in titles if SOFTWARE_TITLE.search(t)]
    ev = {
        **base, "rows": [prov],
        "csv_name": labeled(r["company_name"], REC, **prov),
        "total_approvals": labeled(approvals, REC, column="Total Approvals", **prov),
        "approval_rate": labeled(to_float(r["Approval_Rate"]), REC, column="Approval_Rate", **prov),
        "median_salary_offered": labeled(to_float(r["median_salary_offered"]), REC, column="median_salary_offered", **prov),
        "top_titles": labeled(titles, REC, column="top_job_titles_sponsored", **prov),
        "software_titles": labeled(sw, REC, column="top_job_titles_sponsored", derived_by="SOFTWARE_TITLE regex", **prov),
        "latest_funding_date": labeled(r["latest_funding_date"] or None, REC, column="latest_funding_date", **prov),
    }
    if approvals is None or approvals <= 0:
        ev["status"] = "no-sponsorship-record"
        ev["note"] = "CSV row exists but Total Approvals is blank/zero: unknown, not 'does not sponsor'."
        return ev

    ev["status"] = "matched"
    proven_min = rules["proven_min_approvals"]
    if sw and approvals >= proven_min:
        tier, p = "Proven", rules["p_proven"]
    elif sw:
        tier, p = "Likely", rules["p_likely"]
    else:
        tier, p = "Possible", rules["p_sponsors_not_software"]
    ev["tier"] = labeled(tier, YOU, rule=f"software title in top titles AND approvals >= {proven_min} → Proven; "
                                         f"software title, fewer approvals → Likely; approvals but no software title → Possible")
    ev["p"] = labeled(p, YOU, rule="tier → probability mapping set in input 'rules'")
    return ev


def soc_context(soc, bls):
    row = bls.get(soc)
    if row is None:
        return {"status": "no-occupation-row", "soc": labeled(soc, YOU)}
    prov = {"csv": BLS_CSV, "csv_line": row["_line"]}
    return {
        "status": "ok", "soc": labeled(soc, YOU),
        "title": labeled(row["title"], REC, **prov),
        "oews_year": labeled(row["oews_year"], REC, **prov),
        "annual_median_wage": labeled(to_float(row["annual_median_wage"]), REC, column="annual_median_wage", **prov),
        "note": "National median for the occupation, context only. The scorer's role_quality weight is 0.0, so this does not change any decision.",
    }


def liveness_gate(role, live):
    url = role.get("posting_url")
    manual = role.get("liveness_manual")
    if url and url in live:
        res = live[url]
        return {"status": res, "factor": labeled(1.0 if res == "active" else 0.0, REC,
                                                 path=role.get("_liveness_path"), url=url)}
    if manual:
        ok = manual.get("result") == "active"
        return {"status": f"manual-{manual.get('result')}",
                "factor": labeled(1.0 if ok else 0.0, YOU, checked_on=manual.get("checked_on"),
                                  note=manual.get("note"))}
    # Fail closed. The scorer defaults a MISSING liveness to 1.0, so never omit it.
    return {"status": "unchecked", "factor": labeled(0.0, YOU, rule="fail-closed: no liveness evidence → gate closed")}


def timeline_gate(role, scenario, as_of):
    grad = parse_date(scenario["graduation"], f"scenario {scenario['name']}.graduation")
    start = parse_date(role["coop_start"], f"{role['role_id']}.coop_start")
    end = parse_date(role["coop_end"], f"{role['role_id']}.coop_end")
    reasons = []
    if grad <= as_of:
        reasons.append(f"graduation {grad} is not after as-of {as_of}")
    if start < as_of:
        reasons.append(f"co-op start {start} is already past (as-of {as_of})")
    if end > grad:
        reasons.append(f"co-op ends {end}, after graduation {grad} (CPT requires enrolment)")
    if end < start:
        reasons.append(f"co-op end {end} before start {start}")
    opt_end = add_months(grad, scenario["opt_months"])
    stem_end = add_months(opt_end, scenario["stem_months"])
    lotteries = [y for y in range(grad.year, stem_end.year + 1)
                 if grad <= date(y, 3, 1) < stem_end]
    return {
        "status": "closed" if reasons else "open",
        "reasons": reasons,
        "factor": labeled(0.0 if reasons else 1.0, YOU, rule="open (1.0) or closed (0.0); no partial credit invented"),
        "opt_window": labeled({"opt_start_earliest": str(grad), "opt_end": str(opt_end), "stem_opt_end": str(stem_end)},
                              YOU, rule=f"graduation + {scenario['opt_months']} mo OPT + {scenario['stem_months']} mo STEM OPT (assumed, not checked)"),
        "march_lotteries_in_window": labeled(lotteries, YOU, rule="Marches between graduation and STEM OPT end (assumed rule, not checked)"),
    }


# ── scorer handoff ─────────────────────────────────────────────────────────

def to_scorer_role(role, comp, live, tl):
    out = {"role_id": role["role_id"], "company": role["company"], "title": role["title"],
           "fit": {"p": role["fit"], "source": YOU},
           "liveness": {"factor": live["factor"]["value"], "source": live["factor"]["source"]},
           "timeline": {"factor": tl["factor"]["value"], "source": YOU}}
    if comp["status"] == "matched":
        out["sponsorship"] = {"p": comp["p"]["value"], "tier": comp["tier"]["value"], "source": REC}
    else:
        # Unknown is not zero: no p is passed, tier says why.
        out["sponsorship"] = {"tier": "Unknown", "source": REC}
    return out


def run_scorer(roles_path, out_dir):
    cmd = ["node", os.path.join(REPO, SCORER), roles_path, "--out-dir", out_dir]
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    if p.returncode != 0:
        raise InputError(f"scorer failed ({p.returncode}): {p.stderr.strip()}")
    with open(os.path.join(out_dir, "role-scores.json"), encoding="utf-8") as f:
        return json.load(f), p.stdout.strip()


def next_action(comp, live, scored_by_scenario):
    recs = {s: r["recommendation"] for s, r in scored_by_scenario.items()}
    if comp["status"] == "ambiguous":
        return "HUMAN CHECK (G2): pick the right CSV row before trusting anything below"
    if comp["status"] in ("not-in-dataset", "no-sponsorship-record"):
        return "NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly"
    if live["factor"]["value"] == 0.0 and comp.get("tier", {}).get("value") in ("Proven", "Likely"):
        return "NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting"
    if len(set(recs.values())) > 1:
        return ("DEPENDS ON GRADUATION DATE: " + ", ".join(f"{v} if {k}" for k, v in recs.items())
                + " — settle your co-op/graduation plan before tailoring")
    if any(v == "Apply" for v in recs.values()):
        return "TAILOR APPLICATION"
    if any(v == "Consider" for v in recs.values()):
        return "CONSIDER: tailor only if time remains this week"
    return "SKIP"


# ── reports ────────────────────────────────────────────────────────────────

def fmt(v):
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:,.0f}" if v >= 1000 else f"{v:g}"
    if isinstance(v, list):
        return "; ".join(map(str, v)) or "—"
    return str(v)


def render_report(log):
    o = []
    rows = log["roles"]
    n = len(rows)
    acts = [r["next_action"].split(":")[0] for r in rows]
    o.append(f"# Co-op sponsor check — {log['persona']['value'].split(' — ')[0]} — {log['as_of']['value']}")
    o.append("")
    o.append("## Executive summary")
    o.append("")
    o.append(f"This report checks {n} co-op software roles against the repository's sponsorship records, "
             "to see which employers have a recorded history of sponsoring software work — so a co-op there "
             "has a real path to a sponsored full-time job. It only reports what a record shows; where there is "
             "no record it says so, and sends you to ask a person instead.")
    o.append("")
    o.append(f"**Next actions:** " + " · ".join(f"{a} ×{acts.count(a)}" for a in dict.fromkeys(acts)) + ".")
    o.append("")
    o.append("**You still decide:** whether each matched company row is really the employer (G2), and whether to apply.")
    o.append("")
    o.append("## Decisions")
    o.append("")
    hdr = "| Role | Company evidence | Liveness | " + " | ".join(f"Scorer: {s}" for s in log["scenarios"]) + " | Next action |"
    o.append(hdr)
    o.append("|" + "---|" * (4 + len(log["scenarios"])))
    for r in rows:
        c = r["company"]
        if c["status"] == "matched":
            ce = (f"{c['tier']['value']} [your-input rule] — {fmt(c['total_approvals']['value'])} approvals, "
                  f"software titles: {len(c['software_titles']['value'])} [record]")
        elif c["status"] == "ambiguous":
            ce = "AMBIGUOUS: " + "; ".join(f"{x['company_name']} ({fmt(x['total_approvals'])})" for x in c["rows"]) + " [record]"
        else:
            ce = f"{c['status']} [record]"
        lv = f"{r['liveness']['status']} → {r['liveness']['factor']['value']} [{r['liveness']['factor']['source']}]"
        sc = " | ".join(f"{r['scenarios'][s]['recommendation']} ({r['scenarios'][s]['composite']}); timeline {r['scenarios'][s]['timeline']['status']}"
                        for s in log["scenarios"])
        o.append(f"| {r['company_input']['value']} — {r['title']['value']} | {ce} | {lv} | {sc} | **{r['next_action']}** |")
    o.append("")
    o.append("## Verified vs. inferred")
    o.append("")
    o.append("| Value | Label | Where it came from |")
    o.append("|---|---|---|")
    o.append("| H-1B approvals, approval rate, top sponsored titles, funding date, median salary offered | record | 80 Days CSV, line number in run-log.json |")
    o.append("| Occupation median wage (SOC) | record | BLS compact CSV — context only, scorer weight 0 |")
    o.append("| Liveness from `npm run ats:liveness` | record | saved checker output |")
    o.append("| Liveness typed in by hand, or 'unchecked' (fail-closed → 0) | your-input | input file |")
    o.append("| Sponsorship tier and probability | your-input | the rule in input `rules` applied to record fields |")
    o.append("| Fit | your-input | self-rated in the input file (no model was called) |")
    o.append("| Graduation dates, OPT/STEM months, co-op dates, lottery count | your-input | input file; immigration rules NOT checked |")
    o.append("| Composite and Apply/Consider/Skip | computed | existing scorer `scripts/score/role-scorer.mjs` |")
    o.append("")
    o.append("## Occupation context (not scored)")
    o.append("")
    for soc, ctx in log["soc_context"].items():
        if ctx["status"] == "ok":
            o.append(f"- {soc} {ctx['title']['value']}: national median {fmt(ctx['annual_median_wage']['value'])} "
                     f"(OEWS {ctx['oews_year']['value']}) [record]")
        else:
            o.append(f"- {soc}: {ctx['status']} — no value shown")
    o.append("")
    o.append("## Timeline by scenario")
    o.append("")
    for s, sc in log["scenarios"].items():
        any_role = rows[0]["scenarios"][s]["timeline"]
        w = any_role["opt_window"]["value"]
        o.append(f"- **{s}** — graduation {sc['graduation']}; OPT ends {w['opt_end']}; STEM OPT ends {w['stem_opt_end']}; "
                 f"March lotteries in window: {fmt(any_role['march_lotteries_in_window']['value'])} [your-input assumptions]")
    o.append("")
    o.append("## What this cannot tell you")
    o.append("")
    o.append("- Whether a company *not* in the CSV sponsors — absence is not a 'no'.")
    o.append("- Whether a company sponsored software roles that are not among its *top* listed titles.")
    o.append("- Whether a co-op converts to full-time, or whether the employer will sponsor *you*.")
    o.append("- Whether the OPT/STEM/lottery rules above are current — they are assumptions, not records.")
    o.append("- Liveness for Workday-hosted boards beyond what the generic checker sees.")
    o.append("")
    o.append("## Gates held for a human")
    o.append("")
    for r in rows:
        held = [g for g, v in r["gates"].items() if v != "pass"]
        if held:
            o.append(f"- {r['company_input']['value']}: " + ", ".join(f"{g} = {r['gates'][g]}" for g in held))
    o.append("")
    o.append("*Machine-readable log: `run-log.json` (same folder). Scorer audit per scenario: `<scenario>/role-scores.md`.*")
    return "\n".join(o) + "\n"


# ── main ───────────────────────────────────────────────────────────────────

def validate_input(cfg):
    for k in ("persona", "as_of", "scenarios", "roles", "rules"):
        if k not in cfg:
            raise InputError(f"input missing '{k}'")
    if not cfg["roles"]:
        raise InputError("input has no roles")
    for r in cfg["roles"]:
        for k in ("role_id", "company", "title", "soc", "fit", "coop_start", "coop_end"):
            if k not in r:
                raise InputError(f"role {r.get('role_id', '?')} missing '{k}'")
        if not (isinstance(r["fit"], (int, float)) and 0 <= r["fit"] <= 1):
            raise InputError(f"role {r['role_id']}: fit must be a number in [0, 1]")


def run(input_path, out_dir, sponsor_csv=None, bls_csv=None):
    with open(input_path, encoding="utf-8") as f:
        cfg = json.load(f)
    validate_input(cfg)
    as_of = parse_date(cfg["as_of"], "as_of")

    sponsor_path = os.path.join(REPO, sponsor_csv or cfg.get("sponsor_csv") or SPONSOR_CSV)
    bls_path = os.path.join(REPO, bls_csv or cfg.get("bls_csv") or BLS_CSV)
    live_path = cfg.get("liveness_record")
    live_abs = os.path.join(REPO, live_path) if live_path else None

    idx = load_sponsor_index(sponsor_path)
    bls = load_bls(bls_path)
    live = load_liveness(live_abs)

    os.makedirs(out_dir, exist_ok=True)
    per_role = []
    for role in cfg["roles"]:
        role["_liveness_path"] = live_path
        per_role.append({"role": role,
                         "company": resolve_company(role, idx, cfg["rules"]),
                         "liveness": liveness_gate(role, live)})

    scenario_results = {}
    for sc in cfg["scenarios"]:
        sc_dir = os.path.join(out_dir, sc["name"])
        os.makedirs(sc_dir, exist_ok=True)
        roles_json, tls = [], {}
        for pr in per_role:
            tl = timeline_gate(pr["role"], sc, as_of)
            tls[pr["role"]["role_id"]] = tl
            roles_json.append(to_scorer_role(pr["role"], pr["company"], pr["liveness"], tl))
        roles_path = os.path.join(sc_dir, "roles.json")
        with open(roles_path, "w", encoding="utf-8") as f:
            json.dump(roles_json, f, indent=2)
        scored, stdout = run_scorer(roles_path, sc_dir)
        scenario_results[sc["name"]] = {"tl": tls, "scored": {s["role_id"]: s for s in scored["roles"]},
                                        "stdout": stdout, "graduation": sc["graduation"]}

    socs = sorted({r["soc"] for r in cfg["roles"]})
    log = {
        "_tool": "arundhatik26-coop-sponsor-swe-15-1252",
        "persona": labeled(cfg["persona"], YOU),
        "as_of": labeled(cfg["as_of"], YOU),
        "inputs": {
            "input_file": os.path.relpath(input_path, REPO),
            "sponsor_csv": {"path": os.path.relpath(sponsor_path, REPO), "sha256": sha256(sponsor_path)},
            "bls_csv": {"path": os.path.relpath(bls_path, REPO), "sha256": sha256(bls_path)},
            "liveness_record": live_path,
            "rules": labeled(cfg["rules"], YOU),
        },
        "scenarios": {k: {"graduation": v["graduation"], "scorer_stdout": v["stdout"]} for k, v in scenario_results.items()},
        "soc_context": {s: soc_context(s, bls) for s in socs},
        "roles": [],
    }
    for pr in per_role:
        rid = pr["role"]["role_id"]
        comp = pr["company"]
        scen = {}
        for name, res in scenario_results.items():
            s = res["scored"][rid]
            scen[name] = {"timeline": res["tl"][rid], "composite": s["composite"],
                          "recommendation": s["recommendation"], "reason": s["reason"],
                          "scorer_trace": s["trace"]}
        gates = {
            "G1-input": "pass",
            "G2-company-match": "pass-pending-human-confirm" if comp["status"] == "matched" else comp["status"],
            "G3-liveness": "pass" if pr["liveness"]["factor"]["value"] == 1.0 else pr["liveness"]["status"],
            "G4-timeline": "pass" if all(v["timeline"]["status"] == "open" for v in scen.values())
                           else ",".join(f"{k}:{v['timeline']['status']}" for k, v in scen.items()),
            "G5-decision": "awaiting-human",
        }
        log["roles"].append({
            "role_id": rid,
            "company_input": labeled(pr["role"]["company"], YOU),
            "title": labeled(pr["role"]["title"], YOU),
            "soc": labeled(pr["role"]["soc"], YOU),
            "fit": labeled(pr["role"]["fit"], YOU, note="self-rated; no model call"),
            "company": comp,
            "liveness": pr["liveness"],
            "scenarios": scen,
            "gates": gates,
            "next_action": next_action(comp, pr["liveness"], scen),
        })

    with open(os.path.join(out_dir, "run-log.json"), "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)
    with open(os.path.join(out_dir, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(log))
    return log


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--input", default=DEFAULT_INPUT)
    ap.add_argument("--out-dir", default=DEFAULT_OUT)
    a = ap.parse_args(argv)
    out = os.path.abspath(a.out_dir)
    try:
        log = run(os.path.abspath(a.input), out)
    except InputError as e:
        print(f"✗ stopped: {e}", file=sys.stderr)
        return 2
    for name, sc in log["scenarios"].items():
        print(f"[{name}] {sc['scorer_stdout'].splitlines()[0]}")
    for r in log["roles"]:
        print(f"  {r['role_id']:28} {r['company']['status']:22} liveness={r['liveness']['status']:10} → {r['next_action']}")
    print(f"✓ wrote {os.path.relpath(os.path.join(out, 'run-log.json'), REPO)} + report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
