# ghost-job-radar -- card

## Executive summary

**What this is.** A one-page summary of a mode for an international
master's student looking for data analyst jobs: it checks whether a posting is
still open and whether there is enough time left on the student's work
authorization, then looks at the company's visa-sponsorship history.

**Why read it.** It tells you in a minute what the mode can and cannot
know before you rely on it.

**What it found.** One real run (2026-10-19, one public posting) went through
every step. It also showed that the liveness tool cannot say "removed" for a
Greenhouse job and cannot say "site not supported". Status: sample-run level.

## What it verifies

- Whether a specific posting URL returned `active` from a real browser check at a stated time (exit code 0).
- That a made-up job id on the same public board does not return `active`.
- Whether a company appears in the 80 Days sponsorship/funding CSV and what approvals, denials, funding stage and date the row records.
- Whether a stated hiring-lag estimate is arithmetically compatible with a stated CPT/program end date.

## What it cannot verify

- Whether a removed Greenhouse job is definitely removed: the tool returned `uncertain`, not "removed" (the public API returned HTTP 404 for the same id; scripting that check is proposed, not built).
- Whether a site is supported: for `example.com` the tool returned `expired` (HTTP 404), not "unsupported". Earlier drafts of this card said unsupported platforms return "unknown"; today's run did not show that.
- Sponsorship for this role, this year. The CSV gives company-level historical approvals only.
- How long this company's hiring takes -- the lag is the student's estimate.
- Role quality: the scorer's `role_quality` weight is 0.0 and it takes no occupation code, so SOC 15-2051 does not affect the score.
- Whether the `fit` value means anything -- 0.7 is a default labeled model-judgment.
- Whether anyone will respond to an application.

## Dependencies

- `scripts/ats/check-liveness.mjs` (existing, via `npm run ats:liveness`; needs Playwright Chromium)
- `scripts/ats/scan.mjs` (existing; run `--dry-run` from a scratch directory with a public portals file so private `data/ats/` files are not read)
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/bls/compact/soc_occupation_compact.csv` (context only; not read by the scorer)
- `scripts/score/role-scorer.mjs` (existing, unmodified)
- `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py` and `build_roles_json.py` (built, 6 and 10 tests pass)

## Annotated commands

Liveness on an open public posting (2026-10-19: `active`, exit 0):

```bash
npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/8189909
```

Liveness on a made-up id, same board (2026-10-19: `uncertain`, exit 1 -- treated as STOP):

```bash
npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1111111111
```

Timeline gate, comfortable window (expected and seen: `pass`):

```bash
python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2027-05-15 --lag-weeks 6
```

Scorer on the labeled roles file (2026-10-19: composite 0.525, scorer bucket Apply; made-up id: 0.000, scorer bucket Skip because the liveness gate closed):

```bash
npm run score -- <roles.json> --out-dir <dir> --md <dir>/role-scores.md
```

## What it produces

- `roles.json`, labeled record / model-judgment / your-input.
- `role-scores.json` (agent) and `role-scores.md` (human), from the unmodified scorer. The scorer's Apply / Consider / Skip is a **scorer bucket**, not advice.
- A per-run log in `logs/runs/`.
- Raw evidence in `assignments/submissions/dmehta1310/evidence/2026-10-19/`.

## Named failure modes

1. **`uncertain` read as "maybe open".** A removed Greenhouse job came back `uncertain`. Mitigation: treat `uncertain` as STOP; the pipeline maps it to liveness factor 0.0.
2. **Company history read as role-level sponsorship.** A high company approval count says nothing about this role this year. Mitigation: label the number "company-level, historical" in every report.
3. **Absence in the sample read as "no".** Label "no record in sample", never "not funded" or "will not sponsor".
4. **Hiring-lag estimate treated as fact.** Require the student to say where the estimate came from.
5. **A site the tool does not understand mislabeled.** The generic check can return `expired` for a page that is simply not a job board; verify unfamiliar sites by hand.
