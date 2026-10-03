#!/usr/bin/env node
// greenhouse-check.mjs — NETWORK step (the only one in this prototype).
// For each role with a `greenhouse_board` and a job id in its URL, asks the
// public Greenhouse job-board API whether that job id exists:
//   GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>
// Host named in the recipe; no other host is contacted. Writes the raw
// observations to a JSON file that match.mjs reads offline.
//
//   node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs \
//     --input <candidates.json> --out <greenhouse-api.json>

import fs from 'node:fs';
import path from 'node:path';
import { greenhouseJobId } from './lib.mjs';

const HOST = 'https://boards-api.greenhouse.io';

async function main() {
  const a = process.argv.slice(2);
  const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const input = get('--input'), out = get('--out');
  if (!input || !out) { console.error('Usage: greenhouse-check.mjs --input candidates.json --out greenhouse-api.json'); process.exit(2); }
  const { roles = [] } = JSON.parse(fs.readFileSync(input, 'utf8'));
  const checks = {};
  for (const r of roles) {
    const id = r.url ? greenhouseJobId(r.url) : null;
    if (!r.greenhouse_board || !id) continue;
    if (!/^[a-z0-9-]+$/i.test(r.greenhouse_board)) { console.error(`  skip ${r.role_id}: bad board slug`); continue; }
    const url = `${HOST}/v1/boards/${r.greenhouse_board}/jobs/${id}`;
    let status = 0, title = null, updated_at = null, error = null;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      status = res.status;
      if (res.ok) { const j = await res.json(); title = j.title ?? null; updated_at = j.updated_at ?? null; }
    } catch (e) { error = e.message; }
    checks[`${r.greenhouse_board}/${id}`] = { role_id: r.role_id, url, status, title, updated_at, error };
    console.log(`${String(status).padEnd(4)} ${url}${title ? `  "${title}"` : ''}${error ? `  ERROR ${error}` : ''}`);
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ host: HOST, checked_at: new Date().toISOString(), checks }, null, 2) + '\n');
  console.log(`wrote ${out} (${Object.keys(checks).length} checks)`);
}

main();
