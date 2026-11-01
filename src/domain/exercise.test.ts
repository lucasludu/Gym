import { exerciseSchema } from './exercise';

const validWgerExercise = {
  id: 'exercise-1',
  name: 'Sentadilla con barra',
  muscleGroup: 'legs',
  equipment: 'barbell',
  trackingType: 'weight_reps',
  instructions: 'Pararse con los pies al ancho de los hombros.',
  imageUrl: 'https://wger.de/media/exercise-images/squat.png',
  imageAuthor: 'Everkinetic',
  imageLicense: 'CC-BY-SA 4.0',
  source: 'wger',
  sourceId: '111',
};

const validCustomExercise = {
  id: 'exercise-2',
  name: 'Plancha',
  muscleGroup: 'core',
  equipment: 'bodyweight',
  trackingType: 'time',
  instructions: null,
  imageUrl: null,
  imageAuthor: null,
  imageLicense: null,
  source: 'custom',
  sourceId: null,
};

describe('exerciseSchema', () => {
  it('accepts an exercise imported from wger', () => {
    expect(exerciseSchema.parse(validWgerExercise)).toEqual(validWgerExercise);
  });

  it('accepts a custom exercise without image or source id', () => {
    expect(exerciseSchema.parse(validCustomExercise)).toEqual(validCustomExercise);
  });

  it.each(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'])(
    'accepts muscleGroup %p',
    (muscleGroup) => {
      expect(exerciseSchema.safeParse({ ...validWgerExercise, muscleGroup }).success).toBe(true);
    },
  );

  it.each(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other'])(
    'accepts equipment %p',
    (equipment) => {
      expect(exerciseSchema.safeParse({ ...validWgerExercise, equipment }).success).toBe(true);
    },
  );

  it.each(['weight_reps', 'reps', 'time'])('accepts trackingType %p', (trackingType) => {
    expect(exerciseSchema.safeParse({ ...validWgerExercise, trackingType }).success).toBe(true);
  });

  it.each([
    ['empty name', { name: '' }],
    ['unknown muscleGroup', { muscleGroup: 'neck' }],
    ['unknown equipment', { equipment: 'band' }],
    ['unknown trackingType', { trackingType: 'distance' }],
    ['unknown source', { source: 'other' }],
    ['invalid imageUrl', { imageUrl: 'squat.png' }],
    ['wger exercise without sourceId', { sourceId: null }],
  ])('rejects %s', (_label, patch) => {
    expect(exerciseSchema.safeParse({ ...validWgerExercise, ...patch }).success).toBe(false);
  });
});
