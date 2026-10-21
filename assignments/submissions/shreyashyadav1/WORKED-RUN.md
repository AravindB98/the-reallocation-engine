# Worked run — healthins-ai-opt v0.2.0 on real boards (2026-10-20)

## Executive summary

An AI agent (Claude Code), working under the student's direction, ran the mode designed for the first assignment against real data; "I" in this document is that agent's session (see "How to read this"). It read 32 live public job boards (1,729 openings), kept the nine roles that a new graduate on OPT could plausibly pursue, confirmed all nine were still open by loading each one in a browser, and handed them to the repository's own scorer. None earned "apply now": eight are "talk to someone first" and one is "skip". Two of the eight would have been "apply now" on the scorer's own rule; a fit floor added after the first run held them back (section 3.3). Everything pasted below is real terminal output; where something is described instead, it says so.

The run was checked independently (a separate recount of the data in another language, the repository's own scanner, a re-run that came out byte for byte the same), nine attempts were made to break or stress it, and a second agent reviewed the finished package; its findings and the corrections are in section 3.4. Reading the real postings showed bugs in the experience screen; they were fixed and the first run's output is kept so the mistake is visible. The mode stays at its first lifecycle stage, "draft", on purpose: of the 29 numbers the scorer multiplied only 9 come straight from a record or a page checked that day (all of them whether a posting is still open), 10 of the 32 companies could not be identified in the data at all, and eight proposed additions are still open.

## How to read this

- A block headed **Transcript** is the verbatim contents of a file in `evidence/`: the command, its output, its exit code and the time it was recorded (UTC). Long ones are cut with an explicit "lines omitted" marker; the full file is in `evidence/`. Two transcripts lack part of that: `05` is the first board-discovery output, pasted by hand without its command line, exit code or time (`05b` re-runs the saved probe and has all three), and `11` has no time line. The only edits to any transcript are that the repository's absolute path on my machine is written `<repo>`, that email addresses are replaced by a placeholder in the PII-scan transcripts (the employers' public contact addresses found in my raw postings, and an npm maintainer's address that the scanner quotes), and that a local account name in one directory listing is written `<user>`.
- A block headed **Excerpt** is copied from a real output file of the run, unchanged.
- **Where the files are.** Everything for this submission is in `assignments/submissions/shreyashyadav1/`: this document, `README.md`, `DOMAIN-JUSTIFICATION.md`, `FRICTIONAL.md`, the transcripts (`evidence/`) and the run's outputs (`runs/2026-10-20/`). The recipe is `recipes/shreyashyadav1-healthins-ai-opt.md`. The files were first written under `course/2026fa/submissions/shreyashyadav1/mode-build/` and moved on 2026-10-21, so the transcripts show the old paths: they record the commands as they were run.
- **Who "I" is.** The work in this document was done in one build session by an AI agent (Claude Code) with the student's approval of the plan (`FRICTIONAL.md` says who did what). "I" below means that session. The student's own checks are the re-run list in `README.md`; the student ran them on 2026-10-21 and section 7 records them. The student's name and date on the attestation were typed by the agent at the student's instruction (the line says so).
- Labels follow the engine: **record** (read from a file or page, with its source), **your-input** (a person's number or rule), **model-judgment** (none: this mode calls no model). Where the agent that helped me build this made a judgment of its own, I mark it as that and it is not part of the mode's output.

## 1. Inputs

| Input | What it is | Label |
|---|---|---|
| Persona | `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json`: fictional "Kabir Rao", F-1, graduating 2026-12, EAD start 2027-01-11, 90-day ceiling, 30-day buffer, targets SOC 15-1252. Added for v0.2.0: `exclude_levels` (senior, staff, principal, lead, manager…), `max_years_experience_ok: 3`, `apply_fit_floor: 0.6`, `liveness_max_age_days: 7`, `process_days_by_bucket` 42 / 84 / 150 (Chapter 10's startup, mid-size and large-firm examples) | your-input |
| Boards | `inputs/portals.healthins.yml`: 32 public boards (17 Greenhouse, 3 Lever, 12 Ashby), each with the claim of which legal entity runs it (`csv_company`) and a size bucket. Found three ways: 7 by the repository's detector, 13 more by a probe of 165 candidate slugs, and 12 added by name from the agent's own list of well-known companies (below). Nothing checks that a board belongs to the company it is named for | your-input |
| Data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows); `data/sec/form-d/processed/sample/*.sample.json` (4 files); `data/bls/compact/soc_occupation_compact.csv` | record |
| Live sources | the public board APIs (read through the repository's `scripts/ats/providers/`) and each posting's page (opened with `scripts/ats/liveness-browser.mjs`) | record |
| Date and tools | `--today 2026-10-20`; Node 24.21.0; Python 3.14.6 in a throwaway venv with PyYAML; Playwright Chromium (headless) | n/a |

What is real and what is not: the persona is fictional. The boards, the postings, the liveness checks, the H-1B and funding records are real. No real résumé, contact or application data is used anywhere, and nothing was applied for.

How the boards were found (transcripts 04, 05, 05b and 05c). The repository's own detector tries Greenhouse and Lever with a slug made from the legal name, and does not support Ashby:

*Transcript — evidence/04-detect-ats.txt*

```text
$ bash -c cd scripts/ats && python3 detect-ats.py --csv ../../output/healthins-verify/sponsors-in-sector.csv --company-column company_name --output ../../output/healthins-verify/ats_detection_healthins.csv
… (showing 11 of 303 output lines: those matching /-> (greenhouse|lever) / and the last 3; full transcript in evidence/04-detect-ats.txt)
[7/105] AKERO THERAPEUTICS INC -> greenhouse (1 jobs)
[21/105] CALA HEALTH INC -> greenhouse (12 jobs)
[44/105] GYNESONICS INC -> lever (0 jobs)
[66/105] OMADA HEALTH INC -> greenhouse (18 jobs)
[67/105] OUTSET MEDICAL INC -> greenhouse (31 jobs)
[85/105] SIRONA MEDICAL INC -> greenhouse (10 jobs)
[97/105] VERACYTE INC -> greenhouse (25 jobs)
[104/105] WELBE HEALTH LLC -> greenhouse (135 jobs)
[105/105] ZIPARI INC -> none (0 jobs)
[exit 0]
[recorded 2026-10-20T22:54:30Z]
```


It found 8 of 105 (seven are on the list; the eighth, Gynesonics, has no openings). A probe of 165 candidate slugs on all three board APIs (the sponsors' website labels and normalised names, plus a hand-typed list of insurtech and health-AI names) found 35 boards that answer. The first capture of that output (`05`) was pasted by hand, without a command line, exit code or time. The probe is now saved as `tools/discover-boards.mjs` and was run again: the same 35 boards answered, and one board's opening count moved from 135 to 136:

*Transcript — evidence/05b-board-discovery-rerun.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/discover-boards.mjs output/healthins-verify/sponsors-in-sector.csv
probing 165 slugs × 3 providers = 495 requests
gh akerotherapeutics 1
ab ambiencehealthcare 18
… (32 lines omitted; full transcript in evidence/05b-board-discovery-rerun.txt)
gh welbehealth 136
35 boards respond
[exit 0]
[recorded 2026-10-20T23:55:26Z]
```


`tools/board-coverage.mjs` then matches the probe's output against the portals file. 20 of the 32 boards are among the 35 answers. The other 12 (Zocdoc, Flatiron Health, Cohere Health, Clarify Health, Lemonade, Commure, Oscar Health, Clover Health, Komodo Health, Abridge, Headway, Cedar) were added by name from the agent's own list, and no transcript of how they were found was kept:

*Transcript — evidence/05c-board-coverage.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/board-coverage.mjs course/2026fa/submissions/shreyashyadav1/mode-build/evidence/05b-board-discovery-rerun.txt
35 boards answered in the probe output; 32 boards in the portals file
found by the probe (20): Sirona Medical, Omada Health, Outset Medical, Veracyte, Welbe Health, Cala Health, Akero Therapeutics, Coalition, Included Health, Lyra Health, CodaMetrix, Ambience Healthcare, Kin Insurance, Bestow, Openly, Pearl Health, Pie Insurance, Sword Health, Suki, Candid Health
not in the probe output, added by name (12): Zocdoc, Flatiron Health, Cohere Health, Clarify Health, Lemonade, Commure, Oscar Health, Clover Health, Komodo Health, Abridge, Headway, Cedar
answered in the probe but not used (15): ab carbonhealth, ab cohere, ab ladder, ab lyrahealth, ab marshmallow, ab nabla, ab notable, gh atbay, gh branch, gh candid, gh ethos, lv carbonhealth, lv gynesonics, lv procept-biorobotics, lv swordhealth
[exit 0]
[recorded 2026-10-20T23:55:37Z]
```


What this does and does not show: that a slug answers on a board API. It does not show that a board belongs to the company it is named for. Nothing in the repository, and no step of this run, checks that: the entity gate checks only that the claimed name exists in the CSV, and the report shows a board-name-versus-website hint. A one-off look at posting text for some boards was not kept and is not counted as evidence. (The first draft of this document said every board's company name was checked against its postings. That was not true, and the independent review caught it.)

## 2. Does the engine run? (the assignment's "get the engine running")

**`npm run verify`.** On this machine it fails until PyYAML is on PATH. The repository's `manifest-check` runs `python3 -c "import yaml…"`, and Homebrew's Python has no PyYAML. CI installs `pyyaml`, so this is the environment and not the repository. (Because my portals file is YAML, `conformance` itself now needs PyYAML too, as the first transcript shows.) With a throwaway venv on PATH it passes:

*Transcript — evidence/00-verify-fails-without-pyyaml.txt*

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 180 files (88 md · 36 py · 40 js · 11 json · 1 yaml · 4 sh)

✗ 1 file(s) FAILED conformance:
  • scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml — ModuleNotFoundError: No module named 'yaml'
[exit 1]
[recorded 2026-10-20T23:05:25Z]
```

*Transcript — evidence/01-verify.txt*

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 171 files (88 md · 36 py · 33 js · 10 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]
[recorded 2026-10-20T22:14:38Z]
```


**`npm run doctor` and the scorer's own test harness:**

*Transcript — evidence/02-doctor.txt*

```text
$ npm run doctor
… (showing 8 of 66 output lines: those matching /PRIVACY|no private|SUMMARY|environment:|recipes:|open TODOs/ and the last 2; full transcript in evidence/02-doctor.txt)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
[exit 0]
[recorded 2026-10-20T22:14:38Z]
```

*Transcript — evidence/03-score-gates.txt*

```text
$ npm run score:gates
… (60 lines omitted; full transcript in evidence/03-score-gates.txt)
structural checks : 3 passed, 0 failed  (of 3)
paired checks     : 1 warning(s)
negative control  : PASS — mutation caught by 5 assertion(s)
RESULT            : PASS

artifacts: output/gate-harness/gate-harness-2026-10-20.json
           output/gate-harness/gate-harness-2026-10-20-audit.md
[exit 0]
[recorded 2026-10-20T22:14:39Z]
```


**The repository's scanner on my 32 boards, dry run, nothing written.** (The environment variable points it at my portals file.)

*Transcript — evidence/06-ats-scan-dry-run.txt*

```text
$ bash -c REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml npm run ats:scan -- --dry-run
… (showing 15 of 155 output lines: those matching /Companies scanned|Total jobs found|Filtered by|Duplicates|New offers added/, the first 6 and the last 3; full transcript in evidence/06-ats-scan-dry-run.txt)

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 32 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)
Companies scanned:     32
Total jobs found:      1729
Filtered by title:     1581 removed
Filtered by location:  0 removed
Duplicates:            18 skipped
New offers added:      130
Review new offers in data/ats/pipeline.md.
[exit 0]
[recorded 2026-10-20T22:53:16Z]
```


**The repository's liveness checker on three live postings and two dead ones.** `npm` masks UUID-looking path segments in its own echo line (the `***`); the checker received the full URLs, as the result lines show:

*Transcript — evidence/10-ats-liveness-cli.txt*

```text
$ npm run ats:liveness -- https://job-boards.greenhouse.io/omadahealth/jobs/8047423 https://www.coalitioninc.com/job-posting?gh_jid=4734028005 https://jobs.ashbyhq.com/kin/56db2161-84b4-42ab-b1c6-adae6c1f325c https://job-boards.greenhouse.io/omadahealth/jobs/1234567 https://jobs.ashbyhq.com/kin/00000000-0000-0000-0000-000000000000

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/omadahealth/jobs/8047423 https://www.coalitioninc.com/job-posting?gh_jid=4734028005 https://jobs.ashbyhq.com/kin/*** https://job-boards.greenhouse.io/omadahealth/jobs/1234567 https://jobs.ashbyhq.com/kin/***

Checking 5 URL(s)...

✅ active     https://job-boards.greenhouse.io/omadahealth/jobs/8047423
✅ active     https://www.coalitioninc.com/job-posting?gh_jid=4734028005
✅ active     https://jobs.ashbyhq.com/kin/56db2161-84b4-42ab-b1c6-adae6c1f325c
❌ expired    https://job-boards.greenhouse.io/omadahealth/jobs/1234567
           redirect to https://job-boards.greenhouse.io/omadahealth?error=true
❌ expired    https://jobs.ashbyhq.com/kin/00000000-0000-0000-0000-000000000000
           pattern matched: job (listing )?not found

Results: 3 active  2 expired  0 uncertain
[exit 1]
[recorded 2026-10-20T22:40:17Z]
```


**The scorer reproduces Chapter 11.** The first two rows are the book's worked example (0.446 Apply, 0.178 Skip, as `DOMAIN.md` documents); the last row is a machine Skip that a documented human override turned into Apply, the mechanism the fit floor below reuses:

*Transcript — evidence/16-score-chapter-11.txt*

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir output/healthins-verify/ch11

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir output/healthins-verify/ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  output/healthins-verify/ch11/role-scores.json  +  output/healthins-verify/ch11/role-scores.md
[exit 0]
[recorded 2026-10-20T23:55:44Z]
```

*Transcript — evidence/16b-score-chapter-11-rows.txt*

```text
$ node -e const s=JSON.parse(require("fs").readFileSync("output/healthins-verify/ch11/role-scores.json","utf8")); for (const r of s.roles) console.log("  " + r.recommendation.padEnd(8) + " " + String(r.composite).padEnd(7) + "(machine: " + r.machine_recommendation + ")  " + r.company + " — " + r.title)
  Apply    0.4462 (machine: Apply)  Cambridge biotech (Ch.7) — Data role (Proven tier)
  Skip     0.1785 (machine: Skip)  Household-name non-sponsor — Same data role
  Skip     0      (machine: Skip)  Proven sponsor (ghost posting) — Looks perfect, isn't real
  Consider 0.4185 (machine: Consider)  Likely-tier sponsor — Strong but Likely not Proven
  Apply    0.1934 (machine: Skip)  Non-sponsor, but HM is a contact — Scorer says Skip, you know better
[exit 0]
[recorded 2026-10-20T23:56:05Z]
```


**`python3 scripts/sec/refresh-recent-sec-quarters.py`** (the assignment lists it) does not run on a fresh clone: `pandas` is missing (it is in `scripts/sec/requirements.txt`), and even with it the script stops because the quarters must first be downloaded with an SEC User-Agent carrying a real name and email, which I did not send:

*Transcript — evidence/21-sec-refresh.txt*

```text
$ python3 scripts/sec/refresh-recent-sec-quarters.py
… (10 lines omitted; full transcript in evidence/21-sec-refresh.txt)
  File "<frozen importlib._bootstrap>", line 491, in _call_with_frames_removed
  File "<repo>/scripts/sec/sec-all-quarters.py", line 1, in <module>
    import pandas as pd
ModuleNotFoundError: No module named 'pandas'
[exit 1]
[recorded 2026-10-20T22:56:22Z]
```


## 3. The run

### 3.1 The first official run was wrong, and reading the postings is how I knew

I ran the ingest and the decision step. Seven roles survived, three were excluded for asking too much experience, and the scorer said Apply 2 · Consider 4 · Skip 1:

*Transcript — evidence/07a-ingest-first-run-years-bug.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs
… (8 lines omitted; full transcript in evidence/07a-ingest-first-run-years-bug.txt)

boards 32 (failed 0) · offers 1730 · software-type 162
  boards the entity gate stopped: 10 (48 software-type offers never scored)
  on scoreable boards: level-excluded 96 · non-U.S. 8 · over cap 0
  posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 3
  liveness checked 7: active 7 · expired 0 · uncertain 0
  wrote course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json (reduced) and private/real-postings/healthins-2026-10-20.json (raw, gitignored)
[exit 0]
[recorded 2026-10-20T22:36:29Z]
```

*Transcript — evidence/08a-run-first-run-years-bug.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
healthins-ai-opt 0.2.0 · today 2026-10-20 · 114 roles in the candidate file (107 excluded before scoring)
  entity matched 7/7 · Form D sample hits 0/7 · blocked 0 · scorer terms that are records 7/23
  scorer: ✓ scored 7 roles → Apply 2 · Consider 4 · Skip 1 (skip 14%)
  → Apply 2 · Consider 4 · Skip 1 · BLOCKED 0 · Excluded 107
  Apply    0.465  Omada Health — Software Engineer II, Solutions Engineering  [2h apply]
  Apply    0.435  Coalition — Frontend Engineer, Underwriting  [2h apply]
  Consider 0.21   Commure — Software Engineer, AI Integrations  [3h network]
  Consider 0.24   Commure — Fullstack Engineer, Ambient AI  [3h network]
  Consider 0.21   Commure — Software Engineer, AI Billing  [3h network]
  Consider 0.27   Commure — Software Engineer, Billing Agents  [3h network]
  Skip     0.15   Kin Insurance — Software Engineer, Back-End Focus  [skip]
  wrote course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/run-log.json + course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/report.md
[exit 0]
[recorded 2026-10-20T22:36:41Z]
```


Before trusting any of that I opened the postings behind the decisions. Two findings, both from reading real text and neither from my unit tests (which used sentences I had written myself):

1. **Two roles were excluded wrongly.** Commure's "Scribe AI" posting says "1–4 years" and that strong new grads are encouraged to apply; "Voice Agents" says "2–4 years". My screen read the upper bound of the range (4) and threw both out. A range asks for its minimum.
2. **Four stated requirements were missed**: Omada's "3–5 years writing…" (no word "experience" near it), "3+ years building…", "2+ years of … industry experience" (my 50-character window ended before the word), and Coalition's "Two or more years" (a number written as a word).

A third defect, in a different pattern, turned up later on another posting (section 5, V6).

I fixed the screen to read the minimum of a range, to accept number words and bullet-start phrases, to read to the end of the line, and to ignore "preferred" and "a plus". The tests that pin this use the shapes of the real sentences. Every transcript from here on is from the fixed code.

### 3.2 The final run (ingest, then the offline decision step)

The ingest is the only step that touches the network. It fetches every board with the repository's own providers, applies the cheap offline gates first (can I identify the company, is the title something a new grad can hold, is the job in the U.S.), reads the text of the survivors, and only then opens each remaining posting in a browser, one page at a time, with the repository's liveness checker:

*Transcript — evidence/07-ingest.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs
healthins-ai-opt ingest 0.2.0 · 2026-10-20 · portals scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml
  liveness Omada Health | Software Engineer II, Solutions Engineering
  liveness Coalition | Frontend Engineer, Underwriting
  liveness Commure | Software Engineer, AI Integrations
  liveness Commure | Fullstack Engineer, Ambient AI
  liveness Commure | Software Engineer, AI Billing
  liveness Commure | Software Engineer, Billing Agents
  liveness Commure | Software Engineer, Scribe AI
  liveness Commure | Software Engineer, Voice Agents
  liveness Kin Insurance | Software Engineer, Back-End Focus

boards 32 (failed 0) · offers 1729 · software-type 162
  boards the entity gate stopped: 10 (48 software-type offers never scored)
  on scoreable boards: level-excluded 96 · non-U.S. 8 · over cap 0
  posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 1
  liveness checked 9: active 9 · expired 0 · uncertain 0
  wrote course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json (reduced) and private/real-postings/healthins-2026-10-20.json (raw, gitignored)
[exit 0]
[recorded 2026-10-20T22:46:12Z]
```


The decision step is offline and reproducible from the saved snapshot. It calls the repository's scorer unchanged:

*Transcript — evidence/08-run.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
healthins-ai-opt 0.2.0 · today 2026-10-20 · 114 roles in the candidate file (105 excluded before scoring)
  entity matched 9/9 · Form D sample hits 0/9 · blocked 0 · scorer terms that are records 9/29
  scorer: ✓ scored 9 roles → Apply 0 · Consider 8 · Skip 1 (skip 11%)
  → Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105
  Consider 0.465  Omada Health — Software Engineer II, Solutions Engineering  [3h network]
  Consider 0.435  Coalition — Frontend Engineer, Underwriting  [3h network]
  Consider 0.21   Commure — Software Engineer, AI Integrations  [3h network]
  Consider 0.24   Commure — Fullstack Engineer, Ambient AI  [3h network]
  Consider 0.21   Commure — Software Engineer, AI Billing  [3h network]
  Consider 0.27   Commure — Software Engineer, Billing Agents  [3h network]
  Consider 0.21   Commure — Software Engineer, Scribe AI  [3h network]
  Consider 0.27   Commure — Software Engineer, Voice Agents  [3h network]
  Skip     0.15   Kin Insurance — Software Engineer, Back-End Focus  [skip]
  wrote course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/run-log.json + course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/report.md
[exit 0]
[recorded 2026-10-20T22:46:12Z]
```


The report the person reads opens with a summary written for someone who has never seen the repository (its wording was changed after the independent review, to take out scheme words; section 3.4):

*Excerpt — assignments/submissions/shreyashyadav1/runs/2026-10-20/report.md (verbatim, lines 3–12)*

```text
## Executive summary

This run looked at 32 public job boards (0 failed to load) holding 1729 open offers. 162 are software-type titles, but 48 of those sit at 10 companies the sponsorship data cannot identify, so they were not scored. Of the rest, 96 ask for a seniority this student does not have and 8 are outside the U.S.; of the postings read, 0 state a citizenship, clearance or U.S.-person requirement and 1 ask for more years of experience than this student has. 9 postings were opened in a browser to see whether they are still live (9 active, 0 expired, 0 unclear). **Result: Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · excluded before scoring 105.**

2 roles the scorer would call Apply were held at Consider: sponsorship alone cleared the scorer's bar, but the fit is below your Apply floor of 0.6. Both recommendations are shown.

Roles marked BLOCKED were never scored, because something a person has to check is missing: a company the data cannot identify, a posting nobody could read or open, or evidence that is too old. Sponsorship history comes from a data file of company records, turned into a tier by a rule the author chose, so read the tier as a judgment, not a fact. The timeline check uses your own work-authorization dates. Whether a posting is still open was read by the repository's own browser checker on the day of the run. Funding is shown for context only, because the repository's scoring script has no funding input. No language model was used.

> Planning aid, not legal advice. STEM OPT eligibility, E-Verify status and unemployment-day counts are confirmed with your DSO, not by this report.
```


Then, from the same report, how many roles survived each gate (the arithmetic closes: 162 = 48 + 96 + 8 + 10, and 10 − 1 = 9):

*Excerpt — assignments/submissions/shreyashyadav1/runs/2026-10-20/report.md (verbatim, lines 21–37)*

```text
## How many roles survived each gate

| Step | Count | What it means |
|---|---|---|
| Boards scanned | 32 (failed: 0) | Greenhouse, Lever, Ashby only. A failed board is reported, not counted as empty. |
| Open offers | 1729 | Everything on those boards, every function. |
| Software-type titles | 162 | Same title rule as the sponsored-title proxy, minus QA, firmware, field service and sales engineering. |
| …at companies the data cannot identify | 48 (10 boards) | Not found, ambiguous, or a sibling row holds the approvals. Never fuzzy-matched. |
| …excluded by title level | 96 | Senior, staff, principal, lead, manager and the like. |
| …outside the U.S. | 8 | OPT work has to be in the U.S. |
| …over the per-board cap | 0 | Logged, not silent. |
| Posting text read | 10 (missing: 0) | Missing text means BLOCKED, not "no requirement". |
| …state a citizenship / clearance / U.S.-person requirement | 0 | Excluded, with the quote. |
| …ask for more years of experience than this persona has | 1 | Excluded, with the quote (persona.max_years_experience_ok). |
| Liveness checked | 9 | active 9 · expired 0 · uncertain 0 |
| Reached a gate or the scorer | 9 | Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 |
```


The decisions. "Consider" for Omada and Coalition is the fit floor at work: the scorer said Apply, and the table says why it was held:

*Excerpt — assignments/submissions/shreyashyadav1/runs/2026-10-20/report.md (verbatim, lines 38–51)*

```text
## Decisions (roles that reached a gate or the scorer)

| Role | Decision | Composite | Sponsorship tier | Fit | Timeline (start → unemployed days) | Liveness | Flags | Next action |
|---|---|---|---|---|---|---|---|---|
| Omada Health — Software Engineer II, Solutions Engineering | **Consider** | 0.465 | Proven p=0.9 | 0.5 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years (range up to 5); scorer said Apply; held at Consider: fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Coalition — Frontend Engineer, Underwriting | **Consider** | 0.435 | Proven p=0.9 | 0.4 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years; scorer said Apply; held at Consider: fit 0.4 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Billing Agents | **Consider** | 0.270 | Unknown | 0.9 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Voice Agents | **Consider** | 0.270 | Unknown | 0.9 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years (range up to 4) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Fullstack Engineer, Ambient AI | **Consider** | 0.240 | Unknown | 0.8 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | — | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, AI Integrations | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, AI Billing | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Scribe AI | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 1+ years (range up to 4); posting invites new grads | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Kin Insurance — Software Engineer, Back-End Focus | **Skip** | 0.150 | Unknown | 0.5 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | board "kin" does not match the CSV website kininsurance.com: confirm this board belongs to that company; no-sponsorship wording in the posting | skip: Skip. Time is better spent elsewhere. |
```


One role in full, every term labeled (Omada's "Software Engineer II, Solutions Engineering"):

*Excerpt — assignments/submissions/shreyashyadav1/runs/2026-10-20/report.md (verbatim, lines 138–154)*

```text
### Omada Health — Software Engineer II, Solutions Engineering

- **Decision:** Consider — held at Consider: the scorer said Apply (composite 0.465 ≥ 0.3, gates healthy); fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) · `(0.9·0.35 + 0.5·0.3) × 1 × 1 = 0.465`
- **Posting** [record, ats-provider:greenhouse]: https://job-boards.greenhouse.io/omadahealth/jobs/8047423 · Remote, USA (us)
- **Industry** [record]: Other Health Care
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals 20, denials 0, rate 100; sponsored titles: Senior Android Software Engineer; Senior Data Analyst
- **Titles matching the 15-1252 rule** [your-input rule]: Senior Android Software Engineer
- **Tier** [your-input rule over record]: Proven — approvals, approval rate and a 15-1252-like sponsored title all clear the rule
- **Funding** [record]: Series C on 2015-07-10 (135 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.5 — general software engineering
- **Posting text** [record, phrase match; 7245 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 3+ years: "…internal teams in their investigations. About you: 3–5 years writing readable, tested, and efficient production code We…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 3+ years (range up to 5); scorer said Apply; held at Consider: fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3).
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.
```


The agent log's coverage block, for the machine reader:

*Excerpt — assignments/submissions/shreyashyadav1/runs/2026-10-20/run-log.json → coverage (re-indented, same data)*

```text
{
  "candidates": 114,
  "entity_matched_in_csv": "9/9",
  "form_d_sample_hits": "0/9",
  "form_d_sample_companies_scanned": 200,
  "excluded_before_scoring": 105,
  "excluded_by_stage": {
    "level": 96,
    "location": 8,
    "experience": 1
  },
  "scored": 9,
  "blocked": 0,
  "blocked_reasons": {},
  "scorer_terms_labeled_record": "9/29",
  "scorer_record_terms_are": [
    "liveness"
  ]
}
```


### 3.3 What I saw when I opened the top role (my reading, not the mode's output)

This is my reading of Omada's posting in a browser, a judgment and not a record, and it is nowhere in the mode's data. The role sits on Omada's Solutions Engineering team, whose stated job is to understand customers' challenges, design technical solutions with Omada's products and demonstrate their value; the stack is Ruby on Rails; the requirements ask for 3–5 years. That is a customer-facing role, a long way from applied AI. The scorer's Apply came from the sponsor (Omada has 20 recorded approvals, 100% rate), which alone contributes 0.315 against a bar of 0.30. This is why the fit floor exists (it was added after this first run, and the "0 Apply" result rests on it: the scorer's own answer for Omada and Coalition is still Apply, shown beside the held result, and a test pins that removing the floor restores it).

### 3.4 After an independent review (the decision step was repeated from the same snapshot)

When the package was finished, a second agent reviewed it, read-only, against the assignment text and the repository's rules. Its report is not an authority: each claim was checked against the files before anything changed. Five things it raised were real and were fixed; a sixth was found by the first agent while repeating a comparison.

1. **Outside knowledge was stated as fact.** The portals file, the saved snapshot and the report said that Commure acquired Augmedix, that Oscar Health is a public company, and that four similarly named CSV rows are "different companies". None of it came from a file the mode reads or a page this run opened, and the documents claimed that such statements were marked as unverified wherever they appeared. They were not. The six notes were reworded to say what the CSV shows and to hedge the rest, and `tools/sync-notes.mjs` copied them into the snapshot (it first checks that the board list equals the portals file, writes only notes, and refuses otherwise; nothing else in the snapshot changed):

*Transcript — evidence/96a-review-notes-before.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sync-notes.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --check
… (showing 10 of 22 output lines: those matching /^(32 boards|note differs|[0-9]+ note)/ and the last 2; full transcript in evidence/96a-review-notes-before.txt)
32 boards in the snapshot, 32 enabled in the portals file
note differs: Commure
note differs: Oscar Health
note differs: Clover Health
note differs: Sword Health
note differs: Abridge
note differs: Headway
6 note(s) differ (--check: nothing written)
[exit 1]
[recorded 2026-10-21T00:01:45Z]
```

*Transcript — evidence/96b-review-notes-sync.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sync-notes.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json
… (showing 3 of 22 output lines: those matching /^wrote/ and the last 2; full transcript in evidence/96b-review-notes-sync.txt)
wrote 6 note(s) into course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json; nothing else changed
[exit 0]
[recorded 2026-10-21T00:01:45Z]
```

*Transcript — evidence/96c-review-notes-after.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sync-notes.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --check
32 boards in the snapshot, 32 enabled in the portals file
identical: every board matches on name, provider, careers_url, csv_company, bucket and note
[exit 0]
[recorded 2026-10-21T00:01:45Z]
```


   The decision step was then run again from that snapshot. The decisions did not change (Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105), `roles.json` and the scorer's two files are identical, and `run-log.json` and `report.md` differ only where expected: the six notes, a `class_source` label on each role's location (point 5), the report's rewritten summary paragraph, and one explanatory line above the boards table. The scorer's own files differ in their date stamps only: the scorer writes the UTC date it ran on, and this re-run happened after UTC midnight, so they now say 2026-10-21 (point 6).

*Transcript — evidence/97-review-rerun-from-snapshot.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
healthins-ai-opt 0.2.0 · today 2026-10-20 · 114 roles in the candidate file (105 excluded before scoring)
  entity matched 9/9 · Form D sample hits 0/9 · blocked 0 · scorer terms that are records 9/29
  scorer: ✓ scored 9 roles → Apply 0 · Consider 8 · Skip 1 (skip 11%)
  → Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105
  Consider 0.465  Omada Health — Software Engineer II, Solutions Engineering  [3h network]
  Consider 0.435  Coalition — Frontend Engineer, Underwriting  [3h network]
  Consider 0.21   Commure — Software Engineer, AI Integrations  [3h network]
… (9 lines omitted; full transcript in evidence/97-review-rerun-from-snapshot.txt)
```

*Transcript — evidence/98-review-old-vs-new-outputs.txt*

```text
$ diff -r -u -x candidates.snapshot.json output/healthins-verify/pre-review-run course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
… (showing 11 of 1256 output lines: those matching /^diff |^\+Roles marked|^\+Text after|Oscar Health/ and the last 2; full transcript in evidence/98-review-old-vs-new-outputs.txt)
diff -r -u -x candidates.snapshot.json output/healthins-verify/pre-review-run/report.md course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/report.md
+Roles marked BLOCKED were never scored, because something a person has to check is missing: a company the data cannot identify, a posting nobody could read or open, or evidence that is too old. Sponsorship history comes from a data file of company records, turned into a tier by a rule the author chose, so read the tier as a judgment, not a fact. The timeline check uses your own work-authorization dates. Whether a posting is still open was read by the repository's own browser checker on the day of the run. Funding is shown for context only, because the repository's scoring script has no funding input. No language model was used.
+Text after a dash under "Why it stopped" is the author's own note. What it says about the CSV can be looked up in the CSV; what it says about the companies themselves (public, acquired, a different business) is outside knowledge or judgment, and this run did not check it.
-| Oscar Health | 247 | 14 | entity-not-found: no CSV row for "Oscar Health, Inc." — public company: not in a Form D based dataset | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
+| Oscar Health | 247 | 14 | entity-not-found: no CSV row for "Oscar Health, Inc." — probably because it is a public company (outside knowledge, not checked here) and the dataset is Form D based | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
diff -r -u -x candidates.snapshot.json output/healthins-verify/pre-review-run/role-scores.json course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/role-scores.json
diff -r -u -x candidates.snapshot.json output/healthins-verify/pre-review-run/role-scores.md course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/role-scores.md
diff -r -u -x candidates.snapshot.json output/healthins-verify/pre-review-run/run-log.json course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/run-log.json
       "csv_company_claimed": "Oscar Health, Inc.",
[exit 1]
[recorded 2026-10-21T00:01:45Z]
```


2. **Board provenance was overstated.** Section 1 now says what is true: 20 of the 32 boards are in the saved probe output, 12 were added by name, and nothing checks the company link. The probe is saved and was re-run (transcripts 05b and 05c).

3. **A stop condition the code did not enforce.** The recipe said a missing CSV, Form D directory or BLS file stops the run with exit 2. Only the CSV did. A missing Form D directory silently scanned nothing and printed "Form D sample hits 0/9", which reads as "looked and found none". Form D now stops the run, and a new test covers it. A missing BLS file feeds no score (scorer weight 0.0), so the run goes on and the log says "missing"; the recipe now says that instead of promising exit 2. Below, the new code refuses; the same code with only the check removed (a mutant, kept in the gitignored scratch folder) shows the old behaviour; and a missing BLS file runs on:

*Transcript — evidence/99b-review-missing-formd.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir output/healthins-verify/break10 --formd-dir output/healthins-verify/no-such-dir
✗ Form D sample directory not found or holds no .json file: output/healthins-verify/no-such-dir
  wrote failure log: output/healthins-verify/break10/run-log.json (no scores were produced)
[exit 2]
[recorded 2026-10-21T00:01:56Z]
```

*Transcript — evidence/99c-review-missing-formd-mutant.txt*

```text
$ node output/healthins-verify/run-formd-check-removed.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir output/healthins-verify/break10m --formd-dir output/healthins-verify/no-such-dir --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json
healthins-ai-opt 0.2.0 · today 2026-10-20 · 114 roles in the candidate file (105 excluded before scoring)
  entity matched 9/9 · Form D sample hits 0/9 · blocked 0 · scorer terms that are records 9/29
  scorer: ✓ scored 9 roles → Apply 0 · Consider 8 · Skip 1 (skip 11%)
  → Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105
… (12 lines omitted; full transcript in evidence/99c-review-missing-formd-mutant.txt)
```

*Transcript — evidence/99d-review-missing-bls.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir output/healthins-verify/break10b --bls output/healthins-verify/no-such-bls.csv
healthins-ai-opt 0.2.0 · today 2026-10-20 · 114 roles in the candidate file (105 excluded before scoring)
  entity matched 9/9 · Form D sample hits 0/9 · blocked 0 · scorer terms that are records 9/29
  scorer: ✓ scored 9 roles → Apply 0 · Consider 8 · Skip 1 (skip 11%)
  → Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105
  Consider 0.465  Omada Health — Software Engineer II, Solutions Engineering  [3h network]
… (11 lines omitted; full transcript in evidence/99d-review-missing-bls.txt)
```


4. **Plain words in the summaries.** The recipe's own summary carried file paths and field names, and the generated report's summary used scheme words. Both were rewritten (the report's is shown in section 3.2). `todos_open` was recounted by hand, because the repository's doctor reads only the top level of `recipes/` and never opens this recipe.

5. **A label.** The log marked a location's U.S. or non-U.S. class `record`, though that class comes from the author's word list in `lib.mjs`; only the location text is a record. It now carries `class_source: your-input`.

6. **A determinism check that would have failed tomorrow.** While repeating the comparison, the diff tool turned out to compare the scorer's date stamp in the title line, so two runs a day apart would have been reported as different. It now masks it, and the re-run's scorer files match the originals across the date change (this was found by the first agent, not by the reviewer):

*Transcript — evidence/99a2-review-determinism-diff.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs output/healthins-verify/detD2 course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
identical  roles.json  (6540 chars)
identical  role-scores.json  (9592 chars)
identical  role-scores.md  (2399 chars)
identical  run-log.json  (240566 chars)
identical  report.md  (41207 chars)
all five outputs identical
[exit 0]
[recorded 2026-10-21T00:03:51Z]
```

*Transcript — evidence/99a3-review-scorer-files-across-midnight.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs output/healthins-verify/pre-review-run course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
identical  roles.json  (6540 chars)
identical  role-scores.json  (9592 chars)
identical  role-scores.md  (2399 chars)
DIFFERENT  run-log.json  (236192 chars)
DIFFERENT  report.md  (40422 chars)
2 file(s) differ
[exit 1]
[recorded 2026-10-21T00:03:51Z]
```


Wording findings were corrected in place: an unrecorded duration, claims that every decision "hangs on" one input (the sweep shows nothing moves between 84 and 144 days), a pii-scan history run that had not happened, and by-eye checks nobody saved. One finding cannot be closed here: the attestation needs the student's signature and date.

## 4. Verified vs inferred

What the data or a script established, and what I (or a rule I chose) judged. A row's label says which; nothing is mixed.

| Statement in the report | Established by | Label | Judged by me or by a rule |
|---|---|---|---|
| 1,729 open offers on 32 boards, none failed | the public board APIs through the repository's providers; the repository's own scanner counted the same 1,729 (V2) | record | none |
| 162 are "software-type" | a title regex applied to the real titles | your-input rule over record titles | that a title regex stands in for SOC 15-1252 |
| 10 boards cannot be identified | exact normalised-name lookup in the CSV: no such row | record (absence in this file) | that absence means "cannot identify", not "does not sponsor" |
| 96 titles are senior or above; 8 locations are outside the U.S. | word lists over the real title and location strings | your-input rule over record | that a title word is a level (the failure mode "titles are not levels") |
| Omada: 20 approvals, 0 denials, rate 100, industry Other Health Care | the CSV row, recounted with Python's `csv` module (V1) | record | tier "Proven" is my threshold rule |
| The postings were open on 2026-10-20 | the repository's liveness checker on all 9. The student's own check on 2026-10-21 (V3), four pages opened in a browser and compared with the report, agrees for Omada, Commure and the invalid link. For Coalition the report's link redirects to the careers listing, and the student and the agent both saw the real posting open (V3a). Recorded in the attestation, not as a file | record | the checker's own page-pattern rules (a script, not a model): it looks for an apply control or a closed message |
| Omada asks for 3–5 years; Kin says "unable to sponsor"; Commure "Scribe AI" invites new grads | phrase match on the real posting text, quoted in the report | record (quote) | that these phrases mean what a student would read; the 3-year tolerance is the persona's |
| The Omada role is customer-facing and Rails | **my reading of the page** | judgment by the author and the agent, not a record | all of it |
| Fit 0.5 for Omada, 0.4 for Coalition | a title regex (`FIT_RULE`) | your-input | that a title shows fit (it does not see a team's function) |
| Timeline 1.000, start 2027-01-12, 1 unemployed day | the formula over the persona's dates and an 84-day estimate | your-input | the 84 (a size bucket from Chapter 10's mid-size example) |
| Break-even: 143 / 144 / 172 / 173 days | walking the same timeline function; confirmed at each boundary by tests and by the sweep (B8) | derived from your-input | none |
| Data ends 2025-09-26, 13 months before the run | the newest `latest_funding_date`, recounted (V1) | record | none |
| All 1,557 approval counts are even | parity count, recounted (V1) | record | "possibly a doubled join" is my inference |
| 2 requirement hits in all 1,729 posting texts, both true | phrase screen over every text (V6), each hit read | record (quotes) | that I read both as true positives |
| 9 of 29 scorer terms are records (all liveness) | the scorer's own trace labels | record | none |
| Commure acquired Augmedix; Oscar Health is a public company; Abridged Inc, Headway Sales Inc, Clover Software Inc and Sword Diagnostics Inc are different businesses from the boards' companies | **not from any file the mode reads, or any page opened in this run**: the agent's background knowledge. For the last four, the CSV shows only that the names and websites differ | outside knowledge or judgment, not checked | all of it. The first draft stated these as plain fact; they are now hedged in the portals file, the snapshot, the run outputs and the report (section 3.4) |
| Each board belongs to the company it is named for | the board's slug and the author's `csv_company` claim; where a CSV row matched, a hint compares the slug with the row's website | your-input; the hint is a record comparison | that the board is that company's: nothing checks it, and 12 of the 32 boards were added by name |
| Size buckets (startup / mid-size / large) | the agent's rough guesses from public knowledge | your-input, unverified | all of it |

## 5. Verification (how I confirmed the output was real)

**V1. Independent recount in another language.** Python's `csv` module (not the mode's own parser) against the run-log: the CSV-level facts the report quotes, and every record value of the four scored companies:

*Transcript — evidence/09-independent-recount.txt*

```text
$ python3 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/recount.py
rows in CSV (Python csv module): 30369
rows with an approvals field: 1557  (>0: 1552)
approval counts that are even: 1557/1557 · denial counts even: 1557/1557
newest latest_funding_date: 2025-09-26  (n=27874)
the run-log says: approval counts even 1557/1557 | data horizon 2025-09-26

OMADA HEALTH INC           omadahealth.com        tier(run-log)=Proven   approvals=ok denials=ok approval_rate=ok industry=ok funding_date=ok
COALITION INC              coalition.io           tier(run-log)=Proven   approvals=ok denials=ok approval_rate=ok industry=ok funding_date=ok
COMMURE INC                commure.com            tier(run-log)=Unknown  approvals=ok denials=ok approval_rate=ok industry=ok funding_date=ok
KIN INSURANCE INC          kininsurance.com       tier(run-log)=Unknown  approvals=ok denials=ok approval_rate=ok industry=ok funding_date=ok

RESULT: every recounted value matches the run-log
[exit 0]
[recorded 2026-10-20T22:51:33Z]
```


**V2. Parity with the repository's own scanner.** The scanner (transcript 06) and the ingest (07) both saw 1,729 offers on the same 32 boards. The same parity held when one board did not exist (B3 below: 18 offers, one error, reported by both). An ingest about 15 minutes later saw 1,727 offers (two fewer; only the totals were compared, so the cause is not known, and a posting taken down is the likely one), and the same 9 roles survived:

*Transcript — evidence/23-ingest-rerun-stability.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs --out output/healthins-verify/timing/candidates.snapshot.json --raw-dir private/real-postings/verify-timing
… (showing 6 of 19 output lines: those matching /^boards|posting text|liveness checked/ and the last 3; full transcript in evidence/23-ingest-rerun-stability.txt)
boards 32 (failed 0) · offers 1727 · software-type 162
  posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 1
  liveness checked 9: active 9 · expired 0 · uncertain 0
  wrote output/healthins-verify/timing/candidates.snapshot.json (reduced) and private/real-postings/verify-timing/healthins-2026-10-20.json (raw, gitignored)
[exit 0]
[recorded 2026-10-20T23:00:32Z]
```

*Transcript — evidence/23b-snapshots-compared.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs snapshots output/healthins-verify/timing/candidates.snapshot.json course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json
  offers on the boards: 2026-10-20 run 1727 · other run 1729 (difference -2)
  surviving roles: 9 vs 9 · identical set: true
[exit 0]
[recorded 2026-10-20T23:00:32Z]
```


**V3. Liveness looked at by eye, twice.** First by the agent, through a browser pane (nothing was saved as a file): Omada's live posting (`…/omadahealth/jobs/8047423`) showed the title, "Remote, USA", an Apply button and an application form, and its dead twin (`…/jobs/1234567`) showed the board's front page with the message "The job you are looking for is no longer open" and 18 open jobs, the same 18 the provider returned. Then by the student, on 2026-10-21: they opened four pages in a browser (Omada's live posting, Omada's invalid job id, Commure's "Software Engineer, AI Integrations" posting and Coalition's posting) and compared each with `report.md`, and they have screenshots of the pages. Omada's and Commure's details match the report; Coalition's title, location, team and experience requirements match (their account); the invalid Omada id redirects to the job board with an error. Their screenshot of Coalition is the careers listing, because the report's link redirects there (V3a). The screenshots show unrelated personal browser tabs, so they are not saved in the repository. What was seen agrees with the checker's `active` and `expired` (transcript 10 above); for Coalition see V3a.

**V3a. What the student's check turned up about Coalition's link.** The link stored in the report (`…/job-posting?gh_jid=4734028005`) shows a shell page with an Apply button and, within about two seconds, redirects to the careers listing (transcript 100 below), which is why the student's screenshot is the listing and not the posting. The real posting address is `…/job-posting/4734028005`. The agent opened it in a browser pane on 2026-10-21: title "Frontend Engineer, Underwriting", "Engineering | Any location, United States", the Underwriting Workbench team, "Two or more years of professional software development experience…" (the report's quote is right) and an "Apply Now" button; the repository's checker also says `active` for it. The student then opened the same page and saw the title, "Engineering | Any location, United States", the "Apply Now" button and the sentence about the Underwriting Workbench team (their screenshot stops above the experience line and is not saved). So the role is open and the report's content is right. The weakness is in the check. Its apply test is a word match (`/\bapply\b/i`), so the careers listing that the stored link redirects to also reads `active`, because an FAQ link there contains the word "apply" (transcript 100b). The answer was right for Coalition; it would also have been "right" for a closed posting that redirects to such a page. The run outputs were not changed: this is documented, not patched.

*Transcript — evidence/100-coalition-link-redirect.txt*

```text
$ node --input-type=module -e import { chromium } from "playwright";
… (showing 10 of 23 output lines: those matching /^\{/ and the last 2; full transcript in evidence/100-coalition-link-redirect.txt)
{"requested":"/job-posting?gh_jid=4734028005","http":200,"afterMs":0,"landedOn":"/job-posting?gh_jid=4734028005","title":"Coalition Inc. Careers | Opportunity for you","applyControls":["Apply Now","Apply Now"]}
{"requested":"/job-posting?gh_jid=4734028005","http":200,"afterMs":2000,"landedOn":"/jobs","title":"Coalition Inc. Careers | Our Current Job Opportunities","applyControls":["Can I use AI to apply or during the interview?","What happens after applying or interviewing?"]}
{"requested":"/job-posting?gh_jid=4734028005","http":200,"afterMs":2500,"landedOn":"/jobs","title":"Coalition Inc. Careers | Our Current Job Opportunities","applyControls":["Can I use AI to apply or during the interview?","What happens after applying or interviewing?"]}
{"requested":"/job-posting?gh_jid=4734028005","http":200,"afterMs":6000,"landedOn":"/jobs","title":"Coalition Inc. Careers | Our Current Job Opportunities","applyControls":["Can I use AI to apply or during the interview?","What happens after applying or interviewing?"]}
{"requested":"/job-posting/4734028005","http":200,"afterMs":0,"landedOn":"/job-posting/4734028005","title":"Frontend Engineer, Underwriting, Any location, United States |","applyControls":["Apply Now","Apply Now"]}
{"requested":"/job-posting/4734028005","http":200,"afterMs":2000,"landedOn":"/job-posting/4734028005","title":"Frontend Engineer, Underwriting, Any location, United States |","applyControls":["Apply Now","Apply Now"]}
{"requested":"/job-posting/4734028005","http":200,"afterMs":2500,"landedOn":"/job-posting/4734028005","title":"Frontend Engineer, Underwriting, Any location, United States |","applyControls":["Apply Now","Apply Now"]}
{"requested":"/job-posting/4734028005","http":200,"afterMs":6000,"landedOn":"/job-posting/4734028005","title":"Frontend Engineer, Underwriting, Any location, United States |","applyControls":["Apply Now","Apply Now"]}
[exit 0]
[recorded 2026-10-21T20:10:22Z]
```

*Transcript — evidence/100b-checker-on-the-careers-listing.txt*

```text
$ node --input-type=module -e import { classifyLiveness } from "./scripts/ats/liveness-core.mjs"; const r = classifyLiveness({ status: 200, finalUrl: "https://www.coalitioninc.com/jobs", bodyText: "Frontend Engineer, Underwriting Engineering Any location, United States", applyControls: ["Can I use AI to apply or during the interview?", "What happens after applying or interviewing?"] }); console.log("checker verdict for the careers listing the stored link redirects to:", JSON.stringify(r));
checker verdict for the careers listing the stored link redirects to: {"result":"active","code":"apply_control_visible","reason":"visible apply control detected"}
[exit 0]
[recorded 2026-10-21T20:11:02Z]
```


**V4. Every output parses; the repository's conformance check passes** on the new folders:

*Transcript — evidence/93-final-conformance.txt*

```text
$ node scripts/conformance.mjs assignments/submissions/shreyashyadav1 recipes/shreyashyadav1-healthins-ai-opt.md recipes/shreyashyadav1-healthins-ai-opt.card.md scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt logs/runs
conformance: 36 files (13 md · 12 json · 10 js · 1 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit 0]
[recorded 2026-10-21T22:43:30Z]
```


**V5. Determinism.** The same snapshot, run twice into two fresh folders, and a fresh run against the committed outputs. Identical once the only two things allowed to differ (the scorer's own clock and the folder path) are removed. (My first version of this comparison reported a false difference because it replaced the absolute path before the relative one; I fixed the tool, `tools/diff-runs.mjs`.)

*Transcript — evidence/14-determinism.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs output/healthins-verify/detA output/healthins-verify/detB
identical  roles.json  (6540 chars)
identical  role-scores.json  (9592 chars)
identical  role-scores.md  (2402 chars)
identical  run-log.json  (235820 chars)
identical  report.md  (40422 chars)
all five outputs identical
[exit 0]
[recorded 2026-10-20T22:51:59Z]
```

*Transcript — evidence/14b-committed-vs-fresh.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs output/healthins-verify/detC course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20
identical  roles.json  (6540 chars)
identical  role-scores.json  (9592 chars)
identical  role-scores.md  (2402 chars)
identical  run-log.json  (235758 chars)
identical  report.md  (40422 chars)
all five outputs identical
[exit 0]
[recorded 2026-10-20T22:52:00Z]
```


These two were recorded before the review. After it the outputs were regenerated, so the check was repeated on the regenerated outputs (section 3.4, transcripts 99a2 and 99a3). That repeat also fixed a second weakness in the comparison tool: it did not mask the scorer's date stamp in the title line of `role-scores.md`, so a re-run on a later UTC day would have shown a false difference.

**V6. The posting screen over every real posting, not only the nine survivors** (1,729 texts; I read every hit). Two hits, both true: Sword Health postings that require a U.S. public-trust clearance. Reading them found a third defect: my first pattern caught one of the two and missed "obtain and maintain a US public trust clearance" in the other, until I added it:

*Transcript — evidence/11-screen-on-all-real-postings.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/screen-all.mjs
{"boards":32,"boards_failed":0,"postings":1729,"too_short":0,"requirement":2,"citizenship":1,"clearance":2,"us_person":0,"e_verify":207,"e_verify_negated":0,"no_sponsor":17,"authorized":93,"years_found":953,"new_grads":24}
min-years histogram (strictest hard minimum per posting): {"0":3,"1":48,"2":67,"3":202,"4":84,"5":186,"6":85,"7":85,"8":66,"9":2,"10":68,"11":1,"12":40,"13":2,"15":14}

== requirement hits (2), every one read ==
  [citizenship_required+clearance_required] Sword Health: …and maintain a US public trust clearance. Please note that US citizenship is required to obtain and maintain a government security…
  [clearance_required] Sword Health: …Public Trust Clearance - Candidates must be able to obtain and maintain a US public trust clearance. Bachelor’s degree in Computer Science, Cybersecurity, or…

== no-sponsorship wording (17), first 12 ==
  Lemonade: …in our NYC office 3 days per week Please note that we are unable to sponsor applicants for work visas. Lemonade's US base salary range…
  Lemonade: …to work in a remote environment Please note that we are unable to sponsor applicants for work visas. Unfortunately, we cannot…
  Lemonade: …Soho office 3 days per week *Please note that we are unable to sponsor applicants for work visas. Unfortunately, we cannot…
  Lemonade: …to work in a remote environment Please note that we are unable to sponsor applicants for work visas. Unfortunately, we cannot…
  Lemonade: …in a remote environment Please note that we are unable to sponsor applicants for work visas. Unfortunately, we cannot…
  Lemonade: …our Soho office 3 days per week Please note that we are unable to sponsor applicants for work visas. Unfortunately, we cannot…
… (7 lines omitted; full transcript in evidence/11-screen-on-all-real-postings.txt)
```


The screen is precise on what it found; whether it missed other phrasings I cannot say, because I have no ground truth. The gate fired on no scored role: in this sector explicit citizenship language is rare, and the bigger asymmetries are entity visibility and seniority.

**V7. Raw postings never leave `private/`; a gate that surprised me.** The raw snapshot (with posting text) is gitignored:

*Transcript — evidence/15-privacy-raw-postings.txt*

```text
$ bash -c git check-ignore -v private/real-postings/healthins-2026-10-20.json; echo "tracked files under private/:"; git ls-files private; echo "raw file exists locally: $(ls -la private/real-postings/ | tail -1)"
.gitignore:37:/private/*	private/real-postings/healthins-2026-10-20.json
tracked files under private/:
private/.gitkeep
private/README.md
raw file exists locally: -rw-r--r--@ 1 <user>  staff  385101 Oct 20 18:46 healthins-2026-10-20.json
[exit 0]
[recorded 2026-10-20T22:47:29Z]
```


The repository's `pii-scan` walks the whole working tree and ignores `.gitignore`, so my gitignored raw postings tripped it locally: they contain employers' public contact addresses (here and in the other scan transcripts those addresses, and the npm maintainer's, are replaced by a placeholder: the only edit besides paths). In a fresh clone they do not exist, so CI is not affected. I moved the raw files out of the repository (archived, not deleted) before the final scan; the only remaining finding is upstream's own `package-lock.json`, which pristine `main` has too (transcript 95):

*Transcript — evidence/92a-pii-scan-with-raw-postings-in-tree.txt*

```text
$ node scripts/pii-scan.mjs
pii-scan: 5 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <upstream npm maintainer email>
  [email] private/real-postings/healthins-2026-10-20.json — <employer contact email removed>
  [email] private/real-postings/healthins-2026-10-20.json — <employer contact email removed>
  [email] private/real-postings/verify-timing/healthins-2026-10-20.json — <employer contact email removed>
  [email] private/real-postings/verify-timing/healthins-2026-10-20.json — <employer contact email removed>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
[exit 1]
[recorded 2026-10-20T23:06:47Z]
```


**V8. The tests, including a negative control.** 45 offline tests. One runs a property suite against a deliberately broken liveness gate (`test/fixtures/BROKEN-liveness-gate.mjs`) that must fail it, so the suite is shown to be able to fail:

*Transcript — evidence/94-final-tests.txt*

```text
$ node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/*.test.mjs
… (showing 7 of 56 output lines: those matching /BROKEN gate fails|^ℹ (tests|pass|fail)|✖/ and the last 2; full transcript in evidence/94-final-tests.txt)
✔ negative control: the BROKEN gate fails the same properties (so the suite can fail) (0.999791ms)
ℹ the BROKEN gate fails 5 properties: undated never becomes a factor | uncertain is never a factor | stale evidence is not evidence | evidence dated after the decision day is refused | a record label needs the repo checker named
ℹ tests 45
ℹ pass 45
ℹ fail 0
[exit 0]
[recorded 2026-10-21T22:43:32Z]
```


**V9. Regression against my own v0.1.0 submission.** The shared code changed, so I re-ran v0.1.0's two sample scenarios against the decisions committed with the first submission. Scenario 1 reproduces all nine. Scenario 2 now blocks all seven roles on purpose: it reused liveness checks dated 2026-10-02 while pretending to be 2027-02-20, 141 days later, which v0.1.0 accepted without complaint and v0.2.0 refuses:

*Transcript — evidence/24-regression-v01-scenarios.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/regression-v01.mjs
## scenario 1 (--today 2026-10-03): decisions that differ from the committed v0.1.0 run: 0 of 9
   v0.1.0 summary {"Apply":3,"Consider":2,"Skip":2,"BLOCKED":2} · now {"Apply":3,"Consider":2,"Skip":2,"BLOCKED":2,"Excluded":0}
  same  vouch-ai-platform: v0.1.0 Apply 0.555 | now Apply 0.555
  same  sirona-ml-nlp: v0.1.0 Apply 0.54 | now Apply 0.54
  same  thirty-madison-fullstack: v0.1.0 Apply 0.495 | now Apply 0.495
  same  teladoc-ai-swe: v0.1.0 Skip 0 | now Skip 0
  same  pacific-life-ai: v0.1.0 Consider 0.465 | now Consider 0.465
  same  lemonade-llm: v0.1.0 Consider 0.255 | now Consider 0.255
  same  augmedix-ghost: v0.1.0 Skip 0 | now Skip 0
  same  clarify-unchecked: v0.1.0 BLOCKED null | now BLOCKED null (liveness-unchecked)
  same  abridge-entity-miss: v0.1.0 BLOCKED null | now BLOCKED null (entity-not-found)
## scenario 2 (--today 2027-02-20, after-EAD persona): decisions that differ from the committed v0.1.0 run: 7 of 9
   v0.1.0 summary {"Apply":0,"Consider":0,"Skip":7,"BLOCKED":2} · now {"Apply":0,"Consider":0,"Skip":0,"BLOCKED":9,"Excluded":0}
  DIFF  vouch-ai-platform: v0.1.0 Skip 0.0927 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  sirona-ml-nlp: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  thirty-madison-fullstack: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  teladoc-ai-swe: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  pacific-life-ai: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  lemonade-llm: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  DIFF  augmedix-ghost: v0.1.0 Skip 0 | now BLOCKED null (liveness-stale, liveness 141 days old)
  same  clarify-unchecked: v0.1.0 BLOCKED null | now BLOCKED null (liveness-unchecked)
  same  abridge-entity-miss: v0.1.0 BLOCKED null | now BLOCKED null (entity-not-found, liveness-stale, liveness 141 days old)
[exit 0]
[recorded 2026-10-20T23:14:37Z]
```


**V10. A clean checkout.** I cloned the committed branch, overlaid exactly the files that would be committed (modified and untracked, never ignored), ran `npm install`, and ran the gates there, with pristine upstream `main` for the scan baseline. I replicated CI's contrib-scope gate on everything that differs from upstream `main`:

*Transcript — evidence/95-clean-checkout.txt*

```text
$ bash scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/clean-checkout.sh
committed branch head under test: 79e693b healthins-ai-opt docs: record PR, build commit and clean-checkout run
pristine upstream main:           015843d 2026-09-23 fix(greenhouse-watch): justification lines now sum to the score
files overlaid from the working tree: 105
tracked files removed in the working tree: 2

## npm install (both checkouts)
done

## pii-scan on PRISTINE upstream main (the baseline)
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <upstream npm maintainer email>

## in my clean checkout
--- npm run verify
conformance: 180 files (88 md · 36 py · 40 js · 11 json · 1 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)
--- npm run doctor
  ✓ no private/PII paths are tracked
SUMMARY
  environment: ✓ runnable
  recipes: 34/34 carry lifecycle frontmatter — all tracked
--- pii-scan
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <upstream npm maintainer email>
--- the offline tests
ℹ tests 45
ℹ pass 45
ℹ fail 0
--- decision step re-run from the committed snapshot, compared with the committed outputs
identical  roles.json  (6540 chars)
identical  role-scores.json  (9592 chars)
identical  role-scores.md  (2399 chars)
identical  run-log.json  (240566 chars)
identical  report.md  (41207 chars)
all five outputs identical

## CI's contrib-scope gate, replicated on everything that differs from upstream main
files that differ from upstream main (the future PR): 140
protected paths touched: 0
files outside the allowed namespaces: 70
largest files in the PR (bytes):
241366 assignments/submissions/shreyashyadav1/runs/2026-10-20/run-log.json
125498 assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json
107518 assignments/submissions/shreyashyadav1/WORKED-RUN.md
44747 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs

clean checkout kept at: /var/folders/r0/9dx27nmx021b7_yd_5cmc1pm0000gn/T//healthins-clean.ZlJTZA
[exit 0]
[recorded 2026-10-21T22:43:43Z]
```


## 6. Deliberate attempts to break it

Nine attempts, of three kinds. Five attack the mode itself (B1, B2, B3, B5, B7). One breaks a copy of the code to prove that the tests notice (B4). One probes the repository's scorer rather than the mode (B6), and two move one input to see what depends on it (B8, B9). For each: what I did, what I expected, what happened.

**B1. A job id that does not exist, through the whole pipeline.** The liveness record comes from the repository's checker on an id that was never a posting on that board (so this is not a posting that closed), not from a status I typed. Expected: the role is gated to Skip, never Apply. Held:

*Transcript — evidence/17-break1-dead-posting.txt*

```text
$ bash -c node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break-dead-url.mjs output/healthins-verify/break1 && node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates output/healthins-verify/break1/candidates.snapshot.json --out-dir output/healthins-verify/break1 | sed -n 2,5p && node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs compare course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20 output/healthins-verify/break1 'Omada Health'
real checker on the dead URL -> {"result":"expired","code":"expired_url","reason":"redirect to https://job-boards.greenhouse.io/omadahealth?error=true"}
role before: Software Engineer II, Solutions Engineering | liveness active
  entity matched 9/9 · Form D sample hits 0/9 · blocked 0 · scorer terms that are records 9/29
  scorer: ✓ scored 9 roles → Apply 0 · Consider 7 · Skip 2 (skip 22%)
  → Apply 0 · Consider 7 · Skip 2 · BLOCKED 0 · Excluded 105
  Skip     0      Omada Health — Software Engineer II, Solutions Engineering  [reallocate]
  A Software Engineer II, Solutions Engineering: Consider composite 0.465  liveness factor 1 (record)  next: 3h network
  B Software Engineer II, Solutions Engineering: Skip     composite 0  liveness factor 0 (record)  next: reallocate
  reason in B: gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
[exit 0]
[recorded 2026-10-20T22:52:17Z]
```


**B2. Claim the wrong company for a real board.** I told the engine that the Abridge board is "Abridged Inc", a different company. Expected: the name gate cannot refuse it, because it only checks that a claim resolves; I hoped the website hint would show it. **The gate was fooled**, as predicted, and the hint caught it:

*Transcript — evidence/18a-break2-wrong-entity-claim.txt*

```text
$ bash -c node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs --portals scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break2-portals.yml --no-liveness --out output/healthins-verify/break2/candidates.snapshot.json --raw-dir private/real-postings/verify-break2 | sed -n 2,6p && node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates output/healthins-verify/break2/candidates.snapshot.json --out-dir output/healthins-verify/break2 > /dev/null && node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs boards output/healthins-verify/break2/candidates.snapshot.json && node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs roles output/healthins-verify/break2

boards 2 (failed 0) · offers 84 · software-type 4
  boards the entity gate stopped: 1 (2 software-type offers never scored)
  on scoreable boards: level-excluded 0 · non-U.S. 0 · over cap 0
  posting text fetched 2 · missing 0 · screen-excluded 0 · asks too much experience 1
  board "Abridge (honest claim)": entity not-found
  board "Abridge (WRONG claim)": entity matched -> ABRIDGED INC (Other, site abridged.com) | corroboration: mismatch (board "abridge" vs CSV site "abridged.com")
  roles that reached a gate: 1
    Abridge (WRONG claim) | Member of Technical Staff, Machine Learning | tier Unknown | BLOCKED | blocked ["liveness-unchecked"] | flags: board "abridge" does not match the CSV website abridged.com: confirm this board belongs to that company
[exit 0]
[recorded 2026-10-20T22:52:18Z]
```


**B3. A board that does not exist, next to a real one.** Expected: both the repository's scanner and my ingest say the board failed, instead of reporting "no jobs". Held:

*Transcript — evidence/18b-break3-nonexistent-board.txt*

```text
$ bash -c REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break3-portals.yml npm run ats:scan -- --dry-run 2>&1 | grep -E 'Companies scanned|Total jobs found|Errors|✗'; node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs --portals scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break3-portals.yml --no-liveness --out output/healthins-verify/break3/candidates.snapshot.json --raw-dir private/real-postings/verify-break3 | sed -n 3,9p
Companies scanned:     2
Total jobs found:      18
Errors (1):
  ✗ Nonexistent Board (typo in slug): HTTP 404: {"status":404,"error":"Job not found"}
boards 2 (failed 1) · offers 18 · software-type 6
  boards the entity gate stopped: 0 (0 software-type offers never scored)
  on scoreable boards: level-excluded 5 · non-U.S. 0 · over cap 0
  posting text fetched 1 · missing 0 · screen-excluded 0 · asks too much experience 0
  liveness checked 0: active 0 · expired 0 · uncertain 0
  ✗ board failed: Nonexistent Board (typo in slug) — HTTP 404: {"status":404,"error":"Job not found"}
  wrote output/healthins-verify/break3/candidates.snapshot.json (reduced) and private/real-postings/verify-break3/healthins-2026-10-20.json (raw, gitignored)
[exit 0]
[recorded 2026-10-20T22:52:19Z]
```


**B4. A broken liveness gate** (`uncertain` read as active, evidence never too old, any `record` label believed). Expected: the property suite fails. It fails five properties (V8 above).

**B5. The same real snapshot, eight months later** (`--today 2027-06-01`). Expected: evidence expires, nothing is scored, the funding labels are refused. Held (all nine roles held at 224 days; the scorer was not even run):

*Transcript — evidence/19a-break5-stale-and-horizon.txt*

```text
$ bash -c node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2027-06-01 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --out-dir output/healthins-verify/break5 | sed -n 1,4p; node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs summary output/healthins-verify/break5
healthins-ai-opt 0.2.0 · today 2027-06-01 · 114 roles in the candidate file (105 excluded before scoring)
  entity matched 9/9 · Form D sample hits 0/9 · blocked 9 · scorer terms that are records 0/0
  scorer: (no roles passed the evidence gates — scorer not run)
  → Apply 0 · Consider 0 · Skip 0 · BLOCKED 9 · Excluded 105
  role-scores.json written: false
  summary: {"Apply":0,"Consider":0,"Skip":0,"BLOCKED":9,"Excluded":105}
  blocked reasons: {"liveness-stale":9}
  data horizon: 2025-09-26 (21 months before this run)
  funding labels on the gated roles: {"unknown-beyond-horizon":9}
  example: Omada Health | liveness-stale | liveness age 224 days (limit 7)
[exit 0]
[recorded 2026-10-20T22:52:27Z]
```


**B6. The scorer on its own: a proven sponsor with zero fit.** I wrote the input by hand and used the repository's scorer. This is an upstream behavior, not a bug in my code; I did not patch it. Sponsorship alone contributes 0.315, above the 0.30 Apply bar:

*Transcript — evidence/19b-break6-scorer-zero-fit.txt*

```text
$ bash -c npm run score -- scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break6-zero-fit-roles.json --out-dir output/healthins-verify/break6 2>&1 | grep scored; node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/inspect.mjs scorer output/healthins-verify/break6
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  -> Apply 0.315 | (0.9·0.35 + 0·0.3) × 1 × 1 = 0.315 | composite 0.315 ≥ 0.3, gates healthy
[exit 0]
[recorded 2026-10-20T22:52:27Z]
```


**B7. A persona whose authorization already ended.** Expected: the run stops with a failure log and no scores. Held (exit 2):

*Transcript — evidence/19c-break7-past-authorization.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20/candidates.snapshot.json --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/persona.past-auth.fixture.json --out-dir output/healthins-verify/break7
✗ persona dates/limits unusable — timeline gate cannot be computed:
  - visa.auth_end_date 2025-12-31 is already past (today 2026-10-20) — no timeline can be computed
  wrote failure log: output/healthins-verify/break7/run-log.json (no scores were produced)
[exit 2]
[recorded 2026-10-20T22:52:27Z]
```


**B8. Move one number.** The persona's "mid-size" hiring-loop estimate drives the timeline of all nine live roles. The break-even said: full score up to 143 days, falling from 144, the scorer treats the gate as closed from 172, zero at 173. Swept through the whole pipeline, it lands exactly there, and at 150 days half the "talk to someone first" list becomes "skip":

*Transcript — evidence/20a-break8-process-days-sweep.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sweep.mjs process-days
predicted by the break-even in the report: full score to 143 days · starts to fall at 144 · the scorer treats the gate as closed from 172 · factor 0 at 173
midsize days Omada timeline                    Consider  Skip
84           1.000 comfortable                 8         1
143          1.000 comfortable                 8         1
144          0.967 inside-buffer               8         1
150          0.767 inside-buffer               4         5
171          0.067 inside-buffer               0         9
172          0.033 inside-buffer               0         9
173          0.000 past-unemployment-ceiling   0         9
[exit 0]
[recorded 2026-10-20T22:52:29Z]
```


**B9. Move the experience tolerance** (3, 2, then 1 year). The exclusion is a rule, so moving it moves the list. 1, 4 and 7 of the 10 postings read are excluded:

*Transcript — evidence/20b-break9-years-tolerance-sweep.txt*

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sweep.mjs years
tolerance 3 years: posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 1
tolerance 2 years: posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 4
tolerance 1 years: posting text fetched 10 · missing 0 · screen-excluded 0 · asks too much experience 7
[exit 0]
[recorded 2026-10-20T22:52:41Z]
```


What B1 to B9 add up to: the gates hold where a gate can hold (B1, B3, B5, B7, B8's arithmetic), the property suite can fail (B4), and two limits are real and now documented: the entity link is only as true as the claim (B2), and the scorer lets sponsorship alone clear the Apply bar (B6). The independent review added one more check of the same kind (a missing Form D directory, section 3.4, point 3); it is not counted among the nine.

## 7. Attestation

```markdown
## Attestation
- Recipe: healthins-ai-opt v0.2.0
- By: Shreyash Yadav · 2026-10-21   (the name and date were typed by the agent at the student's instruction. Rows marked "the student" are the student's own checks; the other rows are the agent's recorded runs, which the student has not repeated line by line.)

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` (PyYAML on PATH) | conformance 180 files pass; manifest check passes with 3 upstream warnings | pass |
| `npm run doctor` | all green; no private path tracked | pass |
| `npm run score:gates` | PASS, negative control caught | pass |
| `ats:scan --dry-run` on my 32 boards | 32 companies, 1,729 jobs, nothing written | same offer count as `ingest.mjs` |
| `ats:liveness` on 3 live and 2 dead URLs | 3 active, 2 expired, exit 1 | live active, dead expired |
| Opened four pages in a browser and compared each with `report.md` (the student, 2026-10-21): Omada's live posting, Omada's invalid job id, Commure's "Software Engineer, AI Integrations", Coalition's posting | Omada's and Commure's details match the report; Coalition's title, location, team and experience requirements match (the student's account); the invalid Omada id redirects to the job board with an error. The student's screenshots show Omada "Remote, USA", Solutions Engineering team, "3–5 years", an Apply button; the closed message above 18 openings; Commure Mountain View, CA, hybrid, page open; and, for Coalition, the careers listing (the report's link redirects there) with "Frontend Engineer, Underwriting" for Canada and for the United States. The student's look at Coalition's real posting page the same day (`…/job-posting/4734028005`): "Frontend Engineer, Underwriting", "Engineering | Any location, United States", an Apply Now button and the Underwriting Workbench team sentence; the agent's look at the same page also read "Two or more years…" (V3a) | each page agrees with the report and with the checker; the redirect on Coalition's link is a finding about the checker (V3a), not a mismatch with the report |
| Re-ran `npm run verify` (PyYAML on PATH), `npm run doctor`, the 45 offline tests, and the decision step from the saved snapshot compared with the committed outputs, all in the student's own terminal (the student, 2026-10-21, before the folders and scripts were changed for the new layout, see "Broke during testing, fixed"; the pasted terminal output is not saved as a file) | verify: conformance 180 files, all conform; manifest check passed with 3 warnings. doctor: environment runnable, no private or PII path tracked, 33 of 33 recipes carry lifecycle frontmatter. tests: 45 pass, 0 fail. decision step: Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105, and "all five outputs identical" against the committed outputs | the same results as the recorded final gates (transcripts 90, 91, 94) and determinism checks (14, 14b, 99a2) |
| Re-ran the same four checks on the final tree, after the folders and scripts were changed (the student, 2026-10-21; the student's report, no output pasted) | all four matched what `README.md` says to expect | the same results as the recorded final gates (transcripts 90, 91, 94, 95) |
| `ingest.mjs` then `run.mjs` on the real boards | funnel closes; Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · Excluded 105; 9 of 29 terms are records | a healthy run skips at least half: 105 of the 114 roles never reached the scorer (excluded before scoring) and the scorer skipped 1 of the 9 it scored (11%); together 106 of 114 (93%) |
| Independent recount (Python `csv`) | every value matches the run-log | match |
| Same snapshot run twice; fresh run vs committed outputs | identical | identical |
| Posting screen over all 1,729 real texts | 2 hits, both true; read by the agent (not yet by the student) | no false positives |
| 45 offline tests, including the BROKEN mutant | 45 pass; the mutant fails 5 properties | the mutant must fail |
| Clean checkout of the branch plus the changed files | verify, doctor, 45 tests pass; committed outputs reproduced; 0 protected paths; 70 files outside the folders `CONTRIBUTING.md` lists (68 under `assignments/submissions/shreyashyadav1/`, plus the recipe and its card directly under `recipes/`), all in the places the assignment names; the scope gate only warns about them | pass |
| B1: a job id that does not exist, through the pipeline | composite 0.465 to 0; next action "reallocate" | gated to Skip |
| B2: wrong company claimed (Abridge → "Abridged Inc") | **accepted by the name gate**; the website hint flagged it | the gate cannot refuse a resolvable claim; the hint is the only warning |
| B3: nonexistent board | both the repository scanner and the ingest report the 404 | failure visible, not "no jobs" |
| B5: run eight months later | 9 of 9 held (224 days); scorer not run; funding labels refused | refuse |
| B6: proven sponsor, zero fit, scorer alone | Apply 0.315 | documents an upstream behavior |
| B7: authorization already ended | exit 2, failure log, no scores | stop |
| B8: sweep the mid-size loop 84 to 173 days | boundaries at 143, 144, 172, 173; nothing moves from 84 to 144, four of eight Consider become Skip at 150 | as predicted |
| After the review: six notes hedged, decision step re-run from the same snapshot | decisions identical; `roles.json` and the scorer's files identical; `run-log.json` and `report.md` differ only in notes, summary wording and one label | no decision changes |
| After the review: Form D sample directory missing | exit 2, failure log, no scores; the same code without the check exits 0 and prints "Form D sample hits 0/9" | refuse |
| After the review: BLS file missing | run continues, context labeled `missing`, same decisions | continue (weight 0.0) |
| After the review: determinism on the regenerated outputs | identical; scorer files match across the date stamp | identical |

### Did not test
- A full Form D quarter, DOL LCA data, or any E-Verify data. None was downloaded (the SEC wants a real name and email as User-Agent), so funding stays "not recent in the dataset" and the SOC proxy stays a title rule.
- The `uncertain` liveness class on a live page. It was 0 of 9; it is tested only with injected results.
- Another date, another week, or another machine than this Mac (the clean checkout ran here).
- Browsers other than headless Chromium; slow or failing pages beyond the one nonexistent-board case.
- The human release gate G7: never cleared. The persona is fictional, nothing was applied for, and I did not check what happens when someone actually follows a "talk to someone first".
- The after-OPT persona (`persona.after-ead.example.json`) on real boards; it was only exercised on v0.1.0's fixtures.
- Accuracy of the size buckets, of Chapter 10's loop figures as applied to these companies, and of EAD, STEM-eligibility and unemployment-day facts (all the student's or the DSO's).
- The scorer's `--profile` path (never passed) and any scorer configuration other than the shipped defaults.
- Roles on Workday, iCIMS, Taleo or companies' own sites.
- Whether any board belongs to the company it is named for (nothing checks it), and whether the outside-knowledge notes are true (Commure and Augmedix, Oscar Health being public, "a different business").
- Whether a hand-edited snapshot that names the liveness checker would be believed. It would: the `record` label is earned by naming the checker, and there is no signature.
- The experience lines on the Commure and Coalition posting pages. The student's screenshots stop above them (the student's account covers them); the agent read Coalition's, and for Commure the years rest on the phrase screen alone. The student's screenshots are not saved (they show unrelated personal browser tabs).
- `node scripts/pii-scan.mjs --diff origin/main`, the history scan that CI runs. It needs the commit, and nothing is committed yet; the working-tree scan is recorded (section 9).
- `ingest.mjs` after the review: nothing in it changed, and it was not run again (a re-ingest would change the snapshot and every number).

### Broke during testing, fixed
- `npm run verify` failed: no PyYAML in the system Python (the repository's own `manifest-check`). A throwaway venv on PATH; CI already installs it.
- v0.1.0's fixtures all shared the website `example.com`, so the new sibling gate blocked every role. Each fixture company now has its own website.
- A regex for "Solutions Engineer" also excluded "Software Engineer II, Solutions Engineering" (a team suffix). Removed (`lib.mjs`, `POSTING_EXCLUDE`).
- The experience screen read the upper bound of a range, missed bullet-start and number-word phrasings, and its window ended too early. Found by reading real postings; fixed in `jd-screen.mjs`; first run kept in transcripts 07a and 08a.
- The same screen consumed the text after its first match ("2 years … or 4+ years" read as 2). Caught by a test; fixed.
- The posting screen missed "obtain and maintain a US public trust clearance" in a real Sword Health posting. Pattern added (`jd-screen.mjs`).
- A test asserted that the report never contained the word "stale", but the report legitimately says "not recent … not stale" and uses `liveness-stale` as a reason code. The assertion now checks the funding labels.
- The scorer called a customer-facing role "Apply" on sponsorship alone. Added the fit floor through the scorer's own override field (`run.mjs`); the scorer is untouched.
- The decision line for a held role showed the scorer's Apply reasoning next to the word Consider. It now says "held at Consider: the scorer said Apply …".
- Quoted snippets began mid-word. They now start and end on whole words.
- My first determinism comparison reported a false difference (path normalisation order). Fixed in `tools/diff-runs.mjs`.
- `run.mjs` (and `ingest.mjs`) refused to write into the repository's gitignored `output/` folder. Allowed it, and only it. This was the last edit to either file before the review, five minutes after the official run, and it changes only which folders they accept.
- v0.1.0 misquoted Chapter 10's large-firm hiring loop as 6–7 months; the chapter says about five. The buckets now use the chapter's three figures.
- A zsh glob error on a URL with `?`; a shell wrapper that the sandbox's safety check refused to run (nothing was worked around: the scratch transcripts it was meant to tidy were simply left out).
- Found by the independent review and fixed (section 3.4): outside knowledge stated as fact in notes (hedged, snapshot synced, decision step re-run); an overstated account of how boards were found (rewritten, the probe saved as a tool and run again); a missing Form D directory that printed "0 of 9" instead of stopping (now exit 2, one test added); a location class labeled `record` (now `class_source: your-input`); a diff tool that compared the scorer's date stamp (now masked).
- Followed the assignment's PR instructions literally: the branch is `mode/shreyashyadav1-healthins-ai-opt`; the justification, worked run and everything that goes with them (README, FRICTIONAL, presentation script, run-log copy, `evidence/`, `runs/`) are in `assignments/submissions/shreyashyadav1/`; the mode file and its card are directly under `recipes/`. That meant editing the scripts that named the old folders (default paths in `ingest.mjs` and in `tools/sweep.mjs`, `recount.py`, `break-dead-url.mjs` and `clean-checkout.sh`, the output guard in `run.mjs` and `ingest.mjs`, and an alias in `tools/diff-runs.mjs` for the folder the committed run-log names). The files were moved byte for byte (checked by checksum), and the 45 tests, the gates and the clean checkout were run again (transcripts 90 to 95). The student's four terminal checks, run earlier on 2026-10-21, ran before this move and are repeated on the final tree (see the Tested table).
```

## 8. Reflection

### My decisions and reflection (the student's own words)

I decided to continue working on my previous health insurance and AI job search mode instead of starting something new. Since I already had the basic idea, I wanted to improve it and see how it worked with real job postings.

One thing I found interesting was how the results changed after applying all the filters. The run started with 1,729 job postings, but only 9 candidates were left at the end. This made me realize how important it is to check the requirements properly instead of just looking at job titles.

One problem in the first run was that some jobs suitable for new graduates were getting filtered out because of how the experience requirements were checked. I wanted to correct that because missing a good opportunity would defeat the purpose of this project.

Another thing I wanted to improve was the scoring. Just because a company has sponsored visas before doesn't mean every job at that company is a good fit. I wanted the actual job requirements to matter too.

I also decided to keep the earlier results and errors instead of removing them because they show what went wrong and what needed improvement.

I used Claude Code to help with the implementation and testing, but my main goal was to make the mode more useful for someone in my situation. I know there are still limitations, especially with company matching and sponsorship information, and those are things I would like to improve next.

*Added by the agent, outside the student's words: the implementation, tests and drafts were written by Claude Code under the student's direction (`FRICTIONAL.md` has the table); the student chose to continue this mode, approved the plan and ran the checks in section 7. On the scoring: in the mode, posting requirements (years, citizenship, clearance) exclude roles, while the fit behind the Apply floor is still a title rule.*

### What went well

- **The run is real end to end.** Live boards, a real browser check, the repository's own scorer. The funnel gave the information asymmetry numbers instead of adjectives: 1,729 openings, 162 software-type, 48 at companies the data cannot see, 96 senior or above, 9 live.
- **Cheap gates first.** The browser opened for 9 postings out of 1,729; everything before that ran offline or on plain board requests.
- **The checks that found the most were the ones that looked at real text.** My unit tests were green while the first official run was wrong. Reading the postings behind the decisions found three defects and a role where the numbers hid the truth.
- **The negative results are results.** A gate that fires zero times in a sector (citizenship) and a name gate that a wrong claim can pass are things I would not have known from a design on paper.

### What the mode got wrong or missed

- **The top-scored roles are not applied-AI roles.** Omada's is a customer-facing Rails role; Coalition's is front-end. A title-based fit cannot see a team's function. I added a fit floor after seeing it, so the mode no longer says "Apply", but the cause (fit from titles) is still there. A fair reviewer could say I tuned the output; the posting I read, break B6 and the visible persona input are my answer, and with the floor removed the scorer's Apply stands (a test pins that).
- **Six of the eight "talk to someone first" roles are one company with no sponsorship record** (Commure). For them "Consider" rests on fit alone (composites 0.21 to 0.27). The honest reading is that the engine has no evidence about them.
- **The gate I was proudest of did the least.** The citizenship and clearance screen excluded no scored role and fired twice in 1,729 postings, on a board the entity gate already stops. In insurtech and health-tech, explicit citizenship language is rare; the larger asymmetries were entity visibility and seniority.
- **The list depends on guesses.** The size buckets are the agent's, and B8 shows what moving one number does: nothing between 84 and 144 days, then half of the "talk to someone first" list turns into "skip" at 150, and all of it by 171. The break-even helps a reader judge the guess; it does not replace a sourced hiring-lag table.
- **The company link is a claim.** B2 shows a wrong claim passes, and 12 of the 32 boards were added by name with no saved discovery output; nothing checks the link. The website hint false-warns on legitimate pairs (`kin` vs `kininsurance.com`).
- **The gates are mostly machine rules.** G0 to G6 hold or release a role without a person; only G7 needs a named human, the recipe has no mechanism for it beyond a line in the run log, and on this run nobody cleared it. "Hard stops a human must clear" is only half built.
- **The first draft claimed more than it had.** It stated outside knowledge as fact, said every board's company had been checked against its postings, and promised a stop the code did not make. An independent review caught all three (section 3.4). The lesson for the mode itself: its labels (record, your-input) are only as good as whoever applies them, and the agent that wrote the labels was the one that broke them.
- **Coverage is thin where the persona most wants to look.** Large insurers and public companies are mostly absent from a dataset built from private funding filings; only 3 platforms are read; funding data ends 13 months ago; Form D contributes nothing beyond samples; nothing about E-Verify. A live example: on 2026-10-21 Commure's own posting page said its latest raise was $70M at a $7B valuation, while the dataset's latest Commure funding is a 2024 seed (the report says "not recent in the dataset", and funding is not a scorer term, so no decision moved).
- **A liveness record can be right for the wrong reason.** The checker's apply test is a word match, so Coalition's stored link, which redirects to the careers listing within about two seconds, read `active` on both sides of the redirect (V3a, transcripts 100 and 100b). The role is open, so the answer was right; but a closed posting that redirects to a careers page with an "apply" FAQ link would read open too. The student's own check found it: their screenshot showed the listing where the report promised a posting. It is the sharpest limit of the one gate the mode treats as a record. I did not fix it: the checker is a maintained file, and changing the stored link would change the run's outputs.
- **I never saw an `uncertain` liveness result live.** The one company-hosted page (Coalition's) read `active`, but see the bullet above: the check cannot tell a posting from the careers page its link redirects to.

### Next steps

1. Add the DOL LCA extract (TODO 1) so "sponsors software engineers" stops being a title guess; then the E-Verify list (TODO 2).
2. Run the ingest weekly and diff snapshots (new, closed, changed) instead of treating each run as a fresh list.
3. Replace the title-based fit with a bounded, labeled judgment of the posting text against the student's real skills (kept in `private/`), labeled `model-judgment`, after the gates, and checked against the student's own hand ratings before anyone trusts it.
4. A sourced hiring-lag table (TODO 4) and an acquisition table (TODO 5).
5. Propose upstream: an Apply bar that sponsorship alone cannot clear (TODO 7), Ashby and alternate slugs in the detector (TODO 8), and a note that `npm run verify` and the SEC refresh need setup a fresh clone lacks. Also a liveness check that compares the final address with the requested one, and that does not count the word "apply" inside a FAQ link as an apply control.
6. Close or remove the eight TODOs to earn SPECIFIED, then a live run with the student clearing G7 on real roles, using their real data in `private/`.
7. Repeat the checklist in `README.md` after any change to the recipe or its scripts: such a change voids the attestation.

## 9. Pre-push gates, final

The final gates on the current tree, recorded. The one `pii-scan` finding is upstream's own `package-lock.json` (an npm maintainer's address); pristine `main` has it too (transcript 95).

*Transcript — evidence/90-final-verify.txt*

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 180 files (88 md · 36 py · 40 js · 11 json · 1 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]
[recorded 2026-10-21T22:43:29Z]
```

*Transcript — evidence/91-final-doctor.txt*

```text
$ npm run doctor
… (showing 8 of 66 output lines: those matching /PRIVACY|no private|SUMMARY|environment:|recipes:|open TODOs/ and the last 2; full transcript in evidence/91-final-doctor.txt)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
  open TODOs: 326 declared (in frontmatter) · 326 [TODO markers in bodies
SUMMARY
  environment: ✓ runnable
  recipes: 34/34 carry lifecycle frontmatter — all tracked
[exit 0]
[recorded 2026-10-21T22:43:30Z]
```

*Transcript — evidence/92-final-pii-scan.txt*

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <upstream npm maintainer email>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
[exit 1]
[recorded 2026-10-21T22:43:30Z]
```

