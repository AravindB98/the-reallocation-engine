# Domain justification — backend-pivot-range

## Executive summary

A new-grad backend engineer is told to aim for work AI can't easily replace. The government data for that question files the same job under different occupations depending on spelling, and most of its score gaps are smaller than its own measurement error. This mode shows both, on real postings, before tailoring hours are spent.

## Who, in exactly what situation

The user is the fictional repo persona **Aarav Patel** (`search/examples/aarav-patel/`: F-1 on STEM OPT, Boston, targeting backend and platform roles). As DATA_CONTRACT requires, the profile is fictional. Aarav is an F-1 student on STEM OPT with a fixed post-graduation work window. He targets **new-grad backend software roles in Boston** (O*NET **15-1252.00 Software Developers**) and keep seeing adjacent openings: data engineer, platform/SRE, SDET/QA, full stack. Tailoring for the wrong *kind* of role costs them hours they don't have. (This mode doesn't model the visa clock itself; pair it with a timeline mode.) The Cognitive Pivot thesis says to favor work needing verification and system judgment, and they have no way to check which postings that is.

## The information asymmetry

From a posting, this student can't see:

1. **Which official occupation the job title belongs to, and that the answer depends on spelling.** In O*NET 30.2:
   - "Software Engineer, Backend" and "Backend Software Engineer" are **not** O*NET titles. They reach *Software Developers* (pivot **3.834**, rated 08/2025) only after the tool drops the qualifier and finds the plain O*NET title "Software Engineer".
   - "**Back End Software Engineer**" and "Back End Developer" are alternate titles of ***Web Developers*** (**3.584**, rated **07/2017**).
   - "Data Engineer" is an alternate or reported title of **four** occupations (Database Administrators, Database Architects, Statisticians, Data Scientists), and Data Scientists has no score at all.
   - "Site Reliability Engineer" spans **3.834 to 4.516**.
2. **Whether a score gap is real.** Each O*NET rating comes from about 8 analysts and carries a published standard error. Against Software Developers, Database Administrators (+0.124), Database Architects (+0.099) and Data Warehousing Specialists (−0.208) are all **statistically indistinguishable** at 95%. "Pick data engineering because it scores higher" is not supported by the data.
3. **How old the comparison is.** Web Developers were rated in July 2017, eight years before Software Developers' August 2025 update and before AI coding assistants were in common use. Comparing them compares two eras.
4. **Whether this posting's duties are judgment work**, as opposed to its occupation's average. The mode doesn't find this out reliably either, and it reports that.

## Engine layers

**Cognitive Pivot** (main): BLS/O*NET role quality. The mode recomputes `cognitive_pivot_score` from O*NET's nine ratings and adds O*NET's own standard errors and rating dates, which the repo's compact table drops. **Job-Ops**: the posting liveness **gate**, using the repo's `npm run ats:liveness` on every shortlisted posting. A posting that isn't confirmed open never gets a "prioritize."

## Domain-specific failure modes

1. **The hybrid title filed under the wrong occupation.** A "Back End Software Engineer" posting is scored as Web Development (lower, z −2.31 under independent errors, though not distinguishable if the errors are correlated), while the identical job titled "Software Engineer, Backend" is scored as Software Development through the plain title "Software Engineer". Formlabs' "R&D Reliability/Test Engineer" (hardware testing) lands in *Software QA*. **Hardest to catch for:** a new international graduate who has never seen the SOC/O*NET taxonomy and reads one number as a fact about the job. (Employers also name an occupation code on H-1B filings, where it sets the prevailing wage.)
2. **Reading noise as signal.** A difference of 0.1–0.2 on O*NET's 0–7 Level scale looks decisive in a table but is inside the error bars, and the error bars themselves assume independent ratings. If the nine ratings' errors move together (the worst case), **no** occupation here is distinguishable from Software Developers: Web Developers goes from z −2.31 to −0.81. **Hardest to catch for:** a student under time pressure who wants a ranking and sorts by the score column. The report refuses to rank occupations it can't tell apart.
