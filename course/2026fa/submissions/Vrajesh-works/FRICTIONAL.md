# FRICTIONAL — ms-is-swe-opt-shortlist

## Summary

This is an honest log of what was tried, what went wrong, what was checked, and who did what while building the OPT-countdown sponsor shortlist. How it was written: Claude Code drafted the timeline of attempts, the lists of what was checked and changed, the "who did what" section and the traceability from this working session. I made the decisions about my current situation, the dates, and which postings to keep or remove, and I'm responsible for checking all of it.

## 1. Attempts, expectations and what happened

| # | Tried | Expected | What happened |
|---|---|---|---|
| 1 | Cloned the fork and ran `npm run verify` and `npm run doctor` for a baseline | both pass on a fresh clone | `verify` **failed** with 6 `E3 ... out of sync` errors. Cause: Windows `core.autocrlf=true` had turned generated files into CRLF. Set `autocrlf=false` and re-checked out in this clone only; baseline then passed (3 warnings) |
| 2 | Wrote `CHANGE-BRIEF.md` before building | predictions to compare later | Drafted by the AI; one prediction (funding would look stale) turned out partly wrong: 2025-09 funding counted as "recent" under the 24-month rule even though the data is 372 days old |
| 3 | First prototype, flat fit 0.7 | non-sponsors would Skip | Arithmetic showed a company with no sponsorship record would score 0.30 × 0.7 = 0.21, inside the Consider band (≥ 0.20). Default fit changed to 0.5 |
| 4 | Ran the first test suite | all pass | 13 of 14 passed. The failing test had a wrong expected value (timeline factor 0.667, not 1); the code was right and the test was corrected |
| 5 | Real run on 6 CSV companies with no posting URLs | something scored | 0 of 6 scored (all "network target" or `not-in-csv`); the scored path had never run on real data |
| 6 | Looked for real postings; the first Verkada role was an embedded role | a fit for an Information Systems graduate | Vrajesh rejected it as a poor fit. A second Verkada role was in Poland. Replaced with a Cohere Health US posting |
| 7 | Vrajesh supplied three postings: Talent Vine, Intuit, Confido | they would score | **Talent Vine:** active per the checker, but the posting says "U.S. citizenship (required)", so the engine data cannot catch it; added a human `excluded_reason`. **Intuit:** not in the CSV (only unrelated "Intuitive …" fund entities). **Confido:** scored Skip because the CSV has no approvals and a 2024 pre-seed round, while the posting claims a later $55M Series B |
| 8 | Deliberate break attempts (late date, misspelled company, tracked out-dir, undated liveness, `--as-of 2026-02-30`) | all rejected or gated | Four behaved correctly. `2026-02-30` was **accepted** (JavaScript rolls it to March 2) and the run exited 0. Fixed with a round-trip check and regression assertions |
| 9 | Prepared to commit | clean history | The git author email was Vrajesh's real address; switched this repo to a GitHub noreply address before committing, since real email in history is a zero-condition |
| 10 | Vrajesh pointed out a gap: the tool only asks about H-1B sponsorship, but the immediate goal is a job right after graduating, including a **contract role that does not sponsor** and can be worked on OPT | the tool would handle such a role sensibly | It would not: a company with no sponsorship record scores 0 on that vote, and the scorer does not rescale its weights for a no-sponsorship profile (maximum score 0.30 × fit), so such a role would be a Skip. Added a per-posting `track: "opt-bridge"` that checks only liveness and the timeline, uses no sponsorship score and never calls the scorer; 2 tests added (17 total). Whether a given role is allowed on OPT is left to a person to confirm with the school's international office. Not yet run on a real contract posting |
| 11 | Vrajesh supplied a Motion Recruitment contract posting (Backend DevOps Engineer, Danvers MA), the first real test of the `opt-bridge` track | a contract role that fits an entry-level IS graduate | The checker printed `active` and the tool returned `opt-bridge-open` ("candidate"). Reading the page showed it is a **senior** role: 6+ years of experience, C, embedded, QNX. The bridge track checks only liveness and timeline, so it cannot see seniority or fit. Vrajesh chose to keep it as a bridge row, with no exclusion, so the run shows that limit honestly |
| 12 | Vrajesh supplied a Boeing "Software Engineer - Entry Level" posting (Annapolis Junction MD) | an entry-level role that could match | Active and genuinely entry-level (no experience required), but the required qualifications include an "Active TS/SCI with Polygraph Clearance". To my reading that needs U.S. citizenship, so it was recorded as a human `excluded_reason` Skip. Boeing is also not in the CSV |
| 13 | Vrajesh supplied a LinkedIn posting (DeWinter Group, Full Stack Engineer) | it could be read and added | LinkedIn showed a sign-up wall. The AI did not sign in or create an account, so the posting was never read. Vrajesh asked for it to be left out. It is not in the run |

## 2. What was checked or changed in response, and what is still open

Checked:
- Verkada's raw CSV row: 272 approvals and 4 denials give 272 / (272 + 4) = 98.55%, which matches the stored rate.
- The CSV's sha256 matches the hash in the run log.
- 17 offline tests pass; `npm run verify` and conformance pass; `pii-scan` flags only an upstream `package-lock.json` author address.
- Postings were opened and read in a browser (Talent Vine, Intuit, Confido, Motion Recruitment, Boeing), and `npm run ats:liveness` was run on seven URLs (those five plus Verkada and Cohere Health); all printed `active`. The LinkedIn posting could not be read (sign-up wall) and is not in the run.

Changed in response: fit default 0.5; `excluded_reason` field; the "not found" message now says absence is not evidence of non-sponsorship; date validation; tracking parameters (`jr_id`, `cid`) stripped from stored URLs; the OPT-bridge track for roles taken without sponsorship (added after Vrajesh's point about contract roles); the recipe and card gained the eligibility, coverage and false-Skip limits. The AI also found and fixed its own mistakes (rows 3, 4 and 8 in section 1).

Still open:
- No human has cleared the liveness gate, and the data cannot show whether a company sponsors entry-level roles (some postings say new grad, but the sponsorship history lists only top titles).
- Intuit's and Confido's sponsorship stance is unknown to the tool; Confido's Skip may be wrong.
- No real expired posting was tested (fixture only).
- The skip rate on scored roles is 33%, below the 50% a healthy run should reach, from only three scored roles.
- With the new H-1B rules, many companies may be changing their policies, so I wonder whether this system will stay truthful over a longer period.
- Sponsorship itself may differ by team: even if a company sponsors, one team may sponsor while another does not, and the data has only one row per company.
- The OPT-bridge track checks only liveness and timeline, so it cannot see seniority or fit (the Motion Recruitment row is live but a senior role needing 6+ years).
- One LinkedIn posting (DeWinter Group) could not be read without signing in and is not in the run.

## 3. Who did what

This section was filled in by Claude Code from the conversation, not from Vrajesh's recollection.

### 3.1 Decided or directed by Vrajesh

- Chose the situation and target: MS Information Systems, F-1, entry-level software engineer.
- Forked the repo, and chose to push and open the PR personally.
- **Rejected** the Verkada "Embedded Software Engineer, Access Control" posting as a poor fit; it was dropped from the run.
- Supplied five postings that were read and run: Talent Vine, Intuit, Confido, Motion Recruitment and Boeing. Also supplied a LinkedIn link that could not be read without signing in, and asked for it to be left out.
- Decided to keep the Motion Recruitment posting as an OPT-bridge row, not excluded, so the run shows the bridge track's limit (it cannot see seniority).
- Pointed out that the tool only asked about H-1B sponsorship, which led to the OPT-bridge track (row 10 in section 1).
- Directed the AI to search for real postings itself ("do search yourself").
- Decided that `2027-01-15` is a made-up placeholder and not a real OPT date, which allowed the PII box to be ticked.

### 3.2 Done by Claude Code

- Drafted the brief, prototype, 17 tests, recipe, card and documents.
- Ran `npm run ats:liveness`, the real runs and the break attempts; found and fixed the date bug.
- Proposed the tier rule and the fit default (see 3.3).
- On its own initiative, not requested: switched this repo's commit author email to a GitHub noreply address, to keep a real email out of public history.

### 3.3 AI proposals and their review status

These were proposed and made by the AI. Before presenting, Vrajesh should be able to explain each in their own words.

**Reviewed by Vrajesh** (as reported by Vrajesh on 2026-10-03; no changes were requested):

- The sponsorship tier rule: 10 approvals plus a non-senior software title = Proven; probabilities 0.9 / 0.6 / 0.3 / 0. This is the AI's design choice, not a measurement from any data.
- Claiming only DRAFT for the recipe, not RUNNABLE-SAMPLE.
- Leaving Confido's Skip as the tool's own output, with no override added. The AI recommended it.

- The flat fit default of 0.5, set by the AI so that a company with no sponsorship record cannot reach the Consider band on fit alone. Vrajesh reviewed it on 2026-10-03 and decided to keep it; their words: at first it did not feel right, but they think it will work out. It applies only to the sponsorship track (the OPT-bridge track does not use fit).

## 4. Traceability

- Commits: `10b88b7` (prototype and tests), `bed2c3a` (recipe and card), `654e5fe` (brief, worked run, justification, test report, run log). Check with `git log`.
- Tests: `scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.test.mjs` (17 passing).
- Evidence: `course/2026fa/submissions/Vrajesh-works/` — `baseline-verify.txt`, `after-verify.txt`, `runs/shortlist-log.json`, `WORKED-RUN.md` (attestation and break attempts), `TEST-REPORT.md`; run log `logs/runs/2026fa-Vrajesh-works-1.md`.
