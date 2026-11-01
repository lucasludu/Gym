import { isApiError } from './client';
import { getClassSession, getClassSessions, getClassTypes, getTrainers } from './classes';
import { mockApi, notFound } from './testing';

const classType = {
  id: 'class-type-yoga',
  name: 'Yoga',
  description: 'Posturas y respiración.',
  durationMinutes: 60,
  intensity: 'low',
  color: 'accentGreen',
};

const trainer = { id: 'trainer-1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };

const session = {
  id: 'class-1',
  classTypeId: 'class-type-yoga',
  trainerId: 'trainer-1',
  startsAt: '2026-11-04T18:00:00-03:00',
  capacity: 12,
  bookedCount: 5,
};

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getClassTypes', () => {
  it('fetches and validates the class types', async () => {
    server.respond([classType]);
    await expect(getClassTypes()).resolves.toEqual([classType]);
    expect(server.lastCall).toMatchObject({ method: 'GET', path: '/classTypes' });
  });

  it('rejects an invalid class type (e.g. a hex color)', async () => {
    server.respond([{ ...classType, color: '#00FF00' }]);
    await expect(getClassTypes()).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

describe('getTrainers', () => {
  it('fetches and validates the trainers', async () => {
    server.respond([trainer]);
    await expect(getTrainers()).resolves.toEqual([trainer]);
    expect(server.lastCall.path).toBe('/trainers');
  });
});

describe('getClassSessions', () => {
  it('fetches the sessions of a date range, sorted by start time', async () => {
    server.respond([session]);
    await expect(getClassSessions({ from: '2026-11-04', to: '2026-11-10' })).resolves.toEqual([
      session,
    ]);
    const { path, query } = server.lastCall;
    expect(path).toBe('/classSessions');
    expect(query.get('startsAt_gte')).toBe('2026-11-04T00:00:00-03:00');
    expect(query.get('startsAt_lte')).toBe('2026-11-10T23:59:59-03:00');
    expect(query.get('_sort')).toBe('startsAt');
    expect(query.get('_order')).toBe('asc');
  });

  it('accepts a single day', async () => {
    server.respond([]);
    await getClassSessions({ from: '2026-11-04', to: '2026-11-04' });
    expect(server.lastCall.query.get('startsAt_lte')).toBe('2026-11-04T23:59:59-03:00');
  });

  it('throws when the range is reversed or a date is invalid', async () => {
    await expect(getClassSessions({ from: '2026-11-10', to: '2026-11-04' })).rejects.toThrow();
    await expect(getClassSessions({ from: '04/11/2026', to: '2026-11-04' })).rejects.toThrow();
    expect(server.calls).toHaveLength(0);
  });

  it('passes the abort signal to fetch', async () => {
    server.respond([]);
    const controller = new AbortController();
    controller.abort();
    const error: unknown = await getClassSessions(
      { from: '2026-11-04', to: '2026-11-04' },
      { signal: controller.signal },
    ).catch((e: unknown) => e);
    expect(isApiError(error) && error.kind).toBe('aborted');
  });
});

describe('getClassSession', () => {
  it('fetches one session by id', async () => {
    server.respond(session);
    await expect(getClassSession('class-1')).resolves.toEqual(session);
    expect(server.lastCall.path).toBe('/classSessions/class-1');
  });

  it('encodes the id in the path', async () => {
    server.respond(session);
    await getClassSession('a/b');
    expect(server.lastCall.path).toBe('/classSessions/a%2Fb');
  });

  it('throws an http 404 error when it does not exist', async () => {
    server.respond(notFound());
    await expect(getClassSession('nope')).rejects.toMatchObject({ kind: 'http', status: 404 });
  });
});
