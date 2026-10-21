#!/usr/bin/env python3
"""cognitive-pivot-report.py — the human report + agent log for
recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md (P5: one artifact cannot serve both).

Reads two role-scorer.mjs outputs for the SAME roles file — one at the default
role_quality weight, one with --role-quality-weight — and writes:

  --md-out   the human report (Markdown)        e.g. course/<term>/submissions/<handle>/
  --log-out  the agent log (JSON)               e.g. logs/runs/<term>-<handle>-<n>.json

Gate G4 is applied HERE, as post-processing — never inside the scorer's math:
any role the scorer calls "Apply" is reported as "Consider — liveness unchecked",
because this mode runs no ats:liveness check. The input must carry the builder's
explicit NOT-verified liveness label; a role without it is refused (ValueError),
because then we cannot tell an unchecked posting from a checked one.

Usage:
  python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py \\
    --roles course/2026fa/submissions/omraut888/run/roles.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json \\
    --before course/2026fa/submissions/omraut888/run/weight-0.0/role-scores.json --after course/2026fa/submissions/omraut888/run/weight-0.15/role-scores.json \\
    --md-out <report.md> --log-out <log.json>
"""
import argparse
import csv
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

LIVENESS_UNVERIFIED = "your-input: NOT verified"
DOWNGRADED = "Consider — liveness unchecked"
CONTRAST_SOCS = ["15-1252.00", "15-2051.00"]


def liveness_gate(scored_role):
    for g in scored_role["trace"]["gates"]:
        if g["factor"] == "liveness":
            return g
    raise ValueError(f"{scored_role.get('company')}: no liveness gate in trace")


def reported_decision(scored_role):
    """The decision a person sees. Apply → Consider — liveness unchecked."""
    src = liveness_gate(scored_role)["source"]
    if not str(src).startswith(LIVENESS_UNVERIFIED):
        raise ValueError(f"{scored_role.get('company')}: liveness source {src!r} is not the explicit "
                         f"NOT-verified label — refusing to report (was this roles file built by "
                         f"cognitive-pivot-roles-builder.py?)")
    rec = scored_role["recommendation"]
    return DOWNGRADED if rec == "Apply" else rec


def adjacent(title, phrase):
    """True if the phrase's words appear contiguously, in order, in the title."""
    t = " ".join(re.findall(r"[a-z]+", title.lower()))
    p = " ".join(re.findall(r"[a-z]+", phrase.lower()))
    return re.search(rf"\b{re.escape(p)}\b", t) is not None


def compact_scores(path, socs):
    out = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["onet_soc_code"] in socs:
                v = (row.get("cognitive_pivot_score") or "").strip()
                out[row["onet_soc_code"]] = {"title": row["title"], "score": float(v) if v else None}
    return out


def parse_count(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None  # column absent or blank: report unknown, never 0


def compact_alt_coverage(path, socs):
    """How many of each SOC's O*NET alternate titles the compact table actually carries."""
    out = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["onet_soc_code"] in socs:
                sample = [t for t in (row.get("alternate_titles_sample") or "").split(";") if t.strip()]
                total = parse_count(row.get("alternate_title_count"))
                out[row["onet_soc_code"]] = {"in_sample": len(sample) if total is not None else None, "total": total}
    return out


def fmt(x, n=4):
    return "—" if x is None else f"{x:.{n}f}".rstrip("0").rstrip(".") if isinstance(x, float) else str(x)


def build(args):
    roles_doc = json.loads(Path(args.roles).read_text())
    if not isinstance(roles_doc, dict) or roles_doc.get("_builder") != "cognitive-pivot-roles-builder":
        raise ValueError(f"{args.roles} was not written by cognitive-pivot-roles-builder.py — "
                         f"refusing to report on roles whose provenance is unknown")
    matches_list = [json.loads(Path(m).read_text()) for m in args.matches]
    by_soc = {m["soc_code"]: m for m in matches_list}
    before = json.loads(Path(args.before).read_text())
    after = json.loads(Path(args.after).read_text())
    w0 = before["weights_effective"]["role_quality"]
    w1 = after["weights_effective"]["role_quality"]
    if "soc_targets" in roles_doc:
        socs = roles_doc["soc_targets"]
    else:
        socs = [dict(roles_doc["soc_target"], role_quality_p=roles_doc["roles"][0]["role_quality"]["p"]
                     if roles_doc["roles"] else None)]
    missing = {s["soc_code"] for s in socs} - set(by_soc)
    if missing:
        raise ValueError(f"no --matches file given for {sorted(missing)}")
    soc, matches = socs[0], by_soc[socs[0]["soc_code"]]
    scale = roles_doc["pivot_scale"]
    by_id = {r["role_id"]: r for r in roles_doc["roles"]}
    b = {r["role_id"]: r for r in before["roles"]}
    a = {r["role_id"]: r for r in after["roles"]}
    if set(b) != set(a) or set(b) != set(by_id):
        raise ValueError("before/after/roles files do not describe the same role ids")

    rows = []
    for rid in sorted(by_id):
        src, x, y = by_id[rid], b[rid], a[rid]
        mt = next(m for m in by_soc[src["soc_code"]]["matches"] if m["company_name"] == src["company"])
        pairs = [(t["title"].strip(), p) for t in mt["matched_titles"] for p in t["matched_phrases"]]
        rows.append({
            "role_id": rid, "company": src["company"], "title": src["title"], "soc_code": src["soc_code"],
            "role_quality_p": src["role_quality"]["p"],
            "matched_phrases": sorted({p for _, p in pairs}),
            "phrase_adjacent": all(adjacent(t, p) for t, p in pairs),
            "sponsorship_p": src["sponsorship"]["p"], "sponsorship_n": src["sponsorship"]["n"],
            "composite_before": x["composite"], "machine_before": x["machine_recommendation"],
            "reported_before": reported_decision(x),
            "composite_after": y["composite"], "machine_after": y["machine_recommendation"],
            "reported_after": reported_decision(y),
        })
    changed = [r for r in rows if r["machine_before"] != r["machine_after"]]
    for key, col in (("composite_before", "rank_before"), ("composite_after", "rank_after")):
        for i, r in enumerate(sorted(rows, key=lambda r: (-r[key], r["company"])), 1):
            r[col] = i
    # strict inversions: pairs whose order genuinely reverses (ties before are not counted)
    inversions = [(x["company"], y["company"]) for x in rows for y in rows
                  if x["composite_before"] < y["composite_before"] and x["composite_after"] > y["composite_after"]]
    rq_p = roles_doc["roles"][0]["role_quality"]["p"] if roles_doc["roles"] else None
    fit_w = after["weights_effective"]["fit"]
    contrast = compact_scores(args.compact, CONTRAST_SOCS)
    alt = compact_alt_coverage(args.compact, [s["soc_code"] for s in socs])
    return dict(roles_doc=roles_doc, matches=matches, by_soc=by_soc, socs=socs, pooled=len(socs) > 1,
                inversions=inversions, alt=alt, before=before, after=after, w0=w0, w1=w1,
                soc=soc, scale=scale, rows=rows, changed=changed, rq_p=rq_p, fit_w=fit_w,
                contrast=contrast, threshold=after["config"]["apply_threshold"])


def render_md(d, day):
    soc, sc, rows, ch = d["soc"], d["scale"], d["rows"], d["changed"]
    n = len(rows)
    lo_b = min(r["composite_before"] for r in rows)
    lo_a = min(r["composite_after"] for r in rows)
    small = [r for r in rows if r["sponsorship_n"] <= 4]
    cs = d["contrast"]
    o = []
    o.append(f"# Which H-1B sponsors hire for AI-resilient research work? — {day}\n")
    o.append("## Executive summary\n")
    o.append(f"**What this is.** A check of {n} companies that have sponsored work visas for job titles that "
             f"look like computer and AI *research* work, scored for how well that kind of work holds up "
             f"as AI gets better at routine tasks. It is written for an international student deciding where to spend "
             f"limited application time.\n")
    o.append("**Why read it.** Visa-sponsorship data tells you who sponsors. It says nothing about whether the "
             "sponsored work will still be valuable in five years. This report adds that second signal and "
             "tests whether it changes any recommendation.\n")
    o.append(f"**What it found.** Adding the work-durability signal raised every company's score but changed "
             f"**{len(ch)} of {n}** recommendations. All {n} companies were already above the \"apply\" bar "
             f"without it, and because every company here maps to the same occupation, the signal adds the same "
             f"amount to each of them, so it cannot tell them apart. Nobody here has checked that these "
             f"companies' job postings are still open, so **no company is marked \"apply\". All {n} are marked "
             f"\"consider\", with the reason that no one has checked the posting.** The job-title matching is a rough proxy. At least two matches "
             f"(computational *biology* scientists) are probably not computer-science research jobs.\n")
    o.append(f"**What to do with it.** Treat this as a research shortlist, not an application list. Before you "
             f"apply anywhere on it, (1) check the posting is live, (2) read the science-titled matches yourself, "
             f"and (3) remember that a 2-for-2 approval record is far weaker evidence than 100-for-100.\n")

    o.append("## Run record\n")
    o.append(f"- Recipe: `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` · report written by `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py`")
    o.append(f"- Target occupation: **{soc['soc_code']} {soc['title']}**. Cognitive-pivot score **{soc['raw']}** "
             f"(record, `data/bls/compact/soc_occupation_compact.csv`)")
    o.append(f"- Normalization: (raw − {sc['min']}) / ({sc['max']} − {sc['min']}) over {sc['scored_rows']} scored "
             f"SOC rows (min {sc['min_soc']}, max {sc['max_soc']}) → role_quality.p **{d['rq_p']}**")
    o.append(f"- Title matching: {d['matches']['rows_with_any_title']} sponsors had sponsored titles. "
             f"**{d['matches']['companies_matched']} matched** and "
             f"{d['matches']['companies_with_titles_but_no_match']} did not (`missing: no-title-match`, not guessed)")
    o.append(f"- Runs compared: role_quality weight **{d['w0']}** (scorer default, `[VERIFY]`) vs **{d['w1']}** "
             f"(your-input). 0.15 is the weight proposed but never implemented in PR #3 (ML/H-1B timeline mode); "
             f"this mode carries it forward and tests it.")
    o.append("- **The SOC link is a proxy.** The 80 Days sponsorship CSV has no SOC code field. Each company here is "
             "linked to the occupation only by phrase-matching its sponsored job titles to O*NET alternate titles. "
             "This is not a DOL/BLS classification.\n")

    o.append("## Before / after\n")
    o.append(f"| Company | Matched title | Phrase | Sponsorship p (n) | Composite @{d['w0']} | Composite @{d['w1']} | Scorer | Reported to you |")
    o.append("|---|---|---|---|---|---|---|---|")
    for r in sorted(rows, key=lambda r: (-r["composite_after"], r["company"])):
        mark = "" if r["phrase_adjacent"] else " ¹"
        o.append(f"| {r['company']} | {r['title']} | {', '.join(r['matched_phrases'])}{mark} | "
                 f"{r['sponsorship_p']} ({fmt(r['sponsorship_n'])}) | {r['composite_before']} | {r['composite_after']} | "
                 f"{r['machine_before']} → {r['machine_after']} | **{r['reported_after']}** |")
    o.append("\n¹ the phrase's words appear in the title but not side by side. This is a mechanical flag to prompt "
             "reading, not a verdict. Several of these are genuine (e.g. \"Staff AI/ML Data Engineer\").\n")
    o.append("Sources per term: sponsorship = record (approvals ÷ (approvals + denials)); fit = model-judgment "
             "(1.0 for a phrase match); role_quality = record (normalized score); liveness = your-input, **NOT "
             "verified**; timeline = your-input, **not applicable** (no visa clock modeled in this mode).\n")

    o.append("## What changed and why\n")
    if ch:
        for r in ch:
            o.append(f"- **{r['company']}**: {r['machine_before']} ({r['composite_before']}) → "
                     f"{r['machine_after']} ({r['composite_after']})")
    else:
        o.append(f"**Nothing changed: 0 of {n} scorer recommendations moved.** The real numbers:\n")
        o.append(f"- Lowest composite at weight {d['w0']}: **{lo_b}**, already ≥ the Apply threshold "
                 f"{d['threshold']}. Lowest at {d['w1']}: **{lo_a}**.")
        o.append(f"- Role quality added {d['rq_p']} × {d['w1']} = **{round(d['rq_p'] * d['w1'], 4)}** to *every* "
                 f"company, because all {n} map to one SOC code and so share one cognitive-pivot score. Inside a "
                 f"single-SOC run the signal can shift the whole list but never reorder it.")
        o.append(f"- The scorer adds weights without renormalizing, so a positive role-quality weight can only "
                 f"*raise* a composite. It can promote (Skip → Consider → Apply) but never demote. With all {n} "
                 f"already at Apply, no positive weight could change a decision here.")
        o.append(f"- Fit is 1.0 for every phrase match, so fit alone contributes 1.0 × {d['fit_w']} = "
                 f"**{round(d['fit_w'], 4)}**, which already meets the {d['threshold']} threshold. In this mode a matched role "
                 f"reaches Apply even with zero sponsorship evidence. This is the mode's biggest design flaw (see limitations).")
        o.append(f"- Skip rate is 0% in both runs, against the ≥50% a healthy run shows. The scorer's own report flags this.")
    o.append("")
    o.append(f"**Liveness downgrade (gate G4).** The scorer said Apply for {sum(r['machine_after'] == 'Apply' for r in rows)} "
             f"companies. This report shows each of those as **{DOWNGRADED}**: nobody has checked that a matching "
             f"posting is open, and an unchecked posting must not look the same as a checked one.\n")

    o.append("## Contrast: why the occupation matters more than the company here\n")
    sw = cs.get("15-1252.00", {})
    if sw.get("score") is not None:
        p_sw = round((sw["score"] - sc["min"]) / (sc["max"] - sc["min"]), 4)
        o.append(f"- 15-1252.00 {sw['title']} scores **{sw['score']}** vs **{soc['raw']}** here (record). "
                 f"Normalized that is {p_sw} vs {d['rq_p']}, a {round((d['rq_p'] - p_sw) * d['w1'], 4)} composite gap at weight "
                 f"{d['w1']}. This is arithmetic on record values. It is not a scorer run, because no software-developer "
                 f"sponsor set was built.")
    ds = cs.get("15-2051.00", {})
    if ds:
        o.append(f"- 15-2051.00 {ds['title']}: score **{'blank' if ds['score'] is None else ds['score']}** in the compact "
                 f"table. A run for it stops with `missing: no-cognitive-pivot-score` and is never scored as 0.")
    o.append("")

    o.append("## Limitations (named, not engineered around)\n")
    o.append("1. **Computational-biology matches.** BLADE THERAPEUTICS and CLADE THERAPEUTICS each matched on "
             "\"Senior Scientist, Computational Biology\" via the phrase \"computational scientist\". The matcher is "
             "bag-of-words, so \"computational\" and \"scientist\" are both present but do not mean computer-science "
             "research. *Model judgment, flagged for human review:* MARLINSPIKE (\"Computational Biophysicist\") "
             "and RELAY (\"Computational Chemist\") have the same shape. They are left in the list and not filtered.")
    o.append("2. **Data Scientists (15-2051.00) cannot be scored.** Its cognitive-pivot score is blank in the compact "
             "table, so the mode refuses. It does not estimate. A data-science student gets no answer from this mode.")
    o.append(f"3. **Fit saturates.** Fit = 1.0 for any match, and 1.0 × {d['fit_w']} alone clears the threshold, "
             f"so sponsorship and role quality cannot push a matched role below Apply. The scorer's output here is "
             f"a ranking by sponsorship ratio, not a triage.")
    if small:
        o.append(f"4. **Thin sponsorship records.** {len(small)} companies have ≤ 4 total petitions "
                 f"({', '.join(r['company'] for r in small)}; the ≤ 4 cutoff is a your-input display choice, not a "
                 f"statistical test). A ratio of 1.0 on 2 petitions counts the same as 1.0 on 276.")
    o.append("5. **No liveness, no timeline.** No posting was checked, and no OPT/visa clock is modeled. Both gates "
             "are written as factor 1 with explicit *not verified / not applicable* labels.\n")

    o.append("## Decision this enables\n")
    o.append(f"Use the {n} companies as a **research shortlist for computer/AI research roles at known sponsors**. "
             f"Do not use it as an application queue. The next human step for any company you care about: run a liveness "
             f"check on a specific live posting, and read titles marked ¹ or in limitation 1 yourself. On the "
             f"open authorial question (should role quality carry weight 0.15?), this run gives no evidence "
             f"either way, because one occupation cannot test a weight that only acts across occupations.\n")
    return "\n".join(o)


def render_pooled_md(d, day):
    rows, socs, sc, ch = d["rows"], d["socs"], d["scale"], d["changed"]
    n, w0, w1, thr, fit_w = len(rows), d["w0"], d["w1"], d["threshold"], d["fit_w"]
    g = {s["soc_code"]: [r for r in rows if r["soc_code"] == s["soc_code"]] for s in socs}
    hi, lo = socs[0], socs[1]
    gap = round((hi["role_quality_p"] - lo["role_quality_p"]) * w1, 4)
    ties0 = max(sum(1 for r in rows if r["composite_before"] == c) for c in {r["composite_before"] for r in rows})
    sep = min(r["composite_after"] for r in g[hi["soc_code"]]) > max(r["composite_after"] for r in g[lo["soc_code"]])
    movers = sorted({a for a, _ in d["inversions"]})
    small = [r for r in rows if r["sponsorship_n"] <= 4]
    o = []
    o.append(f"# Which H-1B sponsors hire for AI-resilient work? Two occupations compared — {day}\n")
    o.append("## Executive summary\n")
    o.append(f"**What this is.** A check of {n} companies that have sponsored work visas, split between two kinds of "
             f"job: computer and AI *research* roles ({len(g[hi['soc_code']])} companies) and software-developer roles "
             f"({len(g[lo['soc_code']])} companies). Each is scored with and without a signal for how well the work "
             f"holds up as AI improves. Research work scores higher on that signal than software development. It is "
             f"written for an international student deciding where to spend limited application time.\n")
    o.append("**Why read it.** A first run with only one kind of job could not show any effect, because every company "
             "got the same bonus. With two kinds of job pooled together, this run tests whether the durability signal "
             "changes any recommendation.\n")
    o.append(f"**What it found.** It changed **{len(ch)} of {n}** recommendations. It did change the *order*: "
             + ("every research-role company now ranks above every software-developer company. " if sep else "")
             + f"No company crossed a decision line, because every matched company starts above the \"apply\" bar "
             f"before durability is even counted. That is a known flaw in how this check scores job fit. Nobody has "
             f"checked whether these postings are open, so **no company is marked \"apply\". All {n} are \"consider\", "
             f"because no one has checked the posting.** The software-developer list is also a poor sample. The "
             f"title matcher could only use a handful of alphabetically-first job titles for that occupation, so it "
             f"caught {len(g[lo['soc_code']])} companies, mostly with \"application …\" titles, and several of those "
             f"look like security, sales or support engineering.\n")
    o.append("**What to do with it.** Use the ordering as a weak hint and not as a decision. Before applying anywhere, "
             "check the posting is live and read the matched title yourself. Do not treat the software-developer group "
             "as representative of software-developer sponsors.\n")

    o.append("## Run record\n")
    o.append("- Recipe: `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` · report written by "
             "`scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py`")
    o.append(f"- One shared normalization for both groups: (raw − {sc['min']}) / ({sc['max']} − {sc['min']}) over "
             f"{sc['scored_rows']} scored SOC rows. The range was not recomputed per group, so the two values are comparable.")
    o.append("\n| SOC | Occupation | Cognitive-pivot score (record) | role_quality.p | Sponsors with titles | Matched | Not matched | Alternate titles available to the matcher |")
    o.append("|---|---|---|---|---|---|---|---|")
    for s in socs:
        m = d["by_soc"][s["soc_code"]]; a = d["alt"].get(s["soc_code"], {})
        o.append(f"| {s['soc_code']} | {s['title']} | {s['raw']} | {s['role_quality_p']} | {m['rows_with_any_title']} | "
                 f"{m['companies_matched']} | {m['companies_with_titles_but_no_match']} | {a.get('in_sample')} of {a.get('total')} |")
    o.append(f"\n- Runs compared: role_quality weight **{w0}** (scorer default, `[VERIFY]`) vs **{w1}** (your-input). "
             f"0.15 is the weight PR #3 proposed but did not implement, carried forward on purpose.")
    o.append("- **The SOC link is a proxy.** The sponsorship CSV has no SOC code field. Companies are linked to an "
             "occupation only by phrase-matching their sponsored titles. This is not a DOL/BLS classification.\n")

    o.append("## Before / after (pooled)\n")
    o.append(f"| Rank @{w0} → @{w1} | Company | SOC | Matched title | Phrase | Sponsorship p (n) | Composite @{w0} | Composite @{w1} | Scorer | Reported to you |")
    o.append("|---|---|---|---|---|---|---|---|---|---|")
    for r in sorted(rows, key=lambda r: r["rank_after"]):
        mark = "" if r["phrase_adjacent"] else " ¹"
        o.append(f"| {r['rank_before']} → {r['rank_after']} | {r['company']} | {r['soc_code']} | {r['title']} | "
                 f"{', '.join(r['matched_phrases'])}{mark} | {r['sponsorship_p']} ({fmt(r['sponsorship_n'])}) | "
                 f"{r['composite_before']} | {r['composite_after']} | {r['machine_before']} → {r['machine_after']} | "
                 f"**{r['reported_after']}** |")
    o.append(f"\nRanks break ties alphabetically. At weight {w0}, {ties0} of {n} companies are tied at exactly the same "
             f"composite, so most rank moves are tie-breaks being replaced by a real difference, not true reversals.")
    o.append("¹ the phrase's words are all present but not side by side. This is a mechanical prompt to read the title, not a verdict.\n")

    o.append("## What changed and why\n")
    o.append(f"**Decisions: {len(ch)} of {n} changed.**" + ("" if ch else " Every company is Apply at both weights (before the liveness downgrade)."))
    for r in ch:
        o.append(f"- **{r['company']}** ({r['soc_code']}): {r['machine_before']} ({r['composite_before']}) → {r['machine_after']} ({r['composite_after']})")
    o.append("")
    o.append(f"**Order: the weight now separates the occupations.** Role quality adds {hi['role_quality_p']} × {w1} = "
             f"**{round(hi['role_quality_p'] * w1, 4)}** to each {hi['soc_code']} company and {lo['role_quality_p']} × {w1} = "
             f"**{round(lo['role_quality_p'] * w1, 4)}** to each {lo['soc_code']} company, a **{gap}** gap. "
             + (f"Every {hi['soc_code']} company now ranks above every {lo['soc_code']} company. " if sep else "")
             + f"There are {len(d['inversions'])} strict reversals, where a company that scored lower at {w0} now scores "
             f"higher than another: " + (", ".join(f"{m} overtakes {sum(1 for a, _ in d['inversions'] if a == m)}" for m in movers) or "none")
             + ". A reversal needs a sponsorship difference small enough for the gap to overcome "
             f"(sponsorship p differing by less than {gap} / 0.35 ≈ {round(gap / 0.35, 4)}).")
    o.append("")
    o.append(f"**Does the fit flaw still suppress every decision change? Yes, completely.** Fit is 1.0 for every match, so "
             f"fit alone contributes 1.0 × {fit_w} = {round(fit_w, 4)}, which equals the {thr} Apply threshold. Sponsorship and "
             f"role quality can only add to that, so every matched company is Apply at every weight ≥ 0. Changing the weight "
             f"can still reorder companies, but no spread between occupations, however wide, can move one across the line. "
             f"The flaw is left in place on purpose (see limitations) so that this before/after comparison stays clean.\n")
    o.append(f"**Liveness downgrade (gate G4).** The scorer said Apply for {sum(r['machine_after'] == 'Apply' for r in rows)} "
             f"companies. This report shows each as **{DOWNGRADED}**.\n")

    o.append("## Limitations (named, not engineered around)\n")
    o.append(f"1. **Fit saturates.** With fit at 1.0 for every phrase match, scoring happens on top of a guaranteed "
             f"pass ({round(fit_w, 4)} ≥ {thr}). Skip rate is 0%; a healthy run skips at least half.")
    o.append("2. **\"Computational <natural science>\" false positives (15-1221.00).** BLADE and CLADE THERAPEUTICS "
             "(\"Senior Scientist, Computational Biology\") and RELAY THERAPEUTICS (\"Scientist II, Computational Chemist\") "
             "match \"computational scientist\" without being computer-science or AI work. Sources: BLADE/CLADE come from an "
             "agent reading (model judgment, not a human finding). RELAY was flagged by the agent and then confirmed by the "
             "one human check, Om Raut's 5-of-18 spot-check (4 of 5 rated sound). The same shape recurring points to a "
             "systematic weakness of bag-of-words matching, not a one-off. MARLINSPIKE "
             "(\"Computational Biophysicist\") has the same shape (model judgment, not human-checked).")
    o.append(f"3. **The software-developer group is a thin, skewed sample.** The compact table carries only "
             f"{d['alt'].get(lo['soc_code'], {}).get('in_sample')} of {lo['soc_code']}'s "
             f"{d['alt'].get(lo['soc_code'], {}).get('total')} alternate titles, all alphabetically early (\"AI Specialist\", "
             f"\"Application …\"). The occupation's own title is plural (\"Software Developers\"), so a title like "
             f"\"Software Developer\" or \"Software Engineer\" never matches. *Model judgment:* of the {len(g[lo['soc_code']])} matches, "
             f"\"Application Security Engineer\" (AVA LABS, FLYWIRE, SNAPDOCS), \"Sales Application Engineer\" (ELECTRIC "
             f"HYDROGEN), \"Application Engineer\" at an energy company (TAS ENERGY), \"Principal Application Support "
             f"Engineer\" (ZUORA), and \"Application Systems Analyst\" (IMMUNITYBIO) are doubtful as software-developer roles. "
             f"That leaves about 5 that read as plausible. No human has checked this group.")
    o.append("4. **Data Scientists (15-2051.00) cannot be scored.** Its score is blank, so the mode refuses and does not estimate.")
    if small:
        o.append(f"5. **Thin sponsorship records.** {len(small)} of {n} companies have ≤ 4 total petitions (the cutoff "
                 f"is a your-input display choice). A 2-for-2 record counts the same as 276-for-276.")
    o.append("6. **No liveness, no timeline.** Both gates are written as factor 1 with explicit *not verified / not "
             "applicable* labels.\n")

    o.append("## Decision this enables\n")
    o.append(f"For a student choosing between research-style and software-developer-style roles at sponsors, the "
             f"ordering is a weak hint toward the research group. It cannot settle anything: no decision moved, "
             f"liveness is unchecked, and the software-developer group is not a fair sample. On the authorial question "
             f"(should role quality carry weight {w1}?), the honest result is that the weight reorders but cannot decide "
             f"anything while fit is 1.0. Fixing fit comes first, and then this comparison should be re-run.\n")
    return "\n".join(o)


def build_pooled_log(d, day, args):
    rows = d["rows"]
    return {
        "run_id": f"cognitive-pivot-sponsor-fit-pooled-{day}",
        "recipe": "recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md",
        "soc_code_target": [s["soc_code"] for s in d["socs"]],
        "cognitive_pivot_score": {s["soc_code"]: s["raw"] for s in d["socs"]},
        "role_quality_p": {s["soc_code"]: s["role_quality_p"] for s in d["socs"]},
        "pivot_scale": d["scale"],
        "companies_checked": {k: m["rows_with_any_title"] for k, m in d["by_soc"].items()},
        "title_matches": {k: m["companies_matched"] for k, m in d["by_soc"].items()},
        "title_match_failures": {k: m["companies_with_titles_but_no_match"] for k, m in d["by_soc"].items()},
        "alternate_titles_available": d["alt"],
        "role_quality_weight_baseline": d["w0"],
        "role_quality_weight_tested": d["w1"],
        "decisions_before": {r["role_id"]: {"company": r["company"], "composite": r["composite_before"], "rank": r["rank_before"],
                                            "scorer": r["machine_before"], "reported": r["reported_before"]} for r in rows},
        "decisions_after": {r["role_id"]: {"company": r["company"], "composite": r["composite_after"], "rank": r["rank_after"],
                                           "scorer": r["machine_after"], "reported": r["reported_after"]} for r in rows},
        "decisions_changed": [r["role_id"] for r in d["changed"]],
        "strict_rank_inversions": [list(p) for p in d["inversions"]],
        "gate_results": {
            "G1_title_match": "pass — " + "; ".join(f"{k}: {m['companies_matched']} matched" for k, m in d["by_soc"].items()),
            "G2_score_exists": "pass — " + "; ".join(f"{s['soc_code']} = {s['raw']}" for s in d["socs"]),
            "G3_weight_sanity": f"pass — {d['w1']} in [0, 1]",
            "G4_liveness_disclosure": f"applied — {sum(r['machine_after'] == 'Apply' for r in rows)} Apply → '{DOWNGRADED}'; 0 roles liveness-checked",
        },
        "source_labels": {"sponsorship": "record", "fit": "model-judgment", "role_quality": "record",
                          "liveness": "your-input: NOT verified", "timeline": "your-input: not applicable"},
        "inputs": {"roles": args.roles, "matches": args.matches, "before": args.before, "after": args.after, "compact": args.compact},
        "human_gate": "open — no named-human adequacy attestation recorded",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def build_log(d, day, args):
    rows = d["rows"]
    return {
        "run_id": f"cognitive-pivot-sponsor-fit-{day}",
        "recipe": "recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md",
        "soc_code_target": d["soc"]["soc_code"],
        "soc_title": d["soc"]["title"],
        "companies_checked": d["matches"]["rows_with_any_title"],
        "title_matches": d["matches"]["companies_matched"],
        "title_match_failures": d["matches"]["companies_with_titles_but_no_match"],
        "cognitive_pivot_score": d["soc"]["raw"],
        "role_quality_p": d["rq_p"],
        "pivot_scale": d["scale"],
        "role_quality_weight_baseline": d["w0"],
        "role_quality_weight_tested": d["w1"],
        "decisions_before": {r["company"]: {"composite": r["composite_before"], "scorer": r["machine_before"],
                                            "reported": r["reported_before"]} for r in rows},
        "decisions_after": {r["company"]: {"composite": r["composite_after"], "scorer": r["machine_after"],
                                           "reported": r["reported_after"]} for r in rows},
        "decisions_changed": [r["company"] for r in d["changed"]],
        "gate_results": {
            "G1_title_match": f"pass — {d['matches']['companies_matched']} matched; "
                              f"{d['matches']['companies_with_titles_but_no_match']} missing: no-title-match",
            "G2_score_exists": f"pass — {d['soc']['soc_code']} = {d['soc']['raw']}",
            "G3_weight_sanity": f"pass — {d['w1']} in [0, 1] (scorer validates and refuses otherwise)",
            "G4_liveness_disclosure": f"applied — {sum(r['machine_after'] == 'Apply' for r in rows)} Apply → "
                                      f"'{DOWNGRADED}'; 0 roles liveness-checked",
        },
        "source_labels": {"sponsorship": "record", "fit": "model-judgment", "role_quality": "record",
                          "liveness": "your-input: NOT verified", "timeline": "your-input: not applicable"},
        "inputs": {"roles": args.roles, "matches": args.matches[0], "before": args.before, "after": args.after,
                   "compact": args.compact},
        "human_gate": "open — no named-human adequacy attestation recorded",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--roles", required=True)
    ap.add_argument("--matches", required=True, action="append", help="repeatable: one per SOC in the roles file")
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", required=True)
    ap.add_argument("--compact", default="data/bls/compact/soc_occupation_compact.csv")
    ap.add_argument("--date", default=date.today().isoformat())
    ap.add_argument("--md-out", required=True)
    ap.add_argument("--log-out", required=True)
    args = ap.parse_args(argv)
    md_out = Path(args.md_out)
    log_out = Path(args.log_out)
    try:
        d = build(args)
    except ValueError as e:
        print(f"STOP: {e}", file=sys.stderr)
        return 3
    md_out.parent.mkdir(parents=True, exist_ok=True)
    log_out.parent.mkdir(parents=True, exist_ok=True)
    md_out.write_text((render_pooled_md if d["pooled"] else render_md)(d, args.date))
    log = (build_pooled_log if d["pooled"] else build_log)(d, args.date, args)
    log_out.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n")
    n = len(d["rows"])
    print(f"{n} roles · role_quality weight {d['w0']} → {d['w1']} · decisions changed: {len(d['changed'])} · "
          f"Apply → '{DOWNGRADED}': {sum(r['reported_after'] == DOWNGRADED for r in d['rows'])}")
    print(f"  {md_out}\n  {log_out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
