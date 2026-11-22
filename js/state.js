/**
 * Independent application state.
 *
 * HOME weather and SELECTED WEATHER are deliberately separate slices:
 * searching for a city can only ever write selectedCity / selectedCityWeather.
 * The Lagos home location and its weather are never overwritten by a search.
 */

export const SCREENS = Object.freeze({
  HOME: 'home',
  SEARCH: 'search',
  SELECTED_WEATHER: 'selected-weather',
});

export const HOME_LOCATION = Object.freeze({
  id: null,
  name: 'Lagos',
  region: 'Lagos',
  country: 'Nigeria',
  latitude: 6.5244,
  longitude: 3.3792,
  timezone: 'Africa/Lagos',
});

const state = {
  homeLocation: HOME_LOCATION,
  homeWeather: null,
  selectedCity: null,
  selectedCityWeather: null,
  activeScreen: SCREENS.HOME,
};

/** @returns {object} A copy of the fixed Lagos home location. */
export function getHomeLocation() {
  return { ...state.homeLocation };
}

/** @returns {object|null} A copy of the Lagos weather, or null before it loads. */
export function getHomeWeather() {
  return copyWeather(state.homeWeather);
}

/**
 * Store weather belonging only to the home location.
 *
 * @param {object} weather Normalized current weather and daily forecast.
 * @returns {object|null} A copy of the stored home weather.
 */
export function setHomeWeather(weather) {
  state.homeWeather = normalizeWeather(weather);
  return getHomeWeather();
}

/**
 * Store the city selected from search results.
 *
 * @param {object} city Normalized geocoding result.
 * @returns {object|null} A copy of the stored city.
 */
export function setSelectedCity(city) {
  if (!city || typeof city !== 'object') {
    return null;
  }

  state.selectedCity = Object.freeze({
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

/** @returns {object|null} A copy of the searched city, or null before selection. */
export function getSelectedCity() {
  return state.selectedCity ? { ...state.selectedCity } : null;
}

/** @returns {object|null} A copy of the searched city's weather. */
export function getSelectedCityWeather() {
  return copyWeather(state.selectedCityWeather);
}

/**
 * Store weather belonging only to the searched city.
 *
 * @param {object} weather Normalized current weather and daily forecast.
 * @returns {object|null} A copy of the stored selected-city weather.
 */
export function setSelectedCityWeather(weather) {
  state.selectedCityWeather = normalizeWeather(weather);
  return getSelectedCityWeather();
}

/** @returns {string} The active screen: home, search or selected-weather. */
export function getActiveScreen() {
  return state.activeScreen;
}

/**
 * Set the active screen.
 *
 * @param {string} screen One of SCREENS.
 * @returns {string} The active screen.
 */
export function setActiveScreen(screen) {
  if (Object.values(SCREENS).includes(screen)) {
    state.activeScreen = screen;
  }
  return state.activeScreen;
}

function normalizeWeather(weather) {
  if (!weather || typeof weather !== 'object') {
    return null;
  }

  return {
    current: weather.current && typeof weather.current === 'object'
      ? { ...weather.current, units: { ...(weather.current.units || {}) } }
      : null,
    forecast: Array.isArray(weather.forecast)
      ? weather.forecast.map((day) => ({ ...day }))
      : null,
    error: Boolean(weather.error),
  };
}

function copyWeather(weather) {
  if (!weather) {
    return null;
  }

  return {
    current: weather.current
      ? { ...weather.current, units: { ...(weather.current.units || {}) } }
      : null,
    forecast: Array.isArray(weather.forecast)
      ? weather.forecast.map((day) => ({ ...day }))
      : null,
    error: weather.error,
  };
}
