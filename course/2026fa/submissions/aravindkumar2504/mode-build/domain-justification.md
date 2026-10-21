# Domain justification: pre-OPT backend sponsor tiers (mode build)

## Executive summary

This mode is for an international master's student who will need a visa sponsor, has not started post-study work authorization, and wants a backend software job. This page says what that student cannot see, which parts of the engine fill each gap, and the two mistakes this situation makes easy. The live run found the gap wider than the data suggests: most shortlisted companies could not be checked live, and nothing checked start dates.

## Who uses this, in exactly what situation

An F-1 student in a STEM master's program, graduating in the spring, whose OPT has not started. They will need an H-1B sponsor later, target backend and platform roles (SOC 15-1252), and apply while still enrolled, at perhaps fifteen applications a week (an assumption). The question each week is where to spend those fifteen.

## The information asymmetry

From outside, the student cannot easily see:

1. **Who has sponsored this kind of role, and on how much evidence.** Only 1,557 of the table's 30,369 companies (5.1 percent) have any sponsorship record, and silence is not a no. A Proven sponsor has at least ten approvals at 90 percent or better.
2. **Whether a sponsor has a live U.S. backend posting today.** A job board was found for only 26 of 59 shortlisted companies, under the names tried; the other 33 are invisible to the check. Of the 8 postings checked, 7 were live; Xage Security's page returned 404 although its board still listed it.
3. **Whether the posting itself shuts them out.** That is in the posting text, not the company record.

## Engine layers

- **80 Days to Stay:** sponsorship history and funding, for the tiers and the discovery pool.
- **Job-Ops:** ATS detection through the scanner's providers, the portal scan, and the liveness gate.
- **Cognitive Pivot, thinly:** the role family is SOC 15-1252, and the report shows the offered wage against the BLS national median. The scorer's role-quality weight is 0, so this layer informs the reader but decides nothing.

## Failure modes specific to this domain

1. **A Proven sponsor whose posting quietly excludes the student.**
   - **The shape of the error:** the company record says "sponsors"; one sentence in one posting says otherwise. The live run's Databricks posting says the employer "may decline to proceed with an applicant on this basis alone" when export-controlled work is involved.
   - **Who misses it:** a first-time F-1 applicant: it reads as legal boilerplate, yet export-control rules can apply to F-1 students.
   - **What the mode does:** the screen quotes such sentences; a person decides. Here the author judged the clause a condition, not a no, and the report keeps the quote.
2. **An open posting for a student who cannot start yet.**
   - **The shape of the error:** unless it says otherwise, a posting read in October may want someone within weeks. A pre-OPT student often cannot start full-time work until OPT begins; for this run's candidate that is 2027-06-01, about seven months later.
   - **Why the mode looks clean:** its timeline gate reads "open" because the unemployment clock has not started, which is not the same as an employer willing to wait. None of the 8 postings stated a start date.
   - **Who misses it:** the student most likely to read "open" as "apply now", someone applying in their first fall with no recruiter to ask.
   - **What the mode does:** the report now warns about it, and the recipe proposes a start-date rule; nothing checks it yet.
