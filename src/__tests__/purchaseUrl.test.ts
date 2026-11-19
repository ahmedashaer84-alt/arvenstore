import { describe, expect, it } from 'vitest';
import { validatePurchaseUrl, buildWhatsAppUrl } from '../utils/url';

describe('Purchase URL Security & Reliability Validation', () => {
  it('accepts valid HTTPS referral links', () => {
    const res = validatePurchaseUrl('https://shop.mylifestyle.example/item/oro-serum?ref=arven1');
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe('https://shop.mylifestyle.example/item/oro-serum?ref=arven1');
    expect(res.errorCode).toBeNull();
  });

  it('rejects javascript: and data: unsafe protocols', () => {
    expect(validatePurchaseUrl('javascript:alert(1)').valid).toBe(false);
    expect(validatePurchaseUrl('javascript:alert(1)').errorCode).toBe('UNSAFE_PROTOCOL');
    expect(validatePurchaseUrl('data:text/html,<script>alert(1)</script>').valid).toBe(false);
    expect(validatePurchaseUrl('vbscript:msgbox(1)').valid).toBe(false);
  });

  it('rejects empty, missing, or malformed URLs without falling back to a default URL', () => {
    expect(validatePurchaseUrl(null)).toEqual({
      valid: false,
      normalizedUrl: null,
      errorCode: 'MISSING',
    });
    expect(validatePurchaseUrl('   ')).toEqual({
      valid: false,
      normalizedUrl: null,
      errorCode: 'MISSING',
    });
    expect(validatePurchaseUrl('not-a-valid-url').valid).toBe(false);
    expect(validatePurchaseUrl('https://example.com/has spaces').valid).toBe(false);
  });

  it('explicitly blocks legacy Supabase /functions/v1/buy Edge Function URLs', () => {
    const legacy = 'https://ecazrleqdbpaoidpdmst.supabase.co/functions/v1/buy?slug=oro-stem-serum-samples-7-days-kit';
    const res = validatePurchaseUrl(legacy);
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('LEGACY_BUY_FUNCTION');
  });

  it('builds WhatsApp URL only when a real international number is configured', () => {
    expect(buildWhatsAppUrl(null)).toBeNull();
    expect(buildWhatsAppUrl('')).toBeNull();
    expect(buildWhatsAppUrl('123')).toBeNull();
    expect(buildWhatsAppUrl('+966 50 123 4567')).toBe('https://wa.me/966501234567');
  });
});
