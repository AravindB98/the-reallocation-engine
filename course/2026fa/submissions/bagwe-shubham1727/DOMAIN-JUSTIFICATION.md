# Domain justification — swe-opt-clock

## Executive summary

**What this is.** One page on who the recipe is for, what they can't see without it, and which part of their job-search day it takes over.

**Why read it.** It's the case that the recipe serves one specific student, not international job-seekers in general.

**What it concludes.** For an unemployed new-grad software engineer on OPT, the deadline that matters most isn't on the job posting. It's the number of unemployment days left, set against how long *this* company takes to hire. Hardly anyone checks it beside whether the company has sponsored *junior* software engineers before. The recipe shows both.

## Who, in exactly what situation

An international MS Computer Science graduate on **F-1 post-completion OPT, year 1**, **currently unemployed**, targeting **new-grad backend / full-stack Software Engineer roles (SOC 15-1252)** around Boston. They're STEM-eligible but haven't filed the extension, which needs an offer from an E-Verify employer, so the **90-day unemployment ceiling** binds. The demo persona has used 41 of 90 days: they must start by **2026-11-20**, seven months before the EAD ends. A STEM-OPT student with 150 days and years of runway would get little from this recipe.

## The information asymmetry

1. **Sponsored, but whom?** Sponsor lists don't say. In the 80 Days data, Lookout has 38 approvals, but every SWE title in its top sponsored titles is Staff or Senior. Cohere Health's include "Software Engineer II".
2. **Does the hiring speed fit the remaining days?** The student's count ("41 days used") goes stale while they research, and nobody sets it beside a company's interview cycle. Klaviyo is a Proven sponsor with a strong fit. *If* its cycle takes ~4 months (an assumption, not a record), the start lands ten weeks past the deadline.
3. **Is a missing record a "no"?** HubSpot has no row at all. CloudZero has a row with an empty sponsorship record. Neither is evidence of non-sponsorship.

## Engine layers

**80 Days to Stay** (H-1B approvals, sponsored titles, funding; Form D samples), **Job-Ops** (the engine's own `classifyLiveness`), **Cognitive Pivot** (the BLS 15-1252 row, report-only), and the **Ch.11 scorer**, unmodified, with liveness and timeline as gates.

## Where it fits the 3-3-2 day

It takes over the **research half of the 2 research-and-apply hours**: sponsorship lookup, reading titles for seniority, checking the posting, and the date math.

**Estimate (mine, not measured):** 20–30 minutes of manual research per job × 10–15 jobs a week ≈ **4–6 hours a week**. That becomes minutes of reading the report and signing the decision sheet. It assumes the role list and time-to-start guesses already exist, and producing those stays manual.

It **feeds the networking 3 hours**: every Consider, every dead posting at a strong sponsor, and every Unknown-sponsorship company becomes a "talk to an engineer there first" item. In the sample, 5 of 12 jobs went to networking and 2 to applying. It doesn't do the **credibility 3 hours**, though building it was this student's credibility project.

## Domain-specific failure modes

1. **The stale unemployment count.** The student types the count from their last DSO check-in. A tool that treats it as today's shows a deadline weeks too late. *Hardest to catch for:* whoever checks their count least often, since they're the one without a fresh number. Mitigation: the count must carry a date and is projected forward.
2. **Senior-only sponsorship read as "they sponsor SWEs".** The approval count is large and the tier looks strong. The seniority shows only in the title list. *Hardest to catch for:* a first-time new-grad searcher, who reads the count, not the titles. Mitigation: senior-only sponsors are capped at Likely, and the titles are printed.
