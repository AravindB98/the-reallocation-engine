# swe-ai-devops-sponsor-triage — prototype

Implements `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.md`
(lifecycle stage: DRAFT).

## Run it (one command, from the repo root)

```bash
bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh
```

This reads the real
`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`,
filters to tech companies with a nonzero H-1B approval count and a
Software-Engineer/AI/DevOps title match in `top_job_titles_sponsored`, writes
`run/roles.json` with only the roles whose posting was checked for liveness,
then hands that file to the repo's existing scorer (`npm run score`) to produce
`run/role-scores.json` and `run/role-scores.md`. Every other candidate is
written to `run/held-out.json` and `run/held-out.md` with the reason it was not
scored. If no posting was checked, the scorer is not run. Nothing is written
outside this folder's own `run/` subdirectory.

## Checking liveness (the gate)

1. List the postings to check in `liveness/posting-urls.csv`
   (`company_name,url,posting_title`; `company_name` exactly as in the CSV).
2. Run the repo's checker and save its output unedited:

   ```bash
   P=scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage
   npm run ats:liveness -- $(tail -n +2 $P/liveness/posting-urls.csv | cut -d, -f2) > $P/liveness/liveness-check.txt
   ```

   This needs Playwright's browser once: `npx playwright install chromium`.
3. Re-run `run.sh`. `active` → liveness 1.0 (`record`); `expired` → 0.0, which
   the scorer gates to Skip; `uncertain` or no posting → held out.
4. For an `uncertain` result, open the page yourself. If you can decide, add a
   row to `liveness/gate-decisions.csv`
   (`company_name,url,decision,decided_by,date,evidence,note`) with a
   screenshot. That role is then scored with liveness labeled `your-input`.

## Run the offline test

```bash
python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles_test.py -v
```

Fixture-based (`fixtures/mini-targets.csv`, plus `fixtures/posting-urls.fixture.csv`
and `fixtures/liveness-log.fixture.txt`, which are marked as fixtures), no
network calls, does not read the real 30k-row CSV.

## What Apply / Consider / Skip means here

- **Apply** — strong sponsorship history + title match, a posting that was
  checked and found live, and a healthy timeline. Re-check liveness first if
  the check is more than a few days old.
- **Consider** — same evidence, but either a soft sponsorship tier or a gate
  close to its floor.
- **Skip** — a closed gate (timeline already past, or the scorer's gate
  threshold) zeroes the score regardless of how strong the other evidence is.
  A healthy run skips at least half of what it evaluates.

## Known limitations

- Only companies with a chosen, checked posting are scored (5 of 386 in the
  2026-10-14 run, one of them on a human gate decision). The rest are held out until someone picks and checks a
  posting for them.
- The offline test and `build_roles.py` make no network calls; the liveness
  check is a separate, logged step using the repo's own checker.

## Options

```bash
python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles.py \
  --csv <path>            # default: the real 80-Days CSV
  --soc-csv <path>         # default: the real BLS compact CSV
  --opt-end-date YYYY-MM-DD   # default: 2027-03-15 (your-input placeholder)
  --hiring-lag-days N      # default: 45 (your-input assumption)
  --out-dir <dir>          # required
  --limit N                # cap emitted roles, for a quick smoke run
  --posting-urls <csv>     # postings chosen for checking (your-input)
  --liveness-log <txt>     # saved npm run ats:liveness output (record)
  --gate-decisions <csv>   # named human decisions on uncertain postings (your-input)
```
