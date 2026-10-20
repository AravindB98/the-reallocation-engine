# Sensitivity check: how much rests on my own numbers?

## Executive summary

The baseline run scored 5 posting(s). I moved each of my 8 hand-chosen assumptions, one at a time, and re-scored with the repo's scorer. **0** of them changed at least one recommendation: none. Within the tested ranges, no recommendation depends on any of these numbers; the gates and records decided them.

## Run record

- Date: 2026-10-20 · baseline: p1=Apply, p2=Apply, p3=Apply, p4=Skip, p8=Apply

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
