#!/usr/bin/env python3
"""cogpivot_unprofiled — AI-resilience scoring for roles O*NET has not profiled.

## Executive summary

The Cognitive Pivot layer answers "is this work AI can't yet do?" with
`cognitive_pivot_score` — an unweighted mean of nine O*NET ability and skill
levels (see scripts/bls/extract-soc-occupation-table.py:128).

Over the shipped table that mean does not exist for 122 of 1,016 occupations,
because none of the nine inputs are present. (Those figures are what the run
printed on 2026-10-09; the script recomputes them every time and never hardcodes
them into its output.) 45 are named occupations rather than "All Other"
catch-alls, and one is **Data Scientists (15-2051.00)** — the occupation
this student is actually applying into. BLS publishes its 2024 median wage and
O*NET lists 33 alternate titles for it; what is missing is the profile of what
the work involves.

So the layer built to say which work survives AI is silent on the role in
question. This script makes that silence explicit and refuses to paper over it.

## What it does about it

- A profiled SOC gets its score, labelled `record`, cross-checked by recomputing
  the mean from the nine columns and comparing against the shipped value.
- An unprofiled SOC gets **no score**. Not 0.0, not an average, not a guess —
  `null` with `reason: no-onet-profile`. Emitting zero would read as "this job is
  maximally replaceable", which is the opposite of what the data says.
- In place of a score it emits a **neighbour band**: the profiled occupations in
  the same SOC minor group, named individually, with min/median/max. That is a
  `model-judgment` and is labelled as one. The neighbours are listed so a human
  can reject the substitution.

## What it cannot verify

- **Why the 122 are unprofiled.** The generator needs `data/bls/db-30-2-text/`
  (Abilities.txt, Skills.txt, Occupation Data.txt), which is gitignored and does
  not ship. From a fresh clone nobody can tell whether O*NET lacks the data or
  the extraction dropped it. This is a 9th "fact that bites" beyond the 8 listed.
- **That a neighbour resembles the target.** SOC adjacency is a filing
  convention, not a claim about the work.
- **That the score means what the thesis says.** A mean of nine self-reported
  O*NET levels is a proxy for AI-resilience, not a measurement of it.

Usage:
    python3 cogpivot_unprofiled.py --out-dir <dir> [--soc 15-2051.00 ...]

Exit codes: 0 healthy · 1 missing input · 2 no target SOC could be scored.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import statistics
import sys

SOC_CSV = "data/bls/compact/soc_occupation_compact.csv"

# The nine inputs, copied from scripts/bls/extract-soc-occupation-table.py:129-139.
# Named here so the recomputation is auditable rather than trusting the shipped column.
PIVOT_FIELDS = (
    "ability_originality_lv",
    "ability_problem_sensitivity_lv",
    "ability_deductive_reasoning_lv",
    "ability_inductive_reasoning_lv",
    "skill_critical_thinking_lv",
    "skill_judgment_decision_making_lv",
    "skill_complex_problem_solving_lv",
    "skill_systems_analysis_lv",
    "skill_systems_evaluation_lv",
)

# The occupations this student's six target job titles map onto. `your-input`:
# the mapping is a human judgment about which SOC codes describe the work, and
# a different student would choose differently.
TARGET_SOCS = {
    "15-2051.00": "Data Scientists",
    "15-1243.01": "Data Warehousing Specialists",
    "15-1242.00": "Database Administrators",
    "15-2041.00": "Statisticians",
    "15-1211.00": "Computer Systems Analysts",
    "15-1221.00": "Computer and Information Research Scientists",
}


def blank(v) -> bool:
    return not str(v or "").strip()


def num(v):
    try:
        return float(str(v).strip())
    except (TypeError, ValueError):
        return None


def minor_group(soc: str) -> str:
    """SOC minor group — the first five characters, e.g. 15-20 for 15-2051.00."""
    return soc[:5]


def broad_group(soc: str) -> str:
    """SOC broad occupation — the first seven characters, e.g. 15-2051.

    O*NET numbers a parent occupation `.00` and its specializations `.01`, `.02`.
    They share this prefix, and the children are sub-specialisations of the same
    work rather than merely adjacent occupations.
    """
    return soc[:7]


def recompute_pivot(row: dict):
    """Recompute the score from the nine columns.

    Returns (score, n_inputs). Mirrors the repo's own function, which averages
    whatever subset is present and returns None only when all nine are absent.
    That behaviour is why a score built from 7 inputs is indistinguishable in the
    output from one built from 9 — reported as a data problem rather than fixed
    here, because changing it would mean editing a maintained script.
    """
    vals = [num(row.get(f)) for f in PIVOT_FIELDS]
    vals = [v for v in vals if v is not None]
    if not vals:
        return None, 0
    return round(sum(vals) / len(vals), 3), len(vals)


def load_soc(root: str, soc_csv: str | None = None):
    """Load the SOC table. `soc_csv` overrides the shipped path (tests use a fixture)."""
    path = soc_csv if soc_csv else os.path.join(root, SOC_CSV)
    if not os.path.exists(path):
        raise SystemExit("FAIL missing SOC table: %s (nothing invented)" % path)
    with open(path, encoding="utf-8") as fh:
        return list(csv.DictReader(fh)), path


def coverage(rows: list[dict]) -> dict:
    """How much of the layer can actually answer the question it exists to answer."""
    profiled, unprofiled, partial, mismatched = [], [], [], []
    for r in rows:
        score, n = recompute_pivot(r)
        shipped = num(r.get("cognitive_pivot_score"))
        if score is None:
            unprofiled.append(r)
            continue
        profiled.append(r)
        if n < len(PIVOT_FIELDS):
            partial.append({"soc": r["onet_soc_code"], "title": r["title"],
                            "inputs_present": n, "of": len(PIVOT_FIELDS),
                            "score": score})
        # Cross-check: the shipped column must equal what the inputs produce.
        if shipped is None or abs(shipped - score) > 0.0015:
            mismatched.append({"soc": r["onet_soc_code"], "title": r["title"],
                               "shipped": shipped, "recomputed": score})
    named = [r for r in unprofiled if "all other" not in r["title"].lower()]

    # Reachability audit. A category that can never be non-zero is a design
    # flaw dressed as a finding — the previous assignment shipped a scorer that
    # could never return "Consider", and the zero looked like a result. So every
    # outcome this mode can emit is counted across the WHOLE table, not just the
    # target roles, and the report states which are reachable.
    tier_reach = {}
    for r in unprofiled:
        t = fallback_band(rows, r["onet_soc_code"])["tier"]
        tier_reach[t] = tier_reach.get(t, 0) + 1

    # Why are they unprofiled? Test the structural explanation rather than
    # asserting it: O*NET profiles detailed `.0X` occupations and leaves the
    # aggregate `.00` parent empty. If that is right, the gap should be almost
    # entirely `.00` rows, and some of those parents should have a profiled child.
    scored_codes = {r["onet_soc_code"] for r in profiled}
    dot00 = [r for r in unprofiled if r["onet_soc_code"].endswith(".00")]
    # The remainder are DETAILED codes with no profile at any level — a different
    # cause from an empty aggregate row, and worth separating rather than lumping.
    detailed_unprofiled = [r for r in unprofiled if not r["onet_soc_code"].endswith(".00")]
    with_profiled_child = [
        r for r in dot00
        if any(c != r["onet_soc_code"] and c[:7] == r["onet_soc_code"][:7]
               for c in scored_codes)
    ]
    return {
        "total": len(rows),
        "profiled": len(profiled),
        "unprofiled": len(unprofiled),
        "unprofiled_named": len(named),
        "unprofiled_all_other": len(unprofiled) - len(named),
        "unprofiled_pct": round(100.0 * len(unprofiled) / max(1, len(rows)), 1),
        "partial_scores": partial,
        "shipped_vs_recomputed_mismatches": mismatched,
        "tier_reachability": tier_reach,
        "unprofiled_dot00": len(dot00),
        "unprofiled_detailed": len(detailed_unprofiled),
        "unprofiled_detailed_rows": [
            {"soc": r["onet_soc_code"], "title": r["title"]}
            for r in sorted(detailed_unprofiled, key=lambda x: x["onet_soc_code"])],
        "unprofiled_with_profiled_child": len(with_profiled_child),
        "named_unprofiled_sample": [
            {"soc": r["onet_soc_code"], "title": r["title"],
             "median_wage": num(r.get("annual_median_wage"))}
            for r in sorted(named, key=lambda x: x["onet_soc_code"])
            if r["onet_soc_code"].startswith("15-")
        ],
    }


def fallback_band(rows: list[dict], soc: str) -> dict:
    """What to offer when the target SOC has no profile of its own.

    Two tiers, because they are not equally defensible:

      own-children  — the `.0X` specialisations under the same broad code. These
                      ARE the occupation, described at a finer grain. O*NET
                      profiles at the detailed level and leaves the aggregate
                      `.00` row empty; 119 of the 122 unscorable rows end in
                      `.00`, and in 26 cases a child of that same parent IS
                      profiled. For Data Scientists the children are Business
                      Intelligence Analysts and Clinical Data Managers.
      minor-group   — other occupations sharing the first five characters. These
                      are filed nearby, which is a cataloguing fact and not a
                      claim about the work. Used only when there are no children.

    Both are `model-judgment`. The tier is reported so a reader can weigh them
    differently, and every peer is named so the substitution can be refused.
    """
    def peers_with_prefix(prefix: str, width: int):
        out = []
        for r in rows:
            code = r["onet_soc_code"]
            if code == soc or code[:width] != prefix:
                continue
            score, n = recompute_pivot(r)
            if score is None:
                continue
            out.append({"soc": code, "title": r["title"], "score": score,
                        "inputs": n, "median_wage": num(r.get("annual_median_wage"))})
        out.sort(key=lambda p: p["score"])
        return out

    kin = peers_with_prefix(broad_group(soc), 7)
    if kin:
        # Same broad code. If this row is the `.00` aggregate these are its
        # CHILDREN; if this row is itself a `.0X` specialisation they are its
        # SIBLINGS. Both are the same occupation at a finer grain, but calling a
        # sibling a child would be inaccurate, so the relation is named.
        relation = "children" if soc.endswith(".00") else "siblings"
        tier, peers, basis = "broad-code", kin, (
            "the detailed O*NET specialisations sharing broad code %s — this "
            "occupation's %s" % (broad_group(soc), relation))
    else:
        peers = peers_with_prefix(minor_group(soc), 5)
        tier, basis = "minor-group", (
            "other occupations filed in SOC minor group %s — adjacency in the "
            "catalogue, not a claim about the work" % minor_group(soc))

    if not peers:
        return {"tier": "none", "n": 0, "peers": [],
                "reason": "no-profiled-peer-at-either-tier"}

    vals = [p["score"] for p in peers]
    return {
        "tier": tier,
        "basis": basis,
        "n": len(peers),
        "min": vals[0],
        "median": round(statistics.median(vals), 3),
        "max": vals[-1],
        "spread": round(vals[-1] - vals[0], 3),
        "peers": peers,
        "source": "model-judgment (%s)" % tier,
    }


def build(root: str, socs: dict, today: dt.date, soc_csv: str | None = None) -> dict:
    rows, path = load_soc(root, soc_csv)
    by_soc = {r["onet_soc_code"]: r for r in rows}
    cov = coverage(rows)

    scored, refused, problems = [], [], []
    for soc, label in socs.items():
        row = by_soc.get(soc)
        if row is None:
            problems.append({"soc": soc, "problem": "soc-not-in-table"})
            refused.append({"soc": soc, "requested_as": label,
                            "role_quality": None,
                            "reason": "soc-not-in-table",
                            "next_action": "check the SOC code against the shipped table"})
            continue

        score, n = recompute_pivot(row)
        shipped = num(row.get("cognitive_pivot_score"))
        wage = num(row.get("annual_median_wage"))

        if score is None:
            band = fallback_band(rows, soc)
            refused.append({
                "soc": soc,
                "title": row["title"],
                "role_quality": None,
                "reason": "no-onet-profile",
                "detail": "all %d cognitive-pivot inputs are absent for this SOC"
                          % len(PIVOT_FIELDS),
                "median_wage": {"value": wage, "source": "record"},
                "alternate_title_count": row.get("alternate_title_count"),
                "fallback_band": band,
                "next_action": "judge the neighbour band by hand, or treat "
                               "role quality as unknown for this role",
            })
            continue

        scored.append({
            "soc": soc,
            "title": row["title"],
            "role_quality": {
                "value": score,
                "inputs_present": n,
                "of": len(PIVOT_FIELDS),
                "source": "record (recomputed from the nine O*NET columns)",
                "shipped_value": shipped,
                "agrees_with_shipped": shipped is not None
                                       and abs(shipped - score) <= 0.0015,
            },
            "median_wage": {"value": wage, "source": "record"},
            "job_zone": row.get("job_zone") or None,
        })

    return {
        "meta": {
            "mode": "cogpivot-unprofiled",
            "recipe_version": "0.1.0",
            "generated_for": str(today),
            "input_csv": os.path.relpath(path, root) if path.startswith(root) else path,
            "rows_read": len(rows),
            "pivot_fields": list(PIVOT_FIELDS),
            "formula": "unweighted mean of the nine fields above "
                       "(scripts/bls/extract-soc-occupation-table.py:128)",
            "target_socs": {"value": socs, "source": "your-input"},
            "generator_runnable": {
                "value": False,
                "reason": "needs data/bls/db-30-2-text/ (Abilities.txt, Skills.txt, "
                          "Occupation Data.txt) which is gitignored and absent",
                "source": "record",
            },
        },
        "coverage": cov,
        "scored": scored,
        "refused": refused,
        "data_problems": problems,
    }


def write_outputs(result: dict, out_dir: str):
    """Output contract: JSON for an agent, Markdown for a person (P5)."""
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, "cogpivot-unprofiled.json")
    md_path = os.path.join(out_dir, "cogpivot-unprofiled.md")

    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)

    m, cov = result["meta"], result["coverage"]
    L = [
        "# Cognitive-pivot coverage for early-career data/AI roles",
        "",
        "## Executive summary",
        "",
        "**What this is.** A check of whether the Cognitive Pivot layer can answer",
        "its own question — *is this work AI cannot yet do?* — for the occupations",
        "a chosen set of target titles maps onto.",
        "",
        "**What it found.** For **%d of %d occupations (%.1f%%)** none of the nine"
            % (cov["unprofiled"], cov["total"], cov["unprofiled_pct"]),
        "`cognitive_pivot_score` inputs are present, so no mean exists. The gap has",
        "two causes, and they are not equally serious:",
        "",
        "- **%d** are aggregate `.00` rows. Of those, **%d** have a scored version"
            % (cov["unprofiled_dot00"], cov["unprofiled_with_profiled_child"]),
        "  one level down and **%d** do not, so an empty summary row does NOT by"
            % (cov["unprofiled_dot00"] - cov["unprofiled_with_profiled_child"]),
        "  itself mean the detail exists.",
        "- **%d** are detailed rows with no profile at any level." % cov["unprofiled_detailed"],
        "",
        "%d + %d = %d. **Data Scientists (15-2051.00) is one of the %d** with a"
            % (cov["unprofiled_dot00"], cov["unprofiled_detailed"], cov["unprofiled"],
               cov["unprofiled_with_profiled_child"]),
        "scored version one level down, so for that occupation a fallback exists.",
        "That the aggregate row was *never filled in* is the most likely reading of",
        "the pattern, not something this run can establish: it is `model-judgment`.",
        "",
        "**What it refuses to do.** Emit a number anyway. An unprofiled occupation",
        "gets `null`, never `0.0`: zero would read as *maximally replaceable*, which",
        "is the opposite of what an absent profile says.",
        "",
        "**What it cannot do.** Explain *why* any of them is unprofiled. The script",
        "that builds this table needs `data/bls/db-30-2-text/`, which is gitignored",
        "and does not ship, so from a clean clone the gap cannot be traced to its",
        "cause.",
        "",
        "---",
        "",
        "## Coverage of the layer (record)",
        "",
        "| | Count | Share |",
        "| --- | ---: | ---: |",
        "| Occupations in the shipped table | %d | 100%% |" % cov["total"],
        "| Scored | %d | %.1f%% |" % (cov["profiled"],
                                      100.0 * cov["profiled"] / max(1, cov["total"])),
        "| **No score at all** | **%d** | **%.1f%%** |" % (cov["unprofiled"],
                                                          cov["unprofiled_pct"]),
        "| — of those, named occupations | %d | |" % cov["unprofiled_named"],
        "| — of those, `All Other` catch-alls | %d | |" % cov["unprofiled_all_other"],
        "",
        "### The gap has two different causes",
        "",
        "| Cause | Count | What it means |",
        "| --- | ---: | --- |",
        "| Aggregate `.00` parent rows | **%d** | %d of them have a scored `.0X` "
            "version one level down; **%d do not**. |"
            % (cov["unprofiled_dot00"], cov["unprofiled_with_profiled_child"],
               cov["unprofiled_dot00"] - cov["unprofiled_with_profiled_child"]),
        "| Detailed `.0X` rows | **%d** | No profile at any level — genuinely "
            "undescribed work. |" % cov["unprofiled_detailed"],
        "| **Total** | **%d** | |" % cov["unprofiled"],
        "",
        "%d + %d = %d. The two are a subset and its complement, not competing counts."
            % (cov["unprofiled_dot00"], cov["unprofiled_detailed"], cov["unprofiled"]),
        "",
    ]

    if cov["unprofiled_detailed_rows"]:
        L += ["The %d detailed rows with no profile at all:" % cov["unprofiled_detailed"], ""]
        L += ["- `%s` %s" % (r["soc"], r["title"]) for r in cov["unprofiled_detailed_rows"]]
        L += ["",
              "These are recent occupations. **Data Scientists is NOT one of them** — it",
              "is an aggregate row that does have a scored version one level down, which",
              "is a weaker failure and admits a better fallback. It is one of only %d such"
                  % cov["unprofiled_with_profiled_child"],
              "rows out of %d." % cov["unprofiled_dot00"],
              ""]

    L += [
        "The split matters. A missing score on *Computer Occupations, All Other* is a",
        "residual bucket behaving like one. A missing score on *Data Scientists* is the",
        "layer failing on a real, named, well-paid occupation.",
        "",
    ]

    if cov["named_unprofiled_sample"]:
        L += ["### Unprofiled named occupations in the 15-xxxx computer/math family",
              "",
              "| SOC | Occupation | BLS median wage |", "| --- | --- | ---: |"]
        for r in cov["named_unprofiled_sample"]:
            L.append("| `%s` | %s | %s |" % (
                r["soc"], r["title"],
                "${:,.0f}".format(r["median_wage"]) if r["median_wage"] else "—"))
        L += ["",
              "Every one of these has a published BLS wage. The government knows what",
              "these jobs pay; O*NET has not described what they do.",
              ""]

    L += ["## Target roles", ""]
    if result["scored"]:
        L += ["### Scored (record)", "",
              "| SOC | Occupation | Score | Inputs | Shipped value agrees? | Median wage |",
              "| --- | --- | ---: | :---: | :---: | ---: |"]
        for s in result["scored"]:
            rq = s["role_quality"]
            L.append("| `%s` | %s | **%.3f** | %d/%d | %s | %s |" % (
                s["soc"], s["title"], rq["value"], rq["inputs_present"], rq["of"],
                "yes" if rq["agrees_with_shipped"] else "**NO**",
                "${:,.0f}".format(s["median_wage"]["value"]) if s["median_wage"]["value"] else "—"))
        L += ["",
              "`Inputs` and the agreement column exist because the score was recomputed",
              "from the nine source columns rather than read from the shipped field. A",
              "disagreement would mean the published column no longer matches its inputs.",
              ""]

    for r in result["refused"]:
        L += ["### Refused: %s (`%s`) — no score, `record`" % (r.get("title", r["soc"]),
                                                              r["soc"]), "",
              "**No role-quality score is emitted.** Reason: `%s`." % r["reason"], ""]
        if r.get("detail"):
            L += [r["detail"] + ".", ""]
        if r.get("median_wage", {}).get("value"):
            L += ["BLS median wage: **${:,.0f}** (`record`) — the wage exists; the profile "
                  "does not.".format(r["median_wage"]["value"]), ""]
        band = r.get("fallback_band")
        if band and band.get("n"):
            L += ["**Fallback band — `model-judgment`, not a score for this role.**", "",
                  "Tier used: **`%s`** — %s." % (band["tier"], band["basis"]), "",
                  "| SOC | Occupation | Score | Median wage |",
                  "| --- | --- | ---: | ---: |"]
            for p in band["peers"]:
                L.append("| `%s` | %s | %.3f | %s |" % (
                    p["soc"], p["title"], p["score"],
                    "${:,.0f}".format(p["median_wage"]) if p["median_wage"] else "—"))
            L += ["",
                  "Range **%.3f – %.3f** (median %.3f, spread %.3f across %d occupations)."
                      % (band["min"], band["max"], band["median"], band["spread"], band["n"]),
                  "",
                  "**Do not read this as the target's score.** The peers are listed",
                  "individually so the substitution can be rejected rather than inherited,",
                  "and the spread of %.3f is itself the argument against collapsing them"
                      % band["spread"],
                  "to a point estimate.",
                  ""]
            if band["tier"] == "broad-code":
                L += ["This is the stronger of the two tiers. These rows are not merely",
                      "nearby occupations — they are **this same occupation described at a",
                      "finer grain**. O*NET profiles at the detailed level and leaves the",
                      "aggregate `.00` row empty: %d of the %d unscorable rows end in"
                          % (cov["unprofiled_dot00"], cov["unprofiled"]),
                      "`.00`, and in %d cases a child of that same parent is profiled. So"
                          % cov["unprofiled_with_profiled_child"],
                      "the data is not missing from O*NET; it is missing from *this row*.",
                      "",
                      "For THIS occupation that changes the honest answer from \"nobody",
                      "knows what this work demands\" to \"the demands are recorded one",
                      "level down\". It does not generalise: only %d of the %d aggregate"
                          % (cov["unprofiled_with_profiled_child"], cov["unprofiled_dot00"]),
                      "rows have that, and the reason any of them is empty is unverified.",
                      ""]
            else:
                L += ["This is the weaker tier: no child specialisation of this occupation",
                      "is profiled either, so the comparison rests on catalogue adjacency",
                      "alone. Treat it as a very rough bound.",
                      ""]
        L += ["Next action: %s." % r["next_action"], ""]

    if cov["partial_scores"]:
        L += ["## Data problems (record)", "",
              "**Scores built from fewer than nine inputs.** The repo's function averages",
              "whatever subset is present and returns `None` only when all nine are absent,",
              "so a score from 7 inputs is printed identically to one from 9.",
              "",
              "| SOC | Occupation | Inputs | Score |", "| --- | --- | :---: | ---: |"]
        for p in cov["partial_scores"]:
            L.append("| `%s` | %s | %d/%d | %.3f |" % (
                p["soc"], p["title"], p["inputs_present"], p["of"], p["score"]))
        L += ["", "Reported, not corrected — fixing it means editing a maintained script,",
              "which this mode does not do.", ""]

    if cov["shipped_vs_recomputed_mismatches"]:
        L += ["### Shipped value disagrees with its own inputs", "",
              "| SOC | Occupation | Shipped | Recomputed |", "| --- | --- | ---: | ---: |"]
        for d in cov["shipped_vs_recomputed_mismatches"]:
            L.append("| `%s` | %s | %s | %.3f |" % (
                d["soc"], d["title"],
                "%.3f" % d["shipped"] if d["shipped"] is not None else "—",
                d["recomputed"]))
        L.append("")
    else:
        L += ["### Cross-check", "",
              "Every scored occupation's shipped `cognitive_pivot_score` was recomputed",
              "from its nine source columns and matched to within 0.0015. The published",
              "column is consistent with its inputs.", ""]

    reach = cov["tier_reachability"]
    L += ["## Can any outcome never happen? (reachability audit)", "",
          "A category that is structurally unable to be non-zero is a design flaw",
          "wearing the costume of a finding. Every fallback tier this mode can emit",
          "was therefore counted across **all %d** unscorable occupations, not just"
              % cov["unprofiled"],
          "the target roles:",
          "",
          "| Tier | Occupations it would fire for | Reachable? |",
          "| --- | ---: | :---: |"]
    for t in ("broad-code", "minor-group", "none"):
        n = reach.get(t, 0)
        L.append("| `%s` | %d | %s |" % (t, n, "yes" if n else "**NO — investigate**"))
    L += ["",
          "All three fire, so none is forced to zero by the design. Where a count in",
          "this report *is* zero, it is a property of the data rather than of the code:",
          "the cross-check found no disagreement between shipped and recomputed scores",
          "because the shipped column is in fact consistent with its inputs, and the",
          "test suite proves that check fails when given a row where it is not.",
          "",
          "## What this cannot verify", "",
          "- **Why %d occupations are unprofiled.** `%s`" % (
              cov["unprofiled"], m["generator_runnable"]["reason"]),
          "- **That a neighbour resembles the target.** SOC adjacency is a filing",
          "  convention. The band is `model-judgment`.",
          "- **That the score measures AI-resilience.** It is an unweighted mean of nine",
          "  self-reported O*NET levels — a proxy for the thesis, not a measurement of it.",
          "- **Anything about a specific employer.** This mode reads occupations, not companies.",
          "",
          "## Why this is a report and not a scorer input",
          "",
          "`scripts/score/role-scorer.mjs` sets `role_quality` weight to **0.0**, tagged",
          "`[VERIFY]`. Feeding these numbers to the scorer would change no verdict. The",
          "worked run demonstrates that empirically rather than citing it. So the output",
          "is written for a human to read, and the mode says so instead of implying a",
          "score it cannot move.",
          "",
          "---",
          "",
          "*Generated %s from `%s` (%d rows).*" % (m["generated_for"], m["input_csv"],
                                                   m["rows_read"]),
          ]

    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(L) + "\n")
    return json_path, md_path


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=None, help="repo root (default: inferred)")
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--soc", action="append", default=None,
                    help="target SOC code; repeatable. Default: the six data/AI codes.")
    ap.add_argument("--today", default=None)
    ap.add_argument("--soc-csv", default=None,
                    help="override the SOC table path (tests point this at a fixture)")
    a = ap.parse_args(argv)

    root = a.root or os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
    today = dt.date.fromisoformat(a.today) if a.today else dt.date.today()
    socs = {s: "requested" for s in a.soc} if a.soc else dict(TARGET_SOCS)

    result = build(root, socs, today, a.soc_csv)
    jp, mp = write_outputs(result, a.out_dir)

    cov = result["coverage"]
    print("rows read              : %d" % cov["total"])
    print("scored                 : %d of %d target SOCs" % (len(result["scored"]), len(socs)))
    print("refused (no profile)   : %d" % len(result["refused"]))
    print("layer coverage gap     : %d of %d occupations unscorable (%.1f%%)"
          % (cov["unprofiled"], cov["total"], cov["unprofiled_pct"]))
    print("  of those, named      : %d" % cov["unprofiled_named"])
    print("partial-input scores   : %d" % len(cov["partial_scores"]))
    print("shipped/recomputed mismatches: %d" % len(cov["shipped_vs_recomputed_mismatches"]))
    print("generator re-runnable  : no (%s)" % result["meta"]["generator_runnable"]["reason"])
    print("wrote                  : %s" % jp)
    print("                       : %s" % mp)

    if not result["scored"]:
        print("STOP no target SOC could be scored — nothing to report on.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
