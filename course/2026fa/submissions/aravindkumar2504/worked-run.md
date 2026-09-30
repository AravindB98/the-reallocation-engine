# Worked run: pre-OPT backend sponsor tiers

## Executive summary

This is the worked example for the recipe: one real run on the repository's own data for a fictional candidate, with every command shown next to its real terminal output, a plain split between what the run verified and what it only inferred, and an honest account of what went wrong. The run looked at 76 companies and found 59 worth a closer look, but the finding that matters most is a limit: only 5.1 percent of the 30,369 companies in the table have any sponsorship record, so the honest output is a short list, a very large "unknown" remainder, and two steps only a person can do. Along the way the work found two defects in the repository's scorer that can silently change a recommendation for a student who needs sponsorship (one reverses a proven sponsor from Apply to Skip; the other treats a missing gate value as open and labels it a record), and the recipe guards against both. Nothing here shows that any job exists.

## 1. Inputs

| Input | Value | Label |
|---|---|---|
| Persona | `search/examples/kiran-rao/profile.yml`, a fictional persona with invented dates: F-1, authorization starts 2027-06-01 and ends 2028-05-31, 0 of 90 unemployment days used, buffer 20, expected 75 days to start, needs sponsorship, SOC code 15-1252 | your-input |
| Run date | 2026-09-30 | your-input |
| Company table | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, SHA-256 `eccdee2addf4...`, 30,369 rows | record |
| Wage reference | `data/bls/compact/soc_occupation_compact.csv`, SHA-256 `bac5acf77ca2...`; the SOC 15-1252 row gives a 2024 national median of 133,080 | record |
| Form D samples | four files in `data/sec/form-d/processed/sample/`, 200 records | record |
| Watchlist | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt`: 11 names. Eight were chosen by a fixed rule (the first company in file order that lands in a given branch of the recipe), one (Databricks) was added by the assistant as a well-known Proven sponsor that is also in the discovery pool, and two are deliberate misses (a typo and an invented name). A coverage demonstration, not a representative sample and not a recommendation | your-input |
| Parameters | `params.json` and `role-families.json` in the same folder: Proven at least 10 approvals and 90 percent; Likely at least 4 and 70 percent; data older than 6 months refused; funding window 24 months; the title rule | your-input (proposed by the assistant, not yet confirmed by the author) |
| Scenario dates | 2027-06-01; 2027-08-01 with 61 days already used; 2028-07-01; and an older persona whose clock is already running | your-input |

## 2. Commands and real output

### 2.1 The engine run once (the assignment's own step)

The assignment says to run these three commands and keep the output. The first two failed on a fresh clone; that is recorded as it happened. (A first attempt used a `timeout` command macOS does not have, so nothing ran; it was re-run without it.)

`ats:scan` needs a private `portals.yml` created by an onboarding step:

```text
$ npm run ats:scan -- --dry-run
> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
```

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

After the author approved downloading Playwright's headless Chromium (94.7 MiB), the same command worked, and reported the repository's own example URL as expired:

```text
$ npm run ats:liveness -- https://example.com/job/123
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://example.com/job/123

Checking 1 URL(s)...

❌ expired    https://example.com/job/123
           HTTP 404

Results: 0 active  1 expired  0 uncertain
```

The scorer on the book's own example (its output files went to a scratch archive, not to the repository):

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/aravindkumar2504/runs/baseline-ch11
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/aravindkumar2504/runs/baseline-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/aravindkumar2504/runs/baseline-ch11/role-scores.json  +  course/2026fa/submissions/aravindkumar2504/runs/baseline-ch11/role-scores.md
```

### 2.2 The sample run

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit: 0
```

### 2.3 The same command without the acceptance flag

The table's newest funding date is 2025-09-26, a year before the run, so the run refuses and writes nothing:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --out-dir <not created>
StaleVintageError: refusing to run: the newest funding date in the data is 2025-09-26, 12.1 months before the run date 2026-09-30 (limit 6). Recent raises and filings may be missing. Re-run with --accept-stale-vintage to proceed knowingly; the report will state the age.
exit: 3
```

### 2.4 The timeline gate across dates

Only the run date and the days already used change, apart from the last line, which swaps in an older persona whose clock is already running (its file lacks a SOC code and an estimate of days to start, so those are given on the command line and recorded as such). Each command's first two output lines, then a table read from each run's log. (`<folder>` stands for a scratch folder outside the repository, so these runs did not write into it.)

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir <folder>/kiran-today
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
      timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-06-01 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir <folder>/kiran-2027-06-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 51 worth a closer look, 20 set aside, 2 held, 3 unresolved
      timeline factor 0.75 (buffer-partly-used); data vintage 2025-09-26, 20.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-08-01 --days-used 61 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir <folder>/kiran-2027-08-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (unemployment-ceiling-reached); data vintage 2025-09-26, 22.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2028-07-01 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir <folder>/kiran-2028-07-01
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (authorization-already-ended); data vintage 2025-09-26, 33.1 months old (accepted)
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona search/examples/priya-nair/profile.yml --soc 15-1252 --family backend-platform-swe --days-to-start 75 --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir <folder>/priya-nair-persona
    preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 0 worth a closer look, 71 set aside, 2 held, 3 unresolved
      timeline factor 0 (unemployment-ceiling-reached); data vintage 2025-09-26, 12.1 months old (accepted)
```

```text
scenario             factor  reason                         Apply Consider Skip  scored | expected start | unemployment days projected/ceiling
kiran-today          1       open                              51        8    12      71  | 2027-06-01 | 0/90
kiran-2027-06-01     0.75    buffer-partly-used                 0       51    20      71  | 2027-08-15 | 75/90
kiran-2027-08-01     0       unemployment-ceiling-reached       0        0    71      71  | 2027-10-15 | 136/90
kiran-2028-07-01     0       authorization-already-ended        0        0    71      71  | 2028-09-14 | 75/90
priya-nair-persona   0       unemployment-ceiling-reached       0        0    71      71  | 2026-12-14 | 109/90
```

Reading the table: today the candidate's clock has not started, so the gate is open and 51 companies are Apply. By June 2027 a 75-day process uses up part of the buffer (factor 0.75), so the same 51 drop to Consider and the rest to Skip. By August 2027, with 61 days already used, the ceiling would be exceeded and everything closes. The older persona's clock is already running, so the gate is closed today.

### 2.5 The scorer defect, shown

The same role (a Proven sponsor) scored under four profiles. The persona's own wording ("work authorized") makes the scorer drop the sponsorship term, and an explicit `needs_sponsorship: true` field is ignored:

```text
noprofile                  needs_sponsorship=true  composite=0.4462 => Apply | (0.9·0.35 + 0.7·0.3) × 1 × 0.85 = 0.446
safe-text                  needs_sponsorship=true  composite=0.4462 => Apply | (0.9·0.35 + 0.7·0.3) × 1 × 0.85 = 0.446
aarav-freetext             needs_sponsorship=false composite=0.1785 => Skip | (0.9·0 + 0.7·0.3) × 1 × 0.85 = 0.178
freetext-plus-explicit     needs_sponsorship=false composite=0.1785 => Skip | (0.9·0 + 0.7·0.3) × 1 × 0.85 = 0.178
```

The four profiles: `noprofile` is no profile file at all; `safe-text` is "F-1 STEM OPT (EAD); requires H-1B sponsorship"; `aarav-freetext` is the older persona's wording, "F-1 STEM OPT, work authorized (EAD)"; `freetext-plus-explicit` is that wording plus an explicit `needs_sponsorship: true`.

The recipe writes the scorer's profile itself, and gate G2 refuses to continue if the scorer's answer disagrees with the persona.

### 2.6 What the report says about the watchlist

The 11 sample names landed where the comments in the watchlist file say they should:

```text
name                       bucket                 tier                  scorer
DATABRICKS INC             advance                Proven                0.315 Apply
1UPHEALTH INC              advance                Proven                0.315 Apply
AKIA SYNDICATE             advance                Likely                0.210 Consider
REPLICATE INC              skip                   Thin                  0.105 Skip
ADAGIO MEDICAL INC         skip                   Thin                  0.105 Skip
MOBILIO LLC                skip                   Thin                  0.105 Skip
011235813 INC              hold_unknown           -                     -
1LIFE HEALTHCARE INC       hold_role_unverified   role-type-unverified  -
3AM Innovations            ambiguous              -                     -
Databriks Inc              not_found              -                     -
Nonexistent Example Corp   not_found              -                     -
```

## 3. Verified versus inferred, line by line

Every evidence value carries one of three labels. **record**: read from a repository data file, or plain arithmetic on record values. **your-input**: the persona, the run date and the parameters (which the assistant proposed and the author has not yet confirmed). **model-judgment**: a judgment a model makes about a company; the prototype makes none. Fields that only describe the run are marked run-metadata. The label of every row field is in the run log under `labels`.

Company DATABRICKS INC (a watchlist name), as it appears in the report:

| Line | Value | Label | Where it comes from |
|---|---|---|---|
| Company name | DATABRICKS INC | record | `company_name` |
| Approvals / denials | 1640 / 8 | record | `Total Approvals`, `Total Denials` |
| Approval rate | 99.51% | record (arithmetic) | equals the file's own `Approval_Rate` |
| Matching sponsored titles | Software Engineer; Senior Software Engineer | record, matched by a rule | `top_job_titles_sponsored` filtered by `role-families.json` |
| Tier | Proven | record, rule-derived | the thresholds are parameters proposed by the assistant |
| Latest raise | 2025-09-08, Series D+ | record | `latest_funding_date`, `latest_funding_stage` |
| Offered wage against the national median | 1.12x (149,423 over 133,080) | record over record | `median_salary_offered` and the BLS row |
| Form D sample | form-d-after-snapshot | record | two sample records show first sales on 2025-12-16 and 2025-09-30, both after the table's newest funding date (2025-09-26), which a snapshot cannot hold |
| Liveness gate value sent to the scorer | 1 | your-input (an unchecked placeholder) | "assume open until a person checks" |
| Timeline gate value | 1 | your-input | computed from the persona's dates |
| Composite and verdict | 0.315, Apply | record | the repository scorer: (0.9 x 0.35) x 1 x 1 |
| Model judgments about this company | none | | |

What each other kind of row rests on:

| Row | What is record | What is a rule or an input | What is absent, on purpose |
|---|---|---|---|
| AKIA SYNDICATE, Likely, Consider 0.210 | 6 approvals, 0 denials, title "Software Engineer", offered 135,000, raise 2024-09-09 | tier thresholds (input); 0.6 is the chapter 11 example value | fit is not scored, so 0.210 is capped |
| REPLICATE INC, Thin, Skip 0.105 | 4 approvals, 2 denials (66.67%), title "Infrastructure Engineer" | the Likely rate bar of 70 percent (input) | no claim that it does not sponsor |
| 011235813 INC, held: unknown | funded 2024-05-12; no sponsorship fields at all | none | no tier, no score, never skip |
| 1LIFE HEALTHCARE INC, held: role type unverified | 2 approvals, titles ["Senior Data Engineer"] | the title rule says not backend-style | no claim about backend roles |
| 3AM Innovations, ambiguous | two rows, INC and LLC, share the normalized name | exact normalized-name matching | no choice between the two |
| Databriks Inc, not found | nothing | exact matching only | no fuzzy guess at "Databricks" |

## 4. Verification

### 4.1 Report values against the raw file

The assistant read the raw rows with `grep` from the company table (contact columns left out), read the same companies from the run log, and redid the arithmetic independently:

```text
### Raw CSV rows, read with grep (columns 1,2,12-20 only; no contact fields)
--- DATABRICKS INC
  industry='Other Technology' | total_funding=18421062869.0 | latest=2025-09-08 Series D+ 1074999900.0 | approvals=1640.0 denials=8.0 rate=99.51456310679612 | median_offered=149422.5 | titles=['Software Engineer', 'Senior Software Engineer', 'Solutions Architect', 'Specialist Solutions Architect', 'Se
--- AKIA SYNDICATE
  industry='Other Technology' | total_funding=12879083.0 | latest=2024-09-09 Seed 4999998.0 | approvals=6.0 denials=0.0 rate=100.0 | median_offered=135000.0 | titles=['Software Engineer']
--- REPLICATE INC
  industry='Other Technology' | total_funding=39999970.0 | latest=2023-06-28 Series B 39999970.0 | approvals=4.0 denials=2.0 rate=66.66666666666666 | median_offered=162655.0 | titles=['Infrastructure Engineer']
--- MOBILIO LLC
  industry='Other Technology' | total_funding=1000000.0 | latest=2014-01-31 Pre-Seed 1000000.0 | approvals=0.0 denials=2.0 rate=0.0 | median_offered=72800.0 | titles=['Software Engineer']
--- 011235813 INC
  industry='Other' | total_funding=8499999.0 | latest=2024-05-12 Pre-Seed 1500000.0 | approvals= denials= rate= | median_offered= | titles=
--- 3AM INNOVATIONS INC
  industry='Other Technology' | total_funding=17000000.0 | latest=2025-01-13 Pre-Seed 5000000.0 | approvals= denials= rate= | median_offered= | titles=
--- 3AM INNOVATIONS LLC
  industry='Other Technology' | total_funding=1500000.0 | latest=2019-07-24 Pre-Seed 1500000.0 | approvals= denials= rate= | median_offered= | titles=

### What the run says about the same companies (run-log.json)
--- DATABRICKS INC | bucket: advance | tier: Proven | approvals/denials: 1640/8 | rate_pct: 99.51 | wage ratio: 1.12 | scorer: 0.315 Apply  [(0.9·0.35) × 1 × 1 = 0.315]
--- AKIA SYNDICATE | bucket: advance | tier: Likely | approvals/denials: 6/0 | rate_pct: 100 | wage ratio: 1.01 | scorer: 0.21 Consider  [(0.6·0.35) × 1 × 1 = 0.210]
--- REPLICATE INC | bucket: skip | tier: Thin | approvals/denials: 4/2 | rate_pct: 66.67 | wage ratio: 1.22 | scorer: 0.105 Skip  [(0.3·0.35) × 1 × 1 = 0.105]
--- MOBILIO LLC | bucket: skip | tier: Thin | approvals/denials: 0/2 | rate_pct: 0 | wage ratio: 0.55 | scorer: 0.105 Skip  [(0.3·0.35) × 1 × 1 = 0.105]
--- 011235813 INC | bucket: hold_unknown | tier: - | approvals/denials: - | rate_pct: - | wage ratio: - | scorer: -
--- 3AM Innovations | bucket: ambiguous | tier: - | approvals/denials: - | rate_pct: - | wage ratio: - | scorer: -

Databricks wage ratio, recomputed separately: 149423 / 133080 = 1.1228 -> reported 1.12 | offered 149422.5 | OEWS 2024 median for 15-1252 read from the BLS file: 133080
Databricks rate, recomputed separately: 100*1640/(1640+8) = 99.5146 -> reported 99.51

### The BLS row, read directly
   15-1252.00 15-1252 Software Developers | oews_year 2024 | annual_median_wage 133080.0
```

Every value the report shows equals the raw row, and both recomputed figures match.

### 4.2 The name rule against its Python original

The prototype's name matching is a port of the repository's `normalize_company_name`. Compared on every company name in the table and every Form D sample name:

```text
names compared (30,369 CSV company names + 200 Form D sample names): 30569
JS normalizeName vs Python normalize_company_name, differences: 0
```

The reader for the table's title lists was compared the same way with Python's `ast.literal_eval` (an independent review had found it dropped the backslash in escapes such as `\xa0`; it now decodes them):

```text
title cells compared (every non-blank top_job_titles_sponsored cell in the table): 1557
cells containing a backslash escape: 2
JS parseTitles vs Python ast.literal_eval, differences: 0
```

### 4.3 The funding column against Form D

Each Form D sample record was compared with the table company of the same normalized name (only unambiguous matches):

```text
company                            class                      table latest  form d first sale
DICKERSON PIKE LLC                 csv-has-no-funding         null          null
COMPOSABL INC                      form-d-newer-than-table    2024-12-18    2025-06-24
MAP THE SKY LLC                    csv-has-no-funding         null          null
FOUNDATION LLM TECHNOLOGIES INC    agrees                     2025-06-13    2025-06-13
13G30 LONDON LTD LIABILITY CO      csv-has-no-funding         null          null
STOP COLLABORATE LISTEN LLC        csv-has-no-funding         null          null
LAMINR TECHNOLOGIES INC            agrees                     2025-09-22    2025-09-22
RUNBUGGY OMI INC                   form-d-newer-than-table    2022-03-30    2025-09-18
NAVI AI INC                        agrees                     2025-09-16    2025-09-16
BLOSSOM BH OPCO INC                agrees                     2025-09-15    2025-09-15
DATABRICKS INC                     form-d-after-snapshot      2025-09-08    2025-12-16
DATABRICKS INC                     form-d-after-snapshot      2025-09-08    2025-09-30
CRYPTO CO                          form-d-after-snapshot      2017-12-12    2025-12-19
BG HOLDING CO LLC                  csv-has-no-funding         null          2025-11-26
GEARFLOW INC                       form-d-newer-than-table    2022-08-30    2024-07-11
```

Where both sources describe the same round (four companies) they agree exactly on date and amount. For three companies (Composabl, RunBuggy, Gearflow) the sample shows a first sale inside the table's own time span that the table missed, so the table's recency is a lower bound. For two companies (Databricks, twice, and Crypto Co) the first sale falls after the table's newest date, which a snapshot cannot hold, so that is not an error. Five matched companies have no funding in the table at all. Only samples ship, so this is a spot check of 15 records, not a verification of the column.

### 4.4 Tests and deliberate breaks

69 offline tests pass (on Node 26.10.0 and on Node 20.20.2), and 28 deliberate code breaks are each caught by at least one test (details, and the real gaps found along the way, are in `TEST-REPORT.md`). A fresh checkout of the branch, run on the same day, reproduces all six outputs of the sample run byte for byte; the scorer's own two files carry the date it ran, so on another day those two differ by that date.

### 4.5 Trying to break the real command

An older persona with no explicit `needs_sponsorship` is refused, naming every problem and inventing no default:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona search/examples/aarav-patel/profile.yml --out-dir <folder>/x
InputError: persona check failed (4 problems)
  - needs_sponsorship must be true or false (an explicit field; free text is not read)
  - target_role.soc must be a SOC code like "15-1252" (or pass --soc)
  - target_role.family must name a role family in role-families.json (or pass --family)
  - timeline_assumptions.expected_days_to_start must be a whole number >= 0 (or pass --days-to-start)
exit: 2
```

A SOC code with no wage row still runs, and says the wage comparison is missing (the wrong-scorer and renamed-column breaks are in the tests):

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --soc 99-9999 --out-dir <folder>/soc
preopt-sponsor-tiers: 67 evaluated (0 watchlist, 67 pool) -> 58 worth a closer look, 9 set aside, 0 held, 0 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote <scratch>/soc/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit: 0
bls_reference: {"status":"missing","reason":"no-soc-row","soc":"99-9999"}
a row wage field: {"status":"missing","reason":"bls-no-soc-row","offered":134000}
G1 note: role family backend-platform-swe is defined for SOC 15-1252; this run uses SOC 99-9999 only for the wage reference
```

A persona outside `search/examples/` is treated as real data and may not write into a tracked folder:

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --persona /tmp/my-own-persona.yml   (default output folder, which is a tracked folder)
InputError: this persona is outside search/examples/, so it is treated as real data, and the output folder is inside the repository but not under private/
  - persona: /tmp/my-own-persona.yml
  - output folder: course/2026fa/submissions/aravindkumar2504/runs/2026-09-30
  - pass --out-dir private/<name> (gitignored) or a folder outside the repository; committing a real persona's dates is a zero-condition offense (DATA_CONTRACT.md)
exit: 2
```

### 4.6 The title rule

An 80-title sample drawn with a fixed seed and labelled by the assistant is in `title-matcher-check.md`: of 40 accepted titles, 3 were clear false positives (a UX title and two perception specializations) and 5 borderline; of 40 rejected titles containing "engineer", "developer" or "technical", 1 was a clear miss ("Member, Technical Staff", a comma variant) and 3 borderline. One labeller, an AI assistant, not yet checked by the author, so treat it as indicative.

## 5. Reflection

*Written by the assistant. The first person below means the assistant, not the author. The author's own reflection is not written here and is for the author to add.*

**What worked.** Keeping "unknown" separate from "no" turned a 5.1 percent coverage number into the honest headline instead of a hidden weakness. Checking the scorer's own answer caught a defect that would have silently turned a proven sponsor into a Skip. Running the deliberate-break harness found a real gap in my own tests, the fresh-checkout comparison found a real defect in my own output (a run log that recorded an absolute path from this machine), and an independent read-only audit found more, including that the title-list reader mangled escaped characters and that the privacy guard was narrower than I had claimed (all fixed, each with a test).

**What the recipe and prototype got wrong or missed.**
- *The predictions, scored.* P1 (title errors) partly right: some misfiles occurred, but the clear false positives were a UX title and perception specializations, not the testing, sales or support titles I predicted (those were excluded by design); and the unusual title I predicted would be missed was matched in its standard form, "Member of Technical Staff", but its comma variant, "Member, Technical Staff", was missed. P2 (the timeline gate is exactly 1.0 today) right: all 71 scored roles carry factor 1. P3 (a pool of 60 to 160 companies) right: 67 companies met the stated conditions and 65 remain once the candidate's own list and one ambiguous name are set aside; but "fewer than half reach the top tier" was wrong: 49 of the 65 pool companies (75 percent) are Proven. P4 (a poor hiring target in the top 15) right: Intel Corp, with 13,318 reported approvals and a "Series B" dated 2025-03-18, is 13th of the first 15, which does not fit the idea of a recently funded startup.
- *The independent review.* A second, read-only assistant task audited the branch. Its confirmed findings, all fixed: a local path in the first sample-run commit (the history was re-cut before anything was pushed); the assistant's proposals worded as the author's; "same bytes" false for the scorer's own two files; a privacy guard that missed sample runs and watchlists; the title reader dropping backslashes (526 matching-title records, not 525); the harness counting each failure twice; a report reason that blamed thin evidence for timeline demotions; no timeline formula in the recipe. One finding is left as the author's decision: the recipe claims RUNNABLE-SAMPLE with nine open TODOs, whereas the repository's four other RUNNABLE-SAMPLE recipes have none.
- *A wrong claim of mine, corrected.* I told the author the Form D samples match none of the table's companies; that used a crude name normalizer. The repository's rule finds 15 of 200. The correction is in the change brief's revisions.
- *Company level is not entry level.* Of the 59 companies that advance, 21 list only senior-marked titles, which is no evidence that they sponsor a new graduate. The report shows the flag; the tier does not use it.
- *"Recently funded" is a weak proxy.* Three advancing companies report more than a thousand approvals each (Databricks, Intel, Stripe). Nine of the 59 offer a median wage under 0.8 times the national median, which is a prompt for a person to look.
- *Fit is not scored,* so the composite cannot exceed 0.315; a timeline factor under about 0.95 already moves a Proven company from Apply to Consider.
- *Unexplained data.* Every count is even and has no year; and a very large enterprise-software company appears with only 2 reported approvals, which suggests counts under-represent companies whose names join imperfectly (an inference, not checked against filings).
- *Nothing about any posting was checked.* Gates H1 and H2 are open on every row.

**One concrete next improvement.** (A smaller one first: let the title rule accept the comma variant "Member, Technical Staff"; it was left alone here so the sample stays a test of the rule as used.) Then build the reading half of gate H2: given the text of one posting, print every sentence that mentions U.S.-person or export-control status, "no sponsorship", a graduation window or a start date, quoted, and stop. A person still clears it. Acceptance test: three synthetic postings, each with one planted trap and one clean control, flagged and unflagged as expected. The matching step for a person: clear H1 and H2 by hand for the top three advancing companies and record the results in the run log, which is the evidence a live-run claim would need.

## 6. Attestation

- Recipe: aravindkumar2504-preopt-swe-sponsor-tiers v0.1.0
- By: Claude Code (Sonnet 5.5), working with Aravind Sundaravadivelu, 2026-09-30. The author has not yet read the report or these results; the adequacy of the sample run is unsigned. This is a record of what was run, not a human sign-off, and the recipe's attestation field stays null.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| The documented sample command | exit 0; 76 evaluated: 59 worth a closer look, 12 set aside, 2 held, 3 unresolved | exit 0; both outputs written; every gate has a status |
| The same command without the acceptance flag | exit 3, refusal message, no folder created | refuse and write nothing |
| Deliberate break: an older persona with no explicit `needs_sponsorship` | exit 2, four problems named | refuse; invent no default |
| Deliberate break: a wrong stand-in scorer (test) | exit 4 and nothing written; a crashing stand-in gives exit 5 | abort with a clear message |
| Deliberate break: 28 code mutations | all 28 caught by at least one test | every break caught |
| Deliberate break: a renamed table column (test) | exit 2 naming the column | stop and name it |
| Deliberate break: a real persona aimed at a tracked folder | exit 2, refusal message | refuse |
| A SOC code with no wage row | run completes; wage comparison reported missing | continue; invent nothing |
| Authorization end date already past (run date 2028-07-01) | factor 0; all 71 scored roles Skip | zero, with the reason |
| Seven raw rows compared with the report (by the assistant) | every value equal; both recomputed figures equal | equal |
| The JavaScript name rule against the Python original, 30,569 names; the title reader against `ast.literal_eval`, 1,557 cells | 0 differences in each | 0 |
| A fresh checkout of the branch | 69 tests pass; six outputs identical to the committed ones (same day) | reproducible |
| The suite and the sample command under Node 20.20.2 | 69 of 69 pass; the sample run wrote the same bytes | the same as Node 26 |
| Deliberate break: a real persona, and a watchlist that is not a committed sample, aimed at a tracked folder; a sample run aimed at another tracked file | each refused with exit 2 | refuse |

### Did not test

- Any live posting: gate H1 (liveness) was not run on any shortlisted company, and gate H2 (reading a posting) was not done.
- Whether any "Apply" company would in fact sponsor this candidate: there is no outcome data.
- The title rule beyond 80 titles and one labeller (the assistant, not yet checked by the author); recall over titles without "engineer", "developer" or "technical".
- Behavior on another operating system (only macOS was used), or with the full Form D quarters.
- Whether the thresholds and the timeline rule suit anyone but the fictional persona; they are the author's to confirm.

### Broke during testing, fixed

- **Found by the independent review:** the title-list reader dropped the backslash in escapes (fixed, with a check against Python on every title cell); a local path in the first sample-run commit (history re-cut before any push); a privacy guard that did not cover sample runs or watchlists (fixed); the harness counted each failing test twice (fixed); a report reason that blamed thin evidence for a timeline demotion (fixed); malformed persona YAML gave a stack trace (fixed); a mistyped Form D folder reported zero silently (fixed).
- A test gap: swapping the "Form D newer" and "older" labels went unnoticed because the fixture had one of each and the test compared totals. The test now checks each company.
- Wrong expected numbers in my own tests (a fixture count of 14 instead of 15, a run date that put an older persona before its clock started, a wrong discovery order, a variable typo): fixed in the tests, not the code.
- The break harness left files in the repository when the privacy guard was broken; the test now cleans up in a `finally` block.
- The run log recorded an absolute path from this machine; it now records repository-relative paths and a test guards it.
- The documented test command, `node --test <directory>`, would recurse into every file on Node 20; it is now an explicit `*.test.mjs` glob.
