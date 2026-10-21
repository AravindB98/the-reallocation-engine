#!/usr/bin/env node
// title-audit.mjs — whole-file audit of design-lane titles in the 80 Days CSV and
// of the BLS/O*NET rows this mode reads. An AUDIT (SNICKERDOODLE verification stack,
// layer 2): it counts and surfaces; it does not say pass.
//
//   node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs \
//     [--csv f.csv] [--bls f.csv] [--state MA] [--out-dir dir]
//
// Writes design-title-audit.json (agent) + design-title-audit.md (human). No network.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, parseTitleList, classifyTitle, FAMILY_SOC } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(REPO, p) || '.';
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
function die(m) { console.error(`✗ ${m}`); process.exit(2); }

const csvPath = path.resolve(arg('--csv') || path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'));
const blsPath = path.resolve(arg('--bls') || path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'));
const state = (arg('--state') || 'MA').toUpperCase();
const outDir = path.resolve(arg('--out-dir') || path.join(REPO, 'course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live'));
// realpath the nearest existing ancestor (macOS /var → /private/var) before the namespace check
const outReal = (() => { let h = outDir; const t = []; while (!fs.existsSync(h)) { t.unshift(path.basename(h)); h = path.dirname(h); } return path.join(fs.realpathSync(h), ...t); })();
const allowed = [path.join(REPO, 'course/2026fa/submissions/o7580'), path.join(HERE), fs.realpathSync(os.tmpdir())];
// inside the repo only this contributor's namespaces, even if the repo sits under the temp dir
const repoReal = fs.realpathSync(REPO);
const under = (a) => outReal === a || outReal.startsWith(a + path.sep);
const okOut = under(repoReal) ? ['course/2026fa/submissions/o7580', path.relative(REPO, HERE)].some((p) => under(path.join(repoReal, p))) : under(fs.realpathSync(os.tmpdir()));
if (!okOut) die(`out-dir must sit under ${allowed.map(rel).join(' or ')}`);
for (const p of [csvPath, blsPath]) if (!fs.existsSync(p)) die(`not found: ${p}`);

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
if (!rows.length || !('top_job_titles_sponsored' in rows[0]) || !('Total Approvals' in rows[0])) die('CSV lacks the 80 Days columns');
const sponsors = rows.filter((r) => String(r['Total Approvals']).trim() !== '');
const NAIVE = /design/i; // what a keyword filter would do

const titleFamily = {};             // family → count of title instances across sponsor rows
const naiveFamily = {};             // family breakdown of titles a naive /design/ filter returns
const naiveRows = new Set();
const laneSponsors = { 'ux-design': { at: [], above: [] }, 'hybrid-design-engineering': { at: [], above: [] }, 'ui-engineering': { at: [], above: [] } };
for (const r of sponsors) {
  const titles = parseTitleList(r.top_job_titles_sponsored);
  const fams = {};
  for (const t of titles) {
    const c = classifyTitle(t);
    titleFamily[c.family] = (titleFamily[c.family] || 0) + 1;
    if (NAIVE.test(t)) { naiveFamily[c.family] = (naiveFamily[c.family] || 0) + 1; naiveRows.add(r.company_name); }
    if (laneSponsors[c.family]) (fams[c.family] ||= []).push(c);
  }
  for (const [f, cs] of Object.entries(fams)) {
    const rec = { company: r.company_name, state: (r.state || '').toUpperCase(), approvals: Number(r['Total Approvals']) };
    if (cs.some((c) => !c.above_level)) laneSponsors[f].at.push(rec); else laneSponsors[f].above.push(rec);
  }
}
const summarize = (f) => {
  const { at, above } = laneSponsors[f];
  const proven = at.filter((x) => x.approvals >= 3);
  return {
    sponsors_with_family_title: at.length + above.length,
    at_level: at.length, at_level_approvals_ge_3: proven.length, senior_only: above.length,
    [`in_${state}`]: {
      sponsors_with_family_title: at.filter((x) => x.state === state).length + above.filter((x) => x.state === state).length,
      at_level_approvals_ge_3: proven.filter((x) => x.state === state).map((x) => `${x.company} (${x.approvals})`),
      at_level_thin: at.filter((x) => x.state === state && x.approvals < 3).map((x) => `${x.company} (${x.approvals})`),
      senior_only: above.filter((x) => x.state === state).map((x) => `${x.company} (${x.approvals})`),
    },
  };
};
const naiveTotal = Object.values(naiveFamily).reduce((a, b) => a + b, 0);
const naiveOut = Object.entries(naiveFamily).filter(([f]) => FAMILY_SOC[f]?.lane !== 'in').reduce((a, [, n]) => a + n, 0);

const bls = parseCsv(fs.readFileSync(blsPath, 'utf8'));
const blankPivot = bls.filter((r) => r.cognitive_pivot_score === '');
const watch = ['15-1252.00', '15-1254.00', '15-1255.00', '15-1255.01', '27-1021.00', '27-1024.00'];
const blsWatch = watch.map((c) => {
  const r = bls.find((x) => x.onet_soc_code === c);
  return r ? { onet_soc_code: c, title: r.title, annual_median_wage: Number(r.annual_median_wage) || null, cognitive_pivot_score: r.cognitive_pivot_score === '' ? null : Number(r.cognitive_pivot_score), alternate_titles_sample: r.alternate_titles_sample } : { onet_soc_code: c, missing: 'no-soc-row' };
});
const altOverlap = (() => {
  const a = (c) => new Set(String(bls.find((x) => x.onet_soc_code === c)?.alternate_titles_sample || '').split(';').map((s) => s.trim()).filter(Boolean));
  const x = a('15-1254.00'), y = a('15-1255.00');
  return [...x].filter((t) => y.has(t));
})();

const audit = {
  audit: 'design-title-audit', generated_at: new Date().toISOString(),
  inputs: { csv: rel(csvPath), csv_rows: rows.length, bls: rel(blsPath), bls_rows: bls.length, state },
  sponsor_rows: sponsors.length, blank_approval_rows: rows.length - sponsors.length,
  naive_design_filter: { titles_matched: naiveTotal, companies_matched: naiveRows.size, by_family: naiveFamily, out_of_lane_titles: naiveOut },
  title_instances_by_family: titleFamily,
  lane: { 'ux-design': summarize('ux-design'), 'hybrid-design-engineering': summarize('hybrid-design-engineering'), 'ui-engineering': summarize('ui-engineering') },
  bls: { blank_cognitive_pivot_rows: blankPivot.length, watched: blsWatch, alternate_title_sample_overlap_15_1254_vs_15_1255: altOverlap },
  caveat: 'Counts are over the truncated top_job_titles_sponsored lists, not over all petitions. Family assignment is by fixed title rules (lib.mjs) and has known misclassifications listed in the recipe.',
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'design-title-audit.json'), JSON.stringify(audit, null, 2) + '\n');

const L = audit.lane, ux = L['ux-design'], k = `in_${state}`;
const md = [];
md.push('# Design-title audit — what the sponsorship file says about design-lane jobs');
md.push('');
md.push('## Executive summary');
md.push('');
md.push(`**What this is.** A count, over the whole visa-sponsorship company file, of how design and front-end job titles appear, plus a check of the government occupation rows this mode reads. **Why read it.** It shows how misleading a simple "design" keyword search is, and how rarely junior design roles appear among sponsored titles. **What it found.** Of the ${naiveTotal} sponsored job titles that contain the word "design", ${naiveOut} are not software-interface design at all (hardware, mechanical, chip, architecture, graphic, management or unclassifiable titles). ${ux.at_level_approvals_ge_3} employers nationally list a junior-or-mid-level UX/product-design title with at least three approvals; in ${state} the number is ${ux[k].at_level_approvals_ge_3.length}. The occupation code most UX jobs belong to has no AI-resilience score in the shipped data.`);
md.push('');
md.push('## Findings');
md.push('');
md.push('| Measure | Count |');
md.push('|---|---:|');
md.push(`| Company rows in the file | ${rows.length} |`);
md.push(`| …with an H-1B approvals value | ${sponsors.length} |`);
md.push(`| Sponsored titles containing "design" (naive filter) | ${naiveTotal} (at ${naiveRows.size} companies) |`);
md.push(`| …of which out of a design-engineer lane | ${naiveOut} |`);
for (const [f, n] of Object.entries(naiveFamily).sort((a, b) => b[1] - a[1])) md.push(`| &nbsp;&nbsp;"design" titles classified ${f} | ${n} |`);
for (const f of ['ux-design', 'hybrid-design-engineering', 'ui-engineering']) {
  const s = L[f];
  md.push(`| Sponsors listing a ${f} title | ${s.sponsors_with_family_title} (at level ${s.at_level}, ≥3 approvals ${s.at_level_approvals_ge_3}; senior-only ${s.senior_only}) |`);
  md.push(`| …in ${state}: at level with ≥3 approvals | ${s[k].at_level_approvals_ge_3.length}${s[k].at_level_approvals_ge_3.length ? ` — ${s[k].at_level_approvals_ge_3.join('; ')}` : ''} |`);
  md.push(`| …in ${state}: at level, thin record (<3) | ${s[k].at_level_thin.length}${s[k].at_level_thin.length ? ` — ${s[k].at_level_thin.join('; ')}` : ''} |`);
  md.push(`| …in ${state}: senior-only | ${s[k].senior_only.length}${s[k].senior_only.length ? ` — ${s[k].senior_only.join('; ')}` : ''} |`);
}
md.push(`| BLS/O*NET rows with a blank Cognitive Pivot score | ${blankPivot.length} of ${bls.length} |`);
md.push('');
md.push('## Occupation rows this mode reads');
md.push('');
md.push('| O*NET-SOC | Title | National median | Cognitive Pivot |');
md.push('|---|---|---:|---:|');
for (const b of blsWatch) md.push(`| ${b.onet_soc_code} | ${b.title ?? b.missing} | ${b.annual_median_wage ? `$${b.annual_median_wage.toLocaleString('en-US')}` : '—'} | ${b.cognitive_pivot_score ?? '**blank**'} |`);
md.push('');
md.push(`Alternate-title samples shared by 15-1254.00 and 15-1255.00 (the shipped 8-title samples only): ${altOverlap.join('; ') || 'none'}.`);
md.push('');
md.push('## Run record');
md.push('');
md.push(`- Inputs: \`${rel(csvPath)}\` (${rows.length} rows), \`${rel(blsPath)}\` (${bls.length} rows); state = ${state}`);
md.push(`- Command: \`node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs --state ${state}\``);
md.push(`- Caveat: ${audit.caveat}`);
fs.writeFileSync(path.join(outDir, 'design-title-audit.md'), md.join('\n') + '\n');
console.log(`✓ design-title audit — ${sponsors.length} sponsor rows; naive "design" titles ${naiveTotal} (${naiveOut} out of lane); ux-design at-level ≥3: ${ux.at_level_approvals_ge_3} national, ${ux[k].at_level_approvals_ge_3.length} in ${state}; blank pivot rows ${blankPivot.length}`);
console.log(`  wrote ${rel(path.join(outDir, 'design-title-audit.md'))} + .json`);
