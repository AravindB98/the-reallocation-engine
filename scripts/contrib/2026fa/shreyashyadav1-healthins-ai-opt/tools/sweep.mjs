#!/usr/bin/env node
// Sensitivity sweeps: move ONE persona number and show how far the decisions move.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sweep.mjs process-days [84,143,144,150,171,172,173]
//       the persona's "midsize" hiring-loop estimate, through run.mjs on the committed real snapshot (offline)
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sweep.mjs years [3,2,1]
//       persona.max_years_experience_ok, through ingest.mjs on the real boards (network, no browser)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '../../../../..');
const RUN_DIR = path.join(ROOT, 'assignments/submissions/shreyashyadav1/runs/2026-10-20');
const persona = () => JSON.parse(fs.readFileSync(path.join(DIR, 'inputs/persona.example.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'healthins-sweep-'));
const [mode, list] = process.argv.slice(2);
const values = (list || '').split(',').filter(Boolean).map(Number);

if (mode === 'process-days') {
  const days = values.length ? values : [84, 143, 144, 150, 171, 172, 173];
  console.log('predicted by the break-even in the report: full score to 143 days · starts to fall at 144 · the scorer treats the gate as closed from 172 · factor 0 at 173');
  console.log(`${'midsize days'.padEnd(13)}${'Omada timeline'.padEnd(34)}${'Consider'.padEnd(10)}Skip`);
  for (const d of days) {
    const p = persona(); p.process_days_by_bucket.midsize = d;
    const pf = path.join(tmp, `persona-${d}.json`); fs.writeFileSync(pf, JSON.stringify(p));
    const out = path.join(tmp, `out-${d}`);
    const r = spawnSync(process.execPath, [path.join(DIR, 'run.mjs'), '--today', '2026-10-20', '--candidates', path.join(RUN_DIR, 'candidates.snapshot.json'), '--persona', pf, '--out-dir', out], { encoding: 'utf8' });
    if (r.status !== 0) { console.log(`${d}: run failed: ${r.stderr}`); continue; }
    const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
    const o = log.roles.find((x) => x.company === 'Omada Health' && !x.excluded);
    console.log(`${String(d).padEnd(13)}${`${o.timeline.factor.toFixed(3)} ${o.timeline.band}`.padEnd(34)}${String(log.summary.Consider).padEnd(10)}${log.summary.Skip}`);
  }
} else if (mode === 'years') {
  for (const y of values.length ? values : [3, 2, 1]) {
    const p = persona(); p.max_years_experience_ok = y;
    const pf = path.join(tmp, `persona-y${y}.json`); fs.writeFileSync(pf, JSON.stringify(p));
    const r = spawnSync(process.execPath, [path.join(DIR, 'ingest.mjs'), '--persona', pf, '--no-liveness', '--out', path.join(tmp, `snap-y${y}.json`), '--raw-dir', path.join(tmp, 'raw')], { encoding: 'utf8' });
    const line = (r.stdout.split('\n').find((l) => /posting text fetched/.test(l)) || r.stderr).trim();
    console.log(`tolerance ${y} years: ${line}`);
  }
} else {
  console.error('usage: sweep.mjs process-days [values] | years [values]');
  process.exit(2);
}
