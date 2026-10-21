---
status: DRAFT
todos_open: 7
last_gate: "sample-run, 2026-10-19, logs/runs/2026fa-anishagaikar0420-2.md"
attestation: null
recipe_version: 0.2.0
---

# msis-bi-analyst-sponsor-triage — Is this posting, at this company, worth one of my applications?

## Executive summary

This is a step-by-step checklist for an international master's student in Information Systems who wants a **Business Intelligence Analyst** job and needs an employer that can sponsor a work visa. For one company and one job posting it answers six questions using stored data and tested scripts instead of a chatbot's guess: Does this company have any sponsorship history? Does that history include work like mine? Is the posting really still open? Does the posting's body contradict its title about how senior the job is? Does every fact I think I know about the posting appear in it? Do I have time left on my work authorization?

The first run, on a real Boston company, found real sponsorship history and a live posting, and two traps a quick read would miss. The posting is titled just "Analytics Engineer", but its body says it is looking for a *Senior* Analytics Engineer with 5+ years of experience. And the company's sponsorship record shows a "Business Intelligence *Engineer*", not an analyst. The run also caught the repository's own liveness checker calling a made-up job on that company's board "active". The mode stops short of a score on purpose, because the repository has no agreed way to turn sponsorship history into a probability.

Read this if you are choosing where to spend a limited number of applications before your work authorization starts.

## 1. Purpose and when to use it

- **Who:** international master's student in Information Systems (F-1), expected graduation 15 May 2027, not yet on OPT, targeting **Business Intelligence Analyst** roles (SOC 15-2051.01) and the analyst titles beside them. The OPT end date is an **assumption** (see §4, G5).
- **When:** you have a *specific* company and a *specific* posting URL and are about to spend an application on it. Not for discovering companies (use `npm run ats:scan`) and not for ranking dozens of roles (use `npm run score`). It does not compute the OPT start-date window; that is a different tool.
- **The role family is a parameter.** The default keywords target BI / analyst titles; `--keywords "..."` switches them (for example to AI / data-science titles). Same company, different answer: see the worked run.
- **Prime directive:** local verified data and tested scripts first. An LLM may *propose* the field extraction that `ground-fields.py` then checks; it never supplies a count, a rate, or a pass.

## 2. Source inventory (everything below was run; see the worked run)

| What | Exact command / path | Layer | Ran? |
|---|---|---|---|
| Company funding + H-1B history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with approval counts) | 80 Days | yes |
| Per-company gates G0–G5 (new) | `python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company "<name>" --opt-end YYYY-MM-DD [--keywords "..."]` | 80 Days | yes |
| Posting + board ingest (new; the only network step) | `python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py <slug> --job <id> --text-out <file>` or `--out <file> [--title-regex RE]` (public Greenhouse API) | Job-Ops | yes |
| Posting liveness (existing) | `npm run ats:liveness -- <job-url>` (Playwright; needs `npx playwright install chromium`) | Job-Ops | yes, with a defect (see §5) |
| Seniority gate (new) | `python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.py <posting.txt>` | Job-Ops | yes |
| Field grounding (new) | `python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.py <extraction.json>` | Job-Ops | yes |
| Tests for the three new checkers | `.../ground-fields.test.py` (15), `.../seniority-gate.test.py` (15), `.../fetch-board.test.py` (19) | — | yes, all pass |
| Skill mentions across postings (existing) | `npm run skill-demand -- <postings.json> --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json [--role-filter analyst]`; tests: `npm run skill-demand:test` | Cognitive Pivot | yes |
| BI skills list (new data) | `scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json` — drafted by Claude Code, **not yet reviewed by a human** | Cognitive Pivot | yes |
| ATS scan, anchor run | `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run` (committed example config; writes nothing) | Job-Ops | yes, on the example company, not part of the scenario |
| Conformance | `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs` | — | yes |

Existing commands that were **not run**, and why: `npm run bls:local-wage` (its inputs under `data/bls/local-wage/` are absent from the clone, and the documented venv step fails on Homebrew Python 3.14 at `ensurepip`); `npm run score` (needs a sponsorship probability the repo does not define, TODO 1). `npm run ats:scan` as documented expects a private `portals.yml`; it was run only on the committed example.

## 3. Proposed additions (typed TODOs; none of these exist or run)

1. [TODO DEFINE] **Sponsorship tier → probability.** `scripts/score/role-scorer.mjs` needs a numeric sponsorship `p`, but no file in the repo maps approval counts to a tier or a tier to a probability. Why it belongs: without it the composite score cannot honestly include the 80 Days layer, so this mode refuses to emit one.
2. [TODO DATA SOURCE] **`data/bls/local-wage/` inputs** (metro OEWS, BEA RPP, crosswalk). Why: a salary floor for an entry-level BI analyst needs a wage band by metro. The H-1B `median_salary_offered` field is company-wide across all sponsored titles (Klaviyo: $126,000, pulled up by engineering and manager titles) and is the wrong anchor for a new graduate.
3. [TODO DEFINE] **Time window of the H-1B counts.** The dataset README says "historical" and the audit documents funding dates only. Why: "154 approvals" means something different over 2 years than over 10.
4. [TODO DEV] **Title-to-occupation matching.** Role family is matched on title keywords, which is too coarse in both places it is used: Klaviyo's only BI-keyword sponsored title is "Business Intelligence *Engineer*", and of the 22 "analyst"-titled postings across 6 boards, by my reading of title words, 17 look like non-BI work (accounting, support, fraud, treasury, sales- or success-operations and similar), 3 are application-modelling roles, and only 2 look clearly like BI or data-analyst work. Why it belongs: a crosswalk from titles to SOC 15-2051.01 (the engine already carries BLS/O*NET data) would turn a keyword guess into a lookup.
5. [TODO DEV] **Company entity resolution for the lookup.** 208 normalized company names map to more than one CSV row (e.g. `3AM INNOVATIONS INC` and `3AM INNOVATIONS LLC`), so exact matching can only refuse. `scripts/sec/entity-resolution.py` exists and is the likely home for a safe disambiguation.
6. [TODO DEV] **Liveness cross-check inside `ats:liveness`.** On Klaviyo's board an invented job id redirects to the company's job-search page (HTTP 200, no `error=true`) and the existing checker reports it `active`, while the Greenhouse API answers 404. This mode works around it with a second signal (G6); the repo script itself should be patched. Why: a gate that calls a fake posting live is the failure the gate exists to prevent.
7. [TODO APPROVE] **Named-human gate clearance** of G5–G9 on a live (non-sample) run; required to move this recipe to RUNNABLE-LIVE.

## 4. Phase gates (hard stops; a closed gate produces no recommendation)

Run order is local-first: G0–G5 read only the CSV; then the network step; then the posting checks.

| Gate | Test (testable, from the scripts) | Pass | Flag (human must read) | Stop (refuse) |
|---|---|---|---|---|
| G0 timeline input | `--opt-end` is a valid future date | yes | — | missing / past → stop, no CSV read |
| G1 snapshot age | newest `latest_funding_date` in CSV vs today | ≤ 365 days | 366–730 days | > 730 days |
| G2 company match | exactly one CSV row after deterministic normalization (uppercase, punctuation out, trailing INC/LLC/CORP… out); **no fuzzy match** | 1 match | — | 0 or ≥ 2 matches |
| G3 sponsor record | `Total Approvals` non-blank | count present | blank = "no record" (never "does not sponsor") | — |
| G4 role family | a sponsored title contains a role keyword and is not senior-flagged (senior/sr/staff/lead/principal/manager/director/head/VP/III/IV); the matched titles are printed verbatim so a human can see "Engineer" in "Business Intelligence Engineer" | ≥ 1 non-senior match | only senior matches, or none | — |
| G5 runway | days from today to `--opt-end` (an **assumed** 2028-05-31 in the worked run) | ≥ 90 days | < 90 days; a **named human** must clear | ≤ 0 days |
| G6 liveness, two signals | `npm run ats:liveness -- <url>` is `active` **and** `fetch-board.py --job <id>` exits 0 (the Greenhouse API returns the posting) | both agree | `uncertain`, or the two disagree (invented id on Klaviyo's board: liveness `active`, API 404) | either says gone → Skip |
| G7 seniority | `seniority-gate.py`: highest stated experience minimum < 3 years and no senior-prefixed copy of the title in the body | exit 0, `pass` | exit 1 (a named human reads the quoted snippets and decides), or `no_statement` (absence is not entry-level evidence) | the human decides the role is out of reach → Skip |
| G8 grounding | `ground-fields.py`: every field has a verbatim quote or is "not stated" with no quote; list fields (skills, seniority) have every item inside a quote | all PASS, plus a human has read the non-list values | — | any FAIL |
| G9 human release | a named human writes who/what/when in the run log | cleared | — | not cleared → nothing is applied to |

Thresholds (365 / 730 / 90 days, 3 years, the 8-character minimum quote) are authorial choices documented in the scripts; they are not statistical results.

## 5. What it can and cannot verify

**Can verify (a script or the data established it):**
- A company name has exactly one exact-normalized row in the committed CSV, and what that row says (approvals, denials, rate, last funding stage/date/amount, top sponsored titles), with its line number.
- How old the newest funding record in the dataset is relative to today.
- Whether a sponsored title in that row matches the role keywords and is senior-flagged, shown verbatim.
- Whether the Greenhouse API returns a given posting, and whether `ats:liveness` calls it active.
- What the posting body says about experience and seniority, quoted: numbers of years or months next to the word "experience", and a senior-prefixed copy of the title.
- Whether each extracted field's quote appears verbatim in the posting, and every item of a list field is inside a quote.
- Day arithmetic between today and an end date you supply.

**Cannot verify (labelled inferred or out of scope, never presented as a result):**
- **That the company will sponsor *you*, for *this* job.** The CSV is a history of petitions, not a policy. Absence of a row proves nothing.
- **That the sponsored work resembles an analyst role.** G4 matches words. Klaviyo's record matches only through "Business Intelligence Engineer".
- **The H-1B time window** of the counts (TODO 3), or whether approvals were for entry-level roles. The title list is "top titles" only.
- **That "recent funding" is recent.** The newest funding date in the data is 2025-09-26, and Klaviyo's own last record is 2022-07-26.
- **Immigration rules.** G5 is subtraction on an assumed date. Nothing checks cap-gap, STEM OPT eligibility, OPT start-date fit, E-Verify, lottery odds or cap-exempt status. A designated school official or an attorney decides those.
- **What a stated requirement really means.** Companies hire below their stated years; the gate quotes what is written.
- **That a quote supports its claim for non-list fields.** `ground-fields.py` proves existence, not support: a real sentence attached to the wrong field passes (asserted as a known gap in the test file). A person reads the non-list values.
- **That a live page means anyone is hiring**, or that a posting is not a pipeline-filler ("ghost") posting.
- **Liveness for postings that are not on Greenhouse**, and any case where only one liveness signal exists (then G6 can only flag).
- **Skill requirements.** `skill-demand` counts mentions across postings, not requirements; its BI skills list is unreviewed and probably under-counts Excel (the bare word is excluded because "excel" is also a verb).
- **Role quality / AI-resilience.** `role_quality` carries weight 0.0 in `role-scorer.mjs`; this mode does not use it.
- **What the job pays *you*.** Posted ranges are quoted; metro wage data is not available here (TODO 2).

## 6. Output contract (two customers, P5)

**Agent log** — `logs/triage-<company-slug>-<YYYY-MM-DD>.json` (JSON). Concatenate the machine outputs; never hand this to the student:

```json
{
  "recipe": "msis-bi-analyst-sponsor-triage", "recipe_version": "0.2.0", "run_date": "YYYY-MM-DD",
  "sponsor_triage": { "...": "output of sponsor-triage.py (schema sponsor-triage/1): gates[], record{csv_line,...}" },
  "ingest": { "board": "<slug>", "job_id": "<id>", "api_found": true },
  "liveness": { "url": "...", "ats_liveness": "active|expired|uncertain", "api_found": true, "agree": true },
  "seniority": { "...": "output of seniority-gate.py (schema seniority-gate/1)" },
  "grounding": { "...": "output of ground-fields.py (schema ground-fields/1)" },
  "gates_cleared_by": { "G5": null, "G7": null, "G8": null, "G9": null },
  "score": null,
  "score_refusal": "tier->probability undefined (TODO 1)"
}
```

**Human report** — `reports/generated/triage-<company-slug>-<YYYY-MM-DD>.md`. Opens with an executive summary (what this is, why read it, what it found), then:

| Question | Answer | Established by | Read this before acting |
|---|---|---|---|
| Sponsorship history? | e.g. "154 approvals on record" | CSV line N | window unknown |
| Evidence for my role? | titles matched, verbatim | CSV line N | words, not occupation |
| Posting live? | active / expired | `ats:liveness` + API | not proof anyone is hiring |
| How senior is it really? | quoted snippets | `seniority-gate.py` | I read the snippets: ✓/✗ |
| Facts grounded? | k of n fields | `ground-fields.py` | I read the non-list values: ✓/✗ |
| Runway? | N days to an assumed end | arithmetic | no rules checked |
| **Decision** | **Apply / Skip / needs human** | **human only** | name + date |

The report never prints a probability or a composite score while TODO 1 is open.

## 7. Stop conditions (refuse, do not guess)

The mode must stop and say why when any of these holds: `--opt-end` missing or not in the future; CSV snapshot older than 730 days; company name matches zero or more than one row; either liveness signal says the posting is gone; any grounding FAIL; a request to output a sponsorship probability, composite score, or "likelihood of getting a visa"; a request to infer sponsorship for a company with no approval record; a request to treat a `no_statement` seniority result as "entry level"; or the student asks for legal advice on status.

## 8. Run log template (`logs/runs/<term>-<handle>-<n>.md`)

```markdown
## Executive summary
<what was run, for whom (persona), what it found — no paths>

## Run record
- date / recipe / recipe_version / status reached
- inputs: company, posting URL, opt_end (ASSUMED or real: say which), keywords
- commands: <verbatim>
- outputs: <artifact paths>, gate results G0–G9
- result: Apply | Skip | needs-human, and who decided
- open issues: <TODOs, defects found, commands that could not run>
```
