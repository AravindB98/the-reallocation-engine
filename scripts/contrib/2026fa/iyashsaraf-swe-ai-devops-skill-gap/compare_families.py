#!/usr/bin/env python3
"""compare_families.py — one comparison across the three role families.

Reads the skill-demand-monitor output for each family (run/<family>/skill-demand.json,
produced by `npm run skill-demand`; nothing is recounted here), maps each evidence
job_id to its company, and writes:
  run/skill-gap.json  — for the agent: every value with its source label
  run/skill-gap.md    — for the person: core skills, family-leaning skills, gaps

Gates (hard stops, not votes):
  * a family whose run did not reach status "ranked" is left out, with the reason;
  * if fewer than two families ranked, there is nothing to compare: stop;
  * visa timeline: the deadline is the earlier of the OPT end date and the day the
    allowed unemployment days run out (90 on post-completion OPT, 150 with the STEM
    extension; counted from the EAD start, or from today once OPT has started). Deadline already past -> stop; fewer than --learn-days
    left -> gaps are listed but marked "not a learning priority now; apply with what
    you have".

Usage:
  python3 compare_families.py --run-dir run --private-dir private/... --profile profile/aarav-patel.json
                              --ead-start YYYY-MM-DD [--unemployment-days-used N] [--unemployment-limit 90|150]
                              [--opt-end-date YYYY-MM-DD] [--learn-days 90] [--today YYYY-MM-DD]
  At least one of --ead-start / --opt-end-date is required; with only --ead-start, the
  OPT end date is EAD start + 12 months (post-completion OPT, STEM extension not counted).
"""
import argparse
import collections
import json
import os
import sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from families import FAMILIES, FAMILY_LABELS  # noqa: E402

# [DEFINE] every threshold is a documented choice (your-input), not a verified fact
CONFIG = {
    "core_min_share": 0.15,      # core skill: mentioned in at least 15% of postings in EVERY ranked family
    "lean_min_share": 0.10,      # family-leaning: at least 10% in that family ...
    "lean_ratio": 2.0,           # ... and at least 2x its share in each other ranked family
    "gap_min_share": 0.10,       # a gap worth listing: at least 10% of a family's postings, no evidence in the profile
    "concentration_flag": 0.5,   # flag a skill when one company supplies more than half its mentions
    "closest_top_k": 15,         # closest family = evidence coverage of each family's top 15 skills
    "learn_days_default": 90,    # fewer days than this before the visa deadline -> do not prioritise learning new tools
}
# record: post-completion OPT allows at most 90 days of unemployment in total, 150 including a
# STEM extension, 8 CFR 214.2(f)(10)(ii)(E)
UNEMPLOYMENT_LIMIT_DAYS = 90


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def job_companies(private_dir, family):
    path = os.path.join(private_dir, f"family-{family}.json")
    if not os.path.exists(path):
        return {}
    return {p["job_id"]: p["company_name"] for p in load_json(path)["postings"]}


def parse_day(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def plus_twelve_months(d):
    try:
        return d.replace(year=d.year + 1) - timedelta(days=1)
    except ValueError:  # 29 February
        return d.replace(year=d.year + 1, day=28)


def timeline_gate(learn_days, today, opt_end_date=None, ead_start=None, unemployment_days_used=0,
                  unemployment_limit=UNEMPLOYMENT_LIMIT_DAYS):
    gate = {"ead_start": ead_start, "unemployment_days_used": unemployment_days_used if ead_start else None,
            "unemployment_limit_days": unemployment_limit if ead_start else None,
            "learn_days": learn_days, "source": "your-input dates; the 90/150-day limit is a record (8 CFR 214.2(f)(10)(ii)(E))"}
    candidates = {}
    if opt_end_date:
        gate.update(opt_end_date=opt_end_date, opt_end_source="your-input")
        candidates["opt_end"] = parse_day(opt_end_date)
    elif ead_start:
        end = plus_twelve_months(parse_day(ead_start))
        gate.update(opt_end_date=end.isoformat(), opt_end_source="derived: EAD start + 12 months")
        candidates["opt_end"] = end
    if ead_start:
        left = max(0, unemployment_limit - unemployment_days_used)
        clock_from = max(today, parse_day(ead_start))   # unemployment days only count once OPT has started
        candidates["unemployment_limit"] = clock_from + timedelta(days=left)
        gate["unemployment_deadline"] = candidates["unemployment_limit"].isoformat()
    binding = min(candidates, key=candidates.get)
    days = (candidates[binding] - today).days
    if days <= 0:
        status = "closed"
    elif days < learn_days:
        status = "apply_with_what_you_have"
    else:
        status = "open"
    gate.update(deadline=candidates[binding].isoformat(), binding=binding, days_remaining=days, status=status)
    return gate


def deadline_text(t):
    if t["binding"] == "unemployment_limit":
        return (f"job must start by {t['deadline']} (the {t['unemployment_limit_days']} allowed unemployment days, {t['unemployment_days_used']} used, "
                f"counted from EAD start {t['ead_start']}); OPT end {t['opt_end_date']} ({t['opt_end_source']})")
    return f"OPT end {t['opt_end_date']} ({t['opt_end_source']})"


def family_view(run_dir, private_dir, family, have):
    path = os.path.join(run_dir, family, "skill-demand.json")
    if not os.path.exists(path):
        return {"status": "missing_run", "reason": f"{path} not found"}
    run = load_json(path)
    if run.get("status") != "ranked":
        return {"status": run.get("status"), "candidate_count": run.get("candidate_count"),
                "reason": f"skill-demand-monitor stopped with status {run.get('status')!r}; no ranking reported"}
    n = run["candidate_count"]
    companies_of = job_companies(private_dir, family)
    skills = []
    for s in run["skills"]:
        per_company = collections.Counter(companies_of.get(e["job_id"], "unknown") for e in s["evidence"])
        top_company, top_count = per_company.most_common(1)[0]
        skills.append({
            "id": s["id"], "label": s["label"], "category": s["category"],
            "postings": s["posting_count"], "share": round(s["posting_count"] / n, 4),
            "companies": len(per_company), "top_company": top_company,
            "top_company_share": round(top_count / s["posting_count"], 4),
            "concentrated": top_count / s["posting_count"] > CONFIG["concentration_flag"],
            "have_evidence": s["id"] in have,
            "source": "script-output (skill-demand-monitor regex match); companies from the fetched postings",
        })
    return {"status": "ranked", "candidate_count": n, "low_coverage": run.get("low_coverage"),
            "taxonomy": run.get("taxonomy"), "generated": run.get("generated"), "skills": skills}


def compare(views, have):
    ranked = [f for f in FAMILIES if views[f]["status"] == "ranked"]
    share = {f: {s["id"]: s["share"] for s in views[f]["skills"]} for f in ranked}
    label = {s["id"]: s["label"] for f in ranked for s in views[f]["skills"]}
    ids = sorted(set().union(*[share[f] for f in ranked])) if ranked else []

    core = [i for i in ids if all(share[f].get(i, 0) >= CONFIG["core_min_share"] for f in ranked)]
    leaning = {}
    for f in ranked:
        others = [g for g in ranked if g != f]
        leaning[f] = [i for i in ids if share[f].get(i, 0) >= CONFIG["lean_min_share"]
                      and all(share[f].get(i, 0) >= CONFIG["lean_ratio"] * share[g].get(i, 0) for g in others)]
    gaps = {f: [i for i in sorted(share[f], key=lambda i: -share[f][i])
                if share[f][i] >= CONFIG["gap_min_share"] and i not in have] for f in ranked}
    closest = {}
    for f in ranked:
        top = sorted(views[f]["skills"], key=lambda s: -s["share"])[: CONFIG["closest_top_k"]]
        total = sum(s["share"] for s in top) or 1
        closest[f] = round(sum(s["share"] for s in top if s["have_evidence"]) / total, 4)
    return {"ranked_families": ranked, "label": label, "share": share, "core": core,
            "leaning": leaning, "gaps": gaps, "evidence_coverage_top_k": closest}


def pct(x):
    return f"{round(100 * x)}%"


def render_md(result):
    c, t, views = result.get("comparison"), result["timeline_gate"], result["families"]
    o = ["# Skill gap across three role families", "", "## Executive summary", ""]
    if result["status"] != "compared":
        o += [f"**No comparison produced: {result['stop_reason']}** This is a deliberate stop, not an error.", ""]
    else:
        best = max(c["evidence_coverage_top_k"], key=c["evidence_coverage_top_k"].get)
        o.append(f"Across {sum(views[f]['candidate_count'] for f in c['ranked_families'])} US job postings from companies "
                 f"that have sponsored H-1B visas, the profile already shows evidence for the most-requested "
                 f"skills in the **{FAMILY_LABELS[best]}** family ({pct(c['evidence_coverage_top_k'][best])} of its top "
                 f"skill mentions). Skills asked for across all compared families: "
                 f"{', '.join(c['label'][i] for i in c['core']) or 'none above the threshold'}.")
        if t["status"] == "apply_with_what_you_have":
            o.append(f"\n**Visa timeline gate:** {t['days_remaining']} days left before the visa deadline is under the {t['learn_days']}-day "
                     "learning window, so the gaps below are **not** learning priorities now — apply with the skills you "
                     "already have evidence for.")
        o.append("\nThese are counts of what postings mention, not what jobs require. Which gap to learn first is the student's call.")
        o.append("")
    o += ["## Run record", "",
          f"- Generated: {result['generated']} · Postings fetched: {result['inputs'].get('fetched_on', 'see run log')}",
          f"- Visa timeline: {deadline_text(t)}. {t['days_remaining']} days left, gate status `{t['status']}`",
          "", "| Family | Status | Postings compared | Of those, non-senior titles |", "|---|---|---|---|"]
    levels = result.get("non_senior_postings", {})
    for f in FAMILIES:
        v = views[f]
        o.append(f"| {FAMILY_LABELS[f]} | `{v['status']}`{' — ' + v['reason'] if v.get('reason') else ''} | "
                 f"{v.get('candidate_count', '—')} | {levels.get(f, '—')} |")
    o += ["", "Skill shares below are over all levels. A skill asked of senior, staff or principal roles may not "
          "be asked of a new graduate."]
    if result["status"] != "compared":
        return "\n".join(o) + "\n"
    ranked = c["ranked_families"]
    head = " | ".join(FAMILY_LABELS[f] for f in ranked)
    o += ["", "## Skill share by family (top skills)", "",
          f"| Skill | {head} | In the profile? | Companies (most from one company) |",
          "|---|" + "---|" * len(ranked) + "---|---|"]
    top_ids = sorted(c["label"], key=lambda i: -max(c["share"][f].get(i, 0) for f in ranked))[:25]
    for i in top_ids:
        cells = " | ".join(pct(c["share"][f].get(i, 0)) for f in ranked)
        details = []
        for f in ranked:
            s = next((s for s in views[f]["skills"] if s["id"] == i), None)
            if s:
                flag = " ⚠" if s["concentrated"] else ""
                details.append(f"{f.upper() if f != 'devops' else 'DevOps'}: {s['companies']} "
                               f"({s['top_company']} {pct(s['top_company_share'])}){flag}")
        have = "yes" if any(s["have_evidence"] for f in ranked for s in views[f]["skills"] if s["id"] == i) else "**no**"
        o.append(f"| {c['label'][i]} | {cells} | {have} | {'; '.join(details)} |")
    o += ["", "⚠ = more than half of this skill's mentions in that family come from one company.", "",
          "## Family-leaning skills (at least 2x more common in one family)", ""]
    for f in ranked:
        o.append(f"- **{FAMILY_LABELS[f]}:** {', '.join(c['label'][i] for i in c['leaning'][f]) or 'none'}")
    o += ["", "## Gaps: mentioned in 10%+ of a family's postings, no evidence in the profile", ""]
    for f in ranked:
        conc = {s["id"] for s in views[f]["skills"] if s["concentrated"]}
        items = [f"{c['label'][i]} ({pct(c['share'][f][i])}){' ⚠' if i in conc else ''}" for i in c["gaps"][f]]
        o.append(f"- **{FAMILY_LABELS[f]}:** {', '.join(items) or 'none'}")
    o += ["", "⚠ here too: more than half of that gap's mentions come from one company, so check that company's "
          "postings before choosing it as the thing to learn."]
    o += ["", "## What this cannot tell", "",
          "- Whether a skill is required: postings list more than a job needs on day one.",
          "- Whether a skill is asked at the student's level: the shares count senior and non-senior postings together.",
          "- Anything about a skill missing from the taxonomy, or companies whose boards are not on Greenhouse or Lever.",
          "- Whether a posting is still open after the fetch date.",
          "- Which gap matters most to learn next. That is the student's decision."]
    return "\n".join(o) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--private-dir", required=True)
    ap.add_argument("--profile", required=True)
    ap.add_argument("--opt-end-date", default=None, help="YYYY-MM-DD; default: EAD start + 12 months")
    ap.add_argument("--ead-start", default=None, help="YYYY-MM-DD, the OPT EAD start date")
    ap.add_argument("--unemployment-days-used", type=int, default=0)
    ap.add_argument("--unemployment-limit", type=int, default=UNEMPLOYMENT_LIMIT_DAYS,
                    help="90 on post-completion OPT, 150 with the STEM extension")
    ap.add_argument("--learn-days", type=int, default=CONFIG["learn_days_default"])
    ap.add_argument("--today", default=None, help="YYYY-MM-DD, for tests")
    ap.add_argument("--fetched-on", default=None)
    args = ap.parse_args()
    if not (args.opt_end_date or args.ead_start):
        print("ERROR: give --ead-start or --opt-end-date; the visa timeline gate never guesses a date", file=sys.stderr)
        return 2
    today = parse_day(args.today) if args.today else date.today()
    profile = load_json(args.profile)
    have = set(profile.get("skills", []))
    gate = timeline_gate(args.learn_days, today, args.opt_end_date, args.ead_start, args.unemployment_days_used,
                         args.unemployment_limit)
    views = {f: family_view(args.run_dir, args.private_dir, f, have) for f in FAMILIES}
    summary_path = os.path.join(args.run_dir, "families-summary.json")
    levels = ({f: v["non_senior_postings"] for f, v in load_json(summary_path)["families"].items()}
              if os.path.exists(summary_path) else {})
    result = {"_tool": "swe-ai-devops-skill-gap/compare_families.py", "generated": today.isoformat(),
              "config": CONFIG, "inputs": {"profile": args.profile, "fetched_on": args.fetched_on},
              "timeline_gate": gate, "families": views,
              "non_senior_postings": levels, "non_senior_source": "model-judgment (title rule in families.py)"}
    if gate["status"] == "closed":
        reason = "the allowed unemployment days have run out" if gate["binding"] == "unemployment_limit" else "the OPT end date has already passed"
        result.update(status="stopped", stop_reason=f"{reason}, so the visa timeline gate is closed.")
    else:
        comp = compare(views, have)
        result["comparison"] = comp
        if len(comp["ranked_families"]) < 2:
            result.update(status="stopped", stop_reason="fewer than two families had enough postings to rank, so there is nothing to compare.")
        else:
            result["status"] = "compared"
    os.makedirs(args.run_dir, exist_ok=True)
    with open(os.path.join(args.run_dir, "skill-gap.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    with open(os.path.join(args.run_dir, "skill-gap.md"), "w", encoding="utf-8") as f:
        f.write(render_md(result))
    print(f"status={result['status']}" + (f" ({result['stop_reason']})" if result["status"] != "compared" else ""))
    print(f"timeline gate: {gate['status']} ({gate['days_remaining']} days left; deadline {gate['deadline']}, binding: {gate['binding']})")
    for fam in FAMILIES:
        v = views[fam]
        print(f"family {fam}: {v['status']}" + (f", {v['candidate_count']} postings" if v.get("candidate_count") is not None else ""))
    if result["status"] == "compared":
        comp = result["comparison"]
        print("core skills: " + (", ".join(comp["label"][i] for i in comp["core"]) or "none"))
        for fam in comp["ranked_families"]:
            print(f"evidence coverage of top {CONFIG['closest_top_k']} ({fam}): {pct(comp['evidence_coverage_top_k'][fam])}")
    print(f"wrote {args.run_dir}/skill-gap.json and skill-gap.md")
    return 0 if result["status"] == "compared" else 3


if __name__ == "__main__":
    sys.exit(main())
