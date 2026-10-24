#!/usr/bin/env node
// discover-boards.mjs — company → ATS board lookup (closes recipe TODO 3).
// NETWORK step. Slugs are no longer hand-entered guesses: the maintained detector
// scripts/ats/detect-ats.py (Greenhouse, then Lever) is run as-is on every candidate,
// and each hit is then identity-checked, because a slug that answers HTTP 200 may
// belong to a different company.
//
//   node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/discover-boards.mjs
//        [--persona p.json] [--csv f.csv] [--seed inputs/boards.json]
//        [--out inputs/boards.discovered.json] [--delay 0.5] [--limit N]
//
// Hosts contacted: whatever detect-ats.py contacts (boards-api.greenhouse.io,
// api.lever.co), plus boards-api.greenhouse.io/v1/boards/<slug> for the identity check.
//
// Output entries: { company, provider, slug, slug_source, identity, confirmed_by }.
// capture-boards.mjs fetches only entries that pass identityUsable(); the rest are
// captured as status "identity-unverified" so network-targets reports them as
// check-board. A person confirms an unverified board by setting confirmed_by (name,
// date) in the output file; re-running keeps that confirmation.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fetchJson } from '../../../ats/providers/_http.mjs';
import { nameKey, parseCsv, selectCandidates, boardIdentity } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const ATS = path.join(ROOT, 'scripts/ats');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const persona = JSON.parse(fs.readFileSync(path.resolve(opt('--persona', path.join(HERE, 'inputs/persona.json'))), 'utf8'));
const csvFile = path.resolve(opt('--csv', path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv')));
const seedFile = path.resolve(opt('--seed', path.join(HERE, 'inputs/boards.json')));
const outFile = path.resolve(opt('--out', path.join(HERE, 'inputs/boards.discovered.json')));
const delay = opt('--delay', '0.5');
const limit = Number(opt('--limit', '0'));

// Greenhouse board metadata: { name, content }. Host is fixed, slug is URL-encoded.
async function greenhouseBoard(slug) {
  try {
    const j = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}`, { redirect: 'error' });
    return { name: typeof j?.name === 'string' ? j.name : null, http_status: 200 };
  } catch (x) { return { name: null, http_status: x.status ?? null }; }
}

const { records } = parseCsv(fs.readFileSync(csvFile, 'utf8'));
let candidates = selectCandidates(records, persona.target);
if (limit > 0) candidates = candidates.slice(0, limit);
const names = [...new Set(candidates.map((r) => r.company_name))];

// Keep earlier human confirmations across re-runs.
const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : { boards: [] };
const confirmed = new Map(previous.boards.filter((b) => b.confirmed_by).map((b) => [`${nameKey(b.company)}|${b.provider}|${b.slug}`, b.confirmed_by]));

// 1. the maintained detector, run as-is (its cwd must be scripts/ats for its imports)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-boards-'));
fs.writeFileSync(path.join(tmp, 'companies.txt'), names.join('\n') + '\n');
console.log(`detect-ats.py on ${names.length} candidate(s)…`);
const det = spawnSync('python3', ['detect-ats.py', '--file', path.join(tmp, 'companies.txt'), '--json-output', path.join(tmp, 'detected.json'), '--delay', delay],
  { cwd: ATS, encoding: 'utf8', stdio: ['ignore', 'inherit', 'pipe'] });
if (det.status !== 0) { console.error(`✗ detect-ats.py exited ${det.status}\n${(det.stderr || '').slice(-800)}`); process.exit(2); }
const detected = JSON.parse(fs.readFileSync(path.join(tmp, 'detected.json'), 'utf8'));

// 2. hand-entered seed slugs (your-input) are kept, but checked the same way
const seed = fs.existsSync(seedFile) ? JSON.parse(fs.readFileSync(seedFile, 'utf8')) : [];
const raw = [
  ...detected.filter((d) => d.detection_status === 'found').map((d) => ({ company: d.company_name, provider: d.ats_platform, slug: d.ats_slug, slug_source: 'record (scripts/ats/detect-ats.py)' })),
  ...seed.map((s) => ({ company: s.company, provider: 'greenhouse', slug: s.greenhouse_slug, slug_source: `your-input (hand-entered in ${path.basename(seedFile)})` })),
];

// 3. identity check, one entry per (company, provider, slug)
const seen = new Set(), boards = [];
for (const e of raw) {
  const id = `${nameKey(e.company)}|${e.provider}|${e.slug}`;
  if (seen.has(id)) continue;
  seen.add(id);
  const meta = e.provider === 'greenhouse' ? await greenhouseBoard(e.slug) : { name: null, http_status: null };
  const boardName = meta.name;
  const identity = { ...boardIdentity(e.company, e.provider, boardName, meta.http_status), checked_at: new Date().toISOString() };
  boards.push({ ...e, identity, confirmed_by: confirmed.get(id) ?? null });
  const mark = { 'name-match': '✓', 'name-mismatch': '✗', 'board-not-found': '✗', unverified: '?' }[identity.status];
  console.log(`${mark} ${e.company.padEnd(40)} ${e.provider}/${e.slug}  ${identity.status}${boardName ? ` (board name "${boardName}")` : ''}`);
}

const notFound = detected.filter((d) => d.detection_status !== 'found' && !seed.some((s) => nameKey(s.company) === nameKey(d.company_name))).map((d) => d.company_name);
const out = {
  _tool: 'discover-boards', generated_at: new Date().toISOString(),
  detector: 'scripts/ats/detect-ats.py (greenhouse, lever; one slug per name: normalize_company_name)',
  candidates: names.length,
  counts: Object.fromEntries(['name-match', 'name-mismatch', 'board-not-found', 'unverified'].map((s) => [s, boards.filter((b) => b.identity.status === s).length])),
  not_found: notFound,
  boards,
};
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${names.length} candidates → ${boards.length} board entr(ies): ${JSON.stringify(out.counts)}; ${notFound.length} with no board found → ${path.relative(ROOT, outFile)}`);
