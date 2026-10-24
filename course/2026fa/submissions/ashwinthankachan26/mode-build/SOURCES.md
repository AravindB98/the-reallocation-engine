# Sources and AI assistance — backend-pivot-range

## Executive summary

This lists everything the Mode Build submission is built on: the course repository and its rules, the public data, the public job postings, and the part an AI assistant played. Nothing came from a private source, a résumé, or a classmate's submission. One classmate's public finding is credited by name.

## Repository and rules (read 2026-10-20, `upstream/main` `015843d`)

- `SNICKERDOODLE.md` (P1–P9, lifecycle, TODO closure, attestation format), `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md` §Zero-Conditions, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/contrib-gate.yml`, `recipes/README.md`, `recipes/_shared.md`
- `course/summer-2026/reallocation-engine-mode-build.md`, identical to the Canvas Mode Build brief
- `scripts/bls/extract-soc-occupation-table.py` → `cognitive_pivot_score()` (the nine ratings); `data/bls/BLS-audit.md` (SHA-256 pins); `data/bls/compact/soc_occupation_compact.csv`
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`), `scripts/score/role-scorer.mjs` (`npm run score`)

## Data (each checked on the date shown)

| Source | URL / path | Checked | Licence |
|---|---|---|---|
| O*NET 30.2 Database, text format | https://www.onetcenter.org/dl_files/database/db_30_2_text.zip (zip SHA-256 `b5479271931796b838f7173dc0f673a9ec961b7833ac87168fd11e92e7453741`) | 2026-10-20, 5 files = `data/bls/BLS-audit.md` | CC BY 4.0, USDOL/ETA. Attribution in `scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/data/PROVENANCE.md` |
| Greenhouse public job-board API | `https://boards-api.greenhouse.io/v1/boards/<token>/jobs?content=true`, 11 boards | 2026-10-20T14:41:26Z | public postings; quoted for analysis, contacts removed |
| Anthropic Economic Index (proposed, not used) | https://huggingface.co/datasets/Anthropic/EconomicIndex | 2026-10-20: dataset page lists O*NET task mappings since the 2025-02-10 release; latest listed release 2026-06-26; data CC BY | — |
| DOL OFLC LCA disclosure data (proposed, not used) | https://www.dol.gov/agencies/eta/foreign-labor/performance | 2026-10-20: lists LCA Programs (H-1B, H-1B1, E-3) disclosure files, newest FY2026 Q3. **Not yet confirmed** that the record layout carries SOC code and job-title fields | — |

## Credit

- **PR #50 (BESWATHI, `cogpivot-unprofiled`)** found that 122 of 1,016 occupations have no `cognitive_pivot_score`. This mode cites that finding and does not re-claim it. Its own contribution is different: title→occupation ambiguity, O*NET standard errors and rating dates, and the posting-level reading.
- **My Recipe Design submission (PR #41)**: the 9 Boston board tokens in `config.json → fetch.boards` came from it. No code from it was reused; this mode is new Python.

## AI assistance — what it did and what I did

**Claude (Anthropic), in Claude Code, 2026-10-20**, at my request:

- **Claude did:**
  - read the Canvas brief and the repo rules, and mapped where CI overrides the brief's paths;
  - found the O*NET title-ambiguity, standard-error and rating-date facts, and checked them against the raw O*NET files;
  - proposed the mode;
  - drafted `config.json` (every value marked as awaiting my approval);
  - wrote the tests first, then `lib_pivot.py`, `pivot_range.py`, `ingest_onet.py` and `fetch_postings.py`;
  - downloaded O*NET, fetched the postings, ran the mode three times, ran `npm run ats:liveness` on 90 URLs, and ran the verification and the four break attempts;
  - found and fixed its own defects (listed in WORKED-RUN *Broke during testing*);
  - drafted every document in this folder, the recipe and its card, and run log 6.
- **I decided:**
  - to build a new mode for Mode Build rather than resubmit my Recipe Design mode;
  - the topic (option A, Cognitive Pivot);
  - to download O*NET;
  - to fetch fresh postings rather than reuse old ones;
  - to keep PR #41 open and ask the TA.
- **Done by me on 2026-10-21 (in chat, recorded by Claude):**
  - approved every config value as drafted;
  - pinned the 3 SRE postings with my reason, and marked the 2 Developer Advocate postings "Outside my backend target";
  - opened all 18 unconfirmed postings (all open);
  - agreed with the logged duties-rule example;
  - set my G5 rule and chose 6 postings to tailor for;
  - re-ran the tests;
  - signed the attestation;
  - checked the title split myself on O*NET OnLine ("Back End Software Engineer" → Web Developers first);
  - decided TODO #3: "Keep separate".
- **Still mine to do:**
  - optionally label the blind sheet;
  - push, open the PR, upload the zip;
  - present.

**Persona:** the user of this mode is the repo's fictional persona Aarav Patel (`search/examples/aarav-patel/`), as `DATA_CONTRACT.md` requires. No real personal profile is used.

No language model is called by the mode itself: every score, band and reading is a stated rule over recorded data.
