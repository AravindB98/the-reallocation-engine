# Sources and credits

## Executive summary

**What this is.** A list of everything this submission builds on: the project, its rules, its data, and the tools used, including the AI assistant.

**Why read it.** It separates what was reused from what is new, and what the AI did from what the student decided.

**What it says.** All data and the scoring tool come from the existing project. The new code and documents were drafted by an AI coding assistant at the student's direction. The student made the scope, persona, status and labeling decisions and approved each commit.

## Repository and governing documents

- *The Reallocation Engine* (fork of `nikbearbrown/the-reallocation-engine`, base `main` @ `015843d`).
- `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md` (§Zero-Conditions), `recipes/README.md`, `recipes/_shared.md`, `status.md`. Read in full.
- Style models: `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md`, `recipes/scan.md`.
- Course brief: INFO 7375 Fall 2026, "The Reallocation Engine — Recipe Design Assignment".

## Data and code reused

| What | Path | How used |
|---|---|---|
| 80 Days to Stay sponsorship CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | read 5 columns; never copied phone, executive_officers or board_directors |
| Ch.11 role scorer | `scripts/score/role-scorer.mjs` | run as CLI, unmodified |
| Example input | `data/examples/ch11-roles.json` | shape reference + baseline run |
| Fictional persona | `search/examples/priya-nair/` | base persona, read only |
| Repo checks | `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs` | run as-is |

No essay figures (ghost-job shares, referral rates, wage premium) are cited, so none needed tracing.

## Tools

- Node.js v25.8.1 (local), Python 3 (for one hand cross-check of CSV values)
- Claude Code (Anthropic), an AI coding agent, used in this session

## What the AI contributed vs. what the student decided

**AI (Claude Code) contributed:**
- read and summarized the governing docs and quoted the lines relied on;
- found the scorer's fail-open default for missing gates and that it has no exports;
- found the PII-risky CSV columns;
- found the blank-count rows;
- picked the candidate companies from the CSV;
- proposed the tier → p mapping and the binary timeline rule;
- wrote `triage.mjs`, `test.mjs`, the fixtures, the README, the recipe, the card and these documents;
- ran every command whose output is pasted here, including the mutation tests.

**The student decided:**
- the domain and situation, and the two start scenarios;
- the SOC codes;
- persona choice (Priya Nair, adjusted, no new persona file);
- that sponsorship p is labeled your-input;
- that co-op conversion is a data-source TODO, not an invented signal;
- that missing gates must fail before the scorer;
- DRAFT status and `attestation: null`;
- the four CHANGE-BRIEF predictions (written by the student, used word for word);
- replacing "I need" with "the persona needs";
- approval of each commit and push.

**Checked, changed or rejected by the student:**
- Checked:
  - switched the git email from my Northeastern address to the GitHub noreply address before any commit;
  - checked the "private/ not gitignored" warning with `git check-ignore` (a false alarm; the rules are `/private/*`);
  - confirmed upstream was up to date;
  - ran `ats:scan --dry-run` after copying `portals.example.yml`;
  - ran `ats:liveness` (failed: Playwright browser not installed);
  - re-ran the prototype test myself (16/16).
- Changed: the domain from frontend to AI SDE; kept the co-op angle over Priya's OPT framing.
- Rejected:
  - creating a new persona (used Priya Nair);
  - `npm audit fix` (it would touch tracked files);
  - extra workflow files an AI suggested (removed).
- Claude Code wrote most of the code and docs and opened the PR. I reviewed, made the decisions above, and re-ran the test.

See `FRICTIONAL.md` for the session log.
