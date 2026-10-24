# is-ms-2027-funded-undecided: fictional persona

## Executive summary

This is a **fictional** situation-only persona: no name, contact details, résumé, or real dates. It exists so the `is-funded-sponsor-triage` prototype can be demonstrated and tested without real personal data, per DATA_CONTRACT §Zero-Conditions. Situation: an international MS Information Systems student (CIP 14.0903, STEM assumed), graduating May 2027 into post-completion OPT, who prefers funded companies and is undecided between Business / Data / Product Analyst and IT Consultant roles.

- `persona.example.json`: read by `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py` (default `--persona`). Every field is `your-input`.
- No `authorization` text contains "authorized", because the shared scorer's `applyProfile` regex would misread it (see `course/2026fa/submissions/yudanzhou/WORKED-RUN.md`, Break 3). The prototype doesn't pass this file to the scorer anyway.
