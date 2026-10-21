# Mode Build submission — healthins-ai-opt v0.2.0

## Executive summary

This folder is my submission for the Reallocation Engine "Mode Build" assignment. It takes the mode I designed for the earlier assignment (a triage tool for an international student looking for applied-AI jobs at insurance and health companies) and makes it run on real data: 32 live job boards, a real browser check that each posting is still open, and the repository's own scorer. An AI agent (Claude Code) built and ran it under my direction, and a second agent reviewed the result; one file in this folder says who did what. Read the worked run first. It pastes the real output, separates what the data established from what was judged, describes nine attempts to break or stress the mode, and says where it is wrong. The mode ends at the first stage of the repository's lifecycle, "draft", because eight proposed additions are still open; it does not claim more than it earned.

## Cover sheet

```
Assignment: The Reallocation Engine — Mode Build Assignment (100 points)
Student: Shreyash Yadav
GitHub handle: shreyashyadav1
Domain / situation: international MS student (STEM-designated information systems), graduating December 2026, OPT from January 2027 with a 90-day ceiling; applied-AI / LLM engineer roles (SOC 15-1252) at insurers, insurtechs and health-tech firms. The persona is fictional (Kabir Rao, @example.com); no real résumé or contact data is used anywhere.
Mode file: recipes/shreyashyadav1-healthins-ai-opt.md (+ .card.md), recipe_version 0.2.0
Lifecycle stage claimed: DRAFT (8 typed TODOs open). Evidence beyond DRAFT: a real-data run on 2026-10-20, 45 offline tests, nine deliberate break or stress attempts (five attack the mode itself). Not claimed: SPECIFIED, RUNNABLE-SAMPLE, RUNNABLE-LIVE, VERIFIED. Human gate G7 not cleared. Attestation signed by the student on 2026-10-21 for the 2026-10-20 run (the name and date were typed by the agent at the student's instruction).
Commands that were run: npm run verify · npm run doctor · npm run score:gates · python3 scripts/ats/detect-ats.py · npm run ats:scan -- --dry-run · npm run ats:liveness -- <urls> · npm run score · python3 scripts/sec/refresh-recent-sec-quarters.py (fails, recorded) · node …/tools/discover-boards.mjs · node …/ingest.mjs · node …/run.mjs · node --test
GitHub repository / branch / PR: https://github.com/shreyashyadav1/the-reallocation-engine / mode/shreyashyadav1-healthins-ai-opt / the PR link and the head commit SHA are in the Canvas comment (the PR supersedes my v0.1.0 PR, nikbearbrown/the-reallocation-engine#39)
Summary of the changes: ingest.mjs (the only networked step, using the repo's providers and liveness checker), jd-screen.mjs (posting-text screen), run.mjs and lib.mjs upgrades, 32-board portals file, 45 tests with a BROKEN mutant, 12 verification and discovery tools, recipe + card v0.2.0, this folder. No maintained file is modified.
Known limitations: only 9 of 29 scorer terms are records (liveness); the sponsorship probability, fit and timeline are inputs and rules written for the persona; 10 of 32 boards cannot be matched to a company in the data; the board-to-company link is a claim that nothing in the repository checks (12 of the 32 boards were added by name); notes about companies in the world (acquired, public) are unchecked outside knowledge; the title-based fit cannot see a team's function (the highest-scored role is a customer-facing Rails role); hiring-loop lengths are size guesses and the list changes with them (nothing moves between 84 and 144 days, half of it at 150); funding data ends 2025-09-26; no Form D beyond samples, no DOL LCA, no E-Verify data; liveness "uncertain" was never seen live, and the liveness apply test is a word match (Coalition's stored link redirects to a careers listing that still reads active; the role itself is open).
```

## Where each required item is

| Assignment item | Where |
|---|---|
| Mode file (frontmatter, purpose, source inventory, proposed additions as typed TODOs, gates, can/cannot verify, output contract, stop conditions, log template) | `recipes/shreyashyadav1-healthins-ai-opt.md` |
| Domain justification (one page) | `assignments/submissions/shreyashyadav1/DOMAIN-JUSTIFICATION.md` (this folder) |
| Worked run: inputs, verbatim commands and output, verified vs inferred, verification, break attempts, attestation, reflection | `assignments/submissions/shreyashyadav1/WORKED-RUN.md` (this folder); every transcript is in `assignments/submissions/shreyashyadav1/evidence/` |
| RUN_LOG entry | `RUN_LOG-entry.md` (this folder; the same text is at `logs/runs/2026fa-shreyashyadav1-2.md`, because `CONTRIBUTING.md` forbids editing `logs/RUN_LOG.md`) |
| New or edited scripts and sample data (no personal data) | `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/` (code, tests, tools, inputs); the real run's outputs are in `assignments/submissions/shreyashyadav1/runs/2026-10-20/` |
| Five-minute show and tell | `PRESENTATION-5MIN.md` (this folder) |
| Disclosure of AI help | `FRICTIONAL.md` (this folder) |

## Where things are, and why

This follows the assignment's submission instructions: the branch is `mode/shreyashyadav1-healthins-ai-opt`; the justification and the worked run are in `assignments/submissions/shreyashyadav1/` (this folder), together with everything that belongs to them: the cover sheet, the transcripts (`evidence/`) and the run's outputs (`runs/2026-10-20/`); the mode file and its card are directly under `recipes/`. Two things stay where the repository's rules expect them: the code (`scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/`) and the run log (`logs/runs/2026fa-shreyashyadav1-2.md`, because `CONTRIBUTING.md` forbids editing `logs/RUN_LOG.md`). The repository's scope gate only warns about the folders `assignments/` and the top level of `recipes/` (they are outside the folders `CONTRIBUTING.md` lists); it does not fail the PR. The files were first written under `course/2026fa/submissions/shreyashyadav1/mode-build/` and moved here on 2026-10-21; the transcripts still show the old paths because they record the commands as they were run. The zip is laid out by assignment item (above) so the grader does not have to hunt.

## What is in this folder

| Path | What |
|---|---|
| `DOMAIN-JUSTIFICATION.md` | the one-page justification |
| `WORKED-RUN.md` | the worked run, attestation and reflection |
| `RUN_LOG-entry.md` | the run-log entry |
| `PRESENTATION-5MIN.md` | the show-and-tell script |
| `FRICTIONAL.md` | who did what (the student and the AI agent) and what resisted |
| `assignments/submissions/shreyashyadav1/runs/2026-10-20/` | `candidates.snapshot.json`, `roles.json`, `role-scores.json`, `role-scores.md`, `run-log.json`, `report.md` from the real run |
| `assignments/submissions/shreyashyadav1/evidence/` | verbatim terminal transcripts, one file per command, each ending in its exit code and the time it was recorded. Two exceptions: `05` is the first board-discovery output, pasted by hand without a command line, exit code or time (`05b` is a re-run of the saved probe with all three), and `11` has no time line. Transcripts `12` and `13` are earlier runs of the tests (44 then) and the conformance check; `93` and `94` are the final ones. `96` to `99` record the corrections made after the independent review, and `100` and `100b` record what the student's Coalition check turned up |

## What the student re-ran before signing (about ten minutes)

The attestation in `WORKED-RUN.md` records these checks; the rows marked "the student" are the ones the student ran on 2026-10-21, and the "By" line was then filled in by the agent at the student's instruction. To repeat them:

1. `npm install`, put PyYAML on PATH, then `npm run verify` and `npm run doctor`.
2. `node --test "scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/*.test.mjs"` (45 pass).
3. Re-run the decision step from the saved snapshot and compare. Put the snapshot inside your out-dir first, so the folder paths the logs contain normalise the same way (otherwise the run log differs only by that path):

   ```bash
   mkdir -p output/mine && cp assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json output/mine/
   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates output/mine/candidates.snapshot.json --out-dir output/mine
   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs output/mine assignments/submissions/shreyashyadav1/runs/2026-10-20
   ```

   The last line should say "all five outputs identical".
4. Open the postings from `report.md` and compare each with what the report says about it: Omada's Solutions Engineering role, one Commure role, and Coalition's Frontend Engineer (use `https://www.coalitioninc.com/job-posting/4734028005`: the link stored in the report redirects to the careers listing). Open a dead one (`…/omadahealth/jobs/1234567`) and confirm it says the job is no longer open.
5. Read the reflection. Any later change to the recipe or its scripts voids the attestation.
