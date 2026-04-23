/**
 * Typed HTTP client for the Go backend. Admin-side.
 * Admin JWTs are scoped to a restaurant via the `restaurant_id` claim.
 */

export type ApiError = { status: number; error: string };

const TOKEN_KEY = 'rs_admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url.trim() === '') return 'http://localhost:8080';
  return url.replace(/\/+$/, '');
}

type RequestOptions = RequestInit & {
  token?: string | null;
  anonymous?: boolean;
  json?: unknown;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (opts.json !== undefined) headers.set('Content-Type', 'application/json');
  if (!opts.anonymous) {
    const token = opts.token ?? getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const body = opts.json !== undefined ? JSON.stringify(opts.json) : opts.body;
  const res = await fetch(`${apiBaseUrl()}${path}`, { ...opts, headers, body });
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : typeof payload === 'string' ? payload : 'request failed';
    const err: ApiError = { status: res.status, error: msg };
    throw err;
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', json: body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', json: body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', json: body }),
  del: <T = void>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'status' in e && 'error' in e;
}

export function wsUrl(suffix: string, { token }: { token?: string | null } = {}): string {
  const base = apiBaseUrl().replace(/^http/, 'ws');
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}${suffix.startsWith('/') ? suffix : `/${suffix}`}${qs}`;
}
