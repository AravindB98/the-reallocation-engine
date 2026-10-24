#!/usr/bin/env node
// extract-oflc.mjs — raw OFLC All-Industries export → compact, committable extract.
// Keeps every area that has at least one county in --states, and every SOC whose code
// starts with one of --soc-prefixes. Copies values verbatim (hourly, as published);
// annual figures are computed later, never stored, so the extract can be diffed against
// the source row by row.
//
//   node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs
//   node .../extract-oflc.mjs --wage-year 2026-27 --states MA,NH --soc-prefixes 15-,17-
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { csvObjects, toCsv } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const WY = opt('--wage-year', '2026-27');
const STATES = new Set(opt('--states', 'MA,NH').split(',').map(s => s.trim().toUpperCase()));
const PREFIXES = opt('--soc-prefixes', '15-,17-').split(',').map(s => s.trim());
const RAW = path.join('data/dol/oflc/raw', WY);
const OUT_DIR = 'data/dol/oflc/compact';
const tag = `${[...STATES].join('-').toLowerCase()}-soc${PREFIXES.map(p => p.replace('-', '')).join('-')}`;
const OUT = path.join(OUT_DIR, `alc-${WY}-${tag}.csv`);

for (const f of ['ALC_Export.csv', 'Geography.csv', 'fetch.json']) {
  if (!fs.existsSync(path.join(RAW, f))) {
    console.error(`missing ${path.join(RAW, f)} — run fetch-oflc.sh ${WY} first`);
    process.exit(2);
  }
}
const fetchMeta = JSON.parse(fs.readFileSync(path.join(RAW, 'fetch.json'), 'utf8'));
const geo = csvObjects(fs.readFileSync(path.join(RAW, 'Geography.csv'), 'utf8'));
const alcText = fs.readFileSync(path.join(RAW, 'ALC_Export.csv'), 'utf8');
const sha = crypto.createHash('sha256').update(alcText).digest('hex');
if (fetchMeta.sha256?.['ALC_Export.csv'] && fetchMeta.sha256['ALC_Export.csv'] !== sha) {
  console.error('ALC_Export.csv sha256 differs from fetch.json — file changed after fetch');
  process.exit(2);
}
const alc = csvObjects(alcText);
const need = ['Area', 'SocCode', 'GeoLvl', 'Level1', 'Level2', 'Level3', 'Level4', 'Average', 'Label'];
const missingCols = need.filter(c => !(c in (alc[0] || {})));
if (missingCols.length) { console.error(`ALC_Export.csv missing columns: ${missingCols.join(', ')} — schema drift`); process.exit(2); }

const areaName = new Map();
const keepAreas = new Set();
for (const g of geo) {
  areaName.set(g.Area, g.AreaName);
  if (STATES.has(g.StateAb)) keepAreas.add(g.Area);
}
const out = [];
for (const r of alc) {
  if (!keepAreas.has(r.Area) || !PREFIXES.some(p => r.SocCode.startsWith(p))) continue;
  out.push({
    area: r.Area, area_name: areaName.get(r.Area) || '', soc: r.SocCode, geo_lvl: r.GeoLvl,
    level1_hourly: r.Level1, level2_hourly: r.Level2, level3_hourly: r.Level3, level4_hourly: r.Level4,
    average_hourly: r.Average, label: r.Label,
  });
}
out.sort((a, b) => a.area.localeCompare(b.area) || a.soc.localeCompare(b.soc));
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, toCsv(out, Object.keys(out[0])));
const prov = {
  extract: OUT,
  made_by: 'scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs',
  made_at: new Date().toISOString(),
  source: fetchMeta,
  filter: { states: [...STATES], soc_prefixes: PREFIXES },
  rows_in: alc.length, rows_out: out.length, areas_out: new Set(out.map(r => r.area)).size,
  values: 'hourly, copied verbatim from ALC_Export.csv (All Industries, non-ACWIA)',
};
fs.writeFileSync(OUT.replace(/\.csv$/, '.provenance.json'), JSON.stringify(prov, null, 2) + '\n');
console.log(`ALC_Export.csv rows in: ${alc.length} (sha256 ${sha.slice(0, 16)}…)`);
console.log(`areas with a county in ${[...STATES].join('/')}: ${keepAreas.size}`);
console.log(`rows out: ${out.length} across ${prov.areas_out} areas, SOC prefixes ${PREFIXES.join(' ')}`);
console.log(`wrote ${OUT} (+ .provenance.json)`);
