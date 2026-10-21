# Mode Build submission — wage-level-floor (Mayank Bhadrasen, mayank-1024)

## Executive summary

**What this is.** The cover page for a 100-point Mode Build assignment: a new mode for the Reallocation Engine, built and run on live data. It tells an international student, before they apply, how many H-1B lottery entries a job posting's salary range can carry, and the exact dollar line where one entry becomes two.

**Why read it.** It points to each deliverable and states what was and wasn't done, so a grader can check the claims quickly.

**What it found.** Of 11 Boston-area new-grad software postings at H-1B sponsors whose ranges could be placed, 6 cross a wage-level line (usually $138,237, the line between one entry and two) and 5 start below the lowest level ($114,275). Every placement depends on an occupation code only the employer knows. The mode is honestly **DRAFT**: the live run is complete, but seven proposed additions are open and the person-owned checks are not done.

## Deliverables

| Brief item | Where |
|---|---|
| 1. Mode file | `recipes/cases/2026fa/mayank-1024-wage-level-floor.md` (+ human card `…wage-level-floor.card.md`) |
| 2. Domain justification | `course/2026fa/submissions/mayank-1024/mode-build/DOMAIN-JUSTIFICATION.md` |
| 3. Worked run (real output, verified vs inferred, verification, attestation, reflection) | `course/2026fa/submissions/mayank-1024/mode-build/WORKED-RUN.md`; raw outputs in `runs/2026-10-18/` and `runs/2026-10-18-broad/` |
| 4. Run-log entry | `logs/runs/2026fa-mayank-1024-2.md` (students may not edit `logs/RUN_LOG.md`) |
| New scripts | `scripts/contrib/2026fa/mayank-1024-wage-level-floor/` — 2 ingest scripts, 1 extract, 1 offline classifier, 19 tests |
| New data source | `data/dol/oflc/` — DOL OFLC wage levels, wage year 2026-27, MA/NH × SOC 15-/17-, hash-pinned |
| Friction log | `course/2026fa/submissions/mayank-1024/mode-build/FRICTIONAL.md` |

## Summary

- **Domain:** MS CS graduate on F-1 OPT, backend / platform software engineer (SOC 15-1252), Boston metro, facing the FY2028 wage-weighted H-1B lottery.
- **Lifecycle stage claimed:** DRAFT, with 7 typed TODOs open (4 DATA SOURCE, 1 DEFINE, 2 DEV). The live run, tests and conformance would support RUNNABLE-SAMPLE, but SPECIFIED requires zero open TODOs, so it isn't claimed.
- **Real repository scripts run on real data:** `npm run ats:liveness` (8 checks), `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs --diff upstream/main`, `node scripts/conformance.mjs`; the mode's own ingest used the repo's ATS HTTP helper (`scripts/ats/providers/_http.mjs`).
- **Engine layers:** 80 Days to Stay (candidate sponsors, context), Job-Ops (boards, pay fields, liveness gate), and the wage data under the Cognitive Pivot layer (DOL levels are built on BLS OEWS).
- **Who did what:** the build, runs and machine checks were executed by Claude Code in my session. I cleared the person-owned gates on 2026-10-21: G3 board identity (Klaviyo, PathAI, Tulip, Formlabs, Ginkgo), G4 text-sourced pay (Ginkgo, PathAI, Tulip ×2), and G6 liveness for the 5 postings the checker left `uncertain` (apply button present on all 5). Still open: G4 for Tulip "Developer Experience Engineer", G5 (occupation code, not asked), and G7 (no offer).
- **Headline limitation:** the employer chooses the occupation code, and every placed posting changes level under a plausible alternative. The mode shows that sensitivity; it cannot resolve it.
- **Path note:** the brief names `recipes/` and `assignments/submissions/<name>/`. This repository's CI and `recipes/cases/README.md` require the namespaced paths above, which the previous assignment also used.

## Re-run

```bash
bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh        # raw DOL file (gitignored)
bash course/2026fa/submissions/mayank-1024/mode-build/runs/rerun.sh             # every offline output + checks
node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs
```
