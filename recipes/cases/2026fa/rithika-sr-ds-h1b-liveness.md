---
# DRAFT on purpose: SPECIFIED requires zero open TODOs, and this assignment requires proposed
# additions to be written as typed TODOs, so a recipe that does the assignment honestly cannot be past DRAFT.
status: DRAFT
todos_open: 13
last_gate: "2026-10-21 live run; G4 human review by rithika-sr completed 2026-10-21"
attestation: null      # set only at VERIFIED
recipe_version: 0.1.0
---

## Executive summary

This recipe describes a screening step for an international student looking for an entry-level data scientist job that needs visa sponsorship. It checks, for each job posting, whether the company has a record of sponsoring visas and whether the job is really still open, and it refuses to score any posting it cannot confirm.

It exists because an earlier version recommended applying to a job that a job-listing site still showed as open sixteen months after the employer removed it. This version checks the employer's own page, keeps the checker's exact output, and separates "we could not confirm this" from "this job is confirmed closed".

In its first real run (13 postings, 21 October 2026) it caught the old false positive, correctly marked two closed jobs as closed, and scored three postings. A person then opened the postings by hand and found one new false positive (a job link that silently landed on a company's all-jobs page), one false negative (a real open job the checker could not confirm), and a gap where an unlisted job-listing site would be trusted as if it were the employer. Those findings are written below as proposed additions. The recipe stays a draft until they are closed.

## Purpose

For one fictional persona (Sasha Jones, F-1, graduating December 2026, OPT EAD expected January 2027, target SOC 15-2051 Data Scientist), decide for each candidate posting:

1. Does the employer have a sponsorship record (not "no record", which is not zero)?
2. Is the posting open **on the employer's own page**, not just on a job board?
3. Does the visa timeline leave room for a typical hiring lag?

Only postings that clear all three are sent to the existing Chapter 11 scorer. Everything else is HELD (unknown) or CLOSED (verified gone), with a reason and a next action. A named person (G4) makes the final call.

## Source inventory

Exact paths and commands used in the 2026-10-21 run.

| Kind | Path or command | Label |
|---|---|---|
| Mode script | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py` v0.1.0 (standard library only) | code |
| Imported helpers (G0, G1, G3, scorer call) | `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py` | code |
| Scorer | `scripts/score/role-scorer.mjs` (called via `node`, not copied) | code |
| Liveness checker | `npm run --silent ats:liveness -- <url>` → `scripts/ats/check-liveness.mjs` + `liveness-core.mjs` + `liveness-browser.mjs` (Playwright 1.62.1, Chromium) | network |
| Sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`) | record |
| Persona (fictional) | `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json` | your-input |
| Candidates (real public postings) | `course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json` (13 rows) | your-input; rows 9–13 fit inferred |
| Aggregator list | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/aggregators.json` (14 domains, each with a reason) | your-input rule |
| Offline fixture | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json` | test data |
| Tests | `python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v` (41 tests) | code |
| Live run | `python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out` | run |
| Redirect evidence | `curl -sIL <url> \| grep -iE '^(HTTP\|location)'` | network |
| Terminal transcripts | `course/2026fa/submissions/rithika-sr/mode/worked-run/terminal/*.txt` | evidence |

Not used: BLS/O*NET role quality. The scorer's `role_quality` weight is 0, so this mode does not read the BLS file at all.

## Proposed additions

Each line: typed TODO, one-line justification, evidence row from the 2026-10-21 run (row numbers refer to `candidates.real.json`). Items 1–8 carry over from the earlier recipe `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.

| # | Proposed addition | Why | Evidence |
|---|---|---|---|
| 1 | [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data | The CSV has no SOC column, so "sponsors data scientists" is a company-wide count plus a title text match. | All 3 scored rows (5, 6, 9) are "Proven" on company totals; row 10 shows why company-wide is not role-level. |
| 2 | [TODO: DEV] Seniority filter before scoring | Matched titles and real postings are mostly Senior/Staff; the persona is entry level. | G4 marked rows 5, 10, 11 Skip and row 6 Consider, partly for seniority; no entry-level DS posting found at any checked sponsor. |
| 3 | [TODO: DEV] Detect "removed" banners on aggregator pages (old item, PARTIAL) | `mode_run.py` now never lets an aggregator alone clear liveness, which closes the harm; the checker itself still reports a removed job as active. | Row 1: builtin.com page says the job was removed on Jun 11, 2025; checker still said `active` on 2026-10-21. |
| 4 | [TODO: DEV] Brand-to-legal-name alias table | Brand names miss the legal name in the CSV and are held at G1. | Rows 2 ("Instacart" vs MAPLEBEAR INC) and 3 ("Airbnb" vs AIRBNB INC). |
| 5 | [TODO: DEV] Entity de-duplication before totals | Two CSV rows can be one employer. | PELOTON INTERACTIVE INC and … LLC both show 310 approvals (CSV). Not exercised in this run. |
| 6 | CLOSED: run `ats:liveness` from the prototype instead of transcribing (old item) | Done by `mode_run.py`: one check per URL, stdout/stderr/exit code stored verbatim. | `mode-log.json` → `liveness_checks` (11 URLs, raw output each). |
| 7 | [TODO: DEV] Propose a fail-closed liveness default in the scorer upstream | `role-scorer.mjs` treats a missing liveness as 1.0 (`?? 1`). This mode works around it by never sending held roles. | Test `test_held_and_closed_roles_never_reach_the_scorer`; scorer source. |
| 8 | [TODO: DEV] Final URL must still identify the same job (job id in final URL) | The checker judges the page it lands on, after redirects; a job link that lands on a list of all jobs is called active. | Row 5: 301 → 302 `?error=true` → 302 `careers.airbnb.com/positions/` (200); checker `active`; scored Apply 0.375 (`terminal/D7-airbnb-redirect.txt`, `D7b-airbnb-liveness-rerun.txt`). |
| 9 | [TODO: DEV] ATS allowlist instead of an aggregator denylist | Any job board missing from the denylist is trusted as the employer. | Row 13: jobs.generalcatalyst.com was treated as an employer page (`aggregator: null`); it was held only because the checker hit a navigation error. |
| 10 | [TODO: DEV] Role-level sponsorship clause check | A large company-wide approval count can hide a posting that says it will not sponsor. | Row 10: a third-party copy says "no visa sponsorship" for this role; CSV says MAPLEBEAR INC is Proven (498 approvals). Not verified on the employer page. |
| 11 | [TODO: DEV] Fix checker false negative on a visible Apply button | Greenhouse pages that redirect to a company careers site came back `uncertain`. | Row 11: G4 saw an Apply button; checker said "no visible apply control". Row 10 had the same checker result. |
| 12 | [TODO: DEV] Same-job check between aggregator URL and employer URL | The pairing is your-input; nothing compares the two pages. | Row 11 pair is "likely the same job" by title and team only; row 13 shows the same role on a third site. |
| 13 | [TODO: DEFINE] Stop sponsorship alone from producing Apply | A Proven sponsor contributes 0.9 × 0.35 = 0.315, already above the 0.30 Apply line, so fit barely matters. | Rows 5 (fit 0.2) and 6 (fit 0.4) scored Apply; G4 changed them to Skip and Consider. Skip rate among scored roles: 0%. |
| 14 | [TODO: DEV] Malformed JSON input must stop with exit 2, not a traceback | `triage.load_json` does not catch `JSONDecodeError`, so a broken candidates file exits 1 with a stack trace. | Probe on 2026-10-21: `{"roles": [` → `JSONDecodeError`, exit 1. |

## Phase gates

Each role stops at its first failed gate. **Liveness (G2) and the visa timeline (G3) are GATES, not votes**: the scorer multiplies by them, so a failed gate cannot be outvoted by a high sponsorship or fit score.

| Gate | Testable condition | On fail | Cleared by |
|---|---|---|---|
| G0 inputs | all input files load; `--today` is `YYYY-MM-DD`; persona has visa dates and `hiring_lag_days` > 0; every role has a unique `role_id`; `--out-dir` resolves inside `course/2026fa/submissions/rithika-sr/` | run stops, exit 2, `✗ stopped: <reason>`, nothing written (malformed JSON: see addition 14) | machine |
| INPUT | `fit` is a number in [0, 1] | HELD (INPUT) | machine; fix is your-input |
| G1 sponsorship | exact (case-insensitive) company name found in the CSV **and** `Total Approvals` not blank | HELD (G1): "not found" (may be a naming miss) or "no sponsorship record (not zero)" | machine; a human resolves naming misses |
| G2a liveness — GATE | every non-aggregator URL given for the role returns `active` from `ats:liveness`, parsed from its exact output (one result line for the requested URL, matching `Results:` line, consistent exit code) | `expired` on a deciding page → CLOSED; `uncertain`, unparseable, or no check → HELD (G2a) | machine; G4 confirms by opening the page |
| G2b aggregator — GATE | if `posting_url` is on an aggregator, `employer_url` is given, is not an aggregator, and is `active` | no employer page → HELD "aggregator-only liveness"; employer page not active → HELD; employer page expired → CLOSED | machine; G4 confirms the two URLs are the same job |
| G3 visa timeline — GATE | factor = min(1, (days to EAD + unemployment days left after buffer) / hiring lag); 0 after OPT end or with no days left | factor 0 → scorer returns Skip | machine from your-input dates |
| G4 human decision | `mode-report.md` written; a named person opens every scored, CLOSED-by-heuristic, and ⚠-flagged posting and records a decision | nothing is applied to until this is done | rithika-sr (2026-10-21 run: done, see `course/2026fa/submissions/rithika-sr/mode/G4-HUMAN-REVIEW.md`) |

## Can verify / cannot verify

**Can verify**

- Whether the company has a row in the shipped sponsorship CSV, and its approvals, denials, rate and top sponsored titles (cross-checked independently for MOLOCO INC: 200 / 2 / 99.0099).
- That a blank approvals field is "no record", not zero.
- What `ats:liveness` printed for each URL, byte for byte, with its exit code.
- Whether a posting's host is on the aggregator list, and therefore whether an employer page is required.
- That a deciding page the checker called `expired` is reported as CLOSED, and that no held or closed role reaches the scorer.
- That the same inputs give the same report (offline run repeated twice, identical report).
- That the tool refuses to write outside the submission folder (exit 2).

**Cannot verify**

- Role-level sponsorship: whether this posting will sponsor, as opposed to the company in general (addition 10).
- That a redirect landed on the same job (addition 8).
- That an aggregator URL and an employer URL are the same job (addition 12).
- Whether a job board not on the list is an aggregator (addition 9).
- Whether a role is entry-level (addition 2).
- That `active` means the employer is still reviewing applications; it only means an apply control was visible.
- That `expired` is a fact rather than a page-content heuristic: the checker also returns `expired` for pages with under 300 characters of text, which would show as CLOSED.
- Immigration timing beyond the stated formula. Not legal advice; confirm with the school's international student office.

## Output contract

`--out-dir` receives two artifacts for two readers (P5: a person cannot work from an agent log, and an agent cannot audit from a prose report), plus the scorer's own files.

**`mode-log.json` (agent).** Actual top-level keys:

| Key | Content |
|---|---|
| `mode`, `version`, `builds_on_recipe`, `imports_from` | what ran and what it reused |
| `run_date`, `today_source` | `--today` value, and whether it came from the flag or the clock |
| `command_line` | full argv, repo prefix and home folder removed |
| `liveness_source` | `network: npm run --silent ats:liveness -- <url>` or the offline fixture path |
| `inputs` | path + sha256 for persona, candidates, targets, aggregators (+ offline fixture) |
| `persona` | fictional name, target title, SOC, label your-input |
| `rules` | every rule in force for this run |
| `aggregators` | the domain → reason list used |
| `timeline` | G3 factor, arithmetic, label |
| `summary` | counts: candidates, scored, held, closed, held_by_gate, decisions |
| `roles` | per role: inputs, `fit_source`, `notes`, G1/G2a/G2b/G3 results, `held` or `closed` reason and next action, decision, composite, flags |
| `liveness_checks` | per URL: command, mode, raw stdout/stderr/exit code verbatim, parsed status, parse error |
| `scorer` | whether it was called, which role ids were sent, its stdout |
| `not_verified` | the cannot-verify list |

**`mode-report.md` (person).** Template:

```
## Executive summary        what this is · why read it · what it found (plain language)
## Run record               mode/version, run date, liveness source, timeline factor, labels
## Roles                    | Company | Title | G1 | G2a | G2b | G3 | Decision | Score or HELD/CLOSED — reason | Flags |
## Next action for held roles
## Liveness checks (one per URL)   | URL | Aggregator | Checker said | Exit | Parse |
## What this run did NOT verify
## Human decision
```

Scorer files (`roles.json`, `role-scores.json`, `role-scores.md`) contain only the roles that cleared every gate.

## Stop conditions

**Whole run stops (exit 2, nothing written):** `--out-dir` outside `course/2026fa/submissions/rithika-sr/` (including `..` escapes and look-alike sibling folders); a missing input file; `--today` not a date; persona missing visa fields or with `hiring_lag_days` ≤ 0; empty `roles` or a missing/duplicate `role_id`; an aggregator entry without a domain or reason; an offline fixture without a `results` object; the scorer exiting non-zero. (Malformed JSON currently exits 1 with a traceback: addition 14.)

**Role HELD (no score):** fit missing or out of range; company not in the CSV; approvals blank; no URL to check; deciding page `uncertain`; checker output unparseable (wrong URL, missing or inconsistent `Results:` line, exit code disagreeing with the result, timeout, npm not starting); no check recorded; aggregator-only liveness; employer page not active.

**Role CLOSED (no score):** a deciding page (the employer page, or a posting not on an aggregator) returned `expired`. An aggregator saying expired never closes a role.

**Scorer not run:** every role was HELD or CLOSED.

## Log template (`logs/runs/`)

`logs/RUN_LOG.md` is maintainer-only (CONTRIBUTING.md; CI rejects student edits). Run entries go in `logs/runs/<term>-<handle>-<n>.md`; the assignment also allows including the entry in the submission folder. Format from `recipes/_shared.md`:

```markdown
## YYYY-MM-DD — rithika-sr-ds-h1b-liveness

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md v0.1.0 (DRAFT)
- **Inputs:** candidates file + sha256; persona (fictional); CSV sha256; aggregators.json sha256; --today
- **Outputs:** mode-log.json, mode-report.md, role-scores.*, terminal transcripts
- **Result:** N roles → scored / closed / held (by gate); decisions; G4 reviewer and date
- **Open issues:** checker false positives/negatives found; TODOs added
```
