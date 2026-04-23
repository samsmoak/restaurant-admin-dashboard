'use client';

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { categoriesApi } from '@/lib/api/endpoints';
import type { GoCategory } from '@/lib/api/dto';

type CategoriesState = {
  categories: GoCategory[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (body: unknown) => Promise<GoCategory>;
  update: (id: string, body: unknown) => Promise<GoCategory>;
  del: (id: string) => Promise<void>;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const { categories } = await categoriesApi.list();
      set({ categories, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load categories' });
    }
  },

  async create(body) {
    const row = await categoriesApi.create(body);
    set({ categories: [...get().categories, row] });
    return row;
  },

  async update(id, body) {
    const row = await categoriesApi.update(id, body);
    set({ categories: get().categories.map((c) => (c.id === id ? row : c)) });
    return row;
  },

  async del(id) {
    await categoriesApi.del(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
}));
