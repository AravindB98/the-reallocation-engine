# CHANGE-BRIEF — Network Engineer roles, H-1B sponsorship history (SOC 15-1241)

## Executive summary

This brief is written before anything is built. It describes a planned recipe and a small prototype for one kind of job seeker: an international master's student on an F-1 visa who has not yet started OPT and wants Network Engineer jobs. For that student, the question that matters most is whether an employer has actually sponsored H-1B visas for network jobs before.

Read this to see which existing data the work will rely on, what it will add, where it stops for a person to decide, and how it is expected to fail.

What the data check already found: the sponsorship data in this repository records sponsorship per company, with a short list of job titles but no occupation codes and no count per title. So "sponsored network roles" can only be found by matching job-title text, and that text is unreliable. A bare "Engineer" title matched more companies than any network title did. None of the companies found so far appear in the sample funding filings that ship with the repository. The recipe will report missing data as missing and will not guess.

## Brief record

- Author: prpathak1 (with Claude Code as AI assistant; see `FRICTIONAL.md` for the split)
- Date: 2026-10-02
- Repo base: `main` @ `015843d`, branch `contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241`
- Status: predictions recorded before build. Later revisions are **appended** under "Revisions"; the original text is not rewritten.
- Source of the numbers below: a read-only data check run on 2026-10-02 (outside the repo); it will be re-run and its output pasted into the worked run.

## 1. Situation

**Who:** a fictional F-1 international master's student (persona with an `@example.com` address; no real data), stored in `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/` (`your-input`). OPT not yet started. Target role: **Network Engineer**, mapped to **SOC 15-1241 (Computer Network Architects)**. Nearby SOCs checked for context: 15-1244 (Network and Computer Systems Administrators), 15-1231 (Computer Network Support Specialists).

**Main signal:** H-1B sponsorship history at the company, restricted to companies whose sponsored job titles are network titles.

**Engine layers:**

| Layer | Use in this recipe | Role in the decision |
|---|---|---|
| 80 Days to Stay | company-level H-1B approvals/denials and `top_job_titles_sponsored` | sponsorship vote (scorer) + network-title filter |
| Job-Ops liveness | posting liveness result per role | gate |
| BLS/O\*NET | SOC 15-1241 row (title, wages, alternate-titles sample) | **context only** — not scored |
| SEC Form D (samples) | funding filing lookup | **context only** — reported outside the score |

Why BLS is context only: `scripts/score/role-scorer.mjs` sets `role_quality: 0.0` (line 37, tagged `[VERIFY]`), so a role-quality value would show in the trace but change nothing. `npm run bls:local-wage` is not used (it feeds no decision and fails on a fresh clone).

## 2. Reused data and scripts (paths checked to exist on 2026-10-02)

| Path | Tracked | What I reuse |
|---|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | yes | 30,369 rows, 20 columns; 1,557 rows have `Total Approvals` and `top_job_titles_sponsored`. No SOC column. |
| `data/bls/compact/soc_occupation_compact.csv` | yes | rows for `bls_soc_code` 15-1241 (`.00`, `.01`), 15-1244, 15-1231. File has CRLF line endings. |
| `data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json` (+ `2025q3`, `2025q4`, `2026q1`) | yes | 4 × 50 = 200 entries, 196 distinct `company_name_normalized`. Samples only — full quarters are not shipped. |
| `scripts/sec/entity-resolution.py` → `normalize_company_name()` | yes | the repo's company-name normalizer (same suffix list as `scripts/sec/sec-all-quarters.py`, which wrote the samples' normalized names). Imported, not copied. |
| `scripts/score/role-scorer.mjs` (`npm run score`) | yes | the composite scorer, run as a CLI with `--out-dir`. Not re-implemented. Has no exports, so the CLI + `role-scores.json` is the interface. |
| `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) | yes | live posting check (Playwright). Results: `active` / `expired` / `uncertain`. |
| `scripts/ats/liveness-core.mjs` → `classifyLiveness()` | yes | pure classifier (404/410 → `expired`), used in the offline test. |
| `data/examples/ch11-roles.json` | yes | shape of the `roles.json` my prototype writes. |
| `search/examples/` (4 personas) | yes | profile shape only (`visa.current_status`, `opt_end_date`, `unemployment_ceiling`, `needs_sponsorship`). My own fictional persona lives in my prototype's `fixtures/`, not here. |
| `recipes/scan.md`, `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md` | yes | recipe and card style. |
| `recipes/_shared.md` | yes | run-log entry template for `logs/runs/`. |
| `scripts/conformance.mjs`, `scripts/pii-scan.mjs` | yes | checks before PR. |

**Referenced in the repo but not present:** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (described in that folder's README; three audits sit beside it).

**My namespaces (to be created):** `recipes/cases/2026fa/`, `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/`, `logs/runs/2026fa-prpathak1-1.md`, `course/2026fa/submissions/prpathak1/`.

## 3. Proposed additions

| Addition | Type | Reason |
|---|---|---|
| Network-title keyword list | `your-input` | The CSV has no SOC field, so "network role" can only be found by matching title text. The data check found 9 distinct sponsored titles containing "network" across 8 companies — e.g. `Network Engineer`, `Sr. Network Architect`, `System and Network Administrator`, `Principal Software Engineer, Network Management Platform`. Which of these count as network roles is a human decision, so the list is labeled `your-input` and every match reports the exact title string that triggered it. **Rule (`your-input`):** case-insensitive; a title matches only if it contains `network` **and** one of `engineer`, `architect`, `administrator`, `admin`. A bare `Engineer` never matches. |
| Title → SOC crosswalk | `[TODO: DATA SOURCE]` | Exact matching against the BLS file's `alternate_titles_sample` sees only 8 of 44 (15-1241.00) and 8 of 33 (15-1241.01) alternate titles, and that sample includes the bare title "Engineer". Closed by either the full O\*NET alternate-titles file or the missing `SEC_DOL_H1b_data_mapped.csv`, at a named path with a provenance note. Until then, no output claims a SOC match. |
| Funding weight | `[TODO: DEV]` | The assignment lists funding as a vote, but `role-scorer.mjs` reads no funding term (an added `funding` term changed nothing in a probe). The scorer is not patched. Form D is reported **outside the score** as context, worded "no record in sample data" — never "not funded". The weight is proposed only, with justification, for a maintainer to decide. |

## 4. Gates

Every gate is a hard stop. A role that fails or cannot evaluate a gate is **not sent to the scorer**; it appears in the human report as "not scored", with the reason.

### G0 — Profile pre-check (before any scoring)
- **Why:** `role-scorer.mjs` line 60 decides `needsSponsor` with the regex `/citizen|permanent|green|gc|pr\b|no.?sponsor|authorized/` on `profile.authorization` only. A probe showed that `"F-1 OPT, authorized to work; will need H-1B sponsorship"` is read as *not* needing sponsorship, which sets the sponsorship weight to 0. The scorer does not read `needs_sponsorship`, and no persona has a top-level `authorization` key.
- **Test:** run the real scorer CLI once with the exact profile JSON the run will use and one probe role, into a temporary `--out-dir`. Read `profile_needs_sponsorship` from its `role-scores.json`. The regex is not copied.
- **Stop condition:** the persona needs sponsorship (`needs_sponsorship: true`, `your-input`) but the scorer reports `false` → exit non-zero with a clear error. The profile text is **never reworded** to get past the regex.
- **Human must see:** the exact `authorization` string passed, the persona's `needs_sponsorship`, and the scorer's `profile_needs_sponsorship`.

### G1 — Liveness
- **Input:** a recorded result from `npm run ats:liveness -- <url>` per posting: URL, result, code, reason, date checked. Running it contacts the posting's host — a network host other than npm/GitHub — so each live run needs human approval first.
- **Mapping:** `active` → factor 1.0 (`record`); `expired` → 0.0 (`record`, gate closed). `uncertain`, or no check result → **not scored**.
- **Why missing ≠ live:** the scorer treats a missing or null `liveness` as 1.0 and still labels it `record` (probe: a role with no liveness/timeline scored 0.5250 Apply, higher than the complete baseline 0.4462).
- **Network, do not apply yet:** strong-sponsorship companies with no checked posting go on this list, not into the score.
- **Human must see:** the URL, the result and reason, and the check date; and confirm by opening the posting.

### G2 — Visa timeline
- **Inputs, all `your-input`:** expected program end date **2027-05-15**; OPT start date **2027-06-01**; unemployment limit **90 days**; hiring lag **60 days** (application to start).
- **Rule (`your-input`):** `slack = (OPT start + 90 days) − (run date + hiring lag)`, in days.
  - slack ≥ 30 → `timeline.factor` 1.0;
  - slack 0–29 → 0.5;
  - slack < 0 → 0 (gate closed → not scored).
  - Any input missing → **not scored**.
- **What the scorer does with these factors** (lines 46, 93, 101): 0 is ≤ `gate_zero` 0.05 → Skip (gated). 0.5 is < 0.6 → a composite above threshold is shown as Consider, not Apply. 1.0 → no effect.
- **With the persona's values:** OPT start + 90 = 2027-08-30. For a run on 2026-10-02: run + lag = 2026-12-01, slack = 272 days → 1.0. Slack stays ≥ 30 for runs up to 2027-06-01 and ≥ 0 up to 2027-07-01.
- **Second fixture:** a persona with past dates, so slack < 0, to test the "OPT window closed" case.
- **Input validity (`your-input`):** OPT start must fall between the program end date and program end + 60 days, inclusive; otherwise the prototype **stops with an input error** and scores nothing. Persona check: 2027-06-01 is 17 days after 2027-05-15 → valid. Unemployment days used = 0 while OPT has not started.
- **Human must see:** each date and assumption, the computed slack in days, and the factor sent.

### What this recipe cannot verify
- **H-1B cap lottery:** no data in the repo says whether a cap-subject petition will be selected. Past approvals at a company are not a selection probability.
- **Cap-gap timing:** whether status and work authorization would carry from OPT end to an H-1B start date. No input or data covers it.
- These are stated in the report and never turned into a score term.

### Sponsorship input rule (not a gate, but a stop)
A company that is absent from the 80-days CSV, or whose `Total Approvals` is empty or non-numeric, is reported as **missing** (with the reason) and never sent to the scorer as null or zero. (The scorer silently drops a missing or non-numeric vote.)

**Sponsorship mapping (`your-input`).** Inputs are `Total Approvals` and `top_job_titles_sponsored` from the 80-days CSV row:

| Condition | `tier` | `sponsorship.p` |
|---|---|---|
| `Total Approvals` ≥ 1 **and** at least one title matches the network keyword rule (§3) | Likely | 0.6 |
| `Total Approvals` ≥ 1, no network-keyword title | Possible | 0.5 |
| `Total Approvals` = 0 | None | 0 |
| no CSV row, or `Total Approvals` empty/non-numeric | — | **missing: not scored** |

- **No Proven tier (`your-input`).** The 80-days CSV has no dates and no per-title counts. The evidence shows only that the company sponsored a network title at least once, never that it sponsors one now. So a network match is Likely, not Proven.
- `Approval_Rate` and `Total Denials` are reported as **context only**. They are not used in `p`.
- **Scorer consequences** (lines 35, 48, 99–104): the sponsorship term contributes `p × 0.35`, so 0.21 for Likely. `likely` and `possible` are in `soft_sponsorship_tiers`, so a role whose composite reaches 0.30 is shown as Consider, not Apply. With sponsorship needed (G0 ensures this), **network matches cap at Consider**. Highest possible composite: (0.6 × 0.35 + 1.0 × 0.30) × 1 × 1 = 0.51. `None` changes nothing beyond `p`.
- The scorer's documented human override (`override.decision` with a non-empty `reason`, lines 116–127) can still change the final recommendation. The machine recommendation stays capped.
- **Next action for Consider:** tailor the application and confirm current sponsorship with the recruiter or a network contact.

**Fit (`your-input`).** The persona fixture supplies `fit.p` (0–1) per role. The prototype passes it with `source: "your-input"`.

**Source labels in the scorer trace** (lines 74, 86–87; checked with a probe on 2026-10-02):
- The scorer keeps the `source` string the prototype supplies.
- It uses a default only when `source` is missing or empty: `record` for sponsorship, liveness and role quality; `model-judgment` for fit; `your-input` for timeline.
- It does not check the label: an arbitrary string such as `"verified-by-me"` is written into the trace as given.
- A label is therefore only as honest as the prototype that sets it. The prototype must always set `source` explicitly: sponsorship `record` (derived from a CSV row by a `your-input` rule — the recipe states this), fit `your-input`, timeline `your-input`, liveness `record`.
- The remaining mismatch is the defaulted gates: a missing liveness or timeline becomes 1.0 and still gets a label. G1 and G2 prevent this by stopping before scoring.

## 5. Predicted failure cases

| # | Failure case | Expected behavior | How it will be checked |
|---|---|---|---|
| F1 | Company missing from the CSV | reported "missing: no row in 80-days CSV"; not scored | offline test with a fictional company name not in the CSV; also confirm by hand with a search of the CSV |
| F2 | Generic title collision — bare `Engineer` | not counted as a network title (the keyword rule needs `network` plus a role word) | offline test with a fixture row whose titles are `['Engineer']`. Data check: 5 of the 8 exact-title matches for 15-1241 came only from bare `Engineer` |
| F3 | OPT window already closed | slack < 0 → factor 0 → timeline gate closed → not scored, with the dates and slack shown | offline test with the second (past-dates) persona fixture |
| F4 | Profile triggers the line-60 regex | G0 stops the run with exit ≠ 0 and a clear error; nothing scored | offline test with a fixture profile whose `authorization` contains "authorized" and `needs_sponsorship: true`; runs the real scorer CLI locally (no network) |
| F5 | Posting returns 404 | `classifyLiveness({ status: 404 })` → `expired` → liveness 0.0 → gate closed, not Apply | offline test importing `scripts/ats/liveness-core.mjs`; a live 404 only with approval for that host |

## 6. Predictions about my prototype

Written 2026-10-02, before any prototype code exists. Drafted with help from Claude (chat); I reviewed each prediction and kept only the ones I agree with.

P1. Keyword matching will miss network engineers sponsored under generic titles such as "Infrastructure Engineer" or "Systems Engineer", so some real network sponsors will be reported as "Possible" instead of a network match.

P2. Company-level approval counts will make large staffing and IT outsourcing firms look like the strongest sponsors for network roles, even if only a small share of their approvals were network engineers. The prototype cannot tell the difference.

P3. The scorer labels the sponsorship term [record] and the fit term [model] no matter how my prototype derived them, so the scorer's audit trace will overstate how verified the sponsorship number is and mislabel my your-input fit value.

P4. My first version will not catch a company that appears in the CSV under two different name spellings, and will treat them as two separate companies.

P5. Because 0 network companies matched the Form D samples, the funding context will read "no record in sample data" for every company in the worked run, so the funding part of the recipe will not be exercised on real matches.

## Open questions

- ~~Persona location~~ — decided 2026-10-02 [HUMAN]: `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/`, fictional, `@example.com` only.
- Timeline rule, observed (not a decision): the slack formula does not use the program end date or unemployment days already used. With the persona's values, slack is 272 days on 2026-10-02 even though OPT has not started.
- ~~Sponsorship mapping~~ — decided in r2 and r3 [HUMAN]: no Proven tier; network matches are Likely 0.6 (§4).
- Exact-title results are small (15-1241: 8, 15-1244: 0, 15-1231: 1), and 0 of these companies match the Form D samples, exactly or at the repo's 0.88 fuzzy threshold. The worked run may therefore have Form D context "no record in sample data" for every company.

## Revisions

- **2026-10-02, r1** [HUMAN decisions, AI edit]. These replaced `[TODO: DEFINE]` placeholders; the original placeholder text is quoted here:
  - §1 Situation: added the persona location in `fixtures/`.
  - §2: noted the persona is not in `search/examples/`.
  - §3 Keyword list: `[TODO: DEFINE] — final term list and exclusions` → the `network` + role-word rule.
  - §4 G2: `[TODO: DEFINE] — the persona's values and the lag` → the dates and lag. `How dates map to a factor is a [TODO: DEFINE]` → the slack rule. The original "Test" sentence was replaced by the slack rule.
  - §5 F2/F3: expected behavior updated to the rules above.
  - Section 6 not touched. The sponsorship mapping `[TODO: DEFINE]` remains open.
- **2026-10-02, r2** [HUMAN decisions, AI edit]. Section 6 was written by the human (AI-drafted in a separate chat, HUMAN-selected) and is not touched by r2.
  - §4 Sponsorship: the mapping table (Proven/Likely, Possible 0.5, None 0, missing → not scored). The original sentence, quoted: "How approvals and denials map to `sponsorship.p` and `tier` is a `[TODO: DEFINE]`."
    The Proven-vs-Likely criterion was not given, so that one split stays `[TODO: DEFINE]`. `Approval_Rate` and `Total Denials` are context only.
  - §4 G2: OPT-start validity rule (program end to program end + 60 days, else input error); unemployment days used = 0 before OPT.
  - §4: new "What this recipe cannot verify" (cap lottery, cap-gap timing).
  - §4 Fit: `fit.p` from the persona fixture, `your-input`.
  - §4 Labels: the human decision asked to document that the scorer stamps fit `[model]` and sponsorship `[record]` regardless of derivation.
    A probe of `role-scorer.mjs` (lines 74, 86–87) showed that it keeps supplied labels and defaults only when `source` is missing or empty.
    §4 states the observed behavior instead; the discrepancy is flagged for [HUMAN] review. Prediction P3 in §6 is unchanged and will be checked against this at test time.
- **2026-10-02, r3** [HUMAN decision, AI edit]. Section 6 not touched.
  - §4 Sponsorship: the network-match row was "Proven **or** Likely | 0.9 **or** 0.6", with the note "`[TODO: DEFINE]` — what separates Proven (0.9) from Likely (0.6) in the first row". It is now Likely, 0.6 (`your-input`); there is no Proven tier.
    Reason: the 80-days CSV has no dates and no per-title counts, so the evidence shows only that the company sponsored a network title at least once, never that it sponsors one now.
  - §4: added the consequence (network matches cap at Consider; highest composite 0.51), the override note, and the next action for Consider.
  - Open questions: the sponsorship-mapping item, which said "decided in r2 except the Proven/Likely criterion (`[TODO: DEFINE]` in §4)", is marked decided.
  - §4 label behavior kept as observed in r2. The human rejected reverting it.
