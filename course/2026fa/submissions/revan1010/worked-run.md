# Worked Run — MSIS → SWE, Boston, F-1 OPT from February 2027 (2026-10-20)

## Executive summary

**What this is:** the record of one real run of the job-search recipe built for an international Information Systems master's student seeking a junior software job in Boston after graduating in December 2026. Every command was executed against the project's real data and against live job boards. The output below is pasted from the terminal, not described.

**Why read it:** it shows what the recipe could establish from records, what it had to leave to human judgment, and where it was tried and broken on purpose.

**What it found:**
- 200 nearby employers have a sponsorship record. 21 show strong evidence of sponsoring non-senior software engineers, and 20 have sponsored only senior ones.
- Every sponsorship count in the source file is an even number, so the counts are very likely doubled.
- With OPT starting February 2027 there is **1** visa-lottery chance (March 2027), or 3 if the employer's E-Verify status is confirmed.
- Of 6 real postings, 3 were scored and 3 were refused: 2 could not be confirmed live, and 1 was in India. All 3 scored roles came out "Consider" with an identical score of 0.215. With one lottery chance, no role reaches "Apply" even at perfect fit (0.29). With E-Verify confirmed, the same role scores 0.43, "Apply". Fit judgments are still placeholders, so the result is explicitly not decision-grade.
- This run **supersedes** a first run that used an impossible OPT start (May 2027, more than 60 days after a December graduation). The mode now refuses that input.
- The most useful discovery: the engine's scorer treats a *missing* liveness check as "live". This recipe adds the step that refuses such roles.

## Run record

| Field | Value |
|---|---|
| Recipe | `recipes/cases/2026fa/revan1010-msis-swe-boston-opt.md` v0.1.0 (status DRAFT, 9 open TODOs) |
| Date | 2026-10-20 (local; some artifacts carry 2026-10-21 UTC stamps) |
| Machine | macOS (Darwin 25.3), Node v26.0.0, Python 3.14.5 in a venv with PyYAML + `scripts/ats/requirements.txt` |
| Repo | `nikbearbrown/the-reallocation-engine` @ `015843d` |
| Source CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` |

## Inputs

| Input | Value | Where it lives | Source label |
|---|---|---|---|
| Planning profile | `as_of 2026-10-20`, `program_end 2026-12-23` (confirmed by the student), `opt_start 2027-02-01` (chosen planning date inside the 60-day window; any date in the window gives the same draws, tested), `stem_degree true` (confirmed by the student: the MSIS is STEM-designated), 30 commute cities, no E-Verify overrides | `scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json` (tracked; timeline assumptions only, no contact data) | your-input |
| Candidate postings | 6 public postings at 5 employers chosen from the short-list: Klaviyo SWE II (Boston), PathAI SWE I Fullstack and SDET (Boston), Tulip SWE Frameworks (Somerville), Formlabs SWE Print Pipeline (Somerville), Cohere Health SWE (Hyderabad, included to test the location refusal) | `private/real-postings/candidates-2026-10-20.json` (gitignored) | human pick |
| Fit | **placeholder 0.5 for every role.** The student has not yet judged fit | `private/real-postings/fit-2026-10-20.json` (gitignored) | your-input (placeholder) |

## Commands and real output

### 0. Toolchain: verify failed first, then fixed

```text
$ npm run verify
conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
Traceback (most recent call last):
  File "<string>", line 1, in <module>
    import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))
    ^^^^^^^^^^^^^^^^
ModuleNotFoundError: No module named 'yaml'

ERROR (1):
  E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"

✗ manifest check FAILED (1 error)
```

Fix: Homebrew Python refuses a `pip install --user` under PEP 668, so I created `../.venv` with PyYAML and put it first on `PATH`. After that, verify passes (see step 7).

### 1. Engine gates still multiply: `npm run score:gates`

```text
=== Gate-Behavior Harness — Bayesian Role Scorer (Ch.11) ===
scorer   : scripts/score/role-scorer.mjs
fixtures : scripts/score/fixtures/gate-cases.json (10 cases)
provenance: fixtures are SYNTHETIC test vectors — no real company data

--- CONFIG ---
PASS  config-matches-fixtures        all 6 values match the config the expected values were derived from

--- BASELINE (unmodified scorer) ---
PASS  G1-liveness-zero-with-maximal-votes
        composite 0 (vote_sum 0.65 x gate_product 0) -> Skip
PASS  G2-timeline-zero-with-maximal-votes
        composite 0 (vote_sum 0.65 x gate_product 0) -> Skip
[… G3–G9b, 8 more PASS lines, trimmed …]

--- PAIRED (cross-case relations) ---
WARN  P1-role-quality-inert
        G9a-role-quality-absent composite 0.325 vs G9b-role-quality-maximal composite 0.325 -> equal: true
        role_quality p moved 0.0 -> 1.0 with no change to the composite. This is expected while weights.role_quality = 0.0, and is the open authorial decision recorded in DOMAIN.md gap 3 — not a code defect. Reported so it cannot be forgotten.

--- NEGATIVE CONTROL (mutated scorer: gates as additive votes) ---
      mutation applied: 2/2 patterns matched (gates-become-additive-votes, closed-gate-branch-removed)
CAUGHT  G1-liveness-zero-with-maximal-votes  baseline PASS -> mutant FAIL (mutant composite 0.8, rec Apply)
[… 4 more CAUGHT lines, trimmed …]

=== SUMMARY ===
config drift      : none
baseline cases    : 10 passed, 0 failed  (of 10)
structural checks : 3 passed, 0 failed  (of 3)
paired checks     : 1 warning(s)
negative control  : PASS — mutation caught by 5 assertion(s)
RESULT            : PASS
```

### 2. The repo's own audit of the source: `validate-h1b-join-sample.py`

```text
$ python3 scripts/sec/validate-h1b-join-sample.py ../worked-run-output/mapped_student_employment_targets_v3.csv
…/worked-run-output/mapped_student_employment_targets_v3-join-validation-audit.md
```

Its "Local Finding" section reads, in part, that the repository has *no raw DOL/LCA records, USCIS source records, original H-1B employer names, match scores, or match-method metadata*. Its row-shape table reports **MA: 227** H-1B-mapped rows. That number is used as a cross-check in step 3.

### 3. Triage, gates G0 + G1: `sponsor-triage.mjs` (via `run-mode.sh`)

```text
== 1. sponsor triage (80 Days layer + timeline gate) ==
sponsor-triage: 30369 rows · 1557 with H-1B · MA 227 · commute 201 · kept 200
tiers: Proven 21 · Likely 13 · Possible 20 · Unknown 146
parity: approvals even 1557/1557, denials even 1557/1557 → double-count suspected: true
timeline: E-Verify unknown → 1 draw(s), factor 0.5, until 2028-01-31 | E-Verify confirmed → 3 draw(s), factor 1, until 2030-01-31
wrote ../worked-run-output/run-2026-10-20/triage.json and ../worked-run-output/run-2026-10-20/triage.md
```

Top of the human report (`triage.md`, short-list rows 1–10 and 22):

```text
| # | Employer | City | Tier | Approvals / denials (raw) | Rate % | Median sponsored salary | Non-senior SWE titles (record; unmarked level ≠ new-grad) | Form D funding |
| 1 | PEGASYSTEMS INC | CAMBRIDGE | Proven | 180 / 2 | 98.9 | $129,189 | Software Engineer, Model Runtime | 2019-05-10 (stale) |
| 2 | HEALTHEDGE SOFTWARE INC | BURLINGTON | Proven | 156 / 4 | 97.5 | $121,547 | Software Engineer II | 2014-09-08 (stale) |
| 3 | KLAVIYO INC | BOSTON | Proven | 154 / 4 | 97.5 | $126,000 | Software Engineer II | 2022-07-26 (stale) |
| 4 | COHERE HEALTH INC | BOSTON | Proven | 104 / 2 | 98.1 | $160,000 | Software Engineer II | 2025-05-07 (recent) |
| 5 | CELERO SYSTEMS INC | BROOKLINE | Proven | 100 / 4 | 96.2 | $108,514 | SOFTWARE DEVELOPER | 2019-06-19 (stale) |
| 6 | PATHAI INC | CAMBRIDGE | Proven | 78 / 2 | 97.5 | $145,600 | Software Engineer I | 2019-04-09 (stale) |
| 7 | LENDBUZZ INC | BOSTON | Proven | 60 / 0 | 100 | $125,000 | Full Stack Engineer; Software Engineer | 2021-05-13 (stale) |
| 8 | VESTMARK INC | WAKEFIELD | Proven | 52 / 0 | 100 | $117,101 | Software Engineer | 2017-09-27 (stale) |
| 9 | OVERJET INC | BOSTON | Proven | 48 / 2 | 96 | $195,000 | Software Engineer | 2024-02-16 (stale) |
| 10 | NETBRAIN TECHNOLOGIES INC | BURLINGTON | Proven | 36 / 4 | 90 | $102,500 | Software Engineer | 2014-04-07 (stale) |
| 22 | FORMLABS INC | SOMERVILLE | Likely | 70 / 10 | 87.5 | $111,000 | Software Engineer | 2018-07-16 (stale) |
```

Analysis of `triage.json` (a short `node -e` over the JSON; output verbatim):

```text
Possible (senior-only) top by raw approvals:
   THERMO FISHER SCIENTIFIC INC 1096 | Staff Engineer, Software
   TOAST INC 150 | Senior Software Engineer; Staff Software Engineer/Team Lead Manager; Staff Software Engineer - Payments Extensibility, Tech Lead
   GINKGO BIOWORKS INC 122 | Software Engineering Manager
   TRACELINK INC 112 | Senior Software Engineer
   CAMBRIDGE MOBILE TELEMATICS INC 72 | Senior Software Engineer - Machine Learning
   NUANCE COMMUNICATIONS INC 60 | Senior Software Engineer; Manager II Software Engineering; Senior Cloud DevOps Engineer
Proven approvals median 22
employers with >=50 raw approvals: 22 of which senior-only: 6 THERMO FISHER SCIENTIFIC INC, TOAST INC, GINKGO BIOWORKS INC, TRACELINK INC, CAMBRIDGE MOBILE TELEMATICS INC, NUANCE COMMUNICATIONS INC
recent Form D (<=24mo): 15 COHERE HEALTH INC(Proven), CODAMETRIX INC(Unknown), TREELINE BIOSCIENCES INC(Unknown), APIPHANI INC(Unknown), LITHIOS INC(Unknown), DEWPOINT THERAPEUTICS INC(Unknown), ZAPATA COMPUTING HOLDINGS INC(Unknown), ALLURION TECHNOLOGIES INC(Unknown), BOSTON ELECTROMETALLURGICAL CORP(Unknown), LEXINGTON MEDICAL INC(Unknown), MAGLEV AERO INC(Unknown), MYTHIC THERAPEUTICS INC(Unknown), VERAI DISCOVERIES INC(Unknown), FACTOR BIOSCIENCE LLC(Unknown), MANIFOLD BIOTECHNOLOGIES INC(Unknown)
suspicious SWE matches: NEWSTORE INC: Solution Engineer Frontend/Backend - Field Services
```

### 4. Board fetch (Job-Ops ingest): `fetch-real-postings.py`

```text
[greenhouse] Klaviyo: found 165 jobs
[greenhouse] PathAI: found 14 jobs
[greenhouse] Cohere Health: found 76 jobs
… | WARNING  | Non-retryable status 404 for https://boards-api.greenhouse.io/v1/boards/lendbuzz/jobs
[greenhouse] Lendbuzz: not found
[greenhouse] Overjet: not found
[greenhouse] Tulip: found 63 jobs
[greenhouse] Formlabs: found 246 jobs
[greenhouse] HealthEdge: not found
[greenhouse] Abacus Insights: found 17 jobs
[greenhouse] Pegasystems: not found
[lever] Lendbuzz: found 0 jobs
[lever] Overjet: not found
[lever] Tulip: not found

581 real postings combined from 7/13 companies found
  0 have description_text, 581 do not (schema gate will reject those)
  wrote private/real-postings/boston-sponsors-2026-10-20.json
  not found: ['Lendbuzz', 'Overjet', 'HealthEdge', 'Pegasystems', 'Overjet', 'Tulip']
```

A separate Toast fetch returned 310 postings, but **no engineering role at a Boston, MA location** (locations: Dublin 20, Remote US 13, Boston 10 non-engineering, …).

### 5. Liveness (G3) → role build → engine scorer (`run-mode.sh`, steps 2–4)

```text
== 2. liveness gate (Job-Ops layer) ==
Checking 6 URL(s)...

✅ active     https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003
✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002
✅ active     https://www.pathai.com/careers/8769657002?gh_jid=8769657002
⚠️ uncertain  https://tulip.co/careers/job-posting/?gh_jid=7832884003
           content present but no visible apply control found
⚠️ uncertain  https://careers.formlabs.com/job/7536038/apply/?gh_jid=7536038
           content present but no visible apply control found
✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7980642003

Results: 4 active  0 expired  2 uncertain
== 3. build scorer input (refuses any role missing a gate or a fit input) ==
build-roles: 6 candidates → 3 scorable · 3 refused
  REFUSED tulip-swe-frameworks: liveness uncertain — human must open the posting and decide
  REFUSED formlabs-swe-print: liveness uncertain — human must open the posting and decide
  REFUSED cohere-swe: location "Hyderabad, Telangana, India" not in declared commute set
  WARNING: 3 role(s) use a placeholder fit value — scores are NOT decision-grade until the student supplies real fit judgments
wrote ../worked-run-output/run-2026-10-20/roles.json
== 4. engine scorer (Ch.11 composite) ==
✓ scored 3 roles → Apply 0 · Consider 3 · Skip 0 (skip 0%)
  ../worked-run-output/run-2026-10-20/role-scores.json  +  ../worked-run-output/run-2026-10-20/role-scores.md
== 5. done: human gates are still open — see the recipe ==
```

Engine report rows (`role-scores.md`):

```text
| KLAVIYO INC — Software Engineer II - Recommendations | 0.215 | **Consider** | composite 0.215 in the Consider band [0.2, 0.3) | sponsorship 0.8·0.35 [record]; fit 0.5·0.3 [your-input]; role_quality 0.767·0 [record] × liveness 1[record]×timeline 0.5[your-input] |
| PATHAI INC — Software Engineer I, Fullstack | 0.215 | **Consider** | composite 0.215 in the Consider band [0.2, 0.3) | sponsorship 0.8·0.35 [record]; fit 0.5·0.3 [your-input]; role_quality 0.767·0 [record] × liveness 1[record]×timeline 0.5[your-input] |
| PATHAI INC — Software Development Engineer in Test (SDET) | 0.215 | **Consider** | composite 0.215 in the Consider band [0.2, 0.3) | sponsorship 0.8·0.35 [record]; fit 0.5·0.3 [your-input]; role_quality 0.716·0 [record] × liveness 1[record]×timeline 0.5[your-input] |
```

### 5b. The first run's OPT date is now refused (input-error gate)

The superseded first run used `opt_start 2027-05-01`. Re-running triage with that profile now halts:

```text
HALT: opt_start 2027-05-01 is 129 days after program_end 2026-12-23; post-completion OPT must start within 60 days of program end
exit=2
```

### 6. Boston wage (Cognitive Pivot): attempted, refused

```text
$ python3 scripts/bls/local-wage-adjustment.py --metro "Boston-Cambridge-Nashua, MA-NH" --soc 15-1252
missing .venv — create it with:
  python3.13 -m venv .venv
  .venv/bin/pip install -r data/bls/local-wage/requirements.txt
exit=2
$ ls data/bls/local-wage
ls: data/bls/local-wage: No such file or directory
```

National figures from `data/bls/compact/soc_occupation_compact.csv` (record):

```text
15-1211.00 15-1211 Computer Systems Analysts | jz 3 | emp 497800.0 | med 103790.0 | prse 0.9 | cps 4.024
15-1252.00 15-1252 Software Developers | jz 4 | emp 1654440.0 | med 133080.0 | prse 0.7 | cps 3.834
15-1253.00 15-1253 Software Quality Assurance Analysts and Testers | jz 4 | emp 199800.0 | med 102610.0 | prse 1.7 | cps 3.582
```

### 7. Conformance and privacy on the final tree

```text
$ npm run verify
conformance: 169 files (88 md · 36 py · 34 js · 6 json · 5 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/
✓ manifest check passed (3 warnings)

$ npm run doctor
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
SUMMARY
  environment: ✓ runnable

$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions
  [email] package-lock.json — <an npm package author's address, redacted here so this file does not trip the same scan>
```

The single PII finding is in the repository's existing, unmodified `package-lock.json`: an npm package author's address, not mine. The W2 warnings are pre-existing too: `.gitignore` uses `/private/*`, which the check does not recognise. Both are logged as defects rather than "fixed".

## Verified vs. inferred

| Claim in this run | Established by | Label |
|---|---|---|
| 30,369 rows; 1,557 with H-1B fields; 227 in MA | `sponsor-triage.mjs` count, **matches** the repo's own join audit (MA = 227) | verified (record, cross-checked) |
| 1,557/1,557 approvals and denials are even | deterministic count, re-run with a standalone Python check (same result) | verified (record) |
| …therefore counts are probably ~2× inflated | inference from the parity pattern; raw source absent | **inferred** |
| 200 employers in the commute set; tier counts 21/13/20/146 | declared rules applied to record fields; 10 unit tests | verified given the rules; the **rules** are my judgment |
| Toast, Thermo Fisher etc. show only senior SWE titles | record title strings | verified (record) |
| …so they are poor new-grad targets | inference; the list holds only top titles | **inferred** |
| "NEWSTORE: Solution Engineer Frontend/Backend" is SWE | classifier output | **wrong** (false positive, found by inspection) |
| 1 lottery draw (E-Verify unknown) / 3 (confirmed) | date arithmetic, unit-tested; same for any start date in the 60-day window | verified arithmetic; STEM designation confirmed by the student; exact program-end/OPT dates and this year's registration dates **unconfirmed** |
| Klaviyo, PathAI ×2, Cohere postings `active` | `ats:liveness` (Playwright) | verified (record, 2026-10-20) |
| Tulip, Formlabs postings `uncertain` | `ats:liveness` | verified as *uncertain*, refused |
| Tulip and Formlabs postings exist | job IDs present in the 2026-10-20 board-API snapshot (step V3) | verified listing; **not** cleared as a gate (needs the student) |
| Greenhouse board "tulip" = TULIP INTERFACES INC | 39 of 63 postings are located in Somerville, MA | **inferred** entity match |
| Fit 0.5 for every role | placeholder | **not evidence** |
| Consider 0.215 × 3 | engine scorer arithmetic on the above | verified arithmetic; **not decision-grade** |
| Computer Systems Analyst Cognitive Pivot 4.024 > Software Developer 3.834 | compact table (record) | verified number; its meaning for AI-resilience is the **book's thesis**, not tested here |
| MSIS degree supports a 15-1252 petition | nothing | **unknown** (gate G5) |

## Verification (how I know the output is real)

- **V1, cross-count against the source's own audit.** My MA H-1B count (227) equals `validate-h1b-join-sample.py`'s state table (MA 227), produced independently by a different script in a different language.
- **V2, independent parity re-check.** A separate Python script over the same CSV printed `approvals even: 1557 odd: 0 … denials even: 1557 odd: 0 … approvals==0: 5 … MA h1b rows 227 MA approvals==0 1`. That `MA approvals==0 1` is exactly the `zero approvals 1` reject in the triage run record.
- **V3, liveness cross-check against the board API.** Each "uncertain" job ID was checked for presence in that day's API snapshot:

  ```text
  tulip/7832884003: LISTED in board API snapshot 2026-10-20
  formlabs/7536038: LISTED in board API snapshot 2026-10-20
  pathai/1000000001: NOT listed in board API snapshot
  pathai/8696764002: LISTED in board API snapshot 2026-10-20
  ```

- **V4, parsed the JSON, did not trust the console.** `roles.json → decision_grade: false`, `refused[]` has 3 entries, and `role-scores.json → profile_needs_sponsorship: true` with weights `{sponsorship 0.35, fit 0.3, role_quality 0}`. That shows the F-1 profile string did not accidentally zero the sponsorship weight.
- **V5, hand arithmetic.** (0.8·0.35 + 0.5·0.30 + 0.767·0) × 1 × 0.5 = 0.43 × 0.5 = **0.215**, the same as the scorer.
- **V6, sensitivity: what would it take to reach "Apply"?** Engine scorer on variants of the Klaviyo role:

  ```text
  fit0.50-tl0.50             0.215   Consider  composite 0.215 in the Consider band [0.2, 0.3)
  fit1.00-tl0.50             0.29    Consider  composite 0.290 in the Consider band [0.2, 0.3)
  fit0.27-tl0.50             0.1805  Skip      composite 0.180 < 0.2 — time is better spent elsewhere
  fit0.50-tl1.00-everify     0.43    Apply     composite 0.430 ≥ 0.3, gates healthy
  fit0.40-tl1.00-everify     0.4     Apply     composite 0.400 ≥ 0.3, gates healthy
  ```

  With one lottery draw, even a perfect fit (1.0) stays at "Consider" (0.29). Confirming E-Verify (3 draws) lifts the same role to "Apply" even at fit 0.4. For a December graduate, the E-Verify lookup matters more than any fit judgment.
- **V7, tests and deliberate breaks:** `node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs`

  ```text
  ✔ parseTitles handles single- and double-quoted Python list items
  ✔ seniority marker splits senior-only sponsors from non-senior evidence
  ✔ parser refuses a file that ends inside a quoted field
  ✔ timeline: Feb-2027 OPT (Dec-2026 graduate), STEM degree — E-Verify unknown vs confirmed
  ✔ timeline: any OPT start inside the 60-day window gives the same draws
  ✔ BREAK: an OPT start more than 60 days after program end halts (the May-2027 input error)
  ✔ BREAK: timeline gate closes when authorization has run out
  ✔ fixture run: commute filter, tiers, rejects, parity flag stays off on a small file
  ✔ BREAK: missing column and truncated CSV halt with exit 2
  ✔ BREAK: engine scorer silently treats a missing liveness gate as open — build-roles must refuse first
  ℹ tests 10
  ℹ pass 10
  ℹ fail 0
  ```

## Attestation

- Recipe: revan1010-msis-swe-boston-opt v0.1.0
- By: Revan · 2026-10-20

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `sponsor-triage.mjs` on the real 80 Days CSV | 30,369 rows · 1,557 H-1B · MA 227 · commute 201 · kept 200; tiers 21/13/20/146 | MA count equal to the repo's join audit (227) ✔ |
| standalone parity script on the same CSV | 1,557/1,557 even approvals and denials | some odd counts; **not** what I expected, so it became a finding |
| `npm run score:gates` | 10/10 baseline, 3/3 structural, mutation caught by 5, `RESULT : PASS` | PASS |
| `npm run ats:liveness` on 6 real postings | 4 active, 2 uncertain | all active (they were in that day's API listing); **not** what I saw |
| **Break:** `ats:liveness` on fake ID `pathai/jobs/1000000001` | `uncertain`, not `expired` | `expired`; the checker cannot tell a ghost from a real Greenhouse page |
| **Break:** scorer on a role with the liveness field deleted (`BROKEN-role-without-liveness.json`) | liveness multiplier 1, recommendation **Apply** | Skip or refusal. Engine defect, guarded by `build-roles.mjs` (which refused it in the test) |
| **Break:** triage on `BROKEN-missing-column.csv` and `BROKEN-truncated.csv` | exit 2, `HALT: CSV missing required column(s)` / `row(s) have a different field count` | exit 2 ✔ |
| **Break:** profile `opt_start 2027-05-01` with `program_end 2026-12-23` (the first run's input) | exit 2, `HALT: opt_start 2027-05-01 is 129 days after program_end` | exit 2 ✔ |
| **Break:** profile `as_of 2028-05-15`, `stem_degree false` | exit 2, `HALT: timeline gate closed` | exit 2 ✔ |
| **Break:** same date, `stem_degree true` | run continues; every employer `timeline_factor 0`; STEM scenario 1 draw (March 2029) | gate closed per employer ✔ |
| `build-roles.mjs` with a remote, a no-fit, an uncertain and a no-liveness candidate | all 4 refused with distinct reasons; only `ok` scorable | ✔ |
| `local-wage-adjustment.py` for Boston 15-1252 | exit 2, data directory absent | exit 2, no national fallback ✔ |
| sensitivity sweep through the engine scorer | 1 draw: Consider even at fit 1.0 (0.29); 3 draws: Apply at fit 0.4 (0.40) | E-Verify decides the outcome; confirmed |
| `npm run verify`, `npm run doctor` | both exit 0; doctor: no private paths tracked | ✔ |
| `node scripts/pii-scan.mjs` | 1 finding, in the unmodified `package-lock.json` | 0 findings in my files ✔ (pre-existing finding logged) |

### Did not test

- Any **real fit judgment**: every fit value is a placeholder, so no recommendation here is decision-grade.
- Human gates G2, G4, G5 and G6 were **not cleared** by a named human. G1's human half (checking the OPT start on the EAD) was not done; the program end date (2026-12-23) was confirmed by the student, and the OPT start day is a placeholder.
- E-Verify status of any employer; whether any employer will have made an offer and agreed to register me by March 2027, about four months out (I would be on OPT by then); this year's actual H-1B registration window; cap-gap and unemployment-day rules.
- Whether any company row is the same legal employer as in the government data. The 30-row manual review in the join audit was not filled in.
- Lever/Ashby/Workday boards for Lendbuzz, Overjet, HealthEdge and Pegasystems (not found on Greenhouse/Lever; not pursued).
- Classifier precision beyond one false positive found by eye (no labeled sample yet).
- `npm run doctor`'s TODO-count check does **not** scan `recipes/cases/`. I counted the 9 `[TODO` markers by hand (`grep -o "\[TODO" … | wc -l` → 9).
- The CI contrib gate itself (no GitHub Actions run yet).

### Broke during testing, fixed

- **The first run used a wrong input: OPT from May 2027.** I graduate in December 2026, and post-completion OPT must start within 60 days of the program end, so May 2027 was impossible. It overstated my lottery chances (2 instead of 1; 4 instead of 3) and turned three "Consider" roles into "Apply". Nothing in the mode caught it, because the profile had no program end date. Fix: `program_end` is now required, `sponsor-triage.mjs` halts when `opt_start` falls outside the 60-day window, a test covers it (`BREAK: an OPT start more than 60 days …`), and the whole pipeline was re-run. The first run's outputs are kept, marked superseded, and logged in `logs/runs/2026fa-revan1010-1.md`.
- `npm run verify` failed (`No module named 'yaml'`). Fixed by creating a venv with PyYAML; no repo file changed.
- `fetch-real-postings.py` failed (`No module named 'requests'`). Fixed by installing `scripts/ats/requirements.txt` into the same venv.
- The fixture row for DELTA used `\"` instead of CSV's `""` escaping, so my own parser read it wrong (test expected Likely, got Unknown). The fixture was wrong, not the parser; fixed in `fixtures/sample-mapped.csv`.
- My test expected the timeline gate to halt the run at `as_of 2028-05-15`, but the triage halts only if *every* scenario is closed, and the STEM scenario still had draws left. I kept that design (per-employer gate = 0 when E-Verify is unconfirmed) and split the test into the non-STEM halt plus the per-employer-closed case.
- An inline YAML comment on the `status:` line would mis-parse in `doctor.mjs` (seen on another recipe in its output: `RUNNABLE-LIVE  # DRAFT | …`). I moved it into `last_gate`.
- Pasting the PII-scan output verbatim into this write-up and the run log copied the flagged email address into *my* files, and the scan then flagged 3 findings instead of 1. I redacted the address in both files. The re-run shows only the pre-existing `package-lock.json` finding.
- The report originally said "entry-level" for titles that merely lack a seniority marker. I renamed the field to `non_senior_swe` and changed the wording, because "Software Engineer" with no level is not proof of new-grad hiring.

## Reflection

**What went well.** The parity check was a five-line idea and produced the most important fact in the run: no raw count in this file should be read as "number of H-1B workers". Separating senior-only from non-senior evidence worked as designed and moved 6 of the 22 biggest sponsors out of the top tier. Making the role builder *refuse* rather than default exposed a real engine behavior (missing liveness = live) instead of hiding it. Every number in the reports traces to a record, a declared rule, or a labeled placeholder. Even so, the biggest error in this run was in my own input, not the data: a wrong OPT date silently made every role look better. That is the lesson I would teach from this mode: the gate is only as good as the dates you feed it, so the dates now have a gate of their own.

**What the mode got wrong or missed.**
- One classifier false positive (a Solutions Engineer role counted as SWE). The title regexes are blunt, and `top_job_titles_sponsored` is truncated, so "no SWE title" does not mean "never sponsored a SWE".
- The liveness checker could not confirm Formlabs or Tulip, which are real and listed postings. The board-API check resolved them, but that check is not yet in the mode.
- The scored output is flat: three identical 0.215 scores. That is honest, but it is not useful until the student enters real fit values, and it stays flat on role quality until the engine gives that factor weight. The SDET role's lower Cognitive Pivot score (0.716 vs 0.767) changed nothing.
- "Skip 0%" in the engine report is misleading on its own. 3 of 6 candidates were refused upstream, and 146 of 200 employers never reached the candidate list.
- The funding layer contributes almost nothing. Most strong sponsors show "stale" Form D dates, and public companies (Toast, Klaviyo, Pegasystems) still carry old private-round labels like "Series B" or "Pre-Seed".

**Next steps (concrete).**
1. Replace the placeholder fit values with my own judgments for the 3 scorable roles, then re-run (`run-mode.sh`).
2. **First priority:** look up E-Verify for Klaviyo and PathAI, log the dated lookups, set `everify_overrides`, and re-run. The timeline factor should move 0.5 → 1.0 and the composite 0.215 → 0.43 (Consider → Apply). Separately, ask these employers now whether they would register a candidate in March 2027. That is my only draw without the STEM extension.
3. Build the board-API liveness cross-check ([TODO: DEV] #5) so `uncertain` stops blocking real postings.
4. Hand-label 50 sponsored titles to measure classifier precision ([TODO: DEV] #6).
5. Ask Northeastern's international student office what evidence supports an MSIS → 15-1252 petition ([TODO: DEFINE] #8), and log the answer as gate G5.
6. Fetch FY-stamped DOL LCA data ([TODO: DATA SOURCE] #2) to test the doubling hypothesis and get per-SOC Boston counts.
