# Run log 6 — backend-pivot-range v0.1.0 → v0.1.5, real runs and gate decisions (ashwinthankachan26)

> Numbered 6 because run logs 1–5 belong to my Recipe Design branch (PR #41); this is a different mode on a different branch.

## Executive summary

The new mode ran on 95 backend-type postings fetched on October 20, 2026 from 11 Boston-area job boards. The first runs exposed bugs, which were fixed test-first, and every earlier run is kept. On October 21 I made every gate decision: I approved the settings, chose occupations for the ambiguous titles, opened the 18 postings the checker couldn't confirm (all open), and picked 6 postings to tailor for. The final run gave 52 to prioritize, 23 standard, 2 outside my target, and 18 checked by hand. No application was sent by the tool. The entries below are kept in the order they were written, so earlier ones still say "awaiting."

---

## 2026-10-20 — predictions, written before any real posting was fetched

**Ashwin's prediction:** not given before the run (asked for on 2026-10-20; to be added in his own words, marked as written after the run if so).

**Claude's prediction** (recorded here first, so it can't be adjusted afterwards):

- The fetch: 11 boards → 60–100 backend-adjacent US postings.
- Most "Software Engineer" titles match O*NET exactly to the anchor (15-1252.00).
- "Data Engineer" titles: every *scored* candidate (Database Administrators, Database Architects, Statisticians) is statistically indistinguishable from the anchor, so they route on their posting text, not to PIN-SOC; Data Scientists (no score) is listed as unscored.
- "Site Reliability Engineer" and "Full Stack Developer" titles go to **PIN-SOC** (their candidates disagree about the anchor).
- QA/SDET titles land below the anchor (Software QA Analysts, 15-1253.00).
- Counts: PRIORITIZE 30–50% · STANDARD 30–50% · PIN-SOC 5–15% · NOTE-ROUTINE ≤ 5% · RESEARCH-SOC a few · CHECK-LIVENESS and SKIP 0 before the liveness check.
- Posting text: more than 60% of postings whose duties can be read come out judgment-heavy (modern postings lean on "design", "scale", "own").

## 2026-10-20 — runs

- **Recipe:** recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md v0.1.0 → v0.1.1 (not attested; attestation in WORKED-RUN is unsigned)
- **Branch / base:** `mode/ashwinthankachan26-backend-pivot-range` from `upstream/main` `015843d`; uncommitted at the time of these runs
- **Who ran it:** Claude, in Ashwin S Thankachan's working copy, 10:30–10:55 EDT
- **Inputs:** `runs/fetch-2026-10-20/roles.json` (95 postings, fetched 2026-10-20T14:41:26Z) · `config.json` (drafted, not yet approved) · `data/onet_elements_15.csv` · `data/onet_titles.csv` · `data/bls/compact/soc_occupation_compact.csv` · `runs/liveness-2026-10-20.txt`

| Step | Command (from the repo root; `M`=scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range, `R`=course/2026fa/submissions/ashwinthankachan26/mode-build/runs) | Result (stdout, pasted) |
|---|---|---|
| ingest | `python3 -I $M/ingest_onet.py --zip <scratch>/db_30_2_text.zip` (later `--download`, byte-identical) | `✓ verified 5 O*NET files against data/bls/BLS-audit.md` · `onet_elements_15.csv: 279 ratings, 31 occupations · onet_titles.csv: 2801 titles` |
| fetch | `python3 $M/fetch_postings.py --out-dir $R/fetch-2026-10-20` | `✓ fetched 11 boards → 95 backend-adjacent postings saved (2026-10-20T14:41:26Z)` |
| run 1 (v0.1.0) | `python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-20 --out-dir $R/pivot-2026-10-20` (folder renamed `…-run1-v0.1.0`) | `✓ assessed 95 postings → PRIORITIZE 67 · STANDARD 15 · PIN-SOC 13` |
| run 2 (v0.1.1), 1st try | `… --out-dir $R/pivot-2026-10-20-run2` | `KeyError: 'onet-contained'`, exit 1, **after** `pivot-log.json` was written: partial folder deleted, defect fixed |
| run 2 | same | `✓ assessed 95 postings → PRIORITIZE 54 · STANDARD 36 · PIN-SOC 5` |
| liveness | `npm run --silent ats:liveness -- $(cat $R/shortlist-urls-2026-10-20.txt) > $R/liveness-2026-10-20.txt` (10:44–10:48) | `Results: 72 active  0 expired  18 uncertain` (exit 1: the checker fails closed on any non-active URL) |
| run 3 (final) | `… --liveness $R/liveness-2026-10-20.txt --out-dir $R/pivot-2026-10-20-run3-live` | `✓ assessed 95 postings → PRIORITIZE 50 · STANDARD 22 · PIN-SOC 5 · CHECK-LIVENESS 18` |
| tests | `python3 -W error::ResourceWarning -m unittest $M/test_pivot_range.py` | `Ran 30 tests … OK` |

- **Outputs:** `runs/pivot-2026-10-20-run3-live/pivot-log.json` (agent) · `pivot-report.md` (person); run 1 and run 2 folders kept for comparison.
- **Prediction vs result:** see WORKED-RUN *Prediction vs result*. 95 postings ✓; data engineering indistinguishable ✓; SRE → PIN-SOC ✓; full stack and SDET wrong; PRIORITIZE 53% (predicted 30–50%); duties judgment-heavy 62 of 62 readable, which shows the rule doesn't discriminate.
- **Breaks:** B1 tampered table → exit 2 · B2 pin without reason → exit 2 · B3 mutant library → 3 tests fail · B4 modified O*NET file → ingest exit 2 (full rows in WORKED-RUN *Attestation*).
- **Gates:** G1 passed (machine, 95 postings) · **G2 awaiting Ashwin** (5 PIN-SOC: PathAI SRE Data Center, CMT SRE ML, CMT SRE SecOps, Datadog Developer Advocate ×2; plus 12 contained-title and 6 family-fallback matches to look at) · **G3 awaiting Ashwin** (18 CHECK-LIVENESS to open by hand: Formlabs 11, Datadog 6, CarGurus 1) · **G4 awaiting Ashwin** (read the quotes of the 50 PRIORITIZE rows) · **G5 awaiting Ashwin**.
- **Decisions (human):** none yet.
- **Open issues:** config drafted, not approved (TODO #1) · duties rule doesn't discriminate (TODO #4) · 24 postings with no recognised duties header · error-correlation assumption decides every band (TODO #5) · `npm run ats:scan -- --dry-run` fails on a fresh clone (`portals.yml not found`).

## 2026-10-21 — v0.1.2 checks (no new postings, no decisions)

- **Who ran it:** Claude, in Ashwin S Thankachan's working copy, 09:00–09:10 EDT
- **Changed:** `lib_pivot.signal_health()` + a *Duties signal check* report section (reported only; no route changes) · `duties_section()` split out of `posting_signal()` (refactor: every posting's result identical to run 3 on the same inputs) · new `blind_check.py` (TODO #4 tool) · version 0.1.2
- **Tests:** `Ran 32 tests … OK` (2 new: signal check; blind sheet hides the tool's reading, refuses an unlabelled sheet, and counts agreement)
- **Board-API re-check of the 18 CHECK-LIVENESS postings:** `Results: 200: 18` at 2026-10-21T13:04:44Z (`runs/board-recheck-2026-10-21.txt`): all still listed by the employers' boards. Evidence for G3; **not** a clearance.
- **Blind sheet:** `blind_check.py make … --n 20 --seed 2026` → `runs/blind-check-2026-10-21/` (20 of 71 postings with a duties section); awaiting Ashwin's labels.
- **Gates:** unchanged: G2–G5 awaiting Ashwin.

## 2026-10-21 — G2 decisions (Ashwin) and run 4 (final)

- **Decisions given by Ashwin S Thankachan in chat, 2026-10-21, recorded by Claude:**
  - **Config (TODO #1):** "Approve as drafted". Every value kept with its written reason; `config.json → _decided_by` updated. TODO #1 closed.
  - **SRE pin (G2):** both title forms (`site reliability engineer`, `site reliability engineer - data center`) → 15-1252.00 Software Developers. Reason: "SRE work at these companies is production software/infrastructure engineering, not research; the 2019 Research Scientists rating is 6 years older than Software Developers' 2025 rating."
  - **Datadog Developer Advocate ×2:** no preference given → left unpinned (PIN-SOC). TODO #2 stays open.
  - **G3:** Ashwin will open all 18 CHECK-LIVENESS postings himself (results to be recorded here by him).
- **Liveness for the 3 newly shortlisted (09:11 EDT):** `Checking 3 URL(s)… Results: 3 active  0 expired  0 uncertain` (`runs/liveness-2026-10-21-pinned.txt`). A first attempt passed the 3 URLs as one argument (zsh no-split) and was discarded.
- **Code:** `--liveness` may be repeated (later files win); test added → 33/33.
- **Run 4 (superseded by run 5):** `python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run4-final` → `✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · PIN-SOC 2 · CHECK-LIVENESS 18`. Only the 3 pinned postings changed versus run 3.
- **Gate commands on run 4:** G1 exit 0 · G2 exit 1 (2 Developer Advocate rows unpinned) · G3 machine half exit 0 (75/75 shortlisted active via `ats:liveness`) · G4 exit 0 · report opens with `## Executive summary`.
- **Gates:** G1 passed · G2 **3 of 5 cleared by Ashwin S Thankachan, 2026-10-21**; 2 open · G3 machine half passed; **human half awaiting Ashwin** (18 to open) · G4 **awaiting Ashwin** (read the quotes) · G5 **awaiting Ashwin** (decisions below)

## 2026-10-21 — gates cleared by Ashwin, run 5 (final), attestation

- **Decisions given by Ashwin S Thankachan in chat, 2026-10-21 (his words quoted), recorded by Claude:**
  - **G2, Datadog Developer Advocate ×2:** "Outside my backend target" → `config.json → pins.by_title["developer advocate"] = {out_of_target: true, reason}`. With the SRE pins, all 5 PIN-SOC postings are decided; TODO #2 closed.
  - **G3:** opened all 18 CHECK-LIVENESS postings himself ("Done"); asked what he saw: "All 18 were open".
  - **G4:** "Agree" with the logged example of the duties rule's crudeness.
  - **G5:** his rule, "the ones with the required band of experience between 0-2 and half and relevant to my skills with similar domains". Applied to the postings' own experience lines, it gave 7 candidates; he approved 6 ("6 — drop the SDET").
- **Code (v0.1.3):** out-of-target pin (needs a reason, else the run stops) → new action `OUT-OF-TARGET`; test added → 34/34.
- **Run 5 (superseded by run 6):** `python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run5-final` → `✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18`
- **Gate commands on run 5:** G1 0 · G2 0 · G3 machine half 0 · G4 0 · report opens with `## Executive summary`.
- **Gates:** G1 passed (machine) · **G2 cleared** by Ashwin S Thankachan, 2026-10-21 · **G3 cleared** (checker: 75/75 shortlisted active; Ashwin: all 18 others opened, open) · **G4 cleared** · **G5 cleared** (decisions below).
- **Decisions (human, Ashwin S Thankachan, 2026-10-21): tailor for these 6:**
  1. Cohere Health — Software Engineer II (asks 2+ years)
  2. Klaviyo — Software Engineer II, Test Frameworks & Tooling (2+ years)
  3. Vestmark — Software Engineer (2–4 years; internship/project experience accepted)
  4. Klaviyo — Software Engineer II, Recommendations (2+ years, backend/distributed systems)
  5. PathAI — Software Engineer I, Fullstack (no minimum stated)
  6. Formlabs — Software Engineer, Print Pipeline (no minimum stated)
  - Not chosen: PathAI SDET (dropped by Ashwin); everything asking more than 2.5 years, or titled Senior/Staff/Principal/Lead; Android, embedded, hardware-test and ML-research roles.
- **Attestation:** Ashwin re-ran the suite himself (`Ran 33 tests … OK`, v0.1.2). After the v0.1.3 change the suite was re-run before signing (`Ran 34 tests … OK`, 14:13 EDT). He said "I attest — sign it". Signed in WORKED-RUN as Ashwin S Thankachan · 2026-10-21.
- **Open issues:** 5 typed TODOs (#3 spelling-merge decision, #4 blind labels, #5 two-assumption bands, #6 Anthropic Economic Index, #7 LCA data) · his reflection in his own words still to come (he chose to write his own).

## 2026-10-21 (evening) — source check, TODO #3 and #5, run 6 (final)

- **Ashwin's own source check:** O*NET OnLine keyword search for "Back End Software Engineer". Closest match 15-1254.00 Web Developers, second 15-1252.00 Software Developers (screenshot shown in chat).
- **TODO #3 (Ashwin, in chat):** "Keep separate". No merging of backend / back-end / back end. Checked: no posting in this run changes (`config.json → title_normalization._spelling_decision`).
- **TODO #5 (v0.1.4):** `z_correlated`, `band_correlated`, `real_under_both` added and tested (35/35). Routing unchanged.
- **Run 6 (superseded by run 7):** `python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run6-final` → `✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18`. Actions identical to run 5; gates G1–G4 pass; no occupation is real under both error assumptions.
- **Recipe:** v0.1.4, `todos_open: 3` (#4 blind labels, #6 Anthropic Economic Index, #7 LCA data).
- **Attestation:** the v0.1.3 signature was void after these edits. Ashwin ran the suite himself ("Ran 35 tests, OK") and re-attested v0.1.4 in chat, 2026-10-21; signed in WORKED-RUN.

## 2026-10-21 (late) — outside review fixes, run 7 (final), privacy re-cut

- **Review:** a classmate's AI review of PR #86 (about 67/80 before the presentation). Each point was checked against the files; most were valid.
- **Ashwin's decisions (chat, 2026-10-21):** refuse to rank on a duties reading that separates nothing; approve the corrected reflection; label an 8-posting blind sheet (made; not labelled before submission); privacy: describe the fictional persona Aarav Patel instead of his own profile, re-cut the branch; G4 per posting: Vestmark yes · Klaviyo Test Frameworks yes · Cohere Health yes · PathAI SE I, Klaviyo Recommendations, Formlabs Print Pipeline: read the postings himself, yes.
- **Code (v0.1.5):** `next_action(..., signal_discriminating)`; normalized exact matches labelled `model-judgment`; tests 37/37.
- **Run 7 (final):** `… --out-dir $R/pivot-2026-10-21-run7-final` → `✓ assessed 95 postings → STANDARD 75 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18` (the 52 former PRIORITIZE → STANDARD; nothing else changed); gates G1–G4 pass.
- **Attestation:** Ashwin ran `Ran 37 tests … OK` and re-attested v0.1.5 in chat.
