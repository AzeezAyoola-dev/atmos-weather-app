/**
 * Open-Meteo API access layer.
 *
 * Phase 5: geocoding requests for city search.
 * Phase 6: current-weather requests for the selected city.
 * Phase 7: daily forecast requests for the selected city.
 */

export const API_ENDPOINTS = Object.freeze({
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
});

export const GEOCODING_RESULT_COUNT = 5;

export const CURRENT_WEATHER_VARIABLES = Object.freeze([
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'weather_code',
  'wind_speed_10m',
  'visibility',
]);

export const DAILY_FORECAST_VARIABLES = Object.freeze([
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
]);

export const DAILY_FORECAST_DAYS = 5;

/**
 * Fetch cities matching a query from the Open-Meteo Geocoding API.
 *
 * @param {string} query Trimmed search text.
 * @param {{signal?: AbortSignal}} [options] Optional abort signal.
 * @returns {Promise<object[]>} Normalized city results.
 */
export async function fetchCityResults(query, { signal } = {}) {
  const url = new URL(API_ENDPOINTS.geocoding);
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(GEOCODING_RESULT_COUNT));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding API returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.results)) {
    return [];
  }

  return payload.results
    .map(normalizeCityResult)
    .filter((city) => city !== null);
}

/**
 * Convert one API result into the shape used by the application.
 *
 * @param {object} result Raw geocoding result.
 * @returns {object|null} Normalized result, or null when required data is missing.
 */
function normalizeCityResult(result) {
  const name = getTrimmedString(result?.name);
  const country = getTrimmedString(result?.country);
  const latitude = Number(result?.latitude);
  const longitude = Number(result?.longitude);

  if (!name || !country || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: result.id ?? null,
    name,
    region: getTrimmedString(result.admin1),
    country,
    latitude,
    longitude,
    timezone: getTrimmedString(result.timezone),
  };
}

/**
 * Fetch current weather for a geocoded city.
 *
 * @param {object} city City from shared state with latitude, longitude and timezone.
 * @param {{signal?: AbortSignal}} [options] Optional abort signal.
 * @returns {Promise<object>} Normalized current-weather data.
 */
export async function fetchCurrentWeather(city, { signal } = {}) {
  const latitude = Number(city?.latitude);
  const longitude = Number(city?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Selected city has no coordinates');
  }

  const url = createForecastUrl(latitude, longitude, city.timezone);
  url.searchParams.set('current', CURRENT_WEATHER_VARIABLES.join(','));
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Forecast API returned ${response.status}`);
  }

  const payload = await response.json();
  return normalizeCurrentWeather(payload);
}

function normalizeCurrentWeather(payload) {
  const current = payload?.current;
  if (!current || typeof current !== 'object') {
    throw new Error('Weather response has no current conditions');
  }

  const time = getTrimmedString(current.time);
  if (!time) {
    throw new Error('Weather response has no current time');
  }

  return {
    time,
    temperature: toFiniteNumber(current.temperature_2m),
    feelsLike: toFiniteNumber(current.apparent_temperature),
    humidity: toFiniteNumber(current.relative_humidity_2m),
    weatherCode: toFiniteNumber(current.weather_code),
    windSpeed: toFiniteNumber(current.wind_speed_10m),
    visibility: toFiniteNumber(current.visibility),
    units: payload.current_units && typeof payload.current_units === 'object'
      ? payload.current_units
      : {},
  };
}

/**
 * Fetch five daily forecast entries for a geocoded city.
 *
 * @param {object} city City from shared state with latitude, longitude and timezone.
 * @param {{signal?: AbortSignal}} [options] Optional abort signal.
 * @returns {Promise<object[]>} Up to five normalized daily forecast entries.
 */
export async function fetchDailyForecast(city, { signal } = {}) {
  const latitude = Number(city?.latitude);
  const longitude = Number(city?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Selected city has no coordinates');
  }

  const url = createForecastUrl(latitude, longitude, city.timezone);
  url.searchParams.set('daily', DAILY_FORECAST_VARIABLES.join(','));
  url.searchParams.set('forecast_days', String(DAILY_FORECAST_DAYS));
  url.searchParams.set('temperature_unit', 'celsius');

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Forecast API returned ${response.status}`);
  }

  const payload = await response.json();
  return normalizeDailyForecast(payload);
}

function createForecastUrl(latitude, longitude, timezone) {
  const url = new URL(API_ENDPOINTS.forecast);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));

  if (getTrimmedString(timezone)) {
    url.searchParams.set('timezone', getTrimmedString(timezone));
  }

  return url;
}

function normalizeDailyForecast(payload) {
  const daily = payload?.daily;
  const times = Array.isArray(daily?.time) ? daily.time : [];

  return times.slice(0, DAILY_FORECAST_DAYS).map((time, index) => ({
    date: getTrimmedString(time),
    weatherCode: toFiniteNumber(daily.weather_code?.[index]),
    high: toFiniteNumber(daily.temperature_2m_max?.[index]),
    low: toFiniteNumber(daily.temperature_2m_min?.[index]),
  }));
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}
