# Worked Run — case-swe-stem-opt-runway

## Executive summary

This is the record of running the job-search mode on real, open software-engineering postings on 2026-10-21, with the actual terminal output pasted in. It took four runs and one hands-on walkthrough, and each one found something the earlier offline design could not have shown. The final run checked 1,653 postings from six companies, kept 66 inside my written scope, and added one deliberately dead link. It confirmed that every kept posting was still open, and it caught the dead link that the repository's own page checker called "active". On the way it showed five real errors, each found by checking its output against the source:

- It skipped a Boston sponsor because "Toast" did not match "TOAST INC".
- My first filter dropped postings it should have kept.
- One company's application form sits inside an embedded frame, which made all its postings look uncertain.
- A posting closed between two steps sixteen minutes apart.
- One company's postings name no city, only "Hybrid" or "In-Office"; the places were in Greenhouse's office list.

All of them are fixed or written down as limits. Its main weakness remains: with no job description read, it marks 28 of 67 postings Apply, and most of its skips come from a company missing from the visa file rather than from evidence. Every value is labeled as a record or as my own input; nothing in these runs is a model's judgment.

## Run record

| Field | Value |
|---|---|
| Mode | `recipes/case-swe-stem-opt-runway.md` v0.2.0, status RUNNABLE-SAMPLE |
| Code | `scripts/contrib/2026fa/tisaac-swe-stem-opt/` |
| Date | 2026-10-21 (all runs; Run 4's liveness check finished at 01:51 UTC on 10-22 = 21:51 EDT on 10-21) |
| Environment | macOS 27.0.1 · Node v24.13.0 · Playwright 1.62.1 (Chromium headless shell) |
| Data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (shipped, 30,369 rows); public Greenhouse boards `klaviyo`, `toast`, `duolingo`, `datadog`, `gitlab`, `cloudflare` |
| Network | `boards-api.greenhouse.io` and the posting pages, during selection and liveness collection only |
| Who ran what | Runs 1–4: the AI assistant ran the commands in my session. Walkthrough: I ran every command myself |

## Inputs

Fictional persona: F-1 STEM Information Systems master's student with industry experience before the degree (levels up to Senior; no Staff, Principal, or Lead), 3-year OPT runway, targeting SWE / backend / full-stack / SRE / platform / test roles, no Data / ML-specialist roles, no internships, US locations only. The postings are public, not my own applications. No résumé or tracker was read.

| Input | Value | Who decided | Label |
|---|---|---|---|
| Boards: Klaviyo, Toast, Duolingo | public Greenhouse boards | **chosen by the AI assistant** to cover three cases in the sponsorship file (a long record, a name that might not match, no row). Not my target list, not a random sample | — |
| Boards: Datadog, GitLab, Cloudflare | public Greenhouse boards | **chosen by me**, from a list of Greenhouse companies the assistant checked (Google, Nike, and Tesla were my first picks; none has a Greenhouse board) | — |
| Scope rules | `scope.json`: titles, levels (incl. intern), specialists, US location | me | `your-input` |
| `csv_name` | Klaviyo → `KLAVIYO INC`; Toast → `TOAST INC` (Run 3); Datadog → `DATADOG INC`, GitLab → `GITLAB INC` (walkthrough, Run 4) | me, each checked by hand | `your-input` |
| `fit` | 0.5 for every posting = "JD not read yet" | me | `your-input` |
| `timeline` | 1.0 for every posting (3-year runway) | me | `your-input` |
| Break | a job id that does not exist (Klaviyo `1000000001`; Datadog `1000000001` in the walkthrough) | deliberate | — |

## Run 1 — three hand-picked postings + one dead link

The AI assistant picked one posting each from Klaviyo, Toast, and Duolingo by hand. Its inputs and outputs were not kept in the submission, since the output is pasted here. The offline tests use their own made-up fixtures, not this run's data.

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

When I asked how the postings had been picked, the answer was a hand-written filter that was never saved, plus a hand pick. I had it moved into a stored script with a written scope and an audit of every posting. Reading that audit showed the first filter was wrong (see *Broke during testing, fixed*). This is the live selection after the fixes, then liveness, then scoring. Run 2's inputs and outputs were not kept in the submission, since the output is pasted here:

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

Result: 24 scored → Apply 19 · Skip 5 (skip 21%). The output is pasted above; its files were not kept, because they came from older code.

## Walkthrough — I ran it myself (Datadog, GitLab, Cloudflare)

To learn the tool, I ran every step myself on three companies I chose, in a practice folder outside the repository (`../_walkthrough/`), starting from an empty `csv_name`. The commands are the ones the assistant gave me; the output below is pasted from my terminal. Selection kept Datadog 10, GitLab 4, and **Cloudflare 0**. Liveness:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs ../_walkthrough/jobs-2026-10-21.json --out ../_walkthrough/liveness-2026-10-21.json
board datadog: 439 jobs listed
board gitlab: 228 jobs listed
datadog-3851935: board_listed=true browser=uncertain
datadog-8095166: board_listed=true browser=uncertain
datadog-8223819: board_listed=true browser=uncertain
datadog-3851927: board_listed=true browser=uncertain
datadog-8281751: board_listed=true browser=uncertain
datadog-8292620: board_listed=true browser=uncertain
datadog-8247566: board_listed=true browser=uncertain
datadog-7993551: board_listed=true browser=uncertain
datadog-8035492: board_listed=true browser=uncertain
datadog-8052118: board_listed=true browser=uncertain
gitlab-8889193002: board_listed=false browser=expired
gitlab-8750842002: board_listed=true browser=active
gitlab-8644572002: board_listed=true browser=active
gitlab-8738179002: board_listed=true browser=active
break-datadog-1000000001: board_listed=false browser=uncertain
✅ Saved liveness evidence to ../_walkthrough/liveness-2026-10-21.json
```

Scoring, before any name match:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture ../_walkthrough/jobs-2026-10-21.json --liveness ../_walkthrough/liveness-2026-10-21.json --out-dir ../_walkthrough/run-1
🚀 Starting SWE STEM-OPT Prototype...
Loaded 15 test jobs from ../_walkthrough/jobs-2026-10-21.json.
Liveness evidence: ../_walkthrough/liveness-2026-10-21.json (checked 2026-10-21T23:32:50.650Z).
[HOLD] Job datadog-3851935 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8095166 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8223819 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-3851927 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8281751 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8292620 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8247566 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-7993551 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8035492 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[HOLD] Job datadog-8052118 not scored: signals disagree: listed on the board, but the page check says "uncertain"
[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): Datadog, GitLab
✅ Saved evidence tagged output to ../_walkthrough/run-1/my-roles.json
⚙️ Calling role-scorer.mjs...
✓ scored 5 roles → Apply 0 · Consider 0 · Skip 5 (skip 100%)
  ../_walkthrough/run-1/role-scores.json  +  ../_walkthrough/run-1/role-scores.md
✅ Wrote ../_walkthrough/run-1/mode-run.json + ../_walkthrough/run-1/mode-report.md
🎉 Run complete!
```

What I found, step by step:

- **Cloudflare 0 kept.** Its Greenhouse location field holds only a work model (Hybrid 341, Distributed 51, In-Office 39), so every SWE posting was dropped, and the audit wrongly said "location not in the US".
- **An intern posting was kept.** "Software Engineering Intern (Summer)" matched "software engineer".
- **A posting closed between steps.** GitLab "Cloud Platform Engineer" was on the board at selection (19:16, 229 postings) and gone at the liveness check (19:32, 228 postings). Both signals agreed it was closed, and the single-job API now returns 404.
- **All 10 Datadog postings were held.** I opened one and read the page source. The apply button ("Submit Application") is inside `<iframe id="grnhse_iframe" src="https://job-boards.greenhouse.io/embed/job_app?for=datadog&…&token=8247566">`. The repository's page check already accepts "submit application", but it only searches the main page, so it never sees the button. The iframe's `token` is the job id.
- **A held role had no way back in.** After I checked a page, there was nowhere to record that.
- **The name gate.** I looked up `DATADOG INC` (340 approvals, NEW YORK, datadog.com) and `GITLAB INC` (no approvals, $26M funding, SAN FRANCISCO, gitlab.com) and accepted both. Re-running gave GitLab 3 × Consider (0.29). Datadog stayed held, because the name match fixes sponsorship, not liveness.
- **A date bug.** After 8 pm in New York the selector named its files with the next day's date (it used UTC), so the next command would have silently read the old job list. I noticed it only because I pasted the output.

## Run 4 — final run after the fixes

Fixed before this run:

1. The liveness collector also checks whether the page embeds the Greenhouse application form for this job id.
2. A person's check can settle a held role (`liveness_checked_by_hand`, your-input).
3. Dates are local, and a replay is named after its snapshot.
4. Interns are excluded.
5. Each snapshot saves the scope it used.
6. **A location that names only a work model ("Hybrid", "Remote", "In-Office") is placed from the job's Greenhouse offices.** I found a "location unclear" Cloudflare posting whose page says "Austin, US; Seattle, US or London, UK". The board's location field only says "In-Office"; the cities are in Greenhouse's office list for that job. Any US office → in the US; all offices abroad → dropped; no offices → held for a person (`location_checked_by_hand`). The office list is fetched only for boards that need it, because it can be large (Toast's is 9.6 MB).

I cleared the outputs of earlier attempts and ran all three steps from scratch: all six boards, `csv_name` for Klaviyo, Toast, Datadog, GitLab.

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --out-dir scripts/contrib/2026fa/tisaac-swe-stem-opt/final
board klaviyo (Klaviyo): 163 listed → 14 selected
board toast (Toast): 318 listed → 5 selected
board duolingo (Duolingo): 61 listed → 4 selected
board datadog (Datadog): 439 listed → 9 selected
board gitlab (GitLab): 229 listed → 4 selected
board cloudflare (Cloudflare): 443 listed → 30 selected
✅ 67 jobs (incl. 1 break) → scripts/contrib/2026fa/tisaac-swe-stem-opt/final/jobs-2026-10-21.json
✅ audit → scripts/contrib/2026fa/tisaac-swe-stem-opt/final/postings-2026-10-21-audit.md
[exit 0]
```

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs scripts/contrib/2026fa/tisaac-swe-stem-opt/final/jobs-2026-10-21.json --out scripts/contrib/2026fa/tisaac-swe-stem-opt/final/liveness-2026-10-21.json
board klaviyo: 163 jobs listed
board toast: 318 jobs listed
board duolingo: 61 jobs listed
board datadog: 439 jobs listed
board gitlab: 229 jobs listed
board cloudflare: 443 jobs listed
klaviyo-7727703003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7822352003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7695230003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7780009003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-8012938003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7711217003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7696724003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7986459003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7777369003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7783904003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7597868003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7792539003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7855798003: board_listed=true browser=active greenhouse_iframe=false
klaviyo-7855793003: board_listed=true browser=active greenhouse_iframe=false
toast-8233154: board_listed=true browser=active greenhouse_iframe=false
toast-7550881: board_listed=true browser=active greenhouse_iframe=false
toast-8258811: board_listed=true browser=active greenhouse_iframe=false
toast-7819344: board_listed=true browser=active greenhouse_iframe=false
toast-8154719: board_listed=true browser=active greenhouse_iframe=false
duolingo-8778700002: board_listed=true browser=active greenhouse_iframe=false
duolingo-8784381002: board_listed=true browser=active greenhouse_iframe=false
duolingo-8628658002: board_listed=true browser=active greenhouse_iframe=false
duolingo-8584012002: board_listed=true browser=active greenhouse_iframe=false
datadog-3851935: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8095166: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8223819: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-3851927: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8281751: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8292620: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8247566: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-7993551: board_listed=true browser=uncertain greenhouse_iframe=true
datadog-8035492: board_listed=true browser=uncertain greenhouse_iframe=true
gitlab-8750842002: board_listed=true browser=active greenhouse_iframe=false
gitlab-8644572002: board_listed=true browser=active greenhouse_iframe=false
gitlab-8871406002: board_listed=true browser=active greenhouse_iframe=false
gitlab-8738179002: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8256332: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7629805: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8164694: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8250155: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8016162: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8080780: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8178593: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8269100: board_listed=true browser=active greenhouse_iframe=false
cloudflare-5390243: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7463793: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8105716: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8185561: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8212352: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7793013: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8164724: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7541032: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8140310: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8174207: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7276690: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8243201: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8204256: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8088751: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7302931: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8195746: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8248635: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7446310: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8155463: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7377424: board_listed=true browser=active greenhouse_iframe=false
cloudflare-7309174: board_listed=true browser=active greenhouse_iframe=false
cloudflare-8245503: board_listed=true browser=active greenhouse_iframe=false
break-klaviyo-1000000001: board_listed=false browser=active greenhouse_iframe=false
✅ Saved liveness evidence to scripts/contrib/2026fa/tisaac-swe-stem-opt/final/liveness-2026-10-21.json
[exit 0]
```

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture scripts/contrib/2026fa/tisaac-swe-stem-opt/final/jobs-2026-10-21.json --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/final/liveness-2026-10-21.json --out-dir assignments/submissions/tisaac/run-4-final
🚀 Starting SWE STEM-OPT Prototype...
Loaded 67 test jobs from scripts/contrib/2026fa/tisaac-swe-stem-opt/final/jobs-2026-10-21.json.
Liveness evidence: scripts/contrib/2026fa/tisaac-swe-stem-opt/final/liveness-2026-10-21.json (checked 2026-10-22T01:51:01.202Z).
[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): Duolingo, Cloudflare
✅ Saved evidence tagged output to assignments/submissions/tisaac/run-4-final/my-roles.json
⚙️ Calling role-scorer.mjs...
✓ scored 67 roles → Apply 28 · Consider 4 · Skip 35 (skip 52%)
  assignments/submissions/tisaac/run-4-final/role-scores.json  +  assignments/submissions/tisaac/run-4-final/role-scores.md
✅ Wrote assignments/submissions/tisaac/run-4-final/mode-run.json + assignments/submissions/tisaac/run-4-final/mode-report.md
🎉 Run complete!
[exit 0]
```

The run report (`assignments/submissions/tisaac/run-4-final/mode-report.md`):

```
# SWE STEM-OPT Runway — run report

**67 postings checked → 28 Apply · 4 Consider · 35 Skip · 0 held (not scored).**

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
| Datadog — Senior Software Engineer | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Bazel Tools | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - CI/CD Security | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Distributed Systems | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Distributed Systems (Continuous Profiler) | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Husky Storage | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Incident Insights & Readiness | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Streaming Platform | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| Datadog — Senior Software Engineer - Streaming Platform Client | **Apply** | 0.430 | composite 0.430 ≥ 0.3, gates healthy | 1 [record] | 0.8 h1b-history [record] |
| GitLab — Senior Backend Engineer, Platform Enablement | **Consider** | 0.290 | composite 0.290 in the Consider band [0.2, 0.3) | 1 [record] | 0.4 form-d-funding [record] |
| GitLab — Senior Backend Engineer, Platform Readiness | **Consider** | 0.290 | composite 0.290 in the Consider band [0.2, 0.3) | 1 [record] | 0.4 form-d-funding [record] |
| GitLab — Senior CX Platform Engineer | **Consider** | 0.290 | composite 0.290 in the Consider band [0.2, 0.3) | 1 [record] | 0.4 form-d-funding [record] |
| GitLab — Senior Software Engineer, Security Factory: Code Security | **Consider** | 0.290 | composite 0.290 in the Consider band [0.2, 0.3) | 1 [record] | 0.4 form-d-funding [record] |
| Cloudflare — Senior Forward Deployed Infrastructure Engineer | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Infrastructure Engineer, Storage Platform | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Addressing Team | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Cloudflare for SaaS | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Cloudflare Hyperdrive | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Cloudflare Queues | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Deploy at Scale | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Distributed Databases | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Durable Objects (DO) | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Egress (Go/Rust) | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Fintech | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Internal Fraud Platform | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Load Balancing | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Network Connectivity (Go/Rust) | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Network On-Ramps | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Network Platforms | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Quicksilver - Distributed Key Value | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, R2 Gateway | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, R2 Metadata | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer - Security Platform | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Senior Software Engineer, Zero Trust Client | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, Cloudflare Network Interconnect | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, Deploy at Scale | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer - Egress (Go/Rust) | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, Mobile SDK | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, Network Performance & Reliability (Argo) | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, R2 Gateway | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Software Engineer, Workers Deploy & Config | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Threat Intelligence Software Engineer, Cloudforce One | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Cloudflare — Vulnerability Defense Software Engineer, Cloudforce One | **Skip** | 0.150 | composite 0.150 < 0.2 — time is better spent elsewhere | 1 [record] | 0 no-matched [your-input] |
| Klaviyo — Deliberate break: job id that does not exist | **Skip** | 0.000 | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | 0 [record] | 0.8 h1b-history [record] |

## Held — the mode refused to score these (0)

None.

## Not found in the sponsorship file

Duolingo, Cloudflare — check the legal name by hand before trusting the 0.

## Gates you still have to clear before applying

- **Visa timeline:** `timeline` is your own input — confirm your OPT dates against the start date.
- **International-student ban:** read the JD for "US citizens only", "no sponsorship", or clearance requirements.
- **Excluded titles:** skip Data / ML-specialist roles.

Full scorer audit: `assignments/submissions/tisaac/run-4-final/role-scores.md`.
```

Result: 67 → **Apply 28 · Consider 4 · Skip 35 · Held 0** (skip 52%).

- The 9 Datadog postings that were held in the walkthrough are scored, on the board record plus the embedded application form.
- Cloudflare's office lists placed 30 postings in the US and dropped 12 whose offices are all abroad, so nothing is held for location. GitLab's one "Remote" posting was placed the same way.
- **The 52% skip rate is not a quality signal.** 30 of the 35 skips are Cloudflare postings, skipped only because Cloudflare has no row in the visa file. It is a large public company, the kind the file misses. That is a "not found", not a "doesn't sponsor", and G3 (check the name by hand) still applies.

## Verified vs. inferred (Run 4)

| Value | Label | Where it came from |
|---|---|---|
| Posting title, location, URL, job id | `record` | Greenhouse board API, saved in `final/postings-2026-10-21/*.raw.json` |
| Which postings were kept | rule applied to a record | `scope.json` (my rules, saved as `scope.used.json`) applied to the snapshot; every decision in `final/postings-2026-10-21-audit.md` |
| Location placed from offices (31) | `record` | the board's location names only a work model; Greenhouse's office list for the job names a US city (Cloudflare 30, GitLab 1). 12 more Cloudflare postings were dropped because every office is abroad |
| Liveness 1.0 (57 postings) | `record` | on the Greenhouse board **and** page check `active` |
| Liveness 1.0 (9 Datadog) | `record` | on the board **and** the page embeds the Greenhouse application form for that job id (page check said `uncertain`) |
| Liveness 0 (dead link) | `record` | job id not on the board (page check said `active`; the board wins) |
| Sponsorship 0.8: Klaviyo (14), Toast (5), Datadog (9) | `record` | CSV `Total Approvals` 154 / 150 / 340, found through my `csv_name`. The 0.8 itself is my mapping, not in the file |
| Sponsorship 0.4: GitLab (3) | `record` | CSV `GITLAB INC`: no approvals, `total_funding` $26M, found through my `csv_name` |
| Sponsorship 0: Duolingo (4), Cloudflare (30) | `your-input` | no `DUOLINGO` or `CLOUDFLARE` row in the CSV; 0 is my "missing is not a deduction" rule |
| Fit 0.5 | `your-input` | my placeholder; nobody read a JD |
| Timeline 1.0 | `your-input` | my assumption from the 3-year runway |
| Apply / Consider / Skip | — | scorer arithmetic on the terms above (`role-scores.json` → `trace.arithmetic`) |

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
2. **Checked the sponsorship values by hand in the CSV** (same output, last command above, plus the walkthrough lookup): `KLAVIYO INC` 154, `TOAST INC` 150, `DATADOG INC` 340 approvals; `GITLAB INC` funding only; no `DUOLINGO` row.
3. **Audited a held posting by opening it.** Datadog's page returned HTTP 200 with 7,704 characters of content. The main page had no apply button; the Greenhouse application iframe was present with `token` = the job id. I confirmed this in the page source. After the fix, the collector found the iframe on all 9 Datadog postings, on two runs in a row. Its first attempt missed one page that loaded slowly, so it now waits for the iframe.
4. **Confirmed the posting that closed.** GitLab job 8889193002 is in the 19:16 snapshot, was absent at 19:32, and the single-job API now returns 404.
5. **Checked a placed location by hand.** Cloudflare job 7629805: its page says "Austin, US; Seattle, US or London, UK"; the board's location field says only "In-Office"; Greenhouse's office list says Austin, TX, United States; London, United Kingdom; Seattle, WA. I also compared two Greenhouse sources for all 443 Cloudflare postings, the office list (`/offices`, 1.0 MB) and the job descriptions (`jobs?content=true`, 7.7 MB). They gave the same offices for every posting, so the mode uses the smaller one.
6. **Re-ran the final run's selection from its saved snapshot, with no network.** It used the rules saved with the snapshot (`scope.used.json`), and the job list came out byte-for-byte identical:

```
$ node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --from-snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/final/postings-2026-10-21 --out-dir ../_replay-check
board klaviyo (Klaviyo): 163 listed → 14 selected
board toast (Toast): 318 listed → 5 selected
board duolingo (Duolingo): 61 listed → 4 selected
board datadog (Datadog): 439 listed → 9 selected
board gitlab (GitLab): 229 listed → 4 selected
board cloudflare (Cloudflare): 443 listed → 30 selected
✅ 67 jobs (incl. 1 break) → ../_replay-check/jobs-2026-10-21.json
✅ audit → ../_replay-check/postings-2026-10-21-audit.md
[exit 0]

$ cmp ../_replay-check/jobs-2026-10-21.json scripts/contrib/2026fa/tisaac-swe-stem-opt/final/jobs-2026-10-21.json && echo identical
identical
[exit 0]
```

7. **Ran both offline tests:** `index.test.mjs` 20/20 and `select-postings.test.mjs` 32/32. Both use purpose-built fixtures (`test-fixtures/jobs.fixture.json`, and a fake board built inside the test), not real run data.
8. **Broke the code on purpose six times.** In each case the test failed as it should, and the code was restored afterwards:

```
# M3: in index.js, the board-absent rule `e.board_listed === false` changed to `=== "never"`; ran index.test.mjs
  ✗ liveness: job id not on the board → gate 0 (record) and Skip, even if the page check says active
  ✗ stop condition: signals disagree or are missing → role is held, never scored
  ✗ liveness: an iframe never reopens a job that is not on the board
  ✗ a person's "open" never overrides the board record "not on the board"
  ✗ a closed posting with an unclear location is a plain Skip, not a hold
15 passed, 5 failed

# M4: in select-postings.mjs, whitespace normalization removed (`norm = (s) => (s || '')`); ran select-postings.test.mjs (21-check version)
  ✗ keeps "Senior Software  Engineer" @ "Boston, MA" (in scope)
  ✗ replaying the saved 2026-10-21 snapshot reproduces jobs-2026-10-21.json
19 passed, 2 failed

# M5: in scope.json, the full US state-name pattern removed; ran select-postings.test.mjs (21-check version)
  ✗ keeps "Software Engineer" @ "Remote - California" (in scope)
20 passed, 1 failed

# M6: in index.js, the iframe rule `e.greenhouse_iframe === true` changed to `=== "never"`; ran index.test.mjs
  ✗ liveness: listed on the board + page embeds the Greenhouse form for this job id → gate 1, record
19 passed, 1 failed

# M7: in index.js, the location hold `job.location_unclear` changed to `=== "never"`; ran index.test.mjs
  ✗ stop condition: location unclear → held for a person, never scored as if in the US
19 passed, 1 failed

# M8: in select-postings.mjs, office-list placement disabled (`if (offices.length && false)`); ran select-postings.test.mjs (32-check version)
  ✗ keeps "Senior Infrastructure Engineer, Storage Platform" @ "In-Office" (location from Greenhouse offices)
  ✗ drops "Senior Software Engineer, Workers" @ "Hybrid" (location not in the US (Greenhouse offices)
  ✗ a place taken from the job's offices is kept unflagged, with the offices on the job
29 passed, 3 failed
```

## Reflection

- **What went well.** Every real posting in the final run had a recorded liveness signal, and nothing had to be guessed. The board record caught a dead link that looked alive. Holding a role instead of scoring it worked as designed on real data: it stopped ten Datadog postings that the page check could not read, until the real cause was found. Writing the scope down and auditing every dropped posting made the filter checkable. Most errors were found by reading an audit or a pasted output, not by luck.
- **What the mode got wrong.** (1) Exact name matching skipped real sponsors ("Toast", "Datadog", "GitLab") until I matched the names myself. (2) My first filter dropped "Software Engineer - Data Automation", missed double-spaced titles and SRE / Platform roles, and called "Remote - California" and "Hybrid" non-US. (3) The repository's page checker calls a redirected dead link "active" and cannot see an application form inside an iframe. The mode works around both for Greenhouse only. (4) File names used the UTC date, so a run after 8 pm could silently read yesterday's job list.
- **What it missed.** With `fit` fixed at 0.5, every posting at a company scores the same. Run 4 marks 28 of 67 Apply. Its 52% skip rate looks healthy, but 30 of the skips are one company missing from the visa file. Without that, it would skip far less than the ~50% a healthy run skips. The mode can rank companies but cannot tell a "Software Engineer II" from a "Senior" role. Three of the six boards belong to large sponsors, so this sample also leans toward Apply. The visa file misses large public companies (Cloudflare, Google, Nike).
- **Next steps.** (1) Read each JD and set `fit` per role, by hand or as a labeled model judgment that quotes the sentence it relied on; the same read would clear G4 (sponsorship bans). (2) Find a second sponsorship source for large public companies the file misses. (3) Suggest `csv_name` candidates by city and normalized name, still requiring a person to accept each one. (4) Add role quality (salary, remote) outside the scorer, since its weight there is 0.

## Attestation
- Recipe: case-swe-stem-opt-runway v0.2.0
- By: Isaac Tai (tisaac) · 2026-10-21

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `select-postings.mjs --out-dir …/final` (live, 6 boards, from scratch) | 1,653 listed → 66 selected + 1 break; 31 placed by office lists, 12 dropped by them, 0 unclear; audit + `scope.used.json` written | a written reason for every posting |
| `select-postings.mjs --from-snapshot final/postings-2026-10-21` | identical `final/jobs-2026-10-21.json` (`cmp`) | same snapshot + saved rules → same selection |
| `collect-liveness.mjs` on 67 postings | 57 board+active; 9 Datadog board+uncertain+**iframe**; break not on board | dead link flagged by the board; Datadog readable |
| `index.js` Run 4 | Apply 28 · Consider 4 · Skip 35 · Held 0 | nothing left to guess |
| Walkthrough (by me): select → liveness → score → name gate → re-score | Cloudflare 0; 10 Datadog held; GitLab job closed in 16 min; GitLab 3 × Consider after the name match | — (this run found the bugs fixed in Run 4) |
| `npm run ats:liveness` on the four Run 1 URLs | `4 active`, including the dead link | — (this is the weakness) |
| `curl` single-job API | 200 ×3, 404 for the dead id; 404 for the closed GitLab job | board is authoritative |
| SEC EDGAR + posting page address (by hand) | both 333 Summer St, Boston MA 02210 | same company → accept `TOAST INC` |
| Datadog page source (by hand) | apply form in `grnhse_iframe`, `token` = job id | the posting is open |
| **Break:** dead job id in the input | Skip, `gated: liveness ≈ 0.000` | gate closes |
| **Break M3:** board-absent rule disabled | `index.test.mjs` 15/20, exit 1 | test fails |
| **Break M4:** whitespace normalization removed | `select-postings.test.mjs` 19/21 at the time, exit 1 | test fails |
| **Break M5:** full state names removed from scope | `select-postings.test.mjs` 20/21 at the time, exit 1 | test fails |
| **Break M6:** iframe rule disabled | `index.test.mjs` 19/20, exit 1 | test fails |
| **Break M7:** location hold disabled | `index.test.mjs` 19/20, exit 1 | test fails |
| **Break M8:** office-list placement disabled | `select-postings.test.mjs` 29/32 at the time, exit 1 | test fails |
| Cloudflare 7629805 page vs office list (by hand) | page: Austin, Seattle, London; office list: the same | place from the office list |

### Did not test
- Any ATS other than Greenhouse (Lever, Ashby, Workday). Those postings would be held, but this was not run on real ones.
- `liveness_checked_by_hand` and `location_checked_by_hand` on real data: nothing was left held in Run 4, so I recorded none. Only the offline tests cover them.
- A failed office-list download on a real board (it falls back to holding the posting); only the code path, not a real failure, was exercised.
- A posting added by hand from a company's second Greenhouse board (it would be skipped as "not on the board").
- Fit from the job description: every `fit` is my 0.5 placeholder.
- The visa-timeline gate for real dates, and the ban and title gates (G4, G5) for each of the 28 Apply roles. No application was sent.
- Whether `scope.json` is the right scope for anyone but this persona; other machines or Node versions.

### Broke during testing, fixed
- The earlier prototype's offline URL rule would mark every real posting `-1`, because the posting URLs are company sites (`klaviyo.com`, `careers.toasttab.com`), not `greenhouse.io`. Fixed: the gate now comes only from the liveness evidence file, and the old rule was removed. `index.js` now refuses to run without `--liveness`, instead of guessing.
- Hand-written, unsaved filter → replaced by `select-postings.mjs` + `scope.json` + audit. Fixed in it:
  - titles are whitespace-normalized;
  - "Data" in an SWE title no longer drops it;
  - SRE / Platform / Test titles are included;
  - full state names and "City ST" count as US;
  - a bare "Remote", "Hybrid", "In-Office", or "Distributed" is reported as "location unclear", not "not in the US";
  - interns are excluded;
  - location is checked last, so every location drop in the audit is an in-scope title.
- Page check blind to iframes → the collector records the embedded Greenhouse application form for the job id. It first missed a slow page, so it now waits up to 8 s, only when the page check was not already `active`.
- Held roles could not be settled by a person → `liveness_checked_by_hand` (your-input; never overrides "not on the board").
- Work-model-only locations were dropped, first as "not in the US" and then as "location unclear" → now placed from Greenhouse's office list, and held for a person (`location_checked_by_hand`) only when there is none. The office list first came from `jobs?content=true` (7.7 MB for Cloudflare, mostly job descriptions). It now comes from `/offices`, which gives identical offices for all 443 Cloudflare postings, and only for boards that need it (Toast's `/offices` is 9.6 MB). An office named only "Remote" is not treated as a place.
- Output folders of Runs 1–3 and of the earlier Run 4 attempts were removed from the submission (archived outside the repo); their output is pasted in this file.
- The offline tests first ran on real postings from Run 1 and on Run 2's snapshot, so a changing board could change a test. They now use purpose-built fixtures, one record per case (`test-fixtures/`), and the Runs 1–3 data was removed. `collect-liveness.mjs` no longer has default file names; it refuses to run without `--jobs` and `--out`.
- File names used the UTC date → local date; a replay is named after its snapshot.
- A replay could not reproduce an old selection after the scope changed → each live snapshot saves `scope.used.json`. The one from Runs 2–3 was restored from git (`68d4cc8`).
- `select-postings.mjs --from-snapshot` did not create its output folder. Caught by the new test on its first run; fixed.
- `mode-report.md` listed each `no-matched` company once per posting. Fixed: one line per company.
- The first by-hand CSV check concluded the file had only `TOAST HOLDINGS INC` (New York). It also has `TOAST INC` (Boston); that check had printed only the first two matches. A full re-check found it.
