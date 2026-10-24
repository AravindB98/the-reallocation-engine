## 2026-10-03 — data-titles-h1b-entry sample run, human review

**Executive summary.** The sponsorship-by-title tool's default sample run was executed on a fresh copy of the committed code. Of 15 sample postings, 12 were scored (2 Apply, 8 Consider, 2 Skip). Two stopped because the company name could not be matched to exactly one employer, and one was refused because its posting status was missing. A named person, Meena, reviewed the run on 2026-10-03: she left both company-name stops unresolved, held the refused posting, and accepted the 12 results as advice.

- **Recipe:** recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md v0.1.0
- **Inputs:** `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` (default command, no arguments), run in a fresh clone of branch `contrib/2026fa-meenuviji-data-titles-h1b-entry` at `4a4074e`; `postings/sample-postings.json` (seed 42, 2 per evidence group, plus 3 failure-case postings); `run-config.json`; `rules.json`; `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (SHA-256 checked by the run)
- **Outputs:** in the clone, `out/run.json`, `out/report.md`, `out/roles.json`, `out/score/role-scores.json`, `out/score/role-scores.md`; verbatim terminal output and the pasted report in `course/2026fa/submissions/meenuviji/TEST-REPORT.md`
- **Result:** exit 3 (completed with stops). 15 postings → 12 scored (Apply 2 · Consider 8 · Skip 2); 2 company-match stops; 1 refusal for a missing gate value (TEST-REPORT.md, "Sample run")
- **Open issues:** Arcturus Therapeutics unresolved; Quillfeather Data Labs, Inc. no match, not confirmed absent; Centific Global Solutions Inc held and skipped for this run; the recipe's six proposed additions remain open, status DRAFT
- **Reviewed by:** Meena (meenuviji), 2026-10-03

### Gate decisions

All decisions and reasoning are Meena's, quoted verbatim.

| Item | Gate | Decision | Reasoning (Meena, verbatim) |
|---|---|---|---|
| Arcturus Therapeutics | company-match: more-than-one-row | UNRESOLVED | "I would leave it unresolved rather than pick one of the two rows. ARCTURUS THERAPEUTICS INC and ARCTURUS THERAPEUTICS LTD are both in San Diego and both have 12 approvals, so the evidence I currently have is not enough to prove which record belongs to the employer I am evaluating. Choosing one would introduce an assumption into something that should be record-based. I would require another identifier or source before clearing the gate." |
| Quillfeather Data Labs, Inc. (a deliberately invented name planted as a failure case) | company-match: no-match | NO MATCH, NOT CONFIRMED ABSENT | "I can only say that no matching record was found in the dataset I checked. A missing match could mean the company is not represented in that dataset, the company name is different, or the matching logic failed. I would keep the result as unresolved/no match rather than turn missing evidence into a negative fact." |
| Centific Global Solutions Inc (planted failure case) | refused: liveness missing | HOLD, SKIP FOR THIS RUN | "I would find the real posting status before continuing. Since liveness is a gate, I would not treat the role as valid until I can verify that the posting is still open. If I cannot verify its status from the named liveness source, I would leave the gate unresolved and skip the role for the current run rather than assuming that it is live." |
| The 12 scored results | scored (all gates present) | REVIEWED | Recommendations accepted as advisory; next actions per evidence group as in `out/report.md`. |
