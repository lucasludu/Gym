import { classTypeSchema } from './classType';

const validClassType = {
  id: 'class-type-1',
  name: 'Funcional',
  description: 'Entrenamiento funcional de alta intensidad.',
  durationMinutes: 60,
  intensity: 'high',
  color: 'accentOrange',
};

describe('classTypeSchema', () => {
  it('accepts a valid class type', () => {
    expect(classTypeSchema.parse(validClassType)).toEqual(validClassType);
  });

  it.each(['low', 'medium', 'high'])('accepts intensity %p', (intensity) => {
    expect(classTypeSchema.safeParse({ ...validClassType, intensity }).success).toBe(true);
  });

  it.each([
    ['unknown intensity', { intensity: 'extreme' }],
    ['durationMinutes 0', { durationMinutes: 0 }],
    ['non-integer durationMinutes', { durationMinutes: 45.5 }],
    ['hex color instead of a theme token', { color: '#FF8800' }],
    ['empty color', { color: '' }],
    ['empty name', { name: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(classTypeSchema.safeParse({ ...validClassType, ...patch }).success).toBe(false);
  });
});
