# Worked run — cap-exempt employer triage (2026-10-21)

## Executive summary

**What this is.** The record of the real runs of the cap-exempt triage mode on 2026-10-21. The person is a fictional graduate on OPT who lost the H-1B lottery. The inputs are seven job-posting rows (six real postings, five of them checked live on the web and one deliberately left unchecked, plus one made-up dead link), the repository's own company and wage data, and two government datasets downloaded the same day: the federal college list (IPEDS) and USCIS H-1B approval counts.

**Why read it.** Every number in the mode's report traces to a command below whose output is pasted, not described. The page also records what broke and what the mode still cannot do.

**What it found.**
- The engine's startup-funding dataset **cannot see universities**: 0 of the 3,771 open public and nonprofit institutions in the federal college list appear in it by exact name. None of its 31 university-sounding names is a real institution, and their visa-approval fields are blank (unknown).
- The government's data does: Northeastern had 24 initial and 13 continuing H-1B approvals in FY2023, Fred Hutch 20 and 24, HHMI 49 and 18 (through a link the author confirmed), Ai2 6 and 0.
- Of seven rows: one shortlisted (Ai2); two flagged (Toyota Research Institute, a company; HHMI, whose pages say "private", not "nonprofit"); three held; one skipped.
- **One employer is backed by a federal record** (Northeastern, in IPEDS as private nonprofit). **None is confirmed cap-exempt**, by design.
- The repository's posting checker **called a live Fred Hutch posting "expired"**. The mode now holds that case.
- **The human gate (G4) is cleared** by the author's recorded decisions: 2 keep held, 4 drop, 0 contacted.
- Eighteen problems surfaced during testing and an independent review, and were fixed. Five of them were places where the written rule and the running code disagreed. Three of the six proposed additions are now closed. One known blind spot remains.

## Inputs

| Input | What | Provenance |
|---|---|---|
| Persona | `search/examples/priya-nair/profile.yml`: Priya Nair, **fictional**, F-1 OPT year 1, OPT ends 2027-01-31, 34/90 unemployment days used, buffer 20, STEM-eligible | your-input (fictional; not the author) |
| Extension | `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json`: FY2027 registration **not selected**; employed on OPT; employer not in E-Verify; hiring lag **45 days (a labelled guess)**, processing 21 days | your-input (fictional, invented) |
| Targets | `runs/2026-10-21/targets.json`: 6 real public postings: T1–T5 checked live, and T7 deliberately left out of the liveness check (with `legal_name` and `state` sourced from each employer's own pages), plus T6, a constructed dead URL | public employer pages |
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, sha256 `eccdee2addf4…` | record |
| BLS compact | `data/bls/compact/soc_occupation_compact.csv` (OEWS May 2024 national) | record |
| IPEDS HD2024 extract | `scripts/contrib/…/data/extracts/ipeds_hd2024.csv` (raw sha256 `d98425c123d7…`) | record, ingested 2026-10-21 |
| USCIS FY2023 extract | `scripts/contrib/…/data/extracts/uscis_h1b_hub_fy2023.csv` (sha256 `96f423093932…`) | record, ingested 2026-10-21 |

No real personal data is used anywhere. The persona and all visa dates are fictional; the postings are public job ads.

## Commands and real output

All commands were run from the repository root on 2026-10-21. `<run-dir>` = `course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/`.

### 0. Ingest the two federal datasets (network; `ingest-stdout.txt`)

The first attempt halted at the upstream-change guard and wrote nothing:

```
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/ingest.py all
IPEDS columns changed upstream; missing ['UNITID']. Nothing written.
```

The cause was a byte-order mark decoded as latin-1. After fixing the decoding:

```
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/ingest.py all --date 2026-10-21
ipeds: {'rows': 6072, 'sha': 'd98425c123d7c0e872aec6e83960dfb501884818bf17385c340790f3d1f28345', 'control': {'1': 1980, '2': 1813, '3': 2257, 'other': 22}}
uscis: {'rows': 33332, 'sha': '96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931', 'naics61': 2042}
provenance: data/PROVENANCE.md
exit: 0
```

Audits: `scripts/contrib/…/data/extracts/ipeds-audit.md`, `uscis-audit.md`. Provenance: `…/data/PROVENANCE.md`.

### 1. Liveness gate: first pass (network, the repository's own checker)

`urls.txt` lists T1–T6. T7 is left out on purpose.

```
$ npm run ats:liveness -- --file <run-dir>/urls.txt 2>&1 | tee <run-dir>/liveness.txt

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/urls.txt

Checking 6 URL(s)...

⚠️ uncertain  https://northeastern.wd1.myworkdayjobs.com/careers/job/Boston-MA-Main-Campus/Associate-AI-Engineer_R141445
           content present but no visible apply control found
❌ expired    https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
           insufficient content — likely nav/footer only
✅ active     https://job-boards.greenhouse.io/thealleninstitute/jobs/7980660
⚠️ uncertain  https://jobs.lever.co/tri/fcfe4b57-d1a0-47f6-b14f-98a4d30313eb
           navigation error: page.goto: Timeout 15000ms exceeded.
✅ active     https://hhmi.wd1.myworkdayjobs.com/External/job/Janelia-Research-Campus/AI-Engineer---AI-CryoET_R-4313
❌ expired    https://job-boards.greenhouse.io/thealleninstitute/jobs/1
           redirect to https://job-boards.greenhouse.io/thealleninstitute?error=true

Results: 2 active  2 expired  2 uncertain
npm notice
npm notice New major version of npm available! 11.19.1 -> 12.2.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.2.1
npm notice To update run: npm install -g npm@12.2.1
npm notice
```

### 2. Liveness gate: re-check of two non-active results (TRI's timeout, Fred Hutch's page-length "expired")

Typed the same way, with `| grep -v "npm notice"` added before `tee`. It includes Fred Hutch's in-frame URL.

```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/urls-recheck.txt

Checking 3 URL(s)...

✅ active     https://jobs.lever.co/tri/fcfe4b57-d1a0-47f6-b14f-98a4d30313eb
❌ expired    https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
           insufficient content — likely nav/footer only
❌ expired    https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1
           insufficient content — likely nav/footer only

Results: 1 active  2 expired  0 uncertain
```

### 3. Manual check of the Fred Hutch "expired" result

This is outside the mode, so it is logged as a manual verification. It ran in a scratch directory.

```
$ curl -sL -A "Mozilla/5.0" -o fh.html -w "HTTP %{http_code} · %{size_download} bytes · final %{url_effective}\n" "https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1"
HTTP 200 · 49436 bytes · final https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1
$ python3 -I -c "<strip scripts/tags, count patterns in visible text>"
visible text chars: 7275
'Software Development Engineer II': 3
'Apply for this job': 1
'Apply': 4
'\\$101,983': 1
'no longer': 0
'closed': 0
'expired': 0
```

The posting is open, so the checker's "expired" is a false negative. Its rule (`scripts/ats/liveness-core.mjs:73`) calls a page expired when top-level `document.body.innerText` is under 300 characters, and iCIMS puts the job in a frame. Why the in-frame URL also failed in the headless browser was **not isolated**.

### 4. Coverage audit + triage with federal records (`stdout.txt`)

```
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py audit --out course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/audit.md --json
{
  "source": "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv",
  "source_sha256": "eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270",
  "rows_total": 30369,
  "rows_with_approvals_gt0": 1552,
  "rows_with_approvals_blank": 28812,
  "distinct_industries": 24,
  "education_like_industries": [],
  "cap_exempt_sounding_names": 31,
  "sounding_with_approvals_gt0": 0,
  "sounding_with_approvals_blank": 31,
  "sounding_with_for_profit_form": 13,
  "sounding_with_corporate_ambiguous": 11,
  "sounding_with_funding_stage": 26,
  "ipeds_overlap": {
    "ipeds_source": "scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv",
    "open_public_nonprofit_institutions": 3771,
    "found_in_80days_exact_name": 0,
    "sounding_names_matching_any_ipeds_institution": 0
  }
}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/audit.md
exit: 0

$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness-recheck.txt --g4 course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/g4-decisions.json --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21
✓ G1 input gate: inputs parsed
✓ G2 timeline gate: 102 days of OPT left, 66 required, OPT margin 36
  T1   uncertain  UNVERIFIED-RECORD-SUPPORTED  HELD — liveness uncertain            Northeastern University
  T2   uncertain  UNVERIFIED                   HELD — liveness uncertain            Fred Hutchinson Cancer Center
  T3   active     UNVERIFIED                   SHORTLIST — exemption UNVERIFIED     Allen Institute for AI
  T4   active     CONTRADICTED-BY-SIGNAL       FLAG — claim contradicted            Toyota Research Institute
  T5   active     CONTRADICTED-BY-SIGNAL       FLAG — claim contradicted            Howard Hughes Medical Institute (Janelia Research Campus)
  T6   expired    UNVERIFIED                   SKIP — expired                       Allen Institute for AI
  T7   unchecked  UNVERIFIED                   HELD — liveness unchecked            Allen Institute for AI
✓ G4 human gate: cleared by varnikamujumdar on 2026-10-21 (4 drop, 2 keep-held)
status: COMPLETED — G4 cleared by varnikamujumdar on 2026-10-21: 4 drop, 2 keep-held
summary: {"evaluated": 7, "shortlist": 1, "flag": 2, "held": 3, "skip": 1, "not_shortlisted_rate": 0.857, "liveness_checked": 6, "record_supported": 1, "uscis_matched": 7, "uscis_matched_employers": 5, "cap_exempt_verified": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/report.md
exit: 0
```

Human report: `<run-dir>/report.md`. Agent log: `<run-dir>/run.json`. Audit: `<run-dir>/audit.md`.

### 5. Deliberate break attempts (`breaks/breaks-stdout.txt`)

```
## B1+B2+B8: look-alikes (blind spot, Form D record, IPEDS for-profit record)
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/targets.breaks.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness-recheck.txt --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b1-b2
✓ G1 input gate: inputs parsed
✓ G2 timeline gate: 102 days of OPT left, 66 required, OPT margin 36
  B1   active     UNVERIFIED                   SHORTLIST — exemption UNVERIFIED     Toyota Research Institute
  B2   unchecked  CONTRADICTED-BY-SIGNAL       HELD — liveness unchecked            CHAPMAN UNIVERSITY ENTERPRISES INC
  B8   unchecked  CONTRADICTED-BY-SIGNAL       HELD — liveness unchecked            University of Phoenix-Arizona
… G4 human gate: no decisions file — human gate open
status: COMPLETED — human gate open: the person decides which shortlisted employers to contact
summary: {"evaluated": 3, "shortlist": 1, "flag": 0, "held": 2, "skip": 0, "not_shortlisted_rate": 0.667, "liveness_checked": 1, "record_supported": 0, "uscis_matched": 1, "uscis_matched_employers": 1, "cap_exempt_verified": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b1-b2/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b1-b2/report.md
exit: 0

## B3: OPT already ended (run date after 2027-01-31)
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --run-date 2027-02-15 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b3-opt-ended
✓ G1 input gate: inputs parsed
✗ G2 timeline gate: -15 days of OPT left, 66 required, OPT margin -81
  failed: OPT end after run date: -15 (need > 0); days left on OPT >= hiring lag + H-1B processing: -15 (need >= 66)
status: STOPPED at G2 timeline — no employer is evaluated; talk to your DSO before applying
summary: {"evaluated": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b3-opt-ended/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b3-opt-ended/report.md
exit: 3

## B4: not employed on OPT -> unemployment clock binds
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/breaks/ext.unemployed.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b4-unemployed
✓ G1 input gate: inputs parsed
✗ G2 timeline gate: 102 days of OPT left, 66 required, OPT margin 36
  failed: unemployment days left (after buffer) >= hiring lag + processing: 36 (need >= 66)
status: STOPPED at G2 timeline — no employer is evaluated; talk to your DSO before applying
summary: {"evaluated": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b4-unemployed/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b4-unemployed/report.md
exit: 3

## B5: corrupted 80 Days header -> G1 halt, nothing written
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --csv scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/breaks/mini_80days.bad-header.csv --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b5-bad-header
✗ G1 input gate: 80 Days CSV is missing expected column(s): latest_funding_date, total_funding, Total Approvals, Total Denials. Nothing written.
exit: 2

b5 output dir exists? no

## B6: no liveness file at all
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b6-no-liveness
✓ G1 input gate: inputs parsed
✓ G2 timeline gate: 102 days of OPT left, 66 required, OPT margin 36
  T1   unchecked  UNVERIFIED-RECORD-SUPPORTED  HELD — liveness unchecked            Northeastern University
  T2   unchecked  UNVERIFIED                   HELD — liveness unchecked            Fred Hutchinson Cancer Center
  T3   unchecked  UNVERIFIED                   HELD — liveness unchecked            Allen Institute for AI
  T4   unchecked  CONTRADICTED-BY-SIGNAL       HELD — liveness unchecked            Toyota Research Institute
  T5   unchecked  CONTRADICTED-BY-SIGNAL       HELD — liveness unchecked            Howard Hughes Medical Institute (Janelia Research Campus)
  T6   unchecked  UNVERIFIED                   HELD — liveness unchecked            Allen Institute for AI
  T7   unchecked  UNVERIFIED                   HELD — liveness unchecked            Allen Institute for AI
… G4 human gate: no decisions file — human gate open
status: COMPLETED — human gate open: the person decides which shortlisted employers to contact
summary: {"evaluated": 7, "shortlist": 0, "flag": 0, "held": 7, "skip": 0, "not_shortlisted_rate": 1.0, "liveness_checked": 0, "record_supported": 1, "uscis_matched": 7, "uscis_matched_employers": 5, "cap_exempt_verified": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b6-no-liveness/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b6-no-liveness/report.md
exit: 0

## B7: first liveness pass only (no re-check)
$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage --persona search/examples/priya-nair/profile.yml --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json --targets course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/targets.json --liveness course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/liveness.txt --run-date 2026-10-21 --out-dir course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b7-first-pass-only
✓ G1 input gate: inputs parsed
✓ G2 timeline gate: 102 days of OPT left, 66 required, OPT margin 36
  T1   uncertain  UNVERIFIED-RECORD-SUPPORTED  HELD — liveness uncertain            Northeastern University
  T2   uncertain  UNVERIFIED                   HELD — liveness uncertain            Fred Hutchinson Cancer Center
  T3   active     UNVERIFIED                   SHORTLIST — exemption UNVERIFIED     Allen Institute for AI
  T4   uncertain  CONTRADICTED-BY-SIGNAL       HELD — liveness uncertain            Toyota Research Institute
  T5   active     CONTRADICTED-BY-SIGNAL       FLAG — claim contradicted            Howard Hughes Medical Institute (Janelia Research Campus)
  T6   expired    UNVERIFIED                   SKIP — expired                       Allen Institute for AI
  T7   unchecked  UNVERIFIED                   HELD — liveness unchecked            Allen Institute for AI
… G4 human gate: no decisions file — human gate open
status: COMPLETED — human gate open: the person decides which shortlisted employers to contact
summary: {"evaluated": 7, "shortlist": 1, "flag": 1, "held": 4, "skip": 1, "not_shortlisted_rate": 0.857, "liveness_checked": 6, "record_supported": 1, "uscis_matched": 7, "uscis_matched_employers": 5, "cap_exempt_verified": 0}
wrote course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b7-first-pass-only/run.json and course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/breaks/b7-first-pass-only/report.md
exit: 0
```

### 6. Tests (`tests-stdout.txt`)

```
$ python3 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage -v
test_counts_on_mini_csv (test_cap_exempt_triage.Audit) ... ok
test_distinct_employers_not_rows (test_cap_exempt_triage.AuditOverlap) ... ok
test_ipeds_overlap_measure (test_cap_exempt_triage.AuditOverlap) ... ok
test_mutant_is_caught (test_cap_exempt_triage.BrokenMutant) ... ok
test_hr_answer_is_human_attested_not_verified (test_cap_exempt_triage.EvidenceSignals) ... ok
test_inc_alone_is_not_evidence_either_way (test_cap_exempt_triage.EvidenceSignals) ... ok
test_legal_name_is_checked_for_form_and_form_d (test_cap_exempt_triage.EvidenceSignals) ... ok
test_statement_without_a_source_counts_as_name_only (test_cap_exempt_triage.EvidenceSignals) ... ok
test_unknown_soc_leaves_wage_empty (test_cap_exempt_triage.EvidenceSignals) ... ok
test_alias_matches (test_cap_exempt_triage.FederalRecords) ... ok
test_closed_institution_is_contradicted (test_cap_exempt_triage.FederalRecords) ... ok
test_for_profit_college_is_contradicted_by_record (test_cap_exempt_triage.FederalRecords) ... ok
test_human_chosen_link_is_used_and_labelled (test_cap_exempt_triage.FederalRecords) ... ok
test_missing_extracts_switch_checks_off (test_cap_exempt_triage.FederalRecords) ... ok
test_near_miss_is_shown_but_never_a_signal (test_cap_exempt_triage.FederalRecords) ... ok
test_public_university_is_record_supported_not_verified (test_cap_exempt_triage.FederalRecords) ... ok
test_same_name_two_states_is_ambiguous_until_state_given (test_cap_exempt_triage.FederalRecords) ... ok
test_uscis_rows_for_one_employer_are_summed (test_cap_exempt_triage.FederalRecords) ... ok
test_full_decisions_clear_g4_and_skip_rows_need_none (test_cap_exempt_triage.HumanGateG4) ... ok
test_invalid_value_or_no_name_keeps_g4_open (test_cap_exempt_triage.HumanGateG4) ... ok
test_missing_row_keeps_g4_open_and_names_it (test_cap_exempt_triage.HumanGateG4) ... ok
test_no_decisions_file_leaves_g4_open (test_cap_exempt_triage.HumanGateG4) ... ok
test_bad_csv_header_halts (test_cap_exempt_triage.InputGate) ... ok
test_bad_run_date_halts (test_cap_exempt_triage.InputGate) ... ok
test_lottery_selected_halts (test_cap_exempt_triage.InputGate) ... ok
test_text_assumption_halts (test_cap_exempt_triage.InputGate) ... ok
test_hard_expired_still_skipped (test_cap_exempt_triage.LivenessRechecks) ... ok
test_page_length_expired_is_held_not_skipped (test_cap_exempt_triage.LivenessRechecks) ... ok
test_recheck_supersedes_first_pass (test_cap_exempt_triage.LivenessRechecks) ... ok
test_everything_held (test_cap_exempt_triage.NoLivenessFile) ... ok
test_exit_code_and_outcomes (test_cap_exempt_triage.SampleRun) ... ok
test_expired_is_skipped (test_cap_exempt_triage.SampleRun) ... ok
test_form_d_match_contradicts_name_only_claim (test_cap_exempt_triage.SampleRun) ... ok
test_liveness_invariant_holds (test_cap_exempt_triage.SampleRun) ... ok
test_llc_form_is_a_signal (test_cap_exempt_triage.SampleRun) ... ok
test_never_verified (test_cap_exempt_triage.SampleRun) ... ok
test_no_absolute_paths_in_outputs (test_cap_exempt_triage.SampleRun) ... ok
test_report_opens_with_executive_summary (test_cap_exempt_triage.SampleRun) ... ok
test_summary_counts (test_cap_exempt_triage.SampleRun) ... ok
test_trailing_slash_still_matches_liveness (test_cap_exempt_triage.SampleRun) ... ok
test_uncertain_is_held_even_without_claim (test_cap_exempt_triage.SampleRun) ... ok
test_unchecked_url_is_held_not_scored (test_cap_exempt_triage.SampleRun) ... ok
test_wage_is_record_vs_input (test_cap_exempt_triage.SampleRun) ... ok
test_opt_already_ended_stops (test_cap_exempt_triage.TimelineGate) ... ok
test_sample_margin (test_cap_exempt_triage.TimelineGate) ... ok
test_slow_hiring_stops (test_cap_exempt_triage.TimelineGate) ... ok
test_unemployed_clock_stops (test_cap_exempt_triage.TimelineGate) ... ok

----------------------------------------------------------------------
Ran 47 tests in 0.192s

OK
```

### 7. Independent cross-checks, earlier run (`verification-stdout.txt`; superseded by §11)

This was recorded before the final fixes; its JSON parse reflects an earlier `run.json`. Two table lines ("not reported", "extract") were cut short by the display filter used at the time. §11 repeats every check with committed scripts on the final outputs.

```
$ wc -l data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
30370 data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv

$ python3 -c "<independent count: csv module, no shared code>"
rows 30369 | approvals>0 1552 | sounding 64 | sounding approvals>0 0 | sounding w/ stage 49

$ python3 -c "<parse run.json and check invariants>"
rows 7 | statuses ['CONTRADICTED-BY-SIGNAL', 'UNVERIFIED']
unchecked rows not HELD: []
rows whose checker said expired but held: ['T2']
summary {'evaluated': 7, 'shortlist': 2, 'flag': 1, 'held': 3, 'skip': 1, 'not_shortlisted_rate': 0.714, 'liveness_checked': 6, 'cap_exempt_verified': 0}

# DISCREPANCY: independent count found 64 names, script found 31. Reconciled below.
$ python3 -c "<names matched by the loose (no word-boundary) pattern but not the script pattern>"
extra 33 {'FOUNDATIONAL/FOUNDATIONS/AFOUNDATION': 3, 'HOSPITALITY': 25, 'HOSPITALIST/MICROHOSPITAL': 2, 'MEDICAL CENTERS (plural)': 3} | extra with approvals>0: 0
# Conclusion: the 33 extras are substring matches (HOSPITALITY etc.); 0 approvals under either definition.

# Re-run with IPEDS + USCIS extracts (same day). Independent recount of the extracts vs their audits:
$ wc -l scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/uscis_h1b_hub_fy2023.csv
6073 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv
33333 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/uscis_h1b_hub_fy2023.csv
39406 total
$ python3 -c "<independent recount: csv module, no shared code>"
IPEDS rows 6072 | control 1/2/3: 1980 1813 2257 | other 22
USCIS rows 33332 | NAICS61 rows 2042 | NAICS61 initial approvals 6246 | continuing 5368
  NORTHEASTERN UNIVERSITY: rows 2 initial 24 continuing 13
  FRED HUTCHINSON CANCER CENTER: rows 2 initial 20 continuing 24
  THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE: rows 2 initial 6 continuing 0
  TOYOTA RESEARCH INSTITUTE INC: rows 1 initial 1 continuing 2
ipeds-audit.md:| Rows in source | 6,072 |
ipeds-audit.md:| Rows in extract | 6,072 |
ipeds-audit.md:| CONTROL 1 public | 1,980 |
ipeds-audit.md:| CONTROL 2 private nonprofit | 1,813 |
ipeds-audit.md:| CONTROL 3 private for-profit | 2,257 |
 not reported | 22 |
 extract | 33,332 |
uscis-audit.md:| Rows with blank employer name | 1 |
uscis-audit.md:| Rows with NAICS 61 (educational services) | 2,042 |
uscis-audit.md:| Rows with NAICS 54 (professional, scientific, technical) | 15,400 |
uscis-audit.md:| Rows with NAICS 62 (health care) | 2,773 |
uscis-audit.md:| Sum of initial approvals, NAICS 61 rows | 6,246 |
uscis-audit.md:| Sum of continuing approvals, NAICS 61 rows | 5,368 |
```

### 8. Manual checks added after reviewing "Did not test" (`manual-checks-stdout.txt`)

```
# Manual checks, 2026-10-21 (outside the mode; added after the 'Did not test' review)

## 1. B4 regression test run against the PRE-FIX stop message (old wording monkeypatched in)
$ python3 b4_regression.py scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage
test_unemployed_clock_stops (t.TimelineGate) ... FAIL
FAIL: test_unemployed_clock_stops (t.TimelineGate)
  File "scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/test_cap_exempt_triage.py", line 297, in test_unemployed_clock_stops
AssertionError: 'unemployment days left' not found in "# Cap-exempt triage report\n\n## Executive summary\n\nThis report was meant to sort job postings at emplo
FAILED (failures=1)
RESULT on pre-fix behaviour: test FAILED (good: it catches the old bug)

## 2. Is Northeastern T1 open? Workday's own job-data endpoint
$ curl -s -H "Accept: application/json" https://northeastern.wd1.myworkdayjobs.com/wday/cxs/northeastern/careers/job/Boston-MA-Main-Campus/Associate-AI-Engineer_R141445 | <print fields>
title: Associate AI Engineer
jobReqId: R141445
startDate: 2026-08-12
timeType: Full time
location: Boston, MA (Main Campus)
canApply: True
posted: True

## 3. Why does Fred Hutch fail in the headless browser? (Playwright probe, same browser as ats:liveness)
$ node fh_probe.mjs <plain URL> <in_iframe URL>
https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
  HTTP 200 · final https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?mobile=false&width=1216&height=500&bga=true&needsRedirect=false&jan1offset=-300&jun1offset=-240
  top-level innerText: 13 chars · frames: 2 · longest frame text: 6866 chars
  top-level text starts: "Skip Branding"
https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1
  HTTP 200 · final https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
  top-level innerText: 13 chars · frames: 2 · longest frame text: 6866 chars
  top-level text starts: "Skip Branding"

## 4. Tests on a second Python version (scratch venv with PyYAML)
$ (venv) python3.12 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage
Python 3.12.14
Ran 45 tests in 0.140s

OK

## 5. Liveness on another job board (Ashby): one live posting from Ashby's public board API, plus a constructed dead Ashby URL
$ curl -s https://api.ashbyhq.com/posting-api/job-board/writer | <first jobUrl>
https://jobs.ashbyhq.com/writer/36aef3b1-ded0-4aed-9943-01bbf6568fe4
$ npm run ats:liveness -- https://jobs.ashbyhq.com/writer/36aef3b1-ded0-4aed-9943-01bbf6568fe4 https://jobs.ashbyhq.com/writer/00000000-0000-0000-0000-000000000000
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://jobs.ashbyhq.com/writer/*** https://jobs.ashbyhq.com/writer/***
Checking 2 URL(s)...
✅ active     https://jobs.ashbyhq.com/writer/36aef3b1-ded0-4aed-9943-01bbf6568fe4
❌ expired    https://jobs.ashbyhq.com/writer/00000000-0000-0000-0000-000000000000
           pattern matched: job (listing )?not found
Results: 1 active  1 expired  0 uncertain

## 6. Exact-name matching coverage beyond the five employers: of IPEDS public + private-nonprofit institutions, how many have an exact normalized-name row in USCIS FY2023?
$ python3 -c "<IPEDS control 1/2 names vs USCIS employer names, both through normalize_company_name>"
open public+nonprofit institutions: 3771 | exact USCIS name match: 544 (14.4%)
  Harvard University: exact match = True
  Stanford University: exact match = False
  Massachusetts Institute of Technology: exact match = False
  University of Washington-Seattle Campus: exact match = False
  Boston University: exact match = False
$ grep -i (stanford|massachusetts institute|boston university) in USCIS employer names
STANFORD UNIV|LELAND STANFORD -> ['THE LELAND STANFORD JR UNIVERSITY']
MASSACHUSETTS INSTITUTE OF TECH -> []
BOSTON UNIVERSITY -> ['BOSTON UNIVERSITY GENERAL SURGICAL ASSOCIATES INC', 'TRUSTEES OF BOSTON UNIVERSITY']
# Conclusion: USCIS often files under legal-entity spellings (Stanford as "THE LELAND STANFORD JR UNIVERSITY", BU as "TRUSTEES OF BOSTON UNIVERSITY"; MIT not found under its full name at all) that exact matching cannot bridge. A human-confirmed alias list (like the HHMI link) is the fix, not fuzzy matching.
```

### 9. Human gate G4 (`g4-decisions.json`)

The author read `report.md` and recorded one decision per non-skipped posting. The run in §4 already includes `--g4 <run-dir>/g4-decisions.json`; its stdout shows `✓ G4 human gate: cleared by varnikamujumdar on 2026-10-21 (4 drop, 2 keep-held)`.

```
{
  "_note": "Gate G4 (human). Decisions made by Varnika in this session after reading report.md; recorded verbatim. No reasons were given, so none are written here. T6 was skipped by the liveness gate and needs no decision.",
  "by": "varnikamujumdar",
  "date": "2026-10-21",
  "decisions": {
    "T1": "keep-held",
    "T2": "keep-held",
    "T3": "drop",
    "T4": "drop",
    "T5": "drop",
    "T7": "drop"
  }
}
```

### 10. Reproducibility

`bash <run-dir>/reproduce.sh` regenerates every non-network output from the committed inputs and extracts. It was run twice after the final change. The SHA-256 over exactly the files it writes (`audit.md`, `run.json`, `report.md`, `stdout.txt` and `breaks/`) was identical both times: `96a7e6628c407eb2369d47e42efbf2a1946b2fc49c8bcab5867d731bedd8441f`. The command to check it is in the script's header.

### 11. Final checks with committed scripts (`final-checks-stdout.txt`)

The scripts are in `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/`, so anyone can re-run them. This was run after the grader-review fixes, on the final outputs.

```
# Final checks, 2026-10-21 — committed scripts in scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/, run after the grader-review fixes

$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/recount.py
## 80 Days
rows 30369 | approvals>0 1552 | blank 28812 | sounding names 31 (approvals>0 0, funding stage 26)
## IPEDS extract
rows 6072 | control 1/2/3/other 1980/1813/2257/22
## USCIS extract
rows 33332 | NAICS 61 rows 2042 | NAICS 61 initial 6246 continuing 5368
  NORTHEASTERN UNIVERSITY: blank 3/1 + MA 21/12 = 24/13
  FRED HUTCHINSON CANCER CENTER: blank 1/0 + WA 19/24 = 20/24
  THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE: blank 1/0 + WA 5/0 = 6/0
  TOYOTA RESEARCH INSTITUTE INC: CA 1/2 = 1/2
  HOWARD HUGHES MEDICAL INSTITUTE HHMI: blank 3/1 + MD 46/16 + VA 0/1 = 49/18
## Overlap and coverage (exact normalized names)
open public+nonprofit IPEDS institutions 3771 | in 80 Days 0 | in USCIS 544 (14.4%)
80 Days sounding names that are IPEDS institutions: 0
## Final run.json (parsed)
statuses {'UNVERIFIED-RECORD-SUPPORTED': 1, 'UNVERIFIED': 4, 'CONTRADICTED-BY-SIGNAL': 2}
outcomes {'HELD': 3, 'SHORTLIST': 1, 'FLAG': 2, 'SKIP': 1}
unchecked rows not HELD: []
G4: True {'contact-hr': 0, 'drop': 4, 'keep-held': 2, 'open-posting-myself': 0}
summary {'evaluated': 7, 'shortlist': 1, 'flag': 2, 'held': 3, 'skip': 1, 'not_shortlisted_rate': 0.857, 'liveness_checked': 6, 'record_supported': 1, 'uscis_matched': 7, 'uscis_matched_employers': 5, 'cap_exempt_verified': 0}

$ python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/b4_regression.py scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage
test_unemployed_clock_stops (t.TimelineGate) ... FAIL
FAIL: test_unemployed_clock_stops (t.TimelineGate)
  File "scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/test_cap_exempt_triage.py", line 304, in test_unemployed_clock_stops
AssertionError: 'unemployment days left' not found in "# Cap-exempt triage report\n\n## Executive summary\n\nThis report was meant to sort job postings at emplo
FAILED (failures=1)
RESULT on pre-fix behaviour: test FAILED (good: it catches the old bug)

$ node scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/fh_probe.mjs https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job "https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1"
https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
  HTTP 200 · final https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?mobile=false&width=1216&height=500&bga=true&needsRedirect=false&jan1offset=-300&jun1offset=-240
  top-level innerText: 13 chars · frames: 2 · longest frame text: 6866 chars
  top-level text starts: "Skip Branding"
https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job?in_iframe=1
  HTTP 200 · final https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job
  top-level innerText: 13 chars · frames: 2 · longest frame text: 6866 chars
  top-level text starts: "Skip Branding"

$ (venv) python3.12 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage
Python 3.12.14
Ran 47 tests in 0.199s

OK
```

## Verified vs. inferred, line by line

| Claim in the report | Status | How established |
|---|---|---|
| 30,369 rows; 1,552 with approvals > 0 | **verified** | script count, matched by an independent count and `wc -l` (§7) |
| 31 cap-exempt-sounding names, 0 with approvals, 26 with a funding stage, 13 LLC/LP-type | **verified** (given the pattern) | script count. The substring version found 64; the extra 33 are noise, with 0 approvals (§7) |
| IPEDS: 6,072 institutions, 1,980 / 1,813 / 2,257 / 22 by control | **verified** | ingest audit, matched by an independent recount (§7) |
| USCIS FY2023: 33,332 rows; 2,042 NAICS 61 | **verified** | ingest audit, matched by an independent recount (§7) |
| Northeastern: IPEDS private nonprofit, UNITID 167358 | **verified record** | exact name match |
| Northeastern 24/13, Fred Hutch 20/24, Ai2 6/0, TRI 1/2 FY2023 approvals | **verified record** | resolver output, matched by an independent recount (§7) |
| H-1B approvals mean these employers sponsor | **verified**; whether any petition was cap-exempt is **unknown** | the Data Hub does not record cap-exempt status |
| HHMI 49 initial / 18 continuing | **verified record** through a **human-chosen link** | no exact match. The near-miss "HOWARD HUGHES MEDICAL INSTITUTE HHMI" was confirmed as the same employer by the author at G4; independent recount MD 46/16 + VA 0/1 + blank 3/1 |
| Ai2 legal name "The Allen Institute for Artificial Intelligence" | **your-input** from https://allenai.org/terms | needed to match USCIS (the posting says "Allen Institute for AI") |
| T3, T5 active; T6 expired; T4 active on re-check | **verified** (by the checker) | §1–2 |
| T1 uncertain; T2 "expired" → held | checker output **verified**; that both postings are open is **verified by manual check** | T1: Workday API `canApply: True` (§8). T2: manual fetch (§3) and frame probe (§8) |
| T7 HELD | **verified** behaviour | not in any liveness file |
| T4 flagged | **verified** that the rule fired on **your-input** | `claim_basis: name-only` is a person's judgment |
| Claimed categories T1–T3, T5 | **your-input** | quotes from employer pages. HHMI says "private", not "nonprofit" |
| SOC 15-1252 for every role | **model-judgment** | 15-1221 is plausible for research roles |
| National median $133,080 | **verified** | BLS compact row 15-1252.00 |
| G2: 102 days left, 66 required, margin 36 | **verified arithmetic** on **your-input** | 45-day lag is a labelled guess (closed DEFINE) |
| Regulatory statements | **checked against primary text** (AI helper, 2026-10-21); **not legal advice** | citations in SOURCES.md |
| G4 decisions (2 keep held, 4 drop) | **human decision** | the author's own judgment, recorded without reasons in `g4-decisions.json`. Her reason, given afterwards in FRICTIONAL ("In my own words"): she kept on hold the two postings the tool had held, to check them herself |
| T5 HHMI flagged | **your-input** reading → fails closed | HHMI's pages say "private", never "nonprofit" (checked /about, /about/faq, /about/financials), so the category is not stated by the employer |

## Contributions

- **Varnika (author):**
  - chose the domain and the cap-exempt idea from five options;
  - ran the git setup (upstream remote, a clean branch from `upstream/main`, and the check that no commits from the old PR came along);
  - reviewed and directed scope: asked for the open TODOs to be closed, chose the middle scope (IPEDS + USCIS + hiring lag), decided to keep 45 days as a labelled guess, and asked for SOURCES.md, FRICTIONAL.md and this section;
  - gave the answers FRICTIONAL.md is written from;
  - **questioned the work, and each question changed it:**
    - asked why only her attestation counts;
    - asked whether the previous recipe had open TODOs, then changed scope;
    - asked why "Did not test" was so long, which led to six more items being tested or measured;
    - asked whether G4 was checked: it wasn't, and its rule wasn't testable, so both were fixed;
    - asked us to check this work against a classmate's grading comments, which found the legal-name mismatch;
  - **made the G4 decisions** (2 keep held, 4 drop) and **confirmed the HHMI record link**;
  - signs the attestation below.
- **Claude Code:** code, tests, runs, data ingest, document drafts, verification.
- **AI research helpers:** found the postings and checked the regulations.

## Attestation

- Recipe: varnikamujumdar-cap-exempt-triage v0.1.0
- By: Varnika Mujumdar · 2026-10-21 · I re-ran the 47 tests (OK) and reproduce.sh myself; the output fingerprint 96a7e662… matched, and I read report.md.
- AI assistance: see Contributions and SOURCES.md.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `ingest.py all` | first attempt halted on a garbled header and wrote nothing; after the fix, 6,072 IPEDS + 33,332 USCIS rows | a halt on any upstream column change; full extracts after |
| independent recount of both extracts | identical to the audits | identical |
| `npm run ats:liveness` on T1–T6 | 2 active, 2 expired, 2 uncertain | a real result per URL |
| re-check of TRI + Fred Hutch | TRI active; Fred Hutch expired on both URLs | timeout resolves; frame cause confirmed or not |
| `audit --json` on 80 Days | 31 sounding names, 0 approvals | matches the independent count |
| independent 80 Days count | 64, not 31 → reconciled (substring noise, 0 approvals) | identical (**it did not match; resolved**) |
| `triage` on 7 rows with records | 1 shortlist, 2 flag, 3 held, 1 skip; 1 record-supported; USCIS 7/7 rows (5 distinct employers); verified 0 | no "cap-exempt: yes"; unchecked → HELD |
| **break B1:** TRI typed as an employer statement | **SHORTLIST** | the blind spot: the mode should miss it, and it did |
| **break B2:** real `CHAPMAN UNIVERSITY ENTERPRISES INC` claimed as a university | CONTRADICTED (Form D record), HELD | contradicted, never shortlisted |
| **break B8:** real University of Phoenix-Arizona claimed as a university | CONTRADICTED (IPEDS for-profit record), HELD | contradicted by a federal record |
| **break B3:** run date after OPT end | STOP, exit 3, two failed checks named | STOP |
| **break B4:** not employed on OPT | STOP naming "unemployment days left … 36 (need >= 66)" | STOP naming the unemployment check |
| **break B5:** corrupted CSV header | G1 halt, exit 2, no output dir | halt, nothing written |
| **break B6:** no liveness file | all 7 HELD | nothing scored |
| **break B7:** first liveness pass only | TRI HELD (timeout) instead of FLAG | only that row changes |
| BROKEN mutant (unchecked = active) | caught by the invariant check | caught |
| B4 regression test against the **pre-fix** message | test fails ("'unemployment days left' not found") | fails, so it guards the bug |
| Workday API for Northeastern T1 | `canApply: True`, `posted: True` | open or closed, from the source |
| Playwright frame probe on Fred Hutch | top-level 13 chars; frame 6,866 chars; `?in_iframe=1` redirects to the wrapper | the cause of the false "expired" |
| `ats:liveness` on Ashby: one live Writer posting + one made-up dead URL | active; expired ("job not found") | both classified correctly |
| exact-name coverage: IPEDS open public/nonprofit institutions vs USCIS FY2023 | 544 of 3,771 (14.4%) match exactly; Stanford, MIT, BU do not | a measure of the matching limit, not a pass/fail |
| G4 decisions file | cleared: 6 decisions, T6 needs none | cleared only with a name, a date and every row decided |
| G4 with a row removed / an invalid value / no name | stays open; missing row named | stays open |
| 47 offline tests, Python 3.9.6 and 3.12.14 | 47 pass on 3.9.6 and 47 pass on 3.12.14 | all pass |
| committed `checks/recount.py` on the final outputs | every count matches (§11), including HHMI blank 3/1 + MD 46/16 + VA 0/1 = 49/18 and 0 of 3,771 universities in 80 Days | identical to the report |
| `reproduce.sh` twice | identical SHA-256 | byte-identical |

### Did not test

Six earlier items were tested or measured instead (§8): the B4 pre-fix run, Northeastern's status, the Fred Hutch cause, Python 3.12, Ashby liveness, and exact-name coverage. What remains are real limits:

- **Whether any employer files cap-exempt for these roles.** Nobody contacted HR, and the G4 decisions contact no one. No script can test this.
- **Employers the exact-name match misses.** Measured, not solved: only 14.4% of universities match USCIS exactly, because USCIS uses legal-entity spellings. Each non-match needs a human link, as HHMI did.
- **Legal accuracy** beyond the cited provisions. No DSO or attorney review.
- **Not built, so not tested:** the IRS nonprofit list, ACWIA wages, and USCIS data after FY2023 (the open TODOs). GitHub Actions does not run these tests.

### Broke during testing, fixed

1. **Misleading STOP message (B4).** It printed "margin 36" and blamed the OPT end date. Now each failed check is named. Test `test_unemployed_clock_stops`.
2. **False "expired" on a live iCIMS posting.** Now HELD (`SOFT_EXPIRED_REASON`). Tests in `LivenessRechecks`.
3. **Transient timeout hid the TRI flag.** `--liveness` is now repeatable and re-checks supersede earlier results.
4. **The audit summary overclaimed** ("names belong to companies raising private money"). Now it states the counts (26/31).
5. **Absolute home-directory paths** appeared in outputs. Now repo-relative. Test `test_no_absolute_paths_in_outputs`.
6. **The 80 Days cross-check disagreed (64 vs 31).** It was the pattern definition, not a bug. Documented.
7. **IPEDS header garbled by a byte-order mark.** The ingest guard halted correctly and the decoding was fixed.
8. **Re-ingest duplicated provenance rows.** Now idempotent.
9. **Recipe/script mismatch.** The recipe promised "a missing claim source = name-only"; the script didn't do it. Implemented, with test `test_statement_without_a_source_counts_as_name_only`.
10. **The BROKEN mutant broke** when the triage function gained the records argument. Its signature was updated, and the suite still catches it.
11. **An empty "Record checks:" line on a STOP report.** Now "not run — stopped at G2".
12. **G4 had no testable condition** (found when the author asked whether G4 was checked). Now `--g4`: cleared only with a name, a date and a decision for every non-skipped row. Tests in `HumanGateG4`.
13. **Card/code mismatch.** The card said the *legal name* is checked for LLC/LP and Form D, but the code checked only the posting name (found while checking against a classmate's grading comments). Fixed; test `test_legal_name_is_checked_for_form_and_form_d`.

Found by an independent review (a grader-style pass over the whole submission):

14. **Overclaim.** "All 31 are for-profits" and "none had visa approvals" were stated as findings, but only 26/31 raised money, only 13 are LLC/LP, and 94.9% of all approval fields are blank. Replaced with the measured counts plus a stronger measure: **0 of 3,771** open public/nonprofit IPEDS institutions appear in 80 Days. New audit line; test `test_ipeds_overlap_measure`.
15. **Written vs. running re-check rule.** The recipe said "re-check every non-active URL", but only TRI and Fred Hutch were re-checked. The recipe now states the rule that ran.
16. **HHMI claim basis.** It was recorded as an employer statement, but HHMI's pages say "private", not "nonprofit". T5 now fails closed (FLAG), and the signal is reworded to "not stated by the employer".
17. **Rows counted as employers.** "7 have H-1B counts" counted Ai2 three times (including the made-up T6). The summary now adds distinct employers (5). Test `test_distinct_employers_not_rows`.
18. **Stale numbers and non-runnable checks.** USCIS 6/7 → 7/7; 44 → 47 tests; "four" → "six" items tested; a mis-shortened fingerprint. The check scripts are now committed in `checks/` (§11).

## Reflection

**What went well.**
- The central claim is a measured count, and a second, government dataset confirms the flip side: the employers exist and sponsor, the startup data just can't see them.
- "Unchecked = HELD", last assignment's −1, held in every break test, and the mutant reproducing it is caught.
- Real web runs and real downloads found problems fixtures never would: a timeout, a false "expired", a garbled header.

**What the mode got wrong or missed.**
- A for-profit research company with no warning sign still gets shortlisted if the claim is typed as an employer statement (B1). The IRS nonprofit list is the fix, and it's still open.
- Exact name matching misses real spellings (HHMI). That's the right failure (it shows candidates and doesn't guess), but it means a human has to link records.
- Liveness is the weakest gate for this population: two of the five real postings it checked needed a human look because of the checker.
- The hiring lag is a guess, and the timeline gate depends on it entirely.
- One run, one persona, five employers. Nothing measures how often the mode is right.

**In my own words:** see FRICTIONAL.md, "In my own words".

**Next steps.**
1. Ingest the IRS EO BMF and extend the resolver to it (open items 4 and 6). That closes the B1 blind spot for most cases.
2. Ingest the ACWIA wage tables (open item 5) so salaries are compared to the table cap-exempt employers actually use.
3. Report the iCIMS frame problem to the maintainers as an issue against `scripts/ats/liveness-core.mjs`.
4. Add more USCIS years as they are published, and keep a human-confirmed alias list (like HHMI → "…HHMI") rather than fuzzy matching.
