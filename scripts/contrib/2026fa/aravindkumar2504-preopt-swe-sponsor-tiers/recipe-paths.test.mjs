// recipe-paths.test.mjs: every repository path the recipe, its card, and the README name must exist,
// unless the line carrying it is a typed TODO. The assignment grades "every path exists or is a typed TODO".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const DOCS = [
  'recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md',
  'recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.card.md',
  'scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/README.md',
];
const ROOTS = ['scripts', 'data', 'search', 'recipes', 'logs', 'book', 'docs', 'course', 'reports', 'private'];
// Paths the READER creates in the untracked layers when using their own data. They are named in the
// card's example command on purpose and must never exist in the repository.
const READER_CREATED = new Set(['search/profile.yml', 'private/tiers-run']);

function candidates(text) {
  const found = [];
  const lines = text.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) { inFence = !inFence; continue; }
    if (line.includes('[TODO')) continue; // a typed TODO may name a path that does not exist yet
    const tokens = inFence ? line.split(/\s+/) : [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    for (const raw of tokens) {
      const t = raw.replace(/[.,;:)]+$/, '');
      if (!t.includes('/') || /[\s<>]/.test(t) || t.startsWith('--') || t.startsWith('/') || t.startsWith('http')) continue;
      if (!ROOTS.includes(t.split('/')[0]) || READER_CREATED.has(t)) continue;
      found.push(t);
    }
  }
  return [...new Set(found)];
}

function exists(rel) {
  if (rel.includes('*')) {
    const dir = path.join(REPO, path.dirname(rel));
    if (!fs.existsSync(dir)) return false;
    const re = new RegExp(`^${path.basename(rel).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    return fs.readdirSync(dir).some((f) => re.test(f));
  }
  return fs.existsSync(path.join(REPO, rel));
}

for (const doc of DOCS) {
  test(`every repository path named in ${path.basename(doc)} exists`, () => {
    const text = fs.readFileSync(path.join(REPO, doc), 'utf8');
    const paths = candidates(text);
    assert.ok(paths.length > 3, 'the document should name some paths');
    const missing = paths.filter((p) => !exists(p));
    assert.deepEqual(missing, [], `missing paths: ${missing.join(', ')}`);
  });
}

test('the recipe declares as many open TODOs as its body contains', () => {
  const text = fs.readFileSync(path.join(REPO, DOCS[0]), 'utf8');
  const declared = Number(/^todos_open:\s*(\d+)/m.exec(text)[1]);
  assert.equal((text.match(/\[TODO/g) || []).length, declared);
});

test('the recipe claims no stage above RUNNABLE-SAMPLE and leaves the attestation null', () => {
  const text = fs.readFileSync(path.join(REPO, DOCS[0]), 'utf8');
  assert.match(text, /^status: RUNNABLE-SAMPLE$/m);
  assert.match(text, /^attestation: null$/m);
});

test('the reader-created example paths are never tracked by git (they may exist untracked on a reader\'s machine)', (t) => {
  if (!fs.existsSync(path.join(REPO, '.git'))) { t.skip('not a git checkout (for example, an unpacked ZIP)'); return; }
  for (const p of READER_CREATED) {
    const tracked = execFileSync('git', ['ls-files', '--', p], { cwd: REPO, encoding: 'utf8' }).trim();
    assert.equal(tracked, '', `${p} must never be committed`);
  }
});
