# bagwe-shubham1727 — swe-opt-clock submission

## Executive summary

**What this is.** The index for one student's Recipe Design Assignment. The recipe helps a new-grad software engineer on OPT, currently between jobs, decide which jobs deserve application time before their 90-day unemployment allowance runs out.

**Why read it.** It points to every graded piece in the order a grader would read them.

**What it contains.** A prediction brief written before building, a one-page justification, a worked run with real output and an attestation, a test report, an honest log of what happened and who did it, and the run outputs themselves.

## Read in this order

| # | File | Rubric item |
|---|---|---|
| 1 | `CHANGE-BRIEF.md` | Predict (originals + appended revisions) |
| 2 | `DOMAIN-JUSTIFICATION.md` | Domain justification (≤ 1 page) |
| 3 | `../../../../recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md` + `.card.md` | Recipe design |
| 4 | `../../../../scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/README.md` | Working prototype |
| 5 | `WORKED-RUN.md` | Worked run + attestation |
| 6 | `TEST-REPORT.md` | Clean-checkout run, baselines, diff scope, CI notes |
| 7 | `FRICTIONAL.md` | Frictional log, human/AI split |
| 8 | `SOURCES.md` | Credits and AI contribution |
| 9 | `runs/2026-10-02/report.md` | The human report the prototype writes |
| 10 | `../../../../logs/runs/2026fa-bagwe-shubham1727-1.md` | Run-log entry |

## One command

```bash
npm install
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
```

`runs/engine-baseline/` is the unmodified scorer's run on the book's example, made before any of this was built.
