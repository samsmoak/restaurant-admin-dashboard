'use client';

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { menuApi } from '@/lib/api/endpoints';
import type { GoMenuItem } from '@/lib/api/dto';

type MenuState = {
  items: GoMenuItem[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (body: unknown) => Promise<GoMenuItem>;
  update: (id: string, body: unknown) => Promise<GoMenuItem>;
  del: (id: string) => Promise<void>;
};

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const { items } = await menuApi.list();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load menu items' });
    }
  },

  async create(body) {
    const row = await menuApi.create(body);
    set({ items: [...get().items, row] });
    return row;
  },

  async update(id, body) {
    const row = await menuApi.update(id, body);
    set({ items: get().items.map((i) => (i.id === id ? row : i)) });
    return row;
  },

  async del(id) {
    await menuApi.del(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));
