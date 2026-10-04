# Domain justification — opt-countdown

## Summary

This page explains who the recipe is for, which hidden fact it surfaces, and where it saves time in a job-search day. The person is an MS student on F-1 OPT with a 90-day unemployment limit. The hidden fact is whether a given employer can turn an application into a start date before that limit runs out, and whether it has actually sponsored H-1Bs before.

## Who, in exactly what situation

An international master's student in Information Systems or Data Science, on **post-completion OPT, year 1**, currently unemployed, targeting **data/BI analyst (SOC 15-2051.01), systems analyst (15-1211) or new-grad software engineer (15-1252)** roles in the Boston area, and needing H-1B sponsorship later. They have used about a third of their 90 unemployment days. The OPT end date is months away and feels safe. The unemployment clock is the limit that actually binds.

## The information asymmetry

From the outside this student cannot easily see three things:

1. **Which employers have actually sponsored H-1Bs**, and at what volume. Job posts rarely say, and a chatbot will answer confidently either way.
2. **Whether a posting is still real.** A dead job ID can redirect to a live careers page and look open. This recipe caught the engine's own liveness checker making that mistake.
3. **Whether the employer can hire before the clock runs out.** This is the one most students never compute. A strong sponsor with a 60-day process is worth nothing to someone with 53 days of runway. In the worked run, Klaviyo and Toast, both Proven sponsors, were gated to zero for exactly this reason.

## Engine layers

- **80 Days to Stay:** H-1B approvals, rates and sponsored titles from `mapped_student_employment_targets_v3.csv`. This is the sponsorship vote.
- **Job-Ops:** `ats:liveness` plus the Greenhouse API status. This is the liveness gate.
- **Cognitive Pivot:** BLS national median and pivot score, shown as context only, because the scorer gives role quality weight 0.

The new piece is turning the person's OPT dates into the **timeline gate** the scorer already expects but nothing computes.

## Where it fits the 3-3-2 day

It takes over the first half of the **2 research-and-apply hours**: deciding *which* postings deserve tailoring at all. Done by hand, each posting means a sponsor lookup (H-1B databases), opening the posting to see if it is live, guessing the employer's hiring speed, and counting days against the EAD. I estimate about 20 minutes per posting.

**Estimate, not measured:** at about 15 postings a week, that is about 5 hours of research. With the recipe, it becomes about 15 minutes of reading the report plus about 2 minutes per Apply or Consider row to sign off. That is roughly **4 hours saved per week**. The number is my assumption; I did not time it.

It also **feeds the networking 3 hours**. Every *Consider* and every *Skip, gated by timeline* row is an employer that sponsors but cannot be applied to profitably right now, which makes it a named networking target. The recipe and prototype themselves (tested, honest about limits) are a **credibility-hours** project.

## Failure modes specific to this domain

1. **Silence read as "no."** An employer with no row, or a blank H-1B record, looks like a non-sponsor. In this data, HubSpot (no row) and DraftKings (blank fields) are both large Boston employers. A naive tool would skip them and the student would never know. *Hardest to catch for:* a student new to the US market who doesn't know which names are big sponsors. The recipe blocks these rows instead of skipping them.
2. **A wrong clock input that looks certain.** If the student miscounts unemployment days (for example, forgetting that the clock starts at the EAD start date, not at the first application), every timeline gate shifts at once. The report still looks precise. *Hardest to catch for:* the student, because they believe they know their own count; a DSO would catch it. The report prints every clock input with its label so the error is at least visible.
