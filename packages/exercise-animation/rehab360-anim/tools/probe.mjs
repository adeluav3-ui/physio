// Quick numeric probe: node tools/probe.mjs <id> <t> [landmark ...]
import fs from 'fs';
import { solve, point } from '../engine/skeleton.js';
import { buildExercise } from '../engine/sampler.js';
const lib = JSON.parse(fs.readFileSync(new URL('../data/poses.json', import.meta.url)));
const [id, t, ...names] = process.argv.slice(2);
const ex = buildExercise(lib, id, null);
for (const tt of t.split(',')) {
  const s = ex.sample(+tt);
  const S = solve(s.pose, s.pins).seg;
  console.log('t=' + tt, s.phase, names.map((n) => n + ' ' + point(S, n).map((v) => v.toFixed(3)).join(',')).join(' | '));
}
