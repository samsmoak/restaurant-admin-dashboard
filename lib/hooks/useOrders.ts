'use client';

/**
 * Go-backend version of `useOrders` — delegates to the orders zustand store.
 * The original Supabase implementation is preserved as
 * `lib/hooks/useOrders.supabase.ts`.
 */

import { useEffect } from 'react';
import { useOrdersStore } from '@/lib/stores/orders.store';
import type { GoOrderStatus } from '@/lib/api/dto';

export function useOrders(statusFilter?: GoOrderStatus | 'all') {
  const orders = useOrdersStore((s) => s.orders);
  const loading = useOrdersStore((s) => s.loading);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const setStatusFilter = useOrdersStore((s) => s.setStatusFilter);
  const attach = useOrdersStore((s) => s.attach);
  const detach = useOrdersStore((s) => s.detach);

  useEffect(() => {
    attach();
    return () => detach();
  }, [attach, detach]);

  useEffect(() => {
    if (statusFilter) setStatusFilter(statusFilter);
  }, [statusFilter, setStatusFilter]);

  return {
    orders,
    loading,
    updateOrderStatus: updateStatus,
    getOrdersByStatus: (status: GoOrderStatus) =>
      orders.filter((o) => o.status === status),
    getNewOrderCount: () => orders.filter((o) => o.status === 'new').length,
    refetch: () => useOrdersStore.getState().fetch(),
  };
}

export function useOrderTracking(_orderNumber: string | null) {
  // Admin side doesn't use per-order tracking; customer side has its own version.
  return { order: null, loading: false };
}
