## Executive summary

This page explains who this tool is for and why that person needs it. The user is an international master's student in data science who must find a job that will sponsor a work visa, mostly through job-listing sites. Three things are invisible to her: whether a listed job still exists, whether a link that looks live really points at that job, and whether a company that sponsors in general will sponsor this role. The tool exists to make the first two visible and to flag the third, because each wasted application uses time she has very little of.

## Who

The user is an F-1 master's student in data science graduating in December 2026, with an OPT work authorization card expected in January 2027. She is targeting entry-level Data Scientist roles (SOC 15-2051) and will need H-1B sponsorship after OPT. Like most new graduates, she finds most postings on aggregators such as Built In, LinkedIn and Indeed rather than on each employer's own hiring site. The worked runs use a fictional persona, Sasha Jones, with these same circumstances.

## The asymmetry

The employer knows whether a job is open, whether a link still points at it, and whether this particular role will sponsor a visa. She sees none of that. An aggregator page can keep an Apply button up long after the employer removes the job. An employer link can quietly redirect a closed job to the company's list of all jobs, which also looks open. And a public sponsorship record is a company-wide count: a company with hundreds of approvals can still post a role that says it will not sponsor. Every application to a dead or non-sponsoring posting costs research and tailoring time. Once OPT starts, it also runs against the 90-day unemployment limit, which is what makes that time scarce.

## Layers used

The mode combines three layers of the repository. **Job-Ops** supplies the posting liveness checker (`ats:liveness`) and the idea of preferring the employer's own hiring system over an aggregator. **80 Days to Stay** supplies the company-level sponsorship record (approvals, denials, rate, top sponsored titles). **Cognitive Pivot** supplies the Chapter 11 role scorer, which combines sponsorship, fit, liveness and timeline. Its role-quality term (BLS/O*NET) carries weight 0, so the wage and ability data do not change any decision, and this mode does not read them.

## Failure mode 1: stale postings that look live

The first failure is a posting that looks open but is not. In the October runs, an aggregator copy still showed "active" sixteen months after the employer removed the job. Separately, an employer link redirected to the company's all-jobs page and was scored Apply. This is hardest to catch for a new graduate applying at volume, who opens each page once, sees an Apply button, and moves on. The checker sees the same Apply button. And a posting that is genuinely live can still be the wrong level: once the tool read employers' own job records correctly, two senior roles came out as recommendations, so the third version adds a title-based level gate that sets senior, staff and similar roles aside before scoring.

## Failure mode 2: company-level sponsorship hiding a role-level "no"

The second failure is a sponsorship record that answers the wrong question. A company with a large approval count rates as a proven sponsor, but a specific posting can still state that it does not sponsor visas. In the October run, a third-party copy of one Instacart posting said exactly that, while the company's record showed 498 approvals. This is hardest to catch for someone who reads a large approval count as a yes and does not read the posting's fine print.
