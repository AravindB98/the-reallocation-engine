#!/usr/bin/env node
// Regression: do v0.1.0's two sample scenarios still give the decisions committed with the v0.1.0 submission?
// Scenario 1 should. Scenario 2 is EXPECTED to differ: its liveness checks were hand-dated 2026-10-02 but the run is
// dated 2027-02-20, and v0.2.0 refuses liveness evidence older than persona.liveness_max_age_days.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/regression-v01.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '../../../../..');
const OLD = path.join(ROOT, 'course/2026fa/submissions/shreyashyadav1/runs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'healthins-regress-'));
const scenarios = [
  { name: 'scenario 1 (--today 2026-10-03)', args: ['--today', '2026-10-03'], old: '2026-10-03' },
  { name: 'scenario 2 (--today 2027-02-20, after-EAD persona)', args: ['--today', '2027-02-20', '--persona', path.join(DIR, 'inputs/persona.after-ead.example.json')], old: '2027-02-20' },
];
for (const sc of scenarios) {
  const out = path.join(tmp, sc.old);
  const r = spawnSync(process.execPath, [path.join(DIR, 'run.mjs'), ...sc.args, '--out-dir', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.log(`${sc.name}: run failed\n${r.stderr}`); continue; }
  const a = JSON.parse(fs.readFileSync(path.join(OLD, sc.old, 'run-log.json'), 'utf8'));
  const b = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
  let diff = 0;
  const rows = a.roles.map((x) => {
    const y = b.roles.find((q) => q.role_id === x.role_id);
    const same = y && y.decision.recommendation === x.decision.recommendation && y.decision.composite === x.decision.composite;
    if (!same) diff++;
    return `  ${same ? 'same' : 'DIFF'}  ${x.role_id}: v0.1.0 ${x.decision.recommendation} ${x.decision.composite} | now ${y.decision.recommendation} ${y.decision.composite}${y.blocked ? ` (${y.blocked.join(', ')}${y.liveness?.age_days ? `, liveness ${y.liveness.age_days} days old` : ''})` : ''}`;
  });
  console.log(`## ${sc.name}: decisions that differ from the committed v0.1.0 run: ${diff} of ${a.roles.length}`);
  console.log(`   v0.1.0 summary ${JSON.stringify(a.summary)} · now ${JSON.stringify(b.summary)}`);
  rows.forEach((l) => console.log(l));
}
