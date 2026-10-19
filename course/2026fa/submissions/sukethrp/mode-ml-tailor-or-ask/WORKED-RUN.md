# Worked run — ml-tailor-or-ask

## Executive summary

This is the record of running the mode for real, twice, by the student.
- **The sample run:** ten made-up postings at real companies, checked against the real sponsorship file for a
  fictional applicant. It produced every kind of outcome: tailor 1, ask first 4, move on 2, hold 3.
- **The live run:** two real, open machine-learning postings, at Goodfire and Orenda. Both pages were open, yet both
  stayed on hold. The student confirmed one company's identity from its legal terms and an SEC filing, but would not
  clear the other on a name match alone. They also left fit and timing unset because the facts to justify them are
  missing.
- **An earlier automated attempt** on the same live list could not launch its browser. The mode held both postings
  instead of calling them closed.

The page shows what was verified, what was inferred, how the output was checked, and what the mode cannot do.
The student signed the attestation and wrote the reflection on 2026-10-19 (Checkpoint 4). Every command shown here was
run by the student in their own terminal, and its output is pasted, with only the shell prompt shown as `$`.

## Inputs

| Run | Postings | Applicant | Other inputs | Who chose them |
|---|---|---|---|---|
| Sample (`runs/sample/`) | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/sample-queue.json`: 10 illustrative postings at real companies, with synthetic page snapshots and posting texts | `search/examples/priya-nair/` (fictional) | sponsorship file pinned at sha256 `eccdee2a…6270`; rules v0.2.0 adopted by the student | Claude Code wrote the queue, so its values are labelled model-judgment |
| Live (`runs/live/`) | `runs/live/queue.json`: Goodfire and Orenda, "Machine Learning Engineer", public Greenhouse postings | the same fictional persona | the same file and rules; every gate decision is the student's, in their own words | the student (Goodfire at Checkpoint 2, Orenda in the design answers) |

Naming either company does not imply confirmed sponsorship. Nothing from the student's own résumé, dates or
applications is used.

## Commands run, and their real output

### 0. Before building: the engine's own scorer and liveness check, re-run by the student (13:43 EDT)

The Checkpoint 2 results first came from an automated session the student used, which wrote no files. The student
re-ran both checks in their own terminal:

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor/role-scores.json  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor/role-scores.md
$ npm run ats:liveness -- https://job-boards.greenhouse.io/goodfire/jobs/5019847008

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/goodfire/jobs/5019847008

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/goodfire/jobs/5019847008

Results: 1 active  0 expired  0 uncertain
```

The scorer's files are in `runs/anchor/`. The book's "ghost posting" is skipped because its liveness gate is closed,
whatever its sponsorship and fit.

### 1. Sample run: the student, in their own terminal, 2026-10-19 (log 11:56:08 UTC)

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample
✓ 10 postings → TAILOR 1, ASK FIRST 4, MOVE ON 2, HOLD 3 · scored 4
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/run-log.json
```

The shell prompt is shown as `$`. The paste is saved in `runs/sample/terminal-output.txt`.

What each sample posting got, from `runs/sample/run-log.json`:

| Posting (illustrative) | Company row matched | Suggestion | Why |
|---|---|---|---|
| Discord, MLE New Grad | 7770 DISCORD INC | TAILOR | Proven (an ML title counted), active, composite 0.446 |
| Etsy, MLE I | 9093 ETSY INC | ASK FIRST | "1+ years" is 4 months short counting the co-op; the student's own gap question |
| Airbnb, MLE Early Career | 1013 AIRBNB INC | ASK FIRST | no ML/AI title among the sponsored titles |
| Hugging Face, MLE | 12614 HUGGING FACE INC | ASK FIRST | no H-1B record (unknown, not "no"), and "6+ months" is met only if co-op counts |
| Meta, AI Research Engineer | **16612 META CO (Portola Valley)** | ASK FIRST | "no H-1B record", but for a namesake: the file has no Meta Platforms row |
| Celestial AI, MLE | 5181 CELESTIAL AI INC | MOVE ON | the page is closed |
| Kensho, MLE | 14287 KENSHO TECHNOLOGIES INC | MOVE ON | "2+ years … (a firm requirement)", and every documented month falls short |
| AppLovin, MLE New Grad | 1955 APPLOVIN CORP | HOLD | the page is uncertain (no apply control) |
| Databricks, AI Engineer | 7248 DATABRICKS INC | HOLD | timeline withheld |
| Peloton, MLE | — | HOLD | several "Peloton" rows, and a stale page check |

### 2. Live run: the student, in their own terminal, 2026-10-19 (log 11:22:06 UTC)

This run's terminal output was not saved. Its first attempt stopped because `round-1/` already held a run. To capture
the output, the student ran the same queue again at 13:44:17 EDT, into `runs/live/round-3-panel/`:

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/queue.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel
✓ 2 postings → TAILOR 0, ASK FIRST 0, MOVE ON 0, HOLD 2 · scored 0
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/run-log.json
```

Both of the student's live runs give the same result: liveness exit 0, HOLD 2, scored 0, and identical posting-text
hashes.

From `runs/live/round-2-personal/run-log.json`:
- the liveness subprocess exited 0, with both pages active;
- the posting texts were saved with sha256 `44ac3e2a…` (Goodfire) and `f269d74b…` (Orenda). The full third-party
  texts are kept outside the repo; each run log records the API URL and the hash, and the report quotes the lines it checked;
- the result is HOLD 2, scored 0, and decided 2.

### 3. The earlier automated attempt (not the student's run), log 11:17:25 UTC

From `runs/live/round-1/terminal-output.txt`, written by that session:

```text
Execution context: automated PTY session; not a personal run in the app Terminal panel.
✓ 2 postings → TAILOR 0, ASK FIRST 0, MOVE ON 0, HOLD 2 · scored 0
The liveness subprocess exited 1 after a browser-launch failure; both postings remain unresolved for liveness.
```

Its run log records Playwright's launch being denied. The mode held both postings on liveness and never called them
closed (rule R8, on a real failure). The home folder in two captured lines was replaced with `~` before publishing;
see `runs/live/round-1/NOTE.md`.

### 4. Deliberate break attempt: the student, 2026-10-19 (scorer output written 13:35:37 EDT)

The same input, a posting with **no liveness gate**, was given to the engine's scorer and to the guard:

The student ran it first at 13:35, then again at 13:43:51 to capture the terminal output:

```text
$ npm run score -- scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir output/sukethrp-ml-tailor-or-ask/break-demo-panel

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir output/sukethrp-ml-tailor-or-ask/break-demo-panel

✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  output/sukethrp-ml-tailor-or-ask/break-demo-panel/role-scores.json  +  output/sukethrp-ml-tailor-or-ask/break-demo-panel/role-scores.md
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json
REFUSED: 1 problem(s); nothing was sent to the scorer
  - roles[0] (b-missing-liveness).liveness is missing; the scorer would treat it as fully open (x1)
```

Both runs give the same result (composite 0.4208). The student's attestation records the exit codes: 0 from the
scorer and 3 from the guard. The scorer's own output files, copied to `runs/break-demo-personal/`,
show what "Apply" rested on (the same in `runs/break-demo-panel/`). This is from its human report `role-scores.md`:

```text
| Example Robotics — Machine Learning Engineer | 0.421 | **Apply** | composite 0.421 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[record]×timeline 0.85[your-input] |
```

The input had no liveness field, yet the scorer's report says "gates healthy" and lists a liveness gate of 1
**labelled `record`**. The scorer did not only treat the missing gate as open: its audit trace attributes to a record
a value no record produced (`role-scorer.mjs:83` defaults the factor to 1, and `:86` defaults its source to `record`). That is the
defect the guard exists for. The guard does not fix the scorer, as the student's attestation says; it refuses such
input before the scorer sees it.

## Verified vs inferred, line by line (live run)

`record` means read from a repo record or a live check. `your-input` means declared by the student, including values
derived through the rules they adopted. `model-judgment` means proposed by Claude Code (none in the live run).

| Posting | Line | What it says | Label | Produced by |
|---|---|---|---|---|
| Goodfire | page status | active: an apply control was detected | record | `check-liveness.mjs`, live |
| Goodfire | company row | 11308 GOODFIRE AI INC, San Francisco, CA | your-input | the student's identity decision; the file's website stays unverified |
| Goodfire | identity evidence | legal terms + SEC Form D filing | your-input | the student |
| Goodfire | H-1B record | all five fields blank, so unknown, not "does not sponsor" | record | the sponsorship file, row 11308; also checked by hand by the student |
| Goodfire | required: "5+ years of experience in ML infra, research engineering, or systems programming." | 60 months asked; 8 documented, all co-op; 52 short | record (text) · your-input (the reading) · record (persona file) | the posting via the Greenhouse API; adopted rules; the persona's résumé file |
| Goodfire | kind of experience asked | "in ML infra, research engineering, or systems programming" | not checked | shown for a person to judge |
| Goodfire | 4 other required lines, 2 preferred, 1 work condition | listed word for word | record | the posting text |
| Goodfire | fit, timeline | left unset, with the student's reasons | your-input | the student |
| Orenda | page status | active: an apply control was detected | record | `check-liveness.mjs`, live |
| Orenda | company row | 19228 ORENDA INC, a candidate the student did not clear (orenda.io vs orendapower.com) | your-input | the student's identity decision |
| Orenda | required: "B.S. and 3+ years of relevant experience" | 36 months asked; 8 documented; 28 short; the degree is not checked | record · your-input · record | as above |
| Orenda | required: "2+ years experience writing clean, maintainable Python code with Machine Learning…" | 24 months asked; 16 short; the kind is not checked | record · your-input · record | as above |
| Orenda | work condition | full time, in-office, headquarters in Brooklyn | record | the posting text, awaiting review |
| Orenda | fit, timeline | left unset, with the student's reasons | your-input | the student |
| both | suggestion | HOLD | computed | the mode's precedence rules: unresolved gates first |
| both | decision | HOLD, each with a written reason | your-input | the student (sukethrp), 2026-10-19 |

**Not estimated, but still judgment.** Fit and timeline were not estimated, and no score was produced. The
company-identity decisions still involved judgment (confirming Goodfire's row, keeping Orenda's as a candidate), and so
did the screening rules (which sponsored titles count, how requirement lines are read). Those values are labelled
`your-input`, never `record`.

## How the output was checked

- **By hand (the student):** displayed row 11308 from the CSV. It showed GOODFIRE AI INC, San Francisco, CA, with all
  five H-1B fields blank, matching the report.
- **Hashes:**
  - the live queue's sha256 (`bd58ecec…`) is the same in both live run logs;
  - both runs fetched identical posting texts (same sha256);
  - the sponsorship file matched its pin in every run.
- **Reproducibility:** the student's sample run reproduced the counts in the recipe exactly (1 / 4 / 2 / 3, 4 scored).
- **Offline tests:** 118 pass (`python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests`),
  including tests that check the recipe file itself.

## Attestation

Signed by the student, copied from their Checkpoint 4 message. Only the table grid was restored.

- Recipe: ml-tailor-or-ask v0.1.0 · rules v0.2.0
- By: Suketh Reddy Produtoor · 2026-10-19

### Tested
| Ran | Saw | Expected |
|---|---|---|
| Live command into round-1 | Stopped because the folder already contained a run | Preserve existing evidence |
| Live command into round-2-personal | Both postings active; HOLD 2; scored 0 | Unresolved gates prevent scoring |
| Direct CSV read of data row 11308 | GOODFIRE AI INC, San Francisco, CA; all five H-1B fields blank | Company details match the report; missing sponsorship history remains unknown |
| Engine scorer on BROKEN-missing-liveness.json | Apply 1; exit 0 | Reproduce the scorer’s behavior when liveness is missing |
| Guard on the same broken input | REFUSED; identified missing liveness; exit 3 | Reject incomplete input before scoring |

### Did not test
- A private run using my own résumé and profile.
- A live posting that cleared every gate and reached the scorer.
- A closed live posting or a live Lever/Ashby posting.
- Submitting an application or obtaining employer confirmation of sponsorship and start dates.
- The proposed degree, skills, kind-of-experience, sponsorship-text, and new-grad-window checks.

### Broke during testing, fixed
- My first live attempt stopped at the existing-output safeguard. I resolved this by choosing a fresh output folder and preserving the earlier run.
- The deliberate missing-liveness test reproduced an unresolved engine defect: an unchecked gate was treated as fully open. The guard rejected that input as intended. This demonstrates the safeguard; it does not establish that the underlying scorer defect is fixed.

### After signing: one test-only change

At 13:58 EDT, after the attestation, one test file changed. In `tests/test_guard.py`, a class decorator
(`unittest.skipUnless`) became the same skip inside `setUp`. The repo's branch-diff privacy scan reads an added
decorator line with a dotted name as an email address, so CI would have failed the PR on a false positive. No mode code, rules,
recipe or card changed, and all 118 tests still pass. The constitution counts any edit to a recipe's scripts after
attestation as voiding it, so the student re-confirms the attestation below.

- Re-confirmation: *pending the student*.

## Found and fixed while building (Claude Code, not part of the student's attestation)

Each of these was found by Claude Code while building or testing, and fixed with a test:
- "Up to 2 years" had been read as a 2-year minimum.
- "6 months to 2 years" had been read as 2 years.
- "Three years" and "2 years in …" were not read at all.
- A bare "3 years" in an alternative-path line was missed.
- A private résumé was read before checking that outputs would stay in `private/`.
- A captured browser error carried the local home folder. It is now written as `~`.
- After both logged runs, a new test found that a malformed scorer result crashed the contract check instead of
  voiding the run. Fixed in `evidence.py`; neither logged run is affected.

Found but not fixed, because it is engine code outside this namespace: the engine scorer's gates fail open, and the
scorer labels the missing gate `record`. The guard refuses such input.

## Reflection (the student's own words)

From the student's Checkpoint 3 record, verbatim:

> What stood out was that both pages were active, yet neither posting reached the scorer. Clearing liveness did not
> resolve the other gates. My next steps are to reconcile the fictional résumé sources, confirm Orenda's identity,
> and obtain enough timing information to justify a factor.

From the Checkpoint 3 note, verbatim:

> What stands out is that choosing a closer-looking role does not necessarily produce a recommendation. The
> applicant's source files, company identity, and timing evidence still matter. The structured résumé's missing job
> is especially important because the mode can calculate correctly from an incomplete input.

From the student's Checkpoint 4 reflection, verbatim:

> The deliberate break test gave me the clearest evidence for keeping the guard. I supplied the same input, with no
> liveness gate, to both programs. The scorer recommended Apply, while the guard identified the missing field and
> refused the input. The exit codes confirmed the difference: zero from the scorer and three from the guard. This
> showed that successful execution alone does not establish that the input was complete or the recommendation
> justified.
