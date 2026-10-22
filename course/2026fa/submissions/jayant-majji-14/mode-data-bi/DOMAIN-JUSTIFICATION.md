# Domain justification — Data / BI Analyst triage for F-1 OPT students

## Executive summary
**What this is:** the case for why a student applying to data and business-intelligence analyst jobs on a student visa needs this check.
**Why read it:** the same job title can point to very different occupations, and the public data hides that difference unless you look at it closely.
**What it found:** in one real run, the data could support a decision for only three of six real postings; the other three had no usable employer or occupation evidence.

## Who, in exactly what situation
An international master's student (for example in Information Systems) on F-1 OPT, applying to Data Analyst, BI Analyst, and Data Scientist postings, who will need H-1B sponsorship and has a fixed OPT end date.

## The information asymmetry
1. **"Which occupation is this?"** BLS reports one wage and employment figure for SOC 15-2051, but O\*NET splits it into Data Scientists (15-2051.00), Business Intelligence Analysts (.01), and Clinical Data Managers (.02). Their thinking-demand profiles differ (pivot 3.903 for BI Analysts vs 3.738 for Clinical Data Managers), and **Data Scientists have no O\*NET scores at all.** A posting titled "Data Analyst" doesn't say which one it is.
2. **"Has this employer sponsored data work?"** The sponsorship data lists only each company's top sponsored titles, and it covers startups from SEC filings. Large employers (Amazon, McKinsey in this run) aren't in it, so "not found" means "no data," not "doesn't sponsor."
3. **"Is this posting open?"** The repo's liveness checker can be wrong on JavaScript-heavy career sites. In this run it called a live Pinterest posting expired.

## Engine layers
- **Cognitive Pivot:** O\*NET sub-occupation scores from the BLS occupation table.
- **80 Days to Stay:** approval counts and sponsored titles.
- **Job-Ops:** the liveness gate.
- **The existing scorer** combines sponsorship, fit, liveness, and timeline. Role quality has weight 0 there, so this mode reports it alongside the score instead of pretending it changed the decision.

## Failure modes specific to this domain
1. **Sub-occupation collapse.** Any tool that looks up O\*NET data by the 6-digit BLS code (15-2051) silently keeps whichever sub-occupation row it reads last. While building this mode, my own first lookup did exactly that: it reported "Clinical Data Managers" as the 15-2051 profile. A data-analyst student would then get a role-quality number for the wrong job, or a number for Data Scientists that doesn't exist. **Hardest to catch for:** a student who sees one confident number per code and has no reason to suspect there are three rows underneath.
2. **False "expired" on a live posting at a strong sponsor.** The liveness gate multiplies the score, so a wrong "expired" zeroes a role whatever its sponsorship. In this run, Pinterest (1,364 approvals) was gated to Skip while its posting was open. **Hardest to catch for:** a student batch-checking many postings who trusts "expired" and never opens the page.