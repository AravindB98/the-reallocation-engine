# Card: PM/APM live-posting and sponsor-record gate (shinde-pras-pm-apm-live-sponsor)

## Executive summary

This is the one-page companion to a draft mode for international graduates weighing product manager postings while their allowed unemployment days run down. It checks whether each posting still looks open and whether the employer appears in a public sponsorship record, and it puts a posting on hold for a person to check whenever either answer is unclear. It never judges visa eligibility. The checks have run end to end on three public postings; it remains a draft.

## Purpose
Decide, per PM/APM posting, between Consider or Skip (scorer) and HOLD with a reason (this mode), without guessing any gate value. Apply is not reachable: sponsorship rule v0.1 never assigns the Proven tier, and the scorer downgrades Likely or Unknown tiers to Consider.

## What it can verify
- The liveness tool's verdict for a posting at check time, and whether a fake-id control on the same host is rejected.
- Whether the employer's normalized name has exactly one row in the 80-Days CSV, and that row's approval counts and titles (observed for three postings).
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
- `npm run ats:liveness -- <posting> <control>`: posting must be `active` and the control must not be; "insufficient content" or `uncertain` means a person checks. The control is the same URL with the last 3 characters of the job-identifying path segment or query value changed; if no job id can be identified, the control cannot be built and the host is VOID (HOLD for every posting on it). A non-zero exit is expected when a control is in the same call; read the per-URL lines.
- `npm run score -- <roles.json> --profile <p.json> --out-dir <private dir>`: only for postings with every gate resolved.

## What it produces
- A JSON log (machine) and a Markdown report with one row per posting (person), both under `private/` by default.
- The run stops only for run-level faults (missing CSV, no Chromium, bad timeline, scorer error, something private about to be tracked). An AMBIGUOUS name match or a void control puts only that posting or host on HOLD, and the run continues.

## Named failure modes
- **Silent gate pass:** the scorer treats a missing liveness or timeline value as 1, so an unchecked posting can look healthy. Guard: HOLD routing before the scorer.
- **Legal-name miss read as "no sponsor":** brand names rarely equal filing names, so an exact lookup returns nothing. Guard: CANDIDATE state and the NOT_FOUND wording; hardest to catch for someone who trusts an empty result.
