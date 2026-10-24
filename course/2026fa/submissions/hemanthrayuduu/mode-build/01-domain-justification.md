# Domain justification: a weekly apply-queue refresh for AI / Data Engineers on F-1 OPT

## Executive summary

**What this is:** the one-page case for a new way of using the Reallocation Engine. It doesn't find jobs; it re-checks a shortlist every week, for an international student on OPT who targets AI or data roles and needs visa sponsorship.

**Why read it:** three facts that decide whether a shortlisted posting deserves an application are invisible on the shortlist:
- whether the posting is still real;
- whether the company's sponsorship record covers *this kind* of role;
- whether the student's OPT clock still allows the hiring timeline.

**What it found:** in real runs, one of eight postings closed within a day; all eight sit under a sponsorship cap because the records list other job families; and a one-week change in the expected hiring timeline moved three of eight roles between "consider" and "skip".

## Who uses this mode, and when

An international student or recent graduate on **F-1 OPT** who targets **AI, ML or Data Engineer** roles, needs **H-1B sponsorship**, and already has a shortlist of postings at sponsor-likely companies. They use it **once a week**, and before spending application time on any list older than a week.

It isn't for building a shortlist, not for anyone who doesn't need sponsorship (the run refuses), and not for legal questions (those go to a DSO). The committed runs use the repository's fictional persona Priya Nair: an AI / ML Engineer on post-completion OPT, with 34 of 90 unemployment days used and a 20-day buffer.

## The information asymmetry

The employer knows three things the student can't see from the list.

1. **Whether the role is still open.** Pages outlive the jobs behind them. All eight postings were live on 2026-10-03, and still up at 01:57 on 2026-10-19. By 15:35, Verkada's "Software Engineer – Computer Vision" redirected to an error page, and the company's board returned 404.
2. **What the sponsorship record covers.** The public H-1B record lists a company's top sponsored *titles*. At all four companies here, none is an AI or data title. So every AI / data posting gets only a "Possible" tier (p 0.4), even at Databricks with 1,640 approvals.
3. **Whether the timeline still works.** With a 42-day expected start, the persona would have 14 unemployment days left, under the 20-day buffer. The clock factor of 0.7 pulls the best match (0.279) under the engine's Consider floor of 0.20, which is itself an unpinned placeholder in the scorer. At 35 days, three roles are Consider again.

## How it connects to the engine's layers

- **Job-Ops (liveness is a gate).** Each posting is checked two independent ways: the engine's page checker (`npm run ats:liveness`), and the company's Greenhouse board through the repository's greenhouse-watch fetcher. A posting is live only when both agree; disagreement goes to a human, never to the scorer. On the real postings the two always agreed. The disagreement case was constructed: a made-up job id that the page checker calls `uncertain` (as in the professor's reference run) and the board calls 404.
- **The visa timeline (a gate).** The clock factor is computed from dated inputs (book chapter 10) and multiplies into the engine's scorer (chapter 11), so a good fit can't outweigh it.
- **80 Days to Stay.** Each company's approvals and top sponsored titles are re-read from the CSV and cross-checked against the queue (4 of 4 match). The tier and its basis are shown on every row.
- **The Cognitive Pivot.** The BLS cognitive-pivot score and median wage are shown, not scored: the engine weights role quality 0. The Data Scientist occupation has no score in the file, so it's reported as unknown, not guessed.

## Failure modes specific to this domain

1. **Sponsorship history counted for the wrong job family.**
   - *The shape of the error:* "this company sponsors H-1Bs" is read as "it sponsors my kind of role". Here the records are for software, solutions, electrical, sales and product titles, so all eight AI / data postings are capped at "Possible", and no fit reaches Apply.
   - A related trap: 6 of the 8 occupation codes are a family guess. That files a computer-vision engineer under "research scientists", whose wage and pivot score then appear as its context.
   - **Hardest to catch for** an AI or data candidate new to how H-1B records are summarized, who sees a famous sponsor's name and stops reading.
2. **The clock moves, the list doesn't.**
   - *The shape of the error:* a role that fit the calendar when it was shortlisted stops fitting as unemployment days accrue. With the same postings on the same day, 35 instead of 42 days to start moved three of eight roles between Skip and Consider.
   - The mode recomputes the clock each run, but from the day count the person gives it: it doesn't add days by itself, so gate G2 makes the person confirm the count every run.
   - **Hardest to catch for** someone who counted their days once at the OPT start, or who assumes every company hires on the same timeline.

*Written 2026-10-21. Every number above comes from `evidence/` and `runs/` in this folder; none is quoted from memory.*
