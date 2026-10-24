# Domain justification — the design-engineer lane on F-1 OPT

## Executive summary

For a December-2026 F-1 graduate who builds *and* designs interfaces. This person can't easily see three things: which "design" jobs are really software-interface work, whether employers sponsor design roles at a junior level, and which occupation code a design job would be filed under. That code moves the wage benchmark by tens of thousands of dollars.

## Who, in exactly what situation

An F-1 student finishing a STEM M.S. in December 2026, with post-completion OPT from January 2027 and its 90-day unemployment limit (8 CFR 214.2(f)(10)(ii)(E)). They have **24 months of software experience** and a **two-case-study portfolio**, and they apply in two lanes at once: front-end engineering (SOC 15-1254 / 15-1252) and product/UX design (15-1255), in Boston, remote US and some relocation cities. SWE tools treat "Product Designer" as noise; design boards ignore sponsorship.

## The information asymmetry (all counts from shipped data)

1. **"Design" is a false friend.** 65 of the 119 sponsored titles containing "design" aren't interface design: hardware engineers, management, graphic, architecture and industrial-design titles, plus some that name no discipline.
2. **Level.** 26 employers nationally list an at-level UX/product-design title with ≥3 approvals. **In Massachusetts: zero.** "Sponsors H-1B" hides a lane that barely exists at this level in Boston.
3. **The occupation code is invisible.** The prevailing-wage benchmark an H-1B employer must meet is set by occupation and area (20 CFR 655.731(a)(2)). A product-design job filed as 15-1255 ($98,090 national median) rather than 27-1024 Graphic Designers ($61,300) faces a very different benchmark. (These are *national* medians, the only wages the repository ships; the actual benchmark is set per metro area and wage level I–IV, which this mode cannot show until metro OEWS data is added.) Whether it reads as a specialty occupation (8 CFR 214.2(h)(4)(iii)(A)) can also differ. O*NET's own samples list "Front End Developer" under both 15-1254 and 15-1255. **No shipped file says which code an employer used.**
4. **The AI-resilience score is blank where it matters.** 15-1255.00 has no Cognitive Pivot score; the mode refuses to borrow the sibling Video Game Designers value (3.792).

## Engine layers

- **Job-Ops:** `ats:scan`, `detect-ats.py`, `ats:liveness` as a gate.
- **80 Days to Stay:** approvals plus family-matched titles.
- **Cognitive Pivot:** per-SOC wage and resilience, shown beside the decision (the scorer weights role quality 0).

## Failure modes specific to this domain

1. **The keyword false friend.** "Design Engineer", "Visual Designer", even "Sioux Falls" (the scanner matched "ux") get read as in-lane, and tailoring hours go to chip design or sales. *Hardest to catch for:* a student skimming a long list, where the title looks adjacent.
2. **"New Grad" read as "open to me".** Palantir has 462 approvals and lists a junior design title, yet both its "Product Designer, New Grad" postings require "graduating in 2027". *Hardest to catch for:* exactly this student. The sponsor is real, the label says new grad, and the exclusion is one line of the requirements. That's why posting-field confirmation is a hard gate (G5).
