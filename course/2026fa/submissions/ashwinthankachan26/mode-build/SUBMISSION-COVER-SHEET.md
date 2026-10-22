# Mode Build submission — cover sheet

**Student:** Ashwin S Thankachan (GitHub `ashwinthankachan26`)
**Mode:** `backend-pivot-range`: is this backend-type posting judgment-heavy work, and can the O*NET data even tell?
**Situation (fictional persona, per DATA_CONTRACT):** Aarav Patel (`search/examples/aarav-patel/`), F-1 on STEM OPT, targeting new-grad backend and platform roles in Boston (O*NET 15-1252.00 Software Developers) and weighing adjacent families (data engineering, platform/SRE, QA/SDET, full stack)
**Engine layers:** Cognitive Pivot (BLS/O*NET role quality) + Job-Ops (liveness gate)
**Lifecycle stage reached:** **DRAFT v0.1.5**: runs end to end on fixtures and on 95 real postings; 3 typed TODOs open
**Date:** 2026-10-21

## Executive summary

This page maps each part of the Mode Build assignment to the file that answers it. The mode is new work, different from my Recipe Design submission (PR #41, sponsorship and seniority). It ran on 95 real Boston postings with the repository's own liveness checker. It found that the occupation data behind "AI-resilient work" files the same backend job under different occupations depending on its spelling, and that most score gaps are inside the data's own error. It is honestly marked DRAFT. Where the assignment's paths differ from what the repository's automated checks accept, I followed the repository; each difference is listed below.

## Reading order for a grader (about 5 minutes)

1. `recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.card.md`: one page, what it does and can't do
2. `course/2026fa/submissions/ashwinthankachan26/mode-build/DOMAIN-JUSTIFICATION.md`: one page
3. `…/mode-build/WORKED-RUN.md`: the executive summary, *Verified vs inferred*, and *Attestation*
4. `…/mode-build/runs/pivot-2026-10-21-run7-final/pivot-report.md`: the real output a person would read
5. The full recipe only if needed: every rubric element is under its own heading

---

## 1. Links

| What | Link |
|---|---|
| Pull request (proof it runs in the real tree) | https://github.com/nikbearbrown/the-reallocation-engine/pull/86 |
| My fork | https://github.com/ashwinthankachan26/the-reallocation-engine |
| Branch | `mode/ashwinthankachan26-backend-pivot-range` |
| Zip of record | `reallocation-ashwinthankachan-mode.zip` (Canvas upload) |
| My earlier, separate Recipe Design PR | https://github.com/nikbearbrown/the-reallocation-engine/pull/41 (kept open pending the TA's answer on the one-open-PR rule) |
| Course AI policy | [AI Policy for Professor Bear's Courses \| Using AI Responsibly in Class](https://youtu.be/8Ut0Cdl6vMw?si=9w3aEpt1ZyAR4Kiz) |

## 2. Deliverables and where each one lives

| # | Assignment asks for | File |
|---|---|---|
| 1 | **Mode file**: status frontmatter, purpose and *when to use it*, source inventory, typed `[TODO]` proposed additions, testable phase gates, can / cannot verify, output contract, stop conditions, RUN_LOG template | `recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md` |
| 1a | Human card twin (required by the PR template) | `recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.card.md` |
| 2 | **Domain justification** (one page) | `course/2026fa/submissions/ashwinthankachan26/mode-build/DOMAIN-JUSTIFICATION.md` |
| 3 | **Worked run**: inputs, verbatim commands + pasted output, verified vs inferred line by line, verification, reflection, attestation with break attempts | `course/2026fa/submissions/ashwinthankachan26/mode-build/WORKED-RUN.md` |
| 4 | **RUN_LOG entry** | `…/mode-build/RUN_LOG-ENTRY.md`, from `logs/runs/2026fa-ashwinthankachan26-6.md` |
| 5 | New scripts + tests + fixtures (fictional) + O*NET extract | `scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/` |
| 6 | Run outputs: agent JSON + human Markdown | `…/mode-build/runs/pivot-2026-10-21-run7-final/pivot-log.json` + `pivot-report.md` (runs 1–6 kept) |
| 7 | In-class show-and-tell plan | `…/mode-build/PRESENTATION.md` |
| — | Sources, credit, AI-use split | `…/mode-build/SOURCES.md` |
| — | **Frictional log** (course rule: 10% of every NEU assignment; not listed in this Canvas rubric, included in case it applies) | `…/mode-build/FRICTIONAL.md`, approved by me 2026-10-21 |

## 3. Where I followed the repository instead of the Canvas wording

| Canvas says | What I did | Why |
|---|---|---|
| mode file under `recipes/` | `recipes/cases/2026fa/…` + `.card.md` | `CONTRIBUTING.md`: student recipes go in `recipes/cases/<term>/` as a recipe + card pair; promotion is a maintainer decision |
| justification and worked run under `assignments/submissions/<name>/` | `course/2026fa/submissions/ashwinthankachan26/mode-build/` | the CI scope check (`.github/workflows/contrib-gate.yml`) allowlists `course/<term>/submissions/`; `mode-build/` keeps this apart from my Recipe Design files |
| append to `logs/RUN_LOG.md` | `logs/runs/2026fa-ashwinthankachan26-6.md` + `RUN_LOG-ENTRY.md` | CI **fails** any student PR touching `logs/RUN_LOG.md`; Canvas allows "or include it in your submission" |
| branch `mode/<yourname>-<domain>` | `mode/ashwinthankachan26-backend-pivot-range` | as Canvas says (CI does not check branch names) |
| "one open PR per student" (CONTRIBUTING) vs a new assignment PR | new PR; #41 kept open, declared in the PR body | asked the TA; classmates have done both (closing, or keeping and declaring) |

## 4. Rubric self-check (each claim points at evidence)

| Rubric line | Evidence |
|---|---|
| Mode Design: specific situation | the fictional persona Aarav Patel (F-1 STEM OPT, Boston backend/platform), anchor 15-1252.00, the backend-adjacent families a Boston new grad actually sees (recipe *Purpose*, *When to use*) |
| named commands exist and ran | every command in *Source inventory* ran 2026-10-20; output pasted in WORKED-RUN |
| verified vs inferred boundary | every value labeled `record` / `model-judgment` / `your-input`; line-by-line tables for two real postings; recipe *Can* / *Cannot verify* |
| gates, liveness as a gate | G1–G5 with one-line test commands; `npm run ats:liveness` on all 90 shortlisted; unconfirmed → CHECK-LIVENESS, never PRIORITIZE |
| stop conditions | 7 hard refusals (exit 2, nothing written) + 6 route-to-a-person rules; 4 exercised as breaks |
| output contract, two readers | `pivot-log.json` (agent) and `pivot-report.md` (person, executive summary first) |
| proposed additions, typed | 7 proposed, 3 open (DEV ×1, DATA SOURCE ×2, with dated, verified primary sources); #1, #2, #3 closed by my logged decisions, #5 built |
| Domain Justification: specific asymmetry | spelling decides the occupation ("Back End Software Engineer" → Web Developers 3.584 vs "Software Engineer, Backend" → Software Developers 3.834); gaps inside the error bars; ratings 8 years apart |
| domain failure modes + who misses them | hybrid title mis-filed (new international grad unfamiliar with SOC); noise read as signal (a student sorting by score under time pressure) |
| Worked Run: real pasted output | 3 runs, the liveness check, ingest, fetch, tests, the Canvas "Before you start" commands |
| deliberate break attempts | B1 tampered score, B2 pin without reason, B3 mutant library, B4 modified O*NET file (+ B1's failed first attempt, disclosed) |
| reflection | WORKED-RUN *Reflection*: what worked, what it got wrong (the duties rule doesn't discriminate; new mis-files), concrete next steps (blind labels before changing the duties rule; compare with real AI-usage data) |
| honest lifecycle | DRAFT; the constitution needs zero open TODOs before SPECIFIED |

## 5. Checks run on the branch before submission (2026-10-20)

| Check | Result |
|---|---|
| `npm run verify` | conformance ✓ · manifest check passed (3 upstream warnings) |
| `npm run doctor` | environment ✓ runnable · no private/PII paths tracked |
| `node scripts/pii-scan.mjs` (working tree, new files included) | only finding: an npm package author's email inside the upstream `package-lock.json`, not in my diff |
| `python3 -W error::ResourceWarning -m unittest …/test_pivot_range.py` | 37 pass (I ran 37/37 myself at v0.1.5) |
| CI scope rules, simulated | no protected path touched; every new file inside the student namespaces |

## 6. What is done and what is not, stated plainly

- **Done 2026-10-21, by me:** config approved; all 5 ambiguous postings decided (3 pinned, 2 out of target); the 18 unconfirmed postings opened (all open); the quotes read; my tailor list of 6; tests re-run; attestation signed and re-attested for v0.1.5 after my own test run (37/37); my own O*NET OnLine check of the title split; TODO #3 decided; TODO #5 built.
- **Also done:** my reflection (WORKED-RUN *Reflection*).
- **Not done:** the blind labels (TODO #4) and two new data sources (#6, #7): 3 typed TODOs keep the recipe at DRAFT.
- My prediction was not written before the run. The worked run says so instead of adding one afterwards.
