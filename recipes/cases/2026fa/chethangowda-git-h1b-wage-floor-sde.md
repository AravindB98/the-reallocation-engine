---
status: RUNNABLE-SAMPLE
todos_open: 8
last_gate: "sample-run, 2026-10-21, assignments/submissions/chethangowda-git/RUN_LOG-entry.md"
attestation: null
recipe_version: 0.1.0
---

# H-1B Wage-Floor Triage for SDE I / SDE II Roles

## Executive summary

**What this is.** A step-by-step check for an international master's student with about
three years of software-engineering experience who wants a full-time Software Engineer I or
II job that starts in June 2027 or later and will need H-1B sponsorship. Before any time
goes into an application, it answers four questions: is the posting still open, does its own
text shut out visa holders, does it start late enough, and does its posted salary meet the
government's minimum H-1B wage for that city at that experience level.

**Why read it.** The H-1B minimum wage is not one number. It depends on the metro area and on
one of four experience levels, and in the Bay Area the entry-level minimum is already above
the national median pay for software developers. An offer that looks generous can still be
too low to sponsor, and a senior-sounding role can need a much higher floor than a
new-graduate one. None of this is visible on a job board.

**What it found.** On five real, live postings from four companies, three were ruled out by
their own wording — two required a US security clearance and one said it would not sponsor —
which a salary check alone would have missed. The other two never state a start date, so
the check stops rather than guessing; assuming a June 2027 start, both land in "a person has
to decide", because their pay ranges straddle the minimum for the experience they ask for.
No posting passed. That is the intended behaviour: the check skips more than it keeps.

---

## Lifecycle note

Status is **RUNNABLE-SAMPLE**: a full sample run (20 fictional postings, 36/36 test checks,
two deliberate mutations caught) and a real run (5 live postings) completed, conformance
passed, and the extract audit and gate reports were generated and read. Evidence:
`assignments/submissions/chethangowda-git/RUN_LOG-entry.md` and `WORKED-RUN.md`.

**Stated conflict, not hidden:** the constitution's DRAFT → SPECIFIED transition requires zero
open typed TODOs, and this recipe carries 8 (Proposed additions, below). The claim rests on
the run evidence for what exists; everything behind an open TODO is labeled proposed and
never presented as having run. No gate has been cleared for a live run, so this is not
RUNNABLE-LIVE, and there is no attestation record, so it is not VERIFIED.

## Purpose

**Use it when** all of these hold:
- You are on F-1 (OPT, then STEM OPT) and will need an employer to file an H-1B.
- The role is software development — SOC **15-1252** Software Developers.
- The role is SDE I / new grad or SDE II (roughly 0–5 years required).
- You cannot start before an earliest month (scenario default **2027-06**).
- The posting is on a Greenhouse board and in one of the 41 target cities
  (`data/oflc/city-county-targets.csv`: Bay Area, NYC/Jersey City, Seattle area, DC/Northern
  Virginia, Dallas–Fort Worth, Austin, Boston, Atlanta, San Diego, Denver/Boulder, LA, Chicago,
  Raleigh/Durham, Phoenix, Huntsville, Miami).

**Do not use it for:** university or research-nonprofit employers (lower wage table, not
extracted); data science, QA or other SOC codes; Lever/Ashby/Workday boards (no converter
yet); deciding which wage level an employer will file — that is the employer's call.

## Source inventory

| Source | Path or command | What it provides | Label |
|---|---|---|---|
| DOL OFLC prevailing wages, wage year 2026–27 | `data/oflc/alc-15-1252-wy2026-27.csv` | Level 1–4 hourly wages, 20 areas | record |
| DOL OFLC geography | `data/oflc/county-area-map-wy2026-27.csv`, `data/oflc/city-area-map-wy2026-27.csv` | county → area; city → area(s), `ok` / `split-needs-worksite` | record (built on a your-input city → county table) |
| Provenance + audit | `data/oflc/README.md`, `data/oflc/oflc-extract-audit.md` | download date, wage year, SHA-256 of sources and outputs | audit |
| Extractor | `python3 -I scripts/oflc/extract-prevailing-wages.py --src <OFLC folder>` | rebuilds the extract from a hand download | script |
| 80 Days to Stay | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `Total Approvals`, `Total Denials`, `Approval_Rate` (company-wide). 30,369 companies; 1,557 (5.1%) have any sponsorship record. `phone`, `executive_officers`, `board_directors` are **never read** | record |
| Posting liveness | `npm run ats:liveness -- <url> ...` (`scripts/ats/check-liveness.mjs`) | active / expired / uncertain; exit 0 only if all active | record |
| Converter | `python3 -I scripts/oflc/greenhouse-to-gate-input.py <job.json>... -o <gate-input.json> [--assume-start-month YYYY-MM]` | gate input with per-field labels | script |
| Gate | `python3 -I scripts/oflc/wage-timeline-gate.py <gate-input.json> --out-dir <dir> [--earliest-start YYYY-MM]` | JSON log + Markdown report | script |
| Test | `python3 -I scripts/oflc/wage-timeline-gate.test.py` | 36 checks over fixtures, converter, malformed input | script |
| BLS OEWS national | `data/bls/compact/soc_occupation_compact.csv` (15-1252 median $133,080, May 2024) | context only — **not** a prevailing wage | record |

## Inputs (one gate-input record per posting)

| Field | Source | Label |
|---|---|---|
| `title`, `url`, `company` | Greenhouse record | record |
| `city`, `state` | parsed from the posting's location | record; null if the posting gives only a country |
| `worksite_county` | only needed for Raleigh, Durham, Huntsville | your-input |
| `salary_min`, `salary_max`, `salary_period` | Greenhouse `pay_input_ranges` (one USD range only) | record; annual period assumed, `[verify]` per posting |
| `years_required` | first "N years … experience" phrase in the text | record (text match) |
| `start_month` | the posting, if stated; otherwise null, or a labeled scenario value | record / your-input (scenario) / missing |
| `description_text` | posting text, HTML stripped | record |
| `soc`, `employer_type` | default 15-1252, private | your-input (assumed) |

## Steps

| # | Step | Command | Labor | Output |
|---|---|---|---|---|
| 1 | Fetch postings (network — a human approves first) | `curl -s "https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>?pay_transparency=true"` | AI, human-approved | `private/real-postings/<date>/<board>-<id>.json` (never committed) |
| 2 | Liveness | `npm run ats:liveness -- <urls>` | AI | terminal output saved to `private/` |
| 3 | Sponsorship lookup | today: a read-only Python read of the 80 Days CSV by company name, printing only the sponsorship columns (see Proposed additions) | AI, human confirms the name match | line numbers + counts, quoted in the report |
| 4 | Convert | `python3 -I scripts/oflc/greenhouse-to-gate-input.py ...` | AI | `private/.../gate-input.json` |
| 5 | Gate | `python3 -I scripts/oflc/wage-timeline-gate.py ... --out-dir private/.../run-<name>` | AI | `wage-gate-log.json`, `wage-gate-report.md` |
| 6 | Review | read the report; confirm every text-flag snippet; decide every UNCERTAIN | **human** | decision per posting |

## Phase gates

Each gate is a hard stop. Liveness and timeline are **gates, not votes**: a closed or missing
gate ends the posting's evaluation; it is never averaged against a good salary.

| Gate | Testable condition | Cleared by |
|---|---|---|
| G1 Liveness | `ats:liveness` prints `active` for the URL (exit 0 for the batch) | machine; a person rechecks `uncertain` |
| G2 Text disqualifiers | no `no-sponsorship` or `clearance-or-citizenship` flag in the log; any flag → SKIP | machine flags; **a person confirms the snippet** |
| G3 Timeline | `start_month` present **and** ≥ `--earliest-start`; missing → STOP, earlier → SKIP | machine; the start month itself is human-supplied when the posting is silent |
| G4 Location | city in the city map and resolving to exactly one wage area (or a `worksite_county` that does) | machine |
| G5 Wage floor | experience band <2 yrs → L1/L2, 2–<5 → L2/L3, ≥5 → L3/L4; PASS if `salary_min` ≥ the higher level, FAIL if `salary_max` < the lower, else UNCERTAIN | machine; **every UNCERTAIN goes to a person** |
| G6 Sponsorship record | company found in the 80 Days CSV with a non-blank approval count; blank or absent → STOP (a blank does not mean "never sponsors") | human confirms the name match |
| G7 Human review | every flag snippet read and every UNCERTAIN decided, named and dated in the run-log entry | **named human** |

## What it can verify

- The DOL prevailing wage, Levels 1–4, for 15-1252 in each of the 20 target wage areas, traced
  by SHA-256 to the hand-downloaded source (`data/oflc/oflc-extract-audit.md`).
- Which wage area each of the 41 target cities and 44 counties falls in, and which three cities
  span two areas.
- Whether a posted salary range clears, fails or straddles the floors for its experience band —
  including hourly pay, a minimum exactly at the floor, and a range with only one end posted.
- Whether a posting's start month (when known) is before the earliest start.
- Whether a posting's text contains "without sponsorship"-style wording or a clearance /
  citizenship requirement — with the matched words shown.
- Whether the posting URL is live today (`ats:liveness`).
- Whether a company appears in the 80 Days CSV with H-1B approvals, and how many.

## What it cannot verify

- **Which level the employer will actually file.** The band rule is the job seeker's choice;
  DOL leaves the level to the employer. Hence UNCERTAIN rather than a guess.
- **Whether you meet the experience requirement.** A 7+ year role is evaluated as if you
  qualify; the real run's two survivors both asked for more experience than three years.
- **Whether foreign experience counts** toward the employer's level or the posting's requirement.
- **When you can legally start.** The earliest start is a setting; it does not know your OPT
  approval date.
- **Start dates the posting never states** — all five real postings were silent.
- **Postings with no office location** ("United States" only).
- **The hourly-to-annual conversion** (×2,080) is a convention, not read from DOL data.
- **What `GeoLvl` means** in the DOL file (all 20 target areas are `1`).
- **Wage years after June 30, 2027** — the table changes every July 1.
- **Role-level sponsorship.** 80 Days counts are company-wide, with no year and no job code;
  `median_salary_offered` has no documented year or definition and is not used.
- **Paraphrased disqualifiers.** The text check is pattern matching; it can miss a reworded
  refusal or misfire, so every flag shows its snippet for a person.

## Proposed additions

Each is labeled proposed; nothing behind it has run.

1. [TODO: DEV] **Experience-vs-candidate check** — compare `years_required` against the
   candidate's years and flag postings that ask for more. Belongs because the real run's only
   survivors asked for 5+ and 7+ years against three.
2. [TODO: DEV] **80 Days sponsorship lookup script** — replace the ad-hoc read in step 3 with a
   script that matches company names reproducibly, reports ambiguous matches, and never reads
   the phone/officer/director columns.
3. [TODO: DEV] **Converters for Lever, Ashby and Workday** — so the mode is not limited to
   Greenhouse boards; same output schema and labels.
4. [TODO: DATA SOURCE] **OFLC documentation confirming the ×2,080 annualization** — file path
   plus provenance note in `data/oflc/README.md`.
5. [TODO: DATA SOURCE] **Definition of `GeoLvl`** from the OFLC technical release notes for the
   July 2026 wage year (the PDF was not readable in this environment).
6. [TODO: DATA SOURCE] **DOL LCA disclosure data** — the wage levels each employer has actually
   filed at for 15-1252, which would turn many UNCERTAIN results into evidence.
7. [TODO: DEFINE] **Earliest start month** — the job seeker's real earliest legal start
   (program end + expected EAD start), replacing the 2027-06 scenario value, with one sentence
   of reasoning.
8. [TODO: APPROVE] **Gate-decision record for a live run** — a named human clears G1–G7 on a
   live run and logs it; required for RUNNABLE-LIVE.

## Output contract

**Agent output** — `<out-dir>/wage-gate-log.json` (for machines): `generated_at`, `script`,
`input`, `earliest_start`, `soc`, `wage_year`, `hours_per_year`, `labels`, `data_files`
(path + SHA-256), `counts` by outcome, and per posting `id`, `company`, `title`, `url`,
`inputs`, `posting_labels`, `text_flags` (flag, match, snippet), `area`, `area_name`, `floors`
(L1–L4 hourly + annual), `band`, `compared`, `outcome`, `reason`.

**Human report** — `<out-dir>/wage-gate-report.md` (for the job seeker). Reader: the job seeker
deciding where to spend applications this week. Decision enabled: drop, investigate, or apply.
Sections: executive summary, run record (inputs, data fingerprints), counts, one row per
posting, text flags with snippets, what this cannot verify.

For real postings both live under `private/real-postings/<date>/`; only anonymized excerpts
reach tracked files.

## Stop conditions

The mode refuses to produce a wage verdict, rather than guess, when:

| Reason | Why guessing is worse |
|---|---|
| `missing-gate-value:timeline` | treating a missing start as open recommends jobs you cannot start (the mutation test showed this exact failure) |
| `unknown-location` | a wrong area can move the floor by tens of thousands of dollars |
| `split-needs-worksite` | Raleigh, Durham and Huntsville straddle two areas; picking one is a coin flip |
| `missing-salary` | no salary, no comparison |
| `missing-experience` | no band, no level |
| `soc-not-extracted` | another job code has a different floor |
| `acwia-table-not-extracted` | university employers use a different, lower table |
| exit 2 (malformed input, missing data file) | conformance failure — halts the run, never a polite report |

## Run-log template

```markdown
### <YYYY-MM-DD> — chethangowda-git-h1b-wage-floor-sde v0.1.0
- Inputs: <n> postings (<boards>), anonymized as <A–?>; earliest start <YYYY-MM> (<record|your-input>)
- Commands: ats:liveness · greenhouse-to-gate-input.py · wage-timeline-gate.py (verbatim in the worked run)
- Outputs: private/real-postings/<date>/ (log, report, terminal captures) — not committed
- Result: liveness <a active / e expired / u uncertain>; gate PASS <n> · UNCERTAIN <n> · FAIL <n> · SKIP <n> · STOP <n>
- Human gate G7: <cleared by NAME on DATE | not cleared>
- Open issues: <list>
```

## Provenance

| What | Where |
|---|---|
| Data layer | commit `feb8739`; San Mateo + county map in `15377a8`, `40b2042` |
| Gate, fixtures, test | commits `15377a8`, `40b2042`; `python3 -I scripts/oflc/wage-timeline-gate.test.py` → 36/36 |
| Real-run evidence | `private/real-postings/2026-10-21/` (local only), excerpted in `assignments/submissions/chethangowda-git/WORKED-RUN.md` |
