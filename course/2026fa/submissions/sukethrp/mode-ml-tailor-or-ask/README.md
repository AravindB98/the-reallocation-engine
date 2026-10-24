# Mode Build submission — ml-tailor-or-ask (sukethrp)

## Executive summary

This folder is the student's Mode Build submission for The Reallocation Engine. The mode is for an international
machine-learning engineer on F-1, early in their career but with prior production work. It works in two steps:
- given a list of target companies, it reads the job boards it can read and keeps the postings that fit, and it
  reports what the public H-1B file holds for every company, including the ones it cannot see;
- for each posting, it checks whether the posting is available, whether the company's sponsorship history fits the
  role, whether the stated experience minimums are within reach (counted by job type), and whether the timing works.

It then suggests tailoring, asking a specific question first, moving on, or holding, and ranks the postings that wait
only for the person's own fit call. The student ran every logged run in their own terminal and made every judgment
call in their own words. Start with the worked run.

## If you have 10 minutes

1. **The worked run's summary and its "Versions and runs" table** (`WORKED-RUN.md`): what ran, on which version, and
   why each next version exists.
2. **The real output** (`WORKED-RUN.md`, "Commands run", sections 3 and 4): the target audit, where Google, Amazon,
   Apple, Netflix and Meta show no readable board and no H-1B record, and the three "ask first" postings, with the
   student's own question.
3. **The engine defect the guard exists for** (`WORKED-RUN.md`, section 5): the engine's scorer says "Apply" and
   "gates healthy" for a posting nobody checked, and labels the missing gate `record`.
4. **Verified vs inferred, line by line** (`WORKED-RUN.md`): every value, with who or what produced it.
5. **What it cannot verify** (the mode file, "What it can and cannot verify").

## Where each part of the brief is

| The brief asks for | Where it is |
|---|---|
| The mode file, with status frontmatter, purpose, source inventory, proposed additions (typed `[TODO]`), phase gates, can/cannot verify, output contract, stop conditions and a log template | `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md`, with its human card `….card.md` beside it |
| The domain justification (one page) | `DOMAIN-JUSTIFICATION.md` |
| The worked run: inputs, commands with pasted output, verified vs inferred, verification, the attestation with a break attempt, and the reflection | `WORKED-RUN.md` |
| A RUN_LOG entry | `logs/runs/2026fa-sukethrp-3.md` to `-8.md`, copied in `RUN_LOG-ENTRY.md` |
| New scripts and sample data | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/`, and the fictional persona `search/examples/kavya-raman/` |

**Why the paths differ from the brief.** The Canvas brief is the Summer 2026 text. The repository's Fall 2026
contribution rules, which its CI enforces, require the namespaced paths above. A PR that edits `logs/RUN_LOG.md`
fails CI. The brief allows the entry to be included in the submission instead, which is what `RUN_LOG-ENTRY.md` does.

## What is where

| File | What it is |
|---|---|
| `WORKED-RUN.md` | every logged run with pasted output, a verified-vs-inferred split, the checks, the attestation and the reflection, plus the earlier versions as history |
| `DOMAIN-JUSTIFICATION.md` | who uses the mode, the information asymmetry, the engine layers, and two domain-specific failure modes |
| `RUN_LOG-ENTRY.md` | the run-log entries, copied from `logs/runs/2026fa-sukethrp-3.md` to `-8.md` |
| `RULES-REVIEW.md` | the screening rules tested against hard examples, the student's calls R1–R8, and their adoption |
| `FRICTIONAL.md` | the student's own entries at each checkpoint, verbatim, plus Claude Code's factual timeline |
| `SOURCES.md` | credits, who did what, and what the student accepted, changed or rejected |
| `runs/discover-v0.2.0/` | the target list, round 1 (discovery and judge, v0.2.0) and round 2 (judge with the student's fits, v0.2.1) |
| `runs/sample*/`, `runs/live*/`, `runs/break-*/` | the sample, live and break runs of every version, each with its terminal output |
| `evidence/rules-review/` | the rules-review evidence (real-file audit, phrasing probe, before and after) |

## Run it yourself (from the repo root, after `npm install`)

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py
python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
```

Expected: TAILOR 1 · ASK FIRST 4 · MOVE ON 2 · HOLD 3, with 4 scored, and 164 tests passing offline. Discovery and
live runs need the network:

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py --targets course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json --out-dir output/discover-check
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue output/discover-check/queue.json --out-dir output/discover-check/judged
```
