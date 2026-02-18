/**
 * Map country name (or partial) to ISO 3166-1 alpha-2 code for flag emoji.
 * Keys are lowercase for case-insensitive match.
 */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  italy: 'IT',
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  germany: 'DE',
  france: 'FR',
  spain: 'ES',
  portugal: 'PT',
  netherlands: 'NL',
  belgium: 'BE',
  switzerland: 'CH',
  austria: 'AT',
  poland: 'PL',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  ireland: 'IE',
  greece: 'GR',
  romania: 'RO',
  hungary: 'HU',
  'czech republic': 'CZ',
  czechia: 'CZ',
  croatia: 'HR',
  serbia: 'RS',
  ukraine: 'UA',
  russia: 'RU',
  turkey: 'TR',
  india: 'IN',
  china: 'CN',
  japan: 'JP',
  'south korea': 'KR',
  korea: 'KR',
  australia: 'AU',
  canada: 'CA',
  brazil: 'BR',
  mexico: 'MX',
  argentina: 'AR',
  chile: 'CL',
  colombia: 'CO',
  peru: 'PE',
  'south africa': 'ZA',
  egypt: 'EG',
  nigeria: 'NG',
  kenya: 'KE',
  morocco: 'MA',
  algeria: 'DZ',
  tunisia: 'TN',
  israel: 'IL',
  'saudi arabia': 'SA',
  uae: 'AE',
  'united arab emirates': 'AE',
  singapore: 'SG',
  malaysia: 'MY',
  indonesia: 'ID',
  thailand: 'TH',
  vietnam: 'VN',
  philippines: 'PH',
  'new zealand': 'NZ',
};

/**
 * Get ISO 3166-1 alpha-2 country code from country name or return as-is if already 2 chars.
 */
export function getCountryCode(country: string): string | null {
  if (!country || typeof country !== 'string') return null;
  const trimmed = country.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const key = trimmed.toLowerCase();
  return COUNTRY_NAME_TO_CODE[key] ?? null;
}

/**
 * Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "IT" -> "🇮🇹").
 * Uses regional indicator symbols: A = U+1F1E6, so letter N = U+1F1E6 + (N - 65).
 */
export function countryCodeToFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  const c1 = code.charCodeAt(0) - 0x41;
  const c2 = code.charCodeAt(1) - 0x41;
  if (c1 < 0 || c1 > 25 || c2 < 0 || c2 > 25) return '';
  return String.fromCodePoint(0x1f1e6 + c1, 0x1f1e6 + c2);
}

/**
 * Get flag emoji for a country name or 2-letter code. Returns empty string if unknown.
 */
export function getCountryFlag(country: string): string {
  const code = getCountryCode(country);
  if (!code) return '';
  return countryCodeToFlagEmoji(code);
}
