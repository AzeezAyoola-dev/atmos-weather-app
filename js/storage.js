/**
 * Recent-search persistence.
 *
 * Phase 1: storage contract.
 * Phase 8: safe LocalStorage reads/writes, normalization, de-duplication,
 * ordering and an in-memory fallback when storage is unavailable.
 */

export const RECENT_CITIES_STORAGE_KEY = 'atmos.recentCities.v1';
export const MAX_RECENT_CITIES = 5;

let recentCitiesCache = null;

/**
 * Load the saved recent cities, newest first.
 *
 * Malformed payloads and unavailable storage resolve to an empty list, with
 * the last successfully written list kept in memory for the current session.
 *
 * @returns {object[]} Valid recent cities.
 */
export function loadRecentCities() {
  const storage = getStorage();
  if (!storage) {
    return copyCache();
  }

  try {
    const raw = storage.getItem(RECENT_CITIES_STORAGE_KEY);
    if (raw === null) {
      recentCitiesCache = [];
      return copyCache();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      recentCitiesCache = [];
      return copyCache();
    }

    recentCitiesCache = dedupeCities(
      parsed.map(normalizeRecentCity).filter(Boolean),
    ).slice(0, MAX_RECENT_CITIES);
    return copyCache();
  } catch (error) {
    return copyCache();
  }
}

/**
 * Add a selected city to the front of recent searches.
 *
 * An existing city is moved to the front instead of duplicated. Only the five
 * most recent unique cities are retained.
 *
 * @param {object} city Selected city from search results or recent history.
 * @returns {object[]} The updated recent-city list.
 */
export function saveRecentCity(city) {
  const normalized = normalizeRecentCity(city);
  if (!normalized) {
    return loadRecentCities();
  }

  const key = cityKey(normalized);
  const remaining = loadRecentCities().filter((item) => cityKey(item) !== key);
  recentCitiesCache = [normalized, ...remaining].slice(0, MAX_RECENT_CITIES);

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(RECENT_CITIES_STORAGE_KEY, JSON.stringify(recentCitiesCache));
    } catch (error) {
      // Keep the in-memory list when writes are blocked or fail.
    }
  }

  return copyCache();
}

function getStorage() {
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function copyCache() {
  return recentCitiesCache ? recentCitiesCache.map((city) => ({ ...city })) : [];
}

function normalizeRecentCity(city) {
  if (!city || typeof city !== 'object') {
    return null;
  }

  const name = getTrimmedString(city.name);
  const country = getTrimmedString(city.country);
  const timezone = getTrimmedString(city.timezone);
  const latitude = Number(city.latitude);
  const longitude = Number(city.longitude);

  if (
    !name
    || !country
    || !timezone
    || !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
  ) {
    return null;
  }

  return { name, country, latitude, longitude, timezone };
}

function cityKey(city) {
  return `${city.name.toLocaleLowerCase()}|${city.country.toLocaleLowerCase()}`;
}

function dedupeCities(cities) {
  const seen = new Set();
  return cities.filter((city) => {
    const key = cityKey(city);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}
