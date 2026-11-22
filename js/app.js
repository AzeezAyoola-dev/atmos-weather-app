/**
 * Atmos application entry point.
 *
 * Phase 5: view switching and city search.
 * Phase 6: load and render current weather for the selected city.
 * Phase 7: load and render the five-day forecast for the selected city.
 * Phase 8: recent-search chips are rendered and reused for direct selection.
 * State fix: home weather (Lagos) and searched-city weather are independent
 * state slices. Each screen renders only from its own slice.
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
  getSelectedCity,
  setSelectedCity,
  getSelectedCityWeather,
  setSelectedCityWeather,
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
  status: appStatus,
  onCitySelected: handleCitySelection,
});

let switchingView = false;
let homeRequestController = null;
let selectedRequestController = null;
let selectedRequestId = 0;
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
    showWeatherError(location);
  }

  if (weather.forecast) {
    renderDailyForecast(weather.forecast);
  } else {
    showForecastError();
  }
}

function renderSelectedWeather() {
  const weather = getSelectedCityWeather();
  const city = getSelectedCity();

  if (!weather || !city) {
    showWeatherLoading(city || getHomeLocation());
    showForecastLoading();
    return;
  }

  if (weather.current) {
    renderCurrentWeather(city, weather.current);
  } else {
    showWeatherError(city);
  }

  if (weather.forecast) {
    renderDailyForecast(weather.forecast);
  } else {
    showForecastError();
  }
}

async function loadHomeWeather() {
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
    error: currentResult.status === 'rejected' || forecastResult.status === 'rejected',
  });

  if (getActiveScreen() === SCREENS.HOME) {
    renderHomeWeather();
  }
}

async function loadSelectedWeather(city) {
  if (selectedRequestController) {
    selectedRequestController.abort();
  }

  const controller = new AbortController();
  selectedRequestController = controller;
  const requestId = ++selectedRequestId;
  const cityLabel = [city?.name, city?.country].filter(Boolean).join(', ');

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
    error: currentResult.status === 'rejected' || forecastResult.status === 'rejected',
  });

  if (selectedRequestController === controller) {
    selectedRequestController = null;
  }

  if (
    getActiveScreen() === SCREENS.SELECTED_WEATHER
    && getSelectedCity()?.name === city.name
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

loadHomeWeather();
document.documentElement.dataset.atmosReady = 'true';
