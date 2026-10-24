// cli.mjs — command-line plumbing shared by capture.mjs and evaluate.mjs:
// argument parsing, repo-relative paths, hashing, the output namespace guard,
// and redaction of local paths. No rules live here (those are in live-lib.mjs).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = fs.realpathSync(path.resolve(HERE, '../../../..'));
export const NAMESPACE = path.join(REPO, 'assignments/submissions/bagwe-shubham1727');
export const RECIPE = 'recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md';
export const VERSION = '0.1.0';

// Paths outside the repo are recorded by file name only: a committed log must not
// carry someone's home directory or username.
export function rel(p) {
  const r = path.relative(REPO, p);
  return r.startsWith('..') || path.isAbsolute(r) ? `<outside-repo>/${path.basename(p)}` : (r || '.');
}

// Same idea for free text (scorer stdout/stderr, error messages).
export function redact(text) {
  return String(text ?? '').split(REPO).join('<repo>').split(encodeURI(REPO)).join('<repo>').split(os.homedir()).join('<home>');
}

export const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const inside = (p, dir) => p === dir || p.startsWith(dir + path.sep);
export function die(code, msg) { console.error(`✗ ${redact(msg)}`); process.exit(code); }

export function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) die(2, `unexpected argument "${k}"`);
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) die(2, `${k} needs a value`);
    a[k.slice(2)] = v; i++;
  }
  return a;
}

// Outputs go to this mode's namespace or outside the repo, never over a tracked file.
export function guardOutDir(outDir) {
  if (inside(outDir, REPO) && !inside(outDir, NAMESPACE))
    die(2, `refusing to write to ${rel(outDir)}: outputs must stay under ${rel(NAMESPACE)}/ or outside the repo`);
}

export const readJson = (p, what) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return die(2, `${what} does not parse: ${e.message}`); } };

// G1a: the latest decision per board from the append-only decisions file. A
// confirmed or rejected entry counts only with a name and a date on it.
export function latestBoardDecisions(doc) {
  const latest = new Map();
  for (const d of doc?.decisions ?? []) if (d?.board) latest.set(d.board, d);
  return latest;
}
