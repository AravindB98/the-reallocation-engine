# Frictional: h1b-wage-level-odds mode

Pavithra Prasad · INFO 7375 · Reallocation Engine Mode Build

Evidence: `runs/` · Gate decisions: `inputs/gates-live.json` · Run log: `logs/runs/2026fa-pavithra-prasad-2.md` · Tests: `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py`

Commit: `483f9b663a332000d98dc6f7fd8db073204bc489` (submission) · Pull request: https://github.com/nikbearbrown/the-reallocation-engine/pull/84

My key prompts, quoted short: "the best one" (choosing the mode) · "yes go ahead" (downloading the DOL file) · "Robinhood is live" (G1) · "1-6 clear, 7 hold because it's ML, 8-10 clear" (G3) · "accept city table, audit read, release" (TODO closures, G4) · "G2 clear: registration on 2027-03-10 is inside OPT and the wage year" (G2)

## 2026-10-19 — Choosing the mode

- **Tried / expected:** I expected to build on my Recipe Design mode (PR #33). The course repo showed that the Recipe Design was its own 100-point assignment with almost the same deliverables, so resubmitting that mode would have been old work.
- **Decision:** the class's open pull requests already covered sponsor triage and the OPT clock many times, and PR #52 covered a salary floor, so that idea was dropped.
- **Chose** a new question: what a posting's pay and city do to H-1B lottery entries under the wage-weighted selection rule in force since February 2026.

## 2026-10-19 — Data

- **Tried:** after I approved the download, DOL's 2026-27 wage file was cut to the software developer rows for five metro areas, with fingerprints.
- **Expected / checked:** the DOL wage search should show the same numbers as the file. I searched Santa Clara County myself: all four levels matched (`evidence/dol-wage-search-2026-10-19-santa-clara.png`).

## 2026-10-19 — Build and runs

- **Tried:** the mode script, a fetch script and 32 tests were written; a sample run of 11 constructed postings, then 13 live postings.
- **Expected:** the live postings to read like the sample. **What happened:** they did not. Zone tables, cities posted without a state, hourly ranges and one range per office all broke the parser, and a closed posting crashed the run. All five were fixed and tested.
- **Unexpected result:** the repo's own liveness checker called an open Pinterest posting "expired" from its page content; the job board's API said open (`runs/liveness-pinterest-terminal.txt`).

## 2026-10-19 — Checking the gates myself

- Opened the Pinterest and Robinhood postings myself; both were live.
- **Assumption checked:** the Pinterest page gives its range to "US based applicants only", so it may not be a San Francisco range. Added this as a limit of the mode.
- Reviewed each job title for the job-code gate: 9 clear, 1 held because it is an ML role.
- Read the data audit and the live report, then released the report (G4).

## 2026-10-19 — Final fixes

- The visa-timeline gate now shows 30, 60 and 90-day hiring lags instead of relying on one assumed lag.
- Trimmed the domain justification to one page.

## 2026-10-21 — Checking every gate myself

- Opened the other 11 postings myself; all were live, so every posting in the run has now been checked by hand.
- Confirmed the visa timeline in my own words: registration on 2027-03-10 is inside OPT and the wage year.
- Accepted the DOL extract, the 2,080-hour rounding, software developer as the default code and the report columns.

## 2026-10-21 — Outside review

- Asked ChatGPT to grade the zip like a strict TA. It scored 65/80.
- It found that three of the human gates were described as hard stops but not enforced in the code, that skipped postings still carried wage levels in the log, and that one of my gate notes about Pinterest was wrong.
- **Response:** each point was checked against the code before anything changed. Accepted and fixed those three and the smaller ones (tagged TODOs, output contract, one-page length). Kept the "executive summary" openings it called templated, because the repository's AGENTS.md requires them. The final live run gives the same results: 9 checked, 1 held, 3 refused.

## 2026-10-21 — Overlap check

- **Unexpected:** two pull requests opened today also use DOL wage levels (#67, Boston backend roles; #69, product manager roles).
- **Decision:** kept my mode. It compares five wage areas and the office choice within one posting, and the work started on 19 October.
- From #69 I learned of DOL's proposed new wage levels (27 March 2026). It was checked separately and added to what the mode cannot verify.

## Human and AI contributions

- **I did:** chose the wage-level mode from the options suggested, approved the data download, checked the DOL website, opened all 13 postings, reviewed each job title, decided every gate, read the audit and the report, and asked for the outside review.
- **Claude Code contributed:** researched the rule and the data, checked the class's pull requests, wrote the scripts, tests and write-ups, ran every command, and organised these entries from my decisions. My two reflection lines below are my own words.
- **Accepted:** the wage-level topic, the 2,080-hour rounding, software developer as the default code, and the outside review's confirmed fixes.
- **Changed:** held Lyft's "ML Software Engineer" at the job-code gate instead of clearing it.
- **Rejected:** resubmitting my Recipe Design mode, and switching topics after finding the overlapping pull requests.

## 2026-10-21 — Packaging

- Put the submission in one folder in the assignment's order: mode file, justification, worked run, run log, scripts and data.
- **What I learned:** I learned that real job postings are much messier than test data. Even when the salary looks clear, I still need to check the full posting and location before trusting the results.
- **What I would do differently:** Next time, I would collect a few real job postings before building the tool. That would help me catch unusual formats and edge cases earlier instead of fixing them during the live run.
- **Still unresolved:** whether DOL's proposed wage-level rule has become final, and which level each employer actually files. Next step: DOL's public labor condition application data.
