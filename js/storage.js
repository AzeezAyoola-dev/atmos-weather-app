/**
 * Recent-search persistence.
 *
 * Phase 1: storage contract only.
 * Safe read/write, de-duplication and ordering arrive in Phase 8.
 */

export const RECENT_CITIES_STORAGE_KEY = 'atmos.recentCities.v1';
export const MAX_RECENT_CITIES = 5;
