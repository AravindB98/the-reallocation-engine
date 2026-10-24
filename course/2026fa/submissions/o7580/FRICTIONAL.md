# FRICTIONAL — honest log

## Executive summary

This is the honest log of building the recipe and prototype: what was tried, what was expected, what broke, what was checked, and who did what. Most of the hands-on work in this first session was done by an AI coding agent, working step by step under my direction. This log says so plainly and records which decisions were mine. Nine real points of friction are recorded below. Three of them are defects in my own code that the agent's checks caught. Section 4 is for my own review, and must be filled in by me before I submit.

**Who:** Omkar Salian (GitHub `O7580`), with Claude Code (model Claude Opus 5.5) as the AI agent, in a single session on 2026-10-01.

---

## 1. Attempts, expectations, what happened, response

| # | Attempt | Expected | What happened | Response / learning | Trace |
|---|---|---|---|---|---|
| 1 | `npm install` | installs deps, no tracked changes | Installed, but **rewrote the tracked `package-lock.json`** (36 lines removed) | Restored with `git checkout package-lock.json`. Use `npm ci` (verified: leaves the lockfile untouched). Otherwise the PR would have carried an unrelated file. | `TEST-REPORT.md` §1, §3 |
| 2 | `node scripts/pii-scan.mjs` on the **untouched** clone | clean | **exit 1:** `[email] package-lock.json — <npm-package-author-address, redacted>` (an npm package author) | Pre-existing upstream false positive, not mine to fix (the parent file is protected). The branch-history scan CI runs on PRs is clean. *Unresolved question:* will the working-tree job in CI fail for every student? It runs `node scripts/pii-scan.mjs` unconditionally. | `baseline/pii-before.txt`; `clean-checkout-run.txt` |
| 3 | `npm run ats:scan -- --dry-run` | dry-run report | `Error: portals.yml not found. Run onboarding first.` | Copied `portals.example.yml` to the gitignored `data/ats/portals.yml`. Learned that "dry-run" still makes live Greenhouse API calls. It only skips writing files. | `baseline/ats-scan-dryrun.txt` |
| 4 | `npm run ats:liveness` | liveness lines | `browserType.launch: Executable doesn't exist` | `npx playwright install chromium` (≈95 MB). A setup step the assignment's "get the engine running" list doesn't mention. | `worked-run.md` §2 |
| 5 | Dead-posting test: a fabricated Greenhouse job ID on PathAI's board | `❌ expired` | `⚠️ uncertain … Timeout 15000ms exceeded` | `curl -L` showed a **200 redirect** to the careers page. Dead Greenhouse IDs don't 404 at the HTML URL. My CHANGE-BRIEF prediction was wrong; I recorded it as a revision rather than editing the prediction. Proposed the board-API check (recipe TODO 3). | `CHANGE-BRIEF.md` Revisions |
| 6 | First full prototype run | timeline factor in `roles.json` | `"timeline": { "source": "your-input" }`, **no factor**. Yet the decisions looked right. | Cause: `{ factor: {…}, ...tl }` spread order overwrote the labeled object. The scorer's `?? 1` hid it, and since every true factor was 1, the output was identical. Fixed the order and added a guard that refuses non-numbers. **Learning:** identical output is not evidence of correct code when the downstream tool has fail-open defaults. | `break-tests.txt` Break 1 & 3 |
| 7 | Reading posting text for the scenario | sponsorship-friendly SWE postings at known sponsors | Ginkgo's live posting: "We are unable to sponsor or take over sponsorship of H-1B visas at this time." (122 recorded approvals) | Added a posting-statement override through the scorer's existing override rule. It became failure mode 1 in the domain justification. | `worked-run.md` §3 |
| 8 | Reviewing the evidence lines in the report | Ginkgo "senior-only" tier makes sense | The only "SWE" title was "Software Engineering **Manager**", a management job | Excluded management titles that name no engineer/developer/programmer. Ginkgo went Likely → Possible, with 3 new test assertions. | `lib.mjs` `MANAGEMENT`; test 4 |
| 9 | `node --test <dir>/test/` | runs the folder | `Cannot find module …/test` (Node 22) | Documented command names the file. Also: an out-dir in macOS `/var/folders/…` was refused because `/var` → `/private/var`. Fixed by resolving the nearest existing ancestor. | test 12 |
| 10 | Final clean-checkout run, with the history scan (`pii-scan --diff`) over **all** my files | clean | **5 findings, all mine:** quoting the upstream false-positive email address in my own reports and transcripts made my branch trip the scanner | Redacted the address in every file, with a note in the verbatim transcripts. **Learning:** quoting a PII finding spreads it; describe it, don't paste it. | `clean-checkout-run.txt` |

Also caught while writing, before anything shipped: the domain justification first listed Everquote as a "senior-only SWE sponsor". The CSV row check showed its titles don't contain "software", so the prototype would call it *Possible*. Removed.

## 2. What was checked, changed, or learned; open questions

- **Checked by hand against raw files**, not through my parser: PathAI, Vestmark, Databento, DraftKings, and HubSpot rows (`grep`/`awk` + Python `csv`), and the BLS 15-1252 median. All match.
- **Checked a claim before stating it:** "Formlabs would score Apply despite fit 0.2". Re-ran with one liveness line flipped in a temp dir and got `composite 0.375 → Apply`.
- **Changed:** `--days-used` was added after realizing a late `--as-of` with an un-updated persona gives a confidently wrong answer (Break 5). The stale case still only flags. It doesn't block.
- **Decided not to change:** the scorer weights, the threshold, or the gate default. All are in a maintained file. I proposed them as a maintainer TODO instead of patching, because a contribution that tunes the scorer until the sample looks "healthy" would be weakening the rule.
- **Open questions:**
  - Is `min_approvals_for_proven = 3` the right line? It's a judgment, not a statistic.
  - How stale is the 80 Days CSV? Its README doesn't state a fiscal-year range for the DOL/USCIS join.
  - Should the recipe claim RUNNABLE-SAMPLE? I kept DRAFT because the constitution requires zero open TODOs for SPECIFIED, and the assignment asks for typed proposals. That tension is worth asking about in class.

## 3. Human / AI contributions

| Part | AI agent (Claude Code) | Me (Omkar) |
|---|---|---|
| Choice of situation | Proposed the exact framing (December grad, ~2 years prior experience, SWE I/II, Boston) from what I'd told it about my own search in earlier sessions | Mine: it's my real situation. I chose to build for it and to use a fictional persona in every committed file |
| Reading the repo and governing docs | Read SNICKERDOODLE, DOMAIN, CONTRIBUTING, DATA_CONTRACT, the scorer, the style-reference recipes, and CI | Directed the work ("go step by step, follow every rule"); **did not commit or push**, by my instruction |
| CHANGE-BRIEF predictions | Drafted them before writing any code | *To confirm in §4* |
| Prototype code, tests, fixtures | Wrote all of it | *To confirm in §4* |
| Posting selection and field transcription | Queried public Greenhouse boards for MA sponsors, read the posting text, typed the fields | Must re-read every posting before G4 can clear |
| Fit values (0.2–0.8) | Typed from the posting text for the fictional persona | Must accept or replace; these are labeled your-input |
| Parameter values (tier map, 3 approvals, 45-day lag, 30-day comfort, 14-day buffer) | Proposed, with the reasoning in the recipe | *To accept or change in §4* |
| Running the checks and the break attempts | Ran everything in TEST-REPORT and the attestation | I must re-run the "Tested" rows myself before signing the attestation |
| Lifecycle claim (DRAFT) | Recommended it, with the reason | *Decision is mine* |

What the AI did **not** do: it produced no model-judgment values in any output (`model_judgments_used: 0`). It didn't read `private/`, `search/`, or my real tracker or résumé for any committed file. And it didn't push or open a PR.

## 4. My review — to be completed by Omkar before submission

*(The AI must not fill this section in. It's for what I personally checked, accepted, changed, or rejected.)*

- What I re-ran myself, and what I saw:
- Postings I re-read, and any field I changed:
- Parameters I accepted / changed (and why):
- Anything in the recipe or reports I disagree with or rejected:
- What I'll say in the five-minute presentation as the one honest limitation:

## 5. Traceability

- Transcripts: `baseline/*.txt` (before/after toolchain), `clean-checkout-run.txt`, `break-tests.txt`, `runs/*/triage-stdout.txt`
- Tests: `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs` (13)
- Run log: `logs/runs/2026fa-o7580-1.md`
- Commits: none yet (by instruction). Add the branch commit SHAs here after committing.
