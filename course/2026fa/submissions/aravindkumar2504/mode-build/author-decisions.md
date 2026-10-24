# Author decisions for the mode build

## Executive summary

This page records the choices I made about how the mode behaves before its live run, and what I decided, checked and picked after it. Before the run I chose which job postings it should drop on its own, how many postings I review by hand, the evidence bar for each sponsorship tier, and whether to run on a company table older than the mode's own limit. Every setting below was a proposal until I picked it. Read it to see which numbers and calls are mine and which are still only proposals.

The assistant wrote every question and every option I picked from. Each question, its options and my pick are kept word for word in `author-picks.json`, in this folder.

## Before the run (2026-10-19, Pacific time)

On 2026-10-19 at 17:15 Pacific (00:15 UTC on 2026-10-20) I told the assistant to build the Mode Build on my existing recipe, in these words: "build on the existing mode".

I picked each option below from a short list of choices at 17:43 Pacific (00:43 UTC on 2026-10-20). For each question the assistant had marked one option as recommended, and I picked that option every time. The reason beside each choice is the one given with the option I picked.

## Decisions

| Setting | My choice | Why (the reason given with that option) |
|---|---|---|
| Contract and temporary roles | Drop them automatically | Contract and temporary roles rarely come with H-1B sponsorship, so for a candidate who needs it they waste a review slot. The first rehearsal picked one (a contractor DevOps role). |
| Titles that require a PhD | Drop them automatically | The candidate is finishing a master's degree, so a PhD-only role is not open to them. The first rehearsal picked one. |
| Postings sent to the human gate | 8, one per company | About 20 to 30 minutes of reading, and it covers eight different companies. |
| Sponsor tiers | Keep as proposed: Proven = 10 or more approvals at 90 percent or more; Likely = 4 or more at 70 percent or more | Ten approvals means one filing or a double-counted record cannot carry a company to the top tier, and 90 percent keeps out companies with a visible denial history. |
| Gate G0, data age | Run, with the stale-data warning | It is the only company data the repository has. The report says on its first screen that funding and sponsorship counts can be out of date, and the posting check uses today's job boards anyway. |
| Funding window | Keep 24 months | Two years is a rough signal that a company may still be hiring. It is not a tested predictor, and the report says so. |
| Days from applying to a start date | Keep 75 days | About two and a half months for interviews, an offer and onboarding: one assumption for every company, labelled as mine. |

## What is still a proposal

- **The title rules:** the backend-family title rule, its senior-level markers, and the rule that drops senior, staff, principal and lead titles. I did not change them; they are tested on the run but not decided by me.
- **The U.S.-location rule.**
- **The order in which the cap of 8 takes companies:** best score first, ties broken by name.
- **The 6-month limit on the data's age.** I chose to run past it, but I did not set it.
- **The tier values sent to the scorer.** 0.9 and 0.6 come from the book's worked example; 0.3 is the assistant's design value, chosen so that a Thin record is set aside. None is an estimate of any company's chance of sponsoring.

## After the live run (2026-10-20)

All times in this section are UTC; Pacific time is 7 hours earlier.

### Gates H1 and H2 on the chosen postings (08:58 to 09:03)

The assistant opened the 8 chosen postings in browser tabs at about 08:54, a minute after the liveness checker re-ran on the same links. I looked at each tab and picked one answer per posting, between 08:58 and 09:03.

The questions asked whether the page was a real, open job at that company, and whether anything said no sponsorship or needed a U.S. citizen, a green card or a clearance. They did not ask about start dates.

- **Seven were "Looks fine":** Cohere Health, Databricks, Figma, Mercury, Sigma Computing, Stripe and Verkada.
- **Xage Security was "Page broken or gone"** (the option read: it shows a "Not found" or 404 page, so the job isn't open), as the checker had said. So gate H2 was decided on the 7 live postings.

My answers are in the run's `gate-decisions.json`, word for word.

### My own checks (20:34 and 20:35)

| What I ran | What I saw |
|---|---|
| `npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/5194598007"` | active |
| `npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/1"`, a made-up job number, to try to break it | expired, with "redirect to https://job-boards.greenhouse.io/verkada?error=true" |

### My reflection picks (20:37)

Each pick below is the option's label, then its wording as offered.

- **What went well:**
  - "Gate caught Xage": the liveness check caught the Xage posting as gone (404), even though its job board still listed it.
  - "Useful quotes": the screen pulled out sentences I could skim past, like the Databricks export-control line and Verkada's "we do sponsor".
  - "Fake job caught": my own break attempt (a made-up job number) came back expired, not active.
- **What the mode got wrong or missed:**
  - "33 unreachable": 33 of 59 shortlisted companies could not be checked live, because no job board was found for them.
  - "Alphabet tie-break": the cap of 8 chose among equal scores by alphabet; Zscaler (802 approvals) was left out while Xage (24) was kept.
  - "Old company data": the company data is about 13 months old, so the sponsorship counts may be out of date.
  - "Fit not scored": it does not check whether the candidate fits each job; every Proven company ends up with the same score.
- **What should come next:**
  - "Tie-break by approvals": break ties by number of approvals, then approval rate, before the cap of 8 is applied.
  - "Reach more boards": reach more companies, by supporting more job-board systems or keeping a checked list of each company's board.
  - "Add a fit input": add a labelled fit score so companies stop tying at the same score.
  - "Fresher data": find a fresher, documented source for the sponsorship counts.

### What surprised me (picked at 06:20 UTC on 2026-10-21)

- "Listed but gone": Xage's job board still listed the posting, but the page itself was gone (404).
- "Start-date gap": nothing checked whether an employer would wait until the candidate can start, about seven months after the postings.
- "Everyone tied": every Proven company got exactly the same score (0.315), so the cap of 8 picked by alphabet.

### The rule for a conditional export-control clause (20:44)

Databricks's posting says it may decline an applicant if the job needs export-controlled technology and a government license. I had marked it "Looks fine"; the option I picked, as the assistant worded it, already called the export sentence "only a condition". The mode's earlier written rule stopped a posting on any export-control wording, so my call and the rule disagreed.

The rule question offered three options, each with its consequence for the run: pass and show the quote, hold and ask a recruiter, or block. I chose "Pass, show the quote": it's a condition, not a no, so the posting can clear, and the report keeps the quoted sentence so the reader sees it.

### My test runs (21:04 and 21:09)

I ran `node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs` twice: 123 tests, 123 passed, 0 failed, both times. The second run was after two lines of the recipe and the README were reworded.

### Reading the live report (answered at 04:35 UTC on 2026-10-21, the evening of 2026-10-20 in Pacific time)

My pick was "Read it": I read the whole report, meaning the summary, the table of 8 postings and the companies it couldn't reach.

### My checks after the review fixes (06:12 and 06:13 UTC on 2026-10-21)

| What I ran | What I saw |
|---|---|
| the sample run without `--accept-stale-vintage`, into `/tmp/tiers-break`, to try to break the mode's own code | "StaleVintageError: refusing to run", "exit code: 3", and `/tmp/tiers-break` was not created |
| `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs source "STRIPE INC"` | Stripe's raw row: 1,250 approvals and 22 denials; the rate redone as 98.27 percent and the wage ratio as 1.19, both "match" |
| `node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs`, a third time, after the review fixes | 123 tests, 123 passed, 0 failed |
