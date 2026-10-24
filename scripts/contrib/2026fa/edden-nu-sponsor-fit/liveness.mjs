// Adapter only: use the maintained classifier; do not copy its logic.
import fs from 'node:fs';
import { classifyLiveness } from '../../../ats/liveness-core.mjs';
const snapshots = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(snapshots.map(classifyLiveness)));
