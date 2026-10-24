---
status: DRAFT
todos_open: 6
last_gate: "sample run on real data, 2026-10-21, logs/runs/2026fa-AdityaHasija37-wage-level-1.md (Gates L and T cleared by the machine and recorded by Aditya Hasija; P, S, R and D cleared by Aditya Hasija)"
attestation: null
recipe_version: 0.1.0
---

# msis-pm-wage-level — where does a posted PM salary land in the wage-weighted H-1B lottery?

## Executive summary

**What it does.** Since the March 2026 registration season the H-1B lottery is no longer a flat draw. Each
registration gets 1, 2, 3 or 4 entries depending on which of four official wage levels
the offered salary reaches. The level is not set by the salary alone. It depends on the
job code the employer files and the city the job is in, and the applicant chooses
neither. This mode takes a live product-manager posting that shows a pay range, and
looks up that salary in the Department of Labor's own wage tables for the city. It does
this for every job code a product role could plausibly be filed under. The result is
how many lottery entries the salary would earn under each code, and how far the salary
is from the next level.

**Who it is for.** An international master's student in Information Systems (a STEM
degree) who graduates in December 2026, will have about three years of work
authorization (OPT plus the STEM extension), and is targeting product-manager, AI
product-manager and product-analyst roles in the San Francisco Bay Area and Seattle.
That gives three lottery seasons: March 2027, 2028 and 2029. Product managers have no
job code of their own, so the same offer can land anywhere from Level I to Level IV.

**What it decides, and what it leaves to a person.** It looks levels up in an official
table, so it never estimates a level itself. It refuses to level a pay range that
includes commission, or a city and code where the government publishes no levels. It
never states a chance of selection, because no data in the repository supports one. A
person confirms each pay range is base salary and checks which wage-level rule is in
force before every run. A person also reads the report before using it with an
employer.

**What it found on its first run.** Take Flexport's Senior PM range at its midpoint,
$193,500 in San Francisco. It earns 1 entry if filed as an IT manager and 4 if filed as
a management analyst. For these three postings, a shortcut using national pay data put
the level higher than the official city table in 23 of 54 comparisons and never lower.
Most of that gap remains even after the national data is scaled up for being a year older.
That points to the city, rather than the data year, as the larger cause; this is an
inference, because the percentile mapping behind the shortcut is also approximate.

**Status.** DRAFT. A full run on live postings and official data completed. Six
proposed additions are still open, and the lifecycle does not allow skipping the
"specified" stage while any are open.

## Contract (for the agent)

Two customers: this file is for the agent. The person-facing page is
`recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.card.md`, and every run writes
a human report (`out/report.md`) and an agent log (`out/run-log.json`).

**Handoff condition (done when):** `wage_level.py run` exits `0`; `out/run-log.json` and
`out/report.md` both exist (both are rendered before either is written); every scenario has exactly one `route` in {`leveled`,
`stop-liveness`, `stop-pay-basis`, `stop-pay-range`, `stop-worksite`} with a `reason` when stopped; every
leveled row's `level` traces to a row of the committed OFLC extract whose sha256
matches its provenance file; every `selection_probability` is `null`; the report's
first section is `## Executive summary`; and the offline test suite passes. "The report
looks right" is not the condition.

## Purpose — what it does, and exactly when to use it

What it does: for one live posting with a posted base-pay range, it reports, under each
candidate SOC code, the official OFLC wage level that the low, midpoint and high of the
range reach in the worksite's wage area. It also reports the weighted-lottery entries
(1–4) and the dollar gap to the next level, and puts beside them a labelled national
proxy, the employer's 80 Days sponsorship record and the occupation's Cognitive Pivot
score.

Use it when you have a live posting with a posted pay range in a metro that's in the
extract and want to know, before an interview loop or an offer conversation, what the
salary means for the lottery. Use it again when an offer arrives. The worksite and base
salary are then known, and only the job code is still the employer's choice.

Do not use it to rank companies (the 80 Days sponsorship record is context here, not a
score); to decide whether to apply (the scorer and the network-targets recipe do that);
or as legal advice about a petition.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — what is runnable; the national-only role-quality limit (known gap 9).
3. `scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/README.md`.
4. `scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/data/oflc-2026-27-pm-extract.provenance.json`.
5. The OFLC technical release notes for the wage year (in the fetched raw folder): units,
   "High Wage", vintage.

## Source inventory

| Source | Path / command | Label | Human check |
|---|---|---|---|
| Official wage levels by area × SOC (OFLC wage year 2026-27, built on May 2025 OEWS) | `bash scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/fetch-oflc.sh 2026-27` (pinned sha256 in `checksums.lock`) → `wage_level.py extract` → `…/data/oflc-2026-27-pm-extract.csv` (+ `.provenance.json`) | record | Provenance hash matches; `missing_pairs` is empty |
| National OEWS percentiles P10–P90 (May 2024) | `data/bls/oesm24nat/national_M2024_dl.xlsx` (shipped) | record → used only as **proxy** | None: a proxy never sets a level |
| Cognitive Pivot score per SOC | `data/bls/compact/soc_occupation_compact.csv` (`cognitive_pivot_score`, `.00` rows) | record (context) | None: feeds no decision |
| Employer sponsorship history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record (context) | Spot-check one company's approvals |
| Posting liveness | `npm run ats:liveness -- "<posting url>"` (repo script, unchanged) | record | `uncertain` counts as closed |
| Repo conformance and privacy | `npm run verify`, `npm run doctor` | machine | Both exit 0 |
| Leveling logic | `python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py run` | n/a | Read the report |
| Tests | `python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/test_wage_level.py` | n/a | 38/38 pass (Python 3.13 and 3.12) |
| Independent cross-check | `python3 …/xcheck_raw.py …` (recomputes every row's four annual wages, level, entries and gap from the raw OFLC file, without importing the mode) | n/a | 0 mismatches |
| Vintage sensitivity | `python3 …/sensitivity_vintage.py` (re-counts proxy disagreements with national wages scaled up 0–20%) | derived | Read the table |
| Policy citations | `…/data/policy-sources.json` (Federal Register citations, retrieved 2026-10-21) | record | Gate R |
| Persona | `…/fixtures/persona.fixture.json` | your-input | OPT start date |
| Scenarios (postings, worksite, pay sentence) | `…/fixtures/scenarios.<date>.json` | record + your-input (basis, SOC set) | Gates P and S |
| Rule check | `…/fixtures/rule-check.json` | your-input (a named person's check) | Gate R |

Network: only `fetch-oflc.sh` (host `flag.dol.gov`) and `ats:liveness` (the posting URL)
touch the network. `wage_level.py` reads local files only.

## Proposed additions

One new data source and one new command are **built and ran** in this version. The
other six additions are proposed; each is marked with a typed TODO at the point in this
file where its absence bites.

| Addition | Type | State | Why it belongs in the engine |
|---|---|---|---|
| OFLC wage-year tables (`fetch-oflc.sh` + `wage_level.py extract`) | data source | **built, ran** (pinned sha256, provenance file) | The repo has only *national* OEWS; the lottery level is set by the *area* table. Without it, every level is a guess that ran high in SF and Seattle (23/54 here). The extract also carries 13-1161 and 15-2031, ready for a product-analyst run, and San Jose, used by the "High Wage" refusal test; neither is in this run's scenarios. |
| `sensitivity_vintage.py` | command | **built, ran** | Tests whether the proxy's error is just the one-year data gap (it isn't: 18/54 still overstate at +10%). |
| `wage_level.py run` | command | **built, ran** (38 tests) | Turns a posted range into entries per SOC; nothing in the repo connects salary to the 2026 weighted lottery. |
| OFLC LCA disclosure data | DATA SOURCE | proposed (see *Cannot verify*) | Records which SOC and level each employer actually filed for each title, which turns Gate S from a judgment into a record. |
| `lca-soc-lookup.py` | DEV | proposed | Employer × title → filed SOC/level distribution; replaces the hand-set candidate list. |
| USCIS registration and selection counts by wage level | DATA SOURCE | proposed | The only honest basis for a selection probability; until then the mode refuses to give one. |
| Weighting of below-Level-I and "High Wage" rows | DEFINE | proposed | The regulation text decides it; a person must read it, not the script. |
| BLS OEWS May 2025 metro percentiles | DATA SOURCE | proposed | Lets the proposed-rule bracket be computed per metro rather than nationally. |
| `capture-scenario.py` | DEV | proposed (see *Workflow*) | Scenario capture is the one manual, uncommitted step in the provenance chain. |

## Rules

| Rule | Value | Source |
|---|---|---|
| Lottery entries by level | I = 1, II = 2, III = 3, IV = 4 | DHS final rule, *Weighted Selection Process…*, 90 FR 60864 (FR doc 2025-23853, Dec 29, 2025), effective Feb 27, 2026; all policy citations in `…/data/policy-sources.json` |
| Level met | the highest OFLC level whose annual wage the salary **equals or exceeds**; below Level I is reported as `below-I`, with no entries | rule as described in the final rule; boundary tested |
| Hourly → annual | × 2080, unless the OFLC label is `Annual Wage` | OFLC convention; tested |
| Offer points | posted low, midpoint (derived), posted high | your-input; a range is not an offer |
| Approximate percentile of each level (proxy only) | current: 17 / 34 / 50 / 67; proposed (DOL NPRM 2026-03-27): 34 / 52 / 70 / 88 | policy description, not data; never sets a level |
| Lottery seasons | March registrations after the run date whose April 1 filing falls before OPT/STEM OPT ends (12 + 24 months from the OPT start) | your-input approximation; USCIS sets dates each year |
| Rule-check freshness | ≤ 30 days old at run time | your-input |

## Phase gates

Each gate is a hard stop. A failed run-level gate writes nothing and exits 2. A failed
scenario gate keeps the scenario in the report as **stopped**, with its reason and no
level shown.

| Gate | Testable condition | Pass | Fail | Who clears |
|---|---|---|---|---|
| **L — liveness** (scenario) | `liveness.status == "active"`, `liveness.checked_on` equals the run date, and the `liveness.evidence` file, a saved `npm run ats:liveness -- <url>` capture **inside the repo**, contains `# run at <checked_on>` and the line `✅ active <posting_url>` for this scenario's URL. The script parses the file; it does not trust the typed status alone. | scenario leveled | `expired` / `uncertain`, a check from another day, an evidence file outside the repo, missing, or not showing this URL active → `stop-liveness` | machine; human records it |
| **P — pay basis** (scenario) | `pay.basis == "base"` **and** `pay.basis_confirmed_by` is a name (≥ 3 characters including a letter) of the person who read `pay.quoted_text`; `pay.low`/`pay.high` are numbers with 0 < low ≤ high | scenario leveled | OTE/commission/total-comp/unknown, or unconfirmed → `stop-pay-basis`; malformed or inverted range → `stop-pay-range` | named human |
| **S — SOC candidate set** (run) | `soc_candidates.codes` non-empty, `soc_candidates.set_by` names a person, and every code exists in the OFLC extract (all enforced) | run proceeds | any of these fails → exit 2, nothing written | named human |
| **R — rule in force** (run) | `rule-check.json` has `regime_in_force`, `checked_on` (a `YYYY-MM-DD` date 0–30 days before the run), `checked_by` (a name: ≥ 3 characters including a letter), `how`; the regime is `current-2005` (the only regime the 2026-27 OFLC file encodes) | run proceeds | any field missing, blank, malformed, stale, or a newer regime → exit 2, nothing written | named human |
| **Run date** (run) | `--run-date` is today. Freshness gates (L, R) are measured against the run date, so a back- or forward-dated run requires `--replay`, and the log and report are then stamped **REPLAY** | run proceeds | not today and no `--replay`, or not `YYYY-MM-DD` → exit 2 | machine |
| **T — timeline** (run) | ≥ 1 lottery season remains before OPT/STEM OPT ends | run proceeds | 0 seasons, or bad OPT date → exit 2 | machine |
| **D — release** | A named person has read `out/report.md`, including "What this cannot tell you", before using it with an employer | use the report | no use | named human |

Liveness and the visa timeline are gates, not votes. A dead posting or an exhausted
lottery window is not "lower priority"; it is out.

## Workflow (run from the repo root)

1. Data (once per wage year):
   ```bash
   bash scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/fetch-oflc.sh 2026-27
   python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py extract
   ```
2. Capture scenarios: for each candidate posting, record the URL, worksite, the pay
   sentence verbatim, and the OFLC area for the worksite (from `Geography.csv`).
   Today this is done by hand.
   [TODO: DEV] `capture-scenario.py <greenhouse board> <job id>` → a scenario object
   with the pay sentence extracted and `basis_proposed` set, `basis` left null. It may
   use only the Greenhouse/Lever/Ashby API hosts.
3. Gate L: `npm run ats:liveness -- "<url>"` per posting; save the output; cite it.
4. Gate P and Gate S: a person reads each `quoted_text`, sets `basis` and
   `basis_confirmed_by`, and signs `soc_candidates.set_by`.
5. Gate R: a person checks the Federal Register (DOL/ETA, "prevailing wage", newest first)
   and the DOL foreign-labor news page, then fills `rule-check.json`.
6. Run, then test:
   ```bash
   python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py run --run-date YYYY-MM-DD
   python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/test_wage_level.py
   npm run verify && npm run doctor
   ```
7. Gate D: read `out/report.md`. Log the run in `logs/runs/2026fa-AdityaHasija37-wage-level-<n>.md`
   (template below). Students do not edit `logs/RUN_LOG.md` (it is CI-protected).

## What it can and cannot verify

**Verified against a record:**
- The four official wage levels (annual) for each SOC in each of the three metros, for the
  July 2026 – June 2027 wage year, and which level a given salary meets under each SOC.
- The dollar gap from a salary to the next level.
- That the posting was live on the run date (`ats:liveness`; the script refuses a check from any other day, or one with no saved evidence file).
- The posted pay sentence, verbatim, as of capture.
- Where OFLC publishes no levels ("High Wage" — San Jose × 11-3021 in this extract), so
  the mode refuses to level that row.
- The employer's company-wide H-1B approvals, denials and median sponsored salary in 80 Days.

**Your input (a person's choice, not a fact):**
- Which SOC codes are candidates (Gate S). This is the largest judgment in the mode.
- Whether a pay range is base salary (Gate P).
- The OPT start date, and therefore the number of lottery seasons.
- Which DOL level rule is in force (Gate R).

**Proxy (shown, never decides):**
- The national-percentile bracket under the current and the proposed level rules. It uses
  a different year (May 2024) and a different geography (national), and it maps levels to
  percentiles approximately. It exists to show how wrong a national shortcut is, and to
  give a first look at the proposed rule, which the OFLC file cannot.

**Model judgment:** none. No AI output enters any value.

**Cannot verify:**
- **Which SOC code the employer will actually file.** This is the asymmetry the mode
  exposes, and it cannot close it.
  [TODO: DATA SOURCE] DOL OFLC LCA disclosure data (quarterly, FY2026) at
  `…/raw/lca/` with a provenance note. Each certified LCA lists employer, job title, SOC
  code, worksite and wage level, which would turn Gate S from a judgment into a record
  ("Flexport filed 'Senior Product Manager' under SOC X at Level Y, n times").
  [TODO: DEV] `lca-soc-lookup.py` — employer × title pattern → distribution of SOC
  codes and wage levels from the LCA file. It would replace the hand-set candidate list
  with the codes the employer has actually used, labeled record.
- **Selection probability.** Entries are a weight; the chance depends on how many others
  registered at each level.
  [TODO: DATA SOURCE] USCIS FY2027 registration and selection counts by wage level, at
  a named path with provenance. Until it exists, the mode refuses to print a probability.
- **How a below-Level-I wage or a "High Wage" row is weighted in the lottery.**
  [TODO: DEFINE] A person reads the amended 8 CFR 214.2(h)(8)(iii) and records here,
  with one sentence of reasoning, how each case is weighted. Until then both are
  refused or shown as `0*`.
- **The proposed rule at city level.** The proxy for the proposed rule is national only.
  [TODO: DATA SOURCE] BLS OEWS May 2025 metropolitan-area percentiles (`oesm25ma`)
  with provenance, so the proposed-rule bracket can be computed per metro.
- The final base salary; the actual worksite if the role is hybrid or remote; whether
  another employer registers the same person at a lower level (USCIS then uses the
  lowest); E-Verify enrollment and STEM-OPT degree relatedness; other fee and entry
  policy. On 2026-10-21 that included Proclamation 11069, which extends the $100,000
  entry payment to Sep 21, 2027, and a DHS proposed $103,265 fee on cap-subject petitions
  (FR 2026-08-25). These can change whether an employer sponsors at all, and none of
  them is modeled.

## Facts that bite, and how this mode handles them

| Fact | Handling |
|---|---|
| OFLC 2026-27 is built on May 2025 OEWS; the repo ships May 2024 national OEWS | The area level always comes from OFLC; national data is labeled proxy and never sets a level |
| OFLC publishes hourly wages | Annual = hourly × 2080 unless labeled `Annual Wage` (tested both ways) |
| Some rows have no levels (`High Wage`, `No Leveled Wage`) | Refused per row, with the reason in the report; tested end to end on San Jose × 11-3021 |
| Pay-transparency ranges are sometimes on-target earnings (base + commission) | Gate P; Verkada S1 was stopped on its own wording |
| National OEWS P90 can be top-coded `#` (≥ $239,200) | The bracket logic treats it as a bound, never as a number (tested) |
| `cognitive_pivot_score` is blank for 15-2051.00 and 15-1299.00 in the compact extract | Shown as `—`; no sub-occupation's score is substituted |
| `role_quality` weight is 0.0 in the repo scorer; `bls:local-wage` needs metro files that do not ship | Neither is used; this mode does not feed the Apply/Consider/Skip scorer |
| The level rule may change (DOL NPRM 2026-03-27) | Gate R before every run; the run refuses a newer regime with the current OFLC file |
| The extract's tamper check compares it with its own provenance file | The provenance file's zip hash must also equal the pin in `checksums.lock`. Editing all three files together would still pass, and only `xcheck_raw.py` (a recompute from the raw download) catches that. Disclosed, not solved. |
| Gate signers are free text | A name rule rejects blank and one-letter signers; it cannot verify that the named person really looked (see the false-confirmation break run) |

## Output contract

Two artifacts, two readers, in `--out` (default `scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/out/`).

**`run-log.json` (agent).** Top level: `_recipe`, `_script`, `version`, `run_date`, `mode`
(`live` or a `replay: …` note),
`inputs` {persona, scenarios, rule_check, oflc_extract {path, sha256, matches_provenance}, national_oews,
compact, eighty_days}, `gates` {timeline {opt_start, opt_end, seasons[], source},
rule_check}, `soc_candidates` {codes, set_by, reason}, `summary` {scenarios, leveled,
stopped, stopped_by{}, rows, refused_rows, below_level_I_rows, proxy_compared,
proxy_disagrees, proxy_overstates, proxy_understates}, `scenarios[]`, `cannot_verify[]`.

Each `scenarios[]` item: `id`, `company`, `title`, `posting_url`, `worksite`, `pay`,
`liveness`, `sponsorship_80days` (record, or `null` + "no trace"), `route`, `reason`,
`selection_probability: null` + note, `spread` {low|mid|high: {min_entries,
max_entries, below_level_I_socs}}, and `rows[]`. Each row: `soc`, `soc_title`,
`offer_point`, `salary`, `salary_source`, `oflc` {status, reason, levels{I..IV}, source},
`level`, `entries`, `entries_note` (set when below Level I), `gap_to_next` {next_level,
needs, gap}, `national_proxy` {brackets {current-2005, proposed-2026-nprm: {min, max,
exact}}, source}, `proxy_disagrees`, `proxy_direction` (`overstates` / `understates` /
`agrees`), `cognitive_pivot_score`, `cognitive_pivot_source`.

**`report.md` (person).** `## Executive summary` first (what was checked, the spread of
entries across job codes, how often the national shortcut disagreed, what it cannot tell
you, what to do). Then: run record; one section per scenario with posting, liveness,
worksite → area, pay quote and basis, 80 Days record. Then either the stop reason or a
table with columns: *SOC (employer's choice) · OFLC Level I/II/III/IV (annual) · level
at Low · Mid · High · entries L/M/H · Mid: gap to next level · national proxy (current ·
proposed) · Cognitive Pivot*, followed by the spread line. Then "What this cannot tell
you", then the release gate.

Template for one scenario table row:

```markdown
| 15-2051 Data Scientists | $110,386 / $142,438 / $174,512 / $206,565 | II | III | IV | 2/3/4 | +$13,065 → IV | IV · III–IV ⚠ disagrees | — |
```

## Stop conditions

Stop, write nothing, exit `2`:
- `--run-date` is not `YYYY-MM-DD`, or is not today and `--replay` was not given;
- Gate R fails (missing or blank field, `checked_by` not a name, `checked_on` not
  `YYYY-MM-DD`, older than 30 days, future date, or a regime other than `current-2005`
  with the 2026-27 file);
- Gate T fails (no season left, OPT start missing or not `YYYY-MM-DD`);
- the persona, scenarios or rule-check file is missing or not valid JSON; the SOC set is empty, unsigned, or names a code that is not in the extract (Gate S);
- any data file (OFLC extract, national OEWS, compact, 80 Days) is missing;
- the OFLC extract's sha256 does not match its provenance file, or the provenance zip
  hash does not match `checksums.lock` (added 2026-10-21 after a break test showed the
  run levelled a hand-edited extract).

Do not level the scenario, and say why in the report:
- liveness is anything but `active`, was checked on a day other than the run date, or its
  evidence file is outside the repo, missing, or doesn't show this URL active (`stop-liveness`);
- the pay range is not confirmed base salary by a named person (`stop-pay-basis`);
- the pay range is not two numbers with 0 < low ≤ high (`stop-pay-range`);
- the worksite has no OFLC area, or its area has no rows in the extract (`stop-worksite`).

Do not level the row, and say why:
- the OFLC row is `High Wage`, `No Leveled Wage`, has an empty level, or is missing.

Refuse requests to:
- print a selection probability or "odds";
- fill a missing level from national data, a neighbouring metro, or a sub-occupation;
- treat the midpoint of a range as the offer;
- recommend which SOC code an employer *should* file (that is the employer's and its
  counsel's decision; the report shows consequences, not advice).

## Next action per result

| Result | Next action |
|---|---|
| Spread ≥ 2 entries across codes at the likely offer point | Before accepting, ask the employer's immigration team which SOC code and level they plan to file; compare with the table |
| A code at `below-I` (`0*`) | That code cannot support this salary; if the employer intends it, the salary must rise |
| Gap to next level ≤ ~5% of salary | A negotiation point with a concrete number behind it |
| `stop-pay-basis` | Ask the recruiter for the base component, then re-run |
| `stop-pay-range` | Fix the transcription from the posting's pay sentence |
| `stop-liveness` | Nothing; skipping is a successful outcome |
| OFLC row refused | Ask the employer; do not substitute |

## Run-log template (for `logs/RUN_LOG.md`)

Use this entry format in `logs/RUN_LOG.md`. A student PR may not edit that file (CI
protects it), so student runs file the same entry as
`logs/runs/2026fa-AdityaHasija37-wage-level-<n>.md`, and a maintainer copies it into
`RUN_LOG.md` at promotion.

```markdown
## YYYY-MM-DD — msis-pm-wage-level run <n>

- **Recipe:** recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md v0.1.0 (DRAFT)
- **Inputs:** OFLC extract sha256 <first 16>; scenarios file <path> (captured <date>); persona (OPT start <date>, your-input); SOC set signed by <name>
- **Commands:** <verbatim, in order>
- **Outputs:** out/run-log.json, out/report.md
- **Result:** scenarios <n> → leveled <n> · stopped <n> (<route n>); rows <n> · refused <n> · below-I <n>; proxy disagrees <n>/<n>; entries spread at midpoint per scenario <min–max>
- **Gates:** L <active n/n, evidence files> · P <confirmed by / date> · S <signed by> · R <regime, checked by / date / how> · T <seasons> · D <read by / date or OPEN>
- **Checks:** tests <n/n>; verify <exit>; doctor <exit>; hand cross-check <one cell: raw OFLC hourly × 2080 = report>
- **Open issues:** <what did not work or is still missing>
```
