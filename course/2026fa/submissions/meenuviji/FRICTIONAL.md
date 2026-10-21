# FRICTIONAL — data-titles-h1b-entry

Honest log of attempts, expectations, what happened, and what I checked. Human vs AI contributions are marked. Lines marked **ME (Meena):** record my own answers, given to Claude in chat and written into this file by Claude in my words.

## 2026-10-03 — Phase 0: setup and recon

- **Tried:** Forked `nikbearbrown/the-reallocation-engine` to `meenuviji/the-reallocation-engine`. Through Claude Code I cloned it, created a branch, and ran `npm install`, `npm run doctor`, `npm run verify`, `npm run ats:scan -- --dry-run`, and `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score`. Raw output: `course/2026fa/submissions/meenuviji/recon/raw-output.txt`.
- **Expected:** ME (Meena): some failures.
- **Happened:** `doctor` passed. `score` reproduced the Ch.11 example (Apply 2 · Consider 1 · Skip 2) and wrote only under `--out-dir`. `verify` failed with `ModuleNotFoundError: No module named 'yaml'` (system python3 3.9.6). `ats:scan` failed with `portals.yml not found`.
- **Response:** Installed PyYAML 6.0.3 for system python3. Confirmed `data/ats/portals.yml` is gitignored (`.gitignore:40: /data/ats/*`) before copying `portals.example.yml` to it. After that, `verify` passed with 3 warnings and `ats:scan --dry-run` exited 0.
- **Surprise:** `ats:scan --dry-run` still made live network calls. It fetched 886 Databricks jobs and filtered them to 61. "Dry run" only means no files are written. Consequence: ATS scanning cannot be part of my offline path or tests.
- **Checked:** `verify` warned that `private/` and `data/ats/` were not gitignored. `git check-ignore -v` showed `private/`, `search/resume.json` and `data/ats/` ARE ignored. The warning comes from `scripts/manifest-check.mjs` lines 74–101, which text-match folder names and don't recognise the `/folder/*` pattern. `archive/` is genuinely not ignored, so I will never put anything there. I did not edit `.gitignore` or the script, because both are shared files outside my namespace.
- **Doc vs reality, found in recon:** Recipes reference `SEC_DOL_H1b_data_mapped.csv`, which does not exist. The same bytes (matching SHA-256) ship as `mapped_student_employment_targets_v3.csv`. DOMAIN.md recipe counts (42 / 518) don't match `doctor` (33 / 318). The scorer's own example skips 40%, below the "healthy run skips at least half" norm.
- **AI vs me:**
  - Claude Code ran the commands and wrote `REALITY-REPORT.md`.
  - Claude Code noticed that `exit: 0` from `git check-ignore` only meant at least one path matched, not all four.
  - Claude (chat) had assumed I was on Windows from an earlier project. The recon showed macOS, so the Windows guidance was dropped.
  - ME (Meena): I verified the CSV myself and read the files the report cited.

## 2026-10-03 — Phase 1: domain choice and probe

- **My situation (input to the domain choice):** MS Data Analytics, F-1, pre-OPT, will need H-1B sponsorship later. Target titles: data analyst, data engineer, BI analyst, data scientist, AI engineer, data and AI engineer.
- **Pushback received:** Six titles reads as "job-seeker in tech". The suggested resolution was to make the breadth itself the asymmetry: which titles, at which level, has each company actually sponsored?
- **Prediction before probe:** ME (Meena): I had no guess before seeing the result.
- **Result** (`course/2026fa/submissions/meenuviji/recon/probe/PROBE-REPORT.md`):
  - All 1,557 title lists parsed. They are up to 14 entries long, with 44 companies over 5, so the lists are not a strict top-5. Their completeness still can't be verified.
  - 421 companies have ≥1 data-family title. 171 have only senior data-family titles; 250 have ≥1 non-senior one. These counts are under a temporary keyword rule.
  - 68 of 421 show a 100% approval rate on ≤3 approvals. The median is 22 approvals.
  - 128 of 200 Form D sample records are pooled investment funds. 14 normalized name matches; only Databricks has sponsorship data.
  - BLS: 16 keyword rows, but only 7 match in the title field itself.
- **Errors in the temporary rule (from the hand-check sample):** Too broad: it caught Financial, Actuarial, IT Service Management, Product Support and QC analysts, and Database Administrators. It counts "II" as senior. It misses numeric levels such as "Professional 3".
- **AI vs me:**
  - Claude (chat) proposed the `data-titles-h1b-entry` domain and wrote the probe spec.
  - Claude Code changed my suffix-stripping spec to strip suffix words before removing punctuation, citing the repo's own normalizer at `sec-all-quarters.py:34`, to avoid "COSTCO" becoming "cost".
  - ME (Meena): I checked the COSTCO normalization claim and accepted it.
  - ME (Meena): I agreed with the domain choice.
- **Friction:** `code` wasn't on my PATH, so I opened files with `open -e` (TextEdit).

## 2026-10-03 — Phase 2: CHANGE-BRIEF

- **Commit:** ME (Meena): 53cc80a. CHANGE-BRIEF is committed alone, before any prototype code.
- **AI vs me:**
  - I asked Claude (chat) to complete the CHANGE-BRIEF skeleton rather than writing it myself. Claude drafted the full brief from the recon and probe reports.
  - Claude's advice was to rewrite §9 (predictions) in my own words and to check the §5 design choices (≥5 approvals cutoff, p = 0.7 / 0.5 / 0.3, "unmarked = entry") before committing.
  - ME (Meena): I did not change anything. I kept the brief as drafted, including the ≥5 approvals cutoff, p = 0.7 / 0.5 / 0.3, and "unmarked = entry". §9 was not rewritten; the predictions in it are Claude's draft, which I accepted.
- **I also asked Claude to draft this FRICTIONAL file** from the conversation record. Claude filled in only facts it could see in the session (commands, outputs, report numbers), then asked me about my expectations, checks and decisions and recorded my answers as **ME (Meena):** lines.
- **Open questions:**
  - Does a null `p` get dropped by the scorer, as REALITY-REPORT §2 says? I haven't tested it yet. This is planned as an offline test.
  - ME (Meena): no other open questions at this point.
## 2026-10-03 — Phase 2 fix: CHANGE-BRIEF formatting

- **Happened:** The first commit (53cc80a) contained CHANGE-BRIEF copied from the rendered artifact page, which stripped all markdown: 0 headers, broken tables.
- **Caught by:** Claude (chat) noticed the commit had 104 lines vs 135 in the draft; I ran grep and confirmed 0 headers.
- **Response:** Replaced the file with the raw markdown download and committed the fix as 3f1182e. Content unchanged; still before any prototype code.
- **Learned:** Copy raw files, not rendered pages.

## 2026-10-03 — Phase 3a: prototype plan

- **Tried:** Claude Code read the scorer, the data, and my CHANGE-BRIEF, then wrote `course/2026fa/submissions/meenuviji/recon/PROTOTYPE-PLAN.md` before any code.
- **Found by the plan:**
  - 213 normalized company names are shared by 427 rows.
  - With the sponsorship vote dropped (null p), fit ≥ 0.67 alone still reaches Consider.
  - `role-scorer.mjs` exports nothing, although CONTRIBUTING.md says harnesses may import from it.
  - `applyProfile` zeroes the sponsorship weight when `authorization` contains "authorized", so a profile saying "not authorized" would silently switch sponsorship off.
  - Only 2 of my target titles have a BLS title row.
- **AI vs me:**
  - The plan asked me 15 questions. Claude (chat) recommended answers to those 15 plus two more (Q16 fit held at 0.5; Q17 liveness assumed).
  - ME (Meena): I accepted all 17 recommendations without changing them.
  - Claude Code's Q14 reported my branch as still named `-recon`, but I had already renamed it. The AI was reporting outdated state.

## 2026-10-03 — Phase 3b: build and first review

- **Happened:** Claude Code built the prototype: 18 tests passing, exit 3 on the planted stops. On its own initiative it changed output paths to repo-relative so my Mac username wouldn't appear in `run.json` or `report.md`.
- **Problems found in review** (Claude chat reviewing Claude Code's output):
  - **The timeline rule was wrong.** It treated a start before my OPT window as a failure. Claude Code had to invent a future `as_of` (2027-04-15) to get any non-gated result. This was a design error in the CHANGE-BRIEF, which Claude (chat) drafted.
  - **Sampling 2 per tier** hid the thin-evidence (approval-rate) and only-mid cases.
  - **The persona reference contradicted the run.** Priya Nair is already on OPT; my situation is pre-OPT.
  - **ENTRUPY** reached Proven on a sponsored "Data Engineer" title while the posting was "Machine Learning Engineer I".
- **Checked:** `git fetch upstream` showed no new commits, so the scorer is current. The PR #37 fix mentioned in `search/examples/README.md` is not in the scorer; this is a documentation inconsistency.
- **Response (Revision 1, commit 47a5b79):**
  - Early start becomes a deferred start; only a late start fails.
  - `as_of` is the real run date.
  - `opt_start` is 2027-02-01, from my stated Feb–Mar 2027 start (the earlier date is the stricter test).
  - The sample is drawn per evidence group.
  - The Priya reference is removed.
  - A title-family note is added.
- **Second review:** 8 of 12 postings landed in Consider, all with the same advice. I did NOT tune the p values to raise the skip rate, because that would be adjusting rules to the outcome. Instead, next actions now depend on the evidence group, the deferred-start note is shown once, population shares are reported (94.9% of CSV companies have no record), and a duplicate-evidence note was added.
- **Found by Claude Code:** PATHAI INC (Cambridge, MA) and PATHRAI INC (Mountain View, CA) carry identical sponsorship evidence under different names.
- **Test change:** Claude Code changed `test_exact_match_with_siblings_is_noted_not_stopped` when the deferred-start notes were added. It now asserts exactly one note of type `sibling-rows` instead of exactly one note in total.
  - ME (Meena): I read the current test and agreed it is not a loosening. The change happened before my first prototype commit, so git has no before/after diff of it.
- **Commits:** prototype e93e817; Revision 2 headline counts (248 / 94 / 39) 631acbe.

## 2026-10-03 — Phase 4: recipe and card

- **Status conflict:**
  - Claude (chat) told Claude Code to set `status: RUNNABLE-SAMPLE`.
  - Claude Code flagged that SNICKERDOODLE.md requires zero open TODOs even for SPECIFIED.
  - A lifecycle check showed all 14 earlier case recipes are DRAFT, and every RUNNABLE-SAMPLE recipe has 0 TODOs and a dated `last_gate`.
  - ME (Meena): I chose DRAFT.
- **AI corrected AI:** Claude (chat) wrote "four proposed additions remain open." Claude Code corrected this to seven open TODOs (six proposed additions plus the approval gate), and dropped the brackets so the sentence didn't create an eighth `[TODO` marker.
- **Verify section revised:**
  - **Recency added first.** Claude Code checked five places and found no year or date range on the approval/denial counts.
  - **The day-08 README** says the original CSV join used RapidFuzz fuzzy matching. That is a plausible cause of the PATHAI/PATHRAI duplicate; it is an inference, not verified.
- **Claude Code behavior worth noting:**
  - It refused to rerun `build_sample.py --force`, so the frozen sample was kept.
  - It restored `out/report.md` and `out/run.json` after a check run rewrote their timestamps.
- **Commit:** recipe + card 4a4074e.

## 2026-10-03 — Phase 5: fresh-clone test

- **Happened:** A fresh clone at 4a4074e passed doctor, verify (before and after), the default run (exit 3), 28/28 tests, conformance, and the scope diff (all paths in my namespaces).
- **PII:**
  - The full-tree `pii-scan` exits 1 on a third-party email in `package-lock.json`, which is on `origin/main` and not changed by my branch.
  - `--diff origin/main` is clean.
  - My untracked `recon/raw-output.txt` contained the same address and was redacted, with a note, before committing.
  - Claude Code redacted the address in TEST-REPORT.md and disclosed that it had done so.
- **Side effect:** `run.py` rewrites the timestamps in tracked `out/` files on every run. This is documented, not fixed.

## 2026-10-03 — Phase 6: my own checks, worked run, run log

- **ME (Meena):** I ran the ROKU INC cross-check against the raw CSV myself in Terminal. 654 approvals and 4 denials match the report; the data-family titles are Senior Data Scientist and Senior Data Engineer, so only-senior is confirmed.
- **ME (Meena):** I ran two break attempts myself.
  - Misspelling the company as `R0KU INC` stopped at the company-match gate (no-match, exit 3).
  - Removing ROKU's liveness refused the role instead of scoring it as 1.0.
- Output saved in `recon/hand-checks.txt`.
- **Honest gap:** I did not write predictions before running these checks. The attestation's Expected column cites the specified behavior (CHANGE-BRIEF §8, recipe gates), not a prediction of mine.
- **AI vs me:**
  - The worked run was assembled by Claude Code from source files.
  - The reflection text is mine. Claude (chat) pushed back that location checks would not have caught PATHAI/PATHRAI (their cities differ) and added one sentence linking to the CSV-wide duplicate-scan TODO.
  - The domain justification was drafted by Claude (chat) from my answers. The estimates (10–15 min per company, 15–20 companies a week) and the failure-mode ranking (the seniority trap worries me most) are mine.
- **Gate decisions (mine, in `logs/runs/2026fa-meenuviji-1.md`):**
  - Arcturus Therapeutics: left unresolved, with no row chosen.
  - Quillfeather: "no match", not confirmed absent.
  - Centific: held and skipped for this run until real liveness is verified.
  - Logging these closed the `[TODO: APPROVE]`, so `todos_open` went from 7 to 6 and `last_gate` was set.

## 2026-10-03 — Gate 3 self-quiz

- ME (Meena): I completed the 22-question self-quiz on the prototype and could answer all the questions.

## 2026-10-03 — What I learned

- ME (Meena): Getting a working result is not enough. I need to understand why a test changed, verify ambiguous evidence myself, and keep missing or uncertain information visible instead of making assumptions to complete the result.

## 2026-10-03 — Final rubric audit

- **Tried:** Asked Claude Code for a read-only audit of every assignment requirement against the files, the PR, and the Canvas ZIP (/tmp/RUBRIC-AUDIT.md, not committed).
- **Found:** All core checks pass (git state, scope, fresh-clone run, 28 tests, conformance, privacy, ZIP identical to the commit). Partial items: one wrong path in CHANGE-BRIEF §4; identifier and metadata fields in run.json without labels; domain justification slightly over the word target; SUBMISSION.md's CI wording out of date. CI on PR #29: two runs ended "failure" with 0 jobs and two await maintainer approval, so none of my code ran in CI.
- **Integrity correction:** SOURCES.md said I committed 53cc80a. Claude Code ran that commit at my instruction; I ran every later commit in Terminal. Corrected in SOURCES.md.
- **Answered open question:** a null sponsorship p is dropped by the scorer, not zero-filled, confirmed by test_null_sponsorship_p_through_real_scorer.
- **Response:** Fixed all partial items in one commit (CHANGE-BRIEF Revision 3, label scope documented, justification trimmed, SOURCES corrected), rebuilt the ZIP and SUBMISSION.md for the new SHA, and asked the maintainer on the PR to approve CI.

- **Correction (same day):** I decided not to post the PR comment asking the maintainer to approve CI. The "Response" line above saying I asked is therefore incorrect; CI approval is left to the maintainer's normal process.

## 2026-10-19 — PR switch: #29 closed, #56 opened

- **Tried:** Moved the submission onto a branch with the name the assignment asks for (`mode/<yourname>-<domain>`). Through Claude Code I created `enhance/data-titles-h1b-entry` from the contrib branch and renamed it to `mode/meenuviji-data-titles-h1b-entry`. I then committed the new read-only upstream recon report (`recon/mode-build-recon.md`, commit 445c522), pushed the branch, ran `npm run verify` and `npm run doctor`, and opened a PR to `nikbearbrown/the-reallocation-engine`.
- **Recon found:** No upstream commits since 015843d. PR #29 was open and unmerged. The assignment's `assignments/submissions/<yourname>/` path does not exist upstream, so the docs stay under `course/2026fa/submissions/meenuviji/`. `doctor` reads only the top level of `recipes/`, so it never checks a case recipe's `todos_open`. I counted it by hand: 6 declared, 6 `[TODO` markers.
- **Checks:** `verify` passed (198 files conform; the same 3 manifest warnings as Phase 0, which also appear on upstream/main). Plain `npm run doctor` always exits 0, so its exit code proves nothing. `npm run doctor -- --strict` reported "no private/PII paths are tracked" and "environment: ✓ runnable", and exited 0.
- **Friction:** The new branch holds every commit from #29 plus one, so a second PR is almost a full duplicate. Claude Code flagged this before opening anything and asked whether to open a new PR or update #29.
- **Decision:** ME (Meena): open the new PR anyway, so that the PR branch follows the assignment's naming. The result is **#56**, titled "data-titles-h1b-entry — DRAFT (prototype runnable on sample data)", which matches the recipe's real status. I then closed #29 with the comment "Superseded by #56".
- **Correction before submit:** The first draft of the PR body said the branch had a `logs/RUN_LOG.md` entry. Claude Code checked the diff, found that RUN_LOG.md is not edited on this branch (the run record is only in `logs/runs/2026fa-meenuviji-1.md`), and fixed the line before the PR was created.
- **Correction after opening (same day):** The #56 description said "`npm run doctor` exits 0, and no private or personal paths are tracked." Plain `doctor` always exits 0, so that exit code showed nothing. Claude Code reran `npm run doctor -- --strict` (exit 0, no private paths tracked) and, with my approval, edited the description to cite the strict run. The same edit added the hook-issues note (see the entry below) and changed "#29 will be closed" to "#29 has been closed".
- **Open issues:**
  - The assignment asks for a `logs/RUN_LOG.md` entry, but the file says students must not edit it and CI rejects PRs that do. The run record is `logs/runs/2026fa-meenuviji-1.md`, as the file directs; the maintainer adds the index row.
  - The `contrib/2026fa-meenuviji-data-titles-h1b-entry` branch was deleted from my fork on 2026-10-19 (every commit is also on the mode branch; tip 57a2015).
  - Review discussion on #29 does not carry over to #56.
  - CI status on #56 checked 2026-10-19: all runs action_required, 0 jobs run.
  - Anything outside the repo that cites #29 (the Canvas ZIP / SUBMISSION.md) still needs updating.
- **AI vs me:**
  - Claude Code ran the git, npm and gh commands I gave it and wrote the recon report.
  - Claude Code drafted the PR title and body and added a `Co-Authored-By: Claude` trailer to commit 445c522.
  - Claude Code wrote this entry.
  - ME (Meena): I chose the branch name, chose to supersede #29 rather than update it, and told Claude Code to close #29.

## 2026-10-19 — Repo hooks never ran: unquoted path and non-executable scripts

- **Tried:** Every Claude Code reply showed a non-blocking hook error. At first it was `/bin/sh: /Users/meenu/Downloads/week: No such file or directory`; after I renamed the folder, it became `conformance-check.sh: Permission denied`.
- **Found:** Two upstream issues.
  - `.claude/settings.json` runs `${CLAUDE_PROJECT_DIR}/.claude/hooks/conformance-check.sh` without quotes, so a path containing spaces is split into separate words.
  - Both `.claude/hooks/archive-guard.sh` and `conformance-check.sh` are committed as mode `100644` (not executable), per `git ls-files -s`.
  - As a result, the repo's automatic hooks had not run on my machine in any earlier phase.
- **Response:**
  - Renamed the parent folder from "week 1 assignment" to `week-1-assignment`.
  - Ran `chmod +x .claude/hooks/*.sh`.
  - Ran the hook by hand with stdin from `/dev/null`: exit code 0.
  - Set `git config core.fileMode false` locally so the mode change is not committed. No tracked file changed.
- **Decision:** ME (Meena): I fixed this on my own machine (folder rename and chmod) instead of editing `.claude/settings.json` or the hook files in this PR, because my PR should contain only my mode, not changes to the repo's shared tooling. I reported both issues in one line in the PR #56 description so the maintainer can fix them upstream.

## 2026-10-21 — Mode build: audit, scorer run, new mode file

- **Tried:** Asked Claude Code for a read-only audit of 21 mode-build requirements against the branch (printed in chat, not committed).
- **Found by the audit (verdict NOT READY):**
  - No new mode file under `recipes/`; the only recipe was the Oct 3 one, which also lacks the reference recipe's Inputs, Steps, Snickerdoodle and Provenance sections.
  - The worked run pasted no output from any of the repo commands the assignment names.
  - No `reallocation-meenuviji-mode.zip`.
  - No `logs/RUN_LOG.md` entry, which `RUN_LOG.md` itself forbids students to add.
  - The reference path in the assignment, `recipes/case-ds-faang-opt-runway.md`, does not exist; the file is at `recipes/cases/2026su/case-ds-faang-opt-runway.md`.
- **Scorer run:** Claude Code read `scripts/score/role-scorer.mjs` before running it. It is offline (imports only `node:fs` and `node:path`), and without `--out-dir` it writes next to its input file, which here would have rewritten the tracked `out/score/` files. It then ran `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run`: exit 0, Apply 2 · Consider 8 · Skip 2. The scored roles and scorer config are identical to the committed Oct 3 output; only the `generated` date differs.
- **Where the run is recorded:** Claude Code first added the run to `WORKED-RUN.md`. ME (Meena): I had it moved to a new `MODE-WORKED-RUN.md` instead, so the Oct 3 worked run stays as it was. The only change kept in `WORKED-RUN.md` removes a stale sentence saying the reflection was not yet written (commit cdd1b9a). Claude Code then added an executive summary to `MODE-WORKED-RUN.md` (dd952e8).
- **New mode file:** `recipes/cases/2026fa/meenuviji-f1-preopt-entry-data-h1b.md` + `.card.md` (cf2797f). `status: DRAFT`, `todos_open: 7` (7 typed `[TODO` markers counted), `last_gate: null`. It follows the reference recipe's sections and uses only commands that exist and have run.
  - ME (Meena): I chose `recipes/cases/2026fa/` over top-level `recipes/`. The assignment says "under `recipes/`", but CONTRIBUTING.md and `recipes/cases/README.md` reserve top-level `recipes/` for maintainer promotion.
  - ME (Meena): I chose the same domain in mode-build form rather than a new situation, and asked for a card.
  - TODO 7 was a new `[TODO: APPROVE]`: my review of the 2026-10-21 runs against the mode's gates. It was closed later the same day (see Open issues).
- **PR #56 description:** with my approval, Claude Code added the new mode file and the mode-build run evidence to "What's in it" and updated the executive summary to cover both recipes.
- **Checks:** `npm run verify` exit 0 and `npm run doctor -- --strict` exit 0 after the new files; every changed path is inside the contrib-gate allowlist.
- **Changed since earlier:** Playwright's Chromium is now installed (`~/Library/Caches/ms-playwright/chromium-1234/`), which the `ats:liveness` break tests (2a0c789) needed. Section 9(b) of `recon/mode-build-recon.md` still says it was missing; that section is a dated snapshot and was left as it is.
- **Open issues:**
  - `reallocation-meenuviji-mode.zip` does not exist yet; it should be built last, from the final commit.
  - The `logs/RUN_LOG.md` entry needs the instructor's ruling.
  - Closed the same day: my review of the 2026-10-21 runs is logged in `logs/runs/2026fa-meenuviji-2.md`, so the mode file's `[TODO: APPROVE]` is closed (`todos_open` 7 → 6, `last_gate` set). The break-test time in that entry is still a placeholder (HH:MM).
  - CI on #56: every run so far is `action_required`, 0 jobs run.
- **AI vs me:**
  - Claude Code ran the audit, read the scorer, ran it, and wrote the mode file, the card and this entry.
  - ME (Meena): I chose the file location, the scope and the card, chose to move the scorer run out of the Oct 3 worked run, and approved each commit, push and PR edit.
