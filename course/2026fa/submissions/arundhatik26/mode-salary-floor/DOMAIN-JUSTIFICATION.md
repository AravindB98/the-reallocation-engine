# Domain justification — salary floor for a software co-op that may convert

## Executive summary

Who the salary-floor mode is for, what they cannot see without it, which parts of the engine it uses, and its two likeliest mistakes. In short: an international student turning a software co-op into a full-time offer must name a number with little evidence, and the employers they want most are often the ones the data says nothing about.

## Who, and in what situation

An F-1 master's student in a STEM program (here, MS Information Systems), on a software or full-stack co-op under CPT, graduating in Dec 2027 or Apr 2028. Near the end of the co-op, the team asks about a return offer and "what are your salary expectations?" The offer will start on OPT and, to stay, will need H-1B, so the student cannot easily walk away. The first number they say is costly to get wrong.

## The information asymmetry

The employer knows its pay bands, the job code it will file, and what it paid the last ten sponsored hires. The student usually knows a few anecdotes. Three things they cannot easily see:

1. **A defensible floor.** The national BLS band for Software Developers runs from $79,850 (10th percentile) to $211,450 (90th); the 25th percentile is $103,050.
2. **That the job code moves the floor.** O*NET lists "Back End Developer" and "Front End Engineer" under **Web Developers (15-1254)**, whose 25th percentile is $63,140, about **$40,000 lower**. A full-stack offer could be filed under either code.
3. **That their target employers are silent.** Goldman Sachs, Morgan Stanley, JPMorgan Chase, State Street, BlackRock and MSCI have no 80 Days row at all; Fidelity's and even Google's rows are blank. The dataset was built to surface funded startups, so it cannot see the giants a finance-minded student targets first. A student who searches and finds nothing may read that as "they don't sponsor", when it really means "this source can't tell you".

## Engine layers

- **The Cognitive Pivot (BLS/O*NET):** national OEWS percentiles from the committed May 2024 file; the O*NET title-to-code relationship behind the code-risk flag.
- **80 Days to Stay:** each employer's sponsorship row and its `median_salary_offered`, matched by exact name only.
- **Job-Ops:** the liveness check is a gate when the comparison is against a live posting.

## Failure modes specific to this domain

1. **The all-roles median read as a software salary.** 80 Days gives one median per employer across *every* sponsored role. Toast's $177,341 includes senior and staff engineers and credit-risk analysts; Thermo Fisher's includes product directors. A student sees "$177K at Toast" and anchors a new-grad ask far too high. **Hardest to catch for:** the student new to US pay norms, who has no second number to compare against. The mode labels the figure "all sponsored roles" and treats it as context, never as the floor.
2. **The wrong job code silently lowers the floor.** If the employer files the offer as 15-1254, the prevailing wage it must meet is lower, and the student never sees the code unless they read the LCA. **Hardest to catch for:** full-stack and front-end students, whose titles sit on the boundary, and anyone who never sees their own LCA. The mode flags the title and makes the code a human gate (G2).

Out of scope: the floor is national. Boston pays more and the repo's Boston wage data is missing, so this floor is conservative.
