# AI Engineer co-op to H-1B triage: run report

## Executive summary

This report checks 7 candidate AI Engineer roles for a student who wants a Spring co-op that could become a full-time job needing visa sponsorship. 3 roles were stopped before scoring because a needed fact was missing; nothing was guessed in their place. The rest were scored under two start-date plans. **Co-op path (co-op Jan 2027, full-time Sep 2027):** 2 apply, 0 consider, 2 skip; **No co-op path (full-time May 2027):** 1 apply, 0 consider, 3 skip. Only past visa-sponsorship counts come from real records. Whether a co-op turns into a full-time offer is **not checked**, because no data for it exists here. A person makes the final call on every role.

## Run record

- Generated: 2026-10-04T01:37:55.837Z
- Candidates: `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/fixtures/candidates.sample.json` (your-input)
- Sponsorship record: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- Scorer: `scripts/score/role-scorer.mjs` (run as CLI, unmodified; role_quality weight 0.0 in the scorer, fit not supplied)

## Stopped before the scorer

| Role | Company (your-input) | Gate | Reason | Detail |
|---|---|---|---|---|
| cohere-health-aie-ft | COHERE HEALTH INC | G2 gate-values-present | `missing-gate-value: liveness` | no liveness value; the scorer would treat it as open (factor 1), so the role is not sent |
| huggingface-mle | HUGGING FACE INC | G1 company-in-record | `no-sponsorship-record` | row found (line 12615) but "Total Approvals" is blank; not treated as zero |
| lumenvale-aie-coop | Lumenvale Applied AI (fictional) | G1 company-in-record | `no-company-match` | exact name "Lumenvale Applied AI (fictional)" not found in data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv; sponsorship not guessed |

## Evidence per scored role

| Role | Sponsorship record (record) | Tier → p (your-input) | Liveness | SOC (model-judgment) | Co-op conversion |
|---|---|---|---|---|---|
| databricks-aie-coop | 1640 approvals / 8 denials (99.5%), `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:7249` | Proven → 0.9 | 1 [your-input] | 15-1252 | not verified |
| snowflake-aie-ft | 1816 approvals / 28 denials (98.5%), `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:24658` | Proven → 0.9 | 1 [your-input] | 15-1252 | not verified |
| mongodb-aie-ft | 462 approvals / 4 denials (99.1%), `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:17197` | Proven → 0.9 | 1 [your-input] | 15-1252 | not verified |
| klaviyo-ml-coop | 154 approvals / 4 denials (97.5%), `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:14495` | Proven → 0.9 | 0 [your-input] | 15-2051 | not verified |

## Scenario: Co-op path (co-op Jan 2027, full-time Sep 2027)

| Role | Decision | Composite | Next action | Timeline (your-input) | Arithmetic |
|---|---|---|---|---|---|
| DATABRICKS INC: AI Engineer Co-op (hypothetical) | **Apply** | 0.315 | tailor an application | coop available 2027-01; role window 2027-01..2027-01 → fits | `(0.9·0.35) × 1 × 1 = 0.315` |
| SNOWFLAKE INC: AI Engineer, New Grad (hypothetical) | **Apply** | 0.315 | tailor an application | fulltime available 2027-09; role window 2027-06..2027-09 → fits | `(0.9·0.35) × 1 × 1 = 0.315` |
| MONGODB INC: AI Engineer, New Grad (hypothetical) | **Skip** | 0 | skip | fulltime available 2027-09; role window 2027-05..2027-07 → does not fit | `(0.9·0.35) × 1 × 0 = 0.000` |
| KLAVIYO INC: Machine Learning Engineer Co-op (hypothetical, marked closed) | **Skip** | 0 | skip | coop available 2027-01; role window 2027-01..2027-01 → fits | `(0.9·0.35) × 0 × 1 = 0.000` |

## Scenario: No co-op path (full-time May 2027)

| Role | Decision | Composite | Next action | Timeline (your-input) | Arithmetic |
|---|---|---|---|---|---|
| DATABRICKS INC: AI Engineer Co-op (hypothetical) | **Skip** | 0 | skip | scenario "no-coop-path" has no coop start | `(0.9·0.35) × 1 × 0 = 0.000` |
| SNOWFLAKE INC: AI Engineer, New Grad (hypothetical) | **Skip** | 0 | skip | fulltime available 2027-05; role window 2027-06..2027-09 → does not fit | `(0.9·0.35) × 1 × 0 = 0.000` |
| MONGODB INC: AI Engineer, New Grad (hypothetical) | **Apply** | 0.315 | tailor an application | fulltime available 2027-05; role window 2027-05..2027-07 → fits | `(0.9·0.35) × 1 × 1 = 0.315` |
| KLAVIYO INC: Machine Learning Engineer Co-op (hypothetical, marked closed) | **Skip** | 0 | skip | scenario "no-coop-path" has no coop start | `(0.9·0.35) × 0 × 0 = 0.000` |

## What a human must judge

- Liveness values here are not machine-checked (the liveness tool could not run). Confirm each posting is open before acting.
- Tier → p is the author's mapping, not a record. Approval counts are company-wide, not specific to AI Engineer roles.
- Co-op-to-full-time conversion is unknown for every company.
