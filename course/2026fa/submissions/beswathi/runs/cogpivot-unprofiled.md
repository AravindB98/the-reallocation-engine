# Cognitive-pivot coverage for early-career data/AI roles

## Executive summary

**What this is.** A check of whether the Cognitive Pivot layer can answer
its own question — *is this work AI cannot yet do?* — for the occupations
a chosen set of target titles maps onto.

**What it found.** For **122 of 1016 occupations (12.0%)** none of the nine
`cognitive_pivot_score` inputs are present, so no mean exists. The gap has
two causes, and they are not equally serious:

- **119** are aggregate `.00` rows. Of those, **26** have a scored version
  one level down and **93** do not, so an empty summary row does NOT by
  itself mean the detail exists.
- **3** are detailed rows with no profile at any level.

119 + 3 = 122. **Data Scientists (15-2051.00) is one of the 26** with a
scored version one level down, so for that occupation a fallback exists.
That the aggregate row was *never filled in* is the most likely reading of
the pattern, not something this run can establish: it is `model-judgment`.

**What it refuses to do.** Emit a number anyway. An unprofiled occupation
gets `null`, never `0.0`: zero would read as *maximally replaceable*, which
is the opposite of what an absent profile says.

**What it cannot do.** Explain *why* any of them is unprofiled. The script
that builds this table needs `data/bls/db-30-2-text/`, which is gitignored
and does not ship, so from a clean clone the gap cannot be traced to its
cause.

---

## Coverage of the layer (record)

| | Count | Share |
| --- | ---: | ---: |
| Occupations in the shipped table | 1016 | 100% |
| Scored | 894 | 88.0% |
| **No score at all** | **122** | **12.0%** |
| — of those, named occupations | 45 | |
| — of those, `All Other` catch-alls | 77 | |

### The gap has two different causes

| Cause | Count | What it means |
| --- | ---: | --- |
| Aggregate `.00` parent rows | **119** | 26 of them have a scored `.0X` version one level down; **93 do not**. |
| Detailed `.0X` rows | **3** | No profile at any level — genuinely undescribed work. |
| **Total** | **122** | |

119 + 3 = 122. The two are a subset and its complement, not competing counts.

The 3 detailed rows with no profile at all:

- `15-1299.04` Penetration Testers
- `15-1299.06` Digital Forensics Analysts
- `15-1299.07` Blockchain Engineers

These are recent occupations. **Data Scientists is NOT one of them** — it
is an aggregate row that does have a scored version one level down, which
is a weaker failure and admits a better fallback. It is one of only 26 such
rows out of 119.

The split matters. A missing score on *Computer Occupations, All Other* is a
residual bucket behaving like one. A missing score on *Data Scientists* is the
layer failing on a real, named, well-paid occupation.

### Unprofiled named occupations in the 15-xxxx computer/math family

| SOC | Occupation | BLS median wage |
| --- | --- | ---: |
| `15-1255.00` | Web and Digital Interface Designers | $98,090 |
| `15-1299.04` | Penetration Testers | $108,970 |
| `15-1299.06` | Digital Forensics Analysts | $108,970 |
| `15-1299.07` | Blockchain Engineers | $108,970 |
| `15-2051.00` | Data Scientists | $112,590 |

Every one of these has a published BLS wage. The government knows what
these jobs pay; O*NET has not described what they do.

## Target roles

### Scored (record)

| SOC | Occupation | Score | Inputs | Shipped value agrees? | Median wage |
| --- | --- | ---: | :---: | :---: | ---: |
| `15-1243.01` | Data Warehousing Specialists | **3.626** | 9/9 | yes | $135,980 |
| `15-1242.00` | Database Administrators | **3.958** | 9/9 | yes | $104,620 |
| `15-2041.00` | Statisticians | **3.958** | 9/9 | yes | $103,300 |
| `15-1211.00` | Computer Systems Analysts | **4.024** | 9/9 | yes | $103,790 |
| `15-1221.00` | Computer and Information Research Scientists | **4.516** | 9/9 | yes | $140,910 |

`Inputs` and the agreement column exist because the score was recomputed
from the nine source columns rather than read from the shipped field. A
disagreement would mean the published column no longer matches its inputs.

### Refused: Data Scientists (`15-2051.00`) — no score, `record`

**No role-quality score is emitted.** Reason: `no-onet-profile`.

all 9 cognitive-pivot inputs are absent for this SOC.

BLS median wage: **$112,590** (`record`) — the wage exists; the profile does not.

**Fallback band — `model-judgment`, not a score for this role.**

Tier used: **`broad-code`** — the detailed O*NET specialisations sharing broad code 15-2051 — this occupation's children.

| SOC | Occupation | Score | Median wage |
| --- | --- | ---: | ---: |
| `15-2051.02` | Clinical Data Managers | 3.738 | $112,590 |
| `15-2051.01` | Business Intelligence Analysts | 3.903 | $112,590 |

Range **3.738 – 3.903** (median 3.821, spread 0.165 across 2 occupations).

**Do not read this as the target's score.** The peers are listed
individually so the substitution can be rejected rather than inherited,
and the spread of 0.165 is itself the argument against collapsing them
to a point estimate.

This is the stronger of the two tiers. These rows are not merely
nearby occupations — they are **this same occupation described at a
finer grain**. O*NET profiles at the detailed level and leaves the
aggregate `.00` row empty: 119 of the 122 unscorable rows end in
`.00`, and in 26 cases a child of that same parent is profiled. So
the data is not missing from O*NET; it is missing from *this row*.

For THIS occupation that changes the honest answer from "nobody
knows what this work demands" to "the demands are recorded one
level down". It does not generalise: only 26 of the 119 aggregate
rows have that, and the reason any of them is empty is unverified.

Next action: judge the neighbour band by hand, or treat role quality as unknown for this role.

## Data problems (record)

**Scores built from fewer than nine inputs.** The repo's function averages
whatever subset is present and returns `None` only when all nine are absent,
so a score from 7 inputs is printed identically to one from 9.

| SOC | Occupation | Inputs | Score |
| --- | --- | :---: | ---: |
| `11-3031.00` | Financial Managers | 7/9 | 3.981 |
| `13-1041.00` | Compliance Officers | 8/9 | 3.155 |
| `23-1022.00` | Arbitrators, Mediators, and Conciliators | 8/9 | 3.593 |
| `27-2041.00` | Music Directors and Composers | 8/9 | 3.484 |

Reported, not corrected — fixing it means editing a maintained script,
which this mode does not do.

### Cross-check

Every scored occupation's shipped `cognitive_pivot_score` was recomputed
from its nine source columns and matched to within 0.0015. The published
column is consistent with its inputs.

## Can any outcome never happen? (reachability audit)

A category that is structurally unable to be non-zero is a design flaw
wearing the costume of a finding. Every fallback tier this mode can emit
was therefore counted across **all 122** unscorable occupations, not just
the target roles:

| Tier | Occupations it would fire for | Reachable? |
| --- | ---: | :---: |
| `broad-code` | 29 | yes |
| `minor-group` | 74 | yes |
| `none` | 19 | yes |

All three fire, so none is forced to zero by the design. Where a count in
this report *is* zero, it is a property of the data rather than of the code:
the cross-check found no disagreement between shipped and recomputed scores
because the shipped column is in fact consistent with its inputs, and the
test suite proves that check fails when given a row where it is not.

## What this cannot verify

- **Why 122 occupations are unprofiled.** `needs data/bls/db-30-2-text/ (Abilities.txt, Skills.txt, Occupation Data.txt) which is gitignored and absent`
- **That a neighbour resembles the target.** SOC adjacency is a filing
  convention. The band is `model-judgment`.
- **That the score measures AI-resilience.** It is an unweighted mean of nine
  self-reported O*NET levels — a proxy for the thesis, not a measurement of it.
- **Anything about a specific employer.** This mode reads occupations, not companies.

## Why this is a report and not a scorer input

`scripts/score/role-scorer.mjs` sets `role_quality` weight to **0.0**, tagged
`[VERIFY]`. Feeding these numbers to the scorer would change no verdict. The
worked run demonstrates that empirically rather than citing it. So the output
is written for a human to read, and the mode says so instead of implying a
score it cannot move.

---

*Generated 2026-10-19 from `data/bls/compact/soc_occupation_compact.csv` (1016 rows).*
