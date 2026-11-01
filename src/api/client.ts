import type { z } from 'zod';

import { getApiUrl } from './config';

/**
 * HTTP client for the API. Every response is validated with a Zod schema, so a change
 * in the backend fails loudly here instead of deep in the UI.
 * Screens never use it directly: screen → hook → src/api/<resource>.ts → client.
 */

export const DEFAULT_TIMEOUT_MS = 10_000;

export type ApiErrorKind = 'http' | 'timeout' | 'network' | 'aborted' | 'invalid_response';

interface ApiErrorInit {
  kind: ApiErrorKind;
  url: string;
  /** HTTP status, or `null` when no response arrived. */
  status: number | null;
  issues?: z.core.$ZodIssue[];
  cause?: unknown;
}

const describe = ({ kind, url, status }: ApiErrorInit): string => {
  switch (kind) {
    case 'http':
      return `Request to ${url} failed with status ${status}`;
    case 'timeout':
      return `Request to ${url} timed out`;
    case 'network':
      return `Network error requesting ${url}`;
    case 'aborted':
      return `Request to ${url} was aborted`;
    case 'invalid_response':
      return `Unexpected response format from ${url}`;
  }
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly url: string;
  readonly status: number | null;
  /** Validation issues, only for `invalid_response` caused by the schema. */
  readonly issues: z.core.$ZodIssue[] | undefined;

  constructor(init: ApiErrorInit) {
    super(describe(init), { cause: init.cause });
    this.name = 'ApiError';
    this.kind = init.kind;
    this.url = init.url;
    this.status = init.status;
    this.issues = init.issues;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

type QueryValue = string | number | boolean;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Arrays are repeated (`id=1&id=2`), as json-server expects; `undefined` is skipped. */
  query?: Record<string, QueryValue | readonly QueryValue[] | undefined>;
  /** Sent as JSON. */
  body?: unknown;
  /** Overrides the client timeout for this request. */
  timeoutMs?: number;
  /** Cancels the request, e.g. the signal TanStack Query passes to query functions. */
  signal?: AbortSignal;
}

export interface ApiClientConfig {
  /** A string, or a function read on every request. */
  baseUrl: string | (() => string);
  timeoutMs?: number;
  /** Defaults to the global fetch, read on every request. */
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}

export interface ApiClient {
  request<S extends z.ZodType>(
    path: string,
    schema: S,
    options?: RequestOptions,
  ): Promise<z.output<S>>;
}

const buildUrl = (baseUrl: string, path: string, query: RequestOptions['query']): string => {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined) return;
    const values: readonly QueryValue[] = Array.isArray(value) ? value : [value];
    values.forEach((v) => params.append(key, String(v)));
  });
  const search = params.toString();
  return search === '' ? url : `${url}?${search}`;
};

export function createApiClient(config: ApiClientConfig): ApiClient {
  const resolveBaseUrl = () =>
    typeof config.baseUrl === 'function' ? config.baseUrl() : config.baseUrl;

  return {
    async request(path, schema, options = {}) {
      const url = buildUrl(resolveBaseUrl(), path, options.query);
      const fail = (init: Omit<ApiErrorInit, 'url'>) => new ApiError({ ...init, url });

      if (options.signal?.aborted) throw fail({ kind: 'aborted', status: null });

      // One controller for both the timeout and the caller's signal.
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(
        () => {
          timedOut = true;
          controller.abort();
        },
        options.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      const onCallerAbort = () => controller.abort();
      options.signal?.addEventListener('abort', onCallerAbort);

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (options.body !== undefined) headers['Content-Type'] = 'application/json';

      let response: Response;
      let text: string;
      try {
        const fetchFn = config.fetch ?? globalThis.fetch;
        response = await fetchFn(url, {
          method: options.method ?? 'GET',
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        });
        text = await response.text();
      } catch (cause) {
        if (timedOut) throw fail({ kind: 'timeout', status: null, cause });
        if (controller.signal.aborted) throw fail({ kind: 'aborted', status: null, cause });
        throw fail({ kind: 'network', status: null, cause });
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onCallerAbort);
      }

      if (!response.ok) throw fail({ kind: 'http', status: response.status });

      let data: unknown;
      try {
        data = text === '' ? undefined : JSON.parse(text);
      } catch (cause) {
        throw fail({ kind: 'invalid_response', status: response.status, cause });
      }

      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        throw fail({
          kind: 'invalid_response',
          status: response.status,
          issues: parsed.error.issues,
          cause: parsed.error,
        });
      }
      return parsed.data;
    },
  };
}

/** Default client: base URL from EXPO_PUBLIC_API_URL, read on every request. */
export const api = createApiClient({ baseUrl: getApiUrl });
