import { z } from 'zod';

import { httpUrlSchema, idSchema, nonEmptyStringSchema } from './common';

export const muscleGroupSchema = z.enum([
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
]);

export const equipmentSchema = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'other',
]);

/** Defines which fields are recorded in each set. */
export const trackingTypeSchema = z.enum(['weight_reps', 'reps', 'time']);

export const exerciseSourceSchema = z.enum(['wger', 'custom']);

export const exerciseSchema = z
  .object({
    id: idSchema,
    name: nonEmptyStringSchema,
    muscleGroup: muscleGroupSchema,
    equipment: equipmentSchema,
    trackingType: trackingTypeSchema,
    /** Plain text, no HTML. */
    instructions: z.string().nullable(),
    imageUrl: httpUrlSchema.nullable(),
    imageAuthor: z.string().nullable(),
    imageLicense: z.string().nullable(),
    source: exerciseSourceSchema,
    /** Id in the external source, used to re-import without duplicates. */
    sourceId: z.string().min(1).nullable(),
  })
  .refine((e) => e.source !== 'wger' || e.sourceId !== null, {
    message: 'Exercises imported from wger need a sourceId',
    path: ['sourceId'],
  });

export type MuscleGroup = z.infer<typeof muscleGroupSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type TrackingType = z.infer<typeof trackingTypeSchema>;
export type ExerciseSource = z.infer<typeof exerciseSourceSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
