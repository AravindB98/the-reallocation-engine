# Presentation notes — 5-minute show-and-tell

## Executive summary

A five-minute script for presenting this mode in class: the situation it is built for, the hidden information it exposes, one thing learned by actually running it, and one honest limit. It names which file to open and which command to run live at each point, with timings, so the talk stays on time and shows a real run rather than slides.

## Setup before class (not on the clock)

- Terminal at the repository root on branch `mode/contactshyam14-code-em-pm-supply-chain`, font large.
- Open in the editor: `course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21/soc-resolver.md` and `recipes/cases/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver.md`.
- Have the commands below in a scratch file to paste. The live command uses only committed files and needs no network.

## 0:00–0:45 — The situation (show: nothing, just talk)

"I'm an MS Engineering Management grad on F-1 OPT: 12 months, requested start December 31, not approved yet. I apply only to project-manager and supply-chain jobs that ask for two years or less, in five metros. My last recipe ended with one honest limitation: 'title-to-occupation matching is an inference'. This mode is about that sentence."

## 0:45–1:45 — The asymmetry (show: the candidate table in the recipe)

Open the recipe at **"Candidate SOC table"**.

"A posting says 'Supply Chain Project Manager'. It never says the SOC code. It could be 13-1082 at $100,750, 13-1081 Logisticians at $80,880, or 11-3071 Supply Chain Managers at $102,010, a $20K swing from the code alone. And an employer's H-1B history only matters for the code they'd actually file. 'Planner' titles can even be 43-5061: a clerical, job-zone-2 code at $57,770."

## 1:45–3:15 — Show a real run (show: the report, then one live command)

In `runs/01-2026-10-21/soc-resolver.md`, scroll to **"Inventory Planner — RS Group (real)"**:

- liveness **active**, from the repo's own `ats:liveness`;
- the quoted "1-3 years" under **Essential** gives EXPERIENCE-FIT; the degree is only **Desirable**, "or equivalent";
- the wage table: 13-1081 $80,880 vs 43-5061 $57,770, and **13-1023 has no OEWS row at all**;
- verdict **AMBIGUOUS-REFUSE**: "ask the recruiter which SOC".

Then run live (about 2 seconds, offline):

```bash
node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --local-wage skip --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-1-sc-manager-5yrs.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-2-marketing-coordinator.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/demo
```

"Watch it refuse: 5+ years stops at the experience gate, and Marketing Coordinator stops at scope. Refusing is the feature."

## 3:15–4:15 — One thing I learned by running it (show: the scorer line and the Zipline section)

Pick **one** (rehearse which):

- **The scorer can't tell SOCs apart.** Its `role_quality` weight is 0.0, so every candidate gets the same score. Only the wage spread separates codes. I only found this by running it.
- **13-1023 isn't in OEWS 2024 at all.** It isn't just blank in the compact file: BLS folded it into 13-1020. I show the aggregate but refuse to substitute it.
- **Liveness disagreed with the job board.** The repo's checker said Zipline was `uncertain` (no Apply button seen) while `ats:scan` listed the job from Greenhouse. The gate stays STOP until a human decides.

## 4:15–5:00 — One honest limitation (show: "Cannot verify" in the recipe)

"The mode cannot tell you which SOC the employer will actually file. Only the employer or its LCA can. The 80 Days data has no SOC column, so per-SOC sponsor history is missing, and I don't approximate it. My next step is DOL LCA disclosure data, which records the filed SOC per employer and worksite. And nothing is ranked until I type in my EAD card dates, because that's a human gate."

Stop at 5:00.
