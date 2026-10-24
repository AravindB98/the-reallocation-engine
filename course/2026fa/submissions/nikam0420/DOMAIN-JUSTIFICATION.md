## Executive summary

This mode helps an international graduate pursuing data analyst or business intelligence work distinguish company-level sponsorship fields from historical analyst-title evidence. Its real run found 61 matching company records, but every current application decision remains on hold because the necessary live evidence is missing.

# Domain justification

**Who and when.** A fictional early-career international master's graduate uses this mode before researching employers for SQL reporting and BI analyst roles. The sample is a general professional-domain scenario; it contains no real student's résumé, immigration timeline, contacts, or application history.

**Information asymmetry.** A large mapped company table makes sponsorship look like a company-wide yes/no fact. Applicants cannot readily see whether the stored job titles mention analyst work, whether the company identity was matched correctly, or whether a senior analytics title is being mistaken for an entry-level vacancy. This mode separates those questions instead of compressing them into a confidence score. It checks the local evidence before any model interpretation.

**Engine layers.** The implemented workflow uses 80 Days company/H-1B fields and the maintained join-audit script. It connects to Job-Ops by defining an exact-posting liveness gate, but did not run a live posting check. The visa timeline is another hard gate. The Cognitive Pivot is deliberately outside this version: title strings do not measure causal reasoning, verification work, or AI resilience, and no such score is claimed.

**Domain failure 1: company history mistaken for analyst sponsorship.** A company with software-engineer approvals can appear attractive to a dashboard/reporting applicant. Even a matching analyst title does not mean the displayed company-level approval count belongs to that title. This mistake is hardest for a first-time international analyst applicant who sees an authoritative-looking number but lacks access to the raw employer/SOC records. The report preserves raw counts, labels the title match narrowly, and leaves employer identity on hold.

**Domain failure 2: title match mistaken for suitable current work.** A senior BI engineering title or managerial analytics string can pass a broad filter while requiring years of engineering experience. A junior analyst under application pressure is least likely to catch this when a ranked score hides the original title. The report shows the actual matched strings and requires task/seniority review plus liveness before release. It treats non-matches and blank values as missing evidence, not proof of non-sponsorship.

**Why this design.** The useful outcome is a traceable historical research list and a refusal to overclaim. The next step is source identity validation and a human-reviewed live posting, not more polished application prose.
