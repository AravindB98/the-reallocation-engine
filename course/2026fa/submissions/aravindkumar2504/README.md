# Submission: pre-OPT backend sponsor tiers

## Executive summary

This folder holds the written part of two INFO 7375 submissions (Fall 2026) by Aravind Sundaravadivelu (GitHub `AravindKumar2504`), for one job seeker: an international master's student who graduates in the spring, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. The first, "Recipe Design" (version 0.1.0, 2026-10-03), is a recipe, its card and a prototype that turns each company's visa-sponsorship record into a tier and runs the repository's scorer. The second, "Mode Build" (version 0.2.0, 2026-10-20), takes that shortlist live: it finds real postings, checks they are open, quotes the sentences that matter, and stops for a person, who decided the liveness gate on every chosen posting and the eligibility gate on the 7 that passed it. **For the Mode Build, start with the README in the mode-build folder.**

## Mode Build (version 0.2.0)

Everything for it is listed, with its location, in `mode-build/README.md`: the domain justification, the worked run with its attestation, the author's decisions, the run in `runs/2026-10-20/` (with its `live/` folder), and the run-log entry `logs/runs/2026fa-aravindkumar2504-2.md`. The recipe claims DRAFT: eleven typed proposals are open; the sample run and the live run do not change that.

## Recipe Design (version 0.1.0, kept as history)

| File | What it is |
|---|---|
| `CHANGE-BRIEF.md` | written before any code: the situation, predictions and planned failure cases; later revisions are appended, never rewritten |
| `domain-justification.md` | the version 0.1.0 justification: who it is for, the information asymmetry, where it fits the 3-3-2 day, domain-specific failure modes |
| `worked-run.md` | the version 0.1.0 run: commands with their real output, what is verified and what is inferred, the reflection and the attestation |
| `TEST-REPORT.md` | the toolchain before and after, the offline tests, the deliberate breaks, each named failure case, a clean checkout, and what a person must still judge |
| `FRICTIONAL.md` | the honest log for version 0.1.0: what was tried, what went wrong, what the assistant did and what the author did |
| `SOURCES.md` | the repository documents, data and tools used, and the split between the assistant's work and the author's |
| `title-matcher-check.md` | an 80-title check of the rule that decides which titles count as backend |
| `runs/2026-09-30/` | the version 0.1.0 sample run: `report.md` and `run-log.json` plus the scorer's input and output |

Version 0.1.0 claimed RUNNABLE-SAMPLE while nine typed TODOs were open, which the lifecycle does not allow; version 0.2.0 corrects the claim to DRAFT. The `runs/2026-09-30/` files were made by version 0.1.0 of the code. Today's code labels the parameters by who decided them, so a re-run on that date does not match those files line for line.

The rest of both submissions is in its assigned places: the recipe and card in `recipes/cases/2026fa/` (`aravindkumar2504-preopt-swe-sponsor-tiers.md` and `.card.md`), the prototype, its tests and fixtures in `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/` (see its `README.md`), the run-log entries in `logs/runs/2026fa-aravindkumar2504-1.md` and `logs/runs/2026fa-aravindkumar2504-2.md`, and one fictional persona, `search/examples/kiran-rao/profile.yml`, in the directory the repository reserves for them (the only file outside the four assigned locations).
