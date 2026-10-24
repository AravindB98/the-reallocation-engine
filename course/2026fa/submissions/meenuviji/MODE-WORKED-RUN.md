# Worked Run: Mode Build (2026-10-21)

## Executive summary

**What this is.** A record of two runs made on 2026-10-21. First, the 12 sample job postings that passed the tool's checks were sent straight through the project's own scoring command. Second, the tool was run on five real job postings whose "is it still open?" status had just been checked live.

**Why read it.** It shows the tool working on real postings, not only invented ones, with every terminal output pasted exactly as it appeared, so a reviewer can rerun the same commands and compare.

**What it found.**
- The scorer reproduced the 3 October sample results exactly: 2 Apply, 8 Consider, 2 Skip. Only the date stamp differs.
- On the real postings, the "still open?" check worked as a hard stop. All three closed postings from employers with strong sponsorship records were skipped with a score of zero, and a posting whose employer could not be identified was stopped before scoring.
- The one open real posting, a **Senior** Data Scientist role, was marked **Apply**. That is the wrong advice for a new graduate. The tool checks the seniority of the jobs an employer has sponsored, but not the seniority of the posting itself. This is the most important thing the real run found.
- How well each job fits is still an assumption, not a measurement.

The Oct 3 worked run (prototype run, tests, verification, reflection and attestation) is in WORKED-RUN.md.

## Commands and output

### Run 1: scorer on the sample roles

The same 12 gated roles were run through the repo's own scorer command. This is the command the prototype calls internally (`lib/score_bridge.py`, recorded in `out/run.json` → `scorer.command`), but with a separate output folder so the tracked `out/score/` files are not rewritten. Run from the repo root on the working branch:

```bash
npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run ; echo "exit: $?"
```

~~~text
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run

✓ scored 12 roles → Apply 2 · Consider 8 · Skip 2 (skip 17%)
  course/2026fa/submissions/meenuviji/recon/score-worked-run/role-scores.json  +  course/2026fa/submissions/meenuviji/recon/score-worked-run/role-scores.md
exit: 0
~~~

What is real and what is not in this run:
- **Real (record).** The sponsorship values in `out/roles.json` come from the 80 Days CSV.
- **Not real.** The postings are fictional; liveness (1.0, "assumed, not checked") and fit (0.5) are my inputs.
- **Reproducible.** Compared with the committed `out/score/role-scores.json` (generated 2026-10-03), the scored roles and the scorer config are identical. Only the `generated` date differs (2026-10-21).

### Run 2: real postings (2026-10-21)

**Inputs.** All files are in `worked-run-raw/05-real-run-2026-10-21/`.
- `postings.json`: 5 real postings, listed below.
- `run-config.json`: a copy of the prototype's config with `as_of` set to the real run date, 2026-10-21. The other inputs are unchanged: `opt_start` 2027-02-01, `window_days` 90, `hiring_lag_days` 60.
- Fit is held at 0.5 for every posting (my input; there is no rating rubric yet).
- Liveness was copied by hand from the `ats:liveness` output below: `active` became factor 1.0 and `expired` became 0.0, labeled record with the source file. The prototype cannot read that output itself yet (proposed addition 4 in the mode file).

| ID | Company input | Posting title | URL | Liveness (record) |
|---|---|---|---|---|
| r01 | AIRBNB INC | Senior Data Scientist, People Analytics & Research | https://careers.airbnb.com/positions/8301515/ | active → 1.0 |
| r02 | AIRBNB INC | not recorded | https://careers.airbnb.com/positions/8031901/ | expired (HTTP 404) → 0.0 |
| r03 | AIRBNB INC | not recorded | https://careers.airbnb.com/positions/8031907/ | expired (HTTP 404) → 0.0 |
| r04 | ZOOX INC (inferred from the Lever board slug "zoox") | not recorded | https://jobs.lever.co/zoox/c73446f6-3e66-4e3d-a694-f768e86038e9 | expired (HTTP 404) → 0.0 |
| r05 | none supplied: the employer was not recorded | not recorded | https://job-boards.greenhouse.io/openings/jobs/7367298 | expired (HTTP 404) → 0.0 |

**Step 1: liveness checks.** These are pasted verbatim from `worked-run-raw/03-liveness-real.txt` and `worked-run-raw/04-liveness-real-airbnb.txt`. In `03`, the Lever URL on the command line was masked by hand (`zoox/***`) before the file was committed; the result line shows the full URL.

~~~text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://jobs.lever.co/zoox/*** https://job-boards.greenhouse.io/openings/jobs/7367298

Checking 2 URL(s)...

❌ expired    https://jobs.lever.co/zoox/c73446f6-3e66-4e3d-a694-f768e86038e9
           HTTP 404
❌ expired    https://job-boards.greenhouse.io/openings/jobs/7367298
           HTTP 404

Results: 0 active  2 expired  0 uncertain
exit code: 1
~~~

~~~text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://careers.airbnb.com/positions/8031901/ https://careers.airbnb.com/positions/8031907/ https://careers.airbnb.com/positions/8301515/

Checking 3 URL(s)...

❌ expired    https://careers.airbnb.com/positions/8031901/
           HTTP 404
❌ expired    https://careers.airbnb.com/positions/8031907/
           HTTP 404
✅ active     https://careers.airbnb.com/positions/8301515/

Results: 1 active  2 expired  0 uncertain
exit code: 1
~~~

Each run exits 1 because at least one of its URLs is not active. In `04`, posting 8301515 is `active` even though the run as a whole exited 1, so the mode's liveness gate has to be read per URL.

**Step 2: prototype run on the five postings.** This is the verbatim content of `worked-run-raw/05-real-run-2026-10-21/terminal-output.txt`, run from the repo root:

~~~text
$ python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py --postings course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/postings.json --config course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/run-config.json --out course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/out
! 5 postings → scored 4 (Apply 1 · Consider 0 · Skip 3) · stopped 1 · refused 0
  course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/out/run.json  +  course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/out/report.md
exit code: 3
~~~

**Results** (from `05-real-run-2026-10-21/out/run.json`):

| ID | Match (record) | Evidence group | Recommendation | Composite | Reason (scorer) | Next action |
|---|---|---|---|---|---|---|
| r01 | AIRBNB INC, exact-upper-case | proven (Proven, p 0.7; 1,000 approvals / 10 denials) | **Apply** | 0.395 | composite 0.395 ≥ 0.3, gates healthy | Tailor an application (research-and-apply hours). |
| r02 | AIRBNB INC, exact-upper-case | proven | **Skip** | 0.000 | gated: liveness ≈ 0.000 | Skip: liveness closed. |
| r03 | AIRBNB INC, exact-upper-case | proven | **Skip** | 0.000 | gated: liveness ≈ 0.000 | Skip: liveness closed. |
| r04 | ZOOX INC, exact-upper-case | proven (1,364 approvals / 10 denials) | **Skip** | 0.000 | gated: liveness ≈ 0.000 | Skip: liveness closed. |
| r05 | no match | — | stopped at the company-match gate, not scored | — | — | a person must identify the employer |

All four scored postings carry a non-scoring note: "deferred start: employer must accept a start 43 days after offer (projected 2026-12-20, opt_start 2027-02-01)".

**Verified vs inferred.**
- **Record (verified by the data or a script):**
  - each posting's live status on 2026-10-21 (the `ats:liveness` output);
  - the company matches and each employer's approvals, denials and sponsored-title list (80 Days CSV, SHA-256 checked);
  - the scorer's recommendation and arithmetic.
- **My input (not verified):**
  - fit 0.5;
  - `hiring_lag_days` 60, `window_days` 90, `opt_start`;
  - that the Lever board "zoox" is ZOOX INC;
  - the title and data-family rules.
- **Not known:** the titles of the four expired postings, and the employer behind r05.
- **No model judgment is used in the run.** The finding below about r01 is a judgment about the result (Claude Code's reading), not something the tool computed.

**Verification.**
- At my request, Claude Code wrote a prediction of every posting's outcome from the mode file and `rules.json` before running. All five results matched it, including the Apply for r01 (0.7 × 0.35 + 0.5 × 0.30 = 0.395).
- Claude Code ran the same inputs twice: once in a scratch folder, and again here with repo-relative paths so that no username appears in the outputs. Counts, every scored posting, the stop, the notes, the rules and the scorer's output were identical. Only the run id differs (17:43:25Z → 17:45:39Z).

**What the real run showed.**
- **The liveness gate holds on real data.** Three closed postings at employers with strong records (Airbnb and Zoox, both in the proven group) were zeroed out, whatever their sponsorship evidence.
- **The seniority trap, on the posting side.** r01 is a Senior Data Scientist role, and the mode said Apply and "Tailor an application" to a pre-OPT new graduate. Airbnb's sponsored-title list includes an unmarked "Data Scientist", so the employer is in the proven group, and nothing checks the posting's own title for seniority. The mode needs a posting-seniority check (proposed, not built).
- **Defects in the generated report** (`out/report.md`), all found in this run:
  - It describes itself as "sample" (`mode: sample (offline)`, "5 sample job postings", "every posting is assumed live").
  - It shows `None` where a posting has no title, including in the title-family note ("posting title 'None'").
  - Its run record prints "seed None, None per evidence group", because the real postings file has no sample metadata.

## Attestation

- Recipe: f1-preopt-entry-data-h1b v0.1.0
- By: Meena (meenuviji) · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` and `npm run doctor -- --strict`, run during the audit and again after the real run on 2026-10-21 | both exited 0; doctor "no private/PII paths are tracked" | Mode G0: both exit 0 before anything else runs |
| `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run` | `✓ scored 12 roles → Apply 2 · Consider 8 · Skip 2 (skip 17%)`, `exit: 0`; roles identical to the Oct 3 output except `generated` | The scorer reproduces the committed Oct 3 result on the same 12 roles |
| `npm run ats:liveness` on two real URLs (`worked-run-raw/03-liveness-real.txt`) | both `expired`, HTTP 404; `Results: 0 active  2 expired  0 uncertain`; `exit code: 1` | Mode G3: an expired posting is not live, and the command exits 1 |
| `npm run ats:liveness` on three real Airbnb URLs (`worked-run-raw/04-liveness-real-airbnb.txt`) | 8031901 and 8031907 `expired` (HTTP 404); 8301515 `active`; `exit code: 1` | Mode G3: a live posting reports `active`; any non-active URL makes the run exit 1 |
| Prototype on the 5 real postings (`worked-run-raw/05-real-run-2026-10-21/terminal-output.txt`) | `5 postings → scored 4 (Apply 1 · Consider 0 · Skip 3) · stopped 1 · refused 0`, `exit code: 3` | Recipe gates G1–G4: per-posting stops give exit 3; expired postings Skip; an unidentified employer stops at G1 |
| r02, r03, r04: expired postings at proven employers (Airbnb, Zoox), liveness factor 0.0 | each **Skip**, composite 0.000, "gated: liveness ≈ 0.000", next action "Skip: liveness closed." | Mode G3: a closed liveness gate zeroes the composite whatever the sponsorship evidence |
| r05: expired posting with no employer name supplied | stopped at the company-match gate, `no-match`, not scored | Mode G1: no nearest-name guess; a person must identify the employer |
| r01: open Senior Data Scientist posting at AIRBNB INC | **Apply**, 0.395, "Tailor an application (research-and-apply hours)." | Not Apply. It is a Senior Data Scientist role requiring 5+ years (`worked-run-raw/06-browser-check-2026-10-21.txt`), so for a pre-OPT new graduate it should be flagged or skipped. Seeing Apply is a false positive. |
| Deliberate break 1: `npm run ats:liveness -- http://localhost:3000` (`worked-run-raw/01-…`) | `uncertain`, "blocked host localhost", `exit code: 1` | Mode G3: anything not `active` stops the mode |
| Deliberate break 2: `npm run ats:liveness -- not-a-real-url` (`worked-run-raw/02-…`) | `uncertain`, "invalid URL", `exit code: 1` | Mode G3: anything not `active` stops the mode |
| Deliberate check: I opened the five real posting URLs in my own browser on 2026-10-21 | the four the tool marked expired did not show an open posting, and the Airbnb Senior Data Scientist posting loaded with an apply option | matching the tool |

### Did not test

- `ats:liveness` feeding the posting's `liveness` field automatically; values were copied by hand (proposed addition 4 is not built).
- A posting-seniority check; none exists, which is why r01 got Apply.
- Real fit ratings; fit is 0.5 for every posting.
- The titles of the four expired postings, and the employer behind r05.
- That the Lever board "zoox" is the same company as ZOOX INC in the CSV (inferred).
- A posting that loads but has been filled (a live page is not proof the role is open).
- A run on a second machine or a fresh clone for these 2026-10-21 runs.
- Whether any employer still sponsors today; the CSV approval counts carry no year.
- Liveness on other applicant-tracking systems such as Workday or iCIMS; I only checked Lever, Greenhouse and Airbnb's own careers site.
- Postings at the other proven employers in the list.
- CI on PR #56; every run is action_required, so no jobs have run.

### Broke during testing, fixed

- **Username in run outputs.** Failed: the first real-posting run, in a scratch folder, recorded the scratch path, which contains the macOS username, in `out/run.json` (6 places) and `out/report.md` (1). Changed: re-ran with the inputs and `--out` inside `worked-run-raw/05-real-run-2026-10-21/` and repo-relative paths, so no username appears. Both runs were identical apart from the run id. Where: `worked-run-raw/05-real-run-2026-10-21/`.
- G3 wording in the mode file said the liveness check "exits 0", which is wrong for a batch where one URL is active and others are not. Changed the gate text so G3 clears per posting on that posting's own active line. Where: the mode file, G3.

## Reflection

Written by Meena (meenuviji)

**What went well.** The liveness gate did its job on real data. Four of the five real postings (found by Claude in a claude.ai chat session using web search on 2026-10-21; I chose to use them and ran the checks) were already gone (HTTP 404) on the same day, and the gate stopped all four instead of scoring them. Active and expired now have evidence on real postings; uncertain has evidence from the deliberate break tests. The employer my tool could not identify stopped at G1 instead of being guessed. The scorer reproduced my Oct 3 results exactly, and all five real-run outcomes matched the prediction written before the run.

**What the mode got wrong or missed.** The only live posting was a Senior Data Scientist role requiring 5+ years (`worked-run-raw/06-browser-check-2026-10-21.txt`), and my mode recommended Apply. My tool checks seniority in the sponsored titles in the H-1B data but never checks the title of the posting itself, so a senior posting at an employer with entry-level sponsorship history passes as if it were entry level. That is the exact trap my mode exists to catch, one level down. I also had to copy liveness results into the input by hand, the report still labels a real run as "sample" and prints None, and the duplicate employer rows (Peloton INC and LLC) and Twilio's "(L2)" title show my evidence rules are still loose.

**Next steps.** Add a posting-seniority gate that applies the same seniority rules to the posting title before scoring. Feed ats:liveness results into the postings input automatically (addition 4). Make the report label real runs as real and remove the None values. Merge duplicate employer rows before counting evidence.
