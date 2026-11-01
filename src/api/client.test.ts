import { z } from 'zod';

import { ApiError, DEFAULT_TIMEOUT_MS, api, createApiClient, isApiError } from './client';

const BASE_URL = 'http://api.test';

const itemSchema = z.object({ id: z.string(), name: z.string() });

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

/** A fetch that never resolves on its own and rejects like the real one when aborted. */
const hangingFetch = jest.fn(
  (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    }),
);

const setup = (response: Response | (() => Promise<Response>), timeoutMs?: number) => {
  const fetchMock = jest.fn((_url: string, _init?: RequestInit) =>
    typeof response === 'function' ? response() : Promise.resolve(response),
  );
  const client = createApiClient({ baseUrl: BASE_URL, fetch: fetchMock, timeoutMs });
  return { client, fetchMock };
};

const lastCall = (fetchMock: jest.Mock) => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [
    string,
    RequestInit,
  ];
  return { url, init, headers: new Headers(init.headers) };
};

const captureError = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail');
};

describe('createApiClient', () => {
  describe('success', () => {
    it('returns the data validated by the schema', async () => {
      const { client } = setup(jsonResponse({ id: '1', name: 'Yoga' }));
      await expect(client.request('/classTypes/1', itemSchema)).resolves.toEqual({
        id: '1',
        name: 'Yoga',
      });
    });

    it('returns the schema output (unknown fields are dropped)', async () => {
      const { client } = setup(jsonResponse({ id: '1', name: 'Yoga', spotsLeft: 3 }));
      await expect(client.request('/classTypes/1', itemSchema)).resolves.toEqual({
        id: '1',
        name: 'Yoga',
      });
    });

    it('validates arrays', async () => {
      const { client } = setup(jsonResponse([{ id: '1', name: 'A' }]));
      await expect(client.request('/items', z.array(itemSchema))).resolves.toHaveLength(1);
    });

    it('joins the base URL and the path', async () => {
      const { client, fetchMock } = setup(() => Promise.resolve(jsonResponse([])));
      await client.request('/users', z.array(z.unknown()));
      await client.request('users', z.array(z.unknown()));
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        'http://api.test/users',
        'http://api.test/users',
      ]);
    });

    it('sends a GET with Accept: application/json by default', async () => {
      const { client, fetchMock } = setup(jsonResponse([]));
      await client.request('/users', z.array(z.unknown()));
      const { init, headers } = lastCall(fetchMock);
      expect(init.method).toBe('GET');
      expect(headers.get('Accept')).toBe('application/json');
      expect(init.body).toBeUndefined();
    });

    it('encodes query params, repeats arrays and skips undefined values', async () => {
      const { client, fetchMock } = setup(jsonResponse([]));
      await client.request('/classSessions', z.array(z.unknown()), {
        query: {
          startsAt_gte: '2026-11-04T00:00:00-03:00',
          id: ['class-1', 'class-2'],
          _limit: 10,
          active: true,
          missing: undefined,
        },
      });
      const url = new URL(lastCall(fetchMock).url);
      expect(url.pathname).toBe('/classSessions');
      expect(url.searchParams.get('startsAt_gte')).toBe('2026-11-04T00:00:00-03:00');
      expect(url.searchParams.getAll('id')).toEqual(['class-1', 'class-2']);
      expect(url.searchParams.get('_limit')).toBe('10');
      expect(url.searchParams.get('active')).toBe('true');
      expect(url.searchParams.has('missing')).toBe(false);
    });

    it('sends a JSON body with its content type', async () => {
      const { client, fetchMock } = setup(jsonResponse({ id: '1', name: 'A' }, { status: 201 }));
      await client.request('/items', itemSchema, { method: 'POST', body: { name: 'A' } });
      const { init, headers } = lastCall(fetchMock);
      expect(init.method).toBe('POST');
      expect(init.body).toBe('{"name":"A"}');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it.each(['PUT', 'PATCH', 'DELETE'] as const)('supports %s', async (method) => {
      const { client, fetchMock } = setup(jsonResponse({}));
      await client.request('/items/1', z.object({}), { method });
      expect(lastCall(fetchMock).init.method).toBe(method);
    });

    it('accepts an empty body (204) when the schema allows undefined', async () => {
      const { client } = setup(new Response(null, { status: 204 }));
      await expect(
        client.request('/items/1', z.undefined(), { method: 'DELETE' }),
      ).resolves.toBeUndefined();
    });

    it('reads the base URL lazily when given a function', async () => {
      let base = 'http://first.test';
      const fetchMock = jest.fn((_url: string, _init?: RequestInit) =>
        Promise.resolve(jsonResponse([])),
      );
      const client = createApiClient({ baseUrl: () => base, fetch: fetchMock });
      await client.request('/a', z.array(z.unknown()));
      base = 'http://second.test';
      await client.request('/a', z.array(z.unknown()));
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        'http://first.test/a',
        'http://second.test/a',
      ]);
    });
  });

  describe('HTTP errors', () => {
    it.each([400, 404, 409, 500, 503])('throws an http ApiError with status %i', async (status) => {
      const { client } = setup(jsonResponse({ message: 'nope' }, { status }));
      const error = await captureError(client.request('/items/1', itemSchema));
      expect(error).toMatchObject({ kind: 'http', status, url: 'http://api.test/items/1' });
    });

    it('does not validate the body of an error response', async () => {
      const { client } = setup(new Response('<html>Server error</html>', { status: 500 }));
      const error = await captureError(client.request('/items', itemSchema));
      expect(error.kind).toBe('http');
    });
  });

  describe('invalid responses', () => {
    it('throws invalid_response when the body does not match the schema', async () => {
      const { client } = setup(jsonResponse({ id: 1 }));
      const error = await captureError(client.request('/items/1', itemSchema));
      expect(error.kind).toBe('invalid_response');
      expect(error.status).toBe(200);
      expect(error.issues?.length).toBeGreaterThan(0);
    });

    it('throws invalid_response when the body is not JSON', async () => {
      const { client } = setup(new Response('not json', { status: 200 }));
      const error = await captureError(client.request('/items/1', itemSchema));
      expect(error.kind).toBe('invalid_response');
    });

    it('throws invalid_response for an empty body when data is expected', async () => {
      const { client } = setup(new Response(null, { status: 204 }));
      const error = await captureError(client.request('/items/1', itemSchema));
      expect(error.kind).toBe('invalid_response');
    });
  });

  describe('network errors', () => {
    it('throws a network ApiError when fetch fails', async () => {
      const { client } = setup(() => Promise.reject(new TypeError('Network request failed')));
      const error = await captureError(client.request('/items', itemSchema));
      expect(error).toMatchObject({ kind: 'network', status: null });
      expect(error.cause).toBeInstanceOf(TypeError);
    });
  });

  describe('timeout', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it(`times out after ${DEFAULT_TIMEOUT_MS} ms by default`, async () => {
      const client = createApiClient({ baseUrl: BASE_URL, fetch: hangingFetch });
      const promise = captureError(client.request('/items', itemSchema));
      jest.advanceTimersByTime(DEFAULT_TIMEOUT_MS - 1);
      await Promise.resolve();
      jest.advanceTimersByTime(1);
      expect(await promise).toMatchObject({ kind: 'timeout', status: null });
    });

    it('uses the timeout of the client', async () => {
      const client = createApiClient({ baseUrl: BASE_URL, fetch: hangingFetch, timeoutMs: 500 });
      const promise = captureError(client.request('/items', itemSchema));
      jest.advanceTimersByTime(500);
      expect((await promise).kind).toBe('timeout');
    });

    it('lets a request override the timeout', async () => {
      const client = createApiClient({ baseUrl: BASE_URL, fetch: hangingFetch, timeoutMs: 500 });
      const promise = captureError(client.request('/items', itemSchema, { timeoutMs: 50 }));
      jest.advanceTimersByTime(50);
      expect((await promise).kind).toBe('timeout');
    });

    it('clears the timer when the request finishes', async () => {
      const { client } = setup(jsonResponse({ id: '1', name: 'A' }));
      await client.request('/items/1', itemSchema);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('clears the timer when the request fails', async () => {
      const { client } = setup(jsonResponse({}, { status: 500 }));
      await captureError(client.request('/items/1', itemSchema));
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('cancellation', () => {
    it('throws an aborted ApiError when the caller aborts', async () => {
      const client = createApiClient({ baseUrl: BASE_URL, fetch: hangingFetch });
      const controller = new AbortController();
      const promise = captureError(
        client.request('/items', itemSchema, { signal: controller.signal }),
      );
      controller.abort();
      expect((await promise).kind).toBe('aborted');
    });

    it('does not call fetch when the signal is already aborted', async () => {
      const { client, fetchMock } = setup(jsonResponse([]));
      const controller = new AbortController();
      controller.abort();
      const error = await captureError(
        client.request('/items', itemSchema, { signal: controller.signal }),
      );
      expect(error.kind).toBe('aborted');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

describe('isApiError', () => {
  it('recognizes ApiError instances only', () => {
    expect(isApiError(new ApiError({ kind: 'network', url: 'x', status: null }))).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError('x')).toBe(false);
  });

  it('is an Error with a descriptive message', () => {
    const error = new ApiError({ kind: 'http', url: 'http://api.test/a', status: 404 });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.message).toContain('404');
  });
});

describe('api (default client)', () => {
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalUrl;
    globalThis.fetch = originalFetch;
  });

  it('uses EXPO_PUBLIC_API_URL and the global fetch', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.0.5:3000/';
    const fetchMock = jest.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(jsonResponse([])),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await api.request('/users', z.array(z.unknown()));
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://10.0.0.5:3000/users');
  });
});
