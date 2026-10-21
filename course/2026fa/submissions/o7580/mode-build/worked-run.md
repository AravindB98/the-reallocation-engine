# Worked run — design-engineer SOC triage, 2026-10-19

## Executive summary

**What this is.** The record of running this mode against real data on 19 October 2026: 17 company job boards, 1,373 open jobs, the full sponsorship file and the full occupation table. It also records every check made to prove the output was real, including eight deliberate attempts to break it.

**Why read it.** Every number in the mode's documents traces back to a command pasted here, verbatim.

**What it found.**
- Only 2 of the 1,373 jobs passed a Boston-or-remote design-engineer filter. One was an industrial-design job that only said "designer".
- On the 9 US postings checked, the mode dropped 2 as out of lane and left 1 for a person to open. It recommended tailoring for 2 (both at one employer), a conversation first for 1, and skipping 3. Two of the skips were "New Grad" design roles that accept only 2027 graduates.
- It refused an AI-resilience score for 4 postings, because the government row is blank.
- The break attempts found two real bugs in the harness and the tool, both fixed and listed below.

**Update, 2026-10-20.** The author approved every posting field, job family, employer match and fit value, and signed the attestation after re-running the tests. On 2026-10-21 a classifier fix voided that signature; the author re-ran both commands and re-signed the same day. A later privacy correction (fictional persona) voided it again, and the author re-signed after re-running both commands. With those confirmed inputs, the re-run gives Apply 2 · Consider 2 · Skip 3, plus 2 out of lane (§2.9). The author's reflection is recorded in §5.

## Run record

- **Recipe:** `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md` v0.1.0 (status DRAFT)
- **Mode:** live: real boards, real postings, real liveness, the full shipped CSV and BLS tables
- **Repository:** fresh worktree of `nikbearbrown/the-reallocation-engine` at `015843d` (upstream `main`), `npm ci` (lockfile untouched)
- **Who ran what:** the AI agent (Claude) ran every command below and drafted every posting field and fit value. The author chose the domain and must still clear the human gates (see the end).

## 1. Inputs

| Input | Value | Source / label |
|---|---|---|
| Persona | **Fictional** ("Ananya Iyer", per DATA_CONTRACT §Zero-Conditions): F-1, STEM M.S. ending 2026-12-12, OPT requested from 2027-01-04, 90-day ceiling, 0 days used, 14-day buffer, 24 months' experience, two-case-study portfolio | your-input. Not a real person; no contacts or résumé text in any tracked file |
| Boards | 17 public boards: 9 at-level design-title sponsors, 3 senior-only design sponsors, 5 Greater-Boston employers. Rule written in the portals file **before** the scan | `scripts/contrib/…/scenarios/portals.design-engineer{,.all-us}.yml` |
| Postings | Every US-located title match from the all-US scan, **including** the false positive: 9 postings | `scenarios/design-engineer.live.json` |
| Posting fields | Graduation window, clearance statement, experience minimum: each with a short quote, transcribed by the agent from the public posting JSON | your-input **once confirmed**; `confirmed_by: null` today |
| Fit | 0.4–0.6 per posting, with a one-line basis, drafted by the agent | **model-judgment** until confirmed (the scorer input says so) |
| Sponsorship file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, 30,369 rows | record |
| Occupation table | `data/bls/compact/soc_occupation_compact.csv`, 1,016 rows | record |
| Liveness | 10 URLs: the 9 postings plus one deliberately invalid Palantir ID | record |

## 2. Commands and real output

### 2.0 Toolchain baseline (before any change)

`npm run verify`

```text

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

`npm run score -- data/examples/ch11-roles.json --out-dir <tmp>`: the maintained scorer reproduces its Ch.11 example.

```text

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /var/folders/w1/1m43m_rj08l59nztff6fmwzm0000gn/T/tmp.NlI8MyS9PP

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  ../../../../var/folders/w1/1m43m_rj08l59nztff6fmwzm0000gn/T/tmp.NlI8MyS9PP/role-scores.json  +  ../../../../var/folders/w1/1m43m_rj08l59nztff6fmwzm0000gn/T/tmp.NlI8MyS9PP/role-scores.md
```

### 2.1 ATS scan, first pass (metro filter) — 5 boards failed

`REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/portals.design-engineer.yml npm run ats:scan -- --dry-run`

```text

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 17 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     17
Total jobs found:      1359
Filtered by title:     1340 removed
Filtered by location:  17 removed
Duplicates:            0 skipped
New offers added:      2

Errors (5):
  ✗ Rippling: HTTP 404: Not Found
  ✗ Scribd: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ Remitly: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ DraftKings: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ Databento: HTTP 404: Not Found

New offers:
  + Toast | Software Engineer II, Frontend  | Remote, US 
  + Formlabs | Industrial Designer | Somerville, MA

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

### 2.2 ATS provider detection on the failed boards

```text
$ cd scripts/ats && python3 detect-ats.py Rippling Scribd Remitly DraftKings Databento --output <tmp>/ats-detect.csv
2026-10-19 15:59:55 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://boards-api.greenhouse.io/v1/boards/rippling/jobs
2026-10-19 15:59:56 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://api.lever.co/v0/postings/rippling
[1/5] Rippling -> none (0 jobs)
2026-10-19 15:59:56 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://boards-api.greenhouse.io/v1/boards/scribd/jobs
2026-10-19 15:59:56 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://api.lever.co/v0/postings/scribd
[2/5] Scribd -> none (0 jobs)
2026-10-19 15:59:56 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://boards-api.greenhouse.io/v1/boards/remitly/jobs
2026-10-19 15:59:57 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://api.lever.co/v0/postings/remitly
[3/5] Remitly -> none (0 jobs)
2026-10-19 15:59:57 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://boards-api.greenhouse.io/v1/boards/draftkings/jobs
2026-10-19 15:59:57 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://api.lever.co/v0/postings/draftkings
[4/5] DraftKings -> none (0 jobs)
[5/5] Databento -> greenhouse (14 jobs)
exit 0
--- <tmp>/ats-detect.csv
company_name,ats_platform,ats_slug,ats_url,ats_api_url,open_job_count,detection_status,detected_at,attempt_count
Rippling,,rippling,,,0,not_found,2026-10-19T19:59:56.022816+00:00,2
Scribd,,scribd,,,0,not_found,2026-10-19T19:59:56.541976+00:00,2
Remitly,,remitly,,,0,not_found,2026-10-19T19:59:57.063007+00:00,2
DraftKings,,draftkings,,,0,not_found,2026-10-19T19:59:57.588824+00:00,2
Databento,greenhouse,databento,https://boards.greenhouse.io/databento,https://boards-api.greenhouse.io/v1/boards/databento/jobs,14,found,2026-10-19T19:59:57.720987+00:00,1
```

Databento is on Greenhouse, not Ashby as I had guessed. The portals file was corrected, with a dated comment, and both scans re-ran. The other four are on neither provider the detector knows; that is proposal 6.

### 2.3 ATS scan, final — metro filter (Boston / Massachusetts / remote-US)

```text

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 17 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     17
Total jobs found:      1373
Filtered by title:     1354 removed
Filtered by location:  17 removed
Duplicates:            0 skipped
New offers added:      2

Errors (4):
  ✗ Rippling: HTTP 404: Not Found
  ✗ Scribd: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ Remitly: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ DraftKings: HTTP 404: {"status":404,"error":"Job not found"}

New offers:
  + Toast | Software Engineer II, Frontend  | Remote, US 
  + Formlabs | Industrial Designer | Somerville, MA

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

### 2.4 ATS scan, final — all-US pass (block list only), the scenario's source

`REALLOCATION_ENGINE_PORTALS=…/portals.design-engineer.all-us.yml npm run ats:scan -- --dry-run`

```text

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 17 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     17
Total jobs found:      1373
Filtered by title:     1354 removed
Filtered by location:  2 removed
Duplicates:            4 skipped
New offers added:      13

Errors (4):
  ✗ Rippling: HTTP 404: Not Found
  ✗ Remitly: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ Scribd: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ DraftKings: HTTP 404: {"status":404,"error":"Job not found"}

New offers:
  + Asana | Product Designer | Vancouver, BC
  + Asana | Product Designer, Coordinate | Warsaw
  + Squarespace | Software Engineer, Frontend  | New York City
  + Formlabs | Industrial Designer | Somerville, MA
  + Formlabs | Industrial Designer (Shenzhen) | Asia Pacific
  + Toast | Product Designer | Chennai
  + Toast | Software Engineer II, Frontend  | Remote, US 
  + Toast | Territory Account Executive, Retail - Sioux Falls | Sioux Falls, SD
  + Palantir Technologies | Product Designer - US Government | New York, NY
  + Palantir Technologies | Product Designer, New Grad | New York, NY
  + Palantir Technologies | Product Designer, New Grad - US Government | Washington, D.C.
  + Palantir Technologies | Software Engineer - Frontend Developer Productivity | New York, NY
  + Palantir Technologies | Web Design Engineer | New York, NY

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

Two scanner defects are visible here, with no editing on my part:
- "Territory Account Executive, Retail - Sioux Falls" matched the keyword `ux` inside "Sioux".
- Vancouver BC, Warsaw, Chennai and "Asia Pacific" passed because the location filter is substring-based and my block list missed them.

The scenario keeps only US-located rows, and keeps the Sioux Falls row on purpose.

### 2.5 Liveness (a gate) — saved verbatim as the triage's input

```text
# ran: 2026-10-19 15:48 local
# command: npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.urls.txt

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.urls.txt

Checking 10 URL(s)...

✅ active     https://careers.toasttab.com/jobs?gh_jid=8224111
⚠️ uncertain  https://careers.formlabs.com/job/8249032/apply/?gh_jid=8249032
           content present but no visible apply control found
⚠️ uncertain  http://www.squarespace.com/about/careers?gh_jid=8019365
           content present but no visible apply control found
✅ active     https://jobs.lever.co/palantir/4c0fb3a1-8256-4d14-9a27-23727235752e
✅ active     https://jobs.lever.co/palantir/25378ba0-db78-4c70-8174-a05ce514fc65
✅ active     https://jobs.lever.co/palantir/c2d11af1-5b84-4be0-92ac-36113fb8f2b5
✅ active     https://jobs.lever.co/palantir/71ed917e-850a-484b-9454-fa66bdf24540
✅ active     https://jobs.lever.co/palantir/a3eaa0ef-3378-495f-8308-edbd9a93d26c
✅ active     https://careers.toasttab.com/jobs?gh_jid=7930749
❌ expired    https://jobs.lever.co/palantir/00000000-dead-4bad-8bad-000000000000
           HTTP 404

Results: 7 active  1 expired  2 uncertain
# exit: 1
```

The last URL is the deliberately invalid ID, and it reads `expired`. Formlabs and Squarespace read `uncertain`: their career pages wrap the Greenhouse form, and the checker finds no apply control.

### 2.6 Whole-file audit

`node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs --state MA`

```text
✓ design-title audit — 1557 sponsor rows; naive "design" titles 119 (65 out of lane); ux-design at-level ≥3: 26 national, 0 in MA; blank pivot rows 122
  wrote course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live/design-title-audit.md + .json
```

## Findings

| Measure | Count |
|---|---:|
| Company rows in the file | 30369 |
| …with an H-1B approvals value | 1557 |
| Sponsored titles containing "design" (naive filter) | 119 (at 110 companies) |
| …of which out of a design-engineer lane | 65 |
| &nbsp;&nbsp;"design" titles classified ux-design | 54 |
| &nbsp;&nbsp;"design" titles classified hardware-design | 29 |
| &nbsp;&nbsp;"design" titles classified ambiguous-design | 16 |
| &nbsp;&nbsp;"design" titles classified management | 9 |
| &nbsp;&nbsp;"design" titles classified graphic-brand | 8 |
| &nbsp;&nbsp;"design" titles classified architecture | 2 |
| &nbsp;&nbsp;"design" titles classified industrial-design | 1 |
| Sponsors listing a ux-design title | 52 (at level 31, ≥3 approvals 26; senior-only 21) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 1 — RATEGRAVITY INC (2) |
| …in MA: senior-only | 2 — BRIGHTCOVE INC (36); MODO LABS INC (4) |
| Sponsors listing a hybrid-design-engineering title | 3 (at level 1, ≥3 approvals 1; senior-only 2) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 0 |
| …in MA: senior-only | 1 — DATABENTO INC (6) |
| Sponsors listing a ui-engineering title | 19 (at level 14, ≥3 approvals 10; senior-only 5) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 1 — MYTIDE THERAPEUTICS INC (2) |
| …in MA: senior-only | 0 |
| BLS/O*NET rows with a blank Cognitive Pivot score | 122 of 1016 |

## Occupation rows this mode reads

| O*NET-SOC | Title | National median | Cognitive Pivot |
|---|---|---:|---:|
| 15-1252.00 | Software Developers | $133,080 | 3.834 |
| 15-1254.00 | Web Developers | $90,930 | 3.584 |
| 15-1255.00 | Web and Digital Interface Designers | $98,090 | **blank** |
| 15-1255.01 | Video Game Designers | $98,090 | 3.792 |
| 27-1021.00 | Commercial and Industrial Designers | $79,450 | 3.96 |
| 27-1024.00 | Graphic Designers | $61,300 | 3.264 |

Alternate-title samples shared by 15-1254.00 and 15-1255.00 (the shipped 8-title samples only): Computer Graphic Artist; Computer Graphic Designer; Front End Developer.

In Massachusetts, the count of at-level design-lane sponsors with ≥3 approvals is **zero across all three families**. The first audit pass showed one ui-engineering row (NewStore), which was the classifier misfiring on "Solution Engineer Frontend/Backend - Field Services". That was fixed on 2026-10-21 (see "Broke during testing, fixed").

### 2.7 Triage (gates G0–G5 + the maintained scorer)

`node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs`

```text
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2026-10-19
  evaluated 9 → out of lane 2 · not scored 1 · scored 6 (Apply 2 · Consider 1 · Skip 3)
  skip rate of decided roles 0.625 · Cognitive Pivot refusals 4
  scorer: ✓ scored 6 roles → Apply 2 · Consider 1 · Skip 3 (skip 50%)
  wrote course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live/triage-log.json + triage-report.md
```

The scorer's own report, unchanged (`role-scores.md`):

# Role Scorer report — 2026-10-21

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 6 roles → Apply 2 · Consider 1 · Skip 3. **Skip rate 50%** (healthy — a good run skips at least half).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| PALANTIR TECHNOLOGIES INC — Web Design Engineer | 0.495 | **Apply** | composite 0.495 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| PALANTIR TECHNOLOGIES INC — Software Engineer - Frontend Developer Productivity | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| TOAST INC — Software Engineer II, Frontend | 0.360 | **Consider** | above threshold (0.360) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.5·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer, New Grad | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [model-judgment] × liveness 1[record]×timeline 0[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer, New Grad - US Government | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.4·0.3 [model-judgment] × liveness 1[record]×timeline 0[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer - US Government | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.4·0.3 [model-judgment] × liveness 1[record]×timeline 0[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*

From the human report (`triage-report.md`):

## Decisions and next actions

| Posting | Family (lane) | Outcome | Composite | Next action |
|---|---|---|---|---|
| Toast Inc — Software Engineer II, Frontend | ui-engineering (in) | **Consider** | 0.360 | NETWORK FIRST: the sponsorship record is soft — sponsors ui-engineering-matched titles, but only above this candidate's level. Ask about it in a 20-minute informational conversation, then decide. |
| Formlabs Inc — Industrial Designer | industrial-design (out) | **Skip (out of lane)** | — | DROP: physical-product industrial design, not software interface design. Not this mode's lane — no sponsorship lookup or scoring is spent on it. |
| Squarespace Inc — Software Engineer, Frontend | ui-engineering (in) | **Not scored** | — | HUMAN CHECK: open the posting in a browser, confirm it is live, and record the result in the liveness log. |
| Palantir Technologies Inc — Product Designer, New Grad | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Product Designer, New Grad - US Government | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Product Designer - US Government | ux-design (in) | **Skip** | 0.000 | SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time. |
| Palantir Technologies Inc — Software Engineer - Frontend Developer Productivity | ui-engineering (in) | **Apply** | 0.465 | TAILOR: lead with the portfolio piece that shows shipped interface code, not only mockups; ask for a referral first. |
| Palantir Technologies Inc — Web Design Engineer | hybrid-design-engineering (in) | **Apply** | 0.495 | TAILOR: lead with the portfolio piece that shows shipped interface code, not only mockups; ask for a referral first. |
| Toast Inc — Territory Account Executive, Retail - Sioux Falls | unrelated (out) | **Skip (out of lane)** | — | DROP: no design or front-end term at a word boundary — a keyword-scanner false positive. Not this mode's lane — no sponsorship lookup or scoring is spent on it. |

## The SOC question: what the classification puts at stake

For each in-lane posting: the occupation codes it could be filed under for a visa petition, each code's national median wage (BLS OEWS) and its AI-resilience score (Cognitive Pivot: the mean of nine O*NET reasoning, judgment and systems ratings, on O*NET's 0–7 level scale). Which code the employer actually files is **not** in any shipped file.

| Posting | SOC risk | Candidate SOC → median wage · Cognitive Pivot | Wage gap across candidates |
|---|---|---|---|
| Toast Inc — Software Engineer II, Frontend | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Squarespace Inc — Software Engineer, Frontend | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Palantir Technologies Inc — Product Designer, New Grad | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Product Designer, New Grad - US Government | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Product Designer - US Government | spans computer and arts-and-design occupations | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>27-1021.00 Commercial and Industrial Designers: $79,450 · 3.96<br>27-1024.00 Graphic Designers: $61,300 · 3.264 | $36,790 |
| Palantir Technologies Inc — Software Engineer - Frontend Developer Productivity | computer occupations only | 15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |
| Palantir Technologies Inc — Web Design Engineer | computer occupations only | 15-1255.00 Web and Digital Interface Designers: $98,090 · **refused (blank)**<br>15-1254.00 Web Developers: $90,930 · 3.584<br>15-1252.00 Software Developers: $133,080 · 3.834 | $42,150 |

### 2.8 Tests

`node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs`

```text
ok 1 - hardware "design engineer" titles never reach the UX families
ok 2 - the "Sioux" trap: a word-boundary classifier does not read "ux" inside a place name
ok 3 - the audit misfire stays fixed: a field solutions role is not front-end engineering
ok 4 - lane families and levels for real posting titles
ok 5 - an ambiguous title is not scored; an override needs a basis
ok 6 - sponsorship is family-matched and level-matched
ok 7 - a blank approvals field is absence of a record, never zero
ok 8 - company resolution is exact; state only breaks a tie
ok 9 - 15-1255.00 is refused, and its sibling 15-1255.01 score is NOT borrowed
ok 10 - a missing SOC row is reported, not filled
ok 11 - eligibility gate: 2027-only grad window, clearance, and the OPT clock close; a 3+ years ask only flags
ok 12 - an AI-drafted fit is labeled model-judgment until a person confirms it
ok 13 - end to end on fixtures: outcomes, labels, and the real scorer
ok 14 - G0: a corrupt scenario exits 2 and writes nothing
ok 15 - G0: a persona without an OPT start date is refused, not defaulted
ok 16 - a temp out-dir reached through a symlink (macOS /var → /private/var) is accepted
ok 17 - out-dir outside the contributor namespaces is refused (also when the repo itself sits in the temp dir)
# tests 17
# pass 17
# fail 0
```

### 2.9 Re-run with the author's confirmed inputs (2026-10-20)

On 2026-10-20 the author approved the agent's re-check sheet unchanged. In that re-check, every quoted posting field matched the saved posting text word for word. The author also approved every lane, employer match and fit value. The two `uncertain` postings were opened in a browser and both showed an apply control. They were recorded as a human check *appended* to a copy of the liveness log (`design-engineer.liveness.confirmed.log`); the checker's verbatim lines are unchanged.

`node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --scenario …/scenarios/design-engineer.confirmed.json --liveness-log …/scenarios/design-engineer.liveness.confirmed.log --out-dir course/2026fa/submissions/o7580/mode-build/runs/2026-10-20-confirmed`

```text
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2026-10-20
  evaluated 9 → out of lane 2 · not scored 0 · scored 7 (Apply 2 · Consider 2 · Skip 3)
  skip rate of decided roles 0.556 · Cognitive Pivot refusals 4
  scorer: ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
  wrote course/2026fa/submissions/o7580/mode-build/runs/2026-10-20-confirmed/triage-log.json + triage-report.md
```

# Role Scorer report — 2026-10-21

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 7 roles → Apply 2 · Consider 2 · Skip 3. **Skip rate 43%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| PALANTIR TECHNOLOGIES INC — Web Design Engineer | 0.495 | **Apply** | composite 0.495 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| PALANTIR TECHNOLOGIES INC — Software Engineer - Frontend Developer Productivity | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| TOAST INC — Software Engineer II, Frontend | 0.360 | **Consider** | above threshold (0.360) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| SQUARESPACE INC — Software Engineer, Frontend | 0.360 | **Consider** | above threshold (0.360) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer, New Grad | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 0[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer, New Grad - US Government | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.4·0.3 [your-input] × liveness 1[record]×timeline 0[your-input] |
| PALANTIR TECHNOLOGIES INC — Product Designer - US Government | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.4·0.3 [your-input] × liveness 1[record]×timeline 0[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*

*Note: the report's "Gates waiting on a person" checklist is generated the same way on every run. The author's decisions are recorded in `logs/runs/2026fa-o7580-2.md` §Gate decisions, which is authoritative.*

What changed from 2.7:
- Squarespace is now scored, as **Consider**: it sponsors front-end-matched titles only above this level.
- Every fit term is now labeled `your-input` instead of `model-judgment`.
- **The scorer's own skip rate is 43%**, below the 50% a healthy run skips. Counting the two out-of-lane drops, 5 of 9 decided postings were dropped or skipped (0.556). The recipe's stop condition says to report this rather than tune the rules. The likeliest reason is that the scan's title filter already removed most off-target jobs before scoring (1,354 of 1,373), so the scored set was pre-selected to look in-lane.

## 3. Verified vs inferred — line by line

| # | Statement in the output | Verified (record or script) | Inferred / judged (by whom) |
|---|---|---|---|
| 1 | 13 of 17 boards loaded, 1,373 jobs, 19 title matches, 2 survive the metro filter | ✅ `ats:scan` stdout (§2.3–2.4) | — |
| 2 | Which 17 boards to scan | — | ✅ Agent's selection rule, written before the scan; the author should confirm it fits their search |
| 3 | Databento's board is on Greenhouse; Rippling/Scribd/Remitly/DraftKings are not on Greenhouse or Lever | ✅ `detect-ats.py` (§2.2) | — |
| 4 | Each posting's lane family (e.g. Web Design Engineer → hybrid) | ✅ fixed rules in `lib.mjs`, reproducible | ✅ **The rules themselves are a judgment** (agent-written). G1 asks the author to confirm each family |
| 5 | Candidate SOCs per family (ux-design → 15-1255 / 27-1021 / 27-1024) | Partly: the O*NET samples put "Front End Developer" under both 15-1254 and 15-1255 | ✅ Domain mapping (agent), labeled your-input; proposals 1–2 would make it a record |
| 6 | Wages and Cognitive Pivot per SOC; 15-1255.00 blank | ✅ BLS compact row values, cross-checked by Python (B8) | — |
| 7 | Employer match (e.g. TOAST INC, Boston, MA) | ✅ exact-normalized match, single row | The author must confirm the entity (G2) |
| 8 | Sponsorship tier (Palantir Proven; Toast Likely, senior-only) | ✅ approvals and top-titles from the CSV, fixed family + level rule | `tier_p` and `min_approvals_for_proven = 3` are your-input parameters |
| 9 | Liveness factor (7 active, 2 uncertain, 1 expired) | ✅ `ats:liveness` stdout | Whether an "active" page is a real opening is **not** verified |
| 10 | "Must be planning on graduating in 2027" closes the gate on both Palantir new-grad roles | The quote is in the public posting JSON (re-checked verbatim 2026-10-20) | Transcribed by the agent; approved by the author 2026-10-20 from the re-check sheet; **re-opened and checked by the author himself 2026-10-21** |
| 11 | Clearance requirement closes the gate on both US-Government roles | The quote is in the posting JSON | ✅ Agent transcription, plus a judgment that clearance eligibility excludes an F-1 candidate. That needs the international student office, not this tool |
| 12 | "3+ years" flags on Toast and Squarespace | The quote is in the posting JSON | ✅ Agent transcription; that it's a flag and not a gate is a design choice (recipe) |
| 13 | Fit 0.4–0.6 | — | ✅ Drafted by the agent, **accepted unchanged by the author 2026-10-20**; labeled `your-input` in the confirmed re-run (§2.9) |
| 14 | Composite and Apply/Consider/Skip | ✅ maintained scorer, arithmetic shown | It inherits every judged input above, so two "Apply" rows rest on agent-drafted fit |
| 15 | Hiring lag 45 days, OPT dates, 14-day buffer | — | ✅ your-input assumptions |
| 16 | "In MA, 0 at-level design-lane sponsors with ≥3 approvals" | ✅ audit + independent Python count (B8) | Depends on the truncated top-titles list. "None listed" is not "none sponsored" |
| 17 | Next-action text ("lead with shipped interface code", "ask which SOC") | — | ✅ Agent-written advice templates, not evidence |

**Model judgments in the scored output: 6** (every fit value). **Records altered by hand: 0.**

## 4. Verification — how I know the output is real

- **Dry run first.** Every scan used `--dry-run`. The one writing run, needed to get URLs, wrote only to the gitignored `data/ats/` in the throwaway worktree.
- **Parsed every JSON.** `npm run verify` covers untracked files (158 → 169 files), and an explicit `node scripts/conformance.mjs` over the mode's paths passes 32 files:

```text
conformance: 32 files (10 md · 1 sh · 15 json · 4 js · 2 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

- **Cross-checked counts against the source with a different parser.** Python's `csv` + `ast` (B8 below) reproduces 30,369 rows, 1,557 sponsor rows, 119 "design" titles and 122 blank Cognitive Pivot rows. The 15-1255.00 field is literally the empty string.
- **Re-ran and diffed.** B7: a fresh run is byte-identical to the saved run in all five outputs, once timestamps and the out-dir path are normalized.
- **Used the real scorer, not a copy.** The triage calls `scripts/score/role-scorer.mjs` as a CLI. Its `role-scores.md` is pasted above unchanged.
- **Deliberately tried to break it**, on the real data:

```text
# Break attempts — design-engineer SOC triage v0.1.0 — run 2026-10-21
# Harness: scripts/contrib/2026fa/o7580-design-engineer-soc-triage/break-tests.sh (bash). Each block: command, verbatim output, exit code.

## B1 Time shift: same live postings, as of 2027-03-01 with 56 OPT unemployment days used
$ node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --as-of 2027-03-01 --days-used 56 --out-dir course/2026fa/submissions/o7580/mode-build/runs/2027-03-01-timeshift
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2027-03-01
  evaluated 9 → out of lane 2 · not scored 1 · scored 6 (Apply 0 · Consider 0 · Skip 6)
  skip rate of decided roles 1 · Cognitive Pivot refusals 4
  scorer: ✓ scored 6 roles → Apply 0 · Consider 0 · Skip 6 (skip 100%)
  wrote course/2026fa/submissions/o7580/mode-build/runs/2027-03-01-timeshift/triage-log.json + triage-report.md
exit 0
  toast-swe2-frontend → Skip | unemployment-clock-exceeded
  squarespace-swe-frontend → Not scored | unemployment-clock-exceeded
  palantir-pd-newgrad → Skip | grad-window-excludes, unemployment-clock-exceeded
  palantir-pd-newgrad-usgov → Skip | grad-window-excludes, requires-clearance-or-citizenship, unemployment-clock-exceeded
  palantir-pd-usgov → Skip | requires-clearance-or-citizenship, unemployment-clock-exceeded
  palantir-swe-frontend-devprod → Skip | unemployment-clock-exceeded
  palantir-web-design-engineer → Skip | unemployment-clock-exceeded

## B2 Remove the 15-1255.00 row from the BLS table (BROKEN fixture), run the live scenario
$ node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --bls scripts/contrib/2026fa/o7580-design-engineer-soc-triage/fixtures/BROKEN-bls-no-15-1255.csv --out-dir course/2026fa/submissions/o7580/mode-build/runs/break-bls-no-15-1255
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2026-10-19
  evaluated 9 → out of lane 2 · not scored 1 · scored 6 (Apply 2 · Consider 1 · Skip 3)
  skip rate of decided roles 0.625 · Cognitive Pivot refusals 4
  scorer: ✓ scored 6 roles → Apply 2 · Consider 1 · Skip 3 (skip 50%)
  wrote course/2026fa/submissions/o7580/mode-build/runs/break-bls-no-15-1255/triage-log.json + triage-report.md
exit 0
  Web Design Engineer readout: [{"soc":"15-1255.00","missing":"no-soc-row"},{"soc":"15-1254.00","score":3.584},{"soc":"15-1252.00","score":3.834}]

## B3 Corrupt scenario JSON: must exit 2 and write nothing
$ node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --scenario <scratch>/corrupt.json --out-dir course/2026fa/submissions/o7580/mode-build/runs/break-corrupt
✗ scenario is not valid JSON (<scratch>/corrupt.json): Unexpected end of JSON input
exit 2
  nothing written

## B4 Dead posting: a role pointing at the broken Palantir ID that ats:liveness reported expired, with a deliberately high fit (0.9)
$ node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --scenario <scratch>/dead.json --out-dir <tmp>
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2026-10-19
  evaluated 10 → out of lane 2 · not scored 1 · scored 7 (Apply 2 · Consider 1 · Skip 4)
  skip rate of decided roles 0.667 · Cognitive Pivot refusals 5
  scorer: ✓ scored 7 roles → Apply 2 · Consider 1 · Skip 4 (skip 57%)
  wrote ../../../..<tmp>/triage-log.json + triage-report.md
exit 0
  Skip | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | (0.9·0.35 + 0.9·0.3) × 0 × 1 = 0.000

## B5 Out-of-range fit (1.5) must not reach the scorer
$ node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --scenario <scratch>/fit.json --out-dir <tmp>
✓ o7580-design-engineer-soc-triage v0.1.0 — as of 2026-10-19
  evaluated 9 → out of lane 2 · not scored 2 · scored 5 (Apply 2 · Consider 0 · Skip 3)
  skip rate of decided roles 0.714 · Cognitive Pivot refusals 4
  scorer: ✓ scored 5 roles → Apply 2 · Consider 0 · Skip 3 (skip 60%)
  wrote ../../../..<tmp>/triage-log.json + triage-report.md
exit 0
  Not scored | [{"missing":"no-fit-input","detail":"fit.p must be a number in [0, 1]"}]
  in roles.json: false

## B6 Ambiguous-title override without a basis is refused
exit 0
  Not scored | [{"missing":"bad-family-override","detail":"family_override has no basis — refusing an undocumented reclassification"}]

## B7 Reproducibility: re-run the live scenario into a temp dir; diff against the saved run (generated_at stripped)
exit 0
  identical: triage-log.json
  identical: triage-report.md
  identical: roles.json
  identical: role-scores.json
  identical: role-scores.md

## B8 Independent cross-check of the audit counts with Python's csv + ast modules (not this recipe's parser)
  rows 30369 vs audit 30369
  sponsor rows 1557 vs audit 1557
  "design" title instances 119 vs audit 119
  blank pivot rows 122 vs audit 122
  15-1255.00 cognitive_pivot_score field: ''
  MA sponsor rows 227 | MA rows with any title containing "designer": ['BRIGHTCOVE INC', 'MODO LABS INC', 'RATEGRAVITY INC']
```

- **After-checks:**

```text

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 169 files (87 md · 36 py · 34 js · 5 sh · 5 json · 2 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

`node scripts/pii-scan.mjs`: the one finding is the upstream `package-lock.json` false positive, present on `main` before this work. `package-lock.json` is unchanged, and the address is not reproduced here.

```text
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <upstream lockfile false positive, not reproduced>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

## 5. Reflection

### What went well
- **The domain finding was in the data, not in my assumptions.** The audit showed the Massachusetts design-lane sponsorship gap and the blank 15-1255.00 row before any posting was scored. The mode's two headline claims are records.
- **The gates did the work the scorer can't.** Palantir has 462 approvals and lists "Product Designer" at level, so a sponsorship-first tool would rank its new-grad design roles at the top. The graduation-window gate closed both. That is the exact failure the earlier Ch.11 scorer behaviour warned about ("a Proven sponsor clears Apply on its own").
- **The refusals held under attack.** Removing the 15-1255.00 row produced `no-soc-row`, not a borrowed number. A blank approvals field stayed "not scored". An undocumented family override was refused.
- **Reusing repository scripts paid off.** `detect-ats.py` fixed a wrong guess of mine (Databento) that I would otherwise have reported as "board not found".

### What the mode got wrong or missed
- **The lane classifier is a hand-written rule list.** The full-file audit caught it misfiling "Solution Engineer Frontend/Backend" as front-end engineering; that is now fixed with a rule and a test. It still puts "Visual Designer" in graphic design, which is right only for some employers, and the next misfire will also need a person to spot it.
- **Both "Apply" rows rest on fit values the AI drafted.** Remove fit and Palantir's two Apply rows are carried by sponsorship alone: 0.315 against a 0.30 threshold. The run shows the arithmetic honestly, but the decision is only as good as the author's confirmation of fit.
- **Sample size and concentration.** Five of the nine postings come from one employer (Palantir), and the two Apply rows are both in New York (relocation). The scan is a slice of 13 boards, not the market. Four boards were unreachable, two postings were `uncertain`, and the five Greater-Boston employers produced exactly one in-lane posting (Toast, remote).
- **The scanner's own filters leaked.** The "Sioux" match and the non-US cities, and my block list was incomplete. The mode caught the first at G1; the second was filtered by hand when the scenario was built ("US-located rows only"), which is a human step the recipe now names.
- **The AI-resilience layer is mostly a refusal.** For four of the six scored postings, the main candidate occupation has no score. The Cognitive Pivot connection is honest but thin until proposal 3 lands.

### Next steps
1. Author: re-open all 9 postings, confirm or correct the transcribed fields and the fit values, clear G1/G2/G5, and record G6 decisions. Then re-run (same command), so the run log shows confirmed inputs.
2. Open the two `uncertain` postings by hand and record the result in the liveness log.
3. Build proposal 5 (posting-field extractor) first. It removes the largest single source of model judgment in this run.
4. Ask the maintainer about proposal 4 (word-boundary matching in `scan.mjs`), with the "Sioux Falls" output above as evidence.
5. Pull FY LCA disclosure rows (proposal 1) for the 26 national design-title sponsors, to test the SOC question on real filings.

### Author's reflection (Omkar Salian, in my own words, 2026-10-21)

- **What surprised me:** One sponsor had 462 approvals and a junior “Product Designer” role in its records, so it looked promising at first. But both of its “New Grad” design jobs were only open to 2027 graduates. Someone graduating in December 2026 wouldn’t qualify. If I’d gone by the sponsor’s history and the “New Grad” label alone, I would’ve put those jobs near the top of the list.
- **What I’d do differently:** I’d get each job’s occupation code from the Labor Department’s visa filing records, or LCA data, instead of trying to guess it from the job title.
- **The limitation I’ll mention in the presentation:** The model can’t tell us which occupation code an employer will actually use for a design role. It can show why that matters—there’s about a $36,790 gap in national median pay between codes 15-1255 and 27-1024—but the candidate still needs to ask the recruiter which code the employer plans to use.

*An earlier version (2026-10-20) was assembled from options the agent drafted. I rewrote it in my own words on 2026-10-21.*

## Attestation

> **Signed by the author on 2026-10-20; voided 2026-10-21 by the classifier fix; re-signed 2026-10-21; voided again the same day by the privacy correction; re-signed 2026-10-21; voided again the same evening by the out-dir guard fix; re-signed (final) after re-running both commands.** Originally drafted as follows: The rows below record what the agent ran and saw. Per the constitution, the attestation is the *human's* record of having judged the running system. Re-run the two commands below, compare against each row, then fill in **By**. Do not sign rows you did not re-run.
>
> ```bash
> node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs
> bash scripts/contrib/2026fa/o7580-design-engineer-soc-triage/break-tests.sh
> ```

- Recipe: o7580-design-engineer-soc-triage v0.1.0
- By: Omkar Salian · 2026-10-20, **voided 2026-10-21** by the classifier fix (a script edit voids an attestation). Re-signed Omkar Salian · 2026-10-21 (17/17, B1–B8), then **voided again 2026-10-21** by the privacy correction (recipe + scenario edits). Re-signed Omkar Salian · 2026-10-21 after the privacy correction (17/17, B1–B8), then **voided again 2026-10-21** by the out-dir guard fix found on a clean clone. **Re-signed: Omkar Salian · 2026-10-21 (final)**, after re-running both commands in his own terminal on the fixed tree: 17/17 tests, and B1–B8 matching the rows below.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run ats:scan -- --dry-run` with the design-lane portals (both passes) | 13/17 boards, 1,373 jobs, 19 title matches; 2 after the metro filter | a small number of in-lane US postings; every board error reported, not hidden |
| `python3 detect-ats.py Rippling Scribd Remitly DraftKings Databento` | Databento → greenhouse (14 jobs); the other 4 not_found | find the boards my guesses missed |
| `npm run ats:liveness -- --file …urls.txt` | 7 active, 2 uncertain, 1 expired (the invalid ID) | the invalid ID must read expired |
| `title-audit.mjs --state MA` | 119 "design" titles, 65 out of lane; 0 MA at-level design sponsors with ≥3 approvals | counts that match an independent parser |
| `triage.mjs` (live) | 9 → 2 out of lane, 1 not scored, Apply 2 · Consider 1 · Skip 3; 4 Cognitive Pivot refusals | out-of-lane rows never reach the scorer; 15-1255.00 refused |
| **Break B1:** `--as-of 2027-03-01 --days-used 56` | all 6 scored rows Skip; every row shows `unemployment-clock-exceeded` | the clock gate closes everything |
| **Break B2:** BLS table with the 15-1255.00 row removed | `no-soc-row` for 15-1255.00; other candidates unchanged | missing, not filled |
| **Break B3:** corrupt scenario JSON | exit 2, nothing written | exit 2, nothing written |
| **Break B4:** add the dead posting with fit 0.9 | Skip, `(0.9·0.35 + 0.9·0.3) × 0 × 1 = 0.000` | a closed liveness gate zeroes even a strong role |
| **Break B5:** fit = 1.5 | Not scored (`no-fit-input`); absent from `roles.json` | out-of-range input never reaches the scorer |
| **Break B6:** family override without a basis | Not scored (`bad-family-override`) | undocumented reclassification refused |
| **B7** re-run + diff | 5/5 outputs identical after normalization | deterministic |
| **B8** independent Python count | 30,369 / 1,557 / 119 / 122 all match | the audit is not an artifact of my parser |
| `node --test …/triage.test.mjs` | 17/17 pass | all pass |
| Author re-opened the 4 Palantir postings (2026-10-21) | 2 yrs frontend design · 2+ yrs SWE · "graduating in 2027" on both new-grad roles · the clearance line on the US-Gov role | the lines the gates closed on are on the live postings |
| `npm run verify` · `npm run doctor` | both exit 0 | exit 0 |
| Confirmed re-run (§2.9) | 9 → 2 out of lane · 0 not scored · Apply 2 · Consider 2 · Skip 3; scorer skip rate 43% | all postings decided; skip rate reported, not tuned |

### Did not test
- **The author re-reading all 9 postings.** On 2026-10-21 he re-opened the 4 Palantir postings that drive the decisions and checked their lines. The other 5 rest on his approval of the agent's word-for-word re-check sheet (2026-10-20).
- The two formerly `uncertain` postings were opened by the agent in a browser and confirmed by the author from that report, not opened by the author.
- Whether any "active" posting is a real, funded opening.
- Which SOC code any employer filed: no LCA data in the repository.
- Clearance, E-Verify and STEM-OPT "directly related" questions: legal, out of scope.
- Workday, Ashby-only or custom boards: unreachable with today's providers.
- `pii-scan --diff origin/main`: needs a commit, and nothing is committed yet. Run it on the branch before pushing.
- CI (`contrib-gate.yml`) on a pull request: no PR exists yet.
- Locations outside the US, and any persona other than this one.
- `npm run doctor` on this recipe's frontmatter: doctor only counts top-level `recipes/`, not `recipes/cases/`, so its "33 recipes" line does not include this file. The 6 declared TODOs were counted with `grep -c "\[TODO"` instead.

### Broke during testing, fixed
- **Out-dir guard rejected a legitimate temp dir** (`/var/folders/…` is a symlink to `/private/var/…`). Seen in `break-tests-first-attempt.txt`, B4/B5. Fixed in `triage.mjs` and `title-audit.mjs` (`realOutPath`: realpath of the nearest existing ancestor), with a regression test (test 15). **This is a repeat:** the earlier recipe (PR #37) hit and fixed the same bug, and adapting code from a pre-fix copy brought it back. The regression test now pins it.
- **Break harness printed blank exit codes** under zsh (no `PIPESTATUS`). Moved to `break-tests.sh` and run under bash.
- **Reproducibility diff reported a false difference** (the out-dir is stored as a repo-relative path). Fixed the normalization in `break-tests.sh`; B7 is now 5/5 identical.
- **Databento board guessed as Ashby** (HTTP 404). `detect-ats.py` found it on Greenhouse; the portals file was corrected with a dated comment and both scans re-ran.
- **`pii-scan` flagged employer accommodation e-mails** in posting JSON kept under gitignored `private/`. The scan reads gitignored files, so the raw postings were moved outside the repository.
- **A test failed on a fresh clone placed in the OS temp dir** (test 17, "out-dir outside the contributor namespaces is refused"). The out-dir guard allowed anything under the temp dir, and the clone was itself inside the temp dir, so a forbidden path inside the repository was accepted. It was found by the pre-push clean-clone check on 2026-10-21. Fixed in `triage.mjs` and `title-audit.mjs`: inside the repository, only the contributor namespaces are allowed, wherever the repository sits, and both sides are compared as real paths. 17/17 now pass both in place and with the repository copied into the temp dir.
- **The persona was labeled "anonymized author persona"**, which tied the author's real visa status and dates to the submission. That breaks `DATA_CONTRACT.md` §Zero-Conditions. It was caught in a TA-style review before any commit, replaced with the fictional "Ananya Iyer", and every run was regenerated.
- **The classifier missed "Web Engineer"** on the first full-file pass; a `web engineer` rule was added before any run that is reported here.
- **The classifier read "Solution Engineer Frontend/Backend - Field Services" as front-end engineering.** It was the only Massachusetts at-level ui-engineering sponsor in the audit. Fixed 2026-10-21 in `lib.mjs` (solutions/sales/field titles → `unrelated`), with regression test 3. The audit was re-run, and B7 confirms the triage outputs are unchanged.
