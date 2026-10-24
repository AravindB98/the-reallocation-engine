---
status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED
todos_open: 7
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# de-mlops-h1b — Data Engineering / MLOps H-1B triage for a pre-OPT student

## Executive summary

**What it does:** takes a short list of data-engineering and MLOps job postings and, for
each one, checks three things against evidence: whether the company has a record of H-1B
approvals for this kind of work, whether the posting is still live, and whether the job's
start date fits the student's expected work-authorization window. Postings that pass get a
score from the engine's existing scorer. Postings with missing evidence are put **on hold**
with a reason, and nothing is filled in for them.

**Who it is for:** an international master's student in data analytics engineering who
graduates in December 2026, has **not yet received an OPT work card**, and will need an
employer to sponsor an H-1B visa. It is built for Data Engineer and MLOps / ML Platform
titles specifically.

**What it decides, and what it doesn't:** it sorts postings into apply, consider, skip, or
hold, each with a next action: tailor an application, network into the company, or drop it.
It never decides that a company "does not sponsor" just because it has no record in the data,
and it never treats recent funding as evidence of sponsorship. A person reads the report and
makes every final call.

Two customers: this file is for the agent; `gnanasudharsan-de-mlops-h1b.card.md` is for the
human.

**Handoff condition (done when):** the run prints one summary line, and every posting in
the input appears exactly once in the JSON log, either in `scored` (with the scorer's own
trace) or in `holds` (with a reason code). Every term sent to the scorer carries a
`source` in {record, model-judgment, your-input}, and the scorer's `profile_needs_sponsorship`
is `true`. "Looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md`, then `DOMAIN.md` (Known gaps items 3 and 9: role quality carries 0.0 weight; local wage feeds nothing).
2. `data/80-days-to-stay/README.md` if present, then the CSV header below.
3. `scripts/score/role-scorer.mjs` — the combiner this recipe feeds, unchanged.
4. `course/2026fa/submissions/gnanasudharsan/CHANGE-BRIEF.md` — predictions this recipe is checked against.
5. This recipe and its card.

## Source inventory

| Evidence | Path / command (exists 2026-10-01) | Used as |
|---|---|---|
| H-1B approvals, denials, top sponsored titles, latest funding date | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; columns `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date`) | sponsorship vote (record) + funding context |
| Form D filings | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` — **samples: first 50 companies of each quarter** | context only |
| Role-quality context | `data/bls/compact/soc_occupation_compact.csv` rows `15-1243.00`, `15-1243.01`, `15-1252.00`, `15-2051.00` | context only (scorer weight 0.0) |
| Posting liveness | `npm run ats:liveness -- <url>` (`scripts/ats/check-liveness.mjs`), **one URL per call**, stdout appended to a saved file | liveness gate (record) |
| Posting discovery (human step) | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs` — read-only GET; the **only** network host this recipe names | builds `postings.json` by hand |
| Combiner | `scripts/score/role-scorer.mjs` (`npm run score`), called with `--profile` | decision + per-term trace |
| Prototype | `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs` | builds `roles.json`, runs the scorer, writes log + report |
| Offline test | `node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/` | fixtures under that folder's `fixtures/` |

Prototype command (one line, from repo root):

```bash
node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt
```

Inputs the student supplies (your-input): `persona.json` (`program_end_date`,
`assumed_ead_start_date`, `stem_extension_assumed`, `needs_sponsorship`, `authorization`) and
`postings.json` (per posting: `company`, optional `legal_name`, `title`, `url`, `fit` 0–1,
`start_date` as `YYYY-MM-DD` or `"flexible"`).

## Proposed additions (not built)

- `[TODO: DATA SOURCE]` **Title→SOC crosswalk for sponsored titles.** The CSV has no SOC column, so "sponsored this kind of role" is a keyword match on at most ~5 top titles. A DOL LCA disclosure extract with `SOC_CODE` per petition would replace the keyword rule with a record.
- `[TODO: DATA SOURCE]` **DOL LCA data for employers absent from the CSV.** The CSV is built from Form D filers, so Google, Amazon, and Meta are missing, and these are major data-engineering employers. They currently go to `not-in-dataset`.
- `[TODO: DATA SOURCE]` **E-Verify employer list.** A STEM OPT extension requires an E-Verify employer. The engine has no such data, so this recipe cannot check it.
- `[TODO: DEV]` **Location gate.** A posting outside the US cannot lead to an H-1B. The sample run scored a "Remote – Ireland" Twilio role as Apply because no gate reads location. Proposed: hold any posting whose board location (record) is not US.
- `[TODO: DEV]` **Liveness batch defect, to report upstream.** `npm run ats:liveness -- <url1> <url2> …` reused one page, and each navigation was interrupted by the previous URL's redirect, giving 10 of 12 `uncertain` on 2026-10-01 (`sample/liveness-batch.txt`). Workaround here: one URL per call. The maintained script is not patched by this recipe.
- `[TODO: DEFINE]` **Tier→p values.** Proven 0.9 and Likely 0.6 are the Ch.11 worked-example values; Possible 0.3 and None 0.0 are my extension. They are uncalibrated and need a human to accept or replace them, with reasoning.
- `[TODO: APPROVE]` **Scorer profile regex.** `scripts/score/role-scorer.mjs:60` treats any authorization text containing "authorized" as not needing sponsorship, so "OPT EAD not yet authorized" zeroes the sponsorship weight. The prototype refuses to report in that case (exit 3). Whether the maintained scorer changes is a maintainer decision.

## Phase gates

Each posting stops at its first failed gate. A held posting is **not** sent to the scorer.

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G0 profile (whole run) | persona dates parse; `assumed_ead_start_date` is on/after `program_end_date` and ≤ 60 days after it **[verify against current USCIS rules]**; EAD start not already past; `needs_sponsorship: true`; **after scoring**, the scorer's `profile_needs_sponsorship` is `true` | continue | exit 2 (bad persona) or exit 3 (scorer misread profile); **no report written** |
| Family | title matches the data-engineering or MLOps keyword list (model-judgment, printed in the report) | continue | HOLD `off-target-title` |
| G2 sponsorship evidence | `legal_name` (or posting company) normalizes, by the rule in `scripts/sec/sec-all-quarters.py:34`, to exactly one CSV row whose `Total Approvals` is non-blank | tier assigned from record counts | 0 rows → HOLD `not-in-dataset`; >1 → HOLD `ambiguous-company`; blank → HOLD `no-sponsorship-record` |
| G1 liveness | the saved liveness file says `active` or `expired` for this exact URL | `active` → 1.0; `expired` → 0.0 (scorer gates it to Skip) | `uncertain`, conflicting lines, or URL absent → HOLD `liveness-unconfirmed` |
| Inputs present | `fit` is a number in [0,1]; `start_date` is a date or `"flexible"` | continue | HOLD `no-fit-input` / `no-start-input` |
| G3 timeline | start date (or EAD start, if `flexible`) is on/after the assumed EAD start; count March registration windows between start and assumed authorization end | factor `min(1, seasons/3)` | start before EAD start, or 0 seasons → factor 0.0 (scorer gates it to Skip) |

Sponsorship tier rule (model-judgment on record counts): **Proven** = ≥10 approvals and at
least one top sponsored title in the posting's family; **Likely** = ≥10 approvals with no
family title, or 1–9 approvals with one; **Possible** = 1–9 with none; **None** = 0
approvals. The scorer demotes Likely/Possible from Apply to Consider.

Assumed authorization end (your-input) = EAD start + 12 months − 1 day, plus 24 months if
`stem_extension_assumed`.

## What it can and cannot verify

**Can verify (record):**
- A company's H-1B approval and denial counts and its top sponsored titles, as they appear in the shipped CSV, for exactly one normalized-name match.
- That a posting URL returned `active` / `expired` / `uncertain` from the repo's liveness checker on the date the saved file was written.
- Whether the company appears in the four 50-company Form D samples, and its latest funding date in the CSV.
- That the scorer read the profile as needing sponsorship.

**Inferred (model-judgment), shown as such:** title→family keyword match; sponsorship tier rule and tier→p values; family→SOC mapping for the wage context.

**Assumed (your-input), shown as such:** program end and EAD start dates; STEM-extension eligibility; one H-1B registration window per March; the `min(1, seasons/3)` timeline rule; each posting's fit rating and start date; `legal_name` when the brand name differs from the legal entity (e.g. Instacart → Maplebear Inc).

**Cannot verify:**
- Whether the company will sponsor *this* role now. Counts are historical, and the top-titles field holds only ~5 titles, so Databricks (1,640 approvals) shows no data-engineering title and lands at Likely.
- Anything about a company absent from the CSV, or with blank approvals. That is 28,812 of 30,369 rows, so most companies have no record either way.
- Form D filings outside the samples. A miss means "not in sample", not "no filing".
- E-Verify enrollment, posting location, seniority fit (almost every US opening in the sample was Senior), or which SOC code an employer would file under.
- Whether the keyword rule is right. It wrongly matched "Specialist Solutions Architect – Data Engineering & Warehousing" and "Hardware Engineer – GPU & AI Infrastructure" in the sample.

Recent funding never stands in for sponsorship: the scorer has no funding term, and a
funded company with blank approvals is held (`no-sponsorship-record`), not scored.

## Output contract

Written to `--out-dir` (default `course/2026fa/submissions/gnanasudharsan/runs/<date>/`):

- **Agent:** `de-mlops-h1b-log.json` contains `inputs` (path + SHA-256 each), `gate_g0` (each date with its label), `family_keywords`, `summary {postings, scored, held, apply, consider, skip, not_apply_rate}`, `roles_sent_to_scorer` (exact scorer input), `scored` (the scorer's output rows, unchanged), `holds` (`role_id, company, title, url, hold, detail, next_action`), `context` (funding + Form D, labeled record), `role_quality_context` (BLS rows), and the scorer's stdout.
- **Human:** `de-mlops-h1b-report.md`, which opens with an executive summary, then: run record; scored-roles table (recommendation, composite, each term with its label, next action); on-hold table (reason, detail, next action); context tables marked "shown, not scored"; and a verified-vs-inferred list.
- **Scorer's own files:** `role-scores.json` + `role-scores.md`, copied from a staging dir only after G0's scorer check passes.
- **Scorer input:** `roles.json` + `profile.json` in `--roles-dir` (default: the prototype folder). Its shape follows `data/examples/ch11-roles.json`, plus extra evidence fields, which the scorer ignores.

## Stop conditions and next action per result

Stop, and write no report, when: the persona fails G0 (exit 2); the scorer reads the profile
as not needing sponsorship (exit 3); the scorer exits non-zero (exit 4); or the CSV lacks
`Total Approvals` (schema drift — exit 2, no guess).

Do not: fill a blank approval count with 0; fuzzy- or prefix-match a company; treat
`uncertain` as live; copy a national wage into a decision; raise a weight so a liked role
passes; edit the scorer.

| Result | Next action (3-3-2 day) |
|---|---|
| Apply | tailor this application, in the 2 research-and-apply hours |
| Consider | confirm the soft spot first (usually "Likely" sponsorship): ask a contact, then tailor or drop |
| Skip | drop it; the time goes to networking (3) or the credibility project (3) |
| HOLD `not-in-dataset` / `no-sponsorship-record` | networking list: ask an employee whether the team sponsors. Not a "no" |
| HOLD `ambiguous-company` | human picks the legal entity, sets `legal_name`, and re-runs |
| HOLD `liveness-unconfirmed` | human opens the posting; re-run `ats:liveness` for that one URL |
| HOLD `off-target-title` / `no-fit-input` / `no-start-input` | out of scope, or fill in the missing your-input and re-run |

## Verification checks

- `node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/` (14 tests, offline: blank → hold, absent → hold, Snowflake exact match, brand vs legal name, ambiguous → hold, uncertain → hold, expired → gated Skip, start before EAD → Skip, label coverage, past persona → exit 2, regex trap → exit 3).
- `node scripts/conformance.mjs scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/ recipes/cases/2026fa/`
- Hand cross-check: pick one scored row and `grep` its company in the CSV; approvals, denials, and titles must match the report.

## Run-log template (`logs/runs/2026fa-gnanasudharsan-<n>.md`)

```markdown
## YYYY-MM-DD — de-mlops-h1b sample run

- **Recipe:** recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md v0.1.0
- **Inputs:** persona <path>; postings <path> (<n> postings, fit/start_date placeholder? yes/no); liveness <path> (written <date>, one URL per call); CSV + Form D samples + BLS compact (SHA-256 in the JSON log)
- **Commands:** <prototype command, verbatim>; <test command>
- **Outputs:** <out-dir>/de-mlops-h1b-log.json, de-mlops-h1b-report.md, role-scores.{json,md}
- **Result:** <n> scored (Apply/Consider/Skip), <n> held by reason; not-apply rate <x>; scorer profile_needs_sponsorship = true
- **Gate decisions:** G0–G3 — who cleared what, when (no gate clears itself)
- **Open issues:** <holds needing a human; defects found; TODOs touched>
```
