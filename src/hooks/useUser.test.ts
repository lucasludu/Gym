import { waitFor } from '@testing-library/react-native';

import { mockApi, notFound } from '../api/testing';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useUser } from './useUser';

const user = {
  id: 'user-1',
  firstName: 'Sofía',
  lastName: 'Martínez',
  email: 'sofia.martinez@example.com',
  avatarUrl: null,
  weeklyGoal: 3,
  createdAt: '2026-01-10T12:00:00-03:00',
};

let api: ReturnType<typeof mockApi>;
beforeEach(() => {
  api = mockApi();
});
afterEach(() => api.restore());

describe('useUser', () => {
  it('fetches the user by id', async () => {
    api.respond(user);
    const { result } = await renderQueryHook(() => useUser('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(user);
    expect(api.lastCall.path).toBe('/users/user-1');
  });

  it('does not fetch without a user id', async () => {
    const { result } = await renderQueryHook(() => useUser(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(api.calls).toHaveLength(0);
  });

  it('exposes a 404 as an error (the account no longer exists)', async () => {
    api.respond(notFound());
    const { result } = await renderQueryHook(() => useUser('ghost'));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('uses a key that includes the user id', () => {
    expect(queryKeys.user('user-1')).toEqual(['user', 'user-1']);
  });
});
