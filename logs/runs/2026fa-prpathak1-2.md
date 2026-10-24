## 2026-10-20 — network-sponsorship-text run 1 (worked run for the Mode Build assignment)

- **Recipe:** recipes/cases/2026fa/prpathak1-network-sponsorship-text.md v0.1.0. Status DRAFT: 6
  open TODOs block SPECIFIED.
- **Branch:** contrib/2026fa-prpathak1-mode-network-sponsorship-text (from upstream main @ 015843d;
  not yet committed at the time of this entry).
- **Mode:** for each public network-engineering posting, the sentences about sponsorship / work
  authorization / clearance, labeled by a human (supported / contradicted / insufficient). Employer
  H-1B history is shown separately.
- **Inputs:**
  - Lever public boards `shieldai`, `zoox`, `palantir` (+ `plaid` as the not-found test);
  - fetched 2026-10-20T17:44:31Z (run 1) and 17:48:28Z (run 2);
  - persona: fictional F-1 master's student, network engineering, pre-OPT, SOC 15-1241;
  - 80 Days CSV company columns only;
  - 32 CFR § 117.10 (eCFR 2026-10-01).
- **Commands:**
  - `scripts/ats/fetch-real-postings.py` (maintained);
  - `fetch_lever_full.py`, `filter_titles.py`, `extract_auth_sentences.py` (contrib);
  - `npm run ats:liveness` (maintained);
  - an 80 Days one-liner.
  - Verbatim in course/2026fa/submissions/prpathak1/network-sponsorship-text/WORKED-RUN.md §1.
- **Outputs:** private/real-postings/, private/network-sponsorship-text/ (untracked); LABELS.md and
  WORKED-RUN.md (tracked).
- **Result:**
  - 7 in-scope postings: 2 contradicted (inferred, required clearance), 5 insufficient, 0 supported.
  - 4 flagged out of scope (software titles); 1 excluded (false friend).
  - Liveness: all 7 in-scope postings active (2 at 13:47, 5 at 14:10 EDT); 1 out-of-scope URL active;
    1 fabricated URL expired (HTTP 404).
- **Gates:**
  - G1 passed (machine).
  - G2 titles and G3 labels cleared by Prathamesh, 2026-10-20 13:57 and 14:01 EDT.
  - G4 liveness cleared (machine check), 14:10 EDT: 7/7 in-scope active.
  - G5 checks: see the submission README.
- **Open issues:**
  - The maintained `schema_validator.py` silently rejects most Shield AI postings (employment type).
  - The maintained Lever scraper drops `lists` / `additionalPlain`.
  - The Greenhouse scraper keeps no body text.
  - No classifier.
  - No title→SOC crosswalk.
  - No separate gate-decision record beyond LABELS.md and this log.
  - The clearance→citizenship step is inferred from 32 CFR § 117.10(k), with an LAA exception.
- **Personal data:** none. Fictional persona; no 80 Days personal columns; nothing from data/ats/.
