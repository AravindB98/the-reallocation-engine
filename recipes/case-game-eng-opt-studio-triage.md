---
status: RUNNABLE-SAMPLE
todos_open: 6
last_gate: "sample-run, 2026-10-17, logs/runs/2026fa-WeitingWang0704-1.md"
attestation: assignments/submissions/weiting/worked-run.md#attestation
recipe_version: 0.2.0
---

# Game-Engineering Studio Triage on an OPT Clock

## Executive summary

This mode builds a shortlist of game companies worth applying to, for a student who
has a limited number of applications left and cannot afford to spend them on
companies that have never hired a foreign worker.

Read it if you are finishing a game-development degree, you need an employer to
sponsor you, and you are trying to decide between a few dozen studios you found by
browsing job boards.

What it found when it ran: the company database this project is built on describes
30,369 companies, and **not one of its 24 industry labels is about games**. Game
studios are filed as "Other Technology" or simply "Other", so they cannot be looked
up — they have to be guessed at from company names and job titles. Guessing that way
produced 266 possible game companies, of which **13 have any record of sponsoring a
worker at all** and **4 have ever sponsored someone in a game-engineering job**. The
mode's honest conclusion is that this database can see venture-funded independent
studios and is structurally blind to the large studios most students actually apply
to, because those are subsidiaries of public companies and never file the funding
paperwork the database is built from. Knowing that before you spend fifty
applications is the point of running it.

## Purpose

Produce a sponsorship-aware, AI-substitution-aware shortlist of **game-industry
employers** from the engine's existing company and occupation data, and say exactly
which parts of it are facts and which are guesses.

Use it when all of these are true:

- you are an international master's student in game development or game programming
  (gameplay, engine, tools, technical art), on F-1 with an OPT clock running;
- you are choosing which studios to apply to, and the cost of a wasted application
  is measured in weeks of remaining work authorization, not in effort;
- you have already found studios by name (from job boards, GDC, credits, Discord) and
  need to know which of them have a sponsorship record before you write a cover letter.

Do **not** use it to decide anything about your immigration status, dates, or filing
strategy. It computes no immigration dates and gives no immigration advice.

## Why this mode needs to exist (the asymmetry, stated once)

A general job-seeker can filter a company list by industry. A game-programming
student cannot: the funding-filing taxonomy this engine inherits has no games
category, so the one filter that would make the dataset usable for this domain does
not exist. What replaces it — matching names and sponsored job titles — is a judgment
with a measurable false-positive rate, and the mode's job is to measure it rather
than hide it.

## Source Inventory

### Data

| Source | Path | What is taken from it | Verification command |
|---|---|---|---|
| 80 Days mapped company table (SEC Form D × DOL/H-1B) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `company_name`, `website`, `industry`, `top_job_titles_sponsored`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered`, `latest_funding_stage`, `latest_funding_amount`, `latest_funding_date` | `wc -l data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` → 30370 (1 header + 30,369 rows) |
| BLS/O*NET compact occupation extract | `data/bls/compact/soc_occupation_compact.csv` | `cognitive_pivot_score`, `annual_median_wage`, `employment`, `skill_programming_lv`, `skill_judgment_decision_making_lv`, `skill_systems_evaluation_lv`, `bls_soc_code` | `grep -E "15-1252.00\|15-1255.01\|27-1014.00\|15-1251.00" data/bls/compact/soc_occupation_compact.csv` |
| Join audits for the company table | `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md` | read before trusting any sponsorship count | `test -f data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md` |
| Term and SOC config (this mode's own, auditable) | `data/examples/game-studio-terms.json` | strong/ambiguous studio terms, role-family terms, target SOCs, funding-recency and sponsorship thresholds | `python3 -m json.tool data/examples/game-studio-terms.json > /dev/null` |

### Scripts and commands that exist today

| Command | Script | Role in this mode |
|---|---|---|
| `node scripts/score/game-studio-triage.mjs` | `scripts/score/game-studio-triage.mjs` | **new, added by this mode.** Identifies candidates, attaches sponsorship tier / funding recency / role-family match / role quality / salary gap. Combines nothing. |
| `npm run score` | `scripts/score/role-scorer.mjs` | the tested composite combiner: `(Σ vote·weight) × liveness × timeline`, threshold 0.30 |
| `npm run score:gates` | `scripts/score/gate-harness.mjs` | proves the gates still multiply rather than add; run it before trusting any composite |
| `npm run ats:liveness -- <url>` | `scripts/ats/check-liveness.mjs` | the liveness **gate**, per posting |
| `npm run ats:scan -- --dry-run` | `scripts/ats/scan.mjs` | finds postings on a studio's ATS board (needs `data/ats/portals.yml`, which is private) |
| `npm run verify` / `npm run doctor` | `scripts/conformance.mjs`, `scripts/doctor.mjs` | conformance and privacy gates; both must pass before anything is reported |

### Target occupations (checked against the BLS extract, 2026-10-17)

| O*NET code | Occupation | Cognitive pivot | Rescaled 0–1 | OEWS median | Note |
|---|---|---|---|---|---|
| `15-1252.00` | Software Developers | 3.834 | 0.6806 | $133,080 | where most gameplay/engine/tools titles are filed |
| `15-1255.01` | Video Game Designers | 3.792 | 0.6678 | $98,090 | **wage is the whole 15-1255 group's**, shared with Web and Digital Interface Designers |
| `27-1014.00` | Special Effects Artists and Animators | 3.389 | 0.5444 | $99,800 | where technical art lands when filed as art, not computing |
| `15-1251.00` | Computer Programmers | 3.627 | 0.6173 | $98,670 | downside comparator |

Rescaling is min–max over the 894 occupations that carry a `cognitive_pivot_score`
(min 1.611, max 4.877). The transform is printed in every run log so a reader can redo it.

## Proposed additions

Each of these is a gap the run actually hit, not a wish list.

1. **A game-industry employer list, to replace name matching.**
   `[TODO: DATA SOURCE]` Add a tracked list of US game employers (e.g. an industry
   association membership list or a games-company database export) under
   `data/game-industry/employers.csv` with `name`, `website`, `studio_type`,
   `source`, `retrieved_at`. *Why it belongs:* name matching produced 266 candidates
   of which roughly two thirds are not game companies at all (Peloton Interactive,
   Figma, a beef-jerky company called Sucker Punch Gourmet). An employer list turns
   the mode's weakest step — a judgment — into a join. Closed by: the file exists at
   the named path with a one-line provenance note.

2. **ATS board discovery, so the liveness gate can be evaluated at all.**
   `[TODO: DEV]` `scripts/ats/board-discovery.mjs <company-name> <website>` → `{ provider,
   board_url, confidence, source }`. *Why it belongs:* the triage layer returns
   *employers with sponsorship history*; the liveness gate needs *a posting URL*. With
   nothing bridging them, every candidate reaches the gate unevaluated, which is what
   happened on 2026-10-17. Closed by: script exists, conformance passes, and it
   resolves a board URL for at least one candidate in the shortlist.

3. **A role-quality weight in the composite scorer.**
   `[TODO: DEV]` Add `--weight role_quality=<n>` to `scripts/score/role-scorer.mjs`
   with explicit renormalization of the remaining weights. *Why it belongs:*
   `weights.role_quality` is `0.0` (DOMAIN.md gap 3), so the entire Cognitive Pivot
   layer contributes nothing — `npm run score:gates` reports this itself as
   `WARN P1-role-quality-inert`, and the run's own arithmetic prints `0.5444·0`. This
   mode computes a role-quality signal that is currently discarded. Closed by: the
   flag exists, the gate harness still passes, and the chosen weight is recorded with
   one sentence of reasoning.

4. **Sponsorship counted per SOC, not per company.**
   `[TODO: DATA SOURCE]` Add DOL LCA/PERM micro-records (employer × SOC × year ×
   wage) under `data/dol/lca/`. *Why it belongs:* the mapped CSV gives one approvals
   total per company plus a sample of titles. Roboto Games shows 4 approvals and a
   sponsored "Director of Product Management" — a company-level number that says
   nothing about whether it has ever sponsored an engineer. Closed by: the file exists
   with provenance, and the triage script reports approvals filtered to the target SOCs.

5. **A guard on the profile authorization field.**
   `[TODO: DEV]` Either validate `profile.authorization` against an enumerated set, or
   make the scorer print the derived `needs_sponsorship` verdict to stderr on every
   run. *Why it belongs:* `applyProfile()` matches the substring `authorized`, so a
   student who truthfully writes "F-1 OPT, authorized to work" has the sponsorship
   weight silently set to 0. Measured on 2026-10-17: Manticore Games went from
   composite 0.4845 **Apply** to 0.2167 **Consider** on that one word. Closed by:
   script exists, conformance passes, and the probe in the worked run no longer flips.

6. **A logged human confirmation of the studio identification.**
   `[TODO: APPROVE]` A named human opens each shortlisted company's website and
   records "makes games: yes/no" in `logs/gate-decisions/game-studio-triage-<date>.json`.
   *Why it belongs:* gate 2 below cannot clear any other way — no dataset in this repo
   states whether a company makes games. This is a gate, not a checkbox. Closed by: a
   logged gate decision naming the human and the date.

## Phase Gates

Gates are hard stops. Liveness and visa timeline are **gates, not votes** — they
multiply the composite, so either one at zero ends the row no matter how good the
sponsorship record is.

| # | Gate | Testable condition | Cleared by | Status 2026-10-17 |
|---|---|---|---|---|
| 1 | **Conformance** | `npm run verify && npm run doctor` both exit 0, and doctor reports "no private/PII paths are tracked" | machine, then read by a human | **PASS** |
| 2 | **Studio identification** (human) | for every shortlisted row, `logs/gate-decisions/game-studio-triage-<date>.json` records `makes_games: true\|false` against the company's own website | named human | **NOT CLEARED** — see TODO 6 |
| 3 | **Sponsorship evidence** | `Total Approvals` is present and ≥ `likely_min_approvals`; a blank field is `Unknown` and must not be read as "does not sponsor" | machine, human reads the tier | **PASS** — 13 of 266 candidates carry any value |
| 4 | **Role-family evidence** | at least one entry in `top_job_titles_sponsored` matches `role_family_terms`; otherwise the row is labeled "sponsored someone, not someone like me" | machine | **PASS** — 4 of 13 |
| 5 | **Liveness** (gate, per posting) | `npm run ats:liveness -- <url>` returns `active`. `uncertain` is **not** `active` and does not clear the gate | machine, human reads the reason | **NOT CLEARED** — the run returned `uncertain` for every URL (network policy blocked the board; `gateway answered 403 to CONNECT`) |
| 6 | **Visa timeline** (gate) | the student states a timeline factor in `[0,1]` as `your-input`; the mode never computes one | student, alone | supplied as an illustrative value only |
| 7 | **Report** | both artifacts exist for the run: `logs/game-studio-triage-<date>-<matcher>.json` and the Markdown report | machine | **PASS** |

A run that cannot clear gate 2 or gate 5 may still publish its report — it may not
publish a composite score. That is the distinction this mode is built around.

## What it can verify

- That the company table has **no games industry label**: 24 distinct labels across
  30,369 rows, none game-related. This is a counted fact about the dataset.
- Whether a named company **has a row at all** in the mapped table, and what its
  `Total Approvals`, `Total Denials`, `Approval_Rate` and `median_salary_offered`
  values are.
- The **titles the company actually sponsored**, as the dataset records them — the
  difference between "has sponsored" and "has sponsored someone in my role family".
- **Form D funding stage, amount and date**, and the arithmetic distance from that
  date to a stated as-of date.
- The published `cognitive_pivot_score` and OEWS median wage for the target
  occupations, and whether a wage is a **group average shared with other occupations**.
- The **gap between what a company paid a sponsored worker and the published
  occupation median** — e.g. That's No Moon's $71,000 is 53.4% of the Software
  Developers median.
- That the matcher's word boundaries matter: substring matching raises ambiguous-term
  matches from 40 to 5,572 because `engine` is inside `Engineer`.

## What it cannot verify

- **That any shortlisted company makes games.** No dataset here says so. Gate 2 exists
  because the identification step is a human judgment.
- **Whether a company is hiring now, or at all.** Every sponsorship value is a
  historical filing. Manticore Games' most recent funding event is 67 months before
  the as-of date; the mode cannot tell you whether the studio still employs anyone.
- **Whether a posting is live**, in this environment. The liveness tool runs and
  classifies, but the network path to the job boards was blocked, so every verdict was
  `uncertain`. The gate correctly stayed shut.
- **The large studios most students apply to.** Absurd Ventures, Insomniac, Naughty
  Dog, Bungie, Blizzard, Epic Games, Respawn and Zynga have **no row** in the mapped
  table (checked 2026-10-17; the apparent hits are Epic Battery, Riot Auto, Sucker
  Punch Gourmet, Unity Biotechnology and similar). The table is built from Form D
  filers, so studios owned by public parents are structurally invisible. The mode can
  never say anything about them, and must not be read as saying they do not sponsor.
- **What a game studio pays for a specific role.** `15-1255.01 Video Game Designers`
  carries no wage of its own — OEWS publishes wages at the `15-1255` group level, so
  that $98,090 is games and web/UI design averaged together.
- **Whether the role resists AI substitution.** `cognitive_pivot_score` is an index
  built from O*NET ability and skill levels for an occupation; it is not a measurement
  of any employer's actual work, and the composite scorer discards it entirely at
  weight 0.0.
- **Anything about immigration timing, eligibility or strategy.** Out of scope by
  construction; the timeline gate is the student's own number.

## Steps

| # | Step | Labor | Command | Output |
|---|---|---|---|---|
| 1 | Conformance and privacy | AI, human reads | `npm run verify && npm run doctor` | console; gate 1 |
| 2 | Prove the gates still multiply | AI | `npm run score:gates` | `output/gate-harness/` |
| 3 | Triage candidates | AI | `node scripts/score/game-studio-triage.mjs --asof <date> --require-role-family` | agent JSON + human report |
| 4 | **Confirm each company makes games** | **human — gate 2** | open each `website` | `logs/gate-decisions/` |
| 5 | Find postings on each confirmed studio's board | AI | `npm run ats:scan -- --dry-run` | `data/ats/` (private) |
| 6 | **Liveness per posting** | **AI, gate 5** | `npm run ats:liveness -- <url>` | `active` / `expired` / `uncertain` |
| 7 | **State your own timeline factor** | **human — gate 6** | — | a number in `[0,1]`, labeled `your-input` |
| 8 | Emit roles, refusing any role whose liveness is unevaluated | AI | `… --emit-roles roles.json --liveness liveness.json` | `roles.json` or exit 3 |
| 9 | Combine | AI | `npm run score -- roles.json --profile profile.json` | `role-scores.json` + report |
| 10 | Log the run | AI, human reads | write `logs/runs/<term>-<handle>-<n>.md` | log entry |

Step 8 refuses on purpose. `role-scorer.mjs` reads a missing liveness gate as
`?? 1` — an unchecked posting scores as a live one. This mode will not hand it an
unchecked role.

## Output Contract

Two artifacts, two readers (P5). Neither one serves both.

### Agent log

`logs/game-studio-triage-<asof>-<matcher>.json`

Fields: `_script`, `_recipe`, `_emits`, `run_id`, `generated_at`, `asof`, `mode`,
`params{min_approvals, require_role_family, matcher, terms_version}`,
`provenance[{path, bytes, mtime}]`,
`counts{companies_scanned, industry_labels_in_dataset, game_industry_labels_available,
strong_term_matches, ambiguous_only_matches, candidates_with_h1b_record,
candidates_with_role_family_match, kept_after_filters}`,
`role_quality_scale{field, occupations_with_score, min, max, transform, source}`,
`target_socs[…, cognitive_pivot_score, role_quality_index, annual_median_wage,
wage_is_soc_aggregate, wage_shared_with]`,
`candidates[{role_id, company_name, website, location, industry_label_in_dataset,
identified_by{strong_terms, ambiguous_terms, source}, sponsorship{approvals, denials,
approval_rate, tier, p, source, note}, role_family{matched, terms,
sponsored_titles_raw, note}, funding{latest_stage, latest_amount, latest_date, months,
tier, source}, salary{median_offered_to_sponsored, gap_vs_target_socs[]},
gates_not_evaluated_here[]}]`, `stop_conditions_hit[]`.

Every evidence value carries a `source` of `record`, `derived` or `student-judgment`.

### Human report

`logs/game-studio-triage-<asof>.md` (or `--md <path>`)

Reader: the student, and anyone advising them who has never seen this repository.
Decision enabled: which studios to confirm by hand, and which to drop before writing
a cover letter.

Sections, in order: executive summary in plain language (P9) · run record · provenance
table · shortlist table (company, location, sponsorship tier with raw counts,
sponsored titles verbatim, role-family match, last funding with recency, offered
median) · the industry label each candidate actually carries · role quality for the
target occupations with the group-average flag · offered salary vs published
occupation median · **what a person still has to do**.

The report contains no composite and no Apply/Consider/Skip verdict. Those come from
`npm run score`, after the gates.

## Stop Conditions

The mode refuses rather than guesses when:

1. **No candidate clears the filters.** The empty shortlist is reported as the result.
   Loosening the filters to fill a page is the failure, not the empty page.
2. **A target SOC is absent from the BLS extract.** Recorded in
   `stop_conditions_hit`; no substitute occupation is chosen.
3. **Liveness is unevaluated for a role.** `--emit-roles` exits 3 and writes nothing
   rather than let the scorer default the gate to open.
4. **Sponsorship is blank.** The row is `Unknown` and never scored as a non-sponsor.
5. **A company is absent from the mapped table.** No sponsorship field is emitted at
   all — absence of a record is not a record of absence.
6. **Gate 2 has not been cleared by a named human.** The report may ship; a composite
   may not.
7. **The question is about immigration timing or eligibility.** Out of scope; refer
   the student to their DSO or an attorney.

## Log template for `logs/runs/<term>-<handle>-<n>.md`

`CONTRIBUTING.md` reserves `logs/RUN_LOG.md` for maintainers and routes student run
entries here; the contrib gate fails a PR that touches the shared log. This run's entry
is `logs/runs/2026fa-WeitingWang0704-1.md`.

```markdown
### <YYYY-MM-DD> — case-game-eng-opt-studio-triage v<recipe_version> (<mode>)

- **Ran:** <commands, verbatim>
- **Inputs:** <dataset paths + row counts>; terms config v<version>; asof <date>;
  filters <min-approvals N, role-family y/n>
- **Outputs:** `logs/game-studio-triage-<date>-<matcher>.json`,
  `logs/game-studio-triage-<date>.md`<, roles.json / role-scores.json if emitted>
- **Result:** <scanned> scanned → <strong> candidates → <with record> with a
  sponsorship record → <role family> in my role family → <kept> kept.
  Composite: <Apply/Consider/Skip counts, or "not produced — gate N not cleared">
- **Gates:** 1 <pass/fail> · 2 <cleared by whom, or NOT CLEARED> · 3 … · 5 <liveness
  verdict> · 6 <timeline source> · 7 <pass/fail>
- **Verified vs inferred:** <one line each>
- **Open issues:** <typed TODOs still open; defects found upstream>
- **Privacy:** `npm run doctor` → no private/PII paths tracked. `data/ats/` not committed.
```

## Provenance

| Claim in this file | How to re-check it |
|---|---|
| 30,369 companies, 24 industry labels, 0 game-related | `node scripts/score/game-studio-triage.mjs --asof 2026-10-17` (first console line) |
| 266 candidates → 13 with a sponsorship record → 4 in the role family | same command |
| substring matching raises ambiguous matches 40 → 5,572 | add `--naive-substring` |
| `15-1255.01` shares its wage with `15-1255.00` | `wage_is_soc_aggregate` in the run log; `grep "15-1255" data/bls/compact/soc_occupation_compact.csv` |
| role_quality contributes nothing | `npm run score:gates` → `WARN P1-role-quality-inert` |
| profile wording flips Manticore Apply → Consider | the two probe runs in `assignments/submissions/weiting/worked-run.md` |
| no row for Insomniac / Bungie / Blizzard / Epic Games / Naughty Dog | `grep -i -E "insomniac\|bungie\|blizzard" data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |

## Privacy

This mode reads only tracked, non-personal data. It writes no personal data. The
`data/ats/portals.yml` needed for step 5 is private by default and stays gitignored;
`npm run doctor` enforces it. The résumé and application tracker are never read by
this mode at all — it operates on the employer side only.
