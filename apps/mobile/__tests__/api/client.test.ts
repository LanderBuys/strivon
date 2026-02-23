jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: {} },
  },
}));

import { apiRequest, ApiError, api } from '../../lib/api/client';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('apiRequest', () => {
  it('returns parsed JSON on 200', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: 1, name: 'test' })),
    });

    const result = await apiRequest('/test');
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('throws ApiError with status and message on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(JSON.stringify({ message: 'Not found' })),
    });

    try {
      await apiRequest('/missing');
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
      expect((e as ApiError).message).toBe('Not found');
    }
  });

  it('uses body message when available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
    });

    await expect(apiRequest('/bad')).rejects.toThrow('Bad request');
  });

  it('falls back to "Request failed: status" when no body message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    });

    await expect(apiRequest('/error')).rejects.toThrow('Request failed: 500');
  });

  it('throws ApiError on abort (timeout)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));

    await expect(apiRequest('/slow')).rejects.toThrow('Request timed out.');
  });

  it('throws ApiError on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

    await expect(apiRequest('/any')).rejects.toThrow(ApiError);
  });
});

describe('api helpers', () => {
  it('api.get sends GET request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    await api.get('/users');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('api.post sends POST with JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    await api.post('/users', { name: 'Test' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })
    );
  });
});
