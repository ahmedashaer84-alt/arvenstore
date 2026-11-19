import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchPublishedProducts } from '../services/products';
import type { Product } from '../types/database';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

type SortMode = 'curated' | 'newest' | 'price_asc' | 'price_desc';

export function ShopPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [sortBy, setSortBy] = useState<SortMode>('curated');

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        t(
          'لم يتم ضبط اتصال Supabase بعد.',
          'Supabase connection is not configured yet.'
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
          : t('تعذر تحميل المنتجات.', 'Failed to load products.')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const displayedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.short_description.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        )
      : [...products];

    if (sortBy === 'newest') {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    }
    return list;
  }, [products, query, sortBy]);

  return (
    <section className="section-block">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">{t('المتجر', 'Shop ARVEN')}</h1>
            <p className="section-subtitle">
              {t(
                'جميع المنتجات المنشورة والمتاحة عبر روابط الشراء الرسمية.',
                'All published products with direct official purchase links.'
              )}
            </p>
          </div>
          {!loading && !error && (
            <span className="badge badge-neutral">
              {displayedProducts.length} {t('منتج', 'items')}
            </span>
          )}
        </div>

        {!loading && !error && products.length > 0 && (
          <div className="toolbar-glass glass-panel">
            <div className="search-input-wrap">
              <Search size={18} className="search-input-icon" aria-hidden="true" />
              <input
                type="search"
                className="input search-input"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={t('ابحث في المنتجات...', 'Search products...')}
                aria-label={t('ابحث في المنتجات', 'Search products')}
              />
            </div>

            <select
              className="select"
              style={{ width: 'auto', minWidth: 170 }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label={t('ترتيب المنتجات', 'Sort products')}
            >
              <option value="curated">{t('الترتيب المختار', 'Curated Order')}</option>
              <option value="newest">{t('الأحدث أولًا', 'Newest First')}</option>
              <option value="price_asc">{t('السعر: الأقل إلى الأعلى', 'Price: Low to High')}</option>
              <option value="price_desc">{t('السعر: الأعلى إلى الأقل', 'Price: High to Low')}</option>
            </select>
          </div>
        )}

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadProducts()} />
        ) : displayedProducts.length === 0 ? (
          <div className="state-card glass-panel">
            <Sparkles size={28} strokeWidth={1.5} color="var(--color-champagne)" aria-hidden="true" />
            <h2>
              {products.length === 0
                ? t('لا توجد منتجات منشورة بعد', 'No published products yet')
                : t('لم يتم العثور على منتجات مطابقة', 'No matching products found')}
            </h2>
            <p>
              {products.length === 0
                ? t(
                    'عند إضافة المنتجات ونشرها من لوحة الإدارة ستظهر هنا مباشرة.',
                    'Once products are added and published from the Admin Dashboard, they will appear here.'
                  )
                : t(
                    'جرّب كلمة بحث مختلفة أو أعد ضبط البحث.',
                    'Try another search term or reset your search.'
                  )}
            </p>
            {query && (
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => handleQueryChange('')}
              >
                {t('مسح البحث', 'Clear Search')}
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
