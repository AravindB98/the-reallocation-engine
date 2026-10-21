# Presentation notes — five-minute show and tell

## Executive summary

A talk outline for the in-class show and tell, with no slides needed: show the mode file and a terminal. It covers the four things the rubric asks for, the domain, the asymmetry, one thing learned from running the mode, and one honest limitation, and it budgets the time. It is a draft. Rehearse it in your own words.

## Timing (5:00)

| Time | Show | Say (in your own words) |
|---|---|---|
| 0:00–0:45 | the card (`recipes/cases/2026fa/o7580-design-engineer-soc-triage.card.md`) | **Domain.** Meet the persona: an F-1 student who applies to both front-end engineering and product design jobs, graduating December 2026, two years' experience, small portfolio. Tools treat this person as one or the other; neither checks sponsorship for design work at their level. |
| 0:45–2:00 | `design-title-audit.md`, Findings table | **Asymmetry.** 119 sponsored titles say "design", and 65 aren't interface design: chips, mechanical, graphic, management. In Massachusetts, zero sponsors list a junior UX/product-design title with 3+ approvals. And the occupation code is invisible: 15-1255 vs 27-1024 is about $37k of national median, and no shipped file says which one an employer files. |
| 2:00–3:30 | terminal: `node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs`, then the Decisions table in `triage-report.md` | **Real run.** 1,373 jobs on 13 boards → 9 US postings. The scanner matched "ux" in "Sioux Falls". Palantir has 462 approvals and lists Product Designer, but both "New Grad" design roles say "graduating in 2027", so the gate closes. After confirming the inputs: two Apply, two Consider. |
| 3:30–4:15 | terminal: `bash …/break-tests.sh` (or show B1 and B2 in `break-tests.txt`) | **What I learned from running it.** Move the date to March 2027 and everything closes; a stale run is not a decision. Delete the 15-1255 row and the tool says "missing" instead of borrowing a neighbour. Breaking it found a bug I had already fixed once before. |
| 4:15–5:00 | "What it cannot verify" in the recipe | **Limitation.** It cannot tell which SOC code an employer will file. It shows the stakes and tells the candidate to ask the recruiter. The AI-resilience score for the persona's main occupation is blank, so the mode refuses it. And both Apply results rest on fit values, which are a person's judgment, not a record. |

## Have open before you start

- `recipes/cases/2026fa/o7580-design-engineer-soc-triage.card.md`
- `course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live/design-title-audit.md`
- `course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live/triage-report.md`
- a terminal at the repository root (after `npm ci`)

## If asked

- *Why DRAFT?* The constitution says SPECIFIED needs zero open TODOs, and the assignment asks for typed proposals. Promoting it would be claiming evidence I don't have.
- *Why not put the AI-resilience score in the composite?* The maintained scorer weights role quality at 0. Passing it in would change nothing and look like it did.
- *Is the clearance gate legal advice?* No. It closes when a posting states a clearance requirement. The legal question goes to the international student office.
