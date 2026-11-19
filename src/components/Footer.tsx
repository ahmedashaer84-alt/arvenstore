import { Link } from 'react-router-dom';
import { Instagram, Mail, MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';
import { buildWhatsAppUrl, validateExternalUrl } from '../utils/url';

export function Footer() {
  const { locale, t } = useI18n();
  const { settings } = useSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number);
  const instagramUrl = validateExternalUrl(settings.instagram_url);
  const year = new Date().getFullYear();

  return (
    <footer id="contact-footer" className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="arven-wordmark" style={{ fontSize: '1.35rem', marginBottom: 10 }}>
              {settings.brand_name || 'ARVEN'}
            </div>
            <p style={{ margin: '0 0 12px', color: 'var(--color-warm-gray)', fontSize: '0.9rem' }}>
              {locale === 'ar'
                ? settings.brand_description_ar
                : settings.brand_description_en}
            </p>
            <p style={{ margin: 0, color: 'var(--color-warm-gray-muted)', fontSize: '0.82rem' }}>
              {t(
                'تعمل ARVEN كواجهة عرض مستقلة لمنتجات مختارة، وتوجّه الزوار إلى صفحات الشراء الرسمية عبر روابط إحالة معتمدة.',
                'ARVEN operates as an independent curation showcase directing visitors to official purchase pages via referral links.'
              )}
            </p>
          </div>

          <div>
            <h3 className="footer-heading">{t('روابط سريعة', 'Explore')}</h3>
            <ul className="footer-list">
              <li>
                <Link to="/shop" className="footer-link">
                  {t('تصفح المتجر', 'Browse Shop')}
                </Link>
              </li>
              <li>
                <Link to="/affiliate-disclosure" className="footer-link">
                  {t('توضيح روابط الإحالة', 'Affiliate Disclosure')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="footer-link">
                  {t('سياسة الخصوصية', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  {t('شروط الاستخدام', 'Terms of Use')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-heading">{t('خدمة العملاء والتواصل', 'Contact')}</h3>
            <ul className="footer-list">
              <li>
                <a href={`mailto:${settings.contact_email}`} className="footer-link">
                  <Mail size={16} aria-hidden="true" />
                  <span className="ltr-isolate">{settings.contact_email}</span>
                </a>
              </li>
              {instagramUrl && (
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    <Instagram size={16} aria-hidden="true" />
                    <span className="ltr-isolate">{settings.instagram_handle}</span>
                  </a>
                </li>
              )}
              {whatsappUrl && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    <span>{t('خدمة العملاء عبر واتساب', 'WhatsApp Customer Care')}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} <span className="ltr-isolate">{settings.brand_name || 'ARVEN'}</span>.{' '}
            {t('جميع الحقوق محفوظة.', 'All rights reserved.')}
          </span>
          <span>
            {t(
              'لا تتم معالجة المدفوعات داخل ARVEN؛ تُستكمل الطلبات عبر الموقع الرسمي.',
              'Payments are not processed on ARVEN; orders complete on the official merchant site.'
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
