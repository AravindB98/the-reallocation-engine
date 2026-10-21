# In-Class Presentation: case-aiml-cognitive-floor (five minutes)

## Executive summary

This is a five-minute show-and-tell script for the AI/ML cognitive-floor mode.
It covers who the mode is for, what that person cannot see, a live run, one
thing learned from running it, and one limit the mode cannot get past. The
line for what was personally learned is the presenter's own. No
slides are needed. The script shows the mode file and a terminal.

## In-Class Presentation

Timing totals 5:00. Each block lists what to show and the points to say.

### The domain or situation you designed for (0:00 to 0:45)

Show: `recipes/case-aiml-cognitive-floor.md`, section "Purpose".

Say:
- The user is an F-1 master's student finishing in December 2026 who needs an AI/ML or data job starting January 2027 on OPT.
- The employers have H-1B history and post on Greenhouse.
- The question is which postings deserve effort: still open, start date workable, and an occupation with high reasoning-and-judgment demand.

### The information asymmetry the mode addresses (0:45 to 1:45)

Show: `assignments/submissions/deepakkts/JUSTIFICATION.md`, "Identifies a specific information asymmetry".

Say:
- A posting shows a title. It never shows the SOC occupation code the employer will file under.
- The same "Machine Learning Engineer" title can be filed as Software Developers (score 3.834) or Computer and Information Research Scientists (score 4.516).
- The federal table has gaps the student cannot see: 122 of 1016 occupations have no score, including Data Scientists.

### Shows a real run (1:45 to 3:15)

Show, in a terminal at the repository root:

```
node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir /tmp/cogfloor-demo
```

(The demo writes to `/tmp` so the committed run outputs stay unchanged.)

Say:
- It checks 12 real postings at 7 employers.
- Liveness is a gate. One Airbnb posting returns HTTP 404 and is skipped whatever its score.
- 7 postings clear the floor. The cutoff is 3.749, the 75th percentile of scored occupations.
- 4 data-scientist postings are held. The mode refuses to score an occupation with no data.

Then show:

```
node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs
```

Say:
- The break attempt: one mutant reads a blank as zero and silently skips every data-scientist job. A second borrows the Business Intelligence Analysts score of 3.903 and silently passes them.
- The harness catches both. The harness also disables the network before it runs.

Fallback if the network is down: show `assignments/submissions/deepakkts/run/report.md`, the committed output of the 2026-10-21 run.

### One concrete thing you learned from running (or failing to run) it (3:15 to 4:15)

Presenter's own line:

One concrete thing I learned is that missing sponsorship evidence must remain missing evidence, not be treated as zero or as proof that an employer does not sponsor.

### One honest limitation: something it cannot verify (4:15 to 5:00)

Say:
- The mode cannot verify which SOC code an employer will file. The posting does not say, so every SOC list is a judgment, and the floor result inherits that judgment.
- For data scientists the mode cannot say anything at all, because the occupation is unrated in this data.
