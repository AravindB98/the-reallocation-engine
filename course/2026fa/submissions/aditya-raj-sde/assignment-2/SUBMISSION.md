# SUBMISSION — Assignment 2 (Mode Build)

Assignment: The Reallocation Engine — Mode Build Assignment
Student: Aditya Raj · GitHub handle: aditya-raj-sde
Domain / situation: Experienced Java/Spring backend engineer (international master's student; work authorization applied for, not approved; future sponsorship needed) screening US openings for an early-2027 start. Public runs use the fictional persona Tariq Lindqvist (50–54 months full-time at month precision + a separate 4–6-month co-op; availability 2027-02-01).
Mode file: recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md (+ .card.md)
Run command (offline): node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json --out-dir <dir>
Test command: node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/regression-v04.test.mjs
Branch: contrib/2026fa-aditya-raj-sde-java-backend-early2027 · PR URL: (not yet published — see publication plan)
Submitted commit SHA: recorded in Canvas and in the ZIP's archive comment (a commit cannot contain its own hash)
ZIP: reallocation-aditya-raj-sde-mode.zip (built from the PR commit with `git archive`)
Lifecycle stage claimed: DRAFT (target RUNNABLE-SAMPLE after Aditya's review and the open decisions are recorded)
Inherited vs new: Assignment 1 (graded commit 1a618e7) is the unchanged base; Assignment 2 adds only the files listed in PR-DESCRIPTION.md.
Known limitations: the rules detected no sponsorship or start-date wording in any of the 18 captured posting bodies (application forms not inspected — deferred); rules corrected on the 12 development postings; the 6 unseen postings exposed 3 defects in frozen v0.4.0 (repaired in v0.4.1, so no untouched test of v0.4.1 exists); same three Greenhouse boards only; the page checker reports a 403 challenge as expired (this mode treats it as unknown; upstream patch deferred); the date check is not an authorization check.
