import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Settings, Store, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../lib/i18n';
import { useToast } from '../contexts/ToastContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { locale, toggleLocale, t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast(t('تم تسجيل الخروج بنجاح.', 'Signed out successfully.'), 'info');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <header className="admin-header glass-panel-strong">
        <div className="admin-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/admin" className="arven-wordmark" style={{ fontSize: '1.15rem' }}>
              ARVEN
            </Link>
            <span className="badge badge-champagne">{t('لوحة الإدارة', 'Admin')}</span>
          </div>

          <nav className="admin-nav-strip" aria-label={t('تنقل الإدارة', 'Admin navigation')}>
            <NavLink to="/admin" end className="btn btn-ghost btn-sm">
              <LayoutDashboard size={16} aria-hidden="true" />
              <span>{t('المنتجات', 'Products')}</span>
            </NavLink>
            <NavLink to="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={16} aria-hidden="true" />
              <span>{t('منتج جديد', 'New')}</span>
            </NavLink>
            <NavLink to="/admin/settings" className="btn btn-ghost btn-sm">
              <Settings size={16} aria-hidden="true" />
              <span>{t('الإعدادات', 'Settings')}</span>
            </NavLink>
            <Link to="/" className="btn btn-glass btn-sm">
              <Store size={16} aria-hidden="true" />
              <span>{t('المتجر', 'Store')}</span>
            </Link>
            <button
              type="button"
              className="lang-pill"
              onClick={toggleLocale}
              aria-label={t('تغيير اللغة', 'Switch language')}
            >
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title={user?.email ?? ''}
              aria-label={t('تسجيل الخروج', 'Sign out')}
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
