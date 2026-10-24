# CHANGE-BRIEF — MSIS product-role network targets

## Executive summary

This is the plan I wrote before building anything. It describes who the tool is for, which
existing data and scripts it reuses, where it must stop and hand the decision to a person,
and what I expect to go wrong.

The tool is for an international master's student in Information Systems who graduates in
December 2026, has about three years of STEM OPT ahead, has 3.5 years of prior work
experience, and wants mid-level product roles (Product Manager, AI Product Manager, Product
Analyst) at tech companies anywhere in the US. For this person the visa clock is not the
tight constraint; getting hired as a product manager is, and that kind of hiring leans
heavily on referrals.

The tool finds companies whose own visa records show they have sponsored product roles,
then checks each company's public job board. Every company ends in one of three places:
**apply** (a matching posting is open), **network** (it sponsors product roles but has no
matching opening right now, so the time to build a contact is before one opens), or
**skip / human check** (no sponsorship evidence, or the board could not be confirmed).
Nothing is guessed: a company whose board cannot be confirmed is never treated as "no
openings".

Predictions are kept as written. Later revisions are added at the bottom, dated.

---

## 1. Situation and engine layers

| | |
|---|---|
| Degree | MS Information Systems (STEM-designated), graduating December 2026 |
| Status | F-1 → OPT from January 2027, then 24-month STEM extension; runway ≈ 3 years [your-input] |
| Experience | ~3.5 years; targeting roles that ask for 1–5 years |
| Target titles | Product Manager, AI / ML Product Manager, Technical Product Manager, Product Analyst, Senior Product Analyst |
| Excluded titles | Intern, Associate / APM, Director, Principal, Group, Staff, Head of, VP |
| Grey zone | Senior Product Manager — often 5+ years; a setting the user turns on or off [your-input] |
| Location / sector | Anywhere in the US, remote or on-site; tech preferred |

Worked runs and fixtures use a **fictional persona** with the same shape (invented name,
`@example.com` address). My real details stay out of every tracked file.

**Layers used**

- **80 Days to Stay**: sponsorship history (`Total Approvals`, `Total Denials`,
  `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored`) and funding columns
  (`latest_funding_date`, `latest_funding_stage`, `total_funding`).
- **Job-Ops**: the ATS providers (Greenhouse, Lever, Ashby) to list a company's open
  postings, and the liveness checker for a single posting.
- **Cognitive Pivot**: report only. BLS/O*NET medians for the occupation codes product
  roles are filed under, shown as context. They feed no decision (see §6, facts 1–2).

## 2. What I reuse (exact paths) and what I propose

**Reused, exists today**

| Purpose | Path / command |
|---|---|
| Sponsorship + funding records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |
| Column meanings and caveats | `data/80-days-to-stay/data/README.md`, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` |
| Occupation wages (context only) | `data/bls/compact/soc_occupation_compact.csv` |
| Board listing | `scripts/ats/providers/greenhouse.mjs`, `lever.mjs`, `ashby.mjs` (imported, not copied) |
| Single-posting liveness | `npm run ats:liveness -- <url>` (`scripts/ats/check-liveness.mjs`) |
| Decision | `npm run score -- <roles.json> --out-dir <my folder>` (`scripts/score/role-scorer.mjs`, called by CLI, not re-implemented) |
| Example input shape | `data/examples/ch11-roles.json` |
| Conformance / privacy | `node scripts/conformance.mjs <path>`, `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs` |

**Proposed, does not exist yet**

| Addition | Why it belongs | Tag |
|---|---|---|
| A human-confirmed company → job-board file (`boards.json`, in my folder) | The CSV has no careers or ATS URL column. Guessing a board slug from a company name can hit a *different* company with the same slug. A person confirms each board once; the confirmation is labeled your-input. | [TODO: DEV] |
| Sponsorship tier rule: approvals / denials → `p` and `Proven/Likely/Possible/None` | The scorer needs `sponsorship.p` and `tier`; the CSV gives counts, not tiers. The thresholds are a choice and will be written down with a reason. | [TODO: DEFINE] |
| Seniority / title rule for "1–5 years product role" | Title matching is a rule I choose, not a record. It must be written down and tested against the real `top_job_titles_sponsored` strings. | [TODO: DEFINE] |
| E-Verify participation per employer | STEM OPT requires an E-Verify employer. No E-Verify data is in the repo, so this cannot be checked. Reported as "not checked" on every row. | [TODO: DATA SOURCE] |
| The fiscal years behind `Total Approvals` | Neither the data README nor the audit states which years the counts cover. "Sponsored a PM" could mean 2016 or 2024. | [TODO: DATA SOURCE] |

## 3. Pipeline and gates

1. **Select (offline).** From the CSV, keep companies with `Total Approvals` > 0 **and** at
   least one product title in `top_job_titles_sponsored` that passes the seniority rule.
   Measured before writing this brief: 133 companies have approvals and some product-family
   title (before the seniority rule).
2. **Gate A: board confirmation (human).** For each candidate the prototype prints the
   company's website and a *proposed* board URL. A person confirms or rejects it in
   `boards.json`. Unconfirmed companies go to "human check", never to "network".
   *To clear:* every company carried forward has a board entry with `confirmed: true`.
3. **Fetch boards.** Use the existing providers to list open postings (network only to the
   provider-allow-listed Greenhouse / Lever / Ashby hosts). Tests read saved fixture JSON
   instead, with no network.
4. **Gate B: liveness (a gate, not a vote).** A posting counts as live only if it appears
   in the board's own API listing (record). `ats:liveness` returning `uncertain` is treated
   as **closed** (Phase 0: a non-existent Greenhouse job ID returned `uncertain`, not
   `expired`). A failed or missing fetch means the company's status is *unknown*, not
   "no openings".
   *To clear:* each role sent to the scorer has a liveness value from a successful fetch.
5. **Gate C: visa timeline (a gate, not a vote).** Computed from the OPT/STEM end date and
   a stated hiring-lag assumption, both your-input. If the end date is missing or already
   past, the run **stops**.
   *To clear:* end date present and later than run date + hiring lag.
6. **Score.** Matching live postings become `roles.json` (shape of `ch11-roles.json`), each
   term labeled, run through `npm run score -- … --out-dir scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out`.
   The prototype refuses to write a role with a missing gate value (see §6, finding 5).
7. **Route.** Apply → tailor this application. Consider → human reads the audit row.
   No live matching posting on a confirmed board **and** sponsorship evidence → network
   list. No sponsorship evidence → skip.
8. **Gate D: release (human).** A person reads the Markdown report before any outreach
   or application. The tool never contacts anyone.

## 4. Predicted failure cases and how I will check each

| # | Case | Expected behaviour | Check |
|---|---|---|---|
| F1 | A target company is not in the CSV | `not-in-dataset`; no sponsorship value invented; not routed to network | fixture persona lists one fake company name |
| F2 | Company in CSV but sponsorship fields empty | "no trace in this data", **not** "does not sponsor" (data README says so); skip, flagged | pick a real row with empty `Total Approvals` |
| F3 | Board fetch fails (404, wrong slug, network down) | status `unknown`, reason recorded; never counted as "no openings" | fixture with a 404 response |
| F4 | Posting liveness `uncertain` or `expired` | liveness factor 0, gated Skip in the scorer | fixture + the Phase 0 fake Greenhouse ID |
| F5 | OPT end date missing or already past | run stops with a clear message, no output written | test with a past date |
| F6 | Title rule false positive (e.g. "Product Designer", "Production Engineer", "Software Developer (Product Manager)") | excluded or flagged, never silently counted | unit test on real title strings from the CSV |

## 5. Predictions about my own first pass

*[AI-drafted, for Aditya to edit before building. Replace or change anything you don't
believe; FRICTIONAL.md will record what you changed.]*

1. **The title rule will be wrong both ways on the first pass.** The CSV titles are messy
   (`'Software Developer (Product Manager)'`, `'Product Management I'`, trailing spaces).
   I expect at least one false positive and one missed real PM title in the 133.
2. **Most candidates will not reach the network list.** I expect fewer than half of the
   candidates to have a board I can confirm on Greenhouse, Lever or Ashby. The rest end as
   "human check", which makes the useful output smaller than the 133 suggests.
3. **The timeline gate will almost never close** for this persona (≈3-year runway), so the
   skip rate will come almost entirely from sponsorship and liveness. If the run skips
   under half, the cause will be the sponsorship tier thresholds, not the gates.
4. **Funding will not affect any decision.** The scorer has no funding term (only
   sponsorship, fit, role_quality), and the data's median funding age is about 5.9 years
   (newest 2025-09-26, per the data audit). Funding can only order the network list, and
   "recently funded" will be rare.
5. **`fit` has no honest source yet.** Without an AI judgment, fit can only be the title
   rule's match, labeled your-input. With sponsorship weight 0.35 and fit 0.30, a role
   needs strong values on both to reach the 0.30 Apply threshold. I expect few Applies.

## 6. Facts that bite, and how this plan handles them

| Fact | Applies? | Handling |
|---|---|---|
| 1. `role_quality` weight is 0.0 | Yes | Not used as a vote. OEWS medians shown in the report as context, labeled record, affecting nothing. |
| 2. `bls:local-wage` feeds nothing | Yes | Not used. Noted as out of scope. |
| 3. Only SEC samples ship | Yes | Form D samples overlap **0** companies with the CSV (checked 2026-10-03), so funding comes from the CSV's own columns. Stated in the recipe. |
| 4. `data/raw/`, `data/verified/`, `logs/gate-decisions/` don't exist | Yes | Gates write to my own folder and `logs/runs/2026fa-AdityaHasija37-1.md`. |
| 5. `snickerdoodle` CLI isn't real | Yes | No commands use it. |
| 6. All top-level recipes are DRAFT | Yes | Target `RUNNABLE-SAMPLE` at most; `attestation: null`. |
| 7. `bls:local-wage` fails on fresh clone | Not used | — |
| 8. `validate-h1b-join-sample.py` needs full data | Not used | — |

Additional engine facts found in Phase 0 (details in FRICTIONAL.md): the scorer treats a
missing gate as open (factor 1); the scorer cannot be imported (no exports, runs on load);
liveness returns `uncertain` for a non-existent posting.

## 7. Open decisions before building

- [ ] Sponsorship tier thresholds (§2) — needs a written reason.
- [ ] Title / seniority rule (§1, §2) — include Senior PM or not?
- [ ] Hiring-lag assumption for Gate C (e.g. 60 or 90 days) — your-input.
- [ ] Whether `fit` stays a title-rule value or is left out of the scorer input.

---

## Revisions

*(append dated entries here; do not edit the sections above)*

### 2026-10-03 — Decisions on §7 (before any coverage measurement or code)

| Decision | Result | Decided by | Reason |
|---|---|---|---|
| Senior Product Manager | **Included** by default (setting can turn it off) | Aditya | 3.5 years of experience is within range for Senior PM at many startups |
| Sponsorship tiers | **Two tiers.** Proven: ≥10 approvals **and** ≥90% approval rate → p 0.9. Likely: 3–9 approvals, **or** ≥10 approvals with rate < 90% → p 0.6. 1–2 approvals or none → no tier, skipped | Aditya (chose "two tiers" and the edge case from options the AI offered) | 1–2 approvals is too thin to trust: it could be a one-off, not a repeatable process for product hires |
| Hiring lag for Gate C | **60 days** | Aditya | — |
| `fit` value | Constant **0.7** for any posting whose title passes the title rule, labeled **your-input**; postings that fail the rule are not scored at all | AI (Aditya delegated: "do as you feel right") | No AI judgment is used, so fit can only say "the title qualifies". 0.7 matches the fit value in `data/examples/ch11-roles.json`. Because it is constant, fit does not rank roles; it only lets a Proven sponsor reach Apply (0.9·0.35 + 0.7·0.30 = 0.525) and puts a Likely sponsor at 0.42, which the scorer marks Consider because of the soft tier. |

### 2026-10-03 — Prediction #2, my own estimate (§5 kept as originally drafted)

The AI-drafted §5 #2 said fewer than half of candidates would have a confirmable board.
**My own prediction (Aditya): 50–75%** of the companies with sponsored product titles will
have a board on Greenhouse, Lever or Ashby. Recorded before the measurement was run.

The other §5 predictions (#1, #3, #4, #5) I accepted as drafted, without edits.

### 2026-10-03 — Coverage measured (checks prediction #2)

Method (ad-hoc, not part of the prototype; script and output kept outside the repo):
apply the decided title rule and two-tier threshold to the CSV, derive a board slug from
each company's `website` domain, and request the public Greenhouse, Lever and Ashby
listing APIs for that slug.

| Measure | Result |
|---|---|
| Candidates (≥3 approvals + a product title passing the rule) | **91** (Proven 69, Likely 22) |
| Board found at the slug guess | **32 of 91 (35%)**: Greenhouse 23, Ashby 6, Lever 3 |
| Board found but 0 open jobs | 4 |
| Inconclusive (non-404 error) | 0, on the second attempt (see below) |

**Prediction check.** My prediction (50–75%) was **wrong**; the AI-drafted one (< 50%)
held. Caveats in both directions: a slug hit is not proof it is the same company (that is
what Gate A is for), and a miss is not proof the company has no such board (its slug may
differ from its domain). So 35% is an estimate of what an automatic slug guess finds, not
of true coverage.

**First attempt failed silently.** The first run reported 0 of 91 because Python's
`urllib` could not verify SSL certificates on this Mac, and the script counted every
failed request as "no board". Rerun with `curl`, counting errors separately. This is the
exact failure F3 guards against, and it happened in my own measurement.
