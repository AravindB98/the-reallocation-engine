---
status: DRAFT
todos_open: 5
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# PM/APM live-posting and sponsor-record gate

## Executive summary

This mode helps an international graduate who is counting down their allowed unemployment days decide which product manager postings deserve an application. Before any posting is scored, it checks two things: whether the posting still appears to be open, and whether the employer appears in a public record of past visa sponsorship. A posting that fails a check is skipped, and a posting where a check cannot give a clear answer is put on hold for a person to look at instead of being guessed. It never says whether someone is eligible for, or will receive, sponsorship. It is a draft: the checks are designed and partly tried by hand, but the script that runs them end to end does not exist yet.

## Status note

DRAFT, not SPECIFIED. Moving to SPECIFIED needs zero open TODO items (SNICKERDOODLE.md:58). This file carries five typed TODOs below, using only the types defined at SNICKERDOODLE.md:77-83.

## Purpose

Use it when the person is on the OPT unemployment clock, is evaluating PM or APM postings, and needs H-1B sponsorship later. For each posting it returns one of: Consider or Skip (from the scorer), or HOLD with a reason (from this mode, before the scorer). Apply is not reachable under rule v0.1; see "Why no Apply" below. No real dates appear anywhere: the timeline is a single your-input number.

Persona: an international master's graduate on the OPT unemployment clock. All demo inputs are public postings that are not on the person's real application list.

## Lineage (relative to PR #16)

| Part | Reused or new |
|---|---|
| Suffix normalizer for company names (normalize.py:22, config.py:42) | reused; PR #16 kept a local copy; this mode will call the shared one once the DEV TODO is closed |
| Sponsorship rule v0.1 (tier and p table below) | reused unchanged |
| Scorer used through its CLI, profile `authorization` string | reused |
| Liveness gate with a per-host negative control | new |
| Four match states (MATCH / CANDIDATE / AMBIGUOUS / NOT_FOUND) | new; replaces exact-only matching |
| HOLD routing for unresolved gates | new |
| Refusal stop for eligibility questions | new |
| Timeline from dates (PR #16 timeline gate v0.1) | dropped; replaced by one your-input factor |

## Source Inventory

| Source | Path or command | Tag |
|---|---|---|
| Sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 records, 20 columns) | [run CP1-C] |
| Columns used | `company_name`, `Total Approvals`, `Total Denials`, `top_job_titles_sponsored` | [read mapped_student_employment_targets_v3.csv:1] |
| Name normalizer | `scripts/ats/scrapers/common/normalize.py:22`, suffix list `scripts/ats/scrapers/common/config.py:42-58` | [read normalize.py:22] |
| Liveness check | `npm run ats:liveness -- <url> <control-url>` | [run CP1-C] |
| Liveness classifier | `scripts/ats/liveness-core.mjs:39` (300-character floor), `:73-74` (insufficient content → expired) | [read liveness-core.mjs:73] |
| Render wait | `scripts/ats/liveness-browser.mjs:10-11` (15 s navigate, 2 s hydration) | [read liveness-browser.mjs:10] |
| Scorer | `npm run score -- <roles.json> --profile <p.json> --out-dir <dir>`; the CP1-C run used no `--profile` | [run CP1-C]; `--profile` [read role-scorer.mjs:163] |
| Scorer fields read | `role_id, company, title, sponsorship{p,tier,source}, fit{p,source}, role_quality{p}, liveness{factor,source}, timeline{factor,source}, override{decision,reason}` | [read role-scorer.mjs:68-136] |
| Run-log template | `recipes/_shared.md:105-112` | [read _shared.md:105] |

Liveness exit code: `ats:liveness` exits 1 when any URL is not active [read check-liveness.mjs:14, :59], so with a control in the same call a non-zero exit is expected. Gates read the per-URL verdict lines, not the exit code.

Scorer arithmetic [read role-scorer.mjs:76-84]: composite = (sponsorship p × 0.35 + fit p × 0.30 + role_quality p × 0) × liveness × timeline. A gate at or below 0.05 forces Skip (`:46`), composite ≥ 0.30 is Apply (`:44`), a Likely or Unknown tier or a timeline below 0.6 downgrades Apply to Consider (`:48`, `:101`). A missing liveness or timeline factor silently defaults to 1 (`:83-84`), which is why this mode never sends an unresolved gate to the scorer.

## Sponsorship rule v0.1 (carried from PR #16)

Applied only to a MATCH row or a human-confirmed CANDIDATE row. The constants are model-judgment; the facts they act on are records.

| Situation in the row (record) | Result | Tier | p |
|---|---|---|---|
| Total Approvals empty | HOLD: no_h1b_data | none | none |
| approvals ≥ 50 and an entry-level PM title listed | scored | Likely | 0.70 |
| approvals ≥ 50 and a PM-family title with no level marker | scored | Likely | 0.50 |
| approvals ≥ 50 and PM-family titles only at senior levels | scored | Likely | 0.30 |
| approvals below 50 and any PM-family title | scored | Likely | 0.20 |
| some approvals, no PM-family title | scored | Unknown | 0.15 |
| approvals zero, negative or non-numeric, or title list unreadable | HOLD: undefined_case | none | none |

**Why no Apply.** Rule v0.1 never assigns tier Proven [read this file's rule table], and the scorer downgrades Apply to Consider for a Likely or Unknown tier [read role-scorer.mjs:48]. [observed CP1-C: on the chapter's example roles, a Likely-tier row with composite 0.418, above the 0.30 Apply line, came back Consider.] This is intended: the CSV records employer-level filings and cannot show that this role, or this person, will be sponsored, so the mode never says Apply.

## Proposed additions

- [TODO: DATA SOURCE] Company-alias table (brand name → legal filing name, with provenance per row). Rationale: the CSV stores legal names, so brand names land in CANDIDATE and need a person every time.
- [TODO: DATA SOURCE] E-Verify participation data for the employer. Rationale: nothing local records it, and it may matter for a STEM OPT extension [assumed: general STEM OPT employer rule, not verified here; confirm with the school's international student office].
- [TODO: DEFINE] A pinned weight for the role-quality vote. Rationale: the scorer's `role_quality` weight is 0 and marked [VERIFY] (role-scorer.mjs:37), so the Cognitive Pivot role-quality signal is not claimed as a vote.
- [TODO: APPROVE] Upstream suggestion that "insufficient content" should report as uncertain, not expired. Rationale: CP1-C saw it on a real posting; this mode does not edit upstream files, so a maintainer decides.
- [TODO: DEV] Gate script in `scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/` that runs G0-G5 and writes both outputs. Rationale: G2-G5 name checks that no script performs yet.

## Phase gates

Gates run in order; a run-level stop condition ends the run, and an unresolved gate sends that posting to HOLD (see Stop conditions).

**G0 Inputs.** Timeline factor present, numeric, 0 ≤ x ≤ 1; CSV present and parseable; Chromium available.
Test: the CSV parses with Python's csv module and has every column listed above [observed CP1-C: 30369 records]; the liveness command starts without a browser-missing error [observed CP1-C]; the timeline value is checked by hand against 0 ≤ x ≤ 1, pass or STOP.

**G1 Liveness, per posting, with a negative control per host.**
- `active` = PASS → liveness 1.0 [record]
- `expired` with "insufficient content" = UNRESOLVED → a human opens the posting and records open (1.0 [your-input]) or closed (0.0 [your-input])
- any other `expired` = FAIL → liveness 0.0 [record]
- `uncertain` = UNRESOLVED → same human step
- negative control returns `active` = gate VOID for that host; every posting on it goes to HOLD
- the control is the same URL with the last 3 characters of the job-identifying path segment or query value changed; if no job id can be identified, the control cannot be built and the host is VOID

Test: `npm run ats:liveness -- <posting> <control>`; pass = posting `active` and control not `active`. [observed CP1-C: on host A the posting and its control both returned expired, insufficient content; hosts B and C returned active, with no control run.]

**G2 Sponsor record.** Normalize the posting's company name with normalize.py:22 and compare it with each normalized `company_name`.
- MATCH = exactly one row → apply rule v0.1
- CANDIDATE = no exact normalized match, but at least one row whose normalized name starts with the posting company's normalized first word (list up to 5) → a human confirms one row with a note; never scored until confirmed
- AMBIGUOUS = more than one row → HOLD (that posting)
- NOT_FOUND = no row; means "not in this dataset", never "does not sponsor" → HOLD

Only MATCH, or a confirmed CANDIDATE with a note, passes.
Test [proposed, not yet run]: the gate script prints one state per posting and the row count behind it; pass = MATCH, or CANDIDATE plus a recorded confirmation.

**G3 HOLD routing.** Any UNRESOLVED, VOID, CANDIDATE-unconfirmed, AMBIGUOUS, NOT_FOUND or rule-v0.1 HOLD posting gets HOLD plus its reason and is left out of the scorer input.
Test [proposed, not yet run]: every posting in the scorer input has explicit numeric `liveness.factor` and `timeline.factor`; pass = zero postings with a missing factor.

**G4 Scorer.** `npm run score -- <roles.json> --profile <p.json> --out-dir <private dir>`.
Test [proposed, not yet run]: exit code 0 and one scored row per non-HOLD posting.

**G5 Output contract.** Both outputs exist and match the contract below.
Test [proposed, not yet run]: the JSON log parses, every timestamp ends in Z, every value carries a source label, and the report's first heading is the executive summary.

**G6 Human review.** A named human reads the report next to the postings and records clearance (who, what, when) in the run log.
Test: the run-log entry names the reviewer and the date; no entry, no clearance.

## What it can and cannot verify

Can verify:
- Whether the liveness tool sees an Apply control on a posting page at check time [read liveness-core.mjs:63-66].
- Whether the posting's normalized name has exactly one row in this CSV [assumed: G2 not yet run].
- The approval and denial counts and listed titles in that row, as records [read the CSV header; row values not yet observed].
- That every decision traces term by term to record, model-judgment or your-input [read role-scorer.mjs:122-136].

Cannot verify:
- That a posting is really open: on host A the real posting and a made-up job id got the identical verdict [observed CP1-C] [your-input: opened in my browser on 2026-10-18, posting 1 was open while the tool said expired].
- That a posting is not a pipeline or evergreen requisition [assumed].
- That the employer will sponsor this person or this role: the CSV has no occupation-code column and its years are undocumented [observed CP1-B: header and docs search].
- That NOT_FOUND means no sponsorship: brand names miss legal names such as those with extra words before the suffix [observed CP1-C: 0 of 3 exact matches] [read config.py:42-58].
- E-Verify status [assumed: no local source].
- Hiring timelines [assumed].
- Visa outcomes or eligibility [assumed].
- One shared timeline number cannot rank postings; it only moves the threshold every posting faces [carried from PR #16].
- The v0.1 sponsorship constants are untested model-judgment [carried from PR #16].

## Output Contract

Agent log (JSON, for machines), written under `private/` by default:
- `run_id`, `recipe`, `recipe_version`, `generated_at` (UTC, ends in Z), `mode` (`sample` or `live`)
- `timeline`: `{ "factor": <number>, "source": "your-input" }`
- `postings[]`: `posting_ref` ("posting 1"), `host_ref` ("host A"), `liveness` `{ verdict, reason_code, control_verdict, state, factor, source }`, `sponsor` `{ state, rows_matched, approvals, denials, tier, p, source, rule: "v0.1" }`, `fit` `{ p, source }`, `decision`, `hold_reasons[]`
- `decision` is the scorer's word (Consider or Skip) or HOLD; Apply is not expected under rule v0.1
- `human_inputs[]`: `{ gate, posting_ref, value, source: "your-input", note, recorded_at }` (UTC, ends in Z), one per CANDIDATE confirmation or human-resolved liveness check
- `scorer`: `{ exit_code, output_path }`; `stops[]`
- Numbers are JSON numbers, never strings. Every value carries `source`: `record`, `model-judgment` or `your-input`.

Human report (Markdown, for the person) opens with `## Executive summary`, then one table row per posting. Decision is Consider, Skip or HOLD; Sponsor record shows the state plus approvals and denials:

| Posting | Host | Liveness | Sponsor record | Timeline | Decision | Why | Sources |
|---|---|---|---|---|---|---|---|

Raw URLs, company names and job ids stay in private inputs; anything committed uses posting and host references only.

## Stop conditions

(a) Ends the whole run:
- CSV missing, unparseable, or missing a required column.
- Chromium unavailable.
- Timeline missing, non-numeric, or outside 0 to 1.
- Scorer exits non-zero.
- Any generated artifact or private input would become git-tracked.

(b) Ends only the affected posting or host, which gets HOLD with the reason while the run continues:
- A void liveness control (every posting on that host).
- An AMBIGUOUS match (that posting).

(c) Refuse:
- Any request to say whether the person is eligible for, or will receive, sponsorship: refuse, and refer them to the school's international student office or an immigration attorney.

## Log template

Entry goes in `logs/runs/2026fa-shinde-pras-2.md`, never `logs/RUN_LOG.md` (CONTRIBUTING.md:13). Format from `recipes/_shared.md:105-112`:

```markdown
## YYYY-MM-DD — PM/APM live-sponsor gate run

- **Recipe:** shinde-pras-pm-apm-live-sponsor v0.1.0
- **Inputs:** postings 1-N (refs only), hosts A-N, timeline factor (your-input), CSV path
- **Outputs:** JSON log and Markdown report (paths under private/)
- **Result:** per posting: liveness state, sponsor state, decision
- **Open issues:** HOLD reasons, void controls, stops; reviewer name and date for G6
```
