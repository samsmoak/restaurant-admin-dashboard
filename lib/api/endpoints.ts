import { api } from './client';
import type {
  GoAdminUser,
  GoAuthResponse,
  GoCategory,
  GoFinalizeResult,
  GoInvite,
  GoInviteWithShare,
  GoMembership,
  GoMenuItem,
  GoOrder,
  GoPresignResponse,
  GoRestaurant,
} from './dto';

export const authApi = {
  login: (input: { email: string; password: string }) =>
    api.post<GoAuthResponse>('/api/auth/login', input, { anonymous: true }),
  google: (id_token: string) =>
    api.post<GoAuthResponse>('/api/auth/google', { id_token }, { anonymous: true }),
  signupCustomer: (input: { full_name: string; email: string; phone: string; password: string }) =>
    api.post<GoAuthResponse>('/api/auth/signup/customer', input, { anonymous: true }),
  memberships: () => api.get<{ memberships: GoMembership[] }>('/api/auth/memberships'),
  finalize: (invite_code: string) =>
    api.post<GoFinalizeResult>('/api/auth/admin/finalize', { invite_code }),
  activate: (restaurant_id: string) =>
    api.post<GoAuthResponse>('/api/auth/admin/activate', { restaurant_id }),
  signout: () => api.post<void>('/api/auth/signout', {}, { anonymous: true }),
};

export const restaurantsApi = {
  create: (input: { name: string; description?: string; phone?: string; email?: string }) =>
    api.post<GoRestaurant>('/api/restaurants', input),
  listMine: () => api.get<{ restaurants: GoRestaurant[] }>('/api/restaurants/mine'),
  getById: (id: string) =>
    api.get<GoRestaurant>(`/api/restaurants/${encodeURIComponent(id)}`, { anonymous: true }),
};

export type SettingsPatch = Partial<{
  name: string;
  logo_url: string;
  phone: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  timezone: string;
  delivery_fee: number;
  min_order_amount: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
  currency: string;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  manual_closed: boolean;
  completed_step: string;
}>;

export const adminRestaurantApi = {
  get: () => api.get<GoRestaurant>('/api/admin/restaurant'),
  update: (body: SettingsPatch) => api.put<GoRestaurant>('/api/admin/restaurant', body),
  toggleManualClosed: (closed: boolean) =>
    api.post<GoRestaurant>('/api/admin/restaurant/manual-closed', { closed }),
  markStepComplete: (step: string) =>
    api.post<GoRestaurant>('/api/admin/restaurant/onboarding/complete-step', { step }),
};

export const categoriesApi = {
  list: () => api.get<{ categories: GoCategory[] }>('/api/admin/categories'),
  create: (body: unknown) => api.post<GoCategory>('/api/admin/categories', body),
  update: (id: string, body: unknown) => api.put<GoCategory>(`/api/admin/categories/${id}`, body),
  del: (id: string) => api.del<void>(`/api/admin/categories/${id}`),
};

export const menuApi = {
  list: () => api.get<{ items: GoMenuItem[] }>('/api/admin/menu-items'),
  create: (body: unknown) => api.post<GoMenuItem>('/api/admin/menu-items', body),
  update: (id: string, body: unknown) => api.put<GoMenuItem>(`/api/admin/menu-items/${id}`, body),
  del: (id: string) => api.del<void>(`/api/admin/menu-items/${id}`),
};

export const ordersApi = {
  list: (status: string = 'all') =>
    api.get<{ orders: GoOrder[] }>(`/api/admin/orders?status=${encodeURIComponent(status)}`),
  analytics: (from?: number, to?: number) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', String(from));
    if (to) qs.set('to', String(to));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<{ orders: GoOrder[] }>(`/api/admin/orders/analytics${suffix}`);
  },
  updateStatus: (id: string, body: { status?: string; estimated_ready_time?: string }) =>
    api.put<GoOrder>(`/api/admin/orders/${id}`, body),
  del: (id: string) => api.del<void>(`/api/admin/orders/${id}`),
};

export const invitesApi = {
  list: () => api.get<{ invites: GoInvite[] }>('/api/admin/invites'),
  create: (input: { email?: string; note?: string; role?: string }) =>
    api.post<GoInviteWithShare>('/api/admin/invites', input),
  revoke: (id: string) => api.patch<{ ok: boolean }>(`/api/admin/invites/${id}/revoke`),
  del: (id: string) => api.del<void>(`/api/admin/invites/${id}`),
};

export const teamApi = {
  list: () => api.get<{ users: GoAdminUser[] }>('/api/admin/users'),
  del: (id: string) => api.del<void>(`/api/admin/users/${id}`),
};

export const uploadsApi = {
  presign: (input: { prefix: 'logos' | 'menu-images'; filename: string; content_type: string; size: number }) =>
    api.post<GoPresignResponse>('/api/admin/uploads/presign', input),
  direct: async (prefix: 'logos' | 'menu-images', file: File) => {
    const { getStoredToken, apiBaseUrl } = await import('./client');
    const fd = new FormData();
    fd.append('prefix', prefix);
    fd.append('file', file);
    const token = getStoredToken();
    const res = await fetch(`${apiBaseUrl()}/api/admin/uploads/direct`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const body = await res.text();
      throw { status: res.status, error: body } as const;
    }
    return (await res.json()) as { public_url: string; key: string };
  },
};
