'use client';

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { teamApi } from '@/lib/api/endpoints';
import type { GoAdminUser } from '@/lib/api/dto';

type TeamState = {
  users: GoAdminUser[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  del: (id: string) => Promise<void>;
};

export const useTeamStore = create<TeamState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const { users } = await teamApi.list();
      set({ users, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load team' });
    }
  },

  async del(id) {
    await teamApi.del(id);
    set({ users: get().users.filter((u) => u.id !== id) });
  },
}));
