import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';

export function TermsPage() {
  const { locale } = useI18n();
  const { settings } = useSettings();

  if (locale === 'en') {
    return (
      <section className="container-narrow">
        <article className="prose-card glass-panel-strong">
          <h1>Terms of Use</h1>
          <p>
            By accessing and using ARVEN, you agree to the following terms governing the
            browsing of curated products and use of external purchase links.
          </p>

          <h2>1. Role of ARVEN</h2>
          <p>
            ARVEN is an independent curation and showcase storefront. ARVEN does not
            manufacture the listed products and does not process checkout transactions,
            shipping, returns, or warranties directly.
          </p>

          <h2>2. Pricing & Availability</h2>
          <p>
            Product prices displayed on ARVEN are provided for reference when available.
            Final pricing, taxes, shipping fees, and availability are confirmed on the
            official external purchase page at the time of order.
          </p>

          <h2>3. No Unverified Claims</h2>
          <p>
            Product descriptions are presented for general informational purposes and do
            not constitute medical advice or guaranteed results. Always review official
            product documentation on the merchant page before purchasing.
          </p>

          <h2>4. Contact</h2>
          <p>
            Questions regarding these terms may be sent to{' '}
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
        <h1>شروط الاستخدام</h1>
        <p>
          باستخدامك موقع ARVEN، فإنك توافق على الشروط التالية المنظمة لتصفح المنتجات
          المختارة واستخدام روابط الشراء الخارجية.
        </p>

        <h2>1. طبيعة دور ARVEN</h2>
        <p>
          تعمل ARVEN كواجهة مستقلة لانتقاء وعرض المنتجات. ولا تدّعي ARVEN تصنيع المنتجات
          المعروضة أو امتلاكها، كما لا تقوم بمعالجة المدفوعات أو الشحن أو المرتجعات داخل
          الموقع.
        </p>

        <h2>2. الأسعار والتوفر</h2>
        <p>
          الأسعار المعروضة عند توفرها هي للإرشاد فقط، ويكون السعر النهائي وتكاليف الشحن
          وتوفر المنتج وفق ما يظهر في صفحة الشراء الرسمية عند إتمام الطلب.
        </p>

        <h2>3. عدم تقديم ادعاءات طبية أو نتائج مضمونة</h2>
        <p>
          تُعرض معلومات المنتجات لأغراض تعريفية عامة فقط، ولا تُعد استشارة طبية أو ضمانًا
          لنتائج محددة. يرجى مراجعة تفاصيل المنتج الرسمية في صفحة الشركة قبل الشراء.
        </p>

        <h2>4. التواصل</h2>
        <p>
          لأي استفسار حول شروط الاستخدام، تواصل معنا عبر البريد الإلكتروني:{' '}
          <a href={`mailto:${settings.contact_email}`} className="ltr-isolate" style={{ textDecoration: 'underline' }}>
            {settings.contact_email}
          </a>
        </p>
      </article>
    </section>
  );
}
