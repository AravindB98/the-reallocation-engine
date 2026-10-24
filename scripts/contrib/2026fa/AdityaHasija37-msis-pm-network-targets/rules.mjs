// rules.mjs — the decision rules for the msis-pm-network-targets recipe.
// Pure functions: no file I/O, no network. Every value they return carries a source
// label — 'record' (read from a data file), 'your-input' (a rule or setting a person
// chose), or 'model-judgment' (none are used here). The thresholds below are the
// human decisions recorded in course/2026fa/submissions/AdityaHasija37/CHANGE-BRIEF.md
// (Revisions, 2026-10-03); changing one is a recipe change, not a tuning knob.

export const SRC = { record: 'record', input: 'your-input', model: 'model-judgment' };

export const SETTINGS = {
  min_approvals: 3,            // your-input: 1–2 approvals is "too thin to trust"
  proven_min_approvals: 10,    // your-input
  proven_min_rate: 90,         // your-input, percent
  p: { Proven: 0.9, Likely: 0.6 }, // your-input; mirrors data/examples/ch11-roles.json
  fit_p: 0.7,                  // your-input: constant "title qualifies" value (see brief)
  hiring_lag_days: 60,         // your-input
  include_senior: true,        // your-input: Senior PM is in range at 3.5 years
};

// ── title / seniority rule (your-input) ─────────────────────────────────────
const TITLE_INCLUDE = /\bproduct\s+(manager|management|analyst)\b/i;
const TITLE_EXCLUDE = /\b(intern(ship)?|associate|apm|director|principal|group|staff|head|vp|vice\s+president|chief)\b/i;
const TITLE_SENIOR = /\b(senior|sr\.?)(?=\s|$|,)/i;
// "Manager, Product Management" / "Senior Manager, Product…" read as people-manager
// roles beyond 1–5 years — excluded (Aditya, 2026-10-03).
const TITLE_PEOPLE_MANAGER = /\bmanager\s*,\s*product\b/i;

export function titleRule(title, { includeSenior = SETTINGS.include_senior } = {}) {
  const t = String(title ?? '').trim();
  if (!t) return { pass: false, reason: 'empty-title', source: SRC.input };
  if (!TITLE_INCLUDE.test(t)) return { pass: false, reason: 'not-a-product-title', source: SRC.input };
  const ex = t.match(TITLE_EXCLUDE);
  if (ex) return { pass: false, reason: `excluded-seniority:${ex[0].toLowerCase()}`, source: SRC.input };
  if (TITLE_PEOPLE_MANAGER.test(t)) return { pass: false, reason: 'excluded-people-manager', source: SRC.input };
  if (!includeSenior && TITLE_SENIOR.test(t)) return { pass: false, reason: 'excluded-senior', source: SRC.input };
  return { pass: true, reason: 'product-title-1-5y', source: SRC.input };
}

// ── US / remote location rule (your-input) ──────────────────────────────────
const US_WORD = /\b(united states|usa|u\.s\.?|us|san francisco|seattle|boston|austin|chicago|los angeles|denver|atlanta|washington,? d\.?c\.?|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i;
const US_STATE = /,\s*(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])\b/; // case-sensitive
const NON_US = /\b(india|united kingdom|uk|canada|germany|france|ireland|netherlands|spain|italy|poland|brazil|mexico|singapore|japan|australia|israel|emea|apac|latam|london|toronto|bangalore|bengaluru|dublin|berlin)\b/i;

// A posting may list several places ("San Francisco, CA • London, UK"). It passes if
// any one place is in the US, or is a bare "Remote" (country not stated — flagged).
export function locationRule(location) {
  const l = String(location ?? '').trim();
  if (!l) return { pass: false, reason: 'location-empty', source: SRC.input };
  const parts = l.split(/\s*(?:;|•|\||\/|\n)\s*/).filter(Boolean);
  let bareRemote = false;
  for (const p of parts) {
    if (NON_US.test(p)) continue;
    if (US_WORD.test(p) || US_STATE.test(p)) return { pass: true, reason: 'us-location', source: SRC.input };
    if (/^remote$/i.test(p)) bareRemote = true;
  }
  if (bareRemote) return { pass: true, reason: 'remote-unspecified-country', source: SRC.input };
  return { pass: false, reason: parts.some((p) => NON_US.test(p)) ? 'non-us-location' : 'location-not-recognised', source: SRC.input };
}

// ── sponsorship tier (counts are record; thresholds are your-input) ──────────
const num = (s) => {
  const t = String(s ?? '').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function sponsorshipTier(row) {
  const approvals = num(row['Total Approvals']);
  const denials = num(row['Total Denials']);
  const rate = num(row['Approval_Rate']);
  const evidence = { approvals, denials, approval_rate: rate, source: SRC.record };
  const rule = { min: SETTINGS.min_approvals, proven: `>=${SETTINGS.proven_min_approvals} approvals and >=${SETTINGS.proven_min_rate}% rate`, source: SRC.input };
  if (approvals == null) return { tier: null, p: null, reason: 'no-trace-in-data', evidence, rule };
  if (approvals < SETTINGS.min_approvals) return { tier: null, p: null, reason: 'below-min-approvals', evidence, rule };
  const proven = approvals >= SETTINGS.proven_min_approvals && rate != null && rate >= SETTINGS.proven_min_rate;
  const tier = proven ? 'Proven' : 'Likely';
  return { tier, p: SETTINGS.p[tier], reason: proven ? 'proven-threshold' : 'likely-threshold', evidence, rule };
}

// ── sponsored-title evidence: parse the CSV's Python-list literal ────────────
export function parseTitleList(cell) {
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  for (const m of String(cell ?? '').matchAll(re)) out.push((m[1] ?? m[2]).replace(/\\(.)/g, '$1').trim());
  return out.filter(Boolean);
}

export function sponsoredProductTitles(row, opts) {
  return parseTitleList(row.top_job_titles_sponsored).filter((t) => titleRule(t, opts).pass);
}

// ── visa timeline gate (your-input dates) ───────────────────────────────────
export class StopError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const DAY = 86_400_000;
export function timelineGate(optEnd, runDate, lagDays = SETTINGS.hiring_lag_days) {
  if (!optEnd) throw new StopError('opt-end-missing', 'Gate C: no OPT/STEM end date in the persona — cannot compute the visa timeline. Stopping.');
  const end = new Date(`${optEnd}T00:00:00Z`);
  const run = new Date(`${runDate}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) throw new StopError('opt-end-invalid', `Gate C: OPT end date "${optEnd}" is not a YYYY-MM-DD date. Stopping.`);
  if (Number.isNaN(run.getTime())) throw new StopError('run-date-invalid', `Gate C: run date "${runDate}" is not a YYYY-MM-DD date. Stopping.`);
  const remaining = Math.floor((end - run) / DAY);
  if (remaining <= 0) throw new StopError('opt-end-past', `Gate C: OPT end date ${optEnd} is not after the run date ${runDate}. Stopping.`);
  if (remaining < lagDays) throw new StopError('timeline-too-short', `Gate C: ${remaining} days left, less than the ${lagDays}-day hiring lag. No role can close in time. Stopping.`);
  return { factor: 1.0, remaining_days: remaining, lag_days: lagDays, opt_end: optEnd, source: SRC.input };
}

// ── role builder: refuses to emit a role with a missing gate value ───────────
// The scorer treats a missing liveness/timeline as factor 1 (an OPEN gate), so a
// role without both gates must never reach it.
export function buildRole({ company, posting, sponsorship, timeline, liveness }) {
  for (const [k, g] of [['liveness', liveness], ['timeline', timeline]]) {
    if (!g || typeof g.factor !== 'number' || !Number.isFinite(g.factor))
      throw new Error(`refusing to emit role for ${company}: ${k} gate value missing (the scorer would read it as open)`);
  }
  if (sponsorship?.p == null) throw new Error(`refusing to emit role for ${company}: no sponsorship tier`);
  return {
    role_id: `${company}::${posting.title}::${posting.url}`,
    company,
    title: posting.title,
    url: posting.url,
    location: posting.location,
    sponsorship: { p: sponsorship.p, tier: sponsorship.tier, source: SRC.record },
    fit: { p: SETTINGS.fit_p, source: SRC.input },
    liveness: { factor: liveness.factor, source: liveness.source },
    timeline: { factor: timeline.factor, source: timeline.source },
  };
}

// ── next action per route (Aditya's choices, 2026-10-03) ───────────────────
export const NEXT_ACTION = {
  Apply: 'Tailor and apply within 2 days, then reach out to the hiring team.',
  Consider: 'Apply, lower priority: after all Apply-route roles are done this week.',
  Skip: 'Skip — time is better spent elsewhere.',
  network: 'Outreach first: find 2 product people there (alumni first), ask for a 20-minute chat now; re-check the board in 2 weeks.',
  'human-check': 'Gate A: open the company careers page; confirm it links to the proposed board before this company can be routed.',
  'board-unknown': 'The board could not be read. Re-try or check by hand; do NOT treat as "no openings".',
  skip: 'Skip — no sponsorship evidence for product roles in this data.',
};
