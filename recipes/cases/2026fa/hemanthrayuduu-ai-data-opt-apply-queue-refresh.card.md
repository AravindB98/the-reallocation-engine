---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "live gate (G1–G3) cleared for v0.1.2 by Hemanth Rayudu on 2026-10-21 (logs/runs/2026fa-hemanthrayuduu-2.md)"
attestation: null
recipe_version: 0.1.2
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
- Whether a score just under the Consider floor means anything: the floor is an unpinned placeholder in the engine scorer.
- That your unemployment-day count is current: it's only as current as you keep it.
- Your eligibility for an extension or an early start.
- Each company's real hiring timeline (one value is used for all).
- What a quoted sentence means for you.
- Real suitability beyond word matching. For example, "Anywhere in the US" isn't read as remote.

## Named failure modes

1. **Sponsorship history counted for the wrong job family.** A company's H-1B record lists its top sponsored *titles*, and at all 4 companies in the sample none of those titles is an AI or data title: they're software, solutions, electrical, sales and product titles. So every one of the 8 AI / data postings is capped at "Possible" (p 0.4), and even a perfect fit can't reach Apply. Most of their SOC codes are also a family guess, not a title match. *Hardest to catch for:* an AI or data candidate who reads "this company sponsors" as "this company sponsors my kind of role". *Mitigation:* every row shows the tier and its basis; per-petition SOC data would fix it (a next step, in the worked run's backlog).
2. **The clock moves, the list doesn't.** A role that fit your calendar when you shortlisted it no longer does, because your unemployment days kept accruing while the list stayed the same. The refresh recomputes the clock each run, but from the count *you* give it: it doesn't add days by itself. *Hardest to catch for:* someone who counted their days once, at the OPT start. *Mitigation:* G2 has you confirm the count and the dates every run, and the report shows the factor at other start times (35 / 42 / 70 days).

Two more risks this card names but the mode can't catch on its own:
- **a ghost posting**: the page and the board both stay up after the role is filled. Opening the link (G1) is the only check;
- **a quiet edit**, such as "unable to sponsor" added later: the description hash and the quoted sentences make it visible from the second refresh on.

## Gates (you clear these; each is logged with who, what, when)

- **G1 liveness:** open every Apply, Consider and Investigate link. Live means a description and an Apply button.
- **G2 timeline:** confirm your OPT dates, your unemployment-day count and the time-to-start. Eligibility questions go to your DSO.
- **G3 release:** read the quoted sentences for every row you'd act on, then name the rows you release for this week. This is a release decision, not an application record.
