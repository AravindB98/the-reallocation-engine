# Design-engineer SOC triage — human card

**Audience:** an international master's student who is both a front-end engineer and an interface designer, will need H-1B sponsorship after OPT, and has to decide which postings get this week's application time.
**Agent twin:** `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md` (status DRAFT; live run 2026-10-19, re-run with author-confirmed inputs and all human gates cleared 2026-10-20)
**Engine layers:** Job-Ops (scan, board detection, liveness) · 80 Days to Stay (sponsorship by job family) · Cognitive Pivot (occupation wage and AI-resilience, shown beside the decision)

## Executive summary

You see "Product Designer" at a company that "sponsors H-1Bs". This card tells you what the mode can answer from real records, and what it can't:

- Whether the job is really software-interface work. Many "design" titles are chip, mechanical or graphic design.
- Whether the company sponsored *this kind* of job at *your* level.
- Whether the posting is open and accepts a December graduate.
- Which occupation codes the job could be filed under, and what that does to the wage floor.

It won't guess. If the government data has no AI-resilience score for an occupation, it says so instead of borrowing a neighbour's.

## Purpose

For one posting: **tailor, network first, skip, or check by hand?** Also, if an offer comes: **which occupation code should I ask the recruiter about?**

## What it can verify

- Which family a title belongs to, by fixed rules you can read: UX design, design engineering, front-end, or out of lane.
- That the employer is one specific row in the shipped sponsorship file. You confirm it's the right company.
- That row's recorded approvals and denials, and which of its top sponsored titles match the posting's family at or above your level.
- National median pay and the AI-resilience score for each candidate occupation code, as shipped.
- What the liveness checker printed for the posting, and when.
- The gate arithmetic: graduation window, clearance statement, and your 90-day unemployment allowance.

## What it cannot verify

- **Which occupation code the employer will actually file.** The sponsorship file lists titles, not codes. A product-design job filed as an arts-and-design occupation has a national median about $36,790 lower than one filed as a computer occupation, and nothing shipped tells you which side a company lands on. Ask the recruiter.
- **An AI-resilience score for Web and Digital Interface Designers.** The government row is blank. The mode refuses rather than estimate.
- **Junior design titles missing from a short top-titles list.** A big sponsor can look senior-only.
- **Today's policy.** Approvals are history. Read the posting's last paragraph.
- **Clearance, E-Verify and STEM-OPT "directly related" questions.** Take these to your international student office.
- **What you typed:** posting fields and your fit estimate.

## How to read a result

| You see | Do this |
|---|---|
| Apply | Tailor. Show shipped interface code, not only mockups. Ask for a referral first. |
| Consider | Have a 20-minute conversation about the named soft spot before tailoring. |
| Skip (gated) | Drop it. A closed graduation window, a clearance requirement, or the clock. |
| Skip (out of lane) | Drop it. It only said "design". |
| Not scored | Do the one hand check named, then re-run. |

## Before you act on any row

- [ ] Re-open every posting and confirm the fields the agent transcribed.
- [ ] Confirm or change each fit value. Until you do, it is labeled an AI judgment.
- [ ] Confirm each employer match and each job family.
- [ ] Record your decision per Apply/Consider row in the run log.
