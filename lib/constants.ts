import type { OrderStatus } from '@/types';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  pulse: boolean;
}> = {
  new: {
    label: 'New',
    color: '#EAB308',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    dotColor: 'bg-yellow-500',
    pulse: true,
  },
  preparing: {
    label: 'Preparing',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    dotColor: 'bg-blue-500',
    pulse: false,
  },
  ready: {
    label: 'Ready',
    color: '#22C55E',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-500',
    pulse: true,
  },
  completed: {
    label: 'Completed',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    dotColor: 'bg-gray-400',
    pulse: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
    pulse: false,
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ['new', 'preparing', 'ready', 'completed'];

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  new: 'Start Preparing',
  preparing: 'Mark as Ready',
  ready: 'Complete Order',
};
