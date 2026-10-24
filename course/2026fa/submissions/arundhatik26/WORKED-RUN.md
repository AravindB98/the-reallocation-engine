# Worked run — co-op sponsor check, sample persona, 2026-10-02

## Executive summary

This is a record of running the co-op sponsor check once, end to end, on a made-up student, using the real data that ships with the repository. It shows the exact commands and their real output. It splits every value into what came from a record and what was typed in or assumed, and it shows the attempts made to break the tool.

**Result:** of seven roles, one was worth tailoring an application for. Two were strong sponsors with no confirmed live posting (network first), two had no sponsorship record (network to ask), one needs a human to pick the right company record, and one depends on which graduation date turns out to be real.

---

## Inputs

- **Persona (fictional):** Ananya Rao, `ananya.rao@example.com`, MS Information Systems, January 2026 intake, F-1, STEM-designated degree (stated, not checked). File: `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/sample-persona.json`
- **Graduation scenarios** (your-input): `grad-dec-2027` (2027-12-15) and `grad-apr-2028` (2028-04-30), each with 12 months OPT + 24 months STEM OPT (assumed)
- **Seven roles** (your-input):

| Role | Company | Why it is in the sample |
|---|---|---|
| bny-fullstack-coop | BNY Mellon | the student's main target; full-stack titles in the record |
| databricks-swe-intern-winter | Databricks | a **real** live posting, checked with `ats:liveness` |
| databricks-fake-posting | Databricks | **break attempt**: a fabricated Greenhouse job id |
| jpmc-swe-coop | JPMorgan Chase | failure case F1: not in the dataset |
| visa-swe-coop | Visa | failure case F2: row exists, sponsorship blank |
| sofi-swe-coop | SoFi | failure case F3: two legal names |
| stripe-late-coop | Stripe | failure case F5: a co-op that starts after one of the graduation dates |

- **Data:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`), `data/bls/compact/soc_occupation_compact.csv`, and the saved liveness output below. **Sample data, not live.**

## Commands and real output

### 1. Liveness check on the two posting URLs

```text
$ npm run ats:liveness -- "https://databricks.com/company/careers/open-positions/job?gh_jid=8732364002" "https://job-boards.greenhouse.io/databricks/jobs/9999999999"
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://databricks.com/company/careers/open-positions/job?gh_jid=8732364002 https://job-boards.greenhouse.io/databricks/jobs/9999999999

Checking 2 URL(s)...

✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8732364002
⚠️ uncertain  https://job-boards.greenhouse.io/databricks/jobs/9999999999
           content present but no visible apply control found

Results: 1 active  0 expired  1 uncertain
```

The first attempt at this failed (Playwright's browser was not installed). After `npx playwright install chromium` it ran as shown. That output is saved as `inputs/liveness-2026-10-02.txt` and the prototype reads it as a record.

### 2. The prototype

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
[grad-dec-2027] ✓ scored 7 roles → Apply 1 · Consider 2 · Skip 4 (skip 57%)
[grad-apr-2028] ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
  bny-fullstack-coop           matched                liveness=unchecked  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  databricks-swe-intern-winter matched                liveness=active     → TAILOR APPLICATION
  databricks-fake-posting      matched                liveness=uncertain  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  jpmc-swe-coop                not-in-dataset         liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  visa-swe-coop                no-sponsorship-record  liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  sofi-swe-coop                ambiguous              liveness=manual-active → HUMAN CHECK (G2): pick the right CSV row before trusting anything below
  stripe-late-coop             matched                liveness=manual-active → DEPENDS ON GRADUATION DATE: Skip if grad-dec-2027, Apply if grad-apr-2028 — settle your co-op/graduation plan before tailoring
✓ wrote course/2026fa/submissions/arundhatik26/runs/sample/run-log.json + report.md
exit 0
```

### 3. The offline tests (run in a fresh clone of the branch, with only my files copied in)

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v
test_F1_not_in_dataset_is_unknown_not_zero (test_coop_sponsor_check.FullRun) ... ok
test_F2_blank_approvals_is_no_record (test_coop_sponsor_check.FullRun) ... ok
test_F3_two_rows_same_name_is_ambiguous (test_coop_sponsor_check.FullRun) ... ok
test_F4_tiers (test_coop_sponsor_check.FullRun) ... ok
test_F5_coop_after_graduation_closes_timeline (test_coop_sponsor_check.FullRun) ... ok
test_F6_liveness_dead_uncertain_unchecked_all_close (test_coop_sponsor_check.FullRun) ... ok
test_both_outputs_written (test_coop_sponsor_check.FullRun) ... ok
test_every_scorer_term_is_labeled (test_coop_sponsor_check.FullRun) ... ok
test_inputs_are_hashed (test_coop_sponsor_check.FullRun) ... ok
test_proven_live_role_applies (test_coop_sponsor_check.FullRun) ... ok
test_substring_does_not_match (test_coop_sponsor_check.FullRun) ... ok
test_unknown_soc_has_no_wage (test_coop_sponsor_check.FullRun) ... ok
test_bad_date_stops (test_coop_sponsor_check.Units) ... ok
test_bad_fit_stops (test_coop_sponsor_check.Units) ... ok
test_graduation_already_past (test_coop_sponsor_check.Units) ... ok
test_missing_csv_stops (test_coop_sponsor_check.Units) ... ok
test_norm_name (test_coop_sponsor_check.Units) ... ok

----------------------------------------------------------------------
Ran 17 tests in 0.091s

OK
exit 0
```

## Verified vs. inferred, line by line

| Role | Value | Label | Source |
|---|---|---|---|
| BNY Mellon | matched `BANK OF NEW YORK MELLON CORP`, CSV line 3036 | record | 80 Days CSV |
| BNY Mellon | 704 approvals, 99.15% approval rate, 5 of 5 top titles are software (Full-Stack / Back-End Developer, Application Development) | record | 80 Days CSV |
| BNY Mellon | funding date blank | record | 80 Days CSV (public bank, no Form D) |
| BNY Mellon | tier **Proven**, p = 0.9 | your-input | my rule: software title AND ≥ 100 approvals (raised from 50 on 2026-10-03) |
| BNY Mellon | liveness **unchecked → 0.0** | your-input | fail-closed rule; Workday board not checked |
| BNY Mellon | that this row *is* the employer | **not verified** | gate G2, waiting on a human |
| Databricks intern | 1,640 approvals; 2 software titles | record | 80 Days CSV |
| Databricks intern | liveness **active → 1.0** | record | `ats:liveness`, 2026-10-02 |
| Databricks intern | composite 0.525, **Apply** in both scenarios | computed | existing scorer: (0.9·0.35 + 0.7·0.3) × 1 × 1 |
| Databricks fake id | liveness **uncertain → 0.0** | record | `ats:liveness`: "no visible apply control found" |
| JPMorgan Chase | **not-in-dataset** (searched 3 names) | record (an absence) | 80 Days CSV |
| JPMorgan Chase | sponsorship sent with **no p** (tier Unknown) | — | not invented as 0 |
| JPMorgan Chase | liveness active | your-input | **fictional**; not actually checked |
| Visa | `VISA INC` row exists, approvals blank → **no-sponsorship-record** | record | 80 Days CSV |
| SoFi | 2 rows: `SOFI TECHNOLOGIES INC` (blank) and `SOCIAL FINANCE INC` (182) → **ambiguous** | record | 80 Days CSV |
| Stripe | 1,250 approvals, Proven | record + your-input rule | 80 Days CSV |
| Stripe | timeline **closed** under Dec 2027 (co-op ends 2028-04-15, after graduation), **open** under Apr 2028 | your-input | co-op dates and graduation dates typed in |
| All | fit 0.65–0.8 | your-input | self-rated; **no model was called** |
| All | SOC 15-1252 national median $133,080 (OEWS 2024) | record | BLS compact CSV, context only (weight 0) |
| All | OPT/STEM end dates and March lottery count | your-input | assumed rules, not checked |

## Verification

### Cross-checked a value against the source CSV by hand

```text
run-log says: line 3036 approvals 704.0 rate 99.15492957746478
$ grep -n '^BANK OF NEW YORK MELLON' data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv | cut -d: -f1
3036
CSV line 3036: BANK OF NEW YORK MELLON CORP | Total Approvals = 704.0 | Approval_Rate = 99.15492957746478
BLS 15-1252.00 annual_median_wage = 133080.0
```

The run-log's line number, approvals and rate match the raw CSV. The CSV has 30,370 physical lines for 30,369 records plus a header, so no quoted field spans lines, and "line" means the same thing in both.

### Deliberate attempts to break it

**Break 1: an out-of-range fit (1.7).**

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py --input <break-fit.json> --out-dir <scratch>
✗ stopped: role bny-fullstack-coop: fit must be a number in [0, 1]
exit 2
```

**Break 2: a non-ISO graduation date ("December 2027").**

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py --input <break-date.json> --out-dir <scratch>
✗ stopped: scenario grad-dec-2027.graduation: 'December 2027' is not an ISO date (YYYY-MM-DD)
exit 2
```

**Break 3: the sponsor CSV path points to a file that doesn't exist.**

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py --input <break-csv.json> --out-dir <scratch>
✗ stopped: sponsor CSV missing: <repo>/data/80-days-to-stay/80-days-csv/missing.csv
exit 2
```

**Break 4: match BNY on the loose name "MELLON".** The CSV contains both `BANK OF NEW YORK MELLON CORP` and `TAMARA MELLON BRAND INC`.

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py --input <break-mellon.json> --out-dir <scratch>
[grad-dec-2027] ✓ scored 7 roles → Apply 1 · Consider 2 · Skip 4 (skip 57%)
[grad-apr-2028] ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
  bny-fullstack-coop           not-in-dataset         liveness=unchecked  → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  databricks-swe-intern-winter matched                liveness=active     → TAILOR APPLICATION
  databricks-fake-posting      matched                liveness=uncertain  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  jpmc-swe-coop                not-in-dataset         liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  visa-swe-coop                no-sponsorship-record  liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  sofi-swe-coop                ambiguous              liveness=manual-active → HUMAN CHECK (G2): pick the right CSV row before trusting anything below
  stripe-late-coop             matched                liveness=manual-active → DEPENDS ON GRADUATION DATE: Skip if grad-dec-2027, Apply if grad-apr-2028 — settle your co-op/graduation plan before tailoring
✓ wrote <scratch>/out-mellon/run-log.json + report.md
exit 0
```

It matched neither company. It returned `not-in-dataset` → NETWORK, and did not attach a shoe brand's (empty) record or BNY's record to the role.

**Break 5: a fabricated job id.** See the liveness output above: `uncertain`, so the gate closes and the role becomes Skip (gated) in both scenarios.

## Observations from the run

*These are factual observations drafted with Claude. The reflection is in the student's own words, below.*

- **Unknown sponsorship lands in "Consider" inside the scorer.** JPMorgan (no data) scored 0.225 and Visa (no data) 0.21, both Consider. Meanwhile SoFi (ambiguous, also no `p`, lower fit) scored 0.195, Skip. The scorer drops a missing vote rather than treating it as weak, so "unknown" can outrank "known-weak." The recipe's next-action layer routes both to NETWORK, but the scorer on its own would not.
- **The scorer quietly treats a missing liveness as 1.0** (`num(role.liveness?.factor) ?? 1`). The prototype never leaves liveness out; an unchecked posting is sent as 0.0.
- **The liveness checker says `uncertain`, not `expired`, for a fake Greenhouse id.** The recipe treats uncertain as closed.
- **The Apr 2028 scenario skipped only 43%**, below the "healthy run skips at least half" rule. With 7 hand-picked roles, 3 of them designed as failure cases, that is a sign the sample is small and hand-chosen, not that the inputs are good.
- **Raising the Proven threshold from 50 to 100** (my decision, 2026-10-03) changed no result: the re-run output was identical, because every matched company has 704+ approvals. The threshold only matters for smaller sponsors.
- **The main target, BNY Mellon, could not be liveness-checked** through a supported provider (Workday).

## Reflection

*(I chose these answers from options Claude offered on 2026-10-03; Claude wrote down my choices.)*

- **What worked:** the next action for each role (tailor, network, check, or skip) was the most useful part of the report.
- **What it missed:** the big banks I target (JPMorgan Chase, Goldman Sachs, Morgan Stanley) are not in the data at all, so the tool cannot help me with them.
- **Next improvement:** add sponsorship data for big public employers (DOL / H-1B records), so those banks are not left as "unknown".
- **What surprised me:** a fake job link came back "uncertain", not "expired".
- **Predictions:** I did not make predictions before the prototype was built, so there is nothing to compare against (see CHANGE-BRIEF §5–6).

## Attestation

- Recipe: coop-sponsor-swe-15-1252 v0.1.0
- By: Arundhati Kandelkar · 2026-10-03

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py` | exit 0; dec-2027 Apply 1 · Consider 2 · Skip 4; apr-2028 Apply 2 · Consider 2 · Skip 3; both outputs written | both outputs written; every value labeled |
| `python3 -m unittest discover -s …/tests -v` (in a fresh clone) | 17 tests, OK | all pass, no network |
| Hand cross-check: run-log BNY line 3036 against the raw CSV | 704.0 / 99.15492957746478 in both | identical |
| **Break:** fit = 1.7 | `✗ stopped: role bny-fullstack-coop: fit must be a number in [0, 1]`, exit 2 | stop, nothing invented |
| **Break:** graduation "December 2027" | `✗ stopped: … is not an ISO date`, exit 2 | stop |
| **Break:** sponsor CSV missing | `✗ stopped: sponsor CSV missing: …`, exit 2 | stop |
| **Break:** match on "MELLON" | `not-in-dataset` → NETWORK | no false match to TAMARA MELLON BRAND INC |
| **Break:** fabricated Greenhouse job id | liveness `uncertain` → 0.0 → Skip (gated) | gate closes |
| JPMorgan / Visa | not-in-dataset / no-sponsorship-record; no `p` sent to the scorer | unknown, never 0 |

### Did not test

- A **live** run: real postings for BNY Mellon, JPMorgan, Visa, SoFi or Stripe were not checked. Their liveness values are fictional `your-input`.
- Liveness on a **Workday** URL, or on Lever, Ashby or SmartRecruiters URLs.
- Whether the OPT / STEM OPT / H-1B rules assumed in the timeline are current.
- Whether any "Proven" company actually converts co-ops to sponsored full-time roles.
- The tier rule (100 approvals; 0.9 / 0.6 / 0.3) against any outcome data. 100 is my choice, 0.9 / 0.6 come from the Chapter 11 example, and 0.3 is a guess.
- Python versions other than 3.9 (system Python on macOS); Node 25 locally, while CI uses Node 20.
- That the subprocess scorer makes no network calls. The test blocks Python sockets only; the scorer was read and contains no network code.

### Broke during testing, fixed

- `npm run ats:scan -- --dry-run` failed: `portals.yml not found`. Fixed by running with `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml` (no private file created).
- `npm run ats:liveness` failed: Playwright browser missing. Fixed with `npx playwright install chromium`.
- Stripe's next action first read `TAILOR APPLICATION` even though it was Skip under one scenario. Fixed in `coop_sponsor_check.py` `next_action()`: disagreeing scenarios now return `DEPENDS ON GRADUATION DATE`.
- The fresh-clone check first failed because my script tried to create a branch that the clone had already checked out. Removed that step; then it passed.
