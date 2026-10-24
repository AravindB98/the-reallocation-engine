# Change Brief — Frontend / Full-Stack Sponsorship Triage

## Career Situation

I am an international master's student preparing to graduate and searching for full-time frontend and full-stack software engineering roles in the United States. Because I will require employment sponsorship, I need to be selective about where I spend my job-search time.

A job posting may match my technical background, but before spending significant time researching the company, tailoring my resume, writing an application, or networking with employees, I want to know whether the available repository data contains evidence that the company has sponsored employees in the past.

The goal of this recipe is to help prioritize frontend and full-stack opportunities using verifiable sponsorship evidence and job-posting liveness. It is not intended to determine whether a company will sponsor me for a specific role. The final decision about whether to apply remains with the job seeker.

## Existing Data and Scripts

### Sponsorship Evidence

The prototype will use the existing repository dataset:

`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`

The dataset contains company-level fields including:

- `company_name`
- `Total Approvals`
- `Total Denials`
- `Approval_Rate`
- `median_salary_offered`
- `top_job_titles_sponsored`

The prototype will search this dataset for a target company and use the available sponsorship fields as record-based evidence of historical sponsorship activity.

A company having previous approvals does not prove that the company will sponsor a particular candidate or a current frontend/full-stack position. Missing sponsorship fields will also not be interpreted as evidence that a company does not sponsor. Missing values will remain unknown or insufficient evidence.

### Job-Posting Liveness

The recipe will reuse the repository's existing ATS/liveness tooling rather than implementing a separate job-liveness checker.

The existing repository exposes the command:

`npm run ats:liveness -- <job-url>`

The liveness result will be treated as a gate. A posting that cannot be verified as live should not receive the same application priority as a posting that has been verified as live.

### Existing Scorer

The prototype will reuse the existing Reallocation Engine scorer:

`scripts/score/role-scorer.mjs`

through the command:

`npm run score -- <roles.json> --out-dir <output-folder>`

The prototype will produce role evidence in the format expected by the existing scorer rather than implementing a new Apply / Consider / Skip scoring system.

## Proposed Additions

### Prototype

[TODO: DEV]

Create a prototype under:

`scripts/contrib/2026fa/Varun19Aed-frontend-triage/`

The prototype will accept a company name and a target role as inputs. It will search the existing student employment targets CSV for the company and extract available sponsorship evidence.

The prototype will distinguish between:

- sponsorship evidence found in the repository data,
- company found but sponsorship evidence missing,
- company not found in the repository data.

It will not treat missing data as evidence that a company does not sponsor.

The prototype will convert the available evidence into a `roles.json` file compatible with the existing Reallocation Engine scorer.

### Offline Test

[TODO: DEV]

Add at least one offline fixture-based test that does not require network access. The test will verify that the prototype correctly handles sponsorship evidence from known input data and does not convert missing evidence into a false sponsorship conclusion.

### Recipe and Documentation

[TODO: DEV]

Create a recipe and recipe card describing how an international student targeting frontend or full-stack software engineering positions can use sponsorship evidence and job-posting liveness to prioritize application effort.

The recipe will document what the workflow can verify, what it cannot verify, and where human judgment is required.

## Gates and Human Check

### Gates

The recipe will use job-posting liveness as a gate. If a job posting is determined to be inactive or unavailable, the opportunity should not continue through the normal application-prioritization workflow.

Missing sponsorship evidence will not automatically cause a company to be classified as a non-sponsor. If the company is not found in the dataset, or if its sponsorship fields are missing, the sponsorship status will be treated as unknown or insufficient evidence.

The prototype should fail clearly if the required input dataset cannot be found or read rather than generating a result from missing data.

### Human Check

The final decision to apply, skip, research further, or contact someone at the company remains with the job seeker.

Historical sponsorship evidence is only one signal. Before deciding whether to spend significant time on an application, the job seeker should review the current job description and, when necessary, verify current sponsorship requirements directly from the employer or recruiter.

The recipe must not interpret historical sponsorship approvals as a guarantee that the employer will sponsor the current role or candidate.

## Predicted Failure Cases

### Failure Case 1 — Company Name Mismatch

**Prediction:**  
A company may exist in the sponsorship dataset but fail to match the user's input because the company names are formatted differently.

For example, the dataset may contain a legal company name such as `A10 NETWORKS INC`, while the user may enter `A10 Networks`.

**How I will check it:**  
I will test the prototype using differently formatted versions of a company name that is known to exist in the dataset. I will record whether the first version of the prototype successfully matches the company or fails because of formatting differences.

### Failure Case 2 — Missing Sponsorship Evidence

**Prediction:**  
Some companies will exist in the dataset but have blank values for `Total Approvals`, `Total Denials`, `Approval_Rate`, or `top_job_titles_sponsored`.

The prototype must not interpret these missing fields as proof that the company does not sponsor employees.

**How I will check it:**  
I will test the prototype with at least one company that exists in the dataset but has missing sponsorship fields. The expected behavior is to return an unknown or insufficient-evidence state rather than classifying the company as a non-sponsor.

### Failure Case 3 — Company Not Present in Dataset

**Prediction:**  
A company entered by the user may not exist in the provided dataset.

The prototype should not create or infer sponsorship evidence for a company that cannot be matched to a repository record.

**How I will check it:**  
I will test the prototype with a deliberately nonexistent company name. The expected behavior is a clear company-not-found result rather than generated sponsorship information or a false non-sponsor classification.

## First-Pass Prediction

I predict that the first version of the prototype will have difficulty matching user-entered company names to the legal company names stored in the dataset.

For example, a user may enter `A10 Networks`, while the dataset contains `A10 NETWORKS INC`. My initial implementation may use simple normalization and may still fail for companies whose legal names differ significantly from their commonly used names.

I expect this prediction may be wrong because simple normalization may handle more company-name variations than I currently expect. I will keep this original prediction and compare it with the actual prototype behavior during testing.

If the first-pass matching approach is insufficient, a future improvement could introduce more robust company-name normalization or entity-resolution logic. Any such improvement will be documented as a revision rather than replacing this original prediction.

## Revision After Repository Inspection

After inspecting `docs/chapter-research-map.md` and the existing H-1B validation tooling, I found that the documented sponsorship probability is intended to combine LCA filing rate, H-1B approval rate, funding recency, and company size.

The locally available mapped CSV contains useful historical sponsorship evidence, including approvals, denials, approval rate, and sponsored job titles, but the repository does not contain all of the raw evidence required to fully validate the H-1B entity-resolution join or reproduce the complete sponsorship probability calculation.

Therefore, the first prototype will not invent a sponsorship probability from approval rate alone. It will focus on retrieving and labeling the sponsorship evidence that is actually present in the repository and will preserve missing or unverified evidence as unknown.

Integration with the existing role scorer will only use sponsorship probability values if they can be justified by an existing documented repository rule and available evidence. Otherwise, the prototype will expose the sponsorship evidence without claiming a complete sponsorship score.
