#!/usr/bin/env node
// game-studio-triage.mjs — identify candidate game studios in the 80 Days company
// table and attach the evidence components a game-programming student needs.
//
// WHY THIS SCRIPT EXISTS
// The Form D industry taxonomy in data/80-days-to-stay/ has no games category. The
// 30,369 mapped companies carry 24 industry labels — "Other Technology" (10,909),
// "Other" (9,730), "Computers" (360) and so on — so every game studio in the file is
// filed as something else. There is no column to filter on. This script therefore
// identifies candidates by name/website/sponsored-title terms, which is a JUDGMENT,
// and labels it as one on every row it emits.
//
// WHAT IT DOES AND DOES NOT DO
// It COMBINES NOTHING. It emits evidence components (sponsorship tier, funding
// recency, role-family match, role-quality score, salary gap) each tagged with its
// source type — record / student-judgment / derived — and leaves the composite
// Apply/Consider/Skip decision to the tested upstream scorer:
//   node scripts/score/role-scorer.mjs <roles.json>   (npm run score)
// That separation is deliberate: two scorers that both produce a recommendation is
// how a number no record produced gets into a report (SNICKERDOODLE P3).
//
// USAGE
//   node scripts/score/game-studio-triage.mjs [options]
//     --asof <YYYY-MM-DD>     date funding recency is measured against (default: today)
//     --terms <path>          term/SOC config (default: data/examples/game-studio-terms.json)
//     --companies <path>      80 Days mapped CSV (default: the path below)
//     --bls <path>            BLS/O*NET compact CSV (default: the path below)
//     --out-dir <dir>         where the JSON log goes (default: logs/)
//     --md <path>             where the human report goes (default: <out-dir>/game-studio-triage-<asof>.md)
//     --min-approvals <n>     drop candidates below n H-1B approvals (default: 1; 0 keeps Unknown)
//     --require-role-family   keep only candidates whose sponsored titles match my role family
//     --naive-substring       USE THE BROKEN MATCHER ON PURPOSE (substring, no word
//                             boundary). Reproduces the 905-false-positive failure for
//                             the attestation's break test. Never use for a real run.
//     --emit-roles <path>     write a roles.json for role-scorer.mjs
//     --liveness <path>       JSON { "<role_id>": <0..1>, ... } — REQUIRED by --emit-roles
//
// --emit-roles REFUSES TO WRITE WITHOUT --liveness, on purpose. role-scorer.mjs
// defaults a missing gate to 1.0 (`num(role.liveness?.factor) ?? 1`), i.e. it treats an
// unchecked posting as live — the most expensive silent default in the stack for
// someone on a clock. This script will not hand it an unchecked role.
//
// Reads only local files. No network. No writes outside --out-dir / --md / --emit-roles.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  companies: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
  terms: 'data/examples/game-studio-terms.json',
  outDir: 'logs',
  minApprovals: 1,
};

const SRC = {
  record: 'record',               // a value a dataset states
  derived: 'derived',             // arithmetic over record values; reproducible
  judgment: 'student-judgment',   // a human choice (term lists, thresholds)
};

// ── argv ───────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = argv.slice(2);
  const get = (flag, def) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : def; };
  const has = (flag) => a.includes(flag);
  const asof = get('--asof', new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asof)) { console.error(`--asof must be YYYY-MM-DD, got "${asof}"`); process.exit(2); }
  const outDir = get('--out-dir', DEFAULTS.outDir);
  return {
    asof,
    terms: get('--terms', DEFAULTS.terms),
    companies: get('--companies', DEFAULTS.companies),
    bls: get('--bls', DEFAULTS.bls),
    outDir,
    md: get('--md', path.join(outDir, `game-studio-triage-${asof}.md`)),
    minApprovals: Number(get('--min-approvals', DEFAULTS.minApprovals)),
    requireRoleFamily: has('--require-role-family'),
    naive: has('--naive-substring'),
    emitRoles: get('--emit-roles', null),
    liveness: get('--liveness', null),
  };
}

// ── CSV (RFC4180-ish: quoted fields may contain commas and doubled quotes) ─────
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const readCsv = (p) => parseCsv(fs.readFileSync(p, 'utf8'));
const numOrNull = (x) => { const n = Number(String(x).trim()); return String(x).trim() !== '' && isFinite(n) ? n : null; };

// ── matching ──────────────────────────────────────────────────────────────────
// The whole point of the mode: word boundaries. Substring "engine" matches
// "Software Engineer". `naive` reverts to the broken behaviour for the break test.
function buildMatcher(terms, naive) {
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = terms.map(esc).join('|');
  return naive ? new RegExp(`(${body})`, 'gi')
               : new RegExp(`(?<![a-z0-9])(${body})(?![a-z0-9])`, 'gi');
}
const uniq = (xs) => [...new Set(xs)];
const matches = (re, hay) => uniq((hay.toLowerCase().match(re) || []).map((m) => m.toLowerCase()));

// ── evidence components ───────────────────────────────────────────────────────
function sponsorshipTier(approvals, cfg) {
  if (approvals == null) return { tier: 'Unknown', p: null, source: SRC.record,
    note: 'no H-1B approvals value in the mapped CSV — the join found nothing. NOT evidence that the company does not sponsor.' };
  if (approvals >= cfg.proven_min_approvals) return { tier: 'Proven', p: 0.9, source: SRC.record, note: `${approvals} approvals` };
  if (approvals >= cfg.likely_min_approvals) return { tier: 'Likely', p: 0.6, source: SRC.record, note: `${approvals} approvals — a thin record` };
  return { tier: 'None', p: 0.05, source: SRC.record, note: 'approvals value present and zero' };
}

function fundingRecency(dateStr, asof, cfg) {
  const d = (dateStr || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { months: null, tier: 'unknown', source: SRC.record, note: 'no latest_funding_date in the record' };
  const months = Math.round((new Date(asof) - new Date(d)) / (1000 * 60 * 60 * 24 * 30.44));
  const tier = months <= cfg.fresh_max ? 'fresh' : months <= cfg.aging_max ? 'aging' : 'dry';
  return { months, tier, source: SRC.derived, note: `${months} months before ${asof}; thresholds are student-defined` };
}

// min–max rescale of cognitive_pivot_score over the occupations that carry one.
// Linear, reproducible, and reported with its endpoints so a reader can redo it.
function roleQualityIndex(cps, lo, hi) {
  if (cps == null) return null;
  return Number(((cps - lo) / (hi - lo)).toFixed(4));
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv);
  for (const p of [args.terms, args.companies, args.bls]) {
    if (!fs.existsSync(p)) { console.error(`missing input: ${p}`); process.exit(2); }
  }
  const cfg = JSON.parse(fs.readFileSync(args.terms, 'utf8'));
  const companies = readCsv(args.companies);
  const bls = readCsv(args.bls);

  // ── BLS side: target SOCs, their cognitive-pivot score and wage ─────────────
  const cpsAll = bls.map((r) => numOrNull(r.cognitive_pivot_score)).filter((x) => x != null);
  const cpsLo = Math.min(...cpsAll), cpsHi = Math.max(...cpsAll);

  // A BLS SOC code can carry several O*NET detail codes; OEWS wages are published at
  // the SOC level, so detail codes under one SOC SHARE a wage. Count them to flag it.
  const socMembers = {};
  for (const r of bls) (socMembers[r.bls_soc_code] ||= []).push(r.onet_soc_code);

  const socs = cfg.target_socs.map((t) => {
    const row = bls.find((r) => r.onet_soc_code === t.onet_soc_code);
    if (!row) return { ...t, found: false };
    const cps = numOrNull(row.cognitive_pivot_score);
    const siblings = (socMembers[row.bls_soc_code] || []).filter((c) => c !== row.onet_soc_code);
    return {
      ...t, found: true,
      bls_soc_code: row.bls_soc_code,
      bls_title: row.title,
      oews_year: row.oews_year,
      employment: numOrNull(row.employment),
      annual_median_wage: numOrNull(row.annual_median_wage),
      cognitive_pivot_score: cps,
      role_quality_index: roleQualityIndex(cps, cpsLo, cpsHi),
      skill_programming_lv: numOrNull(row.skill_programming_lv),
      skill_judgment_decision_making_lv: numOrNull(row.skill_judgment_decision_making_lv),
      skill_systems_evaluation_lv: numOrNull(row.skill_systems_evaluation_lv),
      wage_is_soc_aggregate: siblings.length > 0,
      wage_shared_with: siblings,
      source: SRC.record,
    };
  });

  // ── company side ────────────────────────────────────────────────────────────
  const strongRe = buildMatcher(cfg.studio_terms.strong, args.naive);
  const ambigRe = buildMatcher(cfg.studio_terms.ambiguous, args.naive);
  const famRe = buildMatcher(cfg.role_family_terms, args.naive);

  let scanned = 0, strongHits = 0, ambigOnly = 0;
  const candidates = [];
  for (const r of companies) {
    scanned++;
    const titles = r.top_job_titles_sponsored || '';
    const hay = [r.company_name, r.website, titles].join(' ');
    const sHits = matches(strongRe, hay);
    const aHits = matches(ambigRe, hay);
    if (!sHits.length) { if (aHits.length) ambigOnly++; continue; }
    strongHits++;

    const approvals = numOrNull(r['Total Approvals']);
    const sponsorship = sponsorshipTier(approvals, cfg.sponsorship_tiers);
    const funding = fundingRecency(r.latest_funding_date, args.asof, cfg.funding_recency_months);
    const famHits = matches(famRe, titles);
    const offered = numOrNull(r.median_salary_offered);

    candidates.push({
      role_id: r.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      company_name: r.company_name,
      website: r.website || null,
      location: [r.city, r.state].filter(Boolean).join(', ') || null,
      industry_label_in_dataset: r.industry || null,
      identified_by: { strong_terms: sHits, ambiguous_terms: aHits, source: SRC.judgment,
        note: 'term match on company name + website + sponsored titles. A candidate, not a confirmed game studio.' },
      sponsorship: { approvals, denials: numOrNull(r['Total Denials']), approval_rate: numOrNull(r.Approval_Rate), ...sponsorship },
      role_family: { matched: famHits.length > 0, terms: famHits,
        sponsored_titles_raw: titles || null, source: famHits.length ? SRC.record : SRC.record,
        note: famHits.length ? 'a sponsored title names my role family' : 'company sponsored someone, but no sponsored title names my role family' },
      funding: { latest_stage: r.latest_funding_stage || null, latest_amount: numOrNull(r.latest_funding_amount),
        latest_date: r.latest_funding_date || null, total_funding: numOrNull(r.total_funding), ...funding },
      salary: { median_offered_to_sponsored: offered, source: SRC.record,
        gap_vs_target_socs: offered == null ? null : socs.filter((s) => s.found && s.annual_median_wage).map((s) => ({
          onet_soc_code: s.onet_soc_code, label: s.label, bls_annual_median_wage: s.annual_median_wage,
          delta: Number((offered - s.annual_median_wage).toFixed(2)),
          pct_of_bls_median: Number(((offered / s.annual_median_wage) * 100).toFixed(1)),
          source: SRC.derived,
        })) },
      gates_not_evaluated_here: ['liveness', 'visa_timeline', 'human_confirmation_is_a_game_studio'],
    });
  }

  // ── filters ─────────────────────────────────────────────────────────────────
  let kept = candidates;
  if (args.minApprovals > 0) kept = kept.filter((c) => (c.sponsorship.approvals ?? -1) >= args.minApprovals);
  if (args.requireRoleFamily) kept = kept.filter((c) => c.role_family.matched);
  kept.sort((a, b) => (b.sponsorship.approvals ?? -1) - (a.sponsorship.approvals ?? -1));

  // ── log (agent) ─────────────────────────────────────────────────────────────
  const stat = (p) => { const s = fs.statSync(p); return { path: p, bytes: s.size, mtime: s.mtime.toISOString() }; };
  const log = {
    _script: 'game-studio-triage.mjs',
    _recipe: 'recipes/case-game-eng-opt-studio-triage.md',
    _emits: 'evidence components only — no composite. Combine with scripts/score/role-scorer.mjs.',
    run_id: `game-studio-triage-${args.asof}-${args.naive ? 'NAIVE' : 'wordboundary'}`,
    generated_at: new Date().toISOString(),
    asof: args.asof,
    mode: args.naive ? 'BROKEN-MATCHER-ON-PURPOSE (break test; not a real run)' : 'sample (local files only, no network)',
    params: { min_approvals: args.minApprovals, require_role_family: args.requireRoleFamily,
      matcher: args.naive ? 'substring (no word boundary)' : 'word-boundary', terms_version: cfg.version ?? null },
    provenance: [stat(args.companies), stat(args.bls), stat(args.terms)],
    counts: {
      companies_scanned: scanned,
      industry_labels_in_dataset: uniq(companies.map((r) => r.industry)).length,
      game_industry_labels_available: 0,
      strong_term_matches: strongHits,
      ambiguous_only_matches: ambigOnly,
      candidates_with_h1b_record: candidates.filter((c) => c.sponsorship.approvals != null).length,
      candidates_with_role_family_match: candidates.filter((c) => c.role_family.matched).length,
      kept_after_filters: kept.length,
    },
    role_quality_scale: { field: 'cognitive_pivot_score', occupations_with_score: cpsAll.length,
      min: cpsLo, max: cpsHi, transform: 'role_quality_index = (cps - min) / (max - min)', source: SRC.derived },
    target_socs: socs,
    candidates: kept,
    stop_conditions_hit: [],
  };
  if (!kept.length) log.stop_conditions_hit.push('zero candidates after filters — report the empty set, do not relax the filters to fill a page');
  const unresolved = socs.filter((s) => !s.found).map((s) => s.onet_soc_code);
  if (unresolved.length) log.stop_conditions_hit.push(`target SOC not in the BLS compact file: ${unresolved.join(', ')}`);

  fs.mkdirSync(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, `${log.run_id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(log, null, 2));
  fs.writeFileSync(args.md, renderReport(log));

  // ── roles.json for the tested upstream scorer ───────────────────────────────
  let rolesPath = null;
  if (args.emitRoles) {
    if (!args.liveness) {
      console.error('\n✗ REFUSING to emit roles.json without --liveness.');
      console.error('  role-scorer.mjs defaults a missing liveness gate to 1.0 — an unchecked');
      console.error('  posting would score as a live one. Run `npm run ats:liveness -- <url>`');
      console.error('  first and pass the result as --liveness <file>.');
      console.error(`  (the log and report were still written: ${jsonPath})`);
      process.exit(3);
    }
    const live = JSON.parse(fs.readFileSync(args.liveness, 'utf8'));
    const roles = [];
    const missingLive = [];
    for (const c of kept) {
      const f = live[c.role_id];
      if (typeof f !== 'number') { missingLive.push(c.role_id); continue; }
      const soc = socs.find((s) => s.found && s.role_quality_index != null);
      roles.push({
        role_id: c.role_id,
        company: c.company_name,
        title: c.role_family.matched ? `sponsored titles: ${c.role_family.sponsored_titles_raw}` : 'no role-family title on record',
        sponsorship: { p: c.sponsorship.p, tier: c.sponsorship.tier, source: 'record' },
        role_quality: { p: soc ? soc.role_quality_index : null, source: 'record',
          _soc: soc ? soc.onet_soc_code : null,
          _warning: 'role-scorer.mjs weights role_quality at 0.0 (DOMAIN.md defect #3) — this term contributes NOTHING to the composite' },
        liveness: { factor: f, source: 'record' },
        _fit_omitted: 'fit is a model/human judgment this script does not make. Add it by hand, labelled model-judgment, before trusting the composite.',
        _timeline_omitted: 'timeline is a gate derived from the student\'s own OPT dates. Add it by hand, labelled your-input.',
      });
    }
    if (missingLive.length) {
      console.error(`✗ no liveness value for: ${missingLive.join(', ')} — not emitted (gate unevaluated).`);
    }
    if (!roles.length) { console.error('✗ no roles had a liveness value; nothing emitted.'); process.exit(3); }
    fs.writeFileSync(args.emitRoles, JSON.stringify(roles, null, 2));
    rolesPath = args.emitRoles;
  }

  // ── console ─────────────────────────────────────────────────────────────────
  const c = log.counts;
  console.log(`\ngame-studio-triage — asof ${args.asof} · matcher ${log.params.matcher}${args.naive ? '  ** BREAK TEST **' : ''}`);
  console.log(`  ${c.companies_scanned} companies scanned · ${c.industry_labels_in_dataset} industry labels · ${c.game_industry_labels_available} of them game-related`);
  console.log(`  strong-term matches: ${c.strong_term_matches}  (ambiguous-only, not promoted: ${c.ambiguous_only_matches})`);
  console.log(`  with any H-1B approvals record: ${c.candidates_with_h1b_record}  ·  with a role-family sponsored title: ${c.candidates_with_role_family_match}`);
  console.log(`  kept after filters (min-approvals ${args.minApprovals}${args.requireRoleFamily ? ', role-family required' : ''}): ${c.kept_after_filters}`);
  for (const s of log.stop_conditions_hit) console.log(`  ! stop condition: ${s}`);
  console.log(`\n  ${jsonPath}  +  ${args.md}${rolesPath ? `  +  ${rolesPath}` : ''}`);
  console.log(`  next: human confirmation gate — open each website and confirm it makes games.\n`);
}

// ── human report (P5: a second artifact, for the person; P9: summary first) ────
function renderReport(log) {
  const o = [];
  const c = log.counts;
  o.push(`# Game-studio triage — ${log.asof}`);
  o.push('');
  o.push('## Executive summary');
  o.push('');
  o.push(`This is a shortlist of companies that may be video-game employers and have a history of sponsoring foreign workers, built for a student who has to decide where to spend a limited number of job applications.`);
  o.push('');
  o.push(`Read it if you are choosing which game companies to apply to and you need to know which ones have actually sponsored someone before, rather than which ones say they are open to it.`);
  o.push('');
  o.push(`What it found: the company list it searched describes ${c.companies_scanned.toLocaleString()} companies using ${c.industry_labels_in_dataset} industry labels, and **not one of those labels is about games** — so games companies cannot be looked up directly and have to be guessed at from names and job titles. Searching that way turned up ${c.strong_term_matches} possible game companies. Of those, only **${c.candidates_with_h1b_record}** have any record of sponsoring a worker, and only **${c.candidates_with_role_family_match}** have ever sponsored someone in the kind of job this student does. After filtering, **${c.kept_after_filters}** are worth a closer look. Every one of them still needs a person to open the company's website and confirm it makes games — the search cannot tell the difference between a game studio and a fitness company with "Interactive" in its name.`);
  o.push('');
  if (log.mode.startsWith('BROKEN')) {
    o.push(`> **This run used the broken matcher on purpose** (\`--naive-substring\`). Its numbers are a demonstration of a failure, not a shortlist. Do not act on them.`);
    o.push('');
  }
  o.push('## Run record');
  o.push('');
  o.push(`| Field | Value |`);
  o.push(`|---|---|`);
  o.push(`| Run id | \`${log.run_id}\` |`);
  o.push(`| Generated | ${log.generated_at} |`);
  o.push(`| Mode | ${log.mode} |`);
  o.push(`| Matcher | ${log.params.matcher} |`);
  o.push(`| Filters | min approvals ${log.params.min_approvals}; role family required: ${log.params.require_role_family} |`);
  o.push(`| Terms config | v${log.params.terms_version} |`);
  o.push('');
  o.push('### Provenance');
  o.push('');
  o.push('| File | Bytes | Modified |');
  o.push('|---|---|---|');
  for (const p of log.provenance) o.push(`| \`${p.path}\` | ${p.bytes.toLocaleString()} | ${p.mtime.slice(0, 10)} |`);
  o.push('');
  o.push('## Shortlist');
  o.push('');
  if (!log.candidates.length) {
    o.push('_No candidate cleared the filters. An empty shortlist is a result; it is not a reason to loosen the filters._');
  } else {
    o.push('| Company | Where | Sponsorship | Sponsored titles on record | My role family? | Last funding | Offered median |');
    o.push('|---|---|---|---|---|---|---|');
    for (const x of log.candidates) {
      o.push(`| ${x.company_name}<br/>\`${x.website ?? '—'}\` | ${x.location ?? '—'} | **${x.sponsorship.tier}** (${x.sponsorship.approvals ?? 'no record'} appr / ${x.sponsorship.denials ?? '—'} den) | ${(x.role_family.sponsored_titles_raw ?? '—').replace(/\|/g, '/')} | ${x.role_family.matched ? `yes — ${x.role_family.terms.join(', ')}` : 'no'} | ${x.funding.latest_stage ?? '—'} ${x.funding.latest_date ?? ''} (${x.funding.tier}${x.funding.months != null ? `, ${x.funding.months} mo` : ''}) | ${x.salary.median_offered_to_sponsored != null ? '$' + x.salary.median_offered_to_sponsored.toLocaleString() : '—'} |`);
    }
    o.push('');
    o.push('### Dataset industry label each candidate actually carries');
    o.push('');
    o.push('| Company | Label in the dataset | Matched on |');
    o.push('|---|---|---|');
    for (const x of log.candidates) o.push(`| ${x.company_name} | ${x.industry_label_in_dataset ?? '—'} | ${x.identified_by.strong_terms.join(', ')} |`);
  }
  o.push('');
  o.push('## Role quality for the target occupations');
  o.push('');
  o.push(`\`cognitive_pivot_score\` as published in the BLS/O*NET compact extract, rescaled to 0–1 over the ${log.role_quality_scale.occupations_with_score} occupations that carry a score (min ${log.role_quality_scale.min}, max ${log.role_quality_scale.max}).`);
  o.push('');
  o.push('| O*NET code | Occupation | Cognitive pivot | Rescaled | OEWS median wage | Wage is a group average? |');
  o.push('|---|---|---|---|---|---|');
  for (const s of log.target_socs) {
    if (!s.found) { o.push(`| ${s.onet_soc_code} | **not in the extract** | — | — | — | — |`); continue; }
    o.push(`| ${s.onet_soc_code} | ${s.label} | ${s.cognitive_pivot_score ?? '—'} | ${s.role_quality_index ?? '—'} | ${s.annual_median_wage != null ? '$' + s.annual_median_wage.toLocaleString() : '—'} | ${s.wage_is_soc_aggregate ? `**yes** — shared with ${s.wage_shared_with.join(', ')}` : 'no'} |`);
  }
  o.push('');
  o.push('## Salary offered to sponsored workers vs the published occupation median');
  o.push('');
  const withGap = log.candidates.filter((x) => x.salary.gap_vs_target_socs?.length);
  if (!withGap.length) o.push('_No candidate carries a median salary value._');
  else {
    o.push('| Company | Offered | vs Software Developers (15-1252) | vs Video Game Designers (15-1255.01) |');
    o.push('|---|---|---|---|');
    for (const x of withGap) {
      const g = (code) => x.salary.gap_vs_target_socs.find((y) => y.onet_soc_code === code);
      const cell = (y) => y ? `${y.pct_of_bls_median}% (${y.delta >= 0 ? '+' : ''}$${y.delta.toLocaleString()})` : '—';
      o.push(`| ${x.company_name} | $${x.salary.median_offered_to_sponsored.toLocaleString()} | ${cell(g('15-1252.00'))} | ${cell(g('15-1255.01'))} |`);
    }
  }
  o.push('');
  o.push('## What a person still has to do');
  o.push('');
  o.push('1. **Confirm each company makes games.** Open the website. The search cannot tell a game studio from any company with "Studio", "Interactive" or "Unity" in its name or job titles.');
  o.push('2. **Check the posting is live.** `npm run ats:liveness -- <job-url>`. This is a gate: a dead posting ends the row.');
  o.push('3. **Check the dates against your own timeline.** This report contains no immigration advice and no immigration dates.');
  o.push('4. **Treat a blank sponsorship record as unknown, not as a no.** Most companies in the source file have no sponsorship record at all.');
  o.push('');
  o.push(`_Generated by \`scripts/score/game-studio-triage.mjs\` from \`${log._recipe}\`. This script combines nothing: every number above is either a value a dataset states or arithmetic over such values, and the composite Apply/Consider/Skip decision belongs to \`npm run score\`._`);
  return o.join('\n') + '\n';
}

main();
