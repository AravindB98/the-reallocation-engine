# CHANGE-BRIEF — swe-h1b-15-1252

*Written before building (2026-10-01). Original predictions are kept; revisions are added below, dated.*

## Situation
F-1 MS student targeting Software Engineer roles (SOC 15-1252, Software Developers),
with a fixed OPT end date. Persona is fictional (OPT end 2027-03-31, @example.com).
Question answered per role: "Has this company sponsored software roles, and can a hire
finish before my OPT window closes?"

Engine layer: 80 Days to Stay (sponsorship history). Plus the visa-timeline gate.

## Reuse (exact paths)
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
  — columns used: company_name, Total Approvals, Total Denials, Approval_Rate,
  top_job_titles_sponsored, latest_funding_date, latest_funding_amount
- `scripts/score/role-scorer.mjs` via `npm run score -- <roles.json> --out-dir <dir>` (not copied)
- `data/examples/ch11-roles.json` — input shape, and the p values for tiers (Proven 0.9, Likely 0.6)
- `npm run ats:liveness -- <url>` — run by hand; result recorded in the input file

## Proposed (not in repo)
- A tier rule turning approval counts into a sponsorship tier. The repo has none
  (grep found only soft-tier names in role-scorer.mjs). Proposed:
  Proven = Total Approvals >= 10 AND a title containing "software";
  Likely = >= 1 approval otherwise; No record = company absent or approvals blank.
  Thresholds are my choice → [VERIFY], labeled your-input.
- A timeline factor from OPT end date and an assumed 60-day hiring lag (your-input).
- Form D sample join → [TODO: DATA SOURCE] (not built this pass).

## Gates and what a human needs to see
1. **Liveness gate**: role needs a recorded `ats:liveness` result. Missing → stop, human checks the posting.
2. **Timeline gate**: days left on OPT vs hiring lag. OPT date past → stop, no score.
3. **Sponsorship-evidence gate**: company not in CSV or approvals blank → not scored;
   human decides (network into it, or skip). Blank is not zero.

## Predicted failure cases and how I'll check
1. Company not in CSV → fixture role with a made-up company; expect a clear "no record" stop, no score.
2. Approvals field blank (e.g. `$AVY INC`) → expect "no record", not p = 0.
3. OPT date already past → fixture persona with a past date; expect a clear error, no score.
4. Name mismatch ("Acme" vs "ACME INC") → expect a miss; report must say exact-match only.

## What I predict the prototype will get wrong first
Name matching. I expect exact/normalized matching to miss real sponsors whose legal
name differs from the brand name on the posting, wrongly sending them to "no record".
Also: "software" title match is a proxy for SOC 15-1252, not a verified SOC code —
the CSV has no SOC column.

## Revisions

**2026-10-01 (after inspecting the data and scorer)**
- The CSV has no SOC column, as predicted. The "software" title match is now a labeled proxy, listed under "cannot verify."
- The scorer has **no funding term** and defaults a missing `source` to `record`. Funding became report-only, and the prototype always sets `source`.
- **New route added:** sponsor evidence but no live posting → network-target list. No SWE postings were open at Abacus or 1upHealth, and this route connects the recipe to the networking hours.
- Liveness is run by hand with `npm run ats:liveness` and pasted in, to keep the prototype offline. Form D join deferred as a data-source TODO.
- Added failure case: ambiguous match (two CSV rows normalize to the same name) → held.

**2026-10-02 (after the worked run)**
- Prediction "name matching will miss real sponsors" was **confirmed**: "6sense" was held as not found; the legal name has 62 approvals.
- **Not predicted:** my own output labeled sponsorship `record`, though p came from my tier rule. Fixed to `your-input` (commit c5ec21d).
- **Not predicted:** the title-proxy problem showed up on a real company (6sense: 1 software + 1 non-software top title, 62 approvals, rated Proven).
- **Not predicted:** both scored roles are Senior titles; the scorer has no seniority term.