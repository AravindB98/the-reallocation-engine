# Sources and credits — cap-exempt employer triage

## Executive summary

This page lists everything the cap-exempt triage mode relied on: the repository rules it follows, the datasets it reads (with download dates and fingerprints), the code it reuses, the regulations behind its gates, the real job postings in the worked run, the tools used, and who did what — including what an AI assistant did. Read it to check any claim in the mode back to where it came from. Nothing here is personal data: the person in the run is fictional, and the postings are public job ads.

## Repository and governing documents

| Document | Used for |
|---|---|
| `SNICKERDOODLE.md` | principles, gates, recipe lifecycle, TODO closure, attestation format |
| `DOMAIN.md`, `AGENTS.md`, `_MANIFEST.md` | layout, runnable commands, executive-summary rule (P9) |
| `CONTRIBUTING.md` | branch name, namespaced paths, `logs/runs/` instead of `logs/RUN_LOG.md` |
| `DATA_CONTRACT.md` §Zero-Conditions | fictional personas only; no real immigration details |
| `recipes/local-wage-adjustment.md` / `.card.md` | format model for the recipe + card pair |
| `search/examples/priya-nair/profile.yml` | the fictional persona (not modified) |

## Data

| Dataset | Where | Origin, date, fingerprint |
|---|---|---|
| 80 Days to Stay company CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | shipped in the repo · SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | shipped in the repo (OEWS May 2024 national) |
| IPEDS HD2024 | `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv` | https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip · downloaded 2026-10-21 · raw SHA-256 `d98425c123d7c0e872aec6e83960dfb501884818bf17385c340790f3d1f28345` |
| USCIS H-1B Employer Data Hub FY2023 | `…/data/extracts/uscis_h1b_hub_fy2023.csv` | https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv · downloaded 2026-10-21 · SHA-256 `96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931` |

Probed but **not** ingested (open TODOs): IRS Exempt Organizations Business Master File (`https://www.irs.gov/pub/irs-soi/eo1.csv`–`eo4.csv`) and DOL OFLC wages 2026-27 (`https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip`).

## Code reused, not modified

- `normalize_company_name` from `scripts/sec/entity-resolution.py` — imported for exact name matching against 80 Days, IPEDS and USCIS.
- `npm run ats:liveness` → `scripts/ats/check-liveness.mjs` / `liveness-browser.mjs` / `liveness-core.mjs` — run as-is; `liveness-core.mjs:73` (the 300-character rule) was read to explain the Fred Hutch false "expired". A fix is proposed to the maintainers, not patched.

## Regulations (checked against primary text on 2026-10-21 by an AI research helper; not reviewed by a person; not legal advice)

| Claim | Citation | Primary source |
|---|---|---|
| The three cap-exempt employer categories | INA 214(g)(5)(A)–(B), 8 U.S.C. 1184(g)(5); 8 CFR 214.2(h)(8)(iii)(F)(1)–(3) | https://www.ecfr.gov/current/title-8/section-214.2#p-214.2(h)(8)(iii)(F) |
| "Fundamental activity" definition; the half-time third-party rule (F)(4) | 89 FR 103054 (Dec 18 2024, eff. Jan 17 2025) | https://www.federalregister.gov/documents/2024/12/18/2024-29354/modernizing-h-1b-requirements-providing-flexibility-in-the-f-1-program-and-program-improvements |
| Institution of higher education = public or other nonprofit | HEA §101(a), 20 U.S.C. 1001(a)(4) | via 8 CFR 214.2(h)(8)(iii)(F) definitions |
| Cap-gap covers cap-subject petitions only; now runs to April 1 | 8 CFR 214.2(f)(5)(vii)(A) (renumbered eff. 2026-09-15) | https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/extension-of-post-completion-optional-practical-training-opt-and-f-1-status-for-eligible-students |
| STEM OPT needs an E-Verify employer | 8 CFR 214.2(f)(10)(ii)(C)(5) | https://www.ecfr.gov/current/title-8/section-214.2#p-214.2(f)(10)(ii)(C)(5) |
| Moving from cap-exempt to cap-subject later means being counted (lottery); concurrent exception | 8 U.S.C. 1184(g)(6); 8 CFR 214.2(h)(8)(iii)(F)(5)–(6) | eCFR link above |

## Job postings in the worked run (public, found 2026-10-21)

| # | Employer · role | Posting | Employer self-description |
|---|---|---|---|
| T1 | Northeastern University · Associate AI Engineer | https://northeastern.wd1.myworkdayjobs.com/careers/job/Boston-MA-Main-Campus/Associate-AI-Engineer_R141445 | https://facts.northeastern.edu/ |
| T2 | Fred Hutchinson Cancer Center · Software Development Engineer II | https://careers-fhcrc.icims.com/jobs/31897/software-development-engineer-ii/job | https://www.fredhutch.org/en/about/about-the-hutch.html |
| T3 | Allen Institute for AI · Senior Research Engineer, Olmo + Molmo | https://job-boards.greenhouse.io/thealleninstitute/jobs/7980660 | https://allenai.org/about · legal name: https://allenai.org/terms |
| T4 | Toyota Research Institute · Senior Research Engineer, Computer Vision | https://jobs.lever.co/tri/fcfe4b57-d1a0-47f6-b14f-98a4d30313eb | https://www.tri.global/news/toyota-will-establish-new-artificial-intelligence-research-and-development-company |
| T5 | HHMI Janelia · AI Engineer - AI+CryoET | https://hhmi.wd1.myworkdayjobs.com/External/job/Janelia-Research-Campus/AI-Engineer---AI-CryoET_R-4313 | https://www.hhmi.org/about (says "private"; no nonprofit wording on /about, /about/faq or /about/financials, checked 2026-10-21, so T5 fails closed) |
| T7 | Allen Institute for AI · Research Engineer, Climate Modeling | https://job-boards.greenhouse.io/thealleninstitute/jobs/8234447 | as T3 |

T6 (`…/thealleninstitute/jobs/1`) is a deliberately constructed dead URL, not a real posting.

## Tools

Python 3.9.6 (stdlib + PyYAML) · Node/npm with the repo's Playwright Chromium (liveness) · `curl` for read-only probes and the one manual Fred Hutch check · Claude Code.

## AI contribution

- **Claude Code (Claude Opus 5.5)** wrote the scripts, tests and fixtures, ran the commands, and drafted the recipe, card, justification, worked run, run logs and this page — at the author's direction, inside this repository's rules.
- **Two AI research helpers** (subagents) found the six real postings and checked the five regulatory claims against primary sources; every URL they used is listed above and was not taken on trust where it could be checked (the Fred Hutch posting was re-checked by hand; counts were re-computed independently).
- No AI output is presented as verified fact without a record behind it; judgments (SOC codes, claimed categories) are labelled as such in every output.

## Who did what

| Who | What |
|---|---|
| **Varnika (author)** | Chose the domain and the cap-exempt idea from five options · ran the git setup (upstream remote, clean branch cut from `upstream/main`, check that no old commits came along) · reviewed and directed scope: asked for the open TODOs to be closed, chose the middle scope (IPEDS + USCIS + hiring lag), decided to keep 45 days as a labelled guess, asked for SOURCES.md, FRICTIONAL.md and a Contributions section · gave the answers FRICTIONAL.md is written from · **questioned the work, and each question changed it** (why only her attestation; whether the old recipe had TODOs, which changed the scope; why "Did not test" was long, which got 6 items tested or measured; whether G4 was checked, which got it made testable; a comparison against a classmate's grading comments, which found a card/code mismatch) · **made the G4 decisions** (2 keep held, 4 drop) and **confirmed the HHMI record link** · signs the attestation (the human adequacy gate) |
| **Claude Code** | Code, tests, runs, data ingest, drafts of every document, verification and cross-checks |
| **AI research helpers** | Posting search; regulation check |
| **TA (via a classmate's question)** | Ruling used for the PR mechanics: content from Canvas, GitHub rules from CONTRIBUTING.md, a second open PR is fine |
