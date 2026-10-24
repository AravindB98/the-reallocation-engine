## Executive summary

This folder holds a small tool that screens job postings for a fictional international student looking for an entry-level data scientist job with visa sponsorship. It recommends a posting only when four things hold:
- the company has a sponsorship record;
- the employer's own hiring system shows the job is open;
- the job title is not above entry level;
- the visa timeline fits.

It never trusts a job-listing site on its own. It holds links to sites it does not recognize. It keeps every check's raw output, and every network run can be replayed offline. Over three runs on the same real postings it fixed a false recommendation and a missed open job, and then stopped recommending senior roles. The fixes were checked on postings a person had already reviewed, so a fresh test is still needed.

# rithika-sr-ds-h1b-liveness — mode v0.3.0

## What it does

`mode_run.py` runs these gates on each candidate role. A role stops at the first gate it fails. HELD, CLOSED and OVER-LEVEL roles are never sent to the scorer.

| Gate | Test | Outcome on fail |
|---|---|---|
| G0 inputs | files parse, dates valid, `--max-level` defined, `--out-dir` inside `course/2026fa/submissions/rithika-sr/` | run stops, **exit 2**, nothing written |
| INPUT | `fit` is a number 0–1 | HELD |
| G1 sponsorship | company in the 80 Days to Stay CSV with `Total Approvals` filled | HELD: not found, or blank record (not zero) |
| G2a liveness | every non-aggregator URL is open, by the precedence below | expired → CLOSED; unrecognized or unconfirmed → HELD |
| G2b aggregator | if `posting_url` is on an aggregator, `employer_url` must be given and pass G2a | HELD `aggregator-only liveness`; employer expired → CLOSED |
| LEVEL (v0.3) | no blocked word from `level_rules.json` (`--max-level`, default `entry`) as a whole word in the candidate or ATS title | OVER-LEVEL "title says '<word>'", no score |
| G3 timeline | visa timeline factor from the persona and `--today` | never held; factor 0 makes the scorer Skip |

**G2 precedence for one non-aggregator URL:**

1. Host not in `ats_hosts.json` → HELD "source not recognized as employer or ATS", not fetched.
2. Greenhouse job URL → the public job-board API record decides: 200 with the same id means active, 404 means CLOSED, and anything else means HELD. A different page-checker answer is a ⚠ flag.
3. Other URL whose redirect chain passes through `error=true` → CLOSED.
4. Otherwise the page checker (`ats:liveness`) decides.
5. Flags only: a final URL without the job id; an ATS title different from the candidate title. Titles are compared as word sets, ignoring parentheticals.

**Level rules (`level_rules.json`, `--max-level entry`):** senior, sr, staff, principal, lead, manager, director, head, iii and iv are blocked, each with a reason; "ii" is allowed. Matching is case-insensitive and whole-word ("Leadership" does not match "lead"). `--max-level any` blocks nothing. No model judgment is involved.

G0, G1, G3 and the scorer call are **imported** from `../rithika-sr-ds-newgrad-h1b-15-2051/triage.py` (not copied). The decision comes from the existing `scripts/score/role-scorer.mjs`.

Outputs in `--out-dir`:

| File | Reader | Contents |
|---|---|---|
| `mode-log.json` | agent | every gate result per role, ATS records, redirect hops, raw liveness output, `network_calls`, `tls_ca_source`, `max_level`, sha256 of every input, `--today`, the command line |
| `mode-report.md` | person | executive summary, one row per role (G1, G2a [decided by], G2b, Level, G3, decision, score or HELD/CLOSED/OVER-LEVEL — reason, ⚠ flags), ATS records and redirect chains, next actions |
| `replay-fixture.json` | replay | network runs only: raw checker outputs and HTTP response subsets, for `--offline` |
| `roles.json`, `role-scores.json`, `role-scores.md` | scorer input/output | only the roles that cleared every gate |

## Candidates file

```json
{ "roles": [
  { "role_id": "acme-ds", "company": "Acme Inc", "title": "Data Scientist", "fit": 0.7,
    "posting_url": "https://builtin.com/job/...",
    "employer_url": "https://boards.greenhouse.io/acme/jobs/...",
    "fit_source": "optional; anything but your-input is flagged as inferred",
    "notes": "optional; shown as a ⚠ note" }
] }
```

`posting_url` falls back to `url`, so the old prototype's candidates files still load. Any `liveness` field in a candidates file is ignored.

## Run (from the repo root, venv active)

Always use a **new** `--out-dir`, so recorded runs (`worked-run/out*`) are never overwritten.

Network run (headless Chromium through `ats:liveness`, plus read-only GETs; see P2 note):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates <candidates.json> --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/<new-run-name>
```

Replay a recorded network run offline (expected for Run 3: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/replay-check
```

Offline demo on the invented fixtures. Their fictional hosts need the test allowlist (expected: 11 roles → 3 scored, 2 closed, 0 over-level, 6 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --ats-hosts scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/ats_hosts.test.json --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/offline-demo
```

**Defaults:**
- persona: the old prototype's `fixtures/persona.example.json` (fictional Sasha Jones);
- targets: the real 80 Days to Stay CSV;
- `--aggregators aggregators.json`;
- `--ats-hosts ats_hosts.json`;
- `--level-rules level_rules.json`;
- `--max-level entry`.

**Exit codes:**
- `0`: success.
- `2`: stopped on bad input or an `--out-dir` outside `course/2026fa/submissions/rithika-sr/`; a message goes to stderr and nothing is written.
- Malformed JSON currently exits 1 with a traceback (open TODO).

## Test (offline)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

The suite has 69 tests, all using `--offline` fixtures, so none of them touches the network. They do run the real scorer through `node`. They write to throwaway `.test-*` folders under `course/2026fa/submissions/rithika-sr/mode/`, deleted afterwards.

## Offline vs network

| Part | Network? |
|---|---|
| G0, G1, LEVEL, G3, scorer, log, report | never (local files and `node`) |
| Page checker without `--offline` | yes: one `ats:liveness` call per unique URL (Playwright, 120 s timeout each) |
| ATS record + redirect chain without `--offline` | yes: read-only public `GET`s (see P2 note) |
| Anything with `--offline` | never: raw outputs and HTTP responses come from the fixture; a URL missing from it is held |

### P2 note: read-only public GETs from a contrib script

The constitution says only ingest scripts touch the network. This contrib script makes network calls in two places, both **read-only public `GET`s** with no credentials, cookies, form posts or personal data:

1. `ats:liveness` (headless Chromium) on each checked URL.
2. `ats_record.py` (standard-library `urllib`), on **employer pages only**:
   - for Greenhouse job URLs, one call to `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>`;
   - every hop of the URL's redirect chain, followed by hand (at most 10 hops, 15 s timeout).

Unrecognized hosts are never fetched.

Every call is recorded in `mode-log.json` → `network_calls` (URL, purpose, status, redirect target, error, UTC time). A network run also writes `replay-fixture.json`, so the same run can be replayed with `--offline` and no network.

TLS is always verified. On python.org builds of Python for macOS that ship without CA certificates, `ats_record.ssl_context()` falls back to the macOS system bundle `/etc/ssl/cert.pem`. The source it used is logged as `tls_ca_source`.

## Files

| File | What |
|---|---|
| `mode_run.py` | the mode v0.3.0 (standard library only) |
| `ats_record.py` | Greenhouse record check, manual redirect chain, recorded fetcher, TLS context (standard library) |
| `test_mode_run.py` | offline unittests (69) |
| `aggregators.json` | aggregator domains, each with a one-line reason (your-input rule) |
| `ats_hosts.json` | employer/ATS allowlist, each host with a one-line reason (your-input rule) |
| `level_rules.json` | blocked title words per `--max-level`, each with a one-line reason (your-input rule) |
| `fixtures/candidates.mode.test.json` | 11 invented roles, one per gate path |
| `fixtures/liveness.offline.json` | raw checker outputs in `check-liveness.mjs`'s exact format (including the real "browser not installed" failure) plus recorded HTTP responses |
| `fixtures/ats_hosts.test.json` | fictional allowlist used by the tests and the offline demo |
