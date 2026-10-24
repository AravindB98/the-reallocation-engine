# Sanitized copy: README sample command 2 with the README's documented --human and --csv options (fixtures only, scorer on), out-dir outside the clone; names, links, ids and local paths are replaced by references such as <posting 1 url> or <host A>.
$ python3 scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/live_sponsor_gate.py --inputs scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/fixtures/inputs.example.json --out-dir <os-temp>/out-sample2b --liveness-from scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/fixtures/liveness-canned.txt --canned --human scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/fixtures/human.example.json --csv scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/fixtures/companies.csv
posting 2: CANDIDATE, 1 row(s) share the first word; confirm one by exact name:
  - JESSAMINE JETWORKS GLOBAL INC
ok: 2 postings -> <os-temp>/out-sample2b/report.md
exit=0
--- report table:
| Posting | Host | Liveness | Sponsor record | Timeline | Decision | Why | Sources |
|---|---|---|---|---|---|---|---|
| posting 1 | host A | PASS | MATCH (approvals 120, denials 3) | 0.9 | Consider | above threshold (0.436) but one soft spot: sponsorship tier "Likely" | liveness record; sponsor model-judgment; fit your-input; timeline your-input |
| posting 2 | host B | UNRESOLVED (person saw it open) | CANDIDATE, confirmed by a person (approvals 70, denials 2) | 0.9 | Consider | above threshold (0.320) but one soft spot: sponsorship tier "Likely" | liveness your-input; sponsor model-judgment; fit your-input; timeline your-input |
