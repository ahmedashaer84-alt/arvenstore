export function formatPrice(
  price: number | null | undefined,
  currency: string | null | undefined,
  locale: 'ar' | 'en'
): string | null {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return null;
  }

  const numericPrice = Number(price);
  if (numericPrice < 0) return null;

  const cleanCurrency = (currency || 'SAR').trim().toUpperCase();
  const formattedNumber = new Intl.NumberFormat(locale === 'ar' ? 'en-US' : 'en-US', {
    minimumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);

  return `${formattedNumber} ${cleanCurrency}`;
}

export function formatDate(isoDate: string | null | undefined, locale: 'ar' | 'en'): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
