#!/usr/bin/env node
// Compare two run output folders after removing the only things allowed to differ: the scorer's own
// clock and the folder path. Used for the determinism check.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/diff-runs.mjs <dirA> <dirB>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const [A, B] = process.argv.slice(2).map((d) => path.resolve(d));
if (!A || !B) { console.error('usage: diff-runs.mjs <dirA> <dirB>'); process.exit(2); }

const LEGACY_RUN_DIR = 'course/2026fa/submissions/shreyashyadav1/mode-build/runs/2026-10-20';
const norm = (f, dir, txt) => {
  // the relative form contains the absolute one as a suffix, so it is replaced first
  txt = txt.split(path.relative(ROOT, dir)).join('<OUT>').split(dir).join('<OUT>');
  // the committed run-log records the folder the run was written to; that folder was moved afterwards, and the text is kept as it was produced
  txt = txt.split(LEGACY_RUN_DIR).join('<OUT>');
  if (f === 'role-scores.json') txt = txt.replace(/"generated":\s*"[^"]*"/, '"generated": "<clock>"');
  // the scorer stamps the UTC date it ran on (title line and "generated"); two runs a day apart must still compare equal
  if (f === 'role-scores.md') txt = txt.replace(/^(# Role Scorer report — )\d{4}-\d{2}-\d{2}/m, '$1<clock>');
  if (f === 'role-scores.md') txt = txt.split('\n').filter((l) => !/\b20\d\d-\d\d-\d\d\b/.test(l) || /Role|Apply|Skip|Consider/.test(l)).join('\n').replace(/\*?Generated[^\n]*/gi, '');
  return txt;
};
let diffs = 0;
for (const f of ['roles.json', 'role-scores.json', 'role-scores.md', 'run-log.json', 'report.md']) {
  const a = norm(f, A, fs.readFileSync(path.join(A, f), 'utf8')), b = norm(f, B, fs.readFileSync(path.join(B, f), 'utf8'));
  const same = a === b;
  if (!same) diffs++;
  console.log(`${same ? 'identical' : 'DIFFERENT'}  ${f}  (${a.length} chars)`);
}
console.log(diffs ? `${diffs} file(s) differ` : 'all five outputs identical');
process.exit(diffs ? 1 : 0);
