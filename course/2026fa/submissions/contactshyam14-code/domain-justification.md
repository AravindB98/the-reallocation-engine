# Domain justification — early-career PM & supply-chain SOC resolver

## Executive summary

This one-page note explains who the new mode is for, what they cannot see without it, which parts of the engine it uses, and the domain-specific mistakes it is built to catch. In short: early-career project-manager and supply-chain job postings never say which government occupation code they would be filed under, and that hidden code moves the wage floor by $20,000 or more. The mode lists the plausible codes, prices each one from public records, and refuses to give a single answer when they disagree.

## Who, and in what exact situation

An MS Engineering Management graduate (Northeastern) on F-1 post-completion OPT — 12 months, requested start 2026-12-31, **not yet approved**, EAD dates unknown, STEM extension unconfirmed (a DSO question). They apply only to project-manager and supply-chain roles that **require 0–2 years** — Associate Project Manager, Supply Chain Project/Program Manager, Supply Chain Analyst, Inventory/Supply Planner, Operations or Logistics Project Manager — in Seattle, Austin, San Francisco, San Jose and Dallas–Fort Worth. This continues my 25-point recipe, whose named limitation was "title-to-occupation matching is an inference". This mode is new work on that limitation, not a resubmission.

## The information asymmetry

A posting says "Supply Chain Project Manager". It does not say whether the employer would file it under 13-1082 Project Management Specialists (2024 national median $100,750), 13-1081 Logisticians ($80,880) or 11-3071.04 Supply Chain Managers ($102,010). The employer's HR team or immigration counsel knows. The applicant can't see it. The code sets the BLS wage floor nationally and in each metro, the O*NET role-quality inputs, and **which part of an employer's H-1B history is relevant**. A sponsor of 13-1082 roles has shown nothing about 43-5061. Generic PM and analyst roles also carry known specialty-occupation scrutiny, so a posting that doesn't require a bachelor's degree is a second thing the applicant should see before investing time.

## Engine layers

- **Job-Ops:** `npm run ats:liveness` is gate 1 (a gate, not a vote); `npm run ats:scan -- --dry-run` gives a second record for Greenhouse boards.
- **Cognitive Pivot:** BLS/O*NET per candidate SOC — national p10/p25/median/p75, the metro band from the existing `scripts/bls/local-wage-adjustment.py`, job zone, `cognitive_pivot_score`, and the existing `npm run score` scorer, all unmodified.
- **80 Days to Stay:** exact-name employer lookup for H-1B and Form D fields, with look-alike names rejected. Per-SOC history is reported as missing, because the file has no SOC column.

## Domain-specific failure modes, and who would struggle most to catch them

**(a) Logisticians instead of Project Management Specialists.** A "Supply Chain Project Manager" filed as 13-1081 lowers the national wage floor by about $20,000 ($100,750 → $80,880). The employer's 13-1082 sponsorship history then doesn't apply. *Hardest to catch for:* the applicant who reads "Project Manager" in the title and benchmarks against 13-1082.

**(b) The tech "Program Manager".** A "Program Manager" that is really an IT or systems role may be filed as 15-1299 (IT Project Managers sit under "Computer Occupations, All Other") or 11-3021. A reassuring 13-1082 sponsor list then says nothing about the code that will actually be filed. *Hardest to catch for:* the EM graduate whose résumé reads as program management and who doesn't see a computer-occupation code coming.

**(b2) The clerical "Planner".** Inventory, Supply and Material Planner titles can be filed under 43-5061 Production, Planning and Expediting Clerks: job zone 2, $57,770 national median. That cuts the wage floor and makes a specialty-occupation petition very hard. On the real RS Group Inventory Planner (Fort Worth), the plausible codes spread $23,110 nationally and one candidate (13-1023 Purchasing Agents) has no OEWS row at all. *Hardest to catch for:* the EM graduate who sees "supply chain strategy", "cost analytics" and a growth path to Supply Chain Manager in the description, and never suspects a clerical code.

**(b3) Look-alike employers.** In the 80 Days file, "Zipline" substring-matches ZIPLINE AI LTD (Union City) and ZIPLINE MEDICAL INC (Campbell), both different from Zipline the drone company. "RS Group" matches CRS GROUP INC, GAME CHANGERS GROUP and VILLAGE PARTNERS GROUP LLC. A loose match attaches someone else's funding or sponsorship. *Hardest to catch for:* anyone skimming a spreadsheet where the name "looks right".

**(c) Title inflation at ≤2 years.** An "Associate Project Manager" may be coordinator-level work with a weak specialty-occupation case. A "Supply Chain Manager" (11-3071) title often expects far more experience; the mode's break-test posting requiring 5+ years is stopped. *Hardest to catch for:* the early-career EM graduate who reads "Manager" in the title as a step up.
