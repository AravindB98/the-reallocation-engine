# Apply-queue refresh — audit, 2026-10-21 (live)

## Executive summary

This file counts what went into the refresh and what came out, lists every posting the tool refused to score and why, and checks the queue's inputs against their sources. It reports what it found; it does not say pass. Of 3 queued postings, 2 reached the engine scorer and 1 were held back for a human. The overall skip share is 1.0 (1 − (apply + consider) / queued = 1 − 0/3).

## Records in and out

| Stage | Count |
|---|---:|
| queued | 3 |
| page check: active / expired / uncertain / missing | 1 / 1 / 1 / 0 |
| board API: present / gone / error / missing | 1 / 2 / 0 / 0 |
| live (both agree) | 1 |
| closed (both agree) | 1 |
| investigate (not scored) | 1 |
| sent to the scorer | 2 |
| Apply / Consider / Skip | 0 / 0 / 2 |

## Refusals and why

- figma-1000000001: liveness not established (page check: uncertain; board API: gone) — uncertain, so not scored

## Input cross-checks (queue vs the 80 Days CSV)

| Company | Queue approvals | CSV approvals | Result |
|---|---:|---:|---|
| VERKADA INC | 272 | 272 | match |
| FIGMA INC | — | 188 | match |

## Since the baseline

Baseline: none.

- verkada-4129304007: liveness no baseline; description changed: unknown (no baseline)
- figma-1000000001: liveness no baseline; description changed: unknown (no baseline)
- verkada-1000000001: liveness no baseline; description changed: unknown (no baseline)

## Invariants checked before scoring

- every scored posting had both liveness checks agree (active + present, or expired + gone);
- every role sent to the scorer carried numeric liveness and timeline factors (the scorer would default a missing gate to 1.0);
- the scorer reported `profile_needs_sponsorship: true`.
- violations: none

## Raw files

| File | sha256 | Redactions |
|---|---|---:|
| raw/api-status.json | `6c690c53fc04b70f…` | 0 |
| raw/api/verkada-4129304007.json | `0361fe7ff3d0cbf5…` | 0 |
| raw/liveness.txt | `7456f82fa420786e…` | 0 |
| raw/urls.txt | `0e3693c5ed917919…` | 0 |
