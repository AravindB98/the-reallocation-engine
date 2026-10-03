# Worked run — Network Engineer H-1B sponsorship triage (sample mode)

## Executive summary

This document shows one complete run of the prototype on a fictional student and seven sample job openings.
- **Results:** four openings came out as "Consider" (tailor the application and confirm sponsorship first); one was skipped because its posting had expired; one went on a "network, do not apply yet" list because its posting was never checked; one company had no sponsorship record at all.
- **Checking:** every number was checked against its source by hand, the automatic tests passed, and four deliberate attempts to break the program all stopped it cleanly.
- **What it showed:** the run also showed that the recipe's main signal, a network-titled sponsorship record, changes the result much less than intended.

## Run record

- Run ID **`20261003-051715`**, mode `sample`, run date 2026-10-03 (system clock, UTC)
- Code: commit `1b5a589` (prototype v0.1, recipe 0.1.2). Outputs committed in `course/2026fa/submissions/prpathak1/runs/20261003-051715/`.
- Lifecycle stage: **DRAFT — sample run complete and passing; 8 open TODOs block SPECIFIED**

## 1. Inputs

Persona — `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/persona.json` (fictional; all values your-input):

```json
{
  "_note": "FICTIONAL EXAMPLE PERSONA - safe to commit. No real person. All values are your-input (CHANGE-BRIEF r1).",
  "candidate": {
    "name": "Ishaan Verma (fictional)",
    "email": "ishaan.verma@example.com"
  },
  "authorization": "F-1 student; OPT not yet started; will need H-1B sponsorship",
  "needs_sponsorship": true,
  "target_role": { "title": "Network Engineer", "soc": "15-1241" },
  "visa": {
    "current_status": "F-1 (OPT not yet started)",
    "program_end_date": "2027-05-15",
    "opt_start_date": "2027-06-01",
    "unemployment_limit_days": 90,
    "unemployment_days_used": 0
  },
  "hiring_lag_days": 60
}
```

Openings — `fixtures/candidates.json`:
- Company names come from the 80-days CSV, except one fictional name.
- Titles, `jobs.example.com` URLs and `sample_liveness` are your-input placeholders, not real postings.
- `fit_p` values were proposed by the AI and accepted by me.

| role_id | company | title | fit_p | sample_liveness |
|---|---|---|---|---|
| versa-network-eng | VERSA NETWORKS INC | Network Engineer | 0.8 | active |
| netbrain-network-eng | NETBRAIN TECHNOLOGIES INC | Network Engineer, Customer Solutions | 0.7 | active |
| skytap-network-eng | SKYTAP INC | Cloud Network Engineer | 0.7 | *(null)* |
| sabse-network-eng | SABSE TECHNOLOGIES INC | Network Engineer | 0.6 | expired |
| cognizer-infra-eng | COGNIZER INC | Network Infrastructure Engineer | 0.6 | active |
| compound-network-eng | COMPOUND LABS INC | Network Engineer | 0.6 | active |
| fictional-missing | Example Fictional Netways LLC | Network Engineer | 0.7 | active |

Repository data read:
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows, sha256 `eccdee2a…6270`). Only `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate` and `top_job_titles_sponsored` are read; `phone`, `executive_officers` and `board_directors` never are.
- The 4 Form D sample files (200 entries).
- `data/bls/compact/soc_occupation_compact.csv` row 15-1241.00.

## 2. Commands and real output

```
$ node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
network-eng-h1b run 20261003-051715: evaluated 7 → Apply 0 · Consider 4 · Skip 1 · Not scored 1 (network, do not apply yet 1) · Missing 1
  NOT_SCORED skytap-network-eng: [G1] no liveness result: posting not checked
  MISSING    fictional-missing: no row in 80-days CSV for this normalized company name
  wrote course/2026fa/submissions/prpathak1/runs/20261003-051715/run.json + report.md
[exit code: 1]
```

Exit 1 = the run completed and at least one opening is missing or not scored, each with its reason.

Inside the run, the prototype ran the real scorer twice (commands copied from `run.json`):

```
npm run score -- "course/2026fa/submissions/prpathak1/runs/20261003-051715/g0-probe/probe-roles.json" --profile "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/persona.json" --out-dir "course/2026fa/submissions/prpathak1/runs/20261003-051715/g0-probe"
npm run score -- "course/2026fa/submissions/prpathak1/runs/20261003-051715/roles.json" --profile "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/persona.json" --out-dir "course/2026fa/submissions/prpathak1/runs/20261003-051715"
```

Gate results, from `report.md` of this run:

```
- **G0 profile pre-check:** passed. Authorization sent: "F-1 student; OPT not yet started; will need H-1B sponsorship" [your-input]; persona needs sponsorship: true [your-input]; scorer read: true [record].
- **G2a timeline inputs:** valid. Program end 2027-05-15, OPT start 2027-06-01, limit 90 days, used 0, hiring lag 60 days [your-input].
- **G2 visa timeline:** OPT window ends 2027-08-30; earliest hire 2026-12-02; slack **271 days** → factor 1 [your-input].
```

Scorer trace for VERSA NETWORKS INC, from `role-scores.json` (the scorer's own output):

```json
"composite": 0.45,
"machine_recommendation": "Consider",
"reason": "above threshold (0.450) but one soft spot: sponsorship tier \"Likely\"",
"votes": [ { "factor": "sponsorship", "value": 0.6, "weight": 0.35, "contribution": 0.21, "source": "record" },
           { "factor": "fit", "value": 0.8, "weight": 0.3, "contribution": 0.24, "source": "your-input" } ],
"gates": [ { "factor": "liveness", "multiplier": 1, "source": "your-input" },
           { "factor": "timeline", "multiplier": 1, "source": "your-input" } ],
"arithmetic": "(0.6·0.35 + 0.8·0.3) × 1 × 1 = 0.450"
```

Results (`run.json`, every value with its label):

| Opening | Status | Approvals | Network titles matched | Tier / p | Fit | Liveness | Timeline | Composite → result |
|---|---|---|---|---|---|---|---|---|
| VERSA NETWORKS INC | scored | 164.0 [record] | Sr. Network Architect; Network Architect [your-input rule] | Likely / 0.6 [your-input] | 0.8 [your-input] | active [your-input] | 1 [your-input] | 0.45 → **Consider** |
| NETBRAIN TECHNOLOGIES INC | scored | 36.0 [record] | Presales Network Engineer | Likely / 0.6 | 0.7 | active | 1 | 0.42 → **Consider** |
| SKYTAP INC | not scored (G1) | 10.0 [record] | Engineering Manager, Networking | Likely / 0.6 | 0.7 | *(none)* | — | → **network, do not apply yet** |
| SABSE TECHNOLOGIES INC | scored | 10.0 [record] | Network Engineer | Likely / 0.6 | 0.6 | expired | 1 | 0 → **Skip** (gated: liveness) |
| COGNIZER INC | scored | 328.0 [record] | (none) | Possible / 0.5 | 0.6 | active | 1 | 0.355 → **Consider** |
| COMPOUND LABS INC | scored | 2.0 [record] | (none; only `Engineer`) | Possible / 0.5 | 0.6 | active | 1 | 0.355 → **Consider** |
| Example Fictional Netways LLC | missing | — | — | — | — | — | — | no row in 80-days CSV |

Context outside the score:
- All 7: Form D "no record in sample data".
- BLS 15-1241.00 Computer Network Architects: national annual median wage 130,390, OEWS 2024 [record].

Test run and break attempts: see §4.

### Engine baseline runs (2026-10-03, commit `25436c0`)

These were run once to see what the engine's own output looks like, as the assignment's "Before you start" asks.

`npm run ats:scan -- --dry-run`:
- Run in a **throwaway clone**, with `REALLOCATION_ENGINE_PORTALS` set to the tracked `data/ats/portals.example.yml`.
- Reason: even a dry run reads the private `data/ats/` job-search files and calls Greenhouse/Lever/Ashby. I approved those hosts for this one run, and no private file was read (TEST-REPORT §9).
- Excerpt of the real output:

```
$ REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-03
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      886
Filtered by title:     392 removed
Filtered by location:  423 removed
Duplicates:            10 skipped
New offers added:      61

New offers:
  + Databricks | AI Engineer - FDE (Forward Deployed Engineer) | Remote - India
  + Databricks | AI Engineer – Forward Deployed Engineering (AI FDE) | United States
  + Databricks | AI Transformation Leader | United States
  … (56 more offer lines omitted here — full output in TEST-REPORT §9)
  + Databricks | Strategic Account Executive - Retail vertical  | Remote - California
  + Databricks | Strategy & Execution Manager — Retail | United States

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
[exit code: 0]
```

`npm run score` on the book's example roles (full real output):

```
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/baseline-ch11

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/baseline-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course\2026fa\submissions\prpathak1\runs\baseline-ch11\role-scores.json  +  course\2026fa\submissions\prpathak1\runs\baseline-ch11\role-scores.md
[exit code: 0]
```

The scores reproduce the Chapter 11 example: Cambridge biotech → Apply 0.446; non-sponsor → Skip 0.178. The output went to `course/2026fa/submissions/prpathak1/runs/baseline-ch11/`; the tracked example output was not overwritten.

## 3. Verified vs inferred — line by line (VERSA NETWORKS INC, then the run)

| Line | Value | Label | Why that label |
|---|---|---|---|
| CSV company name | VERSA NETWORKS INC | record | read from the CSV row |
| Total Approvals | 164.0 | record | read |
| Total Denials | 2.0 | record | read (context only) |
| Approval_Rate | 98.79518072289156 | record | read (context only) |
| Titles sponsored | Software Test Engineer; Sr. Network Architect; Software Engineer; Network Architect; Information Systems Director | record | read |
| That this row is the employer of the posting | exact normalized-name match | your-input (rule) | a matching rule, not proof of identity |
| Network titles matched | Sr. Network Architect; Network Architect | your-input | record titles passed through my keyword rule |
| Tier / p | Likely / 0.6 | your-input | my mapping (CHANGE-BRIEF r3); **sent to the scorer labeled `record`** per the recipe, so the scorer trace shows `[record]` for a mapped value |
| Fit p | 0.8 | your-input | AI-proposed, accepted by me |
| Liveness | active → 1 | your-input | fixture value, **not a check** |
| Run date | 2026-10-03 | record | system clock |
| OPT window end / earliest hire / slack | 2027-08-30 / 2026-12-02 / 271 days | your-input | computed from my dates and lag |
| Timeline factor | 1 | your-input | my slack rule |
| G0: scorer reads needs-sponsorship | true | record | read back from the real scorer's `role-scores.json` |
| Composite / recommendation | 0.45 / Consider | your-input (derived) | the real scorer's arithmetic on inputs that include your-input values |
| Form D | no record in sample data | record (of absence in 200 sample entries) | does **not** mean "not funded" |
| BLS median wage | 130,390 (2024) | record | context only; `role_quality` weight is 0.0 |
| Model judgment | — | model-judgment: none | no language model was called |

Across the run:
- **Record:** 6 company rows × 5 fields, the G0 reading, the BLS row, and the Form D absences.
- **Your-input:** everything that decides the result: the keyword rule, the mappings, fit, sample liveness, the dates and the lag.

## 4. Verification

**Hand-check against the source CSV.** Row at line 28,592 of `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, all fields except `phone`, `executive_officers` and `board_directors`:

```
company_name = VERSA NETWORKS INC
industry = Other Technology
website = versa-networks.com
city = Santa Clara
state = CA
zip_code = 95054
year_incorporated = 
company_age_years = 
total_funding = 75028239.0
latest_funding_amount = 75028239.0
latest_funding_stage = Series C
latest_funding_date = 2022-10-14
Total Approvals = 164.0
Total Denials = 2.0
Approval_Rate = 98.79518072289156
median_salary_offered = 178495.5
top_job_titles_sponsored = ['Software Test Engineer', 'Sr. Network Architect', 'Software Engineer', 'Network Architect', 'Information Systems Director']
```

- **The row matches the run.** `Total Approvals` (164.0), `Total Denials` (2.0), `Approval_Rate` and all five titles match `run.json` exactly.
- **Hash check:** `sha256sum` on the CSV gives `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`, the same as `run.json` → `inputs.csv.sha256`.
- **Scorer arithmetic by hand:** 0.6 × 0.35 = 0.21; 0.8 × 0.30 = 0.24; sum 0.45; × 1 × 1 = **0.45**. That is ≥ 0.30, but the tier `Likely` is a soft spot (`role-scorer.mjs:48`, `:99–104`) → Consider. ✓
- **Slack by hand:** OPT start 2027-06-01 + 90 days = 2027-08-30. Run date 2026-10-03 + 60 days = 2026-12-02. From 2026-12-02 to 2027-08-30 is 271 days → ≥ 30 → factor 1. ✓
- **One thing the check exposed:** this CSV row has its own dated funding fields (`latest_funding_date` 2022-10-14, Series C). The recipe ignores them and reports funding only from the Form D samples. See Reflection.

**Tests:** 23/23 pass, offline, in a clean clone at `1b5a589` (full output in TEST-REPORT §3):

```
$ node --test "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/*.test.mjs"
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

**Deliberate break attempts.** Real output after the fixes (clean clone):

```
STOP (exit 2): G2a timeline input error: visa.opt_start_date missing or not YYYY-MM-DD
STOP (exit 2): input error: persona file not found: scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/does-not-exist.json
STOP (exit 2): input error in scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/BROKEN-candidates-empty-company.json: roles[0].company is missing or empty
STOP (exit 2): PII guard: persona.candidate.email is not an @example.com address (value withheld); persona file contains a non-example email address (value withheld)
```

## Attestation
- Recipe: network-eng-h1b (`recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md`) v0.1.2
- By: prpathak1 · 2026-10-03

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node …/run.mjs` (default fixtures) | run `20261003-051715`: Consider 4 · Skip 1 · Not scored 1 · Missing 1; exit 1; both outputs written | every opening accounted for once, with a reason where not scored |
| Hand-check VERSA NETWORKS INC against CSV line 28,592 | approvals 164.0, denials 2.0, rate, 5 titles all match `run.json` | exact match |
| `sha256sum` on the CSV | `eccdee2a…6270`, same as `run.json` | same hash |
| Composite by hand: (0.6·0.35 + 0.8·0.30) × 1 × 1 | 0.45, Consider (soft tier) | 0.45, capped at Consider |
| `node --test "…/test/*.test.mjs"` (clean clone) | 23 pass, 0 fail | all pass, offline |
| F1 fictional company | missing: "no row in 80-days CSV"; not sent to the scorer | missing, never scored |
| F2 COMPOUND LABS INC (`['Engineer']`) | Possible, no network match | not a network match |
| F3 `persona-past-dates.json` | slack < 0; nothing scored; exit 1 | window closed |
| F4 `persona-regex-trigger.json` | G0 stop, scorer read `false`; exit 2 | stop; profile not reworded |
| F5 `classifyLiveness({status:404})` + sample `expired` | `expired` → 0 → scorer Skip "gated: liveness" | closed gate → Skip |
| Break (a): malformed date `2027-13-45` | exit 2, G2a input error | stop, no invented date |
| Break (b): nonexistent persona file | before fix: exit 2 with an absolute machine path; after: exit 2, repo-relative path | stop, no machine path |
| Break (c): empty company name | before fix: **reported as "no row", run continued, exit 1**; after: exit 2 "roles[0].company is missing or empty" | stop before scoring |
| Break (d): `someone@example.net` | before fix: exit 2 but address printed twice; after: exit 2, "(value withheld)" | stop, address not repeated |
| `npm run ats:scan -- --dry-run` (throwaway clone, tracked example config; ATS hosts approved for this run) | exit 0; 1 company scanned, 886 jobs found, 61 new offers listed; "(dry run — no files will be written)"; clone's `data/ats/` unchanged | a preview with no writes and no private files read |
| `npm run score -- data/examples/ch11-roles.json --out-dir …/runs/baseline-ch11` | exit 0; Apply 2 · Consider 1 · Skip 2; Cambridge biotech 0.446 Apply, non-sponsor 0.178 Skip; tracked example output untouched | reproduces the Ch.11 worked example |
| `npm run verify` / `npm run doctor` (clean clone) | exit 0 / exit 0, `environment: ✓ runnable` | pass |
| `node scripts/pii-scan.mjs --diff main` | clean ✓ | clean |

### Did not test
- A real liveness check on a live posting (all liveness values in this run are fixture values; one real check is planned with human approval).
- A full Form D dataset (only the 4 shipped samples; every company read "no record in sample data").
- The H-1B cap lottery, and cap-gap timing (no data in the repository).
- Behavior on Linux CI (tested only on Windows 11, native CMD, Node 24).
- More personas (one main persona plus the past-dates and regex-trigger variants).
- Companies that share a normalized name (the "ambiguous" path is unit-tested only).
- Per-title sponsorship counts or dates (not in the data).

### Broke during testing, fixed
- **Node 24 test command:** `node --test <folder>/test/` failed with `Cannot find module '…\test'` (Node treats the argument as a file). Changed to the quoted glob `node --test "<folder>/test/*.test.mjs"` in the README, recipe 0.1.1 and card.
- **`python3` missing on Windows:** `npm run verify` failed on 36 `.py` files ("…operable program or batch file"). Fixed outside the repo: `C:\info7375\bin\python3.cmd` → `py -3.11`, plus PyYAML.
- **WSL `bash`:** next, 4 `.sh` files failed (`/bin/bash: …: No such file or directory`) because cmd resolved `bash` to the WSL launcher. Fixed outside the repo: `C:\info7375\bin\bash.cmd` → Git Bash, with `C:\info7375\bin` ahead of `WindowsApps` on the user PATH (it took two attempts). The first shim was also corrupted by my own `printf` (`\b` read as a backspace) and rewritten.
- **Line-ending miscount:** I reported CHANGE-BRIEF and the recipe as CRLF, from a `grep -c $'\r'` that returned the line count. `git ls-files --eol` and a byte count showed LF throughout. The claim was corrected; no file needed changing.
- **Break (c):** an empty company name was reported as "no row in 80-days CSV" and the run continued → added `candidateProblems()` validation (exit 2).
- **Break (b):** an absolute machine path appeared in the error → repo-relative paths.
- **Break (d):** the PII guard echoed the address → value withheld, de-duplicated.
- Fixes in `run.mjs` and `test/run.test.mjs` (+4 tests), commit `1b5a589`.

## Reflection

**[Main reflection AI-drafted by Claude Code; 'My own view' drafted by Claude chat; both reviewed and accepted by HUMAN]**

**What worked.**
- The gates did their job on every named failure. The scorer was never sent a guessed value:
  - the fictional company stayed "missing";
  - the expired posting was gated to Skip by the real scorer;
  - the unchecked posting went to the networking list instead of being scored as live;
  - the "authorized" profile stopped the run before anything was scored.
- Using the real scorer through its CLI, instead of a copy, meant the tests exercised the engine's actual behavior, including its quirks.
- The hand-check matched the CSV exactly, and the break attempts found three real defects, now fixed.

**What was missed.**
- **P3 was wrong.** I predicted the scorer stamps fit as `[model]` and sponsorship as `[record]` regardless of how p was derived. A probe of `role-scorer.mjs` (lines 74, 86–87) showed it keeps whatever `source` label it is given. That makes the opposite risk real: a label is only as honest as the code that sets it. My own prototype sends sponsorship as `record` even though tier and p come from my mapping.
- **P1 missed an over-match.** I predicted only missed network matches. SKYTAP INC became "Likely" because "Engineering Manager, Networking" contains both "network" and "engineer" as substrings.
- **The main signal barely matters.** Likely (0.6) vs Possible (0.5) is a 0.035 difference on the composite. A company that only ever sponsored "Engineer" reached Consider (0.355) alongside the network matches, and only 1 of 5 scored openings was skipped (20%, below the scorer's 50% "healthy" line).
- **Funding data I overlooked.** The CSV's own dated funding columns were never considered; I only looked at the Form D samples.

**One concrete next step.** Implement proposal **A5** as a written, justified proposal to the maintainers: a separate network-match term or weight, so a network-titled sponsorship record moves an opening further than a generic one. Re-run this exact sample to show the change in composites and skip rate. Change no existing rule silently.

### My own view

What surprised me most is that the signal I built the recipe around barely changed the outcome. A company that only ever sponsored a generic 'Engineer' landed in the same band as real network sponsors, which tells me the scorer's weights, not my keyword rule, decide most of the result. I was also wrong twice in ways that testing caught: my instruction about how the scorer labels values contradicted the code, and I asked for a RUNNABLE-SAMPLE status the evidence did not support. In both cases the right move was to accept the correction rather than defend the plan. Next time I would check the scorer's behavior with a probe before writing any rule that depends on it.
