/**
 * Regenerates the mock data relative to today.
 *
 *   npm run seed
 *
 * Rewrites every collection of mock/db.json except `exercises`, which comes from
 * `npm run import:exercises`. The data itself is built by mock/seed.ts (pure and tested).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildSeed } from '../mock/seed';
import { exerciseSchema } from '../src/domain/exercise';

const DB_PATH = resolve(__dirname, '../mock/db.json');

async function main(): Promise<void> {
  const db: unknown = JSON.parse(await readFile(DB_PATH, 'utf8'));
  if (typeof db !== 'object' || db === null || !('exercises' in db)) {
    throw new Error(`${DB_PATH} has no exercises; run npm run import:exercises first`);
  }

  const exercises = exerciseSchema.array().parse(db.exercises);
  const seed = buildSeed(new Date(), exercises);

  await writeFile(DB_PATH, `${JSON.stringify({ ...seed, exercises }, null, 2)}\n`, 'utf8');

  console.log('Seeded mock/db.json:');
  for (const [name, items] of Object.entries({ ...seed, exercises })) {
    console.log(`  ${name.padEnd(17)} ${items.length}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
