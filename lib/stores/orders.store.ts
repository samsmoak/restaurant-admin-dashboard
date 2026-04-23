'use client';

/**
 * Admin orders store: real-time feed over WebSocket + polling fallback.
 *
 * Subscribe by calling `.attach()` once on mount of a layout that should
 * listen; `.detach()` on unmount.
 */

import { create } from 'zustand';
import { getStoredToken, isApiError, wsUrl } from '@/lib/api/client';
import { ordersApi } from '@/lib/api/endpoints';
import type { GoOrder, GoOrderStatus, GoRealtimeEvent } from '@/lib/api/dto';

type OrdersState = {
  orders: GoOrder[];
  loading: boolean;
  error: string | null;
  statusFilter: GoOrderStatus | 'all';
  socket: WebSocket | null;
  pollTimer: number | null;

  setStatusFilter: (s: GoOrderStatus | 'all') => void;
  fetch: () => Promise<void>;
  updateStatus: (id: string, status: GoOrderStatus) => Promise<void>;
  del: (id: string) => Promise<void>;

  getByStatus: (status: GoOrderStatus) => GoOrder[];
  getNewOrderCount: () => number;

  attach: () => void;
  detach: () => void;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: true,
  error: null,
  statusFilter: 'all',
  socket: null,
  pollTimer: null,

  setStatusFilter(s) {
    set({ statusFilter: s });
    void get().fetch();
  },

  async fetch() {
    set({ loading: true, error: null });
    try {
      const { orders } = await ordersApi.list(get().statusFilter);
      set({ orders, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load orders' });
    }
  },

  async updateStatus(id, status) {
    await ordersApi.updateStatus(id, { status });
    set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)) });
  },

  async del(id) {
    await ordersApi.del(id);
    set({ orders: get().orders.filter((o) => o.id !== id) });
  },

  getByStatus(status) {
    return get().orders.filter((o) => o.status === status);
  },
  getNewOrderCount() {
    return get().orders.filter((o) => o.status === 'new').length;
  },

  attach() {
    if (typeof window === 'undefined') return;
    if (get().socket) return;
    void get().fetch();

    const token = getStoredToken();
    if (!token) return;

    const socket = new WebSocket(wsUrl('/ws/admin/orders', { token }));
    socket.onmessage = (msg) => {
      try {
        const evt: GoRealtimeEvent<GoOrder> = JSON.parse(msg.data);
        const cur = get().orders;
        if (evt.type === 'order.created' && evt.order) {
          set({ orders: [evt.order, ...cur.filter((o) => o.id !== evt.order!.id)] });
        } else if (evt.type === 'order.updated' && evt.order) {
          const o = evt.order;
          set({ orders: cur.map((x) => (x.id === o.id ? o : x)) });
        } else if (evt.type === 'order.deleted' && evt.order) {
          const o = evt.order as unknown as { id: string };
          set({ orders: cur.filter((x) => x.id !== o.id) });
        }
      } catch {
        /* ignore */
      }
    };
    const timer = window.setInterval(() => void get().fetch(), 30000);
    set({ socket, pollTimer: timer });
  },

  detach() {
    const { socket, pollTimer } = get();
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    if (pollTimer) window.clearInterval(pollTimer);
    set({ socket: null, pollTimer: null });
  },
}));
