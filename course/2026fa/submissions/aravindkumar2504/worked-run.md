# Worked run: pre-OPT backend sponsor tiers

*Written by the assistant (Claude Code); `SOURCES.md` says who did what. Every block below is a command run from the repository root, word for word, with its real output pasted in by a build script from the saved run. The commands that start with `node scripts/contrib/...` are in the prototype's folder and can be re-run by anyone. Paths under `/tmp` are scratch folders, so nothing tracked changes.*

## Executive summary

This is the worked example for the recipe: real runs on the repository's own data for a fictional candidate, with every command shown next to its real terminal output, a plain split between what the run verified and what it only inferred, and an honest account of what went wrong. The run looked at 76 companies and found 59 worth a closer look, but the finding that matters most is a limit: only 5.1 percent of the 30,369 companies in the table have any sponsorship record, so the honest output is a short list, a very large "unknown" remainder, and two steps only a person can do. Along the way the work found two defects in the repository's scorer that can silently change a recommendation for a student who needs sponsorship (one reverses a proven sponsor from Apply to Skip; the other treats a missing gate value as open, and labels a missing liveness value a record), and the recipe guards against both. Nothing here shows that any job exists.

## 1. Inputs

| Input | Value | Label |
|---|---|---|
| Persona | `search/examples/kiran-rao/profile.yml`, a fictional persona with invented dates: F-1, authorization starts 2027-06-01 and ends 2028-05-31, 0 of 90 unemployment days used, buffer 20, expected 75 days to start, needs sponsorship, SOC code 15-1252 | your-input |
| Run date | 2026-09-30 | your-input |
| Company table | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, SHA-256 `eccdee2addf4...`, 30,369 rows | record |
| Wage reference | `data/bls/compact/soc_occupation_compact.csv`, SHA-256 `bac5acf77ca2...`; the SOC 15-1252 row gives a 2024 national median of 133,080 | record |
| Form D samples | four files in `data/sec/form-d/processed/sample/`, 200 records | record |
| Watchlist | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt`: 11 names. Eight were chosen by a fixed rule (the first company in file order that lands in a given branch of the recipe), one (Databricks) was added by hand by the assistant as a well-known Proven sponsor that is also in the discovery pool, and two are deliberate misses (a typo and an invented name). A coverage demonstration, not a representative sample and not a recommendation | your-input |
| Parameters | `params.json` and `role-families.json` in the same folder: Proven at least 10 approvals and 90 percent; Likely at least 4 and 70 percent; data older than 6 months refused; funding window 24 months; the title rule | your-input (proposed by the assistant, not yet confirmed by the author) |
| Scenario dates | 2027-06-01; 2027-08-01 with 61 days already used; 2028-07-01; and an older persona whose clock is already running | your-input |

## 2. Commands and real output

### 2.1 The engine run once (the assignment's own step)

The assignment says to run these commands and keep the output. The first attempts of two of them failed on a fresh clone; that is recorded as it happened. (A first attempt wrapped these commands in `timeout`, which macOS does not have, so nothing ran; they were re-run without it.)

`ats:scan` needs a `portals.yml`, which is git-ignored, so a fresh clone has none:

```text
$ npm run ats:scan -- --dry-run
> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
```

The example file's own first lines say to copy it. The copy is ignored by git. The scan then runs (one company, Databricks, read from its public job board; `--dry-run` writes nothing). The full output is 84 lines, so the start and the end are shown, each from a real run of the command with a real pipe:

```text
$ cp data/ats/portals.example.yml data/ats/portals.yml; echo "exit: $?"
exit: 0
```

```text
$ npm run ats:scan -- --dry-run 2>&1 | head -14
> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-01
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      882
Filtered by title:     388 removed
```

```text
$ npm run ats:scan -- --dry-run 2>&1 | tail -5
  + Databricks | Strategic Account Executive - Retail vertical  | Remote - California

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

This scan reads a live job board, so it is not repeatable: the first run, on 2026-09-30, removed 389 postings by title (the change brief records that run), and this one, made the next day, removed 388 of the same 882.

`ats:liveness` first failed because the browser it drives was not installed:

```text
$ npm run ats:liveness -- https://example.com/job/123
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://example.com/job/123

Checking 1 URL(s)...

Fatal: browserType.launch: Executable doesn't exist at ~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```

After the author approved downloading Playwright's Chromium, the same command worked and reported the repository's own example URL as expired. (The request had said roughly 100 to 200 MB. The install in fact fetched three parts, Chrome for Testing 178.7 MiB, Chrome Headless Shell 94.7 MiB and FFmpeg 1 MiB, about 554 MB on disk in `~/Library/Caches/ms-playwright`; a later message of the assistant's reported only the 94.7 MiB part, which was a mistake.)

```text
$ npm run ats:liveness -- https://example.com/job/123
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://example.com/job/123

Checking 1 URL(s)...

❌ expired    https://example.com/job/123
           HTTP 404

Results: 0 active  1 expired  0 uncertain
```

The scorer on the book's own example (the assignment says always to pass `--out-dir`, so the tracked example output is not overwritten):

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir /tmp/tiers-baseline-ch11 2>&1
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/tiers-baseline-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  ../../../../../../tmp/tiers-baseline-ch11/role-scores.json  +  ../../../../../../tmp/tiers-baseline-ch11/role-scores.md
```

### 2.2 The sample run

The documented command, writing to a scratch folder:

```text
$ rm -rf /tmp/tiers-run; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run 2>&1; echo "exit: $?"; ls /tmp/tiers-run
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote /tmp/tiers-run/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit: 0
report.md
role-scores.json
role-scores.md
roles.json
run-log.json
scorer-profile.json
```

The committed sample run, `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/`, was made by the same command with `--out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30`.

### 2.3 The same command without the acceptance flag

The table's newest funding date is 2025-09-26, a year before the run, so the run refuses and writes nothing (the folder is not created):

```text
$ rm -rf /tmp/tiers-refused; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --out-dir /tmp/tiers-refused 2>&1; echo "exit: $?"; ls /tmp/tiers-refused 2>&1
StaleVintageError: refusing to run: the newest funding date in the data is 2025-09-26, 12.1 months before the run date 2026-09-30 (limit 6). Recent raises and filings may be missing. Re-run with --accept-stale-vintage to proceed knowingly; the report will state the age.
exit: 3
ls: /tmp/tiers-refused: No such file or directory
```

### 2.4 The timeline gate across dates

Only the run date and the days already used change, apart from the last line, which swaps in an older persona whose clock is already running (its file lacks a SOC code and an estimate of days to start, so those are given on the command line and recorded as such). The check prints each command it ran with the first two lines of its output, then a table read from each run's log:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scenarios 2>&1
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-checks/scenarios/kiran-today
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
      timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-06-01 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-checks/scenarios/kiran-2027-06-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 51 worth a closer look, 20 set aside, 2 held, 3 unresolved
      timeline factor 0.75 (buffer-partly-used); data vintage 2025-09-26, 20.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-08-01 --days-used 61 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-checks/scenarios/kiran-2027-08-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (unemployment-ceiling-reached); data vintage 2025-09-26, 22.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2028-07-01 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-checks/scenarios/kiran-2028-07-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (authorization-already-ended); data vintage 2025-09-26, 33.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --persona search/examples/priya-nair/profile.yml --soc 15-1252 --family backend-platform-swe --days-to-start 75 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-checks/scenarios/priya-nair-persona
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (unemployment-ceiling-reached); data vintage 2025-09-26, 12.1 months old (accepted)

scenario             factor  reason                         Apply  Consider  Skip  scored  | expected start  | unemployment days projected/ceiling
kiran-today          1       open                           51     8         12    71      | 2027-06-01      | 0/90
kiran-2027-06-01     0.75    buffer-partly-used             0      51        20    71      | 2027-08-15      | 75/90
kiran-2027-08-01     0       unemployment-ceiling-reached   0      0         71    71      | 2027-10-15      | 136/90
kiran-2028-07-01     0       authorization-already-ended    0      0         71    71      | 2028-09-14      | 75/90
priya-nair-persona   0       unemployment-ceiling-reached   0      0         71    71      | 2026-12-14      | 109/90
```

Reading the table: today the candidate's clock has not started, so the gate is open and 51 companies are Apply. By June 2027 a 75-day process uses up part of the buffer (factor 0.75), so the same 51 drop to Consider and the rest to Skip. By August 2027, with 61 days already used, the ceiling would be exceeded and everything closes. The older persona's clock is already running, so the gate is closed today.

### 2.5 The scorer defect, shown

The same role (a Proven sponsor, from the book's own example file) scored under four profiles. The older persona's own wording ("work authorized") makes the scorer drop the sponsorship term, and an explicit `needs_sponsorship: true` field is ignored:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scorer-probe 2>&1
the older persona's own wording, from search/examples/aarav-patel/profile.yml: "F-1 STEM OPT — work authorized (EAD)"
role: biotech-data from data/examples/ch11-roles.json (sponsorship 0.9, fit 0.7, liveness 1, timeline 0.85); scorer: scripts/score/role-scorer.mjs
noprofile                  needs_sponsorship=true  composite=0.4462 => Apply | (0.9·0.35 + 0.7·0.3) × 1 × 0.85 = 0.446
safe-text                  needs_sponsorship=true  composite=0.4462 => Apply | (0.9·0.35 + 0.7·0.3) × 1 × 0.85 = 0.446
aarav-freetext             needs_sponsorship=false composite=0.1785 => Skip | (0.9·0 + 0.7·0.3) × 1 × 0.85 = 0.178
freetext-plus-explicit     needs_sponsorship=false composite=0.1785 => Skip | (0.9·0 + 0.7·0.3) × 1 × 0.85 = 0.178
```

The four profiles: `noprofile` is no profile file at all; `safe-text` is "F-1 STEM OPT (EAD); requires H-1B sponsorship"; `aarav-freetext` is the older persona's own wording; `freetext-plus-explicit` is that wording plus an explicit `needs_sponsorship: true`. The recipe writes the scorer's profile itself, and gate G2 refuses to continue if the scorer's answer disagrees with the persona.

### 2.6 What the report says about the watchlist

The 11 sample names landed where the comments in the watchlist file say they should:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs watchlist 2>&1
name                       bucket                 tier                   scorer
DATABRICKS INC             advance                Proven                 0.315 Apply
1UPHEALTH INC              advance                Proven                 0.315 Apply
AKIA SYNDICATE             advance                Likely                 0.210 Consider
REPLICATE INC              skip                   Thin                   0.105 Skip
ADAGIO MEDICAL INC         skip                   Thin                   0.105 Skip
MOBILIO LLC                skip                   Thin                   0.105 Skip
011235813 INC              hold_unknown           -                      -
1LIFE HEALTHCARE INC       hold_role_unverified   role-type-unverified   -
3AM Innovations            ambiguous              -                      -
Databriks Inc              not_found              -                      -
Nonexistent Example Corp   not_found              -                      -
```

## 3. Verified versus inferred, line by line

Every value carries one of three labels. **record**: read from a repository data file, or plain arithmetic on record values. **your-input**: the persona, the run date and the parameters (which the assistant proposed and the author has not yet confirmed), and anything computed only from those. **model-judgment**: a judgment a model makes about a company while the program runs; the prototype makes none (the thresholds and the title rule were written by the assistant, which is why they are listed as unconfirmed parameters). Values that only describe the run are marked run-metadata. The label of every row field is in the run log under `labels`, and of every other value under `labels_run_level`.

Company DATABRICKS INC (a watchlist name), as it appears in the report:

| Line | Value | Label | Where it comes from |
|---|---|---|---|
| Company name | DATABRICKS INC | record | `company_name` |
| Approvals / denials | 1640 / 8 | record | `Total Approvals`, `Total Denials` |
| Approval rate | 99.51% | record (arithmetic) | equals the file's own `Approval_Rate` |
| Matching sponsored titles | Software Engineer; Senior Software Engineer | record, matched by a rule | `top_job_titles_sponsored` filtered by `role-families.json` |
| Tier | Proven | record classified by a rule whose thresholds are your-input | the thresholds are parameters proposed by the assistant |
| Tier value sent to the scorer | 0.9 | your-input | a parameter in `params.json` (the book's chapter 11 example value), not a probability. The book's own example labels this term `record`; here the number is a parameter, so it is labelled as one |
| Latest raise | 2025-09-08, Series D+ | record | `latest_funding_date`, `latest_funding_stage` |
| Offered wage against the national median | 1.12x (149,423 over 133,080) | record over record | `median_salary_offered` and the BLS row |
| Form D sample | form-d-filed-after-table-end | record | two sample records show first sales on 2025-12-16 and 2025-09-30, both filed on 2025-12-31, after the table's newest funding date (2025-09-26), so the table may simply predate them |
| Liveness gate value sent to the scorer | 1 | your-input (an unchecked placeholder) | "assume open until a person checks" |
| Timeline gate value | 1 | your-input | computed from the persona's dates |
| Composite and verdict | 0.315, Apply | your-input (derived) | the repository scorer: (0.9 x 0.35) x 1 x 1. The product of a parameter, the scorer's own weight and two your-input gate values, so it is inferred, not a record |
| Model judgments about this company | none | | |

What each other kind of row rests on:

| Row | What is record | What is a rule or an input | What is absent, on purpose |
|---|---|---|---|
| AKIA SYNDICATE, Likely, Consider 0.210 | 6 approvals, 0 denials, title "Software Engineer", offered 135,000, raise 2024-09-09 | tier thresholds and the tier value 0.6 (your-input; 0.6 is the chapter 11 example value) | fit is not scored, so 0.210 is capped |
| REPLICATE INC, Thin, Skip 0.105 | 4 approvals, 2 denials (66.67%), title "Infrastructure Engineer" | the Likely rate bar of 70 percent and the Thin value 0.3 (your-input; Thin is set aside by construction) | no claim that it does not sponsor |
| 011235813 INC, held: unknown | funded 2024-05-12; no sponsorship fields at all | none | no tier, no score, never skip |
| 1LIFE HEALTHCARE INC, held: role type unverified | 2 approvals, titles ["Senior Data Engineer"] | the title rule says not backend-style | no claim about backend roles |
| 3AM Innovations, ambiguous | two rows, INC and LLC, share the normalized name | exact normalized-name matching | no choice between the two |
| Databriks Inc, not found | nothing | exact matching only; the name is the candidate's typed input | no fuzzy guess at "Databricks" |

## 4. Verification

### 4.1 Report values against the raw file

For named companies, the raw table cells (the contact and officer columns are not printed) beside the committed run log's values, with the arithmetic redone (run by the assistant; the same command can be run by anyone):

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs source "DATABRICKS INC" "AKIA SYNDICATE" "REPLICATE INC" "MOBILIO LLC" "011235813 INC" "3AM INNOVATIONS INC" 2>&1
--- DATABRICKS INC: company table, row 7249 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=18421062869.0 | latest funding 2025-09-08 Series D+ 1074999900.0
    Total Approvals=1640.0 Total Denials=8.0 Approval_Rate=99.51456310679612 | median_salary_offered=149422.5
    top_job_titles_sponsored=['Software Engineer', 'Senior Software Engineer', 'Solutions Architect', 'Specialist Solutions Architect', 'Senior Solutions Engineer']
    committed run log: bucket=advance tier=Proven approvals/denials=1640/8 rate=99.51 wage ratio=1.12 scorer=0.315 Apply [(0.9·0.35) × 1 × 1 = 0.315]
    redone: 100 * 1640 / (1640 + 8) = 99.51% -> run log says 99.51% (match)
    redone: 149422.5 / 133080 (the BLS national median for SOC 15-1252) = 1.12x -> run log says 1.12x (match)
--- AKIA SYNDICATE: company table, row 1077 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=12879083.0 | latest funding 2024-09-09 Seed 4999998.0
    Total Approvals=6.0 Total Denials=0.0 Approval_Rate=100.0 | median_salary_offered=135000.0
    top_job_titles_sponsored=['Software Engineer']
    committed run log: bucket=advance tier=Likely approvals/denials=6/0 rate=100 wage ratio=1.01 scorer=0.21 Consider [(0.6·0.35) × 1 × 1 = 0.210]
    redone: 100 * 6 / (6 + 0) = 100% -> run log says 100% (match)
    redone: 135000 / 133080 (the BLS national median for SOC 15-1252) = 1.01x -> run log says 1.01x (match)
--- REPLICATE INC: company table, row 22219 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=39999970.0 | latest funding 2023-06-28 Series B 39999970.0
    Total Approvals=4.0 Total Denials=2.0 Approval_Rate=66.66666666666666 | median_salary_offered=162655.0
    top_job_titles_sponsored=['Infrastructure Engineer']
    committed run log: bucket=skip tier=Thin approvals/denials=4/2 rate=66.67 wage ratio=1.22 scorer=0.105 Skip [(0.3·0.35) × 1 × 1 = 0.105]
    redone: 100 * 4 / (4 + 2) = 66.67% -> run log says 66.67% (match)
    redone: 162655 / 133080 (the BLS national median for SOC 15-1252) = 1.22x -> run log says 1.22x (match)
--- MOBILIO LLC: company table, row 17048 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=1000000.0 | latest funding 2014-01-31 Pre-Seed 1000000.0
    Total Approvals=0.0 Total Denials=2.0 Approval_Rate=0.0 | median_salary_offered=72800.0
    top_job_titles_sponsored=['Software Engineer']
    committed run log: bucket=skip tier=Thin approvals/denials=0/2 rate=0 wage ratio=0.55 scorer=0.105 Skip [(0.3·0.35) × 1 × 1 = 0.105]
    redone: 100 * 0 / (0 + 2) = 0% -> run log says 0% (match)
    redone: 72800 / 133080 (the BLS national median for SOC 15-1252) = 0.55x -> run log says 0.55x (match)
--- 011235813 INC: company table, row 3 (the contact and officer columns are not printed)
    industry=Other | total_funding=8499999.0 | latest funding 2024-05-12 Pre-Seed 1500000.0
    Total Approvals= Total Denials= Approval_Rate= | median_salary_offered=
    top_job_titles_sponsored=
    committed run log: bucket=hold_unknown tier=- approvals/denials=- rate=- wage ratio=- scorer=-
--- 3AM INNOVATIONS INC: company table, row 171 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=17000000.0 | latest funding 2025-01-13 Pre-Seed 5000000.0
    Total Approvals= Total Denials= Approval_Rate= | median_salary_offered=
    top_job_titles_sponsored=
    committed run log: this company is not in the run
```

Every value the report shows equals the raw row, and every recomputed figure matches. 3AM Innovations is the ambiguous case: two rows share the name, so the run reports it as ambiguous and scores neither.

### 4.2 The parsers against their Python originals

The prototype's name matching is a port of the repository's `normalize_company_name`, compared on every company name in the table and every Form D sample name. The reader for the table's title lists is compared the same way with Python's `ast.literal_eval` (an independent review had found it dropped the backslash in escapes such as `\xa0`; it now decodes them, and accepts only the shape Python writes):

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs parity-names 2>&1
names compared (30,369 company names in the table + 200 Form D sample names): 30569
JavaScript normalizeName vs Python normalize_company_name in scripts/sec/entity-resolution.py, differences: 0
```

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs parity-titles 2>&1
title cells compared (every non-blank top_job_titles_sponsored cell in the table): 1557
cells containing a backslash escape: 2
JavaScript parseTitles vs Python ast.literal_eval, differences: 0
```

### 4.3 The funding column against Form D

Each Form D sample record was compared with the table company of the same normalized name (only unambiguous matches). A table can only miss what had been filed before it was made, so the filing date is compared with the table's newest funding date:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs formd-pairs 2>&1
200 sample records examined; 15 matched exactly one company in the table (14 companies); 0 ambiguous; 185 unmatched
company                           class                          table latest  first sale  filed
DICKERSON PIKE LLC                csv-has-no-funding             -             -           2025-06-30
COMPOSABL INC                     form-d-missed-by-table         2024-12-18    2025-06-24  2025-06-30
MAP THE SKY LLC                   csv-has-no-funding             -             -           2025-06-30
FOUNDATION LLM TECHNOLOGIES INC   agrees                         2025-06-13    2025-06-13  2025-06-30
13G30 LONDON LTD LIABILITY CO     csv-has-no-funding             -             -           2025-06-30
STOP COLLABORATE LISTEN LLC       csv-has-no-funding             -             -           2025-06-30
LAMINR TECHNOLOGIES INC           agrees                         2025-09-22    2025-09-22  2025-09-30
RUNBUGGY OMI INC                  form-d-filed-after-table-end   2022-03-30    2025-09-18  2025-09-30
NAVI AI INC                       agrees                         2025-09-16    2025-09-16  2025-09-30
BLOSSOM BH OPCO INC               agrees                         2025-09-15    2025-09-15  2025-09-30
DATABRICKS INC                    form-d-filed-after-table-end   2025-09-08    2025-12-16  2025-12-31
DATABRICKS INC                    form-d-filed-after-table-end   2025-09-08    2025-09-30  2025-12-31
CRYPTO CO                         form-d-filed-after-table-end   2017-12-12    2025-12-19  2025-12-31
BG HOLDING CO LLC                 csv-has-no-funding             -             2025-11-26  2026-03-31
GEARFLOW INC                      form-d-filed-after-table-end   2022-08-30    2024-07-11  2026-03-31
counts: agrees 4, form-d-missed-by-table 1, form-d-filed-after-table-end 5, form-d-older 0, same-date-amount-differs 0, csv-has-no-funding 5, form-d-has-no-first-sale 0
```

Where both sources describe the same round (four records) they agree exactly on date and amount. One company, Composabl, has a first sale on 2025-06-24, filed on 2025-06-30, before the table's newest funding date, that the table does not have (its latest round there is 2024-12-18): a real miss. Five records (RunBuggy, Databricks twice, Crypto Co and Gearflow) were filed after the table's newest funding date, so the table may simply predate them; RunBuggy's and Gearflow's first sales are earlier than the table's end, but the forms were filed later, so they are not counted as misses. Five matched companies have no funding in the table at all. One correction belongs here: the first version of this page, of the recipe and of the run log counted RunBuggy and Gearflow as misses (3 of 15) because it compared first-sale dates; an independent review pointed out that the filing date is what matters, and the code and every document now use it. Only samples ship, so this is a spot check of 15 records (14 companies), not a verification of the column.

### 4.4 Tests and deliberate breaks

106 offline tests pass (on Node 26.10.0 and on Node 20.20.2), and 66 deliberate code breaks are each caught by at least one test (not counting the one test that checks the committed run is current; `break-it.mjs`; the output, and the real gaps found along the way, are in `TEST-REPORT.md`). A fresh clone of the branch reproduces the four files this program writes byte for byte. The scorer's own two files carry the date it ran (in UTC), so they differ from the committed ones by that date alone: the committed run is stamped 2026-10-01 and the clone was run on 2026-10-03 (the diff is in `TEST-REPORT.md`, section 6). A source archive made the way the Canvas ZIP is made also passes the tests.

### 4.5 Trying to break the real command

An older persona with no explicit `needs_sponsorship` is refused, naming every problem and inventing no default (nothing is written):

```text
$ rm -rf /tmp/tiers-older; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona search/examples/aarav-patel/profile.yml --out-dir /tmp/tiers-older 2>&1; echo "exit: $?"; ls /tmp/tiers-older 2>&1
InputError: persona check failed (4 problems)
  - needs_sponsorship must be true or false (an explicit field; free text is not read)
  - target_role.soc must be a SOC code like "15-1252" (or pass --soc)
  - target_role.family must name a role family in role-families.json (or pass --family)
  - timeline_assumptions.expected_days_to_start must be a whole number >= 0 (or pass --days-to-start)
exit: 2
ls: /tmp/tiers-older: No such file or directory
```

A persona that does not need sponsorship is refused, because the scorer would drop the sponsorship term and every company would be set aside for a reason unrelated to the evidence:

```text
$ sed 's/^needs_sponsorship: true/needs_sponsorship: false/' search/examples/kiran-rao/profile.yml > /tmp/nosponsor.yml; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona /tmp/nosponsor.yml --out-dir /tmp/tiers-nosponsor 2>&1; echo "exit: $?"
InputError: this recipe is for a candidate who needs an employer to sponsor a work visa, and this persona says needs_sponsorship: false
  - with false the repository scorer drops the sponsorship term, so every company would come back set aside for a reason that has nothing to do with the evidence
  - use a persona that needs sponsorship, or a different recipe
exit: 2
```

A SOC code with no wage row still runs, and says the wage comparison is missing:

```text
$ rm -rf /tmp/tiers-soc; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --soc 99-9999 --out-dir /tmp/tiers-soc 2>&1; echo "exit: $?"
preopt-sponsor-tiers: 67 evaluated (0 watchlist, 67 pool) -> 58 worth a closer look, 9 set aside, 0 held, 0 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote /tmp/tiers-soc/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit: 0
```

```text
$ node -e 'const l = JSON.parse(require("fs").readFileSync("/tmp/tiers-soc/run-log.json")); console.log("bls_reference:", JSON.stringify(l.bls_reference)); console.log("a row wage field:", JSON.stringify(l.rows[0].wage)); console.log("G1 note:", l.gates.G1_persona.soc_note)'
bls_reference: {"status":"missing","reason":"no-soc-row","soc":"99-9999","source":{"file":"data/bls/compact/soc_occupation_compact.csv","sha256":"bac5acf77ca2d25268c75b3706084f7f67bcc0c6e3cc68cd03e0ebd2598343d1","rows":1016}}
a row wage field: {"status":"missing","reason":"bls-no-soc-row","offered":134000}
G1 note: role family backend-platform-swe is defined for SOC 15-1252; this run uses SOC 99-9999 only for the wage reference
```

A persona outside `search/examples/` is treated as real data and may not write into a tracked folder (the output folder is not created):

```text
$ cp search/examples/kiran-rao/profile.yml /tmp/my-own-persona.yml; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona /tmp/my-own-persona.yml --out-dir course/2026fa/submissions/aravindkumar2504/runs/from-a-real-persona 2>&1; echo "exit: $?"; ls course/2026fa/submissions/aravindkumar2504/runs
InputError: this persona is outside search/examples/, so it is treated as real data, and the output folder is inside the repository but not under private/
  - this persona is outside search/examples/
  - persona: <outside the repository>/my-own-persona.yml
  - output folder: course/2026fa/submissions/aravindkumar2504/runs/from-a-real-persona
  - pass --out-dir private/<name> (gitignored) or a folder outside the repository; committing a real persona's dates or a real watchlist is a zero-condition offense (DATA_CONTRACT.md)
exit: 2
2026-09-30
```

The same refusal for a folder inside the repository whose name starts with two dots (an earlier version of the guard wrongly counted such a folder as outside the repository; `..leak-demo` is created nowhere):

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona /tmp/my-own-persona.yml --out-dir ..leak-demo 2>&1; echo "exit: $?"; ls -d ..leak-demo 2>&1
InputError: this persona is outside search/examples/, so it is treated as real data, and the output folder is inside the repository but not under private/
  - this persona is outside search/examples/
  - persona: <outside the repository>/my-own-persona.yml
  - output folder: ..leak-demo
  - pass --out-dir private/<name> (gitignored) or a folder outside the repository; committing a real persona's dates or a real watchlist is a zero-condition offense (DATA_CONTRACT.md)
exit: 2
ls: ..leak-demo: No such file or directory
```

### 4.6 The title rule

An 80-title sample drawn with a fixed seed and labelled by the assistant is in `title-matcher-check.md`: of 40 accepted titles, 3 were clear false positives (a UX title and two perception specializations) and 5 borderline; of 40 rejected titles containing "engineer", "developer" or "technical", 1 was a clear miss ("Member, Technical Staff", a comma variant) and 3 borderline. One labeller, an AI assistant, not yet checked by the author, so treat it as indicative.

## 5. Reflection

*Written by the assistant. The first person below means the assistant, not the author. The author's own reflection is in `FRICTIONAL.md`, and says how little of this the author has checked so far.*

**What worked.** Keeping "unknown" separate from "no" turned a 5.1 percent coverage number into the honest headline instead of a hidden weakness. Checking the scorer's own answer caught a defect that would have silently turned a proven sponsor into a Skip. Running the deliberate-break harness found a real gap in my own tests, and the fresh-checkout comparison found a real defect in my own output (a run log that recorded an absolute path from this machine). Three rounds of independent read-only review then found more, all fixed (each code fix has a test): the title-list reader mangled escaped characters; the privacy guard compared the spelling of paths instead of where they are (a folder named `..leak` passed as outside the repository) and ignored the company table and the other data files; a persona that does not need sponsorship got a wrong explanation for every Skip; the funding check used the wrong date; the funnel was one short; the sponsorship value was labelled a record though it is a parameter; the Canvas ZIP would have failed two tests; and some of my own notes put AI work in the author's mouth. The last round found smaller things: a report sentence that called a 100 percent skip rate low, funnel counts labelled as plain records although most apply a rule, rows left out without a word in the report, and a fetch line in the repository's own CI that git rejects, so one of its checks will probably fail on any pull request.

**What the recipe and prototype got wrong or missed.**
- *The predictions, scored.* P1 (title errors) partly right: some misfiles occurred, but the clear false positives were a UX title and perception specializations, not the testing, sales or support titles I predicted (those were excluded by design); and the unusual title I predicted would be missed was matched in its standard form, "Member of Technical Staff", but its comma variant, "Member, Technical Staff", was missed. P2 (the timeline gate is exactly 1.0 today) right: all 71 scored roles carry factor 1. P3 (a pool of 60 to 160 companies) right: 68 companies met the stated conditions and 65 remain once the candidate's own list (2) and one ambiguous name (1) are set aside; but "fewer than half reach the top tier" was wrong: 49 of the 65 pool companies (75 percent) are Proven. P4 (a poor hiring target in the top 15) right: Intel Corp, with 13,318 reported approvals and a "Series B" dated 2025-03-18, is 13th of the first 15, which does not fit the idea of a recently funded startup.
- *Wrong claims of mine, now corrected.* I told the author the Form D samples match none of the table's companies; that used a crude name normalizer, and the repository's rule finds 15 of 200 (the change brief's revisions say so). I then reported that the table had missed 3 of the 15; by filing date the true count is 1 of 14 companies. I also wrote that the scorer labels a missing gate value as a record; that is true of liveness only (a missing timeline value is labelled your-input). And I reported the browser download as 94.7 MiB when it was about 275 MiB in three parts.
- *Company level is not entry level.* Of the 59 companies that advance, 20 list only senior-marked titles, which is no evidence that they sponsor a new graduate. The report shows the flag; the tier does not use it.
- *"Recently funded" is a weak proxy.* Three advancing companies report more than a thousand approvals each (Databricks, Intel, Stripe). Nine of the 59 offer a median wage under 0.8 times the national median, which is a prompt for a person to look.
- *Fit is not scored,* so the composite cannot exceed 0.315; a timeline factor under about 0.95 already moves a Proven company from Apply to Consider.
- *The scorer's skip rate is low.* The repository scorer reports a 17 percent skip rate here (12 of 71 scored roles), below the roughly 50 percent it calls healthy, because it only sees companies that already passed the evidence filters; against the whole table, 99.8 percent of companies were not advanced, mostly because the data is silent about them.
- *Unexplained data.* Every count is even and has no year; and a very large enterprise-software company appears with only 2 reported approvals, which suggests counts under-represent companies whose names join imperfectly (an inference, not checked against filings).
- *Nothing about any posting was checked.* Gates H1 and H2 are open on every row.

**One concrete next improvement.** (A smaller one first: let the title rule accept the comma variant "Member, Technical Staff"; it was left alone here so the sample stays a test of the rule as used.) Then build the reading half of gate H2: given the text of one posting, print every sentence that mentions U.S.-person or export-control status, "no sponsorship", a graduation window or a start date, quoted, and stop. A person still clears it. Acceptance test: three synthetic postings, each with one planted trap and one clean control, flagged and unflagged as expected. The matching step for a person: clear H1 and H2 by hand for the top three advancing companies and record the results in the run log, which is the evidence a live-run claim would need.

## 6. Attestation

- Recipe: aravindkumar2504-preopt-swe-sponsor-tiers v0.1.0
- By: Claude Code (Sonnet 5.5), working with Aravind Sundaravadivelu, 2026-09-30 into 2026-10-01. The author read `report.md` on 2026-10-03 and signed the adequacy of the sample run in the run-log entry (sample path only); that sign-off is theirs and is recorded there. This attestation is the assistant's own record of what was run, not a human sign-off, and the recipe's attestation field stays null (it is for VERIFIED).

### Tested

| Ran | Saw | Expected |
|---|---|---|
| The documented sample command | exit 0; 76 evaluated: 59 worth a closer look, 12 set aside, 2 held, 3 unresolved | exit 0; both outputs written; every gate has a status |
| The same command without the acceptance flag | exit 3, refusal message, no folder created | refuse and write nothing |
| Deliberate break: an older persona with no explicit `needs_sponsorship` | exit 2, four problems named, nothing written | refuse; invent no default |
| Deliberate break: a persona that says it does not need sponsorship | exit 2, the reason stated, nothing written | refuse |
| Deliberate break: a real persona aimed at a tracked folder, and at a folder named `..leak-demo` inside the repository | exit 2 both times; neither folder created | refuse |
| A SOC code with no wage row | run completes; wage comparison reported missing | continue; invent nothing |
| Authorization end date already past (run date 2028-07-01) | factor 0; all 71 scored roles Skip | zero, with the reason |
| Named companies: raw table cells against the run log | every value equal; every recomputed figure equal | equal (compared by the assistant) |
| The JavaScript name rule against the Python original, 30,569 names; the title reader against `ast.literal_eval`, 1,557 cells | 0 differences in each | 0 |
| 66 deliberate code breaks (`break-it.mjs`) | all 66 caught by at least one test | every break caught |
| The 106 tests and the sample command under Node 26.10.0 and Node 20.20.2 | all pass on both; the sample run wrote the same bytes | the same on both |
| A fresh clone of the branch; a source archive made the way the Canvas ZIP is made | tests pass in both (the archive skips the one test that reads git); the clone's four program outputs are identical to the committed ones, and the scorer's two files differ by their date stamp only | reproducible |

### Did not test

- Any live posting: gate H1 (liveness) was not run on any shortlisted company, and gate H2 (reading a posting) was not done.
- Whether any "Apply" company would in fact sponsor this candidate: there is no outcome data.
- The title rule beyond 80 titles and one labeller (the assistant, not yet checked by the author); recall over titles without "engineer", "developer" or "technical".
- Behavior on another operating system (only macOS was used), or with the full Form D quarters.
- Whether the thresholds and the timeline rule suit anyone but the fictional persona; they are the author's to confirm.
- The work against the course's AI policy: the assistant did not read it, at the author's direction.

### Broke during testing, fixed

- **Found by the two independent review rounds** (each with a test): the title-list reader dropped the backslash in escapes; the privacy guard compared the spelling of paths, ignored every input but the persona and the watchlist, and let a folder named `..leak` through; a persona that did not need sponsorship got a wrong reason for every Skip; the Form D check judged by first-sale date instead of filing date; the funnel counted 67 where 68 records met its stated conditions; the sponsorship value was labelled a record; a local path was in the first sample-run commit (the history was re-cut before any push); the Canvas ZIP would have failed two tests; a report reason blamed thin evidence for a timeline demotion; the tests left about 2,400 temporary folders behind; a run that scored nothing left an earlier run's verdicts in its folder; outputs carried this machine's folders when inputs were outside the repository.
- A test gap: swapping the "Form D newer" and "older" labels went unnoticed because the fixture had one of each and the test compared totals. The test now checks each company.
- Wrong expected numbers in my own tests (a fixture count of 14 instead of 15, a run date that put an older persona before its clock started, a wrong discovery order, a variable typo): fixed in the tests, not the code.
- The break harness left files in the repository when the privacy guard was broken; the test now cleans up in a `finally` block, and the harness now works in a private copy.
- The documented test command, `node --test <directory>`, would recurse into every file on Node 20; it is now an explicit `*.test.mjs` glob.
