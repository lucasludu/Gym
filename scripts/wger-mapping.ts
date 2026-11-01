import type { Equipment, MuscleGroup, TrackingType } from '../src/domain/exercise';

/**
 * Mapping tables from wger ids to our enums. Ids come from
 * https://wger.de/api/v2/exercisecategory/, /equipment/, /language/ and /license/.
 */

export const WGER_LANGUAGE_ES = 4;
export const WGER_LANGUAGE_EN = 2;

export const WGER_CARDIO_CATEGORY = 15;

/** wger category → muscle group. Categories not listed are discarded. */
export const CATEGORY_TO_MUSCLE_GROUP: Readonly<Record<number, MuscleGroup>> = {
  8: 'arms', // Arms
  9: 'legs', // Legs
  10: 'core', // Abs
  11: 'chest', // Chest
  12: 'back', // Back
  13: 'shoulders', // Shoulders
  14: 'legs', // Calves
  [WGER_CARDIO_CATEGORY]: 'full_body', // Cardio
};

/** wger equipment → our equipment. Ids not listed map to "other" and are reported. */
export const EQUIPMENT_MAP: Readonly<Record<number, Equipment>> = {
  1: 'barbell', // Barbell
  2: 'barbell', // SZ-Bar
  3: 'dumbbell', // Dumbbell
  4: 'other', // Gym mat
  5: 'other', // Swiss Ball
  6: 'bodyweight', // Pull-up bar
  7: 'bodyweight', // none (bodyweight exercise)
  8: 'other', // Bench
  9: 'other', // Incline bench
  10: 'kettlebell', // Kettlebell
  11: 'other', // Resistance band
  12: 'cable', // Cable machine
};

/** When an exercise lists several pieces of equipment, the first one in this order wins. */
export const EQUIPMENT_PRIORITY: readonly Equipment[] = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'other',
  'bodyweight',
];

/** wger license id → short name shown in the attribution. */
export const LICENSE_SHORT_NAMES: Readonly<Record<number, string>> = {
  1: 'CC-BY-SA 3',
  2: 'CC-BY-SA 4',
  3: 'CC0',
  4: 'CC-BY 4',
  5: 'ODbL',
};

/**
 * Manual trackingType corrections by wger id. They win over every inferred rule.
 * Mostly dynamic exercises whose name contains "plank"/"hold", and cardio counted in reps.
 */
export const TRACKING_TYPE_EXCEPTIONS: Readonly<Record<string, TrackingType>> = {
  '112': 'reps', // Body-Ups / Plancha a Flexión
  '312': 'reps', // Incline Plank With Alternate Floor Touch
  '314': 'reps', // Isometric Wipers
  '1022': 'weight_reps', // Single Arm Plank to Row
  '1091': 'reps', // Plank Shoulder Taps
  '1099': 'weight_reps', // Dynamic side hold (kettlebell)
  '1288': 'reps', // Dynamic side plank
  '1406': 'reps', // Plank-to-Elbow Extension
  '1410': 'reps', // Plank with Alternating Leg Lift
  '1489': 'reps', // Plank Jacks
  '1766': 'reps', // Plank Reach
  '927': 'reps', // Suspended crosses / flexiones en TRX (cardio)
  '1115': 'reps', // 3D lunge warmup (cardio)
  '1373': 'reps', // box jumps (cardio)
  '1525': 'reps', // Ball Slams (cardio)
};
