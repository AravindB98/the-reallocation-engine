# CHANGE-BRIEF — Level-matched sponsorship + OPT-clock triage for a December-2026 graduate

## Executive summary

This is my prediction record, written **before** I built anything. It says who the recipe is for, which data and scripts it reuses, where it stops for a human decision, and what I expect to go wrong. A student graduating in December with a master's degree and two years of prior work experience can't easily see whether a company that "sponsors H-1Bs" has sponsored the junior software titles they can actually get. They also can't see whether the hiring timeline lands inside their OPT unemployment window. The recipe makes that visible from shipped records, and it refuses to guess when the record is missing. My original predictions below stay as written. Later revisions go in the dated section at the bottom.

---

## 1. Career situation

**Who:** an F-1 international student finishing an M.S. (STEM-designated) in **December 2026**, who will apply for post-completion OPT. They target **entry/early-career software engineering roles (SOC 15-1252, Software Developers) in Greater Boston**. Titles: Software Engineer I/II, Associate SWE, Software Developer. They have **~24 months of pre-master's industry experience**.

**Why that combination is specific:**

- A December graduation falls **between campus hiring cycles**. "New Grad 2026" programs often closed in spring, and some "2027" programs list a graduation window (e.g. "Spring 2027") that excludes December 2026. The title alone doesn't tell you.
- Two years of experience **disqualifies** this student from many campus programs that cap prior experience (e.g. "less than 6 months"). So the realistic lane is non-program SWE I / SWE II roles.
- They need **H-1B sponsorship eventually**. Many companies in the sponsorship data sponsor only *senior* software titles. That kind of company is weak evidence for a SWE I candidate.
- The OPT unemployment clock (90 days on post-completion OPT, per 8 CFR 214.2(f)(10)(ii)(E)) starts at the EAD start date. A role whose hiring lag pushes the start date past that window is not a real option, however good it looks.

The persona used in all committed files is **fictional** (see §6). The situation is real; the person in the fixtures is invented.

**Engine layers used:** *80 Days to Stay* (sponsorship history, plus a funding-date context field) is the main one. *Job-Ops* provides liveness, through the saved output of the existing `npm run ats:liveness`. *The Cognitive Pivot* (BLS OEWS 15-1252 national median) is used **as report context only, outside the scorer** (see Fact 1).

## 2. What I reuse (exact paths) and what I propose

| Reused | Path | Use |
|---|---|---|
| 80 Days master CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `state`, `city`, `latest_funding_date`, `latest_funding_stage`, `median_salary_offered` |
| Form D samples | `data/sec/form-d/processed/sample/companies-sec-*.sample.json` | context only: "is this company in the shipped sample?" Absence is **not** evidence of no filing (Fact 3) |
| BLS compact | `data/bls/compact/soc_occupation_compact.csv` | national 15-1252 median, report context only (Facts 1, 2) |
| Liveness checker | `npm run ats:liveness -- <url>` (`scripts/ats/check-liveness.mjs`) | run by the human/agent with network. The prototype **parses its saved output** and never calls the network itself |
| Scorer | `scripts/score/role-scorer.mjs` (`npm run score -- … --out-dir …`) | the composite and the Apply/Consider/Skip decision. **Not re-implemented** |

**Proposed (new, in my namespace only):**

- `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/` holds a small Node script. It (a) resolves each candidate company to exactly one 80 Days row by exact normalized name (no fuzzy matching), (b) derives a **level-matched sponsorship tier** from the sponsored-title list, (c) computes a **December-grad timeline factor**, (d) reads liveness from a saved `ats:liveness` log, (e) writes a scorer-shaped `roles.json`, (f) runs the existing scorer, and (g) writes a JSON agent log plus a Markdown human report. **Why it belongs:** the repo's sponsorship signal is company-level. Nothing in the repo asks "did they sponsor *this level* of *this* occupation", and nothing computes the timeline factor from OPT dates. Ch.11's example types the timeline factor in by hand.

## 3. Gates (hard stops) and what the human needs to clear each

| Gate | Testable condition | Human needs to see |
|---|---|---|
| G0 Inputs | scenario JSON parses; persona has `program_end_date`, `opt_start_date`, `unemployment_ceiling_days`; CSV exists at the path above | the persona block echoed in the report |
| G1 Company resolution | exactly one CSV row for the normalized name (state used only to break a tie) | the matched `company_name`, city, state, so they can confirm it's the right entity |
| G2 Sponsorship record exists | `Total Approvals` is non-blank | if blank: **not scored**. The human checks the USCIS H-1B Employer Data Hub by hand |
| G3 Liveness (gate) | the posting URL appears in the saved `ats:liveness` log as `active` | the log line, and the date it was run |
| G4 Timeline (gate) | graduation window includes Dec 2026 (if stated); experience cap ≥ 24 months (if stated); required start ≥ OPT start; expected start ≤ OPT start + remaining unemployment days − buffer | each input labeled your-input, with the arithmetic shown |
| G5 Decision handoff | scorer output written; every Apply/Consider row has a next action | the human report. **The human decides whether to apply.** The run never applies anything |

## 4. Predicted failure cases and how I'll check each

1. **Company missing from the CSV** (e.g. a large Boston employer like HubSpot is not in this SEC-Form-D-derived file). Expected: `missing: no-company-match`, not scored, no sponsorship number invented. Check: a fixture row and a real scenario row with a name not in the CSV.
2. **Company in CSV but sponsorship blank.** About 95% of rows (28,812 of 30,369 when I counted) have blank `Total Approvals`. Expected: `missing: no-sponsorship-record`, not scored as 0. Check: fixture plus a real MA company with blank approvals.
3. **Ambiguous name.** The normalized names collide (I counted 209 duplicate normalized names). Expected: `missing: ambiguous-company-match` unless the state breaks the tie. Check: a fixture with two same-named rows.
4. **Posting 404s / expired, or the URL isn't in the liveness log.** Expected: an expired posting → liveness 0 → scorer Skip (gated). A URL absent from the log → `missing: no-liveness-record`, not scored. Check: fixture log lines plus one real expired URL if I can find one.
5. **OPT date already past / start too late.** Expected: timeline factor 0, with reason `unemployment-clock-exceeded` (or `start-before-work-authorization` when the posting needs a start before the EAD). Check: run the same scenario with a later `--as-of` date.

## 5. Prediction about what the first pass will get wrong

I predict the **title-level classifier** will be the weak point:

- the senior-marker regex will misclassify some titles (e.g. "Software Engineer III", or "Lead" inside a non-leadership title);
- titles like "Software Engineer/QA" or "Applications Software Engineer" will make me decide what "the SWE family" means;
- `top_job_titles_sponsored` is a **top-N list** (max 14 titles in this file). A company that sponsored junior SWEs that didn't make the top list will be under-tiered as "Possible". The prototype can't detect that.

I also predict that on the first pass I'll forget at least one path where a value gets silently defaulted rather than reported missing.

## 6. Privacy plan

Fictional persona only ("Kiran Rao", no email or phone in the fixture; any contact field would use `@example.com` / 555). No reading from `private/`, `search/resume.json`, or `data/ats/` in committed code. The persona file is **not** named `profile.yml` (that filename trips the resume-shaped check outside `search/examples/`).

---

## Revisions (appended after building; originals above are unchanged)

**2026-10-01, after the first build and the worked run.** How each prediction held up:

| Prediction | Outcome |
|---|---|
| §4.1 company missing → `no-company-match` | **Held.** HubSpot: 0 rows; not scored. |
| §4.2 blank sponsorship → `no-sponsorship-record`, not 0 | **Held.** DraftKings (MA row, blank approvals). |
| §4.3 ambiguous names | **Held, on fixtures only.** No real scenario row hit a duplicate name. |
| §4.4 posting 404 → liveness 0 → gated Skip | **Wrong for real data.** A dead Greenhouse job ID does not 404. It redirects to the company careers page with HTTP 200, and the checker returns `uncertain` (timeout). The recipe handles this as Not scored. The gated-Skip path is exercised only by a fixture. |
| §4.5 OPT date past → timeline 0 | **Held.** `--as-of 2027-02-15 --days-used 42` gives all 7 scored roles `unemployment-clock-exceeded`. I added `--days-used` because the first design could only express a late run with a stale persona. |
| §5 title classifier is the weak point | **Held.** "Software Engineering Manager" was counted as a senior SWE title, tiering Ginkgo Bioworks Likely instead of Possible. Fixed with a management-title rule. The top-N truncation risk is unchanged and can't be detected. |
| §5 "a value will be silently defaulted" | **Held, in a gate.** My own spread-order bug left `timeline.factor` undefined. The scorer defaulted it to 1 (`?? 1`), so the bug produced identical output. Fixed, and a guard added. |

**New gate not in the original brief:** a posting that states it will not sponsor overrides a historical sponsorship record. I found this on Ginkgo's live SWE 2 posting (122 recorded approvals; the posting says "We are unable to sponsor or take over sponsorship of H-1B visas at this time."). It is implemented through the scorer's existing override (decision + documented reason), not a new mechanism.

**Unpredicted scorer behavior:** a Proven sponsor alone scores 0.315, which clears the 0.30 Apply threshold at any fit. Logged as a maintainer TODO, not patched.
