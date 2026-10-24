# Domain justification — finance data-engineering triage for a STEM-OPT graduate (v0.2.0)

> Drafted with an AI assistant and reviewed by Arc-211 on 2026-10-19. The person is the
> **fictional persona Ananya Rao** (`search/examples/ananya-rao/profile.yml`). Numbers come from
> saved runs in `runs/`.

## Executive summary

This mode is for an international Information Systems master's student hunting for a data or BI
job at a bank or fintech company that will sponsor a work visa. Big banks often record data jobs
as "software developer", so searches for data titles miss them. And "three years of work
permission" really means two or three tries at the visa lottery. The mode makes both visible.

## Who, exactly

An F-1 student in M.S. Management Information Systems (CIP 52.1201, STEM).
- Program ends 2026-12-11. OPT is not filed; expected start 2027-01-25.
- STEM OPT runs to 2030-01-24, but only with an **E-Verify** employer.
- Targets data-engineer and BI roles at banks and fintech, anywhere in the US, remote preferred.

A generic tech job seeker needs none of these: the E-Verify gate, the finance filter, the
data-versus-software code problem, or the March lottery deadline.

## The information asymmetry

1. **Banks sponsor data roles under other names.** 34 finance companies in the data have H-1B
   history. A data-title search keeps 12. **7 more** list only software titles, including
   **BNY Mellon (704 approvals)**, whose record says "Full-Stack Developer". After a live data
   posting was found, the mode moved BNY from *research* to *tailor an application*.
2. **The lottery clock is invisible.** Up to a 150-day hiring process, all 3 registration windows
   (March 2027–2029) are reachable. At 180 days the offer lands in April 2027: one window is lost
   and every recommendation disappears (`runs/07-hiring-lag-sweep.txt`).
3. **E-Verify depends on the name searched.** BNY's legal-name account was terminated in May 2026;
   two large "BNY Mellon" accounts are open.

## Engine layers used

- **80 Days to Stay:** H-1B counts, sponsored titles, wages, funding.
- **Job-Ops:** `ats:liveness` for the posting gate.
- **Cognitive Pivot:** BLS medians for six target codes, as context only.

## Failure modes specific to this domain

1. **Occupation-code mismatch.**
   - **The shape:** a data-title filter reads "software-only sponsor" as "no data roles" and drops
     it, as v0.1.0 did to BNY. The reverse error exists too: Lendbuzz has 58 openings and no data
     role. That is why these companies go to *research*, never straight to *apply*.
   - **Who catches it least:** a first-year Information Systems student, who reads job titles,
     not the codes on LCA filings.
2. **Lottery-timing blindness.**
   - **The shape:** the clock is tracked only in unemployment days, so an April offer looks fine
     ("82 of 90 days used") while the first lottery has already passed.
   - **Who catches it least:** a student who heard "STEM OPT = 3 years" and plans to apply
     seriously only after graduating. That is the group most likely to get an April offer.
