# Mode Build submission — salonimathure20 — opt-countdown v0.2

## Summary

**What this is.** The Mode Build Assignment submission for one Reallocation Engine mode, *opt-countdown*. It triages job postings for an international master's student on F-1 OPT by asking one question first: can this employer hire you before your 90-day unemployment clock runs out? It ran live on 2026-10-21 against twelve real postings.

**Why read it.** This folder holds the justification, the worked run with unedited output, the run-log entry and the talk notes. The mode itself, its scripts and its tests are elsewhere in the tree (paths below).

**What it found.**

- For a student with 35 days left, no posting was worth applying to now.
- One "top sponsor" posting refuses sponsorship in its own text.
- v0.1's only "Apply" had closed within 18 days.
- The engine's shared scorer recommends "Apply" for a role with zero fit if the company sponsors enough.
- The mode stays at lifecycle stage **DRAFT**: five typed TODOs are open and the human sign-off is pending.

## Contents

| Deliverable | Path |
|---|---|
| 1. Mode file (agent) + card (human) | `recipes/cases/2026fa/salonimathure20-opt-countdown.md` · `.card.md` |
| 2. Domain justification | `assignments/submissions/salonimathure20/DOMAIN-JUSTIFICATION.md` |
| 3. Worked run, real output, verified-vs-inferred, attestation, reflection | `assignments/submissions/salonimathure20/WORKED-RUN.md` (generated from `WORKED-RUN.src.md` by `build-worked-run.mjs`) |
| 4. RUN_LOG entry | `logs/runs/2026fa-salonimathure20-2.md` (copy: `RUN_LOG-ENTRY.md`) |
| Show-and-tell notes | `PRESENTATION-NOTES.md` |
| Raw terminal output | `runs/live-2026-10-21/terminal/` (00–09) |
| Run outputs (agent log, human report, scorer files) | `runs/live-2026-10-21/out/` |
| Break-attempt inputs (fictional) | `runs/live-2026-10-21/break-inputs/` |
| Independent verifier | `verify-run.py` |
| Offline re-run of steps 04–06 | `rerun-offline.sh` |

## Code changed or added

| File | What |
|---|---|
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs` | **new**: the one network step; dated Greenhouse status + posting-text facts |
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/lib.mjs` | v0.2 functions: freshness, G2b, posting age, experience gap, alias lookup |
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs` | `--mode live`, `--posting-evidence`, `--aliases`; G2b before scoring; report sections |
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/aliases.json` | **new**: employer alias table |
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown-v02.test.mjs` | **new**: 8 tests (20 total) |
| `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/` | **new**: live-run inputs and saved evidence (fictional persona, public postings) |
| `scripts/ats/liveness-browser.mjs` | **shared-file patch**: redirected-off-job URLs read `uncertain`, not `active` |

## Reproduce

```bash
npm install
node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/
bash assignments/submissions/salonimathure20/rerun-offline.sh
python3 assignments/submissions/salonimathure20/verify-run.py assignments/submissions/salonimathure20/runs/live-2026-10-21/out scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/persona.json data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
```

**Privacy.** The persona is fictional. No file here contains a real résumé, tracker, contact or application note. `npm run doctor` and `node scripts/pii-scan.mjs --diff origin/main` were run before committing (output in `terminal/00`).
