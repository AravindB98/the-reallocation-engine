# Sources and contributions

## Executive summary

**What this is.** Credits for everything this mode build relies on, and a plain account of what the AI assistant did versus what I (EthanGomes14) decided, checked, changed or rejected.

**Why read it.** So a reviewer can tell borrowed material from new work, and AI output from human judgment.

**What it says.** Most of the material comes from the instructor's repository: the data, the scorer, the liveness checker and the governing rules. The starting code was my own sponsor screen at v0.4.0. Claude (Claude Code) wrote the new code and documents in sessions I directed.

The decisions were mine:
- the fit floor;
- the Purpose section;
- every human gate: which company names to accept, which job links to trust, my timeline, and reading the reports;
- whether to publish.

---

## Starting point

| Source | What was used | Changed? |
|---|---|---|
| The Reallocation Engine, `github.com/nikbearbrown/the-reallocation-engine` @ `015843d` (forked to `EthanGomes14/the-reallocation-engine`) | The whole repo as the base | Only new files in my namespaces |
| My sponsor screen v0.4.0 (`scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/`, recipe and card in `recipes/cases/2026fa/`), commit `dbac7a2` | The starting code this build extended | Yes: v0.5.0 and v0.5.1 (see `CHANGE-BRIEF.md`) |
| `SNICKERDOODLE.md`, `DOMAIN.md`, `AGENTS.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `recipes/README.md` | Governing rules, lifecycle, attestation format, labels, run-log rules, privacy rules, where files go | No |
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (80 Days to Stay; 30,369 rows, sha256 `eccdee2addf4`) | Sponsorship records | No (read-only) |
| `scripts/score/role-scorer.mjs` (`npm run score`) | The scorer, called through its CLI | No |
| `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) | Posting liveness, run 2026-10-20 and 2026-10-21 | No |
| `scripts/conformance.mjs`, `scripts/manifest-check.mjs` (`npm run verify`), `scripts/doctor.mjs` (`npm run doctor`), `scripts/pii-scan.mjs` | Checks | No |
| Assignment brief: INFO 7375, "The Reallocation Engine — Mode Build Assignment" | Requirements and rubric | — |
| Public Greenhouse job-board API, `boards-api.greenhouse.io` | Discovery of postings (2026-10-20) and the job-exists cross-check (2026-10-20, 2026-10-21) | — |
| Web search (Google), by me, 2026-10-21 | Checking the legal names behind four aliases for gate G1 | — |
| 8 CFR 214.2(f)(10)(ii)(E) | The 90-day OPT unemployment limit used in the persona's timeline. Cited from general knowledge, not re-verified in this build | — |

No other students' work and no human collaborators were used.

## Tools

- **Claude (Claude Code, model Claude Opus 5.5).** Repo research, code, tests, documents, running commands.
- Node.js v25.8.0, Python 3.9.6 (an independent CSV cross-check, `assignments/submissions/ethangomes14/runs/verify-against-csv.py`), git 2.54.0.

## What the AI contributed

- **2026-10-20, v0.5.0:**
  - built the discovery script, the alias table and its matching, the posting-age flag and the fit-floor rule;
  - proposed the four aliases;
  - rated the fit of the 19 postings (labelled `model-judgment`);
  - chose the 37 boards to ask, 14 of which were wrong guesses;
  - found the sales-job leak in the title rule and fixed it;
  - found that fit had no effect for Proven sponsors and logged it as a decision for me;
  - ran every command in the worked run and the six break attempts.
- **2026-10-21:**
  - checked the submission against each part of the assignment and the rubric;
  - added the full `verify` output and corrected the break count;
  - captured the missing discovery break attempt.
- **Gates:** listed what each gate needed a person to check, then recorded my answers as I gave them (asking how I'd checked the names, and what I had found out about the long-open postings).
- **The live run:** re-checked liveness and the Greenhouse API and ran the live screen. It found and fixed the UTC date bug and the hardcoded run type, and froze the pre-review alias file. Tests went to 23.
- **Paperwork:** wrote the attestations from re-runs on the final files, including file hashes. Drafted every document in this folder, including the reflection in `FRICTIONAL.md`, for me to review.
- **Pronouns:** it wrongly referred to me as "he" in some records, then corrected that to my name or neutral wording.

## What I decided, checked, changed or rejected

- **Decided:**
  - the fit floor of 0.4 (2026-10-20);
  - to add an explicit Purpose section to the recipe;
  - to have the attestation signed by me after my own re-run;
  - to accept all four aliases;
  - to record the three long-open postings as "unknown, not acting on them";
  - to keep the status at RUNNABLE-LIVE, on Claude's advice, with the open-TODO caveat stated;
  - to hold all GitHub publishing until I say so;
  - to rewrite every submission document for this assignment.
- **Checked myself:**
  - re-ran the reproduce commands on my laptop and read the 2026-10-20 report;
  - checked each alias's legal name with a Google search (G1), and confirmed the six exact matches;
  - opened all 18 "active" job links from the report; each shows its job (G2);
  - confirmed the persona's timeline inputs (G3);
  - read the live report (G4).
- **Asked Claude to explain before acting:** the open TODO, what G1 and G2 are, how to close them, where to find them, and which status is best.
- **Changed from Claude's first answer:**
  - I asked for the mode file to be in `recipes/`. Claude explained it already is (`recipes/cases/2026fa/`, the repo's required place for student recipes), and I accepted that.
  - I asked for the frictional log to cover only this assignment.
- **Rejected:** nothing on this build.
- **Still open for me:**
  - whether the three long-open postings are being filled;
  - a stronger legal-name check than a search (especially Unite Us, whose sponsor-file website is `unite-usa.com`);
  - Node 20.

I am responsible for everything submitted here and can be asked to explain any gate, number or line.
