# Apply-queue refresh — 2026-10-21 (live)

## Executive summary

This is the weekly re-check of a shortlist of **3 job postings** for Priya Nair, on F-1 OPT (post-completion, year 1), targeting AI Engineer / ML Engineer roles. It answers one question: which postings on the list are still worth applying to this week, given that postings close quietly, descriptions get edited, and the OPT clock keeps running.

- **Still live and scored:** 1. The engine scorer says Apply 0 · Consider 0 · Skip 2 (Skip includes closed postings).
- **Closed since the shortlist was made:** 1. The engine's own liveness gate scores them 0.
- **Investigate by hand:** 1. The two liveness checks disagree or could not tell, so these are not scored, on purpose.
- **The OPT clock:** timeline factor **0.7** — 14 unemployment days left at the expected start 2026-12-02; buffer target 20 -> factor 0.7. With other start times: 35 days → 1.0 · 42 days → 0.7 · 70 days → 0.0.
- **Changed since the last refresh:** no baseline was given, so this run sets one.

Nothing here is a decision. You clear the three gates at the end before acting on any row.

## This week's queue

| # | Company | Posting | Liveness | Timeline | Fit | Sponsorship | Score | Recommendation |
|---:|---|---|---|---:|---:|---|---:|---|
| 1 | VERKADA INC | [Software Engineer - Data Platform (control: live on 2026-10-19)](https://job-boards.greenhouse.io/verkada/jobs/4129304007) | live `record` | 0.7 `your-input` | 0.154 `record` | Possible (p 0.4) `your-input` | 0.130 | **Skip** |
| 2 | VERKADA INC | [made-up job id 1000000001](https://job-boards.greenhouse.io/verkada/jobs/1000000001) | closed `record` | 0.7 `your-input` | — `record` | Possible (p 0.4) `your-input` | 0 | **Skip** |
| 3 | FIGMA INC | [made-up job id 1000000001 (the reference run's case)](https://boards.greenhouse.io/figma/jobs/1000000001) | investigate `record` | — `your-input` | — `record` | Possible (p 0.4) `your-input` | — | not scored — investigate |

## Investigate by hand (not scored)

- **FIGMA INC — made-up job id 1000000001 (the reference run's case)**: liveness not established (page check: uncertain; board API: gone) — uncertain, so not scored. Open https://boards.greenhouse.io/figma/jobs/1000000001 and check the board.

## Closed since the shortlist

- **VERKADA INC — made-up job id 1000000001**: page check: expired; board API: posting gone (404).

## Changed since the last refresh

- no baseline given (pass `--baseline <last refresh-log.json>` or `--baseline-liveness <output>`).

## What the descriptions say (deciding sentences — record; the decision is yours)

**VERKADA INC — Software Engineer - Data Platform (control: live on 2026-10-19)**
- «1-3 years of software engineering experience.»
- «We do sponsor and take over sponsorship of employment visas for this role. If we make you an offer, we will make every reasonable effort to get you a visa.»

## The OPT clock (Chapter 10)

- Today 2026-10-21; expected start 2026-12-02 (42 days, your-input); authorization end 2027-01-31.
- Unemployment days used 34 → 76 at the expected start; ceiling 90; buffer target 20.
- Factor **0.7** — formula buffer-linear (rules.json): 14 unemployment days left at the expected start 2026-12-02; buffer target 20 -> factor 0.7.
- Sensitivity to the time-to-start (your-input): 35 days → 1.0 · 42 days → 0.7 · 70 days → 0.0.
- Note: unemployment_days_used (34) is read as of 2026-10-21 (profile.yml gives no date for it) — your-input assumption
- What-if, 150-day ceiling: factor 1.0 — only if a STEM OPT extension is approved — the extension also moves the end date; confirm both with your DSO. Shown, never used as the gate.

## Role-quality context (BLS, record; not scored)

The BLS figures are records; the SOC code each posting is matched to was chosen by the queue's builder, and the "SOC chosen by" column says how — a family hint is a your-input guess, not a record.

| Posting | SOC | SOC chosen by | Occupation | Job zone | Median wage | Cognitive-pivot score |
|---|---|---|---|---:|---:|---|
| Software Engineer - Data Platform (control: live on 2026-10-19) | 15-1243.00 | your-input — copied from the sample queue | Database Architects | 4 | $135,980 (2024) | 3.933 (percentile 84) |
| made-up job id 1000000001 (the reference run's case) | 15-1252.00 | your-input — placeholder for a break test | Software Developers | 4 | $133,080 (2024) | 3.834 (percentile 80) |
| made-up job id 1000000001 | 15-1252.00 | your-input — placeholder for a break test | Software Developers | 4 | $133,080 (2024) | 3.834 (percentile 80) |

## Gates (you clear these; record your decision in the run log)

- **G1 liveness:** open every Apply / Consider link and every Investigate link. Live means the description and an Apply button are there.
- **G2 timeline:** confirm the OPT dates, the unemployment-day count and the time-to-start. Eligibility questions go to your DSO.
- **G3 release:** read the deciding sentences above for each row you would act on, then say which rows you release for action this week.

## Labels

`record` = read from a data file, the board, or the page; `your-input` = a value someone chose (rules.json, the queue, the persona); `model-judgment` = never used in this tool.

## Cannot verify

- That a live page means the role is still being filled: a frozen or filled requisition can stay up (a ghost posting).
- That the company will sponsor this role: the sponsorship tier is company history, not a promise.
- Local pay: the BLS local-wage data is not on main, so only national BLS figures are shown.
- Eligibility questions (a STEM OPT extension, a start before the OPT start date): the mode shows the arithmetic and sends the question to a DSO.
- Each company's real time-to-start: one value is used for every posting (your-input).
- The date of the persona's unemployment-day count: it is read as of the run date.
- Edits made before the first refresh: the first run has no description baseline.
- Role quality is shown, not scored: the engine weights it 0 ([VERIFY] in role-scorer.mjs).

## Run record

- Command: `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --queue scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/fixtures/queue.break-made-up-ids.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids`
- Generated 2026-10-21T00:59:16 · rules 0.1.0 (confirmed by Hemanth Rayudu, 2026-10-19) · scheme default-0.1
- Engine scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids/roles.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids` → ✓ scored 2 roles → Apply 0 · Consider 0 · Skip 2 (skip 100%)
- Liveness source: live run at 2026-10-21T00:59:16 (page-checker exit 1; exit 1 means at least one posting was not active)
- Raw outputs kept in `raw/` (4 files, sha256 in refresh-log.json).
