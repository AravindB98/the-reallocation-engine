# Domain justification — sponsorship evidence triage

## Executive summary

This workflow helps an early-career Information Systems applicant decide which software, analytics, or design openings deserve further investigation. It separates company sponsorship history from the policy of an individual opening. A real-data sample produced a useful research queue while leaving current hiring and immigration eligibility unverified.

## User and decision

The user is a hypothetical applicant with Java and SQL skill-list evidence, considering backend, analytics, and design work and needing sponsorship clarification. The demonstration uses the repository's fictional Aarav Patel persona. It does not publish the student's résumé, work authorization, or real application history. The immediate decision is where to spend research and application-preparation time.

## Information asymmetry and engine layers

Company-level historical approvals do not reveal whether a particular junior opening sponsors. Missing records may mean incomplete coverage rather than a negative policy. Applicants comparing role families also cannot infer design-role sponsorship from senior software-engineering history. This mode connects **80 Days to Stay** company records with **Job-Ops** liveness classification, then separates policy, evidence gaps, and timing instead of converting them into an unsupported probability. Cognitive Pivot is deliberately outside scope: this run establishes neither AI resilience nor employer pay.

## Two domain-specific failure modes

**History leaks across roles and seniority.** A company with past approvals may exclude sponsorship for the actual graduate opening. Career changers and first-time international applicants may struggle to recognize that company-wide history does not answer a requisition-specific question. Explicit negative opening policy overrides history, and unknown policy remains an investigation task.

**Missing evidence becomes false exclusion.** Blank approval fields or a short, partially loaded recruiting page can be mistaken for “does not sponsor” or “closed.” Applicants unfamiliar with US employer naming and JavaScript recruiting sites are especially vulnerable. Blanks stay unknown, ambiguous identities block, and short-page classifications are treated as uncertain. An HTTP error page cannot pass merely because it contains an Apply button.

## Observed value and boundary

The maintained audit and independent recount found 30,369 source rows and 1,557 with at least one H-1B field populated. Nine fictional openings exercised distinct failure cases. The output preserves the reason for each next step; it does not validate original employer joins, actual vacancy status, candidate competence, or visa eligibility. Human review is still required.
