#!/usr/bin/env node
// How many sponsors does a sector filter on SEC industry codes drop? Counts the Proven and Likely sponsors
// (lib.mjs's tier rule) inside and outside the persona's four industry codes, then how many of the ones
// outside have a health or insurance word in the company NAME (a rule, printed below; names are a hint, not a record).
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sector-gap.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, sponsorshipEvidence } from '../lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const persona = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json'), 'utf8'));
const rows = parseCsv(fs.readFileSync(path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'), 'utf8'));
const WORDS = /\b(health|healthcare|care|medical|medicine|clinic|clinical|insurance|insurtech|pharma|pharmaceuticals|therapeutics|biotech|dental|wellness|patient|hospital|diagnostics?|surgical|assurance)\b/i;
console.log(`name rule (a hint, not a record): ${WORDS}`);
const sponsors = rows.map((r) => ({ r, s: sponsorshipEvidence(r, 'csv') })).filter((x) => x.s.tier === 'Proven' || x.s.tier === 'Likely');
const inSector = sponsors.filter((x) => persona.sector_industries.includes(x.r.industry));
const outside = sponsors.filter((x) => !persona.sector_industries.includes(x.r.industry));
const hinted = outside.filter((x) => WORDS.test(x.r.company_name));
console.log(`Proven + Likely sponsors in the whole CSV: ${sponsors.length}`);
console.log(`  inside the four sector codes (${persona.sector_industries.join(', ')}): ${inSector.length}`);
console.log(`  outside them: ${outside.length}; of those, name suggests health or insurance: ${hinted.length}`);
const by = {};
for (const x of hinted) by[x.r.industry] = (by[x.r.industry] || 0) + 1;
console.log(`  those ${hinted.length} are filed as: ${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log('  highest approvals among them:');
for (const x of hinted.sort((a, b) => Number(b.r['Total Approvals']) - Number(a.r['Total Approvals'])).slice(0, 8))
  console.log(`    ${x.r.company_name} | ${x.r.industry} | ${x.s.tier} | approvals ${x.r['Total Approvals']} | ${x.r.state}`);
