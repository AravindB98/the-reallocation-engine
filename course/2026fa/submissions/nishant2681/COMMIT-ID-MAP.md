# Commit ID map

Before pushing, all branch commits were re-stamped with my GitHub noreply email (git rebase --exec 'git commit --amend --no-edit --reset-author') to remove a personal email from commit headers. File contents were unchanged; only commit IDs changed. Older IDs cited in FRICTIONAL.md, CHANGE-BRIEF.md and the recipe map to new IDs as follows.

| Old ID | New ID | Commit message |
|---|---|---|
| 43020cf | cc90112 | Add change brief and repo findings (predict step) |
| 5f652f8 | 15b3a9e | Add FRICTIONAL log (setup, data exploration, predict step) |
| f8e35d3 | 7b68095 | FRICTIONAL: add Claude Code cross-check of Deloitte titles |
| 1bc0619 | d55f5ff | Add recipe and card (DRAFT, 16 open TODOs) |
| 8d92b10 | 17e69d3 | Add recipe and card (DRAFT, 16 open TODOs); update FRICTIONAL |
| 448cb19 | e455a22 | Prototype piece 1: company lookup + sponsorship tier, 13 offline tests |
| df90148 | c64d8f3 | Prototype piece 2: liveness + timeline gates, 31 offline tests |
| efc931b | 65cd069 | Prototype piece 3: main script, report, end-to-end tests; sample runs 1 and 2 |
| 17abc98 | ab3c673 | FRICTIONAL: entry 19, engine tools and liveness break tests |
| 8337508 | cd5d9b8 | FRICTIONAL: entry 19, engine tools and liveness checks |
| 0752f6a | 0f4d678 | Update recipe, card, brief after prototype build: 6 TODOs open; add liveness evidence |
| bbf2849 | c711790 | Add missing-input-file tests (45 total); close harness TODO, 5 open |
| 7b84bc0 | ee5c22d | Add run log with gate sign-offs (G1, G3, G4); close APPROVE TODOs, 2 open |
| 91b5afa | 16f9aaa | FRICTIONAL: entry 22, gate sign-offs and run log |
| 9f8a441 | 4faee91 | Add TEST-REPORT with fresh-clone evidence (00-11), npm email redacted |
| cce80fe | 4ee40c1 | FRICTIONAL: entry 23, fresh-clone test run |
| 43823ac | 334ea61 | Add one-page domain justification |
| fc0a2af | 17ef048 | FRICTIONAL: entry 24, domain justification |
| 84fdb3c | 1d92a33 | Add WORKED-RUN with attestation and hand-check evidence; fix 00 attribution in TEST-REPORT |
| eb6ee92 | 2342786 | Save post-commit CI-mode PII scan (clean) |
| c60e4fd | 2e9995c | FRICTIONAL: entry 25, worked run and attestation |
| 656479d | 392a9dc | Add SOURCES.md; FRICTIONAL entry 26 (overall work split) |
