# FRICTIONAL.md: Reallocation Engine Mode Build (due 2026-10-21 23:59 ET)

## Executive summary

This is a dated log of the work on the "Mode Build" assignment: what was tried, what happened, and
what changed, including failures. So far only discovery has been done. The repository and the
environment were inspected, and nothing was designed, written into the tracked tree, or committed.
The main findings: the assignment's required file locations conflict with the repository's own
contribution rules; the earlier October 3 pull request is still open; and the repository already
has a tested script that fetches public job-posting text, which could support a mode that reads
what postings actually say about sponsorship.

## Technical log

Timestamps come from `date` (EDT). This folder (`course/2026fa/submissions/prpathak1/mode-build/`)
is a provisional location, untracked and uncommitted, until Prathamesh chooses the submission path.

---

### Entry 1: 2026-10-20 13:29–13:34 EDT. Phase 1 discovery (read-only, apart from `npm install`)

**Tried:** The Phase 1 request: repository state; governing docs; the existing recipe inventory; a
comparison with the October 3 recipe; `npm install` / `verify` / `doctor` from CMD; a local data
inventory; and 2–3 candidate modes. No design, no tracked writes, no commits.

**What happened:**
- **The brief arrived as a template placeholder**
  (`[paste the full contents of 02_reallocation_engine_mode_build.md]`). Claude used the local copy at
  `Downloads\01_final_project_pitch_film\02_reallocation_engine_mode_build.md` (SHA-256 prefix
  `c066f03918f1adf7`). Prathamesh still has to confirm it is the official version.
- **Repository state:**
  - `origin` = prpathak1 fork, `upstream` = nikbearbrown (push disabled).
  - After `git fetch upstream` (nothing merged), fork `main` = upstream `main` = `015843d`
    (2026-09-23): 0 behind, 0 ahead.
  - Checked out: `contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241` (`6471e2b`, 6 commits over
    upstream, clean tree).
  - Its recipe is `status: DRAFT`, `todos_open: 8`, v0.1.2.
  - **PR #27 on upstream is OPEN, not merged** (public GitHub API; the `gh` CLI is not installed).
- **Path conflict, brief vs repo:**
  - The brief says: mode in `recipes/`; supporting work in `assignments/submissions/<yourname>/`;
    branch `mode/<yourname>-<domain>`; a `RUN_LOG.md` entry; ZIP `reallocation-<yourname>-mode.zip`.
  - `CONTRIBUTING.md` (CI-enforced) says: `recipes/cases/<term>/<handle>-<slug>.md` + `.card.md`;
    `course/<term>/submissions/<handle>/`; branch `contrib/<term>-<handle>-<component>`; run logs in
    `logs/runs/<term>-<handle>-<n>.md`; **never edit `logs/RUN_LOG.md`**; **one open PR per student**.
  - `assignments/` does not exist upstream; `course/` and `recipes/cases/` do.
  - **Waiting on Prathamesh's decision.**
- **None of the brief's suggested starting points exist** (`biotech.md`, `opt-countdown.md`,
  `cognitive-fit.md`, `salary-floor.md`, `startup-triage.md`).
- **Existing recipes:** 47 upstream recipe files (42 DRAFT, 4 RUNNABLE-SAMPLE, 1 RUNNABLE-LIVE).
  - 9 Summer-2026 cases cover OPT/H-1B/sponsorship triage for SWE, ML, DS, UX and post-offer audit.
  - **None** mentions SOC 15-1241 or network engineering.
  - **No recipe or maintained script classifies posting text for sponsorship/authorization wording.**
    `role-scorer.mjs:60`'s "authorized" regex reads the candidate profile, not the posting.
- **Environment (CMD, 13:32:14–13:32:25):**
  - `npm install` exit 0. 3 high-severity audit findings were reported and not acted on. `sharp`
    install scripts were not approved (npm "allow-scripts" warning).
  - `npm run verify` exit 0: 171 files conform. Manifest check passed with 3 warnings: "`private/`
    and `data/ats/` not gitignored" is a **false positive** (the real rules `/private/*` and
    `/data/ats/*` ignore the contents; only README / .gitkeep / `portals.example.yml` are tracked),
    and `archive/` is not ignored.
  - `npm run doctor` exit 0: environment runnable; no private paths tracked; 33 recipes, 318 open
    TODOs; pandoc and LibreOffice absent.
  - `git status` afterwards: clean (no tracked file changed).
- **Side effects of candidate commands** (from source, none run):
  - `ats:scan -- --dry-run`: network GETs to boards, no writes.
  - `ats:liveness`: headless Chromium visit, no writes.
  - `score`: writes JSON + Markdown to an output dir.
  - `resumes:pdf`: writes PDFs.
  - `refresh-recent-sec-quarters.py`: no network; processes local extracted SEC quarters and writes
    processed JSON.
  - `fetch-real-postings.py` (`npm run fetch-postings`): network, writes posting JSON with
    `description_text` into `private/` by default.
- **Data:**
  - `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: 30,369 companies,
    20 columns, tracked. H-1B fields populated for 1,557. "network" appears in the top sponsored
    titles of 8 of those. **Personal columns: `phone`, `executive_officers`, `board_directors`**
    (no values were printed).
  - `data/bls/compact/soc_occupation_compact.csv`: 1,016 rows, tracked, no personal columns.
    15-1241.00 Computer Network Architects and 15-1241.01 Telecommunications Engineering Specialists
    (national median 130,390), plus neighbours 15-1244 (96,800), 15-1231 (73,340) and 15-1212
    (124,910).
  - `data/bls/oesm24nat/national_M2024_dl.xlsx` (national OEWS).
  - **`metro_oews.csv` / `bea_rpp.csv` are not in the repo**, so `bls:local-wage` would report a
    missing data file here.
  - ATS: only `data/ats/portals.example.yml` (3 boards, 6 provider mentions); no local scan data.
  - Form D: 4 sample JSONs in `data/sec/form-d/processed/sample/`.
  - Personas: `search/examples/` and `resumes/` hold Aarav Patel, Priya Nair, Maya Sehgal, Rohan Desai.
    The October 3 recipe used its own fictional persona in `fixtures/`; CONTRIBUTING prefers
    extending `search/examples/`.

**What changed:** Nothing tracked. This folder was created (untracked). `node_modules/` was refreshed
(gitignored). Three candidate modes were proposed to Prathamesh, with no pick made.

---

### Entry 2: 2026-10-20 13:36–13:38 EDT. Decisions; planning research (read-only)

**Tried:** Prathamesh confirmed the Downloads brief as official and made these decisions:
- **Mode A** (what live public postings say about sponsorship / work authorization; employer H-1B
  history only as a separate company-level signal; silent = "insufficient", never "no").
- **The repo's CI paths.**
- **A new branch from upstream `main`**: `contrib/2026fa-prpathak1-mode-network-sponsorship-text`.
- **No PR actions**; Prathamesh is asking the TA about #27.

Then Prathamesh asked for a plan only (plan mode, per the repo's CLAUDE.md).

**What happened:**
- **How "one open PR per student" is enforced:** written policy only. It is in `CONTRIBUTING.md:22`
  plus a self-declared PR-template checkbox ("This is my ONLY open PR: [ ] yes"). The template says
  "CI re-checks every box", but no workflow in `.github/workflows/` reads the PR body or counts open
  PRs. CI does enforce: a full-history PII scan; a hard fail on protected paths (`logs/RUN_LOG.md`,
  `package.json`, `.github/`, the governing docs); and a warning for out-of-namespace files.
  Branch names are not checked.
- **Git Bash friction:** `git show upstream/main:.github/...` failed ("ambiguous argument
  'upstream\main;.github\…'") because MSYS path conversion rewrote the argument. Fixed with
  `MSYS_NO_PATHCONV=1`.
- **The Greenhouse scraper returns no body text:** `scripts/ats/scrapers/greenhouse/scraper.py:56`
  hard-codes `"description_text": ""` (it calls `/jobs` without `?content=true`). Only Lever returns
  `descriptionPlain` through `fetch-real-postings.py`. No unit tests exist for the Greenhouse or Lever
  scrapers; only Workday has a `test_scraper.py`.
- **Board probe** (public Lever API, one GET each, `mode=json`):
  - shieldai: 652 postings, 5 network-titled, all with body text.
  - zoox: 239 postings, 4 network-titled, all with body text.
  - palantir: 309 postings, 3 network-titled (all "Senior Software Engineer, Network
    Infrastructure"), all with body text.
  - wealthfront: 1 network-titled; spotify: 0; kraken: 0.
  - plaid, verkada, anduril, lucidmotors, netflix, cohere: "Document not found" (not Lever boards).
- **Environment gaps found:** Python 3.11 (the `python3` shim) lacks `requests`, so
  `fetch-real-postings.py` cannot import; no Playwright Chromium is downloaded, so `ats:liveness`
  cannot launch; and an in-repo `.venv` would NOT be gitignored.
- Moved this log folder from `…/prpathak1/mode-build/` to its planned final path
  `…/prpathak1/network-sponsorship-text/` (still untracked).

**What changed:** A plan has been presented for approval. Nothing has been installed, fetched beyond
the probe, or committed.

---

### Entry 3: 2026-10-20 13:41–13:49 EDT. Plan approved; setup, scripts, worked run up to the label gate

**Tried:** Prathamesh approved the plan (plan mode → approved). Steps run: setup; scripts and tests;
commands 1–7; label proposals. Then a stop at the human label gate.

**What happened:**
- **Setup:**
  - venv `C:\info7375\venvs\reallocation` (outside the repo; Python 3.11.9 + `requests` 2.34.2).
  - `npx playwright install chromium` (Playwright 1.62.1, chromium-1234), exit 0.
  - Branch `contrib/2026fa-prpathak1-mode-network-sponsorship-text` from `upstream/main` @ `015843d`.
    It tracks `upstream/main` for now; to be repointed to `origin` at push time.
- **Scripts:** `_common.py`, `fetch_lever_full.py`, `filter_titles.py`, `extract_auth_sentences.py`,
  2 synthetic `BROKEN-*` fixtures, `test/test_extract.py`.
  - **The tests caught Claude's defect:** `sys.exit("message")` exits **1**, not the documented 2.
    Fixed with a `stop()` helper (stderr + exit 2).
  - Claude also first wrote a tautological assertion (`assertEqual(rc, 2 if rc == 2 else rc)`) and
    fixed it before the first run.
  - Now 8/8 tests pass.
- **Run 1 (`20261020-1344`):**
  - **Cmd 1, existing `fetch-real-postings.py`:** Shield AI 22 jobs, Zoox 239, Palantir 265.
    **Plaid: 404 → "not found", run continued, nothing invented** (break attempt 1 ✓).
  - **Cmd 2, extraction on the existing output:** 526 postings, 518 silent, 8 sentences, but **none
    of them from a network posting**.
  - **Cmd 3, full fetch:** 653 / 239 / 309.
  - **Cmd 4, title filter:** 12 network titles: include 7, flag 4, exclude 1 (Zoox "Road Network
    Tools", break attempt 3 ✓).
  - **Cmd 5, extraction:** 11 postings, 4 sentences, 7 silent.
- **Finding: the maintained scraper silently drops most of Shield AI.**
  `scripts/ats/scrapers/common/schema_validator.py:58` allows only
  `["Full-time","Part-time","Contract","Intern",""]`. Shield AI's "Full Time Employee" (551),
  "International Office Entity" (53) and "International EOR" (27) are rejected:
  **631 of 653, including all 5 network postings**. Palantir loses 44 ("Internship", "Fixed-Term").
  `fetch-real-postings.py` prints only "found 22 jobs" and does not surface `validation_errors`.
  Combined with the dropped `lists`/`additionalPlain` fields, **every authorization sentence in this
  run comes from postings the existing pipeline discards entirely.** The maintained files were not
  patched (CODEOWNERS: maintainer); this is logged as a defect / `[TODO: DEV]`.
- **Correction (Claude's error):** the 13:37 probe reported authorization hits in `additionalPlain`
  for Shield AI and Palantir. Its unanchored `ITAR` pattern matched inside "m**ilitar**y": 8 of 8
  such hits were false, and only 1 whole-word ITAR exists. The plan's claim that "every hit was in
  `lists` / `additionalPlain`" is therefore corrected: the real hits are all in `lists`.
- **Claude's fetch defect, found in run 1 and fixed:** `&nbsp;` was not decoded, and each Lever
  list was flattened into one run-on string. Network Engineer R4843 became one 126-word "sentence",
  and the Required vs Preferred section was lost. Fix: `html.unescape` plus one line per bullet,
  prefixed with its section. A regression test was added.
- **Run 2 (`20261020-1348`):** tests 8/8; cmds 3–5 re-run. **5 sentences, all Shield AI, all in
  `lists`, each with its section** (4 under Required, 1 under Preferred); 7 postings silent.
- **Cmd 6, `ats:liveness`:** 3 real URLs **active**; the fabricated
  `…/shieldai/00000000-…` **expired (HTTP 404)** (break attempt 4 ✓); exit 1 (the documented "any
  expired" code). Note: the npm echo masks the URLs as `***`; the script's result lines show them in
  full.
- **Cmd 7, 80 Days (company columns only):** Zoox 1,364 / 10; Palantir 462 / 4; Shield AI: empty
  H-1B fields.
- **Labels:** Claude proposed sentence, posting and title decisions in `LABELS.md`. **None is
  approved yet.** The S2/S4/S5 "contradicted" proposals depend on an outside rule (DoD clearances are
  generally U.S.-citizen only), marked **[verify]**.
- Break attempt 2 (the Visa false friend) is covered by the unit test (extracted, label stays null).
  Break attempt 5 (pipeline-induced silence) is shown by cmd 2 vs cmd 5.

**What changed:** Scripts, fixtures, tests, LABELS.md and run logs exist (untracked). Raw posting JSON
and the extraction outputs are in `private/` (ignored). **Stopped at the human label gate.**

---

### Entry 4: 2026-10-20 13:56–13:58 EDT. Labels approved; primary source fetched

**Tried:** Prathamesh read every sentence and decided:
- **S2, S4, S5:** "contradicted (inferred)", conditional on a primary source.
- **S1:** "insufficient" ("clearance preferred, not required").
- **Combination rule:** only Required sentences decide, and the most restrictive wins.
- **Titles:** the two software titles are out of scope (likely SOC 15-1252) and stay listed as
  "flagged, out of scope".

**What happened:**
- **Primary source:** the eCFR versioner API first returned "This endpoint requires response
  compression" (171 B). Re-fetched with `--compressed`: 32 CFR § 117.10 at 2026-10-01, 20,674 B.
  **§ 117.10(k)(1)** supports the inference, with a rare Limited Access Authorization exception,
  which (k)(2) says is not valid for TOP SECRET. § 117.10(l) bars temporary access for non-U.S.
  citizens. So the "(inferred)" labels stand. DCSA and EO 12968 were not needed and were not fetched.
- **Claude's error, caught and fixed:** the first SOURCES quote finished (k)(1) from memory ("…is not
  available"). The real text is "…is not readily available". Claude had also placed the
  temporary-basis sentence under (k)(2); it is in (l). Both were corrected against the fetched text
  before anything relied on them.
- LABELS.md was rewritten: approved labels as Prathamesh's judgment (2026-10-20 13:57 EDT), with
  Claude's proposals beside them.
  - **Shortlist (in scope): 7 postings. 2 contradicted (inferred) (R4843, R6030), 5 insufficient,
    0 supported.**
  - S3 ("…clearance desired", under Required) is labeled insufficient by the plan's rule.
  - **Two points were sent back to Prathamesh:** S1's text is about ITAR *knowledge*, not clearance,
    so the note may not match it; and the Zoox "Road Network Tools" exclusion was not explicitly
    confirmed.

**What changed:** Labels and sources are final, pending those two confirmations. No other
deliverable has been written yet.

---

### Entry 5: 2026-10-20 14:01 EDT. The two confirmations; labels final

**What happened:**
- **S1 note corrected at Prathamesh's request.** The 13:57 note "clearance preferred, not required"
  did not match S1, which names ITAR as subject knowledge in a Preferred line and says nothing about
  clearance. The new note is "ITAR knowledge preferred; not an eligibility rule". The label is
  unchanged: insufficient.
- **The Zoox "Software Engineer - Road Network Tools" exclusion is confirmed** (a false friend: a
  road-mapping software role, not network engineering).

**What changed:** LABELS.md is final. Writing of the deliverables starts now.

---

### Entry 6: 2026-10-20 14:01–14:06 EDT. Deliverables written; checks run

**Tried:** Wrote the recipe + card, DOMAIN-JUSTIFICATION.md, WORKED-RUN.md (with attestation),
README.md (brief → repo name mapping), the scripts README, and `logs/runs/2026fa-prpathak1-2.md`.
Then ran the unit tests, `npm run verify`, `npm run doctor`, `pii-scan` and the path checks.

**What happened:**
- **Claude's overclaims, caught while writing and corrected:**
  - (a) WORKED-RUN said 3 of 7 in-scope URLs were liveness-checked. It was **2**: the third was a
    Palantir URL later ruled out of scope.
  - (b) The recipe said gate **G4** was cleared. It is **not**: liveness covered only 2 of 7.
  - (c) The recipe and LABELS.md called the postings "live". They were fetched from live boards;
    only 2 were confirmed live.
- **Unit tests:** `Ran 8 tests … OK`.
- **`npm run verify`, first try: FAILED** (`E1 .ai/manifest.yaml does not parse`). The cause:
  Claude ran it with the external venv active, so `python3` became the venv Python, which has no
  `pyyaml`. **Re-run without the venv: exit 0** (168 files conform; manifest check passed, with the
  same 3 warnings as Phase 1). Conformance run directly on the 22 new files: 17 checkable files, all
  conform.
- **`npm run doctor`:** exit 0, "no private/PII paths are tracked". **Caveat:** doctor counts only
  *tracked* recipes (33, 318 TODOs), so it has not yet checked this recipe's frontmatter. A manual
  check gives `todos_open: 6` = 6 `[TODO` markers in the body.
- **`pii-scan`: 4 findings, none in a new file.** `package-lock.json` (upstream, unchanged) and 3
  employer accommodations addresses inside the raw posting JSON in gitignored `private/`.
  **But the check log Claude saved (`logs/checks-2026-10-20.log`) had copied those 4 addresses into
  a file that would be tracked.** That would be a DATA_CONTRACT zero-condition. They were redacted
  to `<email redacted>` before any commit. Re-scan of the add set: 0 email addresses.
- **Paths:** `git diff --name-only upstream/main` is empty (no tracked file changed). All 22 new files
  are in CI-allowed namespaces; no protected path; no `private/` file in the add set.
- **Lifecycle status: DRAFT** (see the report and the recipe). 6 typed open items block SPECIFIED.

**What changed:** All deliverables exist, uncommitted. Nothing has been committed, pushed or PR'd.

---

### Entry 7: 2026-10-20 14:10–14:12 EDT. Gate G4 closed; checks re-run

**Tried:** Run `npm run ats:liveness` (venv not active) on the 5 in-scope URLs not yet checked, then
re-run the checks.

**What happened:**
- **Liveness, 14:10:15–14:10:37:** R6158, R5667, R6030, Zoox Senior Manager and Zoox Staff Network
  Security Architect were **5 active, 0 expired, 0 uncertain** (exit 0). With the 13:47 check
  (R4843 and Zoox Senior Network Security Engineer), **all 7 in-scope postings are active.** None is
  excluded; the shortlist and counts are unchanged (2 contradicted (inferred), 5 insufficient,
  0 supported). The run-2 URLs were checked to be identical to run 1's for the two postings checked
  earlier. Log: `logs/worked-run-20261020-liveness-g4.log`.
- **G4 cleared (machine check).** WORKED-RUN (cmd 6b, the verified table, Tested, Did not test,
  reflection), the recipe's gate section, its TODO 6 text and summary, LABELS.md and the run log were
  updated. The recipe still has 6 TODOs (`todos_open: 6`), so the status stays **DRAFT**.
- **Claude repeated a known mistake:** the first re-run of the checks stopped after the unit tests,
  because `python3` is the `python3.cmd` shim and was called without `call` in the `.cmd` script (the
  same trap as the film project's FRICTIONAL Entry 22). Re-run with `call`.
- **Checks (14:11:38):**
  - unit tests 8/8 OK;
  - `npm run verify` exit 0 (168 files; manifest passed, 3 known warnings);
  - `pii-scan`: the same 4 findings, none in the add set (`package-lock.json` upstream + 3 in the
    ignored `private/`). This time the check log was kept outside the repo, so the addresses are not
    copied into a tracked file.
- **Add set:** 23 files, conformance passes, and 0 emails / usernames / phone patterns. 0 tracked
  changes vs `upstream/main`. All in CI-allowed namespaces; no `private/` or protected paths.
- **Attestation confirmation NOT recorded.** Prathamesh's item 2 arrived with the template's
  conditional instruction still attached ("[only send this line if true; otherwise tell Claude Code
  what is wrong instead]"), so Claude asked for an unambiguous confirmation before recording it, and
  before the commit.

**What changed:** G4 is closed. Waiting for the attestation confirmation before committing and
pushing.

---

### Entry 8: 2026-10-20 14:25 EDT. Attestation confirmed; TA decision on PRs; commit and push

**What happened:**
- **Attestation confirmed by Prathamesh at 14:25 EDT.** Prathamesh re-read the current attestation in
  WORKED-RUN.md, including the G4 changes, and confirmed it is accurate. Recorded in the attestation's
  "By" line.
- **TA decision (2026-10-20, relayed by Prathamesh):** PR #27 (Recipe Design assignment, Oct 3) and the
  new Mode Build PR should **both stay open**. The README mapping row and the draft PR description now
  say so; the PR checkbox stays "[ ] no", because it is not the only open PR. PR #27 was not touched.
- Then: checks re-run, commit, push to `origin` (fork prpathak1), ZIP built from the commit. The
  commit hash cannot be written inside its own commit; it is reported to Prathamesh after the push.
  The PR is opened by Prathamesh (the `gh` CLI is not installed).
