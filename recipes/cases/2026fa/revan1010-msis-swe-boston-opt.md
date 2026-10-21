---
status: DRAFT
todos_open: 9
last_gate: "real run 2026-10-20 — machine gates G0/G1/G3 exercised; human gates G2/G4/G5/G6 NOT cleared; logs/runs/2026fa-revan1010-1.md"
attestation: null
recipe_version: 0.1.0
---

# MSIS → Software Engineer, Boston, F-1 OPT from February 2027

## Executive summary

**What this is:** a step-by-step operating recipe for one specific person: an international Information Systems master's student in Boston who wants a software engineering job and has limited time on a student work permit. It finds nearby employers that have actually sponsored *junior* software engineers for work visas. It works out how many visa lottery chances the student's dates allow, checks that the job postings are real, and only then scores them.

**Why read it:** the obvious signal, "this company sponsors hundreds of visas", misleads this student. Some of the largest Boston sponsors have only sponsored senior software titles. The visa lottery count also depends on a fact about the employer that no public dataset in this project holds. This recipe makes those traps visible before applications go out.

**What it found or decided (first real run, 2026-10-20):** 200 commutable Massachusetts employers have a sponsorship record. 21 show strong evidence for non-senior software titles. 20 have sponsored *only* senior software titles, including 6 of the 22 largest sponsors. Every sponsorship count in the source file is an even number, so the counts were very likely doubled upstream. The run compares employers by rank and rate, never by raw count. Of 6 real postings checked, 3 were scorable. 2 could not be confirmed live and were refused rather than assumed live. Graduating in December 2026 with OPT from February 2027 leaves **one** visa lottery chance (March 2027) unless the employer is confirmed to use E-Verify, which raises it to three. With one chance, no role reaches "Apply" even at perfect fit. The student's own fit judgments are still placeholders, so no recommendation from this run is decision-grade yet.

**Handoff condition (done when):** for a named set of postings, the student holds a human report in which every posting is either refused with a stated reason or scored with a fully sourced trace. Each human gate below must carry a logged clearance (who, what, when).

## Purpose

Use this recipe when **all** of these are true:

- You are on F-1 and graduating in **December 2026** from a STEM-designated MS in Information Systems (or a similar non-CS-titled technical master's), with post-completion OPT starting in **February 2027**. It must start within 60 days of the program end date, and the run halts otherwise.
- You are targeting **software developer** roles (SOC 15-1252; QA/SDET roles are SOC 15-1253 and are tracked separately) in the **Boston area**, without a car.
- You need H-1B sponsorship, and you want to spend applications only where there is record evidence that the employer sponsors people at *your* level.

Do **not** use it for: senior or experienced-hire searches (the seniority filter will hide your best targets), roles outside Massachusetts, or anyone not needing sponsorship (the sponsorship weight drops to 0 and most of this recipe is moot).

It differs from the earlier generic SWE case drafts (`recipes/cases/2026su/case-backend-swe-opt-triage.md`, `case-fullstack-swe-sponsor-triage.md`) in three ways. It separates entry-level from senior-only sponsorship evidence. It audits the count field before using it. And it carries the Information Systems → software developer degree question as an explicit human gate.

## Source Inventory

| Source | Layer | Exact path / command | What it is | Human check |
|---|---|---|---|---|
| 80 Days mapped CSV | 80 Days | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`) | 30,369 Form D companies; 1,557 carry employer-level H-1B aggregates (approvals, denials, rate, median salary, top sponsored titles) | Confirm the hash matches before comparing runs |
| Join validation audit | 80 Days | `python3 scripts/sec/validate-h1b-join-sample.py <csv>` | Repo's own audit of the H-1B join: no FEIN, no match score, no fiscal year | Read "Local Finding" before trusting any count |
| SOC compact table | Cognitive Pivot | `data/bls/compact/soc_occupation_compact.csv` | O*NET 30.2 × OEWS **national** May 2024; `cognitive_pivot_score` = mean of 9 O*NET reasoning/judgment/systems levels | National wages only; no Boston figure |
| Board fetcher | Job-Ops | `python3 scripts/ats/fetch-real-postings.py --greenhouse <names…> --lever <names…> -o private/real-postings/<file>.json` | Pulls the public Greenhouse/Lever board for each employer | Board slug may not be the same legal entity; check locations |
| Liveness checker | Job-Ops | `npm run ats:liveness -- --file <urls.txt>` | Playwright: `active` / `expired` / `uncertain` per URL | `uncertain` is not a pass |
| Engine scorer | Ch.11 | `npm run score -- <roles.json> --profile <p.json> --out-dir <dir>` | `(Σ p·w) × liveness × timeline`; Apply ≥ 0.30, Consider ≥ 0.20 | Read the per-term trace |
| Gate harness | Ch.11 | `npm run score:gates` | 10 cases + mutation control proving gates multiply | Must print `RESULT : PASS` |
| Local wage adjuster | Cognitive Pivot | `npm run bls:local-wage -- --metro "<AREA_TITLE>" --soc 15-1252` | Metro OEWS × BEA RPP, when the data exists | **Not runnable here**: exits 2, data absent |
| **This mode's tools** | all | `scripts/contrib/2026fa/revan1010-boston-swe-triage/` — `sponsor-triage.mjs`, `build-roles.mjs`, `lib.mjs`, `run-mode.sh`, `triage.test.mjs` | Deterministic triage, timeline gate, gate-enforcing role builder | `node --test …/triage.test.mjs` → 10/10 |

### Rules this mode declares (closed DEFINEs — value plus one sentence of reasoning)

- **DEFINE: commute set — closed.** 30 MA municipalities in `profile.example.json` (Boston, Cambridge, Somerville, Waltham, Burlington, Lowell …). Reason: these are reachable from Northeastern in about 60 minutes by MBTA subway, bus or commuter rail with no car.
- **DEFINE: SWE title — closed.** Regex on `software|developer|full-stack|back-end|front-end|sde|swe|platform engineer|site reliability|devops`, excluding `qa|quality assurance|test|sdet`. Reason: this keeps 15-1252 and 15-1253 apart, because they differ in pay and in Cognitive Pivot score.
- **DEFINE: seniority marker — closed.** `senior|sr|staff|principal|lead|manager|director|head|architect|vp|chief|distinguished|iii|iv|3|4`. Reason: a new-grad petition looks like a "Software Engineer / I / II" hire, so evidence limited to senior titles is not evidence for this student.
- **DEFINE: sponsorship tier → scorer p — closed.** Proven 0.8 (non-senior SWE title, raw approvals ≥ 10, rate ≥ 90%); Likely 0.6 (non-senior SWE title below that bar); Possible 0.4 (senior-only SWE titles); Unknown 0.2 (no SWE title in the list). Reason: these values order the evidence. They are declared rules, not measured probabilities, and the report says so.
- **DEFINE: timeline factor — closed.** H-1B cap registrations reachable before work authorization ends: 0 → 0.0 (gate closed), 1 → 0.5, 2 → 0.75, 3 or more → 1.0. A registration counts if its approximate date (March 1) falls between `as_of` and the authorization end. Reason: each registration is one lottery draw, and below 0.6 the engine demotes Apply to Consider, which matches this student's position: one draw (March 2027) unless E-Verify is confirmed.
- **DEFINE: OPT start window — closed.** `opt_start` must fall 0–60 days after `program_end`, or the run halts (exit 2). Reason: post-completion OPT must begin within the 60-day grace period. The first draft of this mode ran with an impossible May 2027 start, and this check now refuses that input.
- **DEFINE: STEM extension — closed.** Counted **only** if `stem_degree=true` **and** the employer's E-Verify enrollment is confirmed. Otherwise the conservative 12-month OPT case is used. Reason: the 24-month STEM extension requires an E-Verify employer, and no repo dataset records E-Verify.

## Proposed additions (not built; output of these is *proposed*, never reported as run)

1. **[TODO: DATA SOURCE]** DOL OFLC prevailing-wage levels (Level I–IV) for SOC 15-1252 in the Boston-Cambridge-Nashua area, at `data/dol/oflc/` with origin and date. *Why it belongs:* an offer's wage level decides how strong a petition is and, under a wage-weighted selection process, may change lottery odds. Today the mode cannot say whether a $95k offer is Level I or II. *Policy note (unverified, from the author's background knowledge, not repo data):* the student must confirm the current H-1B selection rule each season.
2. **[TODO: DATA SOURCE]** Raw DOL LCA disclosure files, stamped by fiscal year, with `SOC_CODE`, `WORKSITE_CITY`, `WAGE_LEVEL` and `EMPLOYER_FEIN`, at `data/lca/raw/`. *Why:* this would give per-employer counts for SOC 15-1252 at Boston worksites by year. It would replace the yearless, possibly doubled aggregates, and it is the input `scripts/sec/entity-resolution.py` already expects.
3. **[TODO: DATA SOURCE]** Metro OEWS (Boston-Cambridge-Nashua, AREA 71650) plus BEA RPP files at `data/bls/local-wage/`. *Why:* the stored script `scripts/bls/local-wage-adjustment.py` already exists and would give a Boston wage band. It exits 2 today because its data is absent.
4. **[TODO: DATA SOURCE]** A dated E-Verify employer-search snapshot for short-listed employers. *Why:* this one fact moves the timeline factor from 0.5 (1 draw) to 1.0 (3 draws) for this student. It is the difference between "Consider" and "Apply" for every role in the first run.
5. **[TODO: DEV]** Board-API membership liveness cross-check: a posting counts as "listed" if its job ID appears in that day's Greenhouse/Lever API snapshot. *Why:* the browser checker returned `uncertain` for 2 real postings and for 1 fake job ID alike, and the API snapshot told them apart (see the worked run). Handoff condition: it resolves `uncertain` into `listed` / `not-listed`, and a fake ID is `not-listed`.
6. **[TODO: DEV]** Title-classifier precision audit: hand-label 50 `top_job_titles_sponsored` strings and report precision and recall for SWE and seniority. *Why:* the first run already produced one false positive ("Solution Engineer Frontend/Backend – Field Services" counted as SWE).
7. **[TODO: DEV]** Parity root-cause audit: once item 2 lands, recompute employer counts from the raw source and test whether the 1,557/1,557 even counts are a 2× join duplication.
8. **[TODO: DEFINE]** Degree–SOC evidence for gate G5: what counts as enough evidence that an MSIS transcript supports a 15-1252 petition (for example, the number of programming, data-structures or systems courses). This must be set by the student with the university's international student office or the employer's immigration counsel, not by this recipe.
9. **[TODO: APPROVE]** Engine-level weight for `role_quality`. It is 0 today (`DOMAIN.md` gap 3), so the Cognitive Pivot score appears in every trace but changes no decision. This is a maintainer decision. The mode reports the score and does not reweight it.

## Phase gates

Liveness and timeline are **gates, not votes**: a closed gate zeroes a role whatever its other evidence. Machine gates halt with exit 2. Human gates are cleared only by a named human and logged in `logs/runs/`.

| Gate | Who | Testable condition | Pass | Fail |
|---|---|---|---|---|
| **G0 Data-shape** | machine | `sponsor-triage.mjs` exits 0: all 11 required columns present, no row-width mismatch, parity audit written to `triage.json → data_shape.parity` | continue | exit 2, nothing is ranked |
| **G1 Visa timeline** | machine, then the student | `triage.json → timeline.conservative.draws ≥ 1`, or `stem_if_everify.draws ≥ 1`. `opt_start` is 0–60 days after `program_end` (machine halt otherwise). The student confirms the program end date on the I-20 and the OPT start on the EAD, and logs the date. STEM designation of the MSIS was confirmed by the student on 2026-10-20 | continue; per-employer factor carried into the scorer | exit 2 if 0 draws in every scenario; employers with factor 0 are Skip |
| **G2 Evidence adequacy** | the student | every company in `candidates.json` is tier Proven or Likely in `triage.json`, **or** has a logged reason for advancing a Possible/Unknown employer | continue | remove the candidate |
| **G3 Posting liveness** | machine, then the student | each candidate URL is `active` in the `ats:liveness` output. `uncertain` is refused by `build-roles.mjs`; a human may clear it only by opening the posting and logging date + what they saw | role is scorable | role refused, never defaulted open |
| **G4 E-Verify** | the student | an employer appears in `everify_overrides` **only** with a dated E-Verify lookup logged | STEM timeline (factor 1.0) applies | conservative factor stays |
| **G5 Degree ↔ SOC** | the student + DSO/employer counsel | logged answer to "which SOC would you file under, and does my MSIS coursework support it?" | proceed to offer stage | flag the role; do not accept without an answer |
| **G6 Fit input** | the student | `roles.json → decision_grade == true`, meaning no fit value contains "placeholder" | recommendations may guide applications | report is labelled NOT decision-grade |

## Workflow (verbatim commands, run from the repo root)

```bash
# 0. toolchain (once). manifest-check needs PyYAML; the fetcher needs requests.
npm install
python3 -m venv ../.venv && ../.venv/bin/pip install pyyaml -r scripts/ats/requirements.txt
export PATH="$PWD/../.venv/bin:$PATH"
npm run verify
npm run score:gates                               # engine gates still multiply (RESULT : PASS)

# 1. audit the source before using it
python3 scripts/sec/validate-h1b-join-sample.py <copy-of-mapped.csv>   # writes its audit next to the copy

# 2. triage: G0 + G1 (80 Days layer + timeline gate)
node scripts/contrib/2026fa/revan1010-boston-swe-triage/sponsor-triage.mjs \
  --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --profile scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json \
  --out-dir output/revan1010-boston-swe/<date>

# 3. HUMAN (G2): read triage.md; fetch boards for Proven/Likely employers
python3 scripts/ats/fetch-real-postings.py --greenhouse "Klaviyo" "PathAI" ... -o private/real-postings/<date>.json
#    pick non-senior Boston-area SWE postings → private/real-postings/candidates-<date>.json
#    write your own fit judgments           → private/real-postings/fit-<date>.json

# 4-5. liveness (G3) → gate-enforcing role build → engine scorer
bash scripts/contrib/2026fa/revan1010-boston-swe-triage/run-mode.sh output/revan1010-boston-swe/<date> \
  private/real-postings/candidates-<date>.json private/real-postings/fit-<date>.json

# 6. tests and break attempts
node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs
```

## What it can and cannot verify

| The mode **can** verify (record or deterministic) | The mode **cannot** verify (and so does not claim) |
|---|---|
| Which commutable MA employers carry an H-1B record in the 80 Days file, with exact raw counts, rate and median salary | Whether those counts are current: the H-1B fields have **no fiscal year** |
| Which employers' top sponsored titles include a non-senior SWE title, by a declared, testable rule | Whether the company row is the same legal employer as in DOL/USCIS data: no FEIN, no match score, and the join was never validated |
| That **every** count in the file is even (1,557/1,557), and so that raw counts are unsafe as magnitudes | *Why* they are even (likely 2× duplication, but the raw source is absent) |
| How many H-1B registrations the student's OPT dates reach, under both E-Verify scenarios | Whether a given employer uses E-Verify; the unemployment-day clock; cap-gap edge cases; this year's actual registration dates |
| Whether a posting URL shows an apply control today (`active`) | Whether an `uncertain` posting is real (a fake job ID also returned `uncertain`); whether a live posting is actually being filled |
| National median wage and Cognitive Pivot score for 15-1252 vs 15-1211 vs 15-1253 | Boston pay; the OFLC wage level of any offer; lottery odds under any weighting rule |
| That a missing liveness or fit input is refused, not defaulted | Whether the student fits the role (fit is the student's input), or whether this employer will sponsor *this* student |
| — | Whether USCIS will accept an MSIS degree as related to a software-developer petition (gate G5, human only) |

## Output Contract

Two readers, two artifacts. An agent never reads the Markdown, and a human is never handed the JSON.

### Agent log (JSON): `output/revan1010-boston-swe/<date>/`

| File | Producer | Required fields |
|---|---|---|
| `triage.json` | `sponsor-triage.mjs` | `inputs{csv, csv_sha256, profile_values}`, `rules{…}`, `data_shape{rows, h1b_rows, in_state_h1b, in_commute_h1b, kept, rejects, parity{approvals_even, denials_even, suspected_double_count}}`, `timeline{conservative, stem_if_everify}{draws, registrations_reachable[], authorized_until, factor}`, `tier_counts`, `companies[]{company, city, h1b{approvals, denials, approval_rate, median_salary_offered, source, fiscal_years}, titles{non_senior_swe[], senior_only}, sponsorship_tier, sponsorship_p, funding{latest_date, months_since, signal, stage_estimate}, everify, timeline_factor}` |
| `roles.json` | `build-roles.mjs` | `decision_grade`, `fit_placeholders[]`, `roles[]` (scorer schema plus `_evidence{url, liveness, soc, cognitive_pivot_score, h1b_raw, fit_note}`), `refused[]{role_id, refused_because}` |
| `role-scores.json` | engine scorer | `roles[]{composite, recommendation, reason, trace{votes[], gates[], arithmetic}}` |

The executive-officer and board-director columns are **never** copied, and a test enforces this.

### Human report (Markdown)

- `triage.md`: reader is the student. Decision enabled: *which employers deserve a board check at all*. Sections: Executive summary → Run record → Short-list table (`# | Employer | City | Tier | Approvals/denials (raw) | Rate % | Median sponsored salary | Non-senior SWE titles | Form D funding`) → How to read the tiers → What this report cannot tell you.
- `role-scores.md` (engine): reader is the student. Decision enabled: *apply / consider / skip per posting*. It must be read together with `roles.json → refused` and `decision_grade`.

## Stop conditions (refuse rather than guess)

- **Refuse to rank** if a required column is missing, any row width disagrees with the header, or the CSV ends inside a quoted field, because a mis-parsed row would shift every count (exit 2).
- **Refuse to run** if `opt_start` is not 0–60 days after `program_end`, because an OPT start outside the grace period is an input error, not a scenario (exit 2).
- **Refuse to run** if no H-1B registration is reachable in any scenario, because every role would be gated to Skip and a ranking would imply otherwise (exit 2).
- **Refuse to emit an empty short-list as a result**, because "no employers" usually means a filter error (exit 2).
- **Refuse a role** whose posting has no liveness record, or an `uncertain` one, because the engine scorer would default the gate to open (shown in the worked run).
- **Refuse a role** with no fit input from the student, because fit is never a model guess.
- **Refuse a role** whose location is outside the commute set, including "Remote", because commute is the student's declared constraint.
- **Refuse to state a raw count as "number of H-1B workers"** while the parity flag is true, because the counts are probably doubled.
- **Refuse to give a Boston wage, a wage level, or lottery odds**, because the data is absent; `local-wage-adjustment.py` exits 2 and no national fallback is substituted.
- **Refuse to call a recommendation decision-grade** while any fit value is a placeholder.

## Log template for `logs/runs/<term>-<handle>-<n>.md`

Students do not edit `logs/RUN_LOG.md` (CI rejects it). This entry goes in `logs/runs/`.

```markdown
## YYYY-MM-DD — revan1010-msis-swe-boston-opt v0.1.0 · <scenario>
- **Recipe:** recipes/cases/2026fa/revan1010-msis-swe-boston-opt.md v0.1.0
- **Inputs:** 80 Days CSV sha256 <first 12>…; profile as_of=<date>, program_end=<yyyy-mm>, opt_start=<yyyy-mm>, stem_degree=<bool>; <n> candidate postings (kept in private/); fit = <own | placeholder>
- **Outputs:** output/revan1010-boston-swe/<date>/{triage,roles,role-scores}.{json,md}
- **Result:** rows <n> · MA H-1B <n> · commute <n> · tiers P/L/Po/U <a/b/c/d> · parity <even>/<total> · draws <conservative>/<stem> · candidates <n> → scorable <n>, refused <n> (<reasons>) · Apply/Consider/Skip <a/b/c> · decision_grade <bool>
- **Gates:** G0 <pass/halt> · G1 <machine result; human: name, date> · G2 <name, date | open> · G3 <active n / uncertain n; human clearances> · G4 <open | employer + lookup date> · G5 <open | answer logged> · G6 <open | cleared>
- **Open issues:** <list>
```
