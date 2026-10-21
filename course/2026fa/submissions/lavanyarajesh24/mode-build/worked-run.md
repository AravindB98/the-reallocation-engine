# Worked run — network-targets-swe v0.2.0 (Mode Build)

## Executive summary

**What this is.** This is the record of running my mode for real: live job boards, a real
browser check of each posting, a 252 MB Department of Labor file, and E-Verify lookups.
The output is pasted, not described.

**Why read it.** It shows what the mode established from records versus what a person or
a model judged. It also shows how I tried to break it, and where it is still weak.

**What it found.** On 2026-10-21 the mode sorted 133 MA/NY sponsor-history employers:

| Group | Count | Who |
|---|---|---|
| Apply now | 4 | Cohere Health, Justworks, Klaviyo, PathAI |
| Network first | 17 | |
| Check the board | 108 | |
| Skip | 4 | |

Along the way it caught:
- a "software sponsor" with **zero** software-developer filings (Ginkgo Bioworks);
- a wrong job board (TALENT INC → "Slice Talent Community");
- one posting that closed mid-session and one that is listed but dead;
- a bug in my own LCA rule that wrongly demoted four remote-hiring sponsors. I fixed it.

## Inputs

| Input | Value | Kind |
|---|---|---|
| Persona | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/persona.json`. **Fictional** "Meera Iyer", built to match my situation (MS SWE, Boston, Dec 2026 grad, F-1, OPT from 2027-01-15, SOC 15-1252, MA/NY). No private data used. | your-input |
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, 30,369 rows | record |
| DOL LCA | `LCA_Disclosure_Data_FY2026_Q3.xlsx`, 251,850,891 bytes, sha256 `f8ca8448a528…`, downloaded by me from dol.gov on 2026-10-20 | record |
| E-Verify | USCIS E-Verify Employer Search, 22 lookups on 2026-10-20/21 → `inputs/everify.csv` | record |
| Job boards | Greenhouse/Lever public APIs, captured 2026-10-21T19:22:32Z | record |
| Postings | 15 matching posting URLs, opened in headless Chromium 2026-10-21T19:23:43Z | record |
| Board confirmations | Lendbuzz, Sofar Sounds, Attentive confirmed by me; iSee not confirmed | your-input (gate G4) |

## Commands and real output

### 1. Board discovery (TODO 3), 2026-10-20

```
$ node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/discover-boards.mjs
detect-ats.py on 133 candidate(s)…
[113/133] TOAST INC -> greenhouse (309 jobs)
…
✓ CAMBRIDGE MOBILE TELEMATICS INC          greenhouse/cambridgemobiletelematics  name-match (board name "Cambridge Mobile Telematics")
✗ TALENT INC                               greenhouse/talent  name-mismatch (board name "Slice Talent Community")
✗ ATTENTIVE MOBILE INC                     greenhouse/attentive  name-mismatch (board name "Attentive")
✗ CAMBRIDGE MOBILE TELEMATICS INC          greenhouse/cmt  name-mismatch (board name "CMTelematics")
✗ ETSY INC                                 greenhouse/etsy  board-not-found
? LENDBUZZ INC                             lever/lendbuzz  unverified
…
133 candidates → 37 board entr(ies): {"name-match":24,"name-mismatch":3,"board-not-found":7,"unverified":3}; 98 with no board found → scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/boards.discovered.json
```

(Excerpt. The full output lists all 37 entries. `…` marks lines I cut, nothing else. The
`[113/133]` detector line is from the first discovery run. The identity lines and the
summary are from the second run, after I added the `board-not-found` status, which split
the 7 dead hand-entered slugs out of "unverified".)

### 2. DOL extract (TODO 1)

```
$ python3 scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/extract-lca.py ~/Downloads/LCA_Disclosure_Data_FY2026_Q3.xlsx
  … 1,000,000 rows read, 118,845 kept
✓ 1,032,735 rows read → 118,845 certified H-1B LCAs for SOC 15-1252 nationwide across 13,991 employers (8,949 at worksites in MA, NY)
  received dates: all rows 2021-01-04 … 2026-06-30; kept rows 2025-09-24 … 2026-06-23
```

### 3. Deliberate stale run, before the browser gate (break attempt)

After I confirmed three boards, the snapshot was re-captured at 19:22. The old
`liveness.json` was from 01:16. I ran the mode anyway, on purpose:

```
$ node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.mjs --out-dir course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live
✓ network-targets 2026-10-21: 133 candidates from 30369 CSV rows
  apply 0 · network 16 · check-board 114 · skip 3 · not-in-dataset 0
  liveness: stale · postings {"active":0,"expired":0,"uncertain":0,"unverified":15,"not-run":0}
  LCA: ok · 64/133 with a certified 15-1252 LCA · 50 tier(s) capped · E-Verify: 20 looked up, 20 open
  scorer: scored 19 roles → Apply 0 · Consider 0 · Skip 19 (skip 100%)
  Form D sample match: 0/133 (200 sample filings)
  course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/network-targets-log.json  +  course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/network-targets-report.md
[exit 0]
```

Apply dropped to 0, so old browser results were not reused.

### 4. The engine's own liveness gate, verbatim

```
$ npm run ats:liveness -- --file course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/posting-urls.txt

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/posting-urls.txt

Checking 15 URL(s)...

✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/8015082003
⚠️ uncertain  https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561
           content present but no visible apply control found
⚠️ uncertain  https://careers.formlabs.com/job/7536038/apply/?gh_jid=7536038
           content present but no visible apply control found
✅ active     https://job-boards.greenhouse.io/ginkgobioworks/jobs/5166911007
✅ active     https://job-boards.greenhouse.io/ginkgobioworks/jobs/5241119007
✅ active     https://boards.greenhouse.io/justworks/jobs/8179714?gh_jid=8179714
✅ active     https://boards.greenhouse.io/justworks/jobs/8286381?gh_jid=8286381
✅ active     https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003
✅ active     https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003
✅ active     https://www.klaviyo.com/careers/jobs/7855793003?gh_jid=7855793003
⚠️ uncertain  https://www.mongodb.com/careers/job/?gh_jid=8065483
           content present but no visible apply control found
⚠️ uncertain  https://www.mongodb.com/careers/job/?gh_jid=8089859
           content present but no visible apply control found
⚠️ uncertain  https://www.mongodb.com/careers/job/?gh_jid=8119841
           content present but no visible apply control found
✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002
❌ expired    https://seatgeek.com/jobs/8227548?gh_jid=8227548
           insufficient content — likely nav/footer only

Results: 9 active  1 expired  5 uncertain
[exit 1]
```

`live-check.mjs` then ran the same `checkUrlLiveness()` and saved the per-URL results. It
gave the same 9 / 1 / 5 split on the same 15 URLs.

### 5. Final run

```
$ node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.mjs --out-dir course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live
✓ network-targets 2026-10-21: 133 candidates from 30369 CSV rows
  apply 4 · network 17 · check-board 108 · skip 4 · not-in-dataset 0
  liveness: browser · postings {"active":9,"expired":1,"uncertain":5,"unverified":0,"not-run":0}
  LCA: ok · 64/133 with a certified 15-1252 LCA · 50 tier(s) capped · E-Verify: 22 looked up, 22 open
  scorer: scored 29 roles → Apply 7 · Consider 0 · Skip 22 (skip 76%)
  Form D sample match: 0/133 (200 sample filings)
  course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/network-targets-log.json  +  course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/network-targets-report.md
[exit 0]
```

The "Apply now" section of the human report, as written:

| Company | Sponsorship | SWE LCAs | E-Verify | Postings · browser |
|---|---|---|---|---|
| COHERE HEALTH INC | 104 approved / 2 denied → **Proven** | 12 US · 4 MA/NY · Level I 1 / II 3 · last 2026-05-29 | open | Software Engineer I, Integrations (United States) · **active** |
| JUSTWORKS INC | 80 / 2 → **Proven** | 2 US · 2 MA/NY · Level I 0 / II 0 | open | Software Engineer, Backend (New York) · **active**; Software Engineer, Solutions Engineering · **active** |
| KLAVIYO INC | 154 / 4 → **Proven** | 36 US · 30 MA/NY · Level I 7 / II 4 · last 2026-06-12 | open | 3 postings, all **active** |
| PATHAI INC | 78 / 2 → **Proven** | 1 US · 1 MA/NY · Level I 0 / II 0 | open | Software Engineer I, Fullstack (Boston, Hybrid) · **active** |

Tests:

```
$ node --test scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.test.mjs scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/mode-build.test.mjs
# tests 17
# pass 17
# fail 0
```

## Verified vs. inferred

| Claim in the output | Established by | Kind |
|---|---|---|
| Klaviyo had 154 approvals / 4 denials | 80 Days CSV row | **verified** (record) |
| Klaviyo filed 36 certified 15-1252 LCAs in FY2026 Q1–Q3, 30 in MA/NY, 7 at Level I | DOL workbook via `extract-lca.py`; recounted independently (see Verification) | **verified** (record) |
| Klaviyo is "Proven" | My tier thresholds (≥10 approvals, ≥90 %) applied to the record | **inferred** (your-input rule) |
| Ginkgo Bioworks is capped to "Possible" | Zero 15-1252 LCAs nationwide (record) + my `lca_cap` rule (your-input) | record + **inferred** |
| Klaviyo's "Software Engineer II - Recommendations" is live | Listed on the board API at 19:22 **and** an apply control seen in Chromium at 19:23 | **verified** (record) at that time only |
| That posting is a real, fillable opening that can wait until 2027-01-15 | Nothing | **not verified**: H1 human gate |
| Cohere's "Software Engineer I" suits a new grad | The title, plus Cohere's Level I/II LCA counts | **inferred**: titles and wage levels are evidence, not proof |
| Klaviyo is enrolled in E-Verify | USCIS search, 2026-10-21T18:58Z: "Klaviyo Inc., Open, 2020-01-15, MA" | **verified** (record) for that name on that date |
| The Lendbuzz Lever board is Lendbuzz's | My judgment after opening it (gate G4) | **inferred** (human judgment) |
| "Network first" companies are worth meeting | The routing rule over records | **inferred**: a suggestion for a person |
| Apply / Consider / Skip and composites | `role-scorer.mjs`, unchanged | computed from the above |
| Anything labeled model-judgment | None in this run | — |

## Verification

1. **Count cross-check against the source.** For Klaviyo, the report row, the extract
   row and an independent substring recount over the raw workbook all agree. The recount
   is a separate script that doesn't use the name key. Result: see the attestation.
2. **Two independent extractions agree.** The MA/NY count was 8,949 in both the
   target-states-only version and the nationwide version of `extract-lca.py`.
3. **Capped employers checked by hand.** For the seven employers the first cap demoted, I
   scanned the full workbook for *any* filing:
   - Ginkgo: only bio/chem SOCs (17-2031, 17-2041, 19-1021, 19-1029), so the cap is right.
   - Abacus, Acquia, Lookout, Yieldmo: 15-1252 filings in WA/GA/CA/TX, so the cap was
     wrong, and I fixed it (see the attestation).
4. **Cohere Health, verified twice.**
   - The posting first came back active, then expired (`?error=true`).
   - I re-ran `npm run ats:liveness` on that one URL and saw expired again, with exit 1.
   - The board API had dropped from 77 to 76 jobs and no longer listed the ID.
   - The next day a new Software Engineer I posting (8015082003) appeared, and it is the
     one in "apply" now.
5. **Exit codes.** My first `ats:liveness` run printed `exit 0` because I'd piped it
   through `tail`. Run unpiped, it exits `1` (expired + uncertain present), as the script
   says it should.
6. **Parsed the JSON.**
   - Every company appears in exactly one bucket (4 + 17 + 108 + 4 = 133).
   - `roles.json` has no company whose board or posting was unconfirmed.
   - The labels test walks every `{value, source}` in the log.

## Reflection

**What went well**
- Every hard gate fired on real data, not only on fixtures:
  - identity (TALENT INC);
  - board-not-found (7 dead slugs);
  - browser liveness (SeatGeek; Cohere's closed posting);
  - stale results (step 3).
- The DOL join changed decisions for a reason I could check by hand.

**What it got wrong or missed**
- **My first LCA cap was wrong.** It counted MA/NY worksites only and would have pushed
  four real software sponsors out of "network first". I caught it only because I checked
  the demoted names by hand.
- **The browser check can't read some career sites.** MongoDB's and Formlabs' pages came
  back "uncertain". These may well be open jobs, and they sit in "check the board".
- **Coverage is thin.** 98 of 133 employers had no Greenhouse/Lever board the detector
  could find (Workday, Ashby and own sites aren't covered).
- **E-Verify could not be scripted.** The search tool has no export, and its scripting
  API ignores the name filter. Automated typing broke after one query per page load
  until the pane was visible and each query waited. Toast only matched as "Toast", not
  "Toast, Inc". I did the 22 lookups through the browser, one at a time.
- **"Apply" titles still need a human.** Klaviyo's "Software Engineer II" postings may be
  above new-grad level; the title filter excludes "Senior" but not "II".

**Next steps**
1. Add an Ashby provider to `detect-ats.py`, and a Workday path through the existing
   `scrapers/workday/`.
2. Re-check "uncertain" postings with provider-specific apply-button selectors for
   MongoDB-style wrapped Greenhouse pages.
3. Add a reported-but-never-used fuzzy LCA name match, so name mismatches surface as
   warnings instead of silent zeros.
4. Re-extract when DOL publishes FY2026 Q4, and diff the caps.

## Attestation

- Recipe: network-targets-swe v0.2.0
- By: Lavanya Rajesh · 2026-10-21. Runs and checks were carried out with Claude; I read the final report (gate H1) and confirmed three boards (gate G4).

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `discover-boards.mjs` on 133 candidates | 24 name-match, 3 mismatch (TALENT → "Slice Talent Community"), 7 board-not-found, 3 Lever unverified | wrong slugs rejected, not fetched |
| `npm run ats:liveness -- --file …/posting-urls.txt` (unpiped) | 9 active, 1 expired, 5 uncertain, exit 1 | exit 1 when any posting is not active |
| **Break:** final run with a liveness file older than the snapshot | `liveness: stale`, apply 0, 15 postings unverified | old browser results never reused |
| **Break:** the same URL re-checked after the job closed (Cohere 7930480003) | expired, redirect to `?error=true`; board API 77 → 76 jobs | gate follows the live page, not the earlier result |
| `extract-lca.py` on the 252 MB workbook, twice (state-only, then nationwide) | 8,949 MA/NY LCAs both times | identical counts across versions |
| Independent Klaviyo recount over the raw workbook (separate script, substring match, no name key) | `{'us': 36, 'ma_ny': 30, 'LI': 7, 'LII': 4, 'LIII': 13, 'LIV': 11, 'LNone': 1}` | 36 US / 30 MA-NY / Level I 7 / II 4, as in the report; III 13 / IV 11 / none 1, as in the extract row |
| **Break:** hand-scan of the 7 capped employers | Ginkgo bio/chem only; 4 with out-of-state 15-1252 filings | caps only where there are truly zero software filings |
| **Break (tests):** wrong slug, identity-unverified board, uncertain posting, stale liveness, workbook missing a column, OPT window already ended, CSV missing a column, corrupt snapshot | all rejected or halted as designed; 17/17 pass | nothing decided on bad input |
| E-Verify search for "Toast, Inc" vs "Toast" | no row vs. "Toast Inc., Open, 2018-11-14" | (found a limitation; recorded in `everify.csv`) |

### Did not test
- Whether any "apply" posting will accept a January 2027 start. That is the H1 gate, for
  a person to check.
- Lever liveness pages in a browser (no Lever posting matched the filters).
- Ashby, Workday or company-site boards: not supported.
- E-Verify for the 108 check-board and 4 skip employers: `not-looked-up`.
- LCA filings under a different legal name than 80 Days uses.
- Any DOL release other than FY2026 Q3.
- `--profile` on the scorer (deliberately not used; see the recipe's cannot-verify table).

### Broke during testing, fixed
- **LCA cap counted target-state worksites only.** It demoted Abacus Insights, Acquia,
  Lookout and Yieldmo. Fixed in `extract-lca.py` (nationwide `certified_lcas` plus
  `certified_in_target_states`) and in `network-targets.mjs` (cap only on zero
  nationwide). Test updated in `mode-build.test.mjs`.
- **LCA provenance date range covered all rows, not kept rows.** It showed 2021–2026 for
  an FY2026 extract. Added `received_date_range_kept`; the run record uses it.
- **Fixture tests would have read the real `inputs/liveness.json`, `everify.csv` and
  LCA file once they existed.** All tests now pass explicit non-existent paths.
- **E-Verify automation read stale results.** Every query after the first returned the
  previous table. I caught it with a "rows contain the query" check, then changed method
  (revert before each query, pane visible, wait). Stale reads were discarded, never
  saved.
- **My own `ats:liveness` exit code was masked by a pipe.** Re-run unpiped for the record.
