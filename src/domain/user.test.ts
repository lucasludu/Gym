import { userSchema } from './user';

const validUser = {
  id: 'user-1',
  firstName: 'Lucía',
  lastName: 'Pérez',
  email: 'lucia@example.com',
  avatarUrl: null,
  weeklyGoal: 3,
  createdAt: '2026-01-10T10:00:00-03:00',
};

describe('userSchema', () => {
  it('accepts a valid user', () => {
    expect(userSchema.parse(validUser)).toEqual(validUser);
  });

  it('accepts an avatar URL', () => {
    const user = { ...validUser, avatarUrl: 'https://example.com/a.png' };
    expect(userSchema.safeParse(user).success).toBe(true);
  });

  it('defaults weeklyGoal to 3 when missing', () => {
    const { weeklyGoal: _omit, ...withoutGoal } = validUser;
    expect(userSchema.parse(withoutGoal).weeklyGoal).toBe(3);
  });

  it.each([1, 7])('accepts weeklyGoal %p (range limits)', (weeklyGoal) => {
    expect(userSchema.safeParse({ ...validUser, weeklyGoal }).success).toBe(true);
  });

  it('accepts names of exactly 1 and 50 characters', () => {
    const user = { ...validUser, firstName: 'A', lastName: 'b'.repeat(50) };
    expect(userSchema.safeParse(user).success).toBe(true);
  });

  it.each([
    ['empty firstName', { firstName: '' }],
    ['firstName over 50 chars', { firstName: 'a'.repeat(51) }],
    ['empty lastName', { lastName: '' }],
    ['lastName over 50 chars', { lastName: 'a'.repeat(51) }],
    ['invalid email', { email: 'not-an-email' }],
    ['weeklyGoal 0', { weeklyGoal: 0 }],
    ['weeklyGoal 8', { weeklyGoal: 8 }],
    ['non-integer weeklyGoal', { weeklyGoal: 2.5 }],
    ['invalid avatarUrl', { avatarUrl: 'not-a-url' }],
    ['createdAt without time', { createdAt: '2026-01-10' }],
    ['empty id', { id: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(userSchema.safeParse({ ...validUser, ...patch }).success).toBe(false);
  });
});
