#!/usr/bin/env node
// live-check.mjs — the browser liveness gate (G3b) for every matching posting.
// NETWORK step (Playwright, headless Chromium). Same detection as
// `npm run ats:liveness`: it calls the maintained checkUrlLiveness() from
// scripts/ats/liveness-browser.mjs, one URL at a time (project rule: never
// Playwright in parallel). check-liveness.mjs only prints; this saves the
// per-URL result so network-targets.mjs can read it offline.
//
//   node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/live-check.mjs
//        [--urls <run dir>/posting-urls.txt] [--out inputs/liveness.json]
//
// Hosts contacted: the posting URLs in --urls (written by network-targets.mjs from
// the board snapshot), after liveness-browser.mjs's private-host guard.
// A navigation failure is saved as "uncertain", never as "expired".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { checkUrlLiveness } from '../../../ats/liveness-browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? path.resolve(argv[i + 1]) : d; };
const urlsFile = opt('--urls', path.join(ROOT, 'course/2026fa/submissions/lavanyarajesh24/runs/posting-urls.txt'));
const outFile = opt('--out', path.join(HERE, 'inputs/liveness.json'));

const urls = [...new Set(fs.readFileSync(urlsFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')))];
console.log(`Checking ${urls.length} posting URL(s) with headless Chromium…\n`);

const started = new Date().toISOString();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = {};
const tally = { active: 0, expired: 0, uncertain: 0 };
for (const url of urls) {
  const r = await checkUrlLiveness(page, url);
  results[url] = { ...r, checked_at: new Date().toISOString() };
  tally[r.result]++;
  console.log(`${{ active: '✅', expired: '❌', uncertain: '⚠️' }[r.result]} ${r.result.padEnd(10)} ${url}${r.result === 'active' ? '' : `\n           ${r.code}: ${r.reason}`}`);
}
await browser.close();

const out = { _tool: 'live-check', checker: 'scripts/ats/liveness-browser.mjs checkUrlLiveness (same logic as npm run ats:liveness)',
  urls_from: path.relative(ROOT, urlsFile), started_at: started, finished_at: new Date().toISOString(), counts: tally, results };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`\nResults: ${tally.active} active  ${tally.expired} expired  ${tally.uncertain} uncertain → ${path.relative(process.cwd(), outFile)}`);
