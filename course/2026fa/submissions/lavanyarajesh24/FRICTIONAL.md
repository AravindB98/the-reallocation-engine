# FRICTIONAL — honest log of building network-targets-swe

## Executive summary

This is my record of what I actually tried, what I expected, what went wrong, and what I
changed. It also separates my decisions from the AI assistant's work.

The short version:
- I used Claude Code to read the repository and write the code and first drafts.
- I spent much of the first session not understanding the git workflow, and asked for it
  to be explained step by step.
- I restarted the setup once from a clean clone of my fork.
- I made the decisions that changed the result: the recipe choice, the persona and its
  dates, and cutting the file count.

The prototype's first run was wrong in ways I would not have predicted (foreign and senior
jobs on the apply list). The corrections are below.

> **How this log was written:** Claude drafted the entries from our session transcript and
> from my answers to its questions. I confirmed each one. Where I didn't do something
> myself, the entry says so.

## Log

| # | When | What I tried / expected | What happened | What I checked, changed or learned | Who | Trace |
|---|---|---|---|---|---|---|
| 1 | 2026-09-28 | Expected to start writing code right away | Claude cloned the upstream repo and read the docs, then asked me for my handle, my visa situation and network permission. I didn't understand why. | I stopped it and asked for an explanation of the whole assignment first. I didn't understand what the assignment was asking, what a "recipe" was, or why my GitHub handle and visa details were needed. I asked for every step to be explained simply before anything else was done. | me | session transcript |
| 2 | 2026-09-28 | Expected the engine checks to "just work" | `npm run doctor`, `npm run verify` pass. `ats:scan --dry-run` fails: "portals.yml not found". `ats:liveness` needs Chromium, which isn't installed. | `ats:liveness` not run; listed under "Did not test". | AI ran, I decided not to install Chromium | TEST-REPORT §1, worked-run "Did not test" |
| 3 | 2026-09-28 | Assumed the scorer reads a student profile correctly | Running the scorer with `--profile` set to `"F-1 STEM OPT — work authorized (EAD)"` returns `profile_needs_sponsorship: false`. | Prototype never passes `--profile`; reported as an engine defect in the recipe. | AI found, I accepted | recipe "Can't verify" table |
| 4 | 2026-09-28 | Expected Form D samples to give a funding signal | 0 of 200 sample filings match any company in the 80 Days CSV (mostly investment funds). | Funding comes from the CSV's own columns instead; the 0-match count is reported, not hidden. | AI found | log `formd.matched` |
| 5 | 2026-10-01 | Thought forking / branching would show on GitHub immediately | Branch existed only on my laptop until pushed. A "recent pushes" banner on the professor's repo worried me that everyone could see it. | I panicked that everyone visiting the professor's repo could see my branch. I learned the "recent pushes" banner shows only to me, and a push to my fork doesn't touch his repo — only a pull request reaches him. | me (question), AI (explanation) | — |
| 6 | 2026-10-01 | Working from a clone of the professor's repo | I was uneasy working on a local copy of his repo instead of my fork | **I deleted everything local and restarted from a clean clone of my fork.** I was worried about working from a local copy of the professor's files in case something changed on GitHub, and I was lost enough that I wanted to restart from step 0 and understand each step. | me | fork `origin` = LavanyaRajesh24 |
| 7 | 2026-10-02 | — | Asked whether my email would be public in commits | **Chose to keep my university email** as author after seeing what each option looks like | me | commit metadata |
| 8 | 2026-10-02 | Predictions written before code | CHANGE-BRIEF committed and pushed first | Timestamp shows predictions came before the code | me (push), AI (draft) | `522d75a` |
| 9 | 2026-10-02 | Asked why not use an existing persona | None of the four existing personas is pre-OPT | **Chose a new fictional persona** matching my situation | me | `inputs/persona.json` |
| 10 | 2026-10-02 | Expected the first real run to be roughly right | Apply list had Datadog roles in France, MongoDB roles in Canada, and Senior/Lead roles. Scorer skip rate 3 %. | "MA" matched inside "Manitoba"/"Madrid" (substring bug). Fixed with whole-word matching and seniority excludes. First run kept in `runs/first-pass/`. I opened the first-pass report and saw the Canadian, French and senior rows myself. | AI found + fixed; I checked the rows | `6bf9688`, `runs/first-pass/` |
| 11 | 2026-10-02 | Expected most guessed board slugs to work | 7 of 20 returned HTTP 404 | Saved as errors → "unchecked", not "no jobs". This matches my CHANGE-BRIEF prediction. | AI | `boards-snapshot.json` |
| 12 | 2026-10-02 | — | Cambridge Mobile Telematics' Greenhouse board had 1 listing: an internships page | "No match on this board" ≠ "no openings". Added to can't-verify and failure modes. | AI noticed | worked-run Reflection |
| 13 | 2026-10-02 | A deliberately corrupted fixture file | It would have failed the repo's JSON conformance check | The test now generates the corrupted file at runtime | AI | test 6 |
| 14 | 2026-10-02 | Wanted to know the tests actually test something | Re-introducing the substring bug made test 1 fail on "Manitoba, Canada" | The tests catch the first-pass bug. I did not re-run this mutation myself; I ran the full test suite on a fresh clone (entry 18). | AI ran | TEST-REPORT §3 |
| 15 | 2026-10-02 | — | **I asked why the PR had 48 files** when others had about 20 | 20 per-company board files merged into one snapshot; first-pass scorer copies dropped; 7 tests still pass with identical results | me (question), AI (change) | `b8ebccb` and earlier |
| 16 | 2026-10-02 | — | The persona assumed a May 2027 graduation. **I pointed out I graduate December 2026.** | Persona OPT changed to 2027-01-15; re-run gave the same buckets; logged as a CHANGE-BRIEF revision, not a rewrite | me | `c008f57` |
| 17 | 2026-10-02 | Expected the scorer's labels to match mine | The scorer prints sponsorship `0.9 [record]`, but 0.9 is from my tier rule | Not fixed. Listed as the first "next improvement". | AI noticed | worked-run Reflection |
| 18 | 2026-10-03 | Wanted to see it work for myself, not just take the AI's word | I cloned my branch fresh from my fork and ran the program, the 7 tests, and a deliberate break (an OPT window that already ended) | Same result as the working copy (133 → apply 8 · network 5 · check-board 120); 7/7 tests pass; the break halted with exit 3 and decided nothing | me | TEST-REPORT §5, worked-run Attestation |

## Accepted, modified, rejected

- **Accepted from the AI:**
  - the network-targets design;
  - DRAFT status, because three typed TODOs are open;
  - not passing `--profile`;
  - keeping unchecked companies away from the scorer.
- **Modified:**
  - persona dates (my correction);
  - file layout (my question led to one snapshot file);
  - write-ups: none edited by me before this point. I reviewed the drafts, ran the clean-clone checks, and answered the questions used to fill in this log.
- **Rejected:**
  - starting from a clone of the professor's repo — I restarted from my fork;
  - using an existing persona;
  - hiding my commit email;
  - downloading Chromium.

## Unresolved questions

- Should the scorer accept two labels per term, so a derived probability can carry the
  record it came from?
- Is "Software Engineer II/3" an entry-level role for a new graduate? My filters let it
  through.
- How stale can an approval count be before "Proven" is misleading? The data has no years.
