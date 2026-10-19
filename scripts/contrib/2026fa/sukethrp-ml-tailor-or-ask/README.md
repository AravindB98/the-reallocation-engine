# Tailor or ask — the runnable part of the mode

## Executive summary

This folder holds the code for a job-search mode built for an early-career ML/AI engineer who will need H-1B
sponsorship. For each job posting in a list, it checks five things:
- whether the posting is still open;
- whether the company's public H-1B history includes this kind of role below senior level;
- whether the posting's stated experience minimum is within reach of the person's documented experience;
- whether a timeline has been stated;
- whether a fit has been stated.

Then it suggests one next step: tailor an application, ask a specific question first, move on, or hold because
something could not be checked. Read this to run the mode, run its tests, and know what each output means.

On the sample list (made-up postings at real companies), it suggests tailoring 1, asking first at 4, moving on from
2 and holding 3. Its 118 offline tests pass. Of a posting's own requirements, it checks only the duration of
experience minimums; the kind of experience and every other line are listed for the person to read. The screening
rules were reviewed and adopted by the student (v0.2.0).

## Run it

From the repo root:

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py
```

This reads the sample queue (`fixtures/sample-queue.json`), the fictional persona Priya Nair and her résumé file,
and writes into `output/sukethrp-ml-tailor-or-ask/2026-09-30-sample/` (git ignores `output/`):

| File | Reader | What it is |
|---|---|---|
| `report.md` | the person | summary first, then what to do next, a verified-vs-inferred table and a requirements table per posting, and what the run cannot verify |
| `run-log.json` | an agent | every value with its label and source, every check, the guard result, the scorer's command and output |
| `roles.json` | the scorer | exactly what was sent to the engine's scorer, after the guard passed it |
| `role-scores.json`, `role-scores.md` | both | the engine scorer's own output, unchanged |
| `postings/<id>.json` | both | live mode only: each posting's text as the job board's public API returned it, re-serialised and hashed |

Other ways to run it:

```bash
# your own queue, checked live: liveness through Playwright, posting text from Greenhouse's public API
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --queue <queue.json> --live --out-dir <dir>

# your own profile and résumé: allowed only with --private; every output must then go under private/ (git ignores it)
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --private --persona search/profile.yml \
    --resume search/resume.json --queue private/<queue.json> --out-dir private/<run>

# the guard on its own, against any scorer input
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py <roles.json>
```

Exit codes: `0` run complete (a HOLD is not a failure) · `1` run void (the scorer broke its contract, or a network
call was attempted while forbidden) · `2` stopped at the input or source gate · `3` the guard refused the scorer
input.

## Test it

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
```

There are 118 tests, all offline: every run sets `TAILOR_OR_ASK_FORBID_NETWORK`, so a network call stops the run.
They cover:
- the guard's rules, and the three engine-scorer defects it exists for (the `BROKEN-*` fixtures);
- the reused sponsorship checks on a fictional 11-row file;
- requirement reading (headings, minimum-experience phrasings, co-op months, overlapping jobs);
- every suggestion branch, and the student's rule calls R1–R8;
- the input, source, persona and résumé gates, identity decisions, private mode, and the labels;
- the recipe file itself (`test_recipe.py`): its TODO count against its status, its version, and that every path
  it names exists.

## The queue

```json
{
  "schema": "sukethrp-ml-tailor-or-ask/queue@1",
  "as_of": "YYYY-MM-DD",
  "queue_by": "student | claude-code",
  "persona": "search/examples/<name>/profile.yml",
  "resume": "search/examples/<name>/resume.example.json",
  "postings": [{
    "posting_id": "...", "company": "...", "title": "...", "url": "https://...",
    "csv_row": 123,
    "liveness": {"snapshot": "<saved page>.json"},
    "posting_text": {"path": "<saved posting text>.txt"},
    "timeline": {"factor": 0.85, "reason": "...", "by": "student | claude-code"},
    "fit": {"p": 0.7, "reason": "...", "by": "student | claude-code"},
    "company_identity": {"status": "confirmed | candidate", "csv_row": 123, "checked": "...", "sources": ["..."],
                         "unverified": ["..."], "by": "<a person>", "at": "YYYY-MM-DD"},
    "decision": {"choice": "TAILOR | ASK FIRST | MOVE ON | HOLD", "reason": "...", "by": "<a person>", "at": "YYYY-MM-DD"}
  }]
}
```

These fields are optional:
- `resume` defaults to `resume.example.json` beside the persona.
- `csv_row` is needed only when the company name doesn't match the file exactly. A `company_identity` decision outranks
  any automatic match. "Candidate" holds the posting even when the name matches exactly. An identity is never confirmed
  by claude-code.
- `liveness` and `posting_text` are used in sample mode; live mode checks the posting itself.
- `decision` and `shared_record_checked`.

These are all a HOLD:
- a missing, withheld (`{"withheld": true, ...}`) or unset (`{"unset": true, "reason": ..., "by": ...}`) timeline;
- a missing or unset fit;
- a posting with no readable text.

Every declared value says who declared it. `by: student` makes it `your-input`, and `by: claude-code` makes it
`model-judgment`, so nothing Claude Code proposes can pass as the person's own input. A decision must name a person;
`claude-code` is refused.

## Files

| File | What it does |
|---|---|
| `tailor_or_ask.py` | the mode: gates, checks, the guard, the scorer, the suggestion, both outputs |
| `requirements.py` | reads a posting's text into required and preferred lines, and compares its experience minimums with the documented experience |
| `guard.py` | refuses scorer input the engine's scorer would quietly accept: missing or text-valued gates, a `p` outside 0–1, unknown labels, misspelt fields |
| `evidence.py` | the record checks reused from Assignment 3 (see below) |
| `node_bridge.mjs` | lets Python call the engine's own JavaScript (YAML reading, the liveness classifier); byte-identical to A3's |
| `rules.json` | the declared title, tier and requirement-reading rules, marked as not yet reviewed by the student |
| `fixtures/` | the sample queue and its posting texts, illustrative page snapshots, the fictional test CSV, and the `BROKEN-*` break-test inputs |
| `tests/` | `test_guard.py`, `test_evidence.py`, `test_requirements.py`, `test_tailor_or_ask.py`, `test_recipe.py` |

## Reused from Assignment 3, and changed

`evidence.py` and `node_bridge.mjs` come from the author's Assignment 3 prototype
(`contrib/2026fa-sukethrp-ml-newgrad-sponsor-match` @ `95d4982`, nikbearbrown/the-reallocation-engine#12). That
branch is not on `main`, so the functions are copied here. Every change is named in the function's docstring. The
main one: values derived through the title rules are now labelled by whoever declared the rules, instead of always
`your-input`. That was the cause of A3's labelling defect.

## Engine code it calls, unchanged

- `scripts/score/role-scorer.mjs`, through its command line, never re-implemented;
- `scripts/ats/liveness-core.mjs` and `scripts/ats/check-liveness.mjs`;
- `normalize_company_name` from `scripts/sec/entity-resolution.py`;
- `fetch_board` from `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py`, which is allow-listed and
  doesn't follow redirects.

## What it cannot do yet

- **Most requirements:** only experience minimums are checked. Degree, skills, tools, sponsorship statements in the
  text, and "new grad only" windows are listed for the person to read. Live mode reads Greenhouse postings only.
- **Whether co-op time counts:** a posting rarely says, so when it decides a minimum the mode asks instead of guessing.
- **Wrong-company matches:** a posting's company can match a different company with the same normalised name. In the
  sample, "Meta" matches row 16612, META CO of Portola Valley, CA; the file has no Meta Platforms row. Even an exact
  match can be wrong: "Orenda" matches ORENDA INC, whose file website leads to a domain-for-sale page. Every
  suggestion prints the matched row, and a person records the identity decision. The mode cannot settle identity
  itself.
- **Incomplete résumé files:** the fictional persona's résumé file lists one job (8 months, a co-op), while her CV
  also lists 8 months of full-time ML work. The mode counts only what the file lists.
- **Timing:** it does not compute a timeline from dates; a person states the factor, or the posting is held.
