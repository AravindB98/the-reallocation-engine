# ms-is-swe-opt-shortlist — human card

**Audience:** an international master's student (Information Systems, graduating December 2026, F-1 OPT) deciding which entry-level software engineer applications deserve their two research-and-apply hours.
**Agent twin:** `recipes/cases/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist.md` · **Status:** DRAFT, version 0.1.0

## Purpose

Answer: for the companies I am considering, does the repository's record show sponsorship history, does my OPT clock leave enough time to wait for a hire, and what should I do next with each one — apply, consider, skip, or network?

## What it can verify

- A company's row exists in the 80 Days CSV, and what that row says: approvals, approval rate, top sponsored titles, latest funding date and stage.
- The countdown arithmetic from the dates you typed.
- That the existing scorer produced each Apply / Consider / Skip, with its arithmetic printed.
- That a name matched exactly, once, or that it didn't.

## What it cannot verify

- Whether a company sponsors **entry-level** software roles. The CSV lists top titles only. "Non-senior title" is wording, not proof.
- Whether a company sponsors **now**. The funding data ends 2025-09-26, and approval counts are history.
- Whether a posting is live. You run the checker and type the result; the program trusts you.
- Whether a posting is **open to you**. Text such as "U.S. citizenship required" is invisible to every dataset here. You read it, and you record it as `excluded_reason`. (Found on a real posting in the worked run.)
- Anything about a company that is **not in the file**. The data comes from startup funding filings, so large employers can be missing, and a missing row is not evidence that they don't sponsor.
- Who the employer is when a **staffing agency** posts for an unnamed client.
- Whether a role you would take **without sponsorship** (for example a contract role on OPT) is allowed on your OPT. Mark such a posting `"track": "opt-bridge"`. The program then checks only that the posting is live (as you typed) and that your timeline has room, and it uses **no sponsorship score**. Whether the role is a contract, in your field and permitted on your OPT is for you to confirm with your school's international office and the employer.
- Your real OPT end date, the true length of your allowance, or H-1B cap timing.
- Pay for an entry-level role in your city. The wage shown is the national median for the occupation, and it moves no decision.

## Dependencies

Node 20+, `npm install`. The repo files named in the recipe. No network and no API key for the prototype; the optional liveness check needs a Playwright browser.

## Annotated commands

Sample run (writes only into your own folder):

```bash
node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
  --postings scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/fixtures/postings.fixture.json \
  --csv scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/fixtures/mini-80days.csv \
  --as-of 2026-10-02 --opt-start 2027-01-15 --out-dir course/2026fa/submissions/Vrajesh-works/runs-fixture
```

Tests: `node --test scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.test.mjs`

## What it produces

A report you read (`shortlist-report.md`) and a log for the agent (`shortlist-log.json`). The gate line always says **NOT CLEARED** until you do it.

## Named failure modes

1. **Stale snapshot** — the data ends in September 2025. A company can look recently funded and still have stopped hiring. Mitigation: the report prints the gap in days; treat funding as a hint, not a vote.
2. **Title wording mistaken for level** — "Software Engineer" in a sponsored-titles list can be any level. A new graduate may trust a "Proven" tier that was built on senior hires. Hardest for a first-time job seeker to catch. Mitigation: the report labels this an inference; ask a person at the company.
3. **Confident-looking probability** — 0.9 reads like a measurement but is a rule you chose. Mitigation: it is labeled as a rule over record fields and the thresholds are printed.
4. **A false Skip for a young company** — a startup with no approvals on record scores None and drops to Skip, even if it is hiring new graduates and simply never needed to sponsor before (the worked run's Confido case). Mitigation: read "None" as "no record", not "won't sponsor", and check the employer's own records before discarding it.
5. **Transcription error in liveness** — a typo (`live` for a dead posting) opens the gate wrongly. Mitigation: the gate is cleared by a person who opens the posting.
