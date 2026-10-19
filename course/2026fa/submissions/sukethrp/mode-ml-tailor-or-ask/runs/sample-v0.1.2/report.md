# Tailor or ask — 2026-09-30 (sample mode)

## Executive summary

This report looks at 10 job posting(s) for someone who will need H-1B sponsorship and asks, for each one, whether it deserves the time a tailored application takes. It checks whether the posting is still open, whether the company's public H-1B history includes this kind of role below senior level, whether the posting's stated experience minimum is within reach, and whether the timing works, then suggests one next step. Read it before spending application time on any of these postings.

*Sample mode: the postings, page snapshots, posting texts, fit and timeline values are illustrative fixtures written by Claude Code (labelled model-judgment). The sponsorship evidence is read from the real file.*

**What it found.** Tailor 1 · ask first 4 · move on 2 · hold 3. A hold means a check could not be resolved, so there is no suggestion until a person resolves it. Of each posting's own requirements, only the duration of experience minimums is checked; the kind of experience and every other line are listed for you to read. Every suggestion is a suggestion: the person decides each posting.

## What to do next

### Tailor (1)

- **Discord — Machine Learning Engineer, New Grad** (`s01-discord-mle-new-grad`). Why: every gate is open and the scorer says Apply: composite 0.446 ≥ 0.3, gates healthy.
  - Next: Matched by name only, not confirmed by a person: row 7770: DISCORD INC (San Francisco, CA). First check this is the employer on the posting. Worth tailoring, but only the duration of experience minimums was checked: not the kind of experience, and not the other 3 required line(s). Read them yourself first, and confirm sponsorship with the recruiter early. Passing this check is not a claim of meeting the whole job description. Refresh the liveness check on the day you apply.

### Ask First (4)

- **Airbnb — Machine Learning Engineer, Early Career** (`s03-airbnb-mle-early-career`). Why: the scorer says Consider; the sponsorship evidence is soft: no ML/AI title among the listed sponsored titles.
  - Question to ask: "The public H-1B record matched to Airbnb by name only (AIRBNB INC, SAN FRANCISCO, CA) lists these sponsored titles: 'Software Engineer', 'Senior Software Engineer', 'Data Scientist', 'Senior Data Scientist', 'Engineering Manager'. None is an ML/AI role. Does Airbnb sponsor ML/AI engineers at this level?"
  - Next: Matched by name only, not confirmed by a person: row 1013: AIRBNB INC (SAN FRANCISCO, CA). First check this is the employer on the posting. Ask this before spending tailoring time. Refresh the liveness check on the day you apply.
- **Meta — AI Research Engineer, University Grad** (`s05-meta-ai-research-engineer`). Why: the row matched to 'Meta' by name only, row 16612: META CO (PORTOLA VALLEY, CA), has no H-1B history. It may be a different company: unknown, not 'no'.
  - Question to ask: "Does Meta sponsor H-1B visas for the AI Research Engineer, University Grad role?"
  - Next: Matched by name only, not confirmed by a person: row 16612: META CO (PORTOLA VALLEY, CA). First check this is the employer on the posting. Ask before tailoring: a recruiter, or someone on the team. Refresh the liveness check on the day you apply.
- **Etsy — Machine Learning Engineer I, Search** (`s02-etsy-mle-1-search`). Why: a stretch: 4 months short of a stated minimum ('1+ years of experience building and shipping ML models'; documented experience: 0 months of employment, plus 8 months of co-op or internship; 8 months of all documented work, which still falls short); the employer's reading of the minimum could change the decision.
  - Stretch: 4 months short of a stated experience minimum.
  - Question to ask: "Is '1+ years' a firm minimum, or would you consider someone with fewer years who has relevant production ML experience?"
  - Next: Matched by name only, not confirmed by a person: row 9093: ETSY INC (BROOKLYN, NY). First check this is the employer on the posting. Ask before spending tailoring time, and put postings closer to the documented experience first. Refresh the liveness check on the day you apply.
- **Hugging Face — Machine Learning Engineer, Open Source** (`s04-huggingface-mle`). Why: the row matched to 'Hugging Face' by name only, row 12614: HUGGING FACE INC (BROOKLYN, NY), has no H-1B history. It may be a different company: unknown, not 'no'.
  - Stretch: 6 months short of a stated experience minimum.
  - Question to ask: "Does Hugging Face sponsor H-1B visas for the Machine Learning Engineer, Open Source role?"
  - Question to ask: "The posting requires '6+ months of hands-on ML engineering experience'. My documented experience is 0 months of employment, plus 8 months of co-op or internship. Does co-op or internship time count toward this requirement?"
  - Next: Matched by name only, not confirmed by a person: row 12614: HUGGING FACE INC (BROOKLYN, NY). First check this is the employer on the posting. Ask before tailoring: a recruiter, or someone on the team. Refresh the liveness check on the day you apply.

### Move On (2)

- **Celestial AI — Machine Learning Engineer** (`s06-celestialai-mle`). Why: the posting is closed (liveness: expired).
  - Stretch: 16 months short of a stated experience minimum.
  - Next: Matched by name only, not confirmed by a person: row 5181: CELESTIAL AI INC (Santa Clara, CA). First check this is the employer on the posting. No research or application time here.
- **Kensho — Machine Learning Engineer** (`s09-kensho-mle`). Why: a required line says its minimum is firm, and it is out of reach: '2+ years of professional software or ML experience (a firm requirement)' (documented experience: 0 months of employment, plus 8 months of co-op or internship; 8 months of all documented work, which still falls short).
  - Stretch: 16 months short of a stated experience minimum.
  - Next: Picked in the queue, not confirmed by a person: row 14287: KENSHO TECHNOLOGIES INC (Cambridge, MA). First check this is the employer on the posting. No tailoring time here. If you know the minimum is soft, override with your reason.

### Hold (3)

- **AppLovin — Machine Learning Engineer, New Grad** (`s07-applovin-mle-new-grad`). Why: unresolved: liveness (liveness-uncertain).
  - Next: Matched by name only, not confirmed by a person: row 1955: APPLOVIN CORP (PALO ALTO, CA). First check this is the employer on the posting. The liveness check could not tell whether the posting is open (the page had content but no apply control). Open it yourself.
- **Databricks — AI Engineer, New Grad** (`s08-databricks-ai-engineer`). Why: unresolved: timeline (timeline-withheld).
  - Next: Matched by name only, not confirmed by a person: row 7248: DATABRICKS INC (SAN FRANCISCO, CA). First check this is the employer on the posting. The dates needed to check timing were withheld on purpose. Nothing that depends on timing is recommended until a factor is given. timeline: the person's reason: "illustrative: the person keeps their dates private, so timing stays unresolved"
- **Peloton Interactive — Machine Learning Engineer** (`s10-peloton-mle`). Why: unresolved: company (ambiguous-company-match), liveness (stale-liveness).
  - Next: Several companies in the file share this name. Pick the right one from the candidates and add its row number as `csv_row` in the queue. The posting check is older than the allowed age. Check it again before deciding.

## Verified vs inferred, posting by posting

`record` = read from a repo record or a live check · `your-input` = declared by the student · `model-judgment` = proposed by Claude Code · `computed` = produced by a script from the labelled inputs (the scorer's arithmetic, or a name match), not a fact · "not checked" = a posting line shown for you to read, which the mode did not check.

### Discord — Machine Learning Engineer, New Grad

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Discord — Machine Learning Engineer, New Grad | model-judgment | the queue |
| company row | row 7770: DISCORD INC (San Francisco, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'discord': a name match, not confirmed by a person |
| H-1B approvals / denials | 122 / 0 | record | Total Approvals, Total Denials |
| sponsored titles | Senior Software Engineer; Software Engineer; Software Engineer, Machine Learning; Product Manager; Engineering Manager | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | Software Engineer, Machine Learning | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Proven -> 0.9 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.7 (illustrative: Python/PyTorch coursework and one shipped ML project match the posting) | model-judgment | declared in the queue |
| scorer | Apply (composite 0.446) | computed | scripts/score/role-scorer.mjs |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | BS or MS in Computer Science or a related field | no | — | not checked: read it yourself |
| required | Experience with Python and PyTorch | no | — | not checked: read it yourself |
| required | Coursework or projects in machine learning | no | — | not checked: read it yourself |
| preferred | 1+ years of industry ML experience | duration: 1+ years | industry ML experience | duration short by 4 months, counting every documented month |
| preferred | Experience with online experiments | no | — | not checked: read it yourself |

### Etsy — Machine Learning Engineer I, Search

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Etsy — Machine Learning Engineer I, Search | model-judgment | the queue |
| company row | row 9093: ETSY INC (BROOKLYN, NY) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'etsy': a name match, not confirmed by a person |
| H-1B approvals / denials | 222 / 2 | record | Total Approvals, Total Denials |
| sponsored titles | Senior Software Engineer I, Machine Learning; Senior Software Engineer II; Senior Product Manager, Search Matching; Engineering Manager, Machine Learning Systems; Software Engineer, Knowledge Base Platform | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | none | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Likely -> 0.6 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.75 (illustrative: a search/ranking project matches the team) | model-judgment | declared in the queue |
| scorer | Consider (composite 0.370) | computed | scripts/score/role-scorer.mjs |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 1+ years of experience building and shipping ML models | duration: 1+ years | building and shipping ML models | duration short by 4 months, counting every documented month |
| required | Strong Python and SQL | no | — | not checked: read it yourself |
| preferred | Experience with learning-to-rank | no | — | not checked: read it yourself |

### Airbnb — Machine Learning Engineer, Early Career

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Airbnb — Machine Learning Engineer, Early Career | model-judgment | the queue |
| company row | row 1013: AIRBNB INC (SAN FRANCISCO, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'airbnb': a name match, not confirmed by a person |
| H-1B approvals / denials | 1000 / 10 | record | Total Approvals, Total Denials |
| sponsored titles | Software Engineer; Senior Software Engineer; Data Scientist; Senior Data Scientist; Engineering Manager | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | none | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Likely -> 0.6 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.6 (illustrative: partial match: the posting asks for experimentation platforms) | model-judgment | declared in the queue |
| scorer | Consider (composite 0.332) | computed | scripts/score/role-scorer.mjs |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 0-2 years of industry experience | duration: 0-2 years | industry experience | duration met (kind not checked) |
| required | Python and one deep-learning framework | no | — | not checked: read it yourself |
| preferred | Experience with causal inference | no | — | not checked: read it yourself |

### Hugging Face — Machine Learning Engineer, Open Source

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Hugging Face — Machine Learning Engineer, Open Source | model-judgment | the queue |
| company row | row 12614: HUGGING FACE INC (BROOKLYN, NY) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'huggingface': a name match, not confirmed by a person |
| H-1B record | none in the file for row 12614: unknown, not "no" | record | the sponsorship file (no H-1B fields on this row) |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.8 (illustrative: open-source contributions to model tooling) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 6+ months of hands-on ML engineering experience | duration: 6+ months | hands-on ML engineering experience | duration met only if co-op acceptance is resolved (6 months short without it) |
| required | Contributions to open-source projects | no | — | not checked: read it yourself |
| preferred | Experience with model serving | no | — | not checked: read it yourself |

### Meta — AI Research Engineer, University Grad

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Meta — AI Research Engineer, University Grad | model-judgment | the queue |
| company row | row 16612: META CO (PORTOLA VALLEY, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'meta': a name match, not confirmed by a person |
| H-1B record | none in the file for row 16612: unknown, not "no" | record | the sponsorship file (no H-1B fields on this row) |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.5 (illustrative: research-leaning role; MS rather than PhD) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | MS or PhD in Computer Science or a related field | no | — | not checked: read it yourself |
| required | Publications or research code in machine learning | no | — | not checked: read it yourself |
| preferred | Experience with distributed training | no | — | not checked: read it yourself |

### Celestial AI — Machine Learning Engineer

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Celestial AI — Machine Learning Engineer | model-judgment | the queue |
| company row | row 5181: CELESTIAL AI INC (Santa Clara, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'celestialai': a name match, not confirmed by a person |
| H-1B approvals / denials | 56 / 0 | record | Total Approvals, Total Denials |
| sponsored titles | RTL Design Engineer; Machine Learning Engineer; Machine Learning Engineer; Photonics Engineer | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | Machine Learning Engineer; Machine Learning Engineer | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Proven -> 0.9 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | expired | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.65 (illustrative: general ML match) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 2+ years of experience in machine learning | duration: 2+ years | in machine learning | duration short by 16 months, counting every documented month |

### AppLovin — Machine Learning Engineer, New Grad

| Value | What it says | Label | From |
|---|---|---|---|
| posting | AppLovin — Machine Learning Engineer, New Grad | model-judgment | the queue |
| company row | row 1955: APPLOVIN CORP (PALO ALTO, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'applovin': a name match, not confirmed by a person |
| H-1B approvals / denials | 130 / 2 | record | Total Approvals, Total Denials |
| sponsored titles | Software Engineer II; Machine Learning Engineer; Technical Support Specialist II; Product Manager, Lion Studios; Senior Designer, Motion Graphics | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | Machine Learning Engineer | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Proven -> 0.9 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | uncertain | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.7 (illustrative: general ML match) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | Python and C++ | no | — | not checked: read it yourself |
| required | Coursework in machine learning | no | — | not checked: read it yourself |

### Databricks — AI Engineer, New Grad

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Databricks — AI Engineer, New Grad | model-judgment | the queue |
| company row | row 7248: DATABRICKS INC (SAN FRANCISCO, CA) | record | the sponsorship file |
| identity | exact name match, not confirmed by a person | computed | exact normalized name 'databricks': a name match, not confirmed by a person |
| H-1B approvals / denials | 1640 / 8 | record | Total Approvals, Total Denials |
| sponsored titles | Software Engineer; Senior Software Engineer; Solutions Architect; Specialist Solutions Architect; Senior Solutions Engineer | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | none | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Likely -> 0.6 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| fit | 0.7 (illustrative: LLM-platform work matches) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | Experience building LLM applications | no | — | not checked: read it yourself |
| required | Python | no | — | not checked: read it yourself |
| preferred | Experience with Spark | no | — | not checked: read it yourself |

### Kensho — Machine Learning Engineer

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Kensho — Machine Learning Engineer | model-judgment | the queue |
| company row | row 14287: KENSHO TECHNOLOGIES INC (Cambridge, MA) | record | the sponsorship file |
| identity | row picked in the queue, not confirmed by a person | model-judgment | row chosen in the queue (csv_row), not confirmed by a person |
| H-1B approvals / denials | 40 / 0 | record | Total Approvals, Total Denials |
| sponsored titles | Machine Learning Engineer | record | top_job_titles_sponsored |
| ML/AI titles counted as evidence | Machine Learning Engineer | your-input | the title rules (exact titles shown; never proof of qualifying) |
| ML/AI titles needing context | none | your-input | the title rules |
| sponsorship tier and p | Proven -> 0.9 (a declared screening assumption, not a probability) | your-input | the title rules' tier mapping |
| posting liveness | active (an apply control was detected; nothing more) | model-judgment | scripts/ats/liveness-core.mjs classifyLiveness |
| timeline factor | 0.5 (illustrative: the posting wants a start before the persona's work authorization begins; only a delayed start works) | model-judgment | declared in the queue |
| fit | 0.7 (illustrative: general ML match) | model-judgment | declared in the queue |
| scorer | Consider (composite 0.263) | computed | scripts/score/role-scorer.mjs |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 2+ years of professional software or ML experience (a firm requirement) | duration: 2+ years | professional software or ML experience (a firm requirement) | duration short by 16 months, counting every documented month; the line says the minimum is firm |
| required | Python | no | — | not checked: read it yourself |
| preferred | Experience with transformers | no | — | not checked: read it yourself |

### Peloton Interactive — Machine Learning Engineer

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Peloton Interactive — Machine Learning Engineer | model-judgment | the queue |
| timeline factor | 0.85 (illustrative: a start inside the persona's OPT window (the Chapter 11 example value)) | model-judgment | declared in the queue |
| fit | 0.6 (illustrative: general ML match) | model-judgment | declared in the queue |

Requirements, from the posting's own text (model-judgment; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | Python and SQL | no | — | not checked: read it yourself |

## What this run cannot verify

- Whether this employer will sponsor this person for this role now. A history of sponsorship is not a policy, and policies, budgets and teams change.
- When a title was sponsored. The sponsorship file has no filing years, so a matching title may be old.
- Whether a sponsored title without a seniority word was an early-career hire. No marker is not proof.
- Titles beyond the file's short 'top titles' list, and companies the file does not cover (it carries H-1B fields for about 5% of its rows and covers six states).
- Whether the company in the file is the employer on the posting. The join behind the file has no published error rate.
- Most of a posting's requirements. This version checks only minimum-experience lines; skills, tools, degree and every other line are listed for the person to read, not checked.
- Whether the counted months are the kind of experience a line asks for ('in ML infra', 'using Python with ML frameworks'). The mode adds up the duration of every documented job; the kind is shown for a person to judge, never checked.
- What the sponsorship numbers mean. 0.9 and 0.6 are declared screening assumptions, not chances of sponsorship, and approvals are company-wide, not ML-engineering approvals.
- Employment type and hours. A job whose title doesn't say co-op, internship or similar is counted as employment of unstated type, never assumed full-time; assistantships, contract and fellowship work need supporting information before they count.
- Whether co-op or internship time counts toward a stated minimum, or whether a 'required' line is enforced. Postings rarely say, so that becomes the question to ask; a posting can also soften its own requirements elsewhere in its text.
- Whether the résumé file is complete. The mode counts only the experience the file lists, and cannot see a job listed anywhere else, such as a CV.
- Anything about timeline or fit. Those numbers are declared by a person (or proposed by Claude Code), not measured.
- Legal eligibility (OPT, STEM OPT, cap-gap). That is a question for the school's DSO or an attorney.
- The postings themselves: in sample mode they are illustrative fixtures.

## Run record

- Recipe: `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md` v0.1.2 · run `2026-09-30-sample-b4455f55` · status complete
- Queue: `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/sample-queue.json` (sha256 `b4455f556987…`), chosen by claude-code
- Rules: `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` v0.2.0, declared by student (values they produce are labelled your-input)
- Sponsorship file: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` · 30369 rows
- Scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.1.2/roles.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.1.2`
- Agent log: `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.1.2/run-log.json`
