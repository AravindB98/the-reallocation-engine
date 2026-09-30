# Frictional: what was tried, what happened, what was learned

## Executive summary

This is an honest log of the work on the Reallocation Engine recipe assignment: what was tried, what surprised us, what was corrected, and who did what. It was assembled at the end of one working session on 2026-09-30 from the session record, by the AI assistant (Claude Code, Sonnet 5.5) working with the author, Aravind Sundaravadivelu. It is retrospective, and no time of day is claimed. The assistant did most of the hands-on work, so most entries say what the assistant did and why. The last section is the author's. At the author's request the assistant drafted it, in the author's voice, from only what the author did and said in this session. It is short because the author has not yet done many checks of their own, and it says so. No understanding or check appears in it that the record does not show.

## Entries

**1. Getting to the assignment page (2026-09-30)**
- *Tried / expected:* open the course-site assignment link in the assistant's built-in browser and read it.
- *Happened:* it landed on the university sign-in page, because that browser does not share the author's logins. The author then tried the Claude-in-Chrome extension and saw "Authorization failed" (their organization's role does not include that feature), so that route was closed.
- *Did:* the author signed in inside the built-in browser; the assistant read the page text and took the exact due date from the course site's own data (Saturday 2026-10-03, 11:59 PM Eastern). It noticed the page says 10 percent late penalty per day while earlier notes said 5 percent, and assumed the stricter.
- *Contributions:* the author signed in and chose the route; the assistant read, extracted and flagged the mismatch.

**2. The linked documents (2026-09-30)**
- *Tried:* check that every link on the page is reachable. There are 33 links but 7 distinct targets, 26 being heading anchors into the assignment's source file.
- *Happened:* all 7 loaded; one is a video, which the assistant cannot watch.
- *Did:* read the Frictional, GitHub-posting and Relative Quartile documents. The **author told the assistant not to read the AI policy**, and it did not. The author says they read or watched the policy themselves (see SOURCES.md).

**3. Fork and clone (2026-09-30)**
- *Tried:* `gh repo fork ... --clone --remote`. *Happened:* a usage error, because the assistant passed `--remote` wrongly. *Did:* retried without it and it worked. Small, but recorded because a first attempt failed.

**4. Toolchain baseline and the repository's own state (2026-09-30)**
- *Tried / expected:* the assignment's "get the engine running" steps, expecting green results. *Happened:*
  - `npm run doctor` passed. `npm run verify` failed until Python's YAML package was installed (done in a repository-local virtual environment, not system-wide).
  - The personal-data scan already reports one finding on the untouched base repository: an npm package author's address inside `package-lock.json`.
  - The repository's continuous integration on the main branch was already failing: four harness scripts named in its workflow do not exist, and its personal-data step stops on that same lock-file finding, so the history scan never runs on a pull request.
  - `npm run ats:scan -- --dry-run` fails on a fresh clone (no `portals.yml`). `npm run ats:liveness` needed a browser download, which the author approved; it then reported the example URL as expired (HTTP 404).
  - The assistant first used a `timeout` command that macOS does not have, so nothing ran; it re-ran without it.
- *Did:* recorded all of it as baseline. Learned that "CI green" is not fully reachable for any pull request here, and that the base repository has more rough edges than the assignment page lists.

**5. The scorer defect (2026-09-30)**
- *Expected:* the persona README says a Summer 2026 pull request fixed the scorer's reading of "work authorized". *Happened:* the assistant probed the real scorer. With that wording it treats the candidate as not needing sponsorship, ignores an explicit `needs_sponsorship` field, and moves a proven sponsor from Apply 0.446 to Skip 0.178. The scorer file has a single commit, so the fix never existed in this repository. It also found that a missing gate value silently becomes 1.0 labelled as a record.
- *Did:* chose to guard and report, not to patch a shared file (a patch to one maintained file is allowed but was not needed). The guard is gate G2; the defects are typed proposals in the recipe. **This was the assistant's decision and the author has not yet confirmed it.**

**6. A wrong claim, found and corrected (2026-09-30)**
- *Happened:* the assistant told the author, and wrote in the change brief, that the Form D samples match 0 of 200 companies. That used a crude name normalizer. With the repository's own rule, 15 of 200 match (and 212 table names collide after normalization).
- *Did:* re-measured, appended a dated revision to the change brief without touching the original text (commit `ec60e45`), and made ambiguous names a reported case instead of a guess. The spot check then showed something useful: for 3 of the 15 matched companies the table missed a first sale that falls inside its own time span (3 more show a first sale after the table's newest date, which a snapshot cannot hold).

**7. Design and predictions before code (2026-09-30)**
- The assistant read the book chapters, surveyed the 14 Summer 2026 case recipes (all unbuilt drafts), profiled the data, and proposed three recipes. **The author chose "pre-OPT backend sponsor tiers".** The author also chose no co-author trailer on commits and the browser download.
- The change brief with its predictions was committed before any code (commit `a3af489`).
- The assistant proposed every threshold and parameter with a sentence of reasoning. **The author has not yet confirmed them.**
- One data surprise shaped the thresholds: every approval and denial count in the table is even. The cause is undocumented and unresolved; the tiers were set to survive a double count.

**8. Building, testing, and what the tests missed (2026-09-30)**
- Prototype, tests and fixtures: commit `4ae7f38`. The assistant wrote tests, then deliberately broke the code to see whether the tests noticed (18 ways at first, 28 by the end). One break (swapping the "Form D newer" and "older" labels) went unnoticed, because the fixture had one of each and the test compared only totals. The test now checks each company; all 28 breaks are caught.
- Errors the assistant made and fixed in its own tests: a fixture count off by one (15 records, not 14), a run date that put an older persona before its clock started, a wrong expected discovery order, a variable typo.
- Changes made after the first run: a privacy guard (a persona outside `search/examples/` may not write into a tracked folder), code and scorer hashes in the run log, a clearer "why" column in the report, and a sampling script so the title check can be redrawn.
- A clean-checkout comparison (a fresh clone of the branch, `npm ci`, the same sample command) found five of the six outputs identical and `run-log.json` different: it held an absolute path from the assistant's machine, which would have exposed the author's username and folder layout in a public repository had the branch been pushed. It is now recorded as a repository-relative path, with a test that no output contains a machine path (commit `d8d7e0c`); the second comparison found all six identical. The earlier commit that had held the path was later scrubbed out of the local history, before anything was pushed (see entry 10).
- The break harness once left a folder inside the repository, because a deliberately broken privacy guard let a test write into a tracked folder; the test now cleans up after itself in a `finally` block (commit `2935aab`).
- The documented test command, `node --test <directory>`, would recurse into every file on Node 20 and run the command-line program and the broken stand-ins as tests. It is now an explicit `*.test.mjs` glob (commit `a74396f`). Node 20 was not installed here; with the author's permission it was later fetched through `npx`, and the whole suite and the sample run were run under it (see entry 10).

**9. The predictions, scored (2026-09-30)**
- Recorded in `course/2026fa/submissions/aravindkumar2504/worked-run.md`: P1 (title errors) partly right, with different specifics than predicted; P2 (timeline gate inert today) right; P3 (pool size in 60 to 160) right, but the claim that fewer than half reach the top tier was wrong (49 of the 65 discovered companies, 75 percent, are Proven); P4 (a poor hiring target in the top 15) right (a very large old company appears as "recently funded").

**10. An independent review, and what it changed (2026-09-30)**
- *Tried:* before handing anything to the author, the assistant launched a second, read-only assistant task (no edit rights) to audit the branch for overclaims, number mismatches, privacy, bugs and gaps against the assignment's checklist. That task's report is model output, so each claim was re-checked by the assistant before acting.
- *Happened:* it found real problems, all confirmed. The worst: (a) the first sample-run commit held an absolute path from the assistant's machine (the author's username), and the fix commit did not remove it from history; (b) the assistant's own proposals were worded as the author's (parameters called "author-defined", "hand-labelled", "reviews the results", a sign-off described as recorded); (c) "same inputs, same bytes" was false for the scorer's own two files, which carry a date stamp; (d) the privacy guard covered only real personas, so a sample run could overwrite any tracked file and a private watchlist was accepted; (e) the title-list reader dropped the backslash in escapes such as a non-breaking space (526 matching-title records, not 525); (f) the deliberate-break harness counted each failing test twice; (g) the report blamed "thin evidence" for Likely companies that the timeline had demoted; (h) the recipe lacked the timeline formula and claimed RUNNABLE-SAMPLE while the repository's four other RUNNABLE-SAMPLE recipes have zero open TODOs.
- *Did:* fixed each with a test (commit `df52802`), regenerated the sample run (commit `e24059f`), redrew and relabelled the title check because the parser fix changed the title population by one (commit `bcaf960`), and re-cut the local history to remove the path before anything was pushed. A recovery tag held the old commits until the rewrite was checked to be lossless (the tips' trees are identical; only `run-log.json` differed in the four commits that held the path), and was then deleted; unreachable copies of the old commits remain in the local object store until garbage collection and are never pushed. Commit hashes after `7d17e5a` changed because of that re-cut; this log and the test report use the new ones.
- *Also:* with the author's permission, Node 20 was fetched through `npx` and the whole suite (69 tests) and the sample command were run under it: all passed, and the sample run wrote the same bytes.
- *Contributions:* the review, the checks and every fix were the assistant's. The author chose to review the work before anything is pushed.
- *Still open from the review:* the RUNNABLE-SAMPLE claim with nine open TODOs is the author's decision (the recipe says plainly that it is the weaker claim); the author's own entries below are a short draft with few checks of their own in it; the parameters are unconfirmed.

**11. What is still open (2026-09-30)**
- No posting has been checked (gates H1 and H2); nobody has signed the adequacy of the sample run; the title rule is checked on only 80 titles by one labeller; the meaning of the even counts is unknown; a very large enterprise-software company shows only 2 reported approvals, which suggests the counts under-represent companies whose names join imperfectly (an inference, not verified against filings).

## Evidence for the entries

Commits, after the local history was re-cut (the first five are unchanged): `a3af489` (change brief), `ec60e45` (its revision), `3cb586c` (fictional persona), `4ae7f38` (prototype and tests), `7d17e5a` (recipe and card), `1096399` (first sample run outputs), `2e0544c` (documents), `2935aab` (self-cleaning privacy-guard test), `a74396f` (test command as a glob), `d8d7e0c` (relative paths in the run log), `d257453` (first worked run and test report), `df52802` (review fixes), `e24059f` (sample run regenerated), `bcaf960` (title check redrawn). Outputs: `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/`. The test report and worked run hold the pasted terminal output.

## The author's own entries

*The assistant drafted this section at my request, in my voice, using only what I did and said in this session. It is short because I have not done many checks myself yet, and it says so where that is the case. I can change any line that is not true.*

*(Retrospective: written on 2026-09-30, after the work was built. No times are claimed.)*

**Getting into the assignment page**
- I asked the assistant to open my Canvas assignment page. It could not get past the login.
- I tried the Claude in Chrome extension next, because I had already signed in there. It said my organization's role does not include that feature.
- So I signed in inside the built-in browser and told the assistant to go ahead. Then I asked if it could open every link on the page. It could, except it cannot watch the video.
- The assistant's side of this is in entries 1 and 2.

**The AI policy**
- I read or watched the course AI policy myself. I told the assistant there was no need for it to read the policy, so it did not.
- Because of that, the reviews of the work did not check it against the policy's rules. I decided not to have the assistant read the policy now.

**What I chose, and what I left to the assistant**
- The assistant suggested three recipe ideas, gave reasons, and recommended one. I picked that one: pre-OPT backend sponsor tiers.
- I said no to a "co-authored by Claude" line on the commits and to a "generated with Claude Code" line on the pull request. The AI help is written down in SOURCES.md, in this log and in the README instead.
- I said yes to two downloads: a browser for the posting-liveness check, and Node 20 so the tests could run on the version the repo's automatic checks use.
- I left the coding, the tests, the runs and the first drafts of every document to the assistant.
- When the assistant asked whether to push and open the pull request, I said not yet. I want to review first.
- After that I asked for another full review against the assignment's requirements, and I asked the assistant to draft this section and to fill in the time estimate in the domain justification. For that estimate I gave one number: I guess it takes me about 5 minutes to check one company by hand. I have not timed it.

**What I checked myself, and what I found**
- Not much yet. I have not read the code line by line. I have not compared any number in the report with the source data myself.
- All the checking so far was the assistant's: the tests, the deliberate breaks, a comparison with the raw data file, and the independent reviews (entries 8 and 10).

**What I accepted, changed or rejected**
- Accepted: the assistant's recommended recipe and plan. I have not yet reviewed most of what it built, so for now I am accepting that work by default, not because I checked it.
- Changed: the default on attribution (no trailer or footer, see above).
- Rejected: nothing in the assistant's work so far. I have not changed a line of its code, numbers or wording myself.
- Skipped: having the assistant read the AI policy.

**What I understand now, and what I still do not understand**
- The idea, as the assistant explained it: the program looks each company up in the visa data, gives it a tier, checks my dates against the work-permit clock, and stops at two things a person has to do (is the posting live, and does it hide a trap). I have not tested myself on that yet.
- I have not read the timeline code, so I cannot explain the formula on my own yet.
- I do not know why every approval and denial count in the data is even. The assistant flagged it and does not know either.

**Evidence and my next step**
- Evidence: my messages in this session, and entries 1, 2, 7 and 10 above.
- Next: I review the work myself before I push. The checklist for that is in STUDY-NOTES.md: read the report, compare one company with the data, read the timeline code, confirm the thresholds, decide what stage the recipe claims, and try one deliberate break.
