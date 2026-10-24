# swe-ai-devops-skill-gap — prototype

## Executive summary

This prototype answers one question for an international master's student on F-1 OPT who applies
to software engineer, AI engineer and DevOps roles: which skills do companies that have sponsored
H-1B visas for those roles ask for right now, and which of them can the student already prove? It
reads real job postings from those companies' public job boards, counts skill mentions with the
repo's existing skill-demand monitor, and compares the three role families side by side. The
tracked run uses the course's fictional persona Aarav Patel (no real person's data is committed).
On the postings fetched 2026-10-19, his skills covered 42% of the top software engineering skill
mentions, 34% for DevOps and 24% for AI engineering. It also counts down to the visa deadline: the
earlier of the OPT end date and the day the allowed unemployment days (90, or 150 on STEM OPT) would
run out.

## Run it (one command, from the repo root)

```bash
bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
```

Needs Node 20+, and a `python3` with `requests` for the fetch step
(`pip install -r scripts/ats/requirements.txt`); point at another interpreter with
`PYTHON=/path/to/python3`. The fetch makes real network calls to `boards-api.greenhouse.io` and
`api.lever.co` (public job-board APIs, no key). A second run on the same day reuses that day's fetch;
`SKILL_GAP_DATE=2026-10-19` reuses that day's instead (the committed `run/` came from it).

| Step | What runs | Writes |
|---|---|---|
| 1 | `select_sponsors.py` — companies in the 80 Days CSV with H-1B approvals for software, AI or DevOps titles | `run/sponsors.json`, `run/sponsors.txt` |
| 2 | `scripts/ats/fetch-real-postings.py` (the repo's fetcher) for the top 40 by approvals | `private/real-postings/skill-gap/postings-<date>.json` (gitignored) |
| 3 | `split_families.py` — keep US postings with descriptions, drop word-for-word repeats, split by title into the three families | `private/.../family-<f>.json`, `run/families-summary.json` |
| 4 | `npm run skill-demand` (the repo's monitor), once per family, with this folder's taxonomy and profile | `run/<f>/skill-demand.json` + `.md` |
| 5 | `compare_families.py` — side-by-side view, company concentration, non-senior counts, gaps, visa-timeline gate | `run/skill-gap.json` (agent), `run/skill-gap.md` (person) |

Raw postings never leave `private/`. Tracked outputs hold counts, job ids and public posting URLs only.

Options (environment variables, all your-input; defaults are the fictional persona Aarav Patel from
`search/examples/aarav-patel/profile.yml`): `PROFILE` (default `profile/aarav-patel.json`),
`EAD_START` (default `2026-07-01`), `OPT_END_DATE` (default `2029-06-30`; empty = EAD start + 12
months), `UNEMPLOYMENT_DAYS_USED` (default `0`), `UNEMPLOYMENT_LIMIT` (default `150` for STEM OPT; 90
otherwise), `TOP` (default 40 companies), `SKILL_GAP_DATE` (which day's fetch to reuse). A real
student keeps their own profile and dates in `private/` and passes them this way; they are never
committed (DATA_CONTRACT: no real immigration details or profiles in tracked files).

Liveness is checked by hand, not by `run.sh` (a TODO in the recipe): `npm run ats:liveness -- <urls>`.
The 2026-10-21 check of the 5 non-senior DevOps postings is in `liveness/`.

## Run the offline tests

```bash
python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/test_skill_gap.py -v
```

20 tests, fixtures only (`fixtures/*`, all marked FIXTURE), no network. The comparison tests run the
repo's real `skill-demand-monitor.mjs` on fixture postings, so the skill count is never
re-implemented. The 3 tests of the Greenhouse patch are skipped, with a message, when `requests` is
not installed.

## Files

| File | What it is |
|---|---|
| `families.py` | the title rules for the three families and the US-location rule (your-input) |
| `taxonomy/swe-ai-devops-skills.json` | 68 skills: the repo's 36 AI-engineering skills unchanged, plus 32 software and DevOps skills (your-input) |
| `profile/aarav-patel.json` | the fictional persona's evidence: 14 skills from his résumé's skills section (your-input, fictional) |
| `select_sponsors.py`, `split_families.py`, `compare_families.py`, `run.sh` | the pipeline above |
| `test_skill_gap.py`, `fixtures/` | offline tests |
| `run/` | the outputs of the 2026-10-21 run on the 2026-10-19 fetch |
| `liveness/` | the liveness checker's output on 5 postings, and which postings and why |

## Declared patch to one maintained file

`scripts/ats/scrapers/greenhouse/scraper.py`: the board API URL now ends in `?content=true`, and
`normalize_job` fills `description_text` (plain text) and `description_html` from the job's
`content`. Without it, every Greenhouse posting arrived with an empty description, so a skill count
over Greenhouse companies had nothing to read. In the 2026-10-19 feasibility fetch, 4,851 of 5,066
postings had no description, including all 4,818 from Greenhouse; after the patch, 33 of 5,062 had
none, all from Lever. The repo's existing 117 scraper and greenhouse-watch tests still pass.

## Known limitations

- Only companies with a public Greenhouse or Lever board are fetched: 18 of the top 40 sponsors in
  the 2026-10-19 run. Microsoft, Intel, Uber and others are not covered.
- `skill-demand-monitor.mjs` cannot find its default taxonomy when the repo path contains spaces
  (it reads `new URL(import.meta.url).pathname` without decoding `%20`). This prototype always
  passes `--taxonomy` explicitly; the fix is listed as a TODO in the recipe.
- Counts are what postings mention, not what jobs require, and they mix senior and non-senior
  postings (the report shows the non-senior count per family).
- Only word-for-word duplicate postings are dropped; near-duplicates still count twice.
