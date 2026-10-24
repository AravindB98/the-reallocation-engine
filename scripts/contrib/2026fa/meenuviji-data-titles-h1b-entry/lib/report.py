"""Human report (out/report.md). Opens with a plain-language executive summary (P9);
the technical run record follows under its own heading. All numbers come from the run log."""


def _money(x):
    try:
        return f"${float(x):,.0f}"
    except (TypeError, ValueError):
        return "—"


def _n(x):
    return "—" if x is None else (f"{x:g}" if isinstance(x, float) else str(x))


def _esc(s):
    return str(s).replace("|", "\\|").replace("\n", " ")


GROUP_PLAIN = {
    "no-record": "no sponsorship record",
    "no-data-title": "sponsor, but no data titles",
    "proven": "entry-level data title and enough approvals",
    "entry-under-min-approvals": "entry-level data title but few approvals",
    "only-mid": "only mid-level data titles",
    "only-senior": "only senior data titles",
}


def _pct(x):
    return f"{x:.1%}" if x >= 0.01 else f"{x:.2%}"


def _deferred(scored):
    """Distinct deferred-start notes among scored postings -> {(days, text): count}."""
    out = {}
    for e in scored:
        for n in e["notes"]:
            if n["type"] == "deferred-start":
                k = (n["deferred_start_days"], n["text"])
                out[k] = out.get(k, 0) + 1
    return out


def _shares(sample):
    sizes = (sample.get("group_sizes") or {}).get("value") or {}
    total = sum(sizes.values())
    order = (sample.get("group_order") or {}).get("value") or list(sizes)
    return [(g, sizes[g], sizes[g] / total) for g in order if g in sizes] if total else []


def render(log):
    c = log["counts"]["value"]
    rec = c["recommendation"]
    scored, stops, refusals, notes = log["scored"], log["stops"], log["refusals"], log["notes"]
    o = []
    o.append("# Sponsorship-by-title run report")
    o.append("")
    o.append("## Executive summary")
    o.append("")
    o.append(f"**What this is.** The result of checking {c['postings']} sample job postings against each employer's "
             "history of visa-sponsored job titles, to see whether the employer has sponsored *entry-level data* jobs "
             "before — not just any job — and passing that judgment to the project's existing role scorer.")
    o.append("")
    o.append("**Why read it.** It shows which postings are worth tailoring an application for, which were stopped "
             "before scoring and why, and exactly which evidence and which of your own rules produced each "
             "recommendation.")
    o.append("")
    skip = c["skip_rate_of_scored"]
    found = [f"{c['scored']} postings were scored: **{rec['Apply']} Apply, {rec['Consider']} Consider, "
             f"{rec['Skip']} Skip**" + (f" (skip rate {skip:.0%} of scored; the engine treats at least 50% as healthy)."
                                         if skip is not None else ".")]
    if stops:
        found.append(f"{len(stops)} stopped because the company name could not be matched to exactly one employer "
                     "in the data; a person has to resolve these.")
    if refusals:
        found.append(f"{len(refusals)} were refused because a required date or posting-status value was missing; "
                     "the scorer would otherwise have silently assumed the best case.")
    unknown = sum(1 for e in scored if e["sponsorship_term"]["value"]["tier"] == "unknown")
    if unknown:
        found.append(f"{unknown} scored posting(s) are at employers with no sponsorship record at all. "
                     "No record is not evidence that they don't sponsor.")
    kinds = {k: sum(1 for n in notes if n["type"] == k) for k in ("title-family", "sibling-rows")}
    for (days, _text), n in _deferred(scored).items():
        found.append(f"{'All' if n == len(scored) else n} of the {len(scored)} scored postings would need the employer "
                     f"to accept a start {days} days after the offer, because work authorization begins later; "
                     "that is noted, not penalized.")
    if kinds["title-family"]:
        found.append(f"For {kinds['title-family']} scored posting(s), the employer has sponsored data jobs, but not "
                     "this kind of data job, so the match is at company level only.")
    dups = {tuple(n["companies"]) for n in notes if n["type"] == "duplicate-evidence"}
    for names in sorted(dups):
        found.append(f"{' and '.join(names)} carry identical sponsorship evidence; it may belong to only one of them.")
    if kinds["sibling-rows"]:
        found.append(f"{kinds['sibling-rows']} matched employer(s) share a cleaned-up name with other entries in the "
                     "data; those entries are listed so you can check the right one was used.")
    o.append("**What it found.** " + " ".join(found))
    o.append("")
    shares = _shares(log["sample"])
    if shares:
        per = log["sample"]["per_group"]["value"]
        no_rec = next((sh for g, _, sh in shares if g == "no-record"), None)
        o.append("**How the sample relates to all employers in the data.** Share of all employers in each group: "
                 + "; ".join(f"{GROUP_PLAIN.get(g, g)} {_pct(sh)}" for g, _, sh in shares) + ".")
        if no_rec is not None:
            o.append("")
            o.append(f"The sample is stratified ({per} per group), so its skip rate is not representative; "
                     f"{no_rec:.1%} of CSV companies are in the no-record group.")
        o.append("")
    o.append("The sponsorship scores are ordered labels from your own rules, not probabilities. Fit and posting "
             "status were not measured in this sample: fit is held constant and every posting is assumed live. "
             "The next action for each posting is advice from your own rules; it never changes the recommendation.")
    o.append("")

    o.append("---")
    o.append("")
    o.append("## Run record")
    o.append("")
    d = log["data"]["value"]
    o.append(f"- Run: `{log['run_id']}` · mode: {log['mode']} · status: **{log['status']}** · exit code {log['exit_code']}")
    o.append(f"- Sponsorship data: `{d['sponsorship_csv']}` ({d['rows']} rows, SHA-256 `{d['sha256']}`) — record")
    o.append(f"- Wage context: `{d['bls_csv']}` ({d['bls_rows']} rows) — record")
    s = log["sample"]
    o.append(f"- Sample: seed {s['seed']['value']}, {s['per_group']['value']} per evidence group (your-input); "
             f"evidence-group sizes in the CSV {s['group_sizes']['value']} (record)")
    if shares:
        o.append("- Population share by evidence group (record, from the CSV group sizes): "
                 + " · ".join(f"{g} {n} ({_pct(sh)})" for g, n, sh in shares))
    for (_days, text), n in _deferred(scored).items():
        o.append(f"- Timeline note (your-input, non-scoring; applies to {n} of {len(scored)} scored postings, "
                 f"because hiring_lag_days is one global value): {text}")
    sc = log.get("scorer", {})
    if sc.get("command"):
        o.append(f"- Scorer: `{' '.join(sc['command'])}` → exit {sc['exit_code']} (unmodified)")
        cfg = sc["config"]["value"] or {}
        o.append(f"- Scorer weights used: {cfg.get('weights')} · apply threshold {cfg.get('apply_threshold')} · "
                 f"consider floor {cfg.get('consider_floor')} — record")
    else:
        o.append(f"- Scorer: not called ({sc.get('why')})")
    o.append("- Labels: **record** = read from a repo data file or returned by the scorer; "
             "**your-input** = Meena's rule or value; **model-judgment** = not used in this run.")
    o.append("")

    o.append("## Scored postings")
    o.append("")
    if scored:
        o.append("| Posting | Employer (matched) | Rec | Composite | Evidence group (your-input) | Next action (your-input) | Sponsorship tier · p (your-input) | Evidence (record) | Timeline (your-input) | BLS context (record) |")
        o.append("|---|---|---|---|---|---|---|---|---|---|")
        for e in sorted(scored, key=lambda x: -x["scorer_result"]["value"]["composite"]):
            r = e["scorer_result"]["value"]
            t = e["sponsorship_term"]["value"]
            ev = e["sponsorship_evidence"]["value"]
            evtxt = (f"{_n(ev['total_approvals'])} approvals / {_n(ev['total_denials'])} denials"
                     if ev["has_sponsorship_record"] else "no sponsorship record")
            b = e["bls_context"]["value"]
            btxt = "no SOC row" if b == "no SOC row" else "; ".join(
                f"{x['bls_soc_code']} {x['title']} {_money(x['annual_median_wage'])}" for x in b)
            rec_cell = r["recommendation"] + (" (override)" if r["recommendation"] != r["machine_recommendation"] else "")
            o.append(f"| {_esc(e['title'])} | {_esc(e['company_match']['value']['matched_name'])} | **{rec_cell}** | "
                     f"{r['composite']:.3f} | {e['evidence_group']['value']} | {_esc(e['next_action']['value'])} | {t['tier']} · {_n(t['p'])} ({t['rule_id']}) | {evtxt} | "
                     f"{e['timeline']['value']['factor']}{' (deferred)' if e['timeline']['value']['deferred_start_days'] else ''} | {_esc(btxt)} |")
        o.append("")
        o.append("### Why each one scored as it did")
        o.append("")
        for e in scored:
            r = e["scorer_result"]["value"]
            m = e["company_match"]["value"]
            o.append(f"#### {_esc(e['title'])} — {_esc(m['matched_name'])}")
            o.append("")
            o.append(f"- Company match (record): input `{_esc(e['company_input'])}` → `{_esc(m['matched_name'])}` "
                     f"({m['city']}, {m['state']}) by rule **{m['rule']}**")
            data_titles = [t for t in e["title_classification"]["value"] if t["data_family"]]
            all_titles = e["sponsorship_evidence"]["value"]["titles"]
            if not e["sponsorship_evidence"]["value"]["has_sponsorship_record"]:
                o.append("- Sponsored titles (record): none — **no record ≠ does not sponsor**")
            elif not data_titles:
                o.append(f"- Sponsored titles (record): {', '.join('`'+_esc(x)+'`' for x in all_titles)} — none is a data-family title under your allowlist")
            else:
                o.append("- Data-family sponsored titles (record title → your-input bucket): " + "; ".join(
                    f"`{_esc(t['title'])}` → {t['bucket']} ({', '.join(t['markers'])})" for t in data_titles))
            t = e["sponsorship_term"]["value"]
            o.append(f"- Sponsorship term (your-input): rule `{t['rule_id']}` → tier `{t['tier']}`, p {_n(t['p'])}"
                     + (" (the scorer drops a null vote; it is not zero)" if t["p"] is None else ""))
            o.append(f"- Fit (your-input): {_n(e['fit']['value'])} — {e['fit'].get('reason')}")
            o.append(f"- Liveness ({e['liveness']['label']}): {e['liveness']['value']} — determined by: {e['liveness'].get('determined_by')}")
            o.append(f"- Timeline (your-input): {e['timeline']['value']['arithmetic']}")
            o.append(f"- Scorer arithmetic (record): `{r['trace']['arithmetic']}` → **{r['machine_recommendation']}** — {r['reason']}")
            o.append(f"- Evidence group (your-input): {e['evidence_group']['value']}")
            o.append(f"- Next action (your-input; {e['next_action']['basis']}): {e['next_action']['value']}")
            for n in [n for n in e["notes"] if n["type"] != "deferred-start"]:
                o.append(f"- Note, {n['type']} ({n['label']}; does not affect the score): {_esc(n['text'])}")
            o.append("")
    else:
        o.append("None.")
        o.append("")

    o.append("## Sample by evidence group")
    o.append("")
    sizes = s["group_sizes"]["value"] or {}
    order = s["group_order"]["value"] or list(sizes)
    o.append("| Evidence group | Companies in CSV (record) | Sample postings scored |")
    o.append("|---|---|---|")
    for g in order:
        members = [f"{_esc(e['company_match']['value']['matched_name'])} ({e['scorer_result']['value']['recommendation']})"
                   for e in scored if e["evidence_group"]["value"] == g]
        o.append(f"| {g} | {sizes.get(g, '—')} | {'; '.join(members) or '—'} |")
    o.append("")

    o.append("## Stopped at the company-match gate")
    o.append("")
    if stops:
        o.append("A person must pick the right row or confirm the company is not in the data. Nothing was guessed.")
        o.append("")
        o.append("| Posting | Input name | Reason | Candidates (name, city, state) |")
        o.append("|---|---|---|---|")
        for s_ in stops:
            cands = "; ".join(f"{x['company_name']} ({x['city']}, {x['state']})" for x in s_["candidates"]["value"]) or "—"
            o.append(f"| {_esc(s_['title'])} | {_esc(s_['company_input'])} | {s_['reason']} | {_esc(cands)} |")
    else:
        o.append("None.")
    o.append("")

    o.append("## Refused: missing gate value")
    o.append("")
    if refusals:
        o.append("These were never sent to the scorer, because it treats a missing value as the best case (1.0).")
        o.append("")
        o.append("| Posting | Employer | Missing |")
        o.append("|---|---|---|")
        for r_ in refusals:
            o.append(f"| {_esc(r_['title'])} | {_esc(r_['company_match']['value']['matched_name'])} | {_esc('; '.join(r_['refused_because']))} |")
    else:
        o.append("None.")
    o.append("")

    o.append("## Caveats")
    o.append("")
    o.append("- A title with no level marker is counted as entry-or-unmarked. Unmarked is not proof of entry level.")
    o.append("- Sponsorship data is per company; the sponsored-title list is the only role-level signal, and it is a short list of free text.")
    o.append("- Approval rate measures how often filed petitions were approved, not whether this employer will file for you.")
    o.append("- Wage context is the national median for the matching occupation title only; it does not affect scoring.")
    o.append("- A company-level data-family match does not show the employer sponsored the specific posting title.")
    o.append("")
    return "\n".join(o) + "\n"
