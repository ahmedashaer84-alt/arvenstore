import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';

export function PrivacyPage() {
  const { locale } = useI18n();
  const { settings } = useSettings();

  if (locale === 'en') {
    return (
      <section className="container-narrow">
        <article className="prose-card glass-panel-strong">
          <h1>Privacy Policy</h1>
          <p>
            ARVEN respects your privacy and keeps data collection minimal. You can browse
            the public storefront without creating an account or submitting personal
            payment details.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            Storefront visitors do not submit payment cards or shipping addresses on
            ARVEN. We store only a local language preference (Arabic or English) in your
            browser storage. If you contact us via email or WhatsApp, we use your message
            solely to respond to your inquiry.
          </p>

          <h2>2. External Merchant Websites</h2>
          <p>
            When you click a product purchase link, you leave ARVEN and visit an official
            external merchant page. Any purchase, payment, shipping, or account data is
            governed by that external provider’s privacy policy.
          </p>

          <h2>3. Administration Security</h2>
          <p>
            Store administration access is authenticated through Supabase Auth and
            protected by PostgreSQL Row Level Security policies.
          </p>

          <h2>4. Contact</h2>
          <p>
            For privacy questions, contact us at{' '}
            <a href={`mailto:${settings.contact_email}`} className="ltr-isolate" style={{ textDecoration: 'underline' }}>
              {settings.contact_email}
            </a>
            .
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="container-narrow">
      <article className="prose-card glass-panel-strong">
        <h1>سياسة الخصوصية</h1>
        <p>
          تحترم علامة ARVEN خصوصية زوارها وتلتزم بالحد الأدنى من البيانات. يمكنك تصفح
          المتجر العام بالكامل دون إنشاء حساب أو إدخال أي بيانات دفع.
        </p>

        <h2>1. البيانات التي نجمعها</h2>
        <p>
          لا يجمع متجر ARVEN بيانات بطاقات الدفع أو عناوين الشحن داخل الموقع. نحتفظ محليًا
          في متصفحك بتفضيل اللغة المختارة (العربية أو الإنجليزية) فقط. وعند تواصلك معنا
          عبر البريد الإلكتروني أو واتساب، تُستخدم رسالتك للرد على استفسارك فقط.
        </p>

        <h2>2. الروابط الخارجية وصفحات الشراء</h2>
        <p>
          عند الضغط على زر الشراء الخاص بأي منتج، يتم نقلك إلى صفحة الشراء الرسمية لدى
          المزود الخارجي. وتخضع عمليات الدفع والشحن وسياسة حفظ البيانات هناك لسياسة
          الخصوصية الخاصة بالجهة الخارجية.
        </p>

        <h2>3. أمان لوحة الإدارة</h2>
        <p>
          تخضع عمليات إدارة المنتجات والمحتوى لتسجيل دخول محمي عبر Supabase Auth وسياسات
          حماية Row Level Security على مستوى قاعدة البيانات.
        </p>

        <h2>4. التواصل بشأن الخصوصية</h2>
        <p>
          لأي استفسار يتعلق بالخصوصية، يرجى مراسلتنا على البريد التجاري:{' '}
          <a href={`mailto:${settings.contact_email}`} className="ltr-isolate" style={{ textDecoration: 'underline' }}>
            {settings.contact_email}
          </a>
        </p>
      </article>
    </section>
  );
}
