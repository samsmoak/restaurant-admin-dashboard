'use client';

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { invitesApi } from '@/lib/api/endpoints';
import type { GoInvite, GoInviteWithShare } from '@/lib/api/dto';

type InvitesState = {
  invites: GoInvite[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (input: { email?: string; note?: string; role?: string }) => Promise<GoInviteWithShare>;
  revoke: (id: string) => Promise<void>;
  del: (id: string) => Promise<void>;
};

export const useInvitesStore = create<InvitesState>((set, get) => ({
  invites: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const { invites } = await invitesApi.list();
      set({ invites, loading: false });
    } catch (e) {
      set({ loading: false, error: isApiError(e) ? e.error : 'failed to load invites' });
    }
  },

  async create(input) {
    const row = await invitesApi.create(input);
    set({ invites: [row, ...get().invites] });
    return row;
  },

  async revoke(id) {
    await invitesApi.revoke(id);
    set({ invites: get().invites.map((i) => (i.id === id ? { ...i, revoked: true } : i)) });
  },

  async del(id) {
    await invitesApi.del(id);
    set({ invites: get().invites.filter((i) => i.id !== id) });
  },
}));
