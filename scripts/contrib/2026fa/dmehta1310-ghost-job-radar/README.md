# ghost-job-radar prototype

Prototype for the `ghost-job-radar` recipe
(`recipes/cases/2026fa/dmehta1310-ghost-job-radar.md`). Built for an
international student on F-1 CPT targeting Data Analytics roles, who has
already lost real time to a "ghost" job posting.

## What's here

| File | Purpose |
|---|---|
| `timeline_gate.py` | CPT/program-timeline hard gate. Pure function `evaluate_timeline()` + a CLI wrapper. |
| `test_timeline_gate.py` | 6 offline tests, fixed-date fixture, no network calls. |
| `build_roles_json.py` | Reads the real sponsorship/funding CSV and writes a labeled `roles.json` entry shaped for the existing scorer. |
| `test_build_roles_json.py` | 10 offline tests, small fixture CSV built at test time, no network calls. |

## Run it (one documented command, repo root)

This prototype runs in three steps, because it feeds two hard gates
(liveness, CPT-timeline) into the existing scorer rather than
re-implementing scoring logic:

```bash
# 1. Check the CPT/program-timeline gate for your own dates
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py \
  --end-date 2027-05-15 --lag-weeks 6

# 2. Build a labeled roles.json entry against real sponsorship/funding data
#    (liveness-result and timeline-result come from step 1 and a real
#    `npm run ats:liveness` check on the posting you're evaluating)
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py \
  --company "COMPANY NAME AS IT APPEARS IN THE CSV" \
  --title "Data Analyst" \
  --role-id example-role \
  --liveness-result live \
  --timeline-result pass \
  --out course/2026fa/submissions/dmehta1310/runs/roles.json

# 3. Run the EXISTING scorer (unmodified) on the file just written
npm run score -- course/2026fa/submissions/dmehta1310/runs/roles.json \
  --out-dir course/2026fa/submissions/dmehta1310/runs
```

## Run the tests

```bash
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_timeline_gate.py
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_build_roles_json.py
```

Both suites run entirely offline against fixed dates / a small fixture
CSV built at test time -- no network calls, no dependency on the real
30,000-row dataset.

## What this prototype does NOT do

- It does not call `npm run ats:liveness` for you automatically -- you run
  that separately and pass its result in as `--liveness-result`. This
  keeps the prototype's own tests network-free, per the assignment's
  rules.
- It does not add a 5th field to the existing scorer. Funding data is
  real and labeled, but reported as `funding_context` for the human
  reading the report -- not fed into the composite score, because the
  scorer itself has no dedicated funding term (see `build_roles_json.py`
  module docstring for the full explanation).
- It does not fuzzy-match company names. A near-miss is reported as "no
  record in sample," not guessed.
