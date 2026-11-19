import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Database,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  AlertTriangle,
  Link2,
  Link2Off,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../contexts/ToastContext';
import {
  deleteProductWithImage,
  fetchAllProductsForAdmin,
  toggleProductPublished,
} from '../../services/products';
import type { Product } from '../../types/database';
import { formatDate, formatPrice } from '../../utils/format';
import { validatePurchaseUrl } from '../../utils/url';
import { isProductIncomplete } from '../../utils/validation';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ErrorState } from '../../components/ErrorState';
import { CenteredSpinner } from '../../components/LoadingState';

type FilterStatus = 'all' | 'published' | 'hidden' | 'incomplete';

export function AdminDashboardPage() {
  const { locale, t } = useI18n();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProductsForAdmin();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('تعذر الاتصال بقاعدة البيانات.', 'Unable to connect to database.')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const total = products.length;
    const published = products.filter((p) => p.is_published).length;
    const hidden = total - published;
    const incomplete = products.filter((p) => isProductIncomplete(p)).length;
    return { total, published, hidden, incomplete };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === 'published' && !product.is_published) return false;
      if (filter === 'hidden' && product.is_published) return false;
      if (filter === 'incomplete' && !isProductIncomplete(product)) return false;

      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q)
      );
    });
  }, [products, search, filter]);

  const handleTogglePublish = async (product: Product) => {
    if (togglingId) return;

    const nextState = !product.is_published;
    if (nextState) {
      const urlCheck = validatePurchaseUrl(product.purchase_url);
      if (!urlCheck.valid) {
        showToast(
          t(
            'أضف رابط شراء صالحًا أولًا قبل نشر هذا المنتج.',
            'Add a valid purchase URL first before publishing this product.'
          ),
          'error'
        );
        return;
      }
    }

    setTogglingId(product.id);
    try {
      const updated = await toggleProductPublished(product.id, nextState);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast(
        nextState
          ? t('تم نشر المنتج في المتجر العام.', 'Product published to storefront.')
          : t('تم إخفاء المنتج من المتجر العام.', 'Product hidden from storefront.'),
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : t('تعذر تحديث حالة النشر.', 'Failed to update publish status.'),
        'error'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteProductWithImage(productToDelete);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      if (result.imageCleanupWarning) {
        showToast(result.imageCleanupWarning, 'info');
      } else {
        showToast(t('تم حذف المنتج بنجاح.', 'Product deleted successfully.'), 'success');
      }
      setProductToDelete(null);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : t('تعذر حذف المنتج.', 'Failed to delete product.'),
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Real DB Connection Status Bar */}
      <div className="connection-bar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} color={error ? 'var(--color-danger)' : 'var(--color-success)'} aria-hidden="true" />
          <span>
            {loading
              ? t('جاري فحص الاتصال بقاعدة البيانات...', 'Checking database connection...')
              : error
              ? t('توجد مشكلة في الاتصال بقاعدة البيانات', 'Database connection error')
              : t('متصل بقاعدة بيانات Supabase الحقيقية', 'Connected to live Supabase database')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-glass btn-sm"
            onClick={() => void loadProducts()}
            disabled={loading}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{t('تحديث', 'Refresh')}</span>
          </button>
          <Link to="/admin/settings" className="btn btn-glass btn-sm">
            <Settings size={14} aria-hidden="true" />
            <span>{t('إعدادات المتجر', 'Store Settings')}</span>
          </Link>
          <Link to="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus size={15} aria-hidden="true" />
            <span>{t('إضافة منتج', 'Add Product')}</span>
          </Link>
        </div>
      </div>

      {/* Real Inventory Stats (Zero Fabricated Revenue/Sales) */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <span className="stat-label">{t('إجمالي المنتجات', 'Total Products')}</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-label">{t('المنتجات المنشورة', 'Published')}</span>
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>
            {stats.published}
          </span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-label">{t('المنتجات المخفية', 'Hidden')}</span>
          <span className="stat-value" style={{ color: 'var(--color-warm-gray)' }}>
            {stats.hidden}
          </span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-label">{t('تحتاج استكمال بيانات', 'Needs Attention')}</span>
          <span className="stat-value" style={{ color: stats.incomplete > 0 ? 'var(--color-warning)' : 'var(--color-obsidian)' }}>
            {stats.incomplete}
          </span>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="toolbar-glass glass-panel">
        <div className="search-input-wrap">
          <Search size={18} className="search-input-icon" aria-hidden="true" />
          <input
            type="search"
            className="input search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ابحث باسم المنتج أو slug...', 'Search by name or slug...')}
          />
        </div>

        <div className="filter-chips" role="tablist" aria-label={t('تصفية المنتجات', 'Filter products')}>
          {(
            [
              ['all', t('الكل', 'All')],
              ['published', t('منشور', 'Published')],
              ['hidden', t('مخفي', 'Hidden')],
              ['incomplete', t('ناقص البيانات', 'Incomplete')],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`chip ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Management List (Mobile-First Cards, Zero Horizontal Scroll) */}
      {loading ? (
        <CenteredSpinner label={t('جاري تحميل المنتجات...', 'Loading products...')} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadProducts()} />
      ) : filteredProducts.length === 0 ? (
        <div className="state-card glass-panel">
          <h3>
            {products.length === 0
              ? t('لا توجد منتجات في قاعدة البيانات بعد', 'No products in database yet')
              : t('لا توجد منتجات مطابقة للتصفية', 'No products match your filter')}
          </h3>
          <p>
            {products.length === 0
              ? t(
                  'ابدأ بإضافة أول منتج لك، ارفع صورته من هاتفك، وأضف رابط الإحالة الخاص به.',
                  'Start by adding your first product, uploading its image from your phone, and adding its referral URL.'
                )
              : t('جرّب تغيير خيارات البحث أو الفلتر.', 'Try adjusting your search or filter.')}
          </p>
          {products.length === 0 && (
            <Link to="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={15} aria-hidden="true" />
              <span>{t('إضافة أول منتج', 'Add First Product')}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="admin-product-list">
          {filteredProducts.map((product) => {
            const urlCheck = validatePurchaseUrl(product.purchase_url);
            const priceDisplay = formatPrice(product.price, product.currency, locale);
            const incomplete = isProductIncomplete(product);

            return (
              <article key={product.id} className="admin-product-row glass-panel">
                <div className="admin-product-primary">
                  <div className="admin-thumb">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" />
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray-muted)' }}>
                        {t('بدون صورة', 'No img')}
                      </span>
                    )}
                  </div>

                  <div className="admin-product-meta">
                    <h3 className="admin-product-name">{product.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>
                      <span className="ltr-isolate">/{product.slug}</span>
                      {' • '}
                      <span>{t('آخر تعديل:', 'Updated:')} {formatDate(product.updated_at, locale)}</span>
                    </div>

                    <div className="admin-badges-row">
                      {product.is_published ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          <span>{t('منشور', 'Published')}</span>
                        </span>
                      ) : (
                        <span className="badge badge-neutral">
                          <EyeOff size={12} aria-hidden="true" />
                          <span>{t('مخفي', 'Hidden')}</span>
                        </span>
                      )}

                      {urlCheck.valid ? (
                        <span className="badge badge-success">
                          <Link2 size={12} aria-hidden="true" />
                          <span>{t('رابط الشراء جاهز', 'Purchase Link OK')}</span>
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <Link2Off size={12} aria-hidden="true" />
                          <span>{t('رابط شراء ناقص/غير صالح', 'Missing/Invalid URL')}</span>
                        </span>
                      )}

                      {priceDisplay && (
                        <span className="badge badge-champagne">
                          <span className="ltr-isolate">{priceDisplay}</span>
                        </span>
                      )}

                      {incomplete && (
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} aria-hidden="true" />
                          <span>{t('يحتاج استكمال', 'Incomplete')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="btn btn-glass btn-sm"
                    disabled={togglingId === product.id}
                    onClick={() => void handleTogglePublish(product)}
                  >
                    {togglingId === product.id ? (
                      <span className="spinner" />
                    ) : product.is_published ? (
                      <EyeOff size={15} aria-hidden="true" />
                    ) : (
                      <Eye size={15} aria-hidden="true" />
                    )}
                    <span>
                      {product.is_published ? t('إخفاء', 'Hide') : t('نشر', 'Publish')}
                    </span>
                  </button>

                  {product.is_published && (
                    <Link
                      to={`/product/${encodeURIComponent(product.slug)}`}
                      className="btn btn-glass btn-sm"
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                      <span>{t('معاينة', 'Preview')}</span>
                    </Link>
                  )}

                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="btn btn-primary btn-sm"
                  >
                    <Edit3 size={15} aria-hidden="true" />
                    <span>{t('تعديل', 'Edit')}</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setProductToDelete(product)}
                    aria-label={t(`حذف ${product.name}`, `Delete ${product.name}`)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(productToDelete)}
        title={t('هل أنت متأكد من حذف المنتج؟', 'Are you sure you want to delete this product?')}
        description={
          productToDelete
            ? t(
                `سيتم حذف "${productToDelete.name}" نهائيًا من قاعدة البيانات، مع حذف صورته الخاصة فقط إن وُجدت.`,
                `"${productToDelete.name}" will be permanently removed from the database along with its own uploaded image.`
              )
            : ''
        }
        confirmLabel={t('نعم، احذف المنتج', 'Yes, Delete Product')}
        busy={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
