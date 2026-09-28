# ghost-job-radar -- card

## What it verifies

- Whether a specific job posting URL currently resolves as live, for a
  supported ATS (Greenhouse, Lever, Ashby, SmartRecruiters).
- Whether a company appears in the sponsorship-history sample and what
  tier it's recorded at.
- Whether a company appears in the Form D funding sample and how recent
  the filing is.
- Whether a stated hiring-lag estimate is arithmetically compatible with a
  stated CPT/program end date.

## What it cannot verify

- Whether a company will actually respond to an application, even when
  every gate passes.
- Sponsorship likelihood for a company absent from the sample data --
  absence is "not in the sample," not "no."
- How long this specific company's hiring process will actually take --
  the lag estimate is student input, not a record.
- Liveness for postings on ATS platforms the detection script doesn't
  recognize -- these return "unknown," not "dead."

## Dependencies

- `scripts/ats/check-liveness.mjs` (existing, via `npm run ats:liveness`)
- `data/80-days-to-stay/` (sponsorship history sample)
- `data/sec/form-d/processed/sample/*.sample.json` (funding sample --
  quarters only, not the full dataset)
- `scripts/score/role-scorer.mjs` (existing, unmodified -- fed a
  `roles.json` shaped like `data/examples/ch11-roles.json`)
- Proposed, `[TODO: DEV]`:
  `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py` and
  `.../build_roles_json.py`

## Annotated commands

Liveness check on a dead posting (expected: `dead` -> Skip, no
funding/sponsorship computed):

```bash
npm run ats:liveness -- --file data/ats/job-urls.txt
```

CPT/program-timeline gate, tight window (expected: `fail` -> Skip):

```bash
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2026-11-01 --lag-weeks 8
```

CPT/program-timeline gate, comfortable window (expected: `pass`):

```bash
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2027-05-15 --lag-weeks 6
```

Full run through the existing scorer (expected: `role-scores.json` and
`role-scores.md` written to the run folder):

```bash
npm run score -- course/2026fa/submissions/dmehta1310/runs/roles.json --out-dir course/2026fa/submissions/dmehta1310/runs
```

## What it produces

- `roles.json`, labeled record / model-judgment / your-input, shaped for
  the existing scorer.
- `role-scores.json` (machine-readable) and `role-scores.md`
  (human-readable), produced by `role-scorer.mjs` -- unchanged from the
  existing tool.
- A run-log entry at `logs/runs/2026fa-dmehta1310-1.md`.

## Named failure modes

1. **Unsupported-ATS blind spot** -- a posting URL isn't from a supported
   platform; liveness returns "unknown," which could get misread as
   "safe to proceed." Mitigation: treat "unknown" as a stop, not a pass,
   and log it explicitly as unverified rather than live.
2. **Sample-data absence misread as "no"** -- the Form D sample covers only
   some quarters; a missing company record could get treated as "not
   funded." Mitigation: label absence "no record in sample," never "not
   funded," in both the JSON and the Markdown report.
3. **Hiring-lag estimate treated as fact** -- the CPT/program-timeline gate
   depends on a student-supplied lag estimate; a stale or optimistic
   estimate could pass a role that will never close in time. Mitigation:
   require the student to state where the estimate came from at the human
   gate, and re-confirm it before trusting a "pass" result.
