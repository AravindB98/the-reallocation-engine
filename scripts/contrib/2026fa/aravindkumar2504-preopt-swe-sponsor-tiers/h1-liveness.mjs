// h1-liveness.mjs: run the repository's liveness checker over the chosen postings and keep its verdicts as
// evidence for gate H1 (live step L3; closes the recipe's "batch gate H1" proposal).
//
// It does not judge liveness itself. It runs scripts/ats/check-liveness.mjs (Playwright, sequential, the
// repository's tested checker) on the URL file select-postings.mjs wrote, saves the checker's own output word for
// word, and parses it into one verdict per URL. A URL the checker printed no verdict for is recorded as
// "uncertain", never "active": the gate fails closed. The person still confirms each posting at H1.
//
//   node h1-liveness.mjs --urls <h1-urls.txt> --out-dir <dir> [--checker <path>]
//
// Writes <dir>/h1-liveness.stdout.txt (the checker's output) and <dir>/h1-liveness.json. --checker exists for the
// offline tests (a stand-in that prints canned lines); the live run uses the default.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha256File } from './evidence.mjs';
import { displayPath } from './paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
export const DEFAULT_CHECKER = path.join(REPO, 'scripts/ats/check-liveness.mjs');

const LINE = /^\s*(?:✅|❌|⚠️)\s+(active|expired|uncertain)\s+(\S+)\s*$/u;

export function readUrls(text) {
  return String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

/** One verdict per requested URL, from the checker's printed lines; a missing or duplicated verdict fails closed. */
export function parseCheckerOutput(stdout, urls) {
  const lines = String(stdout).split(/\r?\n/);
  const seen = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LINE);
    if (!m) continue;
    const [, result, url] = m;
    const next = lines[i + 1] || '';
    const reason = result !== 'active' && /^\s{4,}\S/.test(next) && !LINE.test(next) ? next.trim() : null;
    if (!seen.has(url)) seen.set(url, []);
    seen.get(url).push({ result, reason, raw: lines[i].trim() });
  }
  return urls.map((url) => {
    const hits = seen.get(url) || [];
    if (hits.length === 1) return { url, ...hits[0], recorded_as: hits[0].result };
    if (hits.length === 0) return { url, result: null, reason: 'the checker printed no verdict for this URL', raw: null, recorded_as: 'uncertain' };
    return { url, result: null, reason: `the checker printed ${hits.length} verdicts for this URL`, raw: hits.map((h) => h.raw).join(' | '), recorded_as: 'uncertain' };
  });
}

function parseArgs(argv) {
  const a = { checker: DEFAULT_CHECKER };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--urls') a.urls = argv[++i];
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
    else if (argv[i] === '--checker') a.checker = argv[++i];
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!a.urls || !a.outDir) throw new Error('usage: h1-liveness.mjs --urls <h1-urls.txt> --out-dir <dir> [--checker <path>]');
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const urls = readUrls(fs.readFileSync(a.urls, 'utf8'));
  if (!urls.length) throw new Error(`${a.urls} lists no URLs`);
  if (!fs.existsSync(a.checker)) throw new Error(`liveness checker not found: ${a.checker}`);
  const started = new Date();
  const run = spawnSync(process.execPath, [a.checker, '--file', path.resolve(a.urls)], { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (run.error) throw run.error;
  const verdicts = parseCheckerOutput(run.stdout, urls);
  fs.mkdirSync(a.outDir, { recursive: true });
  fs.writeFileSync(path.join(a.outDir, 'h1-liveness.stdout.txt'), run.stdout + (run.stderr ? `\n[stderr]\n${run.stderr}` : ''));
  const count = (k) => verdicts.filter((v) => v.recorded_as === k).length;
  const record = {
    _about: 'Gate H1, machine half. result/reason: record (printed by the repository liveness checker, saved word for word in h1-liveness.stdout.txt). recorded_as: the verdict this file uses; a missing or duplicated verdict is recorded as uncertain (fail closed). A person still confirms each posting (right company, the job itself is shown) before H1 clears.',
    checker: displayPath(a.checker, REPO),
    checker_sha256: sha256File(a.checker),
    started_at: started.toISOString(),
    finished_at: new Date().toISOString(),
    checker_exit_code: run.status,
    urls_file: path.basename(a.urls),
    summary: { checked: verdicts.length, active: count('active'), expired: count('expired'), uncertain: count('uncertain') },
    verdicts,
  };
  fs.writeFileSync(path.join(a.outDir, 'h1-liveness.json'), JSON.stringify(record, null, 2) + '\n');
  for (const v of verdicts) console.log(`${v.recorded_as.padEnd(9)} ${v.url}${v.reason ? `  (${v.reason})` : ''}`);
  console.log(`\nH1 machine half: ${record.summary.active} active, ${record.summary.expired} expired, ${record.summary.uncertain} uncertain (checker exit ${run.status}). A person confirms each before H1 clears.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (err) { console.error(`h1-liveness: ${err.message}`); process.exit(2); }
}
