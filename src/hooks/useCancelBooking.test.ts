import type { QueryClient } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react-native';

import { mockApi } from '../api/testing';
import type { Booking } from '../domain/booking';
import type { ClassSession } from '../domain/classSession';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useCancelBooking } from './useCancelBooking';

const NOW = new Date('2026-11-03T10:00:00-03:00');
const session: ClassSession = {
  id: 's1',
  classTypeId: 'ct-yoga',
  trainerId: 't1',
  startsAt: '2026-11-05T19:00:00-03:00',
  capacity: 12,
  bookedCount: 9,
};
const confirmed: Booking = {
  id: 'b1',
  userId: 'user-1',
  classSessionId: 's1',
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: null,
};
const cancelled: Booking = { ...confirmed, status: 'cancelled', cancelledAt: NOW.toISOString() };

let api: ReturnType<typeof mockApi>;
let queryClient: QueryClient | null = null;
beforeEach(() => {
  api = mockApi();
  api.route('/bookings/b1', cancelled);
  api.route('/bookings', [cancelled]);
});
afterEach(async () => {
  const client = queryClient;
  if (client) await waitFor(() => expect(client.isFetching() + client.isMutating()).toBe(0));
  queryClient = null;
  api.restore();
});

const setup = async () => {
  const rendered = await renderQueryHook(() => useCancelBooking('user-1'));
  queryClient = rendered.client;
  rendered.client.setQueryData(queryKeys.bookings('user-1'), [confirmed]);
  rendered.client.setQueryData(queryKeys.classSession('s1'), session);
  return rendered;
};

describe('useCancelBooking', () => {
  it('patches the booking as cancelled (rule 7)', async () => {
    const { result } = await setup();
    await act(() => result.current.mutateAsync({ booking: confirmed, now: NOW }));
    const patch = api.calls.find((c) => c.method === 'PATCH');
    expect(patch?.path).toBe('/bookings/b1');
    expect(patch?.body).toEqual({ status: 'cancelled', cancelledAt: NOW.toISOString() });
  });

  it('frees the spot and cancels the booking before the server answers', async () => {
    let release: (value: unknown) => void = () => undefined;
    api.route('/bookings/b1', () => new Promise((resolve) => (release = resolve)));
    const { result, client } = await setup();
    await act(async () => result.current.mutate({ booking: confirmed, now: NOW }));
    await waitFor(() =>
      expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))?.[0]?.status).toBe(
        'cancelled',
      ),
    );
    expect(client.getQueryData<ClassSession>(queryKeys.classSession('s1'))?.bookedCount).toBe(8);
    await act(async () => release(cancelled));
  });

  it('rolls back when the server fails (criterion 28)', async () => {
    api.route('/bookings/b1', () => new Response('{}', { status: 500 }));
    api.route('/bookings', [confirmed]);
    const { result, client } = await setup();
    await act(async () => {
      await result.current.mutateAsync({ booking: confirmed, now: NOW }).catch(() => undefined);
    });
    expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))?.[0]?.status).toBe(
      'confirmed',
    );
    expect(client.getQueryData<ClassSession>(queryKeys.classSession('s1'))?.bookedCount).toBe(9);
  });
});
