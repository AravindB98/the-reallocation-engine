# Sensitivity check: how much rests on my own numbers?

## Executive summary

This check ran on the 9-posting v0.1 demo fixture (constructed, your-input), not on the 17 real postings. The real run scored nothing, so nothing could flip there; see ../sensitivity-real/.

The baseline scored 5 posting(s). None of the 30 variants changed any recommendation. **That is a property of the ranges I tested, not evidence of robustness:** the break-even table below shows how far each decision is from flipping, and no tested range reached a break-even point.

## Run record

- Date: 2026-10-20 · baseline: p1=Apply, p2=Apply, p3=Apply, p4=Skip, p8=Apply

## Break-even: how far each scored decision is from flipping

Computed from the scorer's own weights and thresholds (its JSON output), holding every other term fixed.

| Posting | Decision (composite) | Term | Value now | Flips if | Possible in [0,1]? | Lowest value tested |
|---|---|---|---|---|---|---|
| p1 | Apply (0.525) | sponsorship | 0.9 | below 0.257 | yes | 0.7 |
| p1 | Apply (0.525) | fit | 0.7 | below -0.050 | no | 0.5 |
| p2 | Apply (0.555) | sponsorship | 0.9 | below 0.171 | yes | 0.7 |
| p2 | Apply (0.555) | fit | 0.8 | below -0.050 | no | 0.6 |
| p3 | Apply (0.465) | sponsorship | 0.9 | below 0.429 | yes | 0.7 |
| p3 | Apply (0.465) | fit | 0.5 | below -0.050 | no | 0.3 |
| p4 | Skip (0.000) | — | — | gated (multiplier 0): no vote can change it | — | — |
| p8 | Apply (0.495) | sponsorship | 0.9 | below 0.343 | yes | 0.7 |
| p8 | Apply (0.495) | fit | 0.6 | below -0.050 | no | 0.4 |

## Variants

| Assumption (your-input) | Setting | Decisions changed | Which |
|---|---|---|---|
| hiring_lag_days_assumed | 30 days | 0 | — |
| hiring_lag_days_assumed | 60 days | 0 | — |
| hiring_lag_days_assumed | 90 days | 0 | — |
| hiring_lag_days_assumed | 120 days | 0 | — |
| hiring_lag_days_assumed | 200 days | 0 | — |
| self_rated_fit.data_analyst | 0.8 -> 0.6 | 0 | — |
| self_rated_fit.data_analyst | 0.8 -> 0.7 | 0 | — |
| self_rated_fit.data_analyst | 0.8 -> 0.9 | 0 | — |
| self_rated_fit.data_analyst | 0.8 -> 1.0 | 0 | — |
| self_rated_fit.business_analyst | 0.7 -> 0.5 | 0 | — |
| self_rated_fit.business_analyst | 0.7 -> 0.6 | 0 | — |
| self_rated_fit.business_analyst | 0.7 -> 0.8 | 0 | — |
| self_rated_fit.business_analyst | 0.7 -> 0.9 | 0 | — |
| self_rated_fit.product_analyst | 0.5 -> 0.3 | 0 | — |
| self_rated_fit.product_analyst | 0.5 -> 0.4 | 0 | — |
| self_rated_fit.product_analyst | 0.5 -> 0.6 | 0 | — |
| self_rated_fit.product_analyst | 0.5 -> 0.7 | 0 | — |
| self_rated_fit.it_consultant | 0.6 -> 0.4 | 0 | — |
| self_rated_fit.it_consultant | 0.6 -> 0.5 | 0 | — |
| self_rated_fit.it_consultant | 0.6 -> 0.7 | 0 | — |
| self_rated_fit.it_consultant | 0.6 -> 0.8 | 0 | — |
| sponsorship_tiers.proven.p | 0.9 -> 0.7 | 0 | — |
| sponsorship_tiers.proven.p | 0.9 -> 0.8 | 0 | — |
| sponsorship_tiers.proven.p | 0.9 -> 1.0 | 0 | — |
| sponsorship_tiers.likely.p | 0.6 -> 0.4 | 0 | — |
| sponsorship_tiers.likely.p | 0.6 -> 0.5 | 0 | — |
| sponsorship_tiers.likely.p | 0.6 -> 0.7 | 0 | — |
| sponsorship_tiers.possible.p | 0.3 -> 0.1 | 0 | — |
| sponsorship_tiers.possible.p | 0.3 -> 0.2 | 0 | — |
| sponsorship_tiers.possible.p | 0.3 -> 0.4 | 0 | — |

*Robust means robust to these settings only. Held-out postings never reach the scorer, so they cannot flip here.*
