---
status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE — see "Lifecycle claim" below
todos_open: 5
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# decgrad-swe1-sponsor-level — Level-matched sponsorship and OPT-clock triage for a December graduate

## Executive summary

**What it does.** For each software-engineering posting, this recipe answers three questions from shipped records and stated inputs. Has this employer sponsored H-1B visas for *junior* software titles, or only senior ones? Is the posting still open? Can hiring finish before the candidate's OPT unemployment allowance runs out? It then passes that evidence to the engine's existing scorer for an Apply / Consider / Skip call. Each result gets a next action: tailor an application, network first, or skip.

**Who it is for.** An F-1 student who finishes a STEM master's degree in **December 2026**, will start post-completion OPT in early 2027, has about **two years of prior industry experience**, and targets **SWE I / SWE II roles (SOC 15-1252) in Greater Boston**. A December graduate misses the spring campus cycle. Two years of experience rules them out of many "new grad" programs. Company-level "sponsors H-1B" lists don't show that many sponsors only sponsor senior engineers.

**What it decides, and what it doesn't.** It decides which postings deserve the two research-and-apply hours of a 3-3-2 day. It never applies, never sends anything, and never fills a missing record with a guess. A missing record leaves that posting **Not scored**, with the exact check a person should do by hand. The person decides at every gate.

This file is for the agent. The human card is `recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.card.md`.

**Handoff condition (done when):** the triage command exits 0. `triage-log.json` and `triage-report.md` both exist in the out-dir. Every role is scored or carries at least one missing-reason code. Every term in `roles.json` is a number in [0, 1] with a source label. And a named human has read `triage-report.md` and recorded a G5 decision in the run log. "Looks right" is not the condition.

## Lifecycle claim

**DRAFT, with a sample path that runs end to end.** Evidence: `logs/runs/2026fa-o7580-1.md`, `course/2026fa/submissions/o7580/TEST-REPORT.md`, and 13 passing offline tests. It is **not** marked SPECIFIED or RUNNABLE-SAMPLE, because the constitution requires zero open TODOs for SPECIFIED, and this recipe deliberately carries 5 typed proposals (below). The G5 adequacy read by a named human is also still pending. To promote it: close or move the five TODOs, have a named human read the sample report and sign the run log, then set `status: RUNNABLE-SAMPLE` with `last_gate` pointing at that entry. `attestation` stays `null` until VERIFIED.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout, and the Known gaps this recipe works around (items 3 and 9).
3. `DATA_CONTRACT.md` §Zero-Conditions — fictional persona only.
4. `data/80-days-to-stay/80-days-csv/README.md` — what the master CSV is.
5. `scripts/score/role-scorer.mjs` — the composite, the gate defaults, the override rule.
6. This recipe and its card.

## Source inventory

| Source | Path or command | Exists today? | Used for | Label |
|---|---|---|---|---|
| 80 Days master CSV (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | yes | `company_name`, `state`, `city`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `median_salary_offered`, `latest_funding_date`, `latest_funding_stage` | record |
| SEC Form D samples (4 quarters) | `data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json` … `2026q1` | yes (samples only) | context: does the company appear in the shipped sample? | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` (row `15-1252`) | yes | context: national median wage, OEWS 2024 | record |
| Liveness checker | `npm run ats:liveness -- --file <urls.txt>` → `scripts/ats/check-liveness.mjs` | yes | posting liveness; output saved to a log file | record |
| Composite scorer | `scripts/score/role-scorer.mjs` (`npm run score -- <roles.json> --profile <p.json> --out-dir <dir>`) | yes | Apply / Consider / Skip + per-term trace | scorer output |
| **Prototype** | `node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs` | yes | gates G0–G5, `roles.json`, calls the scorer, writes log + report | — |
| Prototype test | `node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs` | yes | offline, fixtures only | — |
| Sample scenario | `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.sample.json` | yes | fictional persona + 11 real public postings | your-input |
| Saved liveness log | `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.liveness.log` | yes | verbatim `ats:liveness` stdout, 2026-10-01 | record |
| OPT rules | 8 CFR 214.2(f)(10)(ii)(E) (90-day unemployment limit on post-completion OPT) | external regulation | `unemployment_ceiling_days: 90` | your-input — verify against the current CFR text before relying on it |

**Not used, on purpose:** `npm run bls:local-wage` (it fails on a fresh clone with no `.venv`, and nothing in the scorer reads its band; Facts 2 and 7). `scripts/sec/validate-h1b-join-sample.py` (needs full data that doesn't ship; Fact 8). The `snickerdoodle` CLI (roadmap, not runtime). `data/raw/`, `data/verified/`, `logs/gate-decisions/` (not present; Fact 4). Run records go to `logs/runs/` and outputs to `course/2026fa/submissions/o7580/runs/`.

## Parameters (DEFINE closures, each with its reasoning)

All are `your-input` and live in the scenario file's `params` and `persona`, never in code.

| Parameter | Value | Reasoning |
|---|---|---|
| `tier_p.Proven` / `Likely` / `None` | 0.9 / 0.6 / 0.0 | Reuses the values in `data/examples/ch11-roles.json`, so this recipe's tiers mean what Ch.11's tiers mean. |
| `tier_p.Possible` | 0.3 | Sponsors H-1Bs but shows no 15-1252 title in its top list. Half of Likely, because the occupation evidence is absent, not negative. |
| `min_approvals_for_proven` | 3 | One or two approvals can be a single person's petition and renewal. Three is the smallest count that suggests a repeated practice. A judgment, not a statistic. |
| `default_hiring_lag_days` | 45 | Assumption for application-to-offer at small and mid-size Boston tech employers. Override per role with `hiring_lag_days` when a recruiter states a timeline. |
| `comfort_days` | 30 | Slack at or above this gives timeline factor 1. Below it, the factor scales linearly. Under 18 days (factor < 0.6), the scorer's existing soft-timeline rule demotes Apply to Consider. |
| `buffer_days` | 14 | Days held back from the 90-day allowance for the I-9 and onboarding paperwork after an offer. |
| `prior_experience_months` | 24 | The situation this recipe is built for. |

## Phase gates (hard stops)

Each gate has a testable condition against paths that exist. A role that fails G1–G3 is **Not scored**: it never reaches the scorer, and it carries a reason code. G3 (liveness) and G4 (timeline) are **gates, not votes**. They enter the scorer as multipliers, so a closed gate scores 0.

| Gate | Test | Pass → | Fail → | Who clears |
|---|---|---|---|---|
| **G0 Inputs** | scenario parses; persona has `program_end_date`, `opt_start_date` (YYYY-MM-DD), `unemployment_ceiling_days`, `prior_experience_months`; `params` complete; CSV at the path above has the 80 Days columns; liveness log exists | G1 | exit 2, **nothing written** | machine (conformance) |
| **G1 Company resolution** | exactly one CSV row whose exact-normalized name (uppercase, punctuation and corporate suffix stripped) equals the input; `state` only breaks a tie | G2 | `no-company-match` or `ambiguous-company-match` | human confirms the matched entity (name, city, state shown in report) |
| **G2 Sponsorship record** | `Total Approvals` is non-blank | tier assigned (below) | `no-sponsorship-record`: **blank is absence of a join, not zero** | human checks the USCIS H-1B Employer Data Hub for blanks |
| **G3 Liveness** *(gate)* | posting URL appears in the saved log as `active` (factor 1) or `expired` (factor 0) | G4 | URL absent → `no-liveness-record`; `uncertain` → `liveness-uncertain` | human opens any `uncertain` posting |
| **G4 Timeline** *(gate)* | see "Timeline factor" below | factor in (0, 1] | factor 0 with a closure reason | human confirms the posting fields they typed |
| **G5 Decision handoff** | scorer exit 0; `triage-report.md` written; every scored row has a next action | named human records a decision per Apply/Consider row in the run log | stop; nothing is applied to | **human** |

**Sponsorship tier rule (G2, record):** split each title in `top_job_titles_sponsored` into the 15-1252 family (`software|developer|programmer|sde|full stack|back end|front end`, excluding `test|tester|qa|quality`, which is 15-1253, and excluding management titles such as "Software Engineering Manager" that name no engineer, developer, or programmer, which are 11-3021). Then split by level: *above-level* if it contains `senior|sr|staff|principal|lead|manager|director|architect|head|chief|vp|III|IV|V|3|4`.

| Condition | Tier |
|---|---|
| approvals = 0 | None |
| at-level SWE title and approvals ≥ 3 | Proven |
| at-level SWE title, approvals < 3 | Likely (thin record) |
| only above-level SWE titles | Likely (senior-only) |
| approvals > 0, no 15-1252 title in the list | Possible |

**Timeline factor (G4, your-input).** Let `clock_from = max(as_of, opt_start_date)`, `deadline = clock_from + (ceiling − days_used − buffer)`, and `expected_start = max(posting start date, or as_of + hiring_lag, opt_start_date)`. The gate **closes (factor 0)** if any of these holds:

- `grad-window-excludes`: the posting's stated graduation window doesn't contain `program_end_date`'s month;
- `experience-cap-excludes`: the posting caps prior experience below 24 months;
- `start-before-work-authorization`: the posting's fixed start date is before `opt_start_date`;
- `unemployment-clock-exceeded`: `expected_start > deadline`.

Otherwise `factor = min(1, slack_days / comfort_days)`. If `as_of > opt_start_date` and `days_used = 0`, the report raises a **human check** flag. It does not change the number.

**Posting says "no sponsorship".** If the person records `states_no_sponsorship` with the quote and the date read, the recipe passes the scorer's existing `override: { decision: "Skip", reason }`. The machine recommendation stays visible beside it. A current statement outranks a historical record.

## Steps

| # | Step | Labor | Command / artifact |
|---|---|---|---|
| 1 | Collect candidate postings and transcribe posting fields (grad window, experience cap, fixed start, no-sponsorship quote, fit with a one-line basis) into a scenario file | **Human** (an agent may draft it; the human re-reads every posting) | `scenarios/<name>.json` |
| 2 | Write posting URLs to a list and run liveness | AI runs, human saves | `npm run ats:liveness -- --file scenarios/<name>.urls.txt > scenarios/<name>.liveness.log` (add `# ran: <date>` at the top) |
| 3 | Run triage (G0–G4, scorer, outputs) | AI | `node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs --scenario … --liveness-log … --out-dir course/2026fa/submissions/o7580/runs/<run>` |
| 4 | Read the report and resolve every **Not scored** row by its named hand check | **Human** | `triage-report.md` |
| 5 | G5: decide per row and record it | **Human** | `logs/runs/2026fa-o7580-<n>.md` |
| 6 | Re-run when time passes (`--as-of`, `--days-used`) | AI | the timeline factor changes with the date; a stale run is not a decision |

## What it can verify (from records, by a fixed rule)

- That the named employer resolves to exactly one row in the shipped 80 Days CSV, and which row.
- That row's H-1B approval and denial counts and approval rate, as recorded.
- Whether the row's **top sponsored titles** include a 15-1252 title at or below a SWE II level.
- What the repository's liveness checker printed for each URL on the date it ran.
- Whether the employer appears in the four shipped Form D sample files.
- The arithmetic of the timeline factor and the composite, which is shown in full.

## What it cannot verify

- **Sponsorship of junior SWEs that isn't in the top-titles list.** The list is truncated (at most 14 titles in this CSV). A large sponsor whose junior titles fell off the list is under-tiered as Possible.
- **Current sponsorship policy.** The record is historical. Ginkgo Bioworks has 122 approvals, yet its live SWE 2 posting (read 2026-10-01) says it will not sponsor. Only the posting text, read by a person, catches this.
- **Anything about employers absent from the CSV.** The file is built from SEC Form D filers. Large Boston employers can be missing entirely (HubSpot: 0 rows), and 28,812 of 30,369 rows (94.9%) have a blank approvals field.
- **Whether a posting is real.** A dead Greenhouse job ID redirects to the company careers page with HTTP 200, so the checker reports `uncertain`, not `expired`. A posting that is "active" may still be a ghost.
- **The posting fields a person typed**: graduation window, experience cap, start date, fit, hiring lag.
- **EAD timing.** `opt_start_date` is the *requested* start. USCIS processing delay is not modeled.
- **Pay.** `median_salary_offered` is across *all* the company's sponsored titles, not SWE-only. The BLS figure is a national occupation median. Neither is an offer, and neither affects the decision.
- **Funding.** The 80 Days funding date is a snapshot. Absence from the Form D *samples* is not evidence of no filing.

## Facts that bite, and what this recipe does about each

| Fact | This recipe |
|---|---|
| 1 Role quality weight is 0.0 | Does **not** pass `role_quality` to the scorer. It shows the BLS 15-1252 median and the company LCA median as labeled context only. It proposes no weight, because a national occupation median can't separate one 15-1252 posting from another, so any weight would be a constant. |
| 2 `bls:local-wage` feeds nothing | Not used. Metro adjustment would not change any decision this recipe makes. |
| 3 Only Form D samples ship | Ran on the 4 `*.sample.json` files only. Reported as "sample hits", where absence ≠ no filing. The funding date shown comes from the CSV snapshot. |
| 4 Some recipe dirs don't exist | Gates point only at `data/80-days-to-stay/…`, `data/sec/form-d/processed/sample/`, `data/bls/compact/`, `logs/runs/`, `course/2026fa/submissions/o7580/`. |
| 5 `snickerdoodle` CLI is roadmap | Every command here is `node` or `npm run`. |
| 6 Every top-level recipe is DRAFT | So is this one (see Lifecycle claim). |
| 7 `bls:local-wage` fails on a fresh clone | Not on this recipe's path. |
| 8 `validate-h1b-join-sample.py` needs full data | Not on this recipe's path. Uses the shipped CSV and samples. |

**Two scorer behaviors found while building this, worked around rather than patched:**

1. The scorer treats a **missing gate as open**: `num(role.timeline?.factor) ?? 1`. A role with no timeline field scores as if the timeline were perfect. The prototype refuses to call the scorer unless every term is a number in [0, 1].
2. **A Proven sponsor clears the Apply threshold on its own**: 0.9 × 0.35 = 0.315 ≥ 0.30, even with fit 0. In the sample, a posting requiring 4+ years for a 2-year candidate would score Apply if it passed liveness. The recipe's answer is the human gate at G5. A scorer change is proposed below.

## Proposed additions (typed, not built)

1. [TODO: DATA SOURCE] **USCIS H-1B Employer Data Hub export**, at `data/uscis/h1b-employer-hub/FY<yyyy>.csv` (path does not exist). It would let G2 resolve `no-sponsorship-record` and `no-company-match` rows by employer and fiscal year, instead of sending them to a hand check. *Why it belongs:* 94.9% of CSV rows are blank. Today they're unscorable, and the most common hand check is this exact lookup.
2. [TODO: DATA SOURCE] **DOL LCA disclosure rows with `SOC_CODE` and `JOB_TITLE`**, at `data/dol/lca/FY<yyyy>.csv` (path does not exist). It would let the tier rule read *every* certified 15-1252 title, not a top-N list. *Why:* it removes the under-tiering failure named above. The 80 Days README says the CSV was built from this source, but the per-title rows aren't shipped.
3. [TODO: DEV] **Board-API liveness for Greenhouse IDs.** `GET boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` returns 404 for a dead ID, where the HTML URL returns a 200 redirect. A small ingest script under `scripts/ats/` (network allowed there per P2) would turn today's `uncertain` into `expired` for Greenhouse. *Handoff:* the deliberately dead URL in the sample reads `expired`.
4. [TODO: DEV] **Deterministic posting-field extractor** (regex, human-confirmed) for graduation windows ("graduating between … and …"), experience caps ("less than N months"), and no-sponsorship statements. Today a person types these. *Handoff:* it reproduces the Ginkgo quote and the Formlabs "4+ years" from saved posting text, and every extracted field is shown to the human before it counts.
5. [TODO: APPROVE] **Maintainer decision on the scorer** (`scripts/score/role-scorer.mjs`, not this contributor's to change): (a) make a missing gate a conformance failure instead of `?? 1`; (b) add a fit floor or renormalize so sponsorship alone cannot clear Apply. Needs a logged gate decision by the maintainer.

## Output contract

Two artifacts, two readers (P5). Both are written to `--out-dir`, which must sit under `course/2026fa/submissions/o7580/`, the prototype folder, or the OS temp dir.

**Agent log: `triage-log.json`**

```
recipe, recipe_version, mode ("sample"), as_of, generated_at,
inputs { scenario, liveness_log, liveness_log_meta, csv, csv_rows, form_d_sample_files[], bls },
persona { …, label: "your-input" }, params { …, label: "your-input" },
model_judgments_used (0),
summary { evaluated, scored, not_scored, apply, consider, skip, skip_rate_of_scored },
scorer { path, input, outputs[], stdout, config },
gate_decisions_pending [],
roles[] {
  role_id, company_input, title, posting_url,
  company { value, city, state, label: "record", source },
  sponsorship { tier {value,label,basis}, p {value,label:"your-input",basis}, approvals, denials, approval_rate, at_level_titles[], above_level_titles[] },
  liveness { factor {value,label:"record"}, result, reason, source, checked },
  fit { value, label: "your-input", basis },
  timeline { factor {value,label:"your-input"}, inputs, expected_start, unemployment_deadline, slack_days, closures[], flags[], arithmetic },
  override { decision, reason, label: "your-input" }   // only when the posting states no sponsorship
  context { funding_80days, form_d_sample_hits, lca_median_salary_all_titles, bls_national_median_15_1252 },  // never scored
  missing[] { missing: <reason-code>, detail },
  decision { recommendation, machine_recommendation, composite, reason, arithmetic },
  next_action
}
```

**Human report: `triage-report.md`** has these sections in order:

1. Executive summary: plain language, no paths.
2. Decisions and next actions: one table row per posting.
3. Evidence per role: every value with its label in brackets.
4. What this run could not verify.
5. Run record: the technical header.

*Reader:* the student. *Decision enabled:* which postings get tailoring time this week, which companies go on the networking list, and which to drop.

The scorer's own `role-scores.json` and `role-scores.md` are written beside them, unchanged.

## Next action per result (the 3-3-2 connection)

| Result | Next action | Which hours |
|---|---|---|
| **Apply** | Tailor the application, and ask for a referral first | 2 research-and-apply hours, with the referral ask in the 3 networking hours |
| **Consider** | Resolve the named soft spot (senior-only sponsor, thin record, tight timeline) in a 20-minute informational conversation, then decide | 3 networking hours |
| **Skip — liveness gate, sponsor Proven/Likely** | "Network, don't apply": the sponsor is real, the posting is closed | 3 networking hours |
| **Skip — posting says no sponsorship** | Drop the posting. Optionally ask a contact whether the policy is team-specific | networking, low priority |
| **Skip — timeline or low composite** | Drop it. Spend no tailoring time | none |
| **Not scored** | Do the named hand check (USCIS hub lookup, open the posting, re-run liveness, add fit), then re-run | ≤ 10 minutes of research hours each |

## Stop conditions

Stop and do not invent a value when:

- G0 fails. The run exits 2 and writes nothing.
- Asked to score a blank `Total Approvals` as 0, or to fuzzy-match a company name. Refuse: either one fabricates a record.
- Asked to call the network from the prototype. Liveness comes only from a saved `ats:liveness` log.
- Asked to read `private/`, `search/resume.json`, or `data/ats/` for a committed run. Use a fictional persona.
- Asked to lower `min_approvals_for_proven`, raise `comfort_days`, or edit the sample scenario after a run so that a preferred role passes. That cherry-picks the result. Change parameters only before a run, and log the change.
- Asked to apply, email, or submit anything. The recipe ends at G5 with a human decision.
- The skip rate of scored roles is under 50%. Don't tune the rules. Report it. In the sample, the postings were hand-picked to look entry-level, which lowers the skip rate.

## Logging rules

- One file per run in `logs/runs/2026fa-o7580-<n>.md`, using the template below. **Never edit `logs/RUN_LOG.md`.**
- No contact details, no real résumé content, no private application notes. The persona is fictional.

## Run-log template (`logs/runs/2026fa-o7580-<n>.md`)

```markdown
# Run <n> — decgrad-swe1-sponsor-level v<recipe_version> — <YYYY-MM-DD>

## Executive summary
<two or three plain sentences: what was checked, what came out, what a person still has to decide>

## Run record
- **Recipe:** recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.md v<version>
- **Mode:** sample | live
- **Inputs:** scenario <path>; liveness log <path> (ran <date>); CSV <path> (<rows> rows); Form D samples <n> files
- **Command:** <exact command>
- **Outputs:** <out-dir>/triage-log.json, triage-report.md, roles.json, role-scores.json, role-scores.md
- **Result:** evaluated <n> → Apply <a> · Consider <c> · Skip <s> · Not scored <m> (skip rate of scored <r>)
- **Missing-reason counts:** <code>: <n>, …
- **Tests:** <test command> → <pass>/<total>
- **Open issues:** <what did not work / what is still missing>

## Gate decisions
| Gate | Decision | By | When | Evidence |
|---|---|---|---|---|
| G1 entity matches | cleared / blocked | <named human> | <date> | <rows checked> |
| G5 per-role decisions | <role → decision> | <named human> | <date> | triage-report.md |
```
