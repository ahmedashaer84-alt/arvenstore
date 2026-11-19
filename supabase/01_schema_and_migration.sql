-- ==============================================================================
-- ARVEN — Step 1: Non-Destructive Schema & Safe Migration
-- Compatible with BOTH:
--   (A) Existing project (ecazrleqdbpaoidpdmst) preserving existing public.products rows
--   (B) Brand-new Supabase project
-- ==============================================================================
-- GUARANTEES:
-- - Does NOT drop tables.
-- - Does NOT delete existing rows or auth users.
-- - Adds missing canonical columns idempotently via ADD COLUMN IF NOT EXISTS.
-- ==============================================================================

BEGIN;

-- Ensure UUID generator is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Admin Authorization Table (Database-Enforced Admin Role)
-- ------------------------------------------------------------------------------
-- Signing up a new user in Supabase Auth will NEVER automatically insert into
-- public.admin_users. Only explicitly seeded rows grant admin privileges.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_users IS
  'Explicit allow-list of authorized ARVEN administrators. Enforced via RLS.';

-- Helper function used across Database RLS and Storage RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. Products Table (Create if new, or migrate safely if already existing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  slug text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NULL,
  currency text NOT NULL DEFAULT 'SAR',
  image_url text NULL,
  image_path text NULL,
  purchase_url text NULL,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Non-destructive column additions for existing `public.products` tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric(12, 2) NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'SAR';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_url text NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Clean up any empty strings into NULL for purchase_url before adding check constraint
UPDATE public.products
SET purchase_url = NULL
WHERE purchase_url IS NOT NULL AND btrim(purchase_url) = '';

-- Validate price is non-negative when present (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'arven_products_price_non_negative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT arven_products_price_non_negative
      CHECK (price IS NULL OR price >= 0);
  END IF;
END $$;

-- Validate purchase_url protocol is strictly http:// or https:// when present
-- Using NOT VALID first ensures existing legacy rows won't break migration;
-- new/updated rows are strictly validated immediately!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'arven_products_purchase_url_protocol'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT arven_products_purchase_url_protocol
      CHECK (
        purchase_url IS NULL
        OR purchase_url ~* '^https?://[^\s/$.?#].[^\s]*$'
      ) NOT VALID;
  END IF;
END $$;

-- Enforce case-insensitive unique slug (ignores NULL legacy rows if any exist)
CREATE UNIQUE INDEX IF NOT EXISTS arven_products_slug_lower_uidx
  ON public.products (lower(slug))
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS arven_products_published_sort_idx
  ON public.products (is_published, sort_order ASC, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Store Settings Table (Singleton Row id = 1)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text NOT NULL DEFAULT 'ARVEN',
  brand_tagline_ar text NOT NULL DEFAULT 'اختيارات راقية بعناية لأسلوب حياة متوازن',
  brand_tagline_en text NOT NULL DEFAULT 'Curated essentials for an intentional lifestyle',
  brand_description_ar text NOT NULL DEFAULT 'علامة مختصة بانتقاء منتجات العناية ونمط الحياة وعرضها بتجربة واضحة وموثوقة، مع توجيه مباشر إلى صفحات الشراء الرسمية.',
  brand_description_en text NOT NULL DEFAULT 'An independent curation house showcasing selected lifestyle and care products with direct access to official purchase pages.',
  hero_title_ar text NOT NULL DEFAULT 'فخامة هادئة في كل تفصيل',
  hero_title_en text NOT NULL DEFAULT 'Quiet Luxury, Curated with Purpose',
  hero_subtitle_ar text NOT NULL DEFAULT 'تشكيلة مختارة بعناية تجمع بين الجودة والأناقة اليومية، مع رابط شراء رسمي مستقل لكل منتج.',
  hero_subtitle_en text NOT NULL DEFAULT 'Thoughtfully selected products presented with clarity, transparency, and an independent official purchase link for every item.',
  contact_email text NOT NULL DEFAULT 'arven.business17@gmail.com',
  instagram_handle text NOT NULL DEFAULT '@arven.lifestyle',
  instagram_url text NOT NULL DEFAULT 'https://instagram.com/arven.lifestyle',
  whatsapp_number text NULL,
  default_currency text NOT NULL DEFAULT 'SAR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Automatic updated_at Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arven_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_arven_products_updated_at ON public.products;
CREATE TRIGGER trg_arven_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.arven_set_updated_at();

DROP TRIGGER IF EXISTS trg_arven_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_arven_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.arven_set_updated_at();

COMMIT;

-- ==============================================================================
-- OPTIONAL LEGACY COLUMN COPY (RUN ONLY IF `00_inspect_existing_schema.sql`
-- SHOWED DIFFERENT OLD COLUMN NAMES IN YOUR PREVIOUS `public.products` TABLE)
-- ==============================================================================
-- Example: if your old table had `title`, `affiliate_url`, or `active`:
--
-- UPDATE public.products
-- SET
--   name = CASE WHEN btrim(name) = '' AND title IS NOT NULL THEN title ELSE name END,
--   purchase_url = COALESCE(purchase_url, affiliate_url),
--   is_published = COALESCE(is_published, active, false)
-- WHERE slug = 'oro-stem-serum-samples-7-days-kit' OR btrim(name) = '';
-- ==============================================================================
