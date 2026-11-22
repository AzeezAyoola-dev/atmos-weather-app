# Atmos

> A clearer view of the weather. Wherever you are.

Atmos is a responsive weather web application built with HTML5, CSS3 and
vanilla JavaScript. It uses the Open-Meteo Geocoding API for city search and
the Open-Meteo Forecast API for current conditions and the five-day forecast.

## Status

**Phase 8 — recent searches and LocalStorage.** Selecting a city from search
results or recent history now saves it to a persistent, ordered recent-search
list. The Search Locations chips are rendered from that list instead of static
placeholders, and selecting a chip returns directly to that city's weather
dashboard. Deployment remains reserved for a later phase.

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
│   ├── state.js           Shared in-memory selected-city state
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
