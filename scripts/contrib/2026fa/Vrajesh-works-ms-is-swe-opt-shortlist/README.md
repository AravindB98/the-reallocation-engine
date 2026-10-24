---
owner: Vrajesh-works
term: 2026fa
component: ms-is-swe-opt-shortlist
status: DRAFT
promoted_to: null
---

# ms-is-swe-opt-shortlist (prototype)

This small program takes a list of companies you are considering for an entry-level software engineer job, looks each one up in the repository's sponsorship data, applies an OPT countdown from dates you type, and has the existing scorer say Apply, Consider or Skip. It writes a report for you and a log for an agent. It never checks that a posting is live; you do that and type the result in. Read `recipes/cases/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist.card.md` for what it can and cannot verify.

## Run (from the repo root)

```bash
node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
  --postings <postings.json> --as-of 2026-10-02 --opt-start 2027-01-15 \
  --out-dir course/2026fa/submissions/Vrajesh-works/runs
```

Options: `--hiring-lag-days` (default 45), `--unemployment-days` (default 90), `--fit` (default 0.5), `--soc` (default 15-1252), `--csv`, `--soc-csv`. The dates above are the committed persona's; use your own real dates only on your machine and never commit them.

Postings file shape (`liveness` stays `null` until you have run `npm run ats:liveness -- <url>`; add `"excluded_reason": "..."` if you read the posting and it rules you out, e.g. citizenship required; strip tracking parameters such as `jr_id` from URLs before saving):

```json
[{"company": "EXAMPLE PROVEN SOFT INC", "title": "Software Engineer", "url": "https://example.invalid/jobs/1",
  "liveness": {"status": "live", "checked_on": "2026-10-01"}}]
```

### Two tracks

By default a posting is scored on H-1B sponsorship history. For a role you would take on OPT **without** sponsorship (for example a contract role), add `"track": "opt-bridge"` (and optionally `"employment_type": "contract"`). That posting is checked only for a live posting and timeline room, gets no sponsorship score, and never goes to the scorer. You still confirm eligibility with your school's international office and the employer.

## Test (offline, no network)

```bash
node --test scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.test.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/
```

## Files

- `shortlist.mjs` — the program; calls `scripts/score/role-scorer.mjs`, never a copy.
- `shortlist.test.mjs` — 17 tests; boundary cases for tiers, the countdown, liveness, impossible dates, human-excluded postings and the OPT-bridge track.
- `fixtures/` — fictional companies (`EXAMPLE ...`) and `.invalid` URLs. The liveness values in the fixture are **not** real checks.
