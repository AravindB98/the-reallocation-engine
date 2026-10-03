# Worked run — decgrad-swe1-sponsor-level v0.1.0, 2026-10-01

## Executive summary

This document shows the prototype run once on realistic inputs: a fictional December-graduating student and eleven real Boston-area software postings collected on 1 October 2026. It pastes the real terminal output, separates what came from a record from what a person typed, explains how the output was checked by hand, and reports what went wrong. Result: 4 postings to apply for, 1 to network on first, 2 to skip, and 4 that could not be scored without a hand check. Re-running the same postings as of 15 February 2027 turns all four "apply" results into "skip", because the OPT clock has run out. Two real problems were found and fixed during the run: a bug that the scorer's defaults hid, and a misclassified job title.

## 1. Inputs

| Input | Value | Label |
|---|---|---|
| Persona | "Kiran Rao (fictional)": M.S. (STEM) ends 2026-12-12; OPT start requested 2027-01-04; 90-day unemployment allowance, 0 used, 14-day buffer; 24 months prior experience; target SOC 15-1252, Boston | your-input (fictional; no contact details) |
| Postings | 8 real Greenhouse postings (PathAI, Klaviyo, Cohere Health, Vestmark, Formlabs, Ginkgo Bioworks, Databento, Lexington Medical), plus 3 test rows: a deliberately constructed dead PathAI URL, HubSpot (expected missing from the CSV), and DraftKings (expected blank sponsorship) | URLs: record. Posting fields (grad window, experience cap, start date, the Ginkgo no-sponsorship quote) and fit: **your-input, transcribed from the posting text by the AI agent and to be re-read by Omkar** |
| Parameters | tier_p Proven 0.9 / Likely 0.6 / Possible 0.3 / None 0; min approvals 3; hiring lag 45 days; comfort 30 days | your-input (reasoning in the recipe) |
| Data | 80 Days CSV (30,369 rows), 4 Form D sample files, BLS compact | record |

File: `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.sample.json`.

## 2. Commands and real output

**Step 1. Liveness**, the only network step, using the repo's existing checker:

```
$ npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.urls.txt

Checking 9 URL(s)...

✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002
✅ active     https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003
✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
✅ active     https://job-boards.greenhouse.io/vestmark/jobs/8009953
⚠️ uncertain  https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561
           content present but no visible apply control found
✅ active     https://job-boards.greenhouse.io/ginkgobioworks/jobs/5166911007
✅ active     https://job-boards.greenhouse.io/databento/jobs/8076835
✅ active     https://job-boards.greenhouse.io/lexingtonmedical/jobs/5419363008
⚠️ uncertain  https://job-boards.greenhouse.io/pathai/jobs/1000000001
           navigation error: page.goto: Timeout 15000ms exceeded.

Results: 7 active  0 expired  2 uncertain
```

(The first attempt failed with `browserType.launch: Executable doesn't exist`. `npx playwright install chromium` fixed it.)

**Step 2. Triage**, offline, calling the maintained scorer:

```
$ node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs
✓ triage: 11 roles → scored 7 (Apply 4 · Consider 1 · Skip 2) · not scored 4
  Apply       pathai-swe1-fullstack  composite 0.525
  Apply       klaviyo-swe2-recommendations  composite 0.465
  Apply       coherehealth-swe2  composite 0.495
  Apply       vestmark-swe  composite 0.525
  Not scored  formlabs-swe-ecommerce  [liveness-uncertain]
  Skip        ginkgo-swe2-autonomous-lab  composite 0.285
  Consider    databento-swe-typescript  composite 0.285
  Skip        lexington-embedded-swe  composite 0.195
  Not scored  pathai-deliberately-dead-url  [liveness-uncertain]
  Not scored  hubspot-not-in-csv  [no-company-match]
  Not scored  draftkings-no-sponsorship-record  [no-sponsorship-record, no-liveness-record]
  course/2026fa/submissions/o7580/runs/sample/triage-log.json  +  course/2026fa/submissions/o7580/runs/sample/triage-report.md  (scorer: course/2026fa/submissions/o7580/runs/sample/roles.json → role-scores.json/.md)
exit=0
```

**Step 3. Same postings, later date.** The student is now 42 days into the clock:

```
$ node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs --as-of 2027-02-15 --days-used 42 --out-dir course/2026fa/submissions/o7580/runs/asof-2027-02-15
✓ triage: 11 roles → scored 7 (Apply 0 · Consider 0 · Skip 7) · not scored 4
  Skip        pathai-swe1-fullstack  composite 0
  …  (all seven scored roles: Skip, composite 0)
```

and from that run's report:

```
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
```

**Step 4. Test:** `node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs` → `# tests 13 · # pass 13 · # fail 0`.

## 3. Verified vs. inferred, line by line

Two rows in full, pasted from `runs/sample/triage-report.md`. The label at the end of each line is the prototype's own.

**PathAI, Software Engineer I, Fullstack → Apply (0.525)**

| Line | Label | Where it comes from |
|---|---|---|
| Company match: PATHAI INC, CAMBRIDGE, MA | record | CSV row, exact normalized name |
| Tier **Proven**: at-level title "Software Engineer I", approvals 78 ≥ 3 | record (fixed rule over record fields) | CSV `top_job_titles_sponsored`, `Total Approvals` |
| p = 0.9 | your-input | tier map in the scenario `params` |
| approvals 78, denials 2, rate 97.5 | record | CSV |
| Liveness active → 1 | record | saved `ats:liveness` output, 2026-10-01 |
| Fit 0.7 | your-input | typed from the posting text; **no model scored fit** |
| Timeline factor 1: start 2027-01-04, deadline 2027-03-21, slack 76 days | your-input | persona dates + the 45-day lag assumption; arithmetic shown |
| LCA median $145,600 (all titles) vs BLS 15-1252 median $133,080 | record, **context only** | CSV / BLS compact; not in the score |
| Composite `(0.9·0.35 + 0.7·0.3) × 1 × 1 = 0.525` → Apply | scorer output | `scripts/score/role-scorer.mjs`, unchanged |

**Ginkgo Bioworks, Software Engineer 2 → Skip (override; machine said Consider 0.285)**

| Line | Label | Where it comes from |
|---|---|---|
| approvals 122, denials 12, rate 91.04 | record | CSV |
| Tier **Possible**: no 15-1252 title among the 5 listed | record (fixed rule) | CSV. The only software-sounding title is "Software Engineering Manager", a management occupation |
| Override **Skip**: *"We are unable to sponsor or take over sponsorship of H-1B visas at this time."* (read 2026-10-01) | your-input | the posting text, transcribed |
| Composite 0.285 → machine Consider; final Skip | scorer output | the scorer's own override rule (decision + documented reason) |

**Across all 11 rows:** company, approvals, title lists, and liveness are `record`. Every p mapping, fit, posting field, date, and lag is `your-input`. **Model-judgment count: 0.** No AI produced a number in this run. The AI agent did *transcribe* posting fields, and that is the weakest link in the input. It's labeled your-input because a person must re-read the posting and own the value.

## 4. Verification: how I know the output is real

1. **Hand cross-check against the raw CSV**, bypassing my parser (`grep` and `awk`, then Python's `csv` module):
   - PathAI: `97.5,145600.0,"['Software Engineer I', …` and approvals/denials `78.0 2.0` ✓
   - Vestmark: `52.0,0.0,100.0,117101.0,"['Software Engineer', 'Senior QA Automation Engineer']"` ✓
   - Databento: `6.0,0.0,100.0,170000.0,['SENIOR UI/UX ENGINEER']` ✓
   - DraftKings: row ends `,,,,,` (blank) ✓
   - `grep -ci "^hubspot"` → `0` ✓
   - BLS 15-1252: `133080.0 2024` ✓
2. **Posting text read from the source**: the Greenhouse API `content` for each job, on 2026-10-01. Ginkgo's no-sponsorship sentence and Formlabs' "4+ years" come from there.
3. **The dead URL checked independently**: `curl -L` returned `200 https://www.pathai.com/careers redirects=4`. So `uncertain` is the checker's honest answer, not a parsing bug of mine.
4. **The scorer is the maintained one**: `role-scores.json` carries `"_scorer": "bayesian-role-scorer"`, and the end-to-end test asserts it.
5. **Deliberate breaks**: five attempts, all in `break-tests.txt` and summarized in the attestation below.

## 5. Reflection

**What worked.**
- Refusing to score absence was the most useful rule. Four of eleven rows ended "Not scored", and each came with a concrete next step instead of a fabricated 0.
- The date re-run made the visa clock tangible. Nothing about the postings changed between October and February, and every decision flipped.
- Reusing the scorer's own override for "the posting says no sponsorship" kept the machine's opinion visible beside the human fact.

**What the prototype got wrong or missed, found during this session:**

1. **A bug the scorer's defaults hid.** An object-spread ordering mistake left `timeline.factor` `undefined` in `roles.json`. The scorer silently treated it as 1 (`?? 1`), and the output was **identical** to the correct output, because every true factor was also 1. I noticed only by reading `roles.json` line by line. I fixed it and added a guard that refuses to hand the scorer any non-number. Break 1 shows the guard catching the reintroduced bug. My CHANGE-BRIEF predicted that "at least one value will be silently defaulted". It was, and in the most dangerous place: a gate.
2. **A misclassified title.** "Software Engineering Manager" counted as a senior SWE title, which tiered Ginkgo as *Likely* (0.6) instead of *Possible* (0.3). That is the classifier weakness CHANGE-BRIEF predicted. Fixed with a management-title rule and three new test assertions. Ginkgo's final decision didn't change, because the override already forced Skip. Its evidence did.
3. **My liveness prediction was wrong.** I expected a dead posting to show as `expired`. Greenhouse redirects dead job IDs to the careers page, so the checker returns `uncertain`. The gated-Skip path is exercised only by a fixture, not by real data.
4. **The skip rate is 29% (2 of 7 scored),** under the engine's "healthy ≥ 50%" guide. Two causes. I hand-picked postings that looked entry-level, so the list was pre-filtered. And in the scorer's configuration a Proven sponsor clears Apply on its own (0.315 ≥ 0.30): Formlabs' "4+ years required" posting, with fit 0.2, would have scored Apply had its liveness come back active. I checked this by re-running with that one log line flipped to `active` in a temp dir: `Apply formlabs-swe-ecommerce composite 0.375`. I did not change weights to raise the skip rate. I proposed a scorer change for a maintainer instead (recipe TODO 5).
5. **Missed: a stale persona still produces confident output.** Re-running as of February *without* updating the days used still gives 4 Apply. The prototype only adds a "human check" flag.

**One concrete next improvement:** the Greenhouse board-API liveness check (recipe TODO 3). `boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` returns 404 for a dead ID, so the deliberately dead URL would read `expired` instead of `uncertain`. That turns a hand check into a record for most of this list, since all 9 checked URLs are Greenhouse-hosted or carry a Greenhouse `gh_jid`.

## Attestation

- Recipe: decgrad-swe1-sponsor-level v0.1.0
- By: **pending: Omkar Salian must personally re-run the "Tested" rows and sign with the date.** Every row below was run and observed by the AI agent (Claude Code) on 2026-10-01 under Omkar's direction. Until it is signed, this is a record of what the agent saw, not a human attestation.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node …/triage.mjs` (sample) | exit 0; 11 → Apply 4 · Consider 1 · Skip 2 · Not scored 4; both outputs written | both outputs; every missing case Not scored |
| `node --test …/test/triage.test.mjs` | 13/13 pass (also on a fresh clone with `npm ci`) | all pass, offline |
| `node scripts/conformance.mjs scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/` | `7 files … ✓ all conform` | conform |
| `npm run doctor` / `npm run verify`, before and after | exit 0 / exit 0; verify 158 → 167 files | unchanged pass |
| `node scripts/pii-scan.mjs --diff origin/main` (scratch branch) | `pii-scan: clean ✓` | clean |
| `--as-of 2027-02-15 --days-used 42` | all 7 scored → Skip, `unemployment-clock-exceeded` | gate closes |
| CSV values for PathAI, Vestmark, Databento, DraftKings, HubSpot, BLS 15-1252, checked by hand | all match the report | match |
| **Break 1:** reintroduce the spread bug | run refuses: `timeline.factor = undefined — refusing to pass a non-number`; test 11 fails | caught |
| **Break 2:** score a blank approvals field as 0 | tests 5 and 11 fail | caught |
| **Break 3:** hand the *scorer* a role with no timeline | scorer returns **Apply** with timeline multiplier 1 | shows the scorer fails open, which is why the guard exists |
| **Break 4:** malformed JSON / missing CSV / `--out-dir data/examples` / `--days-used abc` | exit 2 with a one-line reason each; nothing written | refuse |
| **Break 5:** `--as-of 2027-02-15` without updating days used | still 4 Apply; "human check" flag in the report | flag only. **A known gap**, not a pass |

### Did not test
- A posting that the checker reports as `expired` on real data (none was found; fixture only).
- Any Lever, Ashby, or Workday posting. All 8 real postings are on Greenhouse.
- Persona fields other than this one fictional case: STEM extension (150 days), cap-gap, or an H-1B transfer.
- Whether the 45-day hiring lag is realistic for any of these employers.
- The tier rule over the whole CSV. I checked titles for the ~10 companies used, not all 1,557 rows that have a sponsorship record.
- Running on Node 20 specifically. Local runs used Node 22.16.0. CI uses Node 20.
- Running from the committed branch. Not committed yet, by instruction; the clean-clone copy is the closest stand-in.

### Broke during testing, fixed
- `timeline.factor` was `undefined` (object-spread order in `triage.mjs`). Fixed the order, and added a numeric guard before the scorer call.
- "Software Engineering Manager" was counted as a senior SWE title. Added `MANAGEMENT`/`IC_WORD` in `lib.mjs`, plus test assertions.
- `--out-dir` in the OS temp dir was refused on macOS (`/var` → `/private/var` symlink). Now resolves the nearest existing ancestor.
- `node --test <directory>` fails on Node 22 (`Cannot find module …/test`). The documented command names the test file.
