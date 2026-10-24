# Domain justification: AI Engineer co-op to H-1B triage

## Executive summary

**What this is.** A one-page case for why this recipe is worth having.

**Why read it.** It names who uses it, what hidden information it surfaces, and where it saves time.

**What it decides.** It is worth having because it turns one invisible fact (has this company sponsored work visas before?) into a cited record, and it refuses to guess anything else. Its biggest limit is that no data shows whether co-ops turn into full-time offers.

## Who and when

A graduate student in an information-systems program, targeting AI Engineer roles (occupation codes 15-1252, 15-2051, 15-1221), who will need H-1B sponsorship for full-time work. They are deciding in the fall which Spring 2027 co-ops and new-grad roles to spend application time on. There are two plans: take a co-op from January and start full-time in September 2027, or skip the co-op and start full-time in May 2027. The same role can be right under one plan and wrong under the other.

## The information asymmetry

From outside, the student cannot see whether a company has sponsored H-1B visas before. A chatbot will answer "yes, they sponsor" fluently whether or not a record backs it. This recipe answers from the 80 Days to Stay records (approval and denial counts, row cited). It says "no record" or "not found" instead of guessing. It also cannot see, and says so, whether a co-op converts to full-time. That is the fact the co-op plan depends on most.

## Engine layers

- **80 Days to Stay** (sponsorship history): the only record input, a vote.
- **Job-Ops** (posting liveness): a gate. Typed in for now, because the checker could not run.
- **Visa timeline**: a gate, computed per plan.
- **Ch.11 scorer**: unmodified.
- Role quality (BLS) is not used; the scorer weights it zero.

## Where it fits the 3-3-2 day

It belongs in the **2 hours of research and applying**.
- **Estimate (not measured):** about 1–2 hours a week saved. That assumes the student would otherwise look up sponsorship history by hand for 10–20 companies a week at about 5 minutes each, and that the triage drops a third or more of them up front.
- **Feeds networking hours:** "Consider" and "no sponsorship record" results say to network into the company and ask, rather than apply blind. Those conversations are also the only current way to learn a team's co-op conversion record.

## Domain-specific failure modes

1. **Company-wide counts read as a promise for one co-op team.** A large sponsor's 1,600+ approvals say little about whether a specific co-op team converts and sponsors. Hardest to catch for: the student themselves, under time pressure, seeing "Proven".
2. **"Not found" read as "doesn't sponsor".** Exact name matching stops "Databricks" when the record says `DATABRICKS INC`. Hardest to catch for: an advisor skimming the report, who sees a stop and moves on.
