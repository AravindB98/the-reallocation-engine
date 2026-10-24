---
owner: salonimathure20
term: 2026fa
component: opt-countdown
status: DRAFT
promoted_to: null
---

# opt-countdown — prototype

## Summary

This small program checks job postings for an international student on F-1 OPT. For each posting it asks whether the employer has a record of H-1B approvals, whether the posting is still real, and whether the employer can hire before the student's OPT unemployment clock runs out. It turns that evidence into labeled inputs for the engine's existing scorer and writes two outputs: a machine log and a plain report. A posting with missing evidence is *blocked* for a person to check, never scored on a guess.

Recipe: `recipes/cases/2026fa/salonimathure20-opt-countdown.md` (and `.card.md`), **v0.2.0**.

**v0.2 (2026-10-21)** adds a live mode. It saves dated posting evidence from the Greenhouse API and blocks evidence more than 2 days old. It reads the posting text (an explicit no-sponsorship sentence closes the role before scoring, gate G2b; years asked; pay). It also adds an employer alias table. Run without flags, the program still reproduces the v0.1 sample run unchanged.

## Run it live (from the repo root, Node 20+)

```bash
F=scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21
node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates $F/candidates.json --dry-run
node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates $F/candidates.json --out $F/posting-evidence.json
npm run ats:liveness -- --file $F/urls.txt > $F/liveness.txt 2>&1
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --mode live --persona $F/persona.json --candidates $F/candidates.json --liveness $F/liveness.txt --posting-evidence $F/posting-evidence.json --out-dir <out>
```

Only `posting-evidence.mjs` and `ats:liveness` touch the network. `opt-countdown.mjs` is offline. Re-running the first two steps on a later day replaces the 2026-10-21 evidence, so use your own folder.

## Run the v0.1 sample (offline, no flags)

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
```

It reads the real CSVs (`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/bls/compact/soc_occupation_compact.csv`) and `fixtures/worked-run/` (2026-10-03). It writes `opt-countdown-log.json` (agent), `opt-countdown-report.md` (human) and the scorer's own `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md` to `course/2026fa/submissions/salonimathure20/runs/opt-countdown/`.

Flags: `--persona --candidates --liveness --greenhouse-api --posting-evidence --aliases --sponsors-csv --soc-csv --out-dir --mode sample|live`.

Exit codes: `0` complete · `2` bad input (unlabeled value, missing field, unparseable file, bad `--mode`, live mode without posting evidence) · `3` halted at the runway gate (OPT end date past or unemployment clock exhausted). `posting-evidence.mjs`: `0` written · `2` bad input · `4` a network error on any request.

## Test it (offline)

```bash
node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/
```

20 tests. `opt-countdown.test.mjs` (12, v0.1) covers:

- CSV parsing and the sponsorship mapping;
- blank-record and missing-company handling;
- runway and timeline arithmetic;
- the Greenhouse-404-beats-browser-checker rule;
- three end-to-end runs through the real scorer.

`opt-countdown-v02.test.mjs` (8) covers:

- the no-sponsorship phrases, including decoys and offers that must not match;
- the en-dash years regression;
- the freshness limit;
- G2b, posting age, experience gap, and the exact-only alias table;
- the shared checker's `redirectedOffJob`;
- end-to-end G2b, live-without-evidence and bad `--mode` runs.

## Files

| File | What |
|---|---|
| `opt-countdown.mjs` | CLI: gates G0–G3 and G2b, builds `roles.json`, calls `scripts/score/role-scorer.mjs`, writes log + report |
| `posting-evidence.mjs` | the one network step: dated Greenhouse status, `first_published`, posting-text facts (no full text saved) |
| `lib.mjs` | pure functions: CSV parse, sponsorship mapping, runway, timeline, liveness (v0.1 rule and dated evidence), posting facts, G2b, alias lookup |
| `aliases.json` | employer alias table (posting name → exact CSV name, with a basis) |
| `opt-countdown.test.mjs`, `opt-countdown-v02.test.mjs` | offline tests (`node --test`) |
| `fixtures/worked-run/` | v0.1 sample (2026-10-03): persona, candidates, saved liveness and API output |
| `fixtures/live-2026-10-21/` | v0.2 live run: fictional persona, 12 candidates, `urls.txt`, saved `posting-evidence.json` and `liveness.txt` |
| `fixtures/test/` | test persona, candidates, liveness, API, posting evidence, trimmed CSVs |

The scorer is **not** re-implemented here. The prototype shells out to `scripts/score/role-scorer.mjs` and reads its `role-scores.json`.
