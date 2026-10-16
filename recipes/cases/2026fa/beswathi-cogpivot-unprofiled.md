---
status: RUNNABLE-SAMPLE
todos_open: 3
last_gate: G2-open
attestation: course/2026fa/submissions/beswathi/WORKED-RUN.md
recipe_version: 0.1.0
---

# cogpivot-unprofiled — AI-resilience for roles O*NET has not described

## Executive summary

**What it does.** Answers "is this work AI cannot yet do?" for a chosen set of
occupations — and **refuses to answer** where the data cannot support one, rather
than returning a number that looks like an answer.

**Who it is for.** Priya Nair, the fictional example persona at
`search/examples/priya-nair/`: F-1, post-completion OPT year 1, Boston, targeting
AI Engineer / ML Engineer and Data Engineer roles. Someone deciding which titles to
aim at, who wants to know which of them is work that still pays in a few years.

**What it decides.** Per occupation: a role-quality score labelled `record`, or a
refusal carrying a named fallback band labelled `model-judgment`. It never emits
`0.0` to mean "unknown".

**The finding.** The Cognitive Pivot layer cannot score **122 of 1,016** occupations,
because all nine of its inputs are absent. That gap has two different causes:

- **119** are aggregate `.00` rows. O*NET profiles the detailed `.0X`
  specialisations and leaves the summary row empty, so the data exists one level
  down.
- **3** are detailed rows with no profile at any level — Penetration Testers,
  Digital Forensics Analysts, Blockchain Engineers.

119 + 3 = 122. **Data Scientists (15-2051.00) is in the first group, not the
second.** Its two children — Business Intelligence Analysts (3.903) and Clinical
Data Managers (3.738) — are both profiled. So the layer is not blind to that work;
the aggregate row was never filled in, and a defensible fallback exists. This mode
reports that fallback as a range and labels it a judgment, rather than presenting
it as the occupation's score.

**The limit that matters.** The mode cannot explain *why* any occupation is
unprofiled, because the script that builds the table needs O*NET source files the
repository does not ship.

---

## Who this is for, precisely

Every detail below comes from `search/examples/priya-nair/profile.yml` and
`search/examples/priya-nair/resume.example.json`, the fictional example persona the repository already ships.
Nothing here describes a real person — `DATA_CONTRACT.md` §Zero-Conditions requires
a fictional person with invented dates in every committed file, and dates count as
much as names.

| Field | Value | Where it comes from |
|---|---|---|
| Name / contact | Priya Nair, `priya.nair@example.com`, Boston MA | `search/examples/priya-nair/profile.yml` |
| Visa | F-1, post-completion OPT year 1 | `search/examples/priya-nair/profile.yml` `visa.type` |
| OPT window | EAD 2026-02-01 → 2027-01-31; 34 of 90 unemployment days used | `search/examples/priya-nair/profile.yml` `visa` |
| Education | MS Information Systems, Northeastern University | `search/examples/priya-nair/resume.example.json` |
| Target roles | AI Engineer / ML Engineer (primary), Data Engineer (secondary) | `search/examples/priya-nair/profile.yml` `target_role` |
| Open to remote | yes | `search/examples/priya-nair/profile.yml` `geography` |

The **SOC codes** this mode scores are not in her profile — they are a mapping from
those target titles onto occupation codes, which is a human judgment. They are
labelled **`your-input`** in the output for that reason, and a different reader
would reasonably choose differently.

She can already read a wage table. What she cannot see is which of those titles is
work that holds its value — and for the occupation closest to her primary target,
the layer that is supposed to answer carries no score of its own.

## Purpose, and exactly when to use it

Run this **before** committing a search to a target title, and **after** the
sponsorship pass has produced a candidate set. It answers a different question from
sponsorship coverage: not *will anyone hire me*, but *is this work worth being hired
into*.

Do **not** run it to rank employers. It reads occupations, never companies.

## Source Inventory

| What | Exact path / command | Label |
|---|---|---|
| SOC + O*NET compact table | `data/bls/compact/soc_occupation_compact.csv` (1,016 rows) | `record` |
| The nine score inputs | `ability_originality_lv`, `ability_problem_sensitivity_lv`, `ability_deductive_reasoning_lv`, `ability_inductive_reasoning_lv`, `skill_critical_thinking_lv`, `skill_judgment_decision_making_lv`, `skill_complex_problem_solving_lv`, `skill_systems_analysis_lv`, `skill_systems_evaluation_lv` | `record` |
| The formula being reproduced | `scripts/bls/extract-soc-occupation-table.py:128` — unweighted mean, `None` only when all nine are absent | `record` |
| This mode | `python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py --out-dir <dir>` | — |
| Offline tests | `python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py` | — |
| Mistake gate | `python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/presubmit_check.py` | — |
| Repo scorer (run in the worked run) | `npm run score -- <roles.json> --out-dir <dir>` | `record` |
| Repo conformance | `npm run verify`, `npm run doctor` | `record` |
| Target SOC codes | chosen by the candidate; a different person would choose differently | **`your-input`** |

**Commands checked, not assumed.** `npm run ats:scan -- --dry-run` is listed in the
assignment but does **not** run on a fresh clone — it needs `portals.yml` from an
onboarding step, prints `Error: portals.yml not found`, and still exits 0. It is
therefore not used here. This mode runs `npm run score`, which does work.

## Proposed additions

- `[TODO: DATA SOURCE]` Ship or document a fetch for `data/bls/db-30-2-text/`
  (`Abilities.txt`, `Skills.txt`, `Occupation Data.txt`). It is gitignored, so
  `scripts/bls/extract-soc-occupation-table.py` cannot be re-run from a clean clone and the
  122-row gap cannot be traced to its cause. **This is a ninth "fact that bites"
  beyond the eight the assignment lists.**
- `[TODO: DEV]` Make the repo's `cognitive_pivot_score` record how many of the nine
  inputs produced it. It averages whatever subset is present, so a score from seven
  inputs is published indistinguishably from one built on nine. Four occupations are
  affected. Fixing it means editing a maintained script, which this mode does not do.
- `[TODO: DEV]` Give `role_quality` a justified weight, or remove it from the scorer.
  It is currently `0.0` and tagged `[VERIFY]`; see the gate below.

## Phase gates

Each gate is a hard stop with a condition a test can check.

| Gate | Condition | On failure |
|---|---|---|
| **G1 — input present** | `data/bls/compact/soc_occupation_compact.csv` exists | exit 1, `FAIL missing SOC table … (nothing invented)`. No row is synthesised. |
| **G2 — occupation profiled** | all nine inputs present for the SOC | **no score is emitted.** `role_quality: null`, `reason: no-onet-profile`. Not `0.0`. |
| **G3 — score matches its inputs** | shipped `cognitive_pivot_score` equals the value recomputed from the nine columns, within 0.0015 | the row is flagged `agrees_with_shipped: false` and listed in the report. The shipped column is never trusted unchecked. |
| **G4 — anything to report** | at least one target SOC scored | exit 2 with `STOP` on stderr, so a chained `&& npm run score` halts rather than scoring an empty set. |

**Liveness and visa-timeline are not gates here.** The engine treats both as gates,
and correctly so — but each applies to a *posting*, and this mode reads occupations
from a BLS/O*NET table. There is no posting to be expired and no hiring process to
outrun. Importing those gates would be decoration, and a gate that cannot fire is
exactly the failure this mode is written to avoid. They belong in the sponsorship
pass that runs before this one.

**G2 is the gate this mode exists for.** A closed G2 is not a low score — it is the
absence of a score, and the two must not look alike in the output.

## What it can verify

- That an occupation row exists in the shipped table, and what BLS records for its
  median wage, employment and job zone.
- Whether each of the nine inputs is present, and how many produced a given score.
- That the published `cognitive_pivot_score` agrees with its own inputs — checked by
  recomputing, not by reading the column.
- Which occupations have no score, split by cause: aggregate `.00` rows versus
  detailed `.0X` rows.
- Which profiled occupations share a target's broad or minor SOC group, and the
  range of their scores.

## What it cannot verify

- **Why an occupation is unprofiled.** The generator needs `data/bls/db-30-2-text/`,
  which is gitignored and absent. From a clean clone nobody can tell whether O*NET
  lacks the data or the extraction dropped it. This is the central limit.
- **That a broad-code peer resembles the target.** Sharing a SOC prefix is a
  cataloguing fact, not a statement about the work.
- **That the score measures AI-resilience at all.** It is an unweighted mean of nine
  self-reported O*NET levels — a proxy for the Cognitive Pivot thesis, not a
  measurement of it. A ranking built on it inherits that proxy.
- **Anything about an employer.** This mode reads occupations only.
- **That a higher score means a better job for this candidate.** Wage, sponsorship
  and whether the work is interesting are all outside it.

## The scorer problem, stated rather than worked around

`scripts/score/role-scorer.mjs` sets `role_quality` weight to **0.0**, tagged
`[VERIFY]`. So feeding this mode's output into the scorer would change nothing.

That is **measured, not assumed**. Two role sets identical except `role_quality`
`0.0` versus `1.0` both score composite **0.59** and both return **Apply** — see the
worked run.

The mode therefore writes role quality into the **human report only**, and says so.
Passing it to the scorer and implying it moved a verdict would be theatre. The
honest options are to give the term a justified weight or drop it, and both are an
authorial decision this mode does not get to make — hence the `[TODO: DEV]` above.

## Output Contract

One artifact cannot serve both readers (P5).

**Agent log** — `<out-dir>/cogpivot-unprofiled.json`: `meta`, `coverage`, `scored`,
`refused`, `data_problems`. Every emitted value carries a `source`. A refused
occupation carries `role_quality: null` and a machine-readable `reason`.

**Human report** — `<out-dir>/cogpivot-unprofiled.md`: executive summary first (P9),
then coverage, the two causes of the gap, per-role results, the reachability audit,
data problems, and what it cannot verify.

**Reachability.** The report states, for every outcome the mode can emit, how many
occupations across the whole table would produce it — so a zero is visibly a
property of the data rather than a category the design made unreachable.

## Stop conditions

The mode refuses rather than guesses when:

1. The SOC table is missing → exit 1.
2. A requested SOC is not in the table → reported as `soc-not-in-table`; no score.
3. An occupation has no O*NET profile → `role_quality: null`. **Never `0.0`.**
4. No profiled peer exists at either tier → no fallback band; `tier: none`.
5. No target SOC could be scored → exit 2.

## Logging rules

Each run appends `logs/runs/2026fa-beswathi-<n>.md`. **`logs/RUN_LOG.md` is never
edited** — the file says students must not, and CI rejects PRs that modify it
(`.github/workflows/contrib-gate.yml`). The assignment's instruction to append there is satisfied by
including the entry in the submission, which it explicitly permits.

### Log template

```markdown
## YYYY-MM-DD — cogpivot-unprofiled

- **Mode:** cogpivot-unprofiled v<version>
- **Inputs:** data/bls/compact/soc_occupation_compact.csv (<n> rows); target SOCs (your-input)
- **Commands:** <verbatim, with real output pasted>
- **Outputs:** <out-dir>/cogpivot-unprofiled.{json,md}
- **Result:** <x> scored · <y> refused · <z> of <n> occupations unscorable
- **Verified vs inferred:** <per-term split>
- **Gates:** G1 <state> · G2 <state> · G3 <state> · G4 <state>
- **Open issues:** <what is still unknown>
```

## Exit codes

`0` healthy · `1` a required input is missing · `2` nothing could be scored.

## Open TODOs

- `[TODO: DATA SOURCE]` ship or document a fetch for the O*NET text tables.
- `[TODO: DEV]` record input counts behind `cognitive_pivot_score`.
- `[TODO: DEV]` resolve the `role_quality` weight.
