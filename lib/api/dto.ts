/** Wire shape of the Go backend responses (admin side). */

export type GoRestaurant = {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  formatted_address?: string;
  latitude: number;
  longitude: number;
  place_id?: string;
  timezone?: string;
  address?: string; // legacy
  delivery_fee: number;
  min_order_amount: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
  currency: string;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  manual_closed: boolean;
  onboarding_completed_steps: string[];
  created_at: string;
  updated_at: string;
};

export type GoMenuSize = { id: string; name: string; price_modifier: number; is_default: boolean };
export type GoMenuExtra = { id: string; name: string; price: number; is_available: boolean };

export type GoMenuItem = {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  sizes: GoMenuSize[];
  extras: GoMenuExtra[];
  created_at: string;
};

export type GoCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type GoOrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'delivered' | 'cancelled';
export type GoOrderType = 'pickup' | 'delivery';
export type GoPaymentStatus = 'pending' | 'paid' | 'failed';

export type GoOrderLine = {
  id: string;
  name: string;
  quantity: number;
  base_price: number;
  selected_size: { name: string; price_modifier: number } | null;
  selected_extras: { name: string; price: number }[];
  special_instructions?: string;
  item_total: number;
};

export type GoOrder = {
  id: string;
  restaurant_id: string;
  order_number: string;
  status: GoOrderStatus;
  order_type: GoOrderType;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  items: GoOrderLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_intent_id?: string;
  payment_status: GoPaymentStatus;
  special_instructions?: string;
  estimated_ready_time?: string;
  created_at: string;
};

export type GoUser = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type GoMembership = {
  restaurant_id: string;
  restaurant_name: string;
  role: 'owner' | 'admin' | 'staff';
};

export type GoAuthResponse = {
  token: string;
  user: GoUser;
  profile?: unknown;
  is_admin: boolean;
  memberships: GoMembership[];
};

export type GoFinalizeResult = {
  restaurant_id: string;
  token: string;
  role: string;
};

export type GoAdminUser = {
  id: string;
  user_id: string;
  restaurant_id: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
};

export type GoInvite = {
  id: string;
  restaurant_id: string;
  code: string;
  email?: string;
  note?: string;
  role?: string;
  created_by?: string;
  used_by?: string;
  used_at?: string;
  revoked: boolean;
  created_at: string;
};

export type GoInviteWithShare = GoInvite & { share_url: string };

export type GoRealtimeEvent<T = unknown> = {
  type: 'order.created' | 'order.updated' | 'order.deleted' | 'ready' | 'error';
  order?: T;
  ts: number;
};

export type GoPresignResponse = { upload_url: string; public_url: string; key: string };

export type GoSubscription = {
  setup_fee_paid: boolean;
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_end?: string;
};

export type GoCheckoutResult = {
  url: string;
};
