---
# status note: claimed, pending the owner's sign-off below; a strict reading of SNICKERDOODLE (SPECIFIED needs zero open TODOs) holds it at DRAFT — the 10 open items are non-blocking proposals, disclosed in "Proposed additions"
status: RUNNABLE-SAMPLE
todos_open: 10
# last_gate note: the owner signs this after re-running the commands in "Sign the gate" themself
last_gate: null
# attestation note: set only at VERIFIED
attestation: null
recipe_version: 0.1.0
---

# case-em-pm-supply-chain-soc-resolver — which occupation code is this early-career PM / supply-chain job?

## Executive summary

**What this is.** An operating recipe, with a working script, for one person's situation: a master's graduate in engineering management on a twelve-month student work permit, applying only to project-manager and supply-chain jobs that ask for two years of experience or less, in five cities (Seattle, Austin, San Francisco, San Jose, Dallas–Fort Worth).

**Why read it.** Those job postings never say which government occupation code the employer would use if it filed for a work visa. The same title can be filed under codes whose official median wage differs by $20,000 to $70,000, and the code decides which of the employer's past visa filings are relevant at all. Some plausible codes are clerical ones, which would make the visa case much harder. The recipe makes that hidden choice visible and refuses to give a single answer when the plausible codes disagree.

**What it found on its first run (2026-10-21).** Of two real postings, one (an Inventory Planner near Fort Worth) was refused as ambiguous: its plausible codes run from a clerical code at a $57,770 national median to Logisticians at $80,880, and a third plausible code has no published wage at all. The other (a Zipline supply-chain operations role) was stopped because the repository's own posting check could not confirm it was live, even though the company's job board lists it; a human has to clear that. All seven sample and break-test postings behaved as designed. Nothing is ranked, because the work-permit card dates have not been entered.

Two customers: this file is for the agent; `contactshyam14-code-em-pm-supply-chain-soc-resolver.card.md` is for the human.

## Purpose

Use this recipe when an early-career posting is titled something like Project Manager, Associate Project Manager, Supply Chain Project/Program Manager, Supply Chain Analyst, Inventory/Supply/Demand Planner or Operations/Logistics Project Manager, in one of the five target metros, and you need to know — before spending an application on it — whether the occupation code it would be filed under is knowable from the data, and what each plausible code implies for the wage floor, the role-quality score and sponsor history.

It continues the 25-point recipe `contactshyam14-code-em-network-targets`, whose named limitation was "title-to-occupation matching is an inference". This mode does not pretend to remove that inference; it makes it explicit per posting, prices it, and refuses when it matters.

Do **not** use it for postings requiring 3+ years (the experience gate stops them), for roles outside PM / supply chain (the scope gate stops them), or to conclude anything about visa law.

## Source inventory

| Source | Exact path / command | Used for | Label |
|---|---|---|---|
| Posting liveness | `npm run ats:liveness -- <url>` (`scripts/ats/check-liveness.mjs`); stdout saved to `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/*.txt` | gate 1 | record |
| ATS board listing | `REALLOCATION_ENGINE_PORTALS=…/inputs/portals.em-pm-supply-chain.yml npm run ats:scan -- --dry-run` | second record for Greenhouse postings (does not replace gate 1) | record |
| Real posting text | Greenhouse board API JSON / SAP SuccessFactors page fetched with `curl` into `…/inputs/raw/` (git-excluded), converted by `node …/tools/posting-from-raw.mjs` | gates 2, 4, 6 | record |
| O*NET / BLS compact | `data/bls/compact/soc_occupation_compact.csv` (`job_zone`, `alternate_titles_sample`, `annual_median_wage`, `cognitive_pivot_score`) | candidate evidence, job-zone flag | record |
| National OEWS May 2024 | `data/bls/oesm24nat/national_M2024_dl.xlsx` → trimmed `…/data/national_oews_candidates.csv` | p10 / p25 / median / p75 per candidate | record |
| Metro OEWS May 2024 | `https://www.bls.gov/oes/special-requests/oesm24ma.zip` → trimmed `…/data/metro_oews.csv` (see `…/data/PROVENANCE.md`) | metro rows | record |
| BEA RPP 2024 | `https://apps.bea.gov/regional/zip/MARPP.zip` → `…/data/bea_rpp.csv`, exact-code `…/data/bls_bea_msa_crosswalk.csv` | metro adjustment | record |
| Metro wage band | `scripts/bls/local-wage-adjustment.py` (unmodified) with `--oews/--rpp/--crosswalk` → the trimmed files, `--national data/bls/compact/soc_occupation_compact.csv` | RPP-adjusted p25 / median / p75 or `missing` + reason | record |
| Role scorer | `scripts/score/role-scorer.mjs` (`npm run score`), unmodified | composite / Apply-Consider-Skip per candidate | model-judgment (its weights) |
| Employer H-1B / Form D | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | exact-name employer rows | record |
| Keyword rules + thresholds | `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/rules/resolver-rules.json` | scope, experience, degree, candidate SOCs, spread thresholds | model-judgment (rules) / your-input (thresholds) |
| Persona | `…/inputs/persona.em-pm-supply-chain.json` (target metros, max 2 required years, EAD dates = null, STEM answer = null) | gates 3, 4, 8 | your-input |

What the 80 Days file actually holds (inspected 2026-10-21): `company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored`. **There is no SOC or occupation column**, so per-SOC H-1B history is reported as missing, never approximated from `top_job_titles_sponsored`.

What the compact O*NET file holds about experience: only `job_zone`. No BLS "typical work experience" field exists in the repository.

## Candidate SOC table (re-derived in the run, not copied)

National medians from the May 2024 national OEWS file; job zone from the O*NET row the rules point at.

| SOC | Occupation | O*NET row used | Job zone | National median 2024 |
|---|---|---|---|---|
| 13-1082 | Project Management Specialists | 13-1082.00 | 4 | $100,750 |
| 13-1081 | Logisticians | 13-1081.02 Logistics Analysts | 4 | $80,880 |
| 11-3071 | Transportation, Storage & Distribution Managers | 11-3071.04 Supply Chain Managers | 4 | $102,010 |
| 11-3061 | Purchasing Managers | 11-3061.00 | 4 | $139,510 |
| 13-1023 | Purchasing Agents, Except Wholesale, Retail, and Farm Products | 13-1023.00 | 4 | **missing** — blank in the compact file and **no row in the national or metro OEWS file**; OEWS publishes the broad 13-1020 Buyers and Purchasing Agents ($75,650), which is shown for context and never substituted |
| 15-1299 | Computer Occupations, All Other (wage) / 15-1299.09 IT Project Managers (O*NET) | 15-1299.09 | 4 | $108,970 — this is the wage of the whole "All Other" group, not of IT project managers |
| 11-3021 | Computer and Information Systems Managers | 11-3021.00 | 4 | $171,200 |
| 11-1021 | General and Operations Managers | 11-1021.00 | 4 | $102,950 |
| 13-1111 | Management Analysts | 13-1111.00 | 4 | $101,190 |
| 43-5061 | Production, Planning, and Expediting Clerks | 43-5061.00 | **2** | $57,770 |

## Proposed additions (typed, open, non-blocking)

Each is a proposal. None runs today; no output of this recipe pretends it does.

1. [TODO: DATA SOURCE] **DOL OFLC LCA disclosure data** (per filing: SOC code, wage level, worksite, employer). *Why it belongs:* it is the only public record of which SOC an employer actually files for a title, per metro; it would turn per-SOC H-1B history from "missing" into a record and let an early-career offer be compared with prevailing-wage Level I/II for the candidate SOC. *Closes when:* the file is at a named path with a provenance line.
2. [TODO: DATA SOURCE] **O*NET full Alternate Titles file** replacing the hand keyword table. *Why:* `alternate_titles_sample` is truncated (e.g. "Inventory Planner" is absent from it, which is not evidence O*NET lacks it); a full crosswalk makes candidate mapping a record lookup instead of a model-judgment rule.
3. [TODO: DATA SOURCE] **BLS Employment Projections education & training table** ("typical work experience in a related occupation" per SOC). *Checked 2026-10-21:* not in the repository; the compact file has only `job_zone`. *Why:* it would back the `MANAGER-CODE-AT-EARLY-CAREER` flag with a record (e.g. whether 11-3071 or 11-3061 typically expects years of related experience). No BLS experience value is stated anywhere in this recipe.
4. [TODO: DEFINE] **13-1023 wage gap.** The full national OEWS file has no 13-1023 row (aggregated into 13-1020). Decide whether the 13-1020 aggregate may ever be shown as a labelled proxy. Default today: no — 13-1023 stays missing.
5. [TODO: DATA SOURCE] **OMB CBSA delineation file** (county → MSA). *Why:* "South San Francisco → San Francisco-Oakland-Fremont" and "Fort Worth 76118 → Dallas-Fort Worth-Arlington" are your-input today; with the file they become records.
6. [TODO: DEV] **Provider-API presence check as a labelled second record.** On 2026-10-21 `ats:liveness` said `uncertain` for Zipline while `ats:scan --dry-run` listed the same job from the Greenhouse board API. A script that records API presence (Greenhouse/Lever/Ashby; SuccessFactors has none in the repo) would let a human clear the gate on a record instead of by eye. It must not turn `uncertain` into a pass by itself.
7. [TODO: DEV] **Maintainer patch proposal for `scripts/bls/local-wage-adjustment.py`** (not patched here): (a) a `#` median (BLS: "≥ $239,200 per year", top-coded) is reported as `suppressed-small-sample`; it should be its own reason code; (b) on Windows the `.venv` hop `os.execv(.venv/bin/python)` fails when the script is launched by `npm run bls:local-wage` (it calls `python3`) — observed `FileNotFoundError`.
8. [TODO: DEFINE] **Scorer `role_quality` weight is 0.0** (DOMAIN.md item 3). With no per-SOC sponsorship vote and no fit vote, every candidate's vote-sum is identical, so the score-spread check can never fire; only the wage spread separates SOCs. An authorial decision, not this recipe's to make.
9. [TODO: APPROVE] **Visa-timeline gate.** The owner enters the EAD card's Valid From / Card Expires dates (and their name) in the persona file, and records the DSO's answer on STEM eligibility verbatim. Until then the gate is STOP and nothing is ranked.
10. [TODO: DEFINE] **Spread thresholds** — $10,000 or 10% between candidate medians, 0.05 composite. Declared with one sentence of reasoning in `rules/resolver-rules.json` (roughly one OEWS wage-level step; a quarter of the scorer's Consider band). They are the AI's proposal until the owner confirms them.

## Phase gates

Every gate has a testable condition. A failed gate is a result, not an error: the posting gets `STOP` with `stopped_at` naming the gate. Liveness and timeline are gates, not votes.

| # | Gate | Testable condition | Pass | Fail |
|---|---|---|---|---|
| G0 | Inputs | every input file exists, parses, has the named columns; `--out-dir` is inside `course/2026fa/submissions/contactshyam14-code/`, the script folder (not its `data/`), or the OS temp dir | continue | exit 2 (usage / out-dir) or 3 (input), **nothing written** |
| G1 | Liveness | the saved `npm run ats:liveness` stdout has a line `active <exact posting URL>` | `PASS` | `expired`, `uncertain`, no line for that URL (`unknown`), or no URL (`missing`) → `STOP` for live status; the SOC analysis is still shown, labelled "for information only" |
| G2 | Role scope | title matches a `scope.title_include` keyword and no `title_exclude` keyword | `IN-SCOPE` | `OUT-OF-SCOPE` → not scored |
| G3 | Target metro | `metro` is one of the persona's 5 metros, an exact BLS `AREA_TITLE`, and has an exact `AREA == GeoFIPS` crosswalk row | `PASS` | `STOP` |
| G4 | Experience | minimum REQUIRED years (rule-parsed; preferred years never count) ≤ `max_required_years` (persona, default 2) | `EXPERIENCE-FIT` | `EXPERIENCE-OVER-TARGET` → `STOP`, not ranked; nothing found → `EXPERIENCE-UNSTATED` = `HOLD`, flagged, never assumed entry-level |
| G5 | Candidates known | every candidate SOC has a row in the compact file | continue | `STOP` (unknown SOC); no candidate at all → `STOP` |
| G6 | Degree | bachelor's (or higher) stated as required | `DEGREE-REQUIRED` (+ field, or `DEGREE-FIELD-UNSPECIFIED`) | `DEGREE-NOT-REQUIRED` + reason (`high-school-diploma`, `stated-as-preferred-or-bonus-only`, `equivalent-experience-accepted`, `mentioned-without-required-wording`, `no-degree-named`) — a **flag**, rule inference, never a legal conclusion |
| G7 | Spread | max − min of candidate national medians and of metro adjusted medians ≤ $10,000 **and** ≤ 10%; vote-sum spread ≤ 0.05 | `RESOLVED` (lowest composite reported, conservatively) | `AMBIGUOUS-REFUSE` (no score; "ask the recruiter which SOC") or `STOP` (a candidate's wage is missing and the rest agree — missing can never resolve agreement) |
| G8 | Visa timeline | persona has valid EAD `ead_valid_from` < `ead_card_expires` and a non-empty `ead_entered_by` | `CLEARED`, timeline factor 1 | `STOP`, timeline factor 0 → the scorer Skips every role; STEM: `HOLD` until the DSO answer is recorded |
| H | Human adequacy | the owner re-runs the commands in "Sign the gate", checks one record by hand, and writes `last_gate` | sample-run gate signed | status stays a claim |

## What it can and cannot verify

**Can verify (record):**
- Whether the repository's liveness script saw an Apply control on the exact URL, and when.
- The exact sentence in the posting that states required years, and whether it sits under a requirements or a preferred heading.
- The exact sentence that mentions a degree, and whether it is worded as required, preferred, or "or equivalent".
- For each candidate SOC: the BLS national p10 / p25 / median / p75, the metro row, the RPP-adjusted band from the existing script, or exactly why each is missing (`*` not available, `#` top-coded, no row).
- That the employer name matches (or does not match) an 80 Days row **exactly**, and which substring look-alikes were rejected.
- That the existing scorer, unmodified, produced each composite.

**Cannot verify:**
- Which SOC code the employer will actually file. The candidate list is a keyword inference; only the employer or its LCA can say. This is the limit the mode exists to expose.
- Per-SOC H-1B history for any employer — the 80 Days file has no SOC column.
- Whether a place lies in the stated metro — no OMB delineation file in the repository; the mapping is your-input.
- The typical experience BLS expects for each SOC — not in the repository.
- Whether "uncertain" liveness means a dead posting or a page the checker cannot read (Zipline's board lists the job; the checker sees no Apply control). A human decides.
- Anything about visa law: specialty-occupation risk, H-1B timing, STEM eligibility. Flags are rule inferences from posting text; STEM is a DSO question.
- What a specific employer pays. OEWS is an occupation survey; the posting's own pay range (when stated) is shown as the posting's record, not compared with a filing.
- Third-party job-board claims (seniority, pay, "H1B Sponsor Likely", valuation) — recorded as unverified your-input; only conflicts with the posting text are checked.

## Workflow (agent, in order; stop at each gate)

1. **Liveness (G1).** `npm run ats:liveness -- "<url>" > …/inputs/liveness/ats-liveness-<date>.txt` (prepend `date -u +%FT%TZ`). Optional second record for Greenhouse/Lever/Ashby: `REALLOCATION_ENGINE_PORTALS=…/inputs/portals.em-pm-supply-chain.yml npm run ats:scan -- --dry-run`.
2. **Fetch + convert real postings.** `curl` the board API / page into `…/inputs/raw/<id>/`, then `node …/tools/posting-from-raw.mjs --meta …/inputs/postings/real/<id>.meta.json --raw <raw file> --out …/inputs/raw/<id>/posting.json`. If the page layout changed, the tool exits 2; do not hand-paste the text as if it were fetched.
3. **Wage data present.** `test -f …/data/metro_oews.csv && test -f …/data/bea_rpp.csv && test -f …/data/bls_bea_msa_crosswalk.csv && test -f …/data/national_oews_candidates.csv`. To rebuild from raw, follow `…/data/PROVENANCE.md` (downloads need the owner's approval).
4. **Run the mode.** `node …/soc-resolver.mjs --as-of <date> --liveness-log <log> … --posting <file> … --out-dir course/2026fa/submissions/contactshyam14-code/runs/<NN-date>`. On Windows pass `--python .venv/Scripts/python.exe` if `.venv` is elsewhere.
5. **Read the report** (`soc-resolver.md`) top to bottom; check the spread table for each AMBIGUOUS-REFUSE and each STOP reason.
6. **Log** a `logs/runs/2026fa-contactshyam14-code-<n>.md` entry (template below).
7. **Human:** clear or refuse G1 for `uncertain` postings with a written reason; enter EAD dates (G8) when the card exists; sign `last_gate`.

## Output contract (two artifacts, two readers — P5)

**Agent log — `<out-dir>/soc-resolver.json`.** Fields: `run` (tool, version, as_of, generated_at, local_wage_mode, python, thresholds, max_required_years, argv), `inputs[]` (role, path, sha256, kind, fetch record), `visa` (ead / stem gates, timeline_factor), `scorer` (ran, command, stdout, role_quality weight note), `postings[]` (id, kind, title, company, url, place, metro, source, `gates.{liveness,scope,metro,experience}`, `degree`, `third_party`, `employer`, `local_wage`, `candidates[]` {soc, known, title, onet_detail_used, job_zone, cognitive_pivot_score, compact_median, rules, onet_alternate_title_support, national{p10,p25,median,p75,p90,broad_parent_row}, metro_raw, metro_band, scorer}, `spread`, `flags[]`, `verdict` ∈ {RESOLVED, AMBIGUOUS-REFUSE, STOP}, `stopped_at`, `verdict_why`, `score`), `summary`, `cannot_verify[]`. Every evidence value carries `label` ∈ {record, your-input, model-judgment} and a `source`. Side files: `roles.json` (scorer input) and the scorer's own `role-scores.json/.md`.

**Human report — `<out-dir>/soc-resolver.md`.** Reader: the job-seeker deciding whether to apply or first ask a recruiter which SOC the role would be filed under. Decision enabled: apply / ask the recruiter / skip. Sections: Executive summary; Run record; one-line-per-posting table (posting, kind, liveness, scope, experience, degree, candidate SOCs, verdict); per posting: verdict + why, quoted experience and degree evidence, posting pay vs third-party claims, employer match and rejected look-alikes, per-candidate wage table (national p10/p25/median/p75; metro nominal p25/median; RPP-adjusted p25/median/p75; scorer; why a candidate; O*NET support), spread result, flags; "What this run cannot tell you"; label key.

## Stop conditions — refuse rather than guess

- Liveness is not `active` for the exact URL → `STOP` for live status. Never fall back to pasted text as if live; never raise `uncertain` to `active` by hand inside the script.
- Required years > max → `STOP`. No required years → `HOLD`, never "entry-level".
- A candidate SOC's wage is missing and the rest agree → `STOP`. Never interpolate, never use the national value for a metro cell, never substitute 13-1020 for 13-1023.
- Candidates disagree past a threshold → `AMBIGUOUS-REFUSE`: no single score, wage floor or sponsor verdict for the posting.
- Employer name matches only by substring → not attached (`NAME-COLLISION-REJECTED`).
- EAD dates not entered by a named human → no timeline ranking.
- Asked for a visa-law conclusion (is this a specialty occupation? will H-1B be approved? is my degree STEM?) → refuse; route to DSO / attorney.
- Asked to write into `data/` or any tracked path outside the namespaces → exit 2, nothing written.
- Asked to read `private/` or `data/ats/` into a tracked file → refuse.

## Sign the gate (owner)

```bash
node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
npm run ats:liveness -- "https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033" "https://www.zipline.com/open-roles/7818180003?gh_jid=7818180003"
node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-1-sc-manager-5yrs.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/owner-check
npm run verify
npm run doctor
```

Record to check by hand: **13-1081 Logisticians in Dallas-Fort Worth-Arlington, TX** — open `MSA_M2024_dl.xlsx` (inside `oesm24ma.zip`), filter `AREA = 19100`, `OCC_CODE = 13-1081`: `A_MEDIAN` should read 77110; BEA `MARPP_MSA_2008_2024.csv`, GeoFIPS 19100, LineCode 1, 2024 should read 103.090; 77110 / 1.0309 = 74,798.72, the adjusted median the report shows. Then set `last_gate` to `"sample-run, <date>, logs/runs/2026fa-contactshyam14-code-2.md, signed <name>"`.

## RUN_LOG template (`logs/runs/2026fa-contactshyam14-code-<n>.md`)

```markdown
## <YYYY-MM-DD> — case-em-pm-supply-chain-soc-resolver v<version> — <sample | live> run

- Commands: <verbatim, one per line>
- Inputs: <n> postings (<real ids>, <sample ids>); liveness logs <paths + UTC time>; wage data <paths + sha256 prefix>; persona EAD dates <entered | not entered>
- Outputs: <out-dir>/soc-resolver.json, soc-resolver.md, roles.json, role-scores.json/.md
- Result: RESOLVED <n> · AMBIGUOUS-REFUSE <n> · STOP <n> (by gate: liveness <n>, scope <n>, experience <n>, data <n>); ranked <n> (visa gate <state>)
- Tests: node --test → <pass>/<total>
- Conformance: npm run verify <exit>, npm run doctor <exit>
- Gate decisions: <who cleared or refused which gate, why> | none
- Open issues: <list>
- No secrets, no personal contact details, no private application notes.
```
