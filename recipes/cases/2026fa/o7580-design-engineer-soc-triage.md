---
status: DRAFT
todos_open: 6
last_gate: "live re-run with author-confirmed inputs + every gate cleared, 2026-10-20, logs/runs/2026fa-o7580-2.md#gate-decisions"
attestation: null
recipe_version: 0.1.0
---

# o7580-design-engineer-soc-triage — Lane, SOC and sponsorship triage for a design-engineer on F-1 OPT

## Executive summary

**What it does.** It takes a list of postings for hybrid design-and-engineering jobs: UX engineer, front-end engineer, web design engineer, product designer. It answers five questions from shipped records and a saved liveness check:

1. Is this really software-interface work, or does the title only say "design"?
2. Which occupation codes could an employer file it under for a visa, and what does each code pay nationally?
3. Has this employer sponsored visas for *this kind* of job at *this* level?
4. Is the posting still open?
5. Can the candidate start before the post-graduation work permit's 90-day unemployment allowance runs out?

It passes the evidence to the engine's existing scorer for an Apply / Consider / Skip call. Beside each call it gives the occupation's AI-resilience score, and it **refuses** that score when the government row is blank.

**Who it is for.** An F-1 student finishing a STEM master's in December 2026, with about two years of software experience and a small public design portfolio. This student applies to both front-end engineering and product-design jobs from Boston, remote US, and some relocation cities.

**What it found on its first live run (2026-10-19).**
- 1,373 jobs on 13 company boards yielded 9 US postings in or near the lane. Two were not interface work at all: an industrial-design role, and a sales role that matched "ux" inside "Sioux Falls".
- The two "Product Designer, New Grad" postings at a top design-title sponsor accept only 2027 graduates, so they are closed to a December-2026 graduate.
- In the whole sponsorship file, no Massachusetts employer lists a junior or mid-level UX or product-design title with three or more approvals.
- The occupation most UX jobs fall under has no AI-resilience score in the shipped data.

**What it decides, and what it doesn't.** It decides which postings deserve tailoring time. It never applies and never fills a missing record with a guess. Every classification and every posting detail waits for the candidate to confirm it.

This file is for the agent. The human card is `recipes/cases/2026fa/o7580-design-engineer-soc-triage.card.md`.

**Handoff condition (done when):** `triage.mjs` exits 0 and writes `triage-log.json` and `triage-report.md`. Every role has one outcome: Apply, Consider, Skip, Skip (out of lane), or Not scored with at least one reason code. Every number passed to the scorer is in [0, 1] and carries a source label. A named human has then confirmed the G1/G2 classifications and the posting fields, and recorded a G6 decision per Apply/Consider row in the run log. "Looks right" is not the condition.

## Lifecycle claim

**DRAFT.** The run evidence is stronger than the label. A live run against real postings, real liveness output and the full shipped CSV/BLS tables completed, with 17 offline tests and 8 break attempts. The constitution still blocks promotion for two reasons:

1. **SPECIFIED requires zero open typed TODOs.** This recipe deliberately carries six proposals (below), as the assignment asks.
2. **Every human gate was cleared on 2026-10-20** (G1, G2, G4, G5, fit, and G6 for all four Apply/Consider rows), recorded in `logs/runs/2026fa-o7580-2.md`. That meets the RUNNABLE-LIVE gate test except for the TODO rule above.

**Path to promotion:**
1. The six proposals are either closed with evidence or moved to their own tracked record.
2. A re-run follows.

Only then can `status` move to RUNNABLE-LIVE, with `last_gate` pointing at that entry. `attestation` stays `null` until VERIFIED.

## Purpose — and exactly when to use it

Use it when **all** of these hold:
- You will need H-1B sponsorship after OPT.
- You apply to *both* interface-engineering and product/UX-design roles.
- You have a list of 5–30 postings and only a few research-and-apply hours this week.

Don't use it for pure back-end SWE triage. The earlier recipe `decgrad-swe1-sponsor-level` covers that. Don't use it for graphic, brand or industrial design either: this mode drops those as out of lane.

The question it answers per posting: **tailor, network first, skip, or check by hand, and if I get an offer, what occupation code should I ask about?**

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout and the Known gaps. Item 3 matters here: the scorer weights role quality 0.0.
3. `DATA_CONTRACT.md` §Zero-Conditions — no personal data in tracked files.
4. `data/80-days-to-stay/80-days-csv/README.md` and `data/bls/BLS-audit.md`.
5. `scripts/score/role-scorer.mjs` — the composite, the gate multipliers, and the missing-gate default (`?? 1`).
6. This recipe and its card.

## Source inventory

| Source | Exact path or command | Exists? | Used for | Label |
|---|---|---|---|---|
| 80 Days master CSV (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | yes | `company_name`, `state`, `city`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` | record |
| BLS/O*NET compact (1,016 rows) | `data/bls/compact/soc_occupation_compact.csv` | yes | per candidate SOC: `annual_median_wage` (OEWS 2024), `job_zone`, `cognitive_pivot_score`, `alternate_titles_sample` | record |
| ATS scan | `REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/portals.design-engineer.yml npm run ats:scan -- --dry-run` (and the `.all-us.yml` twin) | yes (`scripts/ats/scan.mjs`) | which design-lane postings are open at chosen boards | record |
| ATS provider detection | `cd scripts/ats && python3 detect-ats.py <companies…> --output <csv>` | yes | finds a company's Greenhouse/Lever board when a guessed board 404s | record |
| Liveness checker | `npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.urls.txt`, stdout saved to `…/scenarios/design-engineer.liveness.log` | yes (`scripts/ats/check-liveness.mjs`) | posting liveness (a gate) | record |
| Composite scorer | `scripts/score/role-scorer.mjs`, called by the prototype as a CLI, unchanged | yes | Apply / Consider / Skip + per-term trace | scorer output |
| **Prototype — triage** | `node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs [--as-of D] [--days-used N] [--out-dir dir]` | yes (this contribution) | gates G0–G5, `roles.json`, scorer call, log + report | — |
| **Prototype — audit** | `node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs --state MA` | yes (this contribution) | whole-file counts of design-lane titles and blank BLS rows | record (audit) |
| Tests / break harness | `node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs` · `bash scripts/contrib/2026fa/o7580-design-engineer-soc-triage/break-tests.sh` | yes | offline fixtures; deliberate break attempts on the real data | — |
| Scenario | `scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.live.json` | yes | fictional persona (Ananya Iyer) + 9 real postings + posting fields | your-input (agent-transcribed until confirmed) |
| Posting text | public Greenhouse/Lever JSON, saved **outside the repository**, on the contributor's machine only (first kept in gitignored `private/`, moved out because `pii-scan` reads gitignored files and flagged the employers' accommodation e-mail addresses) | local only, never committed | source of the transcribed posting fields and short quotes | — |
| OPT rule | 8 CFR 214.2(f)(10)(ii)(E): 90 days of unemployment on post-completion OPT | external regulation | `unemployment_ceiling_days: 90` | your-input — re-read the current CFR before relying on it |

**Not used, on purpose:**
- `npm run bls:local-wage`: its metro inputs (`data/bls/local-wage/*.csv`) are not in this checkout, and the scorer reads no wage.
- The Form D samples: funding is not a question this mode asks.
- `scripts/sec/validate-h1b-join-sample.py`: needs full data that doesn't ship.
- The `snickerdoodle` CLI: roadmap, not runtime.

## Parameters (DEFINE closures, each with its reasoning)

| Parameter | Value | Reasoning |
|---|---|---|
| `tier_p` Proven / Likely / Possible / None | 0.9 / 0.6 / 0.3 / 0.0 | Same values as Ch.11 and the earlier recipe, so a tier means the same thing everywhere in the engine. |
| `min_approvals_for_proven` | 3 | One or two approvals can be a single person's petition plus a renewal. Three is the smallest count that suggests a repeated practice. A judgment, not a statistic. |
| `default_hiring_lag_days` | 45 | Assumption for application-to-offer. Override per role with `hiring_lag_days` when a recruiter states a timeline. |
| `comfort_days` | 30 | Slack ≥ 30 days gives timeline factor 1; below that it scales linearly. |
| `buffer_days` | 14 | Held back from the 90 days for I-9 and onboarding paperwork after an offer. |
| Level rule | `senior, sr, staff, principal, lead, manager, director, head, vp, chief, founding, iii, iv` = above level; "II" is at level | Two years of experience is hired at I/II. "Founding" designers are hired for seniority. |
| **Candidate SOCs per family** | see the family table | **your-input** (a domain mapping, not a record). The wage and score read for each candidate *are* records. Which code an employer actually filed is unknowable from shipped data; see proposal 1. |

## Title families (G1) — the rule this mode adds

Titles are classified by ordered word-boundary rules in `lib.mjs` (`FAMILY_RULES`), first match wins. **Out-of-lane design families are tested first**, so "Mechanical Design Engineer" never reaches the UX rules.

| Family | Example titles | Lane | Candidate SOCs (your-input) | Why these codes |
|---|---|---|---|---|
| `ux-design` | Product Designer, UX Designer, UI/UX Designer, UX Researcher | **in** | 15-1255.00, 27-1021.00, 27-1024.00 | UX/product design is the core of 15-1255 (Web and Digital Interface Designers). Older or design-led employers also file "designer" titles under the arts-and-design codes. **This is the ambiguity the mode exists to surface.** |
| `hybrid-design-engineering` | Web Design Engineer, UX Engineer, Design Technologist | **in** | 15-1255.00, 15-1254.00, 15-1252.00 | Interface design plus production code; all three are computer occupations. |
| `ui-engineering` | Software Engineer II, Frontend; UI Developer; Web Developer | **in** | 15-1254.00, 15-1252.00 | The shipped O*NET samples list "Front End Developer" under **both** 15-1254 and 15-1255 (record). "Software Engineer" titles are usually filed as 15-1252. |
| `software` | Software Engineer | in (adjacent) | 15-1252.00 | Used mostly as company-side evidence for front-end postings. |
| `graphic-brand` | Graphic, Brand, Motion, Visual Designer | out | 27-1024.00 | Arts-and-design occupation, not a design-*engineer* lane. |
| `industrial-design` | Industrial Designer | out | 27-1021.00 | Physical products. |
| `hardware-design` | Mechanical / ASIC / RTL / FPGA / Physical / Verification Design Engineer | out | 17-xxxx | The word "design" is a false friend. |
| `architecture` | Architectural Designer | out | 17-1011.00 | Buildings. |
| `management` | Head of Design, Director of Product Design | out | 11-xxxx | Not an individual-contributor role. |
| `unrelated` | Territory Account Executive … Sioux Falls | out | — | A scanner false positive. |
| `ambiguous-design` | Designer, Design Engineer, Design Lead | **not scored** | — | Names no discipline. The person sets `family_override { family, basis }`, labeled your-input. |

**Family-matched sponsorship evidence:** a `ux-design` posting counts only ux/hybrid titles. A `ui-engineering` posting counts ui/hybrid/software titles. A `hybrid` posting counts ux/hybrid/ui titles. A hardware sponsor's "design" titles never count as design evidence.

**Known misclassifications (from the full-file audit):** "Visual Designer" sits in `graphic-brand` although some employers use it for interface work, and a person catches that at G1. *Fixed 2026-10-21:* "Solution Engineer Frontend/Backend - Field Services" (NewStore) was read as `ui-engineering`, and it was the only Massachusetts at-level ui-engineering title with ≥3 approvals. Customer-facing solutions, sales and field-engineer titles now classify as `unrelated`, with regression test 3. The rule touched 14 sponsored titles, all sales or solutions roles, and changed no posting in the run.

## Phase gates (hard stops)

A role that fails G1–G4 never reaches the scorer. **Liveness (G4) and eligibility/timeline (G5) are gates, not votes**: they enter the scorer as multipliers, so a closed gate scores 0. The prototype also refuses to call the scorer unless every term is a number in [0, 1]. That works around the scorer's missing-gate default of `?? 1`, which would score an absent gate as fully open.

| Gate | Testable condition | Pass → | Fail → | Who clears |
|---|---|---|---|---|
| **G0 Inputs** | scenario parses; persona has `program_end_date`, `opt_start_date` (YYYY-MM-DD), `unemployment_ceiling_days`, `prior_experience_months`, `authorization`; params complete; role ids unique; CSV and BLS files carry the named columns; liveness log has ≥ 1 result line; out-dir is inside this contributor's namespaces | G1 | exit 2, **nothing written** | machine |
| **G1 Lane** | `classifyTitle(title)` gives an in-lane family, or a `family_override` carries a basis | G2 | out-of-lane family → **Skip (out of lane)**, no lookup spent; `ambiguous-title-family` or `bad-family-override` → Not scored | **human** confirms every family in the report |
| **G2 Employer** | exactly one CSV row whose exact-normalized name equals the input; state only breaks a tie | G3 | `no-company-match`, `ambiguous-company-match` | **human** confirms the matched entity (name, city, state shown) |
| **G3 Sponsorship** | `Total Approvals` non-blank → family-matched tier | tier + p | `no-sponsorship-record`: **blank is absence of a join, not zero** | human checks the USCIS H-1B Employer Data Hub for blanks |
| **G4 Liveness** *(gate)* | posting URL in the saved log as `active` (1) or `expired` (0) | G5 | URL absent → `no-liveness-record`; `uncertain` → `liveness-uncertain` | human opens every `uncertain` posting |
| **G5 Eligibility + OPT clock** *(gate)* | factor = 0 if any closure holds: `grad-window-excludes`, `requires-clearance-or-citizenship`, `experience-cap-excludes`, `start-before-work-authorization`, `unemployment-clock-exceeded`. Otherwise `min(1, slack / comfort_days)`. A stated experience *minimum* above the candidate's months is a **flag**, not a closure | scorer | factor 0 → Skip (gated) | **human** re-reads each posting and sets `posting.confirmed_by` |
| **G6 Decision** | scorer exit 0; report written; each scored row has a next action | named human records a decision per Apply/Consider row in the run log | stop | **human** |

**Clock arithmetic (G5):**
- `clock_from = max(as_of, opt_start_date)`
- `deadline = clock_from + (90 − days_used − buffer)`
- `expected_start = max(fixed start, or as_of + hiring_lag, opt_start_date)`

**Fit** is a vote, not a gate. An AI-drafted fit goes to the scorer labeled `model-judgment`, and becomes `your-input` only when `fit.confirmed_by` is set.

**Posting says "no sponsorship":** `posting.states_no_sponsorship { quote, read_on }` becomes the scorer's own `override: { decision: "Skip", reason }`. The machine recommendation stays visible beside it.

## Cognitive Pivot readout (reported beside the decision, never inside it)

For each in-lane posting, the report lists every candidate SOC with:
- its national median wage (OEWS 2024);
- its `cognitive_pivot_score`: the mean of nine O*NET reasoning, judgment and systems Level ratings, on the 0–7 Level scale;
- the wage gap across the candidates.

It is **not** passed to the scorer, because the scorer weights `role_quality` at 0.0 (DOMAIN.md known gap 3), and passing it would change nothing while looking like it did.

**Refusal rule:** a blank `cognitive_pivot_score` is reported as `refused`. It is never estimated. The 15-1255.00 row ships with no O*NET ability/skill ratings. Its sibling 15-1255.01 (Video Game Designers) shares the BLS code and *has* a score (3.792), and borrowing it is exactly the plausible guess this mode refuses. A missing row is reported as `no-soc-row` (break test B2).

## Steps

| # | Step | Labor | Command / artifact |
|---|---|---|---|
| 1 | Pick boards by a rule fixed **before** scanning (at-level design-title sponsors in the CSV, plus Boston employers); write the portals file | Human (agent may draft) | `scenarios/portals.design-engineer.yml` |
| 2 | Scan, dry-run, both passes; resolve any 404 board with `detect-ats.py` and re-scan | AI | `ats:scan -- --dry-run` (×2), `detect-ats.py` |
| 3 | Copy every US title match into the scenario, including false positives; transcribe posting fields with a short quote each | AI drafts; **human re-reads every posting** | `scenarios/design-engineer.live.json` |
| 4 | Liveness on the posting URLs (plus one deliberately dead URL) and save stdout with a `# ran:` line | AI | `ats:liveness -- --file …urls.txt > …liveness.log` |
| 5 | Run the triage and the audit | AI | `triage.mjs`, `title-audit.mjs` |
| 6 | Read the report; clear G1/G2; open every `uncertain` posting; confirm or change each fit and posting field | **Human** | `triage-report.md` |
| 7 | G6: decide per row and record it | **Human** | `logs/runs/2026fa-o7580-<n>.md` |
| 8 | Re-run when time passes (`--as-of`, `--days-used`) | AI | a stale run is not a decision (B1 shows every gate closing by 2027-03-01) |

## What it can verify (from records, by a fixed rule)

- That a posting title falls into a named family by fixed rules, and which rule fired.
- That the employer resolves to exactly one row in the shipped CSV, and which row.
- That row's recorded approvals, denials and approval rate, and which of its **top sponsored titles** are in the posting's family, at or above level.
- Each candidate SOC's national median wage, job zone and Cognitive Pivot score as shipped — **and that 15-1255.00's score is blank**.
- That "Front End Developer" appears in the shipped alternate-title samples of both 15-1254 and 15-1255.
- What `ats:scan` and `ats:liveness` printed, and when.
- The gate arithmetic and the composite, shown in full.
- Whole-file counts, cross-checked by an independent Python parser (break test B8):
  - 119 sponsored titles contain "design"; 65 of them are out of lane or unclassifiable.
  - 26 employers nationally list an at-level UX/product-design title with ≥ 3 approvals.
  - In Massachusetts the count is 0.

## What it cannot verify — the boundary

- **Which SOC code an employer actually files a design role under.** This is the core asymmetry, and the shipped data cannot close it: the CSV has titles, not codes. The wage stakes are visible (15-1255 $98,090 vs 27-1024 $61,300 nationally, a $36,790 gap), but not which side a given employer lands on. Proposal 1.
- **An AI-resilience score for 15-1255.00.** It is blank in the shipped O*NET row. Refused, not estimated. Proposal 3.
- **Whether a title maps to an SOC by O*NET's full alternate-title list.** Only an 8-title sample ships per row, so the family→SOC mapping is a domain rule (your-input), not a lookup. Proposal 2.
- **Junior design sponsorship that fell off a truncated top-titles list.** A large sponsor can look senior-only, or design-free.
- **Current sponsorship policy.** Approvals are history; only posting text read by a person says what happens now.
- **Clearance and citizenship in law.** The mode closes the gate when a posting *states* a clearance requirement. Whether a specific clearance is truly unavailable to this candidate is a legal question for the school's international student office.
- **STEM OPT specifics.** Whether the employer uses E-Verify, and whether the job is "directly related" to the degree for the I-983, are not in any shipped file.
- **Whether an "active" posting is a real opening.** Two of nine came back `uncertain`: Formlabs' and Squarespace's career pages show no apply control the checker recognizes.
- **Boards the scanner can't reach.** Rippling, Scribd, Remitly and DraftKings are on neither Greenhouse nor Lever (`detect-ats.py`), so their postings were never seen. Proposal 6.
- **Fit and posting fields.** A person types or confirms them; the tool only does the arithmetic.
- **The EAD date.** `opt_start_date` is the requested start; USCIS processing delay is not modeled.

## Proposed additions (typed, not built)

1. [TODO: DATA SOURCE] **DOL LCA disclosure rows with `SOC_CODE`, `JOB_TITLE`, `WAGE_LEVEL`, `EMPLOYER_NAME`**, at `data/dol/lca/FY<yyyy>.csv` (path does not exist). *Why it belongs:* it is the only public record of which SOC code an employer filed a design title under, and at which wage level. It turns the mode's central "cannot verify" into a lookup: "Palantir filed *Product Designer* as 15-1255, Level II". The 80 Days README says the CSV was built from this source, but the per-petition rows don't ship. *Closure evidence:* the file exists at the path, with a provenance note (FY, download date, URL).
2. [TODO: DATA SOURCE] **The full O*NET `Alternate Titles.txt`** (db 30.x), at `data/bls/onet/Alternate Titles.txt`. *Why:* the compact table ships only an 8-title sample per occupation. The full list would let G1 map a posting title to SOC by record and retire most of the your-input family→SOC mapping. *Closure:* the file is present, plus a provenance line; the classifier reports which titles matched the record.
3. [TODO: DATA SOURCE] **O*NET ability/skill ratings for 15-1255.00, or the recorded reason they are absent**, by re-running `scripts/bls/extract-soc-occupation-table.py` against a newer O*NET release. *Why:* the occupation this lane depends on is the one with no AI-resilience score. 122 of 1,016 rows share the gap. Until then the refusal stands. *Closure:* a non-blank score with the release named, or a logged statement that O*NET has not rated it.
4. [TODO: APPROVE] **Maintainer decision on `scripts/ats/scan.mjs` title and location matching.** Substring matching let "ux" match "Sioux Falls". The location `allow` list let "Remote" and "United States" pass postings in Vancouver BC, Warsaw and Chennai until each place was blocked by name. The proposed fix is word-boundary title keywords and an explicit country field where the provider gives one. It touches a maintained file, so it needs a logged maintainer gate decision, not a contributor patch.
5. [TODO: DEV] **Deterministic posting-field extractor** (`extract-posting-fields.mjs` in this folder): regexes over saved posting JSON for graduation windows ("graduating in 2027"), clearance or citizenship statements, experience minimums and caps, and no-sponsorship statements. Every extracted field is shown to the human before it counts. *Handoff:* from the saved JSON it reproduces the 2027 window on both Palantir new-grad postings, the clearance quote on both US-Government postings, and "3+ years" on Toast and Squarespace, with zero extra fields on the other postings.
6. [TODO: DEV] **Ashby and Workday detection in `detect-ats.py`'s provider list.** Today it tries only Greenhouse and Lever, so 4 of the 17 chosen boards were unreachable. *Handoff:* each of the 4 companies resolves to a board, or to `not_found` with the providers tried listed.

## Output contract

Two artifacts, two readers (P5), written to `--out-dir`. The out-dir must be under `course/2026fa/submissions/o7580/`, this contributor's script folder, or the OS temp dir.

**Agent log: `triage-log.json`**

```
recipe, recipe_version, mode, as_of, generated_at,
inputs { scenario, liveness_log, liveness_log_meta { ran, command, exit }, csv, csv_rows, bls, bls_rows },
persona { …, label: "your-input" }, params { …, label: "your-input" },
summary { evaluated, out_of_lane, not_scored, scored, apply, consider, skip, skip_rate_of_decided, cognitive_pivot_refusals },
missing_counts { <reason-code>: n },
scorer { path, input, stdout, note },
gate_decisions_pending [ … ],
roles[] {
  role_id, company_input, title, location, posting_url, outcome,
  lane { family, auto_family, lane, label, basis, candidate_soc[], soc_risk, why },
  soc_readout { candidates[] { onet_soc_code, title, job_zone, annual_median_wage, oews_year,
                               cognitive_pivot_score, cognitive_pivot_status, label: "record" },
                wage_spread { min, max, gap }, cognitive_pivot_range, primary_refused },
  company { value, city, state, label: "record", source },
  sponsorship { tier {value,label,basis}, p {value,label:"your-input"}, approvals, denials, approval_rate,
                at_level_matched[], above_level_matched[], title_families[] },
  liveness { factor {value,label:"record"}, result, reason, source, checked },
  fit { value, label: "your-input" | "model-judgment", basis, confirmed_by, drafted_by },
  eligibility_timeline { factor, inputs, expected_start, unemployment_deadline, slack_days, closures[], flags[], arithmetic },
  override?, decision { recommendation, machine_recommendation, composite, reason, arithmetic },
  missing[] { missing: <reason-code>, detail }, next_action
}
```

**Human report: `triage-report.md`**, sections in order:
1. Executive summary (plain language, no paths).
2. Decisions and next actions: one row per posting.
3. The SOC question: candidate codes, wages, and Cognitive Pivot with refusals.
4. Evidence per posting: every value with its label.
5. What this run could not verify.
6. Gates waiting on a person: a checklist.
7. Run record.

*Reader:* the student. *Decision enabled:* which postings get tailoring time this week, which become networking conversations, which are dropped, and which occupation code to ask a recruiter about at the offer stage.

**Audit: `design-title-audit.json` + `.md`** (from `title-audit.mjs`), written beside the run. The scorer's own `role-scores.json` / `role-scores.md` are written there too, unchanged.

## Next action per result

| Result | Next action |
|---|---|
| **Apply** | Tailor. Lead with the portfolio piece that shows shipped interface code, not only mockups. Ask for a referral first. For a `ux-design` role, also ask at the offer stage which SOC code it would be filed under. |
| **Consider** | Network first: name the soft spot (e.g. "sponsors front-end-matched titles, but only above this level") and ask about it in a 20-minute conversation. |
| **Skip — gated** | Drop it. If the sponsor is Proven and only liveness closed, the company goes on the networking list. |
| **Skip (out of lane)** | Drop it without a lookup. It is not this lane. |
| **Not scored** | Do the named hand check (open the posting, set a family override with a basis, check the USCIS hub), then re-run. |

## Stop conditions — refuse rather than guess

Stop and do not produce a value when:
- **G0 fails.** Exit 2, nothing written (B3).
- **A posting's family is ambiguous and there is no documented override.** Refuse to score it (B6). Never guess a discipline from "Designer".
- **The primary candidate SOC's Cognitive Pivot score is blank or missing.** Report `refused` or `no-soc-row`. Never substitute 15-1255.01 or a national average (B2, tests).
- **Asked to treat a blank `Total Approvals` as 0, or to fuzzy-match a company name.** Either one fabricates a record.
- **Asked to pass `role_quality` into the scorer to make the AI-resilience score "count".** Refuse while the maintained weight is 0. It would change nothing and imply that it did.
- **Asked to fetch postings from inside the prototype.** Network belongs to `ats:scan`, `ats:liveness` and `detect-ats.py`; the triage reads saved outputs only.
- **Asked to edit posting fields, fit or parameters after a run so that a preferred posting passes.** Change inputs only before a run, and log the change.
- **Asked to copy posting text, the persona's real résumé or tracker into a tracked file.** Posting JSON stays off the tracked tree; only short quotes and fields go into the scenario.
- **The skip rate of decided roles is under 50%.** Report it; don't tune the rules to hit it.

## Logging rules

- One file per run in `logs/runs/2026fa-o7580-<n>.md`. **Never edit `logs/RUN_LOG.md`**: it is a protected path for contributors (`.github/workflows/contrib-gate.yml`).
- No contact details, no résumé content, no private application notes. The persona is fictional (DATA_CONTRACT.md §Zero-Conditions): no real person's visa status, dates or experience appear in a tracked file.

## Log template for `logs/RUN_LOG.md`

Contributors write this into `logs/runs/2026fa-o7580-<n>.md`; the maintainer copies it into `logs/RUN_LOG.md` at integration. It uses the repository's own entry format (`recipes/_shared.md` §Logging Rules), one entry per run:

```markdown
## YYYY-MM-DD — design-engineer SOC triage, <live run | confirmed re-run | change>

- **Recipe:** manual (`recipes/cases/2026fa/o7580-design-engineer-soc-triage.md` v<version>)
- **Inputs:** <scan and portals file, liveness log and its date, scenario, CSV and BLS rows>
- **Outputs:** <out-dir and files>
- **Result:** evaluated <n> → out of lane <o> · not scored <m> · Apply <a> · Consider <c> · Skip <s>; Cognitive Pivot refusals <k>; tests <p>/<t>
- **Open issues:** <unreachable boards, uncertain liveness, pending gates, what was not used and why>
```

No secrets, no contact details, no résumé content, no private application notes.

### Detailed run record (`logs/runs/2026fa-o7580-<n>.md`, below the entries)

```markdown
# Run <n> — o7580-design-engineer-soc-triage v<recipe_version> — <YYYY-MM-DD>

## Executive summary
<two or three plain sentences: what was checked, what came out, what a person still has to decide>

## Run record
- **Recipe:** recipes/cases/2026fa/o7580-design-engineer-soc-triage.md v<version>
- **Mode:** sample | live
- **Inputs:** scenario <path>; liveness log <path> (ran <date>); scan outputs <paths>; CSV <path> (<rows> rows); BLS <path> (<rows> rows)
- **Commands:** <each exact command>
- **Outputs:** <out-dir>/triage-log.json, triage-report.md, roles.json, role-scores.json, role-scores.md, design-title-audit.{json,md}
- **Result:** evaluated <n> → out of lane <o> · not scored <m> · Apply <a> · Consider <c> · Skip <s> (skip rate of decided <r>); Cognitive Pivot refusals <k>
- **Missing-reason counts:** <code>: <n>, …
- **Tests:** <command> → <pass>/<total>; break harness <command> → <summary>
- **Open issues:** <what did not work / what is still missing>

## Gate decisions
| Gate | Decision | By | When | Evidence |
|---|---|---|---|---|
| G1 lane per posting | confirmed / changed | <named human> | <date> | triage-report.md §Decisions |
| G2 employer entity | confirmed / blocked | <named human> | <date> | rows checked |
| G5 posting fields re-read | confirmed / corrected | <named human> | <date> | postings re-opened |
| G6 per-row decisions | <role → decision> | <named human> | <date> | triage-report.md |
```
