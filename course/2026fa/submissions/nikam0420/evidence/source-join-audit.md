## Executive summary

This audit checks which company records contain sponsorship fields. It prepares a reproducible sample; it does not establish whether employer identities were joined correctly. Source employer records are still needed.

# H-1B Join Validation Audit

**Purpose:** Prepare Step 4 validation for the existing `SEC_DOL_H1b_data_mapped.csv` entity-resolution join.
**Source file:** `company-evidence.csv`
**Deterministic sample seed:** `80`
**H-1B sample size:** `20`

## Local Finding

The repository does not contain raw DOL/LCA records, USCIS source records, original H-1B employer names, match scores, or match-method metadata. Because of that, this audit cannot estimate the true false-positive rate locally. It can only prepare the review sample and flag what must be checked manually or against external/source data.

## H-1B-Mapped Row Shape

| Metric | Value |
|---|---|
| Total companies in mapped CSV | 30,369 |
| Rows with H-1B fields populated | 1,557 (5.1%) |
| Rows with H-1B fields null | 28,812 (94.9%) |
| H-1B rows with website | 0 (0.0%) |
| Sample rows with website | 0 (0.0%) |
| Median approvals among H-1B rows | 10.0 |
| Median approval rate among H-1B rows | 100.0% |

## Top H-1B-Mapped States

| State | Rows |
|---|---|
| CA | 860 |
| NY | 257 |
| MA | 227 |
| WA | 87 |
| TX | 77 |
| IL | 49 |

## Top H-1B-Mapped Industries

| Industry | Rows |
|---|---|
| (blank) | 1,557 |

## Deterministic Sample

The full validation sample contains 20 rows selected from the 1,557 H-1B-mapped rows using seed `80`. Sample positions within the H-1B subset are:

51, 112, 348, 451, 495, 557, 748, 756, 768, 786, 798, 807, 822, 862, 1085, 1092, 1110, 1127, 1266, 1451

## Manual Review Subset

Review at least the first 20-30 rows below. For each row, compare the company website, public company identity, and sponsored job titles against the original LCA/DOL employer identity if available. Fill `Verdict` with `same`, `different`, or `uncertain`.

| # | Company | Website | City | State | Approvals | Approval rate | Sponsored title signals | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|---|

## Validation Rule

- If the manually reviewed false-positive rate is above 10%, rerun entity resolution with stronger evidence.
- If false positives are below 5%, keep the existing join and move on.
- Between 5% and 10%, preserve the existing join but add a confidence tier and avoid using low-confidence rows for `Proven` sponsorship scoring.

## Required Evidence Not Present Locally

- Raw LCA employer names.
- FEIN/EIN values for the SEC side.
- Match method, match score, and candidate alternatives used during the original join.
- SOC codes or raw job classification fields.

## Recommended Next Step

Before Step 5, locate or recreate the raw DOL/LCA source table used for the merge. Without raw employer names or match metadata, manual validation can only check plausibility, not the actual correctness of the join.
