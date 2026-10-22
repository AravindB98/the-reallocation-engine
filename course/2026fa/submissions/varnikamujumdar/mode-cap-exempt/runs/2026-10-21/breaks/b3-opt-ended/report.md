# Cap-exempt triage report

## Executive summary

This report was meant to sort job postings at employers that can sponsor a work visa without the H-1B lottery. It stopped before looking at any employer, because the person's work authorization does not leave enough time (OPT end after run date: -15 (need > 0); days left on OPT >= hiring lag + H-1B processing: -15 (need >= 66); 66 days are assumed for hiring plus visa processing). Read this as a reason to talk to a school immigration adviser now, not as a ranking.

## Run record

- Mode: `varnikamujumdar-cap-exempt-triage` v0.1.0 · run date 2027-02-15
- Persona: Priya Nair (fictional) · lottery: FY2027 not-selected
- Status: STOPPED at G2 timeline — no employer is evaluated; talk to your DSO before applying
- Record checks: not run — stopped at G2

## Gates

| Gate | Result | Detail |
|---|---|---|
| G1 input | PASS | persona, extension, targets and both CSVs parsed; expected columns present |
| G2 timeline | STOP — OPT end after run date: -15 (need > 0); days left on OPT >= hiring lag + H-1B processing: -15 (need >= 66) | -15 days of OPT left vs 66 required (hiring 45 + processing 21, your-input); margin -81 |
| G3 liveness | per row | unchecked or uncertain → HELD, never scored |
| G4 human | not reached | the run stopped earlier |

_STEM-eligible, but a STEM OPT extension needs an E-Verify employer; current employer E-Verify: no (your-input). This gate uses the current OPT end date only._
