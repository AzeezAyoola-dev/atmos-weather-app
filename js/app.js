/**
 * Atmos application entry point.
 *
 * Phase 5: boot the module graph, switch between the dashboard and search
 * screens, and run the city search controller. Weather rendering and recent
 * search persistence remain reserved for later phases.
 */

import './api.js';
import './weather.js';
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
});

let switchingView = false;

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
