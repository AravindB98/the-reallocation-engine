# Domain Justification — SWE STEM-OPT Runway mode

## Executive summary

This page explains who the job-search mode is for, what it shows them that they otherwise could not see, and where it can go wrong. The person is an international student in Information Systems with three years of work permission ahead, applying for software engineering jobs. Before spending an evening on an application, they cannot easily tell two things. Has this company ever sponsored a work visa? Is this posting even real anymore? The mode answers both from records and refuses to guess when the records disagree. Its most dangerous error, seen on its first real run, is a company name that does not match the sponsorship file. It quietly turns a real sponsor into "not found", and the student is the person least likely to notice.

## Who

An F-1 student in a STEM-designated Information Systems program, about to start OPT, eligible for the 24-month STEM extension (about 3 years of work authorization). They target software engineering, backend, full-stack, DevOps, and test roles, and skip Data / ML-specialist roles. Because the runway is long, an employer does not need to file an H-1B in year one. Sponsorship history is a **bonus**, never a reason to drop a role. A fictional persona with this profile is used for every run; the postings are public, not the author's own applications.

**Exact situation:** a Sunday evening with five or six open postings from Boston and remote-US companies, and time to tailor maybe two applications this week.

## What information asymmetry it addresses

From the posting alone, this student cannot see:

1. **Whether the company has sponsored before.** Job boards don't say. A chatbot will answer fluently either way.
2. **Whether the posting is real.** A dead job link on Greenhouse often redirects to the company's job-search page. The page looks alive. The repository's own page checker reads it as "active". Only the board's own record shows that the job id is gone.

The mode answers (1) from the 30,000-company sponsorship file and (2) from the Greenhouse board record. It labels every value as a record or as the student's own input. It holds a posting back, unscored, when the two liveness signals disagree.

## Engine layers

- **80 Days to Stay:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (`Total Approvals`, `total_funding`) → the sponsorship vote.
- **Job-Ops:** the Greenhouse board provider (`scripts/ats/providers/greenhouse.mjs`) and the page checker behind `npm run ats:liveness` → the liveness **gate**.
- **Scorer:** `scripts/score/role-scorer.mjs`, reused unchanged.

## Failure modes specific to this domain

1. **Brand name ≠ legal name, and the student can't tell.** The posting says "Toast"; the file has "TOAST INC" (Boston, 150 H-1B approvals), very likely the same company. An exact match misses it. The company is scored as "not found" and skipped, in the same report and with the same confidence as a company that truly never sponsored. On the first real run this happened to one of the two companies in the list with a long sponsorship record. **Hardest to catch for:** the international student new to US companies. They do not know that "Toast" is a Boston payments company, and they trust a confident Skip. A US-born recruiter would see it at once. Even a careful hand-check can mislead: the file lists TOAST INC's website as `toast.com`, which today belongs to a different company.
2. **A dead posting that looks alive.** A job id that no longer exists redirects to the company's job-search page, which is full of "Apply" buttons, so a page check calls it active. The student tailors a résumé for a job that is gone. **Hardest to catch for:** anyone applying in volume, because the redirect happens silently and the address bar still looks like the company's careers site. The mode catches it only for Greenhouse postings, where a board record exists. Other ATSs are held, not guessed.
