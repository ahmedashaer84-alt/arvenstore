import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Search, X, Mail, Instagram, MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';
import { buildWhatsAppUrl, validateExternalUrl } from '../utils/url';
import { SearchOverlay } from './SearchOverlay';

export function Navbar() {
  const { locale, toggleLocale, t } = useI18n();
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number);
  const instagramUrl = validateExternalUrl(settings.instagram_url);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <header className="nav-wrapper">
        <nav
          className={`nav-bar glass-panel ${scrolled ? 'nav-scrolled' : ''}`}
          aria-label={t('التنقل الرئيسي', 'Main navigation')}
        >
          <Link to="/" className="nav-brand" onClick={() => setDrawerOpen(false)}>
            <span className="arven-wordmark">{settings.brand_name || 'ARVEN'}</span>
          </Link>

          <div className="nav-links-desktop">
            <NavLink to="/" end className="nav-link">
              {t('الرئيسية', 'Home')}
            </NavLink>
            <NavLink to="/shop" className="nav-link">
              {t('المتجر', 'Shop')}
            </NavLink>
            <NavLink to="/affiliate-disclosure" className="nav-link">
              {t('الشفافية والإحالة', 'Disclosure')}
            </NavLink>
            <a href="#contact-footer" className="nav-link">
              {t('تواصل معنا', 'Contact')}
            </a>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setSearchOpen(true)}
              aria-label={t('فتح البحث', 'Open search')}
            >
              <Search size={19} />
            </button>

            <button
              type="button"
              className="lang-pill"
              onClick={toggleLocale}
              aria-label={t('التبديل إلى الإنجليزية', 'Switch to Arabic')}
            >
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-icon nav-mobile-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('فتح القائمة', 'Open menu')}
              aria-expanded={drawerOpen}
            >
              <Menu size={21} />
            </button>
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="drawer-panel glass-panel-strong"
            role="dialog"
            aria-modal="true"
            aria-label={t('قائمة التنقل', 'Navigation menu')}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <span className="arven-wordmark" style={{ fontSize: '1.2rem' }}>
                  {settings.brand_name || 'ARVEN'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t('إغلاق القائمة', 'Close menu')}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="drawer-nav">
                <NavLink
                  to="/"
                  end
                  className="drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('الرئيسية', 'Home')}
                </NavLink>
                <NavLink
                  to="/shop"
                  className="drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('المتجر', 'Shop')}
                </NavLink>
                <NavLink
                  to="/affiliate-disclosure"
                  className="drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('توضيح روابط الإحالة', 'Affiliate Disclosure')}
                </NavLink>
                <NavLink
                  to="/privacy"
                  className="drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('سياسة الخصوصية', 'Privacy Policy')}
                </NavLink>
                <NavLink
                  to="/terms"
                  className="drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('شروط الاستخدام', 'Terms of Use')}
                </NavLink>
              </nav>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--glass-border-subtle)',
                paddingTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <a
                href={`mailto:${settings.contact_email}`}
                className="btn btn-glass btn-sm btn-full"
              >
                <Mail size={16} aria-hidden="true" />
                <span className="ltr-isolate">{settings.contact_email}</span>
              </a>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-glass btn-sm btn-full"
                >
                  <Instagram size={16} aria-hidden="true" />
                  <span className="ltr-isolate">{settings.instagram_handle}</span>
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm btn-full"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>{t('تواصل عبر واتساب', 'Contact via WhatsApp')}</span>
                </a>
              )}
            </div>
          </aside>
        </>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
