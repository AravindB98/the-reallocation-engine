# Domain Justification — Frontend / Full-Stack Sponsorship Triage

## User and situation

This recipe is designed for an international master's student approaching graduation and searching for full-time frontend and full-stack software engineering roles in the United States. The student has limited time for applications, networking, interview preparation, and coursework, while also needing to consider whether potential employers have evidence of past sponsorship activity.

A technically relevant job posting is therefore not automatically a high-value application target. Before spending significant time tailoring an application or contacting employees, the student benefits from knowing what sponsorship evidence is actually available and whether the posting is still active.

## Information asymmetry

Job postings usually describe responsibilities, qualifications, location, and compensation, but they may not clearly establish whether an employer has historically sponsored workers or whether sponsorship is available for the specific opening.

The repository helps reduce this asymmetry through separate evidence layers.

The first layer is historical sponsorship evidence from `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. The prototype retrieves stored approvals, denials, approval rate, median salary, and historically sponsored job titles when those fields are available.

The second layer is job-posting liveness using the repository's existing ATS/liveness tooling. A company can have useful historical sponsorship evidence while a particular posting is already inactive, so liveness remains a separate gate.

The existing role scorer provides another downstream decision-support layer, but this recipe does not invent a sponsorship probability from historical approval rate alone. Where the evidence required for a documented scoring component is unavailable, the value remains unknown.

## Fit with the 3-3-2 workflow

The Reallocation Engine's 3-3-2 workflow allocates job-search effort across networking, credibility-building, and research/tailored applications.

This recipe primarily improves the research/tailored-application portion. Before committing significant time to a target, the student can check whether historical sponsorship evidence exists and whether the posting is active. The result can also inform networking: if a company has relevant historical evidence but current-role sponsorship remains unclear, one of the networking actions can be used to contact an employee or recruiter for current information.

The recipe does not replace the 3-3-2 workflow. It helps determine where limited research and networking time may be worth spending.

## Estimated time savings

**Estimate:** manually researching sponsorship history, checking a company's current careers page, and deciding whether additional investigation is necessary could take approximately 10–20 minutes per company.

The prototype's local sponsorship lookup completes in seconds, and the existing liveness tool can test a supplied posting URL directly. For a batch of 10 potential companies, an early triage step could therefore avoid roughly 1–3 hours of low-value manual investigation when companies have missing evidence, cannot be confidently matched, or have inactive postings.

This is an estimated workflow benefit, not a measured performance result.

## Domain-specific failure modes

The first failure mode is **company-name mismatch**. A public company name may differ from the legal name stored in the dataset. The first prototype failed to match `A10 Networks` to `A10 NETWORKS INC`. Deterministic removal of common legal suffixes fixed this test case, but more complex entity-resolution cases remain unresolved.

The second is **missing-evidence misinterpretation**. Blank sponsorship fields must not be interpreted as proof that a company does not sponsor. The prototype explicitly returns `SPONSORSHIP_EVIDENCE_UNKNOWN`.

The third is **historical-to-current inference**. Past approvals do not establish that a company will sponsor a particular current role or candidate. Current job-description or employer information still requires human verification.

The fourth is **posting drift**. A role that is active during the sample run can later close or change. Liveness is therefore a point-in-time check rather than a permanent fact.

The final failure mode is **false precision**. The locally available approval rate is only one piece of sponsorship-related evidence. Converting it directly into a complete sponsorship probability would claim more than the available evidence supports. This recipe deliberately preserves that boundary and leaves the final application decision with the human.
