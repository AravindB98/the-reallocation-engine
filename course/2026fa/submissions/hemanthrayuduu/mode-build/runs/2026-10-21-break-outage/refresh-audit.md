# Apply-queue refresh — audit, 2026-10-21 (live)

## Executive summary

This file counts what went into the refresh and what came out, lists every posting the tool refused to score and why, and checks the queue's inputs against their sources. It reports what it found; it does not say pass. Of 8 queued postings, 0 reached the engine scorer and 8 were held back for a human. The overall skip share is 1.0 (1 − (apply + consider) / queued = 1 − 0/8).

## Records in and out

| Stage | Count |
|---|---:|
| queued | 8 |
| page check: active / expired / uncertain / missing | 7 / 1 / 0 / 0 |
| board API: present / gone / error / missing | 0 / 0 / 8 / 0 |
| live (both agree) | 0 |
| closed (both agree) | 0 |
| investigate (not scored) | 8 |
| sent to the scorer | 0 |
| Apply / Consider / Skip | 0 / 0 / 0 |

## Refusals and why

- databricks-8546367002: liveness not established (page check: active; board API: error) — uncertain, so not scored
- databricks-8656900002: liveness not established (page check: active; board API: error) — uncertain, so not scored
- databricks-5634684002: liveness not established (page check: active; board API: error) — uncertain, so not scored
- verkada-4128624007: liveness not established (page check: active; board API: error) — uncertain, so not scored
- verkada-5195995007: liveness not established (page check: expired; board API: error) — uncertain, so not scored
- verkada-4129304007: liveness not established (page check: active; board API: error) — uncertain, so not scored
- apptronik-6176116004: liveness not established (page check: active; board API: error) — uncertain, so not scored
- diligentrobotics-7651459003: liveness not established (page check: active; board API: error) — uncertain, so not scored

## Input cross-checks (queue vs the 80 Days CSV)

| Company | Queue approvals | CSV approvals | Result |
|---|---:|---:|---|
| DATABRICKS INC | 1640 | 1640 | match |
| VERKADA INC | 272 | 272 | match |
| APPTRONIK INC | 56 | 56 | match |
| DILIGENT ROBOTICS INC | 20 | 20 | match |

## Since the baseline

Baseline: none.

- databricks-8546367002: liveness no baseline; description changed: unknown (no baseline)
- databricks-8656900002: liveness no baseline; description changed: unknown (no baseline)
- databricks-5634684002: liveness no baseline; description changed: unknown (no baseline)
- verkada-4128624007: liveness no baseline; description changed: unknown (no baseline)
- verkada-5195995007: liveness no baseline; description changed: unknown (no baseline)
- verkada-4129304007: liveness no baseline; description changed: unknown (no baseline)
- apptronik-6176116004: liveness no baseline; description changed: unknown (no baseline)
- diligentrobotics-7651459003: liveness no baseline; description changed: unknown (no baseline)

## Invariants checked before scoring

- every scored posting had both liveness checks agree (active + present, or expired + gone);
- every role sent to the scorer carried numeric liveness and timeline factors (the scorer would default a missing gate to 1.0);
- the scorer reported `profile_needs_sponsorship: true`.
- violations: none

## Raw files

| File | sha256 | Redactions |
|---|---|---:|
| raw/api-status.json | `f8a47faf8b8b3385…` | 0 |
| raw/liveness.txt | `7f7a1f251b33b613…` | 0 |
| raw/urls.txt | `ec72ba0f97ce336e…` | 0 |
