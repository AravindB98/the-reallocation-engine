# backend-pivot-range — scripts

## Executive summary

**What this is.** Four small Python programs (standard library only, no AI calls). Together they answer one question for an international new-grad backend engineer: *of the backend-type jobs open right now, which are the thinking-heavy kind of work AI is least able to replace, and how sure can the government's occupation data actually be about that?*

**Why use it.** A job title does not say which official occupation it belongs to, and that choice moves the answer. In the U.S. Department of Labor's O*NET lists, "Back End Software Engineer" is filed under *Web Developers* (score 3.584, rated in 2017), while "Software Engineer, Backend" goes to *Software Developers* (3.834, rated in 2025): the same job in a different word order. The tool shows every candidate occupation and its measurement error, and it only calls two scores different when the gap is bigger than that error.

**What it decides.** Nothing. Each posting gets a suggested next step (prioritize, standard, note-routine, pin the occupation, research the occupation, check the posting, skip), with every value labeled as a record, a rule's judgment, or a human choice.

## Run it (from the repo root)

```bash
# 1. once: fetch O*NET 30.2, verify it against data/bls/BLS-audit.md, write the extracts in data/
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/ingest_onet.py --download --cache-dir ~/onet-cache
# 2. fetch today's postings from the public boards in config.json (a NEW folder each time)
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/fetch_postings.py --out-dir course/2026fa/submissions/ashwinthankachan26/mode-build/runs/fetch-$(date +%Y%m%d-%H%M%S)
# 3. run the mode offline on what was fetched
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles <fetch folder>/roles.json --today $(date +%F) --out-dir course/2026fa/submissions/ashwinthankachan26/mode-build/runs/pivot-$(date +%Y%m%d-%H%M%S)
```

Liveness gate on the shortlist, then the final run with the checker's saved output:

```bash
npm run --silent ats:liveness -- <PRIORITIZE and STANDARD urls> > <folder>/liveness.txt
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles <fetch folder>/roles.json --today $(date +%F) --liveness <folder>/liveness.txt [--liveness <later check>.txt] --out-dir <new folder>
```

Tests (offline, fictional fixtures plus one check against the committed real extract):

```bash
python3 -m unittest scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/test_pivot_range.py
```

## Files

| File | Network | What it does |
|---|---|---|
| `ingest_onet.py` | `www.onetcenter.org`, one GET (only with `--download`) | checks 5 O*NET files' SHA-256 against `data/bls/BLS-audit.md`, then writes `data/onet_elements_15.csv`, `data/onet_titles.csv`, `data/PROVENANCE.md` |
| `fetch_postings.py` | `boards-api.greenhouse.io`, one GET per board | keeps backend-adjacent US postings, removes emails and phone numbers, saves `roles.json` + `snapshots/` |
| `pivot_range.py` | none | the mode: writes `pivot-log.json` (for an agent) and `pivot-report.md` (for a person) |
| `blind_check.py` | none | v0.1.2: `make` a blind sheet of 20 random postings' duties (no tool reading shown); `score` the person's J/R labels against the tool |
| `lib_pivot.py` | none | pure functions used by all the scripts |
| `config.json` | — | every human decision (`your-input`), each with its reason |
| `data/` | — | the committed O*NET extract (CC BY 4.0, attribution in `PROVENANCE.md`) |
| `fixtures/` | — | fictional occupations (codes 98-, 99-) and fictional postings for the tests |

## How it fails (all exit 2, nothing written)

| Condition | Message starts with |
|---|---|
| `--today` is not a real date (e.g. `2026-02-30`) | `✗ --today:` |
| `--out-dir` already holds a run | `… already holds a run` |
| an output folder under `data/` | `refusing to write under data/` |
| the anchor occupation has no complete score | `anchor … has no complete pivot score` |
| a stored `cognitive_pivot_score` in the repo table ≠ the score recomputed from its nine ratings | `stored cognitive_pivot_score for …` |
| a pin in `config.json` without a reason | `pin for "…" needs both onet_soc_code and a reason` (or `out-of-target pin for "…" needs a reason`) |
| duplicate or missing `role_id`; snapshot without `fetched_at` | the field named |
| (ingest) an O*NET file whose SHA-256 differs from the repo audit | `…: SHA-256 … ≠ the repo audit's …` |

## Labels

- `record`: copied from a source without change (posting title and sentences, O*NET ratings, SEs, dates, title lists, BLS wages, board listing time, `ats:liveness` result).
- `model-judgment`: a rule applied to records (pivot standard error, "distinguishable", contained-title match, the duties reading, next action). No language model is used anywhere.
- `your-input`: a human choice in `config.json` (anchor, scope, z, family rules, pins, phrase lists, liveness age).
