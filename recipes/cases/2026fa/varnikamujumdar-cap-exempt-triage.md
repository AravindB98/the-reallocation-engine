---
status: DRAFT
todos_open: 3
last_gate: "sample-run 2026-10-21 (fictional persona, real postings, real 80 Days + BLS + IPEDS + USCIS data), logs/runs/2026fa-varnikamujumdar-2.md and -3.md; G4 cleared by varnikamujumdar 2026-10-21 (logs/runs/2026fa-varnikamujumdar-4.md); human adequacy sign-off by Varnika Mujumdar, 2026-10-21, in course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/WORKED-RUN.md, re-signed after the grader-review edits (logs/runs/2026fa-varnikamujumdar-5.md): re-ran 47 tests and reproduce.sh, fingerprint 96a7e662… matched"
attestation: null
recipe_version: 0.1.0
---

# Cap-exempt employer triage after a lost H-1B lottery

## Executive summary

**What this is.** A step-by-step operating procedure for an AI agent helping one kind of person: an international graduate on OPT who was **not selected in the H-1B lottery** and wants employers that can sponsor a work visa **without** the lottery. Universities, nonprofits affiliated with universities, and nonprofit or government research institutes are "cap-exempt" by law. Nothing on a job posting says which employers qualify.

**Why read it.** The engine's main company dataset is built from private-fundraising filings, so it cannot see universities or research nonprofits at all. An agent that trusts it, or trusts a name that sounds like a university, will give confident wrong answers. This procedure says what to check, in what order, and when to stop.

**What it decides.** For each real job posting it gives one of four outcomes: shortlist (ask HR to confirm), flag (a record contradicts the claim), held (nobody confirmed the posting is still open), or skip. It **never** says an employer *is* cap-exempt. Only the employer and the government can establish that, and no file in this repository records it. It stops entirely when the person's work authorization cannot cover a realistic hiring and visa timeline.

Status is DRAFT even though a full sample run completed. Of six proposed additions, three are now closed with evidence: the federal college list (IPEDS), government H-1B counts per employer (USCIS) and the hiring-lag decision. Three remain open below, and the constitution allows no stage past DRAFT while any are open.

Two customers: this file is for the agent. The human card is `recipes/cases/2026fa/varnikamujumdar-cap-exempt-triage.card.md`.

## Purpose and when to use

Use when **all** of these hold:

- the person is on F-1 OPT (or STEM OPT), and
- their H-1B registration was **not selected** this fiscal year, and
- they want to target employers whose petitions are exempt from the annual cap, and
- they have a short list of specific postings (URLs) to evaluate.

Do not use for cap-subject employers (use the sponsorship-triage recipes), for H-1B transfers (the person is already counted), or for anyone whose authorization has already ended.

**Handoff condition (done when):**
- `run.json` and `report.md` exist for the run.
- Every row has a liveness result or is HELD.
- No row has `cap_exempt_status` other than UNVERIFIED / UNVERIFIED-RECORD-SUPPORTED / CONTRADICTED-BY-SIGNAL / HUMAN-ATTESTED.
- The run is logged under `logs/runs/`.

"Looks right" is not the condition.

## Source inventory (exists today)

| Source / command | Path | Used for | Provenance label |
|---|---|---|---|
| Fictional persona | `search/examples/priya-nair/profile.yml` | OPT end date, unemployment days, buffer, STEM eligibility | your-input (fictional) |
| Persona extension | `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json` | lottery result, employment status, timeline assumptions | your-input (fictional) |
| 80 Days dataset | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | **counter-evidence**: an employer that appears here raised private capital through Form D, a for-profit signal | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | national OEWS median wage for the role's SOC | record |
| IPEDS HD2024 extract | `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv` (6,072 institutions; audit `ipeds-audit.md`) | is the employer a listed institution, and is it public, nonprofit or for-profit | record |
| USCIS H-1B Employer Data Hub FY2023 extract | `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/uscis_h1b_hub_fy2023.csv` (33,332 rows, unfiltered; audit `uscis-audit.md`) | FY2023 H-1B approvals per employer, the sponsorship history 80 Days lacks | record |
| Ingest | `python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/ingest.py ipeds\|uscis\|all` | the only network step besides liveness; writes extracts, audits and `data/PROVENANCE.md` | — |
| Name normalizer | `normalize_company_name` in `scripts/sec/entity-resolution.py` (reused, not copied) | exact matching of employer names to 80 Days, IPEDS and USCIS rows | script-output |
| Liveness checker | `npm run ats:liveness -- --file <urls.txt>` (`scripts/ats/check-liveness.mjs`) | G3: is the posting still open | script-output |
| This mode's script | `python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py audit` / `triage` | coverage audit; gates + evidence signals | script-output |
| Tests | `python3 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage -v` | 47 offline tests incl. a BROKEN mutant (pass on Python 3.9.6 and 3.12.14) | — |

### Regulatory basis

Each item below was checked against primary text on 2026-10-21 (eCFR, Federal Register, U.S. Code, uscis.gov) **by an AI research helper**. No person (DSO or attorney) has reviewed it. It is still **not legal advice**, and the agent must say so.

- **Cap exemption.** The three categories are an institution of higher education (HEA §101(a)), a related or affiliated nonprofit entity, and a nonprofit or governmental research organization. Sources: INA 214(g)(5)(A)–(B), 8 U.S.C. 1184(g)(5); 8 CFR 214.2(h)(8)(iii)(F)(1)–(3); definitions at (h)(19)(iii).
- **2024 modernization rule** (89 FR 103054, Dec 18 2024, effective Jan 17 2025).
  - A research organization now qualifies when research is "a fundamental activity", replacing "primarily engaged" / "primary mission".
  - A worker not directly employed by a qualifying institution can be exempt only if they "spend at least half of their work time performing job duties at a qualifying institution" that directly further its mission: (F)(4).
  - The rule did **not** substantially broaden "affiliated nonprofit".
- **Cap-gap.** It applies only to cap-subject petitions, not cap-exempt ones (USCIS). It is now 8 CFR 214.2(f)(5)(vii)(A), renumbered from (vi) effective 2026-09-15, and runs to April 1. **Consequence:** a cap-exempt petition must be approved, with its start date, before OPT ends. That is why G2 exists.
- **STEM OPT extension** requires an E-Verify employer: 8 CFR 214.2(f)(10)(ii)(C)(5).
- **Leaving cap-exempt work later.** A worker never counted against the cap is counted, i.e. must be selected in the lottery, the first time they work for a cap-subject employer: 8 U.S.C. 1184(g)(6); 8 CFR 214.2(h)(8)(iii)(F)(5). Concurrent cap-subject work while keeping the cap-exempt job is excepted: (F)(6).

## Proposed additions

Six additions were proposed so that UNVERIFIED could become a recorded fact. On 2026-10-21 three were closed with evidence (re-scope logged in `logs/runs/2026fa-varnikamujumdar-3.md`); three stay open. No output is labeled as if an open one existed.

**Closed:**

1. ~~DATA SOURCE: IPEDS institution directory~~ — **closed 2026-10-21.**
   - File: `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv`. The named path moved from the proposed `data/ipeds/` into the contribution namespace, as CONTRIBUTING requires.
   - Provenance: https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip, downloaded 2026-10-21, raw SHA-256 `d98425c123d7c0e872aec6e83960dfb501884818bf17385c340790f3d1f28345`. Recorded in `data/PROVENANCE.md`; audit `data/extracts/ipeds-audit.md` (6,072 → 6,072 rows; 1,980 public, 1,813 private nonprofit, 2,257 private for-profit).
2. ~~DATA SOURCE: USCIS H-1B Employer Data Hub~~ — **closed 2026-10-21.**
   - File: `…/data/extracts/uscis_h1b_hub_fy2023.csv`, kept unfiltered.
   - Provenance: https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv (FY2023 is the latest CSV published), downloaded 2026-10-21, SHA-256 `96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931`. Audit `data/extracts/uscis-audit.md` (33,332 rows; 2,042 with NAICS 61).
   - **Correction to the proposal:** the file carries 2-digit NAICS only (61, 54, 62), so 6113/5417/6221 cannot be separated.
3. ~~DEFINE: default hiring lag~~ — **closed 2026-10-21 by the author's decision.**
   - The value is **45 days**.
   - Reasoning: no published source for university offer-to-filing time was found, so 45 is kept as an explicit, overridable default, always labelled `your-input (guess)`. Its effect is shown by the break fixture `ext.slow-hiring.json` (120 days → G2 STOP).

**Open:**

4. **[TODO: DATA SOURCE] IRS Exempt Organizations Business Master File**, proposed at `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/`.
   - It records 501(c)(3) status by EIN.
   - It would separate a nonprofit research institute from a for-profit with a similar name (break B1: Toyota Research Institute).
   - The source was probed on 2026-10-21 (`irs.gov/pub/irs-soi/eo1–eo4.csv`, large) but not ingested.
5. **[TODO: DATA SOURCE] DOL OFLC ACWIA prevailing-wage tables** (probed: `flag.dol.gov/.../OFLC_Wages_2026-27.zip`, 12.6 MB, containing `EDC_Export.csv`).
   - Cap-exempt employers may use this lower table.
   - Until it exists, the posted salary is compared only to the national OEWS median, and the report says a gap is expected.
6. **[TODO: DEV] Extend the resolver to the IRS EO BMF once item 4 exists.**
   - Re-scoped 2026-10-21. The IPEDS and USCIS part of the original resolver item is built: exact normalized names via the reused normalizer, human-chosen links (`ipeds_unitid`, `uscis_employer`), near-miss candidates shown but never used.
   - Handoff: a BMF match on EIN or exact legal name → `record` signal, with tests and a frozen sample coverage line `resolved/attempted`.

## Procedure and phase gates

Run in order. A gate that fails stops the run. No gate clears itself.

### G0. Coverage audit (read before any triage)

```bash
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py audit \
  --out <run-dir>/audit.md --json
```

The agent reads the counts to the human. On 2026-10-21 the counts were:
- 30,369 rows;
- 1,552 with any approvals;
- 31 names that sound cap-exempt, **0 with approvals** (all 31 blank, i.e. unknown; 94.9% of all rows are blank, so this alone says little), 26 with a private funding round and 13 LLC/LP-type;
- **the stronger measure:** 0 of the 31 is an IPEDS institution, and **0 of 3,771** open public and nonprofit IPEDS institutions appear in 80 Days by exact name (`audit` prints this when the IPEDS extract exists).

If future counts change materially (e.g. universities appear), the upstream dataset changed: log it and re-read this recipe before continuing.

### G1. Input gate (hard; halts and writes nothing)

All of these must hold:
- the persona, extension and targets parse;
- `opt_end_date` and `--run-date` are valid dates;
- the timeline assumptions are integers;
- `lottery.result == "not-selected"`;
- every target has `employer, title, url, claimed_category ∈ {IHE, affiliated-nonprofit, nonprofit-research, governmental-research, none}, claim_basis ∈ {employer-statement, name-only}, soc`;
- both CSVs exist with their expected columns;
- if an IPEDS or USCIS extract is given, it has its expected columns. A **missing** extract is not a halt: that check is switched off and the report says so (`record_checks`).

Exit code 2.

### G2. Timeline gate (hard; run-level STOP)

`days_left = opt_end − run_date` and `required = hiring_lag + h1b_processing` (both your-input). The gate passes only if all of these hold:
- `days_left > 0`;
- `days_left ≥ required`;
- if not currently employed on OPT, `unemployment_ceiling − used − buffer ≥ required`.

On failure, no employer is evaluated, `run.json` records the STOP, the report says "talk to your DSO", and the exit code is 3. A STEM extension is mentioned but not assumed, because it needs an E-Verify employer, which is not verified.

### G3. Liveness gate (hard; per row)

1. Write the target URLs to `<run-dir>/urls.txt`.
2. Run `npm run ats:liveness -- --file <run-dir>/urls.txt | tee <run-dir>/liveness.txt`.
3. Re-check, once, each non-active result that may be transient or misread: a navigation timeout, or an `expired` from the page-length rule. Save the output as `liveness-recheck.txt` and pass both files with `--liveness` twice (a later file supersedes an earlier one for the same URL). A hard expiry and `no apply control` are not re-checked; they go straight to SKIP or HELD below. (On 2026-10-21, TRI's timeout and Fred Hutch were re-checked.)
4. Rows map as follows:
   - `active` → continue.
   - `expired` with a hard reason (HTTP gone, expired-URL redirect, expired-text pattern) → SKIP.
   - `expired` whose only reason is the checker's page-length rule ("insufficient content") → **HELD**. Iframe-based job boards (iCIMS, used by many hospitals and universities) trip it on live postings. That happened to Fred Hutch on 2026-10-21. Root cause, from a Playwright probe: the page's top-level text is 13 characters, and the job (6,866 characters) is inside a child frame the checker never reads.
   - `uncertain` → HELD.
   - **URL missing from every liveness file → HELD, "not checked — not scored".**

An unchecked gate is never treated as open. The checker reads only the top-level page and is tuned for Greenhouse, Lever and Ashby. It is least reliable on the Workday and iCIMS boards most cap-exempt employers use, so expect more HELD rows than in a startup search.

### Evidence signals (shown, never summed into a score)

| Signal | Source | Effect |
|---|---|---|
| Employer appears in 80 Days (Form D filer) | record | CONTRADICTED-BY-SIGNAL → FLAG |
| Name ends in LLC / LP / LLP / PBC / L3C | script-output | CONTRADICTED-BY-SIGNAL → FLAG |
| Category not stated by the employer (`claim_basis: name-only`: the name, or a reading such as "private" for "nonprofit") | your-input | CONTRADICTED-BY-SIGNAL → FLAG. Strictly *unsupported*, not contradicted: the mode fails closed and treats it the same way |
| Name ends in Inc. / Corp. | script-output | **no effect.** Nonprofit corporations use these too |
| IPEDS lists the employer as public or private nonprofit, open | record | UNVERIFIED-RECORD-SUPPORTED → SHORTLIST (record-supported) |
| IPEDS lists it as **private for-profit** (fails HEA §101(a), which needs public or nonprofit), or as closed | record | CONTRADICTED-BY-SIGNAL → FLAG |
| IPEDS: same name in more than one state, no `state` given | record | ambiguous: no signal, candidates shown |
| USCIS FY2023 approvals for the employer (rows summed across spellings that normalize identically) | record | context only: shows the employer sponsors, **not** whether cap-exempt |
| Near-miss names in IPEDS or USCIS (token overlap) | script-output | **never a signal**; shown "for human review"; a human may set `ipeds_unitid` / `uscis_employer` |
| HR confirmed in writing (`exemption_evidence`) | your-input | HUMAN-ATTESTED, never VERIFIED |
| National OEWS median for the SOC vs. posted salary | record vs. your-input | context only; SOC choice is model-judgment |

### G4. Human gate (the point, not a bottleneck)

The run ends with the report. The person reads it and decides, for **every posting the gates did not skip**, one of `contact-hr | open-posting-myself | keep-held | drop`. They record the decisions in a JSON file and re-run with `--g4 <file>`:

```json
{"by": "<name>", "date": "YYYY-MM-DD", "decisions": {"T1": "keep-held", "T3": "contact-hr"}}
```

**Handoff condition (testable).** G4 is CLEARED only if all of these hold:
- `by` and a valid `date` are present;
- every non-SKIP row has a decision;
- every decision is one of the four values.

Otherwise `gates["G4 human"].cleared = false`, the missing or invalid rows are named, and the run status stays "human gate open". Each decided row carries `g4_decision` with provenance `human decision`. The decision is also logged under `logs/runs/` (who, what, when).

For a `contact-hr` row, the question to ask is: *"Do you file H-1B petitions as cap-exempt for this role, and under which category?"* The agent never applies, emails, or records an answer on the person's behalf.

## What it can and cannot verify

**Can verify (record or script-output):**
- whether a posting URL was live when checked, according to `ats:liveness`'s patterns;
- whether the employer name matches a row in the Form D-derived dataset (exact normalized name), and that row's funding stage and approvals;
- whether the employer's name carries a for-profit legal form;
- the BLS national median wage for the chosen SOC (OEWS May 2024);
- the arithmetic of the timeline gate, given the inputs;
- how much of the cap-exempt world the 80 Days dataset can see (the G0 audit);
- whether the employer is in the federal college list (IPEDS HD2024), and whether it is public, nonprofit, for-profit or closed;
- how many H-1B petitions USCIS approved for that employer name in FY2023.

**Cannot verify (stated in every report):**
- **whether any employer is cap-exempt.** No dataset here records it; USCIS decides it on each petition;
- whether a role at a qualifying employer is filed cap-exempt. Some university-affiliated employers still file cap-subject petitions;
- third-party placements under (F)(4): whether a contractor placed at a university spends half its time there on mission work;
- whether a for-profit with no Form D filing, no legal suffix and a research-sounding name is for-profit. A corporate "Research Institute" passes every signal here unless the claim is marked name-only. IPEDS does not list research institutes, and USCIS approvals do not say nonprofit. **This is the mode's known blind spot** until the IRS file (open item 4) exists;
- whether an affiliated nonprofit is really "related or affiliated" with a university. No dataset here records affiliation;
- whether any USCIS petition was cap-exempt. The Data Hub counts petitions, has 2-digit NAICS only, and stops at FY2023. "No exact match" is not "never sponsored": the employer may file under another spelling (HHMI files as "HOWARD HUGHES MEDICAL INSTITUTE HHMI"). Measured on 2026-10-21, only 544 of 3,771 open public/nonprofit IPEDS institutions (14.4%) match a USCIS name exactly; Stanford files as "THE LELAND STANFORD JR UNIVERSITY" and BU as "TRUSTEES OF BOSTON UNIVERSITY". A human-confirmed link (`uscis_employer`) is the remedy, not fuzzy matching.
- the prevailing wage the employer will actually use (ACWIA tables are absent), or what the employer will pay;
- whether the employer will sponsor at all, or how long its hiring or petition will take (the timeline numbers are assumptions);
- whether a liveness result is right on Workday or iCIMS boards.
  - On 2026-10-21 the checker returned `uncertain` for an open Northeastern (Workday) posting.
  - It returned `expired` for an open Fred Hutch (iCIMS) posting.
  - Both are held, but the mode cannot tell a closed posting from a misread one.
- the G0 name pattern finds *names*, not institutions.
  - It uses word boundaries. A substring version matches 64 names instead of 31, the extra 33 being "HOSPITALITY", "FOUNDATIONAL" and the like.
  - Either way, 0 have approvals.

## Output contract

**Agent log: `<run-dir>/run.json`.** One object:
- `mode`, `recipe_version`, `run_date`, `persona` (fictional), `lottery`.
- `inputs`: repo-relative path + SHA-256 per input.
- `gates`: `G1 input`, `G2 timeline` with each check's value, need and pass, plus provenance labels.
- `rows[]`: `id, employer, title, url`, `liveness{result, reason, provenance}`, `claimed_category{value, basis, source, provenance}`, `cap_exempt_status`, `signals[]{signal, detail, provenance}`, `support[]`, `ipeds{status, unitid, name, state, control, closed, candidates}`, `uscis_h1b_fy2023{status, names, states, naics, initial_approvals, continuing_approvals, initial_denials, continuing_denials, candidates}`, `form_d_match`, `legal_form`, `wage{soc, soc_provenance, national_median, posted_midpoint, posted_vs_national_pct}`, `outcome`, `why`.
- `status`.
- `record_checks` (which extracts loaded or were switched off).
- `gates["G4 human"]{cleared, by, date, rows_needing_a_decision, missing, invalid, problems, counts, source_file}`; per row `g4_decision{value, by, date, provenance: "human decision"}`.
- `summary{evaluated, shortlist, flag, held, skip, not_shortlisted_rate, liveness_checked, record_supported, uscis_matched, cap_exempt_verified: 0}`.

**Human report: `<run-dir>/report.md`.** It contains:
1. an executive summary in plain language;
2. the run record;
3. a gates table;
4. a postings table: `# | Employer · role | Liveness | Claimed category (basis) | IPEDS | H-1B approvals FY2023 (USCIS) | Cap-exempt status | National median (SOC) | Posted midpoint | Outcome`;
5. why each outcome happened, with signals and their provenance;
6. "Read this before acting".

The report is for the person deciding whom to email. The log is for the next agent and the grader. Neither substitutes for the other.

## Stop conditions (refuse rather than guess)

Each stop condition says who enforces it, so the written gate and the running gate can be compared.

| Condition | Response | Enforced by |
|---|---|---|
| **G1 fails** | halt, write nothing, print the reason (exit 2) | script; tests `InputGate` |
| **G2 fails** | STOP; no employer is evaluated or ranked (exit 3) | script; tests `TimelineGate` |
| **No liveness file** | every row HELD; nothing shortlisted | script; test `NoLivenessFile` |
| **A target's claim source is missing** | treat the claim as `name-only` | script; test `test_statement_without_a_source_counts_as_name_only` |
| **G4 not cleared** | status stays "human gate open"; nobody is contacted | script reports it (tests `HumanGateG4`); the person acts |
| **The person asks "is X cap-exempt?"** | refuse a yes or no; give the signals, the HR question and the regulatory basis | agent behaviour; the script has no yes value to give (test `test_never_verified`) |
| **Asked to rank or score cap-exempt likelihood** | refuse: there is no record to calibrate a probability against (P3) | agent behaviour; the script computes no score |
| **Audit counts shift materially** from the numbers in G0 | stop and log an upstream-change blocker | agent behaviour: compare the `audit --json` output with G0 |

## Log template (`logs/runs/<term>-<handle>-<n>.md`)

```markdown
### YYYY-MM-DD — cap-exempt-triage · <sample | live> run
- Recipe: recipes/cases/2026fa/varnikamujumdar-cap-exempt-triage.md v<version> (status <status>)
- Persona: <fictional persona> + <extension file> (lottery: <FY> not-selected)
- Inputs: <targets file> (<n> postings) · liveness.txt from `npm run ats:liveness` · 80 Days CSV sha256 <first 12> · BLS compact sha256 <first 12> · IPEDS / USCIS extract sha256 <first 12>
- G0 audit: rows <n> · approvals>0 <n> · cap-exempt-sounding <n> (with approvals <n>)
- G1: <PASS | HALT reason> · G2: <PASS | STOP> (<days_left> left, <required> required, margin <m>)
- Outcomes: shortlist <n> · flag <n> · held <n> · skip <n> · record-supported <n> · USCIS matched <n> · cap-exempt verified 0
- G4: <CLEARED by <name> on <date>: <counts> | OPEN: <reason>>
- Outputs: <run-dir>/run.json, report.md, audit.md, liveness.txt
- Tests: <n>/<n> pass
- Open issues: <list>
```
