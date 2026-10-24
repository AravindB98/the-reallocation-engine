# SOURCES — data-titles-h1b-entry

## Executive summary

**What this is.** A list of every source behind this submission: the project documents that set the rules, the data the tool reads, the existing code it reuses unchanged, the tools used to build it, and a breakdown of who did what, the student or the AI assistants.

**Why read it.** It shows a reviewer where each fact and each piece of work came from. It also keeps the student's own decisions and checks separate from what the AI drafted or ran.

**What it shows.**
- The tool reads two public data files that ship with the project. Its scoring uses the project's existing engine without changes.
- No other people collaborated.
- Most drafting, code and reports were produced by AI assistants. The student made the scope, status and gate decisions, ran her own hand checks and break attempts, wrote her reflection, and supplied the estimates and failure-mode ranking.
- Anything not documented as hers is marked for her to confirm, not assumed.

---

## Repository and governing documents used

| Path | Used for |
|---|---|
| `SNICKERDOODLE.md` | Principles, verification stack, recipe lifecycle, TODO closure, attestation format |
| `DOMAIN.md` | Layout, runnable commands, known gaps |
| `CONTRIBUTING.md` | Where contributions go, branch discipline, privacy contract, engine API |
| `DATA_CONTRACT.md` | Data layers; §Zero-Conditions (no real personal data) |
| `recipes/README.md` | What a recipe is |
| `recipes/cases/README.md` | Case-recipe location and promotion rule; "honest frontmatter is graded" |
| `recipes/_shared.md` | Shared recipe contract, phase gates, run-log template |
| `recipes/scan.md` | Style reference (recipe structure) |
| `recipes/local-wage-adjustment.md` | Style reference (RUNNABLE-SAMPLE recipe) |
| `recipes/local-wage-adjustment.card.md` | Style reference (human card) |
| `recipes/cases/2026su/*.md` | Convention reference for case-recipe frontmatter (`last_gate: null`) |
| `book/chapters/02-the-reallocation-principle.md` | The 3-3-2 day (line 39) |

## Data

### Used

| Data | Path | Provenance as stated in the repo |
|---|---|---|
| 80 Days to Stay sponsorship CSV (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`. This equals the hash recorded for `SEC_DOL_H1b_data_mapped.csv` in `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`; that file is absent from the repo. `data/80-days-to-stay/README.md` line 13 names the sources as DOL LCA Disclosure Data and the USCIS H-1B Employer Data Hub. No year or date range is given for the approval/denial counts. `DATA_CONTRACT.md` classes `data/80-days-to-stay/` as upstream source data. |
| BLS/O*NET compact occupation table (1,016 rows) | `data/bls/compact/soc_occupation_compact.csv` | `oews_year` is 2024 in every row; national wages only. `DOMAIN.md` lists it as a compact extract under `data/bls/`. Used as report context only; not scored. |

### Examined and excluded

| Data | Path | Reason (source) |
|---|---|---|
| SEC Form D samples (4 files × 50 records) | `data/sec/form-d/processed/sample/` | Excluded for three reasons (`recon/probe/PROBE-REPORT.md` §C; `recon/REALITY-REPORT.md` §5b–5c): 128 of 200 records are pooled investment funds; each file covers only the last filing day of its quarter; and only 14 names match the 80 Days CSV after normalization, of which 1 (Databricks) has sponsorship data. |

## Code reused unmodified

| Code | How |
|---|---|
| `scripts/score/role-scorer.mjs` | Called through `npm run score -- <roles.json> --out-dir <dir>` as a subprocess. It is never copied or re-implemented. |
| `scripts/conformance.mjs` | Syntax and well-formedness checks (`node scripts/conformance.mjs <paths>`, `npm run verify`). |
| `scripts/pii-scan.mjs` | Privacy scan, full tree and `--diff origin/main`. |
| `scripts/sec/sec-all-quarters.py` | Its `COMPANY_SUFFIXES` list is read with Python's `ast`. The script itself is not executed. |
| `scripts/doctor.mjs`, `scripts/manifest-check.mjs` | Through `npm run doctor` and `npm run verify`. |

## Tools

- **Claude Code:** the agent that ran commands and wrote code and reports.
- **Claude in claude.ai chat:** planning, critique, drafting.
- **Python 3.9.6 standard library:** no pip packages in the prototype. PyYAML 6.0.3 was installed for system `python3` only so `npm run verify` could run (`FRICTIONAL.md` line 10).
- **Node, npm, git.**
- **macOS Terminal and TextEdit:** `open -e`, because `code` was not on the PATH (`FRICTIONAL.md` line 37).

## Collaborators

None.

## Human vs AI contributions

"AI did" is filled only from the files and commit messages. "Meena did" is filled only from what `FRICTIONAL.md` (including its ME (Meena) lines), `WORKED-RUN.md`, the run log and `recon/hand-checks.txt` document as hers; line numbers refer to `FRICTIONAL.md` unless noted. All branch commits list `meenuviji` as git author (`git log origin/main..HEAD`). Commit 53cc80a was run by Claude Code at Meena's instruction; Meena ran every later commit herself in Terminal (3f1182e, 47a5b79, e93e817, 631acbe, 4a4074e, 1405bc1, ee8a77b, 323573e, and the final-audit fix commit).

| Artifact | AI did | Meena did |
|---|---|---|
| REALITY-REPORT / PROBE-REPORT / PROTOTYPE-PLAN | Claude Code ran the Phase 0 commands and wrote REALITY-REPORT (l.15). Claude (chat) proposed the domain and wrote the probe spec (l.33). Claude Code wrote and ran the probe (PROBE-REPORT) and wrote PROTOTYPE-PLAN before any code (l.59). Claude Code changed the suffix-stripping order, citing `sec-all-quarters.py:34` (l.34). Claude (chat) recommended answers to the plan's 15 questions plus two more (l.67). | Verified the CSV and read the files the report cited (l.18). Supplied the situation and target titles (l.22). Checked the COSTCO normalization claim and accepted it (l.35). Agreed with the domain choice (l.36). Accepted all 17 recommendations unchanged (l.68). Recon commit 1405bc1: ran this git commit herself in Terminal. |
| CHANGE-BRIEF | Claude (chat) drafted the full brief from the recon and probe reports; the §9 predictions are Claude's draft (l.43–45). Claude (chat) caught the formatting loss (l.53). Claude Code appended the Revision 1 and 2 text as given in Meena's instructions. | Asked Claude to complete the skeleton; kept it as drafted, including the ≥5 approvals cutoff, the p values and "unmarked = entry" (l.43–45). Instructed Claude Code to commit 53cc80a (Claude Code ran that commit); ran every later commit (3f1182e onward) herself in Terminal. Ran grep to confirm the lost headers; the fix was committed as 3f1182e (l.53–54). Stated the Feb–Mar 2027 OPT start used for `opt_start` (l.83). Revisions 1–2 commits (47a5b79, 631acbe): ran these git commits herself in Terminal. |
| Prototype code and tests | Claude Code built the prototype and tests, and changed output paths to repo-relative (l.73). Claude (chat) reviewed it and found the timeline, sampling, persona and ENTRUPY problems (l.74–78). Claude Code changed the sibling-note test assertion (l.89) and found the PATHAI/PATHRAI duplicate (l.88). | Did not tune p values to raise the skip rate (l.87). Read the changed test and agreed it is not a loosening (l.90). Prototype commit e93e817: ran this git commit herself in Terminal. |
| Recipe and card | Claude (chat) instructed RUNNABLE-SAMPLE (l.96). Claude Code drafted both files, flagged the lifecycle conflict (l.97), corrected "four" to seven open TODOs (l.100), and added the recency evidence (l.102). | Chose DRAFT (l.99). Recipe commit 4a4074e: ran this git commit herself in Terminal. |
| TEST-REPORT | Claude Code ran the fresh-clone test and wrote the report, and disclosed its redaction of a third-party address (l.111–116). | Requested the fresh-clone test and reviewed its summary; did not run the fresh-clone commands herself (Claude Code ran them in /tmp/fresh-reallocation). Submission-docs commit 323573e: ran this git commit herself in Terminal. |
| WORKED-RUN | Claude Code assembled it from source files (l.128). Claude (chat) pushed back on the location point and added one sentence linking to the duplicate-scan TODO (l.129). | Wrote the reflection text (WORKED-RUN.md, "Written by Meena (meenuviji)"; l.129). Ran the ROKU INC cross-check against the raw CSV (`recon/hand-checks.txt` lines 1–10; l.121). Ran two break attempts: `R0KU INC` and liveness removed (`recon/hand-checks.txt` lines 11–26; l.122–124). |
| DOMAIN-JUSTIFICATION | Claude (chat) drafted it from Meena's answers (l.130). Claude Code created the file and applied two wording edits on instruction. | Supplied the estimates (10–15 min per company, 15–20 companies a week) and the failure-mode ranking (the seniority trap worries her most) (l.130). |
| Run log (`logs/runs/2026fa-meenuviji-1.md`) | Claude Code wrote the entry and its executive summary from TEST-REPORT.md and Meena's decisions. | Made all three gate decisions and wrote their reasoning, quoted verbatim as hers in the run log (l.131–134). Named reviewer. Run-log commit ee8a77b: ran this git commit herself in Terminal. |
| FRICTIONAL | Claude drafted it from the conversation record and recorded Meena's answers as ME (Meena) lines (l.3, l.46). | Gave the answers recorded as ME (Meena) lines (l.3). Completed the 22-question self-quiz (l.139). Wrote "What I learned" (l.143). |

## What AI contributed vs what I decided, checked, changed, or rejected

- **Decided:** the domain (agreed with Claude's proposal, l.36). DRAFT instead of RUNNABLE-SAMPLE (l.99). All three gate decisions in the run log (l.131–134).
- **Accepted without change:** the AI-drafted CHANGE-BRIEF, including the §9 predictions, which are Claude's draft (l.45). All 17 recommended answers to the prototype plan (l.68).
- **Checked:**
  - the CSV and the files cited in recon (l.18);
  - the COSTCO normalization claim (l.35);
  - the lost CHANGE-BRIEF headers, by grep (l.53);
  - the changed sibling-note test (l.90);
  - ROKU INC against the raw CSV (`recon/hand-checks.txt`);
  - two deliberate break attempts (`recon/hand-checks.txt`).
- **Rejected:** tuning the p values to raise the skip rate, because "that would be adjusting rules to the outcome" (l.87).
- **Changed through revisions:**
  - the timeline rule (early start becomes a deferred start; CHANGE-BRIEF Revision 1, 47a5b79);
  - `opt_start` set from the stated Feb–Mar 2027 start (l.83);
  - the headline counts recomputed as 248 / 94 / 39 (CHANGE-BRIEF Revision 2).

  Who initiated these: the review findings are attributed to Claude (chat) (l.74–78); Claude (chat) proposed each revision; Meena approved them by running the instructions. `opt_start` came from her stated Feb–Mar 2027 start. She did not originate the revisions herself.
- **AI corrected AI:**
  - Claude Code flagged Claude (chat)'s RUNNABLE-SAMPLE instruction (l.97).
  - Claude Code corrected Claude (chat)'s "four proposed additions" (l.100).
  - Claude Code's branch-name report was out of date (l.69).
- **Not written in advance:** Meena wrote no predictions before her own checks. The attestation's Expected column cites specified behavior instead (l.126).
- **What I learned:** recorded in her words at l.143.
