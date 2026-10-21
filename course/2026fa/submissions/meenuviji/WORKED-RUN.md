# WORKED-RUN — data-titles-h1b-entry

## Executive summary

**What this is.** A complete worked example of the sponsorship-by-title tool, run on sample data. It shows what went in, the exact commands, what came out, which values came from data and which from the student's own rules, and how the result was checked by hand and by tests. It is built for an international data-analytics student who will need visa sponsorship and wants to know whether an employer has sponsored entry-level data jobs, not just any job.

**Why read it.** It lets a reviewer trace every number on the page to a file or a stated rule, and see where the tool stops and asks a person.

**What it found.**
- From a fresh copy of the committed code, 15 sample postings produced 12 scored results: 2 Apply, 8 Consider, 2 Skip. 2 stopped because the company name was unknown or ambiguous, and 1 was refused because a required value was missing.
- All 28 offline tests pass.
- A hand check of one employer against the raw data matched exactly.
- Two deliberate attempts to break the tool were caught by the right check.
- Every value is either read from data or set by the student's own written rules; no model judgment is used anywhere.
- The low skip rate (17%) comes from how the sample was drawn, not from the tool being lenient.

Status is DRAFT.

---

## Scenario and inputs

Run inputs, from `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json` (all labeled in that file):

| Input | Value | Label | Why (from the file) |
|---|---|---|---|
| `target_titles` | Data Analyst, Business Intelligence Analyst, Data Engineer, Data Scientist, Machine Learning Engineer, AI Engineer | your-input | CHANGE-BRIEF §1 target families. Used for BLS wage context only. |
| `as_of` | 2026-10-03 | your-input | the real run date |
| `opt_start` | 2027-02-01 | your-input | earliest of my expected Feb-Mar 2027 OPT start; earlier start = stricter window |
| `window_days` | 90 | your-input | post-completion OPT unemployment allowance; regulatory figure, not from repo data; verify with DSO |
| `hiring_lag_days` | 60 | your-input | my assumption, not measured |

The file holds run inputs only, with no name, contact or résumé content. No real personal data is used anywhere in this run.

Sample postings, from `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json`, built once by `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py`. The draw uses seed 42 and 2 companies per evidence group, in the order no-record, no-data-title, proven, entry-under-min-approvals, only-mid, only-senior. There are 15 postings in total: 12 seeded draws, plus 3 fixed postings added only to exercise failure cases. Posting titles are fictional, URLs are `jobs.example.com`, and company names are real employer names from the CSV. Every posting uses fit 0.5, labeled your-input with the reason "held constant to isolate the sponsorship signal". The 14 that carry a liveness value use 1.0, labeled your-input with `determined_by` "assumed, not checked".

Evidence-group sizes in the CSV (record, `_meta.group_sizes`): no-record 28812, no-data-title 1309, proven 99, entry-under-min-approvals 41, only-mid 14, only-senior 94 (total 30369).

| ID | Company input | Posting title (fictional) | Target title | URL | Purpose |
|---|---|---|---|---|---|
| s01 | RELATIONSHIP SCIENCE LLC | Data Analyst I | Data Analyst | https://jobs.example.com/s01 | seeded draw from evidence group 'no-record' |
| s02 | BLUE OWL CAPITAL INC | Junior Data Engineer | Data Engineer | https://jobs.example.com/s02 | seeded draw from evidence group 'no-record' |
| s03 | AKOYA BIOSCIENCES INC | Associate Data Scientist | Data Scientist | https://jobs.example.com/s03 | seeded draw from evidence group 'no-data-title' |
| s04 | IMMUNITYBIO INC | Business Intelligence Analyst | Business Intelligence Analyst | https://jobs.example.com/s04 | seeded draw from evidence group 'no-data-title' |
| s05 | ENTRUPY INC | Machine Learning Engineer I | Machine Learning Engineer | https://jobs.example.com/s05 | seeded draw from evidence group 'proven' |
| s06 | DISQO INC | Data Analyst | Data Analyst | https://jobs.example.com/s06 | seeded draw from evidence group 'proven' |
| s07 | CARGO CHIEF ACQUISITION INC | Data Engineer I | Data Engineer | https://jobs.example.com/s07 | seeded draw from evidence group 'entry-under-min-approvals' |
| s08 | BIOME ANALYTICS INC | Associate AI Engineer | AI Engineer | https://jobs.example.com/s08 | seeded draw from evidence group 'entry-under-min-approvals' |
| s09 | PATHAI INC | Junior Business Intelligence Analyst | Business Intelligence Analyst | https://jobs.example.com/s09 | seeded draw from evidence group 'only-mid' |
| s10 | PATHRAI INC | Data Scientist I | Data Scientist | https://jobs.example.com/s10 | seeded draw from evidence group 'only-mid' |
| s11 | ROKU INC | Associate Machine Learning Engineer | Machine Learning Engineer | https://jobs.example.com/s11 | seeded draw from evidence group 'only-senior' |
| s12 | CAMBRIDGE MOBILE TELEMATICS INC | Junior Data Analyst | Data Analyst | https://jobs.example.com/s12 | seeded draw from evidence group 'only-senior' |
| f01 | Quillfeather Data Labs, Inc. | Data Analyst I | Data Analyst | https://jobs.example.com/f01 | §8 company not in CSV (invented name; checked absent) |
| f02 | Arcturus Therapeutics | Associate Data Scientist | Data Scientist | https://jobs.example.com/f02 | §8 normalized name matches more than one row |
| f03 | CENTIFIC GLOBAL SOLUTIONS INC | Junior Data Engineer | Data Engineer | https://jobs.example.com/f03 | §8 missing liveness value (field deliberately absent) |

## Commands and output

Both outputs below were run in a fresh clone of the committed branch at `4a4074e607ba154ca6edf63de816b6f7b9fe49a1`. They are copied verbatim from `course/2026fa/submissions/meenuviji/TEST-REPORT.md`.

Default run (exit 3 = completed with per-role stops; the trailing `[exit code: 0]` belongs to `echo`):

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py ; echo "exit: $?"
```

~~~text
[2026-10-03T18:44:14Z] $ python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py ; echo "exit: $?"
! 15 postings → scored 12 (Apply 2 · Consider 8 · Skip 2) · stopped 2 · refused 1
  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json  +  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
exit: 3
[exit code: 0]
~~~

Offline tests:

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

~~~text
[2026-10-03T18:44:14Z] $ python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
test_bad_argument_exits_2 (test_pipeline.Pipeline) ... ok
test_company_matches_more_than_one_row (test_pipeline.Pipeline) ... ok
test_company_not_in_csv (test_pipeline.Pipeline) ... ok
test_duplicate_evidence_note_for_pathai_and_pathrai (test_pipeline.Pipeline) ... ok
test_exact_match_with_siblings_is_noted_not_stopped (test_pipeline.Pipeline) ... ok
test_gate_closed_skip_gets_gate_next_action (test_pipeline.Pipeline) ... ok
test_happy_path (test_pipeline.Pipeline) ... ok
test_in_csv_without_sponsorship_gives_null_p (test_pipeline.Pipeline) ... ok
test_missing_liveness_is_refused (test_pipeline.Pipeline) ... ok
test_missing_timeline_input_is_refused (test_pipeline.Pipeline) ... ok
test_next_action_differs_by_evidence_group_with_same_recommendation (test_pipeline.Pipeline) ... ok
test_no_duplicate_note_for_distinct_evidence (test_pipeline.Pipeline) ... ok
test_null_sponsorship_p_through_real_scorer (test_pipeline.Pipeline) ... ok
test_only_senior_data_titles (test_pipeline.Pipeline) ... ok
test_opt_window_closed_gates_to_skip (test_pipeline.Pipeline) ... ok
test_projected_start_before_opt_start_is_deferred_not_failed (test_pipeline.Pipeline) ... ok
test_projected_start_on_window_end_is_inside (test_pipeline.Pipeline) ... ok
test_projected_start_one_day_after_window_end_fails (test_pipeline.Pipeline) ... ok
test_run_config_holds_run_inputs_only (test_pipeline.Pipeline) ... ok
test_sha_mismatch_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_target_title_without_bls_row (test_pipeline.Pipeline) ... ok
test_title_family_note_only_when_posting_title_lacks_matched_phrase (test_pipeline.Pipeline) ... ok
test_unlabeled_rule_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_allowlist_is_substring_and_precise (test_pipeline.Rules) ... ok
test_entry_markers_and_unmarked (test_pipeline.Rules) ... ok
test_evidence_groups (test_pipeline.Rules) ... ok
test_level_tokens (test_pipeline.Rules) ... ok
test_whole_word_seniority (test_pipeline.Rules) ... ok

----------------------------------------------------------------------
Ran 28 tests in 11.882s

OK
[exit code: 0]
~~~

The full generated human report is pasted in TEST-REPORT.md under "Sample run". The values in the table below come from `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json`, the committed copy (run_id `2026-10-03T18:13:45Z`). It differs from the fresh-clone run only in that timestamp (TEST-REPORT.md, "Tracked-file side effects").

## Verified vs inferred

**No value in this run is labeled model-judgment.** Every value is either a record (read from a repo data file, or returned by the unmodified scorer) or your-input (a rule or value Meena wrote). Source files:
- CSV = `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- BLS = `data/bls/compact/soc_occupation_compact.csv`
- rules = `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json`
- config = `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json`
- postings = `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json`
- scorer = `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/score/role-scores.json` (written by `scripts/score/role-scorer.mjs`)

All values are as recorded in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json`.

### s01 — Data Analyst I at RELATIONSHIP SCIENCE LLC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `RELATIONSHIP SCIENCE LLC` → `RELATIONSHIP SCIENCE LLC` (NEW YORK, NY), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | empty (no record) | record | CSV |
| Total Denials | empty (no record) | record | CSV |
| Sponsored titles | none | record | CSV |
| Data-family titles → bucket | none | your-input | rules (applied to CSV titles) |
| Evidence group | no-record | your-input | rules |
| Tier | unknown (rule no-record) | your-input | rules |
| p | null (vote dropped by scorer) | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.15 — `(0.5·0.3) × 1 × 1 = 0.150` | record | scorer |
| Recommendation | Skip | record | scorer |
| Next action | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | your-input | rules |

### s02 — Junior Data Engineer at BLUE OWL CAPITAL INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `BLUE OWL CAPITAL INC` → `BLUE OWL CAPITAL INC` (New York, NY), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | empty (no record) | record | CSV |
| Total Denials | empty (no record) | record | CSV |
| Sponsored titles | none | record | CSV |
| Data-family titles → bucket | none | your-input | rules (applied to CSV titles) |
| Evidence group | no-record | your-input | rules |
| Tier | unknown (rule no-record) | your-input | rules |
| p | null (vote dropped by scorer) | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.15 — `(0.5·0.3) × 1 × 1 = 0.150` | record | scorer |
| Recommendation | Skip | record | scorer |
| Next action | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | your-input | rules |

### s03 — Associate Data Scientist at AKOYA BIOSCIENCES INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `AKOYA BIOSCIENCES INC` → `AKOYA BIOSCIENCES INC` (SAN FRANCISCO, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 26.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Senior Research Associate; Sr. Product Manager, PhenoCycler Instruments | record | CSV |
| Data-family titles → bucket | none | your-input | rules (applied to CSV titles) |
| Evidence group | no-data-title | your-input | rules |
| Tier | possible (rule no-data-title) | your-input | rules |
| p | 0.3 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | 15-2051 Data Scientists median 112590.0 | record | BLS |
| Scorer composite | 0.255 — `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor, but not data roles. Low priority: network only through a warm contact. | your-input | rules |

### s04 — Business Intelligence Analyst at IMMUNITYBIO INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `IMMUNITYBIO INC` → `IMMUNITYBIO INC` (SAN DIEGO, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 20.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Application Systems Analyst-Dynamics AX; Senior Statistical Programmer; Research Associate II | record | CSV |
| Data-family titles → bucket | none | your-input | rules (applied to CSV titles) |
| Evidence group | no-data-title | your-input | rules |
| Tier | possible (rule no-data-title) | your-input | rules |
| p | 0.3 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | 15-2051 Business Intelligence Analysts median 112590.0 | record | BLS |
| Scorer composite | 0.255 — `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor, but not data roles. Low priority: network only through a warm contact. | your-input | rules |

### s05 — Machine Learning Engineer I at ENTRUPY INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `ENTRUPY INC` → `ENTRUPY INC` (NEW YORK, NY), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 10.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Data Engineer; Engineering Team Lead | record | CSV |
| Data-family titles → bucket | Data Engineer → entry-or-unmarked | your-input | rules (applied to CSV titles) |
| Evidence group | proven | your-input | rules |
| Tier | Proven (rule proven) | your-input | rules |
| p | 0.7 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.395 — `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` | record | scorer |
| Recommendation | Apply | record | scorer |
| Next action | Tailor an application (research-and-apply hours). | your-input | rules |

### s06 — Data Analyst at DISQO INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `DISQO INC` → `DISQO INC` (GLENDALE, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 24.0 | record | CSV |
| Total Denials | 2.0 | record | CSV |
| Sponsored titles | Lead Software Engineer; Software Engineer, Java; Data Analyst; Senior Data Analyst; Site Reliability Engineer | record | CSV |
| Data-family titles → bucket | Data Analyst → entry-or-unmarked; Senior Data Analyst → senior | your-input | rules (applied to CSV titles) |
| Evidence group | proven | your-input | rules |
| Tier | Proven (rule proven) | your-input | rules |
| p | 0.7 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.395 — `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` | record | scorer |
| Recommendation | Apply | record | scorer |
| Next action | Tailor an application (research-and-apply hours). | your-input | rules |

### s07 — Data Engineer I at CARGO CHIEF ACQUISITION INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `CARGO CHIEF ACQUISITION INC` → `CARGO CHIEF ACQUISITION INC` (SAN FRANCISCO, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 2.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Machine Learning Engineer | record | CSV |
| Data-family titles → bucket | Machine Learning Engineer → entry-or-unmarked | your-input | rules (applied to CSV titles) |
| Evidence group | entry-under-min-approvals | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | your-input | rules |

### s08 — Associate AI Engineer at BIOME ANALYTICS INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `BIOME ANALYTICS INC` → `BIOME ANALYTICS INC` (SAN FRANCISCO, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 2.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Software Data Engineer | record | CSV |
| Data-family titles → bucket | Software Data Engineer → entry-or-unmarked | your-input | rules (applied to CSV titles) |
| Evidence group | entry-under-min-approvals | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | your-input | rules |

### s09 — Junior Business Intelligence Analyst at PATHAI INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `PATHAI INC` → `PATHAI INC` (CAMBRIDGE, MA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 78.0 | record | CSV |
| Total Denials | 2.0 | record | CSV |
| Sponsored titles | Software Engineer I; Director of Engineering; Machine Learning Engineer III; Senior Machine Learning Engineer; Machine Learning Engineer II | record | CSV |
| Data-family titles → bucket | Machine Learning Engineer III → senior; Senior Machine Learning Engineer → senior; Machine Learning Engineer II → mid | your-input | rules (applied to CSV titles) |
| Evidence group | only-mid | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | 15-2051 Business Intelligence Analysts median 112590.0 | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | your-input | rules |

### s10 — Data Scientist I at PATHRAI INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `PATHRAI INC` → `PATHRAI INC` (MOUNTAIN VIEW, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 78.0 | record | CSV |
| Total Denials | 2.0 | record | CSV |
| Sponsored titles | Software Engineer I; Director of Engineering; Machine Learning Engineer III; Senior Machine Learning Engineer; Machine Learning Engineer II | record | CSV |
| Data-family titles → bucket | Machine Learning Engineer III → senior; Senior Machine Learning Engineer → senior; Machine Learning Engineer II → mid | your-input | rules (applied to CSV titles) |
| Evidence group | only-mid | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | 15-2051 Data Scientists median 112590.0 | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | your-input | rules |

### s11 — Associate Machine Learning Engineer at ROKU INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `ROKU INC` → `ROKU INC` (SARATOGA, CA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 654.0 | record | CSV |
| Total Denials | 4.0 | record | CSV |
| Sponsored titles | Senior Software Engineer; Senior Data Scientist; Software Engineer; Product Manager; Senior Data Engineer | record | CSV |
| Data-family titles → bucket | Senior Data Scientist → senior; Senior Data Engineer → senior | your-input | rules (applied to CSV titles) |
| Evidence group | only-senior | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | your-input | rules |

### s12 — Junior Data Analyst at CAMBRIDGE MOBILE TELEMATICS INC

| Value | As recorded | Label | Source |
|---|---|---|---|
| Company match | input `CAMBRIDGE MOBILE TELEMATICS INC` → `CAMBRIDGE MOBILE TELEMATICS INC` (CAMBRIDGE, MA), rule exact-upper-case | record | CSV (rule: §5a, rules/suffix list) |
| Total Approvals | 72.0 | record | CSV |
| Total Denials | 0.0 | record | CSV |
| Sponsored titles | Director of Product Management; Principal Data Scientist I; Principal Commodity Specialist I; Senior Software Engineer - Machine Learning | record | CSV |
| Data-family titles → bucket | Principal Data Scientist I → senior | your-input | rules (applied to CSV titles) |
| Evidence group | only-senior | your-input | rules |
| Tier | possible (rule otherwise) | your-input | rules |
| p | 0.5 | your-input | rules |
| Fit | 0.5 | your-input | postings |
| Liveness | 1.0 (assumed, not checked) | your-input | postings |
| Timeline | 1.0 — projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0 | your-input | config + rules |
| BLS context | no SOC row | record | BLS |
| Scorer composite | 0.325 — `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` | record | scorer |
| Recommendation | Consider | record | scorer |
| Next action | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | your-input | rules |

Labels used across all 12 scored postings: record, your-input. model-judgment: not used.

## Verification

### (a) Hand cross-check of ROKU INC against the raw CSV — run by Meena

Quoted from `course/2026fa/submissions/meenuviji/recon/hand-checks.txt` (Meena's own Terminal checks):

~~~text
  1  === Hand checks run by Meena, 2026-10-03T18:48:56Z ===
  2  --- 1. ROKU cross-check against raw CSV
  3  company_name = ROKU INC
  4  city = SARATOGA
  5  state = CA
  6  Total Approvals = 654.0
  7  Total Denials = 4.0
  8  Approval_Rate = 99.3920972644377
  9  median_salary_offered = 182155.0
 10  top_job_titles_sponsored = ['Senior Software Engineer', 'Senior Data Scientist', 'Software Engineer', 'Product Manager', 'Senior Data Engineer']
~~~

Recorded in `out/run.json` for s11 (ROKU INC): approvals 654.0, denials 4.0, rate 99.3920972644377, median 182155.0, titles ['Senior Software Engineer', 'Senior Data Scientist', 'Software Engineer', 'Product Manager', 'Senior Data Engineer']. These are the same values as the hand check.

### (b) Tests

All 28 offline tests pass in the fresh clone (full `-v` output in "Commands and output" above). Each failure case in CHANGE-BRIEF §8, and each Revision 1 timeline case, is mapped to its test in TEST-REPORT.md, "Failure cases exercised".

### (c) Deliberate break attempts — run by Meena

Quoted from `recon/hand-checks.txt`. Break 1 misspells ROKU as `R0KU` (zero for O). Break 2 removes ROKU's liveness value:

~~~text
 11  --- 2. Break: R0KU typo
 12  ! 15 postings → scored 11 (Apply 2 · Consider 7 · Skip 2) · stopped 3 · refused 1
 13    /private/tmp/break-typo-out/run.json  +  /private/tmp/break-typo-out/report.md
 14  exit: 3
 15  206:| Associate Machine Learning Engineer | R0KU INC | no-match | — |
 16  --- 3. Break: ROKU liveness removed
 17  ! 15 postings → scored 11 (Apply 2 · Consider 7 · Skip 2) · stopped 2 · refused 2
 18    /private/tmp/break-liveness-out/run.json  +  /private/tmp/break-liveness-out/report.md
 19  exit: 3
 20  209:## Refused: missing gate value
 21  210-
 22  211-These were never sent to the scorer, because it treats a missing value as the best case (1.0).
 23  212-
 24  213-| Posting | Employer | Missing |
 25  214-|---|---|---|
 26  215-| Associate Machine Learning Engineer | ROKU INC | liveness.factor missing or not numeric |
~~~

### (d) Why the skip rate is 17%

2 of 12 scored postings are Skip (16.7%, `out/run.json` → `counts`), well below the 50% DOMAIN.md calls healthy. The cause is the sample design, not the tool. The sample is stratified at 2 postings per evidence group, so each of the six groups carries equal weight. But 28812 of 30369 CSV companies (94.9%) are in the no-record group, and that is the only group that scores Skip at fit 0.5: the sponsorship vote is dropped, so the composite is 0.5 × 0.3 = 0.150, below the 0.20 Consider floor (`out/report.md`). A sample drawn in proportion to the CSV would be mostly no-record postings and would skip far more often. The report states this as "The sample is stratified (2 per group), so its skip rate is not representative."

## Reflection

Written by Meena (meenuviji)

**What worked.** I am most confident in keeping the evidence checks separate from the final decision. Instead of assuming that a company is a good target just because it appears in the sponsorship data, the prototype checks the available evidence and stops when something important is missing or ambiguous. This makes the result easier to trace and prevents the prototype from presenting an assumption as a verified fact.

**What surprised me / what was missed.** The correction that surprised me most was the duplicate evidence for PATHAI/PATHRAI. I initially thought a company-name match would be straightforward, but small differences in company names can point to duplicate or ambiguous records. It showed me that finding a row is not enough; I also need to verify that it is actually the right company before using its sponsorship history.

**One concrete next improvement.** The first improvement I would build is better company identity matching. I would add normalization and additional checks such as location or other company identifiers so that similar company names do not automatically get treated as the same employer. If the evidence is still ambiguous, the prototype should stop and ask for human review rather than choosing automatically. Location alone would not have caught PATHAI/PATHRAI, since their cities differ; that case needs the CSV-wide duplicate-evidence scan listed as [TODO: DEV] #6 in the recipe, or a real company identifier, which the 80 Days CSV does not carry.

Facts available for the reflection (from the record, not my words):

- **Timeline rule.** The original §7 rule treated a projected start before `opt_start` as a failure. That would have gated every role for a pre-OPT student applying months ahead, and was found when the build needed an artificial future `as_of`. It was corrected in CHANGE-BRIEF Revision 1 (commit 47a5b79): an early start is now a deferred start (noted, factor 1.0).
- **Sampling per tier.** The first sample drew 2 companies per sponsorship tier. Thin-evidence (fewer than 5 approvals) and only-mid companies were folded into the same tier as other cases. Drawing per evidence group (six groups) made them visible.
- **All non-Skip groups landed in Consider.** In the default run, 8 of 12 scored postings are Consider across four different evidence groups (`out/report.md`). Per-group next actions now tell those groups apart; the scorer's recommendations themselves are unchanged.
- **Headline counts fell under the stricter allowlist.** Under the final rules: 248 / 94 / 39, against 421 / 171 / 68 under the probe's substring rule (CHANGE-BRIEF Revision 2; `recon/recipe-path-check.md`).
- **Duplicate evidence.** `PATHAI INC` (Cambridge, MA) and `PATHRAI INC` (Mountain View, CA) carry identical sponsorship records (`out/report.md`). *Inference about cause, not verified:* `data/80-days-to-stay/80-days-day-08/README.md` line 21 says the original SEC-to-LCA join used fuzzy matching with RapidFuzz, which could attach one employer's record to a similar name.
- **Status claim.** The recipe was drafted as RUNNABLE-SAMPLE and changed to DRAFT before commit, under SNICKERDOODLE.md's lifecycle rules (7 open TODO items). It was committed as DRAFT in 4a4074e.

## Attestation

- Recipe: data-titles-h1b-entry v0.1.0
- By: Meena (meenuviji) · 2026-10-03

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Default run in a fresh clone at 4a4074e: `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` | `! 15 postings → scored 12 (Apply 2 · Consider 8 · Skip 2) · stopped 2 · refused 1`, `exit: 3` (TEST-REPORT.md) | Recipe phase gates G1/G2 and CHANGE-BRIEF §8: the unknown and ambiguous companies stop at the company-match gate, the missing liveness value is refused, and exit 3 means completed with stops |
| `python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v` in the fresh clone | `Ran 28 tests` … `OK` (TEST-REPORT.md) | CHANGE-BRIEF §8: each failure case has an offline test; §10: offline tests pass |
| `node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` and `node scripts/conformance.mjs recipes/cases/2026fa/` | `conformance: 38 files (3 md · 12 py · 23 json)` ✓; `conformance: 2 files (2 md)` ✓ (TEST-REPORT.md) | CHANGE-BRIEF §10: conformance passes |
| `npm run doctor` and `npm run verify`, before and after the run, in the fresh clone | doctor `environment: ✓ runnable`, exit 0; verify `✓ all conform` and `✓ manifest check passed (3 warnings)`, exit 0, both times (TEST-REPORT.md) | CHANGE-BRIEF §10: `npm run verify` passes on a fresh clone of the branch |
| Meena's hand cross-check of ROKU INC against the raw CSV (`recon/hand-checks.txt`) | 654.0 approvals, 4.0 denials, rate 99.3920972644377, median 182155.0, same five titles, identical to `out/run.json` s11 | Recipe "Can verify → Records quoted as-is": approvals, denials, rate, median and title list are quoted from the CSV unchanged |
| Meena's break 1: company input misspelled `R0KU INC` (`recon/hand-checks.txt`) | `stopped 3`, `exit: 3`, report row `\| Associate Machine Learning Engineer \| R0KU INC \| no-match \| — \|` | CHANGE-BRIEF §8 and recipe G1: a company not in the CSV stops at the company-match gate; never guess a nearest name |
| Meena's break 2: ROKU posting's liveness removed (`recon/hand-checks.txt`) | `refused 2`, `exit: 3`, report row `\| Associate Machine Learning Engineer \| ROKU INC \| liveness.factor missing or not numeric \|` | CHANGE-BRIEF §7/§8 and recipe G2: a missing gate value is refused and never written to `roles.json` |
| `node scripts/pii-scan.mjs` (full working tree, fresh clone) | exit 1, one finding: `[email] package-lock.json — <redacted: third-party address from glob's npm deprecation notice; package-lock.json line 606>`; the line is on origin/main and the branch does not change that file (TEST-REPORT.md) | DATA_CONTRACT.md §Zero-Conditions: no real personal data committed in this branch |
| `node scripts/pii-scan.mjs --diff origin/main` (fresh clone) | `pii-scan: clean ✓`, exit 0 (TEST-REPORT.md) | DATA_CONTRACT.md §Zero-Conditions: branch history contains no PII |

### Did not test

- Live liveness (`npm run ats:liveness`) or any network call
- Real job postings (all postings are fictional)
- Any non-constant fit (fit is 0.5 for every posting)
- Employer identity beyond a name match (subsidiaries, DBAs, staffing or consulting sponsors)
- Recency of sponsorship (the CSV counts carry no date range)
- CSV accuracy against DOL or USCIS primary records
- A CSV-wide duplicate-evidence scan (only within a run)
- Linux or Windows (only macOS)
- Python versions other than 3.9.6
- The recipe on a second persona

### Broke during testing, fixed

- **CHANGE-BRIEF formatting.** Failed: Markdown formatting was lost in copy-paste in the first commit (53cc80a). Changed: formatting restored, content unchanged. Where: 3f1182e.
- **Timeline rule.** Failed: a projected start before `opt_start` counted as a failure, so every pre-OPT role would be gated and the build needed an artificial future `as_of`. Changed: early starts became deferred starts (factor 1.0, non-scoring note); only a start after `window_end` fails. Where: CHANGE-BRIEF Revision 1 (47a5b79); code and tests in the prototype commit (e93e817).
- **Sibling-note test assertion.** Failed: `test_exact_match_with_siblings_is_noted_not_stopped` asserted exactly one note in the whole run, and the new deferred-start notes made the count 2. Changed: it now asserts exactly one note of type `sibling-rows` and checks that note's text. This is the same check limited to the note type it was written for, not a loosening. Where: `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests/test_pipeline.py` (in e93e817).
- **Sampling.** Failed: drawing 2 companies per sponsorship tier folded the thin-evidence and only-mid cases into other tiers. Changed: draw 2 per evidence group (six groups). Where: `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py` and `rules.json` → `sample` (in e93e817).
- **Status claim.** Failed: the recipe was drafted as RUNNABLE-SAMPLE with 7 open TODOs and no logged gate, against SNICKERDOODLE.md's lifecycle rules. Changed: status DRAFT. Where: committed as DRAFT in 4a4074e.
- **PII scan finding.** Failed: `node scripts/pii-scan.mjs` exits 1 on the full tree. Traced: the finding is in `package-lock.json` line 606 on origin/main, a file this branch does not change, and `--diff origin/main` is clean. Nothing was changed. Where: TEST-REPORT.md, "PII scan".

