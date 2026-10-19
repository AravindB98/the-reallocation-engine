# Mode-Build Recon — upstream/main snapshot

## Executive summary

**What this is.** A read-only survey of the shared upstream copy of the project, taken before starting the mode-build enhancement. It records what the upstream branch contains today: its commands, its rules for recipe status and to-do items, where submissions are expected to go, which student case recipes exist, and how the posting-liveness checker and the repository health check behave.

**Why read it.** The enhancement has to fit the upstream tree as it really is, not as remembered. Several things here differ from what a reader might assume, and those differences decide where files go and what status claims are honest.

**What it found.**
- Upstream has **no new commits** since the last sync point; the earlier pull request is still **open, not merged**, and the earlier case recipe is **not** upstream.
- All six commands asked about exist, and so does the SEC refresh script.
- The assignment text says to put write-ups under a top-level `assignments/submissions/` folder, but **no such folder exists upstream**. The only assignment documents live under `course/`, and `course/2026fa/` does not exist upstream (it exists only on this local branch).
- Student case recipes live under a per-term folder (14 summer-2026 cases, all at the earliest status). The cases folder's own README says a case can only be promoted to the main recipes folder once it has a logged sample run.
- The liveness checker opens each posting in a headless browser (it **does** make network calls), prints plain text rather than JSON, and exits with code 1 if any posting is expired or uncertain.
- The health check is read-only. It checks tools, command targets, folders, a private-data leak guard, and a recipe status dashboard. The dashboard **only scans the top-level recipes folder**, so case recipes in subfolders are never counted or checked for to-do mismatches.

## Run record

- Date: 2026-10-19 · Local branch: `enhance/data-titles-h1b-entry` (at `57a2015`)
- Ref inspected: `upstream/main` (after `git fetch upstream`)
- Method: `git show` / `git ls-tree` / `git log` against `upstream/main` only; `gh pr view 29`. No files modified other than this report.

---

## 1. Upstream commits since 015843d

`git fetch upstream` returned no new refs. `git log --oneline -15 upstream/main`:

```
015843d fix(greenhouse-watch): justification lines now sum to the score
e1dd0cb greenhouse-watch: SmartRecruiters provider (Canva); 7-board Advocate-role sweep
992287b greenhouse-watch: Ashby boards, ignore_skills, board_cards.py; Writer pass (TENTATIVE + ALL + KEEP)
016fa36 reports: Figma ALL (152 cards) + KEEP (human shortlist) alongside the TENTATIVE match list
eb89ab7 P9: every human-facing document opens with an executive summary
ab6c824 reports: Figma greenhouse-watch pass 2026-09-19 (TENTATIVE, human gate open)
a212834 course: link the greenhouse-watch explainer video in the assignment
f712880 book: chapter edits from the working tree (2026-08-23)
784b183 youtube: reel paperwork for the claude-liam reels (media excluded)
8ec7b14 course: Fall 2026 assignment — Greenhouse Watch + cc-explainer
177f522 feat(skills): greenhouse-watch — diff one Greenhouse board against a JSON résumé
4133d30 gitignore: reel media, loop state, QC scratch
9236b5a README: front-door rewrite — start-here table, quick start, layout map, book/chapters links
d08afdd Fall 2026 fresh cut
```

`git log --oneline 015843d..upstream/main` → **empty. `015843d` is the upstream/main head; zero commits since.** (The log shows 14 lines, so upstream/main has 14 commits in total.)

## 2. PR #29 status

`gh pr view 29`:

```
{"headRefName":"contrib/2026fa-meenuviji-data-titles-h1b-entry","mergedAt":null,"state":"OPEN",
 "title":"data-titles-h1b-entry — DRAFT (prototype runnable on sample data)",
 "url":"https://github.com/nikbearbrown/the-reallocation-engine/pull/29"}
```

- **Not merged** (state OPEN, mergedAt null).
- `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md` on upstream/main: **absent**. No path matching `meenuviji-data-titles` exists anywhere in upstream/main, and `recipes/cases/2026fa/` does not exist upstream.

## 3. npm scripts (package.json on upstream/main, verbatim)

```
verify: node scripts/conformance.mjs && node scripts/manifest-check.mjs
manifest-check: node scripts/manifest-check.mjs
eval:score: node scripts/eval/score-run.mjs
eval:report: node scripts/eval/report.mjs
doctor: node scripts/doctor.mjs
bls:local-wage: python3 scripts/bls/local-wage-adjustment.py
build-instructions: node scripts/build-instructions.mjs
to-markdown: node scripts/to-markdown.mjs
score: node scripts/score/role-scorer.mjs
score:gates: node scripts/score/gate-harness.mjs
ats:dedup: node scripts/ats/dedup-tracker.mjs
ats:liveness: node scripts/ats/check-liveness.mjs
ats:merge: node scripts/ats/merge-tracker.mjs
ats:normalize: node scripts/ats/normalize-statuses.mjs
ats:scan: node scripts/ats/scan.mjs
ats:verify: node scripts/ats/verify-pipeline.mjs
resumes:pdf: node scripts/resumes/generate-pdf.mjs
svg-to-png: node scripts/svg-to-png.mjs book/images
audit:layout: node scripts/svg-layout-audit.mjs book/images
postsvg-to-png: node scripts/svg-layout-audit.mjs book/images || true
skill-demand: node scripts/score/skill-demand-monitor.mjs
skill-demand:test: node scripts/score/skill-demand-monitor.test.mjs
fetch-postings: python3 scripts/ats/fetch-real-postings.py
demo:real: bash scripts/run-real-demo.sh
pii-scan: node scripts/pii-scan.mjs
```

| Script | Exists |
|---|---|
| verify | yes |
| doctor | yes |
| score | yes |
| ats:scan | yes |
| ats:liveness | yes |
| resumes:pdf | yes |
| `scripts/sec/refresh-recent-sec-quarters.py` | **yes** (blob present on upstream/main) |

## 4. Governance passages (verbatim, upstream/main)

### SNICKERDOODLE.md

**P5 (line 25):**
> 25: **P5 — Two customers, twice.** Every recipe is executable by the agent and readable by the domain human. Every run produces a log for agents and a report for humans. One artifact cannot serve both.

P5 is also named at line 37 (end of P9):
> 37: … A document whose first screen is a parameter table has failed P5 — it serves the agent, not the human.

**Lifecycle statuses, P6 reference (line 28):**
> 28: **P6 — Intent lives in the recipe; truth lives in the run.** The recipe is authoritative for what should happen; the audit is authoritative for what did happen. A recipe's authority grows with its lifecycle stage (below): a DRAFT is a hypothesis; only a VERIFIED recipe carries evidence its intent is achievable. Disagreement between recipe, script, and run is a logged defect — no artifact silently wins.

**Attestation in P8 (line 34):**
> 34: **P8 — Trust is earned, not configured.** Dialogic mode is the default: a human at every gate. Silent mode is earned through documented runs and a recorded attestation, and is revoked by any change to the recipe or its scripts, any upstream schema change, or implausible output. Model judgments are always labeled as judgments.

**Verification stack (lines 45–46):**
> 45: 3. **Attestation** — the human's record of having judged the audits and the running system. The record **is** the attestation; there is no verdict field (see format below). Thin testing exposes itself.
> 46: 4. **VERIFIED** — the status transition is the verdict; the record is the justification.

**Recipe Lifecycle: statuses, todos_open↔status, attestation field (lines 48–71):**
```
48: ## Recipe Lifecycle
49:
50: Every recipe carries status frontmatter. The status is a claim; per P3, each transition needs a logged evidence artifact. Editing the status field without the evidence is a violation, not a promotion.
51:
52: ```
53: DRAFT ──► SPECIFIED ──► RUNNABLE-SAMPLE ──► RUNNABLE-LIVE ──► VERIFIED
54: ```
55:
56: | Transition | Gate test | Evidence |
57: |---|---|---|
58: | DRAFT → SPECIFIED | zero open `[TODO]` items; each closure has its required evidence (table below) | the closures themselves, in the recipe |
59: | SPECIFIED → RUNNABLE-SAMPLE | full sample run completes; conformance checks pass; audits generated and read | RUN_LOG entry + audit files |
60: | RUNNABLE-SAMPLE → RUNNABLE-LIVE | live run with a human clearing every gate | logged gate decisions |
61: | RUNNABLE-LIVE → VERIFIED | attestation recorded, bound to this recipe version | attestation record |
62:
63: ```yaml
64: ---
65: status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED
66: todos_open: 0
67: last_gate: null        # e.g. "sample-run, 2026-06-14, logs/RUN_LOG.md#2026-06-14"
68: attestation: null      # path to attestation record, set only at VERIFIED
69: recipe_version: 0.1.0
70: ---
71: ```
```

How todos_open relates to status: the only explicit link is line 58. Leaving DRAFT requires **zero open `[TODO]` items**, so any `todos_open > 0` means `status: DRAFT`. No other passage ties the `todos_open` field to status.

Attestation field: line 68, `attestation: null # path to attestation record, set only at VERIFIED`.

**TODO categories ("TODO Closure", lines 73–83):**
```
73: ## TODO Closure
74:
75: A `[TODO]` without evidence of closure is still open, whatever the text says.
76:
77: | TODO type | Closed by | Evidence required |
78: |---|---|---|
79: | `DATA SOURCE` | human | file exists at the named path + one-line provenance note (origin, date) |
80: | `DEFINE` | human | the value, in the recipe, with one sentence of reasoning |
81: | `DEV` | AI (via scored prompt) | script exists + conformance checks pass + handoff condition met |
82: | `APPROVE` | human | a logged gate decision — this is a gate, not a checkbox |
83: | `REPORT FIELD` | human | all three: exact columns/sections, reader role, decision enabled |
```

Note: SNICKERDOODLE.md says "TODO type" and never uses the word "typed". The phrase "typed TODOs" appears in DOMAIN.md line 49 and in the mode-build assignment, line 251 (see below).

**Attestation Format (lines 85–107):**
```
85: ## Attestation Format
86:
87: No verdict sentence. Every row pairs what was run with what was seen and what was expected. The **Did not test** section is mandatory — an empty one is the new "it works."
88:
89: ```markdown
90: ## Attestation
91: - Recipe: <name> v<version>
92: - By: <name> · <date>
93:
94: ### Tested
95: | Ran | Saw | Expected |
96: |---|---|---|
97: | <command or action> | <observed result> | <expected result> |
98: | <at least one deliberate attempt to break it> | ... | ... |
99:
100: ### Did not test
101: - <honest list>
102:
103: ### Broke during testing, fixed
104: - <what failed, what changed, where>
105: ```
106:
107: Any edit to the recipe or its scripts after attestation voids it.
```

### recipes/README.md

The file exists (7 lines). It contains **none** of the requested items: no lifecycle statuses, no TODO types, no todos_open, no attestation, no P5. Full text:
```
1: # Recipes
3: Recipes are human-readable specifications for repeatable work: they describe the inputs a flow accepts, the steps it follows, the output contract it must satisfy, and the phase gates that must pass before the work proceeds. They are written for both humans and the conductor, so every recipe should make its assumptions, stop conditions, and review requirements explicit.
5: Every recipe has a corresponding implementation in `scripts/`. Scripts are also callable as tools by the conductor, whether the conductor is Cowork or Codex.
7: For the operating principle behind this separation, see [AI does AI things; humans do human things](../docs/labor-separation.md).
```

### AGENTS.md

AGENTS.md has no definitions of statuses, TODO types, todos_open, the attestation field, or P5. The only related passage is a pointer:
> 10: Read `SNICKERDOODLE.md` (the constitution — principles, the verification stack, the recipe lifecycle, the logging rules) and `DOMAIN.md` …

It does refer to P9 (the executive-summary rule) under "Default to Markdown for humans".

### DOMAIN.md

It defines nothing; these passages use the statuses and terms:
> 49: Core recipes (the operating surface): `_shared.md`, `scan.md`, `pipeline.md`, `oferta.md`, `tracker.md`, `pdf.md`, `patterns.md`, `update.md`. All are currently **DRAFT** — open typed TODOs, references to the unbuilt generic layout. The remaining recipe files (person-named case studies and monitor concepts) are drafts pending TODO closure and, for person-named files, privacy review before anything ships.

> 56: … **Still open:** the human adequacy gate (P4 second half) — a named-human attestation (name+date) promotes `oferta` past DRAFT.

> 60: 8. ~~Only 7 of 42 recipes carry lifecycle frontmatter; declared `todos_open` undercounts body `[TODO` markers.~~ **RESOLVED (2026-06-13)** — all 42 recipes now carry `status`/`todos_open`/`last_gate`/`attestation`/`recipe_version`; `todos_open` reconciled to the true body count (declared 518 = body 518; run `npm run doctor`).

So the working definition of `todos_open` is **the count of `[TODO` markers in the recipe body**, which is also what doctor checks (see section 8).

### Also relevant (outside the four files): `recipes/cases/README.md` (full, 8 lines)
```
1: # recipes/cases/ — student case recipes, by term
3: A student recipe is born here (`cases/<term>/<handle>-<slug>.md` + `.card.md`)
4: and can only enter top-level `recipes/` by maintainer promotion, which
5: requires lifecycle status ≥ RUNNABLE-SAMPLE with its RUN_LOG evidence link
6: filled in. The directory encodes "assignment artifact"; promotion encodes
7: "operating surface." Honest frontmatter is graded: `status: VERIFIED` with
8: `attestation: null` is a contract violation, not a promotion.
```

### Also relevant: `course/summer-2026/reallocation-engine-mode-build.md`
> 105: Your status frontmatter is a claim, and per the constitution every claim needs evidence. Editing the status without the evidence is a violation, not a promotion.
> 121: A mode honestly marked `RUNNABLE-SAMPLE` with one real run and a clear-eyed list of what it cannot do will score **higher** than one marked `VERIFIED` with no evidence. The honesty rule is graded, not decorative.
> 158: - add your mode file under `recipes/`, your justification and worked run under `assignments/submissions/<yourname>/`,
> 251: … If a script doesn't exist yet, propose it with a typed `[TODO]` — don't pretend it runs. …

## 5. Path existence (upstream/main)

| Path | Exists |
|---|---|
| `logs/RUN_LOG.md` | **yes** (file) |
| `logs/runs/` | **yes** (directory) |
| `assignments/submissions/` | **no** |
| `course/2026fa/submissions/` | **no** (`course/2026fa/` itself is absent upstream) |
| `assignments/` (top level) | **no** |

Top-level `assignments/` does not exist, so there is no tree or README to quote. The nearest equivalent is `course/`:

```
course/
├── README.md
├── assignments/
│   └── greenhouse-watch.md
└── summer-2026/
    └── reallocation-engine-mode-build.md
```
`course/assignments/` has no README. **Conflict:** the mode-build assignment (line 158) names `assignments/submissions/<yourname>/`, but no such path exists upstream. On this local branch the submission lives at `course/2026fa/submissions/meenuviji/`, and that path is also absent upstream.

## 6. Recipes and status frontmatter (upstream/main)

### `recipes/` (files directly under it)

| File | status |
|---|---|
| README.md | (none) |
| _profile.template.md | (none) |
| _shared.md | DRAFT |
| apply.md | DRAFT |
| auto-pipeline.md | DRAFT |
| batch.md | DRAFT |
| contacto.md | DRAFT |
| deep.md | DRAFT |
| employer-reputation-monitor.md | DRAFT |
| employer-risk-index.md | DRAFT |
| followup.md | DRAFT |
| gate-behavior.card.md | RUNNABLE-SAMPLE |
| gate-behavior.md | RUNNABLE-SAMPLE |
| gate-harness.card.md | RUNNABLE-SAMPLE |
| gate-harness.md | RUNNABLE-SAMPLE |
| gru.md | DRAFT |
| hiring-momentum-monitor.md | DRAFT |
| interview-prep.md | DRAFT |
| job-search-intelligence-orchestrator.md | DRAFT |
| latex.md | DRAFT |
| local-wage-adjustment.card.md | (none) |
| local-wage-adjustment.md | RUNNABLE-SAMPLE |
| oferta.md | DRAFT |
| ofertas.md | DRAFT |
| output-linter.card.md | DRAFT |
| output-linter.md | DRAFT |
| patterns.md | DRAFT |
| pdf.md | DRAFT |
| pipeline.md | DRAFT |
| project.md | DRAFT |
| rd-hiring-signal.md | DRAFT |
| scan.md | DRAFT |
| sector-health-dashboard.md | DRAFT |
| skill-demand-monitor.card.md | (none) |
| skill-demand-monitor.md | RUNNABLE-SAMPLE |
| target-company-comparison.md | DRAFT |
| tracker.md | DRAFT |
| training.md | DRAFT |
| update.md | DRAFT |
| workday-connector.card.md | RUNNABLE-LIVE |
| workday-connector.md | RUNNABLE-LIVE |

Subdirectory: `cases/`. No top-level recipe is VERIFIED. Some `.card.md` files carry status frontmatter and some do not, so the convention is inconsistent.

### `recipes/cases/` (direct children)

| Entry | status |
|---|---|
| README.md | (none) |
| 2026su/ | directory (14 files, all `case-*.md`) |

### `case-*` files (all in `recipes/cases/2026su/`)

All 14 files are `status: DRAFT`. They share one heading skeleton: Purpose · Source Inventory · Inputs · Phase Gates · Steps · Output Contract (Agent output / Human report) · Stop Conditions · Snickerdoodle (Run/Step/Gate Commands, Script/Output Locations) · Provenance · Existing Recipe Notes Preserved For Implementation. Their naming differs from the convention in the cases README (`<handle>-<slug>.md` plus `.card.md`): these files use a `case-` prefix and have no `.card.md` companions. Frontmatter and headings for each file are quoted below, with line numbers taken from each file on upstream/main. One upstream heading (in `case-new-grad-platform-data-engineering.md`) begins with a student's personal name. That name is redacted here so it is not copied into another tracked file; the rest of the heading is verbatim.

#### `recipes/cases/2026su/case-backend-swe-opt-triage.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Backend SWE OPT Sponsorship Triage
11: ## Purpose
15: ## Source Inventory
23: ## Inputs
31: ## Phase Gates
40: ## Steps
73: ## Output Contract
75: ### Agent output
79: ### Human report
85: ## Stop Conditions
93: ## Snickerdoodle
95: ### Run Commands
102: ### Step Commands
113: ### Gate Commands
124: ### Script Locations
135: ### Output Locations
145: ## Provenance
154: ## Existing Recipe Notes Preserved For Implementation
156: ### Known Evidence From Submission
163: ### Cannot Verify Without More Work
169: ### Original Workflow Notes
179: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-data-ml-h1b-triage.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: #  / Data/ML H-1B Triage for OPT Students
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
150: ## Existing Recipe Notes Preserved For Implementation
152: ### Known Evidence From Submission
158: ### Cannot Verify Without More Work
164: ### Original Workflow Notes
174: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-ds-faang-opt-runway.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Data Science OPT Runway for FAANG-Tier Companies
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
151: ## Existing Recipe Notes Preserved For Implementation
153: ### Known Evidence From Submission
159: ### Cannot Verify Without More Work
165: ### Original Workflow Notes
176: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Pre-OPT Full-Stack/Backend SWE Sponsor Triage
11: ## Purpose
15: ## Source Inventory
21: ## Inputs
29: ## Phase Gates
38: ## Steps
71: ## Output Contract
73: ### Agent output
77: ### Human report
83: ## Stop Conditions
91: ## Snickerdoodle
93: ### Run Commands
100: ### Step Commands
111: ### Gate Commands
122: ### Script Locations
133: ### Output Locations
143: ## Provenance
149: ## Existing Recipe Notes Preserved For Implementation
151: ### Known Evidence From Submission
158: ### Cannot Verify Without More Work
164: ### Original Workflow Notes
175: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-funded-systems-analyst.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Funded ERP / IT Systems Analyst Sponsorship Triage
11: ## Purpose
15: ## Source Inventory
21: ## Inputs
29: ## Phase Gates
38: ## Steps
71: ## Output Contract
73: ### Agent output
77: ### Human report
83: ## Stop Conditions
91: ## Snickerdoodle
93: ### Run Commands
100: ### Step Commands
111: ### Gate Commands
122: ### Script Locations
133: ### Output Locations
143: ## Provenance
149: ## Existing Recipe Notes Preserved For Implementation
151: ### Known Evidence From Submission
158: ### Cannot Verify Without More Work
164: ### Original Workflow Notes
174: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-h1b-sponsorship-audit.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Post-Offer H-1B Sponsorship Audit
11: ## Purpose
15: ## Source Inventory
24: ## Inputs
32: ## Phase Gates
41: ## Steps
74: ## Output Contract
76: ### Agent output
80: ### Human report
86: ## Stop Conditions
94: ## Snickerdoodle
96: ### Run Commands
103: ### Step Commands
114: ### Gate Commands
125: ### Script Locations
136: ### Output Locations
146: ## Provenance
155: ## Existing Recipe Notes Preserved For Implementation
157: ### Known Evidence From Submission
163: ### Cannot Verify Without More Work
169: ### Original Workflow Notes
179: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-ic-layout-fit.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # IC Layout SOC Classification and Sponsorship Fit
11: ## Purpose
15: ## Source Inventory
21: ## Inputs
29: ## Phase Gates
38: ## Steps
71: ## Output Contract
73: ### Agent output
77: ### Human report
83: ## Stop Conditions
91: ## Snickerdoodle
93: ### Run Commands
100: ### Step Commands
111: ### Gate Commands
122: ### Script Locations
133: ### Output Locations
143: ## Provenance
149: ## Existing Recipe Notes Preserved For Implementation
151: ### Known Evidence From Submission
157: ### Cannot Verify Without More Work
163: ### Original Workflow Notes
173: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-ml-sponsorship-triage.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # ML Engineering Sponsorship Triage
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
151: ## Existing Recipe Notes Preserved For Implementation
153: ### Known Evidence From Submission
159: ### Cannot Verify Without More Work
165: ### Original Workflow Notes
175: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-new-grad-platform-data-engineering.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # [person name redacted in this report] / New-Grad Platform Data Engineering Sponsor Filter
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
151: ## Existing Recipe Notes Preserved For Implementation
153: ### Known Evidence From Submission
160: ### Cannot Verify Without More Work
166: ### Original Workflow Notes
176: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-nlp-ml-sponsorship-triage.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # NLP/ML Sponsorship Triage
11: ## Purpose
15: ## Source Inventory
23: ## Inputs
31: ## Phase Gates
40: ## Steps
73: ## Output Contract
75: ### Agent output
79: ### Human report
85: ## Stop Conditions
93: ## Snickerdoodle
95: ### Run Commands
102: ### Step Commands
113: ### Gate Commands
124: ### Script Locations
135: ### Output Locations
145: ## Provenance
154: ## Existing Recipe Notes Preserved For Implementation
156: ### Known Evidence From Submission
162: ### Cannot Verify Without More Work
168: ### Original Workflow Notes
179: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-opt-timeline-fit-company-targeting.md`
```
---
status: DRAFT
todos_open: 14
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # OPT Timeline-Fit Company Targeting
11: ## Purpose
15: ## Source Inventory
23: ## Inputs
31: ## Phase Gates
40: ## Steps
73: ## Output Contract
75: ### Agent output
79: ### Human report
85: ## Stop Conditions
93: ## Snickerdoodle
95: ### Run Commands
102: ### Step Commands
113: ### Gate Commands
124: ### Script Locations
135: ### Output Locations
145: ## Provenance
153: ## Existing Recipe Notes Preserved For Implementation
155: ### Known Evidence From Submission
162: ### Cannot Verify Without More Work
168: ### Original Workflow Notes
178: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-phd-econ-to-industry.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # PhD Economist to Industry Transition
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
153: ## Existing Recipe Notes Preserved For Implementation
155: ### Known Evidence From Submission
162: ### Cannot Verify Without More Work
168: ### Original Workflow Notes
178: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-tpm-pivot.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # Product Manager to Technical Program Manager Pivot
11: ## Purpose
15: ## Source Inventory
21: ## Inputs
29: ## Phase Gates
38: ## Steps
71: ## Output Contract
73: ### Agent output
77: ### Human report
83: ## Stop Conditions
91: ## Snickerdoodle
93: ### Run Commands
100: ### Step Commands
111: ### Gate Commands
122: ### Script Locations
133: ### Output Locations
143: ## Provenance
149: ## Existing Recipe Notes Preserved For Implementation
151: ### Known Evidence From Submission
157: ### Cannot Verify Without More Work
163: ### Original Workflow Notes
173: ### Proposed Or Missing Tools
```
#### `recipes/cases/2026su/case-ux-designer-stem-opt.md`
```
---
status: DRAFT
todos_open: 13
last_gate: null
attestation: null
recipe_version: 0.1.0
---
9: # UX/Product Designer STEM OPT Triage
11: ## Purpose
15: ## Source Inventory
22: ## Inputs
30: ## Phase Gates
39: ## Steps
72: ## Output Contract
74: ### Agent output
78: ### Human report
84: ## Stop Conditions
92: ## Snickerdoodle
94: ### Run Commands
101: ### Step Commands
112: ### Gate Commands
123: ### Script Locations
134: ### Output Locations
144: ## Provenance
151: ## Existing Recipe Notes Preserved For Implementation
153: ### Known Evidence From Submission
159: ### Cannot Verify Without More Work
165: ### Original Workflow Notes
175: ### Proposed Or Missing Tools
```

## 7. `npm run ats:liveness`

- **Source:** `scripts/ats/check-liveness.mjs` (65 lines). It imports `checkUrlLiveness` from `scripts/ats/liveness-browser.mjs`, which calls `classifyLiveness` in `scripts/ats/liveness-core.mjs`.
- **Usage/help text** (header, lines 10–14, and the no-arg error, lines 25–26):
```
 * Usage:
 *   node check-liveness.mjs <url1> [url2] ...
 *   node check-liveness.mjs --file urls.txt
 *
 * Exit code: 0 if all active, 1 if any expired or uncertain
```
```
Usage: node check-liveness.mjs <url1> [url2] ...
       node check-liveness.mjs --file urls.txt
```
  There is no `--help` flag; running it with no arguments prints the usage text to stderr and exits 1. With `--file`, blank lines and `#` comment lines are skipped.
- **Output:** plain text to stdout. **Not JSON.** One line per URL (`✅ active <url>` / `❌ expired <url>` / `⚠️ uncertain <url>`); for non-active results, a reason line follows. A final summary line: `Results: N active  N expired  N uncertain`. The structured `{result, code, reason}` objects exist internally but are not printed.
- **Classification codes** (`liveness-core.mjs`): expired → `http_gone`, `expired_url`, `expired_body`, `listing_page`, `insufficient_content`; active → `apply_control_visible`; uncertain → `no_apply_control`. In `liveness-browser.mjs`: uncertain → `invalid_url`, `unsupported_protocol`, `blocked_host`, `navigation_error`.
- **Exit codes:** 0 if all URLs are active. 1 if any is expired or uncertain, if no arguments are given, or on a fatal error.
- **Network: yes.** It launches headless Chromium through Playwright (`chromium.launch({ headless: true })`) and runs `page.goto(url)` for each URL, with a 15 s navigation timeout and a 2 s wait for the page to hydrate. URLs are checked one at a time ("never Playwright in parallel"). Guards reject non-http(s) URLs and loopback/private/link-local hosts before any request. A navigation failure (timeout, DNS, TLS) comes back as `uncertain`, not `expired`. It needs the `playwright` package (`^1.58.1` in package.json) and a Chromium install.

## 8. `npm run doctor`

- **Source:** `scripts/doctor.mjs` (132 lines). It is read-only: "Reports; never changes anything."
- **Flags:** `--strict` exits 1 if any hard failure was found. Without it, the script always exits 0.
- **What it checks, in order:**
  1. **ENVIRONMENT (required):** `node -v` and `python3 --version`. A missing tool is a hard failure.
  2. **ENVIRONMENT (optional):** pandoc, LibreOffice (`soffice`), and whether `playwright` resolves ("ats:liveness needs it"). Informational only.
  3. **RUNNABLE COMMANDS:** for every npm script matching `node|python3 <file>.(mjs|js|py)`, it checks that the target file exists. A missing file is a hard failure. Scripts invoked another way (e.g. `bash scripts/run-real-demo.sh`) are skipped.
  4. **DOMAIN DIRECTORIES:** reports whether `data/sec`, `data/bls`, `data/ats`, `data/80-days-to-stay`, `scripts/sec`, `scripts/bls`, `scripts/ats` and `scripts/resumes` are present. Informational only.
  5. **PRIVACY:** runs `git ls-files`. Any tracked file under `private/` or `data/ats/` is a hard failure, unless it is scaffolding (`README.md`, `.gitkeep`, `.gitignore`, `*.example.*`). So is any tracked `*.resume.pdf|json` or `resume.json|pdf`, anywhere in the tree.
  6. **RECIPES dashboard:** reads `fs.readdirSync('recipes')`, which is **top level only**, excluding `README.md`, `*.template.*` and `*.card.md`. For each file it parses the frontmatter keys `status, todos_open, last_gate, attestation, recipe_version`, counts recipes by status, and counts `[TODO` occurrences in the body. It flags a **todos_open mismatch** when the declared `todos_open` differs from the body count, and it flags missing frontmatter. These are warnings, not hard failures.
  7. **SUMMARY:** environment ✓/✗, frontmatter coverage, and a "next" hint.
- **Implications for a case recipe:** files under `recipes/cases/<term>/` are **not scanned** by the dashboard, so doctor never catches a `todos_open` mismatch in a case recipe; it has to be checked by hand. The privacy check, by contrast, covers the whole tracked tree.
