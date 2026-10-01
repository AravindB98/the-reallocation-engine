# Sponsor-tier shortlist for a pre-OPT backend software candidate

## Executive summary

This report looks at companies for one candidate: an international student who graduates soon, has not yet started work authorization, and wants a backend software job with a company that will sponsor a work visa. For each company it shows what public records say about sponsoring that kind of job, how much evidence stands behind it, and where the evidence is missing.

It is worth reading because it keeps three things apart that job boards blur together: a company with a real history of sponsoring this kind of role, a company that has sponsored something else, and a company the data simply says nothing about. Silence is never treated as a no.

On this run 76 companies were evaluated (11 names from the candidate's own list and 65 found by search). 59 look worth a closer look, 12 were set aside because the evidence is thin or the timeline is closed, 2 were held because the data cannot judge them, and 3 could not be matched to a single record. The data is 12.1 months old and this run was told to accept that, and nothing here shows that any job exists: every company still needs a person to confirm a live posting and read it for traps the data cannot see.

## Read this first

- **Evidence coverage:** only 1,557 of 30,369 companies (5.1%) have any sponsorship record at all. Everyone else is unknown, not a no.
- **The data's age:** its newest funding date is 2025-09-26. "Recent" here means recent as of that date, and the Form D check below shows the funding column can lag behind.
- **Counts are as reported:** every approval and denial count in the file is an even number and the cause is undocumented, so the tier thresholds were set to survive a possible double count.
- **Two human gates stay open on every row:** H1 (is there a live posting?) and H2 (does the posting hide an eligibility trap such as U.S.-person wording, "no sponsorship", a graduation window, or a start date before authorization begins?).
- **Fit is not scored:** deciding whether a role suits the candidate needs a person or a model reading a posting, so the scorer's fit term is left empty. That caps the composite (see the recipe).

## Where each column comes from

| Column | Label | Where it comes from |
|---|---|---|
| Company, Approvals / denials (rate), Latest raise, Form D sample | record | the company table and the Form D samples |
| Matching sponsored titles | record, kept by a your-input rule | the table's titles that match the role family in role-families.json (a rule proposed by the assistant, not yet confirmed by the author) |
| Tier | record classified by a your-input rule | counts from the table; the thresholds are parameters proposed by the assistant (not yet confirmed by the author) |
| Level note | record read by a rule | the matched titles and a list of senior markers |
| Offered wage vs national median | record divided by record | the table's median offered wage and the national median in the BLS extract |
| Composite and scorer verdict | your-input (derived) | the repository scorer: the tier's fixed value, times its weight, times the liveness placeholder and the timeline factor, both your-input |
| Why, Next action, What the record shows | run-metadata | this program's plain-language explanation; it is not evidence |

## From the whole dataset to this list

| Step | Companies |
|---|---|
| In the dataset | 30,369 |
| With any sponsorship record (the other 28,812 are unknown: not scored, not skipped) | 1,557 |
| ...whose listed titles include a backend-style title | 526 |
| ...that also raised money within 24 months of the data's newest date | 68 |
| ...of those, leaving out 2 already on the candidate's own list, 1 whose name is shared with another row: the discovery pool | 65 |
| Scored by the repository's scorer (pool plus any watchlist companies with a matching title) | 71 |
| Worth a closer look (Apply 51, Consider 8) | 59 |
| Set aside (Skip 12) | 12 |

The first two rows are plain counts of the table (record). Every row after them counts table rows kept by a your-input rule: the backend-title rule, the funding window and the candidate's own list.

The repository scorer's own skip rate here is 17% (12 of 71 scored roles), below the roughly 50% its own report calls healthy. It is low because the scorer only sees companies that already passed the evidence filters above. Measured against the whole dataset, 99.8% of the 30,369 companies were not advanced, but mostly because the data says nothing about them (unknown), not because anything scored them Skip.

## Gates

| Gate | Status | What a person sees |
|---|---|---|
| G0 data vintage | stale-accepted | newest funding date 2025-09-26, 12.1 months before the run date 2026-09-30 (limit 6) |
| G1 persona | pass | fields read: needs_sponsorship, target_role.soc, target_role.family, visa.ead_start_date, visa.opt_end_date, visa.unemployment_days_used, visa.unemployment_ceiling, visa.buffer_target, timeline_assumptions.expected_days_to_start |
| G2 scorer integrity | pass | scorer echoed needs_sponsorship=true, persona says true; 71 roles checked |
| G3 timeline | factor 1 (open) | run date 2026-09-30; authorization starts 2027-06-01; expected start 2027-06-01; 0 of 90 unemployment days projected at start (buffer 20); authorization ends 2028-05-31 |
| H1 liveness | OPEN on every row | a person must find a posting URL and run the liveness check |
| H2 posting eligibility | OPEN on every row | a person must read the posting |

The timeline factor is a planning multiplier built from the candidate's own dates, not legal advice; STEM eligibility and the unemployment ceiling are for the school's international office to confirm.

## Worth a closer look (59)

Showing 18 of 59. What to do next: **Apply** means Find a live backend posting, run the liveness check (gate H1) and read the posting for eligibility traps (gate H2). Only if both clear does this earn a tailored application. **Consider** means Do not tailor yet. Use the networking block: ask a recruiter or engineer whether the company sponsors backend hires, then decide.

| Company | From | Tier | Approvals / denials (rate) | Matching sponsored titles | Level note | Latest raise | Offered wage vs national median | Form D sample | Composite and scorer verdict |
|---|---|---|---|---|---|---|---|---|---|
| DATABRICKS INC | watchlist | Proven | 1640 / 8 (99.51%) | Software Engineer; Senior Software Engineer | includes titles without a senior marker | 2025-09-08 Series D+ | 1.12x ($149,423) | form-d-filed-after-table-end | 0.315 Apply |
| 1UPHEALTH INC | watchlist | Proven | 12 / 0 (100%) | Senior Software Engineer | all matched titles senior marked | 2023-04-03 Series C | 0.96x ($127,500) | no sample record | 0.315 Apply |
| AKIA SYNDICATE | watchlist | Likely | 6 / 0 (100%) | Software Engineer | includes titles without a senior marker | 2024-09-09 Seed | 1.01x ($135,000) | no sample record | 0.210 Consider |
| SPANIO INC | pool | Proven | 56 / 0 (100%) | Senior Device Software Engineer | all matched titles senior marked | 2025-09-11 Series B | 1.01x ($134,000) | no sample record | 0.315 Apply |
| GRAMMARLY INC | pool | Proven | 156 / 6 (96.3%) | Software Engineer | includes titles without a senior marker | 2025-07-17 Series D+ | 1.58x ($210,000) | no sample record | 0.315 Apply |
| CENTIFIC GLOBAL SOLUTIONS INC | pool | Proven | 22 / 0 (100%) | Software Development Engineer | includes titles without a senior marker | 2025-06-10 Series C | 0.68x ($90,054) | no sample record | 0.315 Apply |
| OBSERVE INC | pool | Proven | 20 / 0 (100%) | Senior Software Engineer | all matched titles senior marked | 2025-05-22 Series D+ | 1.19x ($158,080) | no sample record | 0.315 Apply |
| PSIQUANTUM CORP | pool | Proven | 26 / 0 (100%) | Senior Software Engineer, Generalist | all matched titles senior marked | 2025-05-15 Series B | 1.38x ($184,163) | no sample record | 0.315 Apply |
| COHERE HEALTH INC | pool | Proven | 104 / 2 (98.11%) | Senior Software Engineer, Platform; Senior Machine Learning DevOps Engineer; Software Engineer II | includes titles without a senior marker | 2025-05-07 Series C | 1.2x ($160,000) | no sample record | 0.315 Apply |
| TWIN HEALTH INC | pool | Proven | 40 / 0 (100%) | Senior Backend Engineer | all matched titles senior marked | 2025-05-07 Series C | 1.06x ($141,250) | no sample record | 0.315 Apply |
| VIDMOB INC | pool | Proven | 22 / 0 (100%) | Software Engineer | includes titles without a senior marker | 2025-04-24 Series A | 0.66x ($88,000) | no sample record | 0.315 Apply |
| APEX TECHNOLOGY INC | pool | Proven | 62 / 0 (100%) | Software Developer | includes titles without a senior marker | 2025-04-16 Series D+ | 0.75x ($99,500) | no sample record | 0.315 Apply |
| FOURSQUARE LABS INC | pool | Proven | 56 / 0 (100%) | Software Engineer; Staff Engineer (Full Stack) | includes titles without a senior marker | 2025-04-07 Seed | 1.43x ($190,000) | no sample record | 0.315 Apply |
| KOGNITOS INC | pool | Proven | 16 / 0 (100%) | Member of Technical Staff | includes titles without a senior marker | 2025-03-24 Series B | 1.09x ($145,000) | no sample record | 0.315 Apply |
| MERCURY TECHNOLOGIES INC | pool | Proven | 40 / 0 (100%) | Senior Software Engineer | all matched titles senior marked | 2025-03-21 Series D+ | 1.38x ($184,000) | no sample record | 0.315 Apply |
| INTEL CORP | pool | Proven | 13318 / 366 (97.33%) | Software Engineer | includes titles without a senior marker | 2025-03-18 Series B | 0.87x ($115,898) | no sample record | 0.315 Apply |
| DILIGENT ROBOTICS INC | pool | Proven | 20 / 2 (90.91%) | Staff Software Engineer | all matched titles senior marked | 2025-02-13 Series A | 1.43x ($190,000) | no sample record | 0.315 Apply |
| APPTRONIK INC | pool | Proven | 56 / 2 (96.55%) | Software Engineer III | includes titles without a senior marker | 2025-01-31 Series D+ | 0.77x ($102,471) | no sample record | 0.315 Apply |

## Set aside on the evidence (12)

Showing 10 of 12; all are in the run log.

| Company | From | Tier | Approvals / denials (rate) | Composite and scorer verdict | Why |
|---|---|---|---|---|---|
| REPLICATE INC | watchlist | Thin | 4 / 2 (66.67%) | 0.105 Skip | a matching title exists but 4 approvals at 66.67% is below the Likely bar |
| ADAGIO MEDICAL INC | watchlist | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| MOBILIO LLC | watchlist | Thin | 0 / 2 (0%) | 0.105 Skip | a matching title exists but the record shows 0 approvals and 2 denials, a negative record, below the Likely bar |
| SERVICENOW INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| LUMEN ENERGY INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| RAISE ROBOTICS INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| MISO ROBOTICS INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| BELFRY SOFTWARE INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| LEVELTEN ENERGY INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |
| ELISITY INC | pool | Thin | 2 / 0 (100%) | 0.105 Skip | a matching title exists but 2 approvals at 100% is below the Likely bar |

## Held, not skipped (2)

| Company | What the record shows | Next action |
|---|---|---|
| 011235813 INC | no H-1B record under this exact name; the record may be genuinely absent or filed under another name (silent, not negative) | The data is silent, not negative. Look for a direct signal (careers-page wording, a recent hire's post, a question to a recruiter) before spending any tailoring time. |
| 1LIFE HEALTHCARE INC | the record lists sponsored titles, but none of them match this role family; the list is capped, so this is not evidence that the company does not sponsor it; listed titles: Senior Data Engineer | The company has sponsored other kinds of roles. Check whether it sponsors backend titles (its listed titles are in the run log) before deciding. |

## Not resolved (3)

| Company | What the record shows | Next action |
|---|---|---|
| 3AM Innovations | 2 dataset rows share this normalized name: 3AM INNOVATIONS INC; 3AM INNOVATIONS LLC | More than one dataset row shares this name after normalization. Pick the right entity by hand before using any number. |
| Databriks Inc | no dataset row has this name after normalization (exact match only, no fuzzy matching) | Not in this dataset. Check the spelling; if it is right, the dataset cannot say anything about this company. |
| Nonexistent Example Corp | no dataset row has this name after normalization (exact match only, no fuzzy matching) | Not in this dataset. Check the spelling; if it is right, the dataset cannot say anything about this company. |

## Funding cross-check against the shipped Form D samples

200 sample records were examined; 15 matched exactly one dataset company by normalized name (14 distinct companies, because a company can have more than one sample record; 0 were ambiguous, 185 had no match). Of the matched records: agrees 4, form-d-missed-by-table 1, form-d-filed-after-table-end 5, form-d-older 0, same-date-amount-differs 0, csv-has-no-funding 5, form-d-has-no-first-sale 0.

"form-d-missed-by-table" means the sample shows a first sale later than the table's date for that company, and the form was filed on or before the table's newest funding date, so the table could have held it and did not: the funding column lagged. "form-d-filed-after-table-end" means the form was filed after the table's newest funding date, so the table may simply predate it: that is not counted as a miss. Only samples ship, so this is a spot check on a small subset, not a verification of the column.

## Run record

- **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.1.0. **Run date (your-input):** 2026-09-30. **Values a model produced about a company while this program ran:** 0.
- **Inputs (path, sha256):** csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` `eccdee2addf4`; bls: `data/bls/compact/soc_occupation_compact.csv` `bac5acf77ca2`; persona: `search/examples/kiran-rao/profile.yml` `0a3eac2dc4e9`; params: `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/params.json` `a0ed8c5ce646`; role_families: `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/role-families.json` `89d71064b1b5`; scorer: `scripts/score/role-scorer.mjs` `8655e182c3c2`; watchlist: `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt` `0b82f1063527`.
- **Code that produced this run:** prototype files combined sha256 `2004b8a80631` (per-file hashes in the run log); scorer `scripts/score/role-scorer.mjs` sha256 `8655e182c3c2`.
- **Parameters (labelled your-input because they are inputs to the run; proposed by the assistant, not yet confirmed by the author):** vintage limit 6 months; funding window 24 months; Proven at least 10 approvals and 90%; Likely at least 4 and 70%; expected days to start 75.
- **Scorer:** `node scripts/score/role-scorer.mjs course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/roles.json --profile course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/scorer-profile.json --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30`; outputs `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/roles.json`, `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/scorer-profile.json`, `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/role-scores.json`, `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/role-scores.md`.
- **Label legend:** record = read from a repo data file or arithmetic on record values; your-input = the persona values, the run date and the parameters (proposed by the assistant, not yet confirmed by the author); model-judgment = none made about a company here; run-metadata = describes the run and is not evidence. Per-field labels are in the run log under `labels`.
