// lib.mjs — pure helpers for the swe-opt-clock prototype.
// Recipe: recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md
//
// Nothing in this file touches the network or writes files. It reads local
// repo data handed to it, applies the recipe's declared rules, and labels every
// value it produces: record / your-input / model-judgment (no model is called
// anywhere in this prototype, so model-judgment never appears).
//
// It does NOT combine evidence into a decision. That is the Ch.11 scorer's job
// (scripts/score/role-scorer.mjs), which run.mjs invokes as-is.

import fs from 'node:fs';
import { classifyLiveness } from '../../../ats/liveness-core.mjs';

export const LABEL = { record: 'record', input: 'your-input', model: 'model-judgment' };
export const ALLOWED_LABELS = new Set(Object.values(LABEL));

// ── recipe rules (every threshold here is a recipe choice, labeled your-input) ──
export const RULES = {
  // Tier → p. Proven 0.9 and Likely 0.6 are the values the book's own worked
  // example uses (data/examples/ch11-roles.json). Possible 0.3 is this recipe's
  // placeholder: below Likely, inside the scorer's soft-tier list, never Apply.
  tier_p: { Proven: 0.9, Likely: 0.6, Possible: 0.3 },
  proven_min_approvals: 10,  // = median approvals among the 1,557 H-1B-mapped rows (80 Days audit)
  proven_min_rate: 90,       // 84 of 1,557 mapped sponsors fall below 90% (measured 2026-10-02)
  possible_below_approvals: 2,
  possible_below_rate: 75,
  snapshot_max_age_days: 7,
};

// Title → SOC 15-1252 is a string heuristic, NOT an LCA SOC record (the CSV has no SOC column).
export const SWE_TITLE = /\bsoftware\s+(engineer|developer|development\s+engineer)\b|\b(back[- ]?end|full[- ]?stack|front[- ]?end)\s+(software\s+)?(engineer|developer)\b|\bplatform\s+engineer\b|\bsite\s+reliability\s+engineer\b|\bsde\b/i;
export const SENIOR_TITLE = /\b(senior|sr\.?|staff|principal|lead|manager|director|head|vp|chief|architect)\b/i;

// ── small utilities ──────────────────────────────────────────────────────────
export function parseCsv(text) {
  // RFC 4180: quoted fields may contain commas, newlines, and doubled quotes.
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export const normName = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const DAY = 86400000;
export function parseDate(s) {
  if (s instanceof Date) return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s ?? ''));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const diffDays = (a, b) => Math.round((a.getTime() - b.getTime()) / DAY);
export const num = (s) => { const x = Number.parseFloat(s); return Number.isFinite(x) ? x : null; };

// ── G0: the persona's clock ──────────────────────────────────────────────────
// Returns { ok:false, stop } on any input that would force a guess, otherwise
// the dates every timeline factor is computed from.
export function personaClock(persona, asOf) {
  const v = persona?.visa ?? {};
  const stop = (code, detail) => ({ ok: false, stop: { code, detail } });
  if (typeof persona?.needs_sponsorship !== 'boolean')
    return stop('needs-sponsorship-missing', 'profile has no boolean needs_sponsorship; refusing to infer it from free text (the scorer\'s regex misreads "work authorized")');
  const optEnd = parseDate(v.opt_end_date);
  if (!optEnd) return stop('opt-end-missing', 'visa.opt_end_date is missing or not YYYY-MM-DD');
  if (optEnd < asOf) return stop('opt-end-past', `OPT end ${iso(optEnd)} is before the run date ${iso(asOf)}: check the input before anything else`);
  const ceiling = num(v.unemployment_ceiling);
  const usedAt = num(v.unemployment_days_used);
  const buffer = num(v.buffer_target) ?? 0;
  if (ceiling == null || usedAt == null) return stop('unemployment-fields-missing', 'visa.unemployment_ceiling and visa.unemployment_days_used are required');
  const employed = v.currently_employed === true;
  const countAsOf = parseDate(v.unemployment_days_as_of);
  if (!employed && !countAsOf)
    return stop('unemployment-count-undated', 'visa.unemployment_days_as_of is required while unemployed; an undated count silently makes the deadline later');
  if (countAsOf && countAsOf > asOf)
    return stop('unemployment-count-in-future', `unemployment count dated ${iso(countAsOf)} is after the run date ${iso(asOf)}`);
  // The clock keeps running while unemployed: project the count to the run date.
  const usedNow = employed ? usedAt : usedAt + diffDays(asOf, countAsOf);
  const remaining = ceiling - usedNow;
  if (remaining <= 0) return stop('unemployment-ceiling-reached', `projected unemployment days ${usedNow} ≥ ceiling ${ceiling}: talk to your DSO today; this tool cannot help`);
  const exhaustion = employed ? null : addDays(asOf, remaining);
  const hard = exhaustion && exhaustion < optEnd ? exhaustion : optEnd;
  const safe = addDays(hard, -buffer);
  return {
    ok: true,
    needs_sponsorship: persona.needs_sponsorship,
    as_of: iso(asOf),
    opt_end_date: iso(optEnd),
    currently_employed: employed,
    unemployment_ceiling: ceiling,
    unemployment_days_used_snapshot: usedAt,
    unemployment_days_as_of: countAsOf ? iso(countAsOf) : null,
    unemployment_days_used_projected: usedNow,
    unemployment_days_remaining: remaining,
    unemployment_exhaustion_date: exhaustion ? iso(exhaustion) : null,
    hard_deadline: iso(hard),
    hard_deadline_binding: exhaustion && exhaustion < optEnd ? 'unemployment-ceiling' : 'opt-end',
    buffer_target: buffer,
    safe_deadline: iso(safe),
    label: LABEL.input,
  };
}

// ── G3: timeline factor (a gate) ─────────────────────────────────────────────
// start > hard deadline → 0; start ≤ safe deadline → 1; between → linear in the
// buffer. The linear shape is this recipe's choice (Ch.10 gives the three cases,
// not a formula).
export function timelineFactor(clock, lagDays) {
  const lag = num(lagDays);
  if (lag == null || lag < 0) return { ok: false, code: 'no-time-to-start', detail: 'role has no numeric time_to_start_days' };
  const asOf = parseDate(clock.as_of), hard = parseDate(clock.hard_deadline), safe = parseDate(clock.safe_deadline);
  const start = addDays(asOf, lag);
  let factor, band;
  if (start > hard) { factor = 0; band = 'after-hard-deadline'; }
  else if (start <= safe || clock.buffer_target <= 0) { factor = 1; band = 'inside-buffer'; }
  else { factor = Number((diffDays(hard, start) / clock.buffer_target).toFixed(3)); band = 'eats-buffer'; }
  return {
    ok: true, factor, band, expected_start: iso(start),
    math: `start ${iso(start)} (run date + ${lag} d) vs safe ${clock.safe_deadline} / hard ${clock.hard_deadline} → ${factor}`,
    label: LABEL.input,
  };
}

// ── G1 + sponsorship tier ────────────────────────────────────────────────────
// Only the columns this recipe needs are kept. Phone and officer/director names
// are dropped at load so they can never reach an output file.
const KEEP = ['company_name', 'industry', 'city', 'state', 'latest_funding_amount', 'latest_funding_stage',
  'latest_funding_date', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered', 'top_job_titles_sponsored'];

export function loadSponsorIndex(csvPath) {
  const idx = new Map();
  for (const r of parseCsv(fs.readFileSync(csvPath, 'utf8'))) {
    const k = normName(r.company_name);
    const slim = Object.fromEntries(KEEP.map((c) => [c, r[c] ?? '']));
    idx.set(k, idx.has(k) ? { ambiguous: true } : slim);
  }
  return idx;
}

export function resolveCompany(idx, legalName) {
  const row = idx.get(normName(legalName));
  if (!row) return { ok: false, code: 'not-in-csv', detail: `no row whose normalized company_name equals "${normName(legalName)}"` };
  if (row.ambiguous) return { ok: false, code: 'ambiguous-name', detail: 'more than one CSV row normalizes to this name' };
  return { ok: true, row };
}

export function parseTitles(field) {
  const s = String(field ?? '').trim();
  if (!s) return [];
  const quoted = [...s.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((m) => (m[1] ?? m[2]).trim());
  return quoted.length ? quoted.filter(Boolean) : s.split(';').map((t) => t.trim()).filter(Boolean);
}

export function sponsorshipTier(row) {
  const approvals = num(row['Total Approvals']);
  const denials = num(row['Total Denials']);
  const rate = num(row['Approval_Rate']);
  const titles = parseTitles(row.top_job_titles_sponsored);
  if (approvals == null && rate == null) {
    return { tier: 'Unknown', scored: false, p: null, reason: 'H-1B fields are empty: no trace in this dataset, which is not evidence of non-sponsorship', evidence: { titles } };
  }
  const swe = titles.filter((t) => SWE_TITLE.test(t));
  const entry = swe.filter((t) => !SENIOR_TITLE.test(t));
  const evidence = { approvals, denials, approval_rate: rate, titles, swe_titles: swe, non_senior_swe_titles: entry };
  let tier, reason;
  const fewApprovals = (approvals ?? 0) < RULES.possible_below_approvals;
  const lowRate = (rate ?? 0) < RULES.possible_below_rate;
  if (fewApprovals || lowRate) {
    tier = 'Possible';
    reason = [fewApprovals && `only ${approvals ?? 0} approvals (< ${RULES.possible_below_approvals})`,
      lowRate && `approval rate ${(rate ?? 0).toFixed(1)}% (< ${RULES.possible_below_rate}%)`].filter(Boolean).join('; ');
  } else if (approvals >= RULES.proven_min_approvals && rate >= RULES.proven_min_rate && entry.length) {
    tier = 'Proven';
    reason = `${approvals} approvals, ${rate.toFixed(1)}% approved, non-senior SWE title on record: "${entry[0]}"`;
  } else {
    const why = [];
    if (approvals < RULES.proven_min_approvals) why.push(`only ${approvals} approvals (< ${RULES.proven_min_approvals})`);
    if (rate < RULES.proven_min_rate) why.push(`approval rate ${rate.toFixed(1)}% (< ${RULES.proven_min_rate}%)`);
    if (!swe.length) why.push('no software-engineering title among the sponsored titles on record');
    else if (!entry.length) why.push(`every SWE title on record is senior (${swe.join('; ')}): weak evidence for a new grad`);
    tier = 'Likely'; reason = why.join('; ');
  }
  return { tier, scored: true, p: RULES.tier_p[tier], reason, evidence };
}

// ── G2: liveness from a saved snapshot, via the engine's own classifier ─────
export function livenessFromSnapshot(snap, asOf, maxAge = RULES.snapshot_max_age_days) {
  if (!snap) return { hold: true, code: 'no-snapshot', detail: 'no posting snapshot supplied', factor: null };
  const captured = parseDate(snap.captured_at);
  if (!captured) return { hold: true, code: 'snapshot-undated', detail: 'snapshot has no captured_at date', factor: null };
  const age = diffDays(asOf, captured);
  if (age < 0) return { hold: true, code: 'snapshot-after-run-date', detail: `captured ${iso(captured)} is after the run date`, factor: null, age_days: age };
  const c = classifyLiveness({ status: snap.status ?? 0, finalUrl: snap.finalUrl ?? '', bodyText: snap.bodyText ?? '', applyControls: snap.applyControls ?? [] });
  const label = snap.capture_mode === 'live-fetch' ? LABEL.record : LABEL.input;
  const base = { classifier: c, captured_at: iso(captured), age_days: age, capture_mode: snap.capture_mode ?? 'fixture', url: snap.url ?? null, label };
  if (age > maxAge) return { ...base, hold: true, code: 'snapshot-stale', detail: `snapshot is ${age} days old (> ${maxAge}); re-check the posting`, factor: null };
  if (c.result === 'active') return { ...base, hold: false, code: c.code, detail: c.reason, factor: 1 };
  if (c.result === 'expired') return { ...base, hold: false, code: c.code, detail: c.reason, factor: 0 };
  return { ...base, hold: true, code: c.code, detail: `classifier says uncertain: ${c.reason}`, factor: null };
}

// ── role quality (report-only: the scorer's role_quality weight is 0.0) ─────
export function loadSocIndex(csvPath) {
  const idx = new Map();
  for (const r of parseCsv(fs.readFileSync(csvPath, 'utf8'))) {
    const k = r.bls_soc_code;
    if (!idx.has(k) || r.onet_soc_code.endsWith('.00')) idx.set(k, r);
  }
  return idx;
}

export function roleQuality(socIdx, soc) {
  const r = socIdx.get(String(soc ?? '').trim());
  if (!r) return { status: 'missing', reason: 'no-soc-row', detail: `no row for SOC "${soc}" in the compact BLS table (2018 SOC); no crosswalk is guessed`, label: LABEL.record };
  return {
    status: 'ok', soc: r.bls_soc_code, title: r.title, oews_year: r.oews_year, job_zone: num(r.job_zone),
    national_median_wage: num(r.annual_median_wage), national_mean_wage: num(r.annual_mean_wage), label: LABEL.record,
  };
}

// ── funding (report-only: the scorer has no funding vote) ───────────────────
export function loadFormDIndex(paths) {
  const idx = new Map();
  for (const p of paths) {
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of d.companies ?? []) {
      idx.set(normName(c.company?.name), { name: c.company?.name, date_filed: c.filing?.date_filed, quarter: c.filing?.quarter });
    }
  }
  return idx;
}

export function fundingSignal(row, formD, asOf) {
  const d = parseDate(row.latest_funding_date);
  const hit = formD.get(normName(row.company_name)) ?? null;
  return {
    latest_funding_date: d ? iso(d) : null,
    days_since_latest_funding: d ? diffDays(asOf, d) : null,
    latest_funding_stage: row.latest_funding_stage || null,
    latest_funding_amount: num(row.latest_funding_amount),
    form_d_sample_match: hit,
    label: LABEL.record,
  };
}

// ── G4: the scorer's output must agree with what we fed it ─────────────────
export function checkScorerOutput(scores, fed, needsSponsorship) {
  const problems = [];
  if (scores?._scorer !== 'bayesian-role-scorer') problems.push(`unexpected scorer id "${scores?._scorer}"`);
  if (scores?.profile_needs_sponsorship !== needsSponsorship)
    problems.push(`scorer reports profile_needs_sponsorship=${scores?.profile_needs_sponsorship} but the persona says ${needsSponsorship}`);
  const out = new Map((scores?.roles ?? []).map((r) => [r.role_id, r]));
  if (out.size !== fed.length) problems.push(`fed ${fed.length} roles, scorer returned ${out.size}`);
  for (const f of fed) {
    const s = out.get(f.role_id);
    if (!s) { problems.push(`role ${f.role_id} missing from scorer output`); continue; }
    const closed = f.liveness.factor <= 0.05 || f.timeline.factor <= 0.05;
    if (closed && s.machine_recommendation !== 'Skip')
      problems.push(`role ${f.role_id} has a closed gate (liveness ${f.liveness.factor}, timeline ${f.timeline.factor}) but scorer said ${s.machine_recommendation}`);
    for (const t of [...(s.trace?.votes ?? []), ...(s.trace?.gates ?? [])])
      if (!ALLOWED_LABELS.has(t.source)) problems.push(`role ${f.role_id} term ${t.factor} has unlabeled/unknown source "${t.source}"`);
  }
  return problems;
}
