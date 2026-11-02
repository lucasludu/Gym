import type { QueryClient } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react-native';

import { mockApi } from '../api/testing';
import type { Booking } from '../domain/booking';
import type { ClassSession } from '../domain/classSession';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useBookClass } from './useBookClass';

const NOW = new Date('2026-11-03T10:00:00-03:00');
const WEEK = { from: '2026-11-02', to: '2026-11-08' };
const session: ClassSession = {
  id: 's1',
  classTypeId: 'ct-yoga',
  trainerId: 't1',
  startsAt: '2026-11-05T19:00:00-03:00',
  capacity: 12,
  bookedCount: 8,
};
const created: Booking = {
  id: 'b-server',
  userId: 'user-1',
  classSessionId: 's1',
  status: 'confirmed',
  createdAt: NOW.toISOString(),
  cancelledAt: null,
};

let api: ReturnType<typeof mockApi>;
let queryClient: QueryClient | null = null;
beforeEach(() => {
  api = mockApi();
  api.route('/bookings', (call) => (call.method === 'POST' ? created : [created]));
});
// Wait for the refetch after the mutation, or it would reach the real network after restore.
afterEach(async () => {
  const client = queryClient;
  if (client) await waitFor(() => expect(client.isFetching() + client.isMutating()).toBe(0));
  queryClient = null;
  api.restore();
});

const setup = async () => {
  const rendered = await renderQueryHook(() => useBookClass('user-1'));
  queryClient = rendered.client;
  rendered.client.setQueryData(queryKeys.bookings('user-1'), []);
  rendered.client.setQueryData(queryKeys.classSession('s1'), session);
  rendered.client.setQueryData(queryKeys.classSessions(WEEK), [session]);
  return rendered;
};

describe('useBookClass', () => {
  it('posts a confirmed booking', async () => {
    const { result } = await setup();
    await act(() => result.current.mutateAsync({ classSessionId: 's1', now: NOW }));
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({
      userId: 'user-1',
      classSessionId: 's1',
      status: 'confirmed',
      createdAt: NOW.toISOString(),
      cancelledAt: null,
    });
  });

  it('shows the booking and one spot less before the server answers', async () => {
    let release: (value: unknown) => void = () => undefined;
    api.route('/bookings', (call) =>
      call.method === 'POST' ? new Promise((resolve) => (release = resolve)) : [created],
    );
    const { result, client } = await setup();
    await act(async () => result.current.mutate({ classSessionId: 's1', now: NOW }));

    await waitFor(() =>
      expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))).toEqual([
        expect.objectContaining({ classSessionId: 's1', status: 'confirmed' }),
      ]),
    );
    expect(client.getQueryData<ClassSession>(queryKeys.classSession('s1'))?.bookedCount).toBe(9);
    expect(
      client.getQueryData<ClassSession[]>(queryKeys.classSessions(WEEK))?.[0]?.bookedCount,
    ).toBe(9);
    await act(async () => release(created));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('keeps the server id once it answers (needed to cancel)', async () => {
    const { result, client } = await setup();
    await act(() => result.current.mutateAsync({ classSessionId: 's1', now: NOW }));
    await waitFor(() =>
      expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))?.[0]?.id).toBe(
        'b-server',
      ),
    );
  });

  it('rolls everything back when the server fails (criterion 17)', async () => {
    api.route('/bookings', (call) =>
      call.method === 'POST' ? new Response('{}', { status: 500 }) : [],
    );
    const { result, client } = await setup();
    await act(async () => {
      await result.current.mutateAsync({ classSessionId: 's1', now: NOW }).catch(() => undefined);
    });
    expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))).toEqual([]);
    expect(client.getQueryData<ClassSession>(queryKeys.classSession('s1'))?.bookedCount).toBe(8);
    expect(
      client.getQueryData<ClassSession[]>(queryKeys.classSessions(WEEK))?.[0]?.bookedCount,
    ).toBe(8);
  });

  it('never counts more booked than the capacity', async () => {
    const { result, client } = await setup();
    client.setQueryData(queryKeys.classSession('s1'), { ...session, bookedCount: 12 });
    let release: (value: unknown) => void = () => undefined;
    api.route('/bookings', (call) =>
      call.method === 'POST' ? new Promise((resolve) => (release = resolve)) : [created],
    );
    await act(async () => result.current.mutate({ classSessionId: 's1', now: NOW }));
    await waitFor(() =>
      expect(client.getQueryData<Booking[]>(queryKeys.bookings('user-1'))).toHaveLength(1),
    );
    expect(client.getQueryData<ClassSession>(queryKeys.classSession('s1'))?.bookedCount).toBe(12);
    await act(async () => release(created));
  });
});
