import { ExternalLink, AlertCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { validatePurchaseUrl } from '../utils/url';

interface PurchaseButtonProps {
  productName: string;
  purchaseUrl: string | null | undefined;
  fullWidth?: boolean;
  size?: 'default' | 'sm';
}

/**
 * Direct, independent, popup-blocker-safe purchase button.
 * - Uses an authentic HTML <a> tag bound strictly to THIS product's `purchase_url`.
 * - Never calls the legacy `buy` Edge Function.
 * - Never falls back to a shared/default/hardcoded URL.
 * - Rejects non-http(s) protocols such as `javascript:`.
 */
export function PurchaseButton({
  productName,
  purchaseUrl,
  fullWidth = true,
  size = 'default',
}: PurchaseButtonProps) {
  const { t } = useI18n();
  const check = validatePurchaseUrl(purchaseUrl);

  if (!check.valid || !check.normalizedUrl) {
    return (
      <div
        className="purchase-unavailable"
        style={{ width: fullWidth ? '100%' : undefined }}
        role="status"
      >
        <AlertCircle size={16} aria-hidden="true" />
        <span>{t('غير متاح للشراء حاليًا', 'Currently unavailable')}</span>
      </div>
    );
  }

  return (
    <a
      href={check.normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-primary ${fullWidth ? 'btn-full' : ''} ${size === 'sm' ? 'btn-sm' : ''}`}
      aria-label={t(
        `شراء ${productName} عبر الصفحة الرسمية`,
        `Purchase ${productName} on official page`
      )}
      data-product-purchase-link="true"
    >
      <span>{t('الشراء من الصفحة الرسمية', 'Shop Official Link')}</span>
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  );
}
