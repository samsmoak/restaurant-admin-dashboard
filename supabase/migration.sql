-- ═══════════════════════════════════════════════════════════
-- RESTAURANT ORDERING SAAS — COMPLETE SUPABASE MIGRATION
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════
-- TABLE: restaurant_settings
-- ═══════════════════════════════════════
CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Restaurant',
  logo_url TEXT,
  phone TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  estimated_pickup_time INTEGER DEFAULT 20,
  estimated_delivery_time INTEGER DEFAULT 45,
  currency TEXT DEFAULT 'USD',
  opening_hours JSONB DEFAULT '{
    "monday":    {"open":"09:00","close":"22:00","closed":false},
    "tuesday":   {"open":"09:00","close":"22:00","closed":false},
    "wednesday": {"open":"09:00","close":"22:00","closed":false},
    "thursday":  {"open":"09:00","close":"22:00","closed":false},
    "friday":    {"open":"09:00","close":"23:00","closed":false},
    "saturday":  {"open":"10:00","close":"23:00","closed":false},
    "sunday":    {"open":"10:00","close":"21:00","closed":false}
  }'::jsonb,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABLE: categories
-- ═══════════════════════════════════════
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABLE: menu_items
-- ═══════════════════════════════════════
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABLE: item_sizes
-- ═══════════════════════════════════════
CREATE TABLE item_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false
);

-- ═══════════════════════════════════════
-- TABLE: item_extras
-- ═══════════════════════════════════════
CREATE TABLE item_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true
);

-- ═══════════════════════════════════════
-- TABLE: orders
-- ═══════════════════════════════════════
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','preparing','ready','completed','cancelled')),
  order_type TEXT NOT NULL CHECK (order_type IN ('pickup','delivery')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  special_instructions TEXT,
  estimated_ready_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABLE: admin_users
-- ═══════════════════════════════════════
CREATE TABLE admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- ORDER NUMBER GENERATION FUNCTION
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = NEW.order_number) LOOP
    NEW.order_number := 'ORD-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ═══════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- restaurant_settings
CREATE POLICY "Public read settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON restaurant_settings FOR UPDATE USING (is_admin());
CREATE POLICY "Admin insert settings" ON restaurant_settings FOR INSERT WITH CHECK (is_admin());

-- categories
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update categories" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete categories" ON categories FOR DELETE USING (is_admin());

-- menu_items
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin insert menu_items" ON menu_items FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update menu_items" ON menu_items FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete menu_items" ON menu_items FOR DELETE USING (is_admin());

-- item_sizes
CREATE POLICY "Public read item_sizes" ON item_sizes FOR SELECT USING (true);
CREATE POLICY "Admin insert item_sizes" ON item_sizes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update item_sizes" ON item_sizes FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete item_sizes" ON item_sizes FOR DELETE USING (is_admin());

-- item_extras
CREATE POLICY "Public read item_extras" ON item_extras FOR SELECT USING (true);
CREATE POLICY "Admin insert item_extras" ON item_extras FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update item_extras" ON item_extras FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete item_extras" ON item_extras FOR DELETE USING (is_admin());

-- orders
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public track orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete orders" ON orders FOR DELETE USING (is_admin());

-- admin_users
CREATE POLICY "Admin read admin_users" ON admin_users FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert admin_users" ON admin_users FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update admin_users" ON admin_users FOR UPDATE USING (is_admin());

-- ═══════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ═══════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-assets', 'restaurant-assets', true);

CREATE POLICY "Public read menu-images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Admin upload menu-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND is_admin());
CREATE POLICY "Admin update menu-images" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images' AND is_admin());
CREATE POLICY "Admin delete menu-images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images' AND is_admin());

CREATE POLICY "Public read restaurant-assets" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-assets');
CREATE POLICY "Admin upload restaurant-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'restaurant-assets' AND is_admin());
CREATE POLICY "Admin delete restaurant-assets" ON storage.objects FOR DELETE USING (bucket_id = 'restaurant-assets' AND is_admin());

-- ═══════════════════════════════════════════════════════════
-- CUSTOMER PROFILES — customer-side accounts (eaters, not staff)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE customer_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  default_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON customer_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON customer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON customer_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin read all customer profiles" ON customer_profiles
  FOR SELECT USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- LINK ORDERS TO CUSTOMER ACCOUNTS
-- ═══════════════════════════════════════════════════════════
ALTER TABLE orders
  ADD COLUMN customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Tighten insert policy: only authenticated customers with a profile can create orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Authenticated customers create orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND customer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM customer_profiles WHERE id = auth.uid())
  );

-- Customers read their own orders (public order-number tracking still works via "Public track orders")
CREATE POLICY "Customers read own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- AUTO-PROVISION customer_profiles FOR NEW AUTH USERS
-- Fires for email/password signups AND OAuth (Google) signups.
-- Admin-only users also get a row; middleware gives admin_users
-- precedence, so the extra row is harmless.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- ADMIN SELF-PROVISION (invite-gated at the app layer)
-- The original "Admin insert admin_users" policy required the
-- caller to already be an admin, which made first-admin creation
-- impossible. Replace with a self-insert policy. Invite-code
-- verification happens server-side in /onboard/finalize.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admin insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Self insert admin_users" ON admin_users;
CREATE POLICY "Self insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════
-- DEFAULT restaurant_settings ROW
-- Ensure at least one row exists so the settings UI can load
-- immediately after the first admin is provisioned.
-- ═══════════════════════════════════════════════════════════
INSERT INTO restaurant_settings (name)
SELECT 'My Restaurant'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings);

-- ═══════════════════════════════════════════════════════════
-- MANUAL OPEN/CLOSED OVERRIDE
-- NULL/false = follow opening_hours schedule.
-- true = force-closed regardless of schedule.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS manual_closed BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════
-- ADMIN INVITES — single-use codes with optional email binding.
-- Replaces the shared RESTAURANT_OWNER_INVITE_CODE env var.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read invites" ON admin_invites;
DROP POLICY IF EXISTS "Admin insert invites" ON admin_invites;
DROP POLICY IF EXISTS "Admin update invites" ON admin_invites;
DROP POLICY IF EXISTS "Admin delete invites" ON admin_invites;
DROP POLICY IF EXISTS "Finalize reads pending invites" ON admin_invites;

CREATE POLICY "Admin read invites" ON admin_invites
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert invites" ON admin_invites
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update invites" ON admin_invites
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete invites" ON admin_invites
  FOR DELETE USING (is_admin());

-- Signed-in non-admins (being onboarded) need to verify their code before
-- claiming. Allow reads only of pending (non-used, non-revoked) rows.
CREATE POLICY "Pending invite lookup" ON admin_invites
  FOR SELECT USING (used_at IS NULL AND revoked = false);

-- Security-definer function that claims a pending invite for the current user.
-- Inserts admin_users + marks the invite used, atomically. Enforces email
-- binding if the invite was created with a specific email.
CREATE OR REPLACE FUNCTION public.claim_admin_invite(invite_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_id UUID;
  row_email TEXT;
  current_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, email INTO row_id, row_email
    FROM admin_invites
    WHERE code = invite_code
      AND used_at IS NULL
      AND revoked = false
    LIMIT 1;

  IF row_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already-used invite code';
  END IF;

  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();

  IF row_email IS NOT NULL AND lower(row_email) <> lower(COALESCE(current_email, '')) THEN
    RAISE EXCEPTION 'This invite is tied to a different email';
  END IF;

  INSERT INTO admin_users (id, email, role)
  VALUES (auth.uid(), COALESCE(current_email, ''), 'admin')
  ON CONFLICT (id) DO NOTHING;

  UPDATE admin_invites
  SET used_by = auth.uid(), used_at = NOW()
  WHERE id = row_id;
END;
$$;
