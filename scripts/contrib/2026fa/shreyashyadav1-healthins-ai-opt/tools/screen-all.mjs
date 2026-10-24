#!/usr/bin/env node
// A measurement, not part of the mode: run jd-screen over EVERY posting's text on every board in the portals
// file (not only the survivors), print the totals and read every requirement hit. Network: the same public
// board APIs ingest.mjs uses.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/screen-all.mjs [portals.yml]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { fetchDescriptions } from '../ingest.mjs';
import { screenPosting } from '../jd-screen.mjs';
import { makeHttpCtx } from '../../../../ats/providers/_http.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const portalsPath = path.resolve(process.argv[2] || path.join(HERE, '../inputs/portals.healthins.yml'));
const portals = yaml.load(fs.readFileSync(portalsPath, 'utf8'));
const ctx = makeHttpCtx();
const tally = { boards: 0, boards_failed: 0, postings: 0, too_short: 0, requirement: 0, citizenship: 0, clearance: 0, us_person: 0, e_verify: 0, e_verify_negated: 0, no_sponsor: 0, authorized: 0, years_found: 0, new_grads: 0 };
const hits = [], nosp = [], years = {};
for (const e of portals.tracked_companies.filter((x) => x.enabled !== false)) {
  tally.boards++;
  let m;
  try { m = await fetchDescriptions(e, ctx); } catch (err) { tally.boards_failed++; console.log(`  board failed: ${e.name}: ${err.message}`); continue; }
  for (const [url, text] of m) {
    tally.postings++;
    const r = screenPosting(text);
    if (r.status === 'missing') { tally.too_short++; continue; }
    if (r.requirement_found) {
      tally.requirement++;
      const which = ['citizenship_required', 'clearance_required', 'us_person_required'].filter((k) => r[k].found);
      hits.push({ board: e.name, which: which.join('+'), snip: r[which[0]].snippet });
    }
    if (r.citizenship_required.found) tally.citizenship++;
    if (r.clearance_required.found) tally.clearance++;
    if (r.us_person_required.found) tally.us_person++;
    if (r.e_verify_mentioned.found) { tally.e_verify++; if (r.e_verify_mentioned.negated) tally.e_verify_negated++; }
    if (r.no_sponsorship_statement.found) { tally.no_sponsor++; nosp.push({ board: e.name, snip: r.no_sponsorship_statement.snippet }); }
    if (r.authorized_to_work_statement.found) tally.authorized++;
    if (r.min_years_experience.found) { tally.years_found++; const k = r.min_years_experience.value; years[k] = (years[k] || 0) + 1; }
    if (r.invites_new_grads.found) tally.new_grads++;
  }
}
console.log(JSON.stringify(tally));
console.log('min-years histogram (strictest hard minimum per posting):', JSON.stringify(years));
console.log(`\n== requirement hits (${hits.length}), every one read ==`);
for (const h of hits) console.log(`  [${h.which}] ${h.board}: ${h.snip}`);
console.log(`\n== no-sponsorship wording (${nosp.length}), first 12 ==`);
for (const n of nosp.slice(0, 12)) console.log(`  ${n.board}: ${n.snip}`);
