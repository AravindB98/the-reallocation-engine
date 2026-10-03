# Domain justification: is-funded-sponsor-triage

## Executive summary

This recipe is for an international Information Systems master's student who prefers funded companies but needs H-1B sponsorship and hasn't chosen a role type. The hidden fact it surfaces is that "funded" and "sponsors" barely overlap, and that the four analyst-type roles are not equally sponsorable. It takes over the research part of the daily two research-and-apply hours, and it turns "no record" companies into networking targets instead of silent rejects.

## Who, in exactly what situation

An F-1 student in an STEM-designated Information Systems master's program (CIP 14.0903), about **8 months before graduation** (May 2027), planning post-completion OPT with its **90-day unemployment limit**. The student prefers **venture-funded companies** and is **undecided between Business Analyst, Data Analyst, Product Analyst, and IT Consultant**. A data-science PhD or an MBA would not recognize this workflow as theirs: the role families, the funded-company preference, and the pre-graduation timing are specific.

## The information asymmetry

From outside, this student cannot easily see:

1. **Which funded companies have ever sponsored.** In the shipped data (record), 27,874 companies have a funding date. Only **1,532** have any H-1B approval, and only **131** of those raised money in the 24 months before 2026-10-02. Startup job boards show funding prominently and sponsorship history not at all.
2. **Which role families those sponsors sponsor.** Among funded sponsors' top sponsored titles (record): Data Analyst 38, Business Analyst 31, IT Consultant 21, **Product Analyst 4**. An undecided student would otherwise pick a family by interest alone.
3. **That a blank is not a no.** 28,812 rows have blank approvals and only 5 have an explicit 0. Tools that show "0 H-1B filings" for an unmatched name hide this.

## Engine layers it connects to

- **80 Days to Stay** (primary): `mapped_student_employment_targets_v3.csv` for funding and H-1B history; Form D samples.
- **Job-Ops**: the liveness gate (`npm run ats:liveness`), run by a human.
- **The existing scorer** (`scripts/score/role-scorer.mjs`): Apply / Consider / Skip with an audit trace. Not re-implemented.

## Where it fits the 3-3-2 day

- **Takes over:** the *research* half of the **2** apply hours, i.e. checking, for each posting, whether the company sponsors, whether it sponsored this kind of role, and how recently it raised money. Only Apply rows reach the tailoring half.
- **Feeds the networking 3:** every `no-h1b-record` / `no-company-row` company becomes a networking target with a concrete question ("do you hire OPT grads / sponsor for analysts?") instead of being skipped.
- **Feeds the credibility 3:** the recipe and prototype are themselves a judgment-showing project.
- **Time saved (estimate, `your-input`, not measured):** checking one company by hand across an H-1B lookup site and a funding database takes me roughly 10–15 minutes. At about 15 companies a week that is roughly 2.5–4 hours. With the prototype the lookups take seconds and review takes about 30–45 minutes, so the saving is **roughly 2–3 hours per week**. I have not timed this; it is an estimate.

## Failure modes specific to this domain

1. **A blank read as "doesn't sponsor".** The shape of the error is a confident Skip on exactly the young funded startups this student prefers, because a 2025 startup has not had time to file. *Hardest to catch for:* the student. A Skip looks like an answer, and nothing on screen says the row was simply unmatched. The prototype routes blanks to the networking list instead.
2. **"Funded" mistaken for "startup".** Form D is also filed by funds and big partnerships. The CSV lists DELOITTE CONSULTING LLP as "Series C" with 8,810 approvals, and the scorer recommends Apply. The IT Consultant family is dominated by such firms. *Hardest to catch for:* a student new to the US market who does not know which names are large consultancies or staffing firms. A related signal: SITE TECHNOLOGIES INC is listed as incorporated in 2023 with 148 approvals, a pattern more typical of an IT staffing firm than of a startup. The prototype shows stage, date, and counts side by side and leaves this judgment to the human.
