---
status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE
todos_open: 5
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# chethangowda-git-ai-sde-coop-h1b: AI Engineer co-op to H-1B triage

## Executive summary

**What.** A procedure for sorting AI Engineer roles for a graduate student who wants a Spring co-op that could become a full-time job, and who will need an employer to sponsor a work visa. It checks each company's past visa-sponsorship counts against real records. It stops roles whose posting status or start dates are unknown, and it scores the rest under two plans: co-op first (full-time from Sep 2027) or straight to full-time (May 2027).

**Who.** The agent runs it. The student, or a career advisor, reads the report and decides.

**What it decides.** For each role and plan: Apply (tailor an application), Consider (network into the company first), or Skip. Missing facts are reported as missing, never filled in. It **cannot** tell whether a co-op converts to a full-time offer, because no such data exists in this project.

Two customers: this file is for the agent; `recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.card.md` is for the human.

**Handoff condition (done when):** `triage.mjs` exits 0. The test prints `16/16 checks passed`. `out/triage-log.json` has `counts.stopped_before_scorer + counts.sent_to_scorer = counts.candidates`. Every stopped role carries exactly one reason code, and no stopped `role_id` appears in any `out/<scenario>/roles.json`. "Looks right" is not the condition.

## Purpose and source inventory

| Source | Path / command | Label | Status |
|---|---|---|---|
| Sponsorship history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (columns `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` only) | record | shipped, read-only |
| Scorer | `scripts/score/role-scorer.mjs` via CLI with `--out-dir` | — | shipped, unmodified |
| Input shape | `data/examples/ch11-roles.json` | — | shipped |
| Persona | `search/examples/priya-nair/profile.yml` (fictional; adjusted to a current student, a stated mismatch) | your-input | shipped, read-only |
| Candidates | `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/fixtures/candidates.sample.json` (hypothetical postings) | your-input | this contribution |
| Prototype | `node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs` | — | this contribution |
| Test | `node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs` | — | this contribution |
| Liveness tool | `npm run ats:liveness -- <url>` | record (if it ran) | **failed in this environment** (Playwright browser missing) |

Data run on: the shipped 80 Days CSV (30,370 lines) and hypothetical postings. No SEC Form D data and no BLS data are used.

## Proposed additions

- [TODO: DEV] Automated liveness: call `npm run ats:liveness` per posting URL and write `{factor, source: "record", checked_on}`. Today liveness is a your-input value or a human check, because the tool failed here (Playwright browser missing).
- [TODO: DATA SOURCE] Co-op-to-full-time conversion record per company. Without it, the co-op path's main premise cannot be verified. The repo has no such dataset.
- [TODO: DEV] Role-specific sponsorship: match the posting's SOC against `top_job_titles_sponsored` (free text). Today's counts are company-wide.
- [TODO: DEV] Fit vote: a bounded model judgment of persona against posting text, labeled `model-judgment`. Today fit is not supplied, so the composite is sponsorship × gates only. A Proven sponsor scores 0.315, just above the 0.30 Apply threshold.
- [TODO: DEFINE] Role-quality weight: the scorer's `role_quality` weight is 0.0, unpinned. This recipe does not use role quality in the score and does not propose a number. A human must set and justify it before BLS wage data can affect a decision.

## Phase gates

Each role stops at the first failed gate. Stops happen **before** the scorer, because the scorer defaults a missing gate to 1 (open).

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G0 inputs exist | `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && test -f scripts/score/role-scorer.mjs` | run | exit 2, nothing written |
| G1 company-in-record | exact (case-insensitive) `company_name` match; `Total Approvals` non-blank | tier lookup | `no-company-match` / `ambiguous-match` / `no-sponsorship-record` |
| G2 gate-values-present | role has numeric `liveness.factor` and `start_window.from/to` (YYYY-MM) | send to scorer | `missing-gate-value: liveness` / `missing-gate-value: timeline` |
| G3 liveness (gate) | scorer: liveness factor > 0.05 | votes count | Skip (gated) |
| G4 timeline (gate) | scorer: timeline factor > 0.05; factor is 1.0 if the scenario's available month for the role type falls inside the role's start window, else 0.0 | votes count | Skip (gated) |
| G5 human decision | a named human reads `out/triage-report.md` and records Apply / network / skip per role in `logs/runs/` | next action | no action taken |

Liveness and timeline are gates (multipliers), never votes.

## Steps

1. Confirm G0 (command above).
2. Run `node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs`.
3. Read the stdout counts. Stopped plus scored must equal candidates.
4. Run the test: `node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs`.
5. Hand `out/triage-report.md` to the human (G5). Stop.

## What it can and cannot verify

**Can verify (record):**
- The exact company name exists in the 80 Days CSV, and its company-wide H-1B approval and denial counts and approval rate (row number cited).
- That a blank count is blank, not zero.

**Can check mechanically:**
- Whether a hypothetical start month falls inside a stated window. Both values are your-input.

**Cannot verify:**
- Co-op-to-full-time conversion, for any company.
- Whether a posting is live. Liveness here is your-input.
- Sponsorship for *this* role or SOC. Counts are company-wide.
- Whether the title → SOC mapping is right (model-judgment).
- What year the counts cover. The CSV has no year column.
- That the tier → p mapping (Proven ≥100 approvals and ≥95%, 0.9; Likely 10–99, 0.6; Possible 1–9, 0.3; None 0, 0.0) is correct. It is the author's choice (your-input), aligned with the p values in `data/examples/ch11-roles.json`.
- Fuzzy company names. "Databricks" will not match `DATABRICKS INC`; the role stops as `no-company-match`.

## Output contract

**Agent log:** `out/triage-log.json` with fields `recipe`, `recipe_version`, `generated`, `inputs`, `persona{value,label}`, `tier_rules{value,label}`, `counts{candidates,stopped_before_scorer,sent_to_scorer}`, `stopped[{role_id,gate,reason,detail}]`, `evidence[{…{value,label}}]`, `scenarios[{id,label,available,roles_json,results[{role_id,recommendation,composite,next_action,reason,timeline_why,arithmetic}]}]`.

**Human report:** `out/triage-report.md`.
- Sections: executive summary, run record, stopped before the scorer, evidence per scored role, one section per scenario, what a human must judge.
- Reader: the student or an advisor.
- Decision enabled: which roles get application time, which companies to network into, which to skip.

## Stop conditions and next action

| Result | Next action |
|---|---|
| Apply | tailor an application (after a human confirms liveness) |
| Consider | network into the company before applying |
| Skip | skip; no further time |
| `no-company-match` / `ambiguous-match` | human checks the exact legal name in the CSV; never guess |
| `no-sponsorship-record` | treat sponsorship as unknown; network to ask, do not apply blind |
| `missing-gate-value: *` | human supplies the value with its source, then re-run |
| CSV column missing | stop the whole run (schema drift) |

## Run-log template (`logs/runs/2026fa-chethangowda-git-<n>.md`)

```markdown
## YYYY-MM-DD — chethangowda-git-ai-sde-coop-h1b sample run

- **Recipe:** recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md v0.1.0
- **Inputs:** candidates file, sponsorship CSV path, scorer path
- **Outputs:** out/triage-log.json, out/triage-report.md, out/<scenario>/role-scores.*
- **Result:** candidates / stopped (by reason) / scored; per-scenario Apply · Consider · Skip; test N/N
- **Gate decisions:** G5: who, when, what was decided per role (or "not cleared")
- **Open issues:** typed TODOs still open; anything that failed
```
