# Domain justification — Information Systems student targeting Business Intelligence Analyst roles

## Executive summary

This page explains who the mode is for and why it exists. The person is an international master's student in Information Systems who wants a Business Intelligence Analyst job and will need a visa sponsor. The problem is missing information, not effort: the student cannot easily see which companies have sponsored, whether a posting is truly open, or whether a title matches the real level and kind of work. The mode makes those visible from stored data and tested scripts, and names the two ways it is most likely to mislead a newcomer.

## Who, and in what situation

An international master's student in Information Systems (F-1), graduating 15 May 2027 and not yet on OPT, searching in fall 2026 for **Business Intelligence Analyst** roles (SOC 15-2051.01) and neighbouring analyst titles. They can afford a limited number of tailored applications and are about to spend one on a *specific* company and posting. The mode needs a work-authorization end date and refuses to run without one; no real date exists yet, so the worked run uses an **assumed** OPT end of 2028-05-31 for day arithmetic only.

## The information asymmetry

The employer knows whether it sponsors, whether the requisition is real, and what a title means on its own ladder. The student sees a title and a paragraph, and cannot easily see:

1. **Sponsorship evidence for their kind of work.** Of 30,369 companies in the dataset, 1,557 have an approval count; 95 list a BI or analyst-type title among their top sponsored titles, and 58 have one that is not senior-flagged. No record is not a "no".
2. **Whether the posting is open.** The repository's own liveness check can be fooled, so the mode uses two signals.
3. **What the posting requires.** Titles mislead; quotes do not.

## Engine layers

- **80 Days to Stay:** the sponsorship CSV (gates G1–G4).
- **Job-Ops:** `ats:liveness` plus a second signal, a new seniority gate, and quote-grounding of posting facts (G6–G8).
- **Cognitive Pivot:** `skill-demand` with a new BI skills list. The BLS role-quality weight is 0.0 in the scorer, so it is not used.

## Failure modes specific to this domain

**1. The title hides the seniority.** *Shape:* no senior marker in the title over a senior body. *Real instance:* a live Boston posting titled **"Analytics Engineer"** whose body says *"We're looking for a Senior Analytics Engineer"* and requires *"5+ years of experience"*, at a company with 154 H-1B approvals. Every data gate passes; only reading the body, or the seniority gate quoting it, catches the trap. A second posting, "Data Scientist II", required 36 months of experience. *Hardest to catch for:* a student new to US job ladders, with no prior for what a missing "Senior" or an "II" implies and no recruiter to ask.

**2. A word match is not the job.** *Shape:* keyword filters pull in neighbouring work on both sides of the match. *Real instances:* that company's record matches BI only through "Business Intelligence *Engineer*"; and of 22 "analyst"-titled postings across six boards, 12 carry a senior marker and, by my reading of title words, 17 look like non-BI work (accounting, support, fraud, treasury, operations and similar) while only 2 look clearly like BI or data-analyst work. The counts are correct, so nothing looks wrong. *Hardest to catch for:* a student who reads "analyst" or "business intelligence" and assumes the work, and the sponsorship, transfer.

## Boundary

The mode reports what stored data, a live page and the posting's own words say. It cannot give a BI-specific salary: the BLS wage for SOC 15-2051.01 is the parent 15-2051 (data scientist) figure. It cannot say a company will sponsor *the student*, and it checks no immigration rules; those belong to the international-student office or an attorney.
