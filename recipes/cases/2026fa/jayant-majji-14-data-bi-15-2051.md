---
status: DRAFT
todos_open: 7
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# Data / BI Analyst triage for F-1 OPT students — which occupation is this role, really?

## Executive summary

**What this is:** a step-by-step check for an international master's student on OPT who is applying to data and business-intelligence analyst jobs and needs an employer who will sponsor a work visa later.

**Why read it:** the government groups "data scientist," "business intelligence analyst," and "clinical data manager" under one occupation for wages, but scores their thinking demands separately, and for data scientists it publishes no thinking-demand scores at all. A job title alone does not tell the student which of these they are applying for, whether the employer has sponsored similar work, or whether the posting is still open.

**What it decides:** for each posting, whether to apply, consider, network, or hold it for a human, and it says plainly which facts came from records and which were judgment calls. In its first real run on six postings, one came out "apply," one "consider," one "skip," and three were held because the data could not support a decision.

This file is still a draft: seven planned improvements are open, so it is not yet a finished, specified procedure.

## Purpose

Use this mode when **all** of these are true:
- you are on F-1 OPT (or will be) and will need H-1B sponsorship;
- the posting is a data, analytics, or business-intelligence role;
- you want to know, before tailoring an application, (a) which O\*NET sub-occupation the role maps to and whether it has a role-quality score, (b) whether the employer has recorded H-1B approvals for data-type titles, (c) whether the posting is live, and (d) whether your OPT window leaves time to be hired.

Do **not** use it for "Business Analyst" roles that are operations or consulting generalist jobs. Those usually file under other SOC codes (e.g. 13-1111) and are out of scope; the mode holds them at G1.

## Source inventory

| What | Exact path / command | Used for | Label of its output |
|---|---|---|---|
| Occupation table (BLS OEWS + O\*NET) | `data/bls/compact/soc_occupation_compact.csv`, rows keyed by `onet_soc_code` (15-2051.00 / .01 / .02) | wage, employment (BLS level), ability/skill levels and `cognitive_pivot_score` (O\*NET level) | record |
| Pivot-score definition | `data/bls/BLS-audit.md`; `scripts/bls/extract-soc-occupation-table.py` (function `cognitive_pivot_score`) | "average of selected reasoning, judgment, and systems scores" | record (definition) |
| Sponsorship + funding | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `Total Approvals`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date` | record |
| Liveness | `npm run ats:liveness -- "<url>" ...` → `scripts/ats/check-liveness.mjs` | active / expired / uncertain | record |
| Scorer | `npm run score -- <roles.json> --out-dir <dir>` → `scripts/score/role-scorer.mjs` | composite, decision, per-term audit | scorer output |
| Tier p-value convention | `data/examples/ch11-roles.json` | Proven 0.9 · Likely 0.6 | your-input (convention) |

The extract script is **not run** by this mode: it rewrites the tracked occupation table.

**No stored script does the lookups** (company match, sub-occupation rows, sponsored-title check). Per the shared rules, this mode states that and does them with read-only inline Python that reads the files above, prints only safe columns, and never reads `phone`, `executive_officers`, or `board_directors`. Promoting that code is proposed below.

## Rules this mode applies (your-input, versioned)

- **Sub-occupation map v0.1:**
  - title contains "business intelligence" or "BI" → 15-2051.01;
  - "data scientist" → 15-2051.00;
  - "clinical data" → 15-2051.02;
  - plain "data analyst," "product analyst," or anything else → **no mapping; held at G1** for a human.
- **Tier rule v0.1:** Proven = Total Approvals ≥ 10 **and** a sponsored title containing "data," "analytics," or "business intelligence"; Likely = ≥ 1 approval otherwise. The bare word "analyst" does **not** count: "Financial Analyst" is not data work.
- **Timeline rule:** factor 0 if days left on OPT < hiring lag; 1 if days left ≥ 2 × lag; linear in between. Lag of 60 days is an assumption.
- **Role quality is reported, not scored.** The scorer's `role_quality` weight is 0, so the pivot score never changes a decision. A blank pivot score is reported as **missing**. It is never filled from another sub-occupation of the same BLS code.

## Proposed additions

1. [TODO: DEV] **Title → O\*NET sub-occupation mapper** as a stored, tested script implementing map v0.1, with fixtures for each branch, including the "no mapping" branch.
2. [TODO: DEV] **Mode runner** that assembles the agent log and human report from the lookup, liveness, and scorer outputs. In the first run these were assembled by hand from real outputs.
3. [TODO: DATA SOURCE] **Sponsorship by SOC code.** DOL LCA disclosure rows filtered to SOC 15-2051, so "sponsors data work" stops being a title-text proxy.
4. [TODO: DATA SOURCE] **Coverage beyond the startup filing list.** Amazon and McKinsey, two of the six postings, have no rows at all, because the CSV is built from SEC Form D startups.
5. [TODO: DEV] **Scorer: a missing `source` should be an error.** Today `role-scorer.mjs` silently labels it `record` (shown in the worked run, Break B). This is proposed to the maintainers; this mode does not edit the scorer.
6. [TODO: DEV] **Liveness: "insufficient content" should return uncertain, not expired.** On 2026-10-20 the script marked a live Pinterest posting expired; a human hand-check found it open.
7. [TODO: DEV] **Seniority flag.** Senior/Staff/Lead titles for an early-career persona go to G6 before "apply." In Break A, a role with fit 0 still scored Apply on sponsorship alone.

## Phase gates

Each role stops at the first failed gate. Every gate decision is recorded with who, what, and when in the agent log.

| Gate | Testable condition | Pass | Fail | Cleared by |
|---|---|---|---|---|
| G0 run inputs | persona OPT end date is after today; hiring lag > 0 | evaluate roles | **stop the whole run**; no scores | script check + named human |
| G1 occupation | the title maps to exactly one 15-2051 sub-occupation under map v0.1 | G2 | **held**: "no mapping" (generic or out-of-scope title) | named human picks a code or drops the role |
| G2 company match | normalized name (uppercase, punctuation stripped, trailing INC/LLC/CORP/CO/LTD dropped) equals **exactly one** CSV row | G3 | **held**: not found / ambiguous (2+ rows) | — |
| G3 sponsorship evidence | `Total Approvals` is a number (blank is **not** zero) | tier assigned | **held**: no record | — |
| G4 liveness (gate) | `ats:liveness` returned active or expired for the URL | G5 | uncertain → **held** | script; an "expired" on a JavaScript-heavy site **also** needs a human hand-check, logged separately; disagreements are logged, never silently overwritten |
| G5 timeline (gate) | timeline factor from the rule above | scorer | factor 0 → scorer zeroes the composite | — |
| G6 human review | a named human reads the report row by row before acting | act | — | named human |

## What it can verify

- Which O\*NET sub-occupation rows exist under 15-2051, and their recorded wage, employment, ability, skill, and pivot values.
- That BLS wage and employment are **identical** across the three sub-occupations, so they cannot distinguish them.
- That 15-2051.00 (Data Scientists) has **blank** ability, skill, and pivot fields.
- A company's approval count and sponsored-title list, **as shipped in the CSV**, when exactly one row matches.
- That `ats:liveness` returned a given status for a URL on a given date.
- The scorer's arithmetic, reproducible by hand: (0.35 × sponsorship + 0.30 × fit) × liveness × timeline.

## What it cannot verify

- **Which sub-occupation an employer actually files the role under.** The map is a title rule, not the employer's LCA record.
- **That an employer sponsored 15-2051 work.** The CSV has no SOC column; sponsored titles are a top-titles list, not counts per title.
- **Anything about companies outside the startup filing list** (e.g. Amazon, McKinsey). "Not found" means "no data," not "does not sponsor."
- **That a posting marked expired is actually closed.** One false expired was observed.
- **What the pivot score means for AI exposure.** The repo defines it as an average of selected reasoning, judgment, and systems levels, and makes no claim beyond that. This mode does not call it an AI-resilience score.
- **Seniority fit, or whether the tier thresholds and 60-day lag are right.**
- **Current approval counts.** They were not re-checked against the USCIS Employer Data Hub.

## Output contract

| Artifact | Reader | Contents |
|---|---|---|
| `mode-run.json` (agent log) | agent | run date, persona (no name/email), rules + versions, per role: title, URL, mapped sub-occupation or reason none, company match result, approvals (record), tier (your-input), liveness status (record), any human hand-check (who/when/result), route, reason, scorer composite + decision; gate decisions with who/what/when |
| `mode-report.md` (human report) | person | plain-language summary first; then a table per route (apply / consider / skip / held) with the role-quality context (pivot score or "missing"), and a "what this run did not verify" section |
| `role-scores.json` / `.md` | both | written by the existing scorer, unchanged |

Until proposed addition 2 exists, the agent log and report are assembled by hand from real command outputs, and say so.

## Stop conditions

The mode **refuses to score** rather than guess when:
- the OPT end date is past (stop the whole run);
- a title maps to no sub-occupation, or the company matches zero or several rows, or approvals are blank (hold that role);
- liveness is uncertain (hold);
- a pivot score is blank (still score sponsorship and fit, but report role quality as **missing**, never imputed).

If no role clears G0–G5, the scorer is not called.

## Next action per result

| Result | Next action |
|---|---|
| Apply | human checks seniority and the posting, then tailors the application |
| Consider | read the soft spot (e.g. sponsorship tier only Likely); tailor only if fit is strong |
| Skip | drop, **unless** the skip came from a liveness result a human disputes; then re-check by hand |
| Held: no mapping | decide the occupation by reading the job description, or drop |
| Held: no record | look the company up by hand under its legal name; a sponsor with evidence but no posting goes to a networking list |

## Log template (for `logs/RUN_LOG.md`)

In this repo, students record runs as `logs/runs/<term>-<handle>-<n>.md` (CONTRIBUTING.md); `logs/RUN_LOG.md` is maintainer-only. The template below is used for that file.

```
### <YYYY-MM-DD> — case-pavan-majji-14-data-bi-15-2051 v<version> · <sample|live> run · <status> (human gate <signed by NAME | NOT signed>)
Inputs: <persona (fictional), number of postings, data files used>.
Commands: <each command verbatim>.
Results: <counts by route>; scorer <Apply n · Consider n · Skip n>.
Gate decisions: <gate, who, what, when>.
Disagreements: <script vs human, kept value>.
Open issues: <list>. No personal data, contacts, or application notes.
```