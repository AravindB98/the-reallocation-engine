#!/usr/bin/env node
// posting-evidence.mjs — the opt-countdown mode's only network step (v0.2).
//
// For every candidate with a `greenhouse: {board, job_id}` key, GET the public
// Greenhouse job-board API once and save what the posting itself says:
//   http_status (200 live / 404 gone), first_published, updated_at, title,
//   location, and three facts read from the posting text by fixed patterns
//   (lib.mjs extractPostingFacts): an explicit no-sponsorship phrase, the
//   minimum years of experience asked for, and a pay range if one is printed.
// Only the extracted facts and short matched phrases are saved, never the full
// posting text. Every record carries checked_at; the mode blocks evidence older
// than MAX_EVIDENCE_AGE_DAYS.
//
//   node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs \
//     --candidates c.json --out posting-evidence.json [--dry-run]
//
// --dry-run prints the requests it would make and writes nothing.
// Exit: 0 = written · 2 = bad input · 4 = network error on any request (file still
// written; the failed key carries http_status 0 and the mode blocks that role).

import fs from 'node:fs';
import path from 'node:path';
import { htmlToText, extractPostingFacts } from './lib.mjs';

const API = 'https://boards-api.greenhouse.io/v1/boards';

function args() {
  const a = process.argv.slice(2), o = { 'dry-run': false };
  for (let i = 0; i < a.length; i++) {
    const k = a[i].replace(/^--/, '');
    if (k === 'dry-run') o['dry-run'] = true;
    else if (['candidates', 'out'].includes(k) && a[i + 1]) o[k] = path.resolve(a[++i]);
    else { console.error(`✗ posting-evidence: unknown or incomplete flag: ${a[i]}`); process.exit(2); }
  }
  if (!o.candidates || (!o.out && !o['dry-run'])) { console.error('✗ posting-evidence: need --candidates and --out'); process.exit(2); }
  return o;
}

async function main() {
  const o = args();
  let c;
  try { c = JSON.parse(fs.readFileSync(o.candidates, 'utf8')); } catch (e) { console.error(`✗ posting-evidence: candidates: ${e.message}`); process.exit(2); }
  const keys = [...new Set((c.roles || []).filter((r) => r.greenhouse).map((r) => `${r.greenhouse.board}/${r.greenhouse.job_id}`))];
  const skipped = (c.roles || []).filter((r) => !r.greenhouse).map((r) => r.role_id);
  if (o['dry-run']) {
    for (const k of keys) console.log(`GET ${API}/${k.replace('/', '/jobs/')}`);
    console.log(`(dry run: ${keys.length} requests, nothing written; no Greenhouse key, not checked: ${skipped.join(', ') || 'none'})`);
    return;
  }
  const postings = {};
  let errors = 0;
  for (const k of keys) { // sequential, one request per posting
    const [board, id] = k.split('/');
    const checked_at = new Date().toISOString();
    try {
      const res = await fetch(`${API}/${board}/jobs/${id}`);
      const rec = { http_status: res.status, checked_at };
      if (res.status === 200) {
        const j = await res.json();
        Object.assign(rec, { title: j.title, location: j.location?.name ?? null, first_published: j.first_published ?? null,
          updated_at: j.updated_at ?? null, facts: extractPostingFacts(htmlToText(j.content || '')) });
      }
      postings[k] = rec;
      console.log(`${res.status} ${k}${rec.facts?.sponsorship_exclusion.matched ? '  ! posting excludes sponsorship' : ''}`);
    } catch (e) {
      errors++;
      postings[k] = { http_status: 0, checked_at, error: e.message };
      console.log(`000 ${k}  network error: ${e.message}`);
    }
  }
  const out = { _tool: 'posting-evidence.mjs (opt-countdown v0.2)', _source: 'record', api: API,
    checked_at: new Date().toISOString(), not_checked_no_greenhouse_key: skipped, postings };
  fs.writeFileSync(o.out, JSON.stringify(out, null, 2) + '\n');
  console.log(`✓ ${keys.length} postings → ${path.relative(process.cwd(), o.out)}${errors ? ` (${errors} network errors)` : ''}`);
  if (errors) process.exit(4);
}

main();
