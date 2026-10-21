---
status: RUNNABLE-LIVE  # v0.1.1: 10 typed TODOs closed; sample-run gate 2026-10-19; live run with G1–G3 cleared by Hemanth Rayudu 2026-10-21. Log: logs/runs/2026fa-hemanthrayuduu-2.md
todos_open: 0
last_gate: "live (v0.1.1), 2026-10-21, Hemanth Rayudu, logs/runs/2026fa-hemanthrayuduu-2.md (G1–G3 cleared on the owner's own live run)"
attestation: null      # set only at VERIFIED, which this version does not claim
recipe_version: 0.1.1  # 0.1.1 (2026-10-19): fixes found by the first live run — see Lifecycle note
---

# AI / Data Engineer on F-1 OPT — weekly apply-queue refresh

## Executive summary

**What it does:** once a week, it re-checks a shortlist of job postings for an international student or graduate on F-1 OPT who targets AI, ML or Data Engineer roles and needs visa sponsorship. It answers one question: *which postings on my list are still worth my application time this week?*

**Why it exists:** a shortlist goes stale without showing it. The asymmetry:
- **Postings close or turn into ghosts while the page still loads.** The employer knows whether the opening is still being filled; the student sees a page.
- **Descriptions get quietly edited** ("unable to sponsor", more years required).
- **The OPT unemployment clock keeps running.** A role that fit the calendar when it was shortlisted may no longer fit.

None of this shows on the list itself.

**What it does each run:**
- Checks every posting two independent ways: the page itself and the company's job-board data. A posting counts as live only when both agree.
- Re-reads the description and pulls out the sentences that usually decide eligibility.
- Recomputes the clock from the person's own visa dates.
- Re-scores the list with the repository's existing scorer.
- Anything uncertain is held back for a human, never guessed.

**What it decides:** nothing final. It produces a report, a machine log and an audit. The person clears three gates before acting on any row: live links, the clock, and release.

**Done when:** the documented offline command exits 0 and writes the log, report and audit; it keeps every raw output with a hash; every scored posting carries an explicit value for both gates; and the person has read the audit.

## Required reads

`SNICKERDOODLE.md` (lifecycle, gates, logging) · `DOMAIN.md` (what runs today) · `AGENTS.md` · `CONTRIBUTING.md` (paths, one PR) · `DATA_CONTRACT.md` §Zero-Conditions (fictional personas only) · book chapters 8 (posting liveness), 10 (the visa timeline factor) and 11 (the Bayesian role scorer).

## Purpose

Re-check an existing shortlist of AI / ML / Data Engineer postings against the two things that change fastest for a sponsorship-dependent applicant: **whether the posting is still real**, and **whether the OPT clock still allows it**. Then re-score the list with the engine's own scorer.

**When to use it:**
- once a week while a shortlist is open;
- before spending application time on any shortlist older than a week;
- immediately after the unemployment-day count changes.

**When not to use it:** to *build* a shortlist (that's the upstream pipeline's job); for H-1B transfers or for people who don't need sponsorship (the run refuses both); or for any question of legal eligibility (send those to a DSO).

## Inputs

| Input | Contract | Default | Label |
|---|---|---|---|
| Queue | JSON `postings[]`, each with `company`, `title`, `url` (https), `board{ats: greenhouse, slug}`, `job_id`, `soc`, `sponsorship{p, tier, records}` | `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/queue.sample.json` | identity and records: record; tier and p: your-input |
| Persona | a folder with `profile.yml` (with `needs_sponsorship: true` stated explicitly, and a `visa` block: `type: F-1`, `ead_start_date`, `opt_end_date`, `unemployment_days_used`, `unemployment_ceiling`, `buffer_target`, `stem_eligible`) and `resume.example.json` | `search/examples/priya-nair/` (fictional) | your-input |
| Rules | `rules.json`: time-to-start, timeline formula, liveness policy, fit scale, report fields | `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/rules.json` | your-input |
| Liveness source | offline: a recorded snapshot folder; live: the page checker + the board API | `sample/snapshot-2026-10-19/` | record |

**The queue deliberately carries no fit and no timeline values.** Both belong to a particular person and are recomputed on every run.

## Source Inventory

| Source | Exact path or command | Label | Used for |
|---|---|---|---|
| 80 Days to Stay CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | re-reading each company's H-1B approvals, top sponsored titles and latest funding date, then cross-checking them against the queue |
| BLS / O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | record | role-quality context: occupation, job zone, median wage, `cognitive_pivot_score` |
| Page checker (Job-Ops) | `npm run ats:liveness -- --file <urls>` → `scripts/ats/check-liveness.mjs` | record | liveness check 1 (Playwright): active / expired / uncertain |
| Board API (Job-Ops) | greenhouse-watch `fetch_board` in `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py`, on `https://boards-api.greenhouse.io/v1/boards/<slug>/jobs/<id>` (allow-listed host, no redirects) | record | liveness check 2 (present / gone 404) and today's description |
| Fit matcher | greenhouse-watch `judge()` + `.claude/skills/greenhouse-watch/scheme.default.json` (scheme default-0.1) | record (string rules on two records) | the fit vote, with its justification lines |
| Engine scorer | `npm run score -- <roles.json> --out-dir <dir>` → `scripts/score/role-scorer.mjs` | record arithmetic | composite = (Σ vote·weight) × liveness × timeline → Apply / Consider / Skip |
| Scorer self-test | `npm run score:gates` → `scripts/score/gate-harness.mjs` | test | shows the scorer treats both gates as multipliers (run 2026-10-19: `RESULT: PASS`, evidence 04) |
| This mode's tool | `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py` | — | runs the steps in order and writes the outputs (see Output Contract) |
| Persona (fictional) | `search/examples/priya-nair/profile.yml`, `resume.example.json` | your-input | the clock inputs and the résumé for fit |
| Week-0 baseline | `course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/00-week0-liveness-2026-10-03.txt` | record | the 2026-10-03 page-check output for the same 8 URLs (8 active) |
| Conformance / privacy | `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs` | — | the machine half of P4, and the privacy contract |

**What checking the repo found** (each finding shaped the design):
- **A missing gate silently counts as 1.0** in `role-scorer.mjs` (`?? 1`). So this mode always passes both gates explicitly, and refuses any posting whose liveness isn't established.
- **`--profile` reads only an `authorization` text field**, and the word "authorized" switches sponsorship off. So this mode never passes `--profile`, and instead checks that the scorer reports `profile_needs_sponsorship: true`.
- **The role-quality weight is 0** (`[VERIFY]` in the scorer). Role quality is shown, never scored.
- **`check-liveness.mjs` exits 1 whenever any URL is expired or uncertain.** The tool parses its lines and doesn't treat exit 1 as a crash.
- **`npm run bls:local-wage` is listed in DOMAIN.md but can't run on `main`** (`data/bls/local-wage/` and `.venv` are missing). So local pay is in "cannot verify".
- **The repo has no timeline-factor implementation.** Chapter 10 gives the inputs and the 0–1 range, not a formula, so the formula is a human value choice (below).
- **The constitution says DEV items are closed "via scored prompt"**, but the repo defines no prompt-scoring scheme. The DEV item below is closed on the evidence the constitution does require.

## Proposed additions (typed TODOs, each closed with its evidence)

Ten typed TODOs, all closed; none is open, which matches `todos_open: 0`. Ideas for later versions are in the worked run's reflection, not here.

| # | Type | Addition | Why it belongs | Closure (date · by · evidence) |
|---|---|---|---|---|
| 1 | `[TODO: DEV]` **closed** | `refresh.py`: the two-way liveness gate, the clock gate, record-based fit, BLS context, the engine scorer, and the log / report / audit / raw outputs | No repo script re-checks a queue. Each part exists separately, but nothing joins them with explicit gates. | 2026-10-19 · Claude Code · the script exists at `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py`; 41 offline tests OK at v0.1.1 (evidence 11); 38 at v0.1.0 (evidence 08); conformance passes; done-when condition met (the documented offline command writes all outputs) |
| 2 | `[TODO: DATA SOURCE]` **closed** | `sample/queue.sample.json` | The offline run needs a committed, reproducible queue with no personal data | 2026-10-19 · Hemanth Rayudu (plan approval) · the file exists. Provenance: the Consider list of the swe-sponsor-pipeline live run of 2026-10-03 (commit 4baeaf6). Records re-read from the 80 Days CSV on `main` on 2026-10-19. |
| 3 | `[TODO: DATA SOURCE]` **closed** | `sample/snapshot-2026-10-19/` | The offline run needs real recorded outputs, so the documented command doesn't need the network | 2026-10-19 · Hemanth Rayudu (plan approval) · the folder exists, with `MANIFEST.json` and sha256 hashes. Provenance: recorded by `refresh.py --live --record` at 2026-10-19 01:57 EDT (evidence 02); emails and phone numbers redacted (0 found). |
| 4 | `[TODO: DATA SOURCE]` **closed** | the week-0 baseline (`evidence/00-…`) | A week-over-week comparison needs last week's state | 2026-10-19 · Hemanth Rayudu (plan approval) · the file exists. Provenance: a verbatim copy of the G1 page-check output for the same 8 URLs, 2026-10-03. |
| 5 | `[TODO: DEFINE]` **closed** | time-to-start = **42 days**; sensitivity shown at 35 / 42 / 70 | The clock needs a process length (Ch.10 input) | 2026-10-19 · Hemanth Rayudu · "the persona's notes say big-company loops take 6–10 weeks; 42 days is the short end, and the report shows 35 and 70 so the choice stays visible" (`rules.json`) |
| 6 | `[TODO: DEFINE]` **closed** | unemployment days are read **as of the run date** | `profile.yml` gives the count but no date | 2026-10-19 · Hemanth Rayudu · "the profile has no date for the count, so it is read as of the run date and labeled as an assumption" |
| 7 | `[TODO: DEFINE]` **closed** | timeline formula **buffer-linear**: 0 if the expected start is after the authorization end, or the ceiling is reached first; else min(1, days left at the start ÷ buffer target) | Ch.10 gives the inputs and range, not a formula | 2026-10-19 · Hemanth Rayudu · "0 when the calendar rules a role out; partial when the start eats the buffer; 1 when the buffer survives" |
| 8 | `[TODO: DEFINE]` **closed** | liveness policy: live = page active **and** API present (1.0); closed = page expired **and** API gone (0.0); anything else → **refuse, investigate** | The scorer would otherwise default a missing gate to 1.0 | 2026-10-19 · Hemanth Rayudu · "a posting is live only when two independent checks agree; disagreement goes to a human" |
| 9 | `[TODO: DEFINE]` **closed** | fit = greenhouse-watch score ÷ **13.0** (the default scheme's maximum) | The scorer needs fit in 0–1, without changing the shared scheme | 2026-10-19 · Hemanth Rayudu · "the scheme's own maximum keeps fit within 0–1 without editing the scheme" |
| 10 | `[TODO: REPORT FIELD]` **closed** | report columns `# · Company · Posting · Liveness · Timeline · Fit · Sponsorship · Score · Recommendation`; reader: the student who owns the queue; decision: which rows to release for applying this week (G3) | P5: the report is the human's tool, not a log | 2026-10-19 · Hemanth Rayudu · all three parts (columns, reader, decision) recorded in `rules.json` → `report_fields` |

## Phase gates

Liveness and the visa timeline are **gates** (multipliers in the scorer), never votes.

| Gate | Testable condition | Test | Pass | Fail |
|---|---|---|---|---|
| **G0 inputs** (machine) | The queue, persona, CSV and BLS parse with their required fields; `needs_sponsorship` is explicitly `true`; visa type F-1; every clock input is present | `python3 …/refresh.py --dry-run` exits 0 | the run continues | exit 1, `ERROR:` with the reason, **nothing written** |
| **G1 liveness** (machine, then **human**) | **Machine:** each posting is live (both checks agree it's open) or closed (both agree it's gone); otherwise it's *investigate* and not scored. **Human:** opens every Apply / Consider / Investigate link and sees the description and an Apply button. | `refresh-log.json` → `postings[].liveness.verdict`; `npm run ats:liveness -- <url>` for a spot check | live / closed rows are scored; the human signs G1 | investigate rows stay unscored until the human resolves them |
| **G2 timeline** (machine, then **human**) | The factor is computed from dated inputs and shown with its dates and sensitivity. The human confirms the dates, the day count and the time-to-start. Eligibility (a STEM extension, starting before the OPT start) goes to a DSO. | `refresh-log.json` → `timeline.{factor, basis, dates, sensitivity, stem_what_if}` | the factor is used | the person edits `profile.yml` or `rules.json` and re-runs; the old run is kept |
| **G3 release** (**human**) | For each row they'd act on, the human reads the deciding sentences and the score's arithmetic, then names the rows released for action this week. Recorded as a release decision, **never** as application status. | the report's "What the descriptions say" section, and `role-scores.md` | the released rows are logged | nothing is released |
| **Sample-run gate** (lifecycle) | A full offline sample run completes, conformance passes, and a named human has **read** its `refresh-audit.md` | `python3 …/refresh.py --out-dir <run>` exits 0, plus the human's log entry | → RUNNABLE-SAMPLE | stays SPECIFIED |
| **Live gate** (lifecycle) | A live run where a named human clears G1, G2 and G3, each logged with who, what and when | `python3 …/refresh.py --live --out-dir <run>`, plus the gate log | → RUNNABLE-LIVE | stays RUNNABLE-SAMPLE |

## What it can and cannot verify

**Can verify (record):**
- that today the board API returns the posting (or returns 404), and what the page checker sees on its page;
- whether those two independent checks agree;
- the description text as served today, its sha256, and the board's `updated_at`; and whether it changed since a given baseline;
- that particular sentences are present (sponsorship, visa, citizenship, clearance, years). This is extraction, not interpretation;
- the clock arithmetic from the dates given: expected start, days used at the start, days left, the factor;
- a record-based fit: which résumé titles and skills literally appear in the posting, scored by a documented scheme;
- the company's H-1B approval count and top sponsored titles in the 80 Days CSV, and whether the queue still matches them;
- BLS / O*NET context for the posting's SOC code (job zone, median wage, cognitive-pivot score), or that the score is missing.

**Cannot verify:**
- that a live page means the role is still being filled: a frozen or filled requisition can stay up (a ghost posting);
- that the company will sponsor *this* role: the sponsorship tier is company history, not a promise;
- local pay: the local-wage data isn't on `main`, so only national BLS figures are shown;
- eligibility questions (a STEM OPT extension, a start before the OPT start): the mode shows the arithmetic and sends the question to a DSO;
- each company's real time-to-start: one value is used for every posting (your-input);
- the date of the persona's unemployment-day count: it is read as of the run date;
- edits made before the first refresh: the first run has no description baseline;
- what a deciding sentence *means* for this person (for example, whether "unable to sponsor" covers OPT): that's the human's reading at G3;
- fit as real suitability: it's literal string matching. For example, "Anywhere in the US" isn't read as remote by the scheme, so such postings take a location penalty;
- role quality as a factor in the decision: it's shown, never scored (the engine weights it 0).

## Workflow

0. **Toolchain** (once):
   ```bash
   npm install && git restore package-lock.json   # npm install rewrites the maintained lock file
   npm run verify && npm run doctor
   ```
1. **Offline tests** (must print `OK`):
   ```bash
   python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py' -v
   ```
2. **Dry run** (G0; no network, nothing written):
   ```bash
   python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --dry-run
   ```
3. **Offline sample run** (the documented command; recorded real outputs, no network):
   ```bash
   python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --out-dir <run-folder>
   ```
4. **Read** `refresh-report.md`, then `refresh-audit.md` (the sample-run gate).
5. **Live run** (network: the page checker + the board API). Add `--record <folder>` to save a new offline snapshot, and `--baseline <last refresh-log.json>` or `--baseline-liveness <output>` to compare against last week:
   ```bash
   python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --out-dir <run-folder>
   ```
6. **G1:** open the links. Spot-check any of them with `npm run ats:liveness -- <url>`.
7. **G2, G3:** confirm the clock; read the deciding sentences; release rows.
8. **Log** the run and the gate decisions (template below).

**Private variant (your own profile):** put your real `profile.yml` and résumé in an untracked folder (for example `search/` or `private/`). Pass `--persona <folder>`, and point `--out-dir` under `private/`. The tool **refuses** any other output folder when the persona or queue isn't one of the committed examples.

## Output Contract

One artifact can't serve both readers (P5). The agent reads the JSON, the human reads the report, and the audit serves the human judging the run.

**Agent — `refresh-log.json`.** Fields:
- `_tool`, `version`, `rules_version`, `rules_status`, `generated`, `today`, `mode`, `command`;
- `inputs`: `queue{path, sha256, built_by}`, `persona{profile, resume, fictional}`, `csv`, `bls`, `scheme{path, version}`, `rules`, `snapshot{path, recorded_at, liveness_exit}`, `baseline`;
- `persona{name, target_role, visa_status, needs_sponsorship}`;
- `timeline{factor, basis, source, formula, dates{today, expected_start, authorization_end, opt_start, unemployment_as_of}, inputs{…}, notes[], stem_what_if, sensitivity}`;
- `postings[]`, each with:
  - `key`, `company`, `title`, `url`, `board`, `job_id`, `soc`;
  - `liveness{page{result, reason, source}, api{state, status, source}, verdict, factor, reason, rule}`;
  - `description{sha256, updated_at, location, chars, evidence_lines[], source}`;
  - `fit{p, score, scheme_max, relevant_by_scheme, lines[], source, note}`;
  - `sponsorship{p, tier, source, note, records, records_check}`;
  - `role_quality{soc, title, job_zone, annual_median_wage, oews_year, cognitive_pivot_score, pivot_percentile, status}`;
  - `since_baseline{liveness, description_changed, updated_at}`;
  - `scored`, `score{composite, recommendation, reason, arithmetic}`;
- `counts{queued, live, closed, investigate, scored, apply, consider, skip, actionable, pipeline_skip_share}`;
- `invariant_violations[]`;
- `scorer{command, stdout, profile_needs_sponsorship}`;
- `raw_files{<path>: {sha256, bytes, redactions}}`;
- `cannot_verify[]`.

**Human — `refresh-report.md`.**
- **Reader:** the student who owns the queue.
- **Decision enabled:** which rows to release for applying this week (G3).
- **Sections, in order:**
  1. Executive summary;
  2. This week's queue (the agreed columns);
  3. Investigate by hand (not scored);
  4. Closed since the shortlist;
  5. Changed since the last refresh;
  6. What the descriptions say (the deciding sentences);
  7. The OPT clock (dates, factor, sensitivity, the STEM what-if with the DSO note);
  8. Role-quality context (BLS, not scored);
  9. Gates;
  10. Labels;
  11. Cannot verify;
  12. Run record.

**Audit — `refresh-audit.md`** (it reports, it doesn't say "pass"). Sections:
1. Executive summary;
2. Records in and out (page and API counts; live / closed / investigate; scored; Apply / Consider / Skip);
3. Refusals and why;
4. Input cross-checks (queue vs the 80 Days CSV);
5. Since the baseline;
6. Invariants checked before scoring;
7. Raw files (sha256, redactions).

**Also written:**
- `raw/` (page-checker output, API status, each API body, emails and phones redacted);
- the engine scorer's own `roles.json`, `role-scores.json` and `role-scores.md`.

**Where:** by default `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/.build/runs/<date>-<mode>/` (gitignored). A folder holding files this tool didn't write, or git-tracked files, is refused.

## Stop conditions (the mode refuses to produce a score rather than guess)

Exit 1 with `ERROR: <reason>`, and **nothing written**, when:
- **the queue, persona, CSV, BLS file, scheme or rules are missing or malformed**, because a score built on an unparsed input is a guess;
- **`needs_sponsorship` isn't stated explicitly in `profile.yml`**, because inferring it from free-text authorization is exactly the trap the repo fixed in its PR #37;
- **the persona doesn't need sponsorship, or isn't on F-1**, because the mode's gates and votes assume an F-1 OPT holder who needs sponsorship;
- **any clock input is missing**, because the timeline gate can't be computed, and a missing gate would silently become 1.0 in the scorer;
- **the run's own invariant fails before scoring** (a posting reaching the scorer without both checks agreeing, or without both gate values), because that is the silent failure the gates exist to stop. The deliberately broken gate in `fixtures/BROKEN-liveness-gate.py` is caught this way (evidence 03);
- **the scorer doesn't report `profile_needs_sponsorship: true`**, because its output would then weight sponsorship as 0;
- **the output folder holds files this tool didn't write, or git-tracked files**, because a run must never overwrite someone else's record;
- **the persona or queue isn't a committed fictional example and the output folder isn't under `private/`**, because real profiles and queues never reach a tracked folder;
- **`REFRESH_FORBID_NETWORK=1` is set and the run would use the network**, because an offline run must stay offline.

**Per posting, not a whole-run stop:** when the page check is uncertain, or the two checks disagree, the posting is marked *investigate* and isn't scored. The rest of the run continues.

## Labels

- `record`: read from a data file, the board, or the page.
- `your-input`: a value someone chose (`rules.json`, the queue's tier, the persona).
- `model-judgment`: **never used** in this mode.

## Run-log template (for `logs/RUN_LOG.md`)

Students can't edit `logs/RUN_LOG.md` (CI-protected); the entry goes in `logs/runs/<term>-<handle>-<n>.md` instead.

```markdown
## YYYY-MM-DD — apply-queue refresh <offline|live> run

- **Recipe:** recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md v<version> (rules <rules_version>)
- **Inputs:** queue <path> (<n> postings); persona <path> (fictional? yes/no); liveness source <snapshot path | live>; baseline <path | none>
- **Command:** `<exact command>`
- **Outputs:** <run folder>/refresh-log.json, refresh-report.md, refresh-audit.md, raw/ (<k> files, sha256 in the log)
- **Result:** <queued> queued → <live> live · <closed> closed · <investigate> investigate · <scored> scored; scorer Apply <a> · Consider <c> · Skip <s>; timeline factor <f> (expected start <date>)
- **Gates:** G1 <who, what, when> · G2 <who, what, when> · G3 <rows released, by whom, when>
- **Open issues:** <refusals left to resolve; anything implausible>
```

## Lifecycle note

- **DRAFT → SPECIFIED (2026-10-19):** all 10 typed TODOs above are closed with their evidence. Logged in `logs/runs/2026fa-hemanthrayuduu-2.md`.
- **SPECIFIED → RUNNABLE-SAMPLE (2026-10-19): done.** The full offline sample run is `course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-offline-sample/` (evidence 07); conformance passes; Hemanth Rayudu read its `refresh-audit.md` ("read the audit, counts look right"), logged in `logs/runs/2026fa-hemanthrayuduu-2.md`.
- **RUNNABLE-SAMPLE → RUNNABLE-LIVE (2026-10-21): done.** Hemanth Rayudu ran the live refresh (`course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner/`, evidence 16) and cleared G1 (7 of 8 links live with an Apply button; the closed one gone), G2 (the clock confirmed) and G3 (no rows released this week). Logged in `logs/runs/2026fa-hemanthrayuduu-2.md`.
- **v0.1.1 (2026-10-19):** the first live run (evidence 09) caught a real closure (Verkada "Software Engineer – Computer Vision" went from active to 404 between 01:57 and 15:35; cross-checked in evidence 10). It also exposed four report problems, now fixed with tests:
  - a posting that is *gone since the baseline* was reported as "no baseline";
  - the run record printed a raw Python dictionary;
  - the BLS table didn't say how each SOC code was chosen (6 of 8 are a family hint, which is your-input, not a record);
  - two awkward lines of wording.
  Matching, gates and scoring are unchanged. Per the versioning rule below, v0.1.1 had its own sample-run gate: `runs/2026-10-19-offline-sample-v011/`, whose audit Hemanth Rayudu read on 2026-10-19 ("read the v0.1.1 audit, counts look right") → **RUNNABLE-SAMPLE**.
- **VERIFIED: not claimed.** One live run of 8 postings is too thin for a verdict, so `attestation` stays null. Attestations of individual runs live in the worked run.
- **Versioning:** any edit to this recipe, its scripts or `rules.json` after a gate is a new version and needs its own gates (SNICKERDOODLE P4, P8).
