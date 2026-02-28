import type { User } from '@/types/post';

/**
 * Format user location for display. Never shows exact address.
 * Examples: "Berlin, Germany" | "Texas, USA" | "Toronto, Canada"
 */
export function formatLocationDisplay(user: Pick<User, 'city' | 'state' | 'country'> | null | undefined): string | null {
  if (!user) return null;
  const { city, state, country } = user;
  if (!country?.trim()) return null;
  const countryTrim = country.trim();
  if (city?.trim() && state?.trim()) return `${city.trim()}, ${countryTrim}`;
  if (city?.trim()) return `${city.trim()}, ${countryTrim}`;
  if (state?.trim()) return `${state.trim()}, ${countryTrim}`;
  return countryTrim;
}
