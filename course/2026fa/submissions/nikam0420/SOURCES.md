# Sources and contribution disclosure

## Executive summary
This document identifies the code and data used in the sample and separates AI assistance from the student's work. The sample is grounded in the repository's stored fields and unmodified scorer. Student execution and review have not yet been recorded by the AI.

- Repository: https://github.com/nikbearbrown/the-reallocation-engine ; baseline commit `015843d5047dbadff05068495e4c5db5cd9945f4`; retrieved 2026-10-02.
- Governing documents read: SNICKERDOODLE.md, DOMAIN.md, CONTRIBUTING.md, DATA_CONTRACT.md, AGENTS.md, _MANIFEST.md, recipes/README.md and recipes/_shared.md.
- Style examples inspected: recipes/scan.md and recipes/local-wage-adjustment.card.md. The compact card and phased recipe adapt their format.
- Data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. It is a shipped upstream mapped dataset; the prototype confirms stored fields and hash, not independent accuracy or freshness of the underlying DOL join.
- Scorer: `scripts/score/role-scorer.mjs`, used through its unchanged CLI. Format reference: `data/examples/ch11-roles.json`.
- Assignment: the Canvas instructions pasted by the student. The linked course AI policy/video were not included and were not reviewed by the AI; the student must review them before treating this as graded work.
- Tools: ChatGPT/Codex for drafting, implementation and local verification; Python standard library, Node, npm and git for execution.
- AI contribution: selected a proposed small scope, wrote adapter/tests/document drafts, ran checks in the assistant environment, and recorded actual output. No live employer source was consulted and no student signature was produced.
- Student contribution: created the fork and branch, copied the starter, ran the prototype and nine tests on a Mac, exercised the missing-company failure, checked the source CSV, and recorded personal execution and setup difficulties. AI drafted the starter; real-use approval remains pending.
- No external essay statistics are asserted. The 3-3-2 allocation is supplied assignment context; the time-saving calculation is explicitly an unmeasured estimate.
