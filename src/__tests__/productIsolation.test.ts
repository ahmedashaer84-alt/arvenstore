import { describe, expect, it } from 'vitest';
import type { Product } from '../types/database';
import { validatePurchaseUrl } from '../utils/url';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'prod-default',
    name: 'Sample',
    slug: 'sample',
    short_description: 'Short description',
    description: 'Full description',
    price: null,
    currency: 'SAR',
    image_url: null,
    image_path: null,
    purchase_url: null,
    is_published: true,
    is_featured: false,
    sort_order: 0,
    created_at: '2026-11-19T00:00:00Z',
    updated_at: '2026-11-19T00:00:00Z',
    ...overrides,
  };
}

describe('Per-Product Purchase URL Isolation', () => {
  it('binds Product A to URL A and Product B to URL B independently', () => {
    const productA = makeProduct({
      id: 'id-a',
      slug: 'product-a',
      purchase_url: 'https://merchant.example/buy/product-a?ref=arven',
    });
    const productB = makeProduct({
      id: 'id-b',
      slug: 'product-b',
      purchase_url: 'https://merchant.example/buy/product-b?ref=arven',
    });

    const urlA = validatePurchaseUrl(productA.purchase_url).normalizedUrl;
    const urlB = validatePurchaseUrl(productB.purchase_url).normalizedUrl;

    expect(urlA).toBe('https://merchant.example/buy/product-a?ref=arven');
    expect(urlB).toBe('https://merchant.example/buy/product-b?ref=arven');
    expect(urlA).not.toBe(urlB);

    // Simulating an update to Product A leaves Product B completely untouched
    const updatedProducts = [productA, productB].map((item) =>
      item.id === 'id-a'
        ? { ...item, purchase_url: 'https://merchant.example/buy/product-a-v2?ref=arven' }
        : item
    );

    expect(validatePurchaseUrl(updatedProducts[0].purchase_url).normalizedUrl).toBe(
      'https://merchant.example/buy/product-a-v2?ref=arven'
    );
    expect(validatePurchaseUrl(updatedProducts[1].purchase_url).normalizedUrl).toBe(
      'https://merchant.example/buy/product-b?ref=arven'
    );
  });

  it('prevents a broken/missing link on one product from breaking other products', () => {
    const validProduct = makeProduct({
      id: 'id-1',
      purchase_url: 'https://merchant.example/item-1',
    });
    const missingLinkProduct = makeProduct({
      id: 'id-2',
      purchase_url: null,
    });

    expect(validatePurchaseUrl(validProduct.purchase_url).valid).toBe(true);
    expect(validatePurchaseUrl(missingLinkProduct.purchase_url).valid).toBe(false);
    expect(validatePurchaseUrl(missingLinkProduct.purchase_url).normalizedUrl).toBeNull();
  });
});
