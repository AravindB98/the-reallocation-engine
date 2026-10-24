# Test fixtures

## Executive summary

These are made-up job records used only by the offline tests. They are not real job postings and were not produced by any run. Each one stands for one case the tests check, so a test result never changes when a real job board changes.

## Files

| File | Used by | What it holds |
|---|---|---|
| `jobs.fixture.json` | `index.test.mjs` | four jobs, one per case: `fx-sponsor` (company in the visa file with H-1B approvals, `KLAVIYO INC`), `fx-funding` (funding only, `GITLAB INC`), `fx-not-in-csv` (a fictional company), `fx-dead` (a job id treated as gone from the board). The tests write each job's liveness evidence themselves |

`select-postings.test.mjs` builds its own fake board snapshot inside the test, so it needs no file here.

The company names in `csv_name` point at real rows of the repository's visa file (`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`), so the sponsorship lookup is tested against real data. The URLs, titles, and job ids are invented.
