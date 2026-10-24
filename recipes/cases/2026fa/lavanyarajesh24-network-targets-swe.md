---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "live-run, 2026-10-21, logs/runs/2026fa-lavanyarajesh24-2.md"
attestation: null
recipe_version: 0.2.0
---

# network-targets-swe — sponsor-history employers to apply to, or to network into first

## Executive summary

This recipe is for an international master's student in software engineering who is still
in school. They will need H-1B sponsorship and cannot legally start work for several
months.

It starts from employers in the student's target states that have had H-1B approvals for
software job titles. It finds each employer's public job board and checks that the board
really belongs to that employer. It then opens every matching posting in a real browser,
and sorts the employers into:
- **apply now**: a matching posting is live and the engine's scorer agrees;
- **network first**: a confirmed software sponsor, but no live opening that fits right
  now;
- **check the job board first**: the board or the posting could not be confirmed, so
  nothing is decided;
- **skip**.

Two public records sit beside every company:
- **U.S. Department of Labor wage filings (LCAs)** coded to software developers. These say
  whether the employer files for software developers at all this fiscal year, and how
  many of those filings were at entry-level wages.
- **E-Verify enrollment.** A STEM OPT extension requires it.

The recipe stops before any outreach or application. A person reads the report and
decides.

**What changed since v0.1.0, and what the run found:**
- The three open TODOs are closed:
  - SOC-coded DOL data;
  - E-Verify;
  - automatic board lookup with an identity check.
- The real browser liveness gate ran.
- In the final run on 2026-10-21, of 15 matching postings, 9 were live, 1 was still listed
  but dead, and 5 could not be read. The day before, another posting closed while the
  session was running.
- Two employers with strong 80 Days counts filed **no** software-developer wage filings
  anywhere in FY2026, so their "software sponsor" label was not confirmed.

Two customers: this file is for the agent; the card
(`recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.card.md`) is for the person.

**Handoff condition (done when):**
- every network step has a saved, timestamped output;
- the final run exits `0`;
- every company appears in exactly one bucket;
- no company whose board or posting was unconfirmed appears in `roles.json`;
- `node --test` over both test files prints `# pass 17` and `# fail 0`;
- a named person has signed H1 and the board-confirmation gate in the run log.

"The lists look reasonable" is not the condition.

## Purpose

Information asymmetry addressed. From outside, a student cannot easily see:
- which employers sponsor **software developers** specifically, recently, and at entry
  level, as opposed to having sponsored *someone* with "software" in a title at some
  point;
- whether each one has a suitable opening **today**, as opposed to a posting that is
  still listed after the job closed;
- whether an employer could carry them through a **STEM OPT extension** (E-Verify).

A student who is not yet on OPT also gets misleading advice to "apply everywhere", when
most live postings will be filled before they can start. This recipe turns the engine's
liveness-gated skips into a networking list for the 3 networking hours of a 3-3-2 day.

Engine layers:
- **80 Days to Stay**: sponsorship counts and funding columns;
- **Job-Ops**:
  - ATS board detection (`scripts/ats/detect-ats.py`);
  - the board providers;
  - the Playwright liveness check (`scripts/ats/liveness-browser.mjs`, the logic behind
    `npm run ats:liveness`);
- **The Cognitive Pivot**: the BLS 15-1252 wage, as context only.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, lifecycle, TODO closure table.
2. `DOMAIN.md`: layout and known gaps.
3. `scripts/score/role-scorer.mjs`: the combiner this recipe feeds. It is not copied or
   modified.
4. This recipe and its card.

## Source inventory

| Source | Exact path | Label | Used for |
|---|---|---|---|
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_*`, `median_salary_offered`, `city`, `state`. Phone, executive and board columns are **never read into outputs**. |
| DOL LCA extract | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/data/lca-15-1252.csv` + `.provenance.json` | record | Certified H-1B LCAs, SOC 15-1252: nationwide, in MA/NY, by wage level, received-date range. Source `LCA_Disclosure_Data_FY2026_Q3.xlsx` (sha256 in provenance), received 2025-09-24 … 2026-06-23 |
| E-Verify lookups | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/everify.csv` | record | USCIS E-Verify Employer Search result per company: query, open/terminated, latest open enrolment, who looked it up and when, who reviewed |
| Discovered boards | `.../inputs/boards.discovered.json` | record (detector) + your-input (`confirmed_by`) | Provider, slug, identity status per company |
| Board snapshot | `.../inputs/boards-snapshot.json` | record | Jobs listed per verified board at `fetched_at` |
| Browser liveness | `.../inputs/liveness.json` | record | active / expired / uncertain per posting URL, with code, reason, `checked_at` |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | record | Exact name-key join, reported as a count (samples only: 200 filings) |
| BLS compact | `data/bls/compact/soc_occupation_compact.csv` (row `15-1252`) | record | National median wage, context only |
| Persona | `.../inputs/persona.json` | your-input | States, OPT dates, hiring lag, filters, tier thresholds, `lca_cap` |
| ATS detector | `scripts/ats/detect-ats.py` | — | Company → Greenhouse/Lever slug, run as-is |
| Providers | `scripts/ats/providers/{greenhouse,lever,_http}.mjs` | — | Board fetches, run as-is |
| Liveness | `scripts/ats/liveness-browser.mjs` (`checkUrlLiveness`), `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) | — | Browser gate, run as-is |
| Scorer | `scripts/score/role-scorer.mjs` | — | Composite + Apply/Consider/Skip, run as a subprocess |

## Commands (all from the repo root)

```bash
D=scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe
R=course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live

node $D/discover-boards.mjs                                   # network: detect-ats.py + identity check
node $D/capture-boards.mjs                                    # network: verified boards only
node $D/network-targets.mjs --out-dir $R --liveness /dev/null/none   # offline: writes $R/posting-urls.txt
node $D/live-check.mjs --urls $R/posting-urls.txt             # network: Playwright gate → inputs/liveness.json
npm run ats:liveness -- --file $R/posting-urls.txt            # the engine's own gate, same logic, for cross-check
python3 $D/extract-lca.py ~/Downloads/LCA_Disclosure_Data_FY2026_Q3.xlsx   # offline, once per DOL release
node $D/network-targets.mjs --out-dir $R                      # offline: final run
node --test $D/network-targets.test.mjs $D/mode-build.test.mjs
node scripts/conformance.mjs $D/ recipes/cases/2026fa/
```

The E-Verify step has no command: the USCIS search tool has no export and no working
scripted query (see "What it cannot verify"). A person runs the search and fills
`inputs/everify.csv`.

## Workflow

1. **G0 input.** Load the persona and validate dates and filters.
2. **G2 timeline.** Compute the work window. Halt the whole run if it is closed.
3. **G1 data.** Load the CSV and check the required columns.
4. **Filter** (shared `selectCandidates` in `lib.mjs`). Keep rows that meet all three:
   - `state` is in the target states;
   - `Total Approvals > 0`;
   - `top_job_titles_sponsored` matches the persona pattern (`software`).
5. **Board discovery** (`discover-boards.mjs`):
   - run `detect-ats.py` on every candidate;
   - keep the old hand-entered slugs as a seed;
   - identity-check every hit (G4).
6. **Board capture** (`capture-boards.mjs`): fetch only boards that pass G4.
7. **Posting match**: whole-word title include/exclude and location include (your-input).
   Write every matching URL to `posting-urls.txt`.
8. **G3b browser liveness**: `live-check.mjs` opens each URL with headless Chromium. Each
   posting is then treated as follows:
   - **active** → liveness `1.0`;
   - **expired** → `0.0`;
   - **uncertain** → not sent.
9. **Sponsorship tier**, by a fixed rule over the 80 Days counts. The thresholds are
   your-input:

   | Tier | Rule | p |
   |---|---|---|
   | Proven | ≥ 10 approvals and ≥ 90 % approval rate | 0.9 |
   | Likely | ≥ 3 approvals | 0.6 |
   | Possible | ≥ 1 approval | 0.3 |

   Then the **LCA cap** (your-input, `persona.assumptions.lca_cap.max_tier = Possible`):
   - **When:** the DOL extract is loaded and the employer has **zero** certified 15-1252
     LCAs **anywhere in the US**.
   - **Effect:** the tier is capped at Possible, and `tier_capped_from` records the
     original tier.
   - **Why nationwide:** target-state-only counting wrongly capped employers whose software
     hires sit at remote worksites in other states (see the worked run).
10. **Annotate** each company:
    - LCA counts: US, MA/NY, Level I/II, last received;
    - E-Verify result, or `not-looked-up`;
    - funding recency;
    - Form D sample match.
11. **Build `roles.json`** in the shape of `data/examples/ch11-roles.json`:
    - only postings with an active or expired browser result;
    - a placeholder role with liveness `0.0` for a verified board with no match;
    - unconfirmed boards and postings are **not written**.
12. **Score**: `node scripts/score/role-scorer.mjs <roles.json> --out-dir <run dir>`, with
    **no** `--profile` (see the "cannot verify" table).
13. **Route**:

    | Condition | Bucket |
    |---|---|
    | Any role Apply/Consider | `apply` |
    | Every role is a gated Skip (`reason` starts with `gated: liveness`) **and** tier Proven/Likely after the cap | `network` (priority **A** if funding is recent, else **B**) |
    | Board identity unverified, board error, no snapshot, or every matching posting uncertain | `check-board` |
    | Otherwise | `skip` |
    | A name in `persona.target.named_companies` absent from the CSV | `not-in-dataset` |

14. **Write the two outputs**, then stop at H1.

## Phase gates

| Gate | Testable condition | Pass | Fail |
|---|---|---|---|
| G0 input | `inputs/persona.json` parses; `opt_start_date < opt_end_date`; `states` non-empty; `hiring_lag_days > 0` | continue | exit `2`, `G0 persona-invalid` |
| G1 data | CSV exists with all 11 required columns | continue | exit `2`, `G1 csv-missing` / `csv-columns-missing` |
| G2 timeline (**gate, not a vote**) | `work_window_end > today` **and** `factor > 0.05`, where `work_window_end = min(opt_end, max(opt_start, today) + unemployment days left)`, `earliest_start = max(today + hiring_lag, opt_start)` and `factor = min(1, (work_window_end − earliest_start) / hiring_lag)` | the factor goes to every role | exit `3`; log `status: "halted"`; no `roles.json` |
| G4 board identity (**gate**) | Greenhouse board's own display name has the same name key as the company (`identity.status = name-match`), **or** a person set `confirmed_by` (name, date) in `boards.discovered.json` | board is captured | not fetched; snapshot `status: "identity-unverified"` → `check-board`, reason `board-identity-unverified` |
| G3a board listing | Snapshot entry has `status: "ok"` and a `jobs` array | postings are matched | `check-board` (`no-snapshot` / `board-error` / `snapshot-unparseable`); **not sent to the scorer** |
| G3b posting liveness (**gate, not a vote**) | `liveness.json` exists, its `started_at` ≥ the snapshot's `captured_at`, and the posting URL has `active` or `expired` | factor `1.0` / `0.0` | `uncertain`, missing URL or stale file → posting not sent; if no posting of a company is sent → `check-board`, reason `posting-liveness-unverified` |
| H1 human release | A named person has read `network-targets-report.md` and recorded it in the run log | that person contacts or applies, outside this recipe | nothing happens; the recipe sends nothing |

**Why unconfirmed companies never reach the scorer.** `role-scorer.mjs` defaults a missing
`liveness.factor` to `1` (open). Sending an unconfirmed company would silently treat "we
did not look" as "the job is live".

**Why `uncertain` is not `expired`.** `liveness-browser.mjs` returns `uncertain` when the
page loads but shows no visible apply control. In this run that happened on every
MongoDB and Formlabs posting: their career sites wrap Greenhouse in their own pages. That
is a limitation of the checker, not evidence that the job closed.

## What it can verify

- The 80 Days row for each company, exactly as the mapping recorded it.
- That `detect-ats.py` found a Greenhouse or Lever board for a slug, and that a
  Greenhouse board's own display name does or does not match the company name key. For
  example, TALENT INC's detected board is named "Slice Talent Community" and is rejected.
- That a verified board listed a matching posting at `fetched_at`.
- That a headless browser saw that posting as active, expired (a redirect to
  `?error=true`, HTTP 404/410, or an expired-text pattern) or uncertain at `checked_at`.
- From the FY2026 Q1–Q3 DOL disclosure file: how many certified H-1B LCAs each employer
  filed for SOC 15-1252, nationwide and in MA/NY, at which wage levels, and the received
  dates. For this run: 118,845 such LCAs across 13,991 employers, 8,949 in MA/NY.
- What the E-Verify Employer Search showed for a name on the date in `everify.csv`.
- The BLS national median wage for SOC 15-1252: **$133,080**, OEWS 2024.
- The scorer's arithmetic per role, from its own trace in `role-scores.json`.

## What it cannot verify (the boundary)

| Can't verify | Why | What the recipe does instead |
|---|---|---|
| That a certified LCA became an H-1B **approval**, or a **new hire** | An LCA is a wage attestation filed before the petition; it also covers extensions and transfers; one LCA can cover several workers | Reports "certified LCAs", never "approvals" or "hires"; the 80 Days approvals stay a separate column |
| That a "software developer" LCA is a **backend new-grad** role | SOC 15-1252 covers all software developers at all levels | Shows Level I/II counts as entry-level *evidence*, not proof |
| Employers whose LCA name differs from the 80 Days name | The join is exact on a name key; no fuzzy matching | Zero matches are capped *only* after a person can see the zero; the worked run checked the capped employers by hand against the full workbook |
| Sponsorship before FY2026 or after 2026-06-23 | One DOL release was extracted | Received-date range is printed in the run record; re-extract per release |
| That a listed and browser-active posting is **real hiring** | A page can stay up with an apply button after the role is filled | Liveness 1.0 means "the page showed an apply control at `checked_at`", nothing more |
| That a posting can **wait for a start months away** | Postings rarely say so; this persona cannot start before 2027-01-15 | H1 tells the person to check before applying |
| Postings behind a company's own career site | `liveness-browser.mjs` sees no apply control on MongoDB/Formlabs pages and returns `uncertain` | `check-board`; the person opens the page |
| Companies the detector cannot find (98 of 133) | `detect-ats.py` tries one slug per name, Greenhouse and Lever only; Ashby/Workday/own sites are not covered | `check-board`, reason `no-snapshot` |
| E-Verify for companies not looked up, or under a different enrolled name | The search tool has no export; its scripting API ignores the name filter, and its search box broke after the first query in automated use; employers enrol under legal names | A missing row is `not-looked-up`, never "not enrolled"; the person runs the search |
| Funding accuracy | The 80 Days funding columns contain visible mismatches | Funding only orders the network list (A/B); it is not a scorer term |
| Role quality in the decision | The scorer's `role_quality` weight is `0.0` (`[VERIFY]` in the scorer) | BLS wage shown as context only |
| Whether the profile needs sponsorship, via `--profile` | `applyProfile` treats any status containing "authorized" as not needing sponsorship | No `--profile` is passed; reported as an engine defect |

## Proposed additions (all closed in v0.2.0)

1. **Closed — was TODO (DATA SOURCE): SOC-coded H-1B (DOL LCA disclosure) data.**
   - **Evidence:** `.../data/lca-15-1252.csv` + `lca-15-1252.csv.provenance.json`.
   - **Origin:** U.S. DOL OFLC, `LCA_Disclosure_Data_FY2026_Q3.xlsx`, 251,850,891 bytes,
     downloaded by Lavanya Rajesh on 2026-10-20. The sha256 is in the provenance file.
   - **Path changed:** the original TODO named `data/dol/lca/`, but the contrib gate allows
     data only in the student's namespaces. The 252 MB workbook is not committed; the
     extract and its provenance are.
2. **Closed — was TODO (DATA SOURCE): E-Verify enrollment per employer.** Closed for every company
   in the apply and network buckets.
   - **Evidence:** `.../inputs/everify.csv`, one row per company with query, result,
     `looked_up_at`, `looked_up_by`, `reviewed_by`.
   - **Origin:** USCIS E-Verify Employer Search, 2026-10-20/21. Rows were looked up by Claude
     in the in-app browser, one query at a time, each with its own timestamp.
   - **Accepted by:** Lavanya Rajesh, 2026-10-21. She accepted the file; she did not
     re-check each row by hand, so `reviewed_by` stays empty.
   - **Not looked up:** companies in check-board and skip. They show `not-looked-up`.
3. **Closed — was TODO (DEV): company → ATS board lookup reusing `scripts/ats/detect-ats.py`.**
   **Closed.**
   - **Script:** `discover-boards.mjs` runs `detect-ats.py` as-is, identity-checks each hit
     and writes `boards.discovered.json`.
   - **Tests:** `mode-build.test.mjs` covers the wrong-slug case and the identity-unverified
     routing.
   - **Conformance:** passes.

Further ideas, not TODOs, because nothing in this recipe depends on them:
- an Ashby provider in `detect-ats.py`;
- a second, fuzzy LCA name match that is *reported but never used*;
- re-checking `uncertain` postings with a provider-specific apply-control selector.

## Output contract

Two files, two customers (P5), written to the run folder (default
`course/2026fa/submissions/lavanyarajesh24/runs/`; this run used `runs/mode-build-live/`).
The prototype refuses any other in-repo output path.

**Agent log: `network-targets-log.json`**

| Field | Contents |
|---|---|
| `status` | `ok` or `halted` |
| `halt` | gate, code, message (halted runs only) |
| `inputs` | every input path, including `liveness`, `everify`, `lca` |
| `timeline` | every term as `{value, source, from}` |
| `counts` | `csv_rows`, `candidates`, and one count per bucket |
| `lca` | `status`, `file`, `provenance` (source file, sha256, rows, date range), `matched`, `tiers_capped` |
| `everify` | `status`, `file`, `looked_up`, `open` |
| `liveness` | `mode` (`browser` / `api-listed-only` / `stale` / `unreadable`), `started_at`, `snapshot_captured_at`, per-result posting counts |
| `formd`, `bls` | as in v0.1.0 |
| `scorer` | `command`, `roles_sent`, `summary`, `not_sent`, `why_not_sent` |
| `buckets` | per company: sponsorship (with `tier_capped_from`), `lca`, `everify`, funding, liveness with per-posting `browser` result, route. Every value is labeled `record` / `your-input` / `model-judgment` |
| `cannot_verify` | the boundary list |

Beside the log: `posting-urls.txt`, `roles.json`, `role-scores.json`, `role-scores.md`.

**Human report: `network-targets-report.md`**

- Executive summary first: the four counts in plain words.
- Run record. Includes the DOL file and date range, the E-Verify coverage, and the browser
  gate mode and counts.
- One section per bucket, each with its next action. Apply and network rows show the SWE
  LCA counts and E-Verify.
- Wage context.
- "What this run could not check".
- The H1 instruction.

## Next action per result (the 3-3-2 connection)

| Bucket | Next action | 3-3-2 block |
|---|---|---|
| apply | Confirm the posting can start after OPT start and is entry level (titles like "Software Engineer III" are not), then tailor one application | the 2 apply hours |
| network | Find one person on the team for an informational interview; no application. Prefer employers with Level I/II LCAs and an open E-Verify account | the 3 networking hours |
| check-board | Open the careers page yourself; if it is a board, confirm it in `boards.discovered.json` (`confirmed_by`) and re-run | 5 minutes, then re-run |
| skip | Nothing this cycle. A capped employer with a live posting is still the person's call | — |
| not-in-dataset | No record ≠ never sponsors | — |

## Stop conditions

Stop and decide nothing when:
- G0, G1 or G2 fails;
- the board snapshot is unreadable (every company → `check-board`);
- the liveness file is older than the board snapshot (`stale`): re-run `live-check.mjs`
  instead of scoring on old browser results;
- asked to pass `--profile` to the scorer with free-text authorization;
- asked to send an unconfirmed board or an `uncertain` posting to the scorer, or to count
  a failed fetch as "no jobs";
- asked to treat a missing E-Verify row as "not enrolled", or a missing LCA match as "does
  not sponsor" without the cap's dated DOL file loaded;
- asked to set `confirmed_by` on a board the person has not opened;
- asked to edit `persona.json` filters or `lca_cap` after seeing a result, just to move a
  company you like into "apply". Changes are allowed only as dated revisions, with the
  before and after runs kept.

## Logging

- Write a run entry to `logs/runs/2026fa-lavanyarajesh24-<n>.md`. Never edit
  `logs/RUN_LOG.md` (contrib rule).
- `logs/gate-decisions/` does not exist. G4 confirmations and H1 are recorded in the run
  entry's "Gate decisions" line, with the person's name and date. G4 confirmations are
  also recorded in `boards.discovered.json` (`confirmed_by`).

### Run-log template (`logs/runs/2026fa-lavanyarajesh24-<n>.md`)

```markdown
## YYYY-MM-DD — network-targets-swe <sample|live> run <n>

- **Recipe:** recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.md v0.2.0
- **Inputs:** persona <path>; CSV <path>; boards <path> (captured <time>); liveness <path> (started <time>); LCA <path> (<source file>, sha256 <first 12>, received <from> … <to>); E-Verify <path> (<n> rows); --today <date>
- **Commands:** <exact commands, in order>
- **Outputs:** <run dir>/network-targets-log.json, network-targets-report.md, posting-urls.txt, roles.json, role-scores.{json,md}
- **Result:** candidates <n> → apply <n> · network <n> · check-board <n> · skip <n>; postings active <n> / expired <n> / uncertain <n>; LCA matched <n>, capped <n>; E-Verify <n> looked up (<n> open); scorer "<summary line>"
- **Gate decisions:** G0 · G1 · G2 factor <x> · G4 <n> name-match, <n> confirmed by <name> <date>, <n> rejected · G3b <mode> · H1 read by <name> on <date>
- **Open issues:** <what did not work / what is still missing>
```
