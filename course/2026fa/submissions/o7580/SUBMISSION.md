# SUBMISSION

## Executive summary

This is the cover sheet for my Recipe Design Assignment submission. It names the recipe, how to run the prototype in one command, where the code lives on GitHub, and the exact commit the ZIP was made from. The recipe triages junior software postings for a December-graduating international student in Boston. It sorts them by whether the employer has sponsored *junior* software engineers, and by whether hiring fits inside the OPT unemployment window. It is honestly marked DRAFT: the sample path runs end to end, and the open items are listed below.

- **Assignment:** The Reallocation Engine — Recipe Design Assignment
- **Student:** Omkar Salian
- **GitHub handle:** O7580
- **Domain / situation:** F-1 M.S. (STEM) student graduating December 2026, post-completion OPT from January 2027, ~2 years prior industry experience, targeting SWE I/II roles (SOC 15-1252) in Greater Boston. Signal made visible: level-matched H-1B sponsorship (junior vs senior-only software titles), gated by posting liveness and the OPT unemployment clock.
- **Recipe path:** `recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.md` (+ `.card.md`)
- **Prototype command:** `node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs` (from the repo root, after `npm ci`)
  - Test: `node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs`
- **GitHub repository / branch / PR URL:** `<fork URL>` / `contrib/2026fa-o7580-decgrad-swe1-sponsor-level` / `<PR URL>`. *To fill in after the PR is opened.*
- **Submitted commit SHA:** `<sha>`. *To fill in; must equal the PR head and the ZIP's source.*
- **Lifecycle stage claimed:** DRAFT (sample path runnable end to end; 5 typed TODOs open; human G5 adequacy read pending). Not RUNNABLE-SAMPLE: the constitution requires zero open TODOs for SPECIFIED.
- **Summary of my changes** (all new files, all in my namespaces; no maintained file touched):
  - `recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level{.md,.card.md}`: recipe and human card.
  - `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/`: `triage.mjs` and `lib.mjs` (Node, no dependencies), 13 offline tests, fictional fixtures, a sample scenario of 8 real Boston Greenhouse postings plus 3 failure-case rows, and the saved `ats:liveness` log. Feeds the maintained `role-scorer.mjs` unchanged.
  - `logs/runs/2026fa-o7580-1.md`: run-log entry.
  - `course/2026fa/submissions/o7580/`: CHANGE-BRIEF, TEST-REPORT, domain justification, worked run with attestation, FRICTIONAL, SOURCES, run outputs, and transcripts.
- **Known limitations:**
  - It reads only the *top* sponsored titles (≤ 14), so a large sponsor can be under-tiered.
  - Employers missing from the CSV, or blank in it (94.9% of rows), are left unscored for a hand check.
  - Sponsorship history can't detect a current no-sponsorship policy; the person must record it from the posting.
  - A dead Greenhouse job URL reads `uncertain`, not `expired`.
  - A Proven sponsor clears Apply on its own in the scorer's current configuration.
  - A late run with a stale persona only raises a flag.
  - Posting fields, fit, hiring lag, and the OPT start date are typed inputs; EAD delay is not modeled.
  - Tested on Node 22 only. The real postings are all on Greenhouse.

## How the ZIP was made (fill in the SHA)

```bash
git archive --format=zip --prefix=reallocation-o7580-recipe/ -o reallocation-o7580-recipe.zip <sha>
```

`git archive` packages exactly the committed tree of that SHA, so there's no `node_modules`, no caches, nothing untracked, no `private/`, and no `search/resume.json` (both gitignored). A commit can't contain its own SHA, so a filled-in copy of this file is added at the ZIP root afterwards:

```bash
cp course/2026fa/submissions/o7580/SUBMISSION.md /tmp/SUBMISSION.md   # then fill in the SHA and URLs in /tmp/SUBMISSION.md
(cd /tmp && zip -j "$OLDPWD/reallocation-o7580-recipe.zip" SUBMISSION.md)
```
