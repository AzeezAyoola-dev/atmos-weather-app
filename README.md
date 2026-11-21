# Atmos

> A clearer view of the weather. Wherever you are.

Atmos is a responsive weather web application built with HTML5, CSS3 and
vanilla JavaScript. It uses the Open-Meteo Geocoding API for city search and
the Open-Meteo Forecast API for current conditions.

## Status

**Phase 6 — current weather integration.** Selecting a city in Search Locations
now returns to the Weather Dashboard and fetches current conditions from the
Open-Meteo Forecast API using the selected city's latitude, longitude and
timezone. The dashboard city, country, local date/time, temperature, condition
icon and description, feels-like temperature, humidity, wind speed and available
visibility are updated in place, with loading and error feedback.

The five-day forecast remains a static sample. Recent-search persistence and
deployment are reserved for later phases.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Open-Meteo Geocoding API
- Open-Meteo Forecast API for current conditions
- Browser `fetch` and `AbortController`

No frameworks, no backend and no package dependencies. `localStorage` is
reserved for a later phase and is not used in Phase 6.

## Project structure

```text
ATMOS/
├── index.html
├── css/
│   ├── variables.css      Existing design tokens
│   └── style.css          Shell and screen styles
├── js/
│   ├── app.js             Entry point, view switching and orchestration
│   ├── api.js             Open-Meteo geocoding and current-weather requests
│   ├── weather.js         Weather codes, formatting and dashboard rendering
│   ├── search.js          Validation, debounce, rendering and selection
│   ├── state.js           Shared in-memory selected-city state
│   └── storage.js         Recent-search storage contract
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
  and `timezone` in `js/state.js`. Nothing is persisted yet.

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
- The five-day forecast is not API-driven yet; its rows remain the approved
  static sample.

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
