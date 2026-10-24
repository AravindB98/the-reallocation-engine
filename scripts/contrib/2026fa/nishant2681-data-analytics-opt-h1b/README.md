# nishant2681-data-analytics-opt-h1b — prototype

## Executive summary

This folder holds a small working prototype that sorts data and analytics job
postings into apply, network first, or drop. It is for a candidate on
post-graduation work authorization who needs visa sponsorship. It looks up
each employer's public sponsorship record, checks that the posting is live,
and checks whether the hire can start before the unemployment deadline. It then
hands the result to the engine's existing scorer, unchanged. The sample uses a
fictional candidate and invented postings, so it shows the method, not real
advice.

## Run record

- Recipe: `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md` (RUNNABLE-SAMPLE, v0.2.0)
- Design: `course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md`
- Requires: Python 3 with PyYAML (already used by `scripts/conformance.mjs`), and
  `node` on PATH for the existing scorer. Nothing to install.

## Run it

From the repo root:

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --uscis   scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv \
  --today   YYYY-MM-DD \
  --run-id  <run-id> \
  --out-dir course/2026fa/submissions/nishant2681/runs/<run-id>
```

`--uscis` is required from recipe version 0.2.0. It is used only for
employers with no row in the main CSV.

To rebuild the USCIS extract from the full file (downloaded to the gitignored
`data/80-days-to-stay/scratch/uscis-fy2022/`, never committed), see the
command in `extract_uscis.py` and the record in
`fixtures/uscis-fy2022.extract.provenance.md`.

- **Exit codes:** 0 on success. 2 on any validation stop: an ambiguous
  company, a bad liveness label, a missing profile field, malformed JSON, or an
  existing out-dir. Nothing is written in those cases. 1 if the scorer itself
  fails; the partial output is then kept in `<out-dir>.partial/`.
- **Choose a new run id each time.** A finished `--out-dir` is never
  overwritten.
- **Evidence paths** in the jobs file are read relative to the folder you run
  from (the repo root).

## Test it

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
```

The tests are offline (58 tests). They use the 10-row fixture CSV and the
4-row USCIS extract, and the existing scorer runs as a local `node` call. One
test is a deliberate break attempt: it checks that the cap test catches
`fixtures/BROKEN-uscis-no-cap.py`.

## Files

| File | What it does |
|---|---|
| `sponsorship.py` | Piece 1: finds the company in the CSV (stops on ambiguous names) and assigns the sponsorship tier and p from the brief's rules; if the CSV has no row, looks the employer up in the USCIS extract (exact match, capped at Possible) |
| `extract_uscis.py` | Builds `fixtures/uscis-fy2022.extract.csv` from the full USCIS file: only sample employers missing from the CSV |
| `gates.py` | Piece 2: the liveness gate (label → factor) and the timeline gate (factor plus every date that produced it); reads the persona profile |
| `run_sample.py` | Piece 3: validates every job first, builds the scorer's inputs, runs `scripts/score/role-scorer.mjs` as a subprocess, and writes the outputs |
| `report.py` | Writes `report.md` and `<run-id>-audit.md` from the run log |
| `fixtures/companies.sample.csv` | 10 real CSV rows, with only the 8 sponsorship/funding columns |
| `fixtures/jobs.sample.json` | 8 fictional postings that exercise every tier and both gates |
| `fixtures/jobs.ambiguous.json`, `fixtures/jobs.bad-liveness.json` | Inputs that must stop the run |
| `fixtures/visa.*.yml` | Fictional visa-only profiles: days used up, OPT ended, ceiling missing |
| `fixtures/uscis-fy2022.extract.csv` | 4 real USCIS FY2022 rows (WAYFAIR LLC); provenance in `fixtures/uscis-fy2022.extract.provenance.md` |
| `fixtures/BROKEN-uscis-no-cap.py` | A deliberate mutant (tier cap removed) that the tests must catch; never used by a run |
| `tests/` | `unittest` suites for each piece, plus an end-to-end run |

## Outputs (in `--out-dir`)

- `run-log.json`, for the agent:
  - every input with its sha256 fingerprint;
  - every role's tier evidence, gate values and dates;
  - the scorer command and exit code.
- `report.md`, for the person:
  - the summary first, then one row per role;
  - every input value labeled `record`, `your-input` or `model-judgment`;
  - scorer results labeled `scorer output`.
- `<run-id>-audit.md`: plain counts (matched, unmatched, Unknown, gated, tiers,
  decisions).
- `scorer-input/` and `scorer/`: the exact files sent to and returned by the
  existing scorer.

## What the prototype cannot do

- **Per-title counts:** approvals are per company, and a title match only
  means the title appears in the employer's top sponsored titles.
- **The posting's own title:** the tier uses the candidate's target-title list,
  so every posting at one company gets the same tier.
- **Absent employers:** an employer missing from both the CSV and the USCIS
  extract stays Unknown. One found only in USCIS (Wayfair) is capped at
  Possible: USCIS has no job titles, and FY2022 is not current.
- **Live liveness checks:** labels are typed into the jobs file. It never calls
  `npm run ats:liveness` itself, so a label counts as `record` only when a
  saved check output exists at its `evidence_path`.
- **Funding:** shown as context, but not scored; its weight is 0 by the
  candidate's decision (recipe addition 7).
- **Role quality:** not judged. The CSV has no occupation code, and the
  scorer's role-quality weight is 0.
- **Legal and status questions:** it cannot tell whether the candidate is
  currently employed, whether they are STEM-eligible, or answer any
  immigration-law question.
- **Reproducibility of the scorer's date:** `--today` fixes the gate
  arithmetic, but the scorer stamps its own `generated` date from the real
  clock.
