// Reassembles the generated whole files from their byte parts.
// The wholes are gitignored; the committed sources are the parts.
// Run automatically via the predev/prebuild/prepreview npm hooks,
// or manually: node tools/reassemble.mjs
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_PART_BYTES = 30000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  {
    whole: 'src/engine/kelp/life.js',
    parts: [
      'src/engine/kelp/life.parts/life.part01.js',
      'src/engine/kelp/life.parts/life.part02.js',
    ],
  },
  {
    whole: 'src/engine/kelp/giant.js',
    parts: [
      'src/engine/kelp/giant.parts/giant.part01.js',
      'src/engine/kelp/giant.parts/giant.part02.js',
    ],
  },
  {
    whole: 'src/engine/hydrology.js',
    parts: [
      'src/engine/hydrology.parts/hydrology.part01.js',
      'src/engine/hydrology.parts/hydrology.part02.js',
    ],
  },
  {
    whole: 'src/engine/boat-runtime.js',
    parts: [
      'src/engine/boat-runtime.parts/boat-runtime.part01.js',
      'src/engine/boat-runtime.parts/boat-runtime.part02.js',
    ],
  },
  {
    whole: 'src/engine/island/part09.js',
    parts: [
      'src/engine/island/part09.parts/part09.part01.js',
      'src/engine/island/part09.parts/part09.part02.js',
    ],
  },
  {
    whole: 'src/engine/island/part13.js',
    parts: [
      'src/engine/island/part13.parts/part13.part01.js',
      'src/engine/island/part13.parts/part13.part02.js',
    ],
  },
  {
    whole: 'src/engine/island/part16.js',
    parts: [
      'src/engine/island/part16.parts/part16.part01.js',
      'src/engine/island/part16.parts/part16.part02.js',
    ],
  },
  {
    whole: 'src/engine/island/part20.js',
    parts: [
      'src/engine/island/part20.parts/part20.part01.js',
      'src/engine/island/part20.parts/part20.part02.js',
    ],
  },
  {
    whole: 'src/engine/terrain/part08.js',
    parts: [
      'src/engine/terrain/part08.parts/part08.part01.js',
      'src/engine/terrain/part08.parts/part08.part02.js',
    ],
  },
];

let failed = false;
for (const target of TARGETS) {
  const chunks = [];
  let targetOk = true;
  for (const part of target.parts) {
    const partPath = join(root, part);
    const size = statSync(partPath).size;
    if (size > MAX_PART_BYTES) {
      console.error(`reassemble: part exceeds ${MAX_PART_BYTES} bytes (${size}): ${part}`);
      targetOk = false;
      failed = true;
      continue;
    }
    chunks.push(readFileSync(partPath));
  }
  if (!targetOk) continue;
  const whole = Buffer.concat(chunks);
  writeFileSync(join(root, target.whole), whole);
  console.log(`reassemble: wrote ${target.whole} (${whole.length} bytes from ${target.parts.length} parts)`);
}
if (failed) {
  console.error('reassemble: failed — fix the oversized part(s) above.');
  process.exit(1);
}
