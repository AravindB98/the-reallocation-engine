# SOURCES

## Executive summary

Credits for everything this submission builds on — the course repository and its rules, the data files, the scorer — and a plain statement of what the AI assistant produced versus what I decided, checked and changed.

## Starting point

- **Repository:** [nikbearbrown/the-reallocation-engine](https://github.com/nikbearbrown/the-reallocation-engine), forked at upstream commit `015843d` ("fix(greenhouse-watch): justification lines now sum to the score").
- **Governing documents read and followed:** `SNICKERDOODLE.md` (lifecycle, gates, attestation format, executive-summary rule), `DOMAIN.md` (Known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, one PR, no scorer re-implementation), `DATA_CONTRACT.md` (zero-conditions), `recipes/_shared.md` (run-log template), `recipes/local-wage-adjustment.md` and `.card.md` (style of the recipe and card).
- **Assignment:** `assignments/assignment-reallocation-engine-recipe-design.md` in [nikbearbrown/info-7375-prompt-engineering-for-generative-ai](https://github.com/nikbearbrown/info-7375-prompt-engineering-for-generative-ai); course AI policy `prerequisites/ai-policy.md` and `frictional/06-ai-and-honest-disclosure.md` in the same repo.

## Data (read, never modified)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — 80 Days to Stay (Humanitarians AI). SEC Form D funding joined to H-1B approvals/denials. Its audit, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`, notes the join does not prove entity resolution.
- `data/bls/compact/soc_occupation_compact.csv` — BLS OEWS 2024 national wages + O*NET ability/skill levels, compacted in the repo.
- `data/sec/form-d/processed/sample/*.sample.json` — SEC Form D, four quarterly samples (first 50 companies each).
- Test fixtures under `scripts/contrib/…/fixtures/` copy four real CSV rows (phone and officer/director columns blanked), one BLS row, and add invented rows (ACME DATA INC/LLC).

## Code reused

- `scripts/score/role-scorer.mjs` — called as a CLI child process, unmodified. Not copied.
- Liveness output format taken from `scripts/ats/check-liveness.mjs` (not called in the sandbox run).

## Tools

- **Claude (Anthropic), Opus 5.5**, via claude.ai with a Linux sandbox, 2026-09-30 to 2026-10-02.
- **ChatGPT (OpenAI)**, 2026-10-02: used to rewrite my run-log entry. That draft contained two factual errors (it called the scorer's decisions "model output" and the 80-Days CSV "sample data"). It was replaced with a corrected version, and none of its text is in the submission.
- Node.js 22.22.2 and Python 3.11.15 in the sandbox; Node v26.9.0 and Python 3.14.7 on my Mac (macOS 26.2) for my own runs. PyYAML 6.0.2 installed by hand on the Mac.

## What the AI contributed vs. what I did

**Claude (AI) produced:** the prototype code (`lib.mjs`, `opt-countdown.mjs`), the test file and fixtures, the example persona inputs, the recipe and card, CHANGE-BRIEF.md, DOMAIN-JUSTIFICATION.md, WORKED-RUN.md, TEST-REPORT.md, the run-log entry, and the first entry of FRICTIONAL.md. It ran every command recorded as run on 2026-09-30, found the even-count pattern and the keyword over-match, and fixed four of its own bugs (listed in WORKED-RUN.md).

**Claude also (2026-10-01 to 10-02):** walked me through running everything on my Mac and fixing the PyYAML problem; corrected the run log ChatGPT had written; implemented the v0.1.1 analyst-title fix and its test **at my request**, after my Figma hand check; drafted the factual parts of FRICTIONAL entries 2–4, the Mac sections of TEST-REPORT and WORKED-RUN, and my attestation table from my own terminal output.

**I (Anisha) decided:** the situation the tool is built for (my degree, my May 2027 graduation, BI-analyst target roles) and which recipe idea to build.

**I ran:** every command recorded as run on my Mac (2026-10-01/02), including the PyYAML fix and the Figma `grep` hand check.

**I checked / changed / rejected:**
- Re-ran everything on my own Mac. The v0.1.0 and v0.1.1 results matched the sandbox.
- Fixed the PyYAML problem on my Mac (with Claude's guidance).
- Checked Figma's row in the CSV by hand. The numbers matched, but none of its titles was an analyst job, which led to the v0.1.1 fix.
- Ran the break test (`--as-of 2027-09-15`) and confirmed no output was written.
- Rejected ChatGPT's version of my run log, because it mislabeled the scorer's decisions and the data.
- Kept Claude's v0.1.1 code change without editing it.
- Have not yet reviewed the default thresholds or put in my real I-20 dates.
