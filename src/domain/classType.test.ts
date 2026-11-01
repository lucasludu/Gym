import { classColorSchema, classTypeSchema } from './classType';

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
    'accentOrange',
    'accentBlue',
    'accentGreen',
    'accentPurple',
    'accentPink',
    'accentTeal',
  ])('accepts color token %p', (color) => {
    expect(classTypeSchema.safeParse({ ...validClassType, color }).success).toBe(true);
  });

  it('exposes the 6 accent tokens', () => {
    expect(classColorSchema.options).toHaveLength(6);
  });

  it.each([
    ['unknown intensity', { intensity: 'extreme' }],
    ['durationMinutes 0', { durationMinutes: 0 }],
    ['non-integer durationMinutes', { durationMinutes: 45.5 }],
    ['hex color instead of a theme token', { color: '#FF8800' }],
    ['empty color', { color: '' }],
    ['a camelCase token outside the accent list', { color: 'accentYellow' }],
    ['a non-accent theme token', { color: 'background' }],
    ['empty name', { name: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(classTypeSchema.safeParse({ ...validClassType, ...patch }).success).toBe(false);
  });
});
