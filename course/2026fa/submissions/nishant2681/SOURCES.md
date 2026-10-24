Drafted by Claude Code from FRICTIONAL.md and the repository; reviewed by Nishant. Date: 2026-10-02.

# Sources and contributions — nishant2681-data-analytics-opt-h1b

## Executive summary

This page lists everything the submission was built from: the project's own
rules and code, the data, a few outside web sources, and the tools used. It
also says honestly which parts AI produced and which parts Nishant decided,
checked or did by hand.

Most numbers come from data inside the repository. The few outside sources
were found by an AI chat assistant, are secondhand, and are labeled that way.
AI wrote most of the text and code. Nishant made every design decision, ran
every test and live check personally, caught several AI mistakes, and signed
the human checks.

## Run record

- The AI-vs-human table (§7) is based on `FRICTIONAL.md`, the dated work log,
  and cites its entry numbers.
- Where an item isn't recorded in FRICTIONAL, it is marked **"not logged"**,
  meaning it is Nishant's statement only.
- §3's "used, not changed" was checked with `git diff main...HEAD` on those
  script paths (no changes).

## 1. Repository and governing documents

- **Repository:** `nikbearbrown/the-reallocation-engine`, forked as
  `Nishant2681/the-reallocation-engine` (FRICTIONAL 1). Branch:
  `contrib/2026fa-nishant2681-data-analytics-opt-h1b`.
- **Governing documents:** `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`,
  `DATA_CONTRACT.md`, `recipes/README.md`, `recipes/_shared.md`,
  `recipes/scan.md`, `recipes/local-wage-adjustment.md` and
  `recipes/local-wage-adjustment.card.md`.
- **Book chapters** (`book/chapters/`):
  - `02-the-reallocation-principle.md` (the 3-3-2 day)
  - `07-who-sponsors-the-80-days-sponsorship-scorer.md` (sponsorship tiers)
  - `10-the-visa-timeline-manager.md` (the timeline gate)
  - `11-the-bayesian-role-scorer.md` (the scorer)
- **Related case:** `recipes/cases/2026su/case-data-ml-h1b-triage.md`. It is a
  generic scaffold; this recipe keeps a narrower scope (FRICTIONAL 15).

## 2. Data

| Data | Path | Nature |
|---|---|---|
| 80 Days to Stay company/H-1B file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Real. 30,369 companies, 1,557 with H-1B records (FRICTIONAL 7). Built from SEC Form D filers (`data/80-days-to-stay/README.md:13,170`) |
| Persona | `search/examples/priya-nair/profile.yml` | **Fictional** |
| Scorer input shape | `data/examples/ch11-roles.json` | Repo example, used as a template |
| Prototype fixtures | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/` | **Fictional** jobs at **real** CSV company names, `example.com` URLs. The 10-row CSV sample is copied from real rows with only 8 sponsorship/funding columns |

## 3. Repository code used, not changed

- `scripts/score/role-scorer.mjs`: the Ch.11 scorer, called as a CLI (it runs
  on import; FRICTIONAL 9).
- `scripts/ats/check-liveness.mjs`: the live posting checker (FRICTIONAL 19).
- `scripts/conformance.mjs`, `scripts/manifest-check.mjs`, `scripts/doctor.mjs`
  and `scripts/pii-scan.mjs`: the checks (FRICTIONAL 2–4, 23).

## 4. External sources

These were found by Claude chat via web search. **None is primary government
data.**
- **Wayfair H-1B sponsorship:** ellis.com, layoffhedge.com and f1jobs.io.
  - These sites aggregate DOL LCA and USCIS data; the government files
    themselves were not checked.
  - Used only as an outside check, and labeled as such (FRICTIONAL 20).
- **Time estimate** (FRICTIONAL 24):
  - unitedwaynca.org 2026 survey, ~44 min per application (background only);
  - CareerBuilder 2016 Candidate Behavior Study (background only);
  - scoutify.com citing a 2024 Interstride survey, ~40% extra time
    (secondhand; the primary source was not checked).
- **Live postings checked** (FRICTIONAL 19; `engine-runs/`):
  - a TouchCare posting on `job-boards.greenhouse.io`;
  - a closed Affinity (affinity.co) posting on `talent.swayvc.com`.

## 5. Tools

- Claude (chat) and Claude Code, by Anthropic.
- Git Bash on Windows (FRICTIONAL 1).
- Python 3.12.10 with PyYAML, and Node v22.17.1 (FRICTIONAL 2).
- Playwright, through the repo's liveness checker (FRICTIONAL 19).

## 6. Collaborators

No human collaborators.

## 7. What AI contributed vs what Nishant did

| Item | AI | Nishant: decided / checked / changed / rejected | FRICTIONAL |
|---|---|---|---|
| Explaining the assignment, planning steps, writing prompts | Claude chat | used them | **not logged** |
| Shell commands and command blocks | Claude chat | ran them; switched to Git Bash after cmd errors | 1, 19, 23 |
| Sponsorship tier/p, funding-as-context, fit, liveness and timeline rules | Claude chat proposed | **decided**: accepted all five; set a per-role hiring lag (default 12 weeks) | 10, 11 |
| Target titles | Claude chat proposed 5 | **changed**: added Business Analyst, Business Intelligence, Automation Analyst | 8 |
| Web research (Wayfair sponsorship, time figures) | Claude chat | **checked**: knew from experience that Wayfair sponsors; replaced the 44 min with own 25–30 min per application | 20, 24 |
| Threshold, liveness and STRONG_FIT reasoning | Claude chat drafted | reviewed; quoted exactly and labeled | 20 |
| Prediction wording | Claude chat drafted, with a disclosure label | reviewed; kept the label; based on own grep results | 13 |
| `00-terminal-history.txt` | Claude chat assembled, with redactions | supplied the terminal output; reviewed | 23 |
| Repo review | Claude Code (read-only) | skimmed the findings before committing | 9 |
| CHANGE-BRIEF, recipe, card | Claude Code wrote, from Nishant's decisions | approved each file (recipe/card in plan mode) | 15; brief header |
| Prototype and tests (sponsorship, gates, run_sample, report; 45 tests) | Claude Code wrote | **decided** behaviors: title match + 0 approvals → error; `null` OPT end; whole-week lags; lowercase labels | 16–18, 21 |
| TEST-REPORT, domain justification, worked run | Claude Code drafted from saved evidence | reviewed; signed the attestation | 23–25 |
| Errors found by AI | Claude Code: approval-rate scale; timeline rule; SPECIFIED needs zero TODOs; missing-file test gap; the bracketed-notes attribution; full-name privacy risk | **decided**: DRAFT; keep TODO #6 open until tested; sign with the GitHub handle; fix the attribution | 11, 15, 20, 22, 25 |
| Data checks | — | **did**: grep Wayfair (absent) and Deloitte (7); **noticed** the bad `cut` output and re-ran with a CSV parser | 12 |
| Stress tests | — | **decided**: kept Deloitte and Wayfair; did not tune fixtures to hit 50% skip | 18 |
| Fresh-clone, liveness and hand checks | Claude chat suggested commands | **did**: ran every fresh-clone and liveness command; chose the URLs; CSV hand check; hand-recomputed 0.555 | 19, 23, 25 |
| Gate sign-offs | Claude Code wrote the run log | **checked and signed** G1, G3, G4 (Deloitte pick, liveness labels, Nov 27 deadline) | 22 |
| Approving plans and edits | — | approved every plan and edit | 15 (files); otherwise **not logged** |
| PII claim about the npm email | Claude chat said the file was "fine to commit" | **questioned it** (it was wrong); redacted; re-ran the CI scan: clean (`test-report-evidence/12-pii-scan-diff-after-commit.txt`) | 23, 25 |

**Rejected or not followed:**
- `build-instructions.mjs --promote`: it would edit tracked files outside the
  namespace (FRICTIONAL 3).
- `npm audit fix`: it would change `package-lock.json` (FRICTIONAL 23).
- Tuning fixtures to reach a 50% skip rate (FRICTIONAL 18).

**AI mistakes caught:**
- Approval rate ≥ 0.90 on a 0–100 column (Claude chat; caught by Claude Code;
  FRICTIONAL 11).
- Timeline "OPT start + 90 days" (Claude chat; caught by Claude Code;
  FRICTIONAL 11).
- `cut -d,` on a quoted CSV (Claude chat; caught by Nishant; FRICTIONAL 12).
- The "safe to commit" claim about the npm email (Claude chat; caught by
  Nishant; FRICTIONAL 23).
