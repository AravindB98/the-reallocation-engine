# FRICTIONAL — honest work log

Drafted by Claude (chat) from our conversation log; reviewed and edited by Nishant.
Format per entry: tried → expected → happened → response → learned.
Contributions are marked **[me]** (Nishant), **[Claude chat]**, or **[Claude Code]**.

## 2026-10-02 — Setup

1. Fork, clone, first directory
- **Tried:** Forked nikbearbrown/the-reallocation-engine to Nishant2681 [me]. Ran `mkdir -p course/2026fa/submissions/nishant2681/runs` in Windows cmd (command suggested by Claude chat).
- **Happened:** cmd error "The syntax of the command is incorrect."
- **Response:** Claude chat explained cmd doesn't support `-p` and uses backslashes. I re-ran with backslash paths and it worked.
- **Learned:** The repo assumes a bash shell. I moved to Git Bash for everything after this.

2. Baseline verify failed in cmd
- **Tried:** `npm run doctor` and `npm run verify` in cmd, with output saved to `baseline-doctor.txt` and `baseline-verify.txt`.
- **Expected:** both pass on a fresh clone.
- **Happened:** doctor passed (Node v22.17.1, Python 3.12.10). verify failed: 4 `.sh` files failed conformance with "...operable program or batch file", so manifest-check never ran.
- **Response:** Claude chat diagnosed it: conformance runs `bash -n` on `.sh` files, and cmd has no bash. Re-ran in Git Bash, and conformance passed.
- **Trace:** `baseline-verify.txt` (cmd failure, kept as the "before" record).

3. manifest-check: 6 "out of sync" errors (CRLF)
- **Happened:** In Git Bash, manifest-check failed with 6 E3 errors (CLAUDE.md, AGENTS.md, etc. "out of sync with instructions/").
- **Response:** Claude chat suspected Windows CRLF line endings. **I chose not to run the suggested `build-instructions.mjs --promote`** because it would edit tracked files outside my namespace. I confirmed the cause first: `git config core.autocrlf` → `true`, and `file CLAUDE.md` → "with CRLF line terminators". Fix: `git config core.autocrlf false`, `git rm -rq --cached .`, `git reset --hard`. Re-check: `file CLAUDE.md` showed no CRLF, and `npm run verify` passed with 3 warnings.
- **Learned:** On Windows, Git's line-ending conversion can break checks that compare files byte-for-byte. Verify the cause before applying a fix.
- **Trace:** `baseline-verify-gitbash.txt`.

4. W2 private-path warnings
- **Happened:** manifest-check warned that `private/` and `data/ats/` were "not gitignored (PII/secret risk)".
- **Checked [me]:** `git check-ignore -v private/test.txt data/ats/test.txt` → ignored by `.gitignore:37 /private/*` and `.gitignore:40 /data/ats/*`.
- **Conclusion:** false positive. The checker looks for the literal text `private/`. I did not edit `.gitignore` (outside my namespace).
- **Unresolved:** whether to report this checker behavior upstream.

5. Branch mix-up and rename
- **Happened:** I thought I had created my branch in cmd, but `git branch` in Git Bash showed only `main`.
- **Response:** Created it with `git checkout -b contrib/2026fa-nishant2681-ds-opt-h1b-15-2051`. Later renamed it to `contrib/2026fa-nishant2681-data-analytics-opt-h1b` (see entry 8).
- **Learned:** Check `git branch` instead of assuming a command worked.

6. First scorer run
- **Ran:** `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/nishant2681/runs`
- **Saw:** 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%).
- **Noticed:** the assignment says a healthy run skips at least half; the repo's own example skips 40%.
- **Trace:** `runs/role-scores.json`, `runs/role-scores.md`.

## 2026-10-02 — Exploring the data

7. The 80 Days CSV
- **Ran:** `head` on `mapped_student_employment_targets_v3.csv`, then Python CSV checks (written by Claude chat, run by me).
- **Saw:** 30,369 companies; only 1,557 have H-1B records (~5%); 237 sponsor a title containing "data". No SOC column. Blank H-1B fields mean "no record", not zero.
- **Noticed:** substring "data" is too loose. It matched "Senior Data Engineer", "Software Data Architect", and "Business Analyst Manager - Data Distribution Team".
- **Small defect:** the CSV folder README names the file `mapped_student_employment_targets.csv`; the real file is `..._v3.csv`.

8. Target title list (my decision)
- **Claude chat proposed:** Data Scientist, Data Analyst, Machine Learning Engineer, Analytics Engineer, Data Engineer.
- **I added:** Business Analyst, Business Intelligence, Automation Analyst, based on my own analyst background.
- **Result:** 260 unique sponsoring companies match. Automation Analyst = 0 matches, which means it's absent from top-title lists, not proof that no one sponsors it. All titles parsed (0 failures).
- **Consequence:** the list now spans several SOC codes, so I renamed the slug from `ds-opt-h1b-15-2051` to `data-analytics-opt-h1b` to avoid overclaiming.

## 2026-10-02 — Repo review with Claude Code

9. Read-only repo review
- **Did:** Claude Code read the governing docs, scorer, and conformance script (read-only), then saved its findings to `notes/01-repo-findings.md`.
- **Key surprises:** the scorer has no funding term; no script turns H-1B data into sponsorship p/tier; missing votes aren't renormalized (so fit is required); only persona Priya Nair avoids the profile trap; liveness needs the network; the scorer runs on import, so it must be called as a CLI.
- **Repo defects found [Claude Code]:** persona files describe a sponsorship field the scorer never reads; doctor doesn't scan `recipes/cases/`; docs point to `chapters/` but the folder is `book/chapters/`; `_shared.md` says to log in RUN_LOG.md, which students may not touch.
- **I skimmed notes/01-repo-findings.md myself before committing it.**

10. Design decisions
- **Claude chat proposed** the sponsorship tier/p rule, funding as context only, fit as your-input, the liveness mapping, and the timeline rule. **I accepted all five.**
- **I decided:** hiring lag set per role (default 12 weeks).

11. Two proposals were wrong; corrected before first commit
- **Approval rate:** Claude chat proposed ≥ 0.90. Claude Code found `Approval_Rate` is on a 0–100 scale (min 0, max 100). Corrected to ≥ 90.
- **Timeline:** Claude chat proposed deadline = OPT start + 90 days. Claude Code showed this zeroed every role for Priya. Claude chat then corrected the rule: the 90 unemployment days are cumulative, so deadline = today + (90 − days used). Even corrected, a 12-week lag fails for Priya (56 days left). This is a real finding, which is why I chose a per-role lag.
- **Learned:** AI proposals need checking against the actual data. Both errors were caught by running against the real CSV and profile.

## 2026-10-02 — My own data checks and prediction

12. Wayfair and Deloitte
- **Ran [me]:** `grep -i "wayfair"` on the CSV → no output. Wayfair is absent.
- **Ran [me]:** `grep -ic "deloitte"` → 7. Then printed the company names: 7 separate legal entities.
- **Claude chat mistake:** suggested `cut -d, -f1,16,17` to show approvals. The output showed officer names instead of numbers, because `cut` splits on commas inside quoted fields. **I noticed the output was wrong.** Re-ran with Python's CSV parser.
- **Saw:** Deloitte Consulting LLP 8,810 approvals; Deloitte Financial Advisory blank; Deloitte LLP 26; the Tohmatsu Services INC and LLC rows have identical numbers (242 / 2).
- **Cross-checked [Claude Code]:** Claude Code independently re-checked my Wayfair/Deloitte figures against the CSV and confirmed that none of Deloitte Consulting's sponsored titles match my target titles, so it does come out Possible, as I predicted.
- **Learned:** the prototype must use a real CSV parser, and must stop on multi-entity matches rather than picking one. Added this as a failure case in CHANGE-BRIEF.
- **Unresolved:** why the two Tohmatsu rows are identical (duplicate join?).

13. Writing my prediction
- **Honest note:** I asked Claude chat to write my prediction. It declined to write it as if it were mine, and instead drafted it with a disclosure label ("Claude helped me word the conclusion; I reviewed it") based on my own grep results. I reviewed it and kept the label.
- **Trace:** CHANGE-BRIEF.md §7.

14. Change brief committed
- Commit `43020cf`: CHANGE-BRIEF.md, notes/01-repo-findings.md, baseline files, and the example run. Predictions were recorded before any prototype code.

15. Recipe and card. Claude Code wrote both in plan mode; I reviewed the plan and approved each file. My instruction said status SPECIFIED, but Claude Code found SPECIFIED requires zero open TODOs, so I chose DRAFT (16 TODOs). Chose to label liveness by evidence: record only when backed by saved ats:liveness output. Checked the overlap with case-data-ml-h1b-triage.md (a generic scaffold) and kept my narrower scope. Left the threshold reasoning and the strong-fit cutoff for myself to write.

## Open questions
- Should the timeline rule read `unemployment_ceiling` and `buffer_target` from the profile instead of constants?
- Does title matching unfairly under-rate large consulting firms (Deloitte Consulting → Possible)?
- Report the W2 false positive and the doc defects upstream?

16. Claude Code built sponsorship.py plus 13 tests (all pass). Found a gap (title match + 0 approvals fits no tier); I decided it raises an error (0 real rows). Independent check: Proven + Likely = 260, matching my own earlier count. Found suspicious Deloitte 'Series C' funding in the CSV, likely a bad join, so funding stays context only. Known limit: apostrophes ('Macy's').

17. Claude Code built gates.py plus 18 tests (31 total, all pass). I approved three behaviors: null OPT end date = not known; whole-week lags only, because fractional days silently shift dates; exact lowercase liveness labels. Read the ceiling from the profile instead of hard-coding 90. Full pii-scan fails on a pre-existing npm email in package-lock.json, not from my branch.

18. Claude Code built run_sample.py, report.py and 11 end-to-end tests (42 total, all pass). Real run on the full CSV: Apply 1 / Consider 4 / Skip 3. Skip rate 38%, below the healthy 50%; chose not to tune fixtures. Bug in sample-1 (provenance pointed to a deleted staging path) was fixed; re-ran as sample-2 and kept sample-1 as a record. All liveness values are your-input (fixture), none are record yet. Kept Deloitte and Wayfair as deliberate stress tests.

19. Running the engine's own tools (ats:scan, ats:liveness)
- **ats:scan --dry-run:** failed: "portals.yml not found. Run onboarding first." Fresh-clone gap; my recipe doesn't use scan.
- **ats:liveness:** first failed (Playwright browser missing); fixed with `npx playwright install chromium`.
- **Test 1:** real open TouchCare posting on Greenhouse (`job-boards.greenhouse.io/touchcare/jobs/4393220009`) → **active** (saved output, so it counts as record).
- **TouchCare in the CSV?** `grep -ic "touchcare"` → 0. The posting is live, but the dataset has no record of the company, so the prototype could only rate it Unknown.
- **Test 2 (break attempt):** known-closed posting on a VC job board → **uncertain** (page couldn't load). Uncertain means unreadable, so a human must check it.
- **Test 3:** nonexistent job ID on Greenhouse (simulates a removed posting) → **expired**, via a redirect to `?error=true`.
- **Learned:** the checker is reliable on supported ATS links; anything uncertain needs a human look.
- **Also found:** "Affinity Solutions" searches return a different company, Affinity (affinity.co), so there's a name-collision risk.
- **Help:** Claude chat suggested the commands; I chose the URLs and ran every check myself.
- **Trace:** `engine-runs/` (5 output files).

20. Recipe, card and brief updated after the build
- Claude Code (plan mode) closed 10 TODOs only where evidence existed (code, tests, sample-2 run); 6 stay open: 3 human gate sign-offs, the missing-input-file test, funding fold, and a second sponsorship source.
- **I chose** to keep harness TODO #6 open because one failure case (missing input file) has no test, and to supply reasoning for the Likely cutoff and p values instead of leaving #9 half-closed.
- Threshold, liveness and STRONG_FIT reasoning: drafted by Claude chat, reviewed by me, quoted exactly and labeled in the recipe.
- Claude Code verified ch11-roles.json really uses p 0.9 / 0.6 before quoting my claim, and restored [VERIFY] tags so the quote stays true.
- Wayfair: I knew from experience that it sponsors; Claude chat confirmed it with DOL/USCIS-based sites. It's missing because the CSV is built from Form D filers.
- Added to the brief's 8: prediction checks (3 confirmed, 1 resolved by the matcher, 1 not exercised), new findings, and open questions.

21. Added 3 tests proving a missing jobs/profile/CSV file stops the run with exit 2, names the file, and writes nothing. No code change needed. Claude Code found that on Windows Python shows paths with doubled backslashes, so the tests check repr(path). Closed TODO #6; 5 TODOs open.

22. Reviewed the gate evidence myself: the Deloitte entity pick, liveness labels in report.md, and Priya's deadline recomputed by hand (Oct 2 + 56 days = Nov 27). Claude Code wrote the run log with my sign-offs. Chose to sign with my GitHub handle, not my full name, after Claude Code flagged that my name next to the brief's visa description would publicly link the two. 2 TODOs open; status stays DRAFT

23. Fresh-clone test run (TEST-REPORT)
- **Did [me]:** cloned my branch into ~/fresh-check with core.autocrlf=false, ran npm install, then ran doctor, verify, all tests, the sample run, 4 failure cases, diff-stat and PII scans, saving every output to test-report-evidence/.
- **Result:** verify exit 0; 45/45 tests pass; sample run Apply 1 / Consider 4 / Skip 3, identical to sample-2; all 4 failure cases stop with exit 2 and write nothing; diff-stat shows 45 files, all in my namespaces.
- **Friction:** my paste got garbled at test 08 and froze the terminal, so I re-ran it. `node` in a pipe gave "stdout is not a tty", so I used `node.exe`. npm install warns about deprecated glob and 3 vulnerabilities in existing dependencies; I didn't run `npm audit fix` because it would change package-lock.json outside my namespace.
- **Finding:** the first doctor run showed 0/33 recipes with frontmatter, the fresh clone 33/33. Claude Code traced it to doctor's frontmatter check failing on CRLF lines, so my first baseline misreported the repo.
- **Honest gaps:** Claude Code flagged claims with no saved evidence (the E3 errors, git check-ignore). 00-terminal-history.txt was assembled by Claude chat from my pasted terminal output, with redactions; I reviewed it.
- **PII mistake caught:** Claude chat first said the scan result file was fine to commit with the npm email in it. I questioned that, and it was wrong: the CI scan only checks committed lines, so committing it would have failed my PR. I redacted the email in every file, committed, then re-ran `pii-scan --diff origin/main`: clean.
- **Help:** Claude chat wrote the command blocks; Claude Code wrote TEST-REPORT.md from my saved files without re-running anything.

24. Domain justification
- **Time estimate:** I asked Claude chat to research job-search time numbers. It found a 2026 survey (~44 min/application), CareerBuilder 2016 (64% research first), and a secondhand Interstride figure (~40% extra time for international students), and labeled which were weaker. I replaced the 44 min with my own 25–30 min per application.
- **Result:** ~1.5–2 h/week saved (computed range 1.25–2.3 h), labeled as an estimate, not measured; possible extra saving from Skip roles not counted.
- **Drafting:** Claude Code drafted the page from my brief, recipe and run results, cut it to about one page, and kept every source label; I reviewed it.

25. Worked run and attestation
- **Hand check [me]:** looked up Affinity Solutions, Adept ID and Deloitte Consulting in the real CSV and compared them with report.md: approvals, denials and rates all match (Deloitte's 97.54 rounds to 97.5), and the tiers follow my rules. Recomputed Affinity's score by hand: 0.9×0.35 + 0.8×0.3 = 0.555.
- **New finding:** tiers are per company, not per job. Adept ID is "Likely" for a Data Analyst job only because it once sponsored a "Research Data Scientist". And Deloitte Consulting would be Proven by its numbers (8,810 approvals, 97.5%), but generic titles demote it to Possible.
- **Drafting:** Claude Code wrote WORKED-RUN.md by inserting my saved evidence verbatim (it checked all 11 pasted blocks match their sources). The reflection was drafted by Claude Code and reviewed by me; I signed the attestation as nishant2681.
- **Correction:** Claude Code noticed TEST-REPORT called the bracketed notes in 00-terminal-history.txt "my notes". Claude chat had written them, so I had that fixed in 4 places.
- **PII:** re-ran the CI-mode scan after committing everything: clean, exit 0; saved as 12-pii-scan-diff-after-commit.txt.

26. How the work was split overall
- **Claude chat:** explained the assignment in plain terms, planned the steps one at a time, wrote every Claude Code prompt and Git Bash command block, and reviewed Claude Code's plans and outputs with me before I approved them.
- **Claude Code:** wrote the brief, recipe, card, prototype, tests, run log, TEST-REPORT, WORKED-RUN, DOMAIN-JUSTIFICATION and SOURCES from my decisions, in plan mode for recipes/ edits, with manual approval of each file.
- **Me:** approved or changed every plan and edit before it was written, made the design decisions recorded in entries 8, 10, 11, 15, 20 and 22, and ran every evidence command myself.
- **Wayfair sources (entry 20):** the sites Claude chat found were ellis.com, layoffhedge.com and f1jobs.io, aggregators of DOL LCA / USCIS data. I didn't check the government files directly.

27. Removing my personal email from commit history
- **Problem:** my first 3 commits had my personal Gmail as author/committer. Claude Code noticed it; CI's PII scan doesn't check commit headers, but GitHub would show it publicly once pushed.
- **Fix [me]:** set my repo email to my GitHub noreply address, made a backup branch, then re-stamped all 22 commits with `git rebase --exec "git commit --amend --no-edit --reset-author"` before pushing anything. Checked: every commit now shows only the noreply address.
- **Side effect:** every commit ID changed. COMMIT-ID-MAP.md maps old IDs (cited in FRICTIONAL, the brief and the recipe) to new ones; I checked that the commit messages line up one-to-one.
- **Help:** Claude chat wrote the commands; I ran and checked them.