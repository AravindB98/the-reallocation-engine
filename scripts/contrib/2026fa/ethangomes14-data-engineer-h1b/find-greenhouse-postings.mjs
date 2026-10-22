#!/usr/bin/env node
// find-greenhouse-postings.mjs — discovery step of the data-engineer-h1b
// recipe (v0.5.0; an ingest script, SNICKERDOODLE P2). For each Greenhouse
// board token, lists the public job board and keeps the postings whose title
// is in the Data Engineer family (rules.json). Writes a candidates SKELETON:
// every row has fit: null, so sponsor-screen.mjs rejects it at G0 until a
// fit rating (model-judgment) and its reason are added by hand. Discovery
// never rates fit and never decides anything.
// Allowed host: boards-api.greenhouse.io — nothing else.
//
//   node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs \
//     --board <token> [--board <token> ...] [--boards <file>] [--out <json>]
//
// --boards <file>: one board token per line; blank lines and # comments ignored.
// Default --out:   samples/postings-<today>.json
// A board that does not answer 200 is listed with its status, never guessed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GREENHOUSE_API_HOST, compileFamily, isFamilyTitle, localToday } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DELAY_MS = 500; // polite: one request at a time, half a second apart
const GH_HOSTS = new Set(['boards.greenhouse.io', 'job-boards.greenhouse.io']);

function stop(msg) { console.error(`STOP: ${msg}`); process.exit(2); }

const args = process.argv.slice(2);
const boards = [];
let out = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--board') boards.push(args[++i] ?? stop('--board needs a value'));
  else if (args[i] === '--boards') {
    const f = path.resolve(args[++i] ?? stop('--boards needs a value'));
    if (!fs.existsSync(f)) stop(`boards file not found: ${f}`);
    for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const t = l.replace(/#.*/, '').trim(); if (t) boards.push(t); }
  } else if (args[i] === '--out') out = path.resolve(args[++i] ?? stop('--out needs a value'));
  else stop(`unknown argument ${args[i]}`);
}
if (!boards.length) stop('name at least one --board <token> or a --boards <file>');
for (const b of boards) if (!/^[a-z0-9_-]+$/i.test(b)) stop(`not a Greenhouse board token: "${b}"`);
const today = localToday();
out ??= path.join(HERE, `samples/postings-${today}.json`);

const within = (p, base) => p === base || p.startsWith(base + path.sep);
const realTmp = fs.realpathSync(os.tmpdir());
if (!within(out, HERE) && !within(out, realTmp) && !within(out, os.tmpdir()) && !within(out, '/tmp') && !within(out, '/private/tmp')) {
  stop(`--out must be inside ${path.relative(process.cwd(), HERE)} or a temp dir`);
}

const raw = JSON.parse(fs.readFileSync(path.join(HERE, 'rules.json'), 'utf8'));
const family = compileFamily({ family_patterns: raw.family_patterns.value, exclusion_patterns: raw.exclusion_patterns.value });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(apiPath) {
  const api = `https://${GREENHOUSE_API_HOST}${apiPath}`;
  if (new URL(api).hostname !== GREENHOUSE_API_HOST) stop('refusing a non-allow-listed host');
  try {
    const res = await fetch(api, { redirect: 'manual', headers: { accept: 'application/json' } });
    return { api, http_status: res.status, body: res.status === 200 ? await res.json() : null, error: null };
  } catch (e) { return { api, http_status: null, body: null, error: e.message }; }
}

const boardRows = [];
const candidates = [];
for (const board of boards) {
  const res = await getJson(`/v1/boards/${encodeURIComponent(board)}/jobs`);
  await sleep(DELAY_MS);
  const jobs = res.body?.jobs ?? null;
  if (!jobs) {
    boardRows.push({ board, api_url: res.api, http_status: res.http_status, error: res.error, jobs_total: null, family_matches: 0 });
    console.log(`${String(res.http_status ?? 'ERR').padEnd(4)} ${board.padEnd(18)} board not available`);
    continue;
  }
  const matches = jobs.filter((j) => isFamilyTitle(j.title || '', family));
  boardRows.push({ board, api_url: res.api, http_status: res.http_status, error: null, jobs_total: jobs.length, family_matches: matches.length });
  console.log(`${String(res.http_status).padEnd(4)} ${board.padEnd(18)} ${String(jobs.length).padStart(4)} jobs · ${matches.length} Data Engineer-family`);
  for (const j of matches) {
    const url = j.absolute_url;
    let host = null;
    try { host = new URL(url).hostname.toLowerCase(); } catch { /* left null */ }
    candidates.push({
      role_id: `${board}-${j.id}`,
      company: j.company_name || board,
      title: j.title,
      location: j.location?.name ?? null,
      url,
      ...(GH_HOSTS.has(host) ? {} : { greenhouse_board: board }),
      first_published: j.first_published ? String(j.first_published).slice(0, 10) : null,
      updated_at: j.updated_at ? String(j.updated_at).slice(0, 10) : null,
      fit: null,
    });
    console.log(`       ${j.title} — ${j.location?.name ?? 'no location'}`);
  }
}

const doc = {
  _about: 'Candidates SKELETON from the public Greenhouse job-board API, saved by find-greenhouse-postings.mjs. Titles filtered by the Data Engineer family rule in rules.json (model-judgment). company, title, location, url, first_published and updated_at are record values from the API. fit is null on purpose: sponsor-screen.mjs rejects these rows at G0 until a fit rating and reason are added (model-judgment).',
  found_on: today,
  source: 'record',
  host: GREENHOUSE_API_HOST,
  boards: boardRows,
  candidates,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
const ok = boardRows.filter((b) => b.http_status === 200).length;
console.log(`\n${boards.length} boards asked · ${ok} answered · ${candidates.length} Data Engineer-family postings → ${path.relative(process.cwd(), out)}`);
