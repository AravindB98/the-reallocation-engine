// checks.mjs — the three checks this mode adds to Assignment 1's sponsorship + liveness workflow,
// plus the Assignment 2 extension of the vacancy-wording rule. Pure functions, no I/O, no network.
// Contract: recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md (rule version RULES_VERSION).
//
// Every result carries `source: "model-judgment"` (a rule applied to posting text) and the excerpts
// it read. Candidate values are `your-input`. Nothing here is a probability or a match percentage.

import { classifyVacancy } from '../aditya-raj-sde-sponsor-live-jan2027/reality-check.mjs';
import { sentencesOf } from './text.mjs';

export const RULES_VERSION = '0.1.0';
const JUDGMENT = 'model-judgment';

// ── sections ─────────────────────────────────────────────────────────────────
const SEC_PREFERRED = /\b(preferred|nice[- ]to[- ]haves?|bonus|pluses|plus|desired|ideal(ly)?|good to have|even better|extra credit)\b/i;
const SEC_REQUIRED = /\b(minimum|basic|required|requirements?|must[- ]haves?|what you['’]ll need|what we['’]re looking for|we['’]re looking for|you (should|will|must)? ?have|qualifications|who you are|about you|what you bring|you bring|you might be a fit)\b/i;
const SEC_RESP = /\b(responsibilit\w*|what you['’]ll do|what you will do|the role|you will|in this role|day[- ]to[- ]day|what you['’]ll be doing|the impact you|your impact|what you['’]ll work on|the work)\b/i;

export function sectionKind(heading) {
  if (heading === null || heading === undefined) return 'unclassified';
  if (SEC_PREFERRED.test(heading)) return 'preferred';
  if (SEC_REQUIRED.test(heading)) return 'required';
  if (SEC_RESP.test(heading)) return 'responsibilities';
  return 'other';
}

const INLINE_PREF = /\b(preferred|nice to have|is a plus|a plus|bonus|ideally|desirable)\b/i;
const INLINE_REQ = /\b(required|must have|must be|minimum of|at minimum)\b/i;

// Lines (from text.mjs) → [{ section, kind, text }] at sentence granularity.
export function toSentences(lines) {
  const out = []; let heading = null;
  for (const line of lines) {
    if (line.startsWith('## ')) { heading = line.slice(3).trim(); continue; }
    const body = line.startsWith('- ') ? line.slice(2) : line;
    for (const s of sentencesOf(body)) {
      let kind = sectionKind(heading);
      if (INLINE_PREF.test(s)) kind = 'preferred';
      else if (INLINE_REQ.test(s) && kind !== 'preferred') kind = 'required';
      out.push({ section: heading, kind, text: s });
    }
  }
  return out;
}

// ── 1. experience + degree + graduation window ─────────────────────────────
const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15 };
const N = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen)';
const toNum = (s) => (/^\d+$/.test(s) ? Number(s) : NUM_WORDS[s.toLowerCase()]);
const YRS = '(?:years?|yrs?)';
const RE_RANGE = new RegExp(`\\b${N}\\s*(?:-|–|—|to)\\s*${N}\\s*\\+?\\s*${YRS}`, 'i');
const RE_CAP = new RegExp(`\\b(?:no more than|not more than|less than|fewer than|at most|maximum of|a maximum of)\\s+${N}\\s*${YRS}`, 'i');
const RE_MIN = [
  new RegExp(`\\b(?:at least|minimum(?: of)?|min\\.?)\\s+${N}\\s*\\+?\\s*${YRS}`, 'i'),
  new RegExp(`\\b${N}\\s*\\+\\s*${YRS}`, 'i'),
  new RegExp(`\\b${N}\\s*(?:or more|plus)\\s*${YRS}`, 'i'),
  new RegExp(`\\b${N}\\s*${YRS}\\s+(?:of|in|with|working|building|developing|professional|industry|relevant|hands-on|experience)`, 'i'),
];
const EXPERIENCE_CONTEXT = /\b(experience|experienced|working|professional|industry|building|developing|engineering|software)\b/i;
const DEGREE = /\b(bachelor['’]?s|BS|B\.S\.|BA|B\.A\.|master['’]?s|MS|M\.S\.|PhD|Ph\.D\.|doctorate|degree)\b/;
const COOP_ACCEPT = /\b(including|includes|include|counts?|count toward|considered|such as)\b[^.]{0,40}\b(internships?|co-?ops?)\b|\b(internships?|co-?ops?)\b[^.]{0,40}\b(count|counts|considered|included|qualify|acceptable)\b/i;
const COOP_UNCLEAR = /\b(academic|research|professional or academic|industry or academic|equivalent (practical |hands-on )?experience|relevant experience of any kind)\b/i;
const GRAD_WINDOW = /\b(graduat\w*|class of|recent graduates?|new grads?|degree completion)\b/i;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MON_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const SEASON_RE = '(spring|summer|fall|autumn|winter)';
const monthIndex = (m) => MONTHS.findIndex((x) => x.startsWith(m.toLowerCase().slice(0, 3)));

export function yearMentions(text) {
  const out = [];
  const r = text.match(RE_RANGE);
  if (r) out.push({ kind: 'range', min: toNum(r[1]), max: toNum(r[2]), phrase: r[0] });
  const c = text.match(RE_CAP);
  if (c) out.push({ kind: 'cap', max: toNum(c[1]), phrase: c[0] });
  if (!r) {
    for (const re of RE_MIN) {
      for (const m of text.matchAll(new RegExp(re.source, 'gi'))) {
        if (c && m.index !== undefined && c[0].includes(m[0])) continue;
        out.push({ kind: 'min', min: toNum(m[1]), phrase: m[0] });
      }
    }
  }
  // de-duplicate identical numbers from overlapping patterns
  const seen = new Set();
  return out.filter((x) => { const k = `${x.kind}|${x.min}|${x.max}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

// candidate: { full_time_months, coop_months, degrees: [{level, field, end}], available_from }
export function checkExperience(sentences, candidate) {
  const ft = candidate.full_time_months / 12;
  const withCoop = (candidate.full_time_months + candidate.coop_months) / 12;
  const coopAcceptance = sentences.filter((s) => COOP_ACCEPT.test(s.text));
  const coopUnclear = sentences.filter((s) => COOP_UNCLEAR.test(s.text) && EXPERIENCE_CONTEXT.test(s.text));
  const findings = [];
  for (const s of sentences) {
    if (!EXPERIENCE_CONTEXT.test(s.text)) continue;
    const ms = yearMentions(s.text);
    if (!ms.length) continue;
    const alternatives = ms.filter((m) => m.kind !== 'cap').length > 1 || (DEGREE.test(s.text) && /\bor\b/i.test(s.text) && ms.length >= 1 && /\b(with|and)\b/i.test(s.text));
    for (const m of ms) {
      const f = { sentence: s.text, section: s.section, kind: s.kind, requirement: m, alternatives };
      if (m.kind === 'cap') {
        f.state = ft > m.max ? 'explicit-cap-exceeded' : 'within-cap';
      } else if (alternatives) {
        f.state = 'alternative-requirements';
      } else {
        const min = m.min;
        if (ft >= min) f.state = m.kind === 'range' && ft > m.max ? 'above-stated-range' : 'meets';
        else if (withCoop >= min) {
          if (coopAcceptance.length) f.state = 'meets-with-coop-explicitly-accepted';
          else if (coopUnclear.length) f.state = 'coop-would-change-result-unclear-wording';
          else f.state = 'below-stated-minimum-coop-excluded';
        } else f.state = 'below-stated-minimum';
      }
      findings.push(f);
    }
  }
  // graduation-window restrictions
  const grad = [];
  for (const s of sentences) {
    if (!GRAD_WINDOW.test(s.text)) continue;
    const between = s.text.match(new RegExp(`\\b${MON_RE}\\s+(20\\d\\d)\\b[^.]{0,30}?\\b(?:and|to|through|-|–)\\s+${MON_RE}\\s+(20\\d\\d)\\b`, 'i'));
    const g = { sentence: s.text, section: s.section, kind: s.kind };
    const end = candidate.degrees.find((d) => d.level === 'MS')?.end; // 'YYYY-MM'
    if (between && end) {
      const lo = `${between[2]}-${String(monthIndex(between[1]) + 1).padStart(2, '0')}`;
      const hi = `${between[4]}-${String(monthIndex(between[3]) + 1).padStart(2, '0')}`;
      g.window = { from: lo, to: hi };
      g.state = end >= lo && end <= hi ? 'graduation-inside-stated-window' : 'graduation-outside-stated-window';
    } else g.state = 'graduation-wording-without-window';
    grad.push(g);
  }
  // degree wording (recorded for a person; only an unconditional PhD requirement is flagged)
  const degree = sentences.filter((s) => DEGREE.test(s.text) && /\b(degree|bachelor|master|phd|doctorate|BS|MS)\b/i.test(s.text)).map((s) => ({
    sentence: s.text, section: s.section, kind: s.kind,
    state: /\b(PhD|Ph\.D\.|doctorate)\b/.test(s.text) && !/\bor\b/i.test(s.text) && s.kind === 'required' ? 'phd-required-review' : /\brelated\b|\bequivalent\b/i.test(s.text) ? 'field-or-equivalence-wording' : 'degree-mentioned',
  }));

  // decision for this check
  const req = (f) => f.kind === 'required';
  const reqMins = findings.filter((f) => req(f) && f.requirement.kind !== 'cap');
  const unclassified = findings.filter((f) => f.kind === 'unclassified' || f.kind === 'other' || f.kind === 'responsibilities');
  let state; let gate; let why;
  const cap = findings.find((f) => f.state === 'explicit-cap-exceeded' && f.kind !== 'preferred');
  const gradOut = grad.find((g) => g.state === 'graduation-outside-stated-window' && g.kind === 'required');
  const below = reqMins.filter((f) => f.state === 'below-stated-minimum' || f.state === 'below-stated-minimum-coop-excluded');
  const meets = reqMins.filter((f) => f.state === 'meets' || f.state === 'meets-with-coop-explicitly-accepted');
  if (cap) { state = 'explicit-eligibility-restriction'; gate = 'stop'; why = `explicit experience cap: "${cap.requirement.phrase}" (candidate: ${ft} years full-time)`; }
  else if (gradOut) { state = 'explicit-eligibility-restriction'; gate = 'stop'; why = `graduation window ${gradOut.window.from}..${gradOut.window.to} excludes the candidate's stated completion`; }
  else if (findings.some((f) => req(f) && f.state === 'coop-would-change-result-unclear-wording')) { state = 'coop-counting-unclear'; gate = 'review'; why = 'counting the co-op would change the result and the wording does not say whether it counts'; }
  else if (findings.some((f) => f.state === 'alternative-requirements' && f.kind !== 'preferred')) { state = 'alternative-requirements'; gate = 'review'; why = 'either/or or degree-conditioned years: a person decides which branch applies'; }
  else if (below.length && meets.length) { state = 'requirements-disagree'; gate = 'review'; why = `required minimums disagree for this candidate (${below.map((f) => f.requirement.phrase).join('; ')} vs ${meets.map((f) => f.requirement.phrase).join('; ')})`; }
  else if (below.length) {
    const f = below.sort((a, b) => b.requirement.min - a.requirement.min)[0];
    state = 'documented-mismatch'; gate = 'stop';
    why = `stated required minimum "${f.requirement.phrase}" is above the candidate's ${ft} years full-time${f.state === 'below-stated-minimum-coop-excluded' ? ` (with the ${candidate.coop_months}-month co-op it would be ${withCoop}; the posting does not say co-ops count, so it is excluded by default)` : ''}. A documented mismatch, not a claim the employer could never make an exception`;
  }
  else if (reqMins.some((f) => f.state === 'above-stated-range')) { state = 'possible-level-mismatch'; gate = 'review'; why = 'candidate is above the top of an ordinary stated range (not an eligibility restriction)'; }
  else if (!reqMins.length && unclassified.some((f) => /^below/.test(f.state) || f.state === 'coop-would-change-result-unclear-wording')) { state = 'requirement-section-unclear'; gate = 'review'; why = 'a years requirement the candidate may not meet appears outside a clearly labeled required section'; }
  else if (degree.some((d) => d.state === 'phd-required-review')) { state = 'degree-requirement-review'; gate = 'review'; why = 'an unconditional PhD requirement is stated'; }
  else if (meets.length) { state = 'meets-stated-required-minimums'; gate = 'pass'; why = `meets every stated required minimum (${meets.map((f) => f.requirement.phrase).join('; ')}) on full-time experience`; }
  else { state = 'experience-requirement-unstated'; gate = 'pass-unknown'; why = 'no required years stated in a recognizable form; unknown, not a match'; }
  return {
    state, gate, why, source: JUDGMENT,
    candidate: { full_time_years: ft, coop_months: candidate.coop_months, coop_counted: state === 'meets-stated-required-minimums' && findings.some((f) => f.state === 'meets-with-coop-explicitly-accepted'), source: 'your-input' },
    findings, graduation: grad, degree, coop_acceptance_excerpts: coopAcceptance.map((s) => s.text),
    note: 'Title words (senior/staff/principal) are never used by this check.',
  };
}

// ── 2. stack evidence ───────────────────────────────────────────────────────
export const STACK_GROUPS = {
  java_jvm: [/\bjava\b(?![\s-]*script)/i, /\bjvm\b/i, /\bkotlin\b/i, /\bscala\b/i],
  spring: [/\bspring\s+(boot|framework|cloud|mvc|data|batch)\b/i],
  distributed_systems: [/\bdistributed\s+(systems?|computing|services)\b/i, /\bmicro-?services?\b/i, /\bfault[- ]toleran\w*/i, /\bhigh(ly)?[- ]availab\w*/i, /\bconcurren\w*/i, /\bscalab\w*/i, /\bconsensus\b/i],
  messaging: [/\bkafka\b/i, /\brabbitmq\b/i, /\b(sqs|sns|kinesis|pulsar|nats)\b/i, /\bpub\/?sub\b/i, /\bmessage\s+(queue|broker|bus)s?\b/i, /\bevent[- ]driven\b/i],
  cloud_infra: [/\baws\b/i, /\bamazon web services\b/i, /\bgcp\b|\bgoogle cloud\b/i, /\bazure\b/i, /\bkubernetes\b|\bk8s\b/i, /\bdocker\b/i, /\bterraform\b/i, /\b(eks|gke|aks)\b/i],
  applied_ai_infra: [/\bllms?\b/i, /\blarge language models?\b/i, /\brag\b/i, /\bretrieval[- ]augmented\b/i, /\bvector (database|search|store)s?\b/i, /\bembeddings?\b/i, /\b(model|ml) (serving|inference|infrastructure|platform)\b/i, /\binference\b/i, /\bagentic\b|\bai agents?\b/i, /\bmachine learning\b/i],
};
const OTHER_LANG = /\b(go|golang|c\+\+|rust|python|ruby|c#|\.net|typescript|node\.js|php|elixir|haskell)\b/i;
const LANG_DEMAND = /\b(proficien\w*|expert\w*|expertise|strong|fluency|fluent|deep|extensive|professional)\b[^.]{0,60}\b(in|with)\b/i;
const NEGATED_JAVA = /\b(no|not|without)\b[^.]{0,30}\bjava\b(?![\s-]*script)|\bjava\b(?![\s-]*script)[^.]{0,25}\b(not required|not necessary|not needed)\b/i;
const RANK = { required: 4, responsibilities: 3, preferred: 2, other: 1, unclassified: 1 };

export function checkStack(sentences, textChars) {
  const groups = {};
  for (const [g, pats] of Object.entries(STACK_GROUPS)) {
    const hits = [];
    for (const s of sentences) {
      if (g === 'java_jvm' && NEGATED_JAVA.test(s.text)) { hits.push({ ...s, negated: true }); continue; }
      const terms = pats.map((p) => s.text.match(p)?.[0]).filter(Boolean);
      if (terms.length) hits.push({ ...s, terms: [...new Set(terms.map((t) => t.toLowerCase()))] });
    }
    const real = hits.filter((h) => !h.negated);
    const best = real.sort((a, b) => RANK[b.kind] - RANK[a.kind])[0];
    groups[g] = { where: best ? best.kind : 'not-mentioned', terms: [...new Set(real.flatMap((h) => h.terms))], excerpts: real.slice(0, 3).map((h) => ({ section: h.section, kind: h.kind, text: h.text })), negated: hits.filter((h) => h.negated).map((h) => h.text) };
  }
  const otherLangRequired = sentences.filter((s) => s.kind === 'required' && OTHER_LANG.test(s.text) && LANG_DEMAND.test(s.text) && !STACK_GROUPS.java_jvm.some((p) => p.test(s.text)));
  const javaCore = ['required', 'responsibilities'].includes(groups.java_jvm.where);
  const backendCore = ['distributed_systems', 'messaging', 'cloud_infra'].some((g) => groups[g].where !== 'not-mentioned');
  let state; let gate; let why;
  if (textChars < 400) { state = 'insufficient-text'; gate = 'review'; why = `only ${textChars} characters of posting text`; }
  else if (otherLangRequired.length && !javaCore) { state = 'other-language-required'; gate = 'review'; why = `a required line names another language without Java: "${otherLangRequired[0].text}"`; }
  else if (javaCore && backendCore) { state = 'core-stack-evidenced'; gate = 'pass'; why = `JVM language in ${groups.java_jvm.where} lines, plus backend-infrastructure terms`; }
  else if (groups.java_jvm.where !== 'not-mentioned') { state = 'java-mentioned-outside-core'; gate = 'review'; why = `JVM language appears only in ${groups.java_jvm.where} lines`; }
  else { state = 'java-not-evidenced'; gate = 'review'; why = 'no JVM-language evidence in the posting text'; }
  return { state, gate, why, source: JUDGMENT, groups, other_language_required: otherLangRequired.map((s) => s.text), note: 'Evidence locations, not a match score. Applied-AI infrastructure is optional and never required for a pass.' };
}

// ── 3. start window ─────────────────────────────────────────────────────────
const SEASONS = { spring: [3, 5], summer: [6, 8], fall: [9, 11], autumn: [9, 11] }; // winter spans a year boundary → review
const START_WORD = /\b(start(?:ing|s)?|start date|begin(?:ning|s)?|commence\w*|join(?:ing)?|onboard\w*|available|availability)\b/i;
const RE_DATED = new RegExp(`\\b${MON_RE}\\.?\\s+(?:\\d{1,2},?\\s+)?(20\\d\\d)\\b`, 'gi');
const RE_SEASON = new RegExp(`\\b${SEASON_RE}\\s+(?:of\\s+)?(20\\d\\d)\\b`, 'gi');
const RE_ASAP = /\b(asap|as soon as possible|immediate(?:ly)?\s+(?:start|availability|joiner)|start\s+immediately|available\s+immediately|immediate\s+start)\b/i;
const RE_WITHIN = /\bwithin\s+(\d+|one|two|three|four|six|eight)\s+(days?|weeks?|months?)\b/i;
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // m is 1-based

export function checkStartWindow(sentences, availableFrom, capturedAt) {
  const statements = [];
  for (const s of sentences) {
    if (!START_WORD.test(s.text) && !RE_ASAP.test(s.text)) continue;
    if (RE_ASAP.test(s.text) && (START_WORD.test(s.text) || /\basap\b/i.test(s.text))) statements.push({ type: 'asap', sentence: s.text, section: s.section });
    const w = s.text.match(RE_WITHIN);
    if (w && START_WORD.test(s.text) && /\b(offer|accept\w*)\b/i.test(s.text)) statements.push({ type: 'relative', amount: toNum(w[1]), unit: w[2].toLowerCase().replace(/s$/, ''), sentence: s.text, section: s.section });
    if (!START_WORD.test(s.text)) continue;
    for (const m of s.text.matchAll(RE_DATED)) {
      const y = Number(m[2]); const mo = monthIndex(m[1]) + 1;
      statements.push({ type: 'dated', window: { from: `${y}-${String(mo).padStart(2, '0')}-01`, to: lastDay(y, mo) }, phrase: m[0], sentence: s.text, section: s.section });
    }
    for (const m of s.text.matchAll(RE_SEASON)) {
      const season = m[1].toLowerCase(); const y = Number(m[2]);
      if (season === 'winter') { statements.push({ type: 'season-ambiguous', phrase: m[0], sentence: s.text, section: s.section }); continue; }
      const [a, b] = SEASONS[season];
      statements.push({ type: 'dated', window: { from: `${y}-${String(a).padStart(2, '0')}-01`, to: lastDay(y, b) }, phrase: m[0], sentence: s.text, section: s.section });
    }
  }
  const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  const arithmetic = { available_from: availableFrom, captured_at: capturedAt, days_from_capture_to_availability: capturedAt ? days(capturedAt.slice(0, 10), availableFrom) : null };
  const dated = statements.filter((x) => x.type === 'dated');
  for (const d of dated) d.compatible_by_date = d.window.to >= availableFrom; // candidate can start inside the stated window
  const unresolved = statements.filter((x) => ['asap', 'relative', 'season-ambiguous'].includes(x.type));
  let state; let gate; let why;
  const conflicts = dated.filter((d) => !d.compatible_by_date); const fits = dated.filter((d) => d.compatible_by_date);
  if (!statements.length) { state = 'employer-timing-unstated'; gate = 'pass-unknown'; why = 'the posting states no start timing; unknown — confirm with the employer'; }
  else if ((conflicts.length && fits.length) || (dated.length && unresolved.length)) { state = 'conflicting-timing-statements'; gate = 'review'; why = 'the posting makes more than one timing statement that do not agree'; }
  else if (conflicts.length) { state = 'explicit-date-conflict'; gate = 'stop'; why = `stated start "${conflicts[0].phrase}" ends ${conflicts[0].window.to}, before the supplied availability ${availableFrom}`; }
  else if (unresolved.some((x) => x.type === 'relative')) {
    const r = unresolved.find((x) => x.type === 'relative');
    state = 'relative-to-offer-date'; gate = 'review'; why = `start is tied to the offer date ("within ${r.amount} ${r.unit}"); the offer date is unknown, so compatibility is unresolved`;
  }
  else if (unresolved.length) { state = 'asap-or-ambiguous-unresolved'; gate = 'review'; why = `"${unresolved[0].sentence}" — not an exact date; proves neither compatibility nor conflict`; }
  else { state = 'stated-window-compatible-by-date'; gate = 'pass'; why = `stated start "${fits[0].phrase}" (window ends ${fits[0].window.to}) is on or after availability ${availableFrom} by date arithmetic only`; }
  return { state, gate, why, source: JUDGMENT, statements, arithmetic, does_not_establish: ['work authorization or EAD approval', 'legal eligibility to start', 'how long hiring will take'] };
}

// ── 4. vacancy wording: Assignment 1 classifier + Assignment 2 extensions ──
const A2_REFUSAL = [
  /\bmust\s+not\s+(?:now\s+or\s+in\s+the\s+future\s+)?require\s+(?:\w+\s+){0,2}sponsorship/i,
  /\bnot\s+(?:be\s+)?eligible\s+for\s+(?:\w+\s+){0,2}sponsorship/i,
  /\b(?:does|do|will)\s+not\s+(?:provide|offer)\s+(?:\w+\s+){0,2}sponsorship/i,
];
const A2_QUESTION = /\b(will you|do you|are you going to|would you)\b[^?.]{0,80}\b(require|need)\b[^?.]{0,40}\bsponsor\w*/i;
const CITIZEN_REQUIRED = /\b(u\.?s\.?|united states)\s+citizen(ship)?\b[^.]{0,40}\b(required|is required|must|only)\b|\bmust\s+be\s+(?:a\s+)?(?:u\.?s\.?|united states)\s+(citizen|person)\b|\b(only|exclusively)\s+(?:open\s+to\s+)?(?:u\.?s\.?|united states)\s+citizens\b/i;
const CLEARANCE = /\b(security\s+clearance|clearance\s+(?:is\s+)?required|ability\s+to\s+obtain\s+(?:and\s+maintain\s+)?(?:a\s+)?(?:\w+\s+)?clearance|active\s+(?:secret|top secret|ts\/sci)|ts\/sci|itar|export[- ]control\w*|u\.?s\.?\s+persons?)\b/i;

export function checkVacancy(sentences) {
  const text = sentences.map((s) => s.text).join(' ');
  const a1 = classifyVacancy(text);
  const a2Refusal = sentences.filter((s) => A2_REFUSAL.some((p) => p.test(s.text))).map((s) => s.text);
  const question = sentences.filter((s) => A2_QUESTION.test(s.text)).map((s) => s.text);
  const citizen = sentences.filter((s) => CITIZEN_REQUIRED.test(s.text)).map((s) => s.text);
  const clearance = sentences.filter((s) => CLEARANCE.test(s.text)).map((s) => s.text);
  let state = a1.state; let basis = 'assignment-1 classifier';
  if (a2Refusal.length && state !== 'explicit-refusal') {
    state = state === 'apparent-offer' || state === 'contradictory' ? 'contradictory' : 'explicit-refusal'; basis = 'assignment-2 refusal extension';
  }
  if (state === 'silent' && question.length) { state = 'asks-about-sponsorship'; basis = 'assignment-2 application-question extension'; }
  let eligibility = 'none-stated';
  if (citizen.length) eligibility = 'citizenship-required';
  else if (clearance.length) eligibility = 'clearance-or-export-control-wording';
  return { state, basis, excerpts: [...new Set([...a1.excerpts, ...a2Refusal, ...question])], eligibility, eligibility_excerpts: [...citizen, ...clearance], source: JUDGMENT };
}

// The union of every pattern above — used by the excerpt extractor so that the committed excerpts
// contain every sentence any rule reads (equivalence with the full text is then CHECKED, not assumed).
export function isRelevantSentence(text) {
  const t = String(text);
  return yearMentions(t).length > 0 || DEGREE.test(t) || GRAD_WINDOW.test(t) || COOP_ACCEPT.test(t) || COOP_UNCLEAR.test(t)
    || START_WORD.test(t) || RE_ASAP.test(t) || RE_WITHIN.test(t)
    || /\b(sponsor\w*|visa|immigration|authori[sz]\w*|citizen\w*|clearance|itar|export|u\.?s\.? persons?|work permit|right to work)\b/i.test(t)
    || Object.values(STACK_GROUPS).flat().some((p) => p.test(t)) || (OTHER_LANG.test(t) && LANG_DEMAND.test(t)) || NEGATED_JAVA.test(t)
    || INLINE_PREF.test(t) || INLINE_REQ.test(t);
}
