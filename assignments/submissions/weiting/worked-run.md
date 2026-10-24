# Worked Run — Game-Engineering Studio Triage on an OPT Clock

**Mode:** `recipes/case-game-eng-opt-studio-triage.md` v0.2.0 · **Status claimed:** RUNNABLE-SAMPLE
**By:** Weiting Wang · **Date:** 2026-10-17
**Repo:** `nikbearbrown/the-reallocation-engine` @ `015843d` · node v22.22.0 · npm 10.9.4 · Linux x86_64

## Executive summary

This is the record of actually running the mode, not a description of running it. Every
block of terminal output below was pasted from the session; the full transcript is in
`run-2026-10-17/terminal-transcript-2026-10-17.txt`.

The headline result is that the mode ran, produced a four-company shortlist, and then
**refused to produce a single score**, because the posting-liveness gate could not be
evaluated for any of the four. We think the refusal is the most useful thing it did.
Along the way the run surfaced three defects — one in the mode's own matcher, which we
fixed, and two in the upstream scorer, which we did not — and established that the
dataset the whole mode stands on cannot see the large game studios at all.

## 1. Inputs

| Input | Value |
|---|---|
| Company table | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — 30,369 rows, 6,438,295 bytes |
| Occupation table | `data/bls/compact/soc_occupation_compact.csv` — 1,016 occupations, OEWS year 2024 |
| Term / SOC config | `data/examples/game-studio-terms.json` v0.1.0 (written for this mode) |
| As-of date | `2026-10-17` |
| Filters | `--min-approvals 1`, then `--require-role-family` |
| Student profile | `run-2026-10-17/profile-opt.json` — `authorization: "F-1 student on post-completion OPT, needs H-1B sponsorship"` |
| Personal data used | **none.** The mode reads the employer side only. No résumé, no tracker, no `private/`, no `data/ats/` contents are read or written by it. The `data/ats/portals.yml` written for step 5 is gitignored and excluded from the submission. |

## 2. Commands and real output

### 2.1 Conformance and privacy gates (gate 1)

```
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 159 files (85 md · 36 py · 31 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit=0]
```

The three warnings are pre-existing and not ours; `.gitignore` covers `/data/ats/*` and
`/private/*` by glob, which the manifest checker does not recognize as covering the
directory itself. `git check-ignore -v data/ats/portals.yml` returns
`.gitignore:40:/data/ats/*`, so the file is in fact ignored.

```
$ npm run doctor
...
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (34)
  with lifecycle frontmatter: 34   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 5 · RUNNABLE-LIVE 1
  open TODOs: 324 declared (in frontmatter) · 324 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 34/34 carry lifecycle frontmatter — all tracked
  next: continue
[exit=0]
```

Declared TODOs still reconcile with body markers after adding this mode (324 = 324), and
the new recipe is counted in the RUNNABLE-SAMPLE column.

### 2.2 The gate harness, before trusting any composite

```
$ npm run score:gates
...
--- PAIRED (cross-case relations) ---
WARN  P1-role-quality-inert
        G9a-role-quality-absent composite 0.325 vs G9b-role-quality-maximal composite 0.325 -> equal: true
        role_quality p moved 0.0 -> 1.0 with no change to the composite. This is expected while weights.role_quality = 0.0, and is the open authorial decision recorded in DOMAIN.md gap 3 — not a code defect. Reported so it cannot be forgotten.

--- NEGATIVE CONTROL (mutated scorer: gates as additive votes) ---
      mutation applied: 2/2 patterns matched (gates-become-additive-votes, closed-gate-branch-removed)
CAUGHT  G1-liveness-zero-with-maximal-votes  baseline PASS -> mutant FAIL (mutant composite 0.8, rec Apply)
CAUGHT  G2-timeline-zero-with-maximal-votes  baseline PASS -> mutant FAIL (mutant composite 0.85, rec Consider)
...
=== SUMMARY ===
baseline cases    : 10 passed, 0 failed  (of 10)
structural checks : 3 passed, 0 failed  (of 3)
paired checks     : 1 warning(s)
negative control  : PASS — mutation caught by 5 assertion(s)
RESULT            : PASS
[exit=0]
```

We ran this first on purpose. It confirms the gates still multiply, and it independently
confirms the limitation our mode claims: the Cognitive Pivot term contributes nothing.

### 2.3 The triage run (step 3)

```
$ node scripts/score/game-studio-triage.mjs --asof 2026-10-17

game-studio-triage — asof 2026-10-17 · matcher word-boundary
  30369 companies scanned · 24 industry labels · 0 of them game-related
  strong-term matches: 266  (ambiguous-only, not promoted: 40)
  with any H-1B approvals record: 13  ·  with a role-family sponsored title: 4
  kept after filters (min-approvals 1): 13

  logs/game-studio-triage-2026-10-17-wordboundary.json  +  logs/game-studio-triage-2026-10-17.md
  next: human confirmation gate — open each website and confirm it makes games.

[exit=0]
```

```
$ node scripts/score/game-studio-triage.mjs --asof 2026-10-17 --require-role-family \
    --out-dir assignments/submissions/weiting/run-2026-10-17 \
    --md assignments/submissions/weiting/run-2026-10-17/game-studio-triage-2026-10-17.md

game-studio-triage — asof 2026-10-17 · matcher word-boundary
  30369 companies scanned · 24 industry labels · 0 of them game-related
  strong-term matches: 266  (ambiguous-only, not promoted: 40)
  with any H-1B approvals record: 13  ·  with a role-family sponsored title: 4
  kept after filters (min-approvals 1, role-family required): 4

  assignments/submissions/weiting/run-2026-10-17/game-studio-triage-2026-10-17-wordboundary.json  +  assignments/submissions/weiting/run-2026-10-17/game-studio-triage-2026-10-17.md
  next: human confirmation gate — open each website and confirm it makes games.

[exit=0]
```

The four surviving rows, as the generated human report prints them:

| Company | Where | Sponsorship | Sponsored titles on record | Last funding | Offered median |
|---|---|---|---|---|---|
| MANTICORE GAMES INC | San Mateo, CA | **Proven** (10 appr / 0 den) | `['Technical Artist']` | Series D+ 2021-03-16 (dry, 67 mo) | $113,000 |
| PIXELWORKS INC | San Jose, CA | **Likely** (4 appr / 0 den) | `['Film/Game 3D Production Research Engineer', 'Senior Principal Engineer']` | Series A 2020-12-07 (dry, 70 mo) | $139,632.50 |
| SIMX INC | San Francisco, CA | **Likely** (2 appr / 0 den) | `['Software Engineer, Unity VR']` | Pre-Seed 2020-01-31 (dry, 81 mo) | $104,178.78 |
| THAT'S NO MOON ENTERTAINMENT INC | Los Angeles, CA | **Likely** (2 appr / 0 den) | `['Associate Gameplay Engineer']` | Series A 2023-09-21 (dry, 37 mo) | $71,000 |

Every one of the four carries the dataset industry label `Other Technology`. Not one is
labeled as a game company, which is the asymmetry the mode was built for.

The salary table the same run produced:

| Company | Offered | vs Software Developers (15-1252, $133,080) | vs Video Game Designers (15-1255.01, $98,090) |
|---|---|---|---|
| PIXELWORKS INC | $139,632.50 | 104.9% (+$6,552.50) | 142.4% (+$41,542.50) |
| MANTICORE GAMES INC | $113,000 | 84.9% (−$20,080) | 115.2% (+$14,910) |
| SIMX INC | $104,178.78 | 78.3% (−$28,901.22) | 106.2% (+$6,088.78) |
| THAT'S NO MOON ENTERTAINMENT INC | $71,000 | **53.4% (−$62,080)** | 72.4% (−$27,090) |

### 2.4 Liveness (gate 5) — the gate that did not clear

```
$ npm run ats:scan -- --dry-run

Scanning 2 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-17
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     2
Total jobs found:      0
Errors (2):
  ✗ Absurd Ventures: fetch failed
  ✗ Insomniac Games: fetch failed
[exit=0]
```

```
$ npm run ats:liveness -- https://job-boards.greenhouse.io/absurdventures/jobs/4546619007

Checking 1 URL(s)...

⚠️ uncertain  https://job-boards.greenhouse.io/absurdventures/jobs/4546619007
           navigation error: page.goto: net::ERR_TUNNEL_CONNECTION_FAILED at https://job-boards.greenhouse.io/absurdventures/jobs/4546619007

Results: 0 active  0 expired  1 uncertain
[exit=1]
```

The cause is this sandbox's egress policy, not the script: the proxy's own status
endpoint reports `connect_rejected — gateway answered 403 to CONNECT` for
`job-boards.greenhouse.io:443`. The script behaved correctly. `uncertain` is not
`active`, so the gate stayed shut, and `exit=1` propagated that.

We then verified the same posting by reading the page itself through a different,
permitted tool, and recorded what we saw: **Absurd Ventures — Senior/Lead Gameplay
Engineer, Santa Monica or San Rafael CA, posted base $170,000–$210,000, application form
present, no closed-posting language.** That is a human verification, labeled
`your-input`, and it is not a substitute for the script's record.

### 2.5 The refusal (step 8) — twice

Without a liveness file at all:

```
$ node scripts/score/game-studio-triage.mjs --asof 2026-10-17 --require-role-family \
    --out-dir /tmp/nolive --md /tmp/nolive/r.md --emit-roles /tmp/nolive/roles.json

✗ REFUSING to emit roles.json without --liveness.
  role-scorer.mjs defaults a missing liveness gate to 1.0 — an unchecked
  posting would score as a live one. Run `npm run ats:liveness -- <url>`
  first and pass the result as --liveness <file>.
  (the log and report were still written: /tmp/nolive/game-studio-triage-2026-10-17-wordboundary.json)
[exit=3]
```

With a liveness file that honestly covers none of the four:

```
$ node scripts/score/game-studio-triage.mjs --asof 2026-10-17 --require-role-family \
    --out-dir /tmp/live --md /tmp/live/r.md --emit-roles /tmp/live/roles.json \
    --liveness assignments/submissions/weiting/run-2026-10-17/liveness-2026-10-17.json

✗ no liveness value for: manticore-games-inc, pixelworks-inc, simx-inc, that-s-no-moon-entertainment-inc — not emitted (gate unevaluated).
✗ no roles had a liveness value; nothing emitted.
[exit=3]
```

**The real run of this mode produces zero scoreable roles.** The triage layer returns
employers with sponsorship history; the liveness gate needs a posting URL; nothing in
the repository bridges the two. That is now TODO 2 in the mode.

### 2.6 The composite, on a hand-assembled role set

To exercise `npm run score` against real values we assembled
`run-2026-10-17/roles-hand-assembled.json` by hand, with a `_provenance` string on every
role saying where each field came from. The liveness values in it are ours, not the
script's, and are labeled `your-input`.

```
$ npm run score -- .../roles-hand-assembled.json --profile .../profile-opt.json \
    --out-dir ... --md .../role-scores-2026-10-17.md

✓ scored 5 roles → Apply 0 · Consider 1 · Skip 4 (skip 80%)
[exit=0]
```

| Role | Composite | Rec | Arithmetic |
|---|---|---|---|
| MANTICORE GAMES — Technical Artist | 0.0000 | Skip | gated: liveness ≈ 0.000 |
| THAT'S NO MOON — Associate Gameplay Engineer | 0.0000 | Skip | gated: liveness ≈ 0.000 |
| PIXELWORKS — Film/Game 3D Production Research Engineer | 0.0000 | Skip | gated: liveness ≈ 0.000 |
| SIMX — Software Engineer, Unity VR | 0.0000 | Skip | gated: liveness ≈ 0.000 |
| ABSURD VENTURES — Senior/Lead Gameplay Engineer (live, $170–210k) | 0.2040 | **Consider** | `(0.8·0.3 + 0.6806·0) × 1 × 0.85` |

The single row that is not gated is the one the engine knows nothing about. Absurd
Ventures has no row in the company table, so there is no sponsorship vote at all — the
field is omitted rather than zeroed — and the composite rests on judged fit alone,
landing in the Consider band. The four rows with real sponsorship records are the ones
with no live posting. **The two halves of the evidence never meet**, and that sentence
is the actual finding of the run.

## 3. Verified vs inferred, line by line

| # | Claim | Verified or inferred | Established by |
|---|---|---|---|
| 1 | 30,369 companies; 24 industry labels; none game-related | **Verified** | counted from the CSV by the script, printed every run |
| 2 | 1,557 of 30,369 rows carry any H-1B approvals value | **Verified** | counted from the CSV |
| 3 | 266 term candidates → 13 with a sponsorship record → 4 in the role family | **Verified** | script output, reproducible |
| 4 | Manticore sponsored a Technical Artist, 10 approvals, 0 denials, $113,000 median | **Verified** | `top_job_titles_sponsored`, `Total Approvals`, `Total Denials`, `median_salary_offered` |
| 5 | That's No Moon's $71,000 is 53.4% of the 15-1252 median | **Verified (derived)** | arithmetic over two record values; both printed |
| 6 | Manticore's last funding event is 67 months before 2026-10-17 | **Verified (derived)** | `latest_funding_date` + as-of arithmetic |
| 7 | "dry / aging / fresh" at 36 / 18 months | **Inferred — our definition** | we chose the thresholds; stated in the config with reasoning |
| 8 | `15-1255.01` has no wage of its own; $98,090 is the 15-1255 group | **Verified** | `bls_soc_code` collision detected in the extract, flagged as `wage_is_soc_aggregate` |
| 9 | `cognitive_pivot_score` 3.834 / 3.792 / 3.389 / 3.627 for the four target codes | **Verified** | read from the extract |
| 10 | Rescaling those to 0–1 over min 1.611 / max 4.877 | **Verified (derived)** | transform printed in the run log |
| 11 | role quality contributes nothing to the composite | **Verified** | `npm run score:gates` WARN P1; arithmetic prints `·0` |
| 12 | A term match means a company makes games | **Inferred — and gate 2 exists to stop it** | our judgment; two-thirds of the thirteen are not game companies |
| 13 | Insomniac / Bungie / Blizzard / Epic Games / Naughty Dog / Respawn / Zynga have no row | **Verified** | `grep` over the CSV; the apparent hits are Epic Battery, Riot Auto, Sucker Punch Gourmet, Unity Biotechnology |
| 14 | They are absent *because* the table is built from Form D filers | **Inferred** | our explanation; consistent with the dataset's construction but not stated by any file here |
| 15 | Absurd Ventures' posting is live, $170k–$210k | **Verified by hand, not by script** | page read 2026-10-17; `ats:liveness` returned `uncertain` |
| 16 | Liveness 0.0 for the four candidates | **Inferred — conservative choice** | no posting was located; we treat an unopenable gate as closed |
| 17 | `fit` values 0.5–0.9 | **Inferred — model/human judgment** | labeled `model-judgment` in every record |
| 18 | Timeline factor 0.85 | **Inferred — illustrative input** | a placeholder; the mode computes no immigration dates |

## Attestation

- Recipe: `case-game-eng-opt-studio-triage` v0.2.0
- By: Weiting Wang · 2026-10-17

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` | `conformance: 159 files … ✓ all conform`, exit 0 | the new script and recipe parse and are counted |
| `npm run doctor` | `✓ no private/PII paths are tracked`; TODOs 324 declared = 324 in bodies | no private data tracked; my declared TODO count reconciles |
| `npm run score:gates` | `RESULT: PASS`, plus `WARN P1-role-quality-inert` | gates still multiply; the role-quality defect is confirmed by the repo's own harness, not just by me |
| `node scripts/score/game-studio-triage.mjs --asof 2026-10-17` | 30,369 scanned · 266 candidates · 13 with a record · 4 in role family | a small shortlist and a countable false-positive problem |
| same, `--require-role-family` | 4 rows; all labeled `Other Technology` | the role-family filter is the one that actually narrows |
| **break 1 — `--naive-substring`** | ambiguous-only matches jumped **40 → 5,572**; strong 266 → 398 | substring matching to be badly wrong, because `engine` is inside `Engineer` |
| **break 2 — `--emit-roles` with no `--liveness`** | `✗ REFUSING …`, exit 3, nothing written | the stop condition to fire rather than let the scorer default the gate open |
| **break 3 — `--liveness` file covering no candidate** | `✗ no liveness value for: manticore-games-inc, …`, exit 3 | a partially-covered gate to be treated as uncovered |
| **break 4 — same roles, profile reworded to "authorized to work"** | `profile_needs_sponsorship: false`; Manticore **0.4845 Apply → 0.2167 Consider**; arithmetic changed from `0.9·0.35` to `0.9·0` | I expected the regex in `applyProfile()` to misfire, and wanted to know how much it cost. It silently deletes the sponsorship evidence. |
| `npm run ats:liveness -- <real greenhouse URL>` | `⚠️ uncertain … ERR_TUNNEL_CONNECTION_FAILED`, exit 1 | a blocked network to produce `uncertain`, not a false `active` |
| `npm run score` on the hand-assembled set | `Apply 0 · Consider 1 · Skip 4 (skip 80%)` | a high skip rate, and the one ungated row to be the one with no sponsorship record |
| `python3 -m json.tool` on every JSON artifact | all parse | the output contract to be machine-readable |

### Did not test

- **Gate 2 was never cleared.** We did not open all thirteen companies' websites and
  record `makes_games` in `logs/gate-decisions/`. We read enough of them to know the
  false-positive rate is roughly two in three, but there is no logged gate decision, so
  the shortlist is unconfirmed. This is the single biggest gap in the run.
- **No liveness check ever returned `active` from a script.** The classifier logic in
  `liveness-core.mjs` is therefore untested by us on a real page; we only proved the
  failure path.
- `npm run ats:scan` was never run against a reachable board, so provider detection
  past the fetch is untested.
- We did not test the mode against a second dataset snapshot, so we cannot say whether
  the counts are stable over a data refresh.
- We did not test what the script does with a malformed CSV row, a duplicate company
  name, or a `latest_funding_date` in the future.
- We did not validate the `total_funding` or `Approval_Rate` columns against the
  upstream join audits in `data/80-days-to-stay/data/`; we read that those audits exist
  but did not reconcile a single count against them.
- The Peloton Interactive duplicate (one `INC` row, one `LLC` row, identical approvals)
  is unhandled — we noticed it and did not deduplicate.
- The `role_quality_index` rescaling was never checked against any external definition
  of the cognitive-pivot thesis; it is our arithmetic on a column, nothing more.

### Broke during testing, fixed

1. **Playwright could not launch.** `npm run ats:liveness` died with
   `Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1234/…`.
   The sandbox ships build 1194 in a different directory layout than Playwright 1.58
   expects. Fixed by symlinking the installed headless shell to the expected path; the
   repo was not modified. Noted because on a normal machine `npx playwright install`
   is the right fix and this one is environment-specific.
2. **`ats:scan` refused to start:** `Error: portals.yml not found. Run onboarding first.`
   Fixed by writing `data/ats/portals.yml` with three public game-studio boards.
   Confirmed gitignored (`git check-ignore -v` → `.gitignore:40:/data/ats/*`) and
   excluded from the submission zip.
3. **Our own matcher was wrong first.** The initial term list had `engine` as a strong
   term, which matched `Software Engineer` and produced 905 "game" candidates. Fixed by
   adding word boundaries (`(?<![a-z0-9])…(?![a-z0-9])`), moving `engine` to the
   ambiguous tier, and keeping the broken behavior behind `--naive-substring` so the
   failure stays reproducible instead of becoming a story.
4. **Word boundaries alone changed a count we had already written down.** With
   `(?<![a-z])` the strong-match count was 267; with digits excluded it is 266. We
   corrected the number rather than the regex, and mention it because a count that
   moves when you tighten a matcher is exactly the kind of thing that gets quietly
   left stale.

## 4. Reflection

**What went well.** The mode's central claim turned out to be measurable rather than
rhetorical. We expected to argue that game studios are hard to find in this dataset; we
were able to count it instead — 24 industry labels, none of them games, and a
false-positive rate we could demonstrate by deliberately breaking our own matcher. The
decision to make the script emit evidence components and refuse to compute a composite
also paid off in a way we did not anticipate: because the script would not hand an
unchecked role to the scorer, the run's failure was loud. Had we let it default the
liveness gate, we would have produced four confident-looking scores and a much worse
assignment.

**What the mode got wrong or missed.** Three things. First, it does not solve the
problem it was built for. A student runs it hoping for a ranked list of studios to apply
to, and what it returns is four employers with no postings attached and a warning that
most of the industry is invisible. The missing piece is board discovery, and we did not
build it. Second, the Peloton Interactive duplicate shows the mode has no entity
resolution at all: the same company appears twice with the same approvals total, which
would double-count in any aggregate. The repository has an entity-resolution readiness
audit sitting in `data/80-days-to-stay/data/` that we did not read before writing the
matcher, which is exactly the "verified data first" failure the constitution warns
about. Third, the Cognitive Pivot layer is decorative in our run. We compute
`cognitive_pivot_score`, rescale it, print it in two artifacts, and the composite
scorer multiplies it by zero. We labeled that honestly, but a mode whose third evidence
layer cannot affect any decision is weaker than its documentation suggests.

**Next steps, in the order we would do them.** Build `board-discovery.mjs` first (TODO
2) — without it the mode cannot ever reach a composite, and it is the shortest path from
RUNNABLE-SAMPLE to a run that actually helps. Then clear gate 2 properly by opening all
thirteen websites and logging a real gate decision, which also gives us a measured
precision figure instead of our "roughly two in three." Then add the game-employer list
(TODO 1), which would let us compare name matching against a join and retire the
guess. The profile-wording guard (TODO 5) is a two-line change and should be sent
upstream as a pull request regardless of this mode, because it misreports sponsorship
need for exactly the population the engine is written for.

**One more honest note.** The status frontmatter says RUNNABLE-SAMPLE, and we considered
claiming RUNNABLE-LIVE since real commands ran against real data. We did not, because
the transition requires a live run with a human clearing every gate, and two of our
seven gates were never cleared. The run is real; the gates are not all closed behind it.
