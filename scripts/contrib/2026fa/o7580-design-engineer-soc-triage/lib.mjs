// lib.mjs — pure functions for the design-engineer SOC triage.
// No network, no file writes. Every function returns a labeled value or a
// { missing: <reason-code>, detail } object — it never fills a gap with a guess.
//
// CSV parsing, company-name normalization, the title-list parser, the liveness-log
// parser and the OPT-clock arithmetic are adapted from this contributor's earlier
// recipe (decgrad-swe1-sponsor-level, PR #37). Everything about title FAMILIES,
// SOC candidates and the Cognitive Pivot readout is new here.
//
// Labels (SNICKERDOODLE P3 / role-scorer SRC):
//   record         — read from a shipped data file, or derived from one by a fixed rule
//   your-input     — typed or confirmed by the person (scenario file)
//   model-judgment — drafted by an AI and NOT yet confirmed by the person

export const LABEL = { record: 'record', input: 'your-input', model: 'model-judgment' };

// ── CSV (RFC 4180: quoted fields, doubled quotes, newlines inside quotes) ──
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])));
}

// ── exact company-name normalization (no fuzzy matching, by design) ──
const SUFFIX = /\b(INC|INCORPORATED|LLC|L L C|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|LP|L P|PBC|PLC)\b/g;
export function normalizeName(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Resolve a company to exactly one 80 Days row; state only breaks a tie.
export function resolveCompany(rows, name, state) {
  const key = normalizeName(name);
  if (!key) return { missing: 'no-company-match', detail: 'empty company name' };
  let hits = rows.filter((r) => normalizeName(r.company_name) === key);
  if (hits.length === 0) return { missing: 'no-company-match', detail: `no row normalizes to "${key}"` };
  if (hits.length > 1 && state) {
    const inState = hits.filter((r) => (r.state || '').toUpperCase() === state.toUpperCase());
    if (inState.length === 1) hits = inState;
  }
  if (hits.length > 1) {
    return { missing: 'ambiguous-company-match', detail: `${hits.length} rows normalize to "${key}": ${hits.map((h) => `${h.company_name} (${h.state})`).join('; ')}` };
  }
  return { row: hits[0], key };
}

// top_job_titles_sponsored is a Python-literal list: "['Product Designer', \"Lead's Title\"]"
export function parseTitleList(s) {
  const out = [];
  for (const m of String(s || '').matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    out.push((m[1] ?? m[2]).trim());
  }
  return out;
}

// ── title → family (the heart of this mode) ──
// Ordered rules, word-boundary regexes, first match wins. Out-of-lane design
// families are tested FIRST so that "Mechanical Design Engineer" never reaches the
// UX rules: the single most common error a keyword filter makes in this lane.
export const FAMILY_RULES = [
  ['hardware-design', /\b(mechanical|asic|rtl|fpga|physical design|circuit|verification|hardware|electrical|mixed[- ]signal|analog|silicon|logic design|component design|process design|power electronics|optical|systems design|device design)\b/i],
  ['architecture', /\barchitectural\b/i],
  ['industrial-design', /\bindustrial design(er)?\b/i],
  ['graphic-brand', /\b(graphic|brand|motion|3d|illustrat\w*|marketing designer|visual designer)\b/i],
  // Customer-facing engineering titles that merely mention a stack ("Solution Engineer
  // Frontend/Backend - Field Services") are not UI engineering. Found by the 2026-10-19
  // full-file audit, where it was the only MA "at-level ui-engineering" sponsor.
  ['unrelated', /\b(solutions? engineer|sales engineer|field services?|field engineer|customer engineer)\b/i],
  ['hybrid-design-engineering', /\b(ux engineer|ui\/ux engineer|ux developer|design technologist|creative technologist|web design engineer|ux prototyper)\b/i],
  ['ui-engineering', /\b(front[- ]?end|ui engineer|ui developer|web developer|web engineer|gui\b.*developer)\b/i],
  ['ux-design', /\b(product designer|product design|ux designer|ui designer|ui\/ux designer|ux\/ui designer|user experience designer|user interface designer|interaction designer|product ux designer|web designer|content designer|ux researcher|design researcher|web and digital interface designers?)\b/i],
  ['software', /\b(software|developer|programmer|sde|full[- ]?stack|back[- ]?end)\b/i],
  ['ambiguous-design', /\bdesign/i],
];
// QA/test titles are SOC 15-1253, not 15-1252: excluded from the software family.
const NOT_SOFTWARE = /\b(test|tester|testing|qa|quality)\b/i;
// A title naming a management role and no individual-contributor noun is SOC 11-xxxx.
const MANAGEMENT = /\b(manager|director|head|vp|chief|president)\b/i;
const IC_NOUN = /\b(designer|engineer|developer|programmer|researcher|technologist)\b/i;
// Above the level a ~24-month-experience candidate is hired at. "II" is at-level.
export const ABOVE_LEVEL = /\b(senior|sr|staff|principal|lead|manager|director|head|vp|chief|founding|iii|iv)\b/i;

export function classifyTitle(title) {
  const t = String(title || '');
  if (MANAGEMENT.test(t) && !IC_NOUN.test(t)) return { family: 'management', above_level: true };
  for (const [family, re] of FAMILY_RULES) {
    if (!re.test(t)) continue;
    if (family === 'software' && NOT_SOFTWARE.test(t)) continue;
    return { family, above_level: ABOVE_LEVEL.test(t) };
  }
  return { family: 'unrelated', above_level: ABOVE_LEVEL.test(t) };
}

// Candidate O*NET-SOC codes per family, and whether the family is in this mode's lane.
// The CANDIDATE LIST is your-input (DEFINE closed in the recipe, with reasoning); the
// wage and Cognitive Pivot numbers read for each candidate are records.
export const FAMILY_SOC = {
  'ux-design':                 { lane: 'in',  soc: ['15-1255.00', '27-1021.00', '27-1024.00'], soc_risk: 'spans computer and arts-and-design occupations' },
  'hybrid-design-engineering': { lane: 'in',  soc: ['15-1255.00', '15-1254.00', '15-1252.00'], soc_risk: 'computer occupations only' },
  'ui-engineering':            { lane: 'in',  soc: ['15-1254.00', '15-1252.00'], soc_risk: 'computer occupations only' },
  'software':                  { lane: 'in',  soc: ['15-1252.00'], soc_risk: 'computer occupations only' },
  'graphic-brand':             { lane: 'out', soc: ['27-1024.00'], why: 'graphic/brand design is an arts-and-design occupation, outside a design-ENGINEER lane' },
  'industrial-design':         { lane: 'out', soc: ['27-1021.00'], why: 'physical-product industrial design, not software interface design' },
  'hardware-design':           { lane: 'out', soc: ['17-2072.00', '17-2141.00', '17-2061.00'], why: 'hardware / mechanical / chip design engineering — the word "design" is a false friend' },
  'architecture':              { lane: 'out', soc: ['17-1011.00'], why: 'building architecture' },
  'management':                { lane: 'out', soc: [], why: 'management title (SOC 11-xxxx), not an individual-contributor role' },
  'unrelated':                 { lane: 'out', soc: [], why: 'no design or front-end term at a word boundary — a keyword-scanner false positive' },
  'ambiguous-design':          { lane: 'ambiguous', soc: [], why: 'says "design" but names no discipline (e.g. "Designer", "Design Engineer") — a person must classify it' },
};

// Which company-side title families count as sponsorship evidence for a posting family.
export const EVIDENCE_FAMILIES = {
  'ux-design': ['ux-design', 'hybrid-design-engineering'],
  'hybrid-design-engineering': ['ux-design', 'hybrid-design-engineering', 'ui-engineering'],
  'ui-engineering': ['ui-engineering', 'hybrid-design-engineering', 'software'],
  'software': ['software', 'ui-engineering', 'hybrid-design-engineering'],
};

// G1 lane gate for a POSTING title. A person may override the family with a basis
// (your-input) — the only way an ambiguous title gets scored.
export function laneFor(role) {
  const auto = classifyTitle(role.title);
  const ov = role.family_override;
  if (ov && ov.family) {
    if (!FAMILY_SOC[ov.family]) return { missing: 'bad-family-override', detail: `unknown family "${ov.family}"` };
    if (!ov.basis) return { missing: 'bad-family-override', detail: 'family_override has no basis — refusing an undocumented reclassification' };
    return { family: ov.family, auto_family: auto.family, label: LABEL.input, basis: ov.basis, ...FAMILY_SOC[ov.family] };
  }
  const spec = FAMILY_SOC[auto.family];
  if (spec.lane === 'ambiguous') return { missing: 'ambiguous-title-family', detail: `"${role.title}": ${spec.why}` };
  return { family: auto.family, auto_family: auto.family, label: LABEL.record, basis: 'fixed title rules (lib.mjs FAMILY_RULES)', ...spec };
}

// G3 — family-matched sponsorship tier. Blank approvals = the row never joined to a
// DOL/USCIS record: ABSENCE OF A RECORD, not a record of zero, so NOT scored.
export function sponsorshipTier(row, postingFamily, params) {
  const raw = row['Total Approvals'];
  if (raw === undefined || String(raw).trim() === '') {
    return { missing: 'no-sponsorship-record', detail: `"${row.company_name}" is in the CSV but has no H-1B approvals field (no DOL/USCIS join)` };
  }
  const approvals = Number(raw);
  if (!Number.isFinite(approvals)) return { missing: 'no-sponsorship-record', detail: `unparseable Total Approvals "${raw}"` };
  const evidence = EVIDENCE_FAMILIES[postingFamily] || [];
  const titles = parseTitleList(row.top_job_titles_sponsored).map((t) => ({ title: t, ...classifyTitle(t) }));
  const matched = titles.filter((t) => evidence.includes(t.family));
  const atLevel = matched.filter((t) => !t.above_level).map((t) => t.title);
  const above = matched.filter((t) => t.above_level).map((t) => t.title);

  let tier, basis;
  if (approvals === 0) { tier = 'None'; basis = 'approvals recorded as 0'; }
  else if (atLevel.length && approvals >= params.min_approvals_for_proven) { tier = 'Proven'; basis = `at-level ${postingFamily}-matched title sponsored and approvals ${approvals} ≥ ${params.min_approvals_for_proven}`; }
  else if (atLevel.length) { tier = 'Likely'; basis = `at-level matched title, but thin record (approvals ${approvals} < ${params.min_approvals_for_proven})`; }
  else if (above.length) { tier = 'Likely'; basis = `sponsors ${postingFamily}-matched titles, but only above this candidate's level`; }
  else { tier = 'Possible'; basis = `sponsors H-1Bs, but no ${postingFamily}-matched title in the top-titles list`; }

  const p = params.tier_p[tier];
  if (typeof p !== 'number') return { missing: 'no-tier-mapping', detail: `tier_p has no value for "${tier}"` };
  return {
    tier, basis, p,
    approvals, denials: row['Total Denials'] === '' ? null : Number(row['Total Denials']),
    approval_rate: row.Approval_Rate === '' ? null : Number(row.Approval_Rate),
    titles_listed: titles.length,
    title_families: titles.map((t) => `${t.title} → ${t.family}${t.above_level ? ' (above level)' : ''}`),
    at_level_matched: atLevel, above_level_matched: above,
  };
}

// ── Cognitive Pivot + wage readout for the candidate SOCs (records) ──
// A blank cognitive_pivot_score is REFUSED, never substituted. In particular, the
// 15-1255.00 row ships with no O*NET ability/skill ratings; the sibling 15-1255.01
// (Video Game Designers) shares the BLS code and HAS a score — borrowing it would
// be exactly the plausible-looking guess this repository forbids.
export function socReadout(blsRows, socCodes) {
  const by = new Map(blsRows.map((r) => [r.onet_soc_code, r]));
  const rows = socCodes.map((code) => {
    const r = by.get(code);
    if (!r) return { onet_soc_code: code, missing: 'no-soc-row', detail: `no row ${code} in the BLS compact table` };
    const score = r.cognitive_pivot_score === '' ? null : Number(r.cognitive_pivot_score);
    const wage = r.annual_median_wage === '' ? null : Number(r.annual_median_wage);
    return {
      onet_soc_code: code, title: r.title, job_zone: r.job_zone === '' ? null : Number(r.job_zone),
      annual_median_wage: wage, oews_year: r.oews_year || null,
      cognitive_pivot_score: score,
      cognitive_pivot_status: score == null ? 'refused: no O*NET ability/skill ratings in the shipped row — not substituted' : 'record',
      label: LABEL.record,
    };
  });
  const wages = rows.map((r) => r.annual_median_wage).filter((w) => typeof w === 'number');
  const scores = rows.map((r) => r.cognitive_pivot_score).filter((s) => typeof s === 'number');
  return {
    candidates: rows,
    wage_spread: wages.length >= 2 ? { min: Math.min(...wages), max: Math.max(...wages), gap: Math.max(...wages) - Math.min(...wages), label: LABEL.record } : null,
    cognitive_pivot_range: scores.length ? { min: Math.min(...scores), max: Math.max(...scores), of: scores.length, refused: rows.length - scores.length } : null,
    primary_refused: rows.length > 0 && rows[0].cognitive_pivot_score == null,
  };
}

// ── liveness: parse the saved stdout of `npm run ats:liveness -- --file <urls>` ──
export function parseLivenessLog(text) {
  const byUrl = new Map();
  const meta = {};
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m0 = line.match(/^#\s*([a-z_]+):\s*(.+)$/i);
    if (m0) { meta[m0[1]] = m0[2].trim(); continue; }
    const m = line.match(/(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (!m) continue;
    const next = lines[i + 1] || '';
    const reason = m[1] !== 'active' && /^\s{6,}\S/.test(next) ? next.trim() : null;
    byUrl.set(m[2], { result: m[1], reason });
  }
  return { byUrl, meta };
}

export function livenessFor(parsed, url) {
  if (!url) return { missing: 'no-liveness-record', detail: 'role has no posting_url' };
  const hit = parsed.byUrl.get(url);
  if (!hit) return { missing: 'no-liveness-record', detail: 'URL not in the saved ats:liveness log' };
  if (hit.result === 'uncertain') return { missing: 'liveness-uncertain', detail: hit.reason || 'checker returned uncertain — a human must open the posting' };
  return { factor: hit.result === 'active' ? 1.0 : 0.0, result: hit.result, reason: hit.reason };
}

// ── G5 eligibility + OPT-clock gate ──
const DAY = 86400000;
const d = (s) => { const t = Date.parse(`${s}T00:00:00Z`); if (!Number.isFinite(t)) throw new Error(`bad date "${s}"`); return t; };
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const ym = (s) => String(s).slice(0, 7);

export function eligibilityTimeline(persona, role, params, asOf) {
  const out = { inputs: {}, closures: [], flags: [] };
  const optStart = d(persona.opt_start_date);
  const used = persona.unemployment_days_used || 0;
  const remaining = persona.unemployment_ceiling_days - used - (persona.buffer_days || 0);
  const clockFrom = Math.max(d(asOf), optStart);
  const deadline = clockFrom + remaining * DAY;
  if (d(asOf) > optStart && used === 0) {
    out.flags.push('as_of is after the OPT start date but unemployment_days_used is 0 — confirm the persona is current');
  }
  out.inputs = {
    as_of: asOf, opt_start_date: persona.opt_start_date, unemployment_ceiling_days: persona.unemployment_ceiling_days,
    unemployment_days_used: used, buffer_days: persona.buffer_days || 0,
    hiring_lag_days: role.hiring_lag_days ?? params.default_hiring_lag_days,
    hiring_lag_source: role.hiring_lag_days == null ? 'scenario default (assumption)' : 'role-specific (your-input)',
    comfort_days: params.comfort_days,
  };

  const p = role.posting || {};
  const gw = p.grad_window;
  if (gw && (ym(persona.program_end_date) < ym(gw.earliest) || ym(persona.program_end_date) > ym(gw.latest))) {
    out.closures.push(`grad-window-excludes: posting accepts graduation ${gw.earliest}…${gw.latest} ("${gw.quote}"), program ends ${ym(persona.program_end_date)}`);
  }
  if (p.requires_clearance_or_citizenship) {
    const needsSponsor = !/citizen|permanent|green card/i.test(persona.authorization || '');
    if (needsSponsor) out.closures.push(`requires-clearance-or-citizenship: "${p.requires_clearance_or_citizenship.quote}" — not open to an F-1/OPT candidate who needs sponsorship`);
  }
  if (p.experience_cap_months != null && persona.prior_experience_months > p.experience_cap_months) {
    out.closures.push(`experience-cap-excludes: posting caps prior experience at ${p.experience_cap_months} months, candidate has ${persona.prior_experience_months}`);
  }
  if (p.experience_min_months != null && persona.prior_experience_months < p.experience_min_months) {
    out.flags.push(`below-stated-minimum: posting asks ${p.experience_min_months} months ("${p.experience_min_quote || ''}"), candidate has ${persona.prior_experience_months} — a fit question, not a gate`);
  }
  const fixedStart = p.start_date ? d(p.start_date) : null;
  if (fixedStart != null && fixedStart < optStart) {
    out.closures.push(`start-before-work-authorization: posting start ${p.start_date} is before OPT start ${persona.opt_start_date}`);
  }

  const lagStart = d(asOf) + out.inputs.hiring_lag_days * DAY;
  const expected = Math.max(fixedStart ?? lagStart, optStart);
  const slack = Math.round((deadline - expected) / DAY);
  out.expected_start = iso(expected);
  out.unemployment_deadline = iso(deadline);
  out.slack_days = slack;
  if (slack <= 0) out.closures.push(`unemployment-clock-exceeded: expected start ${iso(expected)} is after ${iso(deadline)} (${iso(clockFrom)} + ${remaining} usable days)`);

  if (out.closures.length) { out.factor = 0; return out; }
  out.factor = Number(Math.min(1, slack / params.comfort_days).toFixed(3));
  out.arithmetic = `min(1, slack ${slack}d / comfort ${params.comfort_days}d) = ${out.factor}`;
  return out;
}

// Fit is a judgment. It is your-input only once the person has confirmed it;
// an AI-drafted value is passed to the scorer labeled model-judgment.
export function fitFor(role) {
  const f = role.fit;
  if (!f || typeof f.p !== 'number' || f.p < 0 || f.p > 1) return { missing: 'no-fit-input', detail: 'fit.p must be a number in [0, 1]' };
  const confirmed = Boolean(f.confirmed_by);
  return { p: f.p, basis: f.basis || '', label: confirmed ? LABEL.input : LABEL.model, confirmed_by: f.confirmed_by || null, drafted_by: f.drafted_by || null };
}

export function noSponsorOverride(role, persona) {
  const st = role.posting?.states_no_sponsorship;
  if (!st) return null;
  if (/citizen|permanent|green card/i.test(persona.authorization || '')) return null;
  return { decision: 'Skip', reason: `Posting text states no H-1B sponsorship ("${st.quote}", read ${st.read_on}) [your-input]. A historical approval record does not override a current statement.` };
}

export function nextAction(rec, reason, tier, override, readout, tierBasis) {
  const socNote = readout && readout.soc_risk === 'spans computer and arts-and-design occupations'
    ? ' Before an offer, ask the recruiter which SOC code the role would be filed under for H-1B — the answer moves the wage floor and the specialty-occupation argument.' : '';
  if (override) return 'SKIP THIS POSTING: it says it will not sponsor. If you still want this employer, ask a contact whether the policy is team-specific.';
  if (rec === 'Apply') return `TAILOR: lead with the portfolio piece that shows shipped interface code, not only mockups; ask for a referral first.${socNote}`;
  if (rec === 'Consider') return `NETWORK FIRST: ${tier === 'Likely' && tierBasis ? `the sponsorship record is soft — ${tierBasis}` : reason}. Ask about it in a 20-minute informational conversation, then decide.${socNote}`;
  if (/gated: liveness/.test(reason) && (tier === 'Proven' || tier === 'Likely')) return 'NETWORK, DON\'T APPLY: the posting is closed but the matched sponsorship record is real.';
  if (/gated: timeline/.test(reason)) return 'SKIP: an eligibility or OPT-clock gate is closed (see closures); do not spend tailoring time.';
  return 'SKIP: evidence does not justify tailoring time.';
}

export const MISSING_ACTION = {
  'ambiguous-title-family': 'HUMAN CHECK: read the posting\'s responsibilities and set family_override { family, basis } in the scenario — then re-run. Do not guess from the title.',
  'bad-family-override': 'FIX SCENARIO: family_override needs a known family and a one-line basis.',
  'no-company-match': 'HUMAN CHECK: not in the 80 Days CSV — look the employer up on the USCIS H-1B Employer Data Hub by hand; absence here is not evidence of no sponsorship.',
  'ambiguous-company-match': 'HUMAN CHECK: several CSV rows share this name — add the state, or confirm the entity, then re-run.',
  'no-sponsorship-record': 'HUMAN CHECK: in the CSV but never joined to a DOL/USCIS record — check the USCIS hub by hand; do NOT treat this as "does not sponsor".',
  'no-liveness-record': 'RUN: npm run ats:liveness -- <posting_url>, save the output, re-run this triage.',
  'liveness-uncertain': 'HUMAN CHECK: open the posting in a browser, confirm it is live, and record the result in the liveness log.',
  'no-fit-input': 'YOUR INPUT: read the posting and enter fit (0–1) with a one-line basis.',
  'no-tier-mapping': 'FIX SCENARIO: tier_p must map every tier to a number.',
};
