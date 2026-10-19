# CP4 predictions: break attempts

## Executive summary

These predictions were written before any break attempt was run, so they can be checked honestly against the results. The raw addresses of the pages used as probes are withheld and kept in private notes. Attempts C1 to C5 below are deliberate tries to break the tool, not normal use of it.

## Record

- Date: Mon Oct 19 2026, written before any break attempt.

## Break attempts

- C1. Mutation check: ten one-line mutations of the gate script, each in a throwaway copy; a pass is the unit tests turning red for that mutation.
- C2. Live probes: three pages that are not job postings sent to the liveness check; a pass is none of them coming back "active".
- C3. Missing browser: a live gate run with the browser path pointed at an empty folder; a pass is a clean run-level stop that names the missing browser, with no decision written.
- C4. Profile trap: profile wording that the scorer reads as "no sponsorship needed"; a pass is the gate refusing to run, and the raw scorer showing the silent weight change.
- C5. Input refusals: a timeline given as text, a timeline above 1, a missing timeline, and an output folder inside the repository that is not ignored; a pass is a stop for each, with nothing left behind in the repository.

Probes: probe 1: careers page, posting 2's company; probe 2: careers page, posting 3's company; probe 3: a non-careers home page.

## Predictions

- P9. Of the 10 deliberate code mutations, 4 will turn the unit tests red.
- P10. Of the 3 non-job probe pages, 0 will wrongly come back "active" from ats:liveness.
- P11. With a browser path that does not exist, the gate will stop with the code chromium_unavailable: yes
