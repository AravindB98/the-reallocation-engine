#!/usr/bin/env node
// fetch-pay-ranges.mjs — ingest step. Reads board-map.json, pulls each public board with
// its pay fields switched on, and writes ONE snapshot file. The classifier
// (wage-level.mjs) only ever reads the snapshot; it never touches the network.
//
// Hosts: boards-api.greenhouse.io (…/jobs?content=true&pay_transparency=true) and
//        api.ashbyhq.com (…/job-board/<slug>?includeCompensation=true). Nothing else.
//
// Pay evidence is stored in two labeled kinds and never merged:
//   ats-structured — the ATS's own pay field (Greenhouse pay_input_ranges, Ashby Salary component)
//   posting-text   — a dollar range found by regex in the description (weaker; G4 checks it)
//
//   node scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-pay-ranges.mjs \
//     --out course/2026fa/submissions/mayank-1024/mode-build/runs/<date>/pay-snapshot.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchJson } from '../../../ats/providers/_http.mjs';
import { htmlToText, rangesFromText } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MAP = opt('--board-map', path.join(HERE, 'board-map.json'));
const OUT = opt('--out', null);
// Broad on purpose: the ingest keeps every engineering-shaped title; the persona's
// patterns narrow it later, so a pattern change never needs a re-fetch.
const KEEP = /engineer|developer|software|programmer|\bsre\b|devops|architect/i;
if (!OUT) { console.error('usage: fetch-pay-ranges.mjs --out <run-folder>/pay-snapshot.json'); process.exit(2); }

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

async function greenhouse(slug) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true&pay_transparency=true`;
  const j = await fetchJson(url, { redirect: 'error', timeoutMs: 30_000 });
  const jobs = Array.isArray(j?.jobs) ? j.jobs : [];
  return {
    api: url, job_count: jobs.length,
    postings: jobs.filter(x => KEEP.test(x.title || '')).map(x => {
      const text = htmlToText(x.content);
      return {
        id: String(x.id), title: x.title, location: x.location?.name || '',
        url: x.absolute_url, updated_at: x.updated_at || null,
        pay_structured: (x.pay_input_ranges || []).map(p => ({
          min: p.min_cents / 100, max: p.max_cents / 100, currency: p.currency_type || null,
          interval: null, label: (p.title || '').trim() || null,
        })),
        pay_text: rangesFromText(text),
      };
    }),
  };
}

async function ashby(slug) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`;
  const j = await fetchJson(url, { redirect: 'error', timeoutMs: 30_000 });
  const jobs = Array.isArray(j?.jobs) ? j.jobs : [];
  return {
    api: url, job_count: jobs.length,
    postings: jobs.filter(x => KEEP.test(x.title || '')).map(x => {
      const comps = [
        ...(x.compensation?.summaryComponents || []).map(c => ({ ...c, _tier: null })),
      ];
      const tiers = x.compensation?.compensationTiers || [];
      for (const t of tiers) for (const c of t.components || []) comps.push({ ...c, _tier: t.title || null });
      const salary = comps.filter(c => c.compensationType === 'Salary' && c.minValue != null);
      const locs = [x.location, ...(x.secondaryLocations || []).map(s => s.location)].filter(Boolean);
      return {
        id: String(x.id), title: x.title, location: locs.join('; ') + (x.isRemote ? '; Remote' : ''),
        url: x.jobUrl, updated_at: x.publishedAt || null,
        pay_structured: dedupe(salary.map(c => ({
          min: c.minValue, max: c.maxValue ?? c.minValue, currency: c.currencyCode || null,
          interval: c.interval || null, label: c._tier,
        }))),
        pay_text: rangesFromText(htmlToText(x.descriptionPlain || x.descriptionHtml || '')),
      };
    }),
  };
}

function dedupe(list) {
  const seen = new Set();
  return list.filter(p => { const k = `${p.min}|${p.max}|${p.currency}|${p.interval}|${p.label}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

const boards = [];
for (const c of map.companies) {
  const base = { csv_company: c.csv_company, ats: c.ats, slug: c.slug, identity_confirmed: !!c.identity_confirmed };
  try {
    const r = c.ats === 'greenhouse' ? await greenhouse(c.slug) : c.ats === 'ashby' ? await ashby(c.slug) : null;
    if (!r) { boards.push({ ...base, status: 'error', error: `unsupported ats ${c.ats}` }); continue; }
    boards.push({ ...base, status: 'ok', ...r });
    const s = r.postings.filter(p => p.pay_structured.length).length, t = r.postings.filter(p => p.pay_text.length).length;
    console.log(`${c.csv_company.padEnd(36)} ${c.ats.padEnd(10)} jobs ${String(r.job_count).padStart(4)}  eng ${String(r.postings.length).padStart(3)}  pay:structured ${String(s).padStart(3)}  pay:text ${String(t).padStart(3)}`);
  } catch (e) {
    boards.push({ ...base, status: 'error', error: String(e.message || e).slice(0, 200) });
    console.log(`${c.csv_company.padEnd(36)} ${c.ats.padEnd(10)} ERROR ${String(e.message || e).slice(0, 80)}`);
  }
}
const snap = { captured_at: new Date().toISOString(), board_map: path.relative(process.cwd(), MAP), keep_title_pattern: KEEP.source, boards };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(snap, null, 1) + '\n');
console.log(`wrote ${OUT} — ${boards.filter(b => b.status === 'ok').length}/${boards.length} boards ok, ${boards.reduce((n, b) => n + (b.postings?.length || 0), 0)} engineering postings`);
