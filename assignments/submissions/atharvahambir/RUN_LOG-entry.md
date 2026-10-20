
### 2026-10-20 — case-data-analyst-opt-h1b-15-2051 · live run on 8 real boards (RUNNABLE-LIVE)
Recipe `recipes/case-data-analyst-opt-h1b-15-2051.md` v0.2.0 (prototype
`scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py`). Inputs: private candidate
(visa dates redacted) + private target list — Robinhood, Anthropic, Datadog, Discord, Waymo (Greenhouse),
Ramp, Perplexity, Notion (Ashby). G0 stopped twice on real input gaps (future as-of date, missing fit
values) before passing. Result: 8/8 boards · 2,108 postings · 7 match · `npm run ats:liveness` 7 active ·
all 7 held (E-Verify unchecked; Anthropic/Waymo no CSV row, Ramp/Perplexity no H-1B fields) · scorer ran on
Discord + Notion (0.555, Apply once E-Verify is recorded). Independent re-fetch matched every count.
Human gate G7 cleared by Atharva Hambir (Anthropic Safeguards noted as borderline). Open: `--dry-run`
overwrites the day's report (TODO 8); a wrong `csv_name` (Anthropic → investment fund) is accepted
silently. Detail: `logs/runs/2026fa-atharvahambir-3.md`; evidence
`assignments/submissions/atharvahambir/runs/worked-run-2026-10-20/`.
