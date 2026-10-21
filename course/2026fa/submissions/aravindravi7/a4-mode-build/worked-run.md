# Worked run (A4) — PM sponsor title-match v0.2.0, live on 2026-10-21

## Executive summary

*Draft. Written after the live run; only the verification entries below are filled in so far.*

## Predictions (written before the run)

Recorded in `predictions.md` (commits `d96fad9`, `cdcf653`), before any liveness check, scan, or DOL ingest. *Comparison with the outcome: pending.*

## My edits (before → after)

*Pending: from the student's review sheet.*

## Inputs

*Pending.*

## Commands and real output

*Pending.*

## Verified vs. inferred

*Pending.*

## Verification

### Layout PDF checked against the real header row (2026-10-21)

Before the ingest ran, the AI agent read `LCA_Record_Layout_FY2026_Q3.pdf` (pages 1–4) and compared its 98 field names, and the status values it documents, with the header row and first data rows of `LCA_Disclosure_Data_FY2026_Q3.xlsx`. Aravind Ravi reviewed the result. Every column the ingest reads appears in both. Two discrepancies were found and recorded:

| # | Layout PDF says | The file has | Effect |
|---|---|---|---|
| 1 | column `H-1B_DEPENDENT` | column `H_1B_DEPENDENT` | none: the ingest doesn't read it |
| 2 | status `"Certified-Withdrawn"` | status `Certified - Withdrawn` | statuses are compared with whitespace around the hyphen ignored; every observed status string and its count is listed in the ingest audit, and anything unrecognized halts the run |

### Manual cross-check in Apple Numbers, by Aravind Ravi (2026-10-21)

Aravind Ravi opened the raw `LCA_Disclosure_Data_FY2026_Q3.xlsx` in Apple Numbers and re-counted Stripe's rows by hand, independently of the code. Counts only; no row data is reproduced here.

| Filter or group | Rows (Numbers) | EMPLOYER_FEIN | PM-family rows | Code's figure |
|---|---|---|---|---|
| EMPLOYER_NAME contains "Stripe" and VISA_CLASS **is** "H-1B" | 250 | — | — | — |
| ↳ Stripe, LLC | 203 | 27-0465600 | 18 | 203, 18 |
| ↳ Stripe, Inc. | 42 | 27-0465600 | 1 | 42, 1 |
| ↳ Stripe Payments Company | 2 | 80-0948598 | 0 | not joined |
| ↳ Stripe MALPB (Atlanta) | 3 | 39-4871956 | 0 | not joined |
| Same name filter with VISA_CLASS **contains** "H-1B" | 257 | — | — | the 7 extra rows are H-1B1, which the code excludes |

The two same-FEIN names total 245 rows, exactly the code's 245, and the independent PM-family count of 19 (18 + 1) matches the code.

**Conclusion (Aravind Ravi):** the normalized-name join and the FEIN rule correctly include the two same-FEIN names and exclude the two different-FEIN names; the exclusions have no PM rows, so they don't affect the Stripe tier.

*Mechanism note (agent):* the two different-FEIN names are excluded by the normalized-name join itself, before the FEIN rule applies. "Stripe Payments Company" normalizes to `STRIPE PAYMENTS` and "Stripe MALPB" to `STRIPE MALPB`, not `STRIPE`. The FEIN rule only compares legal-suffix variants that share one normalized name; here those are "Stripe, Inc." and "Stripe, LLC", which share FEIN 27-0465600.

*Further verification entries: pending.*

## Reflection

*Pending.*

## Attestation

*Pending: written last, after the final code and run, and signed after the student re-runs the commands.*

### Broke during testing, fixed (collected so far)

- **The first ingest halted on 595,239 "unrecognized" statuses.** These were empty spreadsheet rows: the sheet declares 1,032,736 rows but its data ends at row 437,497. Fix: fully empty rows are skipped and reported separately ("empty spreadsheet rows: 595,239"). The unrecognized-status check stays strict, and a test proves that a data row with a blank status still halts (exit 5).
