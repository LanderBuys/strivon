/**
 * API client with base URL from env, optional rate limiting, and error handling.
 * Use this for all backend requests when you replace mocks.
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
export const API_BASE_URL = (extra?.apiUrl as string) || '';

/** Simple in-memory rate limit: max N calls per key per windowMs */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_PER_WINDOW = 60;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_PER_WINDOW) return false;
  entry.count++;
  return true;
}

export interface RequestConfig extends RequestInit {
  skipRateLimit?: boolean;
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipRateLimit, timeoutMs = 15000, ...init } = config;
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  if (!skipRateLimit && API_BASE_URL) {
    const key = `api:${path.split('?')[0]}`;
    if (!rateLimit(key)) {
      throw new ApiError('Too many requests. Please try again later.', 429);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(typeof init.headers === 'object' && !Array.isArray(init.headers) ? init.headers : {}),
      },
    });
    clearTimeout(timeout);
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    if (!res.ok) {
      throw new ApiError(
        (body as any)?.message ?? `Request failed: ${res.status}`,
        res.status,
        body
      );
    }
    return body as T;
  } catch (e: any) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new ApiError('Request timed out.', 408);
    if (e instanceof ApiError) throw e;
    throw new ApiError(e?.message ?? 'Network error.');
  }
}

export const api = {
  get: <T = unknown>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'DELETE' }),
};
