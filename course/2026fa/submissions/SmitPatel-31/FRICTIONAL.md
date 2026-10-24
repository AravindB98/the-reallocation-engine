# FRICTIONAL — SmitPatel-31

An honest log of attempts, expectations, difficulties, responses and learning.
Each entry marks who did what: **Smit** (me) or **Claude** (the AI coding agent, Claude Code, used in this session).

> Note: Claude drafted these entries from the session transcript. I (Smit) review and edit each one
> before submission, and any wording I changed is my own.

---

## Entry 1 — 2026-09-30 — Fork, clone, install, baseline

**Tried**
- Smit: ran `gh repo fork nikbearbrown/the-reallocation-engine --clone ~/Developer/the-reallocation-engine`. The fork was created and cloned; `upstream/main` was set.
- Claude: ran `npm install`, `npm run doctor`, `npm run verify` inside the clone and saved the raw output to `baseline/`.

**Expected**
- Both commands pass on a fresh clone, since the assignment names them as the toolchain check.

**What happened**
- In Claude's shell, doctor showed the environment as runnable and verify passed with 3 warnings.
- When Smit ran `npm run verify` in their own terminal, it **failed**: `ModuleNotFoundError: No module named 'yaml'` → `E1 .ai/manifest.yaml does not parse` → `✗ manifest check FAILED`.

**Checked / responded**
- Claude's first guess was a missing PyYAML and it suggested `pip install pyyaml` (and a `--break-system-packages` variant).
- Smit ran both. Each reported `Requirement already satisfied ... /opt/anaconda3/...`, so that guess didn't explain the failure in *this* terminal.
- Smit ran `which python3 && python3 -c "import yaml; print(yaml.__version__)"` → `/opt/anaconda3/bin/python3`, `6.0.1`.
- Smit reran `npm run verify` in that terminal and it **passed** (`✓ manifest check passed (3 warnings)`).

**Learned**
- `scripts/manifest-check.mjs` shells out to whatever `python3` is first on PATH and needs PyYAML. The repo doesn't declare that dependency.
- The failure most likely came from a terminal where the conda `(base)` environment wasn't active.
- The pip commands didn't fix anything. They were run in a terminal that was already fine.

**Follow-up**
- Smit ran `/opt/homebrew/bin/python3 -m pip install --user --break-system-packages pyyaml`. It **downloaded and installed** `pyyaml-6.0.3` (cp314 wheel). So Homebrew's Python 3.14 did lack PyYAML, while Anaconda's 3.12 had it.

**Unresolved**
- I still did not capture `which python3` in the terminal that failed. "That terminal used Homebrew Python 3.14" is the best explanation (it's the only interpreter found without PyYAML), but it's an inference, not something I observed.

---

## Entry 2 — 2026-09-30 — Checking the W2 "private path not gitignored" warnings

**Tried**
- The verify output warned `W2 private path not gitignored (PII/secret risk): private/` and `data/ats/`. That matters here because personal data leaking into git history is graded.

**Checked**
- Claude ran `git check-ignore -v private/test.txt data/ats/test.json search/resume.json`. All three are ignored by `.gitignore` lines 37, 40 and 50 (`/private/*`, `/data/ats/*`, `resume.json`).

**Learned**
- The warning is a false positive: the checker looks for a literal pattern string, not actual ignore behavior. I didn't take the warning at face value, and I didn't dismiss it without checking either.

**Human / AI split for entries 1–2**
| Item | Who | Accepted / modified / rejected |
|---|---|---|
| Fork + clone command | Smit ran it (Claude proposed it) | accepted |
| `pip install pyyaml` fix | Claude proposed, Smit ran | turned out unnecessary; Smit's `which python3` check changed the diagnosis |
| W2 false-positive check | Claude ran it | accepted; recorded in TEST-REPORT §1 |

**Traceability**
- Commit tested: `015843d` (upstream main, unmodified)
- Raw outputs: `baseline/baseline-doctor.txt`, `baseline/baseline-verify.txt`
- Also in TEST-REPORT.md §1

---

## Entry 3 — 2026-09-30 — Choosing the angle from the data

**Tried**
- Smit chose: general SWE, pre-OPT, "proven big sponsors", STEM degree, December graduation, OPT start in January.
- Claude profiled the CSV with pandas. **That failed**: Anaconda's pandas crashed on a NumPy 1.x/2.x ABI mismatch. Claude switched to Python's stdlib `csv` and then wrote the prototype in Node with no dependencies, partly for this reason.

**What the data showed (Claude ran the queries; Smit accepted the angle)**
- 152 companies have ≥ 100 approvals, but the top sponsored titles are often Senior/Staff (LinkedIn, Uber) or non-SWE (Deloitte, Virtusa). This became the recipe's hidden signal.
- Google, Amazon, NVIDIA, Oracle, IBM, Cisco and Adobe have **no row**. `data/80-days-to-stay/README.md` says the CSV starts from SEC Form D filers. Recorded as CHANGE-BRIEF revision R1 *before* building.
- Salesforce appears twice with identical numbers → new failure case (ambiguous match).

**Human/AI split**
| Item | Who | Accepted / modified / rejected |
|---|---|---|
| Situation facts (dates, STEM, role, company type) | Smit | — |
| "newgrad-swe-bigsponsor" angle | Claude proposed from the data | Smit accepted |
| December-grad timeline insight (summer starts vs. 90-day limit) | Claude derived from Smit's dates | Smit accepted. **Rules still to be confirmed with Northeastern OGS** |
| Keeping real dates in gitignored `private/opt-profile.json`; fictional persona in commits | Claude proposed (DATA_CONTRACT counts immigration details as PII) | Smit accepted |

---

## Entry 4 — 2026-09-30 — Building and breaking the prototype

**Tried**
- Claude wrote `lib.mjs`, `triage.mjs`, `triage.test.mjs` and the fixtures. The prototype runs the existing scorer as a CLI; no copy of the scorer.
- `node --test <directory>` failed with `Cannot find module …` on Node 22. Fix: pass the test file path instead.

**Expected vs. happened**
- Expected some tests to fail on the first run; **all 13 passed first time**. That seemed too easy, so Claude ran mutation tests (edit the code to be wrong, check the tests fail):
  - M1 expired posting treated as live → caught **only by the unit test**. The end-to-end test still passed. **Gap:** added an end-to-end assertion that an `expired` input reaches the scorer with liveness 0. Re-ran M1: now caught by both.
  - M2 timeline ignores deadline → caught. M3 unchecked liveness sent to the scorer → caught. M4 ambiguous match picks the first row → caught.
- Reading the sample report found a **report bug**: Microsoft's start date was *estimated* (the posting has none), but the report showed it exactly like a stated date. Fixed: the report now says "start date ESTIMATED …", and a test checks it.

**Found in the existing code (not changed)**
- `role-scorer.mjs` gives a role with no liveness/timeline object a gate of `1` (open). So my prototype must exclude unchecked roles *before* the scorer. It does, and a test checks it.
- Deloitte (no SWE titles, tier Unknown p = 0.15) still came out **Consider 0.2325**, because a self-rated fit of 0.6 alone nearly reaches the scorer's Consider floor (0.20, marked `[VERIFY]`). I did not change weights to "fix" this; it goes in the worked-run reflection.
- The title rule misread Virtusa's `JAVA ENGINEER 2` / `.NET ENGINEER 2` as non-SWE, as predicted in CHANGE-BRIEF §5. Left in v0.1 and logged as a v0.2 TODO rather than quietly tuned.

**Unresolved**
- The tier → p values, the 100-approval threshold, the 14-day buffer and the 45-day hiring lag were **proposed by Claude**. They stay `[TODO: DEFINE]` until Smit sets them with their own reasoning.
- Lifecycle status: SNICKERDOODLE requires zero open TODOs to leave DRAFT, but the assignment asks for typed TODOs in the recipe. Currently honest at **DRAFT**.

**Traceability**
- Mutation run: done in place with backups; restored files diffed identical before continuing.
- Sample output: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/` (run with `--today 2026-09-30`).

---

## Entry 5 — 2026-09-30 — Decisions, fresh-clone test, documents

**Decisions I made (Smit)**
- Kept the proposed tier values (0.9 / 0.6 / 0.3 / 0.15) over a more cautious alternative, and kept 100 / 14 / 45 over a 60-day hiring lag.
- Chose **DRAFT** over RUNNABLE-SAMPLE after Claude explained that every RUNNABLE-SAMPLE recipe in the repo has 0 open TODOs.
- Gate decisions: G2 accept for sample only; G3 downgrade Microsoft to "confirm start date first"; G4 accept as scored. For **G1 I told Claude to use its judgment**. It kept Google, Meta and Salesforce excluded, and the run log says the decision was delegated.
- Said **don't commit or push yet**.
- Offered my résumé; Claude declined to open it (zero-condition risk, not needed by the recipe).

**What Claude did**
- Re-ran everything in a **fresh clone** of my fork with only my files copied in. Tests 13/13, sample run, three break cases (exit 3, 2, 2), `pii-scan --diff main` clean.
- Found a new trap: `npm install` on a fresh clone rewrites `package-lock.json` (36 lines deleted). It must be reverted before committing, or the PR touches a file outside my namespace.
- Hand-checked Pinterest's and Deloitte's CSV rows and the BLS 15-1252 median against the report, and recomputed three composites by hand. All matched.
- Drafted WORKED-RUN, DOMAIN-JUSTIFICATION, TEST-REPORT §2–6, the run log, SOURCES, SUBMISSION and presentation notes.

**Unresolved / still mine to do**
- CHANGE-BRIEF §5 is still Claude's wording, marked as a draft.
- ~~I haven't re-run the tests myself.~~ Done 2026-10-01: Smit ran `node --test …/triage.test.mjs` in their own terminal → 13 pass, 0 fail. Added to the attestation.
- OPT rules not confirmed with Northeastern OGS.
- No commit, no PR, no CI run yet, so GitHub posting points (4 + 3) can't be earned until that happens.

---

## Entry 6 — 2026-10-01 — Re-running the checks myself

**Why:** I asked why the attestation said "By: Claude Code". Claude explained that the attestation must name who actually ran each row; claiming rows I hadn't run would misrepresent verification. So I re-ran them.

**Ran (Smit, own terminal):** the test suite (13/13 pass), the sample run (`Apply 1 · Consider 4 · Skip 3 · Needs-human 4`), the three break cases (exit 3, 2, 2), and a `grep` of Pinterest's raw CSV row (`1364.0, 16.0, …, 156853.0`).

**Noticed:** without `--today`, the closed-window deadline printed as **2026-10-01** (the real date) instead of 2026-09-30 in Claude's run. The deadline is computed from the run date, so this is expected, but it means outputs are only reproducible when `--today` is pinned.

**Still Claude-only:** the four mutation tests and the `pii-scan --diff` check.

---

## Traceability index

| Evidence | Where |
|---|---|
| First commit of all work | `716b6ad` on `contrib/2026fa-SmitPatel-31-newgrad-swe-bigsponsor` (pushed to my fork 2026-10-01) |
| Baseline before changes | upstream `015843d`; raw output in `baseline/` |
| Tests | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs` (13 tests) |
| Sample output | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/` |
| Fresh-clone and clean-branch-checkout runs | TEST-REPORT.md §2, §2b |
| Mutation tests, break cases, my own re-runs | WORKED-RUN.md → Attestation |
| Gate decisions | `logs/runs/2026fa-SmitPatel-31-1.md` |
| Session transcript | Claude Code desktop session, 2026-09-30 → 2026-10-02 (available on request) |
