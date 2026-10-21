# SOURCES — what this submission is built on, and who did what

## Executive summary

This file credits everything the mode-build submission uses: the repository and its licenses, the public government data it downloads and trims, the scripts it runs without changing, the outside websites it contacted, and the tools used. It ends with an honest split of what the AI assistant did and what the student decided and must still check. Most hands-on work was done by the AI at the student's direction; the gate sign-off and the hand check are still the student's to do.

## The repository and its licenses

- **The Reallocation Engine** — `nikbearbrown/the-reallocation-engine`, branch cut from `origin/main` at `015843d` on 2026-10-21. Code under the repository `LICENSE`; book text under `LICENSE-BOOK-CC-BY-4.0.md`. Governing documents followed: `SNICKERDOODLE.md`, `DOMAIN.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `recipes/README.md`, `recipes/cases/README.md`, `scripts/contrib/README.md`, `.github/workflows/contrib-gate.yml`, `.github/PULL_REQUEST_TEMPLATE.md`.
- Recipes read as models: `recipes/local-wage-adjustment.md` (+ card), `recipes/cases/2026su/case-tpm-pivot.md`, `recipes/gate-behavior.md`, and my own earlier `recipes/cases/2026fa/contactshyam14-code-em-network-targets.md` (on branch `contrib/2026fa-contactshyam14-code-em-network-targets`, PR nikbearbrown/the-reallocation-engine#4).

## Data

| Data | Where | Origin / license | Fetched | Used as |
|---|---|---|---|---|
| BLS OEWS May 2024 metropolitan (`oesm24ma.zip` → `MSA_M2024_dl.xlsx`) | raw: `data/bls/local-wage/raw/oesm24ma/` (git-excluded); trimmed: `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data/metro_oews.csv` | U.S. Bureau of Labor Statistics, public domain (U.S. government work); https://www.bls.gov/oes/special-requests/oesm24ma.zip | 2026-10-21T19:44:27Z, 40,189,821 bytes, sha256 `7bf915fc…d35d9` | record |
| BEA Regional Price Parities by MSA (`MARPP.zip`) | raw: `data/bls/local-wage/raw/marpp/`; trimmed: `…/data/bea_rpp.csv` | U.S. Bureau of Economic Analysis, public domain; https://apps.bea.gov/regional/zip/MARPP.zip ("Last updated: February 19, 2026") | 2026-10-21T19:44:41Z, 146,479 bytes, sha256 `5dbf2e6a…34c83e` | record |
| BLS OEWS May 2024 national | `data/bls/oesm24nat/national_M2024_dl.xlsx` (in repo) → `…/data/national_oews_candidates.csv` | BLS, public domain | in repo at `d08afdd` | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` (in repo) | O*NET (CC BY 4.0, U.S. DOL/ETA) + BLS, extracted by `scripts/bls/extract-soc-occupation-table.py` | in repo | record |
| 80 Days to Stay | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`) | Humanitarians AI / Nik Bear Brown, see `data/80-days-to-stay/LICENSE` | in repo | record |
| Zipline posting 7818180003 | Greenhouse board API JSON, `…/inputs/raw/zipline/` (git-excluded; only short quotes reach tracked files) | © Zipline; quoted for evidence only | 2026-10-21T19:49:13Z, 13,598 bytes, sha256 `c6d70cda…5957` | record |
| RS Group posting 1439895033 | SuccessFactors page, `…/inputs/raw/rs/` (git-excluded) | © RS Group; quoted for evidence only | 2026-10-21T19:49:13Z, 153,458 bytes, sha256 `a26e7053…2dec` | record |
| Sample + break-test postings | `…/inputs/postings/samples/*.json` | written for this mode; fictional employers | — | your-input |
| Test fixtures | `…/fixtures/` | invented numbers and names | — | fictional |

## Repository scripts used, unmodified

`scripts/ats/check-liveness.mjs` (`npm run ats:liveness`), `scripts/ats/scan.mjs` (`npm run ats:scan -- --dry-run`), `scripts/score/role-scorer.mjs` (`npm run score`), `scripts/bls/local-wage-adjustment.py`, `scripts/conformance.mjs` + `scripts/manifest-check.mjs` (`npm run verify`), `scripts/doctor.mjs` (`npm run doctor`).

## External services contacted (2026-10-21)

- `www.bls.gov` (one download), `apps.bea.gov` (one download), both approved by the owner in chat.
- `boards-api.greenhouse.io` (one posting JSON); `job-boards.greenhouse.io` and `www.zipline.com` (Playwright liveness, plus the `ats:scan` board listing); `careers.rsgroup.com` (one page fetch plus Playwright liveness).
- `pypi.org` (pandas 2.2.3 into the gitignored `.venv`) and Playwright's CDN (Chromium for Playwright 1.62.1), both approved by the owner in chat.

## Tools

Node 22.12.0, npm 10.9.0, Python 3.12.5 (`.venv`, `--system-site-packages` for the existing PyYAML 6.0.3), pandas 2.2.3, Playwright 1.62.1 Chromium, Git Bash on Windows 11. AI assistant: Claude (Anthropic), running as Claude Code in the Claude desktop app.

## Facts used but not verified against a primary source

- South San Francisco is in San Mateo County, inside the San Francisco-Oakland-Fremont MSA. Fort Worth 76118 is in Tarrant County, inside the Dallas-Fort Worth-Arlington MSA. Both are your-input; there is no OMB delineation file in the repo.
- Job-board claims for the Zipline posting ("Senior Level, Lead/Staff", "$148K–$285K", "H1B Sponsor Likely", "Unicorn $7.6B valuation") are recorded as unverified. Only the pay range was checked, and it is consistent with the posting text ($147,800–$285,200).
- That OPT employment can begin only once the EAD is held and its Valid From date has arrived, and that the 90-day unemployment clock starts on Valid From. This is the owner's statement of their situation, used only to word the human gate; the tool computes nothing from it.

## What the AI did, and what the owner decided, checked, changed or rejected

| AI (Claude) did | Owner (contactshyam14-code) |
|---|---|
| Read the governing docs and found three conflicts between the brief and the CI rules: `assignments/submissions/` vs `course/<term>/submissions/`; `logs/RUN_LOG.md` is CI-protected; new files must stay in namespaces | **Decided** all three in chat: `course/2026fa/submissions/`, `logs/runs/` file, trimmed data inside the contrib folder |
| Saved baseline `verify`/`doctor` output, branched from `origin/main` | Specified the branch name and the baseline-first rule |
| Downloaded BLS and BEA files; trimmed them with a stdlib script; wrote provenance | **Approved** exactly these two downloads, plus pandas and Chromium when asked |
| Ran `ats:liveness`, `ats:scan --dry-run`, fetched both postings | Supplied both real postings and the facts to re-check (dates, experience lines, degree wording, job-board claims, 80 Days name collisions) |
| Wrote the resolver, keyword rules, thresholds, tests, fixtures, samples | Specified the gates, verdicts, candidate SOC table, experience formats, required tests and failure modes |
| Ran the mode, re-ran it, cross-checked numbers against raw files, tried to break it | **Still to do:** re-run the commands in the recipe's "Sign the gate", check the DFW 13-1081 record by hand, sign `last_gate` |
| Drafted every document in this folder | **Still to do:** read and correct the drafts; write the "In my own words" section of FRICTIONAL.md |
| Put the owner's university email in the User-Agent header of the BLS download without being asked (see FRICTIONAL) | Not consulted beforehand. Told afterwards. |
