import type { Product } from '../types/database';
import { isValidSlug, normalizeSlug } from './slug';
import { validatePurchaseUrl } from './url';

export interface ProductFormValues {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  currency: string;
  purchase_url: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | 'image', string>>;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export function validateImageFile(
  file: File,
  locale: 'ar' | 'en'
): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return locale === 'ar'
      ? 'صيغة الصورة غير مدعومة. الصيغ المسموحة: JPG، PNG، WebP، AVIF.'
      : 'Unsupported image format. Allowed: JPG, PNG, WebP, AVIF.';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return locale === 'ar'
      ? 'حجم الصورة يتجاوز الحد المسموح (5 ميجابايت).'
      : 'Image size exceeds the 5 MB limit.';
  }
  return null;
}

export function validateProductForm(
  values: ProductFormValues,
  locale: 'ar' | 'en'
): { errors: ProductFormErrors; normalizedSlug: string; parsedPrice: number | null; parsedSortOrder: number; normalizedPurchaseUrl: string | null } {
  const errors: ProductFormErrors = {};

  if (!values.name.trim()) {
    errors.name = locale === 'ar' ? 'اسم المنتج مطلوب.' : 'Product name is required.';
  }

  const normalizedSlug = normalizeSlug(values.slug);
  if (!normalizedSlug) {
    errors.slug =
      locale === 'ar'
        ? 'المسار الفريد (slug) مطلوب بأحرف إنجليزية وأرقام فقط.'
        : 'A unique slug using lowercase letters, numbers, and hyphens is required.';
  } else if (!isValidSlug(normalizedSlug)) {
    errors.slug =
      locale === 'ar'
        ? 'صيغة slug غير صالحة. استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات مثل: oro-serum-kit'
        : 'Invalid slug format. Use lowercase letters, numbers, and hyphens.';
  }

  let parsedPrice: number | null = null;
  if (values.price.trim() !== '') {
    const num = Number(values.price);
    if (Number.isNaN(num) || num < 0) {
      errors.price =
        locale === 'ar'
          ? 'يرجى إدخال سعر رقمي صحيح أو ترك الحقل فارغًا.'
          : 'Enter a valid non-negative price or leave blank.';
    } else {
      parsedPrice = Math.round(num * 100) / 100;
    }
  }

  const sortNum = values.sort_order.trim() === '' ? 0 : Number(values.sort_order);
  let parsedSortOrder = 0;
  if (Number.isNaN(sortNum) || !Number.isInteger(sortNum)) {
    errors.sort_order =
      locale === 'ar'
        ? 'ترتيب العرض يجب أن يكون رقمًا صحيحًا.'
        : 'Sort order must be a whole number.';
  } else {
    parsedSortOrder = sortNum;
  }

  let normalizedPurchaseUrl: string | null = null;
  if (values.purchase_url.trim() !== '') {
    const check = validatePurchaseUrl(values.purchase_url);
    if (!check.valid) {
      if (check.errorCode === 'LEGACY_BUY_FUNCTION') {
        errors.purchase_url =
          locale === 'ar'
            ? 'لا يُسمح باستخدام رابط وظيفة buy القديمة. أدخل رابط الإحالة الرسمي المباشر للمنتج.'
            : 'Legacy /functions/v1/buy URLs are not allowed. Enter the direct official referral URL.';
      } else if (check.errorCode === 'UNSAFE_PROTOCOL') {
        errors.purchase_url =
          locale === 'ar'
            ? 'رابط الشراء غير آمن. يجب أن يبدأ بـ https:// أو http:// فقط.'
            : 'Unsafe protocol. Purchase URL must start with https:// or http://.';
      } else {
        errors.purchase_url =
          locale === 'ar'
            ? 'رابط الشراء غير صالح. تأكد من إدخال رابط كامل يبدأ بـ https://'
            : 'Invalid purchase URL. Enter a full link starting with https://';
      }
    } else {
      normalizedPurchaseUrl = check.normalizedUrl;
    }
  } else if (values.is_published) {
    // Allow saving unpublished draft without URL, but warn strongly if trying to publish without a valid link
    errors.purchase_url =
      locale === 'ar'
        ? 'يرجى إضافة رابط شراء صالح قبل نشر المنتج، أو احفظه كمسودة (مخفي) أولًا.'
        : 'Please add a valid purchase URL before publishing, or save as hidden draft first.';
  }

  return {
    errors,
    normalizedSlug,
    parsedPrice,
    parsedSortOrder,
    normalizedPurchaseUrl,
  };
}

/**
 * Checks whether a product needs attention (missing image, purchase link, or short description).
 */
export function isProductIncomplete(product: Product): boolean {
  const urlCheck = validatePurchaseUrl(product.purchase_url);
  return (
    !product.image_url ||
    !urlCheck.valid ||
    !product.short_description.trim()
  );
}
