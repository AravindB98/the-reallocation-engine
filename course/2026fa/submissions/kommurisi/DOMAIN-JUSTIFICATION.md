# Domain justification — data-role-sponsor-match

## Who uses it, in exactly what situation

An F-1 student in a STEM-designated MS Information Systems / analytics program, in the last semester before post-completion OPT. They apply to early-career **data engineering, analytics engineering and BI** roles (O*NET 15-1243.01, 15-2051.01, 15-2051.00) and will need an employer that files an H-1B for that role. They are not looking at "tech jobs" in general. Their competition for sponsorship is the employer's own preference for software-engineering hires.

## The information asymmetry

A student can easily find out that a company sponsors. Every H-1B lookup site shows a big approval number. What they can't easily see is **whether the company sponsors data roles**. Two real rows from the 80 Days CSV show the gap:

| Company | H-1B approvals (record) | Recorded top sponsored titles (record) |
|---|---|---|
| Databricks | 1,640 (99.5% approved) | Software Engineer, Senior Software Engineer, Solutions Architect, Specialist Solutions Architect, Senior Solutions Engineer |
| Klaviyo | 154 (97.5% approved) | **Business Intelligence Engineer**, Software Engineer II, Engineering Manager Data Exchange, … |

By the count, Databricks looks ten times safer. For a BI or analytics-engineering applicant, Klaviyo is the one with a data title on record. The recruiter knows which roles get sponsored. The student only sees the count.

## How it connects to the engine

- **80 Days to Stay.** It reads the sponsorship columns, including the title list that the Ch.11 example roles never use, along with funding fields and the Form D samples.
- **Job-Ops.** `ats:scan` finds the postings. `ats:liveness` plus a Greenhouse API check feed the liveness **gate**.
- **Visa timeline.** The OPT runway feeds the timeline **gate**.
- **Ch.11 scorer.** It receives a `roles.json` and is run as-is.
- **Cognitive Pivot.** The OEWS median and pivot score are shown beside the decision. Because the scorer gives `role_quality` a weight of 0.0 (Fact 1), they are not added into the score.

## Where it fits the 3-3-2 day

It takes over the **sponsor-research part of the 2 apply hours**: for each posting, looking up the employer's H-1B history, reading the titles, checking whether the posting is real, and deciding whether it is worth tailoring.

**Estimate, not measured:** done by hand, that takes about 10–15 minutes a posting. At about 15 postings a week, that's roughly 2.5–3.5 hours. With the recipe it's about 1–2 minutes a posting to read the report and clear the gates, so the saving is **around 2–3 hours a week**. I have not timed either version. A student should time one manual week before believing this number.

It also **feeds the networking 3**. A "Consider" result means the company sponsors but has no data title on record, and the next action is to find a person on the data team and ask, which is the networking block's job. Writing the recipe and prototype with honest limits is itself a **credibility-3** project.

## Domain-specific failure modes

1. **The big-sponsor illusion.** A company with a four-digit approval count gets treated as safe for data roles when every recorded title is software. The student most at risk is the one chasing a famous name, who will not open the title list. The recipe uses titles for the tier, and "Likely" demotes an Apply to Consider. Even so, the title list is only the top few titles, so a real data sponsor can be hidden behind more numerous SWE filings. That's a false negative nobody would notice from the report alone.
2. **The redirect ghost.** A dead Greenhouse job id redirects to the company's careers search page. That page has Apply buttons, so both the repo's liveness check and a student clicking the link see something that looks alive. A student under time pressure is the least likely to notice that the page shows a *list* of jobs rather than *the* job. The recipe trusts the Greenhouse API's 404 over the page, but that only works for Greenhouse. Lever, Ashby and Workday postings still rely on the page check.
