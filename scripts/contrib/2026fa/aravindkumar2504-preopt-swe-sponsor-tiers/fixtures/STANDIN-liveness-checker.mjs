// STANDIN-liveness-checker.mjs: an offline stand-in for scripts/ats/check-liveness.mjs, for h1-liveness tests.
// It prints the real checker's line format for the URLs in --file: the first is active, the second expired with a
// reason line, and the third is left out on purpose (so the wrapper must record it as uncertain). Never used live.
import fs from 'node:fs';

const urls = fs.readFileSync(process.argv[process.argv.indexOf('--file') + 1], 'utf8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
console.log(`Checking ${urls.length} URL(s)...\n`);
if (urls[0]) console.log(`✅ active     ${urls[0]}`);
if (urls[1]) { console.log(`❌ expired    ${urls[1]}`); console.log('           HTTP 404'); }
console.log(`\nResults: 1 active  1 expired  0 uncertain`);
process.exit(1);
