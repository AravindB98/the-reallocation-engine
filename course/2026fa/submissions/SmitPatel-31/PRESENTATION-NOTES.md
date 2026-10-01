# Presentation notes (5 minutes, no slides)

## Executive summary

A script for the in-class demo: what to say, what to run, and one limitation to name. Practise it once against the clock.

**0:00–0:45 — The situation.** "I graduate in December and start OPT in January. That gives me 90 days of
unemployment, so I have to *start* work by mid-April. Big-company new-grad programs start in the summer. And a
company with thousands of H-1Bs may sponsor mostly senior engineers."

**0:45–1:30 — The asymmetry.** LinkedIn: 4,962 approvals, but its top sponsored software titles are mostly Sr/Staff.
Deloitte Consulting: 8,810 approvals, no software title at all. And Google, Amazon and Meta aren't in the dataset,
because it was built from SEC Form D filers.

**1:30–3:30 — Run it live** (from the repo root):
```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30
```
Open `out/triage-report.md` and point at three rows:
- Pinterest → Apply: its top titles include `Software Engineer I`.
- Databricks → Skip, *network don't apply*: a July start is after the April 11 deadline.
- Google → Needs a person: not in the data, which means Unknown, not "doesn't sponsor".

Then break it:
```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --persona scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-window-closed.json --out-dir /tmp/g0-check
```
→ exit 3, nothing scored.

**3:30–4:30 — One honest limitation.** "Deloitte has no software titles, but it still came out Consider, because
my self-rated fit alone nearly reaches the Consider floor. And the title rule calls `JAVA ENGINEER 2`
non-software. Next step: a sponsorship floor before fit counts, and per-title counts from DOL LCA data."

**4:30–5:00 — Close.** "Every value is labeled record or your-input. None is model-judgment. It uses the engine's
scorer unmodified, and it skips or excludes 7 of 12."

## Be ready to explain
- `timelineFactor` in `lib.mjs`: deadline = max(today, OPT start) + (90 − used); >deadline → 0, buffer → 0.5.
- The tier map: 0.9 / 0.6 / 0.3 / 0.15, and why "no SWE title" is Unknown, not Avoid.
- Why unchecked liveness is excluded *before* the scorer: the scorer defaults a missing gate to 1.
- Why "Meta" must not match `META CO` (exact key, no suffix stripping).
- Pinterest arithmetic: 0.9·0.35 + 0.7·0.30 = 0.525 ≥ 0.30 and tier Proven → Apply.
