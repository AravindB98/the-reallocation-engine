# Design-engineer SOC triage — 2026-10-20

## Executive summary

**What this is.** A check of 9 real job postings for someone who is both a software engineer and an interface designer, is on a student visa, and will need an employer to sponsor a work visa. For each posting it asks four things. Is this really a software-interface job, or does it only use the word "design"? Has this employer sponsored visas for *this kind* of job at *this* level? Is the posting still open? Can the candidate take the job before their post-graduation work permit's unemployment allowance runs out?

**What it found.** 2 of 9 postings were not interface-design or front-end work at all, and were dropped. 0 could not be judged from the records and need a person to check something first. Of the 7 that could be judged: 2 worth tailoring an application for, 2 worth a conversation first, and 3 to skip. Overall, 56% of the postings it could decide were dropped or skipped. 4 posting(s) belong to an occupation whose AI-resilience score is blank in the government data, so the report refuses to give one rather than borrowing a neighbouring occupation's number.

**What a person still has to decide.** Every classification, every employer match and every posting detail below must be confirmed by the candidate before acting. Nothing here applies to anything. Values an AI drafted are marked as model judgments until the candidate confirms them.

## Decisions and next actions

| Posting | Family (lane) | Outcome | Composite | Next action |
|---|---|---|---|---|
| Toast Inc — Software Engineer II, Frontend | ui-engineering (in) | **Consider** | 0.360 | NETWORK FIRST: the sponsorship record is soft — sponsors ui-engineering-matched titles, but only above this candidate's level. Ask about it in a 20-minute informational conversation, then decide. |
| Formlabs Inc — Industrial Designer | industrial-design (out) | **Skip (out of lane)** | — | DROP: physical-product industrial design, not software interface design. Not this mode's lane — no sponsorship lookup or scoring is spent on it. |
| Squarespace Inc — Software Engineer, Frontend | ui-engineering (in) | **Consider** | 0.360 | NETWORK FIRST: the sponsorship record is soft — sponsors ui-engineering-matched titles, but only above this candidate's level. Ask about it in a 20-minute informational conversation, then decide. |
| Palantir Technologies Inc — Product Designer, New Grad | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Product Designer, New Grad - US Government | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Product Designer - US Government | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Software Engineer - Frontend Developer Productivity | ui-engineering (in) | **Apply** | 0.465 | TAILOR: lead with the portfolio piece that shows shipped interface code, not only mockups; ask for a referral first. |
| Palantir Technologies Inc — Web Design Engineer | hybrid-design-engineering (in) | **Apply** | 0.495 | TAILOR: lead with the portfolio piece that shows shipped interface code, not only mockups; ask for a referral first. |
| Toast Inc — Territory Account Executive, Retail - Sioux Falls | unrelated (out) | **Skip (out of lane)** | — | DROP: no design or front-end term at a word boundary — a keyword-scanner false positive. Not this mode's lane — no sponsorship lookup or scoring is spent on it. |

## The SOC question: what the classification puts at stake

For each in-lane posting: the occupation codes it could be filed under for a visa petition, each code's national median wage (BLS OEWS) and its AI-resilience score (Cognitive Pivot: the mean of nine O*NET reasoning, judgment and systems ratings, on O*NET's 0–7 level scale). Which code the employer actually files is **not** in any shipped file.

| Posting | SOC risk | Candidate SOC → median wage · Cognitive Pivot | Wage gap across candidates |
|---|---|---|---|
| Toast Inc — Software Engineer II, Frontend | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Squarespace Inc — Software Engineer, Frontend | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Palantir Technologies Inc — Product Designer, New Grad | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Product Designer, New Grad - US Government | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Product Designer - US Government | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Software Engineer - Frontend Developer Productivity | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Palantir Technologies Inc — Web Design Engineer | computer occupations only | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |

## Evidence per posting

### Toast Inc — Software Engineer II, Frontend

- Location: Remote, US · URL: https://careers.toasttab.com/jobs?gh_jid=8224111
- Lane: **ui-engineering** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: TOAST INC, BOSTON, MA [record]
- Sponsorship: tier **Likely** [record] — sponsors ui-engineering-matched titles, but only above this candidate's level; approvals 150, denials 4 [record]; p = 0.6 [your-input]
  - Matched at level: none · matched above level: Senior Software Engineer; Staff Software Engineer/Team Lead Manager; Staff Software Engineer - Payments Extensibility, Tech Lead
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.5 [your-input] — React/TypeScript front-end work matches; posting asks 3+ years of professional front-end experience against 24 months of mixed experience
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days; flags: below-stated-minimum: posting asks 36 months ("3+ years of professional frontend web development experience."), candidate has 24 — a fit question, not a gate
- Scorer: Consider (machine: Consider) — above threshold (0.360) but one soft spot: sponsorship tier "Likely"; (0.6·0.35 + 0.5·0.3) × 1 × 1 = 0.360

### Formlabs Inc — Industrial Designer

- Location: Somerville, MA · URL: https://careers.formlabs.com/job/8249032/apply/?gh_jid=8249032
- Lane: **industrial-design** (out) [record] — physical-product industrial design, not software interface design

### Squarespace Inc — Software Engineer, Frontend

- Location: New York City (hybrid) — relocation · URL: http://www.squarespace.com/about/careers?gh_jid=8019365
- Lane: **ui-engineering** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: SQUARESPACE INC, New York, NY [record]
- Sponsorship: tier **Likely** [record] — sponsors ui-engineering-matched titles, but only above this candidate's level; approvals 94, denials 2 [record]; p = 0.6 [your-input]
  - Matched at level: none · matched above level: Senior Software Engineer; Senior Software Engineer 1
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.5 [your-input] — HTML/CSS/TypeScript/React interface work matches; posting asks 3+ years
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days; flags: below-stated-minimum: posting asks 36 months ("3+ years of software development experience"), candidate has 24 — a fit question, not a gate
- Scorer: Consider (machine: Consider) — above threshold (0.360) but one soft spot: sponsorship tier "Likely"; (0.6·0.35 + 0.5·0.3) × 1 × 1 = 0.360

### Palantir Technologies Inc — Product Designer, New Grad

- Location: New York, NY — relocation · URL: https://jobs.lever.co/palantir/4c0fb3a1-8256-4d14-9a27-23727235752e
- Lane: **ux-design** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: PALANTIR TECHNOLOGIES INC, Palo Alto, CA [record]
- Sponsorship: tier **Proven** [record] — at-level ux-design-matched title sponsored and approvals 462 ≥ 3; approvals 462, denials 4 [record]; p = 0.9 [your-input]
  - Matched at level: Product Designer (11525.2562) · matched above level: none
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.5 [your-input] — posting asks for a portfolio with at least one software interface design project; the persona has two public case studies
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days; **closed:** grad-window-excludes: posting accepts graduation 2027-01…2027-12 ("Must be planning on graduating in 2027."), program ends 2026-12
- Scorer: Skip (machine: Skip) — gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes); (0.9·0.35 + 0.5·0.3) × 1 × 0 = 0.000

### Palantir Technologies Inc — Product Designer, New Grad - US Government

- Location: Washington, D.C. — relocation · URL: https://jobs.lever.co/palantir/25378ba0-db78-4c70-8174-a05ce514fc65
- Lane: **ux-design** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: PALANTIR TECHNOLOGIES INC, Palo Alto, CA [record]
- Sponsorship: tier **Proven** [record] — at-level ux-design-matched title sponsored and approvals 462 ≥ 3; approvals 462, denials 4 [record]; p = 0.9 [your-input]
  - Matched at level: Product Designer (11525.2562) · matched above level: none
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.4 [your-input] — same portfolio requirement as the New Grad role; government-programme context
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days; **closed:** grad-window-excludes: posting accepts graduation 2027-01…2027-12 ("Must be planning on graduating in 2027."), program ends 2026-12; requires-clearance-or-citizenship: "Active US Security clearance or eligibility and willingness to obtain a US Security clearance." — not open to an F-1/OPT candidate who needs sponsorship
- Scorer: Skip (machine: Skip) — gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes); (0.9·0.35 + 0.4·0.3) × 1 × 0 = 0.000

### Palantir Technologies Inc — Product Designer - US Government

- Location: New York, NY — relocation · URL: https://jobs.lever.co/palantir/c2d11af1-5b84-4be0-92ac-36113fb8f2b5
- Lane: **ux-design** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: PALANTIR TECHNOLOGIES INC, Palo Alto, CA [record]
- Sponsorship: tier **Proven** [record] — at-level ux-design-matched title sponsored and approvals 462 ≥ 3; approvals 462, denials 4 [record]; p = 0.9 [your-input]
  - Matched at level: Product Designer (11525.2562) · matched above level: none
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.4 [your-input] — lists Figma/Framer prototyping and a software-interface portfolio
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days; **closed:** requires-clearance-or-citizenship: "Active US Security clearance or eligibility and willingness to obtain a US Security clearance." — not open to an F-1/OPT candidate who needs sponsorship
- Scorer: Skip (machine: Skip) — gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes); (0.9·0.35 + 0.4·0.3) × 1 × 0 = 0.000

### Palantir Technologies Inc — Software Engineer - Frontend Developer Productivity

- Location: New York, NY — relocation · URL: https://jobs.lever.co/palantir/71ed917e-850a-484b-9454-fa66bdf24540
- Lane: **ui-engineering** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: PALANTIR TECHNOLOGIES INC, Palo Alto, CA [record]
- Sponsorship: tier **Proven** [record] — at-level ui-engineering-matched title sponsored and approvals 462 ≥ 3; approvals 462, denials 4 [record]; p = 0.9 [your-input]
  - Matched at level: Software Engineer (11525.3365); Software Engineer (11525.2801.9); Software Engineer (11525.3338.7); Software Engineer (11525.2835) · matched above level: none
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.5 [your-input] — posting asks 2+ years of software engineering (met); the work is front-end tooling and build infrastructure, a narrower fit than product UI
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days
- Scorer: Apply (machine: Apply) — composite 0.465 ≥ 0.3, gates healthy; (0.9·0.35 + 0.5·0.3) × 1 × 1 = 0.465

### Palantir Technologies Inc — Web Design Engineer

- Location: New York, NY — relocation · URL: https://jobs.lever.co/palantir/a3eaa0ef-3378-495f-8308-edbd9a93d26c
- Lane: **hybrid-design-engineering** (in) [record] — fixed title rules (lib.mjs FAMILY_RULES)
- Employer record: PALANTIR TECHNOLOGIES INC, Palo Alto, CA [record]
- Sponsorship: tier **Proven** [record] — at-level hybrid-design-engineering-matched title sponsored and approvals 462 ≥ 3; approvals 462, denials 4 [record]; p = 0.9 [your-input]
  - Matched at level: Product Designer (11525.2562) · matched above level: none
- Liveness: active (factor 1) [record, checked 2026-10-19 15:48 local]
- Fit: 0.6 [your-input] — a hybrid role (front-end build plus visual/interaction design) that is the exact lane; asks 2 years of front-end design
- Eligibility + OPT clock: factor undefined [your-input] — expected start 2027-01-04, unemployment deadline 2027-03-21, slack 76 days
- Scorer: Apply (machine: Apply) — composite 0.495 ≥ 0.3, gates healthy; (0.9·0.35 + 0.6·0.3) × 1 × 1 = 0.495

### Toast Inc — Territory Account Executive, Retail - Sioux Falls

- Location: Sioux Falls, SD · URL: https://careers.toasttab.com/jobs?gh_jid=7930749
- Lane: **unrelated** (out) [record] — no design or front-end term at a word boundary — a keyword-scanner false positive

## What this run could not verify

- **Which SOC code an employer files a design role under.** The sponsorship file lists job titles, not occupation codes. Whether a "Product Designer" was filed as a computer occupation or an arts-and-design one needs the Labor Department's per-petition disclosure rows, which this repository does not ship.
- **An AI-resilience score for Web and Digital Interface Designers (15-1255.00).** The shipped O*NET row has no ability or skill ratings. The score is refused, not estimated.
- **Junior design sponsorship that fell off a truncated top-titles list.** A large sponsor can look senior-only, or show no design titles, simply because the list is short.
- **Current policy.** Approval counts are history. Only the posting text, read by a person, says what the employer will do now.
- **Whether a security-clearance requirement truly excludes this candidate,** whether the employer uses E-Verify (needed for the STEM OPT extension), and whether this job is "directly related" to the candidate's degree. Those are for the school's international student office, not for this tool.
- **Posting fields and fit.** A person typed or confirmed them; the tool only does the arithmetic.

## Gates waiting on a person

- [ ] G1: confirm every lane/family classification in the report (especially any family_override)
- [ ] G2: confirm each matched 80 Days entity is the employer that posted the job
- [ ] G6: record a named-human decision for every Apply / Consider row

## Run record

- Recipe: `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md` v0.1.0 · mode live · as of 2026-10-20 · generated 2026-10-21T23:47:57.491Z
- Inputs: scenario `scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.confirmed.json`; liveness `scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.liveness.confirmed.log` (ran 2026-10-19 15:48 local); CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows); BLS `data/bls/compact/soc_occupation_compact.csv` (1016 rows)
- Scorer: `scripts/score/role-scorer.mjs` — ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
- Missing-reason counts: none
- Model judgments used: 0 unconfirmed fit value(s), labeled model-judgment in the scorer input
