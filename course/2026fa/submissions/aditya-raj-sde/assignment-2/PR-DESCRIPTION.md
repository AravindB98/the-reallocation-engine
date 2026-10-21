# DRAFT replacement PR description — NOT PUBLISHED

> Prepared for Aditya's review. Do not post until Aditya approves the publication plan. Re-paste
> the doctor and harness blocks from the final commit before posting.

**Title:** `2026fa aditya-raj-sde: Experienced Java Backend Opening Triage (Early-2027 Start) — Assignment 2 mode, <stage reached>`

## Executive summary

This PR adds a working screening "mode" for an experienced Java/Spring backend candidate who will
need sponsorship and can start in early 2027. It reads each job posting's own words: stated
experience (total career kept apart from skill-specific years and co-op time), start constraints,
stack evidence, sponsorship, citizenship, and export-control wording, and whether the posting is
listed.

- **12 development postings:** 2 skipped for stated minimums above everything the test candidate
  has worked; 10 sent to a person with the quoted reason.
- **6 unseen postings, checked once with frozen rules:** 40/48 checks and 4/6 final steps matched a
  reading written in advance. One defect class (an export-control clause in a heading line) was
  then repaired.

This PR **replaces PR #45** (Assignment 1), whose work is included unchanged as the base of this
branch.

## What this PR adds

Component: `java-backend-early2027` (Job-Ops liveness + 80 Days context + visa-timeline gate).

Branch: `contrib/2026fa-aditya-raj-sde-java-backend-early2027` · This is my ONLY open PR: [ ] yes
*(tick only after #45 is closed in the same action, with a link)*

Maintained file I deliberately patch: **none** (a liveness-core patch for HTTP 403 challenge pages
is proposed and deferred).

### Inherited from Assignment 1 (unchanged; graded at `1a618e7`, PR #45, 91/100)

- Everything reachable from `1a618e7`: `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.{md,card.md}`,
  `scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/`, `course/2026fa/submissions/aditya-raj-sde/*`
  (except `assignment-2/`), `logs/runs/2026fa-aditya-raj-sde-1.md`.
- No Assignment 1 file is modified by the new commits (`git diff --name-only 1a618e7..HEAD` lists no
  Assignment 1 path; evidence 27).

### New in Assignment 2 (commits after `1a618e7`)

- `recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.{md,card.md}` — status **DRAFT**,
  todos_open 4, target RUNNABLE-SAMPLE.
- `scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/`:
  - `collect.mjs`, `holdout.mjs`, `triage.mjs`, `checks.mjs`, `text.mjs`, `page-probe.mjs`,
    `excerpt-check.mjs`, `break-test.mjs`;
  - 77 tests;
  - 40 synthetic fixtures and 6 `BROKEN-*` mutants.
- `search/examples/tariq-lindqvist/` (+ `test-variants/`) — new fictional persona.
- `logs/runs/2026fa-aditya-raj-sde-2.md`.
- `course/2026fa/submissions/aditya-raj-sde/assignment-2/` — worked run, domain justification,
  sample and holdout protocols, Frictional log, review packet, excerpts, runs, evidence.

### Notes for the maintainer

- **Deviations from the assignment PDF** (repository contract governs): the branch name, the
  `recipes/cases/` location, the `course/…/submissions/` location, and a run log in
  `logs/runs/`. See `assignment-2/README.md` § "Where the PDF's deliverables actually are".
- **Persona path:** `search/examples/tariq-lindqvist/` has no handle in its path.
  - It is inside the CI allowlist, and DATA_CONTRACT directs personas there.
  - `pii-scan` accepts profile-shaped files only in that directory.
  - It conflicts with `course/README.md`'s "only under your own handle" wording. Flagged rather
    than worked around.
- **Real postings:** only short quoted lines are committed. Raw responses stayed in `private/`.

## Checklist

- [ ] `npm run doctor` clean locally — last 3 lines below
- [ ] No real PII anywhere in this branch's history — fictional personas only (`pii-scan --diff upstream/main`: clean)
- [ ] Run log added as `logs/runs/2026fa-aditya-raj-sde-2.md`; I did NOT edit `logs/RUN_LOG.md`
- [ ] Recipe + card under `recipes/cases/2026fa/` with honest lifecycle frontmatter
- [ ] Harness/tests green — real output below
- [ ] Diff touches only my namespaced paths
- [ ] `npm run verify` passes locally

*(Boxes are left for Aditya to tick after checking each one personally.)*

## Doctor output (last 3 lines — captured 2026-10-21 11:46 EDT, re-paste at final commit)

```
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

## Harness output (captured 2026-10-21 11:46 EDT, re-paste at final commit)

```
$ node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/regression-v04.test.mjs
# tests 77
# pass 77
# fail 0
$ node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json --out-dir $TMPDIR/pr-replay
✓ 12 openings (replay-of-captured-excerpts) → human-eligibility-review 4 · human-liveness-review 4 · human-requirement-review 2 · skip-application 2
  experience groups: satisfied+core 0 · unknown+core 2 · awaiting review 5 · documented mismatch 5 · passed/unknown, stack not core 0
```

## Known CI status (inherited, not introduced)

- `doctor-and-pii` → the working-tree `pii-scan` flags the upstream `package-lock.json` address, the
  same as on unchanged upstream `015843d` (Assignment 1 TEST-REPORT, "Confirmed blocker 1"). The
  branch-history scan is clean.
- `harness-regression` → upstream test scripts missing (Assignment 1 TEST-REPORT, "Confirmed
  blocker 2"). Not re-verified for this PR.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
