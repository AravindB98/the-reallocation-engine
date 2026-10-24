# Live posting check for the sponsor-tier shortlist

## Executive summary

This report takes the companies the sponsor-tier shortlist marked as worth a closer look and asks two questions a list of companies cannot answer: is there a real, open backend job at the company today, and does the posting itself shut the candidate out (no sponsorship, U.S. citizens only, a clearance)? A program checks whether each posting is still open and quotes the sentences that matter; a person reads every posting and makes both calls.

Read it before applying: a company with a strong sponsorship record can still have no open role, or a posting that excludes the candidate. Of 59 shortlisted companies, a job board was found for only 26, on the three job-board systems this check reads, under the names it tried. 8 postings were chosen from those, one per company; the program found 7 still open, and the person cleared 7, held 0 and set aside 1. So 7 of the 59 shortlisted companies end the run with a posting that cleared both gates. Of the other 52: 33 with no board found under the names tried, 17 with a board but no posting that fits the rules, 1 with a fitting posting that the cap of 8 left out and 1 whose chosen posting was set aside.

## Read this first

- **The company data is old.** Its newest funding date is 2025-09-26, 12.8 months before the run (the mode's limit is 6). The run went ahead with this warning (gate G0) because the acceptance flag was given; the base run's log records the flag, not who gave it. The postings themselves were read live from today's job boards.
- **Start dates were not checked.** The candidate's earliest start is 2027-06-01, about 7 months after the run (from the base run's timeline gate), and no gate checks whether an employer will wait that long. Ask before applying.
- **Most of the shortlist is out of reach.** 33 of 59 shortlisted companies have no board on Greenhouse, Lever or Ashby under a name the board finder tried, so this check says nothing about them.
- **The cap chose among equal scores by name.** ZSCALER INC (802 approvals) had a fitting posting and the same score as a chosen company, and was left out by alphabetical order, not by evidence, so check it by hand.
- **The quoted sentences decide nothing.** A posting with no quoted sentence is not a pass; the person read each one.

## From the shortlist to a decision

| Step | Count |
|---|---|
| Companies the base run marked worth a closer look | 59 |
| ...with a job board the scanner can read (a proposal; the person confirms the company) | 26 |
| Postings the scanner kept from those boards (broad title filter) | 893 |
| ...that pass the mode's rules (backend family, U.S. location, no senior marker in the title, not contract or PhD-only) | 39 |
| ...from this many companies | 9 |
| Chosen for the gates (one per company, at most 8) | 8 |
| Still open, per the liveness checker | 7 |
| Confirmed live by the person | 7 |
| Cleared (both gates) / held / set aside | 7 / 0 / 1 |
| **Shortlisted companies that end the run with a cleared posting** | **7 of 59** |

## The postings

| Company | Sponsor tier (approvals, rate) | Posting | Checker (H1) | Person (H1) | Person (H2) | Quoted sentences | Outcome |
|---|---|---|---|---|---|---|---|
| COHERE HEALTH INC | Proven (104, 98.11%) | [Software Engineer II](https://job-boards.greenhouse.io/coherehealth/jobs/7930480003) | active | live, right company, the job itself shown | no blocker read | degree level: "Bachelor's degree in computer science, software engineering, or equivalent practical experience" | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| DATABRICKS INC | Proven (1640, 99.51%) | [Software Engineer, Web Products](https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002) | active | live, right company, the job itself shown | no blocker read | clearance or export control: "If access to export-controlled technology or source code is required for performance of job duties, it is within Employer's discretion whether to apply for a U.S. government license for such positions, and Employer may decline to proceed with an applicant on this basis alone." | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| FIGMA INC | Proven (188, 98.95%) | [Data Platform Engineer](https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004) | active | live, right company, the job itself shown | no blocker read | none (not a pass) | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| MERCURY TECHNOLOGIES INC | Proven (40, 100%) | [Software Engineer - Infrastructure](https://job-boards.greenhouse.io/mercury/jobs/6150432004) | active | live, right company, the job itself shown | no blocker read | none (not a pass) | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| SIGMA COMPUTING INC | Proven (136, 100%) | [Software Engineer - Compiler](https://job-boards.greenhouse.io/sigmacomputing/jobs/7767918003) | active | live, right company, the job itself shown | no blocker read | none (not a pass) | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| STRIPE INC | Proven (1250, 98.27%) | [Backend Engineer, Core Technology](https://stripe.com/jobs/search?gh_jid=6042172) | active | live, right company, the job itself shown | no blocker read | none (not a pass) | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| VERKADA INC | Proven (272, 98.55%) | [Backend Engineer - Connectivity](https://job-boards.greenhouse.io/verkada/jobs/5194598007) | active | live, right company, the job itself shown | no blocker read | sponsorship: "We do sponsor and take over sponsorship of employment visas for this role." | **cleared**: the checker found it active and Aravind Sundaravadivelu cleared H1 and H2 |
| XAGE SECURITY INC | Proven (24, 92.31%) | [Software Engineer - Full Stack](https://jobs.lever.co/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3) | expired (HTTP 404) | not live | not needed (H1 failed) | none (not a pass) | **set aside**: H1: not live (per Aravind Sundaravadivelu) |

## Gates

| Gate | Cleared by | Result |
|---|---|---|
| G0 data age | whoever gave the acceptance flag (the log records the flag, not a name) | stale-accepted |
| G1 persona, G2 scorer integrity, G3 timeline | the program | pass, pass, open |
| H1 posting live, machine half | the repository liveness checker | 7 active, 1 expired, 0 uncertain (checker exit 1) |
| H1 posting live, person half | Aravind Sundaravadivelu | 7 of 8 confirmed live |
| H2 posting eligibility (asked where H1 passed) | Aravind Sundaravadivelu | 7 cleared, 0 blocked, 0 unclear |

Decided by Aravind Sundaravadivelu at 2026-10-20T09:03:39Z. Read each of the 8 chosen postings in a browser tab on 2026-10-20 (Pacific early morning), about a minute after the liveness checker re-ran on the same URLs, and answered one multiple-choice question per posting in Claude Code. The assistant opened the tabs and recorded the answers; the decisions are the person's.

## Companies the live check could not reach

- **No board found (33):** AEYE INC, APEX TECHNOLOGY INC, BILT TECHNOLOGIES INC, BLUECORE INC, BRAIN CORP, CCC INTELLIGENT SOLUTIONS HOLDINGS INC, CELONA INC, CENTIFIC GLOBAL SOLUTIONS INC, CODEAC SOLUTIONS INC, COPART INC, CYNGN INC, FIDDLER LABS INC, FOURSQUARE LABS INC, GRAMMARLY INC, HALO INDUSTRIES INC, HAYDEN AI TECHNOLOGIES INC, INTEL CORP, NATRON ENERGY INC, OBSERVE INC, RADICAL INC, RETROCAUSAL INC, SERVICETITAN INC, SPANIO INC, TRANSCEND INC, VOUCH INC, WHATNOT INC, AKIA SYNDICATE, APRIORI TECHNOLOGIES INC, CRE8TECH LABS INC, IFOODDECISIONSCIENCES INC, LIMINAL INSIGHTS INC, NEXA AI INC, SWING THERAPEUTICS INC.
- **A board, but no posting passed the rules (17):** 1UPHEALTH INC (0 kept by the scanner), ABACUS INSIGHTS INC (7 kept by the scanner), AMOUNT INC (2 kept by the scanner), APPTRONIK INC (43 kept by the scanner), DILIGENT ROBOTICS INC (4 kept by the scanner), DOPPEL INC (3 kept by the scanner), GITAI USA INC (9 kept by the scanner), HIGHNOTE PLATFORM INC (2 kept by the scanner), HUMAN INTEREST INC (2 kept by the scanner), JUSTWORKS INC (21 kept by the scanner), KOGNITOS INC (0 kept by the scanner), OVERJET INC (4 kept by the scanner), PATREON INC (5 kept by the scanner), PSIQUANTUM CORP (43 kept by the scanner), TWIN HEALTH INC (7 kept by the scanner), VIDMOB INC (1 kept by the scanner), WISETACK INC (1 kept by the scanner).
- **A fitting posting, left out by the cap of 8 (1):** ZSCALER INC (1 passed the rules; same score as a chosen company, 0.315, so the cap cut it by name). Companies are taken best score first; ties are broken by name.

## What this run can and cannot verify

- **Can:** that each chosen posting answered the liveness checker at the time shown; which sentences in its text mention sponsorship, citizenship, clearance, authorization, degree level, dates or contract terms; and what the named person decided after reading it.
- **Cannot:** that a company will sponsor this candidate (the record is company-wide history); that a posting is still open after the check; whether an employer will wait until the candidate can start; that the board found by name belongs to the company (the person checked it for each live posting); anything about companies without a readable board; whether the candidate fits the job (fit is not scored).

## Run record

- **Base run:** aravindkumar2504-preopt-swe-sponsor-tiers v0.2.0, as of 2026-10-20.
- **Liveness checker:** `scripts/ats/check-liveness.mjs` (SHA-256 e4d8d1e78d86), run 2026-10-20T08:53:08.598Z to 2026-10-20T08:53:28.898Z.
- **Inputs (SHA-256, first 12):** base_run_log 6fe8206659c3; boards cdb7cd8d447b; scan_history d825a7be455c; selected_postings c9b638b4c475; h1_liveness 5556feb69921; h2_screen 1beb0063411c; gate_decisions 9d2eaafef5a0.
- **Labels:** sponsor tier, liveness verdict, posting text and quotes are record; the board-to-company match is a model-judgment label (a name rule; the person confirmed the company for each posting that was live); the posting rules and the quote categories are your-input rules; the gate decisions are the named person's; no model was asked to judge any company.
