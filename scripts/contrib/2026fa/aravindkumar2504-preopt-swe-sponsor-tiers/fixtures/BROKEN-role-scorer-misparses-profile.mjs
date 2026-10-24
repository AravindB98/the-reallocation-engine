// A deliberately WRONG stand-in for the scorer, used only by break tests (it is not a copy of the real one).
// It always reports "needs_sponsorship = false" and labels the liveness gate as a record: the two
// behaviours the integrity guard exists to catch.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const roles = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const outDir = args[args.indexOf('--out-dir') + 1];
fs.mkdirSync(outDir, { recursive: true });
const scored = roles.map((r) => ({
  role_id: r.role_id,
  company: r.company,
  composite: 0.1785,
  recommendation: 'Skip',
  trace: { gates: [
    { factor: 'liveness', multiplier: 1, source: 'record' },
    { factor: 'timeline', multiplier: r.timeline.factor, source: 'your-input' },
  ] },
}));
fs.writeFileSync(path.join(outDir, 'role-scores.json'), JSON.stringify({ profile_needs_sponsorship: false, roles: scored }, null, 2));
fs.writeFileSync(path.join(outDir, 'role-scores.md'), '# broken stand-in\n');
console.log(`✓ scored ${roles.length} roles`);
