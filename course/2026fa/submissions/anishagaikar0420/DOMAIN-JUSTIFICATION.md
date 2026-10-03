# Domain justification — OPT-window countdown

## Executive summary

A graduating international student looking for analyst jobs wastes most of her application time on postings she could never take, because the two facts that rule them out — whether the start date fits her visa window, and whether the company sponsors — are invisible from the job ad. This tool makes both visible before she writes a single cover letter, and it is honest when it doesn't know.

## Who, in exactly what situation

An international master's student in **Information Systems / Business Analytics**, on an F-1 visa, **graduating May 2027**, not yet on OPT, searching in fall 2026 for **Business Intelligence Analyst** roles (SOC 15-2051.01) and the analyst titles beside them (15-1211 Computer Systems Analysts, 13-1111 Management Analysts). She will need H-1B sponsorship later. Her search starts about 244 days before her OPT does.

## The information asymmetry

From the outside she cannot easily see:

1. **Whether a posting's start date is one she can legally meet.** Most analyst postings live in the fall want someone *now*. She cannot start full-time before her OPT start date, and after it she has 90 days of allowed unemployment. A posting is only real *for her* if it starts inside that window. Job boards never say this; recruiters rarely volunteer it; she finds out after an interview.
2. **Whether the company has actually sponsored H-1Bs** — and the harder version, whether it sponsored *analysts*. Company career pages don't say. A chatbot will answer confidently either way.

The employer knows both facts. She doesn't. That gap is the asymmetry.

## Engine layers

- **80 Days to Stay** — H-1B approval/denial counts and sampled sponsored titles per company (sponsorship vote, G1 gate), plus funding as context.
- **Job-Ops** — `ats:liveness` output as the liveness gate.
- **Visa timeline** — the new part. The scorer already treats timeline as a gate, but nothing in the repo computes it; every example hand-types a number. This recipe computes it from dates.
- **The Cognitive Pivot** — BLS/O*NET row for the SOC, shown as context only because the scorer gives role quality zero weight.

## Where it fits the 3-3-2 day

It takes over the **research half of the two apply hours**: for each posting, looking up sponsorship history, checking the start date against the OPT window, and checking the posting is live. Done by hand that is roughly 15–20 minutes per posting.

**Estimate (not measured):** at ~20 postings a week, hand research is ~5–6 hours; with this tool it is ~1 hour (running it and clearing the blocked rows). So roughly **4–5 hours a week back**. This is an estimate from the steps involved, not a timed comparison.

It also **feeds the networking three**: a Proven sponsor whose posting starts too early is not thrown away — the report routes it to "network now for their next new-grad cycle". And the project itself is a candidate for the **credibility three**: a tested tool with an honest list of what it can't do.

## Domain-specific failure modes

1. **"Analytics" isn't "analyst."** Sponsorship tiers use keyword matches on five sampled titles. In v0.1.0, titles like *Senior Analytics Engineer* or *Data Scientist, Product Analytics* counted as analyst evidence, so an engineering-heavy sponsor looked like an analyst sponsor and the report said "Proven". v0.1.1 requires "analyst" or "BI" in the title, which fixed Figma and Sigma in the sample, but five sampled titles are still a thin record. **Hardest to catch for:** exactly this student — the titles look relevant to someone who isn't used to reading LCA job titles.
2. **The window moves under her.** The window depends on her OPT start date, which she chooses on the I-765 and which USCIS processing can push. If she runs the tool with a June 1 start but her card arrives July 10, every "soft" role may already be closed. **Hardest to catch for:** anyone who ran the tool once in October and kept trusting the October report in May. The fix is re-running with the real EAD dates — the tool can't know them.
