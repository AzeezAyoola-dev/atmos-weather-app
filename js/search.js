/**
 * City search layer.
 *
 * Phase 5: input validation, debounced geocoding, result rendering, feedback
 * states and city selection.
 * Phase 8: recent-city rendering, persistence and direct re-selection.
 * Navigation fix: capture and restore the search view so the result-screen
 * back arrow can return to the exact query and results the user left behind.
 * Phase 9: explicit loading, empty, invalid and error states with retry and a
 * helpful empty state for recent searches.
 */

import { fetchCityResults } from './api.js';
import { setSelectedCity } from './state.js';
import { loadRecentCities, saveRecentCity } from './storage.js';

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 350;

const DEFAULT_HINT = 'Start typing to find a city';
const SHORT_HINT = 'Enter at least two characters to search';
const LOADING_HINT = 'Searching cities…';
const NO_RESULTS_HINT = 'No matching cities found. Try another spelling or a nearby city.';
const ERROR_HINT = 'We couldn’t load results. Check your connection and try again.';
const RECENT_EMPTY_MESSAGE = 'No recent searches yet. Search for a city to see it here.';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build a readable secondary line: "Region · Country" when a region exists.
 * A region that simply repeats the city or country is omitted.
 *
 * @param {object} city Normalized geocoding result.
 * @returns {string} Text for the result's secondary line.
 */
export function formatCityLabel(city) {
  const region = isDistinct(city.region, city.name) && isDistinct(city.region, city.country)
    ? city.region
    : '';
  return [region, city.country].filter(Boolean).join(' · ');
}

/**
 * Create the controller for the Search Locations screen.
 *
 * @param {object} elements Existing DOM elements from index.html.
 * @param {HTMLElement} [elements.recentList] Container for recent-city chips.
 * @param {HTMLElement} [elements.recentEmpty] Empty state for recent searches.
 * @param {HTMLButtonElement} [elements.retryButton] Retry action for failed searches.
 * @param {Function} [elements.onCitySelected] Called after a result is selected.
 * @returns {{runQuery: Function, reset: Function, clear: Function, retry: Function, captureState: Function, restoreState: Function}} Controller API.
 */
export function createCitySearchController({
  form,
  input,
  clearButton,
  hint,
  results,
  list,
  recentList,
  recentEmpty,
  retryButton,
  status,
  onCitySelected,
}) {
  let debounceTimer = null;
  let activeController = null;
  let requestId = 0;
  let lastRenderedCities = [];

  function setHint(message, state = 'idle') {
    hint.textContent = message;
    hint.dataset.state = state;
    hint.hidden = false;
  }

  function setBusy(isBusy) {
    if (isBusy) {
      form.setAttribute('aria-busy', 'true');
    } else {
      form.removeAttribute('aria-busy');
    }
  }

  function setRetryVisible(isVisible) {
    if (retryButton) {
      retryButton.hidden = !isVisible;
    }
  }

  function announce(message) {
    if (!status) {
      return;
    }

    status.textContent = '';
    requestAnimationFrame(() => {
      status.textContent = message;
    });
  }

  function cancelPendingWork() {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
    requestId += 1;

    if (activeController) {
      activeController.abort();
      activeController = null;
    }

    setBusy(false);
  }

  function clearResults() {
    lastRenderedCities = [];
    list.replaceChildren();
    results.hidden = true;
  }

  function reset(message = DEFAULT_HINT, state = 'idle') {
    cancelPendingWork();
    clearResults();
    setRetryVisible(false);
    setHint(message, state);
  }

  function handleInput() {
    clearButton.hidden = input.value.length === 0;

    const query = input.value.trim();
    cancelPendingWork();
    clearResults();
    setRetryVisible(false);

    if (query.length < SEARCH_MIN_QUERY_LENGTH) {
      setHint(query.length === 0 ? DEFAULT_HINT : SHORT_HINT);
      return;
    }

    const currentRequestId = requestId;
    setHint(LOADING_HINT, 'loading');
    setBusy(true);

    debounceTimer = window.setTimeout(async () => {
      const controller = new AbortController();
      activeController = controller;

      try {
        const cities = await fetchCityResults(query, { signal: controller.signal });

        if (controller.signal.aborted || currentRequestId !== requestId) {
          return;
        }

        if (cities.length === 0) {
          setRetryVisible(false);
          setHint(NO_RESULTS_HINT, 'empty');
          announce(NO_RESULTS_HINT);
          return;
        }

        renderResults(cities);
        announce(`${cities.length} ${cities.length === 1 ? 'city' : 'cities'} found.`);
      } catch (error) {
        if (controller.signal.aborted || currentRequestId !== requestId) {
          return;
        }

        setRetryVisible(true);
        setHint(ERROR_HINT, 'error');
        announce(ERROR_HINT);
      } finally {
        if (activeController === controller) {
          activeController = null;
          setBusy(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  function renderResults(cities) {
    lastRenderedCities = cities.slice();
    const rows = cities.map(createResultRow);
    list.replaceChildren(...rows);
    results.hidden = false;
    hint.hidden = true;
    setRetryVisible(false);
    setBusy(false);
  }

  function renderRecentCities() {
    if (!recentList) {
      return;
    }

    const cities = loadRecentCities();
    recentList.replaceChildren(...cities.map(createRecentChip));

    if (recentEmpty) {
      recentEmpty.textContent = RECENT_EMPTY_MESSAGE;
      recentEmpty.hidden = cities.length > 0;
    }
  }

  function createRecentChip(city) {
    const item = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'chip';
    button.textContent = city.name;
    button.setAttribute('aria-label', `Select recent city ${city.name}, ${city.country}`);
    button.addEventListener('click', () => selectCity(city, null));

    item.append(button);
    return item;
  }

  function createResultRow(city) {
    const item = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'result-row';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Select ${city.name}, ${formatCityLabel(city)}`);
    button.append(createIcon('icon-pin', 'result-row__icon'));

    const text = document.createElement('span');
    text.className = 'result-row__text';

    const cityName = document.createElement('span');
    cityName.className = 'result-row__city';
    cityName.textContent = city.name;

    const country = document.createElement('span');
    country.className = 'result-row__country';
    country.textContent = formatCityLabel(city);

    text.append(cityName, country);
    button.append(text, createIcon('icon-chevron-right', 'result-row__chevron'));
    button.addEventListener('click', () => selectCity(city, button));

    item.append(button);
    return item;
  }

  function selectCity(city, selectedButton) {
    const selectedCity = setSelectedCity(city);
    if (!selectedCity) {
      return;
    }

    saveRecentCity(selectedCity);
    renderRecentCities();

    list.querySelectorAll('.result-row').forEach((row) => {
      row.setAttribute('aria-pressed', row === selectedButton ? 'true' : 'false');
    });

    input.value = selectedCity.name;
    clearButton.hidden = false;
    announce(`${selectedCity.name}, ${formatCityLabel(selectedCity)} selected.`);

    if (typeof onCitySelected === 'function') {
      onCitySelected(selectedCity);
    }
  }

  function runQuery(query) {
    input.value = query;
    clearButton.hidden = query.length === 0;
    handleInput();
  }

  function clear() {
    input.value = '';
    clearButton.hidden = true;
    reset();
    input.focus();
  }

  function retry() {
    if (input.value.trim().length < SEARCH_MIN_QUERY_LENGTH) {
      return;
    }
    handleInput();
  }

  function captureState() {
    const rows = Array.from(list.querySelectorAll('.result-row'));
    return {
      query: input.value,
      clearHidden: clearButton.hidden,
      hintText: hint.textContent,
      hintState: hint.dataset.state || 'idle',
      hintHidden: hint.hidden,
      retryHidden: retryButton ? retryButton.hidden : true,
      resultsHidden: results.hidden,
      cities: lastRenderedCities.slice(),
      pressedIndex: rows.findIndex((row) => row.getAttribute('aria-pressed') === 'true'),
    };
  }

  function restoreState(state) {
    if (!state) {
      return;
    }

    cancelPendingWork();
    input.value = state.query;
    clearButton.hidden = state.clearHidden;
    hint.textContent = state.hintText;
    hint.dataset.state = state.hintState;
    hint.hidden = state.hintHidden;
    setRetryVisible(state.retryHidden === false);

    if (state.cities.length === 0) {
      clearResults();
      results.hidden = state.resultsHidden;
      return;
    }

    const rows = state.cities.map((city) => createResultRow(city));
    if (state.pressedIndex >= 0 && rows[state.pressedIndex]) {
      rows[state.pressedIndex].querySelector('.result-row').setAttribute('aria-pressed', 'true');
    }
    list.replaceChildren(...rows);
    results.hidden = false;
    setBusy(false);
  }

  input.addEventListener('input', handleInput);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleInput();
  });
  clearButton.addEventListener('click', clear);
  if (retryButton) {
    retryButton.addEventListener('click', retry);
  }

  renderRecentCities();

  return Object.freeze({ runQuery, reset, clear, retry, captureState, restoreState });
}

function createIcon(symbolId, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const use = document.createElementNS(SVG_NS, 'use');

  svg.setAttribute('class', `icon ${className}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  use.setAttribute('href', `#${symbolId}`);
  svg.append(use);

  return svg;
}

function isDistinct(value, other) {
  return Boolean(value) && String(value).toLowerCase() !== String(other).toLowerCase();
}
