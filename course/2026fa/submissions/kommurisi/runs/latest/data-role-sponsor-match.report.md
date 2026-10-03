# Data-role sponsor match — 2026-10-03

**For:** MS Information Systems (STEM-designated) student in Boston, final semester, F-1; graduating Dec 2026; targeting early-career data / analytics engineering and BI roles that will need H-1B sponsorship after OPT

**Result:** 7 roles → **Apply 1 · Consider 2 · Skip 1 · Unresolved 3**. Only 4 reached the scorer; unresolved roles were *not* scored as zero, they need you first.

*Mode: sample. Labels — **record**: read from a repo file or a saved observation · **your-input**: my assumption or self-rating · **model-judgment**: none in this run (no model was called).*

## Decisions and next actions

| Role | Decision | Composite | Why | Next action |
|---|---|---|---|---|
| Klaviyo — Analytics Engineer | **Apply** | 0.54 | composite 0.540 ≥ 0.3, gates healthy | TAILOR an application (the 2 research-and-apply hours) |
| Databricks — Senior Data Scientist | **Consider** | 0.315 | above threshold (0.315) but one soft spot: sponsorship tier "Likely" | NETWORK first — find a data-team contact and ask about sponsorship for this role (the 3 networking hours) |
| Toast — Staff Data Scientist | **Consider** | 0.285 | composite 0.285 in the Consider band [0.2, 0.3) | NETWORK first — find a data-team contact and ask about sponsorship for this role (the 3 networking hours) |
| Klaviyo — Data Analyst (CONSTRUCTED: job id that does not exist) | **Skip** | 0 | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP — no time this week |
| DraftKings — Data Engineer | **Unresolved** | — | no-sponsorship-record, liveness-unchecked | HUMAN CHECK before any time is spent — resolve the named gap first (see reason) |
| Absci — Data Scientist | **Unresolved** | — | ambiguous-company-match, liveness-unchecked | HUMAN CHECK before any time is spent — resolve the named gap first (see reason) |
| Northwind Analytics — Data Analyst | **Unresolved** | — | no-company-match, liveness-unchecked | HUMAN CHECK before any time is spent — resolve the named gap first (see reason) |

## Evidence per role (verified vs. inferred)

### Klaviyo — Analytics Engineer
- CSV row: `KLAVIYO INC` at `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:14495` **[record]**
- H-1B approvals (company-wide): 154, approval rate 97.5% **[record]**
- Top sponsored titles: "Business Intelligence Engineer", "Software Engineer II", "Engineering Manager Data Exchange", "Engineering Manager II- SMS", "Senior Software Engineer" **[record]**
- Data titles among them: "Business Intelligence Engineer" → tier **Proven**, p = 0.9 **[your-input: my patterns + my calibration]**
- Liveness: ats:liveness said `active`; Greenhouse API status `200` **[record]** → gate factor 1 (playwright-active+greenhouse-200)
- Fit 0.75 **[your-input]** — SQL + data-modelling coursework matches; Boston; level not stated in title
- Role quality (NOT in the score — scorer weight 0.0): 15-1243.01 Data Warehousing Specialists **[your-input mapping]**; national median $135,980 (OEWS 2024) **[record]**; cognitive-pivot score 3.626 **[record]**
- H-1B median salary offered, all roles at this company: $126,000 **[record]** (not this role's pay)
- Latest funding in 80 Days CSV: Series C on 2022-07-26 **[record]**; Form D sample: not-in-sample (not a vote in the scorer)

### Databricks — Senior Data Scientist
- CSV row: `DATABRICKS INC` at `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:7249` **[record]**
- H-1B approvals (company-wide): 1640, approval rate 99.5% **[record]**
- Top sponsored titles: "Software Engineer", "Senior Software Engineer", "Solutions Architect", "Specialist Solutions Architect", "Senior Solutions Engineer" **[record]**
- Data titles among them: none → tier **Likely**, p = 0.6 **[your-input: my patterns + my calibration]**
- Liveness: ats:liveness said `active`; Greenhouse API status `200` **[record]** → gate factor 1 (playwright-active+greenhouse-200)
- Fit 0.35 **[your-input]** — senior level, California; stretch
- Role quality (NOT in the score — scorer weight 0.0): 15-2051.00 Data Scientists **[your-input mapping]**; national median $112,590 (OEWS 2024) **[record]**; cognitive-pivot score **missing in source row** **[record]**
- H-1B median salary offered, all roles at this company: $149,423 **[record]** (not this role's pay)
- Latest funding in 80 Days CSV: Series D+ on 2025-09-08 **[record]**; Form D sample: filed 31-DEC-2025, offering $5,000,000,000 (companies-sec-2025q4-d.sample.json); filed 31-DEC-2025, offering $23,017,200 (companies-sec-2025q4-d.sample.json) **[record]** (not a vote in the scorer)

### Toast — Staff Data Scientist
- CSV row: `TOAST INC` at `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:27011` **[record]**
- H-1B approvals (company-wide): 150, approval rate 97.4% **[record]**
- Top sponsored titles: "Senior Software Engineer", "Senior Credit Risk Analyst", "Staff Software Engineer/Team Lead Manager", "Senior Systems Architect, Salesforce Engineering", "Staff Software Engineer - Payments Extensibility, Tech Lead" **[record]**
- Data titles among them: none → tier **Likely**, p = 0.6 **[your-input: my patterns + my calibration]**
- Liveness: ats:liveness said `active`; Greenhouse API status `200` **[record]** → gate factor 1 (playwright-active+greenhouse-200)
- Fit 0.25 **[your-input]** — staff level is well above early-career
- Role quality (NOT in the score — scorer weight 0.0): 15-2051.00 Data Scientists **[your-input mapping]**; national median $112,590 (OEWS 2024) **[record]**; cognitive-pivot score **missing in source row** **[record]**
- H-1B median salary offered, all roles at this company: $177,341 **[record]** (not this role's pay)
- Latest funding in 80 Days CSV: Series B on 2015-12-23 **[record]**; Form D sample: not-in-sample (not a vote in the scorer)

### Klaviyo — Data Analyst (CONSTRUCTED: job id that does not exist)
- CSV row: `KLAVIYO INC` at `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:14495` **[record]**
- H-1B approvals (company-wide): 154, approval rate 97.5% **[record]**
- Top sponsored titles: "Business Intelligence Engineer", "Software Engineer II", "Engineering Manager Data Exchange", "Engineering Manager II- SMS", "Senior Software Engineer" **[record]**
- Data titles among them: "Business Intelligence Engineer" → tier **Proven**, p = 0.9 **[your-input: my patterns + my calibration]**
- Liveness: ats:liveness said `active`; Greenhouse API status `404` **[record]** → gate factor 0 (greenhouse-api-404 — the page check DISAGREED; the API 404 wins)
- Fit 0.8 **[your-input]** — CONSTRUCTED test of the liveness gate: a perfect-looking role that is not real
- Role quality (NOT in the score — scorer weight 0.0): 15-2051.01 Business Intelligence Analysts **[your-input mapping]**; national median $112,590 (OEWS 2024) **[record]**; cognitive-pivot score 3.903 **[record]**
- H-1B median salary offered, all roles at this company: $126,000 **[record]** (not this role's pay)
- Latest funding in 80 Days CSV: Series C on 2022-07-26 **[record]**; Form D sample: not-in-sample (not a vote in the scorer)

### DraftKings — Data Engineer
- CSV row: `DRAFTKINGS INC` at `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:7991` **[record]**
- Liveness: ats:liveness said `not checked`; Greenhouse API status `n/a` **[record]**
- Fit 0.7 **[your-input]** — Boston; no posting URL captured (not on a Greenhouse board the scan could read)
- Role quality (NOT in the score — scorer weight 0.0): 15-1243.01 Data Warehousing Specialists **[your-input mapping]**; national median $135,980 (OEWS 2024) **[record]**; cognitive-pivot score 3.626 **[record]**
- Latest funding in 80 Days CSV: Series D+ on 2024-12-03 **[record]**; Form D sample: not-in-sample (not a vote in the scorer)
- ⚠ **no-sponsorship-record** — DRAFTKINGS INC: Total Approvals blank at data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv:7991 — not evidence of refusal
- ⚠ **liveness-unchecked** — no posting URL supplied

### Absci — Data Scientist
- Liveness: ats:liveness said `not checked`; Greenhouse API status `n/a` **[record]**
- Fit 0.5 **[your-input]** — ML-for-biotech; Vancouver WA
- Role quality (NOT in the score — scorer weight 0.0): 15-2051.00 Data Scientists **[your-input mapping]**; national median $112,590 (OEWS 2024) **[record]**; cognitive-pivot score **missing in source row** **[record]**
- ⚠ **ambiguous-company-match** — 2 rows normalize to "ABSCI" (candidates: ABSCI CORP/WA; ABSCI LLC/WA)
- ⚠ **liveness-unchecked** — no posting URL supplied

### Northwind Analytics — Data Analyst
- Liveness: ats:liveness said `not checked`; Greenhouse API status `n/a` **[record]**
- Fit 0.6 **[your-input]** — CONSTRUCTED: a company that is not in the 80 Days CSV
- Role quality (NOT in the score — scorer weight 0.0): 15-2051.01 Business Intelligence Analysts **[your-input mapping]**; national median $112,590 (OEWS 2024) **[record]**; cognitive-pivot score 3.903 **[record]**
- ⚠ **no-company-match** — "Northwind Analytics" → "NORTHWIND ANALYTICS" has no row
- ⚠ **liveness-unchecked** — URL not present in the liveness log

## Gates — what you (the human) must judge before acting

1. **Visa timeline** — runway 194 days vs assumed hiring lag 60 days → factor 1. Both numbers are your-input. Confirm the OPT dates against your actual EAD card and I-20 before trusting this.
2. **Liveness** — open each Apply/Consider posting yourself. A Greenhouse 404 closes the gate; an "active" page check alone does not prove the job exists.
3. **Data-role sponsorship** — a "Proven" tier means a data title appears in the recorded top titles. It does not mean *this* role, *this* level, or *this year*. A "Likely" tier means the list is silent, not that the answer is no.
4. **Every Unresolved row** — resolve the named reason or drop the role; do not let it default to Skip or Apply.

## What this run cannot verify

- Whether the company will sponsor *this* opening now (the CSV is historical, company-level, top-titles-only).
- Whether the title→SOC mapping matches how the employer would file the LCA.
- Hiring lag at this company (one assumed number for all).
- Funding recency for most companies: Form D samples cover 50/13325, 50/14138, 50/14885, 50/15981 companies per quarter.
- Fit — it is a self-rating, not a model or recruiter judgment.

Scorer trace: `role-scores.md` in this folder (written by `scripts/score/role-scorer.mjs`). Agent log: `data-role-sponsor-match.log.json`.
