# Domain justification: da-sponsor-triage

## Executive summary

This mode is for an international Information Systems master's student who has chosen Data Analyst roles, prefers funded companies, and needs H-1B sponsorship. The thing it makes visible is not "who sponsors". It is **which of today's real analyst openings at known DA sponsors a new graduate on OPT can actually take.** On 2026-10-20 the answer was none, and seeing that early moves the week's time from applying to networking.

## Who, in exactly what situation

An F-1 student in a STEM-designated MS Information Systems program (CIP 14.0903), graduating May 2027, about eight months before post-completion OPT and its 90-day unemployment limit. They are targeting **Data Analyst** work in Python, would prefer a venture-funded employer, and will need H-1B sponsorship later. A data-science PhD or a senior analyst changing jobs would not recognise this workflow. The new-grad seniority gate and the US-location gate are built for this person.

## The information asymmetry

From outside, this student cannot easily see three things, and the 2026-10-20 run measured each one:

1. **Which funded companies have sponsored *Data Analysts* specifically.** The shipped data has 27,874 companies with a funding date, of which 1,532 have any H-1B approval. Only **38** list a Data Analyst-type title among their top sponsored titles (`record`).
2. **Whether those companies have an opening this student can take *now*.** 14 of the 38 have a public Greenhouse/Lever board, together listing **380** jobs. 17 are analyst-titled. After the gates, **0** fit a new graduate on OPT: one is in Bengaluru, and the US ones ask for 3+ or 5+ years in the posting's own words.
3. **Whether the signals a student would trust are themselves right.** Two of nine name-guessed boards belong to other companies ("Slice Talent Community", "Watershed Informatics"). The liveness checker called four Pinterest postings "expired" on the same day Pinterest's board API listed them.

A job board shows postings without sponsorship history. An H-1B lookup site shows filings without today's openings. Neither applies the OPT location and new-grad constraints. This mode joins all three, with each value labelled `record` or `your-input`.

## Engine layers

- **80 Days to Stay:** funding and H-1B history (`mapped_student_employment_targets_v3.csv`), Form D samples.
- **Job-Ops:** the repo's `npm run ats:scan` (real openings) and `npm run ats:liveness` (real page checks). Liveness is a gate, not a vote.
- **Existing scorer:** `scripts/score/role-scorer.mjs` for whatever clears the gates.

## Failure modes specific to this domain

1. **A job board that is not the company's.** Board tokens are guessed from names, so `talent` returns *Slice Talent Community* for TALENT INC. The shape of the error: a student sees real postings under a company with 72 H-1B approvals (Data Analyst among its top titles) and applies, believing that company sponsors. **Hardest to catch for** a student new to the US market. The posting is real, the sponsorship record is real, and only the join between them is false. Nothing on screen looks wrong.
2. **A "record" that is wrong in the student's disfavour.** The liveness checker read four live Pinterest postings (a 1,364-approval sponsor) as "expired — insufficient content", because the page renders in JavaScript. The shape: a closed gate silently zeroes the strongest sponsor in the list. **Hardest to catch for** anyone trusting the tool, precisely because "expired" is labelled `record`. The mode holds such postings as `liveness-conflict` when the board API listed them the same day.
