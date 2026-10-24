#!/usr/bin/env node
// BROKEN-additive-gates-scorer.mjs: a DELIBERATELY WRONG scorer for break tests only.
// It adds the gates instead of multiplying them, so a dead posting or an impossible
// start date can still come out "Apply". The swe-opt-clock G4 check must halt on it.
// Never used for a real decision. CONTRIBUTING.md: mutant scorers live in fixtures/ as BROKEN-*.
import fs from 'node:fs';
import path from 'node:path';
const [src] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outDir = process.argv[process.argv.indexOf('--out-dir') + 1];
const roles = JSON.parse(fs.readFileSync(src, 'utf8')).map((r) => {
  const votes = 0.35 * r.sponsorship.p + 0.30 * r.fit.p;
  const composite = votes + 0.1 * (r.liveness.factor + r.timeline.factor); // the bug: + instead of ×
  const rec = composite >= 0.3 ? 'Apply' : 'Skip';
  return { role_id: r.role_id, composite, recommendation: rec, machine_recommendation: rec,
    trace: { votes: [{ factor: 'sponsorship', source: r.sponsorship.source }, { factor: 'fit', source: r.fit.source }],
      gates: [{ factor: 'liveness', source: r.liveness.source }, { factor: 'timeline', source: r.timeline.source }] } };
});
fs.writeFileSync(path.join(outDir, 'role-scores.json'), JSON.stringify({ _scorer: 'bayesian-role-scorer', profile_needs_sponsorship: true, roles }, null, 2));
console.log(`BROKEN scorer: ${roles.length} roles`);
