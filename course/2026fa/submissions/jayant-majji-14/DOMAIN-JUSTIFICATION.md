# Domain justification — swe-h1b-15-1252

## Executive summary
**What:** why a sponsor-triage recipe for F-1 OPT Software Engineer job seekers is worth building.
**Why:** the student cannot easily see which employers have actually had H-1B approvals for software work, and a fluent AI answer hides that gap.
**Found:** the recipe replaces per-company sponsorship lookup with recorded evidence and routes sponsors without postings into networking.
**Did not do:** measure the time saved; the figure below is an estimate.

## Who, in exactly what situation
An international MS student on F-1 OPT, applying to Software Engineer roles (SOC 15-1252), with a fixed OPT end date and a long list of postings from job boards. They need an employer who will sponsor an H-1B later, and they have weeks to months, not years.

## The information asymmetry
From a job posting, the student cannot see:
- whether this employer has had H-1B approvals at all;
- whether those approvals were for software-titled roles or something else;
- whether the posting is still open.

Most postings say nothing about sponsorship. An AI chatbot will still answer "yes, they sponsor" fluently, with no record behind it. The recipe answers from the shipped approval counts and says plainly when there is no record, rather than turning silence into "no."

## Engine layers
- **80 Days to Stay:** approval counts, approval rate, and sponsored job titles from `mapped_student_employment_targets_v3.csv`.
- **Job-Ops:** the liveness gate, from a recorded `npm run ats:liveness` result.
- **The existing scorer** combines these; the recipe does not re-implement it.

## Where it fits the 3-3-2 day
It takes over the **sponsorship-research part of the 2 research-and-apply hours**. It does not replace tailoring.

*Estimate, not measured:* looking up one company's sponsorship history by hand (searching H-1B databases, matching the legal name, reading job titles) takes roughly 10–15 minutes. At about 15 companies a week, that is roughly 2.5–4 hours. With the prototype, the lookup is seconds; the remaining cost is about 1 minute per posting for the liveness check plus a few minutes of human review per scored role. **Estimated saving: about 2–3 hours per week.**

It also feeds the **3 networking hours**: companies with sponsorship evidence but no live posting become a network-target list, worth an informational interview before a role opens.

## Domain-specific failure modes
1. **Brand-name miss.** A posting says "6sense"; the CSV's legal name is "6SENSE INSIGHTS INC". The company is held as "not found" even though it has 62 approvals. *Hardest to catch for:* a student new to the US who doesn't know employers' legal names and reads "not found" as "doesn't sponsor."
2. **Title-proxy false "Proven."** A company with many approvals for non-software roles and one title containing "software" clears the Proven bar. The student sees "Proven" and assumes software sponsorship is routine there. *Hardest to catch for:* anyone who trusts the tier label and never opens `top_job_titles_sponsored`. The CSV has no SOC column, so the tool cannot detect this itself.