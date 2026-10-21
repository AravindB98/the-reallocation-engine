---
status: DRAFT # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED — target RUNNABLE-SAMPLE once Aditya closes the open TODOs below
todos_open: 6
last_gate: null
attestation: null
recipe_version: 0.3.0
---

# java-backend-early2027 — Experienced Java Backend Opening Triage for an Early-2027 Start

## Executive summary

**What it is.** A screening procedure for one specific job seeker:
- an international master's student who already has several years of full-time Java/Spring
  backend experience (not a new graduate);
- who will need future visa sponsorship;
- who can start on a stated date in early 2027.

It runs before any tailoring time is spent. For each opening it answers, from the posting
itself:
- Is the opening still listed?
- Does this specific posting refuse sponsorship or require citizenship?
- Do its stated experience and degree requirements fit?
- Does any stated start date fit the candidate's availability?
- Is the work actually Java backend work?

**What it found on its first real run.** Twelve real postings were collected under a rule fixed
in advance. The mode skipped five of them, every one for a stated experience minimum (5 to 10
years) above the candidate's 4.5 full-time years. It sent six to a person and left one needing
sponsorship evidence. Assignment 1's earlier tool gave a different next step for 11 of the same
12 postings.

**What it refuses to do.**
- It never treats a company's sponsorship history as a promise for an opening.
- It never adds co-op months unless the posting accepts them.
- It never reads a title as a seniority level.
- It never treats "ASAP" or silence as a date.
- It never claims anything about work authorization.
- It produces no score.

**Status.** DRAFT, honestly. The program, tests, sample runs, and a real-posting run exist and
pass. The human review of the reports and four human decisions are still open (see "Open items").

## Situation (who uses this, exactly)

| Field | Value |
|---|---|
| Candidate | Experienced-hire Java/Spring backend engineer (distributed systems, messaging, cloud infrastructure; applied-AI infrastructure optional). Several years full-time, plus a separately recorded co-op. |
| Status | International master's student; post-completion work authorization **applied for, not approved**; future H-1B sponsorship needed |
| Start | A candidate-supplied availability date in early 2027, given in configuration (public persona: 2027-02-01) |
| Geography | US roles nationwide (a stated assumption, not a check) |
| Not for | New-grad program screening, intern roles, people-management roles |
| Public persona | `search/examples/tariq-lindqvist/` — fictional; 54 months full-time + 6-month co-op; availability 2027-02-01 |

## Required reads

| Read | Why |
|---|---|
| `SNICKERDOODLE.md`, `DOMAIN.md` | constitution and domain map |
| `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.md` | Assignment 1 recipe: company-vs-opening evidence states, liveness, refusal gate — reused here |
| `course/2026fa/submissions/aditya-raj-sde/assignment-2/SAMPLE-PROTOCOL.md` | how the real sample is chosen (fixed before collection) |
| `scripts/ats/liveness-core.mjs` | maintained page-liveness classifier, reached through Assignment 1's `evaluateLiveness` |

## Source inventory (exists today)

| Path / command | Use here | Label |
|---|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | employer order for the sample; company history as context only | record |
| `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py` | live board capture (full content, host allow-listed, raw saved to `private/`) | record |
| `scripts/ats/providers/_http.mjs` `fetchJson` | board-identity probe (redirects refused) | record |
| `npm run ats:liveness -- <url…>` (`scripts/ats/check-liveness.mjs`) | page liveness observation (network + Playwright) | record |
| `scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/reality-check.mjs` | `companyKey`, `loadSponsorCsv`, `matchCompany`, `classifyVacancy`, `evaluateLiveness` — imported, never copied | — |
| `scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/` | this mode: `collect.mjs` (only network script), `triage.mjs`, `checks.mjs`, `text.mjs`, `page-probe.mjs`, `break-test.mjs`, tests, fixtures, config | — |
| `search/examples/tariq-lindqvist/` | fictional candidate | your-input |

**Why no score.** The maintained combiner (`scripts/score/role-scorer.mjs`) is not called:
- there is no calibrated per-opening sponsorship probability to feed it;
- its role-quality weight is 0.0 (`DOMAIN.md` item 3);
- a missing timeline defaults to a passing 1.0;
- every new check here ends in a named state, not a number.

Adding a number would only invite it to be read as a recommendation.

## Phase gates (evaluated for every opening; the decision is the first gate that stops or asks for review)

| Gate | Testable condition | stop → | review → |
|---|---|---|---|
| G1 Input | the observation file and candidate configuration validate: example.com URLs for synthetic postings; https for real ones; recorded page results point at an existing evidence file; every experience entry has an explicit `employment_type`; `available_from` is `your-input` | exit 2, nothing written | — |
| G2 Liveness | `listed-and-page-active-at-observation` | both the feed and the page say gone → `skip-application` | the feed lists it but the page says expired (or the reverse); page uncertain; closure wording on an active page → `human-liveness-review` |
| G3 This posting's sponsorship / eligibility | no refusal and no citizenship requirement found | refusal (Assignment 1 vocabulary + Assignment 2 extensions) or "must be a U.S. citizen" → `skip-application` | clearance / export-control wording → `human-eligibility-review` |
| G4 Experience and degree | every stated **required** minimum met on full-time months | a required minimum not met (documented mismatch); an explicit experience cap; a graduation window that excludes the candidate → `skip-application` | above an ordinary "N–M" range; either/or or degree-conditioned years; co-op would change the result and the wording is unclear; ambiguous heading; years outside a recognizable section; unconditional PhD → `human-requirement-review` |
| G5 Start window | explicit stated window that includes or follows `available_from` (date arithmetic only), **or** no timing stated (`pass-unknown`, plus "confirm start date") | explicit window ending before `available_from` → `skip-application` | ASAP; tied to the offer date; winter season; conflicting statements → `human-start-window-review` |
| G6 Stack evidence | a JVM language in required/responsibility lines **and** a distributed-systems, messaging, or cloud-infrastructure term | — | Java only in preferred/other lines; another language required without Java; JVM without backend-infrastructure terms; under 400 characters → `human-requirement-review` |
| G7 Opening-level sponsorship evidence | apparent offer wording → `review-offer-excerpt` | otherwise → `seek-vacancy-sponsorship-evidence` | — |
| G8 Final review | always | — | a person reads `triage.md` |

**Precedence rule (tested):** every check is computed and reported, but no later result clears an
earlier stop. Neither a strong stack match nor offer wording can undo a G4 stop (test S29;
break mutant 1).

## Decision rules (defined)

**Experience (G4)** — rule applied to posting text, labelled model-judgment:
- **Sections.** A heading is *preferred* ("preferred", "nice to have", "bonus", "a/is a plus",
  "ideal"); *required* ("minimum", "requirements", "qualifications", "what we're looking for",
  "must (also) have", "should have", …); *responsibilities*; *other*; or **ambiguous** if it mixes
  preference and obligation cues ("Ideal Engineer should have"). Inline "preferred / a plus"
  overrides to preferred; inline "required / must have" overrides to required.
- **Headings as requirements.** A heading that itself states years or a degree is evaluated as a
  requirement line.
- **Years patterns.** `N+ years`, `at least / minimum (of) N years`, `N or more years`,
  `N years of|in|with …`, `N–M years` (range), `no more than / less than N years` (cap). Spelled
  and parenthesized numerals ("three (3) years") are parsed.
- **Required minimums are conjunctive.** Failing any one is a documented mismatch, which names
  the requirement and says it is not a claim the employer could never make an exception.
- **Co-op months.** Excluded by default and always shown separately. Explicit acceptance
  ("internships and co-ops count") applies them, and the excerpt is kept. Unclear wording
  ("professional or academic experience", "equivalent experience") when counting the co-op would
  change the result → review.
- **Titles.** Never read.

**Start window (G5)** — date arithmetic only:
- A start-related sentence with a month and year, or a season and year, gives a window: spring =
  March–May, summer = June–August, fall/autumn = September–November. Winter → review.
- **Compatible** if the window ends on or after `available_from`. **Conflict** if it ends before.
- Every result lists what it does **not** establish: work authorization or EAD approval, legal
  eligibility, hiring duration.

**Sponsorship wording (G3/G7):**
- Assignment 1's `classifyVacancy` (refusal, offer, conditional, contradictory, silent,
  not-captured), plus Assignment 2 extensions:
  - "must not (now or in the future) require … sponsorship" and "not eligible for … sponsorship" →
    refusal;
  - an application-style question ("will you now or in the future require sponsorship?") →
    `asks-about-sponsorship`, **not** a refusal.
- Citizenship requirement → stop. Clearance / ITAR / "U.S. person" wording → review.

**Stack (G6):**
- Term groups: JVM (Java, JVM, Kotlin, Scala — "JavaScript" excluded); Spring (Boot, Framework,
  Cloud, …); distributed systems; messaging; cloud infrastructure; applied-AI infrastructure
  (optional, never required).
- Negated Java ("Java experience is not required") is not evidence.

**Liveness (G2):**
- Assignment 1's `evaluateLiveness` (the maintained classifier plus the closure-wording check),
  combined with the employer-feed observation. A page that "looks expired" while the employer's
  own feed still lists the posting is a disagreement for a person, not a skip.

## Workflow (addressed to the agent)

1. **Collect (live, network).**
   `node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/collect.mjs --private-dir private/a2 --public-dir course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample`
   (follows `SAMPLE-PROTOCOL.md`; raw responses stay in `private/`).
2. **Observe pages (live).**
   `npm run ats:liveness -- <the selected URLs>`; save output as an evidence file. Optionally run
   `page-probe.mjs <selection.json>` for status, title, and length.
3. **Extract.**
   `node …/triage.mjs extract --collection private/a2/collection.json --page-liveness <evidence> --page-probe <evidence> --out <tracked observations.json> --full-out private/a2/observations-full.json`
4. **Run on full text (private) and on the committed excerpts (replay), then compare.**
   `node …/triage.mjs run --input <observations.json> --candidate <candidate.json> --out-dir <dir>`
   `node …/triage.mjs compare <full>/triage.json <replay>/triage.json` (must report 0
   differences).
5. **Stop at every review state.** Hand `triage.md` to the person (G8). Never clear a gate for
   them.
6. **Log** in `logs/runs/2026fa-aditya-raj-sde-<n>.md`. Never edit `logs/RUN_LOG.md`.

## Output contract

**`<out-dir>/triage.json`** (agent log):
- `run`: `command`, `started_at`, `kind` (`live-full-text` / `replay-of-captured-excerpts` /
  `synthetic`), `rules_version`, `input_file`, `input_sha256`, `csv_sha256`, `scorer: "not called"`.
- `candidate`: full-time months, co-op months, degrees, `available_from` — all `your-input`.
- `roles[]`, each with:
  - `company`, `liveness`, `vacancy`, `experience`, `start_window`, `stack`; each carries
    `state`, `gate`, `why`, `source`, and the excerpts it read;
  - `gates[]` (G1–G8, with status and reason);
  - `next_action`, `decided_by`, `also_needed[]`, `other_open_gates[]`.
- `summary`: counts by next step, `skip_fraction` (this sample only), state counts, and a
  `hypothesis_tally` (a count, labelled "not a verdict").

**`<out-dir>/triage.md`** (human report), in this order:
1. executive summary;
2. run record;
3. gate legend;
4. decision table, with company history in its own "context only" column;
5. waiting-for-a-person list;
6. evidence per opening: quoted employer lines, kept apart from lines that start with
   **Rule** (interpretation);
7. what the run cannot verify.

Synthetic postings are marked **SYNTHETIC**.

**Labels:**
- **record** = a data file, or an observation of a real feed or page;
- **model-judgment** = a rule applied to posting text;
- **your-input** = candidate-supplied values, and anything derived from a synthetic posting.

## What it can verify

- What each captured real posting's own text says (quoted, with section heading) about years,
  degrees, graduation windows, co-ops, start timing, sponsorship, citizenship or clearance, and
  stack terms, under the defined rules.
- Whether the candidate's supplied full-time months meet each stated required minimum (simple
  arithmetic), and whether the co-op would change that.
- Whether a stated start window ends before the supplied availability date (date arithmetic).
- Whether the employer's board feed listed the posting at capture time, and what the maintained
  page checker said shortly after.
- That the committed excerpts reproduce the full-text decisions (the `compare` step: 0
  differences on the real sample).
- That company history never changes a decision (it is not read by any gate).

## What it cannot verify

- **That any opening will sponsor.** All 12 real postings were silent. Application-form questions
  were not captured (Greenhouse `content` excludes them).
- **Work authorization, EAD approval, legal eligibility to start, or how long hiring takes.**
- That a posting is open *now*. It also cannot tell why a page was blocked: the 4 Pinterest pages
  returned an HTTP 403 bot challenge to the headless browser.
- Whether an employer would make an exception to a stated requirement, or would count co-op
  months.
- Wording outside the vocabularies. Rules v0.2–v0.3 were corrected on the same 12 postings, so
  accuracy on unseen postings is **not established**.
- Requirements in images, linked pages, or application forms.
- How good the candidate actually is at any listed technology.

## Stop conditions (refuse rather than guess)

- **G1 failure:** exit 2, nothing written. A half-written log looks like evidence.
- **Candidate entries without `employment_type`:** refuse. Inferring co-op vs full-time from a
  title would be a guess.
- **A `--full-out` or private input with an output outside `private/`:** refuse. Full posting
  text is never committed.
- **A G2/G3/G4/G5 stop:** do not route onward to evidence-seeking. A strong match or offer
  wording must not appear to override it.
- **Missing employer timing:** report `unknown`; never compute compatibility from nothing.
- **Never produce a match percentage or composite score.**

## Proposed additions

| Addition | Status |
|---|---|
| `collect.mjs`, `triage.mjs`, `checks.mjs`, `text.mjs`, `page-probe.mjs`, `break-test.mjs`, `triage.test.mjs`, fixtures, persona | **Built 2026-10-21.** Tests 45/45 (evidence 08, 11); real run evidence 06/07; break evidence 10b |
| **[TODO DEV]** Capture Greenhouse application questions (`/jobs/<id>?questions=true`) as a separate, labelled observation. *Why:* sponsorship questions often live in the form, not the description; all 12 real descriptions were silent. | not built — Aditya: build or defer |
| **[TODO DEV]** Held-out check: run v0.3 on the next postings in protocol order (positions 5–8 per board) and audit them, because v0.2–v0.3 were corrected on this sample. | not built — Aditya: build or defer |
| **[TODO DEV]** Patch the maintained `scripts/ats/liveness-core.mjs` so an HTTP 403 challenge page is `uncertain`, not `expired` (the one allowed maintained-file patch). *Why:* evidence 03/04. Until then, this mode's feed-vs-page rule is the guard. | not built — Aditya: patch or defer |

## Open items (human closure required before promotion)

- **[TODO APPROVE]** Aditya reads `runs/real-replay-v0.3/triage.md` and `runs/synthetic-v0.3/triage.md` and records whether they are adequate for the decision they support (G8 adequacy; the RUNNABLE-SAMPLE "audits read" condition).
- **[TODO DEFINE]** Co-op silence: should a posting that says nothing about co-ops, where counting the co-op would change the result (3 real postings: Databricks 8864368002 and 8806934002, Stripe 8230952), stay a documented mismatch (current) or go to review? Aditya decides, with one sentence of reasoning.
- **[TODO DEFINE]** Claude-chosen routine values, kept or changed by Aditya: the season-to-month windows; the heading and inline cue vocabularies; the 400-character threshold for "insufficient text"; the sample protocol's cohort rule and qualification threshold (≥4 per board).

## Run-log template (`logs/runs/2026fa-aditya-raj-sde-<n>.md`)

```markdown
## YYYY-MM-DD — java-backend-early2027 <live-collection | replay | synthetic> run

- **Recipe:** recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md v<recipe_version> (rules v<RULES_VERSION>)
- **Run by:** <Claude / Aditya>
- **Inputs:** <observations file + sha256>; candidate <config>; sponsorship CSV sha256 <hash>; collection window <start–end> (live only)
- **Outputs:** <out-dir>/triage.json, <out-dir>/triage.md
- **Result:** <counts by next step>; skip fraction <k/n, this sample only>; full-text vs replay differences <n>
- **Human gates:** <which were cleared, by whom, when — or "none cleared">
- **Open issues:** <misclassifications seen, limitations hit, decisions pending>
```
