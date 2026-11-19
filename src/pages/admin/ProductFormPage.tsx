import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImagePlus,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import {
  SUPPORTED_CURRENCIES,
  type Product,
} from '../../types/database';
import {
  createProduct,
  fetchProductByIdForAdmin,
  updateProduct,
} from '../../services/products';
import { deleteProductImage, uploadProductImage } from '../../services/storage';
import { normalizeSlug } from '../../utils/slug';
import { validatePurchaseUrl } from '../../utils/url';
import {
  validateImageFile,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from '../../utils/validation';
import { CenteredSpinner } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { locale, t } = useI18n();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  const [values, setValues] = useState<ProductFormValues>({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    currency: settings.default_currency || 'SAR',
    purchase_url: '',
    is_published: false,
    is_featured: false,
    sort_order: '0',
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Load existing product when editing
  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoadingProduct(true);
      setLoadError(null);
      try {
        const product = await fetchProductByIdForAdmin(id);
        if (!active) return;
        if (!product) {
          setLoadError(t('تعذر العثور على هذا المنتج.', 'Product not found.'));
          return;
        }
        setExistingProduct(product);
        setValues({
          name: product.name,
          slug: product.slug,
          short_description: product.short_description,
          description: product.description,
          price: product.price !== null ? String(product.price) : '',
          currency: product.currency || 'SAR',
          purchase_url: product.purchase_url ?? '',
          is_published: product.is_published,
          is_featured: product.is_featured,
          sort_order: String(product.sort_order ?? 0),
        });
        setCurrentImageUrl(product.image_url);
        setCurrentImagePath(product.image_path);
        setSlugTouched(true);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : t('تعذر تحميل بيانات المنتج.', 'Failed to load product.')
        );
      } finally {
        if (active) setLoadingProduct(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id, t]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const updateField = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !isEditing && !slugTouched) {
        const auto = normalizeSlug(String(value));
        if (auto) next.slug = auto;
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileError = validateImageFile(file, locale);
    if (fileError) {
      setErrors((prev) => ({ ...prev, image: fileError }));
      showToast(fileError, 'error');
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localPreview);
    setRemoveExistingImage(false);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });
  };

  const handleClearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validation = validateProductForm(values, locale);
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      showToast(
        t('يرجى مراجعة الحقول المحددة قبل الحفظ.', 'Please review the highlighted fields before saving.'),
        'error'
      );
      return;
    }

    setSubmitting(true);
    let uploadedNewPath: string | null = null;
    const oldImagePathToCleanup =
      isEditing && (selectedFile || removeExistingImage) ? currentImagePath : null;

    try {
      let finalImageUrl = removeExistingImage ? null : currentImageUrl;
      let finalImagePath = removeExistingImage ? null : currentImagePath;

      // 1. Upload new image directly from phone gallery to Supabase Storage first
      if (selectedFile) {
        const uploaded = await uploadProductImage(selectedFile);
        finalImageUrl = uploaded.imageUrl;
        finalImagePath = uploaded.imagePath;
        uploadedNewPath = uploaded.imagePath;
      }

      // 2. Save product record in PostgreSQL
      const payload = {
        name: values.name.trim(),
        slug: validation.normalizedSlug,
        short_description: values.short_description.trim(),
        description: values.description.trim(),
        price: validation.parsedPrice,
        currency: values.currency,
        image_url: finalImageUrl,
        image_path: finalImagePath,
        purchase_url: validation.normalizedPurchaseUrl,
        is_published: values.is_published,
        is_featured: values.is_featured,
        sort_order: validation.parsedSortOrder,
      };

      if (isEditing && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }

      // 3. After DB save succeeds, clean up ONLY the replaced/removed old image
      if (oldImagePathToCleanup && oldImagePathToCleanup !== finalImagePath) {
        const cleanup = await deleteProductImage(oldImagePathToCleanup);
        if (!cleanup.deleted) {
          showToast(
            t(
              'تم حفظ المنتج، لكن تعذر حذف الصورة القديمة من التخزين تلقائيًا.',
              'Product saved, but old storage image could not be removed automatically.'
            ),
            'info'
          );
        }
      }

      showToast(t('تم حفظ المنتج بنجاح.', 'Product saved successfully.'), 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      // Rollback newly uploaded image if DB save failed so we don't leave orphaned files
      if (uploadedNewPath) {
        await deleteProductImage(uploadedNewPath);
      }
      // Note: All form fields in `values` are preserved intentionally!
      const msg =
        err instanceof Error
          ? err.message
          : t('تعذر حفظ المنتج.', 'Failed to save product.');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;
  const activePreview = previewUrl ?? (!removeExistingImage ? currentImageUrl : null);
  const liveUrlCheck = validatePurchaseUrl(values.purchase_url);

  if (loadingProduct) {
    return <CenteredSpinner label={t('جاري تحميل بيانات المنتج...', 'Loading product...')} />;
  }

  if (loadError) {
    return (
      <div className="container-narrow">
        <ErrorState message={loadError} />
        <div style={{ marginTop: 14 }}>
          <Link to="/admin" className="btn btn-glass btn-sm">
            <BackIcon size={16} aria-hidden="true" />
            <span>{t('العودة للوحة الإدارة', 'Back to Admin')}</span>
          </Link>
        </div>
      </div>
    );
  }

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
          <span>{t('العودة إلى المنتجات', 'Back to Products')}</span>
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>
          {isEditing
            ? t(`تعديل: ${existingProduct?.name ?? ''}`, `Edit: ${existingProduct?.name ?? ''}`)
            : t('إضافة منتج جديد', 'Add New Product')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card glass-panel-strong" noValidate>
        {/* Mobile-First Image Uploader */}
        <div className="field-group">
          <label className="field-label">
            <span>{t('صورة المنتج (رفع مباشر من الهاتف)', 'Product Image (Upload from Phone)')}</span>
            <span className="field-hint">JPG / PNG / WebP • Max 5MB</span>
          </label>

          <div className="upload-box">
            {activePreview ? (
              <div className="upload-preview">
                <img src={activePreview} alt={values.name || 'Preview'} />
              </div>
            ) : (
              <div style={{ color: 'var(--color-warm-gray)', fontSize: '0.9rem' }}>
                {t(
                  'اختر صورة واضحة للمنتج من معرض الهاتف لمعاينتها قبل الحفظ.',
                  'Choose a clear product photo from your phone gallery to preview before saving.'
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="product-image-input"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} aria-hidden="true" />
                <span>
                  {activePreview
                    ? t('استبدال الصورة', 'Replace Image')
                    : t('اختيار صورة من الهاتف', 'Choose Photo from Gallery')}
                </span>
              </button>

              {activePreview && (
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  onClick={handleClearImage}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span>{t('إزالة الصورة', 'Remove')}</span>
                </button>
              )}
            </div>
          </div>
          {errors.image && <p className="field-error">{errors.image}</p>}
        </div>

        {/* Name & Slug */}
        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="prod-name" className="field-label">
              {t('اسم المنتج *', 'Product Name *')}
            </label>
            <input
              id="prod-name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              value={values.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={t('مثال: سيروم أورو للعناية', 'e.g. Oro Stem Serum Kit')}
              required
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="prod-slug" className="field-label">
              <span>{t('المسار الفريد (Slug) *', 'Unique Slug *')}</span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 28, padding: '2px 8px', fontSize: '0.76rem' }}
                onClick={() => {
                  const generated = normalizeSlug(values.name);
                  if (generated) {
                    setSlugTouched(true);
                    updateField('slug', generated);
                  }
                }}
              >
                <Wand2 size={13} aria-hidden="true" />
                <span>{t('توليد', 'Generate')}</span>
              </button>
            </label>
            <input
              id="prod-slug"
              type="text"
              dir="ltr"
              className={`input ${errors.slug ? 'input-error' : ''}`}
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField('slug', e.target.value);
              }}
              placeholder="oro-stem-serum-kit"
              required
            />
            <p className="field-hint">
              {t('أحرف إنجليزية صغيرة وأرقام وشرطات فقط (لا يتكرر بين المنتجات).', 'Lowercase English letters, numbers, and hyphens only.')}
            </p>
            {errors.slug && <p className="field-error">{errors.slug}</p>}
          </div>
        </div>

        {/* Independent Purchase Referral URL */}
        <div className="field-group">
          <label htmlFor="prod-purchase-url" className="field-label">
            <span>{t('رابط الشراء / الإحالة المستقل لهذا المنتج', 'Dedicated Product Purchase / Referral URL')}</span>
            {liveUrlCheck.valid && liveUrlCheck.normalizedUrl && (
              <a
                href={liveUrlCheck.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-success"
              >
                <span>{t('اختبار الرابط', 'Test Link')}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </label>
          <input
            id="prod-purchase-url"
            type="url"
            dir="ltr"
            className={`input ${errors.purchase_url ? 'input-error' : ''}`}
            value={values.purchase_url}
            onChange={(e) => updateField('purchase_url', e.target.value)}
            placeholder="https://official-merchant.example/your-product-referral-link"
          />
          <p className="field-hint">
            {t(
              'يُحفظ هذا الرابط بشكل مستقل لهذا المنتج فقط، ولا يؤثر تعديله على أي منتج آخر.',
              'Saved independently for this product only. Updating it never affects any other product.'
            )}
          </p>
          {errors.purchase_url && <p className="field-error">{errors.purchase_url}</p>}
        </div>

        {/* Short & Full Description */}
        <div className="field-group">
          <label htmlFor="prod-short-desc" className="field-label">
            {t('وصف مختصر (يظهر في بطاقة المتجر)', 'Short Description (Storefront Card)')}
          </label>
          <input
            id="prod-short-desc"
            type="text"
            className="input"
            value={values.short_description}
            onChange={(e) => updateField('short_description', e.target.value)}
            placeholder={t('جملة موجزة وواضحة تصف المنتج.', 'A concise, clear summary of the product.')}
            maxLength={220}
          />
        </div>

        <div className="field-group">
          <label htmlFor="prod-desc" className="field-label">
            {t('الوصف الكامل (يظهر في صفحة تفاصيل المنتج)', 'Full Description (Product Detail Page)')}
          </label>
          <textarea
            id="prod-desc"
            className="textarea"
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder={t('اكتب تفاصيل المنتج ومكوناته أو طريقة استخدامه بوضوح...', 'Write clear details about the product...')}
          />
        </div>

        {/* Price, Currency, Sort Order */}
        <div className="form-grid-2">
          <div className="field-group">
            <label htmlFor="prod-price" className="field-label">
              {t('السعر (اختياري)', 'Price (Optional)')}
            </label>
            <input
              id="prod-price"
              type="number"
              dir="ltr"
              step="0.01"
              min="0"
              className={`input ${errors.price ? 'input-error' : ''}`}
              value={values.price}
              onChange={(e) => updateField('price', e.target.value)}
              placeholder={t('اتركه فارغًا إذا لم ترغب بعرض سعر', 'Leave empty to hide price')}
            />
            {errors.price && <p className="field-error">{errors.price}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="prod-currency" className="field-label">
              {t('العملة', 'Currency')}
            </label>
            <select
              id="prod-currency"
              className="select"
              value={values.currency}
              onChange={(e) => updateField('currency', e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="prod-sort" className="field-label">
            {t('ترتيب العرض (الأصغر يظهر أولًا)', 'Display Sort Order (Lower appears first)')}
          </label>
          <input
            id="prod-sort"
            type="number"
            dir="ltr"
            step="1"
            className={`input ${errors.sort_order ? 'input-error' : ''}`}
            value={values.sort_order}
            onChange={(e) => updateField('sort_order', e.target.value)}
          />
          {errors.sort_order && <p className="field-error">{errors.sort_order}</p>}
        </div>

        {/* Visibility Toggles */}
        <div className="form-grid-2">
          <label className="toggle-row" htmlFor="prod-published">
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>
                {t('نشر المنتج في المتجر العام', 'Publish to Public Storefront')}
              </div>
              <div className="field-hint">
                {t('المنتجات المخفية لا تظهر للزوار.', 'Hidden products are invisible to visitors.')}
              </div>
            </div>
            <input
              id="prod-published"
              type="checkbox"
              className="switch-input"
              checked={values.is_published}
              onChange={(e) => updateField('is_published', e.target.checked)}
            />
          </label>

          <label className="toggle-row" htmlFor="prod-featured">
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>
                {t('تمييز المنتج بشارة "مختار بعناية"', 'Mark as Featured')}
              </div>
              <div className="field-hint">
                {t('يضيف شارة هادئة على بطاقة المنتج.', 'Displays a subtle curated badge on the card.')}
              </div>
            </div>
            <input
              id="prod-featured"
              type="checkbox"
              className="switch-input"
              checked={values.is_featured}
              onChange={(e) => updateField('is_featured', e.target.checked)}
            />
          </label>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Link to="/admin" className="btn btn-glass">
            {t('إلغاء', 'Cancel')}
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <Save size={16} aria-hidden="true" />}
            <span>
              {submitting
                ? t('جاري الحفظ...', 'Saving...')
                : isEditing
                ? t('حفظ التعديلات', 'Save Changes')
                : t('إضافة المنتج', 'Create Product')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
