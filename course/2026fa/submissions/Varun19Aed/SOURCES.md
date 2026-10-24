# Sources and Assistance

## Repository sources

This contribution was developed using files and tools already present in The Reallocation Engine repository.

### Governing and assignment documentation

- `SNICKERDOODLE.md`
- `DOMAIN.md`
- `CONTRIBUTING.md`
- `DATA_CONTRACT.md`
- `recipes/README.md`

These files were used to understand lifecycle status, provenance requirements, repository structure, contribution rules, and evidence boundaries.

### Historical sponsorship data

The prototype reads:

`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`

Fields used by the prototype include:

- `company_name`
- `Total Approvals`
- `Total Denials`
- `Approval_Rate`
- `median_salary_offered`
- `top_job_titles_sponsored`

These values are treated as historical record evidence. They are not treated as guarantees of current sponsorship.

### Sponsorship-model documentation

`docs/chapter-research-map.md` was inspected to understand that the repository's intended sponsorship probability uses multiple components rather than H-1B approval rate alone.

`scripts/sec/validate-h1b-join-sample.py` was inspected while determining whether the local checkout contained enough underlying evidence to validate the complete sponsorship/entity-resolution pipeline.

The required raw evidence was not fully available locally, so this contribution does not reconstruct or invent the complete sponsorship probability.

### Existing scorer

- `scripts/score/role-scorer.mjs`
- `data/examples/ch11-roles.json`

The existing scorer was run against the repository's supplied sample roles. The contribution does not reimplement the scorer.

### ATS and liveness tools

The existing repository ATS tooling was used for the dry-run and job-posting liveness checks.

Relevant repository resources included:

- `recipes/scan.md`
- `scripts/ats/`
- `data/ats/portals.example.yml`

The example portals configuration was copied locally as instructed by the repository after the initial ATS scan reported that `portals.yml` was missing.

### Recipe-format reference

The following existing files were used as structural references:

- `recipes/local-wage-adjustment.md`
- `recipes/local-wage-adjustment.card.md`

They were used to understand the repository's recipe/card organization, including lifecycle metadata, phase gates, verification boundaries, stop conditions, and the separation between an agent recipe and a human-facing card.

## External/runtime tools

The following runtime tools were used while implementing and validating the contribution:

- Python 3
- Python standard-library `unittest`
- Node.js / npm
- Playwright Chromium

Playwright Chromium was installed after the existing liveness script reported that the browser executable was unavailable.

No external sponsorship dataset was downloaded for the contribution prototype.

## AI assistance

ChatGPT was used as a development and documentation assistant.

AI assistance included:

- helping interpret the assignment requirements;
- helping identify relevant repository files and commands to inspect;
- suggesting a narrow prototype scope;
- helping draft the Python prototype and offline tests;
- helping diagnose implementation and command-line errors;
- helping distinguish historical sponsorship evidence from unsupported current-sponsorship conclusions;
- helping draft and organize the recipe, human card, domain justification, worked run, test report, run log, and source documentation.

AI-generated suggestions were not treated as repository evidence.

## Student work and verification

I selected the career situation and contribution scope based on my job-search use case.

I executed the repository commands and prototype locally, inspected the outputs, tested failure cases, and made the final decisions about what evidence the contribution should and should not claim.

I also verified the behavior of:

- company-name normalization;
- historical sponsorship evidence retrieval;
- missing sponsorship evidence;
- company-not-found behavior;
- offline fixture tests;
- the existing role scorer;
- ATS dry-run behavior;
- real job-posting liveness.

Where repository data or local evidence was insufficient, I kept the result unknown rather than presenting an AI-generated assumption as a verified fact.
