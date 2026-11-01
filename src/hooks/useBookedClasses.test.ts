import { waitFor } from '@testing-library/react-native';

import { mockApi } from '../api/testing';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useBookedClasses } from './useBookedClasses';

const yoga = {
  id: 'ct-yoga',
  name: 'Yoga',
  description: '',
  durationMinutes: 60,
  intensity: 'low',
  color: 'accentGreen',
};
const camila = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };
const session = (id: string) => ({
  id,
  classTypeId: 'ct-yoga',
  trainerId: 't1',
  startsAt: '2026-11-04T18:00:00-03:00',
  capacity: 12,
  bookedCount: 5,
});
const booking = (id: string, classSessionId: string) => ({
  id,
  userId: 'user-1',
  classSessionId,
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: null,
});

let api: ReturnType<typeof mockApi>;
beforeEach(() => {
  api = mockApi();
  api.route('/classTypes', [yoga]);
  api.route('/trainers', [camila]);
});
afterEach(() => api.restore());

describe('useBookedClasses', () => {
  it('joins each booking with its class session, class type and trainer', async () => {
    api.route('/bookings', [booking('b1', 's1')]);
    api.route('/classSessions', [session('s1')]);
    const { result } = await renderQueryHook(() => useBookedClasses('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        booking: booking('b1', 's1'),
        session: session('s1'),
        classType: yoga,
        trainer: camila,
        status: 'confirmed',
        startsAt: '2026-11-04T18:00:00-03:00',
        durationMinutes: 60,
      },
    ]);
  });

  it('asks only for the sessions of the bookings', async () => {
    api.route('/bookings', [booking('b1', 's1'), booking('b2', 's2')]);
    api.route('/classSessions', [session('s1'), session('s2')]);
    const { result } = await renderQueryHook(() => useBookedClasses('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const sessionsCall = api.calls.find((c) => c.path === '/classSessions');
    expect(sessionsCall?.query.getAll('id')).toEqual(['s1', 's2']);
  });

  it('ignores bookings whose class no longer exists', async () => {
    api.route('/bookings', [booking('b1', 's1'), booking('b2', 'gone')]);
    api.route('/classSessions', [session('s1')]);
    const { result } = await renderQueryHook(() => useBookedClasses('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((b) => b.booking.id)).toEqual(['b1']);
  });

  it('returns an empty list without bookings and does not ask for sessions', async () => {
    api.route('/bookings', []);
    const { result } = await renderQueryHook(() => useBookedClasses('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(api.calls.some((c) => c.path === '/classSessions')).toBe(false);
  });

  it('does not fetch without a user', async () => {
    const { result } = await renderQueryHook(() => useBookedClasses(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(api.calls).toHaveLength(0);
  });

  it('lives under the bookings key, so invalidating bookings refreshes it', () => {
    expect(queryKeys.bookedClasses('user-1').slice(0, 2)).toEqual(queryKeys.bookings('user-1'));
  });
});
