## Executive summary

This is the worked run of a screening tool for a fictional international student, Sasha Jones, looking for an entry-level data scientist job with visa sponsorship. It shows exactly what was run on 21 October 2026, the real output, and what a person found when checking the results by hand. Read it to judge whether the tool can be trusted, and where it cannot.

The tool checked 13 real public job postings. It caught last month's false positive (a listing site showing a job removed in June 2025 as open) and correctly marked two closed jobs as closed. It recommended applying to three postings. A person then opened every recommendation. One of the three was not the job at all: the link landed on the company's list of all jobs. One real open job was held because the tool could not see its Apply button. A third gap, an unlisted job-listing site treated as the employer, was only avoided by accident. After the human review, one posting is worth applying to and one is worth considering. The tool stays a draft until the gaps listed at the end are closed.

## Inputs

- **Persona:** Sasha Jones, **fictional**. F-1, graduating 2026-12-18, OPT EAD expected 2027-01-05, target SOC 15-2051. File: `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json`.
- **Candidates:** `worked-run/candidates.real.json`. 13 real public postings. Rows 1–8 repeat the 2026-10-03 worked run (same company names and URLs). Rows 9–11 are current postings found on 2026-10-21 via the public Greenhouse job-board API and web search. Row 12 is a deliberately broken employer link. Row 13 is the same Instacart role on a job board not in the aggregator list.
- **Sponsorship records:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- **Aggregator list:** `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/aggregators.json` (14 domains).
- **Run date:** `--today 2026-10-21`.

Fit provenance per row:

| Row | Company (as entered) | Title | URL(s) | Fit | Fit source |
|---|---|---|---|---|---|
| 1 | Maplebear Inc | Data Scientist | https://builtin.com/job/data-scientist/3375738 | 0.5 | your-input (2026-10-03 candidates file) |
| 2 | Instacart | Data Scientist | https://builtin.com/job/data-scientist/3375738 | 0.5 | your-input (2026-10-03 candidates file) |
| 3 | Airbnb | Staff Data Scientist, Locations | https://boards.greenhouse.io/airbnb/jobs/6768605 | 0.2 | your-input (2026-10-03 candidates file) |
| 4 | Airbnb Inc | Data Scientist, Platform | https://careers.airbnb.com/positions/6632687 | 0.4 | your-input (2026-10-03 candidates file) |
| 5 | Airbnb Inc | Staff Data Scientist, Locations | https://boards.greenhouse.io/airbnb/jobs/6768605 | 0.2 | your-input (2026-10-03 candidates file) |
| 6 | Figma Inc | Data Scientist | https://job-boards.greenhouse.io/figma/jobs/5552580004 | 0.4 | your-input (2026-10-03 candidates file) |
| 7 | Nextdoor Inc | Data Scientist - Search (Senior) | https://www.builtinaustin.com/job/data-scientist-search/9459092 | 0.3 | your-input (2026-10-03 candidates file) |
| 8 | $AVY INC | Data Scientist (no posting found) | — | 0.5 | your-input (2026-10-03 candidates file) |
| 9 | Moloco Inc | Data Scientist II, Product - Moloco Commerce Media | https://job-boards.greenhouse.io/moloco/jobs/7985823003 | 0.5 | proposed by Claude Code, accepted by rithika-sr |
| 10 | Maplebear Inc | Senior Data Scientist I - Meals (US remote) | https://job-boards.greenhouse.io/instacart/jobs/8236905 | 0.3 | proposed by Claude Code, accepted by rithika-sr |
| 11 | Nextdoor Inc | Senior Data Scientist - Search | https://www.builtinaustin.com/job/data-scientist-search/9459092 + employer https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | 0.3 | proposed by Claude Code, accepted by rithika-sr |
| 12 | Moloco Inc | Data Scientist (deliberately broken employer_url) | https://builtin.com/company/moloco/jobs + employer https://job-boards.greenhouse.io/moloco/jobs/9999999999 | 0.5 | proposed by Claude Code, accepted by rithika-sr |
| 13 | Maplebear Inc | Senior Data Scientist I - Meals (US remote) | https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals | 0.3 | proposed by Claude Code, accepted by rithika-sr |

## Commands and real output

All output below is pasted from the terminal transcripts in `worked-run/terminal/`.

### Tests

`worked-run/terminal/T1-tests.txt`

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v 2>&1 | sed -e "s#$HOME#~#g" -e "s#/var/folders/[^ ]*/T/#<tmp>/#g"
# (sed redacts the home folder and macOS temp folder from the out-dir refusal messages; nothing else is changed)
test_every_aggregator_has_a_reason (test_mode_run.AggregatorMatching.test_every_aggregator_has_a_reason) ... ok
test_lookalike_hosts_do_not_match (test_mode_run.AggregatorMatching.test_lookalike_hosts_do_not_match) ... ok
test_subdomain_matches (test_mode_run.AggregatorMatching.test_subdomain_matches) ... ok
test_worked_run_aggregators_listed (test_mode_run.AggregatorMatching.test_worked_run_aggregators_listed) ... ok
test_scorer_not_called_when_every_role_is_held (test_mode_run.AllHeld.test_scorer_not_called_when_every_role_is_held) ... ok
test_inferred_fit_and_notes_are_flagged (test_mode_run.FitSourceAndNotes.test_inferred_fit_and_notes_are_flagged) ... ok
test_aggregator_active_employer_expired_is_closed (test_mode_run.FixtureRun.test_aggregator_active_employer_expired_is_closed) ... ok
test_aggregator_only_active_is_held (test_mode_run.FixtureRun.test_aggregator_only_active_is_held) ... ok
test_aggregator_plus_active_employer_passes (test_mode_run.FixtureRun.test_aggregator_plus_active_employer_passes) ... ok
test_both_outputs_written (test_mode_run.FixtureRun.test_both_outputs_written) ... ok
test_closed_shows_in_report_without_score (test_mode_run.FixtureRun.test_closed_shows_in_report_without_score) ... ok
test_default_fit_source_is_your_input (test_mode_run.FixtureRun.test_default_fit_source_is_your_input) ... ok
test_employer_only_active_passes (test_mode_run.FixtureRun.test_employer_only_active_passes) ... ok
test_held_and_closed_roles_never_reach_the_scorer (test_mode_run.FixtureRun.test_held_and_closed_roles_never_reach_the_scorer) ... ok
test_log_has_no_home_folder (test_mode_run.FixtureRun.test_log_has_no_home_folder) ... ok
test_log_records_today_hashes_and_command_line (test_mode_run.FixtureRun.test_log_records_today_hashes_and_command_line) ... ok
test_no_sponsorship_record_gets_no_score_and_no_check (test_mode_run.FixtureRun.test_no_sponsorship_record_gets_no_score_and_no_check) ... ok
test_non_aggregator_posting_expired_is_closed (test_mode_run.FixtureRun.test_non_aggregator_posting_expired_is_closed) ... ok
test_not_in_csv_is_held_at_g1 (test_mode_run.FixtureRun.test_not_in_csv_is_held_at_g1) ... ok
test_raw_liveness_output_preserved_verbatim (test_mode_run.FixtureRun.test_raw_liveness_output_preserved_verbatim) ... ok
test_report_has_one_row_per_role (test_mode_run.FixtureRun.test_report_has_one_row_per_role) ... ok
test_report_opens_with_executive_summary_in_plain_language (test_mode_run.FixtureRun.test_report_opens_with_executive_summary_in_plain_language) ... ok
test_scored_roles_get_scorer_decisions (test_mode_run.FixtureRun.test_scored_roles_get_scorer_decisions) ... ok
test_uncertain_is_held (test_mode_run.FixtureRun.test_uncertain_is_held) ... ok
test_unparseable_output_is_held (test_mode_run.FixtureRun.test_unparseable_output_is_held) ... ok
test_url_missing_from_offline_fixture_is_held (test_mode_run.FixtureRun.test_url_missing_from_offline_fixture_is_held) ... ok
test_aggregator_expired_alone_is_held_not_closed (test_mode_run.G2Decide.test_aggregator_expired_alone_is_held_not_closed) ... ok
test_aggregator_expired_does_not_close_an_uncertain_employer (test_mode_run.G2Decide.test_aggregator_expired_does_not_close_an_uncertain_employer) ... ok
test_all_deciding_pages_active_passes (test_mode_run.G2Decide.test_all_deciding_pages_active_passes) ... ok
test_deciding_page_expired_is_closed (test_mode_run.G2Decide.test_deciding_page_expired_is_closed) ... ok
test_expired_outranks_uncertain_sibling (test_mode_run.G2Decide.test_expired_outranks_uncertain_sibling) ... ok
test_unparseable_is_held_not_closed (test_mode_run.G2Decide.test_unparseable_is_held_not_closed) ... ok
test_dotdot_escape_refused (test_mode_run.OutDirContainment.test_dotdot_escape_refused) ... ✗ stopped: --out-dir ~/Documents/the-reallocation-engine/course/2026fa/submissions/rithika-sr/../../mode-escape-test is outside my allowed folders; refusing to write
ok
test_sibling_prefix_refused (test_mode_run.OutDirContainment.test_sibling_prefix_refused) ... ✗ stopped: --out-dir ~/Documents/the-reallocation-engine/course/2026fa/submissions/rithika-sr-evil is outside my allowed folders; refusing to write
ok
test_tmp_refused (test_mode_run.OutDirContainment.test_tmp_refused) ... ✗ stopped: --out-dir <tmp>/mode-escape-test is outside my allowed folders; refusing to write
ok
test_tracked_repo_folder_refused (test_mode_run.OutDirContainment.test_tracked_repo_folder_refused) ... ✗ stopped: --out-dir ~/Documents/the-reallocation-engine/data/examples is outside my allowed folders; refusing to write
ok
test_active (test_mode_run.Parser.test_active) ... ok
test_exit_code_disagreeing_with_result_is_uncertain (test_mode_run.Parser.test_exit_code_disagreeing_with_result_is_uncertain) ... ok
test_missing_summary_line_is_uncertain (test_mode_run.Parser.test_missing_summary_line_is_uncertain) ... ok
test_result_for_another_url_is_uncertain (test_mode_run.Parser.test_result_for_another_url_is_uncertain) ... ok
test_timeout_exit_none_is_uncertain (test_mode_run.Parser.test_timeout_exit_none_is_uncertain) ... ok

----------------------------------------------------------------------
Ran 41 tests in 0.187s

OK
scorer not run: no role cleared the gates
✓ mode: 2 roles → 0 scored, 0 closed, 2 held {'G1': 1, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-ry6kiplw/out/mode-log.json + mode-report.md
✓ scored 1 roles → Apply 0 · Consider 1 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-7wjv_32c/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-7wjv_32c/out/role-scores.md
✓ mode: 1 roles → 1 scored, 0 closed, 0 held {} → course/2026fa/submissions/rithika-sr/mode/.test-7wjv_32c/out/mode-log.json + mode-report.md
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-k3ebt_dz/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-k3ebt_dz/role-scores.md
✓ mode: 11 roles → 3 scored, 2 closed, 6 held {'G1': 2, 'G2a': 3, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-k3ebt_dz/mode-log.json + mode-report.md
[exit 0]
```

### D1 — live run

`worked-run/terminal/D1-live-run.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out
✓ scored 3 roles → Apply 3 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out/role-scores.md
✓ mode: 13 roles → 3 scored, 2 closed, 8 held {'G1': 3, 'G2a': 2, 'G2b': 3} → course/2026fa/submissions/rithika-sr/mode/worked-run/out/mode-log.json + mode-report.md
[exit 0]
```

### D2 — offline reproducibility run, twice

`worked-run/terminal/D2-offline-run.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline/role-scores.md
✓ mode: 11 roles → 3 scored, 2 closed, 6 held {'G1': 2, 'G2a': 3, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline/mode-log.json + mode-report.md
[exit 0]

$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline-repeat
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline-repeat/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline-repeat/role-scores.md
✓ mode: 11 roles → 3 scored, 2 closed, 6 held {'G1': 2, 'G2a': 3, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline-repeat/mode-log.json + mode-report.md
[exit 0]

$ diff out-offline/mode-report.md out-offline-repeat/mode-report.md
REPRODUCED: mode-report.md identical

$ field-level diff of the two mode-log.json files
  differs: .command_line[11]
  differs: .scorer.stdout
  (only the --out-dir path differs; every gate result, raw liveness record and decision is identical)
```

### D3 — ats:scan dry run (before a portals file existed)

`worked-run/terminal/D3-ats-scan-dry-run.txt`

```text
$ npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
[exit 1]
```

### D3b — ats:scan dry run (example portals file copied to the gitignored `data/ats/portals.yml`)

`worked-run/terminal/D3b-ats-scan-dry-run.txt`

```text
$ npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      898
Filtered by title:     401 removed
Filtered by location:  418 removed
Duplicates:            14 skipped
New offers added:      65

New offers:
  + Databricks | AI Engineer – Forward Deployed Engineering (AI FDE) | United States
  + Databricks | AI Transformation Leader | United States
  + Databricks | Data+AI Workforce Transformation Practitioner — Customer Delivery | United States
  + Databricks | 	Delivery Solutions Architect - Communications, Media, Entertainment & Games | United States
  + Databricks | Director, Agent & AI Search | United States
  + Databricks | Director, Americas Field Marketing at Databricks | United States
  + Databricks | Director, Field Engineering (CPG & Retail) | United States
  + Databricks | Director, Marketing Strategy and AI Transformation | United States
  + Databricks | Director, Paid Media | United States
  + Databricks | Field Engineering Enablement Leader | United States
  + Databricks | Forward Deployed Engineer | Remote - India
  + Databricks | Forward Deployed Engineer, FDE (L4) | Remote - India
  + Databricks | Forward Deployed Engineer (FDE) - Public Sector | United States
  + Databricks | GTM Product Enablement Lead | United States
  + Databricks | Lakebase Associate Director - Retail | United States
  + Databricks | Lead Field Technical Program Manager, FDE - Retail, Consumer Goods, Travel, Transportation & Hospitality | United States
  + Databricks | Lead Solutions Architect - Generative AI (EMEA Emerging DNB) | Remote - Germany
  + Databricks | Manager, Field Engineering - Global Telecommunications  | Remote - Texas
  + Databricks | Manager, Field Engineering (Specialist) - HCLS | Northeast - United States
  + Databricks | Manager, Field Engineering - Strategic Digital Native Business | Remote - California; Remote - Colorado; Remote - Oregon; Remote - Washington
  + Databricks | Manager, Forward Deployed Engineering | Remote - India
  + Databricks | Manager, Forward Deployed Engineering - CMEG | Remote - Washington D.C.
  + Databricks | Principal Demand Generation Manager, Campaign Development | United States
  + Databricks | Principal Security Field Engineer | Remote - California
  + Databricks | Senior Customer Enablement AI Programs Manager | United States
  + Databricks | Senior Forward Deployed Engineer, Sr FDE (L5) | Remote - India
  + Databricks | Senior Solutions Architect (Data & AI) - Leeds based | Remote - United Kingdom
  + Databricks | Senior Solutions Architect - Retail, Consumer Goods, Travel & Hospitality  | Atlanta, Georgia; Charlotte, North Carolina; Southeast - United States
  + Databricks | Solutions Architect - Communications, Media, Entertainment and Games | Remote - New York
  + Databricks | Solutions Architect - Communications, Media, Entertainment & Gaming  | United States
  + Databricks | Solutions Architect - Retail, Consumer Goods, Travel & Hospitality  | Central - United States; Northeast - United States; Remote - New York; Southeast - United States
  + Databricks | Solutions Architect - Retail, Travel & Hospitality  | Atlanta, Georgia; Central - United States; Remote - North Carolina; West Coast - United States
  + Databricks | Specialist Solutions Architect - AI/ML | United States
  + Databricks | Specialist Solutions Architect - AWS Infrastructure & AI Platform | United States
  + Databricks | Specialist Solutions Architect - Azure Infrastructure & AI Platform | United States
  + Databricks | Specialist Solutions Architect - Data Engineering & Warehousing (Financial Services)  | United States
  + Databricks | Sr. Deployment Strategist, FDE - Communications, Media, Entertainment & Gaming | United States
  + Databricks | Sr. Engagement Manager, Forward Deployed Engineering - Public Sector | Remote - Virginia; Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer | Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Digital Native Business  | West Coast - United States
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Financial Services | Central - United States
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Public Sector  | Alabama; Remote - Virginia; Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Retail | Northeast - United States; Southeast - United States
  + Databricks | Sr. Forward Deployed Engineer - National Security | United States
  + Databricks | Sr. Industry Marketing Manager, Manufacturing & Supply Chain | United States
  + Databricks | Sr. Manager, Field Engineering | Chicago, Illinois; Connecticut; New Jersey; Remote - New York; Remote - Washington D.C.; San Francisco, California
  + Databricks | Sr. Manager, Field Engineering - Sports | Northeast - United States
  + Databricks | Sr. Manager, Field Engineering - Telco | United States
  + Databricks | Sr. Partner Marketing Manager, AWS & AI Partners | United States
  + Databricks | Sr Platform Monitoring Engineer | United States
  + Databricks | Sr. Product Marketing Manager, Lakewatch & Agentic Apps | West Coast - United States
  + Databricks | Sr. Security Engineer, Enterprise Security | Remote - California
  + Databricks | Sr. Solutions Architect - Retail, Travel & Hospitality | Atlanta, Georgia; Chicago, Illinois; Dallas, Texas; Phoenix, Arizona; Portland, Oregon; Remote - California; Remote - North Carolina; Seattle, Washington
  + Databricks | Sr. Solutions Engineer - Digital Native Business (Strategic Accounts) | Remote - California; Remote - Colorado; Remote - Oregon; Remote - Washington
  + Databricks | Sr. Staff Security Software Engineer - Agentic Security Engineering | Remote - California
  + Databricks | Sr. Technology Partner Director - AI Code-Gen & Apps | Remote - California; San Francisco, California
  + Databricks | Staff Enterprise Security Engineer | Remote - California
  + Databricks | Staff Forward Deployed Engineer | Remote - India
  + Databricks | Staff Product Manager, US Public Sector | Remote - California; Remote - Virginia; Remote - Washington D.C.
  + Databricks | Staff Security Assurance Engineer  | Remote - Washington D.C.; Washington, D.C.
  + Databricks | Staff Security Engineer, Incident Response | United States
  + Databricks | Staff Unified Communications Engineer | San Francisco, California; United States
  + Databricks | Strategic Account Executive - Retail vertical  | Remote - California
  + Databricks | Strategic Core Account Executive - Retail  | Remote - Ohio
  + Databricks | Technical Enablement Specialist  - Field Engineering Onboarding | United States

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
[exit 0]
```

### D4 — the log parses as JSON

`worked-run/terminal/D4-json-tool.txt`

```text
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out/mode-log.json > /dev/null
[exit 0]
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline/mode-log.json > /dev/null
[exit 0]
```

### D5 — independent count cross-check (MOLOCO INC)

`worked-run/terminal/D5-cross-check.txt`

```text
$ independent read of the CSV (python csv module, not mode_run.py or triage.py)
$ python3 -I -c "import csv; [print(r['company_name'], '|', r['Total Approvals'], '|', r['Total Denials'], '|', r['Approval_Rate']) for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', newline='')) if r['company_name'].strip().upper()=='MOLOCO INC']"
MOLOCO INC | 200.0 | 2.0 | 99.009900990099

$ grep -c (raw line count containing MOLOCO INC, to catch duplicate rows)
1

$ value in mode-log.json for role moloco-ds2-product
MOLOCO INC | 200.0 | 2.0 | 99.009900990099 | tier Proven | source record
```

### D6 — break attempt: write outside the submission folder

`worked-run/terminal/D6-out-dir-escape.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir /tmp/x
✗ stopped: --out-dir /tmp/x is outside my allowed folders; refusing to write
[exit 2]
$ ls /tmp/x
ls: /tmp/x: No such file or directory
```

### D7 — Airbnb row 5 redirect chain

`worked-run/terminal/D7-airbnb-redirect.txt`

```text
$ curl -sIL https://boards.greenhouse.io/airbnb/jobs/6768605 | grep -iE '^(HTTP|location)'
HTTP/2 301 
location: https://job-boards.greenhouse.io/airbnb/jobs/6768605
HTTP/2 302 
location: /airbnb?error=true
HTTP/2 302 
location: https://careers.airbnb.com/positions/
HTTP/2 200 
```

### D7b — Airbnb row 5 liveness re-run

`worked-run/terminal/D7b-airbnb-liveness-rerun.txt`

```text
$ npm run ats:liveness -- https://boards.greenhouse.io/airbnb/jobs/6768605

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://boards.greenhouse.io/airbnb/jobs/6768605

Checking 1 URL(s)...

✅ active     https://boards.greenhouse.io/airbnb/jobs/6768605

Results: 1 active  0 expired  0 uncertain
[exit 0]
```

### D7c — redirect check on the other two scored postings

`worked-run/terminal/D7c-other-apply-redirects.txt`

```text
$ curl -sIL https://job-boards.greenhouse.io/figma/jobs/5552580004 | grep -iE '^(HTTP|location)'
HTTP/2 200 
$ curl -sIL https://job-boards.greenhouse.io/moloco/jobs/7985823003 | grep -iE '^(HTTP|location)'
HTTP/2 200 
```

## Full mode-report.md (live run)

`worked-run/out/mode-report.md`, inserted unchanged:

````markdown
## Executive summary

This is a screening report for Sasha Jones, a fictional international student looking for an entry-level data scientist job that will sponsor a work visa. It checks 13 job postings and recommends which ones are worth an application.

Read it before applying to anything on the list: a posting is only scored if the company has a record of sponsoring visas and the job is confirmed open on the employer's own website. Job-listing sites are not trusted on their own, because one of them showed a removed job as open in an earlier run.

**What it found:** 3 of 13 postings passed every check and were scored (3 Apply). 2 were confirmed closed on the employer's own page and need no action. 8 were held back without a score: 2 because the only sign the job was open came from a job-listing site, 3 because the employer's own page could not be confirmed, and the rest for missing sponsorship records or input. Nothing is decided until a person reviews the table below.

## Run record

- Mode `rithika-sr-ds-h1b-liveness` v0.1.0, building on `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.
- Run date 2026-10-21 (--today). Liveness source: network: npm run --silent ats:liveness -- <url>.
- Visa timeline factor **1.0**: 76 days until EAD start + 70 unemployment days left = 146 available / 60-day hiring lag. [your-input]
- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. No model judgment was used.
- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).

## Roles

| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | G3 timeline | Decision | Score | Flags |
|---|---|---|---|---|---|---|---|---|
| MAPLEBEAR INC | Data Scientist | pass (Proven) | posting: active | held (builtin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| Instacart | Data Scientist | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| Airbnb | Staff Data Scientist, Locations | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| AIRBNB INC | Data Scientist, Platform | pass (Proven) | posting: expired | n/a | — | **CLOSED** | CLOSED — posting verified closed (posting page checker said expired: HTTP 404) |  |
| AIRBNB INC | Staff Data Scientist, Locations | pass (Proven) | posting: active | n/a | 1.0 | **Apply** | 0.375 | ⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| FIGMA INC | Data Scientist | pass (Proven) | posting: active | n/a | 1.0 | **Apply** | 0.435 | ⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| NEXTDOOR INC | Data Scientist - Search (Senior) | pass (Proven) | posting: active | held (builtinaustin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| $AVY INC | Data Scientist (no posting found) | HELD: no sponsorship record | — | — | — | **HELD** | HELD — G1: company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) |  |
| MOLOCO INC | Data Scientist II, Product - Moloco Commerce Media | pass (Proven) | posting: active | n/a | 1.0 | **Apply** | 0.465 | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: uncertain | n/a | — | **HELD** | HELD — G2a: employer page not active (checker said uncertain: content present but no visible apply control found) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ note: third-party copy says no visa sponsorship for this role; CSV sponsorship is company-wide — G4 review |
| NEXTDOOR INC | Senior Data Scientist - Search | pass (Proven) | posting: active; employer: uncertain | held (builtinaustin.com) | — | **HELD** | HELD — G2b: employer page not active (checker said uncertain: content present but no visible apply control found) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MOLOCO INC | Data Scientist (deliberately broken employer_url) | pass (Proven) | posting: uncertain; employer: expired | closed (builtin.com) | — | **CLOSED** | CLOSED — posting verified closed (employer page checker said expired: redirect to https://job-boards.greenhouse.io/moloco?error=true) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: uncertain | n/a | — | **HELD** | HELD — G2a: employer page not active (checker said uncertain: navigation error: page.goto: Download is starting) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |

## Next action for held roles

- **MAPLEBEAR INC — Data Scientist:** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **Instacart — Data Scientist:** Search the CSV by hand for the legal name before deciding.
- **Airbnb — Staff Data Scientist, Locations:** Search the CSV by hand for the legal name before deciding.
- **NEXTDOOR INC — Data Scientist - Search (Senior):** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **$AVY INC — Data Scientist (no posting found):** Treat sponsorship as unknown; network to ask before applying.
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Open https://job-boards.greenhouse.io/instacart/jobs/8236905 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/instacart/jobs/8236905
- **NEXTDOOR INC — Senior Data Scientist - Search:** Open https://job-boards.greenhouse.io/nextdoor/jobs/7948362 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/nextdoor/jobs/7948362
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Open https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals by hand, or re-run: npm run ats:liveness -- https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals

## Liveness checks (one per URL)

| URL | Aggregator | Checker said | Exit | Parse |
|---|---|---|---|---|
| https://builtin.com/job/data-scientist/3375738 | builtin.com | active | 0 | ok |
| https://careers.airbnb.com/positions/6632687 | no | expired: HTTP 404 | 1 | ok |
| https://boards.greenhouse.io/airbnb/jobs/6768605 | no | active | 0 | ok |
| https://job-boards.greenhouse.io/figma/jobs/5552580004 | no | active | 0 | ok |
| https://www.builtinaustin.com/job/data-scientist-search/9459092 | builtinaustin.com | active | 0 | ok |
| https://job-boards.greenhouse.io/moloco/jobs/7985823003 | no | active | 0 | ok |
| https://job-boards.greenhouse.io/instacart/jobs/8236905 | no | uncertain: content present but no visible apply control found | 1 | ok |
| https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | no | uncertain: content present but no visible apply control found | 1 | ok |
| https://builtin.com/company/moloco/jobs | builtin.com | uncertain: content present but no visible apply control found | 1 | ok |
| https://job-boards.greenhouse.io/moloco/jobs/9999999999 | no | expired: redirect to https://job-boards.greenhouse.io/moloco?error=true | 1 | ok |
| https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals | no | uncertain: navigation error: page.goto: Download is starting | 1 | ok |

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.
- An `active` result means the page loaded and showed a visible apply control. It does not prove the employer is still reviewing applications.
- The aggregator list is a hand-made rule. A job board missing from it is treated as an employer page.
- Whether employer_url is really the same job as posting_url is your-input; this run does not compare the two pages' text.

## Human decision

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role, starting with the ⚠ rows.
````

## Verified vs inferred

| Claim | Source | Verified / Inferred / Your-input |
|---|---|---|
| The builtin.com Instacart page (row 1) is a job removed on Jun 11, 2025 | G4 browser check; page text | Verified (human) |
| The checker still reports that page as active | D1 log, raw checker output | Verified (record) |
| The Airbnb link (row 5) lands on the all-jobs page, not the job | D7 redirect chain + G4 browser check | Verified (machine + human) |
| The checker calls that page active | D7b re-run | Verified (record) |
| The Airbnb Platform posting (row 4) is gone | D1, checker `expired: HTTP 404` | Verified (record); not opened by a human |
| The fake Moloco job id (row 12) is gone | D1, redirect to `?error=true` | Verified (record) |
| Figma (row 6) and Moloco (row 9) are open | D1 checker `active` + G4 saw Apply button | Verified (machine + human) |
| Figma and Moloco serve the job page with no HTTP redirect | D7c (HEAD requests only) | Verified for HTTP redirects; JavaScript redirects not tested |
| Nextdoor Greenhouse posting (row 11) is open | G4 saw Apply button; checker said uncertain | Verified (human); checker false negative |
| Rows 7/11 builtinaustin and Greenhouse URLs are the same job | title and team match only | Inferred |
| Row 13 General Catalyst page shows the Instacart Meals role | G4 browser check | Verified (human) |
| Why the checker hit "Download is starting" on row 13 | not investigated | Inferred (unknown cause) |
| Instacart Meals role (row 10) will not sponsor a visa | third-party copy (resumly.ai) | Inferred; not checked on the employer page |
| MOLOCO INC: 200 approvals, 2 denials, 99.0099% | D5 independent CSV read vs log | Verified (record, cross-checked) |
| Other companies' sponsorship counts and tiers | CSV, read by the imported G1 code | Record; not independently cross-checked |
| Composites 0.375 / 0.435 / 0.465 | scorer; hand arithmetic below | Verified (hand arithmetic) |
| Fit values, rows 1–8 | 2026-10-03 candidates file | Your-input |
| Fit values, rows 9–13 | proposed by Claude Code, accepted by rithika-sr | Inferred |
| Visa timeline factor 1.0 | persona dates (fictional) and `--today` | Your-input |
| Moloco DS II is the closest role to Sasha's level | G4 judgment | Your-input |
| No entry-level DS posting at the checked sponsors on 2026-10-21 | Greenhouse/Lever/Ashby boards queried for about 30 sponsor names | Inferred (not exhaustive) |
| Offline run is reproducible | D2, report identical; logs differ only in the out-dir path | Verified (machine) |

## Verification

1. **Reproducibility (×2):** the offline fixture run was repeated into a second folder. `mode-report.md` is identical. A field-level diff of `mode-log.json` shows only `command_line[11]` and `scorer.stdout` differ, both because they contain the output folder name (D2).
2. **JSON validity:** `python3 -m json.tool` exits 0 on both logs (D4).
3. **Count cross-check:** MOLOCO INC read from the CSV with an independent one-liner equals the log: 200 / 2 / 99.009900990099 (D5). There is one MOLOCO INC row in the CSV.
4. **Hand arithmetic:** a Proven sponsor contributes 0.9 × 0.35 = 0.315. Adding fit × 0.30 gives Airbnb 0.315 + 0.2 × 0.30 = **0.375**, Figma 0.315 + 0.4 × 0.30 = **0.435** and Moloco 0.315 + 0.5 × 0.30 = **0.465**, matching the report. Liveness and timeline gates are 1.0 for all three.
5. **Break attempts:**
   - Row 1 (aggregator-only removed job): held.
   - Row 12 (fake Greenhouse id): CLOSED.
   - Row 13 (unlisted aggregator): held, but only through a navigation error.
   - `--out-dir /tmp/x`: exit 2, nothing written (D6).
6. **Human browser check (G4):** rithika-sr opened rows 1, 5, 6, 9, 10, 11 and 13 on 2026-10-21, including all three scored postings (`G4-HUMAN-REVIEW.md`). Rows 2, 3, 4, 7, 8 and 12 have no browser observation recorded. It found the Airbnb false positive and the Nextdoor false negative.

## Attestation

Drafted by Claude Code from the terminal transcripts above; reviewed by rithika-sr.

- Recipe: rithika-sr-ds-h1b-liveness v0.1.0
- By: rithika-sr · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v` | 41 tests, OK | all pass |
| Live run on 13 real postings (D1) | 3 scored (Apply 3), 2 CLOSED, 8 HELD; exit 0 | a run that completes and holds what it cannot confirm |
| Offline fixture run ×2 + diff (D2) | report identical; log differs only in out-dir path | identical results |
| `python3 -m json.tool` on both logs (D4) | exit 0 | valid JSON |
| MOLOCO INC count, independent read vs log (D5) | 200 / 2 / 99.0099 in both | equal |
| **Break 1:** builtin.com Instacart page, posting only (row 1) | HELD, aggregator-only liveness | HELD |
| **Break 2:** real Greenhouse domain, fake job id (row 12) | CLOSED, redirect to `?error=true` | CLOSED |
| **Break 3:** General Catalyst board, not in the aggregator list (row 13) | HELD, but only because the checker hit a navigation error; it was treated as an employer page | slip through as an employer page |
| **Break:** `--out-dir /tmp/x` (D6) | `✗ stopped`, exit 2, nothing written | exit 2 |
| Airbnb row 5 redirect (D7, D7b) | 301 → 302 `?error=true` → 302 all-jobs page; checker `active`; scored Apply | CLOSED. **Saw a false positive.** |
| Nextdoor row 11, Greenhouse page in a browser (G4) | human saw an Apply button; checker said uncertain | checker `active`. **Saw a false negative.** |

### Did not test

- A real `portals.yml` scan with my own portals (only the shipped example, one company).
- JavaScript-driven redirects on the Figma and Moloco pages (D7c checks HTTP redirects only).
- Whether an aggregator URL and its employer URL are the same job.
- Role-level sponsorship text on any posting.
- Any non-Greenhouse ATS (Lever, Ashby, Workday) in a live run.
- Entry-level postings: none were found at the checked sponsors on 2026-10-21.

### Broke during testing, fixed

- An `expired` employer page showed as HELD → added a separate CLOSED outcome (no score) and tests for it.
- A URL missing from the offline fixture was labelled "unparseable" → relabelled "no liveness check recorded".
- A test read another test class's state before that class had run → moved into the class that owns it.
- The earlier recipe claimed RUNNABLE-SAMPLE with open TODOs → corrected to DRAFT.
- Environment: PyYAML missing in the system Python → repo `.venv` with PyYAML. iCloud had duplicated four tracked folders as "* 2" copies and left the originals deleted → restored with `git restore`; the copies were moved out of the repo after a diff.

## Lifecycle note

The recipe stays **DRAFT**. Moving to SPECIFIED requires zero open TODOs, each closed with its evidence. This assignment asks for proposed additions to be written as typed TODOs, and this run produced real ones: a false positive on redirects, a false negative on Apply detection, an aggregator-list gap, and an unchecked role-level sponsorship clause. Promoting it while those are open would claim evidence that does not exist. The earlier recipe was corrected to DRAFT for the same reason.

## Reflection

**What went well.**
- The mode never scored a posting it could not confirm.
- It kept every checker output word for word.
- It caught the previous run's false positive.
- It separated "unknown" from "verified closed".
- The offline run reproduces exactly.

**What the mode got wrong or missed.**
- It recommended applying to an Airbnb posting whose link lands on a list of all jobs. The checker judges the page it ends up on and saw Apply buttons.
- The aggregator rule is a denylist, so an unlisted job board was treated as the employer. A navigation error, not the design, kept it out.
- All three Apply results were driven by sponsorship, not fit, and among scored roles nothing was skipped (0%).
- No entry-level postings were found, so the run never tested the persona's real target.

**Next steps (top 3 TODOs).**
1. Final URL must still identify the same job (job id in the final URL).
2. ATS allowlist instead of an aggregator denylist.
3. Role-level sponsorship clause check before scoring.
