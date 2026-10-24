# Apply-queue refresh — audit, 2026-10-21 (live)

## Executive summary

This file counts what went into the refresh and what came out, lists every posting the tool refused to score and why, and checks the queue's inputs against their sources. It reports what it found; it does not say pass. Of 8 queued postings, 8 reached the engine scorer and 0 were held back for a human. The overall skip share is 1.0 (1 − (apply + consider) / queued = 1 − 0/8).

## Records in and out

| Stage | Count |
|---|---:|
| queued | 8 |
| page check: active / expired / uncertain / missing | 7 / 1 / 0 / 0 |
| board API: present / gone / error / missing | 7 / 1 / 0 / 0 |
| live (both agree) | 7 |
| closed (both agree) | 1 |
| investigate (not scored) | 0 |
| sent to the scorer | 8 |
| Apply / Consider / Skip | 0 / 0 / 8 |

## Refusals and why

- none

## Input cross-checks (queue vs the 80 Days CSV)

| Company | Queue approvals | CSV approvals | Result |
|---|---:|---:|---|
| DATABRICKS INC | 1640 | 1640 | match |
| VERKADA INC | 272 | 272 | match |
| APPTRONIK INC | 56 | 56 | match |
| DILIGENT ROBOTICS INC | 20 | 20 | match |

## Since the baseline

Baseline: refresh-log course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner/refresh-log.json (2026-10-21).

- databricks-8546367002: liveness unchanged (active); description changed: no
- databricks-8656900002: liveness unchanged (active); description changed: no
- databricks-5634684002: liveness unchanged (active); description changed: no
- verkada-4128624007: liveness unchanged (active); description changed: no
- verkada-5195995007: liveness unchanged (expired); description changed: unknown (no baseline)
- verkada-4129304007: liveness unchanged (active); description changed: no
- apptronik-6176116004: liveness unchanged (active); description changed: no
- diligentrobotics-7651459003: liveness unchanged (active); description changed: no

## Invariants checked before scoring

- every scored posting had both liveness checks agree (active + present, or expired + gone);
- every role sent to the scorer carried numeric liveness and timeline factors (the scorer would default a missing gate to 1.0);
- the scorer reported `profile_needs_sponsorship: true`.
- violations: none

## Raw files

| File | sha256 | Redactions |
|---|---|---:|
| raw/api-status.json | `601c7ab74ab4a5bd…` | 0 |
| raw/api/apptronik-6176116004.json | `417eb4e1fbe031d9…` | 0 |
| raw/api/databricks-5634684002.json | `4822e40fd15c90c1…` | 0 |
| raw/api/databricks-8546367002.json | `275dba16db13682c…` | 0 |
| raw/api/databricks-8656900002.json | `acadf3a9f94caa2e…` | 0 |
| raw/api/diligentrobotics-7651459003.json | `e6e79f01f1aa9af3…` | 0 |
| raw/api/verkada-4128624007.json | `f6975a002966c03d…` | 0 |
| raw/api/verkada-4129304007.json | `0361fe7ff3d0cbf5…` | 0 |
| raw/liveness.txt | `7f7a1f251b33b613…` | 0 |
| raw/urls.txt | `ec72ba0f97ce336e…` | 0 |
