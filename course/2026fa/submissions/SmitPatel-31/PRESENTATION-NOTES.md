# Presentation notes (5 minutes, no slides)

## Executive summary

A script for the in-class show-and-tell. It covers what to say, what to show, the one thing running the mode taught
me, and one limitation. Practise it once against the clock. Show the terminal and the report file; no slides.

**0:00–0:45 — The situation.** "I graduate in December and start OPT in January. That gives me 90 days of
unemployment, so I have to *start* work by mid-April. Big-company new-grad programs start in the summer. And a
company with thousands of H-1Bs may sponsor mostly senior engineers."

**0:45–1:30 — The asymmetry.** LinkedIn: 4,962 approvals, but its top sponsored software titles are mostly Sr/Staff.
Deloitte Consulting: 8,810 approvals, no software title at all. And Google, Amazon and Meta aren't in the dataset,
because it was built from SEC Form D filers.

**1:30–3:30 — The real run.** Show the pasted output in `WORKED-RUN.md → Real-postings run` (re-running live needs
the network and about a minute of Playwright; do it only if the room's Wi-Fi is good):
```bash
REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/portals-newgrad.yml npm run ats:scan -- --dry-run
npm run ats:liveness -- "https://www.pinterestcareers.com/jobs/?gh_jid=7838591" "https://stripe.com/jobs/search?gh_jid=8128744"
```
Then the offline part, which always works:
```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --postings scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-live-2026-10-17.json --today 2026-10-17 --out-dir /tmp/demo
```
Point at three rows in `/tmp/demo/triage-report.md`:
- Stripe new grad → Consider, *network first*. Sponsorship is only "Likely": its top titles say plain "Software Engineer".
- Pinterest → **Skip**. This is the punchline (next section).
- The fake job id → Needs a person, not scored.

**3:30–4:15 — What I learned from running it.** "On sample data, Pinterest was my one Apply. On real data, the
liveness checker called the Pinterest posting *expired*. Pinterest's own job listing says it's open. Its careers
site blocks automated browsers, so the checker saw an empty page. Because liveness is a gate, one wrong input
zeroed the best-evidenced posting. And a Skip looks like the engine saving you time, so you'd never go back and
check it."

**4:15–4:45 — One honest limitation.** "The mode can't verify that a posting is live. It can only record what
the checker saw. It also can't verify when a job starts: no real posting stated a date, so every start was
estimated. Next step: cross-check every 'expired' against the board's own API before it can zero a posting."

**4:45–5:00 — Close.** "Every value is labeled record or your-input. None is model-judgment. It uses the engine's
scorer and scanner unmodified. Status: DRAFT, with five typed TODOs, and that's the honest stage."

## Be ready to explain
- `timelineFactor` in `lib.mjs`: deadline = max(today, OPT start) + (90 − used); >deadline → 0, buffer → 0.5.
- The tier map: 0.9 / 0.6 / 0.3 / 0.15, and why "no SWE title" is Unknown, not Avoid.
- Why unchecked or `uncertain` liveness is excluded *before* the scorer: the scorer defaults a missing gate to 1.
- Why the scan missed Stripe's US new-grad role: its location string has no "US"/"USA".
- Why "Meta" must not match `META CO` (exact key, no suffix stripping).
- Why the status is DRAFT and not RUNNABLE-SAMPLE: open typed TODOs block SPECIFIED.
