---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-run, 2026-10-21, assignments/submissions/tisaac/RUN_LOG-entry.md"
attestation: null
recipe_version: 0.1.0
---

# case-swe-stem-opt-runway — Real postings, checked sponsorship and liveness

## Executive summary

**What this is.** A step-by-step operating recipe for one job seeker: an F-1 Information Systems student starting a 3-year STEM OPT, applying for software engineering roles. It pulls the open postings from a few companies' public job boards and keeps the ones inside the student's own written scope, with a reason recorded for every posting it drops. For each posting it keeps, it answers two questions from evidence instead of guesses. Has this company sponsored H-1B workers before? Is this posting really still open? It then hands the labeled evidence to the repository's scorer for an **Apply / Consider / Skip** recommendation, and stops for a person at every check a machine cannot make.

**Why read it.** It shows exactly which commands to run, which answers come from records, which come from the student, and when the recipe refuses to score instead of guessing.

**What it found on its real runs (2026-10-21).** On 540 postings from three Boston-area and remote-US employers, it kept 23 and added 1 deliberately dead link. It caught the dead link, which the repository's own page checker had called "active". It also exposed a real error: five postings from a Boston company with 150 H-1B approvals were skipped because the posting says "Toast" and the sponsorship file says "TOAST INC". Name matching is the weakest link, so this recipe makes it a human gate. After a person resolved the name, 19 of 24 came out Apply. That is too many: without reading job descriptions, the mode can rank companies but not roles.

## Technical header

| Field | Value |
|---|---|
| Mode | `recipes/case-swe-stem-opt-runway.md` v0.1.0 |
| Stage | RUNNABLE-SAMPLE — complete runs on real postings; conformance and offline tests pass; the run report and selection audit were read. Not RUNNABLE-LIVE: the name gate was cleared by a person for one company (Toast), but the visa-timeline, ban, and title gates were not cleared for every role |
| Builds on | my earlier recipe-design submission (https://github.com/nikbearbrown/the-reallocation-engine/pull/46, offline only, not merged); its prototype was copied into `scripts/contrib/2026fa/tisaac-swe-stem-opt/` and extended |
| Engine layers | 80 Days to Stay (sponsorship + funding) · Job-Ops (ATS board + posting liveness) |
| Network | only `select-postings.mjs` (live mode) and `collect-liveness.mjs`: `boards-api.greenhouse.io` and the posting pages themselves |

## Purpose

Use this mode **when** you are considering software-engineering postings this week from companies that hire through Greenhouse, and you need to decide which deserve a tailored application. It replaces two lookups you would otherwise do by hand: searching for the company's H-1B history, and checking that the posting is still real. It does **not** read the job description, judge fit, or score salary, location, or remote work.

Persona fit: with 3 years of STEM OPT, sponsorship history is a **bonus**, not a requirement. A company missing from the file is "not found", never "doesn't sponsor".

## Source inventory

| Source | Exact path or command | Used for | Label it produces |
|---|---|---|---|
| Sponsorship + funding file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (`company_name`, `Total Approvals`, `total_funding`) | sponsorship vote | `record`; `your-input` when absent |
| Greenhouse board provider | `scripts/ats/providers/greenhouse.mjs` + `scripts/ats/providers/_http.mjs` (public board API) | is the job id still on the board | `record` |
| Page liveness check | `scripts/ats/liveness-browser.mjs` — the same check as `npm run ats:liveness -- <url>` | does the page look open | `record` |
| Scorer (reused, not modified) | `scripts/score/role-scorer.mjs` (`npm run score`) | votes × gates → recommendation | — |
| Scope (the student's rules) | `scripts/contrib/2026fa/tisaac-swe-stem-opt/scope.json`: boards, title/level/specialist/US-location rules, `csv_name`, default `fit` / `timeline`, break jobs | which postings are in scope | `your-input` |
| Posting selector (this mode) | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs [--from-snapshot <dir>] [--out-dir <dir>] [--date YYYY-MM-DD]` | board snapshot → job list + selection audit | — |
| Board snapshot + selection audit | `scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21/*.raw.json`, `postings-2026-10-21-audit.md` | every posting listed, kept or dropped, and why | `record` (snapshot) |
| Job list | `scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json` | the selected postings + the student's `fit`, `timeline`, `csv_name` | mixed, per field (see *Inputs*) |
| Liveness collector (this mode) | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs <jobs.json> --out <liveness.json>` | writes the liveness evidence file | — |
| Mode runner (this mode) | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture <jobs.json> --liveness <liveness.json> --out-dir <dir>` | lookup, gates, scorer, reports | — |
| Offline tests | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.test.mjs` (13 checks) · `node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.test.mjs` (21 checks) | runner and filter, no network | — |

Run order, from the repo root:

```bash
npx playwright install chromium        # once, for the page check
node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --date 2026-10-21
#   → re-run offline later with: --from-snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21
node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs \
  --jobs scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json \
  --out  scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js \
  --fixture  scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json \
  --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json \
  --out-dir  assignments/submissions/tisaac/run-3-name-resolved
```

## Inputs (per posting)

| Field | Meaning | Label |
|---|---|---|
| `company`, `title`, `location`, `url` | as shown on the posting | `record` (copied from the board API) |
| `greenhouse_board`, `greenhouse_job_id` | where the posting lives on Greenhouse | `record` |
| `csv_name` (optional) | the legal name in the sponsorship file, matched **by a person** | `your-input` |
| `fit` | skills/background match, 0–1. This run: 0.5 = "JD not read yet" | `your-input` |
| `timeline` | can hiring finish inside the OPT window, 0–1 | `your-input` |

## Phase gates

A role reaches an application only after every gate below is cleared for it.

| Gate | Hard stop | Testable condition | Who clears it |
|---|---|---|---|
| **G1 Liveness** | Job id **not** on the Greenhouse board → liveness `0` (record) → Skip, even if the page check says active. On the board **and** page check `active` → `1` (record). On the board but the page says `expired`/`uncertain`, or no board signal → **held, not scored** | G1 command below exits 0 | machine; a person decides each held role |
| **G2 Visa timeline** | `timeline` is the student's own input; `0` closes the gate | G2 command below exits 0, and the person has compared OPT dates with the start date | the student |
| **G3 Name match** | Every `no-matched` company must be searched by hand in the CSV before its 0 is trusted. A match found by hand goes into `csv_name` and is labeled `your-input` | `mode-run.json` → `no_matched` is empty, or each name has a written decision | the student |
| **G4 International-student ban** | JD says "US citizens only", "no sponsorship now or in the future", or needs a clearance → Skip | the person has read the JD | the student |
| **G5 Excluded titles** | Data / ML-specialist titles → Skip (the student's own scope) | the person has read the title | the student |

```bash
# G1 — every role whose liveness gate is closed was skipped, and nothing held was scored
node -e "const d='assignments/submissions/tisaac/run-3-name-resolved/'; const s=require('./'+d+'role-scores.json').roles, run=require('./'+d+'mode-run.json'); for (const x of s) { const g=x.trace.gates.find(g=>g.factor==='liveness'); if (g.multiplier<=0.05 && x.recommendation!=='Skip') { console.error('G1 FAIL', x.role_id); process.exit(1) } } for (const h of run.held) if (s.some(x=>x.role_id===h.role_id)) { console.error('G1 FAIL held but scored', h.role_id); process.exit(1) } console.log('G1 ok')"

# G2 — every scored role carries a numeric timeline the student supplied
node -e "const r=require('./assignments/submissions/tisaac/run-3-name-resolved/my-roles.json'); if (r.some(x=>typeof x.timeline.factor!=='number' || x.timeline.source!=='your-input')) { console.error('G2 FAIL'); process.exit(1) } console.log('G2 ok')"
```

## Votes

| Vote | Weight (scorer default) | How it is set | Label |
|---|---|---|---|
| Sponsorship | 0.35 | `Total Approvals` > 0 → 0.8 (`h1b-history`) · else `total_funding` > 0 → 0.4 (`form-d-funding`) · in the file with neither → 0 (`none`) | `record`, with `matched_on` saying whether the posting name or a person's `csv_name` found the row |
| | | not in the file → 0 (`no-matched`) | `your-input` |
| Fit | 0.3 | copied from the job list | `your-input` |
| Role quality | 0 (scorer default, unpinned) | not produced | — |

## What it can and cannot verify

| Can verify (record or deterministic check) | Cannot verify |
|---|---|
| Whether the job id is on the company's Greenhouse board right now | Whether a non-Greenhouse posting is open (it is held, not guessed) |
| Whether the posting page looks open (page check) — **but a dead job id that redirects to a job-search page reads as "active"**, so the board signal overrides it | What the JD says: fit, sponsorship bans, clearance requirements |
| Whether a name appears in the sponsorship file, exactly | Whether "Toast" on a posting is "TOAST INC" in the file. That is a person's judgment (G3), and the file's own fields can disagree (its `website` for TOAST INC is `toast.com`, not `toasttab.com`) |
| That row's `Total Approvals` and `total_funding` | Whether **this** role will sponsor; the file shows only company history |
| The scorer's arithmetic, term by term | Salary, location, remote work, AI-resilience |
| That a missing input, or disagreeing liveness signals, stop scoring for that role (offline test) | Whether `timeline = 1.0` is true for this student |
| That the posting filter follows `scope.json` exactly, gives the same selection on the same snapshot, and accounts for every listed posting (offline test, audit) | Whether `scope.json` itself is right (for example, whether an "AI Engineer" title belongs in scope). The student judges that by reading the audit |
| | Anything about postings on boards outside `scope.json`, or on non-Greenhouse ATSs |

## Proposed additions

This mode adds four things the repo did not have. All four are built and ran; none is left open.

| Addition | Why it belongs | Where |
|---|---|---|
| A board-based liveness signal, combined with the page check | The page check alone called a non-existent job id "active" (a redirect to the company's search page). The board API answers the same question from a record | `scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs` |
| A posting selector with a written scope and a per-posting audit | Choosing postings by hand cannot be repeated or checked. The first hand-written filter dropped "Software Engineer - Data Automation", missed titles with a double space, and read "Remote - California" as non-US. The audit is how those errors were found | `select-postings.mjs`, `scope.json`, `postings-<date>-audit.md`, `select-postings.test.mjs` |
| A **held** outcome: refuse to score when liveness signals disagree or are missing | The scorer has no "unknown"; without a hold, a doubtful posting would get a confident Apply or Skip | `index.js` → `mode-run.json` `held`, `mode-report.md` |
| `csv_name`, a person's own legal-name match, labeled as such | Exact name matching missed a 150-approval sponsor in the first real run | job list field; `matched_on` in the evidence |

## Output contract

| File (in `--out-dir`) | Reader | Contents | Decision it enables |
|---|---|---|---|
| `mode-run.json` | agent | `inputs`, `counts`, `held[]` (role, reason), `no_matched[]`, `scored[]` (recommendation, composite, reason) | machine checks at G1 / G3; what to re-run |
| `my-roles.json` | agent / scorer | per role: `sponsorship {p, tier, source, matched_on}`, `fit`, `liveness {factor, source, detail}`, `timeline` | audit of every label |
| `role-scores.json` | agent | scorer log with per-term trace and arithmetic | G1 check |
| `mode-report.md` | the student | one-line summary; scored table with liveness and sponsorship labels; held roles with what to check; not-found names; remaining gates | which postings get an application today |
| `role-scores.md` | the student | the scorer's term-by-term audit table | why each recommendation came out |

## Stop conditions

| Condition | Behavior |
|---|---|
| Job list missing, or a job missing `id` / `company` / `title` / `url` / `fit` / `timeline` | exit 1, names the field, writes nothing |
| Liveness evidence file named but missing | exit 1 |
| Sponsorship file missing, or the scorer fails | exit 1 |
| A job has no liveness evidence, no board signal, or the two signals disagree | **refuse to score that role**: listed under *Held* with the reason; the rest of the batch continues |
| Job id not on the board | not a refusal: the board is a record, so liveness 0 → Skip |
| All jobs processed | normal stop; the person takes over at G2–G5 |

## Next action per result (the 3-3-2 day)

| Result | Next action |
|---|---|
| **Apply** | clear G2–G5, then tailor and apply (the 2 research-and-apply hours) |
| **Consider** | find a person at the company first (the 3 networking hours) |
| **Skip** (gated) | no time spent; the posting is gone |
| **Skip** (low score) with a `no-matched` company | do G3 first: the skip may be a name miss, not a non-sponsor |
| **Held** | open the URL yourself once; if open, record that and re-run |

## Log template (`logs/RUN_LOG.md` format)

Format from `recipes/_shared.md`. For student PRs, `logs/RUN_LOG.md` is a protected path, so the entry is filed with the submission instead.

```markdown
## YYYY-MM-DD — case-swe-stem-opt-runway run <n>

- **Recipe:** recipes/case-swe-stem-opt-runway.md v<version> (status <status>)
- **Inputs:** <jobs.json> (<N> public Greenhouse postings, fetched <date>); <liveness.json> (checked <ISO time>); data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
- **Outputs:** <out-dir>/mode-run.json, mode-report.md, my-roles.json, role-scores.json, role-scores.md
- **Result:** <N → Apply a · Consider b · Skip c · Held h; skip rate; offline test x/y>
- **Open issues:** <gates not cleared by a person; no-matched names; signal disagreements>
```
