# ml-tailor-or-ask — human card

## Executive summary

This card is for a person deciding which machine-learning job postings deserve a tailored application. It explains
what the mode checks, what it never checks, and how to run it. Given a list of target companies, it first reads the
job boards it can read and reports what the public H-1B file holds for every company, including the ones it cannot
read. Then, for each posting, it checks three things:
- whether the posting is still open;
- whether the company's public H-1B history includes this kind of role;
- whether the posting's required experience is within reach of the person's documented work.

It then suggests tailoring, asking a specific question first, moving on, or holding until something is resolved.
Postings where only the person's fit call is left go on a ranked shortlist.
It decides nothing on its own. A passed experience check is never a claim of meeting the whole job description, and
a sponsorship history is never a promise of sponsorship.

**Audience:** an international ML/AI engineer on F-1 with prior production experience, deciding where the next
research-and-apply hours go.
**Agent twin:** `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md` · **Version:** 0.2.0 (DRAFT)

## Purpose

For each posting, the mode answers: given what the records show today, should this posting get a tailored
application, a specific question first, no more time, or nothing until a check is resolved? Every value is labelled
`record`, `your-input`, `model-judgment` or `computed` (a script's result, such as a name match), and the person writes
the final decision, with a reason.

## What it can verify

- The posting page showed an apply control on the day of the check. That is all "active" means.
- The company row the posting matched in the sponsorship file. Its legal name and city are printed next to every
  suggestion. Or the person's recorded identity decision, with what they checked and their sources. A match no
  person confirmed is labelled `computed` and called a name match.
- That row's company-wide H-1B approvals and denials, and its short list of top sponsored titles.
- Which of those titles count as evidence under the rules the person adopted. Level II / L2 titles count, and every
  exact title is shown.
- The posting's own required and preferred lines, word for word, and the experience figures they state.
- The duration of documented work, by type, with overlapping months counted once.

## What it cannot verify

- Whether this employer will sponsor this person now. 0.9 and 0.6 are screening assumptions, not chances.
- When a title was sponsored, or at what level. The file has no filing years.
- Whether the matched company is the employer on the posting, beyond an exact name. Check the printed row.
- Whether the counted months are the *kind* of experience a line asks for. The kind is shown, never checked.
- Whether co-op, internship, assistantship, contract or part-time work counts. That becomes the question to ask.
- Degree, skills, tools, sponsorship statements, new-grad windows and work conditions. They are listed for the person
  to read.
- Anything legal. Ask the school's DSO or an attorney.

## Dependencies

- Node 20+ and Python 3.12. Run `npm install` once at the repo root.
- For live liveness checks, Playwright's Chromium, which the engine's `check-liveness.mjs` uses. If the browser cannot
  launch, the posting is held, never called closed.
- The pinned sponsorship file `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- Fictional personas for public runs:
  - the live run uses `search/examples/kavya-raman/profile.yml` and `search/examples/kavya-raman/resume.example.json`,
    the applicant this mode is for: prior full-time production ML;
  - the sample uses `search/examples/priya-nair/profile.yml` and `search/examples/priya-nair/resume.example.json`.
  A person's own files stay in the gitignored `search/` and `private/`.

## Annotated commands

**Discover, then judge.** The first command reads each target's job board, keeps the postings the filters keep, and
writes `target-audit.md` and a queue. The second judges every kept posting live. Then state a fit, with your reason,
for the shortlisted postings you want judged, and run the second command again.

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py --targets course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json --out-dir <dir>
```

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue <dir>/queue.json --out-dir <dir>/judged
```

**The sample run.** Offline, with illustrative postings at real companies. Expected: TAILOR 1 · ASK FIRST 4 ·
MOVE ON 2 · HOLD 3, with 4 scored.

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py
```

**The break demonstration.** The same input sent to the engine's scorer and to the guard. Nobody checked whether
the posting is open:
- the engine's scorer still says Apply;
- the guard refuses it (exit 3, "liveness is missing").

```bash
npm run score -- scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir output/sukethrp-ml-tailor-or-ask/break-demo
```

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json
```

**A live run.** Real postings: a live liveness check, plus the posting text from Greenhouse's public API. Expect HOLDs
the person resolves:
- record each company identity as confirmed, with what was checked and the sources, or as a candidate;
- state fit and timeline with reasons, or leave them unset with the reason;
- then decide.

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue <queue.json> --out-dir <dir>
```

The v0.1.2 worked run's queue is `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live-v0.1.2/queue.json`.

**A private run** on the person's own profile and résumé. Every output must go under `private/`, which is checked
before any private file is read.

```bash
python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --private --persona search/profile.yml --resume search/resume.json --queue private/<queue.json> --out-dir private/<run>
```

**The tests.** Offline; a network call stops the run.

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
```

## What it produces

- `report.md`, for the person:
  - a summary;
  - what to do next, with the questions to ask (closest stretch first);
  - for each posting, a verified-vs-inferred table and a requirements table that shows the kind of experience each
    line asks for, marked as not checked;
  - what the run cannot verify.
- `run-log.json`, for agents: every value with its label and source, and every check, guard result and scorer call.
- `roles.json` plus the scorer's own `role-scores.json` and `role-scores.md`, and in live mode each posting's text with
  its SHA-256.

## Named failure modes

1. **A namesake match makes a major sponsor look unknown.**
   - **Shape:** the posting's "Meta" matches META CO of Portola Valley, CA, a small company with no H-1B record. The
     file has no Meta Platforms row. So version 0.1.0 had the person tell a recruiter the data showed "no sponsorship
     history" for one of the largest H-1B sponsors in the country.
   - **Hardest to catch for:** someone who reads the company name, not the printed legal name and city.
   - **Even an exact match can be wrong:** "Orenda" matches ORENDA INC, but the file's website leads to a
     domain-for-sale page while the employer uses another domain.
   - **Guard:** every suggestion prints the matched row. Since 0.1.1, a match no person confirmed is labelled
     `computed`, and its reason and question say it may be a different company. A person can confirm a row, or keep it
     as a candidate, which holds the posting. Aliases are a typed proposal.
2. **Co-op or academic months read as industry years.**
   - **Shape:** an 8-month co-op plus a research assistantship adds up to "a year". The posting's "1+ years" then
     looks met, when the employer may not count either.
   - **Hardest to catch for:** someone whose background really is strong, because the number looks earned.
   - **Guard:** work is counted by type. Co-op counts only when the posting accepts it, and assistantships, contract
     and part-time work need supporting information.
3. **A new-grad ceiling read as a minimum.**
   - **Shape:** "Recent graduates or up to 2 years" read as "2+ years required", so a fitting posting looks like a
     gap. This happened in an early version, and it is fixed and tested.
   - **Hardest to catch for:** early-career applicants with prior experience, who are exactly the people a ceiling
     matters to.
4. **Company-wide approvals read as ML approvals.**
   - **Shape:** 802 approvals at a large employer look like strong evidence for an ML role, when the counted ML title
     may be one line in a short list.
   - **Hardest to catch for:** anyone reading the tier, not the titles.
   - **Guard:** the exact titles are printed, and 0.9 is labelled an assumption.
5. **The scorer fails open.**
   - **Shape:** a posting with no liveness check, or a gate written as text, comes out Apply.
   - **Hardest to catch for:** anyone trusting the scorer's output.
   - **Guard:** the input guard refuses such input before the scorer sees it.
6. **The dream list the data cannot see.**
   - **Shape:** the five large employers an ML/AI engineer on F-1 most often names have no H-1B record in this file.
     Google appears only as ALPHABET INC with no H-1B fields, Meta only as FACEBOOK INC with no fields plus a
     namesake, and Amazon, Apple and Netflix not at all. None of their careers sites is readable by this version.
     A tool that silently skips them looks as if it found nothing worth applying to there.
   - **Hardest to catch for:** someone whose list is mostly large employers, because a clean report reads as "checked".
   - **Guard:** the target audit lists every company with what it could and could not read, and says "unknown, not
     'no'". Dated, role-level evidence for these employers (DOL LCA records) is a typed proposal.
