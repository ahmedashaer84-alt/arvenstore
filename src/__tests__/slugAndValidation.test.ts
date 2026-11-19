import { describe, expect, it } from 'vitest';
import { isValidSlug, normalizeSlug } from '../utils/slug';
import { validateProductForm } from '../utils/validation';

describe('Slug Normalization & Product Form Validation', () => {
  it('normalizes product names into clean URL-safe slugs', () => {
    expect(normalizeSlug('  Oro Stem Serum 7-Days Kit! ')).toBe('oro-stem-serum-7-days-kit');
    expect(isValidSlug('oro-stem-serum-samples-7-days-kit')).toBe(true);
    expect(isValidSlug('Invalid Slug!')).toBe(false);
  });

  it('blocks publishing a product without a valid purchase URL', () => {
    const result = validateProductForm(
      {
        name: 'Serum Kit',
        slug: 'serum-kit',
        short_description: 'Short desc',
        description: '',
        price: '120',
        currency: 'SAR',
        purchase_url: '',
        is_published: true,
        is_featured: false,
        sort_order: '0',
      },
      'en'
    );
    expect(result.errors.purchase_url).toBeDefined();
  });

  it('allows saving an unpublished draft without a price or purchase URL', () => {
    const result = validateProductForm(
      {
        name: 'Draft Product',
        slug: 'draft-product',
        short_description: '',
        description: '',
        price: '',
        currency: 'SAR',
        purchase_url: '',
        is_published: false,
        is_featured: false,
        sort_order: '1',
      },
      'ar'
    );
    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.parsedPrice).toBeNull();
    expect(result.normalizedPurchaseUrl).toBeNull();
  });
});
