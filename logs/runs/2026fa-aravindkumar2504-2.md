## 2026-10-20: pre-OPT backend sponsor tiers, sample run and live run with both posting gates decided

### Executive summary

The mode ran on the data that ships with the repository, for a fictional candidate who has not started work authorization, and then went to live job boards.
- **The records:** 59 companies worth a closer look.
- **The live step:** a job board was found for 26 of them, under the names tried. The step read 3,193 jobs, kept 39 postings that fit the rules (at 9 companies) and chose 8, one per company.
- **The liveness check:** 7 still open. Xage Security's page returned "not found" although its job board still listed it.
- **The author's review:** the author read the 8 postings. All 7 live ones cleared; Xage was set aside.

Nothing here decides to apply. Three gaps remain:
- 33 of the 59 companies could not be checked live at all;
- no gate checked whether an employer will wait until this candidate can start, about seven months after the run;
- the cap of 8 chose among tied companies by name.

### Record

- **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.2.0 (`recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`), status DRAFT (11 typed TODOs open).
- **Commands, base run:** `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-10-20`.
  - First run at 00:47 UTC.
  - Re-run at 20:26 UTC after the program's version stamp moved to 0.2.0. The four scorer files came out byte-identical; the report and the agent log differ only in the version and the code hash.
- **Commands, live step (UTC):**
  - `find-boards.mjs` (00:48);
  - the repository's `scripts/ats/scan.mjs`, unmodified, from an empty folder outside the repository (00:48);
  - `select-postings.mjs` (00:48; re-run at 09:10 after a bookkeeping fix, with the same 8 postings chosen);
  - `h1-liveness.mjs` (00:49, and again at 08:53 right before the author read the postings);
  - `h2-screen.mjs` (00:49);
  - `live-report.mjs` (20:27, and again at 05:30 on 2026-10-21 after wording fixes from a review; the counts did not change).

  Every command, as run, is pasted in `course/2026fa/submissions/aravindkumar2504/mode-build/worked-run.md`.
- **Inputs (first 12 characters of each SHA-256):**
  - **Base run:**
    - company table `eccdee2addf4`; BLS extract `bac5acf77ca2`; persona `0a3eac2dc4e9`;
    - parameters `ad11e611d391`; role families `89d71064b1b5`; watchlist `0b82f1063527`;
    - scorer `8655e182c3c2`; prototype code (combined, eight files) `bcbe0a2197c0`;
    - the four Form D samples `6b24543c0628`, `a1bdd1ebad49`, `b92e0aa223c7`, `f3fbe3f70970`.
  - **Live step:**
    - base run log `6fe8206659c3`; boards `cdb7cd8d447b`; scan history `d825a7be455c`; chosen postings `c9b638b4c475`;
    - liveness record `5556feb69921`; posting screen `1beb0063411c`; gate decisions `9d2eaafef5a0`;
    - liveness checker `scripts/ats/check-liveness.mjs` `e4d8d1e78d86`.
- **Outputs:** `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/` holds:
  - `report.md`, `run-log.json`, `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`;
  - a `live/` folder with `report-live.md`, `run-log-live.json`, `boards.json`, `live-portals.yml`, `scan-history.tsv`, `scan.stdout.txt`, `selected-postings.json`, `h1-urls.txt`, `h1-liveness.json`, `h1-liveness.stdout.txt`, `h1-liveness.first-check.json`, `h1-liveness.first-check.stdout.txt`, `h2-screen.json` and `gate-decisions.json`.
- **Gate results:**
  - **G0:** stale-accepted (newest funding date 2025-09-26, 12.8 months old, limit 6). The run log records the acceptance flag, not a name; the author's decisions record that the author chose to run with the warning, on 2026-10-19 at 17:43 Pacific.
  - **G1:** pass.
  - **G2:** pass (71 roles checked; the repository's own scorer echoed needs_sponsorship=true).
  - **G3:** factor 1, open (the unemployment clock starts 2027-06-01; this says nothing about whether an employer will wait).
  - **H1, machine half:** 7 active, 1 expired, 0 uncertain, at both checks (checker exit 1 both times, because a posting expired).
  - **H1, person half, and H2:** decided by Aravind Sundaravadivelu between 08:58 and 09:03 UTC, in browser tabs the assistant opened at about 08:54; recorded at 09:03:39 UTC. H2 was asked on the 7 postings that passed H1. The questions covered no-sponsorship, citizenship, green-card and clearance wording, not start dates.

| Company | Posting | Checker | Answer as given | H1 | H2 | Outcome |
|---|---|---|---|---|---|---|
| Cohere Health | Software Engineer II | active | Looks fine | confirmed live | no blocker | cleared |
| Databricks | Software Engineer, Web Products | active | Looks fine | confirmed live | no blocker | cleared |
| Figma | Data Platform Engineer | active | Looks fine | confirmed live | no blocker | cleared |
| Mercury Technologies | Software Engineer - Infrastructure | active | Looks fine | confirmed live | no blocker | cleared |
| Sigma Computing | Software Engineer - Compiler | active | Looks fine | confirmed live | no blocker | cleared |
| Stripe | Backend Engineer, Core Technology | active | Looks fine | confirmed live | no blocker | cleared |
| Verkada | Backend Engineer - Connectivity | active | Looks fine | confirmed live | no blocker | cleared |
| Xage Security | Software Engineer - Full Stack | expired (HTTP 404) | Page broken or gone | not live | not asked | set aside |

- **Result, base run:** 76 evaluated (11 on the candidate's list, 65 found by search).
  - 71 scored: Apply 51, Consider 8, Skip 12 (all 12 Thin).
  - Held 2; unresolved 3.
  - Every Apply role scored exactly 0.315: every Proven company gets the same fixed sponsorship value, and the scorer has no fit input.
- **Result, live step:**
  - 59 shortlisted; a board was found for 26 (20 Greenhouse, 5 Ashby, 1 Lever).
  - 3,193 jobs found; 893 kept after the scanner's title filter (2,100 removed) and duplicate check (200 skipped).
  - 39 pass the mode's rules, at 9 companies; 8 chosen.
  - 7 cleared, 0 held, 1 set aside.
  - **The other 52 shortlisted companies:**
    - 33 had no board under any name tried;
    - 17 had a board but no posting that fits;
    - 1 (Zscaler, 802 approvals) had a fitting posting that the cap of 8 left out by alphabetical order, because all 9 tied on score.
  - **Surprising:** the board's own listing still showed the Xage posting whose page was gone, and the H2 screen quoted Verkada saying it sponsors employment visas for the role.
- **Disagreements:**
  - **(1) Export-control wording.** Version 0.1.0's gate H2 stopped a posting on any export-control wording. The author read the Databricks clause (the employer may decline if the job needs export-controlled technology) and cleared the posting.
    - The answer option the author picked was worded by the assistant and already called the export sentence "only a condition".
    - At 20:44 UTC the author decided the rule, from a question that offered pass, hold or block with each one's consequence. The rule: a conditional clause is not a stop, and the report keeps the quoted sentence.
    - The decision came first; the rule was written after it.
  - **(2) Start dates.** Version 0.1.0's H2 also stopped a posting on a start date earlier than the earliest legal start. The live questions did not ask about dates, so version 0.2.0's H2 covers only the wording asked about, and the date check is a new open proposal (13).
  - **(3) The cap bookkeeping.** The posting choice recorded Zscaler as chosen although the cap had cut it, so the first live report left Zscaler out of every group.
    - Found while checking the report.
    - Fixed in `select-postings.mjs` and `live-report.mjs`, with tests.
    - The re-run chose the same 8 postings, and `h1-urls.txt` was byte-identical.
- **Open issues:**
  - **The 11 typed TODOs in the recipe:** five scorer defects or gaps, three data sources, a tie-break for the cap, job-board reach beyond three systems, and a start-date rule.
  - **Smaller gaps:**
    - the title rule was checked only on 80 titles labelled by the assistant;
    - every approval and denial count is even, with no documented cause;
    - the company data is 12.8 months old;
    - Ashby postings have no text screen;
    - a posting can close after the check;
    - the base run's own report still says a person must find each posting URL.
- **Human read:** Aravind Sundaravadivelu read the live report, `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/report-live.md`, on the evening of 2026-10-20 Pacific time; the answer "Read it" was given at 04:35 UTC on 2026-10-21. The read covered the summary, the table of 8 postings and the companies it could not reach.
  - The live report was regenerated at 05:30 UTC with wording fixes from a review: its "read this first" list gained a start-date warning, and its counts did not change.
  - The base run's `report.md` for this run was not part of that read.
  - The read covers this run only; it does not confirm the proposals still open in the recipe.
