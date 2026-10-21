# Domain justification — swe-opt-clock-live

## Executive summary

**What this is.** One page on who this mode is for, what they can't see without it, and the mistakes it's built to catch.

**Why read it.** It makes the case that the mode serves one specific student, not international job-seekers in general.

**What it concludes.** An unemployed new-grad software engineer on OPT searches the same few company boards every morning. Three things decide whether a posting is worth an hour, and none of them is on the posting:
- whether the board really belongs to the sponsor they looked up;
- whether the page is really still open;
- whether this company's hiring could finish before their unemployment days run out.

The mode checks all three on today's real postings.

## Who, in exactly what situation

An international MS Computer Science graduate on **F-1 post-completion OPT, year 1**, **currently unemployed**, targeting **new-grad backend / full-stack Software Engineer roles (SOC 15-1252)** in the Boston area. They're STEM-eligible but haven't filed the extension, which needs an offer from an E-Verify employer, so the **90-day unemployment ceiling** binds.

The demo student (fictional) has used 60 of 90 days on 2026-10-21. They must start by **2026-11-20**, seven months before their EAD ends.

Their morning is a list of 15–20 company boards they know have sponsored before, refreshed by hand. A student on STEM OPT with 150 days of runway, or one already employed, would get little from this mode.

## The information asymmetry

1. **The board isn't always the company you looked up.** Sponsor lists give a legal name, and job boards give a slug. On 2026-10-21 the Ashby board `cohere` belonged to Cohere, the AI company in Toronto. COHERE HEALTH INC, the Boston sponsor with 104 approvals, posts on Greenhouse as `coherehealth`. The engine's own scan, pointed at the wrong slug, printed `COHERE HEALTH INC | Software Engineer, Security Agents`, which is another company's job under the sponsor's name.
2. **"Open" isn't the same as "still open".** A dead Greenhouse posting can redirect, with HTTP 200, to the company's careers home page. A link the student kept from last week can look alive. The page at Formlabs and Tulip hides the apply form inside a frame, so an automated check can't tell open from closed at all.
3. **The hiring clock is invisible.** With 30 days left and a typical new-grad loop of 4–6 weeks, *every* real posting found that morning starts too late. The postings titled for new grads are often worse: "June 2027 New Grads" means next year's graduating class.

## Engine layers

- **Job-Ops:**
  - board discovery and filtering through the engine's own `ats:scan` and providers;
  - posting liveness through the engine's own `ats:liveness` checker;
  - a new board-ownership gate.
- **80 Days to Stay:** H-1B approvals and sponsored titles, with the new-grad rule that senior-only sponsors are weaker evidence; Form D samples (report-only).
- **Cognitive Pivot:** the BLS row for 15-1252 (report-only; the scorer weights it 0).
- **The Ch.11 scorer**, unmodified, with liveness and timeline as multiplying gates.

## Where it fits the 3-3-2 day

It takes over the research half of the **2 research-and-apply hours**: re-opening boards, checking postings, looking up sponsors, and doing the date math.

**Estimate (mine, not measured):** 30–40 minutes every morning. It becomes about 15: read the audit, clear any new board, read the report, sign.

It **feeds the 3 networking hours**. Every held posting at a strong sponsor and every Consider becomes "talk to someone there first". It doesn't do the credibility hours.

## Domain-specific failure modes

1. **Name-collision sponsorship.**
   - *The error:* a sponsor's record is attached to a different company's posting because the board slug matches the name. The student applies believing in 104 approvals that belong to someone else.
   - *Hardest to catch for:* a student who searches by company name and never opens the board's location list. That is a first-time searcher, the one leaning hardest on sponsor counts.
   - *Mitigation:* the mode won't look up a sponsor record for a board until a named person has tied the board to the record (gate G1a). Wrong-company boards are dropped on every run.
2. **The clock that closes while you're "almost ready".**
   - *The error:* a student who checked their day count last week treats a 45-day hiring loop as fine. The projected count says it ends 15 days after their allowance does.
   - *Hardest to catch for:* the student with the fewest days left. They're the one most tempted to apply anyway, and the least likely to have a fresh count.
   - *Mitigation:* the count must carry a date and is projected to the run date. A start after the hard deadline is a gate, not a vote, and the report states how many days a job has to start within.
