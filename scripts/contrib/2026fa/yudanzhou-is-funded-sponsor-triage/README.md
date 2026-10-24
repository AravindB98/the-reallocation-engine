# yudanzhou-is-funded-sponsor-triage

## Executive summary

A small prototype for an Information Systems master's student who prefers funded companies and needs H-1B sponsorship. It reads the shipped 80-Days CSV, finds which funded companies have actually sponsored H-1B and for which analyst-type role family, turns a list of postings into a `roles.json`, and hands that to the repo's existing scorer for Apply / Consider / Skip. Companies with no sponsorship record go to a networking list instead of being skipped. Every value is labeled `record` or `your-input`; no model judgment is used.

Recipe: `recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md` (agent) and `.card.md` (human).

## Run (one command, from the repo root)

```bash
python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02
```

Writes to `course/2026fa/submissions/yudanzhou/runs/triage/`: `roles.json`, `role-scores.json`, `role-scores.md` (from the existing scorer), `triage-log.json` (agent), `triage-report.md` (human). Omit `--today` to use the real date.

Options: `--persona`, `--postings`, `--config`, `--csv`, `--form-d`, `--out-dir`, `--no-score`.

## Test (offline, fixtures only)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v
```

## Files

| File | What | Label |
|---|---|---|
| `triage.py` | the prototype | — |
| `test_triage.py` | 11 offline tests, one per predicted failure case | — |
| `config.json` | role-family keywords, approval-count → tier/p mapping, staleness threshold | `your-input` |
| `search/examples/is-ms-2027-funded-undecided/persona.example.json` (in search/examples/, per DATA_CONTRACT) | fictional persona (no real person) | `your-input` |
| `fixtures/postings.sample.json` | demo postings at real CSV companies; postings are invented | `your-input` |
| `fixtures/test-companies.csv` | 6 invented companies for tests (555 phone numbers, example.com) | test fixture |

## Requirements

Python 3.9+ (standard library only) and Node 20+ (for `scripts/score/role-scorer.mjs`). On Windows, `python3` and `python` may be different installs. Either works, since no packages are needed.
