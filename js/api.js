/**
 * Open-Meteo API access layer.
 *
 * Phase 1: endpoint constants only.
 * Geocoding requests arrive in Phase 5; forecast requests arrive in Phase 6.
 */

export const API_ENDPOINTS = Object.freeze({
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
});
