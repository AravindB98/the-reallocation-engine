---
status: DRAFT
todos_open: 3
last_gate: "2026-10-20 real runs on 95 postings from 11 public boards (runs 1–3 + npm run ats:liveness on 90 shortlisted); 2026-10-21 G1–G5 cleared by Ashwin S Thankachan (config approved, 3 SRE pins, 2 Developer Advocate postings marked out of target, all 18 CHECK-LIVENESS postings opened and found open, G4 agreed, G5 tailor list of 6), TODO #3 decided and TODO #5 built (v0.1.4), v0.1.5 review fixes (no ranking on a duties reading that separates nothing; normalized matches labelled model-judgment), final run 7 v0.1.5 — logs/runs/2026fa-ashwinthankachan26-6.md; attestation signed in course/2026fa/submissions/ashwinthankachan26/mode-build/WORKED-RUN.md"
attestation: null
recipe_version: 0.1.5
---

# backend-pivot-range — Is this backend posting judgment-heavy work, and can the data even tell?

## Executive summary

**What this is.** A procedure, plus a small tool that runs it, for an international student on an F-1 visa who wants a new-graduate backend software job, built for the fictional repo persona **Aarav Patel** (`search/examples/aarav-patel/`: F-1 on STEM OPT, Boston, targeting backend and platform roles). For each backend-type posting (backend, data engineer, platform/SRE, QA/SDET, full stack), it finds which official U.S. occupation the job title belongs to. It then reads how much reasoning and judgment the government's O*NET database says that occupation needs, compares it with Software Developers, and reads the posting's own list of duties. It stops before any decision.

**Why read it.** The course tells this student to favor work AI can't easily do. The data meant to measure that has three problems a student can't see. A job title's occupation depends on its spelling. "Back End Software Engineer" is itself an O*NET title of Web Developers, while "Software Engineer, Backend" is not an O*NET title at all: it reaches Software Developers only once the qualifier is dropped and the plain title "Software Engineer" is left. Most score gaps are inside O*NET's own measurement error. And the ratings being compared were made years apart.

**What it found.** On 95 open postings at 11 Boston-area employers (fetched 2026-10-20; final run 2026-10-21, after the student's own occupation choices), the tool put **75** in the standard pile and prioritized **none**. The duties reading separated nothing (every readable posting came out "judgment-heavy"), so the tool refuses to rank on it, at the student's decision. **2** were titles the student marked outside his target, and **18** went to be checked by hand because the repo's liveness checker couldn't confirm them open. The student opened all 18 and found them open. His final tailor list is **6** postings that ask for 0–2.5 years and match his backend skills. Under O*NET's published errors, the data-engineering occupations are statistically indistinguishable from backend software development. If those errors are correlated, *nothing* in this family is distinguishable. The posting-duties reading turned out not to discriminate: every posting whose duties it could read came out "judgment-heavy."

**What it decides.** Nothing. Every value is labeled as a record, a rule's judgment, or the student's own input, and the student decides at every gate.

## Lifecycle note

The sample path (fictional fixtures, 37 offline tests) and a live run on 95 real postings both run end to end, and the repo's liveness checker was applied to all 93 postings that were ever shortlisted. Every gate G1–G5 was cleared by the student on 2026-10-21, and the attestation is signed. The recipe still stays **DRAFT**: 3 typed TODOs are open (see *Proposed additions*), and the constitution's DRAFT → SPECIFIED transition needs zero open TODOs, which has to come before RUNNABLE-SAMPLE. #1 (approve the config), #2 (pin the ambiguous postings) and #3 (spelling variants) closed on 2026-10-21 with the student's logged decisions, and #5 (both error assumptions) was built in v0.1.4. #4 has its tool (`blind_check.py`) and closes when the student's blind labels are scored. #6–#7 need new data.

## Required reads

| Read | Why |
|---|---|
| `SNICKERDOODLE.md`, `DOMAIN.md` | labels, gates, lifecycle, P2 (only ingest touches the network) |
| `book/chapters/09-is-the-role-any-good-bls-onet-role-quality.md` | the Cognitive Pivot thesis this mode tests |
| `data/bls/BLS-audit.md` | the SHA-256 pins this mode verifies the O*NET download against |
| `scripts/bls/extract-soc-occupation-table.py` → `cognitive_pivot_score()` | the nine ratings and the plain average this mode recomputes |
| `DATA_CONTRACT.md` §Zero-Conditions | postings are saved with emails and phone numbers removed; no personal data |

## Purpose, and exactly when to use it

| Use it when | Don't use it when |
|---|---|
| You are a new-grad or early-career **backend** engineer (anchor O*NET 15-1252.00) deciding between adjacent role families (data engineering, platform/SRE, QA/SDET, full stack) | You want to know whether a company sponsors visas, or whether you're senior enough. Use a sponsorship/level mode (e.g. my Recipe Design mode, PR #41) |
| You have a set of **current** postings and want to know which deserve tailoring time on AI-resilience grounds | You want a ranking of occupations by score: the tool refuses to rank scores it can't tell apart |
| Before you tell yourself "data engineering is safer than backend" | As a forecast of which jobs AI will replace: the score measures how much *judgment* analysts rated a job as needing, not measured AI exposure |
| You will check the title→occupation match yourself for any hybrid title | To time applications against an OPT clock: this mode has no visa-timeline gate. Pair it with one |

## Source inventory

| What | Path or command | Role | Label |
|---|---|---|---|
| Repo BLS/O*NET table | `data/bls/compact/soc_occupation_compact.csv` | stored `cognitive_pivot_score` (cross-checked), title, BLS national median wage, job zone | record |
| Repo audit | `data/bls/BLS-audit.md` | SHA-256 of the five O*NET 30.2 files the table was built from | record |
| O*NET 30.2 text database | `https://www.onetcenter.org/dl_files/database/db_30_2_text.zip` via `ingest_onet.py --download` | the nine Level ratings with **N, standard error, date**; alternate, short and reported titles | record |
| Committed extract | `scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/data/onet_elements_15.csv` (279 ratings, 31 occupations), `data/onet_titles.csv` (2,801 title rows), `data/PROVENANCE.md` | what the mode reads; regenerated byte for byte from the zip | record |
| Postings | `fetch_postings.py` → `boards-api.greenhouse.io`, one GET per board in `config.json` → `fetch.boards` | title, location, duties text; contacts removed | record |
| Liveness gate | `npm run ats:liveness -- <urls>` (`scripts/ats/check-liveness.mjs`) | open / closed / uncertain per shortlisted posting; output saved to a file and read with `--liveness` | record |
| Mode | `scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py` + `lib_pivot.py` | the procedure below | — |
| Blind check (v0.1.2) | `…/blind_check.py make` / `score` | a person labels 20 random postings' duties blind (J/R); agreement with the tool's reading is counted | your-input (labels) vs model-judgment |
| Decisions | `…/config.json` | anchor, scope, z, family rules, pins, phrase lists, liveness age, boards | your-input |
| Toolchain | `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs --diff upstream/main` | conformance, privacy | — |
| Ran, not used in the decision | `npm run score -- data/examples/ch11-roles.json` | the repo scorer runs. Its `role_quality` weight is 0.0, so a pivot vote would change nothing (shown in PR #50 by BESWATHI); this mode reports beside the scorer instead | — |

The commands, in order (each writes a **new** folder; existing runs are refused):

```bash
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/ingest_onet.py --download --cache-dir ~/onet-cache
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/fetch_postings.py --out-dir course/2026fa/submissions/ashwinthankachan26/mode-build/runs/fetch-$(date +%Y%m%d-%H%M%S)
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles <fetch>/roles.json --today $(date +%F) --out-dir <new folder>
npm run --silent ats:liveness -- <every PRIORITIZE and STANDARD url> > <folder>/liveness.txt
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles <fetch>/roles.json --today $(date +%F) --liveness <folder>/liveness.txt [--liveness <later check>.txt] --out-dir <new folder>
python3 -m unittest scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/test_pivot_range.py
```

## Inputs

**Roles file** (`--roles`, written by `fetch_postings.py`): `{ fetched_at, roles: [{ role_id (unique), company, title, location, url, snapshot }] }`. Each snapshot is `{ board_listing: { host, board, job_id, fetched_at, updated_at, url }, title, location, bodyText }`. A snapshot without `fetched_at` stops the run.

**Config** (`config.json`, every value `your-input`, drafted 2026-10-20 by Claude and **approved as drafted by Ashwin S Thankachan on 2026-10-21**, TODO #1 closed):

| Key | Value | Reason |
|---|---|---|
| `anchor.onet_soc_code` | 15-1252.00 Software Developers | my target occupation |
| `scope.soc_prefixes` | `15-` | only Computer and Mathematical occupations can be candidates. Others are reported as ignored ("Full Stack Developer" also matches 51-9151.00 Photographic Process Workers) |
| `distinguishable.z` | 1.96 | the usual 95% two-sided cutoff on z = Δ / √(SE₁² + SE₂²) |
| `dated_ratings.years_apart` | 5 | flags comparisons across rating eras |
| `title_normalization` | level words (senior, staff, ii, …) and split marks (`,`, ` - `, `(`, `/`) | level and location don't change the occupation |
| `families.rules` | 7 title rules → canonical O*NET titles | fallback **only** when O*NET has no exact or contained title |
| `pins.by_title` | `site reliability engineer` and `site reliability engineer - data center` → 15-1252.00; `developer advocate` → out of target, "Outside my backend target" (Ashwin, G2, 2026-10-21) | "SRE work at these companies is production software/infrastructure engineering, not research; the 2019 Research Scientists rating is 6 years older than Software Developers' 2025 rating." |
| `posting_signal` | 22 judgment / 8 routine phrase patterns; ≥ 3 classified sentences; ≥ 0.5 share = judgment-heavy | the Cognitive Pivot thesis, written as a rule |
| `liveness.max_age_days` | 3 | a board listing older than this is re-checked |
| `fetch.boards` | 11 Boston-area public Greenhouse boards | 9 from my Recipe Design sweep, plus CarGurus and Datadog (checked to answer, 2026-10-20) |

## Phase gates

Run variable: `OUT=course/2026fa/submissions/ashwinthankachan26/mode-build/runs/pivot-2026-10-21-run7-final`. Every gate reads files the run wrote. Clearances go in `logs/runs/2026fa-ashwinthankachan26-<n>.md` with name and date.

| Gate | Kind | Testable condition | What the human must see to clear it |
|---|---|---|---|
| **G1 Input** | machine, hard stop | `pivot_range.py` exits 0 and `$OUT/pivot-log.json` parses with ≥ 1 posting, each with a `next_action`. A bad date, an existing run, a missing anchor score, a stored score ≠ recomputed, or a pin without a reason → exit 2, nothing written | the posting count echoed by the run |
| **G2 Occupation match** | human | after pins, `PIN-SOC` count is 0, and every posting matched by `onet-contained` or `family-fallback` has been looked at | each title, its candidate occupations, how they were matched, and the ignored out-of-scope matches. Pin one occupation, with a reason, for each `PIN-SOC` |
| **G3 Liveness** | **gate (multiplier)** | every `PRIORITIZE` / `STANDARD` row has `liveness.method == "npm run ats:liveness"` and `result == "active"`; `uncertain` → `CHECK-LIVENESS`, `expired` → `SKIP` | the URL and checker result for every shortlisted row; open each `CHECK-LIVENESS` posting by hand |
| **G4 Posting signal** | human | every posting whose duties were read carries its quoted sentences in the log; the student records a per-posting check of the quotes for every posting they choose at G5 | the quoted sentences. The phrase lists are a rule, not understanding: e.g. "…controls in AWS as defined by the Security Engineering team" counted as judgment because it contains "security" |
| **G5 Decision** | human | `$OUT/pivot-report.md` opens with `## Executive summary`; the student writes their own decision per shortlisted posting in the run log | the report. The tool applies to nothing |

Gate commands:

```bash
OUT=course/2026fa/submissions/ashwinthankachan26/mode-build/runs/pivot-2026-10-21-run7-final
# G1 — the run parsed and every posting has an action
python3 -c "import json,sys; L=json.load(open(sys.argv[1]+'/pivot-log.json')); sys.exit(0 if L['postings'] and all('next_action' in p for p in L['postings']) else 1)" "$OUT"
# G2 — list what a human must look at; exit 1 while any PIN-SOC remains
python3 -c "import json,sys; L=json.load(open(sys.argv[1]+'/pivot-log.json')); [print(p['next_action']['action'], p['occupation_match']['method'], p['title']['value'], p['occupation_match']['in_scope']) for p in L['postings'] if p['occupation_match']['method']!='onet-exact' or p['next_action']['action']=='PIN-SOC']; sys.exit(1 if any(p['next_action']['action']=='PIN-SOC' for p in L['postings']) else 0)" "$OUT"
# G3 — every shortlisted row was checked live by the repo checker and is active
python3 -c "import json,sys; L=json.load(open(sys.argv[1]+'/pivot-log.json')); s=[p for p in L['postings'] if p['next_action']['action'] in ('PRIORITIZE','STANDARD')]; sys.exit(0 if s and all(p['liveness']['method']=='npm run ats:liveness' and p['liveness']['result']=='active' for p in s) else 1)" "$OUT"
# G4 — every posting whose duties were read carries quotes to check
python3 -c "import json,sys; L=json.load(open(sys.argv[1]+'/pivot-log.json')); r=[p for p in L['postings'] if p['posting_signal']['reading'] in ('judgment-heavy','routine-leaning')]; sys.exit(0 if r and all(p['posting_signal']['judgment_quotes'] or p['posting_signal']['routine_quotes'] for p in r) else 1)" "$OUT"
# G5 — the human report leads with a summary
head -3 "$OUT/pivot-report.md"
```

## Workflow

| # | Step | Labor |
|---|---|---|
| 1 | Ingest O*NET 30.2 once; refuse unless all five files match `data/bls/BLS-audit.md` | agent |
| 2 | Fetch today's postings from the boards in `config.json`; remove contacts; save snapshots | agent |
| 3 | G1: check inputs; refuse if any stored pivot score ≠ the score recomputed from its nine ratings | agent |
| 4 | Title → candidate occupations: **exact** O*NET title (record only if the posting title is untouched; reached after removing level words / qualifiers → model-judgment, v0.1.5) → longest **contained** O*NET title of ≥ 2 words (model-judgment) → **family** rule (your-input) → **pin** (your-input) | agent |
| 5 | Per candidate: pivot = mean of the nine ratings (record); SE = √(ΣSEᵢ²)/9 (model-judgment, independence); z vs anchor; band above / indistinguishable / below; flag ratings ≥ 5 years apart | agent (rule) |
| 6 | Combine candidates: one band → that band; disagreeing bands → `mixed` | agent (rule) |
| 7 | Read the responsibilities section only (header rule); classify sentences judgment / routine; fewer than 3 → too few; no section → not read | agent (rule on a record) |
| 8 | Liveness: listing age ≤ 3 days, or the saved `ats:liveness` result overrides | agent |
| 9 | Next action: closed → SKIP; marked out of target by the student (pin with a reason, v0.1.3) → OUT-OF-TARGET; unconfirmed → CHECK-LIVENESS; no scored occupation → RESEARCH-SOC; `mixed` → PIN-SOC; **if the batch's duties reading separates nothing (signal check), no PRIORITIZE or NOTE-ROUTINE (v0.1.5, the student's decision 2026-10-21)**; otherwise at/above anchor + judgment-heavy → PRIORITIZE; below + routine-leaning → NOTE-ROUTINE; else STANDARD | agent (rule) |
| 10 | Run `npm run ats:liveness` on every PRIORITIZE/STANDARD URL; re-run with `--liveness` | agent |
| 11 | Clear G2–G5; record decisions | human |

## What it can verify

- That the O*NET release it reads is **byte-identical** to the one the repo's table was built from (5 SHA-256 matches), and that the committed extract regenerates byte for byte.
- That every stored `cognitive_pivot_score` for the 31 scored group-15 occupations equals the plain mean of its nine ratings (tested; a tampered value stops the run).
- Which O*NET occupations list a given title (record), and which matches it ignored as out of scope.
- Each occupation's nine ratings, rater count (8 analysts each), rating date, and O*NET's published standard errors.
- Whether two scores are distinguishable **under a stated assumption** (independent errors, |z| > 1.96).
- The posting's own duties sentences, quoted exactly (6 of 6 Vestmark quotes found verbatim in a fresh board-API copy).
- Whether the repo's liveness checker saw an Apply control on the live page at the time it ran.

## What it cannot verify

- **Whether AI will replace any of this work.** The pivot score is analysts' ratings of how much reasoning a job needs. It is not observed AI use or exposure (TODO #6).
- **Whether any gap is real once errors are correlated.** O*NET publishes per-rating errors but not how they move together. Assuming they move together, z for Web Developers vs Software Developers falls from −2.31 to −0.81, and for CIS Research Scientists from +5.65 to +1.94: **no** occupation in this family is distinguishable from the anchor. The true answer lies between the two assumptions (TODO #5).
- **Which occupation an employer will file the role under.** O*NET's title lists are not the employer's choice (TODO #7).
- **The right occupation for a hybrid title.** Formlabs' "R&D Reliability/Test Engineer" (its text names hardware 3 times and mechanical 4 times, software once) matched Software QA. Datadog's "People Systems Developer" (an HR-systems role on its People Technology team) matched Computer Systems Engineers/Architects through the contained title "systems developer". Only a person can see this (G2).
- **Where a duties section ends.** The section rule can run past the duties into the requirements (Cohere Health's "routine" quote is a requirement line: "Backend development experience using Java or Groovy…").
- **That a posting's duties are judgment work.** On this run the rule read **62 of 62** readable postings as judgment-heavy and **0** as routine-leaning; it does not discriminate (TODO #4). 24 postings had no recognised responsibilities header and were not read at all.
- **Comparisons across eras.** Web Developers was rated 07/2017; Software Developers 08/2025.
- **Boston pay.** Wages are national medians, and several O*NET codes share one BLS wage line (flagged "shared").
- **Openness behind embedded forms.** All 11 Formlabs and 6 Datadog shortlisted pages came back `uncertain` (content present, no Apply control the checker recognises). A person has to open them.

## Facts that bite, and how each is handled

| Fact | Handling |
|---|---|
| "Back End Software Engineer" / "Back End Developer" / "Back End Engineer" are O*NET alternate titles of **Web Developers** (15-1254.00); "Software Engineer" is Software Developers | reported per posting. Merging spellings is a human decision (TODO #3), not done silently |
| "Backend" (one word) is in no O*NET title; "Back-End Engineer" (hyphen) matches nothing exactly | the contained-title rule and family fallback catch these and label them as such |
| The repo extract averages whatever ratings exist; 122 of 1,016 occupations have no score (finding credited to PR #50) | this mode refuses a partial average: `incomplete` → no score, never compared |
| The repo compact table drops O*NET's N, standard errors and dates | read from the verified O*NET files instead |
| `role_quality` has weight 0.0 in the repo scorer | the scorer is not used for this decision; results are reported beside it |
| `npm run ats:scan -- --dry-run` (Canvas "Before you start") fails: `Error: portals.yml not found. Run onboarding first.` | not used; the mode's own fetch + `ats:liveness` instead |
| `npm run ats:liveness` exits 1 whenever any URL is not active (fails closed) | expected; its saved output is parsed, not its exit code |
| Contained-title matching can pick a plausible but wrong occupation ("systems developer") | labeled `model-judgment`; listed for G2 |
| The duties rule put 62 of 62 readable postings in one class, so PRIORITIZE only meant "a duties heading was found" (an outside review, 2026-10-21) | v0.1.2 reports it in every run (`signal_health`). From v0.1.5 the tool refuses to PRIORITIZE or NOTE-ROUTINE on a duties reading that separates nothing (the student's decision): run 7 has 0 PRIORITIZE |
| The repo checker can't see embedded application forms (Formlabs, Datadog, CarGurus) | the 18 `uncertain` postings were re-checked against each employer's board API on 2026-10-21: 18/18 still listed (`runs/board-recheck-2026-10-21.txt`), evidence for the person clearing G3 |

## Proposed additions

| # | Addition | Why it belongs | Marker |
|---|---|---|---|
| 1 | ~~Approve or change every value in `config.json` (drafted by Claude 2026-10-20), each with a one-line reason, before the next run~~ | P1: humans decide scope and thresholds | **closed 2026-10-21**: approved as drafted by Ashwin S Thankachan, each value keeping its written reason (`config.json → _decided_by`; run log 6) |
| 2 | ~~Pin an occupation, with a reason, for each of the 5 `PIN-SOC` postings~~ | G2 is a gate, not a checkbox | **closed 2026-10-21** by Ashwin S Thankachan's logged G2 decisions: 3 SRE titles → 15-1252.00 (reason recorded); 2 Datadog Developer Advocate titles → out of target, "Outside my backend target" (`config.json → pins`; run log 6). Gate command G2 now exits 0 |
| 3 | ~~Decide whether "back end" / "back-end" / "backend" are merged before lookup~~ | merging sends every "Backend Software Engineer" to Web Developers; not merging lets spelling decide | **closed 2026-10-21, value: keep separate (no merging).** Ashwin S Thankachan's reason: "O*NET's own title lists are the record; the spelling mismatch is the finding, and ambiguous titles are pinned by me." No effect on this run: its 3 backend postings are all "Software Engineer, Backend" (`config.json → title_normalization._spelling_decision`) |
| 4 | A duties rule that discriminates: hand-label 20 postings blind first (`blind_check.py`, built v0.1.2, sheet in `runs/blind-check-2026-10-21/`), then choose phrases, then test on a different 20 | the current rule read 62/62 as judgment-heavy, so it adds no information; v0.1.2 already reports this per run (`signal_health`) | `[TODO: DEV]` |
| 5 | ~~Report the band under both error assumptions (independent: √(ΣSEᵢ²)/9; fully correlated: mean SEᵢ) and call a difference real only if both agree~~ | the one assumption that flips every conclusion in this family | **closed 2026-10-21 (v0.1.4):** `lib_pivot.compare()` adds `z_correlated`, `band_correlated`, `real_under_both`; the report's occupations table shows both z's and a "Real under both?" column (tested; conformance passes). On run 6: **no** occupation is real under both. Routing still uses the independent-error band, and the report says so |
| 6 | The Anthropic Economic Index (Hugging Face `Anthropic/EconomicIndex`, data CC BY; O*NET task mappings since the 2025-02-10 release; latest listed release 2026-06-26; checked 2026-10-20): observed AI use by O*NET task, aggregated to occupation | separates "needs judgment" (O*NET) from "is already being done with AI" (usage), which the pivot score can't | `[TODO: DATA SOURCE]` |
| 7 | DOL OFLC LCA disclosure files (H-1B/H-1B1/E-3, newest FY2026 Q3 at https://www.dol.gov/agencies/eta/foreign-labor/performance, checked 2026-10-20): the occupation code employers file per job title, once the record layout is confirmed to carry SOC and title fields | replaces O*NET's title list with what Boston sponsors actually file for "Backend Engineer" | `[TODO: DATA SOURCE]` |

## Output contract

Both files go to `--out-dir`. Writing under `data/` is refused. Both are built in memory before either is written.

**For the agent — `pivot-log.json`:** `_recipe`, `recipe_version`, `run_date`, `inputs` (path + SHA-256 of roles, config, elements, titles, compact, liveness), `assumptions`, `anchor` (code, title, `pivot`), `counts` (per action), `signal_health { read, judgment_heavy, routine_leaning, discriminating, basis }` (v0.1.2), `gates` (G1–G5 with status), and `postings[]`. Each posting has `title`, `url`, `liveness { result, factor, method, source, basis }`, `occupation_match { method, title_tried, matched_title | family, normalized, in_scope, ignored_out_of_scope, source, basis }`, `occupations[] { onet_soc_code, title, pivot { status, value, se, se_correlated, n_elements, dates, raters, source, se_source }, vs_anchor { delta, se_diff, z, band, z_correlated, band_correlated, real_under_both, source }, dated_vs_anchor, median_wage { value, bls_soc_code, shared_with_other_onet_codes }, job_zone }`, `unscored_candidates`, `pivot_range { min, max, band }`, `posting_signal { status, section_found, judgment, routine, judgment_share, reading, judgment_quotes, routine_quotes, source }`, `next_action { action, why, source }`.

**For the person — `pivot-report.md`:** Executive summary → Results (one row per posting: next action, why, occupation match with its label, pivot range and band, duties reading, liveness) → The occupations behind these titles (pivot ± SE, rating date, z, band, dated flag, wage) → Duties signal check (v0.1.2: does the duties reading separate anything in this batch?) → Verified vs inferred → Gates for you to clear (checkboxes) → What this run cannot tell you → Run record (inputs with SHA-256).

## Stop conditions

Stop, and write nothing, when:

- `--today` is not a real calendar date (`2026-02-30` is refused, never rolled forward).
- `--out-dir` already holds a run (unless `--overwrite` is passed on purpose), or lies under `data/`.
- The roles file has no postings, a duplicate or missing `role_id`, or a snapshot without `fetched_at`.
- The anchor occupation has no complete score.
- Any stored `cognitive_pivot_score` differs from the one recomputed from its nine ratings: the inputs disagree, so nothing is compared.
- A pin in `config.json` lacks an occupation or a reason.
- (ingest) Any O*NET file's SHA-256 differs from `data/bls/BLS-audit.md`.

Route to a person, and never invent a value, when:

- An occupation has fewer than nine ratings → `incomplete`, no score (never a partial average).
- No scored occupation matches a title → `RESEARCH-SOC`. Candidates disagree → `PIN-SOC`. A title the student marked outside his target (with a reason) → `OUT-OF-TARGET`; a mark without a reason stops the run.
- No responsibilities section is found → `section-not-found` (unknown, not zero). Fewer than 3 classified sentences → `too-few-signals`.
- A posting is not confirmed open → `CHECK-LIVENESS`; closed → `SKIP`, whatever else is true.
- The batch's duties reading separates nothing (every classified posting in one class) → no `PRIORITIZE` or `NOTE-ROUTINE`; those postings go to `STANDARD` with the reason (v0.1.5).
- Asked to change phrase lists, z, or family rules after seeing a run's results → refuse in that run; record a dated decision with a reason first, then run again into a new folder.
- Asked to apply, email, or contact anyone → out of scope; the tool ends at the report.

## Verification checks

- Offline tests: `python3 -m unittest scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/test_pivot_range.py`: 37 tests covering every route on fictional fixtures, the refusals, the duties-signal check, the blind-check sheet (it must not show the tool's reading) and its scoring, repeated liveness files, the out-of-target pin, both error assumptions, and two real-data checks (the extract reproduces all 31 stored scores; the audit hashes parse).
- Blind agreement (TODO #4): `python3 …/blind_check.py score --log <run>/pivot-log.json --labels runs/blind-check-2026-10-21/blind-labels.csv` after the person labels all 20.
- Independent recompute: `awk` over the raw O*NET `Abilities.txt` + `Skills.txt` for 15-1254.00 gives mean 3.5844, SE 0.0541, matching the tool and the repo's 3.584.
- Determinism: the same inputs into a new folder give a byte-identical `pivot-log.json` and `pivot-report.md`.
- Quote check: re-fetch one posting from the board API and find every quoted sentence verbatim.
- **Break B1:** tamper a copy of the repo table (15-1254.00 → 3.900). Expected: exit 2, `stored cognitive_pivot_score … ≠ recomputed`, nothing written.
- **Break B2:** a pin with no reason. Expected: exit 2.
- **Break B3:** a mutant `lib_pivot.py` that averages partial ratings, run against the real tests in a scratch copy. Expected: tests fail.
- **Break B4:** an O*NET zip with one rating in `Abilities.txt` changed. Expected: ingest exits 2 on the SHA-256 mismatch.

## Logging rules

- Record every run in `logs/runs/2026fa-ashwinthankachan26-<n>.md`. **Never** edit `logs/RUN_LOG.md`.
- Public posting URLs and quoted duties are allowed. Contacts are removed before saving. No résumé content, personal contact details or private application notes.
- Gate clearances and decisions are written by the student, with name and date.

Run-log template (extends `recipes/_shared.md` §Logging Rules):

```markdown
## YYYY-MM-DD — backend-pivot-range <fetch | run | liveness | gate> 

- **Recipe:** recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md v<version>
- **Commit:** <short sha>
- **Who ran it:** <name, time>
- **Prediction (before running):** <counts / which families score where>
- **Command:** <exact command>
- **Inputs:** <roles.json> · config.json (sha) · onet_elements_15.csv · onet_titles.csv · soc_occupation_compact.csv · <liveness.txt>
- **Outputs:** <out-dir>/pivot-log.json · pivot-report.md
- **Result:** <stdout line, pasted>
- **Gates:** G1 <passed/failed> · G2 <cleared by NAME, DATE: pins and reasons> · G3 … · G4 … · G5 …
- **Decisions (human):** <role_id → my choice, one line each>
- **Open issues:** <what did not work or is still missing>
```
