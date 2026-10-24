# Domain justification: H-1B wage-level odds for a new-grad software engineer

## Executive summary

A one-page case for this mode. Since February 2026 the H-1B lottery rewards higher wage levels, and the levels change by city, but a new graduate comparing offers sees only salaries. The costly errors are the wrong city and the wrong job code.

## Who uses it, and when

An F-1 master's student graduating in December 2026, on OPT from January 2027, applying for entry-level software engineer roles (SOC 15-1252) in Boston, New York, the San Francisco Bay Area or Seattle. Their employer would register them in the March 2027 lottery, the second under wage weighting. They use the mode when choosing where to apply, choosing between offices on one posting, and deciding what base pay to ask for.

## The information asymmetry

Under 90 FR 60864 a registration is entered once at Level I and up to four times at Level IV, by the offered wage against the Labor Department's thresholds **for the job code and the area of employment**. The student sees a salary range. They do not see:

- **That thresholds differ by city.** Level I for software developers is $109,845 in New York but $152,797 in San Jose. At $140,000, Boston and New York give two entries, Seattle and San Francisco one, and San Jose is below Level I.
- **That wage areas follow counties.** Menlo Park is in the San Francisco area and neighbouring Palo Alto in the San Jose area: $15,704 apart at Level I.
- **That a posted minimum can sit below Level I.** Pinterest's 2027 new-grad range, posted for all US-based applicants, starts $8,071 below the San Francisco Level I wage.
- **How close the next level is.** A $140,000 offer in Seattle is $3,104 from Level II, which doubles its entries.

The thresholds are public, but they sit in a 449,440-row Labor Department file and a search form that asks for the job code, county and wage year. No posting links to them.

## Engine layers

**Cognitive Pivot:** the thresholds are built from BLS OEWS wages. **Job-Ops:** postings come from the job-board API, and liveness is a gate using the repo's `check-liveness.mjs`. **80 Days to Stay:** the company's sponsorship row is context, never a vote. The **visa timeline** is a gate: the offer must come before the March registration, and OPT must last through the petition filing window.

## Failure modes specific to this domain

1. **The wrong city.** Postings blur the worksite: "San Francisco Bay Area", "Remote, US", three cities with one range. Picking a city silently can turn one entry into two; the mode refuses regions and remote-only roles and shows each listed city separately. *Hardest to catch for a student applying to multi-city or "Bay Area" postings*, above all on the Peninsula, because the error only shows if you know wage areas follow county lines.
2. **The wrong job code.** The employer chooses the SOC code. An "ML Software Engineer" might be filed as a data scientist; a tester role under 15-1253, where San Francisco Level I is $80,579 instead of $137,093. *Hardest to catch for a student in a hybrid role* (ML, AI platform, data, test or security), who never sees the filing until after the lottery. The mode flags such titles and holds them at a human gate.
