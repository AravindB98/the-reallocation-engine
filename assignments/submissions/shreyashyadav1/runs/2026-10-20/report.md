# Health/insurance applied-AI roles — OPT-gated triage (2026-10-20)

## Executive summary

This run looked at 32 public job boards (0 failed to load) holding 1729 open offers. 162 are software-type titles, but 48 of those sit at 10 companies the sponsorship data cannot identify, so they were not scored. Of the rest, 96 ask for a seniority this student does not have and 8 are outside the U.S.; of the postings read, 0 state a citizenship, clearance or U.S.-person requirement and 1 ask for more years of experience than this student has. 9 postings were opened in a browser to see whether they are still live (9 active, 0 expired, 0 unclear). **Result: Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 · excluded before scoring 105.**

2 roles the scorer would call Apply were held at Consider: sponsorship alone cleared the scorer's bar, but the fit is below your Apply floor of 0.6. Both recommendations are shown.

Roles marked BLOCKED were never scored, because something a person has to check is missing: a company the data cannot identify, a posting nobody could read or open, or evidence that is too old. Sponsorship history comes from a data file of company records, turned into a tier by a rule the author chose, so read the tier as a judgment, not a fact. The timeline check uses your own work-authorization dates. Whether a posting is still open was read by the repository's own browser checker on the day of the run. Funding is shown for context only, because the repository's scoring script has no funding input. No language model was used.

> Planning aid, not legal advice. STEM OPT eligibility, E-Verify status and unemployment-day counts are confirmed with your DSO, not by this report.

## Your clock (your-input)

EAD start 2027-01-11 · authorization end (EAD start + 364 days) · unemployment used 0/90 · buffer target 30 days · STEM extension planned: yes (ceiling stays 90 until it is approved).

**Break-even, whatever any company's estimate says:** a hiring loop of up to 143 days keeps the timeline factor at 1. From 144 days the factor starts to fall, the scorer treats the gate as closed from 172 days, and it reaches 0 at 173 days. Compare that with the estimate each row uses: the estimate is the weakest input in the gate, the break-even is not.

**Data horizon:** the funding data ends 2025-09-26, 13 months before this run. A company may have raised money since; "not recent" below means "not recent in this data", not "stale".

## How many roles survived each gate

| Step | Count | What it means |
|---|---|---|
| Boards scanned | 32 (failed: 0) | Greenhouse, Lever, Ashby only. A failed board is reported, not counted as empty. |
| Open offers | 1729 | Everything on those boards, every function. |
| Software-type titles | 162 | Same title rule as the sponsored-title proxy, minus QA, firmware, field service and sales engineering. |
| …at companies the data cannot identify | 48 (10 boards) | Not found, ambiguous, or a sibling row holds the approvals. Never fuzzy-matched. |
| …excluded by title level | 96 | Senior, staff, principal, lead, manager and the like. |
| …outside the U.S. | 8 | OPT work has to be in the U.S. |
| …over the per-board cap | 0 | Logged, not silent. |
| Posting text read | 10 (missing: 0) | Missing text means BLOCKED, not "no requirement". |
| …state a citizenship / clearance / U.S.-person requirement | 0 | Excluded, with the quote. |
| …ask for more years of experience than this persona has | 1 | Excluded, with the quote (persona.max_years_experience_ok). |
| Liveness checked | 9 | active 9 · expired 0 · uncertain 0 |
| Reached a gate or the scorer | 9 | Apply 0 · Consider 8 · Skip 1 · BLOCKED 0 |

## Decisions (roles that reached a gate or the scorer)

| Role | Decision | Composite | Sponsorship tier | Fit | Timeline (start → unemployed days) | Liveness | Flags | Next action |
|---|---|---|---|---|---|---|---|---|
| Omada Health — Software Engineer II, Solutions Engineering | **Consider** | 0.465 | Proven p=0.9 | 0.5 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years (range up to 5); scorer said Apply; held at Consider: fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Coalition — Frontend Engineer, Underwriting | **Consider** | 0.435 | Proven p=0.9 | 0.4 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years; scorer said Apply; held at Consider: fit 0.4 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Billing Agents | **Consider** | 0.270 | Unknown | 0.9 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Voice Agents | **Consider** | 0.270 | Unknown | 0.9 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years (range up to 4) | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Fullstack Engineer, Ambient AI | **Consider** | 0.240 | Unknown | 0.8 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | — | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, AI Integrations | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 2+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, AI Billing | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 3+ years | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Commure — Software Engineer, Scribe AI | **Consider** | 0.210 | Unknown | 0.7 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | asks 1+ years (range up to 4); posting invites new grads | 3h network: Find a contact first; confirm sponsorship for this role type and E-Verify, then decide. |
| Kin Insurance — Software Engineer, Back-End Focus | **Skip** | 0.150 | Unknown | 0.5 | 1.000 (2027-01-12 → 1d; est 84d) | 1 [record, 2026-10-20] | board "kin" does not match the CSV website kininsurance.com: confirm this board belongs to that company; no-sponsorship wording in the posting | skip: Skip. Time is better spent elsewhere. |

## Boards the engine could not score

Text after a dash under "Why it stopped" is the author's own note. What it says about the CSV can be looked up in the CSV; what it says about the companies themselves (public, acquired, a different business) is outside knowledge or judgment, and this run did not check it.

| Company | Offers | Software-type | Why it stopped | What a human can do |
|---|---|---|---|---|
| Oscar Health | 247 | 14 | entity-not-found: no CSV row for "Oscar Health, Inc." — probably because it is a public company (outside knowledge, not checked here) and the dataset is Form D based | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Clover Health | 57 | 4 | entity-not-found: no CSV row for "Clover Health Investments, Corp." — CSV has Clover Software Inc (cloversoftware.com) and Clover Intelligence Inc (no website): different names, so not treated as this company; not checked further | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Komodo Health | 23 | 4 | entity-not-found: no CSV row for "Komodo Health, Inc." | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Pie Insurance | 27 | 1 | entity-not-found: no CSV row for "Pie Insurance Holdings, Inc." | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Sword Health | 52 | 8 | entity-not-found: no CSV row for "Sword Health, Inc." — CSV has only Sword Diagnostics Inc (sworddiagnostics.com): a different name and website, so not treated as this company; not checked further | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Suki | 11 | 2 | entity-not-found: no CSV row for "Suki AI, Inc." | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Abridge | 42 | 2 | entity-not-found: no CSV row for "Abridge AI, Inc." — CSV has only Abridged Inc (abridged.com): a different name and website, so not treated as this company; not checked further | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Headway | 89 | 7 | entity-not-found: no CSV row for "Headway, Inc." — CSV has only Headway Sales Inc (headwaysales.com, Business Services): a different name and website, so not treated as this company; not checked further | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Cedar | 1 | 0 | entity-not-found: no CSV row for "Cedar, Inc." — CSV has Cedar Cares Inc; not shown to be the same company | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |
| Candid Health | 36 | 6 | entity-not-found: no CSV row for "Candid Health, Inc." | Decide which legal entity employs the engineers; look for its H-1B history outside this dataset (DOL LCA, USCIS data hub). |

## Excluded before scoring

### level (96)

| Role | Location | Why |
|---|---|---|
| Omada Health — Senior Software Engineer, AI Transformation | Remote, USA | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Omada Health — Senior Software Engineer, Data & AI Platform | Remote, USA | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Omada Health — Senior Software Engineer, Data Engineering | Remote, USA | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Omada Health — Senior Software Engineer, Solutions Engineering | Remote, USA | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Omada Health — Staff Software Engineer | Remote, USA | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Veracyte — Manager Software Test Automation | Remote ; San Diego, California, United States; South San Francisco, California, United States | title level "manager" is excluded for this persona (persona.exclude_levels) |
| Veracyte — Senior Systems Engineer, IVD Software  | South San Francisco, California, United States | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Veracyte — Software Development Manager | Remote ; San Diego, California, United States; South San Francisco, California, United States | title level "manager" is excluded for this persona (persona.exclude_levels) |
| Veracyte — Sr. Manager, Data Engineering  | Remote ; San Diego, California, United States | title level "sr" is excluded for this persona (persona.exclude_levels) |
| Welbe Health — Senior Software Engineer | Remote, CA, USA | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Principal Software Engineer, Experimentation Platform | New York, NY; Silicon Valley, CA | title level "principal" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Senior Platform Engineering Manager  | New York, NY; Silicon Valley, CA; USA Remote | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Senior Site Reliability Engineer | New York, NY; USA Remote | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Senior Software Engineer, Data | New York, NY | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Senior Software Engineer, Provider Engagement | New York, NY | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Senior Staff Software Engineer, Interop | New York, NY | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Platform Engineer, AI Enablement  | New York, NY | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Software Engineer, Appointment Management | New York, NY; Silicon Valley, CA | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Software Engineer, Marketplace Acquisition | USA Remote | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Software Engineer, Marketplace Insurance | New York, NY; USA Remote | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Software Engineer, Provider Engagement  | New York, NY; Silicon Valley, CA; USA Remote | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Zocdoc — Staff Software Engineer, Spend Management  | New York, NY; USA Remote | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Flatiron Health — Senior Software Engineer | London office | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Flatiron Health — Senior Software Engineer (m/w/d) | Berlin office | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Site Reliability Engineer | Any location, Canada | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Site Reliability Engineer | Any location, United States | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Software Engineer, Scanning Engine | Any location, United States | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Software Engineer, Scanning Engine | Any location, Canada | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Software Engineer, Underwriting | Any location, United States | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Senior Software Engineer, Underwriting | Any location, Canada | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Data Engineer | Any location, Canada | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Data Engineer | Any location, United States | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Software Engineer, Auth/Accounts | Any location, Canada | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Software Engineer, Auth/Accounts | Any location, United States | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Software Engineer, Security Engineering | Any location, Canada | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Coalition — Staff Software Engineer, Security Engineering | Any location, United States | title level "staff" is excluded for this persona (persona.exclude_levels) |
| Cohere Health — Lead Software Engineer - Integrations  | United States | title level "lead" is excluded for this persona (persona.exclude_levels) |
| Cohere Health — Senior Data Engineer | Hyderabad, Telangana, India | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Cohere Health — Senior Manager, Data Platform Engineering | United States | title level "senior" is excluded for this persona (persona.exclude_levels) |
| Cohere Health — Sr.AI Engineer | Hyderabad, Telangana, India | title level "sr" is excluded for this persona (persona.exclude_levels) |
| …and 56 more | | full list in run-log.json |

### location (8)

| Role | Location | Why |
|---|---|---|
| Coalition — Frontend Engineer, Underwriting | Any location, Canada | location "Any location, Canada" is outside the U.S.; OPT work must be in the U.S. |
| Coalition — Software Engineer, AI Automation | Any location, Canada | location "Any location, Canada" is outside the U.S.; OPT work must be in the U.S. |
| Cohere Health — Software Engineer | Hyderabad, Telangana, India | location "Hyderabad, Telangana, India" is outside the U.S.; OPT work must be in the U.S. |
| Cohere Health — Software Engineer II, BI | Hyderabad, Telangana, India | location "Hyderabad, Telangana, India" is outside the U.S.; OPT work must be in the U.S. |
| Lemonade — Backend Engineer - ML Platform | TLV | location "TLV" is outside the U.S.; OPT work must be in the U.S. |
| Commure — Software Engineer, Athelas Home | Sao Paulo, Brazil | location "Sao Paulo, Brazil" is outside the U.S.; OPT work must be in the U.S. |
| Commure — Software Engineer, AI Billing (Brazil) | Rio de Janeiro, Brazil | location "Rio de Janeiro, Brazil" is outside the U.S.; OPT work must be in the U.S. |
| Commure — Software Engineer (India) | Bengaluru, India | location "Bengaluru, India" is outside the U.S.; OPT work must be in the U.S. |

### experience (1)

| Role | Location | Why |
|---|---|---|
| Coalition — Software Engineer, AI Automation | Any location, United States | the posting asks for 5+ years of experience; persona.max_years_experience_ok is 3 |

## Why, role by role (every term labeled)

### Omada Health — Software Engineer II, Solutions Engineering

- **Decision:** Consider — held at Consider: the scorer said Apply (composite 0.465 ≥ 0.3, gates healthy); fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) · `(0.9·0.35 + 0.5·0.3) × 1 × 1 = 0.465`
- **Posting** [record, ats-provider:greenhouse]: https://job-boards.greenhouse.io/omadahealth/jobs/8047423 · Remote, USA (us)
- **Industry** [record]: Other Health Care
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals 20, denials 0, rate 100; sponsored titles: Senior Android Software Engineer; Senior Data Analyst
- **Titles matching the 15-1252 rule** [your-input rule]: Senior Android Software Engineer
- **Tier** [your-input rule over record]: Proven — approvals, approval rate and a 15-1252-like sponsored title all clear the rule
- **Funding** [record]: Series C on 2015-07-10 (135 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.5 — general software engineering
- **Posting text** [record, phrase match; 7245 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 3+ years: "…internal teams in their investigations. About you: 3–5 years writing readable, tested, and efficient production code We…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 3+ years (range up to 5); scorer said Apply; held at Consider: fit 0.5 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3).
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Coalition — Frontend Engineer, Underwriting

- **Decision:** Consider — held at Consider: the scorer said Apply (composite 0.435 ≥ 0.3, gates healthy); fit 0.4 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3) · `(0.9·0.35 + 0.4·0.3) × 1 × 1 = 0.435`
- **Posting** [record, ats-provider:greenhouse]: https://www.coalitioninc.com/job-posting?gh_jid=4734028005 · Any location, United States (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals 76, denials 0, rate 100; sponsored titles: Reserving Actuarial Analyst; Senior Data Science Engineer; Data Scientist; Software Developer; Operations Research Analyst (Senior Data Scientist)
- **Titles matching the 15-1252 rule** [your-input rule]: Software Developer
- **Tier** [your-input rule over record]: Proven — approvals, approval rate and a 15-1252-like sponsored title all clear the rule
- **Funding** [record]: Series D+ on 2022-06-24 (52 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.4 — adjacent engineering
- **Posting text** [record, phrase match; 7182 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 2+ years: "…to the technical roadmap. Skills and Qualifications Two or more years of professional software development experience, with a…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 2+ years; scorer said Apply; held at Consider: fit 0.4 is below your Apply floor 0.6 (persona.apply_fit_floor, your-input); the scorer's Apply came from sponsorship alone (0.315 ≥ 0.3).
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Software Engineer, AI Integrations

- **Decision:** Consider — composite 0.210 in the Consider band [0.2, 0.3) · `(0.7·0.3) × 1 × 1 = 0.210`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/39e07152-a3d2-47c0-8c5b-36e8b3a6cdf5 · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.7 — AI or ML named in the title
- **Posting text** [record, phrase match; 5481 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 2+ years: "…or a related field, or equivalent extensive experience - 2+ years of professional software development industry experience…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 2+ years.
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Fullstack Engineer, Ambient AI

- **Decision:** Consider — composite 0.240 in the Consider band [0.2, 0.3) · `(0.8·0.3) × 1 × 1 = 0.240`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/d5f91cfa-48ab-430d-b618-ba77c82c64a2 · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.8 — applied AI or ML engineering named in the title
- **Posting text** [record, phrase match; 8968 characters read]: no citizenship, clearance or U.S.-person requirement found. Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Software Engineer, AI Billing

- **Decision:** Consider — composite 0.210 in the Consider band [0.2, 0.3) · `(0.7·0.3) × 1 × 1 = 0.210`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/727c0ce9-7d3b-43fe-8d00-05255f094db5 · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.7 — AI or ML named in the title
- **Posting text** [record, phrase match; 5908 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 3+ years: "…for healthcare providers and staff What You Have - 3+ years of professional software development experience, with a…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 3+ years.
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Software Engineer, Billing Agents

- **Decision:** Consider — composite 0.270 in the Consider band [0.2, 0.3) · `(0.9·0.3) × 1 × 1 = 0.270`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/feb90bb7-ad78-478c-8e3f-cde8e044d4c5 · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.9 — LLM, agent or retrieval work named in the title
- **Posting text** [record, phrase match; 6172 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 3+ years: "…onboard and level up teammates What You Have - 3+ years building full-stack applications, with a track record of…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 3+ years.
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Software Engineer, Scribe AI

- **Decision:** Consider — composite 0.210 in the Consider band [0.2, 0.3) · `(0.7·0.3) × 1 × 1 = 0.210`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/259988fe-0389-461f-823c-36d81840d465 · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.7 — AI or ML named in the title
- **Posting text** [record, phrase match; 3875 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 1+ years: "…or a related field, or equivalent extensive experience - 1–4 years of professional software development experience. Strong new…"; invites new grads: "…of professional software development experience. Strong new grads who can show they pick up new technologies quickly are…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 1+ years (range up to 4); posting invites new grads.
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Commure — Software Engineer, Voice Agents

- **Decision:** Consider — composite 0.270 in the Consider band [0.2, 0.3) · `(0.9·0.3) × 1 × 1 = 0.270`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/commure/0e3440aa-4ddc-4a43-b4c3-804e60a1b2ff · Mountain View, CA (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Seed on 2024-05-23 (29 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.9 — LLM, agent or retrieval work named in the title
- **Posting text** [record, phrase match; 4291 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: asks for 2+ years: "…observability, and release readiness. What You Have - 2–4 years of backend software experience, primarily in Python. -…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: asks 2+ years (range up to 4).
- **Next action** (3h network): Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.

### Kin Insurance — Software Engineer, Back-End Focus

- **Decision:** Skip — composite 0.150 < 0.2 — time is better spent elsewhere · `(0.5·0.3) × 1 × 1 = 0.150`
- **Posting** [record, ats-provider:ashby]: https://jobs.ashbyhq.com/kin/56db2161-84b4-42ab-b1c6-adae6c1f325c · Remote (United States) (us)
- **Industry** [record]: Other Technology (outside the target sector list — kept because you chose it)
- **H-1B record** [record, data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv]: approvals —, denials —, rate —; sponsored titles: —
- **Titles matching the 15-1252 rule** [your-input rule]: none
- **Tier** [your-input rule over record]: Unknown — Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.
- **Funding** [record]: Series A on 2024-01-17 (33 months ago); Form D sample: no hit (samples hold 50 companies/quarter) → not-recent-in-dataset [your-input rule: ≤ 18 months; data ends 2025-09-26]. *Not a scorer term.*
- **Fit** [your-input, FIT_RULE in lib.mjs]: 0.5 — general software engineering
- **Posting text** [record, phrase match; 10292 characters read]: no citizenship, clearance or U.S.-person requirement found. Also: no-sponsorship wording: "…in a fast-moving environment. At this time, we are unable to sponsor employment visas for this role. WHO WE ARE Kin makes…". Silence is not clearance.
- **Liveness gate**: 1 [record] via scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright) on 2026-10-20
- **Timeline gate** [your-input]: 1.000 (comfortable) — today 2026-10-20 + 84 days (bucket "midsize" in persona.process_days_by_bucket (book Ch.10 worked example: startup about six weeks, mid-size about twelve weeks, large firm about five months)) → earliest 2027-01-12; cannot start before EAD 2027-01-11 → start 2027-01-12; unemployed days at start 1 vs ceiling 90 − buffer 30; auth end 2028-01-10.
- **E-Verify**: enrolment unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.
- **Read before acting**: board "kin" does not match the CSV website kininsurance.com: confirm this board belongs to that company; no-sponsorship wording in the posting.
- **Next action** (skip): Skip. Time is better spent elsewhere.

## Network, don't apply (in-sector sponsors with recent funding, not on your list)

None met the rule (Proven/Likely tier and funding inside the recency window) in your preferred states.

## Role quality (context only — not in the score)

SOC 15-1252 Software Developers: national OEWS 2024 annual median $133,080 [record, data/bls/compact/soc_occupation_compact.csv]. role-scorer.mjs weights.role_quality = 0.0 [VERIFY]; national OEWS median is context only (fact 1). It does not tell you what any of these employers pays.

## What this run could not verify

- **Any number the scorer multiplied, as a record.** Scorer terms labeled record: 9/29 (liveness only). The CSV records choose each company's tier, but the tier's p (the author's rule), fit and timeline are all your-input.
- **That a sponsored title is SOC 15-1252.** The CSV has no SOC column; the title rule is a proxy.
- **Exact H-1B counts.** 1557/1557 approval counts are even — Every approval and denial count in the CSV is even — consistent with a 2× duplication in the upstream join. Raw counts are used only against thresholds; absolute counts are not quoted as facts.
- **Recent funding beyond the CSV.** The data ends 2025-09-26. Form D sample hits: 0/9 (the shipped samples hold 50 companies per quarter; full quarters are gitignored).
- **Whether a posting is still live tomorrow.** A liveness record is one browser visit on 2026-10-20; the evidence expires after 7 days. Pages the checker could not classify are BLOCKED, not guessed.
- **That a posting without a citizenship or clearance phrase has none.** The screen matches phrases in the posting text; it cannot see a requirement stated elsewhere, in an application question, or in a later interview round.
- **E-Verify enrolment, current sponsorship policy, and how long each company really takes to hire.** A posting that mentions E-Verify is a record of the posting, not of enrolment. Process days come from your size buckets (your-input); use the break-even above to judge them.
- **Which legal entity employs the engineers.** The board-to-company link is your claim, checked only against exact names and shared websites. Acquisitions (an acquirer's board, the target's H-1B history) are invisible to the CSV.
- **Companies on Workday, iCIMS, Taleo or their own sites.** Only Greenhouse, Lever and Ashby boards are read.

*Coverage: entity matched 9/9 · scored 9 · blocked 0 · excluded before scoring 105. Scorer audit trail: `role-scores.md` in this folder.*
