# Domain justification — opt-countdown v0.2

## Summary

**What this is.** One page on who this job-search mode is for, which hidden facts it shows them, and the two ways it is most likely to mislead them.

**Why read it.** The person is an international master's student whose real deadline is a 90-day unemployment limit, not a graduation date.

**What it found.** Re-checking the same postings 18 days apart showed three things a job board doesn't make visible:

- the best posting had already closed;
- a "top sponsor" posting refused sponsorship in its own text;
- with 35 days left, almost every large sponsor is too slow to hire in time.

## Who, in exactly what situation

An MS student in Information Systems or Data Science on **F-1 post-completion OPT, year 1**, unemployed since early September, with **45 of 90 unemployment days used** and a 10-day safety buffer. That leaves 35 days of search runway. Their targets are **BI/data analyst (SOC 15-2051.01), systems analyst (15-1211) or new-grad software engineer (15-1252)** roles in the Boston area. They need an employer that will file an H-1B later. The OPT end date (June 2027) feels safe; the unemployment clock is the limit that binds. The worked run uses a fictional persona in exactly this position.

## The information asymmetry

This student cannot easily see:

1. **Whether this employer can hire before the clock runs out.** Nobody publishes hiring speed. At 35 days of runway, every employer the student guesses takes 45–60 days is out of reach. In the live run that was 6 of the 10 scored postings: PathAI, Formlabs, Cohere Health and Klaviyo, all Proven sponsors. A job board ranks them first anyway.
2. **Whether this posting will sponsor, as opposed to this company.** The 80 Days CSV records EverQuote's 56 H-1B approvals at 100%, but EverQuote's live Data Scientist posting says "not eligible for immigration sponsorship, now or in the future". Company history and posting policy are different facts, and only one of them is in a sponsor database.
3. **Whether the posting is still real today.** Two of the five real postings that were live on 2026-10-03 had closed by 2026-10-21, including the only one the mode had said to apply to. The engine's own browser checker also read a non-existent job ID as live until v0.2 patched it.

## Engine layers

- **80 Days to Stay:** H-1B approvals, rate and sponsored titles. This is the sponsorship vote.
- **Job-Ops:** the dated Greenhouse API record (liveness gate, posting age); the posting text (the "posting says no" gate, years asked, pay); the patched `ats:liveness` as a second opinion.
- **Cognitive Pivot:** BLS national wage and pivot score, shown as context only, because the shared scorer gives role quality weight 0.

The new piece is turning the student's OPT dates into the **timeline gate** the scorer already expects but nothing else computes, and making every piece of posting evidence carry a date.

## Failure modes specific to this domain

1. **The sponsor list outranks the posting.** A student filters by "has sponsored H-1Bs" and trusts the ranking. EverQuote sits near the top, and the refusal is in the last paragraph of the posting. *Shape of the error:* a correct company-level record used to answer a role-level question.

   *Hardest to catch for:* a student applying in volume from a ranked list, because nothing upstream contradicts it. The same error sits inside the shared scorer: a role with **fit 0** at a Proven sponsor scores **Apply** (0.341 against a 0.30 threshold). The sponsor vote alone clears the bar.

2. **The clock is miscounted, and the miscount looks certain.** The student counts unemployment days from their last application rather than from their last day of work, or forgets the gap between EAD start and first job. *Shape of the error:* one wrong input silently shifts every timeline gate at once, and the report still looks precise.

   *Hardest to catch for:* the student themself, because it is their own number. A DSO would catch it. The mode prints every clock input with its label so the error is at least visible, and it halts the whole run when the clock reads as exhausted.
