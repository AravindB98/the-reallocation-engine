# Mode Build submission: h1b-wage-level-odds

## Executive summary

**What this is.** My Mode Build submission for the Reallocation Engine: a mode that shows a new-grad software engineer what a job's posted pay and city do to their H-1B lottery entries under the wage-weighted selection rule.

**Why read it.** It ran on 13 live postings with every gate decided by me, and it found that the same pay can carry different lottery weight depending on the city.

**What it found.** 9 postings got a checked level, 1 was held at the job-code gate, 3 were refused for a stated reason. The recipe is at **RUNNABLE-LIVE**.

## Where things are

| Deliverable | Path |
|---|---|
| Mode file (agent) | `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md` |
| Card (human) | `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.card.md` |
| Domain justification | `DOMAIN-JUSTIFICATION.md` |
| Worked run, verified vs inferred, attestation, reflection | `WORKED-RUN.md` |
| Run-log entry | `logs/runs/2026fa-pavithra-prasad-2.md` (copy: `RUN_LOG-entry.md`) |
| Scripts, tests, data extract, fixtures | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/` |
| Live inputs and gate decisions | `inputs/` |
| Run outputs and terminal transcripts | `runs/` |
| DOL website check | `evidence/dol-wage-search-2026-10-19-santa-clara.png` |
| Sources and credit | `SOURCES.md` |
| Frictional log | `FRICTIONAL.md` |

Paths follow the assignment: the mode file is under `recipes/` (in `recipes/cases/2026fa/`, where the repository keeps student cases), and the justification, worked run and the rest of the submission are in `assignments/submissions/pavithra-prasad/`. The run-log entry is `logs/runs/2026fa-pavithra-prasad-2.md`, because the repository blocks direct edits to `logs/RUN_LOG.md`; a copy is included as `RUN_LOG-entry.md`, as the assignment allows. On 2026-10-21 the submission folder moved here from `course/2026fa/submissions/pavithra-prasad/mode-wage-level/`; terminal transcripts recorded before the move show the old path.

## Re-run it

```bash
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --persona scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/persona.json --postings assignments/submissions/pavithra-prasad/inputs/postings-live.json --gate-log assignments/submissions/pavithra-prasad/inputs/gates-live.json --out-dir assignments/submissions/pavithra-prasad/runs/rerun
```
