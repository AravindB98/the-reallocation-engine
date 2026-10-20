# Worked run: PM/APM live-posting and sponsor-record gate

## Executive summary

This is the worked run of a draft mode that checks product manager postings for two things before scoring them: whether each posting still looks open, and whether the employer appears in a public sponsorship record. It ran live on three public postings, with a person settling the one posting the tool could not read and confirming its employer record; two postings came out Consider, one stayed on hold because its record has no approval figures, and none came out Apply. The mode stays at the first lifecycle stage, draft, because five planned additions are still open items and leaving draft needs zero. What held: the checks behaved as designed, replays of the same capture gave identical results, the scores matched figures I worked out from the scorer's formula beforehand, and eight of ten deliberate code mutations were caught at first (the two that slipped through exposed test gaps that new tests now cover). What did not: the liveness tool cannot read one of the three sites, many sponsorship records are empty, and four of my ten real guesses held.

## Inputs

| Posting | Host | Location (country level) | Fit | Timeline |
|---|---|---|---|---|
| posting 1 | host A | US (read by hand) | 0.7 (your-input) | 0.8 (your-input) |
| posting 2 | host B | US (read by hand) | 0.7 (your-input) | 0.8 (your-input) |
| posting 3 | host C | US (read by hand) | 0.7 (your-input) | 0.8 (your-input) |

The persona numbers are fictional. Profile authorization text: "F-1 student; will need employer sponsorship" (your-input). Real addresses, company names and job ids stay in private inputs. The CP1 anchor runs used a different posting 3 (host C) that was replaced before the CP3 runs; from CP3b on, posting 3 is the replacement, and the change brief's anchor table refers to the earlier set.

## Predictions and results

| # | Prediction (as written) | Result | Held | Commit holding the prediction |
|---|---|---|---|---|
| P1 | Of the 3 postings, 3 will come back "active" from ats:liveness. | 2 of 3 active; posting 1 expired, "insufficient content" (CP1 anchor set; CHANGE-BRIEF.md anchor table) | no | 158525a |
| P2 | The mutated control URL (see step 3) will come back active. | expired, with the same verdict and reason as the real posting 1 (CHANGE-BRIEF.md anchor table) | no | 158525a |
| P3 | Of the 3 companies, 3 will have an exact company_name match in the 80-Days CSV. | 0 of 3 exact matches (CHANGE-BRIEF.md anchor table) | no | 158525a |
| P4 | npm run score on data/examples/ch11-roles.json will run cleanly (exit 0). | exit 0 (CHANGE-BRIEF.md anchor table) | yes | 158525a |
| P5 | 0 of 3 postings will get Apply (a check from reading the scorer, not a guess). | 0 of 3 Apply in pass 2 (09-pass2-role-scores.json, 06-pass2-run-log.json) | yes (a check derived from the scorer's code, not a guess) | 0f4b0de |
| P6 | Of the 3 fake-id controls, 1 will wrongly come back "active". | 0 of 3 controls active: host A expired with insufficient content, hosts B and C HTTP 404 (02-pass1-liveness-raw.txt) | no | 0f4b0de |
| P7 | Name matching: all three postings will be CANDIDATE (one candidate row each). | 1 CANDIDATE (posting 1), 2 MATCH (postings 2 and 3) (03-pass1-run-log.json) | no | 0f4b0de |
| P8 | In the first pass, before anything is confirmed, 1 of the 3 postings will end in HOLD. | 1 of 3 on HOLD, posting 1 (03-pass1-run-log.json) | held in number; my P7 guess implied three holds, so it held for a contradictory reason (noted in CP3-PREDICTIONS) | 0f4b0de |
| P9 | Of the 10 deliberate code mutations, 4 will turn the unit tests red. | 8 of 10 caught in round 1; 10 of 10 after two new tests (16-mutation-table.md) | no | f5c342e |
| P10 | Of the 3 non-job probe pages, 0 will wrongly come back "active" from ats:liveness. | 0 of 3 active: 2 uncertain, 1 expired (11-probe1.txt, 11-probe2.txt, 11-probe3.txt) | yes | f5c342e |
| P11 | With a browser path that does not exist, the gate will stop with the code chromium_unavailable: yes | STOP chromium_unavailable (12-c3-terminal.txt) | yes | f5c342e |

P5 was derived from the scorer's code, so it is a check, not a guess. Of the ten real guesses (P1-P4, P6-P11), four held: P4, P8, P10 and P11. For P9, the first round caught 8 of 10 mutations; after two new tests (commit c84514c), all 10 of 10 were caught.

## Commands and output

`<private>` stands for `private/live-run-1` and `<os-temp>` for a temporary folder outside the repository.

### Pass 1, live (scorer off)

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs.json --out-dir <private>/out-pass1 --no-score > <private>/pass1-terminal.txt 2>&1
```

Output: `evidence-sanitized/01-pass1-terminal.txt` (pass 1 terminal; copied programmatically, sanitization note omitted).

```text
posting 1: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - <legal name of a posting's employer>
ok: 3 postings -> private/live-run-1/out-pass1/report.md
```

Output: `evidence-sanitized/02-pass1-liveness-raw.txt` (the one ats:liveness call the script made: 3 postings and 3 controls; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs <posting 1 url> <posting 1 control url> <posting 2 url> <posting 2 control url> <posting 3 url> <posting 3 control url>

Checking 6 URL(s)...

❌ expired    <posting 1 url>
           insufficient content — likely nav/footer only
❌ expired    <posting 1 control url>
           insufficient content — likely nav/footer only
✅ active     <posting 2 url>
❌ expired    <posting 2 control url>
           HTTP 404
✅ active     <posting 3 url>
❌ expired    <posting 3 control url>
           HTTP 404

Results: 2 active  4 expired  0 uncertain
```

Output: `evidence-sanitized/04-pass1-report.md` (pass 1 human report, including its table; copied programmatically, sanitization note omitted).

```text
## Executive summary

This report covers 3 product manager postings checked for two things before any scoring: whether each still looks open, and whether the employer has a public sponsorship record. 0 came out Consider, 0 Skip and 1 on hold for a person to check. On hold means a check could not give a clear answer; it is not a rejection. Nothing here says whether anyone is eligible for, or will receive, sponsorship.

## Run record

- Run: lsg-20261019T014456Z (live mode), generated 2026-10-19T01:44:56Z
- Liveness: live, captured 2026-10-19T01:44:56Z
- Timeline factor: 0.8 (your-input)

## Postings

| Posting | Host | Liveness | Sponsor record | Timeline | Decision | Why | Sources |
|---|---|---|---|---|---|---|---|
| posting 1 | host A | UNRESOLVED | CANDIDATE (approvals None, denials None) | 0.8 | HOLD | liveness_unresolved, sponsor_candidate_unconfirmed | liveness record; sponsor record; fit your-input; timeline your-input |
| posting 2 | host B | PASS | MATCH (approvals 1640, denials 8) | 0.8 | not scored |  | liveness record; sponsor model-judgment; fit your-input; timeline your-input |
| posting 3 | host C | PASS | MATCH (approvals 1250, denials 22) | 0.8 | not scored |  | liveness record; sponsor model-judgment; fit your-input; timeline your-input |
```

### Replays of the pass 1 capture

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs.json --out-dir <private>/out-pass1-replay --liveness-from <private>/out-pass1/liveness-raw.txt --no-score > <private>/replay-terminal.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs.json --out-dir <private>/out-pass1b --liveness-from <private>/out-pass1/liveness-raw.txt --no-score > <private>/pass1b-terminal.txt 2>&1
```

Output: `evidence-sanitized/10-replay-comparison.txt` (JSON comparison of the replay run logs with pass 1, written in CP4; copied programmatically, sanitization note omitted).

```text
out-pass1-replay vs out-pass1: postings[] equal = True; top-level fields that differ = ['captured_at', 'generated_at', 'liveness_source', 'run_id']
out-pass1b vs out-pass1: postings[] equal = True; top-level fields that differ = ['captured_at', 'generated_at', 'liveness_source', 'run_id']
```

### Pass 2, human inputs applied, scorer on

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs.json --human <private>/human.json --liveness-from <private>/out-pass1/liveness-raw.txt --out-dir <private>/out-pass2 > <private>/pass2-terminal.txt 2>&1
```

Output: `evidence-sanitized/05-pass2-terminal.txt` (pass 2 terminal; copied programmatically, sanitization note omitted).

```text
posting 1: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - <legal name of a posting's employer>
ok: 3 postings -> private/live-run-1/out-pass2/report.md
```

Output: `evidence-sanitized/08-pass2-role-scores.md` (pass 2 scorer report; copied programmatically, sanitization note omitted).

```text
# Role Scorer report — 2026-10-19

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 2 roles → Apply 0 · Consider 2 · Skip 0. **Skip rate 0%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| posting 3 — posting 3 | 0.308 | **Consider** | above threshold (0.308) but one soft spot: sponsorship tier "Likely" | sponsorship 0.5·0.35 [model-judgment]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 0.8[your-input] |
| posting 2 — posting 2 | 0.210 | **Consider** | composite 0.210 in the Consider band [0.2, 0.3) | sponsorship 0.15·0.35 [model-judgment]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 0.8[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
```

### Offline test suite

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor -v
```

Output: `evidence-sanitized/15-unittest-26.txt` (the 26-test run after CP4-2; copied programmatically, sanitization note omitted).

```text
test_no_id_gives_none (test_live_sponsor_gate.ControlBuilder) ... ok
test_path_query_and_slug_ids (test_live_sponsor_gate.ControlBuilder) ... ok
test_same_id_twice_changes_both (test_live_sponsor_gate.ControlBuilder) ... ok
test_replay_with_real_scorer (test_live_sponsor_gate.EndToEnd) ... ok
test_hold_never_reaches_scorer_input (test_live_sponsor_gate.HoldRouting) ... ok
test_unresolved_liveness_alone_holds_with_no_factor (test_live_sponsor_gate.HoldRouting) ... ok
test_out_dir_not_ignored_stops (test_live_sponsor_gate.Inputs) ... ok
test_profile_guard (test_live_sponsor_gate.Inputs) ... ok
test_timeline (test_live_sponsor_gate.Inputs) ... ok
test_planted_raw_url_is_caught (test_live_sponsor_gate.LeakCheck) ... ok
test_raw_url_in_a_human_note_stops_the_run (test_live_sponsor_gate.LeakSelfCheckInMain) ... STOP leak_detected 1 output file(s) contained a raw input
ok
test_five_outcomes (test_live_sponsor_gate.LivenessMapping) ... ok
test_candidate_prefix_is_whole_word (test_live_sponsor_gate.MatchStates) ... ok
test_states (test_live_sponsor_gate.MatchStates) ... ok
test_canned_fixture (test_live_sponsor_gate.OutputParser) ... ok
test_fatal_is_run_level_stop (test_live_sponsor_gate.OutputParser) ... ok
test_url_mismatch_and_missing_results_line (test_live_sponsor_gate.OutputParser) ... ok
test_candidates_private_file_and_no_csv_names_in_outputs (test_live_sponsor_gate.PassOneOutputs) ... ok
test_json_contract (test_live_sponsor_gate.PassOneOutputs) ... ok
test_replay_of_saved_real_output_is_live_mode (test_live_sponsor_gate.PassOneOutputs) ... ok
test_report_first_heading_is_executive_summary (test_live_sponsor_gate.PassOneOutputs) ... ok
test_confirmed_candidate_keeps_label_on_rule_hold (test_live_sponsor_gate.ReportDisplay) ... ok
test_missing_values_show_not_recorded_never_none (test_live_sponsor_gate.ReportDisplay) ... ok
test_all_seven_rows (test_live_sponsor_gate.RuleV01) ... ok
test_control_active_voids_host (test_live_sponsor_gate.VoidRule) ... ok
test_control_expired_keeps_host (test_live_sponsor_gate.VoidRule) ... ok

----------------------------------------------------------------------
Ran 26 tests in 0.122s

OK
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
posting 3: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 5 postings -> <os-temp>/out/report.md
```

### C2: three non-job probe pages

Command:

```text
npm run ats:liveness -- "<probe 1 url>" > <private>/probes/probe1.txt 2>&1
npm run ats:liveness -- "<probe 2 url>" > <private>/probes/probe2.txt 2>&1
npm run ats:liveness -- "<probe 3 url>" > <private>/probes/probe3.txt 2>&1
```

Output: `evidence-sanitized/11-probe1.txt` (probe 1; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs <probe 1 url>

Checking 1 URL(s)...

⚠️ uncertain  <probe 1 url>
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
```

Output: `evidence-sanitized/11-probe2.txt` (probe 2; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs <probe 2 url>

Checking 1 URL(s)...

⚠️ uncertain  <probe 2 url>
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
```

Output: `evidence-sanitized/11-probe3.txt` (probe 3; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs <probe 3 url>

Checking 1 URL(s)...

❌ expired    <probe 3 url>
           insufficient content — likely nav/footer only

Results: 0 active  1 expired  0 uncertain
```

### C3: missing browser

Command:

```text
PLAYWRIGHT_BROWSERS_PATH="<os-temp>" PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs.json --no-score --out-dir <private>/out-nochromium > <private>/nochromium-terminal.txt 2>&1
```

Output: `evidence-sanitized/12-c3-terminal.txt` (C3 terminal; copied programmatically, sanitization note omitted).

```text
STOP chromium_unavailable 
```

Output: `evidence-sanitized/12-c3-run-log.json` (C3 run log; copied programmatically, sanitization note omitted).

```json
{
  "run_id": "lsg-20261019T165501Z",
  "recipe": "shinde-pras-pm-apm-live-sponsor",
  "recipe_version": "0.1.0",
  "generated_at": "2026-10-19T16:55:01Z",
  "mode": "live",
  "liveness_source": "live",
  "captured_at": null,
  "timeline": {
    "factor": 0.8,
    "source": "your-input"
  },
  "postings": [],
  "human_inputs": [],
  "scorer": null,
  "stops": [
    {
      "code": "chromium_unavailable",
      "detail": ""
    }
  ]
}
```

Output: `evidence-sanitized/12-c3-liveness-raw.txt` (C3 raw liveness output; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs <posting 1 url> <posting 1 control url> <posting 2 url> <posting 2 control url> <posting 3 url> <posting 3 control url>

Checking 6 URL(s)...

Fatal: browserType.launch: Executable doesn't exist at <os-temp>/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```

### C4a: profile trap through the gate

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/inputs-trap.json --human <private>/human.json --liveness-from <private>/out-pass1/liveness-raw.txt --out-dir <private>/out-trap > <private>/trap-terminal.txt 2>&1
```

Output: `evidence-sanitized/13-c4a-terminal.txt` (C4a terminal; copied programmatically, sanitization note omitted).

```text
STOP profile_zeroes_sponsorship authorization text would set the scorer's sponsorship weight to 0
```

Output: `evidence-sanitized/13-c4a-run-log.json` (C4a run log; copied programmatically, sanitization note omitted).

```json
{
  "run_id": "lsg-20261019T165512Z",
  "recipe": "shinde-pras-pm-apm-live-sponsor",
  "recipe_version": "0.1.0",
  "generated_at": "2026-10-19T16:55:12Z",
  "mode": "live",
  "liveness_source": "replay",
  "captured_at": null,
  "timeline": {
    "factor": 0.8,
    "source": "your-input"
  },
  "postings": [],
  "human_inputs": [],
  "scorer": null,
  "stops": [
    {
      "code": "profile_zeroes_sponsorship",
      "detail": "authorization text would set the scorer's sponsorship weight to 0"
    }
  ]
}
```

### C4b: profile trap through the raw scorer

Command:

```text
npm run score -- <private>/trap/roles.json --profile <private>/trap/profile-plain.json --out-dir <private>/trap/out-plain > <private>/trap/score-plain-terminal.txt 2>&1
npm run score -- <private>/trap/roles.json --profile <private>/trap/profile-trap.json --out-dir <private>/trap/out-trap > <private>/trap/score-trap-terminal.txt 2>&1
```

Output: `evidence-sanitized/13-c4b-score-plain-terminal.txt` (plain profile, terminal; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs private/live-run-1/trap/roles.json --profile private/live-run-1/trap/profile-plain.json --out-dir private/live-run-1/trap/out-plain

✓ scored 1 roles → Apply 0 · Consider 1 · Skip 0 (skip 0%)
  private/live-run-1/trap/out-plain/role-scores.json  +  private/live-run-1/trap/out-plain/role-scores.md
```

Output: `evidence-sanitized/13-c4b-score-plain.md` (plain profile, scorer report; copied programmatically, sanitization note omitted).

```text
# Role Scorer report — 2026-10-19

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 1 roles → Apply 0 · Consider 1 · Skip 0. **Skip rate 0%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| invented role — invented role | 0.308 | **Consider** | above threshold (0.308) but one soft spot: sponsorship tier "Likely" | sponsorship 0.5·0.35 [model-judgment]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 0.8[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
```

Output: `evidence-sanitized/13-c4b-score-trap-terminal.txt` (trap profile, terminal; copied programmatically, sanitization note omitted).

```text

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs private/live-run-1/trap/roles.json --profile private/live-run-1/trap/profile-trap.json --out-dir private/live-run-1/trap/out-trap

✓ scored 1 roles → Apply 0 · Consider 0 · Skip 1 (skip 100%)
  private/live-run-1/trap/out-trap/role-scores.json  +  private/live-run-1/trap/out-trap/role-scores.md
```

Output: `evidence-sanitized/13-c4b-score-trap.md` (trap profile, scorer report; copied programmatically, sanitization note omitted).

```text
# Role Scorer report — 2026-10-19

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile does NOT require sponsorship → sponsorship weight 0.*

**Summary:** 1 roles → Apply 0 · Consider 0 · Skip 1. **Skip rate 100%** (healthy — a good run skips at least half).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| invented role — invented role | 0.168 | **Skip** | composite 0.168 < 0.2 — time is better spent elsewhere | sponsorship 0.5·0 [model-judgment]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 0.8[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
```

### C5: four input refusals

Command:

```text
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/refusals/inputs-a.json --liveness-from <private>/out-pass1/liveness-raw.txt --no-score --out-dir <private>/refusals/out-a > <private>/refusals/terminal-a.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/refusals/inputs-b.json --liveness-from <private>/out-pass1/liveness-raw.txt --no-score --out-dir <private>/refusals/out-b > <private>/refusals/terminal-b.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/refusals/inputs-c.json --liveness-from <private>/out-pass1/liveness-raw.txt --no-score --out-dir <private>/refusals/out-c > <private>/refusals/terminal-c.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs <private>/refusals/inputs-d.json --liveness-from <private>/out-pass1/liveness-raw.txt --no-score --out-dir ./refuse-me-out > <private>/refusals/terminal-d.txt 2>&1
```

Output: `evidence-sanitized/14-c5-a-terminal.txt` ((a) timeline given as the string "0.8"; copied programmatically, sanitization note omitted).

```text
STOP timeline_invalid factor must be a number from 0 to 1
```

Output: `evidence-sanitized/14-c5-b-terminal.txt` ((b) timeline 1.01; copied programmatically, sanitization note omitted).

```text
STOP timeline_invalid factor must be a number from 0 to 1
```

Output: `evidence-sanitized/14-c5-c-terminal.txt` ((c) timeline missing; copied programmatically, sanitization note omitted).

```text
STOP timeline_missing 
```

Output: `evidence-sanitized/14-c5-d-terminal.txt` ((d) out-dir inside the repository, not ignored; copied programmatically, sanitization note omitted).

```text
STOP out_dir_not_ignored 
```

### C1: mutation check

Command:

```text
python3 -I <os-temp>/mutate.py <os-temp>/wt   (one-off runner kept outside the repository; detached worktree at HEAD)
```

Output: `evidence-sanitized/16-mutation-table.md` (both rounds; copied programmatically, sanitization note omitted).

```text
## Executive summary

Ten deliberate one-line mutations were applied, one at a time, to a throwaway copy of the gate script. In round 1, eight of the ten turned the unit tests red and two survived. Two tests were added, and in round 2 all ten were caught.

## Mutation table

| # | Mutation | Line changed | Round 1 (24 tests): red tests | Caught | Round 2 (26 tests): red tests | Caught |
|---|---|---|---|---|---|---|
| 1 | void rule inverted: host VOID only when a control is expired | 313: `verdicts[controls[p["url"]]]["verdict"] == "active") for p in inputs["postings"])}` -> `verdicts[controls[p["url"]]]["verdict"] == "expired") for p in inputs["postings"])}` | test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_control_expired_keeps_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_replay_with_real_scorer | yes | test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_control_expired_keeps_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_raw_url_in_a_human_note_stops_the_run, test_replay_with_real_scorer, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 2 | "expired + insufficient content" maps to FAIL | 260: `return "UNRESOLVED", None, "insufficient_content"` -> `return "FAIL", 0.0, "insufficient_content"` | test_five_outcomes, test_replay_with_real_scorer | yes | test_five_outcomes, test_raw_url_in_a_human_note_stops_the_run, test_replay_with_real_scorer, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 3 | CANDIDATE uses a raw string prefix | 294: `cands = list(index.first.get(first, [])) if first else []` -> `cands = [r for k, rs in index.exact.items() if first and k.startswith(first) for r in rs]` | test_candidate_prefix_is_whole_word | yes | test_candidate_prefix_is_whole_word | yes |
| 4 | AMBIGUOUS reported as MATCH | 292: `return "AMBIGUOUS", rows, []` -> `return "MATCH", rows, []` | test_states | yes | test_states | yes |
| 5 | HOLD postings allowed into the scorer input | 361: `if not holds:` -> `if True:` | test_candidates_private_file_and_no_csv_names_in_outputs, test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_json_contract, test_replay_of_saved_real_output_is_live_mode, test_replay_with_real_scorer, test_report_first_heading_is_executive_summary | yes | test_candidates_private_file_and_no_csv_names_in_outputs, test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_json_contract, test_raw_url_in_a_human_note_stops_the_run, test_replay_of_saved_real_output_is_live_mode, test_replay_with_real_scorer, test_report_first_heading_is_executive_summary, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 6 | timeline validation accepts a string | 147: `if not _is_unit_number(timeline["factor"]):` -> `if not (isinstance(timeline["factor"], str) or _is_unit_number(timeline["factor"])):` | test_timeline | yes | test_timeline | yes |
| 7 | rule v0.1 approvals threshold 50 becomes 5 | 48: `APPROVALS_THRESHOLD = 50` -> `APPROVALS_THRESHOLD = 5` | test_all_seven_rows | yes | test_all_seven_rows | yes |
| 8 | unresolved liveness gets factor 1.0 instead of being excluded | 332: `holds.append("liveness_unresolved")` -> `live.update(factor=1.0)` | none | **no** | test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 9 | leak self-check disabled | 485: `leaks = leak_scan(outputs, tokens)` -> `leaks = []` | none | **no** | test_raw_url_in_a_human_note_stops_the_run | yes |
| 10 | profile guard disabled | 156: `if SCORER_NO_SPONSOR_RE.search(auth.lower()):` -> `if False:` | test_profile_guard | yes | test_profile_guard | yes |
```

### Label test on the old script (CP5a step 0)

Command:

```text
(in a detached worktree at <os-temp>/wt, with live_sponsor_gate.py replaced by the 2bdd506 version)
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_live_sponsor_gate.ReportDisplay.test_confirmed_candidate_keeps_label_on_rule_hold -v
```

Output: `evidence-sanitized/17-cp5a-old-script-label-test.txt` (saved at the time, not regenerated; copied programmatically, sanitization note omitted).

```text
test_confirmed_candidate_keeps_label_on_rule_hold (test_live_sponsor_gate.ReportDisplay) ... FAIL

======================================================================
FAIL: test_confirmed_candidate_keeps_label_on_rule_hold (test_live_sponsor_gate.ReportDisplay)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<os-temp>/wt/scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/test_live_sponsor_gate.py", line 213, in test_confirmed_candidate_keeps_label_on_rule_hold
    self.assertIn("CANDIDATE, confirmed by a person", line)
AssertionError: 'CANDIDATE, confirmed by a person' not found in '| posting 1 | host A | PASS | CANDIDATE (approvals None, denials None) | 0.8 | HOLD | rule_hold_no_h1b_data | liveness record; sponsor record; fit your-input; timeline your-input |'

----------------------------------------------------------------------
Ran 1 test in 0.000s

FAILED (failures=1)
```

## Verified vs inferred

| Item | Established by (script or data, with file) | Judged by |
|---|---|---|
| Liveness verdict per URL | ats:liveness classifier, one live call (02-pass1-liveness-raw.txt) | script |
| Posting 1 on host A open | the tool said expired (02-pass1-liveness-raw.txt); the person's answer is recorded as a human input (06-pass2-run-log.json) | me, by browser check before pass 2 |
| Sponsor match states and row counts | gate script against the CSV (03-pass1-run-log.json) | script |
| Approvals and denials | CSV records (06-pass2-run-log.json), matched by an independent read (csv-crosscheck-summary.md) | data (record) |
| Tier and p | rule v0.1 applied by the script (06-pass2-run-log.json) | rule v0.1 constants (model-judgment label) |
| Fit 0.7 and timeline 0.8 | inputs only | me (your-input, fictional persona numbers) |
| Composite and decision | repository scorer (08-pass2-role-scores.md, 09-pass2-role-scores.json) | scorer arithmetic and thresholds on the values above |
| "Posting 2 is an APM role" | not established by any script | me (my reading of the posting) |
| Candidate confirmation for posting 1 | recorded as a human input (06-pass2-run-log.json) | me (my input; filing entity not verified) |
| Job location | not checked by the script | me (read by hand; all US) |

No value in this run came from a language-model call at run time.

## Verification

- Replay equality: both replays of the pass 1 capture gave postings[] equal to pass 1 (10-replay-comparison.txt). This shows the script is deterministic for a given capture, not that liveness is stable.
- JSON parse: the run logs and scorer output parse as JSON (03-pass1-run-log.json, 06-pass2-run-log.json, 09-pass2-role-scores.json); the offline test test_json_contract checks the contract.
- Independent CSV cross-check: a separate read of the CSV found one row per posting with the same approvals and denials as the run log (csv-crosscheck-summary.md).
- Expected versus actual: CP3c-EXPECTED.md, committed before pass 2, expected posting 2 at 0.21 and posting 3 at 0.308, both Consider, and posting 1 on HOLD with rule_hold_no_h1b_data; pass 2 gave exactly that (09-pass2-role-scores.json, 06-pass2-run-log.json).
- Break attempts: the mutation table (16-mutation-table.md) and C2-C5 (11-probe1.txt to 14-c5-d-terminal.txt) above.

## Attestation

- Recipe: shinde-pras-pm-apm-live-sponsor v0.1.0
- By: shinde-pras (GitHub handle) · 2026-10-19

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Liveness with a made-up-id control per host (pass 1) | host A: posting and control both expired, insufficient content; hosts B and C: posting active, control HTTP 404 (02-pass1-liveness-raw.txt) | no control active |
| Two replays of the pass 1 capture | postings[] equal to pass 1 (10-replay-comparison.txt) | equal |
| Pass 2 versus expected composites | posting 2 0.21 Consider, posting 3 0.308 Consider, posting 1 HOLD rule_hold_no_h1b_data (09-pass2-role-scores.json, 06-pass2-run-log.json) | the values in CP3c-EXPECTED.md, within 0.001 |
| Independent CSV cross-check | one row per posting; approvals and denials equal the run log (csv-crosscheck-summary.md) | equal |
| Ten one-line mutations of the gate script | 8 of 10 caught in round 1; 10 of 10 after two new tests (16-mutation-table.md) | every mutation turns a test red |
| Three non-job probe pages | 2 uncertain, 1 expired, none active (11-probe1.txt, 11-probe2.txt, 11-probe3.txt) | none active |
| Gate run with a missing browser | STOP chromium_unavailable; run log holds only the stop (12-c3-terminal.txt, 12-c3-run-log.json) | a run-level stop naming the browser |
| Profile trap through the gate | STOP profile_zeroes_sponsorship; no scored output (13-c4a-terminal.txt, 13-c4a-run-log.json) | the gate refuses to run |
| Profile trap through the raw scorer | plain wording: Consider; trap wording: sponsorship weight 0 and Skip, with no warning printed (13-c4b-score-plain.md, 13-c4b-score-trap.md, 13-c4b-score-trap-terminal.txt) | the weight change, visible only in the report header |
| Four input refusals | timeline_invalid, timeline_invalid, timeline_missing, out_dir_not_ignored (14-c5-a-terminal.txt to 14-c5-d-terminal.txt) | a stop for each |
| Confirmed-label test on the old script | FAIL: the "confirmed by a person" label is missing (17-cp5a-old-script-label-test.txt) | fail on the old script, pass on the current one (15-unittest-26.txt) |
| Offline suite | Ran 26 tests, OK (15-unittest-26.txt) | all pass |
| Out-dir check with git not on PATH (env -i), out-dir inside the repository under the ignored private/ folder | before the fix: traceback, nothing written (18-cp6-probe-inside-before.txt); after: STOP out_dir_unverifiable, nothing written (19-cp6-probe-inside-after.txt) | a named stop, nothing written |
| Out-dir check with git not on PATH, out-dir outside the repository | proceeds before and after the fix (18-cp6-probe-outside-before.txt, 19-cp6-probe-outside-after.txt) | proceeds without git |
| Four new out-dir tests (OutDirWithoutGit) on the old and the fixed script | old script: 1 FAIL and 1 ERROR (the two inside-repository cases), 2 ok; fixed script: all ok (20-cp6-new-tests-on-old-script.txt, 20-cp6-new-tests-on-fixed-script.txt) | the inside-repository cases fail on the old script and pass on the fixed one |
| Offline suite after the fix | Ran 30 tests, OK (21-cp6-unittest-30.txt); a replay of pass 1 gave postings[] equal to pass 1 (21-cp6-regression-replay.txt) | all pass; no change to results |

### Did not test

- A posting that is closed but whose page is still served.
- Hosts other than A, B and C.
- Playwright failures other than a missing executable.
- Liveness for the final three postings was captured live once; pass 2 and the replays reused that capture on purpose; the only earlier live repeat (CP1-C, an earlier posting set) was within minutes; no repeat on another day.
- A run from a fresh clone (pending final checks).
- CI: no CI step runs these tests.
- ats:scan: it touches data/ats, so it was not used.
- E-Verify, the role-quality vote and the company-alias table: not built.
- Multi-line mutations.

### Broke during testing, fixed

| What failed | What changed | Where |
|---|---|---|
| The PII diff scan read a test decorator line (an added line starting with the at-sign) as an email | the commit was rolled back and the skip moved into the test body; the scanner was not touched | 171ac7c |
| The report printed Python's None for missing values | the report now says "not recorded"; the JSON keeps null | 8f097d2 |
| The "confirmed by a person" label was lost when a confirmed CANDIDATE hit a rule HOLD | the label is read from the recorded human inputs; a test was added | 8f097d2 (fix), 6e7cf1c (test) |
| Two mutations survived round 1 (unresolved liveness given 1.0; leak self-check disabled) | two tests were added | c84514c |
| Three citations in the mode file were imprecise | re-read and corrected | 2bdd506 |
| An early draft listed Apply as a possible decision | decisions are Consider, Skip or HOLD | 46018e6 (mode file), c44a37a (card) |
| The draft said a void host goes to HOLD in one place and stops the run in another | stop conditions split into run-level stops, per-posting or per-host HOLD, and refusals | 46018e6 |
| With git not on PATH, an out-dir inside the repository made the run crash with a traceback | the check stops with out_dir_unverifiable when git cannot answer; outside the repository no git is needed; four tests added | 8cc9cfb |

## Reflection

1. What went well: Writing predictions before each run mattered because it kept me honest. I had to write down what I expected before I saw the results, so I couldn't quietly change my story after the fact.
2. What surprised me: I expected Posting 2 to beat Posting 3 because it had 1,640 approvals (I did not write this down as a prediction beforehand), but I saw it score lower, 0.210 vs 0.308, and I think that happened because the rule looks for a product-manager title in the row's short title list. Posting 2's row had none, even though Posting 2 is an APM role. The approvals count only matters as a cutoff at 50, and with no product-manager title it is not used at all.
3. What the mode got wrong or missed: Two things the mode can't see are that "confirmed" doesn't mean verified, and that the script doesn't check job location (I read the locations by hand this time, and all three were US). That matters for someone on the OPT clock because they can't afford to waste applications on unverified postings or jobs in places they can't work. The opposite error showed up too: on host A, the tool read a real open posting as expired; the mode held it for a person to check instead of skipping it.
4. What I would do next: If I had another week, I'd first ask the maintainer for a warning on the profile trap, because the scorer prints no warning when profile wording zeroes the sponsorship weight (the only trace is one line in its report header). Our script stops it, but anyone calling the scorer directly has no protection.
