# Submission status — local review draft

## Executive summary

The local recipe, prototype, offline tests, and evidence are prepared. This is not yet a completed GitHub/Canvas submission: PR, remote CI, student-run attestation, and final policy review remain pending. Use only the new recipe package, not the earlier mode ZIPs.

Assignment: The Reallocation Engine — Recipe Design Assignment

Student: edden-nu (add the required display name in Canvas)

GitHub handle: edden-nu

Domain / situation: early-career Information Systems sponsorship evidence triage; fictional demonstration persona

Recipe path: `recipes/cases/2026fa/edden-nu-sponsor-fit.md`

Prototype command:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/student-first-run
```

GitHub repository / branch / PR URL: upstream `nikbearbrown/the-reallocation-engine`; local branch `contrib/2026fa-edden-nu-sponsor-fit`; personal fork and PR not yet created by this session.

Submitted commit SHA: NOT SUBMITTED. The local archive metadata identifies its exact source commit. After the PR is created, identify the actual pushed commit in the Canvas submission. Do not describe a local commit as remotely submitted.

Lifecycle stage claimed: DRAFT (working offline sample, human adequacy review pending).

Summary of changes: one Python runner, an adapter to the existing classifier, nine synthetic cases, offline tests, separately generated JSON/Markdown outputs, recipe/card, prediction and verification records, domain justification, and transparent AI attribution.

Known limitations: no live employer verification; exact-key company matching only; simple skill tokens; assumed timing; no legal eligibility computation or probability model. ATS onboarding attempts were blocked by local configuration/browser availability. Full course policy attachment and student attestation remain outstanding.

## Required before final delivery

1. Read the full course AI policy and watch the assigned policy video.
2. Run the documented command and tests yourself from a clean checkout; explain and record actual decisions in the attestation and Frictional record.
3. Create/use your fork, push the namespaced branch, open one PR, and verify remote CI.
4. Generate the source ZIP from that exact pushed commit and identify its SHA on Canvas; exclude caches, dependencies, credentials, and private files.
