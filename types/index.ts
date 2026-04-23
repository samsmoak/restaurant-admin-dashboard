// ═══════════════════════════════════════════════════════════
// DATABASE TYPES
// ═══════════════════════════════════════════════════════════

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  delivery_fee: number;
  min_order_amount: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
  currency: string;
  opening_hours: OpeningHours;
  address: string | null;
  manual_closed: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  // Joined relations
  sizes?: ItemSize[];
  extras?: ItemExtra[];
  category?: Category;
}

export interface ItemSize {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
}

export interface ItemExtra {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  base_price: number;
  selected_size: {
    name: string;
    price_modifier: number;
  } | null;
  selected_extras: {
    name: string;
    price: number;
  }[];
  special_instructions: string;
  item_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_intent_id: string | null;
  payment_status: PaymentStatus;
  special_instructions: string | null;
  estimated_ready_time: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// CART TYPES
// ═══════════════════════════════════════════════════════════

export interface CartItem {
  cartId: string; // unique cart line item ID
  menuItemId: string;
  name: string;
  image_url: string | null;
  quantity: number;
  base_price: number;
  selectedSize: {
    name: string;
    price_modifier: number;
  } | null;
  selectedExtras: {
    name: string;
    price: number;
  }[];
  specialInstructions: string;
  itemTotal: number; // (base_price + size modifier + extras) * quantity
}

export interface CartStore {
  items: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  addItem: (item: Omit<CartItem, 'cartId' | 'itemTotal'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT PROP TYPES
// ═══════════════════════════════════════════════════════════

export interface MenuItemWithRelations extends Omit<MenuItem, 'category'> {
  sizes: ItemSize[];
  extras: ItemExtra[];
  category: Category | null;
}

export interface CategoryWithItems extends Category {
  items: MenuItemWithRelations[];
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS TYPES
// ═══════════════════════════════════════════════════════════

export interface DailyStats {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  completionRate: number;
  revenueChange: number;
  orderCountChange: number;
  aovChange: number;
  completionRateChange: number;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
}

export interface TopMenuItem {
  name: string;
  count: number;
}

export interface HourlyVolume {
  hour: string;
  orders: number;
}
