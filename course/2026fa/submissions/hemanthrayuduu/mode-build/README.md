# Mode Build: a weekly apply-queue refresh (Hemanth Rayudu, INFO 7375, Fall 2026)

## Executive summary

**What this is:** my Mode Build submission for the Reallocation Engine: a new recipe (a "mode"), the small tool it runs, a one-page case for it, a worked run with real output and break attempts, the run-log entry, and notes for the show and tell.

**Why it exists:** for an international student on F-1 OPT who targets AI and data roles, a shortlist of postings goes stale without showing it. Postings close, the sponsorship record behind a company may not cover the role at all, and the OPT unemployment clock keeps running.

**What it found:**
- On real data, one of eight shortlisted postings **closed within a single day**, caught by two independent checks.
- All eight AI / data postings sit under a sponsorship cap, because the companies' sponsored titles are other job families.
- For the fictional persona, the scorer's verdict this week turns on the OPT clock: three roles move from Skip to Consider if the expected start is a week sooner.

The mode is **RUNNABLE-LIVE at v0.1.2**: I ran it live in the session and cleared every gate. It doesn't claim VERIFIED. An independent review found real defects in v0.1.1, and v0.1.2 fixes them (see `02-worked-run.md`).

## What is in this submission

| File | What it is |
|---|---|
| [`recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md`](../../../../../recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md) | **The mode file** (RUNNABLE-LIVE, v0.1.2; 10 typed items, all closed with evidence; 0 open TODOs) |
| [`….card.md`](../../../../../recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.card.md) | Its one-page human card |
| [`01-domain-justification.md`](01-domain-justification.md) | The one-page case: who, the information gap, the engine layers, two failure modes |
| [`02-worked-run.md`](02-worked-run.md) | The run: real commands and output, verified versus inferred, verification and break attempts, reflection with a typed backlog, attestation, AI use |
| [`03-run-log-entry.md`](03-run-log-entry.md) | The entry in `logs/RUN_LOG.md` format (the full log is [`logs/runs/2026fa-hemanthrayuduu-2.md`](../../../../../logs/runs/2026fa-hemanthrayuduu-2.md)) |
| [`04-show-and-tell-notes.md`](04-show-and-tell-notes.md) | Notes for the five-minute show and tell |
| [`scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/`](../../../../../scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/) | The tool `refresh.py`, 47 offline tests, `rules.json` (the owner's value choices), fixtures (including a deliberately broken gate), and the committed sample (8 public postings + a recorded snapshot) |
| [`evidence/`](evidence/) | Every command's real output, numbered in order. `evidence/helpers/` holds the code that printed the summaries |
| [`runs/`](runs/) | Each run's agent log (`refresh-log.json`), human report, audit and raw outputs with sha256 |
| `make-zip.sh` | Builds the upload ZIP from the committed files (the ZIP itself isn't committed) |

**Why these paths, not the assignment's `assignments/submissions/<name>/`:** that folder doesn't exist in the repository. The repository's own contribution rules (`CONTRIBUTING.md`, `course/README.md`), and the CI namespace check, put submissions in `course/<term>/submissions/<handle>/`, recipes in `recipes/cases/<term>/`, code in `scripts/contrib/<term>/`, and run logs in `logs/runs/`. The `mode-build/` subfolder keeps this assignment apart from my earlier one.

## What the runs found about the engine

1. **`npm run bls:local-wage` can't run on `main`.** Its `.venv` is missing, and `data/bls/local-wage/` has never been in any commit. The professor's reference run found the same.
2. **The page checker's verdict depends on the board.** A made-up job id was `uncertain` on Figma's board (the professor's case, reproduced) and `expired` on Verkada's, and a real closure was `expired`. This mode adds the job board's API record as a second check.
3. **The scorer treats a missing gate as 1.0** (`?? 1` in `scripts/score/role-scorer.mjs`). A feed that forgets liveness would score a dead posting as live, so this mode always passes both gates explicitly, and checks that before scoring.
4. **The scorer's `--profile` reads only an `authorization` text field.** The word "authorized" switches sponsorship off (the trap the persona README describes), so this mode never passes `--profile`.
5. **The Consider floor (0.20) and the role-quality weight (0) are unpinned `[VERIFY]` placeholders** in the scorer. This week's best score is 0.005 under the floor.
6. **Given zero roles, the scorer prints `skip NaN%`** (seen in the outage break attempt).
7. **The doctor scans only top-level `recipes/`,** so `recipes/cases/` recipes, where CONTRIBUTING puts student work, are never counted. Copied to the top level, this recipe counts 0 declared = 0 markers.
8. **CI's harness job calls four harness files that don't exist on `main`,** and greps for a pass message ("17/17 passed") that the harness doesn't print. That job fails for every PR, independent of this work.
9. **The constitution says DEV items are closed "via scored prompt",** but the repository defines no prompt-scoring scheme.
10. **`npm install` rewrites the repository's `package-lock.json`** (36 lines). It's restored before every commit.

## Reproduce (from the repository root)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py'   # 47 tests, offline
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --dry-run                    # the plan; nothing written
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py                              # offline sample run (seconds)
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live                       # live: page checker + board API (about a minute)
```

## Not in this repository on purpose

- **No real person's profile, résumé or dates.** The committed runs use the repository's fictional persona Priya Nair. A run on a real profile can write only under `private/`, and the tool enforces this: it checks that the persona and the queue are git-tracked examples.
- **No application status or outcomes.** Gate G3 records which rows are *released for action*, never whether anyone applied.
- **No email or phone number from a job posting.** Raw outputs are redacted before saving; none needed redacting in these runs.

*AI use:* Claude Code wrote the tool, tests and documents, ran the commands marked as its own, and dispatched an independent reviewer whose findings became v0.1.2. The decisions, the final live run and every gate are mine (see `02-worked-run.md`, "AI use").
