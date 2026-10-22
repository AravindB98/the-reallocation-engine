// Run from the repository root: node scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/checks/fh_probe.mjs <url> [url...]
// What does the headless browser see on the Fred Hutch iCIMS pages? (read-only probe)
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');
const urls = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
for (const url of urls) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  const top = await page.evaluate(() => (document.body?.innerText ?? '').trim());
  const frames = page.frames();
  let best = 0;
  for (const f of frames) { try { const t = await f.evaluate(() => (document.body?.innerText ?? '').trim().length); best = Math.max(best, t); } catch {} }
  console.log(`${url}\n  HTTP ${resp?.status()} · final ${page.url()}\n  top-level innerText: ${top.length} chars · frames: ${frames.length} · longest frame text: ${best} chars\n  top-level text starts: ${JSON.stringify(top.slice(0, 120))}`);
}
await browser.close();
