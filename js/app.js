/**
 * Atmos application entry point.
 *
 * Phase 5: view switching and city search.
 * Phase 6: load and render current weather for the selected city.
 * Recent search persistence remains reserved for a later phase.
 */

import { fetchCurrentWeather } from './api.js';
import { renderCurrentWeather, showWeatherError, showWeatherLoading } from './weather.js';
import './storage.js';
import { createCitySearchController } from './search.js';

const dashboardView = document.getElementById('dashboard-view');
const searchView = document.getElementById('search-view');
const dashboardForm = dashboardView.querySelector('.search-form');
const dashboardInput = document.getElementById('dashboard-city-search');
const backButton = searchView.querySelector('.icon-button');
const citySearch = document.getElementById('city-search');
const clearButton = searchView.querySelector('.search-clear');
const searchHint = document.getElementById('search-hint');
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
  status: appStatus,
  onCitySelected: handleCitySelection,
});

let switchingView = false;
let weatherController = null;
let weatherRequestId = 0;

function openSearchView(query = '') {
  switchingView = true;
  dashboardView.hidden = true;
  searchView.hidden = false;
  searchController.runQuery(query);
  citySearch.focus();
  switchingView = false;
}

function openDashboardView() {
  switchingView = true;
  searchController.reset();
  citySearch.value = '';
  clearButton.hidden = true;
  searchView.hidden = true;
  dashboardView.hidden = false;
  dashboardInput.focus();
  switchingView = false;
}

function handleCitySelection(city) {
  openDashboardView();
  loadCurrentWeather(city);
}

async function loadCurrentWeather(city) {
  if (weatherController) {
    weatherController.abort();
  }

  const requestId = ++weatherRequestId;
  const controller = new AbortController();
  weatherController = controller;
  const cityLabel = [city?.name, city?.country].filter(Boolean).join(', ');

  showWeatherLoading(city);
  announce(`Loading current weather for ${cityLabel}.`);

  try {
    const weather = await fetchCurrentWeather(city, { signal: controller.signal });

    if (controller.signal.aborted || requestId !== weatherRequestId) {
      return;
    }

    renderCurrentWeather(city, weather);
    announce(`Current weather loaded for ${cityLabel}.`);
  } catch (error) {
    if (controller.signal.aborted || requestId !== weatherRequestId) {
      return;
    }

    showWeatherError(city);
    announce(`Weather data could not be loaded for ${cityLabel}. Please try again.`);
  } finally {
    if (weatherController === controller) {
      weatherController = null;
    }
  }
}

function announce(message) {
  appStatus.textContent = '';
  requestAnimationFrame(() => {
    appStatus.textContent = message;
  });
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

backButton.addEventListener('click', openDashboardView);

document.documentElement.dataset.atmosReady = 'true';
