// lib.mjs — shared, side-effect-free helpers for the Boston MSIS→SWE triage mode.
//
// Everything here is deterministic: CSV parsing, title classification, and
// date arithmetic. Nothing here calls the network or a model. Every rule that
// is a human choice rather than a record is named in RULES with its reasoning,
// so the recipe can cite it as a closed [TODO: DEFINE].

export const RULES = {
  // [DEFINE] A title counts as a SWE-family title if it names software
  // development work. Reason: SOC 15-1252 titles as they appear in LCA
  // job_title strings; QA/test titles are kept separate (SOC 15-1253).
  swe_title: /\b(software|developer|full[- ]?stack|back[- ]?end|front[- ]?end|sde|swe|platform engineer|site reliability|devops)\b/i,
  qa_title: /\b(qa|quality assurance|test|sdet)\b/i,
  // [DEFINE] A seniority marker means the sponsored hire was not entry level.
  // Reason: a new-grad MSIS student needs evidence the employer sponsors
  // people at their level, not just senior hires.
  senior_marker: /\b(senior|sr\.?|staff|principal|lead|manager|director|head|architect|vp|chief|distinguished|iii|iv|3|4)\b/i,
  // [DEFINE] Sponsorship tier → scorer p. Tier comes from record fields; the
  // p value is a declared rule, not a measured probability.
  tiers: {
    'Proven':   { p: 0.8, test: 'SWE title with no seniority marker AND approvals >= min_approvals_proven AND approval_rate >= 90' },
    'Likely':   { p: 0.6, test: 'SWE title with no seniority marker, below the Proven count/rate bar' },
    'Possible': { p: 0.4, test: 'SWE titles sponsored, but every one carries a seniority marker (senior-only evidence)' },
    'Unknown':  { p: 0.2, test: 'H-1B record present but no SWE-family title in the top-titles list' },
  },
  min_approvals_proven: 10,
  // [DEFINE] Timeline factor by H-1B cap registrations still reachable.
  // Reason: each registration is one lottery draw; 0 draws = gate closed.
  timeline_factor_by_draws: { 0: 0.0, 1: 0.5, 2: 0.75 }, // >=3 → 1.0
  // [DEFINE] Approximate cap registration date each year (USCIS sets the real
  // window annually, usually in March). Human must confirm each season.
  registration_month_day: '03-01',
  funding_recent_months: 24,
  // [DEFINE] Post-completion OPT must begin within 60 days after the program
  // end date (the F-1 grace period). Reason: an OPT start outside this window
  // is not a scenario, it is an input error — the run must halt on it.
  opt_start_window_days: 60,
};

export const REQUIRED_COLUMNS = [
  'company_name', 'website', 'city', 'state', 'latest_funding_stage', 'latest_funding_date',
  'Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered', 'top_job_titles_sponsored',
];

// RFC-4180-ish CSV parser: quoted fields, embedded commas/newlines, "" escapes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } q = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (q) throw new Error('CSV ends inside a quoted field (truncated or corrupt file)');
  const [header, ...body] = rows;
  return { header, records: body.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, k) => [h, r[k] ?? '']))), widthErrors: body.filter((r) => r.length > 1 && r.length !== header.length).length };
}

const NULLS = new Set(['', 'nan', 'NaN', 'null', 'None', 'N/A']);
export const present = (v) => v != null && !NULLS.has(String(v).trim());
export const num = (v) => (present(v) && Number.isFinite(Number(v)) ? Number(v) : null);

// top_job_titles_sponsored is a Python-list repr: "['A', \"B's\"]"
export function parseTitles(s) {
  if (!present(s)) return [];
  const out = [];
  for (const m of String(s).matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) out.push((m[1] ?? m[2]).trim());
  return out.filter(Boolean);
}

export function classifyTitles(titles) {
  const swe = titles.filter((t) => RULES.swe_title.test(t) && !RULES.qa_title.test(t));
  const entry = swe.filter((t) => !RULES.senior_marker.test(t));
  return { swe_titles: swe, non_senior_swe_titles: entry, senior_only: swe.length > 0 && entry.length === 0 };
}

export function sponsorshipTier({ approvals, rate, cls }) {
  if (cls.non_senior_swe_titles.length > 0)
    return approvals >= RULES.min_approvals_proven && rate >= 90 ? 'Proven' : 'Likely';
  if (cls.swe_titles.length > 0) return 'Possible';
  return 'Unknown';
}

// ── dates (UTC, day precision) ──
export const d = (s) => { const x = new Date(`${s}T00:00:00Z`); if (Number.isNaN(+x)) throw new Error(`bad date: ${s}`); return x; };
export const iso = (x) => x.toISOString().slice(0, 10);
export function addMonths(x, m) { const y = new Date(x); y.setUTCMonth(y.getUTCMonth() + m); return y; }
const addDays = (x, n) => new Date(+x + n * 864e5);
export const monthsBetween = (a, b) => Math.round(((+b - +a) / 864e5 / 30.4375) * 10) / 10;

// OPT/STEM-OPT timeline → H-1B cap registrations still reachable.
// Scenario `stem` is only available if the student's degree is STEM-designated
// AND the employer is enrolled in E-Verify — the second fact is not in any
// repo dataset, so callers must pass it explicitly or get the conservative case.
export function timeline({ as_of, opt_start, opt_months = 12, stem_ext_months = 24, stem_degree, employer_everify }) {
  const asOf = d(as_of), optStart = d(opt_start);
  const optEnd = addDays(addMonths(optStart, opt_months), -1);
  const stemEnd = addMonths(optEnd, stem_ext_months);
  const stemAvailable = stem_degree === true && employer_everify === true;
  const authEnd = stemAvailable ? stemEnd : optEnd;
  const draws = [];
  for (let y = asOf.getUTCFullYear(); y <= authEnd.getUTCFullYear(); y++) {
    const reg = d(`${y}-${RULES.registration_month_day}`);
    if (reg >= asOf && reg <= authEnd) draws.push({ registration: iso(reg), pre_opt: reg < optStart });
  }
  const n = draws.length;
  const factor = n >= 3 ? 1.0 : RULES.timeline_factor_by_draws[n];
  return {
    as_of, opt_start, opt_end: iso(optEnd), stem_end: iso(stemEnd),
    stem_available: stemAvailable,
    stem_basis: stemAvailable ? 'stem_degree=true AND employer_everify=true' : `stem_degree=${stem_degree}, employer_everify=${employer_everify} → OPT only (conservative)`,
    authorized_until: iso(authEnd),
    months_authorized_remaining: monthsBetween(asOf, authEnd),
    registrations_reachable: draws,
    draws: n,
    factor,
    closed: factor <= 0.05,
  };
}
