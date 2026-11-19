import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Info } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchPublishedProductBySlug } from '../services/products';
import type { Product } from '../types/database';
import { formatPrice } from '../utils/format';
import { ProductImage } from '../components/ProductImage';
import { PurchaseButton } from '../components/PurchaseButton';
import { CenteredSpinner } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t } = useI18n();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        t('لم يتم ضبط اتصال Supabase بعد.', 'Supabase connection is not configured.')
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublishedProductBySlug(slug);
      setProduct(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('تعذر تحميل بيانات المنتج.', 'Failed to load product details.')
      );
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  if (loading) {
    return <CenteredSpinner label={t('جاري تحميل تفاصيل المنتج...', 'Loading product...')} />;
  }

  if (error) {
    return (
      <section className="section-block">
        <div className="container-narrow">
          <ErrorState message={error} onRetry={() => void loadProduct()} />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section-block">
        <div className="container-narrow">
          <div className="state-card glass-panel">
            <h1>{t('المنتج غير متوفر', 'Product Not Found')}</h1>
            <p>
              {t(
                'قد يكون هذا المنتج مخفيًا أو لم يعد متاحًا في المتجر العام.',
                'This product may be unpublished or no longer available.'
              )}
            </p>
            <Link to="/shop" className="btn btn-primary btn-sm">
              <BackIcon size={16} aria-hidden="true" />
              <span>{t('العودة إلى المتجر', 'Back to Shop')}</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const priceDisplay = formatPrice(product.price, product.currency, locale);

  return (
    <section className="section-block">
      <div className="container">
        <div style={{ marginBottom: 18 }}>
          <Link to="/shop" className="btn btn-ghost btn-sm">
            <BackIcon size={16} aria-hidden="true" />
            <span>{t('العودة إلى المتجر', 'Back to Shop')}</span>
          </Link>
        </div>

        <div className="detail-grid">
          <div className="detail-media-box glass-panel">
            <ProductImage src={product.image_url} alt={product.name} eager />
          </div>

          <div className="detail-info-card glass-panel-strong">
            {product.is_featured && (
              <div>
                <span className="badge badge-champagne">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>{t('اختيار مميز من ARVEN', 'ARVEN Curated Pick')}</span>
                </span>
              </div>
            )}

            <h1 className="detail-title">{product.name}</h1>

            {priceDisplay && (
              <div style={{ fontSize: '1.35rem', fontWeight: 600 }}>
                <span className="ltr-isolate">{priceDisplay}</span>
              </div>
            )}

            {product.short_description.trim() && (
              <p style={{ margin: 0, color: 'var(--color-warm-gray)', fontSize: '1rem' }}>
                {product.short_description}
              </p>
            )}

            <div style={{ paddingTop: 6 }}>
              <PurchaseButton
                productName={product.name}
                purchaseUrl={product.purchase_url}
                fullWidth
              />
            </div>

            <div className="disclosure-note">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span>
                  {t(
                    'عند الضغط على زر الشراء سيتم توجيهك إلى صفحة الشراء الرسمية عبر رابط الإحالة الخاص بهذا المنتج. لا تتم معالجة الدفع أو الشحن داخل موقع ARVEN.',
                    'Clicking the purchase button redirects you to the official merchant checkout via this product’s dedicated referral link. ARVEN does not process payments directly.'
                  )}{' '}
                  <Link
                    to="/affiliate-disclosure"
                    style={{ textDecoration: 'underline', color: 'var(--color-obsidian)' }}
                  >
                    {t('اقرأ توضيح الإحالة', 'Read Disclosure')}
                  </Link>
                </span>
              </div>
            </div>

            {product.description.trim() && (
              <div
                style={{
                  borderTop: '1px solid var(--glass-border-subtle)',
                  paddingTop: 16,
                }}
              >
                <h2 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 600 }}>
                  {t('تفاصيل المنتج', 'Product Details')}
                </h2>
                <p className="detail-description">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
