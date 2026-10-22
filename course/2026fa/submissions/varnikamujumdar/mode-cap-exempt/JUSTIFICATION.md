# Domain justification — cap-exempt employer triage

## Executive summary

Some employers can hire an international graduate on an H-1B **without the lottery**: universities, their affiliated nonprofits, and nonprofit research institutes. A student who just lost the lottery cannot tell from a posting which employers those are, and the engine's own company dataset cannot see them either.

This mode checks the visa clock and whether each posting is live. It looks employers up in the federal college list and in government H-1B counts. It flags names that only *sound* exempt, and it never calls an employer cap-exempt.

## Who uses it, and when

An international master's graduate on OPT whose H-1B registration was **not selected**. In the sample, a fictional ML engineer's OPT ends on 2027-01-31, about 100 days away. She needs a path that doesn't depend on another lottery draw. She has a few research-engineering postings at universities and institutes, and one question for each: *worth applying to, and what do I ask?*

## The information asymmetry

1. **Category is invisible on the posting.** Exemption depends on what the employer *is* (8 CFR 214.2(h)(8)(iii)(F)), and postings almost never say. University HR knows; the student often doesn't know to ask.
2. **The engine's sponsorship data covers the wrong population.** 80 Days is built from SEC Form D filings, which only companies raising private capital file. Of its 30,369 rows, 31 have university-, hospital- or foundation-sounding names, but **none is a real institution**, and **0 of the 3,771** open public and nonprofit universities in the federal college list appear in it at all. Its visa-approval fields are 95% blank, which means unknown. The government's own FY2023 data, which this mode adds, shows the employers are there: Northeastern had 24 initial and 13 continuing H-1B approvals, Fred Hutch 20 and 24.
3. **Names mislead in one direction.** Of those 31 names, 26 raised startup money and 13 are LLCs or LPs, for example `CHAPMAN UNIVERSITY ENTERPRISES INC` and hospital LLCs. "Toyota Research Institute" is a company. "University of Phoenix-Arizona" is in the federal college list as for-profit, which fails the higher-education definition exemption relies on.

## Engine layers

- **80 Days, inverted.** A Form D match is evidence *against* a nonprofit claim, and the audit measures what the layer can't see.
- **Job-Ops.** `ats:liveness` is a hard gate; unchecked or uncertain rows are held.
- **Visa timeline** is a hard gate, because cap-gap doesn't cover cap-exempt petitions.
- **BLS** gives wage context. The **Cognitive Pivot** score is not used: the mode ranks nothing, so it only shows the occupation's national median wage.
- **New federal records:** IPEDS and the USCIS H-1B Employer Data Hub.

## Failure modes specific to this domain

**1. The name-shaped false positive.** A for-profit that sounds like a university or institute gets treated as exempt. The student invests weeks, then hears "we'd have to enter you in next year's lottery".
- Hardest to catch for someone who has **never seen an I-129**, or when a lab manager says "we're part of the university" but a spin-off is the real employer.
- The mode catches it from a Form D record, an LLC/LP suffix, an IPEDS for-profit record, or a name-only claim. It **misses** a for-profit research company with none of these (break B1) until the IRS nonprofit list is added.

**2. Tools tuned for startups.** The liveness checker was built for Greenhouse, Lever and Ashby. Universities and hospitals use Workday and iCIMS. It called a live Fred Hutch posting "expired", because the job loads in a frame.
- Hardest to catch for a student screening dozens of postings in a hurry, who trusts "expired" and never re-opens the page.
- The mode holds that case for a human look instead of skipping it.
