# TEST-REPORT — ds-newgrad-h1b-15-2051

Branch `contrib/2026fa-rithika-sr-ds-newgrad-h1b-15-2051`. Fresh-clone checks were
run on 2026-10-03 in a throwaway clone of this branch (`/tmp/rre-fresh`).

## 1. Toolchain baseline (before and after)

| When | Command | Result |
|---|---|---|
| My first checkout (2026-10-02), before any change | `npm run doctor` | `environment: ✓ runnable` |
| same | `npm run verify` | conformance ✓; **manifest check FAILED**: `ModuleNotFoundError: No module named 'yaml'` |
| same, after `python3 -m venv .venv` + `pip install pyyaml` | `npm run verify` | `✓ manifest check passed (3 warnings)` |
| Fresh clone of my branch (2026-10-03), before PyYAML | `npm run doctor` / `npm run verify` | doctor `✓ runnable`; verify `✗ manifest check FAILED (1 error)` |
| Fresh clone, after venv + PyYAML | `npm run verify` | `✓ manifest check passed (3 warnings)` |

The verify failure is an environment gap present before my changes (PyYAML is not
installed by `npm install`), not something my branch introduced. The README
documents the fix. The 3 warnings are pre-existing; W2 ("private/ not gitignored")
is a false positive: `git check-ignore -v` shows `/private/*` and `/data/ats/*`
are ignored (`.gitignore` lines 37 and 40).

## 2. Real sample run (fresh clone)

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/fresh-run
✓ scored 4 roles → Apply 3 · Consider 0 · Skip 1 (skip 25%)
  course/2026fa/submissions/rithika-sr/fresh-run/role-scores.json  +  course/2026fa/submissions/rithika-sr/fresh-run/role-scores.md
✓ triage: 8 roles → 4 scored, 4 held → course/2026fa/submissions/rithika-sr/fresh-run/triage-log.json + triage-report.md
$ diff .../worked-run/out/triage-report.md .../fresh-run/triage-report.md && echo "REPRODUCED: report identical"
REPRODUCED: report identical
```

## 3. Each failure case exercised

| Failure case (CHANGE-BRIEF §4) | How exercised | Result |
|---|---|---|
| 1. Company not in CSV | test `test_company_not_in_csv_is_held`; worked run "Airbnb", "Instacart" | held G1, never in `roles.json` |
| 2. Blank approvals | test `test_blank_approvals_held_not_zero`; worked run `$AVY INC` | held G1 "no sponsorship record (not zero)" |
| 3. SOC row without O*NET abilities | tests `test_data_scientist_abilities_missing`, `test_unknown_soc_reports_missing` | report says abilities missing; unknown SOC → `missing: no-occupation-row` |
| 4. Visa window closed | 3 `TimelineGate` tests; break run `--today 2028-02-01` | `Apply 0 · Consider 0 · Skip 4 (skip 100%)` |
| 5. Liveness not checked / uncertain | test `test_unchecked_liveness_never_reaches_scorer`; worked run Figma (`uncertain`) | held G2 |

Deliberate break attempts (fresh clone):

```text
$ triage.py ... --out-dir data/examples; echo "exit=$?"
✗ stopped: --out-dir data/examples is outside my allowed folders; refusing to write
exit=2
$ triage.py --candidates nope.json --out-dir course/2026fa/submissions/rithika-sr/x; echo "exit=$?"
✗ stopped: file not found: nope.json
exit=2
$ triage.py ... --today 2026-13-01 ...; echo "exit=$?"
✗ stopped: --today: not a YYYY-MM-DD date: '2026-13-01'
exit=2
```

## 4. Only my namespaced paths changed

`git diff --stat main...HEAD`: **24 files changed, 2772 insertions(+), 0 deletions**,
all under `course/2026fa/submissions/rithika-sr/`,
`scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/`,
`recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.{md,card.md}`, and
`logs/runs/2026fa-rithika-sr-1.md`. `logs/RUN_LOG.md` is untouched.

## 5. Privacy

- `grep -rn "/Users/"` over my folders: no matches. `git log -p main..HEAD | grep -c "/Users/"`: `0`.
  (An earlier commit carried my home path in a log; it was unpushed and amended.)
- `node scripts/pii-scan.mjs`: 1 finding, `[email] package-lock.json` (a package
  maintainer's address from npm metadata). I did not change `package-lock.json`
  (see the check appended below), so the finding is pre-existing upstream.

## 6. Conformance

`node scripts/conformance.mjs scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/`:
`5 files (1 md · 2 json · 2 py) ✓ all conform`. Conformance checks syntax only.
`npm run doctor` does not scan `recipes/cases/`, so my TODO count (7 declared,
7 in body) was checked with `grep -c "\[TODO"` instead.

## 7. What the gates require a human to judge

- **G1 misses:** whether "not found" is a naming difference (brand vs. legal name).
- **G2:** open every `live` posting by hand, especially aggregator URLs. In the
  worked run, a page stating the job was removed on Jun 11, 2025 checked `active`.
- **G4:** every ⚠ row (Apply driven by sponsorship with fit < 0.5; non-Skip with
  0 approvals) and whether matched titles are senior.

## 8. Appended evidence (captured by command)

Offline tests, local checkout:
```text
Ran 17 tests in 0.118s
OK
```

package-lock.json changed on my branch? (0 = no):
```text
0
```
