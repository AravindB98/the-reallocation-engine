---
status: DRAFT
todos_open: 7
last_gate: "live run 2026-10-18 (21 boards, 333 engineering postings); gates G3 (5 boards), G4 (4 of 5 live text ranges) and G6 (5 uncertain postings) cleared by Mayank Bhadrasen 2026-10-21, logs/runs/2026fa-mayank-1024-2.md; G5 and G7 open"
attestation: null
recipe_version: 0.1.0
---

# wage-level-floor — where a posted salary lands on the H-1B lottery (backend SWE, F-1 OPT, Boston)

## Executive summary

**What it does.** Since February 2026 the H-1B lottery is no longer a flat draw. Each registration is entered once, twice, three or four times depending on which of the Department of Labor's four wage levels the offered salary reaches, for that occupation in that city. This mode takes every engineering posting with a published pay range at Massachusetts companies that have sponsored H-1Bs for software titles, and places the range against those four lines. It says, per posting: how many lottery entries an offer from this range could carry at its bottom and its top, and the exact dollar line inside the range where one entry becomes two.

**Who it's for.** A master's graduate in computer science on F-1 OPT, applying for backend / platform / full-stack software roles in the Boston area, whose employer will have to win them an H-1B lottery slot next spring. In Boston that person needs $114,275 to reach Level I and $138,237 for Level II as a software developer; most new-graduate ranges straddle one of those lines, and nothing on a job board says so.

**What it decides, and what it doesn't.** It decides which postings' ranges sit on a level line — information to use when choosing where to apply and, later, what number to negotiate to. It does not decide whether to apply, whether the company will sponsor, which occupation code the employer will file, or what the offer will be. It never ranks companies and never produces a score.

**Status: DRAFT.** The full workflow ran live on 2026-10-18 (21 job boards, 333 engineering postings, two scenarios), with 19 offline tests passing and every placed number cross-checked against its source. It is still DRAFT because seven proposed additions below are open, and the lifecycle does not allow SPECIFIED while any typed TODO is open. On 2026-10-21 a person (Mayank Bhadrasen) cleared board identity for 5 boards, the text-sourced pay of 4 of the 5 still-live text-sourced postings, and liveness for the 5 postings the checker could not decide. The occupation-code question (G5) has not been asked of any recruiter, and there is no offer (G7).

Two customers: this file is for the agent. `recipes/cases/2026fa/mayank-1024-wage-level-floor.card.md` is for the person.

**Handoff condition (done when):** `wage-level.log.json` and `wage-level.report.md` exist in the run folder; `funnel.classified + funnel.stopped == funnel.in_target_area`; `model_judgment_values == 0`; every placed posting carries `pay.source ∈ {record, record-text}`, `band.source == rule`, `soc.source == your-input`; every refused posting carries one `stop_reason`; and the Boston 15-1252 thresholds in the log equal the OFLC row × 2080. "The table looks right" is not the condition.

## Purpose

**What it does.** It places a job posting's published pay range on the four DOL wage levels for the person's occupation code and worksite area. Then it reports, per posting, the lottery entries at the bottom and top of the range and the dollar line inside the range where the entry count changes. Postings whose range it can't place honestly are refused, with the reason.

**Use it exactly when:**
- you are on F-1 (OPT or STEM OPT) and your next H-1B registration falls inside your work authorization (gate G1), **and**
- you are choosing which cap-subject postings to apply to, preparing for a recruiter call, or comparing an offer against the level lines (re-run with `offers[]`), **and**
- the employer is cap-subject (not a university or affiliated nonprofit) and the role sits in Massachusetts or New Hampshire, the areas in the committed extract.

**Do not use it** to decide whether a company sponsors (that's the 80 Days data and the sponsor-triage recipes), to estimate your odds (the per-level chances are a DHS projection), or for roles outside the committed areas until the extract is regenerated for them.

## Required reads

1. `SNICKERDOODLE.md`; `DOMAIN.md` (Known gaps 3 and 9).
2. `data/dol/oflc/README.md` — what the wage-level table is, its provenance, and what it does not say.
3. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` — what the sponsor CSV does and doesn't prove.
4. This recipe, its card, and `scripts/contrib/2026fa/mayank-1024-wage-level-floor/README.md`.

## Rules this mode encodes (and where each comes from)

| Rule | Source | Kind |
|---|---|---|
| A registration is entered 4 / 3 / 2 / 1 times for wage level IV / III / II / I | DHS final rule, 90 FR 60864 (2025-12-29), effective 2026-02-27; used for FY2027 | rule |
| The level is the highest OFLC level the proffered wage meets or exceeds, for the SOC code and area of intended employment | same rule | rule |
| A wage below Level I (alternate wage source) registers in the Level I group | same rule (comment response on alternate sources) | rule |
| Several worksites → the lowest applicable level; several registrations for one person → the lowest level | same rule, §"Lowest Equivalent OEWS Wage Level When Beneficiary Would Work in Multiple Locations" | rule |
| Annual = hourly × 2080 | OFLC technical release notes WY 2026-27 ($115/hr = $239,200/yr) | rule |
| Selection chance per level ≈ 15.29 / 30.58 / 45.87 / 61.16 % (vs 29.59 % random) | DHS projection, 90 FR 60948 — a model estimate before any weighted lottery ran | **projection**, never a record |
| Massachusetts employers with 25+ employees must post a pay range | MA salary range transparency law, effective 2025-10-29 | context: why ranges exist to read |

## Source inventory

| Evidence | Path / command | Label | Role |
|---|---|---|---|
| Four wage lines per area × SOC | `data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv` (684 rows, 12 MA/NH areas, SOC 15-/17-), from `fetch-oflc.sh` + `extract-oflc.mjs`; raw in gitignored `data/dol/oflc/raw/` | record | the thresholds |
| Posted pay ranges | `fetch-pay-ranges.mjs --out <run>/pay-snapshot.json` → Greenhouse `pay_input_ranges` (`?pay_transparency=true`), Ashby `Salary` component (`?includeCompensation=true`), and a regex over the description text | record (ATS field) / record-text (regex) | what gets placed |
| Company → board | `scripts/contrib/2026fa/mayank-1024-wage-level-floor/board-map.json` (21 boards, `identity_confirmed: false`) | your-input | gate G3 |
| Sponsor history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered` | record | candidate list + context only |
| Persona: SOC, worksite map, dates, title patterns, zone answers, offers | `persona.example.json` (fictional) or `private/<file>.json` | your-input | G1, G5, G7 |
| Placement | `node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs --snapshot <run>/pay-snapshot.json --out-dir <run>` | rule | the bands |
| Posting liveness | `npm run ats:liveness -- <url>` (repo script, Playwright) | record | gate G6 |

Prototype commands (repo root):

```bash
bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh                 # ingest, once per wage year
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-pay-ranges.mjs --out <run>/pay-snapshot.json   # ingest
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs --snapshot <run>/pay-snapshot.json --out-dir <run>
node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs
```

Network hosts: `flag.dol.gov` (fetch-oflc.sh), `boards-api.greenhouse.io` and `api.ashbyhq.com` (fetch-pay-ranges.mjs), and the posting host in a G6 `ats:liveness` call. `wage-level.mjs` never touches the network (its tests stub `fetch` to throw).

## Phase gates (hard stops)

| Gate | Testable condition | Who clears | On fail |
|---|---|---|---|
| G1 timeline | `visa.work_auth_end` > `as_of`; and `work_auth_end` ≥ `registration.next_window_start` → `open`; else `stem_opt_eligible` → `conditional`; else `closed` | machine (inputs are the person's) | past date → exit 3, **nothing written**. `closed` → levels shown, lottery entries `n/a` everywhere |
| G2 data conformance | OFLC extract and 80 Days CSV carry their required columns; OFLC row exists for `home_area × soc.primary`; `extract-oflc.mjs` refuses an `ALC_Export.csv` whose sha256 differs from `fetch.json` | machine | exit 2 "schema drift", nothing written |
| G3 board identity | the person opens each board for a company they will act on and sets `identity_confirmed: true` | **person** | the posting stays in the report, flagged; do not act on it |
| G4 pay evidence | for every posting placed on `record-text`, the person opens the posting and confirms the range is base pay for the worksite | **person** | treat the placement as unconfirmed |
| G5 occupation code | the person asks the recruiter which SOC the role is filed under; if not `soc.primary`, re-run with that SOC | **person** | the report's last column shows the level under the alternatives; nothing is assumed |
| G6 posting liveness | `npm run ats:liveness -- <url>` prints `active` for that exact posting before an application is tailored | **person** runs it | `expired` → drop; `uncertain` → open by hand; never treated as active |
| G7 offer | when an offer exists, its base salary goes into `offers[]` and the mode is re-run; the offer's level replaces the range | **person** | the posted range is never reported as the offer |

Liveness and timeline are gates, not votes: neither is averaged into anything, and a closed timeline removes the lottery column rather than lowering a number.

## Decision logic

- **Funnel** (counted in the log): boards → boards ok → engineering postings (ingest pattern) → title matches `target.title_pattern` and not `exclude_title_pattern` → a mapped location in `target_areas` → placed | refused.
- **Worksite area**: the first named city in `location_map` that is in `target_areas`. `Remote` / `United States` map to `home_area` **only** when nothing else in the string names a place (`Remote, Canada`, `New York, NY; Remote` → refused, `remote-scope-unclear`).
- **Pay evidence**: ATS field first; text regex only when the ATS field is empty; never merged. Non-USD-only → refused. More than one distinct USD range → refused (`zone-ambiguous`) unless `zone_choice[company]` names the zone. A unit word (hour/week/month) in the label/snippet → refused; a minimum under $10,000 → refused. With no unit field, annual is **inferred** and labeled so.
- **Level**: highest of the four annual lines (hourly × 2080) the number meets or exceeds; 0 = below Level I.
- **Band** for range [min, max]: `RANGE-BELOW-L1` (max below I) · `FLOOR-BELOW-L1` (min below I, max ≥ I) · `CLIFF-IN-RANGE` (min and max on different levels; the **line to cross** is the next threshold above min) · `FLAT` (one level throughout).
- **Entries**: the level number (rule); `I-group*` below Level I; `cap-exempt` for a company in `cap_exempt_companies`; `n/a` when G1 is closed.
- **SOC sensitivity**: the same range placed under each `soc.sensitivity` code at the same area, reported, never used.
- **Sponsor context**: the CSV row's counts, rate and company-wide median, with the median placed on the primary lines **for context only**.

## Next action per band

| Band | What the person does | Hours it feeds (3-3-2 day) |
|---|---|---|
| CLIFF-IN-RANGE | apply (after G6); if an offer comes, the line to cross is the negotiation number — one dollar above it doubles (I→II) or adds an entry | 2 research-and-apply |
| FLAT | apply on fit; negotiating inside the range does not change the lottery weight | 2 research-and-apply |
| FLOOR-BELOW-L1 | apply only if the floor is not the likely offer; any offer must clear Level I, which is a fact worth knowing before the recruiter call | 2 research-and-apply |
| RANGE-BELOW-L1 | ask the recruiter which SOC they file and whether they use a private survey (G5); otherwise the role cannot register on OEWS data at this code | 3 networking (ask) |
| refused | supply what the refusal names (zone, range, unit) and re-run | — |

## What it can verify

- The four wage lines for an occupation and area, exactly as DOL published them for wage year 2026-27 (hash-pinned).
- That at capture time a company's public board published a given pay range for a given posting, and whether it came from the ATS's own pay field or from text.
- Which level each end of that range reaches, the entries the rule attaches to that level, and the dollar line inside the range.
- That a posting naming another place was **not** silently placed on Boston thresholds.
- That a closed timeline, a non-annual unit, a foreign currency, or an ambiguous zone produced a refusal rather than a number.

## What it cannot verify

- **Which SOC code the employer will file.** It is the employer's legal choice, and the same range moves by up to two levels across plausible codes, in either direction (every placed posting in the 2026-10-18 run moved under at least one alternative). G5.
- **The offer.** A posted range is a good-faith expectation, not the proffered wage on the registration. G7.
- **Selection odds.** Entries are a rule; the per-level chances are a DHS projection made before any weighted lottery ran. FY2027 per-level outcomes are not in the repository.
- **Whether the company will sponsor at all**, register before the window, or is cap-exempt (no data source; persona only).
- **That a board belongs to the company** (slugs were guessed from the website domain). G3.
- **That a text-regex range is base pay for this worksite** (not a different city, a bonus, or a different role on the same page). G4.
- **That a posting takes applications.** Board listing ≠ live posting; the repo's checker returns `uncertain` on employer-hosted career pages (Formlabs, Tulip on 2026-10-18). G6.
- **Multi-worksite roles.** The lowest-level rule is implemented (`lowestAcross`) but the mode cannot tell from posting text whether "Boston or Remote" means alternatives or several worksites.
- **The `GeoLvl` field's meaning** (undocumented); rows ≠ 1 are flagged, not interpreted.
- Fit, total compensation (equity, bonus), the OPT unemployment-day clock, and the $100,000 H-1B fee proclamation (USCIS guidance of 2025-10-20 exempts in-country change of status from F-1; a proposed rule of 2026-08-25 is pending — out of scope here).

## Proposed additions

1. [TODO: DATA SOURCE] DOL LCA disclosure data (FY2026, `https://www.dol.gov/agencies/eta/foreign-labor/performance`), filtered to the 21 board-mapped companies, at `data/dol/lca/`. Reason: it records the SOC code and wage level each employer actually filed for software titles. It would turn G5 from "ask the recruiter" into a record per employer, and replace the company-wide `median_salary_offered` (which mixes every title and has no year) with that employer's real level distribution for 15-1252.
2. [TODO: DATA SOURCE] USCIS per-wage-level selection results for FY2027, if published, at `data/uscis/`. Reason: the only per-level odds available today are DHS's pre-rule projection; a measured rate would replace a projection with a record.
3. [TODO: DATA SOURCE] The FY2028 registration window dates from USCIS, replacing the persona's `next_window_start: 2027-03-01` assumption. Reason: G1 is only as good as this date.
4. [TODO: DEFINE] The meaning of OFLC `GeoLvl` 2/3/4, from OFLC documentation, with one sentence of reasoning. Reason: today a non-1 row is flagged and a person has to guess what fallback it represents.
5. [TODO: DEV] Make G6 conclusive for employer-hosted career pages: when `ats:liveness` returns `uncertain` and the posting is still listed in the board API at check time, report `listed-in-ats` as a distinct state. Reason: 2 of 5 checks on 2026-10-18 were `uncertain` for postings the Greenhouse API still listed, even at the canonical Greenhouse URL.
6. [TODO: DEV] Cap-exempt detection for employers in the candidate list (universities, affiliated nonprofits, research organizations) instead of a persona list. Reason: a cap-exempt employer makes this whole mode irrelevant for that company, and the persona list relies on the person knowing.
7. [TODO: DATA SOURCE] Restore the inputs of `npm run bls:local-wage` (`data/bls/local-wage/{metro_oews.csv,bea_rpp.csv,bls_bea_msa_crosswalk.csv,sample.csv,requirements.txt}`), which its recipe calls "already ingested" but which are not in git on any branch. Reason: comparing a Boston offer with a Worcester one needs both the level (this mode: Worcester Level I is $101,026 vs Boston $114,275) and the price-adjusted wage (that script) — the two answer different questions.

## Output contract

Written to `--out-dir`; the classifier refuses any location except `course/2026fa/submissions/mayank-1024/mode-build/runs/`, gitignored `private/`, or a temp dir. Runs with real dates or a real offer go to `private/`.

**Agent log, `wage-level.log.json`:** `recipe`, `recipe_version`, `run_at`, `mode`, `model_judgment_values` (always 0), `inputs` (paths, snapshot `captured_at`, OFLC wage year + zip sha256, CSV sha256), `timeline`, `thresholds` (soc, area, hourly, annual), `lottery` (entries, projection, source), `funnel`, `bands`, `stops`, `pay_text_classified`, `soc_sensitive_postings`, `gates_pending_human`, `postings[]` (each value as `{value, source, from}`: location, worksite_area, pay, pay_unit, soc, oflc, band, entries_at_min/max, soc_sensitivity, offer; or `stop_reason` + `stop_detail`), `sponsor_context[]`.

**Human report, `wage-level.report.md`:** executive summary; timeline gate; the four lines (hourly, annual, entries, projection labeled as projection); postings placed (band, company, linked title, range, source, levels, entries, line to cross, SOC sensitivity); postings refused with what a person would have to supply; sponsor context; what a person still has to judge; verified vs inferred; run record last.

Agent log, abridged from the 2026-10-18 run (one placed and one refused posting):

```json
{
  "recipe": "recipes/cases/2026fa/mayank-1024-wage-level-floor.md", "recipe_version": "0.1.0",
  "mode": "offline-snapshot", "model_judgment_values": 0,
  "timeline": { "state": "open", "days_left": 317, "window": "2027-03-01" },
  "thresholds": { "soc": "15-1252", "area": "14460", "annual": [114275.2, 138236.8, 162198.4, 186160] },
  "funnel": { "engineering_postings": 333, "title_match": 25, "in_target_area": 13, "classified": 11, "stopped": 2 },
  "postings": [
    { "company": "KLAVIYO INC", "title": "Software Engineer II - Recommendations", "status": "classified",
      "pay": { "value": { "min": 116000, "max": 174000 }, "source": "record", "from": "greenhouse pay field" },
      "soc": { "value": "15-1252", "source": "your-input" },
      "band": { "value": { "kind": "CLIFF-IN-RANGE", "level_min": 1, "level_max": 3, "cliff": 138236.8 }, "source": "rule" },
      "entries_at_min": { "value": 1, "source": "rule" }, "entries_at_max": { "value": 3, "source": "rule" } },
    { "company": "…", "title": "…", "status": "stopped", "stop_reason": "no-pay-range" }
  ]
}
```

Human report template (the placed-postings table; the other sections are listed above):

```markdown
| Band | Company | Title | Range | Source | Level min→max | Entries min→max | Line to cross | SOC changes it? |
|---|---|---|---|---|---|---|---|---|
| CLIFF-IN-RANGE | <company> | [<title>](<url>) | $<min>–$<max> | ATS field / posting text | I→III | 1→3 | $138,237 | 15-1253: II→IV; … / no |
```

## Stop conditions

Refuse to place a posting — and say why — when: there is no pay range; the only range is not in USD; more than one USD range exists and no zone answer was given; the unit is hourly/weekly/monthly or the minimum is under $10,000; "Remote" appears beside another named place; there is no OFLC row for the area × SOC.

Refuse to run (exit, nothing written) when: the authorization end date is past or missing (exit 3); any input file is missing or lacks a required column (exit 2); the output folder is in the tracked tree outside the runs folder (exit 2).

Refuse, as a matter of the recipe, when someone asks to: convert an hourly or weekly range "just this once"; pick the Boston zone without a person saying which one; treat the DHS projection as the odds; choose a lower-paid SOC code to raise the level (the code must match the duties — that is the employer's legal call, not a lever); or report a posted range as an offer.

## Verification checks

- `node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs` — 19 tests, offline (fetch stubbed to throw), including four break cases.
- `node scripts/conformance.mjs scripts/contrib/2026fa/mayank-1024-wage-level-floor/ recipes/cases/2026fa/`
- Hand cross-check (done 2026-10-18, `runs/2026-10-18/verification.txt`): Boston 15-1252 row raw vs extract; one posting's range live API vs snapshot vs report; one company's CSV row vs report; a second run diffed against the first.

## Run-log template (`logs/runs/2026fa-<handle>-<n>.md`; students do not edit `logs/RUN_LOG.md`)

```markdown
### YYYY-MM-DD — wage-level-floor run <n> (<scenario>)
- **Recipe:** recipes/cases/2026fa/mayank-1024-wage-level-floor.md v<version>
- **Inputs:** persona <path, fictional | "private, not committed">; snapshot <path> captured <ts>; OFLC <wage year>, zip sha256 <first 16>; 80 Days CSV sha256 <first 16>
- **Commands:** <exact commands>
- **Outputs:** <run folder>/wage-level.{log.json,report.md}
- **Result:** engineering <n> → title <n> → area <n> → placed <n> · refused <n>; bands <counts>; stops <counts>; text-sourced <n>; SOC-sensitive <n>/<n>
- **Gate decisions:** G3 <boards confirmed, by whom, date> · G4 <text ranges confirmed> · G5 <SOC answers> · G6 <urls, result> · G7 <offer re-run y/n>
- **Open issues:** <what did not work, what is still missing>
```
