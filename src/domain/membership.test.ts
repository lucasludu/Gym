import { membershipSchema } from './membership';

const validMembership = {
  id: 'membership-1',
  userId: 'user-1',
  planId: 'plan-1',
  startDate: '2026-10-01',
  endDate: '2026-11-01',
};

describe('membershipSchema', () => {
  it('accepts a valid membership', () => {
    expect(membershipSchema.parse(validMembership)).toEqual(validMembership);
  });

  it('accepts a membership that starts and ends the same day', () => {
    const membership = { ...validMembership, endDate: '2026-10-01' };
    expect(membershipSchema.safeParse(membership).success).toBe(true);
  });

  it('does not keep derived fields (status, daysLeft)', () => {
    const parsed = membershipSchema.parse({ ...validMembership, status: 'active', daysLeft: 3 });
    expect(parsed).not.toHaveProperty('status');
    expect(parsed).not.toHaveProperty('daysLeft');
  });

  it.each([
    ['endDate before startDate', { endDate: '2026-09-30' }],
    ['startDate as datetime', { startDate: '2026-10-01T00:00:00-03:00' }],
    ['impossible endDate', { endDate: '2026-02-30' }],
    ['empty userId', { userId: '' }],
    ['empty planId', { planId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(membershipSchema.safeParse({ ...validMembership, ...patch }).success).toBe(false);
  });
});
