# Show-and-tell plan — five minutes, terminal and files only

## Executive summary

This is my speaking plan for the five-minute in-class show-and-tell. It covers the four things the rubric asks for, in order: who it's for, what they can't see, what I learned from running it, and one thing it can't verify. It includes a real run that needs no internet, one live check, and a backup if the room's network fails. The lines are prompts for me to say in my own words, not a script to read aloud. Every number comes from a committed run file.

---

## Before class

- [ ] `cd ~/Desktop/Projects/the-reallocation-engine-mode && git status` shows the PR branch, clean
- [ ] `npx playwright install chromium` (the live check needs a browser)
- [ ] Terminal font 18pt+, a light theme; editor tabs open: the recipe, `runs/pivot-2026-10-21-run7-final/pivot-report.md` (the occupations table), the card
- [ ] Rehearse once with a timer; if over, cut the live check first

## Timeline

| Clock | Section | Show | Say (my own words) |
|---|---|---|---|
| 0:00–0:40 | **Who it's for** | the recipe's executive summary | The repo's fictional persona Aarav Patel: F-1 on STEM OPT, new-grad backend in Boston (the repo requires a fictional persona, not my own details). Every backend posting has neighbours (data engineer, SRE, QA, full stack) and we're told to aim for work AI can't easily do. Which of these is that? |
| 0:40–1:50 | **The asymmetry** | demo command 1 (four spellings) | The government data for this is O*NET. **The same job lands in different occupations depending on spelling**: "Software Engineer, Backend" → Software Developers, 3.834, rated 2025; "Back End Software Engineer" → **Web Developers**, 3.584, rated **2017**. A new grad would never see that. I checked it myself on O*NET's own website: searching "Back End Software Engineer" lists Web Developers first. |
| 1:50–3:00 | **A real run** | demo command 2 (offline, about 1 s), then the occupations table | 95 real postings from 11 Boston boards. After my decisions: 75 standard, 2 out of target, 18 I opened by hand (all open). It prioritizes none, because the duties reading separates nothing and I decided it must not rank on it. I picked 6 to tailor for myself. Point at the table: the data-engineering occupations are **indistinguishable** from backend inside O*NET's own error bars, so "data engineering is safer" isn't supported. |
| 3:00–4:00 | **What I learned from running it** | run 1 vs run 3 counts; the duties line | (1) Run 1 said PRIORITIZE 67; reading its output showed three bugs (e.g. "Sr." broke title matching) and a crash that left a half-written log. All fixed test-first. (2) The idea I liked most failed: the rule reading each posting's duties called **62 of 62** readable postings "judgment-heavy". Every posting uses "design" and "scale", so it measured vocabulary, not work. |
| 4:00–4:45 | **One honest limitation** | the recipe, *What it cannot verify* | O*NET publishes each rating's error but not how the errors move together. If they move together, **no** occupation here is distinguishable from Software Developers, not even Research Scientists. So this mode can tell you when *not* to trust a gap. It can't promise any gap is real. It stays DRAFT: 3 typed TODOs. |
| 4:45–5:00 | **Close** | — | It checks the record first, labels every judgment, and stops at the report. I decide. |

## Demo commands

1. The spelling flip (offline, instant):

```bash
python3 -c "import sys,json; sys.path.insert(0,'scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range'); import lib_pivot as l; d='scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/'; c=json.load(open(d+'config.json')); i=l.load_title_index(d+'data/onet_titles.csv'); [print(f'{t:28s}', l.lookup_occupations(t,i,c)['in_scope']) for t in ['Software Engineer, Backend','Backend Software Engineer','Back End Software Engineer']]"
```

Expected: `['15-1252.00']`, `['15-1252.00']`, `['15-1254.00']`.

2. The mode on the saved postings, into a new folder (offline, about 1 s):

```bash
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles course/2026fa/submissions/ashwinthankachan26/mode-build/runs/fetch-2026-10-20/roles.json --today 2026-10-20 --liveness course/2026fa/submissions/ashwinthankachan26/mode-build/runs/liveness-2026-10-20.txt --liveness course/2026fa/submissions/ashwinthankachan26/mode-build/runs/liveness-2026-10-21-pinned.txt --out-dir /tmp/pivot-demo-$(date +%H%M%S)
```

Expected: `✓ assessed 95 postings → STANDARD 75 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18` (v0.1.5: no ranking on a duties reading that separates nothing)

3. The liveness gate, live (needs the network):

```bash
npm run ats:liveness -- https://job-boards.greenhouse.io/vestmark/jobs/8009953
```

Expected on 2026-10-20: `✅ active`. If it has closed by class, say so: that's the gate working.

4. A refusal, if there's time:

```bash
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles course/2026fa/submissions/ashwinthankachan26/mode-build/runs/fetch-2026-10-20/roles.json --today 2026-02-30 --out-dir /tmp/refuse-demo
```

Expected: `✗ --today: "2026-02-30" is not a real YYYY-MM-DD date`, exit 2, nothing written.

**Backup if anything fails:** open `runs/pivot-2026-10-21-run7-final/pivot-report.md` and show the executive summary, the Vestmark and SRE rows, and the occupations table. Same story, recorded output.

## Likely questions

| Question | Short answer |
|---|---|
| Isn't this your Recipe Design mode again? | No. That one checked sponsorship and seniority (PR #41). This one checks which occupation a title is and whether O*NET can tell the occupations apart: a different layer (Cognitive Pivot), different code, different data |
| Why DRAFT if it ran on real postings? | The constitution needs zero open TODOs before SPECIFIED. I have 7, two of them my own gate decisions. Claiming more would be claiming evidence I don't have |
| Did an AI decide anything? | No model runs inside the tool. Claude helped build it and drafted the docs; the drafted thresholds wait for my approval, and the gates are mine |
| Why not just pick the highest score? | Because most gaps are inside the error bars, and the ratings are from different years. The tool refuses to rank what it can't separate |
| What next? | Observed AI use by task from the Anthropic Economic Index, to set "needs judgment" against "is already being done with AI" |
