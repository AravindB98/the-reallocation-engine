# Change Brief — Data Engineer H-1B sponsor screen (mode build, v0.5.0 → v0.5.1)

## Executive summary

**What this is.** The record of what changed in the mode during this build, why each change was made, and what each one did to the results. It covers 20 and 21 October 2026.

**Why read it.** It explains every difference between the mode as it started this build and the mode being submitted, and who decided each one. Changes come with their evidence, so none of them has to be taken on trust.

**What it decided.** The build did six things:
- made the mode find its own job postings;
- added a hand-reviewed table that links brand names to legal company names;
- flagged postings that have been open a long time;
- stopped weak job matches from coming out as "Apply";
- fixed two problems found on the live run: a date mix-up and a mislabelled run type;
- had me clear every human checkpoint.

The mode went from a first real run (Apply 5 · Consider 8 · Skip 1 · unscored 5) to a live run with every checkpoint cleared (Apply 8 · Consider 10 · Skip 1 · unscored 0).

**A note on timing.** This brief was written on 2026-10-21, after the build. It records changes and their measured effects. It does not claim to have predicted them.

---

## 1. Who the mode is for

An F-1 master's student in the final semester before post-completion OPT, looking for new-grad Data Engineer work (and other titles that do the same work) anywhere in the US, who will need H-1B sponsorship. The worked example uses a fictional persona, "Electrifier" (`scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fixtures/persona-electrifier.json`):
- OPT start 2027-03-01;
- 90-day unemployment limit, with 10 days of buffer;
- 45-day assumed hiring lag;
- practical deadline 2027-05-20.

No real person's dates, résumé or contacts are used.

## 2. Where the build started

The starting code was `sponsor-screen` v0.4.0 in `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/` (commit `dbac7a2`). It did three things for each posting:
- matched the company to the 80 Days to Stay sponsor file (exact names only);
- gated liveness with `npm run ats:liveness` plus a Greenhouse API cross-check;
- gated the OPT timeline.

It then called the engine's `scripts/score/role-scorer.mjs` unchanged. Postings had to be found by hand. Two typed TODOs were open: a brand → legal-name alias table (`[TODO: DEV]`) and dated H-1B data (`[TODO: DATA SOURCE]`).

## 3. What changed, and why

| # | Change | Why | Effect | Decided by | Evidence |
|---|---|---|---|---|---|
| 1 | **Discovery**: `find-greenhouse-postings.mjs` asks public Greenhouse boards for jobs and keeps Data Engineer-family titles, writing a skeleton with `fit: null` | The mode depended on postings found by hand, so it couldn't run on a fresh day | 37 boards asked, 23 answered, 23 postings; 19 kept (US or no location) | Claude built it | `samples/postings-2026-10-20.json`, `WORKED-RUN.md` §1 |
| 2 | **Title rule**: `account executive` and `\bsales\b` added to `exclusion_patterns` | Discovery matched Stripe's "Account Executive, Product Sales (Data Pipeline)" through `data pipeline` | The sales job is gone; re-checked against the live Stripe board | Claude found and fixed it | `rules.json`, `runs/terminal-discovery-stripe-recheck.txt` |
| 3 | **Alias table**: `aliases.json` + `matchCompany` in `lib.mjs`, used only after exact matching fails and only once a person has reviewed the entry | Gemini, Robinhood, Upstart and Unite Us came back "not found" under their brand names | Closes the `[TODO: DEV]`. Unreviewed aliases show as `alias-pending-review`, with the tier they *would* give, and stay unscored | Claude built it; the review rule is a `your-input` rule | `aliases.json`, 4 tests |
| 4 | **Posting-age flag**: postings first published more than 120 days ago are flagged "possibly evergreen", shown and never scored | Robinhood's "Senior Software Engineer, Data Engineering" was first published 2022-12-08 and passed every machine check | 3 postings flagged on 2026-10-20 | Claude built it; the threshold is a `your-input` rule | `rules.json` → `posting_age`, 1 test |
| 5 | **Fit floor**: an Apply with fit below 0.4 is capped at Consider, after the scorer. It can only lower a result, and the scorer's own output is kept | For a Proven sponsor, sponsorship alone (0.9 × 0.35 = 0.315) clears the 0.3 Apply line, so two senior "lead" roles with fit 0.3 came out Apply | Apply 7 · Consider 6 → **Apply 5 · Consider 8**. Closes a `[TODO: DEFINE]` raised by this run | **Me** (Ethan Gomes), 2026-10-20 | `rules.json` → `fit_floor`, 1 test |
| 6 | **One checklist question per alias** in the report | The report asked the same alias question twice when one company had two postings | Fixed | Claude | `sponsor-screen.mjs` |
| 7 | **Human gates cleared**: aliases reviewed (G1), 18 links opened (G2), timeline confirmed (G3), live report read (G4) | The mode had run on real data, but no person had cleared its gates | All five alias rows scored: Gemini, Upstart and Unite Us Apply; Robinhood ×2 Consider | **Me**, 2026-10-21 | `aliases.json`, `logs/runs/2026fa-ethangomes14-7.md` |
| 8 | **`--mode sample\|live`** | `mode` was hardcoded `sample`, so a live run would have been mislabelled | The live log says `mode: live`; any other value stops the run | Claude, found on the live run | 1 test |
| 9 | **Local dates**: `localToday()` in `lib.mjs`, used by all three scripts | The network scripts dated "today" in UTC, so a check at 20:40 EDT was stamped 2026-10-22. The screen (local date) rightly ignored it, and the first live run lost its API cross-check | Re-fetched and re-run: 19/19 cross-checked. The broken outputs are kept with `BUG` in their names | Claude, found on the live run | 1 test; `samples/greenhouse-status-2026-10-21-BUG-utc-dated.json` |
| 10 | **Frozen alias file**: `samples/aliases-2026-10-20.json` (the pre-review file, sha256 `b3282e9224ef`) | Reviewing the aliases changed `aliases.json`, so the documented 2026-10-20 command no longer gave its documented result | The sample run still reproduces exactly (Apply 5 · Consider 8 · Skip 1 · unscored 5) | Claude | README, card and recipe commands |
| 11 | **Purpose section** in the recipe | The assignment asks for "Purpose", and the recipe had only folded it into the summary | Explicit "use it when" and "do not use it to" lists | **Me** (asked for it), 2026-10-21 | recipe §Purpose |

Tests went from 15 to 23. No change touched the engine's own scripts or data. The scorer, the liveness checker and the sponsor CSV are used unchanged.

## 4. What stayed the same, on purpose

- The scorer's weights (sponsorship 0.35, fit 0.30, role quality 0.0) and its 0.3 Apply line. These belong to the repo's authors; the fit floor sits after the scorer instead.
- **Exact matching first, never fuzzy.** An alias only bridges a name after a person has reviewed it.
- **Liveness and the visa timeline are gates, not votes.** A closed gate is Skip, whatever sponsorship and fit say.
- **The `[TODO: DATA SOURCE]` for DOL LCA filings stays open.** The data isn't in the repo, and it's the only fix for undated, company-wide approvals.

## 5. Failure cases this build tested

| Case | How it was tested | Result |
|---|---|---|
| Stale liveness evidence | Screen with the 2026-10-03 liveness file evaluated later | Nothing Apply; stale rows Skip, missing rows unscored |
| A dead posting the checker calls "active" | Invented Airbnb job ID | Skip, closed by the API 404 |
| Postings with no fit rating | Discovery skeleton fed straight to the screen | 23 × `invalid-input-row`; nothing scored |
| Writing into shared data | `--out-dir data/80-days-to-stay` | Exit 2, nothing written |
| A review claim without evidence | Alias marked reviewed with no date | Exit 2, nothing written |
| After the OPT deadline | `--today 2027-06-01` | No Apply |
| Bad discovery input | Malformed board token; `--out data/x.json` | Exit 2 both times |
| Claiming a status through a flag | `--mode verified` | Exit 2 |
| A gate-ignoring scorer | `fixtures/BROKEN-apply-everything-scorer.mjs` (test) | Caught, exit 3 |

## 6. Revisions

- **2026-10-20 — v0.5.0.** Changes 1–6. The first real run on 19 postings found that day gave Apply 5 · Consider 8 · Skip 1 · unscored 5. All five unscored rows were waiting on alias review. Evidence: `logs/runs/2026fa-ethangomes14-6.md`.
- **2026-10-21 — v0.5.1.** Changes 7–11. The live run gave Apply 8 · Consider 10 · Skip 1 · unscored 0, with the CSV cross-check at 19/19. Skip plus unscored fell from 32% to 5%. That's far below the ~50% a healthy run skips, but these boards were chosen *because* the companies sponsor, so it isn't a fair skip-rate test. Status: RUNNABLE-LIVE. Evidence: `logs/runs/2026fa-ethangomes14-7.md`.
