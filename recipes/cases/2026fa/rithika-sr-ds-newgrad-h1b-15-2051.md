---
# corrected 2026-10-21: skipped SPECIFIED with open TODOs
status: DRAFT
todos_open: 8
last_gate: "G4 human review of the 2026-10-03 worked run by rithika-sr (course/2026fa/submissions/rithika-sr/WORKED-RUN.md); one liveness false positive found and documented"
attestation: null  # set only at VERIFIED; this recipe has run on shipped repo data only
recipe_version: 0.1.0
---

# ds-newgrad-h1b-15-2051 — Sponsor triage for an F-1 new-grad Data Scientist

## Executive summary

For an international F-1 master's student graduating December 2026 and targeting
entry-level **Data Scientist** roles (BLS SOC 15-2051) with a January 2027 start,
this recipe checks each candidate role against the repo's H-1B sponsorship
records, a posting-liveness check, and the student's OPT timeline. It returns a
sourced Apply / Consider / Skip from the **existing** scorer for roles that pass
every gate, and **holds** every role it cannot verify instead of inventing a
value. It decides where the student's two research-and-apply hours go: which
applications to tailor, which companies to network into first, and which to skip.

Chapters claimed: **Ch 11** (role scorer, called, not copied) and **Ch 9**
(BLS role quality, report-only because its scorer weight is 0).

Two customers: this file is for the agent; the card
`recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.card.md` is for the person.

**Handoff condition (done when):** every candidate role appears exactly once,
either in `scored` or in `held` of `triage-log.json`; every term in `roles.json`
carries a `source` of `record` or `your-input`; no role in `roles.json` lacks a
liveness factor; `triage-report.md` contains the "What this run did NOT verify"
section; and the offline tests pass. "Looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md` and `DOMAIN.md` (prime directive; Known gaps 3 and 9).
2. `data/80-days-to-stay/80-days-csv/README.md` (what the CSV columns mean).
3. `scripts/score/role-scorer.mjs` lines 28-110 (weights, thresholds, gate defaults).
4. `course/2026fa/submissions/rithika-sr/CHANGE-BRIEF.md` (original predictions).
5. This recipe and its card.

## Source inventory

| Input | Path | Label |
|---|---|---|
| Sponsorship + funding | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | record |
| Occupation wage | `data/bls/compact/soc_occupation_compact.csv`, row `15-2051.00` | record |
| Scorer | `scripts/score/role-scorer.mjs` via subprocess | (computes) |
| Liveness | `npm run ats:liveness -- <url>`, result transcribed into the candidates file | record |
| Persona | `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json` (fictional Sasha Jones) | your-input |
| Candidate roles | a candidates JSON (company, title, url, fit, liveness) | your-input |

Deliberately **not** used (Facts that bite): `data/sec/form-d/processed/sample/*.sample.json`
(first 50 of ~16,000 filers per quarter; a miss means "not in sample"),
`npm run bls:local-wage` (fails on a fresh clone and feeds no decision),
`scripts/sec/validate-h1b-join-sample.py` (needs unshipped data), the
`snickerdoodle` CLI (roadmap only), and the planned `data/raw/`, `data/verified/`,
`logs/gate-decisions/` folders (they do not exist).

## Recipe rules (your-input design choices, logged in every run)

| Rule | Value | Why |
|---|---|---|
| Company match | case-insensitive exact `company_name` | simplest honest first pass; misses are held, not guessed |
| Tier **Proven** | approvals ≥ 10 AND approval rate ≥ 90% AND a top sponsored title contains "data scientist" | evidence of repeated, successful DS-titled sponsorship |
| Tier **Likely** | approvals ≥ 1 otherwise | sponsors, but DS evidence or volume is thin |
| Tier **None** | approvals = 0 (a real 0, not a blank) | record of no approvals |
| Tier → p | Proven 0.9 · Likely 0.6 · None 0.0 | same values as `data/examples/ch11-roles.json` |
| Fit | person's own 0-1 rating | `your-input`; no model is called |
| Timeline factor | 0 if run date > OPT end or no unemployment days left; else min(1, available ÷ hiring_lag) where available = days until EAD start + (90 − used − buffer) | general understanding of the OPT 90-day rule; not legal advice |

## Phase gates

Each role stops at the first failed gate. Held roles are reported, never scored.

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G0 inputs | persona and candidates parse; dates are `YYYY-MM-DD`; `hiring_lag_days` > 0; `--out-dir` resolves inside `course/2026fa/submissions/rithika-sr/` or the prototype folder | continue | run stops, exit 2, `✗ stopped: <reason>`, nothing written |
| G1 sponsorship record | company found in the CSV **and** `Total Approvals` is not blank | apply tier rule | `held G1: not found` (may be a naming miss) or `held G1: no sponsorship record (not zero)` |
| G2 liveness | `liveness.status` is `live` or `closed`, transcribed from `ats:liveness` | factor 1.0 / 0.0 | `held G2: never checked`, or checker said `uncertain` |
| G3 visa timeline | timeline factor computed from persona dates and `--today` | factor passed to scorer as a gate | factor 0 → scorer returns Skip (gated) |
| G4 human decision | scorer output and report written | a named person reads the report and decides | report flags (⚠) mark roles the human must look at first |

Liveness (G2) and timeline (G3) are **gates**, not votes: the scorer multiplies by them.

## Primary stored tools

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --help
npm run ats:liveness -- "<posting url>"
```

`triage.py` calls `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>`
itself. It never edits the scorer or any tracked repo file.

## Workflow

1. Confirm data exists:

```bash
test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && test -f data/bls/compact/soc_occupation_compact.csv && echo ok
```

2. Run the offline tests (fixtures only, no network):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py" -v
```

3. Check each posting and transcribe the result into the candidates file
   (`active` → `live`, `expired` → `closed`, `uncertain` → `uncertain`):

```bash
npm run ats:liveness -- "<url1>" "<url2>"
```

4. Run the triage on the real CSV with a fixed run date:

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py \
  --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json \
  --today 2026-10-03 \
  --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
```

5. Privacy check before committing:

```bash
grep -rn "/Users/" course/2026fa/submissions/rithika-sr/ || echo "privacy: clean"
```

## Output contract

All files go to `--out-dir`. One file cannot serve both customers.

| File | For | Contents |
|---|---|---|
| `triage-log.json` | agent | `run_date`, repo-relative `inputs`, `rules`, `timeline` (factor, why, source), `role_quality` (BLS row or `missing` + reason), `summary` counts, `scored[]` (decision, composite, full sponsorship evidence, fit, liveness, timeline), `held[]` (gate, reason, next_action), `not_verified[]` |
| `triage-report.md` | person | scored table with every value labeled, ⚠ flags for G4, held table, timeline line, role-quality notes, "What this run did NOT verify" |
| `roles.json` | scorer | only roles that passed G1 and G2, shaped like `data/examples/ch11-roles.json` |
| `role-scores.json` / `.md` | audit | the scorer's own output and per-term trace |

## What it can verify

- A company row exists in the shipped CSV under the exact name entered, and its `Total Approvals`, `Approval_Rate`, and `top_job_titles_sponsored` values (record).
- That a blank approvals field is a missing record, kept distinct from 0 approvals.
- Whether "data scientist" appears in the company's top sponsored titles (a text match on a record).
- That a posting check was run on a stated date and what the checker returned.
- The national OEWS 2024 wage for SOC 15-2051, and that its O*NET ability fields are empty.
- The scorer's decision and arithmetic for each role that cleared the gates.

## What it cannot verify

- SOC 15-2051-specific sponsorship counts. The CSV has no SOC column; counts are company-wide. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Whether a role is entry-level. 32 of 102 DS titles matched in the real CSV are Senior/Staff/Principal, and LinkedIn's only DS title is "Sr Data Scientist," yet it would rate Proven. [TODO: DEV] seniority-aware title rule.
- Whether a posting is really open when the URL is a job aggregator. In the worked run, a builtin.com page whose own text says the job was removed in June 2025 was reported `active`. [TODO: DEV] prefer employer ATS URLs; detect "removed" banners.
- Whether a G1 miss is a non-sponsor or a naming difference ("Airbnb" vs `AIRBNB INC`; "Instacart" vs `MAPLEBEAR INC`). [TODO: DEV] legal-suffix stripping plus a brand-to-legal-name alias table.
- Whether two CSV rows are one employer (`PELOTON INTERACTIVE INC` and `... LLC` carry identical 310 approvals). [TODO: DEV] entity de-duplication before any totals.
- Liveness is transcribed, not run by `triage.py`. [TODO: DEV] call `ats:liveness` from the prototype and record its raw output.
- The scorer defaults a missing liveness to 1.0 labeled `record` (`num(role.liveness?.factor) ?? 1`). This recipe works around it by holding such roles. [TODO: DEV] propose fail-closed default upstream.
- Whether the page the checker judged is still the job that was asked about. In the 2026-10-21 mode worked run (row 5, Airbnb "Staff Data Scientist, Locations"), `boards.greenhouse.io/airbnb/jobs/6768605` redirected 301 → `job-boards.greenhouse.io/...` → 302 `/airbnb?error=true` → 302 `careers.airbnb.com/positions/` (the all-jobs list, HTTP 200). `ats:liveness` reported `active` because the list page shows apply links, and the role was scored Apply 0.375. Evidence: `course/2026fa/submissions/rithika-sr/mode/worked-run/terminal/D7-airbnb-redirect.txt` and `D7b-airbnb-liveness-rerun.txt`. [TODO: DEV] final URL must still identify the same job (job id in final URL).
- Immigration timing beyond the stated formula; not legal advice.
- AI-resilience of the role (O*NET abilities empty for 15-2051.00); what any employer pays.

## Stop conditions

- G0 fails → stop with exit 2; no outputs.
- No role clears G1 and G2 → the scorer is not run; `triage-log.json` and `triage-report.md` are still written with every role in `held`.
- The scorer exits non-zero → stop with exit 2 and its stderr.
- Otherwise → write all outputs, then stop at G4. The agent never applies, emails, or changes a tracker.

## Next action per result (the 3-3-2 day)

| Result | Next action | Hours it feeds |
|---|---|---|
| Apply, no ⚠ | tailor and send one application | research-and-apply (2) |
| Apply with ⚠ weak fit | network first; do not spend tailoring time yet | networking (3) |
| Consider | informational chat to test the soft spot | networking (3) |
| Skip | drop it | frees time for credibility (3) |
| Held G1 not found | 5-minute hand search for the legal name | research-and-apply (2) |
| Held G1 no record | ask a contact whether they sponsor | networking (3) |
| Held G2 | open the posting by hand or rerun `ats:liveness` | research-and-apply (2) |

## Run-log template (`logs/runs/`)

```markdown
## YYYY-MM-DD — ds-newgrad-h1b-15-2051 triage

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md v0.1.0
- **Inputs:** candidates file, --today, CSV + BLS paths (repo-relative)
- **Outputs:** <out-dir>/triage-log.json, triage-report.md, roles.json, role-scores.*
- **Result:** N roles → scored / held counts; scorer decisions
- **Open issues:** false positives found at G4; held roles needing a human
```
