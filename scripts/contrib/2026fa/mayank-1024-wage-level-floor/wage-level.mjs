#!/usr/bin/env node
// wage-level.mjs — offline classifier for the wage-level-floor mode.
// Reads: a pay snapshot (fetch-pay-ranges.mjs), the compact OFLC extract (extract-oflc.mjs),
// the 80 Days sponsor CSV, and a persona. Writes: wage-level.log.json (agent) and
// wage-level.report.md (person). Never fetches, never invents a wage, never ranks offers.
//
//   node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs \
//     --snapshot <run>/pay-snapshot.json --out-dir <run>
//   [--persona private/my-wage-persona.json] [--oflc data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv]
//
// Exit codes: 0 ok · 2 input/schema error (nothing written) · 3 timeline error (nothing written)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  csvObjects, indexOflc, levelFor, bandFor, areasFor, timelineGate, normalizeCompany,
  LOTTERY, LEVEL_NAMES,
} from './lib.mjs';

const RECIPE = 'recipes/cases/2026fa/mayank-1024-wage-level-floor.md';
const VERSION = '0.1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const die = (code, msg) => { console.error(`wage-level: ${msg}`); process.exit(code); };

const P = {
  persona: opt('--persona', path.join(HERE, 'persona.example.json')),
  snapshot: opt('--snapshot', null),
  oflc: opt('--oflc', path.join(ROOT, 'data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv')),
  csv: opt('--csv', path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv')),
  outDir: opt('--out-dir', null),
};
if (!P.snapshot || !P.outDir) die(2, 'usage: wage-level.mjs --snapshot <pay-snapshot.json> --out-dir <dir> [--persona p.json]');

// Output only where nothing private can leak into a tracked file by accident.
const allowedOut = [
  path.join(ROOT, 'course/2026fa/submissions/mayank-1024/mode-build/runs'),
  path.join(ROOT, 'private'), os.tmpdir(), fs.realpathSync(os.tmpdir()), '/tmp', '/private/tmp',
];
const outAbs = path.resolve(P.outDir);
if (!allowedOut.some(a => outAbs === a || outAbs.startsWith(a + path.sep)))
  die(2, `refusing --out-dir ${P.outDir}: use the submission runs/ folder, private/, or a temp dir`);

const readJson = (p, what) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(2, `${what} unreadable: ${p} (${e.message})`); } };
const persona = readJson(P.persona, 'persona');
const snap = readJson(P.snapshot, 'snapshot');
for (const p of [P.oflc, P.csv]) if (!fs.existsSync(p)) die(2, `missing input ${p}`);

// ---- G1 timeline (before anything is written) -----------------------------------------
const tl = timelineGate(persona);
if (tl.state === 'error') die(3, `timeline gate: ${tl.reason} — nothing written`);

// ---- inputs ---------------------------------------------------------------------------
const oflcRows = csvObjects(fs.readFileSync(P.oflc, 'utf8'));
const needOflc = ['area', 'area_name', 'soc', 'geo_lvl', 'level1_hourly', 'level2_hourly', 'level3_hourly', 'level4_hourly'];
const missOflc = needOflc.filter(c => !(c in (oflcRows[0] || {})));
if (missOflc.length) die(2, `OFLC extract missing columns ${missOflc.join(', ')} — schema drift`);
const oflc = indexOflc(oflcRows);
const oflcProv = fs.existsSync(P.oflc.replace(/\.csv$/, '.provenance.json')) ? readJson(P.oflc.replace(/\.csv$/, '.provenance.json'), 'oflc provenance') : null;

const csvText = fs.readFileSync(P.csv, 'utf8');
const sponsors = csvObjects(csvText);
const needCsv = ['company_name', 'state', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered'];
const missCsv = needCsv.filter(c => !(c in (sponsors[0] || {})));
if (missCsv.length) die(2, `80 Days CSV missing columns ${missCsv.join(', ')} — schema drift`);
const sponsorBy = new Map();
for (const r of sponsors) {
  const k = normalizeCompany(r.company_name);
  if (!sponsorBy.has(k)) sponsorBy.set(k, []);
  sponsorBy.get(k).push(r);
}

const SOC = persona.soc?.primary;
const SENS = persona.soc?.sensitivity || [];
const HOME = persona.home_area;
const TARGET_AREAS = new Set(persona.target_areas || [HOME]);
const primaryRec = oflc.get(`${HOME}|${SOC}`);
if (!primaryRec) die(2, `no OFLC row for home area ${HOME} × SOC ${SOC} in ${P.oflc}`);
const titleRe = new RegExp(persona.target?.title_pattern || '.', 'i');
const exclRe = persona.target?.exclude_title_pattern ? new RegExp(persona.target.exclude_title_pattern, 'i') : null;
const capExempt = new Set((persona.cap_exempt_companies || []).map(normalizeCompany));
const offers = new Map((persona.offers || []).map(o => [String(o.posting_id), o]));

const ev = (value, source, from) => ({ value, source, from });

// ---- per-posting --------------------------------------------------------------------
const funnel = { boards: snap.boards.length, boards_ok: 0, engineering_postings: 0, title_match: 0, title_excluded: 0, in_target_area: 0, classified: 0, stopped: 0 };
const results = [];
const stopCounts = {};
const stop = (base, reason, detail) => { stopCounts[reason] = (stopCounts[reason] || 0) + 1; funnel.stopped++; results.push({ ...base, status: 'stopped', stop_reason: reason, stop_detail: detail || null }); };

for (const b of snap.boards) {
  if (b.status !== 'ok') continue;
  funnel.boards_ok++;
  for (const p of b.postings) {
    funnel.engineering_postings++;
    if (!titleRe.test(p.title)) continue;
    if (exclRe && exclRe.test(p.title)) { funnel.title_excluded++; continue; }
    funnel.title_match++;
    const loc = areasFor(p.location, persona.location_map || {}, HOME);
    const inTarget = loc.hits.filter(h => TARGET_AREAS.has(h.area));
    if (!inTarget.length) continue; // outside the person's geography: not this mode's question
    funnel.in_target_area++;
    // A named city beats "Remote". "Remote" alone means home only when nothing else in the
    // string names a place: "Remote, Canada" / "Lahore, Pakistan; Remote" are not Boston.
    const named = inTarget.filter(h => !h.via_home);
    const pickHit = named[0] || inTarget[0];
    const area = pickHit.area;
    const base = {
      company: b.csv_company, ats: b.ats, board_identity_confirmed: b.identity_confirmed,
      posting_id: p.id, title: p.title, url: p.url,
      location: ev(p.location, 'record', `${b.ats} board API, ${snap.captured_at}`),
      worksite_area: ev(area, 'your-input', `location_map["${pickHit.matched}"]${pickHit.via_home ? ' → home_area' : ''}`),
      other_location_parts: loc.unmapped,
    };
    if (!named.length && loc.unmapped.length) { stop(base, 'remote-scope-unclear', `remote alongside ${loc.unmapped.join(', ')}`); continue; }

    // pay evidence: structured beats text; never merged
    const usd = p.pay_structured.filter(r => !r.currency || r.currency === 'USD');
    let kind = null, ranges = [];
    if (usd.length) { kind = 'ats-structured'; ranges = usd; }
    else if (p.pay_structured.length) { stop(base, 'non-usd-only', p.pay_structured.map(r => r.currency).join(',')); continue; }
    else if (p.pay_text.length) { kind = 'posting-text'; ranges = p.pay_text.map(t => ({ min: t.min, max: t.max, label: null, interval: null, snippet: t.snippet })); }
    else { stop(base, 'no-pay-range'); continue; }

    const distinct = [...new Map(ranges.map(r => [`${r.min}|${r.max}`, r])).values()];
    let chosen = distinct[0];
    if (distinct.length > 1) {
      const pick = persona.zone_choice?.[b.csv_company];
      const z = pick && distinct.find(r => r.label === pick);
      if (!z) { stop(base, kind === 'posting-text' ? 'multiple-text-ranges' : 'zone-ambiguous', distinct.map(r => `${r.label || '?'} ${r.min}-${r.max}`).join(' | ')); continue; }
      chosen = z;
    }
    const unitWord = `${chosen.label || ''} ${chosen.interval || ''} ${chosen.snippet || ''}`;
    if (/hour|week|month|daily|per day/i.test(unitWord) && !/1 YEAR/.test(chosen.interval || '')) { stop(base, 'non-annual-unit', chosen.label || chosen.interval || 'text'); continue; }
    if (chosen.min < 10000) { stop(base, 'non-annual-unit', `min ${chosen.min} < 10000`); continue; }
    const unit = chosen.interval === '1 YEAR' ? ev('annual', 'record', 'ATS interval field') : ev('annual', 'inferred', 'no unit field; label has no hourly/weekly word; min ≥ $10,000');

    const rec = oflc.get(`${area}|${SOC}`);
    if (!rec) { stop(base, 'no-oflc-row', `${area} × ${SOC}`); continue; }
    const band = bandFor(chosen.min, chosen.max, rec);
    const sensitivity = SENS.map(s => {
      const r = oflc.get(`${area}|${s}`);
      if (!r) return { soc: s, status: 'no-oflc-row' };
      const bb = bandFor(chosen.min, chosen.max, r);
      return { soc: s, level_min: bb.level_min, level_max: bb.level_max, kind: bb.kind };
    });
    const exempt = capExempt.has(normalizeCompany(b.csv_company));
    const offer = offers.get(p.id);
    const offerLevel = offer ? levelFor(Number(offer.base_salary), rec.annual) : null;
    const entries = l => (exempt ? 'cap-exempt' : tl.state === 'closed' ? null : l === 0 ? 'level-I-group-only-with-alternate-wage-source' : LOTTERY.entries[l]);
    funnel.classified++;
    results.push({
      ...base, status: 'classified',
      pay: ev({ min: chosen.min, max: chosen.max, label: chosen.label || null }, kind === 'ats-structured' ? 'record' : 'record-text', kind === 'ats-structured' ? `${b.ats} pay field` : `regex on description: "${(chosen.snippet || '').slice(0, 120)}"`),
      pay_unit: unit,
      soc: ev(SOC, 'your-input', 'persona.soc.primary — the employer chooses the SOC on the LCA'),
      oflc: ev({ area: rec.area, area_name: rec.area_name, geo_lvl: rec.geo_lvl, annual: rec.annual, hourly: rec.hourly }, 'record', `OFLC ALC ${oflcProv?.source?.wage_year || '?'}`),
      band: ev(band, 'rule', 'highest OFLC level the wage meets or exceeds (90 FR 60864)'),
      entries_at_min: ev(entries(band.level_min), 'rule', 'IV=4, III=3, II=2, I=1'),
      entries_at_max: ev(entries(band.level_max), 'rule', 'IV=4, III=3, II=2, I=1'),
      geo_lvl_flag: rec.geo_lvl !== '1' ? 'GeoLvl ≠ 1 — meaning not documented in the release notes; a person checks this row' : null,
      soc_sensitivity: sensitivity,
      offer: offer ? ev({ base_salary: Number(offer.base_salary), level: offerLevel.level, gap_to_next: offerLevel.gap_to_next }, 'your-input', 'persona.offers') : null,
    });
  }
}

// ---- sponsor context (record, never used in a band) ------------------------------------
const companies = [...new Set(results.map(r => r.company))].sort();
const sponsorContext = companies.map(c => {
  const rows = sponsorBy.get(normalizeCompany(c)) || [];
  if (!rows.length) return { company: c, status: 'not-in-80-days-csv' };
  const r = rows[0];
  const med = Number(r.median_salary_offered);
  const lvl = Number.isFinite(med) && med > 0 ? levelFor(med, primaryRec.annual).level : null;
  return {
    company: c, status: rows.length > 1 ? 'multiple-csv-rows-first-used' : 'ok',
    approvals: ev(Number(r['Total Approvals']), 'record', '80 Days CSV (raw count; every count in this CSV is even — possible double-count)'),
    denials: ev(Number(r['Total Denials']), 'record', '80 Days CSV'),
    approval_rate: ev(r.Approval_Rate, 'record', '80 Days CSV'),
    median_salary_offered: ev(Number.isFinite(med) ? med : null, 'record', '80 Days CSV — company-wide across ALL sponsored titles; year not stated'),
    median_vs_home_soc_level: ev(lvl, 'rule', `context only: the company median placed on ${SOC} @ ${HOME} thresholds; not a level for any posting`),
  };
});

// ---- summary --------------------------------------------------------------------------
const classified = results.filter(r => r.status === 'classified');
const byKind = {};
for (const r of classified) byKind[r.band.value.kind] = (byKind[r.band.value.kind] || 0) + 1;
const textCount = classified.filter(r => r.pay.source === 'record-text').length;
const socShift = classified.filter(r => r.soc_sensitivity.some(s => s.level_min !== undefined && (s.level_min !== r.band.value.level_min || s.level_max !== r.band.value.level_max))).length;
const log = {
  recipe: RECIPE, recipe_version: VERSION, run_at: new Date().toISOString(),
  mode: 'offline-snapshot', model_judgment_values: 0,
  inputs: {
    persona: path.relative(ROOT, path.resolve(P.persona)), persona_id: persona.persona_id,
    snapshot: path.relative(ROOT, path.resolve(P.snapshot)), snapshot_captured_at: snap.captured_at,
    oflc_extract: path.relative(ROOT, path.resolve(P.oflc)), oflc_wage_year: oflcProv?.source?.wage_year || null,
    oflc_zip_sha256: oflcProv?.source?.sha256?.zip || null,
    csv: path.relative(ROOT, path.resolve(P.csv)), csv_sha256: crypto.createHash('sha256').update(csvText).digest('hex'),
  },
  timeline: tl,
  thresholds: { soc: SOC, area: HOME, area_name: primaryRec.area_name, annual: primaryRec.annual, hourly: primaryRec.hourly, hours_per_year: 2080 },
  lottery: LOTTERY,
  funnel, bands: byKind, stops: stopCounts, pay_text_classified: textCount, soc_sensitive_postings: socShift,
  gates_pending_human: [
    'G3 board identity — every board below has identity_confirmed=false',
    'G4 pay evidence — confirm each posting-text range is base pay for the worksite',
    'G5 SOC — ask which SOC the employer files this title under',
    'G6 liveness — npm run ats:liveness -- <url> before acting on any posting',
    'G7 offer — the proffered wage on the offer letter replaces the posted range',
  ],
  postings: results, sponsor_context: sponsorContext,
};

// ---- report ---------------------------------------------------------------------------
const $ = n => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
const L = n => LEVEL_NAMES[n];
const ent = v => (v == null ? 'n/a' : typeof v === 'number' ? String(v) : v === 'cap-exempt' ? 'cap-exempt' : 'I-group*');
const kinds = {
  'CLIFF-IN-RANGE': 'the range crosses a level line — the line is the number to negotiate to',
  'FLAT': 'the whole range sits in one level — negotiating inside it does not change the lottery weight',
  'FLOOR-BELOW-L1': 'the bottom of the range is under Level I for this occupation and area',
  'RANGE-BELOW-L1': 'the whole range is under Level I — either the employer files a different occupation code or uses a private wage survey',
};
const plain = {
  'CLIFF-IN-RANGE': 'cross a level line inside their range',
  'FLAT': 'sit on one level throughout',
  'FLOOR-BELOW-L1': 'start below Level I',
  'RANGE-BELOW-L1': 'sit entirely below Level I',
};
const pct = v => (Number.isFinite(Number(v)) && v !== '' ? `${Number(v).toFixed(1)}%` : '—');
const sorted = classified.slice().sort((a, b) => a.band.value.kind.localeCompare(b.band.value.kind) || a.company.localeCompare(b.company) || a.pay.value.min - b.pay.value.min);
const t = primaryRec.annual;
const md = [];
md.push(`# Wage-level floor — ${primaryRec.area_name}, ${SOC}`, '');
md.push('## Executive summary', '');
md.push(`**What this is.** A check of the engineering job postings on the public job boards of ${snap.boards.length} Massachusetts companies that have sponsored H-1B visas for software titles (${companies.length} had a matching posting in the person's area). Each range is placed against the Department of Labor's four official wage levels for the person's occupation and city. Since early 2026 those levels decide how many times an H-1B registration is entered in the lottery: Level I once, Level IV four times.`, '');
md.push(`**Why read it.** In the Boston area a software developer needs at least ${$(t[0])} to reach Level I, ${$(t[1])} for Level II, ${$(t[2])} for Level III and ${$(t[3])} for Level IV. A posting's range tells you, before you apply, whether an offer from it can carry one lottery entry or two — and exactly how many dollars separate the two. No job board shows this number.`, '');
md.push(`**What it found.** ${funnel.in_target_area} matching postings in the person's area; ${funnel.classified} could be placed on a level, ${funnel.stopped} could not (reasons below — the tool refuses rather than guesses). Of those placed: ${Object.entries(byKind).map(([k, v]) => `${v} ${plain[k]}`).join('; ')}. ${socShift} of ${funnel.classified} change level if the employer files a different occupation code, so the code is a question to ask the recruiter. ${tl.state === 'open' ? 'The next registration window falls inside the person\'s work authorization.' : tl.state === 'conditional' ? 'The next registration window falls after the person\'s current authorization ends — it only counts if a STEM extension is filed in time.' : 'No registration window falls inside the person\'s authorization, so lottery entries are not shown.'}`, '');
md.push('**What it does not decide.** It does not say whether to apply, whether the company will sponsor, or what you will be offered. The posted range is not the offer, the occupation code is the employer\'s choice, and the selection chances are the government\'s pre-rule projection, not measured results.', '');
md.push('## Timeline gate', '');
md.push(`| As of | Authorization ends | Days left | Next registration window (assumed) | Gate |`, `|---|---|---|---|---|`);
md.push(`| ${persona.as_of} | ${persona.visa.work_auth_end} | ${tl.days_left} | ${tl.window} | **${tl.state}**${tl.reason ? ` — ${tl.reason}` : ''} |`, '');
md.push(`## The four lines (${SOC}, ${primaryRec.area_name}, wage year ${oflcProv?.source?.wage_year || '?'})`, '');
md.push('| Level | Hourly (DOL) | Annual (×2080) | Lottery entries | DHS projected selection chance |', '|---|---|---|---|---|');
for (let k = 0; k < 4; k++) md.push(`| ${L(k + 1)} | $${primaryRec.hourly[k].toFixed(2)} | ${$(t[k])} | ${k + 1} | ${LOTTERY.dhs_projected_pct[k + 1]}% (projection) |`);
md.push('', `Below Level I there is no OEWS registration; an employer using a private wage survey registers in the Level I group. DHS projected ${LOTTERY.dhs_projected_baseline_pct}% for everyone under the old random lottery.`, '');
md.push('## Postings placed on a level', '');
md.push('| Band | Company | Title | Range | Source | Level min→max | Entries min→max | Line to cross | SOC changes it? |', '|---|---|---|---|---|---|---|---|---|');
for (const r of sorted) {
  const b = r.band.value;
  const shifts = r.soc_sensitivity.filter(s => s.level_min !== undefined && (s.level_min !== b.level_min || s.level_max !== b.level_max)).map(s => `${s.soc}: ${L(s.level_min)}→${L(s.level_max)}`);
  md.push(`| ${b.kind} | ${r.company} | [${r.title.replace(/\|/g, '/')}](${r.url}) | ${$(r.pay.value.min)}–${$(r.pay.value.max)} | ${r.pay.source === 'record' ? 'ATS field' : 'posting text'} | ${L(b.level_min)}→${L(b.level_max)} | ${ent(r.entries_at_min.value)}→${ent(r.entries_at_max.value)} | ${b.cliff ? $(b.cliff) : '—'} | ${shifts.length ? shifts.join('; ') : 'no'} |`);
}
md.push('', '*I-group: below Level I on OEWS data; registrable only in the Level I group if the employer uses an alternate wage source.', '');
md.push('What each band means:', '');
for (const [k, v] of Object.entries(kinds)) md.push(`- **${k}** — ${v}.`);
md.push('', '## Postings the tool refused to place', '');
md.push('| Reason | Count | What a person would have to supply |', '|---|---|---|');
const fix = {
  'no-pay-range': 'nothing to place; ask the recruiter for the range (Massachusetts requires one on request)',
  'zone-ambiguous': 'which pay zone the Boston worksite falls in (set zone_choice for that company)',
  'multiple-text-ranges': 'which of the dollar ranges in the text is the base pay for this worksite',
  'non-annual-unit': 'an annual figure — hourly/weekly ranges are not converted by this tool',
  'non-usd-only': 'a US-dollar range for a US worksite',
  'no-oflc-row': 'the OFLC row for this area and occupation',
  'remote-scope-unclear': 'whether "remote" includes working from your home area (the posting names another place)',
};
for (const [k, v] of Object.entries(stopCounts)) md.push(`| ${k} | ${v} | ${fix[k] || ''} |`);
md.push('', '## Sponsor context (record — not used to place any posting)', '');
md.push(`| Company | H-1B approvals (raw) | Denials | Approval rate | Median salary offered (all titles) | That median on the ${SOC} lines |`, '|---|---|---|---|---|---|');
for (const s of sponsorContext) {
  if (s.status === 'not-in-80-days-csv') { md.push(`| ${s.company} | not in CSV | | | | |`); continue; }
  md.push(`| ${s.company} | ${s.approvals.value} | ${s.denials.value} | ${pct(s.approval_rate.value)} | ${$(s.median_salary_offered.value)} | ${s.median_vs_home_soc_level.value == null ? '—' : L(s.median_vs_home_soc_level.value)} |`);
}
md.push('', 'The median mixes every title a company sponsored (scientists, product managers, engineers) and the CSV does not say which year it covers, so it is shown for context and never used to place a posting.', '');
md.push('## What a person still has to judge', '');
md.push('- **Board identity** — every board was found by guessing a URL from the company\'s website; none has been confirmed to belong to the company.');
md.push(`- **Pay evidence** — ${textCount} placed postings rely on a dollar range read out of the description text, not the ATS pay field. Open each and confirm it is base pay for this worksite.`);
md.push('- **Occupation code** — the employer picks it, and it must match the job\'s duties. Ask which code the role is filed under; the last column shows when the answer changes your level. A lower-paid code can *raise* the level of the same salary — that is not a lever to ask for; filing a code that does not fit the duties is the employer\'s legal risk and a reason a petition is questioned.');
md.push('- **Posting liveness** — a listing in the board feed is not proof the posting takes applications. Run the liveness check on any posting before you tailor an application.');
const elsewhere = classified.filter(r => r.other_location_parts.length);
if (elsewhere.length) md.push(`- **Worksite** — ${elsewhere.length} placed posting(s) also list places outside your map (${[...new Set(elsewhere.flatMap(r => r.other_location_parts))].join(', ')}). They were placed on your area; if you would actually work in several places, the lowest level among them is the one that counts.`);
md.push('- **The offer** — the registered level comes from the wage on the offer, not the posted range. Re-run with the offer once you have one.');
md.push('- **Two registrations** — if two employers register you in the same season, the government uses the lower of the two levels.', '');
md.push('## Verified vs inferred', '');
md.push('| Claim | Kind | From |', '|---|---|---|');
md.push(`| The four wage lines for ${SOC} in ${primaryRec.area_name} | record | DOL OFLC ALC export, wage year ${oflcProv?.source?.wage_year}, zip sha256 ${(oflcProv?.source?.sha256?.zip || '').slice(0, 16)}… |`);
md.push('| Annual = hourly × 2080 | rule | OFLC release notes ($115/hr = $239,200/yr) |');
md.push('| Entries per level; lowest level when several registrations / worksites | rule | 90 FR 60864 (final rule, 2025-12-29) |');
md.push('| Selection chances per level | **projection** | DHS estimate, 90 FR 60948 — made before any weighted lottery ran |');
md.push('| Posted ranges (ATS field) | record | board API at capture time |');
md.push('| Posted ranges (posting text) | record, weaker | regex on description — G4 |');
md.push('| Pay unit is annual when the ATS gives no unit | **inferred** | label wording + magnitude |');
md.push('| Worksite area for each posting | your-input | person\'s location map; remote → home area |');
md.push('| Occupation code | your-input | persona; the employer decides the real one |');
md.push('| Board belongs to the company | **not verified** | G3 |');
md.push('| Next registration window date | your-input assumption | USCIS has not announced it |', '');
md.push('## Run record', '');
md.push(`- Recipe: \`${RECIPE}\` v${VERSION} · run at ${log.run_at} · mode ${log.mode} · model judgments used: 0`);
md.push(`- Persona: \`${log.inputs.persona}\` (${persona.persona_id})`);
md.push(`- Snapshot: \`${log.inputs.snapshot}\` captured ${snap.captured_at}`);
md.push(`- OFLC extract: \`${log.inputs.oflc_extract}\` · 80 Days CSV sha256 ${log.inputs.csv_sha256.slice(0, 16)}…`);
md.push(`- Funnel: boards ${funnel.boards} (ok ${funnel.boards_ok}) → engineering postings ${funnel.engineering_postings} → title match ${funnel.title_match} (excluded ${funnel.title_excluded}) → in target area ${funnel.in_target_area} → placed ${funnel.classified} · refused ${funnel.stopped}`);

fs.mkdirSync(outAbs, { recursive: true });
fs.writeFileSync(path.join(outAbs, 'wage-level.log.json'), JSON.stringify(log, null, 1) + '\n');
fs.writeFileSync(path.join(outAbs, 'wage-level.report.md'), md.join('\n') + '\n');
console.log(`timeline: ${tl.state} (${tl.days_left} days left; window ${tl.window})`);
console.log(`thresholds ${SOC} @ ${primaryRec.area_name}: I ${$(t[0])} · II ${$(t[1])} · III ${$(t[2])} · IV ${$(t[3])}`);
console.log(`funnel: engineering ${funnel.engineering_postings} → title ${funnel.title_match} → area ${funnel.in_target_area} → placed ${funnel.classified} · refused ${funnel.stopped}`);
console.log(`bands: ${JSON.stringify(byKind)}  stops: ${JSON.stringify(stopCounts)}`);
console.log(`placed on posting text: ${textCount} · SOC-sensitive: ${socShift}/${funnel.classified}`);
console.log(`wrote ${path.relative(ROOT, outAbs)}/wage-level.{log.json,report.md}`);
