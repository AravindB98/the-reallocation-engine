// A stand-in that is NOT the repository's scorer but gives exactly its answers: it runs the real one with the
// same arguments. Used to prove that a run made with any other scorer file says so, loudly, in its outputs.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'score', 'role-scorer.mjs'), ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
