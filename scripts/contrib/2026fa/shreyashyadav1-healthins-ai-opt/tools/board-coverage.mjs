#!/usr/bin/env node
// Offline. Which boards in the portals file were found by the discovery probe, and which were added by name?
// Reads the probe's output (tools/discover-boards.mjs; a transcript file works too, lines that are not
// "<gh|lv|ab> <slug> <openings>" are ignored) and the portals file, and matches on provider and board slug.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/board-coverage.mjs <probe-output.txt> [portals.yml]
//
// This says how a board was FOUND, not that it belongs to the company it is named for; nothing in this repository checks that.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { boardSlug } from '../ingest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const probePath = process.argv[2];
if (!probePath) { console.error('usage: board-coverage.mjs <probe-output.txt> [portals.yml]'); process.exit(2); }
const portalsPath = path.resolve(process.argv[3] || path.join(HERE, '../inputs/portals.healthins.yml'));
const code = { greenhouse: 'gh', lever: 'lv', ashby: 'ab' };

const hits = new Set();
for (const line of fs.readFileSync(probePath, 'utf8').split('\n')) {
  const m = line.trim().match(/^(gh|lv|ab) (\S+) (\d+)$/);
  if (m) hits.add(`${m[1]} ${m[2]}`);
}
const boards = yaml.load(fs.readFileSync(portalsPath, 'utf8')).tracked_companies.filter((c) => c.enabled !== false);
const found = [], byName = [];
for (const b of boards) (hits.has(`${code[b.provider]} ${boardSlug(b)}`) ? found : byName).push(b.name);

console.log(`${hits.size} boards answered in the probe output; ${boards.length} boards in the portals file`);
console.log(`found by the probe (${found.length}): ${found.join(', ')}`);
console.log(`not in the probe output, added by name (${byName.length}): ${byName.join(', ')}`);
const used = new Set(boards.map((b) => `${code[b.provider]} ${boardSlug(b)}`));
console.log(`answered in the probe but not used (${[...hits].filter((h) => !used.has(h)).length}): ${[...hits].filter((h) => !used.has(h)).sort().join(', ')}`);
