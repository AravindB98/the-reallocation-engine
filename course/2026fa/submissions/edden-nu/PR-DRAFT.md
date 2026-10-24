# PR draft — early-career sponsorship triage (DRAFT)

## Executive summary

Adds a small offline prototype that distinguishes missing sponsorship evidence from negative opening policy, and blocks unknown liveness/timing. It reads the shipped company CSV and a sanctioned fictional persona, invokes the maintained liveness classifier, and writes labeled JSON plus Markdown. A 403-page regression was reproduced and corrected. This PR text is a draft, not a posted pull request.

Branch: `contrib/2026fa-edden-nu-sponsor-fit`. Maintained file deliberately patched: none.

## Validation and disclosure

- Nine offline tests pass; real output in `evidence/offline-tests.txt`.
- Namespaced conformance and `npm run verify` pass; verify emits inherited manifest warnings.
- `npm run doctor` exits 0 after dependency setup.
- Full-tree PII scan remains blocked by an author email in the unchanged upstream package lockfile. Do not mark that check clean. Branch-only scan results are in clean-checkout evidence.
- No shared run log, package manifest, lockfile, governance file, or other student's namespace modified.
- No real student résumé or immigration profile included; only a sanctioned fictional persona is read.
- Human adequacy attestation pending; DRAFT status retained.

Before opening: check that this is the student's only open PR, paste the actual required outputs, disclose the upstream scanner failure, and obtain the maintainer's resolution rather than checking an untrue box. No remote CI result has been observed.
