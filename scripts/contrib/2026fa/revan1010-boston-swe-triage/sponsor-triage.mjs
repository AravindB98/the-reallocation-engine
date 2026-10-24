#!/usr/bin/env node
// sponsor-triage.mjs — Boston-area SWE sponsor triage for an F-1 MSIS student.
//
// Reads the 80 Days mapped CSV (SEC Form D companies with employer-level H-1B
// aggregates), keeps Massachusetts employers in the student's declared commute
// set, classifies their sponsored job titles (entry-level SWE vs senior-only),
// computes the OPT/STEM-OPT timeline gate, and writes:
//   <out-dir>/triage.json  — agent log (every field source-labelled)
//   <out-dir>/triage.md    — human report (executive summary first)
//
// Usage:
//   node scripts/contrib/2026fa/revan1010-boston-swe-triage/sponsor-triage.mjs \
//     --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
//     --profile scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json \
//     --out-dir output/revan1010-boston-swe [--top 25]
//
// Exit codes: 0 ok · 2 conformance halt (missing column, corrupt CSV, bad
// profile, timeline gate closed, empty result). No network. No model calls.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { RULES, REQUIRED_COLUMNS, parseCsv, present, num, parseTitles, classifyTitles, sponsorshipTier, timeline, d, monthsBetween } from './lib.mjs';

const halt = (msg) => { console.error(`HALT: ${msg}`); process.exit(2); };
const arg = (k, def) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : def; };

const csvPath = arg('csv'), profilePath = arg('profile'), outDir = arg('out-dir', 'output/revan1010-boston-swe');
const top = Number(arg('top', 25));
if (!csvPath || !profilePath) halt('usage: --csv <mapped.csv> --profile <profile.json> [--out-dir dir] [--top n]');

let profile;
try { profile = JSON.parse(readFileSync(profilePath, 'utf8')); } catch (e) { halt(`profile does not parse: ${e.message}`); }
for (const k of ['as_of', 'program_end', 'opt_start', 'stem_degree', 'commute_cities', 'state'])
  if (profile[k] === undefined) halt(`profile missing required field "${k}"`);
try { d(profile.as_of); d(profile.opt_start); d(profile.program_end); } catch (e) { halt(`profile ${e.message}`); }
// Post-completion OPT must start within RULES.opt_start_window_days after the
// program end date — an OPT start outside that window is an impossible input.
{
  const gap = (+d(profile.opt_start) - +d(profile.program_end)) / 864e5;
  if (gap < 0 || gap > RULES.opt_start_window_days)
    halt(`opt_start ${profile.opt_start} is ${Math.round(gap)} days after program_end ${profile.program_end}; post-completion OPT must start within ${RULES.opt_start_window_days} days of program end`);
}

const raw = readFileSync(csvPath);
let parsed;
try { parsed = parseCsv(raw.toString('utf8')); } catch (e) { halt(e.message); }
const missingCols = REQUIRED_COLUMNS.filter((c) => !parsed.header.includes(c));
if (missingCols.length) halt(`CSV missing required column(s): ${missingCols.join(', ')}`);
if (parsed.widthErrors) halt(`${parsed.widthErrors} row(s) have a different field count than the header`);

const rows = parsed.records;
const cities = new Set(profile.commute_cities.map((c) => c.trim().toUpperCase()));
const state = profile.state.trim().toUpperCase();
const asOf = d(profile.as_of);

// ── data-shape audit over the whole file (not just the slice we keep) ──
const h1bRows = rows.filter((r) => present(r['Total Approvals']));
const evenA = h1bRows.filter((r) => num(r['Total Approvals']) % 2 === 0).length;
const evenD = h1bRows.filter((r) => num(r['Total Denials']) % 2 === 0).length;
const parity = {
  h1b_rows: h1bRows.length, approvals_even: evenA, denials_even: evenD,
  suspected_double_count: h1bRows.length > 50 && evenA / h1bRows.length > 0.99 && evenD / h1bRows.length > 0.99,
  note: 'If ~all counts are even, the upstream join likely duplicated records; absolute counts may be ~2x. Approval RATE is unaffected by uniform doubling. Cause cannot be verified locally (raw LCA/USCIS tables absent).',
};

const inState = rows.filter((r) => r.state.trim().toUpperCase() === state);
const inStateH1b = inState.filter((r) => present(r['Total Approvals']));
const inCommute = inStateH1b.filter((r) => cities.has(r.city.trim().toUpperCase()));
const rejects = { zero_approvals: 0, non_numeric: 0, no_swe_title: 0 };

const companies = [];
for (const r of inCommute) {
  const approvals = num(r['Total Approvals']), denials = num(r['Total Denials']), rate = num(r['Approval_Rate']);
  if (approvals == null || denials == null) { rejects.non_numeric++; continue; }
  if (approvals === 0) { rejects.zero_approvals++; continue; }
  const titles = parseTitles(r.top_job_titles_sponsored);
  const cls = classifyTitles(titles);
  const tier = sponsorshipTier({ approvals, rate, cls });
  if (tier === 'Unknown') rejects.no_swe_title++;
  const fd = present(r.latest_funding_date) ? d(r.latest_funding_date.slice(0, 10)) : null;
  const fundingAge = fd ? monthsBetween(fd, asOf) : null;
  companies.push({
    company: r.company_name.trim(),
    website: r.website.trim() || null,
    city: r.city.trim().toUpperCase(),
    h1b: { approvals, denials, approval_rate: rate == null ? null : Math.round(rate * 10) / 10, median_salary_offered: num(r.median_salary_offered), source: 'record', fiscal_years: 'UNKNOWN — not stated in source' },
    titles: { sponsored_top: titles, swe: cls.swe_titles, non_senior_swe: cls.non_senior_swe_titles, senior_only: cls.senior_only, source: 'record (titles) + rule (classification)' },
    sponsorship_tier: tier, sponsorship_p: RULES.tiers[tier].p, tier_rule: RULES.tiers[tier].test,
    funding: { latest_date: fd ? r.latest_funding_date.slice(0, 10) : null, months_since: fundingAge, signal: fundingAge == null ? 'missing' : fundingAge <= RULES.funding_recent_months ? 'recent' : 'stale', stage_estimate: r.latest_funding_stage || null, source: 'record (SEC Form D); stage is a heuristic estimate in the source, not a fact' },
    everify: profile.everify_overrides?.[r.company_name.trim()] ?? 'unknown',
  });
}

const tierRank = { Proven: 0, Likely: 1, Possible: 2, Unknown: 3 };
companies.sort((a, b) => tierRank[a.sponsorship_tier] - tierRank[b.sponsorship_tier] || b.h1b.approvals - a.h1b.approvals || a.company.localeCompare(b.company));

// timeline: conservative (E-Verify unknown) and best case (E-Verify confirmed)
const tlBase = { as_of: profile.as_of, opt_start: profile.opt_start, stem_degree: profile.stem_degree };
const tlConservative = timeline({ ...tlBase, employer_everify: 'unknown' });
const tlStem = timeline({ ...tlBase, employer_everify: true });
for (const c of companies) c.timeline_factor = timeline({ ...tlBase, employer_everify: c.everify }).factor;
if (tlConservative.closed && tlStem.closed) halt(`timeline gate closed: 0 H-1B registrations reachable before work authorization ends (${tlStem.authorized_until})`);
if (!companies.length) halt('no companies survived the filters — refusing to emit an empty ranking');

const tierCounts = Object.fromEntries(Object.keys(tierRank).map((t) => [t, companies.filter((c) => c.sponsorship_tier === t).length]));
const log = {
  _tool: 'revan1010-boston-swe-triage/sponsor-triage.mjs', _version: '0.1.0', generated: new Date().toISOString(),
  inputs: { csv: csvPath, csv_sha256: createHash('sha256').update(raw).digest('hex'), profile: profilePath, profile_values: profile },
  rules: { ...RULES, swe_title: String(RULES.swe_title), qa_title: String(RULES.qa_title), senior_marker: String(RULES.senior_marker) },
  data_shape: { rows: rows.length, h1b_rows: h1bRows.length, in_state: inState.length, in_state_h1b: inStateH1b.length, in_commute_h1b: inCommute.length, kept: companies.length, rejects, parity },
  timeline: { conservative: tlConservative, stem_if_everify: tlStem },
  tier_counts: tierCounts,
  companies,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'triage.json'), JSON.stringify(log, null, 2));

// ── human report ──
const fmt$ = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
const tl = (t) => `${t.draws} lottery registration(s) reachable (${t.registrations_reachable.map((x) => x.registration + (x.pre_opt ? ' [before OPT starts]' : '')).join(', ') || 'none'}); authorized until ${t.authorized_until}; timeline factor ${t.factor}`;
const shown = companies.slice(0, top);
const md = `# Boston SWE sponsor triage — ${profile.as_of}

## Executive summary

**What this is:** a short-list of Boston-area employers that have sponsored H-1B workers, sorted by whether they have sponsored *non-senior* software engineers, the evidence a new-grad international student actually needs.
**Why read it:** it tells you where application effort has evidence behind it before you spend any, and it says plainly where the evidence is thin.
**What it found:** ${companies.length} commutable employers have an H-1B record. ${tierCounts.Proven} show non-senior software titles with a strong record, ${tierCounts.Likely} show non-senior software titles with a thinner record, ${tierCounts.Possible} have sponsored *only senior* software titles, and ${tierCounts.Unknown} have no software title in their sponsored list at all. ${parity.suspected_double_count ? `**Warning:** every sponsorship count in the source file is an even number (${parity.approvals_even} of ${parity.h1b_rows}), which suggests the counts were doubled upstream. Compare employers by rank and approval rate, not by raw count.` : ''} The H-1B figures do not say which years they cover. On timing: if your employer is not confirmed to use E-Verify, you have ${tlConservative.draws} H-1B lottery chance(s). With E-Verify and the STEM extension, you have ${tlStem.draws}.
**What it did not do:** it did not check whether any job posting is live. It did not judge your fit, and it cannot tell whether an employer will sponsor *you*. Those steps come next and need a human.

## Run record

| Field | Value |
|---|---|
| Source | \`${csvPath}\` (sha256 \`${log.inputs.csv_sha256.slice(0, 12)}…\`) |
| Rows read / with H-1B fields | ${rows.length} / ${h1bRows.length} |
| ${state} rows with H-1B fields / in commute set / kept | ${inStateH1b.length} / ${inCommute.length} / ${companies.length} |
| Rejected | zero approvals ${rejects.zero_approvals} · non-numeric ${rejects.non_numeric} |
| Parity audit | approvals even ${parity.approvals_even}/${parity.h1b_rows} · denials even ${parity.denials_even}/${parity.h1b_rows} · double-count suspected: **${parity.suspected_double_count}** |
| Timeline (E-Verify unknown) | ${tl(tlConservative)} |
| Timeline (E-Verify confirmed) | ${tl(tlStem)} |

## Short-list (top ${shown.length} of ${companies.length})

| # | Employer | City | Tier | Approvals / denials (raw) | Rate % | Median sponsored salary | Non-senior SWE titles (record; unmarked level ≠ new-grad) | Form D funding |
|---|---|---|---|---|---|---|---|---|
${shown.map((c, i) => `| ${i + 1} | ${c.company} | ${c.city} | ${c.sponsorship_tier} | ${c.h1b.approvals} / ${c.h1b.denials} | ${c.h1b.approval_rate ?? '—'} | ${fmt$(c.h1b.median_salary_offered)} | ${c.titles.non_senior_swe.join('; ') || (c.titles.senior_only ? '_senior only:_ ' + c.titles.swe.slice(0, 2).join('; ') : '—')} | ${c.funding.latest_date ?? '—'} (${c.funding.signal}) |`).join('\n')}

## How to read the tiers

${Object.entries(RULES.tiers).map(([k, v]) => `- **${k}** (scorer p = ${v.p}, a declared rule — not a measured probability): ${v.test}.`).join('\n')}

## What this report cannot tell you

- Whether the employer is sponsoring **now**: the H-1B fields carry no fiscal year.
- Whether the company named here is the same legal employer as in the government data: the join was never validated, and there is no FEIN.
- Whether a missing title means "never sponsored": the source keeps only the top few titles per employer.
- Whether a "Possible" employer would hire a new grad: senior-only evidence is not entry-level evidence.
- E-Verify enrollment, the wage level an offer would sit at, and whether your MSIS degree will be accepted as related to a software developer petition.
`;
writeFileSync(join(outDir, 'triage.md'), md);

console.log(`sponsor-triage: ${rows.length} rows · ${h1bRows.length} with H-1B · ${state} ${inStateH1b.length} · commute ${inCommute.length} · kept ${companies.length}`);
console.log(`tiers: ${Object.entries(tierCounts).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`parity: approvals even ${evenA}/${h1bRows.length}, denials even ${evenD}/${h1bRows.length} → double-count suspected: ${parity.suspected_double_count}`);
console.log(`timeline: E-Verify unknown → ${tlConservative.draws} draw(s), factor ${tlConservative.factor}, until ${tlConservative.authorized_until} | E-Verify confirmed → ${tlStem.draws} draw(s), factor ${tlStem.factor}, until ${tlStem.authorized_until}`);
console.log(`wrote ${join(outDir, 'triage.json')} and ${join(outDir, 'triage.md')}`);
