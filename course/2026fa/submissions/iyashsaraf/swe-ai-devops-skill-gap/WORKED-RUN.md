# Worked Run — swe-ai-devops-skill-gap

## Executive summary

This is the record of a real run of the mode: job postings fetched on 2026-10-19 from companies
that have sponsored H-1B visas, compared on 2026-10-21 for the course's fictional student persona,
Aarav Patel. Read it to see exactly what was run, what came out, which numbers were checked by hand,
which postings were checked as still open, and how the mode behaves when it's pushed to break. The
run compared 573 US postings in three role families, after dropping 28 repeated postings. Aarav's
skills cover software engineering best (42%), then DevOps (34%), then AI engineering (24%). But the
DevOps number rises to 51% if skills that mostly come from one company are set aside, so the
"closest family" answer depends on two companies. Skills asked for in all three families:
distributed systems, observability/monitoring, and Python. His visa deadline is 150 days away, so
the learning list applies.

## Inputs used

| Input | Value | Label |
|---|---|---|
| Sponsor data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | record |
| Companies fetched | top 40 of the 600 kept sponsors, by H-1B approvals (`run/sponsors.txt`) | record, ranked by script |
| Postings | Greenhouse and Lever public board APIs, fetched 2026-10-19 15:39 EDT, saved only in `private/real-postings/skill-gap/postings-2026-10-19.json` | record |
| Skill list | `taxonomy/swe-ai-devops-skills.json` v0.1.1 (68 skills) | your-input |
| Student's evidence | `profile/aarav-patel.json`: 14 skills from the skills section of `search/examples/aarav-patel/resume.example.json`, minus what it marks "familiar with, not shipped" (Rust, Terraform) | your-input, **fictional persona** |
| Visa dates | from `search/examples/aarav-patel/profile.yml`: EAD start 2026-07-01, OPT end 2029-06-30, 0 unemployment days used, ceiling 150 (STEM OPT); `--learn-days 90` | your-input, **fictional persona** |
| Unemployment limit | 90 days on post-completion OPT, 150 with the STEM extension, 8 CFR 214.2(f)(10)(ii)(E) | record |

No real person's profile or visa dates are in this submission (DATA_CONTRACT §Zero-Conditions). I
also ran the mode on my own profile and dates; that version stays in `private/`.

All paths under `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/` unless they start
with `data/`, `search/` or `private/`.

## Commands run, with real output

### 1. The fetch (2026-10-19, 15:39 EDT)

`run.sh` fetches only when that day's file is absent. These are the fetcher's own lines from that
run (`python3` there was `/opt/anaconda3/bin/python3`; the 62 `WARNING … 404` retry lines are left
out, one per board that does not exist):

```
$ PYTHON=/opt/anaconda3/bin/python3 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
[greenhouse] DATABRICKS INC: found 899 jobs
[greenhouse] PINTEREST INC: found 156 jobs
[greenhouse] STRIPE INC: found 725 jobs
[greenhouse] AIRBNB INC: found 178 jobs
[greenhouse] ROBLOX CORP: found 261 jobs
[greenhouse] PURE STORAGE INC: found 374 jobs
[greenhouse] TWILIO INC: found 134 jobs
[greenhouse] ZSCALER INC: found 365 jobs
[greenhouse] ROKU INC: found 96 jobs
[greenhouse] MONGODB INC: found 396 jobs
[greenhouse] DROPBOX INC: found 18 jobs
[greenhouse] REDDIT INC: found 148 jobs
[greenhouse] ASANA INC: found 108 jobs
[greenhouse] DATADOG INC: found 429 jobs
[greenhouse] FLEXPORT INC: found 210 jobs
[lever] LINKEDIN CORP: found 10 jobs
[lever] ZOOX INC: found 238 jobs
[lever] DOCUSIGN INC: found 0 jobs
4745 real postings combined from 18/80 companies found
  4713 have description_text, 32 do not (schema gate will reject those)
  wrote ../../private/real-postings/skill-gap/postings-2026-10-19.json
  not found: ['INTEL CORP', 'MICROSOFT CORP', 'LINKEDIN CORP', 'UBER TECHNOLOGIES INC', 'DELOITTE TAX LLP', 'SNOWFLAKE INC', 'HUMAN INC', 'ZOOX INC', 'JUNIPER NETWORKS INC', 'NUTANIX INC', 'DOCUSIGN INC', 'ROBINHOOD MARKETS INC', 'BANK OF NEW YORK MELLON CORP', 'ARISTA NETWORKS INC', 'CONFLUENT INC', 'CHIME FINANCIAL INC', 'TELADOC HEALTH INC', 'MAPLEBEAR INC', 'RUBIK INC', 'PALANTIR TECHNOLOGIES INC', 'COHESITY INC', 'REMITLY INC', 'VISICON TECHNOLOGIES INC', 'COGNIZER INC', 'UPSTART NETWORK INC', 'INTEL CORP', 'MICROSOFT CORP', 'UBER TECHNOLOGIES INC', 'DELOITTE TAX LLP', 'SNOWFLAKE INC', 'DATABRICKS INC', 'HUMAN INC', 'PINTEREST INC', 'STRIPE INC', 'JUNIPER NETWORKS INC', 'NUTANIX INC', 'AIRBNB INC', 'ROBLOX CORP', 'ROBINHOOD MARKETS INC', 'PURE STORAGE INC', 'TWILIO INC', 'ZSCALER INC', 'BANK OF NEW YORK MELLON CORP', 'ARISTA NETWORKS INC', 'ROKU INC', 'CONFLUENT INC', 'CHIME FINANCIAL INC', 'TELADOC HEALTH INC', 'MAPLEBEAR INC', 'RUBIK INC', 'MONGODB INC', 'PALANTIR TECHNOLOGIES INC', 'DROPBOX INC', 'COHESITY INC', 'REDDIT INC', 'ASANA INC', 'REMITLY INC', 'DATADOG INC', 'VISICON TECHNOLOGIES INC', 'COGNIZER INC', 'UPSTART NETWORK INC', 'FLEXPORT INC']
```

18 of the 80 lookups (40 companies × 2 job-board systems) found a board, and DocuSign's had 0
jobs, so 17 companies supplied postings. The other 22 of the 40 sponsors, including Microsoft,
Intel, Uber and Snowflake, are not on Greenhouse or Lever under the name tried.

### 2. The final run (2026-10-21, on the same fetch, with the persona's defaults)

```
$ SKILL_GAP_DATE=2026-10-19 PYTHON=/opt/anaconda3/bin/python3 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
rows_read=30369
no_approvals=28817
no_target_title=952
kept=600
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/sponsors.json and sponsors.txt (top 40 by approvals)
reusing private/real-postings/skill-gap/postings-2026-10-19.json (already fetched for 2026-10-19; no network call)
ingested=4745
no_description=32
not_us=2407
no_family_match=1705
duplicate=28
family swe: 414 postings (83 non-senior) from 15 companies
family ai: 129 postings (24 non-senior) from 12 companies
family devops: 30 postings (5 non-senior) from 10 companies
✓ skill-demand-monitor: 414 ingested → 414 valid → 414 candidates → status: ranked
  58 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/swe/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/swe/skill-demand.md
✓ skill-demand-monitor: 129 ingested → 129 valid → 129 candidates → status: ranked
  52 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/ai/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/ai/skill-demand.md
✓ skill-demand-monitor: 30 ingested → 30 valid → 30 candidates → status: ranked
  36 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/devops/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/devops/skill-demand.md
status=compared
timeline gate: open (150 days left; deadline 2027-03-20, binding: unemployment_limit)
family swe: ranked, 414 postings
family ai: ranked, 129 postings
family devops: ranked, 30 postings
core skills: Distributed systems, Observability / monitoring, Python
evidence coverage of top 15 (swe): 42%
evidence coverage of top 15 (ai): 24%
evidence coverage of top 15 (devops): 34%
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/skill-gap.json and skill-gap.md
exit 0
```

### What it found (excerpt of `run/skill-gap.md`)

```
- Generated: 2026-10-21 · Postings fetched: 2026-10-19
- Visa timeline: job must start by 2027-03-20 (the 150 allowed unemployment days, 0 used, counted from EAD start 2026-07-01); OPT end 2029-06-30 (your-input). 150 days left, gate status `open`

| Family | Status | Postings compared | Of those, non-senior titles |
|---|---|---|---|
| Software engineer | `ranked` | 414 | 83 |
| AI engineer | `ranked` | 129 | 24 |
| DevOps / SRE / platform | `ranked` | 30 | 5 |

Skill shares below are over all levels. A skill asked of senior, staff or principal roles may not be asked of a new graduate.
```

| Skill | Software engineer | AI engineer | DevOps / SRE | In the profile? | Most from one company |
|---|---|---|---|---|---|
| Python | 29% | 40% | 63% | yes | — |
| Kubernetes | 23% | 12% | 63% | yes | — |
| Linux | 7% | 2% | 60% | **no** | — |
| AWS | 24% | 7% | 57% | yes | — |
| Observability / monitoring | 21% | 19% | 57% | **no** | — |
| Terraform | 5% | 5% | 43% | **no** | — |
| Distributed systems | 43% | 21% | 37% | **no** | DevOps: MongoDB 55% ⚠ |
| Ansible | 0% | 2% | 33% | **no** | DevOps: Zscaler 80% ⚠ |
| Prometheus | 2% | 1% | 20% | **no** | DevOps: Zscaler 83% ⚠ |
| Agentic / AI agents | 18% | 40% | 0% | **no** | — |

Docker is in 3 of the 30 DevOps postings (10%). Terraform shows as a 43% DevOps gap, which fits the
persona's résumé: it lists Terraform as "familiar with, not shipped".

## Verified vs. inferred — one line, split (Kubernetes in DevOps)

| Claim in the report | Status | How |
|---|---|---|
| 30 distinct US DevOps postings were on these boards on 2026-10-19 | **verified** (record) | board APIs; recount and duplicate check below |
| These 30 are DevOps roles | **inferred** (model-judgment) | my title rule in `families.py`; not hand-checked posting by posting |
| 19 of the 30 mention Kubernetes (63%) | **verified** | the monitor's count, and my own recount below (19 of 30) |
| The 19 come from 8 companies, Zscaler the largest at 32% | **verified** (script-output) | job ids per skill in `run/devops/skill-demand.json` |
| The student has Kubernetes evidence | **your-input** (fictional) | the persona's résumé lists Kubernetes under `devops_cicd`; for a real student this is their own claim |
| Kubernetes is required for these jobs | **inferred, partly checked** | 16 of 19 name it without "or similar" or "preferred" (hand-read below), but I didn't check whether each line sits under a "required" or a "preferred" heading |
| It is required for a job at his level | **not supported** | 25 of the 30 DevOps postings are senior, staff, principal or manager roles; only 5 are not |
| SWE is his closest family | **inferred** (model-judgment) | from the top-15 coverage rule; it flips to DevOps when one-company skills are set aside (below) |

## Verification

Hand checks, run from the repo root on 2026-10-21 (`python3` here is `/opt/anaconda3/bin/python3`;
private postings are read, only counts are printed):

```
$ python3 -c "import json,re; P=json.load(open('private/real-postings/skill-gap/family-devops.json'))['postings']; rx=re.compile(r'\bkubernetes\b|\bk8s\b',re.I); print(sum(1 for p in P if rx.search(p['title']+' '+p['description_text'])), 'of', len(P), 'DevOps postings mention Kubernetes')"
19 of 30 DevOps postings mention Kubernetes
exit=0
$ python3 -c "import json; c=json.load(open('scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/families-summary.json')); n=c['counts']; f=c['families']; x=n['no_description']+n['not_us']+n['no_family_match']+n['duplicate']; k=sum(v['postings'] for v in f.values()); print('excluded', x, '(incl.', n['duplicate'], 'duplicates) + kept', k, '=', x+k, '| ingested', n['ingested'])"
excluded 4172 (incl. 28 duplicates) + kept 573 = 4745 | ingested 4745
exit=0
$ python3 -c "import json; [print(f, len(P), 'postings,', len({(p['company_name'], p['description_text']) for p in P}), 'distinct descriptions') for f in ('swe','ai','devops') for P in [json.load(open('private/real-postings/skill-gap/family-'+f+'.json'))['postings']]]"
swe 414 postings, 414 distinct descriptions
ai 129 postings, 129 distinct descriptions
devops 30 postings, 30 distinct descriptions
exit=0
$ python3 -c "import json,re; P=json.load(open('private/real-postings/skill-gap/family-devops.json'))['postings']; rx=re.compile(r'\bkubernetes\b|\bk8s\b',re.I); soft=re.compile(r'or similar|or some other|or other|preferred|nice to have|bonus|a plus',re.I); H=[[s for s in re.split(r'(?<=[.!?])\s+|\n+',p['description_text']) if rx.search(s)] for p in P]; H=[h for h in H if h]; print(len(H), 'postings name Kubernetes in the description;', sum(1 for h in H if any(soft.search(s) for s in h)), 'of them say or-similar / preferred / bonus in a Kubernetes sentence')"
19 postings name Kubernetes in the description; 5 of them say or-similar / preferred / bonus in a Kubernetes sentence
exit=0
$ python3 -c "import json,re; P=json.load(open('private/real-postings/skill-gap/family-devops.json'))['postings']; rx=re.compile(r'\bmongo(db)?\b',re.I); H=[p['company_name'] for p in P if rx.search(p['title']+' '+p['description_text'])]; print(len(H), 'DevOps postings mention MongoDB;', H.count('MONGODB INC'), 'are from MONGODB INC')"
7 DevOps postings mention MongoDB; 7 are from MONGODB INC
exit=0
$ python3 -c "import json; F=json.load(open('scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/skill-gap.json'))['families']; cov=lambda L: round(100*sum(s['share'] for s in L[:15] if s['have_evidence'])/sum(s['share'] for s in L[:15])); [print(f, 'coverage of top 15:', cov(F[f]['skills']), '% as reported;', cov([s for s in F[f]['skills'] if not s['concentrated']]), '% without one-company skills') for f in ('swe','ai','devops')]"
swe coverage of top 15: 42 % as reported; 42 % without one-company skills
ai coverage of top 15: 24 % as reported; 23 % without one-company skills
devops coverage of top 15: 34 % as reported; 51 % without one-company skills
exit=0
```

What these show:

- **Kubernetes recount:** 19 of 30, the same as the monitor.
- **Nothing lost:** the 4,172 excluded postings (32 without a description, 2,407 outside the US,
  1,705 matching no family, 28 word-for-word duplicates) plus the 573 kept add up to the 4,745
  fetched.
- **No duplicates left:** every kept posting has a distinct description (414, 129 and 30). Before
  the fix, the counts included 28 repeats (SWE 438 → 414, AI 132 → 129, DevOps 31 → 30).
- **Wording:** the script flagged 5 of the 19 Kubernetes postings. Reading the 5 sentences myself,
  only 3 soften Kubernetes ("Experience with Kubernetes, or similar orchestration systems" twice at
  Roblox, "kubernetes clusters or some other container orchestration" at MongoDB). The other 2
  (Zscaler) say "Temporal or similar", which is about a different tool. So 16 of 19 state it plainly.
- **Self-mention:** all 7 DevOps mentions of MongoDB come from MongoDB itself.
- **One company decides the headline:** with skills set aside where one company supplies more than
  half the mentions, Aarav's DevOps coverage goes from 34% to 51%, above software engineering
  (42%). The skills set aside (Azure, GCP, Ansible, MongoDB, OpenTelemetry, Prometheus…) are
  mostly Zscaler's and MongoDB's.

### Reproduced from a clean copy (2026-10-21)

To check that the committed files run on their own, the 35 files of this submission were copied
into a fresh clone of the repo, with no `node_modules` and none of my `private/` data. There the one
command first fetched that day's postings (4,757 postings, 18 of 80 lookups found a board, 49
seconds), then ran again on that fetch with the final files:

```
$ PYTHON=/opt/anaconda3/bin/python3 SKILL_GAP_DATE=2026-10-21 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
rows_read=30369
no_approvals=28817
no_target_title=952
kept=600
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/sponsors.json and sponsors.txt (top 40 by approvals)
reusing private/real-postings/skill-gap/postings-2026-10-21.json (already fetched for 2026-10-21; no network call)
ingested=4757
no_description=32
not_us=2408
no_family_match=1710
duplicate=27
family swe: 416 postings (81 non-senior) from 15 companies
family ai: 131 postings (26 non-senior) from 12 companies
family devops: 33 postings (5 non-senior) from 10 companies
✓ skill-demand-monitor: 416 ingested → 416 valid → 416 candidates → status: ranked
  56 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/swe/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/swe/skill-demand.md
✓ skill-demand-monitor: 131 ingested → 131 valid → 131 candidates → status: ranked
  52 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/ai/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/ai/skill-demand.md
✓ skill-demand-monitor: 33 ingested → 33 valid → 33 candidates → status: ranked
  36 skills ranked; low_coverage=false
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/devops/skill-demand.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/devops/skill-demand.md
status=compared
timeline gate: open (150 days left; deadline 2027-03-20, binding: unemployment_limit)
family swe: ranked, 416 postings
family ai: ranked, 131 postings
family devops: ranked, 33 postings
core skills: Distributed systems, Observability / monitoring, Python
evidence coverage of top 15 (swe): 42%
evidence coverage of top 15 (ai): 24%
evidence coverage of top 15 (devops): 34%
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/skill-gap.json and skill-gap.md
exit 0
```

Two days later, the same three core skills come out and the persona's coverage is the same (42%,
24%, 34%), although every family's posting count moved slightly. The tests also pass in that copy.
The committed `run/` folder stays the 2026-10-19 run that every number in this write-up comes from.

## Liveness check on the postings a student could apply to (G4)

The 5 DevOps postings without a senior title are the ones a student without senior experience
could apply to. On 2026-10-21 I ran the repo's liveness checker on them
(`liveness/posting-urls.csv` lists them):

```
$ npm run ats:liveness -- https://stripe.com/jobs/search?gh_jid=7462961 https://job-boards.greenhouse.io/twilio/jobs/8026207 https://job-boards.greenhouse.io/zscaler/jobs/5158936007 https://www.mongodb.com/careers/job/?gh_jid=7821316 https://jobs.lever.co/zoox/89d5927e-db67-443b-9dd2-53d367c11f9b
Checking 5 URL(s)...

✅ active     https://stripe.com/jobs/search?gh_jid=7462961
✅ active     https://job-boards.greenhouse.io/twilio/jobs/8026207
✅ active     https://job-boards.greenhouse.io/zscaler/jobs/5158936007
⚠️ uncertain  https://www.mongodb.com/careers/job/?gh_jid=7821316
           content present but no visible apply control found
✅ active     https://jobs.lever.co/zoox/89d5927e-db67-443b-9dd2-53d367c11f9b

Results: 4 active  0 expired  1 uncertain
exit=1
```

The checker can't decide MongoDB's page: the content is there but it found no apply button.
Greenhouse's public API still lists that job (`liveness/greenhouse-api-check.txt`):

```
$ curl -s -o /tmp/mdb.json -w "HTTP %{http_code}\n" "https://boards-api.greenhouse.io/v1/boards/mongodb/jobs/7821316"
HTTP 200
$ python3 -c "import json; d=json.load(open('/tmp/mdb.json')); print(d.get('title'),'|',d.get('updated_at'),'|',d.get('absolute_url'),'|',(d.get('location') or {}).get('name'))"
Site Reliability Engineer 3 | 2026-10-19T00:38:22-04:00 | https://www.mongodb.com/careers/job/?gh_jid=7821316 | New York City
```

**My gate decision (G4), 2026-10-21:** I opened the MongoDB Site Reliability Engineer 3 posting
myself. There is an inbuilt apply page instead of an apply button, so the posting is live, and it
requires 3+ years of experience. Recorded in `liveness/gate-decisions.csv`. So it is live, but it
isn't entry-level, even though its title passed the non-senior rule.

That made me check the years of experience the other four "non-senior" postings ask for:

```
$ python3 -c "import json,re,sys; sys.path.insert(0,'scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap'); import families; P=[p for p in json.load(open('private/real-postings/skill-gap/family-devops.json'))['postings'] if not families.is_senior(p['title'])]; rx=re.compile(r'(\d+)\s*(?:\+|or more)?\s*(?:-\s*\d+\s*)?years?',re.I); [print(p['company_name'],'|',p['title'],'|',sorted({m.group(0).strip() for m in rx.finditer(p['description_text'])}) or 'no years stated') for p in P]"
STRIPE INC | Infrastructure Engineer, Privy | ['8+ years']
TWILIO INC | Software Engineer, Platform Engineering (L2) | ['2+ years']
ZSCALER INC | Production Engineer | ['1-3 years']
MONGODB INC | Site Reliability Engineer 3 | ['3+ years']
ZOOX INC | Release Engineer | no years stated
exit=0
```

Reading the matching sentences by hand: Stripe asks for "8+ years of experience in building highly
available production systems", MongoDB for 3+ years, Twilio for "1-2+ years" (the script printed
"2+ years" because its pattern cut off the "1-"), and Zscaler for "1-3 years". Zoox states no
number. So only 2 of the 30 DevOps postings (Twilio and Zscaler), perhaps 3 with Zoox, are open to a
new graduate, and the same 2 clearly fit Aarav's 2.5 years. A title rule alone overstates the
entry-level count.

## Deliberate break attempts

All run on 2026-10-21, on copies of `run/` in `/tmp`, so the real outputs stay as they are. (The
`npm run` lines ran with `--silent`, which hides npm's banner.)

**Break 1 — demand more postings than DevOps has** (`--min-sample 40`, DevOps has 30). Expected:
DevOps refuses to rank, and the comparison runs on the other two families without guessing.

```
$ npm run skill-demand -- private/real-postings/skill-gap/family-devops.json --taxonomy scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/taxonomy/swe-ai-devops-skills.json --profile scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json --min-sample 40 --out-dir /tmp/sg-break1/devops
✓ skill-demand-monitor: 30 ingested → 30 valid → 30 candidates → status: insufficient_sample
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/compare_families.py --run-dir /tmp/sg-break1 --private-dir private/real-postings/skill-gap --profile scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json --ead-start 2026-07-01 --unemployment-limit 150 --opt-end-date 2029-06-30
status=compared
timeline gate: open (150 days left; deadline 2027-03-20, binding: unemployment_limit)
family swe: ranked, 414 postings
family ai: ranked, 129 postings
family devops: insufficient_sample, 30 postings
core skills: Agentic / AI agents, Distributed systems, Java, Observability / monitoring, Python
evidence coverage of top 15 (swe): 42%
evidence coverage of top 15 (ai): 24%
wrote /tmp/sg-break1/skill-gap.json and skill-gap.md
exit=0
```

DevOps was left out, as expected. But the "core skills" list changed with it, from 3 skills to 5
(Agentic and Java joined), because "core" means "in every family *that was ranked*". That's a design
limitation, not a crash: a core list built from 2 families isn't the same claim as one built from 3.

**Break 2 — an OPT end date that has already passed.** Expected: stop, no comparison, exit 3.

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/compare_families.py --run-dir /tmp/sg-break2 --private-dir private/real-postings/skill-gap --profile scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json --ead-start 2026-07-01 --unemployment-limit 150 --opt-end-date 2026-01-01
status=stopped (the OPT end date has already passed, so the visa timeline gate is closed.)
timeline gate: closed (-293 days left; deadline 2026-01-01, binding: opt_end)
family swe: ranked, 414 postings
family ai: ranked, 129 postings
family devops: ranked, 30 postings
wrote /tmp/sg-break2/skill-gap.json and skill-gap.md
exit=3
```

I re-ran Break 2 myself in my own terminal on 2026-10-21 (the card's break-test command):

```
$ D=scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap
$ rm -rf /tmp/sg-break && cp -R $D/run /tmp/sg-break
$ python3 $D/compare_families.py --run-dir /tmp/sg-break --private-dir private/real-postings/skill-gap --profile $D/profile/aarav-patel.json --ead-start 2026-07-01 --unemployment-limit 150 --opt-end-date 2026-01-01; echo "exit=$?"
status=stopped (the OPT end date has already passed, so the visa timeline gate is closed.)
timeline gate: closed (-293 days left; deadline 2026-01-01, binding: opt_end)
family swe: ranked, 414 postings
family ai: ranked, 129 postings
family devops: ranked, 30 postings
wrote /tmp/sg-break/skill-gap.json and skill-gap.md
exit=3
```

**Break 3 — 100 of the 150 unemployment days already used** (a made-up case for the persona).
Expected: the deadline is 50 days from today, under the 90-day learning window, so gaps are listed
but marked as not learning priorities.

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/compare_families.py --run-dir /tmp/sg-break2b --private-dir private/real-postings/skill-gap --profile scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json --ead-start 2026-07-01 --unemployment-limit 150 --opt-end-date 2029-06-30 --unemployment-days-used 100
status=compared
timeline gate: apply_with_what_you_have (50 days left; deadline 2026-12-10, binding: unemployment_limit)
family swe: ranked, 414 postings
family ai: ranked, 129 postings
family devops: ranked, 30 postings
core skills: Distributed systems, Observability / monitoring, Python
evidence coverage of top 15 (swe): 42%
evidence coverage of top 15 (ai): 24%
evidence coverage of top 15 (devops): 34%
wrote /tmp/sg-break2b/skill-gap.json and skill-gap.md
exit=0
**Visa timeline gate:** 50 days left before the visa deadline is under the 90-day learning window, so the gaps below are **not** learning priorities now — apply with the skills you already have evidence for
```

**Break 4 — no visa date at all.** Expected: refuse, rather than assume a date.

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/compare_families.py --run-dir /tmp/sg-break4 --private-dir private/real-postings/skill-gap --profile scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/profile/aarav-patel.json
ERROR: give --ead-start or --opt-end-date; the visa timeline gate never guesses a date
exit=2
```

**Break 5 — the monitor's default taxonomy, without `--taxonomy`.** Expected: it reads the repo's
default AI taxonomy. It didn't (my home folder path is trimmed from the error):

```
$ npm run skill-demand -- private/real-postings/skill-gap/family-devops.json --out-dir /tmp/sg-break3
Error: ENOENT: no such file or directory, open 'Prompt%20Engineering%20Course/the-reallocation-engine-fork/scripts/score/taxonomy/ai-engineering-skills.json'
exit=1
```

This is a bug in the repo's monitor, not in this mode: it keeps `%20` in a folder name with spaces.
It's a typed TODO in the recipe. The mode always passes `--taxonomy`, which is why the real run
works.

## My predictions vs. results

Recorded 2026-10-19 in my own words, before the mode's first run. Earlier that day I had seen the
software-engineering top five from a feasibility test (distributed systems, Python, AWS, Kubernetes,
AI agents) and the list of skills in my own repos. I hadn't seen any DevOps or AI skill counts or
any coverage number.

| Question | My prediction | Result |
|---|---|---|
| Which family will my current skills cover best? | "Mostly Devops and SWE" | Right, on my own profile (kept in `private/`). For the fictional Aarav, the answer is SWE 42%, DevOps 34%, AI 24% |
| Which skill will top the DevOps list? | "I think it will be terraform, CI/CD, Docker" | Mostly wrong: Kubernetes and Python (63%), Linux (60%); Terraform 43%, CI/CD 37%, Docker 10% |
| How much does one big company skew the counts? | "I am not sure about that" | In SWE, the top six skills each come from 12–14 companies (C++ is the exception: 49% of its mentions are from Roblox). In DevOps, two companies supply 17 of the 30 postings, and setting their skills aside changes the closest family |

When the first report showed observability as a gap, and before we checked which tools the
postings name, I said (typos fixed): "I did set up but maybe according to the JDs maybe they are
asking for different observability and monitoring like prometheus and grafana." The check:

```
$ python3 -c "import json,re; A=[p for f in ('swe','ai','devops') for p in json.load(open('private/real-postings/skill-gap/family-'+f+'.json'))['postings']]; T=lambda p: p['title']+' '+p['description_text']; O=[p for p in json.load(open('private/real-postings/skill-gap/family-devops.json'))['postings'] if re.search(r'\bobservability\b|\bmonitoring and alerting\b',T(p),re.I)]; n=lambda rx,L: sum(1 for p in L if re.search(rx,T(p),re.I)); print(n('cloudwatch',A),'of',len(A),'postings name CloudWatch; of',len(O),'DevOps postings that mention observability:',n(r'opentelemetry',O),'OpenTelemetry,',n('prometheus',O),'Prometheus,',n('grafana',O),'Grafana')"
0 of 573 postings name CloudWatch; of 17 DevOps postings that mention observability: 5 OpenTelemetry, 4 Prometheus, 4 Grafana
exit=0
```

None of the 573 postings names CloudWatch, so experience with a cloud provider's own monitoring
doesn't show up as observability. The DevOps postings name OpenTelemetry, Prometheus and Grafana.

## Reflection

Written by me, 2026-10-21.

**What worked.** The most useful thing I learned was that most DevOps jobs are not for new grads.
25 out of 30 were senior, and only 2 or 3 fit someone like me. Even MongoDB's "SRE 3" job wants 3+
years, so I will focus on SWE and AI jobs first.

**What the mode got wrong or missed.** The biggest problem was that the scraper missed almost all
the job descriptions. Only 4% of jobs had text, so my first results were not trustworthy until we
fixed it. Also, MongoDB made my score look better than it really is, because all 7 MongoDB
mentions came from MongoDB's own job posts.

**One concrete next improvement.** I would make the mode skip jobs that are too senior for a new
grad. I would also stop counting a company's own product in the skills list, so my score is more
honest.

*Note added when the tracked run switched to the fictional persona: "my score" above is the
coverage on my own profile, kept in `private/`. For Aarav the same problem shows up the other way:
one company's skills pull his DevOps coverage down (34%, or 51% without them).*

## Attestation

- Recipe: swe-ai-devops-skill-gap v0.2.0 (taxonomy v0.1.1), run for the fictional persona Aarav Patel
- By: Yash Saraf · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `run.sh` on the 2026-10-19 postings | 4,745 fetched → 573 kept (28 duplicates dropped); SWE 414, AI 129, DevOps 30 ranked; deadline 2027-03-20 (150-day limit), 150 days, `open`; `status=compared`, exit 0 | each family ranked, a comparison written |
| Kubernetes recount by hand (DevOps) | 19 of 30 | the monitor's 19 of 30 |
| Exclusion arithmetic | 4,172 + 573 = 4,745 | equal to the fetched count |
| Duplicate check | 414 / 129 / 30 distinct descriptions | no repeats left |
| Read the 5 flagged Kubernetes sentences | 3 soften Kubernetes; 2 soften a different tool | a hand-read check of the script's flag |
| Coverage with one-company skills set aside | DevOps 34% → 51%; SWE 42% → 42%; AI 24% → 23% | to see whether one company drives the headline (it does, for DevOps) |
| Liveness checker on 5 non-senior DevOps postings | 4 active, 1 uncertain (MongoDB), exit 1 | each posting active, expired or uncertain |
| Opened the uncertain MongoDB page myself | live (an inbuilt apply page, no button); asks for 3+ years | a human decision for the checker's `uncertain` |
| Years of experience in the 5 non-senior postings | 8+, 1–2+, 1–3, 3+, none stated; the script misread "1-2+" as "2+" | the title rule's "non-senior" really entry-level |
| **Break:** `--min-sample 40` on DevOps | DevOps `insufficient_sample`, comparison on 2 families, core list grows to 5 | DevOps left out, no guessed ranking |
| **Break:** `--opt-end-date 2026-01-01` | `status=stopped`, -293 days, exit 3, no comparison | a stop, not a report |
| **Break, run by me in my own terminal:** the card's break-test command | the same: `status=stopped`, -293 days, `exit=3` | a stop, not a report |
| **Break:** 100 of 150 unemployment days used | 50 days left, `apply_with_what_you_have`, gaps marked not learning priorities | the short-timeline warning |
| **Break:** no visa date | exit 2, "never guesses a date" | a refusal |
| **Break:** monitor without `--taxonomy` | `ENOENT` on a `%20` path, exit 1 | the default taxonomy loads |
| `run.sh` in a fresh clone with only this submission's files | 4,757 fetched → 580 kept; same 3 core skills; coverage 42% / 24% / 34%; exit 0 | it runs without my private data, and the result holds a second day |
| Offline tests (`test_skill_gap.py`), also in the fresh clone | 20 OK with `requests`; 17 OK, 3 skipped without | all pass |

### Did not test

- Liveness of the 568 postings I didn't check, or of any posting after 2026-10-21.
- Sponsors without a Greenhouse or Lever board (22 of the 40), for example on Workday.
- Whether each Kubernetes line sits under a "required" or a "preferred" heading.
- The US-location rule on the 2,407 excluded postings, and the family and seniority rules posting by
  posting. None of them was hand-audited.
- Near-duplicate postings (only word-for-word repeats are dropped).
- Whether any employer is E-Verify enrolled (required for STEM OPT).
- The fetch step with the system `python3`, which lacks `requests`. I ran it with Anaconda's.

### Broke during testing, fixed

- **Greenhouse postings had no text.** 4,851 of 5,066 postings had no description, including all
  4,818 from Greenhouse. Fixed in `scripts/ats/scrapers/greenhouse/scraper.py` (the declared
  patch): after it, 33 of 5,062 had none, all from Lever.
- **The closed-timeline report crashed** with a `KeyError` (exit 1 instead of 3). Caught by
  `test_visa_timeline_closed_stops`; fixed in `compare_families.py` (`render_md`).
- **The skill list missed OpenTelemetry**, the most-named monitoring tool in DevOps postings. Added
  in taxonomy v0.1.1; DevOps skills ranked went from 35 to 36.
- **Repeated postings were counted more than once.** 28 postings repeated another word for word
  (the same job listed for another city or level). `split_families.py` now drops them.
- **The visa gate ran on a placeholder date** (2027-03-15). It now counts down to the earlier of the
  OPT end date and the day the allowed unemployment days (90, or 150 on STEM OPT) run out.
- **Real personal data in the tracked files.** The first version of today's run used my own visa
  dates and a profile of my own repos. DATA_CONTRACT treats real immigration details and real
  profiles as PII, so I replaced both with the fictional persona Aarav Patel and re-cut the branch
  before opening any PR. My own version stays in `private/`.
- **The report hid seniority and one-company gaps.** It now shows the non-senior count per family
  and marks ⚠ in the gap list. But the title rule behind the non-senior count is too generous: 2 of
  its 5 "non-senior" DevOps postings ask for 3+ and 8+ years. Not fixed; it's part of the seniority
  TODO in the recipe.
- **My own hand check missed the new duplicate count**: it first added up to 4,717 instead of
  4,745. Fixed by including duplicates in the sum.
- **Patch tests failed without `requests`.** They are now skipped with a message.
- **The CI's PII scan of the branch flagged the tests.** `node scripts/pii-scan.mjs --diff` read the
  test file's skip decorator line (an at-sign followed by `unittest.skipUnless`) as an email
  address and exited 1. The skip now
  happens inside `setUp()`, and the scan reports `pii-scan: clean ✓`.
