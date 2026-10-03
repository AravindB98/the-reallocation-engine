# Domain justification — Network Engineer roles by H-1B sponsorship history

## Executive summary

This one-page note explains who this recipe is for, what it lets them see that they could not see before, and where it fits in a job-search day.
- **Who:** an F-1 master's student who has not started OPT yet and wants Network Engineer jobs.
- **What it adds:** a quick, sourced answer to "has this employer sponsored network jobs before?", in place of a guess.
- **Time:** it should save about four hours a week of research (an estimate, shown below).
- **What can go wrong:** a word-matching rule that matches too much, and sponsorship records that may be years old.

## Who, exactly

An international master's student on F-1, OPT not yet started (fictional persona: program end 2027-05-15, OPT start 2027-06-01, a 90-day unemployment limit, a 60-day hiring-lag assumption), targeting **Network Engineer** roles (SOC 15-1241, Computer Network Architects). They will need H-1B sponsorship. Their main signal is whether an employer has sponsored **network-titled** roles before.

## The information asymmetry

From outside, the student cannot easily see:
- whether an employer has a record of H-1B approvals;
- whether any of the titles it sponsored were network jobs.

Job postings rarely say. A chatbot will answer "does X sponsor network engineers?" fluently whether or not any record exists. The recipe reads the repository's 80 Days to Stay records instead: company approvals, denials, approval rate and sponsored title strings (record). It shows exactly which title matched, and says "missing" where there is no row. It cannot see per-title counts, dates, or current sponsorship, and it says so in every report.

## Engine layers

- **80 Days to Stay:** sponsorship vote.
- **Job-Ops liveness:** gate; sample values in v0.1, with one real check planned.
- **Visa timeline:** gate; the student's own dates.
- **BLS/O\*NET (15-1241 national median wage) and SEC Form D samples:** context outside the score.

All of it is combined by the existing scorer (`scripts/score/role-scorer.mjs`), never a copy.

## Where it fits the 3-3-2 day

- **Replaces, in the 2 research-and-apply hours:** the per-opening sponsorship lookup — finding the employer's H-1B history, reading its sponsored titles for network roles, checking for a funding filing — plus the timeline arithmetic.
- **Leaves for the person:** tailoring and confirming current sponsorship (the Consider next action).
- **Feeds the 3 networking hours:** the **"network, do not apply yet"** list. These are employers with a network-titled sponsorship record whose posting has not been checked; the student finds a contact before applying.

**Time saved — estimate (AI-proposed, accepted by me):**

| | Minutes per opening |
|---|---|
| By hand: H-1B lookup 10 + reading sponsored titles 3 + funding check 5 + posting/timeline check 2 | 20 |
| With the recipe: add the opening to the input file 1 + read its report row 1 + open the posting to confirm 2 | 4 |
| Saved | 16 |

16 min × 15 openings/week = **240 min ≈ 4 h/week**, about 40% of the 10 research-and-apply hours in a 5-day week (2 h × 5). The per-step minutes are assumptions, not measurements.

## Domain-specific failure modes

1. **Substring over-match.**
   - **What happens:** the rule counts any sponsored title containing "network" plus a role word. "Engineering Manager, Networking" matched (SKYTAP INC), so a management title made the company "Likely".
   - **Who struggles to catch it:** the student. The report's headline says "Likely"; only the evidence table shows the exact title. My own prediction P1 expected the opposite error (missed matches).
2. **Stale company-level sponsorship.**
   - **What happens:** 164 approvals with "Sr. Network Architect" among the titles reads the same whether the approvals were last quarter or years ago. The data has no dates and no per-title counts.
   - **Who struggles to catch it:** students, and advisors without employer contacts. The numbers look strong, and only the employer can say whether it sponsors now. This is why network matches cap at Consider, and why the next action is "confirm current sponsorship".
