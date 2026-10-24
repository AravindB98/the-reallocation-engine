# CHANGE-BRIEF — de-mlops-h1b

## Executive summary

**What this is:** the "predict before you build" record for my recipe. It says who the
recipe is for, which existing data it reuses, where it must stop for a human, and what I
expect to go wrong. I wrote it before writing any prototype code.

**Why read it:** it fixes the predictions now, so the worked run can be checked against
them later. The recipe is for an international master's student who graduates in December
2026 and wants data-engineering or MLOps jobs at companies that sponsor H-1B visas. It
separates companies with a real sponsorship record from companies that only *look* like
sponsors.

**What it decided:** reuse the engine's company file, its funding samples, its
posting-liveness checker, and its scorer. Add no new scoring logic. Stop at four gates.
Six failure cases are predicted, each checked against the shipped data today. Two of them
are traps a student in this situation would walk into: about 95% of companies in the file
have no sponsorship record at all (blank does not mean "doesn't sponsor"), and the scorer
reads the honest phrase "not yet authorized" as "needs no sponsorship".

---

**Student:** Gnanasudharsan (GitHub `Gnanasudharsan`) · **Term:** 2026fa · **Written:** 2026-10-01, before any prototype code
**Branch:** `contrib/2026fa-gnanasudharsan-de-mlops-h1b`
**Supersedes:** `archive/CHANGE-BRIEF-ds-stemopt-15-2051.md` (an earlier scope — Data
Scientist on STEM OPT — abandoned the same day before any code; archived, not deleted).

> Predict-phase record. Original predictions below are kept as written; later
> changes go in **Revisions** at the bottom, dated, without rewriting the originals.

## 1. Career situation

An international **MS in Data Analytics Engineering** student on **F-1**, program end
**December 2026**, **not yet on OPT**. Targets: **Data Engineer** and **MLOps / ML Platform
Engineer** roles at employers with an H-1B record.

Why this is not the generic case:

- **There is a gap before work authorization starts.** The OPT EAD may not be in hand by
  graduation. Until it is, no offer can start. The 90-day unemployment clock starts on the
  EAD start date, not at graduation. A role whose start date comes before the EAD start is
  not workable, however good it is.
- **The job titles don't line up with the job codes.** "MLOps" appears in **0** of the 30,369
  `top_job_titles_sponsored` strings in the company file (counted 2026-10-01). "Data
  Engineer" maps to no single SOC code: plausible codes are 15-1243 (Database Architects,
  which includes 15-1243.01 Data Warehousing Specialists) and 15-1252 (Software Developers).
  MLOps work is often filed under 15-1252 or 15-2051. Any title-to-SOC mapping is a
  **model-judgment** and has to be labeled one.
- **STEM OPT adds employer conditions.** A 24-month STEM extension requires an E-Verify
  employer. Whether the degree's CIP code qualifies is **your-input**. The engine holds no
  E-Verify data.
- **Lottery seasons.** Assuming an EAD start around early 2027 and a STEM extension, OPT
  plus STEM runs to roughly early 2030. That gives about three March H-1B registration
  windows (2027, 2028, 2029). All of these dates are **your-input assumptions**, not records
  **[verify against current USCIS guidance before relying on them]**.

The demo persona is fictional (`fixtures/persona.json`, `@example.com`, program end
2026-12-12, assumed EAD start 2027-02-01). No real immigration dates are committed.

**Engine layers used:** 80 Days to Stay (sponsorship + funding), Job-Ops (liveness),
Cognitive Pivot (BLS rows for 15-1243 / 15-1252, as context only; see §2).

## 2. Reuse vs. new

### Reused (exact paths, all present on 2026-10-01)

| What | Path | How |
|---|---|---|
| Sponsorship + funding per company | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | exact normalized-name lookup; `Total Approvals`, `Total Denials`, `top_job_titles_sponsored`, `latest_funding_date` |
| Form D recency confirmation | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` | exact `company.company_name_normalized` lookup; **samples only: first 50 companies per quarter (e.g. 50 of 13,325 for 2025Q2)**, so a miss here means "not in sample", not "no filing" |
| Role-quality context | `data/bls/compact/soc_occupation_compact.csv` | rows for `15-1243`, `15-1252`; reported beside the decision, **not fed to the scorer** (weight is 0.0, see §2 note) |
| Liveness | `npm run ats:liveness -- <urls>` (`scripts/ats/check-liveness.mjs`) | human runs it and saves stdout; the prototype parses the saved file (keeps the prototype offline) |
| Combiner | `npm run score -- <roles.json> --profile <p.json> --out-dir <dir>` (`scripts/score/role-scorer.mjs`) | prototype writes a `data/examples/ch11-roles.json`-shaped file and calls the real scorer; **no copy of the scorer** |

**Note on role quality (known gap):** `role-scorer.mjs` sets `role_quality: 0.0`
`[VERIFY]`, and `bls:local-wage` feeds nothing yet. I will not propose a weight. The BLS row
appears in the human report as context, labeled record, and changes no decision.

### New (in my namespace only)

- `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/`: a Node script that builds
  `roles.json` from the CSV, the saved liveness file, and the persona. It:
  1. tags each role's title as Data-Engineering / MLOps family using a keyword list
     (**model-judgment**, and the list is printed in the report);
  2. derives the sponsorship tier from the company's CSV row. It counts how many sponsored
     titles fall in the same family. A sponsor of only non-data titles is a weaker signal
     than a sponsor of "Data Engineer";
  3. computes a timeline factor from the EAD start date and the role's start date
     (**your-input**);
  4. runs the real scorer;
  5. writes a JSON log and a Markdown report.
  It belongs here because no existing recipe handles a student who has not yet received an
  EAD, or matches sponsorship by job family rather than by company alone.
- **Proposed, not built:**
  - title→SOC crosswalk for sponsored titles (the CSV has no SOC column) `[TODO: DATA SOURCE]`;
  - DOL LCA disclosure data for public big tech, which never appears in a Form D-built file `[TODO: DATA SOURCE]`;
  - E-Verify employer lookup `[TODO: DATA SOURCE]`.

## 3. Gates and what a human must see

| Gate | Clears when | Human must see |
|---|---|---|
| G0 profile | persona has a program end date and an assumed EAD start date, both parseable, with the EAD start on or after today; **and** the scorer's output says `profile_needs_sponsorship: true` | the dates, and the scorer's own flag (guards the regex trap in §4.4) |
| G1 liveness | the saved `ats:liveness` output says `active` for the posting URL | the saved liveness file; `uncertain`, `expired`, or URL absent from the file = **HOLD**, never treated as live |
| G2 sponsorship evidence | company resolves to exactly one CSV row whose `Total Approvals` is non-blank | the matched row; not found, ambiguous, or blank = **HOLD: no record** (absence ≠ non-sponsor) |
| G3 timeline | role start date ≥ assumed EAD start, and ≥ 1 March registration window remains before the assumed OPT/STEM end | the season list, with every date labeled your-input |

A HOLD role is **not sent to the scorer** with an invented value. It is listed separately
in the report with its reason and a next action (e.g. "network in; ask whether they
sponsor").

## 4. Predicted failure cases (and how I'll check each)

All of the facts below were checked against the shipped files on 2026-10-01.

1. **Blank sponsorship ≠ zero sponsorship.** 28,812 of 30,369 CSV rows have a blank
   `Total Approvals`. A naive parse turns blank into 0, giving "None tier" and a Skip.
   *Check:* fixture role at a blank-approvals company (e.g. `WEIGHTS & BIASES INC`, blank
   approvals, funding 2023-06-29) must come out **HOLD: no-sponsorship-record**, never
   `tier: None`.
2. **Big tech is missing entirely.** No row starts with `GOOGLE`, `AMAZON`, or `META
   PLATFORMS`. These companies are heavy data-engineering employers, but the file is built
   from Form D filers.
   *Check:* fixture role at a company not in the CSV → **HOLD: not-in-dataset**.
3. **Ambiguous company rows.** `SNOWFLAKE INC` (1,816 approvals) and `SNOWFLAKE COMPUTING INC`
   (blank) both exist, and Snowflake is a core data-engineering employer.
   *Check:* exact normalized match only; a prefix or fuzzy hit must never pick a row; more
   than one exact hit = HOLD.
4. **The scorer reads a pre-OPT status as "authorized".** Verified today: `--profile` with
   `"authorization": "F-1 student, OPT EAD not yet authorized"` returns
   `profile_needs_sponsorship: false`, because the regex at
   `scripts/score/role-scorer.mjs:60` matches the word "authorized". That zeroes the
   sponsorship weight for exactly the student this recipe serves.
   *Check:* the prototype writes its own profile string, re-reads the scorer's output, and
   **refuses to write a report** if the flag is `false`. (I will log this as a scorer defect
   for the maintainer, not patch the scorer.)
5. **Liveness `uncertain` on a dead link.** Verified today (`runs/baseline/ats-liveness.txt`):
   a fabricated Greenhouse id (`/databricks/jobs/9999999999`) returns `uncertain`, not
   `expired`.
   *Check:* fixture liveness file with an `uncertain` line → HOLD, never factor 1.0.
6. **Role starts before the EAD does / no seasons left.**
   *Check:* a role start date earlier than the EAD start → G3 fails for that role; a
   persona whose dates are already past → exit non-zero, no report written.

Also observed, not yet a test: some sponsored-title strings carry numeric suffixes
(`AMGEN INC`: `'Data Engineer 20516.3745'`). I don't know what the suffix is, and I will
not guess. Keyword matching must tolerate it.

## 5. Prediction about what my prototype will get wrong or miss (my own)

I predict the prototype will initially misclassify several companies with recent Form D funding as viable H-1B sponsors because they lack historical DOL records in the sample dataset, requiring manual verification against the broader data layer.

## Revisions

_(none yet)_
