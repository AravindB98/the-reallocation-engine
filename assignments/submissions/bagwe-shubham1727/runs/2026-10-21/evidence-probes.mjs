#!/usr/bin/env node
// evidence-probes.mjs — two read-only probes that back claims made in WORKED-RUN.md.
// Not part of the mode; run once, output committed as terminal/17-*.txt and 18-*.txt.
//   node assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evidence-probes.mjs frames
//   node assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evidence-probes.mjs postings
// frames:   for each posting the engine called "uncertain", list the page's iframes and
//           whether an apply-like control exists inside any frame (the engine looks only
//           at the top document).
// postings: for the 7 postings that reached the fit step, the Greenhouse job API's own
//           dates and every sentence that states years of experience.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const capture = JSON.parse(fs.readFileSync(path.join(HERE, 'capture/capture.json'), 'utf8'));
const APPLY = /\bapply\b|submit application/i;

if (process.argv[2] === 'frames') {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const p of capture.postings.filter((x) => x.liveness?.result === 'uncertain')) {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(3_000);
    const frames = page.frames().filter((f) => f !== page.mainFrame());
    const seen = [];
    for (const f of frames) {
      let controls = [];
      try {
        controls = await f.evaluate(() => Array.from(document.querySelectorAll('a, button, input[type="submit"], [role="button"]'))
          .map((e) => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim()).filter(Boolean));
      } catch { controls = ['<frame not readable>']; }
      const host = (() => { try { return new URL(f.url()).host; } catch { return f.url(); } })();
      seen.push(`${host || '(about:blank)'}: ${controls.filter((c) => APPLY.test(c)).slice(0, 2).join(' / ') || 'no apply-like control'}`);
    }
    console.log(`${p.company} | ${p.title.trim()}\n  ${frames.length} iframe(s)${seen.length ? `\n  - ${seen.join('\n  - ')}` : ''}`);
  }
  await browser.close();
} else if (process.argv[2] === 'postings') {
  const ids = ['7727703003', '7792539003', '7855798003', '7855793003', '8245633', '8769657002', '8696764002'];
  const boards = { 7727703003: 'klaviyo', 7792539003: 'klaviyo', 7855798003: 'klaviyo', 7855793003: 'klaviyo', 8245633: 'toast', 8769657002: 'pathai', 8696764002: 'pathai' };
  for (const id of ids) {
    const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boards[id]}/jobs/${id}`, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; The-Reallocation-Engine/1.0)' } });
    const j = await r.json();
    const text = String(j.content ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const years = [...new Set([...text.matchAll(/[^.;:]{0,70}\b\d+\+?\s*(?:[-–]\s*\d+\s*)?years?\b[^.;]{0,70}/gi)].map((m) => m[0].trim()))];
    console.log(`greenhouse:${id} | ${j.title}\n  first_published ${j.first_published ?? '—'} · updated_at ${j.updated_at ?? '—'}\n  years-of-experience sentences: ${years.length ? years.map((s) => `"${s}"`).join(' | ') : 'none'}`);
  }
} else {
  console.error('usage: evidence-probes.mjs frames|postings'); process.exit(2);
}
