---
status: DRAFT          # four typed TODOs below are open, so SPECIFIED is not reached; it has run end to end
todos_open: 4
last_gate: null
attestation: null
recipe_version: 0.2.0
---

# swe-ai-devops-skill-gap — Which skills do H-1B sponsors ask for, by role family, and which can the student prove?

## Executive summary

This mode is for an international master's student on F-1 OPT who applies to software engineer,
AI engineer and DevOps/SRE roles and will need H-1B sponsorship. The tracked run uses the course's
**fictional** persona Aarav Patel (`search/examples/aarav-patel/`): MS Information Systems, finished
May 2026, on STEM OPT since 1 July 2026 (OPT ends 30 June 2029), 0 of the 150 allowed unemployment
days used. So if he is between jobs from today, his job must start by 20 March 2027. Real students
use their own dates and profile, kept in `private/`. The mode reads real job postings from companies
that have sponsored H-1B visas for those titles, counts which skills the postings mention in each
family, and marks which skills the student can already prove. It decides nothing for the student.
It shows which skills every family asks for, where one company is driving a count, and how much of
the demand comes from senior roles. On postings fetched 2026-10-19 (573 US postings from 16
companies) it ran end to end, but it stays a draft because four proposed additions are still open.

Two customers: this file is for the agent; `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-skill-gap.card.md`
is for the person.

**Handoff condition (done when):** `run.sh` has printed how many companies were kept, how many
postings were fetched and excluded (by reason, duplicates included), each family's skill-demand
status, the timeline-gate deadline and which rule set it, and the comparison status; and
`run/skill-gap.json` and `run/skill-gap.md` exist and agree with those counts. "Looks right" is not
the condition.

## Purpose — when to use it

Use it when deciding what to learn or build next during the job search: before choosing a side
project for the credibility hours of the 3-3-2 day, or before deciding which of the three role
families to weight applications toward. Do not use it to decide whether to apply to one specific
posting; that needs the posting itself and a liveness check (G4).

**Why three families, not one SOC code:** the student applies across all three (SOC 15-1252 software
developers, 15-1244 systems administrators for DevOps/SRE, 15-1299 for AI engineer titles; the
persona targets backend/platform first and DevOps/SRE second). The
decision this mode supports is *which family to lean toward*, which needs the families side by
side. Each family is counted and gated separately; none is averaged into another.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout; the 80 Days data and the ATS scrapers.
3. `recipes/skill-demand-monitor.md` and its card — the monitor this mode reuses, and its failure modes.
4. This recipe, its card, and `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/README.md`.

## Source inventory

| Source | Path or command | Supplies | Label |
|---|---|---|---|
| H-1B sponsorship (company level) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` | record |
| Live job postings | `scripts/ats/fetch-real-postings.py --greenhouse … --lever … -o private/…` (Greenhouse and Lever public board APIs) | title, location, description, URL per posting, as of the fetch date | record |
| Skill counting | `npm run skill-demand -- <postings> --taxonomy … --profile … --min-sample 20 --out-dir …` (`scripts/score/skill-demand-monitor.mjs`) | per-skill posting counts with the job ids behind each count | script-output |
| Posting liveness | `npm run ats:liveness -- <urls>` (`scripts/ats/check-liveness.mjs`) | active / expired / uncertain per posting, on the check date | record |
| Skill list | `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/taxonomy/swe-ai-devops-skills.json` | 68 skills with match patterns | your-input |
| Student's evidence | `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json` (`PROFILE=` to change) | 14 skills from the fictional persona's résumé skills section | your-input (fictional) |
| Visa dates | `EAD_START=2026-07-01`, `OPT_END_DATE=2029-06-30`, `UNEMPLOYMENT_DAYS_USED=0`, `UNEMPLOYMENT_LIMIT=150` in `run.sh`, from `search/examples/aarav-patel/profile.yml` | the deadline for the timeline gate | your-input (fictional) |
| Unemployment limit | 8 CFR 214.2(f)(10)(ii)(E) | at most 90 days of unemployment on post-completion OPT, 150 with the STEM extension | record |
| Family, US and seniority rules | `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/families.py` | title → family; location → US or not; title → senior or not | your-input rules, model-judgment per posting |
| This mode's pipeline | `bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh` | all of the above, in order | — |

The Cognitive Pivot layer (BLS skill levels in `data/bls/compact/soc_occupation_compact.csv`) is not
used: its O*NET skill levels (e.g. `skill_programming_lv`) are occupation averages, not tools, so they
cannot say whether Kubernetes or PyTorch matters for SOC 15-1252, 15-1244 or 15-1299.

## Proposed additions

- **A DevOps- and software-aware skill list** — built: `taxonomy/swe-ai-devops-skills.json`. The
  repo's only taxonomy is scoped to AI engineering and has no Linux, Ansible, Helm, Prometheus,
  Grafana, GitHub Actions or Java, so DevOps and general software postings would look empty.
- **Greenhouse descriptions** — built, as this contribution's one declared patch to a maintained
  file (`scripts/ats/scrapers/greenhouse/scraper.py`, `?content=true` plus text extraction).
  Without it every Greenhouse posting has an empty description.
- **One job counted once** — built: `split_families.py` drops a posting whose company and
  description repeat an earlier kept posting word for word (28 in the 2026-10-19 fetch).
- **A visa deadline from real dates** — built: `compare_families.py` counts down to the earlier of
  the OPT end date and the day the 90 unemployment days run out, and records which one binds.
- **Fix the monitor's default taxonomy path** [TODO: DEV — `scripts/score/skill-demand-monitor.mjs`
  builds `DEFAULT_TAXONOMY` from `new URL(import.meta.url).pathname`, which keeps `%20` for spaces, so
  it fails in any checkout whose path has a space. Fix with `fileURLToPath`. Not done here because a
  PR may patch only one maintained file; this mode passes `--taxonomy` explicitly instead.]
- **Postings from sponsors without a Greenhouse or Lever board** [TODO: DATA SOURCE — 22 of the top
  40 sponsors in the 2026-10-19 fetch returned no board, including Microsoft, Intel, Uber and
  Snowflake. `scripts/ats/scrapers/workday/` exists but needs a browser; wiring it in, and recording
  which sponsors it covers, is open.]
- **Liveness as a step of the pipeline** [TODO: DEV — on 2026-10-21 the liveness checker was run by
  hand on the 5 non-senior DevOps postings (`liveness/liveness-check.txt`). `run.sh` does not run
  it, and nothing marks a report as stale. A step that checks the postings behind a chosen gap and
  writes the check date into the report is open.]
- **Seniority in the ranking** [TODO: DEFINE — the report now shows each family's non-senior count
  (DevOps: 5 of 30), but every skill share is over all levels, and the title rule behind the count
  is too generous: of the 5 "non-senior" DevOps postings, Stripe asks for 8+ years and MongoDB for
  3+. Open decision: which rule defines entry-level (title, stated years of experience, or both),
  and whether to rank on entry-level postings only. That would stop DevOps at G3 today (2–3
  postings, below 20).]

## Phase gates

Each gate is a hard stop with a testable condition against paths that exist.

| Gate | Type | Test | Pass | Fail |
|---|---|---|---|---|
| G1 — source CSV | prerequisite | `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | select sponsors | `select_sponsors.py` exits 2; nothing fetched |
| G2 — postings with text | prerequisite | `split_families.py` finds the postings file and keeps postings with descriptions | split into families | exit 2 if the file is missing; an empty family is stopped by G3 |
| G3 — sample size, per family | hard stop | the monitor's own gate: at least 20 postings in the family (`--min-sample 20`) | that family is ranked | status `insufficient_sample`: the family is left out of the comparison and the report says why; no ranking is guessed |
| G4 — liveness (GATE, not a vote) | human, **not enforced by code** | before applying to any posting found through this report, a person runs `npm run ats:liveness -- <url>`; `uncertain` needs the person to open the page and record a decision in `liveness/gate-decisions.csv` | `active`, or a recorded human decision: apply | `expired`: don't apply. The report prints its fetch date so a reader can see how old it is |
| G5 — visa timeline (GATE, not a vote) | hard stop | deadline = earlier of the OPT end date (given, or EAD start + 12 months) and max(today, EAD start) + (90 − unemployment days used); days left = deadline − today, against `--learn-days 90` | `open`: gaps are listed as things to learn | deadline passed: status `stopped`, exit 3, no comparison. Fewer than 90 days left: gaps are listed but marked "not learning priorities now; apply with the skills you already have evidence for". No date given: exit 2, never a guessed date |
| G6 — something to compare | hard stop | at least two families ranked | comparison written | status `stopped`, exit 3: "fewer than two families had enough postings" |

## What it can verify

- A company in the 80 Days CSV has H-1B approvals and sponsored a title that matches a software, AI
  or DevOps rule (record, then model-judgment for the title rule).
- A posting was on that company's public board on the fetch date, with this title, location and
  description (record).
- How many postings in a family mention each skill in the list, and exactly which postings (by job id
  and URL) back each count (script-output from the repo's monitor).
- How many different companies those mentions come from, and the largest single company's share.
- Whether a skill is in the student's evidence profile (your-input; for the persona, its résumé).
- Whether a checked posting was still live on the check date (record, from the liveness checker).

## What it cannot verify

- **Whether a skill is required.** Postings list more than a role needs on day one; a 63% mention
  rate is not a 63% hiring requirement.
- **Whether the demand fits the student's level.** Most postings are senior (25 of 30 in DevOps).
  The report shows the non-senior count, but the shares mix all levels, and the title rule misses
  levels: "Site Reliability Engineer 3" passes it but asks for 3+ years.
- **Skills not in the list.** A tool the taxonomy does not name is invisible. OpenTelemetry was
  invisible in v0.1.0 of the list and was added after the first run.
- **Most of the market.** Only sponsors with Greenhouse or Lever boards are fetched (17 of the top 40
  supplied postings on 2026-10-19), and only US postings are kept.
- **What a company mentions about itself.** A company's own product shows up as a "skill" in its own
  postings (MongoDB: 23% of DevOps postings, all 7 from MongoDB itself). The report flags any skill
  where one company supplies more than half the mentions, but cannot separate the two meanings.
- **Near-duplicates.** Only word-for-word repeats are dropped; the same job with an edited
  description still counts twice.
- **Whether this company will sponsor this student**, whether it is E-Verify enrolled (required
  for STEM OPT employers), or whether an unchecked posting is still open.
- **Which gap to learn first.** The report ranks mentions; choosing is the student's decision.
- **Evidence outside the profile.** Only skills listed in the profile count. The persona's résumé
  marks Terraform as "familiar with, not shipped", so it shows as a gap, as it should.

## Output contract

### Agent output (machine)

- `run/sponsors.json` — `{source_csv, counts, top_n_fetched, companies: [{company, industry, approvals,
  denials, approval_rate, sponsorship_source, sponsored_titles_by_family, family_source}]}`.
- `run/families-summary.json` — `{counts: {ingested, no_description, not_us, no_family_match,
  duplicate}, families: {<f>: {postings, non_senior_postings, companies, postings_by_company}}}`.
- `run/<f>/skill-demand.json` — the monitor's own output, unchanged.
- `run/skill-gap.json` — `{status, stop_reason?, config, timeline_gate {ead_start,
  unemployment_days_used, unemployment_limit_days, unemployment_deadline, opt_end_date,
  opt_end_source, deadline, binding, learn_days, days_remaining, status, source},
  non_senior_postings {<f>: n}, families {<f>: {status, candidate_count, skills: [{id, label,
  category, postings, share, companies, top_company, top_company_share, concentrated, have_evidence,
  source}]}}, comparison {ranked_families, core, leaning, gaps, evidence_coverage_top_k}}`.
- `liveness/liveness-check.txt` — the checker's output, unedited; `liveness/posting-urls.csv` — which
  postings were checked and why.

### Human report (Markdown)

`run/skill-gap.md`: an executive summary, the run record (fetch date, visa deadline and which rule
set it, gate status, postings and non-senior postings per family), a table of the top 25 skills by
share in each family with "in the profile?" and company concentration, the family-leaning skills, the
gaps per family, and what the report cannot tell. Reader: the student. Decision enabled: which one
or two skills to build evidence for in the credibility hours, and which family to weight
applications toward. One file cannot serve both readers (P5).

## Stop conditions

- The CSV or the postings file is missing: exit 2, no output written.
- No visa date given: exit 2. The gate never guesses a date.
- A family has fewer than 20 postings: that family is not ranked and not compared.
- Fewer than two families ranked: no comparison, status `stopped`, exit 3.
- The visa deadline has passed (OPT ended, or the 90 unemployment days are used up): no
  comparison, status `stopped`, exit 3.
- Never fill a missing count, a missing description, a missing family or a missing date with a guess.

## Next action per result (the 3-3-2 day)

- **A core skill with no evidence** (wanted in every family): the best candidate for the credibility
  "3": build one small public project that shows it.
- **A family-leaning gap** in the family where coverage is highest: the second candidate.
- **A skill flagged as one company's** (⚠): check that company's postings before treating it as a
  market signal.
- **Timeline gate says "apply with what you have"**: skip the learning list; spend the "2" on
  applications that match skills already proven, each one through G4 first.

## Run-log template

Use `recipes/_shared.md` for entries in `logs/runs/2026fa-iyashsaraf-<n>.md`. Record: date, recipe
version, taxonomy and profile versions, the fetch date, companies requested / with boards, postings
ingested and excluded by reason (duplicates included), each family's monitor status, size and
non-senior count, the comparison status and evidence coverage, the timeline-gate deadline, binding
rule and status, any liveness checks with their date and results, gate decisions by name, and open
issues. Never `logs/RUN_LOG.md`.

## Provenance

| Source | Verification command | Notes |
|---|---|---|
| 80 Days CSV | `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | 30,369 rows; 1,552 with H-1B approvals; 600 with a target title |
| Postings, fetched 2026-10-19 | `SKILL_GAP_DATE=2026-10-19 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh` | 4,745 postings from 17 companies, kept in `private/`; 573 kept after filters |
| Skill counts | `npm run skill-demand -- …` per family | `run/<f>/skill-demand.json` |
| Liveness, 2026-10-21 | `npm run ats:liveness -- <5 urls>` | `liveness/liveness-check.txt`: 4 active, 1 uncertain; the uncertain one opened and cleared as live by Yash Saraf (`liveness/gate-decisions.csv`) |
| This mode's code | `node scripts/conformance.mjs scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/` and `python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/test_skill_gap.py` | 19 offline tests |
