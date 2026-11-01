/**
 * Test helpers for the API layer: mocks the global fetch used by the default client.
 * Only imported from tests.
 */

export const TEST_API_URL = 'http://api.test';

export interface RecordedCall {
  method: string;
  /** Path without the base URL, e.g. "/bookings". */
  path: string;
  query: URLSearchParams;
  body: unknown;
}

type MockResponse = unknown | Response;

/**
 * Replaces fetch for the current test. Each request consumes the next response
 * (a JSON body or a Response). Call `restore` in afterEach.
 */
export function mockApi() {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  const queue: MockResponse[] = [];
  const calls: RecordedCall[] = [];

  process.env.EXPO_PUBLIC_API_URL = TEST_API_URL;
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push({
      method: init?.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    if (queue.length === 0) throw new Error(`Unexpected request to ${url.href}`);
    const next = queue.shift();
    return next instanceof Response ? next : new Response(JSON.stringify(next), { status: 200 });
  }) as typeof fetch;

  return {
    /** Queues responses for the next requests, in order. */
    respond(...responses: MockResponse[]) {
      queue.push(...responses);
    },
    calls,
    get lastCall(): RecordedCall {
      const call = calls[calls.length - 1];
      if (call === undefined) throw new Error('No request was made');
      return call;
    },
    restore() {
      globalThis.fetch = originalFetch;
      process.env.EXPO_PUBLIC_API_URL = originalUrl;
    },
  };
}

export const notFound = () => new Response('{}', { status: 404 });
