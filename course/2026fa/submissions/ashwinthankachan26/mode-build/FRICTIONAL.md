# FRICTIONAL — Mode Build (backend-pivot-range)

## Executive summary

This is my honest log of building the Mode Build mode with an AI assistant (Claude, in Claude Code), over three sessions. It records what I tried and expected, what went wrong, what I decided, what the AI did, and what is still unresolved. Short version: I nearly resubmitted my earlier mode before realising the assignment asks for a new one. The AI did most of the code, the runs and the first drafts. I made the scope choices and every gate decision, and I changed the AI's suggestions where I disagreed. Entries 1 and 2 were written afterwards and are labelled so.

**Key:** **[A]** = I did or decided it · **[C]** = Claude did or proposed it.

**My key prompts, quoted short:** "Start option A … now. … Leave the old branch alone." (choosing the mode) · "Fetch fresh postings" · "Approve as drafted" (config) · "Software Developers" (SRE pin) · "Outside my backend target" (Developer Advocate) · "All 18 were open" (G3) · "6 — drop the SDET" (G5) · "Keep separate" (spellings) · "I attest — sign it"

---

## 1. 2026-10-19 → 10-20 — deciding what to build (retrospective, written 2026-10-21)

- **Tried / expected.** [A] I asked Claude to complete Mode Build from my Recipe Design work (PR #41). I expected to resubmit that mode with fresh runs.
- **What happened.** A friend's AI assistant pointed out that the brief says "Design and run a **new** mode", and my Recipe Design mode had already been submitted and graded. [C] checked and confirmed: the course repo has a separate 100-point Recipe Design assignment, and the Canvas Mode Build text is the Summer 2026 brief ("successor to the 25-point Mode Design"), so it doesn't match this term.
- **What I did.** [A] Decided to build a new mode instead of resubmitting. Kept PR #41 open rather than closing it. Planned to ask the TA whether building on it was allowed (no answer recorded yet).
- **Claude / me.** [C] proposed three options (AI-resilience, ghost postings, E-Verify). [A] chose AI-resilience (Cognitive Pivot). [A] approved downloading O*NET. [C] recommended reusing my Oct 19 postings; **[A] rejected that and asked for a fresh fetch.**
- **Evidence.** branch `mode/ashwinthankachan26-backend-pivot-range` (base `015843d`); PR #41 unchanged.

## 2. 2026-10-20 — build and first real runs (retrospective, written 2026-10-21; runs made by Claude)

- **Tried / expected.** [C] wrote the tests before the code, then ran the mode on 95 real postings. [C]'s prediction was written before the fetch (run log 6). **I did not write my own prediction before the run.**
- **What happened.**
  - Run 1 found 3 bugs ("Sr." broke title matching; qualifier words blocked matches; a whole posting was read when no duties header was found).
  - Run 2 crashed **after** writing half its output.
  - The duties reader called 62 of 62 readable postings "judgment-heavy."
  - The liveness checker couldn't confirm 18 postings.
- **What was done.** [C] fixed each bug test-first and kept run 1 as evidence. The duties failure is reported, not hidden.
- **Evidence.** commit `aecab9f`; `runs/pivot-2026-10-20-run1-v0.1.0/` … `run3-live/`; WORKED-RUN *Broke during testing*.

## 3. 2026-10-21 — my gate decisions

- **Tried / expected.** [A] I expected data engineering to be safer from AI than backend. The data couldn't tell them apart (inside O*NET's error bars), so I'm keeping backend as my target.
- **Friction and response.**
  - [A] The 3 SRE titles matched two occupations, so I chose Software Developers, because SRE at these companies is production engineering and the research rating is older.
  - [A] The 2 Datadog Developer Advocate postings: "Outside my backend target."
  - [A] The checker couldn't see the application forms on 18 pages, so I **opened all 18 myself: all were open.**
- **Claude / me: accepted, changed, rejected.**
  - [A] **Accepted** the drafted config values as my decisions, after reading each written reason.
  - [A] **Accepted** the SRE reason as worded.
  - [A] **Changed** Claude's G5 list of 7 postings by dropping the SDET (test automation isn't my backend focus). My final tailor list is 6.
  - [A] Agreed with the logged example of the duties rule's mistake (G4).
  - [A] Approved the reflection draft without its optional parts.
  - [A] Re-ran the tests myself (33/33) and signed the attestation.
- **What I understand now.**
  - The same job can belong to a different official occupation just because of how its title is spelled ("Back End Software Engineer" → Web Developers; "Software Engineer, Backend" → Software Developers).
  - A score table can look decisive when the gaps are inside the error bars.
- **What I still don't understand or haven't resolved.**
  - Whether building on my Recipe Design mode would have been allowed (TA not yet answered).
  - Whether any occupation gap is real if O*NET's rating errors are correlated. The data doesn't say.
  - Whether a duties rule can work at all: I haven't labelled the 20-posting blind sheet yet.
- **Evidence.** commits `6ef3d32`, `3a25f12`, `4dcb6cf`; `config.json → pins`; run log 6 (2026-10-21 entries); `runs/pivot-2026-10-21-run5-final/`.

## 4. 2026-10-21 — checking the source myself, an outside review, and a last decision

- **Checking the source myself.** [A] I searched O*NET's own website (onetonline.org) for "Back End Software Engineer". The closest match was **15-1254.00 Web Developers**, with Software Developers second. That matches the mode's main finding, from O*NET's own search.
- **Outside review.** [A] I asked Claude to grade the submission like a strict TA. It found four problems, all confirmed and fixed:
  - stale summaries (run log, test count, TODO count);
  - the reflection placed before the final run;
  - the domain justification over one page;
  - **no Frictional log at all.** Claude had followed the Canvas rubric, which doesn't list Frictional, and not the course rule that every assignment includes it. This log was written then, so entries 1 and 2 are retrospective.
- **Compared with a classmate's log.** [A] I added my quoted prompts and this source check after seeing how a classmate's log was set up.
- **Last decision (TODO #3).** [A] "Keep separate": "backend", "back-end" and "back end" aren't merged. O*NET's own lists are the record, and the mismatch is the finding. It changes nothing in this run.
- **Last build (TODO #5).** [C] Added a second error assumption: every occupation now shows whether a difference is real under both. In the final run, none is. Routing didn't change.
- **Evidence.** run log 6 (2026-10-21 entries); `runs/pivot-2026-10-21-run6-final/`; `config.json → title_normalization._spelling_decision`.

## 5. 2026-10-21 (late) — a second outside review, and a privacy fix

- **What happened.** A classmate's AI assistant reviewed my PR strictly (about 67/80 before the presentation). [C] checked every point against the files, and most were right:
  - PRIORITIZE only meant "a duties heading was found";
  - rule-made matches were labelled as records;
  - two headline titles aren't O*NET titles;
  - G3/G4 had no per-posting records;
  - **my real visa status and graduation month sat next to my name**, which DATA_CONTRACT treats as personal data.
- **What I decided.** [A]
  - Refuse to rank on a duties reading that separates nothing.
  - Approved my corrected reflection.
  - Gave per-posting G4 checks for my 6 picks.
  - For privacy, after reading the rule: describe the fictional repo persona Aarav Patel instead of me, and re-cut the branch.
  - I didn't label the blind sheet before the deadline.
- **Still unresolved.** Whether my old PR #41 (which used my real planned dates) needs the same fix. I'm asking the TA.

## What I learned

A job title alone doesn't tell you which official occupation a job is. The score can change just because of spelling. A number in a table can look certain when the gap is inside the error bars.

## What I would do differently

Next time I would read the brief's "new mode" line and check the course's grading rules (like the Frictional log) before starting, and I would write my own prediction before the first run.

## Next step

Label more postings blind before changing the duties rule, and compare O*NET's "needs judgment" with real AI-usage data (the Anthropic Economic Index, TODO #6).
