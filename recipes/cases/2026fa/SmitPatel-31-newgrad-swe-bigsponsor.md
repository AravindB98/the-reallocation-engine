---
status: DRAFT
todos_open: 4
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# newgrad-swe-bigsponsor — entry-level SWE at big H-1B sponsors, for a December graduate

## Executive summary

**What it does.** For each software-engineering job posting, it checks whether the company's H-1B record shows
that it sponsors *entry-level* software engineers (not only senior engineers or non-software roles), and whether
the job starts before the student's OPT unemployment limit runs out. It then hands the checked evidence to the
engine's existing scorer and returns Apply / Consider / Skip with a next step for each posting.

**Who it's for.** An international master's student on a STEM degree who graduates in **December**, hasn't
started OPT, and is aiming at new-grad software roles at companies with a large H-1B record.

**What it decides, and what it leaves to a person.** It decides nothing a record can't support. A company that
isn't in the dataset, a posting nobody has checked is still live, and a name that matches two companies are all
handed to a person instead of being scored. The student makes every final call.

**Where it stands.** The sample path runs end to end on the shipped CSV with a fictional persona and fictional
postings, and has passing offline tests. Status stays **DRAFT** because four typed TODOs for v0.2 are open
(§Proposed additions), and the lifecycle requires zero before a recipe moves past DRAFT. The three values a human
had to set are closed (§Values a human set).

Two customers: this file is for the agent. `SmitPatel-31-newgrad-swe-bigsponsor.card.md` is for the person.

**Handoff condition (done when):** the run exits 0 and prints
`✓ triage <date>: N postings → Apply a · Consider c · Skip s · Needs-human h` with `a + c + s + h = N`.
`roles.json` holds exactly the postings that passed G1–G4, and every term in it carries a `source` in
{`record`, `model-judgment`, `your-input`}. Every excluded posting appears in `triage-log.json → excluded[]`
with a gate and a reason. `node --test …/triage.test.mjs` reports `fail 0`.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, TODO closure.
2. `DOMAIN.md`: layout, and Known gaps items 3 and 9 (role-quality weight 0, local wage feeds nothing).
3. `DATA_CONTRACT.md §Zero-Conditions`: real OPT dates are immigration details. Committed runs use a fictional persona.
4. `data/80-days-to-stay/README.md` ("Progress Day 08"): how the CSV was built. **It starts from SEC Form D
   filers**, then maps to DOL LCA and USCIS H-1B Employer Data Hub.
5. `scripts/score/role-scorer.mjs`: note that a role with **no** `liveness` or `timeline` object gets a gate
   of `1` (`num(role.liveness?.factor) ?? 1`). This recipe must never send an unchecked role to it.

## Source inventory

| Source | Path / command | Used for | Label |
|---|---|---|---|
| 80 Days master CSV (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored` | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv`, row `bls_soc_code = 15-1252` | national median wage (context only) | record |
| Role scorer | `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>` (same as `npm run score -- …`) | composite, gates, Apply/Consider/Skip | — |
| Liveness checker | `npm run ats:liveness -- <url>` (Playwright, network) | the human runs it; the result goes into the postings file | record only when run |
| **Prototype** | `node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs` | this recipe's run path | — |
| **Tests** | `node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs` | offline checks, 13 tests | — |
| Persona (fictional) | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json` | dates, limits, assumptions | your-input |
| Postings (fictional) | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-sample.json` | company, title, start date, liveness, fit | your-input |

**Not used, on purpose:** Form D samples (`data/sec/form-d/processed/sample/`, 50 companies per quarter). This
recipe targets established sponsors, not funding recency. `bls:local-wage` isn't used: it needs a `.venv`
that a fresh clone lacks, and it feeds no decision.

## Inputs

**Persona** (every field is `{ "value": …, "source": "your-input" }`; a missing field stops the run with exit 2, never a default):
`program_end_date`, `opt_start_date` (must be 0–60 days after program end), `unemployment_limit_days` (90 for
post-completion OPT, to be confirmed with the DSO), `unemployment_days_used`, `start_buffer_days`, `hiring_lag_days`,
`big_sponsor_min_approvals`, `target_soc`.

**Postings**: `posting_id`, `company` (as the human typed it), `title`, `url`, `start_date` (`{value}` read off the
posting, or `null`), `liveness` (`{status: active|expired|unchecked, method, checked_on}`), `fit` (`{p, source}`, optional).

## Phase gates

Each posting stops at the first failed gate. A failed gate means **excluded with a reason**, never a guessed value.

| Gate | Testable condition | Pass | Fail | Human clears by |
|---|---|---|---|---|
| G0 window-open (whole run) | `unemployment_limit_days − unemployment_days_used > 0` | continue | exit 3, `G0 window-closed`, no `roles.json` written | confirming dates with the DSO |
| G1 company-match | the posting company's key (uppercase, non-alphanumerics removed) equals exactly **one** CSV row's key. No suffix stripping, no fuzzy match | G4 | `no-company-match` or `ambiguous-company-match` (+ candidate names) | typing the exact legal name, or accepting Unknown and checking another source |
| G4 entry-level evidence | `Total Approvals ≥ big_sponsor_min_approvals` and `top_job_titles_sponsored` non-empty | tier from §Title rule | `below-big-sponsor-threshold` or `no-title-evidence` | reading the raw title list (`triage-report.md → Sponsored-title evidence`) |
| G2 liveness | `liveness.status ∈ {active, expired}` | factor 1 / 0 | `liveness-unchecked` | running `npm run ats:liveness -- <url>` and entering the result with `method` and `checked_on` |
| G3 timeline | start date parses | factor (below) | `invalid-start-date` | fixing the date; confirming estimated dates with the recruiter |

G2 and G3 are **gates** (scorer multipliers). They are never votes. The scorer returns Skip when either is ≤ 0.05.
(G4 is checked before G2 in code; the numbering follows the brief.)

**Timeline factor.** `deadline = max(today, opt_start) + (limit − used)`. Start date = the posting's stated date,
or, if none is stated, **estimated** as `max(today + hiring_lag_days, opt_start)`, which is labeled estimated in
both outputs.
- start after the deadline → `0.0`
- start before OPT start → `0.5` (employer would have to defer)
- start within `start_buffer_days` of the deadline → `0.5`
- otherwise `1.0`

## Title rule and tier map (v0.1)

The CSV's `top_job_titles_sponsored` is a list of the company's **top** sponsored titles with **no counts**.
`lib.mjs classifyTitle` sorts each title into one class:

| Class | Rule |
|---|---|
| non-swe | no match for `software|developer|swe|sde|backend|frontend|full stack|programmer` |
| senior | SWE and `senior|sr|staff|principal|lead|manager|director|architect|head|vp|III|IV|V|3–9` |
| mid | SWE and `II|2` |
| entry | SWE and `I|1|junior|jr|associate|new grad|entry|graduate|university|early career` |
| unlevelled | SWE with no level word (plain "Software Engineer") |

Company bucket → sponsorship vote:

| Bucket | Condition | Tier | p |
|---|---|---|---|
| entry-explicit | at least one `entry` title | Proven | 0.9 |
| unlevelled-swe | no entry title, at least one `unlevelled` | Likely | 0.6 |
| senior-only-swe | only `mid` / `senior` SWE titles | Unknown | 0.3 |
| no-swe-title | no SWE title in the top list | Unknown | 0.15 |

"No SWE title" maps to **Unknown, not Avoid**, because the list holds only the top titles. The tier comes from
records. The p values are a **mapping a human chose**: the scorer term is labeled `record` (following
`data/examples/ch11-roles.json`), and `triage-log.json` records `p_source: your-input` beside it.

## Values a human set (DEFINE closures)

Closed by **Smit Patel, 2026-09-30**. Claude proposed each value with a one-line rationale, and Smit chose to keep it
over the alternative offered. The reasoning below is the rationale Smit accepted.

| Value | Set to | Alternative rejected | Reasoning |
|---|---|---|---|
| tier → p | Proven 0.9 · Likely 0.6 · senior-only 0.3 · no-SWE 0.15 | 0.9 / 0.5 / 0.2 / 0.1 | Proven and Likely reuse the 0.9 / 0.6 in `data/examples/ch11-roles.json`, so this recipe stays comparable with the book's worked example. The two Unknown levels stay above 0 because the title list is only the top titles. |
| `big_sponsor_min_approvals` | 100 | — | Gives 152 companies in the shipped CSV: enough to triage, and "big" enough that approvals aren't one-offs. |
| `start_buffer_days` | 14 | — | Two weeks of slack for onboarding or background-check delays before the unemployment limit. |
| `hiring_lag_days` | 45 | 60 | About 6.5 weeks from application to start, used **only** when a posting states no start date; labeled as an estimate in every output. |

These are choices, not records. Changing any of them changes the recipe version.

## Workflow

1. Confirm the inputs exist:

```bash
test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && test -f data/bls/compact/soc_occupation_compact.csv
```

2. Run the tests (offline). Expect `# fail 0`:

```bash
node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs
```

3. Sample run. `--today` pins the date so the output can be reproduced:

```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30
```

4. **Stop. Human gate.** Read `out/triage-report.md`: the Needs-a-person table, and the sponsored-title evidence
   for every scored company. Record each gate decision in the run log (template below).
5. Break test: a closed window must exit 3 and write nothing:

```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --persona scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-window-closed.json --out-dir /tmp/g0-check
```

6. Write `logs/runs/2026fa-SmitPatel-31-<n>.md`. Never edit `logs/RUN_LOG.md`.

## What it can verify, and what it can't

**Verified from records** (a row produced the value):
- The company has exactly one row in the 80 Days CSV under that exact key, with N approvals, M denials, and an approval rate.
- The listed top sponsored titles are exactly the strings in `top_job_titles_sponsored`.
- The national median wage for SOC 15-1252 (OEWS 2024) is the value in the compact CSV.
- The scorer's arithmetic, gates and recommendation (its trace is in `role-scores.json`).

**Computed from a rule or an input I chose (your-input):**
- The class of each title (keyword rule v0.1). It **misreads** titles, e.g. Virtusa's `JAVA ENGINEER 2` → non-swe.
- The tier → p mapping.
- The unemployment deadline, from dates the person entered.
- Estimated start dates, from an assumed hiring lag.
- Liveness in the sample (fixture values, **not** an `ats:liveness` run).
- Fit (self-rated).

**Cannot verify:**
- Whether a company sponsors new-grad SWEs **now**. The CSV is historical and has no year per title.
- How **many** entry-level SWE approvals a company had. There are no per-title counts.
- Anything about companies **not in the CSV**. Its population is SEC Form D filers. Google, Amazon, NVIDIA,
  Oracle, IBM, Cisco and Adobe have no row, and Meta and Apple match only unrelated small companies.
  "Not found" means **Unknown**, never "does not sponsor".
- Whether two rows are the same company (`SALESFORCE COM INC` / `SALESFORCECOM INC` have identical figures). The recipe stops; it doesn't merge.
- The OPT rules themselves (unemployment limit, when the clock starts, whether EAD arrives by the requested
  start date). Confirm with the DSO.
- What an employer will pay a new grad. `median_salary_offered` covers every role that company sponsored.

## Output contract

**Agent log:** `<out>/triage-log.json`
```
recipe, recipe_version, run_date, mode ("sample"), persona_id,
inputs {persona, postings, csv, bls, scorer}            # repo-relative paths
window {opt_start, unemployment_limit_days, deadline}   # each {value, source}
wage_context {status, soc, national_median?, oews_year?, reason?}
summary {evaluated, scored, excluded, apply, consider, skip, skip_or_excluded_share}
decisions[] {posting_id, company, title, recommendation, composite, scorer_reason, next{action, block}, trace}
excluded[]  {posting_id, company, title, gate, reason, candidates?, fix?}
detail[]    {…, sponsorship{tier, p, bucket, p_source, evidence{…each {value, source}}}, liveness, timeline, fit, wage_context{in_score:false}}
scorer_stdout, human_gates_open[]
```

**Human report:** `<out>/triage-report.md`, in this order: Executive summary · Decisions (company, role, decision,
why, next action) · Needs a person · Sponsored-title evidence · Pay context (not part of the score) · What this
run could not check · Run record.

**Scorer files:** `<out>/roles.json`, `<out>/role-scores.json`, `<out>/role-scores.md`. Always written to `<out>`,
never to the tracked `data/examples/`.

## Next action per result (the 3-3-2 link)

| Result | Next action | Which block of the day |
|---|---|---|
| Apply | tailor the résumé and apply | 2h research/apply |
| Consider | network first: find an engineer or alum and ask whether they sponsor new-grad SWEs | 3h networking |
| Skip, gated by timeline, tier Proven/Likely | **network, don't apply**: ask about an earlier or off-cycle start | 3h networking |
| Skip (other) | skip, don't spend time | — |
| Needs a person | fix the input (name, liveness, date), then re-run | 2h research (short) |

## Stop conditions

Stop and don't invent a value when:
- Any persona field is missing or a date is invalid → exit 2.
- The unemployment window is closed → exit 3, nothing scored.
- A company matches zero or several rows → exclude. Never pick the first row, never add rows together, never
  strip "Inc"/"Corp" to force a match ("Meta" would then hit `META CO`).
- Liveness is unchecked → exclude. The scorer would otherwise treat it as live.
- Asked to raise a tier or lower a threshold so a preferred company passes → refuse, and log the request.
- Asked to treat "not in CSV" as a non-sponsor → refuse.

## Proposed additions

- [TODO: DATA SOURCE] Per-title H-1B counts (from DOL LCA disclosure data), so "sponsors entry-level SWE" becomes a count, not "appears in the top list". Needed because the top-titles list can't separate one new grad from a hundred.
- [TODO: DATA SOURCE] A sponsorship source covering companies that aren't Form D filers (e.g. the USCIS H-1B Employer Data Hub, joined by FEIN). Needed because most big-tech sponsors are missing.
- [TODO: DEV] Title rule v0.2: add `java|\.net|computer systems engineer|sde` and company-specific level ladders (at some companies "II" is the new-grad level). Needed because v0.1 misreads staffing-firm titles.
- [TODO: DEV] Read `ats:liveness` output directly instead of typed liveness, so `source: record` doesn't depend on the human copying the result correctly.

## Facts-that-bite this recipe addresses

| Fact | Handling |
|---|---|
| `role_quality` weight is 0.0 | not changed; the BLS 15-1252 median is shown as context, `in_score: false` |
| `bls:local-wage` feeds nothing / fails on a fresh clone | not used; the national median is labeled national |
| Only Form D samples ship | not used; stated above |
| `data/raw/`, `data/verified/`, `logs/gate-decisions/` don't exist | gates reference only the paths in §Source inventory; gate decisions go into `logs/runs/` |
| `snickerdoodle` CLI is roadmap | no commands use it |
| `validate-h1b-join-sample.py` needs full data | not used |

## Run-log template (`logs/runs/2026fa-SmitPatel-31-<n>.md`)

```markdown
## YYYY-MM-DD — newgrad-swe-bigsponsor sample run

- **Recipe:** recipes/cases/2026fa/SmitPatel-31-newgrad-swe-bigsponsor.md v0.1.0 (status at run: DRAFT)
- **Inputs:** persona <path> (fictional) · postings <path> · CSV + BLS paths · --today <date>
- **Command:** <verbatim>
- **Outputs:** <out>/triage-log.json · triage-report.md · roles.json · role-scores.{json,md}
- **Result:** <the ✓ triage line, verbatim> · tests: <pass/fail line>
- **Gate decisions (human):**
  - G1: <each excluded name → decision> — by <name>, <date>
  - G2: <liveness source per scored posting; re-checked? >
  - G3: <estimated start dates confirmed? >
  - G4: <title-rule misreads seen>
- **Open issues:** <what did not work / is still missing>
```

## Logging rules

- One `logs/runs/` file per run. No real dates, names, emails or trackers. The persona is fictional.
- A run on real dates writes to a gitignored `--out-dir` and is **not** committed.
