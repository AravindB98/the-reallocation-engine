## Executive summary

This folder holds the script behind a draft mode for international graduates weighing product manager postings while their allowed unemployment days run down. For each posting it checks whether the posting still looks open (with a deliberately fake twin posting as a control), looks the employer up in a public sponsorship record, and only then passes the posting to the repository's scorer. A posting where a check cannot give a clear answer is put on hold for a person instead of being guessed. So far it has only been run on invented test data; the live run comes next.

## What is here

| File | What it is |
|---|---|
| `live_sponsor_gate.py` | Gates G0-G5 of `recipes/cases/2026fa/shinde-pras-pm-apm-live-sponsor.md` |
| `test_live_sponsor_gate.py` | 30 offline unittest cases (invented companies, `example.com` hosts, no network) |
| `fixtures/companies.csv` | Invented sponsorship rows covering every rule v0.1 row and every match state |
| `fixtures/liveness-canned.txt` | Canned `ats:liveness` output for replay and parser tests |
| `fixtures/inputs.example.json`, `fixtures/human.example.json` | Example input shapes (invented) |

## Run

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor -v
```

```bash
python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs private/<run>/inputs.json --out-dir private/<run>/out
```

Options: `--human <human.json>` (second pass with a person's answers), `--liveness-from <saved output>` (replay instead of opening a browser), `--canned` (the replayed file is a test fixture; only then is the run labelled `mode: sample`), `--no-score`, `--csv <path>` (defaults to the 80-Days CSV).

Two passes: pass 1 prints each CANDIDATE posting's candidate legal names (up to 5, plus the total) and writes them to `out-dir/candidates-private.txt`; the person copies one exact name into `human.json` as `confirm_row`, records any open/closed liveness checks, and runs pass 2 with `--human`. `run-log.json` records `liveness_source` (`live`, `replay` or `canned`) and `captured_at` (UTC).

Real inputs and every output belong in a git-ignored folder such as `private/`. The script refuses an out-dir inside the repository that is not ignored. `out-dir/liveness-raw.txt` (raw tool output, including URLs) and `out-dir/candidates-private.txt` (CSV legal names) are private by design; the self-check covers `run-log.json`, `report.md` and the scorer outputs, which must contain no raw URL, hostname, posting company name or CSV company name, and deletes them if one appears.

## Size

`live_sponsor_gate.py` is 512 lines, over the ~300-line target. It stays one file by decision: the gates share one in-memory mapping from raw inputs to posting and host references, and keeping that mapping in a single module is the simplest way to guarantee it is never written out. A section map at the top of the file lists the parts.

## Behaviour notes

- One `ats:liveness` call checks every posting and its control. Exit code 1 is normal; the script reads the per-URL lines. A `Fatal:` line, a missing `Results:` line or a URL mismatch stops the run.
- The company-name normalizer is the repository's own (`scripts/ats/scrapers/common/normalize.py`), loaded by file path so the scraper package's network dependencies are not needed.
- Rule v0.1 helpers are reused from PR #16 (`pm_opt_clock.py`), as cited in the code.
- The script stops if the profile's authorization text would make the scorer drop the sponsorship weight (for example any text containing "authorized").
- Under rule v0.1 the decision is Consider, Skip or HOLD; Apply is not expected.

## Known limitations

- On a replay (`--liveness-from`), `captured_at` is the raw file's modification time. That is an approximation of when the live call ran: the file is written when the call finishes, so it can be some seconds later than the live run's own `captured_at`, which records when the call started.
- In `report.md`, a value the record does not have is shown as "not recorded"; `run-log.json` keeps it as null.
- The out-dir safety check uses git for folders inside the repository and stops (out_dir_unverifiable) if git cannot answer; the safest choice is an out-dir outside the repository or under the ignored private/ folder.

## Not enforced by the script

The eligibility refusal in the mode file's Stop conditions is a rule for the person or the LLM running the mode, not for this script: never answer whether someone is eligible for, or will receive, sponsorship; refer them to the school's international student office or an immigration attorney.
