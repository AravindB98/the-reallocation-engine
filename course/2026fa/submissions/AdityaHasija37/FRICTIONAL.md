# FRICTIONAL — honest work log

Assignment: The Reallocation Engine — Recipe Design Assignment
Student: AdityaHasija37
AI assistant: Claude (Claude Code, desktop app)

Labels used below:
- **[ME]** — I did it, decided it, or checked it myself.
- **[AI]** — the AI assistant did it or suggested it.
- **[ME+AI]** — the AI suggested it; I ran it or checked the result.

Raw terminal output for Phase 0 is saved outside the repo in `~/PEAI_Class/baseline-*.txt`
(doctor, verify, scan, liveness, liveness-dead, score) and will be pasted into
`TEST-REPORT.md`.

---

## 2026-10-03 — Phase 0: setup and baseline

### What I tried
- [AI] Read the upstream repo read-only through the GitHub API before cloning
  anything (file tree, CONTRIBUTING.md, CI workflows, role-scorer.mjs, data headers).
- [AI] Tried to fork through the in-app browser; GitHub required sign-in, and the
  assistant is not allowed to enter passwords. [ME] Forked the repo myself on github.com.
- [ME] Cloned my fork to `~/PEAI_Class/the-reallocation-engine`, added `upstream`,
  ran `npm install`, confirmed PyYAML was installed, installed Playwright Chromium.
- [ME] Ran `npm run doctor`, `npm run verify`, `npm run ats:scan -- --dry-run`,
  `npm run ats:liveness` (live URL + fake URL), and
  `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/AdityaHasija37/runs`.
  [AI] chose the live Figma Greenhouse URL from the public board API and proposed
  the fake job-ID URL as a break attempt.
- [ME] Created branch `contrib/2026fa-AdityaHasija37-wip` (slug to be renamed after Phase 1).

### What happened and what I did about it

1. **`npm install` modified `package-lock.json`.**
   Expected: a clean install. Saw: `M package-lock.json` in `git status`.
   Response: [AI] flagged it — a lockfile or `package.json` change would leave my
   namespace (`package.json` is CI-protected). [ME] ran `git restore package-lock.json`.
   Also did NOT run `npm audit fix`, which npm suggested, for the same reason.
   Learned: check `git status` after every install, not just after edits.

2. **`npm run verify` warned that `private/` and `data/ats/` are not gitignored.**
   Expected: no privacy warnings. Saw: `W2 private path not gitignored (PII/secret risk)`.
   Check: [AI] ran `git check-ignore -v` on `data/ats/portals.yml`, `private/x.md`,
   `search/resume.json`, `data/ats/pipeline.md` — all ignored, via `.gitignore`
   patterns `/private/*` (line 37), `/data/ats/*` (line 40), `resume.json` (line 50).
   Conclusion: false positive in `scripts/manifest-check.mjs`, which does not recognise
   the `/dir/*` pattern form. My copied `data/ats/portals.yml` is safe.

3. **Fake job URL returned "uncertain", not "expired".**
   Ran: `npm run ats:liveness -- "https://boards.greenhouse.io/figma/jobs/9999999999?gh_jid=9999999999"`.
   Expected: `expired`. Saw: `⚠️ uncertain … content present but no visible apply control found`.
   Meaning: the liveness checker cannot tell a non-existent posting from an ambiguous one.
   Consequence for my recipe: "uncertain" has to be handled explicitly — most likely as a
   closed gate that goes to a human, never silently passed as live. [Open: confirm what
   Greenhouse actually serves for a bad job ID — redirect to the board page?]

4. **The instructor's example set skips only 40%.**
   `score` on `data/examples/ch11-roles.json` → `Apply 2 · Consider 1 · Skip 2 (skip 40%)`.
   The scorer's own report calls <50% "below healthy", and one of the two Applies comes
   from a human override (`override-demo`), not from the math. So the skip-rate rule is
   a guideline the scorer reports, not one it enforces.

5. **Found in reading, not yet tested (from [AI] reading `scripts/score/role-scorer.mjs`):**
   - A missing `liveness.factor` or `timeline.factor` defaults to `1` — an open gate.
     A role with unknown liveness passes the gate. My prototype must refuse to emit a role
     with a missing gate value rather than omit the field. [TODO: confirm with a fixture]
   - The scorer has no `export`s and runs `main()` on import, although CONTRIBUTING.md
     says harnesses can import `CONFIG`/`scoreRole`. My prototype must call it through the
     CLI and read `role-scores.json`.
   - `role_quality` weight is `0.0` [VERIFY], as the assignment says.

6. **CI job `harness-regression` (in `.github/workflows/contrib-gate.yml`) references four
   files that do not exist upstream** (checked against the repo tree on 2026-10-03):
   `scripts/test/gate-behavior-harness.mjs`, `scripts/test/fuzz-invariants.mjs`,
   `scripts/gates/gate-behavior-harness.mjs`, `scripts/score/scorer-harness.mjs`.
   Expect that job to fail on any PR regardless of my work. [Open: ask the instructor
   whether "CI green" excludes this job.]

7. **The 80-Days CSV contains real phone numbers and executive names**
   (`phone`, `executive_officers` columns in
   `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`).
   Plan: never copy those columns into fixtures or reports.

8. **`node scripts/pii-scan.mjs` fails (exit 1) on the untouched upstream repo.**
   Saw: an `[email]` finding in `package-lock.json` (address not repeated here — quoting it would itself trip the scanner). Check: `git status` shows
   `package-lock.json` unmodified (last changed upstream in commit `d08afdd`); the address
   is the npm `glob@10` deprecation notice, i.e. a package maintainer's public email, not
   student data. So the baseline scan is not clean before I add anything.
   Plan: do not edit or allowlist it (outside my namespace); report it in the PR and
   TEST-REPORT, and show that my own files add no new findings.

### Unresolved questions
- Will `pii-scan.mjs` failing on upstream's `package-lock.json` block my PR?
- Will `harness-regression` failing count against "CI green"?
- What does Greenhouse return for a non-existent job ID, exactly?
- How much do the 50-company Form D samples overlap with the 80-Days CSV? (Phase 1 check.)

### Human / AI split for this session
- Accepted from AI: the phase plan, the clone/install command sequence, the choice of test
  URLs, the `git check-ignore` check, the pii-scan investigation in item 8, the findings in items 5–6 (read from code, not yet run).
- Done by me: fork, clone, install, every baseline command, branch creation, restoring
  `package-lock.json`.
- Modified / rejected: — (none yet)

---

## 2026-10-03 — Phase 1: choosing the domain, CHANGE-BRIEF

### What I tried
- [ME] Gave my situation: MS Information Systems (STEM), Dec 2026 graduation, ~3 years
  OPT + STEM OPT from Jan 2027, ~3.5 years experience, targeting PM / AI PM / Product Analyst
  roles asking 1–5 years, anywhere in the US.
- [AI] Measured data coverage (read-only Python over the shipped files):
  30,369 CSV rows → 1,552 with H-1B approvals → 133 with a product-family title in
  `top_job_titles_sponsored`. Form D samples (196 companies) overlap **0** CSV rows by
  normalised name. No "Product Manager" SOC row exists in `soc_occupation_compact.csv`.
- [AI] Found classmate PR `contrib/2026fa-shinde-pras-pm-apm-opt-clock` already covers
  PM-title matching with a short OPT clock and no liveness.
- [ME] Chose angle 1, **PM network-targets**, over salary-floor and over repeating the
  classmate's approach, on the AI's recommendation; the deciding reason for me was that a
  3-year runway makes the timeline gate nearly irrelevant and networking the real lever.
- [AI] Renamed branch to `contrib/2026fa-AdityaHasija37-msis-pm-network-targets` (local).
- [AI] Drafted `CHANGE-BRIEF.md`. Predictions in §5 are marked AI-drafted pending my review.

### Found while designing
- The 80-Days CSV has no careers / ATS URL column, so a human must confirm each job board
  (Gate A) — slug guessing could match a different company.
- The scorer has no funding term; funding can only order the network list.
- The data docs do not say which fiscal years `Total Approvals` covers. Logged as
  [TODO: DATA SOURCE].
- Deliberately did NOT measure board coverage before writing prediction 2, so it stays a
  real prediction.

### Human / AI split
- Accepted from AI: angle recommendation, coverage numbers, brief structure and draft.
- Done / decided by me: situation details, choice of angle, title range (1–5 years).
- Modified / rejected: — (pending my review of §5 predictions)

---

## 2026-10-03 — Phase 1: decisions and coverage check

### Decisions (asked one at a time by the AI, answered by me)
- [ME] Include Senior PM. [ME] Two sponsorship tiers only; ≥10 approvals with < 90% rate
  goes to Likely; 1–2 approvals skipped. Reason chosen from AI-offered options:
  "too thin to trust — could be a one-off". [ME] Hiring lag 60 days.
- [AI, delegated by me] fit = constant 0.7 (your-input) for rule-passing titles, with
  reasoning written in CHANGE-BRIEF Revisions.
- [ME] Predicted 50–75% board coverage before the measurement.

### What happened
- [AI] First coverage probe reported **0 of 91**. Expected: some hits. Cause: Python
  (python.org build on macOS) failed SSL verification (`CERTIFICATE_VERIFY_FAILED`) and the
  script swallowed the errors as "no board". Found it by testing a board known to exist
  (Figma). Fix: reran with `curl` and counted non-404 errors separately (0 inconclusive).
  Did NOT change any system certificate settings.
- Result: **32 of 91 (35%)** boards found by slug guess. My prediction was wrong.

### What I learned
- An error that is counted as "nothing found" looks exactly like a real result. My recipe's
  rule "a failed fetch is unknown, not no-openings" is not hypothetical: it happened here.
- [ME] Why my 50–75% guess was too high: I assumed most tech startups use Greenhouse or
  Lever. Generally larger firms tend to use Workday, while startups and mid-tier companies
  prefer Greenhouse. This candidate list has many Series D+ and older companies (median
  funding age ≈ 6 years), so more of them are past the startup stage than I assumed.
  [Open: the 59 misses were not checked for Workday, so this explanation is a hypothesis.]

---

## 2026-10-03 — Phase 2/3 start: plan, rules, first code

### Decisions (asked by the AI at each point, answered by me)
- [ME] Gate A rule: a board is confirmed only if the company's own careers page links to it.
- [ME] Network route next action: first chose "follow and watch, reach out only when a role
  opens". The AI pointed out this contradicts the angle (networking *before* a role opens)
  and the 3-hour networking block. [ME] Changed to **outreach first**: find 2 product people
  (alumni first), ask for a 20-minute chat now, re-check the board in 2 weeks.
- [ME] Apply route: tailor and apply within 2 days, then reach out to the hiring team.
- [ME] Consider route: apply, lower priority, after the Apply-route roles that week.
- [ME] Title rule: keep "Product Owner" excluded; exclude both "Manager, Product
  Management" and "Senior Manager, Product …" as people-manager roles.

### What happened
- [AI] Plan mode was required by the repo's CLAUDE.md before editing `recipes/`; plan
  approved by me.
- [AI] Wrote `rules.mjs` and `network-targets.mjs`. Board fetching imports the repo's own
  providers (`scripts/ats/providers/*.mjs`) with an injectable fetch context, so offline
  tests run the real provider code against saved responses. The scorer is run as a CLI.
- [AI] First version of the location rule accepted "London, UK" as US (the `, XX`
  state-code check was case-insensitive). Caught by reading before running; fixed by
  splitting multi-location strings and using a case-sensitive list of real state codes.
- [AI] Title rule tested on the 130 distinct product-ish titles in the CSV: 39 passed
  before my manager-title decision. This confirmed brief prediction #1 (false positive:
  "Senior Manager, Product Management").
- [AI] The run log first recorded an absolute output path containing my Mac username;
  changed to a repo-relative path.
- [AI] Smoke run with all boards unconfirmed: 91 candidates, 10 → human-check,
  the fictional "Quillfeather Product Labs Inc" → skip (not-in-dataset). No network calls.
- Data oddity seen in the 32 board hits: funding stage labels look wrong for some public
  companies (e.g. ZoomInfo "Pre-Seed", Datadog "Series C"). Funding stage is a record but
  not a reliable one; it only orders the network list.
- [AI] Wrote offline tests (`network-targets.test.mjs`, 10 tests) with a fixture CSV of 7 real
  rows (phone, executive and board columns removed) and hand-made board responses.
  All 10 passed on the first run. `node --test <folder>` failed on Node 22 (treated the
  folder as a module); the documented command names the test file instead.
  [Open: a suite that passes first time needs a deliberate break attempt — planned for
  the attestation.]
- [AI] `node scripts/pii-scan.mjs` flagged **this file**: my Phase 0 entry quoted the npm
  maintainer's email address while describing the baseline finding. Reworded without the
  address; the scan is back to the single baseline finding in `package-lock.json`.
  Lesson: describing a PII finding can reproduce it.

---

## 2026-10-03 — Gate A, live fetch, sample run

### Gate A (board confirmation)
- [ME] Checked Airbyte, Anomali, BetterUp, Datadog by hand (yes, yes, yes, no). Asked the
  AI to check the rest and re-check mine.
- [AI] Gathered evidence for all 10 (careers-page HTML via curl, the in-app browser for
  JavaScript pages, and cross-checks of job IDs / titles against each board's API). Found:
  4 direct links; 4 indirect matches only (Datadog, Discord, PayJoy, Sendbird); 2 wrong
  guesses (Iterable's Greenhouse board is stale, the real one is on Ashby; Payward is
  Kraken, whose board is `jobs.ashbyhq.com/kraken.com`). Sendbird has rebranded to
  Delight.ai, which the 80-Days data does not know.
- [ME] Decided: accept indirect evidence (rule widened and recorded in
  `boards.sample.json` with its history); changed my Datadog "no" to "yes" on the
  evidence that its board's postings link back to careers.datadoghq.com; add the two
  corrected boards. The AI did not mark anything confirmed on its own.
- Honest caveat: the AI chose which 10 companies went to Gate A (from the 32 with a
  slug hit). All 10 turned out Proven tier, so the sample has no Likely sponsors.

### Live fetch and sample run
- [AI] Ran the live fetch once with `--save-responses`: 10 boards read, 0 failures,
  trimmed responses saved (172 KB, no `@` anywhere). Then replayed offline; the offline
  run-log is identical to the live one apart from `mode`/`inputs`.
- Result: 90 candidates (91 before my manager-title rule) → 11 evaluated → apply 4 ·
  network 6 · skip 1; 18 postings scored, all Apply at 0.525.
- Location rule: Iterable's "Product Manager, Lisbon" was excluded as
  `location-not-recognised` (Lisbon isn't in the non-US list). Failed safe, but it's a gap.

### What looks wrong (to discuss in the worked run)
1. **Skip rate 9%**, far below the ~50% a healthy run should skip. The selection step had
   already removed 30,279 of 30,369 CSV rows before anything reached the evaluated set,
   so the company-level rate measures the wrong denominator.
2. **Every scored role is 0.525.** All 10 companies are Proven and fit is a constant, so
   the scorer cannot rank between roles; it only confirms the gates are open. Datadog
   alone produced 11 Apply rows.

---

## 2026-10-03 — Recipe and card

- [ME] Lifecycle stage: chose **DRAFT with 3 TODOs open** over moving the E-Verify and
  fiscal-year gaps into "cannot verify" to claim RUNNABLE-SAMPLE. The repo's rule is
  zero open TODOs before SPECIFIED.
- [AI] Drafted the recipe and card around the real commands and the real sample output.
  Every path in them exists today, apart from the 3 typed TODOs.
- [AI] The Gate A check command was first put inside a Markdown table, where `||` had to be
  escaped and would break when copied. Moved it to a code block and ran it (exit 0).
- [AI] `npm run doctor` still reports 33 recipes and 318 TODOs: it does not count
  `recipes/cases/`, so my recipe's `todos_open: 3` is not machine-checked by doctor.
  Checked by hand with `grep -c "\[TODO"` = 3.
- Status after this step: 10/10 tests pass, conformance OK on all new files,
  `npm run verify` passes, pii-scan shows only the baseline finding. Nothing committed.

---

## 2026-10-03 — First commit

- [ME] Set a repo-only git identity to my GitHub noreply address before the first commit
  (the AI flagged that my university email would otherwise be public in commit history).
- [AI, approved by me] Local commit `dedb123` on `contrib/2026fa-AdityaHasija37-msis-pm-network-targets`:
  37 files, all under my namespaces. Not pushed.
- `node scripts/pii-scan.mjs --diff main` (the check CI runs on branch history): **clean**.

---

## 2026-10-03 — Deliberate break attempts (Phase 4)

[ME] Chose break attempts 1 and 2 from four the AI offered, and ran every command myself
in my terminal. [AI] wrote the commands and had dry-run them on scratch copies first.
Expectations: not written down beforehand (recorded honestly, not reconstructed).

### Break 1 — fetch failure routed to "network"
- [ME] Planted the bug with `sed` (one line: `route: 'board-unknown'` → `'network'` on the
  fetch-failed branch), confirmed with `git diff`, ran the tests: `not ok 8`,
  `expected: 0 / actual: 1`, `# pass 9 / # fail 1`. Restored with `git restore`; tests back
  to 10/10.
- [AI] Checked *why* test 8 failed: `actual: 1` is the CLI's exit code. The report writer
  crashed (`TypeError: Cannot read properties of undefined (reading 'value') at
  renderReport`) because a "network" row assumes a board was read. So the bug was caught
  by an incidental crash, before the assertion written for it (`DISCORD INC →
  board-unknown`) was reached.
- Learned: the intended guard was never exercised. If the report were made more tolerant
  of missing values, only the route assertion would remain.
  [Open: add a test that checks the route before any rendering can crash.]

### Break 2 — delete a gate value and score it directly
- [ME] Removed `liveness` from a real Apply role (Datadog, "Product Manager II, AI & Data
  Security") and scored it with `scripts/score/role-scorer.mjs`.
  Saw: `Apply 0.525`, gate trace `{"factor":"liveness","multiplier":1,"source":"record"}`.
- **Finding in the repo's scorer (a maintained file I may not edit):** a missing liveness
  value becomes multiplier 1 (open gate) **and is labeled `record`**: a provenance claim
  with no record behind it (SNICKERDOODLE P3).
- [ME] Ran the same role through my prototype's `buildRole`:
  `REFUSED: refusing to emit role for DATADOG INC: liveness gate value missing`.
  My recipe guards against the scorer's defect; it does not fix it.
  [Open: report the scorer defect to the maintainer, in the PR body, with these commands.]

---

## 2026-10-03 — Clean checkout (Phase 4 done)

- [ME] Cloned commit `dedb123` into `/tmp/clean-check` and ran doctor, verify, the
  documented command, tests, conformance and `pii-scan --diff origin/main`. All passed;
  the run output matched the working copy exactly.
- [AI] Found why two output files changed: `role-scorer.mjs` stamps the current UTC date
  (`2026-10-04` by then) and ignores `--run-date`. Only that timestamp differs.
- [AI] Filled TEST-REPORT §2 from the saved output files.

---

## 2026-10-03 — Phase 5 documents

- [ME] Hand cross-check of DATADOG INC. My first command (`grep | cut -d,`) printed the
  wrong columns, because the CSV has quoted fields with commas. Re-ran with a CSV reader:
  `340.0 / 0.0 / 100.0` = report `340 approvals, 0 denials, 100%`. Match.
- [ME+AI] The cross-check also showed that "Proven" rests on company-wide counts:
  Datadog's top sponsored titles are mostly engineering, with one "PRODUCT MANAGER". Added
  to the "cannot verify" lists in the recipe, card and prototype.
- [ME] Time estimate: about 15 min per company by hand, at most 30–40 companies a week.
  Reflection on skip rate and next improvement in my words; grammar tidied by the AI.
- [ME] Asked the AI to write the 0.525 reflection paragraph and then to drop the
  "AI-written" label. [AI] Declined the label removal (the assignment treats misstated
  authorship as an integrity issue) and suggested I write it myself instead.
  Placeholder left in WORKED-RUN.md.
- [AI] Added STEM-OPT degree relatedness (Form I-983) as a domain failure mode and a
  "cannot verify" item; it was not in my brief.
- [AI] Rounded the approval rate for display (`95.23809523809524%` → `95.2%`); the record
  value stays in `run-log.json`. Tests still 10/10.
- [AI] Drafted DOMAIN-JUSTIFICATION.md, WORKED-RUN.md (with attestation), SOURCES.md and
  `logs/runs/2026fa-AdityaHasija37-1.md`. The first draft of the run log marked Gate D as
  cleared before I had read the report; changed to PENDING.
- [ME] Gate D: read `out/report.md` (including "What this cannot tell you"); run log updated
  from PENDING. Reviewed the attestation rows and the SOURCES.md who-did-what table and
  confirmed them as accurate.
- [AI, at my request] Wrote the "flat 0.525 score" reflection paragraph in WORKED-RUN.md,
  labeled in place as AI-drafted and reviewed by me. I chose not to answer the AI's three
  guiding questions myself.
