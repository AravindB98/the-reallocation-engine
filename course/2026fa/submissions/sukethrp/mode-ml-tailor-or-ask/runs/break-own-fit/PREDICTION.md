# The student's break attempt: an out-of-range fit

## Executive summary

The student designed this break attempt and wrote the prediction below before running it. They set Goodfire's fit to
1.5 in a copy of the live queue. They first ran it on v0.1.1 (this folder, 15:32 EDT) and again on v0.1.2. The
result and the comparison with the prediction are in the worked run.

## The prediction, verbatim (2026-10-19, ~15:45 EDT, before execution)

> I want to test an out-of-range fit value. On a copy of the queue, I would give Goodfire a fit of 1.5, keeping its
> reason and attribution fields valid and leaving the original queue untouched.
>
> My prediction is that the mode will stop at the input gate with exit code 2, identifying that fit must be between
> zero and one. It should stop before fetching postings, creating the run folder, or calling the scorer. Silently
> reducing 1.5 to 1.0 would also fail my expectation: invalid input should be rejected explicitly.

## How each part was made checkable

Claude Code added two things to the student's commands:
- `TAILOR_OR_ASK_FORBID_NETWORK=1`: if the mode tried to fetch a posting before the input gate, it would stop with a
  network-forbidden error instead.
- `ls` and `git diff --exit-code` afterwards: they show whether a run folder appeared and whether the original queue
  changed.
