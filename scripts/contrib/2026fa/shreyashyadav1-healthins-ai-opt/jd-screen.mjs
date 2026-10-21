// jd-screen.mjs — deterministic screen of a posting's own text (v0.2.0).
// Pure: text in, findings out. No network, no model.
//
// Why it exists: an F-1/OPT student cannot see "U.S. citizenship required",
// "active security clearance" or "must be a U.S. person (ITAR)" without opening
// every posting, and none of the engine's data files carries it. A phrase in
// the posting is a record (the quote is carried); what the phrase MEANS for this
// person is the rule below (your-input). Silence proves nothing: a posting that
// says none of this may still require it somewhere else.
//
// What is a gate and what is not:
//   citizenship / clearance / U.S.-person requirement → role excluded before scoring
//   E-Verify, "no sponsorship", "authorized to work", "new grads welcome" → shown, never a gate
//   years of experience above what the persona has → excluded by ingest.mjs (persona.max_years_experience_ok), with the quote

export const SCREEN_VERSION = '0.2.0';

function decodeEntities(s) {
  return s.replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/gi, '&');
}

// Greenhouse returns HTML that is itself entity-escaped (&lt;p&gt;): decode,
// strip tags, decode again.
export function htmlToText(html) {
  let s = decodeEntities(String(html ?? ''));
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  return s.replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

// A phrase only counts when it is not negated in its own clause: "We do not
// require U.S. citizenship" must not exclude the role. The clause runs from the
// last sentence break before the match to the match itself.
const NEGATOR = /\b(?:do(?:es)? not|don'?t|doesn'?t|not|never|no|without|neither|nor|regardless of|irrespective of|cannot|can'?t|won'?t)\b|n't\b/i;
function clauseBefore(text, idx) {
  const head = text.slice(Math.max(0, idx - 200), idx);
  const cut = Math.max(head.lastIndexOf('.'), head.lastIndexOf(';'), head.lastIndexOf(':'), head.lastIndexOf('!'), head.lastIndexOf('?'), head.lastIndexOf('\n'));
  return head.slice(cut + 1);
}

function snippetAround(text, idx, len) {
  let from = Math.max(0, idx - 60), to = Math.min(text.length, idx + len + 60);
  // start and end on whole words, never inside one
  if (from > 0) { const sp = text.indexOf(' ', from); if (sp !== -1 && sp < idx) from = sp + 1; }
  if (to < text.length) { const sp = text.lastIndexOf(' ', to); if (sp > idx + len) to = sp; }
  const body = text.slice(from, to).replace(/\s+/g, ' ').trim();
  return `${from > 0 ? '…' : ''}${body.slice(0, 200)}${to < text.length ? '…' : ''}`;
}

function find(text, patterns, { negatable = true } = {}) {
  for (const p of patterns) {
    const re = new RegExp(p.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      if (negatable && NEGATOR.test(clauseBefore(text, m.index))) continue;
      return { found: true, snippet: snippetAround(text, m.index, m[0].length) };
    }
  }
  return { found: false };
}

const US = String.raw`(?:u\.?s\.?a?\.?|united states|american)`;
const CITIZENSHIP = [
  new RegExp(String.raw`\b(?:must|need to|have to|required to|has to)\s+be\s+(?:a\s+)?${US}\s+citizens?\b`),
  new RegExp(String.raw`\b${US}\s+citizenship\s+(?:is\s+|are\s+)?(?:required|mandatory|necessary)\b`),
  new RegExp(String.raw`\b(?:requires?|requiring)\s+${US}\s+citizenship\b`),
  new RegExp(String.raw`\bonly\s+${US}\s+citizens\b`),
  new RegExp(String.raw`\b${US}\s+citizens?\s+(?:only|required)\b`),
];
const CLEARANCE = [
  /\b(?:active|current|valid)\s+(?:ts\/sci|top[- ]secret|secret|dod)\s+(?:security\s+)?clearance\b/,
  /\b(?:ts\/sci|top[- ]secret|secret)\s+(?:security\s+)?clearance\s+(?:is\s+)?(?:required|mandatory)\b/,
  /\b(?:requires?|must\s+(?:have|hold|obtain)|ability\s+to\s+obtain|eligib\w+\s+(?:for|to\s+obtain))\s+(?:an?\s+)?(?:active\s+)?(?:u\.?s\.?\s+)?(?:government\s+)?(?:security\s+)?clearance\b/,
  /\b(?:obtain|maintain|hold|have)(?:\s+and\s+(?:obtain|maintain|hold))?\s+(?:an?\s+)?(?:active\s+)?(?:u\.?s\.?\s+)?public trust\s+(?:clearance|position|determination)\b/, // found in a real posting (Sword Health, 2026-10-20)
];
const US_PERSON = [
  new RegExp(String.raw`\b(?:itar|export[- ]control(?:led)?|export administration regulations)\b[^.]{0,200}\b${US}\s+persons?\b`),
  new RegExp(String.raw`\b(?:must\s+be|only)\s+(?:a\s+)?${US}\s+persons?\b`),
  new RegExp(String.raw`\b${US}\s+persons?\s+(?:only|required)\b`),
];
const NO_SPONSOR = [
  /\b(?:unable|not able|cannot|can'?t|will not|won'?t|do(?:es)? not|don'?t|doesn'?t)\s+(?:to\s+)?(?:offer|provide|sponsor|support)?[^.]{0,40}\bsponsorship\b/,
  /\bno\s+(?:visa\s+)?sponsorship\b/,
  /\bwithout\s+(?:the\s+need\s+for\s+)?(?:current\s+or\s+future\s+)?(?:visa\s+)?sponsorship\b/,
  /\b(?:not\s+require|doesn'?t\s+require)\s+(?:visa\s+)?sponsorship\b/,
  /\bunable\s+to\s+sponsor\b/,
];
const AUTHORIZED = [/\b(?:legally\s+)?(?:authorized|eligible)\s+to\s+work\s+in\s+the\s+(?:u\.?s\.?a?\.?|united states)\b/];

function eVerify(text) {
  const m = /\be-?verify\b/i.exec(text);
  if (!m) return { found: false };
  return { found: true, negated: NEGATOR.test(clauseBefore(text, m.index)), snippet: snippetAround(text, m.index, m[0].length) };
}

// Years of experience the posting asks for. The MINIMUM of a range is what is asked ("1–4 years" asks
// for 1; v0.2.0's first real run read the upper bound and excluded a posting that invites new grads).
// Several statements: the strictest hard minimum wins. "Preferred", "a plus" and the like are soft and
// never count. A phrase counts when it sits on a line that says "experience" or when it starts the line
// (a bullet such as "3–5 years writing production code"); "founded 12 years ago" is neither.
const NUMWORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const toNum = (s) => (/^\d+$/.test(s) ? Number(s) : NUMWORD[s.toLowerCase()]);
const N = String.raw`(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)`;
const YEARS = new RegExp(String.raw`\b${N}\s*(?:(?:[–—-]|\s+to\s+)\s*${N}\s*)?(?:\+|\s+or\s+more)?\s*years?\b`, 'gi');
const SOFT = /\b(preferred|a plus|bonus|nice to have|ideally|desired)\b/i;

function yearsRequired(text) {
  const mentions = [];
  let m;
  YEARS.lastIndex = 0;
  while ((m = YEARS.exec(text)) !== null) {
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    const lineEnd = text.indexOf('\n', m.index + m[0].length);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const before = text.slice(lineStart, m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 140).split(/[.\n]/)[0];
    const startsLine = /^[\s\-•*·–—]*(?:at least|minimum(?: of)?|min\.?|over|more than)?\s*$/i.test(before);
    if (!(startsLine || /experience|exp\./i.test(after))) continue;
    mentions.push({ min: toNum(m[1]), max: m[2] ? toNum(m[2]) : null, soft: SOFT.test(line), snippet: snippetAround(text, m.index, m[0].length) });
  }
  const hard = mentions.filter((x) => !x.soft);
  if (!hard.length) return { found: false, mentions: mentions.slice(0, 5) };
  const best = hard.reduce((a, b) => (b.min > a.min ? b : a));
  return { found: true, value: best.min, upper: best.max, snippet: best.snippet, mentions: mentions.slice(0, 5) };
}

const NEW_GRAD = /\b(new grads?|new graduates?|recent graduates?|entry[- ]level|early[- ]career|university graduates?)\b/i;
function invitesNewGrads(text) {
  const m = NEW_GRAD.exec(text);
  return m ? { found: true, snippet: snippetAround(text, m.index, m[0].length) } : { found: false };
}

export function screenPosting(text, { minChars = 200 } = {}) {
  const t = String(text ?? '');
  if (t.replace(/\s+/g, ' ').trim().length < minChars) {
    return { status: 'missing', reason: 'posting-text-missing-or-too-short', chars: t.length };
  }
  const citizenship_required = find(t, CITIZENSHIP);
  const clearance_required = find(t, CLEARANCE);
  const us_person_required = find(t, US_PERSON);
  return {
    status: 'screened',
    screen_version: SCREEN_VERSION,
    chars: t.length,
    requirement_found: citizenship_required.found || clearance_required.found || us_person_required.found,
    citizenship_required, clearance_required, us_person_required,
    e_verify_mentioned: eVerify(t),
    no_sponsorship_statement: find(t, NO_SPONSOR, { negatable: false }),
    authorized_to_work_statement: find(t, AUTHORIZED, { negatable: false }),
    min_years_experience: yearsRequired(t),
    invites_new_grads: invitesNewGrads(t),
    source: 'record',
    method: 'scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/jd-screen.mjs screenPosting (phrase match on the posting text)',
    note: 'A phrase is a record (quoted). What it means for an F-1/OPT student is the rule in this file (your-input). A posting that says none of this may still require it elsewhere.',
  };
}
