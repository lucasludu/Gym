import { getDaysLeft, getMembershipStatus, membershipSchema } from './membership';

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

describe('getDaysLeft', () => {
  const membership = { ...validMembership, endDate: '2026-11-10' };

  it('counts the days until endDate', () => {
    expect(getDaysLeft(membership, '2026-11-03')).toBe(7);
  });

  it('returns 0 on the endDate itself', () => {
    expect(getDaysLeft(membership, '2026-11-10')).toBe(0);
  });

  it('returns a negative number once expired', () => {
    expect(getDaysLeft(membership, '2026-11-11')).toBe(-1);
    expect(getDaysLeft(membership, '2026-11-20')).toBe(-10);
  });

  it('counts across a month change', () => {
    expect(getDaysLeft({ ...validMembership, endDate: '2026-12-02' }, '2026-11-28')).toBe(4);
  });

  it('uses the Buenos Aires date when today is a datetime or a Date', () => {
    // 02:00Z on Nov 10 is still Nov 9 in Buenos Aires.
    expect(getDaysLeft(membership, '2026-11-10T02:00:00Z')).toBe(1);
    expect(getDaysLeft(membership, new Date('2026-11-10T02:00:00Z'))).toBe(1);
  });
});

describe('getMembershipStatus', () => {
  const membership = { ...validMembership, endDate: '2026-11-10' };

  it('is active with more than 5 days left', () => {
    expect(getMembershipStatus(membership, '2026-10-15')).toBe('active');
  });

  it('is active with exactly 6 days left', () => {
    expect(getMembershipStatus(membership, '2026-11-04')).toBe('active');
  });

  it('is expiring with exactly 5 days left (inclusive limit)', () => {
    expect(getMembershipStatus(membership, '2026-11-05')).toBe('expiring');
  });

  it('is expiring with 1 day left', () => {
    expect(getMembershipStatus(membership, '2026-11-09')).toBe('expiring');
  });

  it('is expiring, not expired, on the endDate itself', () => {
    expect(getMembershipStatus(membership, '2026-11-10')).toBe('expiring');
  });

  it('is expired the day after endDate', () => {
    expect(getMembershipStatus(membership, '2026-11-11')).toBe('expired');
  });

  it('is expired long after endDate', () => {
    expect(getMembershipStatus(membership, '2027-03-01')).toBe('expired');
  });

  it('changes at midnight in Buenos Aires, not UTC', () => {
    // 23:30 on Nov 10 in Buenos Aires: still the last valid day.
    expect(getMembershipStatus(membership, '2026-11-11T02:30:00Z')).toBe('expiring');
    // Midnight Nov 11 in Buenos Aires: expired.
    expect(getMembershipStatus(membership, '2026-11-11T03:00:00Z')).toBe('expired');
  });
});
