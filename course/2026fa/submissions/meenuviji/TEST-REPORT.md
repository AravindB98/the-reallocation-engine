# TEST-REPORT — data-titles-h1b-entry (fresh-clone test)

## Executive summary

**What this is.** A test of the sponsorship-by-title tool, run from a fresh copy of the committed branch rather than the working folder. It checks that the tool runs for anyone who clones the branch, not just on the machine where it was built.

**Why read it.** It shows what passes and what fails, the full unedited output of every check, and which decisions are still left to a person.

**What it found.** Almost everything passed on a clean copy:
- The standard setup checks pass before and after the run.
- The sample run finishes with exit 3, "completed with stops", as designed: 12 of 15 postings scored (2 Apply, 8 Consider, 2 Skip), 2 stopped at the company-name check, 1 refused for a missing value.
- All 28 offline tests pass.
- The syntax checks pass for the tool and the recipe.
- The branch touches only the student's own folders.

Three things need attention:
- **The privacy scan of the working tree reports one finding and exits 1.** It is a third-party email address inside a package-lock file that comes from the main branch; this branch never touches that file. The branch-only scan is clean.
- **Running the tool changes two committed output files.** Only their run timestamp changes, but the tracked copies go stale every run.
- **Nothing here clears a human gate.** The stops, refusals and notes listed at the end still need a person.

Nothing in this report was fixed. Two strings were redacted from the pasted output: a third-party email address (see the PII scan section) and the home-folder username in the clone command (see Environment and clone SHA).

---

## Environment and clone SHA

- Clone: `/tmp/fresh-reallocation` (did not exist beforehand), cloned from the working repo's committed branch `contrib/2026fa-meenuviji-data-titles-h1b-entry`.
- Clone HEAD: `4a4074e607ba154ca6edf63de816b6f7b9fe49a1`.
- The clone has no local `main` branch, only `origin/main`, which points at the working repo's `main`. The scope check therefore uses `git diff --stat origin/main...HEAD`.
- Commands were run through a wrapper that prints a UTC timestamp, the command, all of stdout+stderr, and the exit code.
- One alteration was made to the pasted output below, on 2026-10-21: in the `git clone` command, the home-folder username was replaced with `<me>`. Nothing else in the transcript was changed.

~~~text
[2026-10-03T18:43:59Z] $ git clone --branch contrib/2026fa-meenuviji-data-titles-h1b-entry "/Users/<me>/Downloads/week 1 assignment/the-reallocation-engine" /tmp/fresh-reallocation
Cloning into '/tmp/fresh-reallocation'...
done.
[exit code: 0]

[2026-10-03T18:43:59Z] $ git rev-parse HEAD
4a4074e607ba154ca6edf63de816b6f7b9fe49a1
[exit code: 0]

[2026-10-03T18:43:59Z] $ git log --oneline -5
4a4074e recipe + card: data-titles-h1b-entry (DRAFT; 7 TODOs open; prototype runnable on sample)
631acbe CHANGE-BRIEF Revision 2: headline counts recomputed under final rules (248 / 94 / 39)
e93e817 prototype: data-titles-h1b-entry (28 offline tests, uses existing scorer unmodified)
47a5b79 CHANGE-BRIEF Revision 1: timeline gate correction, tier precedence, level tokens (appended; original sections unchanged)
3f1182e CHANGE-BRIEF: restore markdown formatting lost in copy-paste (content unchanged, still before any prototype code)
[exit code: 0]

[2026-10-03T18:43:59Z] $ git branch -a
* contrib/2026fa-meenuviji-data-titles-h1b-entry
  remotes/origin/HEAD -> origin/contrib/2026fa-meenuviji-data-titles-h1b-entry
  remotes/origin/contrib/2026fa-meenuviji-data-titles-h1b-entry
  remotes/origin/main
[exit code: 0]
~~~

## Toolchain baseline (before)

~~~text
[2026-10-03T18:43:59Z] $ node --version
v24.21.0
[exit code: 0]

[2026-10-03T18:43:59Z] $ python3 --version
Python 3.9.6
[exit code: 0]

[2026-10-03T18:43:59Z] $ npm install
npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting <redacted: third-party address from glob's npm deprecation notice; package-lock.json line 606>

added 55 packages, and audited 56 packages in 614ms

17 packages are looking for funding
  run `npm fund` for details

3 high severity vulnerabilities

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm warn install-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.2 (install: (install scripts present))
npm warn install-scripts   sharp@0.33.5 (install: node install/check)
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
[exit code: 0]

[2026-10-03T18:44:00Z] $ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.21.0
  ✓ python3    Python 3.9.6

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
[exit code: 0]

[2026-10-03T18:44:00Z] $ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 198 files (90 md · 48 py · 30 js · 26 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit code: 0]
~~~

## Sample run

Command: `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py ; echo "exit: $?"`. Exit code: **3** (completed with per-role stops; the wrapper's `[exit code: 0]` belongs to the `echo`). Tracked files were clean beforehand:

~~~text
[2026-10-03T18:44:14Z] $ git status --short
[exit code: 0]
~~~

~~~text
[2026-10-03T18:44:14Z] $ python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py ; echo "exit: $?"
! 15 postings → scored 12 (Apply 2 · Consider 8 · Skip 2) · stopped 2 · refused 1
  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json  +  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
exit: 3
[exit code: 0]
~~~

Generated `out/report.md` from the clone, pasted verbatim:

~~~markdown
# Sponsorship-by-title run report

## Executive summary

**What this is.** The result of checking 15 sample job postings against each employer's history of visa-sponsored job titles, to see whether the employer has sponsored *entry-level data* jobs before — not just any job — and passing that judgment to the project's existing role scorer.

**Why read it.** It shows which postings are worth tailoring an application for, which were stopped before scoring and why, and exactly which evidence and which of your own rules produced each recommendation.

**What it found.** 12 postings were scored: **2 Apply, 8 Consider, 2 Skip** (skip rate 17% of scored; the engine treats at least 50% as healthy). 2 stopped because the company name could not be matched to exactly one employer in the data; a person has to resolve these. 1 were refused because a required date or posting-status value was missing; the scorer would otherwise have silently assumed the best case. 2 scored posting(s) are at employers with no sponsorship record at all. No record is not evidence that they don't sponsor. All of the 12 scored postings would need the employer to accept a start 61 days after the offer, because work authorization begins later; that is noted, not penalized. For 7 scored posting(s), the employer has sponsored data jobs, but not this kind of data job, so the match is at company level only. PATHAI INC and PATHRAI INC carry identical sponsorship evidence; it may belong to only one of them.

**How the sample relates to all employers in the data.** Share of all employers in each group: no sponsorship record 94.9%; sponsor, but no data titles 4.3%; entry-level data title and enough approvals 0.33%; entry-level data title but few approvals 0.14%; only mid-level data titles 0.05%; only senior data titles 0.31%.

The sample is stratified (2 per group), so its skip rate is not representative; 94.9% of CSV companies are in the no-record group.

The sponsorship scores are ordered labels from your own rules, not probabilities. Fit and posting status were not measured in this sample: fit is held constant and every posting is assumed live. The next action for each posting is advice from your own rules; it never changes the recommendation.

---

## Run record

- Run: `2026-10-03T18:44:14Z` · mode: sample (offline) · status: **completed-with-stops** · exit code 3
- Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`) — record
- Wage context: `data/bls/compact/soc_occupation_compact.csv` (1016 rows) — record
- Sample: seed 42, 2 per evidence group (your-input); evidence-group sizes in the CSV {'no-record': 28812, 'no-data-title': 1309, 'proven': 99, 'entry-under-min-approvals': 41, 'only-mid': 14, 'only-senior': 94} (record)
- Population share by evidence group (record, from the CSV group sizes): no-record 28812 (94.9%) · no-data-title 1309 (4.3%) · proven 99 (0.33%) · entry-under-min-approvals 41 (0.14%) · only-mid 14 (0.05%) · only-senior 94 (0.31%)
- Timeline note (your-input, non-scoring; applies to 12 of 12 scored postings, because hiring_lag_days is one global value): deferred start: employer must accept a start 61 days after offer (projected 2026-12-02, opt_start 2027-02-01)
- Scorer: `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/score` → exit 0 (unmodified)
- Scorer weights used: {'sponsorship': 0.35, 'fit': 0.3, 'role_quality': 0} · apply threshold 0.3 · consider floor 0.2 — record
- Labels: **record** = read from a repo data file or returned by the scorer; **your-input** = Meena's rule or value; **model-judgment** = not used in this run.

## Scored postings

| Posting | Employer (matched) | Rec | Composite | Evidence group (your-input) | Next action (your-input) | Sponsorship tier · p (your-input) | Evidence (record) | Timeline (your-input) | BLS context (record) |
|---|---|---|---|---|---|---|---|---|---|
| Machine Learning Engineer I | ENTRUPY INC | **Apply** | 0.395 | proven | Tailor an application (research-and-apply hours). | Proven · 0.7 (proven) | 10 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Data Analyst | DISQO INC | **Apply** | 0.395 | proven | Tailor an application (research-and-apply hours). | Proven · 0.7 (proven) | 24 approvals / 2 denials | 1.0 (deferred) | no SOC row |
| Data Engineer I | CARGO CHIEF ACQUISITION INC | **Consider** | 0.325 | entry-under-min-approvals | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | possible · 0.5 (otherwise) | 2 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Associate AI Engineer | BIOME ANALYTICS INC | **Consider** | 0.325 | entry-under-min-approvals | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | possible · 0.5 (otherwise) | 2 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Junior Business Intelligence Analyst | PATHAI INC | **Consider** | 0.325 | only-mid | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | possible · 0.5 (otherwise) | 78 approvals / 2 denials | 1.0 (deferred) | 15-2051 Business Intelligence Analysts $112,590 |
| Data Scientist I | PATHRAI INC | **Consider** | 0.325 | only-mid | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | possible · 0.5 (otherwise) | 78 approvals / 2 denials | 1.0 (deferred) | 15-2051 Data Scientists $112,590 |
| Associate Machine Learning Engineer | ROKU INC | **Consider** | 0.325 | only-senior | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | possible · 0.5 (otherwise) | 654 approvals / 4 denials | 1.0 (deferred) | no SOC row |
| Junior Data Analyst | CAMBRIDGE MOBILE TELEMATICS INC | **Consider** | 0.325 | only-senior | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | possible · 0.5 (otherwise) | 72 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Associate Data Scientist | AKOYA BIOSCIENCES INC | **Consider** | 0.255 | no-data-title | They sponsor, but not data roles. Low priority: network only through a warm contact. | possible · 0.3 (no-data-title) | 26 approvals / 0 denials | 1.0 (deferred) | 15-2051 Data Scientists $112,590 |
| Business Intelligence Analyst | IMMUNITYBIO INC | **Consider** | 0.255 | no-data-title | They sponsor, but not data roles. Low priority: network only through a warm contact. | possible · 0.3 (no-data-title) | 20 approvals / 0 denials | 1.0 (deferred) | 15-2051 Business Intelligence Analysts $112,590 |
| Data Analyst I | RELATIONSHIP SCIENCE LLC | **Skip** | 0.150 | no-record | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | unknown · — (no-record) | no sponsorship record | 1.0 (deferred) | no SOC row |
| Junior Data Engineer | BLUE OWL CAPITAL INC | **Skip** | 0.150 | no-record | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | unknown · — (no-record) | no sponsorship record | 1.0 (deferred) | no SOC row |

### Why each one scored as it did

#### Data Analyst I — RELATIONSHIP SCIENCE LLC

- Company match (record): input `RELATIONSHIP SCIENCE LLC` → `RELATIONSHIP SCIENCE LLC` (NEW YORK, NY) by rule **exact-upper-case**
- Sponsored titles (record): none — **no record ≠ does not sponsor**
- Sponsorship term (your-input): rule `no-record` → tier `unknown`, p — (the scorer drops a null vote; it is not zero)
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.3) × 1 × 1 = 0.150` → **Skip** — composite 0.150 < 0.2 — time is better spent elsewhere
- Evidence group (your-input): no-record
- Next action (your-input; evidence group: no-record): No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring.

#### Junior Data Engineer — BLUE OWL CAPITAL INC

- Company match (record): input `BLUE OWL CAPITAL INC` → `BLUE OWL CAPITAL INC` (New York, NY) by rule **exact-upper-case**
- Sponsored titles (record): none — **no record ≠ does not sponsor**
- Sponsorship term (your-input): rule `no-record` → tier `unknown`, p — (the scorer drops a null vote; it is not zero)
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.3) × 1 × 1 = 0.150` → **Skip** — composite 0.150 < 0.2 — time is better spent elsewhere
- Evidence group (your-input): no-record
- Next action (your-input; evidence group: no-record): No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring.

#### Associate Data Scientist — AKOYA BIOSCIENCES INC

- Company match (record): input `AKOYA BIOSCIENCES INC` → `AKOYA BIOSCIENCES INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Sponsored titles (record): `Senior Research Associate`, `Sr. Product Manager, PhenoCycler Instruments` — none is a data-family title under your allowlist
- Sponsorship term (your-input): rule `no-data-title` → tier `possible`, p 0.3
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` → **Consider** — composite 0.255 in the Consider band [0.2, 0.3)
- Evidence group (your-input): no-data-title
- Next action (your-input; evidence group: no-data-title): They sponsor, but not data roles. Low priority: network only through a warm contact.

#### Business Intelligence Analyst — IMMUNITYBIO INC

- Company match (record): input `IMMUNITYBIO INC` → `IMMUNITYBIO INC` (SAN DIEGO, CA) by rule **exact-upper-case**
- Sponsored titles (record): `Application Systems Analyst-Dynamics AX `, `Senior Statistical Programmer`, `Research Associate II` — none is a data-family title under your allowlist
- Sponsorship term (your-input): rule `no-data-title` → tier `possible`, p 0.3
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` → **Consider** — composite 0.255 in the Consider band [0.2, 0.3)
- Evidence group (your-input): no-data-title
- Next action (your-input; evidence group: no-data-title): They sponsor, but not data roles. Low priority: network only through a warm contact.

#### Machine Learning Engineer I — ENTRUPY INC

- Company match (record): input `ENTRUPY INC` → `ENTRUPY INC` (NEW YORK, NY) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Engineer` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` → **Apply** — composite 0.395 ≥ 0.3, gates healthy
- Evidence group (your-input): proven
- Next action (your-input; evidence group: proven): Tailor an application (research-and-apply hours).
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Machine Learning Engineer I' vs sponsored data titles ['Data Engineer']. This does not show the company sponsored this specific title.

#### Data Analyst — DISQO INC

- Company match (record): input `DISQO INC` → `DISQO INC` (GLENDALE, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Analyst ` → entry-or-unmarked (unmarked); `Senior Data Analyst ` → senior (senior)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` → **Apply** — composite 0.395 ≥ 0.3, gates healthy
- Evidence group (your-input): proven
- Next action (your-input; evidence group: proven): Tailor an application (research-and-apply hours).

#### Data Engineer I — CARGO CHIEF ACQUISITION INC

- Company match (record): input `CARGO CHIEF ACQUISITION INC` → `CARGO CHIEF ACQUISITION INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): entry-under-min-approvals
- Next action (your-input; evidence group: entry-under-min-approvals): Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Data Engineer I' vs sponsored data titles ['Machine Learning Engineer']. This does not show the company sponsored this specific title.

#### Associate AI Engineer — BIOME ANALYTICS INC

- Company match (record): input `BIOME ANALYTICS INC` → `BIOME ANALYTICS INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Software Data Engineer ` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): entry-under-min-approvals
- Next action (your-input; evidence group: entry-under-min-approvals): Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Associate AI Engineer' vs sponsored data titles ['Software Data Engineer ']. This does not show the company sponsored this specific title.

#### Junior Business Intelligence Analyst — PATHAI INC

- Company match (record): input `PATHAI INC` → `PATHAI INC` (CAMBRIDGE, MA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer III` → senior (level iii); `Senior Machine Learning Engineer ` → senior (senior); `Machine Learning Engineer II` → mid (level ii)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-mid
- Next action (your-input; evidence group: only-mid): They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Junior Business Intelligence Analyst' vs sponsored data titles ['Machine Learning Engineer III', 'Senior Machine Learning Engineer ', 'Machine Learning Engineer II']. This does not show the company sponsored this specific title.
- Note, duplicate-evidence (record; does not affect the score): Identical sponsorship evidence (approvals, denials, rate, median salary, title list) for PATHAI INC and PATHRAI INC. The evidence may belong to only one of them.

#### Data Scientist I — PATHRAI INC

- Company match (record): input `PATHRAI INC` → `PATHRAI INC` (MOUNTAIN VIEW, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer III` → senior (level iii); `Senior Machine Learning Engineer ` → senior (senior); `Machine Learning Engineer II` → mid (level ii)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-mid
- Next action (your-input; evidence group: only-mid): They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Data Scientist I' vs sponsored data titles ['Machine Learning Engineer III', 'Senior Machine Learning Engineer ', 'Machine Learning Engineer II']. This does not show the company sponsored this specific title.
- Note, duplicate-evidence (record; does not affect the score): Identical sponsorship evidence (approvals, denials, rate, median salary, title list) for PATHAI INC and PATHRAI INC. The evidence may belong to only one of them.

#### Associate Machine Learning Engineer — ROKU INC

- Company match (record): input `ROKU INC` → `ROKU INC` (SARATOGA, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Senior Data Scientist` → senior (senior); `Senior Data Engineer` → senior (senior)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-senior
- Next action (your-input; evidence group: only-senior): They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Associate Machine Learning Engineer' vs sponsored data titles ['Senior Data Scientist', 'Senior Data Engineer']. This does not show the company sponsored this specific title.

#### Junior Data Analyst — CAMBRIDGE MOBILE TELEMATICS INC

- Company match (record): input `CAMBRIDGE MOBILE TELEMATICS INC` → `CAMBRIDGE MOBILE TELEMATICS INC` (CAMBRIDGE, MA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Principal Data Scientist I` → senior (principal)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-senior
- Next action (your-input; evidence group: only-senior): They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Junior Data Analyst' vs sponsored data titles ['Principal Data Scientist I']. This does not show the company sponsored this specific title.

## Sample by evidence group

| Evidence group | Companies in CSV (record) | Sample postings scored |
|---|---|---|
| no-record | 28812 | RELATIONSHIP SCIENCE LLC (Skip); BLUE OWL CAPITAL INC (Skip) |
| no-data-title | 1309 | AKOYA BIOSCIENCES INC (Consider); IMMUNITYBIO INC (Consider) |
| proven | 99 | ENTRUPY INC (Apply); DISQO INC (Apply) |
| entry-under-min-approvals | 41 | CARGO CHIEF ACQUISITION INC (Consider); BIOME ANALYTICS INC (Consider) |
| only-mid | 14 | PATHAI INC (Consider); PATHRAI INC (Consider) |
| only-senior | 94 | ROKU INC (Consider); CAMBRIDGE MOBILE TELEMATICS INC (Consider) |

## Stopped at the company-match gate

A person must pick the right row or confirm the company is not in the data. Nothing was guessed.

| Posting | Input name | Reason | Candidates (name, city, state) |
|---|---|---|---|
| Data Analyst I | Quillfeather Data Labs, Inc. | no-match | — |
| Associate Data Scientist | Arcturus Therapeutics | more-than-one-row | ARCTURUS THERAPEUTICS INC (SAN DIEGO, CA); ARCTURUS THERAPEUTICS LTD (SAN DIEGO, CA) |

## Refused: missing gate value

These were never sent to the scorer, because it treats a missing value as the best case (1.0).

| Posting | Employer | Missing |
|---|---|---|
| Junior Data Engineer | CENTIFIC GLOBAL SOLUTIONS INC | liveness.factor missing or not numeric |

## Caveats

- A title with no level marker is counted as entry-or-unmarked. Unmarked is not proof of entry level.
- Sponsorship data is per company; the sponsored-title list is the only role-level signal, and it is a short list of free text.
- Approval rate measures how often filed petitions were approved, not whether this employer will file for you.
- Wage context is the national median for the matching occupation title only; it does not affect scoring.
- A company-level data-family match does not show the employer sponsored the specific posting title.
~~~

## Failure cases exercised

Quotes are from the test output (`... ok`) or from the clone's `out/report.md` above.

| Case | Exercised by | Observed (quoted) |
|---|---|---|
| §8 Company not in the CSV | `test_company_not_in_csv`; run row f01 | `test_company_not_in_csv (test_pipeline.Pipeline) ... ok`; report: `\| Data Analyst I \| Quillfeather Data Labs, Inc. \| no-match \| — \|` |
| §8 Matches more than one row after normalization | `test_company_matches_more_than_one_row`; run row f02 | `... ok`; report: `\| Associate Data Scientist \| Arcturus Therapeutics \| more-than-one-row \| ARCTURUS THERAPEUTICS INC (SAN DIEGO, CA); ARCTURUS THERAPEUTICS LTD (SAN DIEGO, CA) \|` |
| §8 In the CSV, no sponsorship data | `test_in_csv_without_sponsorship_gives_null_p`; run rows s01–s02 | `... ok`; report: `\| Data Analyst I \| RELATIONSHIP SCIENCE LLC \| **Skip** \| 0.150 \| no-record \| ... \| unknown · — (no-record) \| no sponsorship record \|` |
| §8 Only senior data-family titles | `test_only_senior_data_titles`; run rows s11–s12 | `... ok`; report: `\| Associate Machine Learning Engineer \| ROKU INC \| **Consider** \| 0.325 \| only-senior \| ... \| possible · 0.5 (otherwise) \| 654 approvals / 4 denials \|` |
| §8 Missing liveness value | `test_missing_liveness_is_refused`; run row f03 | `... ok`; report: `\| Junior Data Engineer \| CENTIFIC GLOBAL SOLUTIONS INC \| liveness.factor missing or not numeric \|` |
| §8 Missing timeline value | `test_missing_timeline_input_is_refused` | `test_missing_timeline_input_is_refused (test_pipeline.Pipeline) ... ok` |
| §8 OPT window already closed (projected start after window end) | `test_opt_window_closed_gates_to_skip` | `test_opt_window_closed_gates_to_skip (test_pipeline.Pipeline) ... ok` |
| §8 Target title with no BLS row | `test_target_title_without_bls_row`; run | `... ok`; report shows `no SOC row` in 8 lines, e.g. the CARGO CHIEF ACQUISITION INC row ending `\| 1.0 (deferred) \| no SOC row \|` |
| Rev 1: projected start before opt_start → deferred, factor 1.0 | `test_projected_start_before_opt_start_is_deferred_not_failed`; run | `... ok`; report: `deferred start: employer must accept a start 61 days after offer (projected 2026-12-02, opt_start 2027-02-01)` |
| Rev 1: projected start exactly on window end → 1.0 (inclusive) | `test_projected_start_on_window_end_is_inside` | `test_projected_start_on_window_end_is_inside (test_pipeline.Pipeline) ... ok` |
| Rev 1: projected start one day after window end → 0.0, Skip | `test_projected_start_one_day_after_window_end_fails` | `test_projected_start_one_day_after_window_end_fails (test_pipeline.Pipeline) ... ok` |
| Null sponsorship p through the real scorer | `test_null_sponsorship_p_through_real_scorer` | `test_null_sponsorship_p_through_real_scorer (test_pipeline.Pipeline) ... ok` |

## Tests

~~~text
[2026-10-03T18:44:14Z] $ python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
test_bad_argument_exits_2 (test_pipeline.Pipeline) ... ok
test_company_matches_more_than_one_row (test_pipeline.Pipeline) ... ok
test_company_not_in_csv (test_pipeline.Pipeline) ... ok
test_duplicate_evidence_note_for_pathai_and_pathrai (test_pipeline.Pipeline) ... ok
test_exact_match_with_siblings_is_noted_not_stopped (test_pipeline.Pipeline) ... ok
test_gate_closed_skip_gets_gate_next_action (test_pipeline.Pipeline) ... ok
test_happy_path (test_pipeline.Pipeline) ... ok
test_in_csv_without_sponsorship_gives_null_p (test_pipeline.Pipeline) ... ok
test_missing_liveness_is_refused (test_pipeline.Pipeline) ... ok
test_missing_timeline_input_is_refused (test_pipeline.Pipeline) ... ok
test_next_action_differs_by_evidence_group_with_same_recommendation (test_pipeline.Pipeline) ... ok
test_no_duplicate_note_for_distinct_evidence (test_pipeline.Pipeline) ... ok
test_null_sponsorship_p_through_real_scorer (test_pipeline.Pipeline) ... ok
test_only_senior_data_titles (test_pipeline.Pipeline) ... ok
test_opt_window_closed_gates_to_skip (test_pipeline.Pipeline) ... ok
test_projected_start_before_opt_start_is_deferred_not_failed (test_pipeline.Pipeline) ... ok
test_projected_start_on_window_end_is_inside (test_pipeline.Pipeline) ... ok
test_projected_start_one_day_after_window_end_fails (test_pipeline.Pipeline) ... ok
test_run_config_holds_run_inputs_only (test_pipeline.Pipeline) ... ok
test_sha_mismatch_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_target_title_without_bls_row (test_pipeline.Pipeline) ... ok
test_title_family_note_only_when_posting_title_lacks_matched_phrase (test_pipeline.Pipeline) ... ok
test_unlabeled_rule_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_allowlist_is_substring_and_precise (test_pipeline.Rules) ... ok
test_entry_markers_and_unmarked (test_pipeline.Rules) ... ok
test_evidence_groups (test_pipeline.Rules) ... ok
test_level_tokens (test_pipeline.Rules) ... ok
test_whole_word_seniority (test_pipeline.Rules) ... ok

----------------------------------------------------------------------
Ran 28 tests in 11.882s

OK
[exit code: 0]
~~~

## Conformance

~~~text
[2026-10-03T18:44:26Z] $ node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/
conformance: 38 files (3 md · 12 py · 23 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit code: 0]

[2026-10-03T18:44:27Z] $ node scripts/conformance.mjs recipes/cases/2026fa/
conformance: 2 files (2 md)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit code: 0]
~~~

## Toolchain (after)

~~~text
[2026-10-03T18:44:27Z] $ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.21.0
  ✓ python3    Python 3.9.6

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
[exit code: 0]

[2026-10-03T18:44:27Z] $ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 198 files (90 md · 48 py · 30 js · 26 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit code: 0]
~~~

## Scope check

~~~text
[2026-10-03T18:44:31Z] $ git diff --stat origin/main...HEAD
 .../2026fa/submissions/meenuviji/CHANGE-BRIEF.md   |  144 ++
 .../2026fa/meenuviji-data-titles-h1b-entry.card.md |   89 +
 .../2026fa/meenuviji-data-titles-h1b-entry.md      |  299 +++
 .../meenuviji-data-titles-h1b-entry/README.md      |   89 +
 .../build_sample.py                                |  103 +
 .../fixtures/config-day-after-window-end.json      |   35 +
 .../fixtures/config-deferred-start.json            |   35 +
 .../fixtures/config-missing-timeline.json          |   30 +
 .../fixtures/config-opt-closed.json                |   35 +
 .../fixtures/config-window-end.json                |   35 +
 .../fixtures/duplicate-evidence.json               |   46 +
 .../fixtures/exact-with-siblings.json              |   28 +
 .../fixtures/happy.json                            |   28 +
 .../fixtures/liveness-zero.json                    |   28 +
 .../fixtures/missing-liveness.json                 |   23 +
 .../fixtures/multi-match.json                      |   28 +
 .../fixtures/next-action-pair.json                 |   46 +
 .../fixtures/no-bls-row.json                       |   46 +
 .../fixtures/no-sponsorship.json                   |   28 +
 .../fixtures/not-in-csv.json                       |   28 +
 .../fixtures/null-p.json                           |   28 +
 .../fixtures/senior-only.json                      |   28 +
 .../lib/__init__.py                                |    5 +
 .../meenuviji-data-titles-h1b-entry/lib/bls.py     |   11 +
 .../lib/classify.py                                |  116 +
 .../meenuviji-data-titles-h1b-entry/lib/gates.py   |   47 +
 .../meenuviji-data-titles-h1b-entry/lib/inputs.py  |  101 +
 .../meenuviji-data-titles-h1b-entry/lib/match.py   |   84 +
 .../lib/pipeline.py                                |  240 ++
 .../meenuviji-data-titles-h1b-entry/lib/report.py  |  244 ++
 .../lib/score_bridge.py                            |   44 +
 .../meenuviji-data-titles-h1b-entry/out/report.md  |  238 ++
 .../meenuviji-data-titles-h1b-entry/out/roles.json |  266 ++
 .../meenuviji-data-titles-h1b-entry/out/run.json   | 2736 ++++++++++++++++++++
 .../out/score/role-scores.json                     |  525 ++++
 .../out/score/role-scores.md                       |   22 +
 .../postings/sample-postings.json                  |  304 +++
 .../meenuviji-data-titles-h1b-entry/rules.json     |   98 +
 .../run-config.json                                |   35 +
 .../2026fa/meenuviji-data-titles-h1b-entry/run.py  |   44 +
 .../tests/test_pipeline.py                         |  355 +++
 41 files changed, 6794 insertions(+)
[exit code: 0]

[2026-10-03T18:44:31Z] $ git diff --name-only origin/main...HEAD
course/2026fa/submissions/meenuviji/CHANGE-BRIEF.md
recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.card.md
recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/README.md
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/config-day-after-window-end.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/config-deferred-start.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/config-missing-timeline.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/config-opt-closed.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/config-window-end.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/duplicate-evidence.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/exact-with-siblings.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/happy.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/liveness-zero.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/missing-liveness.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/multi-match.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/next-action-pair.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/no-bls-row.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/no-sponsorship.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/not-in-csv.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/null-p.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/fixtures/senior-only.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/__init__.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/bls.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/classify.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/gates.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/inputs.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/match.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/pipeline.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/report.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/score_bridge.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/score/role-scores.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/score/role-scores.md
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests/test_pipeline.py
[exit code: 0]
~~~

Paths outside the three namespaces (`scripts/contrib/2026fa/meenuviji-*`, `recipes/cases/2026fa/meenuviji-*`, `course/2026fa/submissions/meenuviji/`): **none** (41 paths checked from `--name-only`).

## Tracked-file side effects of running run.py

Yes: `run.py` modified two tracked files. `git status --short` was empty before the run. After the run, `out/report.md` and `out/run.json` show as modified. The diff below shows the only change in each is the run timestamp (`run_id` / "Run:" line). The four other files under `out/` (`roles.json`, `score/role-scores.json`, `score/role-scores.md`) were rewritten with byte-identical content. Not fixed.

~~~text
[2026-10-03T18:44:31Z] $ git status --short
 M scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
 M scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json
[exit code: 0]

[2026-10-03T18:44:31Z] $ git diff --stat
 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md | 2 +-
 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json  | 2 +-
 2 files changed, 2 insertions(+), 2 deletions(-)
[exit code: 0]

[2026-10-03T18:44:31Z] $ git diff
diff --git a/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md b/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
index c77aca4..728aa98 100644
--- a/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
+++ b/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
@@ -18,7 +18,7 @@ The sponsorship scores are ordered labels from your own rules, not probabilities
 
 ## Run record
 
-- Run: `2026-10-03T18:13:45Z` · mode: sample (offline) · status: **completed-with-stops** · exit code 3
+- Run: `2026-10-03T18:44:14Z` · mode: sample (offline) · status: **completed-with-stops** · exit code 3
 - Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`) — record
 - Wage context: `data/bls/compact/soc_occupation_compact.csv` (1016 rows) — record
 - Sample: seed 42, 2 per evidence group (your-input); evidence-group sizes in the CSV {'no-record': 28812, 'no-data-title': 1309, 'proven': 99, 'entry-under-min-approvals': 41, 'only-mid': 14, 'only-senior': 94} (record)
diff --git a/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json b/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json
index 7b06e95..d18bcad 100644
--- a/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json
+++ b/scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json
@@ -1,6 +1,6 @@
 {
   "workflow": "data-titles-h1b-entry",
-  "run_id": "2026-10-03T18:13:45Z",
+  "run_id": "2026-10-03T18:44:14Z",
   "mode": "sample (offline)",
   "inputs": {
     "postings": "scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json",
[exit code: 0]
~~~

## PII scan

Required command, working-tree mode. **Exit 1, one finding.** One alteration was made to the pasted output: the email address in the finding is replaced by `<redacted: third-party address from glob's npm deprecation notice; package-lock.json line 606>`. Pasting it verbatim would add a new email finding inside this submission folder.

~~~text
[2026-10-03T18:44:31Z] $ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted: third-party address from glob's npm deprecation notice; package-lock.json line 606>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
[exit code: 1]
~~~

Supplementary, read-only, not requested. The scanner's header (pasted below) documents a `--diff <base>` mode that scans the branch's own history. It is clean, and the finding's source line is already on `origin/main`:

~~~text
[2026-10-03T18:44:48Z] $ node scripts/pii-scan.mjs --diff origin/main
pii-scan: clean ✓
[exit code: 0]

[2026-10-03T18:44:48Z] $ git show origin/main:package-lock.json | grep -n 'izs.me'
606:      "deprecated": "Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting <redacted: third-party address from glob's npm deprecation notice; package-lock.json line 606>",
[exit code: 0]
~~~

~~~text
#!/usr/bin/env node
// pii-scan.mjs — CI + local scanner for the DATA_CONTRACT zero-conditions.
//
//   node scripts/pii-scan.mjs                  # scan the working tree
//   node scripts/pii-scan.mjs --diff <base>    # scan full branch history vs base
//                                              #   (git log -p base..HEAD — catches
//                                              #   committed-then-deleted PII)
//
// Exit 0 = clean · 1 = findings · 2 = usage/environment error.
//
// What it flags (see DATA_CONTRACT.md §Zero-Conditions):
//   - email addresses that are not @example.com/@example.org or GitHub noreply
//   - phone numbers outside the reserved 555 exchange
//   - resume-shaped files outside the sanctioned dirs (search/examples/, resumes/)
//   - .gitignore hunks weakening the resume/private/search rules
//   - .docx/.pdf documents added under data/ (the letter-of-support case)
//
// Sanctioned dirs hold ONLY the fictional personas (555 numbers, example.com).
// This scanner is deliberately noisy-by-default: a false positive costs a
// comment; a false negative costs someone their privacy.
~~~

## What the gates require a human to judge

From the recipe's phase gates (`recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md`). The run stops or notes these; it does not decide them:

- **Company-match stops (G1).**
  - `Quillfeather Data Labs, Inc.` (no match): confirm whether the company is really not in the data.
  - `Arcturus Therapeutics` (two rows, INC and LTD, both San Diego): pick the right row or confirm neither.
- **Refused missing gate values (G2).** The `CENTIFIC GLOBAL SOLUTIONS INC` posting has no liveness value. Supply one (checked live, with a date) or leave it refused. The scorer would otherwise have treated it as 1.0.
- **Timeline arithmetic (G4).** Check the inputs behind `projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02` and `window_end = 2027-05-02`. All are your-input; `hiring_lag_days` is an assumption and `window_days` is a regulatory figure to verify with the DSO.
- **Deferred-start acceptance.** All 12 scored postings carry "employer must accept a start 61 days after offer". Whether each employer accepts that is unknown and is not scored.
- **Duplicate-evidence notes.** `PATHAI INC` and `PATHRAI INC` carry identical sponsorship records. Decide which employer, if either, the evidence belongs to before acting on either posting.

