# omraut888 — Mode Build submission: cognitive-pivot-sponsor-fit

## Executive summary

This folder is the submission for a new check in the job-search engine. The check
asks whether the companies that sponsor visas for AI-research-style jobs offer
work that stays valuable as AI improves. Start with the domain justification,
then the worked run. The check ran on real data and refused the case it could
not score. A second run compared research roles with software-developer roles.
It reordered the list but changed no recommendations, and the worked run
explains why.

| Deliverable | File |
|---|---|
| Mode file (agent) + card (human) | `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md`, `.card.md` |
| Domain justification (one page) | [DOMAIN-JUSTIFICATION.md](DOMAIN-JUSTIFICATION.md) |
| Worked run + attestation + reflection | [WORKED-RUN.md](WORKED-RUN.md) |
| Human reports | [pooled two-SOC, 2026-10-21](cognitive-pivot-sponsor-fit-pooled-2026-10-21.md) (current) · [single-SOC, 2026-10-20](cognitive-pivot-sponsor-fit-2026-10-20.md) (attempt 1, kept) |
| Run log entries + agent logs | `logs/runs/2026fa-omraut888-2.{md,json}` (attempt 1), `logs/runs/2026fa-omraut888-3.{md,json}` (attempt 2) |
| Code + tests | `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/` |
| Maintained-file patch (declared) | `scripts/score/role-scorer.mjs`: additive `--role-quality-weight` |
| Raw run artifacts + verbatim transcripts | [run/](run/) |

Lifecycle reached: **RUNNABLE-SAMPLE**. Om Raut signed the sample-run adequacy on 2026-10-21 (see the attestation in [WORKED-RUN.md](WORKED-RUN.md)). Not RUNNABLE-LIVE: no liveness check has been run.
