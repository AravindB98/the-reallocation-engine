// live-lib.mjs — pure rules for the swe-opt-clock-live mode.
// Recipe: recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md
//
// Nothing here touches the network or writes files. capture.mjs (the only
// network step) uses the title rule only to choose which postings to open in a
// browser; evaluate.mjs (offline) re-applies every rule from the raw titles, so a
// rule fixed here reaches old captures too.
//
// Evidence rules that already exist in the sample-mode prototype (sponsor tier,
// clock, timeline factor, scorer conformance) are imported from there, not
// copied: ../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs.

import { LABEL, SWE_TITLE, SENIOR_TITLE, parseDate, iso, diffDays } from '../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs';

// ── recipe rules for live mode (each is a recipe choice → your-input) ───────
export const LIVE_RULES = {
  // A liveness result older than this is not evidence about today. Tighter than
  // sample mode's 7 days: new-grad postings at these companies close in days.
  capture_max_age_days: 3,
  // Title levels above this are treated as experienced-hire roles.
  max_level: 2,
  // The 2-hour application block needs at least this fit when the sponsorship
  // vote alone already clears the scorer's Apply threshold (Proven 0.9 × 0.35 =
  // 0.315 ≥ 0.30). Found on the first live run: a 5+-years posting rated 0.1 came
  // out Apply. The scorer's recommendation is reported unchanged; only the block moves.
  apply_block_min_fit: 0.5,
};

// True when the scorer said Apply only because of the sponsorship vote: that vote's
// contribution alone reaches the threshold, and the fit is below the block floor.
export function sponsorshipOnlyApply(score, threshold, fitP) {
  if (score?.recommendation !== 'Apply') return false;
  const sponsor = score.trace?.votes?.find((v) => v.factor === 'sponsorship');
  return Boolean(sponsor) && sponsor.contribution * (score.trace?.gate_product ?? 1) >= threshold && (fitP ?? 0) < LIVE_RULES.apply_block_min_fit;
}

// A gate at or below this is closed: the same value as CONFIG.gate_zero in
// scripts/score/role-scorer.mjs and the check in the sample-mode lib's
// checkScorerOutput. Below it the scorer says Skip whatever the votes.
export const GATE_ZERO = 0.05;

// The local calendar date. Run dates, capture dates and check dates all use it,
// so an evening capture is never "after" its own run date in UTC.
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── title filter: the same semantics as scripts/ats/scan.mjs buildTitleFilter ─
// scan.mjs does not export it (proposed addition 6). Every capture also runs the
// real scan on the same boards and compares the postings that pass, one by one.
export function buildTitleFilter(titleFilter) {
  const positive = (titleFilter?.positive || []).map((k) => k.toLowerCase());
  const negative = (titleFilter?.negative || []).map((k) => k.toLowerCase());
  return (title) => {
    const lower = String(title ?? '').toLowerCase();
    const hasPositive = positive.length === 0 || positive.some((k) => lower.includes(k));
    const hasNegative = negative.some((k) => lower.includes(k));
    return hasPositive && !hasNegative;
  };
}

// One board's jobs through the scan's filters, in scan.mjs main()'s order and
// with its dedup keys: title → location → seen URL or seen company::title.
// `seen` is shared across boards, as in the scan. Returns the passing jobs and counts.
export function filterBoardJobs(jobs, { titleFilter, locationFilter, seen }) {
  const counts = { found: jobs.length, filtered_title: 0, filtered_location: 0, duplicates: 0, passed: 0 };
  const passed = [];
  for (const j of jobs) {
    if (!titleFilter(j.title)) { counts.filtered_title++; continue; }
    if (!locationFilter(j.location)) { counts.filtered_location++; continue; }
    const key = `${j.company.toLowerCase()}::${j.title.toLowerCase()}`;
    if (seen.urls.has(j.url) || seen.keys.has(key)) { counts.duplicates++; continue; }
    seen.urls.add(j.url); seen.keys.add(key);
    counts.passed++; passed.push(j);
  }
  return { passed, counts };
}

// The line scan.mjs prints for each new offer: "  + company | title | location".
export const scanOfferKey = (j) => `${j.company} | ${j.title} | ${j.location || 'N/A'}`;

// Compare the postings the capture's filters passed with the ones the engine's
// scan printed. scan.mjs also dedups against a student's private scan history,
// which a capture never reads, so the scan may legitimately show *fewer* offers,
// but only by its extra duplicates, and never one the capture lacks.
export function compareWithScan(captureKeys, scanKeys, captureDuplicates, scanDuplicates) {
  const cap = new Set(captureKeys), scan = new Set(scanKeys);
  const onlyInScan = [...scan].filter((k) => !cap.has(k));
  const onlyInCapture = [...cap].filter((k) => !scan.has(k));
  const extraScanDuplicates = (scanDuplicates ?? 0) - (captureDuplicates ?? 0);
  const match = onlyInScan.length === 0 && onlyInCapture.length === extraScanDuplicates && extraScanDuplicates >= 0;
  return { match, only_in_scan: onlyInScan, only_in_capture: onlyInCapture, extra_scan_duplicates: extraScanDuplicates };
}

// ── new-grad title rules ─────────────────────────────────────────────────────
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };
const ENTRY_MARKER = /\b(new\s+grad(uate)?s?|early[- ]career|entry[- ]level|junior|jr\.?|associate|university\s+grad(uate)?|graduate)\b/i;
const ROLE = '(?:engineer|developer|sde|swe)';
const LEVEL_ROMAN = new RegExp(`\\b${ROLE}[\\s,(\\-–]*(vi|iv|v|i{1,3})\\b\\)?`, 'i');
const LEVEL_DIGIT = new RegExp(`\\b${ROLE}[\\s,(\\-–]*([1-6])\\b`, 'i');
const LEVEL_WORD = /\blevel\s*([1-6])\b|\bL([3-7])\b/i;

// The level a title states, if any: "Software Engineer II" → 2, "SWE - 3" → 3,
// "Software Engineer (III)" → 3, "Level 3" → 3.
export function titleLevel(title) {
  const t = String(title ?? '');
  const roman = LEVEL_ROMAN.exec(t);
  if (roman) return ROMAN[roman[1].toLowerCase()];
  const digit = LEVEL_DIGIT.exec(t);
  if (digit) return Number(digit[1]);
  const word = LEVEL_WORD.exec(t);
  if (word) return Number(word[1] ?? word[2]);
  return null;
}

// Classify one title for this domain. Returns { pass, code, level, entry_marker }.
export function newGradTitle(title) {
  const t = String(title ?? '');
  const level = titleLevel(t);
  const entry = ENTRY_MARKER.test(t);
  if (!SWE_TITLE.test(t)) return { pass: false, code: 'not-swe-title', level, entry_marker: entry };
  if (SENIOR_TITLE.test(t)) return { pass: false, code: 'senior-title', level, entry_marker: entry };
  if (level != null && level > LIVE_RULES.max_level) return { pass: false, code: `level-${level}`, level, entry_marker: entry };
  return { pass: true, code: entry ? 'entry-marked' : level != null ? `level-${level}` : 'unmarked', level, entry_marker: entry };
}

// ── cohort start stated in the title ("Software Engineer - June 2027 New Grads") ─
// A "new grad 2027" posting hires next year's graduating class: for a student who
// has already graduated and is burning unemployment days, the start date printed
// in the title is binding. Of every date named, the earliest wins; a month or
// season counts from its first day; a year alone counts from Jan 1. Each choice
// is the earliest reading, so the rule never closes a gate early.
const PERIOD_START = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11, winter: 0, spring: 2, summer: 5, fall: 8, autumn: 8 };
// Whole month names or their abbreviations only, so "Marketing" is not March.
const PERIOD = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|winter|spring|summer|fall|autumn)\b\.?/gi;
const YEAR = /\b(20\d\d)\b/g;
const PERIOD_WINDOW = 24; // a month/season belongs to a year only if named just before it

export function cohortStart(title) {
  const t = String(title ?? '');
  if (!/\b(new\s+grad|graduate|university|campus|early[- ]career)/i.test(t)) return null;
  const dates = [];
  let from = 0;
  for (const y of t.matchAll(YEAR)) {
    const year = Number(y[1]);
    const lead = t.slice(Math.max(from, y.index - PERIOD_WINDOW), y.index);
    const periods = [...lead.matchAll(PERIOD)];
    for (const p of periods) {
      const word = p[1].toLowerCase();
      dates.push({ year, month: PERIOD_START[word] ?? PERIOD_START[word.slice(0, 3)], text: `${p[0]} ${y[1]}`, precision: 'month-or-season' });
    }
    if (!periods.length) dates.push({ year, month: 0, text: y[1], precision: 'year' });
    from = y.index + y[0].length;
  }
  if (!dates.length) return null;
  const first = dates.reduce((a, b) => (Date.UTC(b.year, b.month, 1) < Date.UTC(a.year, a.month, 1) ? b : a));
  return { date: iso(new Date(Date.UTC(first.year, first.month, 1))), precision: first.precision, matched: first.text };
}

// ── G4b: the scorer's own arithmetic must add up to what it was fed ─────────
// The sample-mode check (checkScorerOutput) only catches a gate bug when some gate
// is closed. On the first live run no gate was closed under the what-if clock, so
// an additive-gates scorer passed it. This holds the scorer to its printed trace:
// the votes and gates it shows are the ones it was given, and its composite equals
// (Σ value · weight) × Π multipliers. It checks the scorer; it does not re-score.
const close = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-3;
export function checkScorerArithmetic(scores, fed) {
  const problems = [];
  const out = new Map((scores?.roles ?? []).map((r) => [r.role_id, r]));
  for (const f of fed) {
    const s = out.get(f.role_id);
    if (!s) continue; // a missing role is already reported by checkScorerOutput
    const votes = s.trace?.votes ?? [], gates = s.trace?.gates ?? [];
    for (const key of ['sponsorship', 'fit']) {
      const shown = votes.find((v) => v.factor === key);
      if (f[key] && !close(shown?.value, f[key].p)) problems.push(`role ${f.role_id}: ${key} fed as ${f[key].p} but the trace shows ${shown?.value ?? 'nothing'}`);
    }
    for (const key of ['liveness', 'timeline']) {
      const shown = gates.find((g) => g.factor === key);
      if (!close(shown?.multiplier, f[key].factor)) problems.push(`role ${f.role_id}: ${key} gate fed as ${f[key].factor} but the trace shows ${shown?.multiplier ?? 'nothing'}`);
    }
    const expected = votes.reduce((sum, v) => sum + v.value * v.weight, 0) * gates.reduce((p, g) => p * g.multiplier, 1);
    if (!Number.isFinite(expected)) problems.push(`role ${f.role_id}: composite ${s.composite} cannot be recomputed from its own trace (a vote or gate is missing a number)`);
    else if (!close(s.composite, expected)) problems.push(`role ${f.role_id}: composite ${s.composite} ≠ (Σ value·weight) × Π gates = ${Number(expected.toFixed(4))} from its own trace`);
  }
  return problems;
}

// ── redirect rule on top of the engine's liveness classifier ────────────────
// A dead Greenhouse posting can redirect, with HTTP 200, to the company's
// careers home page. If that page shows an "Apply" button anywhere, the engine's
// classifier reads the dead posting as active. The posting's own id must survive
// the navigation for "active" to count.
export function postingIdOf(url) {
  const u = String(url ?? '');
  const gh = /[?&]gh_jid=(\d+)/.exec(u) || /\/jobs\/(\d+)/.exec(u);
  if (gh) return gh[1];
  const uuid = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(u);
  return uuid ? uuid[1].toLowerCase() : null;
}

export function idRetained(url, finalUrl) {
  const id = postingIdOf(url);
  if (!id) return null; // no id to follow: the rule does not apply
  // Whole-token match: a short id like "1" must not "survive" inside some other number.
  return new RegExp(`(^|[^0-9a-z])${id}([^0-9a-z]|$)`).test(String(finalUrl ?? '').toLowerCase());
}

// ── G2: liveness from a capture record ──────────────────────────────────────
// `check` is what capture.mjs stored: the engine classifier's verdict, the final
// URL the browser ended on, and the local date it looked (checked_date).
export function livenessFromCapture(check, asOf, maxAge = LIVE_RULES.capture_max_age_days) {
  if (!check) return { hold: true, code: 'not-checked', detail: 'capture has no liveness check for this posting', factor: null };
  const checked = parseDate(check.checked_date);
  if (!checked) return { hold: true, code: 'check-undated', detail: 'liveness check has no checked_date', factor: null };
  const age = diffDays(asOf, checked);
  const base = { classifier: { result: check.result, code: check.code, reason: check.reason }, checked_at: check.checked_at ?? null, checked_date: iso(checked),
    age_days: age, final_url: check.final_url ?? null, id_retained: check.id_retained ?? null, capture_mode: 'live-fetch', label: LABEL.record };
  if (age < 0) return { ...base, hold: true, code: 'check-after-run-date', detail: `checked ${iso(checked)}, after the run date`, factor: null };
  if (age > maxAge) return { ...base, hold: true, code: 'check-stale', detail: `checked ${age} days before the run (> ${maxAge}); re-capture`, factor: null };
  if (check.result === 'expired') return { ...base, hold: false, code: check.code, detail: check.reason, factor: 0 };
  if (check.id_retained === false)
    return { ...base, hold: true, code: 'redirected-off-posting', detail: `browser left the posting (ended on ${check.final_url}); the engine said "${check.result}", which this rule does not trust`, factor: null };
  if (check.result === 'active') return { ...base, hold: false, code: check.code, detail: check.reason, factor: 1 };
  return { ...base, hold: true, code: check.code, detail: `classifier says uncertain: ${check.reason}`, factor: null };
}

// ── G3 input: the start date this role implies ─────────────────────────────
// The hiring time is the floor: an interview loop takes as long as it takes, even
// for a cohort that "starts" sooner. A cohort date printed in the title can only
// push the start later, never earlier.
export function startLag(company, cohort, assumptions, asOf) {
  const o = assumptions?.overrides?.[company];
  const a = o ?? assumptions?.default;
  if (!a || typeof a.days !== 'number') return { lag_days: null, basis: null, source: null, kind: 'missing' };
  const hiring = { lag_days: a.days, basis: a.basis ?? null, source: a.source === LABEL.model ? LABEL.model : LABEL.input, kind: o ? 'company-override' : 'default-assumption' };
  if (!cohort) return hiring;
  const cohortLag = diffDays(parseDate(cohort.date), asOf);
  if (cohortLag <= hiring.lag_days) return { ...hiring, cohort_lag_days: cohortLag, basis: `${hiring.basis} (title states "${cohort.matched}" → ${cohort.date}, sooner than hiring could finish)` };
  return { lag_days: cohortLag, basis: `title states "${cohort.matched}" → earliest start ${cohort.date}, later than the ${hiring.lag_days}-day hiring time`, source: LABEL.record, kind: 'title-cohort', hiring_lag_days: hiring.lag_days };
}
