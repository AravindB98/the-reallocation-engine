# Domain justification — ms-is-swe-opt-shortlist

## Summary

This recipe is for one kind of person: an international master's student in Information Systems, graduating December 2026, on F-1 OPT, applying for entry-level software engineer jobs. It takes the short list of companies they are considering and tells them, with every input labeled, which ones the repository's records support applying to, which to skip, and which to approach through people instead. It matters because the facts that decide a search are invisible from outside, and a chatbot will guess at them confidently.

## Who uses it, in exactly what situation

An MS Information Systems student (F-1, graduating December 2026) who needs an H-1B sponsor for an entry-level Software Developer role (SOC 15-1252) and has a limited unemployment allowance after OPT begins. They have a list of roughly 10–30 companies from job boards and referrals, and about two hours a day for research and applications.

## The information asymmetry

From outside, this student cannot see (1) whether a company has sponsored **software** roles, and how often, and (2) whether their own OPT clock leaves room for a slow hiring process. The 80 Days data makes the first visible as a count and a list of top sponsored titles. The countdown makes the second a number. What the student still cannot see, and the recipe says so, is whether the sponsored titles were **entry-level**.

## Engine layers

- **80 Days to Stay:** approvals, approval rate, top sponsored titles, latest funding date and stage (one CSV).
- **The Cognitive Pivot:** national median wage and cognitive pivot score for SOC 15-1252, shown for context only (the scorer's `role_quality` weight is 0).
- **Job-Ops:** posting liveness, run by hand with `npm run ats:liveness` and typed in; not automated.

## Where it fits the 3-3-2 day

It takes over the first half of the **2 research-and-apply hours**: looking up whether each company has a sponsorship record and working out whether the timeline fits. By hand, I estimate that is 15–25 minutes per company; the program does the lookup and arithmetic in seconds. *This is an estimate, not a measurement; no manual search was timed.* For 15 companies that is plausibly 4–6 hours saved over a search, realized mostly in the first week rather than every week. It feeds the **networking 3**: every strong sponsor with no usable posting is output as a "network, don't apply" target. It does not touch the credibility 3, except that the project itself is one.

## Domain-specific failure modes

1. **Senior hires read as entry-level.** A sponsored-titles list containing "Software Engineer" can describe a staff-level hire. The tier "Proven" then looks like a green light for a new graduate. The student least able to catch this is the one with no industry experience, who does not yet know that titles are not levels. The report labels the "non-senior title" test an inference.
2. **A stale snapshot reads as live funding.** The data ends 2025-09-26. A company funded in 2025 can look "recent" under a 24-month rule while having stopped hiring. This is hardest to catch for someone new to the US startup market, who has no sense of how fast hiring freezes follow a funding round. The report prints the data's age in days.
