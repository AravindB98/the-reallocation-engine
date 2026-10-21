# Five-minute demonstration — Experienced Java Backend Opening Triage

## Executive summary

This is a timed plan for the in-class show-and-tell. It covers the four things the rubric asks
for: the situation, the information asymmetry, one thing learned from running it, and one honest
limitation. It uses only the terminal and two files. Every number it mentions comes from a
committed run. The lines marked **[Aditya]** must be in Aditya's own words. The presentation date
has not been confirmed.

## Before class (once)

```bash
cd <a clean clone or worktree of branch contrib/2026fa-aditya-raj-sde-java-backend-early2027> && npm install
# (locally the branch is already checked out at /Users/adityaraj/Desktop/the-reallocation-engine-a2,
#  so `git switch` to it from the Assignment 1 checkout would fail)
node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs   # expect 45/45
```

Open `course/2026fa/submissions/aditya-raj-sde/assignment-2/runs/real-replay-v0.3/triage.md` in a
viewer.

## Timeline

| Time | Show | Say (outline) |
|---|---|---|
| 0:00–0:45 | the recipe's "Situation" table | Who it is for: an international master's student with years of full-time Java backend experience and an early-2027 start date. Not a new grad, not yet "senior". Public runs use a fictional 4.5-year persona. **[Aditya]** why this is your situation in general terms (no private details). |
| 0:45–1:30 | `DOMAIN-JUSTIFICATION.md`, "The information asymmetry" | Three things are hard to see: where you sit against the real bar; whether *this opening* (not the company) works; whether the posting is really listed. All 12 real postings came from employers with 1,250+ recorded approvals, yet none of the 12 said anything about sponsorship or a start date. |
| 1:30–3:00 | **live:** the replay command (below), then the decision table in `triage.md` | The mode skipped 5 of 12 for stated minimums (5–10 years) above 4.5 full-time years, each with the quoted line. Point at one Databricks row: Java, Kafka, and AWS all match, but "5+ years" is required. The co-op would make it exactly 5.0, and the posting is silent on co-ops. |
| 3:00–4:00 | **live:** `break-test.mjs` (about 15 s), or evidence `10b` if time is short | **One thing learned:** the Pinterest pages returned a bot challenge to the checker, which called them "expired" even though the employer's own feed listed them. Turn off the feed rule and 4 real postings are wrongly skipped. Let a keyword match override experience and 5 come back. **[Aditya]** what surprised you. |
| 4:00–4:45 | the recipe's "What it cannot verify" | **One limitation:** it cannot tell you any opening will sponsor (all 12 were silent), and it says nothing about work authorization. The rules were corrected on these same 12 postings, so accuracy on new postings is unknown. |
| 4:45–5:00 | — | Status: DRAFT pending human review, targeting RUNNABLE-SAMPLE. Next: a held-out check and capturing application-form questions. |

## Live command (offline, about 1 s)

```bash
node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run \
  --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json \
  --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json \
  --out-dir "$TMPDIR/demo"
```

Expected first line: `✓ 12 openings (replay-of-captured-excerpts) → skip-application 5 ·
human-requirement-review 1 · human-eligibility-review 1 · human-liveness-review 4 ·
seek-vacancy-sponsorship-evidence 1`.

Say explicitly: **this is a replay of postings captured on 2026-10-21, not a live check today.**

## Fallback

If the projector or network fails, show `WORKED-RUN.md` sections 4, 6, and 7. They contain the
same output, pasted verbatim.
