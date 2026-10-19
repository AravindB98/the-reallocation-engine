# round-1 — note on this folder

## Executive summary

This folder holds a live run made by an automated session, not by the student. Its own `terminal-output.txt` says so.
The session could not launch the browser that checks whether a posting is open, so the mode held both postings
instead of calling them closed. The student's own live run is in `../round-2-personal/`.

## What was changed before publishing

- `run-log.json`: the two captured Playwright error lines named the local home folder. It was replaced with `~`
  on 2026-10-19, and nothing else changed.
  - SHA-256 of the original: `db7e4e2173b547b50b31703b04a0e395a0eb6652df3dbd5c8619fdc714d85079`. The original is kept outside the repo.
  - SHA-256 of this copy: `45e41a8589885a09b6acba4ac17c986e181ce9f58b6a6d4be91cf74ae4e47378`.
- Runs made after this one scrub the home folder themselves (`scrub()` in `tailor_or_ask.py`).
