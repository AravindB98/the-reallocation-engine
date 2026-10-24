# LABELS.md: sentence, posting and title labels (approved by Prathamesh)

## Executive summary

This records the mode's one human judgment: what each job posting's own words mean for a fictional
international student who will need visa sponsorship.

From 11 network-engineering postings fetched from three employers' live public job boards, 5 sentences mention clearance or export
rules. All 5 are at one employer, and 7 postings say nothing. After review, 7 postings are in scope
for network-engineering roles. **2 of them are "contradicted (inferred)"**: each requires a security
clearance, which federal rules generally limit to U.S. citizens. The postings never say so
themselves. **The other 5 are "insufficient"**: the posting does not say, so the student cannot
tell. **No posting offers sponsorship.** Two software-engineering titles were judged out of scope.

**Every approved label below is Prathamesh's judgment, made 2026-10-20 at 13:57 EDT.** The
assistant's original proposals are kept next to each decision.

## Run record

- Run `20261020-1348` (run 2, after the fetch fix). Source: public Lever API, fetched
  2026-10-20T17:48:28Z. Extraction is read-only (`extract_auth_sentences.py`); the raw text stays in
  `private/`.
- Labels: **supported** = an explicit offer of sponsorship; **contradicted** = an explicit exclusion
  for this persona; **insufficient** = silent, ambiguous, or a keyword false friend. Silence is never
  "no". **(inferred)** = the label rests on an outside rule, not on the posting's words.
- Proposals: Claude Code (Opus 5.5), 2026-10-20 13:49 EDT. **Approval: Prathamesh, 2026-10-20 13:57 EDT;
  S1 note and the Zoox exclusion confirmed 14:01 EDT. Labels final.**
- Outside rule for "(inferred)": **32 CFR § 117.10(k)(1)**, quoted with its provenance in SOURCES.md.
  It says non-U.S. citizens should not be employed in duties requiring classified access, with a rare
  Limited Access Authorization (LAA) exception, which is not valid for TOP SECRET.

## A. Sentence labels

| # | Posting (Shield AI) | Section | Excerpt (verbatim, ≤30 words) | Claude proposed | **Approved (Prathamesh)** | Note |
|---|---|---|---|---|---|---|
| S1 | Network Architect (R6158) | Preferred | "Knowledge of CMMC, NIST 800-171, ITAR, controlled unclassified information, and network designs supporting regulated or isolated environments." | insufficient | **insufficient** | Prathamesh's note: **"ITAR knowledge preferred; not an eligibility rule"** (corrected 14:01 EDT at Prathamesh's request: the 13:57 note "clearance preferred, not required" did not match this sentence, which names ITAR as subject knowledge and does not mention clearance) |
| S2 | Network Engineer (R4843) | Required | "This position requires the ability to obtain and maintain a DoD government clearance at the Secret level" | contradicted [verify] | **contradicted (inferred)** | clearance required; citizenship limit from 32 CFR 117.10(k)(1), not from the posting |
| S3 | Network Engineer (R4843) | Required | "Ability to obtain a S//SAR level security clearance desired." | insufficient | **insufficient** (by the plan's rule) | under Required but worded "desired": ambiguous, so it does not decide |
| S4 | Software Engineer, Networking & OS (R5488) | Required | "Ability to obtain security clearance." | contradicted [verify] | **contradicted (inferred)** | posting is out of scope (section C) |
| S5 | Staff Engineer, System Test Network (R6030) | Required | "Ability to obtain a SECRET clearance." | contradicted [verify] | **contradicted (inferred)** | same rule as S2 |

## B. Posting labels

**Approved combination rule:** only Required-section sentences decide; the most restrictive wins
(contradicted > supported > insufficient); Preferred sentences are noted but do not decide;
silent = insufficient, never "no".

| Employer | Posting | Sentences | Claude proposed | **Approved posting label** | Scope |
|---|---|---|---|---|---|
| Shield AI | Network Architect (R6158) | S1 (Preferred only) | insufficient | **insufficient** (S1 noted, does not decide) | in scope |
| Shield AI | Network Engineer (R4843) | S2, S3 | contradicted | **contradicted (inferred)**, decided by S2 | in scope |
| Shield AI | Senior Network Engineer (R5667) | none (silent) | insufficient | **insufficient** | in scope |
| Shield AI | Staff Engineer, System Test Network (R6030) | S5 | contradicted | **contradicted (inferred)** | in scope |
| Zoox | Senior Manager, Network Engineering & Infrastructure | none (silent) | insufficient | **insufficient** | in scope |
| Zoox | Senior Network Security Engineer | none (silent) | insufficient | **insufficient** | in scope |
| Zoox | Staff Network Security Architect | none (silent) | insufficient | **insufficient** | in scope |
| Shield AI | Software Engineer, Networking & OS (R5488) | S4 | contradicted | contradicted (inferred) | **flagged, out of scope** |
| Palantir | Senior Software Engineer, Network Infrastructure (×3, identical text) | none (silent) | insufficient | insufficient | **flagged, out of scope** |

**Shortlist (in scope, SOC 15-1241): 7 postings. 2 contradicted (inferred), 5 insufficient, 0 supported.**
All 7 were `active` in the liveness check (13:47 and 14:10 EDT), so none is excluded and the shortlist
is unchanged.

## C. Title decisions

| Employer | Title | Filter | Claude's question | **Decision (Prathamesh)** |
|---|---|---|---|---|
| Shield AI | Software Engineer, Networking & OS (R5488) | flag | in scope for 15-1241? | **out of scope**: a software role, likely SOC 15-1252; listed as "flagged, out of scope" |
| Palantir | Senior Software Engineer, Network Infrastructure (×3) | flag | in scope for 15-1241? | **out of scope**: a software role, likely SOC 15-1252; listed as "flagged, out of scope" |
| Zoox | Software Engineer - Road Network Tools | exclude | agree to exclude? | **excluded**, confirmed 14:01 EDT: a false friend, a road-mapping software role, not network engineering |

## D. Company-level signal (80 Days; kept separate, never a claim about any posting)

| Employer | H-1B approvals | Denials | Note |
|---|---|---|---|
| Zoox (ZOOX INC) | 1,364 | 10 | strong history, yet all 3 network postings are **silent** |
| Palantir (PALANTIR TECHNOLOGIES INC) | 462 | 4 | its postings here are out of scope; none of its sponsored titles is a network title |
| Shield AI (SHIELD AI INC) | — | — | no H-1B trace in this dataset ("no trace", not "no") |
