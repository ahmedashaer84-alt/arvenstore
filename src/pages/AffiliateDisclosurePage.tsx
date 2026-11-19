import { useI18n } from '../lib/i18n';
import { useSettings } from '../contexts/SettingsContext';

export function AffiliateDisclosurePage() {
  const { locale } = useI18n();
  const { settings } = useSettings();

  if (locale === 'en') {
    return (
      <section className="container-narrow">
        <article className="prose-card glass-panel-strong">
          <h1>Affiliate & Referral Disclosure</h1>
          <p>
            Transparency is a core pillar of ARVEN. This page explains the commercial
            relationship behind the purchase links presented in our store.
          </p>

          <h2>How Our Links Work</h2>
          <p>
            ARVEN showcases selected products marketed through personal referral links
            affiliated with <strong>My Life Style</strong>. Every product listed in the
            store has its own independent official purchase URL.
          </p>

          <h2>What This Means for You</h2>
          <ul>
            <li>
              When you purchase a product through an ARVEN referral link, ARVEN may earn
              a referral commission at no additional cost to you beyond the official
              merchant price.
            </li>
            <li>
              ARVEN is an independent curation and marketing storefront and does not
              claim to be the manufacturer or owner of the listed products.
            </li>
            <li>
              Order processing, payment handling, shipping, and official after-sales
              policies are handled directly by the official merchant website.
            </li>
          </ul>

          <h2>Customer Support</h2>
          <p>
            Need help choosing a product or have a question before ordering? Reach us at{' '}
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
        <h1>توضيح روابط الإحالة والشفافية التجارية</h1>
        <p>
          تلتزم ARVEN بالوضوح الكامل مع زوارها حول طبيعة العلاقة التجارية المرتبطة
          بالمنتجات المعروضة في المتجر.
        </p>

        <h2>كيف تعمل روابط الشراء في ARVEN؟</h2>
        <p>
          تعمل ARVEN بوصفها علامة مستقلة مختصة بانتقاء المنتجات وعرضها والتسويق لها عبر
          روابط إحالة خاصة لدى شركة <strong className="ltr-isolate">My Life Style</strong>.
          ويمتلك كل منتج في المتجر رابط شراء رسميًا مستقلًا خاصًا به.
        </p>

        <h2>ماذا يعني ذلك لك كمشتري؟</h2>
        <ul>
          <li>
            عند إتمامك الشراء عبر أحد روابط المنتجات في ARVEN، قد تحصل ARVEN على عمولة
            تسويقية دون أي تكلفة إضافية عليك فوق السعر الرسمي المعتمد.
          </li>
          <li>
            لا تدّعي ARVEN أنها الجهة المصنعة للمنتجات المعروضة أو المالكة لها.
          </li>
          <li>
            تتم عملية الدفع وإصدار الفاتورة والشحن وسياسة الاسترجاع مباشرة عبر الموقع
            الرسمي الذي يتم توجيهك إليه.
          </li>
        </ul>

        <h2>خدمة العملاء</h2>
        <p>
          لأي استفسار قبل الشراء، يسعدنا تواصلك معنا عبر البريد الإلكتروني:{' '}
          <a href={`mailto:${settings.contact_email}`} className="ltr-isolate" style={{ textDecoration: 'underline' }}>
            {settings.contact_email}
          </a>
        </p>
      </article>
    </section>
  );
}
