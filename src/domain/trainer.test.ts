import { trainerSchema } from './trainer';

const validTrainer = { id: 'trainer-1', firstName: 'Martín', lastName: 'Gómez', avatarUrl: null };

describe('trainerSchema', () => {
  it('accepts a valid trainer', () => {
    expect(trainerSchema.parse(validTrainer)).toEqual(validTrainer);
  });

  it('accepts an avatar URL', () => {
    const trainer = { ...validTrainer, avatarUrl: 'https://example.com/t.jpg' };
    expect(trainerSchema.safeParse(trainer).success).toBe(true);
  });

  it.each([
    ['empty firstName', { firstName: '' }],
    ['empty lastName', { lastName: '' }],
    ['invalid avatarUrl', { avatarUrl: 'avatar.png' }],
  ])('rejects %s', (_label, patch) => {
    expect(trainerSchema.safeParse({ ...validTrainer, ...patch }).success).toBe(false);
  });
});
