---
owner: EthanGomes14
term: 2026fa
component: data-engineer-h1b
status: RUNNABLE-LIVE
promoted_to: null
---

# Data Engineer H-1B sponsor screen — prototype

## Executive summary

**What this is.** A small offline program that helps an international student who will need visa sponsorship decide which Data Engineer job postings are worth their time. For each posting it checks three things: whether the company has a public record of sponsoring visas for Data Engineer-type roles, whether the posting is still open, and whether hiring can finish before the student's work-authorization window closes. It then asks the repository's existing scorer for an Apply / Consider / Skip recommendation and writes two files: a detailed log for software and a readable report for a person.

**Why read it.** It has the single command that runs everything, the command that tests it, and an honest list of what it cannot check.

**What it does not do.** It never applies, emails or contacts anyone, and never invents a number when evidence is missing. Missing evidence is reported as missing, with a reason. The main program is offline. The two online steps are separate scripts that talk only to Greenhouse's public job API: one lists postings (discovery), one asks whether each job still exists.

**New in v0.5.0:** discovery (`find-greenhouse-postings.mjs`), a reviewed brand → legal-name alias table (`aliases.json`), a posting-age flag, a fit floor (an Apply with fit below 0.4 is capped at Consider, after the scorer), and two more exclusion words in the title rule. Real run on 19 postings found on 2026-10-20: `assignments/submissions/ethangomes14/WORKED-RUN.md`.

**New in v0.5.1 (2026-10-21):**
- `--mode sample|live`, so the log records what kind of run it was.
- Local dates in all three scripts. The two network scripts had stamped an evening check with tomorrow's UTC date.
- `samples/aliases-2026-10-20.json`, a frozen pre-review copy of the alias file, so the sample run still reproduces.

The live run, with every gate cleared by the author, is in the same worked run.

## Run it (from the repository root)

```bash
node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-03
```

- Reads: the sponsor file `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, the persona `fixtures/persona-electrifier.json` (fictional), the candidate postings `samples/candidates-2026-10-03.json`, the saved liveness output `samples/liveness-2026-10-03.txt`, and the decision rules `rules.json`.
- Calls: the existing scorer `scripts/score/role-scorer.mjs` (not a copy).
- Writes to `assignments/submissions/ethangomes14/runs/screen-sample/` (v0.4.0 and earlier wrote to `course/2026fa/submissions/ethangomes14/runs/`, which is kept as the earlier evidence):
  - `screen-log.json`: JSON log for the agent
  - `screen-report.md`: Markdown report for the person, starting with a **priority list** (highest priority first)
  - `roles.json`: the evidence handed to the scorer
  - `role-scores.json` / `role-scores.md`: the scorer's own output
- `--today` pins the evaluation date so the sample run is reproducible. Without it, the program uses today's date, and the 7-day liveness freshness rule will eventually mark the 2026-10-03 sample stale. That is intended.

Options: `--candidates`, `--liveness`, `--greenhouse-status`, `--aliases`, `--persona`, `--csv`, `--rules`, `--out-dir`, `--today`, `--mode`, `--scorer` (see the header of `sponsor-screen.mjs`). `--out-dir` must stay inside this folder, `course/2026fa/submissions/ethangomes14/`, `assignments/submissions/ethangomes14/`, or the system temp directory; anything else is refused.

### Using your own candidate list

1. Find postings (network, `boards-api.greenhouse.io` only), then keep the rows you want and add `fit` with `p` (0–1) and `reason` to each. The screen rejects rows without a fit rating.

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --board <token> [--board <token> ...]
   ```

   Or write a candidates file by hand shaped like `samples/candidates-2026-10-20.json`: `role_id`, `company`, `title`, `url`, `fit`, optionally `location`, `first_published`, `greenhouse_board`.
2. Check liveness with the repository's own checker and save its output with a date header:

   ```bash
   { echo "# checked: $(date +%F)"; npm run ats:liveness -- <url1> <url2> ... || true; } > my-liveness.txt
   ```

3. Optional (network): ask Greenhouse's job API whether each Greenhouse job still exists. Allowed host: `boards-api.greenhouse.io` only. For company-hosted links like `…?gh_jid=123`, add `"greenhouse_board": "<board>"` to that candidate.

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fetch-greenhouse-status.mjs --candidates <file> --out my-greenhouse-status.json
   ```

4. Run the screen with `--candidates <file> --liveness my-liveness.txt --greenhouse-status my-greenhouse-status.json`.
5. For each `alias-pending-review` row, check the legal name yourself. If it is right, set `reviewed_by_person: true` and `reviewed_on` in `aliases.json`, then re-run.

## Test it (offline, fixtures only)

```bash
node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/
```

The 23 tests cover:
- the CSV parser
- name normalization
- the title family
- the tier rule
- the timeline gate
- liveness parsing
- Greenhouse link parsing (four link shapes; never guesses a board) and the cross-check (only an API 404 closes a gate; a missing or stale check changes nothing)
- one full run per named failure case (F1–F7) through the real scorer
- aliases (v0.5.0): file validation, an exact match always wins, a pending alias never reaches the scorer, a target missing from the CSV is reported, a lower-case target is not "close enough"
- the posting-age flag: shown and labelled, never changes a score, never invented when no date is given
- the fit floor: a low-fit Apply becomes Consider, the scorer's own output is kept, and nothing is ever raised
- the run-mode label (v0.5.1): `sample` by default, `live` when asked, the same counts either way, and any other value refused
- local dates (v0.5.1): "today" is the local calendar day, not UTC, and a status file dated after today is never trusted
- seven break attempts:
  - a deliberately broken scorer (`fixtures/BROKEN-apply-everything-scorer.mjs`) must be caught
  - writing outside this folder must be refused
  - a missing data file must stop the run with no output
  - a named Greenhouse status file that doesn't exist must stop the run
  - an alias marked reviewed with no review date must stop the run
  - a named aliases file that doesn't exist must stop the run
  - a sales title that the old rule let through ("Account Executive, Product Sales (Data Pipeline)") must be excluded

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Run complete. Unscored rows are a normal outcome, listed with reasons. |
| 2 | Stopped on bad input (missing file, bad date, out-dir outside the allowed folders). Nothing scored, nothing written. |
| 3 | The scorer failed, or its output broke the gate rule (a closed gate that is not a Skip). Do not use that run. |

## Files

| File | Purpose |
|---|---|
| `sponsor-screen.mjs` | The program (command line) |
| `lib.mjs` | Pure helpers: CSV parsing, name matching, title family, tier rule, timeline gate, liveness parsing, Greenhouse cross-check |
| `find-greenhouse-postings.mjs` | Network (discovery): lists Greenhouse boards and keeps Data Engineer-family titles; writes a candidates skeleton with `fit: null` |
| `fetch-greenhouse-status.mjs` | Network: asks `boards-api.greenhouse.io` whether each Greenhouse job ID exists (200) or is gone (404), and saves the answers |
| `aliases.json` | Brand → legal-name aliases; used only after review |
| `rules.json` | Every decision rule, each with its source label |
| `sponsor-screen.test.mjs` | Offline tests |
| `fixtures/` | Fictional persona, test CSV, test candidates, test liveness output, test Greenhouse status, test aliases (good, empty, BROKEN), the BROKEN scorer |
| `samples/` | Real inputs: the 2026-10-03 sample (7 postings) and the 2026-10-20 run (board list, discovery output, 19 candidates, liveness, Greenhouse status), plus the invented-ID break test (`*-ghost-*`) |

## What it cannot verify

See the "can and can't verify" section in `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md`. In short: past sponsorship is not current intent; approvals are company-wide and undated; the sponsor file covers companies headquartered in only six states; name matching is exact after normalization, bridged only by reviewed aliases; the liveness checker can call a redirected dead posting "active" (the Greenhouse API cross-check catches this only for Greenhouse links); and fit ratings are Claude's judgment from titles only.

## Credits

Built on The Reallocation Engine (`nikbearbrown/the-reallocation-engine`): the 80 Days to Stay sponsor file, `scripts/score/role-scorer.mjs`, and `scripts/ats/check-liveness.mjs`. Code drafted with Claude (Claude Code); see `course/2026fa/submissions/ethangomes14/SOURCES.md` for who decided and checked what.
