# Atmos

> A clearer view of the weather. Wherever you are.

Atmos is a responsive weather web application built with HTML5, CSS3 and
vanilla JavaScript. It uses the Open-Meteo Geocoding API for city search and
the Open-Meteo Forecast API for current conditions and the five-day forecast.

## Status

**Phase 9 — loading, empty, invalid and error states.** HOME always keeps
Lagos, Nigeria and now has loading, friendly failure and retry states. Search
handles empty input, one-character input, loading, no results, API/network
failure with retry and an empty recent-search list. SELECTED WEATHER keeps its
chosen city during loading, failure and retry, and shows a forecast-specific
fallback when only the forecast request fails. The three-screen navigation,
independent HOME/SELECTED state, recent searches and approved design are
preserved. Deployment remains reserved for a later phase.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Open-Meteo Geocoding API
- Open-Meteo Forecast API for current conditions and five-day forecast
- Browser `fetch`, `AbortController` and `localStorage`

No frameworks, no backend and no package dependencies. Recent searches are
persisted with `localStorage` under `atmos.recentCities.v1`.

## Project structure

```text
ATMOS/
├── index.html
├── css/
│   ├── variables.css      Existing design tokens
│   └── style.css          Shell and screen styles
├── js/
│   ├── app.js             Entry point, view switching and orchestration
│   ├── api.js             Open-Meteo geocoding, current and daily requests
│   ├── weather.js         Weather codes, formatting and dashboard rendering
│   ├── search.js          Validation, debounce, rendering and selection
│   ├── state.js           Independent HOME/SELECTED state and error slices
│   └── storage.js         Recent-search persistence and validation
├── assets/
├── design/                Existing tokens and screenshots
├── documentation/         Existing PRD
└── README.md
```

## Design source

The approved Figma screenshots in `design/screenshots/` are the visual source
of truth. The **warm palette** from those screenshots is authoritative.

- PRD: `documentation/ATMOS-PRD.md`
- Design tokens: `design/design-tokens.tokens (2).json`
- CSS tokens: `css/variables.css`
- Screenshots: `design/screenshots/`

## Phase 1 decisions

- Warm palette from the screenshots.
- Centred, responsive desktop shell that preserves the mobile composition.
- Compact `ATMOS` wordmark.
- Date and time use the selected city's local timezone.
- Five-day forecast is today plus the following four days.
- Inter typography, with a system sans-serif fallback.
- Celsius, wind speed in km/h, and labelled forecast highs and lows.
- Temperature typography: 56px/64px on mobile, 80px/88px on larger screens.

## Phase 5 search behaviour

- Typing in the dashboard search field opens Search Locations.
- Searches start only after at least two non-space characters.
- Requests are debounced by 350ms; newer input cancels pending or in-flight work.
- Results show city names, available administrative regions and country names.
- Loading, no-results and network-error states use the existing hint element and
  are announced through the existing live region.
- Selecting a result stores `name`, `region`, `country`, `latitude`, `longitude`
  and `timezone` in `js/state.js`. Recent-search persistence is handled
  separately in Phase 8.

## Phase 6 current weather behaviour

- Selecting a result returns to the dashboard and loads current weather.
- Requests use the selected city's coordinates and timezone, with Celsius
  temperatures and km/h wind speed requested explicitly.
- The city heading, country, local date/time, temperature, WMO condition icon
  and description, feels-like value, humidity, wind speed and visibility are
  updated from the API response.
- Visibility is converted from metres to kilometres when the API reports metres.
- Loading and API/network errors are shown in the existing dashboard components
  and announced through the existing live region.

## Phase 7 five-day forecast behaviour

- A separate daily request asks for `weather_code`, `temperature_2m_max` and
  `temperature_2m_min`, with `forecast_days=5` and the selected city's
  coordinates and timezone.
- The five existing forecast rows are reused: weekday labels come from the
  API's local dates, WMO codes drive the existing icon and condition text, and
  high/low temperatures are rendered in Celsius.
- The first row is the selected city's local today, followed by the next four
  days. Weekday labels are derived without applying the browser's timezone.
- Missing or incomplete daily entries become `—` placeholders while the
  five-row structure is preserved.
- Forecast loading and errors use the existing rows and are announced through
  the live region without preventing the current weather from rendering.

## Phase 8 recent-search behaviour

- Selecting a city from search results saves it only after a successful
  selection.
- Each saved city stores `name`, `country`, `latitude`, `longitude` and
  `timezone` under the `atmos.recentCities.v1` LocalStorage key.
- The five most recent unique cities are shown newest first; reselecting a city
  moves it to the front rather than creating a duplicate.
- Recent chips are loaded on startup, rendered in the existing chip list, and
  selectable without running another geocoding search.
- Malformed stored data, empty storage and unavailable LocalStorage are handled
  without errors; a valid in-memory list is retained for the current session.
- The hardcoded Lagos, Abuja and Ibadan chips are no longer part of the app
  markup.

## Phase 9 state behaviour

- HOME uses a fixed Lagos location. Loading, current-weather failure,
  forecast-only failure and retry can never replace it with a searched city.
- Search uses the existing hint element for its prompt, two-character hint,
  searching feedback, no-results message and network/API error. Failed searches
  expose a retry action; successful searches hide it.
- An empty recent-search list shows a helpful message instead of fake sample
  cities. Existing recent chips, ordering and persistence are unchanged.
- SELECTED WEATHER renders from its own city/weather slice. Current weather and
  forecast failures are tracked separately, so a forecast-only failure keeps
  valid current weather visible and offers a forecast-only retry.
- Weather retries reload the active screen's own state. Forecast retries fetch
  only the daily forecast, preserving current weather and the selected city.
- Retry buttons reuse existing warm-palette surfaces and tokens, have 44px
  minimum hit targets, and keep the global visible focus style.
- Stale responses are guarded so a result for a previous city cannot overwrite
  the current selection.
- Navigation remains `HOME → SEARCH → SELECTED WEATHER` forwards and
  `SELECTED WEATHER → SEARCH → HOME` backwards. Search query, results and
  selected-row state are restored when returning from SELECTED WEATHER.

### Verification

- Phase 9 browser suite: **294/294 checks passed** at 320px, 375px, 390px and
  1440px, covering slow networks, failed geocoding, invalid/no-result
  searches, HOME current and forecast failures, selected-city current and
  forecast failures, all retry paths, empty recents, refresh, navigation, and
  per-day forecast icons on both weather screens.
- Regressions: Phase 5 **45/45**, Phase 6 **56/56**, Phase 7 **58/58**,
  Phase 8 **37/37**, state separation **164/164**, forecast icons **129/129**.
- JavaScript module syntax checks and `git diff --check` pass.

### Remaining limitations

- Weather and recent-search data are still in-memory or LocalStorage only;
  there is no offline cache or service worker, so a refresh requires a working
  connection to repopulate weather.
- Error and loading states are intentionally session-local and are not
  persisted across refresh. A refresh returns to HOME with Lagos.
- Open-Meteo rate limits and upstream outages remain outside the app's control;
  the app reports them and offers retry rather than caching stale forecasts.
- City search still requires at least two characters and relies on the
  geocoding provider's available names and spelling.

## Accessibility note

The approved warm secondary text colour `#85847D` measures 3.72:1 on the
`#FFFEFA` surface. For normal-size text, `--app-text-secondary` uses `#6D6C64`
instead, which measures 5.23:1 on `#FFFEFA` and 4.64:1 on `#F3F0E9`. Phase 2
added `--app-accent-strong: #A97A2F` for forecast icons on light surfaces
(3.78:1 on `#FFFEFA`). No other approved colours have changed.

## Local development

Because the app uses ES modules, serve it over HTTP rather than opening
`index.html` directly with `file://`. A local static server such as the VS Code
Live Server extension is sufficient.

## Scope

Atmos is a client-side application. There is no backend, no framework and no
build step.
