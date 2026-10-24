# FRICTIONAL — what was tried, what happened, who did it

## Executive summary

A plain log of the friction in building and running this mode: what broke, what was surprising, and what was decided and by whom. The biggest surprises came from running real data. The repository's scoring tool gives every occupation code the same score. One occupation code has no published wage anywhere. The posting checker and the employer's own job board disagreed about whether a job was live. The existing wage script mislabels one kind of missing value and doesn't run through `npm` on Windows. None of these was patched in shared code; each is recorded as a proposal.

## Who did what

| Who | What |
|---|---|
| Owner (contactshyam14-code) | Wrote the brief: situation, target roles, ≤2-year rule, metros, candidate SOC table, postings, required tests, rules. Approved two data downloads, then pandas and Chromium installs. Chose the submission folder, run-log location and data location. Gate sign-off and hand check are still to come. |
| Claude (AI, Claude Code) | Did the hands-on work: reading, downloads, trimming, code, tests, runs, verification, drafts of every document. |

## Log (2026-10-21, times UTC)

1. **Baseline before any change.** `npm run verify` → exit 1 on this machine: every `.py` and `.yml` check fails with "Python was not found". The `python3` on PATH is the Windows Store alias. `npm run doctor` → exit 0 but "environment: ✗ a required tool or command target is missing". This was a pre-existing environment issue, not caused by this work. Fix used: a gitignored `.venv` (Python 3.12, system site-packages for the existing PyYAML), with a copy of its launcher named `python3.exe`, put first on PATH for `verify`.
2. **Repo rules vs the brief.** CI (`contrib-gate.yml`) fails any student PR that touches `logs/RUN_LOG.md`. It only allows new files under `scripts/contrib/`, `recipes/cases/`, `logs/runs/` and `course/<term>/submissions/`. The brief named `assignments/submissions/` and `logs/RUN_LOG.md`. The AI stopped and asked; the owner chose the CI-safe paths. The raw-download folder is excluded with `.git/info/exclude`, so `.gitignore` (a maintained file) is untouched.
3. **Downloads.** BLS did not block the automated download (HTTP 200, 40.2 MB, not the ~70 MB expected). BEA returned 146 KB. **Mistake:** the AI put the owner's university email address into the User-Agent header of the BLS request. BLS asks automated clients to identify themselves, but the owner had not asked for their email to be sent anywhere. It was not repeated for BEA or any later request, and the address appears in no tracked file.
4. **Missing installs.** The local-wage script needs pandas, which no local Python had. Liveness needs Playwright Chromium, which wasn't installed. Both were extra downloads, so the AI asked; the owner approved both.
5. **The local-wage script's own data was never committed.** `metro_oews.csv`, `bea_rpp.csv`, `bls_bea_msa_crosswalk.csv`, `requirements.txt` and the audit file it cites are absent on `main`. So the crosswalk was rebuilt from the two raw files by exact code equality, the method the recipe documents.
6. **13-1023 is not in OEWS 2024.** The owner expected a blank in the compact file. Running the trim showed there is **no 13-1023 row** in the national or metro file at all: BLS publishes the broad 13-1020 "Buyers and Purchasing Agents" instead. It is kept for context, never substituted.
7. **`#` is not small-sample suppression.** The national file's own field notes define `#` as "a wage equal to or greater than $115.00 per hour or $239,200 per year". `local-wage-adjustment.py` reports San Jose 11-3021 (median `#`) as `suppressed-small-sample`. The resolver keeps it missing and notes the mislabel. The script was not modified (proposal TODO 7).
8. **Liveness disagreed with the board.** `ats:liveness` said Zipline was `uncertain` ("content present but no visible apply control found") on both zipline.com and Greenhouse's own job-board URL. `ats:scan -- --dry-run` listed the same job from the Greenhouse API. The gate stays STOP until the owner decides; the AI did not upgrade it. RS (SuccessFactors) came back `active`. The script handled a non-Greenhouse/Lever/Ashby page fine, because liveness is Playwright-based, not provider-based.
9. **Scorer can't separate SOCs.** The scorer's `role_quality` weight is 0.0 (a known open authorial decision, DOMAIN.md item 3). With no per-SOC sponsorship vote and no fit vote, every candidate's vote-sum is 0. So the score-spread threshold can never trigger; only wage spread separates codes.
10. **Bugs found by reading the first full report** (fixed before the recorded run):
    - the degree field kept a trailing "required" and missed "degree required in X";
    - the experience quote was cut at a comma;
    - "Desirable … or equivalent" showed only one reason;
    - O*NET alt-title support counted colleagues' titles mentioned in the text ("works with Demand Planners") as support for the posting's own code. It is now title-only.
11. **Windows and the local-wage `.venv` hop.** `npm run bls:local-wage` calls `python3`. The script then `os.execv`s `.venv/bin/python`, which fails on Windows with `FileNotFoundError`. A symlink `.venv/bin/python → .venv/Scripts/python.exe` lets a direct `.venv/Scripts/python.exe scripts/bls/local-wage-adjustment.py …` run without the hop. The resolver calls it that way (proposal TODO 7b).
12. **Mutation test.** Making the parser ignore "preferred" wording broke 2 of 43 tests: "2+ required, 3+ preferred" and preferred-only years. The file was restored from git and the suite passed 43/43 again.
13. **Console message bug.** The resolver printed "+ role-scores.json/.md" even when the scorer had not run. Fixed, and the recorded run re-done with the final script.

14. **The worked run tripped the PII scanner.** Pasting the full working-tree `pii-scan` output into `worked-run.md` copied the two strings it had matched: an npm author email in the upstream `package-lock.json`, and a number pattern in the git-excluded raw RS page. `pii-scan --diff origin/main`, which scans branch history the way CI does, then failed on `worked-run.md`. Those two values are now redacted in the pasted block, with a note saying so. The two unpushed local commits that contained them were re-cut, so they are not in the branch history. The diff scan is clean.

## Unresolved questions

- Resolved by the owner on 2026-10-21: the Zipline liveness gate. The repository's checker said uncertain both times ("content present but no visible apply control"). I opened the posting in a browser; the page loaded, the Apply button worked and the title matched, so I judge it live. This is my judgment, not a tool result: the saved checker output still says uncertain and the resolver still stops Zipline at liveness.
- Are the $10,000 / 10% / 0.05 spread thresholds right for this domain? (Proposal TODO 10.)
- Does the owner's EM degree CIP code qualify for the STEM extension? (DSO question; HOLD.)
- The RS posting is due to expire around 2026-10-24. A later liveness check should record whatever it finds.

## In my own words (owner)

The AI built the recipe, the script, the tests and the write-ups. I chose the situation and where the submission files go. I then ran the checks myself: the tests (43 of 43 pass), the liveness check, the resolver, verify and doctor. I also ran a cross-check script on the raw BLS, BEA and 80 Days files. The AI session wrote that script, but I ran it and compared the numbers to the report, and they matched. The checker said "uncertain" for Zipline twice, so I opened the posting in a browser. The page loaded, the Apply button worked and the title matched, so I judged it live.

Some things did not go as I expected. The liveness check could not run at first because the Playwright browser was not installed; it was installed before the first recorded check. The made-up Seattle posting was stopped at liveness, and I had expected a ranked result. Searching "rs group" matched three companies unrelated to RS Group, which is the name mix-up this mode is meant to catch.

Do not trust this mode to say which occupation code an employer will file. It cannot. A blank in the 80 Days data does not mean a company does not sponsor, and a sample run only shows that the gates refuse correctly. The scorer also gives every candidate code the same score, so only the wage spread separates them.

Next I want to re-check liveness on new postings, enter my work-permit card dates once I have them, and ask my school's international office whether my degree qualifies for the STEM extension.
