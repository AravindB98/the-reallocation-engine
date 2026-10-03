# Co-op sponsor check — Ananya Rao (fictional) — 2026-10-02

## Executive summary

This report checks 7 co-op software roles against the repository's sponsorship records, to see which employers have a recorded history of sponsoring software work — so a co-op there has a real path to a sponsored full-time job. It only reports what a record shows; where there is no record it says so, and sends you to ask a person instead.

**Next actions:** NETWORK, DON'T APPLY YET ×2 · TAILOR APPLICATION ×1 · NETWORK ×2 · HUMAN CHECK (G2) ×1 · DEPENDS ON GRADUATION DATE ×1.

**You still decide:** whether each matched company row is really the employer (G2), and whether to apply.

## Decisions

| Role | Company evidence | Liveness | Scorer: grad-dec-2027 | Scorer: grad-apr-2028 | Next action |
|---|---|---|---|---|---|
| BNY Mellon — Software Developer Co-op (Full-Stack) | Proven [your-input rule] — 704 approvals, software titles: 5 [record] | unchecked → 0.0 [your-input] | Skip (0); timeline open | Skip (0); timeline open | **NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting** |
| Databricks — Software Engineering Intern (2027 Start) - Winter | Proven [your-input rule] — 1,640 approvals, software titles: 2 [record] | active → 1.0 [record] | Apply (0.525); timeline open | Apply (0.525); timeline open | **TAILOR APPLICATION** |
| Databricks — Deliberately fake job id (break attempt) | Proven [your-input rule] — 1,640 approvals, software titles: 2 [record] | uncertain → 0.0 [record] | Skip (0); timeline open | Skip (0); timeline open | **NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting** |
| JPMorgan Chase — Software Engineer Co-op | not-in-dataset [record] | manual-active → 1.0 [your-input] | Consider (0.225); timeline open | Consider (0.225); timeline open | **NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly** |
| Visa — Software Engineer Co-op | no-sponsorship-record [record] | manual-active → 1.0 [your-input] | Consider (0.21); timeline open | Consider (0.21); timeline open | **NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly** |
| SoFi — Software Engineer Co-op | AMBIGUOUS: SOFI TECHNOLOGIES INC (—); SOCIAL FINANCE INC (182) [record] | manual-active → 1.0 [your-input] | Skip (0.195); timeline open | Skip (0.195); timeline open | **HUMAN CHECK (G2): pick the right CSV row before trusting anything below** |
| Stripe — Software Engineer Co-op (starts Jan 2028) | Proven [your-input rule] — 1,250 approvals, software titles: 2 [record] | manual-active → 1.0 [your-input] | Skip (0); timeline closed | Apply (0.525); timeline open | **DEPENDS ON GRADUATION DATE: Skip if grad-dec-2027, Apply if grad-apr-2028 — settle your co-op/graduation plan before tailoring** |

## Verified vs. inferred

| Value | Label | Where it came from |
|---|---|---|
| H-1B approvals, approval rate, top sponsored titles, funding date, median salary offered | record | 80 Days CSV, line number in run-log.json |
| Occupation median wage (SOC) | record | BLS compact CSV — context only, scorer weight 0 |
| Liveness from `npm run ats:liveness` | record | saved checker output |
| Liveness typed in by hand, or 'unchecked' (fail-closed → 0) | your-input | input file |
| Sponsorship tier and probability | your-input | the rule in input `rules` applied to record fields |
| Fit | your-input | self-rated in the input file (no model was called) |
| Graduation dates, OPT/STEM months, co-op dates, lottery count | your-input | input file; immigration rules NOT checked |
| Composite and Apply/Consider/Skip | computed | existing scorer `scripts/score/role-scorer.mjs` |

## Occupation context (not scored)

- 15-1252 Software Developers: national median 133,080 (OEWS 2024) [record]
- 15-1254 Web Developers: national median 90,930 (OEWS 2024) [record]

## Timeline by scenario

- **grad-dec-2027** — graduation 2027-12-15; OPT ends 2028-12-15; STEM OPT ends 2030-12-15; March lotteries in window: 2028; 2029; 2030 [your-input assumptions]
- **grad-apr-2028** — graduation 2028-04-30; OPT ends 2029-04-28; STEM OPT ends 2031-04-28; March lotteries in window: 2029; 2030; 2031 [your-input assumptions]

## What this cannot tell you

- Whether a company *not* in the CSV sponsors — absence is not a 'no'.
- Whether a company sponsored software roles that are not among its *top* listed titles.
- Whether a co-op converts to full-time, or whether the employer will sponsor *you*.
- Whether the OPT/STEM/lottery rules above are current — they are assumptions, not records.
- Liveness for Workday-hosted boards beyond what the generic checker sees.

## Gates held for a human

- BNY Mellon: G2-company-match = pass-pending-human-confirm, G3-liveness = unchecked, G5-decision = awaiting-human
- Databricks: G2-company-match = pass-pending-human-confirm, G5-decision = awaiting-human
- Databricks: G2-company-match = pass-pending-human-confirm, G3-liveness = uncertain, G5-decision = awaiting-human
- JPMorgan Chase: G2-company-match = not-in-dataset, G5-decision = awaiting-human
- Visa: G2-company-match = no-sponsorship-record, G5-decision = awaiting-human
- SoFi: G2-company-match = ambiguous, G5-decision = awaiting-human
- Stripe: G2-company-match = pass-pending-human-confirm, G4-timeline = grad-dec-2027:closed,grad-apr-2028:open, G5-decision = awaiting-human

*Machine-readable log: `run-log.json` (same folder). Scorer audit per scenario: `<scenario>/role-scores.md`.*
