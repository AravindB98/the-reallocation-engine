# 2026fa — beswathi — run 2

## Executive summary

**What this is.** The first worked run of the `cogpivot-unprofiled` mode against the
real 1,016-row BLS/O*NET compact table, plus the repository's own `role-scorer.mjs`
used to measure the `role_quality` weight.

**Why it exists.** To find out whether the Cognitive Pivot layer can answer its own
question — *is this work AI cannot yet do?* — for a specific set of target
occupations, and to make its silences visible instead of filling them in.

**What it found.** 122 of 1,016 occupations (12.0%) cannot be scored, because all
nine inputs are absent. The gap has two causes: **119** are aggregate `.00` rows
of which only **26** have a scored version one level down (`record`), and **3** are
detailed rows with no profile at any level (`record`). 5 of 6 target occupations scored (`record`); 1 — Data
Scientists — refused, with a `model-judgment` band in place of a score. The six
target occupations are `your-input`.

**What it did not do.** Explain why any occupation is unprofiled, or feed anything
into the scorer. `role_quality` carries weight 0.0, measured not assumed.

---

- **Mode:** `recipes/cases/2026fa/beswathi-cogpivot-unprofiled.md` (v0.1.0,
  `RUNNABLE-SAMPLE`)
- **Date:** 2026-10-16
- **Hosts contacted:** none. No command below makes a network call.
- **Persona:** Priya Nair — `search/examples/priya-nair/`, labelled **repo example
  (fictional)**, not `record`. No real person's data appears in any committed file.
- **Authorship:** commands were run by Claude Code (Opus 5.5) in the student's
  session at her direction. She reviewed the output, re-ran the offline suite and the
  15-2051.00 break attempt herself (55 checks, 0 failed; STOP, exit code 2), and
  checked the verification.

## Inputs

| Input | Label | Note |
|---|---|---|
| `data/bls/compact/soc_occupation_compact.csv` | `record` | 1,016 occupations, OEWS year 2024 |
| The nine score inputs | `record` | columns named in the mode file |
| Formula being reproduced | `record` | `scripts/bls/extract-soc-occupation-table.py:128` |
| Six target SOC codes | **`your-input`** | a mapping from job titles to occupation codes; a human judgment |

## Commands

```bash
python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py \
  --out-dir course/2026fa/submissions/beswathi/runs

npm run score -- /tmp/rq/roles-lo.json --out-dir /tmp/rq/lo
npm run score -- /tmp/rq/roles-hi.json --out-dir /tmp/rq/hi

python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py
python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/presubmit_check.py
```

## Result

```
rows read              : 1016
scored                 : 5 of 6 target SOCs
refused (no profile)   : 1
layer coverage gap     : 122 of 1016 occupations unscorable (12.0%)
  of those, named      : 45
partial-input scores   : 4
shipped/recomputed mismatches: 0
generator re-runnable  : no (needs data/bls/db-30-2-text/ … gitignored and absent)
exit 0
```

Result labels: the counts are `record` (counted from the shipped table, and
reproduced by an independent hand count). The refusal is a `record` fact about the
data. The fallback band offered in its place is `model-judgment`. The choice of six
target occupations is `your-input`.

## Outputs

| File | Audience |
|---|---|
| `course/2026fa/submissions/beswathi/runs/cogpivot-unprofiled.json` | the agent — every value carries a `source` |
| `course/2026fa/submissions/beswathi/runs/cogpivot-unprofiled.md` | a person deciding which titles to target |

## Findings

1. **122 of 1,016 occupations (12.0%) have no cognitive-pivot score** — every one of
   the nine inputs absent. `record`.
2. **The gap has two causes.** 119 aggregate `.00` rows + 3 detailed rows = 122.
   Within the 119, only **26** (`record`) have a scored version one level down and
   **93** do not. Reading an empty row as "never filled in" is `model-judgment`.
3. **Data Scientists (15-2051.00) is one of the 26** with a scored version one level
   down; its children score 3.738 and 3.903. `record` for the counts. That the
   aggregate row was never filled in is `model-judgment`, and it describes 26 rows,
   not all 119.
4. **45 of the 122 are named occupations**, not `All Other` catch-alls. `record`.
5. **`role_quality` carries weight 0.0.** Two role sets differing only in that term
   both scored composite 0.59 and both returned Apply. `record` — measured.
6. **4 occupations are scored on fewer than nine inputs** and are published
   indistinguishably from full scores. `record`.
7. **The published scores agree with their own inputs** — 0 mismatches across 1,016
   rows, recomputed rather than read. `record`.

## Gates

| Gate | State | Evidence |
|---|---|---|
| G1 input present | passed | 1,016 rows read |
| G2 occupation profiled | **open for 1 of 6** | Data Scientists refused; `role_quality: null` |
| G3 score matches inputs | passed | 0 mismatches; break attempt confirmed it fires |
| G4 anything to report | passed | 5 scored, exit 0 |

## Break attempts

| Attempt | Observed |
|---|---|
| `--soc-csv /nope.csv` | `FAIL missing SOC table … (nothing invented)` · exit 1 |
| `--soc 15-2051.00` alone | `role_quality: null`; `STOP` · exit 2 |
| shipped score corrupted to 9.999 | mismatch reported; `agrees_with_shipped: False` |
| code mutated to emit `0.0` | suite fails, 1 check |
| band relabelled `record` | suite fails, 2 checks |

The third attempt **failed silently on its first try** — a `sed` written by Claude
Code that did not edit the column, so the run came back clean and looked like a
passing check. Rewritten in Python, the detector fired. Recorded because a break
attempt that does not break anything returns a false pass.

## Open issues

- **Why the 119 aggregates are empty is unknown.** `scripts/bls/extract-soc-occupation-table.py`
  needs `data/bls/db-30-2-text/`, which is gitignored and absent, so the cause cannot
  be traced from a clean clone. This is a ninth "fact that bites".
- **The fallback band is a judgment.** SOC adjacency is a cataloguing fact. A human
  must accept or reject it; the mode only names the peers.
- **The score is a proxy.** An unweighted mean of nine self-reported O*NET levels is
  not a measurement of AI-resilience.
- **`role_quality` has no weight**, so none of this reaches a verdict. Giving it one
  or removing it is an authorial decision this mode does not make.
- **4 partial-input scores remain unmarked in the shipped data.** Fixing that means
  editing a maintained script.

## Verification

- Counts reproduced by an independent hand count straight from the CSV: 1016 / 122 /
  119 — identical.
- JSON parsed rather than trusting the console: `unprofiled` 122 = `dot00` 119 +
  `detailed` 3.
- `python3 test_cogpivot_unprofiled.py` → 55 checks in 14 tests, 0 failed, offline.
- `npm run verify` → conformance 167 files ✓, manifest ✓. `npm run doctor` → ✓.
- `presubmit_check.py` → 7 checks pass, each one a mistake that cost marks before.

Full attestation, including what was deliberately not tested, is in
`course/2026fa/submissions/beswathi/WORKED-RUN.md`.
