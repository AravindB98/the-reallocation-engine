# CHANGE-BRIEF — ds-stemopt-15-2051

**Student:** Gnanasudharsan (GitHub `Gnanasudharsan`) · **Term:** 2026fa · **Written:** 2026-10-01, before any prototype code
**Branch:** `contrib/2026fa-gnanasudharsan-ds-stemopt-15-2051`

> Predict-phase record. Original predictions below are kept as written; later
> changes go in **Revisions** at the bottom, dated, without rewriting the originals.

## 1. Career situation

An international **MS in Data Analytics Engineering** graduate on **F-1 STEM OPT**
with roughly **2.5 years of work authorization left** (OPT end in mid-2029), targeting
**Data Scientist / Data Analyst roles — SOC 15-2051** — at two kinds of employer:
**venture-funded startups** and **big tech**.

Why this is not the generic case: with ~2.5 years left, the 90-day unemployment
clock is not the binding constraint. The binding constraint is **how many H-1B
cap-lottery seasons remain** before OPT ends, and whether the employer will (a)
register the student in those seasons and (b) still exist and be sponsoring when
the petition is filed. Each missed March registration window costs one of
roughly three lottery attempts.

The demo persona is fictional (`fixtures/persona.json`, `@example.com`, OPT end
2029-06-15). No real immigration dates are committed.

**Engine layers used:** 80 Days to Stay (sponsorship + funding), Job-Ops (liveness),
Cognitive Pivot (BLS/O*NET row for 15-2051 — context only, see §2).

## 2. Reuse vs. new

### Reused (exact paths)

| What | Path | How |
|---|---|---|
| Sponsorship + funding per company | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | exact normalized-name lookup; `Total Approvals`, `Total Denials`, `top_job_titles_sponsored`, `latest_funding_date` |
| Form D recency confirmation | `data/sec/form-d/processed/sample/companies-sec-*.sample.json` | exact `company_name_normalized` lookup; **samples only (first 50 of ~16k per quarter)** |
| Role quality context | `data/bls/compact/soc_occupation_compact.csv` | rows where `bls_soc_code == 15-2051` |
| Liveness | `npm run ats:liveness -- <urls>` (`scripts/ats/check-liveness.mjs`) | human runs it and saves stdout; prototype parses the saved file |
| Combiner | `npm run score -- <roles.json> --profile <p.json> --out-dir <dir>` (`scripts/score/role-scorer.mjs`) | prototype writes a `ch11-roles.json`-shaped file and calls the real scorer; **no copy of the scorer** |

### New (in my namespace only)

- `scripts/contrib/2026fa/gnanasudharsan-ds-stemopt-15-2051/` — a Node script that
  builds `roles.json` from the CSV + liveness file + persona, computes a
  **lottery-season timeline factor**, runs the real scorer, and writes a JSON log
  plus a Markdown report. Belongs here because no existing recipe turns an OPT end
  date into "lottery seasons remaining", and `opt-countdown`-style recipes assume
  the 90-day clock.
- **Proposed, not built:** title→SOC crosswalk for sponsorship (the CSV has no SOC
  column) `[TODO: DATA SOURCE]`; DOL LCA disclosure data for public big tech that
  never files Form D `[TODO: DATA SOURCE]`; E-Verify enrollment check (required
  for STEM OPT employers) `[TODO: DATA SOURCE]`.

## 3. Gates and what a human must see

| Gate | Clears when | Human must see |
|---|---|---|
| G0 profile | persona has an `opt_end_date` in the future, and the scorer reports `profile_needs_sponsorship: true` | the date, and the scorer's own flag (guards a known regex trap — see §4) |
| G1 liveness | saved `ats:liveness` output says `active` for the URL | the saved liveness file; `uncertain` or missing = **HOLD**, not live |
| G2 sponsorship evidence | company resolves to exactly one CSV row with a non-blank `Total Approvals` | the row; not found or ambiguous = **HOLD** (absence ≠ non-sponsor) |
| G3 timeline | ≥ 1 lottery season remains after the expected start date | season list with each assumption labeled your-input |

## 4. Predicted failure cases (and how I'll check each)

1. **Big tech missing from the CSV.** Google/Meta/Amazon/Netflix are absent (I checked:
   the CSV is built from Form D filers). Prediction: a naive lookup would score them
   "no sponsorship → Skip". Check: a fixture role at a company not in the CSV must
   come out **HOLD: not-in-dataset**, never `tier: None`.
2. **Ambiguous company rows.** `SNOWFLAKE INC` (1,816 approvals) and `SNOWFLAKE
   COMPUTING INC` (blank) both exist. Check: a prefix/fuzzy match must not pick the
   blank one; exact match only, and >1 hit = HOLD.
3. **Liveness `uncertain` on a dead link.** Verified today: a fabricated Greenhouse
   job id returns `uncertain`, not `expired`. Check: fixture liveness file with an
   `uncertain` line → HOLD, never factor 1.0.
4. **Scorer reads STEM OPT as "authorized".** Verified today: `--profile` with
   `"F-1 STEM OPT — work authorized (EAD)"` yields `profile_needs_sponsorship: false`
   (regex at `scripts/score/role-scorer.mjs:60`), zeroing the sponsorship weight.
   Check: the prototype must refuse to report if the scorer's output says `false`.
5. **OPT end already past / zero seasons left.** Check: persona fixture with a past
   date must exit non-zero with no report written.
6. **15-2051.00 has no O\*NET ability values** (blank columns, verified). Check:
   report must show them as missing, not 0.

## 5. Prediction about what my prototype will get wrong or miss (my own)

[STUDENT TO WRITE — in your own words, before the prototype is built]

## Revisions

_(none yet)_
