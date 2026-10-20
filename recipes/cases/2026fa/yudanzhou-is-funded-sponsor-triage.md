---
status: DRAFT  # corrected 2026-10-20 (review of 2026-10-12): 4 open TODOs means DRAFT; DRAFT→SPECIFIED needs zero. Successor: yudanzhou-da-sponsor-triage.md v0.2.0
todos_open: 4
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# is-funded-sponsor-triage: funded companies × H-1B history × analyst role family

## Executive summary

**What it does.** For an international Information Systems master's student who prefers venture-funded companies and has not yet chosen between Business Analyst, Data Analyst, Product Analyst, and IT Consultant roles, this recipe answers two questions the job market hides:

1. Which funded companies have actually sponsored an H-1B, and for which of those four role families?
2. For a list of postings, which deserve an application, which belong on a networking list, and which to skip?

**Who it's for.** An F-1 student in a STEM-designated IS program (e.g. CIP 14.0903) about 8 months before graduation, with post-completion OPT and its 90-day unemployment limit ahead.

**What it decides, and what it doesn't.** It returns a sourced Apply / Consider / Skip from the repo's existing scorer, plus a "held out" list with a next action for each. It never turns "no record" into "no". A blank sponsorship history goes to the networking list, not to Skip. The human decides at every gate.

**Status.** RUNNABLE-SAMPLE: it runs end to end on the shipped CSV, the shipped Form D samples, and demo postings. It has not been run on live postings.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, lifecycle.
2. `DOMAIN.md` → *Known gaps*.
3. `DATA_CONTRACT.md` §Zero-Conditions: this recipe uses a fictional persona only.
4. `data/80-days-to-stay/README.md`: how the CSV was built (DOL LCA + USCIS H-1B Employer Data Hub mapped onto SEC startups).
5. This file and `recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.card.md`.

## Purpose and source inventory

| Source | Path / command | Exists? | Label of what it yields |
|---|---|---|---|
| Funding + H-1B history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | yes (30,369 rows) | `record` |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | yes (4 × 50 companies) | `record` |
| Existing scorer | `scripts/score/role-scorer.mjs` (`npm run score`) | yes | composite + audit trace |
| Liveness checker | `scripts/ats/check-liveness.mjs` (`npm run ats:liveness -- <url>`) | yes (needs Playwright + network) | `record` once a human pastes the result |
| **Prototype** | `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py` | yes | see Output contract |
| Policy rules | `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/config.json` | yes | `your-input` |
| Persona | `search/examples/is-ms-2027-funded-undecided/persona.example.json` | yes (fictional) | `your-input` |
| Postings | `.../fixtures/postings.sample.json` | yes (demo, invented) | `your-input` |

One command, from the repo root:

```bash
python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02
```

Tests (offline, fixtures only):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v
```

## Phase gates

Each gate is a hard stop with a testable condition against paths that exist.

| Gate | Kind | Test | Pass | Fail | Human clears it by |
|---|---|---|---|---|---|
| **G1 Data** | hard stop | CSV exists and has `company_name, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, top_job_titles_sponsored` | continue | exit 2, `✗ STOP: G1 data gate …`, no output written | restoring the shipped CSV; never by editing columns to fit |
| **G2 Liveness** | **gate** (multiplier) | posting has `liveness.result ∈ {active, expired}` | active → factor 1, expired → factor 0 | `unchecked`/`uncertain` → **held out**, not scored | running `npm run ats:liveness -- <url>` and recording the result with a date |
| **G3 Visa timeline** | **gate** (multiplier) | `max(today + hiring_lag, opt_start) ≤ opt_start + (allowed − used)` | factor 1 | factor 0 → Skip regardless of votes | confirming OPT start, days used, and the hiring-lag assumption in the persona |
| **G4 Decision** | human | `role-scores.md` and `triage-report.md` exist | — | — | reading each row term by term; any override needs a written reason (scorer ignores reasonless overrides) |

Liveness and visa timeline are gates, not votes: a dead posting or a closed window scores zero.

## Workflow

1. **G1.** `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (the script re-checks columns).
2. **Edit inputs (human).** Set the persona's OPT dates, days used, hiring-lag assumption, and self-rated fit per family. Put postings in a JSON shaped like `fixtures/postings.sample.json`.
3. **G2 (human).** For each posting: `npm run ats:liveness -- <url>`, then record `active` / `expired` and the date.
4. **Run.** `python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --persona <p.json> --postings <postings.json> --out-dir <your folder>`. The script:
   - classifies each posting title into a role family (`config.json` keywords);
   - matches the company: exact name, then suffix-stripped name, **never fuzzy**;
   - maps the record's approval count + family match to a tier and `p` (`config.json`, `your-input`);
   - writes `roles.json` and calls `node scripts/score/role-scorer.mjs roles.json --out-dir <folder>`;
   - writes `triage-log.json` (agent) and `triage-report.md` (human).
5. **G4 (human).** Read `triage-report.md`, then `role-scores.md` for the term-by-term audit.

**Why no `--profile` is passed to the scorer:** with a profile, the scorer decides "needs sponsorship" by regex on the free-text `authorization` field, ignoring `needs_sponsorship`. A profile whose text says "work authorized" (true of every OPT student) flips sponsorship weight to 0. Reproduced in the worked run. Without a profile, the scorer defaults to "needs sponsorship", which is this persona's case.

## What it can verify (record)

- Whether a named company has a row in the CSV, by exact or suffix-normalized name, and whether that match is unique.
- That row's `Total Approvals`, `Total Denials`, `top_job_titles_sponsored`, `latest_funding_stage`, `latest_funding_date`.
- Whether the company appears in the four shipped Form D sample files.
- Counts over the whole CSV: funded companies (27,874), funded with ≥1 approval (1,532), and of those funded within 24 months of the run date (131 on 2026-10-02); companies per role family.

## What it cannot verify

- **Whether a company hires OPT graduates.** The data has H-1B approvals only. A blank is "no record matched", not "won't hire".
- **E-Verify enrollment**, which STEM OPT requires. No shipped file has it.
- **The sponsorship probability.** `p` is a mapping I chose from counts (`config.json`), not a measured probability.
- **Sponsorship by role family beyond the top titles.** `top_job_titles_sponsored` lists only a company's top titles, so "no family match" means "not in top titles".
- **Whether "funded" means a startup.** Form D is also filed by funds and large partnerships. The CSV gives DELOITTE CONSULTING LLP a "Series C" stage.
- **Funding after 2025-09-26** (latest date in the CSV). Full Form D quarters are gitignored (Fact 3). The demo run matched 0 of 7 resolved companies against the samples.
- **Posting liveness in the sample run.** Demo liveness values are `your-input`.
- **Fit.** Self-rated per family, `your-input`. No model judgment is used anywhere.

## Output contract

**Agent log:** `<out-dir>/triage-log.json`
```
{ _recipe, run_date, inputs{csv, form_d_glob, config, persona, postings},
  timeline_gate{factor, source:"your-input", opt_start, window_end, earliest_start, reason},
  summary{funded_companies, funded_with_h1b_approvals, funded_recently_with_h1b_approvals,
          by_family{<family>{companies, examples}}, source:"record", caveat, form_d_sample{...}},
  postings[{posting_id, company, title, url, family, status, company_match,
            funding{stage, latest_date, months_since, stale, source:"record"},
            form_d_sample{found, filings, source:"record"},
            sponsorship_evidence{total_approvals, total_denials, top_titles_sponsored,
                                 titles_in_my_family, source:"record"}}],
  scorer_output }
```
`status ∈ scored | no-h1b-record | no-company-row | ambiguous-company-match | liveness-unchecked | off-target-title`.

**Scorer input:** `<out-dir>/roles.json`. Each role has `sponsorship{p, tier, source:"your-input", evidence{…, source:"record"}}`, `fit{p, source:"your-input"}`, `liveness{factor, source}`, `timeline{factor, source:"your-input"}`.

**Human report:** `<out-dir>/triage-report.md`. Executive summary, run record, family table [record], per-posting decision with next action, and "what this run did not verify". The scorer's `role-scores.md` sits beside it.

## Stop conditions, and next action per result (the 3-3-2 day)

| Result | Next action | 3-3-2 block |
|---|---|---|
| Apply | Tailor an application | the **2** apply hours |
| Consider | Research the soft spot (tier Likely/Possible); tailor only if it clears | the **2** hours, if time remains |
| Skip (score or gate) | Spend no time | saved |
| `no-h1b-record` / `no-company-row` | Networking list: ask a contact whether they hire OPT grads or sponsor | the **3** networking hours |
| `liveness-unchecked` | Run `npm run ats:liveness`, re-run | 5 minutes, then re-triage |
| `ambiguous-company-match` | Human picks the right CSV row | — |
| `off-target-title` | Skip | saved |

**Stop and do not invent a value when:** G1 fails; a company match is ambiguous; approvals are blank (never coerce to 0); liveness is unchecked; asked to raise a role's `p` or weaken a keyword rule so a liked role passes; asked to call any network host. This recipe calls none. Liveness is a separate, human-run command.

## Proposed additions

- `[TODO: DEV]` Read `npm run ats:liveness` output directly instead of a hand-copied result, so G2's source can become `record`.
- `[TODO: DATA SOURCE]` An OPT-hiring or E-Verify signal per company (e.g. the E-Verify employer list), so "no H-1B record" can be split into "hires OPT" vs "no evidence".
- `[TODO: DATA SOURCE]` Full Form D quarters (gitignored today) to measure funding recency beyond the 50-company samples.
- `[TODO: DEV]` Per-title LCA counts instead of `top_job_titles_sponsored`, so family matching isn't limited to a company's top titles.

## Logging

- Run log: `logs/runs/2026fa-yudanzhou-<n>.md` using the template in `recipes/_shared.md`. Never edit `logs/RUN_LOG.md`.
- Never log the real persona. Use the fictional one in `fixtures/`.

### Run-log template (`logs/runs/`)

```markdown
## YYYY-MM-DD — is-funded-sponsor-triage <sample|live> run

- **Recipe:** recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md v0.1.0
- **Inputs:** CSV path · Form D glob · persona file · postings file · --today
- **Command:** python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py ...
- **Outputs:** <out-dir>/roles.json, role-scores.{json,md}, triage-log.json, triage-report.md
- **Result:** N postings → scored / held out; Apply · Consider · Skip; skip rate
- **Gates:** G1 pass/fail · G2 held-out count · G3 factor + window end · G4 reviewed by <name>
- **Open issues:** what did not work or is still missing
```
