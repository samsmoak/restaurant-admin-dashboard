'use client';

/**
 * Admin-side auth store. Two-phase login:
 *   1. `login(email, password)` → sets base token + memberships
 *   2. `activate(restaurant_id)` → upgrades token to an admin JWT scoped to a
 *      specific restaurant. Only scoped tokens can call `/api/admin/**`.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setStoredToken, getStoredToken, isApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import type { GoAuthResponse, GoFinalizeResult, GoMembership, GoUser } from '@/lib/api/dto';

type AuthState = {
  token: string | null;
  user: GoUser | null;
  memberships: GoMembership[];
  activeRestaurantId: string | null;
  activeRole: string | null;
  loading: boolean;
  error: string | null;

  signup: (input: { full_name: string; email: string; phone: string; password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (id_token: string) => Promise<void>;
  finalize: (invite_code: string) => Promise<GoFinalizeResult>;
  activate: (restaurant_id: string) => Promise<void>;
  signout: () => Promise<void>;
  hydrate: () => void;
};

function applyBase(set: (p: Partial<AuthState>) => void, resp: GoAuthResponse) {
  setStoredToken(resp.token);
  set({
    token: resp.token,
    user: resp.user,
    memberships: resp.memberships,
    loading: false,
    error: null,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      memberships: [],
      activeRestaurantId: null,
      activeRole: null,
      loading: false,
      error: null,

      async signup(input) {
        set({ loading: true, error: null });
        try {
          const resp = await authApi.signupCustomer(input);
          applyBase(set, resp);
        } catch (e) {
          set({ loading: false, error: isApiError(e) ? e.error : 'signup failed' });
          throw e;
        }
      },

      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const resp = await authApi.login({ email, password });
          applyBase(set, resp);
          if (resp.memberships.length === 1) {
            await get().activate(resp.memberships[0].restaurant_id);
          }
        } catch (e) {
          set({ loading: false, error: isApiError(e) ? e.error : 'login failed' });
          throw e;
        }
      },

      async signInWithGoogle(id_token) {
        set({ loading: true, error: null });
        try {
          const resp = await authApi.google(id_token);
          applyBase(set, resp);
          if (resp.memberships.length === 1) {
            await get().activate(resp.memberships[0].restaurant_id);
          }
        } catch (e) {
          set({ loading: false, error: isApiError(e) ? e.error : 'google sign-in failed' });
          throw e;
        }
      },

      async finalize(invite_code) {
        set({ loading: true, error: null });
        try {
          const result = await authApi.finalize(invite_code);
          setStoredToken(result.token);
          set({
            token: result.token,
            activeRestaurantId: result.restaurant_id,
            activeRole: result.role,
            loading: false,
          });
          return result;
        } catch (e) {
          set({ loading: false, error: isApiError(e) ? e.error : 'finalize failed' });
          throw e;
        }
      },

      async activate(restaurant_id) {
        set({ loading: true, error: null });
        try {
          const resp = await authApi.activate(restaurant_id);
          setStoredToken(resp.token);
          const m = resp.memberships.find((x) => x.restaurant_id === restaurant_id);
          set({
            token: resp.token,
            user: resp.user,
            memberships: resp.memberships,
            activeRestaurantId: restaurant_id,
            activeRole: m?.role ?? null,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: isApiError(e) ? e.error : 'activate failed' });
          throw e;
        }
      },

      async signout() {
        try {
          await authApi.signout();
        } catch {
          /* ignore */
        }
        setStoredToken(null);
        set({
          token: null,
          user: null,
          memberships: [],
          activeRestaurantId: null,
          activeRole: null,
        });
      },

      hydrate() {
        // Trigger zustand-persist rehydration after mount (skipHydration: true
        // means SSR starts with default state; we catch up on the client).
        void useAuthStore.persist.rehydrate();
      },
    }),
    {
      name: 'rs-admin-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : undefined) as Storage),
      skipHydration: true,
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        memberships: s.memberships,
        activeRestaurantId: s.activeRestaurantId,
        activeRole: s.activeRole,
      }),
    }
  )
);
