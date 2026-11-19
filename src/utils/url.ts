export interface PurchaseUrlValidationResult {
  valid: boolean;
  normalizedUrl: string | null;
  errorCode:
    | null
    | 'MISSING'
    | 'INVALID_FORMAT'
    | 'UNSAFE_PROTOCOL'
    | 'LEGACY_BUY_FUNCTION';
}

/**
 * Strictly validates an individual product's external referral purchase URL.
 * - Allows ONLY `https:` and `http:` protocols.
 * - Rejects `javascript:`, `data:`, `vbscript:`, relative URLs, and malformed values.
 * - Blocks legacy broken `/functions/v1/buy` endpoints so they are never reintroduced.
 */
export function validatePurchaseUrl(
  rawUrl: string | null | undefined
): PurchaseUrlValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return { valid: false, normalizedUrl: null, errorCode: 'MISSING' };
  }

  const trimmed = rawUrl.trim();

  // Reject whitespace inside URLs
  if (/\s/.test(trimmed)) {
    return { valid: false, normalizedUrl: null, errorCode: 'INVALID_FORMAT' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, normalizedUrl: null, errorCode: 'INVALID_FORMAT' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, normalizedUrl: null, errorCode: 'UNSAFE_PROTOCOL' };
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { valid: false, normalizedUrl: null, errorCode: 'INVALID_FORMAT' };
  }

  // Prevent accidentally pointing back to the deprecated Edge Function `buy`
  if (/\/functions\/v1\/buy(\/|$)/i.test(parsed.pathname)) {
    return { valid: false, normalizedUrl: null, errorCode: 'LEGACY_BUY_FUNCTION' };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    errorCode: null,
  };
}

/**
 * Builds a safe WhatsApp link only when a valid numeric phone number is configured.
 * Returns null if unconfigured so the UI never displays a fake or broken WhatsApp link.
 */
export function buildWhatsAppUrl(rawNumber: string | null | undefined): string | null {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/[^\d]/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

/**
 * Validates an external social/profile URL (https/http only).
 */
export function validateExternalUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
