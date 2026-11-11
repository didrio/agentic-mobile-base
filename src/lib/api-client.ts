/**
 * Minimal typed HTTP client: `fetch` + zod validation of every response.
 *
 * @example
 * // src/features/todos/api.ts
 * const Todo = z.object({ id: z.number(), title: z.string(), completed: z.boolean() });
 * export const getTodos = () => api.get('/todos', z.array(Todo));
 *
 * // in a component
 * const { data } = useQuery({ queryKey: ['todos'], queryFn: getTodos });
 */
import { z } from 'zod';

import { env } from './env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/** Thrown for non-2xx responses. `body` holds the parsed JSON (or text) error payload. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message = `Request failed with status ${status}`) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Thrown when a 2xx response doesn't match the expected schema (backend contract drift). */
export class ApiResponseError extends Error {
  readonly issues: z.ZodError['issues'];

  constructor(path: string, error: z.ZodError) {
    super(`Unexpected response shape from ${path}:\n${z.prettifyError(error)}`);
    this.name = 'ApiResponseError';
    this.issues = error.issues;
  }
}

export function buildUrl(baseUrl: string, path: string, query: QueryParams = {}): string {
  const base = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const search = Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] != null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return search ? `${base}${normalizedPath}?${search}` : `${base}${normalizedPath}`;
}

export type ApiClientConfig = {
  baseUrl: string | undefined;
  /** Called before every request, e.g. to attach an auth token from secure storage. */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  fetch?: typeof fetch;
};

export function createApiClient(config: ApiClientConfig) {
  const fetchImpl = config.fetch ?? fetch;

  async function request<T>(
    method: HttpMethod,
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!config.baseUrl) {
      throw new Error(
        'API base URL is not configured. Set EXPO_PUBLIC_API_URL (see .env.example).',
      );
    }

    const response = await fetchImpl(buildUrl(config.baseUrl, path, options.query), {
      method,
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(await config.getHeaders?.()),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let payload: unknown = text;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        // Not JSON: keep the raw text.
      }
    } else {
      payload = undefined;
    }

    if (!response.ok) throw new ApiError(response.status, payload);

    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw new ApiResponseError(path, parsed.error);
    return parsed.data;
  }

  return {
    request,
    get: <T>(path: string, schema: z.ZodType<T>, options?: Omit<RequestOptions, 'body'>) =>
      request('GET', path, schema, options),
    post: <T>(path: string, schema: z.ZodType<T>, options?: RequestOptions) =>
      request('POST', path, schema, options),
    put: <T>(path: string, schema: z.ZodType<T>, options?: RequestOptions) =>
      request('PUT', path, schema, options),
    patch: <T>(path: string, schema: z.ZodType<T>, options?: RequestOptions) =>
      request('PATCH', path, schema, options),
    delete: <T>(path: string, schema: z.ZodType<T>, options?: RequestOptions) =>
      request('DELETE', path, schema, options),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** The app's default API client, pointed at `EXPO_PUBLIC_API_URL`. */
export const api = createApiClient({ baseUrl: env.EXPO_PUBLIC_API_URL });
