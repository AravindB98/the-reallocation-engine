# Domain justification — finance data-engineering triage for a STEM-OPT graduate (v0.2.0)

> Drafted with an AI assistant from this session's runs and reviewed by Arc-211 on 2026-10-19.
> The person described is the **fictional persona Ananya Rao**
> (`search/examples/ananya-rao/profile.yml`), not a real student. Every number below comes from
> a saved run file in `runs/`.

## Executive summary

This mode is for an international master's student in Information Systems who will finish in
December and wants a data-engineering or business-intelligence job at a bank or fintech company.
They have about three years of work permission, and they need an employer who will sponsor them
for the long-term work visa. Two things are hard to see from where they stand. First, big banks
often record data jobs as "software developer", so searching the public records for data titles
misses some of the biggest sponsors. Second, "three years" really means two or three tries at
the visa lottery, and a slow offer silently costs one. The mode makes both visible.

## Who, exactly

An F-1 master's student in **Management Information Systems** (CIP 52.1201, on the STEM list).
The program ends **2026-12-11**. OPT is **not filed**, with an expected start of
**2027-01-25**. That gives 12 months of OPT plus a 24-month STEM extension, ending
**2030-01-24**, but only with an **E-Verify** employer. The targets are data engineer and BI
analyst roles at banks and fintech companies, the kind of employer JPMorgan represents. Any US
location works, remote is preferred, and the salary floor is $85,000.

A generic "international student in tech" would not need the E-Verify gate, the finance filter,
the data-versus-software code problem, or the March lottery deadline. This student needs all four.

## The information asymmetry

1. **Which banks sponsor data roles under a different name.** H-1B records list titles and
   occupation codes chosen by the employer's attorney. In the repository's data, 34 finance
   companies have H-1B history. A data-title search keeps 12. **7 more** list only software
   titles, and one of them is **BNY Mellon with 704 approvals**. The student sees a "Data
   Engineer" job ad and searches for that title, but BNY's record says "Full-Stack Developer".
   In the live run, BNY had a current data-management engineering posting (ETL, Spark,
   Snowflake, Power BI), and the mode moved it from *research* to *tailor an application*.
2. **How many lottery tries are actually left.** The sweep in `runs/07-hiring-lag-sweep.txt`
   shows it directly:
   - **A hiring process of up to 150 days:** all **3** registration windows (March 2027, 2028,
     2029) are still reachable.
   - **180 days, plausible at a large bank:** the offer lands in April 2027. The first window is
     lost (**2 of 3**), the timeline factor falls to 0.089, and every recommendation disappears.

   Nothing on a job board shows this.
3. **Whether the employer is in E-Verify, under which name.** BNY's account under its legal name
   was terminated in May 2026. Two large accounts are open under "BNY Mellon". A student who
   searches only the legal name would conclude, wrongly, that the STEM extension is impossible
   there.

## Engine layers used

- **80 Days to Stay:** H-1B approvals, rate, top sponsored titles, median wage, latest funding,
  and Form D samples.
- **Job-Ops:** `ats:liveness` as the evidence for the posting gate.
- **Cognitive Pivot:** BLS national medians for six target codes, including 15-1252 Software
  Developers and 15-1211 Computer Systems Analysts. These are context only, because the scorer's
  role-quality weight is 0.

## Failure modes specific to this domain

1. **Occupation-code mismatch.**
   - **The shape:** a data-title filter reads "software-only sponsor" as "doesn't sponsor data
     roles", and drops the company. Version 0.1.0 did exactly this to BNY Mellon.
   - **The reverse error:** the mode now keeps these companies, but a software-heavy sponsor may
     truly never hire data engineers. Lendbuzz has 58 openings and no data role. That is why
     these companies go to *research*, never straight to *apply*.
   - **Who catches it least:** a first-year Information Systems student, who reads job titles,
     not the occupation codes on an LCA filing.
2. **Lottery-timing blindness.**
   - **The shape:** the visa clock is tracked only in unemployment days, so an April offer looks
     "fine, 82 of 90 days used". Meanwhile the first March lottery has already passed, and the
     student has one fewer try at a long-term visa.
   - **Who catches it least:** a student who has heard "STEM OPT = 3 years" and plans to start
     applying seriously after graduation. That is the group most likely to get an April offer.
