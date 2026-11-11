import { z } from 'zod';

import { ApiError, ApiResponseError, buildUrl, createApiClient } from './api-client';

const Todo = z.object({ id: z.number(), title: z.string() });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('buildUrl', () => {
  it('joins base and path and encodes query params, skipping nullish values', () => {
    expect(
      buildUrl('https://api.test/v1/', '/todos', { q: 'a b', page: 2, empty: undefined }),
    ).toBe('https://api.test/v1/todos?q=a%20b&page=2');
    expect(buildUrl('https://api.test', 'todos')).toBe('https://api.test/todos');
  });
});

describe('createApiClient', () => {
  it('returns schema-validated data', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: 1, title: 'Ship it' }));
    const api = createApiClient({ baseUrl: 'https://api.test', fetch: fetchMock });

    await expect(api.get('/todos/1', Todo)).resolves.toEqual({ id: 1, title: 'Ship it' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/todos/1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON bodies and merges headers from getHeaders', async () => {
    const fetchMock = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({ id: 2, title: 'New' }, 201),
    );
    const api = createApiClient({
      baseUrl: 'https://api.test',
      fetch: fetchMock as unknown as typeof fetch,
      getHeaders: () => ({ Authorization: 'Bearer token' }),
    });

    await api.post('/todos', Todo, { body: { title: 'New' } });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe(JSON.stringify({ title: 'New' }));
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
  });

  it('throws ApiError with status and body for non-2xx responses', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.test',
      fetch: async () => jsonResponse({ message: 'Nope' }, 404),
    });

    const error = await api.get('/missing', Todo).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, body: { message: 'Nope' } });
  });

  it('throws ApiResponseError when the response does not match the schema', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.test',
      fetch: async () => jsonResponse({ id: 'not-a-number' }),
    });

    await expect(api.get('/todos/1', Todo)).rejects.toBeInstanceOf(ApiResponseError);
  });

  it('fails clearly when no base URL is configured', async () => {
    const api = createApiClient({ baseUrl: undefined });
    await expect(api.get('/todos', Todo)).rejects.toThrow(/EXPO_PUBLIC_API_URL/);
  });
});
