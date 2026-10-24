# healthins-ai-opt — human card (v0.2.0)

## Executive summary

Give it your OPT dates and a list of companies whose job boards you want watched. It reads the real openings, throws out the ones that cannot work for you (companies it cannot identify, senior titles, jobs outside the U.S., postings that ask for a citizen or too many years, postings that are already closed), checks the rest against the public visa-petition and funding records, and tells you for each survivor: apply now, talk to someone first, or skip. On 20 October 2026 it read 1,729 openings at 32 companies and left nine. None was an "apply now". Two would have been, on the repository scorer's own rule, because a strong sponsorship record alone is enough for it; a fit floor that the author added after the first run held them at "talk to someone first", and the report shows both answers.

## About this card

**Audience:** an international master's student, graduating in December, about to start OPT, deciding which insurance and health-tech AI engineering openings deserve their limited application hours.
**Agent twin:** `recipes/shreyashyadav1-healthins-ai-opt.md`
**Chapters:** 7 (sponsorship tier), 10 (timeline gate), 11 (scorer).

## Purpose

Answer: of the jobs that are open today at the companies I care about, which can I realistically land, which deserve a conversation first, and where is the engine blind?

## What it can verify

- The company behind a board has exactly one row in the 80 Days dataset, and what that row says about approved and denied H-1B petitions and the job titles sponsored.
- A posting exists on the company's public board, and on the day of the run its page opened and showed an apply button (or showed the closed message). The repository's own checker did this, in a browser.
- Phrases in the posting, quoted: "must be a U.S. citizen", "security clearance", "unable to sponsor", years of experience, a mention of E-Verify, an invitation to new grads.
- The date arithmetic: when you could start, how many unemployment days you would have used, and the break-even: how long a hiring loop can run before your clock gives out (for the example persona: up to 143 days keeps the full score; from 172 days the scorer treats the role as dead).

## What it cannot verify

- **That the board belongs to the company you named.** You supply that link. A wrong claim that happens to match a real row passes (it was tried). The engine only flags it if the board name and the company's website disagree. Nothing in the repository checks the link, and 12 of the 32 boards were added by name with no saved discovery output.
- **That past petitions were for your occupation.** The data lists job titles, not occupation codes. The software-type rule is a proxy.
- **That the petition counts are exact.** All 1,557 counts in the dataset are even numbers, which suggests the upstream join doubled them.
- **Anything about companies it cannot see.** 10 of the 32 boards could not be matched, among them Oscar Health with 247 openings. Large insurers and public companies are mostly absent from a dataset built from private funding filings. Silence is not "no sponsorship".
- **Whether a company raised money after 26 September 2025.** The data ends there.
- **That a posting without a citizenship phrase has no such requirement,** or that it is open tomorrow, or that the company is enrolled in E-Verify (needed for the STEM extension).
- **That the page the checker opened is the posting itself.** Its apply test is a word match. Coalition's stored link shows an Apply button and then redirects to the careers list, where an FAQ link containing the word "apply" still passes. The role is open at its real address, so the answer was right, but a closed posting that redirects to a careers page could read as open.
- **How long a company really takes to hire.** The loop lengths are your size guesses (from Chapter 10's three examples). Moving that one number changes the list: nothing changes between 84 and 144 days, four of the eight "talk to someone first" roles become "skip" at 150 days, and all nine at 171.
- **That the score is record-backed.** Of 29 numbers the scorer multiplied, 9 are records (the liveness checks). The sponsorship probability, the fit and the timeline are your inputs and the author's rules.
- **Anything legal.** STEM eligibility and day counts are your DSO's call.

## Annotated commands

One-time, needs the network and a browser:

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs
```

The decision run, offline, reproducible from the saved snapshot:

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 \
  --candidates assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json \
  --out-dir assignments/submissions/shreyashyadav1/runs/2026-10-20
```

Offline tests (45, no network):

```bash
node --test "scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/*.test.mjs"
```

## What it produces

- `report.md`: for you. How many roles survived each gate, decisions with the flags worth reading, the boards it could not score, what was excluded and why (with quotes), and the arithmetic for every role.
- `run-log.json`: for an agent. Every value with its label (record, your-input) and its source.
- `role-scores.json` / `role-scores.md`: the repository scorer's own output.
- `candidates.snapshot.json`: the dated list of postings the run used. Posting text is never saved in the repository.

## What you decide (the gate)

Before acting on anything: open the posting yourself, re-check your dates against your EAD card, and read the flags. "Consider" means talk to someone first. Write your decision in your run log. The tool never sends anything.

## Named failure modes

1. **A name that matches the wrong company.** "Abridge" is one letter away from "Abridged Inc", a row with a different website. "Clover Health" resembles "Clover Software Inc". "Lemonade Inc" and "Lemonade Technology Inc" share a website. A company that was acquired keeps its sponsorship history on a different legal entity from the one posting jobs (Augmedix is reportedly part of Commure now: outside knowledge, not checked here; the data cannot show it). Hardest to catch for a student who does not follow healthtech funding news: the row looks right and has approvals attached.
2. **An "apply" that sponsorship alone produced.** The scorer lets a proven sponsor clear its apply bar even at zero fit. On the real run the two strongest sponsors were a customer-facing solutions role and a front-end role; both were held at "talk to someone first" by the fit floor. Hardest to catch for the student who most needs a sponsor: "proven sponsor" is the last thing they read.
3. **An optimistic clock.** A startup's six weeks copied onto a larger company. The report prints the break-even so you can judge the estimate without trusting it.
4. **Titles are not levels.** "Software Engineer II" can ask for 3–5 years; "Member of Technical Staff" is not a rank. The screen reads the posting's own words, and still misses requirements stated elsewhere.
