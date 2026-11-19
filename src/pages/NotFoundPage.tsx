import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="section-block">
      <div className="container-narrow">
        <div className="state-card glass-panel-strong" style={{ paddingBlock: 56 }}>
          <span
            className="arven-wordmark"
            style={{ fontSize: '3.2rem', color: 'var(--color-champagne)' }}
          >
            404
          </span>
          <h1>{t('الصفحة غير موجودة', 'Page Not Found')}</h1>
          <p>
            {t(
              'تعذر العثور على الصفحة التي تبحث عنها. ربما تم تغيير الرابط أو نقله.',
              'The page you are looking for could not be found. It may have been moved or removed.'
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            <Link to="/" className="btn btn-primary btn-sm">
              <Home size={16} aria-hidden="true" />
              <span>{t('العودة للرئيسية', 'Back to Home')}</span>
            </Link>
            <Link to="/shop" className="btn btn-glass btn-sm">
              <ShoppingBag size={16} aria-hidden="true" />
              <span>{t('تصفح المتجر', 'Browse Shop')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
