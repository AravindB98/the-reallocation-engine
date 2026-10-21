## Executive summary

This is the run record for the third screening run on the same 13 real job postings for a fictional international student, Sasha Jones. This version adds a simple rule: a job whose title says senior, staff, lead or similar is set aside as above entry level and is not scored. Read it for the result and its limits. The tool now recommends two postings and agrees with a person's own decisions on four of five reviewed postings, up from two of five. But the rule was written after that person had reviewed the same postings, so this is not proof it works on new ones. One posting still says "apply" where the person said "consider", because its experience requirement is in the description, not the title.

## 2026-10-21 — rithika-sr-ds-h1b-liveness v0.3.0 (Run 3, live, real postings)

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md v0.3.0 (DRAFT, 13 open TODOs).
- **Inputs:** same as Run 2 (candidates `040293bb…19bf`, persona `4fc12274…57d3`, CSV `eccdee2a…6270`, aggregators `ca1fad9c…119b`, ats_hosts `b10e7b7f…c117`), plus `level_rules.json` (new) sha256 `4dc4412823e1bfcc8dbc93366b201bac40c12838965fe7762ca00db02b4abea5`; `--today 2026-10-21`; `--max-level entry`.
- **Commands:**
  - tests → 69 OK; old prototype 17 OK (`terminal/R3-T1-tests.txt`)
  - live run → `out-run3/`, exit 0 (`terminal/R3-D1-live-run.txt`)
  - offline replay of `out-run3/replay-fixture.json` ×2 → reports identical; logs differ only in the out-dir path; replay = live on all 13 roles (`terminal/R3-D2-offline-repro.txt`)
  - `python3 -m json.tool` on `mode-log.json` and `replay-fixture.json` → exit 0
  - Run 1 and Run 2 files fingerprinted before and after Run 3: identical
- **Outputs:** `out-run3/` (`mode-log.json`, `mode-report.md`, `replay-fixture.json`, `roles.json`, `role-scores.*`), `out-run3-offline/`, `out-run3-offline-repeat/`, transcripts `terminal/R3-*`, `worked-run/EVALUATION.md`.
- **Counts:** 13 roles → 2 scored (Apply 2: Figma 0.435, Moloco 0.465), 3 CLOSED, 2 OVER-LEVEL (rows 10 and 11, "title says 'senior'"), 6 HELD {G1 3, G2a 1, G2b 2}. Network: 31 recorded calls: 10 page checks, 15 redirect hops, 6 Greenhouse API; TLS from `/etc/ssl/cert.pem` (`terminal/R3-D3-network-calls.txt`).
- **G4 result:** no new browser review. Against the 2026-10-21 G4 decisions for rows 5, 6, 9, 10 and 11: Run 1 **3/5**, Run 2 **2/5**, Run 3 **4/5** (`worked-run/EVALUATION.md`). Remaining disagreement: row 6 Figma, Apply vs the human's Consider. Run 1's agreement on rows 10 and 11 came from holds caused by a page-checker false negative, not from a seniority judgment.
- **Open issues:**
  - Not a held-out evaluation: the level rule was checked on the same five rows.
  - Description-level seniority not checked (row 6).
  - Sponsorship alone still drives Apply.
  - Role-level sponsorship text unchecked (row 10).
  - Lever, Ashby and Workday have no record check.
  - The allowlist needs an owner.
  - Malformed JSON still exits 1.
