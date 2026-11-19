export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  image_path: string | null;
  purchase_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  image_path: string | null;
  purchase_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface StoreSettings {
  id: number;
  brand_name: string;
  brand_tagline_ar: string;
  brand_tagline_en: string;
  brand_description_ar: string;
  brand_description_en: string;
  hero_title_ar: string;
  hero_title_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  contact_email: string;
  instagram_handle: string;
  instagram_url: string;
  whatsapp_number: string | null;
  default_currency: string;
  updated_at: string;
}

export type StoreSettingsInput = Omit<StoreSettings, 'id' | 'updated_at'>;

export interface AdminUserRecord {
  user_id: string;
  email: string;
  role: 'admin';
  created_at: string;
}

export const SUPPORTED_CURRENCIES = [
  'SAR',
  'AED',
  'USD',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'EUR',
] as const;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  brand_name: 'ARVEN',
  brand_tagline_ar: 'اختيارات راقية بعناية لأسلوب حياة متوازن',
  brand_tagline_en: 'Curated essentials for an intentional lifestyle',
  brand_description_ar:
    'علامة مختصة بانتقاء منتجات العناية ونمط الحياة وعرضها بتجربة واضحة وموثوقة، مع توجيه مباشر إلى صفحات الشراء الرسمية.',
  brand_description_en:
    'An independent curation house showcasing selected lifestyle and care products with direct access to official purchase pages.',
  hero_title_ar: 'فخامة هادئة في كل تفصيل',
  hero_title_en: 'Quiet Luxury, Curated with Purpose',
  hero_subtitle_ar:
    'تشكيلة مختارة بعناية تجمع بين الجودة والأناقة اليومية، مع رابط شراء رسمي مستقل لكل منتج.',
  hero_subtitle_en:
    'Thoughtfully selected products presented with clarity, transparency, and an independent official purchase link for every item.',
  contact_email: 'arven.business17@gmail.com',
  instagram_handle: '@arven.lifestyle',
  instagram_url: 'https://instagram.com/arven.lifestyle',
  whatsapp_number: null,
  default_currency: 'SAR',
  updated_at: '',
};
