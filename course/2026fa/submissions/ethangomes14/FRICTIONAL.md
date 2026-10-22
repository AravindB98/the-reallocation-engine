# Frictional log — Data Engineer H-1B sponsor screen (mode build, 2026-10-20 to 2026-10-21)

## Executive summary

This is my log of the mode build on 20 and 21 October 2026. I wrote down what I tried, where things broke, where I changed my mind, what Claude did and what I decided, and what I still haven’t checked. The earlier design assignment has its own log. The other files show the finished mode, and this one shows how I got there, mistakes included. On the 20th, Claude built a version that finds new job postings by itself, and I ran it on 19 real ones. The one call I made that day was how weak a job match can be before an “Apply” gets knocked down. On the 21st, I went through the assignment one requirement at a time, re-ran the tool on my own laptop and read the report. Then I did the checks the tool can’t do for me. I confirmed four company legal names, opened all 18 live job links and confirmed my visa timeline. Once those were done, I could run it for real. That live run caught a date bug that had quietly turned off one of the checks. I’m stopping at the second-highest stage I can honestly claim: it’s live and I’ve done every human check myself.

## My Reflection

The biggest thing I learned is that the human checks are the actual work. On 20 October every machine check passed, but four companies still came back “not found” under their brand names, and three postings had been open for months or even years. The code couldn’t sort out either of those. It was only after I looked up the legal names and opened the links myself that Gemini, Upstart and Unite Us went from “unscored” to Apply. I also learned that a failure can be safe and still hide a problem. On the live run, the Greenhouse check got stamped with tomorrow’s date because one script used UTC and the other used my local time. The screen ignored it, which was the safe thing to do, so the results weren’t wrong, but I only caught it because the summary said “0 checked.” Now I read the one-line summary of every run instead of just looking for the numbers I expect. Keeping the records honest took more effort than I thought. Small edits kept voiding my attestation, so I had to re-run everything after each round and write down exactly what I did and didn’t do. I checked the legal names with a Google search, not company filings, and I confirmed the three long-open postings exist, but I don’t know if anyone is still hiring for them. That sounds less impressive, but it’s true. Going through the rubric before submitting saved me a lot of back and forth. It turned up a few small gaps a grader would notice: there was no Purpose section, the verify output had been cut off, two files disagreed on the break count, and one break attempt had no saved output. Each fix took a few minutes, and finding them after I submitted would have cost me points. If I did this again, I’d check each legal name on the company’s own terms page or in SEC EDGAR instead of trusting a search result, especially Unite Us, since its row in the sponsor file lists a different website. I’d also ask a recruiter about the three long-open postings before calling the mode done.

---
## 2026-10-20 — Building v0.5.0 and running it on a fresh day

Claude built three things for this version: a discovery script that pulls postings from public Greenhouse job boards and keeps Data Engineer-type titles, an alias table that maps brand names to legal names (my fix for the "Gemini" miss in the earlier assignment), and a flag for postings that have been open more than 120 days. The alias table only kicks in after exact matching fails, and only for entries a person has reviewed.

We asked 37 boards, the 7 from my earlier sample plus guesses for known sponsors. 14 of the guesses were wrong. 23 Data Engineer-type postings came back, and Claude narrowed them to the 19 in the US or with no location, then rated fit from the job titles. Those ratings are Claude's judgment, and they're labelled that way.

A few things surprised me. A Stripe sales job, "Account Executive, Product Sales (Data Pipeline)," got through the title filter just because it said "data pipeline," so we added "account executive" and "sales" to the exclusion list. Four companies came back "not found" under their brand names: Gemini, Robinhood, Upstart and Unite Us. Claude proposed aliases for all four, but none were used because I hadn't reviewed them yet. The one that surprised me most was a Robinhood posting first published in December 2022. Every machine check said it was open. That's the reason the age flag exists.

- **Evidence:** `logs/runs/2026fa-ethangomes14-6.md`; `WORKED-RUN.md` §1–§5.

## 2026-10-20 — The fit-floor decision

When I looked at the Apply list, it was really just a list of sponsors. For a company with a strong sponsorship record, sponsorship alone (0.9 × 0.35 = 0.315) already clears the 0.3 Apply line. So two senior "lead" roles that fit me badly (fit 0.3) came out as Apply, right next to the new-grad roles I actually want. Claude didn't change the scorer. It logged the problem as a `[TODO: DEFINE]` for me to decide.

I set a fit floor of 0.4. If something comes out Apply with fit below 0.4, it gets capped at Consider. The rule runs after the scorer, it can only lower a result, and the scorer's original answer stays in the log. The run went from Apply 7 · Consider 6 to Apply 5 · Consider 8. I know it's a blunt rule, since it depends on fit ratings that only look at job titles.

- **Evidence:** `rules.json` → `fit_floor`; `CHANGE-BRIEF.md` §3, change 5.

## 2026-10-21 — Checking the submission against the assignment

I pasted in the assignment and went through it one section at a time: the mode file, the justification, the worked run, the run log, the lifecycle and attestation, and then the rubric.

I wanted the mode file in `recipes/`. It's actually in `recipes/cases/2026fa/`, which is still under `recipes/` and is where `CONTRIBUTING.md` and the repo's CI expect student recipes. The assignment's own example sits in the same kind of folder, so I left it there.

This check found more than I expected. The mode file had no "Purpose" section, so I asked for one that says exactly when to use the mode and when not to. The `npm run verify` output I'd pasted had been cut off right before the line showing conformance passed, so I re-ran it and pasted the whole thing. The run log said six break runs and the attestation said seven. While fixing that, Claude found the seventh break attempt (bad input to the discovery script) had never been saved, so it ran it again and saved the output before I cited it.

I also asked about two things I didn't fully understand. The open TODO is the proposed DOL LCA visa data. It stays open because the data isn't in the repo, and the assignment wants proposed additions marked that way. G1 and G2 are the "is this the right company?" and "is this job really open?" checkpoints.

- **Evidence:** `assignments/submissions/ethangomes14/runs/terminal-verify-2026-10-21.txt`, `assignments/submissions/ethangomes14/runs/terminal-discovery-break-2026-10-21.txt`.

## 2026-10-21 — Re-running it myself, and a new attestation

Claude pointed out two problems. The attestation was signed "prepared with Claude Code for Ethan Gomes" and listed my own re-run under "Did not test," and the run log said I hadn't read the report. Both were out of date. I had already re-run the tool on my laptop and read the report, so I said that.

I didn't realize that the text edits I'd made that day technically voided the 2026-10-20 attestation. Once Claude flagged it, I asked for a new attestation in my name. Claude re-ran everything on the final files, saved the output with a hash of each file, and wrote the new attestation signed by me. The old one is still there, marked "superseded."

- **Evidence:** `assignments/submissions/ethangomes14/runs/terminal-attestation-2026-10-21.txt`; `WORKED-RUN.md` §Attestation.

## 2026-10-21 — Clearing the human gates

I asked where the human checks were. They're the "You must confirm before acting" list at the end of the report.

For G1, I checked each legal name with a Google search and confirmed all four aliases: Gemini → GEMINI SPACE STATION LLC, Robinhood → ROBINHOOD MARKETS INC, Upstart → UPSTART NETWORK INC, and Unite Us → UNITE USA INC. I also confirmed the six exact matches.

For G2, I opened all 18 "active" links and each one shows its job. The three long-open postings (Robinhood ×2 and Airbnb Data Stewardship) still show the job, but I don't know if anyone is actually hiring for them, so I'm not acting on them.

For G3, I confirmed my timeline inputs: OPT start on 1 March 2027, 90 days, a 10-day buffer and a 45-day hiring lag.

Before anything was written down, Claude asked me how I'd checked the names and what I actually knew about the long-open postings. The record says exactly what I did and nothing more.

- **Evidence:** `aliases.json` (`reviewed_by_person`, `reviewed_on`, `review_note`); `logs/runs/2026fa-ethangomes14-7.md`.

## 2026-10-21 — The live run, and the bug it found

I ran fresh liveness and Greenhouse checks on the 19 postings, then ran the screen as a live run. Three things broke, and all three are fixed.

First, the log would have called it a "sample" run because the run type was hardcoded. Claude added a `--mode sample|live` option and a test. Second, reviewing the aliases changed the old results. The documented 2026-10-20 command no longer gave its documented result once my reviews were in `aliases.json`. I hadn't thought about that at all. Claude froze the pre-review file as a sample so the old run still reproduces exactly.

The third one surprised me the most. I ran the Greenhouse check at 8:40 pm and it got stamped 22 October, because that script used UTC while the screen used my local date, 21 October. The screen ignored a check that seemed to come from tomorrow, so the first live run said "0 checked" and quietly dropped the cross-check without failing. Claude switched all three scripts to the local date, added a test, re-fetched and re-ran. I kept the broken outputs with `BUG` in their names.

The final result was Apply 8 · Consider 10 · Skip 1 · unscored 0, with the CSV cross-check at 19/19. Gemini, Upstart and Unite Us are now Apply, and both Robinhood postings are Consider. Only 5% were skipped. The scorer warns when that's below 50%, but I picked these boards because the companies sponsor, so a low skip rate makes sense here. For G4, I read the new live report.

- **Evidence:** `assignments/submissions/ethangomes14/runs/terminal-live-2026-10-21.txt`, `assignments/submissions/ethangomes14/runs/terminal-attestation-v0.5.1-2026-10-21.txt`; `WORKED-RUN.md` §6.

## 2026-10-21 — Choosing the status

I had to choose between RUNNABLE-LIVE and RUNNABLE-SAMPLE. The constitution wants zero open TODOs before either stage, and I still have one open. I asked Claude for advice, and it recommended RUNNABLE-LIVE. The open TODO leaves the same gap at either stage, the assignment requires proposed additions as typed TODOs, and a live run with every gate cleared and logged is exactly the evidence that stage asks for.

I went with RUNNABLE-LIVE and stated the strict-reading caveat in the recipe. It is not VERIFIED. I also decided nothing goes on GitHub yet. No commit, push or PR until I say so.


## Still open

- **Long-open postings.** Whether the three are still being filled. Only a recruiter or employee can answer.
- **Legal names.** A stronger check than a Google search: each company's terms page or SEC EDGAR, starting with Unite Us. Its sponsor-file website is `unite-usa.com`, not the company's domain.
- **Dated visa data.** The `[TODO: DATA SOURCE]` for DOL LCA filings, the only way to tell whether a company sponsors *now*.
- **Node 20.** It hasn't been tested on Node 20 (CI's version), or from a fresh clone of v0.5.1.
- **Submitting:** commit, push the branch, open the PR and build the zip, once I'm ready.
