# Domain justification — swe-opt-clock-live

## Executive summary

**What this is.** One page on who this mode is for, what they can't see without it, and the mistakes it's built to catch.

**Why read it.** It makes the case that the mode serves one specific student, not international job-seekers in general.

**What it concludes.** For an unemployed new-grad software engineer on OPT, three things decide whether a posting is worth an hour, and none is on the posting:
- whose board it really is;
- whether the page is really open;
- whether hiring can finish before their unemployment days run out.

## Who, in exactly what situation

An international MS Computer Science graduate on **F-1 post-completion OPT, year 1**, **unemployed**, targeting **new-grad backend / full-stack Software Engineer roles (SOC 15-1252)** around Boston. They're STEM-eligible but haven't filed the extension, which needs an E-Verify employer's offer, so the **90-day unemployment ceiling** binds. The fictional demo student has used 60 of 90 days on 2026-10-21 and must start by **2026-11-20**, seven months before the EAD ends.

Their morning is 15–20 sponsor boards refreshed by hand. A student on STEM OPT with 150 days of runway, or one already employed, gains little from this mode.

## The information asymmetry

1. **A board isn't always the company you looked up.** Sponsor lists give a legal name; job boards give a slug. On 2026-10-21, the Ashby board `cohere` was Cohere, the AI company in Toronto. COHERE HEALTH INC (Boston, 104 approvals) posts on Greenhouse as `coherehealth`. Given the wrong slug under the sponsor's name, the engine's scan printed `COHERE HEALTH INC | Software Engineer, Security Agents`, which is another company's job.
2. **"Open" isn't the same as still open.** A dead Greenhouse posting can redirect, with HTTP 200, to the careers home page, so last week's link can look alive. Formlabs and Tulip embed the application in a frame, which an automated check can't see into.
3. **The hiring clock is invisible.** With 30 days left and a 4–6 week new-grad loop, *every* real posting that morning started too late. "New grad" titles are often worse: "June 2027 New Grads" means next year's class.

## Engine layers

- **Job-Ops:** board discovery through the engine's own `ats:scan` and providers; liveness through its `ats:liveness` checker; a new board-ownership gate.
- **80 Days to Stay:** H-1B approvals and sponsored titles, with senior-only sponsors treated as weaker evidence for a new grad. Form D samples are report-only.
- **Cognitive Pivot:** the BLS 15-1252 row, report-only.
- **The Ch.11 scorer**, unmodified, with liveness and timeline as gates.

## Domain-specific failure modes

1. **Name-collision sponsorship.**
   - *The error:* a sponsor's record is attached to a different company's posting because the board slug matches the name. The student applies trusting 104 approvals that belong to someone else.
   - *Hardest to catch for:* a first-time searcher who looks companies up by name and never opens the board's location list. That's the student leaning hardest on sponsor counts.
   - *Mitigation:* no sponsor record is used until a named person ties the board to it (gate G1a). The live run showed the gate's limit, too: a careless confirmation goes straight through.
2. **The clock that closes while you're "almost ready".**
   - *The error:* a student whose day count is a week old treats a 45-day loop as fine. The projected count says it ends 15 days after their allowance does.
   - *Hardest to catch for:* the student with the fewest days left, who is the most tempted to apply anyway and the least likely to have a fresh count.
   - *Mitigation:* the count must be dated and is projected to the run date. A start after the hard deadline is a gate, not a vote, and the report says how many days a job has to start within.
