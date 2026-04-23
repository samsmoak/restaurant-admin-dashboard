'use client';

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { adminRestaurantApi, restaurantsApi, type SettingsPatch } from '@/lib/api/endpoints';
import type { GoRestaurant } from '@/lib/api/dto';

type RestaurantState = {
  restaurant: GoRestaurant | null;
  mine: GoRestaurant[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  fetchMine: () => Promise<GoRestaurant[]>;
  createRestaurant: (input: { name: string; description?: string; phone?: string; email?: string }) => Promise<GoRestaurant>;
  update: (body: SettingsPatch) => Promise<GoRestaurant | null>;
  toggleManualClosed: (closed: boolean) => Promise<void>;
  markStepComplete: (step: string) => Promise<GoRestaurant | null>;
};

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurant: null,
  mine: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const r = await adminRestaurantApi.get();
      set({ restaurant: r, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load restaurant' });
    }
  },

  async fetchMine() {
    set({ loading: true, error: null });
    try {
      const { restaurants } = await restaurantsApi.listMine();
      set({ mine: restaurants, loading: false });
      return restaurants;
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load restaurants' });
      return [];
    }
  },

  async createRestaurant(input) {
    set({ loading: true, error: null });
    try {
      const r = await restaurantsApi.create(input);
      set((s) => ({ mine: [r, ...s.mine], restaurant: r, loading: false }));
      return r;
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to create restaurant' });
      throw e;
    }
  },

  async update(body) {
    set({ loading: true, error: null });
    try {
      const r = await adminRestaurantApi.update(body);
      set({ restaurant: r, loading: false });
      return r;
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to save' });
      throw e;
    }
  },

  async toggleManualClosed(closed) {
    try {
      const r = await adminRestaurantApi.toggleManualClosed(closed);
      set({ restaurant: r });
    } catch (e) {
      set({ error: isApiError(e) ? e.error : 'failed to toggle' });
    }
  },

  async markStepComplete(step) {
    try {
      const r = await adminRestaurantApi.markStepComplete(step);
      set({ restaurant: r });
      // Also refresh `mine` in case another code path is reading from it.
      if (r && get().mine.length > 0) {
        set((s) => ({ mine: s.mine.map((m) => (m.id === r.id ? r : m)) }));
      }
      return r;
    } catch (e) {
      set({ error: isApiError(e) ? e.error : 'failed to mark step complete' });
      return null;
    }
  },
}));
