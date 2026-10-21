## 2026-10-21 — f1-preopt-entry-data-h1b mode-build runs, human review

**Executive summary.** This entry records a person's review of three checks made on 2026-10-21 for the job-search mode that looks for employers with a record of sponsoring entry-level data jobs. The project's scoring engine was re-run on the 12 sample postings that passed the tool's checks, and it gave the same results as on 3 October. The tool that checks whether a posting is still open was given two bad addresses, and it refused both instead of passing them. The project's own health checks passed. I accept all four results as recorded: the pre-flight checks pass, the scorer re-run confirms the Oct 3 results on sample data only, and the liveness gate correctly refused both bad addresses; the gate's active path has not yet been tested on a real posting.

- **Recipe:** recipes/cases/2026fa/meenuviji-f1-preopt-entry-data-h1b.md v0.1.0
- **Inputs:**
  - `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json`: 12 roles that passed gates G1–G4 in the Oct 3 sample run. Sponsorship values come from the 80 Days CSV (SHA-256 eccdee2a…6270); the postings are fictional; liveness is 1.0 "assumed, not checked" and fit is a constant 0.5.
  - Liveness break inputs: `http://localhost:3000` and `not-a-real-url`.
- **Outputs:**
  - `course/2026fa/submissions/meenuviji/recon/score-worked-run/role-scores.json` and `role-scores.md` (commit cdd1b9a), with the run pasted verbatim in `course/2026fa/submissions/meenuviji/MODE-WORKED-RUN.md`.
  - `course/2026fa/submissions/meenuviji/worked-run-raw/01-liveness-break-localhost.txt` and `02-liveness-break-malformed.txt` (commit 2a0c789).
- **Result:**
  - G0: `npm run verify` exit 0 (the same 3 manifest warnings as upstream/main); `npm run doctor -- --strict` exit 0 ("no private/PII paths are tracked").
  - Scorer: `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run` → exit 0; scored 12 (Apply 2 · Consider 8 · Skip 2). The scored roles and config are identical to the committed Oct 3 `out/score/role-scores.json`; only `generated` differs (2026-10-03 → 2026-10-21).
  - G3 break tests: both `uncertain` (`blocked host localhost`; `invalid URL`), `Results: 0 active  0 expired  1 uncertain`, `exit code: 1`.
- **Open issues:**
  - No real posting URL has been checked for liveness yet, so the `active` path of G3 is untested.
  - The liveness result is not fed into a posting's score (proposed addition 4).
  - Proposed additions 1–6 remain open.
- **Reviewed by:** I, Meena (meenuviji), reviewed these results on 2026-10-21.

### Gate decisions

All decisions and reasoning are Meena's, in her own words.

| Item | Gate | What was seen | Decision | Reasoning (Meena) |
|---|---|---|---|---|
| Pre-flight checks | G0 pre-flight | verify exit 0, doctor --strict exit 0 | I accept G0 as a pass and will continue. | verify and doctor --strict both exit 0; the 3 manifest warnings also appear on upstream/main, so they do not come from my change. |
| Direct scorer run on the 12 gated roles | output check (P3: does the run reproduce the record?) | exit 0; 2 / 8 / 2, identical to Oct 3 apart from the date | I accept this as sample evidence only. | the identical 2/8/2 result shows the scorer is repeatable on my inputs, but the postings are fictional and liveness and fit are assumed, so these scores say nothing about real jobs. |
| Liveness break 1: `http://localhost:3000` | G3 liveness (hard gate) | `uncertain`, `blocked host localhost`, exit 1 | I accept this result as a pass: the gate held. | an internal address came back uncertain with exit 1, so the mode stops instead of treating the posting as live. |
| Liveness break 2: `not-a-real-url` | G3 liveness (hard gate) | `uncertain`, `invalid URL`, exit 1 | I accept this result as a pass: the gate held. | a malformed address came back uncertain with exit 1, so the mode stops instead of treating the posting as live. |

**Break tests run by:** 2026-10-21, run by Meena in her own Terminal; outputs committed at 2026-10-21 11:02 -0400 (2a0c789); exact run time not recorded.

### Did not test

- `npm run ats:liveness` on a real, live posting URL (the `active` result).
- An `expired` posting.
- Feeding a liveness result into a posting's score (not built).
