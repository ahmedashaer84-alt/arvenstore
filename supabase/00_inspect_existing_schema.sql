-- ==============================================================================
-- ARVEN — Step 0: Read-Only Inspection of Existing Supabase Project
-- Project ID: ecazrleqdbpaoidpdmst
-- ==============================================================================
-- SAFE: This script ONLY reads metadata. It modifies or deletes NOTHING.
-- Run this first in Supabase SQL Editor to verify what already exists before
-- applying `01_schema_and_migration.sql`.
-- ==============================================================================

-- 1. Inspect existing columns of public.products (if the table already exists)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 2. Inspect existing rows count & sample slugs in public.products (if table exists)
-- Uncomment the line below ONLY if query #1 returned columns for public.products:
-- SELECT id, slug, * FROM public.products LIMIT 10;

-- 3. Inspect existing RLS status on public tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Inspect existing RLS policies on public.products (check for legacy open policies!)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Inspect existing Storage buckets and storage.objects policies
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- 6. Verify that the admin account exists in auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE lower(email) = lower('ahmedashaer84@gmail.com');
