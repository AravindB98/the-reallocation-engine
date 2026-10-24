# CHANGE-BRIEF — New-grad SWE at big H-1B sponsors, for a December graduate

## Executive summary

This is the plan I wrote **before** building anything. It says who the recipe is for, what data it will use,
where it stops for a human, and what I expect to go wrong. The recipe is for an international master's
student graduating in **December**, on a STEM degree, who hasn't started OPT yet and wants **entry-level
software engineering** jobs at companies that sponsor a lot of H-1B visas.

Two things that person can't easily see:
1. A company with thousands of H-1B approvals may mostly sponsor **senior** engineers, consultants or non-software
   roles. "Big sponsor" does not mean "sponsors new-grad software engineers".
2. New-grad programs at big companies usually start in **summer**. For a December graduate, the 90-day
   unemployment limit on OPT can run out **before** a summer start date.

The original predictions stay as written. Later revisions are added in §7, not edited in.

---

## 1. Career situation

| Field | Value | Label |
|---|---|---|
| Degree | STEM master's (Northeastern), eligible for the 24-month STEM OPT extension | your-input |
| Visa stage | F-1, still studying, post-completion OPT not started | your-input |
| Program end | December 2026 (exact date kept in `private/opt-profile.json`, gitignored) | your-input |
| Planned OPT start | January 2027 (exact date private) | your-input |
| Target role | Entry-level / new-grad Software Engineer, SOC **15-1252** Software Developers | your-input |
| Target employers | "Proven big sponsors": ≥ 100 H-1B approvals in the 80 Days CSV | your-input (threshold is my choice) |

Committed files (fixtures, worked run, reports) use a **fictional persona** with similar dates, not my real
dates. DATA_CONTRACT §Zero-Conditions counts real immigration details as PII.

**Engine layers used:** 80 Days to Stay (sponsorship), Job-Ops (liveness gate, as input only), Cognitive Pivot
(BLS wage for 15-1252, as context outside the scorer). Visa timeline is its own gate.

## 2. What I reuse (exact paths) and what I'm adding

**Reused, not modified:**

| Path | What I read from it |
|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored` (30,369 rows; 1,552 with approvals; 152 with ≥ 100) |
| `data/bls/compact/soc_occupation_compact.csv` | row `15-1252.00`: `annual_median_wage` = 133080.0, `oews_year` = 2024 |
| `scripts/score/role-scorer.mjs` (`npm run score -- … --out-dir …`) | the composite, gates and Apply/Consider/Skip. Run as the CLI, not copied |
| `npm run ats:liveness -- <url>` | the human runs it; its result is entered into the postings file |

**Proposed additions (all inside my namespace):**

| Addition | Why it belongs | Tag |
|---|---|---|
| `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/` prototype | builds a `roles.json` from records + my inputs, runs the existing scorer, writes a JSON log + Markdown report | [TODO: DEV] |
| **Entry-level title classifier**: splits `top_job_titles_sponsored` into entry-SWE / senior-SWE / non-SWE with a fixed keyword rule | this is the hidden signal; no script in the repo reads this column | [TODO: DEV] |
| **Tier → p mapping** for the sponsorship vote, specific to entry-level SWE | Ch.7 names Proven/Likely/Unknown/Avoid tiers, but its thresholds are "pending reconciliation"; I have to choose and justify numbers | [TODO: DEFINE] |
| **OPT timeline factor**: start date vs. OPT start + 90 unemployment days | no timeline script exists; `timeline` is always `your-input` in `data/examples/ch11-roles.json` | [TODO: DEV] |
| A per-title H-1B count (how many entry-level SWE approvals, not just "the title appears in the top list") | the CSV only has a top-titles list, no counts per title | [TODO: DATA SOURCE] |

## 3. Gates, and what a human must see to clear each

| Gate | Testable condition | Human must see |
|---|---|---|
| G0 window-open | run date ≤ OPT start + 90 days. If the window has already closed, the whole run **halts** | the computed deadline and the dates it came from |
| G1 company-match | posting's company matches exactly one CSV `company_name` (casefold, whitespace-trimmed, **no fuzzy match**) | the unmatched names, to fix by hand (e.g. "Microsoft" vs `MICROSOFT CORP`) |
| G2 liveness | the posting has a liveness result from `npm run ats:liveness` with a check date. `unchecked` → not scored | the URL and the check date; a human re-runs it if stale |
| G3 timeline | role start date (stated, or estimated from a hiring-lag assumption) falls within [OPT start, OPT start + 90 days] | the start date, whether it was stated or assumed, and the deadline |
| G4 entry-level evidence | classifier output for the company's sponsored titles | the raw title list next to the classification, because the rule can be wrong |

Liveness and timeline are **gates** (multipliers in the scorer), not votes.

## 4. Predicted failure cases and how I'll check each

1. **Company not in the CSV / name mismatch.** E.g. a posting from "Google" when the CSV has `GOOGLE LLC`, or
   a company with no row. *Check:* fixture posting with an unmatched name → expect `missing: no-company-match`,
   no sponsorship value, not sent to the scorer.
2. **OPT window already past.** Run with a persona whose OPT start + 90 days is before the run date. *Check:*
   expect the run to halt with exit code ≠ 0 and write no roles.
3. **Start date after the unemployment deadline** (the summer-start case). *Check:* fixture with a July start →
   timeline factor 0 → scorer returns Skip (gated), regardless of how strong the sponsor is.
4. **Liveness unchecked.** *Check:* fixture posting with `liveness.status = "unchecked"` → `missing:
   liveness-unchecked`, not scored, listed in the report with the command to run.
5. **Company has approvals but `top_job_titles_sponsored` is empty.** *Check:* → tier `Unknown` (not `Avoid`),
   with reason `no-title-evidence`.

## 5. What I predict the prototype will get wrong on the first pass

- The keyword classifier will misread titles. "Software Engineer II" may be entry-level at some companies and
  mid-level at others, and "Associate Specialist - Technology" (Synchron) is software work with no "software"
  in the name. I expect false "senior-only" and false "non-SWE" results.
- `top_job_titles_sponsored` is only the *top* titles. A company can sponsor many new-grad SWEs and still not
  show a new-grad title in its top list. So "no entry-level title" is **weaker evidence** than it looks.
- `median_salary_offered` covers all of a company's sponsored roles, not entry-level SWE, so comparing it with
  the BLS 15-1252 median will overstate new-grad pay at senior-heavy companies.

## 6. Facts-that-bite this recipe addresses

| Fact | How I handle it |
|---|---|
| Role quality has weight 0 in the scorer | I don't change the weight. BLS 15-1252 median vs. company median is shown in the report **as context only**, outside the composite |
| `bls:local-wage` feeds nothing / fails on a fresh clone | not used; I use the national median from the compact CSV and say it's national |
| Only Form D samples ship | Form D is **not used** in v0.1 (big sponsors are mostly public or late-stage); stated as a limitation |
| `data/raw/`, `data/verified/`, `logs/gate-decisions/` don't exist | gates point only at my own folder and the two CSVs above |
| `snickerdoodle` CLI is roadmap | no commands use it |

## 7. Revisions (append-only)

### R1 — 2026-09-30, before building: the CSV is missing most of big tech

Before writing any code, I checked how big-company names appear in the CSV. Using exact prefix matches on `company_name`:

| Searched | Found |
|---|---|
| GOOGLE, AMAZON, NVIDIA, ORACLE, IBM, CISCO, ADOBE, WAYFAIR, HUBSPOT | **no row** |
| META, APPLE | only unrelated small companies (`META CO`, `APPLE BOYS MUSICAL NYC LLC`, …), none with approvals |
| MICROSOFT | `MICROSOFT CORP`, 12,226 approvals |
| SALESFORCE | **two rows**, `SALESFORCE COM INC` and `SALESFORCECOM INC`, both 66 approvals (probably the same entity, counted twice) |

What this changes:
- Failure case 1 is much bigger than I predicted. Several of the largest H-1B sponsors in the US have **no row**, so
  "not in the CSV" must mean **Unknown — not in this dataset**, never "non-sponsor" or Avoid.
- **Why (checked, not guessed):** `data/80-days-to-stay/README.md` ("Progress Day 08") says the master CSV was
  built by taking the SEC startup list and mapping it to DOL LCA disclosure data and the USCIS H-1B Employer Data
  Hub. So the CSV's population is **SEC Form D filers**. A company that never filed a Form D isn't in it,
  however many H-1Bs it sponsors. The recipe has to say this on the human card, in plain words.
- New failure case 6: **duplicate entity rows.** The G1 gate must stop when a name matches more than one row
  (`missing: ambiguous-company-match`) rather than picking one or adding them together.
- A prefix search for "META" matches unrelated companies. This supports exact-match-only in G1.
