# Card: PM/APM live-posting and sponsor-record gate (shinde-pras-pm-apm-live-sponsor)

## Executive summary

This is the one-page companion to a draft mode for international graduates weighing product manager postings while their allowed unemployment days run down. It checks whether each posting still looks open and whether the employer appears in a public sponsorship record, and it puts a posting on hold for a person to check whenever either answer is unclear. It never judges visa eligibility. The checks are designed but not yet run end to end.

## Purpose
Decide, per PM/APM posting, between Apply / Consider / Skip (scorer) and HOLD with a reason (this mode), without guessing any gate value.

## What it can verify
- The liveness tool's verdict for a posting at check time, and whether a fake-id control on the same host is rejected.
- Whether the employer's normalized name has exactly one row in the 80-Days CSV, and that row's approval counts and titles.
- That each decision traces to record, model-judgment or your-input.

## What it cannot verify
- That a posting is really open (a real posting and a fake id got the same verdict on host A in CP1-C).
- That a posting is not a pipeline or evergreen requisition.
- That the employer will sponsor this person or this role; NOT_FOUND only means "not in this dataset".
- E-Verify status, hiring timelines, visa outcomes or eligibility.

## Dependencies
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `scripts/ats/scrapers/common/normalize.py` and `config.py` (suffix normalizer)
- `npm run ats:liveness` (needs Chromium), `npm run score`
- A timeline factor between 0 and 1 (your-input)

## Annotated commands
- `npm run ats:liveness -- <posting> <control>`: posting must be `active` and the control must not be; "insufficient content" or `uncertain` means a person checks.
- `npm run score -- <roles.json> --profile <p.json> --out-dir <private dir>`: only for postings with every gate resolved.

## What it produces
- A JSON log (machine) and a Markdown report with one row per posting (person), both under `private/` by default.

## Named failure modes
- **Silent gate pass:** the scorer treats a missing liveness or timeline value as 1, so an unchecked posting can look healthy. Guard: HOLD routing before the scorer.
- **Legal-name miss read as "no sponsor":** brand names rarely equal filing names, so an exact lookup returns nothing. Guard: CANDIDATE state and the NOT_FOUND wording; hardest to catch for someone who trusts an empty result.
