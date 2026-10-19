# Mode Build submission — ml-tailor-or-ask (sukethrp)

## Executive summary

This folder is the student's Mode Build submission for The Reallocation Engine. The mode helps an early-career
machine-learning engineer on a student visa decide which job postings deserve a tailored application. It checks
whether each posting is open, whether the company's public H-1B history fits the role, and whether the posting's
stated experience minimums are within reach. Then it suggests tailoring, asking a specific question first, moving on,
or holding until something is resolved. Start with the worked run: it shows the student's real runs, line by line.

## What is where

| File | What it is |
|---|---|
| `WORKED-RUN.md` | the student's sample, live and break runs, with pasted output, a verified-vs-inferred split, the checks, the signed attestation and the reflection |
| `DOMAIN-JUSTIFICATION.md` | who uses the mode, the information asymmetry, the engine layers, and two domain-specific failure modes |
| `RUN_LOG-ENTRY.md` | the run-log entries for this submission, copied from `logs/runs/2026fa-sukethrp-3.md` and `-4.md` |
| `RULES-REVIEW.md` | the screening rules tested against hard examples, the student's calls R1–R8, and their adoption |
| `FRICTIONAL.md` | the student's own entries at each checkpoint, verbatim, plus Claude Code's factual timeline |
| `SOURCES.md` | credits, who did what, and what the student accepted, changed or rejected |
| `runs/` | `sample/`, `live/` (`round-1/` automated, `round-2-personal/` and `round-3-panel/` by the student, and the queue), `anchor/` and `break-demo-*/` |
| `evidence/rules-review/` | the rules-review evidence (real-file audit, phrasing probe, before and after) |

The mode file itself is `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md`, with its card beside it. The code is in
`scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/`.

## Run it yourself (from the repo root, after `npm install`)

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py
python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
```

Expected: TAILOR 1 · ASK FIRST 4 · MOVE ON 2 · HOLD 3, with 4 scored, and 118 tests passing offline.
