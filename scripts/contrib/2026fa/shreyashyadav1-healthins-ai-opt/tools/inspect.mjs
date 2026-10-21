#!/usr/bin/env node
// Read-only displays of run output, so the verification transcripts stay short.
//
//   node .../tools/inspect.mjs boards   <snapshot.json>          per board: entity gate result and website corroboration
//   node .../tools/inspect.mjs roles    <run-dir>                roles that reached a gate: tier, blocked, flags
//   node .../tools/inspect.mjs summary  <run-dir>                counts, blocked reasons, data horizon, funding labels
//   node .../tools/inspect.mjs compare  <dirA> <dirB> <company>  one company's gated roles in two runs
//   node .../tools/inspect.mjs scorer   <dir>                    the scorer's own first result in a folder
//   node .../tools/inspect.mjs snapshots <snapA.json> <snapB.json>   offers and surviving roles in two ingest runs
import fs from 'node:fs';
import path from 'node:path';

const [mode, a, b, c] = process.argv.slice(2);
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const log = (dir) => json(path.join(dir, 'run-log.json'));
const gated = (l) => l.roles.filter((r) => !r.excluded);

if (mode === 'boards') {
  for (const x of json(a).boards) {
    const e = x.entity;
    const bits = x.status === 'failed' ? `FAILED: ${x.error}`
      : `entity ${e.status}${e.csv_company ? ` -> ${e.csv_company} (${e.industry.value}, site ${e.website})` : ''}${e.corroboration ? ` | corroboration: ${e.corroboration.status} (board "${e.corroboration.slug}" vs CSV site "${e.corroboration.host}")` : ''}`;
    console.log(`  board "${x.name}": ${bits}`);
  }
} else if (mode === 'roles') {
  const l = log(a);
  console.log(`  roles that reached a gate: ${gated(l).length}`);
  for (const r of gated(l)) console.log(`    ${r.company} | ${r.title} | tier ${r.sponsorship.tier} | ${r.decision.recommendation} | blocked ${JSON.stringify(r.blocked)} | flags: ${(r.flags || []).join('; ').slice(0, 160)}`);
} else if (mode === 'summary') {
  const l = log(a), g = gated(l);
  console.log(`  role-scores.json written: ${fs.existsSync(path.join(a, 'role-scores.json'))}`);
  console.log(`  summary: ${JSON.stringify(l.summary)}`);
  console.log(`  blocked reasons: ${JSON.stringify(l.coverage.blocked_reasons)}`);
  console.log(`  data horizon: ${l.data_horizon.date} (${l.data_horizon.months_before_today} months before this run)`);
  console.log(`  funding labels on the gated roles: ${JSON.stringify(g.reduce((m, r) => ((m[r.funding.recency] = (m[r.funding.recency] || 0) + 1), m), {}))}`);
  const first = g.find((r) => r.blocked);
  if (first) console.log(`  example: ${first.company} | ${first.blocked.join(', ')} | liveness age ${first.liveness.age_days} days (limit ${first.liveness.max_age_days})`);
} else if (mode === 'compare') {
  for (const [name, dir] of [['A', a], ['B', b]]) {
    for (const r of gated(log(dir)).filter((x) => x.company === c)) console.log(`  ${name} ${r.title}: ${r.decision.recommendation.padEnd(8)} composite ${r.decision.composite}  liveness factor ${r.liveness.factor} (${r.liveness.source})  next: ${r.next_action.block}`);
  }
  const rb = gated(log(b)).find((x) => x.company === c);
  console.log(`  reason in B: ${rb.decision.reason.slice(0, 140)}`);
} else if (mode === 'snapshots') {
  const [x, y] = [json(a), json(b)];
  const ids = (s) => s.roles.filter((r) => !r.pre_excluded).map((r) => r.role_id).sort();
  console.log(`  offers on the boards: ${x._meta.fetched_on} run ${x.funnel.offers_found} · other run ${y.funnel.offers_found} (difference ${x.funnel.offers_found - y.funnel.offers_found})`);
  console.log(`  surviving roles: ${ids(x).length} vs ${ids(y).length} · identical set: ${JSON.stringify(ids(x)) === JSON.stringify(ids(y))}`);
} else if (mode === 'scorer') {
  const r = json(path.join(a, 'role-scores.json')).roles[0];
  console.log(`  -> ${r.recommendation} ${r.composite} | ${r.trace.arithmetic} | ${r.reason}`);
} else {
  console.error('usage: inspect.mjs boards|roles|summary|compare|scorer|snapshots ...');
  process.exit(2);
}
