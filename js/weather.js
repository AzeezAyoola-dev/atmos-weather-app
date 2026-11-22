/**
 * Weather presentation layer.
 *
 * Phase 1: forecast configuration.
 * Phase 6: WMO code mapping, local-time formatting and current-weather
 * dashboard rendering.
 * Phase 7: daily forecast rendering in the existing five rows.
 * Forecast icon fix: each WMO code has a distinct condition icon, and both the
 * icon and description are derived from the same per-day code.
 */

export const FORECAST_DAYS = 5;

const WEATHER_CONDITIONS = new Map([
  [0, { description: 'Clear sky', icon: 'icon-sun' }],
  [1, { description: 'Mainly clear', icon: 'icon-sun-cloud' }],
  [2, { description: 'Partly cloudy', icon: 'icon-partly-cloudy' }],
  [3, { description: 'Overcast', icon: 'icon-cloud' }],
  [45, { description: 'Fog', icon: 'icon-fog' }],
  [48, { description: 'Depositing rime fog', icon: 'icon-fog' }],
  [51, { description: 'Light drizzle', icon: 'icon-drizzle' }],
  [53, { description: 'Moderate drizzle', icon: 'icon-drizzle' }],
  [55, { description: 'Dense drizzle', icon: 'icon-drizzle' }],
  [56, { description: 'Light freezing drizzle', icon: 'icon-freezing-drizzle' }],
  [57, { description: 'Dense freezing drizzle', icon: 'icon-freezing-drizzle' }],
  [61, { description: 'Slight rain', icon: 'icon-rain' }],
  [63, { description: 'Moderate rain', icon: 'icon-rain' }],
  [65, { description: 'Heavy rain', icon: 'icon-rain' }],
  [66, { description: 'Light freezing rain', icon: 'icon-freezing-rain' }],
  [67, { description: 'Heavy freezing rain', icon: 'icon-freezing-rain' }],
  [71, { description: 'Slight snow fall', icon: 'icon-snow' }],
  [73, { description: 'Moderate snow fall', icon: 'icon-snow' }],
  [75, { description: 'Heavy snow fall', icon: 'icon-snow' }],
  [77, { description: 'Snow grains', icon: 'icon-snow' }],
  [80, { description: 'Slight rain showers', icon: 'icon-showers' }],
  [81, { description: 'Moderate rain showers', icon: 'icon-showers' }],
  [82, { description: 'Violent rain showers', icon: 'icon-showers' }],
  [85, { description: 'Slight snow showers', icon: 'icon-snow-showers' }],
  [86, { description: 'Heavy snow showers', icon: 'icon-snow-showers' }],
  [95, { description: 'Thunderstorm', icon: 'icon-thunderstorm' }],
  [96, { description: 'Thunderstorm with slight hail', icon: 'icon-hail' }],
  [99, { description: 'Thunderstorm with heavy hail', icon: 'icon-hail' }],
]);

const UNKNOWN_CONDITION = Object.freeze({ description: 'Unknown conditions', icon: 'icon-cloud' });

const LOCAL_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const FORECAST_WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'long',
});

/**
 * Map a WMO weather code to a description and an existing sprite icon.
 *
 * @param {number|null} code WMO code from the API.
 * @returns {{description: string, icon: string}} Presentation data.
 */
export function getWeatherCondition(code) {
  if (code === null || code === undefined || code === '') {
    return UNKNOWN_CONDITION;
  }

  const normalized = Number(code);
  if (!Number.isFinite(normalized)) {
    return UNKNOWN_CONDITION;
  }

  return WEATHER_CONDITIONS.get(normalized) || UNKNOWN_CONDITION;
}

/**
 * Format an API local ISO time string without shifting it to the browser's
 * timezone. The API time components are treated as wall-clock values.
 *
 * @param {string} time Example: "2026-11-21T23:00".
 * @returns {string} Example: "Saturday, 21 November · 23:00".
 */
export function formatLocalDateTime(time) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(time || ''));
  if (!match) {
    return 'Local time unavailable';
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = Object.fromEntries(
    LOCAL_DATE_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return `${parts.weekday}, ${parts.day} ${parts.month} · ${parts.hour}:${parts.minute}`;
}

/**
 * Derive a weekday label from an API local date string without applying the
 * browser's timezone.
 *
 * @param {string} date Example: "2026-11-21".
 * @returns {string} Example: "Saturday", or an empty string when invalid.
 */
export function formatForecastWeekday(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  if (!match) {
    return '';
  }

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return '';
  }

  return FORECAST_WEEKDAY_FORMAT.format(parsed);
}

/**
 * Show an in-place loading state on the existing dashboard components.
 *
 * @param {object} city Selected city from shared state.
 */
export function showWeatherLoading(city) {
  const elements = getDashboardElements();
  setCityHeading(elements, city);

  elements.card.setAttribute('aria-busy', 'true');
  elements.eyebrow.textContent = 'Loading weather';
  elements.time.textContent = 'Loading local time…';
  elements.time.removeAttribute('datetime');
  elements.heroIconUse.setAttribute('href', '#icon-cloud');
  elements.temperatureValue.textContent = '…';
  elements.temperatureScreenReader.textContent = 'Loading temperature';
  elements.summary.textContent = 'Loading current conditions…';
  elements.summary.dataset.state = 'loading';
  elements.feels.textContent = 'Feels like …';
  setMetrics(elements, {
    humidity: '—',
    visibility: '—',
    wind: '—',
    feelsLike: '—',
  });
}

/**
 * Render normalized current weather into the existing dashboard components.
 *
 * @param {object} city Selected city from shared state.
 * @param {object} weather Normalized current weather from the API layer.
 */
export function renderCurrentWeather(city, weather) {
  const elements = getDashboardElements();
  const condition = getWeatherCondition(weather?.weatherCode);
  const temperature = formatDegreesNumber(weather?.temperature);
  const feelsLike = formatDegrees(weather?.feelsLike);

  setCityHeading(elements, city);

  elements.card.removeAttribute('aria-busy');
  elements.eyebrow.textContent = 'Current weather';
  elements.time.textContent = formatLocalDateTime(weather?.time);
  elements.time.dateTime = String(weather?.time || '');
  elements.heroIconUse.setAttribute('href', `#${condition.icon}`);
  elements.temperatureValue.textContent = temperature === '—' ? '—' : temperature.replace('°C', '');
  elements.temperatureScreenReader.textContent = temperature === '—'
    ? 'Temperature unavailable'
    : `${temperature.replace('°C', '')} degrees Celsius`;
  elements.summary.textContent = condition.description;
  elements.summary.dataset.state = '';
  elements.feels.textContent = `Feels like ${feelsLike}`;
  setMetrics(elements, {
    humidity: formatPercent(weather?.humidity),
    visibility: formatVisibility(weather?.visibility, weather?.units?.visibility),
    wind: formatSpeed(weather?.windSpeed),
    feelsLike,
  });
}

/**
 * Show a clear in-place error while keeping the selected city visible.
 *
 * @param {object} city Selected city from shared state.
 */
export function showWeatherError(city) {
  const elements = getDashboardElements();
  setCityHeading(elements, city);

  elements.card.removeAttribute('aria-busy');
  elements.eyebrow.textContent = 'Current weather';
  elements.time.textContent = 'Local time unavailable';
  elements.time.removeAttribute('datetime');
  elements.heroIconUse.setAttribute('href', '#icon-cloud');
  elements.temperatureValue.textContent = '—';
  elements.temperatureScreenReader.textContent = 'Weather data unavailable';
  elements.summary.textContent = 'Weather data unavailable';
  elements.summary.dataset.state = 'error';
  elements.feels.textContent = 'Try selecting the city again';
  setMetrics(elements, {
    humidity: '—',
    visibility: '—',
    wind: '—',
    feelsLike: '—',
  });
}

/**
 * Show loading placeholders in the existing five forecast rows.
 */
export function showForecastLoading() {
  const { list, rows } = getForecastElements();
  list.setAttribute('aria-busy', 'true');
  list.dataset.state = 'loading';
  rows.forEach((row) => writeForecastRow(row, null, 'loading'));
}

/**
 * Render normalized daily forecast entries into the existing five rows.
 * Missing entries or fields become graceful placeholders.
 *
 * @param {object[]} forecastDays Normalized daily forecast from the API layer.
 */
export function renderDailyForecast(forecastDays) {
  const { list, rows } = getForecastElements();
  const days = Array.isArray(forecastDays) ? forecastDays.slice(0, FORECAST_DAYS) : [];

  list.removeAttribute('aria-busy');
  list.dataset.state = '';
  rows.forEach((row, index) => writeForecastRow(row, days[index] || null, 'ready'));
}

/**
 * Show a clear forecast error while preserving the five-row structure.
 */
export function showForecastError() {
  const { list, rows } = getForecastElements();
  list.removeAttribute('aria-busy');
  list.dataset.state = 'error';
  rows.forEach((row) => writeForecastRow(row, null, 'error'));
}

function getForecastElements() {
  const list = document.querySelector('#dashboard-view .forecast-list');
  const rows = Array.from(list.querySelectorAll('.forecast-row'));
  const template = rows[0];

  while (rows.length < FORECAST_DAYS) {
    const row = template ? template.cloneNode(true) : createForecastRow();
    list.append(row);
    rows.push(row);
  }

  rows.slice(FORECAST_DAYS).forEach((row) => row.remove());
  return { list, rows: rows.slice(0, FORECAST_DAYS) };
}

function createForecastRow() {
  const row = document.createElement('li');
  row.className = 'forecast-row';
  row.innerHTML = `
    <p class="forecast-row__day"><time></time></p>
    <span class="forecast-row__condition">
      <svg class="icon" aria-hidden="true" focusable="false" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <use href="#icon-cloud"></use>
      </svg>
      <span class="sr-only">Forecast unavailable</span>
    </span>
    <p class="forecast-temp">
      <span class="forecast-temp__label" aria-hidden="true">H</span>
      <span class="sr-only">High</span>
      <span>—</span>
    </p>
    <p class="forecast-temp">
      <span class="forecast-temp__label" aria-hidden="true">L</span>
      <span class="sr-only">Low</span>
      <span>—</span>
    </p>
  `;
  return row;
}

function writeForecastRow(row, day, state) {
  const time = row.querySelector('.forecast-row__day time');
  const iconUse = row.querySelector('.forecast-row__condition use');
  const conditionLabel = row.querySelector('.forecast-row__condition .sr-only');
  const temperatureValues = Array.from(row.querySelectorAll('.forecast-temp'))
    .map((element) => element.lastElementChild);
  const [highValue, lowValue] = temperatureValues;

  if (state === 'loading') {
    time.removeAttribute('datetime');
    time.textContent = '…';
    iconUse.setAttribute('href', '#icon-cloud');
    conditionLabel.textContent = 'Loading forecast';
    if (highValue) highValue.textContent = '…';
    if (lowValue) lowValue.textContent = '…';
    return;
  }

  if (state === 'error' || !day?.date) {
    time.removeAttribute('datetime');
    time.textContent = '—';
    iconUse.setAttribute('href', '#icon-cloud');
    conditionLabel.textContent = 'Forecast unavailable';
    if (highValue) highValue.textContent = '—';
    if (lowValue) lowValue.textContent = '—';
    return;
  }

  const weekday = formatForecastWeekday(day.date);
  const condition = getWeatherCondition(day.weatherCode);
  time.dateTime = day.date;
  time.textContent = weekday || day.date;
  iconUse.setAttribute('href', `#${condition.icon}`);
  conditionLabel.textContent = condition.description;
  if (highValue) highValue.textContent = formatDegrees(day.high);
  if (lowValue) lowValue.textContent = formatDegrees(day.low);
}

function getDashboardElements() {
  const card = document.querySelector('#dashboard-view .current-weather');
  const metricCards = new Map(
    Array.from(document.querySelectorAll('#dashboard-view .metric-card')).map((cardElement) => [
      cardElement.querySelector('dt')?.textContent.trim(),
      cardElement.querySelector('dd'),
    ]),
  );

  return {
    card,
    eyebrow: card.querySelector('.eyebrow'),
    city: document.getElementById('current-city'),
    title: document.getElementById('dashboard-title'),
    time: card.querySelector('.current-weather__date time'),
    heroIconUse: card.querySelector('.weather-icon--hero use'),
    temperatureValue: card.querySelector('.temperature-value'),
    temperatureScreenReader: card.querySelector('.current-weather__temperature .sr-only'),
    summary: card.querySelector('.current-weather__summary'),
    feels: card.querySelector('.current-weather__feels'),
    metrics: {
      humidity: metricCards.get('Humidity'),
      visibility: metricCards.get('Visibility'),
      wind: metricCards.get('Wind'),
      feelsLike: metricCards.get('Feels like'),
    },
  };
}

function setCityHeading(elements, city) {
  const label = [city?.name, city?.country].filter(Boolean).join(', ');
  elements.city.textContent = label;
  elements.title.textContent = `Current weather in ${label}`;
}

function setMetrics(elements, values) {
  Object.entries(values).forEach(([key, value]) => {
    const element = elements.metrics[key];
    if (element) {
      element.textContent = value;
    }
  });
}

function formatDegreesNumber(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°C` : '—';
}

function formatDegrees(value) {
  return formatDegreesNumber(value);
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : '—';
}

function formatSpeed(value) {
  return Number.isFinite(value) ? `${Math.round(value)} km/h` : '—';
}

function formatVisibility(value, unit) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  const kilometres = String(unit || '').toLowerCase() === 'km' ? value : value / 1000;
  const rounded = kilometres >= 10 ? Math.round(kilometres) : Math.round(kilometres * 10) / 10;
  return `${rounded} km`;
}
