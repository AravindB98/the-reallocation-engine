# Worked run — cogpivot-unprofiled

## Executive summary

**What was run.** The mode against the real 1,016-row BLS/O*NET table (`record`),
the repository's own `role-scorer.mjs` (`record`), the offline suite, and five
deliberate attempts to break it.

**What it produced.** 5 of 6 target occupations scored (`record` — recomputed from
the nine O*NET columns); 1 refused, carrying a fallback band that is
`model-judgment`. Across the whole table 122 occupations cannot be scored at all
(`record`). Which 6 occupations count as "my field" is `your-input`.

**What went wrong while doing it.** Claude Code's first corruption test silently did
nothing — `sed` failed to edit the column, so it nearly recorded both a break attempt
that never happened and a detector that looked broken when it was not. Redone
properly below.

**Authorship.** Commands were run by Claude Code (Opus 5.5) in my session at my
direction. I reviewed the output, re-ran the offline suite and the 15-2051.00 break
attempt myself (55 checks, 0 failed; STOP, exit code 2), and checked the
verification.

---

## Inputs

| Input | Value | Label |
|---|---|---|
| SOC + O*NET table | `data/bls/compact/soc_occupation_compact.csv`, 1,016 rows | `record` |
| Persona | Priya Nair — `search/examples/priya-nair/` (no real person's data) | **repo example (fictional)** |
| Target SOC codes | 6 codes mapped from her target titles | **`your-input`** |
| Date of run | 2026-10-16 | `your-input` |
| Scorer probe inputs | `scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-{lo,hi}.json` — committed, fictional company | **repo example (fictional)** |

## Commands and their real output

### A — the mode

```
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py \
    --out-dir course/2026fa/submissions/beswathi/runs
rows read              : 1016
scored                 : 5 of 6 target SOCs
refused (no profile)   : 1
layer coverage gap     : 122 of 1016 occupations unscorable (12.0%)
  of those, named      : 45
partial-input scores   : 4
shipped/recomputed mismatches: 0
generator re-runnable  : no (needs data/bls/db-30-2-text/ (Abilities.txt, Skills.txt, Occupation Data.txt) which is gitignored and absent)
wrote                  : course/2026fa/submissions/beswathi/runs/cogpivot-unprofiled.json
                       : course/2026fa/submissions/beswathi/runs/cogpivot-unprofiled.md
exit=0
```

### B — a real, existing repo script: `npm run score`

The assignment requires at least one existing repo script to run against real data.
It was used to **measure** the `role_quality` weight rather than cite it. Two role
sets, identical except that one term — both committed, so the inputs are inspectable:

- `scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-lo.json` (`role_quality: 0.0`)
- `scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-hi.json` (`role_quality: 1.0`)

```
$ diff scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-lo.json scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-hi.json
3c3
<     "role_id": "probe-rolequality-lo",
---
>     "role_id": "probe-rolequality-hi",
23c23
<       "p": 0.0,
---
>       "p": 1.0,

$ npm run score -- scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-lo.json --out-dir /tmp/rq-lo
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
$ python3 -c "import json;r=json.load(open('/tmp/rq-lo/role-scores.json'))['roles'][0];print(r['composite'], r['recommendation'])"
0.59 Apply

$ npm run score -- scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/fixtures/roles-rolequality-hi.json --out-dir /tmp/rq-hi
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
$ python3 -c "import json;r=json.load(open('/tmp/rq-hi/role-scores.json'))['roles'][0];print(r['composite'], r['recommendation'])"
0.59 Apply
```

Result: identical composite, identical verdict (`record` — the scorer's own output).
**`role_quality` carries weight 0.0** — a measurement, not a quotation of the comment
in `scripts/score/role-scorer.mjs:37`. This is why the mode writes role quality to a
human report and never feeds the scorer.

### C — the offline suite

```
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py
  55 checks in 14 tests, 0 failed
```

Result: the suite passes (`record` — the suite's own output). It tests mechanism,
not whether any recommendation is correct.

### D — the repo's own conformance

```
$ npm run verify
conformance: 167 files (88 md · 38 py · 31 js · 6 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)

$ npm run doctor
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

Result: conformance and doctor both green (`record` — the repo's own checks).

## Verification

### 1. Counted by hand, independently of the mode

A separate script reading the CSV directly, not importing any of the mode's code:

```
rows            : 1016
no-profile rows : 122
ending .00      : 119
15-2051.00 nine inputs present: 0 / 9
15-2051.00 shipped score      : ''
15-2051.00 BLS median wage    : 112590.0
```

Result: matches the mode exactly, including the 119/122 split (`record` — counted
twice, by two separate pieces of code).

### 2. Parsed the JSON rather than trusting the console

`coverage.unprofiled` = 122, `coverage.unprofiled_dot00` = 119,
`coverage.unprofiled_detailed` = 3. 119 + 3 = 122.

### 3. Break attempts — verbatim terminal output

Five attempts, each pasted as it ran. A gate that never fires is decoration, so each
one tries to make the mode produce something it should refuse to produce.

**B1 — remove the input.**

```
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py --soc-csv /nope.csv --out-dir /tmp/b1
FAIL missing SOC table: /nope.csv (nothing invented)
$ echo $?
1
```

**B2 — ask it to score ONLY an unprofiled occupation.** This is the one that matters:
it is the mode being asked for the exact number it exists to refuse.

```
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py --soc 15-2051.00 --out-dir /tmp/b2
STOP no target SOC could be scored — nothing to report on.
rows read              : 1016
scored                 : 0 of 1 target SOCs
refused (no profile)   : 1
layer coverage gap     : 122 of 1016 occupations unscorable (12.0%)
  of those, named      : 45
partial-input scores   : 4
shipped/recomputed mismatches: 0
generator re-runnable  : no (needs data/bls/db-30-2-text/ (Abilities.txt, Skills.txt, Occupation Data.txt) which is gitignored and absent)
wrote                  : /tmp/b2/cogpivot-unprofiled.json
                       : /tmp/b2/cogpivot-unprofiled.md
$ echo $?
2
$ python3 -c "import json;d=json.load(open('/tmp/b2/cogpivot-unprofiled.json'));print(d['refused'][0]['role_quality'], d['refused'][0]['reason'])"
None no-onet-profile
```

**B3 — corrupt the published score** (15-2041.00 Statisticians: 3.958 → 9.999).

```
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py --soc-csv /tmp/corrupt.csv --soc 15-2041.00 --out-dir /tmp/b3
rows read              : 1
scored                 : 1 of 1 target SOCs
shipped/recomputed mismatches: 1
$ python3 -c "import json;d=json.load(open('/tmp/b3/cogpivot-unprofiled.json'));print(d['coverage']['shipped_vs_recomputed_mismatches'])"
[{'soc': '15-2041.00', 'title': 'Statisticians', 'shipped': 9.999, 'recomputed': 3.958}]
```

**B4 — mutate the code to emit `0.0` instead of refusing.**

```
$ python3 - <<'PATCH'
p = "scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py"
s = open(p).read()
s = s.replace('"role_quality": None,\n                "reason": "no-onet-profile",',
              '"role_quality": 0.0,\n                "reason": "no-onet-profile",', 1)
open(p, "w").write(s)
PATCH
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py
  FAIL  role_quality is None, not 0.0 
  54 checks in 14 tests, 1 failed
```

**B5 — mutate the code to label the fallback band `record`.** This is the mistake
that cost marks on the previous assignment, so the suite is made to block it.

```
$ python3 - <<'PATCH'
p = "scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/cogpivot_unprofiled.py"
s = open(p).read()
s = s.replace('"source": "model-judgment (%s)" % tier,',
              '"source": "record (%s)" % tier,', 1)
open(p, "w").write(s)
PATCH
$ python3 scripts/contrib/2026fa/beswathi-cogpivot-unprofiled/test_cogpivot_unprofiled.py
  FAIL  the band for 99-0001.00 is NOT labelled a record 
  FAIL  the band is labelled model-judgment 
  53 checks in 14 tests, 2 failed
```

Code restored after B4 and B5 from a copy taken before each patch; the suite returns
to `55 checks in 14 tests, 0 failed`, which is the state in this commit.

**B3 failed on its first attempt, and not in the way it looks.** The `sed` command
Claude Code used did not edit the column — the value stayed `3.958` — so the run came
back clean and was briefly read as the detector not working. It was the test that had
not happened. Rewriting the corruption in Python produced the output above.

A break attempt that silently does not break anything is worse than no break attempt,
because it returns a pass.

## Verified vs inferred

| Element | Value | Label | Why |
|---|---|---|---|
| Table row count | 1,016 | **`record`** | counted from the shipped CSV |
| Unprofiled count | 122 (119 + 3) | **`record`** | counted; cross-checked by hand |
| A scored occupation's value | e.g. Statisticians 3.958 | **`record`** | recomputed from the nine columns and matched against the shipped value |
| BLS median wage | e.g. $112,590 | **`record`** | published field |
| Data Scientists' role quality | **none emitted** | — | refusal, not a value |
| Fallback band 3.738 – 3.903 | the band | **`model-judgment`** | SOC adjacency is a cataloguing fact, not a claim about the work |
| Which 6 SOC codes count as "my field" | the mapping | **`your-input`** | a human judgment; another reader would choose differently |
| `role_quality` weight is 0.0 | measured | **`record`** | two scorer runs, above |
| "The aggregate row was never filled in" | the explanation | **`model-judgment`** | consistent with 119/122 ending `.00` and 26 parents having a profiled child, but the generator cannot be re-run to confirm the cause |

**The headline result, labelled:** *5 scored (`record`), 1 refused with a
`model-judgment` band, over a target set that is `your-input`.*

## Reflection

**What went well.** Refusing to emit a number was the right call and it held up
under pressure: asking the mode to score only an unprofiled occupation produces no
score and exit 2 rather than a plausible-looking zero. Recomputing the score instead
of reading the shipped column turned out to matter — it is what let G3 catch a
corrupted value.

**What the mode got wrong or missed.**

1. The first diagnosis was too strong. An earlier draft said the layer "cannot score
   Data Scientist", which reads as *the work is undescribed*. The truth is narrower: the
   aggregate row is empty while its children are profiled. 119 of the 122 gaps are
   that shape; only 3 are genuinely undescribed. The weaker claim is the true one.
2. The tier was briefly named `own-children`, which is wrong for the 3 detailed rows
   whose peers are siblings. Renamed `broad-code`.
3. The mode still cannot say *why* the aggregates are empty, and nothing in this run
   changes that.

**Next step.** Fetch the O*NET text tables outside the repo, re-run
`scripts/bls/extract-soc-occupation-table.py`, and check whether the 119 aggregates are empty in
the O*NET source too or are dropped by the extraction. That single test separates
"O*NET does not profile aggregates" from "this repo's extraction loses them" — and
they call for different fixes. It is the `[TODO: DATA SOURCE]` in the mode file.

## Attestation

- Recipe: `cogpivot-unprofiled` v0.1.0
- By: Swathi Baba Eswarappa · 2026-10-16

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `cogpivot_unprofiled.py --out-dir <dir>` | 1,016 rows; 5 scored, 1 refused; 122 unscorable; exit 0 | a scored set smaller than the target list, with the gap reported |
| hand count straight from the CSV | 1016 / 122 / 119 | identical to the mode's figures |
| `npm run score` with `role_quality` 0.0 vs 1.0 | composite 0.59 and Apply, both times | identical — the weight is 0.0 |
| `test_cogpivot_unprofiled.py` | 55 checks in 14 tests, 0 failed | all pass, offline |
| `npm run verify` / `npm run doctor` | conformance ✓, manifest ✓, environment ✓ | green |
| **break:** `--soc-csv /nope.csv` | `FAIL missing SOC table … (nothing invented)`, exit 1 | refuse rather than proceed |
| **break:** `--soc 15-2051.00` alone | `role_quality: null`, `STOP`, exit 2 | no score, and a halt |
| **break:** shipped score set to 9.999 | mismatch reported, `agrees_with_shipped: False` | G3 catches it |
| **break:** code mutated to emit 0.0 | 1 test failure | the suite blocks it |
| **break:** band relabelled `record` | 2 test failures | the suite blocks it |

### Did not test

- **Whether the Cognitive Pivot score predicts anything.** It is a proxy for the
  thesis; nothing here validates it against outcomes.
- **Whether a broad-code peer resembles the target occupation.** That is the human
  judgment the mode hands over, and it was not made here.
- **The O*NET source data.** Not shipped, so the cause of the gap is unverified.
- **Any employer.** This mode reads occupations only.
- **Behaviour on another machine.** One macOS machine, one Python build.
- **The repo's scorer itself.** It was invoked, not tested.

### Broke during testing, fixed

| What failed | What changed | Where |
|---|---|---|
| Money columns used `%,.0f`, which is not valid `%`-formatting — crashed on first run | switched to `"{:,.0f}".format(value)` | `write_outputs` |
| Report prose hardcoded "119" and "26" | both now interpolated from `coverage` | `write_outputs` |
| Fallback tier called `own-children`, but for a detailed row the peers are siblings | renamed `broad-code`; the relation is named per row | `fallback_band` |
| Fixture SOC codes all began `99-00`, so the "lonely" row shared a minor group and found peers it should not have | moved it to `88-0001.00` | `fixtures/soc.fixture.csv` |
| The presubmit checker's scan list still named `assignments/` after the work moved to `course/`, so it never read the submission directory and C7 passed vacuously | both lists now read one `SCAN_PREFIXES` constant | `presubmit_check.py` |
| C5 matched any path ending `DOMAIN.md`, which would also catch the repo's root index | scoped to the submission path | `presubmit_check.py` |
| A corruption break attempt did not corrupt anything (`sed` no-op) and read as a passing check | rewritten in Python; the detector then fired correctly | this document |
