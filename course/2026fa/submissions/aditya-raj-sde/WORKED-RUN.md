# Worked run — Sponsor & Posting Reality Check (sample)

## Executive summary

This is the record of one real run of the prototype on the public sample: nine job openings for a
fictional engineering candidate, eight of them invented test postings. It shows the exact commands,
their real output, and which values are facts from data versus rule-based judgments or stated
assumptions. Read it to see what the program decided and how far each decision can be trusted.

- **Result:** two openings would be skipped (one posting is closed; one refuses sponsorship). One
  needs a person to read an apparent sponsorship offer. Six end at "look for sponsorship evidence
  about this opening", including the one real posting, from a company with a long sponsorship
  record.
- **Hypothetical scores:** two hypothetical scores are shown separately and change no decision.
- **Not yet in this record:** the student's own hand check, his break attempt, and his attestation.
  Each is marked pending below.

## Run record

- **Date:** 2026-10-03, about 19:06 EDT.
- **Run by:** Claude (Claude Code), on Aditya's instruction.
- **Recipe:** `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.md`, version 0.2.0 (status
  SPECIFIED).

### Inputs

- `scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/fixtures/sample-run.json`, for the
  fictional persona **Aarav Patel** (`search/examples/aarav-patel/profile.yml`).
- 8 of 9 postings are synthetic (on `example.com`). The one real posting is Databricks job
  8635225002. Its liveness comes from the recorded observation in evidence 19
  (2026-10-03 17:48 EDT); its posting text about sponsorship was **not captured**.
- Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`,
  sha256 `eccdee2addf472b1…` (full hash in `runs/sample/reality-check.json`).

## Commands and real output

### 1. Hypothesis probe

The probe records what the maintained scorer (F1a) and liveness classifier (F2(a)) actually do; see
evidence 29.

```text
$ node scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/hypothesis-probe.mjs
F1a — maintained scorer (CHANGE-BRIEF §9, U1.2)
  $ node scripts/score/role-scorer.mjs <tmp>/roles.json --out-dir <tmp>
  | ✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
  |   ../../../..<tmp>/role-scores.json  +  ../../../..<tmp>/role-scores.md
  role          predicted (composite, label)   observed (composite, label)   result
  f1-fit-0.7    0.21   Consider               0.21   Consider              MATCHES
      scorer reason: composite 0.210 in the Consider band [0.2, 0.3)
  f1-fit-0.9    0.27   Consider               0.27   Consider              MATCHES
      scorer reason: composite 0.270 in the Consider band [0.2, 0.3)
  f1-fit-1.0    0.3    Apply                  0.3    Apply                 MATCHES
      scorer reason: composite 0.300 ≥ 0.3, gates healthy

F2(a) — maintained classifyLiveness (CHANGE-BRIEF U1.3)
  id    bodyText  applyControls        predicted                        observed                         result
  F2-0  474       ["Apply for this job"] active/apply_control_visible     active/apply_control_visible     MATCHES
      classifier reason: visible apply control detected
  F2-1  525       []                   expired/expired_body             expired/expired_body             MATCHES
      classifier reason: pattern matched: no longer accepting applications
  F2-2  527       ["Apply"]            active/apply_control_visible     active/apply_control_visible     MATCHES
      classifier reason: visible apply control detected
  F2-3  527       []                   uncertain/no_apply_control       uncertain/no_apply_control       MATCHES
      classifier reason: content present but no visible apply control found
  F2-4  52        []                   expired/insufficient_content     expired/insufficient_content     MATCHES
      classifier reason: insufficient content — likely nav/footer only
  F2-5  497       ["Apply for this job"] active/apply_control_visible     active/apply_control_visible     MATCHES
      classifier reason: visible apply control detected

Summary: 0 prediction(s) differ from observed behavior. A difference is recorded, not fixed.
[exit=0]
```

### 2. Offline tests (evidence 30b)

```text
$ node --test scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/reality-check.test.mjs
ok 1 - no network: source imports nothing that can reach the network; fetch never called
ok 2 - maintained scorer is reused through its CLI, not copied
ok 3 - G1: a timeline mislabeled as "record" fails the run with exit 2 and writes nothing
ok 4 - G1: an out-dir over tracked repository files is refused (exit 2)
ok 5 - G1: missing evidence fields are named, not defaulted
ok 6 - G1: a recorded liveness labeled "record" must point at an existing evidence file
ok 7 - F1b: every explicit refusal stops at G3 with skip-application, even with fit 1.0 and a scenario vote
ok 8 - F2(b) F2-0: open posting passes G2
ok 9 - F2(b) F2-1: recognized closure phrase → skip-application
ok 10 - F2(b) F2-2: "we've filled this role" with a body Apply link is NOT treated as live → human review
ok 11 - F2(b) F2-3: uncertain → human review, no application decision
ok 12 - F2(b) F2-4: thin page → skip-application, reason says thin content not explicit closure
ok 13 - F2(b) F2-5: "closed-loop" false positive costs a human review, never an automatic skip
ok 14 - F3: each company state is reported by its own name; blank is not zero; zero is not refusal; no merges; no p
ok 15 - F3: matching strips legal suffixes but never fuzzes
ok 16 - vacancy rule: refusal / offer / conditional / contradictory / silent / not-captured
ok 17 - T-timing: a missing timeline blocks the role and never reaches the scorer; a sample timeline is labeled unverified
ok 18 - sample run: two outputs, every value labeled, scenario scores separate from decisions
# tests 18
# pass 18
# fail 0
[exit=0]
```

### 3. The sample run (evidence 31b; the first run's report defect is preserved in evidence 31)

```text
$ node scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/reality-check.mjs --input scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/fixtures/sample-run.json --out-dir course/2026fa/submissions/aditya-raj-sde/runs/sample
✓ 9 openings → seek-vacancy-sponsorship-evidence 6 · skip-application 2 · review-offer-excerpt 1
  skip fraction 2/9 (sample of 9; not a general rate); timing verified for 0; scenario (hypothetical) scores: 2
  course/2026fa/submissions/aditya-raj-sde/runs/sample/reality-check.json  +  course/2026fa/submissions/aditya-raj-sde/runs/sample/reality-check.md
[exit=0]
```

### Decision table, as written in `runs/sample/reality-check.md`

| Opening | Company evidence [record] | Posting liveness | Sponsorship wording in this posting [model-judgment] | Next step | Why |
|---|---|---|---|---|---|
| Databricks — Software Engineer, Web Products | matched-with-record (approvals 1640, denials 8) | active [record] | not-captured | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (not-captured); provisional: timing not verified |
| **SYNTHETIC** Axia Technologies — Backend Engineer (synthetic posting) | ambiguous-employer | active [record] | not-captured | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (not-captured); provisional: timing not verified |
| **SYNTHETIC** Uplift Labs — Platform Engineer (synthetic posting) | matched-zero-approvals (approvals 0, denials 4) | active [record] | not-captured | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (not-captured); provisional: timing not verified |
| **SYNTHETIC** Snowflake Computing — Distributed Systems Engineer (synthetic posting) | matched-blank-fields | active [record] | not-captured | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (not-captured); provisional: timing not verified |
| **SYNTHETIC** Example Platform Labs — Backend Engineer (fictional employer) | no-employer-match | active [record] | ambiguous-or-conditional | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (ambiguous-or-conditional); provisional: timing not verified |
| **SYNTHETIC** Example Robotics — Platform Engineer (fictional employer) | no-employer-match | active [record] | explicit-refusal | **skip-application** | the posting refuses sponsorship: "Applicants must be able to work in the United States without the need for visa sponsorship now or in the future." |
| **SYNTHETIC** Example Data Systems — Backend Engineer (fictional employer) | no-employer-match | active [record] | apparent-offer | **review-offer-excerpt** | offer-like wording to review (not a guarantee): "Visa sponsorship is available for this role."; provisional: timing not verified |
| **SYNTHETIC** Example Analytics — Platform Engineer (fictional employer) | no-employer-match | active [record] | silent | **seek-vacancy-sponsorship-evidence** | no usable vacancy-level sponsorship evidence (silent); provisional: timing not verified |
| **SYNTHETIC** Example Cloud — Backend Engineer (fictional employer) | no-employer-match | expired [record] | not-captured | **skip-application** | posting closed (expired_body): pattern matched: no longer accepting applications |

### Hypothetical scenario table, as written in `runs/sample/reality-check.md`

These come from the repository's maintained scorer, run on an **uncalibrated demonstration sponsorship vote** supplied in the input. They show what the scorer would say *if* that assumption were true. They never replace the next step above and do not establish eligibility. Timing inside them is a sample assumption (provisional: timing not verified).

| Opening | Scenario label (scorer) | Composite | Next step (unchanged) | Assumption |
|---|---|---|---|---|
| **SYNTHETIC** Example Data Systems — Backend Engineer (fictional employer) | Consider (provisional: timing not verified) | 0.42 | **review-offer-excerpt** | SCENARIO ONLY, uncalibrated: shows the maintained scorer's output if a human had recorded vacancy-level sponsorship evidence for this fictional posting. Not an estimate that any employer will sponsor. |
| **SYNTHETIC** Example Analytics — Platform Engineer (fictional employer) | Consider (provisional: timing not verified) | 0.42 | **seek-vacancy-sponsorship-evidence** | SCENARIO ONLY, uncalibrated: exercises the adopted rule that a scenario vote never clears awaiting-sponsorship-evidence when the posting is silent. Not an estimate that any employer will sponsor. |

## Verified vs. inferred, line by line

| Value in the output | Label | What establishes it | Status |
|---|---|---|---|
| Databricks → `DATABRICKS INC`, approvals 1640, denials 8, rate 99.51 | `record` | the sponsorship CSV row, matched by the defined rule | read by the program; evidence 27 shows the same row; **Aditya's independent hand check pending** |
| Databricks counts mean sponsorship for job 8635225002 | — | **nothing**; the output explicitly says these counts are not evidence about this opening | not claimed |
| Databricks posting `active` | `record` | the recorded liveness observation at 17:48 EDT (evidence 19: the repo command plus redirect trace) | true at that time only; inferred-open now? **no** |
| Axia Technologies `ambiguous-employer` (INC blank / LLC 2 approvals) | `record` | two CSV rows share the stem; not merged | verified by evidence 27 |
| Uplift Labs `matched-zero-approvals` (0 / 4) | `record` | CSV row | zero recorded approvals; **not** a refusal |
| Snowflake Computing `matched-blank-fields` | `record` | CSV row with blank counts | blank kept as blank, not 0 |
| `Example …` employers `no-employer-match` | `record` | no CSV row with that stem; evidence 27 found no CSV name containing "example" | verified |
| Liveness `active` / `expired` on synthetic postings | `record` | the **maintained classifier's output** on an **invented** page snapshot | the label means "classifier output", not "a real page was observed" (a labeling subtlety, noted under Reflection) |
| `explicit-refusal`, `apparent-offer`, `ambiguous-or-conditional`, `silent`, `not-captured` | `model-judgment` | the recipe's text rule applied to the supplied sentence (excerpt shown) | a rule's judgment, not a record |
| Fit 0.7 / 0.9 and timeline factor 1 | `your-input` | fixture sample values with written notes | assumptions; timing verified for **0** of 9 |
| Scenario "Consider (provisional: timing not verified)", composite 0.42 | maintained scorer on `your-input` vote p 0.6, tier Likely | `0.6·0.35 + 0.7·0.30 = 0.42`; tier Likely is a soft tier, so the scorer demotes Apply → Consider (evidence 31b, `runs/sample/role-scores.json`) | **hypothetical**; changes no next step |
| Skip fraction 2/9 | derived | counts of `skip-application` in this sample | describes this designed sample only, not a rate |

## Verification

**Done by Claude:**

- 18 offline tests pass (evidence 30, 30b).
- The probe recorded all 9 predictions matching (evidence 29). The predictions were written after
  reading the source, so this confirms that reading more than it tests foresight.
- Conformance, `npm run verify` (with the venv), and doctor pass (evidence 32).
- Every fixture company was checked against the CSV (evidence 27).
- Claude read the first report and found a rendering defect: the sample qualifier was printed twice.
  The defect line is preserved in evidence 31, then fixed and re-run in 31b.

**Pending Aditya** (steps provided separately; results recorded only after he reports them):

- [ ] a hand cross-check of one report value against the source CSV;
- [ ] a predicted, then executed, deliberate break attempt;
- [ ] a reproduction from a clean checkout of the branch.

## Reflection

**Claude's observations about the work:**

- **What worked:**
  - The protective gates behaved as specified on every fixture.
  - The maintained classifier's real limitation (F2-2: "we've filled this role" plus an in-body Apply
    link reads as `active`) is caught by the closure-wording check and routed to a person.
- **What the run got wrong or missed:**
  1. The first report printed the sample qualifier twice (fixed).
  2. Synthetic snapshots carry the label `record`, because the value is the classifier's real
     output, but a reader could take `record` to mean a real page was seen. Only the SYNTHETIC
     banner prevents that.
  3. The one real posting ends at "seek evidence" only because its sponsorship text was never
     captured. The prototype cannot fetch it, by design.
  4. The skip fraction (2/9) is below the engine's "healthy run skips at least half" heuristic. That
     is because unknown evidence becomes "seek evidence", not "skip". Whether that is right for a
     real search is a judgment for Aditya.
- **One concrete next improvement (suggestion):** capture the sponsorship-relevant posting text
  during the live liveness check, so that real postings can reach a vacancy-level state instead of
  `not-captured`.

**Aditya's reflection:** *pending; to be written by Aditya.*

## Attestation

*Draft structure only. Every row below is to be filled with Aditya's own observations. Claude will
not complete it.*

```markdown
## Attestation
- Recipe: sponsor-live-jan2027 v0.2.0
- By: Aditya Raj · <date>   ← pending

### Tested
| Ran | Saw | Expected |
|---|---|---|
| <hand cross-check of one value>          | <pending> | <pending> |
| <deliberate break attempt>               | <pending> | <pending> |
| <clean-checkout reproduction>            | <pending> | <pending> |

### Did not test
- <pending — Aditya's honest list>

### Broke during testing, fixed
- Report repeated the sample qualifier (evidence 31 → fixed, 31b). [Claude's run; Aditya may add his own]
```
