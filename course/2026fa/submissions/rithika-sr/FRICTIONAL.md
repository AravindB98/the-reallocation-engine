# FRICTIONAL — rithika-sr · ds-newgrad-h1b-15-2051

## 2026-10-02 — setup and investigation

- **Tried:** forked, cloned, `npm run doctor` / `npm run verify`. Expected both to pass;
  verify failed (`No module named 'yaml'`). Fixed with a repo `.venv` + PyYAML.
- **Checked:** manifest-check warned `private/` and `data/ats/` are not gitignored.
  `git check-ignore -v` showed both are ignored (`/private/*`, `/data/ats/*`), so the warning is a false positive.
- **Learned from the scorer:** ran it on `data/examples/ch11-roles.json` (skip 40%, below the 50% rule).
  Reading `role-scorer.mjs` showed a missing liveness defaults to 1.0 labeled `record`, so I decided
  my prototype must hold unchecked roles instead of sending them.
- **Learned from the data:** the sponsorship CSV has no SOC column, so "sponsors data scientists"
  can only be a title text match; BLS row `15-2051.00` has empty O*NET ability fields.
- **Decided:** a situation modeled on my own (graduating Dec 2026, OPT from Jan 2027) through a
  fictional persona, Sasha Jones. Committed predictions before any code (`c84c197`).
- **Friction:** my first CHANGE-BRIEF never saved from VS Code (`git add` → "did not match any files");
  switched to writing files with terminal heredocs.

## 2026-10-03 — build, run, verify

- **Fixtures** with invented companies so no real names or phones enter the repo (`d322d3c`).
- **Broke:** `triage.py` would not compile (`SyntaxError`, line 473) because I pasted the block twice.
  Removed the duplicate with `sed`, confirmed with `py_compile`.
- **Fixture run** matched every outcome predicted beforehand; 17 tests pass (`e8a5724`).
- **Caught a privacy leak:** a grep found my home-folder path in a committed log (made before the
  `rel()` fix). Regenerated it, amended the unpushed commit (`0f98ab9`), and confirmed `0` matches in branch history.
- **Real CSV:** P1, P2, P3 confirmed with numbers (89 → 111 alias matches; 32 of 102 senior titles;
  "Airbnb"/"Instacart" held at G1). 94.9% of rows have blank approvals.
- **Liveness:** first run failed (Chromium missing); installed it. 3 active, 1 expired, 1 uncertain.
  I opened the "active" builtin.com Instacart page myself: it says the job was removed on Jun 11, 2025.
  That role had scored Apply, so the liveness gate let through a false positive.
- **Noticed** a Proven sponsor alone (0.315) clears the 0.30 Apply line → added a ⚠ weak-fit flag.
- **Fresh clone:** report reproduced identically; four break attempts all stopped or gated (`1fb541d`).

## Unresolved questions

- Is a 60-day hiring lag realistic for new-grad DS roles? It is an assumption, not data.
- My timeline formula is my understanding of the OPT 90-day rule; I should confirm it with OGS.
- Should the scorer fail closed on a missing liveness value? That would be an upstream change, not mine.
- Every DS posting I found at a Proven sponsor needed 4+ years. How would a new grad find junior roles there?

## Human / AI contributions

- **Claude (claude.ai):** proposed the recipe design and gate structure; drafted `triage.py`,
  `test_triage.py`, the fixtures, recipe, card, and reports; searched the web for the posting URLs.
- **Me:** ran every command and read every output; chose the situation, the persona, and
  predictions P1–P4; opened the builtin.com page and confirmed the false positive; set Sasha's
  fit ratings; reviewed each document before committing it.
- **Accepted:** the design and drafts after they ran and passed tests. **Changed on my request:**
  persona name (Sasha Jones), shorter logs. **Rejected:** "Research Scientist" as a title alias,
  after the data showed it pulls in biotech lab roles.
