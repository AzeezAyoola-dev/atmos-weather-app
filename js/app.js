/**
 * Atmos application entry point.
 *
 * Phase 5: view switching and city search.
 * Phase 6: load and render current weather for the selected city.
 * Phase 7: load and render the five-day forecast for the selected city.
 * Phase 8: recent-search chips are rendered and reused for direct selection.
 * Navigation fix: one explicit three-state controller — HOME, SEARCH PAGE and
 * SELECTED WEATHER — so each arrow has exactly one destination.
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

const NAV_STATE = Object.freeze({
  HOME: 'home',
  SEARCH: 'search',
  SELECTED_WEATHER: 'selected-weather',
});

let navState = NAV_STATE.HOME;
let switchingView = false;
let weatherController = null;
let weatherRequestId = 0;
let capturedSearchState = null;

/**
 * The single place that changes screens. SELECTED WEATHER is a distinct state
 * from HOME: the result back arrow is shown only in that state, and its sole
 * destination is the Search Page.
 *
 * @param {string} nextState One of NAV_STATE.
 */
function setNavState(nextState) {
  switchingView = true;

  const showSearch = nextState === NAV_STATE.SEARCH;
  searchView.hidden = !showSearch;
  dashboardView.hidden = showSearch;
  dashboardBackButton.hidden = nextState !== NAV_STATE.SELECTED_WEATHER;

  if (showSearch) {
    citySearch.focus();
  } else {
    dashboardInput.focus();
  }

  navState = nextState;
  switchingView = false;
}

function openSearchView(query = '') {
  searchController.runQuery(query);
  setNavState(NAV_STATE.SEARCH);
}

function goHome() {
  searchController.reset();
  citySearch.value = '';
  clearButton.hidden = true;
  capturedSearchState = null;
  setNavState(NAV_STATE.HOME);
}

function backToSearch() {
  searchController.restoreState(capturedSearchState);
  setNavState(NAV_STATE.SEARCH);
}

function handleCitySelection(city) {
  capturedSearchState = searchController.captureState();
  searchController.reset();
  citySearch.value = '';
  clearButton.hidden = true;
  setNavState(NAV_STATE.SELECTED_WEATHER);
  loadWeather(city);
}

async function loadWeather(city) {
  if (weatherController) {
    weatherController.abort();
  }

  const requestId = ++weatherRequestId;
  const controller = new AbortController();
  weatherController = controller;
  const cityLabel = [city?.name, city?.country].filter(Boolean).join(', ');

  showWeatherLoading(city);
  showForecastLoading();
  announce(`Loading current weather and five-day forecast for ${cityLabel}.`);

  const [currentResult, forecastResult] = await Promise.allSettled([
    fetchCurrentWeather(city, { signal: controller.signal }),
    fetchDailyForecast(city, { signal: controller.signal }),
  ]);

  if (controller.signal.aborted || requestId !== weatherRequestId) {
    return;
  }

  const currentOk = currentResult.status === 'fulfilled';
  const forecastOk = forecastResult.status === 'fulfilled';

  if (currentOk) {
    renderCurrentWeather(city, currentResult.value);
  } else {
    showWeatherError(city);
  }

  if (forecastOk) {
    renderDailyForecast(forecastResult.value);
  } else {
    showForecastError();
  }

  if (currentOk && forecastOk) {
    announce(`Current weather and five-day forecast loaded for ${cityLabel}.`);
  } else if (currentOk) {
    announce(`Current weather loaded for ${cityLabel}. Five-day forecast unavailable.`);
  } else if (forecastOk) {
    announce(`Five-day forecast loaded for ${cityLabel}. Current weather unavailable.`);
  } else {
    announce(`Weather data could not be loaded for ${cityLabel}. Please try again.`);
  }

  if (weatherController === controller) {
    weatherController = null;
  }
}

function announce(message) {
  appStatus.textContent = '';
  setTimeout(() => {
    appStatus.textContent = message;
  }, 0);
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

document.documentElement.dataset.atmosReady = 'true';
