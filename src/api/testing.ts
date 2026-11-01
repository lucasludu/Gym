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
type RouteResponse = MockResponse | ((call: RecordedCall) => MockResponse);

const toResponse = (value: MockResponse): Response =>
  value instanceof Response ? value : new Response(JSON.stringify(value), { status: 200 });

/**
 * Replaces fetch for the current test. Each request consumes the next response
 * (a JSON body or a Response). Call `restore` in afterEach.
 */
export function mockApi() {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  const queue: MockResponse[] = [];
  const calls: RecordedCall[] = [];
  const routes = new Map<string, RouteResponse>();

  /**
   * Answers every request to `path` (pathname, query ignored), before the queue.
   * Pass a function to build each response, e.g. `() => notFound()`.
   */
  function route(path: string, response: (call: RecordedCall) => MockResponse): void;
  function route(path: string, response: MockResponse): void;
  function route(path: string, response: RouteResponse): void {
    routes.set(path, response);
  }

  process.env.EXPO_PUBLIC_API_URL = TEST_API_URL;
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const call: RecordedCall = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const route = routes.get(url.pathname);
    if (route !== undefined) return toResponse(typeof route === 'function' ? route(call) : route);
    if (queue.length === 0) throw new Error(`Unexpected request to ${url.href}`);
    const next = queue.shift();
    return toResponse(next);
  }) as typeof fetch;

  return {
    /** Queues responses for the next requests, in order. */
    respond(...responses: MockResponse[]) {
      queue.push(...responses);
    },
    route,
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
