# Domain justification — healthins-ai-opt v0.2.0

## Executive summary

One specific job seeker needs this mode: an international master's student about to start OPT who wants applied-AI engineering work at insurance and health companies. From outside they cannot see which open roles the public visa records can speak to, which a new graduate could hold, or which hiring loops fit their clock. On 20 October 2026 the mode turned 1,729 open jobs at 32 companies into 9 live candidates and said plainly that it could not see 10 of the companies.

## Who, in exactly what situation

An international MS student graduating December 2026, OPT starting January 2027, with a 90-day unemployment ceiling, aiming at applied-AI / LLM engineering (SOC 15-1252) at insurers, insurtechs and health-tech firms. Applications sent before the work permit starts cost no unemployment days, so October to December is the cheap window.

## The information asymmetry

What this student cannot see from outside, and what the run showed:

1. **Which companies the sponsorship evidence can speak to.** 10 of 32 boards, among them Oscar Health with 247 openings, have no identifiable row in a dataset built from private funding filings; four have only a similarly named row with a different website (Abridge, Headway, Clover, Sword).
2. **Which roles a new graduate can hold.** At identifiable companies, 96 of 114 software-type listings (105 distinct titles) are senior, staff, principal, lead or manager.
3. **What a posting says that its listing does not.** Of 1,729 posting texts, 17 say "unable to sponsor", 2 require a U.S. public-trust clearance and 953 state years of experience.
4. **Whether the clock allows it.** For this persona a hiring loop up to 143 days keeps the full score; from 172 days the role is dead. Moving one input, a mid-size company's loop, from 84 to 150 days turns half of the "talk to someone first" list into "skip".

## Engine layers

**80 Days to Stay** (H-1B history, industry, funding date); **Job-Ops** (detector, scanner, liveness checker); **Cognitive Pivot** as context only (national BLS median, scorer weight 0.0).

## Failure modes specific to this domain

1. **A name that resolves to the wrong company.** *Shape:* a board is claimed to be company X and the data returns another legal entity with a plausible row (a "Clover Health" board beside a "Clover Software Inc" row), or the right company's history sits on another entity (Augmedix's 18 approvals, at a company reportedly now part of Commure: outside knowledge, not checked). *Hardest to catch for* a student who does not follow health-tech funding news: the row looks right and has approvals attached. *Evidence:* a wrong claim ("Abridged Inc" for the Abridge board) passes the name gate; only a website mismatch flags it (worked run, B2).
2. **An "apply" produced by sponsorship alone.** *Shape:* the scorer's bar is 0.30 and a proven sponsor contributes 0.315 at zero fit, so a customer-facing Rails role reads "Apply". *Hardest to catch for* the student under the most clock pressure, who stops reading at "proven sponsor". *Evidence:* worked run, B6; the real run held two roles back and printed both answers.
