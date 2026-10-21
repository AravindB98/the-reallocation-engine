# FRICTIONAL — Data Analyst / OPT-90 / H-1B recipe

## Executive summary

This is an honest log of what happened while setting up and planning this assignment: what was tried, what was expected, what broke, how it was fixed, and who did what. The work so far was done in one session with an AI coding agent (Claude Code). The agent ran the commands, diagnosed the errors and proposed the fixes; I chose the career situation, supplied my visa facts, approved the one download, set the rule that everything stays local until I know where to push, and rejected the agent's suggestion to use a fictional persona for my own runs. Five things broke or surprised us during setup; all five are recorded below with the output that shows them. Entries 14–20 cover the later Mode Build assignment (2026-10-20 and 2026-10-21): moving to its layout, filling in my real inputs, two live runs on eight real job boards, the break attempts, and what broke along the way.

---

## Record

- **Student:** Atharva Hambir (GitHub `AtharvaHambir`)
- **Agent:** Claude Code (Claude Opus), run from the desktop app
- **Repo state:** fresh clone of `nikbearbrown/the-reallocation-engine` at commit `015843d`; no commits made, push disabled locally
- **Raw evidence:** `runs/baseline-2026-09-30/` (terminal output captured at the time, unedited except one redaction noted in entry 6)
- **Log policy:** entries are appended in order; nothing earlier is rewritten.

**Who did what — key used below:** **Me** = my decision or input. **AI** = done by the agent. **AI → Me** = agent proposed, I accepted / modified / rejected.

---

## Entries

### 1. `npm run verify` fails on a fresh clone — 2026-09-30

- **Tried (AI):** `npm install`, then `npm run doctor` and `npm run verify` as the assignment's setup step 3.
- **Expected:** both pass; the assignment lists the local-wage script as a fresh-clone failure (Fact 7), but not `verify`.
- **Happened:** `doctor` passed ("environment: ✓ runnable"). `verify` exited 1: conformance passed, then `manifest-check` crashed with `ModuleNotFoundError: No module named 'yaml'`. It shells out to bare `python3`, which on this Mac is Python 3.14 without PyYAML.
- **Response (AI):** confirmed `.venv/` is gitignored, created `.venv` with Python 3.12, installed `pyyaml`, re-ran `verify` inside it → passed with 3 warnings. Nothing tracked changed.
- **Learned:** Fact 7's missing-venv problem is wider than the assignment says — it also breaks `verify`, the command every PR must paste. Anyone running `verify` needs `source .venv/bin/activate` first.
- **Open:** is this a known issue or specific to machines whose default `python3` lacks PyYAML? Not yet checked on another machine.
- **Trace:** `runs/baseline-2026-09-30/baseline-verify.txt` (failure), `baseline-verify-venv.txt` (pass).

### 2. `verify` warns that private folders aren't gitignored — 2026-09-30

- **Happened:** `manifest-check` printed `W2 private path not gitignored (PII/secret risk): private/` and the same for `data/ats/`, which contradicts the assignment's statement that both are gitignored.
- **Checked (AI):** `git check-ignore -v` on files inside each folder → ignored by `/private/*` and `/data/ats/*`; only `private/README.md`, `private/.gitkeep`, `data/ats/portals.example.yml` are tracked.
- **Learned:** false alarm — the check tests the directory path, not its contents. Recorded so I don't "fix" `.gitignore` (weakening it is itself a zero-condition offense).

### 3. `ats:scan --dry-run` needs a config the clone doesn't have — 2026-09-30

- **Tried (AI):** `npm run ats:scan -- --dry-run` exactly as written in the assignment.
- **Happened:** `Error: portals.yml not found. Run onboarding first.` (exit 1).
- **Response (AI):** read `scripts/ats/scan.mjs` — it reads `REALLOCATION_ENGINE_PORTALS` or defaults to `data/ats/portals.yml`. Ran with `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml` instead of copying a file into the repo → 1 company (Databricks), 878 jobs, 71 after title/location filters.
- **Learned:** the assignment's command does not run on a fresh clone as written. The env-var route avoids creating any file.
- **Trace:** `runs/baseline-2026-09-30/baseline-ats-scan.txt`.

### 4. Liveness: missing browser, then a redirect loop — 2026-09-30

- **Tried (AI):** `npm run ats:liveness -- <Databricks analyst posting>`.
- **Happened (a):** Playwright's headless Chromium wasn't installed.
- **Response:** AI → Me: the agent asked before downloading (~95 MB); **I approved**; the agent ran `npx playwright install chromium`.
- **Happened (b):** the Databricks posting came back `⚠️ uncertain … ERR_TOO_MANY_REDIRECTS` — on both the company-site URL and the Greenhouse URL, because Databricks' Greenhouse board redirects back to its own site.
- **Checked (AI):** a fake job ID (`…/databricks/jobs/1111111111`) → `❌ expired`; a real Airbnb analytics posting → `✅ active` (exit 0). So the checker works; Databricks specifically can't be read.
- **Learned, and it changed the design:** the checker has three outcomes, not two, and its exit code (1 for anything not active) can't tell "uncertain" from "expired." The recipe's liveness gate now holds `uncertain` roles for a human instead of scoring them as live or dead. A large sponsor landing in "uncertain" means this will be common, not rare.
- **Also noticed:** the first Databricks match for "analyst" was a "P2P Data & Automation Lead" — keyword matching picks wrong roles. Fed into prediction 1 of the brief.
- **Trace:** `baseline-liveness.txt`, `baseline-liveness-gh.txt`, `baseline-liveness-dead.txt`, `baseline-liveness-airbnb.txt`.

### 5. The data can't support what the recipe first assumed — 2026-09-30

- **Tried (AI):** profiled the sponsorship CSV and the Form D samples before writing the brief.
- **Expected:** a usable funding join and broad H-1B coverage (the dataset is described as "30,000+ leads").
- **Happened:** only 1,557 of 30,369 rows carry H-1B fields; 34 list a "data analyst" title; there is no SOC column. The 196 Form D sample companies match **0** CSV companies by normalized name (the first attempt reported 1 name / 0 matches because the script read the wrong JSON key; fixed by reading `company.company_name_normalized`). Two companies (APRICUS / ASCUS BIOSCIENCES) have identical H-1B records — a likely join artifact.
- **Response:** funding is reported as unavailable on sample data rather than used; "no record" is treated as Unknown, never as "doesn't sponsor."
- **Trace:** `CHANGE-BRIEF.md` §2, §4.

### 6. Decisions I made, and the privacy correction they caused — 2026-09-30

- **Me:** chose the situation — MS student, Data Analyst roles, OPT **end date** ~90 days out (when the agent asked whether I meant end date or unemployment days, I clarified: end date), targeting H-1B sponsors.
- **Me:** told the agent my program is STEM. **AI:** added a dated revision to the brief — 150-day unemployment ceiling; the current end date still bounds the search because the extension needs an E-Verify employer; new E-Verify gate and failure case F7. The agent flagged that the E-Verify/extension reasoning is its understanding and must be confirmed with my DSO — **open until I do that.**
- **AI → Me, rejected:** after reading DATA_CONTRACT §Zero-Conditions, the agent pointed out the brief contained my real OPT end date (immigration details = PII if committed) and proposed switching to a fictional persona. **I rejected using a persona for my own runs** — I will use this tool for my actual search. **Resolution (AI, accepted by me):** real profile in `private/profile.yml` (gitignored, confirmed with `git status --ignored`); the brief says "about 90 days out"; committed fixtures and the worked run will use an invented persona; the prototype takes `--profile` with no default so committed code never reads `private/`.
- **Me:** decided nothing goes to GitHub until I know where to push; all work stays local.
- **AI:** while copying baseline output into this folder, `pii-scan.mjs` flagged an npm package author's email inside `npm-install.txt` (npm deprecation notice). Redacted in our copy only. The same address in `package-lock.json` is upstream and not mine.
- **Trace:** `CHANGE-BRIEF.md` → *Revisions* r1; `pii-scan.mjs` output (to be pasted in TEST-REPORT).

### 7. Design change: from "score roles" to a daily checker — 2026-09-30

- **Before:** the plan (brief §1–§5) scored a list of roles I had already found, using the sponsorship CSV.
- **Me — the idea:** I didn't want a scorer for roles I'd already found. I wanted a checker over *my own* target companies' job boards (Greenhouse, Ashby and similar): I pick the companies and supply their board links, and the recipe runs daily to find new postings worth my time.
- **AI:** checked what already exists before designing: `scripts/ats/scan.mjs` already reads Greenhouse / Lever / Ashby boards and remembers what it has seen (the "new since yesterday" core); `scripts/ats/providers/` has one small file per board. Found one gap: the providers return title / link / location only — no job text, so an experience filter needs new code.
- **AI → Me, answered:** the agent asked eight design questions; my answers are the spec:
  - one command I run each morning (no automatic schedule yet);
  - titles: Data Analyst, Data Analyst I, Associate Data Analyst, Business Analyst, Business Intelligence Analyst, Analytics Engineer, Data Engineer, Data Engineer I, Associate Data Engineer — no senior roles, 0–3 years of experience;
  - postings that don't state experience: keep and flag, never guess;
  - location: any US city or US-remote;
  - every new posting gets scored (sponsorship, E-Verify, liveness, timeline), not just listed;
  - hiring time: one default plus per-company overrides — **I set the default to 8 weeks**;
  - slug renamed to `data-roles-opt90-h1b-daily`, because Data Engineer maps to a different occupation code than Data Analyst;
  - **modified the agent's proposal:** it recommended marking Workday / iCIMS / other boards "out of scope." I chose Greenhouse + Ashby now and adding **one source at a time** later, so the tool grows with my search.
- **Consequence the AI pointed out:** a posting returned by the company's own board is a *record* that it's open, which is better liveness evidence than the browser check that looped on Databricks (entry 4).
- **Trace:** `CHANGE-BRIEF.md` → *Revisions* r2 (new failure cases F8–F10).

### 8. Building the prototype — 2026-09-30

- **AI — reuse before writing:** before writing code the agent found the repo's `greenhouse-watch` skill (described in its own docs as the default recipe for this term) and reused its fetcher — `board_url()`, `fetch_board()`, `normalize_jobs()` — instead of writing a new one: it already covers Greenhouse + Ashby, returns the job text the experience filter needs, and enforces the host allow-list with no redirects. SmartRecruiters is already in it, so it's the obvious "next source" when I add one.
- **AI — constraints found by reading the repo, not guessed:** CI runs Node 20 and Python 3.12; the conformance check skips folders named `data`/`output`/`tools`; `pii-scan.mjs` flags files *named* `profile.yml` / `resume.json` anywhere in the working tree, ignored or not. So the prototype is stdlib-only Python, reads JSON (YAML optional), and uses its own `candidate.json` format.
- **Tried (AI):** first offline sample run.
- **Expected:** a prediction written before running — Apply 6 · Consider 1 · Skip 2 · Held 4, 1 network target, 2 boards not checked.
- **Happened:** the counts matched exactly, but reading the report row by row found real problems the counts hid:
  - Coinbase was reported "no row in the sponsorship data" — wrong. The data has it as `COINBASE GLOBAL INC`; the exact name match missed, and the "did you mean" hint only listed companies *with* H-1B data, so it said nothing. My F2 test case had silently become an F1 case.
  - Apricus was labeled "no record" although a record exists — it is *untrusted* (duplicate of ASCUS), which is different.
  - the scorer's own line said "Apply 8" while the report said Apply 6, with nothing explaining the gap (the recipe's E-Verify gate applies after the scorer).
- **Response (AI):** hints now include rows without H-1B data; each held row names its exact status; the report explains that the scorer's counts come before the recipe's gates; the fixture gets `csv_name: COINBASE GLOBAL INC` so F2 is really exercised.
- **Learned:** matching counts proved nothing — the content was wrong in three places. Real employer names differ from legal names often enough (Notion → NOTION LABS INC, Coinbase → COINBASE GLOBAL INC, Chime → CHIME INC vs CHIME FINANCIAL INC) that the exact-match rule needs the `csv_name` field and the hint.
- **Tested (AI):** 18 offline tests pass (`test_daily_check.py`). **Deliberate breaks:** three one-line mutants — let a past OPT date through; score "unknown sponsorship" as a non-sponsor; ignore the E-Verify gate — each made the suite fail; the original was restored and byte-compared.
- **AI → Me, not yet reviewed:** migrated my real profile to `private/daily-check/candidate.json` + `targets.json` and removed `private/profile.yml` (same content; the old name kept tripping the PII scan). A run on my real inputs stops at the intake gate — unemployment days used, buffer days and my fit values are still empty, by design.
- **Open:** the filters have only run on synthetic postings; how they behave on real boards (prediction 1 in the brief) is untested until a live run.
- **Trace:** `scripts/contrib/2026fa/atharvahambir-data-roles-opt90-h1b-daily/`; `runs/prototype-2026-09-30/mutation-check.txt`.

### 9. A fictional persona of my own, repeatable break attempts, a local branch — 2026-10-03

- **Why (AI, from reading CONTRIBUTING.md and the PR template):** two gaps against the repo's own rules — break-attempt mutants are expected as `BROKEN-*` files in `fixtures/` (mine existed only as a saved log of hand edits), and the PR's privacy box asks that demos use fictional personas in `search/examples/` (my sample used a stand-in file inside my own folder).
- **Me:** I chose to create **my own** fictional persona instead of reusing one of the four existing personas, and told the agent not to use (or read) the others. Following the assignment's rule — real data stays private; an invented persona uses `@example.com` addresses — the persona is fictional: invented school, jobs, city and dates, a 555 phone number, an `@example.com` email, but the same *shape* of situation as mine (MS, entry-level data roles, OPT ending about 90 days out, STEM, needs H-1B and an E-Verify employer).
- **AI:** wrote the persona pack (`profile.yml`, `resume.example.json`, `gaps.md`, and `daily-check.candidate.json` in the checker's input format) under `search/examples/`; switched the sample run and tests to it; removed the old stand-in fixture after checking its values were identical. `pii-scan.mjs` raises nothing on the persona.
- **AI — repeatable break attempts:** `fixtures/BROKEN-mutants.json` lists four mutants as exact one-line edits (past OPT date passes the intake gate; "no sponsorship record" scored as a non-sponsor; E-Verify gate ignored; a start date after the deadline gets 0.5 instead of 0). `break_attempts.py` builds each in a temporary copy — the real file is never edited — runs the suite with `DAILY_CHECK_SCRIPT` pointed at it, and requires a named test to fail. **Result: all 4 caught.** Needed one code change: the script now finds the repo root by walking up, so a copy can run from a temporary folder.
- **AI — branch:** created `contrib/2026fa-atharvahambir-data-roles-opt90-h1b-daily` locally; no commits; pushing to the instructor's repo stays disabled. **Me:** everything stays local until I know where to push.
- **AI — evidence:** the outputs saved earlier the same day no longer matched the changed code, so they were re-captured (tests 18/18, sample run, conformance, verify, doctor, PII scan, git status, break attempts) and the index notes the overwrite.
- **Trace:** `search/examples/<persona>/`; `scripts/contrib/2026fa/atharvahambir-data-roles-opt90-h1b-daily/{break_attempts.py,fixtures/BROKEN-mutants.json}`; `runs/evidence-2026-10-03/09-break-attempts.txt`; `runs/INDEX.md`.

### 10. Writing the recipe and card — 2026-10-03

- **AI:** read the style references (`recipes/local-wage-adjustment.md` + `.card.md`, `recipes/scan.md`, `recipes/_shared.md`), entered plan mode (the repo's `CLAUDE.md` requires it before editing `recipes/`), and proposed a section-by-section plan.
- **AI → Me, two decisions I made:**
  - *Lifecycle status.* The agent pointed out that `SNICKERDOODLE.md` requires zero open TODOs for SPECIFIED, while the assignment requires the proposed additions to be listed as TODOs. **I chose the assignment's way:** RUNNABLE-SAMPLE. I accepted it because there is a reproducible sample run (tests, break mutants, saved output) but no live-run evidence, so RUNNABLE-LIVE is not claimed and the attestation stays null. The seven proposed additions are framed as roadmap items outside the demonstrated sample path.
  - *Parameters.* I reviewed and approved the four parameter groups the agent had proposed while building: sponsorship tiers, timeline curve, title word rules, title→SOC mapping. I kept the tiers as **user-defined heuristics, not verified DOL facts**, and the SOC mapping **display-only**, because the BLS wage doesn't feed the scorer.
- **Me — I reviewed the plan and sent back seven corrections before anything was written:**
  1. Don't say the TODOs block SPECIFIED while claiming RUNNABLE-SAMPLE (internally inconsistent).
  2. Sponsorship must stay a **vote**. Missing evidence is an *evidence-sufficiency* hold ("Needs you"), never a sponsorship gate, never p = 0 or "non-sponsor".
  3. Don't claim "no model-judgment" if text heuristics infer things. The recipe now says no language model is called, and names the three fixed text rules as rule readings of record text.
  4. Don't call the PII scan clean while it reports a finding. Show a baseline-vs-branch comparison.
  5. Reword git status as "all changed files confined to my assigned namespaces".
  6. Write an actual `logs/runs/` entry, not just a template.
  7. Name the OPT end date and the unemployment allowance as **two separate clocks**, and phrase E-Verify as **my** search constraint for the STEM-OPT pathway, not something the program determines.

  All seven were applied.
- **AI:** wrote `recipes/cases/2026fa/atharvahambir-data-roles-opt90-h1b-daily.md` (gates G0–G7, closed decisions, a verified-vs-inferred table, output contract, next action per result, the 8 "facts that bite", 7 typed proposed additions, failure cases mapped to tests, a run-log template), the card, and `logs/runs/2026fa-atharvahambir-1.md`. The run log leaves the human decision **pending** until I review the sample report myself.
- **Learned / honest gap found while writing:** failure case F5 (a sponsor on record with no matching title) shows in the report but has no dedicated test assertion; the recipe says so instead of claiming it's tested.
- **Broke during verification, fixed (AI):** the path check found my run log used `…/` to mean the evidence folder while the recipe used it to mean the prototype folder — both now spell out full paths. The PII baseline-vs-branch comparison first reported an extra finding: the output file was being written inside the repo while the scan ran, so the scan read its own half-written output (with the email not yet redacted). Redone writing outside the repo first → identical findings, 0 added.
- **Trace:** the recipe, card and run log above; `runs/evidence-2026-10-03/10-recipe-checks.txt`, `11-pii-baseline-vs-branch.txt`.

### 11. Worked run on a real board, and the domain justification — 2026-10-03

- **Me:** chose the worked run's target: Robinhood (`https://job-boards.greenhouse.io/robinhood`), my real target company, run as the fictional persona so no personal data is committed. I also added it to my private daily list.
- **Tried (AI):** step 1, a live run with the target exactly as I gave it. **Expected:** maybe one or two matching postings. **Happened:** 162 postings, **0 matching** (the closest were a Business Analyst *intern* and senior analyst roles). Robinhood came back "no row" because the CSV has it as `ROBINHOOD MARKETS INC`; the report suggested that row instead of calling Robinhood a non-sponsor.
- **Me, at the human gates:**
  - **G5:** confirmed Robinhood = `ROBINHOOD MARKETS INC` → `csv_name`.
  - **G4:** stated "it is E-verified" → recorded as my input, *not verified by the tool*.
- **AI:** step 2 → Proven (824 approvals, 97.2%) on the "Network, don't apply" list. Step 3, a deliberate typo in the board name → HTTP 404 → exit 4, nothing invented. Then a hand cross-check against CSV row 22735 (matched) and a sha256 comparison showing both live fetches read identical bytes.
- **Broke, fixed (AI):**
  - The step 1 report printed the similar-name hint twice.
  - The step 3 stop report said "fix what is named above" while the cause was listed below.

  Both are fixed in `daily_check.py`; tests and break mutants were re-run (18 OK, 4/4 caught). Also, one saved test capture first recorded a literal placeholder instead of the exit code (a quoting slip in the capture command); it was redone to record the real code.
- **Learned:**
  - The human gate mattered on real data: one answer turned "unknown" into a sourced sponsor record.
  - My title phrases miss data roles worded differently ("Data Solutions & Analytics Senior Analyst"), so prediction 1 in my brief was partly right. The proposed fix is a near-miss list in the report.
- **AI:** wrote `DOMAIN-JUSTIFICATION.md` (time saved stated as an estimate from listed assumptions, not a measurement), `WORKED-RUN.md` (real output pasted, verified-vs-inferred table, attestation) and `logs/runs/2026fa-atharvahambir-2.md`. **Open:** the attestation's sign-off box is unchecked until I read the reports myself.
- **Trace:** `runs/worked-run-2026-10-03/` (`step1–3-command-output.txt`, `cross-check.txt`, `after-fix-tests-and-breaks.txt`); `WORKED-RUN.md`; `logs/runs/2026fa-atharvahambir-2.md`.

### 12. Packaging the submission and the clean-checkout test — 2026-10-03

- **Me — where it goes:** the course repo, in my own folder `fall-2026/atharva-h/`, in a subfolder `reallocation-engine-recipe/` next to my Week 1 work. Inside it, the assignment's own layout: `recipes/cases/2026fa/…`, `scripts/contrib/2026fa/…`, `logs/runs/…`, `course/2026fa/submissions/…` (plus the persona under `search/examples/`). Local commits only; **nothing is pushed until I say so**. No pull request to the engine repo.
- **AI — the course repo's own rules, read before committing:** its `AGENTS.md` asks for one commit per lesson directory and no push without the user's authorization. Its CI (`scripts/validate_course.py`) fails on any `.js`/`.ts` file, any `.py` that doesn't parse, and any relative markdown link to a missing file. Those rules, run on my folder alone, flagged one thing: the README's link to this test report, which didn't exist yet.
- **AI — the clean-checkout test:** a fresh engine clone at `015843d` plus exactly the files staged for commit, copied in with the README's own `cp -R` command. `doctor` and `verify` behave identically before and after my files. The sample came out 6 / 1 / 2 / 4, 18 tests OK, 4/4 mutants caught. The past-OPT and missing-value runs stop with exit 2; the offline guard exits 1. The diff is only my namespaced paths. The PII finding is identical to the engine's own.
- **Broke during testing, fixed (AI):** the first capture saved `tail`'s exit code instead of the command's (`verify` without PyYAML showed `EXIT=0`); redone with `pipefail`. The comparison of committed and tested files was first planned for *after* the commit, which can't work because the result has to be inside the commit; moved to just before it. Reading the clean sample report showed run log 1 had Pinterest's preview score as 0.368; the report prints 0.367; corrected.
- **AI also wrote:** `SOURCES.md`, the CHANGE-BRIEF revision r3 (how each prediction turned out), the folder README, and `TEST-REPORT.md`.
- **Open:**
  - The assignment's PR to `the-reallocation-engine`, and its "CI green", aren't part of this submission location.
  - The engine's PII scan fails on its own lockfile.
  - My own read-through and sign-off of the reports is still to do.
- **Trace:** `TEST-REPORT.md`; `runs/clean-checkout-2026-10-03/` (`00`–`18`, `clean_test.sh.txt`); `SOURCES.md`; `CHANGE-BRIEF.md` → r3.

### 13. Fork, PR plan, and the slug rename — 2026-10-03

- **Me:** asked whether a fork existed (it didn't) and had one made: `AtharvaHambir/the-reallocation-engine`. The PR to `nikbearbrown/the-reallocation-engine` will come from it, and **the PR commit is the commit of record** for the Canvas ZIP. The course-repo folder carries an identical copy.
- **Me — renamed the slug** from `atharvahambir-data-roles-opt90-h1b-daily` to `atharvahambir-reallocation-engine`. That renames the prototype folder, the recipe and card files, and the branch (`contrib/2026fa-atharvahambir-reallocation-engine`). I kept my full name in the docs.
- **AI:** applied the rename to the code (the recipe id the script uses to find its own folder), README, recipe, card, persona profile and SOURCES. Saved terminal output under `runs/` was **not** edited, because it records what actually ran; WORKED-RUN and the two run logs carry a note that their pasted paths use the old name. Entries 1–12 above keep the old name too. After the rename: 18 tests OK, 4/4 mutants caught, sample unchanged (6 / 1 / 2 / 4). The clean-checkout test was rerun under the new name (`runs/clean-checkout-2026-10-03-renamed/`).
- **AI — remotes:** in the local clone, `origin` is now my fork, and the instructor's repo is `upstream` with pushing disabled.
- **Trace:** `TEST-REPORT.md`; `runs/clean-checkout-2026-10-03-renamed/`.

### 14. The Mode Build assignment and its decisions — 2026-10-20

- **Me:** pasted the 100-point Mode Build assignment and asked what it says, then asked the agent to check the existing work against it.
- **AI:** checked: `verify` and `doctor` still pass, the recipe and every deliverable exist, PR #38 is still open. But everything follows the *earlier* assignment's layout (`recipes/cases/2026fa/`, `course/2026fa/submissions/`, `contrib/` branch). The recipe also said "never edit `logs/RUN_LOG.md`", which conflicts with this assignment.
- **Me — decisions:** follow the new assignment's layout; log runs **both** in `logs/RUN_LOG.md` and in the submission; do a **fresh run on real, live job data, not a sample**; use **my real profile** (outputs stay private, tracked copies redacted); claim **RUNNABLE-LIVE**; open a **new PR** from a `mode/` branch.
- **Trace:** this conversation; plan approved in plan mode (the repo's `CLAUDE.md` requires plan mode before editing `recipes/`).

### 15. Filling in my real inputs — three stops at the intake gate — 2026-10-20

- **Me:** gave my target list: Greenhouse — Robinhood, Anthropic, Datadog, Discord; Ashby — Ramp, Perplexity, Notion.
- **AI:** confirmed every board answers (Perplexity's Ashby name is `perplexity`; `perplexity-ai` is a 404) and looked each company up in the sponsorship CSV. It proposed the legal names DATADOG INC, DISCORD INC, NOTION LABS INC, PERPLEXITY AI INC, RAMP BUSINESS CORP. **Found:** the only "Anthropic" in the data is *ANTHROPIC – A SERIES OF AURUM VP FUND LLC*, an investment fund, so it left Anthropic's legal name blank. **Me:** confirmed the names.
- **Happened — real stops, no defaults:**
  - stop 1: unemployment days used, as-of date and buffer days were empty.
  - stop 2: I gave an as-of date in the future, and the gate refused it (exit 2). I corrected it to the day of the run.
  - stop 3: the five title fit values were empty. I asked the agent what it wanted "in simple words". It re-explained fit as "how good a match are you for this kind of job, 0 to 1", and I gave: data analyst 1, BI analyst 0.7, business analyst 0.6, analytics engineer 0.8, data engineer 1.
- **Learned:** the gate caught my own typo before anything was fetched. Each stop named the exact field and never filled it in for me.
- **Trace:** `runs/worked-run-2026-10-20/breaks/intake-stops.txt`.

### 16. The live runs — 2026-10-20

- **AI — run 1 (7 boards):** exit 0 · 7/7 read · 1,737 postings · 1 match (Anthropic, Recruiting Analytics Data Engineer). `npm run ats:liveness` returned active.
- **AI → Me — the gate question:** the agent asked me to decide whether to apply to that posting. **I corrected the framing:** the mode isn't for applying; its job is to give back the postings that match my requirements. G7 became "do the kept and dropped lists look right?" I cleared run 1's six drops as correct, including Perplexity's "Member of Data Staff (Analytics Engineer)", which was dropped for the word "staff".
- **Me — mid-run addition:** Waymo is on Greenhouse and has a Data Scientist opening that matches me. **AI:** found "data scientist" wasn't one of my title phrases, so the role would have been dropped. It asked for a fit value; I gave 0.8 (SOC 15-2051).
- **AI — run 2 (8 boards):** exit 0 · 8/8 · 2,108 postings · 7 match · all held ("needs you": E-Verify unchecked; Anthropic/Waymo no CSV row; Ramp/Perplexity no H-1B fields). The existing scorer ran on Discord and Notion (0.555, Apply once E-Verify is recorded).
- **Broke, fixed (AI):** the liveness command for 7 URLs failed in zsh (`no matches found`), because the shell read the `?` in Waymo's URLs as a filename pattern. Quoted the URLs → 7 active.
- **Me — G7:** cleared run 2, noting Anthropic Data Scientist, Safeguards as a borderline keep (mixed experience statements) to read myself.
- **Trace:** `runs/worked-run-2026-10-20/run1-7-companies/`, `run2-8-companies/`; `logs/runs/2026fa-atharvahambir-3.md`.

### 17. Verifying it and trying to break it — 2026-10-20

- **AI — cross-check:** re-fetched all 8 board APIs with plain `urllib` (not the tool's fetcher). The first try failed: Ashby returned HTTP 403 to Python's default user agent. With a user-agent header, all 8 counts and all 7 posting IDs matched.
- **AI — break attempts:**
  - wrong board name `perplexity-ai`: 7/8 read, Perplexity "not checked today", nothing closed.
  - Anthropic's legal name set to the fund: **accepted with no warning**, a real limit.
  - `--dry-run` repeat: same counts, state file sha256 unchanged, **but it overwrote the day's report**.
- **Broke — agent's process error, plus a tool defect:** the agent didn't copy run 2's report before the dry run, so run 2's own report is gone. Its terminal output survives, and the tracked copy is the dry-run's (same postings, "0 new"). Logged as TODO 8 in the mode.
- **Broke, fixed (AI) — privacy:** the first redacted copy hid my dates but kept `slack_days`, and slack plus the start date would give away my OPT end date. Caught before any commit; slack is redacted too. The redaction script lives in `private/` so the strings it hides never enter the repo.
- **AI:** after the file moves, 18 tests OK and 4/4 mutants caught.
- **Trace:** `runs/worked-run-2026-10-20/breaks/`.

### 18. Moving to the new layout, logging, packaging — 2026-10-20

- **AI:**
  - Moved everything with `git mv`, so history is kept. The recipe and card are now `recipes/case-data-analyst-opt-h1b-15-2051{,.card}.md` (v0.2.0, RUNNABLE-LIVE, 8 TODOs), and the submission is `assignments/submissions/atharvahambir/`.
  - Archived the old worked run and wrote the new `WORKED-RUN.md`, updated `DOMAIN-JUSTIFICATION.md` (the Anthropic fund collision is failure mode #1), and wrote `PRESENTATION.md` and `RUN_LOG-entry.md`.
  - Appended to `logs/RUN_LOG.md` and added `logs/runs/2026fa-atharvahambir-3.md`.
  - Saved terminal output from earlier runs was not edited.
  - `verify`, `doctor` and the PII scan pass. A search for my real dates in the tree and in the zip finds nothing.
  - Local commit `aa0979c`; zip `reallocation-atharvahambir-mode.zip` (184 files, 253 KB). Nothing pushed.
- **AI — misread, corrected by me:** I told the agent what not to log here. It read that as "don't log this work in FRICTIONAL at all" and wrote no entries. I caught it before the push, and entries 14–18 were added afterwards from the session record.

### 19. A second real day, and my own statements — 2026-10-21

- **Me:** asked for one more run today using the trigger phrase. **AI:** told me the phrase ("Lets Begin Ultron"), and I said it.
- **AI — run 1:** exit 0 · 8/8 · 2,116 postings · 6 match · **1 closed overnight** (Waymo Product Data Scientist). Confirmed two ways: it's gone from Waymo's board API, and `npm run ats:liveness` says expired (6 active, 1 expired, exit 1 as designed). This is the first time the new/closed diff ran on real postings.
- **Me — statements:** "Anthropic does sponsor H-1B" and "all of them are E-Verified". **AI → Me:** the agent asked which tier for Anthropic (it recommended Likely, since no counts are known) and which companies "all" meant. **I chose Proven and all 8 companies.** Both are recorded as your-input, "stated by me; not verified by the tool".
- **AI — run 2:** Apply 4 (Anthropic ×2, Discord, Notion), with composites 0.615 / 0.555 checked by hand. 2 are still held (Ramp, Waymo: no sponsorship record). The report labels Anthropic's sponsorship *your-input* and Discord's and Notion's *record*.
- **AI:** added day 2 to `WORKED-RUN.md` and the evidence in `runs/worked-run-2026-10-21/` (same redaction). Wrote `logs/runs/2026fa-atharvahambir-4.md` and appended to `logs/RUN_LOG.md` and `RUN_LOG-entry.md`.
- **Learned:** two of my four Apply rows rest on my own word about Anthropic. The tool keeps that visible, but it can't make it true.
- **Trace:** `runs/worked-run-2026-10-21/`; `logs/runs/2026fa-atharvahambir-4.md`.

### 20. Keeping the professor's files untouched — 2026-10-21

- **Me:** before any push, I said the push must not touch other students' or the professor's work, only my own files.
- **AI:** compared the branch with the professor's repo: 160 files added, all under my own paths, plus **one shared file modified**, `logs/RUN_LOG.md` (my two entries appended, nothing else changed).
- **Me — decision:** take my entries out of the professor's `logs/RUN_LOG.md` and keep them only in my files. This replaces my earlier "log both ways" choice (entries 14, 18, 19 describe the append as it happened). **AI:** restored `logs/RUN_LOG.md` to the professor's version exactly. The entries live in `RUN_LOG-entry.md` and `logs/runs/2026fa-atharvahambir-3.md` / `-4.md`, which the assignment allows ("or include it in your submission"). The recipe's logging rule now says the same.
- **Me — where to push:** only my folder in the course repo for now. No PR to the engine repo yet, and no push to my fork; I'll ask the TA whether the PR is needed. PR #38 is left as it is.

---

## What I accepted, modified, rejected (summary)

| AI proposal | My response |
|---|---|
| `.venv` + PyYAML to make `verify` pass | accepted |
| Env-var route for `ats:scan` instead of copying a config | accepted |
| Download Playwright Chromium | accepted (asked first) |
| Hold "uncertain" liveness for a human | accepted |
| Fictional persona instead of my own profile | **rejected** for my own runs; accepted for committed files only |
| Lowercase handle in folder names | accepted (renaming later is trivial) |
| Score a list of already-found roles | **replaced** with my daily-checker design (entry 7) |
| Other job boards "out of scope" | **modified**: Greenhouse + Ashby now, one new source at a time later |
| 8-week default hiring time | accepted (my number) |
| Reuse an existing persona from `search/examples/` | **rejected** — I had my own fictional persona created |
| Lifecycle: follow the constitution (DRAFT) or the assignment (RUNNABLE-SAMPLE) | chose **RUNNABLE-SAMPLE** (the assignment's way), no live-run claim |
| Four proposed parameter groups (tiers, timeline curve, title rules, SOC map) | **accepted** after review — tiers as heuristics, SOC map display-only |
| The recipe plan as first proposed | **modified** — I sent seven corrections; all applied |
| Worked-run target | **my choice**: Robinhood, my real target, run as the fictional persona |
| `csv_name: ROBINHOOD MARKETS INC` suggested by the report | **accepted** at gate G5 (the question showed that row's approvals, denials and rate) |
| E-Verify for Robinhood | **my statement** ("it is E-verified"), recorded as unverified your-input |
| Submission location | **my decision**: course repo, `fall-2026/atharva-h/reallocation-engine-recipe/`, assignment layout inside, local commits, push only on my say-so |
| PR and slug | **my decisions**: fork + PR from `contrib/2026fa-atharvahambir-reallocation-engine`; the PR commit is the commit of record; slug renamed to `atharvahambir-reallocation-engine`; full name kept |
| Layout for the Mode Build | **my decision**: the new assignment's paths (`recipes/case-…`, `assignments/submissions/…`, `mode/` branch) |
| Fictional persona for the tracked worked run | **rejected** — my real profile, with tracked copies redacted |
| Legal names for my 7 companies | **accepted**; Anthropic left blank (only match is a fund) |
| "Decide whether to apply" at the gate | **rejected** — the mode returns matching postings; the gate is whether the lists are right |
| Status after the live run | **accepted** RUNNABLE-LIVE (not VERIFIED) |
| Anthropic sponsorship tier from my statement | agent recommended **Likely**; **I chose Proven** |
| E-Verify scope | **my statement**: all 8 companies enrolled (unverified) |
| Append to the shared `logs/RUN_LOG.md` | **reversed by me** — entries kept only in my own files |
| PR to the engine repo | **on hold** — pushing only to my course-repo folder until the TA confirms |

## Unresolved questions

- STEM extension mechanics (E-Verify employer, I-983, filing deadline) — confirm with DSO.
- Where the final work gets pushed — no instructions from the professor yet.
- Whether the `verify` / PyYAML failure should be reported upstream.
- Values still missing from my private profile: unemployment days used, buffer target.
- *Update 2026-10-20:* unemployment days and buffer are now filled in (privately). Still open: E-Verify for 7 companies; H-1B records for Anthropic, Waymo, Ramp, Perplexity; the dry-run defect (TODO 8).
- Whether the Mode Build also needs the PR to `the-reallocation-engine` — asking the TA.
