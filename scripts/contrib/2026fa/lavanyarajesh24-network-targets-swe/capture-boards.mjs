#!/usr/bin/env node
// capture-boards.mjs — fetch each discovered job board once and save a dated snapshot.
// NETWORK step. Reads the board list written by discover-boards.mjs and saves one
// timestamped snapshot per company, bundled in a single file, for network-targets.mjs
// to read offline.
//
// Network hosts contacted: boards-api.greenhouse.io and api.lever.co only, via the
// maintained providers scripts/ats/providers/{greenhouse,lever}.mjs. Nothing else.
//
//   node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/capture-boards.mjs
//        [--boards inputs/boards.discovered.json] [--out inputs/boards-snapshot.json]
//
// A board whose identity is not verified (see lib.mjs boardIdentity) is NOT fetched;
// it is saved as status:"identity-unverified". A failed fetch is saved as
// status:"error". network-targets.mjs reports both as UNCHECKED — never as "zero jobs".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import lever from '../../../ats/providers/lever.mjs';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';
import { nameKey, identityUsable } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? path.resolve(argv[i + 1]) : d; };
const boardsFile = opt('--boards', path.join(HERE, 'inputs/boards.discovered.json'));
const outFile = opt('--out', path.join(HERE, 'inputs/boards-snapshot.json'));

const PROVIDERS = {
  greenhouse: { mod: greenhouse, entry: (b) => ({ name: b.company, api: `https://boards-api.greenhouse.io/v1/boards/${b.slug}/jobs` }) },
  lever: { mod: lever, entry: (b) => ({ name: b.company, careers_url: `https://jobs.lever.co/${b.slug}` }) },
};

// One board per company: a name-matched board beats a person-confirmed one beats the rest.
const rank = (b) => (b.identity?.status === 'name-match' ? 0 : b.confirmed_by ? 1 : 2);
const discovered = JSON.parse(fs.readFileSync(boardsFile, 'utf8'));
const byCompany = new Map();
for (const b of [...discovered.boards].sort((x, y) => rank(x) - rank(y))) {
  const k = nameKey(b.company);
  if (!byCompany.has(k)) byCompany.set(k, b);
}

const bundle = { captured_at: new Date().toISOString(), boards_from: path.basename(boardsFile), boards: {} };
const ctx = makeHttpCtx();
const tally = { ok: 0, error: 0, 'identity-unverified': 0 };

for (const [key, b] of byCompany) {
  const p = PROVIDERS[b.provider];
  const snap = { company: b.company, provider: b.provider, slug: b.slug, slug_source: b.slug_source, identity: b.identity, confirmed_by: b.confirmed_by ?? null, fetched_at: new Date().toISOString() };
  if (!p) Object.assign(snap, { status: 'error', error: `no provider for "${b.provider}"`, jobs: null });
  else if (!identityUsable(b)) Object.assign(snap, { status: 'identity-unverified', error: `board identity ${b.identity?.status ?? 'missing'}${b.identity?.board_name ? ` (board name "${b.identity.board_name}")` : ''}; not fetched`, jobs: null });
  else {
    try {
      const jobs = await p.mod.fetch(p.entry(b), ctx); // sequential on purpose: polite to the API
      Object.assign(snap, { status: 'ok', jobs });
    } catch (x) {
      Object.assign(snap, { status: 'error', http_status: x.status ?? null, error: String(x.message).slice(0, 200), jobs: null });
    }
  }
  tally[snap.status]++;
  const mark = { ok: '✓', error: '✗', 'identity-unverified': '?' }[snap.status];
  console.log(`${mark} ${b.company.padEnd(40)} ${snap.status === 'ok' ? `${String(snap.jobs.length).padStart(4)} jobs` : snap.error.slice(0, 70)}  (${b.provider}/${b.slug})`);
  bundle.boards[key] = snap;
}
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(bundle, null, 2));
console.log(`\n${tally.ok} board(s) saved, ${tally.error} fetch error(s), ${tally['identity-unverified']} identity-unverified (not fetched) → ${path.relative(process.cwd(), outFile)}`);
