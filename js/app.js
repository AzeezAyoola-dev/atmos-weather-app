/**
 * Atmos application entry point.
 *
 * Phase 5: view switching and city search.
 * Phase 6: load and render current weather for the selected city.
 * Phase 7: load and render the five-day forecast for the selected city.
 * Phase 8: recent-search chips are rendered and reused for direct selection.
 * State fix: home weather (Lagos) and searched-city weather are independent
 * state slices. Each screen renders only from its own slice.
 * Phase 9: loading, empty, error and not-found states with retry actions that
 * never overwrite the Lagos home state or the selected city.
 */

import { fetchCurrentWeather, fetchDailyForecast } from './api.js';
import {
  renderCurrentWeather,
  renderDailyForecast,
  showForecastError,
  showForecastLoading,
  showWeatherError,
  showWeatherLoading,
} from './weather.js';
import './storage.js';
import { createCitySearchController } from './search.js';
import {
  SCREENS,
  getHomeLocation,
  getHomeWeather,
  setHomeWeather,
  updateHomeWeather,
  getSelectedCity,
  setSelectedCity,
  getSelectedCityWeather,
  setSelectedCityWeather,
  updateSelectedCityWeather,
  getActiveScreen,
  setActiveScreen,
} from './state.js';

const dashboardView = document.getElementById('dashboard-view');
const searchView = document.getElementById('search-view');
const dashboardForm = dashboardView.querySelector('.search-form');
const dashboardInput = document.getElementById('dashboard-city-search');
const dashboardBackButton = document.getElementById('dashboard-back-button');
const backButton = searchView.querySelector('.icon-button');
const citySearch = document.getElementById('city-search');
const clearButton = searchView.querySelector('.search-clear');
const searchHint = document.getElementById('search-hint');
const recentList = document.getElementById('recent-list');
const recentEmpty = document.getElementById('recent-empty');
const searchRetryButton = document.getElementById('search-retry-button');
const weatherRetryButton = document.getElementById('weather-retry-button');
const forecastRetryButton = document.getElementById('forecast-retry-button');
const searchResults = document.getElementById('search-results');
const resultList = searchResults.querySelector('.result-list');
const appStatus = document.getElementById('app-status');

const searchController = createCitySearchController({
  form: searchView.querySelector('.search-form'),
  input: citySearch,
  clearButton,
  hint: searchHint,
  results: searchResults,
  list: resultList,
  recentList,
  recentEmpty,
  retryButton: searchRetryButton,
  status: appStatus,
  onCitySelected: handleCitySelection,
});

let switchingView = false;
let homeRequestController = null;
let selectedRequestController = null;
let forecastRequestController = null;
let selectedRequestId = 0;
let forecastRequestId = 0;
let capturedSearchState = null;

/**
 * The only place that changes screens. The weather card is shared markup, so
 * it is re-rendered from the state slice belonging to the screen being shown.
 *
 * @param {string} nextScreen One of SCREENS.
 */
function setActiveView(nextScreen) {
  switchingView = true;
  setActiveScreen(nextScreen);

  const showSearch = nextScreen === SCREENS.SEARCH;
  searchView.hidden = !showSearch;
  dashboardView.hidden = showSearch;
  dashboardBackButton.hidden = nextScreen !== SCREENS.SELECTED_WEATHER;

  if (!showSearch) {
    if (nextScreen === SCREENS.HOME) {
      renderHomeWeather();
    } else {
      renderSelectedWeather();
    }
  }

  if (showSearch) {
    citySearch.focus();
  } else {
    dashboardInput.focus();
  }

  switchingView = false;
}

function renderHomeWeather() {
  const weather = getHomeWeather();
  const location = getHomeLocation();

  if (!weather) {
    showWeatherLoading(location);
    showForecastLoading();
    return;
  }

  if (weather.current) {
    renderCurrentWeather(location, weather.current);
  } else {
    showWeatherError(
      location,
      'We couldn’t load Lagos weather.',
      'Your home location is still Lagos. Try again.',
    );
  }

  if (weather.forecast) {
    renderDailyForecast(weather.forecast);
  } else {
    showForecastError('We couldn’t load the Lagos five-day forecast.');
  }
}

function renderSelectedWeather() {
  const weather = getSelectedCityWeather();
  const city = getSelectedCity();

  if (!weather || !city) {
    showWeatherLoading(city || { name: 'Selected city', country: '' });
    showForecastLoading();
    return;
  }

  const label = [city.name, city.country].filter(Boolean).join(', ');

  if (weather.current) {
    renderCurrentWeather(city, weather.current);
  } else {
    showWeatherError(
      city,
      `We couldn’t load weather for ${label}.`,
      `${city.name} is still selected. Try again.`,
    );
  }

  if (weather.forecast) {
    renderDailyForecast(weather.forecast);
  } else {
    showForecastError(`We couldn’t load the five-day forecast for ${city.name}.`);
  }
}

async function loadHomeWeather() {
  if (homeRequestController) {
    homeRequestController.abort();
  }

  const controller = new AbortController();
  homeRequestController = controller;
  const location = getHomeLocation();

  if (getActiveScreen() === SCREENS.HOME) {
    showWeatherLoading(location);
    showForecastLoading();
  }

  const [currentResult, forecastResult] = await Promise.allSettled([
    fetchCurrentWeather(location, { signal: controller.signal }),
    fetchDailyForecast(location, { signal: controller.signal }),
  ]);

  if (controller.signal.aborted) {
    return;
  }

  // This writes only homeWeather. A search can never overwrite it.
  setHomeWeather({
    current: currentResult.status === 'fulfilled' ? currentResult.value : null,
    forecast: forecastResult.status === 'fulfilled' ? forecastResult.value : null,
    currentError: currentResult.status === 'rejected',
    forecastError: forecastResult.status === 'rejected',
  });

  if (homeRequestController === controller) {
    homeRequestController = null;
  }

  if (getActiveScreen() === SCREENS.HOME) {
    renderHomeWeather();

    const currentOk = currentResult.status === 'fulfilled';
    const forecastOk = forecastResult.status === 'fulfilled';
    announce(
      currentOk && forecastOk
        ? 'Lagos weather and five-day forecast loaded.'
        : currentOk
          ? 'Lagos weather loaded. Five-day forecast unavailable.'
          : forecastOk
            ? 'Lagos five-day forecast loaded. Current weather unavailable.'
            : 'Lagos weather could not be loaded. Please try again.',
    );
  }
}

async function loadSelectedWeather(city) {
  if (!city) {
    return;
  }

  if (selectedRequestController) {
    selectedRequestController.abort();
  }
  if (forecastRequestController) {
    forecastRequestController.abort();
  }

  const controller = new AbortController();
  selectedRequestController = controller;
  const requestId = ++selectedRequestId;
  const cityLabel = [city.name, city.country].filter(Boolean).join(', ');

  showWeatherLoading(city);
  showForecastLoading();
  announce(`Loading current weather and five-day forecast for ${cityLabel}.`);

  const [currentResult, forecastResult] = await Promise.allSettled([
    fetchCurrentWeather(city, { signal: controller.signal }),
    fetchDailyForecast(city, { signal: controller.signal }),
  ]);

  if (controller.signal.aborted || requestId !== selectedRequestId) {
    return;
  }

  // This writes only selectedCityWeather. Home weather is left untouched.
  setSelectedCityWeather({
    current: currentResult.status === 'fulfilled' ? currentResult.value : null,
    forecast: forecastResult.status === 'fulfilled' ? forecastResult.value : null,
    currentError: currentResult.status === 'rejected',
    forecastError: forecastResult.status === 'rejected',
  });

  if (selectedRequestController === controller) {
    selectedRequestController = null;
  }

  if (
    getActiveScreen() === SCREENS.SELECTED_WEATHER
    && sameCity(getSelectedCity(), city)
  ) {
    renderSelectedWeather();
  }

  const currentOk = currentResult.status === 'fulfilled';
  const forecastOk = forecastResult.status === 'fulfilled';

  if (currentOk && forecastOk) {
    announce(`Current weather and five-day forecast loaded for ${cityLabel}.`);
  } else if (currentOk) {
    announce(`Current weather loaded for ${cityLabel}. Five-day forecast unavailable.`);
  } else if (forecastOk) {
    announce(`Five-day forecast loaded for ${cityLabel}. Current weather unavailable.`);
  } else {
    announce(`Weather data could not be loaded for ${cityLabel}. Please try again.`);
  }
}

/**
 * Retry only the five-day forecast so valid current weather stays visible.
 */
async function retryForecast() {
  const screen = getActiveScreen();
  const location = screen === SCREENS.HOME
    ? getHomeLocation()
    : screen === SCREENS.SELECTED_WEATHER
      ? getSelectedCity()
      : null;

  if (!location) {
    return;
  }

  if (forecastRequestController) {
    forecastRequestController.abort();
  }

  const controller = new AbortController();
  forecastRequestController = controller;
  const requestId = ++forecastRequestId;

  showForecastLoading();
  announce(`Loading five-day forecast for ${location.name}.`);

  const result = await fetchDailyForecast(location, { signal: controller.signal }).then(
    (value) => ({ status: 'fulfilled', value }),
    (reason) => ({ status: 'rejected', reason }),
  );

  if (
    controller.signal.aborted
    || requestId !== forecastRequestId
    || getActiveScreen() !== screen
    || (screen === SCREENS.SELECTED_WEATHER && !sameCity(getSelectedCity(), location))
  ) {
    return;
  }

  const forecast = result.status === 'fulfilled' ? result.value : null;
  const failed = result.status === 'rejected';

  if (screen === SCREENS.HOME) {
    updateHomeWeather({ forecast, forecastError: failed });
    renderForecastFromState(getHomeWeather(), true);
  } else {
    updateSelectedCityWeather({ forecast, forecastError: failed });
    renderForecastFromState(getSelectedCityWeather(), false);
  }

  if (forecastRequestController === controller) {
    forecastRequestController = null;
  }

  announce(
    failed
      ? `Five-day forecast unavailable for ${location.name}. Please try again.`
      : `Five-day forecast loaded for ${location.name}.`,
  );
}

function renderForecastFromState(weather, isHome) {
  if (!weather) {
    showForecastLoading();
    return;
  }

  if (weather.forecast) {
    renderDailyForecast(weather.forecast);
  } else {
    showForecastError(
      isHome
        ? 'We couldn’t load the Lagos five-day forecast.'
        : `We couldn’t load the five-day forecast for ${getSelectedCity()?.name || 'this city'}.`,
    );
  }
}

function retryWeather() {
  if (getActiveScreen() === SCREENS.HOME) {
    loadHomeWeather();
    return;
  }

  if (getActiveScreen() === SCREENS.SELECTED_WEATHER) {
    loadSelectedWeather(getSelectedCity());
  }
}

function sameCity(first, second) {
  if (!first || !second) {
    return false;
  }

  const idMatch = first.id !== null && first.id !== undefined
    && second.id !== null && second.id !== undefined
    && String(first.id) === String(second.id);
  const coordinatesMatch = Math.abs(Number(first.latitude) - Number(second.latitude)) < 0.000001
    && Math.abs(Number(first.longitude) - Number(second.longitude)) < 0.000001;

  return idMatch || (
    first.name === second.name
    && first.country === second.country
    && coordinatesMatch
  );
}

function announce(message) {
  appStatus.textContent = '';
  setTimeout(() => {
    appStatus.textContent = message;
  }, 0);
}

function openSearchView(query = '') {
  searchController.runQuery(query);
  setActiveView(SCREENS.SEARCH);
}

function goHome() {
  searchController.reset();
  citySearch.value = '';
  clearButton.hidden = true;
  capturedSearchState = null;
  setActiveView(SCREENS.HOME);
}

function backToSearch() {
  searchController.restoreState(capturedSearchState);
  setActiveView(SCREENS.SEARCH);
}

function handleCitySelection(city) {
  capturedSearchState = searchController.captureState();
  searchController.reset();
  citySearch.value = '';
  clearButton.hidden = true;

  setSelectedCity(city);
  setSelectedCityWeather(null);
  setActiveView(SCREENS.SELECTED_WEATHER);
  loadSelectedWeather(city);
}

dashboardInput.addEventListener('focus', () => {
  if (!switchingView) {
    openSearchView(dashboardInput.value);
  }
});

dashboardForm.addEventListener('submit', (event) => {
  event.preventDefault();
  openSearchView(dashboardInput.value);
});

backButton.addEventListener('click', goHome);
dashboardBackButton.addEventListener('click', backToSearch);

if (weatherRetryButton) {
  weatherRetryButton.addEventListener('click', retryWeather);
}
if (forecastRetryButton) {
  forecastRetryButton.addEventListener('click', retryForecast);
}

loadHomeWeather();
document.documentElement.dataset.atmosReady = 'true';
