# Domain justification — healthins-ai-opt v0.2.0

## Executive summary

One job seeker needs this mode: an international master's student about to start OPT who wants applied-AI work at insurance and health companies. From outside, they cannot see which roles the visa records cover, which a new graduate could hold, or which hiring loops fit their clock. On 20 October 2026 the mode turned 1,729 jobs at 32 companies into 9 live candidates and named the 10 companies it could not see.

## Who, in exactly what situation

An MS student graduating December 2026, on OPT from January 2027 with 90 unemployment days, aiming at applied-AI / LLM engineering (SOC 15-1252) at insurers and health-tech firms. Applying before OPT costs no unemployment days.

## The information asymmetry

1. **Which companies the sponsorship evidence covers.** 10 of 32 boards, including Oscar Health's (247 openings), have no identifiable row in a dataset built from private funding filings; four match only a similarly named row with another website.
2. **Which roles a new graduate can hold.** At identifiable companies, 96 of 114 software listings are senior or above.
3. **What only the posting text says.** 17 of 1,729 texts say "unable to sponsor"; 2 require a public-trust clearance.
4. **Whether the clock allows it.** A hiring loop up to 143 days keeps the full score; from 172 days the role is dead.

## Engine layers

**80 Days to Stay** (H-1B history, funding date); **Job-Ops** (scanner, liveness checker); **Cognitive Pivot** as context only (BLS median, scorer weight 0.0).

## Failure modes specific to this domain

1. **A name that resolves to the wrong company.** *Shape:* the data returns another legal entity's plausible row (a "Clover Health" board beside "Clover Software Inc"), or the history sits on another entity (Augmedix's 18 approvals; Augmedix reportedly now belongs to Commure: outside knowledge). *Hardest to catch for* a student who does not follow health-tech deals: the row looks right. *Evidence:* claiming "Abridged Inc" for the Abridge board passes the name gate; only a website mismatch flags it (worked run, B2).
2. **An "apply" produced by sponsorship alone.** *Shape:* the scorer's bar is 0.30 and a proven sponsor contributes 0.315 at zero fit, so a customer-facing Rails role reads "Apply". *Hardest to catch for* the student under the most clock pressure, who stops reading at "proven sponsor". *Evidence:* worked run, B6; the real run held two such roles back.
