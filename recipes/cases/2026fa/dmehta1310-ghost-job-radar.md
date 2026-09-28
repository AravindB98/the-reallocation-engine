---
status: DRAFT
todos_open: 3
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# ghost-job-radar -- Liveness-Gated Trust Check for CPT Students

## Purpose

Check a specific job posting for a specific person before they spend research
hours on it. It answers one question first -- is this posting still real --
and only then checks whether the company is worth pursuing at all, using
sponsorship history and recent funding. Built for an F-1 student on CPT
whose work window is tied to program enrollment rather than a fixed
post-graduation clock, and who has already lost real hours to a posting
that had quietly been filled. Liveness and a CPT/program-timeline check are
hard gates; funding and sponsorship history are votes computed only after
both gates pass.

## Source Inventory

| Source Node | Node Type | Source URL or Path | Human Check |
|---|---|---|---|
| ATS liveness detection | Script | `scripts/ats/check-liveness.mjs` | Confirm the posting URL matches an ATS the script supports (Greenhouse, Lever, Ashby, SmartRecruiters) before trusting a result. |
| Sponsorship history | Data | `data/80-days-to-stay/` | Confirm the company name in the input matches the dataset's naming exactly; near-misses get flagged, not guessed. |
| Funding signal | Data | `data/sec/form-d/processed/sample/*.sample.json` | Confirm this is sample data only -- absence of a record means "not in the sample," not "no funding." |
| Existing scorer | Script | `scripts/score/role-scorer.mjs` | Confirm the `roles.json` fed to it matches the shape of `data/examples/ch11-roles.json`. |
| CPT/program-timeline check | Script (proposed) | `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py` [TODO: DEV] | Human confirms the program/CPT end date and hiring-lag estimate are both current before trusting the gate result. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| Job posting URL | String | Student-provided | Yes |
| Company name | String | Student-provided, must match sponsorship/funding data naming | Yes |
| CPT / program end date | Date | Student-provided [your-input] | Yes |
| Hiring-lag estimate (weeks) | Integer | Student assumption [your-input] | Yes |
| Sponsorship history record | JSON | `data/80-days-to-stay/` | Yes, if present |
| Funding record | JSON | `data/sec/form-d/processed/sample/*.sample.json` | No -- absence is labeled, not treated as failure |

## Phase Gates

1. **Liveness gate** (hard stop): the posting must resolve as live before
   anything else is computed. Test: `npm run ats:liveness -- --file
   <job-url-file>` returns a live result for the target URL. Human check:
   confirm the URL is from a supported ATS before trusting a "dead" result
   -- an unsupported platform is "unknown," not "dead."
2. **CPT/program-timeline gate** (hard stop): a realistic hire must be able
   to complete before the stated program/CPT end date. Test: `python3
   scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py
   --end-date <date> --lag-weeks <n>` returns pass/fail. Human check: the
   student confirms the lag estimate is reasonable for this company's size
   and role level -- the script cannot judge this alone.
3. **Data-shape gate**: the `roles.json` fed to the scorer must parse and
   match the shape of `data/examples/ch11-roles.json`. Test: `python3 -m
   json.tool <roles.json>` succeeds.
4. **Script-readiness gate**: every script this recipe calls exists or is
   marked with a typed `[TODO: DEV]`. Test: `test -f
   scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py`.
5. **Report gate**: both output files (JSON for the agent, Markdown for the
   person) are written before the run is considered complete. Test: `test
   -f course/2026fa/submissions/dmehta1310/runs/*.json && test -f
   course/2026fa/submissions/dmehta1310/runs/*.md`.

## Steps

1. Step name: Check liveness. Labor: Script with Human gate.
   Script called: `scripts/ats/check-liveness.mjs` (via `npm run
   ats:liveness`).
   Input: job posting URL.
   Output: live/dead status.
   Where output goes: printed to terminal; recorded by hand in the run log.
2. Step name: Check CPT/program timeline. Labor: Script (proposed) with
   Human gate.
   Script called:
   `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py`
   [TODO: DEV -- built as part of this assignment's prototype].
   Input: CPT/program end date, hiring-lag estimate.
   Output: pass/fail.
   Where output goes: printed to terminal; recorded by hand in the run log.
3. Step name: Look up sponsorship and funding. Labor: Script (proposed)
   with Human gate.
   Script called:
   `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py`
   [TODO: DEV].
   Input: company name, `data/80-days-to-stay/`,
   `data/sec/form-d/processed/sample/`.
   Output: a `roles.json` shaped like `data/examples/ch11-roles.json`, with
   every value labeled record / model-judgment / your-input.
   Where output goes: `course/2026fa/submissions/dmehta1310/runs/`.
4. Step name: Score. Labor: Script (existing, unmodified).
   Script called: `scripts/score/role-scorer.mjs` (via `npm run score`).
   Input: the `roles.json` from Step 3.
   Output: `role-scores.json` and `role-scores.md`.
   Where output goes: `course/2026fa/submissions/dmehta1310/runs/`.
5. Step name: Log the run. Labor: Human.
   Script called: none -- manual entry.
   Input: outputs from Steps 1-4.
   Output: a run-log entry.
   Where output goes: `logs/runs/2026fa-dmehta1310-1.md`.

## This recipe can verify:

- whether a specific job posting URL is currently live, for a supported ATS;
- whether a company appears in the sponsorship-history sample and what tier
  it's recorded at;
- whether a company appears in the Form D funding sample and how recent the
  filing is;
- whether a stated hiring-lag estimate is arithmetically compatible with a
  stated CPT/program end date.

## This recipe cannot verify:

- whether a company will actually respond to an application, even when
  every gate passes;
- sponsorship likelihood for a company absent from the sample data --
  absence is not evidence of "no";
- how long this specific company's hiring process will actually take -- the
  lag estimate is the student's own input, not a record;
- liveness for postings on ATS platforms the detection script doesn't
  recognize.

## Primary Tools

```bash
npm run ats:liveness -- --file data/ats/job-urls.txt
npm run score -- <roles.json> --out-dir course/2026fa/submissions/dmehta1310/runs
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2027-05-15 --lag-weeks 6
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company "Example Inc" --url <job-url>
```

## Workflow

1. Confirm the posting URL and company name with the student.
2. Run liveness first. If dead, stop -- report Skip, log it, do not
   proceed to Step 3.
3. Run the CPT/program-timeline check. If it fails, stop -- report Skip,
   log it, do not proceed.
4. If both gates pass, look up sponsorship history and funding, build a
   labeled `roles.json`.
5. Feed the `roles.json` to the existing scorer -- do not re-implement
   scoring logic.
6. Read the resulting composite score and recommendation; verify at least
   one row against the source data by hand.
7. Log the run in `logs/runs/2026fa-dmehta1310-1.md`.
