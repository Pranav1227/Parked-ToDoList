/**
 * Safe link parsing and validation utilities.
 * Only http: and https: protocols are permitted to guard against script injection.
 */
export function isValidUrl(string) {
  if (!string || typeof string !== 'string') return false;
  const trimmed = string.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(string) {
  if (!isValidUrl(string)) return null;
  return string.trim();
}
