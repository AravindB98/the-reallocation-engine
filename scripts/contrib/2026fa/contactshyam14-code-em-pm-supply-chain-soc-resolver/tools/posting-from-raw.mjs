#!/usr/bin/env node
// posting-from-raw.mjs — turn a fetched real posting (Greenhouse board-API JSON or
// a SAP SuccessFactors career-site HTML page) plus a hand-written meta file into
// the posting JSON soc-resolver.mjs reads.
//
// The raw file and the output both live in inputs/raw/ (git-excluded): the full
// posting text is the employer's, so only short quoted evidence reaches tracked
// files. The meta file (tracked) holds your-input only: place → metro mapping,
// employer-name aliases, third-party job-board claims.
//
//   node tools/posting-from-raw.mjs --meta inputs/postings/real/x.meta.json --raw inputs/raw/x/file --out inputs/raw/x/posting.json
//
// Offline. Exit 2 on usage / unreadable input.

import fs from 'node:fs';
import crypto from 'node:crypto';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const metaPath = arg('--meta'), rawPath = arg('--raw'), outPath = arg('--out');
if (!metaPath || !rawPath || !outPath) { console.error('usage: posting-from-raw.mjs --meta m.json --raw file --out posting.json'); process.exit(2); }

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "'")
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&');
export const htmlToText = (html) => decode(html).replace(/<\/(p|li|h\d|div|tr)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const raw = fs.readFileSync(rawPath, 'utf8');
const sha = crypto.createHash('sha256').update(fs.readFileSync(rawPath)).digest('hex');
let extracted;
if (meta.raw_format === 'greenhouse-json') {
  const j = JSON.parse(raw);
  extracted = { title: j.title, company: String(j.company_name || '').trim(), place: j.location?.name ?? null, url: j.absolute_url,
    text: htmlToText(decode(j.content || '')), facts: { first_published: j.first_published, updated_at: j.updated_at, requisition_id: j.requisition_id, departments: (j.departments || []).map((d) => d.name) } };
} else if (meta.raw_format === 'successfactors-html') {
  const prop = (p) => (raw.match(new RegExp(`itemprop="${p}"\\s+content="([^"]*)"`)) || [])[1] ?? null;
  const body = (raw.match(/<span class="jobdescription">([\s\S]*?)<\/span>\s*<\/div>/i) || [])[1];
  if (!body) { console.error('no <span class="jobdescription"> block found — page layout changed; refusing to guess'); process.exit(2); }
  const title = (raw.match(/<span[^>]*itemprop="title"[^>]*>([\s\S]*?)<\/span>/i) || [])[1];
  extracted = { title: title ? htmlToText(title) : null, company: prop('hiringOrganization'),
    place: [prop('addressLocality'), prop('addressRegion'), prop('postalCode')].filter(Boolean).join(', '), url: meta.url,
    text: htmlToText(body), facts: { datePosted: prop('datePosted'), validThrough: prop('validThrough') } };
} else { console.error(`unknown raw_format ${meta.raw_format}`); process.exit(2); }

for (const k of ['title', 'company', 'text']) if (!extracted[k]) { console.error(`could not extract ${k} from ${rawPath}`); process.exit(2); }
const posting = {
  id: meta.id, kind: 'real', title: extracted.title, company: extracted.company, url: meta.url ?? extracted.url,
  place: extracted.place, metro: meta.metro, employer_names: meta.employer_names, third_party_claims: meta.third_party_claims || [],
  text: extracted.text,
  source: { what: `${meta.raw_format} fetched ${meta.fetched_at_utc}`, fetch_command: meta.fetch_command, fetched_at_utc: meta.fetched_at_utc, raw_sha256: sha, raw_bytes: Buffer.byteLength(raw), facts: extracted.facts },
};
fs.writeFileSync(outPath, JSON.stringify(posting, null, 2));
console.log(`${posting.id}: "${posting.title}" — ${posting.company} · ${posting.place} · ${posting.text.length} chars · raw sha256 ${sha.slice(0, 12)}… → ${outPath}`);
