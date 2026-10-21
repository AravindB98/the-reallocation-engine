#!/usr/bin/env node
// liveness-json.mjs — machine-readable posting liveness (closes the recipe's DEV TODO
// without patching a maintained file).
//
// Same detection as `npm run ats:liveness`: it imports checkUrlLiveness from
// scripts/ats/liveness-browser.mjs and runs it sequentially (project rule: never
// Playwright in parallel), exactly like scripts/ats/check-liveness.mjs. The only
// difference is the output: one JSON object per line instead of emoji text, so the
// triage prototype never has to parse console output.
//
//   node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/liveness-json.mjs --file urls.txt --out liveness.jsonl
//
// Each line: {"url","result":"active|expired|uncertain","reason","code","checked_at",
//             "provenance":"record","checker":"scripts/ats/liveness-browser.mjs#checkUrlLiveness"}
// Exit: 0 when every URL was checked (expired/uncertain results are data, not errors)
//       · 1 browser failure · 2 usage error.
// Network: only the posting URLs listed in the input file.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { checkUrlLiveness } from '../../../ats/liveness-browser.mjs';

export const CHECKER = 'scripts/ats/liveness-browser.mjs#checkUrlLiveness';

export function readUrls(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

export function toRecord(url, res, checkedAt) {
  return { url, result: res.result, reason: res.reason ?? null, code: res.code ?? null, checked_at: checkedAt, provenance: 'record', checker: CHECKER };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const file = flag('--file'); const out = flag('--out');
  if (!file || !out || !fs.existsSync(file)) {
    console.error('Usage: liveness-json.mjs --file urls.txt --out liveness.jsonl');
    process.exit(2);
  }
  const urls = readUrls(fs.readFileSync(file, 'utf8'));
  console.log(`Checking ${urls.length} URL(s) with ${CHECKER} (sequential)...`);
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { console.error(`✗ could not launch Chromium: ${e.message.split('\n')[0]} (run: npx playwright install chromium)`); process.exit(1); }
  const page = await browser.newPage();
  const lines = []; const counts = { active: 0, expired: 0, uncertain: 0 };
  for (const url of urls) {
    const res = await checkUrlLiveness(page, url);
    const rec = toRecord(url, res, new Date().toISOString());
    lines.push(JSON.stringify(rec));
    counts[rec.result] = (counts[rec.result] || 0) + 1;
    console.log(`${rec.result.padEnd(9)} ${url}${rec.result === 'active' ? '' : `  (${rec.reason})`}`);
  }
  await browser.close();
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(`Results: ${counts.active} active  ${counts.expired} expired  ${counts.uncertain} uncertain  →  ${out}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
