#!/usr/bin/env node
// capture.mjs — the network step of the swe-opt-clock-live mode.
// Recipe: recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md
//
// Reads public ATS boards through the engine's own providers, applies the same
// title/location filters `npm run ats:scan` applies, runs that scan on the same
// boards and compares the two posting by posting, then opens each posting a
// new-grad software engineer could take with the engine's own Playwright checker.
// It records what it saw. Every rule is re-applied by evaluate.mjs (offline).
//
//   node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs
//        [--portals <dir>/fixtures/portals-boston-swe.yml]
//        [--board-decisions <dir>/fixtures/board-decisions.yml]   # shown in the audit only
//        [--extra-postings links.json]   # postings found outside the boards (referral links)
//        [--max-checks 80] [--out-dir assignments/submissions/bagwe-shubham1727/runs/<date>/capture]
//
// Exit codes: 0 captured · 2 bad invocation/input · 7 browser would not launch
// (no capture is written: an unchecked capture must never be read as checked).
//
// This is the ONLY file in the mode that touches the network (SNICKERDOODLE P2).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import lever from '../../../ats/providers/lever.mjs';
import ashby from '../../../ats/providers/ashby.mjs';
import { checkUrlLiveness } from '../../../ats/liveness-browser.mjs';
import { HERE, REPO, NAMESPACE, VERSION, rel, redact, sha256, die, parseArgs, guardOutDir, readJson, latestBoardDecisions } from './cli.mjs';
import { buildTitleFilter, filterBoardJobs, scanOfferKey, compareWithScan, newGradTitle, postingIdOf, idRetained, localDate } from './live-lib.mjs';

const PROVIDERS = new Map([greenhouse, lever, ashby].map((p) => [p.id, p]));

const args = parseArgs(process.argv.slice(2));
const now = new Date();
const today = localDate(now);
const P = {
  portals: path.resolve(REPO, args.portals ?? path.join(rel(HERE), 'fixtures/portals-boston-swe.yml')),
  decisions: path.resolve(REPO, args['board-decisions'] ?? path.join(rel(HERE), 'fixtures/board-decisions.yml')),
  extra: args['extra-postings'] ? path.resolve(REPO, args['extra-postings']) : null,
  outDir: path.resolve(REPO, args['out-dir'] ?? path.join(rel(NAMESPACE), 'runs', today, 'capture')),
};
const maxChecks = Number(args['max-checks'] ?? 80);
if (!Number.isInteger(maxChecks) || maxChecks < 0) die(2, `--max-checks must be a non-negative integer, got "${args['max-checks']}"`);
guardOutDir(P.outDir);
for (const k of ['portals', 'decisions']) if (!fs.existsSync(P[k])) die(2, `${k} file not found: ${rel(P[k])}`);
if (P.extra && !fs.existsSync(P.extra)) die(2, `extra-postings file not found: ${rel(P.extra)}`);

let config, decisionsDoc;
try { config = yaml.load(fs.readFileSync(P.portals, 'utf8')); } catch (e) { die(2, `portals file does not parse: ${e.message}`); }
try { decisionsDoc = yaml.load(fs.readFileSync(P.decisions, 'utf8')); } catch (e) { die(2, `board-decisions file does not parse: ${e.message}`); }
const decisions = latestBoardDecisions(decisionsDoc);
const boards = (config?.tracked_companies ?? []).filter((b) => b && b.enabled !== false);
if (!boards.length) die(2, 'portals file has no enabled tracked_companies');
const extra = P.extra ? readJson(P.extra, 'extra-postings file') : [];
if (!Array.isArray(extra)) die(2, 'extra-postings must be a JSON array');
for (const x of extra) for (const f of ['company', 'title', 'url']) if (!x?.[f]) die(2, `extra posting is missing "${f}"`);

// scan.mjs runs mkdirSync('data/ats') relative to the working directory when it
// loads, so it is imported only after moving to the repo root.
process.chdir(REPO);
const { buildLocationFilter } = await import('../../../ats/scan.mjs');
const filters = { titleFilter: buildTitleFilter(config.title_filter), locationFilter: buildLocationFilter(config.location_filter), seen: { urls: new Set(), keys: new Set() } };
const postingId = (prefix, url) => `${prefix}:${postingIdOf(url) ?? crypto.createHash('sha1').update(url).digest('hex').slice(0, 12)}`;

// ── 1. fetch boards, filter the way scan.mjs does ───────────────────────────
const counts = { boards: boards.length, boards_ok: 0, found: 0, filtered_title: 0, filtered_location: 0, duplicates: 0, scan_passed: 0 };
const boardLog = [];
const postings = [];
const ctx = makeHttpCtx();
for (const b of boards) {
  const entry = { name: b.name, provider: b.provider, careers_url: b.careers_url };
  const provider = PROVIDERS.get(b.provider);
  if (!provider) { boardLog.push({ ...entry, fetch: { ok: false, error: `unknown provider "${b.provider}"` } }); continue; }
  // One retry: a board that times out once is common; one that fails twice is logged, not guessed.
  let jobs;
  try { jobs = await provider.fetch(b, ctx); } catch {
    try { jobs = await provider.fetch(b, ctx); } catch (e) { boardLog.push({ ...entry, fetch: { ok: false, error: e.message, attempts: 2 } }); continue; }
  }
  const { passed, counts: c } = filterBoardJobs(jobs, filters);
  counts.boards_ok++;
  for (const k of ['found', 'filtered_title', 'filtered_location', 'duplicates']) counts[k] += c[k];
  counts.scan_passed += c.passed;
  boardLog.push({ ...entry, fetch: { ok: true, total: c.found, passed_scan_filters: c.passed } });
  // listed_in_feed: the board's own API returned this posting at capture time (a
  // record, separate from what the browser later saw on the posting page).
  for (const j of passed) postings.push({ posting_id: postingId(b.provider, j.url), source: 'board', listed_in_feed: true, company: b.name, board: b.careers_url, title: j.title, location: j.location, url: j.url });
}
for (const x of extra)
  postings.push({ posting_id: postingId('manual', x.url), source: 'manual-link', listed_in_feed: false, company: x.company, board: null, title: x.title, location: x.location ?? '', url: x.url, note: x.note ?? null });

// ── 1b. cross-check against the engine's own scan on the same portals file ─
// `npm run ats:scan -- --dry-run` writes nothing and prints one line per posting
// that passed. The two lists must agree, or evaluate.mjs refuses the capture.
const scanRun = spawnSync(process.execPath, ['scripts/ats/scan.mjs', '--dry-run'], {
  cwd: REPO, encoding: 'utf8', env: { ...process.env, REALLOCATION_ENGINE_PORTALS: P.portals }, timeout: 180_000,
});
const scanNum = (label) => { const m = new RegExp(`${label}:\\s+(\\d+)`).exec(scanRun.stdout ?? ''); return m ? Number(m[1]) : null; };
const scanCounts = { found: scanNum('Total jobs found'), filtered_title: scanNum('Filtered by title'), filtered_location: scanNum('Filtered by location'),
  duplicates: scanNum('Duplicates'), new_offers: scanNum('New offers added'), errors: (scanRun.stdout?.match(/^\s+✗ /gm) ?? []).length };
const scanKeys = [...(scanRun.stdout ?? '').matchAll(/^\s+\+ (.+)$/gm)].map((m) => m[1].trim());
const captureKeys = postings.filter((p) => p.source === 'board').map((p) => scanOfferKey(p).trim());
const scanCrosscheck = {
  command: `REALLOCATION_ENGINE_PORTALS=${rel(P.portals)} node scripts/ats/scan.mjs --dry-run`, exit: scanRun.status,
  scan: { ...scanCounts, offer_keys: scanKeys },
  capture: { found: counts.found, filtered_title: counts.filtered_title, filtered_location: counts.filtered_location, duplicates: counts.duplicates, offer_keys: captureKeys },
};
const cmp = compareWithScan(captureKeys, scanKeys, counts.duplicates, scanCounts.duplicates);
scanCrosscheck.result = { ...cmp, match: scanRun.status === 0 && cmp.match && scanCounts.found === counts.found };
console.log(`  scan cross-check: ${scanCrosscheck.result.match ? 'match' : 'MISMATCH'} (scan ${scanCounts.found} found → ${scanCounts.new_offers} new; capture ${counts.found} found → ${counts.scan_passed} passed; only in scan ${cmp.only_in_scan.length}, only in capture ${cmp.only_in_capture.length})`);

// ── 2. liveness: the engine's checker, one page, sequential ────────────────
// The title rule here only chooses which pages to open; evaluate.mjs re-applies it.
const toCheck = postings.filter((p) => newGradTitle(p.title).pass);
const checked = toCheck.slice(0, maxChecks);
let chromium;
try { ({ chromium } = await import('playwright')); } catch (e) { die(7, `playwright is not importable: ${e.message}`); }
let browser;
try { browser = await chromium.launch({ headless: true }); } catch (e) {
  die(7, `browser would not launch (${e.message.split('\n')[0]}). Run "npx playwright install chromium". No capture written.`);
}
try {
  const page = await browser.newPage();
  for (const p of checked) {
    // Start from a blank page so page.url() afterwards belongs to this check, not the last one.
    await page.goto('about:blank');
    const r = await checkUrlLiveness(page, p.url);
    const at = new Date();
    const finalUrl = page.url() === 'about:blank' ? null : page.url();
    p.liveness = { ...r, final_url: finalUrl, id_retained: finalUrl ? idRetained(p.url, finalUrl) : null, checked_at: at.toISOString(), checked_date: localDate(at) };
    console.log(`  ${r.result.padEnd(9)} ${p.company} | ${p.title}${p.liveness.id_retained === false ? ' (left the posting)' : ''}`);
  }
} finally {
  await browser.close();
}

// ── 3. write capture.json (machine) + capture-audit.md (human) ─────────────
fs.mkdirSync(P.outDir, { recursive: true });
const verdicts = {};
for (const p of checked) verdicts[p.liveness.result] = (verdicts[p.liveness.result] ?? 0) + 1;
const capture = {
  workflow: 'swe-opt-clock-live', step: 'capture', capture_version: VERSION,
  captured_at: now.toISOString(), capture_date: today,
  inputs: { portals: { path: rel(P.portals), sha256: sha256(P.portals) }, ...(P.extra ? { extra_postings: { path: rel(P.extra), sha256: sha256(P.extra) } } : {}) },
  filters: { title_filter: config.title_filter ?? null, location_filter: config.location_filter ?? null, mirrors: 'scripts/ats/scan.mjs main() order and dedup keys' },
  counts: { ...counts, manual_links: extra.length, opened: checked.length, not_opened_cap: toCheck.length - checked.length, liveness_verdicts: verdicts },
  scan_crosscheck: scanCrosscheck,
  boards: boardLog,
  postings,
};
const capPath = path.join(P.outDir, 'capture.json');
fs.writeFileSync(capPath, JSON.stringify(capture, null, 2) + '\n');

const C = capture.counts;
const R = scanCrosscheck.result;
const ownerOf = (url) => { const d = decisions.get(url); return d ? `${d.status}${d.by && d.status !== 'proposed' ? ` (${d.by}, ${d.date instanceof Date ? localDate(d.date) : d.date})` : ''}` : 'no decision'; };
const md = [];
md.push(`# Board capture audit — ${today}\n`);
md.push(`## Executive summary\n`);
md.push(`**What this is.** A record of what the public job boards of ${C.boards} Massachusetts companies with a software-engineer sponsorship history showed on ${today}, and what a browser saw when it opened the postings a new graduate could take.\n`);
md.push(`**Why read it.** Every later decision starts from this list. If a board belongs to the wrong company, a filter dropped something it shouldn't have, or a page couldn't be read, it shows here first. Boards marked *proposed* below are waiting for you to decide whether they belong to the company named.\n`);
md.push(`**What it found.** ${C.found} postings on ${C.boards_ok} reachable boards. ${C.scan_passed} passed the software-title and US-location filters, the same ${R.match ? 'list' : '**(but not the same list — see below)**'} the engine's own board scan produced. ${checked.length} look like new-grad software jobs and were opened: ${Object.entries(verdicts).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}. This file makes no recommendation.\n`);
md.push(`## Run record\n`);
md.push(`- Portals file: \`${capture.inputs.portals.path}\` (sha256 \`${capture.inputs.portals.sha256.slice(0, 12)}…\`) · captured at ${capture.captured_at}`);
md.push(`- Cross-check against \`${scanCrosscheck.command}\`, run inside this capture: **${R.match ? 'match' : 'MISMATCH'}**. Scan: ${scanCounts.found} found, ${scanCounts.filtered_title} / ${scanCounts.filtered_location} removed by title / location, ${scanCounts.duplicates} duplicates, ${scanCounts.new_offers} new. Only in scan: ${R.only_in_scan.length}; only in capture: ${R.only_in_capture.length} (allowed: ${Math.max(R.extra_scan_duplicates, 0)}, the scan's extra duplicates from a private scan history). A mismatch means the boards changed between the two reads or the mirror has drifted, and the evaluate step refuses the capture.\n`);
if (!R.match) md.push(`  - only in scan: ${R.only_in_scan.join(' · ') || '—'}\n  - only in capture: ${R.only_in_capture.join(' · ') || '—'}\n`);
md.push(`## Records in, records out\n`);
md.push(`| Stage | Count |\n|---|---|`);
md.push(`| Boards listed / reachable | ${C.boards} / ${C.boards_ok} |`);
md.push(`| Postings found | ${C.found} |`);
md.push(`| Removed by title filter | ${C.filtered_title} |`);
md.push(`| Removed by location filter | ${C.filtered_location} |`);
md.push(`| Duplicates (same URL or same company + title) | ${C.duplicates} |`);
md.push(`| **Passed scan filters** | **${C.scan_passed}** |`);
md.push(`| Manual links added | ${C.manual_links} |`);
md.push(`| New-grad titles opened in a browser / not opened (cap) | ${C.opened} / ${C.not_opened_cap} |\n`);
md.push(`## Boards\n`);
md.push(`| Company (80 Days name) | Board | Ownership decision (gate G1a) | Postings | Passed filters |\n|---|---|---|---|---|`);
for (const b of boardLog) md.push(`| ${b.name} | ${b.careers_url} | ${ownerOf(b.careers_url)} | ${b.fetch.ok ? b.fetch.total : `error: ${b.fetch.error}`} | ${b.fetch.passed_scan_filters ?? '—'} |`);
md.push(`\n## Postings opened, and what the browser saw\n`);
md.push(`| Company | Title | Location | Liveness | Stayed on posting? |\n|---|---|---|---|---|`);
for (const p of toCheck) {
  const l = p.liveness;
  md.push(`| ${p.company} | ${p.title} | ${p.location || '—'} | ${l ? `${l.result} (${l.code})` : 'not opened'} | ${l ? (l.id_retained == null ? 'n/a' : l.id_retained ? 'yes' : '**no**') : '—'} |`);
}
md.push(`\n## Passed the scan filters but not the new-grad title rule\n`);
md.push(`| Company | Title | Rule |\n|---|---|---|`);
for (const p of postings.filter((x) => !newGradTitle(x.title).pass)) md.push(`| ${p.company} | ${p.title} | ${newGradTitle(p.title).code} |`);
const auditPath = path.join(P.outDir, 'capture-audit.md');
fs.writeFileSync(auditPath, md.join('\n') + '\n');

console.log(`✓ capture ${today}: ${C.found} postings on ${C.boards_ok}/${C.boards} boards → ${C.scan_passed} passed scan filters → ${C.opened} new-grad postings opened (${Object.entries(verdicts).map(([k, v]) => `${k} ${v}`).join(' · ')})`);
for (const b of boardLog.filter((x) => !x.fetch.ok)) console.log(`  ✗ ${b.name} (${b.careers_url}): ${redact(b.fetch.error)}`);
console.log(`  ${rel(capPath)}`);
console.log(`  ${rel(auditPath)}`);
