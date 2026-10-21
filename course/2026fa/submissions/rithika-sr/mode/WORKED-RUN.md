## Executive summary

This is the worked run of a screening tool for a fictional international student, Sasha Jones, looking for an entry-level data scientist job with visa sponsorship. It records three runs of the tool on the same 13 real public job postings on 21 October 2026. Each run includes the exact commands, the real output and what a person found by checking results by hand. Read it to judge where the tool can and cannot be trusted.

**Run 1.** The tool caught last month's false positive: a listing site still showed a job removed in June 2025 as open. It recommended three postings. A person opened them and found:
- one link that landed on the company's list of all jobs, not the job;
- one real open job the tool could not confirm;
- one unlisted job board that was only held by accident.

**Run 2.** The tool now asks the employer's hiring system for its own record of each job. That fixed the bad link, found the missed open job and held the unknown job board on purpose. The first attempt failed because the computer's Python had no security certificates; after that was fixed with full checking still on, the run worked. But two senior roles the person had skipped now came out "apply".

**Run 3.** The tool sets aside titles such as senior or staff for an entry-level candidate. On the five postings the person reviewed, the tool agreed 3, 2 and then 4 times out of 5 across the three runs. Those same five postings were used to design the fixes, so this shows fit to known cases. It is not evidence about new postings.

## Inputs

- **Persona:** Sasha Jones, **fictional**. F-1, graduating 2026-12-18, OPT EAD expected 2027-01-05, target SOC 15-2051. File: `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json`.
- **Candidates:** `worked-run/candidates.real.json`, 13 real public postings, the same file for all three runs (sha256 `040293bb…19bf`).
  - Rows 1–8 repeat the 2026-10-03 worked run.
  - Rows 9–11 are postings found on 2026-10-21 via the public Greenhouse job-board API and web search.
  - Row 12 is a deliberately broken employer link.
  - Row 13 is the same Instacart role on a job board not in the aggregator list.
- **Sponsorship records:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- **Rules (your-input):**
  - `aggregators.json` (14 domains, all runs);
  - `ats_hosts.json` (10 domains, Runs 2–3);
  - `level_rules.json` with `--max-level entry` (10 blocked title words, Run 3).
- **Run date:** `--today 2026-10-21` for every run.

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

## Run 1 — v0.1.0: page checker + aggregator rule

### Commands and real output

All output below is pasted from the terminal transcripts in `worked-run/terminal/`.

#### Tests

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

#### D1 — live run

`worked-run/terminal/D1-live-run.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out
✓ scored 3 roles → Apply 3 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out/role-scores.md
✓ mode: 13 roles → 3 scored, 2 closed, 8 held {'G1': 3, 'G2a': 2, 'G2b': 3} → course/2026fa/submissions/rithika-sr/mode/worked-run/out/mode-log.json + mode-report.md
[exit 0]
```

#### D2 — offline reproducibility run, twice

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

#### D3 — ats:scan dry run (before a portals file existed)

`worked-run/terminal/D3-ats-scan-dry-run.txt`

```text
$ npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
[exit 1]
```

#### D3b — ats:scan dry run (example portals file copied to the gitignored `data/ats/portals.yml`)

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

#### D4 — the log parses as JSON

`worked-run/terminal/D4-json-tool.txt`

```text
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out/mode-log.json > /dev/null
[exit 0]
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline/mode-log.json > /dev/null
[exit 0]
```

#### D5 — independent count cross-check (MOLOCO INC)

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

#### D6 — break attempt: write outside the submission folder

`worked-run/terminal/D6-out-dir-escape.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir /tmp/x
✗ stopped: --out-dir /tmp/x is outside my allowed folders; refusing to write
[exit 2]
$ ls /tmp/x
ls: /tmp/x: No such file or directory
```

#### D7 — Airbnb row 5 redirect chain

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

#### D7b — Airbnb row 5 liveness re-run

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

#### D7c — redirect check on the other two scored postings

`worked-run/terminal/D7c-other-apply-redirects.txt`

```text
$ curl -sIL https://job-boards.greenhouse.io/figma/jobs/5552580004 | grep -iE '^(HTTP|location)'
HTTP/2 200 
$ curl -sIL https://job-boards.greenhouse.io/moloco/jobs/7985823003 | grep -iE '^(HTTP|location)'
HTTP/2 200 
```

### Full mode-report.md (live run)

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

## G4 human review (after Run 1)

rithika-sr opened rows 1, 5, 6, 9, 10, 11 and 13 in a normal browser on 2026-10-21 (`G4-HUMAN-REVIEW.md`). The table is copied from that file:

| Row | Posting | What I saw | Tool said | Decision |
|---|---|---|---|---|
| 1 | builtin.com, Instacart Data Scientist | The page says "Sorry, this job was removed at 02:28 p.m. (UTC) on Wednesday, Jun 11, 2025." The checker still said active. The mode held it. | HELD (aggregator only) | Correct hold. |
| 5 | Airbnb, Staff Data Scientist (Greenhouse link) | The link landed on Airbnb's "All Jobs, 194 open roles" page, not on the job. | Apply 0.375 | **Skip.** The checker said active, so this is a false positive, confirmed by the redirect check (D7). |
| 6 | Figma, Data Scientist | Open, with an Apply button, but it asks for an experienced Data Scientist. | Apply 0.435 | **Consider.** |
| 9 | Moloco, Data Scientist II | Open, with an Apply button; mid-level, the closest to Sasha. | Apply 0.465 | **Apply.** |
| 10 | Instacart Meals (Greenhouse link) | Loads on Instacart's own careers site; it is a Senior Data Scientist role, not a role for Sasha. | HELD (checker uncertain) | **Skip.** |
| 11 | Nextdoor Search (Greenhouse link) | An Apply button is visible, but it is a Senior Data Scientist role. | HELD (checker uncertain) | **Skip.** The checker said uncertain, so this is a false negative. |
| 13 | General Catalyst job board | In my browser it loads the Instacart Meals Senior Data Scientist role. The checker had a navigation error. | HELD (navigation error) | So the slip-through risk is real. |

Reviewer: rithika-sr, 2026-10-21.

Rows 2, 3, 4, 7, 8 and 12 have no browser observation recorded.

## Run 2 — v0.2.0: ATS record, redirect chain, employer allowlist

**What changed.**
- **Greenhouse job URLs:** the public job-board API record (`boards-api.greenhouse.io`) now decides. 200 with the same id means open, 404 means CLOSED, and anything else means HELD.
- **Employer URLs:** redirects are followed hop by hop. A hop through `error=true` closes the role; a final URL without the job id is flagged.
- **Unknown sites:** a non-aggregator host that is not on the employer allowlist is held and never fetched.
- **Network log:** every call is recorded in the log, and every network run writes a replay fixture.

**First attempt failed.** All 13 `urllib` calls failed with `CERTIFICATE_VERIFY_FAILED`, because this python.org build of Python 3.14 ships with no CA certificates. Fail-closed held everything, so nothing unverifiable was scored, but the run proved nothing. The fix is `ats_record.ssl_context()`: if Python's default trust store is empty, it loads the macOS system bundle `/etc/ssl/cert.pem`. Verification stays on, and the source is logged as `tls_ca_source`. The failed attempt is kept in `out-run2-attempt1-no-ca/`. Its transcript header names `out-run2` because the folder was renamed after the run.

### Tests

`worked-run/terminal/R2-T1-tests.txt`

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v 2>&1 | sed -e "s#$HOME#~#g" -e "s#/var/folders/[^ ]*/T/#<tmp>/#g"
# (sed redacts the home folder and macOS temp folder from the out-dir refusal messages; nothing else is changed)
test_every_aggregator_has_a_reason (test_mode_run.AggregatorMatching.test_every_aggregator_has_a_reason) ... ok
test_lookalike_hosts_do_not_match (test_mode_run.AggregatorMatching.test_lookalike_hosts_do_not_match) ... ok
test_subdomain_matches (test_mode_run.AggregatorMatching.test_subdomain_matches) ... ok
test_worked_run_aggregators_listed (test_mode_run.AggregatorMatching.test_worked_run_aggregators_listed) ... ok
test_scorer_not_called_when_every_role_is_held (test_mode_run.AllHeld.test_scorer_not_called_when_every_role_is_held) ... ok
test_greenhouse_url_forms (test_mode_run.AtsRecordHelpers.test_greenhouse_url_forms) ... ok
test_job_id_from_careers_url (test_mode_run.AtsRecordHelpers.test_job_id_from_careers_url) ... ok
test_tls_context_always_verifies (test_mode_run.AtsRecordHelpers.test_tls_context_always_verifies) ... ok
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
test_allowlisted_careers_host_is_allowed (test_mode_run.Run2Gates.test_allowlisted_careers_host_is_allowed) ... ok
test_api_200_and_checker_active_passes_without_disagreement_flag (test_mode_run.Run2Gates.test_api_200_and_checker_active_passes_without_disagreement_flag) ... ok
test_api_200_beats_checker_uncertain (test_mode_run.Run2Gates.test_api_200_beats_checker_uncertain) ... ok
test_api_404_is_closed_even_if_checker_active (test_mode_run.Run2Gates.test_api_404_is_closed_even_if_checker_active) ... ok
test_api_timeout_is_uncertain_and_held (test_mode_run.Run2Gates.test_api_timeout_is_uncertain_and_held) ... ok
test_error_true_hop_is_closed (test_mode_run.Run2Gates.test_error_true_hop_is_closed) ... ok
test_every_network_call_is_recorded (test_mode_run.Run2Gates.test_every_network_call_is_recorded) ... ok
test_final_url_without_job_id_is_flag_only (test_mode_run.Run2Gates.test_final_url_without_job_id_is_flag_only) ... ok
test_title_mismatch_is_flag_not_decision (test_mode_run.Run2Gates.test_title_mismatch_is_flag_not_decision) ... ok
test_unknown_host_is_held_and_never_checked (test_mode_run.Run2Gates.test_unknown_host_is_held_and_never_checked) ... ok

----------------------------------------------------------------------
Ran 54 tests in 0.199s

OK
scorer not run: no role cleared the gates
✓ mode: 2 roles → 0 scored, 0 closed, 2 held {'G1': 1, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-_s5ufbil/out/mode-log.json + mode-report.md
✓ scored 1 roles → Apply 0 · Consider 1 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-0pjd4lfq/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-0pjd4lfq/out/role-scores.md
✓ mode: 1 roles → 1 scored, 0 closed, 0 held {} → course/2026fa/submissions/rithika-sr/mode/.test-0pjd4lfq/out/mode-log.json + mode-report.md
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-8fp2yjzz/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-8fp2yjzz/role-scores.md
✓ mode: 11 roles → 3 scored, 2 closed, 6 held {'G1': 2, 'G2a': 3, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-8fp2yjzz/mode-log.json + mode-report.md
✓ scored 5 roles → Apply 2 · Consider 3 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-qvtycjqt/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-qvtycjqt/out/role-scores.md
✓ mode: 9 roles → 5 scored, 2 closed, 2 held {'G2a': 2} → course/2026fa/submissions/rithika-sr/mode/.test-qvtycjqt/out/mode-log.json + mode-report.md
[exit 0]

$ python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py"
Ran 17 tests in 0.029s
OK
```

### Failed attempt (no CA certificates)

`worked-run/terminal/R2-D1a-live-run-no-ca.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2
scorer not run: no role cleared the gates
✓ mode: 13 roles → 0 scored, 1 closed, 12 held {'G1': 3, 'G2a': 5, 'G2b': 4} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/mode-log.json + mode-report.md
[exit 0]
```

### Live run

`worked-run/terminal/R2-D1-live-run.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2
✓ scored 4 roles → Apply 4 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/role-scores.md
✓ mode: 13 roles → 4 scored, 3 closed, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/mode-log.json + mode-report.md
[exit 0]
```

### Offline replay ×2 and comparison with the live run

`worked-run/terminal/R2-D2-offline-repro.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline
✓ scored 4 roles → Apply 4 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline/role-scores.md
✓ mode: 13 roles → 4 scored, 3 closed, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline/mode-log.json + mode-report.md
[exit 0]

$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline-repeat
✓ scored 4 roles → Apply 4 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline-repeat/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline-repeat/role-scores.md
✓ mode: 13 roles → 4 scored, 3 closed, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2-offline-repeat/mode-log.json + mode-report.md
[exit 0]

$ diff out-run2-offline/mode-report.md out-run2-offline-repeat/mode-report.md
REPRODUCED: mode-report.md identical

$ field-level diff of the two offline mode-log.json files
  differs: .command_line[9]
  differs: .scorer.stdout

$ live Run 2 vs offline replay: per-role decision, composite, held/closed reason, flags
  roles that differ: none (all 13 identical)
  live summary:    {'candidates': 13, 'scored': 4, 'held': 6, 'closed': 3, 'held_by_gate': {'G1': 3, 'G2a': 1, 'G2b': 2}, 'decisions': {'HELD': 6, 'CLOSED': 3, 'Apply': 4}}
  offline summary: {'candidates': 13, 'scored': 4, 'held': 6, 'closed': 3, 'held_by_gate': {'G1': 3, 'G2a': 1, 'G2b': 2}, 'decisions': {'HELD': 6, 'CLOSED': 3, 'Apply': 4}}

$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/mode-log.json > /dev/null
[exit 0]
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-run2/replay-fixture.json > /dev/null
[exit 0]
```

### Every network call

`worked-run/terminal/R2-D3-network-calls.txt`

```text
$ network_calls in out-run2/mode-log.json (live Run 2), in call order
TLS CA source: /etc/ssl/cert.pem (python default had no CA certificates)
 1 2026-10-21T18:49:45+00:00 page-checker   exit 0  https://builtin.com/job/data-scientist/3375738
 2 2026-10-21T18:49:48+00:00 page-checker   exit 1  https://careers.airbnb.com/positions/6632687
 3 2026-10-21T18:49:48+00:00 redirect-hop   404     https://careers.airbnb.com/positions/6632687
 4 2026-10-21T18:49:51+00:00 page-checker   exit 0  https://boards.greenhouse.io/airbnb/jobs/6768605
 5 2026-10-21T18:49:51+00:00 redirect-hop   301     https://boards.greenhouse.io/airbnb/jobs/6768605  -> https://job-boards.greenhouse.io/airbnb/jobs/6768605
 6 2026-10-21T18:49:51+00:00 redirect-hop   302     https://job-boards.greenhouse.io/airbnb/jobs/6768605  -> /airbnb?error=true
 7 2026-10-21T18:49:52+00:00 redirect-hop   302     https://job-boards.greenhouse.io/airbnb?error=true  -> https://careers.airbnb.com/positions/
 8 2026-10-21T18:49:52+00:00 redirect-hop   200     https://careers.airbnb.com/positions/
 9 2026-10-21T18:49:52+00:00 greenhouse-api 404     https://boards-api.greenhouse.io/v1/boards/airbnb/jobs/6768605
10 2026-10-21T18:49:55+00:00 page-checker   exit 0  https://job-boards.greenhouse.io/figma/jobs/5552580004
11 2026-10-21T18:49:55+00:00 redirect-hop   200     https://job-boards.greenhouse.io/figma/jobs/5552580004
12 2026-10-21T18:49:55+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/figma/jobs/5552580004
13 2026-10-21T18:49:58+00:00 page-checker   exit 0  https://www.builtinaustin.com/job/data-scientist-search/9459092
14 2026-10-21T18:50:01+00:00 page-checker   exit 0  https://job-boards.greenhouse.io/moloco/jobs/7985823003
15 2026-10-21T18:50:01+00:00 redirect-hop   200     https://job-boards.greenhouse.io/moloco/jobs/7985823003
16 2026-10-21T18:50:01+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/moloco/jobs/7985823003
17 2026-10-21T18:50:05+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/instacart/jobs/8236905
18 2026-10-21T18:50:05+00:00 redirect-hop   302     https://job-boards.greenhouse.io/instacart/jobs/8236905  -> https://instacart.careers/job/?gh_jid=8236905
19 2026-10-21T18:50:05+00:00 redirect-hop   308     https://instacart.careers/job/?gh_jid=8236905  -> https://www.instacart.careers/job/?gh_jid=8236905
20 2026-10-21T18:50:05+00:00 redirect-hop   308     https://www.instacart.careers/job/?gh_jid=8236905  -> /job?gh_jid=8236905
21 2026-10-21T18:50:05+00:00 redirect-hop   200     https://www.instacart.careers/job?gh_jid=8236905
22 2026-10-21T18:50:05+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/instacart/jobs/8236905
23 2026-10-21T18:50:08+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/nextdoor/jobs/7948362
24 2026-10-21T18:50:09+00:00 redirect-hop   302     https://job-boards.greenhouse.io/nextdoor/jobs/7948362  -> https://about.nextdoor.com/careers-list/?gh_jid=7948362
25 2026-10-21T18:50:09+00:00 redirect-hop   200     https://about.nextdoor.com/careers-list/?gh_jid=7948362
26 2026-10-21T18:50:09+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/nextdoor/jobs/7948362
27 2026-10-21T18:50:12+00:00 page-checker   exit 1  https://builtin.com/company/moloco/jobs
28 2026-10-21T18:50:14+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/moloco/jobs/9999999999
29 2026-10-21T18:50:15+00:00 redirect-hop   302     https://job-boards.greenhouse.io/moloco/jobs/9999999999  -> /moloco?error=true
30 2026-10-21T18:50:15+00:00 redirect-hop   200     https://job-boards.greenhouse.io/moloco?error=true
31 2026-10-21T18:50:15+00:00 greenhouse-api 404     https://boards-api.greenhouse.io/v1/boards/moloco/jobs/9999999999
totals by purpose: {'page-checker': 10, 'redirect-hop': 15, 'greenhouse-api': 6}
```

<details>
<summary>Full Run 2 mode-report.md (inserted unchanged)</summary>

````markdown
## Executive summary

This is a screening report for Sasha Jones, a fictional international student looking for an entry-level data scientist job that will sponsor a work visa. It checks 13 job postings and recommends which ones are worth an application.

Read it before applying to anything on the list: a posting is only scored if the company has a record of sponsoring visas and the job is confirmed open on the employer's own website. Job-listing sites are not trusted on their own, because one of them showed a removed job as open in an earlier run.

**What it found:** 4 of 13 postings passed every check and were scored (4 Apply). 3 were confirmed closed on the employer's own page and need no action. 6 were held back without a score: 2 because the only sign the job was open came from a job-listing site, 1 because the link was not on a recognized employer or hiring-system site, 0 because the employer's own page could not be confirmed, and the rest for missing sponsorship records or input. Where an employer's hiring system publishes a record of the job, that record decided whether the job is open. Nothing is decided until a person reviews the table below.

## Run record

- Mode `rithika-sr-ds-h1b-liveness` v0.2.0, building on `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.
- Run date 2026-10-21 (--today). Liveness source: network: npm run --silent ats:liveness -- <url>.
- Visa timeline factor **1.0**: 76 days until EAD start + 70 unemployment days left = 146 available / 60-day hiring lag. [your-input]
- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. No model judgment was used.
- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).

## Roles

| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | G3 timeline | Decision | Score | Flags |
|---|---|---|---|---|---|---|---|---|
| MAPLEBEAR INC | Data Scientist | pass (Proven) | posting: active [page-checker] | held (builtin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| Instacart | Data Scientist | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| Airbnb | Staff Data Scientist, Locations | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| AIRBNB INC | Data Scientist, Platform | pass (Proven) | posting: expired [page-checker] | n/a | — | **CLOSED** | CLOSED — posting verified closed (posting page checker said expired: HTTP 404) |  |
| AIRBNB INC | Staff Data Scientist, Locations | pass (Proven) | posting: expired [ats-record] | n/a | — | **CLOSED** | CLOSED — posting verified closed (posting page ATS record: HTTP 404) | ⚠ page checker said active; ATS record expired<br>⚠ final URL after redirects does not contain the job id: https://careers.airbnb.com/positions/ |
| FIGMA INC | Data Scientist | pass (Proven) | posting: active [ats-record] | n/a | 1.0 | **Apply** | 0.435 | ⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| NEXTDOOR INC | Data Scientist - Search (Senior) | pass (Proven) | posting: active [page-checker] | held (builtinaustin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| $AVY INC | Data Scientist (no posting found) | HELD: no sponsorship record | — | — | — | **HELD** | HELD — G1: company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) |  |
| MOLOCO INC | Data Scientist II, Product - Moloco Commerce Media | pass (Proven) | posting: active [ats-record] | n/a | 1.0 | **Apply** | 0.465 | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: active [ats-record] | n/a | 1.0 | **Apply** | 0.405 | ⚠ page checker said uncertain; ATS record active<br>⚠ title differs from ATS record: 'Senior Data Scientist I - Meals'<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ note: third-party copy says no visa sponsorship for this role; CSV sponsorship is company-wide — G4 review<br>⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| NEXTDOOR INC | Senior Data Scientist - Search | pass (Proven) | posting: active [page-checker]; employer: active [ats-record] | pass (builtinaustin.com) | 1.0 | **Apply** | 0.405 | ⚠ page checker said uncertain; ATS record active<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ posting is on an aggregator; the employer page decided liveness<br>⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| MOLOCO INC | Data Scientist (deliberately broken employer_url) | pass (Proven) | posting: uncertain [page-checker]; employer: expired [ats-record] | closed (builtin.com) | — | **CLOSED** | CLOSED — posting verified closed (employer page ATS record: HTTP 404) | ⚠ final URL after redirects does not contain the job id: https://job-boards.greenhouse.io/moloco?error=true<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: unrecognized [allowlist] | n/a | — | **HELD** | HELD — G2a: source not recognized as employer or ATS | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |

## Next action for held roles

- **MAPLEBEAR INC — Data Scientist:** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **Instacart — Data Scientist:** Search the CSV by hand for the legal name before deciding.
- **Airbnb — Staff Data Scientist, Locations:** Search the CSV by hand for the legal name before deciding.
- **NEXTDOOR INC — Data Scientist - Search (Senior):** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **$AVY INC — Data Scientist (no posting found):** Treat sponsorship as unknown; network to ask before applying.
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Find this job on the employer's own careers page or ATS instead of https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals.

## ATS records and redirect chains (employer pages)

| URL | Allowlisted as | ATS record | Redirect hops | Final URL has job id | Decided by |
|---|---|---|---|---|---|
| https://careers.airbnb.com/positions/6632687 | careers.airbnb.com | — | 404 | yes | page-checker |
| https://boards.greenhouse.io/airbnb/jobs/6768605 | greenhouse.io | expired (HTTP 404) | 301 → 302 → 302 → 200 | NO (https://careers.airbnb.com/positions/) | ats-record |
| https://job-boards.greenhouse.io/figma/jobs/5552580004 | greenhouse.io | active (HTTP 200, 'Data Scientist  ') | 200 | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/7985823003 | greenhouse.io | active (HTTP 200, 'Data Scientist II, Product - Moloco Commerce Media') | 200 | yes | ats-record |
| https://job-boards.greenhouse.io/instacart/jobs/8236905 | greenhouse.io | active (HTTP 200, 'Senior Data Scientist I - Meals') | 302 → 308 → 308 → 200 | yes | ats-record |
| https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | greenhouse.io | active (HTTP 200, 'Senior Data Scientist - Search') | 302 → 200 | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/9999999999 | greenhouse.io | expired (HTTP 404) | 302 → 200 | NO (https://job-boards.greenhouse.io/moloco?error=true) | ats-record |
| https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals | not on allowlist | — | — | — | allowlist |

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

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.
- An `active` result means the page loaded and showed a visible apply control. It does not prove the employer is still reviewing applications.
- The aggregator list and the employer allowlist are hand-made rules. A job board missing from both is held as unrecognized; a careers domain missing from the allowlist is held too, even if it is the real employer.
- Only Greenhouse has an ATS record check. Lever, Ashby, Workday and SmartRecruiters pages are allowlisted but still decided by the page checker.
- Whether employer_url is really the same job as posting_url is your-input; this run does not compare the two pages' text.

## Human decision

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role, starting with the ⚠ rows.
````

</details>

## Run 3 — v0.3.0: level gate

**What changed.**
- **Level gate:** a rule-based gate runs after liveness and before scoring. A title containing senior, sr, staff, principal, lead, manager, director, head, iii or iv as a whole word, in the candidate title or the ATS record title, is OVER-LEVEL and is not scored. "II" is not blocked. No model judgment is involved.
- **Title comparison:** parenthetical text such as "(US remote)" is now ignored.
- **Executive summary:** clauses with a zero count are left out.

### Tests

`worked-run/terminal/R3-T1-tests.txt`

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v 2>&1 | sed -e "s#$HOME#~#g" -e "s#/var/folders/[^ ]*/T/#<tmp>/#g"
# (sed redacts the home folder and macOS temp folder from the out-dir refusal messages; nothing else is changed)
test_every_aggregator_has_a_reason (test_mode_run.AggregatorMatching.test_every_aggregator_has_a_reason) ... ok
test_lookalike_hosts_do_not_match (test_mode_run.AggregatorMatching.test_lookalike_hosts_do_not_match) ... ok
test_subdomain_matches (test_mode_run.AggregatorMatching.test_subdomain_matches) ... ok
test_worked_run_aggregators_listed (test_mode_run.AggregatorMatching.test_worked_run_aggregators_listed) ... ok
test_scorer_not_called_when_every_role_is_held (test_mode_run.AllHeld.test_scorer_not_called_when_every_role_is_held) ... ok
test_greenhouse_url_forms (test_mode_run.AtsRecordHelpers.test_greenhouse_url_forms) ... ok
test_job_id_from_careers_url (test_mode_run.AtsRecordHelpers.test_job_id_from_careers_url) ... ok
test_parenthetical_ignored (test_mode_run.AtsRecordHelpers.test_parenthetical_ignored) ... ok
test_tls_context_always_verifies (test_mode_run.AtsRecordHelpers.test_tls_context_always_verifies) ... ok
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
test_case_insensitive_and_abbreviation (test_mode_run.LevelRules.test_case_insensitive_and_abbreviation) ... ok
test_every_token_has_a_reason (test_mode_run.LevelRules.test_every_token_has_a_reason) ... ok
test_ii_not_blocked_iii_blocked (test_mode_run.LevelRules.test_ii_not_blocked_iii_blocked) ... ok
test_max_level_any_blocks_nothing (test_mode_run.LevelRules.test_max_level_any_blocks_nothing) ... ok
test_scorer_not_called_when_every_role_is_over_level (test_mode_run.LevelRules.test_scorer_not_called_when_every_role_is_over_level) ... ok
test_unknown_max_level_stops_with_exit_2 (test_mode_run.LevelRules.test_unknown_max_level_stops_with_exit_2) ... ✗ stopped: --max-level 'phd' is not defined in scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/level_rules.json (defined: any, entry)
ok
test_word_boundary (test_mode_run.LevelRules.test_word_boundary) ... ok
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
test_allowlisted_careers_host_is_allowed (test_mode_run.Run2Gates.test_allowlisted_careers_host_is_allowed) ... ok
test_api_200_and_checker_active_passes_without_disagreement_flag (test_mode_run.Run2Gates.test_api_200_and_checker_active_passes_without_disagreement_flag) ... ok
test_api_200_beats_checker_uncertain (test_mode_run.Run2Gates.test_api_200_beats_checker_uncertain) ... ok
test_api_404_is_closed_even_if_checker_active (test_mode_run.Run2Gates.test_api_404_is_closed_even_if_checker_active) ... ok
test_api_timeout_is_uncertain_and_held (test_mode_run.Run2Gates.test_api_timeout_is_uncertain_and_held) ... ok
test_ats_title_can_make_a_role_over_level (test_mode_run.Run2Gates.test_ats_title_can_make_a_role_over_level) ... ok
test_blocked_token_is_over_level_and_never_scored (test_mode_run.Run2Gates.test_blocked_token_is_over_level_and_never_scored) ... ok
test_closed_role_is_not_level_checked (test_mode_run.Run2Gates.test_closed_role_is_not_level_checked) ... ok
test_data_scientist_ii_passes (test_mode_run.Run2Gates.test_data_scientist_ii_passes) ... ok
test_error_true_hop_is_closed (test_mode_run.Run2Gates.test_error_true_hop_is_closed) ... ok
test_every_network_call_is_recorded (test_mode_run.Run2Gates.test_every_network_call_is_recorded) ... ok
test_final_url_without_job_id_is_flag_only (test_mode_run.Run2Gates.test_final_url_without_job_id_is_flag_only) ... ok
test_level_settings_in_log_and_report (test_mode_run.Run2Gates.test_level_settings_in_log_and_report) ... ok
test_parenthetical_ignored_in_title_match (test_mode_run.Run2Gates.test_parenthetical_ignored_in_title_match) ... ok
test_summary_has_no_zero_count_clauses (test_mode_run.Run2Gates.test_summary_has_no_zero_count_clauses) ... ok
test_title_mismatch_is_flag_not_decision (test_mode_run.Run2Gates.test_title_mismatch_is_flag_not_decision) ... ok
test_unknown_host_is_held_and_never_checked (test_mode_run.Run2Gates.test_unknown_host_is_held_and_never_checked) ... ok

----------------------------------------------------------------------
Ran 69 tests in 0.222s

OK
scorer not run: no role cleared the gates
✓ mode: 2 roles → 0 scored, 0 closed, 0 over-level, 2 held {'G1': 1, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-7tmzco6g/out/mode-log.json + mode-report.md
✓ scored 1 roles → Apply 0 · Consider 1 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-4vbyf6h1/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-4vbyf6h1/out/role-scores.md
✓ mode: 1 roles → 1 scored, 0 closed, 0 over-level, 0 held {} → course/2026fa/submissions/rithika-sr/mode/.test-4vbyf6h1/out/mode-log.json + mode-report.md
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-usi1cixv/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-usi1cixv/role-scores.md
✓ mode: 11 roles → 3 scored, 2 closed, 0 over-level, 6 held {'G1': 2, 'G2a': 3, 'G2b': 1} → course/2026fa/submissions/rithika-sr/mode/.test-usi1cixv/mode-log.json + mode-report.md
scorer not run: no role cleared the gates
✓ mode: 1 roles → 0 scored, 0 closed, 1 over-level, 0 held {} → course/2026fa/submissions/rithika-sr/mode/.test-yy1mlvif/out/mode-log.json + mode-report.md
✓ scored 7 roles → Apply 2 · Consider 5 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/.test-7dw0uy6k/out/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/.test-7dw0uy6k/out/role-scores.md
✓ mode: 14 roles → 7 scored, 3 closed, 2 over-level, 2 held {'G2a': 2} → course/2026fa/submissions/rithika-sr/mode/.test-7dw0uy6k/out/mode-log.json + mode-report.md
[exit 0]

$ python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py"
Ran 17 tests in 0.029s
OK
```

### Live run

`worked-run/terminal/R3-D1-live-run.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3
✓ scored 2 roles → Apply 2 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/role-scores.md
✓ mode: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/mode-log.json + mode-report.md
[exit 0]
```

### Offline replay ×2 and comparison with the live run

`worked-run/terminal/R3-D2-offline-repro.txt`

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline
✓ scored 2 roles → Apply 2 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline/role-scores.md
✓ mode: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline/mode-log.json + mode-report.md
[exit 0]

$ python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline-repeat
✓ scored 2 roles → Apply 2 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline-repeat/role-scores.json  +  course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline-repeat/role-scores.md
✓ mode: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held {'G1': 3, 'G2a': 1, 'G2b': 2} → course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3-offline-repeat/mode-log.json + mode-report.md
[exit 0]

$ diff out-run3-offline/mode-report.md out-run3-offline-repeat/mode-report.md
REPRODUCED: mode-report.md identical

$ field-level diff of the two offline mode-log.json files
  differs: .command_line[9]
  differs: .scorer.stdout

$ live Run 3 vs offline replay: per-role decision, composite, reason, flags, level
  roles that differ: none (all 13 identical)
  live summary:    {'candidates': 13, 'scored': 2, 'over_level': 2, 'held': 6, 'closed': 3, 'held_by_gate': {'G1': 3, 'G2a': 1, 'G2b': 2}, 'decisions': {'HELD': 6, 'CLOSED': 3, 'Apply': 2, 'OVER-LEVEL': 2}}
  offline summary: {'candidates': 13, 'scored': 2, 'over_level': 2, 'held': 6, 'closed': 3, 'held_by_gate': {'G1': 3, 'G2a': 1, 'G2b': 2}, 'decisions': {'HELD': 6, 'CLOSED': 3, 'Apply': 2, 'OVER-LEVEL': 2}}

$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/mode-log.json > /dev/null
[exit 0]
$ python3 -m json.tool course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json > /dev/null
[exit 0]
```

### Every network call

`worked-run/terminal/R3-D3-network-calls.txt`

```text
$ network_calls in out-run3/mode-log.json (live Run 3), in call order
TLS CA source: /etc/ssl/cert.pem (python default had no CA certificates)
 1 2026-10-21T19:13:51+00:00 page-checker   exit 0  https://builtin.com/job/data-scientist/3375738
 2 2026-10-21T19:13:55+00:00 page-checker   exit 1  https://careers.airbnb.com/positions/6632687
 3 2026-10-21T19:13:55+00:00 redirect-hop   404     https://careers.airbnb.com/positions/6632687
 4 2026-10-21T19:13:59+00:00 page-checker   exit 0  https://boards.greenhouse.io/airbnb/jobs/6768605
 5 2026-10-21T19:13:59+00:00 redirect-hop   301     https://boards.greenhouse.io/airbnb/jobs/6768605  -> https://job-boards.greenhouse.io/airbnb/jobs/6768605
 6 2026-10-21T19:13:59+00:00 redirect-hop   302     https://job-boards.greenhouse.io/airbnb/jobs/6768605  -> /airbnb?error=true
 7 2026-10-21T19:13:59+00:00 redirect-hop   302     https://job-boards.greenhouse.io/airbnb?error=true  -> https://careers.airbnb.com/positions/
 8 2026-10-21T19:14:00+00:00 redirect-hop   200     https://careers.airbnb.com/positions/
 9 2026-10-21T19:14:00+00:00 greenhouse-api 404     https://boards-api.greenhouse.io/v1/boards/airbnb/jobs/6768605
10 2026-10-21T19:14:03+00:00 page-checker   exit 0  https://job-boards.greenhouse.io/figma/jobs/5552580004
11 2026-10-21T19:14:03+00:00 redirect-hop   200     https://job-boards.greenhouse.io/figma/jobs/5552580004
12 2026-10-21T19:14:03+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/figma/jobs/5552580004
13 2026-10-21T19:14:07+00:00 page-checker   exit 0  https://www.builtinaustin.com/job/data-scientist-search/9459092
14 2026-10-21T19:14:09+00:00 page-checker   exit 0  https://job-boards.greenhouse.io/moloco/jobs/7985823003
15 2026-10-21T19:14:10+00:00 redirect-hop   200     https://job-boards.greenhouse.io/moloco/jobs/7985823003
16 2026-10-21T19:14:10+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/moloco/jobs/7985823003
17 2026-10-21T19:14:13+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/instacart/jobs/8236905
18 2026-10-21T19:14:13+00:00 redirect-hop   302     https://job-boards.greenhouse.io/instacart/jobs/8236905  -> https://instacart.careers/job/?gh_jid=8236905
19 2026-10-21T19:14:13+00:00 redirect-hop   308     https://instacart.careers/job/?gh_jid=8236905  -> https://www.instacart.careers/job/?gh_jid=8236905
20 2026-10-21T19:14:13+00:00 redirect-hop   308     https://www.instacart.careers/job/?gh_jid=8236905  -> /job?gh_jid=8236905
21 2026-10-21T19:14:14+00:00 redirect-hop   200     https://www.instacart.careers/job?gh_jid=8236905
22 2026-10-21T19:14:14+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/instacart/jobs/8236905
23 2026-10-21T19:14:17+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/nextdoor/jobs/7948362
24 2026-10-21T19:14:17+00:00 redirect-hop   302     https://job-boards.greenhouse.io/nextdoor/jobs/7948362  -> https://about.nextdoor.com/careers-list/?gh_jid=7948362
25 2026-10-21T19:14:17+00:00 redirect-hop   200     https://about.nextdoor.com/careers-list/?gh_jid=7948362
26 2026-10-21T19:14:18+00:00 greenhouse-api 200     https://boards-api.greenhouse.io/v1/boards/nextdoor/jobs/7948362
27 2026-10-21T19:14:20+00:00 page-checker   exit 1  https://builtin.com/company/moloco/jobs
28 2026-10-21T19:14:23+00:00 page-checker   exit 1  https://job-boards.greenhouse.io/moloco/jobs/9999999999
29 2026-10-21T19:14:23+00:00 redirect-hop   302     https://job-boards.greenhouse.io/moloco/jobs/9999999999  -> /moloco?error=true
30 2026-10-21T19:14:23+00:00 redirect-hop   200     https://job-boards.greenhouse.io/moloco?error=true
31 2026-10-21T19:14:24+00:00 greenhouse-api 404     https://boards-api.greenhouse.io/v1/boards/moloco/jobs/9999999999
totals by purpose: {'page-checker': 10, 'redirect-hop': 15, 'greenhouse-api': 6}
```

### Full Run 3 mode-report.md

`worked-run/out-run3/mode-report.md`, inserted unchanged:

````markdown
## Executive summary

This is a screening report for Sasha Jones, a fictional international student looking for an entry-level data scientist job that will sponsor a work visa. It checks 13 job postings and recommends which ones are worth an application.

Read it before applying to anything on the list: a posting is only scored if the company has a record of sponsoring visas, the job is confirmed open on the employer's own website, and the job title is not above entry level. Job-listing sites are not trusted on their own, because one of them showed a removed job as open in an earlier run.

**What it found:** 2 of 13 postings passed every check and were scored (2 Apply). 3 were confirmed closed on the employer's own page and need no action. 2 are above entry level by job title (for example senior or staff) and were not scored. 6 were held back without a score: 2 because the only sign the job was open came from a job-listing site, 1 because the link was not on a recognized employer or hiring-system site and 3 for a missing sponsorship record or missing input. Where an employer's hiring system publishes a record of the job, that record decided whether the job is open. Nothing is decided until a person reviews the table below.

## Run record

- Mode `rithika-sr-ds-h1b-liveness` v0.3.0, building on `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.
- Run date 2026-10-21 (--today). Liveness source: network: npm run --silent ats:liveness -- <url>.
- Visa timeline factor **1.0**: 76 days until EAD start + 70 unemployment days left = 146 available / 60-day hiring lag. [your-input]
- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. No model judgment was used.
- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).

## Roles

| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | Level | G3 timeline | Decision | Score | Flags |
|---|---|---|---|---|---|---|---|---|---|
| MAPLEBEAR INC | Data Scientist | pass (Proven) | posting: active [page-checker] | held (builtin.com) | — | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| Instacart | Data Scientist | HELD: not found | — | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| Airbnb | Staff Data Scientist, Locations | HELD: not found | — | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| AIRBNB INC | Data Scientist, Platform | pass (Proven) | posting: expired [page-checker] | n/a | — | — | **CLOSED** | CLOSED — posting verified closed (posting page checker said expired: HTTP 404) |  |
| AIRBNB INC | Staff Data Scientist, Locations | pass (Proven) | posting: expired [ats-record] | n/a | — | — | **CLOSED** | CLOSED — posting verified closed (posting page ATS record: HTTP 404) | ⚠ page checker said active; ATS record expired<br>⚠ final URL after redirects does not contain the job id: https://careers.airbnb.com/positions/ |
| FIGMA INC | Data Scientist | pass (Proven) | posting: active [ats-record] | n/a | pass | 1.0 | **Apply** | 0.435 | ⚠ Apply comes mainly from sponsorship (fit < 0.5) |
| NEXTDOOR INC | Data Scientist - Search (Senior) | pass (Proven) | posting: active [page-checker] | held (builtinaustin.com) | — | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| $AVY INC | Data Scientist (no posting found) | HELD: no sponsorship record | — | — | — | — | **HELD** | HELD — G1: company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) |  |
| MOLOCO INC | Data Scientist II, Product - Moloco Commerce Media | pass (Proven) | posting: active [ats-record] | n/a | pass | 1.0 | **Apply** | 0.465 | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: active [ats-record] | n/a | OVER-LEVEL: 'senior' (candidate title) | — | **OVER-LEVEL** | OVER-LEVEL — title says 'senior' | ⚠ page checker said uncertain; ATS record active<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ note: third-party copy says no visa sponsorship for this role; CSV sponsorship is company-wide — G4 review |
| NEXTDOOR INC | Senior Data Scientist - Search | pass (Proven) | posting: active [page-checker]; employer: active [ats-record] | pass (builtinaustin.com) | OVER-LEVEL: 'senior' (candidate title) | — | **OVER-LEVEL** | OVER-LEVEL — title says 'senior' | ⚠ page checker said uncertain; ATS record active<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ posting is on an aggregator; the employer page decided liveness |
| MOLOCO INC | Data Scientist (deliberately broken employer_url) | pass (Proven) | posting: uncertain [page-checker]; employer: expired [ats-record] | closed (builtin.com) | — | — | **CLOSED** | CLOSED — posting verified closed (employer page ATS record: HTTP 404) | ⚠ final URL after redirects does not contain the job id: https://job-boards.greenhouse.io/moloco?error=true<br>⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: unrecognized [allowlist] | n/a | — | — | **HELD** | HELD — G2a: source not recognized as employer or ATS | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |

## Next action for held roles

- **MAPLEBEAR INC — Data Scientist:** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **Instacart — Data Scientist:** Search the CSV by hand for the legal name before deciding.
- **Airbnb — Staff Data Scientist, Locations:** Search the CSV by hand for the legal name before deciding.
- **NEXTDOOR INC — Data Scientist - Search (Senior):** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **$AVY INC — Data Scientist (no posting found):** Treat sponsorship as unknown; network to ask before applying.
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Find this job on the employer's own careers page or ATS instead of https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals.

## ATS records and redirect chains (employer pages)

| URL | Allowlisted as | ATS record | Redirect hops | Final URL has job id | Decided by |
|---|---|---|---|---|---|
| https://careers.airbnb.com/positions/6632687 | careers.airbnb.com | — | 404 | yes | page-checker |
| https://boards.greenhouse.io/airbnb/jobs/6768605 | greenhouse.io | expired (HTTP 404) | 301 → 302 → 302 → 200 | NO (https://careers.airbnb.com/positions/) | ats-record |
| https://job-boards.greenhouse.io/figma/jobs/5552580004 | greenhouse.io | active (HTTP 200, 'Data Scientist  ') | 200 | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/7985823003 | greenhouse.io | active (HTTP 200, 'Data Scientist II, Product - Moloco Commerce Media') | 200 | yes | ats-record |
| https://job-boards.greenhouse.io/instacart/jobs/8236905 | greenhouse.io | active (HTTP 200, 'Senior Data Scientist I - Meals') | 302 → 308 → 308 → 200 | yes | ats-record |
| https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | greenhouse.io | active (HTTP 200, 'Senior Data Scientist - Search') | 302 → 200 | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/9999999999 | greenhouse.io | expired (HTTP 404) | 302 → 200 | NO (https://job-boards.greenhouse.io/moloco?error=true) | ats-record |
| https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals | not on allowlist | — | — | — | allowlist |

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

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.
- An `active` result means the page loaded and showed a visible apply control. It does not prove the employer is still reviewing applications.
- The aggregator list and the employer allowlist are hand-made rules. A job board missing from both is held as unrecognized; a careers domain missing from the allowlist is held too, even if it is the real employer.
- Only Greenhouse has an ATS record check. Lever, Ashby, Workday and SmartRecruiters pages are allowlisted but still decided by the page checker.
- Whether employer_url is really the same job as posting_url is your-input; this run does not compare the two pages' text.

## Human decision

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role, starting with the ⚠ rows.
````

## Evaluation against the human review

The table is copied from `worked-run/EVALUATION.md`:

| Row | Company | Title (as entered) | Human (G4) | Run 1 (v0.1) | Run 2 (v0.2) | Run 3 (v0.3) |
|---|---|---|---|---|---|---|
| 5 | Airbnb Inc | Staff Data Scientist, Locations | **Skip** | Apply (scorer 0.375) ✗ | CLOSED (G2a: posting verified closed) ✓ | CLOSED (G2a: posting verified closed) ✓ |
| 6 | Figma Inc | Data Scientist | **Consider** | Apply (scorer 0.435) ✗ | Apply (scorer 0.435) ✗ | Apply (scorer 0.435) ✗ |
| 9 | Moloco Inc | Data Scientist II, Product - Moloco Commerce Media | **Apply** | Apply (scorer 0.465) ✓ | Apply (scorer 0.465) ✓ | Apply (scorer 0.465) ✓ |
| 10 | Maplebear Inc | Senior Data Scientist I - Meals (US remote) | **Skip** | HELD (G2a: employer page not active) ✓ | Apply (scorer 0.405) ✗ | OVER-LEVEL (LEVEL: title says 'senior') ✓ |
| 11 | Nextdoor Inc | Senior Data Scientist - Search | **Skip** | HELD (G2b: employer page not active) ✓ | Apply (scorer 0.405) ✗ | OVER-LEVEL (LEVEL: title says 'senior') ✓ |
| | | | **Agreement** | **3 / 5** | **2 / 5** | **4 / 5** |

**Not a held-out evaluation.** The Run 2 and Run 3 rules were designed after rithika-sr reviewed these five postings, and they were checked against the same five. Agreement shows fit to known decisions, not performance on new postings. Five rows are also too few for an error rate.

**Run 1 was partly luck.** It agreed on rows 10 and 11 only because the page checker failed to see their Apply buttons and held them. Once Run 2 read the employer's own records correctly, both senior roles became Apply. The Run 3 level gate is what now sets them aside.

## Verified vs inferred

| Claim | Source | Verified / Inferred / Your-input |
|---|---|---|
| The builtin.com Instacart page (row 1) is a job removed on Jun 11, 2025 | G4 browser check | Verified (human) |
| The page checker still calls it active, in all three runs | raw checker output in each log | Verified (record) |
| Airbnb Staff (row 5) is closed at the employer | Greenhouse API 404 (`R2-D3` call 9, `R3-D3`) + redirect through `?error=true` + G4 saw the all-jobs page | Verified (record + human) |
| Airbnb Platform (row 4) is gone | page checker `expired: HTTP 404`; redirect hop 404 | Verified (record); not opened by a human |
| Fake Moloco id (row 12) is gone | Greenhouse API 404 | Verified (record) |
| Figma (row 6), Moloco (row 9), Instacart Meals (row 10), Nextdoor (row 11) are open | Greenhouse API 200 with matching id; G4 saw Apply buttons on 6, 9, 11 and the posting on 10 | Verified (record + human) |
| The page checker misses the Apply button on the Instacart and Nextdoor Greenhouse pages | checker `uncertain` vs ATS 200 vs G4 | Verified (record + human) |
| Rows 10 and 11 are senior roles | title text in the candidate file and the ATS record; G4 | Verified (record + human) |
| The level gate's word list is the right definition of "entry level" | `level_rules.json` | Your-input |
| Figma (row 6) asks for an experienced data scientist | G4 reading of the description | Verified (human); not visible to the tool |
| Row 7/11 builtinaustin and Greenhouse URLs are the same job | title and team match | Inferred |
| Row 13 General Catalyst page shows the Instacart Meals role | G4 browser check | Verified (human) |
| The General Catalyst site is not an employer or ATS | allowlist rule | Your-input (rule); no network call made |
| Instacart Meals role (row 10) will not sponsor a visa | third-party copy (resumly.ai) | Inferred; not checked on the employer page |
| MOLOCO INC: 200 approvals, 2 denials, 99.0099% | independent CSV read vs log (D5) | Verified (record, cross-checked) |
| Other companies' sponsorship counts and tiers | CSV, read by the imported G1 code | Record; not independently cross-checked |
| Composites 0.375 / 0.435 / 0.465 / 0.405 | scorer; hand arithmetic 0.315 + fit × 0.30 | Verified (hand arithmetic) |
| Fit values rows 1–8 / rows 9–13 | 2026-10-03 file / proposed by Claude Code, accepted by rithika-sr | Your-input / Inferred |
| Visa timeline factor 1.0 | persona dates (fictional) and `--today` | Your-input |
| TLS trust came from `/etc/ssl/cert.pem` in Runs 2–3 | `tls_ca_source` in each log | Verified (record) |
| Agreement 3/5 → 2/5 → 4/5 | computed from the three logs and the G4 file by script | Verified (computed); not held out |
| No entry-level DS posting at the checked sponsors on 2026-10-21 | Greenhouse/Lever/Ashby boards queried for about 30 sponsor names | Inferred (not exhaustive) |
| Runs 2 and 3 replay offline to identical decisions | `R2-D2`, `R3-D2` | Verified (machine) |

## Verification

1. **Reproducibility.**
   - Run 1: the fixture run was repeated twice with identical reports.
   - Runs 2 and 3: each live run was replayed twice from its recorded `replay-fixture.json`, with identical reports, and replay = live on all 13 roles. The logs differ only in fields that contain the output folder path.
2. **JSON validity:** `python3 -m json.tool` exits 0 on every `mode-log.json` and replay fixture checked (D4, `R2-D2`, `R3-D2`).
3. **Count cross-check:** MOLOCO INC read from the CSV with an independent one-liner equals the log: 200 / 2 / 99.009900990099 (D5).
4. **Hand arithmetic:** a Proven sponsor contributes 0.9 × 0.35 = 0.315; adding fit × 0.30 gives:
   - Airbnb 0.375;
   - Figma 0.435;
   - Moloco 0.465;
   - Instacart Meals and Nextdoor 0.405 (fit 0.3).
   All match the reports.
5. **Earlier runs untouched:** Run 1 files were fingerprinted before and after Run 2, and Run 1 + Run 2 files before and after Run 3. Both comparisons were identical.
6. **Break attempts (all runs):**
   - row 1, aggregator-only removed job: HELD;
   - row 12, fake Greenhouse id: CLOSED;
   - row 13, unlisted job board: held by accident in Run 1, held by the allowlist with no network call in Runs 2–3;
   - `--out-dir /tmp/x`: exit 2 (D6).
7. **Human browser check (G4):** rithika-sr opened rows 1, 5, 6, 9, 10, 11 and 13 after Run 1. Run 2's Airbnb CLOSED was cross-checked against the redirect chain recorded with `curl` (D7) and by the tool (`R2-D3` calls 5–9).

## Attestation

Drafted by Claude Code from the terminal transcripts above; reviewed by rithika-sr.

- Recipe: rithika-sr-ds-h1b-liveness v0.3.0
- By: rithika-sr · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v` (`R3-T1`) | 69 tests, OK; old prototype 17 OK | all pass |
| Run 1 live (D1) | 3 scored (Apply 3), 2 CLOSED, 8 HELD | completes; holds what it cannot confirm |
| Run 2 live, first attempt (`R2-D1a`) | every `urllib` call failed TLS; 0 scored, 1 closed, 12 held | — (environment failure, found here) |
| Run 2 live after the CA fix (`R2-D1`) | 4 scored (Apply 4), 3 CLOSED, 6 HELD | completes with ATS records |
| Run 3 live (`R3-D1`) | 2 scored (Apply 2), 3 CLOSED, 2 OVER-LEVEL, 6 HELD | senior roles set aside |
| Offline replays: Run 1 fixture ×2 (D2), Run 2 ×2 (`R2-D2`), Run 3 ×2 (`R3-D2`) | identical reports; replay = live on 13/13 roles | identical |
| `python3 -m json.tool` on logs and replay fixtures | exit 0 | valid JSON |
| MOLOCO INC count, independent read vs log (D5) | 200 / 2 / 99.0099 in both | equal |
| Airbnb row 5 | Run 1: page checker `active` → Apply (false positive). Runs 2–3: ATS 404 → **CLOSED** | CLOSED |
| General Catalyst row 13 | Run 1: HELD only via navigation error. Runs 2–3: **HELD by the allowlist**, no network call | held by rule |
| Nextdoor row 11 | Run 1: HELD (checker uncertain; human saw Apply = false negative). Run 2: **open via ATS 200**. Run 3: OVER-LEVEL | live via ATS; not recommended |
| Level gate rows 10 and 11 (Run 3) | OVER-LEVEL "title says 'senior'", not scored | OVER-LEVEL |
| **Break 1:** builtin.com page, posting only (row 1) | HELD in all runs | HELD |
| **Break 2:** real Greenhouse domain, fake job id (row 12) | CLOSED in all runs (Run 1 by error redirect, Runs 2–3 by ATS 404) | CLOSED |
| **Break 3:** unlisted job board (row 13) | Run 1 HELD by accident; Runs 2–3 HELD by rule | held |
| **Break:** `--out-dir /tmp/x` (D6); out-dir escape tests | `✗ stopped`, exit 2, nothing written | exit 2 |
| Agreement with G4 on rows 5, 6, 9, 10, 11 (`EVALUATION.md`) | 3/5 → 2/5 → 4/5 | — (not held out) |

### Did not test

- A real `portals.yml` scan with my own portals (only the shipped example, one company).
- JavaScript-driven redirects (the redirect chain follows HTTP redirects only).
- Whether an aggregator URL and its employer URL are the same job.
- Role-level sponsorship text on any posting.
- ATS record checks on Lever, Ashby or Workday (none in the candidates; not implemented).
- Seniority written only in a job description.
- Any held-out evaluation: every rule was checked on rows already reviewed.
- Entry-level postings: none found at the checked sponsors on 2026-10-21.
- `--max-level any` in a live run (tests only).

### Broke during testing, fixed

- An `expired` employer page showed as HELD → added a separate CLOSED outcome (no score).
- A URL missing from the offline fixture was labelled "unparseable" → relabelled "no liveness check recorded".
- A test read another test class's state before that class ran → moved into its own class.
- The earlier recipe claimed RUNNABLE-SAMPLE with open TODOs → corrected to DRAFT.
- Environment: PyYAML missing → repo `.venv`. iCloud had duplicated four tracked folders → restored, and the copies were moved out after a diff.
- Run 2's first attempt failed on TLS: the python.org Python had no CA certificates → fallback to the macOS system bundle, with verification on.
- Correct liveness made Senior roles (rows 10, 11) flip to Apply in Run 2 → rule-based level gate in Run 3.
- A false title-mismatch flag on row 10 came from "(US remote)" → title comparison ignores parenthetical text.

## Lifecycle note

The recipe stays **DRAFT** at v0.3.0 with 13 open typed TODOs. Moving to SPECIFIED requires zero open TODOs, each closed with its evidence. Four items were closed with evidence in these runs:
- the final URL must identify the job;
- the employer allowlist;
- the Greenhouse false negative;
- the title-mismatch noise.

Seniority is only partly addressed. The remaining items include the one that matters most for trust: a held-out evaluation on postings decided by a person before the tool runs. Promoting the recipe on agreement measured against its own design cases would claim evidence that does not exist.

## Reflection

**What went well.**
- The tool never scored a posting it could not confirm, including during the run where every network check failed.
- Each fix was driven by a specific, recorded failure: a row, a transcript and a human observation.
- Asking the employer's hiring system for its own job record fixed both a false positive and a false negative at once.
- Every live run can be replayed offline exactly.

**What is still wrong or missing.**
- The evaluation is circular: the rules were written after seeing these five decisions.
- Figma still says Apply because its experience requirement is only in the description.
- Sponsorship alone still clears the Apply line, and among scored roles nothing is ever skipped.
- Role-level "no sponsorship" text is not read.
- Only Greenhouse jobs get a record check.
- No entry-level posting was found, so the persona's real target was never tested.

**Next steps.**
1. Held-out test first: a person decides a new set of postings before the tool runs on them, then compare.
2. Role-level sponsorship clause check on the employer page.
3. Record checks for Lever, Ashby and Workday, and a description-level seniority check.
