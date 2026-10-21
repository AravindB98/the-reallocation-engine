---
# DRAFT on purpose: SPECIFIED requires zero open TODOs, and this assignment requires proposed
# additions to be written as typed TODOs, so a recipe that does the assignment honestly cannot be past DRAFT.
status: DRAFT
todos_open: 13
last_gate: "2026-10-21 live run; G4 human review by rithika-sr completed 2026-10-21"
attestation: null      # set only at VERIFIED
recipe_version: 0.3.0
---

## Executive summary

This recipe describes a screening step for an international student looking for an entry-level data scientist job that needs visa sponsorship. For each job posting it checks three things: does the company have a record of sponsoring visas, is the job really still open, and is the job title at the right level. It refuses to score any posting it cannot confirm.

It exists because an earlier version recommended a job that a job-listing site still showed as open sixteen months after the employer removed it. The recipe now trusts the employer's own hiring system first. Where that system publishes a record of the job, the record decides. Job-listing sites are never enough on their own, links to unknown sites are held, and senior-titled jobs are set aside for an entry-level candidate.

It was run three times on the same 13 real postings on 21 October 2026, and a person reviewed five of the results by hand. The first run recommended a job whose link landed on a company's list of all jobs. The second run fixed that, but it then recommended two senior jobs. The third run added the level check and agreed with the person on four of five postings. Those five postings were also used to design the fixes, so this is not proof the tool works on new postings. The recipe stays a draft until the remaining proposed additions are closed.

## Purpose

For one fictional persona (Sasha Jones, F-1, graduating December 2026, OPT EAD expected January 2027, target SOC 15-2051 Data Scientist), decide for each candidate posting:

1. Does the employer have a sponsorship record (not "no record", which is not zero)?
2. Is the posting open **on the employer's own page or hiring system**, not just on a job board?
3. Is the job title at or below the persona's level (entry)?
4. Does the visa timeline leave room for a typical hiring lag?

Only postings that clear all four are sent to the existing Chapter 11 scorer. Everything else gets one of three outcomes, each with a reason: HELD (unknown), CLOSED (verified gone) or OVER-LEVEL (title above the persona's level). A named person (G4) makes the final call.

## Source inventory

These are the exact paths and commands used in the 2026-10-21 runs (Run 1 v0.1.0, Run 2 v0.2.0, Run 3 v0.3.0).

| Kind | Path or command | Label |
|---|---|---|
| Mode script | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py` v0.3.0 (standard library only) | code |
| ATS record + redirect module (v0.2) | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/ats_record.py` (standard-library `urllib`) | code |
| Imported helpers (G0, G1, G3, scorer call) | `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py` | code |
| Scorer | `scripts/score/role-scorer.mjs` (called via `node`, not copied) | code |
| Page checker | `npm run --silent ats:liveness -- <url>` → `scripts/ats/check-liveness.mjs` + `liveness-core.mjs` + `liveness-browser.mjs` (Playwright 1.62.1, Chromium) | network |
| Greenhouse job-board API (v0.2) | `GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>`: read-only public GET, no credentials | network, record |
| Redirect chain (v0.2) | `GET` each hop of an employer URL, redirects followed by hand (≤10 hops, 15 s timeout) | network |
| TLS trust (v0.2) | Python's default CA paths; if they hold no certificates (python.org builds on macOS), the macOS system bundle `/etc/ssl/cert.pem`. Verification always on; source logged as `tls_ca_source` | environment |
| Sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`) | record |
| Persona (fictional) | `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json` | your-input |
| Candidates (real public postings) | `course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json` (13 rows; sha256 `040293bb…19bf`) | your-input; rows 9–13 fit inferred |
| Aggregator list | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/aggregators.json` (14 domains, each with a reason) | your-input rule |
| Employer allowlist (v0.2) | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/ats_hosts.json` (10 domains, each with a reason) | your-input rule |
| Level rules (v0.3) | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/level_rules.json`; `--max-level entry` (10 blocked title words, each with a reason; "ii" not blocked) | your-input rule |
| Offline fixtures | `fixtures/liveness.offline.json`, `fixtures/ats_hosts.test.json`; per-run `replay-fixture.json` written by each network run | test data |
| Tests | `python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v` (69 tests) | code |
| Live run (Run 3) | `python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3` | run |
| Terminal transcripts | `course/2026fa/submissions/rithika-sr/mode/worked-run/terminal/` (Run 1: `T1`, `D1`–`D7c`; Run 2: `R2-*`; Run 3: `R3-*`) | evidence |

Not used: BLS/O*NET role quality. The scorer's `role_quality` weight is 0, so this mode does not read the BLS file.

## Proposed additions

Each line gives the typed TODO (or its closure), a one-line justification, and the evidence. Row numbers refer to `candidates.real.json`. "Run 1/2/3" are the 2026-10-21 runs; transcripts are under `worked-run/terminal/`. Items 1–8 come from the earlier recipe `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.

| # | Proposed addition | Why | Evidence |
|---|---|---|---|
| 1 | [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data | The CSV has no SOC column, so "sponsors data scientists" is a company-wide count plus a title text match. | All scored rows (6, 9) are "Proven" on company totals; row 10 shows why company-wide is not role-level. |
| 2 | Seniority filter (PARTIAL in v0.3) | Done for titles: the LEVEL gate blocks senior, sr, staff, principal, lead, manager, director, head, iii, iv as whole words. Not done for job descriptions; tracked as item 17. | Run 3, rows 10 and 11 → OVER-LEVEL "title says 'senior'" (`R3-D1-live-run.txt`, `out-run3/mode-report.md`). Row 6 (Figma, plain "Data Scientist") still Apply although the posting asks for experience (G4 review). |
| 3 | [TODO: DEV] Detect "removed" banners on aggregator pages (PARTIAL since v0.1) | An aggregator alone can no longer clear liveness, which removes the harm; the page checker itself still calls a removed job active. | Row 1: builtin.com page says the job was removed Jun 11, 2025; page checker `active` in Runs 1–3; held at G2b each time. |
| 4 | [TODO: DEV] Brand-to-legal-name alias table | Brand names miss the legal name in the CSV and are held at G1. | Rows 2 ("Instacart" vs MAPLEBEAR INC) and 3 ("Airbnb" vs AIRBNB INC), all runs. |
| 5 | [TODO: DEV] Entity de-duplication before totals | Two CSV rows can be one employer. | PELOTON INTERACTIVE INC and … LLC both show 310 approvals (CSV). Not exercised in these runs. |
| 6 | CLOSED (v0.1): run `ats:liveness` from the prototype instead of transcribing | `mode_run.py` runs it once per URL and stores stdout/stderr/exit code verbatim. | `mode-log.json` → `liveness_checks` in every run. |
| 7 | [TODO: DEV] Propose a fail-closed liveness default in the scorer upstream | `role-scorer.mjs` treats a missing liveness as 1.0 (`?? 1`); this mode works around it by never sending held, closed or over-level roles. | Tests `test_held_and_closed_roles_never_reach_the_scorer`, `test_scorer_not_called_when_every_role_is_over_level`. |
| 8 | CLOSED (v0.2): final URL must still identify the same job | For Greenhouse jobs the public job-board record decides, so a link redirected to a job list no longer counts as open. For any employer page, a final URL without the job id is flagged. Scope: on non-Greenhouse hosts a redirect to a list page without `error=true` is flagged but not closed. | Row 5 (Airbnb Staff): Run 1 Apply 0.375 → Run 2 CLOSED "ATS record: HTTP 404". Hops 301 → 302 `/airbnb?error=true` → 302 `careers.airbnb.com/positions/` → 200 and API 404 in `R2-D3-network-calls.txt` (calls 5–9). |
| 9 | CLOSED (v0.2): employer allowlist instead of trusting any non-aggregator host | A non-aggregator URL whose host is not in `ats_hosts.json` is HELD "source not recognized as employer or ATS" and never fetched. | Row 13 (jobs.generalcatalyst.com): Run 1 held only by a navigation error; Runs 2–3 held by the allowlist with no network call (`R2-D3-network-calls.txt` has no generalcatalyst URL). |
| 10 | [TODO: DEV] Role-level sponsorship clause check | A large company-wide approval count can hide a posting that says it will not sponsor. | Row 10: a third-party copy says "no visa sponsorship"; MAPLEBEAR INC is Proven (498 approvals). Not checked on the employer page. |
| 11 | CLOSED (v0.2) for Greenhouse: page-checker false negative on a visible Apply button | The Greenhouse record decides, so a live job the page checker cannot read is no longer held. Other ATSs: item 16. | Row 11 (Nextdoor): Run 1 HELD (checker uncertain; G4 saw an Apply button) → Run 2 employer page active by "ATS record: HTTP 200" with flag "page checker said uncertain; ATS record active" (`R2-D3-network-calls.txt` call 26). |
| 12 | [TODO: DEV] Same-job check between aggregator URL and employer URL | The pairing is your-input; nothing compares the two pages. | Row 11 pair matches on title and team only; row 13 shows the same role on a third site. |
| 13 | [TODO: DEFINE] Stop sponsorship alone from producing Apply | A Proven sponsor contributes 0.9 × 0.35 = 0.315, already above the 0.30 Apply line. | Row 6 (fit 0.4) is Apply in all three runs; G4 decided Consider. Skip rate among scored roles is 0% in every run. |
| 14 | [TODO: DEV] Malformed JSON input must stop with exit 2, not a traceback | `triage.load_json` does not catch `JSONDecodeError`. | Probe 2026-10-21: `{"roles": [` → `JSONDecodeError`, exit 1. |
| 15 | CLOSED (v0.3): title-mismatch noise from parenthetical text | Titles are compared as word sets after removing parenthetical text such as "(US remote)". | Row 10: Run 2 flag "title differs from ATS record: 'Senior Data Scientist I - Meals'"; gone in Run 3 (`out-run3/mode-report.md`). Test `test_parenthetical_ignored_in_title_match`. |
| 16 | [TODO: DEV] ATS record checks for Lever, Ashby and Workday | Only Greenhouse has a record check; other allowlisted ATS pages are still decided by the page checker. | No Lever/Ashby/Workday URL in these runs; Greenhouse alone fixed rows 5 and 11. |
| 17 | [TODO: DEV] Description-level seniority check | A plain title can hide an experienced-hire requirement. | Row 6 (Figma "Data Scientist"): level gate pass, Apply in Run 3; G4: "asks for an experienced Data Scientist", Consider. |
| 18 | [TODO: APPROVE] Held-out evaluation on postings decided before the run | Runs 2–3 were tuned on the five rows the human had already reviewed, so 4/5 shows fit to known cases. | `worked-run/EVALUATION.md`: 3/5 → 2/5 → 4/5 on the same rows. |
| 19 | [TODO: DEFINE] Allowlist maintenance: who adds a careers domain, on what evidence, and how often it is reviewed | A real employer careers domain missing from the allowlist is held. | `ats_hosts.json` lists five ATS domains and five careers domains drawn from these candidates only. |

## Phase gates

Each role stops at its first failed gate. **Liveness (G2) and the visa timeline (G3) are GATES, not votes**: the scorer multiplies by them, so a high sponsorship or fit score cannot outvote a failed gate. The level gate is also a hard stop, applied before scoring.

| Gate | Testable condition | On fail | Cleared by |
|---|---|---|---|
| G0 inputs | all input files load; `--today` is `YYYY-MM-DD`; persona has visa dates and `hiring_lag_days` > 0; unique `role_id`s; `--max-level` defined in `level_rules.json`; `--out-dir` resolves inside `course/2026fa/submissions/rithika-sr/` | run stops, exit 2, nothing written (malformed JSON: item 14) | machine |
| INPUT | `fit` is a number in [0, 1] | HELD (INPUT) | machine; fix is your-input |
| G1 sponsorship | exact (case-insensitive) company name in the CSV **and** `Total Approvals` not blank | HELD (G1) "not found" or "no sponsorship record (not zero)" | machine; a human resolves naming misses |
| G2a liveness — GATE | every non-aggregator URL for the role is open, decided per URL in this order of precedence (below) | a deciding page `expired` → CLOSED; unrecognized host → HELD; otherwise not active → HELD | machine; G4 confirms by opening the page |
| G2b aggregator — GATE | if `posting_url` is on an aggregator, `employer_url` is given, is not an aggregator, and passes G2a precedence | no employer page → HELD "aggregator-only liveness"; employer page expired → CLOSED; otherwise HELD | machine; G4 confirms the two URLs are the same job |
| LEVEL (v0.3) | no blocked word (`level_rules.json`, `--max-level`) as a whole word, case-insensitive, in the candidate title or the ATS record title | OVER-LEVEL "title says '<word>'", no score | machine (rule-based, no model judgment); G4 may override |
| G3 visa timeline — GATE | factor = min(1, (days to EAD + unemployment days left after buffer) / hiring lag); 0 after OPT end or with no days left | factor 0 → scorer returns Skip | machine from your-input dates |
| G4 human decision | `mode-report.md` written; a named person opens every scored, CLOSED-by-heuristic and ⚠-flagged posting and records a decision | nothing is applied to until this is done | rithika-sr (2026-10-21: done; `course/2026fa/submissions/rithika-sr/mode/G4-HUMAN-REVIEW.md`) |

**G2 precedence for one non-aggregator URL (v0.2):**

1. **Allowlist.** If the host is not in `ats_hosts.json`, the URL is unrecognized: HELD, and it is never fetched.
2. **Greenhouse job URL.** The public job-board API record decides. 200 with the same id means active, 404 means expired (CLOSED), and anything else (another status, a timeout, a TLS error) means uncertain (HELD). A different page-checker answer is a ⚠ flag, not a decision.
3. **Any other allowlisted URL whose redirect chain passes through `error=true`.** Expired, so CLOSED ("redirected through ATS error page").
4. **Otherwise the page checker decides** (`active` / `expired` / `uncertain` or unparseable).
5. **Flags only, never decisions:**
   - a final URL after redirects that lacks the job id;
   - an ATS title different from the candidate title (compared as word sets, ignoring parentheticals).

**Decisions:**

| Decision | Meaning | Score |
|---|---|---|
| Apply / Consider / Skip | cleared every gate; the scorer's recommendation | composite |
| HELD | we do not know: no record, unrecognized source, aggregator only, or a page that could not be confirmed | none |
| CLOSED | a deciding source verified the job is gone (ATS 404, ATS error redirect, or the page checker's `expired` on an employer page) | none |
| OVER-LEVEL | open and sponsored, but the title is above `--max-level` | none |

## Can verify / cannot verify

**Can verify**

- The company's row in the shipped sponsorship CSV, and that a blank approvals field is "no record", not zero. An independent cross-check matched MOLOCO INC at 200 / 2 / 99.0099.
- For Greenhouse jobs, whether the employer's own job-board record exists (HTTP status, id and title, recorded per call).
- Every redirect hop of an employer URL, including a hop through an ATS error page.
- What `ats:liveness` printed for each URL, byte for byte, with its exit code.
- Whether a host is an aggregator, an allowlisted employer or ATS, or unrecognized.
- Whether a title contains a blocked level word.
- That no HELD, CLOSED or OVER-LEVEL role reaches the scorer.
- That a recorded network run replays offline to identical decisions (Runs 2 and 3, `replay-fixture.json`).
- That the tool refuses to write outside the submission folder (exit 2).

**Cannot verify**

- Role-level sponsorship: whether this posting will sponsor (item 10).
- Seniority written only in the job description (item 17).
- That an aggregator URL and an employer URL are the same job (item 12).
- Liveness from the ATS record on Lever, Ashby or Workday (item 16).
- That a job board absent from both lists is not a legitimate employer site; it is held either way (item 19).
- That `active` means the employer is still reviewing applications.
- That the page checker's `expired` is a fact: it also returns `expired` for pages with under 300 characters of text.
- How the tool performs on postings nobody reviewed beforehand (item 18).
- Immigration timing beyond the stated formula. This is not legal advice; confirm with the school's international student office.

## Output contract

`--out-dir` receives two artifacts for two readers (P5). A person cannot work from an agent log, and an agent cannot audit from a prose report. A network run also writes a replay fixture, and the scorer writes its own files.

**`mode-log.json` (agent).** Actual top-level keys (v0.3.0):

| Key | Content |
|---|---|
| `mode`, `version`, `builds_on_recipe`, `imports_from` | what ran and what it reused |
| `run_date`, `today_source` | `--today` value, and whether it came from the flag or the clock |
| `command_line` | full argv, repo prefix and home folder removed |
| `liveness_source` | `network: npm run --silent ats:liveness -- <url>` or the offline fixture path |
| `inputs` | path + sha256 for persona, candidates, targets, aggregators, ats_hosts, level_rules (+ offline fixture) |
| `persona` | fictional name, target title, SOC, label your-input |
| `rules` | every rule in force for this run |
| `aggregators`, `ats_hosts` | domain → reason lists used |
| `max_level`, `level_rules` | the `--max-level` value and its blocked words with reasons |
| `network_calls` | every call in order: URL, method, purpose (`page-checker`, `redirect-hop`, `greenhouse-api`), status, redirect target, error, UTC time (null offline), mode |
| `tls_ca_source` | where TLS trust came from (null offline) |
| `timeline` | G3 factor, arithmetic, label |
| `summary` | counts: candidates, scored, held, closed, over_level, held_by_gate, decisions |
| `roles` | per role: inputs, `fit_source`, `notes`; G1, G2a pages (allowlist, page checker, ATS record, redirect chain, `decided_by`, flags), G2b, LEVEL, G3; `held` / `closed` / `over_level`; decision, composite, flags |
| `liveness_checks` | per URL: command, mode, raw stdout/stderr/exit code verbatim, parsed status, parse error |
| `scorer` | whether it was called, which role ids were sent, its stdout |
| `not_verified` | the cannot-verify list |

**`mode-report.md` (person).** Template:

```
## Executive summary        what this is · why read it · what it found (zero-count clauses omitted)
## Run record               mode/version, run date, liveness source, timeline factor, labels
## Roles                    | Company | Title | G1 | G2a [decided by] | G2b | Level | G3 | Decision | Score or HELD/CLOSED/OVER-LEVEL — reason | Flags |
## Next action for held roles
## ATS records and redirect chains (employer pages)   | URL | Allowlisted as | ATS record | Redirect hops | Final URL has job id | Decided by |
## Liveness checks (one per URL)   | URL | Aggregator | Checker said | Exit | Parse |
## What this run did NOT verify
## Human decision
```

**`replay-fixture.json`** (network runs only): raw page-checker outputs and the HTTP response subset (status, redirect target, API id/title/URL) for every call. `--offline` with this file reproduces the run's decisions without the network.

Scorer files (`roles.json`, `role-scores.json`, `role-scores.md`) contain only the roles that cleared every gate.

## Stop conditions

**Whole run stops (exit 2, nothing written):**
- `--out-dir` outside `course/2026fa/submissions/rithika-sr/` (including `..` escapes and look-alike sibling folders);
- a missing input file;
- `--today` not a date;
- `--max-level` not defined in `level_rules.json`;
- persona missing visa fields, or `hiring_lag_days` ≤ 0;
- empty `roles`, or a missing or duplicate `role_id`;
- an aggregator, allowlist or level entry without its value and reason;
- an offline fixture without a `results` object;
- the scorer exiting non-zero.

Malformed JSON currently exits 1 with a traceback (item 14).

**Role HELD (no score):**
- fit missing or out of range;
- company not in the CSV, or approvals blank;
- no URL to check;
- aggregator-only liveness;
- source not recognized as employer or ATS;
- a Greenhouse record that is neither 200-with-matching-id nor 404 (including timeouts and TLS errors);
- a deciding page `uncertain`;
- checker output unparseable (wrong URL, missing or inconsistent `Results:` line, exit code disagreeing with the result, timeout, npm not starting);
- no check recorded.

**Role CLOSED (no score):**
- a Greenhouse record 404;
- a non-Greenhouse employer URL redirected through `error=true`;
- the page checker's `expired` on a deciding (non-aggregator) page.

An aggregator saying expired never closes a role.

**Role OVER-LEVEL (no score):** a blocked level word in the candidate title or the ATS record title, after G2 and before scoring.

**Scorer not run:** every role was HELD, CLOSED or OVER-LEVEL.

## Log template (`logs/runs/`)

`logs/RUN_LOG.md` is maintainer-only (CONTRIBUTING.md; CI rejects student edits). Run entries go in `logs/runs/<term>-<handle>-<n>.md`; the assignment also allows including the entry in the submission. Format from `recipes/_shared.md`:

```markdown
## YYYY-MM-DD — rithika-sr-ds-h1b-liveness (Run N)

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md v0.3.0 (DRAFT)
- **Inputs:** candidates file + sha256; persona (fictional); CSV, aggregators, ats_hosts, level_rules sha256; --today; --max-level
- **Commands:** tests; live run; offline replay ×2 + diff; json.tool
- **Outputs:** mode-log.json, mode-report.md, replay-fixture.json, role-scores.*, terminal transcripts
- **Counts:** N roles → scored / closed / over-level / held (by gate); network calls by purpose
- **G4 result:** reviewer, date, decisions; agreement with the tool
- **Open issues:** false positives/negatives found; TODOs added or closed
```
