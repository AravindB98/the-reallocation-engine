# Domain justification — newgrad-swe-bigsponsor

## Executive summary

This recipe is for an international student who graduates in December and wants a new-grad software job at a
company that sponsors H-1B visas. It makes two hidden facts visible: whether a "big sponsor" actually sponsors
*entry-level* software engineers, and whether a job's start date lands before the student's OPT unemployment
limit. It takes over the per-posting research part of the two daily application hours, and turns its rejects
into networking targets.

## Who, in exactly what situation

An F-1 master's student on a STEM-designated degree (e.g. at Northeastern), **program end in December**,
requested OPT start in January, **not yet on OPT**, targeting **new-grad Software Developer roles (SOC 15-1252)**
at companies with **≥ 100 H-1B approvals**. They need a sponsor eventually, since the H-1B is the path after OPT
and STEM OPT. They need a *job start* sooner: post-completion OPT allows 90 days of unemployment. For a January
OPT start that ends in **April**, while most big-company new-grad cohorts start June–August around May graduates.

## The information asymmetry

From the outside, this student can see an approval count ("LinkedIn: 4,962 H-1Bs") and a job title. They
**can't easily see**:

1. **Which *levels* the company sponsors.** In the shipped CSV, LinkedIn's top sponsored titles are mostly
   `Sr` / `Staff Software Engineer`. Uber's are Senior, Staff and `Software Engineer II`. Deloitte Consulting's
   8,810 approvals list no software title at all. Only some sponsors (Pinterest: `Software Engineer I`) show an
   explicit entry-level title. Approval volume and new-grad sponsorship are different facts.
2. **That the calendar, not the company, kills the application.** A perfect July-start offer at a proven
   sponsor is out of status for a December graduate who started OPT in January. Generic advice is written for
   May graduates and doesn't mention it.
3. **That the dataset itself has a hole.** The 80 Days CSV is built from SEC Form D filers
   (`data/80-days-to-stay/README.md`). Google, Amazon, NVIDIA, Oracle, IBM, Cisco and Adobe have no row. A student
   filtering "sponsors in the data" silently drops the biggest ones.

## Engine layers

- **80 Days to Stay** (primary): `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`.
- **Visa timeline** (gate): OPT start + unemployment limit vs. start date.
- **Job-Ops** (gate): liveness, entered from `npm run ats:liveness`.
- **Cognitive Pivot** (context only): the BLS 15-1252 national median, shown beside company medians but outside the
  score, because `role_quality` carries weight 0.0 in the scorer.
- **Scorer**: `scripts/score/role-scorer.mjs`, unmodified.

## Where it fits in the 3-3-2 day

It takes over the **research half of the 2 hours**: for each posting, looking up whether and at what level the
company sponsors, checking the start date against the OPT window, and deciding whether the posting deserves
tailoring. It doesn't write applications.

**Estimated time saved (an estimate, not measured).** By hand, per posting: look up the company's H-1B history
and titles, about 10 min; work out whether the start date fits the window, about 3 min; check the posting is
live, about 2 min. That's roughly **15 min**. With the recipe, reading one report row and its title evidence
takes about **2–3 min**. At about 15 postings a week that is roughly **3 hours a week** back. That time goes into
tailoring the one or two Apply roles properly.

**It feeds the networking 3 hours directly.** "Consider" becomes *network first*, and "Skip because of the start
date, at a strong sponsor" becomes *network, don't apply*: ask an engineer there about an earlier or off-cycle
start. The prototype itself (tests, honest limits, a documented break attempt) is the kind of project the
**credibility 3** asks for.

## Failure modes specific to this domain

1. **A title that looks entry-level but isn't, or the reverse.** "Software Engineer II" is the new-grad level at
   some companies and mid-level at others. Staffing firms use `JAVA ENGINEER 2`, which the v0.1 rule calls
   non-software. *Who finds it hardest to catch:* the student this is built for. A new grad doesn't know each
   company's level ladder, and the report's tier looks authoritative. Mitigation: the raw title list is printed
   beside every tier.
2. **"Not in the dataset" read as "doesn't sponsor."** A student or agent treats the CSV as complete and drops
   Google or Amazon, or worse, fuzzy-matches "Meta" to the unrelated `META CO`. *Who finds it hardest to catch:*
   anyone who never read how the CSV was built. The output looks clean either way. Mitigation: exact-key matching
   only, and "no-company-match" is reported as Unknown with the dataset's inclusion rule written out.
