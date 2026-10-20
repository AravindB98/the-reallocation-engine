# Mode build: what the posting itself says about sponsorship (prpathak1)

## Executive summary

This folder is Prathamesh's submission for the Reallocation Engine "Mode Build" assignment (INFO
7375, due 2026-10-21). The mode helps a fictional international network-engineering student, on F-1
before OPT, see what each live job posting actually says about visa sponsorship, and keeps that
separate from the company's sponsorship history.

It ran for real on three employers' public job boards on 2026-10-20. The result: of 7 in-scope
postings, 2 are ruled out by inference (a required security clearance), 5 don't say, and none offers
sponsorship. It also found that the repository's existing posting fetcher silently loses exactly
this evidence. The mode is honestly a **DRAFT**: six items are open, including the automatic
labeler. A person labels every sentence.

## Files

| File | What |
|---|---|
| `../../../../recipes/cases/2026fa/prpathak1-network-sponsorship-text.md` | the mode (recipe), with lifecycle frontmatter |
| `../../../../recipes/cases/2026fa/prpathak1-network-sponsorship-text.card.md` | the human card |
| `DOMAIN-JUSTIFICATION.md` | one page: the user, the asymmetry, the layers, the failure modes |
| `WORKED-RUN.md` | commands, real output, verified vs inferred, break attempts, reflection, attestation |
| `LABELS.md` | every sentence/posting/title label: Claude's proposal beside Prathamesh's approved decision |
| `../../../../logs/runs/2026fa-prpathak1-2.md` | the run log |
| `../../../../scripts/contrib/2026fa/prpathak1-network-sponsorship-text/` | scripts, fixtures, tests |
| `logs/` | verbatim console output of the run |
| `FRICTIONAL.md`, `SOURCES.md` | the dated work log; sources and contributions |

## The brief's names vs this repository's names (and why)

The assignment brief and the repository's CI-enforced contribution rules (`CONTRIBUTING.md`,
`.github/workflows/contrib-gate.yml`) name things differently. **This submission follows the
repository**, as Prathamesh decided on 2026-10-20, so it merges cleanly and passes CI.

| Brief says | Used here | Why |
|---|---|---|
| mode file in `recipes/` | `recipes/cases/2026fa/prpathak1-network-sponsorship-text.md` + `.card.md` | CONTRIBUTING: student recipes go in `recipes/cases/<term>/<handle>-<slug>.md` with a card pair; top-level `recipes/` is for maintained recipes, and only a maintainer promotes a case there |
| supporting work in `assignments/submissions/<yourname>/` | `course/2026fa/submissions/prpathak1/network-sponsorship-text/` | `assignments/` does not exist upstream; CONTRIBUTING and the CI allowlist use `course/<term>/submissions/<handle>/` |
| branch `mode/<yourname>-<domain>` | `contrib/2026fa-prpathak1-mode-network-sponsorship-text` | CONTRIBUTING's pattern is `contrib/<term>-<handle>-<component>` ("mode" kept in the component name); CI does not check branch names |
| a `RUN_LOG.md` entry | `logs/runs/2026fa-prpathak1-2.md` | CONTRIBUTING: "never edit `logs/RUN_LOG.md`"; CI hard-fails a student PR that touches it (a protected path) |
| ZIP `reallocation-<yourname>-mode.zip` | `reallocation-prpathak1-mode.zip` (to be built from the commit) | the brief's name, with the GitHub handle as `<yourname>` |
| open a PR | a PR from this branch, opened by Prathamesh; PR #27 stays open too | CONTRIBUTING says "one open PR per student" (written policy, not a CI check). PR #27 (Recipe Design assignment, Oct 3) is a separate deliverable. **Prathamesh's TA confirmed on 2026-10-20 that both PRs should stay open** |

## Rebuild (Windows CMD)

```
py -3.11 -m venv C:\info7375\venvs\reallocation
C:\info7375\venvs\reallocation\Scripts\python.exe -m pip install requests
npx playwright install chromium
call C:\info7375\venvs\reallocation\Scripts\activate.bat
set "PYTHONUTF8=1"
python -m unittest discover -s scripts\contrib\2026fa\prpathak1-network-sponsorship-text\test
```

Then run the commands in `WORKED-RUN.md` §1. They write only to the gitignored `private/`.

## Privacy

- Fictional persona only.
- Raw posting JSON and the extraction outputs are in `private/` and are not committed.
- Tracked files quote at most one short sentence per public posting.
- Personal columns in the 80 Days data are never read.
- Nothing from `data/ats/` or any real résumé is used.
