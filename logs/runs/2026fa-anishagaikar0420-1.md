## 2026-09-30 — opt-countdown (sample), first run in the AI sandbox

- **Recipe:** anishagaikar0420-msis-bi-analyst-opt-countdown v0.1.0 (DRAFT)
- **Run by:** Claude (AI assistant) in Anisha's session, on a Linux sandbox (Node 22.22.2).
- **Inputs:** `scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/examples/profile.persona.json` (program end 2027-05-15, OPT start 2027-06-01, run date 2026-09-30 — persona values, your-input); `…/examples/roles.persona.json` (10 roles; real company names, invented titles/URLs/start dates/fit); no liveness log (sample liveness is your-input); the full shipped 80-Days CSV (30,369 rows); BLS compact (1,016 rows); 4 Form D **sample** files (200 companies).
- **Command:** `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs`
- **Outputs:** `course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/` — `opt-countdown-log.json`, `opt-countdown-report.md`, `roles.json`, `role-scores.json`, `role-scores.md`
- **Result:** evaluated 10 → Apply 3 · Consider 1 · Skip 4 · blocked 2 (`company-not-found`, `liveness-unchecked`); skip rate 50% of scored. G0 break test (`--as-of 2027-09-15`) exited 3 and wrote nothing. Offline tests 11/11. Hand check of the Gusto row against the CSV matched (218 approvals, 4 denials, Series D+, 2021-07-15).
- **Gates cleared by:** nobody — no human cleared a gate in this run.
- **Open issues:** (1) analyst-keyword rule over-matches engineer titles; (2) every approval/denial count in the CSV is even — possible upstream double count, unconfirmed; (3) liveness not checked against the live web; (4) `npm install` failed in the sandbox (registry 403).

## 2026-10-02 — opt-countdown (sample), re-run on Anisha's Mac

- **Run by:** Anisha, on her own Mac (macOS 26.2, Node v26.9.0, Python 3.14.7), in `~/Desktop/the-reallocation-engine` on branch `contrib/2026fa-anishagaikar0420-msis-bi-analyst-opt-countdown`.
- **Inputs:** same persona profile and roles file as above. The profile fixes the run date at 2026-09-30, so this run rewrites the same `runs/2026-09-30/` folder.
- **Commands and results (copied from my terminal):**

```text
$ npm install
added 55 packages, and audited 56 packages in 3s

$ npm run doctor
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ npm run verify
conformance: 169 files (88 md · 36 py · 33 js · 8 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)

$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 3 · Consider 1 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 3 · Consider 1 · Skip 4 (skip 50%)
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
```

- **Result:** identical to the sandbox run. The output is deterministic for a fixed run date.
- **Different from the sandbox:** `npm install` worked on the Mac and Playwright is now installed, so `ats:liveness` could be run here (not yet done).
- **Problem hit and fixed:** on 2026-10-01 the first `npm run verify` failed with `ModuleNotFoundError: No module named 'yaml'`. `pip install pyyaml` failed twice: first `externally-managed-environment`, then a pip crash reading the macOS version (`invalid literal for int() with base 10: ''`). `brew install pyyaml` found no package. Fixed by downloading the PyYAML 6.0.2 source and copying its pure-Python `yaml` folder into Python's user site-packages. After that, verify passed (above).
- **What I checked:** the 2 blocked roles have reason codes and were not passed to the scorer; the scorer scored only the other 8. Hand check: Figma's CSV row (188 approvals, 2 denials, Series D+, 2024-05-15) matches the report; none of its 5 sampled titles is an analyst job.
- **What this run did NOT verify:** live posting liveness; whether a company will sponsor a future analyst role; real start dates or hiring timelines; whether the CSV's H-1B counts are accurate. Apply/Consider/Skip is script output from the repo's scorer — no AI model is called by the prototype.
- **Gates cleared by:** nobody yet.
- **Open issues:** the same 4 proposed additions as in the recipe (analyst-title rule, per-SOC sponsorship data, ATS-sourced start dates, the even-count pattern).

## 2026-10-02 — opt-countdown v0.1.1 (sample), analyst-title fix

- **Run by:** Claude (AI assistant), sandbox, at Anisha's request. Anisha re-runs it on her Mac before submitting.
- **Change:** `sponsorshipTier` now needs "analyst" or "BI" in a sampled title (closes proposed addition 1). +1 test (12 total).
- **Command:** `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs`
- **Outputs:** `course/2026fa/submissions/anishagaikar0420/runs/2026-09-30-v0.1.1/` (v0.1.0 outputs kept in `runs/2026-09-30/`)
- **Result:** evaluated 10 → Apply 1 · Consider 3 · Skip 4 · blocked 2; skip rate 50% of scored. Figma and Sigma moved Apply → Consider (tier Proven → Likely). Tests 12/12; mutation of the new rule caught by the new test.
- **Gates cleared by:** nobody yet.
- **Open issues:** proposed additions 2–4 (per-SOC sponsorship data, ATS start dates, even-count pattern); liveness still sample input.

## 2026-10-02 — opt-countdown v0.1.1, re-run on Anisha's Mac

- **Run by:** Anisha, on her Mac (macOS 26.2, Node v26.9.0).
- **Commands:** the test command; `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs`; break test `… --as-of 2027-09-15`; `ls course/2026fa/submissions/anishagaikar0420/runs/`
- **Result:** tests 12/12; Apply 1 · Consider 3 · Skip 4 · blocked 2 (same as sandbox). Break test printed `✗ G0 OPT window already closed …`; `ls` showed only `2026-09-30`, `2026-09-30-v0.1.1`, `baseline-ch11`, so nothing was written.
- **Gates cleared by:** nobody. The two blocked rows remain open for manual research.
- **Open issues:** proposed additions 2–4; default thresholds and dates are still the persona's, not Anisha's real I-20 dates.
