---
status: DRAFT
todos_open: 3
last_gate: "Gate A (board confirmation), 2026-10-03, cleared by AdityaHasija37 — scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/boards.sample.json"
attestation: null
recipe_version: 0.1.0
---

# msis-pm-network-targets — sponsored product roles: apply, network, or skip

## Executive summary

**What it does.** It finds companies whose own visa records show they have sponsored
product-manager or product-analyst roles, then reads each company's public job board.
Every company gets one of four outcomes. **Apply** means a matching role is open now.
**Network** means the company sponsors product roles but has no matching opening, so now
is the time to make a contact. **Needs a person** means its job board could not be
confirmed or read. **Skip** means there is no sponsorship evidence in the data.

**Who it is for.** An international master's student in Information Systems who graduates
in December 2026, has about three years of OPT plus the STEM extension ahead, has around
3.5 years of work experience, and wants product roles that ask for 1–5 years, anywhere in
the US. For this person the visa clock is not the tight constraint. Getting hired as a
product manager is, and that kind of hiring leans heavily on referrals.

**What it decides, and what it leaves to a person.** It never guesses. A person confirms
each job board before it is read (Gate A) and reads the report before contacting anyone
or applying (Gate D). A board that cannot be read is reported as unreadable, never as "no
openings". The tool cannot check E-Verify enrollment (required for STEM OPT), which years
the visa counts cover, or which occupation code an employer files product roles under.

**Status.** DRAFT. A sample run completes end to end on the shipped data, but three
inputs this recipe needs are not available, so it does not claim a later stage.

Two customers: this file is for the agent;
`recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.card.md` is for the person.

**Handoff condition (done when):** the run exits `0`; `out/run-log.json` and
`out/report.md` exist; every evaluated company has exactly one `route` from
{`apply`, `consider`, `scored-skip`, `network`, `human-check`, `board-unknown`, `skip`}
with a non-empty `reason`; every term in `out/roles.json` carries a source label in
{`record`, `your-input`, `model-judgment`}; and no company whose board was not read is
routed `network`. "The report looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, TODO closure.
2. `DOMAIN.md`: what is runnable, known gaps.
3. `data/80-days-to-stay/data/README.md`: column meanings; null sponsorship means "no
   trace", not "does not sponsor".
4. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`: coverage and funding age.
5. `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/README.md`.
6. This recipe and its card.

## Source inventory

| Source | Path / command | Label | Human check |
|---|---|---|---|
| Sponsorship + funding records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | Spot-check one company's `Total Approvals` against the report |
| Occupation wages (context only) | `data/bls/compact/soc_occupation_compact.csv` | record | None: feeds no decision |
| Board listing | `scripts/ats/providers/greenhouse.mjs`, `lever.mjs`, `ashby.mjs` (imported unchanged) | record | Gate A |
| Network transport | `scripts/ats/providers/_http.mjs` `makeHttpCtx()` (host allowlist and `redirect:'error'` in the providers) | n/a | n/a |
| Decision | `scripts/score/role-scorer.mjs`, run as a CLI (it has no exports) | n/a | Read the audit trace |
| Single-posting liveness (optional spot check) | `npm run ats:liveness -- "<posting-url>"` | record | `uncertain` counts as closed |
| Prototype | `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs` | n/a | n/a |
| Rules | `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/rules.mjs` | your-input | Read before each run |
| Persona (fictional) | `…/fixtures/persona.fixture.json` | your-input | OPT end date |
| Gate A file | `…/fixtures/boards.sample.json` (worksheet: `…/fixtures/boards.proposed.json`) | your-input | Gate A |
| Saved board responses | `…/fixtures/sample-responses/` (2026-10-03) | record | Re-read if older than 2 weeks |

Network hosts this recipe may call: `boards-api.greenhouse.io`, `api.lever.co`,
`api.ashbyhq.com` (board listings, through the providers), and, only for the optional
spot check, the posting URL itself. No other host.

## Rules (your-input; set by AdityaHasija37, 2026-10-03)

| Rule | Value | Reason |
|---|---|---|
| Sponsorship minimum | ≥ 3 approvals | 1–2 approvals is too thin to trust; could be a one-off |
| Proven tier | ≥ 10 approvals **and** ≥ 90% approval rate → p 0.9 | Repeated, reliable sponsorship |
| Likely tier | 3–9 approvals, or ≥ 10 with rate < 90% or unknown → p 0.6 | Sponsors, with less certainty |
| Titles in | "product manager", "product management", "product analyst" (incl. Senior, AI, Technical) | Target roles for 1–5 years |
| Titles out | intern, associate/APM, director, principal, group, staff, head, VP, chief; "Manager, Product …" | Outside 1–5 years or people-manager roles |
| Not included | Product Owner, Product Marketing, Product Designer | Different jobs |
| Location | any listed place in the US, or bare "Remote"; anything unrecognised is excluded | Anywhere in the US |
| fit | constant 0.7 for any posting passing the title rule | No AI judgment is used; fit only says "title qualifies" (matches `data/examples/ch11-roles.json`) |
| Hiring lag | 60 days | Time from application to start |

## Phase gates

Each gate is a hard stop. Gates B and C are multipliers in the scorer, not votes.

| Gate | Testable condition | Pass | Fail | Who clears |
|---|---|---|---|---|
| **A: board confirmation** | The company's entry in the boards file has `"confirmed": true` with `confirmed_by`, `confirmed_on` and `how` filled. Rule: the careers page links to or embeds the board, or its listed job IDs / titles match the board's postings. Test: see the Gate A check below the table. | board is read | route `human-check`; the board is not read | named human |
| **B: liveness** | The posting is present in the board API listing in this run (`liveness.factor = 1`, record). A fetch error (HTTP error, network, SSL) never becomes "no openings". If the optional `ats:liveness` spot check says `expired` or `uncertain`, treat the gate as closed. | posting scored | fetch failed → route `board-unknown`; posting not listed → not scored | machine; human for `uncertain` |
| **C: visa timeline** | `persona.opt_end_date` is a YYYY-MM-DD date and `opt_end_date − run_date ≥ 60 days` | `timeline.factor = 1` (your-input) | run stops, exit 2, **nothing written** (`opt-end-missing` / `opt-end-invalid` / `opt-end-past` / `timeline-too-short`) | machine |
| **D: release** | A person has read `out/report.md`, including "What this cannot tell you", before any outreach or application | act on the report | no action | named human |

Gate A check (exit 0 = every confirmed board names who, when and how):

```bash
node -e "const b=require('./scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/boards.sample.json').boards;process.exit(b.every(x=>!x.confirmed||(x.confirmed_by&&x.confirmed_on&&x.how))?0:1)"
```

Additional hard stop: the prototype refuses to write a role whose liveness or timeline
value is missing, because `role-scorer.mjs` reads a missing gate as `1` (open).

## Workflow

Run from the repo root.

1. Gate A. Propose boards for candidates with no entry (an automatic slug guess from the
   `website` domain; a proposal is not evidence), then a person confirms or rejects each
   one in `fixtures/boards.sample.json`. Today, proposals are produced by hand.
   [TODO: DEV] Script the proposal step: write `boards.proposed.json` for every
   candidate without a board entry, probing only the three provider API hosts, and never
   setting `confirmed`.

2. Live board read, saving trimmed responses (title, url and location only; no job
   descriptions, so no contact details):

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --save-responses scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

3. Sample run (the documented command; offline replay of step 2, no network):

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

4. Offline tests:

```bash
node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.test.mjs
```

5. Optional liveness spot check on one Apply posting:

```bash
npm run ats:liveness -- "<posting url from out/report.md>"
```

6. Gate D: read `out/report.md`. Log the run in `logs/runs/2026fa-AdityaHasija37-<n>.md`
   (template below). Never edit `logs/RUN_LOG.md`.

## What it can and cannot verify

**Verified against a record:**
- The company's H-1B approval and denial counts and approval rate, and the titles listed
  in `top_job_titles_sponsored` (80 Days CSV).
- That a posting with this title and location was listed on the confirmed board at run
  time (board API).
- That the scorer's arithmetic is the repo's own (`role-scores.json` `trace.arithmetic`).

**Your input (rules and settings a person chose, not facts):**
- Tier thresholds, title and location rules, fit value, hiring lag, OPT end date.
- That a board belongs to the company (Gate A). This is a judgment from evidence, and an
  indirect match is weaker than a direct link.

**Model judgment:** none. No AI output enters any value.

**Cannot verify:**
- **E-Verify enrollment**, which STEM OPT requires of the employer. No such data is in the
  repo, so every row reports "not checked".
  [TODO: DATA SOURCE] An E-Verify employer list at a named path with a provenance note,
  joined on employer name.
- **Which years the approval counts cover.** Neither the data README nor the audit says.
  A company that sponsored a PM in 2016 looks the same as one that did in 2025.
  [TODO: DATA SOURCE] The fiscal-year range behind `Total Approvals`, from the data's
  maintainers or its build script, recorded in the data README.
- **How many of the approvals were for product roles.** `Total Approvals` is
  company-wide; a product title only has to appear in `top_job_titles_sponsored`. Hand
  cross-check (AdityaHasija37, 2026-10-03): Datadog's 340 approvals sit beside five top
  titles, four of them engineering or legal, one `PRODUCT MANAGER`. "Proven" means a
  proven sponsor that has sponsored at least one product title, not a proven sponsor
  *of product managers*.
- Whether a product role is **directly related to the MSIS degree** for STEM OPT
  (employer training plan, Form I-983). Business-heavy PM roles may not qualify. Not in
  any repo data.
- Which occupation code (SOC) the employer files product roles under, or at what wage
  level. There is no "Product Manager" SOC; the report shows medians for common filing
  codes as context only.
- Whether a sponsored "Product Manager" title was the same team or level as today's
  posting.
- Whether a listed posting is actually being hired for (it could be a ghost job).
- That the company in the CSV is still the same company: Sendbird now operates as
  Delight.ai, and Payward hires as Kraken. Name changes are caught only at Gate A.
- Anything about the 59 of 91 candidates (measured before the manager-title rule) whose
  board the slug guess did not find: no conclusion is drawn about their openings.

## Facts that bite, and how this recipe handles them

| Fact | Handling |
|---|---|
| `role_quality` weight is 0.0 | Not sent to the scorer. OEWS medians for SOC 15-1299, 11-3021, 15-2051, 15-1211, 13-1111 are printed as context (record) and change no decision. |
| `bls:local-wage` feeds nothing / fails on fresh clone | Not used. |
| Only SEC Form D samples ship | The four samples share **0** companies with the 80 Days CSV (checked 2026-10-03), so funding comes from the CSV's own columns and is used only to order the network list. No scorer term reads funding. Stage labels are unreliable (Datadog shows "Series C", ZoomInfo "Pre-Seed"). |
| `data/raw/`, `data/verified/`, `logs/gate-decisions/` don't exist | Gate A is recorded in the boards file; runs go to `logs/runs/`. |
| `snickerdoodle` CLI isn't real | Not used. |
| Scorer reads a missing gate as open | The prototype refuses to emit such a role (tested). |
| `ats:liveness` returns `uncertain` for a non-existent job ID | `uncertain` counts as closed. |

## Output contract

Two files, two readers, in `--out` (default `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out/`).

**`run-log.json` (agent).** Top level: `_recipe`, `_prototype`, `run_date`, `mode`
(`offline-fixture` | `live` | `live+save`), `out_dir` (repo-relative), `inputs`,
`persona` {label, opt_end_date{value, source}}, `settings` (+`source: your-input`),
`timeline` {factor, remaining_days, lag_days, opt_end, source}, `summary` {csv_rows,
candidates_from_csv, companies_evaluated, routes{…}, roles_scored, apply, skipped,
skip_rate_pct}, `scorer` {Apply, Consider, Skip} or null, `companies[]`, `soc_context[]`,
`cannot_verify[]`.

Each `companies[]` item has `company`, `route`, `reason`, and `evidence`:
- `sponsorship` {approvals, denials, approval_rate, source: record}
- `tier_rule` (your-input) and `tier`
- `sponsored_product_titles` {value, source: record, filter: your-input}
- `funding` {latest_funding_date, latest_funding_stage, source: record, used_for}
- `median_salary_offered` (record)
- `e_verify` {value: null, note}
- `board` {provider, careers_url, confirmed_by, confirmed_on, how, source: your-input,
  open_postings (record), postings_rejected_by_rule}

Scored companies also carry `scored[]`, the scorer's output per posting plus url,
location and rules.

**`report.md` (person).** It opens with `## Executive summary`, then: run record; Apply /
Consider table (company, posting link, location, scorer result, sponsorship, next
action); Network table (company, sponsorship, sponsored titles, postings and rejections,
funding, next action); Needs-a-person table; Skipped table; occupation wage context;
"What this cannot tell you"; Gate D.

Also written: `roles.json` (scorer input, shaped like `data/examples/ch11-roles.json`),
`role-scores.json` / `role-scores.md` (written by the scorer, unchanged), and
`candidates.json`.

## Stop conditions

Stop, write nothing, exit `2`:
- the OPT end date is missing, invalid, past, or less than 60 days away (Gate C);
- the persona, boards file or CSV is missing or not valid JSON / CSV;
- `--offline` and `--save-responses` are both given.

Do not invent a value, and do not continue, when:
- a board fetch fails: route `board-unknown`, never `network`;
- a company is not in the CSV: route `skip` / `not-in-dataset`;
- sponsorship fields are empty: route `skip` / `no-trace-in-data`, reported as "no trace
  in this data", not "does not sponsor";
- a role lacks a gate value: refuse.

Refuse requests to:
- lower a tier threshold or widen the title rule to make a preferred company pass;
- mark a board confirmed without a person;
- treat the company-level skip rate as healthy without reading the funnel (see the run
  log).

## Next action per result (feeds the 3-3-2 day)

| Route | Next action | Hours it feeds |
|---|---|---|
| `apply` (scorer Apply) | Tailor and apply within 2 days, then reach out to the hiring team. One application per company. If several postings match, pick the best fit. | 2 apply hours |
| `consider` (scorer Consider) | Apply, lower priority: after all Apply-route roles that week. | 2 apply hours |
| `network` | Outreach first: find 2 product people there (alumni first), ask for a 20-minute chat now; re-check the board in 2 weeks. | 3 networking hours |
| `human-check` | Gate A: open the careers page, confirm or reject the proposed board. | research |
| `board-unknown` | Retry, or check by hand. Never treat as "no openings". | research |
| `skip`, `scored-skip` | Nothing. Skipping is a successful outcome. | none |

## Run-log template (`logs/runs/2026fa-AdityaHasija37-<n>.md`)

```markdown
## YYYY-MM-DD — msis-pm-network-targets sample run

- **Recipe:** recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.md v0.1.0 (DRAFT)
- **Inputs:** CSV path; boards file (Gate A cleared by <name>, <date>); persona (fictional); responses dir and capture date
- **Command:** <exact command>
- **Outputs:** out/run-log.json, out/report.md, out/roles.json, out/role-scores.{json,md}
- **Result:** candidates <n> → evaluated <n> → apply <n> · consider <n> · network <n> · human-check <n> · board-unknown <n> · skip <n>; roles scored <n>
- **Gates:** A <cleared by / date> · B <fetch failures n> · C <factor, days left> · D <read by / date>
- **Checks:** tests <pass/fail>; conformance <ok>; hand cross-check <company: CSV value = report value>
- **Open issues:** <what did not work or is still missing>
```
