# Domain justification: pre-OPT backend sponsor tiers

## Executive summary

This recipe is for an international master's student who is about to graduate and needs a backend software job with a company that will sponsor a work visa. It matters because the student cannot see, from job boards, whether a company has sponsored this kind of role, how much evidence stands behind that, or that most companies simply have no record. The recipe makes that one hidden signal visible and stops where only a person can judge.

## Who uses this, in exactly what situation

An F-1 student in a STEM-designated master's program, graduating in the spring, whose post-completion work authorization has not started. They will need an employer to sponsor an H-1B later, they target backend or platform software roles (occupation code 15-1252), and they apply while still enrolled. The repository persona (`search/examples/kiran-rao/profile.yml`) is fictional, with invented dates. A student on year-two STEM OPT would not need the "clock has not started" logic; a student targeting biotech would not use the title rule.

## The asymmetry it addresses

From the outside a student cannot easily see four things: whether a company's sponsorship history is for this kind of role; how much evidence stands behind it (2 approvals or 1,640); that 94.9 percent of the 30,369 companies in the table have no sponsorship record at all, which is silence, not a no; and how old the table is (its newest funding date is a year before the run). The recipe uses the sponsorship layer (80 Days to Stay), funding as a filter and a spot check (SEC Form D), role quality as a displayed wage ratio (BLS), and the visa-timeline gate. Liveness stays a human gate.

## Where it fits the 3-3-2 day

It takes over the research half of the two-hour research-and-apply block: which companies have a sponsorship record for backend roles, and how strong it is. It feeds the networking hours, because its "Consider" and held lists are the companies worth a conversation before applying.

**Time saved (an assumption-based estimate, written by the assistant; the author should replace it with a timed figure):** checking one company manually at an assumed 10 to 15 minutes, for about 15 companies a week, is roughly 2.5 to 3.75 hours. After the recipe, at an assumed 5 minutes on the two human checks for each of the top 5 companies, it is about 25 minutes. The saving is about 2 to 3 hours a week. (The sample run advances 59 companies, so the limit is a person's time, not the list.)

## Failure modes specific to this domain

1. **A proven sponsor whose posting is closed to the student.** The record is company-wide; the exclusion is in the posting (U.S.-person or export-control wording, "no sponsorship", a start date before authorization begins). The error looks like a strong tier beside a posting the student cannot take. A first-time international job seeker would find it hardest to catch, because "authorized to work in the U.S." reads as harmless boilerplate. Gate H2 is a person's job for this reason.
2. **A fresh-looking shortlist on an old snapshot.** "Recently funded" is measured against a table a year old, and its funding column missed a raise inside its own time span for 3 of 15 spot-checked companies. The error is a list that looks current and is not; a student cannot see a file's age. Gate G0 refuses to run without saying so.
