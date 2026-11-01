import { mockApi, notFound } from './testing';

const get = async (path: string) => {
  const response = await fetch(`http://api.test${path}`);
  return { status: response.status, body: await response.json() };
};

describe('mockApi.route', () => {
  let api: ReturnType<typeof mockApi>;
  beforeEach(() => {
    api = mockApi();
  });
  afterEach(() => api.restore());

  it('answers every request to a path with the same response, ignoring the query', async () => {
    api.route('/users', [{ id: 'u1' }]);
    expect((await get('/users?email=a')).body).toEqual([{ id: 'u1' }]);
    expect((await get('/users')).body).toEqual([{ id: 'u1' }]);
  });

  it('can build the response from the request', async () => {
    api.route('/plans/p1', (call) => ({ path: call.path }));
    expect((await get('/plans/p1')).body).toEqual({ path: '/plans/p1' });
  });

  it('accepts a Response factory (a Response body can only be read once)', async () => {
    api.route('/memberships', () => notFound());
    expect((await get('/memberships')).status).toBe(404);
    expect((await get('/memberships')).status).toBe(404);
  });

  it('takes priority over the queue, which still serves other paths', async () => {
    api.route('/users', []);
    api.respond({ queued: true });
    expect((await get('/users')).body).toEqual([]);
    expect((await get('/other')).body).toEqual({ queued: true });
  });

  it('records routed calls', async () => {
    api.route('/users', []);
    await get('/users?email=a');
    expect(api.lastCall.path).toBe('/users');
    expect(api.lastCall.query.get('email')).toBe('a');
  });
});
