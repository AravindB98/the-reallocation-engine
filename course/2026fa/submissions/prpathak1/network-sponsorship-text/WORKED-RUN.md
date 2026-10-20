# Worked run: network-sponsorship-text, 2026-10-20

## Executive summary

This is the record of the first real run of the "what the posting says about sponsorship" workflow,
against three real employers' public job boards on 20 October 2026. It shows every command and its
real output, separates what was checked from what was judged, and lists the deliberate attempts to
break it.

**Result:** 7 in-scope network-engineering postings. **2 are ruled out by inference** (a required
security clearance). **5 do not say.** **None offers sponsorship.**

**The most important finding is about the tools, not the jobs.** The repository's existing fetcher
silently threw away the very postings that had clearance wording, and drops the section where that
wording lives. Run that way, the workflow would have reported "nothing about sponsorship" for
everything, and looked correct.

## Run record

| | |
|---|---|
| Recipe | `recipes/cases/2026fa/prpathak1-network-sponsorship-text.md` v0.1.0, status DRAFT |
| Branch | `contrib/2026fa-prpathak1-mode-network-sponsorship-text` (from upstream `main` @ `015843d`) |
| Runs | `20261020-1344` (run 1) and `20261020-1348` (run 2, after fixing a fetch defect); liveness and 80 Days at 13:47 EDT |
| Persona | fictional F-1 master's student, network engineering, pre-OPT, SOC 15-1241 (anonymized: no real person) |
| Boards | Lever public API: `shieldai`, `zoox`, `palantir`; plus `plaid` (not a Lever board) as the not-found test |
| Environment | Windows 11 CMD; Python 3.11.9 venv outside the repo (+ `requests`); Node v24.19.0; Playwright 1.62.1 Chromium |
| Raw output | `private/real-postings/`, `private/network-sponsorship-text/` (gitignored, not committed) |
| Console logs | `logs/` in this folder (verbatim) |
| Labels | `LABELS.md`, approved by Prathamesh 2026-10-20 13:57 / 14:01 EDT |

## 1. Commands and real output (verbatim)

**Cmd 1, existing maintained fetcher** (`cd scripts\ats`):
```
python fetch-real-postings.py --lever "Shield AI" "Zoox" "Palantir" "Plaid" -o ..\..\private\real-postings\20261020-1344-existing.json

[lever] Shield AI: found 22 jobs
[lever] Zoox: found 239 jobs
[lever] Palantir: found 265 jobs
2026-10-20 13:44:30 | ats_scraper.retry | WARNING  | Non-retryable status 404 for https://api.lever.co/v0/postings/plaid
[lever] Plaid: not found

526 real postings combined from 3/4 companies found
  499 have description_text, 27 do not (schema gate will reject those)
  wrote ..\..\private\real-postings\20261020-1344-existing.json
  not found: ['Plaid']
```

**Cmd 2, extraction on the existing fetcher's output** (the 7 network rows of 526 shown; full listing in `logs/`):
```
python scripts\contrib\2026fa\prpathak1-network-sponsorship-text\extract_auth_sentences.py private\real-postings\20261020-1344-existing.json --out private\network-sponsorship-text\20261020-1344\existing

silent         0 sentence(s)  zoox       Senior Manager, Network Engineering & Infrastructure  fields=description_text
silent         0 sentence(s)  zoox       Senior Network Security Engineer  fields=description_text
silent         0 sentence(s)  zoox       Software Engineer - Road Network Tools  fields=description_text
silent         0 sentence(s)  zoox       Staff Network Security Architect  fields=description_text
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=description_text
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=description_text
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=description_text
[extract] postings=526 silent=518 sentences=8 (labels: none assigned; human gate)
```
No Shield AI network posting appears at all. The 8 sentences are all in non-network postings.

**Cmds 3–5, full fetch → title filter → extraction (run 2, `20261020-1348`):**
```
python …\fetch_lever_full.py shieldai zoox palantir -o private\real-postings\20261020-1348-full.json
[lever-full] shieldai: 653 postings
[lever-full] zoox: 239 postings
[lever-full] palantir: 309 postings
[lever-full] 1201 postings from 3 board(s); 0 not found; fetched_at 2026-10-20T17:48:28+00:00

python …\filter_titles.py private\real-postings\20261020-1348-full.json --out private\network-sponsorship-text\20261020-1348\titles.json
include  shieldai   Network Architect (R6158)  [network role title]
include  shieldai   Network Engineer (R4843)  [network role title]
include  shieldai   Senior Network Engineer (R5667)  [network role title]
flag     shieldai   Software Engineer, Networking & OS (R5488)  [software-engineering title mentioning network; may be SOC 15-1252, human decides]
include  shieldai   Staff Engineer, System Test Network (R6030)  [network role title]
include  zoox       Senior Manager, Network Engineering & Infrastructure  [network role title]
include  zoox       Senior Network Security Engineer  [network role title]
exclude  zoox       Software Engineer - Road Network Tools  [false friend: 'Road Network']
include  zoox       Staff Network Security Architect  [network role title]
flag     palantir   Senior Software Engineer, Network Infrastructure  [software-engineering title mentioning network; may be SOC 15-1252, human decides]
flag     palantir   Senior Software Engineer, Network Infrastructure  […]
flag     palantir   Senior Software Engineer, Network Infrastructure  […]
[filter] network-mentioning titles: 12; include=7 flag=4 exclude=1

python …\extract_auth_sentences.py private\real-postings\20261020-1348-full.json --titles …\titles.json --out private\network-sponsorship-text\20261020-1348\full
has-sentences  1 sentence(s)  shieldai   Network Architect (R6158)  fields=additionalPlain,descriptionPlain,lists
has-sentences  2 sentence(s)  shieldai   Network Engineer (R4843)  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  shieldai   Senior Network Engineer (R5667)  fields=additionalPlain,descriptionPlain,lists
has-sentences  1 sentence(s)  shieldai   Software Engineer, Networking & OS (R5488)  fields=additionalPlain,descriptionPlain,lists
has-sentences  1 sentence(s)  shieldai   Staff Engineer, System Test Network (R6030)  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  zoox       Senior Manager, Network Engineering & Infrastructure  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  zoox       Senior Network Security Engineer  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  zoox       Staff Network Security Architect  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=additionalPlain,descriptionPlain,lists
silent         0 sentence(s)  palantir   Senior Software Engineer, Network Infrastructure  fields=additionalPlain,descriptionPlain,lists
[extract] postings=11 silent=7 sentences=5 (labels: none assigned; human gate)
```

**Cmd 6, liveness (existing maintained script):**
```
npm run ats:liveness -- https://jobs.lever.co/shieldai/b63b3f50-9b7b-42c0-8a9d-f3ba4ed1f099 https://jobs.lever.co/zoox/8321d00e-9e2b-4947-a37e-fdbad7dcd637 https://jobs.lever.co/palantir/39c57909-ae76-4c86-9290-9fb50c689c4f https://jobs.lever.co/shieldai/00000000-0000-0000-0000-000000000000
Checking 4 URL(s)...
✅ active     https://jobs.lever.co/shieldai/b63b3f50-9b7b-42c0-8a9d-f3ba4ed1f099
✅ active     https://jobs.lever.co/zoox/8321d00e-9e2b-4947-a37e-fdbad7dcd637
✅ active     https://jobs.lever.co/palantir/39c57909-ae76-4c86-9290-9fb50c689c4f
❌ expired    https://jobs.lever.co/shieldai/00000000-0000-0000-0000-000000000000
           HTTP 404
Results: 3 active  1 expired  0 uncertain
```
(Exit 1 is the script's documented code for "any expired". npm's echo of the command masks the URLs as `***`.)

**Cmd 6b, liveness of the 5 remaining in-scope postings** (2026-10-20 14:10 EDT, venv not active; closes gate G4):
```
npm run ats:liveness -- https://jobs.lever.co/shieldai/95b05cb7-5876-4582-8b94-a0586d740411 https://jobs.lever.co/shieldai/2f5ff4ff-4e51-4e20-8296-133dc62b365d https://jobs.lever.co/shieldai/dfcc6146-d5ed-4d7d-95f5-4706f37df5d1 https://jobs.lever.co/zoox/34dc14a8-80d6-4763-86e5-94287b64d5c7 https://jobs.lever.co/zoox/9945ef61-1c15-4cf1-9734-b65944c73757
Checking 5 URL(s)...
✅ active     https://jobs.lever.co/shieldai/95b05cb7-5876-4582-8b94-a0586d740411
✅ active     https://jobs.lever.co/shieldai/2f5ff4ff-4e51-4e20-8296-133dc62b365d
✅ active     https://jobs.lever.co/shieldai/dfcc6146-d5ed-4d7d-95f5-4706f37df5d1
✅ active     https://jobs.lever.co/zoox/34dc14a8-80d6-4763-86e5-94287b64d5c7
✅ active     https://jobs.lever.co/zoox/9945ef61-1c15-4cf1-9734-b65944c73757
Results: 5 active  0 expired  0 uncertain
```
With cmd 6, **all 7 in-scope postings are active** (R6158, R5667, R6030, Zoox Senior Manager and Zoox
Staff Architect at 14:10; R4843 and Zoox Senior Network Security Engineer at 13:47). None is
excluded; the shortlist is unchanged.

**Cmd 7, 80 Days company-level signal** (company columns only; personal columns never loaded):
```
{'company_name': 'PALANTIR TECHNOLOGIES INC', 'Total Approvals': '462.0', 'Total Denials': '4.0', 'Approval_Rate': '99.14163090128756', 'top_job_titles_sponsored': "[…12 titles; none a network title…]"}
{'company_name': 'SHIELD AI INC', 'Total Approvals': '', 'Total Denials': '', 'Approval_Rate': '', 'top_job_titles_sponsored': ''}
{'company_name': 'ZOOX INC', 'Total Approvals': '1364.0', 'Total Denials': '10.0', 'Approval_Rate': '99.2721979621543', 'top_job_titles_sponsored': "['Software Engineer', 'Senior Software Engineer', 'Senior Systems Engineer', 'Data Engineer', 'Senior AV Safety Data and Compliance Engineer']"}
[80days] rows matched: 3
```

**Diagnosis of cmd 1's 22 vs 653** (the maintained scraper's own `fetch_jobs`, one GET each):
```
Shield AI: raw=653 kept=22 rejected=631
    551 x Invalid employment_type: 'Full Time Employee' (valid: ['Full-time', 'Part-time', 'Contract …
    53 x Invalid employment_type: 'International Office Entity' …
    27 x Invalid employment_type: 'International EOR' …
   network postings rejected: ['Network Architect (R6158)', 'Network Engineer (R4843)', 'Senior Network Engineer (R5667)', 'Software Engineer, Networking & OS (R5488)', 'Staff Engineer, System Test Network (R6030)']
Palantir: raw=309 kept=265 rejected=44
    42 x Invalid employment_type: 'Internship' …
    2 x Invalid employment_type: 'Fixed-Term' …
```

## 2. Result (labels approved by Prathamesh; see LABELS.md)

| Employer | In-scope posting | Deciding sentence (Required) | Label |
|---|---|---|---|
| Shield AI | Network Engineer (R4843) | "This position requires the ability to obtain and maintain a DoD government clearance at the Secret level" | **contradicted (inferred)** |
| Shield AI | Staff Engineer, System Test Network (R6030) | "Ability to obtain a SECRET clearance." | **contradicted (inferred)** |
| Shield AI | Network Architect (R6158) | none (S1 is Preferred: ITAR knowledge) | insufficient |
| Shield AI | Senior Network Engineer (R5667) | none (silent) | insufficient |
| Zoox | Senior Manager, Network Engineering & Infrastructure | none (silent) | insufficient |
| Zoox | Senior Network Security Engineer | none (silent) | insufficient |
| Zoox | Staff Network Security Architect | none (silent) | insufficient |

Flagged, out of scope (software roles, likely 15-1252): Shield AI R5488; Palantir ×3. Excluded: Zoox
"Road Network Tools". Company signal, shown separately: Zoox 1,364 approvals; Palantir 462; Shield AI
no trace.

## 3. Verified vs inferred, line by line

| Statement | Side | Why |
|---|---|---|
| Shield AI, Zoox and Palantir boards returned 653 / 239 / 309 postings at 2026-10-20T17:48:28Z | **verified** | cmd 3 output |
| `plaid` is not a Lever board (HTTP 404) | **verified** | cmd 1 output |
| The existing scraper kept 22 of 653 Shield AI postings and none of the 5 network postings | **verified** | cmd 1 + diagnosis output |
| The cause is the employment-type allowlist in `schema_validator.py:58` | **verified** | the scraper's own `validation_errors` |
| The 5 sentences exist verbatim, all in Lever's `lists` field, with the sections shown | **verified** | `extraction.json` (field + section + SHA-256 per posting) |
| 7 in-scope postings had no matching sentence | **verified** (for the keyword list used) | cmd 5 output |
| **All 7 in-scope postings were active** (2 at 13:47, 5 at 14:10 EDT); the fabricated URL returned HTTP 404 | **verified** | cmd 6 + cmd 6b output. Active at check time only; postings can close later |
| Zoox 1,364 / Palantir 462 approvals; Shield AI empty | **verified** (as stored in 80 Days) | cmd 7 output |
| 32 CFR § 117.10(k)(1) says what SOURCES.md quotes | **verified** | eCFR 2026-10-01 text, SHA-256 prefix `e2d77319d907b45f` |
| R4843, R6030 (and out-of-scope R5488) are **contradicted** for this persona | **inferred** | the postings require a clearance; the citizenship limit comes from 32 CFR § 117.10(k), not the text; LAA exception possible; Shield AI's contractor status not checked |
| S1 (ITAR knowledge) and S3 ("clearance desired") do not decide | **inferred** (a human judgment) | section and wording reading, approved by Prathamesh |
| Silent postings mean "the posting does not say" | **inferred** (rule) | silence ≠ no; the keyword list may also miss phrasings |
| R5488 and Palantir ×3 are SOC 15-1252, not 15-1241 | **inferred** (a human judgment) | no title → SOC crosswalk in the repo |
| "Road Network Tools" is not network engineering | **inferred** (a human judgment) | title reading |
| Zoox's or Palantir's history says anything about these postings | **not claimed** | company signal kept separate |

## 4. Deliberate break attempts (real output)

| # | Attempt | Saw | Expected |
|---|---|---|---|
| 1 | a non-existent board `plaid` in cmd 1 | `Non-retryable status 404 …` → `Plaid: not found`; `526 … from 3/4 companies`; no Plaid postings | logged not-found, nothing invented, run continues ✓ |
| 2 | "Visa" false friend (`fixtures/BROKEN-visa-false-friend.json`, synthetic) | unit test: the sentence is extracted with keyword `visa`, `label` is `None`; a silent fixture posting reports `silent` | extracted but never auto-labeled; silence ≠ no ✓ |
| 3 | title false friends: the real Zoox "Software Engineer - Road Network Tools" + fixture (`neural network`, `road network`) | cmd 4: `exclude … [false friend: 'Road Network']`; unit test: t1/t4 exclude, t3 flag | excluded or flagged for a human ✓ |
| 4 | a posting that's gone: fabricated `…/shieldai/00000000-…` | `❌ expired … HTTP 404` | expired/uncertain, never active ✓ |
| 5 | pipeline-induced silence: cmd 2 (existing fetcher) vs cmd 5 (full fetch) on the same boards | 0 network sentences, Shield AI network postings absent vs 5 sentences in 4 postings | the existing pipeline's loss is visible ✓ |

## 5. Reflection

**Worked.**
- The read-only extraction and the human gate kept every judgment visible.
- The section prefix (Required / Preferred) turned out to be decisive: S1 and S3 would have been
  misread without it.
- Comparing the counts with the raw board found a silent defect that a clean exit code hid.

**Missed / limits.**
- Only Lever boards were checked. Greenhouse body text isn't available through the maintained scraper.
- Liveness was first sampled before the scope decision (one of 3 sample URLs was later ruled out of
  scope). The 5 remaining in-scope URLs were checked afterwards (cmd 6b), so the checks were made at
  two times, 23 minutes apart.
- The keyword list may miss phrasings, such as "U.S. work authorization required" with unusual wording.
- Only one employer used explicit wording at all.
- The clearance → citizenship step rests on an outside rule with an exception (LAA), and Shield AI's
  contractor status was not verified.
- SOC scope is a human judgment with no crosswalk.
- 11 postings from 3 employers is a small sample, enough to show the mechanism, not to estimate how
  common silence is.

**Next.**
- Close the 6 typed items in the recipe, starting with the scraper defects (rejections surfaced;
  `lists` kept).
- Add one Greenhouse board via `?content=true`.
- Then build the classifier and test it against these approved labels.

## Attestation

- Recipe: network-sponsorship-text v0.1.0
- By: prpathak1 (Prathamesh) · 2026-10-20. The rows were drafted by Claude Code from the logged runs
  above. Prathamesh cleared the label gate (G3) at 13:57 / 14:01 EDT. **Prathamesh re-read this
  attestation, including the G4 liveness changes, and confirmed it accurate on 2026-10-20 at
  14:25 EDT.**

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python -m unittest discover -s scripts/contrib/2026fa/prpathak1-network-sponsorship-text/test` | `Ran 8 tests … OK` | all pass |
| cmd 1 (existing fetcher, 4 boards) | 22 / 239 / 265 kept; Plaid not found | 653 / 239 / 309 (the raw board): **mismatch found** → diagnosed |
| cmd 3 (full fetch) | 653 / 239 / 309; 0 not found | the raw board counts |
| cmd 4 (title filter) | include 7, flag 4, exclude 1 | false friend excluded; software titles flagged |
| cmd 5 (extraction) | 11 postings, 5 sentences, 7 silent; every label `null` | no auto-labels |
| cmd 6 (liveness, 3 real + 1 fake) | 3 active, 1 expired (HTTP 404) | the fake URL never active |
| cmd 6b (liveness, the 5 remaining in-scope URLs) | 5 active, 0 expired, 0 uncertain | anything not active is excluded (none was) |
| cmd 7 (80 Days, company columns only) | 3 rows matched; Shield AI empty | no personal columns read |
| Break: write outside `private/` (unit test) | exit 2, stderr "refusing to write outside private/", nothing created | conformance stop |
| Break: non-existent board, Visa false friend, title false friend, dead URL, pipeline silence | see §4 | see §4 |

### Did not test

- Greenhouse, Ashby, Workday or any non-Lever board.
- Liveness after 14:10 EDT on 2026-10-20 (a posting can close at any time).
- Whether the keyword list catches every phrasing (no held-out set of postings with known wording).
- Whether Shield AI is a cleared contractor under 32 CFR Part 117, or whether an LAA is realistic.
- Any employer's actual sponsorship practice (no recruiter contact, by design).
- Re-running on a second day (wording drift, posting turnover).
- The maintained scraper with its defects fixed (not patched here).

### Broke during testing, fixed

- **Exit code:** `sys.exit("…")` exited 1, not the documented 2. Caught by the unit test; fixed with
  `stop()` in `_common.py`.
- **A tautological test** (`assertEqual(rc, 2 if rc == 2 else rc)`): fixed before the first run.
- **Run 1 fetch:** HTML entities (`&nbsp;`) were not decoded, and each Lever list was flattened, so
  one 126-word "sentence" lost its Required/Preferred section. Fixed in `fetch_lever_full.py`
  (`html.unescape`, one line per bullet with its section) + the regression test `LeverListLines`;
  run 2 re-run.
- **Planning probe overcount:** an unanchored `ITAR` pattern matched inside "military" (8 false hits).
  The extractor uses whole-word matching; the plan's statement was corrected (FRICTIONAL Entry 3).
- **SOURCES quote:** the end of 32 CFR § 117.10(k)(1) was first written from memory ("not
  available"); corrected to the fetched text ("not readily available") (FRICTIONAL Entry 4).
- **Not fixed (maintainer-owned):** the schema-validator rejection and the dropped Lever fields
  (recipe items 3–4).
