import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import {
  SUPPORTED_CURRENCIES,
  type StoreSettingsInput,
} from '../../types/database';
import { updateStoreSettings } from '../../services/settings';
import { buildWhatsAppUrl, validateExternalUrl } from '../../utils/url';

export function AdminSettingsPage() {
  const { locale, t } = useI18n();
  const { settings, setSettingsLocal } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreSettingsInput>({
    brand_name: settings.brand_name,
    brand_tagline_ar: settings.brand_tagline_ar,
    brand_tagline_en: settings.brand_tagline_en,
    brand_description_ar: settings.brand_description_ar,
    brand_description_en: settings.brand_description_en,
    hero_title_ar: settings.hero_title_ar,
    hero_title_en: settings.hero_title_en,
    hero_subtitle_ar: settings.hero_subtitle_ar,
    hero_subtitle_en: settings.hero_subtitle_en,
    contact_email: settings.contact_email,
    instagram_handle: settings.instagram_handle,
    instagram_url: settings.instagram_url,
    whatsapp_number: settings.whatsapp_number ?? '',
    default_currency: settings.default_currency,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      brand_name: settings.brand_name,
      brand_tagline_ar: settings.brand_tagline_ar,
      brand_tagline_en: settings.brand_tagline_en,
      brand_description_ar: settings.brand_description_ar,
      brand_description_en: settings.brand_description_en,
      hero_title_ar: settings.hero_title_ar,
      hero_title_en: settings.hero_title_en,
      hero_subtitle_ar: settings.hero_subtitle_ar,
      hero_subtitle_en: settings.hero_subtitle_en,
      contact_email: settings.contact_email,
      instagram_handle: settings.instagram_handle,
      instagram_url: settings.instagram_url,
      whatsapp_number: settings.whatsapp_number ?? '',
      default_currency: settings.default_currency,
    });
  }, [settings]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (form.instagram_url.trim() && !validateExternalUrl(form.instagram_url)) {
      showToast(
        t('رابط إنستغرام غير صالح. يجب أن يبدأ بـ https://', 'Invalid Instagram URL.'),
        'error'
      );
      return;
    }

    if (form.whatsapp_number?.trim() && !buildWhatsAppUrl(form.whatsapp_number)) {
      showToast(
        t(
          'رقم واتساب غير صالح. أدخل الرقم بالصيغة الدولية بالأرقام فقط مثل 9665XXXXXXXX أو اتركه فارغًا.',
          'Invalid WhatsApp number. Enter international digits only (e.g. 9665XXXXXXXX) or leave blank.'
        ),
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStoreSettings(form);
      setSettingsLocal(updated);
      showToast(t('تم حفظ إعدادات العلامة بنجاح.', 'Brand settings saved.'), 'success');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : t('تعذر حفظ الإعدادات.', 'Failed to save settings.'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="container-narrow" style={{ paddingInline: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link to="/admin" className="btn btn-ghost btn-sm">
          <BackIcon size={16} aria-hidden="true" />
          <span>{t('العودة للوحة الإدارة', 'Back to Admin')}</span>
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>
          {t('إعدادات العلامة والمتجر', 'Brand & Store Settings')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card glass-panel-strong">
        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-brand" className="field-label">
              {t('اسم العلامة', 'Brand Name')}
            </label>
            <input
              id="set-brand"
              className="input"
              dir="ltr"
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-currency" className="field-label">
              {t('العملة الافتراضية', 'Default Currency')}
            </label>
            <select
              id="set-currency"
              className="select"
              value={form.default_currency}
              onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-email" className="field-label">
              {t('البريد التجاري', 'Business Email')}
            </label>
            <input
              id="set-email"
              type="email"
              dir="ltr"
              className="input"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-whatsapp" className="field-label">
              {t('رقم واتساب (اختياري — بالصيغة الدولية)', 'WhatsApp Number (Optional, International)')}
            </label>
            <input
              id="set-whatsapp"
              type="tel"
              dir="ltr"
              className="input"
              value={form.whatsapp_number ?? ''}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="9665XXXXXXXX"
            />
            <p className="field-hint">
              {t('اتركه فارغًا لإخفاء زر واتساب حتى يصبح الرقم جاهزًا.', 'Leave empty to hide WhatsApp buttons until ready.')}
            </p>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-ig-handle" className="field-label">
              {t('حساب إنستغرام', 'Instagram Handle')}
            </label>
            <input
              id="set-ig-handle"
              dir="ltr"
              className="input"
              value={form.instagram_handle}
              onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-ig-url" className="field-label">
              {t('رابط إنستغرام', 'Instagram URL')}
            </label>
            <input
              id="set-ig-url"
              type="url"
              dir="ltr"
              className="input"
              value={form.instagram_url}
              onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-hero-ar" className="field-label">
              {t('عنوان الواجهة الرئيسي (عربي)', 'Hero Title (Arabic)')}
            </label>
            <input
              id="set-hero-ar"
              className="input"
              value={form.hero_title_ar}
              onChange={(e) => setForm({ ...form, hero_title_ar: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-hero-en" className="field-label">
              {t('عنوان الواجهة الرئيسي (إنجليزي)', 'Hero Title (English)')}
            </label>
            <input
              id="set-hero-en"
              dir="ltr"
              className="input"
              value={form.hero_title_en}
              onChange={(e) => setForm({ ...form, hero_title_en: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-sub-ar" className="field-label">
              {t('النص التعريفي للواجهة (عربي)', 'Hero Subtitle (Arabic)')}
            </label>
            <textarea
              id="set-sub-ar"
              className="textarea"
              value={form.hero_subtitle_ar}
              onChange={(e) => setForm({ ...form, hero_subtitle_ar: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-sub-en" className="field-label">
              {t('النص التعريفي للواجهة (إنجليزي)', 'Hero Subtitle (English)')}
            </label>
            <textarea
              id="set-sub-en"
              dir="ltr"
              className="textarea"
              value={form.hero_subtitle_en}
              onChange={(e) => setForm({ ...form, hero_subtitle_en: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="set-desc-ar" className="field-label">
              {t('وصف العلامة في التذييل (عربي)', 'Footer Brand Description (Arabic)')}
            </label>
            <textarea
              id="set-desc-ar"
              className="textarea"
              value={form.brand_description_ar}
              onChange={(e) => setForm({ ...form, brand_description_ar: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="set-desc-en" className="field-label">
              {t('وصف العلامة في التذييل (إنجليزي)', 'Footer Brand Description (English)')}
            </label>
            <textarea
              id="set-desc-en"
              dir="ltr"
              className="textarea"
              value={form.brand_description_en}
              onChange={(e) => setForm({ ...form, brand_description_en: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <Save size={16} aria-hidden="true" />}
            <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ الإعدادات', 'Save Settings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
