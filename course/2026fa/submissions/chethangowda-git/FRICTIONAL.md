# Frictional log

## Executive summary

**What this is.** A factual log of the working session that produced this submission. It records where the work was hard or the documents disagreed, and which choices the AI suggested versus which the student made.

**Why read it.** The course grades honesty about who did what. This separates the two.

**What it shows.** The AI read, built and ran things. The student set the scope and made every judgment call. Several conflicts between the project's documents were found and are listed rather than resolved silently. The student's own reflections go at the end.

## Session log (2026-10-03, factual)

1. **Doc reading.** Student asked for a read-only, one-file-at-a-time reading of `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md` and `recipes/README.md`. The AI quoted the lines relied on and flagged conflicts. The assignment brief was missing from the first message; the student pasted it after file 1, and the AI re-checked file 1 against it.
2. **Second read.** The AI read `status.md`, the scorer, the example input, the personas, `_shared.md`, the style recipes, the PR template and the CI workflow.
3. **Student corrections to the AI.**
   - The AI had said `npm run doctor` would show whether `bls:local-wage` runs. That was wrong; doctor checks only that files exist.
   - The AI had stated "any open TODO means DRAFT" as a rule. It is an open conflict with the brief, not a rule.
4. **Baseline run.** The AI ran `npm run score` on the example with `--out-dir` into this folder: `Apply 2 · Consider 1 · Skip 2`.
5. **Predictions committed first.** CHANGE-BRIEF.md was written with the student's predictions word for word. The student approved changing "I need" to "the persona needs" for privacy. Committed `329cf54` before any prototype code.
6. **Build.** The AI wrote the prototype, fixtures, test, recipe, card and these documents. While picking companies, the AI found CSV rows with blank approval counts (e.g. Hugging Face) and added them as a stop case (`no-sponsorship-record`).
7. **Break test.** In a scratch copy, the AI removed the missing-liveness check (mutant A: crash; this exposed a crash in the test itself, now fixed). It then made the realistic "fix" with optional chaining (mutant B: test 13/16, exit 1).
8. **Checks.** doctor and verify before (clean worktree of `main`) and after: identical. Conformance passes. PII scan of the branch diff is clean. The working-tree scan has one finding that predates this work (`package-lock.json`).

## Document conflicts found (not resolved silently)

- **Run log location.** `SNICKERDOODLE.md` says to log in `logs/RUN_LOG.md`, and that the constitution governs conflicts. `CONTRIBUTING.md`, the brief and CI say never edit it. Followed: `logs/runs/`.
- **What doctor reports.** `DOMAIN.md` lists `bls:local-wage` and `validate-h1b-join-sample.py` as runnable. The brief says they fail. `local-wage-adjustment`'s inputs are missing in a fresh clone.
- **Recipe status claims.** `status.md` and brief fact 6 say all recipes are DRAFT, but 4 top-level recipes are RUNNABLE-SAMPLE. Two of those set `attestation` before VERIFIED, against the constitution's frontmatter comment.
- **Scorer API.** `CONTRIBUTING.md` says harnesses import the scorer's exports. `role-scorer.mjs` has no exports.
- **Persona docs vs. scorer.** `search/examples/README.md` says an explicit `needs_sponsorship` field wins and "work authorized" must not zero sponsorship. The scorer reads neither (it regex-matches `authorized`).
- **Status ceiling.** The brief allows up to RUNNABLE-SAMPLE, and also requires typed TODOs. The constitution needs zero TODOs to pass DRAFT. Open question for the TA.
- **Doctor's scope.** Doctor counts only top-level `recipes/`, so it does not see `recipes/cases/`.
- **CI harness job.** It references 4 scripts that are not in `main`.

## Suggested by the AI vs. decided by the student

| Topic | AI suggested | Student decided |
|---|---|---|
| Persona | use Priya Nair or extend one under `search/examples/` | Priya, adjusted in input only; mismatch stated; no new file |
| Privacy wording | change first-person "I need" | approved: "the persona needs" |
| Status | DRAFT if any TODO is open | DRAFT, framed as an open question to the TA, not a rule |
| Sponsorship p | label a mapped p as your-input, not record | your-input, explained |
| Conversion data | none exists in the repo | `[TODO: DATA SOURCE]`, listed under "cannot verify"; no invented signal |
| Missing gates | stop before the scorer (scorer fails open) | adopted as failure case 2 |
| Companies | Databricks, Snowflake, MongoDB, Klaviyo, Cohere Health, Hugging Face + fictional Lumenvale | asked the AI to pick 4–5 + one not in CSV |
| Tier thresholds | Proven ≥100 approvals and ≥95%, 0.9; Likely 10–99, 0.6; Possible 1–9, 0.3; None 0 | *(student to confirm or change)* |
| Timeline rule | binary: 1.0 if the available month is inside the start window, else 0.0 | *(student to confirm or change)* |
| Fit vote | omit (no posting text), noted as a TODO | *(student to confirm)* |
| Git email | check for noreply before the first commit | confirmed noreply |

## What I did and decided (student, Chethan Gowda GT)

- Found my git email was my Northeastern address; switched to the GitHub noreply address before any commit.
- Checked the manifest warning "private/ not gitignored" with `git check-ignore`. False alarm: the rules are written as `/private/*`.
- Confirmed upstream was up to date (0 0).
- Ran `ats:scan --dry-run`. It worked after copying `portals.example.yml`. I noticed loose title/location filters, and that the dry run still contacts the job board.
- Ran `ats:liveness`. It failed because the Playwright browser is not installed; I chose to skip it.
- Ran the prototype test myself: 16/16.
- Decided:
  - domain changed from frontend to AI SDE;
  - kept the co-op angle over Priya's OPT framing;
  - used the existing persona Priya Nair instead of creating one;
  - rejected `npm audit fix` (it would touch tracked files);
  - removed extra workflow files an AI suggested.

## Student reflections

- Claude Code wrote most of the code and docs and opened the PR. I reviewed, made the decisions above, and re-ran the test.
- The pii-scan finding in `package-lock.json` is pre-existing, not mine.
- CI checks show 0. Fork PR workflows likely need maintainer approval.
- What worked: I got the co-op → full-time → H-1B angle working, with two timeline paths (co-op path with a Sep 2027 start vs. no co-op with a May 2027 start), and I'm happy with that.
- What was missed: it only searches "AI Engineer" titles. It should also cover SDE, AI SDE, AI SWE, and SWE roles. And only major companies came through. All four landed in the same "Proven" tier, so sponsorship didn't tell them apart.
- Next improvement: broaden the title list to SDE/SWE/AI SDE/AI SWE and make sure medium-scale companies are included, so the sponsorship signal can actually separate employers.
- My CHANGE-BRIEF prediction (that it might handle only one timeline) did not come true. Both paths ran and gave different results.
