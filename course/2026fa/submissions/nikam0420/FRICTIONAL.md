# Frictional — actual attempt log

## Executive summary
This log records what the AI actually tried while preparing the sample and what still needs the student's own execution and judgment. It explains why the prototype uses conservative assumptions and explicit gates. It does not claim that the student has already performed these checks.

## AI attempt 1 — inspect before choosing a signal
Expected: reuse the existing scorer and shipped company data. Observed: the current CSV path differs from a path named in a shared recipe; the maintained scorer has zero role-quality weight and missing gates default to 1. Response: use the existing CSV path, omit wage scoring, and reject missing gates before invoking the unchanged scorer. Learning: a command/path named in a recipe is not proof it exists.

## AI attempt 2 — distinguish a stored record from a policy
Expected: approvals might support a sponsorship signal. Observed: aggregate approvals and title lists do not establish this exact vacancy's sponsorship or a probability. Response: preserve approvals as record, label the binary presence signal your-input and use Likely instead of Proven. Unresolved: role/SOC-specific join and current employer willingness.

## AI attempt 3 — install and keep scope clean
Observed: npm install changed package-lock.json. Response: restored that installation-generated change before preparing the contribution; no maintained dependency edit is included. Learning: inspect git diff even after setup.

## AI attempt 4 — initial sample and offline break checks
Observed: enough-time → Consider 0.56; closed-posting → Skip 0; too-little-time → Skip 0. Nine offline tests passed, including missing company, missing liveness, missing approvals, duplicate company, malformed date, elapsed deadline, invalid lag and output-path guard. Response: keep final approval pending even when software checks pass. Evidence: TEST-REPORT.md and WORKED-RUN.md contain terminal output; code is `scripts/contrib/2026fa/nikam0420-analyst-opt-triage/`.

## Student section — complete after actually running
Record your actual date/time, commands, expected vs observed output, hand cross-check, changes or unresolved questions, and final commit SHA. State which AI suggestions you accepted, modified or rejected and why. Do not invent a failure to fill this section. Your decision to adopt this scope and your own observations are still required.

## AI attempt 5 — baseline ATS and full-tree privacy checks
Expected: the default setup might run the introductory ATS commands. Observed: dry-run scan lacks portals.yml; liveness lacks a Playwright browser; full-tree PII scan flags an email inherited from upstream package-lock.json. Response: record the actual failures, keep liveness as a sample assumption and leave the upstream scanner unchanged. Unresolved: the full-tree scanner/CI blocker needs maintainer or instructor review; clean branch-diff scanning alone does not establish full-tree success.

## My execution — Siddhesh Nikam, 2026-10-02

I used a starter prepared by ChatGPT/Codex. The AI drafted the recipe, prototype, tests and documents. I created my GitHub fork and branch, copied the files, and ran the prototype and checks on my Mac.

My initial clone failed because the fork was unavailable. After creating the fork, cloning succeeded. Copying initially failed because the extracted folder was unavailable; I located it and copied successfully.

The prototype returned one Consider and two Skip results. All nine offline tests passed. The deliberate missing-company attempt returned BLOCKED with exit 2. I checked the CSV directly: SOFAR SOUNDS LTD had 2.0 stored approvals and Data Analyst in its title list.

Doctor and verification passed. The full-tree PII scan failed on a dependency email; that issue remains unresolved. I restored installation-generated lockfile changes without weakening the scanner.

Evidence: my-checks/ contains my captured terminal output. The sample uses fictional posting and timing inputs; it does not verify current sponsorship or a live vacancy.
