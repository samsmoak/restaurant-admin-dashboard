'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderStatus } from '@/types';

export function useOrders(statusFilter?: OrderStatus | 'all') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    setOrders(data as Order[]);
    setLoading(false);
  }, [statusFilter, supabase]);

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as { id: string };
            setOrders((prev) =>
              prev.filter((order) => order.id !== deletedOrder.id)
            );
          }
        }
      )
      .subscribe();

    // Polling fallback every 30s
    const pollInterval = setInterval(fetchOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchOrders, supabase]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((order) => order.status === status);

  const getNewOrderCount = () =>
    orders.filter((order) => order.status === 'new').length;

  return {
    orders,
    loading,
    updateOrderStatus,
    getOrdersByStatus,
    getNewOrderCount,
    refetch: fetchOrders,
  };
}

export function useOrderTracking(orderNumber: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
        return;
      }

      setOrder(data as Order);
      setLoading(false);
    };

    fetchOrder();

    // Realtime subscription for this specific order
    const channel = supabase
      .channel(`order-${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderNumber, supabase]);

  return { order, loading };
}
