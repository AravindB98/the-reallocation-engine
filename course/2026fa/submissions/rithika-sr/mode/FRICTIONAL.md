## Executive summary

This is a dated diary of what went wrong, what was decided, and why, while building and running a screening tool for a fictional student looking for a sponsored data scientist job. Read it to see the decisions behind the final design and the places where the work was harder than planned. Most of the friction was not the code: it was a corrupted local copy of the repository, a missing library, choosing how to label closed jobs, finding real postings to test with, and catching two mistakes in the job checker by opening pages by hand.

*Drafted by Claude Code from my session notes; reviewed and edited by rithika-sr.*

## 2026-10-03

- Built recipe v0.1 and `triage.py` for the first worked run. Details in `../FRICTIONAL.md` and PR #22 (https://github.com/nikbearbrown/the-reallocation-engine/pull/22).

## 2026-10-21

I started and finished all of this assignment today. Events in the order they happened:

1. **Orientation.** Upstream `main` had no new commits since 2026-09-23. The new assignment text says `assignments/submissions/<name>/` and `logs/RUN_LOG.md`, but the repo uses `course/<term>/submissions/<handle>/`, and CONTRIBUTING.md makes `logs/RUN_LOG.md` maintainer-only (CI rejects student edits). That is the RUN_LOG path conflict; I used `logs/runs/2026fa-rithika-sr-2.md`.
2. **iCloud duplicate folders.** `book/`, `instructions/`, `logs/` and `youtube/` showed as deleted in git, with untracked copies named `book 2/`, `logs 2/` and so on. I restored the tracked folders with `git restore` and diffed each pair. Three pairs were identical. `instructions 2` had an extra `.build/` folder, so I **stopped** before moving anything. That folder turned out to be gitignored, generated output identical to the repo's `AGENTS.md` and `CLAUDE.md`, so I then moved all four copies out of the repo, not deleted.
3. **PyYAML.** `npm run verify` failed because the system Python 3.14 has no PyYAML. I created a repo `.venv` with PyYAML; verify then passed with three warnings. Two of those (`private/`, `data/ats/`) are false positives, because the files are ignored through `/private/*` and `/data/ats/*`.
4. **builtinaustin gap.** While writing the aggregator list, I noticed the October 3 Nextdoor link was on `builtinaustin.com`, which the planned six-domain list would not catch. I added the Built In city sites, each with a reason.
5. **CLOSED vs HELD.** The first version held a posting whose employer page was expired, the same as an unknown one. I decided a verified-closed job is a fact, not a gap: it is now **CLOSED** (no score, no action). HELD stays for uncertain, unparseable, aggregator-only and missing checks. An aggregator saying "expired" never closes a role.
6. **No entry-level postings.** Searching current postings at sponsors in the CSV turned up only mid-level and senior Data Scientist roles. Moloco's "Data Scientist II" was the closest. I also found that a copy of one Instacart posting says it does not sponsor visas, even though the company has 498 approvals on record.
7. **Live run and my browser check.** The tool scored three postings Apply. I opened them myself. Moloco: open, Apply. Figma: open but asks for experience, Consider. Airbnb: the link landed on "All Jobs, 194 open roles", Skip. The Nextdoor page showed an Apply button the checker missed. The General Catalyst page loaded the Instacart role in my browser, although the checker had a navigation error.
8. **Airbnb redirect confirmed.** `curl -sIL` showed the Airbnb link going through `?error=true` to the all-jobs page. The checker only looks at the final page, sees Apply buttons there, and says active. I added this as a typed TODO: the final URL must still identify the same job.
9. **DRAFT decision.** Both my recipes are DRAFT. The new one has 13 open TODOs. The old one claimed RUNNABLE-SAMPLE while it had open TODOs, which skips SPECIFIED, so I corrected it.
10. **Video length.** The TA clarified that the video must be under 4 minutes.

## My reflection

- <EDIT ME>
- <EDIT ME>
- <EDIT ME>
