/**
 * Imports the exercise catalog from wger into mock/db.json.
 *
 *   npm run import:exercises
 *
 * Only the `exercises` collection is written; other collections are left as they are.
 * Re-running is idempotent: exercises are matched by sourceId and custom ones are kept.
 * The mapping logic lives in ./wger.ts (pure and tested).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { exerciseSchema, type Exercise } from '../src/domain/exercise';
import { mapWgerExercise, mergeExercises, wgerPageSchema, type DiscardReason } from './wger';

const FIRST_PAGE = 'https://wger.de/api/v2/exerciseinfo/?status=2&limit=100';
const DB_PATH = resolve(__dirname, '../mock/db.json');
const REQUEST_TIMEOUT_MS = 30_000;

async function fetchAllExercises(): Promise<unknown[]> {
  const results: unknown[] = [];
  let url: string | null = FIRST_PAGE;

  while (url !== null) {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`wger responded ${response.status} for ${url}`);

    const page = wgerPageSchema.parse(await response.json());
    results.push(...page.results);
    console.log(`  fetched ${results.length} exercises…`);
    url = page.next;
  }

  return results;
}

async function readDb(): Promise<Record<string, unknown>> {
  const db: unknown = JSON.parse(await readFile(DB_PATH, 'utf8'));
  if (typeof db !== 'object' || db === null || Array.isArray(db)) {
    throw new Error(`${DB_PATH} must contain a JSON object`);
  }
  return db as Record<string, unknown>;
}

async function main(): Promise<void> {
  console.log('Fetching exercises from wger…');
  const raw = await fetchAllExercises();

  const imported: Exercise[] = [];
  const discarded: { sourceId: string | null; reason: DiscardReason }[] = [];
  const warnings: string[] = [];

  for (const item of raw) {
    const result = mapWgerExercise(item);
    if (result.ok) {
      imported.push(result.exercise);
      warnings.push(...result.warnings.map((w) => `wger ${result.exercise.sourceId}: ${w}`));
    } else {
      discarded.push({ sourceId: result.sourceId, reason: result.reason });
    }
  }

  const db = await readDb();
  const existing = exerciseSchema.array().parse(db.exercises ?? []);
  const { exercises, added, updated } = mergeExercises(existing, imported);

  await writeFile(DB_PATH, `${JSON.stringify({ ...db, exercises }, null, 2)}\n`, 'utf8');

  const byReason = discarded.reduce<Record<string, string[]>>((acc, d) => {
    (acc[d.reason] ??= []).push(d.sourceId ?? '?');
    return acc;
  }, {});

  console.log('\nSummary');
  console.log(`  imported (new):  ${added}`);
  console.log(`  updated:         ${updated}`);
  console.log(`  discarded:       ${discarded.length}`);
  for (const [reason, ids] of Object.entries(byReason)) {
    console.log(`    ${reason}: ${ids.length} (wger ids: ${ids.join(', ')})`);
  }
  console.log(`  without image:   ${imported.filter((e) => e.imageUrl === null).length}`);
  console.log(`  total in db:     ${exercises.length}`);
  if (warnings.length > 0) {
    console.log(`  warnings:        ${warnings.length}`);
    warnings.forEach((w) => console.log(`    ${w}`));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
