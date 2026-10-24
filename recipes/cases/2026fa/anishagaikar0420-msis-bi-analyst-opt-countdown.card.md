# OPT-window countdown — human card

**Audience:** an international MS Information Systems / Business Analytics student graduating May 2027, deciding which BI-analyst postings deserve her two application hours.
**Agent twin:** `recipes/cases/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown.md`
**Status:** DRAFT, v0.1.1 — runs end to end on sample data; three proposed additions still open.

## Purpose

Answer, for each posting: *can this job start inside my OPT window (after OPT begins, before my 90 unemployment days run out), and does this company have an H-1B record?* If a fact is missing, the tool says which one and what to check — it does not guess.

## What it can verify

- The company has exactly one row in the 80-Days CSV, and that row's approvals, denials, sampled titles, and funding.
- The posting was `active` / `expired` on a stated date — only when you pass saved `ats:liveness` output.
- The window arithmetic and the timeline factor, from the dates you gave it.
- The decision came from the repo's own scorer, with the arithmetic shown.

## What it cannot verify

- That the company sponsors **analysts** — approval counts are company-wide; titles are a 5-title sample.
- That the counts are right — every approval/denial count in the dataset is even; a double count is possible and unconfirmed.
- That "no approvals on record" means "never sponsors".
- The OPT rules themselves (60-day start limit, 90-day allowance) — your inputs; confirm with your DSO.
- Start dates and hiring lags — yours or the posting's; recruiters change them.
- Liveness, in sample mode.

## Dependencies

Node 20+. No npm packages. Reads `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/bls/compact/soc_occupation_compact.csv`, `data/sec/form-d/processed/sample/*.sample.json`, and calls `scripts/score/role-scorer.mjs`. Real liveness needs `npm install` (Playwright) and a network connection.

## Annotated commands

Sample run (expected in v0.1.1: 10 roles → Apply 1 · Consider 3 · Skip 4 · blocked 2; v0.1.0 gave Apply 3 · Consider 1):

```bash
node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
```

Closed window (expected: exit 3, nothing written):

```bash
node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs --as-of 2027-09-15
```

Offline tests (expected: 12 pass, 0 fail):

```bash
node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
```

Live liveness, on your own machine:

```bash
npm run ats:liveness -- <url1> <url2> > private/liveness-2026-10-05.txt
node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs \
  --liveness-log private/liveness-2026-10-05.txt --liveness-date 2026-10-05 --as-of 2026-10-05
```

## What it produces

- `opt-countdown-report.md` — for you: decision, next action, every value labeled record / your-input.
- `opt-countdown-log.json` — for an agent: same content plus input-file hashes.
- `roles.json` + the scorer's `role-scores.json/.md`.

## Named failure modes

1. **Keyword over-match** — in v0.1.0, "analytics" in an engineer title made a company look like an analyst sponsor (Figma, Sigma). v0.1.1 requires "analyst" or "BI" in the title, but it is still five sampled titles, not a per-role record. Check the matched-titles row before trusting a tier.
2. **Name mismatch** — a posting's brand name ("Meta") differs from the legal name in the CSV ("Meta Platforms, Inc."). The tool matches exactly after stripping suffixes, so it blocks rather than guessing; a student in a hurry may read "blocked" as "doesn't sponsor". It isn't.
3. **Start-date drift** — a posting that said "June 2027" moves to "ASAP" after an interview. The timeline factor is only as current as the date you typed.
4. **Copy-forward liveness** — reusing last week's liveness file. The 7-day staleness gate blocks it; don't edit the date to get past it.
