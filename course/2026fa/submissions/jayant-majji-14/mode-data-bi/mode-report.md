# Data / BI Analyst triage — report for 20 October 2026

## Executive summary
**What this is:** the results of checking six real job postings for a student on a work-visa clock.
**Why read it:** it tells you which postings are worth your time today and which need you to look something up first.
**What it found:** apply to one, consider one, skip one, and three need a human look, because the data had no usable record for the employer or the job type.

*Assembled by hand from real command outputs; no runner script exists yet.*

## Apply / consider
| Posting | Decision | Sponsorship (record) | Role quality (record) | Before you act |
|---|---|---|---|---|
| Gusto — Data Scientist, Risk | **Apply** (0.615) | 218 approvals; sponsored a BI Engineer | **missing**: Data Scientists have no O\*NET scores | read the job description; the score says nothing about AI exposure |
| Snowflake — BI Analyst | **Consider** (0.510) | 1,816 approvals, but **no data-type title** sponsored | pivot 3.903 (BI Analysts) | sponsorship for data roles is unproven here |

## Skip
| Posting | Why | Caution |
|---|---|---|
| Pinterest — Sr. Data Scientist | the liveness script said expired | **the posting is actually live** (checked by hand). It stays Skip because it's a Senior role and I rated fit 0, not because it closed. |

## Held for you
| Posting | Why held | What to do |
|---|---|---|
| Fetch — BI Analyst | company not found under that name | look up Fetch's legal name and re-check |
| Amazon — Business Analyst I | not a data/BI occupation, and Amazon isn't in the data | decide if it's in scope; "not found" ≠ "doesn't sponsor" |
| McKinsey — Business Analyst | same, and the liveness check failed | same |

## What this run did not verify
- Which occupation code an employer actually files a role under.
- Sponsorship for data roles specifically (the data lists top titles, not counts per occupation).
- Anything about companies outside the startup filing list.
- Whether any "expired" result is really closed.
- What the role-quality score implies about AI. The repo defines it only as an average of reasoning, judgment, and systems levels.