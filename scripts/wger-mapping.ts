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

  // Machines and loaded exercises that wger lists without equipment and whose
  // name does not say "machine". The equipment stays "other"; only weight is tracked.
  '71': 'weight_reps', // Extensión de Cuádriceps a una Pierna
  '124': 'weight_reps', // Sentadilla con Disco al Frente
  '139': 'weight_reps', // Pec-Deck Inverso
  '158': 'weight_reps', // Jalón al Pecho con Agarre Cerrado
  '254': 'weight_reps', // Elevaciones Frontales con Disco
  '354': 'weight_reps', // Jalón al pecho (inclinado)
  '355': 'weight_reps', // Jalón al pecho
  '364': 'weight_reps', // Curl femoral
  '366': 'weight_reps', // Curl femoral sentado
  '367': 'weight_reps', // Leg Curls (standing)
  '371': 'weight_reps', // Prensa de piernas
  '373': 'weight_reps', // Prensa de piernas cerrada
  '569': 'weight_reps', // Press de hombros en multipower
  '684': 'weight_reps', // Jalón al pecho con agarre supino
  '691': 'weight_reps', // Remo al mentón en multipower
  '722': 'weight_reps', // Weighted Step-ups
  '916': 'weight_reps', // Prensa Smith
  '1280': 'weight_reps', // Jalón al pecho con agarre estrecho para bíceps
  '1414': 'weight_reps', // Sentadillas Hack
  '1464': 'weight_reps', // Hack squats con pausa
  '1515': 'weight_reps', // Leg Press Toe Press
  '1521': 'weight_reps', // Pendular hack
  '1735': 'weight_reps', // Gluteo en prensa de lado con una pierna
  '1904': 'weight_reps', // Pec Deck
  '1927': 'weight_reps', // Jalón al pecho con agarre supino
  '2623': 'weight_reps', // Plate-Loaded Lat Pulldown
  '2676': 'weight_reps', // Weighted neck flexion
  '2677': 'weight_reps', // Single leg press
};
