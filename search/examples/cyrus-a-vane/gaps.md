# search/gaps.md — Delta: Attested Record vs. Target Role Requirements
# FICTIONAL EXAMPLE (Cyrus A Vane persona) — safe to commit.
## How to read this table
- **Evidence column**: cites a posting, an O*NET requirement, or a pattern across 3 or more postings. The postings cited were read on 2026-10-27 and are real; the persona is not.
- **Plan column**: an *output* someone else can verify, not an activity.
- One row was killed and one rewritten, as the setup exercise requires; both edits are shown so the shape of the exercise is visible.
---
| Gap | Evidence the target demands it | What I have | Plan to close it |
|-----|-------------------------------|-------------|-----------------|
| A published, reproducible evaluation of my own system | Three AI-startup postings ask for it in different words: "evaluation workflows" (Goodfire FDE, jobs.menlovc.com), "a durable evaluation strategy" (Moda, jobs.generalcatalyst.com), "tests, evals, and metrics" (Applied Labs, employbl.com) | ledgerlint's README reports the better of two small runs; the suites are 12 and 20 samples | Re-run both suites from recorded outputs, correct the README, then a 100-sample labelled set with paired resampling under `results/`. **Closed when** a stranger clones the tagged commit and `make replay` reproduces the primary outcome |
| Production use of a modern ML framework | Goodfire requires "production experience in Python and modern ML frameworks such as PyTorch or JAX" | PyTorch only inside a course notebook (listed under familiar_with_not_shipped) | Serve one open-weight model behind ledgerlint's API with vLLM; commit the serving config and a load test. **Closed when** the serving script runs from a clean clone; label stays "served for a study", not "production" |
| Cloud and container orchestration beyond one Docker image | O*NET employer-based hot technologies for 15-1252 (Lightcast 2025 postings): AWS 26%, Kubernetes 14%, Docker 13% | A Docker image; AWS MLE Associate in progress, no exam date | Deploy the ledgerlint API to a managed cluster with a committed runbook and a dated deployment log; sit the AWS exam. **Closed when** a second person executes the runbook and the service answers, and the credential has a verification number |
| Customer-facing technical delivery | Goodfire: "day-to-day technical contact embedded with partner engineering teams" | Requirements work with a product team at Larkspur; TA office hours | Deliver one published write-up of an external pilot or hackathon challenge with my name on it. **Closed when** it is published by the organiser, not by me |

## Killed row
> ~~No completed advanced degree | Moda lists "an advanced degree" as a bonus | M.S. in progress | Graduate~~

Why: a plan that is happening anyway is not a plan, and the row was generated from the status field of one education record rather than the whole file. (In the real user's case the agent also missed a completed earlier master's two records lower in the same file.)

## Rewritten row (in the persona's words)
The first row above was drafted by the agent as "Evaluation frameworks: postings ask for eval experience; I have a 20-sample suite; plan: expand the suite." Rewritten: every startup I would want to work for asks, in different words, whether I can tell if an AI system is any good and prove it. What I have is a README that reports my best run. The gap closes when the numbers in the README are the numbers in `results/`, and a stranger can regenerate them.

## Closed gaps (move entries here when resume.example.json is updated with closing evidence)
