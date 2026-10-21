# Run log — healthins-ai-opt v0.2.0, real-data runs (2026-10-20)

## Executive summary

The insurance and health applied-AI triage tool was run for the first time on real job boards instead of invented postings. It read 32 public boards (1,729 openings), kept the nine that a new graduate on OPT could plausibly pursue, confirmed all nine were still open by loading each in a browser, and handed them to the repository's scorer. None earned "apply now"; eight are "talk to someone first" and one is "skip" (two of the eight would have been "apply now" on the scorer's own rule; a fit floor added after the first run held them back). Reading the real postings exposed two bugs in the tool's own experience-screen, both fixed. The repository's scanner and the tool agreed on the number of openings, and a fresh run reproduced the committed outputs byte for byte. A second agent then reviewed the package and found claims that went beyond what was recorded (notes stated from memory as fact, an unsupported account of how boards were found, a stop condition the code did not enforce); they were corrected and the decision step was re-run from the same snapshot with identical decisions. Several repository behaviours that block a fresh clone or mislead were found and logged, not changed.

## 2026-10-20 — engine baseline (setup)

- **Environment:** node 24.21.0, Python 3.14.6 in a throwaway venv with PyYAML, Playwright Chromium already installed.
- **Commands and results:**
  - `npm run verify`: fails on this machine until PyYAML is on PATH (`manifest-check` runs `python3 -c "import yaml…"`); with it: conformance 171 files pass, manifest check passes with 3 upstream warnings. CI installs `pyyaml`, so this is the environment.
  - `npm run doctor`: all green; no private path tracked. (It counts open TODOs only in the top level of `recipes/`, so this recipe's `todos_open: 8` was counted by hand: 8 markers in the body.)
  - `npm run score:gates`: PASS (10 baseline cases, negative control caught by 5 assertions).
  - `python3 scripts/ats/detect-ats.py` over the 105 Proven and Likely in-sector sponsors: 8 found (7 Greenhouse, 1 Lever), 97 not. Hand probing found more the detector cannot (Ashby is unsupported; Clarify sits on Lever under another slug).
  - `REALLOCATION_ENGINE_PORTALS=…/portals.healthins.yml npm run ats:scan -- --dry-run`: 32 companies, 1,729 jobs, nothing written.
  - `npm run ats:liveness -- <5 urls>`: 3 active, 2 expired (a Greenhouse redirect to `?error=true`, an Ashby "job not found"); exit 1 by design.
  - `npm run score -- data/examples/ch11-roles.json`: Cambridge biotech 0.4462 Apply, non-sponsor 0.1785 Skip, as DOMAIN.md documents.
  - `python3 scripts/sec/refresh-recent-sec-quarters.py`: fails (`No module named 'pandas'`, listed in `scripts/sec/requirements.txt`); it would then stop because the quarters must first be downloaded with an SEC identity.
- **Open issues (logged, not changed):** the SEC refresh and `verify` need setup a fresh clone does not have; the detector's coverage; `npm run` masks UUID-like URL segments in its own echo line.

## 2026-10-20 — healthins-ai-opt real run

- **Recipe:** recipes/shreyashyadav1-healthins-ai-opt.md v0.2.0 (DRAFT)
- **Inputs:** persona `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json` (fictional); portals `…/inputs/portals.healthins.yml` (32 boards); `--today 2026-10-20`; data: 80 Days CSV (30,369 rows, newest funding date 2025-09-26), Form D samples (4 files × 50 companies), BLS compact; boards fetched 2026-10-20.
- **Commands:** `node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs`, then `node …/run.mjs --today 2026-10-20 --candidates assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json --out-dir assignments/submissions/shreyashyadav1/runs/2026-10-20`.
- **Outputs:** `assignments/submissions/shreyashyadav1/runs/2026-10-20/{candidates.snapshot.json, roles.json, role-scores.json, role-scores.md, run-log.json, report.md}`; the raw snapshot with posting text is in `private/real-postings/` (gitignored).
- **Result:** boards 32 (failed 0) · offers 1,729 · software-type 162 · stopped at the entity gate 48 (10 boards) · excluded: level 96, non-U.S. 8, experience 1 · posting text read 10 · liveness 9 checked, 9 active · scored 9 → Apply 0 · Consider 8 · Skip 1 · BLOCKED 0; scorer terms that are records 9/29 (all liveness); entity matched 9/9; Form D sample hits 0/9.
- **Gate decisions:** G7 (human release) not cleared: the persona is fictional and nothing was applied for. The two roles the scorer called Apply (Omada, Coalition) were held at Consider by the fit floor (G6c).
- **Open issues:** eight typed TODOs (recipe); the title-based fit cannot see a team's function (the top-scored role is a customer-facing Rails role); process-days buckets are the author's size guesses and the list changes with them (nothing moves between 84 and 144 days; four of the eight Consider roles become Skip at 150 days); the board-to-company link is a claim nothing checks (12 of the 32 boards were added by name); the liveness apply test is a word match, so a redirect to a careers page can still read active (Coalition's link); the `uncertain` liveness class was never seen live.

## 2026-10-20 — verification

- Independent recount with Python's `csv` module (not the mode's parser): rows 30,369, approvals present 1,557, all counts even, data horizon 2025-09-26, and every record value of the four scored companies match the run-log.
- Count parity: the repository's `ats:scan --dry-run` and `ingest.mjs` both saw 1,729 offers on the same 32 boards; the same parity held with a failing board (18 offers, one error reported by both).
- Liveness looked at by eye twice. The agent looked at Omada's live posting and its dead twin through a browser pane, and nothing was saved. The student then, on 2026-10-21, opened four pages in a browser (Omada's live posting and invalid job id, Commure's AI Integrations posting, Coalition's posting), compared each with the report, and has screenshots of the pages. Omada's and Commure's details match; the invalid id redirects to the job board with an error; the student's screenshot of Coalition is the careers listing, because the report's link redirects there. The student and the agent then both opened Coalition's real posting page: the student saw the title, "Any location, United States", the Apply Now button and the Underwriting Workbench team sentence; the agent also read "Two or more years…". Both agree with the report. The screenshots show unrelated personal tabs, so they are not saved: this is an observation, not a file.
- The posting screen run over all 1,729 real posting texts: 2 requirement hits (both Sword Health, both true), 207 E-Verify mentions, 17 "unable to sponsor", 953 with years asked, 24 new-grad invitations.
- Determinism: two fresh runs, and a fresh run against the committed outputs, are identical once the scorer's clock and the folder path are removed.
- Re-run stability: an ingest about 15 minutes later saw 1,727 offers (two fewer; only the totals were compared, so the cause is not known, and a posting taken down is the likely one) and the same 9 survivors.
- 45 offline tests pass, including a negative control where a deliberately broken liveness gate fails five properties.
- Regression against v0.1.0: the first sample scenario reproduces all nine committed decisions. The second now blocks all seven roles (`liveness-stale`): its hand-typed liveness checks are dated 2026-10-02 while the run is dated 2027-02-20, 141 days apart, and v0.2.0 refuses stale evidence. Intended; documented in the recipe's changelog.
- A clean checkout of the committed branch plus the files that would be committed: verify, doctor and the tests pass, the committed outputs are reproduced, and CI's contrib-scope gate (replicated) finds no protected path touched and nothing outside the allowed namespaces.

## 2026-10-20 — raw postings archived out of the tree (artifact change)

- The repository's `pii-scan` walks the whole working tree and ignores `.gitignore`, so the raw snapshots in `private/real-postings/` (which contain employers' public contact addresses) tripped it locally. Nothing was committed or deleted: the raw files were moved outside the repository (`info7375/mode-build-private/real-postings/`, not in the zip). In a fresh clone they do not exist. Found, not patched: for a maintainer, `pii-scan` and `private/README.md` disagree about where raw postings may live.

## 2026-10-20 — failure cases and break attempts

Nine attempts, in `assignments/submissions/shreyashyadav1/WORKED-RUN.md`, with transcripts in `assignments/submissions/shreyashyadav1/evidence/`. Five attack the mode itself (dead id, wrong company, nonexistent board, eight months later, authorization already ended); one breaks a copy of the code to prove the tests notice; one probes the repository's scorer; two move one input.

- **A job id that does not exist on a real board, through the pipeline** (the real checker returns `expired`): composite 0.465 to 0, next action "reallocate".
- **Wrong company claimed** (Abridge board claimed as "Abridged Inc"): the name gate accepts it; the new website-mismatch flag is the only warning.
- **Nonexistent board**: both the repository scanner and `ingest.mjs` report the HTTP 404; neither calls it "no jobs".
- **Eight months later**: all 9 roles held (`liveness-stale`, 224 days), scorer not run, funding labels `unknown-beyond-horizon`.
- **Scorer alone**: a Proven sponsor at fit 0 still scores 0.315 and is called Apply.
- **Authorization already ended**: exit 2, failure log, no scores.
- **One number swept** (a mid-size company's hiring loop, 84 to 173 days): the break-even lands exactly at 143, 144, 172 and 173 days; at 150 days half the Consider roles become Skip.
- **Experience tolerance swept** (3, 2, 1 years): 1, 4 and 7 of the 10 postings read are excluded.
- **BROKEN mutant** of the liveness gate: fails five properties of the suite.

## 2026-10-20 — defects found in this tool while running it (fixed)

- The experience screen read the upper bound of a range ("1–4 years") and excluded a posting that invites new grads; it also missed "3–5 years writing…" (no word "experience") and long lines. First official run (kept in `evidence/07a` and `08a`): 2 roles wrongly excluded (Commure Scribe AI, which invites new grads, and Voice Agents) and 4 stated requirements missed. Fixed; every other transcript is from the fixed code.
- The posting screen missed "obtain and maintain a US public trust clearance" until it was read in a real Sword Health posting.
- A regex meant for "Solutions Engineer" also excluded "Software Engineer II, Solutions Engineering".
- v0.1.0 misquoted Chapter 10's large-firm hiring loop (6–7 months; the chapter says about five).

## 2026-10-20 — repository behaviours found (logged, not patched)

- `scripts/score/role-scorer.mjs`: sponsorship alone (0.9 × 0.35 = 0.315) clears the Apply bar (0.30), so fit cannot veto an Apply. Handled in the recipe by a fit floor through the scorer's own `override` field. For a maintainer: TODO 7.
- `scripts/ats/detect-ats.py`: Greenhouse and Lever only, slug taken from the legal name: 8 of 105. For a maintainer: TODO 8.
- `scripts/sec/refresh-recent-sec-quarters.py` and `npm run verify` need setup a fresh clone lacks.
- `scripts/ats/liveness-core.mjs` counts any control containing the word "apply" as an apply control, and `liveness-browser.mjs` samples 2 seconds after load. Coalition's stored link shows an Apply button and then redirects to the careers listing, where an FAQ link containing "apply" still passes: the role is open (its real page, `/job-posting/<id>`, shows Apply Now) but the check cannot tell a posting from that listing (evidence 100 and 100b). Found by the student's own check. For a maintainer.
- From v0.1.0, still true: a missing liveness term becomes 1.0 labeled `record`; `--profile` with the word "authorized" drops the sponsorship weight.
- `scripts/doctor.mjs` reads `recipes/` without descending, so it never checks the `todos_open` of a recipe under `recipes/cases/`.

## 2026-10-20 — independent review and corrections (artifact change)

A second agent, read-only, reviewed the finished package against the assignment; each of its claims was checked against the files before anything was changed.

- Three things stated from the agent's memory as plain fact (Commure acquired Augmedix; Oscar Health is public; four similarly named CSV rows are different businesses) sat in the portals file, the saved snapshot and the report, while the documents said they were marked as unverified. They are hedged at the source. `tools/sync-notes.mjs` copied the six reworded notes into the snapshot (nothing else in it changed), and the decision step was re-run from that snapshot: `roles.json` and the scorer's two files are identical apart from the scorer's own date stamp (it writes the UTC date it ran on, and this re-run came after UTC midnight, so they say 2026-10-21), and `run-log.json` and `report.md` differ only in those notes, the report's summary wording, one explanatory line and a `class_source` label on each role's location.
- Board provenance was overstated: 20 of the 32 boards are in the saved probe output and 12 were added by name. The probe is saved as `tools/discover-boards.mjs` and was run again (the same 35 boards answered); the claim that every board's company name was checked in its postings was removed.
- The recipe promised exit 2 for a missing Form D directory or BLS file; only the CSV did it, and a missing Form D directory printed "0 of 9 hits". Form D now stops the run (a test covers it, and a copy of the code without the check shows the old behaviour). A missing BLS file only labels the context missing, and the recipe now says so.
- The recipe's and card's summaries lost their file paths and scheme words; the generated report's summary was reworded the same way.
- Documents that said more than was recorded were corrected: an unrecorded duration, "decides everything" (the sweep shows nothing moves from 84 to 144 days), a pii-scan history run that had not happened, and by-eye checks nobody saved.
- The student re-ran the four terminal checks and compared four pages in a browser on 2026-10-21, then told the agent to type their name and date on the worked-run attestation, which it did. The attestation covers the 2026-10-20 run only, and the recipe stays DRAFT.

## Pre-push checks

Recorded in the worked run (final gates): `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs` on the working tree, `node scripts/conformance.mjs` on the new folders, the 45 tests, and a clean-checkout run. The history scan `node scripts/pii-scan.mjs --diff origin/main` can only run after the commit and is not yet recorded.
