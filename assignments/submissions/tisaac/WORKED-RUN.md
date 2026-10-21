# Worked Run — case-swe-stem-opt-runway

## Executive summary

This is the record of running the job-search mode on real, open software-engineering postings on 2026-10-21, with the actual terminal output pasted in. It ran three times. Run 1 used three postings I picked by hand plus one deliberately dead link. Run 2 used 23 postings chosen by a written, tested filter from 540 on three companies' job boards. Run 3 is the same set after I checked one company's legal name myself. The mode caught the dead link that the repository's own page checker called "active". It also showed two real errors, both found by checking its output against the source. It skipped a Boston sponsor because "Toast" did not match "TOAST INC". And my first filter dropped postings it should have kept. It also has a clear limit: with no job description read, it can tell companies apart but not roles, and the last run marked 19 of 24 postings Apply. Every value is labeled as a record or as my own input; nothing in this run is a model's judgment.

## Run record

| Field | Value |
|---|---|
| Mode | `recipes/case-swe-stem-opt-runway.md` v0.1.0, status RUNNABLE-SAMPLE |
| Code | `scripts/contrib/2026fa/tisaac-swe-stem-opt/` |
| Date | 2026-10-21 (all three runs) |
| Environment | macOS 27.0.1 · Node v24.13.0 · Playwright 1.62.1 (Chromium headless shell) |
| Data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (shipped, 30,369 rows); Greenhouse public boards `klaviyo`, `toast`, `duolingo` |
| Network | `boards-api.greenhouse.io` and the posting pages, during selection and liveness collection only |

## Inputs

Fictional persona: F-1 STEM Information Systems student, 3-year OPT runway, targeting SWE / backend / full-stack / SRE / platform / test roles, no Data / ML-specialist roles, US locations only. The postings are public, not my own applications. No résumé or tracker was read.

| Input | Value | Label |
|---|---|---|
| Boards | Klaviyo, Toast, Duolingo (public Greenhouse boards) | my choice |
| Scope rules | `scope.json` (titles, levels, specialists, US location) | `your-input` |
| `fit` | 0.5 for every posting = "JD not read yet" | `your-input` |
| `timeline` | 1.0 for every posting (3-year runway) | `your-input` |
| `csv_name` | Klaviyo → `KLAVIYO INC`; Run 3 adds Toast → `TOAST INC` | `your-input` (my own name match) |
| Break | Klaviyo job id `1000000001`, which does not exist | deliberate |

## Run 1 — three hand-picked postings + one dead link

I picked one posting each from Klaviyo, Toast, and Duolingo by hand. These files were later renamed to `jobs-2026-10-21-handpicked.json`, `liveness-2026-10-21-handpicked.json`, and `assignments/submissions/tisaac/run-1-handpicked/`; the commands below show the names at the time.

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json --out scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
board klaviyo: 163 jobs listed
board toast: 314 jobs listed
board duolingo: 60 jobs listed
klaviyo-7727703003: board_listed=true browser=active
toast-8233154: board_listed=true browser=active
duolingo-8584012002: board_listed=true browser=active
break-klaviyo-1000000001: board_listed=false browser=active
✅ Saved liveness evidence to scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
[exit 0]
```

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json --out-dir assignments/submissions/tisaac/run-2026-10-21
🚀 Starting SWE STEM-OPT Prototype...
Loaded 4 test jobs from scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json.
Liveness evidence: scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json (checked 2026-10-21T18:06:18.591Z).
[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): Toast, Duolingo
✅ Saved evidence tagged output to assignments/submissions/tisaac/run-2026-10-21/my-roles.json
⚙️ Calling role-scorer.mjs...
✓ scored 4 roles → Apply 1 · Consider 0 · Skip 3 (skip 75%)
  assignments/submissions/tisaac/run-2026-10-21/role-scores.json  +  assignments/submissions/tisaac/run-2026-10-21/role-scores.md
✅ Wrote assignments/submissions/tisaac/run-2026-10-21/mode-run.json + assignments/submissions/tisaac/run-2026-10-21/mode-report.md
🎉 Run complete!
[exit 0]
```

Result: Apply 1 (Klaviyo) · Skip 3. The dead link was skipped by the board signal even though the page check said `active`. Toast and Duolingo were skipped as `no-matched`.

## Run 2 — postings chosen by a written filter

When I asked how the postings had been picked, the answer was a hand-written filter that was never saved, plus a hand pick. I had it moved into a stored script with a written scope and an audit of every posting. Reading that audit showed the first filter was wrong (see *Broke during testing, fixed*). This is the live selection after the fixes, then liveness, then scoring:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --date 2026-10-21
board klaviyo (Klaviyo): 163 listed → 14 selected
board toast (Toast): 316 listed → 5 selected
board duolingo (Duolingo): 61 listed → 4 selected
✅ 24 jobs (incl. 1 break) → scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json
✅ audit → scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21-audit.md
[exit 0]
```

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json --out scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
board klaviyo: 163 jobs listed
board toast: 316 jobs listed
board duolingo: 61 jobs listed
klaviyo-7727703003: board_listed=true browser=active
klaviyo-7822352003: board_listed=true browser=active
klaviyo-7695230003: board_listed=true browser=active
klaviyo-7780009003: board_listed=true browser=active
klaviyo-8012938003: board_listed=true browser=active
klaviyo-7711217003: board_listed=true browser=active
klaviyo-7696724003: board_listed=true browser=active
klaviyo-7986459003: board_listed=true browser=active
klaviyo-7777369003: board_listed=true browser=active
klaviyo-7783904003: board_listed=true browser=active
klaviyo-7597868003: board_listed=true browser=active
klaviyo-7792539003: board_listed=true browser=active
klaviyo-7855798003: board_listed=true browser=active
klaviyo-7855793003: board_listed=true browser=active
toast-8233154: board_listed=true browser=active
toast-7550881: board_listed=true browser=active
toast-8258811: board_listed=true browser=active
toast-7819344: board_listed=true browser=active
toast-8154719: board_listed=true browser=active
duolingo-8778700002: board_listed=true browser=active
duolingo-8784381002: board_listed=true browser=active
duolingo-8628658002: board_listed=true browser=active
duolingo-8584012002: board_listed=true browser=active
break-klaviyo-1000000001: board_listed=false browser=active
✅ Saved liveness evidence to scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
[exit 0]
```

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json --out-dir assignments/submissions/tisaac/run-2-selected
🚀 Starting SWE STEM-OPT Prototype...
Loaded 24 test jobs from scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json.
Liveness evidence: scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json (checked 2026-10-21T19:26:27.175Z).
[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): Toast, Duolingo
✅ Saved evidence tagged output to assignments/submissions/tisaac/run-2-selected/my-roles.json
⚙️ Calling role-scorer.mjs...
✓ scored 24 roles → Apply 14 · Consider 0 · Skip 10 (skip 42%)
  assignments/submissions/tisaac/run-2-selected/role-scores.json  +  assignments/submissions/tisaac/run-2-selected/role-scores.md
✅ Wrote assignments/submissions/tisaac/run-2-selected/mode-run.json + assignments/submissions/tisaac/run-2-selected/mode-report.md
🎉 Run complete!
[exit 0]
```

Result: 24 scored → Apply 14 (all Klaviyo) · Skip 10 (all Toast, all Duolingo, the dead link). Skip rate 42%.

## Run 3 — after I resolved one company name (gate G3)

Run 2 listed "Toast" as `no-matched`. Looking it up by hand, the CSV has `TOAST INC`: Boston, 150 H-1B approvals, top sponsored title "Senior Software Engineer". Its `website` field says `toast.com`, which today redirects to a different company (`nhncloud.com/kr`), so the file alone was not enough. I checked SEC EDGAR: Toast, Inc. (CIK 0001650164) has its business address at 333 Summer Street, Boston MA 02210. The address on the posting page is 333 Summer St, Boston MA 02210. I accepted the match, added `toast: "TOAST INC"` to `scope.json`, and re-ran the selection from the saved snapshot, with no network, so the postings are the same:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --from-snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21 --date 2026-10-21
board klaviyo (Klaviyo): 163 listed → 14 selected
board toast (Toast): 316 listed → 5 selected
board duolingo (Duolingo): 61 listed → 4 selected
✅ 24 jobs (incl. 1 break) → scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json
✅ audit → scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21-audit.md
[exit 0]

$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json --out-dir assignments/submissions/tisaac/run-3-name-resolved
🚀 Starting SWE STEM-OPT Prototype...
Loaded 24 test jobs from scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json.
Liveness evidence: scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json (checked 2026-10-21T19:26:27.175Z).
[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): Duolingo
✅ Saved evidence tagged output to assignments/submissions/tisaac/run-3-name-resolved/my-roles.json
⚙️ Calling role-scorer.mjs...
✓ scored 24 roles → Apply 19 · Consider 0 · Skip 5 (skip 21%)
  assignments/submissions/tisaac/run-3-name-resolved/role-scores.json  +  assignments/submissions/tisaac/run-3-name-resolved/role-scores.md
✅ Wrote assignments/submissions/tisaac/run-3-name-resolved/mode-run.json + assignments/submissions/tisaac/run-3-name-resolved/mode-report.md
🎉 Run complete!
[exit 0]
```

The run report (`assignments/submissions/tisaac/run-3-name-resolved/mode-report.md`):

```
# SWE STEM-OPT Runway — run report

**24 postings checked → 19 Apply · 0 Consider · 5 Skip · 0 held (not scored).**

## Scored

| Posting | Recommendation | Composite | Why | Liveness | Sponsorship |
|---|---|---|---|---|---|
| Klaviyo — Full Stack Software Engineer - People Systems | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Full Stack Software Engineer - People Systems | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Customer Agent | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer, Customer Agent | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Data Automation | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Developer Infrastructure | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Growth | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Identity and Access Management | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Infrastructure Security | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer, Platform Engineering | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Senior Software Engineer - Profiles, Lists and Segments | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Software Engineer II - Recommendations | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Klaviyo — Software Engineer II, Test Frameworks & Tooling | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Toast — Senior Software Engineer | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Toast — Senior Software Engineer, Android | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Toast — Senior Software Engineer, Android | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Toast — Senior Software Engineer (Fullstack), Digital Storefront | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Toast — Senior Software Engineer, Retail | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Duolingo — Platform Engineer II | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Duolingo — Senior Site Reliability Engineer | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Duolingo — Senior/Software Engineer II, Android | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Duolingo — Senior/Software Engineer II, Backend | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Klaviyo — Deliberate break: job id that does not exist | **Skip** | 0.000 | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | 0 [record] | 0.8 h1b-history [record] |

## Held — the mode refused to score these

None.

## Not found in the sponsorship file

Duolingo — check the legal name by hand before trusting the 0.

## Gates you still have to clear before applying

- **Visa timeline:** `timeline` is your own input — confirm your OPT dates against the start date.
- **International-student ban:** read the JD for "US citizens only", "no sponsorship", or clearance requirements.
- **Excluded titles:** skip Data / ML-specialist roles.

Full scorer audit: `assignments/submissions/tisaac/run-3-name-resolved/role-scores.md`.
```

## Verified vs. inferred

| Value | Label | Where it came from |
|---|---|---|
| Posting title, location, URL, job id | `record` | Greenhouse board API, saved in `postings-2026-10-21/*.raw.json` |
| Which postings were kept | rule applied to a record | `scope.json` (my rules) applied to the snapshot; every decision in `postings-2026-10-21-audit.md` |
| Liveness 1.0 (23 postings) | `record` | on the Greenhouse board **and** page check `active` |
| Liveness 0 (dead link) | `record` | job id not on the board (page check said `active`; the board wins) |
| Sponsorship 0.8, Klaviyo (14) | `record` | CSV `KLAVIYO INC`, `Total Approvals` 154. Row found through my own `csv_name`. The 0.8 itself is my mapping, not in the file |
| Sponsorship 0.8, Toast (5, Run 3) | `record` | CSV `TOAST INC`, `Total Approvals` 150, found through my `csv_name` after the SEC check |
| Sponsorship 0, Toast (5, Runs 1–2) | `your-input` | not found by exact match; 0 is my "missing is not a deduction" rule. **Wrong**, see Run 3 |
| Sponsorship 0, Duolingo (4) | `your-input` | no `DUOLINGO` row in the CSV |
| Fit 0.5 | `your-input` | my placeholder; nobody read a JD |
| Timeline 1.0 | `your-input` | my assumption from the 3-year runway |
| Apply / Skip | — | scorer arithmetic on the terms above (`role-scores.json` → `trace.arithmetic`) |

**Nothing in these runs is `model-judgment`.** No model was called.

## Verification

1. **Checked the liveness signals against a second source.** The page check said all four Run 1 URLs were active, including the dead one. I queried Greenhouse's single-job endpoint for each job and followed the dead link's redirect:

```
$ npm run ats:liveness -- "https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003" "https://careers.toasttab.com/jobs?gh_jid=8233154" "https://careers.duolingo.com/jobs/8584012002?gh_jid=8584012002" "https://job-boards.greenhouse.io/klaviyo/jobs/1000000001"

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003 https://careers.toasttab.com/jobs?gh_jid=8233154 https://careers.duolingo.com/jobs/8584012002?gh_jid=8584012002 https://job-boards.greenhouse.io/klaviyo/jobs/1000000001

Checking 4 URL(s)...

✅ active     https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003
✅ active     https://careers.toasttab.com/jobs?gh_jid=8233154
✅ active     https://careers.duolingo.com/jobs/8584012002?gh_jid=8584012002
✅ active     https://job-boards.greenhouse.io/klaviyo/jobs/1000000001

Results: 4 active  0 expired  0 uncertain
[exit 0]

$ for j in klaviyo/jobs/7727703003 toast/jobs/8233154 duolingo/jobs/8584012002 klaviyo/jobs/1000000001; do printf '%s ' $j; curl -s -o /dev/null -w '%{http_code}
' https://boards-api.greenhouse.io/v1/boards/$j; done
klaviyo/jobs/7727703003 200
toast/jobs/8233154 200
duolingo/jobs/8584012002 200
klaviyo/jobs/1000000001 404
[exit 0]

$ curl -s -o /dev/null -w '%{http_code} -> %{url_effective}
' -L https://job-boards.greenhouse.io/klaviyo/jobs/1000000001
200 -> https://www.klaviyo.com/careers/search-jobs
[exit 0]

$ python3 -c "import csv; rows=list(csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'))); [print(r['company_name'], '|', r['Total Approvals'], '|', r['total_funding'], '|', r['city']) for r in rows if r['company_name'].upper().startswith(('KLAVIYO','TOAST','DUOLINGO'))]"
KLAVIYO INC | 154.0 | 649999194.0 | BOSTON
TOAST EMPIRE INC |  | 4307022.0 | Rye
TOAST HOLDINGS INC |  | 9677166.0 | New York
TOAST INC | 150.0 | 38200000.0 | BOSTON
TOASTER LABS INC |  | 1000000.0 | SEATTLE
[exit 0]
```

   Three real jobs return 200, and the dead id returns 404 and redirects to Klaviyo's job-search page. That is why the page check was fooled, and why the board signal is the one the gate trusts.
2. **Checked the sponsorship values by hand in the CSV** (same output, last command above): `KLAVIYO INC` 154 and `TOAST INC` 150 approvals match the `record` values; there is no `DUOLINGO` row.
3. **Re-ran the filter from the saved snapshot with no network.** The job list came out byte-for-byte identical:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --from-snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21 --date 2026-10-21
board klaviyo (Klaviyo): 163 listed → 14 selected
board toast (Toast): 316 listed → 5 selected
board duolingo (Duolingo): 61 listed → 4 selected
✅ 24 jobs (incl. 1 break) → scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json
✅ audit → scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21-audit.md
[exit 0]
```

4. **Ran both offline tests:** `index.test.mjs` 13/13 and `select-postings.test.mjs` 21/21.
5. **Broke the code on purpose three times.** In each case the test failed as it should, and the code was restored afterwards:

```
# M3: in index.js, the board-absent rule `e.board_listed === false` changed to `=== "never"`; ran index.test.mjs
  ✗ liveness evidence: job id not on the board → gate 0 (record), even if the page check says active
12 passed, 1 failed

# M4: in select-postings.mjs, whitespace normalization removed (`norm = (s) => (s || '')`); ran select-postings.test.mjs
  ✗ keeps "Senior Software  Engineer" @ "Boston, MA" (in scope)
  ✗ replaying the saved 2026-10-21 snapshot reproduces jobs-2026-10-21.json
19 passed, 2 failed

# M5: in scope.json, the full US state-name pattern removed; ran select-postings.test.mjs
  ✗ keeps "Software Engineer" @ "Remote - California" (in scope)
20 passed, 1 failed
```

## Reflection

- **What went well.** The board record caught a dead posting that looked alive, which was the main thing this mode set out to do. Holding a role instead of scoring it when the two signals disagree worked in the test, but it never triggered on real data. Writing the scope down and auditing every dropped posting made the filter checkable: the errors were found by reading the audit, not by luck.
- **What the mode got wrong.** (1) Exact name matching skipped five postings from a Boston company with 150 H-1B approvals until I resolved "Toast" → "TOAST INC" myself. (2) My first filter dropped "Software Engineer - Data Automation", missed a double-spaced title and SRE / Platform roles, and called "Remote - California" non-US. (3) The repository's page checker calls a redirected dead link "active". The mode works around this for Greenhouse only.
- **What it missed.** With `fit` fixed at 0.5, every posting at a company scores the same. Run 3 marks 19 of 24 Apply, a 21% skip rate, far below the ~50% a healthy run skips. The mode can rank companies but cannot tell a "Software Engineer II" from a "Senior" role. Two of the three boards I chose belong to large sponsors, so this sample also leans toward Apply.
- **Next steps.** (1) Read each JD and set `fit` per role, by hand or as a labeled model judgment that quotes the sentence it relied on. The same read would clear G4 (sponsorship bans). (2) Suggest `csv_name` candidates by matching on city and normalized name, but still require a person to accept each one (G3). (3) Add role quality (salary, remote) outside the scorer, since its weight there is 0.

## Attestation
- Recipe: case-swe-stem-opt-runway v0.1.0
- By: Isaac Tai (tisaac) · 2026-10-21

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `select-postings.mjs --date 2026-10-21` (live) | 540 listed → 23 selected + 1 break; audit written | a written reason for every posting |
| `select-postings.mjs --from-snapshot …` | identical `jobs-2026-10-21.json` | same snapshot + scope → same selection |
| `collect-liveness.mjs` on 24 postings | 23 `board_listed=true browser=active`; break `board_listed=false browser=active` | dead link flagged by the board |
| `index.js` Run 2 / Run 3 | Apply 14 · Skip 10 → Apply 19 · Skip 5 after the Toast name match | Toast changes only after `csv_name` |
| `npm run ats:liveness` on the four Run 1 URLs | `4 active`, including the dead link | — (this is the weakness) |
| `curl` single-job API | 200 ×3, 404 for the dead id | board is authoritative |
| SEC EDGAR + posting page address (by hand) | both 333 Summer St, Boston MA 02210 | same company → accept `TOAST INC` |
| **Break:** dead job id in the input | Skip, `gated: liveness ≈ 0.000` | gate closes |
| **Break M3:** board-absent rule disabled | `index.test.mjs` 12/13, exit 1 | test fails |
| **Break M4:** whitespace normalization removed | `select-postings.test.mjs` 19/21, exit 1 | test fails |
| **Break M5:** full state names removed from scope | `select-postings.test.mjs` 20/21, exit 1 | test fails |

### Did not test
- Any ATS other than Greenhouse (Lever, Ashby, Workday). Those postings would be held, but this was not run on real ones.
- The **held** path on real data: no real posting had disagreeing signals. Only the offline test covers it.
- Fit from the job description: every `fit` is my 0.5 placeholder.
- The visa-timeline gate for real dates, and the ban and title gates (G4, G5) for each of the 19 Apply roles. No application was sent.
- Boards other than these three; whether `scope.json` is the right scope for anyone but this persona.
- Other machines or Node versions.

### Broke during testing, fixed
- Old offline URL rule would mark every real posting `-1`, because the posting URLs are company sites (`klaviyo.com`, `careers.toasttab.com`), not `greenhouse.io`. Fixed: with `--liveness`, the gate comes from the evidence file.
- Hand-written, unsaved filter → replaced by `select-postings.mjs` + `scope.json` + audit. Fixed in it: titles are whitespace-normalized; "Data" in an SWE title no longer drops it; SRE / Platform / Test titles included; full state names and "City ST" count as US; a bare "Remote" is reported as "location unclear", not "not in the US"; location is checked last, so every location drop in the audit is an in-scope title.
- `select-postings.mjs --from-snapshot` did not create its output folder. Caught by the new test on its first run; fixed.
- `mode-report.md` listed each `no-matched` company once per posting. Fixed: one line per company.
- The first by-hand CSV check concluded the file had only `TOAST HOLDINGS INC` (New York). It also has `TOAST INC` (Boston); that check had printed only the first two matches. A full re-check found it.
