---
status: DRAFT
todos_open: 8
last_gate: "live-run gate decisions by sukethrp, 2026-10-19: G3 Goodfire confirmed (legal terms + SEC Form D), Orenda kept as candidate; G7/G8 left unset with reasons; G11 HOLD x2; logs/runs/2026fa-sukethrp-4.md"
attestation: null
recipe_version: 0.2.0
---

# ml-tailor-or-ask — is this ML/AI posting worth a tailored application?

## Executive summary

**What it does.** Given a list of target companies, it first reads the public job boards it can read, keeps the
machine-learning postings that fit the person's filters, and reports what the public H-1B file holds for every
company, including the ones it cannot read. Then, for one job posting at a time, it checks three kinds of evidence:
- whether the posting is still open;
- whether the company's public H-1B history includes this kind of machine-learning role;
- whether the posting's stated experience minimums are within reach of the person's documented work history.

It then suggests one next step:
- **tailor** an application;
- **ask first**, and it hands over the exact question to ask;
- **move on**;
- **hold**, because something could not be checked. When the mode holds, it makes no suggestion and says what to
  resolve. A posting where every record-based check passed and only the person's fit call is left goes on a ranked
  shortlist.

**Who it is for.** An international ML/AI engineer on an F-1 visa who will need H-1B sponsorship. They are early in
their career but have prior production machine-learning work, so a "new grad" label undersells them, and a posting's
"3+ years" or "Engineer II" may or may not fit. What they cannot easily see is whether a company's sponsorship
history is relevant to *this* role, and whether their own experience meets *this* posting's required lines, as
opposed to its preferred ones.

**What it decides.** Nothing. It labels every value by who or what produced it, holds back anything it cannot check,
and stops before any application or message. The person makes each decision, with a written reason. Passing its
experience check never means meeting the whole job description, and a company's sponsorship history never means it
will sponsor this person.

**Why this is DRAFT although it runs.** The run path is built and tested, and it runs on sample data and live
postings. Eight proposed additions are still open, each marked below, and the engine's constitution allows a recipe
past DRAFT only when no proposal is open. The status says exactly that, and nothing more.

Two customers: this file is for the agent. `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.card.md` is for the person.

**Handoff condition (done when).** A run is complete when all of these hold. "The report looks right" is not the
condition; these invariants are.
- `tailor_or_ask.py` exits 0.
- `run-log.json` and `report.md` exist in the run folder.
- Every posting in the queue appears in the log exactly once, with exactly one suggestion.
- `roles.json` holds only postings that cleared every gate. Each has numeric `liveness` and `timeline` factors and
  a `source` label on every term.
- When anything was scored, the scorer's `role-scores.json` reports `profile_needs_sponsorship: true`.

## Required reads

1. `SNICKERDOODLE.md` (gates, provenance, lifecycle), then `DOMAIN.md` (layout and known gaps).
2. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md`. The file this mode reads has 30,369
   rows, and only 1,557 of them carry H-1B fields. The join's error rate cannot be measured locally.
3. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md`, `book/chapters/10-the-visa-timeline-manager.md`
   and `book/chapters/11-the-bayesian-role-scorer.md`.
4. This recipe, its card, the adopted rules
   (`scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json`), and the review record behind them
   (`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/RULES-REVIEW.md`).

## The situation, precisely

- **Status:** F-1, needs future H-1B sponsorship. The persona states `needs_sponsorship: true`, because free-text
  visa status is not trusted: the scorer reads "work authorized" as "no sponsorship needed".
- **Target:** early-career ML/AI engineering roles, at the point of deciding whether one posting deserves the hours
  a tailored application takes.
- **What makes it different from "new grad":** prior production ML work. Two things follow:
  - a level II / L2 sponsored title is relevant evidence, not a mismatch;
  - a stated experience minimum is a real question, because co-op time, assistantships and part-time work may or
    may not count.
- **Privacy boundary, set by the person:** public runs use a fictional applicant; dates, the real résumé and
  application notes stay private. A private run reads the person's own files and writes only under `private/`.
- **The fictional applicants:**
  - the live run uses Kavya Raman (`search/examples/kavya-raman/`, added with this mode). She has 24 months of
    full-time production ML before her master's, a 6-month co-op and a 5-month research assistantship, and one
    résumé file is her only source;
  - the sample keeps the repo's Priya Nair, whose résumé file lists one 8-month co-op, to exercise the gap paths.

## Purpose and source inventory

**Purpose.** Use this mode at two moments. First, when the person wants to know which postings at their target
companies deserve a look at all: `discover.py` reads the boards and audits the list. Second, when an ML/AI engineering
posting looks promising and the person has to decide
whether it deserves the application hours of the engine's daily 3-3-2 split. That split is 3 hours of networking, 3
of building portfolio proof and 2 of applications (finding, scoring and sending them)
(`archive/Projects/the-reallocation-engine-plain-summary.md`). For that one posting, the mode:
- runs every check it has;
- labels each value by who or what produced it;
- suggests TAILOR, ASK FIRST (with the exact question), MOVE ON or HOLD.

It is not a job search, an eligibility check or a sponsorship prediction.

| Source | Path or command | Used for | Label |
|---|---|---|---|
| Sponsorship file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, pinned at SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` | company match, approvals, denials, top sponsored titles | record |
| Its audit | `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` | records the same SHA-256 | — |
| Name normaliser | `scripts/sec/entity-resolution.py` (`normalize_company_name`) | exact-name company match | record |
| Liveness classifier | `scripts/ats/liveness-core.mjs` (`classifyLiveness`), `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) | is the posting open | record |
| Posting text | `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py` (`fetch_board`: allow-listed, no redirects) | the posting's own requirement lines (Greenhouse only) | record |
| Scorer | `scripts/score/role-scorer.mjs` through its CLI, never re-implemented | Apply / Consider / Skip | computed |
| The mode | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py` | gates, checks, suggestion, both outputs | — |
| Discovery | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py`, through greenhouse-watch's `board_url` and `fetch_board` | a target list's board listings, the drop counts, the per-company sponsorship audit, and a queue | record (titles, URLs) · rules' label (what was kept) |
| Computed timeline | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/timeline.py` (book chapter 10) | the timeline factor from the persona's dates and a declared time-to-start, with every date shown | your-input once the person declared the weeks and adopted the formula |
| Target list | `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json` | the fictional Kavya Raman's 12 target companies, chosen by the student; legal names listed by Claude Code | your-input (list) · model-judgment (legal names) |
| Input guard | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py` | refuses scorer input the scorer would quietly accept | — |
| Requirements | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/requirements.py` | required vs preferred lines; experience minimums vs documented work | rules' label |
| Reused checks | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/evidence.py`, `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/node_bridge.mjs` | from Assignment 3 ("A3", the student's Recipe Design submission: `contrib/2026fa-sukethrp-ml-newgrad-sponsor-match` @ `95d4982`); every change is named in its docstring | — |
| Rules | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` v0.2.0 | title, tier and requirement-reading rules, adopted by the student on 2026-10-19 | your-input |
| Live-run persona | `search/examples/kavya-raman/profile.yml`, `search/examples/kavya-raman/resume.example.json` | fictional applicant this mode is for: needs sponsorship, prior full-time production ML (added with this mode) | record |
| Sample persona | `search/examples/priya-nair/profile.yml`, `search/examples/priya-nair/resume.example.json` | the repo's fictional applicant: needs sponsorship, one co-op | record |

**Facts that bite, and how this mode handles each:**
- **The scorer fails open.** A missing or text-valued gate counts as ×1 (`role-scorer.mjs:83–84`), so an unchecked
  posting can come out Apply. The guard refuses such input.
- **No-fit input looks like a bad posting.** The scorer drops a missing fit vote, which reads as fit 0. A missing
  fit is HOLD.
- **The authorization regex misreads.** "authorized" in free text reads as "no sponsorship needed"
  (`role-scorer.mjs:60`). The mode never passes a profile, so the scorer assumes sponsorship is needed.
- **The scraper is empty.** `fetch-postings` leaves `description_text` empty. The mode reads posting text through
  greenhouse-watch's fetcher instead.
- **Role quality weighs nothing.** `role_quality` has weight 0, so the mode doesn't use it, and the guard refuses it.
- **Only samples ship.** Form D and the full SEC data are not used.

## Phase gates

Every gate runs on every posting, so the report shows everything that was verified. A failed gate never yields a
guessed value. The gates are numbered G0–G11 in the order they run, and the reports and logs use these numbers. G0
runs only in discovery.

| Gate | Test | Pass | Fail | Proven by (tests/) |
|---|---|---|---|---|
| G0 targets and discovery | the target list validates (who chose it, who listed the legal names, a time-to-start with its declarer and reason, any identity decision made by a named person); a board is read only through the allow-listed fetcher; every listing is kept or counted by the reason it was dropped; the kept postings per company are a sample (the newest matches up to the cap), never "the best"; FDE, abuse-research, level II and level III-or-above titles are kept and flagged for review; new-grad postings are flagged for their window, experience cap and cohort date | queue for the mode (each posting carries the company's identity decision), and the audit | STOP, exit 2, on an invalid list or a board read while the network is forbidden; an unreadable board is reported, never skipped | `test_discover.py` (filters, the cap, the audit, the queue, no network) |
| G1 input | the queue validates; the persona states `needs_sponsorship: true`; every declared value names `by` (`student` or `claude-code`); identity decisions and choices name the person by handle (for example `sukethrp`), never claude-code | continue | STOP, exit 2 | `test_a_value_without_its_declarer_is_refused_at_the_input_gate` |
| G2 source | the sponsorship file's SHA-256 equals the pin | continue | STOP, exit 2 | `test_a_changed_sponsorship_file_stops_at_the_source_gate` |
| G3 company identity | the person's recorded `company_identity` decides when present: **confirmed** (row, what was checked, sources, anything still unverified) or **candidate** (not cleared). Otherwise, exactly one exact normalised match, or a `csv_row` picked in the queue. Such a match is used, but it is labelled `computed` (a name match) or with the queue's label, never `record`, and every reason and question names the matched row and says no person confirmed it. An identity is never confirmed by claude-code | sponsorship check | HOLD (`identity-unconfirmed`, even when the name matches exactly; `no-company-match`; `ambiguous-company-match`) | `test_a_confirmed_identity_is_the_persons_decision_with_its_evidence`, `test_a_candidate_identity_holds_even_when_the_name_matches_exactly`, `test_an_identity_cannot_be_confirmed_by_claude`, `test_an_ambiguous_company_holds_the_posting`, `test_a_name_match_is_computed_never_a_record`, `test_the_meta_question_does_not_say_meta_has_no_history`, `test_a_confirmed_identity_keeps_the_plain_wording` |
| G4 sponsorship record | the row has a usable H-1B record, not shared value for value with a differently named company (unless the person vouched with `shared_record_checked`) | tier and p | no record: unknown, so ASK FIRST, and the verified-vs-inferred table says "none in the file … unknown, not 'no'"; zero approvals, unreadable titles or a shared record: HOLD | `test_no_h1b_record_asks_the_sponsorship_question`, `test_the_pathai_lookalike_record_is_still_shared`, `test_a_missing_h1b_record_is_shown_in_the_table`, `test_a_stretch_with_no_h1b_record_also_asks_about_sponsorship` |
| G5 liveness | the classifier on a saved page (sample) or a live check (`--live`), no older than 7 days. A posting discover.py found is checked against its board's own job API instead, because many companies serve their Greenhouse board from their own site | active (an apply control was detected); for a discovered posting, board/API availability at the time checked: listed, and returned by the same posting's job endpoint. Neither shows the application process works | expired (or a 404 from the job API): MOVE ON; uncertain, browser failure, unlisted host, off-host redirect, stale: HOLD | `test_a_closed_posting_is_move_on`, `test_a_browser_that_fails_to_launch_holds_the_posting`, `test_board_api_liveness_titles_from_the_board_and_a_shortlist`, `test_a_job_the_board_no_longer_lists_moves_on` |
| G5a location (discovered postings) | discover.py placed the listing in the US, or a person recorded `location_checked` (country, work arrangement, relocation expectations) | continue | unclear and unchecked: HOLD `location-unclear`; checked as outside the US: MOVE ON | `test_an_unclear_location_holds_until_a_person_checks_it` |
| G6 posting text | saved text (sample) or the Greenhouse API (live) can be read | requirements check | HOLD (`posting-text-unavailable`, `posting-text-fetch-failed`) | `test_a_posting_without_text_is_held` |
| G7 timeline | a factor in 0–1 with a reason, declared by a named declarer; or `compute`: the factor from the persona's dates and a declared time-to-start (`timeline.py`), with every date shown | continue | missing, withheld, left unset with a reason, or a persona without the dates the computation needs: HOLD. A factor of 0 is MOVE ON | `test_withheld_dates_hold_the_posting`, `test_fit_and_timeline_left_unset_with_a_reason_hold`, `test_timeline.py`, `test_a_timeline_of_zero_moves_on_before_any_hold`, `test_the_computed_timeline_is_your_input_only_once_the_rules_are_adopted` |
| G8 fit | the person's own number in 0–1 with a reason | continue | missing, or left unset with a reason: HOLD. A high fit never clears another gate | `test_a_missing_fit_holds_instead_of_counting_as_zero`, `test_a_high_fit_never_clears_an_unresolved_gate`, `test_fit_and_timeline_left_unset_with_a_reason_hold` |
| G9 guard | `guard.py` finds no missing or text-valued gate, no `p` outside 0–1, no unknown label, no misspelt field | send to the scorer | the whole run is REFUSED, exit 3; nothing is scored | `test_the_guard_stops_the_whole_run_when_a_rule_writes_p_as_text` |
| G10 scorer contract | the scorer exits 0, returns every role, keeps every label, and reports `profile_needs_sponsorship: true` | suggestion | the run is VOID, exit 1 | `contract_problems` in `evidence.py` |
| G11 human decision | a named person records a choice (TAILOR / ASK FIRST / MOVE ON / HOLD), a reason and a date in the queue | logged next to the suggestion | no decision: the gate stays open. A decision by claude-code is refused | `test_a_decision_must_be_made_by_a_named_person_with_a_reason` |

## Workflow

Run everything from the repo root.

0. **Discover, then judge** (network: one board listing per readable company, then the live run below):
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py --targets <targets.json> --out-dir <dir>`
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue <dir>/queue.json --out-dir <dir>/judged`
   - The v0.2.0 worked run uses `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json`.
   - Both commands use the person's local date as the run date. The computed timeline is shown with its dates and
     the weeks assumed.
   - The person then states a fit, with a reason, for the shortlisted postings they want judged, records a
     `location_checked` for any posting held on its location, and runs the second command again.
1. **Sample run** (offline; illustrative postings at real companies; the fictional persona):
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py`
   - Expected on the pinned file: TAILOR 1 · ASK FIRST 4 · MOVE ON 2 · HOLD 3, with 4 postings scored.
   - Outputs go to `output/sukethrp-ml-tailor-or-ask/2026-09-30-sample/`. The date is the sample queue's `as_of`, the
     day its saved pages describe, not the day it runs.
2. **Live run** (network: one first-hop request and one Playwright page load per posting, plus one Greenhouse API
   read):
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue <queue.json> --out-dir <dir>`
   - The v0.1.2 worked run uses `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live-v0.1.2/queue.json`,
     a copy of the v0.1.1 queue with the student's identity decisions, the student's fit and timeline words, and
     the Kavya Raman persona.
   - The person resolves each HOLD, re-runs, and records each decision:
     - record the identity in `company_identity`: confirmed, with what was checked and the sources, or kept as a
       candidate;
     - state fit and timeline with reasons, or leave them unset with the reason when the facts to justify them are
       missing.
3. **Private run** on the person's own profile and résumé (both gitignored), with every output forced under `private/`:
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --private --persona search/profile.yml --resume search/resume.json --queue private/<queue.json> --out-dir private/<run>`
4. **The guard on its own**, as a break demonstration against the engine's own scorer:
   `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json`
5. **Tests:** `python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v`

## How the suggestion is chosen

The first rule that applies wins. Since v0.2.0, records decide first (the student's call): what no fit value could
change is settled before any hold.
1. The posting is closed → **MOVE ON**.
2. A person's location check says outside the US → **MOVE ON** (the US-only filter).
3. The timeline factor is 0 (the expected start is after the latest start) → **MOVE ON**.
4. A required minimum is out of reach even counting every documented month, and its own sentence states a firm
   restriction with no negation before it → **MOVE ON**.
5. Any gate is unresolved (company, record, liveness, location, timeline, fit, posting text) → **HOLD**, naming each
   one. When only fit is unresolved, the posting is on the **shortlist**, ranked by sponsorship evidence (Proven,
   Likely, no record), then months short, then the timeline factor. The shortlist table also shows each posting's
   category, its required lines not checked, the expected start with the weeks assumed, and its review flags, so
   unresolved requirements stay visible.
6. A required experience minimum is out of reach even counting every documented month, and not stated as firm →
   **ASK FIRST**, with the person's own question: *"Is '5+ years' a firm minimum, or would you consider someone with
   fewer years who has relevant production ML experience?"* The closest postings are listed first. When the file also
   has no H-1B history for the row, the sponsorship question comes right after it.
7. No H-1B history in the file → **ASK FIRST** with the sponsorship question. Unknown is not "no". When no person
   confirmed the row, the reason names it and says it may be a different company, and the question asks only whether
   the employer sponsors this role.
8. The scorer, on the guarded input:
   - Skip → **MOVE ON**;
   - Apply → **TAILOR**, unless a required line is still open (an alternative path, co-op acceptance, supporting
     information or full-time status), which makes it **ASK FIRST**;
   - Consider → **ASK FIRST**, with the question for the soft spot: marked-only titles, titles needing context, a
     thin record, no ML title, or a tight timeline.

Lines the mode could not place in a section are flagged in the report and in the posting's next step. They do not
change the suggestion (adopted reading 2).

## What it can and cannot verify

**It can verify, from records, on the run date:**
- whether the posting page showed an apply control (that, and nothing more);
- which row of the sponsorship file the company matched, with its legal name and city printed beside every suggestion, or
  the person's recorded identity decision, with what they checked and their sources. A match no person confirmed is
  labelled `computed` and called a name match;
- that row's H-1B approvals and denials, which are company-wide, and its short list of top sponsored titles;
- which of those titles count as evidence under the adopted rules, with each exact title shown;
- what the posting's text says, word for word, saved with its SHA-256 in live mode: which lines sit under required,
  preferred or work-condition headings, and what experience figures they state;
- the duration of the persona's documented work, by type, counting overlapping months once;
- in discovery, what each readable board listed on the run date (titles, locations, update times, job IDs), which
  postings the declared filters kept, and why each other listing was dropped;
- for a discovered posting, its board/API availability at the time checked: listed, and returned by the same
  posting's job endpoint;
- the timeline factor's arithmetic, with every date behind it.

**It cannot verify:**
- **Sponsorship now:** whether this employer will sponsor this person for this role. History is not policy.
- **The meaning of 0.9 and 0.6:** they are declared screening assumptions kept for consistency with the scorer,
  not chances of sponsorship.
- **When a title was sponsored, or at what level:** the file has no filing years. A counted title proves nothing
  about the hire's level, and nothing about whether the person qualifies.
- **The file's coverage:** H-1B fields on about 5% of rows, six states, titles only, no SOC codes.
- **Company identity beyond an exact name.** In the sample, the posting's "Meta" matches row 16612, META CO of
  Portola Valley, CA; the file has no Meta Platforms row. Even an exact match can be the wrong company: in the live
  run, "Orenda" matches ORENDA INC exactly, but the file's orenda.io leads to a domain-for-sale page while the
  employer uses orendapower.com. The mode prints every match. A person can confirm a row or keep it as a candidate,
  but the mode cannot settle identity itself.
- **The kind of experience a line asks for** ("in ML infra, research engineering, or systems programming"). It is
  shown and never checked. A duration does not prove the months were that kind of work.
- **Employment type and hours:** no job is assumed full-time. Research or teaching assistantships, contract,
  fellowship and part-time work need supporting information before they count.
- **Whether co-op or internship time counts,** unless the posting says so. That becomes the question to ask.
- **Every requirement line other than experience minimums:** degree, skills, tools, sponsorship statements and
  new-grad windows are listed for the person to read. A degree named beside a duration is marked not checked, and
  being enrolled is never treated as holding the degree.
- **Work conditions** (on-site days, location): listed separately, awaiting the person's review.
- **Whether the résumé file is complete.** The sample persona's résumé file lists one 8-month co-op, while her CV
  also lists 8 months of full-time ML work. The mode counts only the file. The live-run persona has a single file, so
  this mismatch cannot occur there.
- **Anything legal** (OPT, STEM OPT, cap-gap). That is a question for the school's DSO or an attorney.
- **Postings on careers sites it cannot read.** This version reads Greenhouse boards only. Of the student's own five
  large targets (Google, Amazon, Apple, Netflix, Meta), none is readable, and the file holds no H-1B history for any
  of them: Google only as an ALPHABET INC row with no H-1B fields, Meta only as a FACEBOOK INC row with no H-1B fields
  (plus the META CO namesake), and Amazon, Apple and Netflix not at all. They remain part of the search: the audit
  lists them for a manual check instead of skipping them.
- **Whether a legal name listed for a target is its H-1B petitioner.** Claude Code listed them; a person confirms.
- **Whether applying works.** Board/API availability does not establish that the application process works.
- **A company's best matches.** The cap keeps a sample, the newest matching postings, and counts the rest unchecked.
- **A new-grad posting's graduation window, professional-experience cap and cohort date.** They are flagged for the
  person; checking them is typed proposal 5. A year in a title does not establish the start date.
- **How long a company's hiring takes.** The time-to-start is the person's declared estimate. The computed factor is
  a planning multiplier (chapter 10's own limit), not a forecast or legal advice.

## Output contract

Two readers, two files. One artifact cannot serve both (P5).

**For agents: `run-log.json`.** It holds:
- `workflow`, `recipe`, `recipe_version`, `run_id`, `status` (complete / refused / void), `mode`, `as_of`,
  `generated_at`, and the legend of `labels`;
- `inputs`: the queue path, SHA-256 and `chosen_by`; the persona and résumé paths (or "private (not recorded)");
  the rules path, version, SHA-256, declarer and label;
- `source`: the CSV path, SHA-256, `pinned`, `rows` and `columns_read`, which never include phone or officer columns;
- `liveness_run`, `posting_text_run` (the API URL, the saved file and its SHA-256 for each posting), `guard`, and
  `scorer` (its exact command, exit code and output);
- `postings[]`, each with `checks` (company, sponsorship, liveness, timeline, fit, requirements), every value as
  `{value, source, …provenance}`, then `suggestion` (choice, why, questions, next, short_by_months), any `scorer`
  result, and any human `decision`;
- `summary`, `outputs` and `cannot_verify`.

**For people: `report.md`.** In order:
- an executive summary;
- what to do next, grouped by suggestion, with the questions to ask (closest stretch first), and, among the holds, a
  ranked shortlist table of postings waiting only for the person's fit call;
- for each posting, a verified-vs-inferred table (value · what it says · label · where from) and a requirements
  table (section · line · checked · kind asked, not checked · result);
- what the run cannot verify;
- the run record.

Alongside them: `roles.json` (exactly what the guard passed to the scorer), the scorer's own `role-scores.json` and
`role-scores.md`, and in live mode `postings/<id>.json`. Captured command output writes the local home folder as `~`, because
the log is meant for a public repo.

**Discovery (`discover.py`) writes two more, one per reader:** `discovery-log.json` (the boards read with each
listing's SHA-256, the per-company counts by reason, the file rows, and the labels) and `target-audit.md` (an executive
summary, one row per company with its board and what the sponsorship file holds, a table of why postings were dropped,
what the audit cannot verify, and the run record). Its company table has an identity column and says the checked
postings are a sample; unreadable careers sites are listed under "Check by hand".) It also writes `queue.json` for the mode and `boards/<slug>.json`,
the raw listings, which are not committed.

## Next action per result: where the 3-3-2 hours go

| Suggestion | Where the time goes |
|---|---|
| TAILOR | the two research-and-apply hours: tailor, after reading every unchecked required line. Refresh the liveness check on the day of applying, and confirm sponsorship with the recruiter early |
| ASK FIRST | the three networking hours: carry the quoted question to a recruiter or someone on the team before spending tailoring time. Stretch postings come after closer ones |
| MOVE ON | none. Reallocate the time; a person who knows the minimum is soft can override with a reason |
| HOLD | resolve the named check first (pick the company row, open the board, state fit or timeline, or read the posting) |

## Stop conditions

The mode refuses rather than guesses:
- the queue or persona fails G1;
- the source pin fails (G2);
- the guard finds input the scorer would quietly accept (G9);
- the scorer breaks its contract (G10);
- an identity or a decision is attributed to claude-code;
- `--private` is used with an output folder outside `private/`, checked before any private file is read;
- a network call is attempted while `TAILOR_OR_ASK_FORBID_NETWORK` is set;
- in discovery, an invalid target list (G0), or a targets file under `private/` with an output folder outside it.

Per posting, it never invents any of these:
- a company row, a sponsorship tier for a missing record, or a liveness result;
- a timeline or a fit (a computed timeline needs every date it uses; a missing one is a HOLD);
- a requirement path where a line offers several.

## Rules (v0.3.0, adopted by the student)

**Status:** rules 0.3.0 add two sections, `discovery` and `timeline`, drafted by Claude Code from the student's
choices. The student adopted them on 2026-10-19 "with the proposed changes" (their words are in `rules.json`
`declared_by.adopted.words`). Claude Code applied those changes before recording the adoption:
- new-grad software engineering is kept, in its own category; the categories stay separate;
- FDE, abuse-research and level II titles are kept for review, and level III or above is reviewed in the company's
  context, not rejected;
- unclear locations are kept, flagged and unresolved until checked;
- discovered-posting liveness means board/API availability at the time checked, not that applying works;
- the timeline formula is shown with its dates and the hiring-time assumption;
- the shortlist order is sponsorship, then months short, then timing, with unresolved requirements visible;
- the cap is a sample;
- the five unreadable large employers stay in the search for a manual check.
Every 0.2.0 pattern is unchanged.

The student reviewed the drafted 0.2.0 rules against hard examples and adopted the built version on 2026-10-19. R1–R8
are the student's rule calls from that review, recorded in
`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/RULES-REVIEW.md`. The patterns are in
`scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json`, each with its reason.
- **R1:** level II / L2 titles count as sponsorship evidence, with the exact title shown. On the real file this moves
  6 companies to Proven (33 in all).
- **R2:** clear senior and management words stay out of the evidence. Lead, Founding, Architect and Fellow need
  context: they are neither counted nor treated as senior.
- **R3:** Proven 0.9, Likely 0.6, and at least 10 approvals for Proven. These are declared screening assumptions, and
  approvals are company-wide.
- **R4:** explicit headings only. Work Environment, Location and similar headings give work conditions, listed
  separately. An unknown heading inside a section is flagged, never folded into that section.
- **R5:** an experience line with alternative paths is quoted whole and left unresolved. No smallest or largest
  figure is chosen.
- **R6:** work is counted by type. Co-op time counts only when the posting accepts it, and a full-time line is met
  only by months stated as full-time. Overlaps count once, and projects never count.
- **R7:** MOVE ON only when a firm restriction is documented in the line's own sentence, not negated, and every
  documented month still falls short.
- **R8:** checks older than 7 days are stale; only the listed hosts are checked; a failure is HOLD, never "closed".

## Labels

- `record`: read from a repo record or a live check.
- `your-input`: declared by the student, including every value derived through the adopted rules, and a computed
  timeline whose weeks the student declared under an adopted formula.
- `model-judgment`: proposed by Claude Code, including every value in the sample queue.
- `computed`: produced by a script from labelled inputs. That covers the scorer's arithmetic and a company name
  match; neither is a fact about the world.
- "not checked": a posting line shown for the person to read, which the mode did not check. It is a result, not a
  label.

A declared value carries `by: student` or `by: claude-code`, and its label follows from that, never from a
default. This fixes A3's labelling defect, where Claude's proposed numbers were labelled as the student's own input.

## Proposed additions

Each line below is typed and open. Together they are why the status is DRAFT.

| # | Typed proposal | Why it belongs | Closed when |
|---|---|---|---|
| 1 | [TODO: DEV] degree check: does the documented education hold the degree a line names? | R5 leaves degree paths unresolved; many required lines pair a degree with a duration ("B.S. and 3+ years") | the script exists, reads `education` with completion status, treats "in progress" as not held, and has tests |
| 2 | [TODO: DEV] skills and tools match against documented work | most required lines are skills ("Expertise in Python, PyTorch or Jax"), all listed as not checked today | the script exists, matches only named tools by declared patterns, and labels anything beyond them model-judgment |
| 3 | [TODO: DEV] kind-of-experience check: were the counted months the kind of work a line asks for? | the student's own prediction: a duration does not prove the months were ML engineering, forecasting or research | a declared, reviewed rule set exists; any model help is labelled model-judgment; the person adopts it |
| 4 | [TODO: DEV] sponsorship statements in the posting's own text ("unable to sponsor", "sponsorship available") | the posting's statement is current, unlike the file's undated history | the script exists, reads both directions, and has negation tests (the R7 lesson) |
| 5 | [TODO: DEV] experience ceilings and new-grad windows ("up to 2 years", "recent graduates") | today they are only kept from being misread as minimums; for someone with prior experience, a ceiling is the real gate | the script exists and reports ceilings separately, with tests |
| 6 | [TODO: DEV] Lever, Ashby, SmartRecruiters and Workday readers, for posting text and for discovery | live mode and discovery read Greenhouse only, so other boards HOLD on `posting-text-unavailable` or are reported as not readable | allow-listed, no-redirect readers exist with offline fixtures, and discovery uses them |
| 7 | [TODO: DEV] company-identity aliases beyond exact names (Goodfire → GOODFIRE AI INC; Meta → META CO) | the commonest HOLD, and a namesake match is the most dangerous error here | a reviewed alias table exists; every alias is a person's decision, logged |
| 8 | **Closed in v0.2.0** (DEV, closed by Claude Code, as the constitution allows for DEV items): timeline computed from declared dates | a person had to state the factor or the posting held | the handoff condition is met by `timeline.py`, `tests/test_timeline.py` and conformance. In a `--private` run the dates come from the private profile and every output stays under `private/`. Public runs use the fictional persona's dates. The formula is the student's to adopt in rules 0.3.0 |
| 9 | [TODO: DATA SOURCE] DOL LCA disclosure records: per-title, per-year employer filings | they would replace company-wide approvals and undated title lists with dated, title-level evidence, and cover the employers the file misses. The v0.2.0 audit found none of Google, Amazon, Apple, Netflix and Meta with an H-1B record in it | the file exists at a named path, with a one-line provenance note (origin, date) and an audit |

## Lifecycle

- **DRAFT** now. Eight proposals are open, and the constitution's DRAFT → SPECIFIED transition needs zero.
- **SPECIFIED** needs all eight closed, each with its evidence.
- **RUNNABLE-SAMPLE** comes after SPECIFIED: a full sample run, conformance, and audits read by a person.
- **The live run is evidence, not a status claim.** A live run, with the person clearing each gate and the decisions
  logged in `logs/runs/`, is collected and logged, but it does not move the status. When it is logged, `last_gate`
  names who cleared which gate, and when.
- **Not claimed:** RUNNABLE-LIVE or VERIFIED. `attestation` stays null.
- **Editorial revision, 2026-10-19 (after run 4).** Three changes:
  - the gate table now documents `company_identity` and fields left unset with a reason, which the code supported
    before both logged runs;
  - `last_gate` names the student's live-run gate decisions;
  - one output line records the home-folder scrub. That scrub was added between the live run (07:22 EDT) and the
    sample run (07:56 EDT) and changed no gate or result.

  So `recipe_version` stayed 0.1.0, matching both logged runs.
- **Version 0.1.1, 2026-10-19 (after run 4 and the first attestation).** Three changes:
  - a company match no person confirmed is labelled `computed`, and its reasons and questions name the row (the
    student's call). Before this, the sample run had the person say the data had "no sponsorship history for Meta"
    while the only row was a namesake;
  - the `contract_problems` fix, made after run 4: a scorer role without its trace voids the run instead of
    crashing;
  - two test-only changes, and the Kavya Raman persona.

  v0.1.0 ran logs 3 and 4, which stay as history. The student's v0.1.1 runs (15:31 EDT) are log 5, also kept as
  history.
- **Version 0.1.2, 2026-10-19 (after reading the v0.1.1 reports).** Four fixes, chosen by the student:
  - with no H-1B record, the verified-vs-inferred table now says so;
  - a gap ASK FIRST keeps the sponsorship question when the file has no H-1B history (v0.1.1 dropped it);
  - "1 month", not "1 months";
  - the "cannot verify" list no longer describes one persona's CV in every report.

  The student's v0.1.2 runs are log 6, kept as history.
- **Version 0.2.0, 2026-10-19 (discover, audit and triage).** Built from the student's request for a mode that
  "actually fetches" postings at the companies they want, with sponsorship. The new pieces:
  - `discover.py` and the target audit;
  - the computed timeline, closing proposal 8;
  - records decide first, and a ranked shortlist;
  - board-API liveness for discovered postings;
  - rules 0.3.0, drafted and awaiting the student's adoption.
  Proposals 6 and 9 were widened, not duplicated, so 8 are open. Before its first logged run, v0.2.0 was amended to the
  student's adoption of rules 0.3.0 and their identity and timing decisions. The student's v0.2.0 runs are log 7,
  and the attestation is signed for v0.2.0.

## Verification checks

- Tests (all offline; every run sets `TAILOR_OR_ASK_FORBID_NETWORK=1`):
  `python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v`. They include
  `test_recipe.py`, which checks this file: the TODO count, the status, the version, the executive summary, and
  that every named path exists.
- Conformance: `node scripts/conformance.mjs recipes/cases/2026fa/ scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/`,
  then `npm run verify`.
- By hand:
  - pick any `record` value in a report, open the named row of the sponsorship file, and compare the approvals and
    the titles;
  - in live mode, compare a requirement line with the saved `postings/<id>.json` whose SHA-256 the log names. The
    submission folder does not ship these third-party texts; the posting's public page or its Greenhouse API gives
    the text.
- Break attempts, each expected to stop, hold or refuse, never to guess:
  - the `BROKEN-*` fixtures (a missing gate, a text gate, `p` = 5, unknown labels) against the guard and against the
    engine's scorer;
  - a wrong source pin;
  - a real profile without `--private`;
  - "not a firm minimum" vs "a firm requirement";
  - a browser that fails to launch;
  - an identity or a decision attributed to claude-code.

## Logging rules and run-log template

Log every real run in `logs/runs/2026fa-sukethrp-<n>.md`; this mode starts at 3. Never edit `logs/RUN_LOG.md`: the
Fall 2026 contribution rules and their CI fail a student PR that edits it. The assignment allows the entry to be
included in the submission instead, so a copy is in the submission folder.
Never log `private/`, dates, contact details or application notes.

```markdown
# 2026fa-sukethrp-<n> — ml-tailor-or-ask run

## Executive summary
<two or three plain sentences: what was run, on what, what it suggested, what a person decided or still has to decide>

## Run record
- **Date / run id:** YYYY-MM-DD · <run_id from run-log.json>
- **Recipe:** recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md v<recipe_version> · rules v<rules_version> (declared by <who>)
- **Mode:** sample | live · **as_of:** YYYY-MM-DD
- **Code:** commit <short sha> (`git rev-parse --short HEAD`), recipe v<recipe_version>
- **Inputs:** queue <path> (sha256 <12 chars>, chosen by <who>) · persona <fictional persona path> · sponsorship file sha256 <hash> (pinned: yes/no)
- **Command:** <exact command>
- **Outputs:** <run folder>/report.md, run-log.json, roles.json, role-scores.json, role-scores.md, postings/ (live)
- **Result:** evaluated N · TAILOR t · ASK FIRST a · MOVE ON m · HOLD h · scored s
- **Gates cleared by a person:** <gate, posting, what was checked, by whom, when>
- **Decisions:** <posting: choice, reason, by, date>
- **Open issues:** <holds still unresolved; anything that did not work>
```
