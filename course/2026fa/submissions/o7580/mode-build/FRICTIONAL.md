# FRICTIONAL — honest log of the Mode Build

## Executive summary

This is the honest record of how the mode was built: who did what, what broke, and what is still the author's to do. Almost all the hands-on work — scanning, reading postings, writing code, running checks, drafting these documents — was done by an AI coding agent in one session on 19 October 2026, working from the assignment text and the author's choice of domain. The author's own decisions and reviews are listed separately. Section 4 is for the author to write, before submitting.

**Who:** Omkar Salian (GitHub `O7580`) with Claude Code (model Claude Opus 5.5) as the agent.

## 1. Who did what

| Work | By |
|---|---|
| Chose the domain (design-engineer lane) from three options the agent proposed | **Author** |
| Asked that nothing be committed or pushed until told | **Author** |
| Read the constitution, repo, CI rules and prior submission; proposed the plan | Agent |
| Chose the 17 boards and wrote the selection rule | Agent (author to confirm) |
| Ran every command in the worked run | Agent |
| Transcribed every posting field and drafted every fit value | Agent; **confirmed unchanged by the author 2026-10-20**; the 4 Palantir postings **re-opened and checked by the author himself 2026-10-21** |
| Wrote `lib.mjs`, `triage.mjs`, `title-audit.mjs`, tests, fixtures, break harness | Agent |
| Wrote the recipe, card, justification, worked run, run log, these notes | Agent (drafts) |
| Gate decisions G1/G2/G4/G5/G6 (approved from the agent's re-check sheet) and the attestation signature (after re-running the tests) | **Author, 2026-10-20** |
| Author's reflection and §4 | **Author**, rewritten in his own words 2026-10-21 (the §4 bug point was chosen from agent-listed options) |

## 2. Friction, in order

| # | What was tried | Expected | What happened | Response |
|---|---|---|---|---|
| 1 | Follow the pasted assignment's paths (`recipes/`, `assignments/submissions/`, branch `mode/<name>-<domain>`, append to `logs/RUN_LOG.md`) | allowed | The repo's `CONTRIBUTING.md` and CI (`contrib-gate.yml`) **fail** any student PR that touches `logs/RUN_LOG.md`, and warn on paths outside the contributor namespaces | Followed the CI contract: `recipes/cases/2026fa/`, `course/2026fa/submissions/o7580/mode-build/`, `logs/runs/2026fa-o7580-2.md`. The run-log entry is also in the ZIP. Branch named `mode/o7580-design-engineer-soc` per the assignment (CI does not check branch names). |
| 2 | First `ats:scan` | 17 boards load | 5 × HTTP 404 (my guessed board names) | Ran the repo's `detect-ats.py`: Databento is on Greenhouse; the other four are on neither Greenhouse nor Lever. Corrected one config line, re-scanned, kept both outputs. |
| 3 | Title filter `ux` | design titles only | Matched "Territory Account Executive … Sioux Falls" | Kept it in the scenario as a test of G1; proposed a maintainer fix (TODO 4). |
| 4 | Location `allow` list | US only | Vancouver BC, Warsaw, Chennai, "Asia Pacific" passed | Scenario built from US-located rows only — a human step now named in the recipe. |
| 5 | Classifier on all 100+ real design-ish titles | sensible families | missed "Web Engineer"; misfiled "Solution Engineer Frontend/Backend" | Added `web engineer`; documented the misfire at first, then fixed it on 2026-10-21 with a general rule for solutions/sales/field titles and a regression test. |
| 6 | Break attempts B4/B5 | runs into a temp dir | refused: `/var/folders` → `/private/var` symlink | Fixed (`realOutPath`), regression test 15. **The same bug was fixed in PR #37**; adapting older code re-introduced it. |
| 7 | Break harness under zsh | exit codes printed | blank (`PIPESTATUS` is bash-only) | Harness moved to `break-tests.sh`, run with bash. |
| 8 | Reproducibility diff | identical | false difference from a repo-relative out-dir path | Normalized in the harness; 5/5 identical. |
| 9 | `pii-scan` with posting JSON in gitignored `private/` | clean | flagged employers' accommodation e-mails (it scans gitignored files) | Moved raw postings outside the repository. Remaining finding is the pre-existing upstream lockfile one, not reproduced in any file. |
| 10 | Baseline scorer output into the session scratchpad | — | the path contained the author's macOS username | Re-ran into a neutral temp dir before saving. |
| 12 | Download the DOL LCA file (proposal 1) on 2026-10-21 | 252 MB workbook | dol.gov returned HTTP 403 to curl, and the browser pane's download saved nothing | Proposal 1 left open. A draft extractor was moved out of the repository rather than shipped unrun. |
| 11 | `npm run doctor` as a check on this recipe | counts it | doctor only reads top-level `recipes/` | Said so in the attestation's "Did not test"; counted TODO markers with `grep`. |

**Entries by the author (Omkar Salian), in my own words:**

| # | What I tried | Expected | What happened | What I took from it |
|---|---|---|---|---|
| A1 (2026-10-21) | I ran the triage myself in my own terminal, on the confirmed scenario | the same result as the saved run | It printed out of lane 2 · Apply 2 · Consider 2 · Skip 3, the same as the saved run | I ran it myself and I think the output is reproducible. |


## 3. Decisions the author may want to revisit

- **Lifecycle DRAFT, not RUNNABLE-SAMPLE/LIVE.** A live run exists, but the six typed proposals the assignment asks for keep the recipe below SPECIFIED by the constitution's own rule, although every human gate was cleared on 2026-10-20. Alternative: move the six proposals to a separate tracked record and claim RUNNABLE-LIVE with `last_gate` pointing at the confirmed re-run.
- **Fit values.** The agent's 0.4–0.6 drafts carry both Apply results. Change them if they don't match your own read.
- **Board selection.** Five of nine postings are Palantir. A different rule (e.g. more Boston boards) gives a different sample.

## 4. My review (Omkar Salian, in my own words, 2026-10-21)

- I went through the agent’s word-for-word re-check sheet on October 20, 2026, and signed off on all the posting fields, job families and employer matches. I didn’t reopen each job posting myself. (I re-opened the 4 Palantir postings myself on 2026-10-21.)
- **What I changed:** Nothing. I accepted the agent’s fields and fit values as they were.
- **The decisions I recorded:** I confirmed G1, G2, G4 and G5 and accepted the fit assessment. For G6, I marked both Palantir rows as “Apply” and Toast and Squarespace as “Consider” on October 20, 2026.
- **What I think the agent got wrong:** It brought back the macOS temp-folder bug that had already been fixed in my earlier recipe, PR #37. The break tests caught it, and test 15 now checks for that bug.
- **What I predicted before the run:** I knew that I would be able to see the job postings. *(Added 2026-10-21; my words, spelling fixed.)*
- **What I still want to test:** Whether the agent can maintain an Excel sheet of the job applications I do. *(Added 2026-10-21; my words, spelling fixed.)*
- **How I wrote this section:** The first two points describe what I did. For the point about the bug, I chose from options the agent suggested based on this build log.
