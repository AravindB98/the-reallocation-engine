# RUN_LOG entries — case-data-analyst-opt-h1b-15-2051

## Executive summary

These are the short run-log entries for my two live days of the mode. They're kept here, in my own submission folder, instead of the repository's shared `logs/RUN_LOG.md`, which the assignment allows. Each entry points to its detailed log in `logs/runs/`.

## Entries

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

### 2026-10-21 — case-data-analyst-opt-h1b-15-2051 · second live day: a real closure caught, 4 Apply
Same command, next morning, same 8 real boards: 2,116 postings · 6 match · 1 closed overnight (Waymo
Product Data Scientist, 8286842). The closure was confirmed absent from Waymo's API and expired by
`npm run ats:liveness` (6 active, 1 expired). The student then recorded E-Verify enrolled ×8 and Anthropic
sponsorship = Proven, both as your-input ("stated by me; not verified by the tool"). Re-run: Apply 4
(Anthropic ×2, Discord, Notion; scorer composites 0.615 / 0.555, checked by hand) · held 2 (Ramp, Waymo:
no sponsorship record). Open: the two input statements are unverified; TODO 8 still open. Detail:
`logs/runs/2026fa-atharvahambir-4.md`; evidence `assignments/submissions/atharvahambir/runs/worked-run-2026-10-21/`.
