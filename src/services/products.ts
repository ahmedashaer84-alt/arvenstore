import { requireSupabase } from '../lib/supabase';
import type { Product, ProductInput } from '../types/database';
import { validatePurchaseUrl } from '../utils/url';
import { deleteProductImage } from './storage';

const PUBLIC_PRODUCT_COLUMNS =
  'id, name, slug, short_description, description, price, currency, image_url, purchase_url, is_published, is_featured, sort_order, created_at, updated_at';

const ADMIN_PRODUCT_COLUMNS =
  'id, name, slug, short_description, description, price, currency, image_url, image_path, purchase_url, is_published, is_featured, sort_order, created_at, updated_at';

function normalizeProductRow(raw: Record<string, unknown>): Product {
  const numericPrice =
    raw.price === null || raw.price === undefined || raw.price === ''
      ? null
      : Number(raw.price);

  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    short_description: String(raw.short_description ?? ''),
    description: String(raw.description ?? ''),
    price: numericPrice !== null && !Number.isNaN(numericPrice) ? numericPrice : null,
    currency: String(raw.currency ?? 'SAR'),
    image_url: raw.image_url ? String(raw.image_url) : null,
    image_path: raw.image_path ? String(raw.image_path) : null,
    purchase_url: raw.purchase_url ? String(raw.purchase_url) : null,
    is_published: Boolean(raw.is_published),
    is_featured: Boolean(raw.is_featured),
    sort_order: Number(raw.sort_order ?? 0),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

function mapDatabaseError(error: { code?: string; message?: string }): Error {
  const msg = (error.message ?? '').toLowerCase();
  if (error.code === '23505' || msg.includes('duplicate key') || msg.includes('slug')) {
    return new Error('مسار المنتج (slug) مستخدم بالفعل لمنتج آخر. اختر قيمة فريدة.');
  }
  if (
    error.code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied')
  ) {
    return new Error('لا تملك صلاحية لتنفيذ هذه العملية.');
  }
  if (error.code === '23514' || msg.includes('purchase_url')) {
    return new Error('رابط الشراء غير صالح. يجب أن يبدأ بـ https:// أو http://');
  }
  return new Error(error.message || 'تعذر حفظ البيانات في قاعدة البيانات.');
}

/**
 * Storefront query: fetches ONLY published products directly from PostgreSQL.
 * Each product carries its own independent `purchase_url`.
 */
export async function fetchPublishedProducts(): Promise<Product[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data ?? []).map((row) =>
    normalizeProductRow({ ...(row as Record<string, unknown>), image_path: null })
  );
}

/**
 * Storefront query: fetches one published product by unique slug.
 */
export async function fetchPublishedProductBySlug(
  slug: string
): Promise<Product | null> {
  const supabase = requireSupabase();
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const { data, error } = await supabase
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('is_published', true)
    .ilike('slug', cleanSlug)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) return null;
  return normalizeProductRow({
    ...(data as Record<string, unknown>),
    image_path: null,
  });
}

/**
 * Admin query: fetches all products (published and hidden).
 * Protected by Supabase RLS (`public.is_admin()`).
 */
export async function fetchAllProductsForAdmin(): Promise<Product[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_PRODUCT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data ?? []).map((row) =>
    normalizeProductRow(row as Record<string, unknown>)
  );
}

export async function fetchProductByIdForAdmin(id: string): Promise<Product | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_PRODUCT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  return data ? normalizeProductRow(data as Record<string, unknown>) : null;
}

function assertValidPurchaseUrlOrNull(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const result = validatePurchaseUrl(url);
  if (!result.valid || !result.normalizedUrl) {
    throw new Error('رابط الشراء غير صالح. يجب أن يكون رابطًا مباشرًا يبدأ بـ https://');
  }
  return result.normalizedUrl;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = requireSupabase();
  const safeUrl = assertValidPurchaseUrlOrNull(input.purchase_url);

  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    short_description: input.short_description.trim(),
    description: input.description.trim(),
    price: input.price,
    currency: (input.currency || 'SAR').trim().toUpperCase(),
    image_url: input.image_url,
    image_path: input.image_path,
    purchase_url: safeUrl,
    is_published: Boolean(input.is_published),
    is_featured: Boolean(input.is_featured),
    sort_order: Number(input.sort_order) || 0,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(ADMIN_PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

/**
 * Updates strictly a single product record identified by `id`.
 * Editing one product's `purchase_url` can never affect any other product record.
 */
export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Product> {
  const supabase = requireSupabase();
  const safeUrl = assertValidPurchaseUrlOrNull(input.purchase_url);

  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    short_description: input.short_description.trim(),
    description: input.description.trim(),
    price: input.price,
    currency: (input.currency || 'SAR').trim().toUpperCase(),
    image_url: input.image_url,
    image_path: input.image_path,
    purchase_url: safeUrl,
    is_published: Boolean(input.is_published),
    is_featured: Boolean(input.is_featured),
    sort_order: Number(input.sort_order) || 0,
  };

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(ADMIN_PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

export async function toggleProductPublished(
  id: string,
  nextPublished: boolean
): Promise<Product> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('products')
    .update({ is_published: nextPublished })
    .eq('id', id)
    .select(ADMIN_PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

export interface DeleteProductResult {
  dbDeleted: boolean;
  imageCleanupWarning: string | null;
}

/**
 * Deletes the product record from PostgreSQL first, then removes ONLY that
 * product's own `image_path` from Supabase Storage.
 * If storage cleanup fails after DB deletion, reports an explicit warning so
 * orphaned files are never hidden from the admin.
 */
export async function deleteProductWithImage(
  product: Product
): Promise<DeleteProductResult> {
  const supabase = requireSupabase();

  const { error: dbError } = await supabase
    .from('products')
    .delete()
    .eq('id', product.id);

  if (dbError) {
    throw mapDatabaseError(dbError);
  }

  if (!product.image_path) {
    return { dbDeleted: true, imageCleanupWarning: null };
  }

  // Ensure no other product shares this exact image_path before deleting from storage
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('image_path', product.image_path);

  if (count && count > 0) {
    return { dbDeleted: true, imageCleanupWarning: null };
  }

  const storageResult = await deleteProductImage(product.image_path);
  if (!storageResult.deleted) {
    return {
      dbDeleted: true,
      imageCleanupWarning:
        'تم حذف سجل المنتج من قاعدة البيانات، لكن تعذر حذف ملف الصورة من التخزين السحابي تلقائيًا.',
    };
  }

  return { dbDeleted: true, imageCleanupWarning: null };
}
