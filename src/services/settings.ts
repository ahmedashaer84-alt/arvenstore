import { requireSupabase } from '../lib/supabase';
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
  type StoreSettingsInput,
} from '../types/database';

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return DEFAULT_STORE_SETTINGS;
  }

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(data as Partial<StoreSettings>),
    id: 1,
  };
}

export async function updateStoreSettings(
  input: StoreSettingsInput
): Promise<StoreSettings> {
  const supabase = requireSupabase();

  const payload = {
    id: 1,
    brand_name: input.brand_name.trim() || 'ARVEN',
    brand_tagline_ar: input.brand_tagline_ar.trim(),
    brand_tagline_en: input.brand_tagline_en.trim(),
    brand_description_ar: input.brand_description_ar.trim(),
    brand_description_en: input.brand_description_en.trim(),
    hero_title_ar: input.hero_title_ar.trim(),
    hero_title_en: input.hero_title_en.trim(),
    hero_subtitle_ar: input.hero_subtitle_ar.trim(),
    hero_subtitle_en: input.hero_subtitle_en.trim(),
    contact_email: input.contact_email.trim(),
    instagram_handle: input.instagram_handle.trim(),
    instagram_url: input.instagram_url.trim(),
    whatsapp_number: input.whatsapp_number?.trim() ? input.whatsapp_number.trim() : null,
    default_currency: (input.default_currency || 'SAR').trim().toUpperCase(),
  };

  const { data, error } = await supabase
    .from('store_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (error.code === '42501' || msg.includes('row-level security')) {
      throw new Error('لا تملك صلاحية تعديل إعدادات المتجر.');
    }
    throw new Error(error.message);
  }

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(data as Partial<StoreSettings>),
    id: 1,
  };
}
