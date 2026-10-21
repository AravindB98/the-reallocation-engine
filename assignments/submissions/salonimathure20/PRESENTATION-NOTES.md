# Show-and-tell notes — opt-countdown v0.2 (5 minutes)

## Summary

**What this is.** A timed script for the five-minute in-class show-and-tell. No slides: it uses the mode file, one terminal and the generated report.

**Why read it.** It covers the four things the rubric asks for: the situation, the asymmetry, one thing learned from running it, and one honest limitation.

**What it shows.** The same postings re-checked 18 days apart. The "Apply" had disappeared, a top sponsor's posting refused sponsorship, and the shared scorer will recommend a job you can't do.

## Setup before class (2 minutes, offline)

- Terminal at the repo root, Node 20 on PATH, font large.
- Tabs open: `recipes/cases/2026fa/salonimathure20-opt-countdown.md`, `assignments/submissions/salonimathure20/runs/live-2026-10-21/out/opt-countdown-report.md`, `…/terminal/03a-liveness-UNPATCHED.txt`.
- Everything shown runs offline from saved evidence, so the talk does not depend on campus Wi-Fi.

## Script

**0:00–0:45 · The situation.** "An international MS student on OPT has 90 days of unemployment, total. This persona (fictional) has used 45 and keeps a 10-day buffer. That leaves 35 days, so any job has to *start* by November 25. They want BI-analyst or new-grad software roles in Boston, at a company that will file an H-1B."

**0:45–1:45 · The asymmetry.** Open the recipe's source-inventory table. "Three things this student can't see from a job board. Can this employer hire before day 35? Does *this posting* sponsor, or only the company? Is the posting even still open today? A sponsor database answers none of them." Point at the three labels: record, model-judgment, your-input.

**1:45–3:15 · The run (live demo, offline).**

```bash
bash assignments/submissions/salonimathure20/rerun-offline.sh
```

Then in the report, scroll to *Decisions and next actions*:

- "**Zero Apply.** Six of ten are Proven sponsors, PathAI and Klaviyo among them, gated by timeline. My hiring-lag estimate is longer than 35 days. That isn't a bug; it's the finding. With this clock, the strategy is bridge work or small employers, not more applications."
- "**EverQuote**: 56 H-1B approvals, 100% rate, and the posting says 'not eligible for immigration sponsorship, now or in the future'. Gate G2b skips it before scoring."
- "**Formlabs BSA** was my only Apply on October 3rd. On October 21st the API says 404. That is why v0.2 refuses evidence more than two days old."

**3:15–4:15 · One thing I learned from running it.** Show `terminal/06a-break-attempts-B1-B6.txt`, B6: "I fed the shared scorer a role with **fit zero** at a strong sponsor. It said **Apply**, 0.341. The sponsorship weight, 0.35, is bigger than the Apply threshold, 0.30. My live run shows the same shape. The only Consider asks for 7+ years against 1, and it got there because the company sponsors and is small. I didn't paper over it. It's a typed TODO: a person has to set the experience floor."

**4:15–5:00 · One honest limitation.** "The decision that matters most here, 'too slow for your clock', rests on my *guess* of how fast each company hires. Nothing in the repo measures time-to-hire, and the mode is most sensitive to its least-verified input. If PathAI really hires in 30 days, it becomes an Apply. And it only reads posting text on Greenhouse; Workday employers get much weaker evidence. That's why it stays DRAFT even though it ran live."

## If asked

- *Why not RUNNABLE-LIVE?* The constitution needs zero open TODOs for SPECIFIED, and the ladder doesn't skip. Five are open, and the human gate G4 isn't signed.
- *How do you know the numbers are right?* `verify-run.py` recomputes all 36 numbers without importing my code, and a mutation check shows the tests fail when I put the bugs back.
- *Did you change shared code?* One file, `scripts/ats/liveness-browser.mjs`. A dead job that redirects to a careers page now reads "uncertain", not "active". Before/after output is in `terminal/03a` and `03b`.
