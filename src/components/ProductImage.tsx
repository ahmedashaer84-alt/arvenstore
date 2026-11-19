import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  eager?: boolean;
  className?: string;
}

export function ProductImage({
  src,
  alt,
  eager = false,
  className = 'product-media-img',
}: ProductImageProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const hasValidSrc = Boolean(src && src.trim() && !failed);

  if (!hasValidSrc) {
    return (
      <div className="product-media-placeholder" role="img" aria-label={alt}>
        <ImageOff size={26} strokeWidth={1.4} aria-hidden="true" />
        <span>{t('لا تتوفر صورة للمنتج', 'Product image unavailable')}</span>
      </div>
    );
  }

  return (
    <img
      src={src ?? undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={{ opacity: loaded ? 1 : 0.01 }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
