# Presentation Notes — 5-minute show & tell

## Executive summary

These are speaking notes for a five-minute in-class demo of the Boston job-search recipe. They cover the situation it was built for, the hidden information it surfaces, one thing learned by running it, and one thing it cannot check. The plan is to show the terminal, not slides.

## Run order (≈ 5:00)

**0:00–0:45 · The situation.** "I'm an F-1 MSIS student graduating this December. I want a software engineering job in Boston, and my OPT starts February 2027. I need H-1B sponsorship. The recipe computes **one** lottery draw for me, March 2027, or three if my employer is in E-Verify. That one fact about the employer triples my chances, and no dataset in this repo has it."

**0:45–2:00 · The asymmetry (live).** Run the triage; it takes about a second:

```bash
node scripts/contrib/2026fa/revan1010-boston-swe-triage/sponsor-triage.mjs --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --profile scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json --out-dir output/revan1010-boston-swe/demo
```

Point at the `tiers` line. Then: "Toast shows 150 approvals. Every Toast SWE title in the record is Senior or Staff. 6 of the 22 biggest sponsors near Boston have only senior SWE evidence. A new grad who reads the count gets the wrong answer."

**2:00–3:15 · What I learned by running it.** Point at the `parity` line: "All 1,557 approval counts and all 1,557 denial counts are even. Real counts aren't. The file was almost certainly doubled in a join. So I rank by evidence and rate, never by raw count." Then the scorer surprise: "The engine's scorer treats a *missing* liveness check as live. My role builder refuses those." Optional: `node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs`. The last test name says it.

**3:15–4:15 · Honest limitation.** "It cannot tell whether a USCIS officer will accept an Information Systems degree for a software-developer petition. That's a human gate, G5. It also can't tell what year these H-1B numbers are from. And the liveness checker said 'uncertain' for two real postings *and* for a job ID I made up."

**4:15–5:00 · What running it taught me, and status.** "My first run used May 2027 for OPT, which is impossible for a December graduate. It gave me two draws instead of one and turned every 'Consider' into 'Apply'. The mode had no way to catch my own wrong date, so now it requires the program end date and refuses an OPT start outside the 60-day window. Honest status is DRAFT. It ran end-to-end on real data and 6 real postings, with 3 scored, all 'Consider', and 3 refused. My fit inputs are placeholders and nine TODOs are open."

## If something fails live

The liveness and board-fetch steps need network access. If the room's network is bad, show `course/2026fa/submissions/revan1010/worked-run.md`, which has the pasted outputs. The triage and tests run offline.
