/**
 * Countries and cities from country-state-city package.
 * Exposes a simple API: country names list and cities by country name.
 */
import { Country, City } from 'country-state-city';

const allCountries = Country.getAllCountries();
/** Sorted list of country names for pickers */
export const COUNTRIES: string[] = allCountries
  .map((c) => c.name)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

const countryNameToCode = new Map<string, string>(
  allCountries.map((c) => [c.name, c.isoCode])
);

/**
 * Get city names for a country (by country name).
 * Returns empty array if country not found or no cities.
 */
export function getCitiesForCountry(countryName: string): string[] {
  if (!countryName?.trim()) return [];
  const code = countryNameToCode.get(countryName.trim());
  if (!code) return [];
  const cities = City.getCitiesOfCountry(code);
  if (!cities || !Array.isArray(cities)) return [];
  return cities.map((c) => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
}
