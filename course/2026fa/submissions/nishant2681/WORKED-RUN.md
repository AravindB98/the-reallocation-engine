Drafted by Claude Code from my saved evidence files; reviewed and signed by nishant2681 (GitHub handle). Date: 2026-10-02.

# Worked run — nishant2681-data-analytics-opt-h1b

## Executive summary

This is one complete, checked run of a job-triage recipe for an international
data-analytics graduate who needs visa sponsorship and is short on
unemployment days. Eight fictional job postings at real companies went
through it. The result was one to apply to now, four to network into first,
and three to drop.

The run's numbers were checked by hand against the source data, one score was
recomputed by hand, 45 automated tests pass, and four deliberately broken
inputs each stopped the run safely. A live posting check also showed one real
weakness: a job known to be closed came back as "uncertain" rather than
"expired".

The run is honest about its limits. Several employers are rated on thin
evidence, one big sponsor is missing from the data entirely, and the sample
skipped fewer roles than a healthy run should. The signed attestation at the
end lists what was and wasn't tested.

## Run record

- **Recipe:** `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md`
  v0.1.0 (DRAFT, 2 TODOs open).
- **Evidence run:** `runs/2026-10-02-sample-2/`. A fresh-clone re-run,
  `test-report-evidence/fresh-run/`, gave identical results
  (`TEST-REPORT.md` §3).
- **Gate sign-offs:** `logs/runs/2026fa-nishant2681-1.md`.
- **Paths:** unless a path is given in full, it is relative to
  `course/2026fa/submissions/nishant2681/`.

## 1. Inputs

| Input | Value | Label |
|---|---|---|
| Persona | Priya Nair, `search/examples/priya-nair/profile.yml`. **Fictional.** 34 of 90 unemployment days used; OPT end 2027-01-31 | your-input |
| Jobs | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json`: 8 **fictional** postings at **real** CSV company names, `example.com` URLs, typed fit / lag / liveness | your-input |
| Sponsorship data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (real, full file) | record |
| Date | `--today 2026-10-02` (fixed, for reproducibility) | your-input |

## 2. Command and real output

The command, exactly as recorded in `logs/runs/2026fa-nishant2681-1.md`:
```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --today   2026-10-02 \
  --run-id  2026-10-02-sample-2 \
  --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2
```

Terminal output. sample-2's printed output was not saved to a file, so this
is the identical fresh-clone re-run, pasted from
`test-report-evidence/04-sample-run.txt`. Its run id is `fresh-1`; its results
match sample-2 role for role (`TEST-REPORT.md` §3).
```
OK: 8 roles -> Apply 1 / Consider 4 / Skip 3
  outputs in course/2026fa/submissions/nishant2681/runs/2026-10-02-fresh-1
exit: 0
```

Per-role table, pasted from `runs/2026-10-02-sample-2/report.md` (lines 26–35):

| Role | Sponsorship | Funding | Fit | Liveness | Timeline | Composite | Decision | Next action |
|---|---|---|---|---|---|---|---|---|
| Affinity Solutions — Data Analyst (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.8 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.555 [scorer output] | **Apply** [scorer output] | Tailor an application (2-hour block) |
| Adept ID — Data Scientist (CSV: ADEPT ID INC) | Likely p=0.6 [record]; matched titles: "Research Data Scientist"; approvals 4, denials 0, rate 100.0 [record] | $2,500,000 Pre-Seed (2021-11-15) [record; context only, not scored] | 0.75 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 0.933 [your-input]; lag 4 wk, start 2026-10-30, deadline 2026-11-27 | 0.406 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Deloitte — Consultant, Data Analytics (CSV: DELOITTE CONSULTING LLP) | Possible p=0.3 [record]; matched titles: none; approvals 8,810, denials 222, rate 97.5 [record] | $40,128,485 Series C (2022-01-07) [record; context only, not scored] | 0.7 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.315 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Wayfair — Data Analyst | Unknown (no-csv-match); p omitted [record] | — (no CSV row) [record; context only, not scored] | 0.85 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.255 [scorer output] | **Consider** [scorer output] | Network, don't apply yet |
| 0xCord — Data Engineer (CSV: 0XCORD INC) | Unknown (no-h1b-record); p omitted [record] | $3,500,000 Pre-Seed (2022-04-07) [record; context only, not scored] | 0.5 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.150 [scorer output] | **Skip** [scorer output] | Drop — composite 0.150 < 0.2 — time is better spent elsewhere |
| Affinity Solutions — Data Scientist (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.8 [your-input] | expired → 0.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.000 [scorer output] | **Skip** [scorer output] | Drop — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) |
| Adept ID — Data Analyst (CSV: ADEPT ID INC) | Likely p=0.6 [record]; matched titles: "Research Data Scientist"; approvals 4, denials 0, rate 100.0 [record] | $2,500,000 Pre-Seed (2021-11-15) [record; context only, not scored] | 0.8 [your-input] | uncertain → 0.5 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.225 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Affinity Solutions — Analytics Engineer (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.9 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 0.000 [your-input]; lag 12 wk (default), start 2026-12-25, deadline 2026-11-27 | 0.000 [scorer output] | **Skip** [scorer output] | Drop — gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) |

Timeline dates, pasted from the same report (lines 39–48):

| Role | Days used / ceiling | Remaining | OPT end | Deadline | Full-credit cutoff | Lag | Expected start | Factor | Why |
|---|---|---|---|---|---|---|---|---|---|
| affinity-data-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| adeptid-data-scientist | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 4 wk | 2026-10-30 | 0.933 | starts within 30 days of the deadline |
| deloitte-consulting-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| wayfair-data-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| 0xcord-data-engineer | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| affinity-data-scientist-expired | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| adeptid-data-analyst-uncertain | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| affinity-analytics-engineer-nolag | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 12 wk (default) | 2026-12-25 | 0.000 | starts after the deadline |

Scorer arithmetic, pasted from the same report:

- `affinity-data-analyst`: (0.9·0.35 + 0.8·0.3) × 1 × 1 = 0.555 → Apply (composite 0.555 ≥ 0.3, gates healthy)
- `adeptid-data-scientist`: (0.6·0.35 + 0.75·0.3) × 1 × 0.9333333333333333 = 0.406 → Consider (above threshold (0.406) but one soft spot: sponsorship tier "Likely")
- `deloitte-consulting-analyst`: (0.3·0.35 + 0.7·0.3) × 1 × 1 = 0.315 → Consider (above threshold (0.315) but one soft spot: sponsorship tier "Possible")
- `wayfair-data-analyst`: (0.85·0.3) × 1 × 1 = 0.255 → Consider (composite 0.255 in the Consider band [0.2, 0.3))
- `0xcord-data-engineer`: (0.5·0.3) × 1 × 1 = 0.150 → Skip (composite 0.150 < 0.2 — time is better spent elsewhere)
- `affinity-data-scientist-expired`: (0.9·0.35 + 0.8·0.3) × 0 × 1 = 0.000 → Skip (gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes))
- `adeptid-data-analyst-uncertain`: (0.6·0.35 + 0.8·0.3) × 0.5 × 1 = 0.225 → Consider (composite 0.225 in the Consider band [0.2, 0.3))
- `affinity-analytics-engineer-nolag`: (0.9·0.35 + 0.9·0.3) × 1 × 0 = 0.000 → Skip (gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes))

## 3. Verified vs inferred

Every term for three roles, with its label. *record* means it comes from the
CSV. *your-input* means it was typed by the candidate or the fixture.
*scorer output* means it was computed by the existing scorer from the labeled
inputs. **The run has 0 model-judgment values**: the report counts them and
says "This run has 0 model-judgment values" (`runs/2026-10-02-sample-2/report.md:10`).

| Term | Affinity Solutions — Data Analyst | Adept ID — Data Scientist | Deloitte — Consultant, Data Analytics |
|---|---|---|---|
| CSV entity | AFFINITY SOLUTIONS INC (name match) — record | ADEPT ID INC (name match) — record | DELOITTE CONSULTING LLP (**human pick** via `csv_company_name`, gate G1) — record + your-input |
| Approvals / denials / rate | 40 / 0 / 100.0 — record | 4 / 0 / 100.0 — record | 8,810 / 222 / 97.5 — record |
| Matched titles | "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST" — record | "Research Data Scientist" — record | none — record |
| Tier → p | Proven → 0.9 — record (tier rule applied to record values) | Likely → 0.6 — record | Possible → 0.3 — record |
| Funding | $20,031,615 Series B (2019-05-07) — record, **context only, not scored** | $2,500,000 Pre-Seed (2021-11-15) — record, context only | $40,128,485 Series C (2022-01-07) — record, context only (likely a bad join; CHANGE-BRIEF §8) |
| Fit | 0.8 — your-input | 0.75 — your-input | 0.7 — your-input |
| Liveness | active → 1.0 — your-input (fixture) | active → 1.0 — your-input (fixture) | active → 1.0 — your-input (fixture) |
| Hiring lag | 3 wk — your-input | 4 wk — your-input | 3 wk — your-input |
| Timeline factor | 1.000 — your-input (computed from profile dates) | 0.933 — your-input (computed) | 1.000 — your-input (computed) |
| Weights 0.35 / 0.30 | fixed scorer configuration (`scripts/score/role-scorer.mjs:35-36`) | same | same |
| Composite | 0.555 — scorer output | 0.406 — scorer output | 0.315 — scorer output |
| Decision | **Apply** — scorer output | **Consider** (soft tier "Likely") — scorer output | **Consider** (soft tier "Possible") — scorer output |
| Next action | Tailor an application (2-hour block), derived from the decision | Network into the company first (3-hour block) | Network into the company first (3-hour block) |

## 4. Verification

### a. Hand check against the source CSV (done by Nishant)

Raw CSV values, from `worked-run-evidence/01-hand-check-csv.txt`:
```
ADEPT ID INC | approvals: 4.0 | denials: 0.0 | rate: 100.0 | titles: ['Research Data Scientist']
AFFINITY SOLUTIONS INC | approvals: 40.0 | denials: 0.0 | rate: 100.0 | titles: ['SENIOR DATA ANALYST', 'DATA SCIENTIST', 'DATA ANALYST']
DELOITTE CONSULTING LLP | approvals: 8810.0 | denials: 222.0 | rate: 97.5420726306466 | titles: ['Manager', 'Senior Consultant', 'Senior Solution Specialist', 'Consul
```

The same companies in the report, from `worked-run-evidence/02-report-rows.txt`
(lines 1–3), in the per-role table above.

| Company | CSV (`01`) | Report (`02`) | Match? |
|---|---|---|---|
| AFFINITY SOLUTIONS INC | 40.0 / 0.0 / 100.0 | 40 / 0 / 100.0 | yes |
| ADEPT ID INC | 4.0 / 0.0 / 100.0 | 4 / 0 / 100.0 | yes |
| DELOITTE CONSULTING LLP | 8810.0 / 222.0 / 97.5420726306466 | 8,810 / 222 / 97.5 | yes (the report rounds to 1 decimal) |

The tiers follow the rules:
- Affinity has a title match, 40 ≥ 10 and 100 ≥ 90 → **Proven**.
- Adept has a title match ("Research Data Scientist" contains "Data
  Scientist"), 4 ≥ 1 but < 10 → **Likely**.
- Deloitte Consulting has no target title among its top titles → **Possible**.

### b. Hand recomputation

- **Affinity composite:** 0.9 × 0.35 + 0.8 × 0.30 = 0.315 + 0.240 =
  **0.555**. The gates are both 1, so the composite is 0.555, which matches
  the scorer's `(0.9·0.35 + 0.8·0.3) × 1 × 1 = 0.555`.
- **Adept timeline:** the deadline is min(2026-10-02 + 56 days, 2027-01-31) =
  2026-11-27, and the expected start is 2026-10-02 + 4 × 7 = 2026-10-30. That
  falls inside the last 30 days before the deadline, so the factor is
  (2026-11-27 − 2026-10-30) / 30 = 28 / 30 = **0.933**, which matches the
  report's `0.933`.
- **Adept composite** (follows from the above):
  (0.6 × 0.35 + 0.75 × 0.30) × 0.933 = 0.435 × 0.933 = **0.406**, which
  matches.

### c. Automated tests

All 45 offline tests pass on a fresh clone (`test-report-evidence/03-tests.txt:47-51`):
```
----------------------------------------------------------------------
Ran 45 tests in 1.140s

OK
exit: 0
```

### d. Deliberate break attempts

Each was meant to fail, and the question is whether it failed safely.

Ambiguous company, `"Deloitte"` with no entity chosen
(`test-report-evidence/05-fail-ambiguous.txt`):
```
STOP: 1 problem(s); nothing was written.
  [deloitte-ambiguous] "Deloitte" matches 7 CSV rows:
  - DELOITTE & TOUCHE LLP
  - DELOITTE CONSULTING LLP
  - DELOITTE FINANCIAL ADVISORY SERVICES LLP
  - DELOITTE LLP
  - DELOITTE TAX LLP
  - DELOITTE TOUCHE TOHMATSU SERVICES INC
  - DELOITTE TOUCHE TOHMATSU SERVICES LLC
Set csv_company_name to the exact name of the one you mean.
exit: 2
```

Liveness label `"live"` (`test-report-evidence/06-fail-bad-liveness.txt`):
```
STOP: 1 problem(s); nothing was written.
  [affinity-bad-liveness] liveness label 'live' is not one of ['active', 'expired', 'uncertain']
exit: 2
```

Missing jobs file (`test-report-evidence/07-fail-missing-file.txt`):
```
STOP: 1 problem(s); nothing was written.
  [inputs] [Errno 2] No such file or directory: 'does/not/exist.json'
exit: 2
```

Out-dir already exists (`test-report-evidence/08-fail-existing-outdir.txt`):
```
STOP: course/2026fa/submissions/nishant2681/runs/2026-10-02-fresh-1 already exists; refusing to overwrite.
exit: 2
```

**Live liveness checks** with the engine's real checker (`engine-runs/`).

Test 1, a live TouchCare Greenhouse posting
(`engine-runs/liveness-check-1-retry.txt`):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/touchcare/jobs/4393220009

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/touchcare/jobs/4393220009

Results: 1 active  0 expired  0 uncertain
```

Test 2 was the **break attempt**: a posting known to be closed, on a VC job
board. The expected result was `expired`; it came back `uncertain`
(`engine-runs/liveness-check-2-closed.txt`):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://talent.swayvc.com/companies/affinity/jobs/86140979-data-analyst

Checking 1 URL(s)...

⚠️ uncertain  https://talent.swayvc.com/companies/affinity/jobs/86140979-data-analyst
           navigation error: page.goto: Download is starting

Results: 0 active  0 expired  1 uncertain
```

Test 3, a non-existent Greenhouse job ID (`engine-runs/liveness-check-3-removed.txt`):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/touchcare/jobs/1000000001

Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/touchcare/jobs/1000000001
           redirect to https://job-boards.greenhouse.io/touchcare?error=true

Results: 0 active  1 expired  0 uncertain
```

Test 2 is the important one. The checker could not read the page at all
(`navigation error`), and it reports that as "uncertain", not as closed. In
this recipe, an uncertain posting still scores 0.5. So a dead job can stay in
the Consider band unless a person opens it (gate G3).

## 5. Reflection

*Drafted by Claude Code, reviewed by Nishant.*

**What worked:**
- **The gates stop bad inputs before anything is written.** An ambiguous
  name, a bad label, a missing file or an existing folder each exit 2
  (§4d).
- **Every sponsorship number traces to a CSV row** (§4a), and the composite
  can be recomputed by hand (§4b).
- **The engine's real liveness checker works on Greenhouse:** an open posting
  came back `active`, and a removed ID came back `expired`.

**What the recipe or prototype got wrong or missed:**
- **Deloitte Consulting would be Proven by its numbers** (8,810 approvals,
  97.5%), but its top sponsored titles are generic ("Manager", "Senior
  Consultant"), so title matching demotes it to **Possible**
  (`worked-run-evidence/01-hand-check-csv.txt:3`).
- **Tiers are per company, not per job.** Adept ID's Data **Analyst** posting
  is rated Likely because the company sponsored a "Research Data
  **Scientist**" (the per-role table above, Adept ID — Data Analyst row).
- **The dataset misses public sponsors.** It is built from SEC Form D filers
  (`data/80-days-to-stay/README.md:13,170`), so Wayfair (a heavy sponsor, per
  Nishant's outside check) can only ever be Unknown (CHANGE-BRIEF §8).
- **"Uncertain" liveness scored 0.5 for a known-closed job** (§4d, test 2).
- **The skip rate is 38%**, below the healthy 50% (`DOMAIN.md:8`). The
  fixtures were not tuned to hide this (`logs/runs/2026fa-nishant2681-1.md`).

**Corrections made during the work:**
- **The approval-rate scale.** `Approval_Rate` is 0–100, not 0–1, so the
  Proven cutoff became ≥ 90, not ≥ 0.90 (CHANGE-BRIEF §3 unit note;
  `FRICTIONAL.md:72`).
- **The timeline rule** was wrong at first ("OPT start + 90 days"). The 90
  unemployment days are cumulative, so the deadline is today + remaining days
  (CHANGE-BRIEF §3 note; `FRICTIONAL.md:73`). It now also reads the ceiling
  from the profile (CHANGE-BRIEF §8).
- **The sample-1 provenance bug.** Its scorer command cited deleted `.partial`
  staging paths, so it was re-run as sample-2, with both kept
  (CHANGE-BRIEF §8; `FRICTIONAL.md:105`).

**One concrete next improvement.** Map "uncertain" liveness to **0** until a
person confirms the posting is open. That is a one-line change in
`LIVENESS_FACTORS` in `gates.py`, plus a test. Then add the **USCIS H-1B
Employer Data Hub** as a second sponsorship source for companies missing from
the CSV (recipe addition 13).

## Attestation
- Recipe: nishant2681-data-analytics-opt-h1b v0.1.0
- By: nishant2681 (GitHub handle) · 2026-10-02

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` on a fresh clone (`core.autocrlf=false`) | `✓ all conform`, `✓ manifest check passed (3 warnings)`, `exit: 0` (`test-report-evidence/02-verify.txt`) | Pass; the 3 known warnings (W2 false positive, `00-terminal-history.txt:75-77`) |
| 45 offline unit and end-to-end tests | `Ran 45 tests` · `OK` · `exit: 0` (`test-report-evidence/03-tests.txt`) | All pass |
| Sample run on the real CSV, `--today 2026-10-02` | `OK: 8 roles -> Apply 1 / Consider 4 / Skip 3`, `exit: 0` (`test-report-evidence/04-sample-run.txt`); identical to sample-2 | Exit 0; same results as sample-2 |
| Hand check of 3 companies against the raw CSV | Approvals, denials and rate match; the report rounds 97.542… to 97.5 (`worked-run-evidence/01`, `02`) | Exact match; tiers per the rules |
| Break attempt: `"Deloitte"` with no `csv_company_name` | `STOP` listing 7 entities, `exit: 2`, nothing written (`05`) | Stop, list all candidates, write nothing |
| Break attempt: liveness label `"live"` | `STOP … 'live' is not one of [...]`, `exit: 2` (`06`) | Stop |
| Break attempt: missing jobs file | `STOP … No such file or directory: 'does/not/exist.json'`, `exit: 2` (`07`) | Stop, name the path |
| Break attempt: out-dir already exists | `STOP … already exists; refusing to overwrite.`, `exit: 2` (`08`) | Refuse; earlier output untouched |
| Live `ats:liveness` on an open TouchCare Greenhouse posting | `✅ active` (`engine-runs/liveness-check-1-retry.txt`) | active |
| Break attempt: live `ats:liveness` on a known-closed posting | `⚠️ uncertain … navigation error: page.goto: Download is starting` (`engine-runs/liveness-check-2-closed.txt`) | **expired**. Not met: the checker can't read the page, and the recipe scores that 0.5 |
| Live `ats:liveness` on a non-existent Greenhouse job ID | `❌ expired … redirect to …?error=true` (`engine-runs/liveness-check-3-removed.txt`) | expired |
| CI-mode PII scan, `pii-scan --diff origin/main` | `pii-scan: clean ✓`, `exit: 0` (`test-report-evidence/11-pii-scan-diff.txt`). This was run before the report files were committed; the post-commit re-run was also clean per `FRICTIONAL.md:137`, but that output was not saved | Clean |

### Did not test
- Linux or macOS. Every run was on Windows with Git Bash.
- Live liveness wired into the prototype. The prototype reads typed labels;
  the live checks above were run separately.
- `ats:scan`. It fails without `portals.yml`
  (`engine-runs/ats-scan-dry-run.txt`).
- Real job postings. All sample postings are fictional on `example.com`.
- The funding fold into the sponsorship score. It is not built (recipe
  addition 7).
- A second sponsorship source for employers missing from the CSV. It is not
  built (addition 13).
- Whether Priya is currently employed. The timeline assumes the persona's unemployment
  clock runs from today.
- `buffer_target` (20 in the profile) versus the fixed 30-day full-credit
  margin.

### Broke during testing, fixed
- **cmd had no `bash`, so `.sh` conformance failed**
  (`baseline-verify.txt:7-11`). Moved to Git Bash (`FRICTIONAL.md:13,19`).
- **6 CRLF "out of sync" E3 errors** (`00-terminal-history.txt:24-32`). Fixed
  with `git config core.autocrlf false`, without running `--promote`
  (`00:43-50`; `FRICTIONAL.md:22-26`).
- **The approval-rate threshold** was proposed as 0.90 on a 0–100 column.
  Corrected to 90 before the first commit (`FRICTIONAL.md:72`).
- **The timeline rule** "OPT start + 90" ignored that unemployment days are
  cumulative. Corrected before the first commit (`FRICTIONAL.md:73`).
- **sample-1's provenance** pointed at deleted staging paths. Fixed in code
  and re-run as sample-2 (`FRICTIONAL.md:105`).
- **A suggested `cut -d,` command misread the CSV,** because of commas inside
  quoted fields. Re-checked with Python's CSV parser, and the prototype uses
  `csv.DictReader` (`FRICTIONAL.md:81`; `00-terminal-history.txt:185-195`).
- **The Playwright browser was missing,** so the first liveness check failed
  (`engine-runs/liveness-check-1.txt`). Installed with
  `npx playwright install chromium` (`FRICTIONAL.md:109`).
- **The npm author email was in evidence files.** It was redacted in every
  submission file before commit, so the CI diff scan stays clean
  (`FRICTIONAL.md:137`; `TEST-REPORT.md` §6).

`00-terminal-history.txt` was assembled by Claude chat from Nishant's pasted
terminal output after the terminal was closed, with redactions, and reviewed by
Nishant (`FRICTIONAL.md:136`).
