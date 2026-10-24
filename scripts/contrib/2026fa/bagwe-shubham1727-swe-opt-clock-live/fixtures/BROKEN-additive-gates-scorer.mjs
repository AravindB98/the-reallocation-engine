#!/usr/bin/env node
// BROKEN-additive-gates-scorer.mjs: a DELIBERATELY WRONG scorer for break tests only.
// It adds the gates instead of multiplying them, so a closed posting or an
// impossible start date can still come out "Apply". evaluate.mjs's G4 check must
// halt on it. Unlike the sample-mode mutant next door, it tolerates a missing vote:
// live mode sends gate-closed jobs to the scorer without a fit rating.
// Never used for a real decision. CONTRIBUTING.md: mutant scorers live in fixtures/ as BROKEN-*.
import fs from 'node:fs';
import path from 'node:path';
const [src] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outDir = process.argv[process.argv.indexOf('--out-dir') + 1];
const roles = JSON.parse(fs.readFileSync(src, 'utf8')).map((r) => {
  const votes = 0.35 * (r.sponsorship?.p ?? 0) + 0.30 * (r.fit?.p ?? 0);
  const composite = votes + 0.2 * (r.liveness.factor + r.timeline.factor); // the bug: + instead of ×
  const rec = composite >= 0.3 ? 'Apply' : 'Skip';
  return { role_id: r.role_id, composite, recommendation: rec, machine_recommendation: rec,
    trace: { votes: [], gates: [{ factor: 'liveness', source: r.liveness.source }, { factor: 'timeline', source: r.timeline.source }] } };
});
fs.writeFileSync(path.join(outDir, 'role-scores.json'), JSON.stringify({ _scorer: 'bayesian-role-scorer', profile_needs_sponsorship: true, roles }, null, 2));
fs.writeFileSync(path.join(outDir, 'role-scores.md'), '# BROKEN scorer output\n');
console.log(`✓ scored ${roles.length} roles (BROKEN additive gates)`);
