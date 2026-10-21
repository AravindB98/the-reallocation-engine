# Worked run — ms-is-swe-opt-shortlist v0.2.0 (Mode Build)

## Executive summary

This document records one real run of a job-search mode for an international master's student in Information Systems (graduating December 2026, F-1 OPT) who wants entry-level software engineer jobs. Twelve entries went in: seven real job postings and five companies with no posting. The mode checked each against the repository's sponsorship data and an OPT countdown, and the repository's own liveness checker was run on every posting. Three entries received a score (one Apply, two Skip), one was checked as a no-sponsorship "bridge" job, and eight were deliberately left unscored with a stated reason. The most useful findings are about what the mode cannot see: citizenship and clearance requirements, seniority, large employers missing from the data, and a stale snapshot. Two postings turned out to be gone: the liveness checker caught one (Intuit) but wrongly called another (Cohere Health) active, and only a person opening the page caught that. All pasted output is real; where something is a person's judgment, it says so. The student reopened the Apply and bridge postings on 2026-10-21 and confirmed they are live.

## Run record

- **Mode:** `recipes/cases/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist.md`, v0.2.0, status RUNNABLE-SAMPLE (sample run; no live gate cleared)
- **Date:** 2026-10-21 (`--as-of`); OPT start `2027-01-15` is a placeholder, not the student's real date
- **Parameters:** 90-day unemployment window, 45-day hiring lag, flat fit 0.5
- **Data:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, 30,369 rows, sha256 `eccdee2a…6270` (matches `sha256sum`), newest funding date 2025-09-26 (390 days before the as-of date)
- **Postings file:** `course/2026fa/submissions/Vrajesh-works/mode-build/postings-2026-10-21.json` (same 12 entries as the earlier run; liveness re-checked, with the Cohere Health correction described below)
- **Outputs:** `mode-build/runs/shortlist-log.json` (agent), `shortlist-report.md` (human), plus `roles.json` and the scorer's own `role-scores.json` / `.md`

## Commands and real output

```text
$ npm run verify
conformance: 164 files (88 md · 36 py · 32 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)
```

```text
$ npm run ats:liveness -- <7 posting URLs>
✅ active     https://job-boards.greenhouse.io/verkada/jobs/5194598007
✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
✅ active     https://recruiterflow.com/db_7a69c9023a9214124b1bf3a909223f08/jobs/69
❌ expired    https://jobs.intuit.com/job/mountain-view/software-engineer-1/27595/87369448720
           HTTP 404
✅ active     https://jobs.ashbyhq.com/confido/69c0e572-b2f4-442f-beb8-1240155c629e
✅ active     https://jobs.boeing.com/job/annapolis-junction/software-engineer-entry-level/185/100460245872
✅ active     https://motionrecruitment.com/tech-jobs/danvers-/contract/backend-devops-engineer/885698
Results: 6 active  1 expired  0 uncertain
```

The checker's **Cohere Health line above is wrong.** On 2026-10-21 the student opened that page and it said "The job you are looking for is no longer open." A read-only fetch showed why: Greenhouse sends a removed job to the company's board and still answers HTTP 200.

```text
$ curl -sL -o /dev/null -w "http=%{http_code} final=%{url_effective}" https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
http=200 final=https://job-boards.greenhouse.io/coherehealth?error=true
$ curl -sL ... https://job-boards.greenhouse.io/verkada/jobs/5194598007
http=200 final=https://job-boards.greenhouse.io/verkada/jobs/5194598007   (title: "Job Application for Backend Engineer - Connectivity at Verkada")
```

Cohere Health was therefore typed as `dead` (checked 2026-10-21, by a person) and the prototype was re-run. Verkada and Motion Recruitment were reopened by the student the same day and are live.

```text
$ node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
    --postings course/2026fa/submissions/Vrajesh-works/mode-build/postings-2026-10-21.json \
    --as-of 2026-10-21 --opt-start 2027-01-15 --out-dir course/2026fa/submissions/Vrajesh-works/mode-build/runs
✓ 3/12 scored · ✓ scored 3 roles → Apply 1 · Consider 0 · Skip 2 (skip 67%)
```

(The first run, before the Cohere correction, printed `Apply 1 · Consider 1 · Skip 1 (skip 33%)`.)

Outcome per entry (from `runs/shortlist-report.md`):

| Company | Status | Result |
|---|---|---|
| Verkada | scored | Apply (272 approvals, 98.6%, tier Proven) |
| Cohere Health | scored | Skip: posting dead, "Network, don't apply" (104 / 98.1%, tier Likely) |
| Confido | scored | Skip (no approvals on record) |
| Talent Vine, Boeing | excluded | human read: citizenship / TS-SCI clearance required |
| Motion Recruitment | opt-bridge-open | live + timeline room; no sponsorship score |
| Intuit, Google | not-in-csv | no score; absence is not evidence either way |
| Databricks, Whatnot, Grammarly, Foursquare Labs | no-posting | network targets (tier Proven) |

## Verified vs. inferred

| Value | Label | Basis |
|---|---|---|
| Verkada 272 approvals, 4 denials, rate 98.6% | record | raw CSV row; recomputed 272 / (272 + 4) = 0.9855 |
| CSV hash | record | `sha256sum` equals the hash in `shortlist-log.json` |
| Funding dates and stages | record, **stale** | data ends 2025-09-26 |
| Tier Proven / Likely / None and its probability | rule over record fields | thresholds are the student's choices, printed in the report |
| "Non-senior software title" | inference | the CSV lists top titles only |
| Posting liveness | your-input (transcribed) | `npm run ats:liveness` output **plus** a person opening the page; the prototype did not check. The checker alone was wrong for Cohere Health |
| Cohere Health posting is gone | your-input (human read the page), 2026-10-21 | the checker said active; HTTP 200 with a redirect to the board's error page explains the miss |
| Verkada and Motion Recruitment are live | your-input (human), 2026-10-21 | the student reopened both pages |
| Intuit posting is expired | record from checker (HTTP 404), 2026-10-19 | it did not change a decision: Intuit is not in the CSV |
| Talent Vine and Boeing exclusions | your-input | a person read the posting text; Boeing's citizenship need is a reading of the clearance requirement |
| Timeline factor 1 | your-input | window ends 2027-04-15; 176 days remain; slack ≥ lag |
| Fit 0.5 | your-input | flat; does not rank companies |
| "Entry-level" for any role | **not verified** | data cannot say |
| Whether any company sponsors now | **not verified** | snapshot is 390 days old |

## Verification

- JSON log parses; `counts` = `{postings:12, scored:3, opt_bridge_checked:1, unscored:8}`; `human_gate` in the JSON is still `{cleared:false, by:null, date:null}` because the program never edits it; the person's confirmation is recorded in the RUN_LOG entry.
- CSV hash matches; one count recomputed by hand (above).
- 17 offline tests pass (`node --test …/shortlist.test.mjs`: `# pass 17`).
- Deliberate break attempts: see the attestation.

## Reflection

*Went well.* The mode ran end to end on real data in seconds, every number traces to a CSV row or to the existing scorer, and the refusals worked: 8 of 12 entries were not scored, each with a reason. The human gate did its job: the liveness checker said Cohere Health was active, a person opened the page, and it was gone. The dead-posting path was then exercised for real, not by a fixture, and moved Cohere from Consider to "network, don't apply".

*Got wrong or missed.* The liveness checker has a false positive on Greenhouse: removed jobs redirect to the board with HTTP 200, so it printed active for a dead posting. I did not change the checker (it is the engine's code); the mode relies on a human to reopen the page instead, and the defect is logged. Separately, the Intuit posting is dead but the program never says so, because "not in the CSV" ends processing before liveness is looked at. After the correction the skip rate on the scored roles is 67%, but three scored roles is too few to judge. Funding recency changes no decision, entry-level cannot be seen, and the sponsorship tier is a rule I set, not a measurement.

*Next steps.* (1) Surface a dead-posting note for unscored rows. (2) Obtain DOL LCA/H-1B disclosure records to cover large employers such as Intuit (`[TODO: DATA SOURCE]`). (3) Refresh the sponsor data, since the snapshot predates the newest H-1B rule changes. (4) Report the Greenhouse false positive upstream, or add a check for a `?error=true` redirect. (5) Re-check liveness again before applying: postings close quickly.

## Attestation

- Recipe: ms-is-swe-opt-shortlist v0.2.0
- By: Vrajesh Mathurbhai Nasit · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run ats:liveness` on 7 URLs | 6 active, 1 expired (Intuit, HTTP 404), 0 uncertain | each URL gets a correct status |
| **break (real):** student opened the Cohere Health page the checker called active | "The job you are looking for is no longer open."; `curl` showed an HTTP 200 redirect to `?error=true` | checker and page agree. **They did not**: checker false positive |
| prototype on 12 entries, `--as-of 2026-10-21`, Cohere typed dead | `3/12 scored · Apply 1 · Consider 0 · Skip 2` | URL + dated live result + CSV row score; the rest are unscored with a reason; a dead posting is never Apply/Consider |
| **break (synthetic, run 2026-10-19 before the correction):** Verkada posting set to `dead` | `scored`, Skip, tier Proven, "Network, don't apply: posting is dead but sponsor history is real." | dead posting is gated to Skip, not Apply |
| **break:** `--as-of 2027-04-20` (after the OPT window) | all 3 scored roles Skip (`skip 100%`) | timeline gate closes |
| **break:** `--as-of 2026-02-30` | `✗ --as-of is not a real date`, exit 2 | rejected |
| **break:** `--out-dir data/examples` (tracked) | exit 2, "would overwrite tracked files"; `git status data` empty | refused |
| `node --test …/shortlist.test.mjs` | 17 tests, 17 pass | all pass |

### Did not test

- That every posting's text matches the student's fit (the student confirmed only that the Apply and bridge pages are live).
- Misspelled company names, undated liveness and `--fit` bounds were covered by earlier-run fixtures and tests, not re-run by hand here.
- Linux/macOS, Node 20, GitHub CI, a clean checkout.
- Whether any role's level, location, or sponsorship stance matches the student.
- The scorer's `Consider` floor (0.20) and `role_quality` weight, which are the engine's own `[VERIFY]` items.

### Broke during testing, fixed

- **The liveness checker reported Cohere Health active when the job was gone** (Greenhouse redirect with HTTP 200). Not fixed in the engine; the mode corrected it with a human-typed `dead`, and the run was redone. Logged as a defect.
- My first dead-posting break attempt failed only because of a Git Bash path passed to Node (`/c/...`); it was a scripting error in the test harness, not in the mode, and passed once rerun with a Windows-style path.
- From the earlier run: `--as-of 2026-02-30` used to be accepted (date rolled to March 2); fixed in `parseDate` with a round-trip check and regression assertions.
