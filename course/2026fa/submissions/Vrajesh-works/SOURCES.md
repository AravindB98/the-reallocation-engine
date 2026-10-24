# SOURCES

## Summary

This file credits what the work builds on and says which parts an AI drafted and which parts a person decided, checked, changed or rejected. Claude Code filled it from the working session, and Vrajesh then added or corrected the human-side entries.

## Repository and governing documents

- *The Reallocation Engine* repository by Nik Bear Brown (fork: `Vrajesh-works/the-reallocation-engine`; upstream `nikbearbrown/the-reallocation-engine`).
- `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `recipes/README.md` — read before building.
- `scripts/score/role-scorer.mjs` — used unmodified, through its command line.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) — run unmodified to check postings.
- Style references: `recipes/local-wage-adjustment.md` and its card.
- Public pull-request list of the upstream repository (read only, to see how other students' submissions are laid out); no other student's work was copied.
- The assignment brief and the course AI policy, as supplied by the instructor.

## Data used

| Data | Path | Notes |
|---|---|---|
| 80 Days to Stay mapped targets | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | full file; 30,369 rows; newest funding date 2025-09-26; sha256 in `runs/shortlist-log.json` |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | row 15-1252 only; OEWS 2024 |

No SEC Form D file was used.

## External pages read (2026-10-02 and 2026-10-03)

These were read to build the real-run postings file. They are job postings, not authoritative sources about immigration rules.

- Public Greenhouse job boards for Verkada and Cohere Health, to find two postings (found by Claude Code through a web fetch that a summarizer processed; each URL was then confirmed with `npm run ats:liveness`).
- Posting pages supplied by Vrajesh: Talent Vine (Recruiterflow), Intuit, Confido (Ashby), Motion Recruitment, Boeing. Each was read in a browser and checked with `npm run ats:liveness`.
- A LinkedIn posting (DeWinter Group) was supplied but could not be read without signing in. It is not in the run and was not used.

Statements in the recipe about what OPT permits, or what a TS/SCI clearance requires, are the AI's general understanding and are not taken from an authoritative source. They are labeled that way and should be confirmed with the school's international office.

## Tools

Node 22.15.1 (repo requires 20+), Claude Code (Sonnet 5.5) as the AI assistant, `node:test` for tests, Playwright (through the repo's own checker).

## AI vs. human contribution

| Item | AI (Claude Code) | Human (Vrajesh) |
|---|---|---|
| Situation and target | none proposed | **stated:** MS Information Systems, F-1, graduating December 2026, entry-level software engineer |
| Forking and the repository | cloned the fork, set up the branch | created the fork |
| `CHANGE-BRIEF.md` | drafted all of the text, including the predictions | read it, signed it on 2026-10-03, and added dated revisions under "Revisions": the funding prediction that was partly wrong, the OPT-bridge scope change, and failure cases not predicted. The original predictions were left unchanged |
| Prototype design (exact-name match, tiers, countdown) | proposed and wrote it | reviewed the tier rule on 2026-10-03; no changes requested |
| Tier rule and probabilities (10 approvals; 0.9 / 0.6 / 0.3 / 0) | proposed | reviewed on 2026-10-03, no changes requested |
| Default fit 0.7 → 0.5 | found the problem by arithmetic and made the change | reviewed on 2026-10-03 and decided to keep it ("at first it did not feel right, but it will work out") |
| DRAFT lifecycle status | chose it, because open TODOs remain and no human has cleared the gate | reviewed on 2026-10-03, no changes requested |
| OPT-bridge track (roles taken without sponsorship) | designed and implemented it | **raised the gap:** the tool only asked about H-1B sponsorship, but the goal is a job right after graduating, including contract roles; chose the "second" option (a separate track) |
| Human exclusions (`excluded_reason`) | proposed the field and wrote the wording for Talent Vine (citizenship) and Boeing (TS/SCI clearance) | supplied both postings and verified the exclusion wording against them (reported by Vrajesh, 2026-10-03). The Talent Vine reason is posting text; the Boeing link from "TS/SCI clearance" to U.S. citizenship is a reading, not posting text, and stays worded as "to my knowledge" |
| Motion Recruitment posting | ran the checker; reported that it is a senior, embedded role asking 6+ years | supplied the posting and **decided to keep it as a bridge row, not excluded**, to show the track's limit |
| Embedded Verkada role | found it | **rejected it** as a poor fit; it was dropped |
| Real postings | found two (Verkada, Cohere Health) and ran `npm run ats:liveness` on all seven URLs | supplied five (Talent Vine, Intuit, Confido, Motion Recruitment, Boeing) and one LinkedIn link that was left out. No liveness result was typed by Vrajesh |
| Tests | wrote the 17 tests; one expected value was wrong and was corrected; the break attempts found a real date bug, fixed with regression assertions | Asked claude to ran the tests and also ran by myself to check if everything is okay at start and while building faced some tests failed |
| Environment fix (Windows line endings) | diagnosed and applied in the local clone only | not involved |
| Commit author address | switched this repo to a GitHub noreply address, unrequested, to keep a real email out of history | Approvedd it and asked it again if there is anything else that can create issue |
| Recipe, card, README, justification, worked run, test report, run log, `SUBMISSION.md` | drafted | Verified the work done by claude and edited it if there is any changes required |
| `FRICTIONAL.md` | drafted the timeline, checks and who-did-what | wrote the open questions in section 2, rewrote the summary, and reviewed the file |
| Pull request description | drafted the text | will post it and open the PR |
| Commits, push, PR, Canvas upload | made three local commits at Vrajesh's request; nothing pushed | will push, open the PR and upload |
