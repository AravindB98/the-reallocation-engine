---
status: RUNNABLE-LIVE
todos_open: 1
last_gate: "live-run, G1-G4 cleared by Ethan Gomes, 2026-10-21, logs/runs/2026fa-ethangomes14-7.md"
attestation: null
recipe_version: 0.5.1
---

# ethangomes14-data-engineer-h1b — Data Engineer H-1B sponsor screen

## Executive summary

**What it does.** Finds current Data Engineer-type postings on public Greenhouse job boards. For each one it checks three things: whether the company has a public record of sponsoring work visas for Data Engineer-type roles, whether the posting is still open (and how long it has been open), and whether hiring could finish before the candidate's post-graduation work window (OPT) closes. It then asks the engine's existing scorer for **Apply**, **Consider** or **Skip**, shows where every number came from, and stops so a person can decide.

**Who it's for.** An international master's student on an F-1 visa, in the final semester before post-completion work authorization (OPT) begins. They are looking for new-grad Data Engineer work anywhere in the US (including jobs with other titles that do the same work) and will need an employer willing to sponsor an H-1B. The worked example uses a fictional persona, "Electrifier".

**What it decides, and what it doesn't.** It decides where the next hours of job-search effort go: an application to tailor, a company to network into, a name to research, or a skip. It does not decide whether a company *will* sponsor; it only shows what the public record supports. Missing evidence is reported as missing, never filled in. A company name the record doesn't know is never guessed; it is bridged only by an alias a person has reviewed.

Two customers: this file is for the agent; `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.card.md` is for the person.

**Handoff condition (done when).** A run is complete when `sponsor-screen.mjs` exits 0 and:
- `screen-log.json` and `screen-report.md` both exist in the output folder;
- every candidate row appears exactly once, either scored by `scripts/score/role-scorer.mjs` or listed as unscored with exactly one reason code;
- every row handed to the scorer carries numeric liveness and timeline factors and a source label on every term;
- no row matched by an unreviewed alias reached the scorer;
- the gate-invariant check reports zero violations (no closed gate came back as anything but Skip, and no recipe rule raised a result above the scorer's).

"Looks right" is not the condition; the row accounting and the invariant check are.

## Lifecycle claim

- **Claimed:** `RUNNABLE-LIVE`, as of 2026-10-21. On that day v0.5.1 ran live on the 19 real postings found on 2026-10-20, with liveness and Greenhouse checks made the same day. Ethan Gomes cleared and logged every gate:
  - **G1:** reviewed all four aliases (checked with a Google search) and the six exact matches.
  - **G2:** opened all 18 "active" links and confirmed each shows its job. For the three possibly-evergreen postings: confirmed the page, did not find out whether they are being filled, and recorded them as "unknown, not acting on it".
  - **G3:** confirmed the timeline inputs.
  - **G4:** read the live report.

  Result: Apply 8 · Consider 10 · Skip 1 · unscored 0. Evidence: `logs/runs/2026fa-ethangomes14-7.md` and `assignments/submissions/ethangomes14/WORKED-RUN.md` §Live run.
- **Earlier stage.** `RUNNABLE-SAMPLE` was reached on 2026-10-20 (v0.5.0): 19 real postings, with all of G1–G4 still open. Evidence: `logs/runs/2026fa-ethangomes14-6.md`. Earlier versions: `logs/runs/2026fa-ethangomes14-1.md` … `-5.md`.
- **Not claimed:** `VERIFIED`. That needs an attestation bound to this recipe version and recorded in the frontmatter. `attestation` stays `null`. The attestation in the worked run is the record for this assignment, not a promotion to VERIFIED.
- **What a person did not establish:**
  - whether the three long-open postings are still being filled;
  - anything beyond a search-engine check of the four legal names (the Unite Us row's website field, `unite-usa.com`, still differs from the company's domain);
  - whether any company sponsors today, which this data cannot show.
- **Honest caveat.** `SNICKERDOODLE.md` makes `SPECIFIED` (zero open TODO markers) the step before `RUNNABLE-SAMPLE`. One typed TODO remains open (§Proposed additions), and it is not on the path that ran. Read strictly, the constitution would stop this recipe at DRAFT, even though its sample and live paths both run. The claim above is made under the assignment's lifecycle and is stated here so a reviewer can apply either reading.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, labels.
2. `DOMAIN.md`: known gaps, especially the scorer's `role_quality: 0.0` and the planned-but-absent directories.
3. `assignments/submissions/ethangomes14/CHANGE-BRIEF.md`: what changed in this build (v0.5.0–v0.5.1), why, and who decided each change.
4. This recipe and its card.

## Purpose

**What the mode does.** It screens a list of live Data Engineer-family postings for one candidate who needs H-1B sponsorship. Each posting goes through four hard checks before the scorer sees it: the title is in the family (G0), the company matches its row in the sponsor file (G1), liveness (G2), and the OPT timeline (G3). Postings that pass are scored Apply / Consider / Skip by the existing `role-scorer.mjs`, unchanged. Every other posting is listed as unscored, with exactly one reason. The output is a ranked list of where to spend the next block of search hours, with each value's source labelled. A person clears the gates before acting on any of it.

**Use it when all of these hold:**
- The candidate is on F-1, will need an employer to file an H-1B, and has a known OPT start date. Persona `needs_sponsorship: true` and a complete `visa_timeline` block are required; without them the run stops.
- The target is Data Engineer-type work, for example Data Engineer, Analytics Engineer, BI Engineer, ETL Developer, Data Platform Engineer, or "Software Engineer, Data …". The full list is `rules.json` → `family_patterns`, minus `exclusion_patterns`.
- The postings are on Greenhouse boards. Discovery and the API cross-check cover Greenhouse only.
- `npm run ats:liveness` has been run on the posting URLs within the last 7 days. An older check closes G2.
- Each candidate has a fit rating. A discovery skeleton with `fit: null` is refused at G0 by design.

The design moment is the final semester before OPT, when an application sent in October has to reach a start date after OPT begins and before the unemployment allowance runs out. The timeline gate also accepts unemployment days already used. Every run so far, though, has used the fictional pre-OPT persona.

**Do not use it to:**
- decide whether a company sponsors today, since approvals in the file are undated (see §What it cannot verify);
- screen roles outside the Data Engineer family, or postings on Lever, Ashby, Workday or company sites without a Greenhouse ID;
- check STEM OPT extension eligibility (E-Verify enrollment), funding (Form D), wages, or BLS role quality. All four are out of scope;
- act on any Apply before the G1 and G2 checks in the report's "You must confirm" list are done.

## Source inventory

| Source | Exact path / command | Used for | Label |
|---|---|---|---|
| 80 Days to Stay sponsor file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; read-only) | `company_name`, `state`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored` | `record` |
| Existing scorer | `scripts/score/role-scorer.mjs`; the screen runs it as `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>` (equivalent to `npm run score -- …`) | Apply / Consider / Skip and the per-term trace | as passed in |
| Existing liveness checker | `npm run ats:liveness -- <url> …` (`scripts/ats/check-liveness.mjs`), run **before** the screen; stdout saved with a `# checked: YYYY-MM-DD` header | Is the posting open? | `record` |
| **Discovery (v0.5.0, network)** | `node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --boards <file>`; allowed host `boards-api.greenhouse.io` only; one request every 0.5 s | Lists each board's jobs and keeps Data Engineer-family titles. Writes a candidates **skeleton** with `fit: null` | titles, locations, `first_published`: `record`; the title filter: `model-judgment` |
| Board list | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/boards-2026-10-20.txt` | 37 board tokens: the 7 earlier sample boards plus guessed tokens for Proven/Likely-tier sponsors | `model-judgment` |
| Screen | `node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs [--today YYYY-MM-DD] [options]` | Gates G0–G3, evidence assembly, scorer call, both outputs (G4 is the person's release) | — |
| Decision rules | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/rules.json` | Title family, exclusions, tier thresholds and p values, timeline factors, liveness freshness, name suffixes, alias review rule, posting-age flag, fit floor | each block carries `_source` |
| **Alias table (v0.5.0)** | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/aliases.json` | Brand name → one exact legal `company_name` in the CSV, used only after exact matching fails, and only once a person has reviewed it | `model-judgment` until reviewed, then `your-input` |
| Persona (fictional) | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fixtures/persona-electrifier.json` | OPT start, 90-day limit, days used, buffer, hiring lag (the `visa_timeline` block), plus needs-sponsorship, target titles and skills | `your-input` |
| Candidates, 2026-10-20 | `samples/postings-2026-10-20.json` (discovery output) → `samples/candidates-2026-10-20.json` (19 US / location-unstated postings, fit added) | The real run | fit: `model-judgment` |
| Liveness, 2026-10-20 | `samples/liveness-2026-10-20.txt` | Saved `ats:liveness` stdout for those 19 URLs | `record` |
| Greenhouse fetch (network) | `node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fetch-greenhouse-status.mjs --candidates <json> …`; allowed host `boards-api.greenhouse.io` only | Does each Greenhouse job ID still exist? 200 = exists, 404 = gone | `record` |
| Greenhouse status, 2026-10-20 | `samples/greenhouse-status-2026-10-20.json` | Saved API answers for the 19 links plus the invented-ID break test | `record` |
| Live-run evidence, 2026-10-21 | `samples/liveness-2026-10-21.txt` (`ats:liveness`, 18 active, 1 uncertain) · `samples/greenhouse-status-2026-10-21.json` (19 × 200) | G2 for the live run, checked the same day the person cleared it | `record` |
| Frozen aliases, 2026-10-20 | `samples/aliases-2026-10-20.json` (sha256 `b3282e9224ef`, all four unreviewed) | Lets the 2026-10-20 sample run reproduce exactly now that `aliases.json` holds the reviews | `model-judgment` (as it was then) |
| Earlier sample (2026-10-03) | `samples/candidates-2026-10-03.json`, `samples/liveness-2026-10-03.txt`, `samples/greenhouse-status-2026-10-03.json` | Reproduction check; stale-liveness break test | — |
| Break-test input | `samples/candidates-ghost-2026-10-03.json` + `samples/liveness-ghost-2026-10-03.txt` | An invented Airbnb job ID that `ats:liveness` calls active | — |
| Tests | `node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs` | 23 tests, offline, fixtures only | — |
| Input-shape reference | `data/examples/ch11-roles.json` | Shape of the `roles.json` the screen writes | — |

Not used, on purpose:
- **SEC Form D samples** (`data/sec/form-d/processed/sample/`). They have zero name overlap with the sponsor file (checked 2026-10-03).
- **BLS role quality** (`data/bls/compact/soc_occupation_compact.csv`). The scorer weights it `0.0`.
- **`npm run bls:local-wage`**. It feeds no decision and fails on a fresh clone.

## Inputs

| Input | Shape | Required |
|---|---|---|
| Candidates file | `{ "candidates": [ { role_id, company, title, url, fit: { p ∈ [0,1], reason }, location?, greenhouse_board?, first_published? } ] }`. `greenhouse_board` is needed only for company-hosted links (`…?gh_jid=<id>`) whose URL carries no board name. Discovery fills everything except `fit`. | yes |
| Liveness output | text: a `# checked: YYYY-MM-DD` line, then `ats:liveness` lines (`✅ active <url>` / `❌ expired <url>` / `⚠️ uncertain <url>`) | yes |
| Persona | JSON with `needs_sponsorship: true` and a `visa_timeline` block (`opt_start`, `unemployment_limit_days`, `unemployment_days_used`, `buffer_days`, `assumed_hiring_lag_days`) | yes |
| Greenhouse status | output of `fetch-greenhouse-status.mjs` (`--greenhouse-status`). If the default file is absent the cross-check is reported as **not run**; an explicitly named missing file stops the run. | no |
| Aliases | `aliases.json` (`--aliases`): `{ "aliases": [ { typed_name, csv_company_name, proposed_by, reviewed_by_person: bool, reviewed_on: YYYY-MM-DD \| null, … } ] }`. Absent default → no aliases; named missing file → stop. | no |
| `--today` | `YYYY-MM-DD`; defaults to the local date | no |
| `--mode` | `sample` (default) or `live`; recorded in the log and the report's run record. `live` is for a run whose gates a person clears. It changes no gate or score; any other value stops the run (v0.5.1) | no |

The persona deliberately has **no** `authorization` field, and the screen never passes `--profile` to the scorer. `applyProfile` in `role-scorer.mjs` turns the sponsorship weight to 0 when that text contains words like "authorized", which would silently erase this recipe's main signal.

## Phase gates

Each row stops at its first failed gate. A failed gate produces a reason code, never a guessed value. **Liveness (G2) and the visa timeline (G3) are gates, not votes:** a closed gate zeroes the composite whatever the sponsorship and fit say.

| Gate | Test (machine) | Pass | Fail | What the person must see to clear it |
|---|---|---|---|---|
| **G0 Input** | Row has non-empty `role_id`, `company`, `title`, `url`; `fit.p` is a number in [0,1]; `fit.reason` is non-empty. The posting title matches the Data Engineer family and no exclusion word. | continue | `invalid-input-row` or `posting-not-data-engineer-family` | The rejected rows and their reasons in `screen-log.json` → `roles[].gates.G0_input`. A discovery skeleton (fit `null`) fails here by design. |
| **G1 Company match** | Normalized company name (lowercase, punctuation and legal suffixes removed) matches **exactly one** CSV row. If not, an alias for that name is looked up: its target must equal **one** CSV `company_name` exactly, and the alias must be reviewed (`rules.aliases.require_review`). The matched row has `Total Approvals ≥ 1`. | sponsorship tier assigned; `matched_via: exact` or `alias` | `not-in-csv`, `ambiguous-match`, `alias-pending-review` (with the tier it *would* give, marked not used), `alias-target-not-in-csv`, `no-h1b-record` | The input name beside the matched `company_name`, the approvals, and the titles that counted as Data Engineer-family. For an alias: is the brand really that legal entity? (each alias lists look-alike rows it must not be confused with). Reviewing an alias = setting `reviewed_by_person: true` and `reviewed_on`, logged as a gate decision. |
| **G2 Liveness (gate)** | The URL appears in the saved `ats:liveness` output; the check is ≤ 7 days old; the verdict is `active`; **and**, for Greenhouse links with a fresh (≤ 7 days) API result, the API did not return 404 | factor 1 | verdict `expired`/`uncertain` or stale → factor 0 (Skip); `active` + API 404 → factor 0, `closed_by: greenhouse-api-404`; URL absent from the liveness output → `url-not-in-liveness-log` (unscored). The API check can only close a gate, never open one. | Open each "active" URL and confirm the final page is **this job**, not a general careers page. For each posting flagged **possibly evergreen** (first published > 120 days ago), find out whether it is still being filled. The flag is shown, never scored. |
| **G3 Timeline (gate)** | earliest start = later of (today + hiring lag) and OPT start; practical deadline = OPT start + (limit − used) − buffer. Slack ≥ 10 days → 1; 0–9 → 0.5; < 0 → 0 | factor 1 or 0.5 | factor 0 → Skip | OPT start, lag, buffer, earliest start and slack, all `your-input`, in the report's timeline section |
| **After the scorer: fit floor** (a recipe rule, not a gate) | Scorer said Apply and `fit.p` < `rules.fit_floor.min_fit_for_apply` (0.4) | unchanged | capped at Consider; `fit_floor.applied`, scorer's own result kept | The capped rows are marked "scorer: Apply; capped" in the report. Override by hand if the fit rating was wrong |
| **G4 Release** | Both outputs exist; invariant check has zero violations; every value has a source label | report handed to the person | exit 3, `status: FAILED-gate-invariant`; do not use the run | The person reads `screen-report.md` and ticks its "You must confirm" list before acting on any Apply. The tool never applies or contacts anyone. |

Gate decisions are recorded in `logs/runs/2026fa-<handle>-<n>.md` (and, for aliases, in `aliases.json` itself). `logs/gate-decisions/` does not exist in this repo, so it is not used.

## Workflow (verbatim)

1. Confirm the toolchain and data:

   ```bash
   npm run doctor
   test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
   ```

2. Discover postings (network; `boards-api.greenhouse.io` only). Writes a skeleton with `fit: null`:

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --boards scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/boards-2026-10-20.txt
   ```

3. Build the candidates file from the skeleton: keep the rows you will consider (2026-10-20 rule: US or unstated location) and add `fit: { p, reason }` to each. This is the only LLM step, and it is labelled `model-judgment`. Saved as `samples/candidates-<date>.json`.

4. Check liveness for every candidate URL and save the output with its date (the checker exits 1 if any URL is not active, so the `||` keeps the output):

   ```bash
   { echo "# checked: $(date +%F)"; npm run ats:liveness -- <url1> <url2> ... || echo "# ats:liveness exited non-zero"; } > scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-<date>.txt
   ```

5. Ask the Greenhouse API whether each job ID still exists (network):

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fetch-greenhouse-status.mjs --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-ghost-2026-10-03.json
   ```

6. Run the screen (offline) on the real run, then the reproduction and break tests:

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-20
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-03 --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --out-dir assignments/submissions/ethangomes14/runs/break-stale-liveness
   ```

7. Run the offline tests and conformance:

   ```bash
   node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
   node scripts/conformance.mjs scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/ recipes/cases/2026fa/
   ```

8. **Stop.** Hand `screen-report.md` to the person for G1–G4. If they review aliases, re-run step 6 and log both runs (template below).

9. **Live run, after the person has cleared G1 and G2.** Re-check liveness and the Greenhouse API on the same day (steps 4–5, saved as `samples/liveness-<date>.txt` and `samples/greenhouse-status-<date>.json`). Then run the screen with `--mode live`, using the default `aliases.json`, which now holds the reviews. The person reads the new report (G4), and every gate decision is logged with their name and the date. The 2026-10-21 live run:

   ```bash
   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode live --today 2026-10-21 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-21-live
   ```

   `samples/aliases-2026-10-20.json` is a frozen copy of the alias file before review. The 2026-10-20 sample run and the 2026-10-03 reproduction pass it so that they still reproduce exactly.

## Source labels

| Value | Label | Why |
|---|---|---|
| Approvals, denials, approval rate, salary, sponsored titles, HQ state | `record` | Read from the CSV row |
| Posting title, location, `first_published`, Greenhouse job ID | `record` | Greenhouse API, saved by discovery |
| Which titles count as Data Engineer-family (CSV titles and posting titles) | `model-judgment` | Title family and exclusions were proposed by Claude |
| Sponsorship score p (Proven 0.9 / Likely 0.6 / Possible 0.4) | `model-judgment` | Claude's rule applied to records (author's decision); p values copy `data/examples/ch11-roles.json` |
| An alias, before review | `model-judgment` | Claude proposed that the brand is that legal entity |
| An alias, after review | `your-input` | A person checked it and dated the decision |
| Fit | `model-judgment` | Claude's rating from title, seniority and location; descriptions not read |
| Which discovered postings became candidates | `model-judgment` | Selection rule (US or unstated location) applied by Claude |
| Liveness verdict and factor | `record` | Output of `ats:liveness`, with check date |
| Greenhouse API status (200 / 404) | `record` | Saved output of `fetch-greenhouse-status.mjs`, with check date |
| Posting-age flag threshold (120 days) | `your-input` | Author-chosen rule; the age itself is `record` |
| Fit floor (0.4 → cap at Consider) | `your-input` | Author's decision, 2026-10-20 |
| OPT dates, buffer, hiring lag, timeline factor | `your-input` | Persona values and an author-chosen rule |

## What it can verify

- That a named company **has a row** in the shipped sponsor file under its normalized name (or under a reviewed alias), and what that row says: approvals, denials, rate, and up to ~5 top sponsored titles.
- That one of those listed titles **matches the Data Engineer family rule** (a rule, labelled as such).
- That an alias points to **exactly one** existing CSV row, character for character, and whether a person has reviewed it.
- That a Greenhouse board **listed** a posting with this title, location and first-published date on a given day.
- That the repo's liveness checker **said** `active` / `expired` / `uncertain` for a URL on a given date.
- For Greenhouse links: whether the job ID **still exists** on that board per the public API on a given date (200 / 404). An "active" verdict with an API 404 is closed as a redirected dead posting (the invented Airbnb ID in the break test).
- That the timeline arithmetic for the persona's inputs gives the stated earliest start, deadline and slack.
- That the existing scorer received complete, labelled evidence and that its output **respects the gates** (closed gate → Skip).
- Row accounting: every candidate is either scored or unscored with exactly one reason.

## What it cannot verify

- **Current intent to sponsor.** Approvals carry **no year**; a company that stopped sponsoring years ago looks the same as an active sponsor.
- **Data Engineer-specific sponsorship volume.** `Total Approvals` is **company-wide** across all titles. A Data Engineer title in the top ~5 says the company sponsored that kind of role, not how often.
- **Absence.** A missing family title is not proof the company never sponsored one; the list holds only ~5 titles. Airbnb (1,000 approvals) and Stripe (1,250) both rate only **Possible** for this reason.
- **Coverage outside six states.** Every row with H-1B data is headquartered in CA, NY, MA, WA, TX or IL. For a nationwide search, a company headquartered elsewhere comes back `not-in-csv` or `no-h1b-record` even if it sponsors. The `state` column is headquarters, not job location.
- **That an alias is right.** The tool checks that the target row exists; only a person can check that "Unite Us" is the company filed as "UNITE USA INC" (whose website field reads `unite-usa.com`, not `uniteus.com`). Names not in the alias table still fail as `not-in-csv`.
- **Which entity of a group sponsors.** Upstart has five CSV rows; the H-1B data sits on `UPSTART NETWORK INC`, not `UPSTART HOLDINGS INC`. The alias picks one; the person confirms it.
- **Whether "active" means this job, outside Greenhouse.** The checker has reported a redirect to a general careers page as `active` (observed 2026-10-03). The API cross-check catches this for Greenhouse job IDs only.
- **Whether an existing job is still being filled.** An API 200 means the job ID exists, not that the team is hiring. Robinhood's "Senior Software Engineer, Data Engineering" was first published **2022-12-08** and still passes both checks (1,412 days on 2026-10-20). The age flag shows this; it cannot settle it.
- **Whether "uncertain" is really closed.** Stripe's posting came back `uncertain` (no visible apply button) on both 2026-10-03 and 2026-10-20 but **200** from the API. The cross-check never re-opens a gate, so it stays Skip; a person may decide otherwise.
- **Whether a round number is real.** Airbnb's row shows exactly `1000.0` approvals. The file may cap or round values; nothing local can confirm it.
- **Fit quality.** Fit is Claude's judgment from titles; job descriptions and the candidate's résumé were not read. That matters more now: for a **Proven** sponsor, sponsorship alone (0.9 × 0.35 = 0.315) clears the scorer's 0.3 Apply line, so since v0.5.0 the fit floor is what separates Apply from Consider, and it rests entirely on that title-only rating.
- **Postings on other boards.** Discovery reads Greenhouse only; Lever, Ashby, Workday and company sites are not searched, and 14 of 37 guessed board tokens did not answer.
- **Out of scope:** E-Verify enrollment (needed for a STEM OPT extension), Form D funding, BLS role quality and wages, and what any employer will offer.

## Output contract

### Agent output — `screen-log.json`

Written to `--out-dir` (default `assignments/submissions/ethangomes14/runs/screen-sample/`). Fields:

`workflow`, `recipe`, `recipe_version`, `mode`, `status` (`complete` | `FAILED-gate-invariant`), `generated_at`, `today`, `inputs` (path, sha256 and row count of each input; the liveness and Greenhouse check dates; alias entries and how many are reviewed), `timeline_gate` (factor, source, detail), `counts` (candidates, unscored, apply, consider, skip, `capped_by_fit_floor`, `skip_or_unscored_rate`; apply/consider/skip count the final `recommendation`), `unscored_reasons`, `gate_invariant_violations`, `alias_warnings`, `roles[]`, `network_list`, `human_gates_pending`, `outputs`, `scorer_stdout`.

Per row in `roles[]`: `gates.G0_input`; `gates.G1_company_match` (`matched_via`, `alias` with its label, `if_confirmed` for a pending alias); `gates.G2_liveness` (with `cross_check` status, HTTP status and `closed_by` when the API closed it); `location`; `posting_age` (`first_published`, `age_days`, `flag`); `sponsorship` with every evidence field as `{ value, source }`; `fit`; `posting_title_in_family`; `status`; `reason`; `scorer` (the scorer's own recommendation, composite, why, arithmetic, trace); `recommendation` (final, after the fit floor); `fit_floor` (`applied`, `scorer_said`, `why`, label) when it capped the row; `next_action`; `network_target`.

Also written beside it: `roles.json` (the scorer's input) and the scorer's own `role-scores.json` / `role-scores.md`.

### Human output — `screen-report.md`

Reader: the job-seeker (or their adviser) deciding what to do with the next block of search hours. Sections:
1. **Executive summary**, in plain language.
2. **Priority list (highest priority first)**: company, job, location, score, sponsorship record (with any alias), fit, whether the posting is live (with the API status), when it was first posted (with the evergreen flag), what to do and a link. Order: Apply now → Consider → Research first (live posting, no usable record yet, including pending aliases) → Network, don't apply → Skip → Out of scope; within a group, higher score first.
3. **Results table**: posting, result with the scorer's reason and arithmetic, sponsorship evidence, fit, liveness, next action. Every value is tagged with its label.
4. **Timeline gate**.
5. **You must confirm before acting**: the G1–G4 checklist, one G1 question per alias, one G2 line per live URL (with its evergreen flag).
6. **Companies to network into**: from the candidates, plus the top Proven-tier Data Engineer-family sponsors not on the list.
7. **What this run cannot tell you**.
8. **Run record**: inputs with hashes, scorer summary, alias warnings, any invariant violations.

The two outputs serve different readers (P5) and are written separately; the report never copies the JSON.

## Next action per result (the 3-3-2 connection)

| Result | Next action | Which hours it feeds |
|---|---|---|
| **Apply** | Tailor an application to this posting, after G2 (and, if flagged, the evergreen question) | the 2 research-and-apply hours |
| **Consider** | Check the soft spot in the scorer's "why" (Likely/Possible tier, tight timeline); if it holds, reach someone at the company first | networking (3) before applying |
| **Skip**, liveness gate closed, tier Proven or Likely | **Network into the company**: strong sponsor record, no open posting | networking (3) |
| **Skip**, otherwise | Skip | frees time |
| **unscored**: `alias-pending-review` | Review the alias (G1); the report shows the tier it would unlock | research (2), about 5 minutes |
| **unscored**: `not-in-csv` / `ambiguous-match` | Look up the legal name; if found, propose an alias for review | research (2), bounded |
| **unscored**: `alias-target-not-in-csv` | Fix the alias (typo or file change); nothing was guessed | — |
| **unscored**: `no-h1b-record` | Treat sponsorship as unknown; skip unless there is a referral | — |
| **unscored**: `url-not-in-liveness-log` | Run `ats:liveness` for that URL and re-run | — |
| **unscored**: `invalid-input-row` / `posting-not-data-engineer-family` | Add the missing fit rating, or treat as out of target | — |

## Stop conditions

Refuse to produce any score (exit 2, write nothing) when:
- the sponsor CSV, candidates file, liveness output, persona or rules file is missing or unparseable;
- the CSV lacks `company_name`, `Total Approvals` or `top_job_titles_sponsored` (schema drift);
- the persona's timeline cannot be computed, or `needs_sponsorship` is not `true`;
- a Greenhouse status file or an aliases file is named but does not exist or does not parse;
- the aliases file is malformed: a missing field, two aliases for one name, or an alias marked reviewed without a review date;
- `--out-dir` is outside this contribution's folders.

Stop with exit 3 when the scorer fails, or its output breaks the gate invariant.

Discovery (`find-greenhouse-postings.mjs`) stops (exit 2) on a board token that is not `[a-z0-9_-]`, a missing boards file, or an `--out` outside its folder or a temp dir.

Per row, refuse to score (unscored, with a reason) rather than guess when the fit rating is missing, the company matches no row or several, an alias is unreviewed or points nowhere, or the URL was never liveness-checked.

Refuse, in this recipe, to:
- fill a missing sponsorship value with 0 or any default;
- let a missing liveness or timeline value reach the scorer (it would default the gate to open);
- fuzzy-match company names, or use an alias nobody has reviewed;
- turn the posting-age flag into a score term;
- pass `--profile` to the scorer;
- edit the sponsor CSV;
- add role-quality weight or change the scorer's weights or thresholds (the scorer's `role_quality: 0.0` and its Apply line are open authorial decisions, not this recipe's to make). The fit floor is a separate, labelled recipe rule applied to the scorer's output, which is kept unchanged;
- let any recipe rule raise a result above what the scorer said.

## Proposed additions

| Addition | Why it belongs | Tag |
|---|---|---|
| Dated, title-level H-1B data: the DOL LCA disclosure files by fiscal year, with SOC code and job title per filing | Would let the tier rule use recent Data Engineer filings (SOC 15-1242 / 15-1252) instead of undated company-wide totals, which addresses the stale-sponsor halo and the "Possible despite 1,000 approvals" result. It would also cover companies outside the six HQ states. | [TODO: DATA SOURCE] |

**Closed in v0.5.0 (was the open DEFINE item): the fit floor.** Value: `rules.fit_floor` = `{ "min_fit_for_apply": 0.4, "cap_to": "Consider" }`, set by the author on 2026-10-20. Reasoning: for a Proven sponsor, sponsorship alone (0.315) clears the scorer's 0.3 Apply line, so without a floor a role two levels too senior (fit 0.3) was an Apply. It is applied after the scorer, can only lower a result, and keeps the scorer's own output in the log. On 2026-10-20 it moved Klaviyo "Senior Lead" and Roku "Governance Lead" from Apply to Consider (Apply 7 → 5).

**Done in v0.5.0 (was the open DEV item): the brand → legal-name alias table.** `aliases.json`, `parseAliases` / `matchCompany` in `lib.mjs`, 4 new tests (validation, exact-match precedence, pending review, missing target, two break attempts), conformance passing. It resolved the 2026-10-03 misses (Gemini, Robinhood) and two found on 2026-10-20 (Upstart, Unite Us) into `alias-pending-review` rows that show what review would unlock. Still a human gate, by design.

**New in v0.5.1 (2026-10-21, found on the live run):**
- **The `--mode sample|live` label.** Before this, the log always said `sample`, which would have mislabelled the live run.
- **A date fix.** `fetch-greenhouse-status.mjs` and `find-greenhouse-postings.mjs` stamped "today" in UTC. A check run at 20:40 EDT on 2026-10-21 was dated 2026-10-22, and the screen (local date) rightly treated it as unusable, so the live run first lost its API cross-check. All three scripts now use `localToday()` in `lib.mjs`.
- **Two new tests**, for 23 in all.

**Also new in v0.5.0:** discovery (`find-greenhouse-postings.mjs`) and the posting-age flag (`rules.posting_age`). Neither was a TODO; both are additions that came out of running the recipe on a fresh day.

**Done in v0.2.0:** the Greenhouse liveness cross-check.

## Facts that bite, and how this recipe handles them

| Fact (assignment numbering) | Handling |
|---|---|
| 1. Role quality has weight 0.0 | Not used; not re-weighted. Listed under "cannot verify". |
| 2. `bls:local-wage` feeds nothing | Not used. |
| 3. Only SEC samples ship | Not used: zero overlap with the sponsor file, measured. |
| 4. `data/raw/`, `data/verified/`, `logs/gate-decisions/` don't exist | Every path in this recipe exists. Gate decisions go to `logs/runs/`. |
| 5. The `snickerdoodle` CLI is roadmap | Not referenced. Every command here is `node` or `npm run`. |
| 6. Every top-level recipe is DRAFT | Lifecycle claim states exactly what was run, plus the SPECIFIED caveat. |
| 7. `bls:local-wage` fails on a fresh clone | Not used. |
| 8. `validate-h1b-join-sample.py` needs full data | Not used. Uses the shipped CSV directly. |
| Found on the live run: UTC vs local dates | All three scripts date "today" with the local calendar date (v0.5.1). A status file dated after `--today` is treated as stale, never trusted. |

## Verification checks

- `node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs`: 23 tests, including F1–F7, the Greenhouse cross-check, aliases, posting age, the fit floor, the run-mode label, local dates, and seven break attempts.
- `node scripts/conformance.mjs scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/ recipes/cases/2026fa/`
- Hand check: for every row in `screen-log.json` with a CSV name, find the row in the CSV with a different parser (Python `csv`). `total_approvals` and `top_titles_sponsored` must match exactly (19/19 on 2026-10-20).
- Row accounting: `counts.candidates == counts.unscored + counts.apply + counts.consider + counts.skip`.
- Reproduction: `--today 2026-10-03` on the 2026-10-03 inputs gives the v0.4.0 counts; the only change is that Gemini and Robinhood move from `not-in-csv` to `alias-pending-review`.

## Logging rules and run-log template

`SNICKERDOODLE.md` says to record runs in `logs/RUN_LOG.md`; `CONTRIBUTING.md` says contributors must not edit that file and should write `logs/runs/<term>-<handle>-<n>.md` instead. This recipe follows `CONTRIBUTING.md`. The entry below is shaped so a maintainer can append it to `logs/RUN_LOG.md` unchanged:

```markdown
### YYYY-MM-DD — data-engineer-h1b sponsor screen v<version> (<sample|live>)

- **Recipe:** recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md v<version>
- **Inputs:** <candidates file, n rows, how found> · <liveness output, checked YYYY-MM-DD> · <Greenhouse status, checked YYYY-MM-DD> · <aliases: n entries, n reviewed> · persona <id> · sponsor CSV sha256 <first 12>
- **Commands:** <exact commands, in order>
- **Outputs:** <out-dir>/screen-log.json · <out-dir>/screen-report.md · roles.json · role-scores.{json,md}
- **Result:** <n> candidates → Apply <a> · Consider <c> · Skip <s> · unscored <u> (<reasons>); invariant violations <0|n>
- **Verification:** <tests n/n> · <conformance> · <CSV cross-check n/n> · <break attempts and what they did>
- **Gate decisions:** G1 <who, which aliases reviewed or rejected> · G2 <who, which URLs opened, evergreen answers> · G3 <who confirmed the timeline inputs> · G4 <who read the report>
- **Open issues:** <what did not work or is still missing>
```

Do not log secrets, real contact details, résumés or private application notes.
