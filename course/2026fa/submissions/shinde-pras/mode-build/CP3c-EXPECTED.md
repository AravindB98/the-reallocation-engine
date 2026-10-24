# CP3c expected scorer results

## Executive summary

These are hand-derived expectations, written after the first pass of the gate script and before the second pass, so before the scorer ran on any live row. They come from the first pass's own output and the scorer's fixed constants, so they are arithmetic checks, not independent guesses. If the second pass disagrees with them, that disagreement is a finding to explain.

## Formula

[read role-scorer.mjs:76-78, :89-90, :98-102]

composite = (0.35 x sponsorship p + 0.30 x fit p + 0 x role_quality p) x liveness x timeline

Apply needs a composite of at least 0.30; a Likely or Unknown sponsorship tier downgrades Apply to Consider.

## Inputs from pass 1 (references only)

| Posting | Sponsorship tier | p | Liveness | Timeline | Fit |
|---|---|---|---|---|---|
| posting 2 | Unknown | 0.15 | 1.0 | 0.8 | 0.7 |
| posting 3 | Likely | 0.50 | 1.0 | 0.8 | 0.7 |
| posting 1 | CANDIDATE row with no approval figures | none | (pass 1: unresolved) | 0.8 | 0.7 |

Human inputs for pass 2 (your-input, browser check at run time): posting 1 open, with an Apply button visible; posting 1 candidate row confirmed as the same employer.

## Expected

- posting 2: (0.15 x 0.35 + 0.7 x 0.30) x 0.8 = 0.21, so Consider.
- posting 3: (0.50 x 0.35 + 0.7 x 0.30) x 0.8 = 0.308, above the Apply line but downgraded for the Likely tier, so Consider.
- posting 1: HOLD whatever the human inputs say, because its row has no approval figures. With liveness answered open and the row confirmed, the only reason code expected is rule_hold_no_h1b_data (not liveness_unresolved, not sponsor_candidate_unconfirmed). It never reaches the scorer.
- P5 (0 of 3 Apply) is expected to hold.

Any composite that differs from these by more than 0.001, or any Apply, is a finding, not a pass.
