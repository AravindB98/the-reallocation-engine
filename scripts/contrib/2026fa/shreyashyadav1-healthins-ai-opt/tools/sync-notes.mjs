#!/usr/bin/env node
// Does a snapshot still carry the same board list as the portals file it was made from? And, when only a board's
// free-text `note` was reworded afterwards, copy the new note into the snapshot WITHOUT re-running the network ingest.
//
// ingest.mjs copies each board's `note` from the portals file into the snapshot verbatim, so this makes the same copy.
// It compares name, provider, careers_url, csv_company, bucket and note; it writes only notes, and refuses to write if
// anything else differs (a changed board list needs a real re-ingest). --check reports and writes nothing (exit 1 on a
// difference).
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sync-notes.mjs <portals.yml> <snapshot.json> [--check]
import fs from 'node:fs';
import yaml from 'js-yaml';

const [portalsPath, snapPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const check = process.argv.includes('--check');
if (!portalsPath || !snapPath) { console.error('usage: sync-notes.mjs <portals.yml> <snapshot.json> [--check]'); process.exit(2); }

const portals = yaml.load(fs.readFileSync(portalsPath, 'utf8')).tracked_companies.filter((c) => c.enabled !== false);
const raw = fs.readFileSync(snapPath, 'utf8');
const snap = JSON.parse(raw);
const boards = snap.boards;

const other = [];   // differences that a note copy cannot fix
const noteDiffs = []; // [name, old, new]
if (portals.length !== boards.length) other.push(`board count: portals ${portals.length}, snapshot ${boards.length}`);
boards.forEach((b, i) => {
  const p = portals[i];
  if (!p) return;
  const same = [['name', p.name, b.name], ['provider', p.provider, b.provider], ['careers_url', p.careers_url, b.careers_url],
    ['csv_company', p.csv_company, b.csv_company_claimed], ['bucket', p.bucket, b.bucket]];
  for (const [field, a, c] of same) if (a !== c) other.push(`board ${i + 1} (${b.name}): ${field} differs: portals ${JSON.stringify(a)}, snapshot ${JSON.stringify(c)}`);
  const want = p.note ?? null;
  if (want !== (b.note ?? null)) noteDiffs.push([b.name, b.note ?? null, want]);
});

console.log(`${boards.length} boards in the snapshot, ${portals.length} enabled in the portals file`);
for (const o of other) console.log(`DIFFERENT (cannot be fixed by copying notes): ${o}`);
for (const [name, from, to] of noteDiffs) console.log(`note differs: ${name}\n  snapshot: ${JSON.stringify(from)}\n  portals:  ${JSON.stringify(to)}`);

if (other.length) { console.log('refusing: the board list differs in more than notes; re-run ingest.mjs'); process.exit(1); }
if (!noteDiffs.length) { console.log('identical: every board matches on name, provider, careers_url, csv_company, bucket and note'); process.exit(0); }
if (check) { console.log(`${noteDiffs.length} note(s) differ (--check: nothing written)`); process.exit(1); }

const roundTrip = JSON.stringify(snap, null, 2) + '\n';
if (roundTrip !== raw) { console.log('refusing: the snapshot file is not in the exact format ingest.mjs writes, so a rewrite would change more than notes'); process.exit(1); }
noteDiffs.forEach(([name, , to]) => { boards.find((b) => b.name === name).note = to; });
fs.writeFileSync(snapPath, JSON.stringify(snap, null, 2) + '\n');
console.log(`wrote ${noteDiffs.length} note(s) into ${snapPath}; nothing else changed`);
