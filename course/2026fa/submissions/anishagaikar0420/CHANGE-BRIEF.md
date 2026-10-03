# CHANGE-BRIEF — msis-bi-analyst-opt-countdown

## Executive summary

This is the plan written before any code: who the tool is for, which existing data it reuses, where it must stop and hand the decision to a person, what could go wrong, and what we expected to get wrong. The bottom section records what actually happened afterwards, without rewriting the original guesses.

> Written **before** the prototype was built (2026-09-30). Drafted by Claude (AI assistant) from
> the student's own answers — her degree, May-2027 graduation, target roles, and choice of the
> OPT-countdown idea. Predictions below are kept as originally written. Later corrections go in
> the "Revisions" section at the bottom — never by editing the original lines.

## 1. The situation this is designed for

International master's student in **MS Information Systems / Business Analytics**, on an
F-1 visa, **graduating May 2027**, not yet on OPT. Targeting **business-intelligence and
data-analyst roles** — SOC **15-2051.01 Business Intelligence Analysts** (primary),
with 15-1211 Computer Systems Analysts and 13-1111 Management Analysts as adjacent SOCs.

The specific problem: in the fall before graduation, most *live* analyst postings are for
people who can start **now**. A May-2027 graduate cannot legally start full-time work
until her OPT start date, and once OPT starts she has **90 days of allowed unemployment**.
So a posting is only worth tailoring if its start date lands **inside a window that
opens at OPT start and closes 90 days later** — and the company has actually sponsored
H-1Bs, ideally for analyst titles. From the outside she cannot see either fact quickly.

Engine layers used:
- **80 Days to Stay** — sponsorship history (`Total Approvals`, `top_job_titles_sponsored`) and funding context.
- **Job-Ops** — liveness gate (output of `npm run ats:liveness`).
- **The Cognitive Pivot** — BLS/O*NET row for the target SOC (context only; see Fact 1).
- **Visa timeline** — the new part: an OPT-window gate computed from her dates.

## 2. What I reuse (exact paths) and what I propose

Reused, unchanged:
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — sponsorship + funding.
- `data/bls/compact/soc_occupation_compact.csv` — wage median, cognitive_pivot_score by SOC.
- `data/sec/form-d/processed/sample/*.sample.json` — Form D samples (only 50 companies each; Fact 3).
- `scripts/score/role-scorer.mjs` — run as a CLI (`node scripts/score/role-scorer.mjs … --out-dir …`); **not copied**.
- `npm run ats:liveness -- <url>` — its stdout is saved to a file and parsed.

Proposed (new, in my namespace only):
- `scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs` — computes the
  OPT-window timeline factor, looks up sponsorship tiers, writes a scorer-shaped `roles.json`,
  runs the real scorer, writes a JSON log + Markdown report.
- Reason it belongs: the scorer takes `timeline.factor` as an input but **nothing in the repo
  computes it**. Every example hand-types `0.85`. This prototype computes it from dates.

## 3. Gates and what a human must see to clear each

| Gate | Hard stop when | Human must see |
|---|---|---|
| G0 OPT window open | run date is after the 90-day unemployment deadline, or OPT start is > 60 days after program end | the three dates (program end, OPT start, deadline) and where each came from (I-20 / I-765) |
| G1 company on record | company name has no exact (normalized) match in the 80-Days CSV, or matches more than one row | the normalized name tried; then a manual DOL LCA lookup |
| G2 liveness | no liveness result, result is `expired`/`uncertain`, or the check is > 7 days old | the `ats:liveness` line for that URL and its date |
| G3 timeline | posting start date is before OPT start, or earliest possible start is after the deadline | posting start date + her hiring-lag assumption |

## 4. Predicted failure cases (and how I'll check)

1. **Company missing from the CSV** (e.g. a small startup, or a name like "Klaviyo" vs "KLAVIYO INC").
   Check: include one fictional company and one real name spelled differently; expect a
   `blocked: company-not-found` row, never a sponsorship value of 0.
2. **SOC code with no BLS row** (e.g. a typo `15-2059`). Expect wage context = `missing`,
   role still scored (role quality has weight 0 in the scorer anyway).
3. **OPT date already past** — set run date after the deadline; expect a non-zero exit
   and no output files.
4. **Posting that 404s / expired** — feed an `❌ expired` liveness line; expect scorer Skip (gated).
5. **Start date before OPT start** — a "start ASAP" posting; expect timeline factor 0 → Skip,
   with a "network for next cycle" next action instead.

## 5. What I predict the first pass will get wrong

- Company-name matching will be **too strict**: real employer names in postings ("Gusto")
  won't exactly equal SEC legal names ("GUSTO INC"), so more roles than expected will be
  blocked at G1. I expect to need suffix stripping, and I expect it still to miss
  d/b/a names.
- I expect `Total Approvals` to be **company-wide, not per-role**, so "Proven for analyst
  roles" can only be approximated from the 5-title sample in `top_job_titles_sponsored`.

## Revisions (added after building — originals above unchanged)

**2026-09-30, after the first sample run (Claude, in the student's session):**

- Prediction "name matching will be too strict" — **mostly wrong.** With suffix stripping, all nine real companies in the sample matched on the first try, including "Sigma Computing, Inc." → `SIGMA COMPUTING INC` and "Gusto" → `GUSTO INC`. Only the deliberately fictional company was blocked. The prediction may still hold for brand-vs-legal names (e.g. "Meta" vs. "Meta Platforms, Inc."), which the sample did not include.
- Prediction "`Total Approvals` is company-wide" — **correct.** Confirmed in the CSV header and the audit; the recipe states it as a limit.
- **Not predicted — keyword over-match.** The analyst-title keyword list matched engineer and data-scientist titles ("Business Intelligence Engineer", "Senior Analytics Engineer", "Data Scientist, Product Analytics"). Figma, Gusto and Sigma reached *Proven* partly on non-analyst titles. Logged as a proposed addition, not silently fixed.
- **Not predicted — even counts.** Every approval and denial count among the 1,557 CSV rows with approvals is even. Possible double count upstream; cause not confirmed.
- **Not predicted — a bug in my own summary.** The even-count line first said "8 of 9" because the denominator included a company with no approvals at all. Fixed to count only companies that have approval numbers ("8 of 8").
- Failure cases 1–5 were all exercised; see TEST-REPORT.md.

**2026-10-02, v0.1.1 (Claude, at Anisha's request):** Anisha's hand check of Figma's CSV row showed its five sampled titles contain no analyst job. The title rule now also needs "analyst" or "BI" in the title. Figma and Sigma moved from Apply to Consider; Gusto stayed Apply. Proposed addition 1 is closed, 3 remain.

**Student's revisions after running it herself:**

- 2026-10-01/02, my Mac: the run matched the sandbox exactly. One thing nobody predicted: `npm run verify` failed because my Python had no PyYAML, and pip could not install it on macOS 26.2.
- My Figma hand check confirmed the over-match noted above, which led to v0.1.1.
