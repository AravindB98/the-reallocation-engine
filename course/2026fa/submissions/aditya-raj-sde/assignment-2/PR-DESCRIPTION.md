# DRAFT replacement PR description — NOT PUBLISHED

> Prepared for Aditya's review. Do not post until Aditya approves the publication plan. When it
> is posted, the doctor and harness blocks must be re-pasted from the final commit.

**Title:** `2026fa aditya-raj-sde: Experienced Java Backend Opening Triage (Early-2027 Start) — Assignment 2 mode, <stage reached>`

## Executive summary

This PR adds a working screening "mode" for an experienced Java/Spring backend candidate who will
need sponsorship and can start in early 2027. It checks each job posting's own words for stated
experience requirements, start dates, stack evidence, sponsorship or citizenship wording, and
whether the posting is still listed. It was run on 12 real public postings chosen by a rule fixed
in advance: 5 were skipped for stated experience minimums, 6 sent to a person, 1 left needing
sponsorship evidence. This PR **replaces PR #45** (Assignment 1). The Assignment 1 work is
included unchanged as the base of this branch.

## What this PR adds

Component: `java-backend-early2027` (Job-Ops liveness + 80 Days context + visa-timeline gate).

Branch: `contrib/2026fa-aditya-raj-sde-java-backend-early2027` · This is my ONLY open PR: [ ] yes
*(tick only after #45 is closed in the same action, with a link)*

Maintained file I deliberately patch: **none** (a liveness-core patch is proposed as a typed
TODO, not made).

### Inherited from Assignment 1 (unchanged; graded at `1a618e7`, PR #45, 91/100)

- Everything reachable from `1a618e7`: `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.{md,card.md}`,
  `scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/`, `course/2026fa/submissions/aditya-raj-sde/*`
  (except `assignment-2/`), `logs/runs/2026fa-aditya-raj-sde-1.md`.
- **No Assignment 1 file is modified by this PR's new commits.** Check:
  `git diff --stat 1a618e7..HEAD -- scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027 recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.md recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.card.md logs/runs/2026fa-aditya-raj-sde-1.md`
  prints nothing.

### New in Assignment 2 (commits after `1a618e7`)

- `recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.{md,card.md}` — status **DRAFT**,
  todos_open 6, target RUNNABLE-SAMPLE.
- `scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/`:
  - `collect.mjs`, `triage.mjs`, `checks.mjs`, `text.mjs`, `page-probe.mjs`, `break-test.mjs`;
  - 45 tests;
  - 29 synthetic fixtures and 3 `BROKEN-*` mutants.
- `search/examples/tariq-lindqvist/` — new fictional persona.
- `logs/runs/2026fa-aditya-raj-sde-2.md`.
- `course/2026fa/submissions/aditya-raj-sde/assignment-2/` — worked run, domain justification,
  sample protocol, Frictional log, real-sample excerpts, runs, evidence.

### Deliberate deviations from the assignment PDF (repository contract governs)

- Branch name is `contrib/…`, not `mode/…`.
- The mode file is under `recipes/cases/2026fa/`, not `recipes/`.
- Write-ups are under `course/2026fa/submissions/aditya-raj-sde/assignment-2/`, not
  `assignments/submissions/`.
- The run-log entry is in `logs/runs/` (CI forbids `logs/RUN_LOG.md`).
- See `assignment-2/README.md` § "Where the PDF's deliverables actually are".

## Checklist

- [ ] `npm run doctor` clean locally — last 3 lines below
- [ ] No real PII anywhere in this branch's history — fictional personas only (`pii-scan --diff upstream/main`: clean)
- [ ] Run log added as `logs/runs/2026fa-aditya-raj-sde-2.md`; I did NOT edit `logs/RUN_LOG.md`
- [ ] Recipe + card under `recipes/cases/2026fa/` with honest lifecycle frontmatter
- [ ] Harness/tests green — real output below
- [ ] Diff touches only my namespaced paths
- [ ] `npm run verify` passes locally

*(Boxes are left for Aditya to tick after checking each one personally.)*

## Doctor output (last 3 lines, pasted — captured 2026-10-21 00:24 EDT, re-paste at final commit)

```
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

## Harness output (pasted — captured 2026-10-21 00:24 EDT, re-paste at final commit)

```
$ node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs
# tests 45
# pass 45
# fail 0
$ node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json --out-dir $TMPDIR/pr-replay
✓ 12 openings (replay-of-captured-excerpts) → skip-application 5 · human-requirement-review 1 · human-eligibility-review 1 · human-liveness-review 4 · seek-vacancy-sponsorship-evidence 1
  hypothesis tally: 3 experience+stack-relevant, 3 of them with unresolved sponsorship/timing
```

## Known CI status (inherited, not introduced)

- `doctor-and-pii` → the working-tree `pii-scan` flags the upstream `package-lock.json` address.
  This is the same finding on unchanged upstream `015843d` (Assignment 1 TEST-REPORT, "Confirmed
  blocker 1"). The branch-history scan is clean.
- `harness-regression` → upstream test scripts missing (Assignment 1 TEST-REPORT, "Confirmed
  blocker 2"). Not re-verified for this PR.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
