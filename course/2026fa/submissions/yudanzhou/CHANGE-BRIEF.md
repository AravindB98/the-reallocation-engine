# CHANGE-BRIEF — `is-funded-sponsor-triage`

## Executive summary

Before building anything, this brief writes down what I plan to build, which data it will use, where it must stop for a human, and how I expect it to fail. I am an international master's student in Information Systems who prefers venture-funded companies and has not yet chosen between analyst-type roles. The recipe answers two questions the public job market hides from me: *of the funded companies I'm drawn to, which have actually sponsored an H-1B?* and *for which kind of analyst role?* These predictions are kept as written. Later corrections go in the **Revisions** section at the bottom, not over the original text.

**Authorship note:** the AI assistant (Claude Code) ran the data counts quoted below and drafted the structure from my answers. I chose the situation, the direction, and the target role families, and I reviewed every prediction.

---

## 1. Career situation (specific enough)

> International master's student in **Information Systems** (I-20 CIP **14.0903**, Computer Software Engineering, which is on the DHS STEM list; STEM status to be confirmed with the school's DSO), graduating **May 2027**, planning **post-completion OPT** with a 90-day unemployment limit. Targets **venture-funded companies** and is **undecided between Business Analyst, Data Analyst, Product Analyst, and IT Consultant** roles.

Committed files use a **fictional persona** with this situation. No real name, dates from my I-20, or contact details are committed (DATA_CONTRACT §Zero-Conditions).

**Engine layers used:**
- **80 Days to Stay** (primary): funding and H-1B sponsorship history.
- **Job-Ops** (liveness gate, human-checked).
- The **visa timeline** gate (my own input).

## 2. Information asymmetry, measured on the shipped data

Counts below were computed on 2026-10-02 from `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows), so they are `record`:

| Observation | Count |
|---|---|
| Companies with a funding date | 27,874 |
| …that also have ≥1 H-1B approval | **1,532 (≈5.5%)** |
| `Total Approvals` blank | 28,812 |
| `Total Approvals` explicitly 0 | 5 |
| Sponsors whose `top_job_titles_sponsored` mentions "data analyst" | 34 |
| …"business analyst" | 21 |
| …"consultant" | 22 |
| …"product analyst" | 4 |
| Latest `latest_funding_date` in the CSV | 2025-09-26 |

"Funded" is not "sponsors": about 94.5% of funded companies have no approval on record. The title counts suggest my four role families are **not equally sponsorable**, and that alone could help me pick a target.

## 3. What I reuse (exact paths) and what I add

**Reuse:**
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: funding and sponsorship records.
- `data/sec/form-d/processed/sample/*.sample.json`: Form D recency samples (only 50 companies per quarter ship, per Fact 3).
- `scripts/score/role-scorer.mjs` via `npm run score -- <roles.json> --out-dir <my folder>`: the existing scorer, **not re-implemented**.
- `scripts/ats/check-liveness.mjs` via `npm run ats:liveness -- <url>`: for the human liveness check.
- `node scripts/conformance.mjs`, `npm run verify`, `node scripts/pii-scan.mjs`.

**Add** (all in my namespaces):
- `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/`: a small Python 3 script (standard library only) plus an offline test and fixtures. It reads the CSV, keeps funded companies, classifies their sponsored titles into my four role families, joins a small fixture of postings, and writes `roles.json` for the scorer, plus a JSON log and a Markdown report.
  - *Why it belongs:* the repo has a sponsorship scorer but nothing that splits a sponsor's history **by role family**, for a candidate who hasn't chosen a family yet.
- `recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md` and `.card.md`.

## 4. Gates (where it stops for a human)

| Gate | Testable condition | What the human must see to clear it |
|---|---|---|
| **G1 Data present** | The CSV exists and has the columns `company_name`, `latest_funding_date`, `Total Approvals`, `top_job_titles_sponsored` | If not, stop. Don't guess. |
| **G2 Liveness** (gate) | Each posting in the input carries a liveness result from `npm run ats:liveness`, or is marked `unchecked` | Unchecked postings are **held out of scoring** and listed as "check before applying". |
| **G3 Visa timeline** (gate) | `opt_start + 90 days − assumed hiring lag ≥ today`, with every term `your-input` | If the window is already closed, factor 0 (Skip). The human confirms the dates and the lag assumption. |
| **G4 Decision** | The scorer report exists | The human reads each row term by term and decides. Overrides need a written reason. |

## 5. Predicted failure cases and how I'll check each

1. **Company missing from the CSV:** a posting's company has no row. → The script must output "no record" with `sponsorship.source = record` absent, **not** p = 0. Test it with a fixture company that isn't in the CSV.
2. **Blank `Total Approvals`:** 28,812 rows are blank but only 5 are 0. A blank means "no match found", not "never sponsors". → Treat blank as tier `Unknown` and say so. Test with a known blank row.
3. **OPT window already closed:** an `opt_start` date such that start + 90 days < today. → Timeline factor 0 and a clear message. Test with a fixture date.
4. **Company-name join fails between datasets:** in a quick check, 0 of 200 Form D sample companies matched CSV names under a naive normalization. → Report the join rate and don't claim Form D recency for unmatched companies.

## 6. What I predict the prototype will get wrong on the first pass

**Keyword title classification will misfile roles.** Examples:
- "Business Analyst Manager – Data Distribution" could land in two families.
- "Analyst, Business Engagement" might not match "business analyst" at all.
- "Data Engineer" must *not* count as Data Analyst.

I expect the per-family counts in §2 to shift once I check a sample of titles by hand.

**My own prediction (yudanzhou):** a company with no H-1B record in the CSV may still hire F-1 OPT students. OPT needs no employer sponsorship, and the shipped data has no OPT hiring records at all. So the prototype will under-rate companies that hire OPT graduates but haven't filed H-1B yet. In particular, young funded startups may be exactly the companies I want, and "no record" must never be read as "won't hire me".

---

## Revisions

*(Add dated entries below. Do not edit the text above.)*

### 2026-10-02 — scope of "helps me pick a role family" (after the sample run)

The executive summary and §2 say the recipe helps me choose between the four role families "by data". That overstates what the prototype does. It **informs** the choice with one table: how many funded H-1B sponsors list each family in their top sponsored titles (DA 38, BA 31, IT 21, PA 4 on 2026-10-02). It does **not** choose for me. Those counts also have known limits: only a company's top titles are listed, and large consultancies inflate the IT Consultant count. The prototype's main function is **filtering concrete postings within the four families** into Apply / Consider / Skip / networking list.
