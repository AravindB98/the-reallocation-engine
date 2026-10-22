# ethangomes14 — Reallocation Engine mode build (Data Engineer H-1B sponsor screen)

**Domain:** F-1 master's student, final semester before OPT, seeking new-grad Data Engineer roles anywhere in the US, needing H-1B sponsorship.
**Lifecycle reached:** RUNNABLE-LIVE (v0.5.1; live run on 2026-10-21 with every gate cleared by Ethan Gomes). RUNNABLE-SAMPLE was reached on 2026-10-20 (v0.5.0, a real run on 19 postings found that day).

| Deliverable | File |
|---|---|
| 1. Mode file (agent) | `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md` |
| Mode file (human card) | `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.card.md` |
| 2. Domain justification | `JUSTIFICATION.md` |
| 3. Worked run, verification, attestation, reflection | `WORKED-RUN.md` |
| 4. RUN_LOG entries | `RUN_LOG-ENTRY.md` (filed as `logs/runs/2026fa-ethangomes14-6.md`, the sample run, and `-7.md`, the live run with gate decisions) |
| Presentation outline (5 min) | `PRESENTATION.md` |
| Frictional log, 2026-10-20 to 2026-10-21 (my reflection, then what happened, day by day) | `FRICTIONAL.md` |
| Run outputs and terminal transcripts | `runs/` |
| Code (new and edited) | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/` |
| Test report (every check, run and break attempt, pasted) | `TEST-REPORT.md` |
| Change brief (what changed in v0.5.0–v0.5.1, why, who decided) | `CHANGE-BRIEF.md` |
| Sources and who did what | `SOURCES.md` |
| Submission sheet | `SUBMISSION.md` |
| Same documents, in the folder `CONTRIBUTING.md` names | `course/2026fa/submissions/ethangomes14/` (identical copies) |

## What's new in v0.5.1 (2026-10-21)

- **Live run** with every gate cleared by the author, logged in `logs/runs/2026fa-ethangomes14-7.md`: Apply 8 · Consider 10 · Skip 1 · unscored 0.
- **`--mode sample|live`.** The log had hardcoded `sample`.
- **Local dates in all three scripts.** The network scripts had stamped an evening check with tomorrow's UTC date. Found on the live run; 2 new tests (23 in all).
- **`samples/aliases-2026-10-20.json`**, a frozen pre-review alias file, so the sample run still reproduces.

## What's new in v0.5.0

- `find-greenhouse-postings.mjs`: discovery from public Greenhouse boards (allowed host `boards-api.greenhouse.io` only); writes a skeleton with `fit: null`.
- `aliases.json` + `matchCompany`: a brand → legal-name alias table, used only after exact matching fails and only once a person has reviewed it. Closes the `[TODO: DEV]`.
- A posting-age flag (`rules.posting_age`), shown and never scored.
- A fit floor (`rules.fit_floor`, author's decision): an Apply with fit below 0.4 is capped at Consider, after the scorer. Closes the `[TODO: DEFINE]` raised by this run.
- Title rule: `account executive` and `sales` excluded, after a real false positive.
- Tests: 15 → 21.

## Reproduce (from the repository root)

The live run (2026-10-21; uses the reviewed `aliases.json`):

```bash
node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode live --today 2026-10-21 \
  --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json \
  --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt \
  --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json \
  --out-dir /tmp/de-h1b-live
python3 -I assignments/submissions/ethangomes14/runs/verify-against-csv.py /tmp/de-h1b-live/screen-log.json
```

Expected: Apply 8 · Consider 10 · Skip 1 · unscored 0 (2 capped by the fit floor); 19/19 values match.

The sample run (2026-10-20; uses the frozen, pre-review alias file):

```bash
node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 \
  --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json \
  --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt \
  --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json \
  --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json \
  --out-dir /tmp/de-h1b-check
node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
python3 -I assignments/submissions/ethangomes14/runs/verify-against-csv.py /tmp/de-h1b-check/screen-log.json
```

Expected: Apply 5 · Consider 8 · Skip 1 · unscored 5 (2 capped by the fit floor); 23/23 tests; 19/19 values match.

No personal data: the persona is fictional, and nothing from `private/` or `data/ats/` was read or copied.
