import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchPublishedProducts } from '../services/products';
import type { Product } from '../types/database';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export function HomePage() {
  const { locale, t } = useI18n();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        t(
          'لم يتم ربط المتجر بقاعدة بيانات Supabase بعد. يرجى ضبط متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.',
          'Storefront is not yet connected to Supabase. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        )
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublishedProducts();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('تعذر تحميل المنتجات في الوقت الحالي.', 'Unable to load products right now.')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.short_description.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* Quiet Luxury Editorial Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-card glass-panel-strong">
            <svg
              className="hero-ambient-svg"
              viewBox="0 0 900 420"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <circle cx="760" cy="80" r="210" fill="rgba(176,149,103,0.13)" />
              <circle cx="760" cy="80" r="140" stroke="rgba(176,149,103,0.28)" strokeWidth="1" />
              <circle cx="760" cy="80" r="76" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
              <line x1="0" y1="350" x2="900" y2="350" stroke="rgba(21,20,18,0.05)" strokeWidth="1" />
            </svg>

            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-line" aria-hidden="true" />
                <span className="arven-wordmark" style={{ fontSize: '0.82rem' }}>
                  {settings.brand_name || 'ARVEN'}
                </span>
                <span>•</span>
                <span>
                  {locale === 'ar'
                    ? settings.brand_tagline_ar
                    : settings.brand_tagline_en}
                </span>
              </div>

              <h1 className="hero-title">
                {locale === 'ar' ? settings.hero_title_ar : settings.hero_title_en}
              </h1>

              <p className="hero-subtitle">
                {locale === 'ar'
                  ? settings.hero_subtitle_ar
                  : settings.hero_subtitle_en}
              </p>

              <div className="hero-cta-row">
                <a href="#products-showcase" className="btn btn-primary">
                  <span>{t('استكشف المنتجات', 'Explore Products')}</span>
                  <ArrowDown size={16} aria-hidden="true" />
                </a>
                <Link to="/shop" className="btn btn-glass">
                  <span>{t('عرض الكتالوج الكامل', 'View Full Catalog')}</span>
                  <ArrowIcon size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Published Products Showcase */}
      <section id="products-showcase" className="section-block">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {t('المنتجات المختارة', 'Curated Collection')}
              </h2>
              <p className="section-subtitle">
                {t(
                  'كل منتج يرتبط برابط شراء رسمي مستقل ومحدّث مباشرة من المتجر.',
                  'Each product connects to its own independent, directly maintained official purchase link.'
                )}
              </p>
            </div>
            {products.length > 0 && (
              <Link to="/shop" className="btn btn-glass btn-sm">
                <span>{t('تصفح الكل', 'View All')}</span>
                <ArrowIcon size={15} aria-hidden="true" />
              </Link>
            )}
          </div>

          {!loading && !error && products.length >= 2 && (
            <div className="toolbar-glass glass-panel">
              <div className="search-input-wrap">
                <Search size={18} className="search-input-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="input search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('ابحث عن منتج بالاسم...', 'Search products by name...')}
                  aria-label={t('ابحث عن منتج', 'Search products')}
                />
              </div>
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void loadProducts()} />
          ) : products.length === 0 ? (
            <div className="state-card glass-panel">
              <Sparkles size={28} strokeWidth={1.5} color="var(--color-champagne)" aria-hidden="true" />
              <h3>{t('التشكيلة قيد الإعداد', 'Collection Coming Soon')}</h3>
              <p>
                {t(
                  'لا توجد منتجات منشورة حاليًا. ستظهر المنتجات هنا تلقائيًا فور نشرها من لوحة إدارة ARVEN.',
                  'There are no published products yet. Products will appear here automatically once published from the ARVEN Admin Dashboard.'
                )}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="state-card glass-panel">
              <h3>{t('لا توجد نتائج مطابقة', 'No matching products')}</h3>
              <p>
                {t(
                  'جرّب البحث بكلمة أخرى أو امسح مربع البحث لعرض جميع المنتجات.',
                  'Try another search term or clear the search input to see all products.'
                )}
              </p>
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => setSearchQuery('')}
              >
                {t('عرض جميع المنتجات', 'Show All Products')}
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Ethos & Transparency */}
      <section className="section-block" style={{ paddingTop: 8 }}>
        <div className="container">
          <div className="ethos-grid">
            <div className="ethos-card glass-panel">
              <Compass size={22} color="var(--color-champagne)" strokeWidth={1.6} aria-hidden="true" />
              <h3>{t('انتقاء مدروس بعناية', 'Intentional Curation')}</h3>
              <p>
                {t(
                  'نركز على عرض منتجات مختارة بوضوح وتفاصيل دقيقة بعيدًا عن المبالغة أو الوعود غير المثبتة.',
                  'We showcase thoughtfully chosen essentials with clear details and without exaggerated claims.'
                )}
              </p>
            </div>

            <div className="ethos-card glass-panel">
              <ExternalLink size={22} color="var(--color-champagne)" strokeWidth={1.6} aria-hidden="true" />
              <h3>{t('شراء مباشر من المصدر الرسمي', 'Direct Official Purchase')}</h3>
              <p>
                {t(
                  'ينقلك زر الشراء الخاص بكل منتج مباشرة إلى صفحة الشراء الرسمية المعتمدة لإتمام الطلب بأمان.',
                  'Every product button takes you directly to its dedicated official checkout page.'
                )}
              </p>
            </div>

            <div className="ethos-card glass-panel">
              <ShieldCheck size={22} color="var(--color-champagne)" strokeWidth={1.6} aria-hidden="true" />
              <h3>{t('شفافية كاملة في الإحالة', 'Full Referral Transparency')}</h3>
              <p>
                {t(
                  'تعمل ARVEN كواجهة تسويق بالعمولة مستقلة لمنتجات My Life Style وتوضح ذلك بصراحة في كل خطوة.',
                  'ARVEN operates transparently as an independent referral showcase for selected My Life Style products.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
