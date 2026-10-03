# Domain justification — swe-opt-clock

## Executive summary

**What this is.** One page on who this recipe is for, what they can't see without it, and which part of their job-search day it takes over.

**Why read it.** It's the case that the recipe is built for one specific student, not for "international job-seekers" in general.

**What it concludes.** For an unemployed new-grad software engineer on OPT, the deadline that matters most is invisible from a job posting: how many unemployment days are left, set against how long *this* company takes to hire. The recipe makes that visible, together with whether the company has ever sponsored *junior* software engineers.

## Who, in exactly what situation

An international MS Computer Science graduate on **F-1 post-completion OPT, year 1**, who is **currently unemployed** (for example, between a short contract and a full-time role) and targeting **new-grad backend / full-stack Software Engineer roles (SOC 15-1252)** in the Boston area. They're STEM-eligible but haven't filed the extension, because filing needs an offer from an E-Verify employer. So the **90-day unemployment ceiling** binds. The demo persona has used 41 of 90 days. The hard start-by date is **2026-11-20**, while the EAD end is seven months later (2027-06-14). A STEM-OPT student with 150 days and three years of runway would get little from this recipe. That is the specificity test.

## The information asymmetry

From the outside, this student can't easily see:

1. **Whether a sponsor has sponsored people like them.** "Sponsors H-1B" lists don't say for whom. In the 80 Days data, Lookout has 38 approvals, but every sponsored SWE title is Staff or Senior. Cohere Health's list includes a "Software Engineer II". A new grad reads the first as a safe bet. The record says it is weaker evidence.
2. **Whether the company's hiring speed fits their remaining days.** The number they track ("41 days used") goes stale while they research, and nobody puts it next to a company's interview cycle. Klaviyo is a Proven sponsor with a strong fit, and still impossible: a ~4-month cycle lands on 2027-01-30, ten weeks past the deadline.
3. **Whether a missing record means "no".** HubSpot isn't in the dataset at all. CloudZero is in it with an empty sponsorship record. Neither is a "no", and a chatbot will confidently answer as if it were.

## Engine layers it connects to

**80 Days to Stay** (H-1B approvals, sponsored titles, funding dates; Form D samples), **Job-Ops** (the engine's own `classifyLiveness`), **Cognitive Pivot** (the BLS row for 15-1252, used report-only), and the **Ch.11 scorer**, run unmodified. Liveness and timeline enter it as gates.

## Where it fits the 3-3-2 day

It takes over the **research half of the 2 research-and-apply hours**: looking up each company's sponsorship history, reading the sponsored titles for seniority, checking the posting, and doing the date math against the unemployment clock.

**Estimate (mine, not measured):** about 20–30 minutes of manual research per job, across 10–15 jobs a week, comes to roughly **4–6 hours a week**. The run replaces that with a few minutes of reading the report and signing the decision sheet. The estimate assumes the role list and time-to-start guesses already exist, and producing those is still manual.

It also **feeds the networking 3 hours**. Every Consider, every dead posting at a Proven sponsor, and every Unknown-sponsorship company comes out as a named "talk to an engineer there first" item, not a cold application. In the sample run, 5 of 12 jobs were routed to networking and 2 to applying.

## Domain-specific failure modes

1. **The stale unemployment count.** The student enters the count from their last DSO check-in. If a tool treats that number as today's, the deadline shows up weeks too late, and they apply to roles they can't start in time. *Hardest to catch for:* the student who checks their count least often, and a fresh count is exactly what they don't have. The recipe requires the count's date and projects it forward.
2. **Senior-only sponsorship read as "they sponsor SWEs".** The approval count is large and the tier looks Proven. The seniority is only visible in the title list, which nobody reads. *Hardest to catch for:* new grads in their first search, who don't yet know that LCA approvals cluster at senior levels. The recipe caps senior-only sponsors at Likely and prints the titles.
