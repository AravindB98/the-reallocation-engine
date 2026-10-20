# RUN_LOG entry (for the submission zip)

Not appended to `logs/RUN_LOG.md`: CONTRIBUTING.md reserves that file for maintainers. The per-run log is `logs/runs/2026fa-dmehta1310-2.md`.

## Executive summary

This is the project-log entry for one real test of the ghost-job-radar mode on 2026-10-19: an international student's check of a public Stripe data-analyst posting. The open posting passed both gates; a made-up job number was stopped at the first gate. It also records what the liveness tool could not say and what broke along the way.

### 2026-10-19 -- ghost-job-radar v0.2.0 (RUNNABLE-SAMPLE)
**Mode:** ghost-job-radar (`recipes/cases/2026fa/dmehta1310-ghost-job-radar.md`)
**Inputs:** public Greenhouse posting `stripe/jobs/8189909` ("Data Analyst, NYC"); company `STRIPE INC` from the 80 Days CSV; made-up id `1111111111` (break test); `example.com/careers/data-analyst` (break test); fictional CPT end date 2027-05-15 and 6-week lag; fit 0.7 default.
**Outputs:** `assignments/submissions/dmehta1310/evidence/2026-10-19/` (raw outputs, `roles-stripe-*.json`, `score-*/`); recipe and card v0.2.0; justification; worked run; per-run log.
**Result:** open posting: liveness `active`, timeline `pass`, composite 0.525, scorer bucket Apply. Made-up id: liveness `uncertain` (STOP), composite 0.000, scorer bucket Skip. Unsupported site: `expired` (HTTP 404), no "unsupported" state. `npm run verify` and `npm run doctor` exit 0.
**Open issues:**
- liveness tool says `uncertain`, not "removed", for a missing Greenhouse job (API returns 404);
- no unsupported-site state;
- the scorer ignores the occupation code (`role_quality` weight 0.0);
- the chain is manual and the liveness result is typed by hand;
- sponsorship figure is company-level and historical;
- no logged human gate clearance, so not RUNNABLE-LIVE;
- fixed during the run: non-executable hooks, missing Playwright Chromium, `ats:scan` reading private files (run from a scratch directory).
