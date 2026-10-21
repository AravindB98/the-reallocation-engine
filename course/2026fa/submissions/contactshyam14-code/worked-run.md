# Worked run — early-career PM & supply-chain SOC resolver

## Executive summary

This is the record of actually running the new mode on 2026-10-21: two real job postings and seven written test postings, with every command and its real terminal output pasted below. The mode asks which government occupation code each job would be filed under, prices each plausible code from public wage records, and refuses to answer when they disagree.

It refused the one real posting that passed the posting check (an Inventory Planner near Fort Worth). Its plausible codes are $23,110 apart nationally, one is a clerical code, and one has no published wage at all. It stopped the other real posting (Zipline) because the repository's checker could not confirm it was live, even though Zipline's job board lists it; a person has to decide that. Every test posting behaved as designed. Nothing is ranked, because the work-permit card dates have not been entered. Numbers were checked by hand against the raw government files and matched. Four deliberate attempts to break the mode failed to break it.

**Stage claimed: RUNNABLE-SAMPLE, pending the owner's sign-off.** One real URL (RS Group) genuinely passed the repository's liveness gate, so this is more than a samples-only run. It is still not RUNNABLE-LIVE: the constitution requires a human to clear every gate, no gate has been cleared by a person, and the visa-timeline gate cannot be cleared until the EAD card exists. A strict reading of the constitution would hold the recipe at DRAFT, because 10 proposal TODOs are open (SPECIFIED needs zero). They are disclosed and none blocks the run. `last_gate` and `attestation` are left `null` for the owner.

*Output note: pasted output is verbatim except that the Windows home prefix of temp paths is shortened to `%TEMP%` and the repository path to `<repo>`.*

## Inputs (anonymized; no private data read)

| Input | Value | Label |
|---|---|---|
| Situation | MS Engineering Management graduate, F-1 post-completion OPT 12 months, requested start 2026-12-31 (not approved), EAD dates **not entered**, STEM **unconfirmed** | your-input |
| Target | PM / supply-chain roles requiring ≤ 2 years; metros Seattle, Austin, San Francisco, San Jose, Dallas–Fort Worth | your-input |
| Real posting 1 | Zipline — Business Operations Manager, Supply Chain (Greenhouse `flyzipline` job 7818180003), South San Francisco → San Francisco-Oakland-Fremont, CA | record (text) / your-input (metro) |
| Real posting 2 | RS Group — Inventory Planner (SuccessFactors 1439895033), Fort Worth TX 76118 → Dallas-Fort Worth-Arlington, TX | record (text) / your-input (metro) |
| Samples | 4 target-shaped + 3 break tests, fictional employers (`inputs/postings/samples/`) | your-input |
| Persona | `inputs/persona.em-pm-supply-chain.json` | your-input |
| `private/`, `data/ats/` | not read | — |

All paths below are relative to the repository root. `C=scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver`.

## 1. Baseline before any change (saved before the branch had any edits)

`npm run verify` failed before anything was changed. The `python3` on this Windows machine is the Microsoft Store alias, so every `.py`/`.yml` check fails (last lines):

```
  • scripts\sec\sec-unique.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\validate-h1b-join-sample.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\webpage-processor-clean.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\webpage-processor-raw.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
verify exit 1
```

`npm run doctor` (first lines):

```

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v22.12.0
  ✗ python3    MISSING

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
```

Environment fix (no repository file changed): a gitignored `.venv` from Python 3.12 with `--system-site-packages` (PyYAML 6.0.3 already there), `pip install pandas==2.2.3` (approved), a copy of the venv launcher as `.venv/Scripts/python3.exe`, and `.venv/Scripts` first on PATH for `verify`/`doctor`. Chromium for Playwright 1.62.1 was installed with `npx --no-install playwright install chromium` (approved).

## 2. Downloads (the two approved files)

The BLS request's User-Agent header contained the owner's university email; it is removed below. See FRICTIONAL entry 3.

```
$ date -u +%FT%TZ && curl -sS -o data/bls/local-wage/raw/oesm24ma/oesm24ma.zip -w "http=%{http_code} size=%{size_download} type=%{content_type} url=%{url_effective}\n" -A "Mozilla/5.0 (contactshyam14-code coursework; [email removed])" https://www.bls.gov/oes/special-requests/oesm24ma.zip
2026-10-21T19:44:27Z
http=200 size=40189821 type=application/x-zip-compressed url=https://www.bls.gov/oes/special-requests/oesm24ma.zip
$ date -u +%FT%TZ && curl -sS -L -o data/bls/local-wage/raw/marpp/MARPP.zip -w "http=%{http_code} size=%{size_download} type=%{content_type} url=%{url_effective}\n" "https://apps.bea.gov/regional/zip/MARPP.zip"
2026-10-21T19:44:41Z
http=200 size=146479 type=application/x-zip-compressed url=https://apps.bea.gov/regional/zip/MARPP.zip
$ sha256sum data/bls/local-wage/raw/*/*.zip
5dbf2e6ac2af222cc9abc205586c9b480344d89392752eb689c3ec823a34c83e *data/bls/local-wage/raw/marpp/MARPP.zip
7bf915fc47e464983c5b8b8200d63a733ef90275c7af0576b78875e5b04d35d9 *data/bls/local-wage/raw/oesm24ma/oesm24ma.zip
```

Archive contents (listed with `python -I` and `zipfile`):

```
data/bls/local-wage/raw/oesm24ma/oesm24ma.zip
   oesm24ma/ 0
   oesm24ma/BOS_M2024_dl.xlsx 9984267
   oesm24ma/file_descriptions.xlsx 12044
   oesm24ma/MSA_M2024_dl.xlsx 30750423
data/bls/local-wage/raw/marpp/MARPP.zip
   MARPP__Footnotes.html 877
   MARPP_MSA_2008_2024.csv 455899
   MAIRPD__definition.xml 477
   MAIRPD__Footnotes.html 889
   MAIRPD_MSA_2008_2024.csv 97153
   MARPP__definition.xml 1622
```

BLS did not block the download, so there was nothing to work around. The real size is 40.2 MB, not the ~70 MB expected.

## 3. Trim to the local-wage script's data contract

```
$ .venv/Scripts/python.exe -I scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/tools/trim_local_wage.py --msa-zip data/bls/local-wage/raw/oesm24ma/oesm24ma.zip --rpp-zip data/bls/local-wage/raw/marpp/MARPP.zip --national-xlsx data/bls/oesm24nat/national_M2024_dl.xlsx --areas 42660,12420,41860,41940,19100,24020 --socs 13-1082,13-1081,11-3071,11-3061,13-1023,13-1020,15-1299,11-3021,11-1021,13-1111,43-5061,15-1252 --out-dir scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data
{
  "inputs": {
    "msa_zip": {
      "path": "data\\bls\\local-wage\\raw\\oesm24ma\\oesm24ma.zip",
      "member": "oesm24ma/MSA_M2024_dl.xlsx",
      "bytes": 40189821,
      "sha256": "7bf915fc47e464983c5b8b8200d63a733ef90275c7af0576b78875e5b04d35d9"
    },
    "rpp_zip": {
      "path": "data\\bls\\local-wage\\raw\\marpp\\MARPP.zip",
      "member": "MARPP_MSA_2008_2024.csv",
      "bytes": 146479,
      "sha256": "5dbf2e6ac2af222cc9abc205586c9b480344d89392752eb689c3ec823a34c83e"
    },
    "national_xlsx": {
      "path": "data\\bls\\oesm24nat\\national_M2024_dl.xlsx",
      "bytes": 291056,
      "sha256": "a9bad3093703e28d7490cedb765b6730f4eaa4b37a7c8f68e866814167761f11"
    }
  },
  "areas_requested": [
    "42660",
    "12420",
    "41860",
    "41940",
    "19100",
    "24020"
  ],
  "areas_found_in_oews": [
    "12420",
    "19100",
    "24020",
    "41860",
    "41940",
    "42660"
  ],
  "areas_in_crosswalk": [
    "42660",
    "12420",
    "41860",
    "41940",
    "19100",
    "24020"
  ],
  "socs_requested": [
    "13-1082",
    "13-1081",
    "11-3071",
    "11-3061",
    "13-1023",
    "13-1020",
    "15-1299",
    "11-3021",
    "11-1021",
    "13-1111",
    "43-5061",
    "15-1252"
  ],
  "rows": {
    "metro_oews": 62,
    "national_oews_candidates": 12,
    "bea_rpp": 6,
    "crosswalk": 6
  }
}
exit=0
```

Two real findings from this step:

- **13-1023 has no row in either OEWS file.** The national file has `13-1020 Buyers and Purchasing Agents` as both `broad` and `detailed` (OEWS aggregated it).
- **`#` is top-coded, not suppressed.** The field-description rows in `national_M2024_dl.xlsx` read: "`#  = indicates a wage equal to or greater than $115.00 per hour or $239,200 per year`". `*` is "a wage estimate is not available".

Provenance: `$C/data/PROVENANCE.md`.

## 4. Liveness gate — `npm run ats:liveness` (anchor command, raw)

```
2026-10-21T19:48:37Z
$ npm run ats:liveness -- "https://www.zipline.com/open-roles/7818180003?gh_jid=7818180003" "https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033"

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://www.zipline.com/open-roles/7818180003?gh_jid=7818180003 https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033

Checking 2 URL(s)...

⚠️ uncertain  https://www.zipline.com/open-roles/7818180003?gh_jid=7818180003
           content present but no visible apply control found
✅ active     https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033

Results: 1 active  0 expired  1 uncertain
exit=1
```

```
2026-10-21T19:49:08Z
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/flyzipline/jobs/7818180003"

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/flyzipline/jobs/7818180003

Checking 1 URL(s)...

⚠️ uncertain  https://job-boards.greenhouse.io/flyzipline/jobs/7818180003
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
exit=1
```

The SuccessFactors page was **supported**: liveness is Playwright-based, not provider-based, and RS returned `active`. Zipline was `uncertain` at both its own URL and Greenhouse's board URL, so it is **STOP for live status**.

## 5. Second record — `npm run ats:scan -- --dry-run` (anchor command, raw)

```
2026-10-21T20:04:17Z
$ npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
exit=1
```

```
2026-10-21T20:04:18Z
$ REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/portals.em-pm-supply-chain.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      347
Filtered by title:     333 removed
Filtered by location:  3 removed
Duplicates:            1 skipped
New offers added:      10

New offers:
  + Zipline | Business Operations Manager, Supply Chain | South San Francisco, California, USA
  + Zipline | IT Technical Program Manager | South San Francisco, California, USA
  + Zipline | Logistics Specialist | South San Francisco, California, USA
  + Zipline | Logistics Specialist (SkillBridge) | Dallas-Fort Worth, Texas, USA; Phoenix, Arizona, USA; South San Francisco, California, USA
  + Zipline | Mobile Test Site Project Manager | Esparto, California, USA; Half Moon Bay, California, USA; South San Francisco, California, USA
  + Zipline | Production Planner | South San Francisco, California, USA
  + Zipline | Program Manager - Growth & Profitability | South San Francisco, California, USA
  + Zipline | Senior/Staff Technical Program Manager, Manufacturing Strategy & Operations | South San Francisco, California, USA
  + Zipline | Technical Program Manager, Flight Systems Platform | South San Francisco, California, USA
  + Zipline | Technical Program Manager - Trust and Safety  | South San Francisco, California, USA

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
exit=0
```

The Greenhouse API lists "Business Operations Manager, Supply Chain" today. That **conflicts** with the liveness gate's `uncertain`. The gate is not upgraded; a human decides (recipe proposal TODO 6).

## 6. Fetch and convert the two real postings

```
$ curl -sS -o $C/inputs/raw/zipline/greenhouse-7818180003.json -w "http=%{http_code} size=%{size_download}\n" "https://boards-api.greenhouse.io/v1/boards/flyzipline/jobs/7818180003?pay_transparency=true"
http=200 size=13598
$ curl -sS -L -o $C/inputs/raw/rs/rs-1439895033.html -w "http=%{http_code} size=%{size_download} final=%{url_effective}\n" "https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033"
http=200 size=153458 final=https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033
$ node $C/tools/posting-from-raw.mjs --meta $C/inputs/postings/real/zipline-7818180003.meta.json --raw $C/inputs/raw/zipline/greenhouse-7818180003.json --out $C/inputs/raw/zipline/posting.json
real-zipline-7818180003: "Business Operations Manager, Supply Chain" — Zipline · South San Francisco, California, USA · 9424 chars · raw sha256 c6d70cda66d5… → scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/zipline/posting.json
$ node $C/tools/posting-from-raw.mjs --meta $C/inputs/postings/real/rs-1439895033.meta.json --raw $C/inputs/raw/rs/rs-1439895033.html --out $C/inputs/raw/rs/posting.json
real-rs-1439895033: "Inventory Planner" — RS Group · Fort Worth, TX, 76118 · 6750 chars · raw sha256 a26e70533a13… → scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/rs/posting.json
```

Re-checked against the fetched records:

- **Zipline:** `first_published` 2026-07-27T18:45:47-04:00 and `updated_at` 2026-10-15T12:28:21-04:00. "You have 1-10+ years of experience…" appears under "What You'll Bring". The degree appears only under "Major Bonuses". The text states "The starting cash range for this role is $147,800 - $285,200", and `pay_input_ranges` is empty.
- **RS:** `datePosted` "Wed Oct 21 02:00:00 UTC 2026" and `validThrough` "Sat Oct 24 00:00:00 UTC 2026". "1-3 years in an inventory management or supply chain related role." appears under **Essential**. A second "1-3 years of experience in a supply chain related position" appears under **Desirable**. "Bachelor's degree in Business or a related field; or equivalent combination of education and experience." is under **Desirable**.

## 7. The mode

```
2026-10-21T20:18:45Z
$ node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-greenhouse-board-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/zipline/posting.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/rs/posting.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-2-scpm1-austin.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-3-scpgm-npi-sanjose.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-4-pm-ops-sf.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-1-sc-manager-5yrs.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-2-marketing-coordinator.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-3-sc-coordinator-degree-plus.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21
soc-resolver 0.1.0 · as of 2026-10-21 · 9 postings → RESOLVED 0 · AMBIGUOUS-REFUSE 1 · STOP 8
  STOP             Business Operations Manager, Supply Chain — Zipline [real] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  AMBIGUOUS-REFUSE Inventory Planner — RS Group [real] (at spread)
  STOP             Associate Project Manager - Supply Chain — Northwind Fulfillment (fictional sample) [sample] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  STOP             Supply Chain Project Manager I — Lakeview Components (fictional sample) [sample] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  STOP             Supply Chain Program Manager, Hardware NPI — Copperline Devices (fictional sample) [sample] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  STOP             Project Manager - Operations — Harborview Logistics (fictional sample) [sample] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  STOP             Supply Chain Manager — Ridgeback Industrial (fictional break test) [break-test] (at experience)
  STOP             Marketing Coordinator — Bluebird Brands (fictional break test) [break-test] (at scope)
  STOP             Supply Chain Coordinator — Tidewater Supply (fictional break test) [break-test] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  visa timeline: EAD STOP · STEM HOLD → ranked 0
  scorer: ✓ scored 24 roles → Apply 0 · Consider 0 · Skip 24 (skip 100%)
  wrote course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21/soc-resolver.json + soc-resolver.md + roles.json + role-scores.json/.md
exit=0
```

Human report, overview table and the main real result (verbatim from `course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21/soc-resolver.md`):

| Posting | Kind | Liveness | Scope | Experience (min required) | Degree | Candidate SOCs | Verdict |
|---|---|---|---|---|---|---|---|
| Business Operations Manager, Supply Chain — Zipline | real | uncertain | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only) | 15-1299, 11-3021, 11-3071, 13-1111, 11-1021, 13-1082 | **STOP** at liveness |
| Inventory Planner — RS Group | real | active | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only+equivalent-experience-accepted) | 13-1081, 43-5061, 13-1023 | **AMBIGUOUS-REFUSE** at spread |
| Associate Project Manager - Supply Chain — Northwind Fulfillment (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (2) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071 | **STOP** at liveness |
| Supply Chain Project Manager I — Lakeview Components (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071 | **STOP** at liveness |
| Supply Chain Program Manager, Hardware NPI — Copperline Devices (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (0) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071, 15-1299, 11-3021 | **STOP** at liveness |
| Project Manager - Operations — Harborview Logistics (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (2) | DEGREE-REQUIRED | 13-1082, 11-1021 | **STOP** at liveness |
| Supply Chain Manager — Ridgeback Industrial (fictional break test) | break-test | missing | IN-SCOPE | EXPERIENCE-OVER-TARGET (5) | — | — | **STOP** at experience |
| Marketing Coordinator — Bluebird Brands (fictional break test) | break-test | missing | OUT-OF-SCOPE | — | — | — | **STOP** at scope |
| Supply Chain Coordinator — Tidewater Supply (fictional break test) | break-test | missing | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only) | 43-5061, 13-1081 | **STOP** at liveness |

#### Inventory Planner — RS Group (real)

**Verdict: AMBIGUOUS-REFUSE.** national median spread $23,110 (40.0%) exceeds $10,000 or 10%; metro median spread $21,467 (40.3%) exceeds $10,000 or 10%; missing data (13-1023 (no detailed OEWS row); 13-1023 (no-occupation-row)) can only widen the disagreement, never resolve it. Ask the recruiter or employer which SOC code this role would be filed under (for an H-1B/LCA) before using any wage floor or score for it.

> No single score is given for this posting. Ask the recruiter or employer which SOC code the role would be filed under.

- Place → metro: Fort Worth, TX, 76118 → Dallas-Fort Worth-Arlington, TX [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Fort Worth, TX, 76118" → "Dallas-Fort Worth-Arlington, TX" is your-input (no OMB delineation file in the repo)
- Liveness [record]: active (from `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt`)
- Scope [model-judgment rule]: IN-SCOPE — title matches "inventory", "planner"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 1 year(s) ≤ 2 (matched "1-3 years" in "1-3 years in an inventory management or supply chain related role."); preferred noted: "1-3 years"
  - quoted: "1-3 years in an inventory management or supply chain related role."
- Degree [model-judgment]: **DEGREE-NOT-REQUIRED** — quoted: "Bachelor's degree in Business or a related field; or equivalent combination of education and experience."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "RS Americas", "RS Group", "Allied Electronics", "RS Components" (exact normalized-name match only)
  - rejected substring matches (different companies): CRS GROUP INC (via "RS Group"), GAME CHANGERS GROUP (via "RS Group"), VILLAGE PARTNERS GROUP LLC (via "RS Group")
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $61,530 / $77,110 | $59,686 / $74,799 / $95,101 (RPP 103.09) | 0 → 0, Skip | PLANNER (planner) | none in the truncated sample |
| 43-5061 | Production, Planning, and Expediting Clerks (43-5061.00) | 2 | $38,570 / $46,600 / **$57,770** / $71,480 | $44,010 / $54,980 | $42,691 / $53,332 / $69,017 (RPP 103.09) | 0 → 0, Skip | PLANNER (planner) | none in the truncated sample |
| 13-1023 | Purchasing Agents, Except Wholesale, Retail, and Farm Products (13-1023.00) | 4 | missing: no detailed OEWS row (OEWS publishes 13-1020 Buyers and Purchasing Agents $75,650 — not substituted) | missing: no metro row | missing: no-occupation-row | 0 → 0, Skip | PO-BUYING (planner, text:purchase order, text:purchase orders, text:buying decisions, text:procurement) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $57,770–$80,880 (spread $23,110, 40.0%); metro adjusted medians $53,332–$74,799 (spread $21,467, 40.3%); scorer vote-sum 0–0
  - national median spread $23,110 (40.0%) exceeds $10,000 or 10%
  - metro median spread $21,467 (40.3%) exceeds $10,000 or 10%
  - missing data (13-1023 (no detailed OEWS row); 13-1023 (no-occupation-row)) can only widen the disagreement, never resolve it

**Flags**
- CLERICAL-OR-JZ2-CANDIDATE (43-5061) [model-judgment]: 43-5061 Production, Planning, and Expediting Clerks (job zone 2) — if the role is filed under this code the wage floor drops and the specialty-occupation case is much harder (rule inference, not a legal conclusion)
- DEGREE-NOT-REQUIRED [model-judgment]: DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only+equivalent-experience-accepted): specialty-occupation risk — rule inference from the posting text, never a legal conclusion
- NAME-COLLISION-REJECTED [record]: a substring match would have attached CRS GROUP INC, GAME CHANGERS GROUP, VILLAGE PARTNERS GROUP LLC — different companies; not attached

The Zipline section, the sample sections and the break-test sections are in the same file. Zipline's spread analysis (for information only, since the gate is STOP) covers 15-1299, 11-3021, 11-3071, 13-1111, 11-1021 and 13-1082. National medians run $100,750–$171,200 (a $70,450 spread), so it would be AMBIGUOUS-REFUSE. This matches the expectation, except that the rules also add 11-1021 General and Operations Managers (title contains "Operations Manager").

## 8. Verification

**Re-run and parse the JSON:**

```
2026-10-21T20:18:50Z
$ node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-greenhouse-board-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/zipline/posting.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/rs/posting.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-2-scpm1-austin.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-3-scpgm-npi-sanjose.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-4-pm-ops-sf.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-1-sc-manager-5yrs.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-2-marketing-coordinator.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-3-sc-coordinator-degree-plus.json --out-dir $TEMP/socres-rerun
soc-resolver 0.1.0 · as of 2026-10-21 · 9 postings → RESOLVED 0 · AMBIGUOUS-REFUSE 1 · STOP 8
$ node -e "<parse both soc-resolver.json files; compare postings + summary + visa with output paths masked>"
parsed both JSON files: postings 9 9 · identical postings/summary/visa: true
verdicts: real-zipline-7818180003=STOP, real-rs-1439895033=AMBIGUOUS-REFUSE, sample-1-assoc-pm-sc-seattle=STOP, sample-2-scpm1-austin=STOP, sample-3-scpgm-npi-sanjose=STOP, sample-4-pm-ops-sf=STOP, break-1-sc-manager-5yrs=STOP, break-2-marketing-coordinator=STOP, break-3-sc-coordinator-degree-plus=STOP
```

**One national wage, one metro wage, the RPP, and the 80 Days records, read from the raw files.** This uses an independent reader (regex over the xlsx XML), not the trim tool:

```
$ .venv/Scripts/python.exe -I <scratch>/xcheck.py   # independent raw-file reader, regex XML, not the trim tool
NATIONAL raw: {'AREA': '99', 'AREA_TITLE': 'U.S.', 'OCC_CODE': '13-1081', 'O_GROUP': 'detailed', 'A_PCT10': '49260', 'A_PCT25': '62920', 'A_MEDIAN': '80880', 'A_PCT75': '104330'}
NATIONAL raw 13-1023 rows printed above (none means no row)
METRO raw: {'AREA': '19100', 'AREA_TITLE': 'Dallas-Fort Worth-Arlington, TX', 'OCC_CODE': '13-1081', 'O_GROUP': 'detailed', 'A_PCT10': '51050', 'A_PCT25': '61530', 'A_MEDIAN': '77110', 'A_PCT75': '98040'}
METRO raw: {'AREA': '19100', 'AREA_TITLE': 'Dallas-Fort Worth-Arlington, TX', 'OCC_CODE': '43-5061', 'O_GROUP': 'detailed', 'A_PCT10': '32930', 'A_PCT25': '44010', 'A_MEDIAN': '54980', 'A_PCT75': '71150'}
BEA raw: Dallas-Fort Worth-Arlington, TX (Metropolitan Statistical Area) LineCode 1 2024 = 103.090
hand: 77110 / (103.090/100) = 74798.72
80DAYS raw substring "zipline": [('ZIPLINE AI LTD', '(blank)'), ('ZIPLINE MEDICAL INC', '(blank)')]
80DAYS raw substring "rs group": [('CRS GROUP INC', '(blank)'), ('GAME CHANGERS GROUP', '(blank)'), ('VILLAGE PARTNERS GROUP LLC', '(blank)')]
80DAYS raw positive control: 1LIFE HEALTHCARE INC | Total Approvals 2.0 | Total Denials 0.0
80DAYS raw rows with a non-blank Total Approvals: 1557 of 30369
```

**The mode's own matcher on the real 80 Days file: a positive control, plus the metro band it reported:**

```
$ node --input-type=module -e "<import matchEmployer from soc-resolver.mjs; run it on the real 80 Days CSV for \"1Life Healthcare, Inc.\" and \"Zipline\">"
1Life Healthcare, Inc. -> [["1LIFE HEALTHCARE INC","2.0","0.0"]]
Zipline -> exact 0 · rejected ["ZIPLINE AI LTD","ZIPLINE MEDICAL INC"]
$ node -e "<print the RS 13-1081 and 43-5061 metro band from soc-resolver.json>"
13-1081 national median 80880 | metro raw median 77110 | script adjusted median 74798.72 rpp 103.09 ok 
43-5061 national median 57770 | metro raw median 54980 | script adjusted median 53332.04 rpp 103.09 ok 
13-1023 national median null | metro raw median no-oews-row | script adjusted median null rpp null missing no-occupation-row
local-wage stderr: coverage = 2/3 (ok=2 attempted=3 missing_reason={'no-occupation-row': 1})
```

| Cross-check | Raw file | Mode output | Match |
|---|---|---|---|
| National 13-1081 median | 80880 | 80880 | yes |
| DFW 13-1081 median (nominal) | 77110 | 77110 | yes |
| DFW RPP 2024 | 103.090 | 103.09 | yes |
| DFW 13-1081 adjusted median | 77110 / 1.0309 = 74798.72 (by hand) | 74798.72 | yes |
| 13-1023 national row | none printed | `row_found: false` | yes |
| "zipline" / "rs group" substring rows in 80 Days | 2 / 3 rows, all `Total Approvals` blank | MISSING; the same 2 / 3 rejected | yes |
| H-1B count, positive control | 1LIFE HEALTHCARE INC: approvals 2.0, denials 0.0 | `["1LIFE HEALTHCARE INC","2.0","0.0"]` | yes |

## 9. The existing local-wage script and scorer, run raw

`npm run bls:local-wage` on Windows: the script's `.venv` hop fails. This is recorded verbatim; the script was not patched.

```
$ npm run bls:local-wage -- --metro "Dallas-Fort Worth-Arlington, TX" --soc 13-1081 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
Traceback (most recent call last):
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 33, in <module>
    _ensure_venv()
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 30, in _ensure_venv
    os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
FileNotFoundError: [Errno 2] No such file or directory
exit=1
$ npm run bls:local-wage -- --metro "Glens Falls, NY" --soc 15-1252 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
Traceback (most recent call last):
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 33, in <module>
    _ensure_venv()
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 30, in _ensure_venv
    os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
FileNotFoundError: [Errno 2] No such file or directory
exit=1
$ npm run bls:local-wage -- --metro "San Jose-Sunnyvale-Santa Clara, CA" --soc 11-3021 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
Traceback (most recent call last):
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 33, in <module>
    _ensure_venv()
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 30, in _ensure_venv
    os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
FileNotFoundError: [Errno 2] No such file or directory
exit=1
$ npm run bls:local-wage -- --metro "Dallas-Fort Worth-Arlington, TX" --soc 13-1023 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
Traceback (most recent call last):
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 33, in <module>
    _ensure_venv()
  File "<repo>\scripts\bls\local-wage-adjustment.py", line 30, in _ensure_venv
    os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
FileNotFoundError: [Errno 2] No such file or directory
exit=1
```

The same unmodified script run directly with the venv interpreter (how the mode calls it). This includes the recipe's own Glens Falls suppression check, the San Jose `#` case, and the 13-1023 absent row:

```
$ .venv/Scripts/python.exe scripts/bls/local-wage-adjustment.py --metro "Dallas-Fort Worth-Arlington, TX" --soc 13-1081 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
coverage = 1/1 (ok=1 attempted=1 missing_reason={})
{
  "coverage": {
    "ok": 1,
    "attempted": 1,
    "coverage": "1/1",
    "missing_reason": {}
  }
}
metro_area,soc_code,status,missing_reason,nominal_wage_mean,nominal_wage_median,bea_rpp_value,adjusted_wage_band_low,adjusted_wage_band_high,adjusted_wage_median,plausibility_flag,national_median_wage,source_bls_file,source_bea_file,run_date
"Dallas-Fort Worth-Arlington, TX",13-1081,ok,,80860.00,77110.00,103.0900,59685.71,95101.37,74798.72,ok,80880.00,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\metro_oews.csv,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\bea_rpp.csv,2026-10-21
exit=0
$ .venv/Scripts/python.exe scripts/bls/local-wage-adjustment.py --metro "Glens Falls, NY" --soc 15-1252 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
coverage = 0/1 (ok=0 attempted=1 missing_reason={'suppressed-small-sample': 1})
{
  "coverage": {
    "ok": 0,
    "attempted": 1,
    "coverage": "0/1",
    "missing_reason": {
      "suppressed-small-sample": 1
    }
  }
}
metro_area,soc_code,status,missing_reason,nominal_wage_mean,nominal_wage_median,bea_rpp_value,adjusted_wage_band_low,adjusted_wage_band_high,adjusted_wage_median,plausibility_flag,national_median_wage,source_bls_file,source_bea_file,run_date
"Glens Falls, NY",15-1252,missing,suppressed-small-sample,,,,,,,,,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\metro_oews.csv,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\bea_rpp.csv,2026-10-21
exit=0
$ .venv/Scripts/python.exe scripts/bls/local-wage-adjustment.py --metro "San Jose-Sunnyvale-Santa Clara, CA" --soc 11-3021 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
coverage = 0/1 (ok=0 attempted=1 missing_reason={'suppressed-small-sample': 1})
{
  "coverage": {
    "ok": 0,
    "attempted": 1,
    "coverage": "0/1",
    "missing_reason": {
      "suppressed-small-sample": 1
    }
  }
}
metro_area,soc_code,status,missing_reason,nominal_wage_mean,nominal_wage_median,bea_rpp_value,adjusted_wage_band_low,adjusted_wage_band_high,adjusted_wage_median,plausibility_flag,national_median_wage,source_bls_file,source_bea_file,run_date
"San Jose-Sunnyvale-Santa Clara, CA",11-3021,missing,suppressed-small-sample,,,,,,,,,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\metro_oews.csv,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\bea_rpp.csv,2026-10-21
exit=0
$ .venv/Scripts/python.exe scripts/bls/local-wage-adjustment.py --metro "Dallas-Fort Worth-Arlington, TX" --soc 13-1023 --oews scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv --rpp scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bea_rpp.csv --crosswalk scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/bls_bea_msa_crosswalk.csv --json
coverage = 0/1 (ok=0 attempted=1 missing_reason={'no-occupation-row': 1})
{
  "coverage": {
    "ok": 0,
    "attempted": 1,
    "coverage": "0/1",
    "missing_reason": {
      "no-occupation-row": 1
    }
  }
}
metro_area,soc_code,status,missing_reason,nominal_wage_mean,nominal_wage_median,bea_rpp_value,adjusted_wage_band_low,adjusted_wage_band_high,adjusted_wage_median,plausibility_flag,national_median_wage,source_bls_file,source_bea_file,run_date
"Dallas-Fort Worth-Arlington, TX",13-1023,missing,no-occupation-row,,,,,,,,,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\metro_oews.csv,scripts\contrib\2026fa\contactshyam14-code-em-pm-supply-chain-soc-resolver\data\bea_rpp.csv,2026-10-21
exit=0
```

`npm run score` (anchor command, raw), both bare and on the repository's Ch.11 example, writing to temp:

```
$ npm run score

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs

Usage: role-scorer.mjs <roles.json> [--profile p.json] [--out-dir dir] [--md report.md]
exit=2

$ npm run score -- data/examples/ch11-roles.json --out-dir $TEMP/score-anchor

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir %TEMP%/score-anchor

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  %TEMP%\score-anchor\role-scores.json  +  %TEMP%\score-anchor\role-scores.md
exit=0
```

## 10. Tests

```
$ node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
ok 1 - experience: "2 years" → FIT
ok 2 - experience: "1-2 years" → FIT with min 1
ok 3 - experience: "0–2 years" (en dash) → FIT with min 0
ok 4 - experience: "2+ years required, 3+ preferred" → FIT on the required minimum, preferred noted
ok 5 - experience: "3+ years" → OVER-TARGET
ok 6 - experience: "5+ years required" → OVER-TARGET
ok 7 - experience: "at least 3 years" and "minimum of 4 years" → OVER-TARGET
ok 8 - experience: no years stated → UNSTATED, never assumed entry-level
ok 9 - experience: preferred-only years are NOT treated as required
ok 10 - experience: years under a Desirable heading count as preferred, Essential as required
ok 11 - experience: company-history years without experience context are ignored
ok 12 - experience: the max is an input, not hard-coded
ok 13 - scope: Marketing Coordinator → OUT-OF-SCOPE
ok 14 - scope: a title matching nothing → OUT-OF-SCOPE
ok 15 - scope: supply-chain and PM titles → IN-SCOPE
ok 16 - candidates: Supply Chain Project Manager → 13-1082, 13-1081, 11-3071
ok 17 - candidates: a Planner title includes the clerical 43-5061 code
ok 18 - spread: just UNDER the threshold ($9,999, 9.999%) → RESOLVED
ok 19 - spread: just OVER the USD threshold ($10,001) → AMBIGUOUS-REFUSE with the ask
ok 20 - spread: under $10,000 but over 10% → AMBIGUOUS-REFUSE
ok 21 - spread: score spread just over 0.05 → AMBIGUOUS-REFUSE; just under → RESOLVED
ok 22 - spread: missing wage with agreeing others → STOP (cannot confirm), never filled
ok 23 - spread: missing wage when the others already disagree → AMBIGUOUS-REFUSE, missing listed
ok 24 - spread: suppressed METRO median blocks RESOLVED even when nationals agree
ok 25 - spread: unknown SOC → STOP
ok 26 - spread: no candidates → STOP
ok 27 - wage cells: * and \# are missing with distinct reasons, never 0
ok 28 - degree: "bachelor's a plus" → DEGREE-NOT-REQUIRED with the specialty-occupation flag
ok 29 - degree: high school diploma → DEGREE-NOT-REQUIRED (high-school-diploma)
ok 30 - degree: no degree named → DEGREE-NOT-REQUIRED (no-degree-named)
ok 31 - degree: "Desirable: Bachelor's … or equivalent combination" → both reasons
ok 32 - degree: required in a named field → DEGREE-REQUIRED with field
ok 33 - degree: only under a "Major Bonuses" heading → not required
ok 34 - liveness log: parses active / expired / uncertain with reasons
ok 35 - employer: substring collisions are reported and NOT attached; exact name matches
ok 36 - e2e: dead and unknown liveness → STOP at liveness (not a lower score)
ok 37 - e2e: one candidate, live, data present → RESOLVED; scorer ran unmodified; JSON parses; every label valid
ok 38 - e2e: Inventory-Planner-shaped posting → AMBIGUOUS-REFUSE, 13-1023 missing, clerical flag
ok 39 - e2e: in-scope title that matches no SOC rule → STOP (no candidate)
ok 40 - e2e: unknown SOC from the rule table → STOP
ok 41 - e2e: EAD dates entered by a named human clear the timeline gate; otherwise STOP
ok 42 - refuses to write into tracked data/ paths (exit 2, nothing written)
ok 43 - local-wage script (unmodified) returns suppressed-small-sample for a "*" metro median
# tests 43
# suites 0
# pass 43
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

## 11. Deliberate break attempts

```
# break 1: loosen every spread threshold to 1e9 and re-run the RS Inventory Planner
$ node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --rules $TEMP/rules-loose.json --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/rs/posting.json --out-dir $TEMP/break-loose
soc-resolver 0.1.0 · as of 2026-10-21 · 1 postings → RESOLVED 0 · AMBIGUOUS-REFUSE 0 · STOP 1
  STOP             Inventory Planner — RS Group [real] (at data)
  visa timeline: EAD STOP · STEM HOLD → ranked 0
  scorer: ✓ scored 3 roles → Apply 0 · Consider 0 · Skip 3 (skip 100%)
  wrote %TEMP%/break-loose/soc-resolver.json + soc-resolver.md + roles.json + role-scores.json/.md
exit=0
verdict_why: cannot confirm the candidates agree: missing 13-1023 (no detailed OEWS row); 13-1023 (no-occupation-row) — never interpolated, never replaced by a national or broader value

# break 2: ask it to write into the tracked data/ tree
$ node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --out-dir data/examples/soc-resolver
STOP [usage] refusing to write to <repo>\data\examples\soc-resolver: outputs go under course/2026fa/submissions/contactshyam14-code/, this script's folder (not its data/), or the OS temp dir — never tracked data/ paths
exit=2
$ test -e data/examples/soc-resolver; echo $?
1

# break 3: the RS posting with only the loose alias "rs group" and a typo in its URL (liveness should be unknown)
$ node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --posting $TEMP/rs-typo.json --out-dir $TEMP/break-typo
soc-resolver 0.1.0 · as of 2026-10-21 · 1 postings → RESOLVED 0 · AMBIGUOUS-REFUSE 0 · STOP 1
  STOP             Inventory Planner — RS Group [real] (at liveness) · spread analysis: AMBIGUOUS-REFUSE
  visa timeline: EAD STOP · STEM HOLD → ranked 0
liveness: unknown - no saved `npm run ats:liveness` result for this exact URL | employer: MISSING | rejected: CRS GROUP INC, GAME CHANGERS GROUP, VILLAGE PARTNERS GROUP LLC
```

```
# break 4 (mutation): make classify() ignore preferred wording, so preferred years count as required
$ sed -i "s/if (pref.length) return { ...h, kind: 'preferred'/if (false) return { ...h, kind: 'preferred'/" scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs
$ git diff --stat
 .../contactshyam14-code/runs/01-2026-10-21/soc-resolver.json            | 2 +-
 .../soc-resolver.mjs                                                    | 2 +-
 2 files changed, 2 insertions(+), 2 deletions(-)
$ node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
not ok 4 - experience: "2+ years required, 3+ preferred" → FIT on the required minimum, preferred noted
not ok 9 - experience: preferred-only years are NOT treated as required
# tests 43
# pass 41
# fail 2
$ git checkout -- scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs && node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
# tests 43
# pass 43
# fail 0
```

## 12. Conformance and privacy (after all changes)

```
$ npm run verify    # same shell as the baseline (python3 = Windows Store alias)
  • scripts\sec\sec-unique.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\validate-h1b-join-sample.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\webpage-processor-clean.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
  • scripts\sec\webpage-processor-raw.py — Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
exit=1
```

```
$ PATH="$PWD/.venv/Scripts:$PATH" npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 180 files (89 md · 36 py · 32 js · 18 json · 1 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit=0
```

```
$ PATH="$PWD/.venv/Scripts:$PATH" npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v22.12.0
  ✓ python3    Python 3.12.5

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
exit=0
```

```
$ npm run pii-scan

  [email] package-lock.json — [matched email-shaped string redacted here so this file does not itself trip the scanner]
  [phone] scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/raw/rs/rs-1439895033.html — [matched phone-shaped string redacted here, same reason]

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit=1   (scanner exit code)
```

```
$ node scripts/pii-scan.mjs --diff origin/main
pii-scan: clean ✓
exit=0
```

The working-tree PII scan has two findings, and neither is in a tracked file of this branch:

- `package-lock.json` is upstream and unchanged.
- The RS `.html` is the git-excluded raw page (a number pattern in the page).

The CI-style `--diff origin/main` scan is clean.

## Verified vs inferred

| Line in the output | Verified by data or script (record) | Inferred / judged |
|---|---|---|
| RS liveness `active`, Zipline `uncertain` | `npm run ats:liveness` stdout | — |
| Zipline listed on its Greenhouse board | `ats:scan --dry-run` stdout | that "uncertain" means a page the checker can't read, not a dead job — **not concluded**, left to a human |
| "1-3 years … Essential" → minimum required 1 → EXPERIENCE-FIT | the quoted sentence and its heading are in the fetched page | the heading → required/preferred rule (model-judgment) |
| Zipline "1-10+ years" → EXPERIENCE-FIT | quoted sentence under "What You'll Bring" | reading "What You'll Bring" as requirements (model-judgment); the job board's "Senior Level" label (your-input, unverified) conflicts with it |
| DEGREE-NOT-REQUIRED (RS: Desirable + "or equivalent"; Zipline: "Major Bonuses" only) | quoted sentences | the specialty-occupation risk flag (rule inference, **not** a legal conclusion) |
| Candidate SOCs 13-1081 / 43-5061 / 13-1023 for "Inventory Planner" | — | entirely the keyword table (model-judgment); O*NET's truncated alt-title sample has no "Inventory Planner" (absence is not evidence) |
| National medians $80,880 / $57,770 / missing | national OEWS 2024 rows (checked by hand) | — |
| DFW adjusted medians $74,799 / $53,332 / missing | local-wage script output on BLS + BEA rows (checked by hand) | the place → MSA mapping Fort Worth 76118 → DFW (your-input) |
| Job zone 2 for 43-5061 → CLERICAL-OR-JZ2 flag | compact O*NET `job_zone` | that the flag "undercuts the specialty-occupation case" (model-judgment) |
| AMBIGUOUS-REFUSE for RS | arithmetic on records: $23,110 / 40.0% > $10,000 / 10% | the thresholds themselves (your-input, proposal TODO 10) |
| Employer H-1B MISSING for both; look-alikes rejected | exact-name lookup and substring list on the 80 Days file (checked by hand) | — |
| Per-SOC H-1B history missing | 80 Days header has no SOC column | — |
| Scorer composite 0 / Skip for every candidate | `role-scorer.mjs` output | the inputs given to it: role_quality p = cps/7 (model-judgment); timeline factor 0 because EAD is not entered (your-input) |
| Visa gate STOP, STEM HOLD | persona file fields are null | — (no visa conclusion drawn) |
| Pay $147,800–$285,200 (Zipline) | posting text | that the job board's "$148K–$285K" is the same range rounded |

## Attestation

- Recipe: case-em-pm-supply-chain-soc-resolver v0.1.0
- By: Claude (AI agent, Claude Code) at the owner's direction · 2026-10-21. **This is the agent's test record, prepared for the owner to re-run and sign. It is not a human attestation.**

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node --test $C/soc-resolver.test.mjs` | 43 pass, 0 fail | all pass |
| resolver on 2 real + 7 fictional postings | RESOLVED 0 · AMBIGUOUS-REFUSE 1 · STOP 8; RS AMBIGUOUS-REFUSE; Zipline STOP at liveness | RS AMBIGUOUS-REFUSE; Zipline expected AMBIGUOUS-REFUSE, but the real liveness result is `uncertain`, so STOP (analysis-only spread: AMBIGUOUS-REFUSE) |
| re-run into `%TEMP%`, compare JSON | identical postings/summary/visa: true | identical |
| independent raw-file reader vs report | 80880 / 77110 / 103.090 / 74798.72 / no 13-1023 row | equal |
| exact-name matcher on real 80 Days, positive control | 1LIFE HEALTHCARE INC 2.0 / 0.0 | as in raw CSV |
| break 1: thresholds loosened to 1e9 | RS → STOP (data): "cannot confirm the candidates agree: missing 13-1023 …" | never RESOLVED while a candidate wage is missing |
| break 2: `--out-dir data/examples/soc-resolver` | `STOP [usage] refusing to write …`, exit 2, `test -e` → 1 | exit 2, nothing written |
| break 3: typo URL + loose alias "rs group" | liveness `unknown`, STOP; employer MISSING; 3 look-alikes rejected | STOP; nothing attached |
| break 4: mutation — preferred wording ignored | 2 of 43 tests fail (the "3+ preferred" and preferred-only cases); restored → 43/43 | the suite catches it |
| `npm run bls:local-wage` on Windows | `FileNotFoundError` in the `.venv` hop | runs (it doesn't on Windows; recorded) |
| local-wage script direct, Glens Falls 15-1252 | `suppressed-small-sample` | the recipe's own fixture result |
| local-wage script direct, San Jose 11-3021 | `suppressed-small-sample` for a `#` median | ideally a top-coded reason (defect recorded, not patched) |
| `npm run verify` / `npm run doctor` with the shim | exit 0 / exit 0, "environment: ✓ runnable" | pass |
| `node scripts/pii-scan.mjs --diff origin/main` | clean | clean |

### Did not test

- **A human clearing any gate.** No person has cleared liveness (including Zipline's `uncertain`), the experience HOLD case, or the visa gate. This is why the stage is not RUNNABLE-LIVE.
- **The visa-timeline path with real EAD dates.** Exercised only with fictional dates in a test; the real card does not exist yet.
- **Whether any candidate SOC is the one an employer would file.** Not checkable without LCA data (proposal TODO 1).
- **Per-SOC H-1B history.** There is no SOC field in 80 Days.
- **Place → MSA mapping.** There is no OMB delineation file; it is your-input.
- **BLS typical-experience expectations per SOC.** Not in the repository.
- **Liveness after today.** The RS posting's validThrough is 2026-10-24, and no later check was run.
- **Postings outside the 9 used here.** The keyword rules were tuned on these titles and may miss or over-match others, such as "Material Planner II", "Buyer/Planner" or "Program Coordinator".
- **Linux/macOS.** The `.venv/bin/python` path (and the CI ubuntu runner) has not been tried for the metro step. Tests skip that step when `.venv` is absent.
- **The zip on another machine.** The zip was re-tested only in a temp folder on this machine (see the final section).
- **Inputs to the scorer's composite.** It was run with no sponsorship or fit vote; whether a role_quality weight above 0 would separate SOCs was not tested.

### Broke during testing, fixed

- **`EISDIR` crash on the first run.** The resolver hashed the output directory as if it were an input. Fixed: `outDir` is excluded from the input list.
- **Degree field parsing.** The field kept a trailing "required" and missed "degree required in X". The regex was fixed and a test added.
- **Experience quote truncated at a comma.** The full sentence is now quoted.
- **"Desirable … or equivalent" showed one reason.** Reasons are now combined, with a test.
- **O*NET alt-title support over-counted.** It counted colleague titles in the text; it is now title-only.
- **False console claim.** The console said role-scores were written when the scorer hadn't run. Fixed, and the recorded run re-done with the final script.
- **Scorer missing outside the repo (anticipated, not observed).** The zip leaves out the repository's scorer, so the end-to-end tests would have crashed in the unzipped folder. This was caught by reading the code before building the zip, not by a failure. The resolver now records "scorer not present", and the test asserts whichever case applies. All recorded outputs above were re-run with this final script.
- **Not fixed: `local-wage-adjustment.py` `#` reason code and Windows `npm run` hop.** These are a maintainer's to fix (proposal TODO 7).

## Sign the gate (owner)

```bash
node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
npm run ats:liveness -- "https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033" "https://www.zipline.com/open-roles/7818180003?gh_jid=7818180003"
node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/break-1-sc-manager-5yrs.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/owner-check
npm run verify
npm run doctor
```

On this Windows machine, put `.venv/Scripts` first on PATH for the last two (see section 1).

**The one record to check by hand: 13-1081 Logisticians in Dallas-Fort Worth-Arlington, TX.**

1. Open `MSA_M2024_dl.xlsx` (inside `data/bls/local-wage/raw/oesm24ma/oesm24ma.zip`) and filter to `AREA` = 19100 and `OCC_CODE` = 13-1081. `A_MEDIAN` should be 77110.
2. In BEA `MARPP_MSA_2008_2024.csv`, find GeoFIPS 19100, LineCode 1. The 2024 value should be 103.090.
3. 77110 / 1.0309 = 74,798.72. Compare with the RS row in `runs/01-2026-10-21/soc-resolver.md`.

Then:

- set the recipe's `last_gate`;
- replace the adequacy line in `logs/runs/2026fa-contactshyam14-code-2.md`;
- decide Zipline's liveness gate in writing.

## Reflection (drafted by the AI; the owner should edit)

**Went well.**

- The refusal fired for the right reason on a real posting. The Inventory Planner case is exactly the failure mode the mode was designed for: a clerical code sits $23,110 below Logisticians, and a third code has no wage at all.
- The mode reused three existing tools unmodified (liveness, scorer, local-wage).
- Missing data stayed missing at every layer.
- Every number in the report was checked against a raw government file.

**What the mode got wrong or missed.**

- **The score part of the spread check is inert.** The scorer's role_quality weight is 0, so only the wage spread can separate SOCs. The spec asked for a score spread; the honest finding is that it can't fire with the scorer as it is.
- **The keyword table is the weakest link.** It added 11-1021 to Zipline, which nobody expected. Every candidate list is a model-judgment.
- **The liveness gate stopped the main live run.** The checker read Zipline's page as having no Apply control, while the ATS API lists the job.
- **The mode can't say what the employer will file.** That was always the limit; the mode makes it visible but cannot remove it.

**Next steps.**

1. Add DOL OFLC LCA disclosure data, which records the filed SOC per employer and worksite. This is the one source that turns "ask the recruiter" into a record.
2. Swap the hand keyword table for the full O*NET alternate-titles file.
3. Propose the two local-wage-script fixes to the maintainer.
4. Ask the maintainer whether role_quality should carry weight.
5. Re-check RS liveness after 2026-10-24.
6. Enter the EAD dates when the card arrives.

## Zip check

_Pending: the zip is built from the final commit after this file is written; see the next commit._
