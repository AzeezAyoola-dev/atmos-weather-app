/**
 * Shared in-memory application state.
 *
 * Phase 5 stores the city selected from geocoding results so Phase 6 can
 * retrieve its weather. Nothing here is persisted to localStorage.
 */

let selectedCity = null;

/**
 * Store the selected city in a stable, plain-object shape.
 *
 * @param {object} city Normalized geocoding result.
 * @returns {object|null} A copy of the stored city.
 */
export function setSelectedCity(city) {
  if (!city || typeof city !== 'object') {
    return null;
  }

  selectedCity = Object.freeze({
    id: city.id ?? null,
    name: String(city.name ?? ''),
    region: String(city.region ?? ''),
    country: String(city.country ?? ''),
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    timezone: String(city.timezone ?? ''),
  });

  return getSelectedCity();
}

/**
 * Read the selected city.
 *
 * @returns {object|null} A copy of the stored city, or null before selection.
 */
export function getSelectedCity() {
  return selectedCity ? { ...selectedCity } : null;
}
