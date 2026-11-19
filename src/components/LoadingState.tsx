import { useI18n } from '../lib/i18n';

export function ProductGridSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div
      className="product-grid"
      aria-busy="true"
      aria-label={t('جاري تحميل المنتجات', 'Loading products')}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="product-card glass-panel">
          <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
          <div className="product-card-body">
            <div className="skeleton" style={{ height: 22, width: '72%' }} />
            <div className="skeleton" style={{ height: 15, width: '94%' }} />
            <div className="skeleton" style={{ height: 15, width: '60%' }} />
            <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 999, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CenteredSpinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '64px 16px',
        color: 'var(--color-warm-gray)',
      }}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" style={{ width: 26, height: 26 }} />
      <span>{label ?? t('جاري التحميل...', 'Loading...')}</span>
    </div>
  );
}
