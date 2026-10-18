# wage-level-floor — scripts

## Executive summary

**What this is.** The code behind the wage-level-floor mode: two download steps (the Department of Labor wage table, and today's job-board pay ranges) and one offline step that places each pay range on the four H-1B wage levels.

**Why read it.** To run the mode, test it, or change it. The recipe says what should happen; these scripts are what does.

**What it does.** Downloads are kept apart from judgment: only `fetch-oflc.sh` and `fetch-pay-ranges.mjs` use the network, and they only write files. `wage-level.mjs` reads those files and never fetches. Its tests fail if it tries.

## Files

| File | Network | Does |
|---|---|---|
| `fetch-oflc.sh [wage-year]` | flag.dol.gov | download the OFLC zip → `data/dol/oflc/raw/<wy>/` (gitignored) + `fetch.json` with sha256 |
| `extract-oflc.mjs` | no | raw `ALC_Export.csv` → `data/dol/oflc/compact/alc-<wy>-ma-nh-soc15-17.csv` + provenance; refuses a raw file whose hash changed |
| `fetch-pay-ranges.mjs --out <file>` | Greenhouse, Ashby board APIs | one snapshot: per posting, `pay_structured` (ATS field) and `pay_text` (regex), kept separate |
| `wage-level.mjs --snapshot <file> --out-dir <dir>` | **no** | placement → `wage-level.log.json` + `wage-level.report.md` |
| `lib.mjs` | no | CSV parsing, level / band rules, location mapping, timeline gate |
| `board-map.json` | — | your-input: 21 boards, `identity_confirmed: false` |
| `persona.example.json` | — | FICTIONAL persona; copy to `private/` for real dates |
| `test/wage-level.test.mjs` | no (fetch stubbed to throw) | 19 tests, incl. five break cases |

## Run

```bash
bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-pay-ranges.mjs --out private/wlf/pay-snapshot.json
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs --snapshot private/wlf/pay-snapshot.json --out-dir private/wlf
node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs
```

The committed run (fictional persona, real boards) is in `course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/`.

## Exit codes (`wage-level.mjs`)

`0` ok · `2` input missing, schema drift, or output folder not allowed (nothing written) · `3` authorization end date past/missing (nothing written)
