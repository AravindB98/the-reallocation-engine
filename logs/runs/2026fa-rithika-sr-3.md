## Executive summary

This is the run record for the second screening run on the same 13 real job postings for a fictional international student, Sasha Jones. This version checks each employer's own job record and follows every redirect. Read it for what changed and what it cost. The first attempt failed completely on a missing security-certificate setting and scored nothing. After that was fixed, the run correctly closed the job whose link had landed on a company's all-jobs page, and correctly found an open job the page checker had missed. It also held a link from an unknown job board. But it recommended two senior roles that a person had already decided to skip, so it agreed with the person's decisions less often than the first run.

## 2026-10-21 — rithika-sr-ds-h1b-liveness v0.2.0 (Run 2, live, real postings)

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md (v0.2.0 at run time; DRAFT).
- **Inputs:**
  - `course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json` (13 rows, unchanged from Run 1). sha256 `040293bbfd407933ca1f02e2a554d65157ace79924ad63035c92f66f941619bf`
  - persona (fictional Sasha Jones). sha256 `4fc122745895443ce84cac418eed293efced48df0b543deb74206d69422757d3`
  - sponsorship CSV. sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
  - `aggregators.json`. sha256 `ca1fad9c0a903ae8ab6c32cf85df5d64c1c2668dfc3a28bdc5c5fa5c3c64119b`
  - `ats_hosts.json` (new, 10 domains). sha256 `b10e7b7f8250699784f900fff7d443bf99730a789a2fe3b98e5a565a6a26c117`
  - `--today 2026-10-21`
- **Commands:**
  - tests → 54 OK; old prototype 17 OK (`terminal/R2-T1-tests.txt`)
  - live attempt 1 → `out-run2-attempt1-no-ca/`: **failed**. All 13 `urllib` calls (7 redirect hops, 6 Greenhouse API) failed with `CERTIFICATE_VERIFY_FAILED`, because the python.org Python 3.14 build has no CA certificates. The 10 page checks worked. Result: 0 scored, 1 closed, 12 held {G1 3, G2a 5, G2b 4} (`terminal/R2-D1a-live-run-no-ca.txt`; its header names `out-run2` because the folder was renamed after the run).
  - fix: `ats_record.ssl_context()` falls back to the macOS bundle `/etc/ssl/cert.pem` (128 CA certificates), verification on. One manual smoke call, `GET https://boards-api.greenhouse.io/v1/boards/moloco/jobs/7985823003` → 200, outside any log.
  - live run → `out-run2/`, exit 0 (`terminal/R2-D1-live-run.txt`)
  - offline replay of `out-run2/replay-fixture.json` ×2 → reports identical; logs differ only in the out-dir path; replay = live on all 13 roles (`terminal/R2-D2-offline-repro.txt`)
  - `python3 -m json.tool` on `mode-log.json` and `replay-fixture.json` → exit 0
- **Outputs:** `out-run2/` (`mode-log.json`, `mode-report.md`, `replay-fixture.json`, `roles.json`, `role-scores.*`), `out-run2-offline/`, `out-run2-offline-repeat/`, `out-run2-attempt1-no-ca/`, transcripts `terminal/R2-*`.
- **Counts:** 13 roles → 4 scored (Apply 4), 3 CLOSED, 6 HELD {G1 3, G2a 1, G2b 2}. Network: 31 recorded calls: 10 page checks, 15 redirect hops, 6 Greenhouse API (`terminal/R2-D3-network-calls.txt`).
- **Key rows:**
  - row 5 Airbnb Staff: Apply → CLOSED (ATS 404).
  - row 11 Nextdoor: HELD → Apply (ATS 200; checker said uncertain).
  - row 10 Instacart Meals: HELD → Apply.
  - row 13 General Catalyst: held by the allowlist, never fetched.
  - row 12 fake Moloco id: CLOSED (ATS 404).
- **G4 result:** no new browser review. Against the 2026-10-21 G4 decisions for rows 5, 6, 9, 10 and 11, Run 2 agreed on **2 of 5** (Run 1: 3 of 5). Rows 10 and 11 were Skip for the human (Senior) but Apply here.
- **Open issues:** Senior roles reach Apply once liveness is right (→ level gate in v0.3). Row 10 title-mismatch flag is noise from "(US remote)". Only Greenhouse has a record check. Sponsorship alone still drives Apply. Role-level sponsorship text unchecked.
