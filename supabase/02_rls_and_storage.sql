-- ==============================================================================
-- ARVEN — Step 2: Row Level Security (RLS) & Supabase Storage Policies
-- ==============================================================================
-- Security Model:
-- 1. Visitors (anon) can ONLY read published products (`is_published = true`)
--    and public store_settings.
-- 2. Regular authenticated users who are NOT in `public.admin_users` have
--    ZERO write privileges anywhere.
-- 3. Only verified admins (`public.is_admin() = true`) can read hidden products,
--    create/edit/delete products, edit store_settings, and upload/delete images
--    in the `product-images` bucket.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all ARVEN tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Policies for public.admin_users
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "arven_admin_users_read_self" ON public.admin_users;

CREATE POLICY "arven_admin_users_read_self"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT / UPDATE / DELETE policies on admin_users:
-- Clients can NEVER promote themselves or others to admin.

-- ------------------------------------------------------------------------------
-- 3. Policies for public.products
-- ------------------------------------------------------------------------------
-- IMPORTANT: If `00_inspect_existing_schema.sql` revealed legacy policies on
-- `public.products` (for example, an overly broad "Enable all for authenticated"),
-- review and drop those legacy policies manually so they do not bypass these rules!

DROP POLICY IF EXISTS "arven_products_select_published_or_admin" ON public.products;
DROP POLICY IF EXISTS "arven_products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "arven_products_admin_update" ON public.products;
DROP POLICY IF EXISTS "arven_products_admin_delete" ON public.products;

-- Public reads ONLY published products; authorized admins read all products
CREATE POLICY "arven_products_select_published_or_admin"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_admin());

-- Only authorized admins can insert products
CREATE POLICY "arven_products_admin_insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only authorized admins can update products
CREATE POLICY "arven_products_admin_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only authorized admins can delete products
CREATE POLICY "arven_products_admin_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Policies for public.store_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "arven_settings_public_select" ON public.store_settings;
DROP POLICY IF EXISTS "arven_settings_admin_insert" ON public.store_settings;
DROP POLICY IF EXISTS "arven_settings_admin_update" ON public.store_settings;

CREATE POLICY "arven_settings_public_select"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "arven_settings_admin_insert"
  ON public.store_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "arven_settings_admin_update"
  ON public.store_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Storage Bucket & Strict Admin-Write Policies (`product-images`)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB max per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "arven_storage_public_read_product_images" ON storage.objects;
DROP POLICY IF EXISTS "arven_storage_admin_upload_product_images" ON storage.objects;
DROP POLICY IF EXISTS "arven_storage_admin_update_product_images" ON storage.objects;
DROP POLICY IF EXISTS "arven_storage_admin_delete_product_images" ON storage.objects;

-- Anyone can view product images in the storefront
CREATE POLICY "arven_storage_public_read_product_images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Only verified ARVEN admins can upload images
CREATE POLICY "arven_storage_admin_upload_product_images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only verified ARVEN admins can replace/update images
CREATE POLICY "arven_storage_admin_update_product_images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only verified ARVEN admins can delete images
CREATE POLICY "arven_storage_admin_delete_product_images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

COMMIT;
