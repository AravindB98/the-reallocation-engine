# BROKEN scorer, not caught (2026-10-21)

## Executive summary

This folder is evidence of a failed break attempt, kept on purpose. A deliberately wrong scorer (it adds the gates instead of multiplying them) was run on the real capture under the what-if clock. No gate was closed in that data, so the only conformance check at the time ("a closed gate must give Skip") could not see the bug, and the run finished with a report built from wrong scores. Do not read report.md here as advice. The fix (an arithmetic check on the scorer's own trace) is described in WORKED-RUN.md; the re-run is in break/broken-scorer/.
