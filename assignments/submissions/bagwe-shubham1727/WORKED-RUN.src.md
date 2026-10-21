# Worked run — swe-opt-clock-live, 2026-10-21

## Executive summary

**What this is.** The record of running the new mode for real on 2026-10-21. It read the job boards of 20 Massachusetts companies with an H-1B sponsorship history, opened every new-grad software posting in a browser, and weighed each posting against a fictional unemployed OPT student's visa clock. Every command and its real terminal output is pasted below.

**Why read it.** It shows the mode ran against live data, and it shows exactly which conclusions came from records and which came from a person or an AI. It also covers the six times I tried to break the mode, including the two attempts that succeeded.

**What it found.**
- **A look-alike board is caught.** A slug guess for a Boston sponsor resolved to a different company's board, kept on purpose as a decoy. The engine's scan printed that company's posting under the sponsor's name, and the mode's board-ownership check dropped it.
- **The clock rules out everything.** For the student, who has 30 unemployment days left, all 15 real postings start too late under a typical hiring time.
- **A longer clock gives real decisions, and exposed a scorer problem.** With a fictional longer clock, the same postings produced real decisions. But the engine's scorer said "Apply" to five postings on sponsorship history alone. One of them asks for five years of experience. The mode now sends those to networking instead, and one posting gets the application block.
- **Two break attempts succeeded.** A deliberately wrong scorer slipped past the conformance check at first. That gap is now fixed. A careless human confirmation of the wrong board still can't be caught.

## Run record

- **Mode:** `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md` v0.1.0 (DRAFT) · scripts `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/`
- **When / where:** 2026-10-21, macOS, Node v24.14.0, Playwright 1.62.1 with Chromium headless shell 151 (installed for this run with the user's approval), branch `mode/bagwe-shubham1727-swe-opt-clock-live`
- **Who:** run by Claude Code (AI agent) for Shubham Bagwe. Shubham cleared gate G1a (board ownership) by name. G5 (per-job sign-off) is **not** signed.
- **Transcripts:** `runs/2026-10-21/terminal/NN-*.txt`, recorded by a wrapper that writes `$ command`, the combined output, and `exit=<code>`. The only edit is redacting the local repo path to `<repo>` and the home directory to `<home>`.

## 1. Inputs

| Input | Path | Kind |
|---|---|---|
| 20 public ATS boards (18 + 2 decoys) and the title/location filters | `scripts/contrib/…/swe-opt-clock-live/fixtures/portals-boston-swe.yml` | public data; the list is mine |
| Board-ownership decisions (gate G1a), append-only | `…/fixtures/board-decisions.yml` | **human gate**: 11 confirmed + 2 rejected by Shubham Bagwe, 2026-10-21 |
| 80 Days sponsor CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| BLS compact, Form D samples | `data/bls/compact/soc_occupation_compact.csv`, `data/sec/form-d/processed/sample/` | record |
| Student (fictional) | `search/examples/neel-kapoor/profile.yml`: 41 unemployment days used as of 2026-10-02, ceiling 90, buffer 15, OPT end 2027-06-14 | your-input (fictional) |
| What-if student (fictional) | `…/fixtures/persona-neel-whatif-day10.yml`: the same student with 10 days used as of 2026-10-21 | your-input (fictional) |
| Hiring time | `…/fixtures/time-to-start.json`: 45 days, an assumption | your-input |
| Fit ratings (what-if run only) | `runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-ratings.json` | **model-judgment**: written by Claude after reading each posting's requirements |

**How gate G1a was cleared.** It was one batch decision. Claude listed the 11 "strong" and 6 "weak" board ties, with each board's evidence, in a multiple-choice question. Shubham chose "Strong ties only", and the two decoys stayed rejected. The confirmed entries in `board-decisions.yml` therefore share the question's group label as their evidence string, transcribed by the agent. Each board's own evidence is in its proposed entry. For Cohere Health the tie is by slug and healthcare titles (37 US + 38 Hyderabad postings), not by city. A per-board review in Shubham's own words would be a stronger record, and the worked run counts this as a weakness (see Reflection).

No private data was read or used. `private/` holds only its README, and `data/ats/portals.yml` (the user's own file) was never opened: every run points the scan at the tracked portals file through `REALLOCATION_ENGINE_PORTALS`.

**How the board list was built** (before the mode existed, with the engine's scan as the detector):
- `python3 scripts/ats/detect-ats.py` can't run here (step 9).
- So I probed 207 slug guesses for 37 Massachusetts SWE sponsors from the CSV (69 slug guesses, up to 3 per name, each tried on Greenhouse, Lever and Ashby) with `npm run ats:scan -- --dry-run`.
- 24 resolved. The summary and every error line are in `runs/2026-10-21/discovery/probe-scan-summary.txt`.

## 2. Commands and their real output

### Step 0 — toolchain

<<<file:runs/2026-10-21/terminal/00-npm-install.txt>>>

```
<<<tail:7:runs/2026-10-21/terminal/01-npm-run-verify.txt>>>
```

```
<<<tail:16:runs/2026-10-21/terminal/02-npm-run-doctor.txt>>>
```

The doctor counts top-level `recipes/` only (33). It doesn't see `recipes/cases/`, so this mode's 8 TODOs are counted in its own frontmatter.

```
<<<file:runs/2026-10-21/terminal/03-tests.txt>>>
```

### Step 1 — the engine's own scan on the mode's boards (side-effect free)

```
<<<file:runs/2026-10-21/terminal/04-ats-scan-dry-run.txt>>>
```

The engine prints `COHERE HEALTH INC | Software Engineer, Security Agents | United States`. That posting is on `jobs.ashbyhq.com/cohere`, which is Cohere, the AI company. COHERE HEALTH INC posts on `job-boards.greenhouse.io/coherehealth`. I put that board in the portals file under COHERE HEALTH INC on purpose, as a decoy, after the probe showed it was another company. The point is that the scan has no way to know: it labels every job with the name it was given, so a wrong slug guess looks exactly like a right one.

### Step 2 — capture: boards, scan cross-check, browser check of every new-grad posting

```
<<<file:runs/2026-10-21/terminal/05-capture.txt>>>
```

Written: `runs/2026-10-21/capture/capture.json` and `capture-audit.md`. The cross-check compares the list of postings, not just totals. Every posting the scan printed is in the capture and vice versa, and 1,300 = 1,300 found.

### Step 3 — spot check with the engine's liveness CLI (plus a made-up posting id)

```
<<<file:runs/2026-10-21/terminal/06-ats-liveness-spot-check.txt>>>
```

The CLI agrees with the capture on both real postings: PathAI is active, and Formlabs is uncertain because its application form sits in an embedded frame. The third URL is a job id I invented. The CLI calls it *uncertain*, exactly like the real Formlabs posting. The engine alone can't tell a dead link from a framed form, which is why the mode adds the redirect rule (step 7, break 2).

**Why the 5 pages were uncertain** (a separate probe on the same day, `runs/2026-10-21/evidence-probes.mjs frames`). Each page embeds a `job-boards.greenhouse.io` frame that contains the apply button. The engine's checker reads only the top-level page:

```
<<<lines:1-8:runs/2026-10-21/terminal/17-evidence-frames.txt>>>
```

The full output for all 5 is in `terminal/17-evidence-frames.txt`. On every page the Greenhouse frame has "Apply" or "Submit application".

### Step 4 — evaluate, Neel today (60 of 90 days used → must start by 2026-11-20)

```
<<<file:runs/2026-10-21/terminal/07-evaluate-neel-today.txt>>>
```

From `runs/2026-10-21/evaluate-neel-kapoor/report.md` (pasted):

```markdown
<<<lines:5-9:runs/2026-10-21/evaluate-neel-kapoor/report.md>>>
```

<<<lines:26-42:runs/2026-10-21/evaluate-neel-kapoor/report.md>>>

### Step 5 — evaluate, what-if clock, pass 1 (10 days used → must start by 2027-01-09)

```
<<<file:runs/2026-10-21/terminal/08-evaluate-whatif-pass1.txt>>>
```

<<<lines:7-15:runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-worksheet.md>>>

### Step 6 — fit ratings (model-judgment), then pass 2

I (Claude) read each of the 7 postings through the Greenhouse job API and rated fit against the fictional student's profile: new grad; Python, Go, TypeScript; no full-time experience. The ratings and their one-line reasons are in `fit-ratings.json`, every one labeled `model-judgment`. The same read showed two things the mode doesn't capture:
- Klaviyo's "Full Stack Software Engineer – People Systems" asks for **5+ years**. Its title carries no level, so the title rule passed it.
- That posting was **first published 2026-05-29**, about 145 days earlier. The feed has the date, but the engine's providers drop it (proposed addition 4).

What the posting API says, re-read with a probe script so the claim is on the record (`runs/2026-10-21/evidence-probes.mjs postings`):

```
<<<file:runs/2026-10-21/terminal/18-evidence-posting-requirements.txt>>>
```

**One of my fit notes is wrong.** The SDET note says the posting asks for "2 years". The posting says **1–2 years**, which my first quick regex misread. I left the rating (0.35) and the file unchanged: it is the input the run used, and its hash is in the run log. A corrected reading might rate it a little higher, but that wouldn't change its block, because sponsorship alone already makes it an Apply and the fit stays under 0.5.

First pass-2 run, **before** the routing rule existed. Kept as evidence:

```
<<<file:runs/2026-10-21/terminal/09a-evaluate-whatif-pass2-fit-BEFORE-routing-rule.txt>>>
```

<<<lines:3-11:runs/2026-10-21/terminal/09a-decisions-table-BEFORE-routing-rule.md>>>

**The scorer said Apply to the 5+-years job with a fit of 0.1.** The reason is arithmetic. A "Proven" sponsor's vote is 0.9 × 0.35 = 0.315, which alone clears the scorer's 0.30 Apply threshold. I didn't change the scorer. The mode's own routing now sends an Apply carried by sponsorship alone, with fit under 0.5, to the networking block. The scorer's word is still printed unchanged.

Re-run with the routing rule:

```
<<<file:runs/2026-10-21/terminal/09b-evaluate-whatif-pass2-fit.txt>>>
```

```markdown
<<<lines:9-13:runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/report.md>>>
```

<<<lines:30-46:runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/report.md>>>

### Step 7 — deliberate break attempts

**Break 1: a capture 4 days old.**

```
<<<file:runs/2026-10-21/terminal/10-break-stale-capture.txt>>>
```

**Break 2: a made-up posting id passed off as a link a friend forwarded** (`runs/2026-10-21/break/fake-referral-link.json`).

```
<<<tail:8:runs/2026-10-21/terminal/11a-break-fake-link-capture.txt>>>
```

```
<<<tail:3:runs/2026-10-21/terminal/11b-break-fake-link-evaluate.txt>>>
```

**Break 3: a careless human "confirms" the decoy board** (a copy of the decisions file with one bad entry, never the real file).

```
<<<tail:3:runs/2026-10-21/terminal/12-break-decoy-confirmed.txt>>>
```

**This break succeeded.** With the bad confirmation, the mode attached COHERE HEALTH INC's 104 approvals (Proven) to Cohere AI's posting. It stopped only because the fit was missing. The board gate is only as good as the person clearing it, and the mode can't check that person.

**Break 4: a student profile with no `needs_sponsorship` flag and an undated day count** (`search/examples/aarav-patel`).

```
<<<file:runs/2026-10-21/terminal/13-break-undated-persona.txt>>>
```

**Break 5: a deliberately wrong scorer that adds the gates instead of multiplying them**, run on the real capture under the what-if clock. First attempt:

```
<<<file:runs/2026-10-21/terminal/14a-break-broken-scorer-NOT-CAUGHT.txt>>>
```

**This break also succeeded at first (exit 0, a report written from wrong scores).** The only conformance check then was "a closed gate must give Skip". Under the what-if clock no gate was closed, so an additive scorer looked fine. The fix is a G4 arithmetic check: the scorer's printed trace must use exactly the votes and gates it was fed, and its composite must equal (Σ vote × weight) × Π gates. Re-run:

```
<<<tail:14:runs/2026-10-21/terminal/14b-break-broken-scorer-caught.txt>>>
```

**Break 6** is the offline test suite's 21 cases (step 0). Each one feeds a wrong input on purpose: a past cohort date, an evening capture, a fit of 1.5, an unsigned rejection, a capture whose posting list differs from the scan's, and others.

### Step 8 — independent verification

```
<<<file:runs/2026-10-21/terminal/16-verification.txt>>>
```

Conformance on everything the mode touches (workflow step 7):

```
<<<file:runs/2026-10-21/terminal/19-conformance.txt>>>
```

### Step 9 — repo commands that could not run here (logged, not worked around)

```
<<<tail:4:runs/2026-10-21/terminal/15a-failed-detect-ats.txt>>>
```

```
<<<tail:5:runs/2026-10-21/terminal/15b-failed-bls-local-wage.txt>>>
```

```
<<<tail:3:runs/2026-10-21/terminal/15c-failed-sec-refresh.txt>>>
```

I didn't install `requests`, `pandas` or a `.venv` to force these through. The mode doesn't depend on them: board discovery used the scan, and role quality and funding are report-only.

## 3. Verified vs. inferred, line by line

**For the one posting that reached the 2-hour block** (PathAI, "Software Engineer I, Fullstack", what-if clock):

| Line in the report | Established by | Verified or inferred |
|---|---|---|
| The posting exists, in Boston (hybrid) | the Greenhouse feed at capture, and the engine scan's identical list | **verified** (record) |
| The page is open, with an apply button | the engine's `checkUrlLiveness` in Chromium; the posting id survived the navigation; the CLI agrees | **verified** (record) |
| The board belongs to PATHAI INC | Shubham Bagwe's G1a decision, from posting locations vs. the CSV city | **human judgment**, logged with name and date |
| 78 approvals, 2 denials, 97.5%, "Software Engineer I" sponsored | the 80 Days CSV, cross-checked by reading the row directly | **verified** (record). The years and SOC code aren't in the file |
| Tier Proven → p 0.9 | the inherited tier thresholds and tier→p table | **inferred**: a rule I chose, labeled your-input |
| "Software Engineer I" = SOC 15-1252 | a regex over the title | **inferred** (your-input), not an LCA record |
| Start 2026-12-05, timeline 1 | the 45-day hiring assumption + the persona's dates | **inferred**: the dates are fictional inputs, the lag is a guess |
| Fit 0.8 | Claude, reading the posting | **model-judgment** |
| Apply, composite 0.555 | the unmodified scorer; arithmetic re-done by hand in step 8 | **verified computation** on inferred and judged inputs |
| Goes to the 2-hour block | the mode's routing rule (fit ≥ 0.5) | **inferred** (your-input rule) |
| National median $133,080, job zone 4 | the BLS compact table | **verified** (record), report-only |

**For the run as a whole:**

| Claim | Verified or inferred |
|---|---|
| 1,300 postings on 20 boards; 15 passed the filters | **verified**: the engine scan printed the same list; 4 board totals refetched and equal |
| 10 active, 5 uncertain | **verified** as what the engine's checker saw. **Verified** (probe 17) that each of the 5 embeds a Greenhouse frame with an apply button. Whether each is open is still **not checked by the mode** |
| The Cohere posting belongs to a different company | **human judgment** (G1a), backed by the board's locations and titles |
| All 14 non-dropped postings start too late for Neel today | **inferred**: the arithmetic is right, but the 45-day lag is an assumption. A recruiter who can start someone in under 30 days would change it |
| 5 Apply results were carried by sponsorship alone | **verified computation** on the scorer's own trace |
| Sponsorship history means the company will sponsor this student | **not claimed anywhere**. The report says the opposite |

## 4. How I confirmed the output was real

- **Re-ran the engine's own commands on the same inputs.** The `--dry-run` scan matched the capture posting by posting, and the liveness CLI matched the capture's verdicts (steps 1–3).
- **Parsed every JSON** the run wrote (26 files, 0 failures).
- **Cross-checked counts against sources the mode didn't write:**
  - the CSV approvals and denials for 5 companies;
  - 4 board totals, refetched from the public APIs;
  - the composite for the one Apply, recomputed by hand.
- **Showed the dry-run scan writes nothing** (`data/ats` is unchanged), and showed evaluate is **deterministic**: the scorer input and output hash the same on a re-run.
- **Tried to break it six ways** (step 7). Four held, and two broke. One break is now fixed (the arithmetic check). The other is a limit the mode can't fix (a careless human gate), and it's now in the "cannot verify" list.

## 5. Reflection

**What went well.**
- The **cross-check against the engine's own scan** made the filter mirror trustworthy. It also turned the scan from "a command I ran once" into a step that runs every time.
- **Board ownership as a gate** paid off on day one. The engine itself had already mislabeled a posting.
- **Asking for fit last** meant 7 judgments instead of 15. Under today's real clock it meant none, because the clock had already decided.
- The run produced findings I didn't plan: the scorer's sponsorship-only Apply, the framed application forms, and the dates the providers throw away.

**What the mode got wrong or missed.**
- My first conformance check let a broken scorer through, because the data happened to have no closed gate. A check that only fires on some data is a weak check.
- The title rule passed a 5+-years job, because "Full Stack Software Engineer" has no level. Seniority hides in the description, which the mode doesn't read.
- Today's verdict ("nothing fits your clock") rests on an assumed 45-day hiring time. That is the most important number in the run, and it's a guess.
- 5 of 15 postings couldn't be checked at all (framed forms).
- 2 Regent Craft postings were held at G1a. That was deliberate: their board is a weak tie (Rhode Island postings against a Burlington, MA record), and Shubham left it proposed.
- I left Lendbuzz out of the G1a question by mistake. It cost nothing today (0 postings passed the filters), but it is my omission, logged in the decisions file.
- A careless G1a confirmation goes straight through, and my own G1a record is weaker than it should be. It was one batch choice, and the agent wrote the evidence strings.

**Next steps.**
1. Teach the liveness checker to look inside Greenhouse/Lever frames (proposed addition 5). That alone would settle 5 of today's 15.
2. Keep the feeds' `first_published` dates and read the posting's "years of experience" line, so seniority and ghost postings show up before the fit step (proposed addition 4).
3. Replace the 45-day assumption with measured times from the student's own tracker, kept in `private/` (proposed addition 3).
4. Ask the maintainer whether a sponsorship vote alone *should* be able to clear the Apply threshold. That is a scorer question, not a mode question.
5. Have G1a show the board's top locations next to the CSV city at decision time, so a careless confirmation at least has to look at the evidence.

## Attestation
- Recipe: swe-opt-clock-live v0.1.0
- By: Shubham Bagwe · 2026-10-21. Prepared by Claude Code (AI) from the runs above. On 2026-10-21 the rows marked † were re-run by Claude Code at my request; I reviewed that output against the "Saw" column (all five matched, with the same counts) and I sign this as my record of having judged it.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node --test …/swe-opt-clock-live/test/live.test.mjs` † | 21/21 pass; the sample-mode suite 18/18 | all pass |
| `REALLOCATION_ENGINE_PORTALS=…/portals-boston-swe.yml npm run ats:scan -- --dry-run` † | 20 boards, 1,300 found, 15 new offers, exit 0, `data/ats` unchanged | a real scan that writes nothing |
| `node …/capture.mjs` † | cross-check match (same 15 postings as the scan); 15 opened: 10 active, 5 uncertain | live capture whose list equals the scan's |
| `npm run ats:liveness -- <PathAI> <Formlabs> <fake id>` † | active · uncertain · uncertain | the CLI agrees with the capture |
| `evaluate.mjs` on Neel today | 7 scored Skip (timeline gate), 7 not scored → drop, 1 dropped (wrong board) | the clock closes every posting under a 45-day hire |
| `evaluate.mjs` what-if, pass 1 → pass 2 with fit | 7 on the fit worksheet → Apply 6 · Consider 1; 1 in the 2-hour block, 6 to networking | fit asked only where gates are open |
| **Break:** capture 4 days old | exit 3 `capture-stale`, no report | refuse to score |
| **Break:** made-up posting id as a referral link | held `liveness-redirected-off-posting` (ended on the careers home page) | not counted as live |
| **Break:** careless G1a confirmation of the decoy board | **attached Cohere Health's 104 approvals to Cohere AI's posting** | **the mode cannot catch this; documented as a limit** |
| **Break:** profile with no `needs_sponsorship`, undated count | exit 3 `needs-sponsorship-missing` | refuse to infer |
| **Break:** additive-gates scorer, all gates open | first: **exit 0, not caught**. After the G4 arithmetic check: exit 4, no report | halt at G4 |
| `bash runs/2026-10-21/verify-run.sh` † | 26 JSON parse; CSV numbers MATCH ×5; 4 board totals equal; dry run writes nothing; re-run identical; 0.555 by hand; 102 recorded input hashes, 0 mismatches | independent sources agree |
| `node runs/2026-10-21/evidence-probes.mjs frames` | all 5 uncertain pages embed a `job-boards.greenhouse.io` frame containing "Apply" / "Submit application" | explains the 5 holds |
| `node runs/2026-10-21/evidence-probes.mjs postings` | People Systems asks 5+ years, first published 2026-05-29; SDET asks **1–2** years (my note said 2) | backs the fit notes; found one error |

### Did not test
- A second capture on a later day. Freshness, reopenings and postings that close overnight were only simulated (`--as-of 2026-10-25`), never observed.
- A real expired posting. No candidate came back `expired` on 2026-10-21, so the liveness = 0 path ran only in offline tests.
- A title with a cohort date on a live board. No new-grad SWE posting with a printed start date was live, so the cohort rule ran only in tests.
- Lever and Ashby postings through the evaluator end to end, beyond the 2 Regent Craft postings (which were held at G1a). Lendbuzz's Lever board returned no posting that passed the filters.
- The `--max-checks` cap with more candidates than the cap.
- Whether the fit ratings are right. They are an AI's reading of postings for a fictional student.
- Any real student's data, by design.
- A per-board G1a review. The 11 confirmations came from one batch answer (see Inputs).
- Windows or Linux. Only macOS was used; the transcripts' path redaction assumes it.
- Whether the 45-day hiring assumption, the 3-day freshness limit, or the 0.5 fit floor are good values.

### Broke during testing, fixed
- **Cohort date replaced the hiring time** (found by the design review). "New Grad 2026" gave a 0-day lag and an open gate. It is now a floor: `startLag` in `live-lib.mjs` takes the later of the two. Covered by a test.
- **Evening captures read as "after the run date"** (review). UTC `checked_at` was compared with a local `capture_date`. Checks now carry a local `checked_date`. Covered by a test.
- **A failed run left the previous `run-log.json` saying "completed"** (review). Every output is now removed first. Covered by a test.
- **"Closed" meant 0 in the mode but ≤ 0.05 in the scorer** (review). Both now use 0.05.
- **The scan cross-check compared totals only**, and evaluate trusted the capture's own verdict (review). It now compares the posting lists, and evaluate recomputes the result.
- **G1a decisions lived inside the portals file**, and an unsigned "rejected" silently dropped postings (review). They are now in an append-only `board-decisions.yml`, and both outcomes need a name and a date.
- **Sponsorship-only Apply** (live run, step 6). A new routing rule, `sponsorshipOnlyApply`, sends these to networking. Covered by a test.
- **A broken scorer passed G4 when no gate was closed** (live run, break 5). Fixed with `checkScorerArithmetic` in G4. Covered by a test.
- **Lendbuzz's board timed out once** during development. The capture now retries a board fetch once.
- **The output folder of transcript 14a was renamed afterwards** to `break/broken-scorer-NOT-CAUGHT-before-arithmetic-check/`, with a README warning not to read its report as advice. Transcript 14a still prints the original path.
- **My SDET fit note misread "1–2 years" as "2 years"** (found by probe 18). Disclosed in step 6; the rating was not changed after the run.
- **`npm install` rewrote `package-lock.json`** (a local npm version dropped 36 `libc` lines). Restored with `git checkout`; not part of this submission.

Signed: Shubham Bagwe · Date: 2026-10-21
