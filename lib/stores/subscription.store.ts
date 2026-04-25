'use client';

import { create } from 'zustand';
import { billingApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/client';
import type { GoSubscription } from '@/lib/api/dto';

export function isSubscriptionActive(s: GoSubscription): boolean {
  return s.setup_fee_paid && s.subscription_status === 'active';
}

type SubscriptionState = {
  subscription: GoSubscription | null;
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  createSetupCheckout: (returnUrl: string) => Promise<string>;
  createSubscriptionCheckout: (returnUrl: string) => Promise<string>;
  openPortal: (returnUrl: string) => Promise<string>;
};

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  subscription: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await billingApi.getSubscription();
      set({ subscription: data, loading: false });
    } catch (e) {
      // 404 means the billing endpoint isn't deployed yet — don't block access.
      if (isApiError(e) && e.status === 404) {
        set({ subscription: null, loading: false });
        return;
      }
      set({
        loading: false,
        error: isApiError(e) ? e.error : 'Failed to load subscription.',
      });
    }
  },

  createSetupCheckout: async (returnUrl: string) => {
    const result = await billingApi.createSetupCheckout(returnUrl);
    return result.url;
  },

  createSubscriptionCheckout: async (returnUrl: string) => {
    const result = await billingApi.createSubscriptionCheckout(returnUrl);
    return result.url;
  },

  openPortal: async (returnUrl: string) => {
    const result = await billingApi.openPortal(returnUrl);
    return result.url;
  },
}));
