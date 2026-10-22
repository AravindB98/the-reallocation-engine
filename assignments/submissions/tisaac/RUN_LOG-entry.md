# RUN_LOG entry — case-swe-stem-opt-runway

Entries in the `logs/RUN_LOG.md` format (`recipes/_shared.md` → Logging Rules), filed with the submission as the assignment allows ("or include it in your submission"): for student PRs, `logs/RUN_LOG.md` is a protected path. Full output: `WORKED-RUN.md`.

## 2026-10-21 — case-swe-stem-opt-runway run 1 (hand-picked)

- **Recipe:** recipes/case-swe-stem-opt-runway.md (not yet written; this run is the sample run that supports RUNNABLE-SAMPLE)
- **Inputs:** 3 public Greenhouse postings picked by hand by the AI assistant + 1 dead job id (input files not kept in the submission); data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
- **Outputs:** pasted in WORKED-RUN.md (output files not kept in the submission)
- **Result:** 4 → Apply 1 · Consider 0 · Skip 3 · Held 0 (skip 75%). Dead job id gated by the board signal; `npm run ats:liveness` called it active.
- **Open issues:** postings chosen by hand with an unsaved filter (replaced in run 2); "Toast" not matched to `TOAST INC`.

## 2026-10-21 — case-swe-stem-opt-runway run 2 (filtered selection)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** select-postings.mjs + scope.json on boards klaviyo, toast, duolingo (540 listed); 23 postings + 1 dead job id; liveness checked 2026-10-21T19:26:27Z; same CSV (input files not kept in the submission)
- **Outputs:** pasted in WORKED-RUN.md (files not kept in the submission)
- **Result:** 24 → Apply 14 · Consider 0 · Skip 10 · Held 0 (skip 42%). Selection audit read; filter errors found and fixed before this run.
- **Open issues:** all 5 Toast postings skipped as `no-matched`.

## 2026-10-21 — case-swe-stem-opt-runway run 3 (name gate cleared)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** scope.json with `csv_name.toast = "TOAST INC"` (my own match, after SEC EDGAR address check); selection replayed from the run-2 snapshot (no network); same liveness evidence and CSV
- **Outputs:** pasted in WORKED-RUN.md (output files not kept: they came from older code)
- **Result:** 24 → Apply 19 · Consider 0 · Skip 5 · Held 0 (skip 21%).
- **Open issues:** skip rate below the healthy ~50%, because `fit` is a fixed 0.5 placeholder and the mode cannot tell roles apart within a company. Visa-timeline, ban, and title gates not cleared per role; no application sent. Duolingo has no row in the CSV.

## 2026-10-21 — case-swe-stem-opt-runway walkthrough (run by me, practice folder)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** a copy of scope.json in ../_walkthrough/ (outside the repo) with boards datadog, gitlab, cloudflare (chosen by me) and an empty csv_name; same CSV
- **Outputs:** ../_walkthrough/ (not part of the submission); terminal output pasted in WORKED-RUN.md
- **Result:** selection Datadog 10 · GitLab 4 · Cloudflare 0. Liveness: 10 Datadog board+uncertain, GitLab "Cloud Platform Engineer" closed between selection (19:16) and liveness (19:32). Score: 0 Apply · 5 Skip · 10 Held. After my name match (DATADOG INC, GITLAB INC): 0 Apply · 3 Consider · 2 Skip · 10 Held.
- **Open issues (all fixed in run 4):** Datadog's apply form is a Greenhouse iframe the page check cannot see; held roles could not be settled by a person; Cloudflare's work-model-only locations reported as "not in the US"; an intern posting kept; file dates in UTC.

## 2026-10-21 — case-swe-stem-opt-runway run 4 (final, from scratch after the fixes)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.2.0 (status RUNNABLE-SAMPLE)
- **Inputs:** scope.json with boards klaviyo, toast, duolingo (chosen by the AI assistant), datadog, gitlab, cloudflare (chosen by me); csv_name for Klaviyo, Toast, Datadog, GitLab (each checked by me); snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/final/postings-2026-10-21/ (1,653 listed, with office lists for gitlab and cloudflare; scope.used.json); final/jobs-2026-10-21.json (66 + 1 dead job id); final/liveness-2026-10-21.json (checked 2026-10-22T01:51:01Z = 21:51 EDT on 10-21); same CSV
- **Outputs:** final/postings-2026-10-21-audit.md; assignments/submissions/tisaac/run-4-final/
- **Result:** 67 → Apply 28 · Consider 4 · Skip 35 · Held 0 (skip 52%). Location: 31 postings placed from Greenhouse office lists (Cloudflare 30, GitLab 1), 12 Cloudflare dropped (offices all abroad), 0 unclear. Liveness: 57 board+active, 9 Datadog board+embedded application form, dead id not on the board. Offline tests (purpose-built fixtures): index.test.mjs 20/20, select-postings.test.mjs 32/32.
- **Open issues:** 30 of the 35 skips are Cloudflare, which has no row in the visa file (a "not found", not a "doesn't sponsor"), so the skip rate overstates the mode's judgment. `fit` is a fixed 0.5 placeholder. Duolingo has no row in the CSV. Visa-timeline, ban, and title gates not cleared per role; no application sent.
