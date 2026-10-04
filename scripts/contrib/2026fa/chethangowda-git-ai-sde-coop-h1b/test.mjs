#!/usr/bin/env node
// test.mjs — offline test for triage.mjs. No network: fixture CSV + fixture
// candidates, outputs to a temp dir. Also runs the unmodified scorer on a
// BROKEN-* fixture to show why the pre-scorer gate exists.
//
//   node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const FX = path.join(HERE, 'fixtures');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-test-'));

let pass = 0; let fail = 0;
const check = (name, cond, got) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${got === undefined ? '' : ` — got ${JSON.stringify(got)}`}`); }
};

// 1. triage on fixtures
const run = spawnSync(process.execPath, [path.join(HERE, 'triage.mjs'),
  '--candidates', path.join(FX, 'candidates.fixture.json'),
  '--csv', path.join(FX, 'sponsorship.fixture.csv'),
  '--out', tmp], { cwd: ROOT, encoding: 'utf8' });
check('triage exits 0', run.status === 0, run.stderr.split('\n').find((l) => /Error/.test(l)));
if (run.status !== 0) { console.log(`\n${pass}/${pass + fail} checks passed (triage failed; remaining checks not run)`); process.exit(1); }
const log = JSON.parse(fs.readFileSync(path.join(tmp, 'triage-log.json'), 'utf8'));
const stop = Object.fromEntries(log.stopped.map((s) => [s.role_id, s.reason]));

console.log('failure case 1: company missing from the CSV');
check('missing-company stopped as no-company-match', stop['missing-company'] === 'no-company-match', stop['missing-company']);
check('blank-record stopped as no-sponsorship-record (blank not read as 0)', stop['blank-record'] === 'no-sponsorship-record', stop['blank-record']);

console.log('failure case 2: missing gate value');
check('missing-liveness stopped', stop['missing-liveness'] === 'missing-gate-value: liveness', stop['missing-liveness']);
check('missing-timeline stopped', stop['missing-timeline'] === 'missing-gate-value: timeline', stop['missing-timeline']);

console.log('stopped roles never reach the scorer');
for (const sc of log.scenarios) {
  const sent = JSON.parse(fs.readFileSync(path.join(ROOT, sc.roles_json), 'utf8')).map((r) => r.role_id);
  check(`[${sc.id}] scorer input = only proven-coop, likely-ft`, JSON.stringify(sent.sort()) === '["likely-ft","proven-coop"]', sent);
}

console.log('two timeline scenarios');
const dec = (sc, id) => log.scenarios.find((s) => s.id === sc).results.find((r) => r.role_id === id).recommendation;
check('co-op role: Apply on co-op path', dec('coop-path', 'proven-coop') === 'Apply', dec('coop-path', 'proven-coop'));
check('co-op role: Skip on no-co-op path', dec('no-coop-path', 'proven-coop') === 'Skip', dec('no-coop-path', 'proven-coop'));
check('Likely tier (p 0.6) → Consider', dec('coop-path', 'likely-ft') === 'Consider', dec('coop-path', 'likely-ft'));

console.log('labels');
const e = log.evidence.find((x) => x.role_id === 'proven-coop');
check('sponsorship counts labeled record', e.sponsorship_record.label === 'record');
check('tier → p labeled your-input', e.sponsorship_tier.label === 'your-input');
check('SOC labeled model-judgment', e.soc.label === 'model-judgment');
check('co-op conversion not verified', e.coop_conversion.value === null && e.coop_conversion.label === 'not-verified');
check('no phone/officer/board columns in log', !/phone|executive_officers|board_directors/.test(JSON.stringify(log.evidence)));

console.log('BROKEN fixture: missing gates sent straight to the unmodified scorer');
const bdir = path.join(tmp, 'broken');
const b = spawnSync(process.execPath, [path.join(ROOT, 'scripts/score/role-scorer.mjs'), path.join(FX, 'BROKEN-missing-gate-sent-to-scorer.json'), '--out-dir', bdir], { cwd: ROOT, encoding: 'utf8' });
const broken = JSON.parse(fs.readFileSync(path.join(bdir, 'role-scores.json'), 'utf8')).roles[0];
check('scorer treats missing gates as open (multipliers 1 × 1) — the hazard G2 guards', broken.trace.gate_product === 1, broken.trace.gate_product);
console.log(`       scorer said: ${broken.recommendation} (${broken.arithmetic ?? broken.trace.arithmetic})`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);
