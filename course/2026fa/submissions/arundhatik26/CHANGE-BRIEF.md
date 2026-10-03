# CHANGE-BRIEF — co-op sponsor check for software roles (SOC 15-1252 / 15-1254)

## Executive summary

**What this is:** the plan for the recipe. Sections 1–4 (situation, data, gates, failure cases) were drafted with Claude on 2026-10-02 *before* the prototype code was written. Sections 5–6 (my own predictions) were written later — see the note there.
**Why read it:** it says who the recipe is for, what data it uses, where a human must decide, and what I expected to go wrong.
**What it decides:** for a second-semester international master's student picking a co-op, whether a company has a recorded history of sponsoring *software* work — so the co-op has a real path to a full-time, sponsored job — or whether that is unknown.

> Original predictions below are kept as first written. Later changes go in **Revisions** at the bottom, dated; nothing above it is rewritten.

---

## 1. Career situation

- **Persona (fictional):** Ananya Rao, `ananya.rao@example.com` (name proposed by Claude; invented, no real person)
- **Program:** MS Information Systems, January 2026 intake, currently in second semester.
- **Status:** F-1. Degree is STEM-designated (stated by student — `your-input`, not checked by the repo).
- **Looking for now:** a co-op (on CPT) as a software developer / full-stack developer.
- **Graduation scenarios:** December 2027 *or* April 2028, depending on co-op timing (`your-input`).
- **After graduation:** 12 months OPT + 24 months STEM OPT extension, then an H-1B is needed.
- **The question the recipe answers:** *If I take a co-op at this company, is there recorded evidence it has sponsored software/full-stack roles, so the co-op can convert to a sponsored full-time job?*

**Engine layers used:** 80 Days to Stay (sponsorship + funding date), The Cognitive Pivot (BLS wage/occupation row for SOC 15-1252 and 15-1254), Job-Ops (posting liveness).

## 2. What I reuse, and what I add

### Reused (exact paths, all verified present on 2026-10-02)

| What | Path |
|---|---|
| Company sponsorship + funding (30,369 rows; columns incl. `Total Approvals`, `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored`, `latest_funding_date`) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |
| Occupation wages + O*NET levels | `data/bls/compact/soc_occupation_compact.csv` (rows `15-1252.00`, `15-1254.00`) |
| Posting liveness | `npm run ats:liveness -- <job-url>` → `scripts/ats/check-liveness.mjs` |
| Scorer (votes × gates → Apply/Consider/Skip) | `npm run score -- <roles.json> --out-dir <dir>` → `scripts/score/role-scorer.mjs` |
| Role input shape | `data/examples/ch11-roles.json` |

### Added (all inside my namespaces)

| What | Path | Why it belongs |
|---|---|---|
| Prototype: builds `roles.json` from the CSV + my inputs, runs the existing scorer, writes JSON log + Markdown report | `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/` | No existing script answers "has this company sponsored *software titles*" — the CSV has the field, nothing reads it per role. |
| Software-title match on `top_job_titles_sponsored` | same folder | Separates "sponsors anyone" from "sponsors the work I'd do". |
| Timeline calculator for two graduation scenarios | same folder | The scorer takes a timeline factor but nothing computes it from a student's dates. |
| Recipe + card | `recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.{md,card.md}` | Required. |

## 3. Gates (hard stops) and what a human must see

| Gate | Testable condition | What the human must see to clear it |
|---|---|---|
| **G1 Input** | every target company and role in my input file has a company name, a title, a SOC code, and a graduation scenario | the input file, printed |
| **G2 Company match** | each company resolves to exactly one CSV row, or is marked `not-in-dataset` / `ambiguous` | the matched CSV row (name, approvals, titles) next to my input name — a human confirms it is the same company |
| **G3 Liveness** (gate) | posting checked; a dead posting sets liveness factor 0 | the liveness output and the URL |
| **G4 Timeline** (gate) | the co-op start date is before graduation, and graduation is still in the future | the computed dates for both scenarios |
| **G5 Decision** | scorer ran; every value labeled `record` / `model-judgment` / `your-input` | the Markdown report — a human decides whether to apply, network, or skip |

## 4. Predicted failure cases (and how I'll check each)

| # | Case | Expected behaviour | How I'll check |
|---|---|---|---|
| F1 | **Company not in the CSV** (e.g. JPMorgan Chase, Goldman Sachs, Morgan Stanley — I searched on 2026-10-02 and found none) | status `not-in-dataset`; sponsorship = unknown, **not** 0; no Apply | test fixture + sample run |
| F2 | **Company in the CSV with blank sponsorship** (e.g. `VISA INC`: row exists, `Total Approvals` empty) | status `no-sponsorship-record`; unknown, not 0 | test fixture + sample run |
| F3 | **Same company under two names** (e.g. `SOCIAL FINANCE INC` has 182 approvals; `SOFI TECHNOLOGIES INC` is blank) | flagged `ambiguous` for a human at G2; not silently picked | test fixture |
| F4 | **Sponsors, but not software titles** | sponsorship vote lowered and labelled; reason printed | test fixture |
| F5 | **Graduation date already past / co-op start after graduation** | timeline gate closes → Skip (gated) | test fixture |
| F6 | **Posting 404s** | liveness 0 → Skip (gated) | `ats:liveness` on a dead URL |

## 5. What I predict my prototype will get wrong or miss on the first pass

> **[Student writes this — in your own words.]**
>
> Prompt to think about: the CSV only stores each company's *top few* sponsored titles. What happens to a company that sponsored software engineers but whose top titles are something else? What about name matching (punctuation, "INC" vs "CORP")?

-

## 6. My other predictions (before running)

> **[Student writes these.]** For example: how many of my target companies do I expect to Skip? Which company do I expect to score highest? Do I expect the run to skip at least half?

-

---

## Revisions

*(dated, appended only)*
