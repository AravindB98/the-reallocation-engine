# Domain Justification: Data Engineering & MLOps H-1B Visa Triage

## 1. User & Situation
- **Target User:** International Master's student in Data Analytics Engineering graduating December 2026, targeting Data Engineer and MLOps / ML Platform Engineer roles.
- **Situation:** Facing an F-1 OPT unemployment window countdown and strict H-1B sponsorship requirements. The primary hurdle is information asymmetry—knowing which companies actually sponsor visas for data/ML roles versus those that only appear to hire.

## 2. Information Asymmetry Addressed
Without this engine, a student cannot easily see:
- Whether a company with recent funding (SEC Form D) has historical DOL H-1B approvals for data roles (as ~95% of companies in the file have blank approval records).
- Whether a posting is a "ghost job" or dead link before spending hours tailoring a résumé.
- Whether timeline constraints (EAD start date vs. role start date and lottery windows) are viable.

## 3. Engine Layer Connection & The 3-3-2 Split
- **Layers Used:** 80 Days to Stay (sponsorship & funding), Job-Ops (liveness), and Cognitive Pivot (BLS SOC code context).
- **3-3-2 Impact:** Takes over the heavy research phase of the "2" (researching and tailoring applications), saving an estimated 4–6 hours per week and cleanly routing dead/non-sponsoring roles into the networking queue ("Consider / Network").

## 4. Domain-Specific Failure Modes
- **Title Mismatch:** "MLOps" appears in zero sponsored job title strings, requiring model judgment mappings.
  - *Hardest to catch for:* a student reading only the Apply/Consider column. A wrongly matched title (the sample scored "Specialist Solutions Architect – Data Engineering") looks like any other scored row.
- **Legal vs. Brand Name Discrepancies:** Companies like Upstart appear only under legal entity names (`UPSTART NETWORK INC`), which would cause false skips if not normalized.
  - *Hardest to catch for:* a student who knows the company only by its brand, who would read "not in dataset" as "doesn't sponsor" and drop a real sponsor (Upstart; Instacart is `MAPLEBEAR INC`).
