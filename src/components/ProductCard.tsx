import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import type { Product } from '../types/database';
import { useI18n } from '../lib/i18n';
import { formatPrice } from '../utils/format';
import { ProductImage } from './ProductImage';
import { PurchaseButton } from './PurchaseButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useI18n();
  const priceDisplay = formatPrice(product.price, product.currency, locale);
  const detailPath = `/product/${encodeURIComponent(product.slug)}`;
  const ArrowIcon = locale === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <article className="product-card glass-panel">
      <Link
        to={detailPath}
        className="product-media-frame"
        aria-label={t(`عرض تفاصيل ${product.name}`, `View details for ${product.name}`)}
      >
        {product.is_featured && (
          <span className="badge badge-champagne product-featured-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>{t('مختار بعناية', 'Featured')}</span>
          </span>
        )}
        <ProductImage src={product.image_url} alt={product.name} />
      </Link>

      <div className="product-card-body">
        <Link to={detailPath}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

        {product.short_description.trim() && (
          <p className="product-card-desc">{product.short_description}</p>
        )}

        {priceDisplay && (
          <div className="product-price">
            <span className="ltr-isolate">{priceDisplay}</span>
          </div>
        )}

        <div className="product-card-actions">
          <PurchaseButton
            productName={product.name}
            purchaseUrl={product.purchase_url}
            fullWidth
          />
          <Link to={detailPath} className="btn btn-glass btn-sm btn-full">
            <span>{t('تفاصيل المنتج', 'View Details')}</span>
            <ArrowIcon size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
