# cogpivot-unprofiled — human card

**Audience:** someone choosing which job titles to target, who wants to know which
of them is work that holds its value.
**Agent twin:** `recipes/cases/2026fa/beswathi-cogpivot-unprofiled.md`
**Layer:** The Cognitive Pivot (BLS OEWS wages + O*NET ability/skill levels).
**Persona:** Priya Nair — the fictional example at `search/examples/priya-nair/`.
Every personal detail traces to that file; none describes a real person.

## What the score is

`cognitive_pivot_score` is an **unweighted mean of nine O*NET levels** — originality,
problem sensitivity, deductive and inductive reasoning, critical thinking, judgment
and decision making, complex problem solving, systems analysis, systems evaluation
(`scripts/bls/extract-soc-occupation-table.py:128`).

It is a **proxy** for the Cognitive Pivot thesis, not a measurement of AI-resilience.

## The finding

The layer cannot score **122 of 1,016 occupations (12.0%)** — all nine inputs absent.
The gap has two causes, and conflating them overstates the problem:

| Cause | Count | What it means |
|---|---:|---|
| Aggregate `.00` rows | **119** | Only **26** have a scored `.0X` version one level down. **93 do not.** |
| Detailed `.0X` rows | **3** | No profile at any level: Penetration Testers, Digital Forensics Analysts, Blockchain Engineers. |
| **Total** | **122** | |

**Data Scientists (15-2051.00) is one of the 26** whose detail exists one level
down: Business Intelligence Analysts 3.903, Clinical Data Managers 3.738. So for
this occupation a defensible fallback exists. That the aggregate row was *never
filled in* is `model-judgment` — the most likely reading, not something the run
establishes, and it holds for 26 rows rather than all 119.

Of the 122, **45** are named occupations and **77** are `All Other` catch-alls. A
gap on a residual bucket is a bucket behaving like one; a gap on a named occupation
is the layer failing on real work.

## What it does about it

- **Profiled SOC** → score labelled `record`, recomputed from the nine columns and
  cross-checked against the shipped value rather than read from it.
- **Unprofiled SOC** → **no score.** `null`, never `0.0` — zero would read as
  *maximally replaceable*, the opposite of what an absent profile says.
- **In place of a score** → a band across the profiled occupations sharing the broad
  SOC code (its children, or its siblings if the row is itself a specialisation),
  labelled **`model-judgment`**, every peer named so a reader can reject the
  substitution instead of inheriting it.

## What it can verify

- That an occupation exists in the shipped table, with its BLS wage, employment and
  job zone.
- How many of the nine inputs produced a given score (four occupations are built on
  fewer than nine and are published indistinguishably — reported here).
- That the published score agrees with its own inputs, within 0.0015.
- Which occupations have no score, split by cause.

## What it cannot verify

- **Why any occupation is unprofiled.** `scripts/bls/extract-soc-occupation-table.py` needs
  `data/bls/db-30-2-text/`, which is gitignored and absent, so from a clean clone
  the gap cannot be traced to its cause. **This is a ninth "fact that bites"
  beyond the eight listed.**
- **That a broad-code peer resembles the target.** Sharing a SOC prefix is a
  cataloguing fact, not a claim about the work.
- **That the score measures AI-resilience.** See above — it is a proxy.
- **Anything about an employer.** This mode reads occupations only.

## Why this is a report and not a scorer input

`role-scorer.mjs` sets `role_quality` weight to **0.0**, tagged `[VERIFY]`.

Measured, not assumed: two role sets identical except `role_quality` 0.0 versus 1.0
both score composite **0.59** and both return **Apply**. Feeding this mode's output
to the scorer would change nothing, so it is written for a human instead.

## No category is forced to zero

Counted across all 122 unscorable occupations: `broad-code` fires for 29,
`minor-group` for 74, `none` for 19. All three are reachable. Where a count in the
report is zero it is a property of the data — the shipped scores genuinely agree
with their inputs, and the test suite proves that check fails on a row where they
do not.

## Dependencies

Python 3 standard library only. Node 20+ for `npm run score`. No network.

## Commands

```bash
python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py \
  --out-dir course/2026fa/submissions/beswathi/runs

python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py
python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/presubmit_check.py
```

## Human gate

**G2 is never cleared by the script.** Where an occupation has no profile, a person
must decide whether the broad-code band is a fair substitute for *this* occupation,
or treat role quality as unknown. The script names the peers so that judgment can be
made rather than assumed.
