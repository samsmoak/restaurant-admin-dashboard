import { z } from 'zod';

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  customerEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  orderType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  deliveryNotes: z.string().optional(),
  specialInstructions: z.string().optional(),
}).refine((data) => {
  if (data.orderType === 'delivery') {
    return !!data.deliveryAddress && !!data.deliveryCity && !!data.deliveryState && !!data.deliveryZip;
  }
  return true;
}, {
  message: 'Delivery address is required for delivery orders',
  path: ['deliveryAddress'],
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  is_featured: z.boolean().default(false),
  is_available: z.boolean().default(true),
  sizes: z.array(z.object({
    name: z.string().min(1, 'Size name is required'),
    price_modifier: z.coerce.number().default(0),
    is_default: z.boolean().default(false),
  })).optional(),
  extras: z.array(z.object({
    name: z.string().min(1, 'Extra name is required'),
    price: z.coerce.number().min(0).default(0),
    is_available: z.boolean().default(true),
  })).optional(),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  delivery_fee: z.coerce.number().min(0).default(0),
  min_order_amount: z.coerce.number().min(0).default(0),
  estimated_pickup_time: z.coerce.number().min(1).default(20),
  estimated_delivery_time: z.coerce.number().min(1).default(45),
  currency: z.string().default('USD'),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const customerSignupSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CustomerSignupFormData = z.infer<typeof customerSignupSchema>;

export const customerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CustomerLoginFormData = z.infer<typeof customerLoginSchema>;

export const adminOnboardSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});

export type AdminOnboardFormData = z.infer<typeof adminOnboardSchema>;
