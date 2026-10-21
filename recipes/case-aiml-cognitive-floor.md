---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "live-run, 2026-10-21, assignments/submissions/deepakkts/RUN_LOG-entry.md (machine gates G0 to G3 ran; human gate G4 cleared and logged there)"
attestation: null
recipe_version: 0.1.0
---

# case-aiml-cognitive-floor: AI/ML and data roles, gated on liveness and timeline, scored on the occupation behind the title

## Executive summary

This document is an operating recipe for an international student on an F-1
visa who is finishing a degree and applying for early-career AI, machine
learning and data jobs that start right after graduation. It answers one
question per posting. Is the job still open, does the start date work with the
work-permit timeline, and does the occupation behind the job title sit above a
chosen floor on a reasoning-and-judgment score built from federal occupational
data? Read it before spending application effort on a list of AI/ML postings.
On its first real run (12 postings at 7 employers on 2026-10-21) it skipped one
closed posting, and it put all four data-scientist postings on hold because the
federal data in this repository has no ratings for the Data Scientists
occupation. It refuses to guess a score in that case.

## Mode Design Quality

### Specific to a real domain or career situation: Purpose

Use this mode when all of the following hold:

- You are an F-1 student whose program ends within the next few months and
  whose first job will run on post-completion OPT.
- You are targeting early-career AI/ML engineer, applied scientist, data
  scientist or data engineer roles.
- The employers post on Greenhouse boards (`boards-api.greenhouse.io`).
- You want to rank where to spend effort by the reasoning-and-judgment demand
  of the underlying occupation, on the thesis that this work is harder for AI
  to substitute.

The workflow, as the student meets it:

1. Discover postings at employers with sponsorship history (`npm run ats:scan -- --dry-run`).
2. For each posting, list the SOC codes the employer could plausibly file
   under. A posting never states its SOC code, so this list is a judgment and is
   labelled as one.
3. Run the mode. It checks liveness, checks the timeline, looks each SOC code up
   exactly, and reports sponsorship history beside the result.
4. Read the human report. Act only on rows whose gates are open and whose SOC
   evidence exists, after a named human clears gate G4.

Do not use it for non-Greenhouse boards, for roles whose SOC candidates you
cannot name, or as a substitute for an offer-stage SOC and wage check.

### Data sources, commands, gates, and output formats are named precisely: Source Inventory

Every path and command below was confirmed present in this checkout on
2026-10-21 (branch base 015843d).

| Source | Exact path or command | What the mode uses | Confirmation |
|---|---|---|---|
| BLS/O*NET compact table | `data/bls/compact/soc_occupation_compact.csv` | `onet_soc_code`, `bls_soc_code`, `title`, `alternate_titles_sample`, `cognitive_pivot_score`, and the 9 fields averaged into it: `ability_originality_lv`, `ability_problem_sensitivity_lv`, `ability_deductive_reasoning_lv`, `ability_inductive_reasoning_lv`, `skill_critical_thinking_lv`, `skill_judgment_decision_making_lv`, `skill_complex_problem_solving_lv`, `skill_systems_analysis_lv`, `skill_systems_evaluation_lv` | 1016 rows, 894 with a score; sha256 `bac5acf77ca2d25268c75b3706084f7f67bcc0c6e3cc68cd03e0ebd2598343d1` |
| Score formula | `scripts/bls/extract-soc-occupation-table.py`, function `cognitive_pivot_score` | mean of the 9 fields above, `round(..., 3)` | read in source |
| 80 Days sponsorship table | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate` | 30369 rows, 1557 with a non-empty `Total Approvals`; sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` |
| Closed-posting patterns | `scripts/ats/liveness-core.mjs`, export `classifyLiveness` | imported; only its `http_gone`, `expired_body` and `expired_url` outcomes are used | imported and exercised by the offline harness |
| HTTP helper | `scripts/ats/providers/_http.mjs`, export `fetchJson` | imported, called with `redirect: 'error'` | imported |
| Greenhouse job endpoint | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` | HTTP status, `id`, `title`, `absolute_url`, `content`, `application_deadline` | HTTP 200 for 11 jobs, 404 for 1, on 2026-10-21 |
| Greenhouse board listing | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs` | set of listed job ids | HTTP 200 for 7 boards on 2026-10-21 |
| Discovery scan | `REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/targets/portals.yml npm run ats:scan -- --dry-run` | candidate postings | 11 companies scanned, 1179 jobs, 18 kept, no files written |
| Rendered-page liveness | `npm run ats:liveness -- --file <urls.txt>` | independent second opinion on the same URLs | 11 active, 1 expired, 0 uncertain, exit 1 |
| The mode | `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run` | the whole executed path, one command, Node standard library only | exit 0 from a clean clone with no `node_modules` |
| Offline check | `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs` | fixture run with `fetch` disabled, lookups, gates, break attempt | `32/32 checks passed`, exit 0 |

The mode never reads `private/`, `data/ats/` or `search/`.

### Proposed additions

None. This version uses only data and commands present in this checkout.

### Phase gates

Liveness and visa timeline are gates. They never add to a score. A closed gate
ends the row with a skip, whatever the occupation scores.

| Gate | Testable condition to open | When it does not open |
|---|---|---|
| G0 input | Scenario JSON parses; every input carries `source` in {`record`, `model-judgment`, `your-input`}; both CSVs exist with the required columns; `--out-dir` is given and, inside the repo, sits under `assignments/submissions/deepakkts/` | exit 2, nothing written |
| G1 liveness (record) | Job endpoint returns HTTP 200 with the requested id, AND the board listing contains that id, AND the page text matches no hard-closed pattern, AND `application_deadline` is null or on or after the as-of date | HTTP 404/410, closed text or passed deadline: `SKIP_GATED_LIVENESS`. HTTP 200 but absent from listing: `HOLD_LIVENESS_UNCERTAIN`. Network or other HTTP failure: `STOP_LIVENESS_CHECK_FAILED`, and no liveness value is assigned |
| G2 visa timeline (your-input and model-judgment months) | `program_completion_month` < `target_start_month`, AND `ead_expected_month` <= `target_start_month`, AND `target_start_month` <= `latest_opt_start_month` | any month missing: `HOLD_TIMELINE_INPUT`. Any check false: `SKIP_GATED_TIMELINE` |
| G3 SOC evidence (record) | every candidate code matches `NN-NNNN.NN`, exists in the compact table, has 9 of 9 rating fields filled, and its stored score equals the mean of those fields within the extractor's 3-decimal rounding | blank or partial ratings: `HOLD_MISSING_EVIDENCE`. Unknown code, bare BLS code or score mismatch: `STOP_SOC_INPUT` |
| G4 human (named person) | before any application effort is spent on a `CLEARS_FLOOR`, `BELOW_FLOOR` or `SOC_SENSITIVE` row, a named human confirms the SOC candidate list and the floor percentile, recorded in the RUN_LOG entry as `G4 cleared by <name> on <date>` | the row stays advisory. The mode cannot clear this gate itself |

### The boundary between verified and inferred is clearly drawn: What it can and cannot verify

What this class of mode can establish from records:

- Whether a Greenhouse posting answers on its job endpoint and appears in its
  board listing at the moment of the check, and the HTTP status it returned.
- Whether the posting text contains one of the repository's hard-closed phrases,
  and whether its own `application_deadline` has passed.
- Whether a given O*NET-SOC detailed code exists in this checkout's BLS/O*NET
  table, whether its rating fields are filled, what its stored
  `cognitive_pivot_score` is, that the score equals the mean of its fields, and
  where it ranks among the 894 scored occupations.
- Whether a company name, or the same name with legal suffixes stripped, has a
  row in the 80 Days table, and the approval and denial counts that row holds.
  It can also tell a recorded zero apart from a blank field and from an absent
  row.
- Whether the labelled timeline months are consistent with each other.

What this class of mode cannot establish:

- Which SOC code the employer will file under. Postings do not state it, so
  every SOC candidate list is a judgment.
- Anything about an occupation the table leaves unrated. In this checkout that
  includes 15-2051.00 Data Scientists, the most common AI/data title.
- Whether `cognitive_pivot_score` measures resistance to AI substitution. It is
  the repository's average of 9 O*NET level ratings, a proxy.
- Whether a listed posting is a real, funded opening. An always-open
  "expression of interest" posting passes G1.
- When USCIS will issue the EAD, or the exact OPT start-date window. Both come
  in as inputs.
- Whether a company's sponsorship history applies to this role. The 80 Days
  table has no SOC column, and its rows are company level.
- Whether a company missing from the 80 Days table sponsors. Absence is missing
  evidence.
- Whether a display name and a legal name are the same company (for example
  Instacart and MAPLEBEAR INC), unless a human pins the record name.
- Candidate fit, offer wage, or anything on a board other than Greenhouse.

### Output Contract

Two separate artifacts, both written to `--out-dir`. One artifact cannot serve
both readers.

**Agent log: `run-log.json`.** Reader: an agent or grader replaying the run.
Decision enabled: whether each row's disposition follows from its recorded
inputs. Top-level fields:

| Field | Content |
|---|---|
| `run` | `started_at`, `as_of`, `mode` (`live` or `offline (...)`), `command`, `scenario_file` |
| `sources` | for each CSV: `file`, `sha256`, `row_count` |
| `scenario` | `scenario_id`, `profile` (labelled), `note` |
| `floor` | `percentile` (labelled), `cutoff`, `rank`, `of`, `scored_occupations`, `unscored_occupations` |
| `timeline` | `gate`, `checks`, `inputs` (labelled), `reason` |
| `roles[]` | `role_id`, `company`, `board`, `job_id`, `soc_candidates` (labelled), `liveness` (`gate`, `code`, `http_status`, `checked_url`, `checked_at`, `posting`, `reason`), `soc[]` (`code`, `status`, `score`, `components`, `rated_components`, `recomputed_mean`, `alt_title_sample_hits`, `siblings_not_used`, `reason`), `sponsorship` (`status`, `match`, `approvals`, `denials`, `approval_rate`, `rows`, `reason`), `disposition`, `disposition_reason` |
| `stops`, `counts` | stop messages; dispositions tallied |

**Human report: `report.md`.** Reader: the student deciding where to apply.
Decision enabled: which postings get effort this week, and which need a human
SOC or timeline decision first. Sections: Executive summary; Run record (time,
command, source hashes, floor cutoff, timeline gate and inputs with labels);
Per-role results with columns `Role`, `Liveness gate [record]`,
`SOC candidates [model-judgment] → score [record]`,
`Sponsorship history [record]`, `Disposition`; Why each disposition; Stop
conditions that fired; Labels.

Exit codes: 0 when the run completes; 1 when it completes and a stop condition
fired; 2 on a usage, scenario or schema error, with nothing written.

### Stop conditions

The mode refuses to produce a score, and says why, when:

- A SOC candidate is a bare 6-digit BLS code (`15-2051`). Choosing among the
  sibling O*NET rows is a judgment the mode will not make. It lists the siblings
  and uses none.
- A SOC candidate is absent from the compact table.
- A code's stored score disagrees with the mean of its 9 fields.
- A code has blank ratings (score withheld, row held) or only part of its 9
  fields (row held). A blank is never read as zero, and a sibling's score is
  never borrowed.
- The liveness check fails for network or HTTP reasons. The failure is recorded
  and no liveness value is assigned.
- More than one 80 Days row matches a name with different sponsorship values.
  No sponsorship value is reported.
- A timeline month is missing. The gate holds and does not clear itself.
- The scenario or a data file fails validation, or `--out-dir` is missing or
  points into the repo outside the namespace. Exit 2, nothing written.

### The mode ran

The live run from the repository root on 2026-10-21 (run log `started_at`
`2026-10-21T19:32:31.191Z`) printed:

```
cognitive-floor: 12 roles · floor P75 cutoff 3.749 · timeline gate open
  counts: CLEARS_FLOOR 7 · HOLD_MISSING_EVIDENCE 4 · SKIP_GATED_LIVENESS 1
```

and exited 0. The same command in a fresh clone with no `node_modules` gave the
same 12 dispositions and exit 0.

### RUN_LOG template

```markdown
## <YYYY-MM-DD> · case-aiml-cognitive-floor v<recipe_version>

- Recipe: recipes/case-aiml-cognitive-floor.md v<recipe_version>
- Command: node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir <out-dir> [--scenario <scenario.json>]
- Mode: <live | offline>
- Inputs: <scenario_id>; <n> roles at <n> employers; floor percentile <value> [<source>]; timeline months <completion>/<start>/<ead>/<latest> [<sources>]
- Sources: soc_occupation_compact.csv sha256 <hash>; mapped_student_employment_targets_v3.csv sha256 <hash>
- Outputs: <out-dir>/run-log.json; <out-dir>/report.md
- Result: exit <code>; <disposition counts>
- Stops fired: <none | list>
- G4 human gate: <cleared by <name> on <date> | not cleared>
- Open issues: <list>
```

### Out of scope for this version

- It reads Greenhouse boards only. Postings on Lever, Ashby, Workday or company
  sites outside Greenhouse cannot be checked.
- It cannot assign SOC codes from a title. The checkout holds only an 8-title
  sample of O*NET alternate titles per code, so a title match is weak support and
  a miss is no evidence.
- It cannot see posting-level start dates, so the timeline gate applies to the
  profile as a whole.
- Its result does not feed the repository's Chapter 11 composite scorer, which
  sets the `role_quality` weight to 0.0. The floor is a separate gate.
- It resolves company names by legal-suffix stripping only. Typo variants in the
  80 Days table (for example PATHAI INC and PATHRAI INC) are left unmerged.
- It cannot see employment trends. The compact table carries 2024 OEWS levels
  only.
