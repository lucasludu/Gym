import { mockApi } from './testing';
import { createUser, findUserByEmail, getUser, updateWeeklyGoal } from './users';

const user = {
  id: 'user-1',
  firstName: 'Sofía',
  lastName: 'Martínez',
  email: 'sofia.martinez@example.com',
  avatarUrl: null,
  weeklyGoal: 3,
  createdAt: '2026-04-15T10:00:00-03:00',
};
const NOW = '2026-11-02T10:00:00-03:00';

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getUser', () => {
  it('fetches one user by id', async () => {
    server.respond(user);
    await expect(getUser('user-1')).resolves.toEqual(user);
    expect(server.lastCall.path).toBe('/users/user-1');
  });
});

describe('findUserByEmail', () => {
  it('returns the user with that email', async () => {
    server.respond([user]);
    await expect(findUserByEmail('sofia.martinez@example.com')).resolves.toEqual(user);
    expect(server.lastCall.path).toBe('/users');
    expect(server.lastCall.query.get('email')).toBe('sofia.martinez@example.com');
  });

  it('normalizes the email (trim and lowercase)', async () => {
    server.respond([user]);
    await findUserByEmail('  Sofia.Martinez@Example.com ');
    expect(server.lastCall.query.get('email')).toBe('sofia.martinez@example.com');
  });

  it('returns null when no user has that email', async () => {
    server.respond([]);
    await expect(findUserByEmail('nadie@example.com')).resolves.toBeNull();
  });
});

describe('createUser', () => {
  it('posts a new user with defaults and no membership', async () => {
    server.respond({ ...user, id: 'srv-1', createdAt: NOW });
    await expect(
      createUser(
        { firstName: 'Sofía', lastName: 'Martínez', email: ' Sofia.Martinez@example.com' },
        NOW,
      ),
    ).resolves.toMatchObject({ id: 'srv-1' });
    expect(server.calls).toHaveLength(1);
    expect(server.lastCall).toMatchObject({
      method: 'POST',
      path: '/users',
      body: {
        firstName: 'Sofía',
        lastName: 'Martínez',
        email: 'sofia.martinez@example.com',
        avatarUrl: null,
        weeklyGoal: 3,
        createdAt: NOW,
      },
    });
    expect(server.lastCall.body).not.toHaveProperty('id');
  });

  it('refuses invalid data without calling the API', async () => {
    await expect(
      createUser({ firstName: '', lastName: 'X', email: 'not-an-email' }, NOW),
    ).rejects.toThrow();
    expect(server.calls).toHaveLength(0);
  });
});

describe('updateWeeklyGoal', () => {
  it('patches the weekly goal', async () => {
    server.respond({ ...user, weeklyGoal: 5 });
    await expect(updateWeeklyGoal('user-1', 5)).resolves.toMatchObject({ weeklyGoal: 5 });
    expect(server.lastCall).toMatchObject({
      method: 'PATCH',
      path: '/users/user-1',
      body: { weeklyGoal: 5 },
    });
  });

  it.each([0, 8, 2.5])('refuses an invalid goal (%s) without calling the API', async (goal) => {
    await expect(updateWeeklyGoal('user-1', goal)).rejects.toThrow();
    expect(server.calls).toHaveLength(0);
  });
});
