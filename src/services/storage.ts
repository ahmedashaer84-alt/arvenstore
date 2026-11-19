import { requireSupabase } from '../lib/supabase';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '../utils/validation';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface UploadedImageResult {
  imageUrl: string;
  imagePath: string;
}

/**
 * Uploads a product image directly from mobile/desktop gallery to Supabase Storage.
 * Protected at storage layer by RLS (`public.is_admin()`).
 */
export async function uploadProductImage(file: File): Promise<UploadedImageResult> {
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    throw new Error('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو AVIF.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('حجم الصورة يتجاوز الحد المسموح (5 ميجابايت).');
  }

  const supabase = requireSupabase();
  const ext = MIME_TO_EXT[file.type] ?? 'jpg';
  const filePath = `products/${generateUniqueId()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    if (
      uploadError.message.toLowerCase().includes('row-level security') ||
      uploadError.message.toLowerCase().includes('permission') ||
      uploadError.message.toLowerCase().includes('unauthorized')
    ) {
      throw new Error('لا تملك صلاحية رفع الصور. تحقق من إعداد صلاحيات المدير في Supabase.');
    }
    throw new Error(`تعذر رفع الصورة: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('تم رفع الملف لكن تعذر الحصول على رابط الصورة العام.');
  }

  return {
    imageUrl: data.publicUrl,
    imagePath: filePath,
  };
}

/**
 * Deletes a single specific image path belonging to one product.
 * Never deletes bucket root or other products' files.
 */
export async function deleteProductImage(
  imagePath: string | null | undefined
): Promise<{ deleted: boolean; error: string | null }> {
  if (!imagePath || !imagePath.trim()) {
    return { deleted: true, error: null };
  }

  const cleanPath = imagePath.trim();
  // Guard against accidental empty/root deletion
  if (!cleanPath.includes('/') || cleanPath.startsWith('/')) {
    return { deleted: false, error: 'مسار الصورة غير صالح للحذف التلقائي.' };
  }

  const supabase = requireSupabase();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([cleanPath]);

  if (error) {
    return { deleted: false, error: error.message };
  }

  return { deleted: true, error: null };
}
