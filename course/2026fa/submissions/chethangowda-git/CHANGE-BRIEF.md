# Change brief: AI Engineer co-op to H-1B triage

## Executive summary

**What this is.** A plan written *before* building, for a small recipe that helps a graduate student decide which AI Engineer roles deserve their limited application time. The student wants a Spring co-op that could turn into a full-time job needing visa sponsorship.

**Why read it.** It says, in advance, what the tool will check, where it must stop for a human, and how it is expected to fail. That way the finished tool can be judged against what was promised, not against what happened to work.

**What it decides.** The tool will check only one hidden signal from real records: whether a company has a history of sponsoring work visas. Whether a co-op actually turns into a full-time offer is **not** in any data this project has, so the tool will say so instead of guessing. A posting that cannot be confirmed as live, or a start date that does not fit the student's timeline, stops the role before it is scored.

## Run record

- Author: chethangowda-git · written 2026-10-03, before any prototype code
- Recipe (planned): `recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md` + `.card.md`
- Prototype (planned): `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/`
- Planned lifecycle claim: `DRAFT` (open question to TA: may a recipe with typed TODOs claim RUNNABLE-SAMPLE?)

## 1. Career situation and engine layers

- **Persona:** fictional, based on `search/examples/priya-nair/` (MS Information Systems, AI Engineer target, past AI Engineer co-op, `needs_sponsorship: true`).
- **Mismatch, stated:** Priya's profile is a *graduate on F-1 OPT* (OPT end 2027-01-31). This recipe treats her as a *current student* seeking a Spring co-op starting Jan 2027. That adjustment lives only in the prototype's input as `your-input`; no persona file is created or edited.
- **Two full-time start scenarios (your-input):**
  - *No co-op path:* full-time start May 2027.
  - *Co-op path:* co-op Jan 2027, then full-time start Sep 2027.
- **Target occupations (SOC):** 15-1252 Software Developers, 15-2051 Data Scientists, 15-1221 Computer and Information Research Scientists. Mapping a posting title to one of these is a **model-judgment**.
- **Engine layers drawn on:** 80 Days to Stay (sponsorship history, a vote); Job-Ops (liveness, a gate); the visa-timeline gate; the existing Ch.11 scorer. Role quality (BLS) is not used in the score. The scorer weights it 0.0.

## 2. Existing data and scripts reused (exact paths)

| What | Path | Use |
|---|---|---|
| Sponsorship history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | columns `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` only. **Never copy** `phone`, `executive_officers`, `board_directors`. |
| Scorer | `scripts/score/role-scorer.mjs` via `npm run score -- <roles.json> --out-dir <dir>` | run as CLI, never copied or edited |
| Input shape | `data/examples/ch11-roles.json` | shape the prototype's `roles.json` must match |
| Persona | `search/examples/priya-nair/profile.yml` | read only, base persona |
| Liveness tool | `npm run ats:liveness -- <url>` | **failed here** (Playwright browser missing), so liveness comes from a recorded value or human check |

## 3. Proposed, not in the repo

- `[TODO: DEV]` automated liveness inside the prototype (blocked by the Playwright failure above).
- `[TODO: DATA SOURCE]` co-op-to-full-time conversion data per company. The repo has none. Without it the recipe cannot verify conversion and will not invent a signal.
- `[TODO: DEV]` a sponsorship-by-role filter. The CSV has only free-text `top_job_titles_sponsored`, no per-SOC counts.

## 4. Gates (hard stops) and what a human needs to see

| Gate | Stops when | Human needs to see |
|---|---|---|
| G1 company-in-record | company not found in the 80 Days CSV | the exact name searched and "not found"; no sponsorship value invented |
| G2 gate-values-present | a role's liveness or timeline value is missing | which role and which field; the role is not sent to the scorer |
| G3 liveness | liveness factor ≤ 0.05 (scorer's closed-gate threshold) | the recorded liveness source (date checked, by whom) |
| G4 timeline | timeline factor ≤ 0.05 for the chosen scenario | which scenario (May 2027 / Sep 2027) and why it fails |
| G5 human decision | every run | the Markdown report; the human decides Apply / network / skip |

## 5. Predicted failure cases and how each will be checked

- Failure case 1: a company missing from the 80 Days CSV — the prototype must report it as missing, not guess its sponsorship.
- Failure case 2: a role with a missing gate value (liveness or timeline) — the prototype must stop it before the scorer, since the scorer treats a missing gate as open.

Check for each: an offline fixture that contains the case; the test asserts the role is reported as missing/stopped and does not appear in the scorer input.

## 6. Prediction about the first pass

- First-pass prediction: the prototype may miss timelines, because there are two paths — with co-op (Jan 2027 → full-time Sep 2027) and without (full-time May 2027) — and a single timeline gate may only handle one.

## 7. Domain need

- Domain need: for the co-op path, the persona needs companies with a good co-op-to-full-time conversion record AND H-1B sponsorship history.

## Revisions

*(Added after building. The original predictions above are not edited.)*
