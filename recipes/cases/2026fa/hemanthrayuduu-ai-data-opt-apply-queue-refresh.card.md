---
status: RUNNABLE-SAMPLE  # mirrors the recipe (v0.1.1)
todos_open: 0
last_gate: "sample-run (v0.1.1), 2026-10-19, Hemanth Rayudu, logs/runs/2026fa-hemanthrayuduu-2.md"
attestation: null
recipe_version: 0.1.1
type: card
---

# Weekly apply-queue refresh — human card

**Audience:** an international student or graduate on F-1 OPT, targeting AI, ML or Data Engineer roles, who needs H-1B sponsorship and keeps a shortlist of postings.
**Agent twin:** `recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md`
**Engine layers:**
- **Job-Ops:** liveness, checked two ways, plus the job descriptions.
- **The visa timeline:** the clock gate.
- **80 Days to Stay:** company sponsorship records.
- **Cognitive Pivot:** role-quality context, shown but not scored.

## Executive summary

This card explains what the weekly refresh tells you about your shortlist, and where it can still mislead you. Each week it checks every posting on your list two ways, re-reads each description for the sentences that usually decide eligibility, recomputes your OPT clock, and re-scores the list. Postings it can't confirm are set aside for you to check, never guessed. Nothing is final until you clear the three gates at the bottom.

## When to use it

- Once a week while your shortlist is open.
- Before you spend application time on any list older than a week.
- Right after your unemployment-day count changes.

Not for building a shortlist, and not for legal questions.

## How to read the report

1. **This week's queue:** one row per posting, with its liveness (record), timeline (your input), fit (record), sponsorship tier (your input), the engine's score and its recommendation.
2. **Investigate by hand:** the page check and the board data disagree, or couldn't tell. These rows aren't scored on purpose. Open each link yourself.
3. **Closed since the shortlist:** both checks agree the posting is gone, and the engine's own gate zeroes it.
4. **Changed since the last refresh:** an edited description is your cue to re-read it before applying.
5. **What the descriptions say:** the sponsorship, visa, citizenship, clearance and years sentences, quoted. The tool doesn't interpret them; you do.
6. **The OPT clock:** your expected start, the days used by then, the days left, and the factor. It also shows what happens at other start times. Eligibility questions go to your DSO.

## What it can verify

- That the posting is still on the board today, by two independent checks, and whether they agree.
- What the description says today, and whether it changed.
- The clock arithmetic from your dates.
- Which of your résumé's titles and skills literally appear in the posting.
- The company's H-1B approval record.
- The national BLS context for the role.

## What it can't verify

- **That a live page means the role is still being filled.**
- **That the company will sponsor this role.** Its record is history, not a promise.
- Local pay.
- Your eligibility for an extension or an early start.
- Each company's real hiring timeline (one value is used for all).
- What a quoted sentence means for you.
- Real suitability beyond word matching. For example, "Anywhere in the US" isn't read as remote.

## Named failure modes

1. **Live page, dead requisition (a ghost posting).** The page loads, the board still lists it, and both checks say *live*, but the team stopped hiring weeks ago. *Hardest to catch for:* an international student with no recruiter contact who can't ask, and who is spending unemployment days on applications that can't land. *Mitigation:* both checks must agree; G1 has you open every link; posting age isn't checked yet (see the worked run's next steps).
2. **The clock moves, the list doesn't.** A role that fit your calendar when you shortlisted it no longer does, because the unemployment days kept accruing while the list stayed the same. *Hardest to catch for:* someone who counted their days once, at the OPT start. *Mitigation:* the clock is recomputed on every run, shown with its dates and with other start times, and you confirm it at G2.
3. **The quiet edit.** "Unable to sponsor" or "5+ years" is added after you shortlisted the posting; the URL is the same, so the list looks unchanged. *Hardest to catch for:* someone who read the description once. *Mitigation:* a description hash compared against last week; the deciding sentences are quoted; G3 has you read them.

## Gates (you clear these; each is logged with who, what, when)

- **G1 liveness:** open every Apply, Consider and Investigate link. Live means a description and an Apply button.
- **G2 timeline:** confirm your OPT dates, your unemployment-day count and the time-to-start. Eligibility questions go to your DSO.
- **G3 release:** read the quoted sentences for every row you'd act on, then name the rows you release for this week. This is a release decision, not an application record.
