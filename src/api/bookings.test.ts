import type { Booking } from '../domain/booking';
import { cancelBooking, createBooking, getUserBookings } from './bookings';
import { mockApi } from './testing';

const booking: Booking = {
  id: 'booking-1',
  userId: 'user-1',
  classSessionId: 'class-1',
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: null,
};

const NOW = '2026-11-02T10:00:00-03:00';

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getUserBookings', () => {
  it('fetches the bookings of a user', async () => {
    server.respond([booking]);
    await expect(getUserBookings('user-1')).resolves.toEqual([booking]);
    expect(server.lastCall.path).toBe('/bookings');
    expect(server.lastCall.query.get('userId')).toBe('user-1');
  });

  it('rejects a booking that breaks the schema', async () => {
    server.respond([{ ...booking, status: 'cancelled', cancelledAt: null }]);
    await expect(getUserBookings('user-1')).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

describe('createBooking', () => {
  it('posts a confirmed booking created now and returns it with its new id', async () => {
    server.respond({ ...booking, id: 'abc123', createdAt: NOW });
    await expect(
      createBooking({ userId: 'user-1', classSessionId: 'class-1' }, NOW),
    ).resolves.toMatchObject({ id: 'abc123', status: 'confirmed' });
    expect(server.lastCall).toMatchObject({
      method: 'POST',
      path: '/bookings',
      body: {
        userId: 'user-1',
        classSessionId: 'class-1',
        status: 'confirmed',
        createdAt: NOW,
        cancelledAt: null,
      },
    });
  });

  it('does not send an id (the server assigns it)', async () => {
    server.respond({ ...booking, id: 'abc123' });
    await createBooking({ userId: 'user-1', classSessionId: 'class-1' }, NOW);
    expect(server.lastCall.body).not.toHaveProperty('id');
  });

  it('accepts a Date as now', async () => {
    server.respond(booking);
    await createBooking(
      { userId: 'user-1', classSessionId: 'class-1' },
      new Date('2026-11-02T13:00:00Z'),
    );
    expect(server.lastCall.body).toMatchObject({ createdAt: '2026-11-02T13:00:00.000Z' });
  });
});

describe('cancelBooking', () => {
  it('patches status and cancelledAt, keeping the record', async () => {
    const cancelled = { ...booking, status: 'cancelled', cancelledAt: NOW };
    server.respond(cancelled);
    await expect(cancelBooking(booking, NOW)).resolves.toEqual(cancelled);
    expect(server.lastCall).toMatchObject({
      method: 'PATCH',
      path: '/bookings/booking-1',
      body: { status: 'cancelled', cancelledAt: NOW },
    });
  });

  it('does not call the API for a booking that is not confirmed', async () => {
    await expect(cancelBooking({ ...booking, status: 'attended' }, NOW)).rejects.toThrow();
    expect(server.calls).toHaveLength(0);
  });
});
