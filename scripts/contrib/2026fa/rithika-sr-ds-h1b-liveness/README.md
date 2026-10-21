# rithika-sr-ds-h1b-liveness — mode

## Executive summary

This folder holds a small tool that screens job postings for a fictional international
student looking for an entry-level data scientist job with visa sponsorship. It is an
upgrade to an earlier prototype. In that prototype's real run, a job-listing site said a
job was open when the employer had removed it more than a year before, and the job was
recommended anyway. This version runs the posting check itself, keeps the checker's exact
output, and refuses to trust a job-listing site unless the employer's own page also
confirms the job is open. Any posting it cannot confirm is held back with a reason and
is never scored.

## What it does

`mode_run.py` runs these gates on each candidate role. A role stops at the first gate it
fails, and a held role is never sent to the scorer.

| Gate | Test | Held when |
|---|---|---|
| G0 inputs | files parse, dates valid, `--out-dir` inside `course/2026fa/submissions/rithika-sr/` | run stops, **exit 2**, nothing written |
| INPUT | `fit` is a number 0–1 | fit missing |
| G1 sponsorship | company in the 80 Days to Stay CSV with `Total Approvals` filled | not found, or blank record (not zero) |
| G2a liveness | `npm run --silent ats:liveness -- <url>` per URL; stdout/stderr/exit kept verbatim, parsed to active / expired / uncertain | uncertain, unparseable, or no check recorded |
| G2b aggregator | if `posting_url` is on an aggregator (`aggregators.json`), `employer_url` must be given and be `active` | `aggregator-only liveness`, or `employer page not active` |
| CLOSED (G2a/G2b) | a *deciding* page (the employer page, or a non-aggregator posting) says `expired` | not held: decision `CLOSED — posting verified closed`, no score. An aggregator saying expired never closes a role. |
| G3 timeline | visa timeline factor from the persona and `--today` | never held; factor 0 makes the scorer Skip |

G0, G1, G3 and the scorer call are **imported** from
`../rithika-sr-ds-newgrad-h1b-15-2051/triage.py` (not copied). The decision comes from the
existing `scripts/score/role-scorer.mjs`.

Outputs in `--out-dir`:

| File | Reader | Contents |
|---|---|---|
| `mode-log.json` | agent | every gate result per role, raw liveness output per URL, sha256 of every input, `--today`, the command line |
| `mode-report.md` | person | executive summary, one row per role (G1, G2a, G2b, G3, decision, score or HELD — reason, ⚠ flags), next actions |
| `roles.json`, `role-scores.json`, `role-scores.md` | scorer input/output | only the roles that cleared every gate |

## Candidates file

```json
{ "roles": [
  { "role_id": "acme-ds", "company": "Acme Inc", "title": "Data Scientist", "fit": 0.7,
    "posting_url": "https://builtin.com/job/...",
    "employer_url": "https://boards.greenhouse.io/acme/jobs/..." }
] }
```

`posting_url` falls back to `url`, so the old prototype's candidates files still load. Any
`liveness` field in a candidates file is ignored: liveness is always checked by this run
(or read from the `--offline` fixture).

## Run (from the repo root, venv active)

Network run (opens each URL in headless Chromium through `ats:liveness`):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates <candidates.json> --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/<run-name>
```

Offline run (no network; liveness read from a fixture of raw checker outputs):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/offline-demo
```

Defaults: persona = the old prototype's `fixtures/persona.example.json` (fictional Sasha
Jones); targets = the real 80 Days to Stay CSV; aggregators = `aggregators.json`.

Exit codes: `0` success; `2` stopped on bad input or an `--out-dir` outside
`course/2026fa/submissions/rithika-sr/` (message on stderr, nothing written).

## Test (offline)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

The tests use `--offline` throughout, so they make no network calls. They do run the real
scorer through `node`, and write to throwaway `.test-*` folders under
`course/2026fa/submissions/rithika-sr/mode/`, deleted afterwards.

## Offline vs network

| Part | Network? |
|---|---|
| G0, G1, G3, scorer, log, report | never (local files and `node`) |
| G2a without `--offline` | yes: one `ats:liveness` call per unique URL (Playwright, 120 s timeout each) |
| v0.2 ATS record + redirect chain without `--offline` | yes: read-only public `GET`s (see P2 note) |
| G2a with `--offline` | never: raw outputs and HTTP responses come from the fixture; a URL missing from it is held |

### P2 note: read-only public GETs from a contrib script

The constitution says only ingest scripts touch the network. This contrib script makes
network calls in two places, both **read-only public `GET`s** with no credentials, cookies,
form posts or personal data:

1. `ats:liveness` (headless Chromium) on each candidate URL, as in v0.1.
2. v0.2, `ats_record.py` (standard-library `urllib`), on **employer pages only**:
   - for Greenhouse job URLs, one call to `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>`;
   - every hop of the URL's redirect chain, followed by hand (at most 10 hops, 15 s timeout).

Every call is recorded in `mode-log.json` → `network_calls` (URL, purpose, status, redirect
target, error, UTC time). A network run also writes `replay-fixture.json`, so the same run can
be replayed with `--offline` and no network. TLS is always verified. On python.org builds
of Python for macOS that ship without CA certificates, `ats_record.ssl_context()` falls back
to the macOS system bundle `/etc/ssl/cert.pem`. The source it used is logged as
`tls_ca_source`.

## v0.2 decision rules for employer pages (Run 2)

| Check | Effect |
|---|---|
| Host not in `ats_hosts.json` (and not an aggregator) | HELD "source not recognized as employer or ATS"; not checked at all |
| Greenhouse job URL | the API record decides: 200 + same id → active; 404 → CLOSED; anything else or no answer → HELD. A different page-checker answer is a ⚠ flag |
| Other allowlisted URL, redirect chain passes through `error=true` | CLOSED ("redirected through ATS error page") |
| Final URL after redirects does not contain the job id | ⚠ flag only |
| ATS title differs from the candidate title (word sets) | ⚠ flag only |

## Files

| File | What |
|---|---|
| `mode_run.py` | the mode (standard library only) |
| `test_mode_run.py` | offline unittests (54) |
| `ats_record.py` | v0.2 ATS record check, manual redirect chain, recorded fetcher (standard library) |
| `ats_hosts.json` | employer/ATS allowlist, each host with a one-line reason |
| `fixtures/ats_hosts.test.json` | fictional allowlist used by the tests |
| `aggregators.json` | aggregator domains, each with a one-line reason (your-input rule) |
| `fixtures/candidates.mode.test.json` | 10 invented roles, one per gate path |
| `fixtures/liveness.offline.json` | raw checker outputs in `check-liveness.mjs`'s exact format, including the real "browser not installed" failure |
