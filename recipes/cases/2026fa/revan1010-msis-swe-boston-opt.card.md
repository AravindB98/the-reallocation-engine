# Card — MSIS → SWE, Boston, F-1 OPT from February 2027

## Executive summary

This one-page card goes with the full recipe of the same name. It is for an international Information Systems master's student in Boston, graduating December 2026, who wants a junior software engineering job and will need visa sponsorship. It lists the employers whose sponsorship history includes people at your level, counts your visa-lottery chances from your dates, and refuses any posting it cannot confirm is live. It cannot tell you whether the sponsorship data is current, or whether your degree will be accepted for a software-developer visa petition.

## Purpose

Turn "Boston companies that sponsor" into "Boston employers with record evidence of sponsoring *non-senior* software engineers, with live postings, scored with my visa timeline as a hard gate."

## What it can verify

- Raw H-1B approvals, denials, rate and median salary for 200 commutable MA employers, from the 80 Days file.
- Whether an employer's sponsored titles include a non-senior SWE title (declared rule, 10 tests).
- That every count in the source is even (1,557/1,557). This is why it ranks employers by evidence and rate, not by raw count.
- Your reachable H-1B registrations: 1 (March 2027) if E-Verify is unconfirmed, 3 with E-Verify plus the STEM extension. An OPT start more than 60 days after graduation is refused as an input error.
- Whether a posting shows an apply control today.

## What it cannot verify

- What year the sponsorship data is from; whether the company is the same legal employer as the government record.
- E-Verify enrollment, Boston pay, the wage level of an offer, and lottery odds.
- Whether an `uncertain` posting is real. A fake job ID also came back `uncertain`.
- Your fit, and whether your MSIS degree supports a software-developer petition.

## Dependencies

Node ≥ 20, `npm install`, Python venv with `pyyaml` and `scripts/ats/requirements.txt`, Playwright Chromium (for liveness), network only for the board fetch and liveness steps.

## Annotated commands

```bash
node scripts/contrib/2026fa/revan1010-boston-swe-triage/sponsor-triage.mjs --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --profile scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json --out-dir output/revan1010-boston-swe/<date>   # employers + timeline gate
bash scripts/contrib/2026fa/revan1010-boston-swe-triage/run-mode.sh output/revan1010-boston-swe/<date> private/real-postings/candidates.json private/real-postings/fit.json   # liveness → refusals → engine score
node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs   # 10 tests incl. 5 break attempts
```

## What it produces

`triage.json` and `triage.md` (employer short-list), `roles.json` (scorable roles, refused roles and the `decision_grade` flag), and `role-scores.json` and `role-scores.md` (engine scores with a per-term trace).

## Named failure modes

1. **Count-as-signal.** "Toast sponsored 150" reads like a strong new-grad target. But every sponsored Toast SWE title in the record is Senior or Staff, and the count itself is probably doubled.
2. **Silent open gate.** The engine scorer treats a missing liveness value as live. A hand-built roles file can therefore score a ghost posting as Apply. This mode's role builder refuses such a role first.
