# Domain justification (A4) — PM sponsor title-match

## Executive summary

This page explains who this mode is for, what they can't see without it, and where it can mislead them. In short: an international master's student aiming for product-manager jobs can find out whether a company sponsors visas, but not whether it sponsors *product managers*. When they find out the hard way, they've already spent the hours.

## Who, exactly

An international MS in Information Systems student on F-1 STEM OPT, targeting Product Manager, Technical Product Manager and AI Product Manager roles. They want H-1B sponsors first. Their binding clock is the 150-day unemployment allowance, not the distant OPT end date.

## The information asymmetry

Sponsor lists answer "does this company sponsor?". This student needs "has it sponsored PMs, recently, in my job family?".
- **The approval data is thin.** In the 80 Days dataset, only 151 of 1,552 sponsors show a PM-family title, and 862 store a single title.
- **Per-filing data changes the picture.** The Department of Labor's FY2026 Q1–Q3 filings (Oct 2025 – Jun 2026; 437,496 applications, 10,936 of them H-1B PM-family) show that five of six large sponsors with no stored PM title did file for PM roles.
- **The confusions are invisible from outside.** A student can't see that "TPM" names two jobs, or that one employer files under two legal names (Stripe, Inc. / Stripe, LLC, same tax ID).

## Engine layers

- **80 Days to Stay:** approvals and stored titles.
- **Job-Ops:** ATS scan, plus a machine-readable liveness gate built on the repo's own checker.
- **Cognitive Pivot:** BLS wages, context only.
- **New:** a DOL labor-condition-application extract and employer index, checksum-pinned and contact-free.

All of it feeds the existing Ch.11 scorer, unchanged.

## Where it fits the 3-3-2 day

It does the per-posting sponsorship research inside the two research-and-apply hours, and turns uncertain sponsors into networking asks for the three networking hours. Time saved is an estimate, not measured: about 15–20 minutes of research per posting, against a few minutes to review a row.

## Failure modes, and who would struggle most to catch them

1. **A certified LCA is not an approval.** It's the employer's filing before the visa petition, and many are never used. A student who reads "filed" as "they'll sponsor me" over-trusts LCA-filed rows. *Hardest to catch for* someone skimming the decision column.
2. **PM has no SOC code.** Stripe's 19 PM-family filings span six SOC codes, from IT project managers to sales engineers. So any SOC-keyed wage misreads a PM role. *Hardest to catch for* a PM candidate who reads one BLS median as their market rate.
3. **The scorer grades the wrong clock.** It scores slack to the OPT end date, while the unemployment allowance is what binds. A 1-day margin and a 75-day margin score the same. *Hardest to catch for* the student closest to running out. This mode holds any role whose margin falls below the student's threshold.
4. **Name traps that look like evidence.** A brand that matches only an investment fund, or one tax ID filing under another trade name (1,249 such FEINs), produces a confident, sourced-looking answer that's wrong. *Hardest to catch for* anyone who trusts a `record` label without opening the row.
