import { getPlan, getPlans, getUserMembership } from './memberships';
import { mockApi } from './testing';

const membership = {
  id: 'membership-1',
  userId: 'user-1',
  planId: 'plan-2',
  startDate: '2026-10-05',
  endDate: '2026-11-04',
};
const plan = { id: 'plan-2', name: '3 veces por semana', price: 36000, weeklyClassLimit: 3 };

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getUserMembership', () => {
  it('returns the membership of the user', async () => {
    server.respond([membership]);
    await expect(getUserMembership('user-1')).resolves.toEqual(membership);
    expect(server.lastCall.path).toBe('/memberships');
    expect(server.lastCall.query.get('userId')).toBe('user-1');
  });

  it('returns null when the user has no membership (just registered)', async () => {
    server.respond([]);
    await expect(getUserMembership('user-4')).resolves.toBeNull();
  });

  it('returns the one with the latest endDate if there are several', async () => {
    const older = {
      ...membership,
      id: 'membership-0',
      startDate: '2026-09-05',
      endDate: '2026-10-04',
    };
    server.respond([membership, older]);
    await expect(getUserMembership('user-1')).resolves.toEqual(membership);
    server.respond([older, membership]);
    await expect(getUserMembership('user-1')).resolves.toEqual(membership);
  });

  it('rejects a membership whose endDate is before its startDate', async () => {
    server.respond([{ ...membership, endDate: '2026-01-01' }]);
    await expect(getUserMembership('user-1')).rejects.toMatchObject({
      kind: 'invalid_response',
    });
  });
});

describe('getPlans', () => {
  it('fetches the plans', async () => {
    server.respond([plan]);
    await expect(getPlans()).resolves.toEqual([plan]);
    expect(server.lastCall.path).toBe('/plans');
  });
});

describe('getPlan', () => {
  it('fetches one plan by id', async () => {
    server.respond(plan);
    await expect(getPlan('plan-2')).resolves.toEqual(plan);
    expect(server.lastCall.path).toBe('/plans/plan-2');
  });
});
