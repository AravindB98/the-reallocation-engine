#!/usr/bin/env node
// build-roles.mjs — turn triage evidence + real liveness results + the
// student's own fit inputs into a roles.json for the engine's scorer
// (scripts/score/role-scorer.mjs). It never invents a gate value:
//
//   - a role whose posting has no liveness record is REFUSED, not defaulted.
//     (The scorer treats a missing liveness field as 1.0 = live; this step
//     exists so that default is never reached.)
//   - an "uncertain" liveness result is refused (a gate, not a vote).
//   - a role with no fit input from the student is refused (no model guess).
//   - a role outside the commute set, or at an employer not in the triage, is refused.
//
// Usage:
//   node .../build-roles.mjs --triage <triage.json> --candidates <candidates.json> \
//     --liveness <ats-liveness-stdout.txt> --fit <fit.json> --soc <soc_occupation_compact.csv> \
//     --out <roles.json>
//
// candidates.json: [{ role_id, company, title, location, url, soc }]   (human-picked)
// fit.json:        { "<role_id>": { "p": 0..1, "note": "..." } }        (your-input)

import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib.mjs';

const halt = (m) => { console.error(`HALT: ${m}`); process.exit(2); };
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };
const need = ['triage', 'candidates', 'liveness', 'fit', 'soc', 'out'];
for (const k of need) if (!arg(k)) halt(`missing --${k}`);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { halt(`${p}: ${e.message}`); } };

const triage = readJson(arg('triage'));
const candidates = readJson(arg('candidates'));
const fit = readJson(arg('fit'));
const byCompany = new Map(triage.companies.map((c) => [c.company, c]));
const cities = triage.inputs.profile_values.commute_cities.map((c) => c.toUpperCase());

// parse check-liveness.mjs stdout: "<icon> <result> <url>"
const live = new Map();
for (const line of readFileSync(arg('liveness'), 'utf8').split('\n')) {
  const m = line.match(/\b(active|expired|uncertain)\s+(https?:\/\/\S+)/);
  if (m) live.set(m[2], m[1]);
}

// Cognitive Pivot layer: SOC → cognitive_pivot_score (O*NET 1–5 scale), record
const soc = new Map();
for (const r of parseCsv(readFileSync(arg('soc'), 'utf8')).records)
  if (r.onet_soc_code.endsWith('.00')) soc.set(r.bls_soc_code, { cps: Number(r.cognitive_pivot_score) || null, median: Number(r.annual_median_wage) || null, title: r.title });

const roles = [], refused = [];
for (const c of candidates) {
  const refuse = (why) => refused.push({ role_id: c.role_id, company: c.company, title: c.title, url: c.url, refused_because: why });
  const co = byCompany.get(c.company);
  if (!co) { refuse('employer not in triage output (no H-1B record in commute set)'); continue; }
  const loc = String(c.location || '').toUpperCase();
  if (!cities.some((city) => loc.includes(city))) { refuse(`location "${c.location}" not in declared commute set`); continue; }
  const lv = live.get(c.url);
  if (!lv) { refuse('no liveness record for this URL — gate cannot be defaulted open'); continue; }
  if (lv === 'uncertain') { refuse('liveness uncertain — human must open the posting and decide'); continue; }
  const f = fit[c.role_id];
  if (!f || typeof f.p !== 'number' || f.p < 0 || f.p > 1) { refuse('no fit input from the student (fit is your-input, never a model guess)'); continue; }
  const s = soc.get(c.soc);
  roles.push({
    role_id: c.role_id, company: c.company, title: c.title,
    sponsorship: { p: co.sponsorship_p, tier: co.sponsorship_tier, source: 'record' },
    fit: { p: f.p, source: 'your-input' },
    ...(s?.cps ? { role_quality: { p: Math.round((s.cps / 5) * 1000) / 1000, source: 'record' } } : {}),
    liveness: { factor: lv === 'active' ? 1.0 : 0.0, source: 'record' },
    timeline: { factor: co.timeline_factor, source: 'your-input' },
    _evidence: { url: c.url, location: c.location, liveness: lv, soc: c.soc, soc_assignment: 'rule: title→SOC by the student, not from an LCA', soc_title: s?.title ?? null, cognitive_pivot_score: s?.cps ?? null, soc_national_median: s?.median ?? null, h1b_raw: co.h1b, non_senior_swe_titles: co.titles.non_senior_swe, fit_note: f.note ?? null },
  });
}

// placeholder fit values are allowed to run (so the pipeline can be exercised)
// but the output is then explicitly NOT decision-grade.
const placeholders = roles.filter((r) => /placeholder/i.test(r._evidence.fit_note || '')).map((r) => r.role_id);
const decision_grade = placeholders.length === 0;
writeFileSync(arg('out'), JSON.stringify({ _built_by: 'revan1010-boston-swe-triage/build-roles.mjs', generated: new Date().toISOString(), decision_grade, fit_placeholders: placeholders, roles, refused }, null, 2));
console.log(`build-roles: ${candidates.length} candidates → ${roles.length} scorable · ${refused.length} refused`);
for (const r of refused) console.log(`  REFUSED ${r.role_id}: ${r.refused_because}`);
if (!decision_grade) console.log(`  WARNING: ${placeholders.length} role(s) use a placeholder fit value — scores are NOT decision-grade until the student supplies real fit judgments`);
console.log(`wrote ${arg('out')}`);
