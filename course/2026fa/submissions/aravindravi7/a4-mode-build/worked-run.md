# Worked run (A4) — PM sponsor title-match v0.2.0, live on 2026-10-21

## Executive summary

This is the record of running the PM sponsor title-match mode live on 21 October 2026, eighteen days after the first run, for a fictional STEM OPT student whose situation mirrors mine. New since A2: the Department of Labor's per-filing visa-application data, rule values I set myself, and a hold for the unemployment-allowance clock.

**What happened.**
- **Postings:** of the 14 postings that were live on 3 October, 2 have closed and 12 are open.
- **DOL filings:** five of the six companies that looked like "sponsors, but no PM title" had filed for PM roles this year.
- **Decisions:** after my gate decisions, 7 postings are Apply and 7 are held. I declined six because the unemployment margin is too thin for a role I'm screened out of or can't realistically land; one has no sponsorship evidence at all.
- **Not done:** E-Verify was not checked in this run, so every Apply still says "check E-Verify first".

**What I learned.** At my sponsorship values, fit barely matters: four roles I'm screened out of would have scored Apply. My own timeline decision caught them, not the scorer.

## Predictions vs. outcomes

Predictions recorded in `predictions.md` before any liveness check, scan or DOL ingest (commits `d96fad9`, `cdcf653`).

| # | Prediction | Outcome | Result |
|---|---|---|---|
| P1 | 6 or more of 14 postings closed by 2026-10-21 | The checker found 1 expired (w08), 4 uncertain and 9 active. My G2 check resolved the 4 uncertain as 1 expired (w02) and 3 active. **2 closed, 12 open.** | Missed: far fewer closed than I expected |
| P2 | About half (2–4) of the six "Possible" companies have certified PM filings, Oct 2025 – Jun 2026 | **5 of 6** (Databricks, Robinhood, Figma, Asana, Reddit; not Notion), with Certified only or with Certified-Withdrawn counted | Missed: more than I expected; the direction (the list hides PM sponsorship) was right |

## My edits (before → after)

Values and decisions are mine. Reasons are my de-identified versions; the full reasons stay outside the repo.

| Row | Value change | My reason |
|---|---|---|
| A · Proven p | 0.9 → 0.88 | Anchored to the measured rate (23/26 large Proven employers, 88.5%, filed certified PM LCAs in FY2026); role-level evidence, so no discount. |
| A · Likely p | 0.6 → 0.85 | Too few employers (4) to measure; approved PM sponsorship in the adjacent family, placed just below LCA-filed. |
| A · LCA-filed p | new → 0.86 | Judgment, since it can't be measured without circularity; a recent same-family certified filing, ranked below approval-backed Proven. |
| A · Possible p | 0.5 → 0.60 | Measured 67% (59/88); discounted because no PM-title evidence ties it to this role. |
| A · None p | 0.0 → 0.43, passed as unknown | Measured 43% (9/21); missing approvals mostly mean missing data; demoted so no-approval roles can't reach Apply. |
| A2 · LCA-filed scorer name | new → own name | A same-family certified LCA is direct evidence; passing it as "possible" would equate it with no PM evidence. |
| B · order | Proven → Likely → Possible → None → Proven → LCA-filed → Likely → Possible → None | Same-family filing this year describes the posting better than adjacent-family approvals; approvals still beat filings. |
| B2 | new → LCA-filed | The filing adds the PM-specific evidence Possible lacks. |
| B3 | hold → LCA-filed allowed | Absence from 80 Days is a data gap, not evidence against. |
| B4 | new → never lowers a tier | A 9-month window against multi-year approvals; it would demote 3 of 26 large Proven employers. |
| B5 | Certified only → counts as filed | Certification shows intent to sponsor; a later withdrawal reflects the role or candidate changing. |
| B6 | new → no tier effect | Uncompleted filings are evidence neither way. |
| C · w01 fit | 0.85 → 0.3 | Eligibility cap: past the program's 0–2-year experience window. |
| C · w02 fit | 0.60 → 0.3 | Two gaps: below the 7–12+ years required; no payments product ownership. |
| C · w03 fit | 0.75 → 0.7 | Core match on data platforms; one gap: security domain. |
| C · w04 fit | 0.65 → 0.7 | Core match on leading technical programs; one gap: SaaS at this scale. |
| C · w05 fit | 0.45 → 0.3 | Two gaps: no developer-SDK ownership; senior level. |
| C · w06 fit | 0.85 → 0.9 | Graduation window and degree fit; prior data-platform product work matches the core. |
| C · w07 fit | 0.50 → 0.7 | Meets the years and the data-platform core; one gap: enterprise developer-platform scale. |
| C · w08 fit | 0.80 → 0.3 | Eligibility cap: past the 0–1-year experience window. |
| C · w09 fit | 0.55 → 0.3 | Two gaps: infrastructure depth; never built a TPM function. |
| C · w10 fit | 0.50 → 0.7 | Meets the years; one gap: consumer growth. |
| C · w11 fit | 0.55 → 0.7 | Shipped an AI workflow product; one gap: one year short of the requirement. |
| C · w12 fit | 0.60 → 0.5 | Stretch: senior level and a scientific domain. |
| C · w13 fit | 0.75 → 0.7 | Procurement background covered; one gap: marketplace product experience. |
| C · w14 fit | 0.50 → 0.3 | Two gaps: no ITGC/SOX experience; no finance-systems program ownership. |
| D · w06 hiring lag | 270 → 82 days | The JD states a January 2027 start (mid-month ≈ 82 days); under the 92-day allowance, held by E1 for its 10-day margin. |
| E1 · unemployment margin | new → hold below 30 days | The unemployment allowance is the binding clock; below 30 days of margin, a human decides the risk. |
| thin_title_evidence | 2 | unchanged from v0.1.1; display-only; not reviewed |

Kept, not edited: default hiring lag 75 days (keep: based on what recruiters have told me about application-to-start time for PM roles); timeline steps; E2 (keep the 0.3 step, recorded in can't-verify).

## Inputs

Values and decisions are mine; reasoning text was drafted with Claude from my answers and a JD check, then edited by me.

- **Persona:** `runs/live-2026-10-21/persona.json`. Fictional; the unemployment clock advanced 40 → 58 days used, so 92 of 150 days remain.
- **Rules:** `runs/live-2026-10-21/rules.json`, version `a4-2026-10-21`, set by Aravind Ravi.
- **Shortlist:** the 14 postings from 2026-10-03. Pass 1 is `shortlist.json` (my fit values; w06 lag 82). Pass 2 is `shortlist.pass2.json` (adds my G2 and E1 decisions verbatim). My Stripe resolution, word for word, is in `lca_resolutions.json`.
- **Data:**
  - 80 Days CSV (30,369 rows);
  - DOL `LCA_Disclosure_Data_FY2026_Q3.xlsx` (downloaded by me on 2026-10-21; sha256 `f8ca8448…bd28b3`), compacted to a 10,936-row PM-family extract and a 53,193-employer index;
  - Form D samples;
  - BLS compact.
- **Not triaged:** the 26 postings new since 2026-10-03 (listed under Reflection).

## Commands and real output

### 1. DOL ingest (verification re-run, no re-pin)

```text
$ .venv/bin/python scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/ingest_lca.py --xlsx ../dol-raw/LCA_Disclosure_Data_FY2026_Q3.xlsx --downloaded-by "Aravind Ravi" --downloaded-on 2026-10-21 --layout-check … --layout-note … --watch-employer …
hashing LCA_Disclosure_Data_FY2026_Q3.xlsx (251,850,891 bytes)…
sha256 f8ca8448a528671f784d3692923775a13741c99caec2816b2fe30c8885bd28b3 — verified against pin
employer index lca-employer-index-fy2026_q3.csv — verified against pin
extract lca-pm-filings-fy2026_q3.csv — verified against pin
  employer index: scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-employer-index-fy2026_q3.csv (2,721,469 bytes, 53,193 employers, 210 multi-suffix)
✓ 437,496 rows in → 10,936 kept → scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-pm-filings-fy2026_q3.csv (2,686,443 bytes)
  rejects: {'not-pm-family-title': 416016, 'not-h1b': 10544}
  status strings (all rows): {'Certified - Withdrawn': 26303, 'Withdrawn': 7224, 'Certified': 401412, 'Denied': 2557} · unrecognized: 0
  audit: scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-pm-filings-fy2026_q3-audit.md
exit=0
```

### 2. Scan (real, 13 boards)

```text
$ REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/fixtures/portals.pm-sponsors.yml npm run ats:scan
Scanning 13 companies via providers (0 local parser; 0 skipped — no provider matched)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     13
Total jobs found:      4132
Filtered by title:     3986 removed
Filtered by location:  29 removed
Duplicates:            91 skipped
New offers added:      26
New offers:
Results saved to data/ats/pipeline.md and data/ats/scan-history.tsv
Review new offers in data/ats/pipeline.md.
npm notice
npm notice New major version of npm available! 10.8.2 -> 12.2.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.2.1
npm notice To update run: npm install -g npm@12.2.1
npm notice
exit=0
```

### 3. Liveness (real, JSON)

```text
$ node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/liveness-json.mjs --file course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/urls.txt --out course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/liveness.jsonl
Checking 14 URL(s) with scripts/ats/liveness-browser.mjs#checkUrlLiveness (sequential)...
active    https://stripe.com/jobs/search?gh_jid=7737124
uncertain https://stripe.com/jobs/search?gh_jid=7176530  (content present but no visible apply control found)
uncertain https://careers.datadoghq.com/detail/7982288/?gh_jid=7982288  (content present but no visible apply control found)
uncertain https://careers.datadoghq.com/detail/8144018/?gh_jid=8144018  (content present but no visible apply control found)
uncertain https://www.mongodb.com/careers/job/?gh_jid=8143805  (content present but no visible apply control found)
active    https://databricks.com/company/careers/open-positions/job?gh_jid=7586263002
active    https://databricks.com/company/careers/open-positions/job?gh_jid=8136071002
expired   https://boards.greenhouse.io/robinhood/jobs/8199973?t=gh_src=&gh_jid=8199973  (insufficient content — likely nav/footer only)
active    https://boards.greenhouse.io/figma/jobs/6020719004?gh_jid=6020719004
active    https://job-boards.greenhouse.io/reddit/jobs/8237639
active    https://www.asana.com/jobs/apply/8180874?gh_jid=8180874
active    https://job-boards.greenhouse.io/anthropic/jobs/5394887008
active    https://jobs.ashbyhq.com/ramp/cf3516f6-4d6b-4872-831f-c8ef4a3078ee
active    https://jobs.ashbyhq.com/notion/7ec83090-7c5b-4691-bf20-e11e892cede1
Results: 9 active  1 expired  4 uncertain  →  course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/liveness.jsonl
exit=0
```

### 4. Pass 1

```text
$ node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --shortlist course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/shortlist.json --persona course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/persona.json --rules course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/rules.json --liveness course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/liveness.jsonl --out course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass1 --as-of 2026-10-21
✓ pm-sponsor-triage 2026-10-21 [live]: 14 evaluated → Apply 0 · Consider 0 · Skip 0 · HOLD 14 (0 sent to scorer)
  course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass1/pm-triage-log.json  +  course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass1/pm-triage-report.md
  HOLD w01-stripe-pm-newgrad: unemployment-margin
  HOLD w02-stripe-pm-payments: liveness-uncertain, unemployment-margin
  HOLD w03-datadog-pm2-ai-security: liveness-uncertain, unemployment-margin
  HOLD w04-datadog-tpm2: liveness-uncertain, unemployment-margin
  HOLD w05-mongodb-spm-client-libs: liveness-uncertain, unemployment-margin
  HOLD w06-databricks-apm-2027: unemployment-margin
  HOLD w07-databricks-spm-ai: unemployment-margin
  HOLD w08-robinhood-apm-newgrad: unemployment-margin
  HOLD w09-figma-tpm-infra: unemployment-margin
  HOLD w10-reddit-spm-notifications: unemployment-margin
  HOLD w11-asana-spm-ai-studio: unemployment-margin
  HOLD w12-anthropic-pm-science: company-not-in-csv, unemployment-margin
  HOLD w13-ramp-pm-vendor: unemployment-margin
  HOLD w14-notion-tpm-finsys: unemployment-margin
exit=0
```

### 5. My gate decisions (Aravind Ravi, 2026-10-21)

- **G1:** Stripe Inc./LLC resolved by record (same EMPLOYER_FEIN 27-0465600); my human resolution is recorded as concurring. w12 Anthropic stays held: not in 80 Days, and its 197 H-1B filings include no PM-family title, so no tier is possible.
- **G2:** w02 expired; w03, w04 and w05 active (opened in my browser).
- **E1, accepted (basis: "17-day margin; fit 0.7 makes the role worth the risk. I apply now and drop it if the process runs past the allowance."):** w03, w04, w07, w10, w11, w13.
- **E1, accepted (basis: "10-day margin, but the January start is fixed, so the date doesn't slip with the hiring process. Strongest fit on the list."):** w06.
- **E1, declined (basis: "Fit 0.3: past the program's experience cap. Not worth the margin on a role I'm screened out of. Stays held."):** w01, w08.
- **E1, declined (basis: "Fit 0.3: two gaps. Not worth the margin on a role I can't realistically land. Stays held."):** w02, w05, w09, w14.
- **G4 (E-Verify):** not recorded in this run. Every Apply's next action is `check-e-verify`.

### 6. Pass 2

```text
$ node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --shortlist course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/shortlist.pass2.json --persona course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/persona.json --rules course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/rules.json --liveness course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/liveness.jsonl --out course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass2 --as-of 2026-10-21
✓ pm-sponsor-triage 2026-10-21 [live]: 14 evaluated → Apply 7 · Consider 0 · Skip 0 · HOLD 7 (7 sent to scorer)
  scorer: ✓ scored 7 roles → Apply 7 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass2/pm-triage-log.json  +  course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/pass2/pm-triage-report.md
  HOLD w01-stripe-pm-newgrad: unemployment-margin
  HOLD w02-stripe-pm-payments: unemployment-margin
  HOLD w05-mongodb-spm-client-libs: unemployment-margin
  HOLD w08-robinhood-apm-newgrad: unemployment-margin
  HOLD w09-figma-tpm-infra: unemployment-margin
  HOLD w12-anthropic-pm-science: company-not-in-csv, unemployment-margin
  HOLD w14-notion-tpm-finsys: unemployment-margin
exit=0
```

#### Pass 2 decisions (pasted from `pass2/pm-triage-report.md`)

| Decision | Would be if live | Employer tier (yours unless marked) | Company — role | Composite | Sponsorship evidence | Liveness | Gates (G2 liveness · G4 E-Verify) | Next action (3-3-2 block) |
|---|---|---|---|---|---|---|---|---|
| **Apply** | — | 3 | Databricks — Associate Product Manager, New Grad (2027 Start) | 0.571 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 6; approvals 1640; PM titles on record: none | active | cleared — checker: active · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Datadog — Product Manager II, AI & Data Security | 0.518 | Proven (title-family-match); approvals 340; PM titles on record: "PRODUCT MANAGER" | active (human-checked) | cleared — named human: Aravind Ravi, 2026-10-21 · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Datadog — Technical Program Manager II | 0.511 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 1; approvals 340; PM titles on record: "PRODUCT MANAGER" | active (human-checked) | cleared — named human: Aravind Ravi, 2026-10-21 · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Databricks — Sr. Product Manager, Databricks AI | 0.511 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 6; approvals 1640; PM titles on record: none | active | cleared — checker: active · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Reddit — Senior Product Manager, Notifications | 0.511 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 1; approvals 408; PM titles on record: none; ambiguous, not counted: "Advertiser Optimization PM" | active | cleared — checker: active · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Asana — Senior Product Manager, AI Studio | 0.511 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 1; approvals 352; PM titles on record: none | active | cleared — checker: active · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **Apply** | — | 3 | Ramp — Product Manager / Vendor Intelligence & Marketplace | 0.511 | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 1; approvals none; PM titles on record: none | active | cleared — checker: active · open — E-Verify not checked | check-e-verify [2 (research-and-apply)]: G4 open: look this employer up on the E-Verify employer search before tailoring (STEM OPT requires an enrolled employer). |
| **HOLD** | — | 1 | Anthropic — Product Manager, Claude Science | — | not matched | active | cleared — checker: active · open — E-Verify not checked | resolve-hold [—]: company-not-in-csv: no CSV row whose normalized name equals "ANTHROPIC"; supply csv_name after checking by hand; unemployment-margin: margin 17d (allowance 92d − lag 75d) is below 30d — a named human accepts the risk with timeline_human {decision: "accept", by, date, basis} |
| **HOLD** | — | 2 | Notion — Technical Program Manager, Finance Systems & Compliance | — | Possible (sponsor-not-pm); approvals 98; PM titles on record: none · ⚠ thin: only 1 title(s) stored | active | cleared — checker: active · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: two gaps. Not worth the margin on a role I can't realistically land. Stays held. |
| **HOLD** | — | 3 | Stripe — Product Manager: New Grad Accelerator | — | Proven (title-family-match); approvals 1250; PM titles on record: "Product Manager" | active | cleared — checker: active · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: past the program's experience cap. Not worth the margin on a role I'm screened out of. Stays held. |
| **HOLD** | — | 3 | Stripe — Product Manager, Payments | — | Proven (title-family-match); approvals 1250; PM titles on record: "Product Manager" | expired (human-checked) | closed — named human: Aravind Ravi, 2026-10-21 · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: two gaps. Not worth the margin on a role I can't realistically land. Stays held. |
| **HOLD** | — | 3 | MongoDB — Senior Product Manager, Client Libraries | — | Proven (title-family-match); approvals 462; PM titles on record: "Senior Product Manager" | active (human-checked) | cleared — named human: Aravind Ravi, 2026-10-21 · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: two gaps. Not worth the margin on a role I can't realistically land. Stays held. |
| **HOLD** | — | 3 | Robinhood — Associate Product Manager (New Grad) | — | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 13; approvals 824; PM titles on record: none | expired | closed — checker: expired · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: past the program's experience cap. Not worth the margin on a role I'm screened out of. Stays held. |
| **HOLD** | — | 3 | Figma — Technical Program Manager - Infrastructure | — | LCA-filed (lca-title-family); filed PM LCAs in the posting family: 1; approvals 188; PM titles on record: none | active | cleared — checker: active · open — E-Verify not checked | resolve-hold [—]: unemployment-margin: margin 17d is below 30d — declined by Aravind Ravi, 2026-10-21: Fit 0.3: two gaps. Not worth the margin on a role I can't realistically land. Stays held. |

## Verified vs. inferred (the seven Apply roles)

| Role | Tier (and its record) | p | Fit | Liveness | Timeline | Composite | E-Verify |
|---|---|---|---|---|---|---|---|
| w03-datadog-pm2-ai-security | Proven via `title-family-match` (record: 80 Days stored title) | p 0.88 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (your-input, Aravind Ravi) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.518 → Apply (scorer) | G4 open (none) |
| w04-datadog-tpm2 | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 1) | p 0.86 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (your-input, Aravind Ravi) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.511 → Apply (scorer) | G4 open (none) |
| w06-databricks-apm-2027 | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 6) | p 0.86 (your-input, rules file) | fit 0.9 (your-input) | liveness 1 (record) | timeline 1 (your-input) · margin 10d accepted (your-input) | 0.571 → Apply (scorer) | G4 open (none) |
| w07-databricks-spm-ai | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 6) | p 0.86 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (record) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.511 → Apply (scorer) | G4 open (none) |
| w10-reddit-spm-notifications | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 1) | p 0.86 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (record) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.511 → Apply (scorer) | G4 open (none) |
| w11-asana-spm-ai-studio | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 1) | p 0.86 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (record) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.511 → Apply (scorer) | G4 open (none) |
| w13-ramp-pm-vendor | LCA-filed via `lca-title-family` (record: filed PM LCAs in the posting family: 1) | p 0.86 (your-input, rules file) | fit 0.7 (your-input) | liveness 1 (record) | timeline 1 (your-input) · margin 17d accepted (your-input) | 0.511 → Apply (scorer) | G4 open (none) |

- **Record:** approvals, stored titles, DOL filings and FEINs, and the liveness checker's verdicts.
- **My input:** p values, fit, lags, persona clock, and every gate decision.
- **Scorer output:** composites and decisions.
- **Model judgment:** none (no model was called).
- **Not checked:** E-Verify, and the eligibility screens in each job description beyond my own fit rating.

## Verification

### Layout PDF checked against the real header row (2026-10-21)

Before the ingest ran, the AI agent read `LCA_Record_Layout_FY2026_Q3.pdf` (pages 1–4) and compared its 98 field names, and the status values it documents, with the header row and first data rows of `LCA_Disclosure_Data_FY2026_Q3.xlsx`. Aravind Ravi reviewed the result. Every column the ingest reads appears in both. Two discrepancies were found and recorded:

| # | Layout PDF says | The file has | Effect |
|---|---|---|---|
| 1 | column `H-1B_DEPENDENT` | column `H_1B_DEPENDENT` | none: the ingest doesn't read it |
| 2 | status `"Certified-Withdrawn"` | status `Certified - Withdrawn` | statuses are compared with whitespace around the hyphen ignored; every observed status string and its count is listed in the ingest audit, and anything unrecognized halts the run |

### Manual cross-check in Apple Numbers, by Aravind Ravi (2026-10-21)

Aravind Ravi opened the raw `LCA_Disclosure_Data_FY2026_Q3.xlsx` in Apple Numbers and re-counted Stripe's rows by hand, independently of the code. Counts only; no row data is reproduced here.

| Filter or group | Rows (Numbers) | EMPLOYER_FEIN | PM-family rows | Code's figure |
|---|---|---|---|---|
| EMPLOYER_NAME contains "Stripe" and VISA_CLASS **is** "H-1B" | 250 | — | — | — |
| ↳ Stripe, LLC | 203 | 27-0465600 | 18 | 203, 18 |
| ↳ Stripe, Inc. | 42 | 27-0465600 | 1 | 42, 1 |
| ↳ Stripe Payments Company | 2 | 80-0948598 | 0 | not joined |
| ↳ Stripe MALPB (Atlanta) | 3 | 39-4871956 | 0 | not joined |
| Same name filter with VISA_CLASS **contains** "H-1B" | 257 | — | — | the 7 extra rows are H-1B1, which the code excludes |

The two same-FEIN names total 245 rows, exactly the code's 245, and the independent PM-family count of 19 (18 + 1) matches the code.

**Conclusion (Aravind Ravi):** “The normalized-name join includes Stripe, Inc. and Stripe, LLC (one key, STRIPE) and excludes Stripe Payments Company and Stripe MALPB (different keys). The FEIN rule then resolves Inc./LLC as one employer (same FEIN 27-0465600). The two excluded names have different FEINs and 0 PM rows, so their exclusion is correct and doesn’t affect the Stripe tier.”

### Exit codes and background tasks

- The first ingest's wrapper reported exit 0 while the ingest exited 5; success is read from the command's own exit code. Since 2026-10-21, every wrapped or background command propagates the real exit code (`cmd; rc=$?; echo "exit=$rc" >> log; exit $rc`), and the reported result is the underlying command's.
- Background task `buypwcqb7` (≈12:45, empty output, exit 0): unexplained background task, no file changes. Checked: `git status` clean apart from the untracked `.Rhistory`; reflog shows no git activity after the 12:39:36 commit `4907444`; no file in the repo or `A02/` modified after 12:39:40.

### The scanner's date stamp

The scan header reads **2026-10-22**: the scanner stamps the UTC date, and the run happened at 20:58 EDT on 2026-10-21 (00:58 UTC on 10-22). The persona clock (58 days used) is computed for 2026-10-21, so both triage passes pass `--as-of 2026-10-21` explicitly.

### Determinism and pins

The verification re-run of the ingest (output above) verified all three pins: raw file, extract and index. The extract and index are byte-identical, and the audit differed only in its ingest timestamp, so the committed audit was kept.

### Tests and repository checks (final state)

```text
$ node --test scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test/
ok 1 - title classifier: product vs program vs ambiguous vs excluded
ok 2 - sponsored-title list parser handles a double-quoted title with an apostrophe
ok 3 - company matching is exact after normalization — an SPV fund name never matches the brand
ok 4 - liveness text parser reads the checker's own output format, including reason lines
ok 5 - liveness JSONL (liveness-json.mjs output) parses, and a line without provenance is refused
ok 6 - a JSONL file inside fixtures/ is fixture even if a line claims "record"
ok 7 - G2 unit: a checker record or a named human clears liveness; a fixture never does
ok 8 - G4 unit: E-Verify needs a named human; not-found/terminated block; a fixture never clears
ok 9 - timeline gate: steps, unemployment allowance, and refusal when OPT end is past
ok 10 - H-1B registration windows are counted from dates only
ok 11 - schema drift in the 80 Days CSV halts instead of reading the wrong column
ok 12 - a SOC code with no BLS row is reported missing, never zero
ok 13 - end to end on fixtures through the real scorer: holds, gates, labels, report shape
ok 14 - (b) provenance walk: in a sample run no fixture-derived value is labeled "record" — log and scorer input
ok 15 - (c) DEMO: fixture rows carry no actionable verdict — decision DEMO, outcome in would_be_if_live
ok 16 - (a) break attempt — mislabel: a fixture liveness file copied outside fixtures/ is still fixture and cannot clear G2
ok 17 - (d) break attempt — live guard: a live run fed fixture liveness is a hard stop (exit 5), nothing written
ok 18 - (d) live guard also refuses a fixture 80 Days CSV slice and BLS slice (record-type fixtures)
ok 19 - OPT end date already past: the whole run is refused and nothing is scored
ok 20 - break attempt: an authorization string with "authorized" makes the scorer drop sponsorship — the prototype refuses
ok 21 - characterization of the engine: the scorer treats a missing liveness factor as an open gate
ok 22 - a fixture-file human liveness clearance lifts the hold for the demo but does not clear G2
ok 23 - a liveness_human note without a name does not clear the gate
ok 24 - employer tier orders the report but never changes a decision or a composite
ok 25 - employer tier lookup: your list beats the predicted list beats the fallback rule; the rule never predicts 1 or 2
ok 26 - characterization of the engine (found by the student): a missing sponsorship term still yields a recommendation
ok 27 - LCA: an unmatched employer name is lca-unknown (none label), never absence
ok 28 - LCA: only a confirmed match with zero PM-family rows is absence; uncertified PM rows are not absence
ok 29 - LCA: PM-filed evidence counts same vs other family, hiring vs continuation, and is labeled by provenance
ok 30 - LCA: names that differ only by a missing suffix are one employer; INC vs LLC is ambiguous → HOLD
ok 31 - LCA: schema drift and a hand-edited extract (checksum pin mismatch) are refused
ok 32 - LCA: lca-unknown leaves every tier and composite identical to a run without LCA data
ok 33 - (d) break attempt — live guard: a live run fed a fixture LCA extract is a hard stop (exit 5), nothing written
ok 34 - backward compatibility: with LCA disabled, every v0.2.0 sample row's would_be_if_live equals the v0.1.1 decision and composite committed at 97f0a4a, and the HOLD rows and reasons are identical
ok 35 - break attempt: one changed rule value (Proven 0.9 → 0.8) is caught by the backward-compatibility comparison
ok 36 - a live run must declare its rule values: no --rules → exit 2, nothing written
ok 37 - sample runs label the frozen v0.1.1 rule values fixture (never your-input)
ok 38 - LCA employer index: in the index with 0 PM rows → lca-confirmed-none, scoped; not in the index → lca-unknown
ok 39 - LCA employer index: a legal-suffix split seen only in the index still HOLDs
ok 40 - LCA human resolution: names + resolver + date + basis clear the suffix hold; no basis or an unfiled name does not
ok 41 - FEIN: name variants sharing one EMPLOYER_FEIN resolve as one employer by record; a concurring human resolution is recorded
ok 42 - FEIN: different FEINs (or a missing FEIN) do not settle it — the suffix hold stands until a human resolves it
ok 43 - report renders every LCA status, including index-based lca-confirmed-none (regression: it crashed once)
ok 44 - A4 order: Proven stays first; LCA-filed beats Likely (same family); B2 and B3 give LCA-filed; None goes to the scorer as "unknown"
ok 45 - A4: B4 confirmed absence and B6 uncertified never move a tier; B5 off → Certified-Withdrawn-only is uncertified
ok 46 - A4: a None-tier role is sent to the scorer as "unknown" (demoted, can never be Apply)
ok 47 - A4 E1: margin below 30 days holds; a named human with a basis clears it; no basis does not
ok 48 - A4 rules file validation: order must cover every rule and end with None; filed statuses limited
ok 49 - A4 E1: a named decline keeps the hold and records the decision and basis
# tests 49
# pass 49
# fail 0

$ .venv/bin/python -m unittest discover -s scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test -p "test_*.py"
Ran 17 tests in 0.076s
OK

$ npm run verify
conformance: 174 files (88 md · 38 py · 33 js · 10 json · 1 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/
✓ manifest check passed (3 warnings)

$ npm run doctor   (tail)
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

$ node scripts/pii-scan.mjs   (working tree; the one finding is upstream's package-lock.json, not this branch)
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — [address redacted: an npm maintainer's email in a deprecation notice]

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.

$ node scripts/pii-scan.mjs --diff upstream/main
pii-scan: clean ✓
```

## Reflection

**Went well.**
- **The p values are calibrated against data.** I set them against FY2026 DOL filings rather than drafted numbers; the large-employer rates were unchanged when Certified-Withdrawn was counted.
- **The guards caught real failures:**
  - 595,239 empty spreadsheet rows that would have been miscounted;
  - a checksum re-pin step in the wrong order;
  - a report crash once confirmed absence became reachable;
  - a wrapper that reported exit 0 while the ingest had exited 5.
- **The FEIN rule settled most suffix splits from data:** 131 of the 210 legal-suffix splits, Stripe included.

**Missed.**
- **At p ≥ 0.857 fit barely matters.** Four roles at fit 0.3 (w01, w02, w05, w09: eligibility caps or two gaps) would have scored Apply. The scorer can't see eligibility screens; my E1 declines caught them.
- **Anthropic is unresolved:** 197 H-1B filings, 0 PM-family rows. It's unverified whether the classifier misses its titles.
- **The name join loses 38% of Proven employers** (49 of 130) to `lca-unknown`.

**Next.**
- An eligibility-cap gate (the recipe's open [TODO]).
- Rebalance fit against p.
- Verify Anthropic's titles by hand against the raw file.
- FEIN grouping across trade names (1,249 FEINs).

**Not triaged in this run:** the 26 postings new since 2026-10-03.

1. Figma | Product Manager, Figma Pattern Library  | San Francisco, CA • New York, NY • United States
2. Robinhood | Senior Product Manager, Advisor Marketplace | Menlo Park, CA; New York, NY
3. Robinhood | Senior Product Manager, Gold Growth | Menlo Park, CA; New York, NY
4. Robinhood | Senior Product Manager, Trading Tools | Menlo Park, CA; New York, NY
5. Robinhood | Technical Program Manager | Menlo Park, CA; New York, NY; Toronto, Canada
6. Datadog | Product Manager II - Agent Observability | New York, New York, USA
7. Datadog | Product Manager II - RUM | New York, New York, USA
8. Datadog | Technical Program Manager, Technical Solutions | Boston, Massachusetts, USA; New York, New York, USA; San Francisco, California, USA
9. Stripe | Product Manager, Radar | San Francisco, Seattle New York, US - Remote
10. Stripe | Product Manager, Radar - Fraud and Abuse Prevention | San Francisco, Seattle, New York, US-Remote
11. Stripe | Product Manager, Sandboxes | Seattle, San Francisco
12. Stripe | Technical Program Manager, Money-as-a-Service | Remote in the US
13. Databricks | Sr. Product Manager, Lakebase/Lakehouse | Seattle, Washington
14. Anthropic | Product Manager, Claude | San Francisco, CA | New York City, NY | Seattle, WA
15. Anthropic | Product Manager, Claude Marketplace | San Francisco, CA | New York City, NY
16. Anthropic | Product Manager, Enterprise Privacy | San Francisco, CA | New York City, NY
17. Anthropic | Product Manager (Technical), Product Support Experience | San Francisco, CA | New York City, NY
18. Anthropic | Technical Program Manager, Agent Safety & Security  | San Francisco, CA | New York City, NY
19. Anthropic | Technical Program Manager, Corporate Engineering | San Francisco, CA | New York City, NY
20. Anthropic | Technical Program Manager, Inference | San Francisco, CA | New York City, NY | Seattle, WA
21. Anthropic | Technical Program Manager, Science Strategy & Communications | San Francisco, CA | New York City, NY
22. Anthropic | Technical Program Manager, SOX Compliance | San Francisco, CA | New York City, NY
23. Ramp | Product Manager | Procurement | New York, NY (HQ)
24. Ramp | Product Manager | Growth | New York, NY (HQ)
25. Ramp | Senior Technical Program Manager | New York, NY (HQ)
26. Notion | Product Manager, Connections | San Francisco, California

## Attestation
- Recipe: pm-sponsor-title-match v0.2.0
- By: Aravind Ravi · `<date of your re-run>`. *The rows below were run by the AI agent in the build session on 2026-10-21; sign after re-running them yourself.*

### Tested
| Ran | Saw | Expected |
|---|---|---|
| Live run: scan → liveness (JSON) → pass 1 → my gates → pass 2, `--as-of 2026-10-21` | pass 1: 14 HOLD (E1 margin); pass 2: Apply 7 · HOLD 7; every command exit 0 | holds until a named human decides; no verdict without the gates |
| DOL ingest verification re-run | all three pins verified; extract and index byte-identical; 0 unrecognized statuses | a re-run reproduces the extract exactly |
| `--sample` | every scored row DEMO with `would_be_if_live`; nothing clears a gate | fixture rows carry no verdict |
| **Break:** a fixture liveness file copied outside `fixtures/` | still labeled `fixture`; G2 not cleared (test a) | the marker travels with the file |
| **Break:** fixture liveness / LCA extract / 80 Days slice / BLS slice / Form D fixture fed to a live run | exit 5, nothing written (tests d) | hard stop, not a warning |
| **Break:** a live run without `--rules` | exit 2, nothing written | no silent fallback to drafted values |
| **Break:** Proven p 0.9 → 0.8 in the v0.1.1 rules | the backward-compatibility comparison fails on the Proven rows | the comparison detects a changed value |
| **Break:** a hand-edited extract (checksum pin mismatch) | refused | a derived file can't be edited silently |
| **Break:** schema drift (80 Days, LCA extract, ingest header) | halt with "schema drift" | never read the wrong column |
| **Break:** a data row with a blank status in the ingest | exit 5 (end-to-end on a generated spreadsheet) | strict unrecognized-status check |
| **Break:** INC/LLC with different FEINs; a resolution without a basis; a resolution naming fewer names than the FEIN record | hold, hold, conflict hold | a human decides, with a basis |
| **Break:** `liveness_human`, `e_verify_human` or `timeline_human` without a name or basis | no clearance | gates clear only by a named human |
| **Break:** mutants (fixture labeled record; live guard off; DEMO off; tier order ignored; unchecked liveness = 1; fuzzy matching) | each caught by its test | the suite fails on the regression it exists for |
| **Break:** OPT end already past; authorization containing "authorized" | exit 3; exit 4 | refuse rather than report |

### Did not test
- The 26 postings new since 2026-10-03.
- E-Verify for the declined roles, and for every other role too: no G4 values were supplied in this run.
- The Anthropic title check (whether its 197 filings include PM work under titles the classifier misses).
- Any other DOL quarter; grouping by FEIN across trade names; any persona other than the fictional one.

### Broke during testing, fixed
- **A2's sample run labeled hand-written fixture liveness as `record`.** Now labeled `fixture`; fixture data never clears a gate; fixture rows are DEMO.
- **The first DOL prefilter would have matched "Programmer Analyst".** Caught in review before any run; narrowed, with a unit test.
- **The first ingest halted on 595,239 "unrecognized" statuses.** These were empty spreadsheet rows (data ends at row 437,497 of 1,032,736). Empty rows are now skipped and reported, and the status check stays strict.
- **347 abbreviated "Product Mgr"-style titles were dropped.** Classifier and prefilter v1.1 add Mgr/Mgmt, recovering 409 rows; no shortlist employer had PM rows only under abbreviated titles.
- **The derived-file re-pin ran after the index pin, so a re-run would hard-fail.** Reordered.
- **The report crashed (`Cannot convert undefined or null to object`) once the employer index made `lca-confirmed-none` reachable.** Fixed, with a regression test that renders a confirmed-none row.
- **The first ingest's wrapper reported exit 0 while the ingest exited 5.** Every wrapped command now propagates the real exit code.
- **A verification re-run rewrote the audit without the earlier re-pin record.** Re-pin lines now carry forward, with a test.
- **`rules.source` (a path) was read as a provenance label.** Renamed `rules.file`.
- **Built-in v0.1.1 constants would have been labeled `your-input`.** Sample runs now default to the frozen `fixtures/rules.v0.1.1.json`, labeled `fixture`.
- **An E1 decline was misreported as an incomplete entry.** A named decline now keeps the hold and records the decision.
