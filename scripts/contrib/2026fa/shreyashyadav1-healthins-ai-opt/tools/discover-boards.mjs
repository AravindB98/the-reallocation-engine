#!/usr/bin/env node
// Which public job boards answer? Probes candidate slugs on the three board APIs the repo's providers read
// (Greenhouse, Lever, Ashby) and prints one line per board that responds: "<gh|lv|ab> <slug> <openings>".
//
// Candidate slugs: the website label and the normalised company name of every row in the sponsor CSV, plus a short
// list of insurtech and health-AI names the author typed in. A hit means "this slug answers", NOT "this board belongs to
// the company the slug was taken from": nothing here compares the board's content to the company.
//
// NETWORKED (read-only GETs, 8 at a time). Run by hand, like ingest.mjs; nothing else calls it. It is the same code that
// produced evidence/05-board-discovery.txt on 2026-10-20, except that it imports lib.mjs by a relative path (the scratch
// copy had the author's absolute path) and that this usage text and the argument check were added.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/export-sponsors.mjs output/healthins-verify/sponsors-in-sector.csv
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/discover-boards.mjs output/healthins-verify/sponsors-in-sector.csv
import fs from 'node:fs';
import { parseCsv, normalizeName } from '../lib.mjs';

if (!process.argv[2]) { console.error('usage: discover-boards.mjs <sponsors.csv>'); process.exit(2); }
const sp = parseCsv(fs.readFileSync(process.argv[2], 'utf8'));
const watch = ['hippo','rootinsurance','root','nextinsurance','coalition','at-bay','atbay','pieinsurance','kin','ethos','policygenius','ladder','branch','openly','corvus','cowbell','clearcover','bestow','marshmallow','hinge','hingehealth','tempus','tempusai','colorhealth','color','springhealth','lyrahealth','includedhealth','carbonhealth','ro','hims','sword','swordhealth','cohere','cohere-health','zelis','innovaccer','h1','notable','notablehealth','ambience','ambiencehealthcare','nabla','suki','hippocratic','hippocraticai','pearlhealth','candidhealth','candid','alma','headspace','dexcare','thirtymadison','accolade','phreesia','paige','paigeai','imperativecare','heartflow','irhythm','clarapath','eargo','exoimaging','inarimedical'];
const names = new Set(watch);
for (const r of sp) {
  const site = (r.website || '').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].split('.')[0];
  if (site) names.add(site);
  names.add(normalizeName(r.company_name));
}
const slugs = [...names].filter(s => s && s.length >= 3 && !/^\d/.test(s));
const apis = {
  gh: s => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs`,
  lv: s => `https://api.lever.co/v0/postings/${s}?mode=json`,
  ab: s => `https://api.ashbyhq.com/posting-api/job-board/${s}`,
};
const jobs = [];
for (const s of slugs) for (const p of Object.keys(apis)) jobs.push([p, s]);
console.error(`probing ${slugs.length} slugs × 3 providers = ${jobs.length} requests`);
const hits = [];
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [p, s] = jobs[i++];
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
      const res = await fetch(apis[p](s), { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; The-Reallocation-Engine/1.0)' } });
      clearTimeout(t);
      if (res.ok) {
        const j = await res.json();
        const n = p === 'gh' ? (j.jobs||[]).length : p === 'lv' ? (Array.isArray(j) ? j.length : 0) : (j.jobs||[]).length;
        hits.push({ p, s, n });
      }
    } catch {}
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
hits.sort((a,b)=>a.s.localeCompare(b.s));
for (const h of hits) console.log(`${h.p} ${h.s} ${h.n}`);
console.error(`${hits.length} boards respond`);
