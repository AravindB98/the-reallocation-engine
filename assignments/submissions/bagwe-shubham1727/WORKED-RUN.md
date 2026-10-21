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
- **Who:** Shubham Bagwe. I used an AI coding assistant to write and run the scripts (see the README). I cleared gate G1a (board ownership) myself. G5 (per-job sign-off) is **not** signed.
- **Transcripts:** `runs/2026-10-21/terminal/NN-*.txt`, recorded by a wrapper that writes `$ command`, the combined output, and `exit=<code>`. The only edit is redacting the local repo path to `<repo>` and the home directory to `<home>`.

## 1. Inputs

| Input | Path | Kind |
|---|---|---|
| 20 public ATS boards (18 + 2 decoys) and the title/location filters | `scripts/contrib/…/swe-opt-clock-live/fixtures/portals-boston-swe.yml` | public data; the list is mine |
| Board-ownership decisions (gate G1a), append-only | `…/fixtures/board-decisions.yml` | **human gate**: 11 confirmed + 2 rejected by me, 2026-10-21 |
| 80 Days sponsor CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| BLS compact, Form D samples | `data/bls/compact/soc_occupation_compact.csv`, `data/sec/form-d/processed/sample/` | record |
| Student (fictional) | `search/examples/neel-kapoor/profile.yml`: 41 unemployment days used as of 2026-10-02, ceiling 90, buffer 15, OPT end 2027-06-14 | your-input (fictional) |
| What-if student (fictional) | `…/fixtures/persona-neel-whatif-day10.yml`: the same student with 10 days used as of 2026-10-21 | your-input (fictional) |
| Hiring time | `…/fixtures/time-to-start.json`: 45 days, an assumption | your-input |
| Fit ratings (what-if run only) | `runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-ratings.json` | **model-judgment**: written by the AI assistant after reading each posting's requirements |

**How gate G1a was cleared.** It was one batch decision. The AI assistant listed the 11 "strong" and 6 "weak" board ties, with each board's evidence, in a multiple-choice question. I chose "Strong ties only", and the two decoys stayed rejected. The confirmed entries in `board-decisions.yml` therefore share the question's group label as their evidence string, transcribed by the assistant, not written by me. Each board's own evidence is in its proposed entry. For Cohere Health the tie is by slug and healthcare titles (37 US + 38 Hyderabad postings), not by city. A per-board review in my own words would be a stronger record, and the worked run counts this as a weakness (see Reflection).

No private data was read or used. `private/` holds only its README, and `data/ats/portals.yml` (the user's own file) was never opened: every run points the scan at the tracked portals file through `REALLOCATION_ENGINE_PORTALS`.

**How the board list was built** (before the mode existed, with the engine's scan as the detector):
- `python3 scripts/ats/detect-ats.py` can't run here (step 9).
- So I probed 207 slug guesses for 37 Massachusetts SWE sponsors from the CSV (69 slug guesses, up to 3 per name, each tried on Greenhouse, Lever and Ashby) with `npm run ats:scan -- --dry-run`.
- 24 resolved. The summary and every error line are in `runs/2026-10-21/discovery/probe-scan-summary.txt`.

## 2. Commands and their real output

### Step 0 — toolchain

$ npm install --no-audit --no-fund

up to date in 267ms
exit=0
(note: npm install rewrote package-lock.json formatting locally — 36 'libc' lines removed by this npm version; restored with git checkout, not committed)

```
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit=0
```

```
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit=0
```

The doctor counts top-level `recipes/` only (33). It doesn't see `recipes/cases/`, so this mode's 8 TODOs are counted in its own frontmatter.

```
$ node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs 2>&1 | grep -E '^(✔|✖|ℹ)' ; node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
✔ title rule: new-grad SWE titles pass, senior and level III+ do not, in every level format (1.36575ms)
✔ cohort start: of every date a new-grad title names, the earliest wins (1.113042ms)
✔ start lag: the hiring time is a floor; a cohort date can only push the start later (0.221708ms)
✔ redirect rule: the posting id must survive the navigation, as a whole token (0.237208ms)
✔ liveness from a capture: active counts only on the posting; uncertain, stale and missing are held; local dates (0.170542ms)
✔ board filter loop: scan.mjs order and dedup, and the mirror still matches scan.mjs source (0.33425ms)
✔ scan comparison: same lists match; a missing or extra posting does not; private history is allowed for (0.082708ms)
✔ e2e, today's clock: wrong board dropped, unsigned boards held, every open-board job closed by the timeline (278.649292ms)
✔ e2e: an unsigned rejection holds the posting instead of silently dropping it (283.322667ms)
✔ e2e, what-if clock: open-gate jobs go to the fit worksheet; a cohort date still closes the gate (280.680291ms)
✔ e2e: a timeline at the scorer's gate_zero counts as closed, so no fit is asked for (277.374ms)
✔ e2e, what-if clock with fit: AI-written ratings reach the scorer labeled model-judgment; bad ratings warn (564.338792ms)
✔ an Apply carried by sponsorship alone goes to networking, not the 2-hour block (found on the first live run) (280.8145ms)
✔ stop: a capture older than 3 days is refused, nothing is scored (40.261291ms)
✔ stop: a capture whose postings differ from the engine's scan is refused, whatever it says about itself (40.426958ms)
✔ stop: a persona with no needs_sponsorship and an undated count stops at G0; a non-sponsor persona is out of scope (80.732625ms)
✔ a failed run leaves no earlier log or report behind (322.250166ms)
✔ break: an additive-gates scorer is caught at G4 and leaves no scores behind (267.113834ms)
✔ break: with every gate open, the additive scorer is still caught by the arithmetic check (missed on the first live run) (539.708958ms)
✔ refuses to write outside its namespace; outputs outside the repo carry no local path (311.399042ms)
✔ only capture.mjs may touch the network (0.541416ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3616.386583
ℹ tests 18
ℹ pass 18
ℹ fail 0
exit=0
```

### Step 1 — the engine's own scan on the mode's boards (side-effect free)

```
$ REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/portals-boston-swe.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 20 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     20
Total jobs found:      1300
Filtered by title:     1265 removed
Filtered by location:  19 removed
Duplicates:            1 skipped
New offers added:      15

New offers:
  + TULIP INTERFACES INC | Software Engineer, Agentic AI | Somerville, MA
  + TULIP INTERFACES INC | Software Engineer, Frameworks | Somerville, MA
  + KLAVIYO INC | Full Stack Software Engineer - People Systems | Boston, MA
  + KLAVIYO INC | Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | Boston, MA
  + KLAVIYO INC | Software Engineer II - Recommendations | Boston, MA
  + KLAVIYO INC | Software Engineer II, Test Frameworks & Tooling | Boston, MA
  + FORMLABS INC | Embedded Software Engineer  | Somerville, MA
  + FORMLABS INC | Software Engineer, E-commerce  | Somerville, MA
  + FORMLABS INC | Software Engineer - Print Pipeline | Somerville, MA
  + TOAST INC | Software Engineer II, Developer Experience | Remote, US
  + COHERE HEALTH INC | Software Engineer, Security Agents | United States
  + PATHAI INC | Software Development Engineer in Test (SDET) | Boston, MA
  + PATHAI INC | Software Engineer I, Fullstack | Boston, MA (Hybrid)
  + REGENT CRAFT INC | Software Engineer II, Sensor Fusion & Autonomy | North Kingstown, Rhode Island, USA
  + REGENT CRAFT INC | Embedded Systems Software Engineer | North Kingstown, Rhode Island, USA

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
exit=0
```

The engine prints `COHERE HEALTH INC | Software Engineer, Security Agents | United States`. That posting is on `jobs.ashbyhq.com/cohere`, which is Cohere, the AI company. COHERE HEALTH INC posts on `job-boards.greenhouse.io/coherehealth`. I put that board in the portals file under COHERE HEALTH INC on purpose, as a decoy, after the probe showed it was another company. The point is that the scan has no way to know: it labels every job with the name it was given, so a wrong slug guess looks exactly like a right one.

### Step 2 — capture: boards, scan cross-check, browser check of every new-grad posting

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs
  scan cross-check: match (scan 1300 found → 15 new; capture 1300 found → 15 passed; only in scan 0, only in capture 0)
  active    KLAVIYO INC | Full Stack Software Engineer - People Systems
  active    KLAVIYO INC | Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth
  active    KLAVIYO INC | Software Engineer II - Recommendations
  active    KLAVIYO INC | Software Engineer II, Test Frameworks & Tooling
  active    TOAST INC | Software Engineer II, Developer Experience
  active    COHERE HEALTH INC | Software Engineer, Security Agents
  uncertain FORMLABS INC | Embedded Software Engineer 
  uncertain FORMLABS INC | Software Engineer, E-commerce 
  uncertain FORMLABS INC | Software Engineer - Print Pipeline
  uncertain TULIP INTERFACES INC | Software Engineer, Agentic AI
  uncertain TULIP INTERFACES INC | Software Engineer, Frameworks
  active    PATHAI INC | Software Development Engineer in Test (SDET)
  active    PATHAI INC | Software Engineer I, Fullstack
  active    REGENT CRAFT INC | Software Engineer II, Sensor Fusion & Autonomy
  active    REGENT CRAFT INC | Embedded Systems Software Engineer
✓ capture 2026-10-21: 1300 postings on 20/20 boards → 15 passed scan filters → 15 new-grad postings opened (active 10 · uncertain 5)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture-audit.md
exit=0
```

Written: `runs/2026-10-21/capture/capture.json` and `capture-audit.md`. The cross-check compares the list of postings, not just totals. Every posting the scan printed is in the capture and vice versa, and 1,300 = 1,300 found.

### Step 3 — spot check with the engine's liveness CLI (plus a made-up posting id)

```
$ npm run ats:liveness -- 'https://www.pathai.com/careers/8696764002?gh_jid=8696764002' 'https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561' 'https://job-boards.greenhouse.io/formlabs/jobs/1'

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://www.pathai.com/careers/8696764002?gh_jid=8696764002 https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561 https://job-boards.greenhouse.io/formlabs/jobs/1

Checking 3 URL(s)...

✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002
⚠️ uncertain  https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561
           content present but no visible apply control found
⚠️ uncertain  https://job-boards.greenhouse.io/formlabs/jobs/1
           content present but no visible apply control found

Results: 1 active  0 expired  2 uncertain
exit=1
```

The CLI agrees with the capture on both real postings: PathAI is active, and Formlabs is uncertain because its application form sits in an embedded frame. The third URL is a job id I invented. The CLI calls it *uncertain*, exactly like the real Formlabs posting. The engine alone can't tell a dead link from a framed form, which is why the mode adds the redirect rule (step 7, break 2).

**Why the 5 pages were uncertain** (a separate probe on the same day, `runs/2026-10-21/evidence-probes.mjs frames`). Each page embeds a `job-boards.greenhouse.io` frame that contains the apply button. The engine's checker reads only the top-level page:

```
$ node assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evidence-probes.mjs frames
FORMLABS INC | Embedded Software Engineer
  5 iframe(s)
  - job-boards.greenhouse.io: Submit application
  - content.googleapis.com: no apply-like control
  - www.recaptcha.net: no apply-like control
  - (about:blank): no apply-like control
  - (about:blank): no apply-like control
```

The full output for all 5 is in `terminal/17-evidence-frames.txt`. On every page the Greenhouse frame has "Apply" or "Submit application".

### Step 4 — evaluate, Neel today (60 of 90 days used → must start by 2026-11-20)

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json
✓ swe-opt-clock-live 2026-10-21 (neel-kapoor): 15 candidates → 7 scored (Apply 0 · Consider 0 · Skip 7) · 7 not scored (0 need only a fit rating) · 1 dropped (wrong board)
  clock: 60/90 unemployment days used → hard deadline 2026-11-20, safe 2026-11-05 · timeline closed for 14
  ✓ scored 7 roles → Apply 0 · Consider 0 · Skip 7 (skip 100%)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/roles.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/role-scores.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/run-log.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/report.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/gate-decisions.md
exit=0
```

From `runs/2026-10-21/evaluate-neel-kapoor/report.md` (pasted):

```markdown
**What this is.** A check of 15 real, currently posted software engineering jobs that a new graduate could take, taken today from the public job boards of Massachusetts companies with an H-1B record. Each job was checked against public sponsorship records, whether the posting page is open, and your visa clock.

**Why read it.** Your 90-day unemployment allowance runs out on **2026-11-20**, 30 days from now. That is much sooner than your OPT end date (2027-06-14). A job only helps if you can start it before then. This report says where your time goes and shows where every number came from.

**What it found.** For **14** of them, a typical new-grad hiring process (about 45 days, an assumption) would end after your deadline. Those are a Skip however good the fit. 7 jobs were scored: **0 Apply, 0 Consider, 7 Skip**. 7 need you to look first (usually a posting page the checker could not read). 1 came from a board that belongs to a different company with a similar name, and was dropped. Sponsorship records show what a company did in the past, not what it will do for you now.
```

| Job | Decision | Why | What to do next |
|---|---|---|---|
| KLAVIYO INC: Full Stack Software Engineer - People Systems | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| KLAVIYO INC: Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| KLAVIYO INC: Software Engineer II - Recommendations | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| KLAVIYO INC: Software Engineer II, Test Frameworks & Tooling | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| TOAST INC: Software Engineer II, Developer Experience | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| PATHAI INC: Software Development Engineer in Test (SDET) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| PATHAI INC: Software Engineer I, Fullstack | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2026-12-05 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |
| COHERE HEALTH INC: Software Engineer, Security Agents | **Dropped** | board-not-this-company | Drop: This posting is on a board that belongs to a different company with a similar name. The sponsor record does not apply to it. |
| FORMLABS INC: Embedded Software Engineer  | **Not scored** | liveness-no_apply_control | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (liveness-no_apply_control) cannot change the outcome. Drop. |
| FORMLABS INC: Software Engineer, E-commerce  | **Not scored** | liveness-no_apply_control | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (liveness-no_apply_control) cannot change the outcome. Drop. |
| FORMLABS INC: Software Engineer - Print Pipeline | **Not scored** | liveness-no_apply_control | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (liveness-no_apply_control) cannot change the outcome. Drop. |
| TULIP INTERFACES INC: Software Engineer, Agentic AI | **Not scored** | liveness-no_apply_control | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (liveness-no_apply_control) cannot change the outcome. Drop. |
| TULIP INTERFACES INC: Software Engineer, Frameworks | **Not scored** | liveness-no_apply_control | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (liveness-no_apply_control) cannot change the outcome. Drop. |
| REGENT CRAFT INC: Software Engineer II, Sensor Fusion & Autonomy | **Not scored** | board-ownership-unconfirmed | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (board-ownership-unconfirmed) cannot change the outcome. Drop. |
| REGENT CRAFT INC: Embedded Systems Software Engineer | **Not scored** | board-ownership-unconfirmed | Drop: A gate is already closed (start 2026-12-05 is after your hard deadline 2026-11-20), so the missing evidence (board-ownership-unconfirmed) cannot change the outcome. Drop. |

### Step 5 — evaluate, what-if clock, pass 1 (10 days used → must start by 2027-01-09)

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --persona scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/persona-neel-whatif-day10.yml
✓ swe-opt-clock-live 2026-10-21 (persona-neel-whatif-day10): 15 candidates → 0 scored (Apply 0 · Consider 0 · Skip 0) · 14 not scored (7 need only a fit rating) · 1 dropped (wrong board)
  clock: 10/90 unemployment days used → hard deadline 2027-01-09, safe 2026-12-25 · timeline closed for 0
  scorer not run
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/roles.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/run-log.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/report.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-worksheet.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/gate-decisions.md
exit=0
```

| Posting id | Job | Sponsorship | Timeline | Link |
|---|---|---|---|---|
| `greenhouse:7727703003` | KLAVIYO INC: Full Stack Software Engineer - People Systems | Proven | 1 (inside-buffer) | https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003 |
| `greenhouse:7792539003` | KLAVIYO INC: Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | Proven | 1 (inside-buffer) | https://www.klaviyo.com/careers/jobs/7792539003?gh_jid=7792539003 |
| `greenhouse:7855798003` | KLAVIYO INC: Software Engineer II - Recommendations | Proven | 1 (inside-buffer) | https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003 |
| `greenhouse:7855793003` | KLAVIYO INC: Software Engineer II, Test Frameworks & Tooling | Proven | 1 (inside-buffer) | https://www.klaviyo.com/careers/jobs/7855793003?gh_jid=7855793003 |
| `greenhouse:8245633` | TOAST INC: Software Engineer II, Developer Experience | Likely | 1 (inside-buffer) | https://careers.toasttab.com/jobs?gh_jid=8245633 |
| `greenhouse:8769657002` | PATHAI INC: Software Development Engineer in Test (SDET) | Proven | 1 (inside-buffer) | https://www.pathai.com/careers/8769657002?gh_jid=8769657002 |
| `greenhouse:8696764002` | PATHAI INC: Software Engineer I, Fullstack | Proven | 1 (inside-buffer) | https://www.pathai.com/careers/8696764002?gh_jid=8696764002 |

### Step 6 — fit ratings (model-judgment), then pass 2

The AI assistant read each of the 7 postings through the Greenhouse job API and rated fit against the fictional student's profile: new grad; Python, Go, TypeScript; no full-time experience. The ratings and their one-line reasons are in `fit-ratings.json`, every one labeled `model-judgment`. The same read showed two things the mode doesn't capture:
- Klaviyo's "Full Stack Software Engineer – People Systems" asks for **5+ years**. Its title carries no level, so the title rule passed it.
- That posting was **first published 2026-05-29**, about 145 days earlier. The feed has the date, but the engine's providers drop it (proposed addition 4).

What the posting API says, re-read with a probe script so the claim is on the record (`runs/2026-10-21/evidence-probes.mjs postings`):

```
$ node assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evidence-probes.mjs postings
greenhouse:7727703003 | Full Stack Software Engineer - People Systems
  first_published 2026-05-29T14:31:55-04:00 · updated_at 2026-10-01T11:27:18-04:00
  years-of-experience sentences: "it Passion and Curiosity to experiment and reimagine People workflows 5+ years of engineering or data engineering experience, with 2+ years building"
greenhouse:7792539003 | Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth
  first_published 2026-07-08T11:57:28-04:00 · updated_at 2026-10-20T04:38:16-04:00
  years-of-experience sentences: "Who you are Android-first — 1-3 years of professional Android development experience, ideally including Kot"
greenhouse:7855798003 | Software Engineer II - Recommendations
  first_published 2026-08-14T14:23:33-04:00 · updated_at 2026-10-19T03:02:46-04:00
  years-of-experience sentences: "Who you are 2+ years of professional software engineering experience with a focus on backe"
greenhouse:7855793003 | Software Engineer II, Test Frameworks & Tooling
  first_published 2026-08-24T09:50:21-04:00 · updated_at 2026-10-19T03:02:45-04:00
  years-of-experience sentences: "You have 2+ years of software engineering experience with a focus on writing clean, mai"
greenhouse:8245633 | Software Engineer II, Developer Experience
  first_published 2026-10-13T10:02:51-04:00 · updated_at 2026-10-20T22:27:36-04:00
  years-of-experience sentences: "Do you have the right ingredients*? (Requirements) 2+ years of professional software engineering experience building and shipping"
greenhouse:8769657002 | Software Development Engineer in Test (SDET)
  first_published 2026-09-11T23:19:59-04:00 · updated_at 2026-09-21T11:49:31-04:00
  years-of-experience sentences: "You have 1–2 years of hands-on experience writing and maintaining automated tests using"
greenhouse:8696764002 | Software Engineer I, Fullstack
  first_published 2026-08-11T13:48:58-04:00 · updated_at 2026-09-25T12:37:06-04:00
  years-of-experience sentences: none
exit=0
```

**One of my fit notes is wrong.** The SDET note says the posting asks for "2 years". The posting says **1–2 years**, which my first quick regex misread. I left the rating (0.35) and the file unchanged: it is the input the run used, and its hash is in the run log. A corrected reading might rate it a little higher, but that wouldn't change its block, because sponsorship alone already makes it an Apply and the fit stays under 0.5.

First pass-2 run, **before** the routing rule existed. Kept as evidence:

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --persona scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/persona-neel-whatif-day10.yml --fit assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-ratings.json
✓ swe-opt-clock-live 2026-10-21 (persona-neel-whatif-day10): 15 candidates → 7 scored (Apply 6 · Consider 1 · Skip 0) · 7 not scored (0 need only a fit rating) · 1 dropped (wrong board)
  clock: 10/90 unemployment days used → hard deadline 2027-01-09, safe 2026-12-25 · timeline closed for 0
  ✓ scored 7 roles → Apply 6 · Consider 1 · Skip 0 (skip 0%)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/roles.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/role-scores.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/run-log.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/report.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/gate-decisions.md
exit=0
```

| Job | Decision | Why | What to do next |
|---|---|---|---|
| PATHAI INC: Software Engineer I, Fullstack | **Apply** (0.555) | composite 0.555 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| KLAVIYO INC: Software Engineer II, Test Frameworks & Tooling | **Apply** (0.45) | composite 0.450 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| KLAVIYO INC: Software Engineer II - Recommendations | **Apply** (0.435) | composite 0.435 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| PATHAI INC: Software Development Engineer in Test (SDET) | **Apply** (0.42) | composite 0.420 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| KLAVIYO INC: Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | **Apply** (0.375) | composite 0.375 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| KLAVIYO INC: Full Stack Software Engineer - People Systems | **Apply** (0.345) | composite 0.345 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| TOAST INC: Software Engineer II, Developer Experience | **Consider** (0.33) | above threshold (0.330) but one soft spot: sponsorship tier "Likely" | Network (3-hour block): Network before applying: one conversation with an engineer at TOAST INC about whether they sponsor new-grad SWEs. |

**The scorer said Apply to the 5+-years job with a fit of 0.1.** The reason is arithmetic. A "Proven" sponsor's vote is 0.9 × 0.35 = 0.315, which alone clears the scorer's 0.30 Apply threshold. I didn't change the scorer. The mode's own routing now sends an Apply carried by sponsorship alone, with fit under 0.5, to the networking block. The scorer's word is still printed unchanged.

Re-run with the routing rule:

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --persona scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/persona-neel-whatif-day10.yml --fit assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-ratings.json
✓ swe-opt-clock-live 2026-10-21 (persona-neel-whatif-day10): 15 candidates → 7 scored (Apply 6 · Consider 1 · Skip 0) · 7 not scored (0 need only a fit rating) · 1 dropped (wrong board)
  clock: 10/90 unemployment days used → hard deadline 2027-01-09, safe 2026-12-25 · timeline closed for 0
  ✓ scored 7 roles → Apply 6 · Consider 1 · Skip 0 (skip 0%)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/roles.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/role-scores.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/run-log.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/report.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10-fit/gate-decisions.md
exit=0
```

```markdown
**What it found.** 7 jobs were scored: **6 Apply, 1 Consider, 0 Skip**. 7 need you to look first (usually a posting page the checker could not read). 1 came from a board that belongs to a different company with a similar name, and was dropped. 7 fit ratings were written by an AI assistant and are labeled as its judgment. Sponsorship records show what a company did in the past, not what it will do for you now.

> **Skip rate 0% of scored jobs, below the ~50% a healthy run skips.** The board list was built from companies already known to sponsor, so it leans toward sponsors. Treat that as a property of the input, not good news.

> **5 of the 6 Apply results come from sponsorship alone.** For a company with a strong sponsorship record, that one vote already clears the scorer's Apply threshold, whatever your fit. Those jobs are sent to networking, not the 2-hour application block: **1** job(s) get that block today.
```

| Job | Decision | Why | What to do next |
|---|---|---|---|
| PATHAI INC: Software Engineer I, Fullstack | **Apply** (0.555) | composite 0.555 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| KLAVIYO INC: Software Engineer II, Test Frameworks & Tooling | **Apply** (0.45) | composite 0.450 ≥ 0.3, gates healthy; **sponsorship alone clears the threshold** | Network (3-hour block): The scorer says Apply, but KLAVIYO INC's sponsorship vote alone clears its threshold, and your fit is only 0.45. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block. |
| KLAVIYO INC: Software Engineer II - Recommendations | **Apply** (0.435) | composite 0.435 ≥ 0.3, gates healthy; **sponsorship alone clears the threshold** | Network (3-hour block): The scorer says Apply, but KLAVIYO INC's sponsorship vote alone clears its threshold, and your fit is only 0.4. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block. |
| PATHAI INC: Software Development Engineer in Test (SDET) | **Apply** (0.42) | composite 0.420 ≥ 0.3, gates healthy; **sponsorship alone clears the threshold** | Network (3-hour block): The scorer says Apply, but PATHAI INC's sponsorship vote alone clears its threshold, and your fit is only 0.35. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block. |
| KLAVIYO INC: Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | **Apply** (0.375) | composite 0.375 ≥ 0.3, gates healthy; **sponsorship alone clears the threshold** | Network (3-hour block): The scorer says Apply, but KLAVIYO INC's sponsorship vote alone clears its threshold, and your fit is only 0.2. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block. |
| KLAVIYO INC: Full Stack Software Engineer - People Systems | **Apply** (0.345) | composite 0.345 ≥ 0.3, gates healthy; **sponsorship alone clears the threshold** | Network (3-hour block): The scorer says Apply, but KLAVIYO INC's sponsorship vote alone clears its threshold, and your fit is only 0.1. Talk to an engineer there about the experience the posting asks for before spending the 2-hour block. |
| TOAST INC: Software Engineer II, Developer Experience | **Consider** (0.33) | above threshold (0.330) but one soft spot: sponsorship tier "Likely" | Network (3-hour block): Network before applying: one conversation with an engineer at TOAST INC about whether they sponsor new-grad SWEs. |
| FORMLABS INC: Embedded Software Engineer  | **Not scored** | liveness-no_apply_control, needs-fit-rating | You, now (≤5 min): Open the posting yourself (≤5 min). The board's own feed still listed it at capture time, but the page check could not confirm an apply button. Record what you saw before spending application time. |
| FORMLABS INC: Software Engineer, E-commerce  | **Not scored** | liveness-no_apply_control, needs-fit-rating | You, now (≤5 min): Open the posting yourself (≤5 min). The board's own feed still listed it at capture time, but the page check could not confirm an apply button. Record what you saw before spending application time. |
| FORMLABS INC: Software Engineer - Print Pipeline | **Not scored** | liveness-no_apply_control, needs-fit-rating | You, now (≤5 min): Open the posting yourself (≤5 min). The board's own feed still listed it at capture time, but the page check could not confirm an apply button. Record what you saw before spending application time. |
| TULIP INTERFACES INC: Software Engineer, Agentic AI | **Not scored** | liveness-no_apply_control, needs-fit-rating | You, now (≤5 min): Open the posting yourself (≤5 min). The board's own feed still listed it at capture time, but the page check could not confirm an apply button. Record what you saw before spending application time. |
| TULIP INTERFACES INC: Software Engineer, Frameworks | **Not scored** | liveness-no_apply_control, needs-fit-rating | You, now (≤5 min): Open the posting yourself (≤5 min). The board's own feed still listed it at capture time, but the page check could not confirm an apply button. Record what you saw before spending application time. |
| REGENT CRAFT INC: Software Engineer II, Sensor Fusion & Autonomy | **Not scored** | board-ownership-unconfirmed, needs-fit-rating | You, now (≤5 min): Confirm this board belongs to the company in the sponsor record (open the board; check the company name and locations), add your decision with your name and the date to board-decisions.yml, and re-run. |
| REGENT CRAFT INC: Embedded Systems Software Engineer | **Not scored** | board-ownership-unconfirmed, needs-fit-rating | You, now (≤5 min): Confirm this board belongs to the company in the sponsor record (open the board; check the company name and locations), add your decision with your name and the date to board-decisions.yml, and re-run. |
| COHERE HEALTH INC: Software Engineer, Security Agents | **Dropped** | board-not-this-company | Drop: This posting is on a board that belongs to a different company with a similar name. The sponsor record does not apply to it. |

### Step 7 — deliberate break attempts

**Break 1: a capture 4 days old.**

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --as-of 2026-10-25 --out-dir assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/stale-capture
✗ STOP at G0: capture-stale: capture is 4 days old (> 3): every liveness verdict in it is out of date. Re-run capture.mjs; this run refuses to score on old checks.
  nothing was scored; no report written. Log: assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/stale-capture/run-log.json
exit=3
```

**Break 2: a made-up posting id passed off as a link a friend forwarded** (`runs/2026-10-21/break/fake-referral-link.json`).

```
  active    PATHAI INC | Software Engineer I, Fullstack
  active    REGENT CRAFT INC | Software Engineer II, Sensor Fusion & Autonomy
  active    REGENT CRAFT INC | Embedded Systems Software Engineer
  uncertain FORMLABS INC | Software Engineer, Backend (left the posting)
✓ capture 2026-10-21: 1300 postings on 20/20 boards → 15 passed scan filters → 16 new-grad postings opened (active 10 · uncertain 6)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/fake-link/capture/capture.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/fake-link/capture/capture-audit.md
exit=0
```

```
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/fake-link/evaluate/gate-decisions.md
manual:1 not-scored ["liveness-redirected-off-posting","needs-fit-rating"] final_url https://careers.formlabs.com/
exit=0
```

**Break 3: a careless human "confirms" the decoy board** (a copy of the decisions file with one bad entry, never the real file).

```
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/decoy-confirmed/evaluate/gate-decisions.md
COHERE HEALTH INC | Software Engineer, Security Agents | not-scored | sponsor record attached: Proven 104 approvals | holds: needs-fit-rating
exit=0
```

**This break succeeded.** With the bad confirmation, the mode attached COHERE HEALTH INC's 104 approvals (Proven) to Cohere AI's posting. It stopped only because the fit was missing. The board gate is only as good as the person clearing it, and the mode can't check that person.

**Break 4: a student profile with no `needs_sponsorship` flag and an undated day count** (`search/examples/aarav-patel`).

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --persona search/examples/aarav-patel/profile.yml --out-dir assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/undated-persona
✗ STOP at G0: needs-sponsorship-missing: profile has no boolean needs_sponsorship; refusing to infer it from free text (the scorer's regex misreads "work authorized")
  nothing was scored; no report written. Log: assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/undated-persona/run-log.json
exit=3
```

**Break 5: a deliberately wrong scorer that adds the gates instead of multiplying them**, run on the real capture under the what-if clock. First attempt:

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --persona scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/persona-neel-whatif-day10.yml --fit assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-persona-neel-whatif-day10/fit-ratings.json --scorer scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/BROKEN-additive-gates-scorer.mjs --out-dir assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer; ls assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer
✓ swe-opt-clock-live 2026-10-21 (persona-neel-whatif-day10): 15 candidates → 7 scored (Apply 7 · Consider 0 · Skip 0) · 7 not scored (0 need only a fit rating) · 1 dropped (wrong board)
  clock: 10/90 unemployment days used → hard deadline 2027-01-09, safe 2026-12-25 · timeline closed for 0
  ✓ scored 7 roles (BROKEN additive gates)
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer/roles.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer/role-scores.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer/run-log.json
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer/report.md
  assignments/submissions/bagwe-shubham1727/runs/2026-10-21/break/broken-scorer/gate-decisions.md
gate-decisions.md
report.md
role-scores.json
role-scores.md
roles.json
run-log.json
exit=0
```

**This break also succeeded at first (exit 0, a report written from wrong scores).** The only conformance check then was "a closed gate must give Skip". Under the what-if clock no gate was closed, so an additive scorer looked fine. The fix is a G4 arithmetic check: the scorer's printed trace must use exactly the votes and gates it was fed, and its composite must equal (Σ vote × weight) × Π gates. Re-run:

```
  • role greenhouse:8769657002: fit fed as 0.35 but the trace shows nothing
  • role greenhouse:8769657002: liveness gate fed as 1 but the trace shows nothing
  • role greenhouse:8769657002: timeline gate fed as 1 but the trace shows nothing
  • role greenhouse:8769657002: composite 0.8200000000000001 cannot be recomputed from its own trace (a vote or gate is missing a number)
  • role greenhouse:8696764002: sponsorship fed as 0.9 but the trace shows nothing
  • role greenhouse:8696764002: fit fed as 0.8 but the trace shows nothing
  • role greenhouse:8696764002: liveness gate fed as 1 but the trace shows nothing
  • role greenhouse:8696764002: timeline gate fed as 1 but the trace shows nothing
  • role greenhouse:8696764002: composite 0.955 cannot be recomputed from its own trace (a vote or gate is missing a number)
evaluate exit=4
--- files left in out-dir:
roles.json
run-log.json
exit=0
```

**Break 6** is the offline test suite's 21 cases (step 0). Each one feeds a wrong input on purpose: a past cohort date, an evening capture, a fit of 1.5, an unsigned rejection, a capture whose posting list differs from the scan's, and others.

### Step 8 — independent verification

```
$ bash assignments/submissions/bagwe-shubham1727/runs/2026-10-21/verify-run.sh
== 1. every JSON output parses
26 JSON files parsed, 0 failed
== 2. sponsor numbers in the report = the 80 Days CSV row (read directly, not via the mode)
KLAVIYO INC: CSV approvals 154.0 denials 4.0 | log 154 4 | tier Proven | MATCH
TOAST INC: CSV approvals 150.0 denials 4.0 | log 150 4 | tier Likely | MATCH
FORMLABS INC: CSV approvals 70.0 denials 10.0 | log 70 10 | tier Likely | MATCH
TULIP INTERFACES INC: CSV approvals 18.0 denials 0.0 | log 18 0 | tier Proven | MATCH
PATHAI INC: CSV approvals 78.0 denials 2.0 | log 78 2 | tier Proven | MATCH
== 3. board totals in the capture = an independent fetch of the same public APIs now
KLAVIYO INC (https://job-boards.greenhouse.io/klaviyo): capture 165 · refetch now 165 · same
TOAST INC (https://job-boards.greenhouse.io/toast): capture 311 · refetch now 311 · same
FORMLABS INC (https://job-boards.greenhouse.io/formlabs): capture 246 · refetch now 246 · same
PATHAI INC (https://job-boards.greenhouse.io/pathai): capture 14 · refetch now 14 · same
capture found 1300 = engine scan 'Total jobs found' 1300: True
== 4. the scan dry-run writes nothing (data/ats before/after)
portals.example.yml
portals.yml
data/ats unchanged by the dry run
== 5. the evaluate step is deterministic: re-run into a temp dir, compare scorer input + output
roles.json committed 460e30bcc1ae · re-run 460e30bcc1ae · identical
role-scores.json committed ac8cd12f73f7 · re-run ac8cd12f73f7 · identical
== 6. scorer arithmetic by hand for the one 2-hour-block job (PathAI Software Engineer I)
(0.9·0.35 + 0.8·0.3) × 1 × 1 = 0.555 | by hand: (0.9*0.35 + 0.8*0.30) * 1 * 1 = 0.555 | Apply
== 7. every input hash recorded in every run log matches the committed file
102 recorded input hashes checked, 0 mismatches
exit=0
```

Conformance on everything the mode touches (workflow step 7):

```
$ node scripts/conformance.mjs scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/ recipes/cases/2026fa/ assignments/submissions/bagwe-shubham1727/
conformance: 77 files (33 md · 8 js · 6 yaml · 29 json · 1 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit=0
```

### Step 9 — repo commands that could not run here (logged, not worked around)

```
  File "<repo>/scripts/ats/scrapers/common/retry.py", line 13, in <module>
    import requests
ModuleNotFoundError: No module named 'requests'
exit=1
```

```

missing .venv — create it with:
  python3.13 -m venv .venv
  .venv/bin/pip install -r data/bls/local-wage/requirements.txt
exit=2
```

```
    import pandas as pd
ModuleNotFoundError: No module named 'pandas'
exit=1
```

I didn't install `requests`, `pandas` or a `.venv` to force these through. The mode doesn't depend on them: board discovery used the scan, and role quality and funding are report-only.

## 3. Verified vs. inferred, line by line

**For the one posting that reached the 2-hour block** (PathAI, "Software Engineer I, Fullstack", what-if clock):

| Line in the report | Established by | Verified or inferred |
|---|---|---|
| The posting exists, in Boston (hybrid) | the Greenhouse feed at capture, and the engine scan's identical list | **verified** (record) |
| The page is open, with an apply button | the engine's `checkUrlLiveness` in Chromium; the posting id survived the navigation; the CLI agrees | **verified** (record) |
| The board belongs to PATHAI INC | my G1a decision, from posting locations vs. the CSV city | **human judgment**, logged with name and date |
| 78 approvals, 2 denials, 97.5%, "Software Engineer I" sponsored | the 80 Days CSV, cross-checked by reading the row directly | **verified** (record). The years and SOC code aren't in the file |
| Tier Proven → p 0.9 | the inherited tier thresholds and tier→p table | **inferred**: a rule I chose, labeled your-input |
| "Software Engineer I" = SOC 15-1252 | a regex over the title | **inferred** (your-input), not an LCA record |
| Start 2026-12-05, timeline 1 | the 45-day hiring assumption + the persona's dates | **inferred**: the dates are fictional inputs, the lag is a guess |
| Fit 0.8 | the AI assistant, reading the posting | **model-judgment** |
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
- 2 Regent Craft postings were held at G1a. That was deliberate: their board is a weak tie (Rhode Island postings against a Burlington, MA record), and I left it proposed.
- Lendbuzz was left out of the G1a question by mistake, and I didn't notice when I answered it. It cost nothing today (0 postings passed the filters), but it is a gap in my review, logged in the decisions file.
- A careless G1a confirmation goes straight through, and my own G1a record is weaker than it should be. It was one batch choice, and the assistant wrote the evidence strings.

**Next steps.**
1. Teach the liveness checker to look inside Greenhouse/Lever frames (proposed addition 5). That alone would settle 5 of today's 15.
2. Keep the feeds' `first_published` dates and read the posting's "years of experience" line, so seniority and ghost postings show up before the fit step (proposed addition 4).
3. Replace the 45-day assumption with measured times from the student's own tracker, kept in `private/` (proposed addition 3).
4. Ask the maintainer whether a sponsorship vote alone *should* be able to clear the Apply threshold. That is a scorer question, not a mode question.
5. Have G1a show the board's top locations next to the CSV city at decision time, so a careless confirmation at least has to look at the evidence.

## Attestation
- Recipe: swe-opt-clock-live v0.1.0
- By: Shubham Bagwe · 2026-10-21. Draft by me and improvised with an AI assistant from the runs above, then reviewed and edited by me. On 2026-10-21 I re-ran two of the † rows myself: the live-mode test suite (21/21 pass) and `verify-run.sh`. My `verify-run.sh` run matched the "Saw" column except check 3: Klaviyo, Toast and Formlabs had changed their live board totals since the capture (165→163, 311→317, 246→241), while PathAI was unchanged and the capture's 1,300 still equals the scan's. Boards move during the day and the script labels this, so the capture stands as a record of its own moment. The other † rows (the scan dry run, the capture and the liveness CLI) were re-run by my AI assistant at my request, and I reviewed that output against the "Saw" column. I sign this as my record of having judged it.

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

<!-- GENERATED by build-worked-run.mjs from WORKED-RUN.src.md: edit the source, not this file. -->
