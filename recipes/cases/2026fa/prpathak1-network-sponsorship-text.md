---
status: DRAFT
todos_open: 6
last_gate: "label-review, 2026-10-20 13:57/14:01 EDT, logs/runs/2026fa-prpathak1-2.md"
attestation: null
recipe_version: 0.1.0
---

# network-sponsorship-text — what the posting itself says about sponsorship (SOC 15-1241)

## Executive summary

**What it is.** A workflow for one specific student: an international master's student on an F-1
visa, before OPT starts, looking for network engineering jobs. For each live public posting, it shows
the exact sentences the posting contains about visa sponsorship, work authorization, citizenship or
security clearance. A person then labels each sentence: does the text offer sponsorship, rule this
student out, or not say? A posting that says nothing is "the posting doesn't say", never "no".

**Why read it.** Employer sponsorship history and the posting in front of you are different
evidence. A company can have a long sponsorship record while this posting needs a clearance that, by
federal rule, is generally limited to citizens. Or it can be silent. This workflow keeps the two
apart. The company's history is shown only as background, never as an answer about the posting.

**What it found on its first real run (2026-10-20).**
- 7 network-engineering postings at two employers, fetched from their live public job boards, were
  in scope. All 7 were confirmed live by the liveness check.
- **2 are ruled out by inference**: they require a security clearance, and federal rules generally
  limit that to U.S. citizens. The postings themselves never say "citizen".
- **5 say nothing about sponsorship.**
- **None offers it.**
- Along the way it found that the repository's existing posting fetcher silently discards most of
  one employer's postings, including every one with clearance wording, and drops the text sections
  where such wording appears.
- Status: **DRAFT**. Six items remain open, including the automatic labeler, which does not exist:
  a person labels every sentence.

## Required reads

`SNICKERDOODLE.md` (lifecycle, gates, attestation), `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`
§Zero-Conditions. Human card: `recipes/cases/2026fa/prpathak1-network-sponsorship-text.card.md`.
Worked run, labels, justification: `course/2026fa/submissions/prpathak1/network-sponsorship-text/`.

## The situation (precise)

- **Who:** a fictional international master's student (network engineering), F-1 status, **before
  OPT starts**, who will need H-1B sponsorship after OPT. Fictional; no real person's data.
- **Target:** SOC **15-1241** (Computer Network Architects, incl. 15-1241.01 Telecommunications
  Engineering Specialists). Software titles that merely mention networking (likely 15-1252) are out
  of scope and are listed as "flagged, out of scope".
- **Decision this supports:** *which postings to spend application effort on, and which to set aside
  because the text itself rules the student out.* It does not rank fit, predict an offer, or decide
  sponsorship.

## Source inventory (exact paths and commands)

| Source | Path / command | Layer | Status |
|---|---|---|---|
| Live posting text (Lever, all text fields) | `python scripts/contrib/2026fa/prpathak1-network-sponsorship-text/fetch_lever_full.py <slugs> -o private/real-postings/<run>-full.json` | Job-Ops | runs; new |
| Live posting text (maintained path) | `cd scripts/ats && python fetch-real-postings.py --lever <names> -o ../../private/real-postings/<run>-existing.json` | Job-Ops | runs; **loses evidence** (see Known defects) |
| Title filter | `python …/filter_titles.py <postings.json> --out private/…/titles.json` | Job-Ops | runs; new |
| Sentence extraction (read-only) | `python …/extract_auth_sentences.py <postings.json> --titles <titles.json> --out private/…/full` | Job-Ops | runs; new; never labels |
| Liveness | `npm run ats:liveness -- <url> …` | Job-Ops (gate) | runs; maintained |
| Employer H-1B history (company-level) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, columns `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` **only** | 80 Days to Stay | tracked data; shown separately |
| SOC reference | `data/bls/compact/soc_occupation_compact.csv` rows 15-1241.00 / .01 | Cognitive Pivot | tracked data |
| Clearance rule | 32 CFR § 117.10(k)–(l), eCFR 2026-10-01 (quoted in the submission SOURCES.md) | outside rule | cited, not data |

Never read: the 80 Days `phone`, `executive_officers`, `board_directors` columns; anything in
`data/ats/`; any real résumé. Raw posting JSON stays in `private/`.

## Phase gates (human, testable)

| Gate | Handoff condition (testable) | Who clears |
|---|---|---|
| G1 boards | each board slug returns a JSON list (found) or is logged `not_found`; no posting invented | machine (conformance) |
| G2 titles | every `flag` title has an in-scope/out-of-scope decision with a reason, written in LABELS.md | named human |
| G3 labels | every extracted sentence and every in-scope posting has an approved label with a reason; proposals kept beside decisions; time-stamped | named human |
| G4 liveness | each shortlisted URL checked; anything not `active` is excluded from the shortlist | machine + human reads |
| G5 release | the run log exists, `npm run verify` / `doctor` / `pii-scan` are clean, and no `private/` file is tracked | named human |

On 2026-10-20: G1 passed (machine). G2 and G3 were cleared by Prathamesh (labels 13:57 EDT,
confirmations 14:01 EDT). **G4 cleared (machine check) at 14:10 EDT: all 7 shortlisted URLs are
`active`** (2 checked at 13:47, 5 at 14:10; none excluded). G5 is pending (checks below).

## Workflow

1. Fetch the full text for the chosen boards (G1).
2. Filter titles; a human decides every flagged title (G2).
3. Extract the authorization sentences (read-only; `label: null`).
4. Claude proposes a label + reason per sentence; **a human approves or changes each** (G3).
5. Combine into posting labels using the approved rule below.
6. Check the liveness of shortlisted URLs (G4).
7. Show the 80 Days company row beside the shortlist, never merged into a posting label.
8. Log the run; run the checks (G5).

**Label rule** (closed definition, with its reasoning):
- **supported**: the text explicitly offers sponsorship. Only an explicit offer counts, because
  silence and boilerplate are common.
- **contradicted**: the text explicitly excludes this persona (no sponsorship now or in the future;
  authorization required without sponsorship; U.S. citizenship / clearance / "U.S. person"), with
  the reason stated.
- **contradicted (inferred)**: a Required clearance, where the citizenship limit comes from an
  outside rule (32 CFR § 117.10(k)) and not from the text. It goes on the *inferred* side.
- **insufficient**: silent, ambiguous ("desired"), or a keyword false friend (ITAR as knowledge;
  "Visa" the company).

**Combination rule:** only Required-section sentences decide. The most restrictive wins
(contradicted > supported > insufficient). Preferred sentences are noted but do not decide.
Silent = insufficient.

## Can verify / Cannot verify

**Can verify (record):**
- the sentence exists verbatim in the posting at fetch time, and which field and section it came from;
- the posting text's SHA-256;
- the URL and title;
- the board was found or not found;
- liveness at check time;
- the stored 80 Days counts.

**Cannot verify:**
- the employer's actual sponsorship policy;
- whether a recruiter would make an exception;
- whether a Limited Access Authorization would be granted;
- whether the employer is a "contractor" under 32 CFR Part 117;
- the SOC code the employer would file;
- the H-1B lottery;
- anything a posting does not say;
- postings on boards the fetchers cannot read (Greenhouse body text, Workday, others).

## Output contracts

**Agent log (JSON)**: `private/network-sponsorship-text/<run>/full/extraction.json`, as produced:

```json
{"sentences": [{"job_id": "str", "company_slug": "str", "title": "str", "source_url": "str",
                "field": "descriptionPlain|lists|additionalPlain", "sentence": "verbatim str",
                "keywords": ["str"], "text_sha256": "hex", "label": null}],
 "postings":  [{"job_id": "str", "company_slug": "str", "title": "str", "fields_present": ["str"],
                "sentences": 0, "status": "has-sentences|silent", "text_sha256": "hex"}],
 "summary":   {"postings": 0, "silent": 0, "sentences": 0}}
```

`label` is always `null` here. Labels live only in the human record.

**Human report (Markdown)**: `course/2026fa/submissions/prpathak1/network-sponsorship-text/LABELS.md`:
an executive summary, then sentence labels (excerpt ≤30 words, section, proposed, approved, note),
posting labels (shortlist + "flagged, out of scope"), title decisions, and the 80 Days company row in
its own table.

## Stop conditions (refuse rather than guess)

| Condition | Behavior |
|---|---|
| Output path outside `private/` | STOP, exit 2, nothing written |
| Input has no `postings` list, or a posting has no title | STOP, exit 2 |
| Board not found (HTTP 404 / not a list) | log `not_found`; continue; never substitute another board |
| A posting has no text in any field | report `silent`, label insufficient; never "no" |
| A sentence has no approved label | the posting is not reported as labeled; the run is not complete |
| A shortlisted URL is not `active` | exclude it from the shortlist |
| The 80 Days row is missing for an employer | show "no trace in this dataset", never "does not sponsor" |

## Proposed additions (typed, open)

1. [TODO: DEV] **Classifier.** A rule-based proposer that suggests labels with the reason and section,
   validated against the approved labels in LABELS.md (5 sentences, 9 postings) before it may run.
   Human approval stays mandatory. Handoff: tests reproduce every approved label; a false-friend
   fixture stays insufficient.
2. [TODO: DEV] **Greenhouse body text.** `scripts/ats/scrapers/greenhouse/scraper.py:56` hard-codes
   `description_text: ""` (it calls `/jobs` without `?content=true`), so Greenhouse boards cannot be
   read for wording. Handoff: a contrib fetcher (or a declared maintained-file patch) that returns
   `content`, tested on one public board.
3. [TODO: DEV] **Schema-validator rejection.** `scripts/ats/scrapers/common/schema_validator.py:58`
   allows only `Full-time | Part-time | Contract | Intern | ""`. On 2026-10-20 it rejected 631 of 653
   Shield AI postings ("Full Time Employee", "International Office Entity", "International EOR"),
   including all 5 network postings, and 44 of 309 Palantir postings ("Internship", "Fixed-Term"),
   silently. `fetch-real-postings.py` prints only the kept count. Handoff: rejections surfaced in the
   summary, and the allowlist decision made by the maintainer.
4. [TODO: DEV] **Dropped Lever fields.** `scripts/ats/scrapers/lever/scraper.py` keeps only
   `descriptionPlain`; all 5 authorization sentences in this run were in `lists`. Handoff: the
   maintained scraper keeps `lists` (one line per bullet, with its section) and `additionalPlain`, and
   a regression test like `test_extract.LeverListLines` passes.
5. [TODO: DATA SOURCE] **Title → SOC crosswalk.** Scope decisions (15-1241 vs 15-1252) are human
   judgments today; no crosswalk file exists in the repo. Closure: a file at a named path + a
   provenance note.
6. [TODO: APPROVE] **Live gate record.** RUNNABLE-LIVE needs a live run with every gate cleared by a
   named human and logged as gate decisions. The 2026-10-20 run cleared G1–G4 (G4 at 14:10 EDT,
   7/7 active) but has no separate gate-decision record beyond LABELS.md and the run log, and G5 is
   not yet signed by a named human. Closure: a logged gate decision per gate.

## Known defects found by this recipe (in maintained code; not patched here)

Items 2–4 above. They are recorded, not fixed: those files are maintainer-owned (CODEOWNERS), and the
fix is a release judgment (SNICKERDOODLE P1).

## Run-log template — `logs/runs/2026fa-prpathak1-<n>.md`

```markdown
## YYYY-MM-DD — network-sponsorship-text run <n>
- Recipe: recipes/cases/2026fa/prpathak1-network-sponsorship-text.md v<version> (status …)
- Branch / commit: …
- Inputs: boards (slugs), fetch time (UTC), persona (fictional), title decisions
- Commands: (verbatim)
- Outputs: private/… (untracked); LABELS.md
- Result: shortlist counts by label; not-found boards; liveness
- Gates: who cleared which, when
- Open issues: …
```

## Change log

- 0.1.0 (2026-10-20): first version, with the first real run (`20261020-1348`). Labels approved by
  Prathamesh. DRAFT: 6 open items.
