---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "live run 2026-10-21, every gate decided by Aravind Ravi (G1–G4 and the E1 margin gate), logs/runs/2026fa-aravindravi7-3.md; sample re-run and ingest audit read by him the same day"
attestation: null
recipe_version: 0.2.0
---

# pm-sponsor-title-match — has this company sponsored *product managers*?

## Executive summary

**What it does.** Before a student spends two hours tailoring an application for a product-manager job, this recipe checks one thing most sponsor lists skip: has this employer sponsored H-1B visas *for product-manager-type titles*, or only for engineers? It reads two kinds of evidence: the 80 Days sponsorship dataset (approvals and the titles they covered) and the Department of Labor's per-filing records of employers' visa applications for this year. It checks whether the posting is still open and whether the hiring timeline fits the student's remaining STEM OPT time. Then it gives each posting a decision (Apply, Consider, Skip, or Hold) and a next action.

**Who it is for.** An international master's student (for example, MS in Information Systems) on F-1 OPT with a STEM extension who is targeting Product Manager, Technical Product Manager, or AI Product Manager roles. H-1B-sponsoring employers come first.

**Why it matters.** "This company sponsors visas" and "this company sponsors product managers" are different facts. Of 1,552 companies with approvals in the dataset, only 151 show any product- or program-manager title, and 862 store just one title. The Department of Labor's filings for October 2025 to June 2026 fill much of that gap: five of six large sponsors that showed no PM title had in fact filed for PM roles.

**What it decides and what it does not.** It decides what to look at next and why, with every number labeled by where it came from (a record, the student's own input, test data, or a model judgment; this version calls no model). A filed application is not a visa approval, and the tool never says it is. It does not see a posting's eligibility rules (a person catches them at the margin gate), leaves E-Verify to a person, and puts anything it cannot verify on hold for a person to decide.

## Lifecycle claim (RUNNABLE-LIVE)

Each step on the ladder has its evidence:

| Step | Requirement | Evidence |
|---|---|---|
| **SPECIFIED** | zero open typed TODOs | v0.1's three TODOs: 2 closed with evidence (DOL LCA data source; machine-readable liveness), 1 withdrawn with its reason (E-Verify bulk data); open 0 (§Proposed additions) |
| **RUNNABLE-SAMPLE** | full sample run; conformance; audits generated and read | the sample run (re-run by Aravind Ravi on 2026-10-21; decisions identical to the committed sample); conformance passes; `lca-pm-filings-fy2026_q3-audit.md` generated and read by him |
| **RUNNABLE-LIVE** | a live run with a human clearing every gate, logged | the 2026-10-21 run (`logs/runs/2026fa-aravindravi7-3.md`); every gate carries a named-human decision or a passing record |

How the gates stand for RUNNABLE-LIVE:
- **Cleared by him:** G2 for the four uncertain postings; E1 for the seven roles he accepted; G4 E-Verify for the seven Apply roles.
- **Passing records:** G2 and G4 elsewhere, and G1 by FEIN, with his resolution concurring.
- **The seven held roles** are held by his own recorded decisions (six E1 declines with a basis; Anthropic held because no tier is possible). Those gates are decided, not left open.

attestation: null by rule — SNICKERDOODLE.md: "`attestation: null      # path to attestation record, set only at VERIFIED`"; my signed attestation is in `course/2026fa/submissions/aravindravi7/a4-mode-build/worked-run.md#attestation` (Aravind Ravi · 2026-10-21).

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout; known gaps 3 and 9 (role-quality weight 0; local wage feeds nothing).
3. `scripts/score/role-scorer.mjs` — the composite this recipe feeds, unchanged.
4. This recipe and `recipes/cases/2026fa/aravindravi7-pm-sponsor-title-match.card.md`.

## Source inventory

| Source | Exact path / command | Used for | Label |
|---|---|---|---|
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | approvals, denials, `top_job_titles_sponsored`, funding fields | record |
| DOL LCA extract | `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-pm-filings-fy2026_q3.csv` (10,936 H-1B PM-family rows, contact-free) + `…-audit.md` + `lca.checksums.lock` | per-filing PM evidence: status, family, SOC, wage, FEIN, new-hire vs continuation | record |
| DOL employer index | `…/data/lca/lca-employer-index-fy2026_q3.csv` (53,193 H-1B employers: legal suffixes, FEINs, counts) | tells confirmed absence from unknown; FEIN resolution of suffix variants | record |
| DOL ingest | `.venv/bin/python scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/ingest_lca.py --xlsx <file> --downloaded-by <name> --downloaded-on <date>` | builds the extract and index from `LCA_Disclosure_Data_FY2026_Q3.xlsx` (downloaded by a person; dol.gov refuses scripts) | — |
| Form D samples | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` | funding context only | record |
| BLS compact | `data/bls/compact/soc_occupation_compact.csv` | national median per candidate SOC — context, not a vote | record |
| ATS scan | `REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/fixtures/portals.pm-sponsors.yml npm run ats:scan` | PM postings at 13 named Greenhouse/Ashby boards (writes only to gitignored `data/ats/`) | record |
| Liveness (JSON) | `node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/liveness-json.mjs --file <urls.txt> --out <liveness.jsonl>` | liveness gate input; reuses `scripts/ats/liveness-browser.mjs` `checkUrlLiveness` | record |
| Rules file | `--rules <rules.json>` (required in live runs) | tier→p, rule order, LCA options, timeline steps, margin threshold | your-input |
| Scorer | `scripts/score/role-scorer.mjs`, run as a CLI (it has no exports and runs `main()` on import) | composite + per-term audit | — |
| Prototype | `node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --sample` | builds `roles.json`, runs the scorer, writes log + report | — |
| Tests | `node --test scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test/` and `.venv/bin/python -m unittest discover -s scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test -p "test_*.py"` | 49 Node + 17 Python offline tests | — |

Network hosts touched: the Greenhouse and Ashby job-board APIs and the posting pages (scan and liveness only). The prototype and the ingest make no network calls.

## Facts that bite — how this recipe handles each

| Fact | Handling |
|---|---|
| Role quality carries weight 0 in the scorer | Kept at 0. PM has no SOC of its own: Stripe's 19 PM-family filings use six different SOC codes. National medians across candidate SOCs run $100,750 – $171,200. Context only. |
| Only Form D samples ship | Joined as context; reported with the 200-of-58,329 denominator. |
| Planned dirs and the `snickerdoodle` CLI don't exist | Not used. Outputs: `course/2026fa/submissions/aravindravi7/…/runs/`. Run logs: `logs/runs/`. |
| The scorer reads a missing liveness factor as 1 | Unchecked postings are HELD, never sent (`fixtures/BROKEN-no-liveness-roles.json`). |
| A missing sponsorship term still scores (fit 0.7 → 0.21 → Consider; found by Aravind Ravi) | Unmatched companies are HELD (`fixtures/BROKEN-no-sponsorship-roles.json`). |
| "authorized" in the profile zeroes sponsorship | Exit 4 unless the scorer confirms `profile_needs_sponsorship: true`. |
| Hand-written fixture data looked like records (an A2 error) | Fixture-derived values are labeled `fixture`; they never clear a gate; fixture rows are `DEMO` with the outcome in `would_be_if_live`; a live run fed record-type fixture data exits 5. |

## Phase gates

| Gate | Testable condition | On fail | Cleared by |
|---|---|---|---|
| G0 input / OPT window | persona dates parse; OPT end after `--as-of`; a live run names `--rules`; no record-type fixture input in a live run | exit 3 / 2 / 5, nothing written | human fixes inputs |
| G1 entity | exactly one 80 Days row by normalized name, or a human `csv_name`; in the DOL data, one employer key, with legal-suffix variants resolved by a shared `EMPLOYER_FEIN` (record) or a human `lca_resolution {lca_employer_names, resolved_by, date, basis}` | HOLD `company-not-in-csv` (unless the LCA-filed rule applies), `ambiguous-company-match`, `ambiguous-lca-employer`, `lca-resolution-conflict` | named human, with a basis |
| G2 liveness | URL is `active`/`expired` in a liveness record | `uncertain`/absent → HOLD; `expired` → factor 0 | named human `liveness_human {status, by, date}`; never reopens `expired`; fixture data never clears |
| G3 timeline | lag ≤ unemployment allowance left; OPT-end slack mapped by `timeline_steps`; **margin (allowance − lag) ≥ `unemployment_margin_hold_days`** | factor 0 → Skip; margin below threshold → HOLD `unemployment-margin` | named human `timeline_human {decision: accept|decline, by, date, basis}` (decline keeps the hold) |
| G4 decision | before tailoring an Apply: E-Verify looked up by a person | next action `check-e-verify`; not-found/terminated → `confirm-e-verify-first` | named human `e_verify_human {status, by, date}` |

## Sponsorship rules (from the rules file; the live run's values were set by the student)

Title classifier v1.1 (`classifyTitle`): excluded phrases blanked first (`product marketing|design|designer|specialist|support|engineer|analyst|counsel|operations|strategy`); `product` = `product (manager|mgr|owner|management|mgmt|lead)` or `APM`; `program` = `(technical) program (manager|mgr)`; a bare `PM`/`TPM` is ambiguous and counted as neither.

Rules are tried in the rules file's `order`; the first match wins.

| Rule | Condition | Tier (scorer name) | p in the live run |
|---|---|---|---|
| `title-family-match` | 80 Days approvals and a stored PM title in the posting's family | Proven | 0.88 |
| `lca-title-family` | a filed PM-family LCA in the posting's family (filed = `Certified` or `Certified - Withdrawn`); allowed with no 80 Days row | LCA-filed (own name, not demoted) | 0.86 |
| `adjacent-family` | approvals; PM title stored only in the other family | Likely (demoted) | 0.85 |
| `sponsor-not-pm` | approvals; no PM title | Possible (demoted) | 0.60 |
| `no-h1b-record` | none of the above | None (scorer: `unknown`, demoted) | 0.43 |

Confirmed LCA absence and uncertified PM filings never move a tier (context only). The v0.1.1 values remain in `fixtures/rules.v0.1.1.json` for the backward-compatibility test. A certified LCA is a filing, not an approval.

## Employer tier (ordering only)

Tiers 1–4 from `persona.employer_tiers` (your-input), else the AI-predicted list (model-judgment), else a fallback rule (never tier 1 or 2). Ordering within a decision only; a test proves it never changes a decision.

## Workflow (verbatim)

```bash
REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/fixtures/portals.pm-sponsors.yml npm run ats:scan
```

```bash
node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/liveness-json.mjs --file <run>/urls.txt --out <run>/liveness.jsonl
```

```bash
node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --shortlist <run>/shortlist.json --persona <run>/persona.json --rules <run>/rules.json --liveness <run>/liveness.jsonl --out <run>/pass1 --as-of YYYY-MM-DD
```

**Stop.** A person reads `pass1/pm-triage-report.md` and records G1/G2/G3/G4 decisions in a copy of the shortlist, then re-runs into `<run>/pass2`. Wrapped or background commands propagate the real exit code (`cmd; rc=$?; echo "exit=$rc" >> log; exit $rc`). Pass `--as-of` explicitly: the scanner stamps the UTC date, which can be a day ahead of local time.

## What it can and cannot verify

**Can verify (record):** the 80 Days row matched and how; its approvals and stored titles; the DOL PM-family filings per employer (status, family, SOC, wage, new-hire vs continuation, case numbers), including whether the employer filed any H-1B application at all; whether legal-suffix variants share an FEIN; the liveness checker's verdict; Form D sample filings; BLS medians.

**Your input:** fit, OPT dates, unemployment days, hiring lag, the rules file, entity resolutions, and every named-human gate decision.

**Cannot verify:**
- Whether a certified LCA became an approved visa or a hire.
- PM sponsorship that's missing from both the top stored titles and this nine-month LCA window.
- Whether an employer the name join can't match files under another name: 49 of 130 Proven employers (38%) are `lca-unknown`.
- Filings by the same FEIN under a different trade name are not grouped by the join (1,249 FEINs affected in the FY2026 Q3 employer index; none of the shortlist employers, checked 2026-10-21).
- Form D coverage is the shipped sample only: 200 of 58,329 filings, so absence from it says nothing about funding.
- The calibration rates behind the p values use confirmed name matches only, not all employers.
- The 1–89-day timeline step (0.3) can never produce anything but Skip under the scorer's weights: the maximum composite is 0.195, below the 0.20 Consider floor.
- The mode cannot see eligibility screens (new-grad experience caps); a human catches them at the E1 gate, as in this run's declines of w01 and w08.
- E-Verify enrollment is checked by a human only. The E-Verify employer search defaults to employers enrolled this year. My first search found nothing for Datadog, Reddit and Asana under that default; re-searched with Date Enrolled = Last 10 years, all three appear as enrolled. A not-found from the default view is a false negative.
- Lottery odds, and what this employer would pay this hire.

## Output contract

**Agent log — `pm-triage-log.json`:** the inputs with provenance and SHA-256 hashes, the rules (version, file, set_by, values), and per-role values. Each per-role value is `{value, source}`, with `source ∈ {record, your-input, model-judgment, fixture, none}`. Per role it holds `sponsorship`, `lca` (status, evidence, matched_by including FEIN or human resolution), `liveness`, `timeline`, `unemployment_margin`, `gates {g1..g4}`, `holds[]`, `decision` (Apply / Consider / Skip / HOLD / DEMO), `would_be_if_live` (DEMO rows), `scorer_trace` and `next_action`.

**Human report — `pm-triage-report.md`:** executive summary, then:
- the decisions table, with the would-be-if-live column, tiers, evidence, liveness, gates and next action;
- holds;
- the DOL per-filing evidence;
- funding;
- role quality;
- verified vs. assumed;
- the run record.

**Reader:** the student. **Decision enabled:** what to tailor today, whom to network with, what to resolve.

## Stop conditions

Refuse and invent nothing when:
- G0 fails;
- the 80 Days or LCA schema drifts;
- a checksum pin mismatches;
- an unrecognized LCA status appears in the ingest;
- the scorer fails or misreads the profile;
- fixture data reaches a live run;
- a fuzzy match is requested;
- or an `uncertain` posting is to be treated as live without a named human.

## Next action per result (3-3-2)

| Result | Next action | Block |
|---|---|---|
| Apply, G4 cleared | `tailor` | 2 h research-and-apply |
| Apply, G4 open | `check-e-verify` first | 2 h |
| Apply, E-Verify not-found/terminated | `confirm-e-verify-first` | 3 h networking |
| Consider + `sponsor-not-pm` / `adjacent-family` | `network-first` | 3 h networking |
| `no-h1b-record`, live, fit ≥ floor | `non-h1b-fallback` | 2 h, after H-1B roles |
| Skip, liveness-gated, Proven | `network-list` | 3 h networking |
| Skip, timeline-gated | `skip-timeline` | 0 |
| HOLD | `resolve-hold` (the reason says what to do) | — |
| DEMO | none (fixture data) | — |

## Proposed additions

v0.1's three typed TODOs: 2 closed, 1 withdrawn. **Open: 0.** (An eligibility-cap gate is a next step in the worked run's reflection, not a recipe TODO.)

1. **DOL LCA per-filing data.** [CLOSED: DATA SOURCE — `LCA_Disclosure_Data_FY2026_Q3.xlsx` (251,850,891 bytes, sha256 `f8ca8448…bd28b3`), downloaded by Aravind Ravi on 2026-10-21 from the OFLC performance-data page; compacted to `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/` (moved from the proposed `data/dol/lca/` to stay in the contribution namespace); provenance in `lca-pm-filings-fy2026_q3-audit.md`.]
2. **E-Verify employer list.** [WITHDRAWN: DATA SOURCE — E-Verify has no official bulk download; the employer search on e-verify.gov is interactive only and updated daily. The check is a recorded human step at G4 (`e_verify_human`).]
3. **Machine-readable liveness.** [CLOSED: DEV — `liveness-json.mjs` writes JSONL using the repo's own `checkUrlLiveness` (no maintained file patched); the triage reads JSONL and text; handoff met by the JSONL parser tests.]
## Run-log template (format for `logs/RUN_LOG.md`; filed under `logs/runs/` per Fall 2026 rules)

```markdown
## YYYY-MM-DD — pm-sponsor-title-match v0.2.0 — <sample | live run>

### Executive summary
<two or three plain sentences: what was run, what it found, what a human still has to do>

- **Recipe:** recipes/cases/2026fa/aravindravi7-pm-sponsor-title-match.md v0.2.0
- **Mode:** sample | live
- **Inputs:** shortlist, persona (fictional), rules (version, set by), liveness, LCA extract sha256, 80 Days CSV sha256
- **Commands:** <verbatim, with each command's own exit code>
- **Outputs:** <run dir>/pass1, pass2 (pm-triage-log.json, pm-triage-report.md, roles.json, role-scores.{json,md})
- **Result:** evaluated N → Apply a · Consider c · Skip s · HOLD h · DEMO d
- **Gate decisions:** G1 … · G2 … · G3/E1 … · G4 … (who, what, when, basis)
- **Open issues:** <what did not work or is still missing>
```
