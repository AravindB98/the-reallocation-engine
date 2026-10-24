## Executive summary

This is the run record for the second screening run for a fictional international student, Sasha Jones, looking for an entry-level data scientist job with visa sponsorship. It covers 13 real public job postings checked on 21 October 2026. Read it to see what was run, on which inputs, and what a person found when they checked the results by hand. The run caught last month's false positive and two closed jobs, and scored three postings. A person's browser check then found one new false positive (a job link that landed on a company's all-jobs page) and one missed open job. After that review, one posting remains worth applying to and one is worth considering.

## 2026-10-21 — rithika-sr-ds-h1b-liveness (live run, real postings)

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md v0.1.0 (DRAFT, 13 open TODOs). Builds on recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md (status corrected RUNNABLE-SAMPLE → DRAFT today).
- **Inputs:**
  - `course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json`: 13 real public postings; rows 1–8 repeat the 2026-10-03 run, rows 9–13 new (fit proposed by Claude Code, accepted by rithika-sr). sha256 `040293bbfd407933ca1f02e2a554d65157ace79924ad63035c92f66f941619bf`
  - persona `scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json` (fictional Sasha Jones). sha256 `4fc122745895443ce84cac418eed293efced48df0b543deb74206d69422757d3`
  - `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
  - `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/aggregators.json` (14 domains). sha256 `ca1fad9c0a903ae8ab6c32cf85df5d64c1c2668dfc3a28bdc5c5fa5c3c64119b`
  - `--today 2026-10-21`; liveness live via `npm run --silent ats:liveness -- <url>` (Playwright 1.62.1, Chromium), 11 unique URLs
- **Commands:**
  - `python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v` → 41 tests OK
  - `python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out` → exit 0
  - offline fixture run ×2 into `out-offline/` and `out-offline-repeat/` → reports identical
  - `npm run ats:scan -- --dry-run` → first exit 1 (no `data/ats/portals.yml`); after copying the example file (gitignored), exit 0, 1 company scanned, 65 new offers, nothing written
  - `python3 -m json.tool` on both `mode-log.json` files → exit 0
  - independent CSV read for MOLOCO INC vs `mode-log.json` → 200 / 2 / 99.0099 in both
  - `--out-dir /tmp/x` → exit 2, nothing written
  - `curl -sIL https://boards.greenhouse.io/airbnb/jobs/6768605` → 301 → 302 `?error=true` → 302 `careers.airbnb.com/positions/` → 200
- **Outputs:** `course/2026fa/submissions/rithika-sr/mode/worked-run/out/` → `mode-log.json`, `mode-report.md`, `roles.json`, `role-scores.json`, `role-scores.md`; `out-offline/`, `out-offline-repeat/`; terminal transcripts `worked-run/terminal/D1…D7c`.
- **Counts:** 13 roles → 3 scored (Apply 3), 2 CLOSED, 8 HELD (G1 3, G2a 2, G2b 3). Liveness: 5 active, 2 expired, 4 uncertain (11 URLs).
- **G4 result (rithika-sr, 2026-10-21):** Airbnb Staff DS Apply → **Skip** (link lands on Airbnb's all-jobs page: false positive). Figma DS Apply → **Consider** (open; asks for an experienced DS). Moloco DS II Apply → **Apply** (open; mid-level, closest fit). Instacart Meals (Greenhouse) → **Skip** (Senior). Nextdoor Search (Greenhouse) → **Skip** (Senior; Apply button visible though the checker said uncertain: false negative). builtin.com Instacart page: confirmed removed Jun 11, 2025; held correctly. General Catalyst page: loads the Instacart Meals role in a normal browser, so the unlisted-aggregator slip-through risk is real. Full notes: `course/2026fa/submissions/rithika-sr/mode/G4-HUMAN-REVIEW.md`.
- **Open issues:**
  - Checker false positive: a redirect to a job list is reported active (row 5). TODO: final URL must identify the same job.
  - Checker false negative: Greenhouse pages that redirect to a company careers site come back uncertain (rows 10, 11).
  - Aggregator denylist gap: jobs.generalcatalyst.com treated as an employer page (row 13). Held only by a navigation error.
  - Role-level "no sponsorship" text is not checked (row 10; third-party claim, unverified).
  - All three scorer Applies were driven by sponsorship; 0% skip among scored roles.
  - No entry-level DS posting found at any checked sponsor.
  - Malformed candidates JSON exits 1 with a traceback instead of exit 2.
  - CI: `pii-scan` flags an email in `package-lock.json` (upstream), and four harness scripts named in `contrib-gate.yml` do not exist.
