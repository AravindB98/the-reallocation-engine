#!/usr/bin/env node
// Export the in-sector sponsors (Proven and Likely tiers under lib.mjs's rule) from the 80 Days CSV as a small
// CSV, the input the repo's own detector takes:
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/export-sponsors.mjs output/healthins-verify/sponsors-in-sector.csv
//   (cd scripts/ats && python3 detect-ats.py --csv ../../output/healthins-verify/sponsors-in-sector.csv --company-column company_name --output ../../output/healthins-verify/ats_detection_healthins.csv)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, sponsorshipEvidence } from '../lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const out = process.argv[2];
if (!out) { console.error('usage: export-sponsors.mjs <out.csv>'); process.exit(2); }
const persona = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json'), 'utf8'));
const rows = parseCsv(fs.readFileSync(path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'), 'utf8'));
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const lines = [['company_name', 'tier', 'industry', 'state', 'approvals', 'approval_rate', 'website'].join(',')];
for (const r of rows.filter((x) => persona.sector_industries.includes(x.industry))) {
  const s = sponsorshipEvidence(r, 'csv');
  if (s.tier === 'Proven' || s.tier === 'Likely') lines.push([r.company_name, s.tier, r.industry, r.state, r['Total Approvals'], Math.round(Number(r.Approval_Rate)), r.website].map(q).join(','));
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`wrote ${lines.length - 1} sponsor rows to ${out}`);
