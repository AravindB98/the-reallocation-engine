# Domain justification: pre-OPT backend sponsor tiers

*Written by the assistant (Claude Code) for the author; see `SOURCES.md`. Only the 5-minute figure in the time estimate is the author's own guess; the other numbers are the assistant's assumption or measurement, as the estimate says.*

## Executive summary

This recipe is for an international master's student who is about to graduate and needs a backend software job with a company that will sponsor a work visa. The student cannot see, from job boards, whether a company has sponsored this kind of role, how much evidence stands behind that, or that most companies simply have no record. The recipe makes that hidden signal visible and stops where only a person can judge.

## Who uses this, in exactly what situation

An F-1 student in a STEM-designated master's program, graduating in the spring, whose post-completion work authorization has not started. They will need an employer to sponsor an H-1B later, they target backend or platform software roles (occupation code 15-1252), and they apply while still enrolled. The repository persona (`search/examples/kiran-rao/profile.yml`) is fictional, with invented dates. A student already on STEM OPT, or aiming at biotech, would not use it.

## The asymmetry it addresses

From the outside a student cannot easily see four things: whether a company's sponsorship history is for this kind of role; how much evidence stands behind it (2 approvals or 1,640); that 94.9 percent of the 30,369 companies in the table have no sponsorship record at all, which is silence, not a no; and how old the table is (its newest funding date is a year before the run). The recipe connects to four of the engine's five evidence layers: sponsorship history (the 80 Days to Stay table), company funding (SEC Form D, a filter and a spot check), role quality (BLS, shown as a wage ratio, not scored) and visa timeline (a gate). Posting liveness stays a human gate.

## Where it fits the 3-3-2 day

It takes over the research half of the two-hour research-and-apply block: which companies have a sponsorship record for backend roles, and how strong it is. Its "Consider" and held lists feed the networking hours, because they are the companies worth a conversation before applying.

**Time saved (an estimate, not a measurement):** the author guesses one company takes about 5 minutes to check by hand (visa history, funding, titles); it was not timed. At about 15 companies a week (an assumption) that is about 75 minutes. The program does the same lookups for all 76 companies in about a third of a second (measured). The two human checks (is the posting live; does it hide an eligibility trap) cost the same either way, so they are not counted. The saving is at most about 75 minutes a week, less the time to read the shortlist.

## Failure modes specific to this domain

1. **A proven sponsor whose posting is closed to the student.** The record is company-wide; the exclusion is in the posting (U.S.-person wording, "no sponsorship", an early start date). A first-time international job seeker would find it hardest to catch, because "authorized to work in the U.S." reads as boilerplate. Gate H2 is a person's job.
2. **A fresh-looking shortlist on an old snapshot.** Any raise after the table's newest funding date is invisible, and its funding column is incomplete even before that date: a Form D spot check found one round it missed (1 of 14 companies) and 5 of the 14 with no funding at all. A student cannot see a file's age, so would find this hardest to catch. Gate G0 refuses to run on old data unless told to accept it, and the report states the age.
