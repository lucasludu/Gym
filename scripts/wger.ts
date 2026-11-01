import { z } from 'zod';

import type { Equipment, Exercise, TrackingType } from '../src/domain/exercise';
import {
  CATEGORY_TO_MUSCLE_GROUP,
  EQUIPMENT_MAP,
  EQUIPMENT_PRIORITY,
  LICENSE_SHORT_NAMES,
  TRACKING_TYPE_EXCEPTIONS,
  WGER_CARDIO_CATEGORY,
  WGER_LANGUAGE_EN,
  WGER_LANGUAGE_ES,
} from './wger-mapping';

/**
 * Pure mapping from wger's `exerciseinfo` format to our Exercise.
 * No network or file access here; see import-exercises.ts for that.
 */

/** Author used when a wger image has none, so the attribution is always shown. */
export const WGER_COMMUNITY_AUTHOR = 'Comunidad de wger';

// Only the fields we use; the rest of the wger response is ignored.
const wgerImageSchema = z.object({
  image: z.url(),
  is_main: z.boolean(),
  is_ai_generated: z.boolean(),
  license: z.number().int(),
  license_author: z.string().nullable(),
});

const wgerTranslationSchema = z.object({
  name: z.string(),
  description: z.string(),
  language: z.number().int(),
});

export const wgerExerciseSchema = z.object({
  id: z.number().int(),
  category: z.object({ id: z.number().int() }),
  equipment: z.array(z.object({ id: z.number().int() })),
  images: z.array(wgerImageSchema),
  translations: z.array(wgerTranslationSchema),
});

export const wgerPageSchema = z.object({
  next: z.string().nullable(),
  results: z.array(z.unknown()),
});

export type WgerImage = z.infer<typeof wgerImageSchema>;
export type WgerExercise = z.infer<typeof wgerExerciseSchema>;

// ---------------------------------------------------------------------------
// stripHtml

const decodeEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/gi, '&'); // last, so "&amp;lt;" stays "&lt;"

/** Converts an HTML description to plain text: one line per paragraph or list item. */
export function stripHtml(html: string): string {
  const text = html
    // Number the items of each ordered list from 1.
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items: string) => {
      let n = 0;
      return items.replace(/<li[^>]*>/gi, () => `\n${(n += 1)}. `);
    })
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '');

  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '' && !/^(-|\d+\.)$/.test(line))
    .join('\n');
}

// ---------------------------------------------------------------------------
// pickMainImage

/**
 * Main image, preferring real photos: non-AI main → first non-AI → AI main → first image.
 */
export function pickMainImage(images: readonly WgerImage[]): WgerImage | null {
  const pick = (candidates: readonly WgerImage[]) =>
    candidates.find((i) => i.is_main) ?? candidates[0] ?? null;
  return pick(images.filter((i) => !i.is_ai_generated)) ?? pick(images);
}

// ---------------------------------------------------------------------------
// mapEquipment

const MACHINE_NAME = /\b(m[aá]quinas?|machines?)\b/i;

/**
 * Our equipment for a wger exercise. A name mentioning a machine wins (wger has no
 * "machine" equipment); otherwise the highest-priority mapped equipment. An empty
 * list means unknown, so it maps to "other", not "bodyweight".
 */
export function mapEquipment(
  wgerIds: readonly number[],
  names: readonly string[],
): { equipment: Equipment; unmappedIds: number[] } {
  const unmappedIds = wgerIds.filter((id) => EQUIPMENT_MAP[id] === undefined);
  if (names.some((name) => MACHINE_NAME.test(name))) return { equipment: 'machine', unmappedIds };

  const mapped = new Set<Equipment>(wgerIds.map((id) => EQUIPMENT_MAP[id] ?? 'other'));
  const equipment = EQUIPMENT_PRIORITY.find((e) => mapped.has(e)) ?? 'other';
  return { equipment, unmappedIds };
}

// ---------------------------------------------------------------------------
// inferTrackingType

const TIME_NAME = /\b(plank|plancha|hold|isom[eé]tric)/i;

const WEIGHTED_EQUIPMENT: ReadonlySet<Equipment> = new Set([
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'kettlebell',
]);

export interface TrackingTypeInput {
  sourceId: string;
  /** Spanish and English names of the exercise. */
  names: readonly string[];
  equipment: Equipment;
  isCardio: boolean;
}

/**
 * Rules in order, the first match wins: exception list → name with a time keyword
 * → cardio → weighted equipment (weight_reps) → anything else (reps).
 */
export function inferTrackingType(input: TrackingTypeInput): TrackingType {
  const exception = TRACKING_TYPE_EXCEPTIONS[input.sourceId];
  if (exception !== undefined) return exception;
  if (input.names.some((name) => TIME_NAME.test(name))) return 'time';
  if (input.isCardio) return 'time';
  if (WEIGHTED_EQUIPMENT.has(input.equipment)) return 'weight_reps';
  return 'reps';
}

// ---------------------------------------------------------------------------
// mapWgerExercise

export type DiscardReason = 'invalid_format' | 'no_translation' | 'unmapped_category';

export type MapResult =
  | { ok: true; exercise: Exercise; warnings: string[] }
  | { ok: false; sourceId: string | null; reason: DiscardReason };

const rawId = (raw: unknown): string | null => {
  if (typeof raw !== 'object' || raw === null || !('id' in raw)) return null;
  const { id } = raw;
  return typeof id === 'number' || typeof id === 'string' ? String(id) : null;
};

/** Maps one wger `exerciseinfo` result to our Exercise, or explains why it is discarded. */
export function mapWgerExercise(raw: unknown): MapResult {
  const parsed = wgerExerciseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, sourceId: rawId(raw), reason: 'invalid_format' };

  const wger = parsed.data;
  const sourceId = String(wger.id);

  const spanish = wger.translations.find((t) => t.language === WGER_LANGUAGE_ES);
  const english = wger.translations.find((t) => t.language === WGER_LANGUAGE_EN);
  const translation = spanish ?? english;
  const name = translation?.name.trim() ?? '';
  if (translation === undefined || name === '') {
    return { ok: false, sourceId, reason: 'no_translation' };
  }

  const muscleGroup = CATEGORY_TO_MUSCLE_GROUP[wger.category.id];
  if (muscleGroup === undefined) return { ok: false, sourceId, reason: 'unmapped_category' };

  const names = [spanish?.name, english?.name].filter((n): n is string => n !== undefined);
  const { equipment, unmappedIds } = mapEquipment(
    wger.equipment.map((e) => e.id),
    names,
  );
  const trackingType = inferTrackingType({
    sourceId,
    names,
    equipment,
    isCardio: wger.category.id === WGER_CARDIO_CATEGORY,
  });

  const image = pickMainImage(wger.images);
  const instructions = stripHtml(translation.description);

  return {
    ok: true,
    warnings: unmappedIds.map((id) => `unmapped_equipment:${id}`),
    exercise: {
      id: `wger-${sourceId}`,
      name,
      muscleGroup,
      equipment,
      trackingType,
      instructions: instructions === '' ? null : instructions,
      imageUrl: image?.image ?? null,
      imageAuthor: image === null ? null : image.license_author?.trim() || WGER_COMMUNITY_AUTHOR,
      imageLicense: image === null ? null : (LICENSE_SHORT_NAMES[image.license] ?? null),
      source: 'wger',
      sourceId,
    },
  };
}

// ---------------------------------------------------------------------------
// mergeExercises

/**
 * Merges imported wger exercises into the existing catalog without duplicates:
 * same sourceId → updated in place (keeping its id); new → appended.
 * Custom exercises and wger exercises missing from the import are kept as they are.
 */
export function mergeExercises(
  existing: readonly Exercise[],
  imported: readonly Exercise[],
): { exercises: Exercise[]; added: number; updated: number } {
  const importedBySourceId = new Map(imported.map((e) => [e.sourceId, e]));
  const matched = new Set<string>();

  const exercises = existing.map((current) => {
    if (current.source !== 'wger' || current.sourceId === null) return current;
    const update = importedBySourceId.get(current.sourceId);
    if (update === undefined) return current;
    matched.add(current.sourceId);
    return { ...update, id: current.id };
  });

  const added = imported.filter((e) => e.sourceId === null || !matched.has(e.sourceId));
  return {
    exercises: [...exercises, ...added],
    added: added.length,
    updated: matched.size,
  };
}
