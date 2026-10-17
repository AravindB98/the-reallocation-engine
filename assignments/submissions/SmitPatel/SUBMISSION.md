# SUBMISSION — Smit Patel (SmitPatel-31)

## Executive summary

The cover sheet for my Mode Build submission. The mode helps a December-graduating international student decide
which new-grad software jobs are worth an application. It checks whether a big visa sponsor's record shows
entry-level software hires, whether the posting is still open, and whether the job starts before the student's
OPT unemployment limit. It ran on real job postings on 2026-10-17. The honest stage is DRAFT.

## Details

- **Assignment:** The Reallocation Engine — Mode Build Assignment
- **Student:** Smit Patel · **GitHub handle:** SmitPatel-31
- **Domain / situation:** F-1 MS student on a STEM degree, graduating December, OPT starting January (90-day unemployment limit, so work must start by mid-April), targeting new-grad Software Developer roles (SOC 15-1252) at companies with ≥ 100 H-1B approvals.
- **Mode file:** `recipes/case-newgrad-swe-bigsponsor.md` (+ human card `recipes/case-newgrad-swe-bigsponsor.card.md`)
- **Domain justification:** `assignments/submissions/SmitPatel/DOMAIN-JUSTIFICATION.md`
- **Worked run + attestation:** `assignments/submissions/SmitPatel/WORKED-RUN.md`
- **RUN_LOG entry:** `assignments/submissions/SmitPatel/RUN_LOG-ENTRY.md` (same text as `logs/runs/2026fa-SmitPatel-31-2.md`). `logs/RUN_LOG.md` itself is not edited: the repo marks it maintainer-only, and its CI fails student PRs that touch it. The assignment allows "or include it in your submission".
- **Presentation notes:** `assignments/submissions/SmitPatel/PRESENTATION-NOTES.md`
- **Real repo scripts run on real data:** `npm run ats:scan -- --dry-run` (3 real Greenhouse boards), `npm run ats:liveness` (4 URLs), `scripts/score/role-scorer.mjs` (via the prototype) on the shipped 80 Days CSV
- **Prototype command:** `node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs` · tests: `node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs`
- **Branch / PR:** `mode/SmitPatel-newgrad-swe-bigsponsor` · PR: [not opened yet]
- **ZIP:** `reallocation-SmitPatel-mode.zip`
- **Submitted commit SHA:** [fill in after commit]
- **Lifecycle stage claimed:** DRAFT. Sample and real-postings paths both run; 5 typed TODOs (proposed additions) are open, and the lifecycle requires zero before SPECIFIED.

## Known limitations

- The liveness checker can be wrong, and the mode can only record what it saw. On 2026-10-17 it called a listed Pinterest posting "expired" (bot-blocked careers site), which zeroed the run's only Proven-tier posting.
- The scanner's location filter drops US postings whose location names only cities.
- No real posting stated a start date, so the visa-timeline gate ran only on estimates.
- The 80 Days CSV omits most non-Form-D sponsors (Google, Amazon, NVIDIA…), has no per-title counts, and has no year per title.
- The title rule misreads some titles (e.g. `JAVA ENGINEER 2`), and a self-rated fit can nearly lift a no-SWE-evidence sponsor into Consider.
- The persona is fictional. OPT rules have not been confirmed with the DSO.
- Mode files live where the Mode Build assignment puts them (`recipes/`, `assignments/`). The repo's CI only *warns* about paths outside its contributor namespaces, so expect a maintainer-review warning.
- Most code and prose was written by an AI agent (Claude Code) under my direction. See SOURCES.md.
