# Worked run — Data Engineering / MLOps H-1B triage

## Executive summary

**What this is:** the record of running my recipe's prototype once on real job postings. It
shows the exact inputs and commands, the real terminal output, which values are records and
which are assumptions, how I checked the output, my attempts to break it, and what it got
wrong.

**Why read it:** it is the evidence behind the recipe's claim to have run on sample data. It
also shows where the tool's answers stop being trustworthy.

**What it found:** of 12 real data-engineering and MLOps postings, the tool recommended 2,
flagged 4 to confirm first, and held 6 for missing evidence. Nothing was filled in. One of
the two "apply" results is wrong: it is a job in Ireland, which can't lead to a US visa, and
the tool has no location check. Two more problems surfaced: the job-title keywords matched
one non-data role, and the repo's own posting-liveness checker gives unreliable answers when
it checks several links at once. The deliberate break attempts all failed safely: no report
was written, and no value was invented.

---

## Inputs

| Input | Path | Label |
|---|---|---|
| Persona (fictional) | `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json`: program end 2026-12-12, assumed EAD start 2027-02-01, STEM extension assumed, `@example.com` | your-input |
| 12 postings | `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json`: 11 real public Greenhouse postings (Roku, Roblox, Databricks, Instacart, Robinhood, Upstart, Twilio), fetched 2026-10-01, plus 1 fabricated Databricks job id as a deliberate break | title/url/location: record; `fit` 0.7 and `start_date: "flexible"`: **placeholder your-input** |
| Liveness | `sample/liveness.txt`: real `npm run ats:liveness` output, one URL per call, 2026-10-01 | record |
| Sponsorship + funding | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Form D | `data/sec/form-d/processed/sample/*.sample.json` (50 companies per quarter) | record |
| BLS | `data/bls/compact/soc_occupation_compact.csv` | record |

SHA-256 of every input is in `runs/2026-10-01/de-mlops-h1b-log.json` → `inputs`.

## Commands and real output

Liveness, first as one batch call (output kept as `sample/liveness-batch.txt`):

```
$ npm run ats:liveness -- <12 urls>
Checking 12 URL(s)...
✅ active     https://www.weareroku.com/jobs/7504321?gh_jid=7504321
✅ active     https://www.weareroku.com/jobs/8143097?gh_jid=8143097
⚠️ uncertain  https://careers.roblox.com/jobs/8172297?gh_jid=8172297
           navigation error: page.goto: net::ERR_HTTP2_PROTOCOL_ERROR at https://careers.roblox.com/jobs/8172297?gh_jid=8172297
…
⚠️ uncertain  https://instacart.careers/job/?gh_jid=8143145
           navigation error: page.goto: Navigation to "https://instacart.careers/job/?gh_jid=8143145" is interrupted by another navigation to "https://www.databricks.com/company/careers/field-engineering---fe-direct-regulated/specialist-solutions-architect---data-engineering--warehousing-financial-services--8692962002?gh_jid=8692962002"
…
Results: 2 active  0 expired  10 uncertain
```

Each URL's check was interrupted by the redirect from the URL before it. I re-ran each URL
in its own call (`sample/liveness.txt`):

```
✅ active     https://www.weareroku.com/jobs/7504321?gh_jid=7504321
✅ active     https://www.weareroku.com/jobs/8143097?gh_jid=8143097
⚠️ uncertain  https://careers.roblox.com/jobs/8172297?gh_jid=8172297
           navigation error: page.goto: net::ERR_HTTP2_PROTOCOL_ERROR at https://careers.roblox.com/jobs/8172297?gh_jid=8172297
⚠️ uncertain  https://careers.roblox.com/jobs/7463674?gh_jid=7463674
           navigation error: page.goto: net::ERR_HTTP2_PROTOCOL_ERROR at https://careers.roblox.com/jobs/7463674?gh_jid=7463674
✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8656900002
✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8692962002
⚠️ uncertain  https://instacart.careers/job/?gh_jid=8143145
           content present but no visible apply control found
✅ active     https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660
✅ active     https://careers.upstart.com/jobs?gh_jid=8161883
✅ active     https://job-boards.greenhouse.io/twilio/jobs/7996774
⚠️ uncertain  https://careers.roblox.com/jobs/8055450?gh_jid=8055450
           navigation error: page.goto: net::ERR_HTTP2_PROTOCOL_ERROR at https://careers.roblox.com/jobs/8055450?gh_jid=8055450
⚠️ uncertain  https://job-boards.greenhouse.io/databricks/jobs/9999999999
           content present but no visible apply control found
```

Prototype (`runs/2026-10-01/prototype-stdout.txt`):

```
$ node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt
✓ 12 postings → scored 6 (Apply 2 · Consider 4 · Skip 0) · on hold 6 · not-apply rate 50%
  scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/roles.json  →  scripts/score/role-scorer.mjs
  course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/de-mlops-h1b-log.json  +  course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/de-mlops-h1b-report.md
```

Scorer, called directly on the same `roles.json` (`runs/score-task3.txt`):

```
$ npm run score -- scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/roles.json --out-dir course/2026fa/submissions/gnanasudharsan/runs
✓ scored 6 roles → Apply 2 · Consider 4 · Skip 0 (skip 0%)
  course/2026fa/submissions/gnanasudharsan/runs/role-scores.json  +  course/2026fa/submissions/gnanasudharsan/runs/role-scores.md
```

The scorer's audit trace (`runs/2026-10-01/role-scores.md`, excerpt):

```
| Roku — Senior Data Engineer | 0.525 | **Apply** | composite 0.525 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Twilio — Machine Learning Engineer | 0.525 | **Apply** | composite 0.525 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Roku — Senior Machine Learning Engineer | 0.420 | **Consider** | above threshold (0.420) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Databricks — Specialist Solutions Architect - Data Engineering & Warehousing | 0.420 | **Consider** | above threshold (0.420) but one soft spot: sponsorship tier "Likely" | … |
```

Held (from `runs/2026-10-01/de-mlops-h1b-report.md`): four Roblox/Instacart postings and
the fabricated id → `liveness-unconfirmed`; Upstart → `not-in-dataset`.

Offline test:

```
$ node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/
ℹ tests 14
ℹ pass 14
ℹ fail 0
```

## Verified vs. inferred

| Value | Label | Basis |
|---|---|---|
| Roku 654 approvals / 4 denials; Twilio 802 / 20; Databricks 1,640 / 8; Robinhood 824 / 24 | record | CSV row, exact normalized-name match |
| Top sponsored titles (e.g. Roku: "Senior Data Engineer") | record | CSV `top_job_titles_sponsored` (≤ ~5 titles) |
| Liveness `active` / `uncertain` per URL | record | saved `ats:liveness` output, 2026-10-01 |
| Posting title, URL, board location | record | Greenhouse boards API, 2026-10-01 |
| Databricks in Form D 2025Q4 sample, CSV latest funding 2025-09-08 | record | context only, not scored |
| BLS median $135,980 (15-1243), $133,080 (15-1252) | record | context only; scorer weight 0.0 |
| Title is in the data-engineering / MLOps family | model-judgment | keyword list printed in the report |
| Tier Proven / Likely, and p = 0.9 / 0.6 | model-judgment | tier rule on record counts; p from Ch.11 example values |
| Family → SOC 15-1243 / 15-1252 / 15-2051 | model-judgment | no crosswalk exists in the repo |
| Legal names (Roku Inc, Maplebear Inc, Robinhood Markets Inc, …) | your-input | typed by the agent from public knowledge; Upstart deliberately left without one |
| Program end, EAD start, STEM eligibility, authorization end 2030-01-31 | your-input | fictional persona; rules marked [verify] |
| Registration windows 2027/2028/2029, timeline factor 1.0 | your-input | one-window-per-March assumption, `min(1, seasons/3)` |
| `fit` = 0.7 for every posting, `start_date` = flexible | your-input **placeholder** | not a real rating; fit cannot differentiate roles in this run |
| Composite 0.525 / 0.420, Apply / Consider | scorer output | arithmetic from the above; re-derived by hand below |

## Verification

1. **Hand cross-check against the source CSV** (`runs/break/5-hand-crosscheck.txt`):
   ```
   ROKU INC | Total Approvals 654.0 | Total Denials 4.0 | ['Senior Software Engineer', 'Senior Data Scientist', 'Software Engineer', 'Product Manager', 'Senior Data Engineer']
   TWILIO INC | Total Approvals 802.0 | Total Denials 20.0 | ['Software Engineer (L2)', 'Software Engineer (L3)', 'Machine Learning Engineer (L2)', 'Manager, Software Engineering (L4)', ' Software Engineer (L3)']
   ```
   Both match the report. Roku is Proven for the data-engineer role because "Senior Data Engineer" is in its top titles, and only Likely for the ML-engineer role because no MLOps title is.
2. **Arithmetic by hand:** 0.9 × 0.35 + 0.7 × 0.30 = 0.315 + 0.210 = 0.525. 0.6 × 0.35 + 0.210 = 0.420. Both × 1 × 1. This matches the scorer.
3. **Upstart hold is real, not a bug:** the CSV has 5 rows starting with `UPSTART` (`UPSTART HOLDINGS INC`, `UPSTART NETWORK INC`, …) and none normalizes to `upstart`. Exact match only, so the posting is held.
4. **Break attempts:** see the attestation below. Outputs are in `runs/break/`.

## Attestation

- Recipe: de-mlops-h1b v0.1.0
- By: Gnanasudharsan Ashokumar · signed 2026-10-03. The rows below were first executed by the AI agent (Claude Code) on 2026-10-01. On 2026-10-02 I re-ran the offline tests, the sample run, the trap persona and the past persona myself, in my working copy of commit `98882da`, not a separate clean checkout. All four matched the rows below. The hand-check command the AI gave me used `cut` on the CSV, which splits quoted fields at their commas and printed the wrong columns, so **I did not re-confirm the hand-check row myself**. That row stands on the AI's run only. The mutant and schema-drift break attempts were run by the AI only.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/` | 14 pass, 0 fail | all pass, offline |
| Prototype on `sample/` (12 real postings) | 6 scored (Apply 2 · Consider 4), 6 held, exit 0 | every posting scored or held exactly once; no invented values |
| Hand `grep` of Roku and Twilio in the CSV | approvals, denials, titles identical to the report | identical |
| **Break:** mutant that disables the blank-approvals hold (blank → `Number('')` = 0) | 2 tests fail (`blank Total Approvals → HOLD`, `recent Form D funding does not stand in`); file restored, SHA-256 unchanged | tests catch it |
| **Break:** persona with "OPT EAD not yet authorized" on the real sample | `✗ scorer read the profile … as NOT needing sponsorship … No report written.` exit 3 | exit 3, no report |
| **Break:** persona whose EAD start is already past | `✗ G0 profile gate failed — nothing written` exit 2 | exit 2, no report |
| **Break:** CSV with `Total Approvals` renamed | `✗ CSV … has no "Total Approvals" column — schema drift, refusing to guess` exit 2 | exit 2, no report |
| **Break:** fabricated job id `databricks/jobs/9999999999` | liveness `uncertain` → HOLD `liveness-unconfirmed` | hold, never treated as live |
| `npm run ats:liveness` with 12 URLs in one call | 10 of 12 `uncertain`, each interrupted by the previous URL's redirect | per-URL status; **did not get it** → defect logged, worked around |

### Did not test

- A live posting whose liveness is `expired`. None of the real sample was expired; only the fixture covers it.
- A real company with recent Form D funding and blank approvals among live postings, which is my CHANGE-BRIEF §5 prediction. The only coverage is the Composabl fixture.
- Real fit ratings and real start dates. All 12 are placeholders.
- Any company not on Greenhouse (Google, Amazon, Meta): no real posting tried; covered by fixture only.
- Whether the 60-day EAD start window and the one-registration-window-per-March rule match current USCIS practice.
- `npm run verify` end to end: the manifest step fails locally because Python lacks `yaml`.
- A run on a clean checkout of the branch.

### Broke during testing, fixed

- My 2026-10-02 re-run: the hand-check command (`grep … | cut -d, -f1,16,17`) printed executive-name columns instead of approval counts, because `cut` does not understand quoted CSV fields. Not fixed in my re-run; the CSV-aware check in `runs/break/5-hand-crosscheck.txt` is the AI's.

- Scorer stdout saved in the JSON log contained the scorer's temporary staging path, which includes the OS username. Fixed: only the summary line is kept (`de-mlops-h1b.mjs`, `scorer._stdout`), and the sample run was regenerated.
- First fixture report listed the same company once per posting in the context table, and showed "seasons none" where the real cause was "start before EAD". Fixed: rows de-duplicated; the timeline cell now names the cause.
- Instacart was not found under its brand name (CSV: `MAPLEBEAR INC`). Added an optional `legal_name` (your-input) and a test for both cases.
- Liveness batch interference: worked around by calling the checker once per URL. **Not fixed** in `scripts/ats/check-liveness.mjs`.

## Reflection

**What worked:**
- Holding instead of guessing. Six of twelve postings had a missing piece of evidence, and each one names the piece and a next action.
- The trap guard. The honest phrase a pre-OPT student would type really does zero their sponsorship weight in the maintained scorer, and the prototype refuses to report rather than hiding it.
- The mutation test proves the blank-is-not-zero rule is actually guarded by a test.

**What it got wrong or missed:**
- **An Apply for a job in Ireland.** Twilio's "Remote – Ireland" ML engineer role scored Apply (0.525). The recipe has no location gate, and I (the agent) picked that posting without checking location. For an H-1B triage this is the worst error type: a confident Apply that can never lead to a visa.
- **Keyword false positive.** "Specialist Solutions Architect – Data Engineering & Warehousing" was scored as a data-engineering role (Consider).
- **Seniority.** Nearly every US opening found was Senior or above. The tool can't tell a December-2026 graduate that a role is out of reach.
- **The top-titles field is thin.** Databricks (1,640 approvals) and Robinhood (824) show no data-engineering title in their top five, so they land at Likely. That is probably too cautious, but the data can't say.
- **Skip rate.** Among scored roles, the scorer skipped 0%. The run only reaches a 50% not-apply rate through holds, because the uniform placeholder fit gives every role the same fit vote.

**One concrete next improvement:** add a location gate that holds any posting whose board
location (already recorded in `sample/postings.json`) is not in the US, plus a fixture test
using the Twilio Ireland posting.
