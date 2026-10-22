# Domain Justification — SWE STEM-OPT Runway mode

## Executive summary

This mode is for an international student looking for a software job in the US. Before spending an evening on an application, they want to know two things the job post doesn't say. Has this company sponsored work visas before? Is this job still open? The mode answers both from records and asks the student when the records disagree. Its worst mistake: a company name that doesn't match the visa file, so a real sponsor shows up as "not found".

## Who

An F-1 student in a STEM Information Systems master's program, starting OPT with the STEM extension (about 3 years of work permission). Many worked in industry before the master's, so they target mid-level to Senior roles, not Staff or Lead. They apply for software, backend, full-stack, DevOps, and test jobs, and skip data-science and machine-learning roles. With 3 years ahead, a company doesn't need to sponsor a visa right away, so sponsorship is a **plus**, not a must.

**The exact moment:** a Sunday night, a handful of open postings from Boston and remote-US companies, and time to tailor maybe two applications this week. (Runs use a made-up persona and public postings.)

## What it lets the student see

From the posting alone, the student can't tell:

1. **Has this company sponsored before?** Job boards don't say; a chatbot answers confidently either way.
2. **Is the job real?** A closed job link often sends you to the company's job-search page, which looks alive. Even the repo's own page checker calls it "active".

The mode answers (1) from a file of 30,000 companies and their H-1B history, and (2) from the job board's own list of open jobs.

## Engine layers

- **80 Days to Stay:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` → has this company sponsored, or raised money?
- **Job-Ops:** `scripts/ats/providers/greenhouse.mjs` and the checker behind `npm run ats:liveness` → is the job still open? (a **gate**: closed means Skip)
- **Scorer:** `scripts/score/role-scorer.mjs`, used as is.

## Failure modes

1. **The brand name isn't the legal name.** The post says "Toast"; the visa file says "TOAST INC" (Boston, 150 H-1B approvals). An exact match misses it, so the mode says "not found" and skips five good jobs. **Hardest to catch for:** a student new to US companies, who doesn't know Toast is a Boston company and trusts the Skip. Even checking by hand can mislead: the file lists Toast's website as `toast.com`, which now belongs to another company.
2. **A closed job that looks open, or an open job that looks unsure.** A dead link that redirects to a search page looks alive, so the student tailors a résumé for a job that's gone. The opposite also happens: Datadog puts its application form inside an embedded frame, so every Datadog job looked "uncertain" although it was open. **Hardest to catch for:** anyone applying in volume, because both happen silently. The mode trusts the job board's list first, and holds a job for a person when it still can't tell.
