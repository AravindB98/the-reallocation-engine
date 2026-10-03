"""report.py — writes the human report and the audit for run_sample.py.

Both files are built only from the run log, so the report cannot say
anything the log does not record. Standard library only.
"""

DECISIONS = ["Apply", "Consider", "Skip"]
TERMS = ["sponsorship", "fit", "liveness", "timeline"]


# Count how many roles got each scorer decision.
def decision_counts(run_log):
    counts = {decision: 0 for decision in DECISIONS}
    for role in run_log["roles"]:
        counts[role["scorer"]["recommendation"]] += 1
    return counts


# Make text safe inside a Markdown table cell.
def _cell(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


# Show a dollar amount from the CSV with commas, or a dash if blank.
def _money(amount):
    return "—" if amount is None else f"${float(amount):,.0f}"


# One line of funding context, clearly marked as not scored.
def _funding_text(funding):
    if funding is None:
        return "— (no CSV row) [record; context only, not scored]"
    return f"{_money(funding['amount'])} {funding['stage'] or '—'} ({funding['date'] or '—'}) [record; context only, not scored]"


# The tier evidence: matched titles, approvals and rate, or the Unknown reason.
def _sponsorship_text(sp):
    if sp["tier"] == "Unknown":
        return f"Unknown ({sp['reason']}); p omitted [record]"
    titles = ", ".join(f"\"{m['sponsored_title']}\"" for m in sp["matched_titles"]) or "none"
    return (f"{sp['tier']} p={sp['p']} [record]; matched titles: {titles}; "
            f"approvals {sp['approvals']:,}, denials {sp['denials']:,}, rate {sp['approval_rate']:.1f} [record]")


# The liveness gate value with its evidence status.
def _liveness_text(lv):
    evidence = "evidence file found" if lv["evidence_found"] else "no saved check output"
    return f"{lv['label']} → {lv['factor']} [{lv['source']}; {evidence}]"


# The timeline factor with the dates that produced it.
def _timeline_text(tl):
    lag = f"{tl['hiring_lag_weeks']} wk" + (" (default)" if tl["default_used"] else "")
    return (f"{tl['factor']:.3f} [your-input]; lag {lag}, start {tl['expected_start']}, "
            f"deadline {tl['deadline']}")


# Count terms labeled model-judgment, so the report can state the number.
def _model_judgment_count(run_log):
    return sum(role[term]["source"] == "model-judgment" for role in run_log["roles"] for term in TERMS)


# The plain-language summary that opens the report.
def _summary(run_log):
    roles, counts = run_log["roles"], decision_counts(run_log)
    n, skips = len(roles), counts["Skip"]
    rate = skips / n * 100
    health = "at or above" if skips / n >= 0.5 else "below"
    audit = audit_counts(run_log)
    return [
        "## Executive summary", "",
        f"This report sorts {n} job postings into apply, network-first, or drop, for a candidate on "
        "post-graduation work authorization who needs visa sponsorship. It is a sample run on fictional "
        "postings, so read it to check the method, not to choose real jobs.", "",
        f"**Result:** Apply {counts['Apply']} · Consider {counts['Consider']} · Skip {skips}. "
        f"Skip rate {rate:.0f}%, {health} the 50% a healthy run skips.",
        f"{audit['timeline_gated']} role(s) were dropped because the hire could not start before the "
        f"unemployment deadline, and {audit['liveness_gated']} because the posting had expired. "
        f"{audit['unknown']} employer(s) had no sponsorship record to judge.", "",
        "**How to read the labels:** every input value is labeled *record* (from a public dataset), "
        "*your-input* (typed by the candidate) or *model-judgment* (an AI's opinion). "
        f"This run has {_model_judgment_count(run_log)} model-judgment values.",
        "*scorer output* marks values computed by the existing scorer from those labeled inputs — "
        "every input value is still labeled record / your-input / model-judgment.", "",
    ]


# The technical run record, after the summary.
def _run_record(run_log):
    lines = ["## Run record", "",
             f"- Run id `{run_log['run_id']}` · today `{run_log['today']}` · mode `{run_log['mode']}`",
             f"- Strong-fit cutoff for Unknown tiers: {run_log['strong_fit']['value']} [your-input]",
             f"- Scorer: `{run_log['scorer']['command']}` → exit {run_log['scorer']['exit_code']}",
             f"  (ran in the staging folder `{run_log['scorer']['ran_in']}`, renamed to "
             f"`{run_log['scorer']['renamed_to']}` after every check passed)"]
    for name, item in run_log["inputs"].items():
        lines.append(f"- Input {name}: `{item['path']}` (sha256 `{item['sha256'][:12]}…`)")
    return lines + [""]


# The main per-role table: evidence, gates, scorer result, next action.
def _role_table(run_log):
    lines = ["## Roles", "",
             "| Role | Sponsorship | Funding | Fit | Liveness | Timeline | Composite | Decision | Next action |",
             "|---|---|---|---|---|---|---|---|---|"]
    for role in run_log["roles"]:
        sc = role["scorer"]
        name = f"{role['company_typed']} — {role['title']}"
        if role["csv_company_name"]:
            name += f" (CSV: {role['csv_company_name']})"
        cells = [name, _sponsorship_text(role["sponsorship"]), _funding_text(role["funding"]),
                 f"{role['fit']['p']} [your-input]", _liveness_text(role["liveness"]),
                 _timeline_text(role["timeline"]), f"{sc['composite']:.3f} [scorer output]",
                 f"**{sc['recommendation']}** [scorer output]", role["next_action"]["text"]]
        lines.append("| " + " | ".join(_cell(c) for c in cells) + " |")
    return lines + [""]


# Every date behind each timeline factor, so the arithmetic can be checked.
def _timeline_dates(run_log):
    lines = ["## Timeline gate dates", "",
             "| Role | Days used / ceiling | Remaining | OPT end | Deadline | Full-credit cutoff | Lag | Expected start | Factor | Why |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    for role in run_log["roles"]:
        tl = role["timeline"]
        lag = f"{tl['hiring_lag_weeks']} wk" + (" (default)" if tl["default_used"] else "")
        cells = [role["role_id"], f"{tl['unemployment_days_used']} / {tl['unemployment_ceiling']}",
                 tl["remaining_days"], tl["opt_end_date"] or "not known", tl["deadline"],
                 tl["full_credit_cutoff"], lag, tl["expected_start"], f"{tl['factor']:.3f}", "; ".join(tl["reasons"])]
        lines.append("| " + " | ".join(_cell(c) for c in cells) + " |")
    return lines + [""]


# The scorer's own arithmetic and reason for each role.
def _arithmetic(run_log):
    lines = ["## Scorer arithmetic (scorer output)", ""]
    for role in run_log["roles"]:
        sc = role["scorer"]
        lines.append(f"- `{role['role_id']}`: {sc['arithmetic']} → {sc['recommendation']} ({sc['reason']})")
    return lines + [""]


# What the report cannot tell the reader.
def _limits():
    return ["## What this report cannot tell you", "",
            "- How many approvals were for this exact title: approvals are per company.",
            "- Whether an employer missing from the data sponsors: Unknown is not \"doesn't sponsor\".",
            "- Whether the employer will sponsor now: the record looks backwards.",
            "- Salary, occupation code, or any immigration-law answer (ask a DSO or attorney).",
            "- Which job title the tier was matched on: it uses the candidate's target-title list, "
            "not each posting's own title.", ""]


# Write the human report: summary first, then the technical record and tables.
def write_report(path, run_log):
    lines = [f"# Role triage report — {run_log['run_id']}", ""]
    for part in (_summary(run_log), _run_record(run_log), _role_table(run_log),
                 _timeline_dates(run_log), _arithmetic(run_log), _limits()):
        lines += part
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines))


# Count what happened to the roles, using the scorer's own gate threshold.
def audit_counts(run_log):
    roles, zero = run_log["roles"], run_log["scorer"]["gate_zero"]
    tiers = [r["sponsorship"]["tier"] for r in roles]
    return {
        "roles_in": len(roles), "scored": len(roles),
        "matched": sum(r["csv_company_name"] is not None for r in roles),
        "unmatched": sum(r["sponsorship"]["reason"] == "no-csv-match" for r in roles),
        "multi_match": 0, "unknown": tiers.count("Unknown"),
        "no_h1b_record": sum(r["sponsorship"]["reason"] == "no-h1b-record" for r in roles),
        "liveness_gated": sum(r["liveness"]["factor"] <= zero for r in roles),
        "timeline_gated": sum(r["timeline"]["factor"] <= zero for r in roles),
        "tiers": {t: tiers.count(t) for t in ["Proven", "Likely", "Possible", "Unknown"]},
        "decisions": decision_counts(run_log),
    }


# Write the audit: plain counts for a human to judge, not a pass/fail verdict.
def write_audit(path, run_log):
    c = audit_counts(run_log)
    lines = [f"# Audit — {run_log['run_id']}", "", "## Executive summary", "",
             f"Counts of what happened to the {c['roles_in']} sample roles in this run. This file reports "
             "what was found; it does not say pass or fail. That judgment is the human's.", "",
             "## Counts", "", "| Measure | Count |", "|---|---|"]
    rows = [("Roles in", c["roles_in"]), ("Roles scored", c["scored"]),
            ("Matched to a CSV row", c["matched"]), ("No CSV match (Unknown)", c["unmatched"]),
            ("Matched, but no H-1B record (Unknown)", c["no_h1b_record"]),
            ("Multi-match (would have stopped the run)", c["multi_match"]),
            ("Unknown tier, total", c["unknown"]),
            (f"Liveness-gated (factor <= {run_log['scorer']['gate_zero']})", c["liveness_gated"]),
            (f"Timeline-gated (factor <= {run_log['scorer']['gate_zero']})", c["timeline_gated"])]
    rows += [(f"Tier {t}", n) for t, n in c["tiers"].items()]
    rows += [(f"Decision {d}", n) for d, n in c["decisions"].items()]
    lines += [f"| {label} | {count} |" for label, count in rows]
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines) + "\n")
