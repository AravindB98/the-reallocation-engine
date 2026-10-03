---
status: DRAFT
todos_open: 8
last_gate: null
attestation: null
recipe_version: 0.1.1
---

# network-eng-h1b — Network Engineer roles by H-1B sponsorship history (SOC 15-1241)

## Executive summary

**What it does.** For a short list of Network Engineer job openings, this recipe checks whether each employer has a past record of H-1B visa sponsorship, and whether any of the job titles it sponsored were network jobs. It then hands each opening to the repository's existing scorer, which returns Consider or Skip, and lists every input with where it came from. Openings it cannot check properly are not scored. It names what was missing instead.

**Who it is for.** An international master's student on an F-1 visa who has not started OPT yet and is aiming at Network Engineer jobs. For this student, the most important question is: has this employer sponsored network roles before?

**What it decides.** Each opening ends in one of four places:
- **Consider:** tailor the application and confirm sponsorship with a recruiter or contact.
- **Network, do not apply yet:** a good sponsor, but the posting has not been checked.
- **Skip.**
- **Missing:** with the reason.

Because the sponsorship data shows only that an employer sponsored a network title at least once, never that it still does, a network match can reach Consider but **never Apply on its own**. The person can still override with a written reason. The recipe never treats missing data as a "no" and never guesses a number.

Two customers: this file is for the agent; `recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.card.md` is for the person.

**Handoff condition (done when):** a sample run writes both outputs from the Output contract into `course/2026fa/submissions/prpathak1/runs/`. Every role then appears exactly once, in one of: scored, not scored (with gate and reason), or missing (with reason). Every value carries one of the three labels. The scorer's own `role-scores.json` sits beside them. "Looks right" is not the condition; the per-role accounting and the labels are.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout and known gaps.
3. `DATA_CONTRACT.md` §Zero-Conditions — fictional `@example.com` persona only.
4. `course/2026fa/submissions/prpathak1/CHANGE-BRIEF.md` — the decisions this recipe implements (revisions r1–r3).
5. `scripts/score/role-scorer.mjs` — the scorer this recipe feeds (read, never copied).
6. This recipe and its card.

## Purpose and source inventory

Make one hidden signal visible: **past H-1B sponsorship of network-titled roles**, per employer, from local verified data. Report everything else (funding, wages) as context outside the score.

### Data (all tracked, checked to exist 2026-10-02)

| Path | Used for | Label of values read |
|---|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`. 30,369 rows; 1,557 with H-1B fields; no SOC column. Columns `phone`, `executive_officers`, `board_directors` are **never read into outputs**. | record |
| `data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json`, `…2025q3…`, `…2025q4…`, `…2026q1…` | Form D presence by `company.company_name_normalized` (200 entries, 196 distinct names) | record (context only) |
| `data/bls/compact/soc_occupation_compact.csv` | row `onet_soc_code = 15-1241.00`: `title`, `annual_median_wage`, `oews_year` | record (context only) |
| `data/examples/ch11-roles.json` | shape of the scorer input | — |

### Stored scripts and commands (exist today)

| Path / command | Used for |
|---|---|
| `scripts/score/role-scorer.mjs` · `npm run score -- <roles.json> --out-dir course/2026fa/submissions/prpathak1/runs/<run_id>` | the composite. Always with `--out-dir` (line 164 otherwise writes beside the input). |
| `scripts/sec/entity-resolution.py` → `normalize_company_name()` | company-name normalization (imported, not copied; same suffix list as `scripts/sec/sec-all-quarters.py`) |
| `scripts/ats/liveness-core.mjs` → `classifyLiveness()` | 404/410 → `expired`, in the offline test |
| `scripts/ats/check-liveness.mjs` · `npm run ats:liveness -- <url>` | live posting check. Not used by v0.1 (sample mode only); see Proposed additions. |
| `node scripts/conformance.mjs <paths>` · `npm run verify` · `npm run doctor` · `node scripts/pii-scan.mjs --diff main` | pre-PR checks |

### Prototype (built 2026-10-03, v0.1)

The prototype's development item is closed by evidence:
- the files below exist;
- `node scripts/conformance.mjs` passes on the folder;
- 19/19 offline tests pass;
- a sample run wrote both outputs (handoff condition).

```
scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/
  README.md                         one documented command, test command, inputs, outputs, limitations
  run.mjs                           JavaScript (Node); the recipe's full path
  normalize_names.py                imports the repo's normalize_company_name(); no copy
  fixtures/persona.json             fictional @example.com persona (dates, lag, needs_sponsorship, authorization)
  fixtures/persona-past-dates.json  past dates → G2 closed (F3)
  fixtures/persona-regex-trigger.json   authorization contains "authorized", needs_sponsorship true → G0 stops (F4)
  fixtures/candidates.json          openings: company, title, posting URL, fit_p, sample_liveness
  test/run.test.mjs                 offline tests (node:test), no network
```

Exit codes:
- **0:** every opening scored.
- **1:** run complete, but ≥ 1 opening is missing or not scored (each listed with its reason).
- **2:** run stopped (G0, G2a, input, PII, scorer error); nothing scored.

Command:

```bash
node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
```

Design constraints already known:
- Normalization runs the repo's Python function through `execSync` (a shell). On native Windows, `python3` is a `.cmd` shim, and Node's `spawnSync('python3')` without a shell returns `ENOENT`.
- The scorer has no exports (see U4), so it is run only as a CLI, and its `role-scores.json` is read back.

## Proposed additions

| ID | Addition | Type | Evidence / reason |
|---|---|---|---|
| A1 | Network-title keyword rule | your-input | Case-insensitive. A title matches only if it contains `network` **and** one of `engineer`, `architect`, `administrator`, `admin`. Bare `Engineer` never matches. Every match reports the exact title string. Needed because the CSV has no SOC field. The data check found 9 distinct "network" titles across 8 companies; 5 of 8 exact-title matches for 15-1241 came only from bare `Engineer`. |
| A2 | Title → SOC crosswalk | [TODO: DATA SOURCE] | `alternate_titles_sample` holds 8 of 44 (15-1241.00) and 8 of 33 (15-1241.01) alternate titles. Closed by the full O\*NET alternate-titles file, or by `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (described in that folder's README, not in the clone), at a named path with a provenance note. Until then, no output claims a SOC match. |
| A3 | Funding weight | [TODO: DEV] | `role-scorer.mjs` reads no funding term: `fund|form.d|sec` finds nothing, and an added `funding` term changed no composite in a probe (0.4462 both ways). The scorer is not patched. Proposal for a maintainer: a `funding` vote with a weight justified in writing. Until then Form D is context, worded "no record in sample data", never "not funded". |
| A4 | Live liveness mode | [TODO: DEV] | v0.1 reads liveness from `fixtures/candidates.json` (`sample_liveness`), labeled your-input. A live mode would call `checkUrlLiveness()` (exported, `scripts/ats/liveness-browser.mjs:48`) or run `npm run ats:liveness`, label results record with the check date, and requires human approval per posting host. |

| A5 | Network-match weight | [TODO: DEV] | In the v0.1 sample run (`20261003-045551`), a network match (Likely, p 0.6) and no network match (Possible, p 0.5) differ by only 0.6 × 0.35 − 0.5 × 0.35 = **0.035** on the composite. Both are soft tiers, so both show Consider. COMPOUND LABS INC (sponsored title only `Engineer`) reached Consider at 0.355, the same band as the network matches (0.42, 0.45). The skip rate was 1 of 5 scored (**20%**), below the scorer's 50% "healthy" line. Proposal for a maintainer: a separate network-match term or weight, justified in writing, so the recipe's main signal moves the result. Not implemented; no rule or p value was changed. |

### Proposed upstream fixes (proposals only; nothing is patched)

| ID | Issue | Evidence | Proposal |
|---|---|---|---|
| U1 | Gates fail open when missing | `role-scorer.mjs:83–84` `num(role.liveness?.factor) ?? 1` / `num(role.timeline?.factor) ?? 1`. Lines 86–87 still attach a `source` label to the defaulted 1. Probe: a role with no liveness or timeline scored 0.5250 Apply, above the complete baseline 0.4462. Related: lines 72–73 drop a missing or non-numeric vote silently (`"0.9"` as a string → vote dropped, 0.1785 Skip). | [TODO: DEV] A missing gate should be "not scored" (or a closed gate), with a warning. A dropped vote should be reported in the trace. |
| U2 | Profile regex reads "authorized" as no sponsorship needed | `role-scorer.mjs:58–60`: `/citizen\|permanent\|green\|gc\|pr\b\|no.?sponsor\|authorized/` on `profile.authorization` only. Probe: `"F-1 OPT, authorized to work; will need H-1B sponsorship"` → `profile_needs_sponsorship=false`, sponsorship weight 0. | [TODO: DEV] Read an explicit `needs_sponsorship` boolean first; never infer "no sponsorship needed" from `authorized`. |
| U3 | Docs say `needs_sponsorship` is read; code does not read it | `search/examples/README.md:30` ("the authorization-parsing fix (PR #37)"), `:31` ("explicit field wins"), `:33`. `search/examples/priya-nair/profile.yml:2` ("always wins over free text"). `search/examples/aarav-patel/profile.yml:2–4`. `search/examples/rohan-desai/profile.yml:2–3`. But `role-scorer.mjs` contains no `needs_sponsorship`, and no persona has the top-level `authorization` key that line 58 reads. `git log --grep` finds no `#37` commit in this clone. | [TODO: DEV] Either implement U2 or correct the persona docs. Log the mismatch per SNICKERDOODLE P6. |
| U4 | Scorer has no exports, despite CONTRIBUTING.md | `CONTRIBUTING.md:46–47`: "Harnesses import `scripts/score/role-scorer.mjs`'s exports (`CONFIG`, `SRC`, `applyProfile`, `scoreRole`)". The file has no `export` statement (lines 33, 51, 56, 68 define them), and `main()` runs at load (line 185). `import()` printed the usage line and exited 2. | [TODO: DEV] Export the four names and guard `main()` behind an is-main check. Until then, use the CLI. |

## Phase gates

Every gate is a hard stop. A role that fails, or cannot evaluate, a gate is **not sent to the scorer**. It appears in the report under "not scored" with the gate and reason. Gate decisions are recorded in the run's JSON log and in `logs/runs/2026fa-prpathak1-<n>.md`, with who/what/when. `logs/gate-decisions/` does not exist and is not used.

| Gate | Testable condition | Pass | Fail | Human must see to clear |
|---|---|---|---|---|
| **G0 Profile pre-check** (once per run, before anything is scored) | Run the real scorer CLI on the exact persona JSON and one probe role: `node scripts/score/role-scorer.mjs <probe.json> --profile <persona.json> --out-dir course/2026fa/submissions/prpathak1/runs/<run_id>/g0-probe`, then read `profile_needs_sponsorship` from its `role-scores.json`. The regex is not copied. | persona `needs_sponsorship` (your-input) equals scorer `profile_needs_sponsorship` | mismatch → **exit non-zero, nothing scored**. The persona text is **never reworded** to get past the regex. | the exact `authorization` string passed, persona `needs_sponsorship`, scorer `profile_needs_sponsorship` |
| **G2a Timeline inputs valid** (once per run) | Persona has program end, OPT start, a 90-day limit, a lag, and `program_end ≤ opt_start ≤ program_end + 60 days`. Unemployment days used = 0 while OPT has not started. | continue | **input error, exit non-zero, nothing scored** | the four inputs and the validity check (persona: 2027-06-01 is 17 days after 2027-05-15 → valid) |
| **G1 Liveness** (per role) | The role's liveness result is `active` or `expired`. | `active` → `liveness.factor` 1.0; `expired` → 0.0 (closed → Skip) | `uncertain` or absent → **not scored** (strong sponsor → "network, do not apply yet" list) | URL, result, reason, check date. In v0.1 sample mode the result is a fixture value, labeled your-input. |
| **G2 Visa timeline** (per run, applied per role) | `slack = (OPT start + 90 d) − (run date + hiring lag)` | slack ≥ 30 → `timeline.factor` 1.0; 0–29 → 0.5 | < 0 → 0 (gate closed → not scored) | each date, the lag, slack in days, the factor sent |
| **Sponsorship input** (per role, a stop rather than a gate) | The role's company has an 80-days CSV row by exact normalized name, and `Total Approvals` is numeric. | mapping below | no row / empty / non-numeric → **missing**, never sent as null or 0 | the matched `company_name`, the four H-1B fields, the title(s) that matched A1 |

**Scorer behavior at the boundaries** (read from code, `role-scorer.mjs`):
- `gate_zero` is 0.05 (line 46), so a factor of 0 → Skip (gated) (line 93).
- `timeline < 0.6` is a soft spot (line 101), so factor 0.5 turns Apply into Consider.
- G1/G2 keep a missing value from reaching lines 83–84, where it would become 1.0.

**Sponsorship mapping (your-input, CHANGE-BRIEF r2/r3):**

| Condition | tier | `sponsorship.p` |
|---|---|---|
| `Total Approvals` ≥ 1 and ≥ 1 title matches A1 | Likely | 0.6 |
| `Total Approvals` ≥ 1, no A1 title | Possible | 0.5 |
| `Total Approvals` = 0 | None | 0 |
| no row, or `Total Approvals` empty / non-numeric | — | missing: not scored |

- There is no Proven tier: the CSV has no dates and no per-title counts. `Approval_Rate` and `Total Denials` are context only.
- `likely` and `possible` are soft tiers (line 48), so with sponsorship needed, a composite ≥ 0.30 shows Consider. **Network matches cap at Consider.** Highest possible composite: (0.6 × 0.35 + 1.0 × 0.30) × 1 × 1 = 0.51.
- A human override with a non-empty reason (lines 116–127) can still change the final recommendation. The machine recommendation stays capped.

**Fit:** `fit.p` (0–1) per role comes from `fixtures/candidates.json` (`fit_p`), labeled your-input. The v0.1 values were proposed by the AI and accepted by the human on 2026-10-03.

**Source labels:**
- The prototype sets `source` explicitly on every term. The scorer keeps a supplied `source` and uses a default only when it is missing or empty (lines 74, 86–87). It does not check the label.
- Labels sent: sponsorship `record`, fit `your-input`, liveness `your-input` in sample mode (`record` only in live mode, A4), timeline `your-input`.
- The sponsorship value is a record row passed through a your-input mapping, and the report states this beside every sponsorship value.

## Can verify / Cannot verify

### Record — read from a tracked file, unchanged
- For the matched 80-days CSV row: `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, and the `top_job_titles_sponsored` strings, exactly as stored. The JSON log stores the CSV's SHA-256.
- Whether a normalized company name is present in the four Form D **sample** files, and the accession number if so.
- The BLS 15-1241.00 row: `title`, `annual_median_wage` (130390.0), `oews_year` (2024). Context only.
- What the scorer returned: its `role-scores.json` is kept unedited beside the outputs.

### Your-input — set by the person, labeled as such
- The keyword rule (A1).
- Persona dates: program end 2027-05-15, OPT start 2027-06-01. The 90-day limit, the 60-day hiring lag, and the run date when passed as a flag.
- `fit.p` per role, and the list of openings (company, title, URL).
- Sample-mode liveness results.
- Every mapping rule: sponsorship → tier/p, slack → timeline factor, liveness result → factor, OPT-start validity window.
- That the CSV row is this employer: by exact equality of the repo's normalized name, which is a rule and not proof of identity.

### Model-judgment
- None in v0.1. No language model is called. If any later value comes from a model, it must be labeled `model-judgment`.

### Cannot verify — stated in every report, never scored
- **Per-title counts:** how many of a company's approvals were network roles. Only a list of titles exists.
- **Dates of sponsorship:** the CSV has no dates.
- **Current sponsorship:** whether the employer sponsors now, or for this opening.
- **SOC match:** that a title is SOC 15-1241. No crosswalk exists (A2).
- **The H-1B cap lottery:** past approvals are not a selection probability.
- **Cap-gap timing:** whether status and work authorization carry from OPT end to an H-1B start.
- **Funding, with sample data only:** absence from 200 sample entries is "no record in sample data", not "not funded". Presence is one filing, not current runway.
- **Posting liveness in sample mode:** fixture values are not checks.
- **Entity identity:** two legal employers with the same normalized name, or one employer under two spellings (CHANGE-BRIEF P4).

## Known limitations (found in the v0.1 sample run, 2026-10-03)

Evidence: run `20261003-045551` (output kept under `course/2026fa/submissions/prpathak1/runs/`, not committed in this version). No rule or p value was changed in response.

1. **The network rule barely moves the result.**
   - Likely (p 0.6) and Possible (p 0.5) differ by **0.035** on the composite (× sponsorship weight 0.35), and both are soft tiers that cap at Consider.
   - COMPOUND LABS INC, whose only sponsored title is a bare `Engineer` (correctly **not** a network match, F2), still reached **Consider at 0.355**, alongside VERSA NETWORKS INC (0.45) and NETBRAIN TECHNOLOGIES INC (0.42).
   - The skip rate was **1 of 5 scored (20%)**, below the scorer's "healthy" 50%.
   - Proposed remedy: A5 (network-match weight).
2. **Substring over-match (SKYTAP INC).**
   - SKYTAP INC is Likely only because its sponsored title `Engineering Manager, Networking` contains `network` (in "Networking") and `engineer` (in "Engineering").
   - The rule matches substrings, so a management title counts as a network-engineering title.
   - This is an **over-match that CHANGE-BRIEF prediction P1 did not foresee**: P1 predicted only *under*-matching (network engineers hidden under generic titles).
   - A unit test documents the behavior; the rule is unchanged (your-input).
3. **Under-match (P1, as predicted).** Network roles sponsored under generic titles (`Infrastructure Engineer`, `Systems Engineer`) do not match, and those companies show as Possible.
4. **Sample-mode liveness.** All liveness values are fixture values (your-input), not checks. Live checking is A4.
5. **Funding exercised only as absence.** All 7 sample companies read "no record in sample data" (P5, as predicted).

## Facts that bite — addressed

| Fact | How this recipe handles it |
|---|---|
| Role quality carries zero weight (`role_quality: 0.0`, line 37, `[VERIFY]`) | No `role_quality` term is sent. The BLS 15-1241 median wage is shown as context outside the score. |
| `bls:local-wage` feeds nothing yet, and fails on a fresh clone (missing `.venv`, unshipped requirements) | Not used. The failure is as stated in the assignment; this recipe does not run it. |
| Only samples of the SEC data ship | Form D lookup reads only `data/sec/form-d/processed/sample/*.sample.json`; every report names this. The 2026-10-02 data check found 0 matches for the network companies. |
| `data/raw/`, `data/verified/`, `logs/gate-decisions/` do not exist (checked 2026-10-02) | Never used as gate or output paths. Gates are recorded in the run JSON and `logs/runs/`. |
| The `snickerdoodle` CLI is roadmap, not runtime | No `snickerdoodle` command appears in this recipe. |
| Every top-level recipe is DRAFT | This recipe is DRAFT; it claims nothing beyond that. |
| `scripts/sec/validate-h1b-join-sample.py` needs full data | Not used. |
| `npm run score` without `--out-dir` overwrites tracked example output | Every scorer call passes `--out-dir course/2026fa/submissions/prpathak1/runs/<run_id>`. |
| Windows (environment, not repo): `python3` and `bash` | On native Windows, `npm run verify` failed until a `python3.cmd` (→ `py -3.11`) and a `bash.cmd` (→ Git Bash) shim were put ahead of `WindowsApps` on PATH, and PyYAML was installed. The bare `bash` there was WSL's. Repo files were not changed. Recorded in the TEST-REPORT. |

## Workflow

1. Confirm inputs exist:

```bash
test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && test -f data/bls/compact/soc_occupation_compact.csv && ls data/sec/form-d/processed/sample/*.sample.json
```

2. Run the prototype (sample mode):

```bash
node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
```

The prototype executes, in order:
- G0;
- G2a;
- for each role: the sponsorship lookup, then G1, then G2;
- writes `roles.json` for passing roles only, then `npm run score -- <roles.json> --out-dir …`;
- reads `role-scores.json` back and writes both outputs.

3. Offline tests (quote the glob: Node 24 treats a bare directory argument as a file and fails with `Cannot find module`):

```bash
node --test "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/*.test.mjs"
```

4. Checks before PR:

```bash
node scripts/conformance.mjs recipes/cases/2026fa/ scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/ course/2026fa/submissions/prpathak1/
npm run verify
npm run doctor
node scripts/pii-scan.mjs --diff main
```

5. A named human reads the Markdown report and records each gate decision in `logs/runs/2026fa-prpathak1-<n>.md`. Never edit `logs/RUN_LOG.md`.

## Output contract

Both files are written by the prototype (`run.mjs`). Location: `course/2026fa/submissions/prpathak1/runs/<run_id>/`, with `<run_id>` = `YYYYMMDD-HHMMSS`. The scorer's own `role-scores.json` and `role-scores.md` sit beside them, unedited.

Every value object has the form `{ "value": …, "label": "record" | "model-judgment" | "your-input", "source": "<path or rule id>" }`.

A **computed** value (slack, factor, tier, p, composite, recommendation) adds `"derived_from": [<labels of its inputs>]`. Its label is:
- `record` only if every input is a record;
- otherwise `model-judgment` if any input is one;
- otherwise `your-input`.

### Agent log — `run.json`

```
run_id, run_date{value,label}, mode ("sample"), recipe {path, version},
inputs { persona_path, roles_path, csv {path, sha256}, formd_sample_paths[], bls_path },
gates {
  g0 { authorization_string, persona_needs_sponsorship, scorer_profile_needs_sponsorship, passed, probe_out_dir },
  g2a { program_end, opt_start, unemployment_limit_days, unemployment_days_used, hiring_lag_days, valid, error|null },
  g2 { opt_window_end, earliest_hire_date, slack_days, timeline_factor }
},
roles[] {
  role_id, company, title, posting_url,
  status ("scored" | "not_scored" | "missing"), reason|null, failed_gate|null,
  sponsorship { csv_company_name, total_approvals, total_denials, approval_rate,
                titles_sponsored[], network_titles_matched[], tier, p },
  fit { p }, liveness { result, factor, checked_at|null },
  timeline { factor },
  scorer { composite, machine_recommendation, recommendation, reason, trace } | null,
  context { formd_sample { found, accession_number|null, file|null, wording },
            bls_15_1241 { annual_median_wage, oews_year } },
  next_action
},
lists { consider[], network_do_not_apply_yet[], skip[], not_scored[], missing[] },
counts { evaluated, scored, consider, skip, not_scored, missing, skip_rate },
scorer_output { dir, role_scores_json },
cannot_verify[], stop_condition|null, generated_at
```

### Human report — `report.md`

- **Reader:** the student, or a reviewer, deciding where to spend the next day's hours.
- **Decision enabled:** which openings to tailor, which companies to network into first, and what to drop.
- **Sections, in order:**
  1. Executive summary in plain language.
  2. Run record: date, mode, inputs, CSV hash.
  3. Gate results: G0, G2a, G2, each with what the human must see.
  4. Consider: tailor and confirm.
  5. Network, do not apply yet.
  6. Skip.
  7. Not scored, with gate and reason.
  8. Missing, with reason.
  9. Per-role evidence table: every value with its label.
  10. Context outside the score: Form D sample wording, BLS wage, approval rate, denials.
  11. Cannot verify.
  12. Skip rate.
  13. Human gate sign-off lines: name, date.

## Stop conditions

Stop the whole run, write `stop_condition` in `run.json`, and score nothing when:
- G0 fails (persona `needs_sponsorship` true but the scorer reads false, or the reverse).
- G2a fails (missing timeline input, or OPT start outside program end … program end + 60 days).
- Any required input file is missing or unparseable.
- The persona carries an email that is not `@example.com`, or the roles file names a person.
- The scorer CLI exits non-zero, or its `role-scores.json` does not parse.
- The run would write anywhere outside `course/2026fa/submissions/prpathak1/runs/`.
- A live network call to a posting host is requested without a recorded human approval (v0.1 makes none).

Per role, the run continues and does not invent a value:
- **Missing:** no CSV row / non-numeric approvals → `missing` with the reason.
- **Not scored:** a G1 or G2 failure → `not_scored` with the gate and reason.

## Next action per result (3-3-2 day)

| Result | Next action | Where it fits |
|---|---|---|
| **Consider** | Tailor the application, and confirm current sponsorship with the recruiter or a network contact. | the 2 research-and-apply hours |
| **Not scored, no checked posting, strong sponsor (tier Likely)** | Put the company on "network, do not apply yet": find a contact, ask about network-team hiring and current sponsorship, and check the posting before applying. | the 3 networking hours |
| **Skip** | No action. Skip is a success; a healthy run skips at least half. | time returned to the day |
| **Missing** | Report the reason (e.g. "no row in 80-days CSV", "Total Approvals non-numeric"). Do not treat it as a no-sponsor. | the person decides whether it is worth manual research |
| **Skip, gated by an expired posting** (G1 `expired` → liveness 0 → sent to the scorer, which gates it to Skip) | Drop the posting. Skip is a success. | time returned to the day |
| **Not scored, other reason** (G2 closed; G1 `uncertain` or absent, not a Likely sponsor) | Report the gate and reason. G2 closed → revisit the dates; G1 uncertain or absent → check the posting before spending time on it. | — |

## Run-log template — `logs/runs/2026fa-prpathak1-<n>.md`

Based on `recipes/_shared.md` §Logging Rules. Never edit `logs/RUN_LOG.md`.

```markdown
## YYYY-MM-DD — network-eng-h1b sample run <n>

- **Recipe:** recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md v<recipe_version> (status <status>)
- **Branch / commit:** contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241 @ <sha>
- **Inputs:** persona fixture <path>; roles fixture <path>; 80-days CSV sha256 <hash>; Form D samples (4 files); BLS compact
- **Command:** <exact command run>
- **Outputs:** course/2026fa/submissions/prpathak1/runs/<run_id>/run.json, report.md, role-scores.json, role-scores.md
- **Gates:** G0 <pass/fail + values> · G2a <valid/error> · G2 <slack days → factor> · G1 per role <counts>
- **Result:** evaluated <n> → Consider <n> · Network-do-not-apply-yet <n> · Skip <n> · Not scored <n> · Missing <n> (skip rate <x>%)
- **Labels:** record <n> values · your-input <n> · model-judgment <n>
- **Gate decisions (human):** <name> · <date> · <what was checked>
- **Open issues:** <what did not work or is still missing>
```

Do not log secrets, real names, emails, phone numbers, or private application notes.

## Change log

- **0.1.0** (2026-10-02, commit 100a823): first DRAFT.
- **0.1.1** (2026-10-03), human decisions on the v0.1 build:
  - prototype built; its development item, plus the run-command, test-command and output-contract items, closed by evidence (files exist, conformance passes, 19/19 tests, sample run wrote both outputs);
  - test command changed to the quoted glob form;
  - next-action table fixed: `expired` is gated to Skip by the scorer, not "not scored";
  - exit codes documented;
  - fixture file names corrected (`candidates.json`, `persona-past-dates.json`, `persona-regex-trigger.json`);
  - "Known limitations" added (0.035 composite gap, 20% skip rate, SKYTAP substring over-match not foreseen by P1);
  - A5 network-match weight proposed;
  - fit values recorded as AI-proposed, human-accepted.

  No rule or p value changed. Status stays DRAFT.
